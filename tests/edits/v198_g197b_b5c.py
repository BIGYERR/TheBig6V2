#!/usr/bin/env python3
# V198, tests only. B5c's equality pin moves 240 -> 235, licensed by D85 (NOT D90: D90 is
# the unilateral-coverage revisit). The five duplicates that left are all one class: on five
# home_basic/advanced/run_half seed-11 Tuesday legs cards `Step-ups (KB)` printed as the day's
# Main lift AND again inside `Leg superset A`; with D85's posterior floor the day's only hinge
# is ineligible for the trim, so the trim takes the duplicate step-up instead. 7 items in,
# 7 items out; 4 sections in, 4 out; cardio and day title byte-identical.
# THE PIN STAYS AN EQUALITY, by ruling. A tolerance would let the harvest cost regrow silently.
# B5a, B5b and B5d keep their bytes. Anchors asserted count==1 before any write.
import io, sys

G = '/Users/CanasBangin/Desktop/TheBig6V2/tests/gates/g197b_sweep.js'

# The header keeps its column width: same visible length, box-drawing rule padded to match.
OLD_HDR = '// \u2500\u2500 D76: same-card duplicates ' + '\u2500' * 54
NEW_HDR = '// \u2500\u2500 D76: same-card duplicates (count re-pinned by D85, V198) '
NEW_HDR = NEW_HDR + '\u2500' * (len(OLD_HDR) - len(NEW_HDR))
assert len(NEW_HDR) == len(OLD_HDR) == 86, (len(NEW_HDR), len(OLD_HDR))

EDITS = [
    ('b5c-header',
     OLD_HDR + '\n',
     NEW_HDR + '\n'),
    ('b5c-assert',
     "ok('B5c same-card duplicates == 240 (V196 baseline; D76 absorbs the whole +175 harvest cost)', dup === 240, dup);\n",
     "ok('B5c same-card duplicates == 235 (240 at V196/V197; D76 absorbs the whole +175 harvest cost, then D85 licenses the 5 that left: on 5 home_basic/advanced/run_half seed-11 Tuesday legs cards the posterior floor refuses the last hinge, so the trim takes the duplicate Step-ups (KB) instead, 7 items in and 7 items out)', dup === 235, dup);\n"),
]

src = io.open(G, encoding='utf-8').read()
bad = []
for tag, old, new in EDITS:
    n = src.count(old)
    print('anchor %-11s count=%d' % (tag, n))
    if n != 1:
        bad.append(tag)
if bad:
    sys.stderr.write('ABORT, no bytes written: ' + ', '.join(bad) + '\n'); sys.exit(1)

# D-code hygiene: D90/D86/D87 must not appear in what we write
for _, _, new in EDITS:
    for forbidden in ('D90', 'D86', 'D87'):
        assert forbidden not in new, 'forbidden D-code ' + forbidden

out = src
for tag, old, new in EDITS:
    out = out.replace(old, new, 1)
assert out != src
io.open(G, 'w', encoding='utf-8').write(out)
print('wrote ' + G)
