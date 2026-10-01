#!/usr/bin/env python3
"""V226 build 5, slice 7e2: correct the CONFINEMENT notes in tests/sabotage/v225.json (tests only).

Background: slice 7d3 wrote into v225 M5's note that sabotage.py runs
g225_d187_pacerate.js with no baseline, so CONFINEMENT fails closed. Slice 7e
(tests/edits/v226_edit_7e.py) fixed the gate: it pins its baseline by version.
7e also showed the defect predates V226 (V225's own gate gives PASS 9 FAIL 1 on
V225 with no argv baseline), so V225's sweep trips on this gate were vacuous and
its "CONFINEMENT stays GREEN" notes came from hand runs with a baseline.

Edits (notes only; anchor, replacement, gate, name are asserted byte-identical):
  1. M5: the stale "Under sabotage.py ... trip count." clause -> a V226 UPKEEP (slice 7e) sentence.
  2. M3: one sentence after its CONFINEMENT GREEN claim.
  3. M4: one sentence after its CONFINEMENT GREEN claim.

Edits the JSON by structure. Every anchor is asserted count==1 in its note and
in the raw file before anything is written; the file is written whole or not at all.
"""
import json, os, shutil, sys

ROOT = '/Users/CanasBangin/Desktop/TheBig6V2'
SCRATCH = '/private/tmp/claude-501/-Users-CanasBangin-Desktop-TheBig6V2/f12a37a6-7352-4251-8d99-97802f07477d/scratchpad/builder_7e2'
V225 = os.path.join(ROOT, 'tests/sabotage/v225.json')
GATE = 'gates/g225_d187_pacerate.js'

def die(msg):
    print('ABORT: ' + msg); sys.exit(1)

def need(cond, msg):
    if not cond: die(msg)

def load(path):
    raw = open(path, encoding='utf-8').read()
    data = json.loads(raw)
    fmts = []
    for ind in (1, 2, 4):
        for ea in (False, True):
            for nl in ('', '\n'):
                if json.dumps(data, indent=ind, ensure_ascii=ea) + nl == raw:
                    fmts.append((ind, ea, nl))
    need(len(fmts) >= 1, path + ': no json.dumps format round-trips the file byte-for-byte')
    return raw, data, fmts[0]

def dump(data, fmt):
    ind, ea, nl = fmt
    return json.dumps(data, indent=ind, ensure_ascii=ea) + nl

raw, d, fmt = load(V225)
need(isinstance(d, list) and len(d) == 5, 'v225.json is not a 5-row top-level array')
before = json.loads(raw)

def row(idx, prefix):
    r = d[idx]
    need(r.get('name', '').startswith(prefix), 'row ' + str(idx + 1) + ' name does not start with ' + repr(prefix))
    need(r.get('gate') == GATE, 'row ' + str(idx + 1) + ' gate is not ' + GATE)
    return r

m3 = row(2, 'M3 -> ')
m4 = row(3, 'M4 -> ')
m5 = row(4, 'M5 -> ')
for r in (m3, m4, m5):
    need('slice 7e' not in r['note'], r['name'][:3] + ' already carries the 7e correction (re-run?)')

STALE_M5 = ("Under sabotage.py, which passes no baseline, CONFINEMENT fails closed on the control and the mutant alike, "
  "so read this row's discrimination from the named MILE-REQUIRED row and not from the trip count.")
NEW_M5 = ("V226 UPKEEP (slice 7e): sabotage.py passes this gate no baseline, and before V226 the gate failed closed on "
  "CONFINEMENT under the sweep, control and mutant alike, so the V225 sweep trips on this gate were vacuous and the "
  "CONFINEMENT GREEN readings in these notes came from hand runs with a baseline. From V226 the gate pins its own "
  "baseline by version, CONFINEMENT is GREEN on the control under the runner, and each of M3, M4 and M5 trips only its "
  "named row (RATE, COPY run, MILE-REQUIRED non-beginner NON-pace respectively; verified slice 7e).")

CLAIM_M3 = "COPY, MILE-REQUIRED and CONFINEMENT all stay GREEN (this mutation touches only the rate value, not copy, the mile gate, or any non-pace-goal build)."
CLAIM_M4 = "CENSUS, RATE, MILE-REQUIRED and CONFINEMENT all stay GREEN."
ADD = (" Before V226 that CONFINEMENT reading held only with a hand-passed baseline; under sabotage.py the gate "
  "failed closed (see M5's V226 UPKEEP (slice 7e)).")

for label, r, anchor in (('M5', m5, STALE_M5), ('M3', m3, CLAIM_M3), ('M4', m4, CLAIM_M4)):
    need(r['note'].count(anchor) == 1, label + ' note anchor count ' + str(r['note'].count(anchor)) + ' != 1')
    need(sum(x['note'].count(anchor) for x in d) == 1, label + ' anchor is not unique across notes')

m5['note'] = m5['note'].replace(STALE_M5, NEW_M5)
m3['note'] = m3['note'].replace(CLAIM_M3, CLAIM_M3 + ADD)
m4['note'] = m4['note'].replace(CLAIM_M4, CLAIM_M4 + ADD)

# notes are the only change; every other field byte-identical
need(len(d) == len(before), 'row count changed')
for i, (a, b) in enumerate(zip(before, d)):
    need(set(a.keys()) == set(b.keys()), 'row ' + str(i + 1) + ' keys changed')
    for k in a:
        if k == 'note': continue
        need(a[k] == b[k], 'row ' + str(i + 1) + ' field ' + k + ' changed')
changed = [i + 1 for i, (a, b) in enumerate(zip(before, d)) if a['note'] != b['note']]
need(changed == [3, 4, 5], 'notes changed on rows ' + str(changed) + ', expected [3, 4, 5]')

out = dump(d, fmt)
need(out != raw, 'edit produced no change')
os.makedirs(SCRATCH, exist_ok=True)
shutil.copyfile(V225, os.path.join(SCRATCH, 'v225.json.pre7e2'))
try:
    open(V225, 'w', encoding='utf-8').write(out)
except Exception as e:
    shutil.copyfile(os.path.join(SCRATCH, 'v225.json.pre7e2'), V225)
    die('write failed, file restored: ' + repr(e))
print('OK v225: notes corrected on M3, M4, M5; format', fmt)
