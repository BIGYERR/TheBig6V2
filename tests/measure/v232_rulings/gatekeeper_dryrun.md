# V232 gatekeeper dry run (stamp-only copy of V231 at ia-version 232), 2026-10-05

Stamp = base_v231 with only the meta changed (1 line). Baseline as candidate: 95/95 PASS. Stamp: PASS 64, RED 30, CRASH 1;
69 FAIL rows + g193 crash, every one a version table with no [232] row (standing ruling 2); none scoped to an earlier
build (ruling 4), none for any other cause; every measured value beside a missing row equals that table's [231] row.
gate.sh halts at the first red (g193 crash) after ~1,927 s; a full per-gate sweep ~2,254 s; g230_d194_lens2 ~25 min.

Tables needing a [232] row (11):
- tests/harness.js: MANNY_DIGEST_BY_VERSION, MANNY_DELOAD_OFF_DIGEST_BY_VERSION, MANNY_CORE_OFF_DIGEST_BY_VERSION
  (read by g197a D1, g197b B8a, g198 C1, g199 B1/B2, g200_core F1a/F1b, g200_pull B1, g202 x3, g203 x2, g204 x2, g207 x2,
  g208 x4, g209, g210 O6/O6r, g211, g214, g215, g216 x2, g223 HM CONTROL, g226 G10, g227 c-MANNY/c-DIGEST, g228 d2, g229 b)
- g193_samecard OPEN_UNRULED_BY_VERSION (crash at :321)
- g197b_sweep HF_LEAK_BY_VERSION (B4i-l), B5C_BY_VERSION (B5c)
- g199_deload_arbitration DELOAD_ARB_BY_VERSION (C1 C3 C5 D2 I3), DELOAD_HINGE_BY_VERSION (E1a E1b E2 E3 G1 G2 G5), E6_BY_VERSION (E6)
- g200_pull_arbitration SWAP_BY_VERSION (P2c P2d P4 P6 P7)
- g219_samecard_draws ERA (F1 F2 R1-R8)
Files: scratchpad/gatekeeper_dry/ (v232_gate.out, sweep.out, stamp/*.out, base/*.out).
