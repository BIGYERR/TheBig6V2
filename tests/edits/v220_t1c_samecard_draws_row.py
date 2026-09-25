#!/usr/bin/env python3
# V220 test slice T1c: the [220] era row, ruled UNMOVED, in tests/gates/g219_samecard_draws.js. Test file only.
# Why it is needed: runParent selects ROW = ERA[VER <= 218 ? 218 : VER], so a 220-stamped artifact reads ERA[220],
# gets undefined, and F1, F2 and R1..R8 all FAIL "NO ERA ROW for ia-version 220". The gate is not scoped to 219.
# Basis: V220 ships D173/D174/D175/D176, all zero-engine (display, copy and pop-up only); no V220 hunk touches
# buildProgram or anything it calls, so no card on the WIDE lattice can move. D164's R4/R5 EQUALITY still expires
# on D169, which V220 does not ship. A reference to [219]: row existence stays a conjunct (!!ROW), no fallback.
# Anchor asserted count==1 and the new row asserted absent before writing; a miss aborts.
import sys
F = '/Users/CanasBangin/Desktop/TheBig6V2/tests/gates/g219_samecard_draws.js'
s = open(F, encoding='utf-8').read()
a = "\n         fx:{ exact:'Pec deck 3×12–15 @ RPE 6–7', noDup:true } } };\n"
row = ("ERA[220] = ERA[219];   // V220 (D173/D174/D175/D176): ruled UNMOVED (zero-engine build: display, copy and pop-up only; "
       "no hunk reaches buildProgram or anything it calls; the D164 R4/R5 EQUALITY still expires on D169, not shipped here)\n")
n = s.count(a)
print('anchor 0 count %d :: %r' % (n, a.strip()[:70]))
if n != 1:
    print('ABORT'); sys.exit(2)
head = row.split('   //')[0]
if s.count(head) != 0:
    print('ABORT: row already present: %r' % head); sys.exit(3)
k = s.index(a) + len(a)                         # after the closing line of const ERA = { ... };
s = s[:k] + row + s[k:]
open(F, 'w', encoding='utf-8').write(s)
print('written')
