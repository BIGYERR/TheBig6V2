# Group 14: deload weeks

Phase 2 parity table (`docs/test-migration.md`, the parity rule). Rows are from `tests/row_manifest.txt`. The legacy
gates stay in `tests/gates/` and keep running in CI until phase 3.

New files:

- `tests/integration/deload.test.js` (17 tests): the hand oracles and their probes, the stage recorder proved inert,
  HALF_MANNY's deload-off counterfactual digest, the D93/D94 pull census on its 60-config mini lattice, and the D91
  census on a 76-config sample of its lattice (every 23rd key).
- `tests/sweeps/deload.test.js` (11 tests): the D91 census over its whole 1,728-config lattice, both arms (shipped and
  `globalThis.__DELOAD_OFF`), about a minute.
- `tests/support/deload.js`: the hand posterior and vertical-pull tables, the deload loop's four candidacy tests, the
  stage recorder (a copy of the app with the day-assembly statement split into p1, p2, p3; `tests/support/app-copy.js`),
  both lattices, both censuses, and `matchSnapshotKey` (one golden file with a key per owning test; see below).
- `tests/snapshots/deload.json`:
  - `half-manny deload-off digest`: `145c60296526a949` (`MANNY_DELOAD_OFF_DIGEST_BY_VERSION`, the phase 1 leftover);
  - `pull lattice positive-limb cards`: 138 (`SWAP_BY_VERSION`, `g200_pull_arbitration.js`);
  - `D91 lattice counts`: the current rows of `DELOAD_ARB_BY_VERSION` (zero-posterior weeks 240, of them non-deload
    240, deload-off zero deload weeks 0, byte-identical deload weeks 17, Leg superset B removed by the regional cap 18),
    `E6_BY_VERSION` (28) and `DELOAD_HINGE_BY_VERSION` (E1a 12,372, E1b 9,322, E3 44, G5 `{Explosive finisher: 44}`,
    G1 1,275).

`tests/support/snapshot.js` compares a whole file, and the deload golden values have two owners (the integration file
and the CI sweep), so `tests/support/deload.js` adds `matchSnapshotKey(feature, key, value)`: each test compares and,
under `UPDATE_SNAPSHOTS=1`, rewrites only its own key. `tests/support/snapshot.js` is unchanged.

Paths below are under `tests/`; `I` is `integration/deload.test.js`, `S` is `sweeps/deload.test.js`.

## `g199_deload_arbitration.js` (54 rows)

| Row | Held by |
|---|---|
| `A1` | I › "the stage recorder is inert: the staged copy builds the same programs as the app" (`appCopy` throws unless the assembly anchor occurs once) |
| `A2` | I › "the stage recorder is inert: the staged copy builds the same programs as the app" |
| `A3` | S › "the lattice is the ruled 1,728 configs: 17,856 weeks, 2,880 of them deload weeks, 15,360 deload day builds" |
| `A4` | I › "the hand posterior oracle reads its 17-name probe as typed, four of the negatives pull-side" |
| `A5` | I › "the four candidacy tests read the hand-typed sections as typed, and the pull family lands on candidate" |
| `B1` | DROPPED: the shipped HALF_MANNY digest (`MANNY_DIGEST_BY_VERSION`), held by `integration/program-output.test.js` |
| `B2` | I › "Mario's program with the deload pass off builds the deload-off digest, and the deload moves it" (golden `half-manny deload-off digest`) |
| `B3` | I › same |
| `C1` | S › "the counts later rulings pinned per release hold their golden values" |
| `C2` | S › "no deload week ships zero posterior chain; the zero weeks are all non-deload weeks and none goes the wrong way"; I › "no deload week ships zero posterior chain, and none ships less than it would with the deload off" |
| `C3` | S › "the counts later rulings pinned …"; S › "no deload week ships zero posterior chain; …" |
| `C4` | S › "no deload week ships zero posterior chain; …"; I › "no deload week ships zero posterior chain, …" |
| `C5` | S › "the counts later rulings pinned …" |
| `C6` | S › "no deload week ships zero posterior chain; …"; I › same as C4 |
| `D1a` | S › "the lattice is the ruled 1,728 configs: …" |
| `D1b` | S › same |
| `D2` | S › "the counts later rulings pinned …"; S › "non-deload weeks are byte-identical with the deload on and off; deload weeks almost all differ" |
| `D3` | S › "non-deload weeks are byte-identical …"; I › "weeks that are not deload weeks are byte-identical with the deload on and off" |
| `E1a` | S › "the counts later rulings pinned …" |
| `E1b` | S › same |
| `E2` | S › "the deload still cuts: the off arm cuts nothing, the on arm cuts every cut from an Explosive finisher, keeping its Main"; I › "the deload-off arm cuts nothing, and outside tier B long-run days …" |
| `E3` | S › "the counts later rulings pinned …" |
| `E4` | S › "the deload still cuts: …" (60) |
| `E5` | S › same (60) |
| `E6` | S › "the counts later rulings pinned …" |
| `F1` | S › "accessory-block conservation: the deload swaps which leg block survives and adds no sets" |
| `F2` | S › same |
| `F3` | S › same |
| `F3b` | S › same |
| `F3c` | S › same |
| `F4` | S › same; I › "every deload card keeps exactly one accessory block where one was offered, and never two" |
| `F5` | S › same; I › same |
| `G1` | S › "the counts later rulings pinned …" |
| `G2` | S › "Leg isolation and Explosive finisher: what the deload drops, and what it was holding" |
| `G2b` | S › same |
| `G3` | S › same |
| `G4` | S › same |
| `G4b` | S › same |
| `G5` | S › "the counts later rulings pinned …"; S › "the deload still cuts: …" (the census holds Explosive finisher alone, equal to E3); I › "the deload-off arm cuts nothing, and outside tier B long-run days …" |
| `H1` | S › "the trap (a posterior Main, no posterior accessory) and the swap (A gives way to B) are two disjoint populations" |
| `H1b` | S › same |
| `H2` | S › same |
| `H3` | S › same; I › "a posterior Main with no posterior accessory still keeps one accessory block, under both lenses" |
| `H4` | S › same; I › same |
| `H5` | S › same |
| `H6` | S › same; I › same |
| `I1` | S › "nothing downstream of the deload takes back a swap card's posterior chain"; I › "a swap card the deload keeps is not emptied downstream, …" |
| `I2` | S › same; I › same |
| `I2b` | S › same; I › same |
| `I3` | S › "the counts later rulings pinned …" |
| `J1` | S › "the deload cuts in place on every deload card, and does cut some"; I › "the deload cuts sections in place: …" |
| `J2` | S › same; I › "the sample holds deload weeks, swap cards and cards the deload cut" |
| `J3` | S › same; I › "the deload cuts sections in place: …" |
| `P0` | S › "this lattice cannot see the pull swap: no deload card here enters with a posterior Pull superset B" |

## `g200_pull_arbitration.js` (18 rows)

| Row | Held by |
|---|---|
| `A1` | I › "the stage recorder is inert: …" (the same recorder records the pull lattice) |
| `A2` | I › same |
| `A3` | I › "the pull lattice is 60 configs, 5,120 day builds, 1,120 of them deload day builds" |
| `A3b` | DROPPED: repeats `A3c`/`A3d`. It checked that the legacy measure module `tests/measure/v200_g200_pins.js` still declared the lattice's sizes; the lattice is now typed once, in `tests/support/deload.js`, and its sizes are asserted by the test that holds `A3c` and `A3d` |
| `A3c` | I › "the pull lattice is 60 configs, 5,120 day builds, 1,120 of them deload day builds" |
| `A3d` | I › same |
| `A4` | I › "the hand posterior oracle reads its 17-name probe as typed, four of the negatives pull-side" |
| `A5` | I › "the four candidacy tests read the hand-typed sections as typed, and the pull family lands on candidate" |
| `A6` | I › "the hand vertical-pull oracle reads its 14-name probe as typed: rows, face pulls and pullovers are not pulls from overhead" |
| `B1` | DROPPED: the shipped HALF_MANNY digest, held by `integration/program-output.test.js` |
| `P1` | I › "the deload swaps which pull block survives and adds none: 1,470 pull-family sections after the deload" |
| `P2` | I › "on every deload day offering both pull blocks exactly one survives, and it is A unless B holds posterior and the Main does not" |
| `P2c` | I › "the positive limb is one movement, the conditioning swing, and every such card keeps its vertical pull to the shipped card" (golden `pull lattice positive-limb cards`) |
| `P2c-floor` | I › "on every deload day offering both pull blocks …" (the positive limb is exercised at least once) |
| `P2d` | I › "the positive limb is one movement, …" |
| `P4` | I › same |
| `P6` | I › same |
| `P7` | I › same |

## Totals

- Rows: 72 (`g199` 54, `g200` 18). Mapped 69, dropped 3: 2 HALF_MANNY digest rows held by `program-output.test.js`
  (`g199` `B1`, `g200` `B1`) and 1 repeat of another row of this move (`g200` `A3b`).
- Mutations: not run (sabotage off).
- Pass: `node --test tests/integration/deload.test.js` 17 of 17, about 3 s; `node --test tests/sweeps/deload.test.js`
  11 of 11, about 50 s.
