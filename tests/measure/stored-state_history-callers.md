# Stored state: who reads and writes the day history?

Written by `tests/measure/stored-state_history-callers.mjs`, before the fourth lift slice. Static counts over the
working tree, comments stripped: calls in the legacy script (a function's own declaration and the import and export
lists left out), mentions in core and in the Angular screens (which reach the page by name through the bridge), and
the number of test files that name it.

| Function | Legacy callers (file, calls) | Core | Angular (file, mentions) | Tests (files) |
|---|---|---|---|---|
| `getDayHist` | set-logging.ts 1, storage.ts 2 | none | mile-nudge.ts 1 | 1 |
| `getDayHistFor` | lift-ledger-progress-screen.ts 1, progress-data.ts 1 | none | progress-screen.ts 1 | none |
| `saveDayHist` | storage.ts 2 | none | none | none |
| `snapshotDay` | day-status.ts 5, log-entries.ts 1, popups-streaks-reminders.ts 1, storage.ts 1 | none | deck.ts 1 | 2 |
| `resnapshotDayEdit` | swap-sheet.ts 3 | none | none | none |

| Key | Files that name it outside comments (file, mentions) |
|---|---|
| `ia_hist_` | program-manage.ts 3, storage.ts 3 |
