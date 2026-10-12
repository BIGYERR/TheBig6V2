// Helpers for the leg lift placement tests: tests/integration/leg-lift-placement.test.js runs each claim on one seed
// and a sample, tests/sweeps/leg-lift-placement.test.js runs the lattices whole. Built on tests/support/run-week-layout.js
// (the app booted with its clock pinned, the week, the pace config, the card readers).
//
// What the placement is held to, typed here from the rulings and never asked of the app:
//   the long run and its eve are forbidden to both leg roles (pull, the hinge day; legs, the squat day): "hard days
//   hard" (D36 for NRC race programs, D127 for the pace family, D104a for run_base);
//   the D36 cost table (handCost) prices every other day, and the placement must be cost-minimal under it;
//   the run week's shape is read from the built cards by their printed names (handShape);
//   the notes the placement prints are typed as the rulings wrote them;
//   T-1 and T-2 of a dated test are found by date arithmetic.
import type { Cardio, CardioGoal, CardioGoals, Cfg, Day, DayKey, Program, Week } from '@ia/core';
import * as R from './run-week-layout.ts';
const { DAYS, ISO, clone, build, weeksOf, cards, SI, LI, LSD } = R;
import { fixtures } from './app.ts';
// ── the lift placement around the run week (D36, D127, D104a) ─────────────────────────────────────────────────────
/** The day titles, by role, in both label sets. */
/** A lift day's role: the hinge day (pull), the squat day (legs), or an upper or light day. */
export type Role = 'pull' | 'legs' | 'push' | 'push_light' | 'full' | 'active';
const ROLE_OF: Record<string, Role> = {
  'Posterior Chain': 'pull', 'Pull': 'pull', 'Leg Strength + Mobility': 'legs', 'Legs': 'legs',
  'Strength Support': 'push', 'Push': 'push', 'Recovery Lift': 'push_light', 'Push (light)': 'push_light',
  'Full Body Support': 'full', 'Full Body': 'full', 'Active Recovery': 'active',
};
const isoPrev = (d: DayKey): DayKey => ISO[(ISO.indexOf(d) + 6) % 7];
const isoNext = (d: DayKey): DayKey => ISO[(ISO.indexOf(d) + 1) % 7];
/**
 * The D36 cost table, typed from the ruling: the long run and its eve are forbidden to both leg roles; otherwise
 *   pull: speed same day 0.5, easy run same day 1, day after speed 1, day before speed 2, day after the long run 2;
 *   legs: speed same day 1.5, easy run same day 1, day after speed 1, day before speed 2, day after the long run 2.
 * The terms add.
 */
function handCost(shape: Shape, role: 'pull' | 'legs', d: DayKey): number {
  if (shape.forbidden.has(d)) return Infinity;
  let c = 0;
  if (shape.speed.has(d)) c += role === 'pull' ? 0.5 : 1.5;
  if (shape.easy.has(d)) c += 1;
  if (shape.speed.has(isoPrev(d))) c += 1;
  if (shape.speed.has(isoNext(d))) c += 2;
  if (d === shape.after) c += 2;
  return c;
}
/** The run week's shape, read from the built cardio by its printed names: speed days, easy days, the long run, its eve. */
/** A run week's shape: the long run, its eve, the day after it, the speed and easy days, and the two forbidden days. */
export interface Shape { long: DayKey; eve: DayKey; after: DayKey; speed: Set<DayKey>; easy: Set<DayKey>; forbidden: Set<DayKey> }
function handShape(week: Week): Shape | null {
  let long = null as DayKey | null; // set inside the callback below
  const speed = new Set<DayKey>(), easy = new Set<DayKey>();
  DAYS.forEach(d => cards(week[d]).forEach(c => {
    if (c.type !== 'run') return;
    const st = String(c.subtype || '');
    if (SI.test(st) || LI.test(st)) speed.add(d);
    else if (LSD.test(st)) { if (c.legLoad) long = d; else easy.add(d); }
  }));
  if (!long) return null;
  const eve = isoPrev(long);
  return { long, eve, after: isoNext(long), speed, easy, forbidden: new Set([long, eve]) };
}
/** The notes the placement prints, typed from the rulings (D36 and D127 for the pace family, D104a for run_base). */
const D36_NOTE = 'Your hinge day rides a speed session so hard days stay hard. Nothing heavy lands the day before your long run.';
const BASE_NOTE = 'Nothing heavy lands on your long run or the day before it. Your lifting days were placed around it.';
const STEADY_DEAD = 'Your hinge day rides your steady run so hard days stay hard.';
/** The openings of the three 48 hour tier notes (V153). */
const TIER48 = ['Your training days are tightly packed', 'Your heavy lifting was kept off the same day as your hardest runs', 'Your heavy lifting was spaced out from your hardest runs'];
const onTier48 = (n: string | null | undefined): boolean => n == null || TIER48.some(t => n.startsWith(t));
const isBaseNote = (n: string | null | undefined): boolean => n === BASE_NOTE || (typeof n === 'string' && n.startsWith(BASE_NOTE + ' '));

// ── run_base (D104a) ──────────────────────────────────────────────────────────────────────────────────────────────
/** A lower body Main, by the lift's name. */
const LOWER_MAIN = /squat|deadlift|\brdl\b|romanian|good morning|hip thrust|lunge|step-?up|\bclean\b|snatch|trap bar/i;
const stripSvg = (n: unknown): string => String(n || '').replace(/<svg[\s\S]*?<\/svg>\s*/g, '');
const mainLift = (day: Day): string | null => { const s = (day.sections || []).find(x => /^Main\s*—/.test(x.label || '')); return s ? stripSvg((s.items || [])[0] && s.items[0].name) : null; };
const lowerDay = (day: Day | null | undefined): boolean => !!day && !day.rest && LOWER_MAIN.test(mainLift(day) || '');
/** The long run by its label: "Easy Run — Long", or a Long Slow Distance card that loads the legs. */
const labelLong = (c: Cardio): boolean => c.type === 'run' && (/^Easy Run — Long/.test(c.subtype || '') || (LSD.test(c.subtype || '') && !!c.legLoad));
const keyLong = (c: Cardio): boolean => c.type === 'run' && !!c.dose && c.dose.key === 'long';
/** The eve of a day by the calendar: Monday's eve is the previous week's Sunday. */
const eveOf = (w: number, d: DayKey): [number, DayKey] => d === 'mon' ? [w - 1, 'sun'] : [w, ISO[ISO.indexOf(d) - 1]];
const BASE_REST: DayKey[][] = [[], ['sun'], ['sat'], ['sun', 'wed'], ['sat', 'sun'], ['mon', 'fri'], ['sun', 'wed', 'sat'], ['tue', 'thu', 'sat'], ['sun', 'tue', 'thu', 'sat'], ['mon', 'wed', 'fri', 'sun']];
/** The run_base lattice D104a was measured on: an 18 to 35 event lattice and the 55+ low baseline HALF_MANNY shape. */
/** A lattice cell: its family and its config. */
export interface FamCfg { fam: string; cfg: Cfg }
function runBaseLattice(): FamCfg[] {
  const out: FamCfg[] = [];
  for (const mix of ['', 'bike'] as const) for (const exp of ['beginner', 'intermediate', 'advanced'] as const) for (const rest of BASE_REST) for (const seed of [24865, 7, 4242]) for (const wo of [4, 8, 12]) for (const focus of ['balanced', 'support_strength'] as const) {
    const race = new Date(2026, 8, 21 + wo * 7);
    const iso = race.getFullYear() + '-' + String(race.getMonth() + 1).padStart(2, '0') + '-' + String(race.getDate()).padStart(2, '0');
    const cg: CardioGoals = { run: { id: 'run_base', mileBestMins: '8', mileBestSecs: '15', baseline: '2.5 miles' } };
    if (mix) cg.bike = { id: 'bike_base' };
    out.push({ fam: '18-35 run_base' + (mix ? '+' + mix : ''), cfg: { primaryPath: 'event', eventTargeted: true, raceDate: iso, cardioTypes: mix ? ['run', mix] : ['run'], cardioGoals: cg,
      liftingFocus: focus, experience: exp, ageBracket: '18-35', equipment: 'home_full', unit: 'lbs', restDays: rest.slice(), days: DAYS.slice(), bench: 185, squat: 255, deadlift: 315, name: 'M', startDate: '2026-09-21', seed } });
  }
  for (const mix of ['', 'bike', 'swim'] as const) for (const exp of ['intermediate', 'advanced'] as const) for (const bd of ['0.1', '1']) for (const rest of BASE_REST) for (const seed of [76308, 7]) for (const pp of ['fitness', 'event']) {
    const cg: CardioGoals = { run: { id: 'run_base', label: 'Build Running Base', baselineDist: bd, baseline: bd + 'mi' } };
    if (mix === 'bike') cg.bike = { id: 'bike_base', label: 'Bike' };
    if (mix === 'swim') cg.swim = { id: 'swim_base', label: 'Swim' };
    out.push({ fam: '55+ run_base' + (mix ? '+' + mix : ''), cfg: Object.assign(clone(fixtures.HALF_MANNY), { name: 'RB', primaryPath: pp, cardioTypes: mix ? ['run', mix] : ['run'], cardioGoals: cg,
      eventTargeted: pp === 'event', raceDate: pp === 'event' ? '2027-06-01' : '', experience: exp, ageBracket: '55+', restDays: rest.slice(), seed }) });
  }
  return out;
}
/**
 * One run_base program read by hand: its class (first long run in week 1, in a later week, none; whether the placement
 * week carries a legLoad card), the cards whose label and key disagree, the lower body Mains on a long run or its eve,
 * and the note.
 */
/** One run_base program read by hand (readRunBase). */
export interface RunBaseRead { hasLong: boolean; classes: string[]; disagree: string[]; hits: string[]; cards: number; note: string | null }
function readRunBase(L: FamCfg): RunBaseRead {
  const p: Program = build(L.cfg);
  const train = DAYS.filter(d => !L.cfg.restDays.includes(d));
  const wks = weeksOf(p);
  const longDays: Record<number, DayKey[]> = {}, disagree: string[] = [], hits: string[] = [], classes: string[] = [];
  let firstLong = null as number | null, cardsN = 0; // firstLong is set inside the callback below
  for (const w of wks) ISO.forEach(d => cards(p.weeks[w][d]).forEach(c => {
    if (c.type !== 'run') return;
    cardsN++;
    if (labelLong(c) !== keyLong(c)) disagree.push(L.fam + ' W' + w + ' ' + d + ' "' + c.subtype + '"');
    if (labelLong(c)) { (longDays[w] = longDays[w] || []).push(d); if (firstLong === null && train.includes(d)) firstLong = w; }
  }));
  if (firstLong === null) classes.push('no long run anywhere');
  else {
    classes.push(firstLong === 1 ? 'first long run in week 1' : 'first long run in a later week');
    if (!ISO.some(d => cards(p.weeks[firstLong!]![d]).some(c => !!c.legLoad))) classes.push('placement week has no legLoad card');
  }
  for (const w of wks) for (const d of (longDays[w] || [])) {
    const [ew, ed] = eveOf(w, d);
    for (const [hw, hd, where] of [[w, d, 'on'], [ew, ed, 'eve']] satisfies [number, DayKey, string][]) {
      const day = p.weeks[hw] && p.weeks[hw][hd];
      if (lowerDay(day)) hits.push(L.fam + ' W' + hw + ' ' + hd + ' ' + where + ' the long run: ' + mainLift(day));
    }
  }
  return { hasLong: firstLong !== null, classes, disagree, hits, cards: cardsN, note: p.legRecoveryNote };
}
const START_OCT5 = new Date(2026, 9, 5);   // a Monday
const isoOff = (n: number): string => { const d = new Date(START_OCT5); d.setDate(d.getDate() + n); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
const PACE_TEST: CardioGoal = { id: 'run_pace_goal', label: 'Hit a Pace / Time Goal', mileBestMins: '8', mileBestSecs: '15', mileBestSrc: { kind: 'entered' }, targetDist: '1.5', targetMins: '11', targetSecs: '0', paceUnit: 'mi' };
const MILE_TEST: CardioGoal = { id: 'run_mile_time', mileBestMins: '8', mileBestSecs: '15', targetDist: '1', targetMins: '7', targetSecs: '30', paceUnit: 'mi' };
/** A dated pace or mile test, `tw` weeks long, its test day `wd` days into the last week (from Monday 2026-10-05). */
function datedTestCfg(goal: CardioGoal, mix: '' | 'bike' | 'swim', rest: DayKey[], tw: number, wd: number): Cfg {
  const cg: CardioGoals = { run: clone(goal) };
  if (mix === 'bike') cg.bike = { id: 'bike_base' };
  if (mix === 'swim') cg.swim = { id: 'swim_base' };
  return { name: 'GK', primaryPath: 'event', eventTargeted: true, raceDate: isoOff(7 * (tw - 1) + wd), _testWeek: tw, _raceDateCappedWeeks: tw,
    cardioTypes: mix ? ['run', mix] : ['run'], cardioGoals: cg, liftingFocus: 'balanced', experience: 'intermediate', ageBracket: '18-35',
    equipment: 'home_full', unit: 'lbs', restDays: rest.slice(), days: DAYS.slice(), bench: 185, squat: 255, deadlift: 315, startDate: isoOff(0), seed: 24865 };
}
/** T-1 and T-2 of a dated test, by date arithmetic: the cells [week, day] that must carry no section with items. */
function testEveCells(tw: number, wd: number): [number, DayKey, number][] {
  const out: [number, DayKey, number][] = [];
  for (const k of [1, 2]) { const o = 7 * (tw - 1) + wd - k; if (o >= 0) out.push([Math.floor(o / 7) + 1, ISO[o % 7], k]); }
  return out;
}
/** The short dated programs of the lift-free claim: pace and mile tests of one and two weeks, and NRC race windows. */
function shortDatedLattice(): FamCfg[] {
  const out: FamCfg[] = [];
  for (const g of [PACE_TEST, MILE_TEST]) for (const mix of ['', 'bike', 'swim'] as const) for (const rest of [[], ['sun'], ['sat'], ['sun', 'wed'], ['sat', 'sun'], ['mon', 'fri'], ['sun', 'tue', 'thu', 'sat']] satisfies DayKey[][]) for (const tw of [1, 2]) for (let wd = 0; wd < 7; wd++)
    out.push({ fam: g.id + (mix ? '+' + mix : '') + ' tw' + tw, cfg: datedTestCfg(g, mix, rest, tw, wd) });
  for (const g of ['run_5k', 'run_10k']) for (const mix of ['', 'bike'] as const) for (const rest of [['sun'], ['sun', 'wed']] satisfies DayKey[][]) for (const off of [2, 5, 9, 12]) {
    const cg: CardioGoals = { run: { id: g, label: g } };
    if (mix) cg.bike = { id: 'bike_base', label: 'Bike' };
    out.push({ fam: 'NRC ' + g + (mix ? '+' + mix : ''), cfg: Object.assign(clone(fixtures.HALF_MANNY), { cardioTypes: mix ? ['run', mix] : ['run'], cardioGoals: cg, restDays: rest.slice(), seed: 76308, startDate: isoOff(0), raceDate: isoOff(off) }) });
  }
  return out;
}
/** A lift day: a training day tagged 'lift', or carrying a section with items that is neither core nor hip. */
const liftDay = (x: Day | null | undefined): boolean => !!x && !x.rest && ((x.tags || []).includes('lift') || (x.sections || []).some(s => !s.core && !s.hip && (s.items || []).length));
const hasLift = (p: Program): boolean => Object.keys(p.weeks).some(w => ISO.some(d => liftDay(p.weeks[w][d])));

// ── the pace family's placement, tallied over a lattice (D127) ────────────────────────────────────────────────────
/**
 * The pace config on every calendar with zero to three rest days and each seed, every week: leg roles on the long
 * run's eve and on the long run itself by training-day count, week 1's placement priced by the hand table against the
 * cheapest legal placement, shaped weeks with no speed day the hand shape can see, and the weeks where a hit was
 * possible at all (the eve a training day and both leg roles in the week).
 */
/** paceEveTally's counts (see there). */
export interface PaceEveTally {
  byDays: Record<string, { weeks: number; eve: number }>; weeks: number; shaped: number; speedless: number; couldHit: number; placements: number;
  eveHits: string[]; dayHits: string[]; offMin: string[];
}
function paceEveTally(seeds: number[]): PaceEveTally {
  const byDays: Record<string, { weeks: number; eve: number }> = {};
  let weeks = 0, shaped = 0, speedless = 0, couldHit = 0, placements = 0;
  const eveHits: string[] = [], dayHits: string[] = [], offMin: string[] = [];
  R.calendars([3, 2, 1, 0]).forEach(c => seeds.forEach(seed => {
    const n = c.train.length;
    byDays[n] = byDays[n] || { weeks: 0, eve: 0 };
    const p: Program = build(R.paceCfg(c.rest, seed));
    weeksOf(p).forEach(w => {
      const wk = p.weeks[w], sh = handShape(wk);
      weeks++;
      byDays[n].weeks++;
      if (!sh) return;
      shaped++;
      if (!sh.speed.size) speedless++;
      const roleAt = (d: DayKey): Role | null => ROLE_OF[(wk[d] && wk[d].title) || ''] || null;
      const leg = (d: DayKey): boolean => roleAt(d) === 'pull' || roleAt(d) === 'legs';
      const train = DAYS.filter(d => wk[d] && !wk[d].rest);
      if (train.includes(sh.eve) && train.some(d => roleAt(d) === 'pull') && train.some(d => roleAt(d) === 'legs')) couldHit++;
      if (leg(sh.eve)) { byDays[n].eve++; eveHits.push(c.key + ' seed ' + seed + ' W' + w + ' eve ' + sh.eve + ' ' + roleAt(sh.eve)); }
      if (leg(sh.long)) dayHits.push(c.key + ' seed ' + seed + ' W' + w + ' long ' + sh.long + ' ' + roleAt(sh.long));
      if (w !== 1) return;
      const pullD = train.find(d => roleAt(d) === 'pull'), legsD = train.find(d => roleAt(d) === 'legs');
      if (!pullD && !legsD) return;
      let got: number, best = Infinity;
      if (pullD && legsD) {
        got = handCost(sh, 'pull', pullD) + handCost(sh, 'legs', legsD);
        train.forEach(a => train.forEach(b => { if (a !== b) best = Math.min(best, handCost(sh, 'pull', a) + handCost(sh, 'legs', b)); }));
      } else {
        const role = pullD ? 'pull' : 'legs';
        got = handCost(sh, role, (pullD || legsD)!);
        train.forEach(d => { best = Math.min(best, handCost(sh, role, d)); });
      }
      if (!isFinite(best)) return;   // too tight: the ruling hands the week back to the 48 hour rule
      placements++;
      if (got !== best) offMin.push(c.key + ' seed ' + seed + ' pull ' + pullD + ' legs ' + legsD + ' costs ' + got + ', the minimum is ' + best);
    });
  }));
  return { byDays, weeks, shaped, speedless, couldHit, placements, eveHits, dayHits, offMin };
}
/** run_base on every calendar with two or three rest days: a long-keyed run places by the run shape, none keeps the 48 hour rule. */
function runBaseNotes(seeds: number[], k?: number): { total: number; long: number; noLong: number; d36: number; bad: string[] } {
  let total = 0, long = 0, noLong = 0, d36 = 0;
  const bad: string[] = [];
  R.every(R.calendars([3, 2]), k || 1).forEach(c => seeds.forEach(seed => {
    const cfg = R.paceCfg(c.rest, seed);
    cfg.cardioGoals = { run: { id: 'run_base', label: 'Base', baselineDist: '3', baseline: '3mi', mileBestMins: '8', mileBestSecs: '30' } };
    total++;
    const p: Program = build(cfg), n = p.legRecoveryNote;
    if (n && n.indexOf(D36_NOTE) >= 0) d36++;
    const hasLong = weeksOf(p).some(w => DAYS.some(d => cards(p.weeks[w][d]).some(x => x.type === 'run' && !!x.dose && x.dose.key === 'long')));
    if (hasLong) { long++; if (!isBaseNote(n)) bad.push(c.key + ' seed ' + seed + ' long-keyed, note ' + JSON.stringify(n)); }
    else { noLong++; if (!onTier48(n)) bad.push(c.key + ' seed ' + seed + ' no long key, note ' + JSON.stringify(n)); }
  }));
  return { total, long, noLong, d36, bad };
}
/** Week 1 of three calendars by three seeds: CHI cards, and the run each hinge day carries. */
function hingeRuns(): { chiWk1: number; onRun: number; onSlow: number; onChi: number } {
  let chiWk1 = 0, onRun = 0, onSlow = 0, onChi = 0;
  ([['sun', 'wed'], ['sun'], ['sun', 'wed', 'fri']] satisfies DayKey[][]).forEach(rest => [1001, 2002, 3003].forEach(seed => {
    const w: Week = build(R.paceCfg(rest, seed)).weeks[1];
    DAYS.forEach(d => cards(w[d]).forEach(c => {
      if (c.type !== 'run') return;
      const s = String(c.subtype || '');
      if (LI.test(s)) chiWk1++;
      if ((w[d].title || '') !== 'Posterior Chain') return;
      onRun++;
      if (LI.test(s)) onChi++;
      else if (!SI.test(s)) onSlow++;
    }));
  }));
  return { chiWk1, onRun, onSlow, onChi };
}
/** The run_base lattice read whole (or every k-th config): classes reached, label and key, lower Mains, notes. */
/** runBaseTally's counts (see there). */
export interface RunBaseTally { progs: number; cardsN: number; cls: Record<string, number>; disagree: string[]; hits: string[]; r2: number; r2bad: string[]; r3: number; r3bad: string[]; notes: Set<string | null> }
function runBaseTally(k?: number): RunBaseTally {
  const cls: Record<string, number> = {}, disagree: string[] = [], hits: string[] = [], r2bad: string[] = [], r3bad: string[] = [], notes = new Set<string | null>();
  let progs = 0, cardsN = 0, r2 = 0, r3 = 0;
  R.every(runBaseLattice(), k || 1).forEach(L => {
    const x = readRunBase(L);
    progs++;
    cardsN += x.cards;
    x.classes.forEach(c => { cls[c] = (cls[c] || 0) + 1; });
    disagree.push(...x.disagree);
    hits.push(...x.hits);
    notes.add(x.note);
    if (x.hasLong) { r2++; if (!isBaseNote(x.note)) r2bad.push(L.fam + ' ' + JSON.stringify(x.note)); }
    else { r3++; if (!onTier48(x.note)) r3bad.push(L.fam + ' ' + JSON.stringify(x.note)); }
  });
  return { progs, cardsN, cls, disagree, hits, r2, r2bad, r3, r3bad, notes };
}
/** T-1 and T-2 of every dated pace or mile test (or every k-th): the days checked and the ones carrying a section with items. */
function testEveTally(k?: number): { progs: number; days: number; bad: string[] } {
  const cfgs: { g: CardioGoal; mix: '' | 'bike'; rest: DayKey[]; tw: number; wd: number }[] = [];
  for (const g of [PACE_TEST, MILE_TEST]) for (const mix of ['', 'bike'] as const) for (const rest of [[], ['sun'], ['sun', 'wed'], ['sat', 'sun']] satisfies DayKey[][]) for (const tw of [1, 2, 3]) for (let wd = 0; wd < 7; wd++)
    cfgs.push({ g, mix, rest, tw, wd });
  let days = 0, progs = 0;
  const bad: string[] = [];
  R.every(cfgs, k || 1).forEach(x => {
    const p: Program = build(datedTestCfg(x.g, x.mix, x.rest, x.tw, x.wd));
    progs++;
    testEveCells(x.tw, x.wd).forEach(([w, d, t]) => {
      days++;
      const day = p.weeks[w] && p.weeks[w][d];
      if (day && (day.sections || []).some(s => (s.items || []).length)) bad.push(x.g.id + (x.mix ? '+' + x.mix : '') + ' tw' + x.tw + ' test ' + ISO[x.wd] + ' T-' + t + ' W' + w + ' ' + d);
    });
  });
  return { progs, days, bad };
}
/** The short dated programs (or every k-th): the lift-free ones, and those of them that print a placement note. */
function liftFreeTally(k?: number): { free: number; withLift: number; bad: string[] } {
  let free = 0, withLift = 0;
  const bad: string[] = [];
  R.every(shortDatedLattice(), k || 1).forEach(e => {
    const p: Program = build(e.cfg);
    if (hasLift(p)) { withLift++; return; }
    free++;
    if (p.legRecoveryNote != null) bad.push(e.fam + ' race ' + e.cfg.raceDate + ' rest ' + e.cfg.restDays + ' ' + JSON.stringify(String(p.legRecoveryNote).slice(0, 50)));
  });
  return { free, withLift, bad };
}

export {
  ROLE_OF, isoPrev, isoNext, handCost, handShape, D36_NOTE, BASE_NOTE, STEADY_DEAD, TIER48, onTier48, isBaseNote,
  LOWER_MAIN, mainLift, lowerDay, labelLong, keyLong, eveOf, runBaseLattice, readRunBase,
  PACE_TEST, MILE_TEST, datedTestCfg, testEveCells, shortDatedLattice, liftDay, hasLift,
  paceEveTally, runBaseNotes, hingeRuns, runBaseTally, testEveTally, liftFreeTally,
};