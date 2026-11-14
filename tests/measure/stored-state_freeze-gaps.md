# Stored state: refreshProgram and the freeze, its reach, its callers, its keys, and are the records blind to its rules? (on 0.262.1)

Written by `tests/measure/stored-state_freeze-gaps.mjs` (read-only), from the built page and the source files.

## 1. What the function reaches

`refreshProgram` is 126 lines of the built page. It uses these names of the page and of core; a page name's own reach is followed, a core name's is not. "Reads besides its arguments" is read off each function's own text.

| Name | Declared in | Depth | Reached from | Lines | Names it uses | ia_ keys it names | Reads besides its arguments |
|---|---|---|---|---|---|---|---|
| `_isoToday` (declared twice in the page; the last one runs) | page `overlays.ts` | 1 | `refreshProgram` | 1 | none | none | the clock |
| `_parseLocalDate` | core `calendar.ts` | 1 | `refreshProgram` | 7 | none | none | nothing |
| `applyDayEdits` | page `swaps-edits.ts` | 1 | `refreshProgram` | 27 | ssSkipToken | none | nothing |
| `ssSkipToken` | page `swaps-edits.ts` | 2 | `applyDayEdits` | 1 | none | none | nothing |
| `applyOverlays` | page `overlays.ts` | 1 | `refreshProgram` | 6 | _progDayDate, overlayWeekRange, showToast, spliceOverlays | none | the console |
| `_progDayDate` | page `week-view-sections.ts` | 2 | `applyOverlays` | 7 | getWeekMonday | none | nothing |
| `getWeekMonday` | core `calendar.ts` | 3 | `_progDayDate` | 9 | none | none | nothing |
| `overlayWeekRange` | page `overlays.ts` | 2 | `applyOverlays` | 9 | weekOfDate | none | nothing |
| `weekOfDate` | page `overlays.ts` | 3 | `overlayWeekRange` | 7 | _parseLocalDate, getWeekMonday | none | nothing |
| `showToast` | page `rest-day-shell.ts` | 2 | `applyOverlays` | 1 | none | none | the document |
| `spliceOverlays` | core `state-overlays.ts` | 2 | `applyOverlays` | 35 | _parseLocalDate, buildProgram | none | nothing |
| `applyRestDayMoves` | page `rest-day-shell.ts` | 1 | `refreshProgram` | 15 | none | none | nothing |
| `applySessionSwaps` | page `swaps-edits.ts` | 1 | `refreshProgram` | 22 | _dayPlanCfg, applyInjuryFilter, applySwapPrefs | none | nothing |
| `_dayPlanCfg` | page `swaps-edits.ts` | 2 | `applySessionSwaps` | 6 | dayOverlayInfo | none | nothing |
| `dayOverlayInfo` | page `overlays.ts` | 3 | `_dayPlanCfg` | 4 | none | none | nothing |
| `applyInjuryFilter` | core `injury.ts` | 2 | `applySessionSwaps` | 39 | INJ_CAP_CUE, _capRpeClamp, _gearLens, _pattern, injuryPlan | none | nothing |
| `applySwapPrefs` | core `swap-prefs.ts` | 2 | `applySessionSwaps` | 17 | _stripCapCue, _swapDetailFor | none | nothing |
| `buildProgram` | core `budget-engine-d.ts` | 1 | `refreshProgram` | 9 | _swapUniverseReset, engineA_timeline, engineB_cardio, engineC_kinematics, engineD_synthesis, planCalendar | none | nothing |
| `entryDay` | core `state-lift-log.ts` | 1 | `refreshProgram` | 6 | _ENTRY_DAY_ORDER | none | nothing |
| `getDayEdits` | page `swaps-edits.ts` | 1 | `refreshProgram` | 1 | iaStore, readDayEdits | none | the store |
| `iaStore` | page `storage.ts` | 2 | `getDayEdits` |  | none | none | nothing |
| `readDayEdits` | core `state-day-edits.ts` | 2 | `getDayEdits` | 1 | none | ia_edits_ | nothing |
| `getPrograms` | page `storage.ts` | 1 | `refreshProgram` | 1 | iaStore, readPrograms | none | the store |
| `readPrograms` | core `state-programs.ts` | 2 | `getPrograms` | 1 | none | ia_programs | nothing |
| `getSwaps` | page `swaps-edits.ts` | 1 | `refreshProgram` | 1 | iaStore, readSwaps | none | the store |
| `readSwaps` | core `state-swaps.ts` | 2 | `getSwaps` | 1 | none | ia_swaps_ | nothing |
| `paceShiftMap` | page `overlays.ts` | 1 | `refreshProgram` | 42 | _parseLocalDate, getWeekMonday, injuryPlan | none | the clock |
| `injuryPlan` | core `injury.ts` | 2 | `paceShiftMap` | 95 | INJURY_REGIONS | none | nothing |
| `progTestPin` | page `programs.ts` | 1 | `refreshProgram` | 8 | LIFTING_FOCUS_TO_GOAL, NSW_TABLE6_INT, PACE_GOALS, calcProgramLength, testWeekIndex | none | nothing |
| `LIFTING_FOCUS_TO_GOAL` | core `exercise-library.ts` | 2 | `progTestPin` |  | none | none | nothing |
| `NSW_TABLE6_INT` | core `nsw-cardio.ts` | 2 | `progTestPin` |  | none | none | nothing |
| `PACE_GOALS` | core `nrc-race-bike-swim.ts` | 2 | `progTestPin` |  | none | none | nothing |
| `calcProgramLength` | core `nsw-cardio.ts` | 2 | `progTestPin` | 219 | NRC_GOALS, PACE_IMPROVE, _clkMS, paceGoalTarget | none | nothing |
| `testWeekIndex` | core `nrc-race-bike-swim.ts` | 2 | `progTestPin` | 6 | _isoOf, _parseLocalDate, getWeekMonday | none | nothing |
| `pruneDayEdits` | page `swaps-edits.ts` | 1 | `refreshProgram` | 1 | iaStore, pruneDayEditsBefore | none | the store |
| `pruneDayEditsBefore` | core `state-day-edits.ts` | 2 | `pruneDayEdits` | 5 | readDayEdits, writeDayEdits | none | nothing |
| `savePrograms` | page `storage.ts` | 1 | `refreshProgram` | 1 | iaStore, writePrograms | none | the store |
| `writePrograms` | core `state-programs.ts` | 2 | `savePrograms` | 1 | none | ia_programs | nothing |

Page names reached: 20 (`_isoToday`, `applyDayEdits`, `ssSkipToken`, `applyOverlays`, `_progDayDate`, `overlayWeekRange`, `weekOfDate`, `showToast`, `applyRestDayMoves`, `applySessionSwaps`, `_dayPlanCfg`, `dayOverlayInfo`, `getDayEdits`, `iaStore`, `getPrograms`, `getSwaps`, `paceShiftMap`, `progTestPin`, `pruneDayEdits`, `savePrograms`). Core names reached: 18.

`refreshProgram` itself reads besides its arguments: the clock, the console, the store. ia_ keys named in its own text: ia_comp_, ia_logs_, ia_hist_, ia_exw_, ia_moves_. Store calls in it (`iaStore`): 6.

## 2. Who calls it, and who calls what it reaches in the page

| Name | Calls in the built page | From | Calls not from `refreshProgram` or its reach |
|---|---|---|---|
| `refreshProgram` | 10 | acceptSwapNudge, applyInjuryDraft, applyOverlayDraft, commitGoalChange, commitMileChange, imBackFromInjury, loadActiveProgram, removeOverlay, setProgRace, setProgStart | 10 |
| `_isoToday` | 8 | _applyWizardStart, applyInjuryDraft, imBackFromInjury, openInjurySheet, openOverlaySheet, refreshProgram, renderWizardStep, startWizard | 7 |
| `applyDayEdits` | 1 | refreshProgram | 0 |
| `ssSkipToken` | 3 | applyDayEdits, skipSuperset, unskipSuperset | 2 |
| `applyOverlays` | 1 | refreshProgram | 0 |
| `_progDayDate` | 1 | dayBeforeStart | 1 |
| `overlayWeekRange` | 9 | _liveInjuryOverlay, _renderTravelTab, applyInjuryDraft, applyOverlayDraft, overlaySpanLabel, refreshProgram, renderOverlayChip, renderWeekView ×2 | 8 |
| `weekOfDate` | 3 | overlayBackCopy, overlayWeekRange ×2 | 1 |
| `showToast` | 65 | _afterEdit ×2, acceptSwapNudge, applyBackup, applyInjuryDraft ×4, applyOverlayDraft ×5, applyOverlays, applyRestCardio ×2, applyRestMove ×2, applySwapChoice, archiveProg, clearRestCardio, commitGoalChange, commitMileChange ×3, commitRename, completeWildcard, copyExport ×2, copyProgSel, deleteProg, doGenerate ×2, engineCheckRun, handleDayStatus ×2, injSnooze, loadActiveProgram, logCardio ×2, offerShorterPlan, openAddSheet, openDayKey, openInjurySheet, openOverlaySheet, openRestSheet ×2, openSwapSheet, removeOverlay, resetWildcardCounter, resolveReminder, saveBackup ×3, saveExWeight ×2, selectKBSize, setActive, setProgRace ×2, setProgStart, tabGo, toggleRestDay, unarchiveProg, undoSwap | 64 |
| `applyRestDayMoves` | 2 | applyRestMove, refreshProgram | 1 |
| `applySessionSwaps` | 1 | refreshProgram | 0 |
| `_dayPlanCfg` | 7 | addCandidates, applySessionSwaps ×2, applySwapChoice ×2, auxSwapCandidates, swapCandidates | 5 |
| `dayOverlayInfo` | 2 | _dayPlanCfg, dayIsTravel | 1 |
| `getDayEdits` | 1 | refreshProgram | 0 |
| `iaStore` | 0 |  | 0 |
| `getPrograms` | 28 | _saveOverlays, applyInjuryDraft, applyOverlayDraft, applyRestMove, archiveProg, commitGoalChange, commitMileChange, commitRename, copyProgSel, crossProgLastEntry, deleteProg, doGenerate, imBackFromInjury, init, loadActiveProgram, openGoalSheet, openMileSheet, refreshProgram ×2, removeOverlay, renderGoalSheet, renderProgList, renderProgressScreen, renderWizardStep, saveTestMax, setProgRace, setProgStart, unarchiveProg | 26 |
| `getSwaps` | 3 | refreshProgram, swapOriginOf, undoSwap | 2 |
| `paceShiftMap` | 2 | imBackFromInjury, refreshProgram | 1 |
| `progTestPin` | 4 | doGenerate, refreshProgram, setProgStart, wizardTestPin | 3 |
| `pruneDayEdits` | 1 | refreshProgram | 0 |
| `savePrograms` | 18 | _saveOverlays, applyInjuryDraft, applyOverlayDraft, applyRestMove, archiveProg, commitGoalChange, commitMileChange, commitRename, deleteProg, doGenerate, imBackFromInjury, refreshProgram ×2, removeOverlay, saveTestMax, setProgRace, setProgStart, unarchiveProg | 16 |

## 3. The keys it reads and writes

| Key | Read or written | Where |
|---|---|---|
| `ia_programs` | read | the seed fallback and the test week backfill, each before it saves (`getPrograms`, core's `readPrograms`) |
| `ia_programs` | WRITE | the seed fallback: the stored config gains `seed`. The test week backfill: the stored config gains `_testWeek` and `_raceDateCappedWeeks` (`savePrograms`, core's `writePrograms`) |
| `ia_comp_<id>` | read | the freeze: a day with a completion is touched |
| `ia_logs_<id>` | read | the freeze: a day with a log is touched |
| `ia_hist_<id>` | read, twice | the freeze: a day with a snapshot is touched, and the snapshot is the day it gives back |
| `ia_exw_<id>` | read | the freeze: a logged lift touches its week and day (core's `entryDay`) |
| `ia_moves_<id>` | read | the rest day moves laid back on the grid (`applyRestDayMoves`) |
| `ia_swaps_<id>` | read | the session swaps laid back on the grid (`getSwaps`, core's `readSwaps`; `applySessionSwaps`) |
| `ia_edits_<id>` | read, twice | the prune, then the adds and skips laid back on the grid (`getDayEdits`, core's `readDayEdits`; `applyDayEdits`) |
| `ia_edits_<id>` | WRITE | the prune: the edits of every week below the freeze cut are dropped, when there are any (`pruneDayEdits`, core's `pruneDayEditsBefore`) |

## 4. A break inside each rule, against the records

90 breaks and two controls (one the fast file turns red, one only the sweeps do; both must be red); **59 green on the records**: 52 that a history the records do not hold would show, and 7 that change nothing a launch can reach or a record can hold.

| Rules of | Breaks | Green on the records |
|---|---|---|
| control | 2 | 0 |
| seed fallback | 5 | 3 |
| test week backfill | 10 | 9 |
| pace clock | 9 | 4 |
| rebuild | 8 | 4 |
| overlay splice | 6 | 2 |
| freeze | 28 | 20 |
| rest day moves | 7 | 3 |
| session swaps | 7 | 5 |
| day edits | 10 | 9 |

Why so many: three things every history shares. Its stored grid is the same engine's build of the same config as the launch that reads it, so where a rule picks between the stored day and the rebuilt one, both are the same day. Every touch snapshots its day now, so a launch gives a touched day back from its snapshot, and the replays of swaps and edits, and each proof of a touch on its own, never decide. And no history holds an older program (no pinned test week, no seed, no start date) or a dated pace test.

| Rules of | Green break | Why the records do not see it | With this slice's records |
|---|---|---|---|
| seed fallback | guard, no config | record: a stored program with no config (hostile, by hand) | red |
| seed fallback | seed, none anywhere | record: an older program, by hand (no history holds one): no seed on the program or in its config | red |
| seed fallback | seed, saved on its program | record: an older program that is not the first in the list | red |
| test week backfill | test week, only when unset | record: a program pinned to a week its dates no longer give (hostile, by hand) | red |
| test week backfill | test week, backfilled | record: an older program, by hand (no history holds one): a dated pace test with no pinned week | red |
| test week backfill | test week, needs a week | record: an older program, by hand (no history holds one): a dated pace test past week 26 | red |
| test week backfill | test week, a past test | record: an older program, by hand (no history holds one): a dated pace test already past at the launch | red |
| test week backfill | test week, set | record: an older program, by hand (no history holds one): a dated pace test with no pinned week | red |
| test week backfill | test week, length | record: an older program, by hand (no history holds one): a dated pace test with no pinned week | red |
| test week backfill | test week, saved | record: an older program, by hand (no history holds one): a dated pace test with no pinned week | red |
| test week backfill | test pin, event off | record: an older program, by hand (no history holds one): a dated pace test with its event switched off | red |
| test week backfill | test pin, week range | record: an older program, by hand (no history holds one): a dated pace test past week 26 | red |
| pace clock | pace shift, cleared | record: a stored config that still holds a pace shift after its injury is gone | red |
| pace clock | pace map, modes | record: an injury whose plan leaves running alone (a shoulder) | red |
| pace clock | pace map, from the start | record: an injury dated before the program's first Monday | red |
| pace clock | pace map, merged spans | record: two injuries that overlap | red |
| rebuild | rebuild, name | record: the program in hand, with its name (the records hold the grid in hand, not its name) | red |
| rebuild | rebuild, created | record: the program in hand, with when it was made | red |
| rebuild | rebuild, seed | record: the program in hand, with its seed, where the program's differs from its config's (by hand) | red |
| rebuild | rebuild, failure | record: a stored config the engine cannot build (hostile, by hand) | red |
| overlay splice | week of a date, before the start | none in the grid's path: overlayWeekRange clamps the week to one again. The overlay sheet's "picks your program back up" line reads it too, and there it cannot matter either (a week below one is never past the last). Held by a unit test | green |
| overlay splice | overlay range, clamped | record: a trip booked wholly after the last week, which the sheet refuses | red |
| freeze | freeze, the stored length | record: a stored grid that differs from the rebuild (every history's stored grid is the same engine's build of the same config), with another length: a goal changed mid program | red |
| freeze | freeze, no clock | record: an older program, by hand (no history holds one): no start date, and a stored grid that differs from the rebuild | red |
| freeze | freeze, week count | record: a stored grid that differs from the rebuild (every history's stored grid is the same engine's build of the same config), launched on a Monday | red |
| freeze | freeze, before the start | none: before the start the broken week is zero or less, the cut is still the furthest touched week plus one, and every week from one on is still pierced | green |
| freeze | freeze, past the end | record: a stored grid that differs from the rebuild (every history's stored grid is the same engine's build of the same config), launched after the last week | red |
| freeze | touched, completion | record: a touched day with no snapshot (every touch snapshots its day now, so a launch gives it back from the snapshot and this never decides), touched by a completion alone | red |
| freeze | touched, log | record: a touched day with no snapshot (every touch snapshots its day now, so a launch gives it back from the snapshot and this never decides), touched by a log alone | red |
| freeze | touched, snapshot | record: a stored grid that differs from the rebuild (every history's stored grid is the same engine's build of the same config), on a day whose only record is its snapshot | red |
| freeze | touched, lift log | record: a touched day with no snapshot (every touch snapshots its day now, so a launch gives it back from the snapshot and this never decides), touched by a logged lift alone | red |
| freeze | touched, lift log day | record: a touched day with no snapshot (every touch snapshots its day now, so a launch gives it back from the snapshot and this never decides), touched by a logged lift alone | red |
| freeze | touched, lift log week | none: a key for week zero or for no week matches no real day, and never raises the furthest touched week | green |
| freeze | cut, the current week touched | none (open since v0.261.5): a touched current week already puts the furthest touched week plus one at the same cut | green |
| freeze | cut, the furthest touched | record: a stored grid that differs from the rebuild (every history's stored grid is the same engine's build of the same config), after the start is moved later than a trained week | red |
| freeze | cut, the furthest touched week itself | record: a stored grid that differs from the rebuild (every history's stored grid is the same engine's build of the same config), after the start is moved later than a trained week | red |
| freeze | pierce, new days | record: an older program, by hand (no history holds one): a stored week that lacks a day the rebuild has | red |
| freeze | past week, stored days only | record: an older program, by hand (no history holds one): a stored past week that lacks a day the rebuild has | red |
| freeze | injury cover, kind | record: a touched day with no snapshot (every touch snapshots its day now, so a launch gives it back from the snapshot and this never decides), in a week a trip covers | red |
| freeze | touched day, stored form | record: a touched day with no snapshot (every touch snapshots its day now, so a launch gives it back from the snapshot and this never decides), and a stored grid that differs from the rebuild | red |
| freeze | touched day, live fallback | record: a touched day with no snapshot (every touch snapshots its day now, so a launch gives it back from the snapshot and this never decides), on a day the stored week lacks | red |
| freeze | empty days dropped | none a record can hold: the grid in hand is recorded as JSON, which leaves an empty day out either way. Held by a unit test on the week's keys | green |
| rest day moves | order, moves before swaps | record: a touched day with no snapshot (every touch snapshots its day now, so a launch gives it back from the snapshot and this never decides): a swap made on a day a session was moved onto | red |
| rest day moves | move, source | record: a move whose source day has since become a rest day (a goal changed mid program) | red |
| rest day moves | move, old form | record: an older program, by hand (no history holds one): a move stored as a plain day name | red |
| session swaps | swaps, restored days | record: a launch after a lift traded off was added back to its own day (the replay would rename it again) | red |
| session swaps | swap replay, order | record: a touched day with no snapshot (every touch snapshots its day now, so a launch gives it back from the snapshot and this never decides), with two swaps in a chain | red |
| session swaps | swap replay, injury filter | record: a touched day with no snapshot (every touch snapshots its day now, so a launch gives it back from the snapshot and this never decides), swapped, in an injured week | red |
| session swaps | swap replay, hold kept | record: a touched day with no snapshot (every touch snapshots its day now, so a launch gives it back from the snapshot and this never decides), swapped, in an injured week | red |
| session swaps | swap replay, the day's plan | record: a touched day with no snapshot (every touch snapshots its day now, so a launch gives it back from the snapshot and this never decides), swapped, in an injured week | red |
| day edits | edits, the prune cut | record: a touched day with no snapshot (every touch snapshots its day now, so a launch gives it back from the snapshot and this never decides): an edit in the cut week itself | red |
| day edits | edits, replayed | record: a touched day with no snapshot (every touch snapshots its day now, so a launch gives it back from the snapshot and this never decides), with an add and a skip | red |
| day edits | order, swaps before edits | record: a touched day with no snapshot (every touch snapshots its day now, so a launch gives it back from the snapshot and this never decides), with a swap and then a skip of the lift traded in | red |
| day edits | edit replay, skip | record: a touched day with no snapshot (every touch snapshots its day now, so a launch gives it back from the snapshot and this never decides), with a skip | red |
| day edits | edit replay, round | record: a touched day with no snapshot (every touch snapshots its day now, so a launch gives it back from the snapshot and this never decides), with a skipped round | red |
| day edits | edit replay, added block | none: edits are laid only on a week at or above the cut, which the freeze never fills, so the day is the engine's fresh build and holds no added block when the skips are flagged. Held by a unit test | green |
| day edits | edit replay, add | record: a touched day with no snapshot (every touch snapshots its day now, so a launch gives it back from the snapshot and this never decides), with an add | red |
| day edits | edit replay, add once | none: edits are laid only on a week at or above the cut, a fresh build each launch, and each day is laid once, so the movement is never already there. Held by a unit test | green |
| day edits | edit replay, add mark | record: a touched day with no snapshot (every touch snapshots its day now, so a launch gives it back from the snapshot and this never decides), with an add | red |

With the records this slice adds (tests/integration/stored-state.test.ts, written on 0.262.1's page): 52 of the 59 are red, and 7 stay green, each one a break that changes nothing a launch can reach or a record can hold: week of a date, before the start; freeze, before the start; touched, lift log week; cut, the current week touched; empty days dropped; edit replay, added block; edit replay, add once.

| Rules of | Break | The rule | What the break does | The records | Tests red |
|---|---|---|---|---|---|
| control | log key (control) | the control | a log is stored under w1-mon | red (the fast file) | 4: HALF_MANNY through the standard history: the same history twice leaves; a key holding broken JSON reads as empty, and the next log replaces it; a day's parts settle its status: a skipped lift with a logged run is d; … |
| control | injury built as a trip (control, the sweeps) | the control for the sweeps | an injury builds as a temporary setup | red (the sweeps) | 2: the ten seeded programs: each one through the standard history, twice ; a sample of the lattice (every 36th of 864 configs): each through the  |
| seed fallback | guard, no config | a program with no config is handed back as stored | a program with no config goes on to the rebuild | GREEN (blind) |  |
| seed fallback | seed, none anywhere | a program with no seed anywhere is handed back as stored | a program with no seed is rebuilt | GREEN (blind) |  |
| seed fallback | seed, into the config | an older program's seed is put into its config | the config stays without its seed | red (the fast file) | the golden file |
| seed fallback | seed, saved | the seed put back is written to ia_programs | the seed is put back in hand only | red (the fast file) | 1: an older program with no seed in its config, no overlays and no blockO |
| seed fallback | seed, saved on its program | the seed is written to the stored program of the same id | the seed is written to the first stored program | GREEN (blind) |  |
| test week backfill | test week, only when unset | a program with a pinned test week is left alone | every program derives its test week again at each launch | GREEN (blind) |  |
| test week backfill | test week, backfilled | a dated test with no pinned week pins it at launch | no test week is ever backfilled | GREEN (blind) |  |
| test week backfill | test week, needs a week | a test before the start or past week 26 pins nothing | a test with no week still writes the two keys | GREEN (blind) |  |
| test week backfill | test week, a past test | a test already past pins nothing and writes nothing | a past test pins | GREEN (blind) |  |
| test week backfill | test week, set | the pinned week goes into the config | the config gets the length and not the week | GREEN (blind) |  |
| test week backfill | test week, length | the program's length is capped at the test week | the config gets the week and not the length | GREEN (blind) |  |
| test week backfill | test week, saved | the pin is written to ia_programs | the pin is in hand only | GREEN (blind) |  |
| test week backfill | test pin, goal family | only a pace test goal pins | any run goal with a date pins | red (the fast file) | 2: after race day the program holds on its last week; the week the clocks go back (2026-11-01): Monday 2 November is week te |
| test week backfill | test pin, event off | a goal with its event switched off pins nothing | it pins | GREEN (blind) |  |
| test week backfill | test pin, week range | a test week outside 1 to 26 pins nothing | any week pins | GREEN (blind) |  |
| pace clock | pace shift, set | an injury that stops quality running sets the pace shift on the config before the build | no pace shift is ever set | red (the fast file) | the golden file |
| pace clock | pace shift, cleared | a pace shift that no longer derives is deleted from the config | an old pace shift outlives its overlays | GREEN (blind) |  |
| pace clock | pace map, modes | only an injury whose plan touches running counts | every injury with a cardio mode counts | GREEN (blind) |  |
| pace clock | pace map, half step | a half step week never counts | a half step week counts | red (the fast file) | the golden file |
| pace clock | pace map, open end | an injury with no end counts to today | an injury with no end counts to the program's end | red (the fast file) | the golden file |
| pace clock | pace map, from the start | days before the program's first Monday do not count | they count | GREEN (blind) |  |
| pace clock | pace map, days before the week | a week is shifted by the days hurt before it | a week is shifted by the days hurt through its Monday | red (the fast file) | the golden file |
| pace clock | pace map, floor of one | any day hurt shifts the clock by at least a week | one to three days hurt shift nothing | red (the fast file) | the golden file |
| pace clock | pace map, merged spans | overlapping injuries count a day once | overlapping injuries count a day twice | GREEN (blind) |  |
| rebuild | rebuild, id | the rebuilt program keeps its id | it carries the build's own id | red (the fast file) | 3: HALF_MANNY through the standard history: the same history twice leaves; a logged day with no history kept, in a week an injury then covers, ta; a trip to a mini gym, a swap on a trip day, an overlay the engine cann |
| rebuild | rebuild, name | the rebuilt program keeps its name | it carries the build's name | GREEN (blind) |  |
| rebuild | rebuild, created | the rebuilt program keeps when it was made | it carries the instant of this launch | GREEN (blind) |  |
| rebuild | rebuild, start | the rebuilt program keeps its start | it has no start | red (the fast file) | 9: HALF_MANNY through the standard history: the same history twice leaves; eight weeks unopened: the launch lands on week nine and the logged day; after race day the program holds on its last week; … |
| rebuild | rebuild, block open | the rebuilt program keeps where its block opened | it has none | red (the fast file) | the golden file |
| rebuild | rebuild, seed | the rebuilt program keeps the stored program's own seed | it carries the config's | GREEN (blind) |  |
| rebuild | rebuild, overlays | the rebuilt program keeps its overlays | it has none | red (the fast file) | 1: HALF_MANNY through the standard history: the same history twice leaves |
| rebuild | rebuild, failure | a program the engine cannot build is handed back as stored | nothing is handed back | GREEN (blind) |  |
| overlay splice | splice, called | the overlays are spliced into the rebuilt grid | no overlay is spliced | red (the fast file) | 2: a logged day with no history kept, in a week an injury then covers, ta; a trip to a mini gym, a swap on a trip day, an overlay the engine cann |
| overlay splice | order, splice before the freeze | the freeze has the last word over an overlay | the overlays are spliced after the freeze | red (the fast file) | the golden file |
| overlay splice | week of a date, before the start | a date before the program reads as week one | it reads as a week before one | GREEN (blind) |  |
| overlay splice | overlay range, clamped | an overlay's weeks are clamped to the program | they are not clamped | GREEN (blind) |  |
| overlay splice | overlay range, no end | an overlay with no end runs to the last week | it covers its first week only | red (the fast file) | the golden file |
| overlay splice | day date | a program day's date is its week's Monday plus its weekday | every day reads a day late | red (the fast file) | 1: a trip to a mini gym, a swap on a trip day, an overlay the engine cann |
| freeze | freeze, the stored length | the current week is capped at the stored length first | it is capped at the rebuilt length | GREEN (blind) |  |
| freeze | freeze, no clock | a program with no start still freezes by what was touched | the freeze fails for it and every week is rebuilt | GREEN (blind) |  |
| freeze | freeze, week count | the current week is counted from the start's Monday | it is counted a day late | GREEN (blind) |  |
| freeze | freeze, before the start | before the start the current week is one | it is a week before one | GREEN (blind) |  |
| freeze | freeze, past the end | after the last week the current week is the last | it runs past the end | GREEN (blind) |  |
| freeze | touched, completion | a completion proves a day was seen | it proves nothing | GREEN (blind) |  |
| freeze | touched, log | a log proves a day was seen | it proves nothing | GREEN (blind) |  |
| freeze | touched, snapshot | a snapshot proves a day was seen | it proves nothing to the cut | GREEN (blind) |  |
| freeze | touched, lift log | a logged lift proves its day was seen | it proves nothing | GREEN (blind) |  |
| freeze | touched, lift log day | a logged lift freezes its own day | it moves the cut and freezes no day | GREEN (blind) |  |
| freeze | touched, lift log week | a logged lift with no week proves nothing | it writes a key for week zero or none | GREEN (blind) |  |
| freeze | cut, the current week touched | a touched current week is frozen whole | the date cut stops at the current week | GREEN (blind) |  |
| freeze | cut, the date | every week before the current one is frozen, touched or not | only weeks up to the furthest touched are frozen | red (the fast file) | the golden file |
| freeze | cut, the furthest touched | every week up to the furthest touched is frozen, wherever the date is | only the date decides | GREEN (blind) |  |
| freeze | cut, the furthest touched week itself | the furthest touched week is frozen | the cut stops a week short of it | GREEN (blind) |  |
| freeze | freeze, reach | every week below the cut is frozen | the last frozen week is rebuilt | red (the fast file) | 1: a touched day edited, then its session moved: the edit is in the day's |
| freeze | freeze, written | a frozen week replaces the rebuilt one | no week is frozen | red (the fast file) | 1: a touched day edited, then its session moved: the edit is in the day's |
| freeze | freeze, history | a day with a snapshot is given back from it | a snapshot is not read back | red (the fast file) | 2: a touched day edited, then its session moved: the edit is in the day's; a trip to a mini gym, a swap on a trip day, an overlay the engine cann |
| freeze | freeze, piercing | the current week and later take live days where untouched | no frozen week is pierced | red (the fast file) | 1: a trip to a mini gym, a swap on a trip day, an overlay the engine cann |
| freeze | pierce, new days | a pierced week gains a day the rebuild has and the stored grid lacks | it keeps the stored days only | GREEN (blind) |  |
| freeze | past week, stored days only | a week behind the current one keeps the stored set of days | it gains the rebuild's days too | GREEN (blind) |  |
| freeze | injury cover, kind | only an injury covers a week | a trip covers it too | GREEN (blind) |  |
| freeze | freeze, injured week | a touched day with no snapshot, in a week an injury covers, takes the live day | it keeps its stored form | red (the fast file) | 1: a logged day with no history kept, in a week an injury then covers, ta |
| freeze | touched day, stored form | a touched day with no snapshot keeps its stored form | it takes the live day | GREEN (blind) |  |
| freeze | touched day, live fallback | a touched day the stored grid lacks takes the live day | it is dropped | GREEN (blind) |  |
| freeze | untouched day, pierced week | an untouched day of a pierced week takes the live day | it keeps its stored form | red (the fast file) | 1: a trip to a mini gym, a swap on a trip day, an overlay the engine cann |
| freeze | untouched day, past week | an untouched day of a past week keeps its stored form | it takes the live day | red (the fast file) | the golden file |
| freeze | empty days dropped | a day with nothing on either side is left out of the week | it stays as an empty key | GREEN (blind) |  |
| rest day moves | moves, replayed | a moved rest day is laid back on the rebuilt grid | no move is replayed | red (the fast file) | the golden file |
| rest day moves | order, moves before swaps | the moves are laid before the swaps and the edits | the moves are laid after the swaps | GREEN (blind) |  |
| rest day moves | move, already applied | a move a frozen week already holds is not applied again | it is applied again | red (the fast file) | the golden file |
| rest day moves | move, source | a rest day or a day already moved is never the source | it can be | GREEN (blind) |  |
| rest day moves | move, mark | the moved session says where it came from | it does not | red (the fast file) | 1: a touched day edited, then its session moved: the edit is in the day's |
| rest day moves | move, origin rests | the day a session left becomes a rest day | the session shows on both days | red (the fast file) | 1: a touched day edited, then its session moved: the edit is in the day's |
| rest day moves | move, old form | a move stored as a plain day name is read | it is not | GREEN (blind) |  |
| session swaps | swaps, replayed | a session swap is laid back on the rebuilt day | no swap is replayed | red (the fast file) | the golden file |
| session swaps | swaps, restored days | a day given back from its snapshot gets no replay | its swaps are replayed onto the snapshot | GREEN (blind) |  |
| session swaps | swap replay, order | a day's swaps replay in the order made | they replay newest first | GREEN (blind) |  |
| session swaps | swap replay, applied | each swap renames its lift on the day | no lift is renamed | red (the fast file) | the golden file |
| session swaps | swap replay, injury filter | a swapped day under an injury goes through the injury filter again | it does not | GREEN (blind) |  |
| session swaps | swap replay, hold kept | a renamed lift carries its dose from before the filter | it does not | GREEN (blind) |  |
| session swaps | swap replay, the day's plan | the injury that governs a day is its own overlay's | it is the config's | GREEN (blind) |  |
| day edits | edits, pruned at launch | the edits of every week below the cut are dropped at launch | none is dropped | red (the fast file) | the golden file |
| day edits | edits, the prune cut | the prune stops at the freeze cut | it takes the cut week too | GREEN (blind) |  |
| day edits | edits, replayed | adds and skips are laid back on the rebuilt day | none is replayed | GREEN (blind) |  |
| day edits | order, swaps before edits | the edits are laid after the swaps | the edits are laid before the swaps | GREEN (blind) |  |
| day edits | edit replay, skip | a skipped movement is flagged | it is not | GREEN (blind) |  |
| day edits | edit replay, round | a skipped round is flagged whole | it is not | GREEN (blind) |  |
| day edits | edit replay, added block | the athlete's own added block is never flagged skipped | it can be | GREEN (blind) |  |
| day edits | edit replay, add | an added movement is put on the day | it is not | GREEN (blind) |  |
| day edits | edit replay, add once | an added movement already on the day is not added again | it is added again | GREEN (blind) |  |
| day edits | edit replay, add mark | an added movement is marked the athlete's | it is not | GREEN (blind) |  |
