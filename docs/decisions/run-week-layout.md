# Run week layout: decisions

Which training days carry a run, and which run each one is. The NRC session types come from `getNRCSessionTypes`
(`core/src/engine/nrc-race-bike-swim.ts`); the spacing-aware chooser `_nrcSpacedRunDays` and the type loop in
`buildCardioProgression` (`core/src/engine/cardio-progression.ts`) lay them on the week; `buildNRCSession` prints the
Nike session for each slot. The earlier rulings (D125, D129, D130, D132, D113a, D146 on the pace family; V153 F1, V171
D4, V186 F4 on NRC) are recorded in the handoff and `tests/measure/v205_rulings/` to `v213_rulings/`. Tests:
`tests/integration/run-week-layout.test.ts` and `tests/sweeps/run-week-layout.test.js`.

## D243: one speed day for beginner and intermediate NRC runners, the Tempo when the week has one (v0.243.0)

- **Date:** reported and ruled 2026-10-24. **Ruled by:** Mario (the gate on experience is his; the Tempo pick is the
  coach's recommendation, which he chose over "always the first speed slot"). **Bump:** MINOR (Mario). **Shipped:**
  v0.243.0.
- **The report (Mario):** a 14-week half (intermediate, 18 to 35, Home Full, Strength Support, rest Sunday and
  Wednesday) builds week 9 as Monday intervals, Tuesday legs, Thursday tempo with a heavy hinge, Friday recovery,
  Saturday 10 miles. The athlete cut three runs short and has fried calves.
- **The finding (measure, on v0.242.0):** the week reproduces at that config. Every non-marathon NRC plan deals two
  speed slots at four and five runs, whatever the athlete's experience. Nike's half table puts Intervals in the first
  slot in 13 of 14 weeks (Hills in week 3); every Tempo (weeks 4, 5, 9, 12), every Fartlek and one Hills session sit in
  the second. So dropping the second slot as asked would leave an intermediate half runner with no tempo all block.
- **What changes:**
  1. `getNRCSessionTypes` takes the experience. On the 5K, 10K and half plans an advanced athlete keeps two speed
     slots; everyone else gets one: four runs are speed, recovery, recovery, long; five are speed, recovery, recovery,
     recovery, long. Every caller passes it: the three chooser calls and the type loop. The marathon rows are
     unchanged (one speed day already).
  2. On a layout with one speed slot (no second speed slot dealt, not the marathon), the speed day prints the week's
     Tempo when Nike's week has one, else the first session, as before. This reaches every one-speed layout, the
     three-run one included.
- **What deliberately does not change:** no session text, pace, duration or progression table. Advanced athletes'
  layouts. Race week (one Nike session already). The extra recovery slots take Nike's own recovery durations (the
  keep-longest rule, unchanged; a third slot repeats one). The hinge day still rides the speed day (V189 D36, kept by
  Mario; see `docs/decisions/leg-lift-placement.md`).
- **What it moves (source-surgery copy, before the build):** HALF_MANNY `edde70565043d2db` → `d39ecf0ed37a90e2`, one
  speed day a week on Monday: Intervals, Intervals, Hills, Tempo, Tempo, Intervals, Intervals, Intervals, Tempo,
  Intervals, Intervals, Tempo, Intervals, Intervals. 576 of 864 lattice programs (every beginner and intermediate
  cell; the lattice is Mario's rest days, so every cell runs four days).
- **Expected values (typed by hand from the ruling and Nike's table):** the reported config's week 9 is Monday
  `Speed Run — Tempo`, Tuesday `Recovery Run`, Wednesday rest, Thursday no run, Friday `Recovery Run`, Saturday
  `Long Run`, one speed day. Its fourteen speed days print the types listed above. At five runs (Strength Support, rest
  Wednesday only) the week has one speed day. An advanced athlete on the same config keeps two speed days in week 9,
  Intervals and Tempo.
- **What else moved (every hunk classified as D243's):** `tests/snapshots/program-output.json`: HALF_MANNY (42 of 70
  grid lines) and the 5K beginner (`bbe74a61caeb7949` → `9b40d9fe26b825a5`, 32 of 48); the advanced 10K, the
  marathon and every NSW, bike and swim program are byte-identical. The lattice (`program-output-lattice.json`): 576 of
  864, the 288 beginner and 288 intermediate cells, no advanced cell. HALF_MANNY's week is Monday pull with the speed
  run (D36 kept), Tuesday push with a recovery run, Thursday legs with no run, Friday recovery, Saturday long; his leg
  card is the same in all 14 weeks, on Thursday instead of Tuesday. The counterfactual digests the D195 and deload tests
  pin moved with it: part A without part B `93fd2d1d3a43f192` → `b8a8aabf561bfc44`, part B without part A (and without
  D195) `c17e854e54e86f57` → `895bb404a809927b`, the deload pass off `e7ded15b26998a28` → `e4bff270954cd54b`.
- **A changed card, printed before and after (the D195 beginner cell, shoulder protect, commercial, seed 1234, rest
  Sunday and Wednesday, week 2):** the leg day moved from Tuesday to Thursday and the core block to Monday's pull day,
  so the carry finisher the core had crowded out fits: the card's last block was `Core — Anti-Rotation :: Side plank
  3×30–45 sec each | Plank shoulder taps 3×12 each` and is `Loaded carry finisher :: Farmer carry 3×40 yards, heavy`.
  Every other block is unchanged.
- **Accepted cost:** a Fartlek now prints only for an advanced athlete on these plans (Nike puts every one in the second
  slot). The NRC easy-run ceiling sweep gained an advanced half to keep reaching it.
- **Proof:** the D243 tests in `tests/integration/run-week-layout.test.ts` (the table for every experience, the chooser
  on every one-speed layout, the reported week 9, the Tempo weeks for intermediate and beginner, five runs, three runs)
  fail on v0.242.1, six of six; the advanced guard passes on both. Tests re-pointed to the moved days, each with a D243
  note: `runner-armor-circuit`, `swaps`, `exercise-bench`, `logging`, `compound-tier`, `session-budget`,
  `easy-run-ceiling`; snapshots regenerated: `program-output`, `program-output-lattice`, `compound-tier`, `core-trunk`,
  `deload`.
- **The sweep censuses moved with the lattices' beginner and intermediate race cells** (snapshots regenerated:
  `leg-accessory-trim-order`, `runner-armor-circuit-lattice`, `session-budget-lattice`; typed counts: floor (b) on
  home_full 84 → 88 of 126, still no other tier; the injury lite lattice's W5 sheet rows pat 4613 → 4626, aux 1829 →
  1875, still no rejected name). Blast radius, on 685 sampled configs (every run goal, experience, five foci, four tiers,
  four injury states, random rest days; v0.242.1 against v0.243.0): 322 programs moved, and every one is a 5K, 10K or
  half that had a second speed slot below advanced or a one-speed layout; the one the predicate missed is a knee
  protect 10K beginner, whose runs are all time-matched walks: the walks' minutes moved with the slot underneath, and no
  lift day changed.
