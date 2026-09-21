#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""V201 / D94 — SLICE 7: correct the note on tests/sabotage/v199.json M2. ONE FILE, ONE EDIT.

WHY. Gatekeeper ran the V201 rewrite of M2 (nobody had). It is NOT a mutation defect: it
moves 1,152 of 1,728 configs on g199's lattice (66.7%), 1,458/2,916 healthy, 60/60 mini,
1,296/1,296 linjA, and HALF_MANNY moves d4364dd3fa63a3a1 -> af6a1bf96efc6dcc. The note,
however, is wrong in two ruled ways and under-describes what the mutation means:

  (a) it DECLARES g199 C1/C2 as trips. Measured, C1 and C2 stay GREEN; zero-posterior week
      counts do not rise. Coach declared them from the wrong model: dropping the first-come
      fallback empties the accessory SLOT, but the day's posterior chain sits in the MAIN on
      every card the pre-pass declined to pick (that is D94's premise, and on the leg trap
      cards it was D91's), so no week loses its posterior. F4 and H3 stand. The refuted
      claim moves to a history line and OUT of the list the sweep is checked against.

  (b) it says EXPECTED COLLATERAL: PENDING GATEKEEPER MEASUREMENT. The measured nine-gate
      radius replaces that sentence.

  (c) the one-line description said the mutation empties the slot on "the cards the pre-pass
      declined". g193_samecard G5a and G5f show pickIdx<0 is the ONLY path by which any card
      without a posterior accessory candidate keeps an accessory block at all, on EVERY
      family. Coach's headline: the first-come fallback is the deload's general keep path;
      the pre-pass is the exception.

SCOPE. Only M2's `note` changes. `name`, `anchor`, `replacement` and `gate` are asserted
byte-identical after the write - the runner reads only those four, so the sweep result is
provably invariant under this edit. Row count stays 8; no row added, removed or reordered.
index.html, tests/harness.js and every gate file are NOT touched; index.html's sha256 is
asserted unchanged before and after.
"""
import hashlib
import io
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
APP = os.path.join(ROOT, 'index.html')
HARNESS = os.path.join(ROOT, 'tests', 'harness.js')
SPEC = os.path.join(ROOT, 'tests', 'sabotage', 'v199.json')

FUNCTIONAL = ('name', 'anchor', 'replacement', 'gate')


def die(msg):
    print('ABORT: %s' % msg)
    print('NOTHING WRITTEN.')
    sys.exit(1)


def sha(p):
    return hashlib.sha256(io.open(p, 'rb').read()).hexdigest()


app_before = sha(APP)
harness_before = sha(HARNESS)

raw = io.open(SPEC, encoding='utf-8').read()
rows_before = json.loads(raw)
if not isinstance(rows_before, list) or len(rows_before) != 8:
    die('v199.json is not an 8 row list before the edit (got %r)' % (len(rows_before),))

names_before = [r.get('name', '') for r in rows_before]
m2_idx = [i for i, n in enumerate(names_before) if n.startswith('M2 ->')]
if len(m2_idx) != 1:
    die('expected exactly one M2 row, found %d' % len(m2_idx))
m2_idx = m2_idx[0]
m2_before = rows_before[m2_idx]
keys_before = {k: m2_before[k] for k in FUNCTIONAL}

OLD = m2_before.get('note', '')
if 'PENDING GATEKEEPER MEASUREMENT' not in OLD:
    die('M2 note does not carry the PENDING sentence; already corrected?')
if 'g199 C1/C2 (zero-posterior deload weeks rise from 0)' not in OLD:
    die('M2 note does not declare C1/C2 the way the ruling describes')

n = raw.count(OLD)
if n != 1:
    die('anchor count==%d, expected 1' % n)

NEW = (
    'REWRITTEN IN V201 (D94-s); NOTE CORRECTED IN V201 SLICE 7 AGAINST GATEKEEPER MEASUREMENT '
    '(no functional key changed). '
    'WHAT THIS MUTATION MEANS: the first-come fallback is the deload keep path in general; the '
    'posterior pre-pass is the exception. Dropping it does NOT merely empty the accessory slot '
    'on the cards the pre-pass declined to pick: it empties the slot on EVERY deload card whose '
    'accessories carry no posterior chain, which is most of the push family and the whole of the '
    'lowback pull family. The two structural trips are the proof: g193_samecard G5a and G5f show '
    'that pickIdx<0 is the ONLY path by which a card with no posterior accessory candidate keeps '
    'an accessory block at all, on every family, not just the leg trap and the D94 pull cards. '
    'HISTORY. The previous M2 probed the claim that the pre-pass scans MAIN sections too. D94 '
    'added the __mainPost guard, which skips the pre-pass loop exactly when a Main holds '
    'posterior chain work, so that mutation became a genuine no-op (0 of 1,152 configs moved) and '
    'no rewrite of it could restore its target; coach ruled it OBSOLETE, NOT BROKEN. The CLAIM it '
    'exercised survives as g199 F4 (exactly one accessory block survives wherever one was '
    'available) and H3 (on the 2,160 trap cards exactly one still survives). That claim had no '
    'mutation on its ZERO side, because M5 and M8 both exercise the more-than-one side, so this '
    'rewrite probes the same assertion other limb, single-site. THE ANCHOR IS THE M5/M8 LINE, so '
    'its count==1 is already established, and it is asserted again here. '
    'DECLARED TRIPS: g199 F4 and g199 H3. '
    'DECLARED AND REFUTED, DO NOT RE-ADD: g199 C1 and C2 were declared trips in the V201 slice '
    'that rewrote this row, on the prediction that zero-posterior deload weeks would rise from 0. '
    'Gatekeeper measured them GREEN; the zero-posterior week counts do not rise. Coach declared '
    'them from the wrong model: dropping the first-come fallback empties the accessory SLOT, but '
    'the day posterior chain sits in the MAIN on every card the pre-pass declined to pick (that '
    'is D94 premise, and on the leg trap cards it was D91), so no week loses its posterior. A '
    'refuted claim belongs in this history line and NEVER in the list the sweep is checked '
    'against, so C1/C2 are struck from DECLARED TRIPS above and must not be re-added from that '
    'same reasoning. '
    'MEASURED RADIUS (gatekeeper, V201; this mutation is NOT a mutation defect): 1,152 of 1,728 '
    'configs move on g199 lattice (66.7%), 1,458/2,916 healthy, 60/60 mini, 1,296/1,296 linjA, '
    'and HALF_MANNY moves d4364dd3fa63a3a1 -> af6a1bf96efc6dcc. NINE GATES GO RED. '
    'Digest readers: g197a D1, g197b B8a, g198 C1, g199 B1, g200_core_tier F1a+F1b, '
    'g200_pull_arbitration B1. '
    'g199_deload_arbitration 48/8 - B1, D2, E1b, F1, F3, F3c, F4, H3. '
    'g200_pull_arbitration 13/5 - B1, P1, P2, P4, P7. '
    'g193_budget_floor 26/1 - B3 wide, D85 confinement (prehab outside licensed names below the '
    'V197 census on 6/6 tiers); B3 follows from the same cause as G5a/G5f and is NOT a separate '
    'finding. '
    'g193_samecard 51/2 - G5a (162/648 lowback-protect vertical-pull main days left with the Main '
    'and nothing else), G5f (3,888 push cards left with the Main and no other block). '
    'Sixteen gates stay green.'
)

if '"' in NEW or '\\' in NEW:
    die('replacement note would need JSON escaping; refusing')
if NEW in raw:
    die('replacement already present; script already ran?')

out = raw.replace(OLD, NEW)
if out == raw:
    die('replace was a no-op')

io.open(SPEC, 'w', encoding='utf-8').write(out)

# --- prove the write did exactly what it claimed -----------------------------
rows_after = json.loads(io.open(SPEC, encoding='utf-8').read())
if len(rows_after) != 8:
    die('POST: row count is %d, expected 8' % len(rows_after))
if [r.get('name', '') for r in rows_after] != names_before:
    die('POST: row names or order changed')

m2_after = rows_after[m2_idx]
for k in FUNCTIONAL:
    if m2_after.get(k) != keys_before[k]:
        die('POST: M2 %s changed' % k)
if m2_after.get('note') != NEW:
    die('POST: M2 note is not the new text')
if set(m2_after.keys()) != set(m2_before.keys()):
    die('POST: M2 key set changed')

for i, r in enumerate(rows_after):
    if i == m2_idx:
        continue
    if r != rows_before[i]:
        die('POST: row %d changed' % i)

if sha(APP) != app_before:
    die('POST: index.html changed')
if sha(HARNESS) != harness_before:
    die('POST: tests/harness.js changed')

print('OK  tests/sabotage/v199.json M2.note rewritten')
print('    rows: 8 (unchanged, same order)')
print('    M2 name/anchor/replacement/gate: byte-identical')
print('    note length %d -> %d chars' % (len(OLD), len(NEW)))
print('    index.html sha256 unchanged: %s' % app_before)
print('    tests/harness.js sha256 unchanged: %s' % harness_before)
