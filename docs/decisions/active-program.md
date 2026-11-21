# The active program: decisions

One program is active, one place says so, and Set Active makes it so (D178, P-ACTIVE, V221: its record is in the handoff
and `tests/measure/v221_rulings/p_active_ruling.md`). The switch is `setActive` and the archive and delete handoff
(`_handoffActiveFrom`) in `frontends/app/src/legacy/src/js/program-manage.ts`, both through `loadActiveProgram`. Tests:
`tests/integration/active-program.test.ts`.

## D238: P-REMINDSWITCH, a switched-to program does not ask about days spent on another (v0.240.1)

- **Date:** reported and ruled 2026-10-18. **Ruled by:** the main session (coach hat) on Mario's line. **Bump:** PATCH
  (Mario). **Shipped:** v0.240.1.
- **The report (Mario):** Sunday of Week 8 of THE HALF MANNY, the reminder ("UNFINISHED BUSINESS") asked about
  `Saturday, Wk 7 · Full Body Support`, a day he spent training another program.
- **The finding (measure):** `maybeShowReminder` (`popups-streaks-reminders.ts`) runs once a day at boot and asks about
  the most recent strictly-past training day of the active program that is neither marked nor already asked
  (`ia_reminded_<id>`). Nothing records when a program became active: `setActive` writes only `ia_active`. So every
  training day of a program that passed while another was active reads as a missed day, and the reminder walks back
  through them one a day. Measured on the HALF_MANNY fixture (`tests/measure/active-program_reminder-switch.ts` and its
  `.out.txt`): 3 days away, 3 pop-ups; 8 days away, 6 pop-ups; 14 days away, 10, each about a day on the other program.
  Neither button tells the truth: Done writes a workout he did not do, and Skip breaks the streak (49 to 20 after 8 days
  away). Tapping outside the card writes nothing and is the only true answer today. The streak reads an unmarked day as
  transparent, so the reminder is the only reader that misreads these days.
- **The line (Mario):** on Set Active, mark the past unmarked days as already asked.
- **What changes:**
  - When Set Active makes a program the active one, every training day of it dated before today (inside its block, by
    `scheduledDays`) that holds no mark is added to `ia_reminded_<id>`, so the reminder never asks about it.
  - The same when archiving or deleting the active program hands active to the next live one: that is a switch too, and
    the next program carries the same backlog.
- **What deliberately does not change:**
  - Nothing is written to the record (`ia_comp_`): the days stay unmarked, so the streak, the completed and skipped
    counts and the season pop-up read exactly what they read before. The athlete can still mark any of them by hand.
  - Today and every later day are not touched: a day that passes while the program is active is asked about the next
    day, as before. Boot marks nothing (it loads the program the athlete already had), and the wizard marks nothing (a
    new program's block opens on the day it is built, `dayBeforeStart`).
  - The program switched away from is not touched.
  - The reminder's own rule, copy, once-a-day key and the re-entry message after a week off are unchanged.
  - No new store, no stored-format change: `ia_reminded_<id>` is the reminder's own map, written the way
    `markReminded` writes it.
- **Accepted cost:** a day missed on a program just before switching away from it and back is marked as asked by the
  switch back, so its reminder does not come. A switch log would be exact, but it is a new store.
- **The program already active on the phone** has its backlog until it is switched to again: Set Active on another
  program and back clears it.
- **Expected values (typed by hand, the clock Sunday 2026-10-11, both programs from Monday 2026-09-07):** after Set
  Active on P1, `ia_reminded_P1` holds exactly P1's training days dated 2026-09-07 to 2026-10-10 less the two marked by
  hand (one complete, one skipped); `ia_comp_P1` is byte for byte what it was; nothing is written for P0; the reminder
  that day finds nothing to ask. On Tuesday 2026-10-13 it asks about Monday, Wk 6 (2026-10-12), the first day missed
  after the switch.

## D240: P-REMINDGAP, the reminder never reaches back past a day you marked (v0.241.1; amends D238)

- **Date:** reported and ruled 2026-10-19. **Ruled by:** Mario, choosing "stop at the last mark" over a 7-day cap and a
  one-time clear on update. **Bump:** PATCH (Mario). **Shipped:** v0.241.1.
- **The report (Mario):** Monday of Week 9, the reminder asked about `Thursday, Wk 7 · Recovery Lift`, the next day back
  in the same week spent on the other program. "I think I seen it pop up again."
- **The finding (measure, part 2 of `tests/measure/active-program_reminder-switch.ts`, on v0.241.0):** the phone did not
  have D238 (the last install was 2026-10-09, and Pages serves V239). D238 also cannot reach a program that was already
  active when it landed: no switch happens, so nothing marks the backlog. `maybeShowReminder` skips a marked day and
  keeps walking back, so a gap behind marked days is asked about one day at a time. On the fixture, away a week and
  back marking every day: 5 pop-ups over 5 days, each about a day on the other program. With the walk stopping at the
  first marked day: 1, on the day back.
- **What changes:** the reminder walks back from the most recent past training day and stops at the first day that
  holds a mark (complete, partial or skipped). It asks only about the newest unmarked day not yet asked in the stretch
  since the last mark. Once a later day is marked, the days before it are behind the athlete and never asked about.
  The doctrine is the re-entry line's own: never chase missed work.
- **What deliberately does not change:** D238's switch marking stays (a switch back after time away still gives 0
  pop-ups instead of 1). Within an unmarked stretch the reminder still asks newest first, once a day, and a day already
  asked is still skipped. The gap count, the copy, the re-entry message after a week off and the once-a-day key are
  unchanged. Nothing is written to the record.
- **Accepted cost:** with two days missed and the third marked, only the second is asked about the next morning; the
  first never is. Mario chose this over the 7-day cap, which would still walk back through a week of unmarked days.
- **Expected values (typed by hand, the clock Sunday 2026-10-11, the program from Monday 2026-09-07):** weeks 1 to 4
  marked, week 5 Monday to Thursday unmarked, Friday 2026-10-09 marked, Saturday 2026-10-10 unmarked: the reminder asks
  about Saturday, Wk 5. With Saturday marked as well, it asks nothing (before: Thursday, Wk 5). With nothing marked after
  week 4, it asks about Saturday, Wk 5, then the next day (Saturday asked) about Friday, Wk 5.

## D240 in the Expo app: the day-after reminder (Post-v0.262.3, the migration's phase 3, the deck's fourth session)

- **Date:** 2026-11-15. **Who:** Mario's brief, the pop-ups' cut ("i concur with pop ups as briefed"). **Ruling
  carried:** D240, unchanged: the walk stops at a marked day, and the days before it are never asked about. **Release:**
  no version; `ia-version` stays 0.262.3.
- **What is built:** `frontends/native/src/pop-up/pop-ups.ts` `maybeShowReminder` and `resolveReminder`, the page's
  functions line for line, raised 600 ms after each launch (`App.tsx`). The whole record, with the completion pop-up
  and the nudge, is `docs/decisions/swipe-deck.md`, the pop-ups' entry.
- **Not built:** D238's part, a switched program's past days marked as asked (`markPastAsked`): the Expo app has no
  program switch yet. It comes with the program list.
- **Tests:** `tests/unit/native-pop-ups.test.ts` ("a marked day ends the walk", typed by hand) and the walks of
  `tests/integration/native-pop-ups.test.ts` and its sweep, against today's page at every launch.

## The program list in the Expo app: the list, a card's detail, the rename, Set Active, Archive, Delete Forever, the goal sheet and the mile pencil (Post-v0.262.4, the migration's phase 3, row 5, the first of three sessions)

- **Date:** 2026-11-18. **Ruled by:** no new ruling. Every word, number and behaviour is today's, carried into the
  Expo app unchanged, so each keeps its ruling: the one switch of the active program (V221 D178); a switched-to
  program's past days marked as asked (D238, above); Archive apart from Delete Forever, in two tiers (V156 D1b); the
  mid-program goal switch, its ranks and its two decisions (V145 D5), the swim carry (V212 D110a); the mile pencil,
  its lock and its validator (V203 D116, D183, D187 R3, D188); the race's countdown (V223 D182); the pace chips and
  where the mile comes from (V172 D7, V176 D10, V187 F7); the beta's own store (D289,
  `docs/decisions/data-backup.md`). **The cut** was put to Mario after the measure as three sessions (this one; the
  rest day sheet with the coach's mile nudge; Hurt? and Traveling? with their chip and check in), with the case
  against it said; he took it ("Concur, build it"). **Bump:** none, the page and core do not move (a Post-v0.262.4
  pass, standing ruling 1). **Shipped:** Post-v0.262.4, no build of today's app; the beta's next build carries it
  once Mario merges it.
- **The finding (measured before any edit, `tests/measure/native-program-list_today.md`):**
  - *What switches the active program.* Three taps: Set Active, Archive of the active program, Delete Forever of
    the active program. Each writes `ia_active` and the new program's `ia_reminded_<id>` and makes one rebuild
    (core's `refreshStoredProgram`); with no program left to take over, `ia_active` is removed.
  - *What rebuilds.* Beside the switch: a goal switch or a new mile on the active program. On a program that is not
    active each is a stored edit alone (`ia_programs`). On the ten seeded programs 52 goal switches (every option
    but the current one on 11 sheets of 63 options) and 8 new miles changed 0 days that were logged or marked.
  - *What does not.* Rename (`ia_programs`), Archive or Delete Forever of a program that is not active, opening a
    card, the pencils, the two confirm tiers and Cancel (nothing written).
  - *The mile pencil* shows on 8 of the 10 programs (a run goal that reads the pace chart); opened at 40 stretches
    of the standard history, the lock stood on 4.
  - *What the page keeps outside core, and comes with the screen:* a card's selections and its five label tables,
    the pace chips and their sentence, the week a stored program is in (`programs.ts`); the wizard's four goal
    tables (`wizard.ts`) and the mile's validator (`wizard-generate.ts`), which the wizard reads too (row 6); the
    rename, the switch, the hand on, Archive, Delete Forever, the goal's and the mile's commits (`program-manage.ts`,
    `programs.ts`); the past days marked as asked (`popups-streaks-reminders.ts`).
  - *On Mario's data* (a copy of the simulator's store, counts only): 3 programs, 1 archived, so the list draws 2
    cards. All 3 mark their 1RM chips "(est.)", which no seeded program draws. The mile pencil shows the lock on
    all 3: each stands in its last three weeks.
- **What is built** (`frontends/native/src/program-list/`, `goal-sheet/`, `mile-sheet/`, and a Programs tab, the
  first of four, in `App.tsx`; 1,549 lines in 11 files):
  - *Today's models, as today's files.* `program-list-model.ts`, `program-detail-model.ts`, `goal-sheet-model.ts`
    and `mile-sheet-model.ts`, copies held equal to the byte.
  - *The page's code, line for line.* `list-readers.ts`: the selections, the label tables, the pace chips and their
    sentence, the goal tables, whether a goal's targets stand, the mile's validator. `list-screen.ts`: what the
    page keeps between draws (the open cards, the card being renamed, the confirmation and its tier), each tap on
    it, the list's view, the goal sheet's draft and view, what the mile's pencil opens (judged at the tap), the
    page's markup as lines of runs, the tab bar's refusal. `list-writes.ts`, the one file of the three screens that
    calls a writer: the switch (the pointer, core's rebuild, the past days marked as asked), the rename, the hand
    on, Archive, Delete Forever (the list saved before the hand on, as D178 orders it), the goal's commit and the
    mile's.
  - *The drawing.* `Programs.tsx` (Your Programs; a card for each program not archived, the active one edged in
    signal; the name, the goal's badge, the rename pencil and the chevron; the three lines under them; the detail
    of an open card; Set Active or Active ✓ and Archive, or the archive's question, or the delete's warning; Build
    New Program), `GoalSheet.tsx` (the options, the current one marked and greyed, the decision with its typed
    targets and its two buttons, the safer one filled and first on a step up), `MileSheet.tsx` (the edit sheet, or
    the lock with its facts), `SheetFrame.tsx` (the sheets' frame: Back, a body that scrolls, the slide of this
    app's other full sheets, at once under Reduce Motion). A sheet covers the tab bar and sits under the toast.
    The list is one body through every draw, so a tap low on an open card leaves it where it stood.
  - *The tab bar's refusal* (today's `tabGo`): with no active program, which Archive now makes reachable, This Week
    and Progress do not open and say "No active program. Tap Set Active or build a new one."
  - *Set Active ends on This Week,* as today's does. This Week launches as it does on every visit to its tab, which
    reads the program the switch just stored.
- **What deliberately does not change:** today's app and the page; core (no new reader or writer, no behaviour);
  what a program prescribes; the stored format.
- **Owed from earlier rows, and paid:** archiving (Progress's walk borrowed it from the page); the whole of a switch
  after Delete Forever of the active program (the launch's own writes and D238's marks), which Progress's own
  Delete Forever never meets (its bar stands on an archived program) and so keeps as it was.
- **Carried, today's behaviour or not built, not ruled:**
  - Copy selections (the button by the seed) is drawn and takes no press: the clipboard is a native package this
    app does not carry. It comes with the date box's package in the row's third session.
  - Build New Program is drawn and takes no press until the wizard (row 6).
  - The pace goal's unit is two buttons where today's is a list of two.
  - A toast is one line in today's app and may run past both edges of the screen. In the beta a long one takes a
    second line (the tab bar's refusal was cut short on one), and past two lines ends in an ellipsis (the mile's,
    with the chart's advice).
  - A name that holds markup is read as markup by today's list; the beta draws its words, tags left out.
  - Two branches of today's code are carried line for line and reached by no tap: the sentence for a clamped mile
    that is no time (the anchor's reader never clamps what it could not read), held by a crafted call to both
    builders; and a 100 time carried onto a 100 goal (the current goal cannot be picked).
  - A blank mile on a pace goal ("Required…") is the wizard's refusal; the pencil refuses a blank field before it.
  - The rest day sheet, the coach's mile nudge (D274), Hurt?, Traveling?, the chip and the check in are the row's
    next two sessions. This Week's start date and race date are named in no row of MIGRATION.md; they need the
    date box, so they are put with the third session.
- **Proof** (`tests/unit/native-program-list.test.ts`, `tests/integration/native-program-list.test.ts`,
  `tests/sweeps/native-program-list.test.ts`, `tests/support/native-program-list.ts`):
  - *Held equal to today's page after every tap:* every word and number of the list (each card, its three lines,
    its detail), what is kept between draws, the open goal sheet, what the mile's pencil opens, each toast, the
    active program, the grid in hand after a switch or a rebuild, and every `ia_` key, value for value.
  - *The ten programs (the sweep):* the list at 50 stretches of the standard history, 14 taps on each (700 taps); 104 goal switches, each on a phone of its own (126 sheets opened, 726 options), every switch's grid compared; the mile pencil opened 24 times (20 edit sheets, 4 locks), 60 miles saved and 100 refused (40 blank, 20 no time, 20 under 3:00, 20 over 25:00); and with a second program beside each: 20 Set Active, 30 Archives and 30 Delete Forevers (10 each of the one not active, the active one that hands on, and the last one), This Week and Progress opened 20 times and refused 20.
  - *What the standard history never draws, each by a walk of its own (the integration file):* the "(est.)" mark
    and Lift only; the sentence for a default mile, a seeded one (one run, several, none counted), an edit over
    the default; the lock with the race in days, on race day, past it, and with no race; a race with no date
    stored; the hybrid path's shorter list; a sport with no goal stored (General fitness, Keep current); a swim
    goal's carry there and back; the pace goal's typed targets; an older program taking over, whose repair the
    saved list keeps; the tab bar's refusal; and the sentence and the chips for 20 crafted anchors, this app's
    beside the page's own.
  - *By hand (the unit file):* 57 tests: the four models to the byte; what is kept between draws; the chips and the sentence, each kind; a card's selections and what stands in for each that is missing; the goal tables and their ranks; a goal's typed targets; the mile's validator at each edge; the list's views; the page's markup as runs; the goal sheet's views; what the pencil opens at the week's edge and by the race's days; every write on a store of its own (the rename, the switch's refusals, the past days marked, Archive, Delete Forever, the goal's commit with each carry, the mile's commit with each source); the tab bar's refusal; and the words and the wiring of the three screens and the app.
  - *Kinds counted off the models' builders, each with a floor:* the two empty lists; a card active or not, open,
    being renamed, at each confirm tier; Lift only; the est. mark; the pace group or none, each chip by name, a
    chip with an effort; the sentence's seven kinds a tap can reach and its three tails; General fitness; the
    event's rows, No date set, the time out in weeks, in days, Race day, Behind you; the goal sheet's options,
    current and bigger; the decision a step up or plain, started or not, with a pace typed, a time typed or
    nothing, Keep by name, Keep current, Stay the course; the lock with the race and without, days out as a
    number and in words; the edit sheet with the stored mile and with empty fields; each of the mile's four
    refusals and the chart's advice.
  - *Other features' tests that list the app's files by rule:* `tests/unit/native-shell.test.ts` (which files read
    the date: the three screens join the list) and `tests/unit/native-progress.test.ts` (the tab bar's type).
  - *Where the Expo app's packages are not installed* (`tools/tree-at.mjs --working`): the new files and the type
    check green.
- **Breaks (`tests/measure/native-program-list_breaks.md`):** 180 breaks, one per rule: 180 red on the fast files (73 tests unbroken), so none was swept, none let through. Before any run two breaks were read out of the list as changing nothing: a time's missing half written as undefined, which the stored JSON drops either way, and the sheet's heading, which lower-cases a sport's label into its own key. One part was run first, alone: 44 of 44 red, so nothing was added from it. The tab bar's refusal and the toast's second line were built after that part, with their tests and five breaks, and the whole set then ran once on the final tree, in four copies with no simulator build beside it.
- **Seen on the simulator** (iPhone 17 Pro, `npm run sim-ios`, then `sim-ios:fast` after each fix): on a copy of
  Mario's backup, the list (2 cards, the active one edged), an open card (every group, the est. mark, six pace
  chips with their efforts, the sentence with its bold mile, the event), the lock with its three facts, the goal
  sheet with a step up and with the pace goal's targets, the two confirm tiers and Cancel, and Set Active (the
  toast, then This Week on the other program). On a test phone's keys (two programs made this month): the rename
  saved, the mile's edit sheet and a save, a goal switched (the chips and the sentence follow), Archive of the
  active program (the other takes over), Delete Forever and the empty list. With every program archived, This Week and Progress refuse with their toast, read whole on two lines. The simulator's store was
  saved aside before the first tap and put back after each writing pass (sha256 `278ba57f…575af3` each time, no
  `-wal` or `-shm` beside it). **Fixed from the look:** the list jumped back to its top at every draw (its body
  was keyed by the draw); it is one body now.
- **Release:** Post-v0.262.4, no build of today's app; on the phone with the next IA Next build once merged. The
  branch was rebased onto v0.263.0 (the GPS recorder's release, on `dev` meanwhile) before landing, with no
  conflict and the tests green on the rebased tree, so that build carries core's 0.263.0.

## On Mario's phone, IA Next build 123 (2026-11-19): the Programs tab's look differed, and is fixed

- Put to him on the Programs tab: his two cards with the active one edged in orange, an open card (the est. mark,
  six pace chips, the line under them, the event), the mile's pencil and its lock, a goal's pencil and its sheet,
  Archive's question and Cancel, and the list keeping its place after a tap low on an open card. He was told which
  taps write to the beta's own copy only. **His report** (two screenshots, today's 0.263.0 and IA Next 123, the
  Programs tab on each): "Fonts looks different and the copy button doesn't work not sure if you just didn't build
  it in".
- **The copy button.** Not built: it is drawn and takes no press, as the first session recorded (the clipboard is a
  native package the beta does not carry yet). It comes with the row's third session, with the date box.
- **The look, proved before anything was changed.** Both apps on the simulator (iPhone 17 Pro, the beta on a copy
  of his backup) drew what his two screenshots show. Seven things differed on the Programs tab, from two causes:
  - *Helvetica Neue has no 600 and no 800.* WebKit draws both with its Bold. iOS, asked for 800, answers with
    Condensed Black (the screen's name), and asked for 600 with Medium (the line over it). This Week and the deck
    carry the rule (every 600 and 800 of today's is 700 in the beta); the Programs tab did not, and 36 styles on
    10 other files asked for 600.
  - *The Track look's layer was left off* (D263, `look.css`, which rounds what the component sheets draw square):
    no glow behind the top bar and a rule under it; the card's corners 16 for 24; the buttons, the badge, the chips
    and the copy button square for pills; the badge and the detail's labels 10 for 12; the rename box 4 for 12; and
    Build New Program under the last card, where today's sits at the screen's foot.
  The values were read out of today's running app (the computed style of each class), never by eye.
- **A third cause, found by measuring his screenshot of today's.** Where the CSS names no line height, WebKit draws
  Helvetica Neue's line 1.34 times its size, the letters where iOS puts them and the rest under them; iOS draws
  1.19. So a card was 161.3 tall for today's 158, a button 30.3 for 32, the top bar 140.5 for 142, and the tab bar
  stood 1.7 lower than today's on every tab. Each such line on the Programs tab, and the tab bar's labels, now keep
  iOS's own height and take the difference as padding under them. The screen's name, whose height the CSS sets, sat
  5 higher than today's; it now sits where today's does.
- **Fixed, the beta only:** the Programs tab (weights, the glow and no rule, the radii, the 12s, the lines, Build
  New Program at the foot); Progress's top bar (the same two weights, the glow and no rule, the name's spacing 1.6
  for 1.2) with its buttons as pills and its box at 12; the goal sheet (tiles at 16, the box at 12, pills), the
  mile pencil (the box at 12, pills) and a sheet's Back (a pill); the tab bar's labels; and the 36 styles that asked
  for 600, now 700 (the session sheet 18, the add sheet 4, the swap sheet 4, Progress 2, its cards 2, the swap
  nudge 2, and one each on the mile pencil, the pop-ups, a sheet's frame and the cardio block). Progress's cards
  were already today's 16, which today's page writes inline.
- **Measured after, on the simulator against his screenshot of today's** (text bands and edges read from the
  pixels, in points): the line over the name 66.0 for 66.3; the name 91.7 for 91.3; the first card's top 158.3 for
  158.0 and its name 182.3 for 182.3; its three lines 211.3, 227.0 and 242.7 for 210.3, 226.3 and 242.0; its
  buttons 265.7 to 297.7 for 265.0 to 297.0; the second card 326.7 to 485.0 for 326.0 to 484.0; Build New Program
  670.7 to 723.7 for 671.3 to 724.0. Every one within a point; before, up to 5 apart.
- **Tests (`tests/unit/native-look.test.ts`, new, 17 tests):** no weight in the app but 400, 500 and 700, bar two
  styles on the system face; today's sheets still saying what the beta copies (the four radii, which shapes are
  pills, the top bar's rule); and the Programs tab, Progress and the two sheets carrying those values. On the
  commit before (`tools/tree-at.mjs`): 10 of the first 15 red; the 5 that pass guard what must not change, and the
  file says so. The 2 added after are on the lines' padding, which that commit does not have.
- **Not changed:** any word, number or behaviour; today's app; core. The other screens' own line heights were set
  when each was built and seen beside today's on his phone; they were not measured again here.
- **Release:** Post-v0.263.0, no build of today's app; on the phone with the next IA Next build once merged.

## On Mario's phone, IA Next build 125 (2026-11-20): the Programs tab's look is today's

- Put to him: the Programs tab's look beside today's, after the fix made from his two screenshots of build 123 (the
  entry above; it reached his phone as build 124, and 125 carries it). **His report:** "All good" (no screenshot).
  Nothing differed, so nothing was fixed from it. The copy button is still drawn with no press; it is built in the
  row's third session.

## The copy button in the Expo app: a program's selections to the clipboard (Post-v0.263.0, the migration's phase 3, row 5, the third of three sessions)

- **Date:** 2026-11-20. **Ruled by:** no new ruling: the text is today's `progSelLines` (V172, the run anchor's
  line D7c), carried unchanged. Mario named it on his phone on IA Next build 123 ("the copy button doesn't work");
  it was the row's third session's, and he took that session's cut ("Concur, build it", 2026-11-20;
  `docs/decisions/injury-overlays.md`, the Expo entry). **Bump:** none. **Shipped:** Post-v0.263.0, no build of
  today's app; the beta's next build carries it.
- **What is built:** `progSelLines` and `runAnchorLine` in `frontends/native/src/program-list/list-readers.ts`,
  the page's own line for line; `copyText` in `list-screen.ts` (the stored program's lines joined by line breaks);
  and the button's press in `Programs.tsx`, which hands the text to the clipboard (`expo-clipboard` 58.0.4, the
  version Expo SDK 58 names) and says Selections copied ✓ once the clipboard answers, and when it refuses, as the
  page says it after its fallback. It writes nothing.
- **Proof.** The text handed to the clipboard and the toast equal today's page's on the ten seeded programs at
  each of five stretches and on a lifter with no cardio and no lifts entered (51 copies,
  `tests/sweeps/native-change-sheet.test.ts`; The Half Manny in `tests/integration/native-change-sheet.test.ts`).
  Every line and every arm of the run anchor's line by a hand table (`tests/unit/native-change-sheet.test.ts`);
  the button's wiring in `tests/unit/native-program-list.test.ts`. The breaks are
  `tests/measure/native-change-sheet_breaks.md`.
