# M16 — V231: full gate.sh dry run on copies stamped 231

Measure's return, saved by the main session (V231 chat, 2026-10-04). Script `tests/measure/v231_gate_dryrun.js`, summary
`tests/measure/v231_gate_dryrun.out.txt`; raw outputs in the session scratch `measure3/` (`gate_*.out`, `per_*/`, `gx_*/`,
`summ_*.out`). Copies: STAMP = V230 + the version stamp only; ALL231 = coach's `coach1/t_ALL.html` (sha256 99c3361ac729fabb) +
the stamp. Each copy differs from its source on line 8 only. Baseline `git show HEAD:index.html` (== working index.html).

```
ANSWER   STAMP: every red is a version table with no [231] row, plus d194-postsweep's designed refusal. With [231]=[230]
         alias rows in scratch, all 12 table-keyed gates go green; every figure equals [230], none parks.
         ALL231: fails 37 of 89 gates. Three table figures move (three HALF_MANNY digests, DELOAD_ARB C1/C3, DELOAD_ARB D2).
         About 20 gates carry literal or V225/V228-baseline pins that ALL231 moves. g199 and g200_pull lose their instrument
         anchor and REFUSE on the real gate (measure nothing).
METHOD   gate.sh on 3 copies; all 89 gates one at a time per copy (gate.sh stops at the first red); the 12 table-keyed gates
         re-run from a scratch copy of tests/ appending X[231]=X[230] after every X[230]= line (13 tables, harness.js + gates),
         plus for g199/g200_pull an anchor variant matching ALL231's 5-argument capRegionalFatigue call. Oracle: each gate's
         own era row; [230] figure is what the control prints while passing. First per-gate attempt crashed (BSD xargs -I
         255-byte cap); re-run with a worker script.
gate.sh  CONTROL V230 vs itself: 89/89 FAIL 0, 0 REFUSED; step 5 exits 1 "byte-identical" (expected, self-diff).
         STAMP stops at g193_samecard (crash: "no OPEN_UNRULED_BY_VERSION row for V231").
         ALL231 stops at g193_pool_overlay FAIL 1 (stale debt).
Per gate STAMP 18 failing, 1 crashed, 1 refusing. ALL231 37 failing, 1 crashed, 3 refusing.

STAMP (a) version tables with no [231] row:
  MANNY_DIGEST_BY_VERSION (harness), read by 17 gates: g197a D1, g197b B8a, g198 C1, g199 B1, g200_core F1b, g200_pull B1,
    g202_d108 R6, g202_pace_anchor B1, g202_pace_copy B2, g203 (2), g204 (2), g210 O6r, g226_d189 G10, g227 c-MANNY,
    g228 d2-MANNY, g229 b.
  MANNY_DELOAD_OFF_DIGEST_BY_VERSION: g199 B2.  MANNY_CORE_OFF_DIGEST_BY_VERSION: g200_core F1a.
  OPEN_UNRULED_BY_VERSION: g193_samecard (throws = the crash).  HF_LEAK_BY_VERSION: g197b B4i–B4l.  B5C_BY_VERSION: g197b B5c.
  DELOAD_ARB_BY_VERSION: g199 C1, C3, C5, D2, I3.  DELOAD_HINGE_BY_VERSION: g199 E1a, E1b, E2, E3, G1.  E6_BY_VERSION: g199 E6.
  SWAP_BY_VERSION: g200_pull P2c, P2d, P6, P4, P7.  g219 ERA: F1, F2, R1–R8.
STAMP (b) refuses by design: g230_d194_lens2 d194-postsweep, keyed VER === ERA (230), lines 811 and 1002; REFUSES on both.
STAMP (d) none.

(a) figures at 231, STAMP | ALL231 | [230]
  MANNY_DIGEST          0ac7da6b1691a8e1 | 2d35e8f743680cfa | 0ac7da6b1691a8e1   moves on ALL231
  MANNY_DELOAD_OFF      1069cd7f86eed204 | 145c60296526a949 | 1069cd7f86eed204   moves
  MANNY_CORE_OFF        9d14801a63111081 | 5770a4b1c4e2404d | 9d14801a63111081   moves
  DELOAD_ARB C1, C3     264 | 240 | 264 (of 17,856 weeks / 1,728 configs; C3 denominator 14,976)   moves
  DELOAD_ARB D2         19 | 17 | 19 (sha-method 2,861 → 2,863 differing of 2,880)   moves
  DELOAD_ARB C5 0|0|0; I3 18|18|18 (denominator sections entering the cap 15,720 → 15,702 of 95,232 day builds)   equal
  DELOAD_HINGE E1a 12,369, E1b 9,319, E3 44/15,360, G1 1,275   equal.  E6 28   equal.  SWAP P2c 138   equal.
  OPEN_UNRULED, HF_LEAK (0/0), B5C (0)   equal; g193_samecard 53/53 both copies with the alias.
  g219 ERA R1–R8 (0, 0, 0, 4770, 891, 412, 0, 0)   equal; 15/15 both copies.

ALL231 only (c): figures the V231 change moved, STAMP → ALL231
  g193_pool_overlay: debt line 43 `>=215 thin-pool ankle/protect squatPool` no longer trips; DEBT lines 17 → 16.
  g197d_d84_base E5: capSessionBudget sha 36b5b8efdfa1d3d8 (licensed by D91) → 10a5806729632f09 (the _prehabHalf/_cost edit, :10577).
  g199 and g200_pull (real gates): A1 week-assembly anchor count 0 → REFUSE; the capRegionalFatigue(...,goal,
    cfg.liftingFocus==='support_prevention') call at :10951 no longer matches A_PIPE.
  g199 (aliased copy): literal rows F2 15,720 → 15,702, F3 (A+B) 30,264 → 30,246; I2 fails with a blank interpolation.
  Literal HALF_MANNY `0ac7da6b1691a8e1` pins (16 rows): g207_gk_trial Q7, g207_test_week D9, g208_d103a_chip M1,
    g208_d103a_key K5, g208_d103a_readers M1, g208_d104a_runbase M1, g209 M1, g210 O6, g211 HM, g214 HM, g215 HM,
    g216_d154 HM, g216_d156 HM, g223 [NY] HM and [UTC] HM.
  g210 O6u: HALF_MANNY's swap universe 86 names → 83.
  g215 F2: floor (b) now fires on knee/protect: commercial 0 → 18 of 126 programs, crossfit 0 → 18 of 126, home_basic 0 → 9 of 126.
  g221: G3a 832 → 839 of 146,198; G3c off-grammar 168 → 172 of 29,241; G3e 202 → 205 of 37,559; G6a 1,243 → 1,253 of 150,898.
  g225 CONFINEMENT: after the S1 strip, swim_100_time, swim_500_time, bike_ftp and run_base now differ from V225.
  g226_d188: G2 120/120 → 0/120; G1h-P2b 0 → 48 configs differ; G1h-P5 0 → 3,252 days differ.
  g226_d189: G6b 640/640 → 0/640 ("another byte moved vs V225"), plus G10.
  g227: c-UNINJ 0 → 172 of 1,396 chains; c-DIGEST 8/8 → 7/8; plus c-MANNY.
  g229_d193: b cards outside the clamp 1,053/1,053 → 573/1,053, uninjured 133/133 → 50/133; d-BWSETS 1,239/1,239 → 1,169/1,239;
    j R7 30/30 → 28/30, L1 uninjured 96/96 → 27/96; f non-cue details 1,722 → 1,734.
  g229_d194 p-SWAP, p-AUX, p-ADD, p-UNSTAMPED: the W3 and FIX lists equal to V228 move (e.g. FIX 8,202 of 9,234), "uninjured MOVED".
  g230_d194_lens2: d194-fixture L1 pairs 150,068 → 150,898 "aligned false"; d193-k clamp pairs 1,243 → 1,253 (verbatim 684 → 694;
    INFO capped 458 → 440); d193-l G3a 832 → 839, G3c-off 168 → 172, G3e 202 → 205.

ROOT/SPREAD (gates keyed on V230-era values ALL231 changes)
  HALF_MANNY digest readers: MANNY tables tests/harness.js:218, 270, 314 ([230] rows 374, 393, 412). Era-row readers include
    g197b:98, g199:503, g200_pull:327, g202_pace_copy:352. Literal pins: g207_gk_trial_present:258, g207_test_week:339,
    g208_d103a_chip:167, g208_d103a_key:156, g208_d103a_readers:290, g208_d104a_runbase:207, g209:293, g210:419, g211:67,
    g214:233, g215:75, g216_d154:74, g216_d156:64, g223_d183:131 and 265, g226_d189:114 and 137, g228:131 and 145. Also hold the
    literal but did not trip on ALL231: g212:136, g213:79, g218:222, g221_d177:75, g221_d178:59, g221_d179:59, g221_d180:90,
    g223_d184:154/158/722/751.
  PRT digest readers: 0 hits in gates/.
  Bodyweight Burpees counts: g230_d194_lens2:657 onward (typed post-sweep reject table), its 22-reject text at 769, predicate
    811/1002; g229_d193_build:166 and 452 (J_BURPEES); g199:628 (rename "Banded hip thrust -> Burpees").
  Prevention circuit length: no gate names it; surfaces through g225, g226_d188 (support_prevention configs), g227, g229.
  capRegionalFatigue signature: A_PIPE / A_PIPE_R at g199:240–244 and g200_pull:124–128 (hard 4-argument anchor, now count 0);
    g200_core_tier:176 hook (calls 4 args, still passes); g197d:378 (slice end anchor).
  _cost: no gate names it; g197d:375–378 hashes the capSessionBudget body containing it.
  Banded hip thrust (now _bwHTlb/_bwHTak on bodyweight): g193_samecard:142, g215:97 and 100, g210:192, g199:628.

UNKNOWN  d194-postsweep's figure at 231 on either copy (the row REFUSES before measuring; a scratch relax of the predicate was
         denied by the permission classifier and not pursued). Aliased-table figures for g226–g229 (scratch copies fail setup:
         they git-show historical trees relative to the gate's own dir; (c) numbers come from repo-run gates). Sabotage sweep
         and fuzz not run. No segmentation of ALL231 moves by goal/focus/equipment beyond what each gate prints. No [231] row
         written anywhere. Whether a moved figure parks or gets a row is coach's call.
```
