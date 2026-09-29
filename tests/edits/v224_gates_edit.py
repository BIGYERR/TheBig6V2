#!/usr/bin/env python3
"""
D185 P-WCTODAY / V224. Pure CSS build (wildcard-mark color fix): no hunk reaches
buildProgram or anything it calls. Gatekeeper's fuzz sweep confirmed HALF_MANNY
0ac7da6b1691a8e1, deload-off 1069cd7f86eed204, core-off 9d14801a63111081 are all
unmoved from V223 (harness.js already carries the [224] rows for the three MANNY
digest tables -- confirmed present, not touched here).

This script adds the missing V224 row to each of the four gate-local, per-file
era tables that mirror those same digests via other pinned counts. Every new row
is a REFERENCE to the V223 row (ruled UNMOVED), added immediately after it,
changing only the version number. Pure addition: 0 lines removed.

Touches ONLY:
  tests/gates/g199_deload_arbitration.js   (DELOAD_ARB_BY_VERSION, E6_BY_VERSION, DELOAD_HINGE_BY_VERSION)
  tests/gates/g200_pull_arbitration.js     (SWAP_BY_VERSION)
g200_core_tier.js and g202_d108_touchset_freeze.js read MANNY_*_DIGEST_BY_VERSION
directly from harness.js, which already carries their V224 rows -- nothing to add.
"""
import re, sys

ROOT = "/Users/CanasBangin/Desktop/TheBig6V2"

def patch(path, anchor, insertion):
    with open(path, "r", encoding="utf-8") as f:
        src = f.read()
    n = src.count(anchor)
    if n != 1:
        print(f"ABORT: anchor count={n} (want 1) in {path}")
        print(repr(anchor[:200]))
        sys.exit(1)
    idx = src.index(anchor) + len(anchor)
    new_src = src[:idx] + insertion + src[idx:]
    with open(path, "w", encoding="utf-8") as f:
        f.write(new_src)
    print(f"OK: patched {path}")

# ---------------------------------------------------------------------------
# g199_deload_arbitration.js: three tables, one V224 reference row each,
# inserted immediately after the existing V223 rows.
# ---------------------------------------------------------------------------
g199 = f"{ROOT}/tests/gates/g199_deload_arbitration.js"

anchor199 = "DELOAD_HINGE_BY_VERSION[223] = DELOAD_HINGE_BY_VERSION[222];   // V223 (D182/D183/D184): ruled UNMOVED (D182 P-RACEDATE is race-date display and copy, amendment (a) withdrew the one hunk that moved the digest; D183 P-SAFEPACE is the wizard cardio_goal step; D184 P-TESTLEN pins dated test goals to their test week through the start resolver only, 0/210 race and run_base builds move, never NRC; nothing in buildProgram, 0 engine cards change; the rulings state HALF_MANNY 0ac7da6b1691a8e1 unchanged; E1a 12369 E1b 9319 E3 44 G1 1275 G5 44 carry)"

insertion199 = (
    "\n"
    "DELOAD_ARB_BY_VERSION[224] = DELOAD_ARB_BY_VERSION[223];   // V224 (D185 P-WCTODAY): ruled UNMOVED (D185 is pure CSS, the wildcard-mark/checkmark color fix; no hunk reaches buildProgram; standing ruling 5: HALF_MANNY 0ac7da6b1691a8e1 / deload-off 1069cd7f86eed204 / core-off 9d14801a63111081 printed by gatekeeper's fuzz sweep on the V224 candidate; C1 264 C3 264 C5 0 D2 19 I3 18 carry)\n"
    "E6_BY_VERSION[224] = E6_BY_VERSION[223];   // V224 (D185 P-WCTODAY): ruled UNMOVED (D185 is pure CSS, the wildcard-mark/checkmark color fix; no hunk reaches buildProgram; standing ruling 5: HALF_MANNY 0ac7da6b1691a8e1 / deload-off 1069cd7f86eed204 / core-off 9d14801a63111081 printed by gatekeeper's fuzz sweep on the V224 candidate; E6 28 carries)\n"
    "DELOAD_HINGE_BY_VERSION[224] = DELOAD_HINGE_BY_VERSION[223];   // V224 (D185 P-WCTODAY): ruled UNMOVED (D185 is pure CSS, the wildcard-mark/checkmark color fix; no hunk reaches buildProgram; standing ruling 5: HALF_MANNY 0ac7da6b1691a8e1 / deload-off 1069cd7f86eed204 / core-off 9d14801a63111081 printed by gatekeeper's fuzz sweep on the V224 candidate; E1a 12369 E1b 9319 E3 44 G1 1275 G5 44 carry)"
)

patch(g199, anchor199, insertion199)

# ---------------------------------------------------------------------------
# g200_pull_arbitration.js: one table, one V224 reference row.
# ---------------------------------------------------------------------------
g200p = f"{ROOT}/tests/gates/g200_pull_arbitration.js"

anchor200p = "SWAP_BY_VERSION[223] = SWAP_BY_VERSION[222];   // V223 (D182/D183/D184): ruled UNMOVED (D182 P-RACEDATE is race-date display and copy, amendment (a) withdrew the one hunk that moved the digest; D183 P-SAFEPACE is the wizard cardio_goal step; D184 P-TESTLEN pins dated test goals to their test week through the start resolver only, 0/210 race and run_base builds move, never NRC; nothing in buildProgram, 0 engine cards change; the rulings state HALF_MANNY 0ac7da6b1691a8e1 unchanged; none of the three reaches the pull-day swap draw, so the p1 population stays 138)"

insertion200p = (
    "\n"
    "SWAP_BY_VERSION[224] = SWAP_BY_VERSION[223];   // V224 (D185 P-WCTODAY): ruled UNMOVED (D185 is pure CSS, the wildcard-mark/checkmark color fix; no hunk reaches buildProgram, 0 engine cards change; standing ruling 5: HALF_MANNY 0ac7da6b1691a8e1 unchanged, printed by gatekeeper's fuzz sweep on the V224 candidate; a CSS-only build does not reach the pull-day swap draw, so the p1 population stays 138)"
)

patch(g200p, anchor200p, insertion200p)

print("DONE")
