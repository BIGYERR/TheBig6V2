#!/usr/bin/env python3
# V219 slice 1 of 4 — D167 CFs + D171 (coach, amended):
#   D167: "the adjacent-day pairs walk the week the athlete sees." _adjDayPairs pairs Mon..Sun plus
#   W sun -> W+1 mon, walked in calendar order, each pair keeping the seed index its A day holds today.
#   D171: hotNext and hotNextHingeClampSweep read Sunday-first too (final-week RPE text only).
# Lifted VERBATIM from tests/measure/v219_chain_rebaseline.js STEPS[0] (ADJ_OLD/ADJ_CFS, SEED_OLD/SEED_S,
# HN1_OLD/HN1_NEW, HN2_OLD/HN2_NEW). Oracle: result is byte-identical to /tmp/v219_cf_step1.html.
# Anchors counted sequentially on the progressive source, exactly as measure's apply() does.
# No gate, no sabotage, no version bump in this slice.
import sys
P = '/Users/CanasBangin/Desktop/TheBig6V2/index.html'
src = open(P, encoding='utf-8').read()

EDITS = [
  # A0 ADJ: _adjDayPairs walks _ISO_ORDER (Mon..Sun) and bridges W sun -> W+1 mon; 5th element is the seed index.
  ("    for(let i=1;i<ALL_DAYS_ORDER.length;i++) out.push([w,ALL_DAYS_ORDER[i-1],w,ALL_DAYS_ORDER[i]]);\n    if(w<totalWeeks) out.push([w,'sat',w+1,'sun']);",
   "    for(let i=1;i<_ISO_ORDER.length;i++) out.push([w,_ISO_ORDER[i-1],w,_ISO_ORDER[i],(w-1)*7+(i<6?i:0)]);\n    if(w<totalWeeks) out.push([w,'sun',w+1,'mon',(w-1)*7+6]);"),
  # A1 SEED: the rename draw reads the pair's carried seed index.
  ("seededRand(seed+wB*97+pi*13+ii)",
   "seededRand(seed+wB*97+(pair.length>4?pair[4]:pi)*13+ii)"),
  # A2 HN1: hotNext reads Sunday-first.
  ("      const _di=ALL_DAYS_ORDER.indexOf(d);\n      const _nw=_di===ALL_DAYS_ORDER.length-1?w+1:w, _ndk=ALL_DAYS_ORDER[(_di+1)%7];",
   "      const _di=_ISO_ORDER.indexOf(d);\n      const _nw=_di===_ISO_ORDER.length-1?w+1:w, _ndk=_ISO_ORDER[(_di+1)%7];"),
  # A3 HN2: hotNextHingeClampSweep reads Sunday-first.
  ("      const _di=ALL_DAYS_ORDER.indexOf(d);\n      const _nw=_di===_last?(+w+1):+w, _ndk=ALL_DAYS_ORDER[(_di+1)%7];",
   "      const _di=_ISO_ORDER.indexOf(d);\n      const _nw=_di===_last?(+w+1):+w, _ndk=_ISO_ORDER[(_di+1)%7];"),
]

for i, (a, b) in enumerate(EDITS):
    n = src.count(a)
    print('anchor A%d count %d :: %r' % (i, n, a[:70]))
    if n != 1:
        print('ABORT: anchor A%d count %d' % (i, n)); sys.exit(2)
    src = src.replace(a, b, 1)
if src.count("out.push([w,'sat',w+1,'sun'])") != 0 or src.count("seededRand(seed+wB*97+pi*13+ii)") != 0 \
   or src.count("ALL_DAYS_ORDER[(_di+1)%7]") != 0:
    print('ABORT: post-condition'); sys.exit(3)
open(P, 'w', encoding='utf-8').write(src)
print('written')
