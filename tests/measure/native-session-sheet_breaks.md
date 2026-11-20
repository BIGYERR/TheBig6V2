# The Expo app's session sheet: a break per rule, and the test files each turns red

Written by `node tests/measure/native-session-sheet_breaks.mjs` (read-only here; each break is made in a copy of the tree and put back).

- The fast files, run on each break: `unit/native-session-sheet.test.ts`, `integration/native-session-sheet.test.ts`, `unit/native-pop-ups.test.ts`, `unit/native-deck.test.ts`, `unit/native-deck-logging.test.ts`, `unit/native-shell.test.ts`. Unbroken, they hold 225 tests and all pass.
- The sweep, run only on a break the fast files let through: `sweeps/native-session-sheet.test.ts` (2 tests, all passing unbroken).

| # | File | The rule broken | Files red | Tests red | Which |
|---|---|---|---|---|---|
| 1 | `sheet-readers.ts` | the Core tag wears the hip colour | **1** | 3 | integration/native-session-sheet 3 |
| 2 | `sheet-readers.ts` | the Lift tag reads Lifting | **2** | 8 | integration/native-session-sheet 6, unit/native-session-sheet 2 |
| 3 | `sheet-readers.ts` | effort 7 reads Hard | **2** | 3 | integration/native-session-sheet 2, unit/native-session-sheet 1 |
| 4 | `sheet-readers.ts` | the pace wheel starts at 5 minutes | **2** | 5 | integration/native-session-sheet 4, unit/native-session-sheet 1 |
| 5 | `sheet-readers.ts` | a move with a prescription is not counted as loggable | **2** | 6 | integration/native-session-sheet 4, unit/native-session-sheet 2 |
| 6 | `sheet-readers.ts` | a skipped round is counted in the day's moves | **1** | 1 | unit/native-session-sheet 1 |
| 7 | `sheet-readers.ts` | a skipped move is counted in the day's moves | **2** | 3 | integration/native-session-sheet 2, unit/native-session-sheet 1 |
| 8 | `sheet-readers.ts` | a lift logged in any week counts as done today | **2** | 3 | integration/native-session-sheet 2, unit/native-session-sheet 1 |
| 9 | `sheet-readers.ts` | a lift logged on any day of the week counts as done today | **2** | 3 | integration/native-session-sheet 2, unit/native-session-sheet 1 |
| 10 | `sheet-readers.ts` | a logged run's button reads Logged | **2** | 5 | integration/native-session-sheet 2, unit/native-session-sheet 3 |
| 11 | `sheet-readers.ts` | the swap note never says the numbers are kept | **1** | 2 | unit/native-session-sheet 2 |
| 12 | `sheet-readers.ts` | a pace of nothing is written 0:00 | **1** | 1 | unit/native-session-sheet 1 |
| 13 | `sheet-readers.ts` | a clock with three parts is read | **1** | 1 | unit/native-session-sheet 1 |
| 14 | `sheet-readers.ts` | the dose a session carries is passed over for its words | **2** | 5 | integration/native-session-sheet 4, unit/native-session-sheet 1 |
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
| 27 | `sheet-screen.ts` | a rest day draws a sheet | **2** | 3 | integration/native-session-sheet 2, unit/native-session-sheet 1 |
| 28 | `sheet-screen.ts` | the title a day was closed under is passed over | **1** | 1 | unit/native-session-sheet 1 |
| 29 | `sheet-screen.ts` | a day with no title reads Session | **1** | 1 | unit/native-session-sheet 1 |
| 30 | `sheet-screen.ts` | the week and day are joined by a comma | **2** | 9 | integration/native-session-sheet 7, unit/native-session-sheet 2 |
| 31 | `sheet-screen.ts` | no logged counter is drawn | **2** | 9 | integration/native-session-sheet 6, unit/native-session-sheet 3 |
| 32 | `sheet-screen.ts` | a travel day wears no travel tag | **1** | 2 | integration/native-session-sheet 2 |
| 33 | `sheet-screen.ts` | lifting comes first whatever the program is for | **2** | 6 | integration/native-session-sheet 5, unit/native-session-sheet 1 |
| 34 | `sheet-screen.ts` | only the main section is drawn | **2** | 14 | integration/native-session-sheet 6, unit/native-session-sheet 8 |
| 35 | `sheet-screen.ts` | the sections after the main one are numbered from the start | **1** | 6 | integration/native-session-sheet 6 |
| 36 | `sheet-screen.ts` | a test day has no 1RM card in its view | **2** | 3 | integration/native-session-sheet 1, unit/native-session-sheet 2 |
| 37 | `sheet-screen.ts` | the 1RM card starts blank whatever was logged | **2** | 2 | integration/native-session-sheet 1, unit/native-session-sheet 1 |
| 38 | `sheet-screen.ts` | the day's note is left out of the view | **2** | 3 | integration/native-session-sheet 1, unit/native-session-sheet 2 |
| 39 | `sheet-screen.ts` | the range nudge is never drawn | **2** | 3 | integration/native-session-sheet 2, unit/native-session-sheet 1 |
| 40 | `sheet-screen.ts` | the Wildcard tag is left out of the view | **2** | 3 | integration/native-session-sheet 2, unit/native-session-sheet 1 |
| 41 | `sheet-screen.ts` | the never marked nudge shows on a day already closed | **2** | 4 | unit/native-session-sheet 1, integration/native-session-sheet 3 |
| 42 | `sheet-screen.ts` | a double day's jog is left out of the view | **2** | 3 | integration/native-session-sheet 1, unit/native-session-sheet 2 |
| 43 | `sheet-screen.ts` | the foot is drawn as pending whatever the day's status | **2** | 6 | unit/native-session-sheet 2, integration/native-session-sheet 4 |
| 44 | `sheet-screen.ts` | the foot closes a day with no title as Training | **1** | 1 | unit/native-session-sheet 1 |
| 45 | `sheet-screen.ts` | a swapped sport keeps the planned dose | **1** | 1 | unit/native-session-sheet 1 |
| 46 | `sheet-screen.ts` | the run is never read as logged | **2** | 4 | integration/native-session-sheet 2, unit/native-session-sheet 2 |
| 47 | `sheet-screen.ts` | the retest strip is left off the cardio card | **1** | 1 | sweeps/native-session-sheet 1 (the sweep was run) |
| 48 | `sheet-screen.ts` | the foot drawn again after an undo ignores the status | **1** | 1 | unit/native-session-sheet 1 |
| 49 | `sheet-screen.ts` | the day's note is left undrawn | **1** | 1 | unit/native-session-sheet 1 |
| 50 | `sheet-screen.ts` | the screen draws only the blocks its list leaves out | **1** | 2 | unit/native-session-sheet 2 |
| 51 | `sheet-screen.ts` | a tint is read as a solid colour | **1** | 1 | unit/native-session-sheet 1 |
| 52 | `sheet-screen.ts` | the RPE reference reads otherwise | **1** | 1 | unit/native-session-sheet 1 |
| 53 | `sheet-writes.ts` | a draw leaves the slider marked as moved | **2** | 8 | integration/native-session-sheet 6, unit/native-session-sheet 2 |
| 54 | `sheet-writes.ts` | a draw leaves the notes blank | **2** | 3 | integration/native-session-sheet 2, unit/native-session-sheet 1 |
| 55 | `sheet-writes.ts` | a draw leaves the slider at 5 whatever was stored | **1** | 1 | integration/native-session-sheet 1 |
| 56 | `sheet-writes.ts` | a timed run's second wheel is not on the form | **2** | 3 | integration/native-session-sheet 2, unit/native-session-sheet 1 |
| 57 | `sheet-writes.ts` | the reps on the form are the reps shown, not the reps stored | **1** | 1 | unit/native-session-sheet 1 |
| 58 | `sheet-writes.ts` | the plain run form holds no pace | **2** | 2 | integration/native-session-sheet 1, unit/native-session-sheet 1 |
| 59 | `sheet-writes.ts` | a ride's time is not on the form | **1** | 1 | unit/native-session-sheet 1 |
| 60 | `sheet-writes.ts` | a swim's yards are not on the form | **1** | 1 | unit/native-session-sheet 1 |
| 61 | `sheet-writes.ts` | the card is always on its planned sport | **1** | 2 | unit/native-session-sheet 2 |
| 62 | `sheet-writes.ts` | the slider moved is not marked as moved | **2** | 3 | integration/native-session-sheet 1, unit/native-session-sheet 2 |
| 63 | `sheet-writes.ts` | a save does not snapshot the day | **2** | 3 | unit/native-session-sheet 1, integration/native-session-sheet 2 |
| 64 | `sheet-writes.ts` | a commit tap does not read a draft card's form | **1** | 2 | unit/native-session-sheet 2 |
| 65 | `sheet-writes.ts` | every save reads the cardio form, draft or not | **1** | 3 | unit/native-session-sheet 3 |
| 66 | `sheet-writes.ts` | the card is live by its planned sport's numbers | **1** | 1 | unit/native-session-sheet 1 |
| 67 | `sheet-writes.ts` | a swapped sport is not named on the entry | **1** | 1 | unit/native-session-sheet 1 |
| 68 | `sheet-writes.ts` | a save drops the set drafts | **2** | 2 | integration/native-session-sheet 1, unit/native-session-sheet 1 |
| 69 | `sheet-writes.ts` | a save drops the parked sports | **1** | 1 | unit/native-session-sheet 1 |
| 70 | `sheet-writes.ts` | a save drops a rest day's jog | **2** | 2 | integration/native-session-sheet 1, unit/native-session-sheet 1 |
| 71 | `sheet-writes.ts` | a slider nobody moved stores its 5 | **2** | 7 | integration/native-session-sheet 4, unit/native-session-sheet 3 |
| 72 | `sheet-writes.ts` | a slider nobody moved wipes the entry's effort | **2** | 3 | integration/native-session-sheet 1, unit/native-session-sheet 2 |
| 73 | `sheet-writes.ts` | the entry does not carry its week | **2** | 5 | integration/native-session-sheet 4, unit/native-session-sheet 1 |
| 74 | `sheet-writes.ts` | the entry is stamped with nothing | **2** | 5 | integration/native-session-sheet 4, unit/native-session-sheet 1 |
| 75 | `sheet-writes.ts` | the entry's two swap fields are written the other way round | **2** | 5 | integration/native-session-sheet 4, unit/native-session-sheet 1 |
| 76 | `sheet-writes.ts` | the notes are not stored | **2** | 8 | integration/native-session-sheet 2, unit/native-session-sheet 6 |
| 77 | `sheet-writes.ts` | a ride's minutes are not stored | **1** | 1 | unit/native-session-sheet 1 |
| 78 | `sheet-writes.ts` | the miles are stored from a draft card | **1** | 2 | unit/native-session-sheet 2 |
| 79 | `sheet-writes.ts` | the derived pace writes over the form's own | **1** | 1 | unit/native-session-sheet 1 |
| 80 | `sheet-writes.ts` | the derived distance is not stamped | **1** | 1 | unit/native-session-sheet 1 |
| 81 | `sheet-writes.ts` | a draft card derives its pace too | **1** | 1 | unit/native-session-sheet 1 |
| 82 | `sheet-writes.ts` | a save does not settle the day's skipped parts | **1** | 1 | unit/native-session-sheet 1 |
| 83 | `sheet-writes.ts` | a status tap snapshots the day nowhere | **2** | 5 | integration/native-session-sheet 3, unit/native-session-sheet 2 |
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
| 95 | `sheet-writes.ts` | the status is stamped with nothing | **2** | 7 | integration/native-session-sheet 4, unit/native-session-sheet 3 |
| 96 | `sheet-writes.ts` | Skip marks the day done | **2** | 3 | integration/native-session-sheet 1, unit/native-session-sheet 2 |
| 97 | `sheet-writes.ts` | Done raises no pop-up | **2** | 6 | integration/native-session-sheet 4, unit/native-session-sheet 2 |
| 98 | `sheet-writes.ts` | Done raises its toast under the pop-up | **2** | 6 | unit/native-session-sheet 2, integration/native-session-sheet 4 |
| 99 | `sheet-writes.ts` | Done leaves the sheet open | **2** | 5 | integration/native-session-sheet 3, unit/native-session-sheet 2 |
| 100 | `sheet-writes.ts` | Skip's toast reads Skipped | **2** | 2 | integration/native-session-sheet 1, unit/native-session-sheet 1 |
| 101 | `sheet-writes.ts` | Skip raises the pop-up | **2** | 2 | integration/native-session-sheet 1, unit/native-session-sheet 1 |
| 102 | `pop-ups.ts` | the season's release removes the reminder's day instead | **3** | 3 | integration/native-session-sheet 1, unit/native-pop-ups 1, unit/native-session-sheet 1 |
| 103 | `day-detail-model.ts` | the copy of the sheet's model words a done day otherwise | **2** | 7 | integration/native-session-sheet 4, unit/native-session-sheet 3 |
| 104 | `session-log-model.ts` | the copy of the log's model words the still slider otherwise | **2** | 9 | integration/native-session-sheet 7, unit/native-session-sheet 2 |
| 105 | `cardio-fields-model.ts` | the copy of the fields' model seeds the stamped distance | **1** | 1 | unit/native-session-sheet 1 |
| 106 | `cardio-card-model.ts` | the copy of the cardio card's model joins its name otherwise | **2** | 8 | integration/native-session-sheet 6, unit/native-session-sheet 2 |
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
| 139 | `sheet-adds.ts` | a move already on the card is offered again | **2** | 7 | integration/native-session-sheet 4, unit/native-session-sheet 3 |
| 140 | `sheet-adds.ts` | the card's names are matched to the kit's by their exact case | **2** | 7 | integration/native-session-sheet 4, unit/native-session-sheet 3 |
| 141 | `sheet-adds.ts` | a move with no pattern is offered | **2** | 8 | integration/native-session-sheet 5, unit/native-session-sheet 3 |
| 142 | `sheet-adds.ts` | the injury plan does not filter the add sheet | **1** | 2 | integration/native-session-sheet 2 |
| 143 | `sheet-adds.ts` | another region's work is listed with the day's own | **2** | 8 | integration/native-session-sheet 5, unit/native-session-sheet 3 |
| 144 | `sheet-adds.ts` | a pattern the day already trains is listed as work it has none of | **2** | 7 | unit/native-session-sheet 2, integration/native-session-sheet 5 |
| 145 | `sheet-adds.ts` | the day's region is its last move's, not its first | **1** | 5 | integration/native-session-sheet 5 |
| 146 | `sheet-adds.ts` | the lighter move is listed first | **2** | 8 | integration/native-session-sheet 5, unit/native-session-sheet 3 |
| 147 | `sheet-adds.ts` | moves of one tier are not put in order by name | **2** | 7 | integration/native-session-sheet 5, unit/native-session-sheet 2 |
| 148 | `sheet-adds.ts` | seven rows of work the day has none of | **2** | 6 | integration/native-session-sheet 5, unit/native-session-sheet 1 |
| 149 | `sheet-adds.ts` | six rows of more of the same | **1** | 5 | integration/native-session-sheet 5 |
| 150 | `sheet-adds.ts` | seven rows of another region's work | **2** | 6 | integration/native-session-sheet 5, unit/native-session-sheet 1 |
| 151 | `sheet-adds.ts` | a dose in yards donates to a rep lift | **1** | 1 | unit/native-session-sheet 1 |
| 152 | `sheet-adds.ts` | a dose in meters donates to a rep lift | **1** | 1 | unit/native-session-sheet 1 |
| 153 | `sheet-adds.ts` | a dose in minutes donates to a rep lift | **1** | 1 | unit/native-session-sheet 1 |
| 154 | `sheet-adds.ts` | a hold donates to a rep lift | **1** | 1 | unit/native-session-sheet 1 |
| 155 | `sheet-adds.ts` | a max time donates to a rep lift | **1** | 1 | unit/native-session-sheet 1 |
| 156 | `sheet-adds.ts` | a time or a distance the parse reads donates to a rep lift | **1** | 1 | unit/native-session-sheet 1 |
| 157 | `sheet-adds.ts` | a Main or a primer section donates its dose | **2** | 6 | integration/native-session-sheet 2, unit/native-session-sheet 4 |
| 158 | `sheet-adds.ts` | a round donates its dose | **2** | 4 | integration/native-session-sheet 3, unit/native-session-sheet 1 |
| 159 | `sheet-adds.ts` | a round named by its type donates its dose | **1** | 1 | unit/native-session-sheet 1 |
| 160 | `sheet-adds.ts` | a core block donates its dose | **1** | 1 | unit/native-session-sheet 1 |
| 161 | `sheet-adds.ts` | a hip block donates its dose | **1** | 1 | unit/native-session-sheet 1 |
| 162 | `sheet-adds.ts` | the athlete's own added work donates its dose | **1** | 1 | unit/native-session-sheet 1 |
| 163 | `sheet-adds.ts` | the first match on today's card donates, not the last | **1** | 1 | unit/native-session-sheet 1 |
| 164 | `sheet-adds.ts` | the week is read from its last day back | **2** | 4 | integration/native-session-sheet 3, unit/native-session-sheet 1 |
| 165 | `sheet-adds.ts` | the same pattern elsewhere in the week is never tried | **2** | 5 | integration/native-session-sheet 3, unit/native-session-sheet 2 |
| 166 | `sheet-adds.ts` | the same region is never tried | **2** | 6 | integration/native-session-sheet 4, unit/native-session-sheet 2 |
| 167 | `sheet-adds.ts` | the conservative dose is three sets of twelve | **2** | 2 | integration/native-session-sheet 1, unit/native-session-sheet 1 |
| 168 | `sheet-adds.ts` | a day the grid does not hold still opens an add sheet | **1** | 1 | unit/native-session-sheet 1 |
| 169 | `sheet-adds.ts` | a row of another region is named by its pattern | **2** | 6 | integration/native-session-sheet 5, unit/native-session-sheet 1 |
| 170 | `sheet-adds.ts` | a row of more of the same always says three sets | **2** | 5 | integration/native-session-sheet 4, unit/native-session-sheet 1 |
| 171 | `sheet-adds.ts` | the sets tag counts the week, not the day | **2** | 6 | integration/native-session-sheet 5, unit/native-session-sheet 1 |
| 172 | `sheet-writes.ts` | an added move takes its donor's dose unshaped | **1** | 1 | unit/native-session-sheet 1 |
| 173 | `sheet-writes.ts` | every add makes a block of its own | **2** | 2 | integration/native-session-sheet 1, unit/native-session-sheet 1 |
| 174 | `sheet-writes.ts` | a move is put in the added block twice | **1** | 1 | unit/native-session-sheet 1 |
| 175 | `sheet-writes.ts` | the added block is not marked as added | **2** | 7 | integration/native-session-sheet 3, unit/native-session-sheet 4 |
| 176 | `sheet-writes.ts` | the added block reads Added | **2** | 4 | integration/native-session-sheet 3, unit/native-session-sheet 1 |
| 177 | `sheet-writes.ts` | an added move is not marked as the athlete's | **2** | 4 | integration/native-session-sheet 3, unit/native-session-sheet 1 |
| 178 | `sheet-writes.ts` | an add stores no record | **2** | 7 | integration/native-session-sheet 3, unit/native-session-sheet 4 |
| 179 | `sheet-writes.ts` | an add is stamped a millisecond late | **2** | 5 | integration/native-session-sheet 3, unit/native-session-sheet 2 |
| 180 | `sheet-writes.ts` | an add is stored under the day before its week | **2** | 6 | integration/native-session-sheet 3, unit/native-session-sheet 3 |
| 181 | `sheet-writes.ts` | an add does not renew the day's snapshot | **2** | 3 | integration/native-session-sheet 2, unit/native-session-sheet 1 |
| 182 | `sheet-writes.ts` | an add's toast leaves out the dose | **2** | 5 | integration/native-session-sheet 3, unit/native-session-sheet 2 |
| 183 | `sheet-writes.ts` | remove takes the move out of the plan too | **1** | 1 | unit/native-session-sheet 1 |
| 184 | `sheet-writes.ts` | remove empties the added block | **2** | 2 | integration/native-session-sheet 1, unit/native-session-sheet 1 |
| 185 | `sheet-writes.ts` | a block left empty stays on the card | **2** | 3 | integration/native-session-sheet 1, unit/native-session-sheet 2 |
| 186 | `sheet-writes.ts` | remove drops no record | **2** | 3 | integration/native-session-sheet 1, unit/native-session-sheet 2 |
| 187 | `sheet-writes.ts` | remove does not renew the day's snapshot | **2** | 2 | integration/native-session-sheet 1, unit/native-session-sheet 1 |
| 188 | `sheet-writes.ts` | remove says the move is off the card | **2** | 2 | integration/native-session-sheet 1, unit/native-session-sheet 1 |
| 189 | `sheet-writes.ts` | no reps is read as three | **1** | 1 | unit/native-session-sheet 1 |
| 190 | `sheet-writes.ts` | the weight is read as a whole number | **1** | 1 | unit/native-session-sheet 1 |
| 191 | `sheet-writes.ts` | a save of nothing still writes and says so | **2** | 2 | integration/native-session-sheet 1, unit/native-session-sheet 1 |
| 192 | `sheet-writes.ts` | the save leaves the stored program's max alone | **2** | 2 | integration/native-session-sheet 1, unit/native-session-sheet 1 |
| 193 | `sheet-writes.ts` | the save leaves the program in hand alone | **2** | 2 | integration/native-session-sheet 1, unit/native-session-sheet 1 |
| 194 | `sheet-writes.ts` | the save does not store the programs | **2** | 3 | integration/native-session-sheet 1, unit/native-session-sheet 2 |
| 195 | `sheet-writes.ts` | the save writes the first stored program, whichever is in hand | **1** | 1 | unit/native-session-sheet 1 |
| 196 | `sheet-writes.ts` | the saved line always says lbs | **1** | 1 | unit/native-session-sheet 1 |
| 197 | `sheet-writes.ts` | the saved line reads starts from | **2** | 3 | integration/native-session-sheet 1, unit/native-session-sheet 2 |
| 198 | `sheet-screen.ts` | the jog is left undrawn | **1** | 2 | unit/native-session-sheet 2 |
| 199 | `sheet-screen.ts` | the Wildcard tag is left undrawn | **1** | 1 | unit/native-session-sheet 1 |
| 200 | `sheet-screen.ts` | the 1RM card is left undrawn | **1** | 1 | unit/native-session-sheet 1 |
| 201 | `SessionSheet.tsx` | the add button opens nothing | **1** | 1 | unit/native-session-sheet 1 |
| 202 | `SessionSheet.tsx` | the add button reads Add | **1** | 1 | unit/native-session-sheet 1 |
| 203 | `SessionSheet.tsx` | a day with nothing to add to says nothing | **1** | 1 | unit/native-session-sheet 1 |
| 204 | `SessionSheet.tsx` | a pick does not draw the sheet again | **1** | 1 | unit/native-session-sheet 1 |
| 205 | `SessionSheet.tsx` | a pick raises no toast | **1** | 1 | unit/native-session-sheet 1 |
| 206 | `SessionSheet.tsx` | a pick is stamped with no instant of its own | **1** | 1 | unit/native-session-sheet 1 |
| 207 | `SessionSheet.tsx` | no add sheet is drawn over the sheet | **1** | 1 | unit/native-session-sheet 1 |
| 208 | `SessionSheet.tsx` | the add sheet's pick is handed nowhere | **1** | 1 | unit/native-session-sheet 1 |
| 209 | `SessionSheet.tsx` | the add sheet never closes | **1** | 1 | unit/native-session-sheet 1 |
| 210 | `SessionSheet.tsx` | an added move's remove calls nothing | **1** | 1 | unit/native-session-sheet 1 |
| 211 | `SessionSheet.tsx` | a remove does not draw the sheet again | **1** | 1 | unit/native-session-sheet 1 |
| 212 | `SessionSheet.tsx` | an added move's remove reads delete | **1** | 1 | unit/native-session-sheet 1 |
| 213 | `SessionSheet.tsx` | an added move no longer says the athlete added it | **1** | 1 | unit/native-session-sheet 1 |
| 214 | `SessionSheet.tsx` | the jog's Edit cardio asks for no sheet (until the rest sheet's session, Post-v0.263.0: "takes a press"; run again alone on the new rule) | **1** | 1 | unit/native-session-sheet 1 |
| 215 | `SessionSheet.tsx` | the jog's lines are not drawn | **1** | 1 | unit/native-session-sheet 1 |
| 216 | `SessionSheet.tsx` | the jog's label is not drawn | **1** | 1 | unit/native-session-sheet 1 |
| 217 | `SessionSheet.tsx` | the Wildcard tag reads Wildcard | **1** | 1 | unit/native-session-sheet 1 |
| 218 | `SessionSheet.tsx` | the Wildcard tag's words are not drawn | **1** | 1 | unit/native-session-sheet 1 |
| 219 | `SessionSheet.tsx` | the day's note is drawn with its markup | **1** | 1 | unit/native-session-sheet 1 |
| 220 | `SessionSheet.tsx` | the 1RM card saves the bench, whatever the day tests | **1** | 1 | unit/native-session-sheet 1 |
| 221 | `SessionSheet.tsx` | the 1RM card's save says pounds on a kilogram program | **1** | 1 | unit/native-session-sheet 1 |
| 222 | `SessionSheet.tsx` | the 1RM card's estimate starts at the logged set's | **1** | 1 | unit/native-session-sheet 1 |
| 223 | `SessionSheet.tsx` | the 1RM card opens on three reps, whatever was logged | **1** | 1 | unit/native-session-sheet 1 |
| 224 | `SessionSheet.tsx` | the 1RM card opens with no weight, whatever was logged | **1** | 1 | unit/native-session-sheet 1 |
| 225 | `SessionSheet.tsx` | a weight typed does not move the estimate | **1** | 1 | unit/native-session-sheet 1 |
| 226 | `SessionSheet.tsx` | reps picked do not move the estimate | **1** | 1 | unit/native-session-sheet 1 |
| 227 | `SessionSheet.tsx` | the card shows its saved line when nothing was saved | **1** | 1 | unit/native-session-sheet 1 |
| 228 | `SessionSheet.tsx` | the save button stays after a save | **1** | 1 | unit/native-session-sheet 1 |
| 229 | `SessionSheet.tsx` | the 1RM card offers six reps | **1** | 1 | unit/native-session-sheet 1 |
| 230 | `SessionSheet.tsx` | the save button reads Save max | **1** | 1 | unit/native-session-sheet 1 |
| 231 | `SessionSheet.tsx` | the 1RM card's hint says RPE 9 | **1** | 1 | unit/native-session-sheet 1 |
| 232 | `SessionSheet.tsx` | the 1RM card reads One rep max | **1** | 1 | unit/native-session-sheet 1 |
| 233 | `SessionSheet.tsx` | the 1RM card's number is labelled Estimate | **1** | 1 | unit/native-session-sheet 1 |
| 234 | `AddSheet.tsx` | a row tapped hands no pick on | **1** | 1 | unit/native-session-sheet 1 |
| 235 | `AddSheet.tsx` | a second tap while the add sheet leaves picks again | **1** | 1 | unit/native-session-sheet 1 |
| 236 | `AddSheet.tsx` | the add sheet's Back does not leave | **1** | 1 | unit/native-session-sheet 1 |
| 237 | `AddSheet.tsx` | work the day has none of is drawn under more of the same too | **1** | 1 | unit/native-session-sheet 1 |
| 238 | `AddSheet.tsx` | another region's rows are not drawn | **1** | 1 | unit/native-session-sheet 1 |
| 239 | `AddSheet.tsx` | the foot stands on a sheet with nothing to offer in its first list | **1** | 1 | unit/native-session-sheet 1 |
| 240 | `AddSheet.tsx` | the empty words and the foot change places | **1** | 1 | unit/native-session-sheet 1 |
| 241 | `AddSheet.tsx` | a row's note is not drawn | **1** | 1 | unit/native-session-sheet 1 |
| 242 | `AddSheet.tsx` | the add sheet is headed Add a move | **1** | 1 | unit/native-session-sheet 1 |
| 243 | `AddSheet.tsx` | the add sheet's title is not the day's | **1** | 1 | unit/native-session-sheet 1 |
| 244 | `AddSheet.tsx` | the sets tag is not drawn | **1** | 1 | unit/native-session-sheet 1 |
| 245 | `AddSheet.tsx` | the region tag is not drawn | **1** | 1 | unit/native-session-sheet 1 |
| 246 | `AddSheet.tsx` | the line under the tags is gone | **1** | 1 | unit/native-session-sheet 1 |
| 247 | `AddSheet.tsx` | the first list is headed New work | **1** | 1 | unit/native-session-sheet 1 |
| 248 | `AddSheet.tsx` | the first list's line is gone | **1** | 1 | unit/native-session-sheet 1 |
| 249 | `AddSheet.tsx` | the second list is headed More | **1** | 1 | unit/native-session-sheet 1 |
| 250 | `AddSheet.tsx` | the second list no longer warns of stacked fatigue | **1** | 1 | unit/native-session-sheet 1 |
| 251 | `AddSheet.tsx` | the third list is headed Other work | **1** | 1 | unit/native-session-sheet 1 |
| 252 | `AddSheet.tsx` | the third list no longer says what to watch | **1** | 1 | unit/native-session-sheet 1 |
| 253 | `AddSheet.tsx` | the empty words are shorter | **1** | 1 | unit/native-session-sheet 1 |
| 254 | `AddSheet.tsx` | the foot no longer says next week is unchanged | **1** | 1 | unit/native-session-sheet 1 |
| 255 | `add-sheet-model.ts` | the add sheet model's copy says Sets rise to | **2** | 7 | integration/native-session-sheet 5, unit/native-session-sheet 2 |
| 256 | `add-sheet-model.ts` | the add sheet model's copy counts a skipped move's sets | **2** | 4 | integration/native-session-sheet 2, unit/native-session-sheet 2 |

- Breaks made: **256** of 256. Let through by the fast files, so swept: 1. Let through by every file: **0**.
