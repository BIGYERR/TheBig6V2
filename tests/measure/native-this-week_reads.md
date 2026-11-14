# This Week in the Expo app: what the screen reads, and what core holds

Written by `node tests/measure/native-this-week_reads.ts` (read-only). The tree it read: the working copy.

## 1. The reaches

- Bridge calls in `frontends/app/src/app/screens/week-view`, counted as the inventory counts them: **38**.
- Distinct legacy names reached (calls, `global` reads, the takeover): **41**.

### 1a. What the screen draws from (29 names)

| Name | Declared in | Lines | Page names it reaches | It touches |
|---|---|---|---|---|
| `_fmtStartDay` | page `wizard.ts` | 4 | none | pure |
| `_liveInjuryOverlay` | page `overlays.ts` | 11 | 3 more (28 lines in all): `activeProg`, `overlayWeekRange`, `weekOfDate` | the active program, clock |
| `_parseLocalDate` | **core** `calendar.ts` | 7 | | |
| `activeProg` | page `rest-day-shell.ts` | 1 | none | the active program |
| `activeProgId` | page `rest-day-shell.ts` | 1 | none | the active program |
| `asyIcon` | **core** `icons.ts` | 1 | | |
| `calcCurrentWeek` | page `week-view-sections.ts` | 9 | 1 more (10 lines in all): `activeProg` | the active program, clock |
| `completedKey` | page `storage.ts` | 1 | none | pure |
| `computeStreak` | page `popups-streaks-reminders.ts` | 11 | 13 more (60 lines in all): `scheduledDays`, `activeProg`, `dayDateFor`, `dayOffset`, `dayBeforeStart`, `_progDayDate`, `statusOf`, `iaStore`, `activeProgId`, … | store, the active program, clock |
| `currentWeek` | page `rest-day-shell.ts` | 1 | none | the active program |
| `DAY_FULL` | page `wizard.ts` | 1 | none | pure |
| `dayBeforeStart` | page `week-view-sections.ts` | 8 | 1 more (15 lines in all): `_progDayDate` | pure |
| `dayIsTravel` | page `overlays.ts` | 4 | 1 more (8 lines in all): `dayOverlayInfo` | pure |
| `getCompleted` | page `storage.ts` | 1 | 2 more (3 lines in all): `iaStore`, `activeProgId` | store, the active program |
| `getLogs` | page `storage.ts` | 1 | 2 more (3 lines in all): `iaStore`, `activeProgId` | store, the active program |
| `getPartSkips` | page `storage.ts` | 1 | 2 more (3 lines in all): `iaStore`, `activeProgId` | store, the active program |
| `getWeekMonday` | **core** `calendar.ts` | 9 | | |
| `heroSummary` | page `week-view-sections.ts` | 17 | none | pure |
| `INJURY_REGIONS` | **core** `injury.ts` | 9 | | |
| `liftFocusCode` | page `week-view-sections.ts` | 11 | none | pure |
| `logKey` | page `storage.ts` | 1 | none | pure |
| `overlayWeekRange` | page `overlays.ts` | 9 | 1 more (16 lines in all): `weekOfDate` | pure |
| `progAlignment` | page `programs.ts` | 4 | none | pure |
| `restDayTip` | page `week-view-sections.ts` | 7 | 1 more (29 lines in all): `NUTRITION_TIPS` | clock |
| `restLogLines` | page `week-view-sections.ts` | 7 | 4 more (14 lines in all): `restDist`, `REST_UNIT`, `restLogHead`, `REST_WORD` | pure |
| `runSessionCode` | page `week-view-sections.ts` | 15 | none | pure |
| `sessionTimeEst` | page `week-view-sections.ts` | 31 | 2 more (47 lines in all): `_secRounds`, `_itemSets` | pure |
| `statusOf` | page `popups-streaks-reminders.ts` | 1 | 2 more (3 lines in all): `iaStore`, `activeProgId` | store, the active program |
| `wildcardOn` | page `random-wildcard.ts` | 4 | 5 more (13 lines in all): `wildcardDaySet`, `getWildcardDone`, `iaStore`, `activeProgId`, `completedKey` | store, the active program |

In core already: **4 of 29** (`_parseLocalDate`, `asyIcon`, `getWeekMonday`, `INJURY_REGIONS`). In the page: **25**.

### 1b. What a tap does (12 names): out of this session, each a write or another screen

| Name | Declared in | Lines | Page names it reaches | It touches |
|---|---|---|---|---|
| `_setCurrentWeek` | page `rest-day-shell.ts` | 1 | 1 more (2 lines in all): `currentWeek` | the active program |
| `openDayKey` | page `week-view-sections.ts` | 7 | 150 more (1322 lines in all): `activeProg`, `currentWeek`, `dayBeforeStart`, `_progDayDate`, `showToast`, `openRestSheet`, `restJogEligible`, `_restHeld`, `getLogs`, … | store, DOM, the active program, clock |
| `openInjurySheet` | page `overlays.ts` | 11 | 21 more (167 lines in all): `activeProg`, `showToast`, `_liveInjuryOverlay`, `overlayWeekRange`, `weekOfDate`, `_ovDraft`, `_isoToday`, `renderOverlaySheet`, `_renderInjuryTab`, … | DOM, the active program, clock |
| `openOverlaySheet` | page `overlays.ts` | 10 | 20 more (155 lines in all): `activeProg`, `showToast`, `_ovDraft`, `_isoToday`, `_addDaysIso`, `renderOverlaySheet`, `_renderInjuryTab`, `_INJ_EFFECT`, `_INJ_SAFETY`, … | DOM, the active program, clock |
| `openRandom` | page `random-wildcard.ts` | 5 | 55 more (652 lines in all): `buildRandFilterBar`, `reroll`, `getActivePool`, `activeProg`, `randFilter`, `RAND_POOLS`, `lastRandIdx`, `_setLastRandIdx`, `_setCurrentRandIdx`, … | store, DOM, the active program, clock |
| `openRestSheet` | page `rest-day-shell.ts` | 11 | 49 more (363 lines in all): `activeProg`, `showToast`, `restJogEligible`, `dayBeforeStart`, `_progDayDate`, `_restHeld`, `getLogs`, `iaStore`, `activeProgId`, … | store, DOM, the active program, clock |
| `renderOverlayChip` | page `overlays.ts` | 50 | 101 more (1346 lines in all): `activeProg`, `overlayWeekRange`, `weekOfDate`, `_fmtDateWd`, `_addDaysIso`, `OVERLAY_TYPE_LABEL`, `overlaySpanLabel`, `_fmtDate`, `removeOverlay`, … | store, DOM, the active program, clock |
| `renderWeekView` | page `week-view-sections.ts` | 224 | 101 more (1346 lines in all): `activeProg`, `currentWeek`, `overlayWeekRange`, `weekOfDate`, `dayBeforeStart`, `_progDayDate`, `dayIsTravel`, `dayOverlayInfo`, `_liveInjuryOverlay`, … | store, DOM, the active program, clock |
| `setProgRace` | page `programs.ts` | 14 | 102 more (1360 lines in all): `activeProg`, `progAlignment`, `showToast`, `getPrograms`, `iaStore`, `activeProgId`, `savePrograms`, `_setActiveProg`, `refreshProgram`, … | store, DOM, the active program, clock |
| `setProgStart` | page `programs.ts` | 15 | 104 more (1386 lines in all): `activeProg`, `resolveStartDate`, `_rsRace`, `progTestPin`, `getPrograms`, `iaStore`, `activeProgId`, `savePrograms`, `_setActiveProg`, … | store, DOM, the active program, clock |
| `skipPart` | page `day-status.ts` | 5 | 6 more (20 lines in all): `dayPartsOf`, `_partsDay`, `activeProg`, `snapshotDay`, `iaStore`, `activeProgId` | store, the active program, clock |
| `updateRandCounter` | page `random-wildcard.ts` | 8 | 6 more (174 lines in all): `getWildcardDone`, `iaStore`, `activeProgId`, `activeProg`, `RAND_POOLS`, `resetPending` | store, DOM, the active program |

### 1c. The grid itself

`activeProg` is not a stored value: `loadActiveProgram` sets it to `refreshProgram(stored program)`.

| Name | Declared in | Lines | Page names it reaches | It touches |
|---|---|---|---|---|
| `refreshProgram` | page `program-manage.ts` | 126 | 20 more (318 lines in all): `getPrograms`, `iaStore`, `savePrograms`, `progTestPin`, `_isoToday`, `paceShiftMap`, `applyOverlays`, `overlayWeekRange`, `weekOfDate`, … | store, DOM, clock |
| `applyOverlays` | page `overlays.ts` | 36 | 4 more (60 lines in all): `overlayWeekRange`, `weekOfDate`, `_progDayDate`, `showToast` | DOM |
| `applyRestDayMoves` | page `rest-day-shell.ts` | 15 | none | pure |
| `applySessionSwaps` | page `swaps-edits.ts` | 22 | 2 more (32 lines in all): `_dayPlanCfg`, `dayOverlayInfo` | pure |
| `applyDayEdits` | page `swaps-edits.ts` | 27 | 1 more (28 lines in all): `ssSkipToken` | pure |
| `pruneDayEdits` | page `swaps-edits.ts` | 1 | 1 more (2 lines in all): `iaStore` | store |
| `paceShiftMap` | page `overlays.ts` | 42 | none | clock |
| `progTestPin` | page `programs.ts` | 8 | none | pure |
| `loadActiveProgram` | page `program-manage.ts` | 1 | 31 more (337 lines in all): `iaStore`, `_setActiveProgId`, `activeProgId`, `_setActiveProg`, `activeProg`, `_setCurrentDayKey`, `currentDayKey`, `_setCurrentWeek`, `currentWeek`, … | store, DOM, the active program, clock |

## 2. The stored grid against the grid the screen draws

For each launch: the days of `ia_programs`' stored grid whose JSON differs from the same day of `activeProg`
(what `refreshProgram` handed back), over every day either holds; and the same count inside the week holding today.

### 2a. The standard history (tests/support/stored-state.ts `life`), the ten seeded programs

| Program | Launch | Week | Days that differ | Of them in the week holding today | What differs |
|---|---|---|---|---|---|
| half-manny (Mario | 0 | 1 | 0 of 98 | 0 of 7 | nothing |
| half-manny (Mario | 1 | 1 | 2 of 98 | 2 of 7 | sections |
| half-manny (Mario | 2 | 2 | 4 of 98 | 0 of 7 | title, cardio, sections |
| half-manny (Mario | 3 | 3 | 60 of 98 | 5 of 7 | title, cardio, sections |
| half-manny (Mario | 4 | 6 | 46 of 98 | 5 of 7 | title, cardio, sections |
| 5k race | 0 | 1 | 0 of 56 | 0 of 7 | nothing |
| 5k race | 1 | 1 | 2 of 56 | 2 of 7 | sections |
| 5k race | 2 | 2 | 44 of 56 | 6 of 7 | sections, cardio, title |
| 5k race | 3 | 3 | 17 of 56 | 6 of 7 | sections, cardio, title |
| 5k race | 4 | 6 | 4 of 56 | 0 of 7 | sections, cardio |
| 10k race | 0 | 1 | 0 of 56 | 0 of 7 | nothing |
| 10k race | 1 | 1 | 2 of 56 | 2 of 7 | sections |
| 10k race | 2 | 2 | 37 of 56 | 5 of 7 | sections, title, cardio |
| 10k race | 3 | 3 | 15 of 56 | 5 of 7 | sections, title, cardio |
| 10k race | 4 | 6 | 4 of 56 | 0 of 7 | sections, title, cardio |
| marathon | 0 | 1 | 0 of 126 | 0 of 7 | nothing |
| marathon | 1 | 1 | 2 of 126 | 2 of 7 | sections |
| marathon | 2 | 2 | 3 of 126 | 0 of 7 | cardio, sections, title |
| marathon | 3 | 3 | 79 of 126 | 5 of 7 | cardio, sections, title |
| marathon | 4 | 6 | 65 of 126 | 5 of 7 | cardio, sections, title |
| 1.5 mile test goal | 0 | 1 | 0 of 77 | 0 of 7 | nothing |
| 1.5 mile test goal | 1 | 2 | 2 of 77 | 2 of 7 | sections |
| 1.5 mile test goal | 2 | 3 | 4 of 77 | 0 of 7 | cardio, title, sections |
| 1.5 mile test goal | 3 | 4 | 40 of 77 | 5 of 7 | cardio, title, sections |
| 1.5 mile test goal | 4 | 7 | 26 of 77 | 5 of 7 | cardio, sections, title |
| 1.5 mile test goal | 0 | 1 | 0 of 77 | 0 of 7 | nothing |
| 1.5 mile test goal | 1 | 2 | 2 of 77 | 2 of 7 | sections |
| 1.5 mile test goal | 2 | 3 | 56 of 77 | 6 of 7 | sections, title, cardio |
| 1.5 mile test goal | 3 | 4 | 40 of 77 | 6 of 7 | sections, title, cardio |
| 1.5 mile test goal | 4 | 7 | 24 of 77 | 4 of 7 | sections, title, cardio |
| run base | 0 | 1 | 0 of 63 | 0 of 7 | nothing |
| run base | 1 | 2 | 1 of 63 | 1 of 7 | sections |
| run base | 2 | 3 | 3 of 63 | 0 of 7 | title, sections |
| run base | 3 | 4 | 24 of 63 | 4 of 7 | title, sections, cardio |
| run base | 4 | 7 | 13 of 63 | 4 of 7 | title, sections, cardio |
| bike ftp | 0 | 1 | 0 of 49 | 0 of 7 | nothing |
| bike ftp | 1 | 2 | 2 of 49 | 2 of 7 | sections |
| bike ftp | 2 | 3 | 32 of 49 | 6 of 7 | sections |
| bike ftp | 3 | 4 | 17 of 49 | 6 of 7 | sections |
| bike ftp | 4 | 7 | 4 of 49 | 0 of 7 | sections |
| swim 500 | 0 | 1 | 0 of 84 | 0 of 7 | nothing |
| swim 500 | 1 | 1 | 2 of 84 | 2 of 7 | sections |
| swim 500 | 2 | 2 | 57 of 84 | 5 of 7 | sections |
| swim 500 | 3 | 3 | 15 of 84 | 5 of 7 | sections |
| swim 500 | 4 | 6 | 4 of 84 | 0 of 7 | sections |
| run base and bike base | 0 | 1 | 0 of 63 | 0 of 7 | nothing |
| run base and bike base | 1 | 2 | 2 of 63 | 2 of 7 | sections |
| run base and bike base | 2 | 3 | 4 of 63 | 0 of 7 | cardio, sections |
| run base and bike base | 3 | 4 | 30 of 63 | 5 of 7 | cardio, sections |
| run base and bike base | 4 | 7 | 16 of 63 | 5 of 7 | cardio, sections |

Launch 0 is the program just generated; 1 to 3 the first three weeks trained (a swap, a skipped move, an added one, an injury, a moved rest day, travel, a Wildcard); 4 a launch after two weeks away.

**Over 50 launches: 40 hold a day that differs, 31 hold one in the week holding today. Days: 806 of 3745 differ, 127 of 350 in the week holding today.**

### 2b. The backup corpus: each release's backup, loaded and launched on the day it was made

| Backup | Made | Week | Days that differ | Of them in the week holding today | What differs |
|---|---|---|---|---|---|
| v0.259.4 | 2026-09-01 | 1 | 0 of 98 | 0 of 7 | nothing |
| v0.260.0 | 2026-09-01 | 1 | 0 of 98 | 0 of 7 | nothing |
| v0.261.0 | 2026-09-01 | 1 | 0 of 98 | 0 of 7 | nothing |

