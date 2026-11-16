# Today's session sheet, before the Expo app draws one

Written by `cd tests && node measure/native-session-sheet_today.ts` (read-only). Zone America/New_York.

## A. What the sheet's Angular files ask of the page

| File | Page functions and globals it names |
|---|---|
| `cardio-fields.ts` | 3 places, 2 names: asyIcon, doseRep |
| `day-detail.ts` | 51 places, 43 names: DAY_FULL, MOD_PAL, RPE_LABELS, _benchmarkEntryFor, _clkMS, _setCurLogDose, _setCurLogDoseFull, _setCurLogSub, _setCurrentDayKey, _setStaleWarnShown, _setStaleWarnSrc, activeProg, asyIcon, cardioEntryLive, cardioLive, cardioLogLabel, cardioSwapNoteText, closeDetail, completedKey, currentDayKey, currentWeek, dayIsTravel, doseFromCardio, exStoreKey, getCompleted, getExWeights, getLogs, handleDayStatus, iaWheelInit, logKey, openAddSheet, openDetail (taken over), openRestSheet, persistLogFields, renderStatusFoot (taken over), restLogLines, ruResetIfIdle, sessionLogProgress, showRpeInfo, statusOf, tagMeta, updateDoseDerived, wildcardOn |
| `e1rm-card.ts` | 4 places, 4 names: activeProg, activeProgId, getPrograms, savePrograms |
| `session-log.ts` | 29 places, 23 names: CARDIO_PARK_FIELDS, _curLogDose, _curLogDoseFull, _curLogSub, _setCurLogDose, asyIcon, cardioLive, cardioSwapNoteText, currentDayKey, currentWeek, getLogs, iaWheelFlush, iaWheelInit, logCardio, logKey, persistLogFields, saveLogs, setCardioSwap, setCardioSwap (taken over), showRpeInfo, toggleCardioPicker, updateDoseDerived, updateRPEDisplay |
| `session-sections-reads.ts` | 5 places, 5 names: _setStaleWarnShown, _setStaleWarnSrc, crossProgLastEntry, exControlFlags, readSetDraft |
| `session-sections.ts` | 20 places, 17 names: asyIcon, autoSaveSets, cascadeSetWeights, fillAllSetWeights, onSetWeight, openSwapSheet, removeAddedExercise, reuseWeight, saveExWeight, setDelta, skipExercise, skipSuperset, stepSet, toggleSets, undoSwap, unskipExercise, unskipSuperset |

- Places that reach the page: **112**. Distinct names: **74**, of which only the cardio files name 1.
- Named somewhere in the Expo app's source already (a port, or its name in a comment): **30** of 74.
- Not named there: MOD_PAL, RPE_LABELS, _benchmarkEntryFor, _clkMS, _curLogDose, _curLogDoseFull, _curLogSub, _setCurLogDose, _setCurLogDoseFull, _setCurLogSub, _setCurrentDayKey, _setStaleWarnShown, _setStaleWarnSrc, activeProgId, cardioEntryLive, cardioLive, cardioLogLabel, cardioSwapNoteText, closeDetail, currentDayKey, doseFromCardio, doseRep, getCompleted, getExWeights, getLogs, getPrograms, handleDayStatus, iaWheelFlush, iaWheelInit, logCardio, openAddSheet, openRestSheet, readSetDraft, removeAddedExercise, ruResetIfIdle, saveLogs, savePrograms, sessionLogProgress, setCardioSwap, showRpeInfo, tagMeta, toggleCardioPicker, updateDoseDerived, updateRPEDisplay.

## B. What each tap only the sheet has writes (the page's own functions)

`+` an entry added, `~` changed, `-` dropped.

| Step | On the page | Keys it changed | Toasts |
|---|---|---|---|
| | *week 1, mon, Posterior Chain (a day with a run beside the lift)* | | |
| The sheet opens (a tap that reaches openDayKey) | `openDayKey(day)` | nothing |  |
| The effort slider moved to 7 | `updateRPEDisplay(7); persistLogFields(day)` | `ia_hist_<id>` (new) [+w1_mon]; `ia_logs_<id>` (new) [+w1_mon] |  |
| Notes typed | `persistLogFields(day)` | `ia_logs_<id>` [~w1_mon {~notes}] |  |
| The add button | `openAddSheet()` | nothing |  |
| A move picked on the add sheet (Back squat) | `applyAddChoice(name)` | `ia_edits_<id>` (new) [+w1_mon]; `ia_hist_<id>` [~w1_mon {~sections}] | Back squat added at 2×6–10 each @ RPE 7. |
| The added move's remove | `removeAddedExercise(name)` | `ia_edits_<id>` [-w1_mon]; `ia_hist_<id>` [~w1_mon {~sections}] | Back squat removed. |
| Back | `closeDetail()` | nothing |  |
| Done | `handleDayStatus(day, title, 'complete')` | `ia_comp_<id>` (new) [+w1_mon]; `ia_pop_dismiss_<id>` (new) [+date, +idx]; `ia_pop_idx_<id>` (new) [+workout] | Done ✓ |
| Reopen, then Done ✓ tap to undo | `openDayKey(day); handleDayStatus(day, title, 'complete')` | `ia_comp_<id>` [-w1_mon] | Unmarked |
| Skip | `handleDayStatus(day, title, 'skipped')` | `ia_comp_<id>` [+w1_mon] | Skipped ✕ The week moves on |
| Skipped ✕ tap to undo | `handleDayStatus(day, title, 'skipped')` | `ia_comp_<id>` [-w1_mon] | Unmarked |
| | *a day of two parts: week 1, tue* | | |
| This Week's Skip pill on its lift | `skipPart(week, day, 'lift')` | `ia_hist_<id>` [+w1_tue]; `ia_parts_<id>` (new) [+w1_tue] |  |
| The sheet's Done on that day | `handleDayStatus(day, title, 'complete')` | `ia_comp_<id>` [+w1_tue]; `ia_logs_<id>` [+w1_tue]; `ia_parts_<id>` [-w1_tue]; `ia_pop_idx_<id>` [~workout] | Done ✓ |
| | *the program's last scheduled day: week 14, sun* | | |
| Done | `handleDayStatus(day, title, 'complete')` | `ia_comp_<id>` [+w14_sun]; `ia_hist_<id>` [+w14_sun]; `ia_logs_<id>` [+w14_sun]; `ia_pop_dismiss_<id>` [~date, ~idx]; `ia_pop_idx_<id>` [+season]; `ia_season_shown_<id>` (new) | Done ✓ |
| Done ✓ tap to undo | `handleDayStatus(day, title, 'complete')` | `ia_comp_<id>` [-w14_sun]; `ia_season_shown_<id>` (removed) | Unmarked |
| | *the 1RM card: none of the ten programs holds a test day, so its save is not run here. `e1rm-card.ts` save() writes the estimate into the stored program's config and stores the programs (`ia_programs`).* | | |

## C. What the sheet has to draw (the ten programs as generated)

| The day's body | The ten programs | HALF_MANNY alone |
|---|---|---|
| training days | 551 | 70 |
| with lift work | 543 | 68 |
| lift work and cardio together | 374 | 54 |
| cardio alone | 8 | 2 |
| cardio drawn above the lift work | 341 | 68 |
| with the 1RM card | 0 | 0 |
| with a note | 0 | 0 |
| with header tags | 551 | 70 |
| with a round | 449 | 52 |
| with a core block | 155 | 18 |
| with a hip block | 106 | 14 |
| where the range nudge can show | 373 | 48 |
| where the add sheet offers nothing | 0 | 0 |

- Sections by kind, all days: `block` 732, `core` 155, `hip` 186, `round` 645.
- Moves a day's counter counts (`sessionLogProgress`, days with lift work): 1 to 12, middle 5.
- Rows the add sheet offers (gap, more and off together, days with lift work): 7 to 17, middle 16.

## D. Read from the code (not counted by this script)

- **How the sheet is reached today** (the Angular app, `week-view.ts` tap() and `cardio-sheet-model.ts` cardRoute): three taps. A done lift card's Reopen opens the whole day. A run, ride or swim card's Log button opens that cardio alone (D278). A done run's Reopen opens that cardio alone. Start lift and Start session open the deck, never the sheet. A rest day opens the rest sheet, which is another sheet.
- **The sheet is also the redraw** of every edit made on it (`openDetail`): a skip, a put it back, a swap, its undo, an add, a remove, the nudge's yes, a status undo.
- **The 1RM card** is drawn on a day the engine marks `testLift`: the last week of a strength program of six weeks or fewer (`budget-engine-d.ts`, `_twTag`). The day's note is set on the same days and on a hypertrophy program's peak week.
- **Core's writers behind the sheet's own taps:** the effort slider and the notes: `recordDaySnapshot` (state-day-history), `writeDayLogs` (state-day-log), `settleDayParts` (state-day-status). Done, Skip and their undo: those three, then `clearDayParts`, `setDayStatus` or `clearDayStatus` (state-day-status), and on the last day's undo the season latch removed (`ia_season_shown_<id>`, the page's own `iaStore.remove`). Add and remove: `addAddEdit`, `dropAddEdit` (state-day-edits), then `refreshDaySnapshot` (state-day-history). The 1RM save: `writePrograms` (state-programs).
- **Already called by the Expo app:** `recordDaySnapshot`, `refreshDaySnapshot`, `writeDayLogs`, `setDayStatus`, `clearDayParts`. **Not yet:** `clearDayStatus`, `settleDayParts`, `addAddEdit`, `dropAddEdit`, `writePrograms`.
- **What the deck already covers** (same cards, same handlers, `session-sections.ts` drawn with `deck` on): the set rows and their plus and minus, the typed rep, the load field, one set's load, the reuse pill, fill every set, Log, skip and put it back for a move and a round, swap and its put it back, the swap nudge, Mark the day done with effort and notes (Call it), the completion pop-up.
- **What only the sheet does:** the whole day on one page (every set shown, the prescription as one line of text, no folding); the header (week and day, title, tags, the travel tag, the logged counter, Back, RPE info, the add button); Done, Skip and each one's undo; the effort slider and the notes saved as they change; add and remove; the range nudge (Time to add weight); the logged but never marked nudge; the Wildcard tag; a double day's jog block; the 1RM card and the day's note; the cardio card, the cardio log and its wheels.
