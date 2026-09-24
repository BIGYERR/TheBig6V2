#!/usr/bin/env python3
# V213 slice 3b fix — g205_d129_tiebreak.js: the oracle's rank head at ia-version >= 213.
# Runs AFTER tests/edits/v213_slice3b_eras.py.
# Found on the first proof run of slice 3b (tree forced to 213, 4 P1 rows and 1 P4 row red): this
# oracle still heads its rank with -coll, the pre-D130 total. The engine has ranked by -untol then
# -tol since V205 (D130 amended), and g205_d125_spaced's oracle was split then; this one was not,
# because on the easy / INT / long type set every row it scores has a collision-free layout, so the
# two heads choose the same top and the difference could not show. With D113a's INT / CHI / long a
# three-run week on four or more days can only reach a TOLERATED pair (CHI on the long run's eve),
# and -coll ties that with an untolerated one. At >= 213 the pace head becomes the D130 split,
# encoded as one term, -(10 x untol + tol), so the rank vector keeps its length and every index
# P6 and P7 read (tol is at most 3 in a week, so the encoding orders exactly as [-untol, -tol]).
# Through 212, and on the NRC arm at every version, the head stays -coll.
import io, sys

P = '/Users/CanasBangin/Desktop/TheBig6V2/tests/gates/g205_d129_tiebreak.js'
src = io.open(P, encoding='utf-8').read()
old = "      const ruled=[-coll,ll,sar,rbl,can];\n"
new = ("      // V213 (D113a) era: the pace head is D130's split, -(10 x untol + tol); tol = coll - untol on the\n"
       "      // pace template. Through 212 and on NRC it is -coll, as it always was.\n"
       "      const _u=(pace&&PACE3.three)?d130untol(days,typeOf):0;\n"
       "      const ruled=[(pace&&PACE3.three)?-(10*_u+(coll-_u)):-coll,ll,sar,rbl,can];\n")
c = src.count(old)
print('g205_d129_tiebreak.js  E6 D130 head at >= 213  count=%d' % c)
if c != 1:
    sys.exit('ABORT: anchor not count 1. Nothing written.')
io.open(P, 'w', encoding='utf-8').write(src.replace(old, new, 1))
print('WROTE', P)
