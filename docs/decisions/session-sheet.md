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
