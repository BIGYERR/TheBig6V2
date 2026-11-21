# The Expo app's Hurt? and Traveling?, its chips, its two dates, its date box and its copy button: a break per rule, and the test files each turns red

Written by `node tests/measure/native-change-sheet_breaks.mjs` (read-only here; each break is made in a copy of the tree and put back).

- The fast files, run on each break: `unit/native-change-sheet.test.ts`, `unit/native-program-list.test.ts`, `integration/native-change-sheet.test.ts`. Unbroken, they hold 134 tests and all pass.
- The sweep, run only on a break the fast files let through: `sweeps/native-change-sheet.test.ts` (14 tests, all passing unbroken).

| # | File | The rule broken | Files red | Tests red | Which |
|---|---|---|---|---|---|
| 1 | `overlay-readers.ts` | a date that does not read counts from the epoch | **1** | 1 | unit/native-change-sheet 1 |
| 2 | `overlay-readers.ts` | a day some days on is one day short | **2** | 13 | integration/native-change-sheet 5, unit/native-change-sheet 8 |
| 3 | `overlay-readers.ts` | a blank date reads as nothing | **2** | 4 | integration/native-change-sheet 3, unit/native-change-sheet 1 |
| 4 | `overlay-readers.ts` | a date carries its year | **2** | 14 | integration/native-change-sheet 6, unit/native-change-sheet 8 |
| 5 | `overlay-readers.ts` | the weekday keeps its comma | **2** | 12 | integration/native-change-sheet 5, unit/native-change-sheet 7 |
| 6 | `overlay-readers.ts` | a span counts one of its ends | **2** | 5 | integration/native-change-sheet 3, unit/native-change-sheet 2 |
| 7 | `overlay-readers.ts` | a span that does not read counts one day | **1** | 1 | unit/native-change-sheet 1 |
| 8 | `overlay-readers.ts` | the day count's word has no capital | **2** | 5 | integration/native-change-sheet 3, unit/native-change-sheet 2 |
| 9 | `overlay-readers.ts` | one day reads One days | **1** | 1 | unit/native-change-sheet 1 |
| 10 | `overlay-readers.ts` | fourteen days is a figure | **2** | 5 | integration/native-change-sheet 3, unit/native-change-sheet 2 |
| 11 | `overlay-readers.ts` | an open span is named with its weekday | **2** | 9 | integration/native-change-sheet 5, unit/native-change-sheet 4 |
| 12 | `overlay-readers.ts` | whole weeks start on a Sunday | **2** | 3 | integration/native-change-sheet 1, unit/native-change-sheet 2 |
| 13 | `overlay-readers.ts` | any span that ends on a Sunday is whole weeks | **2** | 2 | integration/native-change-sheet 1, unit/native-change-sheet 1 |
| 14 | `overlay-readers.ts` | any span that starts on a Monday is whole weeks | **1** | 1 | unit/native-change-sheet 1 |
| 15 | `overlay-readers.ts` | one whole week is named Weeks | **2** | 3 | integration/native-change-sheet 1, unit/native-change-sheet 2 |
| 16 | `overlay-readers.ts` | two whole weeks are named by the first | **2** | 2 | integration/native-change-sheet 1, unit/native-change-sheet 1 |
| 17 | `overlay-readers.ts` | one day is named as a span | **2** | 4 | integration/native-change-sheet 2, unit/native-change-sheet 2 |
| 18 | `overlay-readers.ts` | a span across two months drops the second | **2** | 4 | integration/native-change-sheet 2, unit/native-change-sheet 2 |
| 19 | `overlay-readers.ts` | a span inside a month says its month twice | **2** | 6 | integration/native-change-sheet 4, unit/native-change-sheet 2 |
| 20 | `overlay-readers.ts` | the program picks back up on the last day covered | **2** | 5 | integration/native-change-sheet 3, unit/native-change-sheet 2 |
| 21 | `overlay-readers.ts` | the program's last week is past its end | **1** | 1 | unit/native-change-sheet 1 |
| 22 | `overlay-readers.ts` | nothing runs to the end of the program | **2** | 3 | integration/native-change-sheet 1, unit/native-change-sheet 2 |
| 23 | `overlay-readers.ts` | a program with no length runs to its end | **1** | 1 | unit/native-change-sheet 1 |
| 24 | `overlay-readers.ts` | a trip is titled Trip | **2** | 8 | integration/native-change-sheet 3, unit/native-change-sheet 5 |
| 25 | `overlay-readers.ts` | an injury is titled Hurt | **2** | 10 | integration/native-change-sheet 5, unit/native-change-sheet 5 |
| 26 | `overlay-readers.ts` | Less time has no title | **1** | 2 | unit/native-change-sheet 2 |
| 27 | `overlay-readers.ts` | Suspended has no title | **1** | 3 | unit/native-change-sheet 3 |
| 28 | `overlay-readers.ts` | Room only is named Room | **2** | 5 | integration/native-change-sheet 1, unit/native-change-sheet 4 |
| 29 | `overlay-readers.ts` | Mini gym is named Hotel gym | **2** | 6 | integration/native-change-sheet 3, unit/native-change-sheet 3 |
| 30 | `overlay-readers.ts` | Full gym has no name on a chip | **1** | 2 | unit/native-change-sheet 2 |
| 31 | `overlay-readers.ts` | Home Full has no name on a chip | **1** | 2 | unit/native-change-sheet 2 |
| 32 | `overlay-readers.ts` | CrossFit Box has no name on a chip | **1** | 2 | unit/native-change-sheet 2 |
| 33 | `overlay-readers.ts` | Minimal / Travel has no name on a chip | **1** | 3 | unit/native-change-sheet 3 |
| 34 | `overlay-readers.ts` | the ✕ is called Remove | **1** | 1 | unit/native-change-sheet 1 |
| 35 | `overlay-readers.ts` | a change that ended yesterday is drawn | **2** | 3 | integration/native-change-sheet 2, unit/native-change-sheet 1 |
| 36 | `overlay-readers.ts` | a change that ends today is hidden | **1** | 2 | unit/native-change-sheet 2 |
| 37 | `overlay-readers.ts` | a change outside the program is drawn | **1** | 1 | unit/native-change-sheet 1 |
| 38 | `overlay-readers.ts` | back to normal is the last day covered | **2** | 8 | integration/native-change-sheet 5, unit/native-change-sheet 3 |
| 39 | `overlay-readers.ts` | a change with no end says nothing of it | **1** | 2 | unit/native-change-sheet 2 |
| 40 | `overlay-readers.ts` | a return week reads as an injury | **2** | 4 | integration/native-change-sheet 2, unit/native-change-sheet 2 |
| 41 | `overlay-readers.ts` | the week after a return week is a return week | **2** | 3 | integration/native-change-sheet 2, unit/native-change-sheet 1 |
| 42 | `overlay-readers.ts` | a trip that carries an injury reads as one | **1** | 1 | unit/native-change-sheet 1 |
| 43 | `overlay-readers.ts` | a return week in a region with no name is named by its key | **1** | 1 | unit/native-change-sheet 1 |
| 44 | `overlay-readers.ts` | an injury in a region with no name is named by its key | **1** | 1 | unit/native-change-sheet 1 |
| 45 | `overlay-readers.ts` | a return week's line is One light week | **2** | 3 | integration/native-change-sheet 2, unit/native-change-sheet 1 |
| 46 | `overlay-readers.ts` | a protected injury reads as worked around | **2** | 3 | integration/native-change-sheet 2, unit/native-change-sheet 1 |
| 47 | `overlay-readers.ts` | a worked around injury reads as protected | **2** | 6 | integration/native-change-sheet 4, unit/native-change-sheet 2 |
| 48 | `overlay-readers.ts` | a gear with no name reads Modified | **1** | 1 | unit/native-change-sheet 1 |
| 49 | `overlay-readers.ts` | a change with no gear reads as nothing | **1** | 3 | unit/native-change-sheet 3 |
| 50 | `overlay-readers.ts` | an injury with an end still says Tap I'm back | **2** | 3 | integration/native-change-sheet 2, unit/native-change-sheet 1 |
| 51 | `overlay-readers.ts` | an open injury says Open-ended | **2** | 6 | integration/native-change-sheet 5, unit/native-change-sheet 1 |
| 52 | `overlay-readers.ts` | a trip with no end says Tap I'm back | **1** | 2 | unit/native-change-sheet 2 |
| 53 | `overlay-readers.ts` | a return week's line says when it ends | **2** | 3 | integration/native-change-sheet 2, unit/native-change-sheet 1 |
| 54 | `overlay-readers.ts` | a return week is titled Injury | **2** | 3 | integration/native-change-sheet 2, unit/native-change-sheet 1 |
| 55 | `overlay-readers.ts` | a kind with no name has no title | **1** | 1 | unit/native-change-sheet 1 |
| 56 | `overlay-readers.ts` | a chip's title loses its span | **2** | 12 | integration/native-change-sheet 6, unit/native-change-sheet 6 |
| 57 | `overlay-readers.ts` | a return week's line ends with a second full stop | **2** | 3 | integration/native-change-sheet 2, unit/native-change-sheet 1 |
| 58 | `overlay-readers.ts` | a chip's line has no full stop | **2** | 12 | integration/native-change-sheet 6, unit/native-change-sheet 6 |
| 59 | `overlay-readers.ts` | a return week offers I'm back | **2** | 3 | integration/native-change-sheet 2, unit/native-change-sheet 1 |
| 60 | `overlay-readers.ts` | a trip offers I'm back | **2** | 6 | integration/native-change-sheet 3, unit/native-change-sheet 3 |
| 61 | `overlay-readers.ts` | a chip carries another's id | **1** | 6 | unit/native-change-sheet 6 |
| 62 | `overlay-readers.ts` | a return week is asked about | **1** | 1 | unit/native-change-sheet 1 |
| 63 | `overlay-readers.ts` | an injury with an end is asked about | **1** | 1 | unit/native-change-sheet 1 |
| 64 | `overlay-readers.ts` | the check in counts from when the injury was set | **2** | 2 | integration/native-change-sheet 1, unit/native-change-sheet 1 |
| 65 | `overlay-readers.ts` | the check in counts from the last answer alone | **2** | 4 | integration/native-change-sheet 1, unit/native-change-sheet 3 |
| 66 | `overlay-readers.ts` | an injury with no stamp is asked about at once | **1** | 1 | unit/native-change-sheet 1 |
| 67 | `overlay-readers.ts` | the check in comes a day early | **2** | 4 | integration/native-change-sheet 1, unit/native-change-sheet 3 |
| 68 | `overlay-readers.ts` | the check in waits a millisecond more | **1** | 2 | unit/native-change-sheet 2 |
| 69 | `overlay-readers.ts` | the check in names a region with no name as nothing | **1** | 1 | unit/native-change-sheet 1 |
| 70 | `overlay-readers.ts` | the check in keeps its region's capitals | **2** | 3 | unit/native-change-sheet 2, integration/native-change-sheet 1 |
| 71 | `overlay-readers.ts` | the check in asks How does it feel | **2** | 4 | integration/native-change-sheet 1, unit/native-change-sheet 3 |
| 72 | `overlay-readers.ts` | the check in is titled Checking in | **2** | 3 | integration/native-change-sheet 1, unit/native-change-sheet 2 |
| 73 | `overlay-readers.ts` | the check in's Same and Worse change places | **2** | 3 | integration/native-change-sheet 1, unit/native-change-sheet 2 |
| 74 | `overlay-readers.ts` | Better is labelled Good | **2** | 3 | integration/native-change-sheet 1, unit/native-change-sheet 2 |
| 75 | `overlay-readers.ts` | a new draft is on Mini gym | **2** | 10 | integration/native-change-sheet 9, unit/native-change-sheet 1 |
| 76 | `overlay-readers.ts` | Traveling? opens on today whatever it last held | **2** | 2 | integration/native-change-sheet 1, unit/native-change-sheet 1 |
| 77 | `overlay-readers.ts` | Traveling? opens for a week | **2** | 5 | integration/native-change-sheet 3, unit/native-change-sheet 2 |
| 78 | `overlay-readers.ts` | Traveling? forgets the Through it held | **2** | 2 | integration/native-change-sheet 1, unit/native-change-sheet 1 |
| 79 | `overlay-readers.ts` | Traveling? keeps the gear it last held | **2** | 4 | integration/native-change-sheet 3, unit/native-change-sheet 1 |
| 80 | `overlay-readers.ts` | Traveling? stays on the tab it was on | **2** | 2 | integration/native-change-sheet 1, unit/native-change-sheet 1 |
| 81 | `overlay-readers.ts` | Hurt? keeps the region it last held | **2** | 3 | integration/native-change-sheet 2, unit/native-change-sheet 1 |
| 82 | `overlay-readers.ts` | Hurt? opens on Protect it | **2** | 6 | integration/native-change-sheet 5, unit/native-change-sheet 1 |
| 83 | `overlay-readers.ts` | Hurt? ignores the live injury's tier | **2** | 2 | integration/native-change-sheet 1, unit/native-change-sheet 1 |
| 84 | `overlay-readers.ts` | Hurt? ignores the live injury | **2** | 2 | integration/native-change-sheet 1, unit/native-change-sheet 1 |
| 85 | `overlay-readers.ts` | Hurt? keeps the From it last held | **2** | 6 | integration/native-change-sheet 5, unit/native-change-sheet 1 |
| 86 | `overlay-readers.ts` | Hurt? stays on the tab it was on | **2** | 6 | integration/native-change-sheet 5, unit/native-change-sheet 1 |
| 87 | `overlay-readers.ts` | a From past Through carries nothing | **2** | 3 | integration/native-change-sheet 2, unit/native-change-sheet 1 |
| 88 | `overlay-readers.ts` | a From on Through's own day carries Through | **1** | 1 | unit/native-change-sheet 1 |
| 89 | `overlay-readers.ts` | Through is carried a week on | **2** | 3 | integration/native-change-sheet 2, unit/native-change-sheet 1 |
| 90 | `overlay-readers.ts` | a choice is not written to the draft | **2** | 7 | integration/native-change-sheet 6, unit/native-change-sheet 1 |
| 91 | `overlay-readers.ts` | the sheet takes any span as inside the program | **2** | 2 | integration/native-change-sheet 1, unit/native-change-sheet 1 |
| 92 | `overlay-readers.ts` | the sheet reads a program of 99 weeks | **1** | 1 | unit/native-change-sheet 1 |
| 93 | `change-sheet-model.ts` | the sheet's model drifts from today's | **2** | 6 | integration/native-change-sheet 5, unit/native-change-sheet 1 |
| 94 | `overlay-writes.ts` | Pick a region is reworded | **2** | 4 | integration/native-change-sheet 2, unit/native-change-sheet 2 |
| 95 | `overlay-writes.ts` | the date outside the program is reworded | **2** | 4 | integration/native-change-sheet 2, unit/native-change-sheet 2 |
| 96 | `overlay-writes.ts` | Working around it is reworded | **2** | 5 | integration/native-change-sheet 4, unit/native-change-sheet 1 |
| 97 | `overlay-writes.ts` | Protected is reworded | **2** | 3 | integration/native-change-sheet 2, unit/native-change-sheet 1 |
| 98 | `overlay-writes.ts` | Pick both dates is reworded | **2** | 3 | integration/native-change-sheet 1, unit/native-change-sheet 2 |
| 99 | `overlay-writes.ts` | Through before From is reworded | **2** | 3 | integration/native-change-sheet 1, unit/native-change-sheet 2 |
| 100 | `overlay-writes.ts` | the range outside the program is reworded | **2** | 3 | integration/native-change-sheet 1, unit/native-change-sheet 2 |
| 101 | `overlay-writes.ts` | Change applied is reworded | **2** | 4 | integration/native-change-sheet 3, unit/native-change-sheet 1 |
| 102 | `overlay-writes.ts` | Change removed is reworded | **2** | 5 | integration/native-change-sheet 4, unit/native-change-sheet 1 |
| 103 | `overlay-writes.ts` | the snooze is reworded | **2** | 3 | integration/native-change-sheet 1, unit/native-change-sheet 2 |
| 104 | `overlay-writes.ts` | a full gym trip is stored | **2** | 2 | integration/native-change-sheet 1, unit/native-change-sheet 1 |
| 105 | `overlay-writes.ts` | a full gym leaves the sheet open | **2** | 2 | integration/native-change-sheet 1, unit/native-change-sheet 1 |
| 106 | `overlay-writes.ts` | a trip with no Through passes the first guard | **2** | 2 | integration/native-change-sheet 1, unit/native-change-sheet 1 |
| 107 | `overlay-writes.ts` | a trip with no From passes the first guard | **1** | 1 | unit/native-change-sheet 1 |
| 108 | `overlay-writes.ts` | a Through before From passes its guard | **2** | 2 | integration/native-change-sheet 1, unit/native-change-sheet 1 |
| 109 | `overlay-writes.ts` | a trip of one day is refused | **1** | 2 | integration/native-change-sheet 2 |
| 110 | `overlay-writes.ts` | a trip outside the program is stored | **2** | 2 | integration/native-change-sheet 1, unit/native-change-sheet 1 |
| 111 | `overlay-writes.ts` | a trip is weighed against a program of 99 weeks | **1** | 1 | unit/native-change-sheet 1 |
| 112 | `overlay-writes.ts` | a trip's id is not its instant | **1** | 3 | integration/native-change-sheet 3 |
| 113 | `overlay-writes.ts` | a trip is stored as another kind | **1** | 3 | integration/native-change-sheet 3 |
| 114 | `overlay-writes.ts` | a trip stores Mini gym whatever was picked | **1** | 1 | integration/native-change-sheet 1 |
| 115 | `overlay-writes.ts` | a trip stores no note | **1** | 3 | integration/native-change-sheet 3 |
| 116 | `overlay-writes.ts` | a trip is not stamped | **1** | 3 | integration/native-change-sheet 3 |
| 117 | `overlay-writes.ts` | a trip ends the day before its Through | **1** | 2 | integration/native-change-sheet 2 |
| 118 | `overlay-writes.ts` | a trip is put first in the list | **1** | 1 | integration/native-change-sheet 1 |
| 119 | `overlay-writes.ts` | a trip is not stored before the rebuild | **1** | 3 | integration/native-change-sheet 3 |
| 120 | `overlay-writes.ts` | a trip rebuilds nothing | **2** | 4 | integration/native-change-sheet 3, unit/native-change-sheet 1 |
| 121 | `overlay-writes.ts` | a trip leaves the sheet open | **1** | 3 | integration/native-change-sheet 3 |
| 122 | `overlay-writes.ts` | a trip says nothing | **1** | 3 | integration/native-change-sheet 3 |
| 123 | `overlay-writes.ts` | a region the app does not train around is stored | **2** | 3 | integration/native-change-sheet 2, unit/native-change-sheet 1 |
| 124 | `overlay-writes.ts` | no region passes the first guard | **2** | 3 | integration/native-change-sheet 2, unit/native-change-sheet 1 |
| 125 | `overlay-writes.ts` | a blank From is not today | **1** | 2 | integration/native-change-sheet 2 |
| 126 | `overlay-writes.ts` | an injury outside the program is stored | **2** | 3 | integration/native-change-sheet 2, unit/native-change-sheet 1 |
| 127 | `overlay-writes.ts` | an injury's id is not its instant | **1** | 5 | integration/native-change-sheet 5 |
| 128 | `overlay-writes.ts` | an injury is stored as another kind | **1** | 5 | integration/native-change-sheet 5 |
| 129 | `overlay-writes.ts` | an injury is stored with an end | **1** | 5 | integration/native-change-sheet 5 |
| 130 | `overlay-writes.ts` | an injury is stored worked around whatever was picked | **1** | 2 | integration/native-change-sheet 2 |
| 131 | `overlay-writes.ts` | an injury is stored in another region | **1** | 2 | integration/native-change-sheet 2 |
| 132 | `overlay-writes.ts` | an injury stores no note | **1** | 4 | integration/native-change-sheet 4 |
| 133 | `overlay-writes.ts` | an injury is not stamped | **1** | 4 | integration/native-change-sheet 4 |
| 134 | `overlay-writes.ts` | an injury is not stored before the rebuild | **1** | 4 | integration/native-change-sheet 4 |
| 135 | `overlay-writes.ts` | an injury rebuilds nothing | **2** | 5 | integration/native-change-sheet 4, unit/native-change-sheet 1 |
| 136 | `overlay-writes.ts` | an injury leaves the sheet open | **1** | 5 | integration/native-change-sheet 5 |
| 137 | `overlay-writes.ts` | Protect it says Working around it | **1** | 2 | integration/native-change-sheet 2 |
| 138 | `overlay-writes.ts` | Work around it says Protected | **1** | 4 | integration/native-change-sheet 4 |
| 139 | `overlay-writes.ts` | the ✕ keeps the change and removes the others | **1** | 4 | integration/native-change-sheet 4 |
| 140 | `overlay-writes.ts` | the ✕ is not stored before the rebuild | **1** | 4 | integration/native-change-sheet 4 |
| 141 | `overlay-writes.ts` | the ✕ rebuilds nothing | **2** | 5 | integration/native-change-sheet 4, unit/native-change-sheet 1 |
| 142 | `overlay-writes.ts` | the ✕ says nothing | **1** | 4 | integration/native-change-sheet 4 |
| 143 | `overlay-writes.ts` | the ✕ with no list in hand throws | **1** | 1 | unit/native-change-sheet 1 |
| 144 | `overlay-writes.ts` | I'm back on a change that is no injury does nothing | **1** | 11 | sweeps/native-change-sheet 11 (the sweep was run) |
| 145 | `overlay-writes.ts` | I'm back keeps the injury | **1** | 2 | integration/native-change-sheet 2 |
| 146 | `overlay-writes.ts` | the return week is six days | **1** | 2 | integration/native-change-sheet 2 |
| 147 | `overlay-writes.ts` | the return week starts tomorrow | **1** | 2 | integration/native-change-sheet 2 |
| 148 | `overlay-writes.ts` | the return week is a plain injury | **1** | 2 | integration/native-change-sheet 2 |
| 149 | `overlay-writes.ts` | the return week protects | **1** | 2 | integration/native-change-sheet 2 |
| 150 | `overlay-writes.ts` | the return week's id is a millisecond on | **1** | 2 | integration/native-change-sheet 2 |
| 151 | `overlay-writes.ts` | the return week stores no note | **1** | 2 | integration/native-change-sheet 2 |
| 152 | `overlay-writes.ts` | the return week is not stamped | **1** | 2 | integration/native-change-sheet 2 |
| 153 | `overlay-writes.ts` | every region gets the week after | **1** | 1 | integration/native-change-sheet 1 |
| 154 | `overlay-writes.ts` | no region gets the week after | **1** | 2 | integration/native-change-sheet 2 |
| 155 | `overlay-writes.ts` | a region's running is judged by neither plan | **1** | 2 | integration/native-change-sheet 2 |
| 156 | `overlay-writes.ts` | a lower back and a hip did not have their running taken away | **1** | 9 | sweeps/native-change-sheet 9 (the sweep was run) |
| 157 | `overlay-writes.ts` | an ankle and a calf did not have their running taken away | **1** | 1 | integration/native-change-sheet 1 |
| 158 | `overlay-writes.ts` | the week after starts a day late | **1** | 2 | integration/native-change-sheet 2 |
| 159 | `overlay-writes.ts` | the week after is six days | **1** | 2 | integration/native-change-sheet 2 |
| 160 | `overlay-writes.ts` | the week after shares the return week's id | **1** | 2 | integration/native-change-sheet 2 |
| 161 | `overlay-writes.ts` | the week after is a plain injury | **1** | 2 | integration/native-change-sheet 2 |
| 162 | `overlay-writes.ts` | the week after is stamped as the return week | **1** | 2 | integration/native-change-sheet 2 |
| 163 | `overlay-writes.ts` | I'm back is not stored before the rebuild | **1** | 2 | integration/native-change-sheet 2 |
| 164 | `overlay-writes.ts` | I'm back rebuilds nothing | **2** | 3 | integration/native-change-sheet 2, unit/native-change-sheet 1 |
| 165 | `overlay-writes.ts` | one week back says Good | **1** | 1 | integration/native-change-sheet 1 |
| 166 | `overlay-writes.ts` | one week back names its region with capitals | **1** | 1 | integration/native-change-sheet 1 |
| 167 | `overlay-writes.ts` | one week back holds RPE 8 | **1** | 1 | integration/native-change-sheet 1 |
| 168 | `overlay-writes.ts` | one week back in a region with no name says it | **1** | 11 | sweeps/native-change-sheet 11 (the sweep was run) |
| 169 | `overlay-writes.ts` | one week back's button is OK | **1** | 1 | integration/native-change-sheet 1 |
| 170 | `overlay-writes.ts` | one week back's icon is a warning | **1** | 1 | integration/native-change-sheet 1 |
| 171 | `overlay-writes.ts` | one week back raises another tier | **1** | 1 | integration/native-change-sheet 1 |
| 172 | `overlay-writes.ts` | two weeks back says Good | **1** | 2 | integration/native-change-sheet 2 |
| 173 | `overlay-writes.ts` | two weeks back's kicker is Back | **1** | 2 | integration/native-change-sheet 2 |
| 174 | `overlay-writes.ts` | two weeks back's button is OK | **1** | 2 | integration/native-change-sheet 2 |
| 175 | `overlay-writes.ts` | two weeks back's line is cut short | **1** | 2 | integration/native-change-sheet 2 |
| 176 | `overlay-writes.ts` | the pace clock speaks for every run goal | **1** | 1 | integration/native-change-sheet 1 |
| 177 | `overlay-writes.ts` | the pace clock never speaks | **1** | 1 | integration/native-change-sheet 1 |
| 178 | `overlay-writes.ts` | the pace clock reads the program's first week | **1** | 1 | integration/native-change-sheet 1 |
| 179 | `overlay-writes.ts` | the pace clock's first line is reworded | **1** | 1 | integration/native-change-sheet 1 |
| 180 | `overlay-writes.ts` | race day moves on a dated goal | **1** | 2 | sweeps/native-change-sheet 2 (the sweep was run) |
| 181 | `overlay-writes.ts` | race day does not move on an undated goal | **1** | 1 | sweeps/native-change-sheet 1 (the sweep was run) |
| 182 | `overlay-writes.ts` | race day's line is reworded | **1** | 2 | sweeps/native-change-sheet 2 (the sweep was run) |
| 183 | `overlay-writes.ts` | one more week reads weeks | **1** | 1 | integration/native-change-sheet 1 |
| 184 | `overlay-writes.ts` | more weeks read week | **1** | 1 | integration/native-change-sheet 1 |
| 185 | `overlay-writes.ts` | the weeks' line is reworded | **1** | 1 | integration/native-change-sheet 1 |
| 186 | `overlay-writes.ts` | Same is not stamped | **2** | 2 | integration/native-change-sheet 1, unit/native-change-sheet 1 |
| 187 | `overlay-writes.ts` | Same is not stored | **2** | 2 | integration/native-change-sheet 1, unit/native-change-sheet 1 |
| 188 | `overlay-writes.ts` | Same says nothing | **2** | 2 | integration/native-change-sheet 1, unit/native-change-sheet 1 |
| 189 | `overlay-writes.ts` | Worse is not stamped | **1** | 1 | integration/native-change-sheet 1 |
| 190 | `overlay-writes.ts` | Worse is not stored | **1** | 1 | integration/native-change-sheet 1 |
| 191 | `overlay-writes.ts` | Better stamps the ask | **2** | 2 | integration/native-change-sheet 1, unit/native-change-sheet 1 |
| 192 | `overlay-writes.ts` | Worse is the snooze | **1** | 1 | integration/native-change-sheet 1 |
| 193 | `overlay-writes.ts` | Same raises Better's pop-up | **1** | 1 | integration/native-change-sheet 1 |
| 194 | `overlay-writes.ts` | Good sign is reworded | **2** | 2 | integration/native-change-sheet 1, unit/native-change-sheet 1 |
| 195 | `overlay-writes.ts` | Good sign's line is cut short | **2** | 2 | integration/native-change-sheet 1, unit/native-change-sheet 1 |
| 196 | `overlay-writes.ts` | Good sign's first button is Back | **2** | 2 | integration/native-change-sheet 1, unit/native-change-sheet 1 |
| 197 | `overlay-writes.ts` | Good sign's second button is Later | **2** | 2 | integration/native-change-sheet 1, unit/native-change-sheet 1 |
| 198 | `overlay-writes.ts` | Good sign's first button has the second's class | **2** | 2 | integration/native-change-sheet 1, unit/native-change-sheet 1 |
| 199 | `overlay-writes.ts` | Good sign's first handler is not today's | **2** | 2 | integration/native-change-sheet 1, unit/native-change-sheet 1 |
| 200 | `overlay-writes.ts` | Good sign's second handler is not today's | **2** | 2 | integration/native-change-sheet 1, unit/native-change-sheet 1 |
| 201 | `overlay-writes.ts` | Good sign's buttons change places in what they do | **2** | 2 | integration/native-change-sheet 1, unit/native-change-sheet 1 |
| 202 | `overlay-writes.ts` | Good sign has one button that does anything | **2** | 2 | integration/native-change-sheet 1, unit/native-change-sheet 1 |
| 203 | `overlay-writes.ts` | trending worse is reworded | **1** | 1 | integration/native-change-sheet 1 |
| 204 | `overlay-writes.ts` | trending worse's line is cut short | **1** | 1 | integration/native-change-sheet 1 |
| 205 | `overlay-writes.ts` | trending worse's button is OK | **1** | 1 | integration/native-change-sheet 1 |
| 206 | `overlay-writes.ts` | trending worse's icon is a shield | **1** | 1 | integration/native-change-sheet 1 |
| 207 | `overlay-writes.ts` | the stored program takes the list of the first program | **2** | 2 | integration/native-change-sheet 1, unit/native-change-sheet 1 |
| 208 | `week-dates.ts` | a program with no run has a test date | **1** | 1 | unit/native-change-sheet 1 |
| 209 | `week-dates.ts` | a race goal has a test date | **1** | 1 | unit/native-change-sheet 1 |
| 210 | `week-dates.ts` | a goal with the event off has a test date | **1** | 1 | unit/native-change-sheet 1 |
| 211 | `week-dates.ts` | a date that does not read is the epoch | **1** | 1 | unit/native-change-sheet 1 |
| 212 | `week-dates.ts` | a Monday is a short week | **2** | 5 | integration/native-change-sheet 2, unit/native-change-sheet 3 |
| 213 | `week-dates.ts` | the entered day is not trained | **2** | 4 | unit/native-change-sheet 2, integration/native-change-sheet 2 |
| 214 | `week-dates.ts` | rest days are trained | **2** | 6 | integration/native-change-sheet 2, unit/native-change-sheet 4 |
| 215 | `week-dates.ts` | the week ends on its Saturday | **1** | 1 | unit/native-change-sheet 1 |
| 216 | `week-dates.ts` | a test on the entered day is not held | **1** | 1 | unit/native-change-sheet 1 |
| 217 | `week-dates.ts` | a test on that Sunday is not held | **1** | 1 | unit/native-change-sheet 1 |
| 218 | `week-dates.ts` | a test before the entered day is held | **1** | 1 | unit/native-change-sheet 1 |
| 219 | `week-dates.ts` | a test after that Sunday is held | **1** | 1 | unit/native-change-sheet 1 |
| 220 | `week-dates.ts` | a whole week holds the test | **1** | 1 | unit/native-change-sheet 1 |
| 221 | `week-dates.ts` | a week with a training day left holds the test | **1** | 1 | unit/native-change-sheet 1 |
| 222 | `week-dates.ts` | a week that holds the test still moves | **1** | 1 | unit/native-change-sheet 1 |
| 223 | `week-dates.ts` | a Monday with no training day moves | **1** | 1 | unit/native-change-sheet 1 |
| 224 | `week-dates.ts` | a short week with a training day left moves | **2** | 5 | integration/native-change-sheet 2, unit/native-change-sheet 3 |
| 225 | `week-dates.ts` | a moved start is the entered day | **2** | 4 | integration/native-change-sheet 2, unit/native-change-sheet 2 |
| 226 | `week-dates.ts` | a moved start does not say it moved | **2** | 5 | integration/native-change-sheet 2, unit/native-change-sheet 3 |
| 227 | `week-dates.ts` | a moved start lists the short week's days | **1** | 1 | unit/native-change-sheet 1 |
| 228 | `week-dates.ts` | a start moves two Mondays on | **2** | 4 | integration/native-change-sheet 2, unit/native-change-sheet 2 |
| 229 | `week-dates.ts` | a short week's Monday is the next one | **1** | 3 | unit/native-change-sheet 3 |
| 230 | `week-dates.ts` | every start says whether it holds the test | **1** | 3 | unit/native-change-sheet 3 |
| 231 | `week-dates.ts` | the program in hand is stored first in the list | **2** | 2 | integration/native-change-sheet 1, unit/native-change-sheet 1 |
| 232 | `week-dates.ts` | a blank race date is said not to resolve | **2** | 2 | integration/native-change-sheet 1, unit/native-change-sheet 1 |
| 233 | `week-dates.ts` | a race date that does not resolve is kept | **1** | 1 | unit/native-change-sheet 1 |
| 234 | `week-dates.ts` | a race date that does not resolve reads as set | **1** | 1 | unit/native-change-sheet 1 |
| 235 | `week-dates.ts` | a race with the event off is laid back | **1** | 1 | unit/native-change-sheet 1 |
| 236 | `week-dates.ts` | a program with no run is laid back from a race | **1** | 1 | unit/native-change-sheet 1 |
| 237 | `week-dates.ts` | the race date leaves the start where it was | **1** | 1 | integration/native-change-sheet 1 |
| 238 | `week-dates.ts` | the race date is not stored before the rebuild | **1** | 1 | integration/native-change-sheet 1 |
| 239 | `week-dates.ts` | the race date rebuilds nothing | **2** | 2 | integration/native-change-sheet 1, unit/native-change-sheet 1 |
| 240 | `week-dates.ts` | the race date's toast puts the start first | **1** | 1 | integration/native-change-sheet 1 |
| 241 | `week-dates.ts` | the race date's toast is reworded | **1** | 1 | integration/native-change-sheet 1 |
| 242 | `week-dates.ts` | a blank start date is today | **2** | 3 | integration/native-change-sheet 2, unit/native-change-sheet 1 |
| 243 | `week-dates.ts` | the start is the entered day whatever the week holds | **2** | 3 | integration/native-change-sheet 2, unit/native-change-sheet 1 |
| 244 | `week-dates.ts` | the start's rest days are not read | **2** | 3 | integration/native-change-sheet 2, unit/native-change-sheet 1 |
| 245 | `week-dates.ts` | the start is not given the test date | **1** | 2 | sweeps/native-change-sheet 2 (the sweep was run) |
| 246 | `week-dates.ts` | a dated test's week is not pinned again | **1** | 2 | sweeps/native-change-sheet 2 (the sweep was run) |
| 247 | `week-dates.ts` | a dated test's cap is the goal's length whatever its week | **1** | 2 | sweeps/native-change-sheet 2 (the sweep was run) |
| 248 | `week-dates.ts` | a dated test's cap is not written | **1** | 2 | sweeps/native-change-sheet 2 (the sweep was run) |
| 249 | `week-dates.ts` | a dated test's start rebuilds nothing | **1** | 1 | unit/native-change-sheet 1 |
| 250 | `week-dates.ts` | every start date rebuilds | **1** | 1 | unit/native-change-sheet 1 |
| 251 | `week-dates.ts` | the start date is not stored | **2** | 3 | integration/native-change-sheet 2, unit/native-change-sheet 1 |
| 252 | `week-dates.ts` | a week that holds the test says only that it is short | **2** | 3 | unit/native-change-sheet 1, integration/native-change-sheet 2 |
| 253 | `week-dates.ts` | a moved start says only that it is set | **2** | 3 | integration/native-change-sheet 2, unit/native-change-sheet 1 |
| 254 | `week-dates.ts` | a moved start's toast names the entered day | **2** | 3 | integration/native-change-sheet 2, unit/native-change-sheet 1 |
| 255 | `week-dates.ts` | a moved start's toast is reworded | **2** | 3 | integration/native-change-sheet 2, unit/native-change-sheet 1 |
| 256 | `week-dates.ts` | a short week and a whole one change toasts | **2** | 3 | integration/native-change-sheet 2, unit/native-change-sheet 1 |
| 257 | `week-dates.ts` | the unresolved toast is reworded | **1** | 2 | unit/native-change-sheet 2 |
| 258 | `week-dates.ts` | the test week's toast is reworded | **1** | 1 | unit/native-change-sheet 1 |
| 259 | `week-dates.ts` | the short week's toast is reworded | **2** | 4 | integration/native-change-sheet 2, unit/native-change-sheet 2 |
| 260 | `week-dates.ts` | the start's toast is reworded | **2** | 4 | integration/native-change-sheet 2, unit/native-change-sheet 2 |
| 261 | `week-dates.ts` | the title always goes back to today's | **1** | 1 | unit/native-change-sheet 1 |
| 262 | `week-dates.ts` | the title never goes back to today's | **1** | 1 | unit/native-change-sheet 1 |
| 263 | `week-dates.ts` | the screen keeps the week it held after a date | **2** | 4 | integration/native-change-sheet 3, unit/native-change-sheet 1 |
| 264 | `date-box.ts` | the calendar opens on today whatever the field holds | **1** | 1 | unit/native-change-sheet 1 |
| 265 | `date-box.ts` | a blank field's calendar opens on the epoch | **1** | 1 | unit/native-change-sheet 1 |
| 266 | `date-box.ts` | a blank field's calendar keeps the hour | **1** | 1 | unit/native-change-sheet 1 |
| 267 | `date-box.ts` | a picked day is written as its day in Greenwich | **1** | 1 | unit/native-change-sheet 1 |
| 268 | `date-box.ts` | Reset writes a zero | **1** | 1 | unit/native-change-sheet 1 |
| 269 | `date-box.ts` | Reset is named Clear | **1** | 1 | unit/native-change-sheet 1 |
| 270 | `date-box.ts` | Done is named OK | **1** | 1 | unit/native-change-sheet 1 |
| 271 | `list-readers.ts` | the copied text's first line is reworded | **2** | 3 | integration/native-change-sheet 1, unit/native-change-sheet 2 |
| 272 | `list-readers.ts` | the copied name has no label | **2** | 3 | integration/native-change-sheet 1, unit/native-change-sheet 2 |
| 273 | `list-readers.ts` | the copied goal is its key | **1** | 1 | unit/native-change-sheet 1 |
| 274 | `list-readers.ts` | a goal with no name is copied as nothing | **1** | 1 | unit/native-change-sheet 1 |
| 275 | `list-readers.ts` | the copied focus and path change places | **2** | 3 | integration/native-change-sheet 1, unit/native-change-sheet 2 |
| 276 | `list-readers.ts` | the copied age is the experience | **2** | 3 | integration/native-change-sheet 1, unit/native-change-sheet 2 |
| 277 | `list-readers.ts` | the copied gear and units change places | **2** | 3 | integration/native-change-sheet 1, unit/native-change-sheet 2 |
| 278 | `list-readers.ts` | the copied train days are keys | **2** | 3 | integration/native-change-sheet 1, unit/native-change-sheet 2 |
| 279 | `list-readers.ts` | the copied rest days are keys | **2** | 2 | integration/native-change-sheet 1, unit/native-change-sheet 1 |
| 280 | `list-readers.ts` | no rest days are copied as nothing | **1** | 1 | unit/native-change-sheet 1 |
| 281 | `list-readers.ts` | the copied length has no unit | **2** | 3 | integration/native-change-sheet 1, unit/native-change-sheet 2 |
| 282 | `list-readers.ts` | lifts from experience are not marked | **1** | 1 | unit/native-change-sheet 1 |
| 283 | `list-readers.ts` | entered lifts are marked as estimates | **2** | 3 | integration/native-change-sheet 1, unit/native-change-sheet 2 |
| 284 | `list-readers.ts` | the copied bench and squat change places | **2** | 3 | unit/native-change-sheet 2, integration/native-change-sheet 1 |
| 285 | `list-readers.ts` | the copied deadlift has no unit | **2** | 3 | integration/native-change-sheet 1, unit/native-change-sheet 2 |
| 286 | `list-readers.ts` | a lifter's cardio is copied as nothing | **1** | 1 | unit/native-change-sheet 1 |
| 287 | `list-readers.ts` | a sport with no goal is copied as nothing | **1** | 1 | unit/native-change-sheet 1 |
| 288 | `list-readers.ts` | a sport is copied by its label | **2** | 2 | integration/native-change-sheet 1, unit/native-change-sheet 1 |
| 289 | `list-readers.ts` | the run anchor's line is not copied | **1** | 1 | integration/native-change-sheet 1 |
| 290 | `list-readers.ts` | the event's line is copied for every program | **1** | 2 | unit/native-change-sheet 2 |
| 291 | `list-readers.ts` | an event with no date is copied as nothing | **1** | 1 | unit/native-change-sheet 1 |
| 292 | `list-readers.ts` | the event's countdown is not copied | **2** | 2 | integration/native-change-sheet 1, unit/native-change-sheet 1 |
| 293 | `list-readers.ts` | the event's countdown is the card's | **2** | 2 | integration/native-change-sheet 1, unit/native-change-sheet 1 |
| 294 | `list-readers.ts` | a seed of zero is not copied | **1** | 1 | unit/native-change-sheet 1 |
| 295 | `list-readers.ts` | the copied toast is reworded | **2** | 2 | integration/native-change-sheet 1, unit/native-change-sheet 1 |
| 296 | `list-readers.ts` | a clamped entry is not said | **1** | 1 | unit/native-change-sheet 1 |
| 297 | `list-readers.ts` | a clamped entry that does not read is copied as zero | **1** | 1 | unit/native-change-sheet 1 |
| 298 | `list-readers.ts` | a fast clamp is said to be the slowest row | **1** | 1 | unit/native-change-sheet 1 |
| 299 | `list-readers.ts` | a seeded mile is copied as entered | **1** | 1 | unit/native-change-sheet 1 |
| 300 | `list-readers.ts` | a seeded mile with no program names none | **1** | 1 | unit/native-change-sheet 1 |
| 301 | `list-readers.ts` | one recovery run reads runs | **1** | 1 | unit/native-change-sheet 1 |
| 302 | `list-readers.ts` | an edited mile is copied as entered | **1** | 1 | unit/native-change-sheet 1 |
| 303 | `list-readers.ts` | an entered mile is copied as the default | **2** | 2 | integration/native-change-sheet 1, unit/native-change-sheet 1 |
| 304 | `list-readers.ts` | the anchor's line keeps its first chip | **2** | 2 | integration/native-change-sheet 1, unit/native-change-sheet 1 |
| 305 | `list-readers.ts` | the anchor's paces keep their capitals | **2** | 2 | integration/native-change-sheet 1, unit/native-change-sheet 1 |
| 306 | `list-readers.ts` | every anchor says Week 1 runs off this row | **2** | 2 | integration/native-change-sheet 1, unit/native-change-sheet 1 |
| 307 | `list-readers.ts` | the anchor's line is reworded | **2** | 2 | integration/native-change-sheet 1, unit/native-change-sheet 1 |
| 308 | `list-screen.ts` | the copied lines are joined by spaces | **2** | 2 | integration/native-change-sheet 1, unit/native-change-sheet 1 |
| 309 | `list-screen.ts` | a program that is gone copies a blank | **1** | 1 | unit/native-change-sheet 1 |
| 310 | `list-screen.ts` | the copy reads the first stored program | **1** | 1 | unit/native-change-sheet 1 |
| 311 | `Programs.tsx` | the copy button says Copied before the clipboard answers | **1** | 1 | unit/native-program-list 1 |
| 312 | `Programs.tsx` | a clipboard that refuses says nothing | **1** | 1 | unit/native-program-list 1 |
| 313 | `Programs.tsx` | the copy button takes no press | **1** | 2 | unit/native-program-list 2 |
| 314 | `ChangeSheet.tsx` | an unpicked card shows its line | **1** | 1 | unit/native-change-sheet 1 |
| 315 | `ChangeSheet.tsx` | every card shows a check | **1** | 1 | unit/native-change-sheet 1 |
| 316 | `ChangeSheet.tsx` | an effect with no title draws a blank one | **1** | 1 | unit/native-change-sheet 1 |
| 317 | `ChangeSheet.tsx` | a line with no words takes a line's height | **1** | 1 | unit/native-change-sheet 1 |
| 318 | `ChangeSheet.tsx` | a later line of the effect has no gap | **1** | 1 | unit/native-change-sheet 1 |
| 319 | `ChangeSheet.tsx` | a card writes another field | **1** | 1 | unit/native-change-sheet 1 |
| 320 | `ChangeSheet.tsx` | a date box opens the calendar with no earliest day | **1** | 1 | unit/native-change-sheet 1 |
| 321 | `ChangeSheet.tsx` | a date box opens the calendar on a blank | **1** | 1 | unit/native-change-sheet 1 |
| 322 | `ChangeSheet.tsx` | a date picked writes From whatever the box | **1** | 1 | unit/native-change-sheet 1 |
| 323 | `ChangeSheet.tsx` | the app is not told of the draft | **1** | 1 | unit/native-change-sheet 1 |
| 324 | `ChangeSheet.tsx` | Got it applies the draft | **1** | 1 | unit/native-change-sheet 1 |
| 325 | `ChangeSheet.tsx` | Traveling?'s Apply change applies an injury | **1** | 1 | unit/native-change-sheet 1 |
| 326 | `ChangeSheet.tsx` | a refusal closes the sheet | **1** | 1 | unit/native-change-sheet 1 |
| 327 | `ChangeSheet.tsx` | a refusal says nothing | **1** | 1 | unit/native-change-sheet 1 |
| 328 | `ChangeSheet.tsx` | the toast comes before the program in hand | **1** | 1 | unit/native-change-sheet 1 |
| 329 | `ChangeSheet.tsx` | Apply change hands back no program | **1** | 1 | unit/native-change-sheet 1 |
| 330 | `ChangeSheet.tsx` | Traveling?'s dates stand under its gear | **1** | 1 | unit/native-change-sheet 1 |
| 331 | `ChangeSheet.tsx` | Hurt?'s From stands above what changes | **1** | 1 | unit/native-change-sheet 1 |
| 332 | `ChangeSheet.tsx` | How bad is it stands with no tiers under it | **1** | 1 | unit/native-change-sheet 1 |
| 333 | `ChangeSheet.tsx` | the sheet's gear label is reworded | **1** | 1 | unit/native-change-sheet 1 |
| 334 | `ChangeSheet.tsx` | the foot's Apply change is reworded | **1** | 1 | unit/native-change-sheet 1 |
| 335 | `ChangeSheet.tsx` | a card's second line is iOS's own height | **1** | 1 | unit/native-change-sheet 1 |
| 336 | `ChangeSheet.tsx` | the date box's label stands 0.7 high | **1** | 1 | unit/native-change-sheet 1 |
| 337 | `ChangeSheet.tsx` | the effect stands 0.6 low | **1** | 1 | unit/native-change-sheet 1 |
| 338 | `ChangeSheet.tsx` | the effect's later lines keep 6 | **1** | 1 | unit/native-change-sheet 1 |
| 339 | `ChangeChips.tsx` | the check in has a red edge | **1** | 1 | unit/native-change-sheet 1 |
| 340 | `ChangeChips.tsx` | I'm back is in ink | **1** | 1 | unit/native-change-sheet 1 |
| 341 | `ChangeChips.tsx` | the chips stand apart | **1** | 1 | unit/native-change-sheet 1 |
| 342 | `ChangeChips.tsx` | a chip's line keeps 17.4 | **1** | 1 | unit/native-change-sheet 1 |
| 343 | `ChangeChips.tsx` | no chip still draws the gap above | **1** | 1 | unit/native-change-sheet 1 |
| 344 | `ChangeChips.tsx` | every chip offers I'm back | **1** | 1 | unit/native-change-sheet 1 |
| 345 | `ChangeChips.tsx` | I'm back removes the chip | **1** | 1 | unit/native-change-sheet 1 |
| 346 | `ChangeChips.tsx` | the check in's answers are all Better | **1** | 1 | unit/native-change-sheet 1 |
| 347 | `ChangeChips.tsx` | the check in has a ✕ | **1** | 1 | unit/native-change-sheet 1 |
| 348 | `ChangeChips.tsx` | the ✕ is I'm back | **1** | 1 | unit/native-change-sheet 1 |
| 349 | `ChangeChips.tsx` | a chip's title is its line | **1** | 1 | unit/native-change-sheet 1 |
| 350 | `ThisWeek.tsx` | the chips are drawn for a day ago | **1** | 1 | unit/native-change-sheet 1 |
| 351 | `ThisWeek.tsx` | a chip's ✕ is handed up as I'm back | **1** | 1 | unit/native-change-sheet 1 |
| 352 | `ThisWeek.tsx` | a chip's I'm back is handed up as the ✕ | **1** | 1 | unit/native-change-sheet 1 |
| 353 | `ThisWeek.tsx` | the check in's answer is not handed up | **1** | 1 | unit/native-change-sheet 1 |
| 354 | `ThisWeek.tsx` | the Hurt? pill opens Traveling? | **1** | 1 | unit/native-change-sheet 1 |
| 355 | `ThisWeek.tsx` | Traveling? opens Hurt? | **1** | 1 | unit/native-change-sheet 1 |
| 356 | `ThisWeek.tsx` | the race date is set as a start date | **1** | 1 | unit/native-change-sheet 1 |
| 357 | `ThisWeek.tsx` | the start date opens on a blank | **1** | 1 | unit/native-change-sheet 1 |
| 358 | `ThisWeek.tsx` | Random Workout takes a press | **1** | 1 | unit/native-change-sheet 1 |
| 359 | `ThisWeek.tsx` | the chips stand above the two buttons | **1** | 1 | unit/native-change-sheet 1 |
| 360 | `ThisWeek.tsx` | the app is not handed the program in hand | **1** | 1 | unit/native-change-sheet 1 |
| 361 | `ThisWeek.tsx` | the screen's own week starts at week 1 | **1** | 1 | unit/native-change-sheet 1 |
| 362 | `ThisWeek.tsx` | a title picked is not the screen's own week | **1** | 1 | unit/native-change-sheet 1 |
| 363 | `ThisWeek.tsx` | the title past the last week is the screen's own | **1** | 1 | unit/native-change-sheet 1 |
| 364 | `ThisWeek.tsx` | a day opened as its sheet is not the screen's own week | **1** | 1 | unit/native-change-sheet 1 |
| 365 | `ThisWeek.tsx` | a day opened as a deck is not the screen's own week | **1** | 1 | unit/native-change-sheet 1 |
| 366 | `ThisWeek.tsx` | a rest day opened is not the screen's own week | **1** | 1 | unit/native-change-sheet 1 |
| 367 | `ThisWeek.tsx` | another program keeps the last one's week | **1** | 1 | unit/native-change-sheet 1 |
| 368 | `ThisWeek.tsx` | a date that goes back to today's title keeps the title picked | **1** | 1 | unit/native-change-sheet 1 |
| 369 | `ThisWeek.tsx` | a date that goes back to today's title leaves the strip | **1** | 1 | unit/native-change-sheet 1 |
| 370 | `ThisWeek.tsx` | the strip is not placed anew after a date | **1** | 1 | unit/native-change-sheet 1 |
| 371 | `App.tsx` | This Week is not handed its asks | **1** | 1 | unit/native-change-sheet 1 |
| 372 | `App.tsx` | This Week is not told of a title reset | **1** | 1 | unit/native-change-sheet 1 |
| 373 | `App.tsx` | Hurt? opens Traveling?'s draft | **1** | 1 | unit/native-change-sheet 1 |
| 374 | `App.tsx` | the draft opened is not kept | **1** | 1 | unit/native-change-sheet 1 |
| 375 | `App.tsx` | the draft is new at each sheet | **1** | 1 | unit/native-change-sheet 1 |
| 376 | `App.tsx` | the app answers the ✕ with I'm back | **1** | 1 | unit/native-change-sheet 1 |
| 377 | `App.tsx` | I'm back is the ✕ | **1** | 1 | unit/native-change-sheet 1 |
| 378 | `App.tsx` | the check in's answer is always Same | **1** | 1 | unit/native-change-sheet 1 |
| 379 | `App.tsx` | a date of the row has an earliest day | **1** | 1 | unit/native-change-sheet 1 |
| 380 | `App.tsx` | a date of the row is always the start | **1** | 1 | unit/native-change-sheet 1 |
| 381 | `App.tsx` | an ask is answered on the program the sheet opened on | **1** | 1 | unit/native-change-sheet 1 |
| 382 | `App.tsx` | a chip's tap leaves the program in hand as it was | **1** | 1 | unit/native-change-sheet 1 |
| 383 | `App.tsx` | a chip's tap does not draw This Week again | **1** | 1 | unit/native-change-sheet 1 |
| 384 | `App.tsx` | a chip's toast comes before the program in hand | **1** | 1 | unit/native-change-sheet 1 |
| 385 | `App.tsx` | a chip's tap says nothing | **1** | 1 | unit/native-change-sheet 1 |
| 386 | `App.tsx` | the pop-up reads the program before the tap | **1** | 1 | unit/native-change-sheet 1 |
| 387 | `App.tsx` | the check in's pop-up has no buttons that act | **1** | 1 | unit/native-change-sheet 1 |
| 388 | `App.tsx` | a button of the check in's pop-up is always More time | **1** | 1 | unit/native-change-sheet 1 |
| 389 | `App.tsx` | the check in's pop-up stays up after its button | **1** | 1 | unit/native-change-sheet 1 |
| 390 | `App.tsx` | a pop-up raised by another's button shares its card | **1** | 1 | unit/native-change-sheet 1 |
| 391 | `App.tsx` | the race date is set as a start date in the app | **1** | 1 | unit/native-change-sheet 1 |
| 392 | `App.tsx` | a date leaves the program in hand as it was | **1** | 1 | unit/native-change-sheet 1 |
| 393 | `App.tsx` | a date never sends the title back | **1** | 1 | unit/native-change-sheet 1 |
| 394 | `App.tsx` | a date does not keep the screen's new week | **1** | 1 | unit/native-change-sheet 1 |
| 395 | `App.tsx` | a date that sets nothing still moves the title | **1** | 1 | unit/native-change-sheet 1 |
| 396 | `App.tsx` | a date says nothing | **1** | 1 | unit/native-change-sheet 1 |
| 397 | `App.tsx` | the sheet's draft is not kept by the app | **1** | 1 | unit/native-change-sheet 1 |
| 398 | `App.tsx` | the sheet's date boxes open nothing | **1** | 1 | unit/native-change-sheet 1 |
| 399 | `App.tsx` | Apply change leaves the program in hand as it was | **1** | 1 | unit/native-change-sheet 1 |
| 400 | `App.tsx` | the calendar stands under the sheet | **1** | 1 | unit/native-change-sheet 1 |
| 401 | `DateBox.tsx` | a calendar dismissed writes its day | **1** | 1 | unit/native-change-sheet 1 |
| 402 | `DateBox.tsx` | a day picked closes the box | **1** | 1 | unit/native-change-sheet 1 |
| 403 | `DateBox.tsx` | a day picked writes nothing until Done | **1** | 1 | unit/native-change-sheet 1 |
| 404 | `DateBox.tsx` | Reset closes the box | **1** | 1 | unit/native-change-sheet 1 |
| 405 | `DateBox.tsx` | Reset writes nothing | **1** | 1 | unit/native-change-sheet 1 |
| 406 | `DateBox.tsx` | Reset leaves the calendar on the day it held | **1** | 1 | unit/native-change-sheet 1 |
| 407 | `DateBox.tsx` | the calendar has an earliest day | **1** | 1 | unit/native-change-sheet 1 |
| 408 | `DateBox.tsx` | the check does nothing | **1** | 1 | unit/native-change-sheet 1 |
| 409 | `DateBox.tsx` | the calendar opens on today whatever the field | **1** | 1 | unit/native-change-sheet 1 |
| 410 | `DateBox.tsx` | the calendar is a wheel | **1** | 1 | unit/native-change-sheet 1 |
| 411 | `DateBox.tsx` | a tap outside the calendar does nothing | **1** | 1 | unit/native-change-sheet 1 |

- Breaks made: **411** of 411. Let through by the fast files, so swept: 10. Let through by every file: **0**.
