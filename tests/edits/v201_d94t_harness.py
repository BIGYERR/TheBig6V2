#!/usr/bin/env python3
# V201 / D94-t — harness-only slice (slice 2 of 4).
# A DIGEST TABLE ROW RECORDS A CLAIM, NOT A VALUE.
#   literal   => RULED MOVED
#   reference => RULED UNMOVED
# Five gates (g197a:98, g197b:98, g198:220, g199:335-336, g200_pull:265) all do
# TABLE[IA.version] and assert !!ROW && d===ROW. The reference idiom changes only how
# the row is WRITTEN, not the VALUE type, so all five readers stay byte-identical.
# index.html is NOT touched by this script.

import io, sys, os

HARNESS = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'harness.js')
HARNESS = os.path.normpath(HARNESS)

with io.open(HARNESS, 'r', encoding='utf-8') as f:
    src = f.read()

orig = src
edits = []

# ── 1. The convention comment, stated once on the tables ──────────────────────────
A1 = "const MANNY_DIGEST_BY_VERSION = {\n"
B1 = """// CONVENTION (D94-t). A row records a CLAIM, not a value.
//   A row written as a LITERAL asserts a RULED MOVE. It must cite the D-code and the
//   counterfactual oracle that rescues its provenance: the model is g200_core_tier F1a,
//   which pins the counterfactual to a digest two earlier versions independently
//   shipped (see the handoff §12 provenance entry).
//   A row written as a REFERENCE to V(N-1) asserts RULED UNMOVED. Its proof is the
//   two-artifact run gate.sh already performs: the same digest read off V(N-1) and V(N).
//   A MISSING row still fails loudly and cannot be satisfied by accident. Someone has
//   to type the version number either way.
const MANNY_DIGEST_BY_VERSION = {
"""
edits.append(('convention comment', A1, B1))

# ── 2. The two unchanged-idiom rows, appended after each object literal ───────────
A2 = """  200: 'd4364dd3fa63a3a1',   // D89 re-pin: the ruled digest move
};
"""
B2 = """  200: 'd4364dd3fa63a3a1',   // D89 re-pin: the ruled digest move
};
MANNY_DIGEST_BY_VERSION[201] = MANNY_DIGEST_BY_VERSION[200];              // D94: ruled UNMOVED (pull deload cards only; HALF_MANNY's cond[2] draws are never a hinge)
"""
edits.append(('MANNY_DIGEST_BY_VERSION[201]', A2, B2))

A3 = """  200: '5fe2c6bb32c76498',   // D89 re-pin: the ruled digest move
};
"""
B3 = """  200: '5fe2c6bb32c76498',   // D89 re-pin: the ruled digest move
};
MANNY_DELOAD_OFF_DIGEST_BY_VERSION[201] = MANNY_DELOAD_OFF_DIGEST_BY_VERSION[200];   // D94: ruled UNMOVED
"""
edits.append(('MANNY_DELOAD_OFF_DIGEST_BY_VERSION[201]', A3, B3))

for name, a, b in edits:
    n = src.count(a)
    if n != 1:
        sys.stderr.write('ABORT: anchor "%s" count==%d, expected 1. No bytes written.\n' % (name, n))
        sys.exit(1)
    src = src.replace(a, b, 1)
    print('ok  %s' % name)

if src == orig:
    sys.stderr.write('ABORT: no change produced.\n')
    sys.exit(1)

with io.open(HARNESS, 'w', encoding='utf-8') as f:
    f.write(src)
print('wrote %s' % HARNESS)
