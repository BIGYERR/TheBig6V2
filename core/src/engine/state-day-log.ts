// ── The day's log, ia_logs_<program>: what the athlete entered on each day, by week and day (docs/decisions/stored-state.md). ──
// Moved out of the page's storage.ts, log-entries.ts and day-status.ts in v0.261.4, code as it was, with the store, the
// program, the week, the day and the instant passed in where the page read its globals. It lives beside the engine
// while the page is built from this folder, and moves to core/src/app-state at cutover (MIGRATION.md).
import type { StateStore } from './state-store.ts';
import type { LogEntry, RestLogEntry, SetDraft } from '../domain/index.ts';
/** A day's entry as it may be stored: today's fields, and the flat ones a V237 rest day wrote (restNorm reads those). */
export interface StoredDayEntry extends LogEntry {
  rest_cardio?: unknown; rest_type?: string; rest_mins?: string | number;
  [field: string]: unknown;
}
/** The stored value: an entry per day, keyed by dayStoreKey(week, day). */
export type DayLogs = Record<string, StoredDayEntry>;
/** A set draft as the page hands it over: reps and weights per set as typed, and the load label. */
export interface SetDraftInput { r: string[] | null | undefined; w: string[] | null | undefined; L: string | null | undefined }

// The one key of the stores that hold a day: w<week>_<day>. The page's logKey and completedKey both build it.
function dayStoreKey(week: number | string, day: string): string{return 'w'+week+'_'+day;}

// V238 (D223 item 5, Amendment 1 A1): restNorm is the read lens for one ia_logs_ day entry, and
// readDayLogs, the one read of the store, passes every entry through it. An entry with a
// restLog, or with no rest_cardio, comes back as is. A V237 rest entry (rest_cardio still on it,
// so persistLogFields never rebuilt it, and those keys are the jog's) comes back in the V238 shape
// derived from the entry alone: restLog[rest_type] = {mins:rest_mins, rpe}; run_dist and
// swim_yards become the run and swim dist; bike_mins becomes the ride's mins (the sum wins over
// rest_mins). The seven flat keys it read are cleared; every key it does not name (sets, parked,
// notes, week, ts) is carried untouched. It invents nothing: no ts, no week, no mins for a type
// that held none. Pure: it never mutates its argument and nothing writes on boot; a legacy entry
// converts when a writer's save persists the map it read. The lens runs outside the parse
// try, so a lens fault can never come back as {} for a writer to save over the store.
function restNorm(e: StoredDayEntry): StoredDayEntry{
  if(!e||typeof e!=='object'||e.restLog||!e.rest_cardio) return e;
  const FLAT=['rest_cardio','rest_type','rest_mins','rpe','run_dist','bike_mins','swim_yards'];
  const num=(v: string | number | undefined)=>(+v!>0?+v!:0), t=e.rest_type||'';
  const M: Record<string, number>={}, D: Record<string, number>={}, R: Record<string, number>={};
  if(t&&num(e.rest_mins)) M[t]=num(e.rest_mins);
  if(t&&e.rpe!=null&&e.rpe!==''&&isFinite(+e.rpe)) R[t]=+e.rpe;
  if(num(e.run_dist)) D.run=num(e.run_dist);
  if(num(e.swim_yards)) D.swim=num(e.swim_yards);
  if(num(e.bike_mins)) M.bike=num(e.bike_mins);
  const rl: Record<string, RestLogEntry>={};
  [t,'run','swim','bike'].forEach(function(s,i,a){
    if(!s||a.indexOf(s)!==i) return;
    const o: RestLogEntry={};
    if(s in M) o.mins=M[s];
    if(s in D) o.dist=D[s];
    if(s in R) o.rpe=R[s];
    if(Object.keys(o).length) rl[s]=o;
  });
  const out: StoredDayEntry={restLog:rl};
  Object.keys(e).forEach(function(k){ if(FLAT.indexOf(k)<0) out[k]=e[k]; });
  return out;
}
function restNormAll(l: DayLogs): DayLogs{
  if(l&&typeof l==='object') Object.keys(l).forEach(function(k){ l[k]=restNorm(l[k]!); });
  return l;
}

// The one reader and the one writer of ia_logs_<program>. A missing or broken value reads as an empty log.
function readDayLogs(store: StateStore, programId: string | null): DayLogs{let l;try{l=JSON.parse(store.get('ia_logs_'+programId)||'{}');}catch{return{};}return restNormAll(l);}
function writeDayLogs(store: StateStore, programId: string | null, logs: DayLogs): void{store.set('ia_logs_'+programId,JSON.stringify(logs));}

// ── SET DRAFTS (V131) ────────────────────────────────────────────────────────
// A stepper tap is not a log. It is the athlete mid-session, and before V131 it
// lived ONLY in the DOM: leaving the day and coming back redrew the card from
// ia_exw_, found nothing, and reprinted the prescription over the edit.
//
// Drafts live INSIDE the existing ia_logs_ day entry as `sets`, deliberately.
// ia_logs_ is already keyed week+day, already inside the freeze's "touched" test,
// and already bounded by program length. A new ia_draft_ store would have been a
// second re-apply store with no prune function, and ia_moves_ is already that one.
//
// A draft NEVER reaches ia_exw_. The tick, the X/Y LOGGED counter and every chart
// read ia_exw_, so a draft cannot claim work is finished and cannot put a weight
// the athlete never confirmed onto a progress chart.
//
// Values are stored as the RAW STRINGS the athlete entered, '' meaning untouched —
// never a placeholder-derived number. Restoring a draft therefore cannot stamp a
// zero into a load cell that was never filled.
function setDraftOf(store: StateStore, programId: string | null, week: number, day: string, exKey: string): SetDraft | null{
  if(!exKey) return null;
  const e=readDayLogs(store,programId)[dayStoreKey(week,day)];
  return (e&&e.sets&&e.sets[exKey])||null;
}
// READ-MODIFY-WRITE, and it must stay that way. The page's persistLogFields rebuilds the whole
// day entry from the form fields, so these two writers each have to preserve the
// other's half or whichever runs last silently destroys it. The page snapshots the day first (history).
function recordSetDraft(store: StateStore, programId: string | null, week: number, day: string, exKey: string, draft: SetDraftInput, now: number): void{
  const logs=readDayLogs(store,programId), k=dayStoreKey(week,day);
  const e=logs[k]||{week:week};
  const sets=e.sets||{};
  sets[exKey]={r:draft.r||[],w:draft.w||[],L:draft.L||''};
  e.sets=sets; e.week=week; e.ts=now;
  logs[k]=e; writeDayLogs(store,programId,logs);
}
function dropSetDraft(store: StateStore, programId: string | null, week: number, day: string, exKey: string): void{
  const logs=readDayLogs(store,programId), k=dayStoreKey(week,day), e=logs[k];
  if(!e||!e.sets||!(exKey in e.sets)) return;
  delete e.sets[exKey];
  if(!Object.keys(e.sets).length) delete e.sets;
  logs[k]=e; writeDayLogs(store,programId,logs);
}

// V234 (D213): the field set each sport owns at the top level of a log entry. Only the active
// chip's set sits at top level, so only it is credited. A sport change through the picker moves
// the leaving set whole into entry.parked[sport] and brings the arriving sport's parked set back.
// `parked` is read by the form render (setCardioSwap, buildLogHTML's note) and carried by
// persistLogFields; no other reader names it, so every other reader is blind to it.
const CARDIO_PARK_FIELDS: Record<string, string[]>={run:['run_dist','run_pace','run_mins','run_reps','run_rep_time'],bike:['bike_mins'],swim:['swim_yards']};
// The run part is done when the run is logged for the sport it is credited to (D213): This Week's own test
// (week-view-model's cardioLogged), the same fields and the same zero rule, so the day and its run card agree.
function runPartLogged(e: StoredDayEntry | null | undefined, type: unknown): boolean{
  if(!e) return false;
  const sport=String(e.swapTo||type||'run').toLowerCase();
  return (CARDIO_PARK_FIELDS[sport]||[]).some(function(f){ const v=e[f]; return v!==undefined&&v!==null&&v!==''&&v!==0&&v!=='0'; });
}

// the module exports (scripts/module-blocks.mjs writes them; build-index.mjs strips them)
export {
  CARDIO_PARK_FIELDS, dayStoreKey, dropSetDraft, readDayLogs, recordSetDraft, runPartLogged, setDraftOf, writeDayLogs,
};
