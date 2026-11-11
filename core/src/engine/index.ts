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
export type { EngineCfg, CardioSchedule, PaceRow, RunAnchorInfo } from './cardio-progression.ts';
export type { CardioSession } from './nsw-cardio.ts';
