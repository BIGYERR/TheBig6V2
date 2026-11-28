# The session sheet

The day's session sheet: the whole day on one page, its log, and Done and Skip at its foot. Its rulings were made
over many builds and live where they were made (the handoff's §11f and the files named below); this file is the
record of the sheet as a screen, from the React Native migration on.

- The whole day, lifts first only when lifting is the priority: the page's `openDetail`, now the Angular
  `day-detail.ts` and its models.
- Done and Skip, two states, each undoing itself: V181 (D1, D2). A status closes the session: V221 (D179).
- The cardio card is a draft until its Log, Done or Skip: V236 (D218). The effort is a number only once the slider
  was moved: V236 (D219).
- This Week's Reopen: a done lift reopens the whole day, a done run its own sheet: D278 item 4
  (`docs/decisions/this-week.md`).
- A status set by hand takes the day whole, over its skipped parts: D284 (`docs/decisions/this-week.md`).
- Set rows, the load, the pills and Log: `docs/decisions/set-logging.md`. Skip, swap and add: `docs/decisions/session-edits.md`.

## The session sheet in the Expo app: Reopen opens the whole day (Post-v0.262.4, the migration's phase 3, the session sheet's first session)

- **Date:** 2026-11-16. **Ruled by:** no new ruling. Every word, number and behaviour is today's, carried into the
  Expo app unchanged, so each keeps its D-code (the list above). The cut was put to Mario after the measure and he
  took it ("Concur build"). **Bump:** none, the page and core do not move (a Post-v0.262.4 pass, standing ruling 1).
  **Shipped:** Post-v0.262.4, no build of today's app; the beta's next build carries it once Mario merges it.
- **Why now:** on IA Next builds 111 and 116 Mario's one remark was that Reopen does nothing. It opens the session
  sheet, which the beta did not draw.
- **The finding (measured before any edit, `tests/measure/native-session-sheet_today.md`):**
  - *How the sheet is reached today.* Three taps: a done lift's Reopen (the whole day), a run card's Log button and
    a done run's Reopen (that run alone, D278). Start opens the deck, and the sheet only where the day opens no deck
    (a day whose one card is its cool down). The sheet is also the redraw of every edit made on it.
  - *What its own taps write.* 8 key families (`ia_logs`, `ia_hist`, `ia_comp`, `ia_edits`, `ia_parts`,
    `ia_season_shown`, `ia_pop_idx`, `ia_pop_dismiss`), and the 1RM card's save a ninth (`ia_programs`). Through 10
    of core's writers, 5 of which the beta already called.
  - *What the deck already covers:* the set rows, the load, the pills, Log, skip and swap with their undo, Mark the
    day done. *What only the sheet does:* the whole day on one page, Done and Skip with each one's undo, the effort
    slider and the notes saved as they change, add and remove, the two nudges, the 1RM card, the run's log.
  - *The size.* The sheet's Angular files reach the page in 112 places under 74 names, 30 of them already in the
    beta. Of HALF_MANNY's 70 training days 68 lift and 54 of those hold a run beside the lift. The 1RM card is drawn
    on 0 of the 551 training days of the ten seeded programs: the engine marks a test lift only in the last week of
    a strength program of six weeks or fewer.
- **What is built (the cut Mario agreed):**
  - *Reached as today's is.* Reopen on a done lift's card, and Start where the day opens no deck
    (`this-week/ThisWeek.tsx`). A done run's Reopen still opens nothing: its sheet is the cardio sheet's session.
  - *The view* (`frontends/native/src/day-detail/sheet-screen.ts`): the Angular sheet's `open()` as far as it reads,
    fed from core's readers of the stored state, the deck's readers and `sheet-readers.ts` (13 of the page's readers
    and tables, ported line for line). It stands on today's own models, copied and held equal to the byte:
    `day-detail-model.ts`, `session-log-model.ts`, `cardio-fields-model.ts`, `cardio-card-model.ts`,
    `sheet-marks-model.ts`, beside `session-sections-model.ts`, which the deck already held. The view holds the whole
    day, as today's does.
  - *The screen* (`SessionSheet.tsx`): the header on its band (Back, the logged count, the RPE reference, the week
    and day, the title, the tags), the range nudge, the run's workout as words, every exercise card with every set
    behind its summary, the log (the effort slider and the notes), the never marked nudge, Done and Skip at the foot.
  - *The cards' taps are the deck's own* (`deck/deck-writes.ts`): today's page runs one handler for both screens,
    and so does the beta. A skip, a swap and each undo draw the whole sheet again, which starts the log's form
    afresh, as today's `openDetail` does.
  - *The sheet's own writes* (`sheet-writes.ts`): the page's `persistLogFields`, `cardioLive` and `handleDayStatus`,
    line for line, over a model of the log's form (`LogForm`: the slider and whether it was moved, the notes, every
    cardio node the template draws with the value it was drawn with). Done raises the completion pop-up over This
    Week and no toast; Skip raises its toast; the undo leaves the sheet open and draws its foot again; the undo of
    Done on the program's last day lets the season's pop-up go (`pop-up/pop-ups.ts` `releaseSeasonShown`).
  - *Motion.* The sheet slides up and away as the swap sheet does. Built once, for Mario's phone to judge
    (`MIGRATION.md` section 6, decision 14).
- **What deliberately does not change:** today's app, the page, core and what a program prescribes. The beta writes
  to its own store only (D289).
- **Not drawn yet, each waiting for its own session:** the add button and an added move's remove (drawn, taking no
  press), a double day's jog, the Wildcard tag, the 1RM card and the day's note (all four are in the view, held
  equal to today's, and left undrawn by `SHEET_DRAWS`); and in the log the run's fields, its wheels, its Log and its
  sport picker, which are the cardio sheet's. The form holds the run's fields as drawn, so a save writes what
  today's writes without them on the screen. The rest clock is not built, so a status does not stop one.
- **Found by reading, not built, not ruled:** today's sheet puts the stored notes into its box as markup, so notes
  holding an HTML entity (the five characters `&amp;`) read back as the character and are stored so by the next
  save. The beta holds the notes as typed. The test page has no markup reader, so no walk can see it.
- **Tests** (every expected value of the comparisons is today's page, on purpose; the hand-typed values are the unit
  file's):
  - `tests/unit/native-session-sheet.test.ts`, 62 tests: the copies held to the byte, the page's tables, the
    counter, the dose and what a log derives, the view on a hand-built day, the form, the save, Done and Skip, and
    which files write and what each press calls.
  - `tests/integration/native-session-sheet.test.ts`, 4 tests, HALF_MANNY through the standard history: 350 sheets
    drawn by both apps and compared whole (280 with a run, 13 with it logged, 17 of a day done, 4 skipped); then 25
    days worked through the sheet on both, 128 taps with every `ia_` key compared after each (23 slider moves, 29
    notes, 23 Done, 12 Skip, 17 undone, 24 skips and put backs, 35 reopens, 23 pop-ups), 12 of the days worked
    through the deck first (586 taps more) so the sheet opens on drafts and logged lifts; a part skipped on This
    Week then Done; and the season's mark on the program's last day.
  - `tests/sweeps/native-session-sheet.test.ts`, 2 tests, the ten seeded programs: 2,755 sheets compared whole;
    260 days, 1,331 sheet taps (and 6,098 deck taps before them), every key equal after each.
  - Five tests of four older files name the new shape: `tests/unit/native-shell.test.ts` (the files that read the
    date), `native-deck-logging.test.ts` (the sheet's folder), `native-deck.test.ts` (Reopen's press),
    `native-pop-ups.test.ts` (the season's mark is removed in one place; This Week hands the sheet on).
- **The proof:**
  - *Each new test on the previous release.* The three new files import modules the previous commit does not have
    (`git cat-file -e 9c4707a:frontends/native/src/day-detail/sheet-screen.ts` fails), so they fail there by
    construction. The four older files were run on a copy of the previous commit's tree
    (`node tools/tree-at.mjs 9c4707a`): 4 of their 125 tests fail there, each one a test this session changed. The
    fifth changed test (the deck's folder, in `native-deck-logging.test.ts`) passes on both: it guards a list that
    must not change, and what the sheet's folder now holds is the new unit file's to say.
  - *A break per rule* (`tests/measure/native-session-sheet_breaks.md`): 138 breaks, each in a copy of the tree,
    run in four parts at once: what the sheet reads, how it draws the day, what its log, Done and Skip write, a
    model's copy, and the screens' wiring. None is let through. 137 turn the fast files red (the unit and the
    integration file, with the four older unit files); one, the retest strip left off the cardio card, is caught
    by the ten-program sweep alone. The first run made 139 breaks and let 9 through. Seven were rules no test
    held, and each has a unit test now (reps of a time with fewer reps than planned, a benchmark with no time, a
    double day's jog in the view, a swapped sport's dose, a card live by the sport it is on, the derived pace
    never written over the form's own, a status tap's toast). Two took out half of a rule the code keeps twice
    and changed nothing, and were fixed in the list: the lift log's fold (the launch folds it first) was dropped,
    and the day's snapshot on a status tap (the save inside the tap takes it too) is now broken in both places.
  - *Where the Expo app's packages are not installed* (`node tools/tree-at.mjs --working`): the three new files and
    the four changed ones pass (190 tests on the first run, before three unit tests were added), and so does every
    clean run the breaks make there. `tsc -p .` found one type error in the new unit file, which Vitest does not
    check; fixed, and the tests' type check is clean.
  - *The Expo type check:* clean.
- **Seen on the simulator** (iPhone 17 Pro, iOS 26.5, `npm run sim-ios`, the Release build under Hermes, the copy of
  Mario's backup, Monday of week 13, at night): Reopen on Posterior Chain opening the sheet (1 / 1 logged, Lift and
  Run, the Speed Run's workout above the lift, the Trap bar deadlift logged at 13 / 12 / 12 and 185 lbs, the taper's
  line, effort 9 and "Felt easy"); Done ✓ tap to undo, which said Unmarked and drew Done and Skip; Done, which
  slid the sheet away and raised the completion pop-up over This Week with the card done behind it; the sheet opened
  again and the sets opened, every set on its row with Fill every set. The store of the simulator's copy holds
  Monday done again, at a new instant. By day the clock stood dark on the dark header: the sheet now asks for a
  light one while it is up. The final code was then built once more (`npm run sim-ios:fast`) and looked at again:
  the clock light over the header by day; the RPE reference; a move's minus (Skipped with Put it back, its toast,
  the counter gone with the day's one loggable move) and its Put it back; the swap sheet opening over the sheet,
  left by Back with no pick.
- **Not seen yet:** his phone. On the simulator: Skip at the foot, a pick on the swap sheet, the slider dragged,
  notes typed under the keyboard, the range nudge and the never marked nudge, a round, Reduce Motion.
- **The ledger** (`tests/measure/rn-migration_test-ledger.md`): the sheet's rows are filled when the sheet is whole,
  after its next session.
- **Next for the sheet:** add and remove, the Wildcard tag, a double day's jog, the 1RM card and the day's note. The
  run's log and its wheels come with the cardio sheet.

## On Mario's phone, IA Next build 117 (2026-11-16)

- **The build:** `0.262.4 (117)`, uploaded by run 43978885142 on `main` (merge 612d762, pull request 50) and read
  back as processed (`docs/decisions/testflight.md`, the thirteenth run). It carries the sheet's first session.
- **What he was asked,** five steps: Reopen on a done lift (the sheet slides up); the header, the run's workout and
  each card with its set rows; the effort slider and a note, kept over Back and Reopen; Done ✓ tap to undo, then
  Done with the sheet sliding away and the pop-up; Skip and its undo.
- **His report,** one line, no screenshot: "1. yes its slides up 2. yes 3. yes 4. yes 5. yes all same as todays".
- **What follows:** nothing differed from today's app and no motion was named (`MIGRATION.md` section 6, decision
  14), so nothing was fixed from it. The sheet's first session stands as built.

## The session sheet in the Expo app: add and remove, and the four small blocks (Post-v0.262.4, the migration's phase 3, the session sheet's second session)

- **Date:** 2026-11-16. **Ruled by:** no new ruling. Every word, number and behaviour is today's, carried into the
  Expo app unchanged, so each keeps its ruling: add and remove are V109, an added move's dose is V163 (D1 to D4,
  `docs/decisions/session-edits.md`), the jog block is D231 item 4, the Wildcard tag is the Wildcard's own. The cut was
  put to Mario after the measure and he took all six pieces ("Yeah"). **Bump:** none, the page and core do not move
  (a Post-v0.262.4 pass, standing ruling 1). **Shipped:** Post-v0.262.4, no build of today's app; the beta's next
  build carries it once Mario merges it.
- **The finding (measured before any edit, `tests/measure/native-sheet-add_today.md`):**
  - *The add sheet.* It stands on 543 of the 551 training days of the ten seeded programs and offers 8,179 rows, 7
    to 17 a sheet, 91 moves and 27 doses. The conservative dose (three sets of ten at RPE 7) is the donor on 5,162
    rows; 265 rows are shaped again for a lift with no load to move.
  - *What a pick and a remove write.* A pick is `addAddEdit` (`ia_edits`), then `refreshDaySnapshot` (`ia_hist`),
    which renews the day's snapshot only where the day has one. A remove is `dropAddEdit` and the same. A logged
    added move keeps its lift log entry when it is removed.
  - *The 1RM card.* In 1 of the 140 programs of the wizard's goal and focus cross (no cardio, a strength focus, six
    weeks), on 3 days, and on none of the ten seeded programs. Its save writes one field of `ia_programs` through
    `writePrograms`, raises no toast, and nothing moves at the next launch.
  - *The other three only read.* The day's note is plain words (6 days of 2 programs of the 140). The Wildcard tag
    reads the Wildcard's record. The jog reads the day's own log entry; its Edit cardio opens the rest sheet.
  - *Found, today's behaviour, not built and not ruled:* a move added to a day touched in no other way is still on
    the card the next morning and gone once its week has passed. The launch drops the day's record, and no
    snapshot holds the move. It is the same family as the skip on an untrained day that `MIGRATION.md` carries.
- **What is built (the cut Mario agreed):**
  - *The add sheet* (`frontends/native/src/add-sheet/AddSheet.tsx`, over today's own `add-sheet-model.ts`, copied
    and held to the byte): opened by the header's add button, three lists with today's words and notes, each row a
    pick. What it lists is `day-detail/sheet-adds.ts`: the page's `addCandidates`, `_addRxKind` and
    `addedDetailFor`, line for line, and the Angular sheet's `open()`.
  - *Add and remove* (`sheet-writes.ts` `addMove` and `removeAdded`): the page's `applyAddChoice` and
    `removeAddedExercise`, line for line. An added move's card carries "remove". Each draws the whole sheet again,
    as today's `openDetail` does, and raises today's toast.
  - *The 1RM card* (`SessionSheet.tsx` `E1rm`, `sheet-writes.ts` `e1rmEstimate` and `saveTestMax`): the Angular
    card's `update()` and `save()`. The estimate reads 0 until a field changes, as today's does.
  - *The jog, the Wildcard tag and the day's note* are drawn where the view already held them (`SHEET_DRAWS` now
    names every kind of block).
- **What differs from today's, on purpose, each for Mario's phone:** the 1RM card's reps are five buttons, where
  today's is a list of five (a web list has no twin here). The jog's Edit cardio is drawn and takes no press: it
  opens the rest sheet, which is not built.
- **What deliberately does not change:** today's app, the page, core and what a program prescribes. The beta writes
  to its own store only (D289).
- **Tests** (every expected value of the comparisons is today's page, on purpose; the hand-typed values are the unit
  file's):
  - `tests/unit/native-session-sheet.test.ts`, 93 tests (62 before): the add sheet's lists on a week built by hand
    (the tiers, their order, their caps, no move on the card, none with no pattern), the dose by nearest type (the
    card's last accessory, the week in calendar order, the region, the conservative dose, and what never donates),
    the sheet's words, a pick, a second, a remove, the snapshot, the 1RM estimate and its save, and what each press
    of the screen and of the add sheet calls.
  - `tests/integration/native-session-sheet.test.ts`, 7 tests (4 before), HALF_MANNY: the add sheet of every day
    drawn by both apps and compared whole (350 sheets, 5,337 rows); the walk through the sheet now opens 19 add
    sheets, picks 19 rows and removes 12, every `ia_` key compared after each (174 taps, 128 before); a test week's
    day of the one program that has one (the card prefilled from the logged set, the note, three saves, the next
    launch); a double day, its jog made by today's own rest sheet; and an added move across the launch that keeps
    it and the launch that lets it go.
  - `tests/sweeps/native-session-sheet.test.ts`, 2 tests, the ten seeded programs: 2,755 add sheets compared whole
    (41,093 rows); 1,812 sheet taps (1,331 before) with 198 picks and 127 removes, every key equal after each. The
    picks took the conservative dose 89 times, a donor's 87 times and open sets 22 times.
- **The proof:**
  - *Each new test on the previous commit.* The integration file and the sweep load the walk, which imports
    `sheet-adds.ts`; the previous commit does not have it (`git cat-file -e e197a47:frontends/native/src/day-detail/sheet-adds.ts`
    fails), so both fail there by construction. The unit file imports it too. Run on a copy of the previous commit's
    tree (`node tools/tree-at.mjs HEAD`) with that import and the 26 tests of the new modules taken out, 11 of its
    67 tests fail, each one a test this session added or changed. One new test passes on both: the Wildcard tag in
    the view, which the first session's view already held; its comment says it guards what must not change.
  - *A break per rule* (`tests/measure/native-session-sheet_breaks.md`): 256 breaks, the first session's 138 with
    this session's 118, each in a copy of the tree. One part of four was run first, alone, and let nothing
    through. The whole set then let 2 through. One was a rule the code no longer keeps (the screen now draws every
    block, so handing back the whole body changes nothing): the break was fixed to break the filter itself. The
    other was a word the card says twice, held by a check either place satisfied: each place is now held by its
    own, and has its own break. The whole set was run again: none is let through. 255 turn the fast files red; one,
    the retest strip left off the cardio card, is caught by the ten-program sweep alone, as before.
  - *Where the Expo app's packages are not installed* (`node tools/tree-at.mjs --working`, four copies): the fast
    files and the sweep pass unbroken in each copy before its breaks, and `tsc -p .` in its `tests/` is clean.
  - *The type checks:* the Expo app's and the tests' own, both clean.
- **Seen on the simulator** (iPhone 17 Pro, `npm run sim-ios`, the Release build under Hermes, at night, each tap
  read from the screenshot after it):
  - *On the copy of Mario's backup, Monday of week 13:* Reopen on Posterior Chain; "+ Exercise" beside the tags; the
    add sheet ("Add an exercise", Posterior Chain, Week 13, Leg day, 3 sets, six rows of work the day has none of,
    then "More of what you're already doing" with "Sets go to 6."); Back squat picked, the toast "Back squat added
    at 3×10 — RPE 7.", the counter from 1 / 1 to 1 / 2 logged, its card with "You added this · not in the plan" and
    "remove"; remove, "Back squat removed.", the counter back to 1 / 1. The copy's store was left as it stood.
  - *On a test program, put into the simulator's store for the look and taken out again* (the six week strength
    program on its bench test day, the test set logged, a Wildcard done and a walk on the day's log, made by
    today's page; the copy of Mario's backup was saved aside first and put back byte for byte, the same hash
    before and after): "Also on Monday", "25 min walk logged · RPE 3" and Edit cardio; "Wildcard done", "Push is
    still on the board."; the 1RM card after the first section with 225 and 3 reps from the logged set and an
    estimate of 0; 5 reps tapped, 263; Save as new bench max, "Saved. Your next block anchors off 263 lbs." where
    the button stood, and 263 in the store's program with the squat and the deadlift untouched; the day's note
    after the work.
- **Not seen yet:** his phone. On the simulator: a weight typed into the 1RM card under the keyboard, the add sheet
  under Reduce Motion and by day, a second pick into the same block, a day with nothing left to add.
- **The ledger** (`tests/measure/rn-migration_test-ledger.md`): the sheet's six rows are filled.
  `tests/integration/session-sheet.test.ts` (10 tests, 22 assertions) is replaced for the Expo sheet by the three
  `native-session-sheet` files (98 tests, 397 assertions, by the ledger's static count); the five model tests under
  `frontends/app/test/unit` are kept, each model's copy held to the byte.
- **Next for the sheet:** nothing of its own. The run's log, its wheels, its Log and its sport picker come with the
  cardio sheet; the jog's Edit cardio with the rest sheet.

## On Mario's phone, IA Next build 118 (2026-11-17)

- **The build:** `0.262.4 (118)`, uploaded by run 44185429056 on `main` (merge 6e9b9bf, pull request 51) and read
  back as processed (`docs/decisions/testflight.md`, the fourteenth run). It carries the sheet's second session.
- **What he was asked,** five steps: Reopen on a done lift (the sheet slides up); the add button on the header
  beside the tags; the add sheet and its slide, and a pick; the pick's toast and the added card under Added by you
  with its remove; the remove and its toast. His program has no test week, so the 1RM card was not asked of him.
  He first asked which button and which sheet were meant, and was given the five steps with their words.
- **His report,** one line, no screenshot: "yep all good".
- **What follows:** nothing differed from today's app and no motion was named (`MIGRATION.md` section 6, decision
  14), so nothing was fixed from it. The sheet's second session stands as built, and the sheet is whole but for
  the run's log, which is the cardio sheet's.

## The cardio sheet in the Expo app: the run card's taps, the wheels, Log and the sport picker (Post-v0.262.4, the migration's phase 3, row 3)

- **Date:** 2026-11-17. **Ruled by:** no new ruling for the sheet itself. Every word, number and behaviour is
  today's, carried into the Expo app unchanged, so each keeps its ruling: one cardio alone is D278
  (`docs/decisions/this-week.md`); the wheels are V182 D1 to D6, V184 D5, V232 D199 to D203, V233 D207 to D210, V235
  D215 and D216, V237 D220 to D222; the dose grammar is V148; the readout's gap V191 D40; the park and its note V234
  D213 and D214; draft and logged V236 D218; the effort slider D219. One ruling is the row's own: D294
  P-HANDLOGDOOR, Record run's door until the recorder is built (`docs/decisions/this-week.md`). The cut was put to
  Mario after the measure and taken whole ("Concur, build it"): the cardio sheet, the rest timer
  (`docs/decisions/rest-timer.md`) and that door, in one session. **Bump:** none, the page and core do not move (a
  Post-v0.262.4 pass, standing ruling 1). **Shipped:** Post-v0.262.4, no build of today's app; the beta's next
  build carries it once Mario merges it.
- **The finding (measured before any edit, `tests/measure/native-cardio-sheet_today.md`):**
  - *Where it shows.* 382 days of the ten seeded programs hold a run, a ride or a swim (316, 30 and 36); 374 with a
    lift beside it, 8 with the cardio alone, which keep Done and Skip. The log draws six forms: 143 days a fixed
    time, 96 a fixed distance, 55 miles and pace side by side, 22 the reps stepper with the rep clock, 30 the ride's
    clock under its strip, 36 the swim's yards. The Half Manny's 56 run days draw three of them (27, 15 and 14),
    never the stepper.
  - *What each tap writes.* The sheet's opening, a wheel rolled on a draft card, the picker and Log on an empty card
    write nothing. Log writes `ia_logs`, and `ia_hist` on the day's first touch. A wheel rolled on a logged card
    writes `ia_logs`. A chip parks the leaving sport's numbers inside the day's entry and brings the arriving
    sport's back. Done on a day that is only its run adds `ia_comp` and the pop-up's two keys. Every write goes
    through three of core's writers the beta already called (`writeDayLogs`, `settleDayParts`, and the day's
    snapshot): no new writer, and nothing asked of core.
  - *The catch,* and D294: on the iOS app a run card's button opens the recorder, which is phase 4's.
- **What is built (the cut Mario agreed):**
  - *Reached as today's is* (`this-week/ThisWeek.tsx`, over `cardRoute` of the model's copy,
    `day-detail/cardio-sheet-model.ts`): Log the ride and Log the swim, a done run's, ride's or swim's Reopen, and
    Record run (D294), open the day's sheet for that cardio alone. A done lift's Reopen still opens the whole day.
  - *One cardio alone* (`sheet-screen.ts` `sheetFrame`, the Angular sheet's last step): the when line and the
    cardio's name, no tags, no counter, no add button, the cardio card and the log; Done and Skip only on a day with
    no lift. The sheet keeps it for its life, over every redraw, as the Angular sheet does.
  - *The wheels' rules* (`wheels.ts`): the page's `_iawParse`, `_iawFormat`, `_iawHome`, `_iawRecenter`,
    `_iawCommit` and the seed of `iaWheelInit`, line for line: what a stored string seeds, the string a face stores,
    the face a wheel opens on (the plan, when storage is blank), that nothing is written until a wheel rests on
    another face, and the jump of a wrapped column back toward its middle.
  - *The cardio card's taps* (`cardio-log.ts`, over the `LogForm` the sheet already held): the fields' input
    listener (`setNode`), the page's `updateDoseDerived` as a view (`doseReadout`), `doseRep` (`stepReps`),
    `logCardio`, `toggleCardioPicker` and `setCardioSwap` (`swapSport`). The picker's one direct write, the park,
    stands in `sheet-writes.ts` (`parkSport`), which stays the one file of the sheet that calls core's writers.
  - *The screen* (`CardioLogBlock.tsx`, `Wheel.tsx`, drawn inside the log of `SessionSheet.tsx`): the plan strip,
    the wheels, the reps stepper, the readout, Did a different activity? with its three chips and note, and Log,
    which reads the store for its words, never a flag of its own. A wheel is a column of rows per digit group that
    snaps to a row and is read 90 ms after it last moved; Log, a chip and a status that closes the day rest every
    wheel first (the page's `iaWheelFlush`).
  - *Motion.* The wheels, the picker and the sheet's slide are built once for Mario's phone to judge
    (`MIGRATION.md` section 6, decision 14). The rows above and below the band recede under a shade; they are not
    shaped row by row as today's are.
- **What deliberately does not change:** today's app, the page, core and what a program prescribes. The beta writes
  to its own store only (D289).
- **Found by the walk, in the walk itself:** the page's stepper writes a number into its field, which an input
  holds as text; the walker's stand-in kept the number, and the two stores differed by `2` against `"2"` until the
  stand-in held text as an input does. Nothing differed between the two apps.
- **A rule the code keeps twice:** the picker brings the store level with the form before it parks, and saves the
  form again after. On no path of the walks does the first save change what the second leaves, so no break of it
  alone is in the list; it is ported as today's has it.
- **Tests** (every expected value of the comparisons is today's page, on purpose; the hand-typed values are the
  unit file's):
  - `tests/unit/native-cardio-sheet.test.ts`, 37 tests: the two models' copies held to the byte, the wheels' rules,
    the readout, what each tap writes, one cardio alone and where a card's tap goes, what the screens call, and the
    rest timer.
  - `tests/integration/native-cardio-sheet.test.ts`, 3 tests. HALF_MANNY through the standard history: 20 days
    worked through the cardio log on both apps, 503 taps with every `ia_` key compared after each, and with it the
    form, the fields on show, the dose, the readout, each wheel's place and what it remembers, the button and the
    toast (317 rests of a wheel, 293 that wrote and 24 that did not, 22 jumped back toward the middle; 44 Log taps,
    16 on an empty card; 61 chips, 20 on the sport the card was on). Then a day that is only its run, with Done
    over the rolled card; and a rep session of the 1.5 mile test goal program, for the stepper.
  - `tests/sweeps/native-cardio-sheet.test.ts`, 1 test, the ten seeded programs: 173 days, 3,906 taps, every key
    equal after each (2,255 rests of a wheel, 35 steps of the stepper, 375 Log taps, 516 chips; the six forms drawn
    238 times).
  - Six tests of two older files name the new shape: five in `tests/unit/native-session-sheet.test.ts` (the
    sheet's folder, the save's dose, the redraw, the frame, This Week's taps) and one in
    `tests/unit/native-deck.test.ts` (a card's button).
- **The proof:**
  - *Each new test on the previous commit.* The three new files import modules the previous commit does not have
    (`git cat-file -e a33e87a:frontends/native/src/day-detail/cardio-log.ts` fails, and
    `.../rest-timer/rest-clock.ts`), so they fail there by construction. The two older files were run on a copy of
    the previous commit's tree (`node tools/tree-at.mjs a33e87a`): 6 of their 138 tests fail there, the six this
    session changed. `tests/support/native-session-sheet.ts` changed in wiring only (its members opened to the
    cardio walker, and the dose a save derives from read through one method).
  - *A break per rule* (`tests/measure/native-cardio-sheet_breaks.md`): 147 breaks, each in a copy of the tree. One
    part ran first, alone: 37 breaks, 35 red in the fast files, one caught by the sweep alone (the picker open at
    the draw of a swapped sport) and one let through (the park's own write, which the picker's last save covers).
    Both got a unit test, the same kind of gap was looked for in the other parts, and then the whole set ran in
    four parts at once with nothing beside it: 147 of 147 red in the fast files, none swept, none let through.
  - *Where the Expo app's packages are not installed* (`node tools/tree-at.mjs --working`): `tsc -p .` in the
    copy's `tests/` is clean, and the three new files, the two changed ones and
    `integration/native-session-sheet.test.ts` pass there (6 files, 186 tests).
  - *The session sheet's own break list* (`tests/measure/native-session-sheet_breaks.mjs`), read against the code
    before the session's edits (`--check`: 256 breaks, 0 with a text not found once) and again after them: 8 of its
    breaks named text this session changed (the save's dose, the body read off the frame, the card's Reopen, what
    This Week hands the sheet, the rest clock handed to the sheet). Each was pointed at the code as it stands and
    run again alone on that list's fast files: 8 of 8 red. The whole list was not run again.
  - *The Expo type check:* clean. *Every unit and integration test:* 109 files, 2,208 passed and 2 skipped. *The beta's sweeps:* 8 files, 17 passed and 1 skipped.
- **Seen on the simulator** (iPhone 17 Pro, `npm run sim-ios`, the Release build under Hermes, the copy of Mario's
  backup, Tuesday of week 13, at night): Record run on the Recovery Run opening the run's own sheet (Today ·
  Tuesday, Recovery Run, no tags, no add button, no Done and Skip; the strip `15 min @ 10:30/mi`, the clock
  showing the plan, miles on zero, "enter distance"); miles rolled to 3.20, the readout `4:41/mi` with what it
  assumed and its gap; Log, the button reading Logged ✓ and the toast Run logged ✓; the picker, the Bike chip (Log
  the ride, the clock on zero, the note that the run's numbers are kept) and back, the run's 3.20 returned; Back,
  the run card done as `3.2 mi · 4:41/mi`; its Reopen opening the same sheet on the stored numbers. The final
  code (the Log button one size in both states) was then built again (`npm run sim-ios:fast`) and the sheet, a roll
  and Log looked at once more. A roll sent right after another motion was lost twice, and landed when sent alone.
  *The stepper, on a test phone's keys:* The Half Manny has no rep day, so the simulator's store was saved aside
  (sha256 `d4a2a8ec…872f11`), the keys of a test phone holding the 1.5 mile test goal program written into it, and
  Monday's Short Interval opened: `4 × 400m @ 8:13/mi`, Reps completed 4 of 4, one rep fewer, the rep clock rolled
  to 1:00, Work done `0.75 mi`, `4:01/mi`. The saved store was then put back, twice in all, and read the same hash
  both times.
- **Not seen yet:** his phone. On the simulator: the day mode, a swim's box under the keyboard, Done at the foot
  of a day that is only its run, a wheel still coasting when Log is tapped, Reduce Motion.
- **Not built, each waiting for its own session:** the recorder and its Live Activity (phase 4); the rest sheet,
  so the jog's Edit cardio still takes no press.
- **The ledger** (`tests/measure/rn-migration_test-ledger.md`): the row's nine rows are filled.
- **Next for the row:** Mario's phone on the next IA Next build.

## On Mario's phone, IA Next build 119 (2026-11-17)

- **The build:** `0.262.4 (119)`, uploaded by run 44227254025 on `main` (merge c54d41b, pull request 52) and read
  back as processed (`docs/decisions/testflight.md`, the fifteenth run). It carries row 3: the run card's taps, the
  cardio sheet and the rest timer.
- **What he was asked,** five steps: Record run on a run card opening that run's own sheet (D294); the wheels, then
  Log and its toast; Did a different activity?, its chips and back; Reopen on a done run; the rest timer (the tab,
  its card, Start, Stop, Reset, a drag to the other edge, stopped by Done). His program has no rep day, so the reps
  stepper was not asked of him.
- **His report,** one line, no screenshot: "All good, also I'm good with taking out the rest timer entirely, we'll be shifting to the Dynamic Island later, keep it in the PWA though since we can't use Dynamic Island on that one".
- **What follows:** nothing differed from today's app and no motion was named (`MIGRATION.md` section 6, decision
  14), so nothing was fixed from it. The cardio sheet stands as built. The rest of his line is a ruling of its own:
  the floating rest timer comes out of the Expo app (D295 P-ISLANDONLY, `docs/decisions/rest-timer.md`).

## D294 ends: Record run opens the recorder (2026-11-28)

- **Date:** 2026-11-28, Post-v0.263.0, phase 4's recorder session. **Ruled by:** D294 itself, which held "until
  the recorder is built". No new D-code.
- **What changes:** in the Expo app, Record run and Record the race on a run card open the Run recorder out of the
  card (D272 item 6, Amendment 2; `docs/decisions/gps-recording.md`), as today's iOS app does. The run's own hand
  log is behind **Ran without the phone?** on the recorder, before Start, as on today's.
- **Does not change:** Log the ride, Log the swim and a done run's Reopen still open that cardio's own sheet. A
  build without the GPS module offers no Record run, and its run card's button is the hand log.
- **Tests:** `tests/unit/native-cardio-sheet.test.ts` (the card's routes) and
  `tests/unit/native-run-recorder.test.ts` (the door).
- **Release:** IA Next, the first build after the merge.
