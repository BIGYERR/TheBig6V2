#!/usr/bin/env python3
# V211 close, part C (coach confirmed): g197b's HF_LEAK era table gets its 211 reference row.
# At 211 B4i/B4j/B4k/B4l failed with NO ERA ROW; V211 prints the 210 row exactly (home_full machine 0,
# cable 0, survivors {}). ONE edit, after the 210 row. Run after v211_closeB.py.
import io, sys
P = '/Users/CanasBangin/Desktop/TheBig6V2/tests/gates/g197b_sweep.js'
src = io.open(P, encoding='utf-8').read()
A = "HF_LEAK_BY_VERSION[210] = { machine:0, cable:0, names:{} };   // D70c: the ruled MOVE\n"
B = A + "HF_LEAK_BY_VERSION[211] = HF_LEAK_BY_VERSION[210];   // D153/D155: ruled UNMOVED (both only remove or choose among already-drawn items; neither draws a machine or cable item)\n"
n = src.count(A)
if n != 1: print('ABORT: anchor 210 row count', n); sys.exit(1)
if 'HF_LEAK_BY_VERSION[211]' in src: print('ABORT: 211 row already present'); sys.exit(1)
io.open(P, 'w', encoding='utf-8').write(src.replace(A, B, 1))
print('closeC written: g197b 211 row')
