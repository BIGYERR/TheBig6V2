#!/usr/bin/env python3
# V219 gate slice G1, follow-up to v219_g1_era_rows.py (same g197b edit): the HF_LEAK reference row for 219.
# Without it B4i..B4l fail "NO ERA ROW" on a 219-stamped artifact. measure's step 7 printed B4i..B4l ok (0/0),
# so this is a ruled UNMOVED reference row, not a move.
import sys
F = '/Users/CanasBangin/Desktop/TheBig6V2/tests/gates/g197b_sweep.js'
s = open(F, encoding='utf-8').read()
a = "HF_LEAK_BY_VERSION[218] = HF_LEAK_BY_VERSION[217];   // D157: ruled UNMOVED (0/0 printed; the swim sizer and three labels draw no lift item)\n"
b = a + "HF_LEAK_BY_VERSION[219] = HF_LEAK_BY_VERSION[218];   // V219 (D167/D171/D159/D164/D170/D165/D166): ruled UNMOVED (0/0 printed at measure's step 7; every V219 draw picks from the tier's own pool)\n"
n = s.count(a)
print('anchor 0 count %d' % n)
if n != 1:
    print('ABORT'); sys.exit(2)
open(F, 'w', encoding='utf-8').write(s.replace(a, b, 1))
print('written')
