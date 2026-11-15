# The Expo deck's logging: a break per rule, and the test files each turns red

Written by `node tests/measure/native-deck-logging_breaks.mjs` (read-only here; each break is made in a copy of the tree and put back).

- The files run on each break: `unit/native-deck-logging.test.ts`, `integration/native-deck-logging.test.ts`, `unit/native-deck.test.ts`, `integration/native-deck.test.ts`, `unit/native-this-week.test.ts`, `integration/native-this-week.test.ts`. Unbroken, they hold 141 tests and all pass.

| # | File | The rule broken | Files red | Tests red | Which |
|---|---|---|---|---|---|
| 1 | `set-fields.ts` | a step can go under zero | **2** | 3 | integration/native-deck-logging 2, unit/native-deck-logging 1 |
| 2 | `set-fields.ts` | a step on a blank set starts from nothing, not its placeholder | **1** | 1 | unit/native-deck-logging 1 |
| 3 | `set-fields.ts` | a set's load cleared does not inherit again | **2** | 5 | integration/native-deck-logging 4, unit/native-deck-logging 1 |
| 4 | `set-fields.ts` | the load field reaches every set, typed on its own or not | **2** | 5 | integration/native-deck-logging 4, unit/native-deck-logging 1 |
| 5 | `set-fields.ts` | the reuse pill does not reach the sets | **2** | 3 | integration/native-deck-logging 2, unit/native-deck-logging 1 |
| 6 | `set-fields.ts` | Fill every set leaves the cells inheriting | **2** | 3 | integration/native-deck-logging 2, unit/native-deck-logging 1 |
| 7 | `set-fields.ts` | Log does not leave the load solid in its field | **2** | 5 | integration/native-deck-logging 4, unit/native-deck-logging 1 |
| 8 | `set-fields.ts` | Log does not restate the reuse pill | **1** | 2 | unit/native-deck-logging 2 |
| 9 | `set-fields.ts` | a blank set logs 0, not its placeholder | **1** | 1 | unit/native-deck-logging 1 |
| 10 | `set-fields.ts` | a blank load cell logs 0, not the load it inherits | **2** | 10 | integration/native-deck-logging 4, unit/native-deck-logging 6 |
| 11 | `set-fields.ts` | a draft holds placeholders for untouched sets | **1** | 3 | integration/native-deck-logging 3 |
| 12 | `set-fields.ts` | a draft holds the inherited load for untouched cells | **2** | 6 | integration/native-deck-logging 4, unit/native-deck-logging 2 |
| 13 | `set-fields.ts` | Varied reads the loads alone | **2** | 6 | integration/native-deck-logging 5, unit/native-deck-logging 1 |
| 14 | `set-fields.ts` | the top set is marked while every set is the same | **2** | 5 | integration/native-deck-logging 4, unit/native-deck-logging 1 |
| 15 | `set-fields.ts` | a set shows no difference from its target | **2** | 6 | integration/native-deck-logging 5, unit/native-deck-logging 1 |
| 16 | `deck-writes.ts` | Log stores the load field, not the heaviest set | **2** | 5 | integration/native-deck-logging 4, unit/native-deck-logging 1 |
| 17 | `deck-writes.ts` | a kilogram program stores each set's load unconverted | **2** | 2 | integration/native-deck-logging 1, unit/native-deck-logging 1 |
| 18 | `deck-writes.ts` | a kilogram program stores the load field unconverted | **1** | 1 | integration/native-deck-logging 1 |
| 19 | `deck-writes.ts` | Log leaves the draft in the day's log | **2** | 7 | unit/native-deck-logging 2, integration/native-deck-logging 5 |
| 20 | `deck-writes.ts` | Log does not snapshot the day | **1** | 1 | unit/native-deck-logging 1 |
| 21 | `deck-writes.ts` | a draft does not snapshot the day | **2** | 7 | integration/native-deck-logging 5, unit/native-deck-logging 2 |
| 22 | `deck-writes.ts` | a draft stores the load field's placeholder | **1** | 1 | unit/native-deck-logging 1 |
| 23 | `deck-writes.ts` | a change after Log is kept as a draft, not committed | **2** | 6 | integration/native-deck-logging 5, unit/native-deck-logging 1 |
| 24 | `deck-writes.ts` | a change after Log loses the prescription it was logged under | **2** | 6 | integration/native-deck-logging 5, unit/native-deck-logging 1 |
| 25 | `deck-writes.ts` | Done, next one is not quiet | **2** | 5 | integration/native-deck-logging 4, unit/native-deck-logging 1 |
| 26 | `deck-writes.ts` | Done, next one logs a logged move again | **2** | 3 | integration/native-deck-logging 2, unit/native-deck-logging 1 |
| 27 | `deck-writes.ts` | a move with nothing to log is logged anyway | **1** | 2 | unit/native-deck-logging 2 |
| 28 | `deck-writes.ts` | the toast's words change | **2** | 9 | integration/native-deck-logging 5, unit/native-deck-logging 4 |
| 29 | `deck-writes.ts` | Mark the day done stores an effort the slider never gave | **2** | 4 | integration/native-deck-logging 3, unit/native-deck-logging 1 |
| 30 | `deck-writes.ts` | Mark the day done drops the day's other fields | **2** | 5 | integration/native-deck-logging 4, unit/native-deck-logging 1 |
| 31 | `deck-writes.ts` | Mark the day done stores another status | **2** | 5 | integration/native-deck-logging 4, unit/native-deck-logging 1 |
| 32 | `deck-writes.ts` | Mark the day done does not snapshot the day | **1** | 1 | unit/native-deck-logging 1 |
| 33 | `deck-writes.ts` | a skip does not store the edit | **2** | 4 | integration/native-deck-logging 3, unit/native-deck-logging 1 |
| 34 | `deck-writes.ts` | a put back does not clear the edit | **2** | 4 | integration/native-deck-logging 3, unit/native-deck-logging 1 |
| 35 | `deck-writes.ts` | a skip does not renew the day's snapshot | **2** | 4 | integration/native-deck-logging 3, unit/native-deck-logging 1 |
| 36 | `deck-writes.ts` | a put back leaves the move marked on the day | **2** | 4 | unit/native-deck-logging 1, integration/native-deck-logging 3 |
| 37 | `deck-writes.ts` | a round is stored under another token | **2** | 4 | integration/native-deck-logging 3, unit/native-deck-logging 1 |
| 38 | `deck-writes.ts` | the skip's words change | **2** | 5 | integration/native-deck-logging 3, unit/native-deck-logging 2 |
| 39 | `deck-screen.ts` | the stale warning speaks again after an edit | **2** | 3 | integration/native-deck-logging 1, integration/native-deck 2 |
| 40 | `deck-screen.ts` | a card is logged once any move is | **1** | 1 | unit/native-deck-logging 1 |
| 41 | `week-screen.ts` | the launch loads an archived program the pointer names | **1** | 1 | unit/native-this-week 1 |
| 42 | `week-screen.ts` | the launch falls back to no other program | **1** | 1 | unit/native-this-week 1 |
| 43 | `week-screen.ts` | the launch does not write the pointer | **1** | 2 | unit/native-this-week 2 |
| 44 | `week-screen.ts` | the launch leaves a pointer that leads nowhere | **1** | 2 | unit/native-this-week 2 |
| 45 | `week-screen.ts` | the launch folds the lift log and does not store it | **3** | 5 | integration/native-deck 1, integration/native-this-week 2, unit/native-this-week 2 |
| 46 | `week-screen.ts` | the launch does not fold the lift log | **3** | 5 | integration/native-deck 1, integration/native-this-week 2, unit/native-this-week 2 |
| 47 | `week-screen.ts` | the launch is handed a store that drops writes | **3** | 13 | integration/native-deck-logging 2, integration/native-this-week 9, unit/native-this-week 2 |

- Breaks made: **47** of 47. Let through by every file: **0**.
