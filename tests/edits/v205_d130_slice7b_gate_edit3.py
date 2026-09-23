#!/usr/bin/env python3
# V205 slice 7b, follow-on 2: P4 carries TWO conjuncts (the denominator 6,336 and the
# untolerated count) and printed only the second, so on the pre-D130 baseline it failed
# with "got 0 untolerated" — true, and useless. A failing row must name which conjunct
# broke it.
import io, sys
P = '/Users/CanasBangin/Desktop/TheBig6V2/tests/gates/g205_d125_ceiling.js'
OLD = "     pairs === 6336 && untol === 0, untol + ' untolerated: ' + stray.join(' | '));"
NEW = ("     pairs === 6336 && untol === 0,\n"
       "     pairs + ' hard-run pairs (ruling says 6336) and ' + untol + ' untolerated: ' + stray.join(' | '));")
s = io.open(P, encoding='utf-8').read()
n = s.count(OLD)
print('anchor P4 got-string count=%d' % n)
if n != 1:
    sys.stderr.write('ABORTED, nothing written\n'); sys.exit(1)
io.open(P, 'w', encoding='utf-8').write(s.replace(OLD, NEW, 1))
print('WROTE ' + P)
