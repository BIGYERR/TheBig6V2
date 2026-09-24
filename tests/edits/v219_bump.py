#!/usr/bin/env python3
# v219_bump.py: V219 version bump. The LAST replacement of the V219 build (after slices 1-5 and the G1 era rows).
# ia-version 218 -> 219. Anchor asserted count==1; abort on miss.
import sys
P = '/Users/CanasBangin/Desktop/TheBig6V2/index.html'
s = open(P, encoding='utf-8').read()
A = '<meta name="ia-version" content="218">'
B = '<meta name="ia-version" content="219">'
n = s.count(A)
if n != 1:
    sys.exit('ABORT: version meta anchor count %d (want 1)' % n)
s = s.replace(A, B)
assert s.count(B) == 1 and s.count(A) == 0
open(P, 'w', encoding='utf-8').write(s)
print('v219_bump: ia-version 218 -> 219')
