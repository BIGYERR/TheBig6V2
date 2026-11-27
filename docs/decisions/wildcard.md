# Wildcard: decisions

The Wildcard sheet (the Random Workout): the legacy page's `renderRand` (`frontends/app/src/legacy/src/js/random-wildcard.ts`)
and the native app's `randView` (`frontends/app/src/app/screens/random-workout/random-workout-model.ts`). Rulings on
editing a Wildcard's sections live in `docs/decisions/session-edits.md` (D250). Tests: `tests/integration/wildcard.test.ts`
and `frontends/app/test/unit/random-workout.test.ts`; the Expo app's are `tests/unit/native-random-workout.test.ts`,
`tests/integration/native-random-workout.test.ts` and the sweep of that name.

## D262 P-WILDTINT: the Wildcard badge draws the tint it was written with

- **Date:** 2026-10-28. **Ruled by:** Mario ("can you fix it now and lets roll it into this dev push"), on the defect
  the D261 build found and recommended fixing.
- **Finding:** the badge over a Wildcard's title ("Wildcard", or "Done Before ✓") is meant to sit on a faint tint of its
  program goal's colour: its style is `background:${color}22`, a hex colour with a `22` alpha (34/255). But since the
  colours became tokens the goal's colour is a `var(--…)` string, so the background reads `var(--lift)22`, which is not a
  colour: the declaration is dropped and the badge has had no fill, in the single-file page and, since its port, in the
  native app (whose test pinned `background:var(--lift)22` as the expected value). Its text colour always drew.
- **Changes:** the background is the goal colour's tint, `rgba(var(--<colour>-rgb), 0.133)` (34/255, the alpha the code
  was written with), so it follows the night palette like every other tint (D261). The goals keep their colours:
  strength and support strength the lift colour; hypertrophy and support prevention the mobility colour (`--hip`);
  fat loss and endurance the run colour; athletic and support athletic the bike colour; balanced the accent. The accent
  gains its tint token, `--accent-rgb` (day `24,23,18`, night `228,223,210`, the channels of `--accent` in each
  palette).
- **Does not change:** the badge's text colour, its words, its shape; which goal takes which colour; the sheet's other
  parts. A goal outside the nine still gets no colour (its style is now empty rather than two invalid declarations).
  No program output.
- **Expected values:** a strength program's badge reads `background:rgba(var(--lift-rgb),0.133);color:var(--lift)`; a
  balanced one `background:rgba(var(--accent-rgb),0.133);color:var(--accent)`; an endurance one
  `background:rgba(var(--run-rgb),0.133);color:var(--run)`; the same strings in both builds.
- **Released:** v0.251.1 (Patch, Mario 2026-10-28).

## D64, D71, D250 and D262 in the Expo app: Random Workout (Post-v0.263.0, the migration's phase 3, row 7, the first of two sessions)

- **Date:** 2026-11-27. **Ruled by:** no new ruling. Every word, number and behaviour is today's, carried into the
  Expo app unchanged, so each keeps its ruling: a Wildcard is a substitute and never a completion, stamped with the
  day the date gives and never the week being viewed, with its own pop-up that can never raise the season banner
  (V195 D64); a Wildcard rescues a skipped day's streak, and the tag names the session still on the board (V195
  D71); a swap or a minus on a Wildcard's card lives on the Wildcard's own working day and is never stored
  (v0.246.0 D250, `docs/decisions/session-edits.md`); the badge's tint (D262, above); the beta's own store (D289,
  `docs/decisions/data-backup.md`). **The cut** was put to Mario after the measure
  (`tests/measure/native-row7_today.md`): row 7 in two sessions, Random Workout first, then the Bugs tab built as
  today's (the Look row, the backup, the bug report), with the case for the Profile page he named on 2026-11-22
  said and set for phase 4; he took it ("Concur, build it", 2026-11-27). **Bump:** none, the page and core do not
  move (a Post-v0.263.0 pass, standing ruling 1). **Shipped:** Post-v0.263.0, no build of today's app; the beta's
  next build carries it.
- **Finding (the measure).** Of row 7 the beta already held the swap sheet and the add sheet on a program's day,
  the pop-up card with eight of today's nine callers, the toast, the Engine row and a backup loaded and checked key
  by key. Left were Random Workout and the Bugs tab as today draws it. Random Workout has one door, This Week's
  button, which carries a counter. Its pools are the page's own table: 149 workouts in 5 pools, 668 cards. The
  cards are the session sheet's own, log included. Ten phones, each tap: a draw, a filter, a swap, a minus and each
  put back store nothing; Complete and the reset store `ia_wild_<id>` alone; a card's Log stores the lift history.
- **What is built** (`frontends/native/src/random-workout/`): `random-pools.ts`, the page's table, its 159 lines as
  the page holds them; `random-workout-model.ts`, today's file byte for byte; `random-screen.ts` (the draw, the
  working day, the cards read off it, the counter); `random-writes.ts` (Complete, its pop-up's call, the reset: the
  one writer of the Wildcard's record, through core's); and `RandomWorkout.tsx`, the screen, in the frame the goal
  sheet uses, drawing its cards with the session sheet's own component. The deck's writes take the Wildcard's
  working day as today's handlers take the source `wild` (`deck-writes.ts`: a swap, its put back, a minus, a
  round's minus), and the swap sheet lists for it (`deck-swaps.ts swapSheetOn`). This Week's button takes a press
  and carries the counter; Complete draws This Week again and raises the pop-up 380 ms on.
- **What a day's open leaves behind** (`deck-screen.ts DayInHand`). On the page three globals outlive the sheet
  that set them: the day last opened, the unit its cards were drawn in, and the stale load warning's two marks. A
  Wildcard's cards read all three, so the beta keeps them for the app's life: a deck and each draw of a session
  sheet set them, a program made active clears the day, and Random Workout only reads.
- **Carried as today's, not ruled (the handoff's section 12):** a Wildcard card is drawn, and its Log stored,
  under the week This Week holds and the day last opened, blank when none was opened since the launch. With a day
  opened, a set changed on a Wildcard card is kept as a draft in that day's log and the day is snapshotted. The
  cards read pounds until a day has been opened, whatever the program's unit; on a kilogram program with none
  opened, a card's Log turns the load field by the program's unit and its toast says kg, while each set's load is
  stored as the pounds the card shows (found by the walk, which the beta's first cut failed). The stale load warning speaks once,
  and no later draw speaks it again until a day is opened. A goal with no pool of its own draws from `balanced`
  (the two endurance programs of the ten; known since V195, D66).
- **Not built:** the update banner (the page fetching itself; the beta's updates come through TestFlight). The Bugs
  tab, the backup, the Look row and the bug report are the row's second session.
- **Proof.** After every tap the two stores hold each `ia_` key equal, the toasts are the same, what a day's open
  left behind is the same, the counter is the same and every field of every card holds the same value; after every
  draw the head, every section and card and the working day are the same; Complete raises the same pop-up, whole,
  and This Week under it is the same screen: on The Half Manny in the 60-second check
  (`tests/integration/native-random-workout.test.ts`: 5 tests, the five stretches each with no day opened and with
  one opened first, every workout of See All shown on both on two phones, Complete on eight days, a kilogram
  program) and on the ten seeded programs (`tests/sweeps/native-random-workout.test.ts`: 1,579 taps, 908 draws, 100
  Completes, every workout of See All on each program's third week, 1,490 shown). The hand-typed values are
  `tests/unit/native-random-workout.test.ts` (36 tests). Each new file imports modules the release before does not
  hold, so each fails there by construction (`git cat-file -e` on `frontends/native/src/random-workout/random-screen.ts`
  at 8f68d74 fails). 137 breaks, every one red on the fast files (`tests/measure/native-random-workout_breaks.md`). One part run first let none of its 34 through; the first whole run let 3 of 136 through, each read before anything was written: the counter's read of the program in hand got its test; a kilogram program's Log got a sharper walk, which found the beta's first cut turning a load in the wrong unit, fixed; and one changed nothing a card draws and left the list. The whole set then ran again, 137 of 137 red. Twelve breaks of six older lists whose text this session's edits moved were pointed at the code as it stands and run again on their lists' fast files, each red; nine assertions of six older test files that read the app's wiring were pointed at the code as it stands, and on a copy of the commit before (`tools/tree-at.mjs`) those nine tests are red and the files' other 339 pass.
- **The look**, measured in the simulator beside today's own page drawn by its Safari (the build of this checkout,
  a program made by its own Generate, the same workout handed to both): the header, the badge and title, the
  cardio block, the note, Complete and the done block, the space between two sections and This Week's button each
  within a point. Fixed on the way: the badge and title sat 2 to 4 low, a Wildcard's sections stood 13 apart where today's stand 27,
  and This Week's button kept its words on one line where today's stands them on two with the counter at the
  right. Complete, its toast, the pop-up, This Week's tag and counter and the two tap reset were made by hand on
  the simulator, on a copy of Mario's backup, and the simulator's store put back after (sha256 278ba57f before and
  after).
- **Released:** Post-v0.263.0 (no build of today's app).
- **On Mario's phone, build 129** (2026-11-27; run 46051140015, `docs/decisions/testflight.md`). Three reports,
  each read before anything was changed, none a fault of the build. **"hit done and no complete check in the
  calender":** made on the simulator on a copy of his backup, where Complete on a rest day drew the Wildcard mark
  in today's circle, the Wildcard done tag under the hero and the counter at 1/30, and no check: D64, a Wildcard is
  a substitute and never a completion (the other Done, the reminder's, drew its check on the day it settled).
  **"it does not show the W":** his screenshot of This Week showed a program in its first week whose calendar
  starts ten days on, so today is off the program's calendar, where today's `wildcardDayFor` hands back no day
  and the record is stored with none: the Wildcard counts and no mark is drawn, in today's app as in the beta
  (`random-writes.ts wildcardDayFor`, the page's own; held equal by the walks). **"you cant undo a done at the
  bottom of the wildacard workout":** today's own; a workout done before reads "You've done this one before" and
  nothing more, and only Reset clears it, with the whole counter. **Not ruled, carried (the handoff's section
  12):** whether a Wildcard done before a program starts should show anywhere, and whether one Wildcard can be
  undone. Either would change today's app and the page too. The simulator's store was put back after each look
  (sha256 278ba57f before and after).
