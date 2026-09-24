#!/usr/bin/env python3
# V217 closeB — the g199 era rows for D160 (coach printed them on the tree stamped 217) and the
# ia-version bump 216 -> 217 (Mario authorized the bump after green). g199 groups its era rows per
# version (ARB, E6, HINGE), so the [217] triple goes directly after the [216] triple in the same
# order: each [217] row still follows its [216] sibling. Coach's comments verbatim. The version
# meta bump is the last replacement. No commit.
import sys
ROOT = '/Users/CanasBangin/Desktop/TheBig6V2/'
G199 = 'tests/gates/g199_deload_arbitration.js'
H216 = "DELOAD_HINGE_BY_VERSION[216] = DELOAD_HINGE_BY_VERSION[215];   // D154/D156: ruled UNMOVED (E1a 12384, E1b 9319, E3 44, G1 1290, G5 44 printed; a Delts finisher is not posterior and a triceps rename is not a hinge)\n"
R1 = "DELOAD_ARB_BY_VERSION[217] = DELOAD_ARB_BY_VERSION[216];   // D160: ruled UNMOVED (C1 364 C3 364 C5 32 D2 19 I3 496 printed)\n"
R2 = "E6_BY_VERSION[217] = E6_BY_VERSION[216];   // D160: ruled UNMOVED (28 printed)\n"
R3 = "DELOAD_HINGE_BY_VERSION[217] = DELOAD_HINGE_BY_VERSION[216];   // D160: ruled UNMOVED (E1a 12384 E1b 9319 E3 44 G1 1290 G5 44 printed; a like-for-like hinge revert in a Conditioning slot is not a posterior count)\n"
EDITS = [
  (G199, H216, H216 + R1),                      # E1: after the [216] triple
  (G199, R1, R1 + R2),                          # E2: after E1
  (G199, R2, R2 + R3),                          # E3: after E2
  ('index.html', '<meta name="ia-version" content="216">', '<meta name="ia-version" content="217">'),   # E4: LAST
]
src = {f: open(ROOT + f, encoding='utf-8').read() for f in (G199, 'index.html')}
for sib in ('DELOAD_ARB_BY_VERSION[216] = ', 'E6_BY_VERSION[216] = ', 'DELOAD_HINGE_BY_VERSION[216] = '):
    if src[G199].count(sib) != 1: print('ABORT: [216] sibling count %d: %s' % (src[G199].count(sib), sib)); sys.exit(2)
for row in ('DELOAD_ARB_BY_VERSION[217]', 'E6_BY_VERSION[217]', 'DELOAD_HINGE_BY_VERSION[217]'):
    if src[G199].count(row) != 0: print('ABORT: %s already exists' % row); sys.exit(2)
for i, (f, a, b) in enumerate(EDITS):
    n = src[f].count(a)
    if n != 1: print('ABORT: E%d anchor count %d in %s' % (i + 1, n, f)); sys.exit(2)
    src[f] = src[f].replace(a, b, 1); print('applied E%d %s' % (i + 1, f))
for f in src: open(ROOT + f, 'w', encoding='utf-8').write(src[f])
print('written')
