import { dayStoreKey } from './state-day-log.ts';
// end of the module imports (scripts/module-blocks.mjs writes them; build-index.mjs strips them)
// ── The day history, ia_hist_<program>: each touched day as it was on screen (docs/decisions/stored-state.md). ──
// Moved out of the page's storage.ts in v0.261.5, code as it was, with the store, the program, the week, the day and
// the day's grid entry passed in where the page read its globals. It lives beside the engine while the page is built
// from this folder, and moves to core/src/app-state at cutover (MIGRATION.md).
//
// refreshProgram rebuilds from cfg on every boot, and prog.weeks in storage is only a build. So the week freeze's
// "trained → history stands" branch was restoring a version the athlete may never have been shown: report an injury,
// train Thursday, mark it, and next boot the day snapped back to the pre-injury prescription (all-out intervals on a
// protected week). Same failure for travel: train a hotel week, mark it, get the commercial-gym version back.
//
// Fix: the moment a day is touched, snapshot the day object AS RENDERED — overlays, swaps, rest-day moves and all —
// keyed w<N>_<day> like every other week-keyed store. The freeze then restores from the snapshot and only falls back
// to prog.weeks when none exists. This is what makes "history records what was actually prescribed" literally true,
// and it survives engine changes, date edits and overlay removal.
import type { StateStore } from './state-store.ts';
import type { Day } from '../domain/index.ts';
/** The stored value: a day as it was on screen at its first touch, keyed by dayStoreKey(week, day). */
export type DayHistory = Record<string, Day>;

// The one reader and the one writer. A missing or broken value reads as empty. A refused write is swallowed: the
// history is a record beside the log, and a full store must not stop the log that follows it.
function readDayHistory(store: StateStore, programId: string | null): DayHistory{try{return JSON.parse(store.get('ia_hist_'+programId)||'{}');}catch{return{};}}
function writeDayHistory(store: StateStore, programId: string | null, h: DayHistory): void{try{store.set('ia_hist_'+programId,JSON.stringify(h));}catch(e){}}

// FIRST TOUCH WINS: never overwritten. The prescription that was on screen when the athlete started working is the
// record; re-tapping a status later must not rewrite it. The page passes the day's grid entry and catches a fault.
function recordDaySnapshot(store: StateStore, programId: string | null, week: number | string, dayKey: string, day: Day | null | undefined): void{
  if(!day) return;
  const h=readDayHistory(store,programId), k=dayStoreKey(week,dayKey);
  if(h[k]) return;                                  // first touch wins
  h[k]=JSON.parse(JSON.stringify(day));
  writeDayHistory(store,programId,h);
}
// FIRST TOUCH WINS applies to the ENGINE's prescription, not to the athlete's own edits. If the day is edited after
// first touch, the snapshot must absorb that edit or the freeze will restore a day missing it — the exact shape of
// the V103→V104 bug, since ia_hist_ is the record and prog.weeks is only a build. This re-snapshots the day while
// preserving nothing else: it is called only from the athlete's own edit handlers (add, skip, swap, undo), never
// from the normal hook points, so an untouched prescription can still never be rewritten.
function refreshDaySnapshot(store: StateStore, programId: string | null, week: number | string, dayKey: string, day: Day | null | undefined): void{
  if(!day) return;
  const h=readDayHistory(store,programId), k=dayStoreKey(week,dayKey);
  if(!h[k]) return;                                 // no snapshot yet: nothing to patch
  h[k]=JSON.parse(JSON.stringify(day));
  writeDayHistory(store,programId,h);
}

// the module exports (scripts/module-blocks.mjs writes them; build-index.mjs strips them)
export { readDayHistory, recordDaySnapshot, refreshDaySnapshot, writeDayHistory };
