import { _clkMS } from './clock-format.ts';
import { NRC_GOALS, PACE_IMPROVE } from './nrc-race-bike-swim.ts';
import { paceChartLookup, rowPaceAt, steadyCapSec, taperWeeksFor } from './cardio-progression.ts';
// end of the module imports (scripts/module-blocks.mjs writes them; build-index.mjs strips them)
import type { Cardio, CardioDose, CardioGoal, CardioGoals, CardioType, Experience } from '../domain/index.ts';

/** The cardio goals as the engine passes them: buildProgram adds the athlete's experience and age bracket. */
export type EngineCardioGoals = CardioGoals & { _experience?: Experience; _ageBracket?: string; _eventTargeted?: boolean };
/** A pace goal's target (paceGoalTarget): the distance in miles, the total seconds, the pace per mile. */
export interface PaceTarget { tDist: number; tTotalSecs: number | null; tPacePerMile: number | null }
/** A CHI dose: how many continuous reps, how many minutes each, and the coach's note a session may add. */
export interface ChiDose { reps: number; minPerRep: number; note?: string }
/** A pace goal's weekly paces (seconds per mile), and what the progression found on the way. */
export type PaceProgression = number[] & { _dampened?: boolean; _weeklyGain?: number; _realisticTarget?: number; _originalTarget?: number; _goalMet?: boolean };
/** A cardio session as a builder returns it: the scheduler adds legLoad, and the goal id is the cfg's own string. */
export type CardioSession = Omit<Cardio, 'goalId' | 'legLoad'> & { goalId: string; legLoad?: boolean };
/** Where a week sits in the taper: its step (1 on, 0 outside it) of how many taper weeks. */
export interface TaperStep { step: number; of: number }
/** The compressed 3-day quality phase: INT ramps over intSpan weeks, CHI runs from chiFrom to chiTo. */
export interface QualityPhase { intSpan: number; chiFrom: number; chiTo: number }
/** A run goal's weekly distances by session family, and the pace goal's paces. */
export interface RunProgression { easy: number[]; interval: number[]; tempo: number[]; long: number[]; paceProgression: PaceProgression | null }


// CARDIO PROGRESSIONS

// ── PACE-GOAL TARGET: the single reader of what the athlete entered ──
// D100 (V202). Two readers need this number: calcProgramLength sizes the block on it and
// buildRunSession paces the weeks on it. When they each computed it, a km athlete got a block
// sized on one target and paced on another. The km conversion lives HERE and nowhere else on
// this path. Pure: reads the goal object, mutates nothing.
function parseTimeToSecs(txt: string | null | undefined): number | null {
  if(!txt) return null;
  var parts = txt.split(':').map(Number);
  if(parts.length === 2) return parts[0]*60 + parts[1];
  if(parts.length === 3) return parts[0]*3600 + parts[1]*60 + parts[2];
  return null;
}
function paceGoalTarget(g: Partial<CardioGoal> | null | undefined): PaceTarget {
  g = g || {};
  var rawDist = parseFloat(g.targetDist!) || 1.5;
  var tDist = (g.paceUnit === 'km') ? rawDist * 0.621 : rawDist;
  var tTotalSecs = null;
  if(g.targetMins !== undefined && g.targetMins !== '') {
    tTotalSecs = (+g.targetMins||0)*60 + (+g.targetSecs!||0);
  } else if(g.targetTime) {
    tTotalSecs = parseTimeToSecs(g.targetTime);
  }
  return {
    tDist: tDist,
    tTotalSecs: tTotalSecs,
    tPacePerMile: (tTotalSecs && tDist > 0) ? (tTotalSecs / tDist) : null
  };
}

// ── DYNAMIC PROGRAM LENGTH CALCULATOR ──
function calcProgramLength(cardioTypes: CardioType[] | null | undefined, cardioGoals: EngineCardioGoals, liftingGoal?: string | null): { weeks: number; warning: string | null } {
  if(!cardioTypes || !cardioTypes.length) return {weeks:6, warning:null};

  const experience = cardioGoals._experience || 'intermediate';
  const ageBracket = cardioGoals._ageBracket || '18-35';
  const ageMult = {'55+':1.15,'36-54':1.07,'18-35':1.0}[ageBracket] || 1.0;

  // Safe weekly build rates by experience (10% rule scaled)
  const weeklyPct = {beginner:0.08, intermediate:0.10, advanced:0.12}[experience] || 0.10;
  // Pace improvement: seconds per mile per week with interval training
  const paceImprove = PACE_IMPROVE[experience] || PACE_IMPROVE.intermediate;
  // Age bracket dampens weekly pace improvement — older athletes need longer adaptation runway
  const agePaceScale = {'55+':0.65, '36-54':0.85, '18-35':1.0}[ageBracket] || 1.0;
  const ageSafePaceImprove = +(paceImprove * agePaceScale).toFixed(2);

  // Experience-based baseline defaults when none entered
  const expBaseRun  = {beginner:0.75, intermediate:2.5, advanced:5.0}[experience] || 2.0;
  const expBaseSwim = {beginner:200,  intermediate:600, advanced:1200}[experience] || 500;
  const expBaseBike = {beginner:15,   intermediate:30,  advanced:60}[experience] || 25;
  // Experience-based current pace defaults (seconds per mile)
  // Beginner = can run but slow (~10-11min/mi), intermediate = moderate runner, advanced = trained
  const expCurrentPace = {beginner:690, intermediate:570, advanced:450}[experience] || 570;   // V176 (D9): one beginner default, the engine's 690

  // Parse helpers
  function parseMiles(txt: string | null | undefined): number | null {
    if(!txt) return null;
    // V146: currently UNREACHABLE with a minutes string — this call sits inside the
    // type==='run' branch and only bike writes a ' min' baseline (see the goal inputs),
    // and bike never routes here. Guarded anyway so it fails safe if that ever changes:
    // without this, "20 min" fell through the bare-number fallback below and became 20
    // MILES, seeding program length off a number that meant something else entirely.
    // Returning null lets the caller use its experience default instead of a wrong value.
    if(/[0-9][\s-]*min(?:ute)?s?\b/i.test(txt)) return null;
    var m = txt.match(/([0-9.]+)\s*mi(?:le)?s?\b/i); if(m) return parseFloat(m[1]);
    var m2 = txt.match(/([0-9.]+)\s*km/i); if(m2) return parseFloat(m2[1])*0.621;
    var m3 = txt.match(/([0-9.]+)/); if(m3) return parseFloat(m3[1]);
    return null;
  }
  function parseYards(txt: string | null | undefined): number | null {
    if(!txt) return null;
    var m = txt.match(/([0-9]+)\s*(?:yd|yard)/i); if(m) return parseInt(m[1]);
    var m2 = txt.match(/([0-9]+)\s*m(?:eter)?/i); if(m2) return Math.round(parseInt(m2[1])*1.094);
    var m3 = txt.match(/([0-9]+)/); if(m3) return parseInt(m3[1]);
    return null;
  }
  function parseMins(txt: string | null | undefined): number | null {
    if(!txt) return null;
    var m = txt.match(/([0-9]+)\s*min/i); if(m) return parseInt(m[1]);
    var m2 = txt.match(/([0-9]+)/); if(m2) return parseInt(m2[1]);
    return null;
  }
  // Core distance-build calculator with correct deload logic
  // Short goals (<=6.2mi, <=1760yd, <=90min) use faster progression
  function weeksToReach(current: number, target: number, pct: number, isShortGoal: boolean, absStep?: number): number {
    absStep = absStep || 0; // run passes 0.5mi; swim/bike omit it (pure % climb)
    if(current >= target * 0.90) return 4;
    var actualPct = isShortGoal ? pct * 1.5 : pct;
    var miles = current, lastBuild = current, weeks = 0;
    while(miles < target * 0.90 && weeks < 52) {
      weeks++;
      if(weeks % 4 === 0) {
        miles = lastBuild * 0.70; // deload — don't update lastBuild
      } else {
        var inc = Math.max(absStep, lastBuild * actualPct);
        var next = Math.min(target, lastBuild + inc);
        miles = next; lastBuild = next;
      }
    }
    return Math.min(weeks + 2, 36);
  }

  // Pace calculator — caps scale with distance so short goals don't inflate to 24wks
  function weeksToPace(currentPace: number, targetPace: number, improvePerWeek: number, distMiles: number): number {
    var gap = currentPace - targetPace;
    if(gap <= 0) return 4;
    var raw = Math.ceil(gap / improvePerWeek);
    var result = Math.round(raw * 1.25) + 4;
    // Hard cap by distance: short distances build pace fast, don't need marathon timelines
    var distCap = distMiles <= 1.0 ? 8 : distMiles <= 2.0 ? 10 : distMiles <= 5.0 ? 14 : 20;
    return Math.min(result, distCap);
  }

  var maxWeeks = 6;
  var warnings: string[] = [];
  var _nrcPin = 0, _nrcLbl = '';   // V186 (§3b): set by the run branch for the four NRC goals

  cardioTypes.forEach(function(type) {
    var goal = cardioGoals[type];
    if(!goal || !goal.id) return;
    var goalId = goal.id;
    var baseline = goal.baseline || '';
    var needed = 6;

    if(type === 'run') {
      var distTargets: Record<string, number> = {run_5k:3.1, run_10k:6.2, run_half:13.1, run_marathon:26.2, run_base:5.0};

      if(goalId === 'run_pace_goal') {
        // D100 (V202): one reader, so the block size and the weekly pace targets come
        // from the identical number for mi and km athletes alike.
        var _pgT = paceGoalTarget(goal);
        var tDist = _pgT.tDist;
        var tTotalSecs = _pgT.tTotalSecs;
        var tPacePerMile = _pgT.tPacePerMile;
        // Use the user's actual mile time if entered, otherwise fall back to experience default.
        // This makes program length consistent with the pace targets shown in sessions.
        var _mileBestSecs = (goal.mileBestMins !== undefined && goal.mileBestMins !== '')
          ? (+goal.mileBestMins||0)*60 + (+goal.mileBestSecs!||0)
          : null;
        var currentPaceForCalc = _mileBestSecs || expCurrentPace;
        if(tPacePerMile) {
          needed = weeksToPace(currentPaceForCalc, tPacePerMile, ageSafePaceImprove, tDist);
        } else {
          // No time entered yet — fall back to distance-based estimate
          var baselineDist = parseFloat(goal.baselineDist!) || parseMiles(baseline) || expBaseRun;
          needed = weeksToReach(baselineDist, tDist * 1.5, weeklyPct, tDist <= 6.2, 0.5);
        }
        // Apply same ageMult, +1 grace week, and distance-scaled cap as all other run goals
        needed = Math.round(needed * ageMult);
        var paceCap = tDist <= 1.0 ? 9 : tDist <= 2.0 ? 11 : tDist <= 5.0 ? 15 : 21;
        if(experience === 'beginner') {
          // Beginner = some running background (~2mi). Ensure the program is long enough to
          // build the aerobic base (climb from ~2mi to ~5mi), not just close the pace gap.
          var pgBegBase = Math.max(2.0, parseFloat(goal.baselineDist!) || parseMiles(baseline) || 2.0);
          var pgBaseBuild = weeksToReach(pgBegBase, 5.0, weeklyPct, false, 0.5);
          needed = Math.max(needed, pgBaseBuild);
          needed = Math.min(26, needed + 1); // doctrine ~26-week ceiling, +1 grace
        } else {
          needed = Math.min(paceCap, needed + 1); // +1 grace week
        }
        needed = Math.max(6, needed);
        var distLabel = (goal.targetDist||'1.5') + (goal.paceUnit||'mi');
        var timeLabel = goal.targetMins ? goal.targetMins+':'+(String(goal.targetSecs||0).padStart(2,'0')) : '';
        var lbl = distLabel + (timeLabel?' in '+timeLabel:'');
        if(needed > 6) warnings.push('Pace goal (' + lbl + ') needs ' + needed + ' weeks');

      } else if(distTargets[goalId] !== undefined) {
        var rtgt = distTargets[goalId];

        // 1. Smart experience-based baselines — prevents math explosions at low-baseline entries
        var defaultBaselines: Record<string, Record<Experience, number>> = {
          run_5k:       {beginner:0.5, intermediate:1.5, advanced:2.5},
          run_10k:      {beginner:1.0, intermediate:3.0, advanced:4.5},
          run_half:     {beginner:3.0, intermediate:5.0, advanced:7.0},
          run_marathon: {beginner:5.0, intermediate:8.0, advanced:12.0},
          run_base:     {beginner:0.5, intermediate:1.5, advanced:3.0}
        };
        var expTier = experience || 'intermediate';
        var rcur: number;
        if(expTier === 'beginner') {
          // Beginner ramps from ~2mi (some running background), floored
          rcur = Math.max(2.0, parseFloat(goal.baselineDist!) || parseMiles(baseline) || 2.0);
        } else {
          rcur = parseFloat(goal.baselineDist!) || parseMiles(baseline) || (defaultBaselines[goalId] || defaultBaselines.run_base)[expTier];
        }

        // 2. Compute foundation weeks — flat lookup for short goals, dynamic loop for endurance.
        // Beginners always use the dynamic climb so the length reflects their real ramp.
        if(goalId === 'run_5k') {
          needed = expTier === 'beginner' ? weeksToReach(rcur, 3.1, weeklyPct, true, 0.5) : (expTier === 'intermediate' ? 7 : 6);
        } else if(goalId === 'run_10k') {
          needed = expTier === 'beginner' ? weeksToReach(rcur, 6.2, weeklyPct, true, 0.5) : (expTier === 'intermediate' ? 8 : 7);
        } else {
          // Half, Marathon, Base — dynamic progressive loop
          needed = weeksToReach(rcur, rtgt, weeklyPct, rtgt <= 6.2, 0.5);
        }

        // 3. Age recovery multiplier applied to the foundation
        needed = Math.round(needed * ageMult);

        // 4. Length ceilings. Doctrine-pure goals (5K/10K/base) bound to the NSW ~26-week
        // window; half & marathon BREAK to civilian endurance (longer builds for real
        // race-distance long runs — nobody trains for a half+ under a tactical mandate).
        // Applies to all tiers, but non-beginners rarely reach it (their climb from a
        // higher base is short) — it mainly gives beginners the honest length they need.
        // NRC fixed templates override the climb-based calculation for half & marathon.
        // Nike assumes you can run the workouts at the start — the program IS the build.
        // 5K/10K/base stay on the NSW climb-based model with their doctrine ceilings.
        //
        // EVENT-TARGETED TOGGLE: with a race date, run the full table including the
        // taper weeks and the race milestone. With "just building fitness" (no race),
        // truncate the plan to END ON THE PEAK WEEK — the highest-volume long run —
        // and drop the taper entirely. We never hold peak volume (that's an injury
        // trap), we simply conclude the build at its high point. Peak weeks: marathon
        // = wk 14 (18–22mi run), half = wk 11 (20K run).
        var _evt = cardioGoals._eventTargeted !== false; // default true if unset
        if(goalId === 'run_half')     { needed = _evt ? 14 : 11; }
        else if(goalId === 'run_marathon') { needed = _evt ? 18 : 14; }
        // V186 (§3/§4): Nike's 5K and 10K plans are 8 weeks, with or without a race —
        // no race, the last day is a time trial. The climb/age/ceiling math above is
        // computed and discarded for these two goals; run_base still uses it.
        else if(goalId === 'run_5k' || goalId === 'run_10k') { needed = 8; }
        if(!NRC_GOALS.has(goalId)) {
          var lengthCeil: Record<string, number> = {run_5k:12, run_10k:16, run_base:26};
          var ceil = lengthCeil[goalId] || 26;
          needed = Math.min(ceil, needed + 1); // +1 grace week
          needed = Math.max(6, needed);
        }

        var lbl2 = {run_5k:'5K',run_10k:'10K',run_half:'Half Marathon',run_marathon:'Full Marathon',run_base:'Running Base'}[goalId];
        // V186: an NRC plan has a fixed length — the sheet should not claim it was
        // derived from the athlete's base. §3b: it also pins the program length.
        if(NRC_GOALS.has(goalId)) { _nrcPin = needed; _nrcLbl = lbl2!; }
        if(needed > 6) warnings.push(NRC_GOALS.has(goalId)
          ? lbl2 + ' plan — ' + needed + ' weeks, fixed'
          : lbl2 + ' needs ' + needed + ' weeks from your current base');
      }

    } else if(type === 'swim') {
      var swimTargets: Record<string, number> = {swim_tri:1700, swim_mile:1760, swim_100_time:800, swim_500_time:1200, swim_base:1000};
      var stgt = swimTargets[goalId] || 1000;
      var sTier = experience || 'intermediate';
      var swimCaps: Record<string, number>   = {swim_tri:18, swim_mile:16, swim_100_time:10, swim_500_time:12, swim_base:12};
      var swimFloors: Record<string, number> = {swim_tri:10, swim_mile:8};
      var sCap = swimCaps[goalId] || 12, sFloor = swimFloors[goalId] || 6;
      var swimLbl = {swim_tri:'Triathlon Swim',swim_mile:'Swim a Mile',swim_100_time:'100 Time',swim_500_time:'500 Time',swim_base:'Swim Base'}[goalId];

      // Time goals (500/100): if a target time is entered, size by the PER-100 PACE GAP
      // (mirrors run_pace_goal) rather than volume. Fall back to volume if no time given.
      var isSwimTimeGoal = (goalId === 'swim_500_time' || goalId === 'swim_100_time');
      var swimTimeEntered = isSwimTimeGoal && ((+goal.targetMins!||0)*60 + (+goal.targetSecs!||0)) > 0;
      if(swimTimeEntered) {
        var fixedDist = (goalId === 'swim_500_time') ? 500 : 100; // in the chosen unit
        var tTotal = (+goal.targetMins!||0)*60 + (+goal.targetSecs!||0);
        var tPace100 = tTotal / (fixedDist / 100); // target seconds per 100
        // Current per-100 pace: from entered baseline time, else an experience default
        var expSwimPace = {beginner:150, intermediate:120, advanced:95}[sTier] || 120; // sec/100
        var curPace100 = expSwimPace;
        {
          var bTotal = (+goal.baseMins!||0)*60 + (+goal.baseSecs!||0);
          if(bTotal > 0) curPace100 = bTotal / (fixedDist / 100);
        }
        // Safe per-100 improvement per week, dampened by age (analog of run pace logic)
        var swimImprove = ({beginner:4, intermediate:3, advanced:2}[sTier] || 3) * agePaceScale;
        var sgap = curPace100 - tPace100;
        if(sgap <= 0) {
          needed = 6;
        } else {
          var sraw = Math.ceil(sgap / swimImprove);
          needed = Math.round(sraw * 1.25) + 4;
        }
        needed = Math.round(needed * ageMult);
        if(swimLbl) {
          var sTimeLbl = _clkMS(tTotal);   // V218 (D157): label from the total the sizer just read
          warnings.push(swimLbl + ' (' + sTimeLbl + '/' + fixedDist + (goal.swimUnit||'yd') + ') needs ' + Math.max(sFloor, Math.min(sCap, needed)) + ' weeks');
        }
      } else {
        // Volume-based (distance goals + time goals with no target entered yet)
        var swimBaselines: Record<string, Record<Experience, number>> = {
          swim_tri:      {beginner:400, intermediate:800, advanced:1200},
          swim_mile:     {beginner:400, intermediate:800, advanced:1200},
          swim_100_time: {beginner:300, intermediate:500, advanced:800},
          swim_500_time: {beginner:300, intermediate:600, advanced:900},
          swim_base:     {beginner:200, intermediate:500, advanced:800}
        };
        var scur = parseFloat(goal.baselineDist!) || parseYards(baseline) || (swimBaselines[goalId] || swimBaselines.swim_base)[sTier];
        needed = weeksToReach(scur, stgt, weeklyPct, stgt <= 1000);
        needed = Math.round(needed * ageMult);
        if(needed > 6 && swimLbl) warnings.push(swimLbl + ' needs ' + needed + ' weeks from your current base');
      }
      // Absolute macro caps + floors, mirroring the run goals so no swim plan balloons
      needed = Math.max(sFloor, Math.min(sCap, needed));
      needed = Math.min(sCap, needed + 1); // +1 grace week

    } else if(type === 'bike') {
      var bikeTargets: Record<string, number> = {bike_century:180, bike_50:90, bike_ftp:60, bike_cals:45, bike_base:45};
      var btgt = bikeTargets[goalId] || 45;
      var bikeBaselines: Record<string, Record<Experience, number>> = {
        bike_century: {beginner:30, intermediate:60, advanced:90},
        bike_50:      {beginner:25, intermediate:45, advanced:75},
        bike_ftp:     {beginner:20, intermediate:40, advanced:60},
        bike_cals:    {beginner:15, intermediate:30, advanced:45},
        bike_base:    {beginner:15, intermediate:30, advanced:45}
      };
      var bTier = experience || 'intermediate';
      var bcur = parseFloat(goal.baselineDist!) || parseMins(baseline) || (bikeBaselines[goalId] || bikeBaselines.bike_base)[bTier];
      needed = weeksToReach(bcur, btgt, weeklyPct, btgt <= 60);
      needed = Math.round(needed * ageMult);
      var bikeCaps: Record<string, number>   = {bike_century:20, bike_50:14, bike_ftp:12, bike_cals:10, bike_base:12};
      var bikeFloors: Record<string, number> = {bike_century:12, bike_50:8};
      var bCap = bikeCaps[goalId] || 12, bFloor = bikeFloors[goalId] || 6;
      needed = Math.max(bFloor, Math.min(bCap, needed));
      needed = Math.min(bCap, needed + 1); // +1 grace week
      var bikeLbl = {bike_century:'Century Ride',bike_50:'50-Mile Ride',bike_ftp:'FTP / Power',bike_cals:'Calorie Targets',bike_base:'Cycling Base'}[goalId];
      if(needed > 6 && bikeLbl) warnings.push(bikeLbl + ' needs ' + needed + ' weeks from your current base');
    }

    // Run, swim, and bike now each apply ageMult + their own caps/floors inside their
    // own branch, so the program length stays realistic for every sport.
    if(needed > maxWeeks) maxWeeks = needed;
  });
  // V186 (§3b): the NRC race plan is the calendar. Any other sport that asked for more
  // weeks builds inside it instead — its own warning is replaced so the sheet cannot say
  // "12 weeks" over an "8-Week Program" header.
  if(_nrcPin && maxWeeks !== _nrcPin) {
    warnings = warnings.filter(function(w){ return w.indexOf(_nrcLbl) === 0; });
    warnings.push('Other sports fit inside the ' + _nrcPin + '-week ' + _nrcLbl + ' plan');
    maxWeeks = _nrcPin;
  }

  return {weeks: maxWeeks, warning: warnings.length ? warnings.join(' · ') : null};
}


// ── REALISTIC RUN PROGRESSIONS (per week, per session type) ──
// These scale based on baseline mileage and total program length

// ════════════════════════════════════════
// NSW DOCTRINE CARDIO ENGINE
// Three session types per sport:
// LSD  = Long Slow Distance — Zone 2, conversational pace, base builder
// CHI  = Continuous High Intensity — 90-95% max pace, sustained effort
// INT  = Interval — short hard efforts, structured recovery, max 8 reps (NSW ceiling)
// ════════════════════════════════════════

// INT rep progression: 4 reps → 8 reps, hard cap at 8 (NSW PTG: never exceed 8 SI repeats)
// Beyond week 26 (military goals only): freeze reps, increase intensity note

// ════════════════════════════════════════
// NSW DOCTRINE CARDIO ENGINE
// LSD  = Long Slow Distance — Zone 2, conversational pace, base builder
// CHI  = Continuous High Intensity — 90-95% max pace, sustained effort  
// INT  = Interval — short hard efforts, structured recovery, max 8 reps (NSW ceiling)
// ════════════════════════════════════════

// ── CARDIO CUTBACK WEEK ─────────────────────────────────────────────────────
// Same w%4 clock the lifting deload reads (see SYNCHRONIZED LIFTING DELOAD ENGINE),
// so lifting and cardio step back on the SAME week — one true recovery week, not two
// staggered half-recoveries. Run LSD and swim LSD already cut back on this cadence
// inside their distance builders; this helper brings the interval/CHI progressions
// and the bike in line. Final week excluded — taper/peak owns it.
function isCardioCutbackWeek(week: number, totalWeeks: number | null | undefined): boolean{
  return (totalWeeks||0) >= 10 && week % 4 === 0 && week !== totalWeeks;
}

// ── D114 (ruled V202, built V205): NSW GUIDE B, TABLE 6 — THE INT PROGRESSION ─────
// Source: doctrine/nsw_ptg_sealswcc_11pg.txt, the "INT" column of Table 6, headed
// "Run/Swim (reps)" — 400 m repeats for the run, 100 yd repeats for the swim.
// Transcribed verbatim, 26 rows, week 1 through week 26:
//   4 4 5 5 6 6 7 7 8 8 9 9 then 10 from week 13 to week 26.
// Line 61 of that file is the table's own tail rule: ">26: do not increase INT or CHI
// distances. Focus on increasing intensity." That rule is implemented by the
// Math.min(week, 26) clamp in the reader below and by nothing else — past week 26 the
// athlete keeps reading row 26 forever, which IS "do not increase".
//
// THE CEILING IS 8, AND IT COMES FROM THE OTHER GUIDE. Guide A is explicit that a Short
// Interval session should not exceed 8 repeats: start at 4, build progressively to 8, and
// once you can hold 8 at high intensity you work on PACE, not more reps. Past 8 x 400 m on
// 2 to 2.5x recovery the session stops being speed work and becomes a threshold session
// run at interval pace on incomplete rest, which trains neither. Table 6's raw column
// climbs to 9 at week 11 and 10 at week 13; Guide A's cap is applied over the top of it,
// so the prescription reaches 8 at week 9 and then holds 8 forever. The table is stored
// RAW and the cap lives in the reader on purpose: the transcription stays checkable
// against the page, and the doctrine that overrides it stays visible as an override.
//
// What this replaces: the V115 hand ramp, which spread 4 -> 8 across a `rampSpan` window
// by POSITION. Table 6 is a CALENDAR progression keyed on the training week, not a
// phase-relative ramp, which is the same thing D128 found for the CHI column.
var NSW_TABLE6_INT: (number | null)[] = [
  null,                       // index 0 unused: weeks are 1-based
  4, 4,                       // wk 1-2
  5, 5,                       // wk 3-4
  6, 6,                       // wk 5-6
  7, 7,                       // wk 7-8
  8, 8,                       // wk 9-10
  9, 9,                       // wk 11-12
  10, 10, 10, 10, 10, 10, 10, // wk 13-19
  10, 10, 10, 10, 10, 10, 10  // wk 20-26
];
// The reader. Returns a plain rep COUNT — INT's prescription is a number of repeats, so
// unlike chiFromTable6 there is no object to hand back and nothing a caller could mutate.
// Math.min(week, 26) is load-bearing doctrine, not defensive clamping: it is Table 6's
// ">26" row. Math.min(8, row) is Guide A's ceiling.
function intFromTable6(week: number): number{
  var _w = Math.max(1, Math.min(Math.round(week) || 1, 26));
  return Math.min(8, NSW_TABLE6_INT[_w]!);
}

function getINTReps(week: number, totalWeeks: number, isMilGoal: boolean, rampSpan?: number | null): number {
  // D114 (V205): the `isMilGoal && week > 26` limb that used to sit here returned a
  // hardcoded 8, and it was ALREADY UNREACHABLE. calcProgramLength caps run_pace_goal at
  // Math.min(26, ...) — its own comment calls that the doctrine 26-week ceiling — with
  // paceCap topping out at 21; the swim military goals cap at 18 and 16; the bike caps at
  // 20. Weeks run 1..totalWeeks, so nothing this app can build ever hands week 27 to this
  // function. Deleted rather than re-pointed, which is the identical move D128 made on
  // getCHI's sibling limb in slice 1, and for the identical reason: the Math.min(week, 26)
  // clamp inside intFromTable6 IS the ">26: do not increase" rule, so row 26 is read
  // forever and nothing increases.
  //
  // Be precise about what the deletion changed, because it is not nothing. The old limb
  // returned BEFORE the cutback check, so it short-circuited it. Called directly with a
  // week past 26 that happens to be a multiple of 4 — getINTReps(400, 30, true) — the old
  // code returned 8 and this one returns the cutback value, 5. No build reaches that call;
  // only a harness can. It is written down here so the next reader does not rediscover it
  // as a surprise.
  // `rampSpan` is kept in the signature and is no longer read, for the same reason
  // getCHI still takes `phaseFrom`/`phaseTo` after D128: the run and swim callers still
  // hand down the periodized INT window, and the parameter is left in place so those
  // call sites need no edit. It no longer RE-BASES anything. Table 6 is indexed on the
  // training week itself, so an INT phase that opens in week 7 opens on week 7's row
  // (7 repeats) instead of restarting the build at its first rung.
  //
  // This is what fixes the ramp. The V115 position-based build spread 4 -> 8 across
  // `_span`; when D125/D130 made the INT slot weekly across an 11-week block, the final
  // rung landed on the taper week and the athlete topped out at SEVEN repeats, never
  // reaching the eight Guide A tells him to build to. On the calendar table he reaches
  // 8 in week 9 and holds it, which is the progression as written.
  const ramp: (w: number) => number = w => intFromTable6(w);
  // Cutback week: interval VOLUME steps back ~40% off the prior build week and never
  // progresses. Callers hold pace — fewer reps at the same target is the cutback
  // prescription; a rep or pace PR during a recovery week is a planning error.
  if(isCardioCutbackWeek(week, totalWeeks)) return Math.max(3, Math.round(ramp(week-1) * 0.6));
  return ramp(week);
}

// ── D135 (V205): THE BIKE KEEPS THE V115 INT HAND RAMP, BYTE-IDENTICAL ───────
// Table 6's rep column is headed "Run/Swim (reps)" — 400 m repeats for the run, 100 yd
// repeats for the swim. SWIM IS NAMED IN THAT HEADER AND MOVES ONTO THE TABLE. The bike
// is not named and does not: a table that counts 400 m repeats does not claim cycling,
// and prescribing its rep counts on a bike would be an invention, not a transcription.
// Left unforked, a 17-week bike_century read row 9 onward and held EIGHT max-effort
// intervals for twelve straight weeks, because the calendar table has no bike ceiling in
// it to stop at.
//
// BE HONEST ABOUT WHAT THIS IS. The hand ramp below is not doctrine either. It is the
// UNRULED STATE, held rather than replaced by a table that does not claim the sport.
// Holding an unruled ramp is the smaller error than importing a source that is silent.
// Cycling intervals and cycling tempo are ONE open ruling, not two: when cycling is ruled
// on, this reader and getCHIBike are replaced together, and neither replacement touches
// Table 6 or the run path. That is why both forks are BY CALLER and not a flag inside the
// shared reader.
//
// The body is the V115 ramp unchanged except that the `isMilGoal && week > 26` limb is not
// carried over — the bike caller passed `false` literally, so that limb was already
// unreachable from here and dropping it moves no byte of bike output. `isMilGoal` is gone
// from the signature for the same reason. `rampSpan` is kept and IS read here, unlike in
// getINTReps: this ramp is position-based, so the span is the whole of its meaning. The
// bike caller passes no span, so it defaults to the block length, which is exactly what
// the old three-argument bike call into the shared reader resolved to.
function getINTBike(week: number, totalWeeks: number, rampSpan?: number | null): number {
  const _span = Math.max(2, rampSpan || totalWeeks || 6);
  const ramp: (w: number) => number = w => Math.min(8, 4 + Math.floor((w-1) * 4 / Math.max(_span-1,1)));
  // Cutback week: interval VOLUME steps back ~40% off the prior build week and never
  // progresses. Byte-identical to the rule getINTReps still states.
  if(isCardioCutbackWeek(week, totalWeeks)) return Math.max(3, Math.round(ramp(week-1) * 0.6));
  return ramp(week);
}

// ── D128 (V205): NSW GUIDE B, TABLE 6 — THE CHI PROGRESSION, AS DATA ─────────
// Source: doctrine/nsw_ptg_sealswcc_11pg.txt lines 35-60, the "CHI min" column of
// Table 6 ("Run/Swim (minutes)"), transcribed verbatim. Line 61 of that file is the
// table's own tail rule: ">26: do not increase INT or CHI distances. Focus on
// increasing intensity."
// That tail rule is implemented by the Math.min(week, 26) clamp in the reader below
// and by nothing else. Past week 26 the athlete keeps reading row 26 forever, which
// IS "do not increase" — so there is no >26 branch to write, and the hardcoded one
// that used to sit at the top of getCHI is gone (see D128 note there).
// What this replaces: the V115 hand ramp, which set reps 1/2/3 by position inside the
// CHI phase and 15-20 minutes per rep, topping out at 3 x 20 = 60 minutes of work.
// Neither the third rep nor the 60 has a source in either guide. Table 6's ceiling is
// 2 x 20 = 40. The table is a CALENDAR progression keyed on the training week, not a
// phase-relative ramp.
var NSW_TABLE6_CHI: (ChiDose | null)[] = [
  null,                                             // index 0 unused: weeks are 1-based
  {reps:1, minPerRep:15}, {reps:1, minPerRep:15},   // wk 1-2
  {reps:1, minPerRep:16}, {reps:1, minPerRep:16},   // wk 3-4
  {reps:1, minPerRep:17}, {reps:1, minPerRep:17},   // wk 5-6
  {reps:1, minPerRep:18}, {reps:1, minPerRep:18},   // wk 7-8
  {reps:1, minPerRep:19}, {reps:1, minPerRep:19},   // wk 9-10
  {reps:1, minPerRep:20}, {reps:1, minPerRep:20},   // wk 11-12
  {reps:2, minPerRep:12}, {reps:2, minPerRep:12}, {reps:2, minPerRep:12},   // wk 13-15
  {reps:2, minPerRep:14}, {reps:2, minPerRep:14}, {reps:2, minPerRep:14},   // wk 16-18
  {reps:2, minPerRep:16}, {reps:2, minPerRep:16}, {reps:2, minPerRep:16},   // wk 19-21
  {reps:2, minPerRep:18}, {reps:2, minPerRep:18}, {reps:2, minPerRep:18},   // wk 22-24
  {reps:2, minPerRep:20}, {reps:2, minPerRep:20}                            // wk 25-26
];
// The reader. Math.min(week, 26) is load-bearing doctrine, not defensive clamping:
// it is Table 6's ">26" row. Returns a fresh object every call so no caller can
// mutate the table.
function chiFromTable6(week: number): ChiDose{
  var _w = Math.max(1, Math.min(Math.round(week) || 1, 26));
  var _row = NSW_TABLE6_CHI[_w]!;
  return { reps: _row.reps, minPerRep: _row.minPerRep };
}

function getCHI(week: number, totalWeeks: number, isMilGoal: boolean, phaseFrom?: number | null, phaseTo?: number | null, _rowCap?: number): ChiDose {
  // D128 (V205): the `isMilGoal && week > 26` limb that used to sit here returned a
  // hardcoded {reps:3, minPerRep:20} — 60 minutes of threshold work against Table 6's
  // 40 at the same week. Its replacement already exists: chiFromTable6 clamps at
  // Math.min(week, 26), so week 27 and week 400 both read row 26 and nothing
  // increases. Deleted, not re-pointed, because the clamp IS the >26 rule.
  // D128 (V205): this is the RUN reader, and it reads Table 6 by calendar week.
  // `phaseFrom`/`phaseTo` are kept in the signature because the run and swim callers
  // still pass the periodized CHI window, but they no longer re-base the progression:
  // Table 6 is indexed on the training week itself, so a CHI phase that opens in week 7
  // opens on week 7's row (1 x 18) instead of restarting the ramp at its first rung.
  // The V115 phase-relative pct ramp is gone with the 1/2/3 rep ladder it fed.
  const at: (w: number) => ChiDose = w => chiFromTable6(_rowCap ? Math.min(w, _rowCap) : w);
  // Cutback week: one rep off the prior build week; single-rep sessions cut duration
  // ~30% instead. Intensity target is unchanged — the dose steps back, not the touch.
  if(isCardioCutbackWeek(week, totalWeeks)){
    const prev = at(week-1);
    return prev.reps > 1
      ? { reps: prev.reps - 1, minPerRep: prev.minPerRep }
      : { reps: 1, minPerRep: Math.max(10, Math.round(prev.minPerRep * 0.7)) };
  }
  return at(week);
}

// ── D128 (V205): THE BIKE KEEPS THE V115 HAND RAMP, BYTE-IDENTICAL ───────────
// Table 6 is a run/swim table. Neither the NSW guide nor the NRC plans cover cycling,
// so prescribing the table's minutes on a bike would be an invention, not a
// transcription. This is a fork BY CALLER, not a flag inside getCHI: when cycling is
// ruled on, this reader is replaced on its own without touching the table or the run
// path. The body below is the V115 ramp unchanged except that the `isMilGoal && week > 26`
// limb is not carried over — the bike caller passes `false` literally, so that limb was
// already unreachable from here and dropping it moves no byte of bike output.
function getCHIBike(week: number, totalWeeks: number, phaseFrom?: number | null, phaseTo?: number | null): ChiDose {
  const _pFrom = phaseFrom || 1, _pTo = Math.max(_pFrom+1, phaseTo || totalWeeks || 6);
  const atBike: (w: number) => ChiDose = w => {
    const pct = Math.max(0, Math.min(1, (w - _pFrom) / Math.max(_pTo - _pFrom, 1)));
    return { reps: pct < 0.35 ? 1 : pct < 0.70 ? 2 : 3, minPerRep: Math.round(15 + pct * 5) };
  };
  if(isCardioCutbackWeek(week, totalWeeks)){
    const prev = atBike(week-1);
    return prev.reps > 1
      ? { reps: prev.reps - 1, minPerRep: prev.minPerRep }
      : { reps: 1, minPerRep: Math.max(10, Math.round(prev.minPerRep * 0.7)) };
  }
  return atBike(week);
}

// ── D128 (V205): SWIM TAKES THE REP TIER FROM TABLE 6 AND NOTHING ELSE ───────
// Table 6's minutes column is titled "Run/Swim (minutes)", but this app prescribes the
// swim CHI session in YARDS (`chiYards`, built from its own ramp), and prescription owns
// ONE fixed dimension. Importing the table's minutes here would prescribe two. So swim
// reads only the REP TIER — 1 rep through week 12, 2 from week 13 on, never 3 — which is
// the part of Table 6 that is a rep count rather than a distance. `minPerRep` stays on
// the V115 ramp for the taper branch that rewrites it; nothing downstream of swim prints
// it. `chiYards` is untouched by D128.
function getCHISwim(week: number, totalWeeks: number, isMilGoal: boolean, phaseFrom?: number | null, phaseTo?: number | null): ChiDose {
  const _pFrom = phaseFrom || 1, _pTo = Math.max(_pFrom+1, phaseTo || totalWeeks || 6);
  const atSwim: (w: number) => ChiDose = w => {
    const pct = Math.max(0, Math.min(1, (w - _pFrom) / Math.max(_pTo - _pFrom, 1)));
    return { reps: chiFromTable6(w).reps, minPerRep: Math.round(15 + pct * 5) };
  };
  if(isCardioCutbackWeek(week, totalWeeks)){
    const prev = atSwim(week-1);
    return prev.reps > 1
      ? { reps: prev.reps - 1, minPerRep: prev.minPerRep }
      : { reps: 1, minPerRep: Math.max(10, Math.round(prev.minPerRep * 0.7)) };
  }
  return atSwim(week);
}


function buildRunProgressionForLength(goalId: string, totalWeeks: number, baselineMiles: number | null | undefined, experience: Experience | null | undefined, eventTargeted: boolean): RunProgression {
  const expBaseCap: Record<string, number> = {beginner:1.5, intermediate:3, advanced:99};
  const cap = expBaseCap[experience||'intermediate']||3;
  const base = Math.min(baselineMiles||1, cap);
  const longCap = {beginner:14, intermediate:20, advanced:22}[experience||'intermediate']||20;
  // V157: run_base NEVER tapers — a base block ends on its peak by definition (ruling,
  // V157 session). This kills the two-computation disagreement where THIS function
  // tapered off eventTargeted alone while buildRunSession's taperWks read the
  // volFreeze-aware taperWeeksFor and returned 0 — the arrays shrank in the final
  // weeks with isTaperWeek false, so the user watched volume drop 19% off peak with
  // the note still reading "base building" and no taper label anywhere. Every other
  // goal keeps the eventTargeted taper exactly as before.
  // D106a (V207): the array reads the published window, the one buildRunSession labels
  // from, so a block under six weeks never prints Taper on an undipped long run. The old
  // tw-4 clamp never bound at six weeks or more, so no longer program moves.
  const taperWeeks = taperWeeksFor(goalId !== 'run_base' && eventTargeted, false, totalWeeks);
  const buildWeeks = totalWeeks - taperWeeks;
  function build10pct(startMiles: number, maxMiles: number): number[] {
    const weeks: number[] = [];
    let current = startMiles;
    let lastBuildVal = startMiles;
    // Deload weeks only make sense on programs long enough to absorb a recovery week.
    // On short blocks (<10 weeks) an entire week at -30% volume eats too much of the
    // build; we skip the deload so the long run climbs smoothly into the taper.
    const useDeload = totalWeeks >= 10;
    for (let w = 0; w < buildWeeks; w++) {
      const cyclePos = w % 4;
      if (useDeload && cyclePos === 3) {
        // Recovery week: drop to 70% of last build week for the displayed week...
        const recoveryVal = +(lastBuildVal * 0.70).toFixed(1);
        weeks.push(recoveryVal);
        // ...but RESUME the climb from the pre-deload peak, not from the recovered low.
        // (A deload is a temporary dip, not a loss of fitness — otherwise the long run
        // plateaus near its starting value and never reaches doctrine distances.)
        current = lastBuildVal;
      } else {
        // Hybrid increment: grow by the GREATER of 0.5mi or 10%. Absolute steps when
        // mileage is low (10% of a 2mi run is only +0.2mi — far slower than real plans
        // ramp), transitioning to the percentage rule once runs pass ~5mi. This matches
        // how endurance long runs are actually built.
        const inc = Math.max(0.5, current * 0.10);
        const next = Math.min(maxMiles, +(current + inc).toFixed(1));
        weeks.push(next);
        current = next;
        lastBuildVal = next;
      }
    }
    // D106a (V207): at one or two weeks the block IS the test week and tapers by race-week
    // doctrine, so there are no build weeks. The taper then steps down from startMiles (the
    // athlete's baseline or the experience default this array climbs from), never from
    // Math.max() of nothing, which is -Infinity.
    const peak = weeks.length ? Math.max(...weeks) : startMiles;
    for (let t = 0; t < taperWeeks; t++) {
      const taperPct = 1 - ((t + 1) / (taperWeeks + 1)) * 0.4;
      weeks.push(+(peak * taperPct).toFixed(1));
    }
    return weeks;
  }
  const longStarts: Record<string, Record<Experience, number>> = {
    run_marathon:   {beginner:5.0, intermediate:6.0, advanced:8.0},
    run_half:       {beginner:4.0, intermediate:5.0, advanced:6.5},
    run_10k:        {beginner:2.0, intermediate:3.0, advanced:4.0},
    run_5k:         {beginner:1.5, intermediate:2.5, advanced:3.5},
    run_15_under10: {beginner:1.5, intermediate:2.5, advanced:3.5},
    run_mile_time:  {beginner:1.5, intermediate:2.5, advanced:3.5},
    // Pace goals build the SAME aerobic base as general running fitness (NSW doctrine:
    // a fast 1.5 is built on a large base, not on short jogs). Mirrors run_base.
    run_pace_goal:  {beginner:1.5, intermediate:2.5, advanced:3.5},
    run_base:       {beginner:1.5, intermediate:2.5, advanced:3.5},
  };
  const longMaxes: Record<string, number> = {
    // Marathon breaks doctrine for civilian prep: long runs build toward ~20mi (the climb
    // reaches what the program's weeks allow). Half peaks near race distance. Doctrine-pure
    // goals stay at the NSW ~8mi base ceiling.
    run_marathon:20, run_half:Math.min(13.5,longCap), run_10k:Math.min(8,longCap),
    run_5k:Math.min(5,longCap), run_15_under10:Math.min(8,longCap), run_mile_time:Math.min(8,longCap),
    run_pace_goal:Math.min(8,longCap), run_base:Math.min(8,longCap),
  };
  // V157 (fuzz catch, latent since the tier tables landed): `experience||'intermediate'`
  // only defaults null/undefined — an unrecognized STRING indexed the tier tables to
  // undefined and every distance array went NaN ("NaN mi" sessions, confirmed on the
  // V156 baseline). Unreachable from the app's own writers today, same class as the
  // V156 String() hardening: the moment any caller passes a foreign value, the whole
  // block corrupts. Normalized to the known tiers.
  const exp = (experience === 'beginner' || experience === 'advanced') ? experience : 'intermediate';
  let longStart = (longStarts[goalId]||longStarts.run_base)[exp];
  // BEGINNER = "some running background" (can hold a ~2mi LSD). We start them there
  // rather than from a true couch baseline — a dedicated off-the-couch tier is a future
  // iteration. Their long run still ramps up from this floor over the program.
  if(exp === 'beginner') {
    const RUN_FLOOR = 2.0;
    const actualBase = Math.max(RUN_FLOOR, baselineMiles || RUN_FLOOR);
    longStart = Math.min(longStart, actualBase);
  }
  const longMax   = longMaxes[goalId]||longCap;
  const longArr   = build10pct(longStart, longMax);
  // Easy/recovery runs scale off the long run uniformly — no goal-based suppression.
  // (A fast 1.5 is trained off a real aerobic base, so pace goals build volume like
  // any other runner rather than getting shrunken "speed-only" easy days.)
  const easyMultiplier = 0.65;
  const easyMaxCap = 10;
  const easyStart = Math.max(1, longStart * easyMultiplier);
  const easyMax   = Math.min(longMax * easyMultiplier, easyMaxCap);
  const easyArr   = build10pct(easyStart, easyMax);
  const tempoStart = Math.max(1, longStart * 0.75);
  const tempoMax   = Math.min(longMax * 0.75, 10);
  const tempoArr   = build10pct(tempoStart, tempoMax);
  const intervalArr = easyArr.map(v => Math.max(1, +(v * 0.7).toFixed(1)));

  // ── PACE PROGRESSION (run_pace_goal only) ──
  // Builds a per-week array of realistic target paces with adaptation dampener.
  // If the timeline is too compressed to hit the full goal safely, the working
  // target is scaled back to what's physiologically achievable in totalWeeks.
  let paceProgression: PaceProgression | null = null;
  if(goalId === 'run_pace_goal') {
    // These are passed in via the cfg object attached to the function call site;
    // fall back to safe defaults if not present so the function stays self-contained.
    const expPaceDefaults = {beginner:690, intermediate:570, advanced:450};   // V176 (D9)
    const initialPace  = buildRunProgressionForLength._initialPace  || expPaceDefaults[exp] || 570;
    // E7 (V202): THE CLOCK HOLDS AT CURRENT, IT NEVER DROPS TO A SLOWER GOAL.
    // An athlete whose entered goal is at or slower than the pace they already run AT THE
    // GOAL DISTANCE used to have the whole block parked on the GOAL, which prescribed them
    // slower work than they already do (beginner/km, mile 11:30, goal 2 km in 16:00 read
    // 772.9 s/mi for all six weeks against an anchor of 698.6). The working target is the
    // faster of the two. The ENTERED goal is kept separately so copy can still name it.
    const enteredTarget  = buildRunProgressionForLength._targetPace   || initialPace * 0.85;
    const goalAlreadyMet = enteredTarget >= initialPace;
    const targetPace   = Math.min(enteredTarget, initialPace);

    // D186 (V225): N build weeks are N-1 steps between week 1 and week N.
    // The taper is a primer, it holds the pace the block built and cuts the
    // volume; it never introduces a faster target. The block target IS the
    // last build week's pace, so the gap is divided over N-1 steps, not N,
    // or week N overshoots past the entered target by one step.
    const rawImprovement = (initialPace - targetPace) / Math.max(buildWeeks - 1, 1);

    // Adaptation dampener: physiology caps pace gains, further reduced by age bracket.
    // D101 (V202): one planning rate. The age-scaled table value set at the call site IS the cap.
    // The old ceiling of 12 s/mi/wk and the x2.5 multiplier had no source and let a compressed
    // timeline promise 30 s/mi in a week. Fallback mirrors expPaceDefaults above: the same
    // hand table, unscaled, for the case where the call site did not set the property.
    const maxPaceImprovementPerWeek = buildRunProgressionForLength._paceImprovePerWeek
      || PACE_IMPROVE[exp] || PACE_IMPROVE.intermediate;
    const weeklyImprovement = Math.min(rawImprovement, maxPaceImprovementPerWeek);

    // Realistic achievable target pace given this timeline
    const realisticTargetPace = initialPace - (weeklyImprovement * Math.max(buildWeeks - 1, 0));

    paceProgression = [];
    for(let w = 0; w < totalWeeks; w++) {
      const isTaper = w >= buildWeeks;
      if(isTaper) {
        // Taper weeks: hold the peak pace achieved — don't regress
        paceProgression.push(+realisticTargetPace.toFixed(1));
      } else {
        const weekPace = Math.max(realisticTargetPace, initialPace - (weeklyImprovement * w));
        paceProgression.push(+weekPace.toFixed(1));
      }
    }
    // Attach meta so buildRunSession can surface dampener warnings
    paceProgression._dampened        = weeklyImprovement < rawImprovement;
    paceProgression._weeklyGain      = +weeklyImprovement.toFixed(1);
    paceProgression._realisticTarget = +realisticTargetPace.toFixed(1);
    paceProgression._originalTarget  = +enteredTarget.toFixed(1);
    paceProgression._goalMet         = goalAlreadyMet;
  }

  return {easy:easyArr, interval:intervalArr, tempo:tempoArr, long:longArr, paceProgression};
}

// buildRunSession hands buildRunProgressionForLength the pace goal's inputs as statics on the function (_initialPace and
// the rest), set just before the call and read inside it.
declare namespace buildRunProgressionForLength { var _initialPace: number | null | undefined; var _targetPace: number | null | undefined; var _paceImprovePerWeek: number | null | undefined; }
// The schedule builder hands the run session its later inputs as trailing arguments, read inside as arguments[9] to [19]:
// target distance and seconds, age bracket, mile best, volume freeze, quality phase, taper, pace shift, strides, benchmark, minutes.
function buildRunSession(goalId: string, week: number, dayIdx: number, totalWeeks: number, baselineMiles: number | null | undefined, experience: Experience | null | undefined, forceType: string | null | undefined, eventTargeted: boolean, sessionOverride: string | null | undefined, ...trailing: unknown[]): CardioSession;
function buildRunSession(goalId: string, week: number, dayIdx: number, totalWeeks: number, baselineMiles: number | null | undefined, experience: Experience | null | undefined, forceType: string | null | undefined, eventTargeted: boolean, sessionOverride: string | null | undefined): CardioSession {
  const tw = totalWeeks || 6;
  // V126: the legacy ids are aliased upstream, so this is now simply "is it the pace goal".
  // Kept as a named flag rather than inlined — it reads as intent at four call sites below.
  const isMilGoal = goalId === 'run_pace_goal';
  const sTypes = ['lsd_easy','int','chi','lsd_long','lsd_easy','int','chi'];
  const sType = forceType === 'long' ? 'lsd_long' : (sessionOverride || sTypes[dayIdx % sTypes.length]);
  // D103a (V208): the session class key, stamped on the dose at the return below. It starts
  // from the branch this builder takes; the branches that print a different session say so.
  let _key = {lsd_long:'long', lsd_easy:'easy', chi:'chi', int:'int'}[sType] || null;

  // ── PACE CHART ANCHOR ──
  // Derive training paces from the NRC pace chart using the user's mile best if provided,
  // otherwise fall back to experience-based defaults. A beginner's entry is read like anyone's (D188).
  // mileBestSecs pre-converted and passed as arguments[12] from the schedule builder.
  const _expCurrentPace = {beginner:690, intermediate:570, advanced:450}[experience||'intermediate'] || 570;
  const _mileBestSecs = arguments[12] ? arguments[12] : null;
  const _anchorSec = _mileBestSecs || _expCurrentPace;
  const _chartRow = paceChartLookup('mile', _anchorSec);
  const _fmtPace: (s: number) => string = s => _clkMS(s) + '/mi';   // D126 (V204): seconds limb owned by _clkMS

  // Inject pace params onto function for run_pace_goal before calling progression builder
  if(goalId === 'run_pace_goal') {
    const expPaceDefaults = {beginner:690, intermediate:570, advanced:450};   // V176 (D9)
    const agePaceScale: Record<string, number>    = {'55+':0.65, '36-54':0.85, '18-35':1.0};
    const rawTargetSecs = arguments[10] || null;
    const rawTargetDist = parseFloat(arguments[9]) || 1.5;
    const ageBracket = arguments[11] || '18-35';
    const baseImprove = PACE_IMPROVE[experience||'intermediate'] || PACE_IMPROVE.intermediate;
    // D100 (V202): the pace clock starts where the athlete actually is AT THE DISTANCE THEY
    // ENTERED. Anchoring on the mile pace itself started a 1.5-mile goal at a pace the athlete
    // only holds for a mile, so the goal read "slower" than the anchor and the clock parked flat.
    // _chartRow is already the athlete's own row (entered mile for non-beginners, the V172
    // experience default of 690 for beginners, gated at the anchor above); rowPaceAt reads that
    // row at the goal distance, so the beginner's default row converts on the same terms.
    buildRunProgressionForLength._initialPace  = rowPaceAt(_chartRow, rawTargetDist);
    buildRunProgressionForLength._targetPace   = rawTargetSecs
      ? (rawTargetSecs / rawTargetDist)
      : buildRunProgressionForLength._initialPace * 0.85;
    buildRunProgressionForLength._paceImprovePerWeek = +(baseImprove * (agePaceScale[ageBracket] || 1.0)).toFixed(2);
  } else {
    buildRunProgressionForLength._initialPace = null;
    buildRunProgressionForLength._targetPace  = null;
    buildRunProgressionForLength._paceImprovePerWeek = null;
  }

  const prog = buildRunProgressionForLength(goalId, tw, baselineMiles||1.5, experience||'intermediate', eventTargeted);
  // ── HYPERTROPHY VOLUME FREEZE ──
  // When this run is base cardio under a strength/size focus (flag passed as
  // arguments[13]), endurance volume must NOT progress — it would eat into muscular
  // recovery. Hard-lock every easy/long session to a flat 2.0 mi ceiling across ALL
  // weeks: no 0.5mi/week climb, no 3.0+ mi long runs. A deload still reads lower if the
  // underlying array dipped, but it can never climb above the freeze ceiling.
  const _volFreeze = arguments[13] === true;
  if(_volFreeze) {
    // V140 (Q7): "build your base" now builds. For run_base the ceiling itself climbs —
    // 2 miles to 4 across the block, still every session easy, still no intervals, still
    // no long-run leg fatigue. The governor's INTENT (nothing competes with lifting)
    // survives untouched; only the flatline goes. Cutback dips in the underlying arrays
    // survive the min() exactly as before. Every other governed case keeps the 2.0 cap.
    let FREEZE_MI = goalId === 'run_base'
      ? Math.min(4.0, 2.0 + ((week-1) / Math.max(tw-1, 1)) * 2.0)
      : 2.0;
    // The climbing cap became the binding constraint everywhere, which silently removed
    // run_base's cutback dips — the one modality off the shared w%4 clock. Step the cap
    // itself back on cutback weeks so the easy run deloads with the rest of the program.
    if(goalId === 'run_base' && isCardioCutbackWeek(week, tw)) FREEZE_MI = Math.max(2.0, +(FREEZE_MI * 0.8).toFixed(2));
    if(prog.easy) prog.easy = prog.easy.map(v => Math.min(v, FREEZE_MI));
    if(prog.long) prog.long = prog.long.map(v => Math.min(v, FREEZE_MI));
  }
  const wIdx = Math.min(week-1, tw-1);
  // V115: optional quality-phase window, passed only when the compressed 3-day quality
  // slot is periodized. Follows this file's existing trailing-`arguments[N]` convention
  // (see _volFreeze above) rather than widening an already-long signature. Shape:
  // {intSpan, chiFrom, chiTo}. Absent => the un-periodized ramps, unchanged.
  const _qph = arguments[14] || null;
  let intReps = getINTReps(week, tw, isMilGoal, _qph && _qph.intSpan);
  // D137 (V206): 12 is Table 6's last single-piece CHI row. From week 13 the rows are
  // two-piece, and the base limb prints one continuous piece, so run_base holds on row 12.
  // The cap goes to the row reader, never to `week`: the cutback clock keeps the real week.
  let chi = getCHI(week, tw, isMilGoal, _qph && _qph.chiFrom, _qph && _qph.chiTo, goalId === 'run_base' ? 12 : 0);
  let detail = '', note = '', subtype = '';
  // V148: structured dose. The prescription's fixed dimension, in numbers, so the log
  // form can key on it instead of regexing prose. Text is presentation; dose is data.
  let _dose: CardioDose | null = null;
  // V116: taper is handed down from buildCardioProgression (arguments[15]) so all three
  // builders read ONE computation. The local fallback stays for any direct caller.
  const _tapIn = arguments[15] || null;
  const taperWks = _tapIn ? _tapIn.of : taperWeeksFor(eventTargeted, arguments[13] === true, tw);
  const isTaperWeek = _tapIn ? _tapIn.step > 0 : (taperWks > 0 && week > tw - taperWks);
  // ── V115: THE TAPER REACHES THE QUALITY SESSIONS ────────────────────────────
  // `isTaperWeek` has existed since the taper landed, but ONLY the lsd_long branch below
  // ever read it. INT and CHI ran peak volume straight through race week — a 12-week pace
  // goal finished on its single largest interval session two days before the test. NSW is
  // explicit that tapering improves performance, and the whole point of the taper is to
  // arrive fresh. This was invisible because CHI was unreachable on a 3-day pace goal
  // until V115 made the quality slot periodized, and the INT case simply was not read.
  // Volume down, INTENSITY HELD — same rule the cutback branches already follow: the
  // pace clock does not loosen, the dose does. Sharpness is kept, fatigue is shed.
  if(isTaperWeek){
    intReps = Math.max(2, Math.round(intReps * 0.55));
    chi = {reps: Math.max(1, chi.reps - 1), minPerRep: Math.max(8, Math.round(chi.minPerRep * 0.6)), note: chi.note};
  }
  // ── D2b (V142): EFFECTIVE PACE INDEX — every paceProgression read goes through ──
  // _ppIdx, never raw wIdx. The map (arguments[16]) holds quality-suppressed weeks
  // strictly before each week; the pace clock resumes from the last pace actually
  // trained. No map, or shift 0 → _ppIdx === wIdx and output is byte-identical.
  // D2b-ii: with a shift, the effective index can still be climbing when the
  // calendar enters taper. Taper never chases pace — volume down, intensity HELD —
  // so taper weeks freeze at the last pace reached before taper entry.
  // NOTE FOR FUTURE BUILDS: reading pp[wIdx] raw anywhere reintroduces the lie
  // silently. Grep for _ppIdx before adding any paceProgression consumer.
  const _psMap = arguments[16] || null;
  const _psShift = _psMap ? (_psMap[week]||0) : 0;
  let _ppIdx = Math.max(0, wIdx - _psShift);
  const _ftw = tw - taperWks + 1;
  const _psTap = (_psMap && _ftw>=1 && _ftw<=tw) ? (_psMap[_ftw]||0) : 0;
  if(isTaperWeek && _psTap > 0){ _ppIdx = Math.max(0, (tw - taperWks - 1) - _psTap); }
  // ── ONE CLOCK FOR EVERY RUN (V125) ──
  // _chartRow is anchored ONCE, off a static mile best or an experience default, and never
  // moves. paceProgression moves every week. V116 put TEMPO on the progression and left
  // recovery on the frozen chart, so the two systems drifted apart and could cross: on slow
  // beginner pace goals the computed tempo came out SLOWER than the prescribed easy pace in
  // 36 of 486 sessions. A clamp forced tempo 30 s/mi faster than recovery, which bound in
  // 54 of 486 — always in the safe direction, but a guard, not a fix.
  // The fix is to re-anchor the WHOLE chart row on this week's progression pace, so every
  // session in the week reads off the same clock and crossing is arithmetically impossible
  // rather than merely caught. Scoped to run_pace_goal because it is the only goal with a
  // progression array; every other goal keeps the frozen row exactly as before.
  // Cutback weeks hold the PRIOR week's pace, matching the INT and CHI branches — the pace
  // clock does not tighten on a recovery week.
  let _row = _chartRow;
  if(goalId === 'run_pace_goal' && prog.paceProgression){
    const _cbR = isCardioCutbackWeek(week, tw);
    const _wkR = prog.paceProgression[(_cbR && _ppIdx > 0) ? _ppIdx - 1 : _ppIdx];  // D2b: effective index
    if(_wkR) _row = paceChartLookup('mile', _wkR);
  }
  // ── V158: BENCHMARK RUN (run_base, weeks 1 + final) ──────────────────────────
  // The block's measurement instrument: the same 20 minutes at the same even effort,
  // run twice. Pace is an OUTPUT here in the purest sense — the dose deliberately
  // carries NO tgt and NO cap, because a printed pace on a benchmark anchors the very
  // number the session exists to measure (same anti-anchor doctrine as V131's
  // pre-fill rule, extended to prescriptions). Distance covered at fixed effort IS
  // the result; the retest card reads week 1 back at RENDER time (buildCardioHTML),
  // never at build time — prog.weeks is a build artifact and the log is the record.
  // The scheduler decides WHICH day (arguments[18]); this branch only owns the text.
  const _bench = arguments[18] === true && goalId === 'run_base';
  if(_bench) {
    const _retest = week === tw && tw > 1;
    subtype = _retest ? 'Benchmark Run — Retest' : 'Benchmark Run';
    _key = 'bench';
    if(_retest) {
      detail = '20 min at a steady RPE 6 out of 10. Comfortably hard, a short sentence between breaths. This is the SAME run you did in week 1. Hold the effort dead even from first minute to last. No surging, no fading. Log the distance you covered.';
      note = 'BENCHMARK RETEST: Further than week 1 at the same effort = faster pace = the aerobic engine grew. This is the block\u2019s report card. No pace is prescribed on purpose. The pace is the measurement.';
    } else {
      detail = '20 min at a steady RPE 6 out of 10. Comfortably hard, a short sentence between breaths. Hold the effort dead even from first minute to last. No surging, no fading. Log the distance you covered.';
      note = 'BENCHMARK: Your baseline. The final week repeats this exact run, and the distance difference is your fitness gain. Measured, not promised. No pace is prescribed on purpose. Run by effort and let the distance tell the story.';
    }
    _dose = {k:'time', mins:20};
  } else if(sType === 'lsd_long') {
    const dist = prog.long[wIdx];
    const recPace = _fmtPace(_row.recovery);
    subtype = isTaperWeek ? 'Long Slow Distance (LSD) — Taper' : 'Long Slow Distance (LSD)';
    if(goalId === 'run_base') {
      // V157: base long runs are time-prescribed like every other base easy run — see
      // the lsd_easy branch for the full doctrine note. Same conversion, same ceiling;
      // this is simply the week's LONGER easy run. run_base never tapers (V157), so no
      // taper text here by construction.
      const _steadySecL = steadyCapSec(_row);
      const _minsL = Math.max(15, Math.round((dist * _row.recovery / 60) / 5) * 5);
      subtype = 'Easy Run — Long';
      detail = _minsL + ' min easy and conversational (RPE 3-4 out of 10). Around ' + recPace + ' is right for you. Do not run faster than ' + _fmtPace(_steadySecL) + '. This is the longest run of your week. Time on feet is the goal. Log the distance you covered.';
      if(_row.recovery > 840) detail += ' Walk breaks are fine and smart: run 3 min, walk 1 min, repeat. Effort stays conversational either way.';
      note = 'EASY RUN: The aerobic engine builds at conversational effort. Time in the zone is the dose, not miles and not speed. If it feels almost too easy, it is working.' + (isCardioCutbackWeek(week, tw) ? ' CUTBACK WEEK: less time on purpose this week so the training absorbs. Same effort. Do not add minutes.' : '');
      _dose = {k:'time', mins:_minsL, tgt:Math.round(_row.recovery), cap:_steadySecL};
    } else {
      detail = dist + ' mi at Recovery Pace: ' + recPace + ' (Zone 2).' + (isTaperWeek ? ' Taper week. Distance reduced intentionally.' : '') + '\n60–70% max HR. You must be able to speak in full sentences the entire time. If you cannot, slow down. Bring water if over 5 miles.';
      note = isTaperWeek ? 'TAPER: Your body is absorbing weeks of training. Resist the urge to add miles. Show up to the start line fresh, not tired from one last big effort.' : 'LSD: The foundation of endurance. Go easy. The aerobic engine builds here, not in the fast runs.';
      _dose = {k:'dist', mi:dist, tgt:Math.round(_row.recovery)};
    }
  } else if(sType === 'lsd_easy') {
    const dist = prog.easy[wIdx];
    const recPace = _fmtPace(_row.recovery);
    subtype = 'Long Slow Distance (LSD)';
    if(goalId === 'run_base') {
      // ── V157: BASE EASY RUNS PRESCRIBE TIME, NOT DISTANCE ─────────────────────
      // In a base block pace is an OUTPUT, not a target — you run by effort and the
      // pace at that effort drifting faster IS the adaptation. Distance prescriptions
      // fixed two of three dimensions (2 mi AND 12:53/mi), violating the doctrine that
      // the prescription owns ONE fixed dimension and the log captures the free one.
      // Time is the fixed dimension here; distance and pace are both free. Time also
      // normalizes the stimulus across runners — "2 mi" is 26 min for a 13:00/mi
      // runner and 16 min for an 8:00/mi runner; "30 min" is 30 min for everyone.
      // The chart recovery pace survives as an "around" anchor, and the ceiling is
      // the steady-aerobic pace ((tempo+recovery)/2) — the app's own definition of
      // "slightly faster than easy": anything quicker than steady IS the quality
      // session, so an easy run capped at steady can never silently become one.
      // Single-clock rule holds: everything still derives from one chart row.
      const _steadySec = steadyCapSec(_row);
      // V159: the scheduler's weekly-budget split arrives as arguments[19] and wins over
      // the dist-derived minutes (which remain the unfrozen path's source). A budgeted
      // session past 40 min is the block's designated long run — label it so.
      const _minsOv = (typeof arguments[19] === 'number' && arguments[19] > 0) ? arguments[19] : null;
      const _mins = _minsOv || Math.max(15, Math.round((dist * _row.recovery / 60) / 5) * 5);
      const _strides = arguments[17] === true;
      subtype = 'Easy Run' + ((_minsOv && _minsOv > 40) ? ' — Long' : '') + (_strides ? ' + Strides' : '');
      if(_minsOv && _minsOv > 40) _key = 'long';
      detail = _mins + ' min easy and conversational (RPE 3-4 out of 10). Around ' + recPace + ' is right for you. Do not run faster than ' + _fmtPace(_steadySec) + '. Distance is not the goal; time on feet is. Log the distance you covered.';
      // Below ~14:00/mi continuous running mechanics genuinely degrade — doctrine's
      // answer (Galloway, NRC beginner audio runs) is run/walk, not a faster easy pace.
      if(_row.recovery > 840) detail += ' Walk breaks are fine and smart: run 3 min, walk 1 min, repeat. Effort stays conversational either way.';
      if(_strides) detail += '\nFinish with 4 x 20 sec strides. Fast but relaxed, about 90% speed, walk back for full recovery. Strides keep your legs fast while the engine builds.';
      note = 'EASY RUN: The aerobic engine builds at conversational effort. Time in the zone is the dose, not miles and not speed. If it feels almost too easy, it is working.' + (isCardioCutbackWeek(week, tw) ? ' CUTBACK WEEK: less time on purpose this week so the training absorbs. Same effort. Do not add minutes.' : '');
      _dose = {k:'time', mins:_mins, tgt:Math.round(_row.recovery), cap:_steadySec};
    } else {
      detail = dist + ' mi at Recovery Pace: ' + recPace + ' (Zone 2).\n60–70% max HR. Full sentences, no gasping. This is your recovery run. Not a tempo, not a push. If in doubt, go slower.';
      note = 'LSD: Recovery and base building. These runs feel almost too easy. That is correct. Do not push the pace here.';
      _dose = {k:'dist', mi:dist, tgt:Math.round(_row.recovery)};
    }
  } else if(sType === 'chi') {
    const chiMins = chi.minPerRep;
    const chiReps = chi.reps;
    // ── V116: TEMPO PACE READS THE ATHLETE'S PROGRESSION, NOT A STATIC LOOKUP ──
    // PACE_CHART is a lookup keyed on MILE BEST. When the athlete supplies one it is
    // fine. When they do not — the common case — it falls back to an experience default
    // (9:30/mi for intermediate) that has nothing to do with their stated goal, and the
    // resulting tempo pace is then FLAT for the whole block while the goal pace walks
    // from 9:30 to 8:05. By week 12 the session read "RPE 8-9, you should not be able to
    // hold a conversation" at 11:00/mi — 2:55/mi slower than goal race pace and only 70
    // seconds faster than the athlete's own recovery pace. The pace and the RPE in the
    // same sentence contradicted each other.
    //
    // The multiplier is NSW's, not invented: the PTG's worked example puts a 6:00/mi
    // 1.5-mile runner's Long Intervals at 6:20-6:40/mi — +5.6% to +11.1%. 1.08 is the
    // midpoint, and it is symmetric with the x0.95 the INT branch already applies, so
    // both quality sessions finally read off one clock.
    //
    // Scoped to run_pace_goal ONLY, because paceProgression is built for that goal alone.
    // run_mile_time and run_15_under10 are isMilGoal but have no progression array, so
    // they keep the chart until they get one (§12).
    let tempoPace = _fmtPace(_chartRow.tempo);
    let _tempoSec = _chartRow.tempo;   // V148: numeric twin of tempoPace for the dose
    if(goalId === 'run_pace_goal' && prog.paceProgression){
      // Cutback holds the PRIOR week's target, exactly as the INT branch does — the pace
      // clock does not tighten on a recovery week.
      const _ppT = prog.paceProgression;
      const _cbT = isCardioCutbackWeek(week, tw);
      const _wkT = _ppT[(_cbT && _ppIdx > 0) ? _ppIdx - 1 : _ppIdx];  // D2b: effective index
      // Tempo stays 8% off the week's goal pace (V116). Recovery now comes from the SAME
      // week's row (see _row above), so the V116 clamp is gone: both numbers are derived
      // from one anchor and can no longer disagree about which week it is.
      if(_wkT){ tempoPace = _fmtPace(_wkT * 1.08); _tempoSec = _wkT * 1.08; }
    }
    subtype = 'Long Interval (LI)' + (isTaperWeek ? ' — Taper' : '');
    if(goalId === 'run_base') {
      // Base-building: the one quality day is a GENTLE aerobic-threshold effort, not a
      // hard lactate-threshold grind. Slightly faster than easy, still controlled. The
      // goal of a base block is the aerobic engine, not threshold punishment.
      const steadyPace = _fmtPace(Math.round((_row.tempo + _row.recovery)/2));
      subtype = 'Steady Aerobic Run';
      _key = 'steady';
      detail = chiMins + ' min steady at ' + steadyPace + ' (RPE 6 out of 10). Comfortably hard. You can speak a short sentence between breaths. This is aerobic threshold work, not a sprint.';
      note = 'STEADY AEROBIC: A controlled effort just above easy pace. Builds aerobic capacity without the recovery cost of hard intervals. If you finish feeling you could do more, that is correct for a base block.';
      _dose = {k:'time', mins:chiMins, tgt:Math.round((_row.tempo + _row.recovery)/2)};
    } else if(chiReps === 1) {
      detail = chiMins + ' min continuous at Tempo Pace: ' + tempoPace + ' (RPE 8-9 out of 10). Hard but controlled. Labored breathing, short phrases only. You should NOT be able to hold a conversation.';
      _dose = {k:'time', mins:chiMins, tgt:Math.round(_tempoSec)};
      note = 'LI: Zone 3-4 (85-95% max HR). Hard sustained effort at tempo pace. As fitness improves, add reps before adding pace.';
    } else {
      detail = chiReps + ' x ' + chiMins + ' min at Tempo Pace: ' + tempoPace + ' (RPE 8-9 out of 10). Recovery: ' + Math.round(chiMins/2) + ' min easy jog between reps. Keep moving. Do not stop.';
      _dose = {k:'reps_time', reps:chiReps, mins:chiMins, tgt:Math.round(_tempoSec)};
      note = 'LI: Zone 3-4 (85-95% max HR). Hard sustained effort at tempo pace. As fitness improves, add reps before adding pace.';
    }
  } else if(sType === 'int') {
    subtype = 'Short Interval (SI)' + (isTaperWeek ? ' — Taper' : '');
    // ── V202 D105: RECOVERY IS 2 TO 2.5 x THE WORK INTERVAL, NOT A FIXED 200m ──
    // Guide A is explicit twice. A 248-249: "allowing a recovery period of 2-2.5 times
    // the amount of time it takes to perform the work interval". A 268-270: "Allow
    // enough recovery time after each interval to maintain the proper work intensity
    // (2-2.5 x the work time). To promote faster, more complete recovery, use active
    // recovery." Both Short Interval table headers say the same thing
    // (doctrine/ptg2020_tables_p13_14_16_17.txt lines 9 and 41 — those tables are
    // HAND-TRANSCRIBED from screenshots of p13 and p16, not OCR).
    // The old fixed "walk or jog 200m" measured 0.685x the work time across 11,880 of
    // 11,880 INT sessions: about a third of the doctrine MINIMUM. A recovery that short
    // turns speed work into a threshold session run on incomplete rest.
    // 1609.344 is the metres in a mile. It is a unit, not a coaching number.
    const _M_PER_MILE = 1609.344;
    const _intClk: (t: number) => string = t => _clkMS(t);   // D126 (V204): seconds limb owned by _clkMS. Bare, no suffix.
    // tgt is the session's OWN prescribed pace in s/mi, so the recovery, the printed pace
    // and the logged dose all read off one number.
    const _intRec = (tgt: number, metres: number) => {
      const work = tgt * metres / _M_PER_MILE;
      const lo = Math.round(work * 2), hi = Math.round(work * 2.5);
      return { lo, hi, txt: 'Recovery: ' + _intClk(lo) + ' to ' + _intClk(hi) + ' of easy jogging or walking. Keep moving.' };
    };
    // ── V202: WARM-UP COMES FROM GUIDE B, NOT GUIDE A ──────────────────────────
    // D112 limb 2: guide A says nothing about warming up for a Short Interval session,
    // so guide B fills the silence. B p8 (doctrine/nsw_ptg_sealswcc_11pg.txt): "For CHI
    // and INT workouts, you should warm up for 10-15 minutes or more. Gradually build
    // intensity from an easy jog or stroke for several minutes. Then add 4-5
    // high-intensity bursts lasting from 15 to 30 seconds." Cool-down, same page: extend
    // "until you are breathing easily". The old "5 min easy warmup + cooldown" was a
    // third of what B asks for and is in neither guide.
    const _INT_WARMUP = 'Warm up 10 to 15 minutes. Build from an easy jog. Add 4 to 5 bursts of 15 to 30 seconds. Cool down until breathing is easy.';
    if(isMilGoal) {
      if(goalId === 'run_pace_goal') {
        // Pull week-specific pace directly from the dampened progression array.
        // Cutback week holds the PRIOR week's target: fewer reps at the same pace is
        // the cutback prescription — the pace clock does not tighten on a recovery week.
        const pp = prog.paceProgression;
        const _cb = isCardioCutbackWeek(week, tw);
        const weekPace   = pp ? pp[(_cb && _ppIdx > 0) ? _ppIdx - 1 : _ppIdx] : null;  // D2b: effective index
        // ── V202 D111: A's SUBTRACTION, NOT A PROPORTION ───────────────────────
        // A 251-252: "For running, your 400m interval pace should be about 4 seconds
        // faster than your base pace". 400m is A's own quarter mile, so 4 s per 400m is
        // a flat 16 s per mile. The old x0.95 was a proportion nobody wrote down: at a
        // 5:00 mile it takes off 3.75 s per 400 (A asks 4), but at a 12:00 mile it takes
        // off 9 s per 400, more than twice A's rule, and the slow end is the population
        // this guide serves. The CHI branch keeps its x1.08 — that multiplier IS A's own
        // worked example for Long Intervals, a different rule for a different session.
        const INT_PACE_GAIN_SEC_PER_MILE = 16;   // 4 s per 400m x 4 quarters
        const intPace    = weekPace ? Math.max(pp!._realisticTarget! - INT_PACE_GAIN_SEC_PER_MILE, weekPace - INT_PACE_GAIN_SEC_PER_MILE) : null;
        if(pp && weekPace && intPace) {
          const fmt: (s: number) => string = s => _clkMS(s);   // D126 (V204): seconds limb owned by _clkMS. Bare; callers append '/mi'.
          const _intTgt = Math.round(intPace);
          const _rec = _intRec(_intTgt, 400);
          // The recovery band prints as a clock in both limbs, so the sentence coach ruled
          // is written out verbatim rather than assembled from _rec.txt.
          const lo = _intClk(_rec.lo), hi = _intClk(_rec.hi);
          detail = _cb
            ? `${intReps}x400m at ${fmt(intPace)}/mi. Cutback week. Same target as last week, fewer reps. Recovery: ${lo} to ${hi} of easy jogging or walking. Keep moving. ${_INT_WARMUP}`
            : `${intReps}x400m at ${fmt(intPace)}/mi. This week's goal pace is ${fmt(weekPace)}/mi. Recovery: ${lo} to ${hi} of easy jogging or walking. Keep moving. ${_INT_WARMUP}`;
          // rec is ADDITIVE on the dose: {lo,hi} in seconds, so the log form and any later
          // reader can see the prescribed recovery band without re-parsing the sentence.
          _dose = {k:'reps_dist', reps:intReps, m:400, tgt:_intTgt, rec:{lo:_rec.lo, hi:_rec.hi}};
          if(_cb) {
            note = 'CUTBACK WEEK: Same target pace as last week, fewer reps. The reduced dose is the plan working, not a soft day. Absorb the block and do not add reps.';
          } else if(pp._goalMet) {
            note = 'Your goal pace is already within your current pace. This block holds your pace and builds your reps.';
          } else if(pp._dampened || _psShift > 0) {
            // D2b-iii (V142): with a shift, quoting the unshifted _realisticTarget is a
            // lie — the block now ends before the clock gets there. The honest reachable
            // pace is the progression value at the final effective index (last pre-taper
            // week minus the shift standing at taper entry).
            const goalFmt = fmt(pp._originalTarget!);
            const _reachIdx = _psShift > 0 ? Math.max(0, (tw - taperWks - 1) - (_psTap || _psShift)) : null;
            const reachFmt = fmt(_reachIdx != null && pp[_reachIdx] != null ? pp[_reachIdx] : pp._realisticTarget!);
            const _sameFmt = goalFmt === reachFmt;   // D186: at the m:ss grain the block lands on the goal. Do not say the goal needs more weeks and then hand it over.
            note = _sameFmt
              ? `SI: Pace moves ${pp._weeklyGain} seconds per mile each week. The target for this block is ${reachFmt}/mi. Hit the prescribed pace precisely.`
              : `SI: Pace moves ${pp._weeklyGain} seconds per mile each week. Your full goal of ${goalFmt}/mi needs more weeks than this block has. The target for this block is ${reachFmt}/mi. Hit the prescribed pace precisely.`;
          } else {
            note = 'SI: Zone 5 (95%+ max HR) on work efforts. All out on each rep. Take the full recovery. Build from 4 reps to 8. Hard cap at 8. Quality over quantity. If pace drops, stop.';
          }
          // D2b-iii (V142), re-sited V202 (S1): this appendix is about the SHIFT, not about
          // which class of note fired. It only ever sat inside the dampened limb because that
          // limb happened to be the one that also fired on the shift; once a goal-met limb was
          // added above it (V202 slice 5) a goal-met athlete under an injury shift silently
          // lost the sentence. ONE predicate at ONE site, appended to whichever INT note fires,
          // rather than the same predicate copied into every limb to drift apart later.
          if(_psShift > 0) note += ' PACE CLOCK: Injury time froze your targets. This week resumes from the last pace you trained, not the calendar week.';
        } else {
          // Fallback: use chart 5K pace for interval target
          const intChartPace = _fmtPace(_chartRow.fiveK);
          const _intTgtF = Math.round(_chartRow.fiveK);
          const _recF = _intRec(_intTgtF, 400);
          detail = intReps + 'x400m at 5K Pace: ' + intChartPace + '. ' + _recF.txt + ' ' + _INT_WARMUP;
          _dose = {k:'reps_dist', reps:intReps, m:400, tgt:_intTgtF, rec:{lo:_recF.lo, hi:_recF.hi}};
          note = 'SI: Zone 5 (95%+ max HR) on work efforts. All out on each rep. Take the full recovery. Build from 4 reps to 8. Hard cap at 8. Quality over quantity. If pace drops, stop.';
        }
      } else {
        // run_15_under10, run_mile_time — use chart 5K pace for interval pace
        const intChartPace = _fmtPace(_chartRow.fiveK);
        detail = intReps + 'x400m at 5K Pace: ' + intChartPace + '. Recovery: walk or jog 200m between each (2-2.5x work time). 5 min easy warmup + cooldown.';
        _dose = {k:'reps_dist', reps:intReps, m:400, tgt:Math.round(_chartRow.fiveK)};
        note = 'SI: Zone 5 (95%+ max HR) on work efforts. All out on each rep. Take the full recovery. Build from 4 reps to 8. Hard cap at 8. Quality over quantity. If pace drops, stop.';
      }
    } else {
      // 5K, 10K, base, half, marathon — use chart 5K pace for interval pace
      const intChartPace = _fmtPace(_chartRow.fiveK);
      detail = intReps + 'x800m at 5K Pace: ' + intChartPace + ' (RPE 8, hard sustainable effort). Recovery: 90s walk/jog between reps. Keep moving. 5 min warmup + cooldown.';
      _dose = {k:'reps_dist', reps:intReps, m:800, tgt:Math.round(_chartRow.fiveK)};
      note = 'SI: Zone 5 (95%+ max HR) on work efforts. All out on each rep. Take the full recovery. Build from 4 reps to 8. Hard cap at 8. Quality over quantity. If pace drops, stop.';
    }
  }
  if(_dose && _key) _dose.key = _key;   // D103a: readers go key first; NRC, bike and swim carry none
  return {type:'run', subtype, detail, note, week, goalId, dose:_dose||undefined};
}

// the module exports (scripts/module-blocks.mjs writes them; build-index.mjs strips them)
export {
  NSW_TABLE6_INT, buildRunSession, calcProgramLength, getCHIBike, getCHISwim, getINTBike, getINTReps,
  isCardioCutbackWeek, paceGoalTarget,
};
