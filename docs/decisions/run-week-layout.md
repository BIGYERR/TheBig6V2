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

## D244: rest into the long run, ranked third on the NRC arm (v0.244.0)

- **Date:** ruled 2026-10-24. **Ruled by:** Mario (the key below, confirmed: "Yes, Monday"). **Bump:** MINOR (Mario).
  **Shipped:** v0.244.0.
- **The brief (Mario):** in `_nrcSpacedRunDays` the `qualRest` term (V205 D129 addendum, rank 8: the distance back from
  the long run to the week's last quality session) was gated to the pace family. Ungate it for NRC goals and move it
  above speeds-after-rest and the recovery run padding the long; keep the collision terms and the long-run pin first.
  He expected the reported calendar to land its quality session on Tuesday.
- **The finding (measure, before the ruling):** on the reported calendar (rest Sunday and Wednesday) the new key keeps
  the one speed day on Monday: Monday sits five days back from the Saturday long run and Tuesday four, and Monday also
  follows the rest day. Mario took Monday. With two speed days nothing moves there either: the furthest the later one
  can sit without a collision is Thursday.
- **What changes:** the NRC arm's rank key is `[-untol, -tol, longLast, qualRest, speedsAfterRest, recBeforeLong,
  canonical, identity, spread, qualFirst]`. The key is split by arm: the pace family keeps its D129 order byte for byte.
  All four NRC goals take it, the marathon included.
- **What deliberately does not change:** the long-run pins, the collision terms, the NRC easy-run predicate
  (`recBeforeLong` still reads the shipped lens; V205 D129 left it unruled on NRC), the types dealt (D243), any session
  text, and the pace family.
- **What it moves (`tests/measure/nrc-layout_rest-calendars.js`, v0.243.0 against v0.244.0, report saved beside it):**
  18 of 384 rest-day calendar rows on run_half (every calendar, three experiences, Strength Support everywhere and
  Athletic Support at six and seven days): 4 of 21 five-day calendars for beginner and for intermediate, 2 of 7 six-day
  ones for each at both foci, and 2 of 21 five-day ones for advanced. HALF_MANNY and the 864-cell lattice do not move
  (Mario's rest days already have the furthest-back day). In `program-output.json` one program moves, the marathon
  (Athletic Support, 36 to 45, rest Monday and Thursday): its speed day goes from Friday, two days before the Sunday long
  run, to Tuesday, five days before; its pull day follows it (D36). On 685 sampled configs only 10K and half programs
  moved (48), no pace, base, 5K or marathon one in the sample.
- **Expected values (typed by hand: the long run pinned to the last training day, no quality day beside it, the
  furthest back wins):** rest Wednesday only, intermediate, five runs: week 9 is Monday recovery, Tuesday `Speed Run —
  Tempo`, Thursday and Friday recovery, Saturday lift only, Sunday long (before: the speed day on Thursday). Advanced,
  rest Thursday and Friday: every layout pays one hard pair, and the speed days move from Tuesday and Saturday (the long
  run's eve) to Monday Intervals and Wednesday Tempo, four days back.
- **Proof:** the two D244 calendar tests, the split key in the source and the oracle's NRC objective (now ranking
  `qualRest` third) in `tests/integration/run-week-layout.test.ts` fail on v0.243.0, six tests in all; the identity
  census (445/357/228/129 → 373/262/184/78) and the excluded-week census (112 → 116 of 116) moved with the key.

## D251: a session Nike names as a tempo is the week's tempo (v0.247.0; amends D243)

- **Date:** reported and ruled 2026-10-25. **Ruled by:** Mario ("yeah we gotta fix this! this is for users man").
  **Bump:** MINOR (Mario; it changes what a program prescribes, and v0.246.0 was taken by another chat). **Shipped:**
  v0.247.0.
- **The report (Mario, Week 10 Monday on his phone):** the card printed Nike's "3 rounds of 5K → 10K → Mile, 13:30 of
  work"; he expected the longer tempo session.
- **The finding:** D243's pick reads the session's type only. Nike's half week 10 has two sessions typed Intervals, and
  the second is "5K reps around a 10:00 tempo — 22:00 of work", a tempo block between two sets of 5K reps. It is the only
  session in the 5K, 10K and half tables that names a tempo without the Tempo type in a week with no Tempo-typed session
  (10K week 4 names one too, but that week has a Tempo-typed session, which still wins).
- **What changes:** on a one-speed layout (D243's reach), when Nike's week has no Tempo-typed session, a session whose
  headline (the detail's first line) names a tempo is the one that prints. The card keeps Nike's type and text
  (`Speed Run — Intervals`).
- **What deliberately does not change:** every week with a Tempo-typed session, every two-speed layout, the marathon,
  every session text and table, and every week but half week 10.
- **What it moves (source-surgery copy of v0.246.0, before the build):** HALF_MANNY `d39ecf0ed37a90e2` →
  `59b6261ed32c79c6`, his week 10 Monday only (13:30 of intervals → the 22:00 tempo session); 216 of 864 lattice
  programs, every one in week 10 alone.
- **Expected values (typed from Nike's table):** the reported half (intermediate, rest Sunday and Wednesday) prints week
  10 Monday as `5K reps around a 10:00 tempo — 22:00 of work`, typed Intervals; every other week's speed day is unchanged;
  an advanced athlete keeps both sessions.

## D252: the one speed day prints the longer of Nike's two sessions (v0.248.0; amends D243, retires D251's name read)

- **Date:** ruled 2026-10-25. **Ruled by:** Mario ("it should be the longer of the two! ... a longer session better
  represents what you need for a half marathon and marathon or even a 10k"), with a fresh coach's concurrence, which
  Mario concurred with ("concur" on the rule, the bump and holding the pull request). **Bump:** MINOR (Mario).
  **Shipped:** v0.248.0.
- **Coach, in his own words:** "On one speed day a week, that day has to carry the week's main stimulus. For a half
  marathoner or a 10K runner that is the session with the most time at quality pace. ... Week 12 is the one week where
  longer and tempo disagree, and I still say longer. Nike cut that week's long run to sixty easy minutes and put the
  biggest speed session of the plan beside it. That is the classic shape three weeks out: volume down, quality up, last
  big workout, then two taper weeks. ... The cutback is the long run, not the speed day. Call: ship the longer session,
  measured by Nike's stated work time, no exceptions, tempo wins only a tie."
- **The finding (measured on v0.247.0):** Nike frames the two weekly speed runs as one menu and ranks neither. Across the
  5K, 10K and half tables (27 two-session weeks) the Tempo-typed session is the longer one in 4 of the 5 weeks that have
  one (the exception is half week 12: 42:00 of intervals against a 15:00 progression tempo), and D251's named-tempo week
  (half 10) is the longer too. "Longer" keeps what D243 wanted and reads neither a type nor a name.
- **What changes:** on a one-speed layout on the 5K, 10K and half (beginners and intermediates on every calendar, and
  every athlete at three runs a week, where D243 already dealt one speed slot), the speed day prints the session with
  the greater work. Work is read from Nike's own text at pick time: the time its headline
  states (`N:NN of work`, then `N:NN fartlek`, then `N:NN tempo` or `progression tempo`); a hill session's uphill
  efforts summed over its rounds; a distance tempo (`8K tempo`) at the athlete's chart tempo pace. A tie goes to the
  Tempo-typed session, else Nike's first; no tie exists in the tables today. The D243 type read and the D251 name read
  are deleted.
- **One departure from coach's builder notes, the main session's:** coach proposed a typed `work` number on every table
  row. The tables stay untouched (Mario's standing brief: never touch the NRC session content tables), so the same
  numbers are read from the text, and a test holds them against hand-typed values.
- **What deliberately does not change:** every session text, type label and table; the marathon; every advanced
  (two-speed) layout; race week; the recovery durations; the hinge on the speed day (D36).
- **Accepted cost:** no one-speed athlete on these plans runs a hill session (every hill session, 5:00 to 6:45 of
  efforts, is shorter than the other session that week); the advanced athlete keeps them. Half week 12 goes from 25:00
  of work the week before to 42:00, beside Nike's 60-minute cutback long run.
- **What it moves:** half weeks 1, 2, 3, 7 and 12; 10K week 1; 5K weeks 1, 2, 3, 4 and 7 (11 of 27 weeks). HALF_MANNY
  `59b6261ed32c79c6` → `b04eeaee9fe1ef46`, the digest coach printed from a source-surgery copy before the build; the
  build equals it. Blast radius on 689 configs (every run goal in turn, three experiences, four foci and tiers, random
  rest days, a quarter injured; v0.247.0 against v0.248.0): 80 moved, every one a 5K, 10K or half, every change in the
  ruled weeks; the 3 advanced ones are three-run calendars; no pace, base or marathon program moved.
- **Expected values (typed from Nike's table), the half's one speed day by week:** 21:00 fartlek; 15:00 of reps with a
  Mile-pace kicker; 3 × 7:00 at 5K Pace (21:00); 25:00 tempo; 23:00 progression tempo; 20 × 0:30 at Mile Pace (10:00);
  the 22:00 power pyramid; 10 × 2:00 at 5K Pace (20:00); the 8K tempo; 5K reps around a 10:00 tempo (22:00); 5 × 5:00
  at 10K Pace (25:00); 3 rounds of 10K → 5K → Mile (42:00); 3 rounds of a 5K rep and four Mile-pace bursts (15:00); the
  race-week sharpener.
