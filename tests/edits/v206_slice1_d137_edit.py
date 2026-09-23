#!/usr/bin/env python3
# V206 slice 1 of 4 — D137 (amended, coach-ruled, Mario concurred "hold at 20").
# run_base's Steady Aerobic (the CHI limb) holds on Table 6 row 12 from week 13 on.
# The cap binds getCHI's ROW READER only. The week argument is NOT clamped: clamping it
# moves the cutback clock (measured wrong on 70/1,836, tests/measure/v206_d137_runbase_chi.js).
# ia-version is NOT bumped here; slice 4 owns the bump.
# Every anchor is asserted count==1 before anything is written. The first miss aborts.
import sys

PATH = '/Users/CanasBangin/Desktop/TheBig6V2/index.html'
src = open(PATH, encoding='utf-8').read()

EDITS = [
    # 1. getCHI signature: append the trailing row cap. Nothing else in the list moves.
    ('function getCHI(week, totalWeeks, isMilGoal, phaseFrom, phaseTo) {',
     'function getCHI(week, totalWeeks, isMilGoal, phaseFrom, phaseTo, _rowCap) {'),
    # 2. The row reader: the cap applies to the Table 6 row, both for the week itself and
    #    for the cutback's prior week, because both read through `at`.
    ('const at = w => chiFromTable6(w);',
     'const at = w => chiFromTable6(_rowCap ? Math.min(w, _rowCap) : w);'),
    # 3. The run call site passes the cap for run_base only.
    ('  let chi = getCHI(week, tw, isMilGoal, _qph && _qph.chiFrom, _qph && _qph.chiTo);\n',
     '  // D137 (V206): 12 is Table 6\'s last single-piece CHI row. From week 13 the rows are\n'
     '  // two-piece, and the base limb prints one continuous piece, so run_base holds on row 12.\n'
     '  // The cap goes to the row reader, never to `week`: the cutback clock keeps the real week.\n'
     '  let chi = getCHI(week, tw, isMilGoal, _qph && _qph.chiFrom, _qph && _qph.chiTo, goalId === \'run_base\' ? 12 : 0);\n'),
]

for i, (old, new) in enumerate(EDITS, 1):
    n = src.count(old)
    if n != 1:
        sys.exit('ABORT: anchor %d count=%d (want 1): %r' % (i, n, old[:90]))
for i, (old, new) in enumerate(EDITS, 1):
    src = src.replace(old, new, 1)
    if src.count(new) != 1:
        sys.exit('ABORT: replacement %d not present exactly once after write' % i)

open(PATH, 'w', encoding='utf-8').write(src)
print('v206 slice 1 (D137): %d edits applied, ia-version untouched' % len(EDITS))
