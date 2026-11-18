// native-cardio-sheet: today's run card, the cardio sheet (its log's run fields, its wheels, its sport picker,
// logCardio, a done run's Reopen) and the rest timer, before the Expo app draws them (MIGRATION.md phase 3, row 3).
// Read-only (measure). It runs today's page in the VM harness on the test phone of tests/support/stored-state.ts
// and reads the stored keys before and after each step.
//
// A. Where the cardio sheet shows: every training day of the ten programs as generated, by sport, by the form its
//    log draws, by whether lift work stands beside it (the sheet's Done and Skip), and by the card's button.
// B. What each tap of the cardio's log writes, step by step, on The Half Manny: a wheel rolled on a draft card, Log on
//    an empty card, Log, a wheel rolled on a logged card, the picker, a chip and back, the reps stepper, Reopen.
// C. What the rest timer writes, and who calls it.
//
// Usage: cd tests && node measure/native-cardio-sheet_today.ts   (writes tests/measure/native-cardio-sheet_today.md)
// TypeScript for the harness imports; node runs it with its types stripped. Not in the tests' type check.
process.env['TZ'] = 'America/New_York';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { REPO } from '../support/app.ts';
import { PROGRAMS } from '../support/programs.ts';
import { Phone, at, firstWeek } from '../support/stored-state.ts';

const out: string[] = [];
const CREATED = '2026-08-29T09:00:00';
const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const walkable = (seeded: any): any => (seeded.cardioGoals.swim ? { ...seeded, cardioGoals: { ...seeded.cardioGoals, swim: { ...seeded.cardioGoals.swim, baseMins: '10', baseSecs: '30' } } } : seeded);
const say = (s = ''): void => { out.push(s); };
const bump = (m: Record<string, number>, k: string, n = 1): void => { m[k] = (m[k] || 0) + n; };
const list = (m: Record<string, number>): string => Object.keys(m).sort().map((k) => '`' + k + '` ' + m[k]).join(', ') || 'none';
const idsOf = (keys: Record<string, string>): string[] => {
  try { return (JSON.parse(keys['ia_programs'] || '[]') as { id?: string }[]).map((p) => String(p.id || '')).filter(Boolean).sort((a, b) => b.length - a.length); } catch { return []; }
};
const family = (k: string, ids: string[]): string => { let f = k; for (const id of ids) f = f.split(id).join('<id>'); return f; };
/** Which keys moved between two reads of the store, and inside a moved key which entries and which of their fields. */
function diff(pre: Record<string, string>, post: Record<string, string>, ids: string[]): string {
  const rows: string[] = [];
  for (const k of [...new Set([...Object.keys(pre), ...Object.keys(post)])].sort()) {
    if ((pre[k] ?? null) === (post[k] ?? null)) continue;
    let inside = '';
    try {
      const a = pre[k] == null ? {} : JSON.parse(pre[k]!), b = post[k] == null ? {} : JSON.parse(post[k]!);
      if (a && b && typeof a === 'object' && typeof b === 'object' && !Array.isArray(a) && !Array.isArray(b)) {
        const parts: string[] = [];
        for (const e of [...new Set([...Object.keys(a), ...Object.keys(b)])].sort()) {
          if (JSON.stringify(a[e]) === JSON.stringify(b[e])) continue;
          let sub = '';
          if (b[e] && typeof b[e] === 'object' && !Array.isArray(b[e])) {
            const x = a[e] && typeof a[e] === 'object' ? a[e] : {};
            sub = ' {' + [...new Set([...Object.keys(x), ...Object.keys(b[e])])].filter((f) => f !== 'ts' && JSON.stringify(x[f]) !== JSON.stringify(b[e][f])).map((f) => { const v = JSON.stringify(b[e][f]) ?? 'gone'; return k.startsWith('ia_hist_') ? f : f + '=' + (v.length > 60 ? v.slice(0, 57) + '...' : v); }).join(', ') + '}';
          }
          parts.push((e in a ? (e in b ? '~' : '-') : '+') + e + sub);
        }
        inside = ' [' + parts.slice(0, 4).join(', ') + (parts.length > 4 ? ', and ' + (parts.length - 4) + ' more' : '') + ']';
      }
    } catch { /* a raw value */ }
    rows.push('`' + family(k, ids) + '`' + (pre[k] == null ? ' new' : post[k] == null ? ' removed' : '') + inside);
  }
  return rows.join('; ') || 'nothing';
}

/** An element of the page, as far as today's handlers read and change one. */
function el(id: string, value = ''): any {
  const set = new Set<string>();
  return {
    id, value: String(value), textContent: '', dataset: {} as Record<string, string>, style: {} as Record<string, string>,
    classList: { add: (c: string) => { set.add(c); }, remove: (c: string) => { set.delete(c); }, contains: (c: string) => set.has(c), toggle: (c: string, on?: boolean) => { if (on ?? !set.has(c)) set.add(c); else set.delete(c); return set.has(c); } },
    addEventListener() {}, querySelectorAll: () => [], querySelector: () => null, getAttribute: () => null,
  };
}
const fieldsOf = (P: Phone): Map<string, any> => (P as unknown as { fields: Map<string, any> }).fields;
/** Every input the markup holds, by id, with the value it was written with. */
function nodes(html: string): Record<string, string> {
  const o: Record<string, string> = {};
  for (const m of html.matchAll(/<input\b[^>]*>/g)) {
    const id = /\bid="([^"]+)"/.exec(m[0]), v = /\bvalue="([^"]*)"/.exec(m[0]);
    if (id) o[id[1]!] = v ? v[1]! : '';
  }
  return o;
}
/** The day's log placed as the page's own buildLogHTML writes it: the wrap, the Log button, the fields, the notes. */
function place(P: Phone, d: string): { wrap: any | null; kind: string } {
  const html: string = P.ev(`buildLogHTML(${JSON.stringify(d)},activeProg.weeks[currentWeek][${JSON.stringify(d)}].cardio)`);
  const m = fieldsOf(P);
  m.clear();
  for (const [id, v] of Object.entries(nodes(html))) m.set(id, el(id, v));
  const notes = /<textarea id="log_notes"[^>]*>([^<]*)<\/textarea>/.exec(html);
  m.set('log_notes', el('log_notes', notes ? notes[1]! : ''));
  m.set('popOverlay', el('popOverlay'));
  const w = /id="cardioSwapWrap" data-planned="([^"]*)" data-active="([^"]*)" data-logged="([^"]*)"/.exec(html);
  if (!w) return { wrap: null, kind: 'none' };
  const wrap = el('cardioSwapWrap');
  wrap.dataset.planned = w[1]; wrap.dataset.active = w[2]; wrap.dataset.logged = w[3];
  m.set('cardioSwapWrap', wrap);
  m.set('cardioLogBtn', el('cardioLogBtn'));
  m.set('cardioPicker', Object.assign(el('cardioPicker'), { style: { display: /id="cardioPicker" style="display:(\w+)/.exec(html)?.[1] || 'none' } }));
  m.set('cardioSwapNote', el('cardioSwapNote'));
  // The chip draws the fields again inside #cardioFields: its new inputs replace the old ones.
  const box = el('cardioFields');
  Object.defineProperty(box, 'innerHTML', { set(h: string) { for (const id of [...m.keys()]) if (/^log_(run|bike|swim)_/.test(id)) m.delete(id); for (const [id, v] of Object.entries(nodes(h))) m.set(id, el(id, v)); }, get() { return ''; } });
  m.set('cardioFields', box);
  return { wrap, kind: P.ev('_curLogDose?_curLogDose.k:"generic"') };
}
/** A wheel settled on a value, or a box typed into: the node written, then the listener the sheet wires onto it. */
const roll = (P: Phone, id: string, v: string): void => { fieldsOf(P).get(id).value = v; P.ev('if(cardioLive(currentDayKey)) persistLogFields(currentDayKey); updateDoseDerived();'); };

say('# Today\'s run card, cardio sheet and rest timer (measure, before the Expo app draws them)');
say();
say('Written by `cd tests && node measure/native-cardio-sheet_today.ts` (read-only). Zone ' + process.env['TZ'] + '.');
say();

// ── A. Where the cardio sheet shows ──────────────────────────────────────────────────────────────────────────────
const DAY = `(function(w,d){ var day=activeProg.weeks[w][d]; if(!day||!day.cardio) return JSON.stringify(null);
  var c=day.cardio, t=String(c.type||'').toLowerCase(); var dose=doseFromCardio(c);
  var lift=(day.sections||[]).some(function(s){return (s.items||[]).length>0;});
  return JSON.stringify({type:t, sub:c.subtype||'', k:dose?dose.k:null, parsed:!!(dose&&dose.parsed), tgt:!!(dose&&dose.tgt), lift:lift, race:(typeof isRace==='function')?!!isRace(c):false, rest:!!day.rest||day.type==='rest'});
})`;
const picks: Record<string, { w: number; d: string; sub: string }> = {};
{
  say('## A. Where the cardio sheet shows (the ten programs as generated)');
  say();
  say('| Program | Weeks | Days with a run, ride or swim | By sport | The log\'s form | Lift beside it | Cardio alone (Done and Skip kept) |');
  say('|---|---|---|---|---|---|---|');
  const T = { days: 0, sport: {} as Record<string, number>, form: {} as Record<string, number>, lift: 0, solo: 0, other: {} as Record<string, number>, race: 0, record: 0, log: 0, tgt: 0, parsed: 0 };
  for (const [pname, c] of Object.entries(PROGRAMS)) {
    const P = new Phone().launch(CREATED);
    P.generate(walkable(c));
    const prog = P.prog, half = pname.startsWith('half-manny');
    const R = { days: 0, sport: {} as Record<string, number>, form: {} as Record<string, number>, lift: 0, solo: 0 };
    for (let w = 1; w <= prog.totalWeeks; w++) for (const d of DAYS) {
      const x = JSON.parse(P.ev(DAY + `(${w},${JSON.stringify(d)})`));
      if (!x) continue;
      if (x.type !== 'run' && x.type !== 'bike' && x.type !== 'swim') { bump(T.other, x.type || '(none)'); continue; }
      const form = x.type === 'run' ? (x.k || 'generic') : x.type === 'bike' ? (x.k ? 'bike with its strip' : 'bike') : 'swim';
      R.days++; bump(R.sport, x.type); bump(R.form, form); if (x.lift) R.lift++; else R.solo++;
      T.days++; bump(T.sport, x.type); bump(T.form, form); if (x.lift) T.lift++; else T.solo++;
      if (x.race) T.race++; if (x.type === 'run') T.record++; else T.log++;
      if (x.tgt) T.tgt++; if (x.parsed) T.parsed++;
      if (half && x.type === 'run' && x.lift && !picks[form]) picks[form] = { w, d, sub: x.sub };
      if (half && x.type === 'run' && !x.lift && !picks['solo']) picks['solo'] = { w, d, sub: x.sub };
    }
    say('| ' + pname + ' | ' + prog.totalWeeks + ' | ' + R.days + ' | ' + list(R.sport) + ' | ' + list(R.form) + ' | ' + R.lift + ' | ' + R.solo + ' |');
  }
  say('| **All ten** | | **' + T.days + '** | ' + list(T.sport) + ' | ' + list(T.form) + ' | ' + T.lift + ' | ' + T.solo + ' |');
  say();
  say('- A day whose cardio is no run, ride or swim draws no field in the log: ' + list(T.other) + '.');
  say('- The card\'s button on the iOS app (Record run is offered, D272 item 6): ' + T.record + ' days open the recorder, ' + T.log + ' open the hand log (rides and swims). Without the recorder the same ' + T.record + ' read Log the run and open the hand log.');
  say('- ' + T.tgt + ' of the ' + T.days + ' doses carry a target pace (the strip\'s pace and the readout\'s gap); ' + T.parsed + ' were read from the detail\'s words, the rest from the engine\'s own dose.');
  say('- The wheels: `time` and `dist` draw two (the clock with hours, and miles), `reps_dist` the reps stepper and the rep clock, `reps_time` the stepper and miles, `generic` miles and pace side by side, a ride the clock with hours, a swim a number box and no wheel.');
  say();
}

// ── B. What each tap writes, on The Half Manny ───────────────────────────────────────────────────────────────────
{
  say('## B. What each tap of the cardio\'s log writes (The Half Manny)');
  say();
  const cfg = walkable(Object.values(PROGRAMS)[0]);
  const P = new Phone().launch(CREATED);
  P.generate(cfg);
  const { start } = firstWeek(P, CREATED);
  const ids = idsOf(P.dump());
  const step = (what: string, code: string, run: () => void): void => {
    const pre = P.dump(), seen = P.toasts.length;
    run();
    P.settle();
    const wrap = fieldsOf(P).get('cardioSwapWrap');
    say('| ' + what + ' | `' + code + '` | ' + diff(pre, P.dump(), ids) + ' | ' + (P.toasts.slice(seen).join(' / ') || '') + ' | ' + (wrap ? (wrap.dataset.logged === '1' ? 'logged' : 'draft') + ', ' + wrap.dataset.active : '') + ' |');
  };
  const head = (form: string): { w: number; d: string } | null => {
    const p = picks[form];
    if (!p) { say('*No ' + form + ' day on The Half Manny.*'); say(); return null; }
    say('**' + form + '**: week ' + p.w + ', ' + p.d + ', ' + p.sub);
    say();
    say('| Step | The page\'s call | Keys written | Toast | The card after |');
    say('|---|---|---|---|---|');
    P.launch(at(start, 7 * (p.w - 1) + DAYS.indexOf(p.d)));
    P.settle();   // the launch's own reminder lands before the first step is read
    return p;
  };
  const open = (p: { w: number; d: string }): void => { P.open(p.w, p.d as never); place(P, p.d); };
  const free: Record<string, [string, string, string]> = { time: ['log_run_dist', '3.10', '3.20'], dist: ['log_run_mins', '28.50', '29.00'], reps_time: ['log_run_dist', '2.40', '2.50'], reps_dist: ['log_run_rep_time', '1:52', '1:50'], generic: ['log_run_dist', '4.00', '4.10'] };
  let first = true;
  for (const form of ['time', 'dist', 'reps_dist', 'reps_time', 'generic']) {
    const p = head(form);
    if (!p) continue;
    const [id, v1, v2] = free[form]!;
    step('Log the run on the card, or a done run\'s Reopen (the sheet opens)', 'openDayKey(day)', () => open(p));
    step('Log, nothing rolled', 'logCardio()', () => { P.ev('logCardio();'); });
    step('A wheel rolled (' + id + ' to ' + v1 + ')', 'the wheel\'s settle', () => roll(P, id, v1));
    if (form.startsWith('reps')) step('The stepper, one rep fewer', 'doseRep(-1)', () => { P.ev('doseRep(-1);'); });
    step('Log', 'logCardio()', () => { P.ev('logCardio();'); });
    step('The wheel rolled again (' + v2 + ')', 'the wheel\'s settle', () => roll(P, id, v2));
    if (form.startsWith('reps')) step('The stepper, one rep more', 'doseRep(1)', () => { P.ev('doseRep(1);'); });
    if (first) {
      step('Did a different activity?', 'toggleCardioPicker()', () => { P.ev('toggleCardioPicker();'); });
      step('The Bike chip', 'setCardioSwap("bike")', () => { P.ev('setCardioSwap("bike");'); });
      step('The ride\'s clock rolled (45.00)', 'the wheel\'s settle', () => roll(P, 'log_bike_mins', '45.00'));
      step('Log', 'logCardio()', () => { P.ev('logCardio();'); });
      step('The Bike chip again (the sport it is on)', 'setCardioSwap("bike")', () => { P.ev('setCardioSwap("bike");'); });
      step('The Run chip, back', 'setCardioSwap("run")', () => { P.ev('setCardioSwap("run");'); });
      step('The sheet closed and opened again', 'closeDetail(), openDayKey(day)', () => { P.ev('closeDetail();'); open(p); });
      first = false;
    }
    say();
  }
  const s = head('solo');
  if (s) {
    step('The card\'s button (the sheet opens, with Done and Skip)', 'openDayKey(day)', () => open(s));
    step('A wheel rolled, then Done', 'handleDayStatus(day,title,"complete")', () => { const k = P.ev('_curLogDose?_curLogDose.k:"generic"') as string; const f = free[k] || free['generic']!; roll(P, f[0], f[1]); P.mark(s.d as never, 'complete'); });
    say();
  }
}

// ── C. The rest timer ────────────────────────────────────────────────────────────────────────────────────────────
{
  say('## C. The rest timer');
  say();
  const P = new Phone().launch(CREATED);
  P.generate(walkable(Object.values(PROGRAMS)[0]));
  const pre = P.dump();
  P.ev('ruStart();'); P.settle(); P.ev('ruPause();'); P.ev('ruStart();'); P.ev('ruReset();'); P.ev('ruResetIfIdle();'); P.ev('rtExpand();rtCollapse();');
  P.settle();
  say('- Start, Stop, Start, Reset, the idle reset, the card opened and folded: keys written, ' + diff(pre, P.dump(), idsOf(pre)) + '. The clock, the side it docks to and whether its card is open live in memory only: a launch starts at 0:00, folded, on the right.');
  say('- The app calls it in five places: every screen change shows or hides it (`showScreen`), a day\'s sheet opening zeroes a stopped clock and leaves a running one (`openDetail`), Done or Skip stops and zeroes it (`handleDayStatus`), the first program generated plays its opening once (`doGenerate`), and the launch tells the Live Activity where it stands (`init`).');
  say();
}

writeFileSync(join(REPO, 'tests/measure/native-cardio-sheet_today.md'), out.join('\n') + '\n');
console.log(out.join('\n'));
