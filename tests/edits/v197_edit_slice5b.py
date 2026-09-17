#!/usr/bin/env python3
# V197 slice 5b — M9's name shortened. Not cosmetic: tests/sabotage.py builds its temp
# file name out of the mutation name, and the retune note I wrote in slice 5 pushed it to
# 364 bytes, past the 255-byte filesystem limit, so the sweep died with OSError 63 before
# running M9 at all. Fixing sabotage.py is §12 debt and out of scope for this slice, so
# the NAME is what gives. The retune rationale lives in the handoff line, not in a
# filename. Longest surviving name is M3 at 244; this lands at ~209.
import io, os, sys

SPEC = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'sabotage', 'v197.json')
OLD = '"name": "M9 -> the session budget is tightened from 20 to 18, so the trim runs one notch past the ruled isolation band and eats non-optional work on every tier (retuned from 14 in V197 slice 5: 14 and 16 both trip ten claims at once, which proves nothing about which claim is load-bearing; 18 reaches the named B4 ratchet and models a regression rather than a catastrophe)"'
NEW = '"name": "M9 -> the session budget is tightened from 20 to 18, so the trim runs one notch past the ruled isolation band and eats non-optional work on every tier (retuned from 14, which tripped ten claims at once)"'

src = io.open(SPEC, encoding='utf-8').read()
n = src.count(OLD)
print('anchor %-3s M9 name shortened for the sabotage temp path   v197.json' % n)
if n != 1:
    sys.stderr.write('ABORT: anchor not count==1. Nothing written.\n'); sys.exit(1)
io.open(SPEC, 'w', encoding='utf-8').write(src.replace(OLD, NEW, 1))
print('wrote ' + SPEC)

import json, re
for m in json.load(io.open(SPEC, encoding='utf-8')):
    fn = 'sab_' + re.sub(r'[^A-Za-z0-9]+', '_', m['name']) + '.html'
    assert len(fn) < 255, ('temp path still too long', m['name'][:12], len(fn))
print('every mutation temp path is under 255 bytes')
