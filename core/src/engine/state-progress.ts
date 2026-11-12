import { readLiftLog } from './state-lift-log.ts';
import { readDayLogs } from './state-day-log.ts';
import { readDayHistory } from './state-day-history.ts';
import { readPrograms } from './state-programs.ts';
import { getWeekMonday } from './calendar.ts';
import { PACE_CHART } from './cardio-progression.ts';
// end of the module imports (scripts/module-blocks.mjs writes them; build-index.mjs strips them)
// ── What Progress reads and computes from the stored state: ia_logs_, ia_hist_, ia_exw_ and ia_programs (docs/decisions/stored-state.md). ──
// Moved out of the page's progress-data.ts in v0.261.7, code as it was, with the store, the program and the instant
// passed in where the page read its globals and the clock. Two of these read the stores themselves (the wizard's seed,
// the delete bar's warning); the rest are handed the stored logs and history by the screen that draws them, and hand
// back numbers, never markup. What draws stays in the page. It lives beside the engine while the page is built from
// this folder, and moves to core/src/app-state at cutover (MIGRATION.md).
import type { StateStore } from './state-store.ts';
import type { Program } from '../domain/index.ts';
import type { DayLogs, StoredDayEntry } from './state-day-log.ts';
import type { DayHistory } from './state-day-history.ts';
/** A qualifying recovery run: its week, its pace in seconds a mile, and the plan's target pace when the day held one. */
export interface RecoveryPace { w: number; sec: number; tgt: number | null }
/** One logged run's week and pace, for the intensity bands. */
export interface WeekPace { w: number; sec: number }
/** A week's written miles and the miles logged against them. */
export interface PlannedMiles { presc: number; act: number }
/** The wizard's seed: the program it came from, how many runs, their average recovery pace, the mile it reads as, and
 *  the longest single run. */
export interface ProgramSeed { progId: string; progName: string; latest: number; n: number; avgRecSec: number; mileSec: number | null; maxDist: number | null }

// ── RECOVERY PACE TREND (V155) ───────────────────────────────────────────────
// Ruled post-V154 (Mario: "B and recovery only"): session type resolves at READ time
// from the frozen ia_hist_ snapshot — the snapshot is the real prescription record
// (§5), so the chart never needs a second copy of a fact the freeze already owns.
// Scope is recovery-run subtypes ONLY; long runs are progressions (easy start, race-
// pace build) so their average pace is a mushier signal and stays off the chart.
// Weekly AVERAGE, never best — best-of would reward running recovery too hot, the
// exact thing the session note warns against.
// ── V156: WIZARD SEED (D4b/D5/D6 + G2/G3 rulings) ───────────────────────────
// Derives starting inputs for a NEW program from another program's recent logs.
// Window: 21 days (D5 = 3 weeks). Requires >= 3 qualifying recovery runs — both
// seeds or nothing. Mile estimate INVERTS the app's own PACE_CHART (recovery ->
// mile, linear interpolation, clamped at the table edges): zero invented constants.
// Baseline distance = max single logged run in the window (the wizard field asks
// single-run capability, NOT weekly mileage — flagged as a spec amendment to G2).
// Pre-fill only, never locked: the seed writes wizard fields the user can edit,
// which keeps D3 intact — no old number ever reaches a prescription directly.
var SEED_WINDOW_DAYS = 21;
var SEED_MIN_RUNS = 3;
function mileFromRecoveryPace(recSec: number): number | null{
  const rows=(typeof PACE_CHART!=='undefined')?PACE_CHART:null;
  if(!rows||!rows.length||!(recSec>0)) return null;
  if(recSec<=rows[0]!.recovery) return rows[0]!.mile;
  const last=rows[rows.length-1]!;
  if(recSec>=last.recovery) return last.mile;
  for(let i=1;i<rows.length;i++){
    const a=rows[i-1]!, b=rows[i]!;
    if(recSec<=b.recovery){
      const f=(recSec-a.recovery)/(b.recovery-a.recovery);
      return a.mile+f*(b.mile-a.mile);
    }
  }
  return last.mile;
}
// The seed reads every program's logs and history, now is the instant it is asked at (the page passes Date.now()).
function seedFromStoredPrograms(store: StateStore, now: number): ProgramSeed | null{
  const cut = now - SEED_WINDOW_DAYS*86400000;
  let best: ProgramSeed | null=null;
  (readPrograms(store)||[]).forEach(p=>{
    if(!p||!p.id) return;
    const logs=readDayLogs(store,p.id), hist=readDayHistory(store,p.id);
    const tw=p.totalWeeks||99;
    const paces: number[]=[]; let latest=0, maxDist=0;
    Object.entries(logs||{}).forEach(([key,e])=>{
      if(!e||!(e.ts!>0)||e.ts!<cut||e.ts!>now) return;   // D5 window, both boundaries
      if(e.run_dist&&+e.run_dist>0) maxDist=Math.max(maxDist,+e.run_dist);
      // V238 (D224 max readers, Amendment 1 A3): a rest-day jog inside the ts window is its own
      // candidate for the longest run, never summed with the day's session. The pace seeds stay
      // blind: a jog has no pace.
      const _jd=+((e.restLog||{}).run||{} as { dist?: unknown }).dist!; if(_jd>0) maxDist=Math.max(maxDist,_jd);
      const r=recoveryPaceEntry(key,e,hist,tw);       // V155 predicate, reused
      if(!r) return;
      paces.push(r.sec); if(e.ts!>latest) latest=e.ts!;
    });
    if(paces.length<SEED_MIN_RUNS) return;             // both seeds or nothing
    if(best&&latest<=best.latest) return;               // most recent qualifying wins
    const avg=paces.reduce((a,b)=>a+b,0)/paces.length;
    best={progId:p.id,progName:p.name||'previous block',latest,n:paces.length,
          avgRecSec:avg,mileSec:mileFromRecoveryPace(avg),
          maxDist:maxDist>0?+maxDist.toFixed(1):null};
  });
  return best;
}
function paceSeconds(t: unknown): number | null{ // "10:26/mi" or "10:26" -> seconds, else null
  if(!t) return null; const m=String(t).trim().match(/^(\d+):(\d{2})/);
  return m ? (+m[1]!)*60+(+m[2]!) : null;
}
// V156: the V155 inclusion predicate, extracted verbatim so the wizard seed and the
// chart cannot drift apart. Returns {w, sec, tgt} for a qualifying recovery-run log
// entry, null otherwise. Every term is the V155 term; nothing added, nothing relaxed.
function recoveryPaceEntry(key: string, e: StoredDayEntry | null | undefined, hist: DayHistory | null | undefined, totalWeeks: number): RecoveryPace | null{
  if(!e || !e.run_pace) return null;
  if(e.swapTo) return null;                     // swapped session: not the prescribed run
  const m=key.match(/^w(\d+)_(.+)$/); if(!m) return null;
  const w=+m[1]!; if(!(w>=1&&w<=totalWeeks)) return null;
  const snap=hist&&hist[key];                   // logKey === completedKey by construction
  if(!snap || !snap.cardio) return null;        // no snapshot -> EXCLUDED, never guessed
  const c=snap.cardio;
  // String() hardening (V156): the seed reads OTHER programs' hist stores, so a
  // corrupt non-string type must exclude, never throw. paceSeconds already coerces.
  if(String(c.type||'').toLowerCase()!=='run') return null;
  if(!/recovery/i.test(c.subtype||'')) return null;
  const sec=paceSeconds(e.run_pace); if(!sec) return null;
  return {w, sec, tgt:(c.dose && c.dose.tgt!>0)?c.dose.tgt!:null};
}
function recoveryPaceByWeek(logs: DayLogs | null | undefined, hist: DayHistory | null | undefined, totalWeeks: number): { weekly: Record<number, number>; tgt: number | null; nWeeks: number }{
  const wk: Record<number, number[]>={}, tgts: number[]=[];
  Object.entries(logs||{}).forEach(([key,e])=>{
    const r=recoveryPaceEntry(key, e, hist, totalWeeks);
    if(!r) return;
    (wk[r.w]=wk[r.w]||[]).push(r.sec);
    if(r.tgt) tgts.push(r.tgt);
  });
  const weekly: Record<number, number>={};
  Object.entries(wk).forEach(([w,arr])=>{ weekly[+w]=arr.reduce((a,b)=>a+b,0)/arr.length; });
  const tgt=tgts.length?tgts.reduce((a,b)=>a+b,0)/tgts.length:null;
  return {weekly, tgt, nWeeks:Object.keys(weekly).length};
}

// Current week for ANY program. calcCurrentWeek() only knows activeProg, but Progress
// is per-program (V156 G1), so a viewed program needs its own reckoning.
function programWeekAt(p: Program | null | undefined, now: number): number{
  if(!p||!p.startDate) return 0;
  const mon=getWeekMonday(p.startDate);
  const today=new Date(now); today.setHours(0,0,0,0);
  // @ts-expect-error TS2362 The left-hand side of an arithmetic operation must be of type 'any', 'number', 'bigint' or an enum type
  const diff=Math.floor((today-mon)/86400000);
  if(diff<0) return 0;
  return Math.min(p.totalWeeks||6, Math.floor(diff/7)+1);
}

// D6: the week to withhold from accumulating metrics, or 0 for none. A program with
// no start date has no "now", so nothing is excluded. The final week is never cut —
// once the block is over there is no in-progress week left to protect.
function progressCutWeek(p: Program | null | undefined, now: number): number{
  const w=programWeekAt(p, now);
  if(!(w>0)) return 0;
  return (w>=(p!.totalWeeks||6)) ? 0 : w;
}

// Intensity class from the frozen ia_hist_ subtype string the engine already writes.
// Order is load-bearing: "Easy Run — Long" is a long run, so /long/ must be tested
// before /easy/. Benchmark runs are tests, not training, and classify to null.
function runClassOf(subtype: unknown): string | null{
  const s=String(subtype||'');
  if(!s) return null;
  if(/benchmark/i.test(s)) return null;
  if(/recovery/i.test(s)) return 'Recovery';
  // D103a (V208): ORDER IS LOAD-BEARING. "Long Interval (LI)" is the CHI renamed and contains
  // "interval", so its tokens class it as Tempo BEFORE the interval test; the INT's new name joins
  // the interval test. One program's history never splits across the rename. Only the rename
  // tokens move ahead: every label printed today keeps its class (NRC "Speed Run — Tempo" stays
  // Interval).
  if(/\(LI\)|long interval/i.test(s)) return 'Tempo';
  if(/interval|\(INT\)|\(SI\)|short interval|speed/i.test(s)) return 'Interval';
  if(/CHI|high intensity|tempo|threshold|steady/i.test(s)) return 'Tempo';
  if(/long|LSD/i.test(s)) return 'Long';
  if(/easy/i.test(s)) return 'Easy';
  return null;
}
const RUN_CLASS_ORDER = ['Recovery','Easy','Long','Tempo','Interval'];
var EASY_RPE_LO = 3, EASY_RPE_HI = 4;

// ── Module 1: LONG RUN LADDER ───────────────────────────────────────────────
// Longest SINGLE run per week (not weekly volume — the ladder answers "can I cover
// the distance", which is a single-effort question). D6 excluded: accumulating series.
function longestRunByWeek(logs: DayLogs | null | undefined, totalWeeks: number, cut: number | null | undefined, skip1: boolean | null | undefined): Record<number, number>{
  const wk: Record<number, number>={};
  Object.entries(logs||{}).forEach(([key,e])=>{
    if(!e) return;
    const m=key.match(/^w(\d+)_/); if(!m) return;
    const w=+m[1]!; if(!(w>=1&&w<=totalWeeks)) return;
    if(cut&&w===cut) return;                       // D6
    if(skip1&&w===1) return;                       // V174 D26: short first week
    // V238 (D224 max readers, Amendment 1 A5): the rest-day jog is one more candidate for the
    // week's longest single run, never added to the day's session: a double day's longest run is
    // max(session, jog).
    const d=+e.run_dist!, j=+((e.restLog||{}).run||{} as { dist?: unknown }).dist!;
    const top=Math.max(d>0?d:0, j>0?j:0); if(!(top>0)) return;
    wk[w]=Math.max(wk[w]||0, top);
  });
  return wk;
}

// ── Module 2: RUNS BY INTENSITY CLASS ───────────────────────────────────────
// Per-observation: the current week is KEPT (D6). Every logged run with a pace and a
// resolvable class becomes one dot. Swapped sessions are excluded on the same grounds
// V155 excludes them — a swapped session is not the prescribed run.
function runPacesByClass(logs: DayLogs | null | undefined, hist: DayHistory | null | undefined, totalWeeks: number): Record<string, WeekPace[]>{
  const out: Record<string, WeekPace[]>={};
  RUN_CLASS_ORDER.forEach(c=>out[c]=[]);
  Object.entries(logs||{}).forEach(([key,e])=>{
    if(!e||!e.run_pace||e.swapTo) return;
    const m=key.match(/^w(\d+)_(.+)$/); if(!m) return;
    const w=+m[1]!; if(!(w>=1&&w<=totalWeeks)) return;
    const snap=hist&&hist[key];
    if(!snap||!snap.cardio) return;                // no freeze -> excluded, never guessed
    if(String(snap.cardio.type||'').toLowerCase()!=='run') return;
    const cls=runClassOf(snap.cardio.subtype); if(!cls) return;
    const sec=paceSeconds(e.run_pace); if(!sec) return;
    out[cls]!.push({w, sec});
  });
  return out;
}

// ── Module 3: SAME EFFORT, MORE SPEED ───────────────────────────────────────
// Easy/recovery runs filtered to the easy-effort RPE window so effort is pinned and
// pace is the only free variable. Weekly MEAN, never best — a best-of would reward
// running easy days hot, the exact thing V155 was ruled against. Current week kept:
// a mean does not understate on a partial week the way a sum does.
function easyPaceByWeek(logs: DayLogs | null | undefined, hist: DayHistory | null | undefined, totalWeeks: number): { weekly: Record<number, number>; nRuns: number; nWeeks: number }{
  const wk: Record<number, number[]>={}; let n=0;
  Object.entries(logs||{}).forEach(([key,e])=>{
    if(!e||!e.run_pace||e.swapTo) return;
    const rpe=+e.rpe!; if(!(rpe>=EASY_RPE_LO&&rpe<=EASY_RPE_HI)) return;
    const m=key.match(/^w(\d+)_(.+)$/); if(!m) return;
    const w=+m[1]!; if(!(w>=1&&w<=totalWeeks)) return;
    const snap=hist&&hist[key];
    if(!snap||!snap.cardio) return;
    if(String(snap.cardio.type||'').toLowerCase()!=='run') return;
    const cls=runClassOf(snap.cardio.subtype);
    if(cls!=='Recovery'&&cls!=='Easy') return;
    const sec=paceSeconds(e.run_pace); if(!sec) return;
    (wk[w]=wk[w]||[]).push(sec); n++;
  });
  const weekly: Record<number, number>={};
  Object.entries(wk).forEach(([w,arr])=>{ weekly[+w]=arr.reduce((a,b)=>a+b,0)/arr.length; });
  return {weekly, nRuns:n, nWeeks:Object.keys(weekly).length};
}

// ── Module 5: DRIFT FROM PLAN ───────────────────────────────────────────────
// PAIRED per day, never summed independently: the prescribed side only exists for
// distance-dosed runs (a time-dosed run has no written mileage, and deriving one from
// pace x time would be inventing a prescription). Summing all logged miles against a
// partial set of prescriptions would manufacture a surplus. D6 excluded: weekly sum.
function plannedAndLoggedMiles(logs: DayLogs | null | undefined, hist: DayHistory | null | undefined, totalWeeks: number, cut: number | null | undefined, skip1: boolean | null | undefined): Record<number, PlannedMiles>{
  const wk: Record<number, PlannedMiles>={};
  Object.entries(hist||{}).forEach(([key,snap])=>{
    if(!snap||!snap.cardio) return;
    const c=snap.cardio;
    if(String(c.type||'').toLowerCase()!=='run') return;
    const dose=c.dose; if(!dose||!(+dose.mi!>0)) return;
    const m=key.match(/^w(\d+)_/); if(!m) return;
    const w=+m[1]!; if(!(w>=1&&w<=totalWeeks)) return;
    if(cut&&w===cut) return;                       // D6
    if(skip1&&w===1) return;                       // V174 D26: short first week
    const e=(logs||{})[key];
    if(e&&e.swapTo) return;                        // swapped away: not this prescription
    const act=(e&&+e.run_dist!>0)?+e.run_dist!:0;
    if(!wk[w]) wk[w]={presc:0, act:0};
    wk[w]!.presc+=+dose.mi!; wk[w]!.act+=act;
  });
  return wk;
}

// Forward read of PACE_CHART (mile equivalent -> half finish, seconds). The exact
// mirror of mileFromRecoveryPace, which walks the same table the other way. Chaining
// the two is a table lookup, not a model: zero invented constants.
function halfFromMilePace(mileSec: number): number | null{
  const rows=(typeof PACE_CHART!=='undefined')?PACE_CHART:null;
  if(!rows||!rows.length||!(mileSec>0)) return null;
  if(mileSec<=rows[0]!.mile) return rows[0]!.halfBest;
  const last=rows[rows.length-1]!;
  if(mileSec>=last.mile) return last.halfBest;
  for(let i=1;i<rows.length;i++){
    const a=rows[i-1]!, b=rows[i]!;
    if(mileSec<=b.mile){
      const f=(mileSec-a.mile)/(b.mile-a.mile);
      return a.halfBest+f*(b.halfBest-a.halfBest);
    }
  }
  return last.halfBest;
}

// V169: the delete bar's warning. V168 D3 makes other programs read this one's ia_exw_ for
// their reuse pills. Purging it silently blanks loads elsewhere, so the confirm has to say
// so. Cheap proxy: this program holds loaded-lift history AND at least one other program exists.
function liftLogFeedsOthers(store: StateStore, programId: string | null): boolean{
  try{
    if(readPrograms(store).filter(function(x){return x.id!==programId;}).length===0) return false;
    return Object.keys(readLiftLog(store,programId)||{}).length>0;
  }catch(e){ return false; }
}

// the module exports (scripts/module-blocks.mjs writes them; build-index.mjs strips them)
export {
  EASY_RPE_HI, EASY_RPE_LO, RUN_CLASS_ORDER, SEED_MIN_RUNS, SEED_WINDOW_DAYS, easyPaceByWeek, halfFromMilePace,
  liftLogFeedsOthers, longestRunByWeek, mileFromRecoveryPace, paceSeconds, plannedAndLoggedMiles, programWeekAt,
  progressCutWeek, recoveryPaceByWeek, recoveryPaceEntry, runClassOf, runPacesByClass, seedFromStoredPrograms,
};
