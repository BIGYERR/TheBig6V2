# The Expo app's Programs tab: a break per rule, and the test files each turns red

Written by `node tests/measure/native-program-list_breaks.mjs` (read-only here; each break is made in a copy of the tree and put back).

- The fast files, run on each break: `unit/native-program-list.test.ts`, `integration/native-program-list.test.ts`. Unbroken, they hold 73 tests and all pass.
- The sweep, run only on a break the fast files let through: `sweeps/native-program-list.test.ts` (11 tests, all passing unbroken).

| # | File | The rule broken | Files red | Tests red | Which |
|---|---|---|---|---|---|
| 1 | `list-readers.ts` | a base run gets the race plan's five chips | **2** | 11 | integration/native-program-list 10, unit/native-program-list 1 |
| 2 | `list-readers.ts` | the race's chip is named for the other race | **2** | 4 | integration/native-program-list 3, unit/native-program-list 1 |
| 3 | `list-readers.ts` | the Recovery chip is dropped | **2** | 13 | integration/native-program-list 11, unit/native-program-list 2 |
| 4 | `list-readers.ts` | the effort is printed off a race plan too | **2** | 11 | integration/native-program-list 10, unit/native-program-list 1 |
| 5 | `list-readers.ts` | the goal's chip goes last | **2** | 4 | integration/native-program-list 3, unit/native-program-list 1 |
| 6 | `list-readers.ts` | the goal's chip is in kilometres | **2** | 4 | integration/native-program-list 3, unit/native-program-list 1 |
| 7 | `list-readers.ts` | 18 reads a, not an | **2** | 2 | integration/native-program-list 1, unit/native-program-list 1 |
| 8 | `list-readers.ts` | a base run's sentence ends as a race plan's | **2** | 11 | integration/native-program-list 10, unit/native-program-list 1 |
| 9 | `list-readers.ts` | the pace goal's sentence ends as a race plan's | **2** | 4 | integration/native-program-list 3, unit/native-program-list 1 |
| 10 | `list-readers.ts` | a clamped mile is not said | **2** | 3 | integration/native-program-list 2, unit/native-program-list 1 |
| 11 | `list-readers.ts` | faster and slower swap in a clamped sentence | **2** | 3 | integration/native-program-list 2, unit/native-program-list 1 |
| 12 | `list-readers.ts` | the clamped row is named for the other end | **2** | 3 | integration/native-program-list 2, unit/native-program-list 1 |
| 13 | `list-readers.ts` | an entry of no time is printed as a time | **2** | 2 | integration/native-program-list 1, unit/native-program-list 1 |
| 14 | `list-readers.ts` | no count of seeded runs reads as one run | **2** | 3 | integration/native-program-list 2, unit/native-program-list 1 |
| 15 | `list-readers.ts` | the seeding program's name is dropped | **2** | 3 | integration/native-program-list 2, unit/native-program-list 1 |
| 16 | `list-readers.ts` | an edit over the default names a time | **2** | 4 | integration/native-program-list 3, unit/native-program-list 1 |
| 17 | `list-readers.ts` | an edit with nothing before it reads what is not there | **2** | 2 | integration/native-program-list 1, unit/native-program-list 1 |
| 18 | `list-readers.ts` | an entered mile reads as the default | **2** | 12 | integration/native-program-list 9, unit/native-program-list 3 |
| 19 | `list-readers.ts` | a squat of zero is kept as entered | **1** | 1 | unit/native-program-list 1 |
| 20 | `list-readers.ts` | one lift entered still reads as estimated | **1** | 1 | unit/native-program-list 1 |
| 21 | `list-readers.ts` | no experience stored reads as a beginner | **1** | 2 | unit/native-program-list 2 |
| 22 | `list-readers.ts` | no unit stored reads as kilograms | **1** | 1 | unit/native-program-list 1 |
| 23 | `list-readers.ts` | the rest days are listed as training days | **2** | 15 | integration/native-program-list 12, unit/native-program-list 3 |
| 24 | `list-readers.ts` | no length stored reads as eight weeks | **1** | 1 | unit/native-program-list 1 |
| 25 | `list-readers.ts` | a sport's goal is its id, not its label | **2** | 13 | integration/native-program-list 11, unit/native-program-list 2 |
| 26 | `list-readers.ts` | the hybrid path is the one with an event | **2** | 6 | integration/native-program-list 4, unit/native-program-list 2 |
| 27 | `list-readers.ts` | the time out is counted from the machine's own day | **2** | 3 | integration/native-program-list 2, unit/native-program-list 1 |
| 28 | `list-readers.ts` | an older program's seed is not printed | **2** | 4 | integration/native-program-list 3, unit/native-program-list 1 |
| 29 | `list-readers.ts` | the race date loses its year | **2** | 4 | unit/native-program-list 2, integration/native-program-list 2 |
| 30 | `list-readers.ts` | a goal's label is not today's | **2** | 6 | integration/native-program-list 4, unit/native-program-list 2 |
| 31 | `list-readers.ts` | a goal's description is not today's | **1** | 1 | integration/native-program-list 1 |
| 32 | `list-readers.ts` | the pace goal ranks under the base | **2** | 4 | integration/native-program-list 3, unit/native-program-list 1 |
| 33 | `list-readers.ts` | the triathlon swim is offered on the hybrid path | **1** | 2 | unit/native-program-list 2 |
| 34 | `list-readers.ts` | the 100 time needs no target | **2** | 3 | integration/native-program-list 1, unit/native-program-list 2 |
| 35 | `list-readers.ts` | a time needs both its minutes and its seconds | **2** | 6 | integration/native-program-list 3, unit/native-program-list 3 |
| 36 | `list-readers.ts` | the pace goal takes a distance or a time | **2** | 5 | integration/native-program-list 2, unit/native-program-list 3 |
| 37 | `list-readers.ts` | a goal picked with no target needed is not ready | **2** | 8 | integration/native-program-list 4, unit/native-program-list 4 |
| 38 | `list-readers.ts` | the blank mile is required of a beginner | **1** | 1 | unit/native-program-list 1 |
| 39 | `list-readers.ts` | sixty seconds is a time | **1** | 1 | unit/native-program-list 1 |
| 40 | `list-readers.ts` | a mile under three minutes is taken | **2** | 3 | integration/native-program-list 1, unit/native-program-list 2 |
| 41 | `list-readers.ts` | a mile over twenty five minutes is taken | **2** | 3 | integration/native-program-list 1, unit/native-program-list 2 |
| 42 | `list-readers.ts` | five minutes flat is told the chart tops out | **1** | 1 | unit/native-program-list 1 |
| 43 | `list-readers.ts` | twelve minutes flat is told to base first | **1** | 1 | unit/native-program-list 1 |
| 44 | `list-readers.ts` | the week a program is in is one on | **2** | 10 | integration/native-program-list 5, unit/native-program-list 5 |
| 45 | `list-screen.ts` | a second tap on a card leaves it open | **2** | 3 | integration/native-program-list 2, unit/native-program-list 1 |
| 46 | `list-screen.ts` | Archive arms the delete's tier | **2** | 4 | integration/native-program-list 2, unit/native-program-list 2 |
| 47 | `list-screen.ts` | Delete forever… arms the archive's tier | **2** | 4 | integration/native-program-list 2, unit/native-program-list 2 |
| 48 | `list-screen.ts` | Cancel leaves the card named | **2** | 3 | integration/native-program-list 2, unit/native-program-list 1 |
| 49 | `list-screen.ts` | the rename never ends | **2** | 3 | integration/native-program-list 2, unit/native-program-list 1 |
| 50 | `list-screen.ts` | the pencil names no card | **2** | 4 | integration/native-program-list 2, unit/native-program-list 2 |
| 51 | `list-screen.ts` | the active program is the stored pointer, whatever it names | **2** | 2 | integration/native-program-list 1, unit/native-program-list 1 |
| 52 | `list-screen.ts` | no card is the active one | **2** | 15 | integration/native-program-list 12, unit/native-program-list 3 |
| 53 | `list-screen.ts` | the days of the schedule lose their names | **2** | 14 | integration/native-program-list 12, unit/native-program-list 2 |
| 54 | `list-screen.ts` | the goal in Focus loses its label | **2** | 12 | integration/native-program-list 11, unit/native-program-list 1 |
| 55 | `list-screen.ts` | the paces are not drawn | **2** | 11 | integration/native-program-list 10, unit/native-program-list 1 |
| 56 | `list-screen.ts` | the bold words are not marked | **2** | 11 | integration/native-program-list 10, unit/native-program-list 1 |
| 57 | `list-screen.ts` | a break does not end a line | **2** | 14 | integration/native-program-list 12, unit/native-program-list 2 |
| 58 | `list-screen.ts` | an ampersand is left as its entity | **1** | 1 | unit/native-program-list 1 |
| 59 | `list-screen.ts` | an icon is read as words | **1** | 2 | unit/native-program-list 2 |
| 60 | `list-screen.ts` | the goal sheet opens on a program that is gone | **1** | 1 | unit/native-program-list 1 |
| 61 | `list-screen.ts` | a pick keeps what was typed for the last one | **1** | 1 | unit/native-program-list 1 |
| 62 | `list-screen.ts` | a typed target forgets the others | **2** | 4 | integration/native-program-list 3, unit/native-program-list 1 |
| 63 | `list-screen.ts` | a program in its first week has started | **2** | 2 | integration/native-program-list 1, unit/native-program-list 1 |
| 64 | `list-screen.ts` | the hybrid path is not read | **2** | 2 | integration/native-program-list 1, unit/native-program-list 1 |
| 65 | `list-screen.ts` | the current goal is not marked | **2** | 6 | integration/native-program-list 5, unit/native-program-list 1 |
| 66 | `list-screen.ts` | the switch always takes a tap | **2** | 5 | integration/native-program-list 3, unit/native-program-list 2 |
| 67 | `list-screen.ts` | the lock stands a week early | **2** | 3 | integration/native-program-list 1, unit/native-program-list 2 |
| 68 | `list-screen.ts` | the lock's days out are counted from the machine's own day | **2** | 2 | integration/native-program-list 1, unit/native-program-list 1 |
| 69 | `list-screen.ts` | the seconds field opens on the minutes | **2** | 3 | integration/native-program-list 2, unit/native-program-list 1 |
| 70 | `list-screen.ts` | a program with no length stored locks as one of nine weeks | **1** | 1 | unit/native-program-list 1 |
| 71 | `list-screen.ts` | a plan change that did not apply is not said | **1** | 1 | unit/native-program-list 1 |
| 72 | `list-screen.ts` | the archive's note is reworded | **1** | 1 | unit/native-program-list 1 |
| 73 | `list-screen.ts` | the archive's question loses its quotes | **1** | 2 | unit/native-program-list 2 |
| 74 | `list-screen.ts` | the delete's warning is reworded | **1** | 2 | unit/native-program-list 2 |
| 75 | `list-screen.ts` | the goal sheet's intro is reworded | **1** | 1 | unit/native-program-list 1 |
| 76 | `list-screen.ts` | This Week opens with no active program | **2** | 2 | integration/native-program-list 1, unit/native-program-list 1 |
| 77 | `list-screen.ts` | Programs is refused with no active program | **1** | 1 | unit/native-program-list 1 |
| 78 | `list-screen.ts` | the refusal's words are not today's | **2** | 2 | integration/native-program-list 1, unit/native-program-list 1 |
| 79 | `list-writes.ts` | today is marked as asked too | **2** | 5 | unit/native-program-list 1, integration/native-program-list 4 |
| 80 | `list-writes.ts` | a marked day is recorded as asked | **2** | 2 | integration/native-program-list 1, unit/native-program-list 1 |
| 81 | `list-writes.ts` | the record is stored when nothing was added | **1** | 1 | unit/native-program-list 1 |
| 82 | `list-writes.ts` | the asked days go under the reminder's day | **2** | 5 | integration/native-program-list 4, unit/native-program-list 1 |
| 83 | `list-writes.ts` | an archived program is set active | **2** | 2 | integration/native-program-list 1, unit/native-program-list 1 |
| 84 | `list-writes.ts` | a switch does not write the pointer | **2** | 5 | unit/native-program-list 1, integration/native-program-list 4 |
| 85 | `list-writes.ts` | Set Active does not mark the past days as asked | **1** | 2 | integration/native-program-list 2 |
| 86 | `list-writes.ts` | Set Active's toast is reworded | **1** | 2 | integration/native-program-list 2 |
| 87 | `list-writes.ts` | a name is cut before it is trimmed | **2** | 3 | unit/native-program-list 1, integration/native-program-list 2 |
| 88 | `list-writes.ts` | a name may run to forty one | **2** | 3 | integration/native-program-list 2, unit/native-program-list 1 |
| 89 | `list-writes.ts` | the same name is stored again | **2** | 2 | integration/native-program-list 1, unit/native-program-list 1 |
| 90 | `list-writes.ts` | a blank name is stored | **2** | 3 | integration/native-program-list 2, unit/native-program-list 1 |
| 91 | `list-writes.ts` | the hand on reads the pointer alone | **1** | 1 | unit/native-program-list 1 |
| 92 | `list-writes.ts` | the hand on reads the program in hand alone | **1** | 1 | unit/native-program-list 1 |
| 93 | `list-writes.ts` | an archived program takes over | **2** | 2 | integration/native-program-list 1, unit/native-program-list 1 |
| 94 | `list-writes.ts` | the hand on does not mark the past days as asked | **1** | 3 | integration/native-program-list 3 |
| 95 | `list-writes.ts` | with no program left the pointer stays | **2** | 3 | integration/native-program-list 1, unit/native-program-list 2 |
| 96 | `list-writes.ts` | an archive is not stamped | **2** | 3 | integration/native-program-list 2, unit/native-program-list 1 |
| 97 | `list-writes.ts` | an archive does not hand on | **2** | 3 | integration/native-program-list 2, unit/native-program-list 1 |
| 98 | `list-writes.ts` | the list is saved after the hand on, over the next program's repair | **1** | 1 | integration/native-program-list 1 |
| 99 | `list-writes.ts` | a deleted program keeps its keys | **2** | 3 | integration/native-program-list 1, unit/native-program-list 2 |
| 100 | `list-writes.ts` | a deleted program stays in the list | **2** | 4 | integration/native-program-list 2, unit/native-program-list 2 |
| 101 | `list-writes.ts` | Delete Forever's toast is reworded | **2** | 4 | integration/native-program-list 2, unit/native-program-list 2 |
| 102 | `list-writes.ts` | a run goal switch drops the mile | **2** | 6 | integration/native-program-list 3, unit/native-program-list 3 |
| 103 | `list-writes.ts` | any sport's switch carries a mile | **1** | 1 | unit/native-program-list 1 |
| 104 | `list-writes.ts` | an empty mile is carried | **1** | 1 | unit/native-program-list 1 |
| 105 | `list-writes.ts` | where the mile came from is not carried | **2** | 2 | integration/native-program-list 1, unit/native-program-list 1 |
| 106 | `list-writes.ts` | the new goal keeps no blank baseline | **2** | 9 | integration/native-program-list 5, unit/native-program-list 4 |
| 107 | `list-writes.ts` | the swim unit is not carried | **2** | 2 | integration/native-program-list 1, unit/native-program-list 1 |
| 108 | `list-writes.ts` | a 500 time lands on the 100 goal's own base | **2** | 2 | integration/native-program-list 1, unit/native-program-list 1 |
| 109 | `list-writes.ts` | the 100 goal hands its 100 time on as a 500 | **2** | 2 | integration/native-program-list 1, unit/native-program-list 1 |
| 110 | `list-writes.ts` | the 500 goal's time is not carried | **2** | 2 | integration/native-program-list 1, unit/native-program-list 1 |
| 111 | `list-writes.ts` | a time of zero is carried | **1** | 1 | unit/native-program-list 1 |
| 112 | `list-writes.ts` | the target's clock is not padded | **2** | 3 | integration/native-program-list 1, unit/native-program-list 2 |
| 113 | `list-writes.ts` | no unit picked is kilometres | **1** | 1 | unit/native-program-list 1 |
| 114 | `list-writes.ts` | a swim time gets a distance | **2** | 2 | integration/native-program-list 1, unit/native-program-list 1 |
| 115 | `list-writes.ts` | the typed minutes are stored as a number | **2** | 3 | integration/native-program-list 1, unit/native-program-list 2 |
| 116 | `list-writes.ts` | a switch with its target missing is made | **2** | 2 | integration/native-program-list 1, unit/native-program-list 1 |
| 117 | `list-writes.ts` | a goal switch rebuilds the program that is not active | **2** | 3 | integration/native-program-list 1, unit/native-program-list 2 |
| 118 | `list-writes.ts` | a goal switch on the active program rebuilds nothing | **1** | 1 | integration/native-program-list 1 |
| 119 | `list-writes.ts` | the goal's toast is reworded | **2** | 6 | integration/native-program-list 5, unit/native-program-list 1 |
| 120 | `list-writes.ts` | one blank field is let through | **2** | 2 | integration/native-program-list 1, unit/native-program-list 1 |
| 121 | `list-writes.ts` | the fields are not trimmed | **1** | 1 | unit/native-program-list 1 |
| 122 | `list-writes.ts` | the mile is stored as typed | **1** | 1 | unit/native-program-list 1 |
| 123 | `list-writes.ts` | the mile's day is cut to its month | **2** | 4 | integration/native-program-list 2, unit/native-program-list 2 |
| 124 | `list-writes.ts` | the mile's week is always the first | **2** | 4 | integration/native-program-list 2, unit/native-program-list 2 |
| 125 | `list-writes.ts` | the mile replaced loses its seconds | **2** | 3 | integration/native-program-list 1, unit/native-program-list 2 |
| 126 | `list-writes.ts` | the mile replaced is never named by its own kind | **1** | 2 | unit/native-program-list 2 |
| 127 | `list-writes.ts` | no mile before reads as entered | **2** | 4 | integration/native-program-list 2, unit/native-program-list 2 |
| 128 | `list-writes.ts` | the chart's advice is dropped from the toast | **2** | 2 | integration/native-program-list 1, unit/native-program-list 1 |
| 129 | `list-writes.ts` | a mile that is no time is saved | **2** | 2 | integration/native-program-list 1, unit/native-program-list 1 |
| 130 | `list-writes.ts` | a new mile rebuilds the program that is not active | **2** | 4 | integration/native-program-list 1, unit/native-program-list 3 |
| 131 | `list-writes.ts` | the other goals are dropped by a new mile | **1** | 1 | unit/native-program-list 1 |
| 132 | `list-writes.ts` | the other goals are dropped by a goal switch | **2** | 2 | integration/native-program-list 1, unit/native-program-list 1 |
| 133 | `Programs.tsx` | a card's tap is not drawn | **1** | 1 | unit/native-program-list 1 |
| 134 | `Programs.tsx` | Save leaves the rename box up | **1** | 1 | unit/native-program-list 1 |
| 135 | `Programs.tsx` | the pencil forgets the name in the box | **1** | 1 | unit/native-program-list 1 |
| 136 | `Programs.tsx` | Set Active stays on the list | **1** | 1 | unit/native-program-list 1 |
| 137 | `Programs.tsx` | Archive leaves its question up | **1** | 1 | unit/native-program-list 1 |
| 138 | `Programs.tsx` | Delete Forever does not tell Progress | **1** | 1 | unit/native-program-list 1 |
| 139 | `Programs.tsx` | a sheet's outcome is not drawn | **1** | 1 | unit/native-program-list 1 |
| 140 | `Programs.tsx` | the active card offers Set Active | **1** | 1 | unit/native-program-list 1 |
| 141 | `Programs.tsx` | a shut card draws its detail | **1** | 1 | unit/native-program-list 1 |
| 142 | `Programs.tsx` | the edge marks the cards that are not active | **1** | 1 | unit/native-program-list 1 |
| 143 | `Programs.tsx` | the est. mark is not drawn | **1** | 1 | unit/native-program-list 1 |
| 144 | `Programs.tsx` | the event is not drawn | **1** | 1 | unit/native-program-list 1 |
| 145 | `Programs.tsx` | a goal's pencil opens the mile | **1** | 1 | unit/native-program-list 1 |
| 146 | `Programs.tsx` | the mile's pencil opens the rename | **1** | 1 | unit/native-program-list 1 |
| 147 | `Programs.tsx` | a name may be typed past forty | **1** | 1 | unit/native-program-list 1 |
| 148 | `Programs.tsx` | the copy button takes a press | **1** | 1 | unit/native-program-list 1 |
| 149 | `Programs.tsx` | Build New Program takes a press | **1** | 1 | unit/native-program-list 1 |
| 150 | `Programs.tsx` | the list jumps to its top at every draw | **1** | 1 | unit/native-program-list 1 |
| 151 | `Programs.tsx` | the empty list's break is drawn as markup | **1** | 1 | unit/native-program-list 1 |
| 152 | `Programs.tsx` | a badge takes the wrong colour | **1** | 1 | unit/native-program-list 1 |
| 153 | `Programs.tsx` | the purge link archives | **1** | 1 | unit/native-program-list 1 |
| 154 | `Programs.tsx` | the mile sheet is opened on yesterday | **1** | 1 | unit/native-program-list 1 |
| 155 | `GoalSheet.tsx` | the current goal takes a press | **1** | 1 | unit/native-program-list 1 |
| 156 | `GoalSheet.tsx` | the current goal can be picked | **1** | 1 | unit/native-program-list 1 |
| 157 | `GoalSheet.tsx` | the switch takes a tap with its target missing | **1** | 1 | unit/native-program-list 1 |
| 158 | `GoalSheet.tsx` | the sheet stays up after the switch | **1** | 1 | unit/native-program-list 1 |
| 159 | `GoalSheet.tsx` | the safer button is not first on a step up | **1** | 1 | unit/native-program-list 1 |
| 160 | `GoalSheet.tsx` | a unit's button types the distance | **1** | 1 | unit/native-program-list 1 |
| 161 | `GoalSheet.tsx` | the current goal is marked as a bigger one | **1** | 1 | unit/native-program-list 1 |
| 162 | `GoalSheet.tsx` | Keep makes the switch | **1** | 1 | unit/native-program-list 1 |
| 163 | `MileSheet.tsx` | a refused mile closes the sheet | **1** | 1 | unit/native-program-list 1 |
| 164 | `MileSheet.tsx` | the minutes open empty | **1** | 1 | unit/native-program-list 1 |
| 165 | `MileSheet.tsx` | the lock draws the edit sheet | **1** | 1 | unit/native-program-list 1 |
| 166 | `MileSheet.tsx` | Keep what I have saves | **1** | 1 | unit/native-program-list 1 |
| 167 | `MileSheet.tsx` | the lock's facts are not drawn | **1** | 1 | unit/native-program-list 1 |
| 168 | `SheetFrame.tsx` | a sheet leaves twice | **1** | 1 | unit/native-program-list 1 |
| 169 | `SheetFrame.tsx` | Reduce Motion still slides | **1** | 1 | unit/native-program-list 1 |
| 170 | `App.tsx` | the Programs tab is named Home | **1** | 1 | unit/native-program-list 1 |
| 171 | `App.tsx` | a sheet is not drawn | **1** | 1 | unit/native-program-list 1 |
| 172 | `App.tsx` | Set Active ends on Progress | **1** | 1 | unit/native-program-list 1 |
| 173 | `App.tsx` | the list forgets what it kept at every draw of the app | **1** | 1 | unit/native-program-list 1 |
| 174 | `App.tsx` | a long toast is cut to one line | **1** | 1 | unit/native-program-list 1 |
| 175 | `App.tsx` | a refused tab opens all the same | **1** | 1 | unit/native-program-list 1 |
| 176 | `App.tsx` | a tap on the tab does not draw the list afresh | **1** | 1 | unit/native-program-list 1 |
| 177 | `program-list-model.ts` | the list's model is changed | **2** | 14 | integration/native-program-list 12, unit/native-program-list 2 |
| 178 | `program-detail-model.ts` | the detail's model is changed | **2** | 2 | integration/native-program-list 1, unit/native-program-list 1 |
| 179 | `goal-sheet-model.ts` | the goal sheet's model is changed | **2** | 6 | integration/native-program-list 4, unit/native-program-list 2 |
| 180 | `mile-sheet-model.ts` | the mile sheet's model is changed | **2** | 4 | integration/native-program-list 1, unit/native-program-list 3 |

- Breaks made: **180** of 180. Let through by the fast files, so swept: 0. Let through by every file: **0**.
