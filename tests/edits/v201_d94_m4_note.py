#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""V201 / D94 — SLICE 6 of 6: repair ONE stale sentence in tests/sabotage/v200.json M4.

WHAT AND WHY. M4's note opened with "WHY M4 EXISTS ALONGSIDE M2: M4 is the mutation that
proves the positive limb is ALIVE, M2 proves the direction." The M2 it points at is
v200.json's own M2, which was RETIRED this build under D94-s. The sentence is now false on
its face: a reader chasing "M2" inside v200.json finds this sentence before they find the
_file_header that explains the retirement. Same class as g199 B1's "byte-identical to V198"
and g200_pull_arbitration B1's "D93 is a gate-only ruling: 0 hunks in index.html", both
struck this session for exactly this reason.

SCOPE, ON THE RECORD. Mario ruled the narrow reading of coach's "M1 and M4 stay untouched":
do not repoint M4's gate or anchor and do not delete the row, but prose that went false may
be corrected. This script therefore touches M4's `note` and NOTHING else. `name`, `anchor`,
`replacement` and `gate` are asserted byte-identical after the write. Row count stays 7.
No row is added or removed. No other row's note is touched.

WHAT SURVIVES THE REWRITE. Coach's E0 reasoning is the reason M4 exists and is carried
forward verbatim in the sentences that follow the edited one: a revert-only mutation would
pass a candidate that had quietly emptied the population. The rewrite only re-points the
direction claim at where it actually lives now, v201.json M1 and M2, pinned by g200 P2/P7.

index.html and tests/harness.js are NOT touched. index.html's hash is asserted unchanged.
"""
import hashlib
import io
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
APP = os.path.join(ROOT, 'index.html')
SPEC = os.path.join(ROOT, 'tests', 'sabotage', 'v200.json')


def die(msg):
    print('ABORT: %s' % msg)
    print('NOTHING WRITTEN.')
    sys.exit(1)


app_before = hashlib.sha256(io.open(APP, 'rb').read()).hexdigest()

raw = io.open(SPEC, encoding='utf-8').read()
rows_before = json.loads(raw)
if not isinstance(rows_before, list) or len(rows_before) != 7:
    die('v200.json is not a 7 row list before the edit (got %r)' % (len(rows_before),))

m4_before = [r for r in rows_before if r.get('name', '').startswith('M4 ->')]
if len(m4_before) != 1:
    die('expected exactly one M4 row, found %d' % len(m4_before))
m4_before = m4_before[0]

OLD = 'WHY M4 EXISTS ALONGSIDE M2: M4 is the mutation that proves the positive limb is ALIVE, M2 proves the direction.'
NEW = ('WHY M4 EXISTS: M4 is the mutation that proves the positive limb is ALIVE, and the '
       'direction claim it used to pair with is no longer in this file (v200 M2 was retired '
       'under D94-s); the direction is now carried by v201.json M1 and M2, pinned by g200 P2 '
       'and P7.')

n = raw.count(OLD)
if n != 1:
    die('anchor count==%d, expected 1: %r' % (n, OLD[:60]))
if OLD not in m4_before.get('note', ''):
    die('anchor is not inside M4 note')
if NEW in raw:
    die('replacement text already present; script already ran?')

out = raw.replace(OLD, NEW)
if out == raw:
    die('replace was a no-op')

io.open(SPEC, 'w', encoding='utf-8').write(out)

# --- prove the write did exactly what it claimed -----------------------------
rows_after = json.loads(io.open(SPEC, encoding='utf-8').read())
if len(rows_after) != 7:
    die('POST: row count is %d, expected 7' % len(rows_after))

m4_after = [r for r in rows_after if r.get('name', '').startswith('M4 ->')]
if len(m4_after) != 1:
    die('POST: M4 row count is %d' % len(m4_after))
m4_after = m4_after[0]

for k in ('name', 'anchor', 'replacement', 'gate'):
    if m4_before.get(k) != m4_after.get(k):
        die('POST: M4 key %r changed' % k)
    print('M4 %-12s byte-identical  (%d chars)' % (k, len(m4_after.get(k) or '')))

if set(m4_before.keys()) != set(m4_after.keys()):
    die('POST: M4 key set changed')

for i, (b, a) in enumerate(zip(rows_before, rows_after)):
    if b.get('name') != a.get('name'):
        die('POST: row %d name changed' % i)
    if b is not m4_before and b != a:
        die('POST: non-M4 row %d changed (%s)' % (i, a.get('name', '')[:40]))

if OLD in m4_after['note']:
    die('POST: old sentence survives')
if NEW not in m4_after['note']:
    die('POST: new sentence missing')
if 'E0 defect again' not in m4_after['note']:
    die('POST: coach E0 reasoning did not survive')

app_after = hashlib.sha256(io.open(APP, 'rb').read()).hexdigest()
if app_before != app_after:
    die('POST: index.html hash moved (%s -> %s)' % (app_before[:12], app_after[:12]))

print('')
print('rows            : %d (unchanged)' % len(rows_after))
print('E0 reasoning    : present')
print('index.html sha  : %s (unchanged)' % app_after)
print('')
print('BEFORE: %s' % OLD)
print('AFTER : %s' % NEW)
print('OK')
