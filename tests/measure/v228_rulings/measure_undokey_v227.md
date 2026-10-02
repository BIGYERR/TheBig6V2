# D192 P-UNDOKEY: P12 measure on V227 (Mode B, before-picture)

Tree: V227 = `git show HEAD:index.html` (5ce31e8, ia-version 227, md5 7356a2ae…), copied to scratch. The working tree had
moved to ia-version 228 (D193 WIP) mid-pass. Every run reported below was checked to be on the 7356a2ae copy. Runs that
copied the WIP tree (the full-lattice "main" run, the remaining lowback hop4, both g227 gate runs) are **discarded**, not reported.

## 1. Readers that resolve a name to a swap record (V227 line numbers; untruncated grep, 8 + 11 hits)
| site | key | takes |
|---|---|---|
| `swapOriginOf` :14176, lookup **:14179** `list.filter(e=>e&&e.to===name)[0]` | `to` | **first** |
| its only caller: card render :12825 `_swappedFrom=…swapOriginOf(i.name)`; consumed :12835 (chip text "SWAPPED IN for X") and :12836 (`undoSwap(X)` button) | | |
| `undoSwap` :14436, lookup **:14441** `list.filter(e=>e&&e.from===from)[0]` | `from` | first |
| `recordSwap` :10285 `was=…filter(e.from===from&&e.to===to&&rx)[0]` | from+to | first (≤1 can exist, see below) |
| `recordSwap` :10286 / `clearSwap` :10295 `filter(e.from!==from)` | `from` | all (delete-all, not a resolve) |
| `applySessionSwaps` :10314–10318 | none | replays every record in order (no resolve) |
| `refreshProgram` :16030 | none | whole store, hands it to applySessionSwaps |
| `bumpSwapCount` :10334 / `markSwapOffered` | `from` | `ia_swapct_` object keyed by from, one entry per key (no list) |
Same-from filter has existed since the file's first commit as index.html; under it every day list holds ≤1 record per `from`.
Measured: stores with a duplicate `from`: 0 on every chain in every run below.

## 2. CF
- CF = V227 with :14179 `[0]` → `.pop()`. Anchor `const hit=list.filter(e=>e&&e.to===name)[0];` **count 1**. Diff vs V227: 1 line (:14179), string literals on it unchanged.
- CF2 = CF + :14441 `[0]` → `.pop()` (anchor `const hit=list.filter(e=>e&&e.from===from)[0];` count 1). Diff: 2 lines, literals unchanged.
- CF2 vs CF, byte-identical outcome (day after undo, boot day, store after, chip, chip after, toast): h3 3,062/3,062, h4 17,547/17,547, h5 1,000/1,000 (lowback_wa W3 Mon+Tue). The `from` side is a no-op wherever it was run.

## 3. Before vs CF
Oracle: the chip must name the slot's name before the last tap (read off the chain tuple). Undo must restore the slot and the whole day (clock fields stripped) to the live page before the last tap. Neither swapOriginOf nor undoSwap is asked.
- **A>B>C>B hop3, five configs × W3,W5 (fresh VM per batch):** the family filter (`famOf`: 4th name == 2nd) admits 30,590 chains = 28,246 strict A>B>C>B (C ≠ A) + 2,344 A>B>A>B. Strict: wrong V227 **28,246 / 28,246** → CF **0**, CREATED **0**; A>B>A>B 0/2,344 on both. (Correction appended below.) By config: mario 5,962/6,436; lowback_wa 4,608/5,029; elbow_wa 6,032/6,511; **HALF_MANNY 5,454/5,922**; mario_noinj 6,190/6,692. No chip: 0 on both trees. This reproduces the prior 28,246 and 5,454 exactly. (`v228_undokey_abcb_v227.out.txt`)
- **Every hop3 chain, lowback_wa W3 Mon+Tue:** 904/12,933 wrong V227 (all A>B>C>B) → CF 0, created 0. On U_d 0/11,950 both trees.
- **Every hop3 chain on all five configs (the 462,622):** NOT measured on V227 this pass. The run that did it was on the WIP tree (discarded).
- **hop4 enumerated, lowback_wa W3 Mon+Tue (every swappable slot on those two days):** wrong 20,273/175,465 V227 → CF 0, created 0. Wrong by shape on V227: A>B>C>D>B 9,172/9,172; A>B>C>D>C 9,672/9,672; A>B>C>A>C 735/735; A>B>A>C>A 694/694. U_d 0/141,441 both trees.
- **5-tap sample, seed mulberry(0xC0FFEE+…), lowback_wa W3 Mon+Tue:** 191/1,000 wrong V227 → CF 0, created 0. Every wrong chain is in U_d' (tos repeat). U_d 0/587.
- **Chip text (V227 → CF), mario / HALF_MANNY / mario_noinj, all Trap bar deadlift > Barbell RDL > Deadlift > Barbell RDL** (mario W3 Tue, manny W3 Thu, noinj W3 Tue):
  V227 chip "SWAPPED IN for Trap bar deadlift". Undo lands Trap bar deadlift (two taps back), no chip after, store keeps the 2 dead records.
  CF chip "SWAPPED IN for Deadlift". Undo lands Deadlift with its pre-tap detail, the chip after reads "Barbell Romanian deadlift" (hand-expected), store `[TBDL→RDL, RDL→DL]`.
  Toast string unchanged ("<lift> is back on the card."); only the name in it moves.

### Boot == live after undo (premise "on every CF chain"): REFUTED
- A>B>C>B, five configs: CF boot != live **748 / 30,590**. V227 268/30,590.
  - The 268 are on both trees, and every one is a collapsed store (the same-from filter dropped a record, D191's class), slot detail only.
  - **480 are CREATED by CF**, all on one-per-hop stores and slot detail only: HALF_MANNY 114/5,922, mario_noinj 366/6,692, mario/lowback/elbow 0.
  - Example (manny W5 Fri, Band woodchopper > Ab wheel rollouts > Garhammer raises > Ab wheel rollouts): CF undo lands Garhammer raises "3×12 each" (= pre-tap live, correct). Boot replays the 2 surviving records and prints Garhammer raises "2×10–15 each @ RPE 7".
  - On V227 the same chain undoes to the wrong lift and boots equal to it.
- lowback_wa W3 Mon+Tue: CF boot != live h3 110/12,933 (V227 110, created 0); h4 2,999/175,465 (V227 4,216, created 0, healed 1,217); h5 54/1,000 (V227 76, created 2, healed 24). All 3,163 are on collapsed stores.
- Instrument noise: in-VM reboot vs fresh-VM boot agreed 119/120 (A>B>C>B run) and 213/213 (lowback run) on the sampled batches.

## 4. Blast radius
- Build path: HALF_MANNY `0ac7da6b1691a8e1` V227 = CF = CF2 (self-stable). weekGrid hash equal. 9-config lattice + fixtures (10 digests): 0 differ CF, 0 differ CF2.
- Strings: none move (1 changed line, no literal on it).
- Readers the one line does not reach: `undoSwap` :14441 (by `from`; no-op today, as measured above), `recordSwap` :10285 `was` (≤1 match by construction). applySessionSwaps/refreshProgram replay and do not resolve. `ia_swapct_` is a different store.

## Instrument notes
- `REUSE` (one VM per worker, storage re-seeded per batch) matched fresh-per-batch 400,405/400,405 on lowback_wa. It did **not** match on HALF_MANNY: 2,162/61,180 rows differ (A>B>C>B run). REUSE results are used only for lowback_wa (`v228_undokey_lowback_v227.out.txt`). The A>B>C>B numbers are fresh-per-batch.
- 143 A>B>C>B chains were unreachable under REUSE vs 0 fresh. Fresh is the reported run.

## UNKNOWN (not measured on V227 this pass)
1. All 462,622 hop3 chains on five configs, CF created = 0. Only A>B>C>B (30,590) and lowback Mon+Tue (12,933) were run on V227.
2. hop4 on a whole config: only lowback_wa W3 Mon+Tue (175,465). Remaining days ≈283,791 chains were not run.
3. 5-tap sample on configs other than lowback_wa.
4. The D190 (d) walk (U_d structural row, U_d' pair row) on the CF tree. The g227 runs were on the WIP tree and were stopped.
5. Whether the 480 CF-created boot != live chains already had boot != live at the pre-last-tap state (a D181/D190 replay-detail question) or only after undo. The CF change is read-side only; the mechanism is not printed.
6. Legacy device stores holding >1 record per `from` (never produced by recordSwap since the first commit; not sampled from a device).
Scripts: `tests/measure/v228_undokey.js` (+ `_boot.js`, `_reusecheck.js`, `_bootdiag.js`).

## 480 CF boot mismatches (follow-up, V227 HEAD copy, one fresh VM per chain and per boot)
Script `tests/measure/v228_undokey_480.js`; outputs `v228_undokey_480.out.txt` (the 480), `v228_undokey_268.out.txt` (the 268 on both trees).
- **(a) The 480 do not reproduce in isolation.** Each chain was rerun alone: fresh VM, hop1+hop2, then a boot in a second fresh VM from a copy of localStorage, then hop3, chip, undo, then another fresh boot.
  - At S2 (before the last tap): boot == live 480/480.
  - After the CF undo: boot == live **480/480**, 0 differing items. The after-undo live equals S2 live 480/480; the after-undo boot equals S2 boot 480/480.
  - The 480 in section 3 are an artifact of the batched instrument (one chain per day per page, in-VM reboot, fresh-VM cross-check only on first and last batch). Which of the two causes it is not separated. **Measured CF-created boot != live: 0/480.**
- **(b) Mechanism, the 480:**
  - Live undo restores `rx.d` from the record `C→B` (the last hop). Its single rx entry carries the slot detail at S2.
  - Boot replays the remaining `[A→B, B→C]` via applySessionSwaps :10305 → applySwapPrefs :10159 → _swapDetailFor :10123. 480/480 hit the "verbatim (no floor)" branch, and the hand replay equals the boot detail 480/480.
- **(c) Store after undo:**
  - HALF_MANNY W5 Fri slot 2.0: Band woodchopper (door anchor) "3×12 each" > Ab wheel rollouts > Garhammer raises > Ab wheel rollouts. Store `[Band woodchopper→Ab wheel rollouts, Ab wheel rollouts→Garhammer raises]`; live "3×12 each", boot "3×12 each".
    The section 3 batch printed "2×10–15 each @ RPE 7" for this chain at boot: an artifact.
  - mario_noinj W5 Mon slot 3.0: Pallof press > Ab wheel rollouts > Garhammer raises > Ab wheel rollouts. Store `[Pallof press→Ab wheel rollouts, Ab wheel rollouts→Garhammer raises]`; live = boot "3×12 each".
- **(d) Shape of the 480:** all are core-slot chains whose donor detail carries verbatim (manny Band woodchopper 114; mario_noinj Cable woodchoppers 120, Medicine ball rotary toss 120, Pallof press 126). D177 window 0, bwsets 0, other 0: none mismatch in isolation.
- **The 268 boot != live on BOTH trees (isolated, same method):** 268/268 reproduce, and **all are A>B>A>B** (inside the family filter, undo right on both trees).
  - Mechanism: hop3 A→B shares `from` A with hop1, so recordSwap :10286 drops hop1's record. The store before undo is `[B→A, A→B]`; undo uses `A→B`'s rx and clears it, leaving `[B→A]`.
  - Boot replays `B→A` on the grid card A: nothing named B, skipped. The slot keeps the grid detail, while live keeps rx.d (A's detail at S2, carried from B).
  - S2 boot == live 268/268, so the mismatch appears only after undo.
  - Text shape: bwsets form on one side 234, D177 rep window on one side 30, other 4. Example: elbow_wa W3 Mon Close-grip bench press > Landmine rotational press > Close-grip > Landmine; live "4×6–10 — RPE 7 …" vs boot "4×5 — RPE 7 …"; store after `[Landmine rotational press→Close-grip bench press]`.
  - This is D191's collapse class, identical on V227 and CF (CF created 0, healed 0 on it).
- **lowback smoke boot rows (section 3, h3/h4/h5)** were measured with the same batched instrument and are **not** re-verified in isolation.
- **D190 (d) walk on the CF tree (`tests/gates/g227_d190_seam.js`, CF built from V227 HEAD, baseline V226 637bc8e):** PASS 7 FAIL 0 on CF, PASS 7 FAIL 0 on V227.
  - d-U residue 0/12,282 on both. Classes: hop1 2,277, hop2 6,132, cyc2 2,104, hop3 644, cyc3 360, collide2 392, exch3 373.
  - INFO D192 (U_d' 72): V227 undo wrong 28 (hop3 A>B>C>B 28/28, A>B>A>B 0/44); CF undo wrong 0, healed vs V226 28.
  - d-U' pair: created 0 of 44 on both.
  - Rows a-U, a-U' and e PASS on CF. Outputs: `v228_undokey_g227_cf.out.txt`, `v228_undokey_g227_v227.out.txt`.
- **The 2/1,000 lowback_wa 5-tap CF-created rows, rerun in isolation (`v228_undokey_h5created.out.txt`): both are REAL (slot detail differs 2/2), and both are D191's same-from collapse, not the chip key.**
  - (i) Kettlebell single-arm row > Cable curl > Dumbbell row > Inverted rows (bodyweight) > Dumbbell row > Cable curl, i.e. A>B>C>D>C>B.
    - At S2, boot == live. Hop5 (Dumbbell row→Cable curl) drops the hop3 record Dumbbell row→Inverted rows. After undo the store is [KB row→Cable curl, Cable curl→Dumbbell row, Inverted rows→Dumbbell row].
    - On boot, the Inverted rows→Dumbbell row record finds nothing named Inverted rows and is skipped. Boot prints Dumbbell row "2×8 each — hold RPE 7, two in the tank"; live keeps rx.d "2 sets — RPE 8 (stop 2 reps short of failure)" (bwsets).
  - (ii) A>B>C>B>D>B (Kettlebell single-arm row > Incline dumbbell curl > Feet-elevated inverted rows > Incline dumbbell curl > Dumbbell hammer curl > Incline dumbbell curl): boot != live already at S2.
    - Expected by hand from the chain: hop4 shares `from` with hop2, so the collapse happens before the last tap. Not printed this pass.
  - V227 boots equal to live on both only because its wrong undo lands on the grid lift.
