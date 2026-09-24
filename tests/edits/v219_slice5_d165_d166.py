#!/usr/bin/env python3
# V219 slice 5 — D165 cf165b + D166 cf166c (coach).
#   D165: "the lunge draw echoes a step-up Main." Redraw only on collision at the lunge draw; the unilateral
#   slot must differ from the Main.
#   D166: "Pull superset B echoes a swing Main." When cond[2] is the Main, Pull superset B prints the row alone,
#   no substitute.
# Lifted VERBATIM from tests/measure/v219_chain_rebaseline.js: step 6 (A165 -> R165b), then step 7 (A166r -> R166c).
# Anchors counted on the source as it changes.
# Oracles: after step 6 the source is byte-identical to /tmp/v219_cf_step6.html (checked in-script, and the
# mid-state is written to MID for a shell cmp); at the end, to /tmp/v219_cf_step7.html.
# No gate, no sabotage, no version bump in this slice.
import sys
P = '/Users/CanasBangin/Desktop/TheBig6V2/index.html'
MID = '/private/tmp/claude-501/-Users-CanasBangin-Desktop-TheBig6V2/8106852f-6c88-416e-bbf7-c3c836cdf7ed/scratchpad/v219_slice5_mid.html'
ORACLE6 = '/tmp/v219_cf_step6.html'
src = open(P, encoding='utf-8').read()

STEP6 = [
  # A0 D165 cf165b: on a collision with the Main, the lunge slot is redrawn from the pool without it.
  ("    const lungeSel = _slot(lungePool,2,bs+7,'lower');",
   "    let lungeSel = _slot(lungePool,2,bs+7,'lower'); if(lungeSel[0]===squatSel) lungeSel=pick(lungePool.filter(n=>n!==squatSel),2,bs+7);"),
]
STEP7 = [
  # A1 D166 cf166c: when cond[2] is the Main, Pull superset B prints the row alone.
  ("          {name:ex.cond[2],detail:vsets(3)+'×10'}]});",
   "          ...(ex.cond[2]===ex.backMain?[]:[{name:ex.cond[2],detail:vsets(3)+'×10'}])]});"),
]

def apply(s, pairs, base):
    for i, (a, b) in enumerate(pairs):
        n = s.count(a)
        print('anchor A%d count %d :: %r' % (base + i, n, a[:70]))
        if n != 1:
            print('ABORT: anchor A%d count %d' % (base + i, n)); sys.exit(2)
        s = s.replace(a, b, 1)
    return s

src = apply(src, STEP6, 0)
open(MID, 'w', encoding='utf-8').write(src)
if src != open(ORACLE6, encoding='utf-8').read():
    print('ABORT: mid-state differs from ' + ORACLE6); sys.exit(4)
print('mid-state == ' + ORACLE6)
src = apply(src, STEP7, 1)
if src.count(STEP6[0][1]) != 1 or src.count(STEP7[0][1]) != 1:
    print('ABORT: post-condition'); sys.exit(3)
open(P, 'w', encoding='utf-8').write(src)
print('written')
