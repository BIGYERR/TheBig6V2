#!/usr/bin/env python3
# V197 slice 6 — D84. One reorder, unscoped.
#
# In denseHypertrophy's leg accessory block, push Calves BEFORE Leg isolation.
# capSessionBudget's trim tie-break compares (_secRank, _itemRank) and resolves a
# tie to the LATER position, so whichever of these two sections is pushed second
# is evicted first. Both sections score _secRank 2 / _itemRank 0, so the push
# order alone decides. Before: Calves was pushed last and lost. After: Leg
# isolation is pushed last and loses.
#
# NOT scoped to injury / tier / goal / focus: conditioning it would encode
# "the budget prefers a fourth hip extension unless you are injured".
#
# Untouched by design: capSessionBudget, _secRank, _itemRank, _compoundTier,
# SESSION_SET_BUDGET, the tier-3 exemption, the legIso[1] guard, the D76
# subtraction, the D75 pool, _laDose, EXLIB.calves, _bw's Room Only diversion,
# and the blockSeed(w)+105 / +106 seeds. ia-version stays 197 (bumped in slice 2).
import sys, io

PATH = 'index.html'
with io.open(PATH, 'r', encoding='utf-8') as f:
    src = f.read()

EDITS = []

# --- Edit 1: reorder the two pushes, with the ruling recorded on the seam. ---
OLD1 = (
    "        s.push({label:'Leg isolation',superset:_laItems.length>1,rounds:hsets,items:_laItems});\n"
    "        s.push({label:'Calves',items:[{name:calf,detail:hsets+'×15–20'}]});\n"
)
NEW1 = (
    "        // V197 (D84): Calves is pushed BEFORE Leg isolation. capSessionBudget's trim\n"
    "        // tie-break compares (_secRank, _itemRank) and both of these sections score\n"
    "        // 2 / 0, so the tie resolves to the LATER push and the second one written is\n"
    "        // the first one evicted. Calves used to be last, so on a tight day the card\n"
    "        // dropped its only loaded plantarflexion to keep an isolation slot that in\n"
    "        // 126 of 126 measured cells was a THIRD repetition of a pattern the card had\n"
    "        // already run twice (Main + Leg superset B): four posterior-chain pieces and\n"
    "        // zero calf work. Unscoped on purpose — a healthy runner has the same defect.\n"
    "        // Order is the whole edit: the picks above are unchanged, seeds included.\n"
    "        s.push({label:'Calves',items:[{name:calf,detail:hsets+'×15–20'}]});\n"
    "        s.push({label:'Leg isolation',superset:_laItems.length>1,rounds:hsets,items:_laItems});\n"
)
EDITS.append(('D84 calves-before-legiso reorder', OLD1, NEW1))

for name, old, new in EDITS:
    n = src.count(old)
    if n != 1:
        sys.stderr.write('ABORT: anchor %r matched %d times (need 1)\n' % (name, n))
        sys.exit(1)
    print('anchor OK count==1 : %s' % name)
    src = src.replace(old, new, 1)

with io.open(PATH, 'w', encoding='utf-8') as f:
    f.write(src)
print('wrote %s (%d edits)' % (PATH, len(EDITS)))
