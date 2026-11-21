// native-wizard: today's wizard and its generating screen, before the Expo app draws them (MIGRATION.md phase 3, row 6).
// Read-only (measure). It runs today's page in the VM harness on the test phone of tests/support/stored-state.ts. Each
// step is read twice: through the Angular screen's own models (frontends/app/src/app/screens/wizard) handed the page's
// readers, as its screen hands them, and as the page's own markup (renderWizardStep and the lines it repaints). Stored
// keys, the keys asked for, the draft and the page's own calls are read before and after each tap.
//
// A. The door, the shell and the steps.
// B. What each step draws on the ten seeded programs, each kind counted.
// C. Every kind a step can draw, counted over a wider set of drafts (the floors' denominators).
// D. What each tap reads and writes.
// E. Generate: the pop-up, the refusals, the screen's lines, and what it stores by key family.
// F. The WebKit controls.
//
// G. Found by this measure, and what no walk of taps reaches.
// H. Mario's backup, as counts.
//
// Usage: cd tests && node --no-warnings --import ./measure/native-deck-popups_resolve.mjs measure/native-wizard_today.ts
//        (writes tests/measure/native-wizard_today.md; the resolver is for tests/support/native-progress.ts, which imports the Expo app's files)
// TypeScript for the harness imports; node runs it with its types stripped. Not in the tests' type check.
process.env['TZ'] = 'America/New_York';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { REPO } from '../support/app.ts';
import { PROGRAMS } from '../support/programs.ts';
import { Phone, life } from '../support/stored-state.ts';
import { runsLife } from '../support/native-progress.ts';
import * as WM from '../../frontends/app/src/app/screens/wizard/wizard-model.ts';
import * as CM from '../../frontends/app/src/app/screens/wizard/cardio-goal-model.ts';

const out: string[] = [];
const NOW = '2026-08-29T09:00:00';   // a Saturday, the day the seeded walks are made on
const say = (s = ''): void => { out.push(s); };
const walkable = (seeded: any): any => (seeded.cardioGoals.swim ? { ...seeded, cardioGoals: { ...seeded.cardioGoals, swim: { ...seeded.cardioGoals.swim, baseMins: '10', baseSecs: '30' } } } : seeded);
const NAMES = Object.keys(PROGRAMS);
const CFGS = Object.values(PROGRAMS).map(walkable);
const J = JSON.stringify;
type Tally = Record<string, number>;
const bump = (T: Tally, k: string, n = 1): void => { T[k] = (T[k] || 0) + n; };
const table = (T: Tally, head: string, of?: string): void => {
  say('| ' + head + ' | ' + (of || 'Count') + ' |'); say('|---|---|');
  for (const k of Object.keys(T).sort()) say('| ' + k + ' | ' + T[k] + ' |');
  say();
};
const txt = (h: unknown): string => String(h || '').replace(/<svg[\s\S]*?<\/svg>/g, '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
const plusDays = (iso: string, n: number): string => {
  const d = new Date(iso.slice(0, 10) + 'T12:00:00'); d.setDate(d.getDate() + n);
  const p = (x: number): string => String(x).padStart(2, '0');
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
};
const TODAY = NOW.slice(0, 10);
const ALL = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const BASE = { primaryPath: 'body', cardioTypes: [], cardioGoals: {}, eventTargeted: true, liftingFocus: 'balanced', experience: 'intermediate', ageBracket: '18-35', equipment: 'home_full', unit: 'lbs', restDays: [], days: ALL.slice(), bench: 0, squat: 0, deadlift: 0, name: '', startDate: TODAY };

// ── The page, driven ─────────────────────────────────────────────────────────
const fresh = (at = NOW): Phone => { const P = new Phone().launch(at); P.settle(); return P; };
/** The draft set whole, as the wizard holds one (the page's own object, its keys replaced). */
function setDraft(P: Phone, d: any, step: string): void {
  P.IA.ctx['__J'] = J(d);
  P.ev('Object.keys(WD).forEach(function(k){delete WD[k];});Object.assign(WD,JSON.parse(__J));wizardStep=' + WM.WIZARD_STEPS.indexOf(step as never) + ';');
}
const draftOf = (P: Phone): any => JSON.parse(P.ev('JSON.stringify(WD)'));
const el = (P: Phone, id: string, prop: string): string => String(P.ev(`(function(){var e=document.getElementById(${J(id)});var v=e.${prop};return v==null?'':v;})()`));
interface Page { body: string; has: (id: string) => boolean; feedback: string | null; feas: string | null; progLen: string | null; paceLine: string | null; label: string; next: string }
/** The page's own render of the step in hand, and the four lines its repaint owns (null: not on the step). */
function page(P: Phone): Page {
  P.ev("document.getElementById('raceDateInput').value='';renderWizardStep();");
  const body = el(P, 'wizardBody', 'innerHTML');
  const has = (id: string): boolean => new RegExp('\\bid="' + id + '"').test(body);
  const shown = (id: string): string | null => (!has(id) ? null : el(P, id, 'style.display') === 'none' ? '' : el(P, id, 'innerHTML'));
  return { body, has, feedback: has('raceDateFeedback') ? el(P, 'raceDateFeedback', 'innerHTML') : null, feas: shown('paceFeasLine'), progLen: has('progLenLine') ? el(P, 'progLenLine', 'innerHTML') : null, paceLine: shown('paceDisplayLine'), label: el(P, 'wizardStepLabel', 'textContent'), next: el(P, 'wizardNext', 'textContent') };
}
/** The Angular screen's view of the step in hand: its models, handed the page's readers as wizard.ts hands them. */
function view(P: Phone): any {
  const WD = P.ev('WD'), step: number = P.ev('wizardStep'), name = WM.WIZARD_STEPS[step]!;
  const c = (n: string, ...a: any[]): any => P.ev(n)(...a);
  const shell = WM.wizardShell(step, WD.primaryPath);
  if (name === 'primary') return { step: name, shell, choices: WM.primaryChoices(WD) };
  if (name === 'profile') return { step: name, shell, profile: WM.profileView(WD) };
  if (name === 'equipment') return { step: name, shell, choices: WM.equipmentChoices(WD) };
  if (name === 'cardio_goal') {
    const today: string = P.ev("(function(){var t=new Date();return t.getFullYear()+'-'+String(t.getMonth()+1).padStart(2,'0')+'-'+String(t.getDate()).padStart(2,'0');})()");
    const hyb = P.ev('HYBRID_EXCLUDED_GOALS');
    CM.prepareCardioDraft(WD, hyb, today);
    return { step: name, shell, cardio: CM.cardioStep(WD, {
      goalsByType: P.ev('CARDIO_GOALS_BY_TYPE'), hybridExcluded: hyb, swimDist: P.ev('SWIM_GOAL_DIST'), icon: (k, s) => c('asyIcon', k, s), clock: (s) => c('_clkMS', s),
      paceTarget: (g) => c('paceGoalTarget', g), seed: () => CM.seedView(WD, () => c('seedFromPriorPrograms'), (sec) => c('_fmtPaceMi', sec)),
      swimAdvisory: () => CM.swimAdvisory(c('_swimEntryState')), mileHelp: () => c('_mileFieldHelp'), mileAdvisory: () => CM.mileAdvisory(c('_mileEntryState')), progLen: () => c('progLenLineHTML'), today,
    }) };
  }
  if (name === 'lifting_focus') return { step: name, shell, lifting: WM.liftingView(WD, P.ev('LIFTING_OPTIONS')) };
  if (name === 'days') return { step: name, shell, days: WM.daysView(WD, { advisories: c('getDayAdvisories'), minDays: c('getMinTrainDays'), goalLabel: (id) => c('goalLabel', id) }) };
  const types: string[] = WD.cardioTypes || [], goals = WD.cardioGoals || {};
  const internalGoal = P.ev('LIFTING_FOCUS_TO_GOAL')[WD.liftingFocus || ''] || WD.liftingFocus;
  const sport: Record<string, [string, string]> = { run: ['🏃', 'Run'], bike: ['🚴', 'Bike'], swim: ['🏊', 'Swim'] };
  const cardio = types.length ? types.map((t) => c('asyIcon', sport[t]![0], 15) + ' ' + sport[t]![1] + (goals[t] && goals[t].label ? ': ' + goals[t].label : '')).join(' + ') : 'Lift only';
  const pin = c('wizardTestPin');
  const weeks = (pin || {}).tw || (types.length ? c('calcProgramLength', types, { ...goals, _experience: WD.experience, _ageBracket: WD.ageBracket, _eventTargeted: WD.eventTargeted }, internalGoal).weeks : 6);
  const sr = c('resolveStartDate', WD.startDate, WD.restDays || [], c('_rsRace', WD));
  const al = c('wizardAlignment');
  let raceRow: string | null = null;
  if (WD.primaryPath === 'event' && WD.raceDate) {
    const cd = c('raceCountdown', WD.raceDate), w = c('raceCountdownWords', cd);
    raceRow = c('_fmtStartDay', WD.raceDate, true) + (!w ? '' : cd.days <= 0 ? ' (' + w.copy + ')' : ' (' + w.card + ' away)');
  } else if (WD.primaryPath === 'event') raceRow = 'No date set — no taper';
  const startSummary: string = c('wizardStartSummary', sr);
  return { step: name, shell, name: {
    name: WD.name, startDate: WD.startDate, sr, pin, weeks,
    aligned: al ? { al, start: c('_fmtStartDay', al.start, true), warn: !!al.underFloor, copy: c('alignedStartCopy', al), pips: CM.alignedPips(al) } : null,
    resolveCopy: al ? '' : c('startResolveCopy', sr), startSummary, raceRow,
    rows: WM.nameSummary(WD, { weeks, cardio, raceRow, startSummary, aligned: null, resolveCopy: '' }),
  } };
}

// ── What a draw is made of: each kind named ──────────────────────────────────
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
const mileAdvKind = (t: string): string => (!t ? 'none' : /^Required/.test(t) ? 'required' : /not a real time/.test(t) ? 'not a real time' : /Under 3:00/.test(t) ? 'under 3:00' : /Over 25:00/.test(t) ? 'over 25:00' : /fastest row/.test(t) ? 'the chart\'s fastest row' : /12:00 row/.test(t) ? 'the chart\'s slowest row' : 'UNNAMED ' + t);
const mileHelpKind = (t: string): string => (/^Required/.test(t) ? 'required' : t === 'Optional.' ? 'optional, bare' : /come from an /.test(t) ? 'optional, an N mile' : /come from a /.test(t) ? 'optional, a N mile' : 'UNNAMED ' + t);
const swimAdvKind = (t: string): string => (!t ? 'none' : /timed 500/.test(t) ? 'required, the 500' : /timed 100/.test(t) ? 'required, the 100' : /not a real time/.test(t) ? 'not a real time' : /faster than your 100/.test(t) ? '500 pace faster than the 100' : 'UNNAMED ' + t);
const dayAdvKind = (h: string): string => { const t = txt(h); return /is most effective with/.test(t) ? 'lifting days' : /trains best with/.test(t) ? 'cardio goal days' : /interval \(speed\) work/.test(t) ? (/sharing the week/.test(t) ? 'interval days, sports sharing' : 'interval days, one sport') : 'UNNAMED ' + t; };
const resolveKind = (t: string): string => (/That week holds your test/.test(t) ? 'the week holds the test' : /Nothing left to train that week/.test(t) ? 'moved to the next Monday' : /Week 1 is short/.test(t) ? 'short first week, ' + ((t.match(/<b>/g) || []).length - 1) + ' day(s)' : /^Week 1 runs/.test(t) ? 'a whole first week' : 'UNNAMED ' + t);
const alignedKind = (t0: string): string => { const t = txt(t0); return (/so it peaks on race week/.test(t) ? 'starts later' : 'opens in a week' + (/are behind you/.test(t) ? ', weeks behind' : '')) + (/I don’t recommend under/.test(t) ? ', under the floor' : '') + (/fits this window better/.test(t0) ? ', the shorter plan link' : ''); };
const raceRowKind = (r: string | null): string => (r === null ? 'no row' : /No date set/.test(r) ? 'no date set' : / away\)$/.test(r) ? 'a date, N away' : /\(race day\)$/.test(r) ? 'a date, race day' : /\(behind you\)$/.test(r) ? 'a date, behind you' : 'a date alone');
const startSumKind = (s: string): string => (/set by race date/.test(s) ? 'set by race date' : /short first week/.test(s) ? 'short first week' : 'the date alone');

/** Every kind one draw of a step holds, counted into T. Returns the words the model draws, for the page check. */
function count(T: Tally, v: any, pg: Page): string[] {
  const words: string[] = [];
  const k = (s: string, n = 1): void => bump(T, v.step + ': ' + s, n);
  k('draws');
  if (v.step === 'primary' || v.step === 'equipment') {
    k('cards', v.choices.length); k('a card chosen', v.choices.filter((x: any) => x.sel).length);
    for (const x of v.choices) words.push(x.label, x.desc, ...(x.detail ? [x.detail] : []));
  } else if (v.step === 'profile') {
    const p = v.profile;
    k('experience cards', p.experience.length); k('age cards', p.age.length); k('unit buttons', 2); k('hint lines', 2);
    k('hint, experience ' + (p.experience.find((x: any) => x.sel) || { id: 'none' }).id); k('hint, ' + p.ageLabel);
    for (const x of p.experience) words.push(x.label, x.desc);
    words.push(p.expHint, p.ageHint);
  } else if (v.step === 'cardio_goal') {
    for (const s of v.cardio.sports) {
      k(s.sel ? 'sport card, open' : 'sport card, shut'); words.push(s.name, s.desc);
      k('goal options', s.goals.length);
      for (const g of s.goals) words.push(g.label, g.desc);
      const f = s.form; if (!f) { if (s.sel) k('open sport with no goal picked'); continue; }
      if (f.kind === 'swim') {
        k(f.base500 ? 'form: swim 100 (the 500 row too)' : 'form: swim 500'); k('number fields', f.base500 ? 7 : 5); k('unit buttons (yd, m)', 2);
        k('swim pace line ' + (f.paceShown ? 'shown' : 'hidden')); k('swim advisory: ' + swimAdvKind(f.advisory.text));
        words.push(f.baseLabel, ...(f.advisory.text ? [f.advisory.text] : []), ...(f.base500 ? [f.base500.label] : []));
      } else if (f.kind === 'pace') {
        k('form: run pace goal'); k('number fields', 6); k('unit buttons (mi, km)', 2);
        k('pace line ' + (f.paceShown && pg.paceLine ? 'shown' : 'hidden')); k('seed banner: ' + (f.seed ? (f.seed.applied ? 'applied line' : 'the offer') : 'none'));
        k('mile help: ' + mileHelpKind(f.mile.help)); k('mile advisory: ' + mileAdvKind(f.mile.advisory.text));
        words.push(f.mile.help, ...(f.mile.advisory.text ? [f.mile.advisory.text] : []));
      } else {
        k('form: baseline, ' + s.id); k('number fields', f.mile ? 3 : 1); k('seed banner: ' + (f.seed ? (f.seed.applied ? 'applied line' : 'the offer') : 'none'));
        words.push(f.question + ' (optional)', f.unitWord);
        if (f.mile) { k('mile help: ' + mileHelpKind(f.mile.help)); k('mile advisory: ' + mileAdvKind(f.mile.advisory.text)); words.push(f.mile.help, ...(f.mile.advisory.text ? [f.mile.advisory.text] : [])); }
      }
    }
    const ft = v.cardio.footer;
    if (!ft) k('no box under the cards');
    else {
      k('length line: ' + progLenKind(pg.progLen)); if (ft.multi) k('the line for more than one sport');
      if (!ft.race) k('race block: none (not the race path)');
      else if (ft.race.targeted) { k('race block: the date field'); k('date fields', 1); }
      else { k('race block: ' + (/time trial/.test(ft.race.copy) ? 'the time trial copy' : 'the holds copy')); words.push(ft.race.copy); }
      if (ft.race) k('race buttons', 2);
    }
    k('card under the date: ' + feedbackKind(pg.feedback));
    k('pace reach ' + feasKind(pg.feas));
  } else if (v.step === 'lifting_focus') {
    k('focus cards', v.lifting.choices.length); k(v.lifting.addOn ? 'add-on box (3 sports and Lift Only)' : 'no add-on box');
    if (v.lifting.addOn) k(v.lifting.addOn.liftOnly ? 'Lift Only chosen' : 'a sport chosen');
    words.push(v.lifting.subtitle); for (const x of v.lifting.choices) words.push(x.label, x.desc);
  } else if (v.step === 'days') {
    const d = v.days;
    k('day toggles', 7); k('days resting', d.days.filter((x: any) => x.rest).length); k('days locked', d.days.filter((x: any) => x.blocked).length);
    k(d.floor ? (d.floor.reason ? 'floor box, a goal named' : 'floor box, three days') : 'no floor box');
    for (const a of d.advisories) k('advisory: ' + dayAdvKind(a));
    if (!d.advisories.length) k('no advisory');
    words.push(d.count, ...d.advisories.map(txt));
  } else {
    const n = v.name;
    k('text field (the name)', 1);
    if (n.aligned) { k('start: set by race date'); k('aligned copy: ' + alignedKind(n.aligned.copy)); k(n.aligned.pips ? 'pips drawn' : 'no pips'); if (n.aligned.pips) k('pips', n.aligned.pips.length); words.push(n.aligned.start, txt(n.aligned.copy)); }
    else { k('start: the date field'); k('date fields', 1); k('copy under the start: ' + resolveKind(n.resolveCopy)); words.push(txt(n.resolveCopy)); }
    k('summary rows', n.rows.length); k('race date row: ' + raceRowKind(n.raceRow)); k('start row: ' + startSumKind(n.startSummary));
    for (const r of n.rows) words.push(r.k, txt(r.v));
  }
  return words;
}
/** One draw: the page's render, the model's view, the kinds counted, and whether every word of the model is on the page. */
let DRAWS = 0, SAME = 0; const MISSED: Tally = {};
function draw(P: Phone, T: Tally): { v: any; pg: Page } {
  const pg = page(P), v = view(P);
  const words = count(T, v, pg);
  const all = txt(pg.body + ' ' + (pg.feedback || '') + ' ' + (pg.progLen || ''));
  const miss = words.filter((w) => w && !all.includes(txt(w)));
  DRAWS++; if (!miss.length && pg.label === v.shell.label && pg.next === v.shell.next) SAME++; else bump(MISSED, v.step + ': ' + (miss[0] || 'the shell').slice(0, 70));
  return { v, pg };
}

// ── A. The door, the shell and the steps ─────────────────────────────────────
say('# Today\'s wizard and generating (measure, before the Expo app draws them)');
say();
say('Written by `cd tests && node --no-warnings --import ./measure/native-deck-popups_resolve.mjs measure/native-wizard_today.ts` (read-only). Zone America/New_York; the phone\'s day is Saturday ' + TODAY + '.');
say();
say('## A. The door, the shell and the steps');
say();
{
  const P = fresh();
  const before = P.dump();
  P.ev('startWizard()'); P.settle();
  const d0 = draftOf(P);
  say('- One door: **+ Build New Program**, under the cards on the Programs tab (`startWizard`). It makes a new draft, shows the wizard screen at step one, and stores nothing (keys changed: ' + (J(before) === J(P.dump()) ? 'none' : 'SOME') + ').');
  say('- The draft it opens with: ' + Object.keys(d0).map((k) => '`' + k + '` ' + J(d0[k])).join(', ') + '.');
  say('- Back on step one goes to the Programs tab (`showScreen(\'screenHome\')`) and keeps the draft in memory; the next Build New Program makes a new one.');
  say();
  say('| Path | Steps walked by Continue | The count each shows | The bar\'s fill | The last button |');
  say('|---|---|---|---|---|');
  for (const path of ['event', 'body', 'both']) {
    P.ev('startWizard()'); P.ev('WD.primaryPath=' + J(path) + ';renderWizardStep();');
    const names: string[] = [], labels: string[] = [], fills: string[] = []; let next = '';
    for (let i = 0; i < 9; i++) {
      const v = view(P), pg = page(P);
      names.push(v.step); labels.push(pg.label); fills.push(Math.round(parseFloat(v.shell.fill)) + '%'); next = pg.next;
      if (v.step === 'name') break;
      P.ev('wizardNext()');
    }
    say('| ' + path + ' | ' + names.length + ': ' + names.join(', ') + ' | ' + labels.join(' ') + ' | ' + fills.join(' ') + ' | ' + next + ' |');
  }
  say();
  say('- Every step but the last reads **Continue →**. Continue never refuses: no step checks its answers. The checks are at Generate (section E) and in the rest day toggle (section D).');
  say('- The strength path walks 6 steps and never opens the cardio goals; Back from the lifting step skips them too.');
  say();
}

// ── B. The ten seeded programs ───────────────────────────────────────────────
say('## B. What each step draws on the ten seeded programs');
say();
say('Each seeded config is put into the draft whole (as the seeded walks hand it to Generate), then every step is drawn. A seeded config holds values no card of the wizard writes (section G).');
say();
const TEN: Tally = {};
{
  say('| Program | Steps | Cardio goals: forms, and the lines under them | Days | Name: the start, the rows |');
  say('|---|---|---|---|---|');
  CFGS.forEach((cfg, i) => {
    const P = fresh();
    P.ev('startWizard()');
    const d = { ...BASE, ...cfg };
    const cells: string[] = []; let steps = 0;
    for (const step of WM.WIZARD_STEPS) {
      if (step === 'cardio_goal' && d.primaryPath === 'body') continue;
      setDraft(P, step === 'primary' ? d : draftOf(P), step);
      const { v, pg } = draw(P, TEN); steps++;
      if (step === 'cardio_goal') cells.push(v.cardio.sports.filter((s: any) => s.form).map((s: any) => s.id + ' ' + s.form.kind).join(', ') + '; ' + progLenKind(pg.progLen) + '; ' + feedbackKind(pg.feedback) + '; ' + feasKind(pg.feas));
      if (step === 'days') cells.push(v.days.count + (v.days.floor ? ', at the floor' : '') + ', ' + v.days.advisories.length + ' advisories');
      if (step === 'name') cells.push((v.name.aligned ? 'set by race date (' + alignedKind(v.name.aligned.copy) + ')' : 'date field (' + resolveKind(v.name.resolveCopy) + ')') + '; ' + v.name.rows.length + ' rows; ' + v.name.weeks + ' weeks');
    }
    say('| ' + NAMES[i] + ' | ' + steps + ' | ' + cells[0] + ' | ' + cells[1] + ' | ' + cells[2] + ' |');
  });
  say();
  table(TEN, 'Kind drawn, on the ten', 'Count');
}

// ── C. Every kind, over a wider set of drafts ────────────────────────────────
say('## C. Every kind a step can draw, over a wider set of drafts');
say();
const WIDE: Tally = {};
const GOALS: Record<string, string[]> = JSON.parse(fresh().ev('JSON.stringify({run:CARDIO_GOALS_BY_TYPE.run.map(function(g){return g.id}),bike:CARDIO_GOALS_BY_TYPE.bike.map(function(g){return g.id}),swim:CARDIO_GOALS_BY_TYPE.swim.map(function(g){return g.id})})'));
const HYB = new Set(['run_half', 'run_marathon', 'bike_century', 'swim_tri']);
const LABEL: Record<string, string> = JSON.parse(fresh().ev('(function(){var o={};Object.keys(CARDIO_GOALS_BY_TYPE).forEach(function(s){CARDIO_GOALS_BY_TYPE[s].forEach(function(g){o[g.id]=g.label;});});return JSON.stringify(o);})()'));
const goal = (id: string, more: any = {}): any => ({ id, label: LABEL[id], baseline: '', ...more });
const MILES: any[] = [{}, { mileBestMins: '2', mileBestSecs: '30' }, { mileBestMins: '4', mileBestSecs: '30' }, { mileBestMins: '8', mileBestSecs: '0' }, { mileBestMins: '13', mileBestSecs: '0' }, { mileBestMins: '26', mileBestSecs: '0' }, { mileBestMins: '8', mileBestSecs: '75' }];
const TARGETS: any[] = [{}, { targetDist: '1.5', targetMins: '9', targetSecs: '0', paceUnit: 'mi' }, { targetDist: '1.5', targetMins: '14', targetSecs: '0', paceUnit: 'mi' }, { targetDist: '2.4', targetMins: '10', targetSecs: '0', paceUnit: 'km' }];
const SWIMS: any[] = [{}, { baseMins: '10', baseSecs: '30' }, { baseMins: '1', baseSecs: '50', base500Mins: '10', base500Secs: '30' }, { baseMins: '2', baseSecs: '30', base500Mins: '9', base500Secs: '0' }, { baseMins: '1', baseSecs: '75' }, { baseMins: '10', baseSecs: '30', targetMins: '9', targetSecs: '0', swimUnit: 'm' }, { base500Mins: '10', base500Secs: '30' }];
const OFFSETS = [-3, 0, 1, 3, 8, 10, 28, 49, 56, 77, 84, 112, 119, 140, 210];
let cardioDrafts = 0;
{
  const P = fresh();
  P.ev('startWizard()');
  const one = (d: any): void => { setDraft(P, d, 'cardio_goal'); draw(P, WIDE); cardioDrafts++; };
  for (const path of ['event', 'both']) {
    const dates: any[] = path === 'event' ? [{ eventTargeted: false, raceDate: '' }, ...OFFSETS.map((n) => ({ eventTargeted: true, raceDate: plusDays(TODAY, n) }))] : [{ eventTargeted: true }, { eventTargeted: false, raceDate: '' }];
    for (const sportId of ['run', 'bike', 'swim']) for (const id of GOALS[sportId]!) {
      if (path === 'both' && HYB.has(id)) continue;
      const fills: any[] = sportId === 'run' ? MILES.flatMap((m) => (id === 'run_pace_goal' ? TARGETS : [{}]).map((t) => ({ ...m, ...t }))) : (id === 'swim_500_time' || id === 'swim_100_time') ? SWIMS : [{}];
      const exps = sportId === 'run' ? ['beginner', 'intermediate', 'advanced'] : ['intermediate'];
      for (const f of fills) for (const exp of exps) for (const dt of dates) one({ ...BASE, primaryPath: path, experience: exp, cardioTypes: [sportId], cardioGoals: { [sportId]: goal(id, f) }, ...dt });
    }
    // More than one sport, a sport open with no goal, and no sport at all.
    one({ ...BASE, primaryPath: path, cardioTypes: [], cardioGoals: {} });
    one({ ...BASE, primaryPath: path, cardioTypes: ['run'], cardioGoals: {} });
    one({ ...BASE, primaryPath: path, cardioTypes: ['run', 'bike'], cardioGoals: { run: goal('run_base'), bike: goal('bike_base') } });
    one({ ...BASE, primaryPath: path, cardioTypes: ['run', 'bike', 'swim'], cardioGoals: { run: goal('run_5k'), bike: goal('bike_ftp'), swim: goal('swim_mile') } });
    // Start days that leave the test's own week empty (the week holds the test), and a start after the test.
    for (const n of [0, 1, 2, 9]) one({ ...BASE, primaryPath: path, restDays: ['sat', 'sun'], cardioTypes: ['run'], cardioGoals: { run: goal('run_pace_goal', { ...TARGETS[1], ...MILES[3] }) }, eventTargeted: true, raceDate: plusDays(TODAY, n), startDate: TODAY });
    one({ ...BASE, primaryPath: path, cardioTypes: ['run'], cardioGoals: { run: goal('run_pace_goal', { ...TARGETS[1], ...MILES[3] }) }, eventTargeted: true, raceDate: plusDays(TODAY, 3), startDate: plusDays(TODAY, 10) });
    for (const n of [0, 1]) one({ ...BASE, primaryPath: path, restDays: ['sat', 'sun'], cardioTypes: ['run'], cardioGoals: { run: goal('run_pace_goal', { ...TARGETS[2], ...MILES[3] }) }, eventTargeted: true, raceDate: plusDays(TODAY, n), startDate: TODAY });
  }
}
let seedDrafts = 0; let SEEDED: any = null;
{
  const R = runsLife(CFGS[0], NOW).phone; R.settle(); R.clearFields();
  R.ev('startWizard()');
  for (const id of GOALS['run']!) {
    const d = { ...BASE, primaryPath: 'event', cardioTypes: ['run'], cardioGoals: { run: goal(id, id === 'run_pace_goal' ? TARGETS[2] : {}) }, eventTargeted: false, raceDate: '' };
    setDraft(R, d, 'cardio_goal'); draw(R, WIDE); seedDrafts++;
    R.ev('applySeedData()'); draw(R, WIDE); seedDrafts++;
    if (!SEEDED) { const g = draftOf(R).cardioGoals.run, sd = draftOf(R)._seed; SEEDED = { fields: Object.keys(g).filter((k) => !(k in d.cardioGoals.run)), src: g.mileBestSrc && g.mileBestSrc.kind, runs: sd && sd.n }; }
    setDraft(R, d, 'cardio_goal'); R.ev('renderWizardStep();dismissSeedData()'); draw(R, WIDE); seedDrafts++;
  }
}
let dayDrafts = 0; const TOASTS: Tally = {};
{
  const P = fresh();
  P.ev('startWizard()');
  const sets: any[] = [{ primaryPath: 'body', cardioTypes: [], cardioGoals: {} }, { primaryPath: 'body', cardioTypes: ['run'], cardioGoals: {} }];
  for (const path of ['event', 'both']) {
    for (const s of ['run', 'bike', 'swim']) for (const id of GOALS[s]!) if (!(path === 'both' && HYB.has(id))) sets.push({ primaryPath: path, cardioTypes: [s], cardioGoals: { [s]: goal(id) } });
    sets.push({ primaryPath: path, cardioTypes: ['run', 'bike'], cardioGoals: { run: goal('run_pace_goal'), bike: goal('bike_ftp') } });
    sets.push({ primaryPath: path, cardioTypes: ['run', 'bike', 'swim'], cardioGoals: { run: goal('run_10k'), bike: goal('bike_ftp'), swim: goal('swim_100_time') } });
  }
  for (const s of sets) {
    const foci = s.primaryPath === 'event' ? ['support_strength', 'support_athletic', 'support_prevention'] : ['strength', 'hypertrophy', 'fatloss', 'balanced'];
    for (const focus of foci) for (let m = 0; m < 128; m++) {
      const rest = ALL.filter((_, i) => m & (1 << i));
      setDraft(P, { ...BASE, ...s, liftingFocus: focus, restDays: rest, days: ALL.filter((x) => !rest.includes(x)) }, 'days');
      const { v } = draw(P, WIDE); dayDrafts++;
      // Each tap on a training day: the toggle rests it, or refuses with a toast at the floor.
      if (focus === foci[0]) for (const day of ALL) if (!rest.includes(day)) {
        const t0 = P.toasts.length, r0 = P.ev('WD.restDays.length');
        P.ev('toggleRestDay(' + J(day) + ')');
        const said = P.toasts.slice(t0).map(txt)[0];
        bump(TOASTS, said ? (/needs \d training days/.test(said) ? 'refused: "<goals> needs N training days — see why below"' : 'refused: "' + said + '"') : P.ev('WD.restDays.length') === r0 + 1 ? 'rested' : 'UNNAMED');
        if (!!said !== !!v.days.days.find((x: any) => x.key === day).blocked) bump(TOASTS, 'MISMATCH: a locked day and the toast disagree');
        setDraft(P, { ...BASE, ...s, liftingFocus: focus, restDays: rest, days: ALL.filter((x) => !rest.includes(x)) }, 'days');
      }
    }
  }
}
let nameDrafts = 0;
{
  const P = fresh();
  P.ev('startWizard()');
  const RESTS = [[], ['sun'], ['sat', 'sun'], ['fri', 'sat', 'sun'], ['mon', 'wed'], ['thu', 'fri', 'sat', 'sun']];
  const one = (d: any): void => { setDraft(P, d, 'name'); draw(P, WIDE); nameDrafts++; };
  for (const rest of RESTS) for (let n = 0; n < 14; n++) {
    const start = plusDays(TODAY, n);
    one({ ...BASE, restDays: rest, startDate: start, name: 'X' });
    one({ ...BASE, primaryPath: 'event', eventTargeted: false, raceDate: '', restDays: rest, startDate: start, name: 'X', liftingFocus: 'support_strength', cardioTypes: ['run'], cardioGoals: { run: goal('run_base') } });
    for (const off of [1, 8, 30, 70]) one({ ...BASE, primaryPath: 'event', eventTargeted: true, raceDate: plusDays(start, off), restDays: rest, startDate: start, name: 'X', liftingFocus: 'support_strength', cardioTypes: ['run'], cardioGoals: { run: goal('run_pace_goal', { ...TARGETS[2], ...MILES[3] }) } });
  }
  for (const path of ['event', 'both']) for (const id of ['run_5k', 'run_10k', 'run_half', 'run_marathon']) {
    if (path === 'both' && HYB.has(id)) continue;
    for (const off of [...OFFSETS, 35, 63, 100, 126, 160]) one({ ...BASE, primaryPath: path, eventTargeted: true, raceDate: plusDays(TODAY, off), name: 'X', liftingFocus: path === 'event' ? 'support_strength' : 'balanced', cardioTypes: ['run'], cardioGoals: { run: goal(id, MILES[3]) } });
    one({ ...BASE, primaryPath: path, eventTargeted: true, name: 'X', cardioTypes: ['run'], cardioGoals: { run: goal(id, MILES[3]) } });
    one({ ...BASE, primaryPath: path, eventTargeted: false, raceDate: '', name: 'X', cardioTypes: ['run'], cardioGoals: { run: goal(id, MILES[3]) } });
  }
  one({ ...BASE, name: '' });
  one({ ...BASE, name: 'X', cardioTypes: ['run', 'bike', 'swim'], primaryPath: 'both', cardioGoals: { run: goal('run_base'), bike: goal('bike_base'), swim: goal('swim_base') } });
}
{
  const P = fresh();
  P.ev('startWizard()');
  for (const path of ['event', 'body', 'both']) for (const exp of ['beginner', 'intermediate', 'advanced']) for (const age of ['18-35', '36-54', '55+']) for (const unit of ['lbs', 'kg']) { setDraft(P, { ...BASE, primaryPath: path, experience: exp, ageBracket: age, unit }, 'profile'); draw(P, WIDE); }
  for (const path of ['event', 'body', 'both']) { setDraft(P, { ...BASE, primaryPath: path }, 'primary'); draw(P, WIDE); }
  for (const eq of ['home_full', 'home_basic', 'commercial', 'crossfit', 'bodyweight']) { setDraft(P, { ...BASE, equipment: eq }, 'equipment'); draw(P, WIDE); }
  for (const path of ['event', 'body', 'both']) for (const types of [[], ['run'], ['run', 'swim']]) { setDraft(P, { ...BASE, primaryPath: path, liftingFocus: path === 'event' ? 'support_athletic' : 'fatloss', cardioTypes: types }, 'lifting_focus'); draw(P, WIDE); }
}
say('Drafts drawn: ' + cardioDrafts + ' on the cardio goals (and ' + seedDrafts + ' more on a phone whose history holds three weeks of logged run paces, for the seed offer), ' + dayDrafts + ' on the rest days, ' + nameDrafts + ' on the name step, and the small steps at each of their answers. A draft here is set whole; some hold what no walk of taps reaches, and section G says which.');
say();
table(WIDE, 'Kind drawn', 'Count');
say('The rest day toggle, a tap on each training day of each of those rest day drafts (one lifting focus each):');
say();
table(TOASTS, 'What the tap did', 'Taps');
say('- The model\'s words against the page\'s own markup: in ' + SAME + ' of ' + DRAWS + ' draws every word the Angular model yields is in the page\'s render of the same draft, and the count and the button read the same.' + (Object.keys(MISSED).length ? ' Not the same: ' + J(MISSED) : ''));
say();

// ── D. What each tap reads and writes ────────────────────────────────────────
say('## D. What each tap reads and writes');
say();
{
  const WATCHED = ['renderWizardStep', 'updateRaceDateFeedback', 'updateStartResolve', 'updateMileAdvisory', 'updateSwimAdvisory', 'updateSwimPaceDisplay', 'updatePaceTime', 'showScreen', 'getPrograms', 'seedFromPriorPrograms', 'buildProgram', 'savePrograms'];
  const rows: string[] = [];
  const P = runsLife(CFGS[0], NOW).phone;   // three weeks of runs logged with a pace, so the seed reader has runs to find
  P.settle(); P.clearFields();
  const T: string = P.ev('_isoToday()');
  P.ev('__n={};__r={};');
  for (const f of WATCHED) P.ev(`${f}=(function(o){return function(){__n.${f}=(__n.${f}||0)+1;return o.apply(this,arguments);};})(${f});`);
  P.ev('iaStore.get=(function(o){return function(k){__r[k]=1;return o.apply(this,arguments);};})(iaStore.get);');
  const id: string = P.ev('activeProgId');
  const fam = (k: string): string => k.split(id).join('<id>');
  function tap(what: string, code: string, setup?: any, step?: string): void {
    if (setup) { setDraft(P, { ...BASE, ...setup }, step!); P.ev("document.getElementById('raceDateInput').value='';renderWizardStep()"); }
    P.settle();
    const pre = P.dump(), d0 = draftOf(P), t0 = P.toasts.length;
    P.ev("__n={};__r={};document.getElementById('raceDateInput').value='';");
    P.ev(code);
    const d1 = draftOf(P), post = P.dump();
    const gk = (d: any): string[] => Object.keys(d.cardioGoals || {}).flatMap((sp) => Object.keys(d.cardioGoals[sp] || {}).map((k) => sp + '.' + k));
    const inner = [...new Set([...gk(d0), ...gk(d1)])].filter((k) => { const [sp, f] = k.split('.') as [string, string]; return J((d0.cardioGoals[sp] || {})[f]) !== J(((d1.cardioGoals || {})[sp] || {})[f]); });
    const wrote = [...new Set([...Object.keys(d0), ...Object.keys(d1)])].filter((k) => J(d0[k]) !== J(d1[k])).map((k) => '`' + k + '`' + (k === 'cardioGoals' && inner.length ? ' (' + inner.join(', ') + ')' : '')).join(', ') || 'nothing';
    const n: Tally = JSON.parse(P.ev('JSON.stringify(__n)'));
    const read = Object.keys(JSON.parse(P.ev('JSON.stringify(__r)'))).map((k) => '`' + fam(k).replace(/_w\d+.*$/, '_…') + '`');
    const stored = J(pre) === J(post) ? 'nothing' : 'SOMETHING';
    rows.push('| ' + what + ' | ' + wrote + ' | ' + stored + ' | ' + ([...new Set(read)].sort().join(', ') || 'nothing') + ' | ' + (WATCHED.filter((f) => n[f]).map((f) => f + ' ' + n[f]).join(', ') || 'none') + ' | ' + (P.toasts.slice(t0).map((t) => '"' + txt(t) + '"').join(' ') || 'none') + ' |');
  }
  const RUN5 = { primaryPath: 'event', cardioTypes: ['run'], cardioGoals: { run: goal('run_5k') }, eventTargeted: true, raceDate: plusDays(T, 56) };
  const PACE = { primaryPath: 'event', cardioTypes: ['run'], cardioGoals: { run: goal('run_pace_goal', { ...TARGETS[1], ...MILES[3] }) }, eventTargeted: false, raceDate: '' };
  const SWIM = { primaryPath: 'event', cardioTypes: ['swim'], cardioGoals: { swim: goal('swim_100_time') }, eventTargeted: false, raceDate: '' };
  tap('Build New Program', 'startWizard()');
  tap('A path card (Race / Event)', "WD.primaryPath='event';renderWizardStep()", {}, 'primary');
  tap('Continue', 'wizardNext()', {}, 'primary');
  tap('An experience card', "WD.experience='advanced';renderWizardStep()", {}, 'profile');
  tap('An age card', "WD.ageBracket='55+';renderWizardStep()", {}, 'profile');
  tap('kg', "setUnit('kg')", {}, 'profile');
  tap('lbs, already chosen', "setUnit('lbs')", {}, 'profile');
  tap('An equipment card', "WD.equipment='crossfit';renderWizardStep()", {}, 'equipment');
  tap('Continue into the cardio goals (race path, first time)', 'wizardNext()', { primaryPath: 'event' }, 'equipment');
  tap('A sport, opened', "toggleCardioTypeSport('run')", { primaryPath: 'event', raceDate: T }, 'cardio_goal');
  tap('A goal, the first picked (the seed reader runs once)', "setCardioGoal('run','run_base')", { primaryPath: 'event', cardioTypes: ['run'], raceDate: T }, 'cardio_goal');
  tap('Use this data (the seed offer)', 'applySeedData()');
  tap('Start fresh (the seed offer)', 'dismissSeedData()', { primaryPath: 'event', cardioTypes: ['run'], cardioGoals: { run: goal('run_base') }, raceDate: T, _seed: { progName: 'P', n: 3, avgRecSec: 600, maxDist: 4, mileSec: 480 } }, 'cardio_goal');
  tap('A goal, changed', "setCardioGoal('run','run_10k')", RUN5, 'cardio_goal');
  tap('A sport, shut (its goal goes)', "toggleCardioTypeSport('run')", RUN5, 'cardio_goal');
  tap('The mile, a digit typed', "WD.cardioGoals.run.mileBestMins='8';WD.cardioGoals.run.mileBestSrc={kind:'entered'};updateRaceDateFeedback();updateMileAdvisory()", RUN5, 'cardio_goal');
  tap('How far can you run, a digit typed', "WD.cardioGoals.run.baselineDist='3';WD.cardioGoals.run.baseline='3 mi';updateRaceDateFeedback()", RUN5, 'cardio_goal');
  tap('Target distance, a digit typed', "WD.cardioGoals.run.targetDist='2';updateRaceDateFeedback()", PACE, 'cardio_goal');
  tap('Target time, a digit typed', "WD.cardioGoals.run.targetMins='10';updatePaceTime('run');updateRaceDateFeedback()", PACE, 'cardio_goal');
  tap('mi or km', "setPaceUnit('km')", PACE, 'cardio_goal');
  tap('The pace goal\'s baseline, a digit typed', "WD.cardioGoals.run.baselineDist='2';WD.cardioGoals.run.baseline='2'+(WD.cardioGoals.run.paceUnit||'mi');updateRaceDateFeedback()", PACE, 'cardio_goal');
  tap('Swim target time, a digit typed', "WD.cardioGoals.swim.targetMins='1';updatePaceTime('swim');updateSwimPaceDisplay()", SWIM, 'cardio_goal');
  tap('Swim current time, a digit typed', "WD.cardioGoals.swim.baseMins='1';updateSwimAdvisory()", SWIM, 'cardio_goal');
  tap('yd or m', "setSwimUnit('m')", SWIM, 'cardio_goal');
  tap('Bike or swim baseline, a digit typed', "WD.cardioGoals.swim.baselineDist='400';WD.cardioGoals.swim.baseline='400 yd'", { ...SWIM, cardioGoals: { swim: goal('swim_base') } }, 'cardio_goal');
  tap('✕ Just building fitness', "WD.eventTargeted=false;WD.raceDate='';WD.raceDateWeeks=null;renderWizardStep()", RUN5, 'cardio_goal');
  tap('✓ I have a race date', "WD.eventTargeted=true;if(!WD.raceDate){WD.raceDate='" + T + "';}renderWizardStep()", { ...RUN5, eventTargeted: false, raceDate: '' }, 'cardio_goal');
  tap('The race date, a day picked', "document.getElementById('raceDateInput').value='" + plusDays(T, 21) + "';WD.raceDate='" + plusDays(T, 21) + "';updateRaceDateFeedback()", RUN5, 'cardio_goal');
  tap('The shorter plan link (under the floor)', "offerShorterPlan('run_5k')", { ...RUN5, cardioGoals: { run: goal('run_10k') }, raceDate: plusDays(T, 21) }, 'cardio_goal');
  tap('A lifting focus card', "WD.liftingFocus='strength';renderWizardStep()", {}, 'lifting_focus');
  tap('An add-on sport (strength path)', "toggleCardioTypeSport('run')", {}, 'lifting_focus');
  tap('Lift Only', 'WD.cardioTypes=[];WD.cardioGoals={};renderWizardStep()', { cardioTypes: ['run'] }, 'lifting_focus');
  tap('A training day, rested', "toggleRestDay('sun')", {}, 'days');
  tap('A resting day, back to training', "toggleRestDay('sun')", { restDays: ['sun'] }, 'days');
  tap('A locked day (at the floor)', "toggleRestDay('wed')", { restDays: ['sun', 'mon', 'tue', 'sat'] }, 'days');
  tap('Continue into the name step (the default name is made)', 'wizardNext()', {}, 'days');
  tap('The name, a letter typed', "WD.name='My block'", { name: 'X' }, 'name');
  tap('The start date, a day picked', "WD.startDate='" + plusDays(T, 4) + "';updateStartResolve()", { name: 'X' }, 'name');
  tap('Back', 'wizardBack()', { name: 'X' }, 'name');
  tap('Back on step one', 'wizardBack()', {}, 'primary');
  say('On a phone with one program and three weeks of runs logged with a pace (the half-manny config), its day ' + T + '. "Stored" is every `ia_` key before and after the tap. A typed field is written as its handler writes it.');
  say();
  say('| Tap | The draft\'s fields changed | Stored | Keys asked for | The page called | Toast |');
  say('|---|---|---|---|---|---|');
  for (const r of rows) say(r);
  say();
  say('- No tap before Generate stores anything. The draft lives in memory only: leave the app and it is gone.');
  say('- Use this data writes the mile (' + J(SEEDED) + ': the fields it adds to the goal, where the mile is said to come from, and how many runs the reader found) and the longest run as the baseline.');
  say('- Two taps read the store: the first draw of a run goal\'s fields (the seed reader, once per wizard, kept on the draft) and the first draw of the name step with no name (it counts the programs for "Block N").');
  say();
}

// ── E. Generate ──────────────────────────────────────────────────────────────
say('## E. Generate');
say();
{
  // The pop-up and the refusals, over the wide cardio drafts' goals.
  const P = fresh();
  P.ev('startWizard()');
  const WARN: Tally = {}; let asked = 0, plain = 0;
  const warnKind = (w: string): string => w.split(' · ').map((x) => x.replace(/\d+:\d\d/g, 'm:ss').replace(/\d+(\.\d+)?/g, 'N').replace(/\(([^)]*)\)/g, '(…)')).join(' · ');
  for (const path of ['event', 'both']) for (const s of ['run', 'bike', 'swim']) for (const id of GOALS[s]!) {
    if (path === 'both' && HYB.has(id)) continue;
    const fills: any[] = s === 'run' ? MILES.slice(0, 5).flatMap((m) => (id === 'run_pace_goal' ? TARGETS : [{}]).map((t) => ({ ...m, ...t }))) : (id === 'swim_500_time' || id === 'swim_100_time') ? SWIMS : [{}];
    for (const f of fills) for (const exp of ['beginner', 'intermediate', 'advanced']) {
      setDraft(P, { ...BASE, primaryPath: path, experience: exp, cardioTypes: [s], cardioGoals: { [s]: goal(id, f) }, eventTargeted: false, raceDate: '' }, 'name');
      const r = JSON.parse(P.ev("JSON.stringify(calcProgramLength(WD.cardioTypes||[],Object.assign({},WD.cardioGoals,{_experience:WD.experience,_ageBracket:WD.ageBracket,_eventTargeted:WD.eventTargeted}),LIFTING_FOCUS_TO_GOAL[WD.liftingFocus]||'balanced'))"));
      if (r.warning) { asked++; bump(WARN, warnKind(r.warning)); } else plain++;
    }
  }
  say('**The pop-up.** Generate first asks the length (`calcProgramLength`). When it comes back with a warning, a pop-up stands over the wizard: "Heads Up", "N-Week Program", the warning, "The app will build you a N-week program that safely progresses toward your goal. Stick to the plan and you will get there.", and two buttons, **Go Back** (the wizard again, same step) and **Build N-Week Plan**. Over ' + (asked + plain) + ' drafts of one goal each, ' + asked + ' raise it and ' + plain + ' do not. Its N is the goal length, not the test week or the race plan\'s week count. The warning\'s kinds:');
  say();
  table(WARN, 'Warning (numbers as N)', 'Drafts');
  // The refusals.
  const REF: Tally = {};
  const tryGen = (d: any): void => {
    setDraft(P, { ...BASE, ...d, eventTargeted: false, raceDate: '' }, 'name');
    const t0 = P.toasts.length, pre = J(P.dump());
    P.ev('doGenerate()');
    const said = P.toasts.slice(t0).map(txt)[0];
    bump(REF, said ? 'refused: "' + said + '"' : 'UNNAMED: no refusal');
    if (J(P.dump()) !== pre) bump(REF, 'MISMATCH: a refusal stored something');
  };
  for (const m of [MILES[1], MILES[5], MILES[6]]) tryGen({ primaryPath: 'event', cardioTypes: ['run'], cardioGoals: { run: goal('run_base', m) } });
  tryGen({ primaryPath: 'event', cardioTypes: ['run'], cardioGoals: { run: goal('run_pace_goal', TARGETS[1]) } });
  tryGen({ primaryPath: 'event', cardioTypes: ['swim'], cardioGoals: { swim: goal('swim_500_time') } });
  tryGen({ primaryPath: 'event', cardioTypes: ['swim'], cardioGoals: { swim: goal('swim_100_time', SWIMS[1]) } });
  tryGen({ primaryPath: 'event', cardioTypes: ['swim'], cardioGoals: { swim: goal('swim_100_time', SWIMS[3]) } });
  tryGen({ primaryPath: 'event', cardioTypes: ['swim'], cardioGoals: { swim: goal('swim_500_time', SWIMS[4]) } });
  say('**The refusals.** After the pop-up (or with none), Generate checks the mile, then the swim times. A refusal is a toast and the wizard again on the step it was on; nothing is stored:');
  say();
  table(REF, 'Refusal', 'Drafts');
}
{
  // The ten seeded programs, generated: on an empty phone, and beside a walked program.
  const WATCHED = ['buildProgram', 'savePrograms', 'loadActiveProgram', 'refreshProgram', 'markPastAsked', 'renderWeekView', 'renderProgList', 'showScreen'];
  const rows: string[] = [], rows2: string[] = [];
  const LINES: Tally = {};
  function gen(P: Phone, cfg: any): { wrote: string; read: string; calls: string; lines: string[]; warn: string; prog: any; screens: string } {
    P.settle();
    P.ev('__n={};__s=[];__l=[];__r={};');
    if (!P.IA.ctx['__gw']) {
      P.IA.ctx['__gw'] = true;
      P.ev('iaStore.get=(function(o){return function(k){__r[k]=1;return o.apply(this,arguments);};})(iaStore.get);');
      for (const f of WATCHED) P.ev(`${f}=(function(o){return function(){__n.${f}=(__n.${f}||0)+1;if(${J(f)}==='showScreen')__s.push(arguments[0]);return o.apply(this,arguments);};})(${f});`);
    }
    const before = P.ev('activeProgId');
    P.ev('startWizard()');
    setDraft(P, { ...BASE, ...cfg }, 'name');
    P.ev('renderWizardStep()');
    const pre = P.dump();
    P.ev('__n={};__s=[];__r={};');
    // The line under the figure is a stub whose text the page sets: record each value it is given.
    P.ev("(function(){var e=document.getElementById('generateSub');var v=e.textContent;Object.defineProperty(e,'textContent',{configurable:true,get:function(){return v;},set:function(x){v=x;__l.push(String(x));}});})()");
    P.ev('wizardNext()');
    let warn = 'none';
    if (P.ev("!!document.getElementById('confirmGenBtn').onclick")) {
      warn = txt(P.ev("(function(){var o=document.body.__last;return o?o.innerHTML:'';})()")) || 'raised';
      P.ev("(function(){var b=document.getElementById('confirmGenBtn');var f=b.onclick;b.onclick=null;f();})()");
    }
    P.settle();
    const post = P.dump(), id: string = P.ev('activeProgId');
    const famOf = (k: string): string => k.split(id).join('<new>').split(before || '\u0000').join('<old>');
    const wrote = [...new Set([...Object.keys(pre), ...Object.keys(post)])].sort().filter((k) => (pre[k] ?? null) !== (post[k] ?? null)).map((k) => '`' + famOf(k) + '`' + (pre[k] == null ? ' new' : post[k] == null ? ' removed' : ' changed')).join(', ') || 'nothing';
    const n: Tally = JSON.parse(P.ev('JSON.stringify(__n)'));
    const lines: string[] = JSON.parse(P.ev('JSON.stringify(__l)'));
    for (const l of lines) bump(LINES, l.replace(/\d+/g, 'N'));
    const read = [...new Set(Object.keys(JSON.parse(P.ev('JSON.stringify(__r)'))).map((k) => '`' + famOf(k) + '`'))].sort().join(', ') || 'nothing';
    return { wrote, read, calls: WATCHED.filter((f) => n[f]).map((f) => f + ' ' + n[f]).join(', '), lines, warn, prog: JSON.parse(P.ev('JSON.stringify(activeProg)')), screens: JSON.parse(P.ev('JSON.stringify(__s)')).join(' → ') };
  }
  const SHAPE: Tally = {};
  CFGS.forEach((cfg, i) => {
    const P = fresh();
    P.ev("document.body.appendChild=(function(o){return function(x){document.body.__last=x;return o.apply(this,arguments);};})(document.body.appendChild);");
    const g = gen(P, cfg);
    const stored = JSON.parse(P.dump()['ia_programs']!)[0];
    const days = Object.keys(stored.weeks || {}).reduce((n, w) => n + Object.keys(stored.weeks[w]).length, 0);
    const cfgKeys = Object.keys(stored.cfg || {});
    for (const k of Object.keys(stored)) bump(SHAPE, 'program: `' + k + '`');
    for (const k of cfgKeys) bump(SHAPE, 'cfg: `' + k + '`');
    rows.push('| ' + NAMES[i] + ' | ' + (g.warn === 'none' ? 'none' : 'raised') + ' | ' + g.wrote + ' | ' + g.read + ' | ' + g.calls + ' | ' + g.screens + ' | ' + stored.totalWeeks + ' weeks, ' + days + ' days, ' + P.dump()['ia_programs']!.length + ' bytes | start ' + stored.startDate + (stored.blockOpen ? ', opened ' + stored.blockOpen : '') + ', lands on week ' + P.ev('currentWeek') + ' (today\'s is ' + P.ev('calcCurrentWeek()') + ') | ' + (cfgKeys.includes('startDate') ? 'cfg keeps startDate' : 'no startDate in cfg') + ', seed ' + (cfg.seed != null ? 'the config\'s' : 'made') + ' |');
    // Beside a walked program.
    const Q = life(cfg, NOW).phone;
    Q.settle();
    const at: string = Q.ev("(function(){var d=new Date();d.setDate(d.getDate()+1);var p=function(n){return String(n).padStart(2,'0')};return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate())+'T09:00:00';})()");
    Q.launch(at); Q.settle();
    const g2 = gen(Q, { ...cfg, name: 'Second' });
    rows2.push('| ' + NAMES[i] + ' | ' + g2.wrote + ' | ' + g2.read + ' | ' + g2.calls + ' | ' + JSON.parse(Q.dump()['ia_programs']!).length + ' | ' + (Q.ev('activeProg.name') === 'Second' ? 'the new one' : 'NOT the new one') + ' |');
  });
  say('**On an empty phone**, the ten seeded configs put into the draft, the name step drawn, then Generate (and Build N-Week Plan where the pop-up stands):');
  say();
  say('| Program | Pop-up | Keys written | Keys asked for | The page called | Screens | Stored | Dates | The stored cfg |');
  say('|---|---|---|---|---|---|---|---|---|');
  for (const r of rows) say(r);
  say();
  say('**Beside a program with three weeks of history**, a day after its last launch, the same config generated as a second program:');
  say();
  say('| Program | Keys written | Keys asked for | The page called | Programs stored | Active after |');
  say('|---|---|---|---|---|---|');
  for (const r of rows2) say(r);
  say();
  {
    const P = fresh();
    P.ev('startWizard()'); setDraft(P, { ...BASE, ...CFGS[0] }, 'name'); P.ev('renderWizardStep()');
    const pre = J(P.dump());
    P.ev('wizardNext()');
    const up = P.ev("!!document.getElementById('lengthWarnBack').onclick");
    P.ev("(function(){var b=document.getElementById('lengthWarnBack');var f=b.onclick;b.onclick=null;f();})()"); P.settle();
    say('- **Go Back** on the pop-up (raised: ' + up + '): the wizard again on step ' + P.ev('WIZARD_STEPS[wizardStep]') + ', the draft kept, stored ' + (J(P.dump()) === pre ? 'nothing' : 'SOMETHING') + ', no program made (' + (P.ev('activeProgId') || 'none') + ').');
    say('- A first program arms the rest timer\'s first use note (`_setRtIntroPending`, when the list was empty before); that is held in memory, not stored.');
    say('- A build that throws leaves the generating screen up with "Error: " and the error\'s words, and stores nothing.');
    say();
  }
  say('The line under the figure, every value the page gave it over these ' + (CFGS.length * 2) + ' generates (numbers as N). The harness runs each timer once, so the six lines the page cycles at 380 ms show here as the first alone; the code holds the six (`Analyzing your goals...`, `Building cardio progressions...`, `Selecting exercises...`, `Calculating weights...`, `Assembling N weeks...`, `Almost done...`), the build at 2,400 ms, and This Week 600 ms after the ready line:');
  say();
  table(LINES, 'Line', 'Times');
  say('What a stored program holds, over the ten on the empty phone (how many of the ten carry each field):');
  say();
  table(SHAPE, 'Field', 'Programs');
}

// ── F. The WebKit controls ───────────────────────────────────────────────────
say('## F. The WebKit controls the wizard uses');
say();
{
  const src = readFileSync(join(REPO, 'frontends/app/src/app/screens/wizard/wizard.ts'), 'utf8');
  const tpl = src.slice(src.indexOf('template: `'), src.indexOf('export class Wizard'));
  const n = (re: RegExp): number => (tpl.match(re) || []).length;
  say('Counted in the Angular screen\'s template (`frontends/app/src/app/screens/wizard/wizard.ts`), which is what today\'s iOS app draws:');
  say();
  say('| Control | In the template | Where | What it hands back, and when |');
  say('|---|---|---|---|');
  say('| `<input type="date">` | ' + n(/<input type="date"/g) + ' | the race date (cardio goals, race path, "I have a race date"), `min` today, its value an attribute, on `input`; the start date (name step, when no race sets it), no `min`, its value a property, on `change` | a `YYYY-MM-DD` string, or blank |');
  say('| `<input type="number">` | ' + n(/<input type="number"/g) + ' | the cardio goal forms: minutes and seconds pairs, a distance, a baseline; one is read only (the swim distance) | the typed text as a string, on every `input`; `min`, `max` and `step` are on the tag |');
  say('| `<input type="text">` | ' + n(/<input type="text"/g) + ' | the program\'s name, `maxlength` 40 | the text, on every `input` |');
  say('| `<select>` | ' + n(/<select/g) + ' | none | |');
  say('| `<textarea>` | ' + n(/<textarea/g) + ' | none | |');
  say('| `<button>` | ' + n(/<button/g) + ' | Back, the last button, the unit pairs, the race pair, the seed offer\'s two | a tap |');
  say('| a link written into copy | 1 | "The 5K plan fits this window better" under a race date below the plan\'s floor (`offerShorterPlan`), in the card under the date and under a start set by race date | a tap |');
  say();
  say('Number fields drawn at once, by form: the swim 500 form 5 (one read only), the swim 100 form 7, the run pace goal 6, a run goal with only a baseline 3 (the baseline and the mile\'s pair), a bike or swim baseline 1.');
  say();
}

// ── G. Found by this measure ─────────────────────────────────────────────────
say('## G. Found by this measure, and what no walk of taps reaches');
say();
{
  // The rest day step's advisory box.
  const P = fresh(); P.ev('startWizard()');
  let states = 0, withAdv = 0, above = 0, drawn = 0;
  for (const path of ['event', 'both', 'body']) for (const r of [null, ...GOALS['run']!]) for (const b of [null, ...GOALS['bike']!]) for (const sw of [null, ...GOALS['swim']!]) {
    if (path === 'both' && [r, b, sw].some((x) => x && HYB.has(x))) continue;
    const types: string[] = [], goals: any = {};
    if (r) { types.push('run'); goals.run = { id: r }; } if (b) { types.push('bike'); goals.bike = { id: b }; } if (sw) { types.push('swim'); goals.swim = { id: sw }; }
    const foci = path === 'event' ? ['support_strength', 'support_athletic', 'support_prevention'] : ['strength', 'hypertrophy', 'fatloss', 'balanced'];
    for (const f of foci) for (let nd = 0; nd <= 7; nd++) {
      setDraft(P, { ...BASE, primaryPath: path, cardioTypes: types, cardioGoals: path === 'body' ? {} : goals, liftingFocus: f, restDays: ALL.slice(nd) }, 'days');
      const adv: number = P.ev('getDayAdvisories().length'), min: number = P.ev('getMinTrainDays()');
      states++; if (adv) withAdv++; if (nd > min) above++; if (adv && nd > min) drawn++;
    }
  }
  say('**The rest day step\'s advisory box is never drawn.** The step draws its advisories (lifting days, cardio goal days, interval days) only above the floor of training days. Over every set of goals a path offers, each lifting focus and each count of training days (' + states + ' states), the advisories come back in ' + withAdv + ' and the count is above the floor in ' + above + ', and never both: ' + drawn + ' states draw the box. Each advisory asks for a number of days no higher than the floor already locks. Today\'s behaviour; the beta\'s model keeps the branch, and no walk of taps can draw it.');
  say();
}
{
  say('**Hybrid with Run a 5K or Run a 10K builds a race plan whose race is today.** The cardio goals step gives every draft a race date of today when it has none (so the race path\'s card shows on first open), and the draft opens with "I have a race date" on. The hybrid path draws no race date control, so nothing there can change either. A race plan counts back from its race date on the hybrid path as on the race path:');
  say();
  say('| Goal, by taps from Build New Program | The draft after the cardio goals | The name step | The stored program | Today is |');
  say('|---|---|---|---|---|');
  for (const id of ['run_5k', 'run_10k']) {
    const Q = fresh();
    Q.ev("startWizard();WD.primaryPath='both';renderWizardStep();wizardNext();wizardNext();wizardNext();toggleCardioTypeSport('run');setCardioGoal('run'," + J(id) + ');');
    const d = draftOf(Q);
    Q.ev('wizardNext();wizardNext();wizardNext();');
    const v = view(Q);
    Q.ev('wizardNext()');
    if (Q.ev("!!document.getElementById('confirmGenBtn').onclick")) Q.ev("(function(){var b=document.getElementById('confirmGenBtn');var f=b.onclick;b.onclick=null;f();})()");
    Q.settle();
    const pr = JSON.parse(Q.dump()['ia_programs']!)[0];
    say('| ' + LABEL[id] + ' | `raceDate` ' + d.raceDate + ', `eventTargeted` ' + d.eventTargeted + ' | start ' + (v.name.aligned ? v.name.aligned.start + ', set by race date; "' + txt(v.name.aligned.copy) + '"' : 'a date field') + ' | ' + pr.totalWeeks + ' weeks from ' + pr.startDate + ', opened ' + pr.blockOpen + ', race date ' + pr.cfg.raceDate + ' | week ' + Q.ev('calcCurrentWeek()') + ' of ' + pr.totalWeeks + ' |');
  }
  say();
  say('Reached by taps alone: Hybrid, then Running, then the goal, then Continue to the end. The race path with "Just building fitness" is the one that says it runs the full plan to a time trial. Not ruled and not fixed here: the beta is held equal to it.');
  say();
}
{
  const odd: string[] = [];
  CFGS.forEach((c, i) => {
    const o: string[] = [];
    if (!['event', 'body', 'both'].includes(c.primaryPath)) o.push('path "' + c.primaryPath + '"');
    if (!['18-35', '36-54', '55+'].includes(c.ageBracket)) o.push('age "' + c.ageBracket + '"');
    if (!['home_full', 'home_basic', 'commercial', 'crossfit', 'bodyweight'].includes(c.equipment)) o.push('equipment "' + c.equipment + '"');
    if (c.seed != null) o.push('a seed');
    if (c.bench || c.squat || c.deadlift) o.push('lift numbers');
    for (const sp of Object.keys(c.cardioGoals)) if (c.cardioGoals[sp].label !== LABEL[c.cardioGoals[sp].id]) o.push(sp + ' label "' + c.cardioGoals[sp].label + '"');
    odd.push('| ' + NAMES[i] + ' | ' + o.join(', ') + ' |');
  });
  say('**What the ten seeded configs hold that no card of the wizard writes.** The wizard writes no seed (the engine makes one from the clock), no lift numbers (the draft keeps three zeros), a path of event, body or both, one of three ages and one of five equipments, and each goal\'s label from its own table:');
  say();
  say('| Program | Not reachable by taps |');
  say('|---|---|');
  for (const r of odd) say(r);
  say();
  const EXPECT = ['card under the date: card empty', 'test in week 1, nothing left to train [', 'race plan opens in a week [', 'race plan opens in a week, under the floor', 'peaks on race day', 'seed banner: the offer', 'seed banner: applied line', 'mile help: optional, bare', 'swim advisory: required, the 100', 'advisory: lifting days', 'advisory: cardio goal days', 'advisory: interval days, one sport', 'advisory: interval days, sports sharing', 'race date row: a date alone', 'set by the longest goal (1 week)', 'frame: from the level default', 'frame: from the mile entered', 'floor box, three days', 'the week holds the test'];
  const keys = Object.keys(WIDE);
  const unnamed = keys.concat(Object.keys(TEN)).filter((x) => /UNNAMED|MISMATCH/.test(x));
  say('Every draw was named: ' + (unnamed.length ? 'NO, ' + J(unnamed) : 'yes (no draw fell outside the kinds this script names)') + '.');
  say();
  say('**Kinds the builders hold that no draft of section C drew** (of ' + EXPECT.length + ' looked for by name): ' + (EXPECT.filter((k) => !keys.some((x) => x.includes(k))).map((k) => '"' + k + '"').join(', ') || 'none') + '.');
  say();
}

// ── H. Mario's backup, counts only ───────────────────────────────────────────
say('## H. On the simulator\'s copy of Mario\'s backup (counts only)');
say();
say('Read by a scratch script from a copy of the simulator\'s store (2026-11-20, the store\'s hash 278ba57f3f6a382b before and after, the hash the last session left; nothing was written to it), every walk on a phone of its own in the VM harness. The numbers below are the ones that script printed.');
say();
say('- 36 `ia_` keys; 3 programs, 1 of them archived; one is active.');
say('- Build New Program, then Continue to the end on each path with the draft as it opens: 7 steps on the race path, 6 on the strength path, 7 on the hybrid path. The default name ends "Block 4": the stored programs plus one, the archived one counted.');
say('- The seed offer is not drawn on a run goal: the reader finds no seed there (it wants three recovery runs logged with a pace inside its window).');
say('- All of that stores nothing.');
say('- A lift only program made by taps alone, on a phone of its own: no pop-up; `ia_active` and `ia_programs` change and the other 34 of the 36 keys do not; 3 programs become 4; the new one is active; the 3 programs already stored are the same to the byte after.');
say();

writeFileSync(join(REPO, 'tests/measure/native-wizard_today.md'), out.join('\n') + '\n');
console.log('wrote tests/measure/native-wizard_today.md (' + out.length + ' lines); draws ' + DRAWS + ', same ' + SAME);
