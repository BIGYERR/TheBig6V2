#!/usr/bin/env python3
# V219 gate slice G2, edit 1: harness.js [219] digest rows, ruled UNMOVED (reference rows, the file's UNMOVED form).
# Standing ruling 5: coach's D167 ruling states "HALF_MANNY 0ac7da6b1691a8e1 unchanged", and measure printed
# 0ac7da6b1691a8e1 / 1069cd7f86eed204 / 9d14801a63111081 from the source surgery copies at every step 1..7, before
# the build (tests/measure/v219_chain_rebaseline.js). Row existence stays a conjunct in every consumer.
import sys
F = '/Users/CanasBangin/Desktop/TheBig6V2/tests/harness.js'
s = open(F, encoding='utf-8').read()
CITE = "V219 (D167/D171/D159/D164/D170/D165/D166): ruled UNMOVED (standing ruling 5: D167 states HALF_MANNY 0ac7da6b1691a8e1 unchanged; measure printed 0ac7da6b1691a8e1 / 1069cd7f86eed204 / 9d14801a63111081 from the source surgery copies at steps 1 to 7, before the build)"
ROWS = [
  ("MANNY_DIGEST_BY_VERSION[218] = MANNY_DIGEST_BY_VERSION[217];",
   "MANNY_DIGEST_BY_VERSION[219] = MANNY_DIGEST_BY_VERSION[218];   // " + CITE + "\n"),
  ("MANNY_DELOAD_OFF_DIGEST_BY_VERSION[218] = MANNY_DELOAD_OFF_DIGEST_BY_VERSION[217];",
   "MANNY_DELOAD_OFF_DIGEST_BY_VERSION[219] = MANNY_DELOAD_OFF_DIGEST_BY_VERSION[218];   // " + CITE + "\n"),
  ("MANNY_CORE_OFF_DIGEST_BY_VERSION[218] = MANNY_CORE_OFF_DIGEST_BY_VERSION[217];",
   "MANNY_CORE_OFF_DIGEST_BY_VERSION[219] = MANNY_CORE_OFF_DIGEST_BY_VERSION[218];   // " + CITE + "\n"),
]
for i, (a, b) in enumerate(ROWS):
    n = s.count(a)
    print('anchor %d count %d :: %r' % (i, n, a[:60]))
    if n != 1:
        print('ABORT'); sys.exit(2)
    if s.count(b.split('   //')[0]) != 0:
        print('ABORT: row %d already present' % i); sys.exit(3)
    k = s.index(a); e = s.index('\n', k) + 1
    s = s[:e] + b + s[e:]
open(F, 'w', encoding='utf-8').write(s)
print('written')
