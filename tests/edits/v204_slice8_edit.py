#!/usr/bin/env python3
# V204 slice 8 — the bump slice (D126).
#
# Four edits:
#   1-3  three era rows for [204], written as REFERENCE rows to [203] because D126 is
#        ruled UNMOVED (string formatting + gate work only; no card, no draw, no dose).
#        Under this file's D94-t convention a LITERAL row asserts a ruled MOVE and a
#        REFERENCE row asserts a ruled UNMOVED, so a literal here would be a lie.
#   4    the ia-version bump 203 -> 204, LAST replacement in the script.
#
# Every anchor asserted count==1 before any write; first miss aborts the whole script.

import io, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
INDEX = os.path.join(ROOT, 'index.html')
HARNESS = os.path.join(ROOT, 'tests', 'harness.js')

def read(p):
    with io.open(p, 'r', encoding='utf-8', newline='') as f:
        return f.read()

def write(p, s):
    with io.open(p, 'w', encoding='utf-8', newline='') as f:
        f.write(s)

edits = []   # (label, path, old, new)

# ---------------------------------------------------------------- EDIT 1
edits.append((
    'E1 MANNY_DIGEST_BY_VERSION[204] reference row',
    HARNESS,
    "MANNY_DIGEST_BY_VERSION[203] = '7d4f7ed45cc5bd53';   // D117: the ruled digest move\n",
    "MANNY_DIGEST_BY_VERSION[203] = '7d4f7ed45cc5bd53';   // D117: the ruled digest move\n"
    "// V204: ruled UNMOVED, and written as a REFERENCE for that reason. D126 is string\n"
    "// formatting and gate work only: it changes how already-computed numbers are rendered\n"
    "// and what the gates assert about them. It moves no pool, no draw, no dose and no card,\n"
    "// so HALF_MANNY cannot move. The reference makes that claim structurally: if V203's row\n"
    "// is ever re-pinned, this one follows it instead of quietly disagreeing.\n"
    "MANNY_DIGEST_BY_VERSION[204] = MANNY_DIGEST_BY_VERSION[203];   // D126: ruled UNMOVED\n",
))

# ---------------------------------------------------------------- EDIT 2
edits.append((
    'E2 MANNY_DELOAD_OFF_DIGEST_BY_VERSION[204] reference row',
    HARNESS,
    "MANNY_DELOAD_OFF_DIGEST_BY_VERSION[203] = '8fe23ae9eadde78c';   // D117: the ruled digest move\n",
    "MANNY_DELOAD_OFF_DIGEST_BY_VERSION[203] = '8fe23ae9eadde78c';   // D117: the ruled digest move\n"
    "// V204: ruled UNMOVED, so a REFERENCE row. The deload-off variant is the same NRC\n"
    "// fixture with the deload pre-pass disabled; D126 is string-and-gate only and touches\n"
    "// nothing either arm draws from.\n"
    "MANNY_DELOAD_OFF_DIGEST_BY_VERSION[204] = MANNY_DELOAD_OFF_DIGEST_BY_VERSION[203];   // D126: ruled UNMOVED\n",
))

# ---------------------------------------------------------------- EDIT 3
edits.append((
    'E3 MANNY_CORE_OFF_DIGEST_BY_VERSION[204] reference row',
    HARNESS,
    "MANNY_CORE_OFF_DIGEST_BY_VERSION[203] = '658ad56c903ad829';   // D117 moved both arms; D120\n",
    "MANNY_CORE_OFF_DIGEST_BY_VERSION[203] = '658ad56c903ad829';   // D117 moved both arms; D120\n"
    "// V204: ruled UNMOVED, so a REFERENCE row. D126 is string-and-gate only; the\n"
    "// declared-core clause and everything the stripped-clause counterfactual draws are\n"
    "// untouched.\n"
    "MANNY_CORE_OFF_DIGEST_BY_VERSION[204] = MANNY_CORE_OFF_DIGEST_BY_VERSION[203];   // D126: ruled UNMOVED\n",
))

# ---------------------------------------------------------------- EDIT 4 (LAST: the version meta bump)
edits.append((
    'E4 ia-version 203 -> 204',
    INDEX,
    '<meta name="ia-version" content="203">',
    '<meta name="ia-version" content="204">',
))

# --- assert every anchor count==1 across the files BEFORE writing anything -------------
src = {INDEX: read(INDEX), HARNESS: read(HARNESS)}
staged = dict(src)
fail = False
for label, path, old, new in edits:
    n = staged[path].count(old)
    print('%-58s count=%d' % (label, n))
    if n != 1:
        print('ABORT: anchor count != 1 for %s' % label)
        fail = True
        break
    staged[path] = staged[path].replace(old, new, 1)
if fail:
    sys.exit(1)

# belt and braces on the bump: exactly one content="204", zero content="203"
if staged[INDEX].count('content="204"') != 1 or staged[INDEX].count('content="203"') != 0:
    print('ABORT: post-bump version count wrong')
    sys.exit(1)

for path in (HARNESS, INDEX):
    if staged[path] != src[path]:
        write(path, staged[path])
        print('WROTE %s' % path)
print('OK 4/4')
