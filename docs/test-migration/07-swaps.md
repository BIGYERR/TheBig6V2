# Group 7: swaps and undo

Phase 2 parity for eight gates, 80 manifest rows (`tests/row_manifest.txt`). The legacy gates stay in place and keep
running in CI until phase 3 deletes the legacy suite; this file is the record that every row is held by a feature
test or dropped for a written reason (`docs/test-migration.md`, The parity rule).

New files:

- `tests/integration/swaps.test.js` (41 tests): the swap sheet, the card it prescribes and its toast (D177, D193's
  hold), undo (D177 R4, D192), the boot replay of the athlete's chains (D181 R4'), the cue (D190), and the build-time
  swap preference (D190 build path). Hand fixtures, and seeded samples of each lattice.
- `tests/integration/swap-durability.test.js` (9 tests): D181, a swap stays made until undone (rows 1 to 10 of the
  durable gate), on a sample of each lattice.
- `tests/integration/sport-swap.test.js` (18 tests): D213 and D214, the sport chip on a cardio day.
- `tests/sweeps/swaps.test.js` (18 tests, CI only): every lattice whole: the D177 floor lattice (every Main and Power
  pair of 384 configs), the chain walk (eight configs, W3 and W5, every day), every chain off the four natively cued
  items, the 504-cell durability lattice with its 42 and 36 cell siblings, every preference build, the 96-row sport
  chip matrix.
- `tests/snapshots/swaps.json`: the current golden values the sweep compares: how many floor pairs D193's hold moves
  against D177's own card and toast (839, 0, 172, 263, 205, 199, 1,253 and the bed thrust donor's 7, 4, 3, 10, the
  legacy `D193_PIN_V231` and `BED_PIN_V231` rows), and the program digests of the injured lattice (the six workaround
  configs equal the legacy hand table `D193_DIGEST`; Mario uninjured equals V226's digest, checked once against
  `637bc8e`).
- `tests/support/swaps.js`, `tests/support/sport-swap.js`: the fresh-page boot model, the sheet-checked hop, the chain
  walk and runner, the hand oracles (floor table, window rewrite, toasts, cue, hold, cap table), the floor lattice, the
  durability world, the preference population, the sport chip world and matrix.

The group's map names one file, `tests/integration/swaps.test.js`. Its claims are split across three integration files
so each runs in a few seconds (swaps 3.7 s, swap durability 1.4 s, sport swap 0.9 s on a loaded machine), one per
feature: the swap sheet and undo, durability across a reboot, and the sport chip.

Totals: **80 rows: 72 mapped, 8 dropped** (7 past-build pair rows against V221 or V226, 1 HALF_MANNY digest row).

## `g221_d177_swapfloor.js` (22 rows: 22 mapped)

Lattice rows are held twice: on six L1 configs in `tests/integration/swaps.test.js` and on all 384 in
`tests/sweeps/swaps.test.js`, whose snapshot also pins the moved counts the gate pinned at 231 and up.

| Row | Held by |
|---|---|
| `G1a` | `tests/integration/swaps.test.js` › "Mario's W5 Thursday box squat swapped to a goblet squat moves the reps to 8 to 12 and says why" |
| `G1b` | the same test (the toast) |
| `G2` | › "the rep floor table, by movement" |
| `G3a` | › "a swapped Main card is the donor beneath its hold, with the window applied, and the hold on a capped target"; sweep › "every swapped Main card is D177's card on the donor beneath its hold, held on a capped target", › "the floor lattice and the injured lattice programs match tests/snapshots/swaps.json" (839) |
| `G3b` | › "no swapped Main lands under its window"; sweep › "no Main lands under its window, no power dose moves beyond the cue, swap then undo is byte-identical" |
| `G3c` | › "a power swap never changes the dose beyond the cue" and the card test above (off grammar); the same sweep tests and the snapshot (power 0, off grammar 172) |
| `G3d` | the card test; the sweep card test and the snapshot (263) |
| `G3e` | the card test; the sweep card test and the snapshot (205) |
| `G3f` | the card test; the sweep card test and the snapshot (199) |
| `G4b` | › "a core rotation and a renegade row carry their detail verbatim"; sweep › "Landmine rotations and Dumbbell renegade rows carry their detail verbatim wherever they appear". The gate compared against V220's `_swapDetailFor`; V220 returned every such detail unchanged on the lattice (353 rotations, 674 renegade rows, checked once), so the current claim is verbatim. |
| `G4c` | the same two tests |
| `G5a` | › "swap then undo puts the day back byte for byte, on every Main and Power pair"; the sweep's byte-identical test |
| `G5b` | › "Close-grip bench press swapped to Dips and undone gives the donor back"; the same sweep test |
| `G5c` | › "on a day carrying the same lift twice, undo puts both cards back: one tap, both taps, a boot replay" |
| `G5d` | › "undo of a legacy record with no rx puts the name back, throws nothing and clears the record" |
| `G6a` | › "the swap toast names the window when it fires, the V119 line on a converted unloadable swap, the hold sentence on a clamp"; sweep › "every swap toast is the hand toast for its kind, and every hold clamp says so" and the snapshot (1,253, bed thrust 10) |
| `G6b` | › "home_basic Dumbbell decline press to Dips keeps the V119 line and drops the rep target" |
| `G6c` | › "home_basic Dumbbell Romanian deadlift 4×6 to a kettlebell single-leg deadlift carries verbatim: "Same job, same numbers."" |
| `G7-1a` | › "a swap preference in the config prints the window on every week it lands, on a build and on a reboot with W1 frozen" |
| `G7-1b` | › "the injury filter still runs after a preference: Box jumps lands when healthy and never on a knee workaround ("Jumps are out.")" |
| `G7-2a` | › "a day restored from an ia_hist_ snapshot at 4×3 and swapped again shows the window live" |
| `G8b` | › "the add path fallback is 3×10 — RPE 7, in the Main grammar and at or above every window, so no window moves it" |

## `g222_d181_chain.js` (8 rows: 6 mapped, 2 dropped)

| Row | Held by |
|---|---|
| `5` | `tests/integration/swaps.test.js` › "box squat to goblet squat to leg press boots as the last live card, and two undos walk back one step each" |
| `5c` | › "a two-step cycle back to the box squat boots as the last live card, twice" |
| `5L` | › "an untouched one-slot chain boots as the last live card, name and detail"; sweep › "untouched chains boot as the live card (one slot) and the live day (two slots)". The residue licence the gate held for eras 222 to 226 is gone: residue 0. |
| `5X` | › "an untouched chain across two slots boots as the whole live day"; the same sweep test |
| `8` | › "a touched day boots byte for byte as its ia_hist_ record, with no name twice, whether touched before or after the chain"; sweep › "a touched day boots byte for byte as its ia_hist_ record, every class, touched before or after the chain". Modes t1 and t2; the gate's three `up_` modes acted on V221 and are dropped with 9a and 9b (past build). |
| `8d` | the same two tests (no name twice) |
| `9a` | DROPPED: past build. It compared the candidate's boot with V221's boot of the same storage (the accepted `up_ts` trade on D181's build pair). |
| `9b` | DROPPED: past build. Its fixture is storage V221 wrote (touch, then a chain V221 did not fold into the snapshot). The current claim it carried, that a swap on a touched day folds into the snapshot and survives the boot, is held by `tests/integration/swap-durability.test.js` rows 1 and 5s and by chain row 8 above. |

## `g222_d181_durable.js` (10 rows: 10 mapped)

Lattice rows are held twice: on a sample in `tests/integration/swap-durability.test.js` (dated, today's clock, both
pairs, every touch and order, two reboots: 28 cells; one touch position for the add and skip orderings; four
untouched cells) and whole in `tests/sweeps/swaps.test.js`.

| Row | Held by |
|---|---|
| `1` | `tests/integration/swap-durability.test.js` › "after a reboot the slot carries the last choice in name and detail, and a touched day's snapshot carries it too"; sweep › "the durability lattice, 504 cells: durable, no orphaned log, the log store intact" |
| `1c` | the same two tests (draft or done, swap then touch) |
| `2` | › "undo still works after a reboot, for every touch and order, and the undone day holds through two more boots" |
| `3` | › "no logged weight is orphaned by the reboot, and the log store keeps every key and entry"; the same sweep test |
| `3d` | the same two tests |
| `4` | › "adding, skipping and swapping on a frozen day boot as the live day, this week and next, with nothing applied twice"; sweep › "all 42 add and skip orderings on a frozen day boot as live, this week and next, nothing applied twice" |
| `4d` | the same two tests |
| `5s` | › "a second swap on a snapshotted day boots as the leg press, and two undos walk back through the goblet squat to the box squat" |
| `6a` | › "a swap or an undo on an untouched day writes no snapshot and leaves the freeze cut where it was"; sweep › "all 36 untouched cells: a swap or an undo writes no snapshot and leaves the freeze cut" |
| `10` | › "the record on a snapshot-restored day survives the boot byte for byte and the undo chip is offered" |

## `g227_d190_cuecap.js` (8 rows: 5 mapped, 3 dropped)

| Row | Held by |
|---|---|
| `D190-b-ALL` | `tests/integration/swaps.test.js` › "after every live swap the card carries the plan's cue exactly when the plan caps the movement now on it"; sweep › "after every live hop the card carries the cue exactly when the plan caps the movement on it". The uninjured configs (HALF_MANNY, Mario uninjured) are in the walk, where the oracle never cues. |
| `D190-b-HAND-1` | › "Mario W5 Thu: kettlebell swing to split-stance deadlift (2×8) to goblet squat, which takes the cue, and each hop boots as the live card" |
| `D190-b-HAND-2` | › "ankle plan W3 Thu: kettlebell swing to goblet squat (cued, "Same job, same numbers.") to split-stance deadlift, which drops it, and each hop boots as the live card" |
| `D190-b-HAND-3` | › "ankle plan W3 Thu: kettlebell swing to goblet squat (cued) to a Nordic curl, which prints its bodyweight sets, and each hop boots as the live card" |
| `D190-c-DIGEST` | sweep › "the floor lattice and the injured lattice programs match tests/snapshots/swaps.json" (`injuredLatticeDigests`: the six workaround configs and Mario uninjured; HALF_MANNY's digest is program-output's) |
| `D190-c-TOAST` | DROPPED: past-build pair (every toast against V226's toast on the same chain). Its current half, D193's hold sentence on every hand clamp pair and on nothing else, is held by `G6a` above. |
| `D190-c-UNINJ` | DROPPED: past-build pair (uninjured live, boot, toast and undo against V226). That an uninjured athlete never sees the cue is held by `D190-b-ALL` above. |
| `D190-c-MANNY` | DROPPED: the HALF_MANNY digest against `MANNY_DIGEST_BY_VERSION`, held by `tests/integration/program-output.test.js` |

## `g227_d190_prefpath.js` (4 rows: 3 mapped, 1 dropped)

| Row | Held by |
|---|---|
| `c2-i` | `tests/integration/swaps.test.js` › "every card of a preference build carries the cue exactly when the plan caps it and its dose names no RPE" (two sources per region, one target each); sweep › "every preference build: cue exactly on capped, RPE-free cards; uncapped targets print the uninjured build's dose" |
| `c2-ii` | › "an uncapped preference target prints what the uninjured build with the same preference prints in that slot"; the same sweep test. The reference is the uninjured build with the same preference on today's app, not V226's: an uninjured plan caps nothing, so it never meets a cue. |
| `c2-hand` | › "a preference for Reverse lunge (KB) on a knee plan prints the deadlift's own dose; Dumbbell incline press to Cable pushdown on a shoulder plan likewise" |
| `c2-iii` | DROPPED: past-build pair (no card but the preference target moves against V226's build of the same config). |

## `g227_d190_seam.js` (7 rows: 5 mapped, 2 dropped)

| Row | Held by |
|---|---|
| `D190-a-MEM` | `tests/integration/swaps.test.js` › "the day's store keeps one record per hop exactly when the hops' from names are distinct"; sweep › "store membership is hand membership, and on a complete store every touched slot boots as live" |
| `D190-a-U` | › "on a complete store, every touched slot boots as the live card"; the same sweep test |
| `D190-d-U` | › "the undo chip names the lift that just left: the last hop's from" and › "one undo puts the day back as it was before the last hop, and on a complete store leaves the first hops recorded"; sweep › "the chip is the last hop's from, one undo restores the day before the last hop, and the boot after it agrees" |
| `D190-e-PRE` | › "the four natively cued items sit on their days once each, carry the cue, and their lunge pattern is capped" |
| `D190-e` | › "every chain off a natively cued item boots as the live day" (every hop1, one hop2 and one cyc2 per item); sweep › "every chain off a natively cued item boots as the live day" (every chain) |
| `D190-a-Uprime` | DROPPED: past-build pair (U' chains that boot as live on V226 boot as live on the candidate). Whether a revisit chain boots as live is D191 P-SWAPREVISIT, unruled (the gate printed it as INFO only). |
| `D190-d-Uprime` | DROPPED: past-build pair (U_d' chains that undo right on V226 undo right on the candidate). Since D192 every chain undoes right, revisits included, which `d2-UNDO` below holds on the whole walk. |

## `g228_d192_undokey.js` (4 rows: 4 mapped)

| Row | Held by |
|---|---|
| `d2-CHIP` | `tests/integration/swaps.test.js` › "the undo chip names the lift that just left: the last hop's from" (the sample holds a chain whose `to` names repeat) and › "HALF_MANNY W3 Thursday trap bar deadlift to RDL to deadlift to RDL: the chip says Deadlift and one undo walks back one step"; the sweep's chip test |
| `d2-UNDO` | › "one undo puts the day back as it was before the last hop, and on a complete store leaves the first hops recorded" and the PIN test (its store after the undo, typed); the sweep's chip test |
| `d2-BOOT-U` | › "after an undo on a complete store, a fresh boot shows the day the athlete sees" and the PIN test; the sweep's chip test |
| `d2-MANNY` | › "no build and no boot reads the undo chip" (the counter on `swapOriginOf` reads 0 over two builds and a boot, 1 after a direct call). Its HALF_MANNY digest half is held by `tests/integration/program-output.test.js`. |

The gate's hop4 and hop5 strata (every 4-tap and a 1,000-draw 5-tap sample on the low back plan) are not ported: the
chip and undo claims they fed are the same rows, held on the walk's one, two and three hop classes (hop3 off a hop2 and
off a cyc2 both sampled). The gate's `GUARD` line was FAIL-only and not a manifest row.

## `g234_d213_swapkeep.js` (17 rows: 17 mapped)

| Row | Held by |
|---|---|
| `K1` | `tests/integration/sport-swap.test.js` › "a swap parks the run the athlete typed and clears it from the top" (with › "the repro day is W1 SAT Long Run, planned run, with its 3.1 mi strip" as its precondition) |
| `K2` | › "what the athlete types on the target sport parks under that sport on the swap back" |
| `K3` | › "the swap back restores the run at the top, the form, the plan strip, and hides the note" |
| `K4` | › "reopening the day rebuilds the same form from the stored entry and writes nothing" |
| `K5` | › "Mark Done while swapped keeps the entry as it was and marks the day complete" |
| `K6` | › "a day saved first, then swapped, keeps its run parked, stays complete and counts no miles" |
| `K7` | › "three hops keep every typed set and restore each sport on its return" |
| `K8` | › "tapping the chip of the sport already active changes nothing" |
| `K9` | › "with nothing typed, swaps leave no parked record; a run cleared in its own form parks nothing" |
| `K10` | › "a run moved onto the rest day parks under the rest day and comes back there" |
| `K11` | › "a wheel still settling at the swap parks the value it settles to (6 miles, 7:30/mi)" |
| `N1` | › "a swap with nothing typed says only where it counts, live and on reopen" |
| `N2` | › "the note while swapped says the run numbers are kept, live and when the day is reopened; it hides once undone" |
| `N3` | › "a swim swap prints both notes the same way" |
| `N4` | › "the old swap copy is gone and no printed note carries a dash or hyphen" |
| `C1` | › "the week credits the run when logged, nothing while it is swapped to an empty bike, and the run again after" |
| `L1` | › "the swap matrix: every typed field parks on the swap and returns on the return (straight back and via a third sport)" (48 rows); sweep › "the sport chip matrix, 96 rows: every typed field parks on the swap and returns on the return" |

## Mutations

Mutations: not run (sabotage off). Parity rests on the row mapping above and the new tests passing on today's
`index.html`.
