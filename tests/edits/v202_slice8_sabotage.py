# V202 slice 8 / D108 — sabotage M25, M26. v202.json was renumbered in slice 7 (M1..M24);
# these continue at M25 and reuse no label.
import io, json

SRC = io.open('index.html', encoding='utf-8').read()

A25 = "        try{ Object.assign(_touched, JSON.parse(localStorage.getItem('ia_hist_'+prog.id)||'{}')); }catch(e){}"
R25 = "        try{ Object.assign({}, JSON.parse(localStorage.getItem('ia_hist_'+prog.id)||'{}')); }catch(e){}"
A26 = "              if(!(_wn > 0)) return;"
R26 = "              if(_wn > 0) return;"

MUT = [
  {
    "name": "M25 -> D108 half-reverted: ia_hist_ is read out of the touched-set again, so the snapshot of the prescription the athlete was shown no longer raises the cut. The store is still parsed (and still restores INSIDE the loop), so a hist-only day is silently re-prescribed exactly as it was before V202 D108 while every other store keeps working",
    "anchor": A25, "replacement": R25,
    "gate": "gates/g202_d108_touchset_freeze.js",
    "note": "NAMED TRIP: g202_d108_touchset_freeze R2, the ia_hist_-only day. R1 stays GREEN because ia_exw_ still raises the cut on its own, R3/R3b stay GREEN because the control has nothing stored either way, and R4 stays GREEN because the anti-vacuity claim is about the engine build, not the freeze. A single failing row is the point: the two stores are independently load-bearing."
  },
  {
    "name": "M26 -> D108 half-reverted the other way: every ia_exw_ entry with a real week is skipped when the touched-set derives its day keys, so a load the athlete wrote against a prescription stops proving the day happened. This is precisely the shipped selectKBSize path, where tapping a kettlebell size logs a weight and nothing else",
    "anchor": A26, "replacement": R26,
    "gate": "gates/g202_d108_touchset_freeze.js",
    "note": "NAMED TRIP: g202_d108_touchset_freeze R1, the ia_exw_-only day. The predicate is inverted rather than deleted so the derivation loop still runs and the mutation cannot be mistaken for a parse failure. R2 stays GREEN because ia_hist_ is untouched, and R3 stays GREEN because a day with nothing stored must rebuild either way."
  },
]

for m in MUT:
    n = SRC.count(m["anchor"])
    print('anchor %s count==%d' % (m["name"][:3], n))
    assert n == 1, 'ANCHOR MISS %s: count=%d' % (m["name"][:3], n)

P = 'tests/sabotage/v202.json'
spec = json.load(io.open(P, encoding='utf-8'))
assert isinstance(spec, list) and len(spec) == 24, 'expected M1..M24, got %d' % len(spec)
have = set(m["name"].split(' ')[0] for m in spec)
for m in MUT:
    assert m["name"].split(' ')[0] not in have, 'label reuse'
spec.extend(MUT)
io.open(P, 'w', encoding='utf-8').write(json.dumps(spec, indent=2, ensure_ascii=False) + '\n')
print('WROTE', P, '->', len(spec), 'mutations')
