#!/usr/bin/env python3
# V219 slice 2 of 4 — D159 (coach, re-ruled V217): "the later section yields." The V197 D76 fallback in the
# Leg isolation draw restores the whole gear pool when one name survives and re-draws a name the card already
# holds. Ruled cfA: a single survivor is drawn alone; the gear pool returns only when none survive.
# Lifted VERBATIM from tests/measure/v219_chain_rebaseline.js (D159_OLD/D159_NEW, step 2).
# Oracle: applied on step 1, result is byte-identical to /tmp/v219_cf_step2.html.
# No gate, no sabotage, no version bump in this slice.
import sys
P = '/Users/CanasBangin/Desktop/TheBig6V2/index.html'
src = open(P, encoding='utf-8').read()

EDITS = [
  # A0 D159 cfA: the draw site keeps the one survivor instead of restoring the whole pool.
  ("const legIso=pick(_laLeft.length>=2?_laLeft:_laGear,2",
   "const legIso=pick(_laLeft.length>=2?_laLeft:(_laLeft.length?_laLeft:_laGear),2"),
]

for i, (a, b) in enumerate(EDITS):
    n = src.count(a)
    print('anchor A%d count %d :: %r' % (i, n, a[:70]))
    if n != 1:
        print('ABORT: anchor A%d count %d' % (i, n)); sys.exit(2)
    src = src.replace(a, b, 1)
if src.count("_laLeft.length>=2?_laLeft:_laGear,2") != 0:
    print('ABORT: post-condition'); sys.exit(3)
open(P, 'w', encoding='utf-8').write(src)
print('written')
