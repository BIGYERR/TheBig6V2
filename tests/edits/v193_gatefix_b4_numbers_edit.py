#!/usr/bin/env python3
# V193 gate-file amendment, part 3. The B4b/B4d report comments quoted coach's ruling
# figures (1,242 fewer deletions; 6,527 -> 5,285). This run measures -1,266 and 6,527 ->
# 5,261 on the same 288 cells. Both are recorded, attributed, and the live number is the one
# the gate prints. A comment carrying a number nobody re-measured is the defect this whole
# pass exists to remove. GATE FILE ONLY.
import sys, io, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TARGET = os.path.join(ROOT, 'gates', 'g193_budget_floor.js')
src = io.open(TARGET, encoding='utf-8').read()
orig = src
edits = [
 ('B4b-numbers',
  r"""  // deleting. One extra deletion in four cells, against 1,242 fewer deletions overall, is
  // the tight cell behaving as ruled, not a regression. If this number climbs off that cell
  // it is a different finding and the printed repro list is how you see it.""",
  r"""  // deleting. One extra deletion in four cells, against roughly twelve hundred fewer
  // deletions overall, is the tight cell behaving as ruled, not a regression. Coach ruled on
  // "1,242 fewer overall"; re-measured on this lattice the aggregate fall is 1,266. Both are
  // written down rather than one being quietly overwritten, and the live figure is printed
  // below on every run. If the four-cell count climbs off that cell it is a different
  // finding, and the printed repro list is how you see it."""),
 ('B4d-numbers',
  r"""    // denominator on purpose. Total non-optional deletions fell 6,527 -> 5,285 in the same
    // run, so a class-level rise inside a 19% aggregate fall is COMPOSITION, not loss.""",
  r"""    // denominator on purpose. Total non-optional deletions fell in the same run, so a
    // class-level rise inside a roughly 19% aggregate fall is COMPOSITION, not loss. Coach
    // ruled on 6,527 -> 5,285; re-measured on this lattice it is 6,527 -> 5,261, a fall of
    // 1,266 of 6,527 (19.4%). The live pair is printed below, never assumed from here."""),
]
for tag, old, new in edits:
    n = src.count(old)
    if n != 1:
        sys.stderr.write('ABORT: anchor %r matched %d times (need exactly 1). Nothing written.\n' % (tag, n)); sys.exit(1)
    src = src.replace(old, new)
if src == orig:
    sys.stderr.write('ABORT: no change produced.\n'); sys.exit(1)
io.open(TARGET, 'w', encoding='utf-8').write(src)
print('wrote %s (%d replacements, %d -> %d bytes)' % (TARGET, len(edits), len(orig), len(src)))
