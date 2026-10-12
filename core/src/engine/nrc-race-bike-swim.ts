import { _ISO_ORDER, _isoOf, _parseLocalDate, getWeekMonday } from './calendar.ts';
import { _clkMS } from './clock-format.ts';
import { getCHIBike, getCHISwim, getINTBike, getINTReps, isCardioCutbackWeek } from './nsw-cardio.ts';
import { paceChartLookup, steadyCapSec } from './cardio-progression.ts';
// end of the module imports (scripts/module-blocks.mjs writes them; build-index.mjs strips them)
import type { CardioDose, CardioGoal, CardioSegment, DayKey, Experience } from '../domain/index.ts';
import type { PaceCol } from './cardio-progression.ts';
import type { CardioSession, QualityPhase, TaperStep } from './nsw-cardio.ts';

/** A swim time goal's weekly paces (seconds per 100), and what the progression found on the way. */
export type SwimPace = number[] & { _dampened?: boolean; _weeklyGain?: number; _realisticTarget?: number; _originalTarget?: number; _goalMet?: boolean; _baseEntered?: boolean; _expDefault?: number; _dist?: number; _goal100?: number | null; _unit?: string };

/** Days and whole weeks from today to a race (raceCountdown). */
export interface RaceCountdown { days: number; weeks: number }
/** An NRC race goal laid back from its race date (raceAlignment). */
export interface RaceAlignment { tw: number; raceIso: string; raceDay: DayKey; raceMon: string; start: string; weeksOut: number; openWeek: number; floor: number; underFloor: boolean; futureWeeks: number; behindWeeks: number }
/** The race week's pin (raceWeekPin), carried on the cfg for one build (cfg._racePin, deleted before the cfg is stored). */
export interface RacePin { w: number; race: DayKey; from: string | null; rest: string[]; test?: boolean; slots?: { w: number; d: DayKey; t: string }[]; shakeout?: string }
/** One week of a Nike Run Club plan, as transcribed: the long run, the speed sessions, the recovery runs (minutes, or a distance). */
export interface NrcWeek {
  long: { val: number; unit: 'mi' | 'min'; label: string; race?: boolean; rehearsal?: boolean; peak?: boolean; taper?: boolean; cutback?: boolean; hold?: boolean };
  speed: { type: string; detail: string; detailIfHalfSlow?: string }[];
  recovery: (number | { mi: number; label: string })[];
}

// ════════════════════════════════════════════════════════════════════
// NRC ENGINE — 5K (8 wk) + 10K (8 wk) + Half Marathon (14 wk) + Marathon (18 wk)
// TABLE-DRIVEN: transcribed directly from the Nike Run Club PDFs so the
// plan matches Nike to the mile, including their irregular cutback weeks
// (marathon steps back at wk 4/7/13; half at wk 10/12) which a formula
// can't reproduce. Each week lists its long run, speed run(s), and the
// recovery-run durations exactly as Nike prescribes. Paces come from the
// shared pace chart. Marathon = 1 speed + 3 recovery; 5K/10K/Half = 2 speed + 2.
// V186: RACE → NRC, TEST → NSW. run_5k / run_10k are race goals and ride these
// tables; run_pace_goal / run_mile_time / run_15_under10 / run_base are the PST-
// shaped goals and stay on the NSW engine. NRC_GOALS is the single routing set.
// ════════════════════════════════════════════════════════════════════
const NRC_GOALS: ReadonlySet<unknown> = new Set(['run_5k', 'run_10k', 'run_half', 'run_marathon']);
// V205 (D125): the NSW pace family — the test goals whose weekly shape is INT + CHI +
// long + easy. The wizard aliases run_mile_time / run_15_under10 to run_pace_goal before
// the engine sees a cfg (_GOAL_ALIAS, V126); both legacy ids are listed anyway so this
// set answers the question for a cfg from any era. run_base is NOT here: a Lydiard block
// has no hard day to space, so the spacing chooser has nothing to choose.
const PACE_GOALS: ReadonlySet<unknown> = new Set(['run_pace_goal', 'run_mile_time', 'run_15_under10']);
// D187: seconds per mile per week, a planning rate, not a limit; the age scalers
// multiply it; the same number sizes the undated block and caps the clock (D101).
const PACE_IMPROVE: Record<string, number> = {beginner:3, intermediate:3, advanced:2};
// V188 (D14a): race alignment. Count BACK from the race, not forward from today.
// Plan lengths are the table lengths; floors are the source's own minimums (app copy
// says "I don't recommend", never names the source — ruled V188).
const NRC_PLAN_WEEKS: Record<string, number> = {run_5k:8, run_10k:8, run_half:14, run_marathon:18};
const NRC_PLAN_FLOOR: Record<string, number> = {run_5k:4, run_10k:4, run_half:6, run_marathon:12};
const NRC_SHORTER: Record<string, string>    = {run_marathon:'run_half', run_half:'run_10k', run_10k:'run_5k'};
// D182 (V223): raceCountdown(raceIso, todayIso?) → {days, weeks} from local midnight today
// to the race, or null when a date is unreadable. Pure like raceAlignment: dates in, numbers
// out, no DOM, no WD, no program object. It takes the ISO, not an alignment, so a test goal
// carrying a date (D106a) counts down too. Days are rounded BEFORE weeks are floored, so a
// span across a DST change still counts whole days (a raw floor of ms/7 days loses a week).
function raceCountdown(raceIso: string | null | undefined, todayIso?: string | null): RaceCountdown | null{
  const race = _parseLocalDate(raceIso); if(!race) return null;
  const today = todayIso ? _parseLocalDate(todayIso) : new Date(); if(!today) return null;
  today.setHours(0,0,0,0);
  // @ts-expect-error date arithmetic (a Date minus a Date is its milliseconds); the cleanup pass reads getTime()
  const days = Math.round((race - today)/86400000);
  return {days, weeks: Math.floor(days/7)};
}
// D182 (V223): raceCountdownWords(cd) → {card, copy} for a raceCountdown result, null on null.
// Pure: it takes the countdown, never the program. The ruling's table, key stays "Time out":
// 7 or more days counts weeks (the unit a plan is built in), race week counts days, day 0 is
// the header's own "Race day", and past the race is "Behind you" (neutral on whether he ran it).
function raceCountdownWords(cd: RaceCountdown | null | undefined): { card: string; copy: string } | null{
  if(!cd || !isFinite(cd.days)) return null;
  const d = cd.days, w = cd.weeks;
  if(d >= 7){ const n = w+' week'+(w===1?'':'s'); return {card:n, copy:n+' out'}; }
  if(d >= 1){ const n = d+' day'+(d===1?'':'s');  return {card:n, copy:n+' out'}; }
  if(d === 0) return {card:'Race day', copy:'race day'};
  return {card:'Behind you', copy:'behind you'};
}
// raceAlignment(goalId, raceIso, eventOn, todayIso?) → null when not an aligned goal, else
// {tw, raceIso, raceDay (ISO key), raceMon, start (Monday ISO), weeksOut, openWeek,
//  floor, underFloor, futureWeeks}. Pure: dates in, dates out, no DOM, no WD.
function raceAlignment(goalId: string | null | undefined, raceIso: string | null | undefined, eventOn: boolean | null | undefined, todayIso?: string | null): RaceAlignment | null{
  if(!NRC_GOALS.has(goalId) || eventOn === false || !raceIso) return null;
  const race = _parseLocalDate(raceIso); if(!race) return null;
  const tw = NRC_PLAN_WEEKS[goalId!];
  const raceMon = getWeekMonday(raceIso);
  const start = new Date(raceMon); start.setDate(raceMon.getDate() - (tw-1)*7); start.setHours(0,0,0,0);
  const today = todayIso ? _parseLocalDate(todayIso)! : new Date(); today.setHours(0,0,0,0);
  const todayMon = getWeekMonday(_isoOf(today));
  const weeksOut = raceCountdown(raceIso, todayIso)!.weeks;   // D182: one day-count in the file
  // @ts-expect-error date arithmetic (a Date minus a Date is its milliseconds); the cleanup pass reads getTime()
  const openWeek = Math.max(1, Math.min(tw, Math.round((todayMon - start)/86400000/7) + 1));
  // @ts-expect-error date arithmetic (a Date minus a Date is its milliseconds); the cleanup pass reads getTime()
  const futureWeeks = Math.max(0, Math.round((start - todayMon)/86400000/7));
  const floor = NRC_PLAN_FLOOR[goalId!];
  // @ts-expect-error date arithmetic (a Date minus a Date is its milliseconds); the cleanup pass reads getTime()
  return {tw, raceIso, raceDay:_ISO_ORDER[Math.round((race - raceMon)/86400000)], raceMon:_isoOf(raceMon),
          start:_isoOf(start), weeksOut, openWeek: futureWeeks ? 1 : openWeek, floor, underFloor: weeksOut < floor, futureWeeks,
          behindWeeks: futureWeeks ? 0 : openWeek - 1};
}
// D106a (V207): the program week that holds a test date. Same Monday arithmetic as
// _progDayDate / getWeekMonday: week N runs from Mon(start) + 7(N-1) days to the Sunday
// after. Pure: dates in, a week number out, no DOM, no WD. Local dates only (no UTC parse),
// and the day count is rounded so a DST change inside the span cannot move the week.
// Null when a date is unreadable or the test falls before the start.
function testWeekIndex(startIso: string | null | undefined, raceIso: string | null | undefined): number | null{
  const s = _parseLocalDate(startIso), t = _parseLocalDate(raceIso);
  if(!s || !t || t < s) return null;
  // @ts-expect-error date arithmetic (a Date minus a Date is its milliseconds); the cleanup pass reads getTime()
  const days = Math.round((getWeekMonday(_isoOf(t)) - getWeekMonday(_isoOf(s))) / 86400000);
  return Math.floor(days / 7) + 1;   // week 1 is the week holding the start
}
// The race-week pin: race day is the entered date's weekday; every train day AFTER it in
// race week rests; the day that held the race session (found by the cardio engine, by
// subtype — never by position, which fails under the spacer and in multi-sport) rests
// too and is appended to `rest` there. Null only when there is no alignment.
function raceWeekPin(align: Pick<RaceAlignment, 'tw' | 'raceDay'> | null | undefined, trainDays: DayKey[] | null | undefined): RacePin | null{
  if(!align) return null;
  const iso = _ISO_ORDER.filter(d => (trainDays||[]).includes(d));
  const ri = _ISO_ORDER.indexOf(align.raceDay);
  const after = iso.filter(d => _ISO_ORDER.indexOf(d) > ri);
  return {w: align.tw, race: align.raceDay, from: null, rest: after};
}
// V171 (D4a): both tables re-transcribed line-for-line against the Nike PDFs after the
// audit found four half speed sessions stored as titles only, Power Pyramid without its
// recoveries, Nike's 15:00 recovery run dropped from 12 half weeks, and nine distance-
// based recovery runs stored as guessed minute counts. Grammar (D2): detail strings are
// line-per-segment on \n — line 1 is the headline the compact renderers read; the
// day card converts \n to <br>. {mile}/{fiveK}/{tenK}/{tempo}/{half}/{recovery} fill
// from the athlete's chart row. Recovery entries: minutes, or {mi,label} (D4b).
// Range long runs dose the LOW end of Nike's range (D4d). hold:true = same distance
// as last week on purpose (D4e).
const NRC_MARATHON_TABLE: NrcWeek[] = [
  {long:{val:5,unit:'mi',label:'5 Mile Run'}, speed:[{type:'Intervals',detail:'8 × 1:00 at 5K Pace — 8:00 of work\n5:00 warm up\n8 × 1:00 at 5K Pace ({fiveK})\n1:00 easy recovery between every effort'}], recovery:[10,{mi:2,label:'2 Mile'},7]},
  {long:{val:6.2,unit:'mi',label:'10K Run'}, speed:[{type:'Intervals',detail:'Mixed-pace ladder down to Best — 10:00 of work, 10 efforts\n5:00 warm up\n1:00 at 5K Pace ({fiveK})\n2:00 at 10K Pace ({tenK})\n1:00 at 5K Pace ({fiveK})\n2 × 0:45 at Mile Pace ({mile})\n2:00 at 10K Pace ({tenK})\n1:00 at 5K Pace ({fiveK})\n0:45 at Mile Pace ({mile})\n0:30 at Best Pace\n0:15 at Best Pace\n1:00 easy recovery between every effort'}], recovery:[12,{mi:3.1,label:'5K'},{mi:1,label:'1 Mile'}]},
  {long:{val:7,unit:'mi',label:'7 Mile Run'}, speed:[{type:'Fartlek',detail:'21:00 fartlek — 1:00 hard, 2:00 easy\n5:00 warm up\n21:00 fartlek: alternate 1:00 hard running and 2:00 easy running for 21:00'}], recovery:[15,{mi:3.1,label:'5K'},25]},
  {long:{val:6.2,unit:'mi',label:'10K Run',cutback:true}, speed:[{type:'Hills',detail:'Hill workout — 5 rounds of 10K effort into Best effort\n5:00 warm up\n5 rounds of:\n\u00a0\u00a00:45 uphill at 10K Effort — 1:15 recovery\n\u00a0\u00a00:15 uphill at Best Effort — 0:45 recovery'}], recovery:[20,30,35]},
  {long:{val:8,unit:'mi',label:'8 Mile Run'}, speed:[{type:'Intervals',detail:'5K reps around a 10:00 tempo — 22:00 of work\n7:00 warm up\n3 × 2:00 at 5K Pace ({fiveK}) — 1:00 recovery after each\n10:00 at Tempo Pace ({tempo}) — 2:00 recovery\n3 × 2:00 at 5K Pace ({fiveK}) — 1:00 recovery after each'}], recovery:[25,40,45]},
  {long:{val:10,unit:'mi',label:'10 Mile Run'}, speed:[{type:'Intervals',detail:'3 rounds of a 5K rep and four Mile-pace bursts — 15:00 of work\n5:00 warm up\n3 rounds of:\n\u00a0\u00a03:00 at 5K Pace ({fiveK}) — 2:00 recovery\n\u00a0\u00a04 × 0:30 at Mile Pace ({mile}) — 1:00 recovery after each'}], recovery:[30,35,45]},
  {long:{val:9.32,unit:'mi',label:'15K Run',cutback:true}, speed:[{type:'Tempo',detail:'20:00 tempo\n7:00 warm up\n20:00 at Tempo Pace ({tempo})'}], recovery:[35,30,48]},
  {long:{val:12.5,unit:'mi',label:'20K Run'}, speed:[{type:'Intervals',detail:'3 × 7:00 at 5K Pace — 21:00 of work\n5:00 warm up\n3 × 7:00 at 5K Pace ({fiveK})\n2:30 easy recovery between efforts'}], recovery:[35,25,60]},
  {long:{val:13.1,unit:'mi',label:'Half Marathon Run'}, speed:[{type:'Tempo',detail:'25:00 tempo\n7:00 warm up\n25:00 at Tempo Pace ({tempo})'}], recovery:[45,32,33]},
  {long:{val:120,unit:'min',label:'Two Hour Run'}, speed:[{type:'Intervals',detail:'5 × 5:00 at 10K Pace — 25:00 of work\n5:00 warm up\n5 × 5:00 at 10K Pace ({tenK})\n2:00 easy recovery between efforts'}], recovery:[50,60,33]},
  {long:{val:14,unit:'mi',label:'14–16 Mile Run'}, speed:[{type:'Tempo',detail:'Out strong, back fast — 23:00 tempo\n5:00 warm up\n23:00 tempo at Tempo Pace ({tempo}):\nfirst 12:00 out — strong and controlled\nlast 11:00 back — progressively faster\nGoal: cover the same distance out and back'}], recovery:[40,35,30]},
  {long:{val:16,unit:'mi',label:'16–18 Mile Run'}, speed:[{type:'Hills',detail:'Hill workout — 3 rounds of 10K, 5K and Mile efforts\n5:00 warm up\n3 rounds of:\n\u00a0\u00a01:00 uphill at 10K Effort — 2:00 recovery\n\u00a0\u00a00:45 uphill at 5K Effort — 1:30 recovery\n\u00a0\u00a00:30 uphill at Mile Effort — 1:00 recovery'}], recovery:[60,30,30]},
  {long:{val:90,unit:'min',label:'90 Minute Run',cutback:true}, speed:[{type:'Intervals',detail:'3 rounds of 10K → 5K → Mile — 42:00 of work\n5:00 warm up\n3 rounds of:\n\u00a0\u00a08:00 at 10K Pace ({tenK}) — 3:00 recovery\n\u00a0\u00a04:00 at 5K Pace ({fiveK}) — 2:00 recovery\n\u00a0\u00a02:00 at Mile Pace ({mile}) — 2:00 recovery'}], recovery:[65,31,30]},
  {long:{val:18,unit:'mi',label:'18–22 Mile Run',peak:true}, speed:[{type:'Fartlek',detail:'21:00 fartlek — 2:00 hard, 1:00 easy\n5:00 warm up\n21:00 fartlek: alternate 2:00 hard running and 1:00 easy running for 21:00'}], recovery:[75,25,30]},
  {long:{val:15,unit:'mi',label:'15–16 Mile Run',taper:true}, speed:[{type:'Intervals',detail:'Power pyramid — 22:00 of work, Mile to 10K and back\n5:00 warm up\n1:00 at Mile Pace ({mile}) — 0:30 recovery\n5:00 at 5K Pace ({fiveK}) — 2:30 recovery\n10:00 at 10K Pace ({tenK}) — 3:00 recovery\n5:00 at 5K Pace ({fiveK}) — 2:30 recovery\n1:00 at Mile Pace ({mile})'}], recovery:[45,45,25]},
  {long:{val:12,unit:'mi',label:'12–14 Mile Run',taper:true}, speed:[{type:'Tempo',detail:'8K tempo, bookended by 2K easy\n2K warm up\n8K at Tempo Pace ({tempo})\n2K cool down'}], recovery:[80,25,30]},
  {long:{val:10,unit:'mi',label:'10 Mile Run',taper:true}, speed:[{type:'Intervals',detail:'Mile to 10K, then 7:00 easy — 9:00 of work\n6:00 warm up\n1:00 at Mile Pace ({mile}) — 0:30 recovery\n3:00 at 5K Pace ({fiveK}) — 1:30 recovery\n5:00 at 10K Pace ({tenK}) — 2:30 recovery\n7:00 at Recovery Pace ({recovery})'}], recovery:[45,{mi:4,label:'4 Mile'},60]},
  {long:{val:26.2,unit:'mi',label:'THE RACE',race:true}, speed:[{type:'Tempo',detail:'15:00 progression tempo — Recovery Pace down to Best\n5:00 warm up\nRun the next 15:00 as one continuous progression:\n5:00 at Recovery Pace ({recovery})\n4:00 at 10K Pace ({tenK})\n3:00 at 5K Pace ({fiveK})\n2:00 at Mile Pace ({mile})\n1:00 at Best Pace'}], recovery:[{mi:3.1,label:'5K'},25,{mi:1,label:'1 Mile'}]},
];

const NRC_HALF_TABLE: NrcWeek[] = [
  {long:{val:3.1,unit:'mi',label:'5K Run'}, speed:[{type:'Intervals',detail:'8 × 1:00 at 5K Pace — 8:00 of work\n5:00 warm up\n8 × 1:00 at 5K Pace ({fiveK})\n1:00 easy recovery between every effort'},{type:'Fartlek',detail:'21:00 fartlek — 1:00 hard, 2:00 easy\n5:00 warm up\n21:00 fartlek: alternate 1:00 hard running and 2:00 easy running for 21:00'}], recovery:[15,25]},
  {long:{val:4,unit:'mi',label:'4 Mile Run'}, speed:[{type:'Intervals',detail:'Mixed-pace ladder — 9:00 of work, 5 efforts\n5:00 warm up\n1:00 at Mile Pace ({mile})\n2:00 at 5K Pace ({fiveK})\n3:00 at 10K Pace ({tenK})\n2:00 at 5K Pace ({fiveK})\n1:00 at Mile Pace ({mile})\n1:00 easy recovery between every effort'},{type:'Intervals',detail:'5K reps with a Mile-pace kicker — 15:00 of work, 10 efforts\n5:00 warm up\n4 × 1:30 at 5K Pace ({fiveK}) — 0:45 recovery after each\n1 × 1:30 at Mile Pace ({mile}) — 1:00 recovery\n4 × 1:30 at 5K Pace ({fiveK}) — 0:45 recovery after each\n1 × 1:30 at Mile Pace ({mile}) — 1:00 recovery'}], recovery:[15,35]},
  {long:{val:5,unit:'mi',label:'5 Mile Run'}, speed:[{type:'Hills',detail:'Hill workout — 5 rounds of 10K effort into Best effort\n5:00 warm up\n5 rounds of:\n\u00a0\u00a00:45 uphill at 10K Effort — 1:15 recovery\n\u00a0\u00a00:15 uphill at Best Effort — 0:45 recovery'},{type:'Intervals',detail:'3 × 7:00 at 5K Pace — 21:00 of work\n5:00 warm up\n3 × 7:00 at 5K Pace ({fiveK})\n2:30 easy recovery between efforts'}], recovery:[15,30]},
  {long:{val:6.2,unit:'mi',label:'10K Run'}, speed:[{type:'Intervals',detail:'Descending ladder of Mile and 5K reps — 18:00 of work, 12 efforts\n5:00 warm up\n3 × 1:00 at Mile Pace ({mile}) — 1:00 recovery after each\n3 × 2:00 at 5K Pace ({fiveK}) — 1:30 recovery after each\n2 × 1:00 at Mile Pace ({mile}) — 1:00 recovery after each\n2 × 2:00 at 5K Pace ({fiveK}) — 1:30 recovery after each\n1 × 1:00 at Mile Pace ({mile}) — 1:00 recovery\n1 × 2:00 at 5K Pace ({fiveK})'},{type:'Tempo',detail:'25:00 tempo\n7:00 warm up\n25:00 at Tempo Pace ({tempo})'}], recovery:[15,40]},
  {long:{val:6.2,unit:'mi',label:'10K Run',hold:true}, speed:[{type:'Intervals',detail:'3 rounds of a 5K rep and three Mile-pace bursts — 11:15 of work\n5:00 warm up\n3 rounds of:\n\u00a0\u00a01:30 at 5K Pace ({fiveK})\n\u00a0\u00a03 × 0:45 at Mile Pace ({mile})\n1:00 easy recovery between every effort'},{type:'Tempo',detail:'23:00 progression tempo — Marathon Pace to 10K Pace\n5:00 warm up\nRun the next 23:00 as one continuous progression:\n8:00 at Marathon Pace ({marathon})\n8:00 at Half Marathon Pace ({half})\n7:00 at 10K Pace ({tenK})',
    // V176 (D31): Nike's own chart has half (14:05) SLOWER than marathon (13:45) on the
    // 12:00 row — their 6:00:00 marathon floor. Where the middle rung would run
    // backwards it is dropped: two rungs, both Nike's numbers, more time at the easier
    // pace before the close. Fires on row 15 today; dies on its own if Nike fixes it.
    detailIfHalfSlow:'23:00 progression tempo — Marathon Pace to 10K Pace\n5:00 warm up\nRun the next 23:00 as one continuous progression:\n12:00 at Marathon Pace ({marathon})\n11:00 at 10K Pace ({tenK})'}], recovery:[15,30]},
  {long:{val:8,unit:'mi',label:'8 Mile Run'}, speed:[{type:'Intervals',detail:'20 × 0:30 at Mile Pace — 10:00 of work\n5:00 warm up\n20 × 0:30 at Mile Pace ({mile}) — run #1 and #11 at 5K Pace ({fiveK})\n1:00 easy recovery between every effort'},{type:'Hills',detail:'Hill workout — 3 rounds of 10K, 5K and Mile efforts\n5:00 warm up\n3 rounds of:\n\u00a0\u00a01:00 uphill at 10K Effort — 2:00 recovery\n\u00a0\u00a00:45 uphill at 5K Effort — 1:30 recovery\n\u00a0\u00a00:30 uphill at Mile Effort — 1:00 recovery'}], recovery:[15,45]},
  {long:{val:9.5,unit:'mi',label:'15K Run'}, speed:[{type:'Intervals',detail:'Four blocks, each shifting straight into Mile Pace — 14:00 of work\n5:00 warm up\n4:00 at Recovery Pace ({recovery}) → straight into 1:00 at Mile Pace ({mile}), then 1:00 recovery\n3:00 at 10K Pace ({tenK}) → straight into 1:00 at Mile Pace ({mile}), then 1:30 recovery\n2:00 at 5K Pace ({fiveK}) → straight into 1:00 at Mile Pace ({mile}), then 2:00 recovery\n1:00 at Mile Pace ({mile}) → straight into 1:00 at Best Pace'},{type:'Intervals',detail:'Power pyramid — 22:00 of work, Mile to 10K and back\n5:00 warm up\n1:00 at Mile Pace ({mile}) — 0:30 recovery\n5:00 at 5K Pace ({fiveK}) — 2:30 recovery\n10:00 at 10K Pace ({tenK}) — 3:00 recovery\n5:00 at 5K Pace ({fiveK}) — 2:30 recovery\n1:00 at Mile Pace ({mile})'}], recovery:[15,31]},
  {long:{val:10,unit:'mi',label:'10 Mile Run'}, speed:[{type:'Intervals',detail:'10 × 2:00 at 5K Pace — 20:00 of work\n5:00 warm up\n10 × 2:00 at 5K Pace ({fiveK})\n1:00 easy recovery between efforts — 2:00 after #4 and #8'},{type:'Fartlek',detail:'15:00 fartlek — 1:00 hard, 1:00 easy\n5:00 warm up\n15:00 fartlek: alternate 1:00 hard running and 1:00 easy running for 15:00'}], recovery:[15,35]},
  {long:{val:10,unit:'mi',label:'10 Mile Run',hold:true}, speed:[{type:'Intervals',detail:'Pyramid from 10K to Best and back — 18:00 of work, 8 efforts\n6:00 warm up\n5:00 at 10K Pace ({tenK}) — 1:30 recovery\n2:30 at 5K Pace ({fiveK}) — 1:30 recovery\n1:00 at Mile Pace ({mile}) — 1:00 recovery\n0:30 at Best Pace — 1:00 recovery\n0:30 at Best Pace — 1:00 recovery\n1:00 at Mile Pace ({mile}) — 1:00 recovery\n2:30 at 5K Pace ({fiveK}) — 1:30 recovery\n5:00 at 10K Pace ({tenK})'},{type:'Tempo',detail:'8K tempo, bookended by 2K easy\n2K warm up\n8K at Tempo Pace ({tempo})\n2K cool down'}], recovery:[15,35]},
  {long:{val:8,unit:'mi',label:'13.1K Dress Rehearsal',cutback:true,rehearsal:true}, speed:[{type:'Intervals',detail:'3 rounds of 5K → 10K → Mile — 13:30 of work\n5:00 warm up\n3 rounds of:\n\u00a0\u00a01:30 at 5K Pace ({fiveK}) — 1:30 recovery\n\u00a0\u00a01:30 at 10K Pace ({tenK}) — 1:30 recovery\n\u00a0\u00a01:30 at Mile Pace ({mile}) — 1:30 recovery'},{type:'Intervals',detail:'5K reps around a 10:00 tempo — 22:00 of work\n7:00 warm up\n3 × 2:00 at 5K Pace ({fiveK}) — 1:00 recovery after each\n10:00 at Tempo Pace ({tempo}) — 2:00 recovery\n3 × 2:00 at 5K Pace ({fiveK}) — 1:00 recovery after each'}], recovery:[15,45]},
  {long:{val:12.5,unit:'mi',label:'20K Run',peak:true}, speed:[{type:'Intervals',detail:'5 × 5:00 at 10K Pace — 25:00 of work\n5:00 warm up\n5 × 5:00 at 10K Pace ({tenK})\n2:00 easy recovery between efforts'},{type:'Fartlek',detail:'21:00 fartlek — 2:00 hard, 1:00 easy\n5:00 warm up\n21:00 fartlek: alternate 2:00 hard running and 1:00 easy running for 21:00'}], recovery:[15,45]},
  {long:{val:60,unit:'min',label:'One Hour Run',cutback:true}, speed:[{type:'Intervals',detail:'3 rounds of 10K → 5K → Mile — 42:00 of work\n5:00 warm up\n3 rounds of:\n\u00a0\u00a08:00 at 10K Pace ({tenK}) — 3:00 recovery\n\u00a0\u00a04:00 at 5K Pace ({fiveK}) — 2:00 recovery\n\u00a0\u00a02:00 at Mile Pace ({mile}) — 2:00 recovery'},{type:'Tempo',detail:'15:00 progression tempo — Recovery Pace down to Best\n5:00 warm up\nRun the next 15:00 as one continuous progression:\n5:00 at Recovery Pace ({recovery})\n4:00 at 10K Pace ({tenK})\n3:00 at 5K Pace ({fiveK})\n2:00 at Mile Pace ({mile})\n1:00 at Best Pace'}], recovery:[15,60]},
  {long:{val:7,unit:'mi',label:'7 Mile Run',taper:true}, speed:[{type:'Intervals',detail:'3 rounds of a 5K rep and four Mile-pace bursts — 15:00 of work\n5:00 warm up\n3 rounds of:\n\u00a0\u00a03:00 at 5K Pace ({fiveK}) — 2:00 recovery\n\u00a0\u00a04 × 0:30 at Mile Pace ({mile}) — 1:00 recovery after each'},{type:'Intervals',detail:'Mile to 10K, then 7:00 easy — 9:00 of work\n6:00 warm up\n1:00 at Mile Pace ({mile}) — 0:30 recovery\n3:00 at 5K Pace ({fiveK}) — 1:30 recovery\n5:00 at 10K Pace ({tenK}) — 2:30 recovery\n7:00 at Recovery Pace ({recovery})'}], recovery:[15,{mi:3.1,label:'5K'}]},
  {long:{val:13.1,unit:'mi',label:'THE RACE',race:true}, speed:[{type:'Intervals',detail:'Race-week sharpener — 11:00 of work around 5:00 at race pace\n5:00 warm up\n1:00 at 5K Pace ({fiveK})\n2:00 at 10K Pace ({tenK})\n5:00 at Half Marathon Pace ({half})\n2:00 at 10K Pace ({tenK})\n1:00 at 5K Pace ({fiveK})\n1:00 easy recovery between every effort'}], recovery:[15,25,{mi:2,label:'2 Mile'}]},
];

// V186: NRC 5K plan — Nike's 8-week "5K Training Program", 8 weeks to go → race week,
// transcribed page-by-page. Long runs are Nike's, in Nike's units (minutes for wks 2–5).
// W1 First Speed Run carries the 5:00 warm up that Nike prints on the half/marathon page
// of the identically named run (ruled V186 §7a, same doctrine as D31: the source's own
// numbers). Race week recovery is 5K / 25:00 / 1K — the 1K is the shakeout (F5).
const NRC_5K_TABLE: NrcWeek[] = [
  {long:{val:1,unit:'mi',label:'One Mile Run'}, speed:[{type:'Intervals',detail:'8 × 1:00 at 5K Pace — 8:00 of work\n5:00 warm up\n8 × 1:00 at 5K Pace ({fiveK})\n1:00 easy recovery between every effort'},{type:'Intervals',detail:'Mixed-pace ladder down to Best — 10:00 of work, 10 efforts\n5:00 warm up\n1:00 at 5K Pace ({fiveK})\n2:00 at 10K Pace ({tenK})\n1:00 at 5K Pace ({fiveK})\n2 × 0:45 at Mile Pace ({mile})\n2:00 at 10K Pace ({tenK})\n1:00 at 5K Pace ({fiveK})\n0:45 at Mile Pace ({mile})\n0:30 at Best Pace\n0:15 at Best Pace\n1:00 easy recovery between every effort'}], recovery:[5,7]},
  {long:{val:15,unit:'min',label:'15 Minute Run'}, speed:[{type:'Intervals',detail:'On the Move — Mile bursts between 5K and 10K reps, 6:00 of work, 7 efforts\n5:00 warm up\n0:30 at Mile Pace ({mile})\n1:00 at 5K Pace ({fiveK})\n0:30 at Mile Pace ({mile})\n2:00 at 10K Pace ({tenK})\n0:30 at Mile Pace ({mile})\n1:00 at 5K Pace ({fiveK})\n0:30 at Mile Pace ({mile})\n0:45 easy recovery between every effort'},{type:'Intervals',detail:'Faster Fun — descending Mile reps with 10K floats, 8:00 of work, 9 efforts\n5:00 warm up\n2:00 at Mile Pace ({mile})\n0:30 at 10K Pace ({tenK})\n1:30 at Mile Pace ({mile})\n0:30 at 10K Pace ({tenK})\n1:00 at Mile Pace ({mile})\n0:30 at 10K Pace ({tenK})\n1:00 at Mile Pace ({mile})\n0:30 at 10K Pace ({tenK})\n0:30 at Best Pace\n0:30 easy recovery between every effort'}], recovery:[10,12]},
  {long:{val:25,unit:'min',label:'Easy Run'}, speed:[{type:'Fartlek',detail:'How Fartlek Can You Go — 9:15 of work, 14 efforts, recovery equals the effort\nContinuous fartlek run — every hard interval is followed by easy running of the SAME length:\n2 × 1:30 at 10K Pace ({tenK}) — 1:30 easy after each\n3 × 1:00 at 5K Pace ({fiveK}) — 1:00 easy after each\n4 × 0:30 at Mile Pace ({mile}) — 0:30 easy after each\n5 × 0:15 at Best Pace — 0:15 easy after each'},{type:'Fartlek',detail:'15:00 fartlek — 1:00 hard, 1:00 easy\n5:00 warm up\n15:00 fartlek: alternate 1:00 hard running and 1:00 easy running for 15:00'}], recovery:[{mi:2,label:'2 Mile'},20]},
  {long:{val:30,unit:'min',label:'Just A Run'}, speed:[{type:'Intervals',detail:'Rhythm and Roll — 5K bursts around a 3:00 10K rep, 8:00 of work, 11 efforts\n5:00 warm up\n0:30 at Mile Pace ({mile})\n4 × 0:30 at 5K Pace ({fiveK})\n3:00 at 10K Pace ({tenK})\n4 × 0:30 at 5K Pace ({fiveK})\n0:30 at Mile Pace ({mile})\n0:30 easy recovery between every effort'},{type:'Intervals',detail:'3 rounds of 5K, Mile and two Best bursts — 10:30 of work\n5:00 warm up\n3 rounds of:\n\u00a0\u00a02:00 at 5K Pace ({fiveK}) — 1:00 recovery\n\u00a0\u00a01:00 at Mile Pace ({mile}) — 0:30 recovery\n\u00a0\u00a02 × 0:15 at Best Pace — 0:30 recovery after the first\n2:00 easy recovery between rounds'}], recovery:[25,{mi:1,label:'1 Mile'}]},
  {long:{val:33,unit:'min',label:'Fuel the Run'}, speed:[{type:'Intervals',detail:'In the Zone — 5 × 4:00 at 5K Pace, 20:00 of work\n5:00 warm up\n5 × 4:00 at 5K Pace ({fiveK})\n2:00 recovery after the 1st and 3rd efforts\n2:30 recovery after the 2nd and 4th efforts'},{type:'Tempo',detail:'Out strong, back fast — 23:00 tempo\n5:00 warm up\n23:00 tempo at Tempo Pace ({tempo}):\nfirst 12:00 out — strong and controlled\nlast 11:00 back — progressively faster\nGoal: cover the same distance out and back'}], recovery:[25,25]},
  {long:{val:4,unit:'mi',label:'4 Mile Run',peak:true}, speed:[{type:'Intervals',detail:'Go Fast — Mile reps growing 0:30 → 1:30, each chased by 0:15 at Best, 6:15 of work\n5:00 warm up\n0:30 at Mile Pace ({mile}) → 0:15 at Best Pace — 0:30 recovery\n0:45 at Mile Pace ({mile}) → 0:15 at Best Pace — 0:45 recovery\n1:00 at Mile Pace ({mile}) → 0:15 at Best Pace — 1:00 recovery\n1:15 at Mile Pace ({mile}) → 0:15 at Best Pace — 1:15 recovery\n1:30 at Mile Pace ({mile}) → 0:15 at Best Pace\nRecovery grows 0:15 after every pair'},{type:'Tempo',detail:'25:00 tempo\n7:00 warm up\n25:00 at Tempo Pace ({tempo})'}], recovery:[30,31]},
  {long:{val:3.1,unit:'mi',label:'5K Run',taper:true}, speed:[{type:'Hills',detail:'Hill workout — 5 rounds of 10K effort into Best effort\n5:00 warm up\n5 rounds of:\n\u00a0\u00a00:45 uphill at 10K Effort — 1:15 recovery\n\u00a0\u00a00:15 uphill at Best Effort — 0:45 recovery'},{type:'Intervals',detail:'10K bookends around 5K and Mile reps — 15:30 of work, 8 efforts\n8:00 warm up\n3:00 at 10K Pace ({tenK}) — 1:30 recovery\n1:00 at Mile Pace ({mile})\n2:00 at 5K Pace ({fiveK})\n1:00 at Mile Pace ({mile})\n2:00 at 5K Pace ({fiveK})\n1:00 at Mile Pace ({mile})\n5:00 at 10K Pace ({tenK})\n0:30 at Best Pace\n1:00 easy recovery between every other effort'}], recovery:[35,25]},
  {long:{val:3.1,unit:'mi',label:'THE RACE',race:true}, speed:[{type:'Tempo',detail:'15:00 progression tempo — Recovery Pace down to Best\n5:00 warm up\nRun the next 15:00 as one continuous progression:\n5:00 at Recovery Pace ({recovery})\n4:00 at 10K Pace ({tenK})\n3:00 at 5K Pace ({fiveK})\n2:00 at Mile Pace ({mile})\n1:00 at Best Pace'}], recovery:[{mi:3.1,label:'5K'},25,{mi:0.62,label:'1K'}]},
];

// V186: NRC 10K plan — Nike's 8-week "10K Training Program". W2 "Another 5K Run" is a
// hold (D4e shape). W6's long run prints "Seven Mile Run — 11.25K/3.1 Mile Run" on Nike's
// page: the label and the kilometres both say 7 mi, so 7 is transcribed (ruled V186 §7b).
const NRC_10K_TABLE: NrcWeek[] = [
  {long:{val:3.1,unit:'mi',label:'5K Run'}, speed:[{type:'Intervals',detail:'8 × 1:00 at 5K Pace — 8:00 of work\n5:00 warm up\n8 × 1:00 at 5K Pace ({fiveK})\n1:00 easy recovery between every effort'},{type:'Intervals',detail:'Mixed-pace ladder down to Best — 10:00 of work, 10 efforts\n5:00 warm up\n1:00 at 5K Pace ({fiveK})\n2:00 at 10K Pace ({tenK})\n1:00 at 5K Pace ({fiveK})\n2 × 0:45 at Mile Pace ({mile})\n2:00 at 10K Pace ({tenK})\n1:00 at 5K Pace ({fiveK})\n0:45 at Mile Pace ({mile})\n0:30 at Best Pace\n0:15 at Best Pace\n1:00 easy recovery between every effort'}], recovery:[{mi:2,label:'2 Mile'},25]},
  {long:{val:3.1,unit:'mi',label:'5K Run',hold:true}, speed:[{type:'Intervals',detail:'10 × 2:00 at 5K Pace — 20:00 of work\n5:00 warm up\n10 × 2:00 at 5K Pace ({fiveK})\n1:00 easy recovery between efforts — 2:00 after #4 and #8'},{type:'Intervals',detail:'Mile to 10K, then 7:00 easy — 9:00 of work\n6:00 warm up\n1:00 at Mile Pace ({mile}) — 0:30 recovery\n3:00 at 5K Pace ({fiveK}) — 1:30 recovery\n5:00 at 10K Pace ({tenK}) — 2:30 recovery\n7:00 at Recovery Pace ({recovery})'}], recovery:[25,15]},
  {long:{val:4,unit:'mi',label:'4 Mile Run'}, speed:[{type:'Intervals',detail:'Slow Down to Speed Up — descending ladder 10K → 5K → Mile → Best, 15:30 of work, 7 efforts\n5:00 warm up\n2 × 3:30 at 10K Pace ({tenK}) — 1:00 recovery after each\n2 × 2:30 at 5K Pace ({fiveK}) — 1:30 recovery after each\n2 × 1:30 at Mile Pace ({mile}) — 2:00 recovery after each\n0:30 at Best Pace'},{type:'Fartlek',detail:'How Fartlek Can You Go — 9:15 of work, 14 efforts, recovery equals the effort\nContinuous fartlek run — every hard interval is followed by easy running of the SAME length:\n2 × 1:30 at 10K Pace ({tenK}) — 1:30 easy after each\n3 × 1:00 at 5K Pace ({fiveK}) — 1:00 easy after each\n4 × 0:30 at Mile Pace ({mile}) — 0:30 easy after each\n5 × 0:15 at Best Pace — 0:15 easy after each'}], recovery:[35,35]},
  {long:{val:5,unit:'mi',label:'5 Mile Run'}, speed:[{type:'Tempo',detail:'25:00 tempo\n7:00 warm up\n25:00 at Tempo Pace ({tempo})'},{type:'Intervals',detail:'5K reps around a 10:00 tempo — 22:00 of work\n7:00 warm up\n3 × 2:00 at 5K Pace ({fiveK}) — 1:00 recovery after each\n10:00 at Tempo Pace ({tempo}) — 2:00 recovery\n3 × 2:00 at 5K Pace ({fiveK}) — 1:00 recovery after each'}], recovery:[40,35]},
  {long:{val:6.2,unit:'mi',label:'10K Run'}, speed:[{type:'Tempo',detail:'Out strong, back fast — 23:00 tempo\n5:00 warm up\n23:00 tempo at Tempo Pace ({tempo}):\nfirst 12:00 out — strong and controlled\nlast 11:00 back — progressively faster\nGoal: cover the same distance out and back'},{type:'Intervals',detail:'3 rounds of 5K, Mile and two Best bursts — 10:30 of work\n5:00 warm up\n3 rounds of:\n\u00a0\u00a02:00 at 5K Pace ({fiveK}) — 1:00 recovery\n\u00a0\u00a01:00 at Mile Pace ({mile}) — 0:30 recovery\n\u00a0\u00a02 × 0:15 at Best Pace — 0:30 recovery after the first\n2:00 easy recovery between rounds'}], recovery:[40,30]},
  {long:{val:7,unit:'mi',label:'7 Mile Run',peak:true}, speed:[{type:'Hills',detail:'Hill workout — 3 rounds of 10K, 5K and Mile efforts\n5:00 warm up\n3 rounds of:\n\u00a0\u00a01:00 uphill at 10K Effort — 2:00 recovery\n\u00a0\u00a00:45 uphill at 5K Effort — 1:30 recovery\n\u00a0\u00a00:30 uphill at Mile Effort — 1:00 recovery'},{type:'Tempo',detail:'20:00 tempo\n7:00 warm up\n20:00 at Tempo Pace ({tempo})'}], recovery:[31,50]},
  {long:{val:6.2,unit:'mi',label:'10K Run',taper:true}, speed:[{type:'Intervals',detail:'3 × 7:00 at 5K Pace — 21:00 of work\n5:00 warm up\n3 × 7:00 at 5K Pace ({fiveK})\n2:30 easy recovery between efforts'},{type:'Intervals',detail:'10K bookends around 5K and Mile reps — 15:30 of work, 8 efforts\n8:00 warm up\n3:00 at 10K Pace ({tenK}) — 1:30 recovery\n1:00 at Mile Pace ({mile})\n2:00 at 5K Pace ({fiveK})\n1:00 at Mile Pace ({mile})\n2:00 at 5K Pace ({fiveK})\n1:00 at Mile Pace ({mile})\n5:00 at 10K Pace ({tenK})\n0:30 at Best Pace\n1:00 easy recovery between every other effort'}], recovery:[45,30]},
  {long:{val:6.2,unit:'mi',label:'THE RACE',race:true}, speed:[{type:'Tempo',detail:'15:00 progression tempo — Recovery Pace down to Best\n5:00 warm up\nRun the next 15:00 as one continuous progression:\n5:00 at Recovery Pace ({recovery})\n4:00 at 10K Pace ({tenK})\n3:00 at 5K Pace ({fiveK})\n2:00 at Mile Pace ({mile})\n1:00 at Best Pace'}], recovery:[{mi:3.1,label:'5K'},25,{mi:1,label:'1 Mile'}]},
];

function buildNRCSession(goalId: string, week: number, totalWeeks: number, sessionType: string, experience: Experience | null | undefined, mileBestSecs: number | null | undefined, recIdx?: number | null, recSlots?: number | null, hasSpeed2?: boolean, recIdxAll?: number | null, eventOn?: boolean | null): CardioSession {
  const isMarathon = goalId === 'run_marathon';
  // V186: four tables, one engine. The 5K/10K plans share the half's 2-speed layout.
  const table = {run_5k:NRC_5K_TABLE, run_10k:NRC_10K_TABLE, run_half:NRC_HALF_TABLE, run_marathon:NRC_MARATHON_TABLE}[goalId] || NRC_HALF_TABLE;
  const _raceName = {run_5k:'5K', run_10k:'10K', run_half:'Half Marathon', run_marathon:'Marathon'}[goalId] || 'Half Marathon';
  const _raceKey  = {run_5k:'fiveK', run_10k:'tenK', run_half:'half', run_marathon:'marathon'}[goalId] as PaceCol || 'half';
  const _eventOn  = eventOn !== false;   // V186 (§4): false → 5K/10K race day is a time trial
  const wIdx = Math.min(Math.max(week - 1, 0), table.length - 1);
  const wk = table[wIdx];

  // Pace chart anchor — mile best if provided, else experience default
  const expCurrentPace = {beginner:690, intermediate:570, advanced:450}[experience||'intermediate'] || 570;
  const anchorSec = mileBestSecs ? mileBestSecs : expCurrentPace;
  const chartRow = paceChartLookup('mile', anchorSec);
  const fmt: (s: number) => string = s => _clkMS(s) + '/mi';   // D126 (V204): seconds limb owned by _clkMS. Suffix stays here.
  // V171 (D1): {mile} is Nike's first chart column — the row anchor itself. Every "Mile
  // Pace" in both tables printed with no number before this because the key did not exist.
  const paces: Record<string, string> = { mile:fmt(chartRow.mile), fiveK:fmt(chartRow.fiveK), tenK:fmt(chartRow.tenK), tempo:fmt(chartRow.tempo),
                  half:fmt(chartRow.half), marathon:fmt(chartRow.marathon), recovery:fmt(chartRow.recovery) };
  const fillPaces: (str: string) => string = str => str.replace(/\{(\w+)\}/g, (m,k) => paces[k] || m);
  const racePace = paces[_raceKey];   // V186: the race's own chart column (5K / 10K / half / marathon)

  // V171 (D4a, race week): a week with ONE Nike speed session on a two-speed layout must
  // not run it twice. The second speed slot becomes that week's extra recovery run —
  // Nike's half race week is 15:00 / speed / 25:00 / 2 mi / race, and this is what
  // makes ours match it. Every recovery-type day in such a week counts the extra slot
  // so the keep-longest rule below sees the same N from every caller.
  const _single = wk.speed.length === 1 && !!hasSpeed2;
  let _type = sessionType;
  let _recIdx = (typeof recIdx === 'number') ? recIdx : 0;
  const _baseSlots = (typeof recSlots === 'number' && recSlots > 0) ? recSlots : 0;
  const _slots = _baseSlots ? _baseSlots + (_single ? 1 : 0) : 0;
  // V186 (F4): on a single-speed week the converted speed2 slot and the real recovery
  // slots index Nike's list in CALENDAR order (recIdxAll = ordinal among recovery + speed2
  // days), not by slot kind — the old `_recIdx = _baseSlots` put the LAST entry on the
  // speed2 day wherever it sat, so a 6-day half ran the 2-mile shakeout on Wednesday and
  // the 25:00 on Friday. Falls back to the old rule when the caller sends no ordinal.
  if(_single){ _recIdx = (typeof recIdxAll === 'number') ? recIdxAll : (_type === 'nrc_speed2' ? _baseSlots : _recIdx); }
  if(_type === 'nrc_speed2' && _single){ _type = 'nrc_recovery'; }

  let subtype = '', detail = '', note = '';
  let _dose: CardioDose | null = null;   // V148: structured dose (see buildRunSession)

  if(_type === 'nrc_long') {
    const L = wk.long;
    // V186 (§4): with no race date, the 5K/10K plans run all 8 weeks and race day is a
    // TIME TRIAL — a race-less athlete finishes with a number (the evidence D11 wants).
    // Half/marathon never reach this branch without a date (they truncate at peak).
    const _tt = L.race && !_eventOn;
    const phaseTag = L.race ? (_tt ? ' — TIME TRIAL' : ' — RACE DAY') : L.rehearsal ? ' — Dress Rehearsal' : L.peak ? ' — Peak' : L.taper ? ' — Taper' : L.cutback ? ' — Cutback' : '';   // V187 (F6)
    subtype = 'Long Run' + phaseTag;
    if(_tt) {
      detail = `${_raceName} time trial. ${L.val} miles at race effort. Target ${racePace}. Warm up 10 minutes easy, then run it like a race: controlled start, even middle, everything you have in the last third.`;
      note = 'TIME TRIAL: No race on the calendar, so this is your race. Log the time. It is the honest measure of the last 8 weeks and the anchor for your next block.';
      _dose = {k:'dist', mi:L.val, tgt:Math.round(chartRow[_raceKey])};
    } else if(L.race) {
      detail = `${L.val} miles. ${_raceName} race day. Target pace ${racePace}. Trust your training, start controlled, finish strong.`;
      note = 'RACE DAY: This is what every week built toward. Hold your goal pace, fuel early and often, and run your own race.';
      _dose = {k:'dist', mi:L.val, tgt:Math.round(chartRow[_raceKey])};
    } else {
      const distStr = L.unit === 'min' ? `${L.val}-minute run` : `${L.val} mile run`;
      // V171 (D6): Nike's progression-run definition — start slower than Recovery Pace,
      // finish faster than it, AVERAGE Recovery Pace. The old copy built to race pace on
      // every long run; Nike never puts race pace in a long run before race day.
      detail = `${L.label}: ${distStr}, run as a progression. Start slower than Recovery Pace, finish faster than it, and average Recovery Pace (${paces.recovery}) across the run. Comfortable the whole way. Average no faster than ${fmt(steadyCapSec(chartRow))}.`;
      // The average is a real number now, so the log readout shows a delta against it.
      // Progress modules filter by subtype before reading tgt, so long runs stay out of
      // the recovery-pace and drift charts.
      _dose = L.unit === 'min' ? {k:'time', mins:L.val, tgt:Math.round(chartRow.recovery), cap:steadyCapSec(chartRow)} : {k:'dist', mi:L.val, tgt:Math.round(chartRow.recovery), cap:steadyCapSec(chartRow)};
      if(L.rehearsal) {
        // V187 (F6): Nike's "13.1K Dress Rehearsal" rehearses the ROUTINE, not the race —
        // it is listed as a long run and the pace stays the progression. The distance
        // steps back the same week (cutback:true still set); this note wins the card.
        note = 'DRESS REHEARSAL: Run this at your race start time, in the shoes and kit you will race in, with the breakfast and fueling you plan to use. Pace stays the progression. This rehearses the routine, not the race. Distance steps back on purpose this week.';
      } else if(L.hold) {
        // V171 (D4e): half wk 5 is "Another 10K Run" — distance held, not cut.
        note = 'HOLD WEEK: Same distance as last week on purpose. Consolidate the last jump before the build resumes. Do not add.';
      } else if(L.cutback) {
        note = 'CUTBACK WEEK: The long run steps back on purpose. These are built in so your body absorbs the prior weeks of load. You come back stronger, not more tired. Do not add distance.';
      } else if(L.peak) {
        note = 'PEAK LONG RUN: Your longest run of the plan. Run it easy and patient. Time on feet is the goal, not speed. Everything after this tapers down.';
      } else if(L.taper) {
        note = 'TAPER: Distance reduced intentionally. Resist adding miles. The work is done. Arrive at the start line fresh.';
      } else {
        note = 'LONG RUN: Easy start, controlled build. This is your most important session of the week. Bring fuel/water for anything over ~75 minutes.';
      }
    }

  } else if(_type === 'nrc_speed1' || _type === 'nrc_speed2') {
    const slot = _type === 'nrc_speed1' ? 0 : 1;
    const sp = wk.speed[Math.min(slot, wk.speed.length - 1)];
    subtype = 'Speed Run — ' + sp.type;
    detail = fillPaces((sp.detailIfHalfSlow && chartRow.half >= chartRow.marathon) ? sp.detailIfHalfSlow : sp.detail);   // V176 (D31)
    // V171 (D1b): Nike's own framing — each pace is the middle of a range — replaces
    // "hit the prescribed paces precisely". Mile/Best are defined where they are used.
    const noteByType: Record<string, string> = {
      Intervals: 'INTERVALS: Hard efforts, easy running between. Each pace is the middle of a range. Slightly faster or slower is fine, you are not a robot. If a pace won\'t hold, shorten the effort rather than grind. Mile Pace is what you could race for one mile (9/10 effort).',
      Tempo: 'TEMPO: A hard but controlled pace, "comfortably uncomfortable." Builds the lactate threshold that lets you hold race pace longer.',
      Fartlek: 'FARTLEK: Swedish for "speed play." Unstructured surges build speed and strength through natural variation. Let effort, not the watch, guide you.',
      Hills: 'HILLS: Develops speed, strength, and form with minimal pounding. Go by effort, not pace. Uphills feel harder at the same pace. Chin up, slight lean.',
    };
    note = noteByType[sp.type] || 'SPEED RUN: Quality over quantity. Nail the prescribed efforts.';
    if(/\bBest (Pace|Effort)\b/.test(detail)) {
      note += ' Best Pace is your call. It is the pace where you feel at your best. At the top of a ladder that means faster than Mile.';
    }

  } else if(_type === 'nrc_recovery') {
    // V171 (D4b/D4c): entries are Nike's, in Nike's order — minutes, or {mi,label} for the
    // distance-based recovery runs. When the layout has fewer recovery slots than Nike
    // entries (4-day half, 3-/4-day marathon), the LONGEST survive: the 15:00 "weeks to
    // go" jog is what Nike would drop, not the week's easy volume. Distance entries are
    // compared by their minutes at Recovery Pace.
    const _entries = (wk.recovery || []).map((r, i) => ({r, i, min: (r && typeof r === 'object') ? (+r.mi || 0) * chartRow.recovery / 60 : (+r || 0)}));
    const _n = _slots ? Math.min(_slots, _entries.length) : _entries.length;
    // V186 (F5): keep-longest is right on a volume week and wrong on race week — there
    // Nike's LAST entry is the shakeout (1 mi / 1K / 2 mi) and keep-longest dropped it,
    // leaving a 25:00 (or a 5K) the day before the race. Race week keeps the LAST N in
    // Nike's order; every other week keeps the longest N, Nike order preserved.
    const _kept = (wk.long && wk.long.race)
      ? _entries.slice(Math.max(0, _entries.length - _n))
      : _entries.slice().sort((a,b) => b.min - a.min).slice(0, _n).sort((a,b) => a.i - b.i);
    const _pick = _kept.length ? _kept[_recIdx % _kept.length].r : 30;
    subtype = 'Recovery Run';
    // V171 (D6): Nike runs recovery runs as progression runs too.
    const _prog = 'Start a touch slower than that, finish a touch faster.';
    if(_pick && typeof _pick === 'object') {
      const _mi = +_pick.mi || 0;
      detail = `${_pick.label} recovery run. ${_mi} mi at Recovery Pace (${paces.recovery}). 4–5/10 effort, easy enough to talk, laugh, or argue freely. ${_prog} Do not run faster than ${fmt(steadyCapSec(chartRow))}.`;
      _dose = {k:'dist', mi:_mi, tgt:Math.round(chartRow.recovery), cap:steadyCapSec(chartRow)};
    } else {
      const recMin = +_pick || 30;
      detail = `${recMin} min recovery run at Recovery Pace (${paces.recovery}). 4–5/10 effort, easy enough to talk, laugh, or argue freely. ${_prog} Do not run faster than ${fmt(steadyCapSec(chartRow))}.`;
      _dose = {k:'time', mins:recMin, tgt:Math.round(chartRow.recovery), cap:steadyCapSec(chartRow)};
    }
    note = 'RECOVERY RUN: Just as important as the hard days. This is where your body absorbs the training. Going too fast here steals from your speed and long runs.';
  }

  return {type:'run', subtype, detail, note, week, goalId, isNRC:true, dose:_dose||undefined};
}

// NRC session type assignment. Marathon: 1 speed + 3 recovery + 1 long.
// Half: 2 speed + 2 recovery + 1 long. Degrades gracefully on fewer days.
function getNRCSessionTypes(nRunDays: number, goalId: unknown): string[] {
  const isMarathon = goalId === 'run_marathon';
  if(isMarathon) {
    if(nRunDays >= 5) return ['nrc_recovery','nrc_speed1','nrc_recovery','nrc_recovery','nrc_long'];
    if(nRunDays === 4) return ['nrc_recovery','nrc_speed1','nrc_recovery','nrc_long'];
    if(nRunDays === 3) return ['nrc_speed1','nrc_recovery','nrc_long'];
    if(nRunDays === 2) return ['nrc_recovery','nrc_long'];
    return ['nrc_long'];
  } else {
    if(nRunDays >= 5) return ['nrc_speed1','nrc_recovery','nrc_speed2','nrc_recovery','nrc_long'];
    if(nRunDays === 4) return ['nrc_speed1','nrc_recovery','nrc_speed2','nrc_long'];
    if(nRunDays === 3) return ['nrc_speed1','nrc_recovery','nrc_long'];
    if(nRunDays === 2) return ['nrc_recovery','nrc_long'];
    return ['nrc_long'];
  }
}

// The schedule builder hands the bike session its ordinal among the week's bike days as a trailing argument, arguments[8].
function buildBikeSession(goalId: string, week: number, dayIdx: number, totalWeeks: number, experience: Experience | null | undefined, assignedType: string | null | undefined, recoveryMode: boolean, taper: TaperStep | null | undefined, bikeOrdinal?: number): CardioSession;
function buildBikeSession(goalId: string, week: number, dayIdx: number, totalWeeks: number, experience: Experience | null | undefined, assignedType: string | null | undefined, recoveryMode: boolean, taper: TaperStep | null | undefined): CardioSession {
  const tw = totalWeeks || 6;
  // ── V140 (Tier-3 Q7 signed): THE FTP CARD DELIVERS FTP WORK ────────────────
  // Before this, a hybrid bike_ftp program under the base-cardio governor emitted
  // recovery spins for the entire block — the athlete bought an FTP goal and never rode
  // a single FTP session. One sweet-spot session per week (the first bike slot);
  // every other slot stays under the governor as an easy spin, which is the point:
  // sweet spot is the highest-return dose that does not compete with lifting.
  // Progression: 2 x 15 climbing to 3 x 20 across the block. Cutback weeks step the
  // minutes back on the same clock every other modality follows. Base cardio never
  // tapers (taperWeeksFor returns 0), so there is no taper interaction to handle.
  // Trailing-argument convention (see _volFreeze / V115): per-sport ordinal when the
  // caller provides it, global dayIdx otherwise — single-sport paths are identical.
  const _bikeOrd = arguments[8] !== undefined ? arguments[8] : dayIdx;
  if(goalId === 'bike_ftp' && _bikeOrd === 0) {
    const _sp = (week-1) / Math.max(tw-1, 1);
    let spReps = _sp < 0.5 ? 2 : 3;
    let spMins = Math.round(15 + _sp * 5);
    if(isCardioCutbackWeek(week, tw)) { spReps = 2; spMins = Math.max(10, Math.round(spMins * 0.7)); }
    return {type:'bike',
      subtype:'Sweet Spot (CHI)' + (isCardioCutbackWeek(week, tw) ? ' — Cutback' : ''),
      detail: spReps + ' x ' + spMins + ' min at sweet spot, 88 to 93 percent of FTP. 5 min easy spin between reps. 10 min easy warmup, 5 min cooldown.',
      note: 'SWEET SPOT: The engine builder. Hard but repeatable, RPE 7 of 10. No FTP number? Ride the hardest pace you could hold for one hour, then back off one notch. Add a rep before you add minutes.',
      week, goalId, dose:{k:'reps_time', reps:spReps, mins:spMins}};
  }
  const sTypes = ['lsd','int','chi','lsd','int','chi','lsd'];
  const rawType = assignedType || sTypes[dayIdx % sTypes.length];
  let sType = (rawType === 'lsd_long' || rawType === 'lsd_easy') ? 'lsd' : rawType;
  // ── V114: THE LONG RIDE IS A REAL SESSION ───────────────────────────────────
  // Before this, 'lsd_long' and 'lsd_easy' both collapsed to 'lsd' on the line above and
  // duration was computed from `week` alone — dayIdx never entered lsdMins. So the two
  // bike days in a week were BYTE-IDENTICAL, and a 12-week bike_50 block finished on two
  // 60-minute Zone 2 spins. Fifty miles is 2.5–3.5 hours in the saddle; nothing in the
  // program ever asked the athlete to sit in it. The run engine already distinguishes long
  // from easy (lsd_long -> `long`), and buildCardioProgression ALREADY flags lsd_long as
  // legLoad:true for bike — the calendar was protecting a long ride that did not exist.
  // This closes that gap; it does not invent a new concept.
  const _isLongRide = (rawType === 'lsd_long') && !recoveryMode;
  // BODY-COMP RECOVERY MODE: cycling becomes easy active-recovery spinning only. Force
  // every session to LSD, cap duration at 30–45 min, low-to-moderate resistance. No
  // intervals, no hill/resistance work — legs stay fresh for squats and leg growth.
  if(recoveryMode) sType = 'lsd';
  let intReps = getINTBike(week, tw);   // D135 (V205): bike keeps the V115 INT hand ramp
  let chi = getCHIBike(week, tw);   // D128 (V205): bike keeps the V115 CHI hand ramp
  // ── V116: BIKE TAPER ────────────────────────────────────────────────────────
  // Before this the bike had no taper of any kind: a 12-week bike_50 build rode 96 -> 106
  // -> 117 -> 128 min, putting the single largest ride of the block in race week. The
  // reduction RAMPS across however many taper weeks the block earned rather than firing
  // flat, and INTENSITY IS HELD — same volume-down/pace-held rule the cutback and run
  // taper branches already follow. Long rides shed more than easy rides because the long
  // ride is where the accumulated fatigue actually lives.
  const _tapStep = (taper && taper.step) || 0;
  const _tapOf   = (taper && taper.of)   || 0;
  const _tapRamp = (hi: number, lo: number) => _tapStep ? (hi - (hi - lo) * ((_tapStep - 1) / Math.max(_tapOf - 1, 1))) : 1;
  if(_tapStep){
    intReps = Math.max(2, Math.round(intReps * 0.55));
    chi = {reps: Math.max(1, chi.reps - 1), minPerRep: Math.max(8, Math.round(chi.minPerRep * 0.6)), note: chi.note};
  }
  const pct = (week-1) / Math.max(tw-1, 1);
  let lsdBase = Math.round(20 + pct * 40);
  const lsdMaxes: Record<string, number> = {bike_century:90, bike_50:70, bike_ftp:50, bike_cals:45, bike_base:45};
  let lsdMins = Math.min(lsdMaxes[goalId]||50, lsdBase);
  // LONG-RIDE CEILINGS are event-anchored, not maintenance-anchored. The rule of thumb the
  // endurance world actually rides on: the longest training session reaches roughly 70-80%
  // of expected event duration. 50 mi ~ 3 h at a realistic amateur average -> ~2.5 h. A
  // century is ~6 h -> ~4 h. FTP and calorie goals are intensity blocks, so their long day
  // stays modest — length is not what makes them work.
  const lsdLongMaxes: Record<string, number> = {bike_century:240, bike_50:150, bike_ftp:90, bike_cals:60, bike_base:75};
  // The long ride climbs GEOMETRICALLY at the same safe weekly build rate the program
  // length calculator already uses, rather than linearly from 20 min. Linear interpolation
  // to a 150-minute ceiling produces a 36% week-one jump; percentage growth is how volume
  // is actually added without breaking people. It plateaus at the ceiling and holds there.
  const _longRate  = {beginner:0.08, intermediate:0.10, advanced:0.12}[experience||'intermediate'] || 0.10;
  const _longStart = {beginner:30,   intermediate:45,   advanced:60  }[experience||'intermediate'] || 45;
  const _longCap   = lsdLongMaxes[goalId] || 90;
  function _longMinsFor(wk: number): number{
    return Math.min(_longCap, Math.max(20, Math.round(Math.min(_longCap, _longStart) * Math.pow(1 + _longRate, wk - 1))));
  }
  if(_isLongRide) lsdMins = _longMinsFor(week);
  // Cutback week: the ride steps back to 70% of the PRIOR build week instead of
  // climbing through the recovery week. The bike was the only modality that kept
  // progressing while lifting, run and swim all deloaded — this brings it onto the
  // same w%4 clock. recoveryMode (body-comp governor) already freezes volume and wins.
  let _bikeCutback = false;
  // Taper wins over cutback where the two windows overlap — otherwise the ride would be
  // reduced twice off the same base and land absurdly short in race week.
  if(!recoveryMode && !_tapStep && isCardioCutbackWeek(week, tw)){
    const prevMins = _isLongRide
      ? _longMinsFor(week - 1)
      : Math.min(lsdMaxes[goalId]||50, Math.round(20 + ((week-2) / Math.max(tw-1,1)) * 40));
    lsdMins = Math.max(15, Math.round(prevMins * 0.7));
    _bikeCutback = true;
  }
  if(_tapStep) lsdMins = Math.max(15, Math.round(lsdMins * _tapRamp(0.70, _isLongRide ? 0.50 : 0.60)));
  if(recoveryMode){
    if(goalId === 'bike_cals'){
      // V140 (Q7): the calorie card's honest lever is total work, and total work means
      // the minutes climb. 20 to 45 across the block, Zone 2 the whole way so the legs
      // stay fresh for lifting, cutback weeks step back on the shared clock.
      const _cp = (week-1) / Math.max(tw-1, 1);
      lsdMins = Math.min(45, Math.round(20 + _cp * 25));
      if(isCardioCutbackWeek(week, tw)) lsdMins = Math.max(20, Math.round(lsdMins * 0.7));
    } else {
      lsdMins = 20; // hard freeze for every other governed goal (flat, no climb)
    }
  }
  const intWork = week <= 8 ? '45s' : week <= 16 ? '50s' : '60s';
  const intRecov = week <= 8 ? '90s' : week <= 16 ? '80s' : '75s';
  let detail = '', note = '', subtype = '';
  if(sType === 'lsd') {
    if(recoveryMode) {
      if(goalId === 'bike_cals'){
        // V140: honest copy for the honest ramp. Keeps the LSD token for session-code mapping.
        subtype = 'Steady Burn (LSD)' + (isCardioCutbackWeek(week, tw) ? ' — Cutback' : '');
        detail = lsdMins + ' min steady spin, moderate resistance, Zone 2. Talk Test holds the ceiling. The minutes are the workout and they climb week to week.';
        note = 'STEADY BURN: Total work is the goal. Zone 2 keeps it repeatable and keeps your legs fresh for lifting. Do not chase intensity. Chase the clock.';
      } else {
      subtype = 'Active Recovery Spin';
      detail = lsdMins + ' min easy spin, low to moderate resistance. Zone 1–2, light and smooth. This is recovery. Keep the legs fresh for lifting, do not chase intensity.';
      note = 'ACTIVE RECOVERY: Easy spinning to promote blood flow and recovery without taxing the legs. Should feel almost too easy. Your squats and leg growth come first.';
      }
    } else {
      // 'LSD' stays inside the long-ride label on purpose: runSessionCode() maps on
      // /\blsd\b/ and would fall through to a generic code without it.
      subtype = (_isLongRide ? 'Long Ride (LSD)' : 'Long Slow Distance (LSD)') + (_bikeCutback ? ' — Cutback' : (_tapStep ? ' — Taper' : ''));
      detail = _isLongRide
        ? lsdMins + ' min continuous, Zone 2, rolling or flat terrain. Stay seated on the climbs. Eat and drink on the bike from 60 min onward: 40–60g carbs and one bottle per hour. This is the ride the event is built on.'
        : lsdMins + ' min steady state, moderate resistance. Zone 2 effort. Talk Test: you should be able to hold a full conversation throughout.';
      note = _tapStep
        ? 'TAPER: The ride is short on purpose. Fitness is already banked. The only thing left to gain is freshness. Hold Zone 2, keep the legs turning, and arrive rested.'
        : _bikeCutback
        ? 'CUTBACK WEEK: The ride steps back on purpose so the prior weeks of load can sink in. Hold Zone 2 and resist adding minutes. You come back stronger next week.'
        : _isLongRide
        ? 'LONG RIDE: The single most important cardio session of your week. Zone 2 the whole way. Going harder here costs you next week. Time in the saddle, fueling practice, and contact point tolerance are the adaptations; average speed is not.'
        : 'LSD: Zone 2 (60-70% max HR). Easy, conversational pace. Builds aerobic base and fat metabolism. Do not go harder than Zone 2 here.';
    }
  } else if(sType === 'chi') {
    const chiMins = chi.minPerRep;
    const chiReps = chi.reps;
    subtype = 'Continuous High Intensity (CHI)' + (_tapStep ? ' — Taper' : '');
    if(chiReps === 1) {
      detail = chiMins + ' min sustained hard effort, high resistance. RPE 8-9 out of 10. Consistent cadence throughout. You should NOT be able to hold a conversation.';
    } else {
      detail = chiReps + ' x ' + chiMins + ' min at RPE 8-9, high resistance. Recovery: ' + Math.round(chiMins/2) + ' min easy spin between reps. Keep pedaling. Do not stop.';
    }
    note = 'CHI: Zone 3-4 (85-95% max HR). High resistance, sustained hard effort. Breathing labored, short phrases only. RPE 8-9. Add reps as fitness improves.';
  } else if(sType === 'int') {
    subtype = 'Interval (INT)' + (_tapStep ? ' — Taper' : '');
    detail = intReps + ' x ' + intWork + ' max effort / ' + intRecov + ' easy spin recovery (RPE 9+ on work intervals). 3 min easy warmup + 2 min cooldown.';
    note = 'INT: Max effort on work intervals. Legs should burn. Full recovery between reps. Hard cap: 8 reps. Quality over volume.';
  }
  // V148: structured dose. Bike keeps its single minutes input; the dose only feeds
  // the planned strip. INT deliberately emits none — 45s reps have no honest minutes box.
  let _doseB: CardioDose | null = null;
  if(sType === 'lsd') _doseB = {k:'time', mins:lsdMins};
  else if(sType === 'chi') _doseB = (chi.reps === 1) ? {k:'time', mins:chi.minPerRep} : {k:'reps_time', reps:chi.reps, mins:chi.minPerRep};
  return {type:'bike', subtype, detail, note, week, goalId, dose:_doseB||undefined};
}

function buildSwimSession(goalId: string, week: number, dayIdx: number, totalWeeks: number, experience: Experience | null | undefined, assignedType: string | null | undefined, swimGoal: CardioGoal | null | undefined, ageBracket: string, recoveryMode: boolean, qPhase: QualityPhase | null | undefined, taper: TaperStep | null | undefined): CardioSession {
  const tw = totalWeeks || 6;
  const sTypes = ['lsd','int','chi','lsd','int','chi','lsd'];
  const rawType = assignedType || sTypes[dayIdx % sTypes.length];
  let sType = (rawType === 'lsd_long' || rawType === 'lsd_easy') ? 'lsd' : rawType;
  // BODY-COMP RECOVERY MODE: swimming becomes easy aerobic recovery laps only. Force
  // every session to LSD and cap yardage to a recovery dose — no intervals, no tempo.
  // This protects the shoulders and lats from the volume/intensity that would compete
  // with upper-body lifting and growth.
  if(recoveryMode) sType = 'lsd';
  const isMilGoal = goalId === 'swim_tri' || goalId === 'swim_mile';
  // V115: optional quality-phase window, passed only when the compressed 3-day quality
  // slot is periodized. Follows this file's existing trailing-`arguments[N]` convention
  // (see _volFreeze above) rather than widening an already-long signature. Shape:
  // {intSpan, chiFrom, chiTo}. Absent => the un-periodized ramps, unchanged.
  const _qph = qPhase || null;
  let intReps = getINTReps(week, tw, isMilGoal, _qph && _qph.intSpan);
  // D128 (V205): swim takes the Table 6 rep TIER only; yards are unchanged.
  let chi = getCHISwim(week, tw, isMilGoal, _qph && _qph.chiFrom, _qph && _qph.chiTo);
  // V116: swim taper — same shape as bike and run. Volume down, intensity held. Swim had
  // no taper for the same reason bike had none: the whole computation lived inside
  // buildRunSession and was never handed to anyone else.
  const _tapStep = (taper && taper.step) || 0;
  const _tapOf   = (taper && taper.of)   || 0;
  const _tapRamp = (hi: number, lo: number) => _tapStep ? (hi - (hi - lo) * ((_tapStep - 1) / Math.max(_tapOf - 1, 1))) : 1;
  if(_tapStep){
    intReps = Math.max(2, Math.round(intReps * 0.55));
    chi = {reps: Math.max(1, chi.reps - 1), minPerRep: Math.max(8, Math.round(chi.minPerRep * 0.6)), note: chi.note};
  }
  const pct = (week-1) / Math.max(tw-1, 1);
  const exp = experience || 'intermediate';

  // ── SWIM PACE PROGRESSION (time goals only) ──
  // Per-100 target splits per week, mirroring the run pace engine: linear improvement
  // toward goal pace, capped by a physiological/age-scaled weekly limit. If the timeline
  // is too short for the full goal, the working target is scaled to what's achievable.
  let swimPace: SwimPace | null = null;
  if((goalId === 'swim_500_time' || goalId === 'swim_100_time') && swimGoal) {
    const fixedDist = goalId === 'swim_500_time' ? 500 : 100;
    const expPace100 = {beginner:150, intermediate:120, advanced:95}[exp] || 120; // sec/100
    let targetPace100: number | null = null, initialPace100 = expPace100;
    // D110a (V212, coach): the minutes box is a limb, not the time. A time is entered when its total
    // (minutes*60 + seconds, a missing limb as 0) is above 0, never by the minutes box. The goal time
    // and every current time read through _swimTot.
    // D157 (queued, measure first): the SIZER (calcProgramLength's swim branch) still reads the goal
    // and the current time by the minutes box. The two readers differ ON PURPOSE until D157, so a
    // seconds-only entry changes the cards here and never the program length.
    const _swimTot = (m: string | undefined, s: string | undefined) => (+m!||0)*60 + (+s!||0);
    const _tgtTotal = _swimTot(swimGoal.targetMins, swimGoal.targetSecs);
    if(_tgtTotal > 0) targetPace100 = _tgtTotal / (fixedDist / 100);
    // D144 (V212, coach): the anchor is always a 500. The 500 goal reads its current 500
    // (baseMins/baseSecs); the 100 goal reads base500Mins/base500Secs. E = the 500 total / 5.
    const _is100 = goalId === 'swim_100_time';
    const _baseTotal = _is100 ? _swimTot(swimGoal.base500Mins, swimGoal.base500Secs) : _swimTot(swimGoal.baseMins, swimGoal.baseSecs);
    if(_baseTotal > 0) initialPace100 = _baseTotal / 5;
    // D144: the 100 goal's target is the 500 pace moved by the 100 gap. The current 100 is used for
    // this gap, the E7 hold (gap <= 0) and the sizer, nothing else. No current 100 means no gap.
    let _goal100: number | null = null;
    if(_is100 && targetPace100) {
      const tgt100 = targetPace100, cur100 = _swimTot(swimGoal.baseMins, swimGoal.baseSecs);
      const gap100 = cur100 > 0 ? cur100 - tgt100 : 0;
      // D144 floor (coach, V212): a 100 gap at or past the anchor pace would put the target at or
      // below zero. A card never carries a target that is not a swim, so hold at E (goal met).
      targetPace100 = gap100 >= initialPace100 ? initialPace100 : initialPace100 - gap100;
      _goal100 = tgt100;
    }
    if(targetPace100) {
      const enteredTarget100 = targetPace100; const goalAlreadyMet = enteredTarget100 >= initialPace100; targetPace100 = Math.min(enteredTarget100, initialPace100);
      const agePaceScale = {'55+':0.65, '36-54':0.85, '18-35':1.0}[ageBracket] || 1.0;
      const baseImprove = ({beginner:4, intermediate:3, advanced:2}[exp] || 3) * agePaceScale; // sec/100/wk
      const maxImprove = baseImprove;
      const rawImprove = (initialPace100 - targetPace100) / Math.max(tw, 1);
      const weeklyImprove = Math.min(rawImprove, maxImprove);
      const realisticTarget = initialPace100 - weeklyImprove * tw;
      swimPace = [];
      for(let w = 0; w < tw; w++) {
        swimPace.push(+Math.max(realisticTarget, initialPace100 - weeklyImprove * w).toFixed(1));
      }
      swimPace._dampened       = weeklyImprove < rawImprove - 0.05;
      swimPace._weeklyGain     = +weeklyImprove.toFixed(1);
      swimPace._realisticTarget = +realisticTarget.toFixed(1);
      swimPace._originalTarget = +enteredTarget100.toFixed(1); swimPace._goalMet = goalAlreadyMet; swimPace._baseEntered = _baseTotal > 0; swimPace._expDefault = expPace100; swimPace._dist = 500; swimPace._goal100 = _goal100;
      swimPace._unit           = swimGoal.swimUnit || 'yd';
    }
  }

  const lsdStarts: Record<string, Record<Experience, number>> = {swim_tri:{beginner:500,intermediate:800,advanced:1000},swim_mile:{beginner:500,intermediate:700,advanced:900},swim_100_time:{beginner:400,intermediate:600,advanced:800},swim_500_time:{beginner:400,intermediate:600,advanced:800},swim_base:{beginner:400,intermediate:600,advanced:800}};
  const lsdMaxes: Record<string, number> = {swim_tri:3000,swim_mile:3500,swim_100_time:2500,swim_500_time:2500,swim_base:2000};
  const lsdStart = (lsdStarts[goalId]||lsdStarts.swim_base)[exp];
  const lsdMax = lsdMaxes[goalId]||2000;
  function lsdYards(w: number): number {
    // V136: the ramp was a DECAYING SAWTOOTH. The cutback week wrote cur from last, but
    // the next build week grew from cur (the cutback value) and then clobbered last with
    // it — the pre-cutback peak was permanently lost, so every 4-week cycle topped out
    // ~7% lower than the one before it. A 16-week tri athlete's longest swim of the
    // final month was shorter than their week-3 swim, and swim_mile peaked at 932 yd
    // against a 1,650 yd event. Same latch class as the set-bar display bug: the boring
    // branch is what releases it. Build weeks now compound from last (the running peak),
    // matching the bike engine (54 → 38 cutback → 66). The designed lsdMax caps were
    // always sufficient — they were simply unreachable — so caps, the 10% build rate and
    // the w%4 cutback clock are untouched.
    let cur=lsdStart,last=lsdStart;
    for(let i=0;i<w-1;i++){
      if(i%4===3){cur=Math.round(last*0.70);}
      else{const next=Math.min(lsdMax,Math.round(last*1.10));cur=next;last=next;}
    }
    return cur;
  }
  // Cutback week: CHI yardage steps back to 70% of the prior build week rather than
  // climbing through the recovery week — same w%4 clock as reps (getCHI), LSD yards,
  // and the lifting deload.
  const chiYards = isCardioCutbackWeek(week, tw)
    ? Math.max(150, Math.round((200 + ((week-2) / Math.max(tw-1,1)) * 600) * 0.7))
    : Math.round(200 + pct * 600);
  const chiReps = chi.reps;
  // ── V141: SEGMENTED SESSION GRAMMAR (RG Active harvest) ──
  // Gated to swim-family PERFORMANCE goals only: athletes who chose swimming as the
  // thing they're training for get swim-club structure (WU / drill set / main / CD).
  // swim_base (support cardio for lifting-primary athletes) and recovery mode stay
  // flat NSW-style — one dose, go execute. The flat `detail` string is ALWAYS the
  // mechanical flatten of `segments` (same pass, single source) so the flat-string
  // consumers — injury sweeps, interference scorer, compact summaries — can never
  // drift from what the athlete sees.
  const _segGoal = (goalId==='swim_tri'||goalId==='swim_mile'||goalId==='swim_100_time'||goalId==='swim_500_time') && !recoveryMode;
  let segments: CardioSegment[] | null = null;
  const _blk = Math.floor((week-1)/4); // drill rotation rides the existing 4-week cutback clock
  const _GEN_DRILLS = [
    {n:'catch up drill', c:'Slow and deliberate. Full extension before the pull.'},
    {n:'fingertip drag', c:'High elbow on recovery. Fingertips trace the water.'},
    {n:'fist drill', c:'Closed fists the whole length. Feel the forearm catch.'},
    {n:'6-kick switch', c:'Six kicks on your side, then switch. Balance and rotation.'}
  ];
  const _TRI_DRILLS = [
    {n:'sighting drill', c:'Lift your eyes forward every 6th stroke. Race skill for open water.'},
    {n:'hypoxic breathing', c:'Breathe every 5th stroke. Builds calm for rough water.'}
  ];
  // swim_tri weights open-water skills into the back half of the program — race prep
  // lands closest to the race. Everyone else rotates the general menu block by block.
  const _drill = (goalId==='swim_tri' && pct>=0.4) ? _TRI_DRILLS[_blk%2] : _GEN_DRILLS[_blk%4];
  let detail = '', note = '', subtype = '';
  if(sType === 'lsd') {
    let yards = lsdYards(week);
    // Long swims shed more than easy swims, same rationale as the bike.
    if(_tapStep) yards = Math.max(300, Math.round(yards * _tapRamp(0.70, rawType === 'lsd_long' ? 0.50 : 0.60) / 25) * 25);
    if(recoveryMode) {
      // Hard recovery FREEZE: flat ~600 yd of easy technique swimming, no weekly climb.
      // Keeps the shoulders/lats fresh for lifting — this is active recovery, not training.
      yards = 600;
      subtype = 'Recovery Swim';
      detail = yards + ' yards easy. Relaxed stroke, focus on technique and breathing. Zone 1–2, fully conversational rests at the wall. This is active recovery, not a workout.';
      note = 'RECOVERY SWIM: Light aerobic laps to flush the upper body without taxing the shoulders or lats. Keep it short and smooth. Your pressing and pulling lifts come first.';
    } else {
      subtype = 'Long Slow Distance (LSD)' + (_tapStep ? ' — Taper' : '');
      detail = yards + ' yards continuous. Easy stroke, comfortable breathing. Zone 2 effort. Brief wall rest allowed. Keep it short.' + (_tapStep ? ' Taper week. Yardage cut on purpose. The work is done, resist adding laps.' : '');
      note = 'LSD: Zone 2. Easy, relaxed stroke. Focus on form and breathing. Should feel sustainable indefinitely. Build to 3,500-4,000 yards before diminishing returns.';
      // V141: long days carve WU/CD out of the dose (it is all Zone 2 anyway) so the
      // total is conserved EXACTLY. No drill set here by design — the long swim is the
      // point of the session and carving it up would gut the endurance stimulus. Doses
      // under 600 yd are too short to segment meaningfully and stay flat.
      if(_segGoal && yards >= 600) {
        segments = [
          {label:'Warm up',   yd:200, text:'200 yd easy. Mix strokes. Loosen up.'},
          {label:'Main set',  yd:yards-300, text:(yards-300)+' yd continuous freestyle. Zone 2. Easy stroke, comfortable breathing. Brief wall rest allowed. Keep it short.'+(_tapStep?' Taper week. Yardage cut on purpose. The work is done, resist adding laps.':'')},
          {label:'Cool down', yd:100, text:'100 yd easy.'}
        ];
      }
    }
  } else if(sType === 'chi') {
    subtype = 'Continuous High Intensity (CHI)';
    if(chiReps === 1) {
      detail = chiYards + ' yards continuous at 90-95% of your fastest sustainable pace. 200 yard easy warmup + 100 yard cooldown.';
    } else {
      detail = chiReps + ' x ' + chiYards + ' yards at 90-95% pace. Recovery: ' + Math.round(chiYards/2) + ' yards easy stroke between reps. Keep moving. 200 yard warmup + 100 yard cooldown.';
    }
    note = 'CHI: Zone 3-4. Hard sustained effort in the water. Breathing labored, push the pace. Add reps before adding yards as fitness improves.';
    // V141: quality work preserved exactly (rounded to pool-legal 25s); drill set is a
    // bounded addition (4 x 25 = 100 yd, well under the 25%-of-session cap).
    if(_segGoal) {
      const _rY = Math.max(150, Math.round(chiYards/25)*25);
      const _rec = Math.max(25, Math.round(_rY/50)*25);
      const _mainYd = chiReps*_rY + Math.max(0, chiReps-1)*_rec;
      const _mainTxt = chiReps === 1
        ? _rY + ' yd continuous at 90-95% of your fastest sustainable pace.'
        : chiReps + ' x ' + _rY + ' yd at 90-95% pace. Recovery: ' + _rec + ' yd easy stroke between reps. Keep moving.';
      segments = [
        {label:'Warm up',   yd:200, text:'200 yd easy. Mix strokes.'},
        {label:'Drill set', yd:100, text:'4 x 25 yd ' + _drill.n + '. ' + _drill.c},
        {label:'Main set',  yd:_mainYd, text:_mainTxt},
        {label:'Cool down', yd:100, text:'100 yd easy.'}
      ];
    }
  } else if(sType === 'int') {
    subtype = 'Interval (INT)';
    if(swimPace) {
      const wIdx = Math.min(week-1, tw-1);
      const weekPace = swimPace[wIdx];
      const intPace = weekPace - 2;
      const fmt: (s: number) => string = s => _clkMS(s);   // D126 (V204): seconds limb owned by _clkMS. Bare; callers append '/100'.
      const u = swimPace._unit;
      // D144 (V212): on the 100 goal the rep is keyed to the 500 pace, and the card says so.
      const _is100c = goalId === 'swim_100_time';
      detail = _is100c
        ? `${intReps} x 100${u} at ${fmt(intPace)}/100 (week ${week} target, two seconds under this week's 500 pace of ${fmt(weekPace)}/100). Recovery: 2-3 min easy stroke between reps. 200${u} warmup + 100${u} cooldown.`
        : `${intReps} x 100${u} at ${fmt(intPace)}/100 (week ${week} target, slightly faster than this week's goal split of ${fmt(weekPace)}/100). Recovery: 2-3 min easy stroke between reps. 200${u} warmup + 100${u} cooldown.`;
      // V141: the 100s and their split are the pace engine's output — preserved exactly.
      // Drill set shrinks to 4 x 25 whenever reps are cut (taper or early ramp) so it
      // never exceeds 25% of session volume.
      if(_segGoal) {
        const _dr = (_tapStep || intReps < 4) ? 25 : 50;
        segments = [
          {label:'Warm up',   yd:200, text:`200${u} easy, last 2 x 25 building speed.`},
          {label:'Drill set', yd:4*_dr, text:`4 x ${_dr}${u} ${_drill.n}. ${_drill.c}`},
          {label:'Main set',  yd:intReps*100, text:_is100c
            ? `${intReps} x 100${u} at ${fmt(intPace)}/100. Two seconds under this week's 500 pace of ${fmt(weekPace)}/100. Rest 2 to 3 min easy between reps. If the split slips, end the set.`
            : `${intReps} x 100${u} at ${fmt(intPace)}/100. Slightly faster than this week's goal split of ${fmt(weekPace)}/100. Rest 2 to 3 min easy between reps. If the split slips, end the set.`},
          {label:'Cool down', yd:100, text:`100${u} easy.`}
        ];
      }
      const _anchorLine = swimPace._baseEntered ? '' : `No current ${swimPace._dist}${u} time was entered. This split starts from the ${exp} default of ${fmt(swimPace._expDefault!)}/100, not from your own time. `;
      const _reachSplit = (_qph && _qph.intSpan) ? swimPace[Math.min(_qph.intSpan, tw) - 1] : swimPace._realisticTarget!;
      const _goalPhrase = goalId === 'swim_100_time' ? fmt(swimPace._goal100!) + ' for 100' + u : fmt(swimPace._originalTarget!) + '/100';
      if(swimPace._goalMet) {
        note = _anchorLine + 'INT: Your goal split is already within your current split. This block holds your split and builds your reps.';
      } else if(swimPace._dampened) {
        note = _anchorLine + `INT: Split moves ${swimPace._weeklyGain} seconds per 100 each week. Your full goal of ${_goalPhrase} needs more weeks than this block has. The target for this block is ${fmt(_reachSplit)}/100. Hit the prescribed split precisely.`;
      } else {
        note = _anchorLine;
        note += 'INT: 100 repeats at your target split. Start at 4, build to 8. Hard cap at 8. If your split slips, end the session. Consistency between reps matters.';
      }
    } else {
      detail = intReps + ' x 100 yards at 90% effort, slightly faster than recent 500yd pace. Recovery: 2-3 min easy stroke between reps (2-2.5x work time). 200 yard warmup + 100 yard cooldown.';
      note = 'INT: 100 yard repeats. Start at 4, build to 8. Hard cap at 8. If pace drops significantly, end the session. Consistency between reps matters.';
      if(_segGoal) {
        const _dr = (_tapStep || intReps < 4) ? 25 : 50;
        segments = [
          {label:'Warm up',   yd:200, text:'200 yd easy, last 2 x 25 building speed.'},
          {label:'Drill set', yd:4*_dr, text:'4 x ' + _dr + ' yd ' + _drill.n + '. ' + _drill.c},
          {label:'Main set',  yd:intReps*100, text:intReps + ' x 100 yd at 90% effort, slightly faster than recent 500 yd pace. Rest 2 to 3 min easy between reps. If pace drops, end the set.'},
          {label:'Cool down', yd:100, text:'100 yd easy.'}
        ];
      }
    }
  }
  // V141: detail IS the flatten of segments — one pass, one source, so the flat string
  // and the segmented render can never disagree. Sessions without segments (swim_base,
  // recovery mode, short LSD, frozen pre-V141 days) keep their flat detail untouched,
  // and `undefined` drops the key entirely from history snapshots via JSON.stringify.
  if(segments) detail = segments.map(sg => sg.label + ': ' + sg.text).join('\n');
  return {type:'swim', subtype, detail, note, week, goalId, segments: segments || undefined};
}

// the module exports (scripts/module-blocks.mjs writes them; build-index.mjs strips them)
export {
  NRC_10K_TABLE, NRC_5K_TABLE, NRC_GOALS, NRC_SHORTER, PACE_GOALS, PACE_IMPROVE, buildBikeSession, buildNRCSession,
  buildSwimSession, getNRCSessionTypes, raceAlignment, raceCountdown, raceCountdownWords, raceWeekPin, testWeekIndex,
};
