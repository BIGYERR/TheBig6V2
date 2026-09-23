#!/usr/bin/env python3
"""V205 slice 16 — three sabotage anchor repairs. NO index.html, gate or harness change.

Gatekeeper halted at step 2 with three NOT-APPLIED mutations. All three are mutation
defects with one cause: D135's bike-INT fork (getINTBike at :3508) landed AFTER these
specs were written and either duplicated the line they anchor on or re-worded it.

R1  v205.json      M2  count=2 -> WIDEN onto the CHI reader's own next line.
R2  v205.json      M4  count=0 -> RE-ANCHOR: the comment gained "CHI ".
R3  v205_d114.json M5  count=2 -> WIDEN onto getINTReps' own preceding comment line.

Every anchor asserted count==1 in the JSON before writing, and every NEW anchor asserted
count==1 in index.html, so a repair that lands on the wrong reader aborts the script.
"""
import json, sys, hashlib

ROOT = '/Users/CanasBangin/Desktop/TheBig6V2/'
SRC  = ROOT + 'index.html'
src  = open(SRC, encoding='utf-8').read()

BASE_SHA = 'a362bd6adcb149016fe8c11f01f318df8050c4086fb2f1af29d3fe7d5d2ab51d'
got = hashlib.sha256(open(SRC, 'rb').read()).hexdigest()
if got != BASE_SHA:
    sys.exit('ABORT: index.html sha256 %s != baseline %s' % (got, BASE_SHA))

# (spec file, mutation-name prefix, old anchor, new anchor, new replacement)
REPAIRS = [
    # R1 — widen. The CHI reader is the ONLY one of the two that indexes NSW_TABLE6_CHI,
    # so its own next line disambiguates it from intFromTable6:3443 without touching the
    # mutation's semantics: the clamp still goes, week 27 still falls off the end of the
    # table, and the invented V115 3 x 20 is still what comes back.
    ('tests/sabotage/v205.json', 'M2 ',
     '  var _w = Math.max(1, Math.min(Math.round(week) || 1, 26));',
     '  var _w = Math.max(1, Math.min(Math.round(week) || 1, 26));\n  var _row = NSW_TABLE6_CHI[_w];',
     '  var _w = Math.max(1, Math.round(week) || 1);\n  if(!NSW_TABLE6_CHI[_w]) return { reps: 3, minPerRep: 20 };\n  var _row = NSW_TABLE6_CHI[_w];'),

    # R2 — re-anchor only. The comment at :4502 now reads "the V115 CHI hand ramp"; it
    # gained "CHI " when getINTBike was forked in beside it at :4501. The mutation itself
    # is unchanged: the bike CHI caller collapses back onto getCHI.
    ('tests/sabotage/v205.json', 'M4 ',
     '  let chi = getCHIBike(week, tw);   // D128 (V205): bike keeps the V115 hand ramp',
     '  let chi = getCHIBike(week, tw);   // D128 (V205): bike keeps the V115 CHI hand ramp',
     '  let chi = getCHI(week, tw, false);   // D128 (V205): bike keeps the V115 CHI hand ramp'),

    # R3 — widen. getINTBike:3513 carries a byte-identical cutback line; the comment above
    # each differs ("a planning error." vs "Byte-identical to the rule getINTReps still
    # states."), so the preceding line pins D114's claim to the run/swim reader.
    ('tests/sabotage/v205_d114.json', 'M5 ',
     '  if(isCardioCutbackWeek(week, totalWeeks)) return Math.max(3, Math.round(ramp(week-1) * 0.6));',
     '  // prescription; a rep or pace PR during a recovery week is a planning error.\n  if(isCardioCutbackWeek(week, totalWeeks)) return Math.max(3, Math.round(ramp(week-1) * 0.6));',
     '  // prescription; a rep or pace PR during a recovery week is a planning error.\n  if(isCardioCutbackWeek(week, totalWeeks)) return Math.max(3, Math.round(ramp(week-1) * 0.75));'),
]

writes = {}
for spec, prefix, old_anchor, new_anchor, new_repl in REPAIRS:
    path = ROOT + spec
    raw = writes.get(path) or open(path, encoding='utf-8').read()

    # 1. the OLD anchor must appear exactly once in the spec text, as a JSON literal
    old_lit = json.dumps(old_anchor)
    n = raw.count(old_lit)
    if n != 1:
        sys.exit('ABORT: %s %s old anchor literal count==%d, expected 1' % (spec, prefix, n))

    # 2. the NEW anchor must be unique in the artifact — this is the repair's whole point
    c = src.count(new_anchor)
    if c != 1:
        sys.exit('ABORT: %s %s NEW anchor count==%d in index.html, expected 1' % (spec, prefix, c))

    # 3. confirm we are editing the mutation we think we are
    muts = json.loads(raw)
    hit = [m for m in muts if m['name'].startswith(prefix)]
    if len(hit) != 1:
        sys.exit('ABORT: %s %s matched %d mutations, expected 1' % (spec, prefix, len(hit)))
    if hit[0]['anchor'] != old_anchor:
        sys.exit('ABORT: %s %s anchor text drifted' % (spec, prefix))
    old_repl_lit = json.dumps(hit[0]['replacement'])
    if raw.count(old_repl_lit) != 1:
        sys.exit('ABORT: %s %s old replacement literal not unique' % (spec, prefix))

    raw = raw.replace(old_lit, json.dumps(new_anchor), 1)
    raw = raw.replace(old_repl_lit, json.dumps(new_repl), 1)
    writes[path] = raw
    print('OK   %-34s %s  anchor %d->1 in artifact' % (spec, prefix.strip(), src.count(old_anchor)))

for path, raw in writes.items():
    json.loads(raw)          # the file must still parse before it is written
    open(path, 'w', encoding='utf-8').write(raw)
    print('WROTE', path)

after = hashlib.sha256(open(SRC, 'rb').read()).hexdigest()
if after != BASE_SHA:
    sys.exit('ABORT: index.html was modified by this script')
print('index.html sha256 UNCHANGED', after)
