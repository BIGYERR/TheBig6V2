import { storageStore } from '../../../../../../core/src/engine/state-store.ts';
import { activeProg, activeProgId, currentDayKey, currentWeek } from './rest-day-shell.ts';
import { readLiftLog, writeLiftLog } from '../../../../../../core/src/engine/state-lift-log.ts';
import {
  dayStoreKey, dropSetDraft, readDayLogs, recordSetDraft, setDraftOf, writeDayLogs,
} from '../../../../../../core/src/engine/state-day-log.ts';
import {
  readCompleted, readPartSkips, writeCompleted, writePartSkips,
} from '../../../../../../core/src/engine/state-day-status.ts';
import {
  readDayHistory, recordDaySnapshot, refreshDaySnapshot, writeDayHistory,
} from '../../../../../../core/src/engine/state-day-history.ts';
// end of the module imports (scripts/module-blocks.mjs writes them; build-index.mjs strips them)


// Exercise names reach markup from the library, from swaps, and now from the add picker.
// Escaped on the way in so a name containing a quote or angle bracket can never break the
// attribute it sits in.
// v0.261.2 (docs/decisions/stored-state.md): every read and write of the app's stored state goes through this one
// store, the first step of moving that logic into @ia/core. The page stands it on the browser's storage.
const iaStore=storageStore(()=>localStorage);
function esc(s: any){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}

// STORAGE
function getPrograms(): any[]{try{return JSON.parse(iaStore.get('ia_programs')||'[]');}catch{return[];}}
function savePrograms(p: any){iaStore.set('ia_programs',JSON.stringify(p));}
function getActiveProgId(){return iaStore.get('ia_active')||null;}
function setActiveProgId(id: any){iaStore.set('ia_active',id);}
// v0.261.4 (docs/decisions/stored-state.md): the day's log (ia_logs_), completion (ia_comp_) and skipped parts
// (ia_parts_) live in @ia/core, in core/src/engine/state-day-log.ts and state-day-status.ts: the readers and writers,
// the read lens (restNorm), the day key and the set drafts. These are the page's callers: they name the store, the
// active program and the page's week and day.
function getLogs(): any{return readDayLogs(iaStore,activeProgId);}
// V156: id-parameterized variants. The zero-arg accessors above stay untouched so every
// existing call site is byte-identical; only the Progress selector and the wizard seed
// read OTHER programs' stores, and they must say which one out loud.
// V238 (D223 item 5): the same restNorm lens as getLogs.
function getLogsFor(pid: any): any{return readDayLogs(iaStore,pid);}
function getDayHistFor(pid: any): any{return readDayHistory(iaStore,pid);}
function getExWeightsFor(pid: any): any{return readLiftLog(iaStore,pid);}
function saveExWeightsFor(pid: any,obj: any){writeLiftLog(iaStore,pid,obj);}
function saveLogs(l: any){writeDayLogs(iaStore,activeProgId,l);}
function getCompleted(): any{return readCompleted(iaStore,activeProgId);}
function saveCompleted(c: any){writeCompleted(iaStore,activeProgId,c);}
// v0.261.0 (D284, P-SKIPPILL): the parts of a day skipped on their own (its run, its lift), keyed w<N>_<day> like
// ia_comp_. Never in ia_comp_, where a record with no status reads as done, nor in the log, which persistLogFields
// rebuilds from the form on every write.
function getPartSkips(): any{return readPartSkips(iaStore,activeProgId);}
function savePartSkips(p: any){writePartSkips(iaStore,activeProgId,p);}
function getWildcardDone(): any[]{try{return JSON.parse(iaStore.get('ia_wild_'+activeProgId)||'[]');}catch{return[];}}
function saveWildcardDone(a: any){iaStore.set('ia_wild_'+activeProgId,JSON.stringify(a));}
function logKey(w: any,d: any){return dayStoreKey(w,d);}

// ── SET DRAFTS (V131) ────────────────────────────────────────────────────────
// A stepper tap is not a log: it lives inside the ia_logs_ day entry as `sets` and never reaches ia_exw_
// (state-day-log.ts has the rule and its reasons). The page names the day and snapshots it.
function readSetDraft(exKey: any): any{
  return setDraftOf(iaStore,activeProgId,currentWeek,currentDayKey,exKey);
}
function writeSetDraft(exKey: any,r: any,w: any,L: any){
  if(!activeProgId||!currentDayKey||!exKey) return;
  // SNAPSHOT, same reasoning as persistLogFields. A draft lands in ia_logs_, and any
  // ia_logs_ entry for a week makes that week "touched" for the freeze — so the day
  // has to be captured in ia_hist_ here too, or the week freezes with no record of
  // what it was frozen ON. snapshotDay is first-touch-wins, so this is a no-op after
  // the first write.
  snapshotDay(currentWeek,currentDayKey);
  recordSetDraft(iaStore,activeProgId,currentWeek,currentDayKey,exKey,{r:r,w:w,L:L},Date.now());
}
function clearSetDraft(exKey: any){
  dropSetDraft(iaStore,activeProgId,currentWeek,currentDayKey,exKey);
}
function completedKey(w: any,d: any){return dayStoreKey(w,d);}
// ── DAY HISTORY SNAPSHOTS (ia_hist_) ─────────────────────────────────────────
// v0.261.5 (docs/decisions/stored-state.md): the day history lives in @ia/core, in core/src/engine/state-day-history.ts:
// the reader and the writer, the first touch's snapshot (first touch wins) and the re-snapshot an edit makes, with
// their reasons. These are the page's callers: they name the store, the active program and the day's grid entry, and
// they catch a fault so a tap goes on.
function getDayHist(): any{return readDayHistory(iaStore,activeProgId);}
function saveDayHist(h: any){writeDayHistory(iaStore,activeProgId,h);}
// Called only from the athlete's own edit handlers (add, skip, swap, undo): the snapshot absorbs the edit.
function resnapshotDayEdit(week: any,dayKey: any){
  try{
    if(!activeProg||!activeProg.weeks||!week||!dayKey) return;
    refreshDaySnapshot(iaStore,activeProgId,week,dayKey,activeProg.weeks[week]&&activeProg.weeks[week][dayKey]);
  }catch(e){ console.error('day edit re-snapshot failed',week,dayKey,e); }
}
function snapshotDay(week: any,dayKey: any){
  try{
    if(!activeProg||!activeProg.weeks||!week||!dayKey) return;
    recordDaySnapshot(iaStore,activeProgId,week,dayKey,activeProg.weeks[week]&&activeProg.weeks[week][dayKey]);
  }catch(e){ console.error('day snapshot failed',week,dayKey,e); }
}

// the module exports (scripts/module-blocks.mjs writes them; build-index.mjs strips them)
export {
  clearSetDraft, completedKey, esc, getActiveProgId, getCompleted, getDayHist, getDayHistFor, getExWeightsFor, getLogs,
  getLogsFor, getPrograms, getWildcardDone, iaStore, logKey, readSetDraft, resnapshotDayEdit, saveCompleted,
  saveExWeightsFor, saveLogs, savePrograms, saveWildcardDone, setActiveProgId, snapshotDay, writeSetDraft,
};
