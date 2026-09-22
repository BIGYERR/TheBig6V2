#!/usr/bin/env python3
# V203 slice G — g203_mile_pencil.js dereferenced mileBestSrc.from without checking it.
# M2 (slice C's own mutation) deletes that object, so the gate DIED instead of failing:
# CRASH, which is never a trip, and a crashed gate reports nothing. The fix belongs in
# the gate, not in the mutation: the mutation is exactly the malformed shape the ruling
# says the app must survive, and the gate has to survive reading it too. The assertions
# and their expected values are unchanged — only the dereference is made safe, so each
# row now FAILS BY NAME with the missing object printed as its detail.
import io, os, sys

P = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'gates', 'g203_mile_pencil.js')
with io.open(P, encoding='utf-8') as f: src = f.read()

def rep(src, old, new, label):
    n = src.count(old)
    if n != 1: sys.exit('ABORT: anchor %s occurs %d times, expected 1' % (label, n))
    return src.replace(old, new)

src = rep(src,
"""const NO_PRIOR = { cfg: { cardioGoals: { run: { id:'run_half', label:'Half Marathon', baselineDist:'5', baseline:'5mi' } } } };""",
"""// `from` is the object the ruling says is ALWAYS emitted. A gate that dereferences it
// blind cannot report its absence: it dies, and a dead gate is not a passing one.
const FROM = s => (s && s.from) || {};
const NO_PRIOR = { cfg: { cardioGoals: { run: { id:'run_half', label:'Half Marathon', baselineDist:'5', baseline:'5mi' } } } };""",
'NO_PRIOR decl')

for old, new, label in [
  ("eq('over a DEFAULT anchor: from.kind', g.mileBestSrc.from.kind, 'default');",
   "eq('over a DEFAULT anchor: from.kind', FROM(g.mileBestSrc).kind, 'default');", 'default from.kind'),
  ("eq('over a DEFAULT anchor: from.mins', g.mileBestSrc.from.mins, '');",
   "eq('over a DEFAULT anchor: from.mins', FROM(g.mileBestSrc).mins, '');", 'default from.mins'),
  ("eq('over an ENTERED anchor: from.kind', g.mileBestSrc.from.kind, 'entered');",
   "eq('over an ENTERED anchor: from.kind', FROM(g.mileBestSrc).kind, 'entered');", 'entered from.kind'),
  ("eq('over an ENTERED anchor: from.mins', g.mileBestSrc.from.mins, '10');",
   "eq('over an ENTERED anchor: from.mins', FROM(g.mileBestSrc).mins, '10');", 'entered from.mins'),
  ("eq('over an ENTERED anchor: from.secs', g.mileBestSrc.from.secs, '30');",
   "eq('over an ENTERED anchor: from.secs', FROM(g.mileBestSrc).secs, '30');", 'entered from.secs'),
]:
    src = rep(src, old, new, label)

with io.open(P, 'w', encoding='utf-8') as f: f.write(src)
print('WROTE ' + P)
