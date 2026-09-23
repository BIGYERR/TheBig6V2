#!/usr/bin/env python3
# V209 slice 2 — D140 finding 1 (coach-ruled): tier B's "no power" reaches the core header.
# A core section is label '' with its pillar name in coreHeader ('Core — Rotational Power'), so F1's
# label test never saw it: 176 of 2,220 tier B long-run days kept a Rotational Power core section
# (g209 lattice, V209 slice 1). On tier B long-run days (both limbs) the core section whose
# coreHeader matches /power|explosive/ is dropped WHOLE and NOT refilled (a Rotational Power
# header over a plank is the incomplete-superset shape). Other core pillars stay. Tier A already
# drops every section; tier C is untouched.
# One edit, anchor asserted count==1; the first miss aborts and nothing is written. No bump.
import sys, pathlib

P = pathlib.Path('/Users/CanasBangin/Desktop/TheBig6V2/index.html')
src = P.read_text(encoding='utf-8')

OLD = "        secs=secs.filter(sec=>!/power|explosive/i.test(sec.label||''));   // D140 (V209) F1: an explosive finisher is power work\n"
NEW = (OLD +
       "        // D140 (V209, coach): \"no power\" reaches the core header too. A core section is label ''\n"
       "        // with its pillar in coreHeader; a Rotational Power pillar goes whole and is not refilled\n"
       "        // (a power header over a plank is the incomplete-superset shape). Other pillars stay.\n"
       "        secs=secs.filter(sec=>!/power|explosive/i.test(sec.coreHeader||''));\n")

n = src.count(OLD)
if n != 1:
    print('ABORT: anchor count %d (want 1): %r' % (n, OLD[:80])); sys.exit(1)
P.write_text(src.replace(OLD, NEW, 1), encoding='utf-8')
print('wrote index.html (1 edit: tier B core-header power drop)')
