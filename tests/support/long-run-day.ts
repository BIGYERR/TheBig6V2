// Helpers for the long-run day tests: tests/integration/long-run-day.test.js runs each claim on a sample,
// tests/sweeps/long-run-day.test.js runs the lattices whole. Built on tests/support/run-week-layout.js (the app booted
// once with its clock pinned).
//
// What a long-run day is held to, typed here from the rulings and never asked of the app (_longRunTier, _pattern,
// _isPostChain and recoveryDeload are never called):
//   the long run   an NRC "Long Run" card (not race day, not a time trial), or an NSW run card keyed 'long' (D140);
//   time on feet   the card's own dose: its minutes, or miles times the target seconds per mile over 60;
//   the tier       75 minutes and up is A (post-run mobility only, titled Post-Run Mobility); 45 to 75 is B (upper
//                  and trunk, no hinge, leg or plyo item, no power or explosive section or core pillar, 8 working sets
//                  or fewer); under 45 is C. An NRC dress rehearsal is A. No tier carries a carry (D18, D140);
//   sets           counted the doctrine way: "3×10" is 3, "3 sets" is 3, anything else 1; stretches are free;
//   the hinge      the hand list (D153): deadlift, RDL, good morning, hinge, swing, pull-through, back extension,
//                  hyperextension, reverse hyper, glute-ham, hip thrust, glute bridge, nordic, hip extension;
//   D155           a tier B long-run day in a recovery week, on the loaded full-body day with no Strength or hip
//                  section left, keeps its Upper superset;
//   D156           the loaded full-body finisher (Arms finisher, Delts finisher) never prints on a long day.
import { DAY_KEYS } from '@ia/core';
import type { Cardio, CardioDose, CardioGoals, CardioType, Cfg, Day, DayKey, Equipment, Experience, Item, LiftingFocus, Program, Section } from '@ia/core';
import * as R from './run-week-layout.ts';
import { fixtures } from './app.ts';
const { ISO, clone, build } = R;
const DAYS: readonly DayKey[] = DAY_KEYS;

/** A long-run card's tier by time on feet. */
export type Tier = 'A' | 'B' | 'C';
/** The plan a long run comes from. */
export type Limb = 'NRC' | 'NSW';

const minutesOf = (d: CardioDose | null | undefined): number => !d ? 0 : d.k === 'time' ? (Number(d.mins) || 0) : (Number(d.mi) || 0) * (Number(d.tgt) || 0) / 60;
/** 'NRC' or 'NSW' when the card is a long run, else null. */
function longKind(c: Cardio | null | undefined): Limb | null {
  if (!c || !c.dose) return null;
  if (c.isNRC) {
    if (!/^long run/i.test(c.subtype || '') || /race day|time trial/i.test(c.subtype || '')) return null;
    return 'NRC';
  }
  return (c.type === 'run' && c.dose.key === 'long') ? 'NSW' : null;
}
/** The tier of a long-run card by time on feet, or null when the card is not a long run. */
function handTier(c: Cardio | null | undefined): Tier | null {
  const k = longKind(c);
  if (!k || !c) return null;
  if (k === 'NRC' && /rehearsal/i.test(c.detail || '')) return 'A';
  const m = minutesOf(c.dose);
  if (!m) return null;
  return m >= 75 ? 'A' : m >= 45 ? 'B' : 'C';
}
const LEG_RX = /swing|clean|snatch|deadlift|romanian|\brdl\b|good morning|hip thrust|hip extension|glute bridge|squat|lunge|step-?up|\bleg\b|calf|calves|glute|nordic|broad jump|box jump|jump|bound|skater|wall ball|sled|pistol/i;
const STRETCH_RX = /stretch|mobility|90\/90|foam|worlds greatest/i;
const CARRY_RX = /carry|farmer|suitcase/i;
const POWER_CORE_RX = /power|explosive/i;
const HINGE = /deadlift|\brdl\b|romanian|good morning|hinge|swing|pull-?through|back extension|hyperextension|reverse hyper|glute-ham|\bghr\b|hip thrust|glute bridge|nordic|hip extension/i;
const docSets = (det: unknown): number => { const s = String(det || ''); let m = /^(\d+)\s*[x×]/.exec(s); if (m) return +m[1]; m = /\b(\d+)\s*sets?\b/i.exec(s); return m ? +m[1] : 1; };
const items = (day: Day): Item[] => (day.sections || []).reduce<Item[]>((a, s) => a.concat(s.items || []), []);
const daySets = (day: Day): number => items(day).filter(i => !STRETCH_RX.test(i.name || '')).reduce((a, i) => a + docSets(i.detail), 0);
const carryN = (day: Day): number => items(day).filter(i => CARRY_RX.test(i.name || '')).length;
const secName = (s: Section): string => (s.label || s.coreHeader || '');
const shape = (day: Day): string => (day.sections || []).map(s => '[' + secName(s) + '] ' + (s.items || []).map(i => i.name).join(', ')).join(' ; ') || '(none)';
/** The sections with items, and their class: taper, core, mobility, hip or lift. */
const live = (d: Day | null | undefined): Section[] => ((d && d.sections) || []).filter(s => s && (s.items || []).length);
const sectionClass = (s: Section): string => /taper/i.test(s.label || '') ? 'taper' : (s.coreHeader || s.core || /^trunk|core/i.test(s.label || '')) ? 'core'
  : /mobility|stretch/i.test(s.label || '') ? 'mobility' : s.hip ? 'hip' : 'lift';
const FINISHER = /^(Arms|Delts) finisher$/;
const hasFinisher = (y: Day | null | undefined): boolean => ((y && y.sections) || []).some(s => FINISHER.test(String(s.label || '')));
/** The two days before a RACE DAY or TIME TRIAL card, Monday to Sunday flattened: no lifting there by doctrine (D38). */
function d38Window(p: Program): Set<string> {
  const f: string[] = [];
  for (let w = 1; w <= p.totalWeeks; w++) ISO.forEach(d => f.push(w + '|' + d));
  const ri = f.findIndex(k => { const [w, d] = k.split('|'); const y = p.weeks[w] && p.weeks[w][d as DayKey]; return !!(y && y.cardio && /RACE DAY|TIME TRIAL/i.test(y.cardio.subtype || '')); });
  const out = new Set<string>();
  if (ri >= 0) for (let j = 1; j <= 2; j++) if (f[ri - j]) out.add(f[ri - j]);
  return out;
}

// ── the stand-in and its carry case (D140) ────────────────────────────────────────────────────────────────────────
/** The pace athlete D140's after-grid was printed for: rest Sunday and Wednesday, an 8:15 mile, 1.5 miles in 11:00. */
const STAND: Cfg = { name: 'PRT TING', primaryPath: 'goal', eventTargeted: false, cardioTypes: ['run'],
  cardioGoals: { run: { id: 'run_pace_goal', label: 'Hit a Pace / Time Goal', mileBestMins: '8', mileBestSecs: '15', mileBestSrc: { kind: 'entered' }, targetDist: '1.5', targetMins: '11', targetSecs: '0', paceUnit: 'mi' } },
  liftingFocus: 'balanced', experience: 'intermediate', ageBracket: '18-35', equipment: 'home_full', unit: 'lbs',
  restDays: ['sun', 'wed'], days: DAYS.slice(), bench: 185, squat: 255, deadlift: 315, startDate: '2026-09-21', seed: 24865 };

// ── the lattices ──────────────────────────────────────────────────────────────────────────────────────────────────
/** D140's lattice: 384 NSW programs (eight goal variants) and 288 NRC programs (four plans), on two rest patterns. */
/** A D140 lattice cell: NSW or NRC, its tag and its config. */
export interface TierRow { limb: Limb; tag: string; cfg: Cfg }
function tierLattice(): TierRow[] {
  const out: TierRow[] = [], RESTS: DayKey[][] = [['sun', 'wed'], ['sat', 'sun']];
  ([['run_pace_goal', '8', '15', ['run']], ['run_mile_time', '8', '15', ['run']], ['run_15_under10', '8', '15', ['run']],
    ['run_base', '8', '15', ['run']], ['run_pace_goal', '12', '0', ['run']], ['run_base', '12', '0', ['run']],
    ['run_pace_goal', '8', '15', ['run', 'bike']], ['run_pace_goal', '8', '15', ['run', 'swim']]] satisfies [string, string, string, CardioType[]][]).forEach(([g, mm, ss, T]: [string, string, string, CardioType[]]) =>
    [24865, 1001].forEach(seed => ['home_full', 'crossfit', 'bodyweight'].forEach(eq => ['balanced', 'hypertrophy'].forEach(f =>
      ['beginner', 'intermediate'].forEach(e => RESTS.forEach(r => {
        const c = clone(STAND);
        Object.assign(c.cardioGoals.run!, { id: g, mileBestMins: mm, mileBestSecs: ss });
        c.cardioTypes = T.slice();
        if (T.includes('bike')) c.cardioGoals.bike = { id: 'bike_base', label: 'Base', baselineDist: '10', baseline: '10mi' };
        if (T.includes('swim')) c.cardioGoals.swim = { id: 'swim_base', label: 'Base', baselineDist: '1000', baseline: '1000m' };
        Object.assign(c, { seed, equipment: eq, liftingFocus: f, experience: e, restDays: r.slice() });
        out.push({ limb: 'NSW', tag: [g, mm + ':' + ss, T.join('+'), eq, f, e, r.join('+'), seed].join('/'), cfg: c });
      }))))));
  ['run_5k', 'run_10k', 'run_half', 'run_marathon'].forEach(plan => ['crossfit', 'home_full', 'bodyweight'].forEach(eq =>
    ['balanced', 'support_prevention', 'hypertrophy'].forEach(f => ['beginner', 'advanced'].forEach(e => [false, true].forEach(dated =>
      RESTS.forEach(r => out.push({ limb: 'NRC', tag: [plan, eq, f, e, dated ? 'dated' : 'undated', r.join('+')].join('/'),
        cfg: Object.assign(clone(fixtures.HALF_MANNY), { name: 'D140', primaryPath: dated ? 'event' : 'fitness', cardioTypes: ['run'],
          cardioGoals: { run: { id: plan, label: plan, mileBestMins: '10', mileBestSecs: '30', baselineDist: '5', baseline: '5mi' } },
          eventTargeted: dated, raceDate: dated ? '2026-12-06' : '', startDate: '2026-09-21', liftingFocus: f, experience: e, equipment: eq,
          seed: 76308, restDays: r.slice() }) })))))));
  return out;
}
/** Every long-run day of a program, by tier, checked against the tier rules. */
/** Long-run days by tier and limb, and the tier C days that carry a power or explosive core pillar. */
export interface TierCount { A: Record<Limb, number>; B: Record<Limb, number>; C: Record<Limb, number>; cPowerCore: number }
/**
 * Each tier rule's failures: A1 a section other than post-run mobility on tier A, A2 a tier A title, B1 a leg item on
 * tier B, B2 a power, explosive or carry section, B3 over 8 sets, B5 a power core pillar, K0 a carry on any tier.
 */
export type TierBad = Record<'A1' | 'A2' | 'B1' | 'B2' | 'B3' | 'B5' | 'K0', string[]>;
function readTiers(p: Program, tag: string, limbCount: TierCount, bad: TierBad): void {
  for (let w = 1; w <= p.totalWeeks; w++) for (const d of DAYS) {
    const day = p.weeks[w] && p.weeks[w][d];
    if (!day) continue;
    const t = handTier(day.cardio), where = tag + ' W' + w + ' ' + d;
    if (!t) continue;
    limbCount[t][longKind(day.cardio)!]++;
    if (carryN(day)) bad.K0.push(where + ' ' + shape(day));
    if (t === 'A') {
      if ((day.sections || []).some(s => !/post-run mobility|taper/i.test(s.label || ''))) bad.A1.push(where + ' ' + shape(day));
      if (day.title !== 'Post-Run Mobility') bad.A2.push(where + ' "' + day.title + '"');
    } else if (t === 'B') {
      const legs = items(day).filter(i => LEG_RX.test(i.name || '')).map(i => i.name);
      if (legs.length) bad.B1.push(where + ' ' + legs.join(', '));
      const secs = (day.sections || []).filter(s => /power|explosive|carry/i.test(s.label || '') || /carry/i.test(s.coreHeader || '')).map(secName);
      if (secs.length) bad.B2.push(where + ' [' + secs.join('] [') + ']');
      if (daySets(day) > 8) bad.B3.push(where + ' ' + daySets(day) + ' sets');
      const pc = (day.sections || []).filter(s => POWER_CORE_RX.test(s.coreHeader || '')).map(s => s.coreHeader);
      if (pc.length) bad.B5.push(where + ' [' + pc.join('] [') + ']');
    } else if ((day.sections || []).some(s => POWER_CORE_RX.test(s.coreHeader || ''))) limbCount.cPowerCore++;
  }
}
/** D140's lattice (or every k-th program) read whole: long-run days by tier and limb, and every rule's failures. */
function tierTally(k?: number): { progs: number; n: TierCount; bad: TierBad } {
  const n: TierCount = { A: { NSW: 0, NRC: 0 }, B: { NSW: 0, NRC: 0 }, C: { NSW: 0, NRC: 0 }, cPowerCore: 0 };
  const bad: TierBad = { A1: [], A2: [], B1: [], B2: [], B3: [], B5: [], K0: [] };
  let progs = 0;
  R.every(tierLattice(), k || 1).forEach(L => { progs++; readTiers(build(L.cfg), L.tag, n, bad); });
  return { progs, n, bad };
}

const PLANS = R.NRC_PLANS;
const EXP: Experience[] = ['beginner', 'intermediate', 'advanced'], AGE = ['18-35', '36-54', '55+'];
const RESTS5: DayKey[][] = [['sun', 'wed'], ['sat', 'sun'], ['sun'], ['mon', 'wed', 'fri'], ['tue', 'thu', 'sun']];
const EQ: Equipment[] = ['crossfit', 'commercial', 'home_full', 'home_basic', 'bodyweight'];
const FOC: LiftingFocus[] = ['balanced', 'hypertrophy', 'strength', 'support_athletic', 'support_prevention', 'support_strength'];
const RACED = ['2026-12-06', '2027-01-17', '2027-03-28'];
const MILE = [['7', '30'], ['8', '15'], ['10', '30'], ['12', '0']];
/** The bike and swim goals a multi-sport cell adds. */
interface Extra { bike?: string; swim?: string }
const EXTRAS: Extra[] = [{ bike: 'bike_base' }, { swim: 'swim_base' }, { bike: 'bike_ftp' }, { swim: 'swim_mile' }, { bike: 'bike_base', swim: 'swim_base' }];
const NSWG = ['run_pace_goal', 'run_mile_time', 'run_15_under10', 'run_base'], MM: [string, string][] = [['8', '15'], ['12', '0']];
/** One NRC cell's choices: experience, rest days, equipment, focus, dated or not, and any bike or swim goal. */
interface NrcOpts { e: Experience; r: DayKey[]; q: Equipment; f: LiftingFocus; dated: boolean; ex?: Extra }
function nrcCfg(plan: string, o: NrcOpts, i: number): Cfg {
  const goals: CardioGoals = { run: { id: plan, label: plan, mileBestMins: MILE[i % 4][0], mileBestSecs: MILE[i % 4][1], baselineDist: String([3, 5, 8][i % 3]), baseline: [3, 5, 8][i % 3] + 'mi' } };
  const types: CardioType[] = ['run'];
  if (o.ex && o.ex.bike) { types.push('bike'); goals.bike = { id: o.ex.bike, label: o.ex.bike, baselineDist: '10', baseline: '10mi' }; }
  if (o.ex && o.ex.swim) { types.push('swim'); goals.swim = { id: o.ex.swim, label: o.ex.swim, baselineDist: '1000', baseline: '1000m' }; }
  return Object.assign(clone(fixtures.HALF_MANNY), { name: 'G211', primaryPath: o.dated ? 'event' : 'fitness', cardioTypes: types, cardioGoals: goals,
    eventTargeted: !!o.dated, raceDate: o.dated ? RACED[i % 3] : '', startDate: '2026-09-21', liftingFocus: o.f, experience: o.e, ageBracket: AGE[i % 3],
    equipment: o.q, restDays: o.r.slice(), seed: 76308 });
}
const nswCfg = (g: string, mm: [string, string], f: LiftingFocus, q: Equipment, r: DayKey[], e: Experience, seed?: number): Cfg => {
  const c = clone(STAND);
  Object.assign(c.cardioGoals.run!, { id: g, mileBestMins: mm[0], mileBestSecs: mm[1] });
  return Object.assign(c, { name: 'G211', liftingFocus: f, equipment: q, restDays: r.slice(), experience: e, seed: seed || 24865 });
};
/**
 * The lattices of D153 and D155 (and of D156, which reads the same NSW lattice): NRC 4,200 (every plan, experience,
 * rest pattern, equipment tier, focus, dated or not, and 600 multi-sport), NSW 3,600 (four NSW goals, two mile times,
 * every focus, tier, rest pattern and experience), and D153's 240 (where Cable pull-through once printed on a tier B
 * day: commercial, advanced, strength or hypertrophy).
 */
/** A lattice cell: its segment and its config. */
export interface Seg { seg: string; c: Cfg }
function hingeLattices(): { NRC: Seg[]; NSW: Seg[]; D153: Seg[] } {
  const NRC: Seg[] = [];
  let ii = 0;
  for (const plan of PLANS) for (const e of EXP) for (const r of RESTS5) for (const q of EQ) for (const f of FOC) for (const dated of [true, false])
    NRC.push({ seg: plan, c: nrcCfg(plan, { e, r, q, f, dated }, ii++) });
  for (const plan of PLANS) for (const ex of EXTRAS) for (const f of FOC) for (const q of EQ)
    NRC.push({ seg: plan + ' multi', c: nrcCfg(plan, { ex, e: EXP[ii % 3], r: RESTS5[ii % 2], q, f, dated: ii % 2 === 0 }, ii++) });
  const NSW: Seg[] = [];
  for (const g of NSWG) for (const mm of MM) for (const f of FOC) for (const q of EQ) for (const r of RESTS5) for (const e of EXP)
    NSW.push({ seg: g + '/' + mm.join(':'), c: nswCfg(g, mm, f, q, r, e) });
  const D153: Seg[] = [];
  for (const seed of [99991, 1234]) for (const plan of PLANS) for (const f of ['hypertrophy', 'strength'] as const) for (const r of RESTS5) for (const dated of [true, false]) {
    const c = nrcCfg(plan, { e: 'advanced', r, q: 'commercial', f, dated }, D153.length);
    c.seed = seed;
    D153.push({ seg: plan + ' s' + seed, c });
  }
  for (const g of NSWG) for (const mm of MM) for (const f of ['hypertrophy', 'strength'] as const) for (const r of RESTS5)
    D153.push({ seg: g + '/' + mm.join(':') + ' s1001', c: nswCfg(g, mm, f, 'commercial', r, 'advanced', 1001) });
  return { NRC, NSW, D153 };
}
/** D156's two further NSW lattices: the loaded full-body slice on two more seeds (960), and with bike and swim goals (240). */
function finisherLattices(): { seeds: Seg[]; multi: Seg[] } {
  const seeds: Seg[] = [];
  for (const sd of [76308, 1234]) for (const g of NSWG) for (const mm of MM) for (const f of ['strength', 'hypertrophy'] as const) for (const q of ['commercial', 'home_full'] as const) for (const r of RESTS5) for (const e of EXP)
    seeds.push({ seg: [sd, g, mm.join(':'), f, q, r.join(','), e].join('|'), c: nswCfg(g, mm, f, q, r, e, sd) });
  const multi: Seg[] = [];
  let ii = 0;
  for (const g of NSWG) for (const ex of EXTRAS) for (const f of ['strength', 'hypertrophy'] as const) for (const q of ['commercial', 'home_full'] as const) for (const e of EXP) {
    const c = clone(STAND);
    c.cardioGoals.run!.id = g;
    Object.assign(c, { liftingFocus: f, equipment: q, experience: e, restDays: RESTS5[ii++ % 5].slice() });
    if (ex.bike) { c.cardioTypes.push('bike'); c.cardioGoals.bike = { id: ex.bike, label: ex.bike, baselineDist: '10', baseline: '10mi' }; }
    if (ex.swim) { c.cardioTypes.push('swim'); c.cardioGoals.swim = { id: ex.swim, label: ex.swim, baselineDist: '1000', baseline: '1000m' }; }
    multi.push({ seg: [g, Object.keys(ex).join('+'), f, q, e].join('|'), c });
  }
  return { seeds, multi };
}
/**
 * One lattice of programs read for D153, D155 and D156: tier B long-run days (and those in the D38 window), tier B days
 * with no lift section, hinge items on tier B days and off them, the most sets on a tier B day, the recovery-week loaded
 * Full Body days and those without an Upper superset, long days with a finisher.
 */
/**
 * hingeTally's counts: configs, tier B days, those in the D38 window, tier B days with no lift section, hinge items on
 * tier B days by name and off them, tier B days over 8 sets and the most, recovery-week loaded Full Body days, those with
 * no Strength or hip section and those of them with no Upper superset, long days with a finisher.
 */
export interface HingeTally { cfg: number; tb: number; d38: number; zero: string[]; hinge: Record<string, number>; hingeElse: number; over8: string[]; maxSets: number; recFullBody: number; g6n: number; g6bad: string[]; finisher: string[] }
function hingeTally(list: Seg[]): HingeTally {
  const T: HingeTally = { cfg: 0, tb: 0, d38: 0, zero: [], hinge: {}, hingeElse: 0, over8: [], maxSets: 0, recFullBody: 0, g6n: 0, g6bad: [], finisher: [] };
  list.forEach(x => {
    T.cfg++;
    const p: Program = build(x.c);
    const eve = d38Window(p), rw = new Set(p.liftRecoveryWeeks || []);
    for (let w = 1; w <= p.totalWeeks; w++) for (const d of DAYS) {
      const y = p.weeks[w] && p.weeks[w][d];
      if (!y) continue;
      const c = y.cardio && !Array.isArray(y.cardio) ? y.cardio : null;
      if (!y.rest && c && !c.isNRC && c.dose && c.dose.key === 'long' && hasFinisher(y)) T.finisher.push(x.seg + ' W' + w + ' ' + d);
      const t = y.rest ? null : handTier(y.cardio);
      if (t !== 'B') { live(y).forEach(s => s.items.forEach(it => { if (HINGE.test(it.name || '')) T.hingeElse++; })); continue; }
      T.tb++;
      if (!live(y).some(s => sectionClass(s) === 'lift')) { if (eve.has(w + '|' + d)) T.d38++; else T.zero.push(x.seg + ' ' + x.c.equipment + '/' + x.c.liftingFocus + ' W' + w + ' ' + d + ' "' + y.title + '"'); }
      live(y).forEach(s => s.items.forEach(it => { if (HINGE.test(it.name || '')) T.hinge[it.name] = (T.hinge[it.name] || 0) + 1; }));
      const n = daySets(y);
      if (n > 8) T.over8.push(x.seg + ' W' + w + ' ' + d + ' ' + n + ' sets');
      T.maxSets = Math.max(T.maxSets, n);
      if (rw.has(w) && /^Full Body/.test(y.title || '') && /^(commercial|home_full)$/.test(x.c.equipment) && /^(strength|hypertrophy)$/.test(x.c.liftingFocus)) {
        T.recFullBody++;
        if (!live(y).some(s => /^strength$/i.test(s.label || '') || /hip/i.test(s.label || '') || s.hip)) {
          T.g6n++;
          if (!live(y).some(s => /^upper superset$/i.test(s.label || ''))) T.g6bad.push(x.seg + ' W' + w + ' ' + d + ' [' + live(y).map(s => s.label || '(core)').join(' + ') + ']');
        }
      }
    }
  });
  return T;
}

export {
  minutesOf, longKind, handTier, LEG_RX, STRETCH_RX, CARRY_RX, POWER_CORE_RX, HINGE, docSets, items, daySets, carryN,
  shape, live, sectionClass, FINISHER, hasFinisher, d38Window, STAND, tierLattice, readTiers, tierTally,
  hingeLattices, finisherLattices, hingeTally,
};