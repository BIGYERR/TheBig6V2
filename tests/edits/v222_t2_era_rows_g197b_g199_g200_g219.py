#!/usr/bin/env python3
# V222 tooling slice T2: add the V222 era rows to g197b, g199, g200 and g219.
# D181 (P-SWAPDURABLE) is session-store only. Its ruling
# (tests/measure/v212_rulings/p_swapdurable_ruling.md) says "Nothing in buildProgram" and
# states HALF_MANNY 0ac7da6b1691a8e1 on V221 and the parked tree. So each [222] row aliases
# its [221] row, ruled UNMOVED, the shape V221 used.
# Every anchor is a whole [221] line asserted count==1; no [222] row may exist yet.
# All files are checked before any file is written; the first miss aborts the whole script.
import os, sys

ROOT = '/Users/CanasBangin/Desktop/TheBig6V2/tests/gates/'
WHY = ("D181 P-SWAPDURABLE is session-store only: nothing in buildProgram, 0 engine cards change; "
       "the ruling states HALF_MANNY 0ac7da6b1691a8e1 unchanged")

def line_starting(text, prefix):
    hits = [l for l in text.split('\n') if l.startswith(prefix)]
    if len(hits) != 1:
        sys.exit('ABORT: anchor prefix %r matched %d lines' % (prefix, len(hits)))
    return hits[0] + '\n'

# file -> list of (anchor line prefix, new line)
PLAN = {
    'g197b_sweep.js': [
        ('HF_LEAK_BY_VERSION[221] = HF_LEAK_BY_VERSION[220];',
         'HF_LEAK_BY_VERSION[222] = HF_LEAK_BY_VERSION[221];   // V222 (D181): ruled UNMOVED (' + WHY + '; the [221] 0/0 carries)'),
        ('B5C_BY_VERSION[221] = B5C_BY_VERSION[220];',
         'B5C_BY_VERSION[222] = B5C_BY_VERSION[221];   // V222 (D181): ruled UNMOVED (' + WHY + '; the [221] 0 carries)'),
    ],
    'g199_deload_arbitration.js': [
        # the three [221] rows are adjacent: one block anchored on the last of them
        ('DELOAD_HINGE_BY_VERSION[221] = DELOAD_HINGE_BY_VERSION[220];',
         'DELOAD_ARB_BY_VERSION[222] = DELOAD_ARB_BY_VERSION[221];   // V222 (D181): ruled UNMOVED (' + WHY + '; C1 264 C3 264 C5 0 D2 19 I3 18 carry)\n'
         'E6_BY_VERSION[222] = E6_BY_VERSION[221];   // V222 (D181): ruled UNMOVED (' + WHY + '; E6 28 carries)\n'
         'DELOAD_HINGE_BY_VERSION[222] = DELOAD_HINGE_BY_VERSION[221];   // V222 (D181): ruled UNMOVED (' + WHY + '; E1a 12369 E1b 9319 E3 44 G1 1275 G5 44 carry)'),
    ],
    'g200_pull_arbitration.js': [
        ('SWAP_BY_VERSION[221] = SWAP_BY_VERSION[220];',
         'SWAP_BY_VERSION[222] = SWAP_BY_VERSION[221];   // V222 (D181): ruled UNMOVED (' + WHY + '; the athlete session swap store is not the pull-day swap draw, so the p1 population stays 138)'),
    ],
    'g219_samecard_draws.js': [
        ('ERA[221] = ERA[220];',
         'ERA[222] = ERA[221];   // V222 (D181): ruled UNMOVED (' + WHY + ')'),
    ],
}

# The g199 block must also follow its two sibling [221] rows directly.
G199_ADJ = ['DELOAD_ARB_BY_VERSION[221] = DELOAD_ARB_BY_VERSION[220];',
            'E6_BY_VERSION[221] = E6_BY_VERSION[220];',
            'DELOAD_HINGE_BY_VERSION[221] = DELOAD_HINGE_BY_VERSION[220];']

out = {}
for fn, reps in PLAN.items():
    p = ROOT + fn
    src = open(p, encoding='utf-8').read()
    if src.count('[222]') != 0:
        sys.exit('ABORT: %s already has a [222] token (%d)' % (fn, src.count('[222]')))
    if fn == 'g199_deload_arbitration.js':
        lines = src.split('\n')
        idx = [i for i, l in enumerate(lines) if any(l.startswith(a) for a in G199_ADJ)]
        if len(idx) != 3 or idx[2] - idx[0] != 2:
            sys.exit('ABORT: g199 [221] rows are not three adjacent lines: %r' % idx)
    for prefix, new in reps:
        anchor = line_starting(src, prefix)
        if src.count(anchor) != 1:
            sys.exit('ABORT: %s anchor line count %d != 1: %r' % (fn, src.count(anchor), prefix))
        src = src.replace(anchor, anchor + new + '\n', 1)
    out[p] = src

for p, src in out.items():
    open(p, 'w', encoding='utf-8').write(src)
    print('wrote', os.path.basename(p), 'rows [222]:', src.count('[222] ='))
