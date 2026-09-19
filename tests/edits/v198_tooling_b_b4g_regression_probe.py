#!/usr/bin/env python3
# V198 TOOLING PASS, slice B of 3 — THE PROOF THAT B4g CAN STILL FAIL.
#
# THIS SCRIPT NEVER WRITES index.html. It reads index.html and writes a MUTANT to a temp
# path given on argv[1]. It is kept because a bar re-expressed from a strict ratchet to a
# ceiling reads as coverage unless someone shows the ceiling can be crossed.
#
# THE MUTATION. capSessionBudget's cap is cut to 55% of SESSION_SET_BUDGET with the floor
# dropped 12 -> 6. A tighter budget has to delete more, and once the higher trim ranks are
# exhausted it reaches the leg compounds — which is precisely the regression D81's positive
# claim exists to forbid. It is a genuine behavioural regression, not a string edit to the
# gate's own oracle.
#
# MEASURED 2026-09-18, 288-cell WIDE lattice:
#   live V198            Leg superset A  394 + Leg superset B   0 =  394   B4g ok  (<= 896)
#   mutant               Leg superset A 1488 + Leg superset B   0 = 1488   B4g FAIL (+592)
# With no baseline (the sabotage.py shape) the mutant trips B4g by name on the pinned
# ceiling alone. With /tmp/base_V197.html it trips B4g AND B4g1.
#
#   python3 tests/edits/v198_tooling_b_b4g_regression_probe.py /tmp/mut_b4g.html
#   node tests/gates/g193_budget_floor.js /tmp/mut_b4g.html                        # B4g FAIL
#   node tests/gates/g193_budget_floor.js /tmp/mut_b4g.html /tmp/base_V197.html    # B4g + B4g1 FAIL
import io, sys

if len(sys.argv) < 2:
    sys.stderr.write('usage: %s <out-mutant.html>   (never index.html)\n' % sys.argv[0])
    sys.exit(2)
OUT = sys.argv[1]
if OUT.endswith('index.html'):
    sys.stderr.write('REFUSING: this probe writes a mutant to a temp path, never index.html.\n')
    sys.exit(2)

src = io.open('index.html', encoding='utf-8').read()
old = "  const cap=Math.max(12, SESSION_SET_BUDGET - Math.round(_cardioInterference(cardio)*2));"
new = "  const cap=Math.max(6, Math.round(SESSION_SET_BUDGET*0.55) - Math.round(_cardioInterference(cardio)*2));"
n = src.count(old)
print('  count=%d  capSessionBudget cap anchor' % n)
if n != 1:
    sys.stderr.write('ANCHOR MISS (%d occurrences, wanted 1). ABORT: nothing written.\n' % n)
    sys.exit(1)
io.open(OUT, 'w', encoding='utf-8').write(src.replace(old, new, 1))
print('WROTE MUTANT %s (index.html untouched)' % OUT)
