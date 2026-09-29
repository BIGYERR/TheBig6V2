#!/usr/bin/env python3
# D185 P-WCTODAY (V224, pure CSS wildcard-mark color fix): add V224 era rows to the
# version-keyed tables in g193_samecard.js and g197b_sweep.js. No hunk in D185 reaches
# buildProgram or anything it calls; HALF_MANNY digest 0ac7da6b1691a8e1 unmoved (gatekeeper
# fuzz sweep). Each new row mirrors its V223 precedent exactly (same value), changing only
# the version number and rationale text. Pure additions, zero removals.
# Touches exactly: tests/gates/g193_samecard.js, tests/gates/g197b_sweep.js

import sys

def replace_once(text, old, new, label, path):
    c = text.count(old)
    if c != 1:
        print("ABORT: anchor for %s found %d times (expected 1) in %s" % (label, c, path))
        sys.exit(1)
    return text.replace(old, new, 1)

# ---- g193_samecard.js: OPEN_UNRULED_BY_VERSION ----
P1 = "tests/gates/g193_samecard.js"
with open(P1, "r", encoding="utf-8") as f:
    src = f.read()

anchor1 = "OPEN_UNRULED_BY_VERSION[223] = OPEN_UNRULED_BY_VERSION[222];   // V223 (D182/D183/D184): ruled UNMOVED (D182 P-RACEDATE is race-date display, D183 P-SAFEPACE is the wizard cardio_goal step, D184 P-TESTLEN pins dated test goals to their test week in the resolver; none adds a card and together they change 0 engine cards on this class: buildProgram is deliberately unchanged in p_racedate_ruling.md amendment (a), p_safepace_ruling.md amendment 2 and p_testlen_d184_ruling.md, and all three state HALF_MANNY 0ac7da6b1691a8e1 unchanged; the swing class stays a ruled 0)"
new1 = anchor1 + "\nOPEN_UNRULED_BY_VERSION[224] = OPEN_UNRULED_BY_VERSION[223];   // V224 (D185 P-WCTODAY): ruled UNMOVED (D185 is pure CSS, the wildcard-mark/checkmark color fix; no hunk reaches buildProgram or anything it calls; HALF_MANNY 0ac7da6b1691a8e1 unchanged per gatekeeper's fuzz sweep on the V224 candidate; the swing class stays a ruled 0)"
src = replace_once(src, anchor1, new1, "OPEN_UNRULED_BY_VERSION[223] row", P1)

with open(P1, "w", encoding="utf-8") as f:
    f.write(src)
print("OK: 1 edit applied to %s" % P1)

# ---- g197b_sweep.js: HF_LEAK_BY_VERSION and B5C_BY_VERSION ----
P2 = "tests/gates/g197b_sweep.js"
with open(P2, "r", encoding="utf-8") as f:
    src2 = f.read()

anchor2 = "HF_LEAK_BY_VERSION[223] = HF_LEAK_BY_VERSION[222];   // V223 (D182/D183/D184): ruled UNMOVED (D182 P-RACEDATE is race-date display and copy, amendment (a) withdrew the one hunk that moved the digest; D183 P-SAFEPACE is the wizard cardio_goal step; D184 P-TESTLEN pins dated test goals to their test week through the start resolver only, 0/210 race and run_base builds move, never NRC; nothing in buildProgram, 0 engine cards change; the rulings state HALF_MANNY 0ac7da6b1691a8e1 unchanged; the [222] 0/0 carries)"
new2 = anchor2 + "\nHF_LEAK_BY_VERSION[224] = HF_LEAK_BY_VERSION[223];   // V224 (D185 P-WCTODAY): ruled UNMOVED (D185 is pure CSS, the wildcard-mark/checkmark color fix; no hunk reaches buildProgram; the [223] 0/0 carries)"
src2 = replace_once(src2, anchor2, new2, "HF_LEAK_BY_VERSION[223] row", P2)

anchor3 = "B5C_BY_VERSION[223] = B5C_BY_VERSION[222];   // V223 (D182/D183/D184): ruled UNMOVED (D182 P-RACEDATE is race-date display and copy, amendment (a) withdrew the one hunk that moved the digest; D183 P-SAFEPACE is the wizard cardio_goal step; D184 P-TESTLEN pins dated test goals to their test week through the start resolver only, 0/210 race and run_base builds move, never NRC; nothing in buildProgram, 0 engine cards change; the rulings state HALF_MANNY 0ac7da6b1691a8e1 unchanged; the [222] 0 carries)"
new3 = anchor3 + "\nB5C_BY_VERSION[224] = B5C_BY_VERSION[223];   // V224 (D185 P-WCTODAY): ruled UNMOVED (D185 is pure CSS, the wildcard-mark/checkmark color fix; no hunk reaches buildProgram; the [223] 0 carries)"
src2 = replace_once(src2, anchor3, new3, "B5C_BY_VERSION[223] row", P2)

with open(P2, "w", encoding="utf-8") as f:
    f.write(src2)
print("OK: 2 edits applied to %s" % P2)
