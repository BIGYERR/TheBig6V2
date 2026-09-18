#!/usr/bin/env python3
# V198 (D85) gate slice 5: g198_posterior_floor.js — A6b0 becomes a HAND TABLE asserted
# against the engine, instead of a set read out of the engine and then asserted non-empty.
#
# Standing rule: an oracle is independent of the code under test. A6b's counting regex was
# already a hand regex; A6b0 was not — it filtered a name list THROUGH _pattern and then
# asserted the survivors were more than zero, which is the engine agreeing with itself.
# The doctrine is hand-stated here instead: these three names are knee-extension / leg-curl
# isolation and are leg_iso; Leg press is a loaded compound and is NOT. The engine is then
# held to that table in both directions, so a drift either way is named.
# index.html is NOT touched by this script. ia-version stays 198.
import io, sys, os
F = os.path.join('/Users/CanasBangin/Desktop/TheBig6V2', 'tests', 'gates', 'g198_posterior_floor.js')
src = io.open(F, encoding='utf-8').read()
reps = []
def rep(tag, old, new):
    global src
    n = src.count(old)
    if n != 1:
        sys.stderr.write('ANCHOR MISS [%s]: count==%d, expected 1\n' % (tag, n)); sys.exit(2)
    src = src.replace(old, new); reps.append(tag)

rep('A6b0 hand table',
"""const ISO_NAMES=['Leg extension','Lying leg curl','Seated leg curl','Leg press'].filter(n=>PAT(n)==='leg_iso');
ok(ISO_NAMES.length>0, 'A6b0 the engine still classifies the names this claim is about as leg_iso: '+ISO_NAMES.length+' of 4 ('+ISO_NAMES.join(', ')+')');""",
"""// HAND TABLE, not a filter over the engine. Doctrine: a knee-extension machine and the two
// leg-curl machines are single-joint isolation and are leg_iso; a leg press is a loaded
// multi-joint push and is not. The engine is held to this table in BOTH directions, so
// either kind of drift is named rather than silently shrinking the set A6b counts.
const ISO_HAND={'Leg extension':true,'Lying leg curl':true,'Seated leg curl':true,'Leg press':false};
const ISO_NAMES=Object.keys(ISO_HAND).filter(n=>ISO_HAND[n]);
const isoWrong=Object.keys(ISO_HAND).filter(n=>(PAT(n)==='leg_iso')!==ISO_HAND[n]);
ok(isoWrong.length===0, 'A6b0 _pattern agrees with the hand table on all '+Object.keys(ISO_HAND).length+
   ' names: leg_iso for ['+ISO_NAMES.join(', ')+'], NOT leg_iso for Leg press'+
   (isoWrong.length?' — disagrees on '+isoWrong.map(n=>n+' = '+PAT(n)).join(', '):''));""")
io.open(F, 'w', encoding='utf-8').write(src)
print('WROTE %s (%d)' % (F, len(reps)))
