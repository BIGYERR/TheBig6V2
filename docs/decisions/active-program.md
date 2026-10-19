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
