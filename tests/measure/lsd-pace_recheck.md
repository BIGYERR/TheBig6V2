# P-LSDPACE: measure m3, coach r2's P-LSDPACE-6 list on the current tree (v0.240.0), 2026-10-16

MODE     B (before-picture), re-run of m1 and m2's UNKNOWN list after Mario answered r2's three calls.
METHOD   `tests/measure/lsd-pace_recount.js` (output `lsd-pace_recount.out.txt`): r1's lattice, 960 builds, 0 crashes,
         16,492 NSW LSD cards (9,424 long), 240 default-anchor builds, HALF_MANNY. Oracle: PACE_CHART's mile to recovery
         rows typed by hand (r1's table); the engine's own `paceChartLookup('mile', anchor)` agrees with it within 1 s on
         960/960 builds and is the number a build would read.
         `tests/measure/lsd-pace_time-only.ts` (output `lsd-pace_time-only.out.txt`): the day card driven through
         `tests/support/log-form.ts` (the app's own openDayKey, wheels, Log and readers on a virtual clock), W1 of 8 host
         programs, every run day with a `dist` or `time` dose (22 days). Oracle: hand arithmetic (36:00 over 3 mi is
         12:00/mi; 3.00 mi over a 25 min plan is 8:20/mi). The page is `dist-github-pages/index.html`, byte-equal to the
         root copy, ia-version 0.240.0.

## (c) The NSW LSD card and its numbers
- What prints: "Recovery Pace: m:ss/mi" 16,492/16,492, "(Zone 2)" 16,492/16,492, "max HR" 16,492/16,492; `dose.tgt` on
  16,492/16,492 (unchanged from m1 on V237).
- `dose.tgt` against the athlete's own mile row: faster 6,916, equal 1,148, slower 8,428 (of 16,492); faster by 1 to 4
  s/mi on 2,800, 5 to 9 on 1,596, 10 to 19 on 2,100, 20 or more on 420; at most 28 s/mi. Every pace-family goal walks,
  not only `run_pace_goal`: faster on 2,100/6,412 (1.5 mi pace goal), 1,792/2,688 (1 mi pace goal), 1,512/3,696
  (`run_mile_time`), 1,512/3,696 (`run_15_under10`). (m1's split was 6,356 / 2,324 / 7,812 on V237.)
- Long-run tier with `tgt` on the own row (r2 P-LSDPACE-4): 120 of 9,424 long cards move, 40 B to A and 80 B to C
  (r1 counted 120 on V237). r2's example reproduces: pace 1.5 mi 12:00, intermediate, mile 9:00, W10 SAT 6.6 mi,
  11:20 to 11:35, tier B to A. PRT STAND (seed 24865, mile 8:15, 1.5 mi in 11:00): 11 long runs, 0 tier moves.
- The hero's time estimate (`sessionTimeEst`, `week-view-sections.ts:162`, read only by the This Week hero at
  `:654`, not by the engine), rounded to 5 min, sections held as they are: with the pace gone from the detail and
  today's code, it changes on 13,469/16,492 LSD days (it falls to miles x 10 min/mi; deltas from -25 to +10 min, most
  -5 to -15); read off the dose with the own-row `tgt` (r2's rule), it changes on 1,980/16,492, by 5 min either way.

## (d) The D189 default-anchor note
- 240 default-anchor builds: the note sits on an LSD card in 0, on another W1 run in 240, on none in 0. Removing the
  pace from LSD details moves it nowhere and loses it nowhere on this lattice. Not covered: programs with one or two run
  days whose W1 runs are all LSD (r2's `:5504-5506` case); none on the lattice.

## (e) HALF_MANNY
- Digest `2d35e8f743680cfa`, twice-equal, equal to `tests/snapshots/program-output.json`. 0 NSW LSD cards of its 56 runs.
- Snapshots: `program-output.json` holds 2 NSW test-goal programs of 10 ("1.5 mile test goal, minimal, fat loss,
  beginner"; "1.5 mile test goal, commercial, balanced"); the 864-config lattice is HALF_MANNY's (NRC), 0 NSW LSD.

## (a) and (b) What a run entry stores from an untouched fixed wheel (22 days, 8 hosts)
- **Dist form, time only (0:36:00), 10 of 10 days** (NSW LSD long and easy on the 1.5 mi pace goal, the mile goal, the
  1.5 mi under 10 goal and PRT STAND; NRC long runs on HALF_MANNY, the 10K and the 5K): stores `run_dist` = the plan as
  `String(dose.mi)` ("3", "2.1", "3.1", "1") and `run_pace` from those miles; `cardioEntryLive` true; the week's MILES
  tile, Progress W1 mileage, `plannedVsLogged` W1 `act` and `ladderWeekly` W1 all equal the plan's miles. Strip before the
  log: `Run — LSD · Planned 3 mi @ 11:17/mi`; readout `12:00/mi assuming planned 3 mi · 43s/mi slower than target`.
- **Time form, miles only (3.00), 12 of 12 days** (NSW Long Interval `chi` on the four NSW hosts, NRC Recovery Run on
  HALF_MANNY, the 10K and the 5K, `run_base` Easy Run and Benchmark Run): stores `run_dist` "3.00", `run_mins` "" and
  `run_pace` computed from the plan's minutes (HALF_MANNY fri: 25 min, 8:20/mi). **Not in r2's list:** on an NRC
  Recovery Run that pace is a qualifying `_recoveryPaceEntry` (`{w:1, sec:500, tgt:800}` on HALF_MANNY), so it is drawn
  on the recovery pace chart (`recoveryPaceWeekly` W1 500 s) and counts toward `seedFromPriorPrograms`' recovery
  average, which seeds the next program's mile (`_mileFromRecoverySec`; the seed needs `SEED_MIN_RUNS` such entries,
  so one log returned null here). On the NSW Long Interval it lands in `runsByClass` Tempo (300 s); on `run_base` Easy in
  `runsByClass` Easy (500 s).
- **The plan face and the stamp are one mechanism.** A fixed wheel opens on the plan's face over an empty hidden node
  (D202); settling on the plan writes nothing, and only a roll away and back stores the plan's own value
  (`tests/integration/logging.test.ts:367`, green on this tree). The stamp is what turns an untouched plan face into a
  stored value today. With the stamp gone and the plan face kept, a run done exactly as prescribed stores its prescribed
  dimension only through that away-and-back roll, and the readout r2 wrote, `Pace — derived · enter miles`, prints under
  a wheel that reads 3.00.
- `seedFromPriorPrograms` reads `run_dist` for `maxDist` (`progress-data.ts:66`), so a stamped plan reaches the next
  program's longest-run seed once the seed qualifies (code read; not driven to a qualifying seed).

## (f) Tests that read what the ruling changes
- `tests/integration/logging.test.ts`: the stamp is pinned on HALF_MANNY's W1 SAT NRC long run by the tests at :407,
  :529 (also the time form's pace from the planned 25 min), :597, :657, :680, :722, :739 and :786, and "assuming
  planned" appears 5 times. They change only if the stamp goes on NRC doses.
- "Zone 2" in 0 test files; "max HR" in `cardio-sessions` only for the SI and LI zone notes; "Recovery Pace" in
  `progress-charts.test.ts` only as the chart title. `tests/unit/pace-delta.test.ts` (29) pins D40's delta form where a
  target still prints. The D189 tests (`mile-anchor`, `mile-pencil`, `pace-wizard`) never put the note on an LSD (0/240).
- `tests/snapshots/program-output.json`: the 2 NSW test-goal programs move (card copy, and tiers where the own row moves
  one); HALF_MANNY and the 864 lattice do not.

ROOT     The card: `core/src/engine/nsw-cardio.ts:964` (`lsd_long`) and `:1003` (`lsd_easy`). The stamp:
         `doseDerived` (`frontends/app/src/legacy/src/js/log-entries.ts:258-266`: `useD = dist>0 ? dist : dose.mi`,
         `useM = mins>0 ? mins : dose.mins`) written by `persistLogFields` (`day-status.ts:218-222`). The plan face:
         `wheel-log.ts:279-284` and the Angular `cardio-fields-model.ts:155`.
SPREAD   Readers of the stamped `run_dist`: week MILES, Progress mileage, `plannedVsLogged`, `ladderWeekly`,
         `seedFromPriorPrograms.maxDist`. Readers of a pace derived from planned minutes: `recoveryPaceWeekly`,
         `_recoveryPaceEntry` (the chart and the next program's seed), `runsByClass`.
UNKNOWN  A seed driven to `SEED_MIN_RUNS` entries; the journal render of a stamped entry; the Angular form's own
         readout copy; one or two run-day programs for (d); sweeps beyond W1.
