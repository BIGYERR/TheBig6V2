# The Expo app's Random Workout: a break per rule, and the test files each turns red

Written by `node tests/measure/native-random-workout_breaks.mjs` (read-only here; each break is made in a copy of the tree and put back).

- The fast files, run on each break: `unit/native-random-workout.test.ts`, `integration/native-random-workout.test.ts`. Unbroken, they hold 41 tests and all pass.
- The sweep, run only on a break the fast files let through: `sweeps/native-random-workout.test.ts` (1 tests, all passing unbroken).

| # | File | The rule broken | Files red | Tests red | Which |
|---|---|---|---|---|---|
| 1 | `random-screen.ts` | the filter starts on See All | **2** | 7 | integration/native-random-workout 3, unit/native-random-workout 4 |
| 2 | `random-screen.ts` | the last draw starts on the first workout | **2** | 5 | integration/native-random-workout 3, unit/native-random-workout 2 |
| 3 | `random-screen.ts` | a program with no goal draws from strength | **1** | 1 | unit/native-random-workout 1 |
| 4 | `random-screen.ts` | the draw forgets the filter | **2** | 4 | integration/native-random-workout 2, unit/native-random-workout 2 |
| 5 | `random-screen.ts` | the draw may land on the last one | **1** | 1 | unit/native-random-workout 1 |
| 6 | `random-screen.ts` | the draw's index is not kept | **2** | 4 | integration/native-random-workout 3, unit/native-random-workout 1 |
| 7 | `random-screen.ts` | the working day is the pool's own sections | **2** | 3 | integration/native-random-workout 2, unit/native-random-workout 1 |
| 8 | `random-screen.ts` | the head is read against no record | **1** | 1 | unit/native-random-workout 1 |
| 9 | `random-screen.ts` | the head's badge is the balanced goal's | **2** | 4 | integration/native-random-workout 3, unit/native-random-workout 1 |
| 10 | `random-screen.ts` | a fresh draw's cards are read a day late | **1** | 2 | integration/native-random-workout 2 |
| 11 | `random-screen.ts` | the swap chip names the oldest swap | **1** | 1 | unit/native-random-workout 1 |
| 12 | `random-screen.ts` | the swap chip reads the lift swapped out | **2** | 3 | integration/native-random-workout 2, unit/native-random-workout 1 |
| 13 | `random-screen.ts` | the swap chip names the lift swapped in | **2** | 3 | integration/native-random-workout 2, unit/native-random-workout 1 |
| 14 | `random-screen.ts` | a card is read in the program's unit | **2** | 2 | integration/native-random-workout 1, unit/native-random-workout 1 |
| 15 | `random-screen.ts` | a set's load is turned by the program's unit | **2** | 2 | integration/native-random-workout 1, unit/native-random-workout 1 |
| 16 | `random-screen.ts` | the load field is turned by the last opened day's unit | **2** | 2 | integration/native-random-workout 1, unit/native-random-workout 1 |
| 17 | `random-screen.ts` | a tap with no day opened writes under no day at all | **2** | 4 | integration/native-random-workout 2, unit/native-random-workout 2 |
| 18 | `random-screen.ts` | a tap writes under Monday | **2** | 5 | integration/native-random-workout 2, unit/native-random-workout 3 |
| 19 | `random-screen.ts` | a tap writes under the first week | **2** | 5 | integration/native-random-workout 2, unit/native-random-workout 3 |
| 20 | `deck-writes.ts` | a Wildcard's set loads are turned by the program's unit | **2** | 2 | integration/native-random-workout 1, unit/native-random-workout 1 |
| 21 | `random-screen.ts` | the cards start the stale warning afresh | **2** | 3 | integration/native-random-workout 2, unit/native-random-workout 1 |
| 22 | `random-screen.ts` | the cards are read under no day | **2** | 2 | integration/native-random-workout 1, unit/native-random-workout 1 |
| 23 | `random-screen.ts` | the cards are read under the first week | **2** | 2 | integration/native-random-workout 1, unit/native-random-workout 1 |
| 24 | `random-screen.ts` | the cards are read in the program's unit | **2** | 2 | integration/native-random-workout 1, unit/native-random-workout 1 |
| 25 | `random-screen.ts` | the swap chip reads the program's records | **2** | 3 | integration/native-random-workout 2, unit/native-random-workout 1 |
| 26 | `random-screen.ts` | the cards are drawn from the pool's workout | **2** | 10 | unit/native-random-workout 8, integration/native-random-workout 2 |
| 27 | `random-screen.ts` | the fields leave out a round's cards | **2** | 2 | integration/native-random-workout 1, unit/native-random-workout 1 |
| 28 | `random-screen.ts` | the counter reads the balanced pool | **1** | 1 | unit/native-random-workout 1 |
| 29 | `random-screen.ts` | the counter reads no record | **2** | 4 | integration/native-random-workout 3, unit/native-random-workout 1 |
| 30 | `random-screen.ts` | the reset reads Reset | **1** | 1 | unit/native-random-workout 1 |
| 31 | `random-screen.ts` | the reset asks with Again | **1** | 1 | unit/native-random-workout 1 |
| 32 | `random-screen.ts` | the reset's label | **1** | 1 | unit/native-random-workout 1 |
| 33 | `random-screen.ts` | the badge reads Random | **1** | 1 | unit/native-random-workout 1 |
| 34 | `random-screen.ts` | the done badge | **1** | 1 | unit/native-random-workout 1 |
| 35 | `random-screen.ts` | the done block's words | **1** | 1 | unit/native-random-workout 1 |
| 36 | `random-screen.ts` | Complete's words | **1** | 1 | unit/native-random-workout 1 |
| 37 | `random-screen.ts` | Complete's mark | **1** | 1 | unit/native-random-workout 1 |
| 38 | `random-screen.ts` | Back's words | **1** | 1 | unit/native-random-workout 1 |
| 39 | `random-screen.ts` | the reset asks for five seconds | **1** | 1 | unit/native-random-workout 1 |
| 40 | `random-writes.ts` | a program with no start date has a day | **1** | 1 | unit/native-random-workout 1 |
| 41 | `random-writes.ts` | the day count is a day short | **2** | 8 | integration/native-random-workout 3, unit/native-random-workout 5 |
| 42 | `random-writes.ts` | the day count is not rounded | **1** | 1 | unit/native-random-workout 1 |
| 43 | `random-writes.ts` | the day is read from the clock's hour | **2** | 7 | integration/native-random-workout 3, unit/native-random-workout 4 |
| 44 | `random-writes.ts` | the weeks are counted from zero | **2** | 8 | integration/native-random-workout 3, unit/native-random-workout 5 |
| 45 | `random-writes.ts` | a day past the last week is stamped | **1** | 1 | unit/native-random-workout 1 |
| 46 | `random-writes.ts` | a program's stated length is not read | **1** | 1 | unit/native-random-workout 1 |
| 47 | `random-writes.ts` | a program with no stated length has no days | **1** | 1 | unit/native-random-workout 1 |
| 48 | `random-writes.ts` | the week starts on a Sunday | **2** | 8 | integration/native-random-workout 3, unit/native-random-workout 5 |
| 49 | `random-writes.ts` | a day the grid does not hold is stamped | **1** | 1 | unit/native-random-workout 1 |
| 50 | `random-writes.ts` | a day before the start is stamped | **1** | 1 | unit/native-random-workout 1 |
| 51 | `random-writes.ts` | the same title is stored twice | **1** | 1 | unit/native-random-workout 1 |
| 52 | `random-writes.ts` | a title is never stored | **2** | 5 | integration/native-random-workout 3, unit/native-random-workout 2 |
| 53 | `random-writes.ts` | the record carries no day | **2** | 5 | integration/native-random-workout 3, unit/native-random-workout 2 |
| 54 | `random-writes.ts` | the record carries no week | **2** | 5 | unit/native-random-workout 2, integration/native-random-workout 3 |
| 55 | `random-writes.ts` | the record carries no time | **2** | 4 | integration/native-random-workout 3, unit/native-random-workout 1 |
| 56 | `random-writes.ts` | the record is stamped with the week's day swapped for its week | **2** | 4 | integration/native-random-workout 3, unit/native-random-workout 1 |
| 57 | `random-writes.ts` | Complete stores nothing | **2** | 5 | integration/native-random-workout 3, unit/native-random-workout 2 |
| 58 | `random-writes.ts` | the toast leaves out the title | **2** | 4 | integration/native-random-workout 3, unit/native-random-workout 1 |
| 59 | `random-writes.ts` | a rest day is a training day | **2** | 4 | integration/native-random-workout 3, unit/native-random-workout 1 |
| 60 | `random-writes.ts` | no day is a training day | **2** | 4 | integration/native-random-workout 2, unit/native-random-workout 2 |
| 61 | `random-writes.ts` | a day off the calendar is a training day | **2** | 3 | integration/native-random-workout 2, unit/native-random-workout 1 |
| 62 | `random-writes.ts` | the pop-up follows at once | **1** | 1 | unit/native-random-workout 1 |
| 63 | `random-writes.ts` | the pop-up is a streak's | **2** | 4 | unit/native-random-workout 1, integration/native-random-workout 3 |
| 64 | `random-writes.ts` | the pop-up's kicker | **2** | 4 | integration/native-random-workout 3, unit/native-random-workout 1 |
| 65 | `random-writes.ts` | the pop-up's line | **2** | 4 | integration/native-random-workout 3, unit/native-random-workout 1 |
| 66 | `random-writes.ts` | a rest day names the streak | **2** | 4 | integration/native-random-workout 3, unit/native-random-workout 1 |
| 67 | `random-writes.ts` | a training day's streak only holds | **2** | 3 | integration/native-random-workout 2, unit/native-random-workout 1 |
| 68 | `random-writes.ts` | the streak reads without its full stop | **2** | 3 | integration/native-random-workout 2, unit/native-random-workout 1 |
| 69 | `random-writes.ts` | the reset leaves the record | **2** | 3 | integration/native-random-workout 2, unit/native-random-workout 1 |
| 70 | `random-writes.ts` | the reset's words | **2** | 3 | integration/native-random-workout 2, unit/native-random-workout 1 |
| 71 | `deck-writes.ts` | a Wildcard's minus lands on the program's day | **2** | 3 | integration/native-random-workout 2, unit/native-random-workout 1 |
| 72 | `deck-writes.ts` | a Wildcard's minus is stored | **2** | 4 | integration/native-random-workout 2, unit/native-random-workout 2 |
| 73 | `deck-writes.ts` | a Wildcard's round minus lands on the program's day | **2** | 3 | integration/native-random-workout 2, unit/native-random-workout 1 |
| 74 | `deck-writes.ts` | a Wildcard's round minus is stored | **2** | 4 | integration/native-random-workout 2, unit/native-random-workout 2 |
| 75 | `deck-writes.ts` | a card's minus forgets the Wildcard | **2** | 4 | integration/native-random-workout 2, unit/native-random-workout 2 |
| 76 | `deck-writes.ts` | a round's minus forgets the Wildcard | **2** | 4 | integration/native-random-workout 2, unit/native-random-workout 2 |
| 77 | `deck-writes.ts` | a Wildcard's swap lands on the program's day | **2** | 4 | integration/native-random-workout 2, unit/native-random-workout 2 |
| 78 | `deck-writes.ts` | a Wildcard's swap is recorded in the store | **2** | 4 | integration/native-random-workout 2, unit/native-random-workout 2 |
| 79 | `deck-writes.ts` | a Wildcard's swap keeps no record | **2** | 4 | integration/native-random-workout 2, unit/native-random-workout 2 |
| 80 | `deck-writes.ts` | a Wildcard's swap keeps no places | **2** | 3 | unit/native-random-workout 1, integration/native-random-workout 2 |
| 81 | `deck-writes.ts` | a Wildcard's swap keeps its names the wrong way round | **2** | 4 | integration/native-random-workout 2, unit/native-random-workout 2 |
| 82 | `deck-writes.ts` | a Wildcard's swap is counted toward the nudge | **2** | 4 | integration/native-random-workout 2, unit/native-random-workout 2 |
| 83 | `deck-writes.ts` | a Wildcard's swap renews the day's snapshot | **1** | 1 | unit/native-random-workout 1 |
| 84 | `deck-writes.ts` | a Wildcard's put back lands on the program's day | **2** | 3 | integration/native-random-workout 2, unit/native-random-workout 1 |
| 85 | `deck-writes.ts` | a Wildcard's put back reads the store's records | **2** | 4 | integration/native-random-workout 2, unit/native-random-workout 2 |
| 86 | `deck-writes.ts` | a Wildcard's put back leaves its record | **2** | 3 | integration/native-random-workout 2, unit/native-random-workout 1 |
| 87 | `deck-writes.ts` | a Wildcard's put back drops every other record | **2** | 3 | integration/native-random-workout 2, unit/native-random-workout 1 |
| 88 | `deck-writes.ts` | a Wildcard's put back renews the day's snapshot | **1** | 1 | unit/native-random-workout 1 |
| 89 | `deck-swaps.ts` | the Wildcard's swap sheet lists for no day | **2** | 3 | integration/native-random-workout 2, unit/native-random-workout 1 |
| 90 | `deck-screen.ts` | the app starts in kilograms | **2** | 8 | integration/native-random-workout 4, unit/native-random-workout 4 |
| 91 | `deck-screen.ts` | the app starts with the warning spoken | **2** | 6 | integration/native-random-workout 4, unit/native-random-workout 2 |
| 92 | `deck-screen.ts` | the app starts on Monday | **2** | 9 | integration/native-random-workout 4, unit/native-random-workout 5 |
| 93 | `deck-screen.ts` | an open keeps the warning spoken | **1** | 1 | unit/native-random-workout 1 |
| 94 | `deck-screen.ts` | an open keeps the warning's program | **1** | 1 | unit/native-random-workout 1 |
| 95 | `deck-screen.ts` | an open sets pounds | **2** | 3 | integration/native-random-workout 1, unit/native-random-workout 2 |
| 96 | `deck-screen.ts` | an open forgets its day | **2** | 4 | integration/native-random-workout 2, unit/native-random-workout 2 |
| 97 | `deck-screen.ts` | an open hands back a warning of its own | **2** | 2 | integration/native-random-workout 1, unit/native-random-workout 1 |
| 98 | `sheet-screen.ts` | a sheet's draw leaves the app's day alone | **2** | 3 | integration/native-random-workout 2, unit/native-random-workout 1 |
| 99 | `random-workout-model.ts` | a filter's label in the copied model | **1** | 1 | unit/native-random-workout 1 |
| 100 | `random-workout-model.ts` | the copied model may repeat the last draw | **1** | 2 | unit/native-random-workout 2 |
| 101 | `random-pools.ts` | a workout's title in the copied pools | **2** | 7 | integration/native-random-workout 2, unit/native-random-workout 5 |
| 102 | `random-pools.ts` | a card's prescription in the copied pools | **2** | 3 | integration/native-random-workout 2, unit/native-random-workout 1 |
| 103 | `RandomWorkout.tsx` | the screen's taps write under the program's own session | **1** | 1 | unit/native-random-workout 1 |
| 104 | `RandomWorkout.tsx` | a minus forgets the working day | **1** | 1 | unit/native-random-workout 1 |
| 105 | `RandomWorkout.tsx` | a pick forgets the working day | **1** | 1 | unit/native-random-workout 1 |
| 106 | `RandomWorkout.tsx` | a put back forgets the working day | **1** | 1 | unit/native-random-workout 1 |
| 107 | `RandomWorkout.tsx` | the swap sheet opens on no day | **1** | 1 | unit/native-random-workout 1 |
| 108 | `RandomWorkout.tsx` | the cards are drawn in pounds | **1** | 1 | unit/native-random-workout 1 |
| 109 | `RandomWorkout.tsx` | the sections stand as close as the session sheet's | **1** | 1 | unit/native-random-workout 1 |
| 110 | `RandomWorkout.tsx` | the sections stand 2 apart | **1** | 1 | unit/native-random-workout 1 |
| 111 | `RandomWorkout.tsx` | a filter's tap keeps the old filter | **1** | 1 | unit/native-random-workout 1 |
| 112 | `RandomWorkout.tsx` | the first tap of the reset empties the record | **1** | 1 | unit/native-random-workout 1 |
| 113 | `RandomWorkout.tsx` | the reset says nothing | **1** | 1 | unit/native-random-workout 1 |
| 114 | `RandomWorkout.tsx` | the reset leaves the counter as drawn | **1** | 1 | unit/native-random-workout 1 |
| 115 | `RandomWorkout.tsx` | the reset's ask is taken back when the sheet goes | **1** | 1 | unit/native-random-workout 1 |
| 116 | `RandomWorkout.tsx` | Complete says nothing | **1** | 1 | unit/native-random-workout 1 |
| 117 | `RandomWorkout.tsx` | Complete does not tell the app | **1** | 1 | unit/native-random-workout 1 |
| 118 | `RandomWorkout.tsx` | Complete is offered on a workout done before | **1** | 1 | unit/native-random-workout 1 |
| 119 | `RandomWorkout.tsx` | the badge never reads Done Before | **1** | 1 | unit/native-random-workout 1 |
| 120 | `RandomWorkout.tsx` | a redraw keeps the old fields | **1** | 1 | unit/native-random-workout 1 |
| 121 | `ThisWeek.tsx` | the button asks for Traveling? | **1** | 1 | unit/native-random-workout 1 |
| 122 | `ThisWeek.tsx` | the button's words stay on one line | **1** | 1 | unit/native-random-workout 1 |
| 123 | `ThisWeek.tsx` | the button's words stand at the left | **1** | 1 | unit/native-random-workout 1 |
| 124 | `ThisWeek.tsx` | the counter reads no program | **1** | 1 | unit/native-random-workout 1 |
| 125 | `ThisWeek.tsx` | a deck's open leaves the app's day alone | **1** | 1 | unit/native-random-workout 1 |
| 126 | `ThisWeek.tsx` | a sheet opened from This Week leaves the app's day alone | **1** | 1 | unit/native-random-workout 1 |
| 127 | `SessionSheet.tsx` | a sheet's redraw leaves the app's day alone | **1** | 1 | unit/native-random-workout 1 |
| 128 | `App.tsx` | Random Workout opens under the first week | **1** | 1 | unit/native-random-workout 1 |
| 129 | `App.tsx` | the pop-up reads every day as a rest day | **1** | 1 | unit/native-random-workout 1 |
| 130 | `App.tsx` | the pop-up is raised at once | **1** | 1 | unit/native-random-workout 1 |
| 131 | `App.tsx` | Complete leaves This Week as drawn | **1** | 1 | unit/native-random-workout 1 |
| 132 | `App.tsx` | the reset leaves This Week's counter as drawn | **1** | 1 | unit/native-random-workout 1 |
| 133 | `App.tsx` | a switch keeps the day last opened | **1** | 1 | unit/native-random-workout 1 |
| 134 | `App.tsx` | the active program gone keeps the day last opened | **1** | 1 | unit/native-random-workout 1 |
| 135 | `App.tsx` | Generate keeps the day last opened | **1** | 1 | unit/native-random-workout 1 |
| 136 | `App.tsx` | the filter is made anew at each draw of the app | **1** | 1 | unit/native-random-workout 1 |
| 137 | `App.tsx` | the day in hand is made anew at each draw of the app | **1** | 1 | unit/native-random-workout 1 |

- Breaks made: **137** of 137. Let through by the fast files, so swept: 0. Let through by every file: **0**.
