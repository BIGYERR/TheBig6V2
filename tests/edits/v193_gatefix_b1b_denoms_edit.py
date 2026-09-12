#!/usr/bin/env python3
# V193 gate-file amendment, part 4. Ties gatekeeper's day-level figures (97 lost / 240 gained,
# 100% on long-run tier B) to the numbers THIS gate prints on the 288-cell WIDE lattice
# (excluded core sections 400 -> 397; off-long-run total 3744 -> 3792), so the next reader
# does not read two different denominators as a contradiction. GATE FILE ONLY.
import sys, io, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TARGET = os.path.join(ROOT, 'gates', 'g193_budget_floor.js')
src = io.open(TARGET, encoding='utf-8').read()
orig = src
old = r"""// Measured at gatekeeper's own denominator, day by day rather than per cell: 97 core sections
// lost, 100% of them on long-run tier B days and ZERO on any other day type, against 240
// gained. A day where the run owns the training decision is the one place the trunk block is"""
new = r"""// Measured at gatekeeper's own denominator, day by day rather than per cell: 97 core sections
// lost, 100% of them on long-run tier B days and ZERO on any other day type, against 240
// gained. TWO DENOMINATORS, ONE PHENOMENON, and they are not in conflict: on the 288-cell
// WIDE lattice this gate prints the same thing as 400 -> 397 core sections inside the carved
// out set and 3744 -> 3792 outside it. Every loss is inside; outside it the count rises by 48.
// A day where the run owns the training decision is the one place the trunk block is"""
n = src.count(old)
if n != 1:
    sys.stderr.write('ABORT: anchor matched %d times (need exactly 1). Nothing written.\n' % n); sys.exit(1)
src = src.replace(old, new)
io.open(TARGET, 'w', encoding='utf-8').write(src)
print('wrote %s (1 replacement, %d -> %d bytes)' % (TARGET, len(orig), len(src)))
