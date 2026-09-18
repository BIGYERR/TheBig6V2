#!/usr/bin/env python3
# V198 gate amendment (tests only; index.html is NOT touched by this script).
#
# AMENDMENT 1 — E5. Its premise ("D84 touched no budget machinery") is superseded by D85,
#   which deliberately edits capSessionBudget, so the candidate-vs-baseline byte comparison
#   fails by construction. The assertion is RE-PINNED, not deleted: capSessionBudget is now
#   confined to the D85-licensed TEXT by sha256, with the pre-D85 text allowed only on a
#   pre-D85 artifact (ia-version < 198) so the gate still answers the case it was written
#   for when run on V197 vs V196. _itemCost / _setCount keep the baseline byte comparison.
#
# AMENDMENT 2 — E1h. "Calves rises somewhere" is satisfiable only against a pre-D84
#   baseline; it fails when V197 is compared to itself. It becomes baseline-version-aware
#   and REFUSES loudly (named, visible, counted in its own REFUSED bucket, never a pass)
#   on any baseline it cannot be satisfied against.
#
# Every anchor asserted count==1 before any byte is written.
import hashlib
import io
import os
import re
import sys

ROOT = '/Users/CanasBangin/Desktop/TheBig6V2'
GATE = os.path.join(ROOT, 'tests', 'gates', 'g197d_d84_base.js')
IDX = os.path.join(ROOT, 'index.html')

# ── independent recomputation of the pins, from the artifacts themselves ──────────────
CSB_A = 'function capSessionBudget(sections, cardio){'
CSB_B = '\nfunction capRegionalFatigue'


def slice_of(path):
    src = io.open(path, encoding='utf-8').read()
    i = src.find(CSB_A)
    assert i >= 0, 'capSessionBudget anchor missing in ' + path
    j = src.find(CSB_B, i)
    assert j >= 0, 'capSessionBudget end anchor missing in ' + path
    ver = re.search(r'<meta name="ia-version" content="(\d+)"', src)
    assert ver, 'ia-version missing in ' + path
    return int(ver.group(1)), hashlib.sha256(src[i:j].encode('utf-8')).hexdigest()


V198_VER, D85_DIGEST = slice_of(IDX)
V197_VER, PRE_A = slice_of('/tmp/base_V197.html')
V196_VER, PRE_B = slice_of('/tmp/base_V196.html')
assert V198_VER == 198, 'candidate is not V198: ' + str(V198_VER)
assert (V197_VER, V196_VER) == (197, 196), 'baselines are not V197/V196'
assert PRE_A == PRE_B, 'V196 and V197 disagree on capSessionBudget; the pre-D85 pin is not single-valued'
assert D85_DIGEST != PRE_A, 'candidate capSessionBudget equals the pre-D85 text; D85 did not land'
PRE_D85_DIGEST = PRE_A
print('pin  D85 (V198)  ' + D85_DIGEST)
print('pin  pre-D85     ' + PRE_D85_DIGEST + '  (V196 == V197)')

src = io.open(GATE, encoding='utf-8').read()
ORIG = src
EDITS = []


def rep(tag, old, new):
    EDITS.append((tag, old, new))


# 1 ── crypto, for the digest pin
rep('require-crypto',
    "const cp   = require('child_process');\n",
    "const cp   = require('child_process');\nconst crypto = require('crypto');\n")

# 2 ── header note: what E5 and E1h now claim
rep('header-note',
    "// Usage: node tests/gates/g197d_d84_base.js <candidate.html> [baseline.html]\n",
    "// BASELINE-AWARENESS (V198, tests only). Two of the five comparison assertions had a\n"
    "// premise that only held against one particular pair of artifacts, and both were found\n"
    "// by running the gate outside that pair:\n"
    "//   E1h ('Calves rises somewhere') is D84's own footprint. It is satisfiable ONLY against\n"
    "//   a pre-D84 baseline, and it FAILED when V197 was compared to itself. It is now\n"
    "//   baseline-version-aware. On a baseline it cannot be satisfied against it does not\n"
    "//   quietly skip — a no-op assertion is the vacuity defect this repo keeps paying for —\n"
    "//   it prints a named REFUSE line and is counted in the REFUSED bucket, which is NOT a\n"
    "//   pass and is printed beside the PASS/FAIL summary.\n"
    "//   E5 capSessionBudget was pinned to the baseline under the premise that D84 touched no\n"
    "//   budget machinery. D85 (V198) deliberately edits that function, so that comparison\n"
    "//   fails by construction. The confinement is RE-PINNED to the D85-licensed TEXT rather\n"
    "//   than deleted: deleting it is an unruled removal, and it is the one assertion in the\n"
    "//   suite that sees the D85 edit as an EDIT rather than as an outcome.\n"
    "//\n"
    "// Usage: node tests/gates/g197d_d84_base.js <candidate.html> [baseline.html]\n")

# 3 ── counters: a refusal is its own bucket, never a pass, never silent
rep('counters',
    "let pass = 0, fail = 0;\n"
    "function ok(name, cond, detail) {\n"
    "  if (cond) { pass++; console.log('ok   ' + name); }\n"
    "  else { fail++; console.log('FAIL ' + name + (detail !== undefined ? '  -> ' + detail : '')); }\n"
    "}\n",
    "let pass = 0, fail = 0, refused = 0;\n"
    "function ok(name, cond, detail) {\n"
    "  if (cond) { pass++; console.log('ok   ' + name); }\n"
    "  else { fail++; console.log('FAIL ' + name + (detail !== undefined ? '  -> ' + detail : '')); }\n"
    "}\n"
    "// A refusal is an assertion that COULD NOT BE PUT, announced by name. It is not a pass,\n"
    "// it is not silence, and it is echoed next to the summary so it cannot read as green.\n"
    "function refuse(name, why) { refused++; console.log('REFUSE ' + name + '  -> ' + why); }\n"
    "\n"
    "function iaVersion(src) {\n"
    "  const m = /<meta name=\"ia-version\" content=\"(\\d+)\"/.exec(String(src || ''));\n"
    "  return m ? parseInt(m[1], 10) : null;\n"
    "}\n")

# 4 ── summary: REFUSED printed beside PASS/FAIL, and gate.sh's `^PASS n FAIL n` still matches
rep('summary',
    "function done() { cleanup(); console.log('\\nPASS ' + pass + ' FAIL ' + fail); process.exit(fail ? 1 : 0); }\n",
    "function done() {\n"
    "  cleanup();\n"
    "  if (refused) console.log('\\nREFUSED ' + refused + ' assertion(s) — see the REFUSE lines above. A REFUSED assertion was NOT run and is NOT a pass.');\n"
    "  console.log('\\nPASS ' + pass + ' FAIL ' + fail);\n"
    "  process.exit(fail ? 1 : 0);\n"
    "}\n")

# 5 ── E1h: run the claim only on a baseline it can be satisfied against, refuse loudly otherwise
rep('e1h',
    "    ok('E1h vs ' + path.basename(BASE_HTML) + ': Calves rises somewhere', bRose > 0, bRose);\n",
    "    // E1h is D84's own footprint: Calves must appear on cells where the baseline had none.\n"
    "    // D84 shipped IN V197, so only a baseline built before it can show the rise. Against a\n"
    "    // V197-or-later baseline the claim is unsatisfiable by construction (it FAILED on\n"
    "    // V197-vs-itself) and the honest answer is a refusal, not a pass and not a skip.\n"
    "    const BV = iaVersion(fs.readFileSync(BASE_HTML, 'utf8'));\n"
    "    if (BV !== null && BV < 197) {\n"
    "      ok('E1h vs ' + path.basename(BASE_HTML) + ': Calves rises somewhere', bRose > 0, bRose);\n"
    "    } else {\n"
    "      refuse('E1h vs ' + path.basename(BASE_HTML) + ': Calves rises somewhere',\n"
    "        'NOT RUN: this claim needs a pre-D84 baseline (ia-version < 197); this baseline reads '\n"
    "        + (BV === null ? 'no ia-version meta' : 'ia-version ' + BV)\n"
    "        + '. D84 landed in V197, so a V197-or-later baseline already carries the rise and the claim '\n"
    "        + 'cannot be satisfied against it. Re-run with base_V196.html to put this assertion.');\n"
    "    }\n")

# 6 ── E5: capSessionBudget re-pinned to the D85 text; the other two stay on the baseline
rep('e5',
    "// byte-identity of the machinery D84 must not have touched, against the shipped baseline\n"
    "if (BASE_HTML) {\n"
    "  const B = fs.readFileSync(BASE_HTML, 'utf8');\n"
    "  const slice = (src, start, end) => { const a = src.indexOf(start); if (a < 0) return null;\n"
    "    const b = src.indexOf(end, a); return b < 0 ? null : src.slice(a, b); };\n"
    "  const PARTS = [\n"
    "    ['capSessionBudget', 'function capSessionBudget(sections, cardio){', '\\nfunction capRegionalFatigue'],\n"
    "    ['_itemCost',        'function _itemCost(it, sectionRegion){',       '\\n// ── RECOVERY-WEEK VOLUME DELOAD'],\n"
    "    ['_setCount',        'function _setCount(detail){',                  '\\nfunction _itemCost'],\n"
    "  ];\n"
    "  PARTS.forEach(([nm, a, b]) => {\n"
    "    const x = slice(RAW, a, b), y = slice(B, a, b);\n"
    "    ok('E5 ' + nm + ' is byte-identical to the baseline (D84 touched no budget machinery)',\n"
    "       !!x && !!y && x === y, x === null ? 'not found in candidate' : (y === null ? 'not found in baseline' : 'differs'));\n"
    "  });\n"
    "} else {\n"
    "  console.log('   -- E5 not run: no baseline argv[3]');\n"
    "}\n",
    "// ── E5: CONFINEMENT OF THE BUDGET MACHINERY. One claim, two mechanisms: nothing has\n"
    "// edited budget machinery since D85 without a ruling.\n"
    "//   capSessionBudget is PINNED TO ITS LICENSED TEXT by sha256. Until V198 it was pinned\n"
    "//   to the shipped baseline under D84's premise that no budget machinery moved; D85\n"
    "//   (V198) edits this function on purpose, so a baseline comparison now fails by\n"
    "//   construction. Re-pinning keeps the confinement instead of deleting it — a deletion\n"
    "//   would be an unruled removal, and this is the only assertion in the suite that sees\n"
    "//   the D85 edit as an EDIT rather than as an outcome. Narrowing E5 to _itemCost/\n"
    "//   _setCount was the other candidate mechanism and was REJECTED for the same reason:\n"
    "//   it would leave the function D85 actually touched with no confinement at all.\n"
    "//   _itemCost and _setCount are NOT D85's, so they keep the baseline byte comparison.\n"
    "if (BASE_HTML) {\n"
    "  const B = fs.readFileSync(BASE_HTML, 'utf8');\n"
    "  const slice = (src, start, end) => { const a = src.indexOf(start); if (a < 0) return null;\n"
    "    const b = src.indexOf(end, a); return b < 0 ? null : src.slice(a, b); };\n"
    "\n"
    "  // PROVENANCE OF THE PINS. sha256 of the bytes from `function capSessionBudget(sections,\n"
    "  // cardio){` up to (not including) `\\nfunction capRegionalFatigue`.\n"
    "  //   CSB_D85  — V198, the text LICENSED BY RULING D85: the {hinge, hip_ext} floor that\n"
    "  //              makes the day's last posterior chain item ineligible for the trim loop.\n"
    "  //   CSB_PRE  — the pre-D85 text. V196 and V197 carry it byte-for-byte identically, which\n"
    "  //              is why one digest covers both and why this gate still answers V197-vs-V196.\n"
    "  // A DIGEST IS REFRESHED ONLY BY A RULING. If this assertion fails, the question is not\n"
    "  // 'what is the new digest' — it is 'which ruling licensed that edit to the budget'.\n"
    "  const CSB_D85 = '" + D85_DIGEST + "';\n"
    "  const CSB_PRE = '" + PRE_D85_DIGEST + "';\n"
    "  const csb = slice(RAW, 'function capSessionBudget(sections, cardio){', '\\nfunction capRegionalFatigue');\n"
    "  const cv  = iaVersion(RAW);\n"
    "  const pre = cv !== null && cv < 198;           // a pre-D85 artifact is allowed the pre-D85 text\n"
    "  const want = pre ? CSB_PRE : CSB_D85;\n"
    "  const era  = pre ? 'pre-D85' : 'D85 (V198)';\n"
    "  const dig  = csb === null ? null : crypto.createHash('sha256').update(csb).digest('hex');\n"
    "  ok('E5 capSessionBudget is byte-for-byte the ' + era + ' licensed text '\n"
    "     + '(licensing ruling D85; nothing since D85 has edited budget machinery)',\n"
    "     dig !== null && dig === want,\n"
    "     dig === null ? 'not found in candidate'\n"
    "       : 'ia-version ' + cv + ' digest ' + dig.slice(0, 16) + ' != licensed ' + want.slice(0, 16)\n"
    "         + ' — capSessionBudget was edited; name the ruling');\n"
    "\n"
    "  const PARTS = [\n"
    "    ['_itemCost',        'function _itemCost(it, sectionRegion){',       '\\n// ── RECOVERY-WEEK VOLUME DELOAD'],\n"
    "    ['_setCount',        'function _setCount(detail){',                  '\\nfunction _itemCost'],\n"
    "  ];\n"
    "  PARTS.forEach(([nm, a, b]) => {\n"
    "    const x = slice(RAW, a, b), y = slice(B, a, b);\n"
    "    ok('E5 ' + nm + ' is byte-identical to the baseline (D85 owns the capSessionBudget trim loop and nothing else)',\n"
    "       !!x && !!y && x === y, x === null ? 'not found in candidate' : (y === null ? 'not found in baseline' : 'differs'));\n"
    "  });\n"
    "} else {\n"
    "  console.log('   -- E5 not run: no baseline argv[3]');\n"
    "}\n")

# ── assert every anchor exactly once BEFORE writing anything ─────────────────────────
missed = []
for tag, old, new in EDITS:
    n = src.count(old)
    print('anchor %-14s count=%d' % (tag, n))
    if n != 1:
        missed.append(tag + ' count=' + str(n))
if missed:
    sys.stderr.write('ABORT, no bytes written: ' + '; '.join(missed) + '\n')
    sys.exit(1)

for tag, old, new in EDITS:
    src = src.replace(old, new, 1)

assert src != ORIG
io.open(GATE, 'w', encoding='utf-8').write(src)
print('wrote ' + GATE)

# this script must not have touched the app
after = hashlib.sha256(io.open(IDX, 'rb').read()).hexdigest()
print('index.html sha256 ' + after + ' (untouched by this script)')
