# V233 gatekeeper ship run (candidate sha 44c37852e835 vs V232 03b5924d809d), 2026-10-05 — GREEN

Saved verbatim by the main session from gatekeeper's return.

```
GATE     gate.sh index.html base_v232: rc=0, ALL GATES PASS, 1158 s
         steps 0-3: meta=233 (Mario named V233), node --check ok, 0 new dupes (known: _isoToday), boots, self-stable, digest 2d35e8f743680cfa
         step 4: 97/97 gates print PASS n FAIL 0, 0 REFUSED, 0 crashed; 3,907 PASS rows
           g233_d207_bikewheel PASS 6 FAIL 0                 (on V232: PASS 0 FAIL 5, SKIP 1 = D211-untouched, pair-scoped)
           g232_d199_runwheel  PASS 8 FAIL 0, SKIP 1 (D-untouched, VER !== ERA, as ruled)   (on V232: PASS 9 FAIL 0)
         step 5: 3 hunks, +11/-6
         previous version (all 97 gates run on base_v232, 1001 s): 96/97 green. Only g233 is red: all 5 behaviour rows fail on their own conjuncts (forms, copy, open, move, clamp), plus a ver conjunct
           cand/base row-count differences: g193_budget_floor 36/27, g197d_d84_base 6/2. Cause: the base run had no baseline argument, so the pair rows did not run. With base_v232 passed as the baseline arg the base gives 36/6, the same as the candidate. No real difference.
           vacuity: g233 is the only gate that tells the two builds apart. The other 96 defend earlier rulings, as they should in a confined build.
         HALF_MANNY 2d35e8f743680cfa; deload-off 145c60296526a949; core-off 5770a4b1c4e2404d (all unmoved; the [233] reference rows assert this)
SABOTAGE tripped=626 survived=4 not_applied=7 crash=0 of 637 (83 specs, 4908 s)
         survivors = documented (v205_d122_threerun_v204 S4; v219 S1-D167, S3-D171, S4-D167)
         not-applied = documented (example no-op, v193_samecard M13, v195 M12, v197 M4, v200 M4 M5, v201 M4); 0 new; 0 MODULE_NOT_FOUND
         v233_d207 11/11 tripped. Rows hit on g233, and on g232 where it trips:
           S1 forms+open+move | S2, S3, S4 forms+open+move+clamp | S5 copy | S6 copy | S7 forms | S11 move
           S8 open+move+clamp, g232 D202-open | S9 open+move+clamp+untouched, g232 D200-rt+D202-open | S10 open+move+clamp+untouched, g232 D202-open
           No mutant trips all 6 rows. Each of S5, S6, S7 and S11 trips exactly one row.
           Correction to the builder's note: S8 and S9 also trip g232, not only S10.
BLAST    3 hunks, +11/-6, classes {4 meta 232->233, 2 _iawParse hms D208 clamp + comment, 1 bike branch D207/D209-amended/D210 + comment}, unclassified 0
         Removed lines: the meta line, the hours-only clamp comment and its 2 lines (replaced by the D208 clamp), and the bike label + number input (D207/D209). All ruled.
         No data-plan on the bike wheel, no CSS, swim, applyRestCardio, setCardioSwap or reader hunk.
         Log-form render, 231 forms (11 shapes x 21 stored values): bike 84/84 differ (Log the ride, iaw-solo, no f-sub, no data-plan, no number box).
           Run time/dist/reps_dist/reps_time/generic/speed-hint and swim: 147/147 byte-identical, values >= 600 included (the face is set by _iawParse at init, not in the HTML).
           _iawParse hms V232 -> V233: 600 9:0:0 -> 9:59:59; 630.5 9:30:30 -> 9:59:59; 650 9:50:0 -> 9:59:59; 599.994 and 599.999 9:0:0 -> 9:59:59.
           Unchanged: 599.98, 599.991 (9:59:59), 599 (9:59:0), 45.5 (0:45:30), '' (dash). dist/pace/rept parse identical.
FUZZ     12,528 configs (L1 8,208 + L2 2,880 + L4 multi-sport x bike x 5 injury arms 1,440) / 3,466,298 items + 478,880 cardio sessions / 0 violations
         buildProgram and refreshProgram byte-identical V232 vs V233 on 12,528/12,528 (seed pinned, Date frozen, id/created/swapUniverse stripped), 0 crashes
         baseline self-equality (two loads) 0 diffs on every config; base vs base 314/314 equal; live control V230 vs V232 240/314 differ
VERDICT  GREEN: ALL GATES PASS; sabotage residue equals V232's documented debt exactly; 0 unclassified hunks; 0 fuzz violations
```
Test-file hunks: 12 hunks, 0 unclassified.
- Class A, 11 era rows, each [233] a reference to [232]: harness 3, g193 1, g197b 2, g199 3, g200_pull 1, g219 1.
- g232: 1 hunk, +2/-1. The removed line is the LEGACY run_mins '650' entry, re-emitted with a getter keyed on VER >= 233 ('9:59:59' at 233 and up, '9:50:00' below). It cites D208 (standing ruling 2).
- New files, all as declared: g233_d207_bikewheel.js, sabotage/v233_d207.json, 4 edit scripts (s1, e1, e2, e3).

Notes:
- gate.sh step 5 rewrote .last_diff.txt in the repo (known behaviour).
- The sabotage runner prints its all-trip WARNING on many old specs. That is per spec, not a harness fault: no crash and no path errors.
- Scratch: scratchpad/gatekeeper_ship/ (v233_gate.out, base/*.out, sab/*.out, sab_tally.txt, mutrows.out, formdiff.out, app.diff, tests.diff, fuzz.js, fuzz_{0..3,live,selfbase}.json).
