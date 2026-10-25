// Helpers for the run week layout tests: tests/integration/run-week-layout.test.ts runs each claim on a seeded sample,
// tests/sweeps/run-week-layout.test.ts runs the whole lattices. Built on tests/support/app.ts; the leg lift placement
// and long-run day helpers (tests/support/leg-lift-placement.ts, long-run-day.ts) build on this file in turn.
//
// What a run week is, typed here from the rulings and never asked of the app:
//   the week      Sunday first and circular (D130): Saturday and Sunday are neighbours. ISO order (Monday first) is
//                 the order "the last run of the week" is read in.
//   the cards     an NSW run card is read by its dose key: 'int' is the Short Interval (SI), 'chi' the Long Interval
//                 (LI) (D103a); a Long Slow Distance (LSD) card is the long run when it loads the legs and the easy run
//                 when it does not. cardNameAgrees() holds the printed name to the key.
//   adjacency     two hard runs (INT, CHI, the long run) on neighbouring days are a pair. On the pace family the one
//                 TOLERATED pair is a CHI on the calendar eve of the long run; every other pair is UNTOLERATED (D130).
//   the objective the run day chooser's ranks, highest first (D125, D129, D130): fewest untolerated pairs, fewest
//                 tolerated pairs, the long run on the last training day, quality days after a rest day, an easy run
//                 the day before the long run, INT before CHI, the even spread subset the athlete already has, the
//                 shortest longest run free stretch, the most rest from the last quality day into the long run, the
//                 earliest first quality day. Ranks 6 to 9 and the tolerated pair are pace family only; NRC keeps its
//                 two long run pins (the subset ends on the last training day, the long run is the last chosen day)
//                 and its shipped "easy run before the long" predicate, read through the Sunday first list.
//   layouts()     every subset of training days crossed with every distinct permutation of the session types, in
//                 the enumeration order the legacy gates used, each scored by that objective. The engine's pick must
//                 be a maximum of it.
//
// chooser() lifts the app's own run day chooser (_nrcSpacedRunDays) and its session tables out of the inline script
// and runs them alone: they are nested inside the cardio engine, so tests/support/app.ts appFunction cannot reach them.
import * as vm from 'node:vm';
import { appScript, loadApp, pinClock } from './app.ts';
import type { DayKey } from '@ia/core';
import type { App } from './app.ts';
import { stripComments } from './week-view.ts';

/** A weekday key, 'sun' to 'sat'. */
export type Day = DayKey;
/** A config as these tests write it: the wizard's shape, with the engine's private fields where a ruling needs them. */
export type RunCfg = Record<string, any>;
/** What the app's untyped engine returns: a program, a day, a card. */
export type AppProgram = any;
export type AppDay = any;
export type AppCard = any;
/** One rest-day calendar: its rest days, its training days in Sunday-first order, and its key ('sun,wed', 'none'). */
export interface Calendar {
  rest: Day[];
  train: Day[];
  key: string;
}
/** The session type tokens of one family: the long run, the easy run, the two quality sessions. */
export interface Tokens {
  long: string;
  rec: string;
  s1: string;
  s2: string;
}
/** The type each chosen day carries (only the chosen days are keys). */
export type TypeOf = Partial<Record<Day, string>>;
/** The chooser's return: the chosen indices into the training days, their types, and its scored terms. */
export interface Pick {
  idxs: number[];
  typeOf: TypeOf;
  coll: number;
  untol: number;
  tol: number;
  [term: string]: unknown;
}
/** One scored layout of the hand search (see layouts()). */
export interface Layout {
  idxs: number[];
  days: Day[];
  typeOf: TypeOf;
  coll: number;
  untol: number;
  tol: number;
  longLast: number;
  lf: number;
  qr: number;
  ident: number;
  ruled: number[];
  shipped: number[];
  rank: number[];
  hard: string;
}
/** The app's chooser and session tables, lifted out and run alone. */
export interface Chooser {
  /** `exp` is the athlete's experience: on NRC it picks one speed slot or two (D243). */
  choose(train: Day[], cap: number, goal: string, pace: boolean, exp: string | null | undefined): Pick;
  sessionTypes(...args: unknown[]): string[];
  nrcTypes(cap: number, goal: string, exp: string | null | undefined): string[];
  isSpeedGoal(goal: string): boolean;
}

/** The day every build sees as today (local time), as tests/integration/program-output.test.ts pins it. */
export const TODAY = new Date(2026, 9, 11, 12, 0, 0);

export const DAYS: Day[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
export const ISO: Day[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
export const pos = (d: Day): number => DAYS.indexOf(d);
export const circ = (a: Day, b: Day): number => { const r = Math.abs(pos(a) - pos(b)); return Math.min(r, 7 - r); };
export const prevDay = (d: Day): Day => DAYS[(pos(d) + 6) % 7] as Day;
export const nextDay = (d: Day): Day => DAYS[(pos(d) + 1) % 7] as Day;
export const clone = <T>(o: T): T => JSON.parse(JSON.stringify(o));

/** Every k-subset of arr, in lexicographic order. */
export function combos<T>(arr: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (arr.length < k) return [];
  const [h, ...t] = arr as [T, ...T[]];
  return combos(t, k - 1).map(c => [h, ...c]).concat(combos(t, k));
}
/** Every permutation of a, first element first. */
export function perms<T>(a: T[]): T[][] {
  if (!a.length) return [[]];
  const o: T[][] = [];
  a.forEach((x, i) => perms(a.slice(0, i).concat(a.slice(i + 1))).forEach(p => o.push([x, ...p])));
  return o;
}
/** The rest-day calendars with nRest rest days, for each count listed, in the order the gates walked them. */
export function calendars(counts: number[]): Calendar[] {
  const out: Calendar[] = [];
  counts.forEach(n => combos(DAYS, n).forEach(rest => out.push({ rest, train: DAYS.filter(d => !rest.includes(d)), key: rest.join(',') || 'none' })));
  return out;
}
/** Every k-th element, from the first: a deterministic sample of a lattice. */
export const every = <T>(list: T[], k: number): T[] => list.filter((_, i) => i % k === 0);

// ── the app, booted once with its clock pinned ───────────────────────────────────────────────────────────────────
let IA: App | null = null;
export function app(): App {
  if (!IA) { IA = loadApp(); pinClock(IA, TODAY); }
  return IA;
}
export const build = (cfg: RunCfg): AppProgram => app().buildProgram(clone(cfg));
export const weeksOf = (p: AppProgram): number[] => Object.keys(p.weeks).map(Number).sort((a, b) => a - b);
export const cards = (day: AppDay): AppCard[] => (!day || !day.cardio) ? [] : ([] as AppCard[]).concat(day.cardio).filter(Boolean);

let CODE: string | null = null;
/** The inline script with every comment stripped, for "the source still says X" scans. */
export function code(): string {
  if (CODE === null) CODE = stripComments(appScript());
  return CODE;
}
export const flat = (): string => code().replace(/\s+/g, ' ');
export const occurrences = (hay: string, needle: string): number => hay.split(needle).length - 1;

// ── source surgery: the chooser, lifted out and run alone ─────────────────────────────────────────────────────────
/** The text of `function name(...) {...}`, which must occur exactly once in src; braces are matched past strings and comments. */
export function liftFunction(src: string, name: string): string {
  const sig = 'function ' + name + '(';
  const n = occurrences(src, sig);
  if (n !== 1) throw new Error('liftFunction: "' + sig + '" occurs ' + n + ' times (want 1)');
  const i = src.indexOf(sig);
  let depth = 0, mode: string | null = null;
  for (let k = src.indexOf('{', i); k < src.length; k++) {
    const c = src[k], d = src[k + 1];
    if (mode === 'line') { if (c === '\n') mode = null; continue; }
    if (mode === 'block') { if (c === '*' && d === '/') { mode = null; k++; } continue; }
    if (mode) { if (c === String.fromCharCode(92)) { k++; continue; } if (c === mode) mode = null; continue; }
    if (c === '/' && d === '/') { mode = 'line'; k++; continue; }
    if (c === '/' && d === '*') { mode = 'block'; k++; continue; }
    if (c === '"' || c === "'" || c === '`') { mode = c; continue; }
    if (c === '{') depth++;
    else if (c === '}') { depth--; if (depth === 0) return src.slice(i, k + 1); }
  }
  throw new Error('liftFunction: ' + name + ' never closes');
}
let CHOOSER: Chooser | null = null;
/**
 * The app's run day chooser and the tables it deals from, compiled together in a fresh context with the week order
 * typed: choose(trainDays, capDays, goalId, paceFam, experience) is _nrcSpacedRunDays; sessionTypes is getSessionTypes;
 * nrcTypes is getNRCSessionTypes; isSpeedGoal is the app's. Results are plain data (copied out of the context).
 */
export function chooser(): Chooser {
  if (CHOOSER) return CHOOSER;
  const js = appScript();
  const parts = ['const ALL_DAYS_ORDER = ' + JSON.stringify(DAYS) + ';'];
  ['isSpeedGoal', 'getNRCSessionTypes', 'getSessionTypes', '_nrcSpacedRunDays'].forEach(n => parts.push(liftFunction(js, n)));
  const ctx = vm.createContext({});
  vm.runInContext(parts.join('\n') + '\nglobalThis.__out = { c: _nrcSpacedRunDays, gs: getSessionTypes, gn: getNRCSessionTypes, sp: isSpeedGoal };', ctx);
  const o = ctx['__out'];
  CHOOSER = {
    choose: (train, cap, goal, pace, exp) => { const r = o.c(train.slice(), cap, goal, pace, undefined, undefined, exp); return r ? clone(r) : r; },
    sessionTypes: (...a) => clone(o.gs(...a)),
    nrcTypes: (cap, goal, exp) => clone(o.gn(cap, goal, exp)),
    isSpeedGoal: g => o.sp(g),
  };
  return CHOOSER;
}

// ── the session tables, typed ─────────────────────────────────────────────────────────────────────────────────────
export const TP: Tokens = { long: 'lsd_long', rec: 'lsd_easy', s1: 'int', s2: 'chi' };
export const TN: Tokens = { long: 'nrc_long', rec: 'nrc_recovery', s1: 'nrc_speed1', s2: 'nrc_speed2' };
/** NSW Table 7, as the pace family deals it (D113a): two runs are easy and long; three are INT, CHI and long; four add the easy run. */
export const NSW_RUN_TYPES: Record<number, string[]> = { 2: ['lsd_easy', 'lsd_long'], 3: ['int', 'chi', 'lsd_long'], 4: ['lsd_easy', 'int', 'chi', 'lsd_long'] };
/** The spacer fallback (D113a): a three-run week no INT, CHI, long layout can keep clean of an untolerated pair. */
export const NSW_FALLBACK3 = ['lsd_easy', 'int', 'lsd_long'];
/** The three-run row D129 was ruled on (the fallback row, and the row an excluded injury mode keeps). */
export const D129_TYPES: Record<number, string[]> = { 3: NSW_FALLBACK3, 4: NSW_RUN_TYPES[4] as string[] };
/**
 * The NRC type table by run count: the marathon carries one speed day; every other plan two for an advanced athlete
 * and one for everyone else, the second slot a recovery run (D243). No experience reads as intermediate.
 */
export function nrcTypesHand(n: number, goal: string, exp: string | null | undefined): string[] {
  if (goal === 'run_marathon') {
    if (n >= 5) return ['nrc_recovery', 'nrc_speed1', 'nrc_recovery', 'nrc_recovery', 'nrc_long'];
    const M: Record<number, string[]> = { 4: ['nrc_recovery', 'nrc_speed1', 'nrc_recovery', 'nrc_long'], 3: ['nrc_speed1', 'nrc_recovery', 'nrc_long'], 2: ['nrc_recovery', 'nrc_long'], 1: ['nrc_long'] };
    return M[n] as string[];
  }
  const two = exp === 'advanced';
  if (n >= 5) return two ? ['nrc_speed1', 'nrc_recovery', 'nrc_speed2', 'nrc_recovery', 'nrc_long'] : ['nrc_speed1', 'nrc_recovery', 'nrc_recovery', 'nrc_recovery', 'nrc_long'];
  const O: Record<number, string[]> = { 4: two ? ['nrc_speed1', 'nrc_recovery', 'nrc_speed2', 'nrc_long'] : ['nrc_speed1', 'nrc_recovery', 'nrc_recovery', 'nrc_long'], 3: ['nrc_speed1', 'nrc_recovery', 'nrc_long'], 2: ['nrc_recovery', 'nrc_long'], 1: ['nrc_long'] };
  return O[n] as string[];
}
export const NRC_PLANS = ['run_5k', 'run_10k', 'run_half', 'run_marathon'];
export const PACE_IDS = ['run_pace_goal', 'run_mile_time', 'run_15_under10'];

// ── adjacency and the objective ───────────────────────────────────────────────────────────────────────────────────
/** Hard pairs on neighbouring days of one week: {coll, untol, tol}. Off the pace family nothing is tolerated. */
export function adjacency(days: Day[], typeOf: TypeOf, T: Tokens, pace: boolean): { coll: number; untol: number; tol: number } {
  const hard = days.filter(d => d && [T.s1, T.s2, T.long].includes(typeOf[d] as string));
  const L = days.find(d => typeOf[d] === T.long);
  let coll = 0, untol = 0, tol = 0;
  for (let a = 0; a < hard.length; a++) for (let b = a + 1; b < hard.length; b++) {
    const x = hard[a] as Day, y = hard[b] as Day;
    if (circ(x, y) !== 1) continue;
    coll++;
    const chiEve = pace && !!L && ((typeOf[x] === T.s2 && y === L && x === prevDay(L)) || (typeOf[y] === T.s2 && x === L && y === prevDay(L)));
    if (chiEve) tol++; else untol++;
  }
  return { coll, untol, tol };
}
/** The pace family's D130 split on a built week, by run type tokens: {coll, untol, tol}. */
export const classify = (days: Day[], typeOf: TypeOf) => adjacency(days, typeOf, TP, true);
export function evenIdx(n: number, cap: number): number[] {
  const s: number[] = [];
  if (cap <= 1) { s.push(n - 1); return s; }
  for (let k = 0; k < cap; k++) { const v = Math.round(k * (n - 1) / (cap - 1)); if (!s.includes(v)) s.push(v); }
  return s.sort((a, b) => a - b);
}
/** The longest run of consecutive run-free days on the circular week. */
export function longestFree(days: Day[]): number {
  const P = days.map(pos).sort((a, b) => a - b);
  let lf = 0;
  for (let i = 0; i < P.length; i++) { const nx = (i + 1 < P.length) ? (P[i + 1] as number) : (P[0] as number) + 7; const g = nx - (P[i] as number) - 1; if (g > lf) lf = g; }
  return lf;
}
export const cmp = (a: number[], b: number[]): number => { for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return (a[i] as number) - (b[i] as number); return 0; };
/** The candidates of `list` whose `key` vector ties the best, in enumeration order. */
export function topBy<T extends object>(list: T[], key: string): T[] {
  const v = (c: T): number[] => (c as Record<string, any>)[key];
  let b = list[0] as T;
  list.forEach(c => { if (cmp(v(c), v(b)) > 0) b = c; });
  return list.filter(c => cmp(v(c), v(b)) === 0);
}
/**
 * Every layout of `types` on `cap` of the training days `train`, scored. pace: the pace family's objective; otherwise
 * NRC's, with both long run pins. Each candidate carries:
 *   rank   the full objective, ten terms (identity, spread and the earliest quality day are 0 off the pace family);
 *   ruled  its ruled head: on the pace family [-untol, -tol, longLast, speedsAfterRest, recBeforeLong, canonical]; on
 *          NRC (D244) [-untol, -tol, longLast, qualRest, speedsAfterRest, recBeforeLong, canonical], the rest into the
 *          long run, the distance back from the long run to the last quality day, ranked third;
 *   shipped  ruled with recBeforeLong read through the Sunday first list (NRC's predicate, and the pace family's before D129);
 *   coll, untol, tol, lf (longest run-free stretch), qr (rank 8), hard (the non-easy days and their types).
 */
export function layouts(train: Day[], cap: number, types: string[], T: Tokens, pace: boolean): Layout[] {
  const inTrain = new Set(train), last = train[train.length - 1], ek = evenIdx(train.length, cap).join(',');
  const out: Layout[] = [], seen: Record<string, number> = {};
  combos(train.map((_, i) => i), cap).forEach(idxs => {
    if (!pace && idxs[idxs.length - 1] !== train.length - 1) return;
    const days = idxs.map(i => train[i] as Day);
    perms(types).forEach(p => {
      const typeOf: TypeOf = {};
      days.forEach((d, i) => { typeOf[d] = p[i] as string; });
      const sig = idxs.join() + '|' + days.map(d => typeOf[d]).join();
      if (seen[sig]) return;
      seen[sig] = 1;
      const longDay = days.find(d => typeOf[d] === T.long);
      if (!pace && longDay && longDay !== days[days.length - 1]) return;
      const a = adjacency(days, typeOf, T, pace);
      const quality = days.filter(d => typeOf[d] === T.s1 || typeOf[d] === T.s2);
      const sar = quality.filter(d => !inTrain.has(prevDay(d))).length;
      const rblEve = longDay && days.some(d => typeOf[d] === T.rec && d === prevDay(longDay)) ? 1 : 0;
      const rblShipped = longDay && days.some(d => typeOf[d] === T.rec && circ(d, longDay) === 1 && pos(d) < pos(longDay)) ? 1 : 0;
      const ll = (!longDay || longDay === last) ? 1 : 0;
      const s1 = days.find(d => typeOf[d] === T.s1), s2 = days.find(d => typeOf[d] === T.s2);
      const can = (s1 && s2 && pos(s1) < pos(s2)) ? 1 : 0;
      const lf = longestFree(days);
      const qrAll = (longDay && quality.length) ? Math.min(...quality.map(d => (pos(longDay) - pos(d) + 7) % 7)) : 0;
      const qr = pace ? qrAll : 0;
      const qf = (pace && quality.length) ? -pos(quality[0] as Day) : 0;
      const ident = pace && idxs.join(',') === ek ? 1 : 0;
      const rbl = pace ? rblEve : rblShipped;
      const ruled = pace ? [-a.untol, -a.tol, ll, sar, rbl, can] : [-a.untol, -a.tol, ll, qrAll, sar, rbl, can];
      out.push({
        idxs, days, typeOf, coll: a.coll, untol: a.untol, tol: a.tol, longLast: ll, lf, qr, ident,
        ruled, shipped: [-a.untol, -a.tol, ll, sar, rblShipped, can],
        rank: pace ? ruled.concat([ident, -lf, qr, qf]) : ruled.concat([0, 0, 0]),
        hard: days.filter(d => typeOf[d] !== T.rec).map(d => d + ':' + typeOf[d]).join(' '),
      });
    });
  });
  return out;
}
/** The pace family's types for a capped week (D113a): Table 7's row, or the spacer fallback where three runs cannot stay clean. */
export function paceTypes(train: Day[], cap: number): string[] {
  if (cap !== 3) return NSW_RUN_TYPES[cap] as string[];
  const clean = layouts(train, 3, NSW_RUN_TYPES[3] as string[], TP, true).some(c => c.untol === 0);
  return clean ? NSW_RUN_TYPES[3] as string[] : NSW_FALLBACK3;
}
/** The candidate in `list` that is the chooser's pick (same days, same types), or undefined. */
export const findPick = (list: Layout[], _train: Day[], pick: Pick): Layout | undefined =>
  list.find(c => c.idxs.join() === pick.idxs.join() && c.days.every(d => c.typeOf[d] === pick.typeOf[d]));
export const pickLayout = (train: Day[], pick: Pick): string => pick.idxs.map(i => train[i] + ':' + pick.typeOf[train[i] as Day]).join(' ');
export const layoutOf = (c: Layout): string => c.days.map(d => d + ':' + c.typeOf[d]).join(' ');

/** THE 14 (D125, D130): the rest-day calendars whose four-run floor is one tolerated CHI on the long run's eve. */
export const TOL14 = ['sun,mon,tue', 'sun,mon,thu', 'sun,mon,sat', 'sun,wed,thu', 'sun,wed,sat', 'sun,fri,sat', 'mon,tue,wed',
  'mon,tue,fri', 'mon,thu,fri', 'tue,wed,thu', 'tue,wed,sat', 'tue,fri,sat', 'wed,thu,fri', 'thu,fri,sat'];

// ── built weeks, read by content ──────────────────────────────────────────────────────────────────────────────────
export const SI = /^Short Interval \(SI\)/, LI = /^Long Interval \(LI\)/, LSD = /^Long Slow Distance \(LSD\)/;
/** An NSW run card's quality by its dose key: 'int', 'chi' or null. */
export function runQuality(c: AppCard): 'int' | 'chi' | null {
  const k = c && c.dose && c.dose.key;
  return k === 'int' ? 'int' : k === 'chi' ? 'chi' : null;
}
/** The printed name says what the key says: SI is int, LI is chi, and no other run card carries either name or key. */
export function cardNameAgrees(c: AppCard): boolean {
  const s = String(c.subtype || '');
  const byName = SI.test(s) ? 'int' : LI.test(s) ? 'chi' : null;
  return byName === runQuality(c);
}
/** One week's runs by content: {day: 'int' | 'chi' | 'lsd_long' | 'lsd_easy' | 'other'}. */
export function runLayout(week: Record<string, AppDay>): TypeOf {
  const lay: TypeOf = {};
  DAYS.forEach(d => cards(week[d]).forEach(c => {
    if (c.type !== 'run') return;
    const q = runQuality(c);
    if (q) lay[d] = q;
    else if (LSD.test(String(c.subtype || ''))) lay[d] = c.legLoad ? 'lsd_long' : 'lsd_easy';
    else lay[d] = 'other';
  }));
  return lay;
}
export const runDays = (lay: TypeOf): Day[] => DAYS.filter(d => lay[d]);
export const layoutString = (lay: TypeOf): string => runDays(lay).map(d => d + ':' + lay[d]).join(' ');
/** Every run card of a program, with where it sits. */
export function runCards(p: AppProgram): { w: number; d: Day; c: AppCard }[] {
  const out: { w: number; d: Day; c: AppCard }[] = [];
  weeksOf(p).forEach(w => DAYS.forEach(d => cards(p.weeks[w][d]).forEach(c => { if (c.type === 'run') out.push({ w, d, c }); })));
  return out;
}

// ── configs ───────────────────────────────────────────────────────────────────────────────────────────────────────
/** The pace family config the D125, D127, D129 and D130 rulings were measured on. */
export function paceCfg(rest: Day[], seed: number, goalId?: string): RunCfg {
  return { name: 'P', primaryPath: 'goal', cardioTypes: ['run'],
    cardioGoals: { run: { id: goalId || 'run_pace_goal', label: 'Pace', targetDist: '1.5', targetMins: '10', targetSecs: '0',
      mileBestMins: '8', mileBestSecs: '30', baselineDist: '3', baseline: '3mi' } },
    eventTargeted: false, liftingFocus: 'support_prevention', experience: 'intermediate', ageBracket: '18-35',
    equipment: 'crossfit', unit: 'lbs', restDays: rest.slice(), days: DAYS.slice(), bench: 135, squat: 155, deadlift: 185, seed };
}
export const BIKE_BASE = { id: 'bike_base', label: 'Base', baselineDist: '10', baseline: '10mi' };
export const SWIM_BASE = { id: 'swim_base', label: 'Base', baselineDist: '1000', baseline: '1000m' };
/** The same athlete with a second sport. */
export function paceMultiCfg(rest: Day[], seed: number, other: 'bike' | 'swim'): RunCfg {
  const c = paceCfg(rest, seed);
  c['cardioTypes'] = ['run', other];
  c['cardioGoals'][other] = clone(other === 'bike' ? BIKE_BASE : SWIM_BASE);
  return c;
}
/** Mario's calendar: rest Sunday and Wednesday, his seed. */
export const MARIO_REST: Day[] = ['sun', 'wed'], MARIO_SEED = 76308;

// ── the walking week (D132) ───────────────────────────────────────────────────────────────────────────────────────
export interface InjuryState {
  k: string;
  v: { region: string; tier: string } | null;
  walks: boolean;
}
/** The injury states the D132 lattice carries: a protected knee or low back walks every run; a shoulder swims out. */
export const WALK_INJ: InjuryState[] = [
  { k: 'healthy', v: null, walks: false },
  { k: 'shoulder/protect', v: { region: 'shoulder', tier: 'protect' }, walks: false },
  { k: 'lowback/protect', v: { region: 'lowback', tier: 'protect' }, walks: true },
  { k: 'knee/protect', v: { region: 'knee', tier: 'protect' }, walks: true },
];
export const WALK_SEEDS = [1013, 3039];
export function walkCfg(rest: Day[], seed: number, inj: { region: string; tier: string } | null, types?: string[], goalId?: string): RunCfg {
  const T = types || ['run'];
  const cg: Record<string, Record<string, string>> = {};
  T.forEach(t => {
    cg[t] = t === 'run'
      ? { id: goalId || 'run_pace_goal', label: 'Pace', targetDist: '1.5', targetMins: '11', targetSecs: '0', mileBestMins: '10', mileBestSecs: '30', baselineDist: '5', baseline: '5mi' }
      : { id: t === 'bike' ? 'bike_base' : 'swim_base', label: 'Base' };
  });
  const isRace = /half|marathon|5k|10k/.test(goalId || '');
  const c: RunCfg = { name: 'P', primaryPath: isRace ? 'event' : 'cardio', cardioTypes: T.slice(), cardioGoals: cg,
    eventTargeted: isRace, raceDate: isRace ? '2026-12-06' : null, liftingFocus: 'balanced', experience: 'advanced',
    ageBracket: '18-35', equipment: 'crossfit', unit: 'lbs', restDays: rest.slice(), days: DAYS.slice(),
    bench: 135, squat: 155, deadlift: 185, seed };
  if (inj) c['injury'] = { region: inj.region, tier: inj.tier };
  return c;
}
/** Bike and swim cards keep their old quality names (D103a renamed only the run cards). */
const BIKE_SWIM_INT = /Interval \(INT\)/, BIKE_SWIM_CHI = /Continuous High Intensity \(CHI\)/;
/** One week's cardio: how many sessions, and whether it carries an INT card and a CHI card. */
export function scanWeek(week: Record<string, AppDay>): { n: number; hasInt: boolean; hasChi: boolean } {
  let n = 0, hasInt = false, hasChi = false;
  DAYS.forEach(d => cards(week[d]).forEach(c => {
    n++;
    const s = String(c.subtype || '');
    const q = c.type === 'run' ? runQuality(c) : BIKE_SWIM_INT.test(s) ? 'int' : BIKE_SWIM_CHI.test(s) ? 'chi' : null;
    if (q === 'int') hasInt = true;
    if (q === 'chi') hasChi = true;
  }));
  return { n, hasInt, hasChi };
}
/** The goals D132 leaves alone: NRC and run_base are not in the pace family, and a multi-sport week was already held at three. */
export const WALK_OUT_OF_SCOPE = [
  { name: 'run_half', goal: 'run_half', types: ['run'] },
  { name: 'run_base', goal: 'run_base', types: ['run'] },
  { name: 'run+bike pace', goal: 'run_pace_goal', types: ['run', 'bike'] },
  { name: 'run+swim pace', goal: 'run_pace_goal', types: ['run', 'swim'] },
];

// ── D113a and D146: three-run pace weeks and multi-sport placement ────────────────────────────────────────────────
/** A card's class from its printed name (D103a for the NSW quality names; the NRC session names for NRC). */
export function cls(c: AppCard): string {
  const s = String(c.subtype || '');
  if (c.type !== 'run') return c.type;
  if (/TIME TRIAL|RACE DAY/i.test(s)) return 'race';
  if (/Short Interval \(SI\)/.test(s)) return 'int';
  if (/Long Interval \(LI\)/.test(s)) return 'chi';
  if (LSD.test(s)) return c.legLoad ? 'long' : 'easy';
  if (/^Speed Run/.test(s)) return 'hardq';
  if (/^Long Run/.test(s)) return 'nlong';
  if (/^(Easy Run|Recovery Run|Shakeout)/.test(s)) return 'easy';
  return c.legLoad ? 'hardx' : 'easyx';
}
/** One run of a week: its day, its class, its card. */
export interface WeekRun {
  day: Day;
  t: string;
  c?: AppCard;
}
const RHARD = new Set(['int', 'chi', 'long', 'hardq', 'nlong', 'race', 'hardx']);
export function runsOf(week: Record<string, AppDay>): WeekRun[] {
  const out: WeekRun[] = [];
  DAYS.forEach(d => cards(week && week[d]).forEach(c => { if (c.type === 'run') out.push({ day: d, t: cls(c), c }); }));
  return out;
}
/** Untolerated hard run pairs in one week (D130): a run CHI on the calendar eve of the run long run is the one tolerated pair. */
export function untolRuns(R: WeekRun[]): number {
  const hard = R.filter(x => RHARD.has(x.t)), L = R.find(x => x.t === 'long');
  let u = 0;
  for (let a = 0; a < hard.length; a++) for (let b = a + 1; b < hard.length; b++) {
    const x = hard[a] as WeekRun, y = hard[b] as WeekRun;
    if (circ(x.day, y.day) !== 1) continue;
    const tol = !!L && ((x.t === 'chi' && y === L && x.day === prevDay(L.day)) || (y.t === 'chi' && x === L && y.day === prevDay(L.day)));
    if (!tol) u++;
  }
  return u;
}
const THREE_PERMS = perms(['int', 'chi', 'long']);
export const THREE_DAY = combos(DAYS, 3);
/** The spacer calendars, enumerated here: three days on which no order of INT, CHI and long avoids an untolerated pair. */
export const SPACER = THREE_DAY.filter(c => Math.min(...THREE_PERMS.map(p => untolRuns(c.map((d, i) => ({ day: d, t: p[i] as string }))))) > 0).map(c => c.join('+'));
export const SPACER_TYPED = ['sun+mon+tue', 'sun+mon+sat', 'sun+fri+sat', 'mon+tue+wed', 'tue+wed+thu', 'wed+thu+fri', 'thu+fri+sat'];
/** The V115 crossover, typed: the first CHI week of a spacer block is max(3, ceil(weeks × 0.55)). */
export const handCross = (tw: number): number => Math.max(3, Math.ceil(tw * 0.55));
export const FOCI = ['support_prevention', 'balanced', 'strength'];
const RUNG: Record<string, Record<string, string>> = { run_pace_goal: { targetDist: '1.5', targetMins: '10', targetSecs: '0' } };
/** The rest-day calendars with zero to four rest days (99), in the order the D113a measure walked them. */
export const CALS99: Day[][] = [];
[0, 1, 2, 3, 4].forEach(n => combos(DAYS, n).forEach(r => CALS99.push(r)));
/** A second sport (or two) by goal id. */
export interface Extra {
  bike?: string;
  swim?: string;
}
export function mkCfg(g: string, ex: Extra, rest: Day[], focus: string, extra?: RunCfg): RunCfg {
  const cg: Record<string, Record<string, string>> = { run: Object.assign({ id: g, label: g, mileBestMins: '8', mileBestSecs: '30', baselineDist: '3', baseline: '3mi' }, RUNG[g] || {}) };
  const types = ['run'];
  if (ex.bike) { types.push('bike'); cg['bike'] = { id: ex.bike, label: ex.bike, baselineDist: '10', baseline: '10mi' }; }
  if (ex.swim) { types.push('swim'); cg['swim'] = { id: ex.swim, label: ex.swim, baselineDist: '1000', baseline: '1000m' }; }
  return Object.assign({ name: 'G213', primaryPath: 'goal', cardioTypes: types, cardioGoals: cg, eventTargeted: false, liftingFocus: focus,
    experience: 'intermediate', ageBracket: '18-35', equipment: 'crossfit', unit: 'lbs', restDays: rest.slice(), days: DAYS.slice(),
    bench: 135, squat: 155, deadlift: 185, seed: 1001 }, extra || {});
}
const BIKEG = ['bike_base', 'bike_ftp', 'bike_century'], SWIMG = ['swim_base', 'swim_500_time', 'swim_mile'];
const PACE_EXTRAS: Extra[] = [];
BIKEG.forEach(b => PACE_EXTRAS.push({ bike: b }));
SWIMG.forEach(s => PACE_EXTRAS.push({ swim: s }));
BIKEG.forEach(b => SWIMG.forEach(s => PACE_EXTRAS.push({ bike: b, swim: s })));
const NRC_EXTRAS: Extra[] = [{ bike: 'bike_base' }, { bike: 'bike_ftp' }, { swim: 'swim_base' }, { swim: 'swim_mile' }, { bike: 'bike_base', swim: 'swim_base' }];
/** One config of the D113a and D146 lattices. */
export interface LatticeCell {
  g: string;
  ex: Extra;
  rest: Day[];
  f: string;
  cfg: RunCfg;
}
/** The pace lattice of D113a: every calendar solo, and with each of 15 bike, swim and bike+swim goals (1,584 configs). */
export function paceLattice113(): LatticeCell[] {
  const out: Omit<LatticeCell, 'cfg'>[] = [];
  CALS99.forEach((rest, i) => out.push({ g: 'run_pace_goal', ex: {}, rest, f: FOCI[i % 3] as string }));
  PACE_EXTRAS.forEach((e, j) => CALS99.forEach((rest, i) => out.push({ g: 'run_pace_goal', ex: e, rest, f: FOCI[(i + j) % 3] as string })));
  return out.map(x => Object.assign(x, { cfg: mkCfg('run_pace_goal', x.ex, x.rest, x.f) }));
}
/** The NRC multi-sport lattice of D146: four plans, five second sports, every calendar (1,980 configs). */
export function nrcLattice146(): LatticeCell[] {
  const out: Omit<LatticeCell, 'cfg'>[] = [];
  NRC_PLANS.forEach((g, gi) => NRC_EXTRAS.forEach((e, j) => CALS99.forEach((rest, i) => out.push({ g, ex: e, rest, f: FOCI[(i + j + gi) % 3] as string }))));
  return out.map(x => Object.assign(x, { cfg: mkCfg(x.g, x.ex, x.rest, x.f) }));
}
/** The injury modes whose sweep rewrites every run; D113a and D146 leave their weeks unrouted. */
export const EXCLUDED_MODES = ['noimpact', 'noimpact_swim', 'easy', 'reduce'];
export const EXCL_INJ = [{ region: 'knee', tier: 'protect' }, { region: 'hip', tier: 'protect' }, { region: 'knee', tier: 'workaround' }, { region: 'ankle', tier: 'workaround' }];
/** The day by day sport layout of a program: which days carry a run, bike or swim card, by type and goal. */
export const sportLayout = (p: AppProgram): string => Object.keys(p.weeks).map(w => DAYS.map(d => cards(p.weeks[w][d]).map(c => c.type + ':' + (c.goalId || '')).sort().join('+') || '-').join(',')).join('|');
/**
 * sportLayout written short, one-to-one for a given config: a card of the config's own run, bike or swim goal is R, B
 * or S; a run rewritten to a bike or a swim (an injury sweep) is b or s; any other card is its type:goal in brackets.
 * A day is its cards, '-' for none; days are joined by '.', a run of identical weeks is written once with *count.
 */
export function layoutCode(p: AppProgram, cfg: RunCfg): string {
  const g = cfg['cardioGoals'];
  const code: Record<string, string> = { ['run:' + g.run.id]: 'R', ['bike:' + g.run.id]: 'b', ['swim:' + g.run.id]: 's' };
  if (g.bike) code['bike:' + g.bike.id] = 'B';
  if (g.swim) code['swim:' + g.swim.id] = 'S';
  const weeks = sportLayout(p).split('|').map(w => w.split(',').map(d => d === '-' ? '-' : d.split('+').map(t => code[t] || '[' + t + ']').join('')).join('.'));
  const out: { w: string; n: number }[] = [];
  weeks.forEach(w => { const last = out[out.length - 1]; if (last && last.w === w) last.n++; else out.push({ w, n: 1 }); });
  return out.map(x => x.w + (x.n > 1 ? '*' + x.n : '')).join(' ');
}
/** The run days of one week, in the order the chooser reads the training days. */
export const weekRunDays = (p: AppProgram, w: number, train: Day[]): Day[] => train.filter(d => cards(p.weeks[w][d]).some(c => c.type === 'run'));
/** The multi-sport populations whose layout under the excluded modes is pinned (calendars with at most two rest days). */
export const EXCL_POP: Record<'pace' | 'nrc', [string, Extra][]> = {
  pace: [['run_pace_goal', { bike: 'bike_base' }], ['run_pace_goal', { swim: 'swim_base' }], ['run_pace_goal', { bike: 'bike_ftp', swim: 'swim_mile' }]],
  nrc: [['run_5k', { bike: 'bike_base' }], ['run_half', { swim: 'swim_base' }]],
};
const cellKey = (g: string, e: Extra, rest: Day[]): string => [g, Object.values(e).join('+'), rest.join('') || 'none'].join('|');
/** One cell of the exclusion key's claim. */
export interface ExcludedCell {
  key: string;
  mode: string;
  cfg: RunCfg;
}
/**
 * One population of the exclusion key's claim (pace: three multi-sport pace pairs; nrc: run_5k with a bike, run_half
 * with a swim), on every calendar with at most two rest days. cells: every injury whose plan is an excluded mode,
 * [{key, mode, cfg}]; twins: the same configs uninjured, one per calendar, [{key, cfg}].
 */
export function excludedPopulation(row: 'pace' | 'nrc'): { cells: ExcludedCell[]; twins: { key: string; cfg: RunCfg }[] } {
  const plan = app().eval('injuryPlan');
  const C02 = CALS99.filter(r => r.length <= 2);
  const cells: ExcludedCell[] = [], twins: { key: string; cfg: RunCfg }[] = [];
  EXCL_POP[row].forEach(([g, e], j) => C02.forEach((rest, i) => {
    const foc = FOCI[(i + j) % 3] as string;
    twins.push({ key: cellKey(g, e, rest), cfg: mkCfg(g, e, rest, foc) });
    EXCL_INJ.forEach(inj => {
      const cfg = mkCfg(g, e, rest, foc, { injury: inj });
      const mode = (plan(clone(cfg)) || {}).cardioMode || 'none';
      if (EXCLUDED_MODES.includes(mode)) cells.push({ key: cellKey(g, e, rest) + '|' + inj.region + '/' + inj.tier, mode, cfg });
    });
  }));
  return { cells, twins };
}
/** The fewest runs a multi-sport week routes from: three on the pace family, two on NRC (D113a, D146). */
export const ROUTE_FROM = { pace: 3, nrc: 2 };
/** The training days the cardio engine hands the chooser: Monday first on an NRC plan (V188), Sunday first otherwise. */
export const cardioTrainDays = (cfg: RunCfg): Day[] => {
  const train = DAYS.filter(d => !cfg['restDays'].includes(d));
  return NRC_PLANS.includes(cfg['cardioGoals'].run.id) ? ISO.filter(d => train.includes(d)) : train;
};
