#!/usr/bin/env python3
# V231 slice 5 of 6 — D196 P-BWFALLBACK, lowback half.
# Ruling (tests/measure/v231_rulings/v231_ruling_d196_d195a1_d197.md, Mario: "Bed hip thrust" for low back):
#   'Banded hip thrust' -> _bwHTlb in the lowback/protect back + hinge literals and the
#   lowback/workaround back literal. Three replacements; every anchor asserted count==1
#   before any write. No ia-version bump here (slice 6 bumps).
# The hinge literal is not anchored alone: it rides with its backCompoundPool line.
import sys

PATH = '/Users/CanasBangin/Desktop/TheBig6V2/index.html'

REPL = [
    # 1+2: lowback/protect back + hinge (anchored together)
    (
        "        backCompoundPool = hasBarbell?_gear(['Neutral-grip chinups','Chinups','Lat pulldown','Assisted pullups']):['Banded hip thrust','Single-leg glute bridge'];\n"
        "        hingePool = ['Banded hip thrust','Single-leg glute bridge'];\n",
        "        backCompoundPool = hasBarbell?_gear(['Neutral-grip chinups','Chinups','Lat pulldown','Assisted pullups']):[_bwHTlb,'Single-leg glute bridge'];\n"
        "        hingePool = [_bwHTlb,'Single-leg glute bridge'];\n",
    ),
    # 3: lowback/workaround back
    (
        "        backCompoundPool = hasBarbell?_gear(['Weighted chinups','Neutral-grip chinups','Lat pulldown','Chinups']):['Banded hip thrust','Single-leg hip thrust'];\n",
        "        backCompoundPool = hasBarbell?_gear(['Weighted chinups','Neutral-grip chinups','Lat pulldown','Chinups']):[_bwHTlb,'Single-leg hip thrust'];\n",
    ),
]

with open(PATH, encoding='utf-8') as f:
    src = f.read()

# Verify every anchor before touching anything.
for i, (old, new) in enumerate(REPL, 1):
    n = src.count(old)
    if n != 1:
        sys.exit('ABORT: anchor %d count=%d (expected 1): %r' % (i, n, old[:100]))

out = src
for i, (old, new) in enumerate(REPL, 1):
    if out.count(old) != 1:
        sys.exit('ABORT: anchor %d drifted mid-run' % i)
    out = out.replace(old, new, 1)
    print('anchor %d: count 1, replaced' % i)

if src.count('const _bwHTlb=') != 1:
    sys.exit('ABORT: _bwHTlb lens not declared (slice 4 missing)')

with open(PATH, 'w', encoding='utf-8') as f:
    f.write(out)
print('wrote', PATH)
