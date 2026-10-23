# Group 12: run week layout and the long-run day

Phase 2 parity for eleven gates, 214 manifest rows (`tests/row_manifest.txt`). The legacy gates stay in place and keep
running in CI until phase 3 deletes the legacy suite; this file is the record that every row is held by a feature
test or dropped for a written reason (`docs/test-migration.md`, The parity rule).

The new tests assert what the app does today (0.239.1). Every version arm of a gate (`VER >= 205` and the other
licences, the D103a card name eras, the D113a three-run row, D187's minutes from 225, D188's carry case from 226) is
ported at its current arm and the older arms are not. The hand oracles are ported as typed: the circular week, the
D130 split, the chooser's ten ranks, the D36 cost table, the tiers by time on feet, the hinge list, the set count,
the stand-in's grid, the notes, the V115 crossover, the 14 and the 7 named calendars.

New files:

- `tests/integration/run-week-layout.test.ts` (41 tests, 3.2 to 5.1 s at load averages of 30 to 40): the run day chooser lifted
  out of the app and scored against an exhaustive search on every routed row (it builds nothing), the source pins,
  the four-run ceiling and the built week on one seed of the 64 calendars, the walking week, the three-run pace week,
  and samples of the D113a and D146 lattices.
- `tests/integration/leg-lift-placement.test.ts` (12 tests, 1.5 to 1.9 s): where the hinge and squat days go around
  the run week: the pace family by the D36 table, run_base by its own run week, the test eve, the lift-free note.
- `tests/integration/long-run-day.test.ts` (12 tests, 2.3 to 3.6 s): the stand-in's grid, the carry
  case, the hinge list, and samples of the D140, D153 and D156 lattices.
- `tests/sweeps/run-week-layout.test.ts` (12 tests, 45 to 58 s, CI only), `tests/sweeps/leg-lift-placement.test.ts`
  (5 tests, 11 to 14 s), `tests/sweeps/long-run-day.test.ts` (5 tests, 54 to 75 s): every lattice whole, every seed.
- `tests/snapshots/run-week-layout.json`: the current golden values the sweep compares: the 11 NRC run card names the
  D146 lattice prints, and the day by day sport layout of every multi-sport week under the four excluded injury modes
  (348 pace cells, 232 NRC cells). Both were checked once, on 2026-10-11, against the build the D113a and D146 rulings
  named as their oracle, V212 (`169537c`): the 11 names are the set V212 prints on the same lattice, and 580 of 580
  layouts equal V212's.
- `tests/support/run-week-layout.ts`, `tests/support/leg-lift-placement.ts`, `tests/support/long-run-day.ts`: the
  app booted once with its clock pinned (2026-10-11 12:00 local, as `program-output.test.js` pins it), the source
  surgery that lifts the chooser, the hand oracles, the configs and lattices, the tallies the integration files and the
  sweeps share.

The group's map names two files, `run-week-layout.test.js` and `long-run-day.test.js`. The placement rows of
`g205_pace_eve.js` and `g208_d104a_runbase.js` went to a third, `leg-lift-placement.test.js`, so that each file runs
in a few seconds and is one feature: which days carry the runs, which days carry the leg lifts, and what the long run's
own day prescribes.

Totals: **214 rows: 209 mapped, 5 dropped** (4 HALF_MANNY digest rows, held by
`tests/integration/program-output.test.js`; 1 era-row existence check).

Licence rows (`P0` of four gates, `W0`) checked two things: the version, and that the ruling's code is in the file.
The version conjunct is dropped; the presence is held by the source test named for each.

In each table the first mapped row names the integration file; › "name" on the rows after it is a test in that file,
and "sweep" means the same feature's file in `tests/sweeps/`.

## `g205_d125_ceiling.js` (19 rows: 19 mapped)

| Row | Held by |
|---|---|
| `E1` | `tests/integration/run-week-layout.test.ts` › "every NSW run card names its quality the way its dose key does: Short Interval (SI) is int, Long Interval (LI) is chi"; sweep › "64 calendars on three seeds, every week: 6,336 hard run pairs and none untolerated; a tolerated pair only on the 14, and every run card names its key" |
| `P0` | › "the pace family runs up to four days a week; a walking week or a second sport holds it at three; run_base and NRC keep four"; › "the source: the pace ceiling drops to three only on an untolerated pick, and the rank key is the ruled order, split on the pace family only" |
| `P1` | › "the pace family runs up to four days a week; a walking week or a second sport holds it at three; run_base and NRC keep four" (the literal inside `SPORT_CEILINGS`, and `sportDayTargets` dealing four) |
| `P2` | › "four runs ship exactly where an exhaustive search reaches zero untolerated pairs at four: all 64 calendars (35, 21, 7, 1 by training days)" |
| `P3` | the same test (35 of 35, 21 of 21, 7 of 7, 1 of 1) |
| `P3e` | the same test |
| `P3f` | › "nothing falls back to three, and the 14 named calendars are exactly the ones whose four-run floor is one tolerated pair" |
| `P4` | › "no built pace week carries an untolerated hard pair; the 14 pay one tolerated CHI eve every week and the 50 never do; every week carries four runs" (seed 1001, 2,112 pairs); sweep › "64 calendars on three seeds, every week: 6,336 hard run pairs and none untolerated; a tolerated pair only on the 14, and every run card names its key" |
| `P4b` | the same two tests |
| `P5` | › "Mario's calendar builds MON INT, THU CHI, FRI easy, SAT long, keeps TUE a run-free training day, and never lifts heavy on the long run's eve" |
| `P5b` | the same test |
| `P5c` | the same test |
| `P6` | › "no built pace week carries an untolerated hard pair; the 14 pay one tolerated CHI eve every week and the 50 never do; every week carries four runs" (the 14 on seed 1001); sweep › "the 14 on three seeds: four runs in every one of 462 weeks, each paying exactly one tolerated CHI eve and nothing untolerated" |
| `P6b` | the same two tests |
| `P6c` | › "the three-run week lives on in multi-sport pace: with a bike, every other calendar, each three-run week free of untolerated pairs" (15 of 32); sweep › "multi-sport pace reaches the three-run week on 29 of 64 calendars with a bike and 29 with a swim, each free of untolerated pairs" |
| `P6d` | the same two tests |
| `P7` | › "on Mario's calendar a multi-sport pace week holds three runs, run_base keeps four with no INT, and the two pace aliases take four" |
| `P7b` | the same test |
| `P7c` | the same test |

## `g205_d125_spaced.js` (23 rows: 23 mapped)

| Row | Held by |
|---|---|
| `E1` | `tests/integration/run-week-layout.test.ts` › "every NSW run card names its quality the way its dose key does: Short Interval (SI) is int, Long Interval (LI) is chi"; sweep › "64 calendars on three seeds, every week: 6,336 hard run pairs and none untolerated; a tolerated pair only on the 14, and every run card names its key" |
| `P0` | › "the source: PACE_GOALS is the three pace ids, the pace gate takes the whole week and NRC stays strictly below it, and every other goal keeps the even spread" |
| `P0b` | › "the run day chooser and its session tables lift out of the app and run alone"; › "the NSW run table is Table 7 as the pace family deals it, and the NRC table is one speed day for the marathon, two for every other plan" |
| `P1` | › "every routed pace layout is a maximum of the full ruled objective, over every subset and every order of its types". The gate's 157 rows (zero to three rest days, ceilings 2 to 4 below the week) are among the test's 283 (zero to five rest days, ceilings at or below the week), scored on all ten ranks, which order every layout the gate's six did |
| `P2` | › "the unsplit search space at four runs: 50 of 64 calendars reach zero pairs (21/35, 21/21, 7/7, 1/1); the 14 that do not are four-day calendars one pair short" |
| `P2b` | the same test |
| `P3` | › "the long run pin: pinned, 19 of 35 four-day and 18 of 21 five-day calendars reach zero; relaxing it rescues the five ruled calendars, the subset half alone none, the permutation half two" |
| `P3b` | the same test |
| `P3c` | the same test |
| `P3d` | the same test |
| `P4` | › "Mario's calendar (rest Sunday and Wednesday) at four runs: MON INT, THU CHI, FRI easy, SAT long, clean, ranked 0,1,2,1,1, longest gap 2" |
| `P5` | › "NRC keeps both long run pins: on every NRC layout the long run is the last training day, and the pace family uses the escape" (660 rows) |
| `P5b` | the same test |
| `P6` | › "the source: PACE_GOALS is the three pace ids, the pace gate takes the whole week and NRC stays strictly below it, and every other goal keeps the even spread" |
| `P6b` | the same test |
| `P6c` | the same test |
| `P7` | › "no built pace week carries an untolerated hard pair; the 14 pay one tolerated CHI eve every week and the 50 never do; every week carries four runs" (seed 1001 is the gate's population, 704 weeks) |
| `P7b` | the same test |
| `P8` | › "the first week of every capped calendar is a maximum of the ruled objective (29 capped, 35 with the day set forced)" |
| `P8b` | › "the source: PACE_GOALS is the three pace ids, the pace gate takes the whole week and NRC stays strictly below it, and every other goal keeps the even spread" (the NSW type loop's `_planned` line) |
| `P8c` | › "at three runs a mid-week long run ships only where every long-last layout ranks below it (7 of 64 calendars)" |
| `P9` | › "run_base on Mario's calendar ends its week on the long run and carries no INT or CHI" |
| `P9b` | the same test |

## `g205_d129_tiebreak.js` (21 rows: 21 mapped)

| Row | Held by |
|---|---|
| `P0` | `tests/integration/run-week-layout.test.ts` › "the source: the pace ceiling drops to three only on an untolerated pick, and the rank key is the ruled order, split on the pace family only" (the rank key ends identity, spread, rest into the long run, earliest quality; identity reads `_evenKey`) |
| `P0b` | › "the run day chooser and its session tables lift out of the app and run alone" |
| `P1` | › "every routed pace layout is a maximum of the full ruled objective, over every subset and every order of its types" (the gate's 93 rows are among its 283) |
| `P1b` | › "the day after the long run is never credited as padding it: no pick keeps a day-after easy run over a true eve" |
| `P2` | › "every NRC layout is a maximum of its five ruled terms, with the shipped easy run predicate, and carries untol equal to coll" (804 rows) |
| `P2c-decl` | › "identity is pace family only: NRC declines the even spread subset on 129 of the 357 five-term ties it is offered" |
| `P2c-pop` | the same test (445 multi-subset ties, 357 offered) |
| `P3` | › "identity: where the even spread subset ties at the top of the ruled terms, the pace family keeps it (37 rows)" |
| `P4` | › "spread: among ties without the even spread subset, the pace family takes the tightest week (56 rows)" |
| `P5-free` | › "Mario's calendar (rest Sunday and Wednesday) at four runs: MON INT, THU CHI, FRI easy, SAT long, clean, ranked 0,1,2,1,1, longest gap 2" |
| `P5-layout` | the same test |
| `P5-rank` | the same test |
| `P6` | › "the eve correction moves 24 of the 93 pace rows on the type set D129 was ruled on" |
| `P7-hard` | › "ties after rank 9: 2 of 93 rows, both spanning two day sets with the hard days in place; rank 8 breaks 5 and rank 9 breaks 2 of the 9 left at rank 7" |
| `P7-r8` | the same test |
| `P7-r9` | the same test |
| `P7-resid` | the same test |
| `P7-span` | the same test |
| `P7-sum` | the same test |
| `P8-layout` | › "rest Friday at four runs: MON INT, WED CHI, THU easy, SAT long, with three days from the last quality day into the long run" |
| `P8-rest` | the same test |

`P6` and `P7` score the type set D129 was ruled on (easy, INT, long at three runs), typed by hand; the table test
holds that the app still deals that row where the pace flag is off.

## `g205_d130_typed.js` (24 rows: 24 mapped)

| Row | Held by |
|---|---|
| `D0` | `tests/integration/run-week-layout.test.ts` › "the NSW run table is Table 7 as the pace family deals it, and the NRC table is one speed day for the marathon, two for every other plan" |
| `D1` | › "at four runs on all 64 calendars: no untolerated pair; the 14 pay exactly one tolerated CHI eve, the 50 none and equal the unsplit winner; four of the 14 move the long run off the last day, as ruled" |
| `D2` | the same test |
| `D3` | the same test (the pick is the first maximum of the split objective), and › "every routed pace layout is a maximum of the full ruled objective, over every subset and every order of its types" |
| `D4` | the same test |
| `D5` | the same test |
| `D6` | the same test |
| `D7` | the same test |
| `D8` | the same test |
| `D8b` | the same test |
| `D9` | › "Mario's calendar (rest Sunday and Wednesday) at four runs: MON INT, THU CHI, FRI easy, SAT long, clean, ranked 0,1,2,1,1, longest gap 2" |
| `D10` | › "the source: the pace ceiling drops to three only on an untolerated pick, and the rank key is the ruled order, split on the pace family only" |
| `D10b` | the same test |
| `D10c` | the same test |
| `D10d` | the same test |
| `D11` | › "every NRC layout is a maximum of its five ruled terms, with the shipped easy run predicate, and carries untol equal to coll" (the gate's 252 rows are among its 804) |
| `D12` | sweep › "64 calendars on nine seeds, every week (6,336): four runs, no untolerated pair, the tolerated pair on all 99 weeks of each of the 14 (1,386) and none of the 50, no leg day on the long run or its eve, and every run card names its key"; › "no built pace week carries an untolerated hard pair; the 14 pay one tolerated CHI eve every week and the 50 never do; every week carries four runs" (seed 1001, 704 weeks) |
| `D12b` | the same two tests |
| `D12c` | the same two tests |
| `D12d` | the same two tests (1,386 weeks on nine seeds; on seed 1001 each of the 14 on all 11 weeks) |
| `D12e` | the same two tests |
| `D12f` | the same two tests |
| `D12g` | the same sweep test; `tests/integration/leg-lift-placement.test.ts` › "no leg role lands on the long run's eve at four, five, six or seven training days, nor on the long run itself, in a lattice where a hit was possible in more than 200 weeks" (the same config, seed 1001) |
| `E1` | › "every NSW run card names its quality the way its dose key does: Short Interval (SI) is int, Long Interval (LI) is chi"; the same sweep test |

## `g205_d132_walkweek.js` (10 rows: 10 mapped)

| Row | Held by |
|---|---|
| `E1` | `tests/integration/run-week-layout.test.ts` › "a pace week with four cardio sessions always carries an INT and a CHI card; a walking week keeps three, a quality week four; every run card names its key"; sweep › "the walking week, 64 calendars by 4 injury states by 2 seeds (512 programs): four sessions always carry INT and CHI; a walking week keeps three, a quality week four; every run card names its key" |
| `W0` | › "the source: the walking-week ceiling names both walking modes and is joined to the solo pace family" |
| `W1` | the same test; › "the pace family runs up to four days a week; a walking week or a second sport holds it at three; run_base and NRC keep four" |
| `W2` | › "a pace week with four cardio sessions always carries an INT and a CHI card; a walking week keeps three, a quality week four; every run card names its key" (8 calendars by 4 injury states, one seed: 32 programs); the sweep test above (512 programs) |
| `W2b` | the same two tests |
| `W3` | the same two tests (one count per injury state) |
| `W4` | › "the walking-week ceiling leaves run_half, run_base and multi-sport pace alone: the same cardio count every week, healthy or protected" (three calendars); sweep › "the walking-week ceiling leaves run_half, run_base and multi-sport pace alone on every one- and three-rest-day calendar" |
| `W5` | › "Mario's calendar on a protected knee: three cardio sessions and no quality card; healthy it keeps MON INT, THU CHI, FRI easy, SAT long" |
| `W6` | the same test |
| `W6b` | the same test |

## `g205_pace_eve.js` (23 rows: 22 mapped, 1 dropped)

| Row | Held by |
|---|---|
| `L:5e76685c` (`P-ERA`) | DROPPED: era-row existence (a `RUN_LABEL_BY_VERSION` row covers the version). The current row's names, Short Interval (SI) and Long Interval (LI), are what the hand shape reads, and the run week tests hold them to the dose key |
| `P0` | `tests/integration/leg-lift-placement.test.ts` › "the source: the pace family predicate is declared once with its three ids, isNRC is set in one place, the speed arm names INT and CHI, one shape feeds the placement and the region guard" |
| `P14` | › "no leg role lands on the long run's eve at four, five, six or seven training days, nor on the long run itself, in a lattice where a hit was possible in more than 200 weeks" (seed 1001: 385, 231, 77, 11 weeks); sweep › "the pace family on 64 calendars by two seeds (1,408 weeks): no leg role on the long run or its eve at any training-day count, every first-week placement cost-minimal, a speed day in every shaped week" |
| `P15` | the same two tests |
| `P16` | the same two tests |
| `P17` | the same two tests |
| `P1e` | the same two tests |
| `P2` | › "every first-week placement is cost-minimal under the D36 table, and the hand shape sees a speed day in every shaped week" (64 placements); the same sweep test (128) |
| `P2z` | the same two tests |
| `P3a` | › "the pace family prints the D36 note, verbatim on Mario's calendar; a bike or a swim goal never does" (the three pace ids) |
| `P3b` | › "run_base places by its run week: a long-keyed run prints the run_base note, never the D36 note; no long-keyed run keeps the 48 hour rule" (every other calendar, one seed); sweep › "run_base on every two- and three-rest-day calendar by two seeds (112 programs): placed by its run shape with the run_base note, never the D36 note" |
| `P3c` | › "the pace family prints the D36 note, verbatim on Mario's calendar; a bike or a swim goal never does" |
| `P3d` | the same test |
| `P4a` | the same test |
| `P5` | › "no leg role lands on the long run's eve at four, five, six or seven training days, nor on the long run itself, in a lattice where a hit was possible in more than 200 weeks" (495 such weeks on one seed); the same sweep test |
| `P6a` | › "the source: the pace family predicate is declared once with its three ids, isNRC is set in one place, the speed arm names INT and CHI, one shape feeds the placement and the region guard" |
| `P6b` | the same test |
| `P6c` | the same test |
| `P6d` | the same test |
| `P6e` | the same test |
| `P6f` | › "week 1 carries CHI, and every hinge day that carries a run carries INT or CHI, CHI among them" |
| `P6g` | the same test |
| `P6h` | the same test |

## `g208_d104a_runbase.js` (10 rows: 9 mapped, 1 dropped)

| Row | Held by |
|---|---|
| `M1` | DROPPED: the HALF_MANNY digest against `MANNY_DIGEST_BY_VERSION`, held by `tests/integration/program-output.test.js` |
| `R0` | `tests/integration/leg-lift-placement.test.ts` › "the run_base lattice, every twentieth config: every class reached, the label and the key name the same long run, no lower body Main on a long run or its eve, and the notes" (78 programs); sweep › "the run_base lattice whole (1,560 programs): every class reached, label and key agree on every card, no lower body Main on a long run or its eve, the notes, and no steady run note" |
| `R0b` | the same two tests |
| `R1` | the same two tests (the `R1i` line the gate printed was unasserted and is not a row) |
| `R2` | the same two tests; › "run_base places by its run week: a long-keyed run prints the run_base note, never the D36 note; no long-keyed run keeps the 48 hour rule" |
| `R3` | the same three tests |
| `R4` | › "the run_base note obeys the copy rule: two short sentences, no dash or hyphen, no brand" |
| `R5` | › "the steady run note is gone: no printed run_base note carries it, and the source does not"; the sweep's run_base lattice test |
| `R6` | › "T-1 and T-2 of a dated pace or mile test carry no section with items" (every seventh, 48 programs); sweep › "T-1 and T-2 of every dated pace or mile test (336 programs, 624 days) carry no section with items" |
| `R8a` | › "a program with no lift day prints no lift placement note" (every ninth); sweep › "every short dated program with no lift day (140 of 620) prints no lift placement note" |

## `g209_d140_tier.js` (15 rows: 14 mapped, 1 dropped)

| Row | Held by |
|---|---|
| `A1` | `tests/integration/long-run-day.test.ts` › "D140's lattice, every eighth program: tier A is post-run mobility titled so; tier B has no leg item, no power, explosive or carry section, no power core pillar and 8 sets or fewer; no tier carries a carry" (84 programs); sweep › "D140's lattice whole (672 programs): every tier and both limbs populated; tier A mobility only and titled; tier B no leg item, no power, explosive or carry section, no power core pillar, 8 sets or fewer; no carry on any tier" |
| `A2` | the same two tests |
| `B1` | the same two tests |
| `B2` | the same two tests |
| `B3` | the same two tests |
| `B4` | the same two tests |
| `B5` | the same two tests |
| `K0` | the same two tests |
| `K1` | › "the carry case (crossfit, balanced, rest Saturday and Sunday) W6 Friday: with an 8:15 mile it is tier C under 45 minutes, without a mile 56.4 minutes tier B with the strength pair; never a carry" (D188's arm) |
| `K1b` | the same test |
| `M1` | DROPPED: the HALF_MANNY digest against `MANNY_DIGEST_BY_VERSION`, held by `tests/integration/program-output.test.js` |
| `T0` | › "the stand-in's Saturday long runs, by dose arithmetic: 33.0 38.3 43.5 30.5 48.5 53.7 58.8 40.6 63.5 69.5 76.5 minutes, tiers C C C C B B B C B B A" (D187 amendment 2's row) |
| `T1` | › "the stand-in's tier B Saturdays (W5 W6 W7 W9 W10) keep the strength pair at 6 sets and lose the explosive finisher" |
| `T1b` | › "the stand-in's W11 long run crosses 75 minutes: tier A, titled Post-Run Mobility, mobility only" |
| `T2` | › "the stand-in's tier C Saturdays (W1 W2 W3 W4 W8) keep a normal day" |

## `g211_d153_d155.js` (42 rows: 41 mapped, 1 dropped)

The NRC, NSW and D153 limbs each printed seven lines: the lattice builds, `G1v` (tier B days and the recovery-week
loaded Full Body population reached), `G1` (no tier B day without a lift section), `G2` (no hinge on tier B), `G2v`
(the list sees hinges elsewhere), `G5` (8 sets or fewer), `G6` (D155's Upper superset). One test per limb asserts
all seven, in the integration file on a sample (the NRC sample takes every fourteenth config of the loaded full-body
slice, where D155's days live) and in the sweep whole.

| Row | Held by |
|---|---|
| `D153` (7 lines) | `tests/integration/long-run-day.test.ts` › "D153's population, every fourth config (where Cable pull-through once printed on a tier B day): no hinge, no empty tier B day, the Upper superset kept"; sweep › "D153's population, 240 configs (where Cable pull-through once printed on a tier B day): no hinge, no empty tier B day, the Upper superset kept" |
| `L:ab0ccea2` (NRC builds) | › "NRC, every hundredth config of 4,200 and every fourteenth of its loaded full-body slice: no tier B long-run day without lifting or with a hinge, 8 sets at most, and the recovery-week loaded full-body day keeps its Upper superset"; sweep › "NRC, 4,200 configs: no tier B long-run day without lifting or with a hinge, 8 sets at most, and the recovery-week loaded full-body day keeps its Upper superset" |
| `L:d3a84235` (NRC `G1v`) | the same two tests |
| `L:dfbd23ad` (NRC `G1`) | the same two tests |
| `L:36be4e1a` (NRC `G2`) | the same two tests |
| `L:6215d162` (NRC `G2v`) | the same two tests |
| `L:b95326f9` (NRC `G5`) | the same two tests |
| `L:d853bcae` (NRC `G6`) | the same two tests |
| `L:f102e868` (NSW builds) | › "NSW, every fiftieth config of 3,600: no tier B long-run day without lifting or with a hinge, 8 sets at most, the Upper superset kept, and no Arms or Delts finisher on a long day"; sweep › "NSW, 3,600 configs: the same, and no Arms or Delts finisher on a long day" |
| `L:48473bf9` (NSW `G1v`) | the same two tests |
| `L:5922bd2f` (NSW `G1`) | the same two tests |
| `L:d5947f9b` (NSW `G2`) | the same two tests |
| `L:212683b6` (NSW `G2v`) | the same two tests |
| `L:2df5411f` (NSW `G5`) | the same two tests |
| `L:c83973af` (NSW `G6`) | the same two tests |
| `L:2d50e4f3` (HF catches Cable pull-through) | › "the hinge hand list catches every hinge it names and passes every movement that is not one" |
| `L:8454d7d7` (HF catches Bodyweight back extension) | the same test |
| `L:85edd123` (HF catches Romanian deadlift) | the same test |
| `L:46eda7bc` (HF catches Single-leg RDL) | the same test |
| `L:423555e1` (HF catches Kettlebell swing) | the same test |
| `L:077ec335` (HF catches Good morning) | the same test |
| `L:e97bdaf9` (HF catches Glute-ham raise) | the same test |
| `L:e3033262` (HF catches GHR) | the same test |
| `L:be572f10` (HF catches Hip thrust) | the same test |
| `L:ed233d56` (HF catches Single-leg glute bridge) | the same test |
| `L:b69d144e` (HF catches Nordic curl) | the same test |
| `L:f413fa35` (HF catches Reverse hyper) | the same test |
| `L:79129e5c` (HF catches 45° back extension) | the same test |
| `L:9d23dc88` (HF catches Hyperextension) | the same test |
| `L:7e351073` (HF catches Cable hip extension) | the same test |
| `L:1a6c4b90` (HF catches Trap bar deadlift) | the same test |
| `L:05e0ab6b` (HF passes Goblet squat) | the same test |
| `L:6be39d4f` (HF passes Dumbbell bench press) | the same test |
| `L:d1c726c7` (HF passes Pull-up) | the same test |
| `L:0e5fb904` (HF passes Plank) | the same test |
| `L:25ab186c` (HF passes Walking lunge) | the same test |
| `L:54481080` (HF passes Face pull) | the same test |
| `L:302ac7d4` (HF passes Band pull-apart) | the same test |
| `L:4eb58721` (HF passes Hip 90/90 stretch) | the same test |
| `L:a2eca6dc` (HF passes Dumbbell row) | the same test |
| `L:ed3a173b` (HF passes Overhead press) | the same test |
| `L:793e1c6e` (`HM`) | DROPPED: the HALF_MANNY digest against `MANNY_DIGEST_BY_VERSION`, held by `tests/integration/program-output.test.js` |

## `g213_d113a.js` (23 rows: 23 mapped)

The gate read V212 (`169537c`) as the rulings' named oracle for four rows. Their current half: `R3v` picks the
excluded population with today's `injuryPlan` (the gate used V212's); `R7` and `R8`/`R8n` compare with the golden
file, which equals V212's names and layouts (checked once, above); `R8v`'s "the uninjured twins differ from V212"
becomes what that difference was evidence of: every routed twin's run days are the chooser's pick (22 pace twins,
58 NRC), and the chooser would move 36 of 44 pace and 112 of 116 NRC excluded weeks that carry enough runs to
route, so the pinned layouts can fail.

| Row | Held by |
|---|---|
| `L:40a94f55` (HF 35 three-day calendars) | `tests/integration/run-week-layout.test.ts` › "the hand oracles: 35 three-day calendars, 7 spacer calendars, the D130 pairs, the V115 crossover, the card classes" |
| `L:ae348b05` (HF the spacer set is the 7 typed) | the same test |
| `L:216264b4` (HF CHI on the eve tolerated) | the same test |
| `L:1895f2ef` (HF INT on the eve untolerated) | the same test |
| `L:9638b0c5` (HF CHI the day after untolerated) | the same test |
| `L:efecd1a0` (HF Saturday and Sunday neighbours) | the same test |
| `L:2737bd48` (HF a rest day breaks the pair) | the same test |
| `L:e927ae23` (HF the crossover typed) | the same test |
| `L:09d43690` (HF class SI is INT, LI is CHI) | the same test |
| `L:7367a00c` (HF class LSD is long only with the legs) | the same test |
| `L:a8b34e05` (R4/R5 lattice builds) | › "three-run pace weeks: the 28 spaceable calendars run INT, CHI and the long run every week; the 7 spacer calendars keep one quality, INT then CHI from the crossover" (35 builds); sweep › "three-run pace weeks, 35 calendars by 4 block lengths by 3 focuses (420 builds): the 28 spaceable run INT, CHI, long; the 7 spacer calendars cross INT to CHI" |
| `R4` | the same two tests |
| `R5` | the same two tests |
| `R1` (2 lines) | › "pace, solo and multi-sport: no week carries an untolerated hard run pair, and multi-sport three-run weeks are reached" (every thirtieth config, 53); sweep › "the pace lattice of D113a (1,584 configs, solo and with 15 second sports): no week with an untolerated pair, and multi-sport three-run weeks reached" |
| `R1v` | the same two tests |
| `R2` (3 lines) | › "NRC multi-sport: no week carries an untolerated hard run pair, and the long run is the last run of its ISO week" (every thirty-third config, 60); sweep › "the NRC multi-sport lattice of D146 (1,980 configs): no week with an untolerated pair, and the long run is the last run of its ISO week" |
| `R2v` | the same two tests |
| `R3v` | › "the excluded injury modes are all reached on the pace lattice, each with multi-sport builds"; sweep › "every excluded injury mode is reached on the pace lattice of D113a, each with multi-sport builds" |
| `R7` | › "NRC run card names are only the names in tests/snapshots/run-week-layout.json"; sweep › "the golden values match tests/snapshots/run-week-layout.json: the NRC run card names and every excluded-mode multi-sport layout" |
| `R7v` | the same two tests (more than 10 names) |
| `R8` | › "under the excluded modes a multi-sport week keeps its unrouted day layout (tests/snapshots/run-week-layout.json); uninjured, the same week takes the chooser's run days"; the same sweep test (348 pace layouts) |
| `R8n` | the same two tests (232 NRC layouts) |
| `R8v` | › "under the excluded modes a multi-sport week keeps its unrouted day layout (tests/snapshots/run-week-layout.json); uninjured, the same week takes the chooser's run days"; sweep › "the exclusion key: every excluded mode is reached in both populations, the uninjured twins take the chooser's run days, and the chooser would move most excluded weeks" |

## `g216_d156_longday.js` (4 rows: 3 mapped, 1 dropped)

| Row | Held by |
|---|---|
| `F1` (3 lines: NSW, NSW+seeds, NSW multi) | `tests/integration/long-run-day.test.ts` › "NSW, every fiftieth config of 3,600: no tier B long-run day without lifting or with a hinge, 8 sets at most, the Upper superset kept, and no Arms or Delts finisher on a long day"; › "the loaded full-body slice on two more seeds and with a bike or a swim: no Arms or Delts finisher on a long day, and every tier B long day lifts, at 8 sets or fewer"; sweep › "NSW, 3,600 configs: the same, and no Arms or Delts finisher on a long day"; › "the loaded full-body slice on two more seeds (960) and with a bike or a swim (240): no Arms or Delts finisher on a long day, and every tier B long day lifts, at 8 sets or fewer" |
| `G1` | the same four tests. The gate counted any section not labelled mobility or taper as lifting; the tests apply D155's stricter reading (a lift section with items, not core, hip, mobility or taper), which holds on all three lattices |
| `G2` | the same four tests |
| `L:793e1c6e` (`HM`) | DROPPED: the HALF_MANNY digest against `MANNY_DIGEST_BY_VERSION`, held by `tests/integration/program-output.test.js` |

## Mutations

Mutations: not run (sabotage off). Parity rests on the row mapping above, the new tests passing on today's
`index.html`, and the integration files failing on the releases before their rulings (below).

## Against earlier releases

Each integration file was also run once against the release before the rulings it holds (`IA_APP=<that body>`):

| File | Release | Fails |
|---|---|---|
| `run-week-layout.test.js` | V204 (before D125, D129, D130, D132) | 25 of 41 |
| `run-week-layout.test.js` | V212 (before D113a, D146) | 9 of 41 |
| `leg-lift-placement.test.js` | V204 (before D127) | 9 of 12 |
| `leg-lift-placement.test.js` | V207 (before D104a) | 5 of 12 |
| `long-run-day.test.js` | V208 (before D140) | 9 of 12 |
| `long-run-day.test.js` | V210 (before D153, D155) | 7 of 12 |
| `long-run-day.test.js` | V215 (before D156) | 5 of 12 |

Tests that pass on an earlier release hold behaviour that was not meant to change (the oracle's own search space, the
copy rule, NRC's pins, the walking week's scope).
