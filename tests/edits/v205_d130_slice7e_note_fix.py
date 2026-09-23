#!/usr/bin/env python3
"""V205 slice 7e, part 3 — reconcile three notes with the post-P2c sweep. TESTS ONLY.

The trip numbers written into the notes in part 2 were measured BEFORE P2c and
P3c/P3d were inserted, so they quote a gate total that no longer exists. A note
that quotes a stale total reads as a regression the next time the sweep is run.
Corrected to the numbers the sweep actually prints now. index.html untouched.
"""
import json, os, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def die(m): sys.exit('ABORT: ' + m)
FIX = [
    ('v205_d125.json', 'S1',
     'measured PASS 108 FAIL 1, P1 naming rest wed+thu cap4.',
     'measured PASS 110 FAIL 1 in the slice 7e sweep, P1 naming rest wed+thu cap4 (it read 108 '
     'when first measured; P2c added two passing rows to that gate in the same slice).'),
    ('v205_d129.json', 'S2',
     'NAMED TRIP: P2c (the second of its two assertions;',
     'NAMED TRIP: P2c, measured PASS 110 FAIL 1 against a baseline of PASS 111 FAIL 0 (the second '
     'of P2c\'s two assertions;'),
    ('v205_d129.json', 'S3',
     'PASS 94 FAIL 15 against a baseline of PASS 109 FAIL 0.',
     'PASS 96 FAIL 15 against a baseline of PASS 111 FAIL 0.'),
]
staged = {}
for fn, tag, old, new in FIX:
    p = os.path.join(ROOT, 'sabotage', fn)
    rows = staged.get(p) or json.loads(open(p, encoding='utf-8').read())
    staged[p] = rows
    h = [r for r in rows if r['name'].startswith(tag + ' ')]
    if len(h) != 1: die('%s row %s count==%d' % (fn, tag, len(h)))
    if h[0]['note'].count(old) != 1:
        die('%s %s: anchor count==%d, expected 1 -> %r' % (fn, tag, h[0]['note'].count(old), old[:60]))
    h[0]['_p'] = (old, new)
for p, rows in staged.items():
    for r in rows:
        if '_p' in r:
            old, new = r.pop('_p')
            r['note'] = r['note'].replace(old, new)
    open(p, 'w', encoding='utf-8').write(json.dumps(rows, indent=2, ensure_ascii=False) + '\n')
    print('WROTE ' + os.path.relpath(p, os.path.dirname(ROOT)))
