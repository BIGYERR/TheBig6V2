#!/usr/bin/env python3
# V217 closeA — D160 closing rows (coach printed them on the tree stamped 217; every row REFERENCE:
# HALF_MANNY holds on all three arms, 0/98 days changed). Each row goes directly after its [216]
# sibling, in the file's existing assignment form, coach's comments verbatim. No bump, no commit.
import sys
ROOT = '/Users/CanasBangin/Desktop/TheBig6V2/'
EDITS = [
  ('tests/harness.js',
   "MANNY_DIGEST_BY_VERSION[216] = MANNY_DIGEST_BY_VERSION[215];   // D154/D156: ruled UNMOVED (printed by coach on the V216 tree)\n",
   "MANNY_DIGEST_BY_VERSION[217] = MANNY_DIGEST_BY_VERSION[216];   // D160: ruled UNMOVED (0ac7da6b1691a8e1 / 1069cd7f86eed204 / 9d14801a63111081 printed by coach on the V217-stamped tree with g199's and g200's methods; 0/98 days; every phantom D160 removes is NSW support_athletic, NRC printed 0 phantoms on 3,600 + 600 configs)\n"),
  ('tests/harness.js',
   "MANNY_DELOAD_OFF_DIGEST_BY_VERSION[216] = MANNY_DELOAD_OFF_DIGEST_BY_VERSION[215];   // D154/D156: ruled UNMOVED\n",
   "MANNY_DELOAD_OFF_DIGEST_BY_VERSION[217] = MANNY_DELOAD_OFF_DIGEST_BY_VERSION[216];   // D160: ruled UNMOVED\n"),
  ('tests/harness.js',
   "MANNY_CORE_OFF_DIGEST_BY_VERSION[216] = MANNY_CORE_OFF_DIGEST_BY_VERSION[215];   // D154/D156: ruled UNMOVED\n",
   "MANNY_CORE_OFF_DIGEST_BY_VERSION[217] = MANNY_CORE_OFF_DIGEST_BY_VERSION[216];   // D160: ruled UNMOVED\n"),
  ('tests/gates/g197b_sweep.js',
   "HF_LEAK_BY_VERSION[216] = HF_LEAK_BY_VERSION[215];   // D154/D156: ruled UNMOVED (D154 swaps to a pushup, D156 draws less; neither adds a machine or cable item)\n",
   "HF_LEAK_BY_VERSION[217] = HF_LEAK_BY_VERSION[216];   // D160: ruled UNMOVED (0/0 printed; the dedupe draws only from the swap universe the tier already owns)\n"),
]
src = {}
for f, a, row in EDITS:
    if f not in src: src[f] = open(ROOT + f, encoding='utf-8').read()
for i, (f, a, row) in enumerate(EDITS):
    n = src[f].count(a)
    if n != 1: print('ABORT: E%d anchor count %d in %s' % (i + 1, n, f)); sys.exit(2)
    if src[f].count(row.split(' = ')[0] + ' = ') != 0: print('ABORT: E%d row already present in %s' % (i + 1, f)); sys.exit(2)
for i, (f, a, row) in enumerate(EDITS):
    src[f] = src[f].replace(a, a + row, 1); print('applied E%d %s' % (i + 1, f))
for f in src: open(ROOT + f, 'w', encoding='utf-8').write(src[f])
print('written')
