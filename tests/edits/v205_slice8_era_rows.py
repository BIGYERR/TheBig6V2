#!/usr/bin/env python3
# V205 slice 8, EDITS 2/3/4 of 4: the three [205] era rows in tests/harness.js.
#
# FORM: all three are REFERENCE rows [205] = [204], asserting RULED UNMOVED, in this
# file's D94-t convention (a LITERAL asserts a ruled MOVE, a REFERENCE asserts a ruled
# UNMOVED). Evidence, printed by tests/measure/v205_slice8_era_arms.js on ONE run over
# both artifacts (V204 tag artifact and the bumped V205 candidate), which reproduced
# every V204 row on that same run so the new rows are anchored and not read back off a
# gate:
#     shipped    7d4f7ed45cc5bd53  IDENTICAL across V204 and V205
#     deloadOff  8fe23ae9eadde78c  IDENTICAL
#     coreOff    658ad56c903ad829  IDENTICAL
# A reference is the honest form here: V205 moves a great deal of engine code, but none
# of it reaches this fixture, and a reference states that dependence structurally — if
# V203's literal is ever re-pinned these follow it instead of quietly disagreeing.
import io

PATH = 'tests/harness.js'
src = io.open(PATH, encoding='utf-8').read()

EDITS = []

# ---- EDIT 2: shipped arm ----
EDITS.append((
"MANNY_DIGEST_BY_VERSION[204] = MANNY_DIGEST_BY_VERSION[203];   // D126: ruled UNMOVED\n",
"MANNY_DIGEST_BY_VERSION[204] = MANNY_DIGEST_BY_VERSION[203];   // D126: ruled UNMOVED\n"
"// V205: ruled UNMOVED, and written as a REFERENCE for that reason. V205 is a large\n"
"// build (D122, D125, D127, D129, D130) but every ruling in it lands on NSW test-goal\n"
"// run work and on lift placement for typed multisport days: the D125 easy-day ceiling\n"
"// chooser and its spacing, the D127 pace-eve rule, the D129 tie-break ranks and the\n"
"// D130 typed-day adjacency. HALF_MANNY is an NRC half-marathon fixture (run_half); no\n"
"// V205 ruling touches an NRC pool, draw, dose or card. D113 was pulled from this\n"
"// version by Mario and ships on its own, so nothing it would have moved is here.\n"
"MANNY_DIGEST_BY_VERSION[205] = MANNY_DIGEST_BY_VERSION[204];   // V205: ruled UNMOVED\n",
))

# ---- EDIT 3: deload-off arm ----
EDITS.append((
"MANNY_DELOAD_OFF_DIGEST_BY_VERSION[204] = MANNY_DELOAD_OFF_DIGEST_BY_VERSION[203];   // D126: ruled UNMOVED\n",
"MANNY_DELOAD_OFF_DIGEST_BY_VERSION[204] = MANNY_DELOAD_OFF_DIGEST_BY_VERSION[203];   // D126: ruled UNMOVED\n"
"// V205: ruled UNMOVED, so a REFERENCE row. The deload-off variant is the same NRC\n"
"// fixture with the deload pre-pass disabled; V205 moves nothing either arm draws from.\n"
"MANNY_DELOAD_OFF_DIGEST_BY_VERSION[205] = MANNY_DELOAD_OFF_DIGEST_BY_VERSION[204];   // V205: ruled UNMOVED\n",
))

# ---- EDIT 4: core-off arm ----
EDITS.append((
"MANNY_CORE_OFF_DIGEST_BY_VERSION[204] = MANNY_CORE_OFF_DIGEST_BY_VERSION[203];   // D126: ruled UNMOVED\n",
"MANNY_CORE_OFF_DIGEST_BY_VERSION[204] = MANNY_CORE_OFF_DIGEST_BY_VERSION[203];   // D126: ruled UNMOVED\n"
"// V205: ruled UNMOVED, so a REFERENCE row. The declared-core clause and everything the\n"
"// stripped-clause counterfactual draws are untouched by V205.\n"
"MANNY_CORE_OFF_DIGEST_BY_VERSION[205] = MANNY_CORE_OFF_DIGEST_BY_VERSION[204];   // V205: ruled UNMOVED\n",
))

for i, (old, new) in enumerate(EDITS, start=2):
    n = src.count(old)
    print('EDIT %d anchor count = %d' % (i, n))
    assert n == 1, 'ABORT at EDIT %d: anchor count %d, expected 1' % (i, n)
    src = src.replace(old, new)

for name in ('MANNY_DIGEST_BY_VERSION', 'MANNY_DELOAD_OFF_DIGEST_BY_VERSION', 'MANNY_CORE_OFF_DIGEST_BY_VERSION'):
    # exactly one occurrence: the new row's LHS. Its RHS is [204], so [205] appears once.
    assert src.count(name + '[205]') == 1, 'ABORT: %s[205] not written exactly once' % name
    assert src.count(name + '[205] = ' + name + '[204];') == 1, 'ABORT: %s[205] is not a REFERENCE to [204]' % name

io.open(PATH, 'w', encoding='utf-8').write(src)
print('WROTE tests/harness.js: three [205] REFERENCE rows')
