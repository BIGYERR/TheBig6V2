# Post-V232 measure H: which gates ever failed on a change outside their area (record, not engine), 2026-10-05

Asked by Mario after V232 ("which gates have ever actually failed on a change that didn't touch their area?").
Script tests/measure/v232_gate_history.js; outputs in the session scratchpad measureH/. Oracle: the record's own stated
cause per red; "unclassified" where the record names none. Uncommitted at writing; ride the next tests-only commit.

Denominator: builds V190–V232 = 43 (+5 tests-only commits). Gatekeeper passes >= 72 (reconstructed lower bound; per-run
files exist only V226, V230–V232). Builds with a recorded gatekeeper RED: 23/43 (15 with a gate row red, 8 red only on
sabotage/fuzz/lattice). Gate-row red events at gatekeeper stage: 31.

Classes: A version bookkeeping; B brittle pin; C tooling/harness/gate bug; D-fix real cross-area defect, fixed; D-lic
real cross-area move, licensed; E inside the build's own area.

Gatekeeper stage, 31 gate-red events: A 9, B 11, C 9, D-lic 2, D-fix 0.
- D-lic at gatekeeper: g193_budget_floor B3/B4c and g197b_sweep B5c at V198 and V199 (prehab displacement −661 then
  sum 399; same-card duplicates 240 → 235 → 187, good direction). Both builds edited the function those gates read
  (capSessionBudget, the deload): adjacent, not far.
- No gate at the gatekeeper stage has a fixed cross-area catch in 43 builds.

Before gatekeeper (measure/builder/coach running the HEAD suite on a candidate copy), real cross-area catches acted on:
- D-fix g210_equipment_denials O6u, V231 (HALF_MANNY swap universe 86 → 83; prevention universes moved on 467/576); fixed.
- D-fix g215_d149_ghd F2/P1, V231 (new item built on knee/protect, 90 days; 898/6,301 reads empty); fixed by re-siting A1.
- D-fix g221_d177_swapfloor G3c, V227 (reddened §12's one-line fix; coach ruled D190 instead).
- D-lic pre: g209_d140_tier V225, g221 G6a V229, g229_d194_lens V231; g227 d-U V229 (borderline, D190/D194 same path).

Fixed cross-area defects caught by non-gate instruments: V190 blast radius (phantom-set budget evicted terminal knee
extension, §12); V214 gatekeeper lattice (eve lifts under parked tests 468 → 0); V230 chain differential (Burpees boot
drop, pinned); V231 measure lattices M17 (circuit lunge/hold trim) and M19 (D198's lost hip extension, no g199 row red);
V225 mile-gate colour (instrument unnamed).

Per-gate B: g197d E5 (V198, V199 ×2, V231 pre); g204 C8 (V207, V223); g203 (V206); g208_d103a_readers E3 (V214);
g217 (V219 pre); g224 (V232); digest pins (V200); g199/g200_pull A1 anchors and 17 literal HALF_MANNY pins (V231 pre).
Per-gate C: g193_budget_floor (V194 ×2); g195_wildcard (V195); g197d E1h (V198); g197b:98 dead constant (V200);
g193_pool_overlay (V215, V231 pre); g224 own (V224); g193_samecard crash on a missing row (V230, V231 stamp, V232 dry run);
g199 I2c/I2d vacuous (V231 pre); V193 unnamed.
Root of the cost: exact-version era tables force a row every build (MANNY ×3, g193 OPEN_UNRULED, g197b HF_LEAK/B5C,
g199 DELOAD_ARB/DELOAD_HINGE/E6, g200_pull SWAP, g219 ERA); g193_samecard crashes instead of failing; gate.sh stops at
the first red (hid reds at V198, V200; left 20 gates ungraded at V232 run 1).
Unknown: pass counts V190–V225; instruments at V192, V193 (2 of 3), V225; V205 g202 D7 stage; V200's four files;
gate wall time per build. Sabotage's own catch history was not in scope (V221's three silent survivors are its record).
