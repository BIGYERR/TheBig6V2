# The Expo app's rest day sheet and mile nudge: a break per rule, and the test files each turns red

Written by `node tests/measure/native-rest-sheet_breaks.mjs` (read-only here; each break is made in a copy of the tree and put back).

- The fast files, run on each break: `unit/native-rest-sheet.test.ts`, `unit/native-look.test.ts`, `integration/native-rest-sheet.test.ts`. Unbroken, they hold 96 tests and all pass.
- The sweep, run only on a break the fast files let through: `sweeps/native-rest-sheet.test.ts` (11 tests, all passing unbroken).

| # | File | The rule broken | Files red | Tests red | Which |
|---|---|---|---|---|---|
| 1 | `rest-sheet-model.ts` | a record needs a time and a distance | **2** | 9 | unit/native-rest-sheet 8, integration/native-rest-sheet 1 |
| 2 | `rest-sheet-model.ts` | the face is seeded with no time | **2** | 4 | integration/native-rest-sheet 1, unit/native-rest-sheet 3 |
| 3 | `rest-sheet-model.ts` | the face shows a walk's distance | **1** | 1 | unit/native-rest-sheet 1 |
| 4 | `rest-sheet-model.ts` | the face is seeded with no effort | **2** | 4 | integration/native-rest-sheet 1, unit/native-rest-sheet 3 |
| 5 | `rest-sheet-model.ts` | an effort stored empty reads as zero | **1** | 1 | unit/native-rest-sheet 1 |
| 6 | `rest-sheet-model.ts` | a number below zero counts | **1** | 1 | unit/native-rest-sheet 1 |
| 7 | `rest-sheet-model.ts` | the face is the record whatever its time | **2** | 4 | integration/native-rest-sheet 1, unit/native-rest-sheet 3 |
| 8 | `rest-sheet-model.ts` | the face is the record whatever its distance | **1** | 1 | unit/native-rest-sheet 1 |
| 9 | `rest-sheet-model.ts` | a walk compares its distance | **1** | 1 | unit/native-rest-sheet 1 |
| 10 | `rest-sheet-model.ts` | the face is the record whatever its effort | **1** | 1 | unit/native-rest-sheet 1 |
| 11 | `rest-sheet-model.ts` | a day before the start takes a jog | **1** | 1 | unit/native-rest-sheet 1 |
| 12 | `rest-sheet-model.ts` | a day before the start takes a move | **1** | 1 | unit/native-rest-sheet 1 |
| 13 | `rest-sheet-model.ts` | a training day with no jog opens | **2** | 2 | integration/native-rest-sheet 1, unit/native-rest-sheet 1 |
| 14 | `rest-sheet-model.ts` | a training day never opens, jog or none | **2** | 3 | integration/native-rest-sheet 1, unit/native-rest-sheet 2 |
| 15 | `rest-sheet-model.ts` | a rest day that has not come takes a jog | **2** | 4 | integration/native-rest-sheet 1, unit/native-rest-sheet 3 |
| 16 | `rest-sheet-model.ts` | today's rest day takes no jog | **1** | 2 | unit/native-rest-sheet 2 |
| 17 | `rest-sheet-model.ts` | a jog's day is counted a week late | **2** | 9 | integration/native-rest-sheet 3, unit/native-rest-sheet 6 |
| 18 | `rest-sheet-model.ts` | a rest day that has not come takes a move | **1** | 1 | unit/native-rest-sheet 1 |
| 19 | `rest-sheet-model.ts` | today's rest day takes no move | **1** | 1 | unit/native-rest-sheet 1 |
| 20 | `rest-sheet-model.ts` | a move's day is counted a week late | **2** | 5 | integration/native-rest-sheet 3, unit/native-rest-sheet 2 |
| 21 | `rest-sheet-model.ts` | a move lands on a training day | **2** | 3 | integration/native-rest-sheet 1, unit/native-rest-sheet 2 |
| 22 | `rest-sheet-model.ts` | a move lands on a day a session left | **2** | 2 | integration/native-rest-sheet 1, unit/native-rest-sheet 1 |
| 23 | `rest-sheet-model.ts` | with no program the door says the day has not come | **2** | 2 | integration/native-rest-sheet 1, unit/native-rest-sheet 1 |
| 24 | `rest-sheet-model.ts` | a day that has not come opens | **2** | 3 | integration/native-rest-sheet 2, unit/native-rest-sheet 1 |
| 25 | `rest-sheet-model.ts` | a day that takes no move opens on Move | **2** | 3 | integration/native-rest-sheet 2, unit/native-rest-sheet 1 |
| 26 | `rest-sheet-model.ts` | Move is opened whatever was asked | **2** | 2 | integration/native-rest-sheet 1, unit/native-rest-sheet 1 |
| 27 | `rest-sheet-model.ts` | the sport is the program's first whatever holds a record | **2** | 3 | integration/native-rest-sheet 1, unit/native-rest-sheet 2 |
| 28 | `rest-sheet-model.ts` | an emptied record names the sport | **1** | 1 | unit/native-rest-sheet 1 |
| 29 | `rest-sheet-model.ts` | with no sport the face is a walk | **1** | 1 | unit/native-rest-sheet 1 |
| 30 | `rest-sheet-model.ts` | the sheet opens with a face not seeded | **2** | 2 | integration/native-rest-sheet 1, unit/native-rest-sheet 1 |
| 31 | `rest-sheet-model.ts` | the sheet opens with Clear armed | **2** | 5 | unit/native-rest-sheet 2, integration/native-rest-sheet 3 |
| 32 | `rest-sheet-model.ts` | a rest day is offered as a session | **2** | 11 | unit/native-rest-sheet 8, integration/native-rest-sheet 3 |
| 33 | `rest-sheet-model.ts` | a day a session moved onto is offered again | **1** | 1 | unit/native-rest-sheet 1 |
| 34 | `rest-sheet-model.ts` | a day marked done is offered | **2** | 3 | integration/native-rest-sheet 1, unit/native-rest-sheet 2 |
| 35 | `rest-sheet-model.ts` | a day with an effort logged is offered | **1** | 1 | unit/native-rest-sheet 1 |
| 36 | `rest-sheet-model.ts` | a day with a note is offered | **1** | 1 | unit/native-rest-sheet 1 |
| 37 | `rest-sheet-model.ts` | a swapped day is offered | **1** | 1 | unit/native-rest-sheet 1 |
| 38 | `rest-sheet-model.ts` | a day with parked numbers is offered | **1** | 1 | unit/native-rest-sheet 1 |
| 39 | `rest-sheet-model.ts` | a day with a logged field is offered | **1** | 1 | unit/native-rest-sheet 1 |
| 40 | `rest-sheet-model.ts` | only a run's fields count as logged | **1** | 1 | unit/native-rest-sheet 1 |
| 41 | `rest-sheet-model.ts` | a session with no title is not named Training | **1** | 1 | unit/native-rest-sheet 1 |
| 42 | `rest-sheet-model.ts` | a session's day is printed as its key | **2** | 5 | integration/native-rest-sheet 3, unit/native-rest-sheet 2 |
| 43 | `rest-sheet-model.ts` | one stray move makes a region day | **1** | 1 | unit/native-rest-sheet 1 |
| 44 | `rest-sheet-model.ts` | a rest day has a region | **1** | 1 | unit/native-rest-sheet 1 |
| 45 | `rest-sheet-model.ts` | a tie goes to the last region met | **1** | 1 | unit/native-rest-sheet 1 |
| 46 | `rest-sheet-model.ts` | the day before is not read | **2** | 4 | integration/native-rest-sheet 2, unit/native-rest-sheet 2 |
| 47 | `rest-sheet-model.ts` | the day after is not read | **2** | 3 | integration/native-rest-sheet 1, unit/native-rest-sheet 2 |
| 48 | `rest-sheet-model.ts` | a neighbour of another region collides | **2** | 5 | integration/native-rest-sheet 2, unit/native-rest-sheet 3 |
| 49 | `rest-sheet-model.ts` | a neighbour with no title is not named | **1** | 1 | unit/native-rest-sheet 1 |
| 50 | `rest-sheet-model.ts` | a picked row is not held | **2** | 4 | integration/native-rest-sheet 3, unit/native-rest-sheet 1 |
| 51 | `rest-sheet-model.ts` | Log cardio instead stays on Move | **2** | 2 | integration/native-rest-sheet 1, unit/native-rest-sheet 1 |
| 52 | `rest-sheet-model.ts` | a chip keeps the last sport's face | **2** | 2 | integration/native-rest-sheet 1, unit/native-rest-sheet 1 |
| 53 | `rest-sheet-model.ts` | a chip leaves Clear armed | **2** | 2 | integration/native-rest-sheet 1, unit/native-rest-sheet 1 |
| 54 | `rest-sheet-model.ts` | the selected effort stays on a second tap | **2** | 2 | integration/native-rest-sheet 1, unit/native-rest-sheet 1 |
| 55 | `rest-sheet-model.ts` | a wheel's time is dropped | **2** | 2 | integration/native-rest-sheet 1, unit/native-rest-sheet 1 |
| 56 | `rest-sheet-model.ts` | a wheel's distance lands on the time | **2** | 2 | unit/native-rest-sheet 1, integration/native-rest-sheet 1 |
| 57 | `rest-sheet-model.ts` | Move's line over its name | **2** | 4 | integration/native-rest-sheet 3, unit/native-rest-sheet 1 |
| 58 | `rest-sheet-model.ts` | Move's name | **2** | 4 | integration/native-rest-sheet 3, unit/native-rest-sheet 1 |
| 59 | `rest-sheet-model.ts` | Move's sentence | **2** | 4 | integration/native-rest-sheet 3, unit/native-rest-sheet 1 |
| 60 | `rest-sheet-model.ts` | Nothing left to move, its name | **2** | 2 | integration/native-rest-sheet 1, unit/native-rest-sheet 1 |
| 61 | `rest-sheet-model.ts` | Nothing left to move, its words | **2** | 2 | integration/native-rest-sheet 1, unit/native-rest-sheet 1 |
| 62 | `rest-sheet-model.ts` | Log cardio instead, its words | **2** | 2 | integration/native-rest-sheet 1, unit/native-rest-sheet 1 |
| 63 | `rest-sheet-model.ts` | nothing left to move is drawn with sessions left | **2** | 2 | integration/native-rest-sheet 1, unit/native-rest-sheet 1 |
| 64 | `rest-sheet-model.ts` | Already logged here is not drawn | **2** | 2 | integration/native-rest-sheet 1, unit/native-rest-sheet 1 |
| 65 | `rest-sheet-model.ts` | Already logged here, its name | **2** | 2 | integration/native-rest-sheet 1, unit/native-rest-sheet 1 |
| 66 | `rest-sheet-model.ts` | a jog's line keeps its logged | **2** | 2 | integration/native-rest-sheet 1, unit/native-rest-sheet 1 |
| 67 | `rest-sheet-model.ts` | Already logged here, its sentence | **2** | 2 | integration/native-rest-sheet 1, unit/native-rest-sheet 1 |
| 68 | `rest-sheet-model.ts` | the rows' label | **2** | 4 | integration/native-rest-sheet 3, unit/native-rest-sheet 1 |
| 69 | `rest-sheet-model.ts` | a row's second line | **2** | 4 | integration/native-rest-sheet 3, unit/native-rest-sheet 1 |
| 70 | `rest-sheet-model.ts` | no row is marked picked | **2** | 4 | integration/native-rest-sheet 3, unit/native-rest-sheet 1 |
| 71 | `rest-sheet-model.ts` | the warning is never drawn | **2** | 3 | integration/native-rest-sheet 2, unit/native-rest-sheet 1 |
| 72 | `rest-sheet-model.ts` | the warning names one neighbour of two | **2** | 2 | integration/native-rest-sheet 1, unit/native-rest-sheet 1 |
| 73 | `rest-sheet-model.ts` | the warning's name | **2** | 3 | integration/native-rest-sheet 2, unit/native-rest-sheet 1 |
| 74 | `rest-sheet-model.ts` | the warning's words | **2** | 3 | integration/native-rest-sheet 2, unit/native-rest-sheet 1 |
| 75 | `rest-sheet-model.ts` | the warning reads the rest day as the session | **2** | 3 | integration/native-rest-sheet 2, unit/native-rest-sheet 1 |
| 76 | `rest-sheet-model.ts` | Move it here is drawn before a pick | **2** | 4 | integration/native-rest-sheet 3, unit/native-rest-sheet 1 |
| 77 | `rest-sheet-model.ts` | Move it here, its words | **2** | 4 | integration/native-rest-sheet 3, unit/native-rest-sheet 1 |
| 78 | `rest-sheet-model.ts` | Walk is not offered | **2** | 3 | integration/native-rest-sheet 2, unit/native-rest-sheet 1 |
| 79 | `rest-sheet-model.ts` | a record's sport has no chip | **2** | 2 | integration/native-rest-sheet 1, unit/native-rest-sheet 1 |
| 80 | `rest-sheet-model.ts` | a record's chip stands after Walk | **2** | 2 | unit/native-rest-sheet 1, integration/native-rest-sheet 1 |
| 81 | `rest-sheet-model.ts` | no chip carries a check | **2** | 2 | integration/native-rest-sheet 1, unit/native-rest-sheet 1 |
| 82 | `rest-sheet-model.ts` | a check on a chip whose record is emptied | **1** | 1 | unit/native-rest-sheet 1 |
| 83 | `rest-sheet-model.ts` | no chip is marked selected | **2** | 3 | integration/native-rest-sheet 2, unit/native-rest-sheet 1 |
| 84 | `rest-sheet-model.ts` | the bike's chip | **1** | 1 | unit/native-rest-sheet 1 |
| 85 | `rest-sheet-model.ts` | the 9 row reads RPE 9 | **2** | 3 | integration/native-rest-sheet 2, unit/native-rest-sheet 1 |
| 86 | `rest-sheet-model.ts` | an effort's name | **2** | 3 | integration/native-rest-sheet 2, unit/native-rest-sheet 1 |
| 87 | `rest-sheet-model.ts` | an effort's words | **2** | 3 | integration/native-rest-sheet 2, unit/native-rest-sheet 1 |
| 88 | `rest-sheet-model.ts` | no effort is marked selected | **2** | 2 | integration/native-rest-sheet 1, unit/native-rest-sheet 1 |
| 89 | `rest-sheet-model.ts` | a bike has no miles wheel | **1** | 1 | unit/native-rest-sheet 1 |
| 90 | `rest-sheet-model.ts` | a swim has no box | **1** | 1 | unit/native-rest-sheet 1 |
| 91 | `rest-sheet-model.ts` | the row's box is labelled yards | **2** | 2 | integration/native-rest-sheet 1, unit/native-rest-sheet 1 |
| 92 | `rest-sheet-model.ts` | the row's box asks for yards | **2** | 2 | unit/native-rest-sheet 1, integration/native-rest-sheet 1 |
| 93 | `rest-sheet-model.ts` | the row's box steps by 25 | **2** | 2 | integration/native-rest-sheet 1, unit/native-rest-sheet 1 |
| 94 | `rest-sheet-model.ts` | the box does not show the face | **2** | 2 | integration/native-rest-sheet 1, unit/native-rest-sheet 1 |
| 95 | `rest-sheet-model.ts` | the miles wheel's label | **2** | 3 | integration/native-rest-sheet 2, unit/native-rest-sheet 1 |
| 96 | `rest-sheet-model.ts` | the time wheel is a miles wheel | **2** | 3 | integration/native-rest-sheet 2, unit/native-rest-sheet 1 |
| 97 | `rest-sheet-model.ts` | the time wheel does not show the face | **2** | 2 | integration/native-rest-sheet 1, unit/native-rest-sheet 1 |
| 98 | `rest-sheet-model.ts` | the miles wheel writes to the time | **2** | 3 | integration/native-rest-sheet 2, unit/native-rest-sheet 1 |
| 99 | `rest-sheet-model.ts` | Noted from RPE 7 | **2** | 2 | integration/native-rest-sheet 1, unit/native-rest-sheet 1 |
| 100 | `rest-sheet-model.ts` | Noted, its name | **2** | 2 | integration/native-rest-sheet 1, unit/native-rest-sheet 1 |
| 101 | `rest-sheet-model.ts` | Noted, its words | **2** | 2 | integration/native-rest-sheet 1, unit/native-rest-sheet 1 |
| 102 | `rest-sheet-model.ts` | Log cardio's line over its name | **2** | 3 | integration/native-rest-sheet 2, unit/native-rest-sheet 1 |
| 103 | `rest-sheet-model.ts` | the name with no record | **2** | 3 | integration/native-rest-sheet 2, unit/native-rest-sheet 1 |
| 104 | `rest-sheet-model.ts` | the name with a record | **2** | 2 | unit/native-rest-sheet 1, integration/native-rest-sheet 1 |
| 105 | `rest-sheet-model.ts` | the name is the record's whatever the day holds | **2** | 3 | integration/native-rest-sheet 2, unit/native-rest-sheet 1 |
| 106 | `rest-sheet-model.ts` | the sentence with a record | **2** | 2 | integration/native-rest-sheet 1, unit/native-rest-sheet 1 |
| 107 | `rest-sheet-model.ts` | the sentence with no record | **2** | 3 | integration/native-rest-sheet 2, unit/native-rest-sheet 1 |
| 108 | `rest-sheet-model.ts` | the chips' label | **2** | 3 | integration/native-rest-sheet 2, unit/native-rest-sheet 1 |
| 109 | `rest-sheet-model.ts` | the time's label | **2** | 3 | integration/native-rest-sheet 2, unit/native-rest-sheet 1 |
| 110 | `rest-sheet-model.ts` | the efforts' label | **2** | 3 | integration/native-rest-sheet 2, unit/native-rest-sheet 1 |
| 111 | `rest-sheet-model.ts` | the button reads Logged with any record | **2** | 2 | integration/native-rest-sheet 1, unit/native-rest-sheet 1 |
| 112 | `rest-sheet-model.ts` | the button never reads Logged | **2** | 2 | integration/native-rest-sheet 1, unit/native-rest-sheet 1 |
| 113 | `rest-sheet-model.ts` | Clear is drawn with no record | **2** | 3 | integration/native-rest-sheet 2, unit/native-rest-sheet 1 |
| 114 | `rest-sheet-model.ts` | Clear never reads armed | **2** | 2 | integration/native-rest-sheet 1, unit/native-rest-sheet 1 |
| 115 | `rest-sheet-model.ts` | Clear names the sport, not the jog | **1** | 1 | unit/native-rest-sheet 1 |
| 116 | `rest-sheet-model.ts` | Log cardio is drawn for Move | **2** | 4 | integration/native-rest-sheet 3, unit/native-rest-sheet 1 |
| 117 | `rest-sheet-model.ts` | the toast with no program | **2** | 3 | integration/native-rest-sheet 1, unit/native-rest-sheet 2 |
| 118 | `rest-sheet-model.ts` | the toast on a day that has not come | **2** | 4 | integration/native-rest-sheet 2, unit/native-rest-sheet 2 |
| 119 | `rest-sheet-model.ts` | the toast with no row picked | **2** | 3 | integration/native-rest-sheet 1, unit/native-rest-sheet 2 |
| 120 | `rest-sheet-model.ts` | the toast on a record rolled to zero | **2** | 3 | integration/native-rest-sheet 1, unit/native-rest-sheet 2 |
| 121 | `rest-sheet-model.ts` | the toast on an empty walk | **2** | 3 | integration/native-rest-sheet 1, unit/native-rest-sheet 2 |
| 122 | `rest-sheet-model.ts` | the toast on an empty face | **2** | 3 | integration/native-rest-sheet 1, unit/native-rest-sheet 2 |
| 123 | `rest-writes.ts` | a move with no row picked is made | **2** | 2 | integration/native-rest-sheet 1, unit/native-rest-sheet 1 |
| 124 | `rest-writes.ts` | the move is stored under the day it came from | **2** | 4 | integration/native-rest-sheet 2, unit/native-rest-sheet 2 |
| 125 | `rest-writes.ts` | the move carries no stamp | **2** | 4 | unit/native-rest-sheet 2, integration/native-rest-sheet 2 |
| 126 | `rest-writes.ts` | the move is not stored | **2** | 6 | integration/native-rest-sheet 2, unit/native-rest-sheet 4 |
| 127 | `rest-writes.ts` | earlier moves are forgotten | **1** | 1 | unit/native-rest-sheet 1 |
| 128 | `rest-writes.ts` | a moves key that does not read stops the move | **1** | 1 | unit/native-rest-sheet 1 |
| 129 | `rest-writes.ts` | the grid in hand is not moved | **2** | 3 | integration/native-rest-sheet 2, unit/native-rest-sheet 1 |
| 130 | `rest-writes.ts` | the grid is not stored | **2** | 4 | integration/native-rest-sheet 2, unit/native-rest-sheet 2 |
| 131 | `rest-writes.ts` | the grid is stored on the list's first program | **1** | 2 | unit/native-rest-sheet 2 |
| 132 | `rest-writes.ts` | the moved toast names the day moved onto | **2** | 3 | integration/native-rest-sheet 2, unit/native-rest-sheet 1 |
| 133 | `rest-writes.ts` | the moved toast's words | **2** | 3 | integration/native-rest-sheet 2, unit/native-rest-sheet 1 |
| 134 | `rest-writes.ts` | a move leaves the sheet open | **2** | 4 | integration/native-rest-sheet 2, unit/native-rest-sheet 2 |
| 135 | `rest-writes.ts` | Logged ✓ unchanged writes again | **2** | 2 | integration/native-rest-sheet 1, unit/native-rest-sheet 1 |
| 136 | `rest-writes.ts` | Logged ✓ unchanged leaves the sheet open | **2** | 2 | integration/native-rest-sheet 1, unit/native-rest-sheet 1 |
| 137 | `rest-writes.ts` | a walk stores its distance | **1** | 2 | unit/native-rest-sheet 2 |
| 138 | `rest-writes.ts` | an empty face is logged | **2** | 2 | integration/native-rest-sheet 1, unit/native-rest-sheet 1 |
| 139 | `rest-writes.ts` | a distance alone is refused | **2** | 2 | integration/native-rest-sheet 1, unit/native-rest-sheet 1 |
| 140 | `rest-writes.ts` | a record rolled to zero says to add a time | **2** | 2 | integration/native-rest-sheet 1, unit/native-rest-sheet 1 |
| 141 | `rest-writes.ts` | an empty walk is told a time or a distance | **2** | 2 | integration/native-rest-sheet 1, unit/native-rest-sheet 1 |
| 142 | `rest-writes.ts` | a refused log closes the sheet | **2** | 2 | integration/native-rest-sheet 1, unit/native-rest-sheet 1 |
| 143 | `rest-writes.ts` | the time is stored at zero | **2** | 2 | integration/native-rest-sheet 1, unit/native-rest-sheet 1 |
| 144 | `rest-writes.ts` | the time is not stored | **2** | 4 | integration/native-rest-sheet 1, unit/native-rest-sheet 3 |
| 145 | `rest-writes.ts` | the distance is not stored | **2** | 3 | integration/native-rest-sheet 1, unit/native-rest-sheet 2 |
| 146 | `rest-writes.ts` | the effort is not stored | **2** | 3 | integration/native-rest-sheet 1, unit/native-rest-sheet 2 |
| 147 | `rest-writes.ts` | another sport's record is dropped | **2** | 2 | integration/native-rest-sheet 1, unit/native-rest-sheet 1 |
| 148 | `rest-writes.ts` | the day's other fields are dropped | **2** | 2 | integration/native-rest-sheet 1, unit/native-rest-sheet 1 |
| 149 | `rest-writes.ts` | the face is merged into the record | **2** | 2 | integration/native-rest-sheet 1, unit/native-rest-sheet 1 |
| 150 | `rest-writes.ts` | the week is not stamped | **2** | 4 | integration/native-rest-sheet 1, unit/native-rest-sheet 3 |
| 151 | `rest-writes.ts` | the instant is not stamped | **2** | 5 | integration/native-rest-sheet 1, unit/native-rest-sheet 4 |
| 152 | `rest-writes.ts` | the jog is not written | **2** | 6 | integration/native-rest-sheet 1, unit/native-rest-sheet 5 |
| 153 | `rest-writes.ts` | the logged toast's words | **2** | 4 | integration/native-rest-sheet 1, unit/native-rest-sheet 3 |
| 154 | `rest-writes.ts` | a log leaves the sheet open | **2** | 3 | integration/native-rest-sheet 1, unit/native-rest-sheet 2 |
| 155 | `rest-writes.ts` | Clear removes on its first tap | **2** | 2 | unit/native-rest-sheet 1, integration/native-rest-sheet 1 |
| 156 | `rest-writes.ts` | Clear never arms | **2** | 2 | integration/native-rest-sheet 1, unit/native-rest-sheet 1 |
| 157 | `rest-writes.ts` | Clear's first tap closes the sheet | **2** | 2 | integration/native-rest-sheet 1, unit/native-rest-sheet 1 |
| 158 | `rest-writes.ts` | Clear leaves the record | **2** | 3 | integration/native-rest-sheet 1, unit/native-rest-sheet 2 |
| 159 | `rest-writes.ts` | an emptied restLog is kept | **2** | 3 | integration/native-rest-sheet 1, unit/native-rest-sheet 2 |
| 160 | `rest-writes.ts` | the day's entry is kept with only its week and stamp | **2** | 2 | integration/native-rest-sheet 1, unit/native-rest-sheet 1 |
| 161 | `rest-writes.ts` | the day's entry goes whatever else it holds | **2** | 2 | integration/native-rest-sheet 1, unit/native-rest-sheet 1 |
| 162 | `rest-writes.ts` | Clear writes with no record of that sport | **1** | 1 | unit/native-rest-sheet 1 |
| 163 | `rest-writes.ts` | the clear is not written | **2** | 4 | integration/native-rest-sheet 1, unit/native-rest-sheet 3 |
| 164 | `rest-writes.ts` | the cleared toast is lower case | **2** | 4 | integration/native-rest-sheet 1, unit/native-rest-sheet 3 |
| 165 | `rest-writes.ts` | the cleared toast names the sport, not the jog | **1** | 1 | unit/native-rest-sheet 1 |
| 166 | `rest-writes.ts` | a clear leaves the sheet open | **2** | 3 | integration/native-rest-sheet 1, unit/native-rest-sheet 2 |
| 167 | `rest-writes.ts` | a clear leaves the draft armed | **1** | 2 | unit/native-rest-sheet 2 |
| 168 | `nudge-screen.ts` | the wait is not 700 ms | **1** | 1 | unit/native-rest-sheet 1 |
| 169 | `nudge-screen.ts` | the judge reads no frozen day | **1** | 1 | integration/native-rest-sheet 1 |
| 170 | `nudge-screen.ts` | the judge reads no log | **1** | 1 | integration/native-rest-sheet 1 |
| 171 | `nudge-screen.ts` | the mile judged against is a minute off | **1** | 1 | integration/native-rest-sheet 1 |
| 172 | `nudge-screen.ts` | the week is the first whatever the date | **1** | 1 | integration/native-rest-sheet 1 |
| 173 | `nudge-screen.ts` | the program's length is not read | **1** | 1 | integration/native-rest-sheet 1 |
| 174 | `nudge-screen.ts` | a dismissal's record is not read | **1** | 1 | integration/native-rest-sheet 1 |
| 175 | `nudge-screen.ts` | the implied mile is read off the marathon column | **1** | 1 | integration/native-rest-sheet 1 |
| 176 | `nudge-screen.ts` | no offer is handed on | **1** | 1 | integration/native-rest-sheet 1 |
| 177 | `nudge-screen.ts` | a program with no run is judged | **1** | 1 | unit/native-rest-sheet 1 |
| 178 | `nudge-screen.ts` | the record names one card | **2** | 2 | integration/native-rest-sheet 1, unit/native-rest-sheet 1 |
| 179 | `nudge-screen.ts` | the record holds the offer, not the mile judged against | **2** | 2 | integration/native-rest-sheet 1, unit/native-rest-sheet 1 |
| 180 | `nudge-screen.ts` | the record is not stored | **2** | 3 | integration/native-rest-sheet 1, unit/native-rest-sheet 2 |
| 181 | `nudge-screen.ts` | the pencil opens on the stored mile | **2** | 2 | integration/native-rest-sheet 1, unit/native-rest-sheet 1 |
| 182 | `nudge-screen.ts` | the pencil holds the mile judged against | **2** | 2 | integration/native-rest-sheet 1, unit/native-rest-sheet 1 |
| 183 | `nudge-screen.ts` | the lock is given the offer's fields | **1** | 1 | unit/native-rest-sheet 1 |
| 184 | `mile-nudge-model.ts` | the nudge's model is not today's file | **2** | 2 | integration/native-rest-sheet 1, unit/native-rest-sheet 1 |
| 185 | `RestSheet.tsx` | a closing tap says its toast before what is under the sheet is drawn | **1** | 1 | unit/native-rest-sheet 1 |
| 186 | `RestSheet.tsx` | what is under the sheet is not drawn again | **1** | 1 | unit/native-rest-sheet 1 |
| 187 | `RestSheet.tsx` | a refusal says nothing | **1** | 1 | unit/native-rest-sheet 1 |
| 188 | `RestSheet.tsx` | Clear's arming is not held | **1** | 1 | unit/native-rest-sheet 1 |
| 189 | `RestSheet.tsx` | Log reads the face before a wheel has rested | **1** | 1 | unit/native-rest-sheet 1 |
| 190 | `RestSheet.tsx` | an effort tap does not rest the wheels | **1** | 1 | unit/native-rest-sheet 1 |
| 191 | `RestSheet.tsx` | the wheels are not started afresh after an effort | **1** | 1 | unit/native-rest-sheet 1 |
| 192 | `RestSheet.tsx` | the wheels are not started afresh after a chip | **1** | 1 | unit/native-rest-sheet 1 |
| 193 | `RestSheet.tsx` | a wheel keeps its place across sports | **1** | 1 | unit/native-rest-sheet 1 |
| 194 | `RestSheet.tsx` | a row's tap picks nothing | **1** | 1 | unit/native-rest-sheet 1 |
| 195 | `RestSheet.tsx` | Move it here moves nothing | **1** | 1 | unit/native-rest-sheet 1 |
| 196 | `RestSheet.tsx` | Log cardio instead does nothing | **1** | 1 | unit/native-rest-sheet 1 |
| 197 | `RestSheet.tsx` | the warning is not drawn | **1** | 2 | unit/native-rest-sheet 2 |
| 198 | `RestSheet.tsx` | Already logged here is not drawn by the screen | **1** | 2 | unit/native-rest-sheet 2 |
| 199 | `RestSheet.tsx` | nothing left to move is not drawn by the screen | **1** | 2 | unit/native-rest-sheet 2 |
| 200 | `RestSheet.tsx` | Noted is not drawn by the screen | **1** | 2 | unit/native-rest-sheet 2 |
| 201 | `RestSheet.tsx` | Clear is not drawn by the screen | **1** | 1 | unit/native-rest-sheet 1 |
| 202 | `RestSheet.tsx` | Clear's tap clears nothing | **1** | 1 | unit/native-rest-sheet 1 |
| 203 | `RestSheet.tsx` | the box's keys are not held | **1** | 1 | unit/native-rest-sheet 1 |
| 204 | `RestSheet.tsx` | a wheel's rest is not held | **1** | 1 | unit/native-rest-sheet 1 |
| 205 | `RestSheet.tsx` | the miles wheel is told the time is what its field holds | **1** | 1 | unit/native-rest-sheet 1 |
| 206 | `RestSheet.tsx` | the screen draws Log cardio for Move | **1** | 1 | unit/native-rest-sheet 1 |
| 207 | `RestSheet.tsx` | a note's words are not drawn | **1** | 1 | unit/native-rest-sheet 1 |
| 208 | `RestSheet.tsx` | an effort's name is not drawn | **1** | 1 | unit/native-rest-sheet 1 |
| 209 | `RestSheet.tsx` | the sheet's pieces stand 12 apart | **1** | 1 | unit/native-look 1 |
| 210 | `RestSheet.tsx` | a row keeps the component sheet's corners | **1** | 1 | unit/native-look 1 |
| 211 | `RestSheet.tsx` | the button is not a pill | **1** | 1 | unit/native-look 1 |
| 212 | `RestSheet.tsx` | a chip is not a pill | **1** | 1 | unit/native-look 1 |
| 213 | `RestSheet.tsx` | the line over the name is 11 | **1** | 1 | unit/native-look 1 |
| 214 | `RestSheet.tsx` | the name asks for a weight the face lacks | **1** | 2 | unit/native-look 2 |
| 215 | `RestSheet.tsx` | a 13 line is iOS's own height | **1** | 1 | unit/native-look 1 |
| 216 | `MileNudge.tsx` | Keep answers as Update mile time | **1** | 1 | unit/native-rest-sheet 1 |
| 217 | `MileNudge.tsx` | the nudge's words are not drawn | **1** | 1 | unit/native-rest-sheet 1 |
| 218 | `MileNudge.tsx` | the nudge's label is not drawn | **1** | 1 | unit/native-rest-sheet 1 |
| 219 | `MileNudge.tsx` | Keep reads as Update | **1** | 1 | unit/native-rest-sheet 1 |
| 220 | `MileNudge.tsx` | the nudge moves under Reduce Motion | **1** | 1 | unit/native-rest-sheet 1 |
| 221 | `MileNudge.tsx` | the nudge rises over a second | **1** | 1 | unit/native-rest-sheet 1 |
| 222 | `MileNudge.tsx` | the nudge's name is 26 | **1** | 1 | unit/native-look 1 |
| 223 | `MileNudge.tsx` | the nudge's sheet has square corners | **1** | 1 | unit/native-look 1 |
| 224 | `MileNudge.tsx` | the nudge's scrim is the swap nudge's | **1** | 1 | unit/native-look 1 |
| 225 | `App.tsx` | a refused door says nothing | **1** | 1 | unit/native-rest-sheet 1 |
| 226 | `App.tsx` | This Week is not drawn again after the rest sheet wrote | **1** | 1 | unit/native-rest-sheet 1 |
| 227 | `App.tsx` | the session sheet under the rest sheet is not drawn again | **1** | 1 | unit/native-rest-sheet 1 |
| 228 | `App.tsx` | the rest sheet keeps the last one's face | **1** | 2 | unit/native-rest-sheet 2 |
| 229 | `App.tsx` | the rest sheet is drawn over the toast | **1** | 1 | unit/native-rest-sheet 1 |
| 230 | `App.tsx` | the nudge is not judged after a Log | **1** | 1 | unit/native-rest-sheet 1 |
| 231 | `App.tsx` | an offer is not kept for This Week | **1** | 1 | unit/native-rest-sheet 1 |
| 232 | `App.tsx` | the nudge rises at once | **1** | 1 | unit/native-rest-sheet 1 |
| 233 | `App.tsx` | the nudge rises under the session sheet | **1** | 1 | unit/native-rest-sheet 1 |
| 234 | `App.tsx` | the nudge rises on any tab | **1** | 1 | unit/native-rest-sheet 1 |
| 235 | `App.tsx` | the nudge waits for the sheet to be gone, not going | **1** | 1 | unit/native-rest-sheet 1 |
| 236 | `App.tsx` | a sheet opened in the wait does not stop the wait | **1** | 1 | unit/native-rest-sheet 1 |
| 237 | `App.tsx` | a sheet opened later still reads as going | **1** | 1 | unit/native-rest-sheet 1 |
| 238 | `App.tsx` | an offer rises twice | **1** | 1 | unit/native-rest-sheet 1 |
| 239 | `App.tsx` | an answer stores no record | **1** | 1 | unit/native-rest-sheet 1 |
| 240 | `App.tsx` | the pencil opens before the record is stored | **1** | 1 | unit/native-rest-sheet 1 |
| 241 | `App.tsx` | Keep opens the pencil | **1** | 1 | unit/native-rest-sheet 1 |
| 242 | `App.tsx` | Update mile time only closes | **1** | 1 | unit/native-rest-sheet 1 |
| 243 | `App.tsx` | the pencil's rebuilt program is not held by This Week | **1** | 1 | unit/native-rest-sheet 1 |
| 244 | `App.tsx` | the nudge is drawn over the pop-ups | **1** | 1 | unit/native-rest-sheet 1 |
| 245 | `App.tsx` | the nudge is drawn under the toast | **1** | 1 | unit/native-rest-sheet 1 |
| 246 | `ThisWeek.tsx` | Training anyway? asks for Log cardio | **1** | 1 | unit/native-rest-sheet 1 |
| 247 | `ThisWeek.tsx` | the log link asks for Move | **1** | 1 | unit/native-rest-sheet 1 |
| 248 | `ThisWeek.tsx` | Training anyway? is drawn on a day a session left | **1** | 1 | unit/native-rest-sheet 1 |
| 249 | `ThisWeek.tsx` | the rest card's links reach no sheet | **1** | 1 | unit/native-rest-sheet 1 |
| 250 | `SessionSheet.tsx` | Edit cardio asks for Move | **1** | 1 | unit/native-rest-sheet 1 |
| 251 | `SessionSheet.tsx` | the session sheet is not drawn again after the rest sheet wrote | **1** | 1 | unit/native-rest-sheet 1 |
| 252 | `SessionSheet.tsx` | the app is not told of a Log | **1** | 1 | unit/native-rest-sheet 1 |
| 253 | `SessionSheet.tsx` | the app is told of a Log before it is stored | **1** | 1 | unit/native-rest-sheet 1 |
| 254 | `SessionSheet.tsx` | the sheet does not say it is going | **1** | 1 | unit/native-rest-sheet 1 |
| 255 | `App.tsx` | This Week's links reach no sheet in the app | **1** | 1 | unit/native-rest-sheet 1 |
| 256 | `App.tsx` | the session sheet's Edit cardio reaches no sheet in the app | **1** | 1 | unit/native-rest-sheet 1 |
| 257 | `App.tsx` | an opened door draws no sheet | **1** | 1 | unit/native-rest-sheet 1 |
| 258 | `App.tsx` | what to draw again under the sheet is dropped at the door | **1** | 1 | unit/native-rest-sheet 1 |
| 259 | `App.tsx` | the sheet is handed the launch's draft, not the door's | **1** | 1 | unit/native-rest-sheet 1 |
| 260 | `App.tsx` | the nudge's pencil never closes | **1** | 1 | unit/native-rest-sheet 1 |
| 261 | `RestSheet.tsx` | Log cardio instead is drawn with sessions left | **1** | 1 | unit/native-rest-sheet 1 |
| 262 | `RestSheet.tsx` | the rows' label is drawn with nothing to move | **1** | 1 | unit/native-rest-sheet 1 |
| 263 | `RestSheet.tsx` | Move it here is drawn before a pick by the screen | **1** | 1 | unit/native-rest-sheet 1 |
| 264 | `RestSheet.tsx` | the box is drawn as a wheel | **1** | 1 | unit/native-rest-sheet 1 |
| 265 | `RestSheet.tsx` | a picked row carries no check | **1** | 2 | unit/native-rest-sheet 2 |
| 266 | `ThisWeek.tsx` | the day's cards are handed no rest link | **1** | 1 | unit/native-rest-sheet 1 |
| 267 | `Wheel.tsx` | a wheel's caption is the component sheet's 10 | **1** | 1 | unit/native-look 1 |
| 268 | `SheetFrame.tsx` | a sheet's Back is iOS's own height | **1** | 1 | unit/native-look 1 |
| 269 | `RestSheet.tsx` | the sentence under the name keeps 19.5 | **1** | 1 | unit/native-look 1 |
| 270 | `RestSheet.tsx` | the name's line keeps 26.4 | **1** | 1 | unit/native-look 1 |
| 271 | `RestSheet.tsx` | a note's words sit 0.7 low | **1** | 1 | unit/native-look 1 |
| 272 | `MileNudge.tsx` | the nudge's words keep 21.75 | **1** | 1 | unit/native-look 1 |

- Breaks made: **272** of 272. Let through by the fast files, so swept: 0. Let through by every file: **0**.
