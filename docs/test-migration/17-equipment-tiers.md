# Group 17: equipment tiers and the exercise pool

Phase 2 parity for seven gates, 159 manifest rows (`tests/row_manifest.txt`). The legacy gates stay in place and keep
running in CI until phase 3 deletes the legacy suite; this file is the record that every row is held by a feature
test or dropped for a written reason (`docs/test-migration.md`, The parity rule).

New files:

- `tests/integration/equipment-tiers.test.js` (38 tests): every hand table (pools, patterns, injury matrices, the
  inventory and the tier copy, the implement classes, the wizard cards, the D47 trim session, the D49 identities, the
  D149 floors, the aux lens, D196's literals and typed Mains), and seeded samples of each lattice: the floor press and
  landmine lattice whole (72 builds), the shoulder-side lattice on 3 seeds, the gear lattice on one seed and one
  experience level, every 40th inventory config, the GHD lattice on its first seed, every 18th knee/protect config on
  the app and its three copies, the four D196 plans on the L432 bodyweight cells.
- `tests/sweeps/equipment-tiers.test.js` (36 tests, CI only): every lattice whole: the 960-program shoulder-side
  lattice, the 288-cell gear lattice (budget live and budget bypassed), the 3,000-config inventory lattice with its
  swap sheet and travel variants and the front squat lattices, the 760-config GHD lattice with its 110 travel
  variants, the 630-config knee/protect lattice on the app and its three copies, the 324 bodyweight cells and the
  1,008 race builds of D196.
- `tests/support/equipment-tiers.js`: the hand inventories (`GEAR_TIERS`, `OWNS`, `GHD_OWNS`), the gated and gear-free
  core members, the implement class read from a name, the hand floors of D149, the one-hand press table, the D193 cap
  table, the 82 older both-thrust days, D196's literals and typed Mains, every lattice and every survey.
  It reuses `tests/support/duplicate-movements.js` for the source-surgery loader and the frozen pattern lens.

No snapshot: every expected value in this group is a hand table, a typed card or a zero.

D196's (a″) clause read the pattern of a name through V230's `_pattern`; the new tests read the same classifier
frozen in `tests/support/duplicate-movements.js` (`frozenPattern`, unchanged from V218 through today, checked once).
The copies D149's rows need (each floor written out, the reservation probe) are made from the app under test by
`replaceOnce`, which fails unless each anchor occurs exactly once.

Totals: **159 rows: 156 mapped, 3 dropped** (2 HALF_MANNY digest rows held by `tests/integration/program-output.test.js`,
1 era-row existence check).

Mutations: not run (sabotage off).

## `g192_floorpress_shoulder_gear.js` (24 rows: 24 mapped)

All rows are held by `tests/integration/equipment-tiers.test.js`.

| Row | Held by |
|---|---|
| `G0a` | › "the floor press is the last member of both chest accessory pools, the earlier members unchanged" |
| `G0b` | the same test |
| `G0c` | the same test |
| `G0d` | › "the new names carry no mid-word hyphen, dash or brand" |
| `G1` | › "the landmine press prints only on barbell tiers, and the floor press on loaded tiers but never bodyweight" |
| `G2a` | › "the floor press is a horizontal press and is not leg work" |
| `G2b` | the same test (hpress is neither vertical nor hip extension) |
| `G3a` | the same test |
| `G3b` | the same test |
| `G3c` | the same test (the control) |
| `G4a` | › "shoulder/workaround swaps the dumbbell bench to the floor press, with no self-map, chain or self-eaten target" |
| `G4b` | the same test |
| `G4c` | the same test |
| `G4d` | the same test |
| `G5a` | › "the injury filter swaps the bench, prints an RPE cap on it, drops the floor press under protect, and leaves a healthy bench alone" |
| `G5b` | the same test |
| `G5c` | the same test |
| `G5d` | the same test |
| `G6a` | › "the landmine press prints only on barbell tiers, and the floor press on loaded tiers but never bodyweight" (a build that throws fails it) |
| `G6b` | the same test |
| `G6c` | the same test |
| `G6d` | the same test |
| `G7a` | › "the shoulder pool's no-barbell branch is EXLIB.shoulder without the landmine, in order" |
| `G7b` | the same test |

## `g192_landmine_rotpress.js` (20 rows: 20 mapped)

All rows are held by `tests/integration/equipment-tiers.test.js`.

| Row | Held by |
|---|---|
| `G1a` to `G1i` (9 rows) | › "the landmine press is a horizontal press; rotational core drills keep their own verdicts" |
| `G1z` | the same test |
| `G2a` | › "the landmine press ends EXLIB.shoulder and lives in no other pool" |
| `G2b` | the same test |
| `G3` | › "the injury plans treat the landmine press by doctrine: lowback drops it by name, shoulder and elbow through the press pattern" |
| `G3z` | the same test (no injury) |
| `G4a` | › "the landmine rule is exact-anchored live code above the core exemption, with exactly two name filters" |
| `G4b` | the same test |
| `G4c` | the same test. The licence's version predicate (`ia-version >= 221`) is gone; the authored D177 RR4 alternative inside `_REP_FLOOR` stays exempt on the same terms. |
| `G4d` | the same test |
| `G5` | › "the new names carry no mid-word hyphen, dash or brand" |
| `G6` | › "the lowback name filter leaves the rotational core drills alone" |

## `g192_shoulder_side.js` (16 rows: 16 mapped)

| Row | Held by |
|---|---|
| `L1-builds` | `tests/sweeps/equipment-tiers.test.js` › "the shoulder-side lattice builds whole (960 programs)" |
| `L2-lattice` | the same test |
| `S1-onehand-side` | sweep › "the heavy push Main pairing: every one-hand press prints a side, every time, and no two-hand movement claims one"; integration › "every one-hand press in the three shoulder slots prints a side, and no two-hand movement does (sample)" |
| `S1-onehand-reach` | the same two tests |
| `S1-twohand-noside` | the same two tests |
| `S1-twohand-reach` | the same two tests |
| `S2-onehand-side` | sweep › "the light push Main pairing: ..."; the integration sample test |
| `S2-onehand-reach` | the same two tests |
| `S2-twohand-noside` | the same two tests |
| `S2-twohand-reach` | the same two tests |
| `S3-onehand-side` | sweep › "the push Accessory superset: ..."; the integration sample test |
| `S3-onehand-reach` | the same two tests |
| `S3-twohand-noside` | the same two tests |
| `S3-twohand-reach` | the same two tests |
| `H1-halfmanny` | integration › "Mario's program prints a side on every one-hand shoulder prescription, and never hyphenates each" |
| `C1-copy-each` | the same test |

## `g193_gear_gates.js` (48 rows: 48 mapped)

Lattice rows are held twice: on 48 cells (seed 1013, intermediate) in `tests/integration/equipment-tiers.test.js` and
on all 288 in `tests/sweeps/equipment-tiers.test.js`. Thresholds set for the whole lattice (more than 3,000 items per
injury path, more than 3,000 core blocks, more than 120 anti-rotation blocks per tier) are asserted in the sweep only.

| Row | Held by |
|---|---|
| `L0` | integration › "the gear lattice sweeps all six tiers, 288 cells, 48 per tier" |
| `L0a` | the same test |
| `L0b` | sweep › "every gear-lattice cell builds, no item slot comes back empty, and each injury path is thick enough to judge" |
| `L0c` | integration › "the gear lattice sweeps all six tiers, 288 cells, 48 per tier" |
| `L0d` | the same test (the lattice in use is the ruled 288) |
| `L:e486fdea` (healthy) | sweep › "every gear-lattice cell builds, ..." (more than 3,000 items) |
| `L:bab5f966` (shoulder/protect) | the same test |
| `L:83435da7` (lowback/protect) | the same test |
| `L:00686ef1` (elbow/protect) | the same test |
| `G1` | sweep › "no gated core movement prints on a tier without its implement, on any injury path"; integration › "no gated core movement prints on a tier without its implement, and each still prints where legal (sample)" |
| `G1b` | the same two tests (landmine by name pattern) |
| `G1c` | sweep › "no gated core movement prints ..." (landmine per injury path) |
| `G2` | sweep › "every gated movement still prints on a tier that owns its implement, and every gear-free member prints on all six" |
| `G2b` | the same sweep test; the integration sample test |
| `G3` | sweep › "every core finisher draws at least one item, and each tier draws at least three rotational members it may own" |
| `G3a` | integration › "the set budget can be bypassed to read the core draw" |
| `G3b` | the sweep test above; integration › "every core finisher draws at least one item, and every tier draws three rotational members within its legal count (sample)" |
| `G3c` | the same two tests |
| `G4` | sweep › "a pulldown is a cable movement, and the lowback/protect pull slot is filled on every cable-less build" |
| `G4b` | the same test; integration › "a pulldown is a cable movement, and lowback/protect keeps a vertical pull on cable-less tiers (sample)" |
| `G5` | the same two tests (commercial keeps the straight-arm pulldown) |
| `G6` | the same two tests (per build) |
| `G6b` | sweep › "every build on every injury path pulls something" |
| `G7` | integration › "the five wizard equipment cards read verbatim, and the two D44 rewrote add no dash" |
| `G8` | sweep › "a tier prescribed band work names bands on its card; the banded prehab rail stays on home_full and crossfit"; integration › "a tier prescribed band work names bands on its card, and the banded prehab rail stays on home_full and crossfit (sample)" |
| `G9` | the sweep test (the six banded prehab names) |
| `G9b` | the same two tests |
| `G10` | integration › "the five wizard equipment cards read verbatim, and the two D44 rewrote add no dash" |
| `G10b` | the same test |
| `G11a` | integration › "over budget, an optional core finisher pays before the prehab rail; a fixed core section is protected (D47)" |
| `G11b` | the same test |
| `G11c` | the same test |
| `G11d` | the same test |
| `G11e` | the same test |
| `G11f` | the same test |
| `G12` | integration › "the anti-rotation pillar holds the hand-counted legal members on every tier (D49)" |
| `G12a` | the same test |
| `G12b` | sweep › "the Pallof press prints on every tier that owns bands" |
| `G13` | sweep › "the anti-rotation draw stays legal, never freezes on one pair, and mixes static with dynamic work on every tier"; integration › "the anti-rotation draw stays legal, varied and mixed static and dynamic on every tier (sample)" |
| `G13a` | the same two tests |
| `G13b` | the same two tests |
| `G14` | the same two tests |
| `G14a` | the same two tests |
| `G14b` | the same two tests |
| `G15` | sweep › "no card spells a D49 member in the singular"; integration › "the D49 members keep one storage identity and the dose they inherit" (on the sample) |
| `G15a` | integration › "the D49 members keep one storage identity and the dose they inherit" |
| `G15b` | the same test |
| `G16` | the same test |

## `g210_equipment_denials.js` (32 rows: 30 mapped, 2 dropped)

| Row | Held by |
|---|---|
| `O1` | integration › "the typed inventory agrees with every token the live tier copy states" |
| `O2f` | integration › "the implement class read from a movement name: the typed table holds" |
| `O2x` | sweep › "every printed name carrying an implement token has a class, and no name prints undefined"; integration › "no tier prints, keeps in its swap universe or offers on its swap sheet a thing it does not own (sample)" |
| `O3` | sweep › "the inventory lattice is 3,000 configs and builds whole" |
| `O3a` | sweep › "no tier prints an item of a class it does not own, on any surface, injury cells included"; the integration sample test. The gate's buckets (O3a slice 1, O3b slice 2, O3g and O3g5 the GHD, O3r the elbow renamer) attributed a count to the slice that owed it; every bucket is 0 today, and the test asserts every tier and class. |
| `O3b` | the same two tests |
| `O3g` | the same two tests (GHD is a class the inventory denies) |
| `O3g5` | the same two tests |
| `O3n` | the same sweep test (the ruling's named machines, by name) |
| `O3r` | the same two tests |
| `O3z` | the same two tests |
| `O4a` | sweep › "every program's swap universe and the swap sheet carry no name the tier does not own"; the integration sample test |
| `O4b` | the same two tests |
| `O4t` | sweep › "a travel variant's universe carries no name the tier does not own" |
| `O4g` | the universe, sheet and travel tests above (GHD is a denied class there) |
| `O5a` | sweep › "the denial selects: the removed names still print on commercial, the named replacements on older hypertrophy" |
| `O5c` | sweep › "every printed name carrying an implement token has a class, and no name prints undefined"; the integration sample test |
| `O5d` | sweep › "the denial selects: ..." |
| `O5e` | the same test |
| `O5g` | integration › "the swap sheet withholds the front squat under every shoulder and elbow plan, and offers it with none" |
| `L:408a4b34` (crossfit advanced 55+) | sweep › "advanced 55+ hypertrophy on crossfit and home_full draws one squat per program, goblet or front squat, both across seeds" |
| `L:ac4dc47a` (home_full advanced 55+) | the same test |
| `L:82e95cec` (crossfit below advanced 55+) | sweep › "older hypertrophy below advanced 55+ on crossfit and home_full squats the goblet only; commercial never draws a front squat" |
| `L:5f74f877` (home_full below advanced 55+) | the same test |
| `L:3d6ea12c` (commercial never a front squat) | the same test |
| `L:8ee6686d` (no front squat on a card) | sweep › "under a shoulder or elbow plan no front squat prints, sits in the universe or is offered, and the squat slot is kept" |
| `L:b2d88bf7` (the squat slot is kept) | the same test |
| `L:ef4e20ae` (no front squat in the universe) | the same test |
| `L:ae472a85` (the sheet never offers it) | the same test |
| `O6` | DROPPED: the HALF_MANNY digest against `MANNY_DIGEST_BY_VERSION`, held by `tests/integration/program-output.test.js` |
| `O6r` | DROPPED: an era-row existence check (the harness row for the version under test exists) |
| `O6u` | integration › "HALF_MANNY's swap universe holds 86 names: commercial owns everything, so the lens removes none" |

## `g215_d149_ghd.js` (15 rows: 14 mapped, 1 dropped)

| Row | Held by |
|---|---|
| `G1` | sweep › "no tier without a GHD prints, keeps in its universe, offers or travels with a station name"; integration › "no GHD station name prints, sits in the universe or is offered on a tier without one (sample)" |
| `G1v` | sweep › "commercial and crossfit still print, carry and offer the station"; the integration sample test |
| `G1h` | sweep › "hip/protect's universe carries 45° back extension where the station is owned, Bodyweight back extension where it is not" |
| `G2` | sweep › "no tier without a GHD ..." (universe) and › "commercial and crossfit still ..."; the integration sample test |
| `G3` | the same sweep tests (the swap sheet); the integration sample test |
| `G4` | sweep › "no tier without a GHD ..." (travel variants), › "the GHD lattice and its travel variants build whole" |
| `L1` | integration › "the aux swap lens reads the GHD station as the inventory does, on every tier" |
| `F0` | integration › "the hand table puts both knee/protect floors on home_full and nowhere else" |
| `F1` | sweep › "each knee/protect floor fires on home_full and on no other tier (copies with the floor written out)"; integration › "the knee/protect floors fire on home_full only, and its Main and Leg superset B stay in the hand sets (sample)" |
| `F1o` | sweep › "the knee/protect legs Main and Leg superset B hip extension stay in the hand sets, and home_full reaches both floors"; the integration sample test |
| `F2` | the floor tests above |
| `F2o` | the hand-set tests above |
| `P1` | sweep › "the knee/protect hip-extension reservation empties only on support_prevention reads, where no Leg superset B is built" (the form from 231 on; the earlier arm was a version predicate) |
| `K3` | sweep › "no knee/protect day prints the same movement twice"; the integration sample test |
| `L:793e1c6e` (HM) | DROPPED: the HALF_MANNY digest against its era row, held by `tests/integration/program-output.test.js` |

## `g231_d196_bwfallback.js` (4 rows: 4 mapped)

| Row | Held by |
|---|---|
| `D196-a` | sweep › "no bodyweight Main and no race Primer is Burpees, and no capped hip extension lands on an uncapped name" (a-main, a-primer, a-a2), › "a stamped, reused app builds every probe cell as a plain fresh one does" (a-lens); integration › "the frozen lens reads the ruled names as the D196 measure printed them, and lowback caps hip extension" (a-pat), › "on the four D196 plans, no Main is Burpees, no capped hip extension lands uncapped, and no card holds both thrusts (sample)". V230's figures (a-inst) were a past build. |
| `D196-b` | sweep › "no card on the four D196 plans holds both thrusts, the 82 older both-thrust days are unchanged, and no two adjacent days share the bridge" (b-thrust, b-thrustset, b-adj), › "each D196 plan prints its landing name" (b-cover); b-burpees is D196-a's test. V230's reading (b-inst) was a past build. |
| `D196-c` | integration › "the five typed bodyweight cells read the ruled Mains, never Burpees". V230's Burpees cards (c-inst) were a past build. |
| `D196-d` | integration › "the app carries each of D196's five literals exactly once" (the d-cfW5 conjunct on the app); the HALF_MANNY digest (d-digest) is `tests/integration/program-output.test.js`'s. The era row (d-era), the W5-alone digest built on V230 (d-cfW5) and V230's own digest (d-inst) were the legacy machinery and a past build. |
