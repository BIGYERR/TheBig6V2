# V235 gatekeeper record (saved by the main session, 2026-10-07)

## Draft run 1: RED, row check only
gate.sh full (99 gates): every gate FAIL 0; step 4b rows.js check PASS 2067 FAIL 10: the 10 new g235 rows not in the manifest with no ROW_RULED licence (the main session had not written tests/measure/v235_rulings/v235_row_ruled.txt; V234 precedent `v234_row_ruled.txt`). Manifest not regenerated.
- meta 235; node --check ok; 0 new duplicates; version_scope PASS 99 FAIL 0; boot HALF_MANNY 2d35e8f743680cfa, self-stable.
- g235 PASS 10 FAIL 0 (baseline relabelled 235: PASS 4 FAIL 6, fail D215-zero, -rows, -open, -tail, -plan, -clear; D215-clear on five conjuncts incl. bike-nudge; D215-tail lost 1755/1755). g232 8/0 and g233 5/0 on candidate and on base_v234 as shipped.
- Sabotage proof set: tripped 32 / survived 0 / not-applied 0 / crash 0 of 32 (v232_d199 S1-S17 on g232, v233_d207 S1-S11 on g233, v235_d215 S1-S4 on g235); anchors 658 checked, 7 not-applied, all documented.
- Blast radius vs base_v234: 9 hunks at -U0, +26/-11, classes {bump 1, D215/D216 spec row + D199 comment 1, D216 comment 1, D216 _iawWraps 1, D215 parse comment 1, D215 parse 1, D215 format 1, D215 comments 2}, unclassified 0; the D200 expression byte-identical.
- Fuzz: 34,020 configs / 2,548,980 sessions / 0 violations (13,886,140 keys); baseline self-identity 54/54; cfg purity 9/9.
- Wall: gate.sh 759 s (g230 588 s, g217 206 s), sabotage 25 s, fuzz 75 s, previous-version 16 s; 875 s.

## Draft rerun with ROW_RULED, then final run: GREEN
- Tree check: only change since draft run 1 is the added `v235_row_ruled.txt`.
- gate.sh full with ROW_RULED: ALL GATES PASS, 99/99, version_scope PASS 99 FAIL 0, rows.js check PASS 2077 FAIL 0; HALF_MANNY 2d35e8f743680cfa. 853 s.
- Manifest installed from this proven run: header ia-version 234 -> 235, gates 98 -> 99, rows 2067 -> 2077, status lines 3433 -> 3443; +10 `g235_d215_hmszero.js <row> once` lines (all named in the ruling's Gate rows section; D215-clear also by Amendment 1); 0 rows leave; g232/g233 no manifest hunk. Unexplained hunks 0.
- Final run (no builder slice after the draft): meta 235; whole proven tree sha256 (1,251 files under index.html + tests/, row_manifest excluded) 0 changes since the tree check.
- Total proof wall time across both draft runs: about 1,730 s (28.8 min) against the 30-minute CROSS-CUTTING budget.
