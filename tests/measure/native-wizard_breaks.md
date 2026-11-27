# The Expo app's wizard and Generate: a break per rule, and the test files each turns red

Written by `node tests/measure/native-wizard_breaks.mjs` (read-only here; each break is made in a copy of the tree and put back).

- The fast files, run on each break: `unit/native-wizard.test.ts`, `integration/native-wizard.test.ts`, `unit/native-program-list.test.ts`, `unit/native-change-sheet.test.ts`, `unit/native-look.test.ts`. Unbroken, they hold 235 tests and all pass.
- The sweep, run only on a break the fast files let through: `sweeps/native-wizard.test.ts` (46 tests, all passing unbroken).

| # | File | The rule broken | Files red | Tests red | Which |
|---|---|---|---|---|---|
| 1 | `wizard-readers.ts` | today is the day after | **2** | 23 | integration/native-wizard 12, unit/native-wizard 11 |
| 2 | `wizard-readers.ts` | the draft opens on the race path | **2** | 14 | integration/native-wizard 12, unit/native-wizard 2 |
| 3 | `wizard-readers.ts` | the draft opens with no race date asked for | **2** | 26 | integration/native-wizard 12, unit/native-wizard 14 |
| 4 | `wizard-readers.ts` | the draft opens as a beginner's | **2** | 16 | integration/native-wizard 12, unit/native-wizard 4 |
| 5 | `wizard-readers.ts` | the draft opens in kilos | **2** | 13 | integration/native-wizard 12, unit/native-wizard 1 |
| 6 | `wizard-readers.ts` | the draft opens with no start | **2** | 13 | integration/native-wizard 12, unit/native-wizard 1 |
| 7 | `wizard-readers.ts` | the draft opens with a bench number | **2** | 13 | integration/native-wizard 12, unit/native-wizard 1 |
| 8 | `wizard-readers.ts` | the draft's training days leave Sunday out | **2** | 13 | integration/native-wizard 12, unit/native-wizard 1 |
| 9 | `wizard-readers.ts` | a lifting focus is named otherwise | **1** | 4 | integration/native-wizard 4 |
| 10 | `wizard-readers.ts` | a support focus loses a word | **1** | 6 | integration/native-wizard 6 |
| 11 | `wizard-readers.ts` | a focus draws another icon | **1** | 4 | integration/native-wizard 4 |
| 12 | `wizard-readers.ts` | size training is most effective with three days | **1** | 1 | unit/native-wizard 1 |
| 13 | `wizard-readers.ts` | a marathon trains best with four days | **1** | 1 | unit/native-wizard 1 |
| 14 | `wizard-readers.ts` | a half marathon's floor is three | **2** | 3 | integration/native-wizard 2, unit/native-wizard 1 |
| 15 | `wizard-readers.ts` | a swum mile's floor is three | **1** | 2 | unit/native-wizard 2 |
| 16 | `wizard-readers.ts` | a century's floor is three | **1** | 1 | unit/native-wizard 1 |
| 17 | `wizard-readers.ts` | a goal no table holds has no name | **1** | 1 | unit/native-wizard 1 |
| 18 | `wizard-readers.ts` | a goal is looked up by its name | **1** | 3 | unit/native-wizard 3 |
| 19 | `wizard-readers.ts` | the lifting advisory fires at its own number | **2** | 2 | integration/native-wizard 1, unit/native-wizard 1 |
| 20 | `wizard-readers.ts` | the lifting advisory's focus has no capital | **1** | 1 | unit/native-wizard 1 |
| 21 | `wizard-readers.ts` | the lifting advisory keeps support_ in the name | **1** | 1 | unit/native-wizard 1 |
| 22 | `wizard-readers.ts` | the lifting advisory's words | **1** | 1 | unit/native-wizard 1 |
| 23 | `wizard-readers.ts` | the cardio advisory fires at its own number | **1** | 5 | sweeps/native-wizard 5 (the sweep was run) |
| 24 | `wizard-readers.ts` | the cardio advisory's words | **1** | 1 | unit/native-wizard 1 |
| 25 | `wizard-readers.ts` | the interval advisory asks for two days | **1** | 2 | sweeps/native-wizard 2 (the sweep was run) |
| 26 | `wizard-readers.ts` | the interval advisory for any goal | **1** | 1 | unit/native-wizard 1 |
| 27 | `wizard-readers.ts` | the interval advisory reads two sports as one | **1** | 1 | unit/native-wizard 1 |
| 28 | `wizard-readers.ts` | the interval advisory's fixes are swapped | **1** | 1 | unit/native-wizard 1 |
| 29 | `wizard-readers.ts` | the interval advisory says 1 running days | **1** | 2 | sweeps/native-wizard 2 (the sweep was run) |
| 30 | `wizard-readers.ts` | the interval advisory's icon size | **1** | 1 | unit/native-wizard 1 |
| 31 | `wizard-readers.ts` | the floor is two | **2** | 4 | integration/native-wizard 1, unit/native-wizard 3 |
| 32 | `wizard-readers.ts` | the floor is the lowest of the goals' | **2** | 5 | integration/native-wizard 2, unit/native-wizard 3 |
| 33 | `wizard-readers.ts` | the floor counts a goal of a sport not chosen | **1** | 1 | unit/native-wizard 1 |
| 34 | `wizard-readers.ts` | the floor's toast joins goals with and | **1** | 1 | unit/native-wizard 1 |
| 35 | `wizard-readers.ts` | the floor's toast with a goal loses its tail | **1** | 1 | unit/native-wizard 1 |
| 36 | `wizard-readers.ts` | the floor's toast with no goal | **2** | 3 | integration/native-wizard 1, unit/native-wizard 2 |
| 37 | `wizard-readers.ts` | a span's dash | **2** | 4 | integration/native-wizard 2, unit/native-wizard 2 |
| 38 | `wizard-readers.ts` | a week ends on its Saturday | **2** | 4 | integration/native-wizard 2, unit/native-wizard 2 |
| 39 | `wizard-readers.ts` | the week that holds the test is not said | **1** | 2 | unit/native-wizard 2 |
| 40 | `wizard-readers.ts` | the week that holds the test loses its last sentence | **1** | 2 | unit/native-wizard 2 |
| 41 | `wizard-readers.ts` | a moved start is not said | **2** | 3 | integration/native-wizard 2, unit/native-wizard 1 |
| 42 | `wizard-readers.ts` | a moved start's words | **2** | 3 | integration/native-wizard 2, unit/native-wizard 1 |
| 43 | `wizard-readers.ts` | a short week is not said | **2** | 9 | integration/native-wizard 7, unit/native-wizard 2 |
| 44 | `wizard-readers.ts` | a short week's days are a day late | **2** | 9 | integration/native-wizard 7, unit/native-wizard 2 |
| 45 | `wizard-readers.ts` | a short week of one day is listed as several | **2** | 4 | integration/native-wizard 2, unit/native-wizard 2 |
| 46 | `wizard-readers.ts` | a short week's last day joins with a comma | **2** | 7 | integration/native-wizard 6, unit/native-wizard 1 |
| 47 | `wizard-readers.ts` | a short week's full week starts this Monday | **2** | 9 | integration/native-wizard 7, unit/native-wizard 2 |
| 48 | `wizard-readers.ts` | a whole week's words | **2** | 3 | integration/native-wizard 1, unit/native-wizard 2 |
| 49 | `wizard-readers.ts` | the summary's start set by a race says nothing of it | **2** | 5 | integration/native-wizard 3, unit/native-wizard 2 |
| 50 | `wizard-readers.ts` | the summary's start never says short first week | **2** | 11 | integration/native-wizard 7, unit/native-wizard 4 |
| 51 | `wizard-readers.ts` | the summary's start has no year | **2** | 11 | integration/native-wizard 7, unit/native-wizard 4 |
| 52 | `wizard-readers.ts` | a race plan is not counted back on the hybrid path | **1** | 1 | unit/native-wizard 1 |
| 53 | `wizard-readers.ts` | a race plan is counted back on the strength path too | **1** | 1 | unit/native-wizard 1 |
| 54 | `wizard-readers.ts` | a race plan is counted back with no race date asked for | **1** | 1 | unit/native-wizard 1 |
| 55 | `wizard-readers.ts` | a race plan without the run chosen | **1** | 1 | unit/native-wizard 1 |
| 56 | `wizard-readers.ts` | the summary reads the resolver's start under a race date | **2** | 4 | integration/native-wizard 3, unit/native-wizard 1 |
| 57 | `wizard-readers.ts` | the test pin forgets the week that holds the test | **2** | 2 | integration/native-wizard 1, unit/native-wizard 1 |
| 58 | `wizard-readers.ts` | the test pin counts from the day entered | **1** | 1 | integration/native-wizard 1 |
| 59 | `wizard-readers.ts` | the test pin's resolver is not told the test date | **2** | 2 | integration/native-wizard 1, unit/native-wizard 1 |
| 60 | `wizard-readers.ts` | the half is called Half | **1** | 4 | integration/native-wizard 4 |
| 61 | `wizard-readers.ts` | the shorter plan's name is its id | **2** | 3 | integration/native-wizard 2, unit/native-wizard 1 |
| 62 | `wizard-readers.ts` | 1 weeks out | **1** | 2 | integration/native-wizard 2 |
| 63 | `wizard-readers.ts` | a plan that starts later is not said | **2** | 6 | integration/native-wizard 4, unit/native-wizard 2 |
| 64 | `wizard-readers.ts` | 1 weeks from now | **1** | 2 | integration/native-wizard 2 |
| 65 | `wizard-readers.ts` | a plan that starts later loses its advice | **2** | 5 | integration/native-wizard 4, unit/native-wizard 1 |
| 66 | `wizard-readers.ts` | the opening week is the plan's last | **2** | 3 | integration/native-wizard 2, unit/native-wizard 1 |
| 67 | `wizard-readers.ts` | race week's number is the opening week's | **2** | 3 | integration/native-wizard 2, unit/native-wizard 1 |
| 68 | `wizard-readers.ts` | the weeks behind are not said | **2** | 3 | integration/native-wizard 2, unit/native-wizard 1 |
| 69 | `wizard-readers.ts` | race day pins to its key | **2** | 3 | integration/native-wizard 2, unit/native-wizard 1 |
| 70 | `wizard-readers.ts` | under the floor is not said | **2** | 3 | integration/native-wizard 2, unit/native-wizard 1 |
| 71 | `wizard-readers.ts` | under the floor names the plan's weeks | **2** | 3 | integration/native-wizard 2, unit/native-wizard 1 |
| 72 | `wizard-readers.ts` | the shorter plan is not offered | **2** | 3 | integration/native-wizard 2, unit/native-wizard 1 |
| 73 | `wizard-readers.ts` | the 100 goal's times are not checked | **2** | 4 | integration/native-wizard 3, unit/native-wizard 1 |
| 74 | `wizard-readers.ts` | sixty seconds is a count of seconds | **2** | 2 | integration/native-wizard 1, unit/native-wizard 1 |
| 75 | `wizard-readers.ts` | sixty minutes is refused | **2** | 2 | integration/native-wizard 1, unit/native-wizard 1 |
| 76 | `wizard-readers.ts` | the swim's not a time words | **2** | 3 | integration/native-wizard 1, unit/native-wizard 2 |
| 77 | `wizard-readers.ts` | the 100 goal reads its 100 as its 500 | **2** | 4 | integration/native-wizard 3, unit/native-wizard 1 |
| 78 | `wizard-readers.ts` | the 500 required loses its unit | **2** | 7 | integration/native-wizard 4, unit/native-wizard 3 |
| 79 | `wizard-readers.ts` | the swim unit is metres unless said | **2** | 7 | integration/native-wizard 4, unit/native-wizard 3 |
| 80 | `wizard-readers.ts` | the 100 is not required | **2** | 3 | integration/native-wizard 2, unit/native-wizard 1 |
| 81 | `wizard-readers.ts` | a 500 pace level with the 100 is refused | **1** | 1 | unit/native-wizard 1 |
| 82 | `wizard-readers.ts` | a slower 500 pace is refused | **2** | 4 | integration/native-wizard 3, unit/native-wizard 1 |
| 83 | `wizard-readers.ts` | a lift only program is four weeks | **2** | 3 | integration/native-wizard 1, unit/native-wizard 2 |
| 84 | `wizard-readers.ts` | the name step's length forgets the test week | **2** | 3 | integration/native-wizard 2, unit/native-wizard 1 |
| 85 | `wizard-readers.ts` | the default name counts the stored programs alone | **2** | 7 | integration/native-wizard 6, unit/native-wizard 1 |
| 86 | `wizard-readers.ts` | a draft with no name stays unnamed | **2** | 7 | integration/native-wizard 6, unit/native-wizard 1 |
| 87 | `wizard-readers.ts` | the default name carries the focus's id | **2** | 7 | integration/native-wizard 6, unit/native-wizard 1 |
| 88 | `wizard-readers.ts` | a draft with no start stays without one | **2** | 2 | integration/native-wizard 1, unit/native-wizard 1 |
| 89 | `wizard-readers.ts` | the cardio row's Lift only | **2** | 2 | integration/native-wizard 1, unit/native-wizard 1 |
| 90 | `wizard-readers.ts` | the cardio row joins sports with a comma | **1** | 3 | integration/native-wizard 3 |
| 91 | `wizard-readers.ts` | the cardio row leaves the goal out | **2** | 7 | integration/native-wizard 6, unit/native-wizard 1 |
| 92 | `wizard-readers.ts` | the cardio row's icon size | **2** | 10 | integration/native-wizard 9, unit/native-wizard 1 |
| 93 | `wizard-readers.ts` | the race date row on any path | **2** | 3 | unit/native-wizard 1, integration/native-wizard 2 |
| 94 | `wizard-readers.ts` | race day reads as away | **2** | 3 | integration/native-wizard 2, unit/native-wizard 1 |
| 95 | `wizard-readers.ts` | the race date row has no year | **2** | 7 | integration/native-wizard 6, unit/native-wizard 1 |
| 96 | `wizard-readers.ts` | no date set's words | **2** | 4 | integration/native-wizard 3, unit/native-wizard 1 |
| 97 | `wizard-readers.ts` | no date set on any path | **2** | 5 | integration/native-wizard 3, unit/native-wizard 2 |
| 98 | `wizard-readers.ts` | a start under the floor is not marked | **2** | 2 | integration/native-wizard 1, unit/native-wizard 1 |
| 99 | `wizard-readers.ts` | a start set by a race has no year | **2** | 4 | integration/native-wizard 3, unit/native-wizard 1 |
| 100 | `wizard-readers.ts` | a start set by a race keeps the field's sentence | **1** | 1 | unit/native-wizard 1 |
| 101 | `wizard-readers.ts` | a start set by a race draws no pips | **2** | 2 | integration/native-wizard 1, unit/native-wizard 1 |
| 102 | `wizard-readers.ts` | the summary's start row reads the resolver's | **1** | 3 | integration/native-wizard 3 |
| 103 | `wizard-screen.ts` | the wizard opens on its second step | **2** | 15 | integration/native-wizard 12, unit/native-wizard 3 |
| 104 | `wizard-screen.ts` | Back leaves from the second step | **2** | 5 | integration/native-wizard 4, unit/native-wizard 1 |
| 105 | `wizard-screen.ts` | Back does not skip the cardio goals on the strength path | **2** | 3 | integration/native-wizard 2, unit/native-wizard 1 |
| 106 | `wizard-screen.ts` | Continue does not skip the cardio goals on the strength path | **2** | 3 | integration/native-wizard 2, unit/native-wizard 1 |
| 107 | `wizard-screen.ts` | Continue walks past the last step | **2** | 10 | integration/native-wizard 8, unit/native-wizard 2 |
| 108 | `wizard-screen.ts` | the hybrid path skips the cardio goals too | **2** | 6 | integration/native-wizard 5, unit/native-wizard 1 |
| 109 | `wizard-screen.ts` | a unit writes nothing | **2** | 2 | integration/native-wizard 1, unit/native-wizard 1 |
| 110 | `wizard-screen.ts` | a training day rests below the floor | **2** | 3 | integration/native-wizard 1, unit/native-wizard 2 |
| 111 | `wizard-screen.ts` | the floor's toast carries a lock | **2** | 3 | integration/native-wizard 1, unit/native-wizard 2 |
| 112 | `wizard-screen.ts` | a resting day at the floor stays resting | **2** | 2 | integration/native-wizard 1, unit/native-wizard 1 |
| 113 | `wizard-screen.ts` | a resting day does not come back | **2** | 2 | integration/native-wizard 1, unit/native-wizard 1 |
| 114 | `wizard-screen.ts` | a rested day goes to the front of the list | **2** | 4 | integration/native-wizard 3, unit/native-wizard 1 |
| 115 | `wizard-screen.ts` | the training days do not follow the rest days | **2** | 5 | integration/native-wizard 4, unit/native-wizard 1 |
| 116 | `wizard-screen.ts` | the floor's toast mark is a size up | **2** | 2 | integration/native-wizard 1, unit/native-wizard 1 |
| 117 | `wizard-screen.ts` | a sport shut keeps its goal | **2** | 3 | integration/native-wizard 2, unit/native-wizard 1 |
| 118 | `wizard-screen.ts` | a sport opened goes to the front | **2** | 7 | integration/native-wizard 6, unit/native-wizard 1 |
| 119 | `wizard-screen.ts` | Lift Only keeps the goals | **1** | 1 | unit/native-wizard 1 |
| 120 | `wizard-screen.ts` | Lift Only keeps the sports | **2** | 2 | unit/native-wizard 1, integration/native-wizard 1 |
| 121 | `wizard-screen.ts` | the name is trimmed as typed | **2** | 2 | integration/native-wizard 1, unit/native-wizard 1 |
| 122 | `wizard-screen.ts` | a blank start is not written | **2** | 3 | integration/native-wizard 1, unit/native-wizard 2 |
| 123 | `wizard-screen.ts` | the landing always shows the launch's title | **2** | 2 | integration/native-wizard 1, unit/native-wizard 1 |
| 124 | `wizard-screen.ts` | the landing always shows the first title | **2** | 2 | integration/native-wizard 1, unit/native-wizard 1 |
| 125 | `wizard-screen.ts` | the landing holds the week holding today as its own | **2** | 2 | integration/native-wizard 1, unit/native-wizard 1 |
| 126 | `wizard-screen.ts` | a start set by a race is repainted | **1** | 1 | unit/native-wizard 1 |
| 127 | `wizard-screen.ts` | the repaint leaves the field's day as it was | **1** | 1 | unit/native-wizard 1 |
| 128 | `wizard-screen.ts` | the repaint leaves the sentence as it was | **1** | 1 | unit/native-wizard 1 |
| 129 | `wizard-screen.ts` | the repaint leaves the start row as it was | **1** | 1 | unit/native-wizard 1 |
| 130 | `wizard-screen.ts` | the repainted row loses its span | **1** | 1 | unit/native-wizard 1 |
| 131 | `wizard-screen.ts` | the repaint's resolver is not told the test date | **1** | 1 | unit/native-wizard 1 |
| 132 | `wizard-screen.ts` | the date field shows no year | **1** | 1 | unit/native-wizard 1 |
| 133 | `wizard-screen.ts` | a bold run is not bold | **1** | 2 | unit/native-wizard 2 |
| 134 | `wizard-screen.ts` | the shorter plan's link is plain words | **2** | 3 | integration/native-wizard 2, unit/native-wizard 1 |
| 135 | `wizard-screen.ts` | an icon is dropped from a line | **1** | 1 | unit/native-wizard 1 |
| 136 | `wizard-screen.ts` | a line keeps its tags as words | **1** | 1 | unit/native-wizard 1 |
| 137 | `wizard-screen.ts` | the words after the last run are dropped | **1** | 2 | unit/native-wizard 2 |
| 138 | `wizard-screen.ts` | the cardio goals do not prepare the draft | **2** | 12 | integration/native-wizard 9, unit/native-wizard 3 |
| 139 | `cardio-goal-model.ts` | the goal the draft holds is not marked | **2** | 9 | integration/native-wizard 7, unit/native-wizard 2 |
| 140 | `wizard-screen.ts` | the hybrid path lists the taper goals | **2** | 6 | integration/native-wizard 5, unit/native-wizard 1 |
| 141 | `cardio-goal-model.ts` | every sport is drawn shut | **2** | 19 | integration/native-wizard 10, unit/native-wizard 9 |
| 142 | `wizard-screen.ts` | the equipment step draws the paths | **1** | 11 | integration/native-wizard 11 |
| 143 | `wizard-screen.ts` | the lifting step reads no path's focuses | **1** | 9 | integration/native-wizard 9 |
| 144 | `wizard-screen.ts` | the rest days' floor is always three | **1** | 2 | unit/native-wizard 2 |
| 145 | `wizard-screen.ts` | the rest days are handed no advisories | **1** | 1 | unit/native-wizard 1 |
| 146 | `wizard-screen.ts` | the bar counts every path as seven steps | **2** | 13 | integration/native-wizard 12, unit/native-wizard 1 |
| 147 | `wizard-screen.ts` | a path step's line loses its mark | **2** | 13 | integration/native-wizard 12, unit/native-wizard 1 |
| 148 | `wizard-screen.ts` | the experience's label | **1** | 11 | integration/native-wizard 11 |
| 149 | `wizard-screen.ts` | the equipment's line | **1** | 11 | integration/native-wizard 11 |
| 150 | `wizard-screen.ts` | the cardio goals' line | **1** | 10 | integration/native-wizard 10 |
| 151 | `wizard-screen.ts` | Lift Only's words | **2** | 3 | integration/native-wizard 2, unit/native-wizard 1 |
| 152 | `wizard-screen.ts` | the add-on's heading | **2** | 3 | integration/native-wizard 2, unit/native-wizard 1 |
| 153 | `wizard-screen.ts` | the rest days' legend | **1** | 8 | integration/native-wizard 8 |
| 154 | `wizard-screen.ts` | the floor's heading | **2** | 2 | integration/native-wizard 1, unit/native-wizard 1 |
| 155 | `wizard-screen.ts` | the floor's words with a goal | **1** | 5 | sweeps/native-wizard 5 (the sweep was run) |
| 156 | `wizard-screen.ts` | the floor's words with no goal | **2** | 2 | integration/native-wizard 1, unit/native-wizard 1 |
| 157 | `wizard-screen.ts` | the name step's line | **1** | 9 | integration/native-wizard 9 |
| 158 | `wizard-screen.ts` | the derived start's source | **2** | 4 | integration/native-wizard 3, unit/native-wizard 1 |
| 159 | `wizard-screen.ts` | the summary's heading | **2** | 10 | unit/native-wizard 1, integration/native-wizard 9 |
| 160 | `wizard-screen.ts` | Back's words | **1** | 1 | unit/native-wizard 1 |
| 161 | `wizard-writes.ts` | the length never warns | **2** | 6 | integration/native-wizard 5, unit/native-wizard 1 |
| 162 | `wizard-writes.ts` | the pop-up's length is a week long | **2** | 6 | integration/native-wizard 5, unit/native-wizard 1 |
| 163 | `wizard-writes.ts` | the pop-up's kicker | **2** | 6 | integration/native-wizard 5, unit/native-wizard 1 |
| 164 | `wizard-writes.ts` | the pop-up's title | **2** | 6 | integration/native-wizard 5, unit/native-wizard 1 |
| 165 | `wizard-writes.ts` | the pop-up's first words | **2** | 6 | integration/native-wizard 5, unit/native-wizard 1 |
| 166 | `wizard-writes.ts` | the pop-up's bold run | **2** | 6 | unit/native-wizard 1, integration/native-wizard 5 |
| 167 | `wizard-writes.ts` | the pop-up's last words | **2** | 6 | integration/native-wizard 5, unit/native-wizard 1 |
| 168 | `wizard-writes.ts` | Go Back's words | **2** | 6 | integration/native-wizard 5, unit/native-wizard 1 |
| 169 | `wizard-writes.ts` | Build's words | **2** | 6 | integration/native-wizard 5, unit/native-wizard 1 |
| 170 | `wizard-writes.ts` | the mile is not checked | **2** | 3 | integration/native-wizard 2, unit/native-wizard 1 |
| 171 | `wizard-writes.ts` | the swim times are not checked | **2** | 2 | integration/native-wizard 1, unit/native-wizard 1 |
| 172 | `wizard-writes.ts` | the mile is checked as a beginner's | **2** | 2 | integration/native-wizard 1, unit/native-wizard 1 |
| 173 | `wizard-writes.ts` | the swim is checked before the mile | **1** | 1 | unit/native-wizard 1 |
| 174 | `wizard-writes.ts` | the generating screen's title | **1** | 1 | unit/native-wizard 1 |
| 175 | `wizard-writes.ts` | a line every 400 ms | **1** | 1 | unit/native-wizard 1 |
| 176 | `wizard-writes.ts` | the build at two seconds | **1** | 1 | unit/native-wizard 1 |
| 177 | `wizard-writes.ts` | This Week half a second after | **1** | 1 | unit/native-wizard 1 |
| 178 | `wizard-writes.ts` | the ready line | **2** | 9 | integration/native-wizard 7, unit/native-wizard 2 |
| 179 | `wizard-writes.ts` | the error line | **1** | 1 | unit/native-wizard 1 |
| 180 | `wizard-writes.ts` | the test week is not written on the draft | **2** | 2 | integration/native-wizard 1, unit/native-wizard 1 |
| 181 | `wizard-writes.ts` | a pin from an earlier try survives | **1** | 1 | unit/native-wizard 1 |
| 182 | `wizard-writes.ts` | the length that builds forgets the test week | **2** | 2 | integration/native-wizard 1, unit/native-wizard 1 |
| 183 | `wizard-writes.ts` | the lines name the goals' length under a test | **2** | 2 | integration/native-wizard 1, unit/native-wizard 1 |
| 184 | `wizard-writes.ts` | the pin counts from the day entered | **1** | 1 | unit/native-wizard 1 |
| 185 | `wizard-writes.ts` | the pin's resolver is not told the test date | **1** | 1 | unit/native-wizard 1 |
| 186 | `wizard-writes.ts` | the first line's words | **2** | 8 | integration/native-wizard 7, unit/native-wizard 1 |
| 187 | `wizard-writes.ts` | the first of the six lines | **2** | 8 | integration/native-wizard 7, unit/native-wizard 1 |
| 188 | `wizard-writes.ts` | the third of the six lines | **1** | 1 | unit/native-wizard 1 |
| 189 | `wizard-writes.ts` | the fifth line leaves the length out | **1** | 1 | unit/native-wizard 1 |
| 190 | `wizard-writes.ts` | five lines | **2** | 8 | integration/native-wizard 7, unit/native-wizard 1 |
| 191 | `wizard-writes.ts` | a race plan starts on race week's Monday | **2** | 4 | integration/native-wizard 3, unit/native-wizard 1 |
| 192 | `wizard-writes.ts` | a race plan has no day it opened | **2** | 4 | integration/native-wizard 3, unit/native-wizard 1 |
| 193 | `wizard-writes.ts` | a race plan's start is counted back with no race date asked for | **1** | 1 | unit/native-wizard 1 |
| 194 | `wizard-writes.ts` | any other start is the day entered | **1** | 1 | unit/native-wizard 1 |
| 195 | `wizard-writes.ts` | the start's resolver is not told the test date | **1** | 1 | sweeps/native-wizard 1 (the sweep was run) |
| 196 | `wizard-writes.ts` | the wizard's start stays in the stored config | **2** | 9 | integration/native-wizard 7, unit/native-wizard 2 |
| 197 | `wizard-writes.ts` | the start is not applied | **2** | 8 | unit/native-wizard 1, integration/native-wizard 7 |
| 198 | `wizard-writes.ts` | the new program goes first in the list | **2** | 2 | integration/native-wizard 1, unit/native-wizard 1 |
| 199 | `wizard-writes.ts` | the list is not stored | **2** | 9 | unit/native-wizard 2, integration/native-wizard 7 |
| 200 | `wizard-writes.ts` | the ready line names six weeks | **1** | 4 | integration/native-wizard 4 |
| 201 | `wizard-writes.ts` | the program handed back is the one built, not the one loaded | **1** | 7 | integration/native-wizard 7 |
| 202 | `generating-figure.ts` | a squat every 1.2 s | **1** | 2 | unit/native-wizard 2 |
| 203 | `generating-figure.ts` | the bar sinks 10 | **1** | 1 | unit/native-wizard 1 |
| 204 | `generating-figure.ts` | the squat moves at one speed | **1** | 1 | unit/native-wizard 1 |
| 205 | `generating-figure.ts` | the figure never comes back up | **1** | 1 | unit/native-wizard 1 |
| 206 | `generating-figure.ts` | the left knee folds less | **1** | 1 | unit/native-wizard 1 |
| 207 | `generating-figure.ts` | the right leg stands otherwise | **1** | 1 | unit/native-wizard 1 |
| 208 | `generating-figure.ts` | the first spark shows on the way down | **1** | 1 | unit/native-wizard 1 |
| 209 | `generating-figure.ts` | the second spark is the first's size | **1** | 1 | unit/native-wizard 1 |
| 210 | `generating-figure.ts` | the second spark flies the other way | **1** | 1 | unit/native-wizard 1 |
| 211 | `generating-figure.ts` | the ease is not the page's | **1** | 2 | unit/native-wizard 2 |
| 212 | `generating-figure.ts` | a value jumps to its next key | **1** | 1 | unit/native-wizard 1 |
| 213 | `wizard-model.ts` | wizard-model.ts is not today's: the count is spaced | **2** | 14 | integration/native-wizard 12, unit/native-wizard 2 |
| 214 | `cardio-goal-model.ts` | cardio-goal-model.ts is not today's: no race date is written | **2** | 12 | integration/native-wizard 9, unit/native-wizard 3 |
| 215 | `Wizard.tsx` | Back's words are not drawn | **1** | 1 | unit/native-wizard 1 |
| 216 | `Wizard.tsx` | the bar does not fill | **1** | 1 | unit/native-wizard 1 |
| 217 | `Wizard.tsx` | the count is not drawn | **1** | 1 | unit/native-wizard 1 |
| 218 | `Wizard.tsx` | the last button's words are not the shell's | **1** | 1 | unit/native-wizard 1 |
| 219 | `Wizard.tsx` | Back's press goes on | **1** | 1 | unit/native-wizard 1 |
| 220 | `Wizard.tsx` | the last button's press goes back | **1** | 1 | unit/native-wizard 1 |
| 221 | `Wizard.tsx` | Back on the first step stays | **1** | 1 | unit/native-wizard 1 |
| 222 | `Wizard.tsx` | Continue draws nothing | **1** | 1 | unit/native-wizard 1 |
| 223 | `Wizard.tsx` | Generate skips the length's pop-up | **1** | 1 | unit/native-wizard 1 |
| 224 | `Wizard.tsx` | Generate skips the refusals | **1** | 1 | unit/native-wizard 1 |
| 225 | `Wizard.tsx` | a refusal is not said | **1** | 1 | unit/native-wizard 1 |
| 226 | `Wizard.tsx` | the floor's toast loses its mark | **1** | 1 | unit/native-wizard 1 |
| 227 | `Wizard.tsx` | a draw is made on every React draw, not when a tap asks | **1** | 1 | unit/native-wizard 1 |
| 228 | `Wizard.tsx` | the title's size is fixed | **1** | 1 | unit/native-wizard 1 |
| 229 | `Wizard.tsx` | a title's words are not drawn | **1** | 1 | unit/native-wizard 1 |
| 230 | `Wizard.tsx` | the title has no line of WebKit's | **1** | 1 | unit/native-wizard 1 |
| 231 | `Wizard.tsx` | the line under a title is not drawn | **1** | 1 | unit/native-wizard 1 |
| 232 | `Wizard.tsx` | the path step's title and line are swapped | **1** | 1 | unit/native-wizard 1 |
| 233 | `Wizard.tsx` | About you's title is the path step's | **1** | 1 | unit/native-wizard 1 |
| 234 | `Wizard.tsx` | the equipment's title is not drawn | **1** | 1 | unit/native-wizard 1 |
| 235 | `Wizard.tsx` | the cardio goals' line is not drawn | **1** | 1 | unit/native-wizard 1 |
| 236 | `Wizard.tsx` | the lifting focus's line is not the path's | **1** | 1 | unit/native-wizard 1 |
| 237 | `Wizard.tsx` | the rest days' title is not drawn | **1** | 1 | unit/native-wizard 1 |
| 238 | `Wizard.tsx` | the name step's title is not drawn | **1** | 1 | unit/native-wizard 1 |
| 239 | `Wizard.tsx` | a card's icon is not drawn | **1** | 1 | unit/native-wizard 1 |
| 240 | `Wizard.tsx` | a chosen card's name stays in the text colour | **1** | 1 | unit/native-wizard 1 |
| 241 | `Wizard.tsx` | a card's line is not drawn | **1** | 1 | unit/native-wizard 1 |
| 242 | `Wizard.tsx` | a card's line breaks at a slash | **1** | 1 | unit/native-wizard 1 |
| 243 | `Wizard.tsx` | a path card's second line is not drawn | **1** | 1 | unit/native-wizard 1 |
| 244 | `Wizard.tsx` | a chosen card has no edge | **1** | 1 | unit/native-wizard 1 |
| 245 | `Wizard.tsx` | a path's tap draws nothing | **1** | 1 | unit/native-wizard 1 |
| 246 | `Wizard.tsx` | an experience's tap writes the age | **1** | 1 | unit/native-wizard 1 |
| 247 | `Wizard.tsx` | an experience's icon is the path's size | **1** | 1 | unit/native-wizard 1 |
| 248 | `Wizard.tsx` | an age's tap writes the experience | **1** | 1 | unit/native-wizard 1 |
| 249 | `Wizard.tsx` | an age's icon is not drawn | **1** | 1 | unit/native-wizard 1 |
| 250 | `Wizard.tsx` | an age's name is not drawn | **1** | 1 | unit/native-wizard 1 |
| 251 | `Wizard.tsx` | the experience's label is the age's | **1** | 1 | unit/native-wizard 1 |
| 252 | `Wizard.tsx` | the age's label is not drawn | **1** | 1 | unit/native-wizard 1 |
| 253 | `Wizard.tsx` | the units' label is not drawn | **1** | 1 | unit/native-wizard 1 |
| 254 | `Wizard.tsx` | both units are filled alike | **1** | 1 | unit/native-wizard 1 |
| 255 | `Wizard.tsx` | a unit's tap draws nothing | **1** | 1 | unit/native-wizard 1 |
| 256 | `Wizard.tsx` | the experience's hint is not drawn | **1** | 1 | unit/native-wizard 1 |
| 257 | `Wizard.tsx` | the age's hint is the experience's | **1** | 1 | unit/native-wizard 1 |
| 258 | `Wizard.tsx` | an equipment's tap writes the path | **1** | 1 | unit/native-wizard 1 |
| 259 | `Wizard.tsx` | an equipment's line is not handed on | **1** | 1 | unit/native-wizard 1 |
| 260 | `Wizard.tsx` | a row card's name is not drawn | **1** | 1 | unit/native-wizard 1 |
| 261 | `Wizard.tsx` | a row card's line is always drawn | **1** | 1 | unit/native-wizard 1 |
| 262 | `Wizard.tsx` | a card's name stands at iOS's own line | **1** | 1 | unit/native-wizard 1 |
| 263 | `Wizard.tsx` | a card's name keeps the pixel iOS adds | **1** | 1 | unit/native-wizard 1 |
| 264 | `Wizard.tsx` | the pixel given back is a whole point | **1** | 1 | unit/native-wizard 1 |
| 265 | `Wizard.tsx` | a summary row's value keeps its pixel | **1** | 1 | unit/native-wizard 1 |
| 266 | `Wizard.tsx` | the start's field keeps its pixel | **1** | 1 | unit/native-wizard 1 |
| 267 | `Wizard.tsx` | a day's name is not let down | **1** | 1 | unit/native-wizard 1 |
| 268 | `Wizard.tsx` | the floor's lock is not let down | **1** | 1 | unit/native-wizard 1 |
| 269 | `Wizard.tsx` | the name's letters sit low in the field | **1** | 1 | unit/native-wizard 1 |
| 270 | `Wizard.tsx` | a card's line keeps its fraction | **1** | 1 | unit/native-wizard 1 |
| 271 | `Wizard.tsx` | Back's words stand a point low | **1** | 1 | unit/native-wizard 1 |
| 272 | `Wizard.tsx` | a hint keeps its fraction | **1** | 1 | unit/native-wizard 1 |
| 273 | `Wizard.tsx` | the last button's words are a size up | **1** | 1 | unit/native-wizard 1 |
| 274 | `Wizard.tsx` | a 1.5 edge is drawn at 1.5 | **1** | 1 | unit/native-wizard 1 |
| 275 | `Wizard.tsx` | a card's edge is a whole point | **1** | 1 | unit/native-wizard 1 |
| 276 | `Wizard.tsx` | the name's field takes its own height | **1** | 1 | unit/native-wizard 1 |
| 277 | `Wizard.tsx` | a start set by a race date sits as a plain field | **1** | 1 | unit/native-wizard 1 |
| 278 | `Wizard.tsx` | the summary has no edge | **1** | 1 | unit/native-wizard 1 |
| 279 | `Wizard.tsx` | an add-on row's icon stands in no line | **1** | 1 | unit/native-wizard 1 |
| 280 | `Generating.tsx` | the generating screen's title stands at iOS's own line | **1** | 1 | unit/native-wizard 1 |
| 281 | `wizard-screen.ts` | a slash ends a line | **1** | 1 | unit/native-wizard 1 |
| 282 | `wizard-screen.ts` | the widest title stands 34 | **1** | 1 | unit/native-wizard 1 |
| 283 | `wizard-screen.ts` | a 402 wide title stands 32 | **1** | 1 | unit/native-wizard 1 |
| 284 | `wizard-screen.ts` | the title's line is the first row's whatever its size | **1** | 1 | unit/native-wizard 1 |
| 285 | `Wizard.tsx` | a row card's check is always seen | **1** | 1 | unit/native-wizard 1 |
| 286 | `Wizard.tsx` | a sport's tap draws nothing | **1** | 1 | unit/native-wizard 1 |
| 287 | `Wizard.tsx` | a sport's name is not drawn | **1** | 1 | unit/native-wizard 1 |
| 288 | `Wizard.tsx` | a sport's line is not drawn | **1** | 1 | unit/native-wizard 1 |
| 289 | `Wizard.tsx` | a sport's check is always seen | **1** | 1 | unit/native-wizard 1 |
| 290 | `Wizard.tsx` | a sport's icon is a size down | **1** | 1 | unit/native-wizard 1 |
| 291 | `Wizard.tsx` | a shut sport lists its goals | **1** | 1 | unit/native-wizard 1 |
| 292 | `Wizard.tsx` | a goal's name is not drawn | **1** | 1 | unit/native-wizard 1 |
| 293 | `Wizard.tsx` | a goal's line is not drawn | **1** | 1 | unit/native-wizard 1 |
| 294 | `Wizard.tsx` | a focus's tap writes the equipment | **1** | 1 | unit/native-wizard 1 |
| 295 | `Wizard.tsx` | the add-on is drawn on every path | **1** | 1 | unit/native-wizard 1 |
| 296 | `Wizard.tsx` | the add-on's heading is not drawn | **1** | 1 | unit/native-wizard 1 |
| 297 | `Wizard.tsx` | an add-on sport's tap draws nothing | **1** | 1 | unit/native-wizard 1 |
| 298 | `Wizard.tsx` | Lift Only clears nothing | **1** | 1 | unit/native-wizard 1 |
| 299 | `Wizard.tsx` | Lift Only is marked while a sport is chosen | **1** | 1 | unit/native-wizard 1 |
| 300 | `Wizard.tsx` | a day's tap says no toast | **1** | 1 | unit/native-wizard 1 |
| 301 | `Wizard.tsx` | a day's name is not drawn | **1** | 1 | unit/native-wizard 1 |
| 302 | `Wizard.tsx` | a resting day has no mark | **1** | 1 | unit/native-wizard 1 |
| 303 | `Wizard.tsx` | a locked day has no lock | **1** | 1 | unit/native-wizard 1 |
| 304 | `Wizard.tsx` | a locked day is not dimmed | **1** | 1 | unit/native-wizard 1 |
| 305 | `Wizard.tsx` | the count of training days is not drawn | **1** | 1 | unit/native-wizard 1 |
| 306 | `Wizard.tsx` | the floor's box is never drawn | **1** | 1 | unit/native-wizard 1 |
| 307 | `Wizard.tsx` | the floor's heading has no lock | **1** | 1 | unit/native-wizard 1 |
| 308 | `Wizard.tsx` | the floor's goal is not named | **1** | 1 | unit/native-wizard 1 |
| 309 | `Wizard.tsx` | the floor's number is not drawn | **1** | 1 | unit/native-wizard 1 |
| 310 | `Wizard.tsx` | the floor's words with no goal are the goal's | **1** | 1 | unit/native-wizard 1 |
| 311 | `Wizard.tsx` | the advisories are not drawn | **1** | 1 | unit/native-wizard 1 |
| 312 | `Wizard.tsx` | the name's label is not drawn | **1** | 1 | unit/native-wizard 1 |
| 313 | `Wizard.tsx` | the name is not typed into the draft | **1** | 1 | unit/native-wizard 1 |
| 314 | `Wizard.tsx` | the name takes fifty letters | **1** | 1 | unit/native-wizard 1 |
| 315 | `Wizard.tsx` | the field shows the name as it was when the step opened, typed over | **1** | 1 | unit/native-wizard 1 |
| 316 | `Wizard.tsx` | the start's field is drawn under a race date | **1** | 1 | unit/native-wizard 1 |
| 317 | `Wizard.tsx` | the start's label is not drawn | **1** | 1 | unit/native-wizard 1 |
| 318 | `Wizard.tsx` | a start set by a race: its day is not drawn | **1** | 1 | unit/native-wizard 1 |
| 319 | `Wizard.tsx` | a start set by a race: where it comes from is not drawn | **1** | 1 | unit/native-wizard 1 |
| 320 | `Wizard.tsx` | a start under the floor is not in signal | **1** | 1 | unit/native-wizard 1 |
| 321 | `Wizard.tsx` | the opening week's pip is not in signal | **1** | 1 | unit/native-wizard 1 |
| 322 | `Wizard.tsx` | the pips are not drawn | **1** | 1 | unit/native-wizard 1 |
| 323 | `Wizard.tsx` | the start date's field shows the stored day | **1** | 1 | unit/native-wizard 1 |
| 324 | `Wizard.tsx` | the sentence under the field is not drawn | **1** | 1 | unit/native-wizard 1 |
| 325 | `Wizard.tsx` | the calendar opens on today whatever the draft holds | **1** | 1 | unit/native-wizard 1 |
| 326 | `Wizard.tsx` | the calendar has an earliest day | **1** | 1 | unit/native-wizard 1 |
| 327 | `Wizard.tsx` | a picked day draws the whole step | **1** | 1 | unit/native-wizard 1 |
| 328 | `Wizard.tsx` | a picked day is not written | **1** | 1 | unit/native-wizard 1 |
| 329 | `Wizard.tsx` | the summary's heading is not drawn | **1** | 1 | unit/native-wizard 1 |
| 330 | `Wizard.tsx` | a row's key is not drawn | **1** | 1 | unit/native-wizard 1 |
| 331 | `Wizard.tsx` | a row's value is not drawn | **1** | 1 | unit/native-wizard 1 |
| 332 | `Wizard.tsx` | a wrapping line's bold runs are plain | **1** | 1 | unit/native-wizard 1 |
| 333 | `Wizard.tsx` | a line's icons are not drawn | **1** | 1 | unit/native-wizard 1 |
| 334 | `Wizard.tsx` | a line's words are not drawn | **1** | 1 | unit/native-wizard 1 |
| 335 | `Wizard.tsx` | the pop-up is always up | **1** | 1 | unit/native-wizard 1 |
| 336 | `Wizard.tsx` | the pop-up's kicker is not drawn | **1** | 1 | unit/native-wizard 1 |
| 337 | `Wizard.tsx` | the pop-up's title is not drawn | **1** | 1 | unit/native-wizard 1 |
| 338 | `Wizard.tsx` | the pop-up's warning is not drawn | **1** | 1 | unit/native-wizard 1 |
| 339 | `Wizard.tsx` | the pop-up's length is not bold | **1** | 1 | unit/native-wizard 1 |
| 340 | `Wizard.tsx` | Go Back builds | **1** | 1 | unit/native-wizard 1 |
| 341 | `Wizard.tsx` | Build goes back | **1** | 1 | unit/native-wizard 1 |
| 342 | `Wizard.tsx` | Go Back's words are not drawn | **1** | 1 | unit/native-wizard 1 |
| 343 | `Wizard.tsx` | Build's words are not drawn | **1** | 1 | unit/native-wizard 1 |
| 344 | `Wizard.tsx` | the generating screen is up from the start | **1** | 1 | unit/native-wizard 1 |
| 345 | `Wizard.tsx` | the build stamps no instant | **1** | 1 | unit/native-wizard 1 |
| 346 | `Wizard.tsx` | the program built is not handed on | **1** | 1 | unit/native-wizard 1 |
| 347 | `Wizard.tsx` | landing hands nothing to the app | **1** | 1 | unit/native-wizard 1 |
| 348 | `Generating.tsx` | the lines never change | **1** | 1 | unit/native-wizard 1 |
| 349 | `Generating.tsx` | the lines go on after the build | **1** | 1 | unit/native-wizard 1 |
| 350 | `Generating.tsx` | the build waits for nothing | **1** | 1 | unit/native-wizard 1 |
| 351 | `Generating.tsx` | a failed build lands | **1** | 1 | unit/native-wizard 1 |
| 352 | `Generating.tsx` | a failed build says nothing | **1** | 1 | unit/native-wizard 1 |
| 353 | `Generating.tsx` | the ready line is not shown | **1** | 1 | unit/native-wizard 1 |
| 354 | `Generating.tsx` | This Week shows at once | **1** | 1 | unit/native-wizard 1 |
| 355 | `Generating.tsx` | the screen's title is not drawn | **1** | 1 | unit/native-wizard 1 |
| 356 | `Generating.tsx` | the line is not drawn | **1** | 1 | unit/native-wizard 1 |
| 357 | `Generating.tsx` | the line opens blank | **1** | 1 | unit/native-wizard 1 |
| 358 | `Generating.tsx` | the bar does not sink | **1** | 1 | unit/native-wizard 1 |
| 359 | `Generating.tsx` | both legs are the left | **1** | 1 | unit/native-wizard 1 |
| 360 | `Generating.tsx` | the sparks are not drawn | **1** | 1 | unit/native-wizard 1 |
| 361 | `Generating.tsx` | the sparks are in the text colour | **1** | 1 | unit/native-wizard 1 |
| 362 | `Generating.tsx` | the figure stands still | **1** | 1 | unit/native-wizard 1 |
| 363 | `Programs.tsx` | Build New Program takes no press | **1** | 1 | unit/native-program-list 1 |
| 364 | `App.tsx` | Build New Program opens no wizard | **2** | 2 | unit/native-program-list 1, unit/native-wizard 1 |
| 365 | `App.tsx` | a second Build New Program keeps the first's draft | **1** | 2 | unit/native-wizard 2 |
| 366 | `App.tsx` | Back on the first step leaves the wizard up | **1** | 1 | unit/native-wizard 1 |
| 367 | `App.tsx` | the wizard's field opens no calendar | **1** | 1 | unit/native-wizard 1 |
| 368 | `App.tsx` | the landing is not handed to This Week | **1** | 1 | unit/native-wizard 1 |
| 369 | `App.tsx` | the launch after Generate raises the reminder | **1** | 1 | unit/native-wizard 1 |
| 370 | `App.tsx` | the reminder stays quiet for good | **1** | 1 | unit/native-wizard 1 |
| 371 | `App.tsx` | after Generate the app stays on the Programs tab | **1** | 1 | unit/native-wizard 1 |
| 372 | `App.tsx` | after Generate the wizard stays up | **1** | 1 | unit/native-wizard 1 |
| 373 | `App.tsx` | after Generate This Week does not launch again | **1** | 1 | unit/native-wizard 1 |
| 374 | `App.tsx` | the toast draws no mark | **1** | 1 | unit/native-wizard 1 |
| 375 | `App.tsx` | the toast drops its mark when said | **1** | 1 | unit/native-wizard 1 |
| 376 | `ThisWeek.tsx` | This Week does not read where the wizard landed | **1** | 1 | unit/native-wizard 1 |
| 377 | `ThisWeek.tsx` | This Week opens on the launch's title after Generate | **1** | 1 | unit/native-wizard 1 |
| 378 | `ThisWeek.tsx` | a new program resets the landing's title | **1** | 1 | unit/native-change-sheet 1 |
| 379 | `ThisWeek.tsx` | This Week does not take the landing's week as its own | **1** | 1 | unit/native-wizard 1 |
| 380 | `ThisWeek.tsx` | the landing is taken at every mount | **1** | 1 | unit/native-wizard 1 |
| 381 | `wizard-readers.ts` | the swim 500 goal is 400 long | **2** | 5 | integration/native-wizard 2, unit/native-wizard 3 |
| 382 | `wizard-readers.ts` | an intermediate runner improves two seconds a week | **2** | 4 | integration/native-wizard 2, unit/native-wizard 2 |
| 383 | `wizard-readers.ts` | the length line asks for the mile when one is entered | **2** | 10 | integration/native-wizard 7, unit/native-wizard 3 |
| 384 | `wizard-readers.ts` | the length line says 1 weeks | **1** | 5 | integration/native-wizard 5 |
| 385 | `wizard-readers.ts` | the length line's test words lose their full stop | **1** | 5 | integration/native-wizard 5 |
| 386 | `wizard-readers.ts` | a beginner's mile is required on the pace goal | **2** | 3 | integration/native-wizard 2, unit/native-wizard 1 |
| 387 | `wizard-readers.ts` | an 11 minute mile takes a | **2** | 3 | integration/native-wizard 2, unit/native-wizard 1 |
| 388 | `wizard-readers.ts` | a kilometre is 0.6 of a mile | **1** | 3 | integration/native-wizard 3 |
| 389 | `wizard-readers.ts` | the intermediate default pace is 9:20 | **1** | 1 | unit/native-wizard 1 |
| 390 | `wizard-readers.ts` | the reach is flagged only a minute off | **2** | 2 | integration/native-wizard 1, unit/native-wizard 1 |
| 391 | `wizard-readers.ts` | a runner of 55 or over improves faster | **1** | 2 | sweeps/native-wizard 2 (the sweep was run) |
| 392 | `wizard-readers.ts` | a target at the current pace is flagged | **1** | 1 | unit/native-wizard 1 |
| 393 | `wizard-readers.ts` | the reach sentence reads the level default when a mile is entered | **2** | 6 | integration/native-wizard 4, unit/native-wizard 2 |
| 394 | `wizard-readers.ts` | the reach sentence says 1 weeks | **2** | 5 | integration/native-wizard 4, unit/native-wizard 1 |
| 395 | `wizard-readers.ts` | the pace line shows with no distance | **1** | 2 | integration/native-wizard 2 |
| 396 | `wizard-readers.ts` | the swim pace is per 50 | **2** | 5 | integration/native-wizard 3, unit/native-wizard 2 |
| 397 | `wizard-readers.ts` | the swim pace line shows at zero | **1** | 2 | integration/native-wizard 2 |
| 398 | `wizard-readers.ts` | the swim pace line's unit is metres unless said | **2** | 5 | unit/native-wizard 2, integration/native-wizard 3 |
| 399 | `wizard-readers.ts` | the weeks to the race are not written | **2** | 8 | integration/native-wizard 6, unit/native-wizard 2 |
| 400 | `wizard-readers.ts` | yesterday's date has not passed | **1** | 1 | integration/native-wizard 1 |
| 401 | `wizard-readers.ts` | the pace frame shows beside a race date | **2** | 3 | integration/native-wizard 2, unit/native-wizard 1 |
| 402 | `wizard-readers.ts` | the card drops the reach sentence | **2** | 8 | integration/native-wizard 3, unit/native-wizard 5 |
| 403 | `wizard-readers.ts` | a test weeks out is drawn in the run colour whatever its reach | **1** | 2 | integration/native-wizard 2 |
| 404 | `wizard-readers.ts` | a week that holds the test reads as any test week | **2** | 4 | integration/native-wizard 3, unit/native-wizard 1 |
| 405 | `wizard-readers.ts` | a test before the first training day is drawn in the ink | **1** | 1 | integration/native-wizard 1 |
| 406 | `wizard-readers.ts` | a race two weeks out is too soon | **1** | 2 | integration/native-wizard 2 |
| 407 | `wizard-readers.ts` | a race plan under its floor is drawn in the run colour | **1** | 2 | integration/native-wizard 2 |
| 408 | `wizard-readers.ts` | a program a week short of race day peaks on it | **1** | 1 | integration/native-wizard 1 |
| 409 | `wizard-readers.ts` | one week before race day reads weeks | **1** | 1 | integration/native-wizard 1 |
| 410 | `wizard-readers.ts` | a program that peaks on race day is short for it | **1** | 1 | integration/native-wizard 1 |
| 411 | `wizard-readers.ts` | three weeks short is drawn in the ink | **1** | 1 | integration/native-wizard 1 |
| 412 | `wizard-readers.ts` | the pace line is painted on a form that has none | **2** | 11 | integration/native-wizard 10, unit/native-wizard 1 |
| 413 | `wizard-readers.ts` | the card is painted on a step that has none | **2** | 10 | integration/native-wizard 9, unit/native-wizard 1 |
| 414 | `wizard-readers.ts` | the length line is not repainted | **1** | 3 | integration/native-wizard 3 |
| 415 | `wizard-screen.ts` | the race date's field is not held | **2** | 7 | integration/native-wizard 6, unit/native-wizard 1 |
| 416 | `wizard-screen.ts` | the swim pace line is drawn hidden | **1** | 3 | integration/native-wizard 3 |
| 417 | `wizard-screen.ts` | the mile's advisory is not held | **2** | 9 | unit/native-wizard 2, integration/native-wizard 7 |
| 418 | `wizard-screen.ts` | the swim's advisory is not held | **2** | 4 | integration/native-wizard 3, unit/native-wizard 1 |
| 419 | `wizard-screen.ts` | a whole draw skips the step's repaint | **2** | 9 | integration/native-wizard 7, unit/native-wizard 2 |
| 420 | `wizard-screen.ts` | the model reads no swim distance | **2** | 4 | integration/native-wizard 3, unit/native-wizard 1 |
| 421 | `wizard-screen.ts` | the model's mile help is blank | **1** | 7 | integration/native-wizard 7 |
| 422 | `wizard-screen.ts` | the model's length line is blank | **1** | 7 | integration/native-wizard 7 |
| 423 | `wizard-screen.ts` | the seed reader is never run | **1** | 1 | integration/native-wizard 1 |
| 424 | `wizard-screen.ts` | a goal picked over another drops its baseline | **2** | 5 | integration/native-wizard 4, unit/native-wizard 1 |
| 425 | `wizard-screen.ts` | a goal is named by its id | **2** | 7 | integration/native-wizard 6, unit/native-wizard 1 |
| 426 | `wizard-screen.ts` | the pace unit is written as the swim's | **2** | 4 | integration/native-wizard 3, unit/native-wizard 1 |
| 427 | `wizard-screen.ts` | the swim unit is written as the pace's | **2** | 3 | integration/native-wizard 2, unit/native-wizard 1 |
| 428 | `wizard-screen.ts` | the seed's mile keeps sixty seconds | **1** | 1 | unit/native-wizard 1 |
| 429 | `wizard-screen.ts` | the seed's mile is marked as entered | **2** | 2 | integration/native-wizard 1, unit/native-wizard 1 |
| 430 | `wizard-screen.ts` | the seed's baseline is always in miles | **1** | 1 | unit/native-wizard 1 |
| 431 | `wizard-screen.ts` | Use this data does not mark the seed applied | **2** | 2 | integration/native-wizard 1, unit/native-wizard 1 |
| 432 | `wizard-screen.ts` | Start fresh does not turn the seed down | **2** | 2 | integration/native-wizard 1, unit/native-wizard 1 |
| 433 | `wizard-screen.ts` | Just building fitness keeps the race date | **2** | 5 | integration/native-wizard 4, unit/native-wizard 1 |
| 434 | `wizard-screen.ts` | Just building fitness keeps the weeks | **1** | 1 | unit/native-wizard 1 |
| 435 | `wizard-screen.ts` | I have a race date sets today over a date picked | **1** | 1 | unit/native-wizard 1 |
| 436 | `wizard-screen.ts` | the shorter plan's toast loses its check | **2** | 3 | integration/native-wizard 2, unit/native-wizard 1 |
| 437 | `wizard-screen.ts` | the shorter plan keeps the longer one's name | **2** | 3 | integration/native-wizard 2, unit/native-wizard 1 |
| 438 | `wizard-screen.ts` | a target's seconds are not padded | **2** | 5 | integration/native-wizard 4, unit/native-wizard 1 |
| 439 | `wizard-screen.ts` | a swim target does not write its m:ss | **2** | 4 | integration/native-wizard 3, unit/native-wizard 1 |
| 440 | `wizard-screen.ts` | a swim target repaints nothing | **2** | 5 | integration/native-wizard 3, unit/native-wizard 2 |
| 441 | `wizard-screen.ts` | a swim time repaints nothing | **2** | 4 | integration/native-wizard 3, unit/native-wizard 1 |
| 442 | `wizard-screen.ts` | the target distance repaints nothing | **1** | 3 | integration/native-wizard 3 |
| 443 | `wizard-screen.ts` | a run target does not write its m:ss | **2** | 5 | integration/native-wizard 4, unit/native-wizard 1 |
| 444 | `wizard-screen.ts` | the pace goal's baseline is always in miles | **1** | 2 | integration/native-wizard 2 |
| 445 | `wizard-screen.ts` | a typed mile is not marked as entered | **2** | 7 | integration/native-wizard 6, unit/native-wizard 1 |
| 446 | `wizard-screen.ts` | a typed mile does not repaint its advisory | **2** | 5 | integration/native-wizard 4, unit/native-wizard 1 |
| 447 | `wizard-screen.ts` | a baseline is stored with no unit | **2** | 6 | integration/native-wizard 5, unit/native-wizard 1 |
| 448 | `wizard-screen.ts` | a typed bike or swim baseline repaints the length line | **1** | 1 | integration/native-wizard 1 |
| 449 | `wizard-screen.ts` | a run baseline repaints nothing | **1** | 2 | integration/native-wizard 2 |
| 450 | `wizard-screen.ts` | a picked race day is not held by the field | **2** | 6 | integration/native-wizard 5, unit/native-wizard 1 |
| 451 | `wizard-screen.ts` | a blank from the race date's field is not written | **2** | 2 | integration/native-wizard 1, unit/native-wizard 1 |
| 452 | `wizard-screen.ts` | a framed line's reach sentence is not cut out | **1** | 1 | unit/native-wizard 1 |
| 453 | `wizard-screen.ts` | the red line is read as a card | **1** | 1 | unit/native-wizard 1 |
| 454 | `wizard-screen.ts` | a bold run that carries a colour is plain | **1** | 1 | unit/native-wizard 1 |
| 455 | `wizard-screen.ts` | a toast with no mark draws the warning | **2** | 3 | integration/native-wizard 2, unit/native-wizard 1 |
| 456 | `number-field.ts` | a second point is kept | **1** | 2 | unit/native-wizard 2 |
| 457 | `number-field.ts` | any key is kept | **1** | 2 | unit/native-wizard 2 |
| 458 | `number-field.ts` | an e is not kept | **1** | 2 | unit/native-wizard 2 |
| 459 | `number-field.ts` | a sign is kept anywhere after the e | **1** | 1 | unit/native-wizard 1 |
| 460 | `number-field.ts` | a plus at the start is handed back | **1** | 1 | unit/native-wizard 1 |
| 461 | `number-field.ts` | a point at the end is handed back | **1** | 2 | unit/native-wizard 2 |
| 462 | `number-field.ts` | a half typed number is handed back | **1** | 1 | unit/native-wizard 1 |
| 463 | `number-field.ts` | a point with no digit before it is not a number | **1** | 1 | unit/native-wizard 1 |
| 464 | `number-field.ts` | a key that is not kept changes the text | **1** | 2 | unit/native-wizard 2 |
| 465 | `date-box.ts` | Reset blanks a field drawn with a day | **1** | 1 | unit/native-change-sheet 1 |
| 466 | `date-box.ts` | Reset leaves the calendar on the day it opened on, whatever the field was drawn with | **1** | 1 | unit/native-change-sheet 1 |
| 467 | `date-box.ts` | a pressed button of the box does not dim | **1** | 1 | unit/native-change-sheet 1 |
| 468 | `DateBox.tsx` | Reset does not dim under the finger | **1** | 1 | unit/native-change-sheet 1 |
| 469 | `DateBox.tsx` | the check does not dim under the finger | **1** | 1 | unit/native-change-sheet 1 |
| 470 | `App.tsx` | the wizard is keyed by its bare count | **1** | 2 | unit/native-wizard 2 |
| 471 | `App.tsx` | the calendar is keyed by its bare count | **2** | 2 | unit/native-change-sheet 1, unit/native-wizard 1 |
| 472 | `App.tsx` | the toast is keyed as the wizard | **1** | 1 | unit/native-wizard 1 |
| 473 | `Wizard.tsx` | a goal takes no press | **1** | 1 | unit/native-wizard 1 |
| 474 | `Wizard.tsx` | a goal's press draws nothing | **1** | 1 | unit/native-wizard 1 |
| 475 | `Wizard.tsx` | a typed field writes nothing | **1** | 1 | unit/native-wizard 1 |
| 476 | `Wizard.tsx` | a number field keeps its text through a whole draw | **1** | 1 | unit/native-wizard 1 |
| 477 | `Wizard.tsx` | a whole draw is not counted | **1** | 1 | unit/native-wizard 1 |
| 478 | `Wizard.tsx` | a key that is not kept does not call the handler | **1** | 1 | unit/native-wizard 1 |
| 479 | `Wizard.tsx` | a number field hands back its text | **1** | 1 | unit/native-wizard 1 |
| 480 | `Wizard.tsx` | a number field shows the number pad | **1** | 1 | unit/native-wizard 1 |
| 481 | `Wizard.tsx` | a unit's press draws nothing | **1** | 1 | unit/native-wizard 1 |
| 482 | `Wizard.tsx` | a race button writes nothing | **1** | 1 | unit/native-wizard 1 |
| 483 | `Wizard.tsx` | Use this data applies nothing | **1** | 1 | unit/native-wizard 1 |
| 484 | `Wizard.tsx` | Start fresh turns nothing down | **1** | 1 | unit/native-wizard 1 |
| 485 | `Wizard.tsx` | the race date's Reset blanks the field | **1** | 1 | unit/native-wizard 1 |
| 486 | `Wizard.tsx` | a picked race day writes nothing | **1** | 1 | unit/native-wizard 1 |
| 487 | `Wizard.tsx` | the shorter plan's link says nothing | **1** | 1 | unit/native-wizard 1 |
| 488 | `Wizard.tsx` | the shorter plan's link takes no press | **1** | 1 | unit/native-wizard 1 |
| 489 | `Wizard.tsx` | a repaint draws the step whole | **1** | 1 | unit/native-wizard 1 |
| 490 | `Wizard.tsx` | an advisory that refuses is drawn muted | **1** | 1 | unit/native-wizard 1 |
| 491 | `Wizard.tsx` | the red line is drawn in the ink | **1** | 1 | unit/native-wizard 1 |
| 492 | `Wizard.tsx` | the reach sentence is not drawn | **1** | 1 | unit/native-wizard 1 |
| 493 | `Wizard.tsx` | the mile's help is not drawn | **1** | 1 | unit/native-wizard 1 |
| 494 | `Wizard.tsx` | the mile's advisory is not drawn | **1** | 1 | unit/native-wizard 1 |
| 495 | `Wizard.tsx` | the swim's advisory is not drawn | **1** | 1 | unit/native-wizard 1 |
| 496 | `Wizard.tsx` | the 500 row is never drawn | **1** | 1 | unit/native-wizard 1 |
| 497 | `Wizard.tsx` | the pace reach frame is not drawn | **1** | 1 | unit/native-wizard 1 |
| 498 | `Wizard.tsx` | the swim pace line is not drawn | **1** | 1 | unit/native-wizard 1 |
| 499 | `Wizard.tsx` | the line for more than one sport is not drawn | **1** | 1 | unit/native-wizard 1 |
| 500 | `Wizard.tsx` | the card under the race date is not drawn | **1** | 1 | unit/native-wizard 1 |
| 501 | `Wizard.tsx` | the race date's field shows the day as stored | **1** | 1 | unit/native-wizard 1 |
| 502 | `Wizard.tsx` | the box under the cards is always drawn | **1** | 1 | unit/native-wizard 1 |
| 503 | `Wizard.tsx` | the seed banner is drawn under the pace goal alone | **1** | 1 | unit/native-wizard 1 |
| 504 | `Wizard.tsx` | a form's goal draws no form | **1** | 1 | unit/native-wizard 1 |
| 505 | `Wizard.tsx` | the Race date labels stand as measured before | **1** | 1 | unit/native-wizard 1 |
| 506 | `Wizard.tsx` | the pop-up's words stand a point high | **1** | 1 | unit/native-wizard 1 |
| 507 | `Wizard.tsx` | a framed line stands at 18 | **1** | 1 | unit/native-wizard 1 |
| 508 | `Wizard.tsx` | a number field's words stand a point high | **1** | 1 | unit/native-wizard 1 |
| 509 | `Wizard.tsx` | a caption stands at 13 | **1** | 1 | unit/native-wizard 1 |
| 510 | `Wizard.tsx` | an advisory stands at 16 | **1** | 1 | unit/native-wizard 1 |
| 511 | `Wizard.tsx` | the colon is drawn in the regular face | **1** | 1 | unit/native-look 1 |
| 512 | `Wizard.tsx` | the race date's field has a whole 1.5 edge | **1** | 1 | unit/native-wizard 1 |

- Breaks made: **512** of 512. Let through by the fast files, so swept: 6. Let through by every file: **0**.
