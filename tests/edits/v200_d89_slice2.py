# -*- coding: utf-8 -*-
# V200 D89 — SLICE 2. Gate + sabotage only. This script does NOT touch index.html.
#
# What it does:
#   1. asserts tests/gates/g200_core_tier.js exists and carries the assertion IDs the
#      sabotage notes name (a mutation that names a gate label which does not exist is
#      a mutation defect that reads as a survivor);
#   2. asserts every sabotage anchor occurs exactly count==1 in index.html BEFORE writing
#      anything, so a mutation can never land NOT-APPLIED at sweep time;
#   3. appends M6..M9 to tests/sabotage/v200.json, keeping M1..M5 from the post-V199
#      tooling pass byte-identical.
# Aborts on the first miss. No version meta bump: slice 1 already bumped it to 200.
import io, json, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
APP  = os.path.join(ROOT, 'index.html')
GATE = os.path.join(ROOT, 'tests', 'gates', 'g200_core_tier.js')
SAB  = os.path.join(ROOT, 'tests', 'sabotage', 'v200.json')

def die(msg):
    sys.stderr.write('ABORT: ' + msg + '\n')
    sys.exit(1)

app = io.open(APP, encoding='utf-8').read()

# ── 0. the artifact must still be slice 1's artifact ───────────────────────────────
if app.count('<meta name="ia-version" content="200">') != 1:
    die('index.html is not at ia-version 200')
CLAUSE = "  if(_auxFamily(name)==='core') return 0;\n"
if app.count(CLAUSE) != 1:
    die('the V200 family-core clause is not present exactly once (count %d)' % app.count(CLAUSE))

# ── 1. the gate exists and carries the labels the notes name ───────────────────────
if not os.path.exists(GATE):
    die('gate file missing: ' + GATE)
gate = io.open(GATE, encoding='utf-8').read()
for label in ['A1 all 23 declared-core names', 'A2 Pallof press returns',
              'C1 _isCompound(Pallof press) is still TRUE',
              'C2c _isCompound', 'D1b swapLoadNote(Pallof press, Plank shoulder taps)',
              'E1 the HEAVY COMPOUND predicate is FALSE',
              'F4a EXACTLY 1 of 1798 cells changes']:
    if gate.count(label) != 1:
        die('gate label not found exactly once: ' + label)

# ── 2. anchors, all asserted count==1 before any write ─────────────────────────────
A_AUXFAM = "function _auxFamily(name){return _AUX_FAMILY[String(name||'').trim()]||null;}"
A_ISCMP  = ("function _isCompound(name){\n"
            "  return /bench|squat|deadlift|press|row|pull|clean|snatch|lunge|dip|chinup|pullup|hinge|romanian|thruster/.test((name||'').toLowerCase())")
for a in [CLAUSE, A_AUXFAM, A_ISCMP]:
    n = app.count(a)
    if n != 1:
        die('anchor count %d (expected 1): %r' % (n, a[:70]))

MUTS = [
  {
    "name": "M6 -> the D89 family-core clause is deleted outright, so _compoundTier falls through to the unqualified-name return 3 again and `Pallof press` reads as a barbell compound. This is the exact V199 behaviour, which is the point: a gate that cannot tell V200 from V199 is not testing the ruling",
    "anchor": CLAUSE,
    "replacement": "",
    "gate": "gates/g200_core_tier.js",
    "note": "NAMED TRIPS: g200_core_tier A1 (the 23-name family sweep: 1 of 23 returns 3), A2 (Pallof press tier), D1b (R5 swapLoadNote returns the V199 sentence instead of ''), E1 (R6 HEAVY COMPOUND predicate true), F4a (the ruled cell stops changing: 0 of 1798), F4b, F4c and F1b (the after-digest reverts to 6e32421331693437). EXPECTED COLLATERAL: C2a/C2b/F0 also go red because the clause is the thing they count; that is the mutation being the mutation, not a gate defect. This mutation is the acceptance test for the gate as a whole and reproduces exactly the V199 failure set."
  },
  {
    "name": "M7 -> the clause returns 2 instead of 0, the 'it is not barbell tier' token model coach rejected. Pallof press stops reading as barbell but still carries a two-tier load gap, so R5 still prints the lighter-than sentence against a tier-0 candidate",
    "anchor": CLAUSE,
    "replacement": "  if(_auxFamily(name)==='core') return 2;\n",
    "gate": "gates/g200_core_tier.js",
    "note": "NAMED TRIPS: g200_core_tier A1 (all 23 declared-core names now return 2, so the sweep reads 23 of 23 nonzero) and D1b. D1b IS THE POINT: swapLoadNote(Pallof press, Plank shoulder taps) computes d = 2 - 0 = 2, which does NOT clear `d<2`, so the athlete still reads 'Much lighter than pallof press.' against a plank variation. D1a pins that the probe candidate is tier 0 and not family core, which is what keeps D1b sensitive here; a family-core probe candidate would move with the mutation and D1b would pass. E1 does NOT trip (2 >= 3 is false) and that is expected and disclosed: this mutation separates the R5 claim from the R6 claim."
  },
  {
    "name": "M8 -> the clause is planted in _isCompound instead of _compoundTier, the placement coach forbade. Tier still reads 0 by the !_isCompound gate, so the family sweep is satisfied, but _itemCost now prices Pallof press at sets x 1.0 rather than sets x 1.5 and V200 has silently shipped the _itemCost change that was ruled OUT",
    "anchor": A_ISCMP,
    "replacement": ("function _isCompound(name){\n"
                    "  if(_auxFamily(name)==='core') return false;\n"
                    "  return /bench|squat|deadlift|press|row|pull|clean|snatch|lunge|dip|chinup|pullup|hinge|romanian|thruster/.test((name||'').toLowerCase())"),
    "gate": "gates/g200_core_tier.js",
    "note": "NAMED TRIPS: g200_core_tier C1 (_isCompound(Pallof press) must still be TRUE) and C2c (_isCompound's body must not mention _auxFamily at all). C1 is the whole reason the ruling names a function and not a value: the tier-0 result is identical either way, so nothing in sections A, D or E can tell the two placements apart. EXPECTED COLLATERAL: F4a/F4b/F1b may move because _itemCost changes the budget arithmetic; that is the ruled-out second edit becoming visible, which is the finding. GATEKEEPER: the trip must be C1 BY NAME."
  },
  {
    "name": "M9 -> _auxFamily stops finding its own keys (the no-trim failure mode, here forced with a trailing space on the lookup key), so every family question in the app answers null and the D89 clause can never fire even though its source line is still present and reads correct",
    "anchor": A_AUXFAM,
    "replacement": "function _auxFamily(name){return _AUX_FAMILY[String(name||'')+' ']||null;}",
    "gate": "gates/g200_core_tier.js",
    "note": "NAMED TRIPS: g200_core_tier A1 (the family sweep: Pallof press returns 3 again, 1 of 23 nonzero), A2, D1b, E1 and F4a. This is the mutation that proves the sweep tests the ACCESSOR and not the source line: M6 deletes the clause and C2a/C2b catch it on sight, whereas here the clause survives every source-text check and only the behavioural sweep can see it. EXPECTED COLLATERAL: _auxFamily has six readers in the artifact (the hold dose at :8335, auxSwapCandidates at :8837, this clause at :9344, canSwap at :11619, the swap-sheet family tag at :13064), so collateral in the swap-sheet and aux-pool gates is expected and disclosed."
  },
]

raw = io.open(SAB, encoding='utf-8').read()
existing = json.loads(raw)
if len(existing) != 5:
    die('tests/sabotage/v200.json does not hold exactly the 5 post-V199 mutations (got %d)' % len(existing))
TAIL = "\n  }\n]"
if raw.count(TAIL) != 1:
    die('sabotage tail anchor count %d (expected 1)' % raw.count(TAIL))
for m in MUTS:
    if m['anchor'] not in app:
        die('mutation anchor absent from index.html: ' + m['name'][:20])
    if m['anchor'] == m['replacement']:
        die('no-op mutation (anchor == replacement): ' + m['name'][:20])

body = json.dumps(MUTS, indent=2, ensure_ascii=False)
body = body[1:-1].rstrip()          # drop the outer [ ], keep the object list
out = raw.replace(TAIL, "\n  }," + body + "\n]")
parsed = json.loads(out)
if len(parsed) != 9:
    die('result does not hold 9 mutations (got %d)' % len(parsed))
if json.dumps(parsed[:5], sort_keys=True) != json.dumps(existing, sort_keys=True):
    die('M1..M5 were not preserved byte-for-byte in content')
io.open(SAB, 'w', encoding='utf-8').write(out)
print('OK: tests/sabotage/v200.json now holds %d mutations (M1..M5 preserved, M6..M9 appended)' % len(parsed))
print('OK: index.html untouched by this script')
