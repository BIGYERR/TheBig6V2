#!/usr/bin/env python3
# v220_bump.py: V220 version bump. The LAST replacement of the V220 build (after content slices s1-s9).
# ia-version 219 -> 220. Anchor asserted count==1; abort on miss.
import sys
P = '/Users/CanasBangin/Desktop/TheBig6V2/index.html'
s = open(P, encoding='utf-8').read()
A = '<meta name="ia-version" content="219">'
B = '<meta name="ia-version" content="220">'
n = s.count(A)
if n != 1:
    sys.exit('ABORT: version meta anchor count %d (want 1)' % n)
s = s.replace(A, B)
assert s.count(B) == 1 and s.count(A) == 0
open(P, 'w', encoding='utf-8').write(s)
print('v220_bump: ia-version 219 -> 220')
