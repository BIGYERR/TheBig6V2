// Helpers for the test week tests (tests/integration/test-week.test.ts, tests/integration/test-length.test.ts,
// tests/sweeps/test-week.test.ts, tests/sweeps/test-length.test.ts). Built on tests/support/app.ts.
//
//   the hand calendar   integer civil days (Hinnant's days_from_civil and civil_from_days) and Sakamoto's weekday,
//                       so a date oracle never asks the app or a local-time Date: handWeek(start, test) is
//                       (Monday(test) - Monday(start)) / 7 + 1, null when the test is before the start.
//   the cards           how a test reads a card the athlete sees: the trial by subtype (TIME TRIAL, never by
//                       position), the NSW quality runs by name (Short Interval (SI), Long Interval (LI)), the easy LSD
//                       and the long LSD by legLoad.
//   the fixtures        PRT TING (Mario's dated 1.5 mi test goal) and the dated test lattices: a test goal of a given
//                       mix, rest set, test week and test weekday, started on a fixed Monday.
//   the lattice runners trialWeek (the test week carries its trial, D106a), eveWeek (T-1 and T-2, the D106a
//                       fix-forward), b4Week (no hard run at T-2), eveShakeout (D158), protectParkEves (D158 skips the
//                       protect-park injury modes). Each returns a tally the tests assert: the cells that broke a claim
//                       and how many cells reached the case, so a sample that reaches nothing fails.
import type { DayKey } from '@ia/core';
import { loadApp, pinClock } from './app.ts';
import type { App } from './app.ts';

/** A program, a day or a card as the app builds them, cloned to plain JSON: untyped app data a test reads freely. */
export type Prog = any;
export type Day = any;
export type Card = any;
/** A config as these tests write it: the wizard's fields plus the test pins, built and stored by the app. */
export type TestCfg = Record<string, any>;

// ── the hand calendar ───────────────────────────────────────────────────────────────────────────────────────────
export const ISO7: DayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];   // program week order, Monday first
export const JS7: DayKey[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];    // Date.getDay() order
export const WD3 = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const MON3 = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const ymd = (s: string): [number, number, number] => { const [y = NaN, m = NaN, d = NaN] = String(s).split('-').map(Number); return [y, m, d]; };
/** Weekday of a civil date, 0 Sunday .. 6 Saturday (Sakamoto). */
export function sakamoto(y: number, m: number, d: number): number {
  const t = [0, 3, 2, 5, 0, 3, 5, 1, 4, 6, 2, 4];
  if (m < 3) y -= 1;
  return (y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) + (t[m - 1] as number) + d) % 7;
}
/** Days from 1970-01-01 (Hinnant's days_from_civil). */
export function civ(y: number, m: number, d: number): number {
  y -= m <= 2 ? 1 : 0;
  const era = Math.floor(y / 400), yoe = y - era * 400;
  const doy = Math.floor((153 * (m + (m > 2 ? -3 : 9)) + 2) / 5) + d - 1;
  return era * 146097 + yoe * 365 + Math.floor(yoe / 4) - Math.floor(yoe / 100) + doy - 719468;
}
/** The ISO date of a day count from 1970-01-01 (Hinnant's civil_from_days). */
export function fromCiv(z: number): string {
  z += 719468;
  const era = Math.floor(z / 146097), doe = z - era * 146097;
  const yoe = Math.floor((doe - Math.floor(doe / 1460) + Math.floor(doe / 36524) - Math.floor(doe / 146096)) / 365);
  const doy = doe - (365 * yoe + Math.floor(yoe / 4) - Math.floor(yoe / 100)), mp = Math.floor((5 * doy + 2) / 153);
  const d = doy - Math.floor((153 * mp + 2) / 5) + 1, m = mp + (mp < 10 ? 3 : -9);
  return (yoe + era * 400 + (m <= 2 ? 1 : 0)) + '-' + String(m).padStart(2, '0') + '-' + String(d).padStart(2, '0');
}
export const civI = (iso: string): number => civ(...ymd(iso));
export const addDays = (iso: string, n: number): string => fromCiv(civI(iso) + n);
export const daysBetween = (fromIso: string, toIso: string): number => civI(toIso) - civI(fromIso);
/** The weekday key of an ISO date ('mon' .. 'sun'). */
export const dayKey = (iso: string): string => JS7[sakamoto(...ymd(iso))] as string;
/** Monday 0 .. Sunday 6. */
export const offOf = (iso: string): number => (sakamoto(...ymd(iso)) + 6) % 7;
/** The Monday of an ISO date's week, as a day count. */
export const monOf = (iso: string): number => civI(iso) - offOf(iso);
/** The program week holding the test, by Monday arithmetic; null when the test is before the start. */
export const handWeek = (startIso: string, testIso: string): number | null => (civI(testIso) < civI(startIso) ? null : (monOf(testIso) - monOf(startIso)) / 7 + 1);
/** "Sun, Dec 6, 2026", built from integers. */
export const handDate = (iso: string): string => { const [y, m, d] = ymd(iso); return WD3[sakamoto(y, m, d)] + ', ' + MON3[m - 1] + ' ' + d + ', ' + y; };
/** A local wall clock time, for pinClock. */
export const localAt = (iso: string, h = 12, min = 0): Date => { const [y, m, d] = ymd(iso); return new Date(y, m - 1, d, h, min, 0); };

// ── plain data ──────────────────────────────────────────────────────────────────────────────────────────────────
export const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));
/** JSON with keys sorted, so two cards compare by content. */
export function canon(v: unknown): string {
  if (v === null || typeof v !== 'object') return JSON.stringify(v) || 'null';
  if (Array.isArray(v)) return '[' + v.map(canon).join(',') + ']';
  const o = v as Record<string, unknown>;
  return '{' + Object.keys(o).sort().map(k => JSON.stringify(k) + ':' + canon(o[k])).join(',') + '}';
}
export const own = (o: unknown, k: string): boolean => !!o && Object.prototype.hasOwnProperty.call(o, k);

// ── the cards ───────────────────────────────────────────────────────────────────────────────────────────────────
export const cards = (day: Day): Card[] => (!day || !day.cardio ? [] : [].concat(day.cardio).filter(Boolean));
export const runOf = (day: Day): Card | null => (day && !day.rest ? cards(day).find(c => c.type === 'run') || null : null);
export const isTrial = (c: Card): boolean => !!c && c.type === 'run' && /TIME TRIAL/.test(String(c.subtype || ''));
export const isLSD = (c: Card): boolean => /^Long Slow Distance \(LSD\)/.test(String((c && c.subtype) || ''));
/** The week's easy run: an LSD with no leg load. */
export const isEasy = (c: Card): boolean => !!c && c.type === 'run' && !c.legLoad && /^Long Slow Distance/.test(c.subtype || '');
/** The long run: an LSD with leg load. */
export const isLong = (c: Card): boolean => !!c && c.type === 'run' && !!c.legLoad && /^Long Slow Distance/.test(c.subtype || '');
/** The long card tagged for the taper, by its name. */
export const isTaperLong = (c: Card): boolean => /^Long Slow Distance \(LSD\) — Taper/.test(String((c && c.subtype) || ''));
// The NSW quality runs by the name the athlete reads (D103a): Short Interval (SI) is the interval run, Long Interval
// (LI) the continuous high intensity run. Bike and swim cards keep their older names.
export const RUN_QUALITY = { int: /^Short Interval \(SI\)/, chi: /^Long Interval \(LI\)/ };
const BIKE_SWIM_QUALITY = { int: /^Interval \(INT\)/, chi: /^Continuous High Intensity \(CHI\)/ };
export function quality(c: Card): 'int' | 'chi' | null {
  if (!c) return null;
  const s = String(c.subtype || ''), Q = c.type === 'run' ? RUN_QUALITY : BIKE_SWIM_QUALITY;
  return Q.int.test(s) ? 'int' : Q.chi.test(s) ? 'chi' : null;
}
export const isQualityRun = (c: Card): boolean => !!c && c.type === 'run' && quality(c) !== null;
/** Hard for the test eve: a quality run, the trial, or a long LSD. */
export const isHardRun = (c: Card): boolean => !!c && c.type === 'run' && (isQualityRun(c) || isTrial(c) || isLong(c));
/** Section labels that carry movements (a lift), optionally keeping a post-run mobility block out. */
export const lifted = (day: Day, keepMobility?: boolean): string[] => ((day && !day.rest ? day.sections || [] : []) as any[])
  .filter(s => (s.items || []).length && !(keepMobility && /post-run mobility/i.test(s.label || '')))
  .map(s => s.label || '?');
/** Every time trial in the program, as "W<n> <day>". */
export function trials(p: Prog): string[] {
  const t: string[] = [];
  for (const w of Object.keys(p.weeks || {}).sort((a, b) => +a - +b)) {
    for (const d of ISO7) for (const c of cards(p.weeks[w][d])) if (isTrial(c)) t.push('W' + w + ' ' + d);
  }
  return t;
}
/** A cell of a program: week number, day key. */
export interface Cell {
  w: number;
  d: string;
  iso?: string;
}
export const at = (p: Prog, x: Cell): Day => (p.weeks[x.w] ? p.weeks[x.w][x.d] : undefined);

// ── the fixtures ────────────────────────────────────────────────────────────────────────────────────────────────
export const PACE = { id: 'run_pace_goal', label: 'Hit a Pace / Time Goal', mileBestMins: '8', mileBestSecs: '15', mileBestSrc: { kind: 'entered' },
  targetDist: '1.5', targetMins: '11', targetSecs: '0', paceUnit: 'mi' };
export const MILE = { id: 'run_mile_time', label: 'Mile', mileBestMins: '8', mileBestSecs: '15', targetDist: '1', targetMins: '7', targetSecs: '30', paceUnit: 'mi' };
/** PRT TING: 1.5 mi in 11:00 (a 7:20 mile by hand), mile 8:15, start Mon 2026-09-21, test Mon 2026-10-19, rest Sun and Wed. */
export function prtTing(over?: TestCfg): TestCfg {
  return Object.assign({
    primaryPath: 'event', eventTargeted: true, raceDate: '2026-10-19', cardioTypes: ['run'], cardioGoals: { run: clone(PACE) },
    liftingFocus: 'balanced', experience: 'intermediate', ageBracket: '18-35', equipment: 'home_full', unit: 'lbs', restDays: ['sun', 'wed'],
    days: JS7.slice(), bench: 185, squat: 255, deadlift: 315, name: 'PRT TING', startDate: '2026-09-21', seed: 24865,
  }, over || {});
}
export const MIX: Record<string, { types: string[]; x: Record<string, { id: string; label: string }> }> = {
  run: { types: ['run'], x: {} },
  'run+bike': { types: ['run', 'bike'], x: { bike: { id: 'bike_base', label: 'Bike base' } } },
  'run+swim': { types: ['run', 'swim'], x: { swim: { id: 'swim_base', label: 'Swim base' } } },
  'run+bike+swim': { types: ['run', 'bike', 'swim'], x: { bike: { id: 'bike_ftp', label: 'FTP' }, swim: { id: 'swim_base', label: 'Swim base' } } },
};
export const LATTICE_START = '2026-10-05';   // a Monday
/** A cell of a dated test lattice: test week tw on weekday wd (0 Monday .. 6 Sunday). */
export interface TestCell {
  run?: Record<string, unknown>;
  mix?: string;
  rest: string[];
  tw: number;
  wd: number;
  injury?: Record<string, unknown> | null | undefined;
}
/**
 * A dated test goal pinned to its test week: test in week tw on weekday wd (0 Monday .. 6 Sunday) from Mon 2026-10-05.
 * `run` is the run goal (PACE by default), `mix` a MIX key, `rest` the rest days.
 */
export function datedTest({ run = PACE, mix = 'run', rest, tw, wd, injury }: TestCell): TestCfg {
  const m = MIX[mix] as (typeof MIX)[string];
  const cfg: TestCfg = { name: 'GK', primaryPath: 'event', eventTargeted: true, raceDate: addDays(LATTICE_START, 7 * (tw - 1) + wd), _testWeek: tw,
    _raceDateCappedWeeks: tw, cardioTypes: m.types.slice(), cardioGoals: Object.assign({ run: clone(run) }, clone(m.x)),
    liftingFocus: 'balanced', experience: 'intermediate', ageBracket: '18-35', equipment: 'home_full', unit: 'lbs', restDays: rest.slice(),
    days: JS7.slice(), bench: 185, squat: 255, deadlift: 315, startDate: LATTICE_START, seed: 24865 };
  if (injury) cfg['injury'] = clone(injury);
  return cfg;
}
/** The same cfg before the test pin: the week the scheduler dealt, which the pin post-pass is the only thing to change. */
export const prePin = (cfg: TestCfg): TestCfg => { const c = clone(cfg); delete c['_testWeek']; return c; };
/** Test day, T-1 and T-2 as program cells, read across the week boundary by date arithmetic. */
export function testDays(cfg: TestCfg): { t0: Cell; t1: Cell; t2: Cell } {
  const cell = (iso: string): Cell => ({ w: (monOf(iso) - monOf(cfg['startDate'])) / 7 + 1, d: dayKey(iso), iso });
  return { t0: cell(cfg['raceDate']), t1: cell(addDays(cfg['raceDate'], -1)), t2: cell(addDays(cfg['raceDate'], -2)) };
}

/** The app booted on a pinned clock (local noon of `todayIso`), with the toast silenced. */
export function engine(todayIso = '2026-09-21'): App {
  const IA = loadApp();
  pinClock(IA, localAt(todayIso));
  IA.eval('showToast = function(){}');
  return IA;
}
export const build = (IA: App, cfg: TestCfg): Prog => clone(IA.buildProgram(clone(cfg)));

// ── the lattices ────────────────────────────────────────────────────────────────────────────────────────────────
/** Every combination of the axes, as arrays in axis order. */
export const product = (...axes: unknown[][]): any[][] => axes.reduce<unknown[][]>((acc, ax) => acc.flatMap(a => ax.map(b => a.concat([b]))), [[]]);
/** Every k-th cell, from the first: a deterministic sample that keeps each axis in play. */
export const every = <T>(cells: T[], k: number): T[] => cells.filter((_, i) => i % k === 0);
export const tagOf = (cfg: TestCfg): string => `${cfg['cardioTypes'].join('+')} rest ${cfg['restDays'].join('') || 'none'} test ${cfg['raceDate']}`;
type Week2 = { w: number; d: string }[];
/** The days of weeks tw - 1 and tw, in order. */
const twoWeeks = (p: Prog, tw: number): Week2 => { const flat: Week2 = []; [tw - 1, tw].forEach(w => { if (p.weeks[w]) ISO7.forEach(d => flat.push({ w, d })); }); return flat; };

/** The trial week lattice: run, run+bike, run+swim x three rest sets x test weeks 3, 6, 9 x Mon, Tue, Thu, Sat. */
export const TRIAL_CELLS: TestCell[] = product(['run', 'run+bike', 'run+swim'], [['sun', 'wed'], ['sat', 'sun'], ['sun', 'tue', 'thu', 'sat']], [3, 6, 9], [0, 1, 3, 5])
  .map(([mix, rest, tw, wd]) => ({ mix, rest, tw, wd }));
export interface TrialTally {
  n: number;
  P1: string[];
  P2: string[];
  P3: string[];
  P4: string[];
  P5: string[];
  P6: string[];
  p4reach: number;
  hardSeen: number;
  p5reach: number;
}
/**
 * D106a: a dated test goal that ends on its test week carries its test. Per cell: exactly one trial, on the test day
 * (P1); the test day is titled Test Day with no section (P2, P3); when the pre-pin test week dealt no quality run, the
 * trial took the long card and none survives (P4); no quality run at T-1 or T-2 (P5); every bike and swim card before
 * the test day is the pre-pin card, the eve apart (it is D158's shakeout), and every day after the test rests (P6).
 */
export function trialWeek(IA: App, cells: TestCell[]): TrialTally {
  const T: TrialTally = { n: 0, P1: [], P2: [], P3: [], P4: [], P5: [], P6: [], p4reach: 0, hardSeen: 0, p5reach: 0 };
  for (const x of cells) {
    const cfg = datedTest(x), tw = x.tw, td = ISO7[x.wd] as string, tag = tagOf(cfg) + ` (W${tw} ${td})`;
    const p = build(IA, cfg), pre = build(IA, prePin(cfg));
    T.n++;
    const tr = trials(p);
    if (!(tr.length === 1 && tr[0] === 'W' + tw + ' ' + td)) T.P1.push(tag + ': trials ' + (tr.join(',') || 'none'));
    const day = p.weeks[tw] && p.weeks[tw][td];
    if (!day || day.title !== 'Test Day' || lifted(day).length) T.P2.push(tag + ': ' + (day ? day.title + ' / ' + lifted(day).join('+') : 'no day'));
    if (!day || (day.sections || []).length) T.P3.push(tag + ': ' + (day ? (day.sections || []).length + ' sections' : 'no day'));
    const runsOf = (q: Prog, w: number): Card[] => ISO7.map(d => q.weeks[w] && q.weeks[w][d] && q.weeks[w][d].cardio).filter(c => c && c.type === 'run');
    const preRuns = runsOf(pre, tw), pinRuns = runsOf(p, tw);
    T.hardSeen += [tw - 1, tw].reduce((n, w) => n + (w >= 1 ? runsOf(pre, w).filter(isQualityRun).length : 0), 0);
    if (!preRuns.some(isQualityRun)) {
      T.p4reach++;
      if (!(preRuns.some(isTaperLong) && !pinRuns.some(isTaperLong))) {
        T.P4.push(tag + ': pre ' + preRuns.map(c => c.subtype).join('|') + ' / pinned ' + pinRuns.map(c => c.subtype).join('|'));
      }
    }
    const flat = twoWeeks(p, tw);
    const ti = flat.findIndex(y => y.w === tw && y.d === td);
    const eve2 = [1, 2].map(k => flat[ti - k]).filter((y): y is Week2[number] => !!y);
    T.p5reach += eve2.filter(y => { const c = pre.weeks[y.w] && pre.weeks[y.w][y.d] && pre.weeks[y.w][y.d].cardio; return c && isQualityRun(c); }).length;
    const eveHard = eve2.filter(y => { const c = p.weeks[y.w][y.d] && p.weeks[y.w][y.d].cardio; return c && isQualityRun(c); });
    if (eveHard.length) T.P5.push(tag + ': ' + eveHard.map(y => 'W' + y.w + ' ' + y.d).join(','));
    const moved: string[] = [];
    flat.slice(0, ti).forEach((y, i) => {
      if (i === ti - 1) return;   // the eve is D158's shakeout
      const a = pre.weeks[y.w] && pre.weeks[y.w][y.d] && pre.weeks[y.w][y.d].cardio;
      if (a && a.type !== 'run') { const b = p.weeks[y.w][y.d] && p.weeks[y.w][y.d].cardio; if (canon(a) !== canon(b)) moved.push('W' + y.w + ' ' + y.d + ' ' + a.type); }
    });
    const notRest = ISO7.slice(x.wd + 1).filter(d => !(p.weeks[tw][d] && p.weeks[tw][d].rest));
    if (moved.length || notRest.length) T.P6.push(tag + ': moved ' + (moved.join(',') || 'none') + '; not resting ' + (notRest.join(',') || 'none'));
  }
  return T;
}

/** The eve lattice of the D106a fix-forward: per run goal and mix, five rest sets x test weeks 2, 3, 5 x Mon, Tue, Thu, Sat. */
export const EVE_GOALS: Record<string, Record<string, unknown>> = { run_pace_goal: PACE, run_mile_time: MILE };
const EVE_REST = [['sun'], ['sun', 'wed'], ['sat', 'sun'], ['sun', 'tue', 'thu', 'sat'], []];
export interface EveCell extends TestCell {
  goal: string;
}
export const EVE_CELLS: EveCell[] = product(Object.keys(EVE_GOALS), ['run', 'run+bike', 'run+swim'], EVE_REST, [2, 3, 5], [0, 1, 3, 5])
  .map(([goal, mix, rest, tw, wd]) => ({ goal, mix, rest, tw, wd }));
export interface EveTally {
  progs: number;
  reach: number;
  eveRuns: number;
  Q1: string[];
  shk: number;
  Q2: string[];
  repl: number;
  rest: number;
  Q3: string[];
  eveDays: number;
  Q8: string[];
}
/**
 * The D106a fix-forward and D158 at T-1 and T-2. Per group: no run card at T-1 or T-2 carries leg load (Q1); every
 * Shakeout day's run card is the easy LSD (Q2); where the pre-pin week dealt the long LSD at T-1, the eve is the
 * shakeout from the easy-run builder at the week's easy distance, and at T-2 it became the pre-pin week's easy LSD,
 * whole card (Q3); T-1 and T-2 carry no lift section, a post-run mobility block apart (Q8). `reach` counts the cells
 * where the pre-pin week dealt the long LSD at T-1 or T-2.
 */
export function eveWeek(IA: App, cells: EveCell[]): EveTally {
  const A: EveTally = { progs: 0, reach: 0, eveRuns: 0, Q1: [], shk: 0, Q2: [], repl: 0, rest: 0, Q3: [], eveDays: 0, Q8: [] };
  for (const x of cells) {
    const cfg = datedTest({ run: EVE_GOALS[x.goal], mix: x.mix, rest: x.rest, tw: x.tw, wd: x.wd });
    const tw = x.tw, td = ISO7[x.wd], tag = x.goal + ' ' + tagOf(cfg);
    const p = build(IA, cfg), pre = build(IA, prePin(cfg));
    A.progs++;
    const flat = twoWeeks(p, tw);
    const ti = flat.findIndex(y => y.w === tw && y.d === td);
    const preHardInTest = ISO7.some(d => isQualityRun(runOf(pre.weeks[tw] && pre.weeks[tw][d])));
    for (const k of [1, 2]) {
      const y = flat[ti - k]; if (!y) continue;
      const lab = tag + ' T-' + k + ' W' + y.w + ' ' + y.d, day = p.weeks[y.w][y.d], c = runOf(day);
      A.eveDays++;
      const ls = lifted(day, true); if (ls.length) A.Q8.push(lab + ' ' + ls.join('+'));
      if (c) { A.eveRuns++; if (c.legLoad) A.Q1.push(lab + ' ' + c.subtype); }
      const a = runOf(pre.weeks[y.w] && pre.weeks[y.w][y.d]);
      if (!isLong(a)) continue;
      A.reach++;
      const preWeek = ISO7.map(d => runOf(pre.weeks[y.w][d])).filter(isEasy);
      if (k === 1) {
        const ezMi = [...new Set(preWeek.map(e => e.dose && e.dose.mi))];
        if (c) {
          A.repl++;
          if (!(isEasy(c) && c.subtype === 'Long Slow Distance (LSD)' && !!c.dose && c.dose.k === 'dist' && c.dose.key === 'easy'
            && (ezMi.length === 0 || (ezMi.length === 1 && c.dose.mi === ezMi[0])))) {
            A.Q3.push(lab + ' got ' + c.subtype + ' ' + canon(c.dose) + ' legLoad ' + c.legLoad + ', want the shakeout at ' + (ezMi.join('/') || "the week's easy") + ' mi');
          }
        } else { A.rest++; A.Q3.push(lab + ' rests, but a training-day eve carries the shakeout'); }
      } else if (c) {
        A.repl++;
        const ez = [...new Set(preWeek.map(canon))];
        if (!ez.includes(canon(c))) A.Q3.push(lab + ' got ' + c.subtype + ' ' + canon(c.dose) + ', want one of ' + ez.length + ' pre-pin easy LSD cards');
      } else {
        A.rest++;
        if (preWeek.length && !(y.w === tw && !preHardInTest)) A.Q3.push(lab + ' rests, but the pre-pin week dealt an easy LSD and the long card was not the trial source');
      }
    }
    for (const w of Object.keys(p.weeks)) {
      for (const d of ISO7) {
        const day = p.weeks[w][d];
        if (day && day.title === 'Shakeout') { A.shk++; const c = runOf(day); if (!c || c.legLoad) A.Q2.push(tag + ' W' + w + ' ' + d + ' ' + (c ? c.subtype + ' legLoad ' + c.legLoad : 'no run card')); }
      }
    }
  }
  return A;
}

/** B4 at T-2: three mixes x eight rest sets x test weeks 1, 2, 5 x every weekday. */
const B4_REST = [[], ['sun'], ['sun', 'wed'], ['sat', 'sun'], ['mon', 'thu'], ['sun', 'tue', 'thu', 'sat'], ['fri'], ['wed', 'thu', 'fri']];
export const B4_CELLS: TestCell[] = product(['run', 'run+bike', 'run+swim'], B4_REST, [1, 2, 5], [0, 1, 2, 3, 4, 5, 6]).map(([mix, rest, tw, wd]) => ({ mix, rest, tw, wd }));
/** Wherever the pre-pin week dealt a quality run two days before the test, the pinned T-2 carries no hard run. */
export function b4Week(IA: App, cells: TestCell[]): { n: number; reach: number; bad: string[] } {
  const B = { n: 0, reach: 0, bad: [] as string[] };
  for (const x of cells) {
    const cfg = datedTest(x), p = build(IA, cfg), pre = build(IA, prePin(cfg)), { t2 } = testDays(cfg);
    if (t2.w < 1) continue;
    B.n++;
    if (cards(at(pre, t2)).some(isQualityRun)) B.reach++;
    const h = cards(at(p, t2)).filter(isHardRun);
    if (h.length) B.bad.push(tagOf(cfg) + ' T-2 W' + t2.w + ' ' + t2.d + ': ' + h.map(c => c.subtype + ' legLoad ' + c.legLoad).join(' + '));
  }
  return B;
}

/** D158's lattice: pace and mile x four mixes x seven rest sets x test weeks 2, 5 x every weekday. */
const SHAKEOUT_GOALS: Record<string, Record<string, unknown>> = {
  pace: { id: 'run_pace_goal', label: 'Hit a Pace / Time Goal', mileBestMins: '8', mileBestSecs: '15', targetDist: '1.5', targetMins: '11', targetSecs: '0', paceUnit: 'mi' },
  mile: Object.assign({}, MILE, { baselineDist: '3' }),
};
const SHAKEOUT_REST = [[], ['sun'], ['sun', 'wed'], ['sat', 'sun'], ['mon', 'thu'], ['sun', 'tue', 'thu', 'sat'], ['fri']];
export const SHAKEOUT_CELLS: EveCell[] = product(Object.keys(SHAKEOUT_GOALS), Object.keys(MIX), SHAKEOUT_REST, [2, 5], [0, 1, 2, 3, 4, 5, 6])
  .map(([goal, mix, rest, tw, wd]) => ({ goal, mix, rest, tw, wd }));
export interface ShakeoutTally {
  n: number;
  te: number;
  re: number;
  tePrev: number;
  pre: { bike: number; swim: number; run: number; lift: number };
  D1: string[];
  D2: string[];
  d2reach: number;
  D3: string[];
  D4: string[];
}
/**
 * D158: a training-day eve carries the shakeout and nothing else (D1) at the week's easy distance, read off the
 * pre-pin week's other days (D2, reached on `d2reach` eves); a rest-day eve rests (D3); no hard run at T-1 or T-2, no
 * lift at T-1, one trial on the test day (D4). `pre` counts what the pre-pin eve held (bike, swim, run, lift only).
 */
export function eveShakeout(IA: App, cells: EveCell[]): ShakeoutTally {
  const A: ShakeoutTally = { n: 0, te: 0, re: 0, tePrev: 0, pre: { bike: 0, swim: 0, run: 0, lift: 0 }, D1: [], D2: [], d2reach: 0, D3: [], D4: [] };
  for (const x of cells) {
    const cfg = datedTest({ run: SHAKEOUT_GOALS[x.goal], mix: x.mix, rest: x.rest, tw: x.tw, wd: x.wd });
    const { t0, t1, t2 } = testDays(cfg), tag = x.goal + ' ' + tagOf(cfg) + ` (W${t0.w} ${t0.d}) eve W${t1.w} ${t1.d}`;
    const p = build(IA, cfg), pre = build(IA, prePin(cfg));
    A.n++;
    const day = at(p, t1);
    if (!cfg['restDays'].includes(t1.d)) {
      A.te++; if (t1.w === x.tw - 1) A.tePrev++;
      const pc = cards(at(pre, t1));
      if (pc.some(c => c.type === 'bike')) A.pre.bike++;
      if (pc.some(c => c.type === 'swim')) A.pre.swim++;
      if (pc.some(c => c.type === 'run')) A.pre.run++;
      if (!pc.length) A.pre.lift++;
      const cs = cards(day), c = cs[0];
      const good = !!day && !day.rest && day.title === 'Shakeout' && cs.length === 1 && isEasy(c) && c.subtype === 'Long Slow Distance (LSD)'
        && c.legLoad === false && !!c.dose && c.dose.k === 'dist' && c.dose.key === 'easy' && lifted(day).length === 0;
      if (!good) A.D1.push(tag + ': ' + (day ? day.title + ' rest=' + !!day.rest + ' cards=' + cs.map(y => y.type + ':' + y.subtype + ' leg=' + y.legLoad + ' ' + canon(y.dose)).join(' + ') + ' lifts=' + lifted(day).join('+') : 'no day'));
      const wk = pre.weeks[t1.w] || {};
      const ez = [...new Set(ISO7.filter(d => d !== t1.d).flatMap(d => cards(wk[d]).filter(y => isEasy(y) && y.subtype === 'Long Slow Distance (LSD)')).map(y => y.dose && y.dose.mi))];
      if (ez.length) {
        A.d2reach++;
        if (!(ez.length === 1 && c && c.dose && c.dose.mi === ez[0])) A.D2.push(tag + ': shakeout ' + (c && c.dose ? c.dose.mi : '-') + ' mi, week easy LSD ' + ez.join('/') + ' mi');
      }
    } else {
      A.re++;
      if (!(day && day.rest && day.title === 'Rest' && cards(day).length === 0)) A.D3.push(tag + ': ' + (day ? day.title + ' rest=' + !!day.rest + ' cards=' + cards(day).length : 'no day'));
    }
    const bad: string[] = [];
    ([[t1, 'T-1'], [t2, 'T-2']] as [Cell, string][]).forEach(([y, k]) => cards(at(p, y)).filter(isHardRun).forEach(c => bad.push(k + ' ' + c.subtype)));
    if (lifted(at(p, t1)).length) bad.push('T-1 lifts ' + lifted(at(p, t1)).join('+'));
    const tr = trials(p);
    if (!(tr.length === 1 && tr[0] === 'W' + t0.w + ' ' + t0.d)) bad.push('trials ' + (tr.join(',') || 'none'));
    if (bad.length) A.D4.push(tag + ': ' + bad.join('; '));
  }
  return A;
}

// D158 skips the protect-park injury modes (the D113a exclusion key): noimpact, noimpact_swim, easy, reduce. Under
// them a training-day eve is handled as it was before D158 (V213, the ruling's named oracle): the same card types and
// subtypes, the same lift presence, the same rest flag. The eve signatures are pinned in tests/snapshots/test-week.json.
export const INJURIES: Record<string, Record<string, unknown> | null> = { none: null, easy: { region: 'lowback', tier: 'workaround' }, noimpact: { region: 'knee', tier: 'protect' },
  noimpact_swim: { region: 'lowback', tier: 'protect' }, reduce: { region: 'ankle', tier: 'workaround' },
  swimout: { region: 'shoulder', tier: 'protect' }, halfstep: { region: 'knee', halfstep: true } };
export const PROTECT_PARK = ['noimpact', 'noimpact_swim', 'easy', 'reduce'];
const PARK_PLACES = [[1, 3], [2, 5], [3, 6], [4, 0]];   // test on week 1 Thu, week 2 Sat, week 3 Sun, week 4 Mon
export interface ParkCell extends TestCell {
  inj: string;
}
export const PARK_CELLS: ParkCell[] = product(['run', 'run+bike', 'run+swim'], B4_REST, PARK_PLACES, Object.keys(INJURIES))
  .map(([mix, rest, [tw, wd], inj]) => ({ mix, rest, tw, wd, inj }));
const isLiftSection = (s: any): boolean => !!s && (s.items || []).length && !/mobility|stretch|taper/i.test(s.label || '');
export function eveSig(day: Day): string {
  const L = ((day && !day.rest ? day.sections || [] : []) as any[]).filter(isLiftSection);
  return canon({ rest: !day || !!day.rest, lift: L.length > 0, cards: cards(day).map(c => c.type + ':' + (c.subtype || '')).sort() });
}
/** The training-day eve signature of every protect-park cell, keyed by its tag; `reach` counts the cells per mode. */
export function protectParkEves(IA: App, cells: ParkCell[]): { sigs: Record<string, string>; reach: Record<string, number> } {
  const plan = IA.eval('injuryPlan'), sigs: Record<string, string> = {}, reach: Record<string, number> = {};
  for (const x of cells) {
    const cfg = datedTest({ mix: x.mix, rest: x.rest, tw: x.tw, wd: x.wd, injury: INJURIES[x.inj] });
    const mode: string = (plan(clone(cfg)) || {}).cardioMode || 'none', { t1 } = testDays(cfg);
    if (!PROTECT_PARK.includes(mode) || cfg['restDays'].includes(t1.d)) continue;
    reach[mode] = (reach[mode] || 0) + 1;
    sigs[`${x.mix} rest ${x.rest.join('') || 'none'} ${x.inj} test ${cfg['raceDate']}`] = eveSig(at(build(IA, cfg), t1));
  }
  return { sigs, reach };
}
