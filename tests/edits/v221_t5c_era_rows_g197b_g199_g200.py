#!/usr/bin/env python3
# V221 slice T5c: era rows for V221 in three test files only. index.html is NOT touched,
# so there is no version meta bump in this script (that is the index.html slice's last line).
#
# V221 ships D177 (P-SWAPFLOOR), D178 (P-ACTIVE), D179 (P-DONENAV), D180 (P-BLOCKOPEN).
# D177 widens the _REP_FLOOR balance row [6,10] to Landmine reverse lunge and Landmine
# rotational press (read by scheme() and _swapDetailFor(), no draw); 0 engine cards change (measure 0/1,201,231;
# builder 0/903,969). D178, D179, D180 are zero-engine. Gatekeeper pre-flight (2026-09-24)
# printed on the V221 candidate: DELOAD_ARB 264/0/19; DELOAD_HINGE 12369/9319/44/1275; E6 28;
# SWAP 138; HF_LEAK 0 {}. Every row below is the house alias [221] = [220], ruled UNMOVED.
#
# Every anchor is asserted count==1 across ALL files before ANY file is written; the first
# miss aborts the whole script with nothing written. A [221] row already present aborts too.
import sys, os

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
G = os.path.join(ROOT, 'tests', 'gates')

CITE = ('V221 (D177/D178/D179/D180): ruled UNMOVED (D177 widens the _REP_FLOOR balance row [6,10] to the two '
        'loaded landmine lifts, read by scheme() and _swapDetailFor(), no draw, and moves 0 engine cards, 0/1,201,231 printed by measure and 0/903,969 by builder; '
        'D178, D179 and D180 are zero-engine')

EDITS = [
    # 1. g197b HF_LEAK
    ('g197b_sweep.js',
     "HF_LEAK_BY_VERSION[220] = HF_LEAK_BY_VERSION[219];   // V220 (D173/D174/D175/D176): ruled UNMOVED (zero-engine build: display, copy and pop-up only; no hunk reaches buildProgram or anything it calls; the [219] 0/0 carries)\n",
     "HF_LEAK_BY_VERSION[221] = HF_LEAK_BY_VERSION[220];   // " + CITE + "; 0 {} printed by gatekeeper pre-flight on the V221 candidate; the [220] 0/0 carries)\n"),
    # 2. g197b B5C
    ('g197b_sweep.js',
     "B5C_BY_VERSION[220] = B5C_BY_VERSION[219];   // V220 (D173/D174/D175/D176): ruled UNMOVED (zero-engine build: display, copy and pop-up only; no hunk reaches buildProgram or anything it calls; the [219] 0 carries)\n",
     "B5C_BY_VERSION[221] = B5C_BY_VERSION[220];   // " + CITE + "; the [220] 0 carries)\n"),
    # 3. g199 DELOAD_ARB / E6 / DELOAD_HINGE (three contiguous [220] lines, one edit)
    ('g199_deload_arbitration.js',
     "DELOAD_HINGE_BY_VERSION[220] = DELOAD_HINGE_BY_VERSION[219];   // V220 (D173/D174/D175/D176): ruled UNMOVED (zero-engine build: display, copy and pop-up only; no hunk reaches buildProgram or anything it calls; E1a 12369 E1b 9319 E3 44 G1 1275 G5 44 carry)\n",
     "DELOAD_ARB_BY_VERSION[221] = DELOAD_ARB_BY_VERSION[220];   // " + CITE + "; C1 264 C5 0 D2 19 printed by gatekeeper pre-flight on the V221 candidate; C1 264 C3 264 C5 0 D2 19 I3 18 carry)\n"
     "E6_BY_VERSION[221] = E6_BY_VERSION[220];   // " + CITE + "; 28 printed by gatekeeper pre-flight on the V221 candidate; E6 28 carries)\n"
     "DELOAD_HINGE_BY_VERSION[221] = DELOAD_HINGE_BY_VERSION[220];   // " + CITE + "; E1a 12369 E1b 9319 E3 44 G1 1275 printed by gatekeeper pre-flight on the V221 candidate; E1a 12369 E1b 9319 E3 44 G1 1275 G5 44 carry)\n"),
    # 4. g200 SWAP (the D166 positive-limb census: Pull superset B holding a Kettlebell swing at p1)
    ('g200_pull_arbitration.js',
     "SWAP_BY_VERSION[220] = SWAP_BY_VERSION[219];   // V220 (D173/D174/D175/D176): ruled UNMOVED (zero-engine build: display, copy and pop-up only; no hunk reaches buildProgram or the pull-day swap draw, so the p1 population stays 138)\n",
     "SWAP_BY_VERSION[221] = SWAP_BY_VERSION[220];   // " + CITE + "; the rep floor sets reps, not which item Pull superset B holds at p1; 138 printed by gatekeeper pre-flight on the V221 candidate, so the p1 population stays 138)\n"),
]

# The contiguous-block precondition for edit 3: the three [220] lines sit together, in order.
G199_BLOCK = (
    "DELOAD_ARB_BY_VERSION[220] = DELOAD_ARB_BY_VERSION[219];   // V220 (D173/D174/D175/D176): ruled UNMOVED (zero-engine build: display, copy and pop-up only; no hunk reaches buildProgram or anything it calls; C1 264 C3 264 C5 0 D2 19 I3 18 carry)\n"
    "E6_BY_VERSION[220] = E6_BY_VERSION[219];   // V220 (D173/D174/D175/D176): ruled UNMOVED (zero-engine build: display, copy and pop-up only; no hunk reaches buildProgram or anything it calls; E6 28 carries)\n"
    "DELOAD_HINGE_BY_VERSION[220] = DELOAD_HINGE_BY_VERSION[219];   // V220 (D173/D174/D175/D176): ruled UNMOVED (zero-engine build: display, copy and pop-up only; no hunk reaches buildProgram or anything it calls; E1a 12369 E1b 9319 E3 44 G1 1275 G5 44 carry)\n"
)

def die(msg):
    print('ABORT: ' + msg + ' (nothing written)')
    sys.exit(1)

texts = {}
for fn in sorted(set(e[0] for e in EDITS)):
    with open(os.path.join(G, fn), 'rb') as fh:
        texts[fn] = fh.read().decode('utf-8')

# Pre-flight: no [221] row exists yet in any table this slice owns.
for fn, pat in [('g197b_sweep.js', 'HF_LEAK_BY_VERSION[221]'), ('g197b_sweep.js', 'B5C_BY_VERSION[221]'),
                ('g199_deload_arbitration.js', 'DELOAD_ARB_BY_VERSION[221]'),
                ('g199_deload_arbitration.js', 'E6_BY_VERSION[221]'),
                ('g199_deload_arbitration.js', 'DELOAD_HINGE_BY_VERSION[221]'),
                ('g200_pull_arbitration.js', 'SWAP_BY_VERSION[221]')]:
    n = texts[fn].count(pat)
    print('precheck %-28s %-30s count=%d (want 0)' % (fn, pat, n))
    if n != 0: die('%s already has %s' % (fn, pat))

n = texts['g199_deload_arbitration.js'].count(G199_BLOCK)
print('precheck %-28s %-30s count=%d (want 1)' % ('g199_deload_arbitration.js', '[220] three-line block', n))
if n != 1: die('g199 [220] rows are not one contiguous block')

# Assert every anchor count==1 before any replacement.
for i, (fn, old, new) in enumerate(EDITS, 1):
    n = texts[fn].count(old)
    print('anchor %d %-28s count=%d (want 1)' % (i, fn, n))
    if n != 1: die('anchor %d in %s count=%d' % (i, fn, n))

for i, (fn, old, new) in enumerate(EDITS, 1):
    texts[fn] = texts[fn].replace(old, old + new, 1)
    n = texts[fn].count(old + new)
    if n != 1: die('post-replace check %d in %s count=%d' % (i, fn, n))

for fn, t in texts.items():
    with open(os.path.join(G, fn), 'wb') as fh:
        fh.write(t.encode('utf-8'))
    print('wrote ' + fn)
print('OK: 4 edits, 6 rows')
