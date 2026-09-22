#!/usr/bin/env python3
# V203 slice E — the version and bookkeeping slice.
# Four edits across three files. Every anchor asserted count==1 before any write.
# The ia-version meta bump is the LAST replacement performed (standing builder rule).
#
# EDIT 1  index.html          ia-version 202 -> 203
# EDIT 2  tests/harness.js    MANNY_DIGEST_BY_VERSION[203] literal row (D117 ruled MOVE)
# EDIT 3  tests/harness.js    MANNY_DELOAD_OFF_DIGEST_BY_VERSION[203] literal row (D117)
# EDIT 4  IRON_ASYLUM_HANDOFF_1_1.md  D-code registry line D115/D116 -> D119/D120
import io, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
INDEX   = os.path.join(ROOT, 'index.html')
HARNESS = os.path.join(ROOT, 'tests', 'harness.js')
HANDOFF = os.path.join(ROOT, 'IRON_ASYLUM_HANDOFF_1_1.md')

def read(p):
    with io.open(p, 'r', encoding='utf-8', newline='') as f:
        return f.read()

def write(p, s):
    with io.open(p, 'w', encoding='utf-8', newline='') as f:
        f.write(s)

FAIL = []
def sub1(src, old, new, label):
    n = src.count(old)
    if n != 1:
        FAIL.append('%s: anchor count==%d, expected 1' % (label, n))
        return src
    print('  anchor OK (1)  %s' % label)
    return src.replace(old, new, 1)

def abort_if_failed(stage):
    if FAIL:
        sys.stderr.write('ABORT (%s):\n' % stage)
        for f in FAIL:
            sys.stderr.write('  ' + f + '\n')
        sys.exit(1)

# ---------------------------------------------------------------- harness.js
hs = read(HARNESS)

# EDIT 2 — HALF_MANNY digest, ruled MOVE, LITERAL row.
# Provenance under standing ruling 5: coach printed 7d4f7ed45cc5bd53 from a source-surgery
# copy carrying D117 slice 1 BEFORE this build, anchored to the V202 rows reproduced on the
# same run. It is a counterfactual anchor, not a number read off the built artifact.
E2_OLD = "MANNY_DIGEST_BY_VERSION[202] = MANNY_DIGEST_BY_VERSION[201];\n"
E2_NEW = (
    "MANNY_DIGEST_BY_VERSION[202] = MANNY_DIGEST_BY_VERSION[201];\n"
    "// V203: ruled MOVE, and written as a LITERAL for that reason. D117 gives the easy-day\n"
    "// ceiling a single owner: the ceiling sentence plus dose.cap rewrite every NRC recovery\n"
    "// and long-run card, and HALF_MANNY is an NRC half-marathon fixture built of exactly\n"
    "// those days. The counterfactual anchor was printed by coach from a source-surgery copy\n"
    "// carrying D117 slice 1 BEFORE this build, on a run that reproduced the V202 rows above.\n"
    "// It is not a digest read back off the artifact.\n"
    "MANNY_DIGEST_BY_VERSION[203] = '7d4f7ed45cc5bd53';   // D117: the ruled digest move\n"
)
hs = sub1(hs, E2_OLD, E2_NEW, 'EDIT 2 MANNY_DIGEST_BY_VERSION[203]')

# EDIT 3 — deload-off variant of the same fixture, same ruling, same provenance.
E3_OLD = "MANNY_DELOAD_OFF_DIGEST_BY_VERSION[202] = MANNY_DELOAD_OFF_DIGEST_BY_VERSION[201];\n"
E3_NEW = (
    "MANNY_DELOAD_OFF_DIGEST_BY_VERSION[202] = MANNY_DELOAD_OFF_DIGEST_BY_VERSION[201];\n"
    "// V203: ruled MOVE for the same reason, so a LITERAL row. The deload-off variant is the\n"
    "// same NRC fixture with the deload pre-pass disabled; D117 moves the recovery and\n"
    "// long-run cards it draws from on both arms. Counterfactual anchor, printed with the\n"
    "// row above from the same pre-build source-surgery copy.\n"
    "MANNY_DELOAD_OFF_DIGEST_BY_VERSION[203] = '8fe23ae9eadde78c';   // D117: the ruled digest move\n"
)
hs = sub1(hs, E3_OLD, E3_NEW, 'EDIT 3 MANNY_DELOAD_OFF_DIGEST_BY_VERSION[203]')

# ------------------------------------------------- IRON_ASYLUM_HANDOFF_1_1.md
# EDIT 4 — the D-code registry line. Only the two numbers move; the collision history
# and the rest of the sentence stay verbatim.
hf = read(HANDOFF)
E4_OLD = "highest assigned = D115. Next free = D116."
E4_NEW = "highest assigned = D119. Next free = D120."
hf = sub1(hf, E4_OLD, E4_NEW, 'EDIT 4 D-code registry line')

# ------------------------------------------------------------------ index.html
# EDIT 1 — the version meta bump. LAST replacement in the script, by standing rule.
ix = read(INDEX)
E1_OLD = '<meta name="ia-version" content="202">'
E1_NEW = '<meta name="ia-version" content="203">'
ix = sub1(ix, E1_OLD, E1_NEW, 'EDIT 1 ia-version 202 -> 203')

abort_if_failed('no file written')

write(HARNESS, hs)
write(HANDOFF, hf)
write(INDEX, ix)
print('v203 slice E: 4/4 edits applied across 3 files.')
