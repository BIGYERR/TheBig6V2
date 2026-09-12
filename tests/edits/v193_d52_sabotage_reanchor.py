#!/usr/bin/env python3
# V193 D52 — S8/S9/S10 in tests/sabotage/v193.json anchored on the pre-D52 rowPool line,
# so they came back NOT-APPLIED (anchor count=0) after the edit, which the runner reports
# as its own outcome and never as a trip. Re-anchored on the D52 line. What each mutation
# TESTS is unchanged: S8 deletes the cable branch, S9 inverts it, S10 replaces the
# cable-less vertical pull with a horizontal row the protect plan drops.
import json, io, sys

P = '/Users/CanasBangin/Desktop/TheBig6V2/tests/sabotage/v193.json'
d = json.load(io.open(P, encoding='utf-8'))
NEW = ("        rowPool = hasCables?['Straight-arm pulldown']:"
       "['Assisted pullups','Neutral-grip chinups','Chinups','Weighted chinups']\n"
       "          .filter(n=>hasDumbbells||!/weighted/i.test(n));")
SRC = io.open('/Users/CanasBangin/Desktop/TheBig6V2/index.html', encoding='utf-8').read()
if SRC.count(NEW) != 1:
    sys.stderr.write('ABORT: the D52 rowPool line does not occur exactly once\n'); sys.exit(1)

hits = 0
for m in d:
    tag = m['name'].split(' ')[0]
    if tag == 'S8':
        m['anchor'] = NEW
        m['replacement'] = "        rowPool = ['Straight-arm pulldown'];"
        hits += 1
    elif tag == 'S9':
        m['anchor'] = NEW
        m['replacement'] = ("        rowPool = hasCables?"
                            "['Assisted pullups','Neutral-grip chinups','Chinups','Weighted chinups']"
                            ":['Straight-arm pulldown'];")
        hits += 1
    elif tag == 'S10':
        m['anchor'] = ":['Assisted pullups','Neutral-grip chinups','Chinups','Weighted chinups']"
        m['replacement'] = ":['Dumbbell row']"
        hits += 1
if hits != 3:
    sys.stderr.write('ABORT: expected 3 mutations to re-anchor, found %d\n' % hits); sys.exit(1)
for m in d:
    if SRC.count(m['anchor']) != 1:
        sys.stderr.write('ABORT: anchor not unique for %s (count=%d)\n' % (m['name'][:24], SRC.count(m['anchor']))); sys.exit(1)
io.open(P, 'w', encoding='utf-8').write(json.dumps(d, ensure_ascii=False, indent=1) + '\n')
print('OK re-anchored %d mutations, all %d anchors count==1' % (hits, len(d)))
