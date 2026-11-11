# The swipe deck: decisions

A day's session as a deck of cards, one card per thing to do (the run, each lift, each round or block, Call it), swiped
through while training. Designed with Mario on the Claude Design canvas "Swipe Deck Concepts" (private to Mario:
https://claude.ai/artifact/Nh3ymF2Fh9TC8KY1oZ66uS), Version 74 the state he approved (Version 67 on 2026-11-04, then call 15). The boards' generator is saved in
`docs/design/swipe-deck/` (its README says how to rebuild them). Being built on the Angular day screen (D275, below).
Tests: `tests/unit/swipe-deck.test.ts`, `tests/integration/swipe-deck.test.ts` and the app's own, written by the build.

## D275 P-DECK: the session as a swipe deck (design agreed, building)

- **Date:** designed 2026-10-25 to 2026-11-03; Mario 2026-11-04, then his three answers the same day (below): "ok i like where were at! lets save this and we are
  going to need to roll this into our app so ill need to wrap up anothe chat before we can implement this".
  **Ruled by:** Mario, call by call on the canvas (below). **D-code:** D275, issued Post-v0.256.0 (2026-11-08) when the
  build was slotted. **Bump:** MINOR, v0.257.0 (Mario, 2026-11-08: a new way to run a session, no program output moves; it builds
  before D274, which gave up the number).
  **Shipped:** v0.257.0 (2026-11-08), on the Angular screens; "D275 as built", below.
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
  16. The deck opens out of the card that started it, **Lift first at 420 ms** (2026-11-08, "i like the lift first at
      420 ms", picked on the canvas's THE MOCKUP, Version 54, from Smooth, Spring, Lift first and Zoom at 300, 420, 550
      and 700 ms; Slide up, Push and no motion were tried first on 2026-11-07, and he liked the grow). Start lift's card
      rises off the page, then opens to the whole screen as the deck fades in; leaving the deck plays it back into the
      card. The numbers, so the build copies them:
      - **Drawn first.** The deck is drawn at the card's place under a copy of the card (its label, name and summary)
        for two frames before anything moves, so the motion starts on a finished frame.
      - **Lift, 168 ms** (0.4 of the speed), `cubic-bezier(.3,0,.2,1)`: the card grows 10 px at top and bottom and
        8 px at each side, its corners 24 to 28 px, its fill one step lighter (`#161616` to `#202020`); the copy scales
        to 1.04; This Week dims under a 30% scrim.
      - **Open, 420 ms**, `cubic-bezier(.05,.7,.1,1)`: the clip opens to the whole screen with square corners and the
        fill turns to the screen's ground; the deck fades in over 294 ms after 84 ms while it grows from 94% to full
        size; the copy fades out over 126 ms; the scrim deepens to 55%; This Week shrinks to 96%. Open to settled:
        588 ms.
      - **Close, 357 ms** (0.85 of the speed), `cubic-bezier(.3,0,.8,.15)`: the clip shrinks back to the card, the deck
        fades out over 143 ms and back to 94%, the copy returns from 161 ms to 286 ms and lands flat (1.04 to 1), the
        scrim clears and This Week grows back; This Week takes over when the close ends. Back, and Mark the day done,
        both close this way.
      - **Reduced motion:** no motion; the deck opens and closes at once.
      The recorder opens the same way from the run card (D272 Amendment 2, `docs/decisions/gps-recording.md`).
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
- **On the canvas (2026-11-06):** Version 76 carries it. The run cards are off the Monday, Tuesday, Friday and Saturday
  decks (Monday 4 cards, Tuesday 6, Friday 5, Saturday 2: the cool down and Call it); `build.mjs` drops them before it
  builds, and Wednesday, Thursday and Sunday build byte for byte as Version 74 had them. This item is Mario's own call
  and does not wait on D272's open calls, which are about the recorder. The deck chat ("Swap/skip functionality for
  workouts") was merged into the This Week chat the same day, Mario's call; the build order is the deck first, then
  This Week's redesign with D272.

## D275: coach's read-ahead ruling, no premise refuted (2026-11-08)

- **Date:** 2026-11-08, Post-v0.256.0. **Ruled by:** the main session in the coach hat, on the measure below; it changes
  nothing Mario ruled, so it did not go back to him first (standing ruling 7 applies only to a refuted premise).
- **The question (carried from the first round):** the deck shows one card at a time, so does an athlete who meets a
  hinge cold on card 4 or later break hard days hard?
- **The measure:** `tests/measure/swipe-deck_read-ahead.js` on `index.html` at v0.256.0 (HALF_MANNY digest
  `147f083be4e04e34`), the same sets and card rule as `tests/measure/swipe-deck_day-shapes.md`; its output is
  `tests/measure/swipe-deck_read-ahead.md`.
  - **HALF_MANNY:** 29 hinges, on card 1 (15), 2 (12) or 3 (2), never later. 12 are the Main card, 14 come after lower
    body work, and the 3 others open the deck (a trap bar deadlift twice, a kettlebell swing once).
  - **The lattice:** 18 of 15,134 hinges on card 4 or later (0.1%). Every one is a cable pull-through after a goblet
    squat, a split squat round and a hip thrust; none is met cold.
  - **The other goals:** 31 of 576 on card 4 or later; 21 after lower body work; 10 with none before, every one a
    dumbbell or kettlebell hinge (a dumbbell Romanian deadlift, a double kettlebell deadlift, a kettlebell swing) closing a
    Push (light) day on the 1.5 mile fat loss and marathon programs, after three cards of pressing. No barbell.
  - **Not the Main card and no lower body card before it:** 2,253 on the lattice, on card 1 (1,661), 2 (520) or 3 (72);
    105 in the other goals, 76 on card 1. A card 1 hinge is the first thing the deck shows, so no read ahead is involved.
- **The coaching argument:** hard days hard is a rule about which day carries the hinge (heavy lower beside the speed
  run, not the recovery run; D36 keeps it off the long run and its eve). The deck moves no lift between days and
  reorders nothing inside one: its cards are the day's sections in the engine's order, so the deck cannot break it.
  What a one card view could cost is preparation, a heavy pull met by a body that did not see it coming. The measure
  says that never happens with a heavy pull: on Mario's program no hinge sits past card 3, on the lattice the late ones
  are a cable pull-through after three lower body cards, and off it the cold late ones are light finishers. The deck
  also reads ahead by design: the up and down pager (call 1) shows every card in order, the position numeral says how
  far in the athlete is, and This Week names the session before Start lift.
- **What changes:** nothing in P-DECK or Mario's three answers. Answer (1), blocks one card each, and answer (3), the
  deck behind Start session, rest on nothing the measure moved; answer (2) went to This Week with D272.
- **What the build must hold:** the deck's cards are the day's sections in the engine's order, never re-sorted, the
  run left out (D272) and nothing else dropped; a test holds it on a hinge day.
- **Seen, not ruled (the engine, not the deck):** the 10 cold late hinges sit on Push (light) days whose run is a
  Recovery Run (marathon) or a long slow run (1.5 mile fat loss), a light hinge on an easy day; the 654 barbell hinges
  that open a lattice deck without being the Main card carry no warm up cue. Both print the same in the day sheet
  today. Handoff §12.

## D275 as built (v0.257.0, 2026-11-08)

- **Where:** the iOS app's Angular screens, `frontends/app/src/app/screens/deck/` (`deck-model.ts` the logic, `deck.ts`
  and `deck.css` the screen, `deck-state.ts` what This Week and the session sheet share with it). The page Pages serves
  changes only by its version: the deck is not in the legacy builders, as Mario asked.
- **One writer.** Each card holds the app's own exercise cards (`SessionSections`): the set drawer, the Load box, the
  last time pill, Fill every set, Log, a movement's swap and minus. Every set is logged by the session sheet's handlers
  into the same stores (call 8, "What the build reuses"). While the deck is open the session sheet is shut and empty, so
  no exercise card is on the page twice (the handlers find their inputs by id), and the redraw an edit asks of the sheet
  (a skip, a swap, an undo) lands on the deck instead.
- **Decisions the build made (siting and form, recorded here):**
  1. Start session (today, not yet marked) opens the deck out of the hero card; Open session (a marked day, a day browsed
     ahead) opens the session sheet for review and edits (answer 3). Start lift arrives with D272's redesign of This Week,
     which calls the same opener (`DeckState.start`).
  2. A long run day whose only lift card is its cool down opens the session sheet: the run is the day. Until D272's run
     block lands, a run on a lift day is logged on the sheet, reached from the day strip.
  3. Done, next one logs every movement on the card that is not yet logged, as the card shows it, through the same write
     as each Log (`saveExWeight`, quietly); a card with nothing the app can log is marked done for that open only.
  4. Call it writes the day's RPE (only once the slider is moved, D219) and notes into the day's log entry, every other
     field kept, and marks the day complete (`markDayComplete`); then the rest clock stops, the deck closes into its card
     and the completion pop-up shows, as the sheet's Done does (D179). It never calls `persistLogFields`, which rebuilds the
     entry from the sheet's form and would blank a run logged that day.
  5. Call it's slider speaks the canvas's words ("working, three left"), not the sheet's `RPE_LABELS` ("Very Hard"), so the
     deck never names a 7 two ways (its RPE bubble calls 7 Hard).
  6. The Main card's cue takes the reserve the engine's own line names (HALF_MANNY week 1's RPE 6.5 reads "leave ~4 reps in
     reserve", so "Leave about four reps in reserve"), else what the RPE leaves; a half step with no words reads "three to
     four", and the RPE bubble reads a half step as the step below, so the bubble and the card agree.
  7. A cool down of one move reads "One easy move".
  8. Up and down, a drag scrolls a tall card's body first and pages only past its edge; a double tap switches either way.
  9. The deck sits over the session sheet and the tab bar and under the rest timer, the swap sheet, the toast and the
     pop-ups, so the rest clock stays in reach between sets.
  10. Past four sets a movement shows one set at a time behind pips (board P): `SessionSections` takes `pipAt`, which the
      deck sets to `PIP_THRESHOLD` (4) and the sheet leaves unset.
- **What does not change:** what any program prescribes (HALF_MANNY digest `147f083be4e04e34`, as v0.256.0); the page's
  script; the session sheet, which still opens from the day strip, Open session and the deck's own fallbacks.
- **Tests:** `tests/unit/swipe-deck.test.ts` (the card words, the pills, the RPE mark and bubble, the Main cue, the cool
  down line, the numeral, the big button, Call it's write, call 16's numbers, the card rule on hand built days),
  `tests/integration/swipe-deck.test.ts` (HALF_MANNY week 10 as the canvas drew it, Thursday as D273 trims it; the
  engine's order kept and every movement on exactly one card; a skip, a round skip and a log flowing back into the cards),
  `frontends/app/test/unit/deck.test.ts` (the app lane's own). Each fails on v0.256.0 (the deck does not exist there).
- **Seen, not tested:** the motion, the swipes and the double tap, the pips, the punched hole and the glow, Call it's close
  and the pop-up, in the Angular dev server at 375 px, day and night, driven through the hero's handler. Not yet on the
  phone: TestFlight carries it once Mario merges.

## D281 P-SUMMARYFIT: a deck card keeps its set summary's numbers whole (Mario, 2026-11-10)

- **Date:** found 2026-11-08 in the week 11 mockup, ruled 2026-11-10. **Ruled by:** Mario, "Yes, v0.259.3", on the
  main session's recommendation. **Bump:** PATCH, v0.259.3 (Mario). **Shipped:** v0.259.3 (2026-11-10).
- **Finding:** on Thursday of HALF_MANNY's week 11 the Hip stability card's set summaries read "2 × 15 /si…". A deck card
  is narrower than the session sheet, and the sheet's rule for the summary (`.exset-head-val`, `session-sheet.css`) lets
  the numbers shrink and clip while "as prescribed" beside them keeps its width. Every v0.257.0 to v0.259.2 build has it;
  the deck's stylesheet did not change in between.
- **What changes:** inside a deck card the summary keeps its numbers whole at 17 px and the words beside it give way with
  an ellipsis (`deck.css`, `.deck-work .exset-head-val` and `.deck-work .exset-head-sub`). Seen whole in the week 11
  mockup: "2 × 15 /side", "2 × 6 /side".
- **What does not change:** the session sheet's summary; what any program prescribes; the page Pages serves (its version
  only).
- **Test:** `tests/unit/swipe-deck.test.ts`, the deck's stylesheet holds the summary's numbers whole and lets the words
  give way; it fails on v0.259.2.
