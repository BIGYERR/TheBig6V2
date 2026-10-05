# V231 gatekeeper run 1 — RED on one item (saved by the main session)

Gatekeeper's return, V231 chat, 2026-10-04. Scratch `gatekeeper/` (`v231_gate.out`, `basegates/`, `disc/`, `sab/`,
`sab_summary.txt`, `v231_sabrows.out`, `gk_diff.js` → `v231_diff.out`, `gk_fuzz.js` → `v231_fuzz.out`, `s32/`).
Candidate copy sha256 1b403743f8ad1b16 (== index.html == coach4/t_CF.html); V230 72ac41c8d34034ce (== HEAD).

```
GATE     gate.sh on candidate: ALL GATES PASS, 94/94 gates FAIL 0, REFUSED 0
         (on V230 as candidate: 88 PASS FAIL 0; the 5 g231 files fail every row: 0/6, 0/3, 0/4, 0/3, 0/3; g230 PASS 15 FAIL 0)
SABOTAGE tripped=597 survived=5 not_applied=7 crash=0 of 609 (81 specs, full sweep)
         new specs: v231_d195_d196_d197 13/13 TRIPPED, v231_d198 1/1 TRIPPED
         NEW SURVIVOR: v230_d194 S32-D194-A4
BLAST    engine: 15 unified hunks (16 in plain diff), +19/-13, all 16 edits matched to a ruling, unclassified 0, unruled removals 0
         program output: 10,030 configs, 51,620 ops, OUTSIDE 0
FUZZ     600 random configs: V230==V230 600/600, CF==CF 600/600, V230≠CF on 407; oracle violations on CF 0
         refreshProgram identity 150/150; overlay path 20/20
VERDICT  RED — tests/sabotage/v230_d194.json S32-D194-A4 SURVIVED on g230_d194_lens2 (PASS 14 FAIL 0); new at V231, not in
         V230's documented debt
```

- S32: on V230 it tripped; its named row d194-postsweep (ii) is dropped at ≥231 by the absorb ruling §6 as vacuous; the spec
  was not retired or re-wired. g230 on candidate and on the S32 mutant: both PASS 14 FAIL 0, outputs identical after
  stripping paths/timings (0 differing lines). Gatekeeper's reading: a mutation defect created when the row was retired, not a
  blind gate; not proved that the mutant leaves engine output unchanged outside g230's populations. Session's/coach's call.
- Digests: HALF_MANNY V230 / B / slice-2 / W5 / FL / D198-alone-on-V230 / NOT-A all 0ac7da6b1691a8e1; A-without-B
  f5ed630033ebe3db; ABx/PREx/ALLx/candidate 2d35e8f743680cfa (== era row); universe 86 throughout. Deload-off, core-off and
  PRT asserted by g199 B2, g200_core_tier and g231_d195b_cost D195-B-a (all PASS), not printed independently.
- Gates: every gate printed a summary. Discrimination (V230 engine stamped 231) fails every absorbed/era row. Gates passing on
  both trees claim no V231 change (g193_pool_overlay instrument fix; g193_samecard, g219 reference rows; g225, g226_d188
  scoped SKIPs). 161 gate-file hunks in 31 files, each mapped to an absorb row, a session call or the D198 Am. 1 literal.
- Sabotage: not-applied = the 7 documented anchors (debt unchanged since V221); survivors from V230's documented debt:
  v205_d122_threerun_v204 S4, v219 S1-D167 / S3-D171 / S4-D167; S32 the fifth. v215_d149 S3 applies and trips. New specs: each
  mutant trips its named row on a behavioral conjunct (S-1 b-nonrun; S-2 A-a; S-3 c-iii + A-b; S-4 c-ii; S-5 d-23.5/d-cellB;
  S-6 a-uni + A-f; S-7 A-e + A-b; S-8 B-a; S-a D196-c; S-b b-adj; S-c b-thrust; S-d a-a2; S-9 D197-a/c; S-e D198-a/b).
- Blast radius (program output, 10,030 configs = M17 6,912 + LAT_K 630 + g199 1,728 + LAT_G 760; 51,620 ops, OUTSIDE 0):
  B-1 44,253; B-2 29; B-3 20; A-1 3,536; A-4 carry 43, core 90; D196-1 Main 1,309, Primer 64; D196-2 Leg sections 616, ankle
  circuit 25, knee circuit 48; D196-3 pull 142, relabel 76, Explosive finisher 60; D196-4 LSB RPE 7 816, RPE 6 74, Lower
  strength rename 39, add 60, circuit hinge 46, cross-label 21 + 21; D196-5 Leg isolation leaves 36, Calves appear 24; D197-1
  12; D197-2 9; D198-1 70; D198-2 81. Regressions by definition 0 (calf removals 0; four-item circuit on knee/protect or
  non-runner 0; universe names lost 0/10,030; HEP drops 0; hinge-slot shared V230 70 → CF 0; one-item HEP 557 → 497).
  D196-6: 214 programs gain only the bed thrust (lowback/protect 137, lowback/workaround 77, all bodyweight); outside 0.
- Fuzz: 600 seeded configs; part-alone shards 0 outside scope; refresh == build 150/150 both; overlay path == cfg-injury build
  20/20 both.
- UNFINISHED: session call 13's 61-list claim not instrumented directly (indirect: universe changes only on bodyweight lowback
  programs, 214, 0 elsewhere); deload-off/core-off/PRT digests from gate assertions, not independent prints.
```
