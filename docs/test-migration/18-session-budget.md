# Moved: session budget and accessory blocks (group 18)

Parity for phase 2 of the test migration (`docs/test-migration.md`, the parity rule): every manifest row of the nine
session budget gates, mapped to the new test that holds its claim or dropped with a written reason. The gates stay in
`tests/gates/` and keep running in CI until phase 3 deletes them.

The new tests assert what the app does today (0.239.1). Version predicates (`VER >= 231`), REFUSED arms and era-row
existence checks are not ported; their current arm is. Comparisons against the previous release (the gates' live
baseline ratchets) are not ported; the current values they compared are golden values in the snapshots.

Three ports change how a claim is read, not what it claims:

- **Counterfactuals on today's code, not on old releases.** g231's two gates built their before trees from V230
  (`git show 71c76d8`). The new tests take the ruled text back out of the app as it stands (`tests/support/session-budget.ts`
  `noCostLens()`, `noHipExtA()`, `noD195()`), and those trees reproduce every digest the D195 ruling printed:
  HALF_MANNY without part B `f5ed630033ebe3db`, without part A `0ac7da6b1691a8e1`, without both `0ac7da6b1691a8e1`;
  PRT TING without the cost lens `3a053a2ac8cb2b44`, without part A `1119727db3f37832`. The D195-B shard (V230 against
  B alone) reproduces V231's figures exactly on today's code (2,416 changed day cells, 3,290 items added, all on the
  budget-off card, one B-3 removal, one B-2 detail).
- **The frozen budget corpus is a file.** g197d's E5 captured its corpus from V196 out of git at run time; the tests
  job in CI checks out one commit, so the corpus is now `tests/snapshots/session-budget-corpus.json` (3,708 days, 256 KB:
  tables of distinct items, sections and cardio, section keys in their captured order, cardio cut to the five fields
  the budget reads). Replayed through today's app it gives the three era digests exactly (capSessionBudget `6be03983…`,
  `_setCount` `f5a34d9c…`, `_itemCost` `f026dbc4…`), now golden values in `tests/snapshots/session-budget.json`.
- **Source text checks read behaviour.** g197a's `_gear` fallback (A9, A10) is read from the denial census; g197c's
  `while(_total(out)>cap …)` and `if(!best) break` (E4m, E4n) and the tie-break text (E4c) from hand days; the hsets
  table (E4h to E4j) from built Calves blocks; g200's R5 and R6 predicates (D0a, D0b, E0a, E0b) from `swapLoadNote` and
  the swap sheet's tags. The text checks that anchor a counterfactual (the two pushes, the core clause, the floor (b)
  line, the budget call site) stay: `variant()` throws when one does not occur exactly once.

## Totals

- Rows: 188 over 9 gates (`tests/row_manifest.txt`).
- Mapped to a new test: 177.
- Dropped: 11:
  - a past build (a comparison against the previous release, or against V196 for D84's footprint; the current half is
    held by another row's test or by a snapshot): 7
  - HALF_MANNY digest, held by `tests/integration/program-output.test.js`: 4
- Mutations: not run (sabotage off).

## New files

Times on a loaded machine (load average 15 to 25), each file run alone.

- `tests/integration/session-budget.test.ts`: 20 tests, about 2.3 s. The hand sessions and trims, the posterior floor,
  the frozen corpus, a 48-cell census sample, D195-B's cost lens (PRT TING, HALF_MANNY, a 14-config shard sample).
- `tests/integration/compound-tier.test.ts`: 10 tests, about 1.1 s. D89 whole: the tier table, the load note, the swap
  sheet tags, the counterfactual and its 49-config lattice.
- `tests/integration/leg-accessory.test.ts`: 14 tests, about 2.6 s. The pool, the render surfaces, HALF_MANNY, a
  56-config sample of the leg accessory lattice and a 72-config sample of D84's comparison.
- `tests/integration/runner-armor-circuit.test.ts`: 17 tests, about 1.5 s. D195-A: HALF_MANNY, the hand lists and days,
  the typed cells, samples of floor (b) (42 configs) and of the prevention shard (23 programs).
- `tests/sweeps/session-budget.test.ts`: 16 tests, about 17 s (CI only). The 288-cell and 30-cell censuses, D195-B's
  650-config shard.
- `tests/sweeps/leg-accessory.test.ts`: 8 tests, about 14 s (CI only). The 3,528-config lattice.
- `tests/sweeps/leg-accessory-trim-order.test.ts`: 8 tests, about 26 s (CI only). D84's 1,728-config comparison.
- `tests/sweeps/runner-armor-circuit.test.ts`: 9 tests, about 13 s (CI only). Floor (b)'s 630 configs and the
  272-program prevention shard.
- `tests/snapshots/session-budget.json` (the corpus digests), `session-budget-corpus.json` (the frozen corpus, input),
  `session-budget-lattice.json`, `compound-tier.json` (HALF_MANNY without the core clause, `5770a4b1c4e2404d`, the
  legacy `MANNY_CORE_OFF_DIGEST_BY_VERSION` row), `leg-accessory-lattice.json`, `leg-accessory-trim-order.json`,
  `runner-armor-circuit-lattice.json`.
- `tests/support/session-budget.ts` (variants and pages, the census lattice and its V192 and V197 tables, the hand
  sessions, the corpus, D195's texts and shard), `tests/support/leg-accessory.ts` (the gear table, the lattice and
  sweep, D84's comparison), `tests/support/runner-armor-circuit.ts` (D195-A's typed tables, hand days, cells, floor (b)
  and the prevention shard).

The group's map names one file, `tests/integration/session-budget.test.ts`. Its claims are split by feature so each
file runs in a few seconds: the budget itself, the compound tier the budget skips, the leg accessory blocks, and the
runner armor circuit.

## Rows

### `g193_budget_floor.js` (23 rows: 18 mapped, 5 dropped)

| Row | Held by |
|---|---|
| `B1a` | `tests/integration/session-budget.test.ts` › "on the census sample: 18 core sections on every healthy program, no empty section, and the budget only removes"; `tests/sweeps/session-budget.test.ts` › "every healthy cell carries 18 core sections" |
| `B1b` | sweep › "core sections off the long-run days stay at or above the V192 census on every injury path (the run's days carved out by _longRunTier)" (the V192 floor the gate used with no baseline); the carve-out's denominators (2,808 long-run days, 270 core sections) pinned by › "the census matches tests/snapshots/session-budget-lattice.json (per tier, per class, thin core, the long-run carve-out)". The live-baseline lines (the same carve-out on both versions; no cell lost a core section against the previous release) are past-build comparisons, not ported. |
| `B2` | the integration census sample test; sweep › "no section renders with no items, on either lattice" |
| `B3` | sweep › "prehab never falls below the V192 census, per tier and in aggregate, on both lattices"; › "prehab outside the four D85 names stays at or above V197, and the D47 rail inside hip sections holds, on every tier"; the per-tier values the release ratchet compared are pinned by › "the census matches tests/snapshots/session-budget-lattice.json …" |
| `B4` | sweep › "non-optional deletions outside the isolation band stay at or under V192 on every tier" (D81: Leg isolation excluded on both sides, 72 per tier); the per-tier counts pinned by the snapshot test |
| `B4b` | DROPPED: past build. Report only: new non-optional deletions per cell against the previous release, never gated. The per-tier deletions today are pinned by the snapshot test. |
| `B4c` | the integration census sample test; sweep › "the budget empties no non-optional class outside the V192 class census" |
| `B4d` | DROPPED: past build. Report only: per-class deletion growth against the previous release, never gated. The per-class counts today are pinned by the snapshot test. |
| `B4e` | the integration census sample test; sweep › "the budget only removes: no section appears after it on any day" |
| `B4f` | DROPPED: past build. The non-optional trim order against the previous release's capSessionBudget. The order itself is held by `L:28c176a1`. |
| `B4g` | sweep › "the leg compounds are emptied no more often than V197 emptied them (D81)" |
| `B4g0` | the same test (41 + 855 = 896 asserted) |
| `B4g1` | DROPPED: past build. The live ratchet on leg compound emptyings against the previous release. Today's count (none) is pinned by the snapshot test's per-class table. |
| `B5` | sweep › "the census matches tests/snapshots/session-budget-lattice.json …" (thin core per tier and per injury path on the wide lattice, per tier on the narrow; report only in the gate, pinned now) |
| `B6` | `tests/integration/session-budget.test.ts` › "a program equals itself when built twice: HALF_MANNY on commercial and an injured wide cell" |
| `B6b` | the same test |
| `B6c` | DROPPED: past build. The baseline artifact equal to itself before any diff. Every counterfactual in the new files is built twice and compared the same way. |
| `L0` | sweep › "the census lattice is the ruled 288 cells and the narrow sweep 30, and every cell built" |
| `L0a` | the same test (the gate's opt-in 864-cell mode is not ported; the lattice in use is the ruled 288) |
| `L0b` | the same test |
| `L1` | the same test |
| `L:0b5eb763` | `tests/integration/session-budget.test.ts` › "an optional core block keeps its last item: the D48 hand session trims as hand-derived" |
| `L:28c176a1` | › "with no optional flag the same session trims in the hand-derived non-optional order" |

### `g197a_pool_static.js` (20 rows: 19 mapped, 1 dropped)

| Row | Held by |
|---|---|
| `A1` | `tests/integration/leg-accessory.test.ts` › "the pool is EXLIB.leg_accessory: the five machines and the four harvested names, nine in all; leg_iso is gone" |
| `A2` | the same test |
| `A3` | the same test |
| `A4` | the same test |
| `A5` | the same test |
| `A6` | the same test |
| `A7` | › "every tier, travel Room-only included, owns at least two members of the pool; with no gear at all it is the four harvested names" |
| `A8` | the same test |
| `A9` | › "on the sample no tier prints a machine or cable item it does not own (the filter is not advisory)"; `tests/sweeps/leg-accessory.test.ts` › "no tier prints a machine or cable item it does not own, and no leg machine reaches a tier without cables". The gate read `_gear`'s source for the fallback; the tests read what the fallback did. |
| `A10` | the same two tests (the filter still filters) |
| `A11` | › "the bodyweight sweep has nothing to substitute for a harvested name (D78)" (`_BW_GEAR` and `_BW_SUBS` read from the app, not parsed) |
| `A12` | the same test |
| `A13` | the same test |
| `A14` | the same test |
| `C1` | › "on the four render surfaces every item reaches the card as its own row with a name, and the 25-second hold prints" |
| `C2` | › "the blank-row detector is not blind: a nameless second item renders as a blank row" |
| `C3` | › "on the four render surfaces every item reaches the card as its own row with a name, and the 25-second hold prints" |
| `D1` | DROPPED: the row checks the shipped HALF_MANNY digest against `MANNY_DIGEST_BY_VERSION`; held by `tests/integration/program-output.test.js` › "program output matches tests/snapshots/program-output.json" (2d35e8f743680cfa) |
| `D2` | › "Leg isolation never opens on Mario's program, so no harvested name reaches him through that slot" |
| `D3` | the same test |

### `g197b_sweep.js` (27 rows: 26 mapped, 1 dropped)

Every row is held twice: on a 56-config sample in `tests/integration/leg-accessory.test.ts` and on all 3,528 configs
in `tests/sweeps/leg-accessory.test.ts`.

| Row | Held by |
|---|---|
| `B0` | integration › "on the sample every config builds, no item lacks a name, and the section still opens and carries a harvested name"; sweep › "the lattice is 3,528 configs and every one builds" |
| `B1` | the same integration test; sweep › "no item on any card lacks a name" |
| `B2` | the same integration test; sweep › "the Leg isolation section still opens, and carries a harvested name" |
| `B3` | the same two tests |
| `B4a` | integration › "on the sample no tier prints a machine or cable item it does not own (the filter is not advisory)"; sweep › "no tier prints a machine or cable item it does not own, and no leg machine reaches a tier without cables" |
| `B4b` | the same two tests |
| `B4c` | the same two tests |
| `B4d` | the same two tests |
| `B4e` | the same two tests |
| `B4f` | the same two tests |
| `B4g` | the same two tests |
| `B4h` | the same two tests |
| `B4i` | the same two tests (0); sweep › "the lattice counts match tests/snapshots/leg-accessory-lattice.json" (home_full's denials, the legacy `HF_LEAK_BY_VERSION` row) |
| `B4j` | the same (home_full's machine survivors: none) |
| `B4k` | the same (home_full's cable items: 0) |
| `B4l` | the same (home_full's cable survivors: none) |
| `B4m` | sweep › "no tier prints a machine or cable item it does not own, and no leg machine reaches a tier without cables"; the integration denial test |
| `B5a` | integration › "on the sample no name prints twice on one card, and every Wall sit in the section is n×25 sec"; sweep › "no name prints twice on one card, a harvested name least of all" |
| `B5b` | the same two tests |
| `B5c` | sweep › "the lattice counts match tests/snapshots/leg-accessory-lattice.json" (same-card duplicates 0, the legacy `B5C_BY_VERSION` row); the integration duplicate test |
| `B5d` | the same two duplicate tests |
| `B6a` | integration duplicate and Wall sit test; sweep › "Wall sit reaches the section and always prints n×25 sec, never a rep count" |
| `B6b` | the same two tests |
| `B7a` | integration › "on the sample the bodyweight section prints leg movements only, none of the old fallback's"; sweep › "the bodyweight section prints leg movements only, none of the old fallback substitutes" |
| `B7b` | the same two tests |
| `B7c` | the same two tests |
| `B8a` | DROPPED: the row checks the shipped HALF_MANNY digest against `MANNY_DIGEST_BY_VERSION`; held by `tests/integration/program-output.test.js` |

### `g197c_d84_cmp.js` (33 rows: 33 mapped)

The comparison app is the app with the two pushes swapped back (`tests/support/leg-accessory.ts` `isoFirst()`). Rows of
the sweep are held on all 1,728 configs in `tests/sweeps/leg-accessory-trim-order.test.ts` and, where marked, on 72 in
`tests/integration/leg-accessory.test.ts` (the sample test below):
› "on a sample of the comparison Calves never falls and does rise; only Calves and Leg isolation move; a changed day costs 0 to 4 sets more".

| Row | Held by |
|---|---|
| `E0a` | `tests/integration/leg-accessory.test.ts` › "Calves is pushed before Leg isolation: each push is one line, and on a built day Calves comes first" |
| `E0b` | the same test |
| `E0c` | the same test |
| `E0d` | the same test (and `isoFirst()` throws unless the pair occurs exactly once) |
| `E1a` | sweep › "the comparison lattice is the full 1,728-config product, every tier and injury state built on both apps"; the sample test |
| `E1b` | the same sweep test |
| `E1c` | the same sweep test |
| `E1d` | the same sweep test; the sample test |
| `E1e` | sweep › "Calves falls on no day and rises on some: D84 is in the app"; the sample test |
| `E1f` | the same two tests |
| `E2a` | sweep › "exactly two labels move, Calves up and Leg isolation down"; the sample test |
| `E2b` | the same two tests |
| `E2c` | the same two tests |
| `E3a` | integration › "the posterior chain detector sees a hinge or hip extension and not a leg isolation slot" (the three probes) |
| `E3b` | sweep › "every posterior-free leg cell the order creates is bodyweight, hypertrophy and low back protect, inside the ruling ceilings" |
| `E3c` | the same test (at most 120 cells) |
| `E3d` | the same test (at most 18 config keys) |
| `E3e` | sweep › "every posterior-free leg cell in the app, caused or not, carries low back protect, inside the ruling ceilings"; the sample test |
| `E3f` | the same sweep test (at most 186 cells) |
| `E3g` | the same sweep test (at most 33 config keys) |
| `E4a` | `tests/integration/session-budget.test.ts` › "the cap is 20 sets, declared once" |
| `E4b` | the same test |
| `E4c` | `tests/integration/session-budget.test.ts` › "a tie in score goes to the later position, whatever the label" |
| `E4d` | sweep › "a day the order changes costs 0 to 4 sets more, one Calves slot at most, never less"; the sample test |
| `E4h` | integration › "the Calves block is one item dosed 4 sets for an advanced athlete and 3 otherwise, so one slot costs at most 4 sets" |
| `E4i` | the same test |
| `E4j` | the same test |
| `E4k` | `tests/integration/session-budget.test.ts` › "the cap is 20 sets, declared once" (the cap read from the app) |
| `E4l` | sweep › "a day the order changes costs 0 to 4 sets more, one Calves slot at most, never less"; the sample test |
| `E4m` | `tests/integration/session-budget.test.ts` › "the trim stops at the first total at or under the cap: a day at 20 is untouched, 21 loses one item" |
| `E4n` | `tests/integration/session-budget.test.ts` › "when only the last hinge and a barbell compound are left, the day ships over the cap and nothing spins" |
| `E4o` | sweep › "days over the cap are older than D84: some are untouched by it, and they outnumber every day it changed"; the cap census pinned by › "the comparison counts match tests/snapshots/leg-accessory-trim-order.json" |
| `E4p` | the same two tests |

### `g197d_d84_base.js` (4 rows: 2 mapped, 2 dropped)

| Row | Held by |
|---|---|
| `E0` | `tests/sweeps/leg-accessory-trim-order.test.ts` › "the comparison lattice is the full 1,728-config product, every tier and injury state built on both apps" |
| `E1g` | DROPPED: past build. Calves falls on no day against the previous release. Its current half, Calves falls on no day against the app with the pushes swapped back, is `E1e`. |
| `E1h` | DROPPED: past build. D84's footprint against V196, read from git. Its current half, Calves rises against the swapped-back app, is `E1f`. |
| `E5` | `tests/integration/session-budget.test.ts` › "capSessionBudget, _itemCost and _setCount replay the frozen corpus to the digests in tests/snapshots/session-budget.json" (the corpus frozen as `tests/snapshots/session-budget-corpus.json`; the three era rows, current) |

### `g198_posterior_floor.js` (29 rows: 28 mapped, 1 dropped)

| Row | Held by |
|---|---|
| `A0a` | `tests/integration/session-budget.test.ts` › "the movements the floor cases rest on: tiers and patterns" |
| `A0b` | the same test |
| `A0c` | the same test |
| `A0d` | the same test |
| `A0e` | the same test |
| `A1a` | › "the day's only hinge survives a three-item trim (29 sets against 20)" |
| `A1b` | the same test |
| `A1c` | the same test |
| `A2a` | › "with two hinges the later one is trimmed and the last is held: the count is re-read every pass" |
| `A2b` | the same test |
| `A2c` | the same test |
| `A3a` | › "leg isolation is not posterior chain: a leg extension and a lying leg curl are trimmed like any finisher" |
| `A3b` | the same test |
| `A4a` | › "the day's only hip extension survives a three-item trim" |
| `A4b` | the same test |
| `A5a` | › "when only the last hinge and a barbell compound are left, the day ships over the cap and nothing spins" |
| `A5b` | the same test |
| `A5c` | the same test |
| `A5d` | the same test |
| `A6a` | › "the leg_iso exclusion: _pattern agrees with the hand table, and folding leg_iso into the floor moves no program here" |
| `A6b` | › "on built programs, a day that reaches the budget with posterior chain leaves with it, and the floor is exercised" (no budget call is offered a leg isolation machine) |
| `A6b0` | › "the leg_iso exclusion: …" |
| `A6c` | the same test |
| `B0` | › "on built programs, a day that reaches the budget with posterior chain leaves with it, and the floor is exercised" |
| `B1` | the same test |
| `B2` | the same test |
| `B3` | the same test |
| `B4` | the same test |
| `C1` | DROPPED: the row checks the shipped HALF_MANNY digest against `MANNY_DIGEST_BY_VERSION`; held by `tests/integration/program-output.test.js` |

### `g200_core_tier.js` (43 rows: 42 mapped, 1 dropped)

All in `tests/integration/compound-tier.test.ts`.

| Row | Held by |
|---|---|
| `A0a` | › "the 23 names declared core in _AUX_FAMILY are the hand table, and every one is tier 0" (read from `_AUX_FAMILY`, not parsed) |
| `A0b` | the same test |
| `A1` | the same test |
| `A2` | the same test |
| `B1` | › "D96's controls keep their tiers: the ruling selects a family, it deletes no tier" |
| `B2` | the same test |
| `B3` | the same test |
| `C1` | › "the clause lives in _compoundTier, not _isCompound: Pallof press is still a compound to _isCompound" |
| `C2a` | the same test |
| `C2b` | the same test |
| `C2c` | the same test |
| `D0a` | › "the load note speaks from a two-tier drop, and never on a swap off Pallof press" (the threshold read from behaviour: one tier down is silent, two tiers down prints the hand sentence) |
| `D0b` | the same test |
| `D1a` | the same test |
| `D1b` | the same test |
| `D1c` | the same test |
| `D2a` | › "without the clause Pallof press is tier 3 and the same swap reads the old load note" |
| `D2b` | the same test |
| `E0a` | › "the swap sheet tags HEAVY COMPOUND from tier 3 outside the main slot, never on Pallof press; MAIN LIFT wins the main slot" (the predicate and its threshold read off the sheet: a tier 2 lift is not tagged) |
| `E0b` | the same test |
| `E1` | the same test |
| `E2` | the same test |
| `E3` | the same test |
| `E4` | › "without the clause the sheet tags Pallof press HEAVY COMPOUND" |
| `F0` | › "without the clause Pallof press is tier 3 and the same swap reads the old load note" (the counterfactual is built from the one clause line) |
| `F1a` | › "HALF_MANNY without the clause matches tests/snapshots/compound-tier.json" (`5770a4b1c4e2404d`, the legacy `MANNY_CORE_OFF_DIGEST_BY_VERSION` row) |
| `F1b` | DROPPED: the row checks the shipped HALF_MANNY digest against `MANNY_DIGEST_BY_VERSION`; held by `tests/integration/program-output.test.js` |
| `F2a` | › "on the 49-config lattice exactly one cell moves, HALF_MANNY W11 Monday, in the ruled shape, and no day loses a core section" |
| `F2b` | the same test |
| `F2c` | the same test |
| `F3` | the same test |
| `F4a` | the same test |
| `F4b` | the same test |
| `F4c` | the same test |
| `F5` | the same test |
| `G0` | › "regional fatigue, the adjacent-day dedupe, the swap candidates and the add candidates decide the same with or without the clause" |
| `G1` | the same test |
| `G1d` | the same test |
| `G2` | the same test |
| `G3` | the same test |
| `G3d` | the same test |
| `G4` | the same test |
| `G4d` | the same test |

### `g231_d195_hipext.js` (6 rows: 6 mapped)

Each row is a conjunction; the version conjunct (`*-ver`) is not ported anywhere.

| Row | Held by |
|---|---|
| `D195-A-a` | `tests/integration/runner-armor-circuit.test.ts` › "HALF_MANNY's W1 to W12 Tuesday circuit carries Single-leg hip thrust 2×6–10 each @ RPE 7 after its three" (a-tue); › "without the fourth item every HALF_MANNY day is byte-identical: each W1 to W12 Tuesday less item 4, and every other day whole" (a-tue, a-other: against the app without part A, where the gate read typed V230 day hashes); › "the Tuesday calf and carry strings read YYY-YYY-YYY--- over the 14 weeks" (a-calf, a-carry); › "HALF_MANNY's swap universe is the 86 names, with the fourth item and without it" (a-uni); › "part A without part B is f5ed630033ebe3db, part B without part A is 0ac7da6b1691a8e1 (the ruling printed both)" (a-cfA, a-cfB). a-digest and a-era are the HALF_MANNY digest, held by `tests/integration/program-output.test.js`; a-inst re-read V230 (past build), and the counterfactuals reproducing the ruling's digests take its place. |
| `D195-A-b` | `tests/sweeps/runner-armor-circuit.test.ts` › "the shard is 264 programs (216 FULL, 48 injured) plus 8 bodyweight low back, each built on both apps, the before twice and equal" (b-notA, b-shard); › "part A appends one item to a runner's circuit and grows no circuit on a non-runner or knee protect day" (b-fourth, b-add, b-knee); › "part A takes only from the loaded carry finisher or the core block, and never empties the core block" (b-rem); › "the circuit's first two names and its rounds stay, the calf stays wherever it was, and non-runner leg days are byte-identical" (b-circ, b-calf, b-nonrun); › "the shard counts match tests/snapshots/runner-armor-circuit-lattice.json" (the A-4 tallies the gate printed); on 23 programs, `tests/integration/runner-armor-circuit.test.ts` › "on a sample of the prevention shard part A only appends one item to a runner's circuit, takes only from the carry or core block, and moves no universe". NOT-A is the app without part A (the gate built it as V230 plus slices 1, 4, 5 and 6). |
| `D195-A-c` | integration › "the regional trim reads a hard run at 1.4 interference" (c-hand); › "a four-item circuit and the calf pass the regional trim untouched with no cardio" (c-i); › "a three-item circuit with a leg isolation item (five moves, no four-item circuit) loses exactly one item" (c-ii); › "on a hard run day the circuit's fourth item leaves, and the lunge, hold, hinge and calf stay" (c-iii) |
| `D195-A-d` | integration › "the hand legs days total 20.5, 22 and 23.5 against a cap of 20" (d-fix); › "at 20.5 the budget takes Farmer carry, never the hold or the calf", › "at 22 the budget takes Farmer carry, then Plank shoulder taps, never the hold or the calf", › "at 23.5 the budget takes Farmer carry, then Plank shoulder taps, then Single-leg hip thrust, never the hold or the calf" (d-20.5, d-22, d-23.5); › "the two typed cells print the cards coach printed: a four-item circuit with the calf and no carry; Wall sit second of three" (d-cellA, d-cellB); › "without D195 the same two cells print the cards before it: three items, no carry, and on the second the hold and calf cut" (d-inst, on the app without parts A and B instead of V230) |
| `D195-A-e` | sweep › "the knee protect lattice is 630 configs, 126 per tier, 90 of them prevention, and every one builds on both apps" (e-anchor, e-lattice); › "floor (b) fires on home_full 84 of 126 and on no other tier" (e-home_full, e-others); › "floor (b) never fires on a prevention config" (e-prev); on 42 configs, integration › "on a sample of the knee protect lattice floor (b) fires on home_full only, and never on a prevention config" |
| `D195-A-f` | sweep › "the shard is 264 programs …" (f-shard); › "part A moves no name in any swap universe, and the bodyweight low back programs carry the bed hip thrust" (f-nonbw, f-bwlb, f-other: every universe equals the one without part A, where the gate compared with V230 and V230 plus the bed thrust); the integration shard sample test |

### `g231_d195b_cost.js` (3 rows: 3 mapped)

| Row | Held by |
|---|---|
| `D195-B-a` | `tests/integration/session-budget.test.ts` › "the cost lens prices the prehab rails at half, so PRT TING keeps what the ruling printed (W9 Tuesday and Monday)" (a-digest, a-tue, a-mon); › "without the cost lens PRT TING is the program the ruling measured before it, and 9 of 77 days differ" (a-cells, and a-v230 and a-before on the app without the lens: `3a053a2ac8cb2b44` and the before cards); › "the cost lens alone is PRT TING whole, and moves no byte of HALF_MANNY" (a-cfB) |
| `D195-B-b` | `tests/sweeps/session-budget.test.ts` › "the shard is 648 configs plus the two typed cells, every one built on all three apps" (b-surgery, b-bo, b-built, b-nonempty); › "every program in the shard equals itself on a second page, with and without the lens (every eighth config and the typed cells)" (b-self); › "the lens removes one item on the whole shard: B-3, a superset partner re-picked beside the restored Glute-ham raise" (b-removed, b-B3); › "every item the lens adds is on the same day of the budget-off card (B-1)" (b-added); › "the one detail the lens changes is B-2, and no day changes any other way" (b-detail, b-B2, b-other); the shard's tallies in › "the census matches tests/snapshots/session-budget-lattice.json …"; on 14 configs, integration › "on a sample of the shard the lens only adds back what the budget had cut, plus the two ruled changes" |
| `D195-B-c` | integration › "the cost lens alone is PRT TING whole, and moves no byte of HALF_MANNY" (c-cfB, c-bytes; c-inst on the app without parts A and B, `0ac7da6b1691a8e1`) |

## Not ported

- g193's opt-in 864-cell mode (`IA_LATTICE=full`), never run by `gate.sh`, and its report-only per-injury tables and
  print lines beyond the values the snapshot pins.
- g197c and g197d's worker fan-out (`G197_SHARDS`): tooling. The sweeps run in one process; CI has no wall budget.
- The gates' DEFER, N/A and REFUSE channels and their exit codes: legacy machinery for runs without a baseline.

## Mutations

Mutations: not run (sabotage off). Parity rests on the row mapping above and the new tests passing on today's
`index.html`. As a spot check, the four integration files run against older bodies (`IA_APP`): on V239 all 61 pass;
on V230 the D195 tests fail (session budget 5 of 20, the runner armor file at load) and the compound tier snapshot
(HALF_MANNY without the core clause moved with D195), and nothing else; on V196 the
posterior floor, the D195, the D84 and the leg accessory tests fail (session budget 10 of 20, leg accessory 9 of 14,
compound tier and runner armor at load).
