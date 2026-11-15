# The swipe deck in the Expo app: what today's deck reaches, and what core holds

Written by `node tests/measure/native-deck_reads.mjs` (read-only). The tree it read: the working copy.

- Files read: `deck/deck-model.ts`, `deck/deck-state.ts`, `deck/deck.ts`, `deck/grow-motion.ts`, `day-detail/session-sections.ts`, `day-detail/session-sections-model.ts`, `day-detail/session-sections-reads.ts`.
- Reaches into the legacy script (bridge calls and `global` reads): **83**, to **62** distinct names.

## What the cards are drawn from (33 names)

| Name | Declared in | Lines | Page names it reaches | It touches | Reached from |
|---|---|---|---|---|---|
| `_rxCache` | page `set-logging.ts` | 1 | none | pure | session-sections-reads.ts |
| `_secRounds` | page `week-view-sections.ts` | 10 | 1 more (16 lines in all): `_itemSets` | pure | deck.ts, session-sections-reads.ts |
| `_staleWarnShown` | page `rest-day-shell.ts` | 1 | none | pure | session-sections-reads.ts |
| `_staleWarnSrc` | page `rest-day-shell.ts` | 1 | none | pure | session-sections-reads.ts |
| `_stripLeadingSets` | page `week-view-sections.ts` | 7 | none | pure | session-sections-reads.ts |
| `_wildDraw` | page `random-wildcard.ts` | 1 | none | pure | session-sections-reads.ts |
| `activeProg` | page `rest-day-shell.ts` | 1 | none | the active program | deck.ts, session-sections-reads.ts |
| `asyIcon` | **core** `icons.ts` | 1 | |  | deck.ts, session-sections.ts |
| `crossProgLastEntry` | page `set-logging.ts` | 17 | 4 more (21 lines in all): `getPrograms`, `iaStore`, `activeProgId`, `getExWeightsFor`; core: `readPrograms`, `storageStore`, `readLiftLog`, `foldExAliasKeys` | store, the active program | session-sections-reads.ts |
| `currentDayKey` | page `rest-day-shell.ts` | 1 | none | the active program | session-sections-reads.ts |
| `currentWeek` | page `rest-day-shell.ts` | 1 | none | the active program | deck.ts, session-sections-reads.ts |
| `entryDay` | **core** `state-lift-log.ts` | 6 | |  | deck.ts, session-sections-reads.ts |
| `exControlFlags` | page `set-logging.ts` | 9 | none; core: `_pattern`, `_auxFamily` | pure | session-sections-reads.ts |
| `exStoreKey` | **core** `exercise-library.ts` | 1 | |  | session-sections-reads.ts |
| `getExWeights` | page `log-entries.ts` | 1 | 2 more (3 lines in all): `iaStore`, `activeProgId`; core: `readLiftLog`, `storageStore` | store, the active program | deck.ts, session-sections-reads.ts |
| `getLogs` | page `storage.ts` | 1 | 2 more (3 lines in all): `iaStore`, `activeProgId`; core: `readDayLogs`, `storageStore` | store, the active program | deck.ts |
| `isKBExercise` | page `log-entries.ts` | 5 | 1 more (9 lines in all): `hasEquip`; core: `EQUIP_TOKENS` | pure | session-sections-reads.ts |
| `isRepExercise` | **core** `exercise-kinds.ts` | 9 | |  | session-sections-reads.ts |
| `isStaleTs` | page `set-logging.ts` | 4 | 2 more (18 lines in all): `recencyBucket`, `STALE_LOAD_DAYS` | clock | session-sections-reads.ts |
| `isTimeExercise` | **core** `exercise-kinds.ts` | 7 | |  | session-sections-reads.ts |
| `isTrackableWeight` | **core** `exercise-kinds.ts` | 30 | |  | session-sections-reads.ts |
| `logKey` | page `storage.ts` | 1 | none; core: `dayStoreKey` | pure | deck.ts |
| `parseRx` | page `week-view-sections.ts` | 18 | 1 more (50 lines in all): `_parseRxLoose` | pure | session-sections-reads.ts |
| `readSetDraft` | page `storage.ts` | 3 | 4 more (7 lines in all): `iaStore`, `activeProgId`, `currentWeek`, `currentDayKey`; core: `setDraftOf`, `storageStore` | store, the active program | session-sections-reads.ts |
| `recencyLabel` | page `set-logging.ts` | 20 | 1 more (33 lines in all): `recencyBucket` | clock | session-sections-reads.ts |
| `rxSuffix` | page `week-view-sections.ts` | 6 | none | pure | session-sections-reads.ts |
| `setsSubLabel` | page `set-logging.ts` | 7 | 2 more (21 lines in all): `setsVaried`, `flatDiverged` | pure | session-sections-reads.ts |
| `setsSummary` | page `set-logging.ts` | 9 | 3 more (29 lines in all): `rxSuffix`, `setsVaried`, `flatDiverged` | pure | session-sections-reads.ts |
| `setsVaried` | page `set-logging.ts` | 4 | none | pure | session-sections-reads.ts |
| `statusOf` | page `popups-streaks-reminders.ts` | 1 | 2 more (3 lines in all): `iaStore`, `activeProgId`; core: `dayStatus`, `storageStore` | store, the active program | deck.ts |
| `swapOriginOf` | page `swap-sheet.ts` | 7 | 6 more (13 lines in all): `_wildDraw`, `activeProgId`, `currentDayKey`, `getSwaps`, `iaStore`, `currentWeek`; core: `readSwaps`, `storageStore` | store, the active program | session-sections-reads.ts |
| `toDispW` | page `set-logging.ts` | 4 | none | DOM | session-sections-reads.ts |
| `window` | a binding of the page (no declaration found) | | | | session-sections-reads.ts |

In core: **6**. In the page: **26**, which between them reach **37** page declarations, **212** lines. Bindings with no declaration: 1.

## Set logging: the handlers a set row, the load field and Log call (9 names)

| Name | Declared in | Lines | Page names it reaches | It touches | Reached from |
|---|---|---|---|---|---|
| `autoSaveSets` | page `set-logging.ts` | 7 | 25 more (167 lines in all): `commitSetsLive`, `getExWeights`, `iaStore`, `activeProgId`, `currentWeek`, `currentDayKey`, `saveExWeight`, …; core: `readLiftLog`, `storageStore`, `entryDay`, `recordDaySnapshot`, `recordLift`, `writeLiftLog`, … | store, **writes**, DOM, the active program, clock | session-sections.ts |
| `cascadeSetWeights` | page `set-logging.ts` | 10 | 10 more (98 lines in all): `markTopSet`, `setWeightVals`, `setsVaried`, `refreshSetSummary`, `setRepVals`, `_rxCache`, `setsSummary`, … | DOM | session-sections.ts |
| `fillAllSetWeights` | page `set-logging.ts` | 9 | 27 more (191 lines in all): `markTopSet`, `setWeightVals`, `setsVaried`, `refreshSetSummary`, `setRepVals`, `_rxCache`, `setsSummary`, …; core: `readLiftLog`, `storageStore`, `entryDay`, `recordDaySnapshot`, `recordLift`, `writeLiftLog`, … | store, **writes**, DOM, the active program, clock | session-sections.ts |
| `onSetWeight` | page `set-logging.ts` | 5 | 10 more (93 lines in all): `markTopSet`, `setWeightVals`, `setsVaried`, `refreshSetSummary`, `setRepVals`, `_rxCache`, `setsSummary`, … | DOM | session-sections.ts |
| `reuseWeight` | page `set-logging.ts` | 6 | 28 more (198 lines in all): `cascadeSetWeights`, `markTopSet`, `setWeightVals`, `setsVaried`, `refreshSetSummary`, `setRepVals`, `_rxCache`, …; core: `readLiftLog`, `storageStore`, `entryDay`, `recordDaySnapshot`, `recordLift`, `writeLiftLog`, … | store, **writes**, DOM, the active program, clock | session-sections.ts |
| `saveExWeight` | page `day-detail.ts` | 36 | 21 more (140 lines in all): `activeProg`, `setWeightVals`, `toStoreW`, `showToast`, `logExerciseWeight`, `getExWeights`, `iaStore`, …; core: `readLiftLog`, `storageStore`, `recordDaySnapshot`, `recordLift`, `writeLiftLog`, `dropSetDraft` | store, **writes**, DOM, the active program, clock | deck.ts, session-sections.ts |
| `setDelta` | page `set-logging.ts` | 13 | 9 more (86 lines in all): `refreshSetSummary`, `setWeightVals`, `setRepVals`, `_rxCache`, `setsSummary`, `rxSuffix`, `setsVaried`, … | DOM | session-sections.ts |
| `stepSet` | page `set-logging.ts` | 6 | 28 more (187 lines in all): `setDelta`, `refreshSetSummary`, `setWeightVals`, `setRepVals`, `_rxCache`, `setsSummary`, `rxSuffix`, …; core: `readLiftLog`, `storageStore`, `entryDay`, `recordDaySnapshot`, `recordLift`, `writeLiftLog`, … | store, **writes**, DOM, the active program, clock | session-sections.ts |
| `toggleSets` | page `set-logging.ts` | 5 | 10 more (93 lines in all): `markTopSet`, `setWeightVals`, `setsVaried`, `refreshSetSummary`, `setRepVals`, `_rxCache`, `setsSummary`, … | DOM | deck.ts, session-sections.ts |

In core: **0**. In the page: **9**, which between them reach **35** page declarations, **237** lines. Bindings with no declaration: 0.

## Call it: Mark the day done (6 names)

| Name | Declared in | Lines | Page names it reaches | It touches | Reached from |
|---|---|---|---|---|---|
| `fireCompletionPopup` | page `popups-streaks-reminders.ts` | 11 | 35 more (273 lines in all): `finalScheduledDay`, `scheduledDays`, `activeProg`, `dayDateFor`, `dayOffset`, `dayBeforeStart`, `seasonShown`, …; core: `ALL_DAYS_ORDER`, `getWeekMonday`, `_progDayDate`, `_parseLocalDate`, `storageStore`, `ASY_ICON_PATHS`, … | store, **writes**, DOM, the active program, clock | deck.ts |
| `markDayComplete` | page `day-status.ts` | 4 | 88 more (1053 lines in all): `snapshotDay`, `activeProg`, `iaStore`, `activeProgId`, `renderWeekView`, `currentWeek`, `dayBeforeStart`, …; core: `recordDaySnapshot`, `storageStore`, `setDayStatus`, `_parseLocalDate`, `overlayWeekRange`, `ALL_DAYS_ORDER`, … | store, **writes**, DOM, the active program, clock | deck.ts |
| `ruReset` | page `rest-timer.ts` | 1 | 11 more (20 lines in all): `ruPause`, `_ruRunning`, `_ruElapsed`, `_ruClock`, `_ruStart`, `_ruId`, `_ruRender`, … | DOM, clock | deck.ts |
| `saveLogs` | page `storage.ts` | 1 | 2 more (3 lines in all): `iaStore`, `activeProgId`; core: `writeDayLogs`, `storageStore` | store, **writes**, the active program | deck.ts |
| `showToast` | page `rest-day-shell.ts` | 1 | none | DOM | deck.ts |
| `snapshotDay` | page `storage.ts` | 6 | 3 more (9 lines in all): `activeProg`, `iaStore`, `activeProgId`; core: `recordDaySnapshot`, `storageStore` | store, **writes**, the active program | deck.ts |

In core: **0**. In the page: **6**, which between them reach **112** page declarations, **1121** lines. Bindings with no declaration: 0.

## Edits: skip, put back, swap, remove (7 names)

| Name | Declared in | Lines | Page names it reaches | It touches | Reached from |
|---|---|---|---|---|---|
| `openSwapSheet` | page `swap-sheet.ts` | 53 | 13 more (133 lines in all): `_editDay`, `_liveDay`, `activeProg`, `currentWeek`, `currentDayKey`, `showToast`, `_swapCtx`, …; core: `_dayPlanCfg`, `_pattern`, `_PATTERN_REGION`, `_ssPartnerOf`, `_swapInjuryOK`, `_ssLegal`, … | DOM, the active program | deck.ts, session-sections.ts |
| `removeAddedExercise` | page `swap-sheet.ts` | 10 | 133 more (1159 lines in all): `_liveDay`, `activeProg`, `currentWeek`, `currentDayKey`, `activeProgId`, `clearAdd`, `iaStore`, …; core: `dropAddEdit`, `storageStore`, `readWildcardDone`, `exStoreKey`, `readLiftLog`, `readPrograms`, … | store, **writes**, DOM, the active program, clock | session-sections.ts |
| `skipExercise` | page `swap-sheet.ts` | 8 | 133 more (1157 lines in all): `_editDay`, `_liveDay`, `activeProg`, `currentWeek`, `currentDayKey`, `activeProgId`, `recordSkip`, …; core: `addSkipEdit`, `storageStore`, `readWildcardDone`, `exStoreKey`, `readLiftLog`, `readPrograms`, … | store, **writes**, DOM, the active program, clock | session-sections.ts |
| `skipSuperset` | page `swap-sheet.ts` | 7 | 133 more (1156 lines in all): `_editDay`, `_liveDay`, `activeProg`, `currentWeek`, `currentDayKey`, `activeProgId`, `recordSkip`, …; core: `addSkipEdit`, `storageStore`, `ssSkipToken`, `readWildcardDone`, `exStoreKey`, `readLiftLog`, … | store, **writes**, DOM, the active program, clock | session-sections.ts |
| `undoSwap` | page `swap-sheet.ts` | 25 | 132 more (1168 lines in all): `activeProg`, `activeProgId`, `_editDay`, `_liveDay`, `currentWeek`, `currentDayKey`, `getSwaps`, …; core: `readSwaps`, `storageStore`, `applySwapPrefs`, `readWildcardDone`, `exStoreKey`, `readLiftLog`, … | store, **writes**, DOM, the active program, clock | deck.ts, session-sections.ts |
| `unskipExercise` | page `swap-sheet.ts` | 6 | 133 more (1155 lines in all): `_editDay`, `_liveDay`, `activeProg`, `currentWeek`, `currentDayKey`, `activeProgId`, `clearSkip`, …; core: `dropSkipEdit`, `storageStore`, `readWildcardDone`, `exStoreKey`, `readLiftLog`, `readPrograms`, … | store, **writes**, DOM, the active program, clock | session-sections.ts |
| `unskipSuperset` | page `swap-sheet.ts` | 6 | 133 more (1155 lines in all): `_editDay`, `_liveDay`, `activeProg`, `currentWeek`, `currentDayKey`, `activeProgId`, `clearSkip`, …; core: `dropSkipEdit`, `storageStore`, `ssSkipToken`, `readWildcardDone`, `exStoreKey`, `readLiftLog`, … | store, **writes**, DOM, the active program, clock | session-sections.ts |

In core: **0**. In the page: **7**, which between them reach **150** page declarations, **1341** lines. Bindings with no declaration: 0.

## Opening, closing and the screens around the deck (7 names)

| Name | Declared in | Lines | Page names it reaches | It touches | Reached from |
|---|---|---|---|---|---|
| `_setCurrentDayKey` | page `rest-day-shell.ts` | 1 | 1 more (2 lines in all): `currentDayKey` | the active program | deck.ts |
| `_setStaleWarnShown` | page `rest-day-shell.ts` | 1 | 1 more (2 lines in all): `_staleWarnShown` | pure | deck.ts, session-sections-reads.ts |
| `_setStaleWarnSrc` | page `rest-day-shell.ts` | 1 | 1 more (2 lines in all): `_staleWarnSrc` | pure | deck.ts, session-sections-reads.ts |
| `blurFieldIn` | page `rest-day-shell.ts` | 5 | none | pure | deck.ts |
| `openDetail` | page `day-detail.ts` | 51 | 127 more (1110 lines in all): `_setStaleWarnShown`, `_staleWarnShown`, `_setStaleWarnSrc`, `_staleWarnSrc`, `activeProg`, `currentDayKey`, `_setCurrentDayKey`, …; core: `readCompleted`, `storageStore`, `dayStoreKey`, `dayOverlayInfo`, `asyIcon`, `readLiftLog`, … | store, **writes**, DOM, the active program, clock | deck.ts |
| `renderWeekView` | page `week-view-sections.ts` | 224 | 86 more (1043 lines in all): `activeProg`, `currentWeek`, `dayBeforeStart`, `dayIsTravel`, `_liveInjuryOverlay`, `_wkScootCancel`, `_wkScootRaf`, …; core: `_parseLocalDate`, `overlayWeekRange`, `ALL_DAYS_ORDER`, `_progDayDate`, `dayOverlayInfo`, `INJURY_REGIONS`, … | store, **writes**, DOM, the active program, clock | deck.ts |
| `ruResetIfIdle` | page `rest-timer.ts` | 1 | 9 more (18 lines in all): `_ruRunning`, `_ruElapsed`, `_ruRender`, `_ruNow`, `_ruClock`, `_ruStart`, `_rtPad`, … | DOM, clock | deck.ts |

In core: **0**. In the page: **7**, which between them reach **188** page declarations, **2068** lines. Bindings with no declaration: 0.

## The tally

| Group | Names | In core | In the page | Page declarations behind them | Lines |
|---|---|---|---|---|---|
| What the cards are drawn from | 33 | 6 | 26 | 37 | 212 |
| Set logging: the handlers a set row, the load field and Log call | 9 | 0 | 9 | 35 | 237 |
| Call it: Mark the day done | 6 | 0 | 6 | 112 | 1121 |
| Edits: skip, put back, swap, remove | 7 | 0 | 7 | 150 | 1341 |
| Opening, closing and the screens around the deck | 7 | 0 | 7 | 188 | 2068 |

