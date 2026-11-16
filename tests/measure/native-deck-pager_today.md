# The deck's pager and opening: today's deck against the beta's (measure, read from the code)

Read 2026-11-15 on dev 407c274 (v0.262.4). Sources: `frontends/app/src/app/screens/deck/deck.ts`, `deck.css`,
`grow-motion.ts`, `deck-model.ts` (`openMotion`), `deck-state.ts`; `frontends/native/src/deck/Deck.tsx`,
`deck-screen.ts`, `App.tsx`, `this-week/ThisWeek.tsx`. No program is built: nothing here reads the engine.

## 1. The double tap (D275 call 1), today
- A tap is a press on the stage that ends within 6 px of where it began, across and down (`up`, deck.ts 551).
- Two taps inside 320 ms (`DOUBLE_TAP`) switch sideways and up and down, either way. The second tap clears the clock.
- A press that begins on a button, input, textarea, select, label or link is never a tap (`down`, 517), nor one made
  while a card's done motion or a pager slide runs.
- No toast, no hint (call 15). Every open starts sideways (`open`, 244): the choice is not kept.

## 2. Up and down, today
- The stage: right margin 34 px (20 sideways); dots in a column 24 px right of the stage, the lit dot 8 by 22
  (22 by 8 sideways); cards clipped at the stage's top and bottom (clip-path inset 0 -40 0 -24). No fan: only the
  top card and the card coming in are drawn. Transform origin bottom centre.
- The drag: the top card follows the finger down the screen one for one, from the first pixel, no turn. The card
  coming in sits one card height plus 14 px below (going on) or above (going back) and follows too, drawn in full
  (face opacity 1; sideways it fades up from 0.25).
- A tall card's body scrolls first: while the pager has not moved (dy 0) and the body is taller than its box by
  more than 2 px, the finger scrolls the body, and only what the body cannot take pages (`move`, 535 to 544).
- Let go past 80 px (`SWIPE`): the top card goes to minus or plus (100% + 14 px), the next comes to 0, both over
  290 ms on cubic-bezier(0.22, 0.61, 0.36, 1); then the index changes with transitions off for 40 ms. Short of 80:
  back over the same 290 ms. A second press inside the slide is refused.
- It wraps: on from the last card is the first, back from the first is the last (as sideways).
- A dot: `go(k)` at once, no slide.
- Wheel: 50 px of wheel steps a card. A desktop input; a phone has none.
- Done, next one, up and down: the same lift (10 px up, 1.03, 340 ms, cubic-bezier(0.2, 0.8, 0.2, 1), the glow
  when it was just marked, held 560 ms marked or 220 ms not), then `deckPagerLeave`, 760 ms on
  cubic-bezier(0.45, 0, 0.2, 1): from 10 px up at 1.03 to (100% + 14 px) up at 1, while the next rises from
  (100% + 14 px) below to 0 over the same 760 ms (`deckPagerRise`). No tuck to the side, no fade.
- Reduce Motion: no slide; the card changes at once.

## 3. The opening out of the card (call 16, Lift first at 420 ms), today
`openMotion(420)`: lift 168, open 420, close 357, deck fade in 294 after 84, copy fade out 126, deck fade out 143,
copy back 161 to 286, settled 588. Curves: lift cubic-bezier(.3,0,.2,1), open cubic-bezier(.05,.7,.1,1), close
cubic-bezier(.3,0,.8,.15).
- From: the card on This Week whose button was tapped (`week-view.ts` 307, the card element). Its box is read on
  the screen; with none (off screen) or under Reduce Motion the deck opens and closes at once.
- Layers: a black scrim; a copy of the card (its label, name and summary; its buttons and skip pill's ids dropped,
  no button); a frame clipped to the card's box; the deck inside the frame; This Week underneath.
- pre (two frames, or 64 ms when frames are held): scrim 0, copy at the card's box, frame clipped to the box with
  24 px corners on the card's fill (surface), deck at opacity 0 and 94%.
- lift, 168 ms: scrim to 30% (ease); copy to 1.04 and one step lighter (surface2); the clip grows 10 px top and
  bottom, 8 px each side, corners 28; deck still hidden.
- open, 420 ms: clip to the whole screen, square corners, fill to the ground (bg); deck fades in over 294 ms after
  84 ms and grows 94% to 100%; copy fades out over 126 ms; scrim to 55%; This Week to 96%.
- close, 357 ms (Back, and Mark the day done): clip back to the box with 24 px corners, fill to surface; deck fades
  out over 143 ms and back to 94%; copy returns from 161 ms to 286 ms, 1.04 to 1; scrim to 0; This Week to 100%.
  This Week takes over when it ends, then the completion pop-up (Mark the day done).
- The recorder opens the same way from the run card (D272 Amendment 2). Not in the beta: the run card is out of scope.

## 4. The beta's deck today (Post-v0.262.4, IA Next build 114)
- Opens and closes at once (`App.tsx`: `setDeck`), as today's does under Reduce Motion. `onDeck` hands the day, not
  the card's box.
- Sideways only. No tap is read on a card. The drag is taken after 8 points across and only when across is more
  than 1.2 times down (`onMoveShouldSetPanResponderCapture`); today's follows from the first pixel.
- Built and equal by test: the cards, the fan, the sideways swipe and its settle (290 and 260 ms), the dots, the
  map, the RPE bubble, sets in place, the pips, logging, Call it, skip and its punch, the done motion sideways
  (tuck), swap, the three pop-ups.
- Animated from react-native only: no Reanimated, no gesture handler in `frontends/native/package.json`.
- React Native has no clip-path. The opening's clip is today a CSS clip-path transition; in the beta it has to be a
  clipping box (overflow hidden, rounded) whose frame moves, with the deck held still inside it.

## 4b. Found in the beta while reading: a two card deck pulled to the right
- Today (`cardStyle`, `dirUp = pos === 1`): on a deck of two cards the other card is both the next and the one
  before, and it is always drawn rising from the fan's first seat (15 across, 7 up, 96.5%, 1.6 degrees), whichever
  way the finger goes.
- The beta's live drag (`Deck.tsx` cardStyle, `dir > 0 ? fan seat : 92% under`): pulled to the right it draws that
  card from 92% under the top card. Its settle (`poseOf`, `pos === 1`) is today's. So on a two card deck let go to
  the right the card behind jumps from one to the other: at 100 points, 4.3 points across, 2 up, 1.3% of scale and
  0.46 degrees, in one frame.
- Mario's Monday (Posterior Chain, 01/02: Trap bar deadlift and Call it) is a two card deck.
- Not proved on the simulator yet; read from the code and the arithmetic above.

## 5. The ledger rows the deck owns (`tests/measure/rn-migration_test-ledger.md`), all four unfilled
| file | tests | assertions | plan |
|---|---|---|---|
| tests/unit/swipe-deck.test.ts | 31 | 130 | RETIRE at cutover |
| tests/integration/swipe-deck.test.ts | 8 | 32 | RE-POINT at core |
| tests/sweeps/swipe-deck.test.ts | 3 | 6 | RE-POINT at core |
| frontends/app/test/unit/deck.test.ts | 10 | 26 | REPLACE by a screen test |

## 6. Not on the beta's deck after this session either (other sessions' work)
- Remove on an added move, and add (the session sheet's). Reopen on a done day (the session sheet).
- A cool down only day opening the day sheet (95 of 2,755 days). The recorder's opening (the run card).
- The wheel (no phone has one).
