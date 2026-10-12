# Group 11: cardio sessions (NSW Table 6, swim and bike)

Phase 2 parity for eleven gates, 195 manifest rows (`tests/row_manifest.txt`). The legacy gates stay in place and keep
running in CI until phase 3 deletes the legacy suite; this file is the record that every row is held by a feature test
or dropped for a written reason (`docs/test-migration.md`, The parity rule).

The new tests assert what the app does today (0.239.1). Every version arm of a gate (`VER >= ERA`, the era tables,
`SCOPED OUT`, `NOT APPLICABLE`, the three-run licence) is ported at its current arm and the older arms are not. The hand
oracles are ported as typed: Table 6's CHI and INT columns, guide A's 4 s per 400 m, recovery multipliers and cap of 8,
guide B's warm-up, the cutback, taper, crossover and V115 arithmetic, the pace rows, coach's D109 replacement table
(`tests/measure/v206_d109_table.txt`, sha256 pinned, with the later rulings' supersessions applied), the swim rate
table and hand model, the sheet's hand table, the M2 messages, the sizer's hand row and the m:ss twins.

## Totals

- Rows: 195 over 11 gates.
- Mapped to a new test: 189.
- Dropped: 6:
  - an era-row existence check (`RUN_LABEL_BY_VERSION` covers the artifact's ia-version; legacy machinery): 3
  - the HALF_MANNY digest against `MANNY_DIGEST_BY_VERSION`, held by `tests/integration/program-output.test.js`: 3
- Mutations: not run (sabotage off).

## New files

The group's map names two files, `tests/integration/cardio-sessions.test.ts` and `tests/integration/swim.test.ts`. The
three D103a gates (`g208_d103a_*`) are their own feature, the run session's class key and what reads it, so they move to
`tests/integration/run-session-class.test.ts`. Times on a loaded machine (load average 20 to 90):

- `tests/integration/cardio-sessions.test.ts`: 38 tests, about 0.6 s. Table 6's two columns and their readers, the bike
  and swim readers, Mario's blocks, run_base's steady hold, the Short Interval doctrine on a sample of the pace lattice
  (one goal per entered mile, the 6:46 mile, PRT TING) and five of the 35 three-training-day calendars, the D109 copy
  rule.
- `tests/integration/run-session-class.test.ts`: 18 tests, about 0.8 s. The chip, the key, the readers and the rename
  surgery on a sample of each lattice.
- `tests/integration/swim.test.ts`: 35 tests, about 1.0 s. The swim clock on every seventh entry of the lattice, D144's
  fixtures, the goal sheet, M2, the sizer (one experience and age of its lattice, a sample of the build lattice), the
  wizard's pace line, the stored program.
- `tests/sweeps/cardio-sessions.test.ts`: 5 tests, about 0.7 s (CI only). The 55-program pace lattice and the SI card
  rule on 56 four-run blocks and all 35 three-run calendars.
- `tests/sweeps/run-session-class.test.ts`: 4 tests, about 7 s (CI only). The 354-program key lattice, the 180-program
  chip lattice, the 96-config readers' lattice under four injury modes, the rename surgery on its 180 pace programs.
- `tests/sweeps/swim.test.ts`: 9 tests, about 4.5 s (CI only). The 504-program swim time lattice, the distance goals at
  three seeds, the other goals beside a swim (78 programs), the 7,560-entry sizer lattice, the 192-build lattice.
- `tests/snapshots/swim.json`: swimmer B's rebuilt program digest after a goal sheet change, `a0f2e847ed9473d7`, the
  value coach printed from a source surgery copy before D110a slice 3 (the gate's `SH5`).
- `tests/support/cardio-sessions.ts`, `tests/support/run-session-class.ts`, `tests/support/swim.ts`: the hand oracles,
  the configs, the lattices and the audits.

Every file pins the app's clock (2026-10-11 noon; the stored program test generates on 2026-09-07 and boots on
2026-09-24), pins every seed, and checks that a seeded program equals itself built twice.

**The doctrine text.** Two tests read `doctrine/*.txt` (the guide's own words behind the interval rules, and Table 6
re-read from guide B). The doctrine is gitignored; without it they skip by name ("doctrine/*.txt is absent"), and the
hand tables they cross-check still hold every other test. The CI job that runs the new tests (`tests` in
`.github/workflows/pipeline.yml`) has no `DOCTRINE_TXZ` restore step yet, so in CI these two skip until it gains one
(`docs/test-migration.md`, order of migration, item 11).

**Discrimination.** Each file was run against earlier releases (`IA_APP=<git show V<n>:index.html>`). On V204 every
D114 and D128 test fails; on V205 the D137 and D109 tests fail; on V207 11 of the 18 class tests fail (every test that
reads a key); on V211 32 of 35 swim tests fail; on V217 exactly the eight D157 tests fail; on V222 exactly the two D183
pace line tests fail; on V224 the PRT TING grid, the pace representatives, the 524 s/mi LI and entry 53's text (D186,
D187) fail. Before V208 every test that finds a run card by its SI or LI label also fails for the rename. The tests
that pass on every release guard behaviour the rulings kept (purity, self-stability, the bike and swim chips, the NRC
codes, no key on an unkeyed session, the strides finisher without an injury, the easy mode test eve).

## Rows

### `g202_int_doctrine.js` (27 rows: 27 mapped)

`tests/integration/cardio-sessions.test.ts` unless the row names the sweep (`tests/sweeps/cardio-sessions.test.ts`).

| Row | Held by |
|---|---|
| `A0` | › "guide A still says what the interval rules are typed from" (skips by name without the doctrine) |
| `A0b` | the same test |
| `A0c` | the same test |
| `A0d` | the same test |
| `D1` | › "every SI card's pace is exactly 16 s/mi under the goal pace printed beside it, and the logged target agrees"; sweep › "every SI card's pace is exactly 16 s/mi under its printed goal pace, and the logged target agrees, cutbacks included" |
| `D1b` | › "the 16 s/mi is guide A's 4 s per 400 m in per-mile units, and it is not a proportion" |
| `D2` | the same test |
| `D3` | the two `D1` tests |
| `D3b` | › "every block opens on guide A's 4 repeats, none passes 8, and some reach 8"; sweep › "every block opens on 4 repeats, none passes 8, the cap the note states is the highest prescribed" |
| `D4` | › "the recovery is 2 to 2.5 x the work interval, by hand, printed as m:ss to m:ss"; sweep › "every recovery band is 2 to 2.5 x the work by hand, every card carries guide B's warm-up, no card a dash" |
| `D4b` | the same two tests |
| `D5` | › "no SI card prescribes the fixed 200 m recovery, and every one carries guide B's warm-up verbatim"; the sweep's `D4` test |
| `D5b` | the same two tests |
| `D6` | › "the warm-up and recovery sentences, and every rendered SI card, carry no mid-sentence dash" |
| `D6b` | the same test; the sweep's `D4` test |
| `D7` | › "the hand reps and pace rows are what their functions derive, and the spacer calendars are what the hard-day spacing rule derives"; › "PRT TING prints one SI card a week, each the ruled sentence on the hand reps, target and recovery"; › "the six pace representatives log their hand rows to the second"; › "the SI card count is a rule: one a week at four runs; at three runs one SI and one LI a week, or a spacer crossover"; sweep › "the SI card count is a rule on every build: 56 four-run blocks, and 35 three-run calendars, 7 spacer and 28 two-quality". The current arm is D113a's (four-run, two-quality, spacer) with Table 6 reps and the D186/D187 clock (a rate of 3, N build weeks as N - 1 steps). The V115 position ramp (to 204), the three-run crossover licence (to 212), the pre-D186 pace rows (to 224) and `D7c` (the V115 ramp and Table 6 diverge, a claim about the 204 era row) are older arms and are not ported. |
| `D8` | › "W10 LI keeps A's x1.08 worked example (524 s/mi, 8:44/mi), W1 LSD keeps 10:59/mi, and neither carries a recovery band" (the 501 s/mi of the pre-D186 era is not ported) |
| `D8b` | the same test |
| `D8c` | the same test |
| `D9` | › "all four copies of the generic SI note state guide A's cap of 8, and none still claims 10" (the current head is D103a's `SI:`; the test also holds that neither older head, `INT:` or `INT — Interval:`, is left with the tail) |
| `D9b` | › "the generic SI note renders verbatim with no dash, and the cap it states is the cap the engine prescribes" (on the 10:45 mile, 1 mi goal, the cell D186/D187 left undampened) |
| `D9c` | the same test |
| `D9d` | the same test; the sweep's `D3b` test |
| `D10a` | › "a goal pace that lands on the minute prints 7:00, never 6:60, and the parser refuses 6:60" |
| `D10b` | the same test |
| `D10c` | the same test |
| `D10d` | the same test |

The gate's `LABEL-ERA`, `D7-LICENCE` and `D9-ERA` lines printed only on a failure and are not manifest rows.

### `g205_bike_unmoved.js` (15 rows: 15 mapped)

| Row | Held by |
|---|---|
| `B1` | `tests/integration/cardio-sessions.test.ts` › "every bike CHI and INT card prints the bike's position ramp, on weeks where Table 6 would print otherwise" |
| `B2a` | the same test |
| `B2b` | the same test |
| `B3` | the same test |
| `B5` | the same test |
| `B6a` | the same test |
| `B6b` | the same test |
| `B7` | the same test |
| `B4a` | › "each sport calls its own reader: the bike builder names getCHIBike and getINTBike, the run and swim builders the table readers" |
| `B4b` | the same test |
| `B4c` | the same test |
| `B4d` | the same test |
| `B8a` | the same test |
| `B8b` | the same test |
| `B8c` | the same test |

### `g205_chi_table6.js` (29 rows: 28 mapped, 1 dropped)

| Row | Held by |
|---|---|
| `L:3a283592` | DROPPED: era-row existence check (a `RUN_LABEL_BY_VERSION` row covers the artifact's ia-version). The LI label it supplied is typed in `tests/support/cardio-sessions.ts`. |
| `T1a` | `tests/integration/cardio-sessions.test.ts` › "the CHI table reader and the per-sport readers exist, and the stored column is 26 rows" |
| `T1b` | the same test |
| `T1c` | the same test |
| `T2` | › "chiFromTable6 returns the hand transcription for weeks 1 to 26 and row 26 past it" |
| `T2b` | › "the Table 6 hand transcription reproduces all 26 rows of guide B, both columns, and its tail rule" (skips by name without the doctrine) |
| `T2b2` | the same test |
| `T3` | the `T2` test |
| `T4a` | › "the heaviest Table 6 CHI cell is 40 minutes of work and no row prescribes more than 2 pieces" |
| `T4b` | the same test |
| `T5` | › "getCHI reads Table 6 by calendar week for every phase window, and steps back on a cutback week" |
| `T6a` | the same test |
| `T6b` | the same test |
| `T7` | › "getCHI never prescribes 3 pieces or more than 40 minutes, and past week 26 reads row 26 or its cutback" |
| `T8a` | the same test |
| `T8b` | the same test |
| `T9a` | › "getCHIBike keeps the bike's own position ramp, which is not Table 6" |
| `T9b` | the same test |
| `T10a` | › "getCHISwim takes Table 6's pieces (1 to week 12, 2 from week 13) and keeps the position ramp's minutes" |
| `T10b` | the same test |
| `T10c` | the same test |
| `T11a` | › "Mario's 11-week pace block prints the Table 6 LI dose on every card, never 3 x 20" |
| `T11b` | the same test |
| `T11c` | the same test |
| `T11d` | the same test |
| `T12a` | › "swim_mile CHI cards keep the yard ramp, quantised to 25s with a 150 floor, at Table 6's piece count" |
| `T12b` | the same test |
| `T13` | › "HALF_MANNY is an NRC plan and builds no LI card, and buildProgram leaves its cfg byte-identical" |
| `T14` | the same test |

### `g205_d114_int_table6.js` (18 rows: 17 mapped, 1 dropped)

| Row | Held by |
|---|---|
| `L:3a283592` | DROPPED: era-row existence check (a `RUN_LABEL_BY_VERSION` row covers the artifact's ia-version). The SI label is typed in the support file. |
| `T1` | `tests/integration/cardio-sessions.test.ts` › "the INT column is stored raw, 26 rows, and intFromTable6 reads it under guide A's cap of 8" |
| `T2a` | the same test |
| `T2` | the same test |
| `T3` | the same test |
| `T4a` | the same test |
| `T4b` | the same test |
| `T4c` | the same test |
| `T4d` | the same test |
| `T4e` | the same test |
| `T2b` | › "the Table 6 hand transcription reproduces all 26 rows of guide B, both columns, and its tail rule" (skips by name without the doctrine) |
| `T2c` | the same test |
| `T5` | › "getINTReps reads the calendar week, never the ramp span, with the cutback stepping back about 40%" |
| `T6` | the same test |
| `T7` | the same test |
| `T8a` | › "Mario's crossfit pace block prints one SI card a week reading 4,4,5,3,6,6,7,4,8,8,8, and reaches 8 before the last week" |
| `T8` | the same test |
| `T9` | the same test |

### `g206_d109_copy.js` (13 rows: 13 mapped)

The supersessions the gate keyed on ia-version (D103a, D110a, D186, D187) all apply today, so they are applied
unconditionally; a supersession whose "was" is not the entry's text at that point still fails the test.

| Row | Held by |
|---|---|
| `D109-S-run` | `tests/integration/cardio-sessions.test.ts` › "no line of the four cardio builders carries an em-dash and no literal a letter-hyphen-letter, names aside" |
| `D109-S-nrc` | the same test |
| `D109-S-bike` | the same test |
| `D109-S-swim` | the same test |
| `D109-T-run` | › "each builder carries coach's copy rule replacement texts as later rulings left them, as often as the table says, and no old text" |
| `D109-T-nrc` | the same test |
| `D109-T-bike` | the same test |
| `D109-T-swim` | the same test |
| `D109-R-HALF-MANNY` | › "no cardio card's note or detail breaks the copy rule, NRC Speed Run tables aside, on five fixtures" |
| `D109-R-run-base` | the same test |
| `D109-R-pace-goal` | the same test |
| `D109-R-bike` | the same test |
| `D109-R-swim` | the same test |

### `g206_d137_runbase_chi.js` (11 rows: 10 mapped, 1 dropped)

| Row | Held by |
|---|---|
| `L:3a283592` | DROPPED: era-row existence check (a `RUN_LABEL_BY_VERSION` row covers the artifact's ia-version). |
| `S1a` | `tests/integration/cardio-sessions.test.ts` › "run_base's Steady Aerobic Run reads the ruling's 16-week series and holds 20 min from week 13" |
| `S1b` | the same test |
| `S1c` | the same test |
| `S1d` | the same test |
| `S3` | the same test |
| `S2a` | › "the Table 6 hand transcription reproduces all 26 rows of guide B, both columns, and its tail rule" (rows 1 to 12 single pieces, the first "2 x" row is 13; skips by name without the doctrine) |
| `S2b` | the same test |
| `S2c` | › "exactly one run call site passes run_base the single-piece cap, and it is 12 (the row before Table 6's first "2 x")". The gate derived the 12 from the doctrine text at run time; the test types it from the hand table (and checks the hand table agrees), and the doctrine test above checks the hand table against the text. |
| `S4b` | › "the cap stays on run_base: a pace goal reads Table 6 rows 1 to 11 with cutbacks, and rows 13 and 14 as 2 x 12" |
| `S4c` | the same test |

### `g208_d103a_chip.js` (10 rows: 9 mapped, 1 dropped)

`tests/integration/run-session-class.test.ts` unless the row names the sweep (`tests/sweeps/run-session-class.test.ts`).

| Row | Held by |
|---|---|
| `A1` | › "both label eras of the LI and the SI, plain, Taper and re-entry, wear one chip and class as one in the run history" |
| `A2` | the same test |
| `A3` | › "a bike or swim CHI or INT, plain or Taper, keeps its CHI or INT chip" |
| `B0` | › "every keyed NSW run wears its ruled chip on the day and on the planned dose strip"; sweep › "the chip lattice: every keyed NSW run wears its ruled chip on the day and the strip, renamed or not" |
| `B1` | the same two tests |
| `B2` | the same two tests |
| `B4` | › "a keyed LI or SI renamed to the other's name, either era, or to a name no scan knows keeps its key's chip"; the sweep's chip lattice test |
| `C1` | › "NRC keeps its codes: Speed Run — Intervals wears INT, and both Speed Runs class as Interval" |
| `D2` | › "the test and the benchmark stay out of the run history" |
| `M1` | DROPPED: the HALF_MANNY digest against `MANNY_DIGEST_BY_VERSION`, held by `tests/integration/program-output.test.js` |

### `g208_d103a_key.js` (6 rows: 5 mapped, 1 dropped)

| Row | Held by |
|---|---|
| `K0` | `tests/integration/run-session-class.test.ts` › "the sample reaches every key, the budgeted long easy run, and both LI and SI heads plain and Taper"; sweep › "the key lattice: every key reached, every NSW run card keyed by its label, NRC, bike and swim unkeyed" |
| `K2b` | the same two tests |
| `K1` | › "every NSW run card carries the key its label goes with"; the sweep's key lattice test |
| `K2` | the same two tests |
| `K3` | › "NRC run, bike and swim cards carry no key"; the sweep's key lattice test |
| `K5` | DROPPED: the HALF_MANNY digest against `MANNY_DIGEST_BY_VERSION`, held by `tests/integration/program-output.test.js` |

### `g208_d103a_readers.js` (19 rows: 18 mapped, 1 dropped)

The sweep's readers test is
› "the readers' lattice: halfstep and easy mode act by key, strides park whole, the test eve rests, interference by key".

| Row | Held by |
|---|---|
| `H1` | `tests/integration/run-session-class.test.ts` › "halfstep cuts a keyed NSW run exactly when its key is int, chi, long or steady; never an easy run, the test or the benchmark"; the sweep's readers test |
| `H2` | the same two tests |
| `H3` | the same two tests |
| `E1` | › "easy mode parks a keyed NSW run exactly when its key is int, chi, long, steady, bench or trial, so no test survives"; the sweep's readers test |
| `E2` | the same two tests |
| `E3` | › "in easy mode an easy run is left as dealt but for its strides finisher, which goes whole, minutes and dose kept"; the sweep's readers test |
| `E5` | the same two tests |
| `E6` | the same two tests |
| `E3e` | › "in easy mode a training-day test eve is a rest day: no shakeout, no card, no lift"; the sweep's readers test. The gate compared each eve with V213's build of the same config (`git show bc3cccc`); the test types V213's result, a rest day with no card and no lift on every training-day eve, which the gate confirmed equal on 0.239.1. |
| `E4` | › "every protected easy run that carries a key carries easy, in easy and reduce mode"; the sweep's readers test |
| `E7a` | › "without an injury every " + Strides" run carries the whole finisher"; the sweep's readers test |
| `I1` | › "a keyed SI costs 1.4 and a keyed LI 1.05 plus the distance bump, by hand, whatever its label says"; the sweep's readers test |
| `I4` | the same two tests |
| `S1` | › "the week shape reads the speed days by key: the test is in no role, and a week whose only leg-load card is the test has no long run" |
| `S1b` | the same test |
| `S1c` | the same test |
| `L:0b3d9a6a` | › "swapping either quality label, to the other era's name or to a name no scan knows, moves no pace program"; sweep › "the rename surgery: no swap of either quality label moves any of the 180 pace programs" (the LI swaps) |
| `L:6a421523` | the same two tests (the SI swaps) |
| `M1` | DROPPED: the HALF_MANNY digest against `MANNY_DIGEST_BY_VERSION`, held by `tests/integration/program-output.test.js` |

### `g212_d110a_swim.js` (37 rows: 37 mapped)

`tests/integration/swim.test.ts` unless the row names the sweep (`tests/sweeps/swim.test.ts`). The integration file
runs the lattice claims on every seventh entry with each kind of goal reached; the sweep holds the gate's own counts
(at least 100 faster, 100 slower, 50 out of reach, 50 blank, 500 steps, 1,000 notes).

| Row | Held by |
|---|---|
| `L0` | › "the sample reaches every kind of goal: faster, at or slower than current, out of reach, no current time, a 0:00 entry"; sweep › "the swim time lattice builds 504 programs and reaches every kind of goal, at the counts the ruling measured" |
| `R1` | › "week 1 prints the anchor split, every split is on the hand model, and every step is within the rate"; sweep › "week 1 is the anchor split, every split is on the hand model within the rate, every repeat is the split less 2 s" |
| `R3a` | the same two tests |
| `R3b` | the same two tests |
| `R3c` | the same two tests |
| `R2` | › "every repeat split is the printed split less 2 s, in the detail and in the Main set (guide A p12)"; the sweep's `R1` test |
| `R4` | › "a goal at or slower than current holds at the anchor, and every INT note says so, and no other"; sweep › "goals at or slower than current hold at the anchor with the goal met note; out-of-reach notes quote a printed split" |
| `N2` | the same two tests |
| `N1` | › "an out-of-reach goal's note names a block target that a card of the same program prints"; the sweep's `R4` test |
| `N3` | › "with no current time every INT note opens with the default anchor line, and with one entered none says "No current""; sweep › "every blank or 0:00 anchor opens its notes with the default line; an entered one never says "No current"" |
| `N4` | › "no swim note says build to 10 or cap at 10, both rep notes say build to 8, and no note carries a dash"; sweep › "no swim note says build to 10 or cap at 10 or carries a dash, over the lattice and the distance goals" |
| `N5` | the same two tests |
| `R1k` | › "guide A p12's worked example: a 500 in 10:30 is a 2:06 split and a 2:04 repeat in week 1" |
| `L:691f71a2` | › "buildProgram leaves a swim time cfg byte-identical" (the gate's `CP`) |
| `P1n` | › "every distance swim INT note, alone or beside a run, is the distance note: build to 8"; sweep › "every distance swim INT note beside every other goal, three experiences and two seeds, is the distance note" |
| `D1` | › "a 100 goal with a 10:16 500, a 1:30 current 100 and a 1:20 goal: week 1 is 2:03 (616 / 5) with a 2:01 repeat, on the hand line" (both `D1` lines) |
| `D2` | › "a 100 goal slower than the current 100 holds at 2:03 with the goal met note" |
| `D3` | › "a 100 goal with no 500 on file starts from the 2:00 default and says so; with no 100 either it holds there" (both `D3` lines) |
| `D6` | › "a 100 goal's card says "two seconds under this week's 500 pace"; a 500 goal's keeps "goal split"; no dash" (the first 10 entries of each goal); sweep › "the 100 goal's cards say "500 pace" and the 500 goal's "goal split", on the first 30 of each" |
| `D7` | › "an out-of-reach 100 goal names the goal as "0:50 for 100yd", week 5 splits 1:51 (123.2 less 4 x 3), and the note quotes it" |
| `D8` | the same test (both `D8` lines) |
| `FL1` | › "the 100 goal floor: a gap at or past the advanced default holds at 1:35 with a 1:33 repeat, the anchor line and the goal met note" (both cases) |
| `GT1` | › "a seconds-only goal (0:55, minutes box empty) builds a progression from 1:00" |
| `SO1` | › "a seconds-only current 100 (0:58) is read as entered: the gap applies, no goal met note, no "No current"" |
| `SH0` | › "the goal sheet saves every swim goal switch, carries the pool unit, and writes exactly the hand table's current times" |
| `SH1` | the same test |
| `SH2` | the same test |
| `SH3` | › "a 100 goal switched to a 500 with no 500 on file prints the no current time line" |
| `SH4` | › "swimmer B rebuilt after a sheet change to 9:00 prints 100m repeats at 2:01 on a 2:03 split, and its program matches the snapshot" |
| `SH5` | the same test: the digest `a0f2e847ed9473d7` (coach's surgery print) is the golden value in `tests/snapshots/swim.json` |
| `SO2` | › "the goal sheet carries a seconds-only current 100, both limbs as stored" |
| `M2a` | › "_swimEntryState answers the hand table: the 500 prompt first, the 100 prompt, faster than, not a real time, ok" |
| `M2f` | the same test |
| `M2b` | › "doGenerate checks the swim entry before it shows the generate screen, and base500 has three write sites" |
| `M2c` | the same test |
| `M2d` | › "doGenerate refuses a 500 goal with no current time, saving nothing and toasting the prompt; with 10:16 it saves one program" (both `M2d` lines) |
| `M2e` | › "the swim label is "Your most recent timed <dist><unit>", and the 100 goal's 500 label and coach's line appear once" |

The gate's retired build-pair rows (`P0`, `P1`, `P2`, `D4`, `D5`, `GT1b`, `HM`) are not in the manifest.

### `g218_d157_swim_sizer.js` (10 rows: 10 mapped)

| Row | Held by |
|---|---|
| `U1` | `tests/integration/swim.test.ts` › "the unit entry, 0:55 against 0:59 typed as seconds alone, sizes as its m:ss twin: "needs 7 weeks" warned, 8 weeks built" |
| `U2` | the same test |
| `L1` | › "every seconds-only sizer entry sizes as its m:ss twin, weeks and warning byte for byte (advanced, 18-35)"; `tests/sweeps/swim.test.ts` › "the sizer lattice: all 7,560 seconds-only entries size as their m:ss twins, weeks and warning byte for byte" (both `L1` lines) |
| `L2` | › "every seconds-only full build equals its m:ss twin, and buildProgram leaves the cfg byte-identical (a sample)"; sweep › "the build lattice: all 192 seconds-only builds equal their m:ss twins, and no cfg is mutated" (both `L2` lines) |
| `Z1` | › "a 0:00 target sizes as no target (no time label), and a 0:00 current time as no current time" |
| `LB1` | › "the pace line and the step's first render show a seconds-only target as its m:ss twin, by hand: "<t> is <pace> per 100 <unit>."" |
| `LB2` | the same test. The text is D183's (from 223); D157's "<t> — <pace>/100 (<unit>)" (to 222) and the `IA_ASSUME_VERSION` lift are older arms and are not ported. |
| `OT1` | › "odd typed targets print their total at all three sites: 01:15, 00:55, 1.5:00, 1:30.5, 1:75" |
| `Z2` | › "a zero-total target hides the pace line and the first render, and sizes as no target with no warning" |
| `ST1` | › "a stored seconds-only program pinned at 7 weeks boots at 7 with every trained day as its ia_hist_ snapshot; a fresh generate sizes 8". The gate generated the stored program on V217 (`git show 7af6ad9`) and also checked what V217 stored (7 weeks, pin 7); those are past-build facts and are not ported. The test's stored record is the unit entry generated today with the pin V217 stored (`cfg._raceDateCappedWeeks` 7) and the 7-week grid that pin builds; the boot, the freeze and the clock are checked as the gate checked them. |

## Mutations

Mutations: not run (sabotage off). Parity rests on the row mapping above, the new tests passing on today's
`index.html`, and the runs against earlier releases listed under Discrimination.
