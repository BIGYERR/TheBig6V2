#!/usr/bin/env python3
"""V203 slice I, edits 3 and 4: record D120's two sabotage cases in tests/sabotage/v203.json.

ROUTE TAKEN, and why (the brief asked to check first):
  tests/sabotage.py reads exactly ONE source — the candidate artifact — counts the
  anchor in it and mutates it. There is no target field. These two mutations touch
  tests/harness.js and tests/gates/g200_core_tier.js, so as sweep rows they would
  score anchor count=0 and report NOT-APPLIED. They are therefore NOT added as
  executable rows. They are proved directly by tests/sabotage/v203_nonartifact_proof.py
  and recorded here as documentation under a `_nonartifact_cases` key riding on row 0,
  the same shape v200.json uses for `_file_header`: sabotage.py reads only name /
  anchor / replacement / gate from a row and ignores every other key, so the sweep
  stays at exactly 15 executable rows and the counts do not move.

Anchors asserted count==1 (in the JSON structure, not by string match) before writing.
index.html is NOT touched.
"""
import hashlib, json, os, sys

ROOT  = '/Users/CanasBangin/Desktop/TheBig6V2'
SPEC  = os.path.join(ROOT, 'tests/sabotage/v203.json')
INDEX = os.path.join(ROOT, 'index.html')

MD5 = hashlib.md5(open(INDEX, 'rb').read()).hexdigest()
assert MD5 == '44237e045f9e40b68f186b34a1a08558', 'index.html is not the slice-H artifact: ' + MD5

raw  = open(SPEC, encoding='utf-8').read()
muts = json.loads(raw)

# ── anchors ──────────────────────────────────────────────────────────────────────
print('spec rows =', len(muts))
if len(muts) != 15:
    sys.exit('ABORT: expected 15 executable rows, found %d. Nothing written.' % len(muts))
if not isinstance(muts[0], dict) or not muts[0].get('name', '').startswith('M1 -> '):
    sys.exit('ABORT: row 0 is not M1. Nothing written.')
n = sum(1 for m in muts if '_nonartifact_cases' in m)
print('_nonartifact_cases already present on', n, 'rows (expected 0)')
if n != 0:
    sys.exit('ABORT: _nonartifact_cases already recorded. Nothing written.')

CASES = {
  "_why_not_in_the_sweep":
    "sabotage.py mutates the CANDIDATE ARTIFACT and nothing else: it reads one file "
    "(the html passed on argv), counts the anchor in that string and runs the named "
    "gate on the mutated copy. It has no target field. Both D120 cases mutate the test "
    "scaffolding — the harness era table and the gate line that reads it — so as sweep "
    "rows they would count 0 anchors in index.html and report NOT-APPLIED, which is the "
    "runner's word for a mutation that did not happen. Neither was contorted into an "
    "artifact-shaped mutation and NEITHER IS COUNTED AS TRIPPED BY THE SWEEP. They are "
    "proved instead by tests/sabotage/v203_nonartifact_proof.py, which builds a temp "
    "tree of the two test files, asserts the anchor count==1 in the file that actually "
    "holds it, and runs g200_core_tier.js against the UNMUTATED index.html. A green "
    "control run on unmutated copies gates the whole script.",
  "_run": "python3 tests/sabotage/v203_nonartifact_proof.py index.html",
  "_result_on_V203": "control PASS 43 FAIL 0; N1 TRIPPED 42/1; N2 TRIPPED 42/1; 2 of 2 discriminating",
  "cases": [
    {
      "id": "N1",
      "target_file": "tests/harness.js",
      "name": "N1 -> the [203] row is stripped from MANNY_CORE_OFF_DIGEST_BY_VERSION. The era table loses its V203 entry, so the clause-off counterfactual has nothing to be pinned against. This is the exact shape of a future build that moves both arms and forgets to record the row, which standing ruling 5 says must fail loudly rather than silently pass.",
      "anchor": "MANNY_CORE_OFF_DIGEST_BY_VERSION[203] = '658ad56c903ad829';   // D117 moved both arms; D120\n",
      "replacement": "",
      "gate": "gates/g200_core_tier.js",
      "result": "TRIPPED  PASS 42 FAIL 1  (control PASS 43 FAIL 0)",
      "named_red_row_verbatim": "FAIL F1a the counterfactual matches the V203 row of MANNY_CORE_OFF_DIGEST_BY_VERSION (NO ROW) (got 658ad56c903ad829) — no MANNY_CORE_OFF_DIGEST_BY_VERSION row for V203: an unruled counterfactual digest move",
      "note": "DISCRIMINATING: F1a is the only red row and PASS falls by exactly one (43 -> 42). F1b stays green, which is what separates 'the era row is missing' from 'the digest moved': F1b reads MANNY_DIGEST_BY_VERSION, a different table, and it must not move. This is the row-existence conjunct of standing ruling 5 firing: !!CORE_OFF_ROW is what fails, and the message prints NO ROW rather than a digest mismatch."
    },
    {
      "id": "N2",
      "target_file": "tests/gates/g200_core_tier.js",
      "name": "N2 -> F1a is reverted to the pre-D120 literal '6e32421331693437'. That is the V198/V199 clause-off digest the gate pinned before D117 moved both arms, and the state this gate was in at the start of the session. It must be RED on V203: that is what makes D120 a repoint that was load-bearing and not a cosmetic edit.",
      "anchor": "const CORE_OFF_ROW=MANNY_CORE_OFF_DIGEST_BY_VERSION[IA.version];   // era row, not a literal (D89)",
      "replacement": "const CORE_OFF_ROW='6e32421331693437';   // SABOTAGE N2: pre-D120 literal",
      "gate": "gates/g200_core_tier.js",
      "result": "TRIPPED  PASS 42 FAIL 1  (control PASS 43 FAIL 0)",
      "named_red_row_verbatim": "FAIL F1a the counterfactual matches the V203 row of MANNY_CORE_OFF_DIGEST_BY_VERSION (6e32421331693437) (got 658ad56c903ad829)",
      "note": "DISCRIMINATING: F1a alone goes red, PASS 43 -> 42, every other row including F1b stays green. The mutation keeps the era table intact and only stops the gate READING it, so the trip pins the repoint itself rather than the harness data. Read the two messages together: N1 prints NO ROW, N2 prints the stale literal against the true 658ad56c903ad829."
    }
  ]
}

muts[0]['_nonartifact_cases'] = CASES

out = json.dumps(muts, indent=1, ensure_ascii=False) + '\n'
open(SPEC, 'w', encoding='utf-8').write(out)
print('WROTE', SPEC)

back = json.loads(open(SPEC, encoding='utf-8').read())
assert len(back) == 15
assert all({'name', 'anchor', 'replacement', 'gate'} <= set(m) for m in back)
assert len(back[0]['_nonartifact_cases']['cases']) == 2
print('re-read OK: 15 executable rows, 2 documented non-artifact cases')
after = hashlib.md5(open(INDEX, 'rb').read()).hexdigest()
assert after == MD5, 'index.html changed: ' + after
print('index.html md5 unchanged:', after)
