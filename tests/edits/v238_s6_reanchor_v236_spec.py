#!/usr/bin/env python3
# V238 slice 6 (tests only): re-anchor v236_d218.json mutations S13 and S14 to the V238 lines.
# V238's ruled D225 hunk (C-MOVE) rewrote the restMoveCandidates logged test to add
# lg.swapTo||lg.parked, and its ruled D224 hunk (C-JOURNAL) extended the journal skip with the
# restLog clause, so both V237 anchors went NOT-APPLIED in `sabotage.py --anchors-only`.
# Session call (tooling; precedent tests/edits/v237_s3_bump_era_anchor.py): re-anchor, keep live,
# do not document as known-not-applied. Each mutation reverts ONLY its own D219 item and leaves
# the V238 D225 / D224 parts intact. No edit to index.html, to any gate, or to any other spec.
# All or nothing: every assertion runs before the single write.
import os, sys, json

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
HTML = os.path.join(ROOT, 'index.html')
SPEC = os.path.join(ROOT, 'tests', 'sabotage', 'v236_d218.json')


def die(msg):
    print('ABORT %s; nothing written' % msg)
    sys.exit(1)


def rep(label, text, old, new):
    n = text.count(old)
    if n != 1:
        die('%s: anchor count %d (want 1)' % (label, n))
    if old == new:
        die('%s: replacement equals anchor' % label)
    print('ok %s' % label)
    return text.replace(old, new, 1)


html = open(HTML, encoding='utf-8').read()
spec0 = open(SPEC, encoding='utf-8').read()
spec = spec0

# ---- the four code lines (old = V237 anchor/replacement, new = V238) ----------------------------
S13_OLD_A = "    if(lg&&(lg.rpe||lg.notes||Object.keys(CARDIO_PARK_FIELDS).some(function(s){ return CARDIO_PARK_FIELDS[s].some(function(f){ return !!lg[f]; }); }))) return;"
S13_OLD_R = "    if(lg&&(lg.rpe||lg.notes||lg.run_dist||lg.bike_mins||lg.swim_yards)) return;"
S13_NEW_A = "    if(lg&&(lg.rpe||lg.notes||lg.swapTo||lg.parked||Object.keys(CARDIO_PARK_FIELDS).some(function(s){ return CARDIO_PARK_FIELDS[s].some(function(f){ return !!lg[f]; }); }))) return;"
S13_NEW_R = "    if(lg&&(lg.rpe||lg.notes||lg.swapTo||lg.parked||lg.run_dist||lg.bike_mins||lg.swim_yards)) return;"

S14_OLD_A = "    if(!entry.notes && !entry.rpe && !(entry.swapFrom && entry.swapTo)) return;"
S14_OLD_R = "    if(!entry.notes && !entry.rpe) return;"
S14_NEW_A = "    if(!entry.notes && !entry.rpe && !(entry.swapFrom && entry.swapTo) && !(entry.restLog && Object.keys(entry.restLog).length)) return;"
S14_NEW_R = "    if(!entry.notes && !entry.rpe && !(entry.restLog && Object.keys(entry.restLog).length)) return;"

# ---- premise: the defect (old anchors in the spec once, gone from index.html) ------------------
for lab, a in (('S13 old anchor', S13_OLD_A), ('S14 old anchor', S14_OLD_A)):
    ja = json.dumps(a, ensure_ascii=False)
    if spec.count(ja) != 1:
        die('%s: spec count %d (want 1)' % (lab, spec.count(ja)))
    if html.count(a) != 0:
        die('%s: index.html count %d (want 0, the defect)' % (lab, html.count(a)))
    print('ok %s: once in spec, absent from index.html' % lab)

# ---- the new anchors land once, and each replacement is a real, D219-only reversion ------------
for lab, a, r, keep in (('S13 new', S13_NEW_A, S13_NEW_R, 'lg.swapTo||lg.parked'),
                        ('S14 new', S14_NEW_A, S14_NEW_R, '!(entry.restLog && Object.keys(entry.restLog).length)')):
    if html.count(a) != 1:
        die('%s anchor: index.html count %d (want 1)' % (lab, html.count(a)))
    if a == r:
        die('%s: replacement equals anchor' % lab)
    if html.count(r) != 0:
        die('%s: replacement already present in index.html (no-op)' % lab)
    if html.replace(a, r, 1) == html:
        die('%s: applying the mutation leaves index.html unchanged' % lab)
    if keep not in r:
        die('%s: replacement drops the V238 clause %r' % (lab, keep))
    print('ok %s: anchor once in index.html, replacement differs, keeps %s' % (lab, keep))
if 'CARDIO_PARK_FIELDS' in S13_NEW_R:
    die('S13 new replacement still carries CARDIO_PARK_FIELDS')
if 'swapFrom' in S14_NEW_R:
    die('S14 new replacement still carries the lone-swap clause')

# ---- S13 entry -------------------------------------------------------------------------------
spec = rep('spec S13 anchor+replacement', spec,
           '  "anchor": %s,\n  "replacement": %s,\n  "gate": "gates/g236_d218_logbutton.js",\n  "note": "NAMED TRIP: g236_d218_logbutton.js row D219-counter conjunct rest-move'
           % (json.dumps(S13_OLD_A, ensure_ascii=False), json.dumps(S13_OLD_R, ensure_ascii=False)),
           '  "anchor": %s,\n  "replacement": %s,\n  "gate": "gates/g236_d218_logbutton.js",\n  "note": "NAMED TRIP: g236_d218_logbutton.js row D219-counter conjunct rest-move'
           % (json.dumps(S13_NEW_A, ensure_ascii=False), json.dumps(S13_NEW_R, ensure_ascii=False)))
spec = rep('spec S13 note', spec,
           '(W1 FRI logged 0:47:13 with no RPE is offered; hand: mon, tue, thu, sat). Ruling: tests/measure/v236_rulings/v236_ruling_d218_d219.md (D218/D219 Amendment 1 (b), (c))."',
           '(W1 FRI logged 0:47:13 with no RPE is offered; hand: mon, tue, thu, sat). Re-anchored in V238 because D225 rewrote the line to add lg.swapTo||lg.parked; the mutation still drops only the CARDIO_PARK_FIELDS keys and keeps the D225 clause. Ruling: tests/measure/v236_rulings/v236_ruling_d218_d219.md (D218/D219 Amendment 1 (b), (c))."')

# ---- S14 entry -------------------------------------------------------------------------------
spec = rep('spec S14 anchor+replacement', spec,
           '  "anchor": %s,\n  "replacement": %s,\n  "gate": "gates/g236_d218_logbutton.js",\n  "note": "NAMED TRIP: g236_d218_logbutton.js row D219-counter conjunct journal-swap'
           % (json.dumps(S14_OLD_A, ensure_ascii=False), json.dumps(S14_OLD_R, ensure_ascii=False)),
           '  "anchor": %s,\n  "replacement": %s,\n  "gate": "gates/g236_d218_logbutton.js",\n  "note": "NAMED TRIP: g236_d218_logbutton.js row D219-counter conjunct journal-swap'
           % (json.dumps(S14_NEW_A, ensure_ascii=False), json.dumps(S14_NEW_R, ensure_ascii=False)))
spec = rep('spec S14 note', spec,
           '(no W1 journal row; hand: Sat, \\"Swapped Run → Bike\\"). Ruling: tests/measure/v236_rulings/v236_ruling_d218_d219.md (D218/D219 Amendment 1 (b), (c))."',
           '(no W1 journal row; hand: Sat, \\"Swapped Run → Bike\\"). Re-anchored in V238 because D224 extended the line with the restLog clause; the mutation still drops only the lone-swap clause and keeps the D224 clause. Ruling: tests/measure/v236_rulings/v236_ruling_d218_d219.md (D218/D219 Amendment 1 (b), (c))."')

# ---- post-checks before the write --------------------------------------------------------------
try:
    rows0 = json.loads(spec0)
    rows = json.loads(spec)
except Exception as e:
    die('spec no longer parses as JSON: %s' % e)
if len(rows) != len(rows0):
    die('entry count changed %d -> %d' % (len(rows0), len(rows)))
for r0, r in zip(rows0, rows):
    s13 = r0['name'].startswith('S13-D219')
    s14 = r0['name'].startswith('S14-D219')
    if not (s13 or s14):
        if r0 != r:
            die('entry %r changed' % r0['name'])
        continue
    for k in ('name', 'gate'):
        if r0[k] != r[k]:
            die('%s: field %s changed' % (r0['name'], k))
    if set(r0) != set(r):
        die('%s: key set changed' % r0['name'])
    if html.count(r['anchor']) != 1:
        die('%s: new anchor count %d in index.html' % (r['name'], html.count(r['anchor'])))
    want = (S13_NEW_A, S13_NEW_R) if s13 else (S14_NEW_A, S14_NEW_R)
    if (r['anchor'], r['replacement']) != want:
        die('%s: anchor/replacement not the V238 pair' % r['name'])
if json.dumps(rows, indent=1, ensure_ascii=False) + '\n' != spec:
    die('rewritten spec is not in the file\'s JSON formatting (indent=1, raw UTF-8, trailing newline)')

open(SPEC, 'w', encoding='utf-8').write(spec)
print('wrote tests/sabotage/v236_d218.json (index.html untouched)')
