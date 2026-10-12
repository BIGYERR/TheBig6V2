# Group 15: core and trunk blocks

Phase 2 parity table (`docs/test-migration.md`, the parity rule). Rows are from `tests/row_manifest.txt`. The legacy
gates stay in `tests/gates/` and keep running in CI until phase 3.

New files:

- `tests/integration/core-trunk.test.js` (23 tests): the rotational pillar's own clock, the protect-tier trunk block,
  the trunk floor at the function contract, the core-off counterfactual digest, and the seed 76308 slice of the
  288-cell trunk-floor lattice.
- `tests/sweeps/core-trunk.test.js` (1 test): the whole 288-cell trunk-floor lattice.
- `tests/support/core-trunk.js`: the hand tables (pillar members and rotation order, tier inventories, the session cost
  model, the long-run tiers, the race window) and the readers.
- `tests/snapshots/core-trunk.json`: the core-off digest of HALF_MANNY, `5770a4b1c4e2404d` (the engine with the D89
  family-core clause removed, built from a copy of the app; `tests/support/app-copy.js`).

Paths below are under `tests/`; `I` is `integration/core-trunk.test.js`, `S` is `sweeps/core-trunk.test.js`.

## `g193_d50_trunkfloor.js` (14 rows)

| Row | Held by |
|---|---|
| `O1` | I › "the session budget is the published 20 sets the hand cost model is typed against" |
| `U1` | I › "a day over budget keeps exactly one trunk item: the floor holds the last one and no more" |
| `U2` | I › "a day over budget keeps exactly one trunk item: the floor holds the last one and no more" |
| `U3` | I › "trunk relocated into one section is still floored by items, not labels" |
| `U4` | I › "the floor is inert on an NRC long-run tier day: the run owns the day" |
| `U5` | I › "the floor is inert on race day and on the time trial that is race day" |
| `U6` | I › "a day under budget comes back unchanged: the floor adds nothing and removes nothing" |
| `U7` | I › "a day whose only trunk section is anti-extension is floored too: the floor reads the whole trunk family" |
| `L:94e42918` (lattice swept: 288 cells) | S › "the trunk floor holds on every day of the 288-cell lattice"; I › "the trunk-floor sample: …" (96 of them) |
| `L:0bb902dd` (the sweep is big enough) | S › "the trunk floor holds on every day of the 288-cell lattice" (more than 20,000 day builds) |
| `L1` | S › "the trunk floor holds on every day of the 288-cell lattice"; I › "the trunk-floor sample: …" |
| `L2` | S › same; I › same |
| `L3` | S › same; I › same |
| `L4` | S › same; I › same |

## `g193_rotation_reach.js` (9 rows)

| Row | Held by |
|---|---|
| `R0` | I › "the rotational power pillar holds its seven members in the hand-typed rotation order" |
| `R1` | I › "the rotational power pillar holds its seven members in the hand-typed rotation order" |
| `R2` | I › "on a hot-tomorrow day the rotational pair walks the pillar by its own turn count (hand table, commercial)" |
| `R3` | I › "on a clear-runway day the rotational pair walks the pillar on its three-way clock (hand table, commercial)" |
| `R4` | I › "the hot-tomorrow pair takes every value its tier legal list allows over twelve weeks, never one frozen pair" |
| `R5` | I › "every gear legal rotational member is reachable on its tier, and the cable chop prints on the cable tier" |
| `R6` | I › "every gear legal rotational member is reachable on its tier, and the cable chop prints on the cable tier" |
| `R7` | I › "the rotational draw is not the first two members forever, and both own-turn clocks are in the draw (source)" |
| `R8` | I › "the rotational draw is not the first two members forever, and both own-turn clocks are in the draw (source)" |

## `g193_trunk_protect.js` (17 rows)

| Row | Held by |
|---|---|
| `O5` | I › "the anti-rotation and anti-extension pillars hold the hand-typed members in rotation order" |
| `O6` | I › "every tier keeps at least two anti-rotation names the anti-extension section cannot claim (hand count)" |
| `L:88fb6aeb` (lattice thick enough) | I › "the protect-tier trunk lattice is thick enough to see the seam, and no card prints either trunk section twice" |
| `G1a` | I › "a band movement never prints on a tier without bands, and still reaches every tier that owns one" |
| `G1b` | I › "a band movement never prints on a tier without bands, and still reaches every tier that owns one" |
| `G1c` | I › "the protect-tier anti-rotation draw carries no loaded carry on any tier" |
| `G2a` | I › "one card, one movement: no trunk name prints twice across the two trunk sections or anywhere else on the day" |
| `G2b` | I › same |
| `G3a` | I › "the trunk block never prints a hole, an empty section, or loses its anti-rotation section" |
| `G3b` | I › same |
| `G3c` | I › same |
| `G3d` | I › same (one-item anti-rotation sections at or under 8%) |
| `G4a` | I › "the trunk block is drawn from the hand-derived rotation in order, and a collision moves the anti-rotation pick" |
| `G4b` | I › same |
| `G4c` | I › same |
| `G4d` | I › same |
| `G5` | I › "a band movement never prints on a tier without bands, and still reaches every tier that owns one" (Pallof press on bodyweight and minimal: 0) |

## Also held here

`g200_core_tier.js` row `F1a` (the core-off counterfactual digest, `MANNY_CORE_OFF_DIGEST_BY_VERSION`) is held by
I › "with the family-core clause removed, Mario's program builds the core-off digest, and the clause moves it", with the
digest in `tests/snapshots/core-trunk.json`. The other 42 rows of `g200_core_tier.js` belong to group 18 (session budget)
and move with it.

## Totals

- Rows: 40. Mapped 40, dropped 0.
- Mutations: not run (sabotage off). Before the switch was turned off, the 21 group 15 mutations whose anchor occurs
  once in `index.html` were applied to scratch copies once and all 21 made a new test fail; that run is not part of
  this proof.
- Pass: `node --test tests/integration/core-trunk.test.js` 23 of 23, about 2 s; `node --test tests/sweeps/core-trunk.test.js`
  1 of 1, about 3 s.
