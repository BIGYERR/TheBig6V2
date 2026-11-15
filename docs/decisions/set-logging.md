# Set logging: decisions

What an exercise card logs and how it labels it: the set rows, the load field, the reuse pill and its stale warning,
drawn by `buildExItem` (`frontends/app/src/legacy/src/js/set-logging.ts`) on the single-file page and by
`exItemView` (`frontends/app/src/app/screens/day-detail/session-sections-model.ts`) in the iOS app; the pill's text
after a log is rewritten in place by `day-detail.ts`. What a line logs is `parseRx` (`docs/decisions/supersets.md`,
D253). Tests: `tests/integration/session-sheet.test.ts`, `frontends/app/test/unit/session-sections.test.ts`.

## D257: P-KBUNIT, a kettlebell weighs in the program's unit (v0.249.0)

- **Date:** reported and ruled 2026-10-26. **Ruled by:** the main session (a copy defect), Mario not objecting when it
  was put in the batch. **Bump:** MINOR, v0.249.0 (Mario, the batch). **Shipped:** v0.249.0.
- **The report (Mario's screenshots, two of them):** the Spanish squat hold (KB) and Kettlebell single-arm row cards
  read "LOAD … LB" and "25 lb earlier today" while every other loaded card reads "LBS".
- **The finding:** every kettlebell card on a pounds program prints "lb": the load field, each set's unit, the reuse
  pill, the fill pill and the stale warning (`buildExItem`, `exItemView`), and the pill rewritten after a log
  (`day-detail.ts`). A kilogram program prints "kg" either way.
- **What changes:** a kettlebell card prints the program's unit, as every other loaded card does: "lbs" or "kg".
- **What deliberately does not change:** the stored loads (always pounds), the kilogram display, the load steps, and
  `buildKBChips` (bell-size chips), which nothing calls.
- **Expected values:** Kettlebell single-arm row on a pounds program: `<span class="ex-wunit">lbs</span>` and no
  "lb" label; on a kilogram program, "kg"; the iOS app draws the same card; `exItemView` in pounds gives each set and
  the load field "lbs".
- **Tests:** `tests/integration/session-sheet.test.ts` (both builders, both units) and
  `frontends/app/test/unit/session-sections.test.ts`.

## D290: P-OWNROWS, Log stores a move's own sets and no other move's

- **Date:** found, measured and ruled 2026-11-14. **Ruled by:** the main session (a defect: no doctrine is in play,
  a move's entry holds that move's sets), built on Mario's word when it was put to him as a task of its own ("Do
  this task here"). **Bump:** to be asked before the edit. **Shipped:** not yet.
- **How it was found:** not reported. The React Native migration's measure of the swipe deck's logging
  (`tests/measure/native-deck-logging_writes.md`, section C) read how `saveExWeight` finds a move's rows, and counted
  the days where that reaches further than the move.
- **The finding (`tests/measure/set-logging_shared-rows.md`):** `saveExWeight` (`day-detail.ts`) read a move's rep
  rows with `input[id^="exset_<key>_"]`. A row's id is `exset_<key>_<set>`, so that also matches every row of a move
  whose key is `<key>_<more>`, and the session sheet and the swipe deck both hold every card of the day on the page
  at once. Proved at the seed, on the page, with every card's fields placed as the template draws them (the
  bodyweight run base program of `tests/support/programs.ts`, week 4, Monday, Legs): Split squat (3 sets, typed 8, 8,
  7) beside Split-squat heel-raise hold (2×30 sec each, typed 31, 32). Log on Split squat stored `setsDone
  [8,8,7,31,32]`, five sets for a move of three, and its card then read "8 / 8 / 7 / 31 / 32", Varied. The hold's own
  Log stored `[31,32]`: the longer key is nobody's start. A set stepped after Log goes the same way
  (`commitSetsLive` ends in `saveExWeight`).
- **How often:** on the shared lattice (864 programs over HALF_MANNY, 60,480 training days) 285 days in 85 programs
  hold such a pair, four pairs in all: Pike pushups beside Pike pushups (feet elevated) on 168 days, Split squat
  beside Split-squat heel-raise hold on 66, Single-leg hip thrust beside its shoulders on bed version on 29, Side
  plank beside Side plank (top leg raised) on 22. HALF_MANNY as built: 0 of 70 days. The ten seeded programs: 5 of
  551 days, all in the bodyweight run base program. A program as built holds no swap and no added move; either can
  make a pair on the phone that the build did not.
- **Who else reads the rows that way:** nobody. It is the only `[id^=` in `frontends/app/src`, `frontends/native/src`
  and `core/src`. `setRepVals`, `setWeightVals` and `rawSetVals` (`set-logging.ts`) walk `exset_<key>_<set>` one id
  at a time until none answers, so the draft and the summary were always the move's own. Readers of the stored
  sets: the card's summary and its Varied mark (all of them, so the line was wrong), the lift ledger on Progress,
  and the chart's "best set" line, which takes the largest stored number. The range nudge and the test-lift card
  read only the first sets the prescription names.
- **What changes:** `saveExWeight` reads the move's rep rows through `setRepVals`, one id at a time, with the same
  rule for a blank row (its placeholder, else 0). A move's entry holds as many sets as the move has rows.
- **What deliberately does not change:** what is stored for a move whose key starts no other's on the day, to the
  byte, so every golden record of stored state stays identical; the load, the top-set rule, the draft, the toast.
  **Entries already stored with another move's sets are left as they are**: nothing can tell an extra set from a
  set the athlete added by hand without the day's prescription, and the phone's data is the only copy. Such an
  entry keeps reading its long line on its day; a Log on that day rewrites that day's entry in place with the
  move's own sets (`recordLift` replaces the entry of the same week and day). Program output does not move.
- **In the Expo app:** the deck's logging is not built yet (it is this chat's next piece). It is built to this rule
  from the start, under this D-code.
- **Expected values (typed by hand):** on that day, with 8, 8, 7 in Split squat's rows and 31, 32 in the hold's, Log
  on Split squat stores `setsDone [8,8,7]`; Log on the hold stores `[31,32]`; Split squat's card then reads
  "8 / 8 / 7".
