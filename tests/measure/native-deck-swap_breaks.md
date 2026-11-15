# The Expo deck's swap sheet: a break per rule, and the test files each turns red

Written by `node tests/measure/native-deck-swap_breaks.mjs` (read-only here; each break is made in a copy of the tree and put back).

- The files run on each break: `unit/native-deck-swap.test.ts`, `integration/native-deck-swap.test.ts`, `sweeps/native-deck-swap.test.ts`, `unit/native-deck-logging.test.ts`, `integration/native-deck-logging.test.ts`, `unit/native-deck.test.ts`, `integration/native-deck.test.ts`. Unbroken, they hold 84 tests and all pass.

| # | File | The rule broken | Files red | Tests red | Which |
|---|---|---|---|---|---|
| 1 | `deck-swaps.ts` | the universe ignores the overlay the day was built under | **3** | 5 | sweeps/native-deck-swap 1, integration/native-deck-swap 3, unit/native-deck-swap 1 |
| 2 | `deck-swaps.ts` | the lift going out and the lifts on the card are offered | **3** | 6 | sweeps/native-deck-swap 1, integration/native-deck-swap 4, unit/native-deck-swap 1 |
| 3 | `deck-swaps.ts` | a lift already on the card is offered | **3** | 5 | sweeps/native-deck-swap 1, unit/native-deck-swap 1, integration/native-deck-swap 3 |
| 4 | `deck-swaps.ts` | a lift the day's injury plan drops is offered | **2** | 3 | sweeps/native-deck-swap 1, integration/native-deck-swap 2 |
| 5 | `deck-swaps.ts` | a round's partner is not asked about the station | **1** | 1 | sweeps/native-deck-swap 1 |
| 6 | `deck-swaps.ts` | any lift of the region counts as the same job | **2** | 5 | sweeps/native-deck-swap 1, integration/native-deck-swap 4 |
| 7 | `deck-swaps.ts` | no row of another job is listed | **2** | 5 | sweeps/native-deck-swap 1, integration/native-deck-swap 4 |
| 8 | `deck-swaps.ts` | the list is not ranked by nearness in load | **2** | 4 | sweeps/native-deck-swap 1, integration/native-deck-swap 3 |
| 9 | `deck-swaps.ts` | among equals the heavier does not come first | **2** | 3 | sweeps/native-deck-swap 1, integration/native-deck-swap 2 |
| 10 | `deck-swaps.ts` | more than eight of the same job are listed | **3** | 4 | sweeps/native-deck-swap 1, integration/native-deck-swap 2, unit/native-deck-swap 1 |
| 11 | `deck-swaps.ts` | more than five of another job are listed | **2** | 5 | sweeps/native-deck-swap 1, integration/native-deck-swap 4 |
| 12 | `deck-swaps.ts` | the lighter note is said at one step of difference | **2** | 5 | sweeps/native-deck-swap 1, integration/native-deck-swap 4 |
| 13 | `deck-swaps.ts` | a lift with no pattern lists the pattern's list, not its family's | **2** | 4 | sweeps/native-deck-swap 1, integration/native-deck-swap 3 |
| 14 | `deck-swaps.ts` | the family's list ignores the kit | **2** | 4 | sweeps/native-deck-swap 1, integration/native-deck-swap 3 |
| 15 | `deck-swaps.ts` | the family's list ignores the power doctrine | **2** | 4 | sweeps/native-deck-swap 1, integration/native-deck-swap 3 |
| 16 | `deck-swaps.ts` | the family's list ignores the injury plan | **1** | 1 | sweeps/native-deck-swap 1 |
| 17 | `deck-swaps.ts` | the family's list offers a lift on the card | **2** | 3 | sweeps/native-deck-swap 1, integration/native-deck-swap 2 |
| 18 | `deck-swaps.ts` | the family's list does not ask a round's partner | **1** | 1 | unit/native-deck-swap 1 |
| 19 | `deck-swaps.ts` | the family's list is not sorted | **2** | 4 | sweeps/native-deck-swap 1, integration/native-deck-swap 3 |
| 20 | `deck-swaps.ts` | the family's name is not on the sheet | **2** | 4 | sweeps/native-deck-swap 1, integration/native-deck-swap 3 |
| 21 | `deck-swaps.ts` | the sheet reads the program's plan, not the day's | **2** | 3 | sweeps/native-deck-swap 1, integration/native-deck-swap 2 |
| 22 | `deck-swaps.ts` | the sheet does not say what a pick keeps | **3** | 6 | sweeps/native-deck-swap 1, integration/native-deck-swap 4, unit/native-deck-swap 1 |
| 23 | `deck-swaps.ts` | the heavy compound tag is never shown | **2** | 4 | sweeps/native-deck-swap 1, integration/native-deck-swap 3 |
| 24 | `deck-swaps.ts` | the lift in hand keeps no prescription | **1** | 1 | unit/native-deck-swap 1 |
| 25 | `deck-writes.ts` | a pick keeps no place for put it back | **3** | 8 | sweeps/native-deck-swap 1, integration/native-deck-swap 3, unit/native-deck-swap 4 |
| 26 | `deck-writes.ts` | a kept place holds no dose from before an injury's hold | **2** | 2 | sweeps/native-deck-swap 1, integration/native-deck-swap 1 |
| 27 | `deck-writes.ts` | the dose carries with the plan's cue on it | **1** | 1 | sweeps/native-deck-swap 1 |
| 28 | `deck-writes.ts` | the dose carries from the card, not from beneath the hold | **1** | 1 | sweeps/native-deck-swap 1 |
| 29 | `deck-writes.ts` | the dose carries verbatim onto any lift | **3** | 6 | sweeps/native-deck-swap 1, integration/native-deck-swap 2, unit/native-deck-swap 3 |
| 30 | `deck-writes.ts` | an injured day's plan is not asked | **2** | 2 | sweeps/native-deck-swap 1, integration/native-deck-swap 1 |
| 31 | `deck-writes.ts` | the dose before the plan's filter is not kept beside the card | **2** | 2 | sweeps/native-deck-swap 1, integration/native-deck-swap 1 |
| 32 | `deck-writes.ts` | the hold is said on every pick of an injured day | **2** | 2 | sweeps/native-deck-swap 1, integration/native-deck-swap 1 |
| 33 | `deck-writes.ts` | the card keeps the dose from before the plan's filter | **2** | 2 | sweeps/native-deck-swap 1, integration/native-deck-swap 1 |
| 34 | `deck-writes.ts` | a label naming the lift keeps the old name | **3** | 5 | sweeps/native-deck-swap 1, integration/native-deck-swap 3, unit/native-deck-swap 1 |
| 35 | `deck-writes.ts` | a pick is not counted | **4** | 8 | sweeps/native-deck-swap 1, integration/native-deck-swap 3, unit/native-deck-logging 1, unit/native-deck-swap 3 |
| 36 | `deck-writes.ts` | a pick does not renew the day's snapshot | **3** | 5 | sweeps/native-deck-swap 1, integration/native-deck-swap 3, unit/native-deck-swap 1 |
| 37 | `deck-writes.ts` | the toast names the lift going out as it is written | **3** | 6 | sweeps/native-deck-swap 1, integration/native-deck-swap 3, unit/native-deck-swap 2 |
| 38 | `deck-writes.ts` | the plain toast's words | **3** | 5 | sweeps/native-deck-swap 1, integration/native-deck-swap 3, unit/native-deck-swap 1 |
| 39 | `deck-writes.ts` | the no load toast's words | **2** | 3 | sweeps/native-deck-swap 1, integration/native-deck-swap 2 |
| 40 | `deck-writes.ts` | the window toast's words | **2** | 2 | sweeps/native-deck-swap 1, unit/native-deck-swap 1 |
| 41 | `deck-writes.ts` | the held no load toast's words | **1** | 1 | sweeps/native-deck-swap 1 |
| 42 | `deck-writes.ts` | the held window toast's words | **1** | 1 | unit/native-deck-swap 1 |
| 43 | `deck-writes.ts` | the held plain toast's words | **1** | 1 | unit/native-deck-swap 1 |
| 44 | `deck-writes.ts` | put it back reads another week's records | **3** | 8 | sweeps/native-deck-swap 1, integration/native-deck-swap 3, unit/native-deck-swap 4 |
| 45 | `deck-writes.ts` | put it back does not give the name back | **3** | 8 | sweeps/native-deck-swap 1, integration/native-deck-swap 3, unit/native-deck-swap 4 |
| 46 | `deck-writes.ts` | put it back does not give the lift its own dose back | **3** | 5 | sweeps/native-deck-swap 1, unit/native-deck-swap 3, integration/native-deck-swap 1 |
| 47 | `deck-writes.ts` | put it back leaves the dose kept before a hold on the card | **2** | 2 | sweeps/native-deck-swap 1, integration/native-deck-swap 1 |
| 48 | `deck-writes.ts` | put it back does not bring the dose kept before a hold | **2** | 2 | sweeps/native-deck-swap 1, integration/native-deck-swap 1 |
| 49 | `deck-writes.ts` | put it back gives a dose to a place that no longer holds the lift | **1** | 1 | unit/native-deck-swap 1 |
| 50 | `deck-writes.ts` | put it back leaves the record | **4** | 7 | sweeps/native-deck-swap 1, integration/native-deck-swap 3, unit/native-deck-logging 1, unit/native-deck-swap 2 |
| 51 | `deck-writes.ts` | put it back does not renew the day's snapshot | **3** | 5 | sweeps/native-deck-swap 1, integration/native-deck-swap 3, unit/native-deck-swap 1 |
| 52 | `deck-writes.ts` | put it back's words | **3** | 5 | sweeps/native-deck-swap 1, integration/native-deck-swap 3, unit/native-deck-swap 1 |
| 53 | `set-fields.ts` | the summary is restated from the cells at once | **3** | 3 | sweeps/native-deck-swap 1, unit/native-deck-logging 1, integration/native-deck-swap 1 |
| 54 | `set-fields.ts` | the summary's words are restated at once | **1** | 1 | sweeps/native-deck-swap 1 |
| 55 | `set-fields.ts` | Varied is restated at once | **1** | 1 | unit/native-deck-logging 1 |
| 56 | `set-fields.ts` | the load's label is restated at once | **2** | 2 | sweeps/native-deck-swap 1, unit/native-deck-logging 1 |
| 57 | `set-fields.ts` | opening the sets restates nothing | **1** | 1 | unit/native-deck-logging 1 |
| 58 | `set-fields.ts` | a move with no load cell is restated when a load changes or its sets open | **1** | 1 | unit/native-deck-logging 1 |
| 59 | `set-fields.ts` | a step restates nothing | **4** | 10 | sweeps/native-deck-swap 1, integration/native-deck-logging 4, integration/native-deck-swap 3, unit/native-deck-logging 2 |
| 60 | `set-fields.ts` | a typed rep restates nothing | **2** | 3 | integration/native-deck-logging 1, unit/native-deck-logging 2 |
| 61 | `set-fields.ts` | a load typed restates nothing | **1** | 1 | unit/native-deck-logging 1 |
| 62 | `set-fields.ts` | Log restates nothing | **4** | 6 | sweeps/native-deck-swap 1, integration/native-deck-logging 1, integration/native-deck-swap 2, unit/native-deck-logging 2 |
| 63 | `deck-screen.ts` | the top card wears a cover | **1** | 1 | unit/native-deck 1 |
| 64 | `deck-screen.ts` | the card behind is not raised by a drag | **1** | 1 | unit/native-deck 1 |
| 65 | `deck-screen.ts` | the card behind does not come up as the top one leaves | **1** | 1 | unit/native-deck 1 |
| 66 | `deck-screen.ts` | a card of the fan is raised by a drag | **1** | 1 | unit/native-deck 1 |
| 67 | `Deck.tsx` | the swap mark opens no sheet | **1** | 1 | unit/native-deck-logging 1 |
| 68 | `Deck.tsx` | a pick does not draw the day again | **1** | 1 | unit/native-deck-logging 1 |
| 69 | `Deck.tsx` | a pick raises no toast | **1** | 1 | unit/native-deck-logging 1 |
| 70 | `Deck.tsx` | put it back does not draw the day again | **1** | 1 | unit/native-deck-logging 1 |
| 71 | `Deck.tsx` | the sheet opens with a field still holding the keyboard | **1** | 1 | unit/native-deck-logging 1 |
| 72 | `Deck.tsx` | the words wear an opacity of their own again | **1** | 1 | unit/native-deck 1 |
| 73 | `SwapSheet.tsx` | a second tap on a row picks again | **1** | 1 | unit/native-deck-swap 1 |
| 74 | `SwapSheet.tsx` | a row picks nothing | **1** | 1 | unit/native-deck-swap 1 |
| 75 | `SwapSheet.tsx` | the sheet stays under Reduce Motion | **1** | 1 | unit/native-deck-swap 1 |

- Breaks made: **75** of 75. Let through by every file: **0**.
