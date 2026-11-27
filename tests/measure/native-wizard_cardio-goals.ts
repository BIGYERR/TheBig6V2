// native-wizard: today's cardio goals step, by taps, before the Expo app draws it (MIGRATION.md phase 3, row 6, the
// second of two sessions). Read-only (measure). tests/measure/native-wizard_today.md is the before-picture of the whole
// wizard, drawn from drafts set whole; this adds what the cardio goals step still needs, walked by the page's own
// handlers: every handler run here is read out of the markup the page wrote (an onclick, an oninput), never typed in.
//
// A. Every goal's form, by path: its fields, its buttons, its lines as the goal is first picked.
// B. Every number field: what a typed value writes, which lines its handler repaints, and which lines it leaves stale.
// C. The race date by taps: the buttons, a day picked, the card under it, each kind counted.
// D. The shorter plan link.
// E. The seed offer.
// F. The name step and Generate after the cardio goals: the start a race sets, the pop-up, the refusals, what is stored.
// G. The ten seeded programs, their cardio goals walked by taps.
// H. Kinds the first measure drew from drafts set whole that no walk here reaches.
//
// Usage: cd tests && node --no-warnings --import ./measure/native-deck-popups_resolve.mjs measure/native-wizard_cardio-goals.ts
//        (writes tests/measure/native-wizard_cardio-goals.md)
process.env['TZ'] = 'America/New_York';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { REPO } from '../support/app.ts';
import { PROGRAMS } from '../support/programs.ts';
import { Phone } from '../support/stored-state.ts';
import { runsLife } from '../support/native-progress.ts';

const out: string[] = [];
const NOW = '2026-08-29T09:00:00';   // a Saturday, the day the seeded walks are made on
const TODAY = NOW.slice(0, 10);
const say = (s = ''): void => { out.push(s); };
const J = JSON.stringify;
type Tally = Record<string, number>;
const bump = (T: Tally, k: string, n = 1): void => { T[k] = (T[k] || 0) + n; };
const table = (T: Tally, head: string, of = 'Count'): void => {
  say('| ' + head + ' | ' + of + ' |'); say('|---|---|');
  for (const k of Object.keys(T).sort()) say('| ' + k + ' | ' + T[k] + ' |');
  say();
};
const txt = (h: unknown): string => String(h || '').replace(/<svg[\s\S]*?<\/svg>/g, '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
const plusDays = (iso: string, n: number): string => {
  const d = new Date(iso.slice(0, 10) + 'T12:00:00'); d.setDate(d.getDate() + n);
  const p = (x: number): string => String(x).padStart(2, '0');
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
};
const N = (s: string): string => s.replace(/\d+(?::\d+)?(?:\.\d+)?/g, 'N');

// ── The kinds (the first measure's names) ────────────────────────────────────
const feedbackKind = (h: string | null): string => {
  if (h === null) return 'no card on the step';
  const t = txt(h), color = (/color:(var\(--[\w-]+\))/.exec(h) || [])[1] || '';
  if (!t) return 'card empty';
  const hue = ' [' + color.replace('var(--', '').replace(')', '') + ']';
  if (/already passed/.test(t)) return 'the date has passed' + hue;
  if (/Less than a week away/.test(t)) return 'less than a week away' + hue;
  if (/The program ends on it/.test(t)) return 'test in week 2 or later' + (/In \d+ weeks? that reaches/.test(t) ? ', with the reach sentence' : '') + hue;
  if (/Your test is in week 1\. Nothing is left/.test(t)) return 'test in week 1, nothing left to train' + (/that reaches/.test(t) ? ', with the reach sentence' : '') + hue;
  if (/Your test is this week/.test(t)) return 'test this week' + (/that reaches/.test(t) ? ', with the reach sentence' : '') + hue;
  if (/before your first training day/.test(t)) return 'test before the first training day' + hue;
  if (/The test block is/.test(t)) return 'test past the test block' + hue;
  if (/so it peaks on race week/.test(t)) return 'race plan starts later' + hue;
  if (/You open in/.test(t)) return 'race plan opens in a week' + (/are behind you/.test(t) ? ', weeks behind' : '') + (/I don’t recommend under/.test(t) ? ', under the floor' : '') + (/fits this window better/.test(t) ? ', the shorter plan offered' : '') + hue;
  if (/before race day\. Use the extra time/.test(t)) return 'finishes before race day' + hue;
  if (/Perfect timing/.test(t)) return 'peaks on race day' + hue;
  if (/is short for this goal/.test(t)) return 'short for this goal' + hue;
  return 'UNNAMED: ' + t.slice(0, 60);
};
const progLenKind = (h: string | null): string => {
  if (h === null) return 'no length line';
  const t = txt(h);
  return /your mile time sets it/.test(t) ? 'your mile time sets it' : (/Your test sets it/.test(t) ? 'the test sets it' : /Set by your longest/.test(t) ? 'set by the longest goal' : 'UNNAMED ' + t) + (/: 1 week\./.test(t) ? ' (1 week)' : '');
};
const feasKind = (h: string | null): string => (h === null ? 'no frame on the step' : !h ? 'frame hidden' : /Your mile is/.test(h) ? 'frame: from the mile entered' : /You have not entered a mile time/.test(h) ? 'frame: from the level default' : 'UNNAMED ' + txt(h).slice(0, 50));
const mileAdvKind = (t: string | null): string => (t === null ? 'no mile field' : !t ? 'none' : /^Required/.test(t) ? 'required' : /not a real time/.test(t) ? 'not a real time' : /Under 3:00/.test(t) ? 'under 3:00' : /Over 25:00/.test(t) ? 'over 25:00' : /fastest row/.test(t) ? 'the chart\'s fastest row' : /12:00 row/.test(t) ? 'the chart\'s slowest row' : 'UNNAMED ' + t);
const mileHelpKind = (t: string | null): string => (t === null ? 'no mile field' : /^Required/.test(t) ? 'required' : t === 'Optional.' ? 'optional, bare' : /come from an /.test(t) ? 'optional, an N mile' : /come from a /.test(t) ? 'optional, a N mile' : 'UNNAMED ' + t);
const swimAdvKind = (t: string | null): string => (t === null ? 'no swim times' : !t ? 'none' : /timed 500/.test(t) ? 'required, the 500' : /timed 100/.test(t) ? 'required, the 100' : /not a real time/.test(t) ? 'not a real time' : /faster than your 100/.test(t) ? '500 pace faster than the 100' : 'UNNAMED ' + t);
const alignedKind = (t0: string): string => { const t = txt(t0); return (/so it peaks on race week/.test(t) ? 'starts later' : 'opens in a week' + (/are behind you/.test(t) ? ', weeks behind' : '')) + (/I don’t recommend under/.test(t) ? ', under the floor' : '') + (/fits this window better/.test(t0) ? ', the shorter plan link' : ''); };
const resolveKind = (t: string): string => (/That week holds your test/.test(t) ? 'the week holds the test' : /Nothing left to train that week/.test(t) ? 'moved to the next Monday' : /Week 1 is short/.test(t) ? 'a short first week' : /^Week 1 runs/.test(t) ? 'a whole first week' : 'UNNAMED ' + t);

// ── The page, tapped ─────────────────────────────────────────────────────────
/** The lines the page repaints in place, and the race date's field: on the page only while the step's markup holds them. */
const IN_BODY = ['raceDateInput', 'raceDateFeedback', 'paceFeasLine', 'paceDisplayLine', 'progLenLine', 'swimPaceLine', 'mileAdvisory', 'swimAdvisory', 'startResolve', 'sumStartDate', 'wizStartDate'];
const LINES = ['progLenLine', 'paceDisplayLine', 'paceFeasLine', 'raceDateFeedback', 'swimPaceLine', 'mileAdvisory', 'swimAdvisory'];
const AS_TEXT = new Set(['mileAdvisory', 'swimAdvisory', 'sumStartDate']);
interface Field { tag: string; oninput: string; sport: string; key: string; placeholder: string; min: string; max: string; step: string; value: string }

class Wiz {
  readonly P: Phone;
  overlays: { innerHTML: string }[] = [];
  private base: (id: string) => any;
  constructor(P: Phone) {
    this.P = P;
    const doc = P.IA.window['document'];
    const base = this.base = doc.getElementById;
    P.IA.ctx['__renders'] = 0;
    P.ev('renderWizardStep=(function(o){return function(){__renders++;return o.apply(this,arguments);};})(renderWizardStep)');
    let seen = -1;
    // Each draw of the step replaces these elements, as a real page does: their text, display and value are the markup's
    // until the page writes to one in place.
    doc.getElementById = (id: string) => {
      if (!IN_BODY.includes(id)) return base(id);
      const body = String(base('wizardBody').innerHTML || '');
      const n: number = P.ev('__renders');
      if (n !== seen) {
        seen = n;
        for (const x of IN_BODY) {
          const m = new RegExp('<(\\w+)[^>]*\\bid="' + x + '"[^>]*>').exec(body);
          if (!m) continue;
          const el = base(x), tag = m[0];
          const val = /\bvalue="([^"]*)"/.exec(tag); if (val) el.value = val[1];
          const disp = /display:\s*(\w+)/.exec(tag); el.style.display = disp ? disp[1] : '';
          if (m[1] !== 'input') {
            const rest = body.slice(m.index + tag.length), inner = rest.slice(0, rest.indexOf('</' + m[1] + '>'));
            el.innerHTML = inner; el.textContent = inner.replace(/<[^>]+>/g, '');
          }
        }
      }
      return new RegExp('\\bid="' + id + '"').test(body) ? base(id) : null;
    };
    const add = doc.body.appendChild;
    doc.body.appendChild = (x: { innerHTML: string }) => { this.overlays.push(x); return add.call(doc.body, x); };
  }
  get body(): string { return String(this.base('wizardBody').innerHTML || ''); }
  get draft(): any { return JSON.parse(this.P.ev('JSON.stringify(WD)')); }
  get step(): string { return ['primary', 'profile', 'equipment', 'cardio_goal', 'lifting_focus', 'days', 'name'][this.P.ev('wizardStep') as number]!; }
  has(id: string): boolean { return new RegExp('\\bid="' + id + '"').test(this.body); }
  /** A line as the page shows it now: null when the step does not hold it, '' when it is hidden. */
  line(id: string): string | null {
    if (!this.has(id)) return null;
    const el = this.P.IA.window['document'].getElementById(id);
    if (el.style.display === 'none') return '';
    return String(AS_TEXT.has(id) ? el.textContent : el.innerHTML);
  }
  lines(): Record<string, string | null> { return Object.fromEntries(LINES.map((id) => [id, this.line(id)])); }
  /** Every handler of one kind the markup holds (the step's, and the card's under the race date), in order. */
  handlers(attr: string): string[] {
    const src = this.body + (this.has('raceDateFeedback') ? String(this.P.IA.window['document'].getElementById('raceDateFeedback').innerHTML) : '');
    return [...src.matchAll(new RegExp('\\b' + attr + '="([^"]*)"', 'g'))].map((m) => m[1]!);
  }
  /** A tap on the one control whose onclick holds `part`. */
  tap(part: string): void {
    const hits = this.handlers('onclick').filter((h) => h.includes(part));
    if (hits.length !== 1) throw new Error('tap "' + part + '": ' + hits.length + ' controls on ' + this.step);
    this.P.ev(hits[0]!);
  }
  can(part: string): boolean { return this.handlers('onclick').some((h) => h.includes(part)); }
  fields(): Field[] {
    return [...this.body.matchAll(/<input type="number"[^>]*>/g)].map((m) => {
      const tag = m[0], a = (n: string): string => (new RegExp('\\b' + n + '="([^"]*)"').exec(tag) || [])[1] || '';
      const oninput = a('oninput'), w = /cardioGoals\['(\w+)'\]\.(\w+)=this\.value/.exec(oninput);
      return { tag, oninput, sport: w ? w[1]! : '', key: w ? w[2]! : (/readonly/.test(tag) ? '(read only)' : '?'), placeholder: a('placeholder'), min: a('min'), max: a('max'), step: a('step'), value: a('value') };
    });
  }
  /** A value typed into a number field: its own oninput, with the field's value. */
  type(sport: string, key: string, v: string): void {
    const f = this.fields().filter((x) => x.sport === sport && x.key === key);
    if (f.length !== 1) throw new Error('field ' + sport + '.' + key + ': ' + f.length + ' on the step');
    this.P.IA.ctx['__v'] = v;
    this.P.ev('(function(){' + f[0]!.oninput + '}).call({value:__v})');
  }
  /** A day handed back by the race date's field. */
  raceDay(v: string): void {
    const m = /<input type="date" id="raceDateInput"[^>]*>/.exec(this.body);
    if (!m) throw new Error('no race date field on the step');
    const oninput = (/\boninput="([^"]*)"/.exec(m[0]) || [])[1]!;
    this.P.IA.ctx['__v'] = v;
    this.P.ev('(function(){var e=document.getElementById("raceDateInput");e.value=__v;(function(){' + oninput + '}).call(e);})()');
  }
  next(): void { this.P.ev('wizardNext()'); }
  back(): void { this.P.ev('wizardBack()'); }
  /** Build New Program, a path, then Continue to the cardio goals. */
  static open(path: string, more: { experience?: string; age?: string } = {}, P?: Phone): Wiz {
    const w = new Wiz(P || fresh());
    w.P.ev('startWizard()');
    w.tap("WD.primaryPath='" + path + "'");
    w.next();
    if (more.experience) w.tap("WD.experience='" + more.experience + "'");
    if (more.age) w.tap("WD.ageBracket='" + more.age + "'");
    w.next(); w.next();
    if (w.step !== 'cardio_goal') throw new Error('not on the cardio goals: ' + w.step);
    return w;
  }
  goals(sport: string): { id: string; label: string }[] {
    return [...this.body.matchAll(/onclick="setCardioGoal\('(\w+)','(\w+)'\)">\s*<div class="goal-option-label">([^<]*)</g)].filter((m) => m[1] === sport).map((m) => ({ id: m[2]!, label: m[3]! }));
  }
  mileHelp(): string | null { const m = /Current mile time <span[^>]*>([\s\S]*?)<\/span>/.exec(this.body); return m ? txt(m[1]) : null; }
  seed(): string { return /Seed from/.test(this.body) ? 'the offer' : /Estimated from/.test(this.body) ? 'applied line' : 'none'; }
}
const fresh = (at = NOW): Phone => { const P = new Phone().launch(at); P.settle(); return P; };
const SPORTS = ['run', 'bike', 'swim'];
const stored = (P: Phone): string => J(P.dump());

// ── A. Every goal's form ─────────────────────────────────────────────────────
say('# Today\'s cardio goals step, by taps (measure, before the Expo app draws it)');
say();
say('Written by `cd tests && node --no-warnings --import ./measure/native-deck-popups_resolve.mjs measure/native-wizard_cardio-goals.ts` (read-only). Zone America/New_York; the phone\'s day is Saturday ' + TODAY + '. `tests/measure/native-wizard_today.md` is the before-picture of the whole wizard, from drafts set whole. Every handler run here is read out of the markup the page wrote: an `onclick`, an `oninput`.');
say();
say('## A. Every goal\'s form');
say();
const formKind = (w: Wiz, sport: string): string => {
  const keys = w.fields().filter((f) => f.sport === sport || f.key === '(read only)').map((f) => f.key);
  return keys.includes('base500Mins') ? 'swim 100 (the 500 row too)' : keys.includes('(read only)') ? 'swim 500' : keys.includes('targetDist') ? 'run pace goal' : 'baseline, ' + sport;
};
const CATALOG: Record<string, { sport: string; id: string; label: string }[]> = {};
const A_KINDS: Tally = {};
let goalTaps = 0;
for (const path of ['event', 'both']) {
  const w = Wiz.open(path);
  const before = stored(w.P);
  CATALOG[path] = [];
  say('**The ' + (path === 'event' ? 'race' : 'hybrid') + ' path.** The draft as the step first draws: ' + J((({ cardioTypes, cardioGoals, eventTargeted, raceDate, raceDateWeeks }) => ({ cardioTypes, cardioGoals, eventTargeted, raceDate, raceDateWeeks }))(w.draft)) + '; number fields ' + w.fields().length + ', goal options ' + SPORTS.reduce((n, s) => n + w.goals(s).length, 0) + ', box under the cards ' + (w.has('progLenLine') ? 'drawn' : 'not drawn') + '.');
  say();
  say('| Sport | Goal | Form | Number fields (key, placeholder, min, max, step) | Buttons | Mile help | Mile advisory | Swim advisory | Length line | Card under the date | Pace reach |');
  say('|---|---|---|---|---|---|---|---|---|---|---|');
  for (const sport of SPORTS) {
    w.tap("toggleCardioTypeSport('" + sport + "')");
    const gs = w.goals(sport);
    for (const g of gs) {
      CATALOG[path]!.push({ sport, ...g });
      w.tap("setCardioGoal('" + sport + "','" + g.id + "')"); goalTaps++;
      const fs = w.fields();
      const btn = [w.can("setSwimUnit('yd')") ? 'yd, m' : '', w.can("setPaceUnit('mi')") ? 'mi, km' : '', w.seed() !== 'none' ? 'seed: ' + w.seed() : ''].filter(Boolean).join('; ') || 'none';
      const L = w.lines();
      const kinds = { form: formKind(w, sport), help: mileHelpKind(w.mileHelp()), madv: mileAdvKind(L['mileAdvisory']!), sadv: swimAdvKind(L['swimAdvisory']!), len: progLenKind(L['progLenLine']!), card: feedbackKind(L['raceDateFeedback']!), feas: feasKind(L['paceFeasLine']!) };
      bump(A_KINDS, 'form: ' + kinds.form); bump(A_KINDS, 'number fields', fs.length); bump(A_KINDS, 'mile help: ' + kinds.help); bump(A_KINDS, 'mile advisory: ' + kinds.madv); bump(A_KINDS, 'swim advisory: ' + kinds.sadv);
      bump(A_KINDS, 'length line: ' + kinds.len); bump(A_KINDS, 'card under the date: ' + kinds.card); bump(A_KINDS, 'pace reach: ' + kinds.feas);
      say('| ' + sport + ' | ' + g.label + ' (`' + g.id + '`) | ' + kinds.form + ' | ' + fs.map((f) => '`' + f.key + '` "' + f.placeholder + '" ' + (f.min || '–') + '/' + (f.max || '–') + '/' + (f.step || '–')).join('; ') + ' | ' + btn + ' | ' + kinds.help + ' | ' + kinds.madv + ' | ' + kinds.sadv + ' | ' + kinds.len + ' | ' + kinds.card + ' | ' + kinds.feas + ' |');
    }
    w.tap("toggleCardioTypeSport('" + sport + "')");
  }
  say();
  say('- Goals offered: ' + SPORTS.map((s) => s + ' ' + CATALOG[path]!.filter((g) => g.sport === s).length).join(', ') + ' (' + CATALOG[path]!.length + '). Stored by all of it: ' + (stored(w.P) === before ? 'nothing' : 'SOMETHING') + '.');
  say('- The race date block: ' + (path === 'event' ? 'drawn once a sport is open and a goal is held' : 'never drawn on this path') + '.');
  say();
}
const onlyEvent = CATALOG['event']!.filter((g) => !CATALOG['both']!.some((h) => h.id === g.id)).map((g) => g.label);
say('- The hybrid path offers every goal of the race path but ' + onlyEvent.length + ': ' + onlyEvent.join(', ') + '.');
say('- Each goal picked alone, ' + goalTaps + ' picks over the two paths, each kind its first draw holds:');
say();
table(A_KINDS, 'Kind, as a goal is first picked');

// A goal picked over another: what the draft keeps.
{
  const w = Wiz.open('event');
  w.tap("toggleCardioTypeSport('run')"); w.tap("setCardioGoal('run','run_pace_goal')");
  w.type('run', 'targetDist', '1.5'); w.type('run', 'targetMins', '12'); w.type('run', 'targetSecs', '30'); w.type('run', 'baselineDist', '2'); w.type('run', 'mileBestMins', '8'); w.type('run', 'mileBestSecs', '15');
  const a = w.draft.cardioGoals.run;
  w.tap("setCardioGoal('run','run_base')");
  const b = w.draft.cardioGoals.run;
  say('- A goal picked over another keeps every field the first one wrote: after the pace goal\'s six fields are typed, Running Base holds ' + Object.keys(b).length + ' of the ' + Object.keys(a).length + ' keys (`' + Object.keys(b).join('`, `') + '`), its `id` and `label` alone changed. The fields its own form shows are filled from them: ' + w.fields().map((f) => '`' + f.key + '` "' + f.value + '"').join(', ') + '.');
  w.tap("toggleCardioTypeSport('run')"); w.tap("toggleCardioTypeSport('run')");
  say('- A sport shut and opened again holds no goal: ' + J(w.draft.cardioGoals) + ', number fields ' + w.fields().length + '.');
  say();
}

// ── B. Every number field ────────────────────────────────────────────────────
say('## B. Every number field: what a typed value writes, and what it leaves stale');
say();
say('Each field of each form is typed into from two states, the form as first picked and the form filled, one value at a time. After each value the draft is read, then every line of the step is read as the page shows it and again after a whole draw of the same draft: a line that differs is one the field\'s handler did not repaint (stale until the next whole draw).');
say();
const VALUES = ['', '0', '1', '3', '5', '9', '12', '25', '30', '59', '60', '99', '1.5', '400'];
const FILL: Record<string, [string, string][]> = {
  'run pace goal': [['targetDist', '1.5'], ['targetMins', '10'], ['targetSecs', '30'], ['baselineDist', '2'], ['mileBestMins', '9'], ['mileBestSecs', '0']],
  'baseline, run': [['baselineDist', '3'], ['mileBestMins', '9'], ['mileBestSecs', '0']],
  'baseline, bike': [['baselineDist', '20']],
  'baseline, swim': [['baselineDist', '400']],
  'swim 500': [['targetMins', '8'], ['targetSecs', '0'], ['baseMins', '10'], ['baseSecs', '30']],
  'swim 100 (the 500 row too)': [['targetMins', '1'], ['targetSecs', '30'], ['baseMins', '1'], ['baseSecs', '50'], ['base500Mins', '10'], ['base500Secs', '30']],
};
const B_WRITES: Record<string, Set<string>> = {}, B_REPAINT: Record<string, Set<string>> = {}, B_STALE: Tally = {}, B_TYPED: Tally = {}, B_KINDS: Tally = {};
let typed = 0, staleTyped = 0, bStored = true;
const diffKeys = (a: any, b: any, pre = ''): string[] => {
  const keys = new Set([...Object.keys(a || {}), ...Object.keys(b || {})]); const o: string[] = [];
  for (const k of keys) { if (J((a || {})[k]) === J((b || {})[k])) continue; if (k === 'cardioGoals') o.push(...diffKeys(a[k] || {}, b[k] || {}, 'goal.')); else if (pre === 'goal.' && typeof (b || {})[k] === 'object' && !Array.isArray(b[k]) && b[k] && !('kind' in b[k])) o.push(...Object.keys({ ...(a[k] || {}), ...b[k] }).filter((x) => J((a[k] || {})[x]) !== J(b[k][x]))); else o.push(pre + k); }
  return o;
};
for (const exp of ['intermediate', 'beginner']) {
  for (const g of CATALOG['event']!) {
    const w = Wiz.open('event', { experience: exp });
    const before = stored(w.P);
    w.tap("toggleCardioTypeSport('" + g.sport + "')"); w.tap("setCardioGoal('" + g.sport + "','" + g.id + "')");
    const form = formKind(w, g.sport);
    if (exp === 'beginner' && g.sport !== 'run') continue;
    for (const state of ['first picked', 'filled']) {
      if (state === 'filled') for (const [k, v] of FILL[form]!) w.type(g.sport, k, v);
      for (const f of w.fields().filter((x) => x.sport)) {
        const was = w.draft.cardioGoals[g.sport][f.key];
        for (const v of VALUES) {
          w.P.ev('renderWizardStep()');
          const d0 = w.draft, l0 = w.lines();
          w.type(g.sport, f.key, v);
          const d1 = w.draft, l1 = w.lines();
          w.P.ev('renderWizardStep()');
          const l2 = w.lines();
          const name = form + ': `' + f.key + '`';
          (B_WRITES[name] ||= new Set()); for (const k of diffKeys(d0, d1)) B_WRITES[name]!.add(k);
          (B_REPAINT[name] ||= new Set()); for (const id of LINES) if (l0[id] !== l1[id]) B_REPAINT[name]!.add(id);
          let st = false;
          for (const id of LINES) if (l1[id] !== l2[id]) { bump(B_STALE, name + ' leaves `' + id + '` stale'); st = true; }
          typed++; bump(B_TYPED, name); if (st) staleTyped++;
          bump(B_KINDS, 'mile advisory: ' + mileAdvKind(l1['mileAdvisory']!)); bump(B_KINDS, 'swim advisory: ' + swimAdvKind(l1['swimAdvisory']!)); bump(B_KINDS, 'length line: ' + progLenKind(l1['progLenLine']!));
          bump(B_KINDS, 'pace reach: ' + feasKind(l1['paceFeasLine']!)); bump(B_KINDS, 'card under the date: ' + feedbackKind(l1['raceDateFeedback']!));
          bump(B_KINDS, 'pace line: ' + (l1['paceDisplayLine'] === null ? 'not on the form' : l1['paceDisplayLine'] ? 'shown' : 'hidden')); bump(B_KINDS, 'swim pace line: ' + (l1['swimPaceLine'] === null ? 'not on the form' : l1['swimPaceLine'] ? 'shown' : 'hidden'));
        }
        w.type(g.sport, f.key, was === undefined ? '' : String(was));
      }
    }
    if (stored(w.P) !== before) bStored = false;
  }
}
say('| Field | Values typed | The draft\'s fields it writes | Lines its handler changed | Lines it left stale (times) |');
say('|---|---|---|---|---|');
for (const name of Object.keys(B_TYPED).sort()) {
  const stale = Object.keys(B_STALE).filter((k) => k.startsWith(name + ' leaves')).map((k) => (/`(\w+)` stale/.exec(k) || [])[1] + ' (' + B_STALE[k] + ')').join(', ') || 'none';
  say('| ' + name + ' | ' + B_TYPED[name] + ' | ' + [...B_WRITES[name]!].sort().join(', ') + ' | ' + ([...B_REPAINT[name]!].sort().join(', ') || 'none') + ' | ' + stale + ' |');
}
say();
say('- ' + typed + ' values typed; ' + staleTyped + ' of them left at least one line stale. Stored by all of it: ' + (bStored ? 'nothing' : 'SOMETHING') + '.');
say('- A value is written as typed, a string, with no clamp: the field\'s `min`, `max` and `step` are on the tag and nothing in the handler reads them.');
say();
table(B_KINDS, 'Kind, after a typed value');

// ── C. The race date by taps ─────────────────────────────────────────────────
say('## C. The race date, by taps');
say();
const OFFSETS = [-3, 0, 1, 3, 6, 7, 8, 10, 14, 21, 28, 35, 42, 49, 56, 63, 70, 77, 84, 112, 119, 126, 140, 210];
const C_CARD: Tally = {}, C_LEN: Tally = {}, C_FEAS: Tally = {}, C_BTN: Tally = {}, D_LINK: Tally = {};
let picks = 0, cStored = true, weeksWritten = 0, linkTaps = 0;
const linkRows: string[] = [];
interface Setup { name: string; exp: string; age?: string; goal: string; sport: string; fill: [string, string][]; start?: string }
const SETUPS: Setup[] = [];
for (const g of CATALOG['event']!) SETUPS.push({ name: g.label, exp: 'intermediate', goal: g.id, sport: g.sport, fill: [] });
SETUPS.push({ name: 'Pace goal, 1.5 mi in 10:30, mile 9:00', exp: 'intermediate', goal: 'run_pace_goal', sport: 'run', fill: FILL['run pace goal']! });
SETUPS.push({ name: 'Pace goal, 1.5 mi in 9:00, mile 9:00 (far)', exp: 'intermediate', goal: 'run_pace_goal', sport: 'run', fill: [['targetDist', '1.5'], ['targetMins', '9'], ['targetSecs', '0'], ['mileBestMins', '9'], ['mileBestSecs', '0']] });
SETUPS.push({ name: 'Pace goal, 1.5 mi in 9:00, beginner, no mile (far)', exp: 'beginner', goal: 'run_pace_goal', sport: 'run', fill: [['targetDist', '1.5'], ['targetMins', '9'], ['targetSecs', '0']] });
SETUPS.push({ name: 'Pace goal, 3 km in 14:00, mile 8:00, age 55+', exp: 'advanced', age: '55+', goal: 'run_pace_goal', sport: 'run', fill: [['targetDist', '3'], ['targetMins', '14'], ['targetSecs', '0'], ['mileBestMins', '8'], ['mileBestSecs', '0']] });
for (const start of [3, 9]) SETUPS.push({ name: 'Pace goal, 1.5 mi in 9:00, mile 9:00, start set ' + start + ' days on', exp: 'intermediate', goal: 'run_pace_goal', sport: 'run', fill: [['targetDist', '1.5'], ['targetMins', '9'], ['targetSecs', '0'], ['mileBestMins', '9'], ['mileBestSecs', '0']], start: plusDays(TODAY, start) });
for (const s of SETUPS) {
  const w = Wiz.open('event', { experience: s.exp, age: s.age });
  const before = stored(w.P);
  w.tap("toggleCardioTypeSport('" + s.sport + "')"); w.tap("setCardioGoal('" + s.sport + "','" + s.goal + "')");
  for (const [k, v] of s.fill) w.type(s.sport, k, v);
  if (/3 km/.test(s.name)) w.tap("setPaceUnit('km')");
  if (s.start) {
    // The start date is the name step's: Continue to it, the field's own onchange, then Back to the cardio goals.
    w.next(); w.next(); w.next();
    const oc = (/id="wizStartDate"[^>]*onchange="([^"]*)"/.exec(w.body) || [])[1]!;
    w.P.IA.ctx['__v'] = s.start; w.P.ev('(function(){' + oc + '}).call({value:__v})');
    w.back(); w.back(); w.back();
  }
  for (const off of OFFSETS) {
    const day = plusDays(TODAY, off);
    w.raceDay(day); picks++;
    const L = w.lines(), d = w.draft;
    if (d.raceDate !== day) throw new Error('the race date was not written');
    if (typeof d.raceDateWeeks === 'number') weeksWritten++;
    const kind = feedbackKind(L['raceDateFeedback']!);
    bump(C_CARD, kind); bump(C_LEN, progLenKind(L['progLenLine']!)); bump(C_FEAS, feasKind(L['paceFeasLine']!));
    // A whole draw after the pick shows the same card (the pick's handler repaints all it owns).
    w.P.ev('renderWizardStep()');
    if (J(w.lines()) !== J(L)) bump(C_BTN, 'A PICK LEFT A LINE STALE');
    if (w.can('offerShorterPlan')) {
      const to = (/offerShorterPlan\('(\w+)'\)/.exec(w.handlers('onclick').find((h) => h.includes('offerShorterPlan'))!) || [])[1]!;
      const t0 = w.P.toasts.length, d0 = w.draft;
      w.tap('offerShorterPlan'); linkTaps++;
      const d1 = w.draft, after = feedbackKind(w.line('raceDateFeedback'));
      bump(D_LINK, s.name + ' → ' + to + ': then ' + after);
      if (linkRows.length < 3 || !linkRows.some((r) => r.includes(s.name))) linkRows.push('| ' + s.name + ' | ' + day + ' (' + off + ' days) | `' + to + '` | ' + diffKeys(d0, d1).join(', ') + ' | ' + J(w.P.toasts.slice(t0)) + ' | ' + after + ' |');
      // Put the goal back, by its own option.
      w.tap("setCardioGoal('" + s.sport + "','" + s.goal + "')");
    }
  }
  // The two buttons.
  w.raceDay(plusDays(TODAY, 70));
  w.tap('WD.eventTargeted=false');
  const off = w.draft;
  bump(C_BTN, 'Just building fitness: raceDate "' + off.raceDate + '", raceDateWeeks ' + off.raceDateWeeks + ', the field ' + (w.has('raceDateInput') ? 'drawn' : 'gone') + ', copy "' + N(txt((/line-height:1\.5">([^<]*)<\/div>\s*<\/div>\s*<\/div>\s*$/.exec(w.body.trim()) || [])[1] || '').replace(/N-week NK|NK/g, 'NK')) + '"');
  w.tap('WD.eventTargeted=true');
  const on = w.draft;
  bump(C_BTN, 'I have a race date, after it: raceDate ' + (on.raceDate === TODAY ? 'today' : on.raceDate) + ', raceDateWeeks ' + on.raceDateWeeks + ', the card ' + feedbackKind(w.line('raceDateFeedback')));
  w.tap('WD.eventTargeted=true');
  bump(C_BTN, 'I have a race date, already chosen: the step drawn again, raceDate ' + (w.draft.raceDate === TODAY ? 'today' : 'kept'));
  // The field handing back nothing. WebKit's Reset does not on this field (section J); kept as what the handler does with a blank.
  w.raceDay(plusDays(TODAY, 70)); w.raceDay('');
  const blank = w.draft;
  bump(C_BTN, 'a blank from the field (handed back by no tap, section J): raceDate "' + blank.raceDate + '", raceDateWeeks ' + (typeof blank.raceDateWeeks === 'number' ? 'kept from the last pick' : blank.raceDateWeeks) + ', the card ' + feedbackKind(w.line('raceDateFeedback')));
  w.P.ev('renderWizardStep()');
  bump(C_BTN, 'a blank from the field, then a whole draw: raceDate ' + (w.draft.raceDate === TODAY ? 'today' : w.draft.raceDate) + ', the card ' + feedbackKind(w.line('raceDateFeedback')));
  if (stored(w.P) !== before) cStored = false;
}
say(SETUPS.length + ' forms on the race path (each goal as first picked, and the pace goal filled six ways, two of them with the start date first set on the name step), each with ' + OFFSETS.length + ' days picked, from ' + OFFSETS[0] + ' to ' + OFFSETS[OFFSETS.length - 1] + ' days from today: ' + picks + ' picks. A pick writes `raceDate` and, when the day reads, `raceDateWeeks` (' + weeksWritten + ' of ' + picks + '), then repaints the length line, the pace line, the pace reach frame and the card. Stored by all of it: ' + (cStored ? 'nothing' : 'SOMETHING') + '.');
say();
table(C_CARD, 'The card under the date, after a pick', 'Picks');
table(C_LEN, 'The length line, after a pick', 'Picks');
table(C_FEAS, 'The pace reach frame, after a pick', 'Picks');
table(C_BTN, 'The buttons and a blank field, on each of the ' + SETUPS.length + ' forms', 'Forms');

// ── D. The shorter plan link ─────────────────────────────────────────────────
say('## D. The shorter plan link');
say();
say('The link is in the card under the date (and under a start set by a race date, section F). Of the ' + picks + ' picks above it was offered on ' + linkTaps + ', each tapped:');
say();
table(D_LINK, 'Form → the goal it switches to: the card after', 'Taps');
say('| Form | Day picked | Switches to | The draft\'s fields changed | Toast | The card after |');
say('|---|---|---|---|---|---|');
for (const r of linkRows) say(r);
say();

// ── E. The seed offer ────────────────────────────────────────────────────────
say('## E. The seed offer');
say();
{
  const E: Tally = {};
  const life = runsLife(PROGRAMS['half-manny' as keyof typeof PROGRAMS] || Object.values(PROGRAMS)[0], NOW);
  const P = life.phone.launch('2026-09-23T09:00:00'); P.settle();
  let offered = 0, forms = 0; const rows: string[] = [];
  for (const path of ['event', 'both']) {
    for (const g of CATALOG[path]!) {
      const w = Wiz.open(path, {}, P);
      const before = stored(P);
      w.tap("toggleCardioTypeSport('" + g.sport + "')");
      const seed0 = w.draft._seed;
      w.tap("setCardioGoal('" + g.sport + "','" + g.id + "')"); forms++;
      const kind = w.seed(); bump(E, g.sport + ' goal, on a phone with logged recovery runs: ' + kind);
      if (kind === 'the offer') {
        offered++;
        const d0 = w.draft, l0 = w.lines();
        const offer = N(txt((/line-height:1\.5;margin-bottom:10px">([^<]*)</.exec(w.body) || [])[1] || ''));
        w.tap('applySeedData()');
        const d1 = w.draft;
        bump(E, 'Use this data: then ' + w.seed());
        if (rows.length < 2) rows.push('- ' + g.label + ' (' + path + '): the reader ran at the goal\'s first draw (`_seed` ' + (seed0 === undefined ? 'unset before' : 'set before') + '); the offer reads "' + offer + '"; Use this data writes ' + diffKeys(d0, d1).join(', ') + ' (mile ' + d1.cardioGoals.run.mileBestMins + ':' + d1.cardioGoals.run.mileBestSecs + ', source ' + J(d1.cardioGoals.run.mileBestSrc).replace(/"prog":"[^"]*"/, '"prog":"<the program\'s name>"') + ', baseline "' + d1.cardioGoals.run.baseline + '"); lines changed: ' + (LINES.filter((id) => l0[id] !== w.line(id)).join(', ') || 'none') + '.');
        // A second wizard on the same phone: Start fresh.
        const w2 = Wiz.open(path, {}, P);
        w2.tap("toggleCardioTypeSport('" + g.sport + "')"); w2.tap("setCardioGoal('" + g.sport + "','" + g.id + "')");
        const e0 = w2.draft; w2.tap('dismissSeedData()'); const e1 = w2.draft;
        bump(E, 'Start fresh: then ' + w2.seed() + ', writes ' + diffKeys(e0, e1).join(', '));
        // The offer stands while another run goal is picked, and goes with nothing.
        w2.tap("setCardioGoal('" + g.sport + "','" + g.id + "')");
        bump(E, 'after Start fresh, the goal picked again: ' + w2.seed());
      }
      if (stored(P) !== before) bump(E, 'SOMETHING STORED');
    }
  }
  const w0 = Wiz.open('event');
  w0.tap("toggleCardioTypeSport('run')"); w0.tap("setCardioGoal('run','run_base')");
  say('On a phone with one program and three weeks of runs logged with a pace (' + life.runs + ' runs; the first measure\'s phone), its day 2026-09-23, each goal of each path picked alone in a wizard of its own (' + forms + ' goals): the offer is drawn on ' + offered + ', every run goal, and on no bike or swim goal. On a phone with no program the reader finds nothing (`_seed` ' + J(w0.draft._seed) + ') and no banner is drawn.');
  say();
  table(E, 'What was drawn or done');
  for (const r of rows) say(r);
  say('- The seed is read once per wizard: it is kept on the draft (`_seed`), with `_seedApplied` and `_seedDismissed`. Section F says what Generate does with the three.');
  say();
}

// ── F. The name step and Generate after the cardio goals ─────────────────────
say('## F. After the cardio goals: the name step, the pop-up, the refusals, what is stored');
say();
{
  const F: Tally = {}, POP: Tally = {}, REF: Tally = {}, UND: Tally = {};
  let walks = 0, built = 0, shortTaps = 0;
  const DAYS_F = [0, 10, 28, 56, 119];
  const cases: { path: string; g: { sport: string; id: string; label: string }; day: number | null; fill: [string, string][]; exp: string }[] = [];
  for (const path of ['event', 'both']) for (const g of CATALOG[path]!) {
    const form = g.id === 'run_pace_goal' ? 'run pace goal' : g.id === 'swim_500_time' ? 'swim 500' : g.id === 'swim_100_time' ? 'swim 100 (the 500 row too)' : '';
    if (path === 'event') { for (const day of DAYS_F) cases.push({ path, g, day, fill: form ? FILL[form]! : [], exp: 'intermediate' }); cases.push({ path, g, day: null, fill: form ? FILL[form]! : [], exp: 'intermediate' }); }
    else cases.push({ path, g, day: null, fill: form ? FILL[form]! : [], exp: 'intermediate' });
    if (form) cases.push({ path, g, day: path === 'event' ? 56 : null, fill: [], exp: 'intermediate' });
  }
  for (const c of cases) {
    const w = Wiz.open(c.path, { experience: c.exp });
    const before = stored(w.P);
    w.tap("toggleCardioTypeSport('" + c.g.sport + "')"); w.tap("setCardioGoal('" + c.g.sport + "','" + c.g.id + "')");
    for (const [k, v] of c.fill) w.type(c.g.sport, k, v);
    if (c.path === 'event') { if (c.day === null) w.tap('WD.eventTargeted=false'); else w.raceDay(plusDays(TODAY, c.day)); }
    w.next(); w.next(); w.next(); walks++;
    if (w.step !== 'name') throw new Error('not on the name step');
    const b = w.body;
    const derived = /class="input-field derived"/.test(b);
    const copy = (/id="startResolve">([\s\S]*?)<\/div>/.exec(b) || [])[1] || '';
    bump(F, 'name step, start: ' + (derived ? 'set by race date, ' + alignedKind(copy) + (/start-pips/.test(b) ? ', pips' : ', no pips') : 'the date field, ' + resolveKind(copy)));
    const raceRow = (/summary-key">Race date<\/span><span class="summary-val">([\s\S]*?)<\/span>/.exec(b) || [])[1];
    bump(F, 'name step, race date row: ' + (raceRow === undefined ? 'no row' : /No date set/.test(raceRow) ? 'no date set' : / away\)$/.test(raceRow) ? 'a date, N away' : /\(race day\)$/.test(raceRow) ? 'a date, race day' : 'a date alone'));
    if (derived && /offerShorterPlan/.test(b) && shortTaps < 4) {
      const t0 = w.P.toasts.length, d0 = w.draft;
      w.tap('offerShorterPlan'); shortTaps++;
      bump(F, 'the shorter plan link under the start, tapped: writes ' + diffKeys(d0, w.draft).join(', ') + ', toast ' + J(w.P.toasts.slice(t0)) + ', still on ' + w.step);
      w.back(); w.back(); w.back(); w.tap("setCardioGoal('" + c.g.sport + "','" + c.g.id + "')"); w.next(); w.next(); w.next();
    }
    const t0 = w.P.toasts.length, o0 = w.overlays.length;
    w.next();
    const pop = w.overlays.length > o0;
    if (pop) {
      const msg = N(txt((/margin-bottom:20px;">([\s\S]*?)<br>/.exec(String(w.overlays[w.overlays.length - 1]!.innerHTML)) || [])[1] || ''));
      bump(POP, (c.path === 'event' ? 'race path' : 'hybrid path') + ': ' + msg.replace(/\(.*\)/, '(…)'));
      w.P.ev("document.getElementById('confirmGenBtn').onclick()");
    } else bump(POP, (c.path === 'event' ? 'race path' : 'hybrid path') + ': no pop-up');
    const toasts = w.P.toasts.slice(t0);
    if (toasts.length) { bump(REF, 'refused: "' + toasts[0] + '"'); if (stored(w.P) !== before) bump(REF, 'A REFUSAL STORED SOMETHING'); continue; }
    w.P.settle(); built++;
    const prog = w.P.prog;
    const cfg = JSON.parse(JSON.parse(w.P.dump()['ia_programs']!).slice(-1)[0] ? J(JSON.parse(w.P.dump()['ia_programs']!).slice(-1)[0].cfg) : '{}');
    for (const k of Object.keys(cfg).filter((x) => x.startsWith('_'))) bump(UND, 'cfg: `' + k + '`');
    for (const k of ['raceDate', 'raceDateWeeks', 'eventTargeted', 'startDate']) if (k in cfg) bump(UND, 'cfg: `' + k + '`');
    for (const k of Object.keys((cfg.cardioGoals || {})[c.g.sport] || {})) bump(UND, 'goal: `' + k + '`');
    bump(F, 'built: start ' + (prog.blockOpen ? 'set by race date (blockOpen written)' : 'resolved') + ', ' + (prog.startDate > TODAY ? 'in the future' : prog.startDate === TODAY ? 'today' : 'behind today'));
    bump(F, 'built: keys changed ' + Object.keys(w.P.dump()).filter((k) => JSON.parse(before)[k] !== w.P.dump()[k]).sort().join(', '));
  }
  // One program built with the seed applied: what of the seed is stored.
  const life = runsLife(PROGRAMS['half-manny' as keyof typeof PROGRAMS] || Object.values(PROGRAMS)[0], NOW);
  const P = life.phone.launch('2026-09-23T09:00:00'); P.settle();
  const w = Wiz.open('both', {}, P);
  w.tap("toggleCardioTypeSport('run')"); w.tap("setCardioGoal('run','run_base')"); w.tap('applySeedData()');
  w.next(); w.next(); w.next(); const o0 = w.overlays.length; w.next(); if (w.overlays.length > o0) w.P.ev("document.getElementById('confirmGenBtn').onclick()"); w.P.settle();
  const seededCfg = JSON.parse(w.P.dump()['ia_programs']!).slice(-1)[0].cfg;
  say(walks + ' walks by taps from Build New Program: each goal of the race path with a race day ' + DAYS_F.join(', ') + ' days out and with Just building fitness, each goal of the hybrid path, and each goal that asks for times once more with its fields left blank. Each is taken to the name step, then Generate, then Build on the pop-up; ' + built + ' built a program.');
  say();
  table(F, 'What the name step drew, and what was built', 'Walks');
  table(POP, 'The pop-up at Generate', 'Walks');
  table(REF, 'Refused by toast, nothing stored', 'Walks');
  table(UND, 'What the stored config holds, over the ' + built + ' built', 'Programs');
  say('- With the seed applied (Running Base on the hybrid path, on the phone with logged runs), the stored config holds ' + (['_seed', '_seedApplied', '_seedDismissed'].filter((k) => k in seededCfg).map((k) => '`' + k + '`').join(', ') || 'none of `_seed`, `_seedApplied`, `_seedDismissed`') + '; the goal holds `' + Object.keys(seededCfg.cardioGoals.run).join('`, `') + '`.');
  say();
}

// ── G. The ten seeded programs, their cardio goals walked ────────────────────
say('## G. The ten seeded programs, their cardio goals walked by taps');
say();
say('Last session the seeded configs were put into the draft whole. Here each is put in with no sport, no goal and no race date, on the cardio goals step, and its goals are then made by taps: the sport, the goal, each field the seeded goal holds that the form shows, the unit, the race date or Just building fitness. The walked draft is then held against the seeded config, and both are generated on phones of their own.');
say();
say('| Program | Taps | The walked draft differs from the seeded config in | The built program |');
say('|---|---|---|---|');
{
  let same = 0, n = 0;
  const walkable = (seeded: any): any => (seeded.cardioGoals.swim ? { ...seeded, cardioGoals: { ...seeded.cardioGoals, swim: { ...seeded.cardioGoals.swim, baseMins: '10', baseSecs: '30' } } } : seeded);
  const build = (w: Wiz): any => { w.P.ev('wizardStep=6;renderWizardStep()'); const o0 = w.overlays.length; w.next(); if (w.overlays.length > o0) w.P.ev("document.getElementById('confirmGenBtn').onclick()"); w.P.settle(); return w.P.prog; };
  const setWhole = (w: Wiz, d: any): void => { w.P.IA.ctx['__J'] = J(d); w.P.ev('Object.keys(WD).forEach(function(k){delete WD[k];});Object.assign(WD,JSON.parse(__J));wizardStep=3;renderWizardStep();'); };
  for (const [name, raw] of Object.entries(PROGRAMS)) {
    const cfg: any = walkable(JSON.parse(J(raw)));
    const base = { ...new Wiz(fresh()).draft };
    const w = new Wiz(fresh()); w.P.ev('startWizard()');
    // Off the race path no control writes the race flag or the race date, so the seeded ones are left in the draft.
    const bare = { ...w.draft, ...cfg, cardioTypes: [], cardioGoals: {} };
    if (cfg.primaryPath === 'event') { bare.eventTargeted = true; delete bare.raceDate; delete bare.raceDateWeeks; }
    setWhole(w, bare);
    let taps = 0; const skipped: string[] = [];
    for (const sport of cfg.cardioTypes) {
      const g = cfg.cardioGoals[sport];
      w.tap("toggleCardioTypeSport('" + sport + "')"); taps++;
      if (!g) continue;
      if (!w.can("setCardioGoal('" + sport + "','" + g.id + "')")) { skipped.push(sport + ' goal not offered'); continue; }
      w.tap("setCardioGoal('" + sport + "','" + g.id + "')"); taps++;
      if (g.swimUnit && g.swimUnit !== 'yd') { w.tap("setSwimUnit('" + g.swimUnit + "')"); taps++; }
      if (g.paceUnit && g.paceUnit !== 'mi') { w.tap("setPaceUnit('" + g.paceUnit + "')"); taps++; }
      const keys = w.fields().filter((f) => f.sport === sport).map((f) => f.key);
      for (const k of keys) if (g[k] !== undefined && g[k] !== '') { w.type(sport, k, String(g[k])); taps++; }
    }
    if (cfg.primaryPath === 'event') {
      if (cfg.eventTargeted === false) { w.tap('WD.eventTargeted=false'); taps++; }
      else if (cfg.raceDate) { w.raceDay(cfg.raceDate); taps++; }
    }
    const walked = w.draft;
    const whole = new Wiz(fresh()); whole.P.ev('startWizard()'); setWhole(whole, { ...whole.draft, ...cfg });
    const wholeDraft = whole.draft;
    const diffs: string[] = [];
    for (const k of new Set([...Object.keys(walked), ...Object.keys(wholeDraft)])) {
      if (k === 'cardioGoals') { for (const sp of new Set([...Object.keys(walked[k]), ...Object.keys(wholeDraft[k])])) for (const f of new Set([...Object.keys(walked[k][sp] || {}), ...Object.keys(wholeDraft[k][sp] || {})])) if (J((walked[k][sp] || {})[f]) !== J((wholeDraft[k][sp] || {})[f])) diffs.push(sp + '.' + f + ' (walked ' + J((walked[k][sp] || {})[f]) + ', seeded ' + J((wholeDraft[k][sp] || {})[f]) + ')'); }
      else if (J(walked[k]) !== J(wholeDraft[k])) diffs.push(k + ' (walked ' + J(walked[k]) + ', seeded ' + J(wholeDraft[k]) + ')');
    }
    void base;
    const a = build(w), b = build(whole);
    const strip = (p: any): string => J({ weeks: p.weeks, totalWeeks: p.totalWeeks, startDate: p.startDate, blockOpen: p.blockOpen, taperWeeks: p.taperWeeks });
    const eq = strip(a) === strip(b); n++; if (eq) same++;
    say('| ' + name + ' | ' + taps + (skipped.length ? ' (' + skipped.join(', ') + ')' : '') + ' | ' + (diffs.join('; ') || 'nothing') + ' | ' + (eq ? 'the same grid, length, start and taper as the seeded one\'s' : 'DIFFERS: ' + a.totalWeeks + ' weeks from ' + a.startDate + ' against ' + b.totalWeeks + ' from ' + b.startDate + (J(a.weeks) === J(b.weeks) ? ', the grid the same' : ', the grid differs')) + ' |');
  }
  say();
  say('- ' + same + ' of ' + n + ' walked drafts build the seeded program\'s grid, length, start and taper.');
  say();
}

// ── H. The pace reach frame, the mile help, and a week that holds the test ───
say('## H. The lines no walk above drew: the pace reach frame, the mile help by level, a week that holds the test');
say();
const H: Tally = {};
{
  // The frame is the step's own only when no race date owns the pace's words: the race path with Just building fitness,
  // and the hybrid path (which draws no race date control).
  const TARGETS: [string, string, string, string][] = [['1.5', '9', '0', 'mi'], ['1.5', '10', '30', 'mi'], ['1.5', '13', '0', 'mi'], ['3', '14', '0', 'km'], ['1', '6', '0', 'mi']];
  const MILES: ([string, string] | null)[] = [null, ['9', '0'], ['7', '0'], ['12', '30']];
  let n = 0;
  for (const path of ['event', 'both']) for (const exp of ['beginner', 'intermediate', 'advanced']) for (const age of ['18-35', '55+']) {
    const w = Wiz.open(path, { experience: exp, age });
    w.tap("toggleCardioTypeSport('run')");
    for (const g of w.goals('run')) { w.tap("setCardioGoal('run','" + g.id + "')"); bump(H, 'mile help, as a run goal is picked: ' + mileHelpKind(w.mileHelp())); }
    w.tap("setCardioGoal('run','run_pace_goal')");
    if (path === 'event') w.tap('WD.eventTargeted=false');
    for (const [dist, mm, ss, unit] of TARGETS) for (const mile of MILES) {
      if (w.can("setPaceUnit('" + unit + "')")) w.tap("setPaceUnit('" + unit + "')");
      w.type('run', 'targetDist', dist); w.type('run', 'targetMins', mm); w.type('run', 'targetSecs', ss);
      w.type('run', 'mileBestMins', mile ? mile[0] : ''); w.type('run', 'mileBestSecs', mile ? mile[1] : '');
      const L = w.lines(); n++;
      bump(H, (path === 'event' ? 'race path, Just building fitness' : 'hybrid path') + ': pace reach ' + feasKind(L['paceFeasLine']!));
      bump(H, (path === 'event' ? 'race path, Just building fitness' : 'hybrid path') + ': length line ' + progLenKind(L['progLenLine']!));
      w.P.ev('renderWizardStep()');
      if (J(w.lines()) !== J(L)) bump(H, 'A TYPED VALUE LEFT A LINE STALE');
    }
  }
  // A week that holds the test: today and tomorrow rested on the rest day step, then the race date picked.
  for (const rest of [['sat'], ['sat', 'sun'], ['sat', 'sun', 'mon']]) {
    const w = Wiz.open('event');
    w.tap("toggleCardioTypeSport('run')"); w.tap("setCardioGoal('run','run_pace_goal')");
    for (const [k, v] of [['targetDist', '1.5'], ['targetMins', '9'], ['targetSecs', '0'], ['mileBestMins', '9'], ['mileBestSecs', '0']] as [string, string][]) w.type('run', k, v);
    w.next(); w.next();
    for (const d of rest) w.tap("toggleRestDay('" + d + "')");
    w.back(); w.back();
    for (const off of [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]) { w.raceDay(plusDays(TODAY, off)); n++; bump(H, 'race path, ' + rest.join(' and ') + ' rested, a day picked: card ' + feedbackKind(w.line('raceDateFeedback'))); }
  }
  say(n + ' more draws by taps: the pace goal on the race path with Just building fitness and on the hybrid path, at each level and two ages, five targets and four miles; each run goal\'s mile help at each level; and the race path\'s pace goal with today, then today and tomorrow, then three days rested on the rest day step before a race day is picked.');
  say();
  table(H, 'What was drawn', 'Draws');
}

// ── I. Found by this measure ─────────────────────────────────────────────────
say('## I. Found by this measure');
say();
{
  const row = (path: string, fill: boolean): string => {
    const w = Wiz.open(path);
    w.tap("toggleCardioTypeSport('run')"); w.tap("setCardioGoal('run','run_pace_goal')");
    if (fill) for (const [k, v] of FILL['run pace goal']!) w.type('run', k, v);
    const len = txt(w.line('progLenLine')), d = w.draft;
    w.next(); w.next(); w.next();
    const o0 = w.overlays.length, t0 = w.P.toasts.length; w.next();
    const pop = w.overlays.length > o0 ? N(txt((/font-size:22px[^>]*>([^<]*)</.exec(String(w.overlays[w.overlays.length - 1]!.innerHTML)) || [])[1] || '')) : 'none';
    if (w.overlays.length > o0) w.P.ev("document.getElementById('confirmGenBtn').onclick()");
    const toast = w.P.toasts.slice(t0);
    if (toast.length) return '| ' + (path === 'event' ? 'Race / Event' : 'Hybrid') + ', ' + (fill ? 'its six fields typed' : 'its fields blank') + ' | ' + d.raceDate + ', `eventTargeted` ' + d.eventTargeted + ' | ' + len + ' | ' + pop + ' | refused: ' + toast[0] + ' |';
    w.P.settle();
    const p = w.P.prog;
    return '| ' + (path === 'event' ? 'Race / Event' : 'Hybrid') + ', ' + (fill ? 'its six fields typed' : 'its fields blank') + ' | ' + d.raceDate + ', `eventTargeted` ' + d.eventTargeted + ' | ' + len + ' | ' + pop + ' | ' + p.totalWeeks + ' week' + (p.totalWeeks === 1 ? '' : 's') + ' from ' + p.startDate + ', `_testWeek` ' + p.cfg._testWeek + ' |';
  };
  say('**Hit a Pace / Time Goal with no race date picked builds a one week program.** The step gives every draft a race date of today (the first measure\'s finding on the 5K and the 10K). A pace goal with a race date is a dated test, and a test dated today pins the program to its test week. On the race path the date field and its card are on the screen. On the hybrid path nothing draws either; the length line alone says it. By taps from Build New Program, Running, Hit a Pace / Time Goal, Continue to the end, Generate:');
  say();
  say('| Path, the goal | The draft\'s race date | The length line on the step | The pop-up\'s title | Built |');
  say('|---|---|---|---|---|');
  for (const path of ['both', 'event']) for (const fill of [true, false]) say(row(path, fill));
  say();
  say('Not ruled and not fixed here: it is the first measure\'s finding (Hybrid with a 5K or a 10K) on a third goal, and the beta is held equal to it.');
  say();
  say('**A typed bike, swim or swim time field leaves the program length line as it was.** Their handlers repaint the swim pace line or the swim advisory, or nothing, and never the length line (section B: ' + Object.keys(B_STALE).length + ' field and line pairs, all of them the length line). The line is right again at the next whole draw (a goal, a unit, a sport, Continue and Back). Today\'s behaviour; the beta repaints what today\'s handler repaints and no more.');
  say();
  say('**The stored config keeps the seed reader\'s answer.** Every program made after a run goal was drawn stores `_seed` in its config (null when the reader found nothing, section F), and `_seedApplied` or `_seedDismissed` after either button. Today\'s behaviour; the beta stores the same.');
  say();
}

// ── J. The WebKit controls, tried in the simulator's Safari (typed by hand from what was seen) ──
say('## J. The WebKit controls of the step, tried in the simulator\'s Safari');
say();
say('Seen on 2026-11-26 in Safari on the iPhone 17 Pro simulator (iOS 26.5), on a scratch page whose fields are set as the step sets its own (a number field with `min`, `max` and `step` on the tag; a date field with its value an attribute, `min` today, read on `input`). Each key was typed and the value the field handed its `input` handler read after it. This section is typed by hand from that; the script does not make it.');
say();
say('**A number field.** The field keeps a text of its own and hands back a value made from it.');
say();
say('| Key typed at the end of the text | Kept in the text | |');
say('|---|---|---|');
say('| a digit | always | |');
say('| `.` | when the text holds no `.` and no `e` | `5..2` shows `5.2`; `1e2.5` shows `1e25` |');
say('| `e` or `E` | when the text holds none | `1ee2` shows `1e2`; `e` alone is kept |');
say('| `-` or `+` | when the text is empty, or ends with `e` | `5-3` shows `53`; `5e-2` and `5e+2` are kept |');
say('| anything else (a letter, a comma, a space, `/`, `:`, `\'`) | never | `9,5` shows `95`; `1:30` shows `130`; `abc` shows nothing |');
say();
say('- A key that is not kept still fires `input`, with the value as it stood: the handler runs again (on the mile\'s fields it writes `mileBestSrc` again).');
say('- The value handed back is the text when the text is a whole number as written (digits, an optional `.`, an optional exponent with its digits), with a leading `+` taken off and a `.` at the very end taken off. Otherwise it is blank.');
say('- 45 texts read, each as typed key by key (the value after each key): `1.5` → 1, 1, 1.5 · `.5` → blank, .5 · `-5` → blank, -5 · `+5` → blank, 5 · `0012` → 0, 00, 001, 0012 · `5..2` → 5, 5, 5, 5.2 · `1e2` → 1, blank, 1e2 · `9,5` → 9, 9, 95 · ` 5` → blank, 5 · `1.50` → 1, 1, 1.5, 1.50 · `5-3` → 5, 5, 53 · `5e-2` → 5, blank, blank, 5e-2 · `abc` → blank, blank, blank · `007.0` → 0, 00, 007, 007, 007.0 · `1.` → 1, 1 · `99999` → 9, 99, 999, 9999, 99999 · `e5` → blank, blank · `5 5` → 5, 5, 55 · `1.5.5` → 1, 1, 1.5, 1.5, 1.55 · `05` → 0, 05 · `.` → blank · `-` → blank · `0` → 0 · `1e2.5` → 1, blank, 1e2, 1e2, 1e25 · `5e+2` → 5, blank, blank, 5e+2 · `-.5` → blank, blank, -.5 · `1ee2` → 1, blank, blank, 1e2 · `+.5` → blank, blank, .5 · `1.e2` → 1, 1, blank, 1.e2 · `-0` → blank, -0 · `5e2e` → 5, blank, 5e2, 5e2 · `1E2` → 1, blank, 1E2 · `.5.` → blank, .5, .5 · `5.e` → 5, 5, blank · `12/3` → 1, 12, 12, 123 · `1:30` → 1, 1, 13, 130 · `5\'` → 5, 5 · `-5-` → blank, -5, -5 · `e-e` → blank, blank, blank · `1e+` → 1, blank, blank · `30` → 3, 30 · `59` → 5, 59 · `60` → 6, 60 · `12a.5-e3` → 1, 12, 12, 12, 12.5, 12.5, blank, 12.5e3 · `1.5` then delete three times → 1, 1, blank. (A 46th, `--5`, was changed by the simulator\'s keyboard into a long dash before it reached the field, and is not counted.)');
say('- `min`, `max` and `step` change nothing that is typed or handed back: 1 is handed back under a `min` of 3, 99999 over a `max` of 59, 12.5 on a field with no `step`. A field drawn with a value shows it (8).');
say('- Leading zeros and a zero after the point are kept as typed (`0012`, `1.50`).');
say();
say('**The race date\'s field** (its value an attribute, as the step writes it; the start date\'s and the change sheet\'s fields set theirs as a property, and were tried in the sessions that built them):');
say();
say('- A tap opens the calendar on the field\'s day. A day picked is handed to `input` at once and the calendar stays; the check closes it.');
say('- `min` is not enforced: a day before today is offered like any other, picked and handed back (so "That date has already passed." is drawn by a tap).');
say('- **Reset hands back the attribute\'s day**, the one the step was last drawn whole with, not a blank: after two picks, Reset fired `input` with the day the field was drawn with, and the calendar went back to it and stayed. So on this field the blank of section C\'s last two rows is never handed back, and "card empty" is drawn by no tap. (A whole draw is a goal, a sport, a unit, a race button, the seed\'s buttons, the shorter plan link, Continue and Back; a typed field and a picked day are not, so the attribute keeps the day of the last whole draw through them.)');
say();

// ── K. Mario's backup, counts only ───────────────────────────────────────────
say('## K. On the simulator\'s copy of Mario\'s backup (counts only)');
say();
say('Read by a scratch script from a copy of the simulator\'s store made before any build of this session (2026-11-26, the store\'s hash 278ba57f3f6a382b, the hash the last session left; nothing was written to it), every walk on a phone of its own in the VM harness. The numbers below are the ones that script printed.');
say();
say('- 36 `ia_` keys; 3 programs, 1 of them archived.');
say('- The seed offer: the cardio goals step drawn with each run goal picked, 6 on the race path and 4 on the hybrid path: the offer is drawn on 0 of the 10. The reader finds no seed (`_seed` null).');
say('- Three programs made by taps through the cardio goals step, each on a phone of its own (Run a 5K with a race day 56 days out; Hybrid with Build Running Base; Half Marathon with a race day 119 days out): each raised the pop-up, named itself "Block 4" by default, and changed 2 of the 36 keys (`ia_active`, `ia_programs`); 3 programs became 4, the new one active, the 3 already stored the same to the byte after.');
say();

writeFileSync(join(REPO, 'tests/measure/native-wizard_cardio-goals.md'), out.join('\n') + '\n');
console.log('wrote tests/measure/native-wizard_cardio-goals.md, ' + out.length + ' lines');
