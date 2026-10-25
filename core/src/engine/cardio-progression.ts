import { ALL_DAYS_ORDER, _ISO_ORDER } from './calendar.ts';
import { _clkMS } from './clock-format.ts';
import { buildRunSession, isCardioCutbackWeek, paceGoalTarget } from './nsw-cardio.ts';
import {
  NRC_GOALS, PACE_GOALS, buildBikeSession, buildNRCSession, buildSwimSession, getNRCSessionTypes,
} from './nrc-race-bike-swim.ts';
import { injuryPlan } from './injury.ts';
// end of the module imports (scripts/module-blocks.mjs writes them; build-index.mjs strips them)
import type { CardioDose, CardioGoal, CardioGoals, CardioType, Cfg, DayKey, Experience, MileBestSource } from '../domain/index.ts';
import type { RacePin } from './nrc-race-bike-swim.ts';
import type { CardioSession, TaperStep } from './nsw-cardio.ts';

/** One row of the pace chart: seconds per mile for each pace, total seconds for the *best columns. */
export interface PaceRow { mile: number; fiveKbest: number; fiveK: number; tenKbest: number; tenK: number; tempo: number; halfBest: number; half: number; marBest: number; marathon: number; recovery: number }
/** A column of the pace chart. */
export type PaceCol = keyof PaceRow;
/** How many days a week each sport gets. */
export type SportTargets = Record<string, number>;
/** The taper a program runs: its length in weeks, and each week's place in it. */
export interface TaperWindow { taperWks: number; inTaper(w: number): boolean; taperFactor(w: number): number }
/** Each week's cardio, by week number, then by training day. */
export type CardioSchedule = Record<string, Record<string, CardioSession | null>>;
/** The cfg as one build carries it: the race week's pin rides along (cfg._racePin), deleted before the cfg is stored. */
export type EngineCfg = Cfg & { _racePin?: RacePin | null };
/** What the week view says about the run's pace anchor (runAnchorInfo): the mile pace, where it came from, and the chart row. */
export interface RunAnchorInfo { anchorSec: number; rawSec: number; clamped: 'fast' | 'slow' | null; row: PaceRow; kind: 'default' | 'seeded' | 'edited' | 'entered'; exp: Experience; prog: string; n: number; wk: number; from: MileBestSource['from'] | null; race: 'half' | 'marathon' | null; goalId: string; goalT: { dist: number; sec: number } | null }
/** A run-base athlete's frequency ramp: which of the chosen days run each week, and for how many minutes. */
interface RunBaseFreq { activeByWeek: Record<number, Set<number>>; minsByWeek: Record<number, Record<number, number>>; longCap: number }
/** The base-cardio plan: the days chosen for cardio and the sport on each. */
/** A spaced pick of run days (_nrcSpacedRunDays): the chosen indexes, each day's session type, and the ranking it won on. */
interface NrcPick { idxs: number[]; typeOf: Record<string, string>; coll: number; untol: number; tol: number; longLast: number; speedsAfterRest: number; recBeforeLong: number; canonical: number; identity: number; spread: number; qualRest: number; qualFirst: number; _fbFired?: boolean }
interface BaseCardioPlan { days: DayKey[]; dayToSport: CardioType[]; freq?: RunBaseFreq }


// Speed-responsive goals depend on interval sessions to deliver their pace work.
// Sport-aware via globally-unique goal IDs. Distance goals (half/marathon/mile/tri)
// lean on long sessions instead and aren't included. Adding a sport's time goal here
// makes it primary-eligible and interval-protected automatically.
// Beginner on-ramp boundary. With the 2mi "some running background" floor sitting just
// below the ~2.5mi doctrine baseline, this is now ~0-1 weeks for nearly everyone — the
// elaborate couch on-ramp is intentionally gone. Kept as the single source of truth in
// case a future off-the-couch tier reintroduces a real ramp.
function runOnRampWeeks(baselineMiles: number | null | undefined, experience: string | null | undefined): number {
  if(experience !== 'beginner') return 0;
  const FLOOR = 2.0, MERGE = 2.5;
  let cur = Math.max(FLOOR, baselineMiles || FLOOR);
  if(cur >= MERGE) return 0;
  let w = 0;
  while(cur < MERGE && w < 24) { w++; if(w % 4 !== 0) cur *= 1.10; }
  return w;
}

// ─────────────────────────────────────────────────────────────────────────────
// NRC PACE CHART — shared pace backbone for BOTH engines (NSW tactical + NRC
// civilian). Source: Nike Run Club training plans (identical chart in 5K/Half/
// Marathon programs). Each row is anchored to a mile-best time; the columns give
// the AVERAGE mile pace to train each distance at, plus race-equivalent bests.
// All values stored in SECONDS for precision. paceChartLookup() takes any one
// fitness anchor (a recent race time or mile best) and interpolates the full row,
// so every workout in either engine derives its target from one input.
// ─────────────────────────────────────────────────────────────────────────────
const PACE_CHART: PaceRow[] = [
  // mileBest, 5kBest, 5kAvg, 10kBest, 10kAvg, tempo, halfBest, halfAvg, marBest, marAvg, recovery
  {mile:300, fiveKbest:1025, fiveK:330, tenKbest:2145, tenK:345, tempo:365, halfBest:4680, half:360, marBest:9840,  marathon:375, recovery:420},
  {mile:330, fiveKbest:1125, fiveK:360, tenKbest:2340, tenK:375, tempo:395, halfBest:5100, half:390, marBest:10800, marathon:410, recovery:455},
  {mile:360, fiveKbest:1215, fiveK:390, tenKbest:2520, tenK:405, tempo:425, halfBest:5700, half:435, marBest:11700, marathon:445, recovery:490},
  {mile:390, fiveKbest:1320, fiveK:425, tenKbest:2745, tenK:440, tempo:460, halfBest:6000, half:455, marBest:12600, marathon:480, recovery:525},
  {mile:420, fiveKbest:1425, fiveK:460, tenKbest:2940, tenK:475, tempo:495, halfBest:6600, half:500, marBest:13500, marathon:515, recovery:560},
  {mile:450, fiveKbest:1515, fiveK:485, tenKbest:3150, tenK:505, tempo:530, halfBest:6900, half:525, marBest:14400, marathon:550, recovery:595},
  {mile:480, fiveKbest:1620, fiveK:520, tenKbest:3350, tenK:540, tempo:565, halfBest:7500, half:570, marBest:15300, marathon:585, recovery:630},
  {mile:510, fiveKbest:1710, fiveK:550, tenKbest:3540, tenK:570, tempo:595, halfBest:7800, half:595, marBest:16200, marathon:615, recovery:660},
  {mile:540, fiveKbest:1800, fiveK:580, tenKbest:3750, tenK:600, tempo:630, halfBest:8400, half:640, marBest:17100, marathon:650, recovery:695},
  {mile:570, fiveKbest:1905, fiveK:615, tenKbest:3960, tenK:635, tempo:660, halfBest:8700, half:665, marBest:18000, marathon:685, recovery:730},
  {mile:600, fiveKbest:1980, fiveK:640, tenKbest:4140, tenK:665, tempo:695, halfBest:9300, half:705, marBest:18900, marathon:720, recovery:765},
  {mile:630, fiveKbest:2100, fiveK:675, tenKbest:4320, tenK:695, tempo:720, halfBest:9600, half:730, marBest:19800, marathon:755, recovery:800},
  {mile:660, fiveKbest:2175, fiveK:700, tenKbest:4500, tenK:720, tempo:755, halfBest:10200,half:775, marBest:20400, marathon:780, recovery:825},
  {mile:690, fiveKbest:2280, fiveK:735, tenKbest:4710, tenK:755, tempo:780, halfBest:10500,half:795, marBest:21000, marathon:800, recovery:845},
  {mile:720, fiveKbest:2370, fiveK:760, tenKbest:4890, tenK:785, tempo:815, halfBest:11100,half:845, marBest:21600, marathon:825, recovery:870},
];

// V203 (D117): the single owner of the steady ceiling. Easy days never run faster than
// the midpoint of Tempo and Recovery Pace; every easy-run cap in the app reads this and
// nothing else, so there is exactly one place the ceiling can be wrong.
function steadyCapSec(row: PaceRow): number{ return Math.round((row.tempo + row.recovery)/2); }

// Find the row from any anchor and interpolate between bracketing rows.
// anchorType: 'mile' | 'fiveKbest' | 'tenKbest' | 'halfBest' | 'marBest'
// Returns full pace set in sec/mile (avg training paces) + the row's race bests.
function paceChartLookup(anchorType: PaceCol, anchorSec: number): PaceRow {
  const rows = PACE_CHART;
  const key = anchorType;
  // Clamp outside the table
  if (anchorSec <= rows[0][key]) return Object.assign({}, rows[0]);
  if (anchorSec >= rows[rows.length-1][key]) return Object.assign({}, rows[rows.length-1]);
  for (let i = 0; i < rows.length - 1; i++) {
    const lo = rows[i], hi = rows[i+1];
    if (anchorSec >= lo[key] && anchorSec <= hi[key]) {
      const span = hi[key] - lo[key];
      const f = span === 0 ? 0 : (anchorSec - lo[key]) / span;
      const out = {} as PaceRow;
      for (const col of Object.keys(lo) as PaceCol[]) out[col] = Math.round(lo[col] + (hi[col] - lo[col]) * f);
      return out;
    }
  }
  return Object.assign({}, rows[rows.length-1]);
}

// ── ROW → GOAL DISTANCE (D100, V202) ─────────────────────────────────────────
// PACE_CHART tabulates, for one fitness row, the average mile pace to train each RACE
// distance at. A pace goal is entered at a distance the table has no column for (1.5 mi,
// 2 km, 5 mi), so the row is READ at that distance:
//   * columns sit at their true distances in miles (unit conversions, not coaching numbers);
//   * interpolation is in LOG distance between the two bracketing columns — fitted over all
//     15 rows, log beat linear in 15/15, pooled RMSE 5.46 s vs 17.75 s;
//   * a running maximum runs across the columns in distance order, because a longer distance
//     is never a faster pace. That is the definition of what the chart tabulates, and it is
//     reachable: row 15 (mile 12:00) inverts, half 845 → marathon 825, and the goal-distance
//     input carries min="0.1" with no max;
//   * outside the table the value clamps to the table's own bounds at both ends.
// rowPaceAt(row, 1.0) returns the mile column exactly.
var ROW_PACE_COLS: { d: number; k: PaceCol }[] = [
  {d:1,      k:'mile'},
  {d:3.107,  k:'fiveK'},
  {d:6.214,  k:'tenK'},
  {d:13.109, k:'half'},
  {d:26.219, k:'marathon'},
];
function rowPaceAt(row: PaceRow, distMiles: number | string | null | undefined): number {
  var run = -Infinity;
  var v = ROW_PACE_COLS.map(function(c){ run = Math.max(run, +row[c.k]); return {d:c.d, p:run}; });
  var d = +distMiles!;
  if (!(d > 0))            return v[0].p;                 // no distance → the mile column
  if (d <= v[0].d)         return v[0].p;                 // below the table → clamp low
  if (d >= v[v.length-1].d) return v[v.length-1].p;       // above the table → clamp high
  for (var i = 0; i < v.length - 1; i++) {
    if (d >= v[i].d && d <= v[i+1].d) {
      var f = (Math.log(d) - Math.log(v[i].d)) / (Math.log(v[i+1].d) - Math.log(v[i].d));
      return v[i].p + (v[i+1].p - v[i].p) * f;
    }
  }
  return v[v.length-1].p;
}

function isSpeedGoal(goalId: unknown): boolean {
  return goalId === 'run_pace_goal' || goalId === 'run_5k' || goalId === 'run_10k'
      || goalId === 'swim_500_time' || goalId === 'swim_100_time';
}
// True ONLY when a RUN goal is a genuine performance/event objective — a race plan
// (half/marathon) or a timed/speed goal. Mirrors the cardio engine's _anyPerfCardio run
// test, so "does it taper" can never disagree with "is this base cardio." A base/complement
// run (run_base or no goal) supporting a size/strength block returns false → it must NOT taper.
// ── CARDIO-WIDE PERFORMANCE PREDICATE (V134) ─────────────────────────────────
// The base-cardio governor's _anyPerfCardio test recognised only run speed/race goals
// and swim time goals, so bike_century, bike_50, swim_tri and swim_mile were invisible
// to it. On any body lifting focus the governor then forced them into recovery mode:
// hybrid strength + bike_50 produced 28 identical 20-minute recovery spins across 14
// weeks — for a goal the HYBRID_EXCLUDED_GOALS comment explicitly promises as a hybrid
// capability goal. A distance/event goal IS performance cardio; the athlete named it.
// Deliberately NOT folded into isSpeedGoal — the V115 note in buildCardioProgression
// stands: that predicate also drives day allocation, interval protection and the pace
// chart, and widening it would move unrelated output. Both _anyPerfCardio bodies now
// consume THIS one predicate, so "does it taper" and "is this base cardio" stay
// mirrored. Taper still fires only on an explicit race date (eventTargeted), which is
// what keeps a no-date hybrid capability build un-tapered, exactly as the hybrid
// doctrine requires. bike_ftp / bike_cals stay OUT deliberately: passing them through
// would hand them the generic bike sessions and half-implement their promise badly —
// their real fix is a session builder (§12).
function isPerformanceCardioGoal(g: CardioGoal | null | undefined): boolean{
  if(!g) return false;
  return isSpeedGoal(g.id) || g.id === 'run_half' || g.id === 'run_marathon'
      || g.id === 'bike_century' || g.id === 'bike_50'
      || g.id === 'swim_tri' || g.id === 'swim_mile';
}
function isPerformanceRunGoal(g: CardioGoal | null | undefined): boolean{
  if(!g) return false;
  return isSpeedGoal(g.id) || g.id === 'run_half' || g.id === 'run_marathon';
}

// ── TAPER: SINGLE SOURCE OF TRUTH ───────────────────────────────────────────
// One formula, one gate. The cardio session taper AND the barbell wave both flow
// through these, so the bar can never again disagree with the run. Change the rule
// in one place and every reader (cardio + lifting) moves together.
// V186 (§4b): eventTargeted, OR an NRC 5K/10K plan — its final week is a race or a time
// trial either way, and the lifting layer treats both as the event (D34 shape).
function taperEventOn(cfg: Cfg | null | undefined): boolean{
  if(!cfg) return true;
  if(cfg.eventTargeted !== false) return true;
  const g = cfg.cardioGoals && cfg.cardioGoals.run;
  return !!(g && (g.id === 'run_5k' || g.id === 'run_10k') && (cfg.cardioTypes||[]).includes('run'));
}
function taperWeeksFor(eventOn: boolean, isBaseCardio: boolean, totalWeeks: number | null | undefined): number{
  // A program tapers ONLY for a real event, and never for base/complement cardio.
  return (eventOn && !isBaseCardio) ? Math.max(2, Math.round((totalWeeks || 6) * 0.12)) : 0;
}
// Resolves the whole taper window for a program. isBaseCardio mirrors the cardio
// governor in buildCardioProgression (no performance lift path AND no performance
// cardio goal => base). Returns the week count + the inTaper / taperFactor curve.
function programTaperWindow(cfg: Cfg, cardioTypes: CardioType[] | null | undefined, cardioGoals: CardioGoals | null | undefined, totalWeeks: number | null | undefined): TaperWindow{
  const tw = totalWeeks || 6;
  const types = cardioTypes || [];
  const _perfLiftPaths = (cfg.goal === 'athletic' || cfg.goal === 'endurance');
  const _anyPerfCardio = types.some(t => {
    const g = cardioGoals && cardioGoals[t];
    if(!g) return false;
    return isPerformanceCardioGoal(g);   // V134: distance/event goals included
  });
  const isBaseCardio = !_perfLiftPaths && !_anyPerfCardio;
  // V116: the `types.includes('run')` gate that used to sit here meant an event-targeted
  // program with no RUN in it never tapered anything — not its cardio, not its barbell
  // wave. A 12-week 50-mile bike build with a date on it rode into race week at peak
  // volume with the lifting wave still climbing. Removing the gate is measured at ZERO
  // change to any program containing a run, and 1.62% of lift lines on programs without
  // one, all of which were previously getting no taper at all. It also keeps this window
  // consistent with the cardio taper hoisted into buildCardioProgression, which does not
  // have the gate — without this, the UI would report "no taper weeks" on a program whose
  // sessions were visibly tapering.
  const taperWks = taperWeeksFor(taperEventOn(cfg), isBaseCardio, tw);   // V186 (§4b)
  function inTaper(w: number): boolean{ return taperWks > 0 && w > (tw - taperWks); }
  function taperFactor(w: number): number{
    if(!inTaper(w)) return 1;
    const t = w - (tw - taperWks);
    return 1 - (t / (taperWks + 1)) * 0.4;
  }
  return { taperWks, inTaper, taperFactor };
}
// Single source of truth for how many day-slots each sport gets. Used by both the
// allocation engine and the rest-days nudge so the warning can never disagree with
// what the engine actually builds. Returns {primary, targets:{sport:count}}.
function sportDayTargets(cardioTypes: CardioType[] | null | undefined, cardioGoals: CardioGoals, totalDays: number, liftGoal: string | null | undefined, cardioMode: string | null | undefined): { primary: CardioType | null; targets: SportTargets } {
  if(!cardioTypes || !cardioTypes.length || totalDays <= 0) return {primary:null, targets:{}};
  // V187 (F2, ruled "Easy day concur"): Nike's week is FIVE runs on all four plans and
  // every half/marathon ever built was four — the >=5 layouts in getNRCSessionTypes had
  // never executed. The 4-cap is the right hybrid compression and stays for lifting-
  // priority focuses; on the support/event track (support_strength / support_athletic →
  // 'athletic', support_prevention → 'endurance' — the file's existing "performance lift
  // paths" class, the same test the governor and taper use for "cardio IS the objective")
  // six or more training days give the NRC goals Nike's fifth run. Six is the floor so
  // one pure lift day survives. Both callers pass the same resolved goal so the wizard
  // nudge and the engine cannot disagree.
  const _nrcFive = (liftGoal === 'athletic' || liftGoal === 'endurance') && totalDays >= 6;
  
  // Strict day caps per sport based on the target block
  const SPORT_CEILINGS: Record<string, number> = {
    // run_base: 4 (V159, D4b) — NSW's weekly template is FOUR runs (2 LSD + quality +
    // long), so 4 is the doctrinal transcription; at 4 days the layout deals the chi
    // slot, which makes the V158 benchmark steady-slot obligation reachable and gated.
    // run_5k / run_10k: 4 (V186) — they ride the NRC tables now, same compression as the
    // half (Nike prescribes 5; F2's ceiling-5-under-endurance is a separate ruling).
    // run_pace_goal: 4 (V205, D125 amended) — was 3. NSW Table 7 scales a pace block by
    // adding aerobic volume, and the fourth run is that volume: easy / INT / CHI / long.
    // The fourth run is CONDITIONAL on the spacing chooser returning a collision-free
    // layout; where it cannot, the consumer below and the caller in buildProgram fall the
    // week back to three. run_mile_time and run_15_under10 are aliased to run_pace_goal by
    // _GOAL_ALIAS before the engine reads a goal id, so these two rows are never consulted
    // — they move with it so the table cannot read as a contradiction.
    run_5k: 4, run_10k: 4, run_base: 4, run_pace_goal: 4, run_mile_time: 4, run_15_under10: 4,
    run_half: 4, run_marathon: 4,
    bike_base: 3, bike_ftp: 3, bike_cals: 3, bike_50: 3, bike_century: 4,
    swim_base: 3, swim_100_time: 3, swim_500_time: 3, swim_mile: 4, swim_tri: 4
  };
  const targets: SportTargets = {};
  cardioTypes.forEach(t => {
    const goalId = cardioGoals[t]?.id;
    const ceiling = (_nrcFive && t === 'run' && NRC_GOALS.has(goalId)) ? 5 : (SPORT_CEILINGS[goalId!] || 3);   // V187 (F2)
    // V205 (D125 amended): the pace family's fourth run is conditional on the spacing
    // chooser returning a collision-free layout, and that chooser only runs on a SOLO
    // cardio week. A multi-sport week never reaches it, so there is no coll==0 to key on
    // and the ruling's own fallback applies: the pace ceiling stays 3 there. Bike and swim
    // are untouched on both paths. Both callers (wizard nudge and engine) read this, so
    // the nudge cannot promise a fourth run the engine will not deal.
    // V205 (D132): THE FOURTH RUN IS GRANTED TO A WEEK THAT CARRIES QUALITY. D125's
    // argument for the fourth run was the guide's four-session week: two LSDs, an SI and
    // an LI. On a noimpact or noimpact_swim week with no bike or swim to fall back on,
    // the sweep rewrites every run to a pain-free incline walk. No SI, no LI, no long
    // run, no shape to protect. A fourth walk is not that week, so the ceiling is 3.
    // ON THE KEY, AND WHY IT IS THE CAUSE AND NOT THE EFFECT. This ceiling is read
    // BEFORE the sweep runs, so "speedless" is not knowable at the decision point and
    // cardioMode is. With a bike or swim present the sweep reroutes rather than walks,
    // and such a week is multi-sport, already held at 3 by the consumer clause beside it.
    // The two keys are therefore deliberately different, and g205_d132_walkweek asserts
    // the property of the WEEK rather than mirroring this line, so that a future
    // divergence between cause and effect fails by name instead of shipping quietly.
    const _walkOnly = (cardioMode === 'noimpact' || cardioMode === 'noimpact_swim');
    const _ceil = (PACE_GOALS.has(goalId) && (cardioTypes.length !== 1 || _walkOnly)) ? Math.min(ceiling, 3) : ceiling;
    // Cap sport days to its specific structural ceiling
    targets[t] = Math.min(_ceil, totalDays);
  });
  return { primary: cardioTypes[0], targets };
}

// ── MULTI-SPORT RECOVERY-AWARE BUDGET ──
// Leg sports (run + bike) draw on the same leg recovery, so they SHARE one budget
// (the higher of their two ceilings) instead of each claiming a full one. Swim is
// non-competing (upper-body, zero-impact) and keeps its own budget on top — this is
// the NSW principle (run + swim 3×3) applied generally. Tactical/endurance blocks
// leave cardio uncapped because cardio IS the objective there. Lifting-priority blocks
// reserve pure-lifting days: strength/size reserve 2, balanced/fat-loss reserve 1.
function multiSportTargets(cardioTypes: CardioType[], baseTargets: SportTargets, cfg: Cfg, nDays: number): SportTargets {
  const LEG = new Set(['run','bike']);
  // Tactical/endurance: cardio is the goal → no cap, ceilings as-is (NSW stays 3×3).
  if(cfg.goal === 'athletic' || cfg.goal === 'endurance') {
    const t: SportTargets = {}; cardioTypes.forEach(s => t[s] = baseTargets[s] || 0); return t;
  }
  const isStrengthSize = (cfg.goal === 'strength' || cfg.goal === 'hypertrophy');
  const liftFloor = isStrengthSize ? 2 : 1;

  const legSports = cardioTypes.filter(s => LEG.has(s));
  const otherSports = cardioTypes.filter(s => !LEG.has(s));
  // Leg sports share the single highest leg ceiling; non-leg sports keep their own.
  const legBudget = legSports.length ? Math.max(...legSports.map(s => baseTargets[s] || 0)) : 0;
  const otherBudget = otherSports.reduce((sum, s) => sum + (baseTargets[s] || 0), 0);

  // Trim total cardio so at least `liftFloor` days stay pure lifting (keep ≥1 cardio day).
  const total = legBudget + otherBudget;
  const allowed = Math.max(1, nDays - liftFloor);
  let legShare = legBudget, otherShare = otherBudget;
  if(total > allowed) {
    legShare = legSports.length ? Math.max(1, Math.round(allowed * legBudget / total)) : 0;
    otherShare = Math.max(0, allowed - legShare);
  }

  const targets: SportTargets = {}; cardioTypes.forEach(s => targets[s] = 0);
  const spread = (sports: CardioType[], share: number) => sports.forEach((s, i) => {
    targets[s] = Math.floor(share / sports.length) + (i < (share % sports.length) ? 1 : 0);
  });
  if(legSports.length) spread(legSports, legShare);
  if(otherSports.length) spread(otherSports, otherShare);
  return targets;
}

function buildCardioProgression(cardioTypes: CardioType[] | null | undefined, cardioGoals: CardioGoals, trainDays: DayKey[], cfg: EngineCfg, totalWeeks: number | null | undefined): CardioSchedule {
  const schedule: CardioSchedule = {};
  const tw = totalWeeks || 6;
  for(let w = 1; w <= tw; w++) schedule[w] = {};
  if(!cardioTypes || !cardioTypes.length) return schedule;

  const isEndurance = cfg.goal === 'endurance';

  // ── BASE-CARDIO GOVERNOR (global, bulletproof) ──
  // Decides whether cardio is SECONDARY support to lifting (cap hard) or the user's
  // actual performance objective (leave full). This is the single gate that fixes the
  // "5 days of running on a bodybuilding plan" bug across every lifting path.
  //
  // HIGH-PERFORMANCE — never capped. Any of:
  //   • a speed/timed cardio goal (5K, 10K, pace, swim 100/500 time)   → isSpeedGoal
  //   • an NRC race goal (5K / 10K / half / full marathon, V186)        → NRC_GOALS
  //   • a support/event lift path (athletic or endurance support = the SEAL/tactical
  //     and sport-support tracks, internal goal 'athletic' or 'endurance')
  // These get their full high-frequency conditioning arrays untouched.
  //
  // BASE CARDIO — capped. Everything else: the "body" lifting focuses (strength,
  // hypertrophy/size, fatloss, balanced) paired with regular/base cardio (run_base,
  // bike_base/cals, swim_base, or any non-timed option). Here cardio is active recovery
  // that must not compete with lifting, so we hard-chop to 2 days and force easy pacing.
  const _perfLiftPaths = (cfg.goal === 'athletic' || cfg.goal === 'endurance');
  const _anyPerfCardio = cardioTypes.some(t => {
    const g = cardioGoals && cardioGoals[t];
    if(!g) return false;
    // race goals (half/marathon) + any speed/timed goal are high-performance
    return isPerformanceCardioGoal(g);   // V134: distance/event goals included
  });
  const isBaseCardio = !_perfLiftPaths && !_anyPerfCardio;

  let cardioTrainDays = trainDays;
  // V188 (D14a): weeks are Monday-anchored but trainDays arrives Sunday-first, so the
  // NRC layout's "long run = last train day" could never land a Sunday — the race showed
  // up on the FIRST day of race week with a recovery run after it. Race goals lay out
  // Monday→Sunday. NSW and base cardio keep the file order (byte-identical).
  { const _rg = cardioTypes.includes('run') && cardioGoals.run && cardioGoals.run.id;
    if(_rg && NRC_GOALS.has(_rg)) cardioTrainDays = _ISO_ORDER.filter(d => trainDays.includes(d)); }
  // baseCardioPlan, when set, fully predefines the cardio calendar for base-cardio mode:
  // {days:[dayKey,...], dayToSport:[sport,...]} — bypassing sportDayTargets entirely.
  let baseCardioPlan: BaseCardioPlan | null = null;
  if(isBaseCardio) {
    // ── EXPLICIT BASE-CARDIO CALENDAR (bypasses sportDayTargets + greedy loop) ──
    // Cardio is active recovery here, so we hand-place AT MOST 2 sessions and force them
    // apart. The week is a CYCLE, not a list: Saturday and Sunday are ADJACENT. Taking
    // the first and last entries maximises separation only if you ignore the wrap, which
    // is how a Sun+Sat pair (one day apart) used to ship as "max gap" on a Sun/Tue/Thu/
    // Fri/Sat split. So score every pair by circular distance and take the widest.
    // Tie-break on raw index distance, which keeps the common Mon–Fri week on Mon+Fri.
    const all = trainDays;
    let chosen: DayKey[];
    // ── V159 (Build 3): FREQUENCY GROWTH — run_base only ─────────────────────────
    // The 2-day chop pulled the wrong interference lever. Interference scales with
    // DURATION and INTENSITY of endurance work, not frequency — so the governor now
    // caps single-session minutes hard and lets FREQUENCY climb instead: run days go
    // 2 → 3 → 4 by block thirds (D1: two-week-per-step holds let tendon and bone
    // catch the impact-frequency jump; each step lands with a per-session CUT so the
    // weekly rise stays ~15 min of redistribution, not new stress). Minutes are a
    // WEEKLY BUDGET, 50 + (w-1)*15, split across the week's runs: standard sessions
    // cap at 40, and the week's LAST run is the designated long run whose cap scales
    // with block length (D2, Mario's amendment): 40 at <=6 wks, +5 per 2 wks beyond,
    // ceiling 60 — "building a base" earns its long run on the blocks long enough to
    // absorb one. Budget clamps to the sum of caps, so it saturates instead of
    // overflowing. Cutback weeks keep FREQUENCY and trim minutes 20% — frequency is
    // the adaptation driver and the habit; minutes are the recovery lever.
    // Scope: solo run + run_base. Bike/swim base and multi-sport base keep the
    // 2-day pairwise chop below, byte-identical.
    const _runBaseFreq = cardioTypes.length === 1 && cardioTypes[0] === 'run'
      && ((cardioGoals.run || {}).id) === 'run_base' && all.length >= 2;
    if(_runBaseFreq){
      const N = all.length;
      const m = Math.min(4, N);
      if(m >= N) chosen = all.slice();
      else {
        const _set = new Set<number>();
        for(let k = 0; k < m; k++) _set.add(Math.round(k * (N - 1) / (m - 1)));
        chosen = [..._set].sort((a,b) => a - b).map(i => all[i]);
      }
      const _third = Math.ceil(tw / 3);
      const _runLongCap = tw <= 6 ? 40 : Math.min(60, 40 + Math.floor((tw - 6) / 2) * 5);
      const _activeByWeek: Record<number, Set<number>> = {}, _minsByWeek: Record<number, Record<number, number>> = {};
      for(let w = 1; w <= tw; w++){
        let n = w <= _third ? 2 : (w <= 2 * _third ? 3 : 4);
        n = Math.max(1, Math.min(n, chosen.length));
        let act: number[];
        if(n >= chosen.length) act = chosen.map((_, i) => i);
        else if(n === 1) act = [chosen.length - 1];
        else {
          const s = new Set<number>();
          for(let k = 0; k < n; k++) s.add(Math.round(k * (chosen.length - 1) / (n - 1)));
          act = [...s].sort((a,b) => a - b);
        }
        let b = 50 + (w - 1) * 15;
        if(isCardioCutbackWeek(w, tw)) b = b * 0.8;
        b = Math.min(b, (act.length - 1) * 40 + _runLongCap);
        let base = Math.floor(b / act.length / 5) * 5;
        // The 40 here is D2's ruling as code ("standard sessions cap at 40"). Differential
        // sweep (V159 gate session): at every reachable tw (6-10) the budget clamp above
        // already bounds b/n below 40 after floor-5, so this line is arithmetically
        // shadowed TODAY — it goes live the day block lengths grow past 10. Retained as
        // the ruling's enforcing line; the sabotage sweep targets the floor-5 instead.
        base = Math.max(15, Math.min(40, base));
        let last = Math.round((b - base * (act.length - 1)) / 5) * 5;
        last = Math.max(15, Math.min(_runLongCap, last));
        const mins: Record<number, number> = {};
        act.forEach((di, ix) => { mins[di] = (ix === act.length - 1) ? last : base; });
        _activeByWeek[w] = new Set(act); _minsByWeek[w] = mins;
      }
      baseCardioPlan = { days: chosen, dayToSport: chosen.map(() => 'run'),
        freq: { activeByWeek: _activeByWeek, minsByWeek: _minsByWeek, longCap: _runLongCap } };
      cardioTrainDays = chosen;
    }
    else if(all.length <= 1){ chosen = all.slice(); }              // only one slot exists
    else {
      const _idx: (d: DayKey) => number = d => ALL_DAYS_ORDER.indexOf(d);
      let best: DayKey[] | null = null, bestCirc = -1, bestRaw = -1;
      for(let i=0;i<all.length;i++){
        for(let j=i+1;j<all.length;j++){
          const raw = Math.abs(_idx(all[i]) - _idx(all[j]));
          const circ = Math.min(raw, 7 - raw);
          if(circ > bestCirc || (circ === bestCirc && raw > bestRaw)){
            bestCirc = circ; bestRaw = raw; best = [all[i], all[j]];
          }
        }
      }
      chosen = best || [all[0], all[all.length-1]];
    }
    // Sport assignment for the (up to) 2 chosen slots:
    //   • 2 sports selected ("Both") → 1 each, one per slot
    //   • 1 sport selected           → that sport on both slots
    //   • 3 sports (rare on base)     → first two distinct sports, 1 slot each
    // V159: the freq branch above fully built its own plan (with the freq maps the
    // dispatch reads); this tail is the 2-day plan's assembly and MUST NOT run over it —
    // an unconditional write here is the classic latch, and it would silently strip
    // `freq` and ship the old 2-day week under a new version number.
    if(!_runBaseFreq){
      let dts: CardioType[];
      if(cardioTypes.length === 1) {
        dts = chosen.map(() => cardioTypes[0]);
      } else {
        // one sport per slot, in selection order, cycling if somehow fewer slots than sports
        dts = chosen.map((d, i) => cardioTypes[i % cardioTypes.length]);
      }
      baseCardioPlan = { days: chosen, dayToSport: dts };
      cardioTrainDays = chosen;
    }
  }

  const nDays = cardioTrainDays.length;

  // ── SMART SESSION ASSIGNMENT ──
  // Build a per-week session type map for each training day
  // Rules:
  //   Last training day → always long run (LSD long)
  //   Day before last   → always easy (never consecutive hard)
  //   First day         → easy or CHI
  //   Middle days       → INT and CHI distributed
  //   Never two consecutive hard sessions (CHI or long)

  // protectInt: speed-responsive run goals (pace/5K/10K) need an interval day to
  // function — the pace-target progression only renders on INT sessions. At 3 days
  // we swap the tempo (CHI) slot for an interval so easy/int/long is preserved with
  // no doubling-up. At 1-2 days we deliberately DON'T force it (that would mean two
  // quality days with no easy base) — the caller warns the user to add a day instead.
  // ── V115: THE COMPRESSED QUALITY SLOT IS PERIODIZED ─────────────────────────
  // At 3 run days there is room for exactly ONE quality session, and the row below is
  // the only one in this table with no doctrinal source — NSW's weekly template is FOUR
  // sessions (2 LSD + 1 Long Interval + 1 Short Interval), so nDays===4 is a direct
  // transcription and nDays===3 sits below the template's floor. It was filled with
  // "protectInt decides which one survives", which is a coin flip encoded as a boolean,
  // and the boolean was `isSpeedGoal` — a predicate written to answer a DIFFERENT
  // question (is this goal about getting faster?) and reused to answer this one.
  //
  // Both source doctrines treat INT and CHI as sequenced, not interchangeable. NRC's 5K
  // and 10K plans run intervals/fartlek through the front half and introduce tempo at
  // 50-62% through the block, keeping it every week thereafter. Intervals build top-end
  // speed and economy; threshold converts that into a pace that holds on the day. So the
  // single slot is INT early and CHI late rather than one or the other for 12 weeks.
  // `qualityCrossoverWeek` is the crossover; the swap happens per-week at the call site,
  // because sportSessionTypes is built once and read inside the week loop.
  //
  // V205 (D122): THE CROSSOVER NO LONGER REACHES THE PACE FAMILY. The paragraph above is
  // NRC reasoning, and it leaked onto an NSW goal. Guide B is explicit that CHI and INT
  // both begin at Week 1, and Guide A's p.13 and p.16 tables both start at week 1: on a
  // test goal there is no phase split to periodize. The compression existed only because
  // three run days left room for exactly ONE quality slot; D113 above gives the three-run
  // week both, so on this goal the compression has nothing left to compress and the
  // `_compressedQuality` seam is gated off it below.
  //
  // The machinery is FORKED, not deleted, and its remaining job is not NRC. NRC run goals
  // never reach `_compressedQuality` at all — `isNRC` takes them down the getNRCSessionTypes
  // branch before this table is consulted, so no NRC program has ever set `_qslot`. What is
  // left is swim_500_time and swim_100_time at exactly three swim days: `isSpeedGoal`
  // carries both, neither is in PACE_GOALS, and neither ruling touches swimming. That is
  // the live consumer, and it is why this function stays.
  function qualityCrossoverWeek(totalWeeks: number | null | undefined): number{
    // First CHI week. NRC 5K crosses at 5-of-8 (62%), 10K at 4-of-8 (50%); 0.55 splits
    // them. A 12-week block runs INT weeks 1-6, CHI weeks 7-12. Floor of 3 so a short
    // block still gets a real interval phase before the switch.
    return Math.max(3, Math.ceil((totalWeeks||6) * 0.55));
  }
  function getSessionTypes(nDays: number, protectInt: boolean, baseMode: boolean, thresholdGoal: boolean, paceFam: boolean): string[] {
    if(nDays <= 0) return [];
    // AEROBIC BASE MODE (run_base): true base-building is ~80%+ easy aerobic volume.
    // No hard interval work, no double hard days. The aerobic engine is built on easy
    // mileage; at most ONE light tempo day for a touch of variety. This is the Lydiard /
    // 80-20 philosophy — speed work belongs in a later, race-specific block, not here.
    if(baseMode) {
      if(nDays === 1) return ['lsd_long'];
      if(nDays === 2) return ['lsd_easy','lsd_long'];
      if(nDays === 3) return ['lsd_easy','lsd_easy','lsd_long'];
      if(nDays === 4) return ['lsd_easy','lsd_easy','chi','lsd_long']; // 1 light tempo
      if(nDays === 5) return ['lsd_easy','lsd_easy','chi','lsd_easy','lsd_long'];
      if(nDays === 6) return ['lsd_easy','lsd_easy','chi','lsd_easy','lsd_easy','lsd_long'];
      return ['lsd_easy','lsd_easy','chi','lsd_easy','lsd_easy','lsd_easy','lsd_long'];
    }
    if(nDays === 1) return ['lsd_long'];
    // TWO DAYS ON A THRESHOLD GOAL (V122). The generic 2-day answer is two aerobic rides,
    // which is right for a volume goal (bike_50, bike_century) where the event IS distance
    // and the block runs alongside lifting and running. It is indefensible for bike_ftp,
    // whose entire premise is threshold work: that goal could land on 2 days any time
    // another sport shared the week, and the athlete then got Zone 2 for the whole block
    // and never once rode at threshold. The EASY day yields the slot, not the long ride —
    // the long ride is the aerobic anchor and giving that up to buy intervals trades the
    // base away for the quality it is supposed to support. (Mario's call, V122.)
    if(nDays === 2) return thresholdGoal ? ['int','lsd_long'] : ['lsd_easy','lsd_long'];
    // V205 (D113): THE THREE-RUN PACE WEEK IS INT / CHI / LONG. Under D125's amended
    // ceiling three runs is no longer the pace family's only shape, it is the FALLBACK
    // shape for the 14 four-training-day calendars that cannot hold four runs without a
    // collision. Those athletes must not also lose the second quality session, so the
    // easy LSD yields the slot rather than one of the two qualities. Guide B: "You should
    // always begin CHI and INT portions of the program at Week 1" — both run every week,
    // from week 1, at every day count the pace family can reach. The easy run is aerobic
    // volume and is the cheapest thing in the week to drop; dropping a quality day is
    // what the old row did and it is what D122 retires. Non-pace goals keep the old
    // protectInt coin flip: swim_500_time and swim_100_time are the only other goals that
    // reach the protectInt arm, they are outside both rulings, and their single quality
    // slot is still periodized by the crossover below.
    if(nDays === 3) return paceFam ? ['int','chi','lsd_long']
                   : (protectInt ? ['lsd_easy','int','lsd_long'] : ['lsd_easy','chi','lsd_long']);
    if(nDays === 4) return ['lsd_easy','int','chi','lsd_long'];
    // NSW doctrine: exactly 1 INT + 1 CHI per week — extra days add LSD VOLUME, not more
    // quality (Table 7 scales up by adding easy/long mileage). INT and CHI are spaced by
    // an easy day so two hard sessions never land back-to-back; the long run stays last.
    if(nDays === 5) return ['lsd_easy','int','lsd_easy','chi','lsd_long'];
    if(nDays === 6) return ['lsd_easy','int','lsd_easy','chi','lsd_easy','lsd_long'];
    return ['lsd_easy','int','lsd_easy','chi','lsd_easy','lsd_easy','lsd_long'];
  }

  // ── DAY ALLOCATION (goal-aware) ──
  // Counts come from the shared sportDayTargets helper (same one the nudge uses).
  // A speed/pace run goal makes 'run' primary so it can claim its interval block.
  // V205 (D132): the injury plan is read here, once, and only its cardioMode crosses the
  // call. injuryPlan is a pure function of cfg and builds a fresh object every time, so
  // this reads cfg and mutates nothing.
  const _d132Plan = injuryPlan(cfg);
  // V213 (D113a amended): THE EXCLUSION KEY, READ ONCE. These four cardio modes are the
  // injury sweeps that rewrite every run in the week (injuryPlan / injurySweepCardio), so
  // no run keeps its quality and there is nothing for the D113 row or the placement
  // chooser to space. Excluded builds keep the V212 layout byte for byte. halfstep and
  // swimout rewrite some runs, not all, and stay routed. Passed to the chooser as a
  // parameter, never read from a closure.
  const _d113Excl = !!(_d132Plan && ['noimpact','noimpact_swim','easy','reduce'].includes(_d132Plan.cardioMode!));
  const _alloc = sportDayTargets(cardioTypes, cardioGoals, cardioTrainDays.length, cfg.goal, _d132Plan && _d132Plan.cardioMode);   // V187 (F2): resolved lift goal; V205 (D132): cardioMode
  const primarySport = _alloc.primary;

  // dayToSport is the single source of truth — both the per-sport day lists AND the
  // scheduling loop below read from it, so the session-type map can never desync from
  // the actual day assignment.
  const dayToSport: (CardioType | null)[] = [];
  // V153 (F1): when the spacing-aware chooser ran, it fixes type→day; null otherwise.
  let _nrcPlan: Record<string, string> | null = null;
  // V213 (D146): true when the multi-sport placement below handed the run days to the
  // spacing chooser. spaceHardCardio reads it and leaves that run layout alone.
  let _msFlag = false;
  // V213 (D113a): true when the chooser's three-run fallback fired (easy / INT / long).
  // Read by _compressedQuality so the fallback week keeps the V115 crossover.
  let _d113Fb = false;
  if(baseCardioPlan) {
    // Base cardio: use the hand-built map directly. No sportDayTargets, no greedy loop.
    baseCardioPlan.dayToSport.forEach(sport => dayToSport.push(sport));
  } else if(cardioTypes.length === 1) {
    // SOLO SPORT: honor the per-sport ceiling from _alloc.targets instead of claiming
    // every training day. Place the capped number of cardio sessions spread evenly across
    // the week (first + last slots always used so the long session lands on the last day),
    // and leave the remaining training days cardio-free → they render as lift-only days.
    const solo = cardioTypes[0];
    const nCardio = cardioTrainDays.length;
    let capDays = Math.min(_alloc.targets[solo] || nCardio, nCardio);
    const chosen = new Set<number>();
    // V153 (F1): NRC run goals route through the spacing-aware chooser whenever the day
    // count is capped below the week — the only case where a choice exists at all.
    const _soloRunGoal = solo==='run' && cardioGoals['run'] && cardioGoals['run'].id;
    const _nrcCapped = NRC_GOALS.has(_soloRunGoal) && capDays<nCardio && capDays>=2;   // V186: all four NRC goals
    // V205 (D125): same gate for the NSW pace family. Capped below the week is still the
    // only case where a choice exists; run_base and every bike/swim goal keep the
    // even-spread fallback below, untouched.
    // V205 (D125 amended): the pace gate is <= nCardio, not < nCardio. With the ceiling
    // at 4 a four-training-day week has capDays === nCardio and its day SET is forced, but
    // the long run's slot is not, and on a forced day set that permutation is the only
    // lever that reaches coll==0. Routing it to the even-spread fallback instead would
    // deal the table row blind and ship the collisions D125 exists to remove. NRC keeps
    // the strict < nCardio gate above: its subset and permutation pins leave a forced day
    // set with nothing to choose.
    const _paceCapped = PACE_GOALS.has(_soloRunGoal) && capDays<=nCardio && capDays>=2;
    if(_nrcCapped || _paceCapped){
      let _pick = _nrcSpacedRunDays(cardioTrainDays, capDays, _soloRunGoal, _paceCapped, undefined, _d113Excl, cfg.experience);
      // V205 (D125 amended, RE-KEYED BY D130): THE CONDITIONAL CEILING, DECIDED HERE.
      // Four runs ship only where the chooser hands back a layout with zero UNTOLERATED
      // hard-day adjacencies. Where it cannot, the week drops to three runs and is re-laid
      // at three. The shape of the ruling is unchanged — a crowded four-run week is worse
      // coaching than a clean three-run one — but D130 says what crowded means: a CHI on
      // the long run's eve is not crowding, and the total this line used to read could not
      // tell the two apart. Keyed on the chooser's return alone; there is no day-count
      // conjunct, and every count from 4 to 7 is asked the same question.
      // HISTORY, AND IT MATTERS. Under the unsplit total, 50 of the 64 rest-day calendars
      // reached coll==0 at four and 14 fell through here to three runs. Under the split,
      // untolerated is 0 on ALL 64 and the fallback fires on NONE of them: the 14 now ship
      // four runs paying exactly one tolerated CHI-on-eve, and the 50 are byte-identical
      // to what they shipped before, because {coll==0} and {untol==0 and tol==0} select
      // the same candidate. The branch stays live — it still guards a chooser that returns
      // nothing and any future calendar shape that cannot reach untol==0.
      if(_paceCapped && capDays > 3 && (!_pick || _pick.untol > 0)){
        capDays = 3;
        _pick = _nrcSpacedRunDays(cardioTrainDays, capDays, _soloRunGoal, _paceCapped, undefined, _d113Excl, cfg.experience);
      }
      if(_pick){
        _pick.idxs.forEach(i=>chosen.add(i));
        _nrcPlan = _pick.typeOf;   // read by the NRC type-assignment loop below
        _d113Fb = !!_pick._fbFired;   // V213 (D113a): the fallback week keeps the V115 crossover
      } else {
        // Unreachable on the pace arm (every subset is legal there, so `best` is always
        // set) and unreachable on NRC at capDays>=2. Kept so a future arm that can return
        // null degrades to the even-spread fallback instead of throwing.
        for(let k = 0; k < capDays; k++) chosen.add(Math.round(k * (nCardio - 1) / (capDays - 1)));
      }
    } else if(capDays >= nCardio) {
      cardioTrainDays.forEach((_, i) => chosen.add(i));
    } else if(capDays === 1) {
      chosen.add(nCardio - 1); // single session is the long day → place it last
    } else {
      for(let k = 0; k < capDays; k++) chosen.add(Math.round(k * (nCardio - 1) / (capDays - 1)));
    }
    cardioTrainDays.forEach((_, i) => dayToSport.push(chosen.has(i) ? solo : null));
  } else if(!primarySport) {
    // Unchanged behavior: flat even round-robin in selection order
    cardioTrainDays.forEach((d, i) => dayToSport.push(cardioTypes[i % cardioTypes.length]));
  } else {
    // Greedy "furthest behind quota" spread keeps each sport's days distributed across
    // the week instead of clustered. Iterate primary-first so ties resolve in its favor.
    // Recovery-aware budget: leg sports share, swim adds on top, lifting floor reserved
    // (tactical/endurance stays uncapped). Greedy then spreads within these targets.
    const targets = multiSportTargets(cardioTypes, _alloc.targets, cfg, cardioTrainDays.length);
    const secondaries = cardioTypes.filter(t => t !== primarySport);
    const iterOrder = [primarySport, ...secondaries];
    const assigned: Record<string, number> = {}; cardioTypes.forEach(t => assigned[t] = 0);
    for(let i = 0; i < cardioTrainDays.length; i++) {
      let pick: CardioType | null = null, bestScore = -1;
      for(const t of iterOrder) {
        const left = (targets[t] || 0) - assigned[t];
        if(left <= 0) continue;
        const score = left / Math.max(targets[t], 1);
        if(score > bestScore) { bestScore = score; pick = t; }
      }
      // Every sport is at its ceiling quota → leave this day cardio-free (lift-only)
      // rather than force-stacking another cardio session. Makes the ceilings a real cap.
      if(!pick) { dayToSport.push(null); continue; }
      dayToSport.push(pick); assigned[pick]++;
    }
    // V213 (D113a amended / D146): THE RUN DAYS ARE PLACED BY THE SPACING CHOOSER. The
    // greedy spread above counts sessions per sport and is blind to which run is hard, so
    // on a multi-sport week it could put the long run beside a quality run. The quota it
    // dealt is kept: the same number of run days, re-sited by _nrcSpacedRunDays, and every
    // other sport keeps its order across the days the runs did not take. Pace routes from
    // three runs up, NRC from two runs up, and neither under an exclusion-key injury (V213
    // slice 2c, coach: those modes rewrite every run, so there is nothing left to space).
    { const _msG = cardioTypes.includes('run') && cardioGoals.run && cardioGoals.run.id; const _msPace = PACE_GOALS.has(_msG);
      const _k = dayToSport.filter(s => s === 'run').length;
      if(((_msPace && !_d113Excl && _k >= 3) || (NRC_GOALS.has(_msG) && !_d113Excl && _k >= 2)) && !isBaseCardio){ const _pk = _nrcSpacedRunDays(cardioTrainDays, _k, _msG, _msPace, undefined, undefined, cfg.experience);
        if(_pk){ const _oth = dayToSport.filter(s => s !== 'run'); const _ix = new Set(_pk.idxs); let _o = 0;
          for(let i = 0; i < dayToSport.length; i++) dayToSport[i] = _ix.has(i) ? 'run' : _oth[_o++]; _nrcPlan = _pk.typeOf; _msFlag = true; _d113Fb = !!_pk._fbFired; } } }
  }

  // Derive per-sport day lists from the authoritative allocation
  const sportDayIndices: Record<string, number[]> = {}; // {run: [0,3,5], bike: [1,4], swim: [2]}
  dayToSport.forEach((sport, dayIdx) => {
    if(!sport) return; // null = cardio-free day → stays lift-only
    if(!sportDayIndices[sport]) sportDayIndices[sport] = [];
    sportDayIndices[sport].push(dayIdx);
  });

  // Build session type map per sport based on its own day count
  const sportSessionTypes: Record<string, any> = {};
  // ── V153 (F1): SPACING-AWARE NRC RUN-DAY SELECTION ────────────────────────────
  // The even-spread day chooser is collision-blind: on a Mon/Tue/Thu/Fri/Sat athlete it
  // picked {mon,tue,fri,sat}, the one 4-of-5 subset on which NO permutation of the NRC
  // types can avoid a hard back-to-back (speed2 landed the day before the long — a layout
  // Nike's own plans never print). spaceHardCardio then had an unsolvable board: it can
  // permute TYPES within chosen days but can never revisit the day choice itself.
  // This chooser selects days and types JOINTLY, before anything downstream reads them:
  // hard adjacency is scored on the real calendar (rest days break pairs, same circular
  // distance as spaceHardCardio), the long run stays the last run day of the week (the
  // engine's own convention), and ties prefer speed sessions that ride a rest day and a
  // recovery run padding the long — both straight from the NRC plans' printed shape.
  // NRC content is untouched: sessions still come verbatim from the tables (§NRC contract);
  // only WHICH weekday carries which slot changes. Deterministic: fixed enumeration order,
  // no seed. Returns null when no layout beats a collision-free bar is not required —
  // the best layout is returned even if imperfect, since it is never worse than even-spread.
  // V205 (D125): THE PACE FAMILY IS NOW ROUTED HERE TOO. V153 withheld this chooser from
  // non-NRC goals "for no measured defect". There is one. The even-spread chooser picks
  // days by spacing alone and never revisits the choice, so at a four-day ceiling 5,775
  // of 5,775 four- and five-day weeks put two hard sessions back to back, and the
  // permutation oracle proves 0 of them are fixable by re-ordering types on the same
  // days — spaceHardCardio is handed a board with no legal move. The pace family takes
  // the FULL objective, not a collision-only variant: types come from getSessionTypes
  // (the NSW table) instead of the NRC tables, and the four scored terms below read the
  // NSW tokens. Lift cost does not enter here; the shape is run layout first, lift
  // placement second, which is what the NRC path already does.
  //
  // ONE DIFFERENCE, AND IT IS DOCTRINE. For NRC the long run is PINNED to the last
  // training day of the week: a race plan has a race day and the long run rehearses it.
  // A test goal has no race day, and a long run followed by two rest days is coaching-
  // good, so for the pace family the long run is a PREFERENCE ranked second, under
  // collisions. That relaxation is what buys a collision-free week on the mon+tue,
  // mon+thu, wed+thu, mon+tue+thu and mon+wed+thu calendars. NRC behaviour is unchanged:
  // its subset and permutation constraints still force longLast to 1 on every candidate,
  // so the new term is constant there and cannot reorder an NRC choice.
  // V213 (D113a): `_fb` asks for the fallback three-run row (easy / INT / long) and is only
  // ever passed by the chooser's own fallback below. `_excl` is the exclusion key read once
  // in buildCardioProgression (`_d113Excl`); under it the pace arm reads the V212 row, not
  // the D113 row.
  // v0.243.0 (D243): `_exp` is the athlete's experience, which picks the NRC row (one speed slot or two). A parameter,
  // never a closure, for the same reason.
  function _nrcSpacedRunDays(cardioTrainDays: DayKey[], capDays: number, goalId: unknown, paceFam: boolean, _fb?: boolean, _excl?: boolean, _exp?: Experience | null): NrcPick | null{
    const types = paceFam ? (_fb ? ['lsd_easy','int','lsd_long'] : getSessionTypes(capDays, isSpeedGoal(goalId), false, false, !_excl))
                          : getNRCSessionTypes(capDays, goalId, _exp);
    // The objective is written once, in tokens. The NSW table's quality pair is INT then
    // CHI, which is the same sequence NRC prints as speed1 then speed2.
    const T = paceFam
      ? {long:'lsd_long', rec:'lsd_easy',       s1:'int',        s2:'chi'}
      : {long:'nrc_long', rec:'nrc_recovery',   s1:'nrc_speed1', s2:'nrc_speed2'};
    const HARD = new Set([T.s1, T.s2, T.long]);
    const pos: (d: DayKey) => number = d => ALL_DAYS_ORDER.indexOf(d);
    const circ = (a: DayKey,b: DayKey)=>{ const r=Math.abs(pos(a)-pos(b)); return Math.min(r,7-r); };
    const prevDay: (d: DayKey) => DayKey = d => ALL_DAYS_ORDER[(pos(d)+6)%7];
    const inTrain = new Set(cardioTrainDays);
    const n = cardioTrainDays.length;
    // V205 (D129): THE EVEN-SPREAD SUBSET, RECOMPUTED HERE VERBATIM. This is the exact
    // arithmetic the fallback chooser in the caller runs when a goal is not routed here.
    // It is not a tiebreak the athlete can see; it is the layout he ALREADY HAS. Routing
    // the pace family through this chooser (D125) replaced a pure spacing rule with a
    // four-term objective, and the spacing term went implicit. Rank 6 puts it back as
    // identity: when several layouts tie on every ruled term, the one already on his
    // calendar wins, so a tie never moves a live week. Rank 7 below scores spread as a
    // metric for the ties this subset is not in. Keep the two arms in this order.
    const _evenIdx = (function(){
      const s = new Set<number>();
      if(capDays <= 1) s.add(n - 1);
      else for(let k = 0; k < capDays; k++) s.add(Math.round(k * (n - 1) / (capDays - 1)));
      return Array.from(s).sort((a,b)=>a-b);
    })();
    const _evenKey = _evenIdx.join(',');
    // subsets of size capDays (indices into cardioTrainDays), lexicographic.
    // THE LAST TRAIN DAY IS ALWAYS IN THE SUBSET: the long run lives late in the week
    // (engine convention, NRC convention, race-day rhythm) — the chooser may not trade
    // the weekend long away to buy a tiebreak. Measured before this constraint: a
    // marathon-on-5-days config moved its long run to Friday to put speed after a rest
    // day, which is the wrong trade.
    // V205 (D125): the pin above is NRC-only. For the pace family every subset is legal
    // and "long on the last training day" is scored instead (longLast, rank 2).
    const subsets: number[][] = [];
    (function sub(start: number, acc: number[]){
      if(acc.length===capDays){ if(paceFam || acc[acc.length-1]===n-1) subsets.push(acc.slice()); return; }
      for(let i=start;i<n;i++){ acc.push(i); sub(i+1,acc); acc.pop(); }
    })(0,[]);
    // permutations of types
    const perms: string[][] = [];
    (function perm(rem: string[], pre: string[]){
      if(!rem.length){ perms.push(pre.slice()); return; }
      for(let i=0;i<rem.length;i++){ pre.push(rem[i]); perm(rem.slice(0,i).concat(rem.slice(i+1)), pre); pre.pop(); }
    })(types.slice(), []);
    let best: NrcPick | null = null;
    for(const idxs of subsets){
      const days = idxs.map(i=>cardioTrainDays[i]);
      const lastDay = days[days.length-1]; // idxs ascend, cardioTrainDays is week-ordered
      for(const p of perms){
        // long run must be the LAST run day — which the subset constraint above pins to
        // the last TRAIN day of the week.
        // V205 (D125): NRC pins the long run to the last CHOSEN run day, which the subset
        // rule above pins in turn to the last training day. The pace family carries neither
        // pin. Both were one constraint doing one job — put the long at the end of the week —
        // and a test goal has no race day to end the week on. Dropping the permutation rule
        // as well as the subset rule is what reaches coll=0 on a four-training-day week,
        // where the day set is forced and the long run's slot is the only lever left. The
        // preference is scored below as longLast, at rank 2, under collisions.
        if(!paceFam && p.includes(T.long) && p[p.length-1] !== T.long) continue;
        const typeOf: Record<string, string> = {}; days.forEach((d,i)=>typeOf[d]=p[i]);
        const hardDays = days.filter(d=>HARD.has(typeOf[d]));
        // V205 (D130 amended): RANK 1 IS SPLIT, AND ON THE PACE FAMILY ONLY. Two hard
        // days on adjacent days are not one thing. CHI on the EVE of the long LSD is
        // TOLERATED: the long run is relative recovery under Guide A p.11 and not a hard
        // day, which is this engine's own earlier ruling, so a tempo the day before it is
        // a legal pairing and not a collision to design out. Every other adjacency stays
        // UNTOLERATED and must be ZERO — INT beside CHI, INT beside the long either way,
        // and any quality session the day AFTER the long run. Untolerated is rank 1;
        // tolerated is rank 1b, minimised and never traded for a worse untolerated count.
        // Measured on the counterfactual: untolerated reaches 0 on all 64 rest-day
        // calendars, 14 of them pay exactly one tolerated CHI-on-eve, and (0,1) is the
        // FLOOR on those 14 — not an aspiration. The other 50 land (0,0).
        // NRC IS UNTOUCHED BY CONSTRUCTION: off the pace arm untol is coll and tol is a
        // constant 0, so the rank key below is the shipped key with a constant spliced in.
        const _longD = days.find(d=>typeOf[d]===T.long);
        let coll = 0, _untol = 0, _tol = 0;
        for(let a=0;a<hardDays.length;a++) for(let b=a+1;b<hardDays.length;b++){
          if(circ(hardDays[a],hardDays[b])!==1) continue;
          coll++;
          const _x = hardDays[a], _y = hardDays[b];
          // Tolerated is a TYPED pair, not a position: s2 (CHI) sitting on prevDay of the
          // long run. prevDay is circular, so a Saturday CHI into a Sunday long counts and
          // a Sunday CHI after a Saturday long does not.
          const _chiEve = !!_longD && ((typeOf[_x]===T.s2 && _y===_longD && _x===prevDay(_longD))
                                    || (typeOf[_y]===T.s2 && _x===_longD && _y===prevDay(_longD)));
          if(_chiEve) _tol++; else _untol++;
        }
        const untol = paceFam ? _untol : coll;
        const tol   = paceFam ? _tol   : 0;
        const speeds = days.filter(d=>typeOf[d]===T.s1||typeOf[d]===T.s2);
        const speedsAfterRest = speeds.filter(d=>!inTrain.has(prevDay(d))).length;
        const longDay = days.find(d=>typeOf[d]===T.long);
        // V205 (D129): THE LENS IS FORKED, AND ONLY THE PACE ARM IS CORRECTED.
        // `pos(d)<pos(longDay)` reads a CIRCULAR week through a Sunday-first linear list,
        // so a Sunday easy run scores as padding a Saturday long run — the day AFTER it.
        // prevDay above is circular-correct, and `d===prevDay(longDay)` is what "a recovery
        // run the day before the long" actually means. NRC KEEPS THE SHIPPED PREDICATE by
        // ruling: the term decides 593 of 804 NRC chooser rows, and correcting it there
        // moves 182 of 804 rows and 54 of 112 built programs, 3 of which relocate the long
        // run itself. That is a re-ruling of NRC layout, not a bug fix, and it is unruled.
        const recBeforeLong = longDay && days.some(d=>typeOf[d]===T.rec && (paceFam
          ? d===prevDay(longDay)
          : (circ(d,longDay)===1 && pos(d)<pos(longDay)))) ? 1 : 0;
        // Rank 2. Always 1 on the NRC path (the subset and permutation rules above make
        // it so), a real preference on the pace family.
        const longLast = (!longDay || longDay===cardioTrainDays[n-1]) ? 1 : 0;
        const s1 = days.find(d=>typeOf[d]===T.s1), s2 = days.find(d=>typeOf[d]===T.s2);
        // UNMEASURED, UNRULED, DELIBERATELY LEFT ALONE (V205, D129). This line is a
        // SIBLING of the recBeforeLong lens defect corrected above: `pos(s1)<pos(s2)` also
        // reads a circular week through the Sunday-first ALL_DAYS_ORDER, so "speed1 comes
        // before speed2" is measured from Sunday rather than from the athlete's own week.
        // Nobody has measured what correcting it would move on either arm. Do not read its
        // survival here as evidence it was considered and cleared. It was not.
        const canonical = (s1 && s2 && pos(s1)<pos(s2)) ? 1 : 0;
        // V205 (D129), rank 6 — IDENTITY. The subset the even-spread fallback would have
        // picked. Below every ruled term, so it can never buy a worse week; above spread,
        // so a tie never moves days an athlete is already training on.
        // paceFam-gated, and that is the whole point: identity protects the layout the
        // even-spread fallback gave THIS athlete, and only the pace family ever had one.
        // Left live on the NRC arm it moved 168 of 804 NRC chooser rows (measured).
        const identity = (paceFam && idxs.join(',') === _evenKey) ? 1 : 0;
        // V205 (D129), rank 7 — SPREAD, as a metric and not a constant. The longest
        // run-free stretch on the real circular week, negated so shorter wins. This is the
        // term that decides ties the athlete's current subset is not in, and it is what
        // keeps enumeration order out of the decision.
        const _p = days.map(pos).sort((a,b)=>a-b);
        let _longestFree = 0;
        for(let i=0;i<_p.length;i++){
          const nxt = (i+1<_p.length) ? _p[i+1] : _p[0]+7;
          const gap = nxt - _p[i] - 1;
          if(gap > _longestFree) _longestFree = gap;
        }
        // paceFam-gated for the same reason: NRC's subset and permutation pins already
        // fix its day set, and a spread term there is a new preference nobody ruled on.
        const spread = paceFam ? -_longestFree : 0;
        // V205 (D129 addendum), rank 8 — REST INTO THE LONG RUN. Among layouts still
        // tied after spread, the one whose LAST quality session sits furthest before the
        // long run wins. The reason is coaching, not tidiness: freshest legs into the
        // week's longest run. Read circularly, backwards from the long day, so the LAST
        // quality session is the one with the smallest backward distance, and the term
        // maximises that distance. This is what "earliest quality day" was reaching for,
        // stated on the session that actually matters.
        let _qualRest = 0;
        if(longDay){
          let _nearest = 7;
          days.forEach(d=>{
            if(typeOf[d]!==T.s1 && typeOf[d]!==T.s2) return;
            const back = (pos(longDay)-pos(d)+7)%7;
            if(back < _nearest) _nearest = back;
          });
          if(_nearest < 7) _qualRest = _nearest;
        }
        // paceFam-gated like ranks 6 and 7 until v0.244.0. D244 (Mario) rules it on the NRC arm
        // too, and higher: the long run is the race rehearsal, so the week's last quality session
        // sits as far before it as the collision terms allow (rank 3 on NRC, below the long-run pin).
        const qualRest = _qualRest;
        // V205 (D129 addendum), rank 9 — EARLIEST FIRST QUALITY DAY. Below rank 8, and
        // already implied by canonical; written out so it is a rank rather than an
        // accident of enumeration. days ascends in week order, so the first quality
        // session in it is the earliest one. Negated so earlier wins. paceFam-gated.
        const _firstQual = days.find(d=>typeOf[d]===T.s1||typeOf[d]===T.s2);
        const qualFirst = (paceFam && _firstQual) ? -pos(_firstQual) : 0;
        const cand = {idxs, typeOf, coll, untol, tol, longLast, speedsAfterRest, recBeforeLong, canonical, identity, spread, qualRest, qualFirst};
        // Objective order, highest first: fewest collisions, long on the last training
        // day, speeds after a rest day, a recovery run padding the long, canonical
        // speed order, the athlete's existing even-spread subset, the tightest spread,
        // the longest rest into the long run, then the earliest first quality day.
        // Ties keep the incumbent, so enumeration order is the last tiebreak and the
        // chooser stays deterministic with no seed — but ranks 6 and 7 pin the DAY SET
        // and ranks 8 and 9 pin the types on it, so enumeration order never decides
        // which days an athlete trains on.
        // V205 (D130 amended): rank 1 is -untol, rank 1b is -tol. Ranks 2..9 are
        // unchanged and keep their shipped order. -c.coll is GONE from the key: a
        // total that mixes a tolerated pair with an untolerated one cannot rank them.
        // v0.244.0 (D244, Mario): THE KEY IS SPLIT BY ARM. On NRC, rest into the long run is rank 3,
        // under the collisions and the long-run pin and above speeds after a rest day and the
        // recovery run padding the long. The pace family keeps its ruled order (D129) byte for byte.
        const _rank: (c: NrcPick) => number[] = paceFam
          ? c => [-c.untol, -c.tol, c.longLast, c.speedsAfterRest, c.recBeforeLong, c.canonical, c.identity, c.spread, c.qualRest, c.qualFirst]
          : c => [-c.untol, -c.tol, c.longLast, c.qualRest, c.speedsAfterRest, c.recBeforeLong, c.canonical, c.identity, c.spread, c.qualFirst];
        if(!best) best = cand;
        else {
          const ka = _rank(cand), kb = _rank(best);
          for(let i=0;i<ka.length;i++){ if(ka[i]!==kb[i]){ if(ka[i]>kb[i]) best = cand; break; } }
        }
      }
    }
    // V213 (D113a): THE SPACER FALLBACK. Three pace runs as INT / CHI / long need three
    // days no two of which put hard beside hard, and 7 of the 35 three-day calendars have
    // no such layout. There the week keeps the V212 shape, easy / INT / long, and the one
    // quality slot crosses INT to CHI at the V115 crossover. The flag rides on the RETURNED
    // object, never on a closure, so a gate that lifts this function into a bare VM runs it.
    if(paceFam && capDays === 3 && !_fb && best && best.untol > 0){ const _alt = _nrcSpacedRunDays(cardioTrainDays, capDays, goalId, paceFam, true, _excl, _exp); if(_alt){ _alt._fbFired = true; return _alt; } }
    return best; // {idxs:[...], typeOf:{dayKey:type}, ...} — never null for capDays≥1
  }

  // V186: NRC_GOALS is module-scoped (next to the tables) so the spacing chooser above
  // and the session dispatch below read the same set.
  cardioTypes.forEach(type => {
    const sportDays = sportDayIndices[type] || [];
    const goalId = cardioGoals[type] && cardioGoals[type].id;
    const isNRC = type === 'run' && NRC_GOALS.has(goalId);
    if(isNRC) {
      // NRC engine: marathon = 1 speed + 3 recovery + 1 long; 5K/10K/half = 2 speed + 2 recovery + 1 long for an
      // advanced athlete, 1 speed + 3 recovery + 1 long for everyone else (v0.243.0, D243)
      const nrcTypes = getNRCSessionTypes(sportDays.length, goalId, cfg.experience);
      // Track which recovery-run slot each day is, so each pulls a distinct duration
      let recCounter = 0, recAllCounter = 0, hasSpeed2 = false;
      sportDays.forEach((globalDayIdx, sportIdx) => {
        // V153 (F1): the chooser's joint day+type plan wins when present — the fallback
        // list order stands for uncapped weeks and the marathon 5-type layouts it built.
        const t = (_nrcPlan && _nrcPlan[cardioTrainDays[globalDayIdx]]) || nrcTypes[sportIdx] || 'nrc_long';
        sportSessionTypes[globalDayIdx + '_' + type] = t;
        if(t === 'nrc_recovery') {
          sportSessionTypes[globalDayIdx + '_' + type + '_recIdx'] = recCounter++;
        }
        // V186 (F4): ordinal among recovery AND speed2 days, in calendar order — read only
        // on single-speed weeks, where the speed2 day becomes a recovery run.
        if(t === 'nrc_recovery' || t === 'nrc_speed2') {
          sportSessionTypes[globalDayIdx + '_' + type + '_recIdxAll'] = recAllCounter++;
        }
        if(t === 'nrc_speed2') hasSpeed2 = true;
      });
      // V171 (D4c): the layout is program-constant, so the recovery slot count and the
      // presence of a second speed slot are known once here and read by every week.
      sportSessionTypes[type + '_recSlots'] = recCounter;
      sportSessionTypes[type + '_hasSpeed2'] = hasSpeed2;
    } else {
      const protectInt = isSpeedGoal(goalId);
      const baseMode = goalId === 'run_base';
      // Deliberately NOT folded into isSpeedGoal. That predicate also drives tapering, day
      // allocation and primary-sport selection in six other places; adding bike_ftp to it
      // would reach all of them and would also flip the 3-day bike answer. This is the
      // narrow statement: bike_ftp is a threshold goal, and that fact is needed HERE only.
      const thresholdGoal = goalId === 'bike_ftp';
      // V205 (D113/D122): the NSW pace family, named by the same set the ceiling and the
      // chooser gate read, so the table row, the conditional fourth run and the spacing
      // chooser cannot disagree about who is a pace athlete. run_mile_time and
      // run_15_under10 are aliased to run_pace_goal before the engine sees a goal id; the
      // set carries all three so a future un-aliasing cannot silently drop them.
      // V213 (D113a): not a pace session for the D113 row under the exclusion key. Those
      // weeks keep the V212 row and the V115 crossover.
      const _paceSession = type === 'run' && PACE_GOALS.has(goalId) && !_d113Excl;
      const types = getSessionTypes(sportDays.length, protectInt, baseMode, thresholdGoal, _paceSession);
      // V115: mark the ONE quality slot that exists only because 3 days forced a
      // compression. Tagged here, resolved per-week in the loop below. Deliberately NOT
      // set for baseMode (Lydiard block wants no hard work at all) or isBaseCardio (the
      // body-comp governor overwrites every slot to easy anyway).
      //
      // The predicate is DELIBERATELY WIDER than `protectInt`. `isSpeedGoal` omits
      // `run_mile_time` and `run_15_under10` while `isMilGoal` inside buildRunSession
      // includes them — two overlapping predicates that disagree about the same goals.
      // The consequence: a 1.5-mile-under-10 goal, the single most interval-dependent
      // goal in the app, fell to the non-protectInt row and got CHI for the whole block
      // with ZERO interval work. Same root cause as the bug this release fixes, mirrored.
      // Fixed here rather than by widening `isSpeedGoal`, which also drives program
      // length and the pace-chart anchor and would move unrelated output.
      // V126: the two legacy ids are aliased to run_pace_goal before the engine ever sees
      // them, so isSpeedGoal (and therefore protectInt) now covers them and the hand-written
      // exception that used to sit here is gone. Kept as a single term so the reason this
      // predicate exists at all is still legible.
      const _perfRun = type === 'run' && protectInt;
      // V205 (D122): `!_paceSession` is the fork. Without it the D113 row would be read
      // by the compression below and both quality days would collapse back to INT, which
      // is the phase split this ruling retires, restated. The conjunct is placed on the
      // FLAG rather than on the two reads of it downstream so there is one statement of
      // who is compressed, not two that can drift.
      // V213 (D113a): `|| _d113Fb` re-opens the fork for the chooser's fallback week. That
      // week is easy / INT / long with one quality slot, which is exactly what the V115
      // crossover exists to periodize, so the slot crosses INT to CHI there. This supersedes
      // the V205 notes that say `_qslot` is never set on a pace goal: it is, on a fallback week.
      const _compressedQuality = sportDays.length === 3 && !baseMode && !isBaseCardio
                                 && (!_paceSession || _d113Fb) && (protectInt || _perfRun);
      sportDays.forEach((globalDayIdx, sportIdx) => {
        const isLastSportDay = sportIdx === sportDays.length - 1;
        // V205 (D125): the chooser's joint day+type plan wins OUTRIGHT when it ran —
        // including over the last-day default. That default is the old pin restated, and
        // under D125 the pace family's long run may sit mid-week to buy a collision-free
        // one. Where the chooser did not run (run_base, bike, swim, uncapped weeks) the
        // default stands untouched and the long run is still the last session of the week.
        const _planned = _nrcPlan && _nrcPlan[cardioTrainDays[globalDayIdx]];
        let st = _planned || (isLastSportDay ? 'lsd_long' : (types[sportIdx] || 'lsd_easy'));
        // BODY-COMP GOVERNOR: force every cardio session to easy steady-state. No int,
        // no chi, no long-run leg fatigue — keep cardio purely as easy active recovery
        // so it never competes with hypertrophy. Even the "long" slot becomes easy.
        if(isBaseCardio) st = 'lsd_easy';
        // The compressed slot always STARTS as int — the crossover below turns it into
        // chi for the back half. Which one the table happened to deal is irrelevant once
        // the slot is periodized; what matters is that both phases exist.
        if(_compressedQuality && (st === 'int' || st === 'chi')) st = 'int';
        sportSessionTypes[globalDayIdx + '_' + type] = st;
        if(_compressedQuality && st === 'int') sportSessionTypes[globalDayIdx + '_' + type + '_qslot'] = 1;
      });
    }
  });

  // V115: space hard cardio days. Runs after every sport has its slots and before any
  // session is built, so the rewrite is invisible downstream — legLoad, freeze snapshots
  // and the lift deconflict passes all read the resulting sessions, not this map.
  // V213 (D146): a run week the chooser planned is already spaced on the real calendar.
  // Swapping its types here would undo the plan, so the run sport is skipped.
  spaceHardCardio(sportSessionTypes, sportDayIndices, cardioTrainDays, dayToSport, _msFlag ? 'run' : null);

  // ── V116: THE TAPER IS COMPUTED HERE, ONCE, FOR EVERY SPORT ─────────────────
  // §5 has claimed since V95 that taperWeeksFor is the single source of truth for taper
  // gating. It was not. It was computed inside buildRunSession and NOWHERE ELSE — bike
  // and swim never saw it, so a 50-mile build rode its longest ride of the entire block
  // in race week. Same defect V115 fixed for running, sitting untouched in two other
  // builders. Now computed once and handed down; buildRunSession reads what it is given
  // rather than recomputing, so the claim is finally true.
  //
  // NOTE: this deliberately does NOT carry programTaperWindow's `types.includes('run')`
  // gate. That gate means a bike-only or swim-only program never tapers at all, which is
  // wrong for cardio and is logged in §12 for the LIFTING wave, where changing it would
  // move barbell output on programs that have nothing to do with this fix.
  const _tapWks = taperWeeksFor(taperEventOn(cfg), isBaseCardio, tw);   // V186 (§4b)
  // step is 1-based within the taper window, 0 outside it. `of` lets each builder ramp
  // its own reduction across however many taper weeks the block earned.
  const _taperFor: (w: number) => TaperStep = w => ({ step: (_tapWks > 0 && w > tw - _tapWks) ? (w - (tw - _tapWks)) : 0, of: _tapWks });

  // V157→V159: strides ride the LAST easy run of each week; the benchmark takes the
  // first easy day of wk1 and the last easy day of the final week. V159 makes both
  // WEEK-AWARE — under the frequency plan the active day set changes by block third,
  // so "first" and "last" are computed against the week's ACTIVE days, not the static
  // map. Without the plan the helpers collapse to the V158 statics exactly.
  const _freq = baseCardioPlan && baseCardioPlan.freq;
  const _easyRunDaysAll = (() => {
    const out: number[] = [];
    Object.keys(sportSessionTypes).forEach(k => {
      const p = k.split('_');
      if(p.length === 2 && p[1] === 'run' && sportSessionTypes[k] === 'lsd_easy') out.push(+p[0]);
    });
    return out.sort((a,b) => a - b);
  })();
  const _activeEasyFor: (w: number) => number[] = w => _freq ? _easyRunDaysAll.filter(i => _freq.activeByWeek[w] && _freq.activeByWeek[w].has(i)) : _easyRunDaysAll;
  const _firstEasyFor: (w: number) => number = w => { const a = _activeEasyFor(w); return a.length ? a[0] : -1; };
  const _lastEasyFor: (w: number) => number  = w => { const a = _activeEasyFor(w); return a.length ? a[a.length - 1] : -1; };
  // V159 (D4b): the steady-slot arm returns, now REACHABLE — with the run_base ceiling
  // at 4, the unfrozen layout deals a chi day, and the V158 obligation lands here: the
  // benchmark takes the steady slot when one exists (its RPE-6 even effort IS a steady
  // session), first/last easy otherwise. This arm is gated, not decorative.
  const _chiRunDay = (() => {
    let m = -1;
    Object.keys(sportSessionTypes).forEach(k => {
      const p = k.split('_');
      if(p.length === 2 && p[1] === 'run' && sportSessionTypes[k] === 'chi') { const i = +p[0]; if(m === -1 || i < m) m = i; }
    });
    return m;
  })();
  const _benchDayFor: (w: number) => number = w => (_chiRunDay >= 0) ? _chiRunDay : ((w === 1) ? _firstEasyFor(w) : _lastEasyFor(w));

  // V140: per-sport ordinal (0-based) — dayIdx is the GLOBAL cardio index, so on a
  // multi-sport program the first BIKE day may sit at dayIdx 1 or 2 and any predicate
  // keyed on dayIdx===0 silently never fires for it (caught by the fuzz gate: 68
  // bike_ftp weeks with zero sweet-spot sessions). Same days repeat every week, so
  // the ordinal is per-day, computed once here, week-independent.
  const _sportOrd: Record<string, number> = {};
  cardioTrainDays.forEach((dayKey, dayIdx) => {
    const type = dayToSport[dayIdx];
    if(!type) { for(let w = 1; w <= tw; w++) schedule[w][dayKey] = null; return; } // lift-only day
    const sportOrdinal = (_sportOrd[type] === undefined) ? (_sportOrd[type] = 0) : (++_sportOrd[type]);

    const goal = cardioGoals[type];
    const _rawBaseline = parseFloat((goal?.baselineDist||'').toString()) || parseFloat((goal?.baseline||'').match(/([0-9.]+)/)?.[1]!) || 0;
    const _expBaseDefault = {beginner:1, intermediate:2, advanced:4}[cfg.experience||'intermediate'] || 2;
    const baselineMiles = _rawBaseline || _expBaseDefault;

    // Get session type from per-sport map
    const assignedTypeBase = sportSessionTypes[dayIdx + '_' + type] || 'lsd_easy';
    const _qslot = !!sportSessionTypes[dayIdx + '_' + type + '_qslot'];

    for(let w = 1; w <= tw; w++) {
      // V115: the compressed single quality slot flips INT -> CHI at the crossover.
      // Everything downstream reads `assignedType` exactly as before, including legLoad.
      // V205 (D122): `_qslot` is never set on a pace goal now, so this line is a no-op
      // there and every pace week reads `assignedTypeBase` for all tw weeks. It still
      // fires for a three-day swim_500_time / swim_100_time block.
      // V213 (D113a): and for a pace week the chooser's spacer fallback laid out as easy /
      // INT / long, and for a pace week under the exclusion key. Both set `_qslot` again.
      const _cross = qualityCrossoverWeek(tw);
      const assignedType = (_qslot && w >= _cross) ? 'chi' : assignedTypeBase;
      // Each phase gets its own dose ramp. Without this the INT phase (weeks 1..cross-1)
      // would ramp against the full block and top out short of NSW's 8 repeats, and CHI
      // would enter the back half already mid-progression instead of at one rep.
      const _qPhase = _qslot ? {intSpan: _cross - 1, chiFrom: _cross, chiTo: tw} : null;
      const _tap = _taperFor(w);
      // V159: under the frequency plan a run day is only active in the weeks its block
      // third has reached — inactive weeks render lift-only on that day. The skip lives
      // HERE, not in the plan, because schedule[w][dayKey] must still be written (null)
      // exactly like a lift-only day, or the week view renders a hole.
      if(_freq && type === 'run' && !(_freq.activeByWeek[w] && _freq.activeByWeek[w].has(dayIdx))){
        schedule[w][dayKey] = null;
        continue;
      }
      let session: CardioSession | null = null;
      if(type === 'run') {
        // Pre-convert mileBestMins/Secs to total seconds for the pace chart anchor
        const _mileBestSecs = (goal?.mileBestMins !== undefined && goal?.mileBestMins !== '')
          ? (+goal.mileBestMins||0)*60 + (+goal.mileBestSecs!||0)
          : null;
        const _runGoalId = goal?.id || 'run_base';
        if(NRC_GOALS.has(_runGoalId)) {
          // NRC engine: 5K, 10K, half marathon, marathon (V186: race → NRC)
          const _recIdx = sportSessionTypes[dayIdx + '_' + type + '_recIdx'] || 0;
          const _recIdxAll = sportSessionTypes[dayIdx + '_' + type + '_recIdxAll'];
          session = buildNRCSession(
            _runGoalId, w, tw, assignedType,
            cfg.experience||'intermediate', _mileBestSecs, _recIdx,
            sportSessionTypes[type + '_recSlots'] || 0, !!sportSessionTypes[type + '_hasSpeed2'],
            (typeof _recIdxAll === 'number') ? _recIdxAll : undefined, cfg.eventTargeted !== false
          );
        } else {
          // NSW engine: pace goals, 1.5-mile, mile time, base (V186: test → NSW)
          const forceType = assignedType === 'lsd_long' ? 'long' : null;
          const sessionOverride = forceType ? null : assignedType;
          // D100 (V202): the entered goal reaches the pace progression. Same reader as the
          // program-length sizer, so the block is sized and paced on one target. Read only
          // by the run_pace_goal branch of buildRunSession; every other run goal ignores it.
          const _pgT = paceGoalTarget(goal);
          session = buildRunSession(
            _runGoalId, w, dayIdx, tw,
            baselineMiles, cfg.experience||'intermediate',
            forceType, cfg.eventTargeted !== false, sessionOverride,
            _pgT.tDist, _pgT.tTotalSecs, cfg.ageBracket||'18-35', _mileBestSecs, isBaseCardio, _qPhase, _tap,
            cfg._paceShift || null,  // D2b (V142): pace-shift map, arguments[16]
            (w >= 2 && dayIdx === _lastEasyFor(w)),  // V157/V159: strides flag, arguments[17], week-aware under the frequency plan. Deliberately UNSCOPED by goal and session type: the ONLY consumer is the run_base sub-branch of lsd_easy, which is the single guard (proven by sabotage)
            ((w === 1 || w === tw) && dayIdx === _benchDayFor(w)),  // V158: benchmark flag, arguments[18]. Same single-guard doctrine as [17]: goal scoping lives only at the buildRunSession render branch
            (_freq && _freq.minsByWeek[w] && typeof _freq.minsByWeek[w][dayIdx] === 'number') ? _freq.minsByWeek[w][dayIdx] : null  // V159: budgeted minutes, arguments[19] — the scheduler owns the week's budget split; buildRunSession owns only the text
          );
        }
      } else if(type === 'bike') {
        session = buildBikeSession(goal?.id||'bike_base', w, dayIdx, tw, cfg.experience||'intermediate', assignedType, isBaseCardio, _tap, sportOrdinal);
      } else if(type === 'swim') {
        session = buildSwimSession(goal?.id||'swim_base', w, dayIdx, tw, cfg.experience||'intermediate', assignedType, goal, cfg.ageBracket||'18-35', isBaseCardio, _qPhase, _tap);
      }
      if(session) {
        // legLoad flags sessions that heavily fatigue the legs — hard/long runs and
        // hard/long bike work. Swim and easy sessions don't conflict with leg lifting.
        // Used downstream to keep the dedicated 'legs' lift off these days.
        session.legLoad = (type !== 'swim') && (assignedType === 'int' || assignedType === 'chi' || assignedType === 'lsd_long' || assignedType === 'nrc_long' || assignedType === 'nrc_speed1' || assignedType === 'nrc_speed2');
      }
      schedule[w][dayKey] = session;
      // D106a (V207): on a test pin, remember the run slots dealt in the test week and the week
      // before, by SLOT (assignedType), never by the card's name. The pin post-pass below puts
      // the trial in the quality slot and finds the easy run through these records.
      if(session && type === 'run' && cfg && cfg._racePin && cfg._racePin.test && w >= cfg._racePin.w - 1)
        (cfg._racePin.slots = cfg._racePin.slots || []).push({w, d: dayKey, t: assignedType});
    }
  });
  // V188 (D14a): race-week pin — the race session moves onto the race weekday, the run
  // days after it are cleared (rest after the race). Computed once in buildProgram and
  // handed in on cfg so the lifting layer applies the identical swap.
  const _pin = cfg && cfg._racePin;
  if(_pin && schedule[_pin.w]){
    const wk = schedule[_pin.w];
    if(_pin.test){
      // D106a (V207): the test takes the week's HARDEST run, by one hierarchy: the CHI, else the
      // INT (a three-run block at one or two weeks still deals the INT), else the long LSD (a
      // multi-sport week deals no quality run), else the only LSD. The long card, never the easy
      // one: the easy LSD stays free to be the shakeout. Tied to the slot, not the name. The card
      // is the goal's own trial: distance fixed, the log takes the time, the pace derives. TIME
      // TRIAL in the subtype is what the finder below moves onto the test weekday.
      const _sl = _pin.slots || [];
      const _inW: (t: string) => { w: number; d: DayKey; t: string } | undefined = t => _sl.find(s => s.w === _pin.w && s.t === t);
      const _lsdW = _sl.filter(s => s.w === _pin.w && s.t === 'lsd_easy');
      const _q = _inW('chi') || _inW('int') || _inW('lsd_long') || (_lsdW.length === 1 ? _lsdW[0] : null);
      if(_q && wk[_q.d]){
        const _g: Partial<CardioGoal> = cardioGoals.run || {}, _pt = paceGoalTarget(_g), _u = _g.paceUnit === 'km' ? 'km' : 'mi';
        const _raw = parseFloat(_g.targetDist!) || 1.5;
        const _dz: CardioDose = {k:'dist', mi: +_pt.tDist.toFixed(2), key:'trial'}; if(_pt.tPacePerMile) _dz.tgt = Math.round(_pt.tPacePerMile);
        wk[_q.d] = {type:'run', subtype: _raw + (_u === 'km' ? ' km' : ' Mile') + ' Test — TIME TRIAL',
          detail: _raw + ' ' + _u + '.' + (_pt.tTotalSecs ? ' Goal ' + _clkMS(_pt.tTotalSecs) + ' (' + _clkMS(_pt.tTotalSecs / _raw) + '/' + _u + ').' : ''),
          note: 'TEST DAY: Run it like the real thing. Warm up fully. Log your time. It anchors your next block.',
          week: _pin.w, goalId: wk[_q.d]!.goalId, dose: _dz, legLoad: true};
      }
      // D106a (V207, B4): nothing hard the day before the test or two days out (D38's window,
      // read across the week boundary like raceEveLiftPass). A hard run there becomes that
      // week's untagged easy LSD as it was dealt, captured here before the pin moves anything.
      // A week with no easy LSD rests the day instead. V208: the long LSD is hard here too
      // (legLoad), so it takes the easy dose by the same slot rule as INT and CHI.
      const _ez: Record<number, CardioSession> = {}; _sl.forEach(s => { if(s.t === 'lsd_easy' && s !== _q && !_ez[s.w] && schedule[s.w][s.d]) _ez[s.w] = schedule[s.w][s.d]!; });
      const _fl: { w: number; d: DayKey }[] = []; [_pin.w - 1, _pin.w].forEach(w => { if(schedule[w]) _ISO_ORDER.forEach(d => _fl.push({w, d})); });
      const _ti = _fl.findIndex(x => x.w === _pin.w && x.d === _pin.race);
      for(const _k of [1, 2]){
        const x = _ti - _k >= 0 ? _fl[_ti - _k] : null; if(!x) continue;
        const _h = _sl.find(r => r.w === x.w && r.d === x.d && (r.t === 'int' || r.t === 'chi' || r.t === 'lsd_long') && r !== _q);
        if(!_h || !schedule[x.w][x.d]) continue;
        const _e = _ez[x.w];
        if(_e) schedule[x.w][x.d] = {..._e, dose: _e.dose ? {..._e.dose, key:'easy'} : _e.dose}; else delete schedule[x.w][x.d];
      }
    }
    // the race session is the run whose subtype says so — wherever the layout put it
    const from = Object.keys(wk).find(d => wk[d] && wk[d].type === 'run' && /RACE DAY|TIME TRIAL/.test(wk[d].subtype||'')) || null;
    if(from && from !== _pin.race){ wk[_pin.race] = wk[from]; delete wk[from]; _pin.from = from; if(!_pin.rest.includes(from)) _pin.rest.push(from); }
    (_pin.rest||[]).forEach(d => { if(d !== _pin.race) delete wk[d]; });
    // V189 (D37): the shakeout runs the day before the race. D14a rested the day that held
    // the race, which left Nike's last recovery run two days out and a full rest day on the
    // eve. The eve, then two days out, is tried in that order: the first that is a train day
    // with nothing on it takes the last recovery run before the race, and the day it came
    // from rests instead. A user rest day is respected (a Mon to Fri athlete racing Sunday
    // shakes out Friday). A Monday race has no eve inside its week and is left alone.
    const _ri = _ISO_ORDER.indexOf(_pin.race);
    // The last run before the race is the shakeout. If the layout dealt Nike's race-week
    // speed session there and a recovery run sits earlier in the week, they trade days.
    { const rb = _ISO_ORDER.slice(0,_ri).filter(d => wk[d] && wk[d].type==='run');
      const last = rb[rb.length-1];
      if(last && /^speed run/i.test(wk[last]!.subtype||'')){
        const rec = rb.filter(d => /^recovery run/i.test(wk[d]!.subtype||'')).pop();
        if(rec){ const t = wk[last]; wk[last] = wk[rec]; wk[rec] = t; }
      } }
    for(const _k of [1,2]){
      if(_ri - _k < 0) break;
      const eve = _ISO_ORDER[_ri-_k];
      if(!trainDays.includes(eve) || wk[eve]) continue;
      const before = _ISO_ORDER.slice(0,_ri-_k).filter(d => wk[d] && wk[d].type==='run' && /^recovery run/i.test(wk[d].subtype||''));
      const sk = before[before.length-1];
      if(sk){ wk[eve] = wk[sk]; delete wk[sk]; _pin.shakeout = eve; _pin.rest = (_pin.rest||[]).filter(d => d!==eve); if(!_pin.rest.includes(sk)) _pin.rest.push(sk); }
      break;
    }
    // V214 (D158): THE TEST EVE CARRIES A SHAKEOUT. A training-day eve before an NSW test, read
    // across the week boundary, gets a shakeout from the easy-run builder at the eve's own week,
    // so it is that week's easy run and dose. It replaces whatever sat there, a bike or a swim
    // included. A rest-day eve stays rest. B4's T-2 step above is unchanged. It runs last in the
    // pin block, after the trial has moved, and clears the eve from _pin.rest, because the trial's
    // origin day enters _pin.rest and the lift layer rests every day listed there (as D37 does).
    // V214 (coach, fix): not under the protect-park modes (the D113a exclusion key: noimpact,
    // noimpact_swim, easy, reduce). A parked test has no race week, so the eve keeps V213's handling.
    if(_pin.test && cardioGoals.run && !_d113Excl){
      const _efl: { w: number; d: DayKey }[] = []; [_pin.w - 1, _pin.w].forEach(w => { if(schedule[w]) _ISO_ORDER.forEach(d => _efl.push({w, d})); });
      const _eti = _efl.findIndex(x => x.w === _pin.w && x.d === _pin.race); const _ev = _eti >= 1 ? _efl[_eti - 1] : null;
      if(_ev && trainDays.includes(_ev.d)){
        const _g = cardioGoals.run, _pg = paceGoalTarget(_g);
        const _rbm = parseFloat((_g.baselineDist||'').toString()) || parseFloat((_g.baseline||'').match(/([0-9.]+)/)?.[1]!) || ({beginner:1, intermediate:2, advanced:4}[cfg.experience||'intermediate'] || 2);
        const _mbs = (_g.mileBestMins !== undefined && _g.mileBestMins !== '') ? (+_g.mileBestMins||0)*60 + (+_g.mileBestSecs!||0) : null;
        const _sh = buildRunSession(_g.id, _ev.w, Math.max(0, cardioTrainDays.indexOf(_ev.d)), tw, _rbm, cfg.experience||'intermediate', null, cfg.eventTargeted !== false, 'lsd_easy',
          _pg.tDist, _pg.tTotalSecs, cfg.ageBracket||'18-35', _mbs, isBaseCardio, null, _taperFor(_ev.w), cfg._paceShift || null, false, false, null);
        if(_sh){ _sh.legLoad = false; schedule[_ev.w][_ev.d] = _sh; if(_ev.w === _pin.w) _pin.rest = (_pin.rest||[]).filter(d => d !== _ev.d); }
      }
    }
  }
  return schedule;
}

// ── V115: HARD CARDIO DAYS GET SPACED ───────────────────────────────────────────
// Both doctrines say the same thing in almost the same words: NSW tells you to consider
// how workouts interfere with each other, NRC tells you to space out hard efforts and
// never put speed work on back-to-back days. Nothing in the engine enforced it. Slots
// were dealt to days by sport allocation and session-type order, and whatever adjacency
// fell out was accepted. V114 made the long ride real, which turned a latent collision
// into a live one: an INT run, then a 2-hour ride, then a long run, three days running.
//
// This does NOT move cardio between days — sport allocation upstream is authoritative
// and already solves for its own spacing. It swaps a hard slot with an easy slot WITHIN
// one sport's own day list, which is the only move available that cannot break the
// allocation. Runs stay on run days; the run that is hard changes.
//
// Adjacency is CIRCULAR. Sunday and Monday are adjacent. This is the same trap that
// scored Sun+Sat as maximum separation in the base-cardio placer.
function spaceHardCardio(sportSessionTypes: Record<string, any>, sportDayIndices: Record<string, number[]>, cardioTrainDays: DayKey[], dayToSport: (CardioType | null)[], _skipSport?: string | null): number{
  const HARD = new Set(['int','chi','lsd_long','nrc_long','nrc_speed1','nrc_speed2']);
  const N = cardioTrainDays.length;
  if(N < 3) return 0; // nothing to space
  const slotAt: (i: number) => string | null = i => {
    const sp = dayToSport[i];
    return sp ? (sportSessionTypes[i + '_' + sp] || 'lsd_easy') : null;
  };
  const isHard: (i: number) => boolean = i => { const s = slotAt(i); return !!s && HARD.has(s) && dayToSport[i] !== 'swim'; };
  // Collisions counted over the real calendar week, so a rest day between two hard days
  // correctly breaks the pair. cardioTrainDays holds TRAIN days only, so adjacency is
  // derived from each day's true position in the week.
  const DAY_ORDER = ['mon','tue','wed','thu','fri','sat','sun'];
  const posOf: (i: number) => number = i => DAY_ORDER.indexOf(cardioTrainDays[i]);
  const collisions = () => {
    let c = 0;
    for(let a = 0; a < N; a++) for(let b = a+1; b < N; b++){
      if(!isHard(a) || !isHard(b)) continue;
      const d = Math.abs(posOf(a) - posOf(b));
      if(Math.min(d, 7 - d) === 1) c++;
    }
    return c;
  };
  let before = collisions();
  if(!before) return 0;
  // Try every within-sport swap; keep any that strictly reduces collisions. Bike and swim
  // are attempted before run so the run's long day keeps its late-week placement whenever
  // moving another sport is enough — the long run being last is a real convention, and
  // this pass should spend the cheapest move that fixes the week.
  const sports = Object.keys(sportDayIndices).sort((a,b)=>Number(a==='run')-Number(b==='run'));
  let guard = 0;
  for(const sp of sports){
    if(sp === _skipSport) continue;   // V213 (D146): chooser-planned run week, left as planned
    const days = sportDayIndices[sp] || [];
    for(let x = 0; x < days.length; x++) for(let y = x+1; y < days.length; y++){
      if(++guard > 400) return before - collisions();
      const kx = days[x] + '_' + sp, ky = days[y] + '_' + sp;
      const sx = sportSessionTypes[kx], sy = sportSessionTypes[ky];
      if(sx === sy) continue;
      const qx = sportSessionTypes[kx + '_qslot'], qy = sportSessionTypes[ky + '_qslot'];
      sportSessionTypes[kx] = sy; sportSessionTypes[ky] = sx;
      // The periodization tag rides with its slot, or the crossover would fire on the
      // wrong day after a swap.
      if(qx) delete sportSessionTypes[kx + '_qslot']; if(qy) delete sportSessionTypes[ky + '_qslot'];
      if(qx) sportSessionTypes[ky + '_qslot'] = qx; if(qy) sportSessionTypes[kx + '_qslot'] = qy;
      const after = collisions();
      if(after < before){ before = after; if(!before) return 1; }
      else { // revert
        sportSessionTypes[kx] = sx; sportSessionTypes[ky] = sy;
        delete sportSessionTypes[kx + '_qslot']; delete sportSessionTypes[ky + '_qslot'];
        if(qx) sportSessionTypes[kx + '_qslot'] = qx; if(qy) sportSessionTypes[ky + '_qslot'] = qy;
      }
    }
  }
  return 1;
}
// ── V172 (D7): THE RUN ANCHOR, STATED ────────────────────────────────────────
// Every run pace the engines print comes from ONE chart row, and that row is picked by a
// mile anchor the athlete was never shown — the V156 seed writes it into the wizard as if
// typed, and no surface stated it. These helpers are read-only over cfg; the engines keep
// their own anchor logic and the assertion suite checks the two agree.
const _CHART_RUN_GOALS = new Set(['run_half','run_marathon','run_5k','run_10k','run_pace_goal','run_mile_time','run_15_under10','run_base']);
function runAnchorInfo(cfg: Cfg | null | undefined): RunAnchorInfo | null{
  const c: Partial<Cfg> = cfg || {};
  if(!(c.cardioTypes||[]).includes('run')) return null;
  const g = c.cardioGoals && c.cardioGoals.run;
  if(!g || !g.id || !_CHART_RUN_GOALS.has(g.id)) return null;      // run_base easy runs pace off this row since V206 (D189)
  const exp = c.experience || 'intermediate';
  const expDef = {beginner:690, intermediate:570, advanced:450}[exp] || 570;
  const entered = (g.mileBestMins !== undefined && g.mileBestMins !== '') ? (+g.mileBestMins||0)*60 + (+g.mileBestSecs!||0) : 0;
  // Same rule as both engines: a falsy entry falls to the default (D188: every level).
  const rawSec = entered ? entered : expDef;
  const row = paceChartLookup('mile', rawSec);
  // The chart CLAMPS: anything at or under its fastest row trains at that row, anything at
  // or over its slowest trains there. row.mile is the anchor the engines actually use, so
  // that is the number stated; when it differs from the entry, the sentence says so.
  const anchorSec = row.mile;
  const clamped = (!!entered && Math.round(row.mile) !== Math.round(rawSec)) ? (rawSec < row.mile ? 'fast' : 'slow') : null;
  const src = g.mileBestSrc || null;
  const kind = !entered ? 'default' : (src && src.kind === 'seeded') ? 'seeded' : (src && src.kind === 'edited') ? 'edited' : 'entered';
  const race = g.id === 'run_half' ? 'half' : g.id === 'run_marathon' ? 'marathon' : null;
  // V176 (D10): the fixed target for pace-goal programs. The chip is the prescription;
  // the measure of progress is the projection card walking toward it.
  const goalT = (g.id === 'run_pace_goal' && g.targetDist && g.targetMins !== undefined && g.targetMins !== '')
    ? {dist:+g.targetDist, sec:(+g.targetMins||0)*60 + (+g.targetSecs!||0)} : null;
  return {anchorSec, rawSec, clamped, row, kind, exp, prog:(src && src.prog) || '', n:(src && +src.n!) || 0, wk:(src && +src.wk!) || 0, from:(src && src.from) || null, race, goalId:g.id, goalT};
}

// the module exports (scripts/module-blocks.mjs writes them; build-index.mjs strips them)
export {
  PACE_CHART, buildCardioProgression, isSpeedGoal, paceChartLookup, programTaperWindow, rowPaceAt, runAnchorInfo,
  sportDayTargets, steadyCapSec, taperWeeksFor,
};
