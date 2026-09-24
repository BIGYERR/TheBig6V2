#!/usr/bin/env python3
# V214 close, part A2 (3 edits) — g199's era rows for ia-version 214, RULED UNMOVED, references to 213.
# Printed by coach on the V214 tree with g199's method: C1 364 C3 364 C5 32 D2 19 I3 496; E6 28;
# E1b 9334 E3 44 G5 {"Explosive finisher":44} (PASS 56 FAIL 0 on the V214 tree with rows present).
# No index.html change. No ia-version change (close B, last).
import io, sys
P = '/Users/CanasBangin/Desktop/TheBig6V2/tests/gates/g199_deload_arbitration.js'
C = "// D158: ruled UNMOVED, no lift section touched (printed: C1 364 C3 364 C5 32 D2 19 I3 496; E6 28; E1b 9334 E3 44 G5 44)"
ROWS = [
  ('DELOAD_ARB_BY_VERSION[213] = DELOAD_ARB_BY_VERSION[212];',   'DELOAD_ARB_BY_VERSION[214] = DELOAD_ARB_BY_VERSION[213];   ' + C),
  ('E6_BY_VERSION[213] = E6_BY_VERSION[212];',                   'E6_BY_VERSION[214] = E6_BY_VERSION[213];   ' + C),
  ('DELOAD_HINGE_BY_VERSION[213] = DELOAD_HINGE_BY_VERSION[212];', 'DELOAD_HINGE_BY_VERSION[214] = DELOAD_HINGE_BY_VERSION[213];   ' + C),
]
lines = io.open(P, encoding='utf-8').read().split('\n'); bad = False
for pre, new in ROWS:
    hits = [i for i, l in enumerate(lines) if l.startswith(pre)]
    dup = sum(1 for l in lines if l.startswith(new.split('   //')[0]))
    print('%-64s count=%d new-row-present=%d' % (pre, len(hits), dup))
    if len(hits) != 1 or dup != 0: bad = True; continue
    lines.insert(hits[0] + 1, new)
if bad: sys.exit('ABORT: an anchor did not appear exactly once (or the 214 row exists). Nothing written.')
io.open(P, 'w', encoding='utf-8').write('\n'.join(lines)); print('WROTE', P)
