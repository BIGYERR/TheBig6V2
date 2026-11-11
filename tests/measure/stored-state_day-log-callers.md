# Stored state: who reads and writes the day's log, completion and parts?

Written by `tests/measure/stored-state_day-log-callers.mjs`, before the third lift slice. Static counts over the
working tree, comments stripped: calls in the legacy script (a function's own declaration and the import and export
lists left out), mentions in core and in the Angular screens (which reach the page by name through the bridge), and
the number of test files that name it. **This report is the tree at v0.261.3, before the slice**; run again, the script
prints the tree as it stands.

| Function | Legacy callers (file, calls) | Core | Angular (file, mentions) | Tests (files) |
|---|---|---|---|---|
| `getLogs` | day-detail.ts 2, day-status.ts 4, rest-day-shell.ts 4, set-logging.ts 1, storage.ts 3, week-view-sections.ts 2, wheel-log.ts 1 | none | day-detail.ts 3, session-log.ts 1, deck.ts 2, mile-nudge.ts 1, week-view.ts 1 | 4 |
| `getLogsFor` | lift-ledger-progress-screen.ts 2, progress-data.ts 1 | none | progress-screen.ts 2 | 1 |
| `saveLogs` | day-status.ts 2, rest-day-shell.ts 2, storage.ts 2 | none | session-log.ts 1, deck.ts 1 | 2 |
| `restNorm` | storage.ts 1 | none | none | none |
| `restNormAll` | storage.ts 2 | none | none | none |
| `logKey` | day-detail.ts 1, day-status.ts 4, storage.ts 3, week-view-sections.ts 1, wheel-log.ts 1 | none | day-detail.ts 2, session-log.ts 1, deck.ts 2, week-view-model.ts 1, week-view.ts 2 | 5 |
| `getCompleted` | day-detail.ts 1, day-status.ts 5, popups-streaks-reminders.ts 4, rest-day-shell.ts 1, week-view-sections.ts 1 | none | day-detail.ts 1, mile-nudge.ts 1, week-view.ts 1 | 1 |
| `saveCompleted` | day-status.ts 7, popups-streaks-reminders.ts 1 | none | none | 4 |
| `completedKey` | day-detail.ts 2, day-status.ts 6, popups-streaks-reminders.ts 6, random-wildcard.ts 2, rest-day-shell.ts 5, storage.ts 2, week-view-sections.ts 3 | none | day-detail.ts 2, week-view-model.ts 1, week-view.ts 2 | 6 |
| `getPartSkips` | day-status.ts 3 | none | week-view.ts 1 | 2 |
| `savePartSkips` | day-status.ts 2 | none | none | none |
| `readSetDraft` | set-logging.ts 1 | none | session-sections-reads.ts 1 | none |
| `writeSetDraft` | set-logging.ts 1 | none | none | 3 |
| `clearSetDraft` | day-detail.ts 1 | none | none | none |
| `toggleComplete` | none | none | none | none |
| `markDayComplete` | none | none | deck.ts 1 | 2 |
| `handleDayStatus` | day-detail.ts 1, day-status.ts 1 | none | day-detail.ts 2 | 9 |
| `persistLogFields` | day-detail.ts 1, day-status.ts 5, log-entries.ts 1 | none | day-detail.ts 1, session-log.ts 3 | 3 |
| `dayPartsOf` | day-status.ts 2 | none | none | 2 |
| `partRunLogged` | day-status.ts 1 | none | none | 1 |
| `settleParts` | day-status.ts 2 | none | none | none |
| `skipPart` | none | none | week-view.ts 1 | 3 |
| `clearPartSkips` | day-status.ts 1, popups-streaks-reminders.ts 1 | none | none | none |
| `cardioEntryLive` | day-status.ts 1, wheel-log.ts 1 | none | day-detail.ts 1 | 1 |
| `setCardioSwap` | wheel-log.ts 1 | none | session-log.ts 2 | 4 |
| `statusOf` | day-status.ts 2, popups-streaks-reminders.ts 4, week-view-sections.ts 1 | none | day-detail.ts 1, deck.ts 1, week-view-model.ts 1, week-view.ts 2 | 8 |

| Key | Files that name it outside comments (file, mentions) |
|---|---|
| `ia_logs_` | program-manage.ts 2, storage.ts 3 |
| `ia_comp_` | program-manage.ts 2, storage.ts 2 |
| `ia_parts_` | program-manage.ts 1, storage.ts 2 |
