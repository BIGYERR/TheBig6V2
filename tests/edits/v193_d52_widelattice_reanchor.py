#!/usr/bin/env python3
# V193 D52 — W3 in tests/sabotage/v193_widelattice.json anchored on the pre-D52 five-name
# literal and came back NOT-APPLIED. Re-anchored on the four-name D52 literal. The
# mutation and everything it proves are unchanged: the cable-less vertical pull becomes a
# cable-only name.
import json, io, sys

P = '/Users/CanasBangin/Desktop/TheBig6V2/tests/sabotage/v193_widelattice.json'
NEW = ":['Assisted pullups','Neutral-grip chinups','Chinups','Weighted chinups']"
SRC = io.open('/Users/CanasBangin/Desktop/TheBig6V2/index.html', encoding='utf-8').read()
if SRC.count(NEW) != 1:
    sys.stderr.write('ABORT: new anchor count==%d\n' % SRC.count(NEW)); sys.exit(1)
d = json.load(io.open(P, encoding='utf-8'))
hits = 0
for m in d:
    if m['name'].startswith('W3'):
        m['anchor'] = NEW
        hits += 1
if hits != 1:
    sys.stderr.write('ABORT: expected 1 W3 mutation, found %d\n' % hits); sys.exit(1)
for m in d:
    if SRC.count(m['anchor']) != 1:
        sys.stderr.write('ABORT: anchor not unique for %s\n' % m['name'][:20]); sys.exit(1)
io.open(P, 'w', encoding='utf-8').write(json.dumps(d, ensure_ascii=False, indent=1) + '\n')
print('OK re-anchored W3, all %d anchors count==1' % len(d))
