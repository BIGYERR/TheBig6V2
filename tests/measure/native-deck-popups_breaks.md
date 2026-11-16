# The Expo app's pop-ups: a break per rule, and the test files each turns red

Written by `node tests/measure/native-deck-popups_breaks.mjs` (read-only here; each break is made in a copy of the tree and put back).

- The files run on each break: `unit/native-pop-ups.test.ts`, `integration/native-pop-ups.test.ts`, `sweeps/native-pop-ups.test.ts`, `unit/native-deck-logging.test.ts`, `integration/native-deck-logging.test.ts`, `integration/native-deck-swap.test.ts`, `unit/native-deck.test.ts`, `unit/native-shell.test.ts`. Unbroken, they hold 123 tests and all pass.

| # | File | The rule broken | Files red | Tests red | Which |
|---|---|---|---|---|---|
| 1 | `pop-ups.ts` | a line of the reminder's pool reads otherwise | **3** | 4 | sweeps/native-pop-ups 1, integration/native-pop-ups 2, unit/native-pop-ups 1 |
| 2 | `pop-ups.ts` | the workout pop-up drops 70 pieces of confetti | **5** | 10 | sweeps/native-pop-ups 1, integration/native-deck-logging 4, integration/native-deck-swap 1, integration/native-pop-ups 2, unit/native-pop-ups 2 |
| 3 | `pop-ups.ts` | the button's words are drawn afresh at every pop-up | **5** | 8 | sweeps/native-pop-ups 1, integration/native-deck-logging 3, integration/native-deck-swap 1, integration/native-pop-ups 2, unit/native-pop-ups 1 |
| 4 | `pop-ups.ts` | the button's words may be yesterday's again | **3** | 3 | sweeps/native-pop-ups 1, integration/native-pop-ups 1, unit/native-pop-ups 1 |
| 5 | `pop-ups.ts` | the button's words are not kept | **5** | 9 | sweeps/native-pop-ups 1, integration/native-deck-logging 3, integration/native-deck-swap 1, integration/native-pop-ups 1, unit/native-pop-ups 3 |
| 6 | `pop-ups.ts` | the day is stamped with leading zeros | **5** | 11 | sweeps/native-pop-ups 1, integration/native-deck-logging 5, integration/native-deck-swap 2, integration/native-pop-ups 2, unit/native-pop-ups 1 |
| 7 | `pop-ups.ts` | a weekend is read off the clock, not the trained day | **3** | 4 | sweeps/native-pop-ups 1, integration/native-deck-logging 2, integration/native-deck-swap 1 |
| 8 | `pop-ups.ts` | a morning is any day marked before nine | **5** | 5 | sweeps/native-pop-ups 1, integration/native-deck-logging 1, integration/native-deck-swap 1, integration/native-pop-ups 1, unit/native-pop-ups 1 |
| 9 | `pop-ups.ts` | a day with a run is not read as cardio | **3** | 3 | sweeps/native-pop-ups 1, integration/native-pop-ups 1, unit/native-pop-ups 1 |
| 10 | `pop-ups.ts` | a mobility block counts as lifting | **3** | 3 | sweeps/native-pop-ups 1, integration/native-pop-ups 1, unit/native-pop-ups 1 |
| 11 | `pop-ups.ts` | a tagged line is drawn on a day that cannot be read | **1** | 1 | unit/native-pop-ups 1 |
| 12 | `pop-ups.ts` | a weekend's line is drawn on any day | **5** | 7 | sweeps/native-pop-ups 1, integration/native-deck-logging 3, integration/native-deck-swap 1, integration/native-pop-ups 1, unit/native-pop-ups 1 |
| 13 | `pop-ups.ts` | a morning's line is drawn at any hour | **4** | 5 | sweeps/native-pop-ups 1, integration/native-deck-logging 2, integration/native-deck-swap 1, integration/native-pop-ups 1 |
| 14 | `pop-ups.ts` | a cardio line is drawn on a day with no run | **2** | 2 | sweeps/native-pop-ups 1, unit/native-pop-ups 1 |
| 15 | `pop-ups.ts` | a lift line is drawn on a day with no lift | **3** | 3 | sweeps/native-pop-ups 1, integration/native-pop-ups 1, unit/native-pop-ups 1 |
| 16 | `pop-ups.ts` | the tier's last line may be drawn again | **5** | 5 | sweeps/native-pop-ups 1, integration/native-deck-logging 1, integration/native-deck-swap 1, integration/native-pop-ups 1, unit/native-pop-ups 1 |
| 17 | `pop-ups.ts` | the pick is not kept | **5** | 12 | sweeps/native-pop-ups 1, integration/native-deck-logging 4, integration/native-deck-swap 1, integration/native-pop-ups 2, unit/native-pop-ups 4 |
| 18 | `pop-ups.ts` | the workout pop-up's streak carries no flame | **5** | 8 | sweeps/native-pop-ups 1, integration/native-deck-logging 4, integration/native-deck-swap 1, integration/native-pop-ups 1, unit/native-pop-ups 1 |
| 19 | `pop-ups.ts` | the workout pop-up forgets the trained day | **5** | 7 | sweeps/native-pop-ups 1, integration/native-deck-logging 3, integration/native-deck-swap 1, integration/native-pop-ups 1, unit/native-pop-ups 1 |
| 20 | `pop-ups.ts` | the streak under the workout line counts tomorrow too | **2** | 3 | integration/native-deck-logging 2, integration/native-deck-swap 1 |
| 21 | `pop-ups.ts` | a streak of five is a milestone | **4** | 4 | sweeps/native-pop-ups 1, integration/native-deck-logging 1, integration/native-deck-swap 1, integration/native-pop-ups 1 |
| 22 | `pop-ups.ts` | a streak of sixty is not a milestone | **1** | 1 | unit/native-pop-ups 1 |
| 23 | `pop-ups.ts` | the streak pop-up's kicker reads otherwise | **5** | 7 | sweeps/native-pop-ups 1, integration/native-deck-logging 2, integration/native-deck-swap 1, integration/native-pop-ups 2, unit/native-pop-ups 1 |
| 24 | `pop-ups.ts` | the workout line stands where a milestone would | **5** | 7 | sweeps/native-pop-ups 1, integration/native-deck-logging 2, integration/native-deck-swap 1, integration/native-pop-ups 2, unit/native-pop-ups 1 |
| 25 | `pop-ups.ts` | the season is raised every time the last day is marked | **1** | 1 | unit/native-pop-ups 1 |
| 26 | `pop-ups.ts` | the season's mark is not stored | **3** | 3 | sweeps/native-pop-ups 1, integration/native-pop-ups 1, unit/native-pop-ups 1 |
| 27 | `pop-ups.ts` | the season counts a skip as a workout | **3** | 3 | sweeps/native-pop-ups 1, integration/native-pop-ups 1, unit/native-pop-ups 1 |
| 28 | `pop-ups.ts` | the season counts no skip | **3** | 3 | sweeps/native-pop-ups 1, integration/native-pop-ups 1, unit/native-pop-ups 1 |
| 29 | `pop-ups.ts` | the reminder asks more than once a calendar day | **1** | 1 | unit/native-pop-ups 1 |
| 30 | `pop-ups.ts` | the reminder asks about today | **5** | 10 | sweeps/native-pop-ups 1, integration/native-deck-logging 4, integration/native-deck-swap 3, integration/native-pop-ups 1, unit/native-pop-ups 1 |
| 31 | `pop-ups.ts` | the reminder walks on past a marked day (D240) | **3** | 3 | sweeps/native-pop-ups 1, integration/native-pop-ups 1, unit/native-pop-ups 1 |
| 32 | `pop-ups.ts` | the reminder asks again about a day already asked about | **1** | 1 | unit/native-pop-ups 1 |
| 33 | `pop-ups.ts` | the reminder's day is not stored | **5** | 9 | sweeps/native-pop-ups 1, integration/native-deck-logging 2, integration/native-deck-swap 2, integration/native-pop-ups 1, unit/native-pop-ups 3 |
| 34 | `pop-ups.ts` | the day asked about is not marked as asked | **5** | 8 | sweeps/native-pop-ups 1, integration/native-deck-logging 2, integration/native-deck-swap 2, integration/native-pop-ups 1, unit/native-pop-ups 2 |
| 35 | `pop-ups.ts` | the long gap begins at six days | **1** | 1 | unit/native-pop-ups 1 |
| 36 | `pop-ups.ts` | the long gap keeps the doctrine tail | **5** | 7 | sweeps/native-pop-ups 1, integration/native-deck-logging 2, integration/native-deck-swap 2, integration/native-pop-ups 1, unit/native-pop-ups 1 |
| 37 | `pop-ups.ts` | the reminder's sub line reads otherwise | **5** | 8 | sweeps/native-pop-ups 1, integration/native-deck-logging 2, integration/native-deck-swap 2, integration/native-pop-ups 1, unit/native-pop-ups 2 |
| 38 | `pop-ups.ts` | the reminder's Done button reads otherwise | **5** | 7 | sweeps/native-pop-ups 1, unit/native-pop-ups 1, integration/native-deck-logging 2, integration/native-deck-swap 2, integration/native-pop-ups 1 |
| 39 | `pop-ups.ts` | the reminder's Skip button carries Done's handler | **5** | 7 | sweeps/native-pop-ups 1, integration/native-deck-logging 2, integration/native-deck-swap 2, integration/native-pop-ups 1, unit/native-pop-ups 1 |
| 40 | `pop-ups.ts` | a title's apostrophe is not escaped in the handler code | **1** | 1 | unit/native-pop-ups 1 |
| 41 | `pop-ups.ts` | the answer does not snapshot the day | **3** | 4 | sweeps/native-pop-ups 1, unit/native-pop-ups 2, integration/native-pop-ups 1 |
| 42 | `pop-ups.ts` | the answer leaves the day's skipped parts (D284) | **1** | 2 | unit/native-pop-ups 2 |
| 43 | `pop-ups.ts` | the answer stores no title | **3** | 3 | sweeps/native-pop-ups 1, integration/native-pop-ups 1, unit/native-pop-ups 1 |
| 44 | `pop-ups.ts` | the answer does not mark the day as asked | **1** | 1 | unit/native-pop-ups 1 |
| 45 | `pop-ups.ts` | Done's toast reads otherwise | **3** | 3 | sweeps/native-pop-ups 1, integration/native-pop-ups 1, unit/native-pop-ups 1 |
| 46 | `pop-ups.ts` | Skip's toast reads otherwise | **3** | 3 | sweeps/native-pop-ups 1, integration/native-pop-ups 1, unit/native-pop-ups 1 |
| 47 | `deck-writes.ts` | a swap never says the nudge is due | **2** | 3 | integration/native-deck-swap 2, integration/native-pop-ups 1 |
| 48 | `deck-writes.ts` | the nudge's words name no job | **3** | 4 | integration/native-deck-swap 2, integration/native-pop-ups 1, unit/native-pop-ups 1 |
| 49 | `deck-writes.ts` | Leave the plan alone does not mark the pair offered | **2** | 2 | integration/native-deck-swap 1, unit/native-pop-ups 1 |
| 50 | `deck-writes.ts` | Make the change writes the preference the wrong way round | **2** | 3 | integration/native-deck-swap 2, integration/native-pop-ups 1 |
| 51 | `deck-writes.ts` | Make the change does not mark the pair offered | **2** | 3 | integration/native-deck-swap 2, integration/native-pop-ups 1 |
| 52 | `deck-writes.ts` | Make the change hands back the program as stored, not rebuilt | **3** | 4 | unit/native-deck-logging 1, integration/native-deck-swap 2, integration/native-pop-ups 1 |
| 53 | `deck-writes.ts` | Make the change's toast names no job | **3** | 4 | integration/native-deck-swap 2, integration/native-pop-ups 1, unit/native-pop-ups 1 |
| 54 | `pop-up-model.ts` | the copy of today's pop-up model drifts | **5** | 10 | sweeps/native-pop-ups 1, integration/native-deck-logging 4, integration/native-deck-swap 1, integration/native-pop-ups 2, unit/native-pop-ups 2 |
| 55 | `swap-nudge-model.ts` | the copy of today's nudge model drifts | **3** | 5 | integration/native-deck-swap 2, integration/native-pop-ups 1, unit/native-pop-ups 2 |
| 56 | `PopUp.tsx` | the card's brand reads otherwise | **1** | 1 | unit/native-pop-ups 1 |
| 57 | `PopUp.tsx` | the card comes in over half a second | **1** | 1 | unit/native-pop-ups 1 |
| 58 | `PopUp.tsx` | the card comes in under Reduce Motion | **1** | 1 | unit/native-pop-ups 1 |
| 59 | `PopUp.tsx` | the confetti is not in the page's colours | **1** | 1 | unit/native-pop-ups 1 |
| 60 | `PopUp.tsx` | a button of the card does nothing | **1** | 1 | unit/native-pop-ups 1 |
| 61 | `PopUp.tsx` | a tap on the scrim does not close the card | **1** | 1 | unit/native-pop-ups 1 |
| 62 | `PopUp.tsx` | the reminder's two buttons stand one over the other | **1** | 1 | unit/native-pop-ups 1 |
| 63 | `SwapNudge.tsx` | the nudge's head reads otherwise | **1** | 1 | unit/native-pop-ups 1 |
| 64 | `SwapNudge.tsx` | Make the change leaves the plan alone | **1** | 1 | unit/native-pop-ups 1 |
| 65 | `SwapNudge.tsx` | Leave the plan alone does nothing | **1** | 1 | unit/native-pop-ups 1 |
| 66 | `App.tsx` | the reminder is raised at once at a launch | **1** | 1 | unit/native-pop-ups 1 |
| 67 | `App.tsx` | the reminder is never raised | **1** | 1 | unit/native-pop-ups 1 |
| 68 | `App.tsx` | the reminder's Done raises no completion pop-up | **1** | 1 | unit/native-pop-ups 1 |
| 69 | `App.tsx` | the reminder's Skip is stored as Done | **1** | 1 | unit/native-pop-ups 1 |
| 70 | `App.tsx` | the reminder's second button is its Done | **1** | 1 | unit/native-pop-ups 1 |
| 71 | `App.tsx` | Mark the day done raises no pop-up | **1** | 1 | unit/native-pop-ups 1 |
| 72 | `App.tsx` | the pop-up is drawn under the toast | **1** | 1 | unit/native-deck 1 |
| 73 | `App.tsx` | the completion pop-up's line is not drawn from the real draw | **1** | 1 | unit/native-pop-ups 1 |
| 74 | `Deck.tsx` | the nudge is raised at once after the pick | **1** | 1 | unit/native-pop-ups 1 |
| 75 | `Deck.tsx` | the nudge is never raised | **1** | 1 | unit/native-pop-ups 1 |
| 76 | `Deck.tsx` | the nudge is not handed to the app to draw | **1** | 1 | unit/native-pop-ups 1 |
| 77 | `Deck.tsx` | Leave the plan alone stores nothing | **1** | 1 | unit/native-pop-ups 1 |
| 78 | `Deck.tsx` | Make the change keeps the old program in the deck | **1** | 1 | unit/native-pop-ups 1 |
| 79 | `Deck.tsx` | Make the change does not hand the program to This Week | **1** | 1 | unit/native-pop-ups 1 |
| 80 | `Deck.tsx` | Make the change does not draw the day again | **1** | 1 | unit/native-pop-ups 1 |
| 81 | `Deck.tsx` | Make the change raises no toast | **1** | 1 | unit/native-pop-ups 1 |
| 82 | `Deck.tsx` | Mark the day done closes with the toast and no pop-up | **2** | 2 | unit/native-deck-logging 1, unit/native-pop-ups 1 |
| 83 | `ThisWeek.tsx` | This Week does not tell the app of a launch | **1** | 1 | unit/native-pop-ups 1 |
| 84 | `ThisWeek.tsx` | This Week keeps the launch's program after Make the change | **1** | 1 | unit/native-pop-ups 1 |

- Breaks made: **84** of 84. Let through by every file: **0**.
