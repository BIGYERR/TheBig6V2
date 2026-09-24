#!/usr/bin/env python3
# V217 slice 1 — D160 CFb (coach): the adjacent-day dedupe reads the previous day as it will ship
# past d18LongRunDayPass. The dedupe stays where it is (before D18); per pair, the trigger set inA
# is read from D18 applied to a deep copy of the previous day as it currently stands, so the
# dedupe's own earlier renames are seen and the live week is never mutated. Mirrors measure's
# CFb surgery (tests/measure/v217_d160_dedupe_order.js line 38) as a named helper.
# No version bump in this slice (Mario owns the bump; brief says do not bump).
import sys
P = '/Users/CanasBangin/Desktop/TheBig6V2/index.html'
src = open(P, encoding='utf-8').read()

EDITS = [
  # E1a: the helper, placed directly above the dedupe that calls it.
  ("function deconflictAdjacentDupes(weeks, cfg, seed, totalWeeks){\n",
   "// V217 (D160): the previous day as it will ship past d18LongRunDayPass, read off a deep copy — the live week is never touched.\n"
   "function _d18View(A, wA, dA){\n"
   "  if(!A) return A;\n"
   "  const o={}; o[wA]={}; o[wA][dA]=JSON.parse(JSON.stringify(A));\n"
   "  d18LongRunDayPass(o);\n"
   "  return o[wA][dA];\n"
   "}\n"
   "function deconflictAdjacentDupes(weeks, cfg, seed, totalWeeks){\n"),
  # E1b: the trigger set reads the D18 view of the previous day.
  ("    const inA=nameSet(A);\n",
   "    const inA=nameSet(_d18View(A, wA, dA));   // V217 (D160): a name D18 strips from A is not yesterday's work\n"),
]

for i, (a, b) in enumerate(EDITS):
    n = src.count(a)
    if n != 1:
        print('ABORT: anchor %d count %d: %r' % (i, n, a[:80])); sys.exit(2)
for i, (a, b) in enumerate(EDITS):
    src = src.replace(a, b, 1)
    print('applied E1%s' % 'ab'[i])
if src.count('function _d18View(') != 1 or src.count('nameSet(_d18View(A, wA, dA))') != 1:
    print('ABORT: post-condition'); sys.exit(3)
open(P, 'w', encoding='utf-8').write(src)
print('written')
