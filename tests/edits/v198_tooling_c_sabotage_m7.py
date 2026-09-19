#!/usr/bin/env python3
"""V198 tooling pass, slice C, edit 3. TESTS ONLY — index.html is NOT written.

Adds M7 to tests/sabotage/v198.json: the mutation that pairs with moving the E5
digest pin outside g197d_d84_base's baseline branch. Coverage that is assumed is not
coverage, so the move ships with the mutation that proves it.

WHY v198.json AND NOT v199.json. Mario's instruction named it a v199 mutation. The
repo's convention is that tests/sabotage/<vNNN>.json holds the mutations that guard
the claims SHIPPED IN VERSION NNN, and every spec in the directory is named for a
version that exists (v190..v198). No V199 exists, ia-version stays 198 on this pass,
and the claim M7 guards is D85's licensed capSessionBudget text — which shipped in
V198 and whose other five mutations (M1..M6) already live in v198.json. Putting M7
anywhere else would split one ruling's mutations across two files and create a spec
named for a version with no artifact behind it. So: v198.json, as M7.

THE MUTATION IS COMMENT-ONLY. It rewrites D85's own <=1 rationale inside
capSessionBudget to claim the floor is a tunable, changing zero behaviour. That is the
strongest available proof of the pair: E5 is a sha256 of the function's licensed TEXT,
so it must see an EDIT rather than an outcome, and it must see it with NO baseline
because sabotage.py runs `node <gate> mutated.html` with no argv[3]. No outcome-based
gate in the suite can trip on this mutation at all.
"""
import json, pathlib, sys

ROOT = pathlib.Path('/Users/CanasBangin/Desktop/TheBig6V2')
APP  = ROOT / 'index.html'
SPEC = ROOT / 'tests' / 'sabotage' / 'v198.json'

ANCHOR = "  // <=1 IS NOT A TUNING CONSTANT. It is the boundary between nonempty and empty, the"
REPLACE = "  // <=1 IS A TUNING CONSTANT. Raise it whenever a leg day reads light; the floor is a"

app = APP.read_text(encoding='utf-8')
n = app.count(ANCHOR)
if n != 1:
    sys.stderr.write('ABORT: mutation anchor count==%d in index.html, expected 1\n' % n); sys.exit(1)
if app.count(REPLACE) != 0:
    sys.stderr.write('ABORT: replacement text already present in index.html\n'); sys.exit(1)
# the mutation must be comment-only: prove the anchor line is a comment and the
# replacement is the same shape, so the mutant is byte-different and behaviour-identical.
if not ANCHOR.lstrip().startswith('//') or not REPLACE.lstrip().startswith('//'):
    sys.stderr.write('ABORT: mutation is not comment-only\n'); sys.exit(1)

M7 = {
  "name": "M7 -> D85's <=1 rationale is rewritten IN COMMENT to call the posterior floor a tunable, licensing a raise nobody ruled. Comment-only: behaviour is byte-identical, so only an assertion that reads capSessionBudget's licensed TEXT can see it",
  "anchor": ANCHOR,
  "replacement": REPLACE,
  "gate": "gates/g197d_d84_base.js",
  "note": "E5 capSessionBudget digest pin is the named trip, and this is the FIRST mutation ever to reach g197d_d84_base: until V198's tooling pass every app-grading assertion in that file sat behind if (BASE_HTML) and sabotage.py passes no argv[3], so the file printed PASS 1 FAIL 0 and graded nothing. E5 is a sha256 of the function's D85-licensed slice and needs no baseline, so it now runs on every invocation. Comment-only by design: no outcome gate in the suite can see this edit, which is exactly the point - E5 is the one assertion that sees an EDIT to the budget rather than an outcome of it."
}

raw = SPEC.read_text(encoding='utf-8')
TAIL = 'which is why the transcribed V197 off-licence table had to exist for sabotage to reach this claim at all."\n  }\n]\n'
if raw.count(TAIL) != 1:
    sys.stderr.write('ABORT: spec tail anchor count==%d, expected 1\n' % raw.count(TAIL)); sys.exit(1)

block = json.dumps(M7, indent=2, ensure_ascii=False)
block = '\n'.join('  ' + ln for ln in block.split('\n'))
new_tail = TAIL[:-len('  }\n]\n')] + '  },\n' + block + '\n]\n'
out = raw.replace(TAIL, new_tail, 1)

parsed = json.loads(out)
names = [m['name'].split(' ')[0] for m in parsed]
if names != ['M1','M2','M3','M4','M5','M6','M7']:
    sys.stderr.write('ABORT: spec rows are %r\n' % names); sys.exit(1)
if parsed[-1]['anchor'] != ANCHOR or parsed[-1]['gate'] != 'gates/g197d_d84_base.js':
    sys.stderr.write('ABORT: M7 did not round-trip\n'); sys.exit(1)
SPEC.write_text(out, encoding='utf-8')
print('wrote %s  (%d rows, M7 -> %s)' % (SPEC, len(parsed), parsed[-1]['gate']))
