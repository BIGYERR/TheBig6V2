# V232 gatekeeper run 2 (candidate sha 03b5924d809d vs V231 d7c42961ba83), 2026-10-05 — GREEN

```
GATE     gate.sh index.html base_v231: rc=0, ALL GATES PASS, 2330 s
         steps 0-3: meta=232, node --check ok, 0 new dupes (known: _isoToday), boots, self-stable, digest 2d35e8f743680cfa
         step 4: 96/96 gates PASS n FAIL 0, 0 REFUSED, 0 crash; 3,902 PASS rows
           g224_d185_wctoday   PASS 29 FAIL 0 (5 SKIP)   (V231: PASS 34 FAIL 0)
           g232_d199_runwheel  PASS 9 FAIL 0              (V231: PASS 0 FAIL 8, 1 SKIP pair-scoped)
         step 5: 10 hunks, +63/-21
         previous version (V231 as candidate, 96 gates, 2292 s): 95/96 green; only red g232 (FAIL 8), as it must be
SABOTAGE tripped=615 survived=4 not_applied=7 crash=0 of 626 (82 specs; 8636 s)
         v232_d199 17/17 tripped (6 trip 1 row, 7 trip 2, 4 trip 3; none all-trip); v224_d185 2/2
         survivors = documented (v205_d122_threerun_v204 S4; v219 S1-D167, S3-D171, S4-D167)
         not-applied = documented (example, v193_samecard M13, v195 M12, v197 M4, v200 M4 M5, v201 M4)
BLAST    (run 1, sha unchanged) 10 hunks, +63/-21, classes {H1, G1, A1, B1, C+E1, E1, D3, F1}, unclassified 0
FUZZ     (run 1, sha unchanged) 11,196 configs / 3,072,198 items + 419,060 cardio sessions / 0 violations;
         buildProgram and refreshProgram 11,196/11,196 byte-identical; baseline self-equal; diff proven live
VERDICT  GREEN — ALL GATES PASS; sabotage residue equals V231's documented debt exactly
```
Test-file hunks: 12, 0 unclassified (era rows [232] ×11 as references to [231]; g224 re-key per calls 17/18, the 5
removed lines are the positional eq() calls re-emitted with identical content inside the scoped loop; new g232 + spec).
Notes: old gates leave temp copies (g198_instr_*.html, ia_ratchet_base_V193.html; pre-existing debt); gate.sh step 5
rewrites .last_diff.txt; unread `_DOSE_INPUT_STYLE` and `.log-row` are recorded debt; v224_d185 spec (a)'s note names
rows that SKIP on 232; no gate measures D199's DOM weight (~810 wheel rows per dosed form): Mario on device.
