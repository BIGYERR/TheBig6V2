# The Expo app's cardio sheet: a break per rule, and the test files each turns red

Written by `node tests/measure/native-cardio-sheet_breaks.mjs` (read-only here; each break is made in a copy of the tree and put back).

- The fast files, run on each break: `unit/native-cardio-sheet.test.ts`, `integration/native-cardio-sheet.test.ts`, `unit/native-session-sheet.test.ts`, `unit/native-deck.test.ts`, `unit/native-shell.test.ts`. Unbroken, they hold 202 tests and all pass.
- The sweep, run only on a break the fast files let through: `sweeps/native-cardio-sheet.test.ts` (1 tests, all passing unbroken).

| # | File | The rule broken | Files red | Tests red | Which |
|---|---|---|---|---|---|
| 1 | `wheels.ts` | a wheel row is 40 points | **2** | 6 | integration/native-cardio-sheet 3, unit/native-cardio-sheet 3 |
| 2 | `wheels.ts` | a wheel is read 200 ms after it last moved | **1** | 1 | unit/native-cardio-sheet 1 |
| 3 | `wheels.ts` | a blank time lands on a dash | **1** | 1 | unit/native-cardio-sheet 1 |
| 4 | `wheels.ts` | a stored time is read to the minute, its seconds dropped | **2** | 4 | integration/native-cardio-sheet 2, unit/native-cardio-sheet 2 |
| 5 | `wheels.ts` | a time over the dial is not pegged at its ceiling | **1** | 1 | unit/native-cardio-sheet 1 |
| 6 | `wheels.ts` | a blank pace lands on 4:00 | **2** | 3 | integration/native-cardio-sheet 1, unit/native-cardio-sheet 2 |
| 7 | `wheels.ts` | blank miles land on a dash | **1** | 1 | unit/native-cardio-sheet 1 |
| 8 | `wheels.ts` | whole miles are not held to 99 | **1** | 1 | unit/native-cardio-sheet 1 |
| 9 | `wheels.ts` | the hundredths of stored miles are dropped | **2** | 4 | integration/native-cardio-sheet 2, unit/native-cardio-sheet 2 |
| 10 | `wheels.ts` | a malformed rep time lands on a dash | **1** | 1 | unit/native-cardio-sheet 1 |
| 11 | `wheels.ts` | a pace is not held to its dial | **1** | 1 | unit/native-cardio-sheet 1 |
| 12 | `wheels.ts` | seconds are not held to 59 | **1** | 1 | unit/native-cardio-sheet 1 |
| 13 | `wheels.ts` | the dash stores a clock with no minutes | **2** | 3 | integration/native-cardio-sheet 1, unit/native-cardio-sheet 2 |
| 14 | `wheels.ts` | the zero clock stores 0.00 | **2** | 4 | integration/native-cardio-sheet 2, unit/native-cardio-sheet 2 |
| 15 | `wheels.ts` | a time stores one decimal place | **2** | 5 | integration/native-cardio-sheet 2, unit/native-cardio-sheet 3 |
| 16 | `wheels.ts` | zero miles store 0.00 | **2** | 3 | integration/native-cardio-sheet 1, unit/native-cardio-sheet 2 |
| 17 | `wheels.ts` | the zero rep clock stores 0:00 | **2** | 2 | integration/native-cardio-sheet 1, unit/native-cardio-sheet 1 |
| 18 | `wheels.ts` | a clock does not pad its seconds | **2** | 3 | integration/native-cardio-sheet 2, unit/native-cardio-sheet 1 |
| 19 | `wheels.ts` | a wrapped column opens from its first copy | **2** | 5 | integration/native-cardio-sheet 3, unit/native-cardio-sheet 2 |
| 20 | `wheels.ts` | a blank wheel does not open on the plan | **2** | 3 | integration/native-cardio-sheet 2, unit/native-cardio-sheet 1 |
| 21 | `wheels.ts` | a wheel looks for its value from the first row | **2** | 4 | integration/native-cardio-sheet 3, unit/native-cardio-sheet 1 |
| 22 | `wheels.ts` | the face a wheel opens on is its stored string, not what it shows | **2** | 3 | unit/native-cardio-sheet 1, integration/native-cardio-sheet 2 |
| 23 | `wheels.ts` | a rest reads the row above its offset | **1** | 1 | unit/native-cardio-sheet 1 |
| 24 | `wheels.ts` | a rest past the last row reads no row | **1** | 1 | unit/native-cardio-sheet 1 |
| 25 | `wheels.ts` | a wrapped column is never jumped back | **2** | 4 | unit/native-cardio-sheet 1, integration/native-cardio-sheet 3 |
| 26 | `wheels.ts` | a column in its first copy is not jumped forward | **2** | 4 | integration/native-cardio-sheet 3, unit/native-cardio-sheet 1 |
| 27 | `wheels.ts` | a column in its last copy is not jumped back | **1** | 1 | unit/native-cardio-sheet 1 |
| 28 | `wheels.ts` | opening a day writes the face it opened on | **2** | 4 | integration/native-cardio-sheet 3, unit/native-cardio-sheet 1 |
| 29 | `wheels.ts` | a wheel never counts as moved | **2** | 4 | integration/native-cardio-sheet 3, unit/native-cardio-sheet 1 |
| 30 | `wheels.ts` | a rest on the face the field holds writes it again | **1** | 1 | unit/native-cardio-sheet 1 |
| 31 | `cardio-log.ts` | the stepper shows its stored count at the draw, not the plan | **2** | 2 | integration/native-cardio-sheet 1, unit/native-cardio-sheet 1 |
| 32 | `cardio-log.ts` | the planned dose is not kept for the way back | **2** | 5 | integration/native-cardio-sheet 3, unit/native-cardio-sheet 2 |
| 33 | `cardio-log.ts` | the picker is shut at the draw of a swapped sport | **1** | 1 | unit/native-cardio-sheet 1 |
| 34 | `cardio-log.ts` | the note is not drawn at the open | **1** | 1 | unit/native-cardio-sheet 1 |
| 35 | `cardio-log.ts` | a rolled wheel is saved on a draft card | **2** | 4 | integration/native-cardio-sheet 3, unit/native-cardio-sheet 1 |
| 36 | `cardio-log.ts` | a rolled wheel is never saved | **2** | 4 | integration/native-cardio-sheet 3, unit/native-cardio-sheet 1 |
| 37 | `cardio-log.ts` | the readout ignores the reps | **2** | 2 | integration/native-cardio-sheet 1, unit/native-cardio-sheet 1 |
| 38 | `cardio-log.ts` | the work done row is dropped | **2** | 2 | integration/native-cardio-sheet 1, unit/native-cardio-sheet 1 |
| 39 | `cardio-log.ts` | a gap reads on target inside ten seconds | **2** | 2 | integration/native-cardio-sheet 1, unit/native-cardio-sheet 1 |
| 40 | `cardio-log.ts` | a gap over a minute prints seconds | **2** | 4 | integration/native-cardio-sheet 3, unit/native-cardio-sheet 1 |
| 41 | `cardio-log.ts` | faster and slower are swapped | **2** | 4 | unit/native-cardio-sheet 1, integration/native-cardio-sheet 3 |
| 42 | `cardio-log.ts` | the readout leaves out what it assumed | **1** | 2 | unit/native-cardio-sheet 2 |
| 43 | `cardio-log.ts` | the readout leaves out the work minutes | **1** | 1 | unit/native-cardio-sheet 1 |
| 44 | `cardio-log.ts` | the pace is never joined to the work done | **2** | 2 | integration/native-cardio-sheet 1, unit/native-cardio-sheet 1 |
| 45 | `cardio-log.ts` | the empty row asks for distance on a distance run | **2** | 3 | integration/native-cardio-sheet 2, unit/native-cardio-sheet 1 |
| 46 | `cardio-log.ts` | a rep session's empty row reads Your pace | **2** | 2 | integration/native-cardio-sheet 1, unit/native-cardio-sheet 1 |
| 47 | `cardio-log.ts` | the stepper starts from zero, not the plan | **2** | 2 | integration/native-cardio-sheet 1, unit/native-cardio-sheet 1 |
| 48 | `cardio-log.ts` | the stepper goes past thirty | **1** | 1 | unit/native-cardio-sheet 1 |
| 49 | `cardio-log.ts` | the stepper goes under zero | **1** | 1 | unit/native-cardio-sheet 1 |
| 50 | `cardio-log.ts` | a step on a draft card is saved | **2** | 2 | integration/native-cardio-sheet 1, unit/native-cardio-sheet 1 |
| 51 | `cardio-log.ts` | a step on a logged card is not saved | **2** | 2 | integration/native-cardio-sheet 1, unit/native-cardio-sheet 1 |
| 52 | `cardio-log.ts` | the stepper does not show its new count | **2** | 2 | unit/native-cardio-sheet 1, integration/native-cardio-sheet 1 |
| 53 | `cardio-log.ts` | a ride's toast reads Run logged | **2** | 3 | integration/native-cardio-sheet 1, unit/native-cardio-sheet 2 |
| 54 | `cardio-log.ts` | Log on an empty card writes and says logged | **2** | 4 | integration/native-cardio-sheet 3, unit/native-cardio-sheet 1 |
| 55 | `cardio-log.ts` | the empty card's words are shorter | **2** | 4 | integration/native-cardio-sheet 3, unit/native-cardio-sheet 1 |
| 56 | `cardio-log.ts` | Log saves as a draft does, with no commit | **2** | 7 | integration/native-cardio-sheet 2, unit/native-cardio-sheet 5 |
| 57 | `cardio-log.ts` | Log reads the planned sport, not the one the card is on | **2** | 2 | integration/native-cardio-sheet 1, unit/native-cardio-sheet 1 |
| 58 | `cardio-log.ts` | the picker never opens | **2** | 4 | integration/native-cardio-sheet 3, unit/native-cardio-sheet 1 |
| 59 | `sheet-writes.ts` | a chip parks nothing | **2** | 6 | integration/native-cardio-sheet 3, unit/native-cardio-sheet 3 |
| 60 | `sheet-writes.ts` | a chip parks a sport with no number in it | **2** | 4 | integration/native-cardio-sheet 3, unit/native-cardio-sheet 1 |
| 61 | `sheet-writes.ts` | a chip leaves the leaving sport's numbers at the top level | **1** | 1 | unit/native-cardio-sheet 1 |
| 62 | `sheet-writes.ts` | the way back does not return the parked numbers | **2** | 4 | integration/native-cardio-sheet 3, unit/native-cardio-sheet 1 |
| 63 | `sheet-writes.ts` | a returned sport stays in the park | **2** | 4 | integration/native-cardio-sheet 3, unit/native-cardio-sheet 1 |
| 64 | `sheet-writes.ts` | an empty park is stored | **2** | 4 | integration/native-cardio-sheet 3, unit/native-cardio-sheet 1 |
| 65 | `sheet-writes.ts` | the park is not stored | **2** | 6 | integration/native-cardio-sheet 3, unit/native-cardio-sheet 3 |
| 66 | `cardio-log.ts` | the new sport is drawn with the planned dose | **2** | 4 | integration/native-cardio-sheet 3, unit/native-cardio-sheet 1 |
| 67 | `cardio-log.ts` | the way back draws the planned sport with no dose | **2** | 4 | integration/native-cardio-sheet 3, unit/native-cardio-sheet 1 |
| 68 | `cardio-log.ts` | the form keeps the leaving sport's fields | **2** | 5 | integration/native-cardio-sheet 3, unit/native-cardio-sheet 2 |
| 69 | `cardio-log.ts` | the card stays on the leaving sport | **2** | 6 | integration/native-cardio-sheet 3, unit/native-cardio-sheet 3 |
| 70 | `cardio-log.ts` | the note shows on the planned sport too | **2** | 4 | integration/native-cardio-sheet 3, unit/native-cardio-sheet 1 |
| 71 | `cardio-log.ts` | a chip does not save the new form | **2** | 6 | integration/native-cardio-sheet 3, unit/native-cardio-sheet 3 |
| 72 | `cardio-log.ts` | a chip keeps the old fields on show | **2** | 4 | integration/native-cardio-sheet 3, unit/native-cardio-sheet 1 |
| 73 | `cardio-log.ts` | a chip keeps the old note | **2** | 5 | integration/native-cardio-sheet 3, unit/native-cardio-sheet 2 |
| 74 | `cardio-sheet-model.ts` | the model's copy: one cardio alone keeps the whole day's body | **2** | 4 | integration/native-cardio-sheet 2, unit/native-cardio-sheet 2 |
| 75 | `cardio-sheet-model.ts` | the model's copy: a day with a lift keeps Done and Skip on the cardio's sheet | **2** | 4 | integration/native-cardio-sheet 2, unit/native-cardio-sheet 2 |
| 76 | `sheet-screen.ts` | the frame is always the whole day | **2** | 4 | integration/native-cardio-sheet 3, unit/native-cardio-sheet 1 |
| 77 | `sheet-screen.ts` | the frame reads no lift on any day | **2** | 3 | integration/native-cardio-sheet 2, unit/native-cardio-sheet 1 |
| 78 | `sheet-screen.ts` | the frame drops the whole day's counter | **2** | 3 | integration/native-cardio-sheet 2, unit/native-cardio-sheet 1 |
| 79 | `sheet-screen.ts` | one cardio alone keeps a travel tag | **2** | 4 | integration/native-cardio-sheet 3, unit/native-cardio-sheet 1 |
| 80 | `ThisWeek.tsx` | the hand log opens the whole day | **1** | 1 | unit/native-cardio-sheet 1 |
| 81 | `ThisWeek.tsx` | Reopen on a done run opens nothing | **2** | 2 | unit/native-cardio-sheet 1, unit/native-session-sheet 1 |
| 82 | `ThisWeek.tsx` | the sheet is opened without the cardio it was asked for | **1** | 1 | unit/native-session-sheet 1 |
| 83 | `ThisWeek.tsx` | a sunk button presses | **1** | 1 | unit/native-deck 1 |
| 84 | `ThisWeek.tsx` | the when line is the card's own label | **1** | 1 | unit/native-cardio-sheet 1 |
| 85 | `ThisWeek.tsx` | a card's cardio tap has nowhere to go | **2** | 2 | unit/native-cardio-sheet 1, unit/native-session-sheet 1 |
| 86 | `SessionSheet.tsx` | the cardio log is not drawn | **1** | 1 | unit/native-session-sheet 1 |
| 87 | `SessionSheet.tsx` | the add button stands on one cardio alone | **1** | 1 | unit/native-cardio-sheet 1 |
| 88 | `SessionSheet.tsx` | Done and Skip stand on every sheet | **1** | 1 | unit/native-cardio-sheet 1 |
| 89 | `SessionSheet.tsx` | the frame is the whole day | **1** | 1 | unit/native-cardio-sheet 1 |
| 90 | `SessionSheet.tsx` | the header keeps the whole day's title | **1** | 1 | unit/native-cardio-sheet 1 |
| 91 | `SessionSheet.tsx` | the body draws the whole day | **1** | 1 | unit/native-session-sheet 1 |
| 92 | `SessionSheet.tsx` | Log does not rest the wheels | **1** | 1 | unit/native-cardio-sheet 1 |
| 93 | `SessionSheet.tsx` | Log's toast is not raised | **1** | 1 | unit/native-cardio-sheet 1 |
| 94 | `SessionSheet.tsx` | a chip does not rest the wheels | **1** | 1 | unit/native-cardio-sheet 1 |
| 95 | `SessionSheet.tsx` | a chip does not start the wheels afresh | **1** | 1 | unit/native-cardio-sheet 1 |
| 96 | `SessionSheet.tsx` | a chip does not hold the new form | **1** | 1 | unit/native-cardio-sheet 1 |
| 97 | `SessionSheet.tsx` | the slider saves with the draw's dose | **1** | 1 | unit/native-session-sheet 1 |
| 98 | `SessionSheet.tsx` | a status tap saves with the draw's dose | **1** | 1 | unit/native-session-sheet 1 |
| 99 | `SessionSheet.tsx` | an undo rests the wheels too | **1** | 1 | unit/native-cardio-sheet 1 |
| 100 | `SessionSheet.tsx` | a status set does not rest the wheels | **1** | 1 | unit/native-cardio-sheet 1 |
| 101 | `SessionSheet.tsx` | the Log button keeps the draw's flag | **1** | 1 | unit/native-cardio-sheet 1 |
| 102 | `SessionSheet.tsx` | a redraw keeps the old cardio card | **1** | 1 | unit/native-session-sheet 1 |
| 103 | `SessionSheet.tsx` | a wheel reads the draw's form, not the form in hand | **1** | 1 | unit/native-cardio-sheet 1 |
| 104 | `SessionSheet.tsx` | the stepper does not hold its new card | **1** | 1 | unit/native-cardio-sheet 1 |
| 105 | `CardioLogBlock.tsx` | the free wheel's line reads From the watch | **1** | 1 | unit/native-cardio-sheet 1 |
| 106 | `CardioLogBlock.tsx` | the ride's label reads Log the bike | **1** | 1 | unit/native-cardio-sheet 1 |
| 107 | `CardioLogBlock.tsx` | the picker's link reads Did something else | **1** | 1 | unit/native-cardio-sheet 1 |
| 108 | `CardioLogBlock.tsx` | the chips' heading reads Logged under | **1** | 1 | unit/native-cardio-sheet 1 |
| 109 | `CardioLogBlock.tsx` | the stepper's label reads Reps done | **1** | 1 | unit/native-cardio-sheet 1 |
| 110 | `CardioLogBlock.tsx` | the swim's box asks for yds | **1** | 1 | unit/native-cardio-sheet 1 |
| 111 | `CardioLogBlock.tsx` | a chip reads its sport, not its words | **1** | 1 | unit/native-cardio-sheet 1 |
| 112 | `CardioLogBlock.tsx` | the Log button's words are its own | **1** | 1 | unit/native-cardio-sheet 1 |
| 113 | `CardioLogBlock.tsx` | the wheels do not start afresh at a draw | **1** | 1 | unit/native-cardio-sheet 1 |
| 114 | `CardioLogBlock.tsx` | a wheel's rest is not handed to the form | **1** | 1 | unit/native-cardio-sheet 1 |
| 115 | `CardioLogBlock.tsx` | the speed day's hint is dropped | **1** | 1 | unit/native-cardio-sheet 1 |
| 116 | `Wheel.tsx` | a wheel waits 250 ms of its own | **1** | 1 | unit/native-cardio-sheet 1 |
| 117 | `Wheel.tsx` | a wheel writes whatever it rests on, past the rule | **1** | 1 | unit/native-cardio-sheet 1 |
| 118 | `Wheel.tsx` | a wheel forgets that it moved | **1** | 1 | unit/native-cardio-sheet 1 |
| 119 | `Wheel.tsx` | a wheel opens at its first row | **1** | 1 | unit/native-cardio-sheet 1 |
| 120 | `Wheel.tsx` | a wheel does not snap to a row | **1** | 1 | unit/native-cardio-sheet 1 |
| 121 | `Wheel.tsx` | a wheel asked to rest clears its timer and reads nothing | **1** | 1 | unit/native-cardio-sheet 1 |
| 122 | `Wheel.tsx` | a wrapped column is not jumped back on the screen | **1** | 1 | unit/native-cardio-sheet 1 |

- Breaks made: **122** of 122. Let through by the fast files, so swept: 0. Let through by every file: **0**.
