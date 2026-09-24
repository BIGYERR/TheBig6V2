#!/usr/bin/env python3
# V214 close, part B (3 edits) — the two g210 licences renewed by one, then the ia-version bump, LAST.
#   1. tests/gates/g210_equipment_denials.js: D149_HELD_TO 213 -> 214 (D149 builds after V214) and
#      D154_SCOPED_TO 213 -> 214 (D154 queued). Standing ruling 2: a licence is a predicate keyed on a
#      number that exists; each build that does not ship the ruling renews it by exactly one.
#   2. index.html: <meta name="ia-version" content="213"> -> "214". Mario authorized the bump for D158.
#      It is the LAST replacement; the gate file is written first and index.html second, and a failed
#      anchor aborts before either is written.
import io, sys
ROOT = '/Users/CanasBangin/Desktop/TheBig6V2/'
G210 = ROOT + 'tests/gates/g210_equipment_denials.js'
IDX = ROOT + 'index.html'
g = io.open(G210, encoding='utf-8').read()
x = io.open(IDX, encoding='utf-8').read()
GREPS = [
  ("const D154_SCOPED_TO = 213; // D154 queued", "const D154_SCOPED_TO = 214; // D154 queued"),
  ("const D149_HELD_TO = 213; // D149 builds next", "const D149_HELD_TO = 214; // D149 builds after V214"),
]
META = ('<meta name="ia-version" content="213">', '<meta name="ia-version" content="214">')
bad = False
for a, b in GREPS:
    c = g.count(a); print('g210  %-52s count=%d' % (a, c)); bad |= (c != 1)
c = x.count(META[0]); print('index.html  ia-version meta 213                        count=%d' % c); bad |= (c != 1)
if bad:
    sys.exit('ABORT: an anchor did not appear exactly once. Nothing written.')
for a, b in GREPS:
    g = g.replace(a, b, 1)
x = x.replace(META[0], META[1], 1)      # the version meta bump, last
io.open(G210, 'w', encoding='utf-8').write(g)
io.open(IDX, 'w', encoding='utf-8').write(x)
print('WROTE', G210)
print('WROTE', IDX, '(ia-version 214)')
