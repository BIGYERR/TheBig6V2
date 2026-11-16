# The Expo app's session sheet: a break per rule, and the test files each turns red

Written by `node tests/measure/native-session-sheet_breaks.mjs` (read-only here; each break is made in a copy of the tree and put back).

- The fast files, run on each break: `unit/native-session-sheet.test.ts`, `integration/native-session-sheet.test.ts`, `unit/native-pop-ups.test.ts`, `unit/native-deck.test.ts`, `unit/native-deck-logging.test.ts`, `unit/native-shell.test.ts`. Unbroken, they hold 191 tests and all pass.
- The sweep, run only on a break the fast files let through: `sweeps/native-session-sheet.test.ts` (2 tests, all passing unbroken).

| # | File | The rule broken | Files red | Tests red | Which |
|---|---|---|---|---|---|
| 1 | `sheet-readers.ts` | the Core tag wears the hip colour | **1** | 2 | integration/native-session-sheet 2 |
| 2 | `sheet-readers.ts` | the Lift tag reads Lifting | **2** | 5 | integration/native-session-sheet 3, unit/native-session-sheet 2 |
| 3 | `sheet-readers.ts` | effort 7 reads Hard | **2** | 3 | integration/native-session-sheet 2, unit/native-session-sheet 1 |
| 4 | `sheet-readers.ts` | the pace wheel starts at 5 minutes | **2** | 4 | integration/native-session-sheet 3, unit/native-session-sheet 1 |
| 5 | `sheet-readers.ts` | a move with a prescription is not counted as loggable | **2** | 4 | integration/native-session-sheet 2, unit/native-session-sheet 2 |
| 6 | `sheet-readers.ts` | a skipped round is counted in the day's moves | **1** | 1 | unit/native-session-sheet 1 |
| 7 | `sheet-readers.ts` | a skipped move is counted in the day's moves | **2** | 3 | integration/native-session-sheet 2, unit/native-session-sheet 1 |
| 8 | `sheet-readers.ts` | a lift logged in any week counts as done today | **2** | 2 | integration/native-session-sheet 1, unit/native-session-sheet 1 |
| 9 | `sheet-readers.ts` | a lift logged on any day of the week counts as done today | **2** | 3 | integration/native-session-sheet 2, unit/native-session-sheet 1 |
| 10 | `sheet-readers.ts` | a logged run's button reads Logged | **2** | 5 | integration/native-session-sheet 2, unit/native-session-sheet 3 |
| 11 | `sheet-readers.ts` | the swap note never says the numbers are kept | **1** | 2 | unit/native-session-sheet 2 |
| 12 | `sheet-readers.ts` | a pace of nothing is written 0:00 | **1** | 1 | unit/native-session-sheet 1 |
| 13 | `sheet-readers.ts` | a clock with three parts is read | **1** | 1 | unit/native-session-sheet 1 |
| 14 | `sheet-readers.ts` | the dose a session carries is passed over for its words | **2** | 4 | integration/native-session-sheet 3, unit/native-session-sheet 1 |
| 15 | `sheet-readers.ts` | a swim's words are read for a dose | **1** | 1 | unit/native-session-sheet 1 |
| 16 | `sheet-readers.ts` | a bike interval's warm up is read as its dose | **1** | 1 | unit/native-session-sheet 1 |
| 17 | `sheet-readers.ts` | a progression run keeps its first pace as the target | **1** | 1 | unit/native-session-sheet 1 |
| 18 | `sheet-readers.ts` | reps of a distance are not read | **1** | 1 | unit/native-session-sheet 1 |
| 19 | `sheet-readers.ts` | a timed run is not read | **2** | 5 | integration/native-session-sheet 2, unit/native-session-sheet 3 |
| 20 | `sheet-readers.ts` | a timed run's pace is always worked from the planned time | **2** | 4 | integration/native-session-sheet 1, unit/native-session-sheet 3 |
| 21 | `sheet-readers.ts` | a run by distance hands back no distance to stamp | **1** | 2 | unit/native-session-sheet 2 |
| 22 | `sheet-readers.ts` | reps of a distance give their miles to the tenth | **1** | 1 | unit/native-session-sheet 1 |
| 23 | `sheet-readers.ts` | reps of a time always count the planned reps | **1** | 1 | unit/native-session-sheet 1 |
| 24 | `sheet-readers.ts` | a swapped session counts as the benchmark | **1** | 1 | unit/native-session-sheet 1 |
| 25 | `sheet-readers.ts` | any run counts as the benchmark | **1** | 1 | unit/native-session-sheet 1 |
| 26 | `sheet-readers.ts` | a benchmark with no time logged or planned is taken as 30 minutes | **1** | 1 | unit/native-session-sheet 1 |
| 27 | `sheet-screen.ts` | a rest day draws a sheet | **2** | 2 | integration/native-session-sheet 1, unit/native-session-sheet 1 |
| 28 | `sheet-screen.ts` | the title a day was closed under is passed over | **1** | 1 | unit/native-session-sheet 1 |
| 29 | `sheet-screen.ts` | a day with no title reads Session | **1** | 1 | unit/native-session-sheet 1 |
| 30 | `sheet-screen.ts` | the week and day are joined by a comma | **2** | 6 | integration/native-session-sheet 4, unit/native-session-sheet 2 |
| 31 | `sheet-screen.ts` | no logged counter is drawn | **2** | 6 | integration/native-session-sheet 3, unit/native-session-sheet 3 |
| 32 | `sheet-screen.ts` | a travel day wears no travel tag | **1** | 2 | integration/native-session-sheet 2 |
| 33 | `sheet-screen.ts` | lifting comes first whatever the program is for | **2** | 4 | integration/native-session-sheet 3, unit/native-session-sheet 1 |
| 34 | `sheet-screen.ts` | only the main section is drawn | **2** | 11 | integration/native-session-sheet 3, unit/native-session-sheet 8 |
| 35 | `sheet-screen.ts` | the sections after the main one are numbered from the start | **1** | 3 | integration/native-session-sheet 3 |
| 36 | `sheet-screen.ts` | a test day has no 1RM card in its view | **1** | 1 | unit/native-session-sheet 1 |
| 37 | `sheet-screen.ts` | the 1RM card starts blank whatever was logged | **1** | 1 | unit/native-session-sheet 1 |
| 38 | `sheet-screen.ts` | the day's note is left out of the view | **1** | 1 | unit/native-session-sheet 1 |
| 39 | `sheet-screen.ts` | the range nudge is never drawn | **2** | 3 | integration/native-session-sheet 2, unit/native-session-sheet 1 |
| 40 | `sheet-screen.ts` | the Wildcard tag is left out of the view | **1** | 2 | integration/native-session-sheet 2 |
| 41 | `sheet-screen.ts` | the never marked nudge shows on a day already closed | **2** | 3 | integration/native-session-sheet 2, unit/native-session-sheet 1 |
| 42 | `sheet-screen.ts` | a double day's jog is left out of the view | **1** | 1 | unit/native-session-sheet 1 |
| 43 | `sheet-screen.ts` | the foot is drawn as pending whatever the day's status | **2** | 5 | integration/native-session-sheet 3, unit/native-session-sheet 2 |
| 44 | `sheet-screen.ts` | the foot closes a day with no title as Training | **1** | 1 | unit/native-session-sheet 1 |
| 45 | `sheet-screen.ts` | a swapped sport keeps the planned dose | **1** | 1 | unit/native-session-sheet 1 |
| 46 | `sheet-screen.ts` | the run is never read as logged | **2** | 4 | integration/native-session-sheet 2, unit/native-session-sheet 2 |
| 47 | `sheet-screen.ts` | the retest strip is left off the cardio card | **1** | 1 | sweeps/native-session-sheet 1 (the sweep was run) |
| 48 | `sheet-screen.ts` | the foot drawn again after an undo ignores the status | **1** | 1 | unit/native-session-sheet 1 |
| 49 | `sheet-screen.ts` | the screen draws the day's note too | **1** | 1 | unit/native-session-sheet 1 |
| 50 | `sheet-screen.ts` | the screen draws every block of the view | **1** | 2 | unit/native-session-sheet 2 |
| 51 | `sheet-screen.ts` | a tint is read as a solid colour | **1** | 1 | unit/native-session-sheet 1 |
| 52 | `sheet-screen.ts` | the RPE reference reads otherwise | **1** | 1 | unit/native-session-sheet 1 |
| 53 | `sheet-writes.ts` | a draw leaves the slider marked as moved | **2** | 5 | integration/native-session-sheet 3, unit/native-session-sheet 2 |
| 54 | `sheet-writes.ts` | a draw leaves the notes blank | **2** | 2 | integration/native-session-sheet 1, unit/native-session-sheet 1 |
| 55 | `sheet-writes.ts` | a draw leaves the slider at 5 whatever was stored | **1** | 1 | integration/native-session-sheet 1 |
| 56 | `sheet-writes.ts` | a timed run's second wheel is not on the form | **2** | 3 | integration/native-session-sheet 2, unit/native-session-sheet 1 |
| 57 | `sheet-writes.ts` | the reps on the form are the reps shown, not the reps stored | **1** | 1 | unit/native-session-sheet 1 |
| 58 | `sheet-writes.ts` | the plain run form holds no pace | **2** | 2 | integration/native-session-sheet 1, unit/native-session-sheet 1 |
| 59 | `sheet-writes.ts` | a ride's time is not on the form | **1** | 1 | unit/native-session-sheet 1 |
| 60 | `sheet-writes.ts` | a swim's yards are not on the form | **1** | 1 | unit/native-session-sheet 1 |
| 61 | `sheet-writes.ts` | the card is always on its planned sport | **1** | 2 | unit/native-session-sheet 2 |
| 62 | `sheet-writes.ts` | the slider moved is not marked as moved | **2** | 3 | integration/native-session-sheet 1, unit/native-session-sheet 2 |
| 63 | `sheet-writes.ts` | a save does not snapshot the day | **2** | 2 | integration/native-session-sheet 1, unit/native-session-sheet 1 |
| 64 | `sheet-writes.ts` | a commit tap does not read a draft card's form | **1** | 2 | unit/native-session-sheet 2 |
| 65 | `sheet-writes.ts` | every save reads the cardio form, draft or not | **1** | 3 | unit/native-session-sheet 3 |
| 66 | `sheet-writes.ts` | the card is live by its planned sport's numbers | **1** | 1 | unit/native-session-sheet 1 |
| 67 | `sheet-writes.ts` | a swapped sport is not named on the entry | **1** | 1 | unit/native-session-sheet 1 |
| 68 | `sheet-writes.ts` | a save drops the set drafts | **2** | 2 | integration/native-session-sheet 1, unit/native-session-sheet 1 |
| 69 | `sheet-writes.ts` | a save drops the parked sports | **1** | 1 | unit/native-session-sheet 1 |
| 70 | `sheet-writes.ts` | a save drops a rest day's jog | **1** | 1 | unit/native-session-sheet 1 |
| 71 | `sheet-writes.ts` | a slider nobody moved stores its 5 | **2** | 6 | integration/native-session-sheet 3, unit/native-session-sheet 3 |
| 72 | `sheet-writes.ts` | a slider nobody moved wipes the entry's effort | **2** | 3 | integration/native-session-sheet 1, unit/native-session-sheet 2 |
| 73 | `sheet-writes.ts` | the entry does not carry its week | **2** | 4 | integration/native-session-sheet 3, unit/native-session-sheet 1 |
| 74 | `sheet-writes.ts` | the entry is stamped with nothing | **2** | 4 | integration/native-session-sheet 3, unit/native-session-sheet 1 |
| 75 | `sheet-writes.ts` | the entry's two swap fields are written the other way round | **2** | 4 | integration/native-session-sheet 3, unit/native-session-sheet 1 |
| 76 | `sheet-writes.ts` | the notes are not stored | **2** | 7 | integration/native-session-sheet 1, unit/native-session-sheet 6 |
| 77 | `sheet-writes.ts` | a ride's minutes are not stored | **1** | 1 | unit/native-session-sheet 1 |
| 78 | `sheet-writes.ts` | the miles are stored from a draft card | **1** | 2 | unit/native-session-sheet 2 |
| 79 | `sheet-writes.ts` | the derived pace writes over the form's own | **1** | 1 | unit/native-session-sheet 1 |
| 80 | `sheet-writes.ts` | the derived distance is not stamped | **1** | 1 | unit/native-session-sheet 1 |
| 81 | `sheet-writes.ts` | a draft card derives its pace too | **1** | 1 | unit/native-session-sheet 1 |
| 82 | `sheet-writes.ts` | a save does not settle the day's skipped parts | **1** | 1 | unit/native-session-sheet 1 |
| 83 | `sheet-writes.ts` | a status tap snapshots the day nowhere | **2** | 4 | integration/native-session-sheet 2, unit/native-session-sheet 2 |
| 84 | `sheet-writes.ts` | a status set by hand leaves the day's skipped parts | **2** | 4 | integration/native-session-sheet 2, unit/native-session-sheet 2 |
| 85 | `sheet-writes.ts` | a status tap never commits the form | **1** | 1 | unit/native-session-sheet 1 |
| 86 | `sheet-writes.ts` | the undo tap commits the form | **1** | 1 | unit/native-session-sheet 1 |
| 87 | `sheet-writes.ts` | a status tap does not save the log | **2** | 5 | integration/native-session-sheet 3, unit/native-session-sheet 2 |
| 88 | `sheet-writes.ts` | the undo leaves the day's status | **2** | 5 | integration/native-session-sheet 2, unit/native-session-sheet 3 |
| 89 | `sheet-writes.ts` | any day's undo lets the season's pop-up go | **1** | 1 | unit/native-session-sheet 1 |
| 90 | `sheet-writes.ts` | the last day's undo keeps the season's mark | **2** | 3 | integration/native-session-sheet 1, unit/native-session-sheet 2 |
| 91 | `sheet-writes.ts` | the undo of a Skip lets the season's pop-up go | **1** | 1 | unit/native-session-sheet 1 |
| 92 | `sheet-writes.ts` | the undo's toast reads Undone | **2** | 4 | integration/native-session-sheet 2, unit/native-session-sheet 2 |
| 93 | `sheet-writes.ts` | the undo closes the sheet | **2** | 4 | integration/native-session-sheet 2, unit/native-session-sheet 2 |
| 94 | `sheet-writes.ts` | a day with no title is closed under an empty title | **1** | 1 | unit/native-session-sheet 1 |
| 95 | `sheet-writes.ts` | the status is stamped with nothing | **2** | 6 | integration/native-session-sheet 3, unit/native-session-sheet 3 |
| 96 | `sheet-writes.ts` | Skip marks the day done | **2** | 3 | integration/native-session-sheet 1, unit/native-session-sheet 2 |
| 97 | `sheet-writes.ts` | Done raises no pop-up | **2** | 5 | integration/native-session-sheet 3, unit/native-session-sheet 2 |
| 98 | `sheet-writes.ts` | Done raises its toast under the pop-up | **2** | 5 | integration/native-session-sheet 3, unit/native-session-sheet 2 |
| 99 | `sheet-writes.ts` | Done leaves the sheet open | **2** | 4 | integration/native-session-sheet 2, unit/native-session-sheet 2 |
| 100 | `sheet-writes.ts` | Skip's toast reads Skipped | **2** | 2 | integration/native-session-sheet 1, unit/native-session-sheet 1 |
| 101 | `sheet-writes.ts` | Skip raises the pop-up | **2** | 2 | integration/native-session-sheet 1, unit/native-session-sheet 1 |
| 102 | `pop-ups.ts` | the season's release removes the reminder's day instead | **3** | 3 | unit/native-pop-ups 1, unit/native-session-sheet 1, integration/native-session-sheet 1 |
| 103 | `day-detail-model.ts` | the copy of the sheet's model words a done day otherwise | **2** | 6 | integration/native-session-sheet 3, unit/native-session-sheet 3 |
| 104 | `session-log-model.ts` | the copy of the log's model words the still slider otherwise | **2** | 6 | integration/native-session-sheet 4, unit/native-session-sheet 2 |
| 105 | `cardio-fields-model.ts` | the copy of the fields' model seeds the stamped distance | **1** | 1 | unit/native-session-sheet 1 |
| 106 | `cardio-card-model.ts` | the copy of the cardio card's model joins its name otherwise | **2** | 6 | integration/native-session-sheet 4, unit/native-session-sheet 2 |
| 107 | `sheet-marks-model.ts` | the copy of the marks' model colours an unknown tag otherwise | **1** | 1 | unit/native-session-sheet 1 |
| 108 | `SessionSheet.tsx` | the slider moved saves nothing | **1** | 1 | unit/native-session-sheet 1 |
| 109 | `SessionSheet.tsx` | the notes typed save nothing | **1** | 1 | unit/native-session-sheet 1 |
| 110 | `SessionSheet.tsx` | a drag that stays on its number saves again and again | **1** | 1 | unit/native-session-sheet 1 |
| 111 | `SessionSheet.tsx` | the slider's save is a commit | **1** | 1 | unit/native-session-sheet 1 |
| 112 | `SessionSheet.tsx` | an undo draws nothing again | **1** | 1 | unit/native-session-sheet 1 |
| 113 | `SessionSheet.tsx` | Done closes the sheet with no pop-up | **1** | 1 | unit/native-session-sheet 1 |
| 114 | `SessionSheet.tsx` | a status tap raises no toast | **1** | 1 | unit/native-session-sheet 1 |
| 115 | `SessionSheet.tsx` | Mark Done marks the day skipped | **1** | 1 | unit/native-session-sheet 1 |
| 116 | `SessionSheet.tsx` | the foot closes the day under the title in the header | **1** | 1 | unit/native-session-sheet 1 |
| 117 | `SessionSheet.tsx` | a redraw keeps the old form | **1** | 1 | unit/native-session-sheet 1 |
| 118 | `SessionSheet.tsx` | a redraw keeps the old fields | **1** | 1 | unit/native-session-sheet 1 |
| 119 | `SessionSheet.tsx` | a redraw leaves the sets open | **1** | 1 | unit/native-session-sheet 1 |
| 120 | `SessionSheet.tsx` | the sheet draws every block of the view | **1** | 1 | unit/native-session-sheet 1 |
| 121 | `SessionSheet.tsx` | a set's minus steps up | **1** | 1 | unit/native-session-sheet 1 |
| 122 | `SessionSheet.tsx` | a move's minus puts it back | **1** | 1 | unit/native-session-sheet 1 |
| 123 | `SessionSheet.tsx` | a round's minus puts it back | **1** | 1 | unit/native-session-sheet 1 |
| 124 | `SessionSheet.tsx` | the swap mark opens the sheet on another place | **1** | 1 | unit/native-session-sheet 1 |
| 125 | `SessionSheet.tsx` | Log on a card reads fields a tap ago | **1** | 1 | unit/native-session-sheet 1 |
| 126 | `SessionSheet.tsx` | a field left saves nothing | **1** | 1 | unit/native-session-sheet 1 |
| 127 | `SessionSheet.tsx` | the sets opening do not mark the top set | **1** | 1 | unit/native-session-sheet 1 |
| 128 | `SessionSheet.tsx` | the sheet shows the load field with the sets open | **1** | 1 | unit/native-session-sheet 1 |
| 129 | `SessionSheet.tsx` | Back leaves the sheet open | **1** | 1 | unit/native-session-sheet 1 |
| 130 | `SessionSheet.tsx` | the log section reads otherwise | **1** | 1 | unit/native-session-sheet 1 |
| 131 | `SessionSheet.tsx` | the never marked nudge reads otherwise | **1** | 1 | unit/native-session-sheet 1 |
| 132 | `SessionSheet.tsx` | the nudge comes at once after a pick | **1** | 1 | unit/native-session-sheet 1 |
| 133 | `ThisWeek.tsx` | a done run's Reopen opens the whole day | **1** | 1 | unit/native-session-sheet 1 |
| 134 | `ThisWeek.tsx` | Start opens nothing where the day opens no deck | **1** | 1 | unit/native-session-sheet 1 |
| 135 | `ThisWeek.tsx` | This Week does not hand the sheet its day | **1** | 1 | unit/native-session-sheet 1 |
| 136 | `App.tsx` | Done on the sheet raises no pop-up | **1** | 1 | unit/native-session-sheet 1 |
| 137 | `App.tsx` | the sheet's Back does not close it | **1** | 1 | unit/native-session-sheet 1 |
| 138 | `App.tsx` | This Week's Reopen reaches no sheet | **2** | 2 | unit/native-pop-ups 1, unit/native-session-sheet 1 |

- Breaks made: **138** of 138. Let through by the fast files, so swept: 1. Let through by every file: **0**.
