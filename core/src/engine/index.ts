/**
 * @ia/core's engine (architecture phase D, docs/architecture-migration.md): the app's 17 engine files, moved here as
 * strict TypeScript and typed without a change to the code. Each one is also a piece of the app's page:
 * frontends/app/src/legacy/src/order.json lists it as engine/<name>.ts, and the build takes its types out, so the page
 * carries the JavaScript it always ran (tools/same-script.mjs, tools/engine-move.mjs). This entry is the engine's public
 * face for the other consumers (the tests now, the Angular screens in phase E); it is never a piece of the page.
 */
export { buildProgram } from './budget-engine-d.ts';
// The stored state's store (docs/decisions/stored-state.md): beside the engine while the page is built from this folder.
export { memoryStore, storageStore } from './state-store.ts';
export type { StateStore, StorageLike } from './state-store.ts';
// The lift log, ia_exw_<program> (v0.261.3).
export { dedupeExDayEntries, entryDay, readLiftLog, recordLift, weeklyBest, writeLiftLog } from './state-lift-log.ts';
export type { LiftEntry, LiftLog, LiftRecord, LiftRow } from './state-lift-log.ts';
// The day's log, completion and skipped parts, ia_logs_, ia_comp_ and ia_parts_<program> (v0.261.4).
export {
  CARDIO_PARK_FIELDS, dayStoreKey, dropSetDraft, readDayLogs, recordSetDraft, runPartLogged, setDraftOf, writeDayLogs,
} from './state-day-log.ts';
export type { DayLogs, SetDraftInput, StoredDayEntry } from './state-day-log.ts';
export {
  clearDayParts, clearDayStatus, dayStatus, partsOfDay, readCompleted, readPartSkips, setDayStatus, settleDayParts, skipDayPart,
  writeCompleted, writePartSkips,
} from './state-day-status.ts';
export type { Completed, DayStatusRecord, PartSkips } from './state-day-status.ts';
// The day history, ia_hist_<program> (v0.261.5).
export { readDayHistory, recordDaySnapshot, refreshDaySnapshot, writeDayHistory } from './state-day-history.ts';
export type { DayHistory } from './state-day-history.ts';
// The session swaps, the swap counts and the day edits, ia_swaps_, ia_swapct_ and ia_edits_<program>, and the program
// list, the active program and the Wildcard's record, ia_programs, ia_active and ia_wild_<program> (v0.261.6).
export {
  SWAP_NUDGE_AT, addSwapRecord, countSwap, dropSwapRecord, markSwapNudged, readSwapCounts, readSwaps, writeSwapCounts,
  writeSwaps,
} from './state-swaps.ts';
export type { SwapCount, SwapCounts, SwapPlace, SwapRecord, Swaps } from './state-swaps.ts';
export {
  addAddEdit, addSkipEdit, dropAddEdit, dropSkipEdit, pruneDayEditsBefore, readDayEdits, writeDayEdits,
} from './state-day-edits.ts';
export type { AddedMove, DayEdit, DayEdits } from './state-day-edits.ts';
export {
  readActiveProgramId, readPrograms, readWildcardDone, writeActiveProgramId, writePrograms, writeWildcardDone,
} from './state-programs.ts';
export type { WildcardDone } from './state-programs.ts';
// The overlays (travel, injury) spliced into a rebuilt program, read off the stored program (v0.262.1).
export { spliceOverlays } from './state-overlays.ts';
export type { OverlaidProgram, Overlay, OverlayWeekRange, ProgramDayDate } from './state-overlays.ts';
export type { EngineCfg, CardioSchedule, PaceRow, RunAnchorInfo } from './cardio-progression.ts';
export type { CardioSession } from './nsw-cardio.ts';
