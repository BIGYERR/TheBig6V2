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
