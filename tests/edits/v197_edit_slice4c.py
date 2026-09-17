#!/usr/bin/env python3
# V197 slice 4c — tests/sabotage/v197.json.
# Coach's specified probe (`_compoundTier(it.name)===3` -> `>=2`) SURVIVED the amended gate.
# It is directionally wrong, not weak: `>=2` EXEMPTS MORE items, so it can only LOWER
# non-optional deletions, and B4 is a ratchet on deletions RISING. Measured on the mutant:
# ex-class aggregate 4353 -> 4085 (it falls), B4g 896 -> 530 (it falls further). Nothing a
# gate could do would catch it, because there is nothing to catch: the claim is not violated.
# THE GATE IS NOT ADJUSTED. The MUTATION is, per the standing rule in CLAUDE.md, and the
# replacements are chosen to move the metric the direction B4 actually guards.
import io, json

P = '/Users/CanasBangin/Desktop/TheBig6V2/tests/sabotage/v197.json'
muts = json.load(io.open(P, encoding='utf-8'))
assert len(muts) == 9, len(muts)
old = muts.pop()
assert old['anchor'].strip().startswith('if(_compoundTier(it.name)===3)'), old['anchor'][:80]
print('DROPPED the surviving probe: ' + old['name'][:80])

idx = io.open('/Users/CanasBangin/Desktop/TheBig6V2/index.html', encoding='utf-8').read()

A9 = 'const SESSION_SET_BUDGET = 20;'
A10 = '    return s.core||s.hip||/^main\\b|^primer|^power\\b|^strength\\b/.test(L)||/hip|mobility|stretch/.test(L);'
for a in (A9, A10):
    n = idx.count(a)
    print('index.html anchor count=%d  %r' % (n, a[:70]))
    assert n == 1

muts.append({
 "name": "M9 -> the session budget is tightened to 14, so the trim runs far past the ruled isolation band and strips work nobody ruled deletable off every tier",
 "anchor": A9,
 "replacement": "const SESSION_SET_BUDGET = 14;",
 "gate": "gates/g193_budget_floor.js",
})
muts.append({
 "name": "M10 -> D81 abused: the ruled-deletable isolation band is made PROTECTED, so the trim it was ruled to absorb falls back onto the leg compounds instead",
 "anchor": A10,
 "replacement": "    return s.core||s.hip||/isolation/.test(L)||/^main\\b|^primer|^power\\b|^strength\\b/.test(L)||/hip|mobility|stretch/.test(L);",
 "gate": "gates/g193_budget_floor.js",
})
# The runner builds its temp filename out of the mutation name, and a long name is an
# OSError, not a result. Only the names this script adds are checked: the existing eight
# already ran clean at their current lengths.
import re
for m in muts[-2:]:
    stem = re.sub(r'[^A-Za-z0-9]+', '_', m['name'])
    print('temp-stem length %d for %s' % (len(stem), m['name'][:40]))
    assert len(stem) < 180, len(stem)
io.open(P, 'w', encoding='utf-8').write(json.dumps(muts, ensure_ascii=False, indent=1) + '\n')
print('WROTE %s, %d mutations' % (P, len(muts)))
