# The Expo app's Progress: a break per rule, and the test files each turns red

Written by `node tests/measure/native-progress_breaks.mjs` (read-only here; each break is made in a copy of the tree and put back).

- The fast files, run on each break: `unit/native-progress.test.ts`, `integration/native-progress.test.ts`, `unit/native-cardio-sheet.test.ts`. Unbroken, they hold 97 tests and all pass.
- The sweep, run only on a break the fast files let through: `sweeps/native-progress.test.ts` (21 tests, all passing unbroken).

| # | File | The rule broken | Files red | Tests red | Which |
|---|---|---|---|---|---|
| 1 | `progress-readers.ts` | any lift of a Main section is the main lift | **2** | 5 | unit/native-progress 1, integration/native-progress 4 |
| 2 | `progress-readers.ts` | a section named Main is not read as one | **2** | 9 | integration/native-progress 4, unit/native-progress 5 |
| 3 | `progress-readers.ts` | a later accessory set unmakes the main slot | **1** | 1 | unit/native-progress 1 |
| 4 | `progress-readers.ts` | the slot is read off the other lifts of the card | **2** | 12 | integration/native-progress 4, unit/native-progress 8 |
| 5 | `progress-readers.ts` | the slot is read off Monday's card whatever the day | **2** | 7 | integration/native-progress 4, unit/native-progress 3 |
| 6 | `progress-readers.ts` | a range whose top is its bottom counts as a range | **1** | 1 | unit/native-progress 1 |
| 7 | `progress-readers.ts` | the range is the first item's of the day | **2** | 6 | integration/native-progress 4, unit/native-progress 2 |
| 8 | `progress-readers.ts` | a set of no reps is kept | **1** | 1 | unit/native-progress 1 |
| 9 | `progress-readers.ts` | an entry with no reps done has no sets | **1** | 2 | unit/native-progress 2 |
| 10 | `progress-readers.ts` | the Romanian deadlift keeps a block of its own | **2** | 6 | integration/native-progress 4, unit/native-progress 2 |
| 11 | `progress-readers.ts` | the heaviest hinge set loses its tag | **2** | 6 | integration/native-progress 4, unit/native-progress 2 |
| 12 | `progress-readers.ts` | the opening hinge set loses its tag | **2** | 6 | integration/native-progress 4, unit/native-progress 2 |
| 13 | `progress-readers.ts` | a tie in load goes to the later week | **1** | 1 | unit/native-progress 1 |
| 14 | `progress-readers.ts` | the opening hinge set is the first stored, not the first week's | **1** | 2 | unit/native-progress 2 |
| 15 | `progress-readers.ts` | the Deadlift line is in the store's order | **1** | 2 | unit/native-progress 2 |
| 16 | `progress-readers.ts` | the Deadlift block forgets its accessory days | **1** | 1 | unit/native-progress 1 |
| 17 | `progress-readers.ts` | the Deadlift block counts one hinge's entries | **1** | 2 | unit/native-progress 2 |
| 18 | `progress-readers.ts` | an unloaded hinge is folded into the load line | **1** | 1 | unit/native-progress 1 |
| 19 | `progress-readers.ts` | the Deadlift block is named for its first hinge | **1** | 4 | integration/native-progress 4 |
| 20 | `progress-readers.ts` | any day on the card makes a main session | **2** | 9 | integration/native-progress 4, unit/native-progress 5 |
| 21 | `progress-readers.ts` | a blank load is plotted | **1** | 3 | unit/native-progress 3 |
| 22 | `progress-readers.ts` | accessory days are not counted off the line | **1** | 2 | unit/native-progress 2 |
| 23 | `progress-readers.ts` | the lightest set heads a main lift | **1** | 2 | unit/native-progress 2 |
| 24 | `progress-readers.ts` | a main lift opens at its last session | **1** | 2 | unit/native-progress 2 |
| 25 | `progress-readers.ts` | the top set is the last set, not the best | **2** | 6 | integration/native-progress 4, unit/native-progress 2 |
| 26 | `progress-readers.ts` | sessions with no load are not counted | **1** | 1 | unit/native-progress 1 |
| 27 | `progress-readers.ts` | an unloaded main lift is charted as a load | **1** | 2 | unit/native-progress 2 |
| 28 | `progress-readers.ts` | a reps block heads with its first session | **1** | 1 | unit/native-progress 1 |
| 29 | `progress-readers.ts` | an unloaded lift counts no reps | **1** | 1 | unit/native-progress 1 |
| 30 | `progress-readers.ts` | the range is the last session's alone | **1** | 1 | unit/native-progress 1 |
| 31 | `progress-readers.ts` | one set at the top is ready | **1** | 1 | unit/native-progress 1 |
| 32 | `progress-readers.ts` | a held weight counts as a step up | **1** | 1 | unit/native-progress 1 |
| 33 | `progress-readers.ts` | the ladder's weight is the first session's | **2** | 6 | integration/native-progress 4, unit/native-progress 2 |
| 34 | `progress-readers.ts` | a lift's lightest load counts a blank as zero | **1** | 1 | unit/native-progress 1 |
| 35 | `progress-readers.ts` | the longest line goes last | **1** | 2 | unit/native-progress 2 |
| 36 | `progress-readers.ts` | the ready lifts are not put first | **1** | 1 | unit/native-progress 1 |
| 37 | `progress-readers.ts` | a lift's entries are read in the store's order | **1** | 1 | unit/native-progress 1 |
| 38 | `progress-readers.ts` | the other lifts are in the store's order | **1** | 1 | unit/native-progress 1 |
| 39 | `progress-readers.ts` | a run credited to another sport is placed | **2** | 4 | integration/native-progress 3, unit/native-progress 1 |
| 40 | `progress-readers.ts` | a run past the program's last week is placed | **1** | 1 | unit/native-progress 1 |
| 41 | `progress-readers.ts` | a ride is placed as a run | **1** | 1 | unit/native-progress 1 |
| 42 | `progress-readers.ts` | an easy run is not placed | **2** | 3 | integration/native-progress 1, unit/native-progress 2 |
| 43 | `progress-readers.ts` | a run with no target is placed | **1** | 1 | unit/native-progress 1 |
| 44 | `progress-readers.ts` | slower than the ceiling is hot | **2** | 3 | integration/native-progress 2, unit/native-progress 1 |
| 45 | `progress-readers.ts` | the frozen ceiling is not read | **1** | 1 | unit/native-progress 1 |
| 46 | `progress-readers.ts` | below the table the recovery pace is not clamped | **1** | 1 | unit/native-progress 1 |
| 47 | `progress-readers.ts` | above the table the tempo is the first row's | **1** | 1 | unit/native-progress 1 |
| 48 | `progress-readers.ts` | between rows the tempo is not read across | **1** | 1 | unit/native-progress 1 |
| 49 | `progress-readers.ts` | the ceiling is the tempo alone | **1** | 1 | unit/native-progress 1 |
| 50 | `progress-readers.ts` | the placed runs are in the store's order | **1** | 1 | unit/native-progress 1 |
| 51 | `progress-readers.ts` | a Monday start is a short first week | **2** | 10 | integration/native-progress 8, unit/native-progress 2 |
| 52 | `progress-readers.ts` | the easy effort gate is five runs | **2** | 4 | integration/native-progress 3, unit/native-progress 1 |
| 53 | `progress-readers.ts` | the zone chart's gate is three runs | **2** | 3 | integration/native-progress 2, unit/native-progress 1 |
| 54 | `progress-readers.ts` | a half marathon is 13 miles | **2** | 8 | integration/native-progress 7, unit/native-progress 1 |
| 55 | `progress-screen.ts` | the tab opens with the delete still armed | **1** | 1 | unit/native-progress 1 |
| 56 | `progress-screen.ts` | the tab opens on the program last shown | **2** | 2 | integration/native-progress 1, unit/native-progress 1 |
| 57 | `progress-screen.ts` | the trash arms the first tier | **2** | 3 | integration/native-progress 1, unit/native-progress 2 |
| 58 | `progress-screen.ts` | Cancel leaves the tier armed | **2** | 2 | integration/native-progress 1, unit/native-progress 1 |
| 59 | `progress-screen.ts` | after the delete the view keeps the deleted program | **1** | 1 | unit/native-progress 1 |
| 60 | `progress-screen.ts` | after the delete the view lets go of any program | **1** | 1 | unit/native-progress 1 |
| 61 | `progress-screen.ts` | the estimator opens on Squat | **2** | 10 | integration/native-progress 8, unit/native-progress 2 |
| 62 | `progress-screen.ts` | a chip shows nothing | **2** | 5 | integration/native-progress 2, unit/native-progress 3 |
| 63 | `progress-screen.ts` | the estimator's lift is not kept | **2** | 8 | integration/native-progress 6, unit/native-progress 2 |
| 64 | `progress-screen.ts` | no program is the active one | **1** | 2 | integration/native-progress 2 |
| 65 | `progress-screen.ts` | the screen opens on the first live program, not the active one | **1** | 2 | integration/native-progress 2 |
| 66 | `progress-screen.ts` | a view id that names no program is kept | **1** | 1 | unit/native-progress 1 |
| 67 | `progress-screen.ts` | the delete never warns of the loads | **1** | 1 | integration/native-progress 1 |
| 68 | `progress-screen.ts` | the bar never shows the confirmation | **2** | 2 | integration/native-progress 1, unit/native-progress 1 |
| 69 | `progress-screen.ts` | the open does not clean the lift log | **1** | 1 | integration/native-progress 1 |
| 70 | `progress-screen.ts` | a program with no length is read as twelve weeks | **1** | 1 | unit/native-progress 1 |
| 71 | `progress-screen.ts` | nothing logged still shows the estimator | **2** | 3 | integration/native-progress 2, unit/native-progress 1 |
| 72 | `progress-screen.ts` | nothing logged reads the second empty state | **2** | 3 | integration/native-progress 2, unit/native-progress 1 |
| 73 | `progress-screen.ts` | the week in progress is not held back | **1** | 8 | integration/native-progress 8 |
| 74 | `progress-screen.ts` | a short first week is not left out | **1** | 2 | integration/native-progress 2 |
| 75 | `progress-screen.ts` | the ladder has no race line | **1** | 7 | integration/native-progress 7 |
| 76 | `progress-screen.ts` | no program has a sport | **1** | 4 | integration/native-progress 4 |
| 77 | `progress-screen.ts` | the charts read no history | **1** | 8 | integration/native-progress 8 |
| 78 | `progress-screen.ts` | the ladder ignores the held back week | **1** | 1 | integration/native-progress 1 |
| 79 | `progress-screen.ts` | the zone chart is handed no runs | **1** | 2 | integration/native-progress 2 |
| 80 | `progress-screen.ts` | the easy bands are handed the easy effort's runs | **1** | 2 | integration/native-progress 2 |
| 81 | `progress-screen.ts` | the easy effort chart is handed the recovery trend | **1** | 2 | integration/native-progress 2 |
| 82 | `progress-screen.ts` | the recovery trend is handed no weeks | **1** | 3 | integration/native-progress 3 |
| 83 | `progress-screen.ts` | the drift counts the short first week | **1** | 1 | integration/native-progress 1 |
| 84 | `progress-screen.ts` | the ledger reads an empty lift log | **2** | 5 | integration/native-progress 4, unit/native-progress 1 |
| 85 | `progress-screen.ts` | the ledger reads no frozen card | **1** | 4 | integration/native-progress 4 |
| 86 | `progress-screen.ts` | a pace is printed as seconds | **1** | 3 | integration/native-progress 3 |
| 87 | `progress-screen.ts` | the mile is the recovery pace itself | **1** | 1 | integration/native-progress 1 |
| 88 | `progress-screen.ts` | the half is the mile itself | **1** | 1 | integration/native-progress 1 |
| 89 | `progress-screen.ts` | the easy band starts at RPE 1 | **1** | 2 | integration/native-progress 2 |
| 90 | `progress-screen.ts` | the easy band ends at RPE 9 | **1** | 2 | integration/native-progress 2 |
| 91 | `progress-screen.ts` | one easy run is enough for the chart | **1** | 3 | integration/native-progress 3 |
| 92 | `progress-screen.ts` | one run is enough for the zone chart | **1** | 6 | integration/native-progress 6 |
| 93 | `progress-screen.ts` | the journal names no effort | **2** | 9 | integration/native-progress 8, unit/native-progress 1 |
| 94 | `progress-screen.ts` | the journal shows no jog | **1** | 4 | integration/native-progress 4 |
| 95 | `progress-screen.ts` | an empty journal is drawn | **1** | 2 | unit/native-progress 2 |
| 96 | `progress-screen.ts` | a journal alone still reads the empty state | **1** | 1 | unit/native-progress 1 |
| 97 | `progress-screen.ts` | a ledger with rows still reads the empty state | **1** | 1 | unit/native-progress 1 |
| 98 | `progress-screen.ts` | the estimator is hidden once logs exist | **2** | 10 | integration/native-progress 8, unit/native-progress 2 |
| 99 | `progress-screen.ts` | the logs shown are the active program's | **1** | 2 | integration/native-progress 2 |
| 100 | `progress-screen.ts` | the journal is the active program's | **1** | 2 | integration/native-progress 2 |
| 101 | `progress-screen.ts` | the history read is the active program's | **1** | 2 | integration/native-progress 2 |
| 102 | `progress-screen.ts` | the estimate is always said in pounds | **2** | 2 | integration/native-progress 1, unit/native-progress 1 |
| 103 | `progress-screen.ts` | the estimate always names the deadlift | **2** | 7 | integration/native-progress 6, unit/native-progress 1 |
| 104 | `progress-screen.ts` | the estimate's unit is always pounds | **2** | 2 | integration/native-progress 1, unit/native-progress 1 |
| 105 | `progress-screen.ts` | an estimate with a number missing still draws | **2** | 7 | integration/native-progress 6, unit/native-progress 1 |
| 106 | `progress-screen.ts` | the estimate's closing words are dropped | **2** | 8 | integration/native-progress 6, unit/native-progress 2 |
| 107 | `progress-screen.ts` | an ampersand in a note is drawn as its entity | **1** | 1 | unit/native-progress 1 |
| 108 | `progress-screen.ts` | an angle bracket in a note is drawn as its entity | **1** | 1 | unit/native-progress 1 |
| 109 | `progress-screen.ts` | a title keeps the space after its icon | **2** | 10 | integration/native-progress 8, unit/native-progress 2 |
| 110 | `progress-screen.ts` | a title's icon is dropped | **2** | 9 | integration/native-progress 8, unit/native-progress 1 |
| 111 | `progress-screen.ts` | run card: the run cards are in the view and not drawn | **1** | 1 | unit/native-progress 1 |
| 112 | `progress-model.ts` | the model's copy: the estimate rounds to the nearest ten | **2** | 8 | integration/native-progress 6, unit/native-progress 2 |
| 113 | `program-chips-model.ts` | the model's copy: archived programs come before live ones | **1** | 1 | unit/native-progress 1 |
| 114 | `dot-chart-model.ts` | the model's copy: the dot chart is 130 tall | **2** | 9 | integration/native-progress 8, unit/native-progress 1 |
| 115 | `chart-card-model.ts` | the model's copy: a card's title sits 10 above | **2** | 9 | integration/native-progress 8, unit/native-progress 1 |
| 116 | `ledger-model.ts` | the model's copy: kilograms to the nearest whole | **1** | 1 | unit/native-progress 1 |
| 117 | `run-charts-model.ts` | the model's copy: the bands' footer loses a word | **2** | 3 | integration/native-progress 2, unit/native-progress 1 |
| 118 | `progress-writes.ts` | Restore leaves the archive date | **2** | 2 | integration/native-progress 1, unit/native-progress 1 |
| 119 | `progress-writes.ts` | Restore leaves the program archived | **2** | 2 | integration/native-progress 1, unit/native-progress 1 |
| 120 | `progress-writes.ts` | Restore is not saved | **2** | 2 | integration/native-progress 1, unit/native-progress 1 |
| 121 | `progress-writes.ts` | Restore's toast reads Restored | **2** | 2 | integration/native-progress 1, unit/native-progress 1 |
| 122 | `progress-writes.ts` | Restore of a program that is gone says it restored | **1** | 1 | unit/native-progress 1 |
| 123 | `progress-writes.ts` | Delete Forever saves the list after the keys go | **1** | 1 | unit/native-progress 1 |
| 124 | `progress-writes.ts` | Delete Forever leaves the program in the list | **2** | 3 | integration/native-progress 1, unit/native-progress 2 |
| 125 | `progress-writes.ts` | Delete Forever leaves the day logs | **2** | 2 | integration/native-progress 1, unit/native-progress 1 |
| 126 | `progress-writes.ts` | Delete Forever leaves the lift log | **2** | 2 | integration/native-progress 1, unit/native-progress 1 |
| 127 | `progress-writes.ts` | Delete Forever leaves the frozen days | **2** | 2 | integration/native-progress 1, unit/native-progress 1 |
| 128 | `progress-writes.ts` | Delete Forever leaves the last reminder | **2** | 2 | integration/native-progress 1, unit/native-progress 1 |
| 129 | `progress-writes.ts` | Delete Forever removes the done days before the logs | **1** | 1 | unit/native-progress 1 |
| 130 | `progress-writes.ts` | Delete Forever removes every program's keys of a family | **2** | 3 | integration/native-progress 1, unit/native-progress 2 |
| 131 | `progress-writes.ts` | a pointer on the deleted program is left dangling | **1** | 2 | unit/native-progress 2 |
| 132 | `progress-writes.ts` | Delete Forever's toast reads Deleted | **2** | 2 | integration/native-progress 1, unit/native-progress 1 |
| 133 | `progress-writes.ts` | the open always writes the lift log | **2** | 7 | integration/native-progress 6, unit/native-progress 1 |
| 134 | `progress-writes.ts` | the open never writes the lift log | **2** | 3 | integration/native-progress 1, unit/native-progress 2 |
| 135 | `progress-writes.ts` | a fold alone is not saved | **1** | 1 | unit/native-progress 1 |
| 136 | `progress-writes.ts` | the open does not fold the old keys | **2** | 2 | integration/native-progress 1, unit/native-progress 1 |
| 137 | `progress-writes.ts` | the open does not drop a same day pair | **2** | 2 | integration/native-progress 1, unit/native-progress 1 |
| 138 | `progress-writes.ts` | the pair is dropped before the fold makes it | **1** | 1 | integration/native-progress 1 |
| 139 | `paint.ts` | a tint loses its strength | **1** | 2 | unit/native-progress 2 |
| 140 | `paint.ts` | a token with a dash is not found | **1** | 1 | unit/native-progress 1 |
| 141 | `paint.ts` | a token the palette lacks is handed on as written | **1** | 1 | unit/native-progress 1 |
| 142 | `paint.ts` | a plain colour reads as muted | **1** | 1 | unit/native-progress 1 |
| 143 | `paint.ts` | a text's anchor keeps the web's name | **2** | 10 | integration/native-progress 8, unit/native-progress 2 |
| 144 | `paint.ts` | a line's width keeps the web's name | **2** | 9 | integration/native-progress 8, unit/native-progress 1 |
| 145 | `paint.ts` | a text keeps the web's list of faces | **2** | 9 | integration/native-progress 8, unit/native-progress 1 |
| 146 | `paint.ts` | an empty weight is handed on | **1** | 1 | unit/native-progress 1 |
| 147 | `paint.ts` | a stroke is not painted | **2** | 9 | integration/native-progress 8, unit/native-progress 1 |
| 148 | `paint.ts` | a fixed picture is clipped at its edge | **2** | 10 | integration/native-progress 8, unit/native-progress 2 |
| 149 | `paint.ts` | a fixed picture is drawn at its height's scale | **1** | 1 | unit/native-progress 1 |
| 150 | `paint.ts` | a full width picture stands on its side | **1** | 1 | unit/native-progress 1 |
| 151 | `paint.ts` | a fixed picture is not put back in place | **1** | 1 | unit/native-progress 1 |
| 152 | `paint.ts` | a fixed picture keeps the page's viewBox | **1** | 1 | unit/native-progress 1 |
| 153 | `App.tsx` | a tap on the Progress tab does not open the screen afresh | **1** | 1 | unit/native-progress 1 |
| 154 | `App.tsx` | what Progress keeps is lost at each redraw of the app | **1** | 1 | unit/native-progress 1 |
| 155 | `App.tsx` | the Progress screen is not opened anew by its tab | **1** | 1 | unit/native-progress 1 |
| 156 | `App.tsx` | the Progress tab is after Bugs | **1** | 1 | unit/native-progress 1 |
| 157 | `App.tsx` | the Progress tab opens Bugs | **1** | 1 | unit/native-progress 1 |
| 158 | `Progress.tsx` | a chip does not redraw | **1** | 1 | unit/native-progress 1 |
| 159 | `Progress.tsx` | Restore raises no toast | **1** | 1 | unit/native-progress 1 |
| 160 | `Progress.tsx` | Restore does not redraw | **1** | 1 | unit/native-progress 1 |
| 161 | `Progress.tsx` | after Delete Forever the confirmation stays | **1** | 1 | unit/native-progress 1 |
| 162 | `Progress.tsx` | Delete Forever raises no toast | **1** | 1 | unit/native-progress 1 |
| 163 | `Progress.tsx` | Cancel stands nothing down | **1** | 1 | unit/native-progress 1 |
| 164 | `Progress.tsx` | the trash arms nothing | **1** | 1 | unit/native-progress 1 |
| 165 | `Progress.tsx` | Delete Forever is wired to Cancel | **1** | 1 | unit/native-progress 1 |
| 166 | `Progress.tsx` | Restore is wired to the delete | **1** | 1 | unit/native-progress 1 |
| 167 | `Progress.tsx` | the trash deletes at once | **1** | 1 | unit/native-progress 1 |
| 168 | `Progress.tsx` | a chip is wired to nothing | **1** | 1 | unit/native-progress 1 |
| 169 | `Progress.tsx` | the screen opens as it was left | **1** | 1 | unit/native-progress 1 |
| 170 | `Progress.tsx` | a draw keeps the last body | **1** | 1 | unit/native-progress 1 |
| 171 | `Progress.tsx` | every journal week opens unfolded | **1** | 1 | unit/native-progress 1 |
| 172 | `Progress.tsx` | the estimator opens unfolded | **1** | 1 | unit/native-progress 1 |
| 173 | `Progress.tsx` | the estimator opens on Deadlift whatever was picked | **1** | 1 | unit/native-progress 1 |
| 174 | `Progress.tsx` | a picked lift is forgotten at the next visit | **1** | 1 | unit/native-progress 1 |
| 175 | `Progress.tsx` | the estimate is drawn from numbers of its own | **1** | 1 | unit/native-progress 1 |
| 176 | `Progress.tsx` | the estimator is said in pounds whatever the program | **1** | 1 | unit/native-progress 1 |
| 177 | `Progress.tsx` | every chart in the view is handed to a drawer | **1** | 1 | unit/native-progress 1 |
| 178 | `Progress.tsx` | the confirmation always warns of the loads | **1** | 1 | unit/native-progress 1 |
| 179 | `Progress.tsx` | the first empty sentence is the second's | **1** | 1 | unit/native-progress 1 |
| 180 | `Progress.tsx` | the confirmation names no program | **1** | 1 | unit/native-progress 1 |
| 181 | `Progress.tsx` | the empty state reads Nothing yet | **1** | 1 | unit/native-progress 1 |
| 182 | `Progress.tsx` | the archived bar loses its words | **1** | 1 | unit/native-progress 1 |
| 183 | `Progress.tsx` | Restore reads Bring back | **1** | 1 | unit/native-progress 1 |
| 184 | `Progress.tsx` | Delete Forever reads Delete | **1** | 1 | unit/native-progress 1 |
| 185 | `Progress.tsx` | the journal's head reads Journal | **1** | 1 | unit/native-progress 1 |
| 186 | `Progress.tsx` | a journal entry is headed by its week | **1** | 1 | unit/native-progress 1 |
| 187 | `Progress.tsx` | a journal entry's effort is drawn muted | **1** | 1 | unit/native-progress 1 |
| 188 | `Progress.tsx` | a journal entry's note is drawn as markup | **1** | 1 | unit/native-progress 1 |
| 189 | `Progress.tsx` | a journal week shows no count | **1** | 1 | unit/native-progress 1 |
| 190 | `Progress.tsx` | a folded journal week still shows its entries | **1** | 1 | unit/native-progress 1 |
| 191 | `Progress.tsx` | the estimator's say is cut | **1** | 1 | unit/native-progress 1 |
| 192 | `Progress.tsx` | the estimator's head reads Estimator | **1** | 1 | unit/native-progress 1 |
| 193 | `ChartCards.tsx` | a main lift is headed by its opening set | **1** | 1 | unit/native-progress 1 |
| 194 | `ChartCards.tsx` | a main lift's gain is not drawn | **1** | 2 | unit/native-progress 2 |
| 195 | `ChartCards.tsx` | a main lift draws no line | **1** | 2 | unit/native-progress 2 |
| 196 | `ChartCards.tsx` | the ladder's head counts its rows | **1** | 1 | unit/native-progress 1 |
| 197 | `ChartCards.tsx` | the ladder's head is always live | **1** | 1 | unit/native-progress 1 |
| 198 | `ChartCards.tsx` | every ladder row reads Add weight | **1** | 1 | unit/native-progress 1 |
| 199 | `ChartCards.tsx` | a ladder row draws no track | **1** | 2 | unit/native-progress 2 |
| 200 | `ChartCards.tsx` | a ladder row shows no detail | **1** | 1 | unit/native-progress 1 |
| 201 | `ChartCards.tsx` | the steps up are always plural | **1** | 1 | unit/native-progress 1 |
| 202 | `ChartCards.tsx` | an other row shows no load | **1** | 1 | unit/native-progress 1 |
| 203 | `ChartCards.tsx` | the dot chart's total is its peak | **1** | 1 | unit/native-progress 1 |
| 204 | `ChartCards.tsx` | the dot chart draws no line | **1** | 1 | unit/native-progress 1 |
| 205 | `ChartCards.tsx` | the dot chart draws no week labels | **1** | 1 | unit/native-progress 1 |
| 206 | `ChartCards.tsx` | a card draws no footer | **1** | 1 | unit/native-progress 1 |
| 207 | `ChartCards.tsx` | a card's title is drawn as markup | **1** | 1 | unit/native-progress 1 |
| 208 | `SvgPicture.tsx` | a picture keeps the page's viewBox | **1** | 1 | unit/native-progress 1 |
| 209 | `SvgPicture.tsx` | a fixed picture is not put back in place on the screen | **1** | 1 | unit/native-progress 1 |
| 210 | `SvgPicture.tsx` | a circle is drawn as a line | **1** | 1 | unit/native-progress 1 |
| 211 | `SvgPicture.tsx` | a picture's words are not drawn | **1** | 1 | unit/native-progress 1 |
| 212 | `SvgPicture.tsx` | a picture is painted in the web's own words | **1** | 1 | unit/native-progress 1 |
| 213 | `progress-readers.ts` | the lifts with no load are in the store's order | **1** | 1 | unit/native-progress 1 |
| 214 | `card-markup.ts` | run card: an entity is drawn as the page wrote it | **1** | 1 | unit/native-progress 1 |
| 215 | `card-markup.ts` | run card: any face named is the display face | **1** | 1 | unit/native-progress 1 |
| 216 | `card-markup.ts` | run card: a size in any unit is read as points | **1** | 1 | unit/native-progress 1 |
| 217 | `card-markup.ts` | run card: a block's weight is not read | **2** | 4 | integration/native-progress 3, unit/native-progress 1 |
| 218 | `card-markup.ts` | run card: a tracking in points is read as a share of the size | **1** | 1 | unit/native-progress 1 |
| 219 | `card-markup.ts` | run card: a block's colour is not read | **2** | 6 | integration/native-progress 3, unit/native-progress 3 |
| 220 | `card-markup.ts` | run card: a line height in points is read as a multiple | **1** | 1 | unit/native-progress 1 |
| 221 | `card-markup.ts` | run card: the room under a block is not read | **2** | 5 | integration/native-progress 3, unit/native-progress 2 |
| 222 | `card-markup.ts` | run card: a number loses its sign | **2** | 2 | integration/native-progress 1, unit/native-progress 1 |
| 223 | `card-markup.ts` | run card: a property is found with the spaces around its name | **1** | 1 | unit/native-progress 1 |
| 224 | `card-markup.ts` | run card: a value keeps the spaces around it | **1** | 1 | unit/native-progress 1 |
| 225 | `card-markup.ts` | run card: a block's size is not said | **2** | 4 | integration/native-progress 3, unit/native-progress 1 |
| 226 | `card-markup.ts` | run card: a block's weight is not said | **2** | 4 | integration/native-progress 3, unit/native-progress 1 |
| 227 | `card-markup.ts` | run card: the tracking is said in em, not in points | **2** | 4 | integration/native-progress 3, unit/native-progress 1 |
| 228 | `card-markup.ts` | run card: a tracking is said where no size is | **1** | 1 | unit/native-progress 1 |
| 229 | `card-markup.ts` | run card: a block's colour is said as the web writes it | **2** | 4 | integration/native-progress 3, unit/native-progress 1 |
| 230 | `card-markup.ts` | run card: the line height is said as a multiple, not in points | **2** | 4 | integration/native-progress 3, unit/native-progress 1 |
| 231 | `card-markup.ts` | run card: a line height is said where no size is | **1** | 1 | unit/native-progress 1 |
| 232 | `card-markup.ts` | run card: no room under a block is left unsaid | **1** | 1 | unit/native-progress 1 |
| 233 | `card-markup.ts` | run card: the room under a block is not said | **2** | 4 | integration/native-progress 3, unit/native-progress 1 |
| 234 | `card-markup.ts` | run card: a bold run is read as plain words | **2** | 10 | integration/native-progress 8, unit/native-progress 2 |
| 235 | `card-markup.ts` | run card: a bold run loses its colour | **2** | 10 | integration/native-progress 8, unit/native-progress 2 |
| 236 | `card-markup.ts` | run card: the words before a bold run are lost | **2** | 11 | integration/native-progress 8, unit/native-progress 3 |
| 237 | `card-markup.ts` | run card: the words after the last bold run are lost | **2** | 12 | integration/native-progress 8, unit/native-progress 4 |
| 238 | `card-markup.ts` | run card: a run with no words is kept | **2** | 7 | unit/native-progress 4, integration/native-progress 3 |
| 239 | `card-markup.ts` | run card: another tag is drawn as the page wrote it | **1** | 1 | unit/native-progress 1 |
| 240 | `card-markup.ts` | run card: a block with no words is kept | **2** | 7 | integration/native-progress 3, unit/native-progress 4 |
| 241 | `card-markup.ts` | run card: a block loses its style | **2** | 6 | integration/native-progress 3, unit/native-progress 3 |
| 242 | `card-markup.ts` | run card: the words between blocks are lost | **1** | 1 | unit/native-progress 1 |
| 243 | `card-markup.ts` | run card: the words after the last block are lost | **2** | 9 | integration/native-progress 8, unit/native-progress 1 |
| 244 | `paint.ts` | run card: a text that names no face is left to the phone's | **2** | 4 | integration/native-progress 3, unit/native-progress 1 |
| 245 | `paint.ts` | run card: every element takes a face | **2** | 10 | integration/native-progress 8, unit/native-progress 2 |
| 246 | `paint.ts` | run card: a full width picture is clipped at its edge | **2** | 9 | integration/native-progress 8, unit/native-progress 1 |
| 247 | `paint.ts` | run card: a full width picture is not put back in place | **1** | 1 | unit/native-progress 1 |
| 248 | `paint.ts` | run card: a full width picture is its card wide with its edges grown | **1** | 1 | unit/native-progress 1 |
| 249 | `SvgPicture.tsx` | run card: a full width picture takes no room past its edge on the screen | **1** | 1 | unit/native-progress 1 |
| 250 | `ChartCards.tsx` | run card: the title is in the ink whatever the card | **1** | 1 | unit/native-progress 1 |
| 251 | `ChartCards.tsx` | run card: every title stands twelve over what follows | **1** | 1 | unit/native-progress 1 |
| 252 | `ChartCards.tsx` | run card: a card draws no head | **1** | 1 | unit/native-progress 1 |
| 253 | `ChartCards.tsx` | run card: a card draws no picture | **1** | 1 | unit/native-progress 1 |
| 254 | `ChartCards.tsx` | run card: a card draws no body | **1** | 1 | unit/native-progress 1 |
| 255 | `ChartCards.tsx` | run card: a card with a spec's footer draws none | **1** | 1 | unit/native-progress 1 |
| 256 | `ChartCards.tsx` | run card: the picture is drawn under the body | **1** | 1 | unit/native-progress 1 |
| 257 | `ChartCards.tsx` | run card: the head is drawn under the picture | **1** | 1 | unit/native-progress 1 |
| 258 | `ChartCards.tsx` | run card: a block is drawn in the type of where it stands | **1** | 1 | unit/native-progress 1 |
| 259 | `ChartCards.tsx` | run card: a bold run is drawn as plain words | **1** | 1 | unit/native-progress 1 |
| 260 | `ChartCards.tsx` | run card: a bold run is in the colour of the words around it | **1** | 1 | unit/native-progress 1 |
| 261 | `ChartCards.tsx` | run card: the footer has no type of its own | **1** | 1 | unit/native-progress 1 |
| 262 | `ChartCards.tsx` | run card: the card stands on no ground | **1** | 1 | unit/native-progress 1 |
| 263 | `Progress.tsx` | run card: a run card is handed to the ledger's drawer | **1** | 1 | unit/native-progress 1 |
| 264 | `card-markup.ts` | run card: reading a card's markup writes a key | **2** | 13 | integration/native-progress 8, unit/native-progress 5 |
| 265 | `ChartCards.tsx` | run card: drawing a card writes a key | **1** | 1 | unit/native-progress 1 |

- Breaks made: **265** of 265. Let through by the fast files, so swept: 0. Let through by every file: **0**.
