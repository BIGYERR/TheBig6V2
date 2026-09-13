#!/usr/bin/env python3
# V194 sabotage, EDIT 3 follow-on. tests/sabotage.py builds the mutant's temp FILENAME out of
# the mutation name (`sab_<name sanitised>.html`), so a long name is an OSError 63 "File name
# too long" before the gate ever runs — a runner-level crash, not a mutation result. M10's name
# is cut to fit and the reasoning moves to a "why" key, which the runner ignores (it reads only
# name / anchor / replacement / gate) and the record keeps.
import json, sys

SPEC = '/Users/CanasBangin/Desktop/TheBig6V2/tests/sabotage/v194.json'
spec = open(SPEC, encoding='utf-8').read()

OLD_NAME = "M10 -> g193_budget_floor B3 per-tier RATCHET (via the sabotage probe, which hands the gate the V193 baseline the runner cannot): the hip mobility draw is dropped on 1-in-29 day seeds and only off the bodyweight tier, so prehab loses 32 items per wide tier on 5 of 6 tiers and 3 per narrow tier. That is a real regression that fits INSIDE the V192 census floor headroom (168 to 241 wide, 0 to 16 narrow), so the floor claims all stay green and only the live-baseline ratchet catches it"
NEW_NAME = "M10 -> B3 per-tier RATCHET: hip mobility draw dropped on 1-in-29 seeds, bodyweight exempt, -32 prehab per wide tier on 5 of 6 tiers"
WHY = ("The regression fits INSIDE the V192 census floor headroom (168 to 241 items per wide tier, 0 to 16 per narrow), "
       "so every floor claim stays green and only the live-baseline per-tier ratchet catches it. That is what makes this "
       "mutation a proof the ratchet is load-bearing and not redundant with the floor. Bodyweight is exempt in the mutation "
       "because narrow bodyweight sits exactly ON the floor (425 = 425) and any loss there would trip the floor instead. "
       "The named gate is the probe, not g193_budget_floor directly: tests/sabotage.py invokes gates with no baseline, and "
       "with no baseline this regression is invisible (PASS 22 FAIL 0). Measured with a V193 baseline: PASS 29 FAIL 2.")

n = spec.count(OLD_NAME)
print('name anchor count=%d' % n)
if n != 1:
    sys.exit('ABORT: M10 name anchor matched %d times, expected 1. No bytes written.' % n)
spec_new = spec.replace(OLD_NAME, NEW_NAME, 1)

A = '''  "anchor": "const mob=pick(EXLIB.hip_mobility,1,seed+7);",'''
c = spec_new.count(A)
print('anchor-line count=%d' % c)
if c != 1:
    sys.exit('ABORT: M10 anchor line matched %d times, expected 1. No bytes written.' % c)
spec_new = spec_new.replace(A, '  "why": ' + json.dumps(WHY, ensure_ascii=False) + ',\n' + A, 1)

d = json.loads(spec_new)
assert len(d) == 10, 'mutation count changed'
assert len('sab_' + d[-1]['name'] + '.html') < 200, 'name still too long for the runner temp path'
open(SPEC, 'w', encoding='utf-8').write(spec_new)
print('wrote %s (%d mutations, M10 temp filename %d chars)' % (SPEC, len(d), len('sab_' + d[-1]['name'] + '.html')))
