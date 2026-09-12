#!/usr/bin/env python3
# V193 D52 — M1/M2/M3/M7 in tests/sabotage/v193_samecard.json anchored on the pre-D52
# rowPool line and came back NOT-APPLIED. Re-anchored, each still testing what it tested:
#   M1 the one-item literal that names the day's own main lift
#   M2 the main-lift exclusion deleted — that exclusion MOVED under D52, from a whole-pool
#      subtraction at pool build to a single-name filter against the drawn backMain at the
#      row-slot draw site, so the mutation follows it there
#   M3 a DIFFERENT one-item literal, proving the gate keys on the collision not the string
#   M7 the row pool emptied outright
import json, io, sys

P = '/Users/CanasBangin/Desktop/TheBig6V2/tests/sabotage/v193_samecard.json'
d = json.load(io.open(P, encoding='utf-8'))
SRC = io.open('/Users/CanasBangin/Desktop/TheBig6V2/index.html', encoding='utf-8').read()
NEW = ("        rowPool = hasCables?['Straight-arm pulldown']:"
       "['Assisted pullups','Neutral-grip chinups','Chinups','Weighted chinups']\n"
       "          .filter(n=>hasDumbbells||!/weighted/i.test(n));")
EXCL = "  const _rowSrc0 = (_inj&&rowPool!==_preInj.row)?(rowPool||[]).filter(n=>n!==backMain):(rowPool||[]);"
for probe in (NEW, EXCL):
    if SRC.count(probe) != 1:
        sys.stderr.write('ABORT: probe not unique (count=%d)\n' % SRC.count(probe)); sys.exit(1)

NEWDEF = {
  'M1': (NEW, "        rowPool = hasCables?['Straight-arm pulldown']:['Assisted pullups'];"),
  'M2': (EXCL, "  const _rowSrc0 = (rowPool||[]);"),
  'M3': (NEW, "        rowPool = hasCables?['Straight-arm pulldown']:['Chinups'];"),
  'M7': (NEW, "        rowPool = [];"),
}
hits = 0
for m in d:
    tag = m['name'].split(' ')[0]
    if tag in NEWDEF:
        m['anchor'], m['replacement'] = NEWDEF[tag]
        hits += 1
if hits != len(NEWDEF):
    sys.stderr.write('ABORT: expected %d mutations, found %d\n' % (len(NEWDEF), hits)); sys.exit(1)
for m in d:
    if SRC.count(m['anchor']) != 1:
        sys.stderr.write('ABORT: anchor not unique for %s (count=%d)\n' % (m['name'][:24], SRC.count(m['anchor']))); sys.exit(1)
io.open(P, 'w', encoding='utf-8').write(json.dumps(d, ensure_ascii=False, indent=1) + '\n')
print('OK re-anchored %d mutations, all %d anchors count==1' % (hits, len(d)))
