# The Expo deck's double tap, pager and opening: a break per rule, and the test files each turns red

Written by `node tests/measure/native-deck-pager_breaks.mjs` (read-only here; each break is made in a copy of the tree and put back).

- The files run on each break: `unit/native-deck.test.ts`, `unit/native-deck-logging.test.ts`, `unit/native-pop-ups.test.ts`, `unit/native-shell.test.ts`, `integration/native-deck.test.ts`. Unbroken, they hold 129 tests and all pass.

| # | File | The rule broken | Files red | Tests red | Which |
|---|---|---|---|---|---|
| 1 | `deck-screen.ts` | a press that moved ten points is a tap | **1** | 1 | unit/native-deck 1 |
| 2 | `deck-screen.ts` | two taps a second apart turn the deck | **1** | 1 | unit/native-deck 1 |
| 3 | `deck-screen.ts` | a tap is judged across only | **1** | 1 | unit/native-deck 1 |
| 4 | `deck-screen.ts` | a turn keeps the clock, so a third tap turns the deck back | **1** | 1 | unit/native-deck 1 |
| 5 | `Deck.tsx` | a tap is read while a card is on its way out | **1** | 1 | unit/native-deck 1 |
| 6 | `Deck.tsx` | the deck opens up and down | **1** | 1 | unit/native-deck 1 |
| 7 | `Deck.tsx` | a double tap turns the deck up and down and never back | **1** | 1 | unit/native-deck 1 |
| 8 | `Deck.tsx` | the tap's clock is the date | **1** | 1 | unit/native-deck 1 |
| 9 | `Deck.tsx` | a tap leaves the keyboard on its field | **1** | 1 | unit/native-deck 1 |
| 10 | `Deck.tsx` | the card's body is one element to a screen reader | **1** | 1 | unit/native-deck 1 |
| 11 | `deck-screen.ts` | the card coming in stands a card height away with no gap | **1** | 3 | unit/native-deck 3 |
| 12 | `deck-screen.ts` | going back the card comes from below | **1** | 1 | unit/native-deck 1 |
| 13 | `deck-screen.ts` | the card coming in does not follow the finger | **1** | 1 | unit/native-deck 1 |
| 14 | `deck-screen.ts` | a fan is drawn up and down | **1** | 1 | unit/native-deck 1 |
| 15 | `deck-screen.ts` | one point of drag brings the next card in | **1** | 1 | unit/native-deck 1 |
| 16 | `deck-screen.ts` | a slot forgets the drag | **1** | 1 | unit/native-deck 1 |
| 17 | `deck-screen.ts` | up and down a card is covered | **1** | 1 | unit/native-deck 1 |
| 18 | `deck-screen.ts` | the card before stands two slots on, not one back | **1** | 1 | unit/native-deck 1 |
| 19 | `deck-screen.ts` | a deck of two keeps its other card below whichever way the finger goes | **1** | 1 | unit/native-deck 1 |
| 20 | `Deck.tsx` | the stride is the stage alone | **1** | 1 | unit/native-deck 1 |
| 21 | `Deck.tsx` | every card stands on the top card's slot | **1** | 1 | unit/native-deck 1 |
| 22 | `Deck.tsx` | a jump does not move the page | **1** | 1 | unit/native-deck 1 |
| 23 | `Deck.tsx` | a jump moves the page after a slide has | **1** | 1 | unit/native-deck 1 |
| 24 | `Deck.tsx` | a slide does not say it has moved the page | **1** | 1 | unit/native-deck 1 |
| 25 | `Deck.tsx` | a pull the other way draws the deck again | **1** | 1 | unit/native-deck 1 |
| 26 | `Deck.tsx` | up and down the stage keeps 20 points at its right | **1** | 1 | unit/native-deck 1 |
| 27 | `Deck.tsx` | up and down the cards are not cut off at the stage's head and foot | **1** | 1 | unit/native-deck 1 |
| 28 | `Deck.tsx` | the dots stay in a row up and down | **1** | 1 | unit/native-deck 1 |
| 29 | `Deck.tsx` | the lit dot is long across up and down | **1** | 1 | unit/native-deck 1 |
| 30 | `Deck.tsx` | up and down a card grows from its left foot | **1** | 1 | unit/native-deck 1 |
| 31 | `deck-screen.ts` | the pager pages at 80 points, not past them | **1** | 1 | unit/native-deck 1 |
| 32 | `deck-screen.ts` | the pager takes a drag of any length | **1** | 1 | unit/native-deck 1 |
| 33 | `deck-screen.ts` | the pager takes a drag more across than down | **1** | 1 | unit/native-deck 1 |
| 34 | `deck-screen.ts` | a tall body never scrolls first | **1** | 1 | unit/native-deck 1 |
| 35 | `deck-screen.ts` | a tall body pages at the wrong end | **1** | 1 | unit/native-deck 1 |
| 36 | `deck-screen.ts` | a body two points taller than its box scrolls first | **1** | 1 | unit/native-deck 1 |
| 37 | `Deck.tsx` | the pager does not ask the card's body | **1** | 1 | unit/native-deck 1 |
| 38 | `Deck.tsx` | a body that fits its box scrolls and bounces up and down | **1** | 1 | unit/native-deck 1 |
| 39 | `Deck.tsx` | a body is tall as soon as it is taller | **1** | 1 | unit/native-deck 1 |
| 40 | `Deck.tsx` | the page slides on the fan's curve | **1** | 1 | unit/native-deck 1 |
| 41 | `Deck.tsx` | the slide leaves the drag where it was let go | **1** | 1 | unit/native-deck 1 |
| 42 | `Deck.tsx` | the slide does not move the deck on a slot | **1** | 1 | unit/native-deck 1 |
| 43 | `Deck.tsx` | the page is not said again where it came to rest | **1** | 1 | unit/native-deck 1 |
| 44 | `Deck.tsx` | the slide plays under Reduce Motion | **1** | 1 | unit/native-deck 1 |
| 45 | `Deck.tsx` | a press inside the slide is taken | **1** | 1 | unit/native-deck 1 |
| 46 | `Deck.tsx` | a drag let go short stays where it is | **1** | 1 | unit/native-deck 1 |
| 47 | `Deck.tsx` | a dot eases its card in up and down | **1** | 1 | unit/native-deck 1 |
| 48 | `Deck.tsx` | up and down the card leaves in the tuck's first part | **1** | 1 | unit/native-deck 1 |
| 49 | `Deck.tsx` | up and down the card leaving keeps its lift | **1** | 1 | unit/native-deck 1 |
| 50 | `Deck.tsx` | up and down the done motion does not move the deck on a slot | **1** | 1 | unit/native-deck 1 |
| 51 | `Deck.tsx` | up and down the top card wears no lift | **1** | 1 | unit/native-deck 1 |
| 52 | `Deck.tsx` | up and down the glow stays on as the card leaves | **1** | 1 | unit/native-deck 1 |
| 53 | `Deck.tsx` | up and down the deck is drawn again as the card lifts | **1** | 1 | unit/native-deck 1 |
| 54 | `Deck.tsx` | up and down the glow is not a layer of its own | **1** | 1 | unit/native-deck 1 |
| 55 | `Deck.tsx` | sideways the lift is kept after the card has gone | **1** | 1 | unit/native-deck 1 |
| 56 | `Deck.tsx` | a deck of two: the card behind rises by the way the finger goes | **1** | 1 | unit/native-deck 1 |
| 57 | `grow-motion.ts` | the card lifts by 20 points | **1** | 1 | unit/native-deck 1 |
| 58 | `grow-motion.ts` | the card's corners stay 24 as it lifts | **1** | 1 | unit/native-deck 1 |
| 59 | `grow-motion.ts` | the scrim lifts to 55% at once | **1** | 1 | unit/native-deck 1 |
| 60 | `grow-motion.ts` | the copy does not grow as it lifts | **1** | 1 | unit/native-deck 1 |
| 61 | `grow-motion.ts` | This Week keeps its size under the deck | **1** | 1 | unit/native-deck 1 |
| 62 | `grow-motion.ts` | the deck fades in with no wait | **1** | 1 | unit/native-deck 1 |
| 63 | `grow-motion.ts` | the copy comes back at once as the deck closes | **1** | 1 | unit/native-deck 1 |
| 64 | `grow-motion.ts` | the close runs at the open's speed | **1** | 1 | unit/native-deck 1 |
| 65 | `grow-motion.ts` | the deck keeps its size as it closes | **1** | 1 | unit/native-deck 1 |
| 66 | `grow-motion.ts` | the deck starts at full size | **1** | 1 | unit/native-deck 1 |
| 67 | `grow-motion.ts` | every curve is CSS ease | **1** | 1 | unit/native-deck 1 |
| 68 | `grow-motion.ts` | the frame's box is handed to the phone to move | **1** | 1 | unit/native-deck 1 |
| 69 | `DeckOpening.tsx` | the lift starts on the first frame | **1** | 1 | unit/native-deck 1 |
| 70 | `DeckOpening.tsx` | the lift does not wait for the frame to be on the screen | **1** | 1 | unit/native-deck 1 |
| 71 | `DeckOpening.tsx` | the deck is drawn again at every stage | **1** | 1 | unit/native-deck 1 |
| 72 | `DeckOpening.tsx` | a close begins while the deck opens | **1** | 1 | unit/native-deck 1 |
| 73 | `DeckOpening.tsx` | Back takes the deck away before it closes | **1** | 1 | unit/native-deck 1 |
| 74 | `DeckOpening.tsx` | the pop-up does not wait for the close | **1** | 1 | unit/native-deck 1 |
| 75 | `DeckOpening.tsx` | the opening plays under Reduce Motion | **1** | 1 | unit/native-deck 1 |
| 76 | `DeckOpening.tsx` | the deck takes a press while it opens | **1** | 1 | unit/native-deck 1 |
| 77 | `DeckOpening.tsx` | the copy stays over the open deck | **1** | 1 | unit/native-deck 1 |
| 78 | `DeckOpening.tsx` | the close leaves the keyboard up | **1** | 1 | unit/native-deck 1 |
| 79 | `DeckOpening.tsx` | the close goes by way of the lift | **1** | 1 | unit/native-deck 1 |
| 80 | `DeckOpening.tsx` | the opening moves no part of This Week | **1** | 1 | unit/native-deck 1 |
| 81 | `Deck.tsx` | the deck paints a ground of its own | **1** | 1 | unit/native-deck 1 |
| 82 | `ThisWeek.tsx` | the copy keeps its button | **1** | 1 | unit/native-deck 1 |
| 83 | `ThisWeek.tsx` | the copy keeps its skip pill | **1** | 1 | unit/native-deck 1 |
| 84 | `ThisWeek.tsx` | the copy keeps a card's ground | **1** | 1 | unit/native-deck 1 |
| 85 | `ThisWeek.tsx` | Start hands on no place for the card | **1** | 1 | unit/native-deck 1 |
| 86 | `App.tsx` | This Week wears no size under the deck | **1** | 1 | unit/native-deck 1 |
| 87 | `App.tsx` | the app forgets the card the deck opens out of | **2** | 2 | unit/native-deck 1, unit/native-pop-ups 1 |

- Breaks made: **87** of 87. Let through by every file: **0**.
