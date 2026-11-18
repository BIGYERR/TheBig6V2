# Progress: decisions

What the Progress screen shows. The lift ledger's tiers (MAIN LIFTS, RANGE LADDER, the rest) are built in
`frontends/app/src/legacy/src/js/lift-ledger-progress-screen.ts` and drawn by the iOS app's
`frontends/app/src/app/screens/progress/charts/` (`ledger-model.ts`, `ledger-cards.ts`). V196's rulings (D11, D57,
D59, in the handoff) are the history before this file: a lift is main by SLOT (item 0 of a `/^main/i` section), main
if ever, and the main line reads only main-slot sessions. Tests: `tests/integration/progress.test.ts`,
`tests/integration/progress-charts.test.ts`. Measure: `tests/measure/main-hinge_rotation.ts` and its `.out.txt`.

## D255: P-DEADLIFTLINE, the main hinge is one Deadlift line, its variants tagged (v0.249.0)

- **Date:** reported and ruled 2026-10-26. **Ruled by:** Mario ("i just want the main lift to display on the progress
  page as deadlift, this isnt mean to move an exercies in workouts in the program its just a display thing"; on the
  tags, "concur"). **Bump:** MINOR, v0.249.0 (Mario, the batch). **Shipped:** v0.249.0.
- **The report (Mario, Progress screenshot, MAIN LIFTS: Dumbbell bench press, Close-grip bench press, Barbell Romanian
  deadlift 95×8):** "why is romanian deadlift a main lift? and not deadlift? thats pretty nuts".
- **The finding (measure, 865 programs, `tests/measure/main-hinge_rotation.ts`):** the Posterior Chain main is drawn
  per two-week block from `EXLIB.back_compound` (Deadlift, Trap bar deadlift, Sumo deadlift, Barbell Romanian
  deadlift). HALF_MANNY: RDL W1–2, Trap bar W3–4, Sumo W5–6, Trap bar W7–8, Deadlift W9–10, RDL W11–12. Of 325
  programs with a barbell main hinge, 163 change variant inside the program, so MAIN LIFTS lists each variant as its
  own main lift. By name, the RDL is a main in 271 of 325.
- **What changes (display only):**
  - On MAIN LIFTS, the main-slot sessions of the four `EXLIB.back_compound` names are one block, titled **Deadlift**.
  - Its line plots each week's main-slot top set, whichever of the four it was. Each run of weeks on a lift other
    than the conventional deadlift is tagged once, over its first point: RDL, Trap bar, Sumo.
  - The headline top set and the "Opened at" set carry the same tag when they were not the conventional deadlift
    ("Opened at 95×8 RDL in week 1").
  - "up N lbs" compares like with like: it shows only when the opening set and the heaviest set are the same lift.
- **What deliberately does not change:** the program (what each day prescribes and which variant it draws), the slot
  rule (D11), the other main lifts (squat and press variants keep their own blocks), the RANGE LADDER and the rest,
  each variant's accessory sessions (kept off the main line, as now), and the stored logs.
- **Expected values (a hand-built history, typed from the ruling):** main-slot sessions RDL W1 95×8, RDL W2 95×8,
  Trap bar W3 155×10, Deadlift W9 185×8 make one block, Deadlift. Headline 185×8 untagged. "Opened at 95×8 RDL in
  week 1 · heaviest in week 9", with no "up". Points W1 95, W2 95, W3 155, W9 185, with "RDL" over W1 and "Trap bar" over W3, once each. With
  only Deadlift W9 185×8 and W10 195×8, the block reads "Opened at 185×8 in week 9 · up 10 lbs · heaviest in week 10".
- **Tests:** in `tests/integration/progress-charts.test.ts`, the two histories above on the single-file page and
  through the iOS app's ledger model.

## D255 Amendment 1: the first tag starts at the line, clear of the axis (v0.249.1)

- **Date:** 2026-10-27. **Ruled by:** the main session (a layout defect), found when Mario asked to see the line ("can
  you show me what that deadlift line on progress looks like?"). **Bump:** PATCH, v0.249.1 (Mario). **Shipped:** v0.249.1.
- **The finding:** a tag over the line's first point was centred on it, at the plot's left edge, where the y-axis
  labels end, so "RDL" ran into "125" in the screenshot sent to Mario.
- **What changes:** the first point's tag starts at the point (anchored at its start, two points left of it); every
  later tag stays centred over its point.
- **Expected values:** on the D255 history the RDL tag is drawn with `text-anchor="start"` and the Trap bar tag with
  `text-anchor="middle"`, on the page and in the iOS app.
- **Tests:** `tests/integration/progress.test.ts`, `frontends/app/test/unit/ledger.test.ts`.

## Progress in the Expo app: the screen, the chips and the archived bar, the journal, the estimator, the weekly dot charts and the Lift Ledger (Post-v0.262.4, the migration's phase 3, row 4, the first of two sessions)

- **Date:** 2026-11-17. **Ruled by:** no new ruling. Every word, number and behaviour is today's, carried into the
  Expo app unchanged, so each keeps its ruling: main by slot and main if ever (D11); an unloaded main lift is a main
  lift, every session in one of three numbers, a blank load costs the point (V196 D57, D58, D59); the range from the
  latest session that carries one (V194 D55); the one Deadlift line (D255 and its Amendment 1, above); the week in
  progress held back and the short first week left out of the sums (V165 D6, D26); Progress for one program at a
  time, its chips and the archived bar (V156); the delete on Progress behind its confirmation (V169); the jog's
  line (D229 item 4); the beta's own store (D289, `docs/decisions/data-backup.md`). The cut was put to Mario after
  the measure, as two sessions with the run cards in the second; he asked what all in one would cost, and took it
  as put ("Two sessions"). **Bump:** none, the page and core do not move (a Post-v0.262.4 pass, standing ruling 1).
  **Shipped:** Post-v0.262.4, no build of today's app; the beta's next build carries it once Mario merges it.
- **The finding (measured before any edit, `tests/measure/native-progress_today.md`):**
  - *What it writes.* Opening the screen wrote no key on 50 of 50 screens (the ten seeded programs at the five
    stretches of the standard history) and on the 3 programs of the simulator's copy of Mario's backup: the open's
    cleanup of the lift log writes only when it changes a row. Two taps write: Restore (`ia_programs`) and Delete
    Forever (`ia_programs`, then the program's fifteen key families removed). A chip, the trash, Cancel and the
    estimator store nothing.
  - *What it reads.* `ia_programs`, `ia_active`, and the viewed program's `ia_logs_`, `ia_hist_` and `ia_exw_`,
    through core's readers (`state-progress.ts`, v0.261.7, and the stores' own). Two pieces of the page's code
    are not in core and come with the screen: the ledger's rows (`ledgerModel` and its four helpers, 159 lines of
    `lift-ledger-progress-screen.ts`) and the easy zone's runs (`easyVsPrescribed` and its ceiling, 51 lines of
    `progress-charts.ts`).
  - *What the standard history shows.* 40 screens with a Lift Ledger (96 main lifts, 145 Range Ladder rows, 48
    other), 210 journal entries, 4,642 texts on the charts, the ledger and the journal. It stores no pace, so of
    the eight run cards it shows the Long Run Ladder alone, and its journal holds no swap and no jog: the proof
    needs a walk of its own for them.
  - *On Mario's data* (counts only): three programs, one archived, so the chips, Restore and Delete Forever are in
    reach; the active program draws seven charts and cards, a ledger with a Deadlift line, and a journal of 37
    entries.
- **What is built** (`frontends/native/src/progress/`, and a Progress tab between This Week and Bugs in `App.tsx`):
  - *Today's models, as today's files.* `progress-model.ts`, `program-chips-model.ts` and the four of `charts/`
    (`dot-chart-model.ts`, `chart-card-model.ts`, `run-charts-model.ts`, `ledger-model.ts`), 1,080 lines, copies
    held equal to the byte.
  - *The page's code, line for line.* `progress-readers.ts`: the ledger's rows, the easy zone's runs and their
    ceiling, the short first week, the three constants. `progress-screen.ts`: what the page keeps in four globals
    between draws (the program asked for, the delete armed and its tier, the estimator's lift), the tab's tap,
    each tap of the chips and the bar, the render, the estimator's line. `progress-writes.ts`: the three writes,
    the one file of the screen that calls a writer.
  - *The drawing.* `Progress.tsx` (the head, the chips, the archived bar and the delete's confirmation, the two
    empty states, the journal with its weeks folded but the latest, the estimator folded until its head is
    tapped), `ChartCards.tsx` (the weekly dot chart, Main Lifts with each line, the Range Ladder with each track,
    Other Accessory Work), `SvgPicture.tsx` and `paint.ts` (a model's picture, element by element, in the app's
    palette). Each draw is a body of its own, as the page writes it anew: the journal folds back and the
    estimator's two numbers clear.
  - *The run cards are in the view and not drawn.* The view holds all eight, from core's readers and the ported
    one, equal to today's; `DRAWN` names the kinds this app draws so far (the dot charts and the ledger). Their
    drawer, a card's head, body and footer from the page's markup, is the row's second session.
- **What deliberately does not change:** today's app and the page; core (no new reader or writer, no behaviour);
  what a program prescribes; the stored format.
- **Carried, today's behaviour or not built, not ruled:**
  - Delete Forever on Progress is offered on an archived program only, and neither archiving nor a launch leaves
    `ia_active` on an archived program, so the page's handing on of the active program has nothing to do there.
    Were the pointer on the deleted program all the same, the beta puts it on the first program that is not
    archived, or removes it, as the page leaves it; the rest of a switch (the launch's own writes, the past days
    marked as asked, D238) is the program list's, row 5.
  - Archiving is the program list's too: until row 5 the beta shows an archived program only when a loaded backup
    holds one.
  - The estimate is said in the active program's unit, else pounds. Today's reads the wizard's draft between the
    two, which is pounds until the wizard is built here (row 6).
  - A note is drawn as the page draws it (as markup, so `&amp;` reads `&`). This is today's Progress; the session
    sheet's own difference on such notes is carried from its entry.
  - A count of reps over 999 is printed by the phone's own number format (`toLocaleString()` with no locale,
    `MIGRATION.md` section 4.2); none is on Mario's data.
  - Four of today's sentences on this screen hold an em-dash (the archived bar, the delete's warning, the
    estimator's two). They are today's words, carried as they are; the copy rule's fix would be a ruling for both
    apps.
  - The journal's fold and the estimator's open are drawn at once, with no motion (decision 14).
- **Held equal to today's page** (`tests/support/native-progress.ts`: after every tap the whole view, what is kept
  between draws, each toast and every `ia_` key, value for value, no family left out):
  - the ten programs through the standard history, the screen opened and the estimator worked at each stretch: 250
    taps, 2,975 keys compared;
  - one, two and three weeks of runs logged with a pace, an effort, a swap and a jog, on each of the ten: 150
    taps, 1,170 keys compared, every one of the eight run cards drawn at least 5 times;
  - a second program beside each, the first archived, restored, archived again and deleted forever: 120 taps,
    2,390 keys compared, 10 Restores and 10 Delete Forevers, the delete's warning on 20 confirmations;
  - a lift log that needs the open's cleanup (an old key folded onto today's, the same day pair the fold makes
    dropped), written once and never again.
- **Tests:** `tests/unit/native-progress.test.ts` (47 tests: the six copies, each rule of the ledger, the easy
  zone and the short week by hand, D255's expected values from the entry above, the three writes on a counting
  store, the estimator, the paint, the screens' words against today's and their wiring),
  `tests/integration/native-progress.test.ts` (7, HALF_MANNY and one test goal program for the short first week) and `tests/sweeps/native-progress.test.ts` (21, the
  ten programs). Each fails on the previous commit by construction: it imports `frontends/native/src/progress/`,
  which that commit does not have.
- **Breaks (`tests/measure/native-progress_breaks.md`):** 213 breaks, one per rule, 2 of them let through by
  the fast files and so swept, none let through by every file. One part was run first, alone: it let 2 of its 53
  through (a lift's entries read in the store's order; a ledger with rows still reading the empty state), each
  closed by a test, and the two kinds of gap (a sort fed sorted data, a condition taken one way) were looked for in
  the other parts' rules, which added two tests, one test's entries stored out of order, and one break. The whole
  set then let 6 of 213 through: one set at the top of its range read as ready, a blank load read as a lift's
  lightest, the drift counting a short first week (no walk logged a run in one), a fold with no pair left unsaved,
  and two lines of the cards drawn unread (the footer, the title's words). Each was closed by a test and shown red
  alone, and the whole set was run again.
- **Seen on the simulator** (iPhone 17 Pro, a copy of Mario's backup): the Progress tab; three chips, the archived
  one with its mark; the dot charts with their totals; Main Lifts with the Deadlift line and its RDL tags; the
  Range Ladder, its tracks and "2 to go"; the journal with week 13 open; the estimator opened, 185 and 5 typed, and
  "Estimated Squat 1RM: 215 lbs — for your reference; the app coaches by RPE." after Squat; the archived bar, the
  trash and the confirmation with its warning, Cancel; Restore and its toast; Delete Forever and its toast. The
  store was saved aside before the two writing taps and put back after each (sha256 `d4a2a8ec…872f11` both
  times). Three things were fixed from the first look and built again before the last: the title's weight, a
  ladder dot clipped at the track's edge, and the number pad's room.
- **Release:** Post-v0.262.4, no build of today's app; on the phone with the next IA Next build once merged. The
  row's second session draws the run cards.

## On Mario's phone, IA Next build 120 (2026-11-18)

- Eight things were put to him: the Progress tab, a chip for each of his three programs, the dot charts, Main Lifts with the Deadlift line, the Range Ladder, the journal's weeks folding, the estimator with the number pad over it, the archived program's bar with its trash and Cancel, and no rest timer on any tab. He was told that Restore and Delete Forever write to the beta's own
  copy only, and that tapping them was his choice. **His report:** "All good!" (no screenshot; he did not say
  whether he tapped either). Nothing differed and no motion was named, so nothing was fixed from it.
