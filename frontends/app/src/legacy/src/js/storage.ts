import { storageStore } from '../../../../../../core/src/engine/state-store.ts';
import { activeProg, activeProgId, currentDayKey, currentWeek } from './rest-day-shell.ts';
import { readLiftLog, writeLiftLog } from '../../../../../../core/src/engine/state-lift-log.ts';
import {
  dayStoreKey, dropSetDraft, readDayLogs, recordSetDraft, setDraftOf, writeDayLogs,
} from '../../../../../../core/src/engine/state-day-log.ts';
import {
  readCompleted, readPartSkips, writeCompleted, writePartSkips,
} from '../../../../../../core/src/engine/state-day-status.ts';
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
function getDayHistFor(pid: any){try{return JSON.parse(iaStore.get('ia_hist_'+pid)||'{}');}catch{return{};}}
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
// refreshProgram rebuilds from cfg on every boot and its OUTPUT IS NEVER PERSISTED —
// prog.weeks in storage is the build from creation day. So the week freeze's
// "trained → history stands" branch was restoring a version the athlete may never
// have been shown: report an injury, train Thursday, mark it, and next boot the day
// snapped back to the pre-injury prescription (all-out intervals on a protected
// week). Same failure for travel: train a hotel week, mark it, get the commercial-gym
// version back.
//
// Fix: the moment a day is touched, snapshot the day object AS RENDERED — overlays,
// swaps, rest-day moves and all — keyed w<N>_<day> like every other week-keyed store.
// The freeze then restores from the snapshot and only falls back to prog.weeks when
// none exists. This is what makes "history records what was actually prescribed"
// literally true, and it survives engine changes, date edits and overlay removal.
//
// FIRST TOUCH WINS: never overwritten. The prescription that was on screen when the
// athlete started working is the record; re-tapping a status later must not rewrite it.
function getDayHist(){try{return JSON.parse(iaStore.get('ia_hist_'+activeProgId)||'{}');}catch{return{};}}
function saveDayHist(h: any){try{iaStore.set('ia_hist_'+activeProgId,JSON.stringify(h));}catch(e){}}
// FIRST TOUCH WINS applies to the ENGINE's prescription, not to the athlete's own
// edits. If the day is edited after first touch, the snapshot must absorb that edit or
// the freeze will restore a day missing it — the exact shape of the V103→V104 bug, since
// ia_hist_ is the record and prog.weeks is only a build. This re-snapshots the day while
// preserving nothing else: it is
// called only from the athlete's own edit handlers: add, skip, swap, undo, never from the
// five normal hook points, so an untouched prescription can still never be rewritten.
function resnapshotDayEdit(week: any,dayKey: any){
  try{
    if(!activeProg||!activeProg.weeks||!week||!dayKey) return;
    const day=activeProg.weeks[week]&&activeProg.weeks[week][dayKey];
    if(!day) return;
    const h=getDayHist(), k=completedKey(week,dayKey);
    if(!h[k]) return;                                 // no snapshot yet: nothing to patch
    h[k]=JSON.parse(JSON.stringify(day));
    saveDayHist(h);
  }catch(e){ console.error('day edit re-snapshot failed',week,dayKey,e); }
}
function snapshotDay(week: any,dayKey: any){
  try{
    if(!activeProg||!activeProg.weeks||!week||!dayKey) return;
    const day=activeProg.weeks[week]&&activeProg.weeks[week][dayKey];
    if(!day) return;
    const h=getDayHist(), k=completedKey(week,dayKey);
    if(h[k]) return;                                  // first touch wins
    h[k]=JSON.parse(JSON.stringify(day));
    saveDayHist(h);
  }catch(e){ console.error('day snapshot failed',week,dayKey,e); }
}

// the module exports (scripts/module-blocks.mjs writes them; build-index.mjs strips them)
export {
  clearSetDraft, completedKey, esc, getActiveProgId, getCompleted, getDayHist, getDayHistFor, getExWeightsFor, getLogs,
  getLogsFor, getPrograms, getWildcardDone, iaStore, logKey, readSetDraft, resnapshotDayEdit, saveCompleted,
  saveExWeightsFor, saveLogs, savePrograms, saveWildcardDone, setActiveProgId, snapshotDay, writeSetDraft,
};
