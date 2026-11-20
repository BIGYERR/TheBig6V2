// Progress in the Expo app: its three writes, to this app's own store (D289 P-NATIVEWRITES). This is the one file of
// the screen that calls a writer; each is the page's code around core's own, line for line:
//
//   the open's cleanup (renderProgressScreen: foldExAliasKeys, dedupeExDayEntries)   lift-ledger-progress-screen.ts
//   unarchiveProg, deleteProg, purgeProgData, _handoffActiveFrom                     program-manage.ts
//
// tests/integration/native-progress.test.ts holds every ia_ key equal to today's page after each of them.
import { foldExAliasKeys } from '@ia/core/engine/exercise-library.ts';
import { type LiftLog, dedupeExDayEntries, readLiftLog, writeLiftLog } from '@ia/core/engine/state-lift-log.ts';
import { readActiveProgramId, readPrograms, writePrograms } from '@ia/core/engine/state-programs.ts';
import type { StateStore } from '@ia/core/engine/state-store.ts';

import { pickActive } from '../this-week/week-screen';

/** Every key a program owns beside its row in ia_programs (the page's purgeProgData), in its order. */
export const PURGE_FAMILIES = ['ia_logs_', 'ia_comp_', 'ia_parts_', 'ia_hist_', 'ia_wild_', 'ia_exw_', 'ia_moves_', 'ia_swaps_', 'ia_swapct_', 'ia_edits_', 'ia_pop_dismiss_', 'ia_pop_idx_', 'ia_season_shown_', 'ia_reminded_', 'ia_remind_last_'] as const;

/**
 * The open's one-time cleanup of the viewed program's lift log: old-key rows folded into today's keys, then a second
 * entry of one exercise on one day of one week dropped (the fold can make such a pair, so it runs first). Stored only
 * when either changed a row. Returns the log as it now stands.
 */
export function cleanLiftLog(store: StateStore, programId: string): LiftLog {
  const exw = readLiftLog(store, programId);
  const folded = foldExAliasKeys(exw as never);
  const deduped = dedupeExDayEntries(exw);
  if (folded || deduped) writeLiftLog(store, programId, exw);
  return exw;
}

/** Restore on the archived bar (unarchiveProg): the program is live again. Returns the toast, or null when it is gone. */
export function restoreProgram(store: StateStore, id: string): string | null {
  const programs = readPrograms(store) as unknown as { id: string; archived?: boolean; archivedAt?: number }[];
  const p = programs.find((x) => x.id === id);
  if (!p) return null;
  delete p.archived; delete p.archivedAt;
  writePrograms(store, programs as never);
  return 'Program restored';
}

/**
 * Delete Forever on the archived bar (deleteProg): the program leaves ia_programs, saved before anything else, then
 * every key it owns is removed. Returns the toast.
 *
 * The page hands the active program on first when the deleted one is active (_handoffActiveFrom). On Progress the
 * bar is offered on an archived program only, and neither archiving nor a launch leaves ia_active on an archived
 * program, so there is nothing to hand on here. Were the pointer on it all the same, it is put on the first program
 * that is not archived, or removed with none, as the page leaves it. The whole of a switch (the launch's own writes,
 * the past days marked as asked, D238) is the program list's Delete Forever, which is offered on a live program and
 * so can meet the active one (program-list/list-writes.ts deleteProgram).
 */
export function deleteProgram(store: StateStore, id: string): string {
  let programs = readPrograms(store) as unknown as { id: string }[];
  programs = programs.filter((p) => p.id !== id); writePrograms(store, programs as never);
  if (readActiveProgramId(store) === id) pickActive(store);
  PURGE_FAMILIES.forEach((p) => store.remove(p + id));
  return 'Program deleted';
}
