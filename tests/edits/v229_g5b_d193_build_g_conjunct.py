#!/usr/bin/env python3
# v229_g5b_d193_build_g_conjunct.py — V229 gate slice g5b: one edit to tests/gates/g229_d193_build.js, row (g).
# Session decision (V229 chat, coordinator, recorded not re-ruled): row (g) stays D193's coupling-guard invariant
# (D193 original gate claims "(g) Coupling guards ...", g228's g-COUPLE precedent) and gains one V229 conjunct, a true
# claim about V229's new text: the add path refuses R7's held-test prose (D193 R6, "`_addRxKind` keeps refusing
# 'hold'"), typed R7 text on a held loaded name (Leg press: squat, held under knee/wa, floor [5,8]) -> null; plus
# INJ_HELD_TEST read off the artifact equals the typed text, the conjunct that fails on V228 where the constant is
# absent (D194: "each asserted row fails on V228 ... or carries a conjunct that does"). A throwing eval fails the row.
# No index.html edit. Refuses unless the gate is the file g5 wrote and index.html is the V229 candidate.
# Literal bytes (real em-dashes, ×); every anchor asserted count==1 before anything is written; abort on the first miss.
import hashlib, os, sys
ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
GATE = os.path.join(ROOT, 'tests', 'gates', 'g229_d193_build.js')
ART = os.path.join(ROOT, 'index.html')
GATE_SHA = 'e3e1f9840253a46098db7756e7c09cdbbb18eb89bee967ee3f8ec6099ed7458d'   # as written by v229_g5_d193_build_gate.py
ART_SHA12 = 'd854af0a91f8'
sha = lambda p: hashlib.sha256(open(p, 'rb').read()).hexdigest()
if sha(GATE) != GATE_SHA: sys.exit('REFUSED: gate sha ' + sha(GATE)[:12] + ' is not the g5 file ' + GATE_SHA[:12])
if sha(ART)[:12] != ART_SHA12: sys.exit('REFUSED: index.html sha ' + sha(ART)[:12] + ' is not ' + ART_SHA12)
s = open(GATE, encoding='utf-8').read()
EDITS = [
  ('header: discrimination sentence names g among the rows that fail',
   "//   on any other file. gate.sh never sets it. Run on V228 that way every row but g FAILS at its V228 figure (printed\n",
   "//   on any other file. gate.sh never sets it. Run on V228 that way every row FAILS at its V228 figure (printed\n"),
  ('header: g on V228',
   "//   of 30. g is the invariant pair: it PASSES on V228 (as g228's g-COUPLE did on V227), it carries no V229 conjunct.\n",
   "//   of 30; g INJ_HELD_TEST absent (its coupling invariants hold on V228 as g228's g-COUPLE did on V227; the V229\n"
   "//   conjunct is the one that fails).\n"),
  ('header: ROWS g',
   "//              \"… Same job, same numbers.\".\n//   h          H:",
   "//              \"… Same job, same numbers.\". V229 conjunct (session decision; D193 R6 \"`_addRxKind` keeps refusing\n"
   "//              'hold'\" on V229's new text, and D194's \"each asserted row fails on V228 … or carries a conjunct that\n"
   "//              does\"): _addRxKind(R7_T typed, 'Leg press') is null (squat, held under knee/wa, loaded), and\n"
   "//              INJ_HELD_TEST read off the artifact equals R7_T (absent on V228: the eval throws, the row fails by name).\n"
   "//   h          H:"),
  ('R.g label',
   "  g:   'row g         coupling guards: _addRxKind refuses a cued detail; 0 power cards cued; a loaded-to-loaded swap carries the donor verbatim live and at boot (fixture presentation)',\n",
   "  g:   'row g         coupling guards (D193 R6): _addRxKind refuses a cued detail and R7\\'s held-test prose, and INJ_HELD_TEST is R7\\'s typed text (the conjunct that fails on V228, D194); 0 power cards cued; a loaded-to-loaded swap carries the donor verbatim live and at boot (fixture presentation)',\n"),
  ('g: the V229 conjunct after the fence',
   "  const fenceOK = kinds.every(k => k === null) && bare !== null && bare !== undefined;\n",
   "  const fenceOK = kinds.every(k => k === null) && bare !== null && bare !== undefined;\n"
   "  // V229 conjunct (session decision): D193 R6 on V229's new text. The add path refuses R7's held-test prose (typed\n"
   "  // R7_T on Leg press, squat, held under knee/wa, loaded), and the artifact's INJ_HELD_TEST is that text, which is\n"
   "  // the conjunct that fails on V228 (the constant is absent there; a throwing eval fails the row by name).\n"
   "  const ADD_TO = 'Leg press', ADD_TO_PAT = 'squat'; let r7Kind = 'THREW', r7Lit = null; const r7Err = [];\n"
   "  try { r7Kind = E(X, '_addRxKind(' + JSON.stringify(R7_T) + ',' + JSON.stringify(ADD_TO) + ')'); } catch(e){ r7Err.push('_addRxKind threw: ' + String(e && e.message || e).slice(0, 80)); }\n"
   "  try { r7Lit = E(X, 'INJ_HELD_TEST'); } catch(e){ r7Lit = null; r7Err.push('INJ_HELD_TEST threw: ' + String(e && e.message || e).slice(0, 80)); }\n"
   "  const addPatOK = (E(X, '_pattern(' + JSON.stringify(ADD_TO) + ')') || null) === ADD_TO_PAT && CAP_KNEE.includes(ADD_TO_PAT);\n"
   "  const heldAddOK = r7Kind === null && r7Lit === R7_T && addPatOK;\n"),
  ('g: allOK carries the conjunct',
   "  const res = []; let allOK = fenceOK && patOK && PW.pw > 0 && PW.cued === 0;\n",
   "  const res = []; let allOK = fenceOK && heldAddOK && patOK && PW.pw > 0 && PW.cued === 0;\n"),
  ('g: print the conjunct',
   "  PW.bad.forEach(s => console.log('      cued power: ' + s)); res.forEach(s => console.log('      ' + s));\n",
   "  console.log('    g V229 conjunct: _addRxKind(R7 typed, ' + JSON.stringify(ADD_TO) + ') ' + JSON.stringify(r7Kind) + ' (want null; ' + ADD_TO + ' is ' + ADD_TO_PAT + ', held under knee/wa: ' + addPatOK + ') | INJ_HELD_TEST ' + (r7Lit === R7_T ? '== R7 typed' : JSON.stringify(r7Lit)) + (r7Err.length ? ' | ' + r7Err.join('; ') : ''));\n"
   "  PW.bad.forEach(s => console.log('      cued power: ' + s)); res.forEach(s => console.log('      ' + s));\n"),
  ('g: the ok detail names the conjunct',
   "  ok(R.g, allOK, 'fence ' + (fenceOK ? 'holds' : 'BROKEN') + ', power cued '",
   "  ok(R.g, allOK, 'fence ' + (fenceOK ? 'holds' : 'BROKEN') + ', R7 prose ' + (r7Kind === null ? 'refused' : 'NOT refused (' + JSON.stringify(r7Kind) + ')') + ', INJ_HELD_TEST ' + (r7Lit === R7_T ? 'as typed' : r7Lit === null ? 'ABSENT' : 'NOT as typed') + ', power cued '"),
]
for name, a, b in EDITS:
    n = s.count(a)
    if n != 1: sys.exit('ABORT: anchor [' + name + '] count ' + str(n) + ' (want 1); nothing written')
for name, a, b in EDITS:
    s = s.replace(a, b)
    print('applied [' + name + ']')
with open(GATE, 'w', encoding='utf-8', newline='\n') as f:
    f.write(s)
print('wrote ' + GATE + ' sha ' + sha(GATE)[:12])
