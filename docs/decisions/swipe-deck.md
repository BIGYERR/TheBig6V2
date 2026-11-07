# The swipe deck: decisions

A day's session as a deck of cards, one card per thing to do (the run, each lift, each round or block, Call it), swiped
through while training. Designed with Mario on the Claude Design canvas "Swipe Deck Concepts" (private to Mario:
https://claude.ai/artifact/Nh3ymF2Fh9TC8KY1oZ66uS), Version 74 the state he approved (Version 67 on 2026-11-04, then call 15). The boards' generator is saved in
`docs/design/swipe-deck/` (its README says how to rebuild them). Not built in the app. Tests: none yet; the build
writes them.

## P-DECK: the session as a swipe deck (design agreed, not built)

- **Date:** designed 2026-10-25 to 2026-11-03; Mario 2026-11-04, then his three answers the same day (below): "ok i like where were at! lets save this and we are
  going to need to roll this into our app so ill need to wrap up anothe chat before we can implement this".
  **Ruled by:** Mario, call by call on the canvas (below). **D-code:** assigned from the registry when the build is
  slotted. **Bump:** not picked (MINOR recommended: a new way to run a session, no program output moves).
  **Shipped:** not yet.
- **Where it came from:** Mario's 2026-10-25 report that the main lift and the cardio could not be skipped (D248 and
  D250 shipped in v0.246.0; D249, the cardio card, stayed open for ideas, `docs/decisions/session-edits.md`). He asked
  to see the ideas as mockups, then for the card swiping mockups he remembered, then for every feature working.
- **What the canvas shows:** week 10 of HALF_MANNY off today's engine (seed 76308), Monday to Sunday, every control
  working: boards AD (Mon), AE (Tue), AG (Wed), AF (Thu), AH (Fri), AI (Sat), AJ (Sun). The older W, X and Y boards
  (weeks 6 and 9) predate several calls below and are kept for the record.
- **The first round's picks (2026-09-22 to 09-29, five sessions on boards A to X; carried in handoff §12 from
  Post-v0.240.0 until this file).** Standing unless a call below changed them: **E**, the fan, with the position
  numeral (`03/06`) large at top left (its Asylum palette, terracotta, ochre, sage and ink, is now the Track look,
  call 4); a logged card keeps its ring and gets a banner and a big check, no numbers in the banner (board **I**,
  option 6); **N**, the sets drawer on the card face, its shut bar reading the prescription (`3 × 10 each`, `0/3`) and
  then what was done, load typed on the decimal keypad, reps a read-only number with minus and plus (the prescription
  owns the fixed dimension), the card sized off the viewport, never a fixed height (the reuse pill inside the drawer is
  now call 8's Load box and pill); **P**, past four sets one set at a time behind a strip of pips, the threshold a named
  constant; **H**, a round is one card with its members inside: removing one leaves a struck row, removing a second
  demotes the card to straight sets (the V190 rule), All skips the round; **R**, the journal is the last card (Call
  it), RPE a 1 to 10 slider; run cards keep the app's log fields, no rest timer, no invented splits or targets (call 11
  holds this); a skipped card holds its slot with an undo, and the skip effect is the punched hole of board **V**,
  plain grey under Reduce Motion. Board **S**, a per-rep run drawer, was cut: HALF_MANNY emits no `reps_dist` dose.
- **Mario's calls this round, in the order he made them:**
  1. A day is a deck; swipe a card away to move on. Double tap a card to switch between sideways and up and down; up
     and down is a smooth pager (finger, wheel). The toggle button that also did this was removed as redundant.
  2. A round's movements log the way the app logs a superset today: each movement opens its own set drawer ("that
     form factor works and its not too busy").
  3. Mid swipe, the card behind shows, and it is drawn in full, not a preview: it rises from the fan.
  4. Card art and humor were tried (track lanes, poster numbers, a little lifter) and scrapped (2026-11-02): plain
     cards in the Track look (D263), one colour per kind.
  5. A skip raises no pop up; the skipped card shows an undo arrow to put it back.
  6. The pills top right are sets and rest only; a round shows its rounds. No RPE or anything else in a pill.
  7. A lift whose prescription has an RPE shows a small standard info mark beside the RPE; tapped, a bubble warps out
     of the mark to the centre and back in on Got it, its type set to one clear hierarchy. Never on a movement inside
     a round or block (2026-11-03: it makes the card too busy).
  8. Logging is the app's: a Load box, a separate last time pill that fills the box, and Fill every set.
  9. On a race plan the run comes first, as the app orders the day (`_liftFirst`).
  10. Done: the card lifts slightly with a glow in its own colour, then leaves slowly, tucked behind the deck sideways
      or slid up to the next card up and down.
  11. The run card logs exactly as the app's log does today, by dose: the plan strip, the Time and Miles wheels, the
      pace worked out against the target, miles and pace for a session with no dose, Did a different activity? for a
      ride or a swim, and the Log button.
  12. Can't run? on the run card (the answer to D249): move it to a later day, each day marked good, careful or bad
      for the run (an easy run beside a hard day, a hard run on the eve of the long run), or skip it.
  13. A rest day is one card with the app's rest sheet on it: Training anyway? (move an untrained session onto the
      day, with the clash warning) and Log cardio (run or walk on the wheels, an RPE, Edit and Clear).
  14. Post-run mobility is a cool down, not a circuit: After the run, Stretch and roll, five easy moves with a tap
      each, no pills, its name not repeating the day's (2026-11-03).
  15. The deck explains nothing (2026-11-06: "its alot of over explaining in the UI, good UI needs NO explanation"):
      the header carries the session's name only, with no week, day or program line; no "x of x done" line; no hint
      under the deck about swiping or the double tap; and no toast when the double tap switches the view. The run
      card's words follow the app's since v0.255.2 (D271): Log the run, the hint as two sentences, Your pace.
- **What the build reuses, not re-derives:** every number on a card comes from the engine and the app's own readers,
  as the generator does (`deck-data.ts`): `parseRx`, `isTrackableWeight`, `isKBExercise`, `swapCandidates`,
  `auxSwapCandidates`, `doseFromCardio`, `runSessionCode`, `restMoveCandidates`, `restMoveCollisions`, `restDayTip`;
  and the stores the session sheet writes today (sets, cardio, rest log). The deck is a new view of the day, not a new
  record.
- **Mario's answers (2026-11-04, "i concur with all", each the main session's recommendation):** (1) prehab and
  mobility blocks are one card each, as the week 10 decks build them (the case against: a long block such as Thursday's
  hip stability is one tall card to scroll); (2) Can't run? ships on the run card as the canvas has it, move to a later
  day with each day marked good, careful or bad for the run, or skip it, which rules D249 (the case against: a move
  rewrites the rest of the week, which nothing in the app does today); (3) the deck is what Start session opens, and the
  day sheet stays for reviewing and editing a day (the case against: two ways into one day to keep in step).
- **Before the build, in this order:** measure the day shapes across the lattice (cards per day, rounds, blocks, run
  first or last); then coach's read-ahead ruling, carried from the first round: the deck shows one card at a time, so
  does meeting a hinge cold on card 4 break hard days hard. If either refutes a premise of the answers above, it goes
  back to Mario before any edit (standing ruling 7). The deck lands on the Angular screens
  (`frontends/app/src/app/screens/day-detail/`), not the legacy builders.
- **Found in the app while building the canvas, not fixed:** (1) the rest sheet's clash check warns about the day a
  session leaves (move Thursday's legs onto Wednesday and it warns about Thursday, which becomes the rest);
  `restMoveCollisions` checks both neighbours and keeps the source day. The canvas drops that day. (2) Two rest day
  tips carry a mid sentence em-dash (the carbohydrate and protein tips). Both are in handoff §12.
- **Open on the canvas:** a stray board "Div" (`Piece-w0mf`, dragged out of W by accident); the moved run's
  "Bring it back to Monday" button, which could be the undo arrow; whether the punched hole stays as the skip motion;
  W, X and Y not brought up to the week 10 behaviour.

## D272 amends P-DECK: no cardio cards (PROPOSED)

- **Date:** 2026-11-05. **Ruled by:** Mario, picking This Week's hero draft A: "we dont need any cardio cards if we are
  going with A since the cardio and lift blocks are seperate and we are placing the record button on it". Written up
  by the main session in the coach hat as D272 P-RECORDRUN, item 7 (`docs/decisions/gps-recording.md`).
- **What changes in the deck:** calls 9 (run first), 11 (the run's hand log) and 12 (Can't run?, D249) move from the
  run card to the run block on This Week's hero; the deck holds lift work only. Call 14's cool down stays a card.
- **Does not change:** every other call and answer above; the day sheet keeps the run's log for review and edits.
