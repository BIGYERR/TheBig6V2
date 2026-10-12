# Group 9: test weeks, race dates and taper

Phase 2 parity for seven gates, 205 manifest rows (`tests/row_manifest.txt`). The legacy gates stay in place and keep
running in CI until phase 3 deletes the legacy suite; this file is the record that every row is held by a feature
test or dropped for a written reason (`docs/test-migration.md`, The parity rule).

New files:

- `tests/integration/test-week.test.js` (38 tests): what the test week of a dated NSW test goal looks like. The test
  week index, the taper and the long run for test blocks of 1 to 8 weeks (D106a slice A), the test week itself (slice
  B), the trial taken from the week's hardest run across mixes (slice E), T-1 and T-2 (the V208 fix-forward), B4 at
  T-2, the eve shakeout and the protect-park modes it skips (D158). Hand fixtures and a sample of each lattice.
- `tests/integration/test-length.test.js` (39 tests): how long the program is and where it starts. doGenerate's pin
  (D106a, D184), the boot backfill and setProgStart's re-pin (D106a slice C, D184), the race date card (D183), one
  owner for Table 6's last row, one length on every surface and the start whose week holds the test (D184), the last
  two in New York and in UTC.
- `tests/integration/race-date.test.js` (18 tests): blockOpen through refreshProgram and a reboot (D180), and the race
  date and its countdown on four surfaces (D182) in New York and in UTC.
- `tests/sweeps/test-week.test.js` (10 tests, CI only): every lattice whole: 108 trial week cells, 360 eve cells (one
  test per goal and mix), 456 B4 cells, 784 shakeout cells, 672 protect-park cells.
- `tests/sweeps/test-length.test.js` (8 tests, CI only), in both zones: the 1,440-cell length lattice with its exact
  refusal population (416 and 64), the 120,050-point snap lattice, every (c) cell's 1,809 builds, its 603 start
  sentences and race date cards.
- `tests/sweeps/race-date.test.js` (2 tests, CI only): the 402-row refreshProgram lattice with the ruling's blast
  radius (365 aligned, 209 moving: 5K 25, 10K 25, half 67, marathon 91, HALF_MANNY 1) and the 46 wizard rows.
- `tests/snapshots/test-week.json`: the training-day eve under the protect-park injury modes (264 cells: easy,
  noimpact, noimpact_swim, reduce, 66 each). D158's ruling names V213 as the oracle; the snapshot was checked once
  against V213 (`bc3cccc`) when written, 264 of 264 equal, so the gate's current claim is held without a past build.
- `tests/support/test-week.js`, `tests/support/test-length.js`, `tests/support/race-date.js`: the hand calendar
  (integer civil days, Sakamoto's weekday), the card readers, the fixtures, the lattices and their runners, the
  keeping document, the wizard and setProgStart drivers, the countdown surfaces and the block open boot.

The map names two files. The test week claims split in two, the week (`test-week`) and its length and start
(`test-length`), so each runs in a few seconds: test week 1.2 s, test length 3.1 s, race date 1.8 s on a loaded
machine (the sweeps: test week 9 s, test length 43 s, race date 10 s).

Clocks: every file pins the app's clock and TZ. The legacy `g207_test_calendar.js` and `g207_test_week.js` (G rows)
read the real clock; their tests pin Sun 2026-10-11 12:00 and Mon 2026-09-14 12:00, with the dates typed by hand and
checked against the calendar ("the hand dates of the backfill are what the calendar says"). The two zones that
`g223_d182_racedate.js` and `g223_d184_testlen.js` ran as child processes run as one `describe` per zone in one
process, TZ switched before each zone's app boots.

Totals: **205 rows: 198 mapped, 7 dropped** (3 HALF_MANNY digest rows, held by
`tests/integration/program-output.test.js`; 4 `CHILD0` rows, legacy machinery).

## `g207_gk_trial_present.js` (17 rows: 16 mapped, 1 dropped)

Lattice rows are held twice: on a sample in `tests/integration/test-week.test.js` (every fifth trial week cell, every
seventh eve cell, every eleventh B4 cell) and whole in `tests/sweeps/test-week.test.js`.

| Row | Held by |
|---|---|
| `P1` | `tests/integration/test-week.test.js` › "a dated test goal that ends on its test week carries one time trial, on the test day, titled Test Day with no section: run only, with a bike, with a swim"; sweep › "every cell of the trial week lattice carries one trial on the test day, titled Test Day, and the week around it is clean" |
| `P2` | the same two tests |
| `P3` | the same two tests |
| `P4` | › "when the test week dealt no quality run, the trial is the long card and no long card is left"; the sweep test (72 of 108 cells reach it) |
| `P5` | › "no interval run at T-1 or T-2; bike and swim cards before the test day are untouched, the eve apart, and every day after the test rests"; the sweep test |
| `P5z` | the same test (quality runs seen in the pre-pin weeks, some at T-1 or T-2); the sweep test |
| `P6` | the same test (the eve excepted, D158's shakeout: the current half of the era split); the sweep test |
| `Q0` | › "a long run dealt at T-1 becomes the shakeout at the week easy distance, and at T-2 the week easy run, card and all" (builds, reach); sweep › "<goal>, <mix>: T-1 is the shakeout, T-2 the week easy run, no leg load, no lift, every Shakeout an easy run" (six tests, one per goal and mix, as the gate printed one row per group) |
| `Q1` | › "no run at T-1 or T-2 carries leg load, every Shakeout is the easy run, and T-1 and T-2 carry no lift"; the six sweep tests |
| `Q2` | the same tests |
| `Q3` | › "a long run dealt at T-1 becomes the shakeout ..." (T-1 the D158 shakeout, T-2 the pre-pin easy card: the current half of the era split); the six sweep tests |
| `Q4` | › "PRT TING's stand-in, test Mon 2026-10-26: W4 Saturday is the Shakeout and carries the week's one easy run, byte for byte" |
| `Q5` | › "raceEveLiftPass titles the eve by its card: a long run is never a Shakeout, the easy run and an NRC recovery run are" |
| `Q7` | DROPPED: HALF_MANNY digest against `MANNY_DIGEST_BY_VERSION`, held by `tests/integration/program-output.test.js`. |
| `Q8` | › "no run at T-1 or T-2 carries leg load, ..."; the six sweep tests |
| `Q9` | › "wherever the week dealt a quality run two days before the test, that day now carries nothing hard"; sweep › "no hard run two days before the test, on every mix, rest set, test week and weekday" (456 programs) |
| `Q9x` | › "training Monday, Tuesday, Saturday, Sunday with a Thursday test in week 1: Tuesday held a quality run and now carries one card, the easy run" |

## `g207_test_calendar.js` (19 rows: 19 mapped)

The C4 rows hold their current half, D183's card sentences; the D106a sentences the gate licensed at 222 and below
are a version predicate's other arm.

| Row | Held by |
|---|---|
| `C1a` | `tests/integration/test-length.test.js` › "moving the start a week later re-pins test week 4, builds 4 weeks, persists the pin and keeps the trained day frozen; an NRC program gets no pin" |
| `C1b` | the same test |
| `C1c` | the same test |
| `C3a` | › "a stored dated test goal with no pin backfills it on refresh: test week 5, 5 weeks, both pins persisted, the trained day frozen, the trial on the test day" |
| `C3b` | the same test (a fresh build of the sentinel day differs, so the freeze is real) |
| `C3c` | the same test |
| `C3d` | › "the backfill runs once: with the pin stored, moving the start a week later and refreshing keeps test week 5" |
| `C3e` | › "the backfill leaves an NRC program and an undated pace goal alone: no test week key, the length unchanged" |
| `C3f` | the same test |
| `C3g` | › "a test already past writes nothing: no key in memory or in storage, the stored cfg bytes unchanged, 11 weeks" |
| `C3h` | › "a test past the 11-week goal pins its own week: week 15 builds 15 weeks with the trial on the test weekday, both pins persisted" |
| `C3i` | › "a stored null pin with the test in week 14 of 11 re-pins to 14 and keeps the trained day frozen; in week 28, past Table 6, it stays null and writes nothing" |
| `C3j` | the same test |
| `C4a` | › "the race date card names the test week: week 5, the start week, and a test before the start" |
| `C4b` | the same test |
| `C4c` | the same test |
| `C4d` | › "a test goal three days out is the start week, never red; an NRC 5K three days out keeps its own sentence; no dash in any of them" |
| `C4e` | the same test |
| `C4f` | the same test (no dash in any typed sentence; each renders in the tests above) |

## `g207_test_week.js` (73 rows: 72 mapped, 1 dropped)

The G rows live in `tests/integration/test-length.test.js`, every other row in `tests/integration/test-week.test.js`.

| Row | Held by |
|---|---|
| `Z0` | `tests/integration/test-week.test.js` › "the test week is counted in Monday weeks from the start, across both daylight saving changes" |
| `H1` to `H9` (9 rows) | the same test, one hand row each, every one also checked against the hand calendar |
| `F1` | › "PRT TING pinned to its week 5 test builds 5 weeks, the same goal undated builds 11, and weeks 1 to 3 carry the same cardio" |
| `F2` | › "PRT TING with the length pin alone prints the taper on weeks 4 and 5" |
| `F3` | the F1 test |
| `T1a`, `T1b`, `T1c`, `T1f` | › "a test block of 1 week: the long run follows the hand series, and the taper is the last week, where it dips" |
| `T2a` to `T8f` (28 rows) | › "a test block of <n> weeks: the long run follows the hand series, and the taper is the last two weeks, where it dips", one test per n, holding its a (series), b (Taper set), c (dip set) and f (finite) rows |
| `D1` | › "a Monday test: week 5 carries one run, the time trial on Monday, titled Test Day with no sections, and the rest of the week rests" |
| `D2` | the same test |
| `D3` | › "two days before a Monday test is a Shakeout with no sections, and three days before keeps its Primer" |
| `D4` | › "the trial card prints coach's text exactly, with no dash in either string" |
| `D5a` | › "a Tuesday test, 2026-10-20: the only time trial in the program sits on week 5 Tuesday" |
| `D5b` | › "a Thursday test, 2026-10-22: the only time trial in the program sits on week 5 Thursday" |
| `D5c` | › "a Saturday test, 2026-10-24: the only time trial in the program sits on week 5 Saturday" |
| `D6` | › "a Saturday test: the Thursday two days before holds no interval run" |
| `D7a` | › "a Tuesday test: Monday is the Shakeout, the week's easy run at 2.3 mi, and Wednesday to Sunday rest" |
| `D7b` | the same test |
| `D7c` | the same test |
| `D8a` | › "a Sunday test on a three-run week: the trial takes the long interval slot, no long interval is left, an interval run sits three or more days out, nothing hard at T-1 or T-2" (the D113a era half; the 212-and-below arm is a version predicate) |
| `D8b` | the same test |
| `D8c` | › "a Thursday test on a Monday, Tuesday, Wednesday spacer week: the trial takes the interval slot, no quality run is left, nothing hard at T-1 or T-2" |
| `D8d` | the same test |
| `D9` | DROPPED: HALF_MANNY digest against `MANNY_DIGEST_BY_VERSION`, held by `tests/integration/program-output.test.js`. |
| `D10` | › "an NRC 5K time trial with no race date is still titled Race Day" |
| `D11` | › "an NRC 5K with a bike goal: the bike long ride in the race eve window keeps its own title" |
| `E1` | › "every run card names the same quality session in its NSW name and its dose key" (every run card the file builds; the gate's era table that chose between names and keys is a version predicate) |
| `G1` | `tests/integration/test-length.test.js` › "the wizard pins a dated test goal to its test week, 1 to 26, and the generate screen names that length; undated, before the start or past 26 keeps the 11-week goal" |
| `G2`, `G3`, `G4`, `G4b`, `G4c`, `G5`, `G6`, `G7` | the same test, one row each, in the gate's order on one WD |

## `g214_d158_eve.js` (8 rows: 7 mapped, 1 dropped)

| Row | Held by |
|---|---|
| `D0` | `tests/integration/test-week.test.js` › "every training-day eve carries the shakeout and nothing else: one easy run, distance keyed easy, titled Shakeout, no lift" (every eleventh cell; reach of each eve kind); sweep › "every training-day eve of the shakeout lattice carries the shakeout at the week easy distance; every rest-day eve rests" (784 programs) |
| `D1` | the same two tests |
| `D2` | › "the shakeout's distance is the week's easy distance, read off the other days of the week before the pin"; the sweep test |
| `D2v` | the same two tests |
| `D3` | › "every rest-day eve rests, and the days before the test hold nothing hard and one trial, on the test day"; the sweep test |
| `D4` | the same two tests |
| `D8` | › "under the protect-park injury modes a training-day eve keeps the cards, lift and rest it had before the shakeout ruling (tests/snapshots/test-week.json)" (every eleventh cell); sweep › "under the protect-park injury modes every training-day eve matches tests/snapshots/test-week.json" (264 eves, every mode reached). The gate compared each eve with V213's at run time; the snapshot holds V213's eves, checked once (264 of 264 equal). |
| `L:464cf187` (`HM`) | DROPPED: HALF_MANNY digest against `MANNY_DIGEST_BY_VERSION`, held by `tests/integration/program-output.test.js`. |

## `g221_d180_blockopen.js` (22 rows: 22 mapped)

| Row | Held by |
|---|---|
| `C0` | `tests/integration/race-date.test.js` › "the pinned clock reaches the app: Date.now() is the pin and today is Thursday 2026-09-24" |
| `I1a` | › "a race program keeps blockOpen through refreshProgram, and the days it holds outside are the days before today from its counted-back start" (HALF_MANNY and every eleventh row); sweep › "every row of the refreshProgram lattice: aligned rows carry blockOpen, others carry no key, and the days held outside are the date-arithmetic set" (365 of 365) |
| `I1b` | the same two tests (37 of 37 in the sweep) |
| `I1c` | the same two tests (the ruling's blast radius, 209 moving rows by goal, in the sweep) |
| `I2a` | › "after a reboot, setting the same race date or the same start leaves the stored blockOpen and the start alone, and memory agrees with storage" |
| `I2b` | the same test |
| `I2c` | the same test |
| `I3a` | › "the wizard lands on week 1 as it renders after a reboot and as its own program renders; a race program lands with its days before today greyed" (every fifth row and the fixture); sweep › "every wizard row lands on week 1 as it renders after a reboot and as its own program renders; every race row lands with its days before today greyed" (46 rows) |
| `I3b` | the same two tests |
| `I3c` | the same two tests |
| `I3d` | the same two tests (24 aligned rows, 16 with days before today, in the sweep) |
| `I4` | › "HALF_MANNY's boot after signing up on Thu 2026-09-24 shows no reminder, and its weeks read as the ruling's After column" |
| `T1` to `T10` (10 rows) | the same test, one assertion each, typed from the fixture arithmetic (› "the fixture arithmetic: HALF_MANNY starts Mon 2026-08-31, so W1 and W4 Mon to Wed are before Thu 2026-09-24, and one training day is due" checks it engine free) |

## `g223_d182_racedate.js` (30 rows: 28 mapped, 2 dropped)

Each row printed once per zone; each `.NY` row is held by `tests/integration/race-date.test.js` › "in New York" › the
test named, each `.UTC` row by › "in UTC" › the same test.

| Row | Held by |
|---|---|
| `Z0.NY`, `Z0.UTC` | › "the zone is the one asked for, the clock pin reaches the app, and the hand date oracle agrees with itself and the ruling" |
| `Z1.NY`, `Z1.UTC` | the same test |
| `Z2.NY`, `Z2.UTC` | the same test |
| `Z3.NY`, `Z3.UTC` | › "a program with no race date: the card says "No date set" with no Time out row, and the copy says "Event: no date"" |
| `R1a`, `R1b`, `R1c`, `R1d` (.NY, .UTC: 8 rows) | › "the Programs card, the copy text, the mile lock sheet and the wizard review print the race date as the calendar has it, for 10 dates" |
| `R2a`, `R2b`, `R2c`, `R2d` (.NY, .UTC: 8 rows) | › "the countdown is live on all four surfaces: weeks, 1 week, days, 1 day, race day, behind you, across both DST changes" (13 cells, and a dated test goal's card and copy) |
| `R3.NY`, `R3.UTC` | › "raceAlignment counts whole weeks out from rounded days, across the spring-forward, given today or reading the clock" |
| `R4.NY`, `R4.UTC` | › "nothing stored is read: a wrong stored week count, a moved race with a stale top-level date, and a stale wizard count all print the live countdown" |
| `CHILD0.NY`, `CHILD0.UTC` | DROPPED: legacy machinery, the parent's check that its zone's child process ran every row and printed its summary. The zones run in one process as two `describe` blocks; node:test reports every test in each, and a zone whose boot throws fails every test in it. |

## `g223_d184_testlen.js` (36 rows: 34 mapped, 2 dropped)

Each row printed once per zone; each `.NY` row is held by `tests/integration/test-length.test.js` › "in New York" ›
the test named, each `.UTC` row by › "in UTC" › the same test, and each lattice row also by the matching test in
`tests/sweeps/test-length.test.js` (both zones).

| Row | Held by |
|---|---|
| `Z0`, `Z1`, `Z2` (.NY, .UTC: 6 rows) | › "the zone is the one asked for, the clock pin reaches the app, and the hand week oracle agrees with the ruling" |
| `RD0.NY`, `RD0.UTC` | › "a 1 mi 6:00 beginner tested Thu 2027-02-04 from Mon 2026-09-21 builds 20 weeks, pins 20, and the trial is W20 Thursday" |
| `B1248.NY`, `B1248.UTC` | › "weeks 1 to 26: the goal step header, the name step, the generate screen and the built program all print the test week" (every fifth group, four weeks each; D187 R3's refusal asserted on its cells, the current half of the gate's era split); sweep › "the length lattice: weeks 1 to 26 print the test week on every surface, 27 to 30 the goal length and the interim sentence" (1,248 cells, refusal population exactly 416) |
| `K27.NY`, `K27.UTC` | › "weeks 27 to 30: the card prints the interim sentence, every surface prints the goal length, and no trial is built" (a sample, and the typed PRT TING anchor); the same sweep test (192 cells, refusal population exactly 64) |
| `P1.NY`, `P1.UTC` | › "Table 6's last row is read in one place, progTestPin, and no week gate of the old shape is left" (once, at the top of the file: a source scan has no zone) |
| `R1.NY`, `R1.UTC` | › "a start whose short week holds the test keeps the entered day with holdsTest, and no other start moves for a test date" (every (c) point and every thirteenth other point) and › "the snap lattice holds 120,050 points, 1,206 of them a short week that holds the test, split as the ruling counts them"; sweep › "every point of the snap lattice: (c) points keep the entered day with holdsTest, no other point moves" |
| `R2.NY`, `R2.UTC` | › "a program built from such a start is one week, starts on the entered day and carries only the trial, on the test weekday"; sweep › "every (c) cell of the 1.5 mi goal at every experience level builds one week from the entered day with only the trial" (1,809 builds) |
| `R3.NY`, `R3.UTC` | › "the name step says the week holds the test, with the entered day, and never "today" or "this week""; sweep › "every (c) cell: the name step sentence and the race date card" |
| `R3S.NY`, `R3S.UTC` | › "a short week that does not hold the test still snaps to Monday and says so" |
| `R4.NY`, `R4.UTC` | › "the race date card on such a week says the test is in week 1 with nothing left to train, in the signal colour, with no Primer or shakeout" (cells A and B named); the same sweep test |
| `R4D.NY`, `R4D.UTC` | › "the race date card keeps its sentences on other weeks: a test this week with a start today, and week 3" |
| `R4B.NY`, `R4B.UTC` | the same test |
| `R6.NY`, `R6.UTC` | › "moving the start into a week that holds the test keeps the entered day, pins week 1 and says so: on, after and before today" |
| `R6S.NY`, `R6S.UTC` | › "moving the start into a short week without the test snaps to the next Monday, with the plain snap toast" |
| `R6N.NY`, `R6N.UTC` | › "a race goal moved into its race week still snaps: HALF_MANNY with Thursday to Sunday rest, re-dated to Thu 2026-12-03" |
| `CHILD0.NY`, `CHILD0.UTC` | DROPPED: legacy machinery, as for `g223_d182_racedate.js`. |

## Mutations

Mutations: not run (sabotage off). Parity rests on the row mapping above and the new tests passing on today's
`index.html`.

## The release before

Run once with `IA_APP` while the files were written. On V206 (before D106a) the test week tests fail but for the
controls the gate also passed there (the 6 to 8 week blocks, F1 to F3, D6, D10, D11). On V213 (before D158) the three
shakeout tests fail and the protect-park snapshot passes, as it guards behaviour D158 ruled must not change. On V222
(before D184) every D184 test fails but the controls the gate named (R3S, R6N, the zone and oracle checks), and the
D183 card tests fail for D183's reason. On V220 (before D180) the four block open tests fail; on V222 (before D182) the
countdown tests fail, raceAlignment under UTC apart (the gate's control: no DST, the old floor is right there).
