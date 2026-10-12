# ES modules: the app's module graph and global surface (phase C before-picture)

Measure pass, Post-v0.239.1 (2026-10-12), on `frontends/app/src/legacy/src` at `68399d1` (ia-version 0.239.1).
Script: `tests/measure/es-modules_module-graph.js` (acorn and eslint-scope over the JS files of `order.json`, joined
as `build-index.mjs` joins them; the markup and string literals scanned for inline handlers; the test files scanned
for the names they use). Two runs print the same report. No app code runs.

## Reading

- **The engine is separable.** `buildProgram` reaches 186 of the 783 top-level names, in 19 of the 35 files, and none
  of those 186 uses a browser API directly. Seven files are wholly engine (nsw-cardio, prehab, core-legs,
  engine-a-b-calendar, injury, engine-c, and all but one name of power-accessory); 31 engine names live in files that
  are mostly UI (wizard 6, log-entries 9, storage 3, swaps-edits 3, programs 3, week-view-sections 2, overlays 1).
  No inline handler calls an engine name.
- **The UI is one cycle.** 31 of the 35 files form one strongly connected component; 38 file pairs reference each
  other. 18 top-level `let`s are written from a file other than their own (`activeProg`, `currentWeek`, the log-dose
  state, the program-manage confirmations, ...): as ES modules those writes are illegal (an import is a read-only
  binding), so they need a state module before the UI files can run as modules.
- **Nothing dynamic.** 0 `window[...]`, `eval`, `new Function` or string timers: a static graph sees every reference.
- **Load time is small.** The app boots from one call (`update-check.js`: `init()` on DOMContentLoaded). Leaving the
  boot to an entry module, loading the files runs 2 top-level calls (`_isoToday`, `_exSlugRaw`) and 4 cross-file
  references; only `update-check` touches a browser API (`document`) while loading. Under module evaluation order one
  top-level read would hit a `const` too early (`week-view-sections` reads `ALL_DAYS_ORDER` from `wizard`), which the
  import order can avoid.
- **The tests reach the app by name and by text.** 389 `IA.eval('...')` calls run code by global name inside the VM,
  and about 20 test files read the script's text (`IA.js`, `IA.html`, `appScript()`: function bodies and exact code
  patterns such as `const rounds=_secRounds(sec);`). A bundler that reprints the code (esbuild) or makes top-level
  names local to a wrapper breaks both at once. Tests write only their own `__`-prefixed scratch globals, never an app
  name.

## What this means for phase C (a proposal for Mario; tooling shape, not doctrine)

Convert the sources to ES modules **in place, with the build stripping the module syntax back out**: every file gains
its `import` lines and an `export` on each name other files use, and `build-index.mjs` removes exactly those, so
`index.html` stays byte for byte what it is today and every existing test keeps passing unchanged. What it buys at
once: Node and Vitest can import the engine straight from the sources, with no VM, so engine tests can move off the
harness (the road to phase D, the engine in `core/` as TypeScript), and every cross-file dependency is written down
where an editor and a type checker can follow it. The bundled build that replaces the classic script (the original
phase C's esbuild step) comes when the tests no longer read the script's text or reach it by global name, with phase F.

Steps:
1. Imports and exports in all 35 files, generated from this graph; `build-index.mjs` strips them; `index.html`
   byte-identical; a test that imports `buildProgram` from the module sources and matches the program-output golden
   files (HALF_MANNY and the nine seeded configs, and the 864-config lattice in a sweep).
2. The 18 cross-file-written `let`s move into state modules with setters (output changes; proved by the feature tests,
   the snapshots and e2e parity).
3. The 31 engine names living in UI files move into engine files, so the engine's file set imports no UI file.
4. Engine tests move from the VM harness to direct imports, file by file.

## Report

```
ES MODULES: THE APP'S MODULE GRAPH AND GLOBAL SURFACE (phase C before-picture)
source: 35 JS files, 1212905 chars; 783 top-level names (122 const, 607 function, 42 let, 12 var)
declared twice: _isoToday (wizard, overlays)

1. CROSS-FILE NAMES
315 of 783 top-level names are used outside their file, in 1699 references; 226 file-to-file edges, 38 file pairs reference each other.
per file: declares / used elsewhere / in the engine closure / bytes
  storage                        29   25    3    19298
  rest-day-shell                 35   19    0    16427
  exercise-library               25   15   18    25197
  wizard                         68   19    6    81314
  nsw-cardio                     15    9   15    76826
  nrc-race-bike-swim             19   13   16    74424
  cardio-progression             16    9   14    92077
  prehab                         10   10   10    17780
  power-accessory                23    9   22    27025
  core-legs                      13    4   13    33347
  wizard-generate                10    5    0    11661
  engine-a-b-calendar             4    3    4    23528
  injury                         10    7   10    16529
  engine-c                        1    1    1   108764
  region-caps                    20   13   18    31615
  swaps-edits                    33   22    3    24763
  budget-engine-d                21    4   18    62235
  random-wildcard                18    4    0    55024
  week-view-sections             41   15    2    57167
  set-logging                    33    6    0    37527
  log-entries                    37   23    9    27563
  wheel-log                      24    6    0    26190
  rest-timer                     32    5    0     8478
  day-detail                     12    3    0    15442
  swap-sheet                     18    1    0    19268
  day-status                     21    6    0    17185
  programs                       38    5    3    39783
  overlays                       38   10    1    39127
  program-manage                 14    2    0    22248
  progress-data                  33   21    0    25388
  progress-charts                16   10    0    29219
  lift-ledger-progress-screen    12    1    0    40423
  bug-report-init                 3    1    0     3817
  popups-streaks-reminders       33    7    0    18973
  update-check                    8    2    0     2746

2. SHARED MUTABLE STATE: top-level let/var written from another file (ES imports are read-only bindings)
18 names:
  _curLogDose                let in log-entries; written in wheel-log (1), day-status (1)
  _curLogDoseFull            let in log-entries; written in wheel-log (1)
  _curLogSub                 let in log-entries; written in wheel-log (1)
  _rtIntroPending            let in rest-timer; written in wizard-generate (1)
  _staleWarnShown            let in rest-day-shell; written in set-logging (1), day-detail (1)
  _staleWarnSrc              let in rest-day-shell; written in set-logging (1), day-detail (1)
  activeProg                 let in rest-day-shell; written in day-status (1), programs (4), overlays (4), program-manage (2)
  activeProgId               let in rest-day-shell; written in program-manage (2)
  calcLift                   let in rest-day-shell; written in wizard (1)
  confirmProgId              let in rest-day-shell; written in program-manage (5), progress-data (3)
  confirmTier                let in rest-day-shell; written in program-manage (5), progress-data (3)
  currentDayKey              let in rest-day-shell; written in day-detail (1), program-manage (2)
  currentRandDayKey          let in wizard; written in random-wildcard (1)
  currentRandIdx             let in rest-day-shell; written in random-wildcard (1)
  currentWeek                let in rest-day-shell; written in wizard-generate (1), week-view-sections (1), programs (4), program-manage (2)
  editProgId                 let in rest-day-shell; written in program-manage (3)
  lastRandIdx                let in wizard; written in random-wildcard (1)
  progressViewId             let in rest-day-shell; written in program-manage (2), progress-data (2), lift-ledger-progress-screen (1)
(25 let/var names are read across files in all; the rest are only read elsewhere, so a getter or a live export binding serves them)

3. FILE CYCLES (strongly connected components of the file graph)
2 component(s) with more than one file; sizes 31, 2; 2 files stand alone
  [31] budget-engine-d, cardio-progression, core-legs, day-detail, day-status, engine-a-b-calendar, engine-c, injury, lift-ledger-progress-screen, log-entries, nrc-race-bike-swim, nsw-cardio, overlays, popups-streaks-reminders, power-accessory, program-manage, programs, progress-charts, progress-data, random-wildcard, region-caps, rest-day-shell, rest-timer, set-logging, storage, swap-sheet, swaps-edits, week-view-sections, wheel-log, wizard, wizard-generate
  [2] bug-report-init, update-check
  alone: exercise-library, prehab

4. THE ENGINE: the closure of buildProgram over top-level names
186 names (of 783) in 19 files (of 35).
files, names in the closure / names the file declares:
  storage                      3 / 29
  exercise-library             18 / 25
  wizard                       6 / 68
  nsw-cardio                   15 / 15
  nrc-race-bike-swim           16 / 19
  cardio-progression           14 / 16
  prehab                       10 / 10
  power-accessory              22 / 23
  core-legs                    13 / 13
  engine-a-b-calendar          4 / 4
  injury                       10 / 10
  engine-c                     1 / 1
  region-caps                  18 / 20
  swaps-edits                  3 / 33
  budget-engine-d              18 / 21
  week-view-sections           2 / 41
  log-entries                  9 / 37
  programs                     3 / 38
  overlays                     1 / 38
0 names in the closure use a browser API directly (each is a cut, or a seam to inject):

5. INLINE HANDLERS: app names called by global name from markup and HTML strings (the globals.ts list)
107 handler attributes; 64 distinct app names:
  WD, _goalSetInput, _ovSet, _rdSet, _restDraft, acceptSwapNudge, applyInjuryDraft, applyOverlayDraft, applyRestCardio, applyRestMove, applySeedData, cancelConfirm, cancelProgressConfirm, cancelRename, closeAddSheet, closeDetail, closeGoalSheet, closeMileSheet, closeOverlaySheet, closeRandom, closeRestSheet, closeSwapSheet, commitGoalChange, commitMileChange, dismissSeedData, dismissSwapNudge, doseRep, e1rmCalcUpdate, hideRpeInfo, iaDismissUpdate, iaDoUpdate, logCardio, openAddSheet, openInjurySheet, openOverlaySheet, openRandom, popClose, popDismissBg, renderWizardStep, resetWildcardCounter, rtCollapse, rtResetBtn, rtToggleBtn, runCalc, selectKBByKey, setPaceUnit, setProgRace, setProgStart, setSwimUnit, setUnit, showRpeInfo, startWizard, submitBug, tabGo, toggleCardioPicker, updateMileAdvisory, updatePaceTime, updateRPEDisplay, updateRaceDateFeedback, updateStartResolve, updateSwimAdvisory, updateSwimPaceDisplay, wizardBack, wizardNext
of which in the engine closure: none

6. WHAT A STATIC GRAPH CANNOT SEE
0 dynamic lookups:
undeclared names used (browser and page globals), top 25 by references: Math 583, document 233, Object 141, String 111, Date 84, Array 58, Set 55, JSON 47, localStorage 45, undefined 41, parseFloat 35, parseInt 29, window 19, setTimeout 16, isFinite 10, Number 10, globalThis 9, isNaN 8, Infinity 7, console 6, clearTimeout 5, navigator 5, Boolean 4, location 4, setInterval 3

7. THE FEATURE TESTS' REACH: app top-level names that appear in tests/{unit,integration,sweeps,support} (an upper bound)
270 names over 115 test files; EXPORT_NAMES lists 67.
  appFunction (5): _clkMS, _fmtPaceMi, _parseClock, doseDerived, updateDoseDerived
  string (268): ALL_DAYS_ORDER, ASY_EMOJI, ASY_ICON_PATHS, CARDIO_GOALS_BY_TYPE, CARDIO_LOGGED_TOAST, CORE_PILLARS, EXLIB, EX_KEY_ALIAS, INJ_CAP_CUE, INJ_HELD_TEST, LIFTING_FOCUS_TO_GOAL, LIFTING_OPTIONS, NSW_TABLE6_CHI, NSW_TABLE6_INT, PACE_CHART, PACE_GOALS, PACE_IMPROVE, POP_CFG, POP_DISMISS, POP_POOLS, RAND_POOLS, SESSION_SET_BUDGET, SWIM_GOAL_DIST, TEST_RX_TEXT, WD, WIZARD_STEPS, _AUX_FAMILY, _BW_GEAR, _BW_SUBS, _D18_LEG_RX, _IAW_SPEC, _INJ_EFFECT, _REP_FLOOR, _addRxKind, _adjDayPairs, _applyWizardStart, _auxFamily, _auxGearOK, _capRpeClamp, _cardioInterference, _ceil, _clkMS, _compoundTier, _curScreen, _d18View, _doseStripHTML, _exSlugRaw, _fmtPaceMi, _goalCurWeek, _goalDraft, _goalSetInput, _iawFormat, _iawParse, _iawWraps, _isCompound, _isPostChain, _isoToday, _itemCost, _itemSets, _longRunTier, _mileEntryState, _moveCap, _nrcRunShape, _ovDraft, _parseClock, _pattern, _renderTravelTab, _repFloor, _restDraft, _rtApplySide, _rtDragging, _rtExpanded, _rtInit, _rtInited, _rtIntroTO, _rtSetExpanded, _rtSide, _ruElapsed, _ruId, _ruNow, _ruRunning, _runClass, _secRounds, _setCap, _setCount, _setLeadingSets, _stripCapCue, _stripLeadingSets, _swapCtx, _swapDetailFor, _swapUniverseAdd, _swimEntryState, activeProg, activeProgId, addCandidates, addedDetailFor, applyAddChoice, applyInjuryDraft, applyInjuryFilter, applyOverlayDraft, applyRestCardio, applyRestMove, applySwapChoice, archiveProg, assessRunPaceCeiling, asyIcon, auxSwapCandidates, bodyweightSweep, buildDotChart, buildHeroPreview, buildMainLiftBlock, buildProgram, buildRandFilterBar, buildRunProgressionForLength, buildSectionsHTML, bumpSwapCount, calcCurrentWeek, calcProgramLength, capRegionalFatigue, capSessionBudget, cardioFieldHTML, cardioLogLabel, chiFromTable6, closeDetail, closeMileSheet, closeOverlaySheet, closeRestSheet, closeSwapSheet, commitGoalChange, commitMileChange, completeWildcard, completedCount, completedKey, computeStreak, currentDayKey, currentWeek, dayCode, dayDateFor, deconflictAdjacentDupes, deleteProg, doGenerate, doseDerived, doseFromCardio, doseRep, esc, exControlFlags, exStoreKey, fireCompletionPopup, fireSeasonPopup, fireStreakPopup, fireWildcardPopup, getActivePool, getCHI, getCHIBike, getCHISwim, getDayHist, getDynamicCoreBlock, getINTBike, getINTReps, getLogs, getLogsFor, getNRCSessionTypes, getPrograms, handleDayStatus, iaVersionLabel, iaWheelHTML, iaWheelInit, imBackFromInjury, init, injuryPlan, intFromTable6, isSpeedGoal, ladderWeekly, ledgerModel, logCardio, logExerciseWeight, logKey, markDayComplete, maybeShowReminder, openDayKey, openDetail, openGoalSheet, openInjurySheet, openMileSheet, openOverlaySheet, openRestSheet, openSwapSheet, paceCeilingSentence, paceChartLookup, paceGoalTarget, parseRx, persistLogFields, pick, plannedVsLogged, popClose, popConfetti, popFire, popPick, progDetailHTML, progSelLines, progTestPin, progressViewId, pruneDayEdits, raceAlignment, raceEveLiftPass, randFilter, recoveryDeload, refreshProgram, renderGoalSheet, renderProgList, renderProgressScreen, renderWeekView, renderWizardStep, reroll, resolveReminder, resolveStartDate, restDayEligible, restMoveCandidates, rowPaceAt, rtResetBtn, rtToggleBtn, ruReset, runAnchorInfo, runAnchorLine, runAnchorSentence, runSessionCode, saveCompleted, savePrograms, scheduledDays, seedFromPriorPrograms, selectGoalOpt, sessionLogProgress, sessionTimeEst, setActive, setCardioSwap, setProgRace, setProgStart, setRandFilter, showScreen, showToast, skipExercise, skippedCount, snapshotDay, statusOf, steadyCapSec, swapCandidates, swapLoadNote, swapOriginOf, tabGo, testWeekIndex, unarchiveProg, undoSwap, unloadableRxSweep, updateDoseDerived, updatePaceDisplay, updatePaceFeasibility, updateRPEDisplay, updateRaceDateFeedback, updateRandCounter, updateSwimPaceDisplay, wildcardDayFor, wildcardDaySet, wildcardMarkHTML, wildcardOn, wildcardTagHTML, wizardNext, wizardStep, writeSetDraft
  property (4): doseDerived, pick, popConfetti, popText
  IA (EXPORT_NAMES) (9): EXLIB, RAND_POOLS, _pattern, applyInjuryFilter, buildProgram, exStoreKey, refreshProgram, sportDayTargets, swapCandidates
not in the engine closure (197): CARDIO_GOALS_BY_TYPE, CARDIO_LOGGED_TOAST, EX_KEY_ALIAS, LIFTING_OPTIONS, POP_CFG, POP_DISMISS, POP_POOLS, RAND_POOLS, SWIM_GOAL_DIST, WD, WIZARD_STEPS, _IAW_SPEC, _INJ_EFFECT, _addRxKind, _applyWizardStart, _curScreen, _doseStripHTML, _exSlugRaw, _fmtPaceMi, _goalCurWeek, _goalDraft, _goalSetInput, _iawFormat, _iawParse, _iawWraps, _isoToday, _itemCost, _itemSets, _mileEntryState, _ovDraft, _parseClock, _renderTravelTab, _restDraft, _rtApplySide, _rtDragging, _rtExpanded, _rtInit, _rtInited, _rtIntroTO, _rtSetExpanded, _rtSide, _ruElapsed, _ruId, _ruNow, _ruRunning, _runClass, _secRounds, _stripLeadingSets, _swapCtx, _swimEntryState, activeProg, activeProgId, addCandidates, addedDetailFor, applyAddChoice, applyInjuryDraft, applyOverlayDraft, applyRestCardio, applyRestMove, applySwapChoice, archiveProg, assessRunPaceCeiling, auxSwapCandidates, buildDotChart, buildHeroPreview, buildMainLiftBlock, buildRandFilterBar, buildSectionsHTML, bumpSwapCount, calcCurrentWeek, cardioFieldHTML, cardioLogLabel, closeDetail, closeMileSheet, closeOverlaySheet, closeRestSheet, closeSwapSheet, commitGoalChange, commitMileChange, completeWildcard, completedCount, completedKey, computeStreak, currentDayKey, currentWeek, dayCode, dayDateFor, deleteProg, doGenerate, doseDerived, doseFromCardio, doseRep, esc, exControlFlags, exStoreKey, fireCompletionPopup, fireSeasonPopup, fireStreakPopup, fireWildcardPopup, getActivePool, getDayHist, getLogs, getLogsFor, getPrograms, handleDayStatus, iaVersionLabel, iaWheelHTML, iaWheelInit, imBackFromInjury, init, ladderWeekly, ledgerModel, logCardio, logExerciseWeight, logKey, markDayComplete, maybeShowReminder, openDayKey, openDetail, openGoalSheet, openInjurySheet, openMileSheet, openOverlaySheet, openRestSheet, openSwapSheet, paceCeilingSentence, parseRx, persistLogFields, plannedVsLogged, popClose, popConfetti, popFire, popPick, popText, progDetailHTML, progSelLines, progTestPin, progressViewId, pruneDayEdits, randFilter, refreshProgram, renderGoalSheet, renderProgList, renderProgressScreen, renderWeekView, renderWizardStep, reroll, resolveReminder, resolveStartDate, restDayEligible, restMoveCandidates, rtResetBtn, rtToggleBtn, ruReset, runAnchorLine, runAnchorSentence, runSessionCode, saveCompleted, savePrograms, scheduledDays, seedFromPriorPrograms, selectGoalOpt, sessionLogProgress, sessionTimeEst, setActive, setCardioSwap, setProgRace, setProgStart, setRandFilter, showScreen, showToast, skipExercise, skippedCount, snapshotDay, statusOf, swapCandidates, swapLoadNote, swapOriginOf, tabGo, testWeekIndex, unarchiveProg, undoSwap, updateDoseDerived, updatePaceDisplay, updatePaceFeasibility, updateRPEDisplay, updateRaceDateFeedback, updateRandCounter, updateSwimPaceDisplay, wildcardDayFor, wildcardDaySet, wildcardMarkHTML, wildcardOn, wildcardTagHTML, wizardNext, wizardStep, writeSetDraft

8. LOAD TIME: what runs when the script loads
init() is left out: as modules, the entry calls it after every module has evaluated (the boot is not module loading).
0 top-level IIFEs; 2 top-level functions run at load: _isoToday (from top level), _exSlugRaw (from top level)
4 load-time references cross files; 0 of them read a const/let/var/class of a LATER file in today's order (a classic-script hazard).
browser APIs touched at load, by file (1 files):
  update-check                 document (top level)
module evaluation order (entry imports order.json in order; deps first): exercise-library > prehab > popups-streaks-reminders > random-wildcard > core-legs > rest-timer > wizard-generate > programs > wheel-log > day-detail > progress-data > progress-charts > lift-ledger-progress-screen > program-manage > overlays > engine-a-b-calendar > engine-c > budget-engine-d > swaps-edits > day-status > log-entries > swap-sheet > set-logging > week-view-sections > power-accessory > region-caps > injury > cardio-progression > nrc-race-bike-swim > nsw-cardio > wizard > rest-day-shell > storage > update-check > bug-report-init
1 load-time reads of another file's const/let/var/class that would evaluate LATER as modules (TDZ):
  week-view-sections reads ALL_DAYS_ORDER (const in wizard) via top level
```
