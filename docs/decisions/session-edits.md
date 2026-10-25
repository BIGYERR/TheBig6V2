# Session edits: decisions

What the athlete can change on a session before training it: swap a movement, skip one, add one, and undo each. The
controls are drawn by `buildExItem` and `buildSectionsHTML` (`frontends/app/src/legacy/src/js/set-logging.ts`,
`week-view-sections.ts`) on the single-file page and by `SessionSections` (`frontends/app/src/app/screens/day-detail/`)
in the iOS app; which card carries which control is `exControlFlags`, one source for both. The handlers are in
`swap-sheet.ts` and the stored edits in `swaps-edits.ts`. The V162 control matrix (rulings D0 to D6, in the handoff) is
the history before this file. Tests: `tests/integration/session-edits.test.ts`. Measure:
`tests/measure/workout-skip_controls.ts` and its `.out.txt`.

## D248: P-MAINSKIP, the main lift takes the minus (v0.246.0; amends V162 D0)

- **Date:** reported and ruled 2026-10-25. **Ruled by:** Mario ("yes, minus on main"), on the main session's measure
  (coach hat). **Bump:** MINOR (Mario). **Shipped:** v0.246.0.
- **The report (Mario):** "we cant cancel swap out main lifts or cardio events for our programs, i think we should be
  able to at least skip it in workout".
- **The finding (measure, 865 programs: HALF_MANNY and the 864-config lattice FULL):** 36,276 main slots (item 0 of a
  `/^main/i` section, outside a round), 0 skippable, by V162 D0, whose guarantee was that swap is the top lift's exit.
  44 of them have an empty swap sheet (lowback/protect on home_full and crossfit, vertical pull mains: Chinups 16,
  Assisted pullups 20, Neutral-grip chinups 8, every vertical pull already on the card), so neither control works, and
  the empty sheet's own words ("drop it with the minus and move on") point at a minus that is not there. The only exit
  left was skipping the whole day.
- **What changes:** the main slot carries the minus like every other exercise card. A skipped main lift is the same
  struck-through stub with "Put it back", stored with the day's edits, folded into the snapshot, and its toast is every
  skip's ("<Name> is off today. Tap to put it back."). Notes still carry no control.
- **What deliberately does not change:** no program moves (HALF_MANNY's digest stays). Swap stays on the main slot, and
  the sheet still tags it MAIN LIFT. A skipped main lift logs nothing, so the ledger's slot reading (`_slotOfEntry`) and
  next week's prescription are untouched. The rounds' rules (V162 R2, D1) are untouched.
- **Tests:** a main slot is skippable by `exControlFlags`; HALF_MANNY's main lift card carries the minus on the session
  sheet and skips to the stub, stored for the day; a lowback/protect vertical pull main with an empty swap sheet carries
  the minus.

## D249: P-CARDIOSKIP, the cardio card (open)

- **Date:** measured 2026-10-25, not ruled. **Mario's line:** open to a skip on cardio cards, and asked for ideas: moving
  a session to another day, with a warning when the move conflicts with the rest of the program.
- **The finding (measure):** 48,440 cardio cards on the 865 programs, none with a control; 47,790 on a day that also
  lifts, 650 cardio only. Today the only way to drop the run is to skip the whole day, or to mark it Done without it.

## D250: P-WILDEDIT, the Wildcard's swap and minus act on the Wildcard (v0.246.0)

- **Date:** reported and ruled 2026-10-25. **Ruled by:** Mario ("act on the Wildcard"), on the main session's measure.
  **Bump:** MINOR with D248 (Mario). **Shipped:** v0.246.0.
- **The report (Mario):** "the wildcard workouts the swap button doesnt work".
- **The finding (measure):** a Wildcard's cards are drawn with the session sheet's controls, which address the program
  day the session sheet last pointed at (`activeProg.weeks[currentWeek][currentDayKey]`), by section and item index for
  swap and the round minus, and by name for the minus. On HALF_MANNY, week 1, with the sheet last on each weekday in
  turn, 4,389 swap taps over the 143 Wildcards: 0 open the card tapped; 2,477 toast "Nothing to swap here"; 1,875 open
  the sheet for a program exercise and 37 for a program exercise of the same name, and all 1,912 open under the
  Wildcard (`.overlay` z-index 200 under `.rand-overlay` 300), so the tap looks dead, and a pick there would swap the
  program day's card. Of 3,908 minus taps, 211 strike a same-named exercise off the program day without a word; the
  rest do nothing. The page and the iOS app share it.
- **What changes:**
  - Each draw is copied into the Wildcard's own working day (`_wildDraw`); its cards are drawn from it and their
    controls address it (`'wild'`), never a program day.
  - Swap on a Wildcard card opens the sheet for that card, above the Wildcard. The candidates are the program's kit and
    injury plan against the Wildcard's own cards. A pick changes the Wildcard's card, with the session sheet's toast and
    the SWAPPED IN chip, whose "put it back" restores it.
  - The minus on a Wildcard card, and the round minus, strike it on the Wildcard, with "Put it back".
  - Nothing on the Wildcard writes a swap, a skip, a swap count, a swap nudge or a snapshot to any program day.
  - The edits last for the draw: a reroll, a filter change, or closing the Wildcard starts clean. The pools themselves
    are never changed.
- **What deliberately does not change:** the draw, the pools, Complete (`ia_wild_`), and logging sets on a Wildcard
  card. Measured beside this ruling: all 143 Wildcards carry set logging, which writes to the program day the session
  sheet last pointed at; that is its own ruling, after this build.
- **Tests:** on the Wildcard, a swap opens the sheet for the card tapped (HALF_MANNY week 1, sheet last on Monday, "Max
  Effort Bench", Barbell bench press); a pick changes the Wildcard's card and leaves the program day and the stored
  swaps as they were; the chip's put it back restores the Wildcard's card; the minus and the round minus strike the
  Wildcard's card and leave the program day's same-named card on; closing clears the draw and the pools are unchanged;
  the swap sheet stacks above the Wildcard.
