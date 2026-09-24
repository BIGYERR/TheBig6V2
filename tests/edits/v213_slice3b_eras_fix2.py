#!/usr/bin/env python3
# V213 slice 3b fix 2 — g205_d129_tiebreak.js P1b: a layout outside the oracle's space is a named
# FAIL, not a crash. Runs AFTER v213_slice3b_eras_fix.py.
# Found on the red proof (V212 forced to 213): V212's chooser deals easy / INT / long, which is not in
# the >= 213 INT / CHI / long space, so `got` is undefined and P1b threw a TypeError before the
# summary line. A crash prints no PASS n FAIL n, and reports nothing; the row must say what it saw.
# At <= 212, and on the D113a tree, every engine layout is in the space and this branch never runs.
import io, sys

P = '/Users/CanasBangin/Desktop/TheBig6V2/tests/gates/g205_d129_tiebreak.js'
src = io.open(P, encoding='utf-8').read()
old = ("    const got=engIn(all,pick,r.train);\n"
       "    const better=all.find(c=>cmp(c.ruled.slice(0,3),got.ruled.slice(0,3))===0 && c.ruled[3]>got.ruled[3]);\n")
new = ("    const got=engIn(all,pick,r.train);\n"
       "    if(!got){ p1b++; console.log('  FAIL P1b rest '+r.nm+' cap'+r.cap+' engine layout '+lay(r.train,pick)+' is not in the era type space'); return; }\n"
       "    const better=all.find(c=>cmp(c.ruled.slice(0,3),got.ruled.slice(0,3))===0 && c.ruled[3]>got.ruled[3]);\n")
c = src.count(old)
print('g205_d129_tiebreak.js  E7 P1b orphan is a named FAIL  count=%d' % c)
if c != 1:
    sys.exit('ABORT: anchor not count 1. Nothing written.')
io.open(P, 'w', encoding='utf-8').write(src.replace(old, new, 1))
print('WROTE', P)
