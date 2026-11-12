# Stored state: who calls what progress-data.ts reads and computes, and what is left of day-status.ts's store logic?

Written by `tests/measure/stored-state_progress-callers.mjs`, before the sixth lift slice. Static counts over the
working tree, comments stripped: calls in the legacy script and its HTML partials (a function's own declaration and
the import and export lists left out), mentions in core and in the Angular screens (which reach the page by name
through the bridge), and the number of test files that name it.

## progress-data.ts: the readers of the stores

| Function | Legacy callers (file, calls) | Core | Angular (file, mentions) | Tests (files) |
|---|---|---|---|---|
| `seedFromPriorPrograms` | wizard.ts 1 | none | wizard.ts 1 | 2 |
| `SEED_WINDOW_DAYS` | progress-data.ts 1 | none | none | none |
| `SEED_MIN_RUNS` | progress-data.ts 1 | none | none | none |
| `_purgeWarnsCrossProg` | progress-data.ts 1 | none | progress-screen.ts 1 | 1 |

## progress-data.ts: what it computes from the stored logs and history

| Function | Legacy callers (file, calls) | Core | Angular (file, mentions) | Tests (files) |
|---|---|---|---|---|
| `_recoveryPaceEntry` | progress-data.ts 2 | none | none | none |
| `recoveryPaceWeekly` | lift-ledger-progress-screen.ts 1 | none | progress-model.ts 1, progress-screen.ts 2 | 1 |
| `ladderWeekly` | lift-ledger-progress-screen.ts 1 | none | progress-model.ts 1, progress-screen.ts 2 | 2 |
| `runsByClass` | lift-ledger-progress-screen.ts 1 | none | progress-model.ts 1, progress-screen.ts 2 | 1 |
| `RUN_CLASS_ORDER` | progress-charts.ts 1, progress-data.ts 1 | none | none | none |
| `easyEffortWeekly` | lift-ledger-progress-screen.ts 1 | none | progress-model.ts 1, progress-screen.ts 2 | 1 |
| `EASY_RPE_LO` | progress-charts.ts 2, progress-data.ts 1 | none | progress-screen.ts 1 | 1 |
| `EASY_RPE_HI` | progress-charts.ts 2, progress-data.ts 2 | none | progress-screen.ts 1 | 1 |
| `plannedVsLogged` | lift-ledger-progress-screen.ts 1 | none | progress-model.ts 1, progress-screen.ts 2 | 2 |
| `_runClass` | progress-charts.ts 1, progress-data.ts 2 | none | none | 1 |
| `_paceStrToSec` | progress-charts.ts 1, progress-data.ts 3 | none | none | 1 |
| `_mileFromRecoverySec` | progress-charts.ts 1, progress-data.ts 1 | none | progress-screen.ts 1 | 2 |
| `_halfFromMileSec` | progress-charts.ts 2 | none | progress-screen.ts 1 | 2 |
| `_progWeekNow` | progress-data.ts 1 | none | none | none |
| `_cutWeek` | lift-ledger-progress-screen.ts 1 | none | progress-screen.ts 1 | none |

## progress-data.ts: the lift ledger of V165, orphaned by V167

| Function | Legacy callers (file, calls) | Core | Angular (file, mentions) | Tests (files) |
|---|---|---|---|---|
| `ledgerRows` | none | none | none | none |
| `_entryBestE1RM` | progress-data.ts 2 | none | none | none |
| `_LEDGER_MAIN` | progress-data.ts 1 | none | none | none |

## progress-data.ts: what draws

| Function | Legacy callers (file, calls) | Core | Angular (file, mentions) | Tests (files) |
|---|---|---|---|---|
| `showProgressScreen` | rest-day-shell.ts 1 | none | none | none |
| `buildPaceChart` | lift-ledger-progress-screen.ts 1 | none | none | 1 |
| `_fmtPaceShort` | progress-charts.ts 14, progress-data.ts 3 | none | progress-screen.ts 1 | 1 |
| `_progChipsHTML` | lift-ledger-progress-screen.ts 1 | none | none | 1 |
| `_restoreBarHTML` | progress-data.ts 2 | none | none | 1 |
| `askPurgeFromProgress` | progress-data.ts 1 | none | program-chips.ts 1 | 1 |
| `cancelProgressConfirm` | progress-data.ts 1 | none | program-chips.ts 1 | 1 |
| `setProgressView` | progress-data.ts 1 | none | program-chips.ts 1 | 1 |
| `RACE_DIST_MI` | lift-ledger-progress-screen.ts 1 | none | progress-screen.ts 1 | none |
| `EASY_MIN_RUNS` | lift-ledger-progress-screen.ts 1, progress-charts.ts 2 | none | progress-screen.ts 1 | 1 |
| `RUN_CLASS_COLOR` | progress-charts.ts 1 | none | none | none |

## day-status.ts: what is left of its store logic

| Function | Legacy callers (file, calls) | Core | Angular (file, mentions) | Tests (files) |
|---|---|---|---|---|
| `toggleComplete` | none | none | none | none |
| `acceptSwapNudge` | overlays.html 1 | none | swap-nudge.ts 1 | none |
| `cardioEntryLive` | day-status.ts 1, wheel-log.ts 1 | none | day-detail.ts 1 | 1 |
| `setCardioSwap` | wheel-log.ts 1 | none | session-log.ts 2 | 4 |
| `persistLogFields` | day-detail.ts 1, day-status.ts 5, log-entries.ts 1 | none | day-detail.ts 1, session-log.ts 3 | 4 |

## The page's store readers this slice's functions are handed through

| Reader | Legacy callers (file, calls) | Angular (file, mentions) |
|---|---|---|
| `getLogsFor` | lift-ledger-progress-screen.ts 2, progress-data.ts 1 | progress-screen.ts 2 |
| `getDayHistFor` | lift-ledger-progress-screen.ts 1, progress-data.ts 1 | progress-screen.ts 1 |
| `getExWeightsFor` | lift-ledger-progress-screen.ts 4, progress-data.ts 1, set-logging.ts 1 | progress-screen.ts 3 |
| `getPrograms` | bug-report-init.ts 1, day-detail.ts 1, day-status.ts 1, lift-ledger-progress-screen.ts 1, overlays.ts 5, program-manage.ts 7, programs.ts 9, progress-data.ts 2, rest-day-shell.ts 1, set-logging.ts 1, wizard-generate.ts 1, wizard.ts 1 | e1rm-card.ts 1, goal-sheet.ts 1, mile-nudge.ts 2, mile-sheet.ts 1, program-list.ts 1, progress-screen.ts 1, wizard.ts 1 |
