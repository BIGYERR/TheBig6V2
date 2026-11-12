# Stored state: who reads and writes the swap and edit stores, and what is left of storage.ts?

Written by `tests/measure/stored-state_swaps-edits-callers.mjs`, before the fifth lift slice. Static counts over the
working tree, comments stripped: calls in the legacy script (a function's own declaration and the import and export
lists left out), mentions in core and in the Angular screens (which reach the page by name through the bridge), and
the number of test files that name it.

## Swaps (ia_swaps_)

| Function | Legacy callers (file, calls) | Core | Angular (file, mentions) | Tests (files) |
|---|---|---|---|---|
| `swapStoreKey` | swaps-edits.ts 2 | none | none | none |
| `getSwaps` | program-manage.ts 1, swap-sheet.ts 2, swaps-edits.ts 2 | none | none | none |
| `saveSwaps` | swaps-edits.ts 2 | none | none | none |
| `recordSwap` | swap-sheet.ts 1 | none | none | none |
| `clearSwap` | swap-sheet.ts 1 | none | none | none |
| `applySessionSwaps` | program-manage.ts 1 | none | none | 1 |

## Swap counts (ia_swapct_)

| Function | Legacy callers (file, calls) | Core | Angular (file, mentions) | Tests (files) |
|---|---|---|---|---|
| `SWAP_NUDGE_AT` | swaps-edits.ts 1 | none | none | none |
| `swapCountKey` | swaps-edits.ts 2 | none | none | none |
| `getSwapCounts` | swaps-edits.ts 2 | none | none | none |
| `saveSwapCounts` | swaps-edits.ts 2 | none | none | none |
| `bumpSwapCount` | swap-sheet.ts 1 | none | none | 2 |
| `markSwapOffered` | day-status.ts 2 | none | none | none |

## Day edits (ia_edits_)

| Function | Legacy callers (file, calls) | Core | Angular (file, mentions) | Tests (files) |
|---|---|---|---|---|
| `editStoreKey` | swaps-edits.ts 2 | none | none | none |
| `getDayEdits` | program-manage.ts 1, swaps-edits.ts 5 | none | none | 1 |
| `saveDayEdits` | swaps-edits.ts 5 | none | none | none |
| `_editEntry` | swaps-edits.ts 2 | none | none | none |
| `recordSkip` | swap-sheet.ts 2 | none | none | none |
| `clearSkip` | swap-sheet.ts 2 | none | none | none |
| `recordAdd` | swap-sheet.ts 1 | none | none | none |
| `clearAdd` | swap-sheet.ts 1 | none | none | none |
| `ssSkipToken` | swap-sheet.ts 2, swaps-edits.ts 1 | none | none | none |
| `pruneDayEdits` | program-manage.ts 1 | none | none | 1 |
| `applyDayEdits` | program-manage.ts 1 | none | none | none |

## What is left of storage.ts

| Function | Legacy callers (file, calls) | Core | Angular (file, mentions) | Tests (files) |
|---|---|---|---|---|
| `getPrograms` | bug-report-init.ts 1, day-detail.ts 1, day-status.ts 1, lift-ledger-progress-screen.ts 1, overlays.ts 5, program-manage.ts 7, programs.ts 9, progress-data.ts 2, rest-day-shell.ts 1, set-logging.ts 1, wizard-generate.ts 1, wizard.ts 1 | none | e1rm-card.ts 1, goal-sheet.ts 1, mile-nudge.ts 2, mile-sheet.ts 1, program-list.ts 1, progress-screen.ts 1, wizard.ts 1 | 4 |
| `savePrograms` | day-detail.ts 1, day-status.ts 1, overlays.ts 5, program-manage.ts 6, programs.ts 4, rest-day-shell.ts 1, wizard-generate.ts 1 | none | e1rm-card.ts 1, mile-nudge.ts 1 | 3 |
| `getActiveProgId` | bug-report-init.ts 1, program-manage.ts 1, programs.ts 1 | none | program-list.ts 1 | 1 |
| `setActiveProgId` | program-manage.ts 1 | none | none | none |
| `getWildcardDone` | random-wildcard.ts 4 | none | random-workout.ts 2 | none |
| `saveWildcardDone` | random-wildcard.ts 2 | none | random-workout.ts 1 | none |
| `saveDayHist` | none | none | none | none |

| Key | Files that name it outside comments (file, mentions) |
|---|---|
| `ia_swaps_` | program-manage.ts 1, swaps-edits.ts 1 |
| `ia_swapct_` | program-manage.ts 1, swaps-edits.ts 1 |
| `ia_edits_` | program-manage.ts 1, swaps-edits.ts 1 |
| `ia_programs` | data-backup.ts 2, storage.ts 2 |
| `ia_active` | program-manage.ts 1, storage.ts 2 |
| `ia_wild_` | program-manage.ts 1, storage.ts 2 |
