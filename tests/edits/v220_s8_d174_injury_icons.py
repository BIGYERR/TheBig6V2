#!/usr/bin/env python3
# V220 slice 8: D174 P-EMOJI section 5. The four injury pop-up icons become ASY icon names.
# BACK IN x2 and CHECK IN better: shield. CHECK IN worse: warning.
# The source stores the icons as backslash-u escape TEXT; build it without typing the sequence.
import re, sys
P = '/Users/CanasBangin/Desktop/TheBig6V2/index.html'
src = open(P, encoding='utf-8').read()
BS = chr(92)
SHIELD = BS+'uD83D'+BS+'uDEE1'+BS+'uFE0F'
WARN = BS+'u26A0'+BS+'uFE0F'

m = re.search(r'const ASY_ICON_PATHS=\{', src)
assert m, 'ASY_ICON_PATHS not found'
line = src[m.start():src.index('\n', m.start())]
for k in ('shield', 'warning'):
    assert ('"%s":' % k) in line, 'icon key missing: ' + k

EDITS = [
    ("popFire('workout',{icon:'" + SHIELD + "',kicker:'BACK IN',msg:'Good. One week to prove it.',",
     "popFire('workout',{icon:'shield',kicker:'BACK IN',msg:'Good. One week to prove it.',"),
    ("popFire('workout',{icon:'" + SHIELD + "',kicker:'BACK IN',msg:'Good. Two weeks to full send.',",
     "popFire('workout',{icon:'shield',kicker:'BACK IN',msg:'Good. Two weeks to full send.',"),
    ("popFire('workout',{icon:'" + SHIELD + "',kicker:'CHECK IN',msg:'Good sign.',",
     "popFire('workout',{icon:'shield',kicker:'CHECK IN',msg:'Good sign.',"),
    ("popFire('workout',{icon:'" + WARN + "',kicker:'CHECK IN',msg:'Two weeks and trending worse.',",
     "popFire('workout',{icon:'warning',kicker:'CHECK IN',msg:'Two weeks and trending worse.',"),
]
for old, new in EDITS:
    c = src.count(old)
    if c != 1:
        print('ABORT: anchor count %d: %r' % (c, old[:90])); sys.exit(1)
for old, new in EDITS:
    src = src.replace(old, new, 1)
open(P, 'w', encoding='utf-8').write(src)
print('s8: 4 injury icons -> shield x3, warning x1')
