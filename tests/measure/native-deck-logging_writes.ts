// native-deck-logging: what today's app writes when a set is logged and a day is called, and what its launch writes
// that core's launch does not. Read-only (measure), before the Expo deck logs (MIGRATION.md phase 3, the deck's second
// session; D289, docs/decisions/data-backup.md). It runs today's page in the VM harness on the test phone of
// tests/support/stored-state.ts and reads the stored keys before and after each step.
//
// A. Every launch of the ten standard histories: the keys the page's launch changed, the keys core's launch
//    (refreshStoredProgram through a store that writes) changed on the same keys at the same instant, and each key
//    only one of the two changed. A lift log holding an old key is built, since no history holds one.
// B. One training day of HALF_MANNY, opened as deck.ts open() opens it, its fields placed from today's own card model
//    as the Angular template draws them: each handler a set row, the load field, a pill, Log, Done next one, Call it,
//    a skip and its undo reaches, run on the page, with the keys it changed and the entries inside them.
// C. How often a day holds two moves whose keys are one the start of the other (saveExWeight reads its rows by the
//    start of their id).
//
// Usage: node tests/measure/native-deck-logging_writes.ts   (writes tests/measure/native-deck-logging_writes.md)
// TypeScript for the harness imports; node runs it with its types stripped. Not in the tests' type check.
process.env['TZ'] = 'America/New_York';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { exStoreKey, foldExAliasKeys } from '@ia/core/engine/exercise-library.ts';
import { readActiveProgramId, readPrograms } from '@ia/core/engine/state-programs.ts';
import { refreshStoredProgram } from '@ia/core/engine/state-refresh.ts';
import { callItLog } from '../../frontends/app/src/app/screens/deck/deck-model.ts';
import { type ExCard, type ExSection, sectionsView } from '../../frontends/app/src/app/screens/day-detail/session-sections-model.ts';
import { sectionReads } from '../../frontends/app/src/app/screens/day-detail/session-sections-reads.ts';
import { REPO } from '../support/app.ts';
import { PROGRAMS } from '../support/programs.ts';
import { sqliteTestStore } from '../support/sqlite-kv.ts';
import { Phone, at, firstWeek, life, training } from '../support/stored-state.ts';

const out: string[] = [];
const CREATED = '2026-08-29T09:00:00';
/** The seeded swim goal with the timed 500 the wizard asks for, as the stored-state sweep gives it. */
const walkable = (seeded: any): any => (seeded.cardioGoals.swim ? { ...seeded, cardioGoals: { ...seeded.cardioGoals, swim: { ...seeded.cardioGoals.swim, baseMins: '10', baseSecs: '30' } } } : seeded);
const say = (s = ''): void => { out.push(s); };
const bump = (m: Record<string, number>, k: string): void => { m[k] = (m[k] || 0) + 1; };
const list = (m: Record<string, number>): string => Object.keys(m).sort().map((k) => '`' + k + '` ' + m[k]).join(', ') || 'none';

/** A key with its program's id taken out, so keys of two programs fall in one family. */
function family(k: string, ids: string[]): string {
  let f = k;
  for (const id of ids) f = f.split(id).join('<id>');
  return f;
}
const idsOf = (keys: Record<string, string>): string[] => {
  try { return (JSON.parse(keys['ia_programs'] || '[]') as { id?: string }[]).map((p) => String(p.id || '')).filter(Boolean).sort((a, b) => b.length - a.length); } catch { return []; }
};

// ── A. The launch ────────────────────────────────────────────────────────────────────────────────────────────────
const A = { launches: 0, none: 0, page: {} as Record<string, number>, core: {} as Record<string, number>, both: {} as Record<string, number>, bothSame: 0, bothDiffer: [] as string[],
  pageOnly: {} as Record<string, number>, coreOnly: {} as Record<string, number>, why: {} as Record<string, number>,
  timers: {} as Record<string, number>, timerLaunches: 0, picks: [] as string[] };
let hooking = false, label = '';
const launch0 = Phone.prototype.launch;
Phone.prototype.launch = function (this: Phone, when: string, opts: { init?: boolean } = {}): Phone {
  if (!hooking || opts.init === false) return launch0.call(this, when, opts);
  const pre = this.dump();
  launch0.call(this, when, opts);
  const post = this.dump();
  const now: number = this.ev('Date.now()');
  const ids = idsOf({ ...pre, ...post });
  A.launches++;
  const s = sqliteTestStore();
  for (const [k, v] of Object.entries(pre)) s.set(k, v);
  const id = readActiveProgramId(s);
  const stored = id ? (readPrograms(s) as any[]).find((x) => x && x.id === id) : null;
  if (stored && stored.weeks) refreshStoredProgram(s, stored, now, { overlay: () => {}, freeze: () => {}, rebuild: () => {} }); else A.none++;
  const after: Record<string, string> = {};
  for (const k of s.keys()) if (k.startsWith('ia_')) after[k] = s.get(k)!;
  for (const k of new Set([...Object.keys(pre), ...Object.keys(post), ...Object.keys(after)])) {
    const p = (pre[k] ?? null) !== (post[k] ?? null), c = (pre[k] ?? null) !== (after[k] ?? null), f = family(k, ids);
    if (p) bump(A.page, f);
    if (c) bump(A.core, f);
    if (p && c) { bump(A.both, f); if (post[k] === after[k]) A.bothSame++; else A.bothDiffer.push(label + ' at ' + when + ': ' + f); }
    if (c && !p) bump(A.coreOnly, f);
    if (p && !c) {
      bump(A.pageOnly, f);
      // Why the page wrote it: the fold of the active program's lift log, or something else.
      let why = 'something else';
      if (id && k === 'ia_exw_' + id && pre[k] != null && post[k] != null) {
        try { const log = JSON.parse(pre[k]!); foldExAliasKeys(log); if (JSON.stringify(log) === post[k]) why = 'the fold of the lift log\'s old keys'; } catch { /* stays something else */ }
      }
      if (k === 'ia_active') why = 'the active program put right (' + JSON.stringify(pre[k] ?? null) + ' to ' + JSON.stringify(post[k] ?? null) + ')';
      bump(A.why, f + ': ' + why);
    }
  }
  // What the page's timers write once the launch is over (the day-after reminder waits 600 ms): a second phone on
  // the same keys, launched at the same instant and its timers run, against the first.
  const Q = new Phone();
  for (const [k, v] of Object.entries(pre)) Q.damage(k, v);
  launch0.call(Q, when, opts);
  Q.settle();
  const late = Q.dump();
  let any = false;
  for (const k of new Set([...Object.keys(post), ...Object.keys(late)])) if ((post[k] ?? null) !== (late[k] ?? null)) { any = true; bump(A.timers, family(k, ids)); }
  if (any) A.timerLaunches++;
  // Which program each launch picks, where the two differ: the page's activeProg, and the active program as the Expo
  // app's storedProgram finds it (ia_active's id among ia_programs, with a grid).
  const pageId: string | null = this.ev('activeProgId') || null;
  const betaId: string | null = stored && stored.weeks ? stored.id : null;
  if (pageId !== betaId) A.picks.push(label + ': the page holds ' + (pageId ? 'a program' : 'none') + ', the Expo app\'s launch picks ' + (betaId ? (pageId ? 'another' : 'one') : 'none') + ' (ia_active ' + (pre['ia_active'] == null ? 'unset' : post['ia_active'] == null ? 'removed by the page' : pre['ia_active'] === post['ia_active'] ? 'left' : 'moved by the page') + ')');
  return this;
};

hooking = true;
for (const [name, cfg] of Object.entries(PROGRAMS)) { label = name; life(walkable(cfg), CREATED); }
const standard = A.launches;
// Built: a lift log holding an old key (a row under a name's old slug), then a launch.
{
  label = 'built: an old key in the lift log';
  hooking = false;
  const { phone: P } = life(PROGRAMS['half-manny (Mario, NRC half, crossfit)']!, CREATED);
  const id: string = P.ev('activeProgId');
  const log = JSON.parse(P.dump()['ia_exw_' + id] || '{}') as Record<string, any>;
  const alias: Record<string, string> = P.ev('JSON.parse(JSON.stringify(typeof EX_KEY_ALIAS!=="undefined"?EX_KEY_ALIAS:{}))');
  const olds = Object.keys(alias);
  const live = Object.keys(log);
  // An old name whose new key the log holds, else the first alias: the row is moved back under its old key.
  const old = olds.find((o) => live.includes(alias[o]!)) || olds[0];
  if (old) {
    const to = alias[old]!;
    if (log[to]) { log[old] = log[to]; delete log[to]; } else log[old] = { name: old, entries: [{ week: 1, weight: 100, ts: 1, day: 'mon' }] };
    P.damage('ia_exw_' + id, JSON.stringify(log));
    hooking = true;
    P.launch('2026-12-01T08:00:00');
    say('<!-- built old key: ' + old + ' to ' + to + ' -->');
  }
  hooking = false;
}

// Built: the active program's pointer. One that names no stored program; one that names an archived program beside a
// live one; and every program archived.
{
  const two = (): { P: Phone; a: string; b: string } => {
    const P = new Phone().launch(CREATED);
    const a = P.generate(walkable(PROGRAMS['half-manny (Mario, NRC half, crossfit)']!));
    // A program's id is the instant it was made, so the second is made a day later.
    P.launch('2026-08-30T09:00:00');
    const b = P.generate(walkable(Object.values(PROGRAMS)[1]!));
    if (a === b) throw new Error('the two built programs share an id');
    return { P, a, b };
  };
  const archive = (P: Phone, ids: string[]): void => {
    const list = JSON.parse(P.dump()['ia_programs']!) as any[];
    for (const p of list) if (ids.includes(p.id)) p.archived = true;
    P.damage('ia_programs', JSON.stringify(list));
  };
  let x = two();
  x.P.damage('ia_active', 'no-such-program');
  label = 'built: ia_active names no stored program'; hooking = true; x.P.launch('2026-09-02T08:00:00'); hooking = false;
  x = two(); archive(x.P, [x.b]);
  label = 'built: ia_active names an archived program, another is live'; hooking = true; x.P.launch('2026-09-02T08:00:00'); hooking = false;
  x = two(); archive(x.P, [x.a, x.b]);
  label = 'built: every program archived'; hooking = true; x.P.launch('2026-09-02T08:00:00'); hooking = false;
}

say('# The swipe deck\'s logging in the Expo app: what today\'s app writes');
say();
say('Written by `node tests/measure/native-deck-logging_writes.ts` (read-only). Zone ' + process.env['TZ'] + '.');
say();
say('## A. What a launch writes: today\'s page against core\'s launch');
say();
say('- Launches read: **' + A.launches + '** (' + standard + ' of the ten standard histories, ' + (A.launches - standard) + ' built: an old key in the lift log, and three states of the active program\'s pointer). No active program with a grid on ' + A.none + '.');
say('- Keys the page\'s launch changed: ' + list(A.page) + '.');
say('- Keys core\'s launch changed (`refreshStoredProgram`, a store that writes): ' + list(A.core) + '.');
say('- Changed by both: ' + list(A.both) + '; left the same value by both on **' + A.bothSame + '** of them' + (A.bothDiffer.length ? '; differing: ' + A.bothDiffer.join('; ') : '') + '.');
say('- **Changed by the page alone:** ' + list(A.pageOnly) + '.');
say('- Why, for each: ' + (Object.keys(A.why).sort().map((k) => k + ' (' + A.why[k] + ')').join('; ') || 'none') + '.');
say('- Changed by core alone: ' + list(A.coreOnly) + '.');
say('- **Which program the launch picks, where the two differ:** ' + (A.picks.join('; ') || 'nowhere') + '.');
say('- **Written by the page\'s timers after the launch** (a second phone on the same keys, its timers run): on **' + A.timerLaunches + '** of ' + A.launches + ' launches: ' + list(A.timers) + '. That is the day-after reminder (`maybeShowReminder`, 600 ms after the launch).');
say();

// ── B. The handlers ──────────────────────────────────────────────────────────────────────────────────────────────
/** A field of the page as the Angular template draws it, with a class list that works. */
function field(id: string, value: string, placeholder: string, cls: string, rx: string | null): any {
  const set = new Set(cls.split(' ').filter(Boolean));
  return {
    id, value, placeholder, dataset: {}, textContent: '', style: {},
    classList: { add: (c: string) => { set.add(c); }, remove: (c: string) => { set.delete(c); }, contains: (c: string) => set.has(c), toggle: (c: string, on?: boolean) => { const want = on === undefined ? !set.has(c) : on; if (want) set.add(c); else set.delete(c); return want; } },
    getAttribute: (n: string) => (n === 'data-rx' ? rx : null),
  };
}
/** Every card's fields of a day, placed on the phone from the page's own model (session-sections.ts's template). */
function place(P: Phone, cards: ExCard[]): void {
  const fields = (P as any).fields as Map<string, any>;
  fields.clear();
  for (const x of cards) {
    fields.set('excard_' + x.exKey, field('excard_' + x.exKey, '', '', 'exercise-item' + (x.logged ? ' logged' : ''), null));
    if (!x.log) continue;
    if (x.log.sets) for (const r of x.log.sets.rows) {
      fields.set(r.rowId, field(r.rowId, r.value, r.placeholder, r.cls, r.rx));
      if (r.weight) fields.set(r.weight.id, field(r.weight.id, r.weight.value, '', r.weight.cls, null));
    }
    if (x.log.load) fields.set('exw_' + x.exKey, field('exw_' + x.exKey, x.log.load.value, '', 'ex-winput', null));
  }
}
/** The day's exercise cards as today's model draws them, read through the page (deck.ts build(); the week and day in hand are set first). */
function cardsOf(P: Phone, w: number, d: string): ExCard[] {
  const f = <T>(name: string): T => P.ev(name) as T;
  const call = <R>(name: string, ...args: unknown[]): R => f<(...a: unknown[]) => R>(name)(...args);
  const was = { week: f<number>('currentWeek'), day: f<string | null>('currentDayKey'), shown: f<boolean>('_staleWarnShown'), src: f<string>('_staleWarnSrc') };
  call('_setCurrentWeek', w); call('_setCurrentDayKey', d);
  try {
    const secs = ((P.day(w, d as never) || {}).sections || []) as ExSection[];
    return JSON.parse(JSON.stringify(sectionsView(secs, 0, sectionReads({ call, global: f })).flatMap((v) => (v.kind === 'section' ? v.body.items : [])).filter((x) => x.kind === 'card'))) as ExCard[];
  } finally { call('_setCurrentWeek', was.week); call('_setCurrentDayKey', was.day); call('_setStaleWarnShown', was.shown); call('_setStaleWarnSrc', was.src); }
}

/** What a step changed: each key's family, and inside a JSON object the entries added, changed and dropped. */
function diff(pre: Record<string, string>, post: Record<string, string>, ids: string[]): string {
  const rows: string[] = [];
  for (const k of [...new Set([...Object.keys(pre), ...Object.keys(post)])].sort()) {
    if ((pre[k] ?? null) === (post[k] ?? null)) continue;
    const f = family(k, ids);
    let inside = '';
    try {
      const a = pre[k] == null ? {} : JSON.parse(pre[k]!), b = post[k] == null ? {} : JSON.parse(post[k]!);
      if (a && b && typeof a === 'object' && typeof b === 'object' && !Array.isArray(a) && !Array.isArray(b)) {
        const parts: string[] = [];
        for (const e of [...new Set([...Object.keys(a), ...Object.keys(b)])].sort()) {
          if (JSON.stringify(a[e]) === JSON.stringify(b[e])) continue;
          let sub = '';
          if (a[e] && b[e] && typeof a[e] === 'object' && typeof b[e] === 'object' && !Array.isArray(a[e])) {
            sub = ' {' + [...new Set([...Object.keys(a[e]), ...Object.keys(b[e])])].filter((x) => JSON.stringify(a[e][x]) !== JSON.stringify(b[e][x])).map((x) => (x in a[e] ? (x in b[e] ? '~' : '-') : '+') + x).join(' ') + '}';
          }
          parts.push((e in a ? (e in b ? '~' : '-') : '+') + e + sub);
        }
        inside = ' [' + parts.slice(0, 6).join(', ') + (parts.length > 6 ? ', and ' + (parts.length - 6) + ' more' : '') + ']';
      }
    } catch { /* not JSON */ }
    rows.push('`' + f + '`' + (pre[k] == null ? ' (new)' : post[k] == null ? ' (removed)' : '') + inside);
  }
  return rows.join('; ') || 'nothing';
}

say('## B. What each handler writes (HALF_MANNY, one training day, the page\'s own functions)');
say();
say('`+` an entry added, `~` changed, `-` dropped. The fields are placed from today\'s card model as the template draws them.');
say();
say('| Step | On the page | Keys it changed |');
say('|---|---|---|');
{
  const cfg = PROGRAMS['half-manny (Mario, NRC half, crossfit)']!;
  const P = new Phone().launch(CREATED);
  P.generate(cfg);
  const { first, start } = firstWeek(P, CREATED);
  const w = first;
  P.launch(at(start, 7 * (w - 1), '06:30'));
  const days = training(P, w);
  // The first day with a loaded lift of two sets or more and a round or a second card.
  const d = days.find((x) => cardsOf(P, w, x).some((c) => c.log && c.log.load && c.log.sets && c.log.sets.rows.length > 1)) || days[0]!;
  P.launch(at(start, 7 * (w - 1) + ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].indexOf(d)));
  const ids = idsOf(P.dump());
  const step = (what: string, code: string, run: () => void): void => {
    const pre = P.dump();
    run();
    P.settle();
    say('| ' + what + ' | `' + code + '` | ' + diff(pre, P.dump(), ids) + ' |');
  };
  // deck.ts open(): the stale warning, the unit, the day in hand, the idle clock. Then its fields.
  step('The deck opens (deck.ts open())', '_setStaleWarnShown, _setStaleWarnSrc, _unitLabel, _setCurrentDayKey, ruResetIfIdle', () => {
    P.ev(`currentWeek=${w};_setStaleWarnShown(false);_setStaleWarnSrc('');window._unitLabel=(activeProg.cfg&&activeProg.cfg.unit==='kg')?'kg':'lbs';_setCurrentDayKey(${JSON.stringify(d)});ruResetIfIdle();`);
  });
  let cards = cardsOf(P, w, d);
  place(P, cards);
  const lift = cards.find((c) => c.log && c.log.load && c.log.sets && c.log.sets.rows.length > 1)!;
  const other = cards.find((c) => c !== lift && c.log && c.log.sets) || null;
  const K = JSON.stringify(lift.exKey), row0 = JSON.stringify(lift.log!.sets!.rows[0]!.rowId);
  const f = (id: string): any => ((P as any).fields as Map<string, any>).get(id);
  say('| | *the lift: ' + lift.name + ', ' + lift.rxDetail + ' (' + lift.exKey + ')* | |');
  step('A set\'s plus', 'stepSet(row, +step)', () => { P.ev(`stepSet(${row0},${lift.log!.sets!.rows[0]!.step});`); });
  step('A set\'s minus, again', 'stepSet(row, -step)', () => { P.ev(`stepSet(${row0},${-lift.log!.sets!.rows[0]!.step});`); });
  step('A rep typed, the field left', 'setDelta(row); autoSaveSets(key)', () => { f(lift.log!.sets!.rows[1]!.rowId).value = '4'; P.ev(`setDelta(${JSON.stringify(lift.log!.sets!.rows[1]!.rowId)});autoSaveSets(${K});`); });
  step('The load typed', 'cascadeSetWeights(key)', () => { f('exw_' + lift.exKey).value = '135'; P.ev(`cascadeSetWeights(${K});`); });
  step('The load field left', 'autoSaveSets(key)', () => { P.ev(`autoSaveSets(${K});`); });
  step('One set\'s load typed, the field left', 'onSetWeight(key, 1); autoSaveSets(key)', () => { f(lift.log!.sets!.rows[1]!.weight!.id).value = '145'; P.ev(`onSetWeight(${K},1);autoSaveSets(${K});`); });
  step('The reuse pill', 'reuseWeight(key, 155)', () => { P.ev(`reuseWeight(${K},155);`); });
  step('Fill every set', 'fillAllSetWeights(key, 150)', () => { P.ev(`fillAllSetWeights(${K},150);`); });
  step('The sets opened', 'toggleSets(key)', () => { P.ev(`toggleSets(${K});`); });
  step('Log', 'saveExWeight(key, name, rxDetail)', () => { P.ev(`saveExWeight(${K},${JSON.stringify(lift.name)},${JSON.stringify(lift.rxDetail)});`); });
  step('A set\'s plus, once logged', 'stepSet(row, +step), so commitSetsLive', () => { P.ev(`stepSet(${row0},${lift.log!.sets!.rows[0]!.step});`); });
  step('Log again', 'saveExWeight(key, name, rxDetail)', () => { P.ev(`saveExWeight(${K},${JSON.stringify(lift.name)},${JSON.stringify(lift.rxDetail)});`); });
  if (other) {
    say('| | *another move: ' + other.name + ', ' + other.rxDetail + ' (' + other.exKey + ')* | |');
    step('Done, next one (a move not yet logged)', 'saveExWeight(key, name, rxDetail, true)', () => { P.ev(`saveExWeight(${JSON.stringify(other.exKey)},${JSON.stringify(other.name)},${JSON.stringify(other.rxDetail)},true);`); });
  }
  // A skip and its undo, a round's skip and its undo.
  const day = P.day(w, d as never);
  const skipName = cards.filter((c) => c.skip && c !== lift && c !== other).map((c) => c.name).pop();
  if (skipName) {
    step('Skip a move', 'skipExercise(name)', () => { P.ev(`skipExercise(${JSON.stringify(skipName)});`); });
    step('Put it back', 'unskipExercise(name)', () => { P.ev(`unskipExercise(${JSON.stringify(skipName)});`); });
  }
  const round = (day.sections || []).findIndex((s: any) => (s.superset || s.type === 'superset') && (s.items || []).length > 1);
  if (round >= 0) {
    step('Skip a round', 'skipSuperset(secIdx)', () => { P.ev(`skipSuperset(${round});`); });
    step('Put the round back', 'unskipSuperset(secIdx)', () => { P.ev(`unskipSuperset(${round});`); });
  }
  // Call it: deck.ts markDay(), step by step.
  say('| | *Call it (deck.ts markDay())* | |');
  const title = JSON.stringify(day.title || 'Training');
  step('Mark the day done: the snapshot', 'snapshotDay(week, day)', () => { P.ev(`snapshotDay(${w},${JSON.stringify(d)});`); });
  step('Mark the day done: effort 8 and notes into the day\'s log', 'getLogs; callItLog; saveLogs', () => {
    const logs = P.ev('JSON.parse(JSON.stringify(getLogs()))') as Record<string, any>;
    const key: string = P.ev(`logKey(${w},${JSON.stringify(d)})`);
    logs[key] = callItLog(logs[key], 8, 'Measured.', w, P.ev('Date.now()'));
    P.IA.ctx['__logs'] = logs;
    P.ev('saveLogs(__logs);');
  });
  step('Mark the day done: the status', 'markDayComplete(week, day, title)', () => { P.ev(`markDayComplete(${w},${JSON.stringify(d)},${title});`); });
  step('Mark the day done: the rest clock', 'ruReset()', () => { P.ev('ruReset();'); });
  step('The deck closes', 'renderWeekView()', () => { P.ev('renderWeekView();'); });
  step('The pop-up over This Week', 'fireCompletionPopup(week, day)', () => { P.ev(`fireCompletionPopup(${w},${JSON.stringify(d)});`); });
  step('The pop-up dismissed', 'closePopup()', () => { P.ev('if(typeof closePopup==="function")closePopup();'); });
  say();
  say('The day: week ' + w + ', ' + d + ', ' + (day.title || '') + '. ' + cards.length + ' cards with fields.');
}
say();

// ── C. Keys that start another key ───────────────────────────────────────────────────────────────────────────────
{
  let days = 0, hit = 0;
  const pairs: Record<string, number> = {};
  const progs: Record<string, number> = {};
  const proofs: string[] = [];
  hooking = false;
  for (const [pname, cfg] of Object.entries(PROGRAMS)) {
    const P = new Phone().launch(CREATED);
    P.generate(walkable(cfg));
    const prog = P.prog;
    for (const wk of Object.keys(prog.weeks)) for (const d of ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']) {
      const day = prog.weeks[wk][d];
      if (!day || day.rest) continue;
      days++;
      const keys = [...new Set((day.sections || []).flatMap((s: any) => (s.items || []).map((i: any) => exStoreKey(i.name || ''))).filter(Boolean))] as string[];
      let any = false;
      for (const a of keys) for (const b of keys) if (a !== b && b.startsWith(a + '_')) { any = true; bump(pairs, a + ' / ' + b); }
      if (any) { hit++; bump(progs, pname); }
      // Proved on the page, once per pair: the shorter key's move logged with every card's fields on the page, as the
      // deck holds them, and the entry's sets counted against the move's own rows.
      const pair = keys.flatMap((a) => keys.filter((b) => a !== b && b.startsWith(a + '_')).map((b) => [a, b] as const))[0];
      if (pair && !proofs.some((x) => x.includes('`' + pair[0] + '`'))) {
        const w = +wk;
        P.ev(`currentWeek=${w};_setCurrentDayKey(${JSON.stringify(d)});window._unitLabel='lbs';`);
        const cards = cardsOf(P, w, d);
        place(P, cards);
        const x = cards.find((c) => c.exKey === pair[0]), y = cards.find((c) => c.exKey === pair[1]);
        if (x && y && x.log && x.log.sets && y.log && y.log.sets) {
          P.ev(`saveExWeight(${JSON.stringify(x.exKey)},${JSON.stringify(x.name)},${JSON.stringify(x.rxDetail)},true);`);
          const e = P.ev(`(function(){var r=getExWeights()[${JSON.stringify(x.exKey)}];return r&&r.entries&&r.entries[r.entries.length-1];})()`);
          proofs.push('`' + pair[0] + '` (' + x.rxDetail + ', ' + x.log.sets.rows.length + ' rows) beside `' + pair[1] + '` (' + y.log.sets.rows.length + ' rows): Log stores setsDone ' + JSON.stringify(e && e.setsDone) + ' (' + pname + ', week ' + w + ', ' + d + ')');
        }
      }
    }
  }
  say('## C. Two moves on one day, one key the start of the other');
  say();
  say('`saveExWeight` reads a move\'s rep rows with `input[id^="exset_<key>_"]`, which also matches the rows of a move whose key starts `<key>_`.');
  say();
  say('- Training days read (the ten programs as generated): **' + days + '**. Days holding such a pair: **' + hit + '**.');
  say('- The pairs: ' + (Object.keys(pairs).sort().map((k) => '`' + k + '` ' + pairs[k]).join(', ') || 'none') + '. By program: ' + list(progs) + '.');
  say('- Proved on the page: ' + (proofs.join('; ') || 'not reached') + '.');
}

writeFileSync(join(REPO, 'tests/measure/native-deck-logging_writes.md'), out.join('\n') + '\n');
console.log(out.join('\n'));
