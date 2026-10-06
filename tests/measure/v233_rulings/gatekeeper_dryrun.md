# V233 gatekeeper dry run (stamp-only copy of V232 at ia-version 233), 2026-10-05

Saved by the main session from gatekeeper's return (condensed only in layout; numbers verbatim).

Stamp = base_v232 (byte-identical to HEAD 6ee30ea index.html) with only the meta changed (line 8, 232 -> 233; anchor count 1).
Baseline as candidate: 96/96 PASS, 0 RED, 0 CRASH.
Stamp as candidate: PASS 64, RED 31, CRASH 1 (70 FAIL rows + g193 crash). With HEAD's g232 (git archive HEAD tests): PASS 65, RED 30, CRASH 1, the same shape as V232's dry run.
- 69 FAIL rows + the crash: pure version bookkeeping, every one a version table with no [233] row (standing ruling 2); none scoped to an earlier build (ruling 4); every measured value beside a missing row equals that table's [232] row. HALF_MANNY 2d35e8f743680cfa, deload-off 145c60296526a949, core-off 5770a4b1c4e2404d; g199 240/240/0/12372/9322/44/1275/18, E6 28; g200_pull 138 {"Kettlebell swing":138}; g219 R4 4770, R5 891, R6 412, others 0.
- 1 FAIL row from the working tree, not the stamp: g232 D202-open open-legacy, the builder's slice-2 era key (stored run_mins 650 wants 9:59:59 at VER >= 233, D208); the stamp implements nothing, so it is the correct red.

Tables needing a [233] row (11, all "row per version", each [233] a reference to [232]):
- tests/harness.js: MANNY_DIGEST_BY_VERSION (decl :218, [232] :376), MANNY_DELOAD_OFF_DIGEST_BY_VERSION (decl :270, [232] :397), MANNY_CORE_OFF_DIGEST_BY_VERSION (decl :314, [232] :418). Read by g197a D1; g197b B8a; g198 C1; g199 B1/B2; g200_core F1a/F1b; g200_pull B1; g202_d108 R6; g202_pace_anchor B1; g202_pace_copy B2; g203_mile_pencil x2; g204 x2; g207_gk Q7; g207_test_week D9; g208_d103a chip M1, key K5, readers M1; g208_d104a M1; g209 M1; g210 O6/O6r; g211 HM; g214 HM; g215 HM; g216_d154 HM; g216_d156 HM; g223 HM CONTROL [NY] [UTC]; g226 G10; g227 c-MANNY c-DIGEST; g228 d2-MANNY; g229 b.
- g193_samecard OPEN_UNRULED_BY_VERSION (decl :306, [232] :320; no [233] row throws at :322, crash)
- g197b_sweep HF_LEAK_BY_VERSION (decl :215, [232] :238; B4i-B4l), B5C_BY_VERSION (decl :241, [232] :255; B5c)
- g199_deload_arbitration DELOAD_ARB_BY_VERSION (decl :58, [232] :181; C1 C3 C5 D2 I3), E6_BY_VERSION (decl :116, [232] :190; E6), DELOAD_HINGE_BY_VERSION (decl :130, [232] :199; E1a E1b E2 E3 G1 G2 G5)
- g200_pull_arbitration SWAP_BY_VERSION (decl :290, [232] :304; P2c P2d P4 P6 P7)
- g219_samecard_draws ERA (decl :133, [232] :153; F1 F2 R1-R8)

g232 at 233: 8 rows assert as VER >= 232 licences (D199-spec, D200-rt, D203, D199/D201/D204-forms, D202-open, D202-move, D206-copy, D199-width); D-untouched skips (VER !== ERA, :483). No g232 table needs a row. All six g231_* gates PASS on the stamp (their era rows refuse above their era; no row).
Not swept: g233_d207_bikewheel.js (did not exist when the job list was built).
Timing: both sweeps together at 8 jobs, 1,744 s wall; g230_d194_lens2 ~1,140 s per run, g217_d160_dedupe_view ~385 s.
Files: scratchpad/gatekeeper_dry/ (stamp_v233.html, stampdiff.txt, base/*.out, stamp/*.out, failrows.txt, timing.txt, g232HEAD_stamp.out, headtree/).
VERDICT  DRY RUN: 11 tables need a [233] row, all references to [232]; 0 real causes; 1 expected red from the builder's working-tree g232 edit (D208).
