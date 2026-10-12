# Phase C, step 4: how the tests reach the app (measured 2026-10-12)

App: 801 top-level names in 40 JS files; the engine is 17 files and 203 names. The harness exports 67 names.

| Kind | Files | Meaning |
|---|---|---|
| no app | 10 | never boots the app (pure helpers, `@ia/core`, the e2e code) |
| engine | 2 | only engine names, no document, no app text: can import the engine modules |
| engine + text | 19 | engine names, and reads or edits the app's text (variants, static scans) |
| page | 51 | UI names or a document: stays on the VM until its screen moves (phase E) |
| total | 82 | |

## engine

- `integration/boot.test.ts`: 1 engine names, 0 UI names
- `integration/program-output.test.ts`: 1 engine names, 0 UI names

## engine + text

- `integration/adjacent-day-dedupe.test.ts`: 3 engine names, 0 UI names, reads app text
- `integration/cardio-sessions.test.ts`: 9 engine names, 0 UI names, reads app text
- `integration/core-trunk.test.ts`: 5 engine names, 0 UI names, reads app text
- `integration/deload.test.ts`: 2 engine names, 0 UI names, reads app text
- `integration/duplicate-movements.test.ts`: 3 engine names, 0 UI names, reads app text
- `integration/runner-armor-circuit.test.ts`: 7 engine names, 0 UI names, reads app text
- `integration/session-budget.test.ts`: 8 engine names, 0 UI names, reads app text
- `sweeps/adjacent-day-dedupe.test.ts`: 2 engine names, 0 UI names, reads app text
- `sweeps/cardio-sessions.test.ts`: 1 engine names, 0 UI names, reads app text
- `sweeps/core-trunk.test.ts`: 1 engine names, 0 UI names, reads app text
- `sweeps/deload.test.ts`: 2 engine names, 0 UI names, reads app text
- `sweeps/duplicate-movements.test.ts`: 1 engine names, 0 UI names, reads app text
- `sweeps/engine-modules.test.ts`: 1 engine names, 0 UI names, reads app text
- `sweeps/leg-accessory-trim-order.test.ts`: 5 engine names, 0 UI names, reads app text
- `sweeps/leg-accessory.test.ts`: 5 engine names, 0 UI names, reads app text
- `sweeps/program-output.test.ts`: 1 engine names, 0 UI names, reads app text
- `sweeps/program-shape.test.ts`: 1 engine names, 0 UI names, reads app text
- `sweeps/runner-armor-circuit.test.ts`: 5 engine names, 0 UI names, reads app text
- `sweeps/session-budget.test.ts`: 5 engine names, 0 UI names, reads app text

## page

- `integration/active-program.test.ts`: 1 engine names, 10 UI names, reads app text, a document (activeProgId, activeProg, init, _curScreen, currentWeek, currentDayKey, unarchiveProg, tabGo, …)
- `integration/clock-format.test.ts`: 4 engine names, 2 UI names, reads app text, a document (WD, applySeedData)
- `integration/compound-tier.test.ts`: 10 engine names, 5 UI names, reads app text, a document (activeProg, activeProgId, currentWeek, currentDayKey, openSwapSheet)
- `integration/easy-run-ceiling.test.ts`: 2 engine names, 0 UI names, reads app text, a document
- `integration/engine-modules.test.ts`: 1 engine names, 0 UI names, reads app text, a document
- `integration/equipment-tiers.test.ts`: 12 engine names, 1 UI names, reads app text (swapCandidates)
- `integration/injury-overlays.test.ts`: 8 engine names, 18 UI names, reads app text, a document (_INJ_EFFECT, _ovDraft, _renderTravelTab, calcCurrentWeek, activeProg, _addRxKind, swapCandidates, activeProgId, …)
- `integration/injury-plan-lens.test.ts`: 3 engine names, 16 UI names, reads app text, a document (activeProg, _ovDraft, applyOverlayDraft, imBackFromInjury, currentWeek, currentDayKey, swapCandidates, activeProgId, …)
- `integration/ledger.test.ts`: 1 engine names, 0 UI names, reads app text, a document
- `integration/leg-accessory.test.ts`: 8 engine names, 1 UI names, reads app text, a document (buildSectionsHTML)
- `integration/leg-lift-placement.test.ts`: 2 engine names, 0 UI names, reads app text, a document
- `integration/logging.test.ts`: 1 engine names, 0 UI names, reads app text, a document
- `integration/long-run-day.test.ts`: 2 engine names, 0 UI names, reads app text, a document
- `integration/mile-anchor.test.ts`: 4 engine names, 16 UI names, reads app text, a document (runAnchorSentence, runAnchorLine, renderGoalSheet, renderProgList, showToast, openGoalSheet, selectGoalOpt, _goalSetInput, …)
- `integration/mile-pencil.test.ts`: 3 engine names, 8 UI names, reads app text, a document (showToast, openMileSheet, _goalCurWeek, progDetailHTML, commitMileChange, runAnchorSentence, WD, _mileEntryState)
- `integration/pace-clock.test.ts`: 5 engine names, 5 UI names, reads app text, a document (showToast, WD, activeProg, doGenerate, _mileEntryState)
- `integration/pace-wizard.test.ts`: 2 engine names, 8 UI names, reads app text, a document (showToast, WD, wizardStep, WIZARD_STEPS, renderWizardStep, updateRaceDateFeedback, _mileEntryState, activeProg)
- `integration/pop-ups.test.ts`: 2 engine names, 10 UI names, reads app text, a document (POP_CFG, popFire, POP_POOLS, activeProgId, activeProg, maybeShowReminder, popPick, fireWildcardPopup, …)
- `integration/program-shape.test.ts`: 1 engine names, 0 UI names, reads app text, a document
- `integration/progress.test.ts`: 0 engine names, 2 UI names, reads app text, a document (ledgerModel, buildMainLiftBlock)
- `integration/race-date.test.ts`: 3 engine names, 22 UI names, reads app text, a document (activeProg, setProgRace, setProgStart, currentDayKey, currentWeek, openDayKey, restDayEligible, scheduledDays, …)
- `integration/rest-timer.test.ts`: 1 engine names, 8 UI names, reads app text, a document (_rtInited, _rtSide, _rtExpanded, _rtIntroTO, _rtDragging, _rtInit, _rtSetExpanded, _curScreen)
- `integration/run-session-class.test.ts`: 3 engine names, 4 UI names, reads app text (runSessionCode, _runClass, dayCode, _doseStripHTML)
- `integration/run-week-layout.test.ts`: 3 engine names, 0 UI names, reads app text, a document
- `integration/sport-swap.test.ts`: 1 engine names, 0 UI names, a document
- `integration/supersets.test.ts`: 1 engine names, 1 UI names, reads app text (RAND_POOLS)
- `integration/swap-durability.test.ts`: 3 engine names, 16 UI names, a document (showToast, openDetail, closeSwapSheet, swapCandidates, activeProg, activeProgId, currentWeek, _swapCtx, …)
- `integration/swaps.test.ts`: 4 engine names, 18 UI names, reads app text, a document (activeProg, activeProgId, currentWeek, currentDayKey, _swapCtx, applySwapChoice, undoSwap, applySessionSwaps, …)
- `integration/swim.test.ts`: 3 engine names, 14 UI names, reads app text, a document (_goalDraft, commitGoalChange, _swimEntryState, WD, showToast, doGenerate, activeProg, activeProgId, …)
- `integration/test-length.test.ts`: 2 engine names, 14 UI names, reads app text, a document (WD, doGenerate, getPrograms, completedKey, activeProgId, setProgStart, activeProg, updateRaceDateFeedback, …)
- `integration/test-week.test.ts`: 4 engine names, 1 UI names, reads app text (showToast)
- `integration/version-label.test.ts`: 0 engine names, 2 UI names, reads app text, a document (submitBug, IA_VERSION)
- `integration/week-freeze.test.ts`: 2 engine names, 5 UI names (showToast, resolveStartDate, _isoToday, completedKey, refreshProgram)
- `integration/week-view.test.ts`: 1 engine names, 4 UI names, reads app text, a document (activeProgId, activeProg, currentWeek, renderWeekView)
- `integration/wildcard.test.ts`: 0 engine names, 7 UI names, reads app text, a document (RAND_POOLS, activeProgId, activeProg, currentWeek, wildcardDayFor, dayDateFor, scheduledDays)
- `sweeps/equipment-tiers.test.ts`: 1 engine names, 1 UI names, reads app text (swapCandidates)
- `sweeps/injury-overlays.test.ts`: 7 engine names, 14 UI names, reads app text, a document (activeProg, currentWeek, currentDayKey, activeProgId, swapCandidates, _swapCtx, applySwapChoice, undoSwap, …)
- `sweeps/leg-lift-placement.test.ts`: 2 engine names, 0 UI names, reads app text, a document
- `sweeps/logging.test.ts`: 1 engine names, 0 UI names, reads app text, a document
- `sweeps/long-run-day.test.ts`: 2 engine names, 0 UI names, reads app text, a document
- `sweeps/mile-anchor.test.ts`: 3 engine names, 0 UI names, reads app text, a document
- `sweeps/pace-clock.test.ts`: 3 engine names, 0 UI names, reads app text, a document
- `sweeps/race-date.test.ts`: 2 engine names, 17 UI names, reads app text, a document (showToast, progDetailHTML, progSelLines, openMileSheet, WD, activeProgId, activeProg, init, …)
- `sweeps/run-session-class.test.ts`: 2 engine names, 4 UI names, reads app text (runSessionCode, _runClass, dayCode, _doseStripHTML)
- `sweeps/run-week-layout.test.ts`: 2 engine names, 0 UI names, reads app text, a document
- `sweeps/swaps.test.ts`: 3 engine names, 16 UI names, a document (showToast, openDetail, closeSwapSheet, swapCandidates, activeProg, activeProgId, currentWeek, _swapCtx, …)
- `sweeps/swim.test.ts`: 3 engine names, 5 UI names, reads app text, a document (WD, updateSwimPaceDisplay, wizardStep, WIZARD_STEPS, renderWizardStep)
- `sweeps/test-length.test.ts`: 2 engine names, 10 UI names, reads app text, a document (showToast, WD, activeProg, doGenerate, wizardStep, WIZARD_STEPS, renderWizardStep, updateRaceDateFeedback, …)
- `sweeps/test-week.test.ts`: 2 engine names, 1 UI names, reads app text (showToast)
- `sweeps/week-view.test.ts`: 1 engine names, 0 UI names, reads app text, a document
- `sweeps/wildcard.test.ts`: 0 engine names, 6 UI names, reads app text, a document (activeProgId, activeProg, currentWeek, wildcardDayFor, dayDateFor, scheduledDays)

## no app

- `unit/clock-format.test.ts`: 0 engine names, 0 UI names, reads app text
- `unit/design-tokens.test.ts`: 0 engine names, 0 UI names
- `unit/e2e-collage.test.ts`: 0 engine names, 0 UI names, reads app text
- `unit/e2e-flow.test.ts`: 0 engine names, 0 UI names, reads app text
- `unit/e2e-parity.test.ts`: 0 engine names, 0 UI names, reads app text
- `unit/e2e-report.test.ts`: 0 engine names, 0 UI names, reads app text
- `unit/pace-delta.test.ts`: 0 engine names, 0 UI names, a document
- `unit/semver.test.ts`: 0 engine names, 0 UI names, reads app text
- `unit/version-label.test.ts`: 0 engine names, 0 UI names, reads app text
- `integration/e2e-browser.test.ts`: 0 engine names, 0 UI names, reads app text

## UI names the tests reach, by how many test files reach each

`activeProg` 19 (rest-day-shell), `activeProgId` 16 (rest-day-shell), `showToast` 15 (rest-day-shell), `currentWeek` 14 (rest-day-shell), `WD` 11 (wizard), `currentDayKey` 8 (rest-day-shell), `swapCandidates` 8 (swaps-edits), `refreshProgram` 8 (program-manage), `getPrograms` 7 (storage), `wizardStep` 7 (wizard), `WIZARD_STEPS` 7 (wizard), `renderWizardStep` 7 (wizard), `_swapCtx` 6 (swap-sheet), `applySwapChoice` 6 (swap-sheet), `undoSwap` 6 (swap-sheet), `savePrograms` 6 (storage), `swapOriginOf` 6 (swap-sheet), `doGenerate` 6 (wizard-generate), `updateRaceDateFeedback` 5 (wizard), `resolveStartDate` 5 (wizard), `init` 4 (bug-report-init), `calcCurrentWeek` 4 (week-view-sections), `_mileEntryState` 4 (wizard-generate), `progDetailHTML` 4 (programs), `setProgStart` 4 (programs), `_ovDraft` 3 (overlays), `applyInjuryDraft` 3 (overlays), `progSelLines` 3 (programs), `openMileSheet` 3 (programs), `scheduledDays` 3 (popups-streaks-reminders), `openDetail` 3 (day-detail), `closeSwapSheet` 3 (swap-sheet), `writeSetDraft` 3 (storage), `_curScreen` 2 (rest-day-shell), `runAnchorSentence` 2 (programs), `commitGoalChange` 2 (programs), `runSessionCode` 2 (week-view-sections), `_runClass` 2 (progress-data), `dayCode` 2 (week-view-sections), `_doseStripHTML` 2 (log-entries), `RAND_POOLS` 2 (random-wildcard), `updateSwimPaceDisplay` 2 (wizard), `completedKey` 2 (storage), `wildcardDayFor` 2 (random-wildcard), `dayDateFor` 2 (popups-streaks-reminders), `unarchiveProg` 1 (program-manage), `tabGo` 1 (rest-day-shell), `setActive` 1 (program-manage), `deleteProg` 1 (program-manage), `applySeedData` 1 (wizard), `openSwapSheet` 1 (swap-sheet), `_INJ_EFFECT` 1 (overlays), `_renderTravelTab` 1 (overlays), `_addRxKind` 1 (swaps-edits), `applyOverlayDraft` 1 (overlays), `imBackFromInjury` 1 (overlays), `buildSectionsHTML` 1 (week-view-sections), `runAnchorLine` 1 (programs), `renderGoalSheet` 1 (programs), `renderProgList` 1 (programs), `openGoalSheet` 1 (programs), `selectGoalOpt` 1 (programs), `_goalSetInput` 1 (programs), `CARDIO_GOALS_BY_TYPE` 1 (wizard), `paceCeilingSentence` 1 (wizard), `assessRunPaceCeiling` 1 (wizard), `_goalCurWeek` 1 (programs), `commitMileChange` 1 (programs), `POP_CFG` 1 (popups-streaks-reminders), `popFire` 1 (popups-streaks-reminders), `POP_POOLS` 1 (popups-streaks-reminders), `maybeShowReminder` 1 (popups-streaks-reminders), `popPick` 1 (popups-streaks-reminders), `fireWildcardPopup` 1 (random-wildcard), `fireStreakPopup` 1 (popups-streaks-reminders), `fireSeasonPopup` 1 (popups-streaks-reminders), `ledgerModel` 1 (lift-ledger-progress-screen), `buildMainLiftBlock` 1 (lift-ledger-progress-screen), `setProgRace` 1 (programs), `openDayKey` 1 (week-view-sections), `restDayEligible` 1 (rest-day-shell), `computeStreak` 1 (popups-streaks-reminders), `_rtInited` 1 (rest-timer), `_rtSide` 1 (rest-timer), `_rtExpanded` 1 (rest-timer), `_rtIntroTO` 1 (rest-timer), `_rtDragging` 1 (rest-timer), `_rtInit` 1 (rest-timer), `_rtSetExpanded` 1 (rest-timer), `applySessionSwaps` 1 (swaps-edits), `_goalDraft` 1 (programs), `_swimEntryState` 1 (wizard-generate), `submitBug` 1 (bug-report-init), `IA_VERSION` 1 (update-check), `_isoToday` 1 (overlays), `renderWeekView` 1 (week-view-sections)
