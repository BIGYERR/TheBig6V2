#!/usr/bin/env python3
# V219 slice 4 of 4 — D164 slice 2 + D170 (coach).
#   D164 s2: "the elbow Biceps draw. Barbell curl -> Dumbbell hammer curl lands beside a drawn hammer curl and
#   `seen` drops one (68 days). The draw sees the plan's name." Uses _injViewName, which slice 3 inserted.
#   D170 cf170b: "a leg day is owed its hinge, a Push day is not." capRegionalFatigue never trims the day's last
#   _isPostChain item on a legs role day.
# Lifted VERBATIM from tests/measure/v219_chain_rebaseline.js: step 4 (S2, 2 pairs), then step 5
# ([A_CANDS, POSTLEFT + A_CANDS], [A_PROT, A_PROT + P170]). Anchors counted on the source as it changes.
# Oracles: after step 4 the source is byte-identical to /tmp/v219_cf_step4.html (checked in-script, and the
# mid-state is also written to MID for a shell cmp); at the end, to /tmp/v219_cf_step5.html.
# No gate, no sabotage, no version bump in this slice.
import sys
P = '/Users/CanasBangin/Desktop/TheBig6V2/index.html'
MID = '/private/tmp/claude-501/-Users-CanasBangin-Desktop-TheBig6V2/8106852f-6c88-416e-bbf7-c3c836cdf7ed/scratchpad/v219_slice4_mid.html'
ORACLE4 = '/tmp/v219_cf_step4.html'
src = open(P, encoding='utf-8').read()

A_CANDS = "    // Every trimmable item in the region: rank>0, has a pattern, not the protected compound.\n    const cands=[];\n"
A_PROT = "        if(si*100+ii===protKey) return;          // the protected heaviest compound\n"
POSTLEFT = "    const _postLeft=out.reduce((a,s)=>a+((s&&s.items)||[]).reduce((b,it)=>b+(_isPostChain(it&&it.name)?1:0),0),0);\n"
P170 = "        if(role==='legs' && _postLeft<=1 && _isPostChain(it.name)) return;   // cf170: the day's LAST hinge/hip_ext is not regional fodder (cf170b: legs role only)\n"

STEP4 = [
  # A0 D164 s2: a second curl that renames onto the first is re-drawn from the names that do not.
  ("        const bis=pick(_bicPool,2,blockSeed(w)+104);",
   "        const bis=pick(_bicPool,2,blockSeed(w)+104);\n        if(bis[1]&&_injViewName(bis[1],cfg)===_injViewName(bis[0],cfg)){ const _alt=_bicPool.filter(n=>n!==bis[0]&&_injViewName(n,cfg)!==_injViewName(bis[0],cfg)); if(_alt.length) bis[1]=pick(_alt,1,blockSeed(w)+104)[0]; }"),
  # A1 D164 s2: the superset partner pool excludes names that rename onto bis[0].
  ("        const _sp=_ssPair(bis[0],bis[1],_bicPool,_bicPool);",
   "        const _sp=_ssPair(bis[0],bis[1],_bicPool,_bicPool.filter(n=>_injViewName(n,cfg)!==_injViewName(bis[0],cfg)));"),
]
STEP5 = [
  # A2 D170: count the day's posterior chain items before the trim loop.
  (A_CANDS, POSTLEFT + A_CANDS),
  # A3 D170 cf170b: the last hinge / hip extension on a legs role day is not a trim candidate.
  (A_PROT, A_PROT + P170),
]

def apply(s, pairs, base):
    for i, (a, b) in enumerate(pairs):
        n = s.count(a)
        print('anchor A%d count %d :: %r' % (base + i, n, a[:70]))
        if n != 1:
            print('ABORT: anchor A%d count %d' % (base + i, n)); sys.exit(2)
        s = s.replace(a, b, 1)
    return s

src = apply(src, STEP4, 0)
open(MID, 'w', encoding='utf-8').write(src)
if src != open(ORACLE4, encoding='utf-8').read():
    print('ABORT: mid-state differs from ' + ORACLE4); sys.exit(4)
print('mid-state == ' + ORACLE4)
src = apply(src, STEP5, 2)
# V218 already declares a different `const _postLeft=_postItems();` in another scope (line 10592), so count the
# full inserted line, not the bare declaration.
if src.count(POSTLEFT) != 1 or src.count("role==='legs' && _postLeft<=1") != 1:
    print('ABORT: post-condition'); sys.exit(3)
open(P, 'w', encoding='utf-8').write(src)
print('written')
