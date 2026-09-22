#!/usr/bin/env python3
# V202 post-verification fix — TEST TREE ONLY. index.html is NOT touched; ia-version stays 202.
#
# F1  tests/gates/g202_d108_touchset_freeze.js R6: the HALF_MANNY pin stops being a bare
#     literal and reads MANNY_DIGEST_BY_VERSION[IA.version] with the same NO ROW conjunct
#     its three V202 siblings use (g202_pace_anchor B1, g202_pace_copy B2). Standing ruling 5:
#     row existence is a conjunct so an absent row fails loudly. A bare literal would pass on
#     V203 with no row. ONE row changes how it sources its expectation — the gate stays 10 rows.
#     The local name is mannyRow, not row: in THIS file `row` is the assertion helper.
#
# F2  tests/sabotage/v202.json M13: the note's disclosed collateral gains g202_pace_anchor R2.
#     Gatekeeper's sweep found M13 reddens R2 as well; R2 converts the beginner's DEFAULT row
#     at 1.5 mi through the same log-interpolation model M13 replaces, so reddening is correct
#     behaviour and a note-completeness gap, not a mutation or gate defect. The mutation's
#     anchor, replacement and declared target (g202_pace_anchor Q2b) are untouched.

import io, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))   # tests/
REPO = os.path.dirname(ROOT)

def rd(p):
    with io.open(p, 'r', encoding='utf-8') as f: return f.read()

def wr(p, s):
    with io.open(p, 'w', encoding='utf-8') as f: f.write(s)

def sub1(src, old, new, tag):
    n = src.count(old)
    print('anchor %-6s count=%d' % (tag, n))
    if n != 1:
        sys.exit('ABORT: anchor %s matched %d times, expected exactly 1' % (tag, n))
    return src.replace(old, new, 1)

# ─────────────────────────── F1 ───────────────────────────
GATE = os.path.join(ROOT, 'gates', 'g202_d108_touchset_freeze.js')
g = rd(GATE)

F1_OLD = """const manny = H.progDigest(IA.buildProgram(JSON.parse(JSON.stringify(H.fixtures.HALF_MANNY))));
row('R6', manny === 'd4364dd3fa63a3a1',
  'HALF MANNY digest pin d4364dd3fa63a3a1 (read ' + manny + '): D108 changes no prescription');"""

F1_NEW = """const mannyRow = H.MANNY_DIGEST_BY_VERSION[IA.version];
const manny = H.progDigest(IA.buildProgram(JSON.parse(JSON.stringify(H.fixtures.HALF_MANNY))));
row('R6', !!mannyRow && manny === mannyRow,
  'HALF MANNY matches the V' + IA.version + ' row of MANNY_DIGEST_BY_VERSION ('
  + (mannyRow || 'NO ROW') + '): got ' + manny + '. D108 changes no prescription; a move here '
  + 'is an unruled digest move, and an absent row is a missing pin, not a pass');"""

g = sub1(g, F1_OLD, F1_NEW, 'F1')
wr(GATE, g)
print('wrote', GATE)

# ─────────────────────────── F2 ───────────────────────────
SPEC = os.path.join(ROOT, 'sabotage', 'v202.json')
s = rd(SPEC)

F2_OLD = ("EXPECTED COLLATERAL: Q5, Q7, Q8 red (the after-grid hangs off the anchor), "
          "and g202_pace_copy C1 red, because the ruled note prints the block target and the "
          "gate derives 7:44/mi from the log model.")

F2_NEW = ("EXPECTED COLLATERAL: Q5, Q7, Q8 red (the after-grid hangs off the anchor), "
          "and g202_pace_copy C1 red, because the ruled note prints the block target and the "
          "gate derives 7:44/mi from the log model. R2 red as well: the beginner's DEFAULT row "
          "converts at 1.5 mi through the very log model this mutation replaces (690/735 reads "
          "706.09 under log, 700.6786900806834 under linear), so that red is the gate working.")

s = sub1(s, F2_OLD, F2_NEW, 'F2')
wr(SPEC, s)
print('wrote', SPEC)

print('DONE — index.html untouched by construction: this script opens no path outside tests/')
