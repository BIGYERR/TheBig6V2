#!/usr/bin/env python3
# V194 sabotage, M9 — proves the NEW B3 floor in tests/gates/g193_budget_floor.js still bites.
# B3 stopped asserting "prehab grew this release" (a change-detector that failed every version
# whose prehab merely held) and now asserts "prehab never regresses below the V192 census".
# A floor with no mutation underneath it is a claim nobody has tested, so this mutation walks
# the artifact under the floor: buildHipSection draws 2 glute-med drills + 1 mobility piece by
# doctrine ("a leg day can never come up all-stretches with zero abductor work"), and the
# mutation drops it to 1 + 1. The hip section carries hip:true, which is exactly what the gate
# counts as prehab, so the aggregate falls 23,819 -> 20,687 wide and 2,760 -> 2,400 narrow and
# B3 fails BY NAME on both lattices, per tier and in aggregate. No other B claim moves: the
# section still renders two items, so B2 stays green and the mutation targets one gate.
# Does NOT touch index.html. The eight existing mutations are untouched.
import json, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TARGET = os.path.join(ROOT, 'sabotage', 'v194.json')
INDEX  = os.path.join(os.path.dirname(ROOT), 'index.html')

src = open(TARGET, encoding='utf-8').read()
before = json.loads(src)

ANCHOR = """  "gate": "gates/g194_implement_and_range.js"
 }
]"""
NEW = """  "gate": "gates/g194_implement_and_range.js"
 },
 {
  "name": "M9 -> g193_budget_floor B3: the hip stability draw is cut from two glute-med drills to one, so every leg day loses a prehab item and the prehab aggregate falls under the V192 census floor",
  "anchor": "const stab=pick(stabPool,2,seed);",
  "replacement": "const stab=pick(stabPool,1,seed);",
  "gate": "gates/g193_budget_floor.js"
 }
]"""

n = src.count(ANCHOR)
print('anchor 1 count=%d' % n)
if n != 1:
    print('ABORT: anchor matched %d times, expected 1. Nothing written.' % n); sys.exit(1)

# the mutation anchor must itself be count==1 in the artifact, or the runner reports NOT-APPLIED
mut_anchor = 'const stab=pick(stabPool,2,seed);'
m = open(INDEX, encoding='utf-8').read().count(mut_anchor)
print('mutation anchor count in index.html=%d' % m)
if m != 1:
    print('ABORT: mutation anchor is not unique in the artifact.'); sys.exit(1)

out = src.replace(ANCHOR, NEW)
after = json.loads(out)
if len(after) != len(before) + 1:
    print('ABORT: mutation count went %d -> %d' % (len(before), len(after))); sys.exit(1)
if after[:len(before)] != before:
    print('ABORT: an existing mutation changed.'); sys.exit(1)
open(TARGET, 'w', encoding='utf-8').write(out)
print('wrote %s (%d -> %d mutations)' % (TARGET, len(before), len(after)))
