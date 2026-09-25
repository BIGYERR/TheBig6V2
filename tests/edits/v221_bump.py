#!/usr/bin/env python3
# v221_bump.py: V221 version bump. The LAST replacement of the V221 build (slice T6b, after app slices s1-s8).
# ia-version 220 -> 221. Anchor asserted count==1; abort on miss.
import sys
P = '/Users/CanasBangin/Desktop/TheBig6V2/index.html'
s = open(P, encoding='utf-8').read()
A = '<meta name="ia-version" content="220">'
B = '<meta name="ia-version" content="221">'
n = s.count(A)
if n != 1:
    sys.exit('ABORT: version meta anchor count %d (want 1)' % n)
if s.count(B) != 0:
    sys.exit('ABORT: target version meta already present %d times (want 0)' % s.count(B))
s = s.replace(A, B)
assert s.count(B) == 1 and s.count(A) == 0
open(P, 'w', encoding='utf-8').write(s)
print('v221_bump: ia-version 220 -> 221')
