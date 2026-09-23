#!/usr/bin/env python3
# V205 slice 5, EDIT 3 (correction). The previous pass mis-read a no-op mutation as an
# inert term. Measured properly:
#   * ties at rank 7: 9 of 93. Rank 8 breaks 5, rank 9 breaks 2, 2 survive.
#   * Rank 9 IS a live discriminator. S9 was a no-op only because on both rows it
#     decides, its winner is also the candidate enumeration order reaches first, so
#     VOIDING it changes nothing. That is a mutation defect, so the mutation is
#     rewritten as an INVERSION (latest first quality day wins), which does move both.
import io, json, sys

def sub(src, old, new, label):
    n = src.count(old)
    if n != 1:
        sys.stderr.write('ABORT %s: anchor count==%d (expected 1)\n' % (label, n)); sys.exit(1)
    sys.stderr.write('  anchor OK  %-22s  count=1  %+d bytes\n' % (label, len(new) - len(old)))
    return src.replace(old, new, 1)

G = 'tests/gates/g205_d129_tiebreak.js'
src = io.open(G, encoding='utf-8').read()

src = sub(src, """  // RANK 9 IS INERT. The tie set after rank 8 is already the tie set after rank 9 on
  // every routed row: candidates still tied at rank 8 all share a first quality day.
  // Oracle-internal — it pins the shape of the search space, not the engine's answer.""",
"""  // HOW THE NINE TIES AT RANK 7 ARE DISPOSED OF. Oracle-internal: it pins the shape of
  // the search space, not the engine's answer. Rank 8 breaks 5, rank 9 breaks 2, and 2
  // survive with the same hard days. The three numbers must sum to the rank-7 tie count.""", 'comment')

src = sub(src, """  console.log('  ties broken by rank 8: '+r8+'/'+PACE_ROWS.length+'; by rank 9: '+r9+'/'+PACE_ROWS.length);
  ok(r9===0,'P7 rank 9 broke '+r9+' ties; the measure found it inert on all 93 rows');""",
"""  console.log('  ties broken by rank 8: '+r8+'/'+PACE_ROWS.length+'; by rank 9: '+r9+'/'+PACE_ROWS.length);
  ok(r8===5,'P7 rank 8 broke '+r8+' ties, the measure pinned 5');
  ok(r9===2,'P7 rank 9 broke '+r9+' ties, the measure pinned 2');
  ok(r8+r9+resid===9,'P7 rank-7 ties do not account: '+r8+'+'+r9+'+'+resid+' is not 9');""", 'rank 8/9 pins')

src = sub(src, """//   * RANK 9 SHIPS INERT. Measured over all 93 routed rows it breaks zero ties that
//     rank 8 left standing — "already implied by canonical" turns out to be complete.
//     It is pinned inert here, not asserted live, and no sabotage mutation can trip a
//     gate through it. That is coverage by construction, not coverage by omission.
""", """//   * HOW THE TIES GO. 9 of 93 rows are still tied after rank 7. Rank 8 breaks 5,
//     rank 9 breaks 2, and 2 survive. All three counts are pinned and must sum to 9.
//     On both rows rank 9 decides, its winner is also the one enumeration order would
//     have reached first, so VOIDING rank 9 is a behavioural no-op; the sabotage
//     mutation for it inverts the term instead of voiding it.
""", 'header')

io.open(G, 'w', encoding='utf-8').write(src)
sys.stderr.write('wrote %s\n' % G)

S = 'tests/sabotage/v205_d129.json'
spec = json.load(io.open(S, encoding='utf-8'))
if any(m['name'].startswith('S9 ') for m in spec):
    sys.stderr.write('ABORT sabotage: S9 already present\n'); sys.exit(1)
spec.append({
  "name": "S9 -> rank 9 inverts. The first quality day is still found, still pace-family-only, but the sign flips so the LATEST first quality day wins instead of the earliest. Voiding this term is a behavioural no-op on both rows it decides — its winner is also the candidate enumeration order reaches first — so the mutation inverts it, which moves both rows off the ruled layout",
  "anchor": "        const qualFirst = (paceFam && _firstQual) ? -pos(_firstQual) : 0;",
  "replacement": "        const qualFirst = (paceFam && _firstQual) ? pos(_firstQual) : 0;",
  "gate": "gates/g205_d129_tiebreak.js",
  "note": "NAMED TRIP: P1 goes red on the two rows rank 9 decides, printing the nine-term rank taken against the ruled maximum. EXPECTED: P1. Voiding the term instead (qualFirst = 0) was measured first and is a behavioural no-op across all 93 pace rows; a no-op mutation is a mutation defect, not a gate defect."
})
io.open(S, 'w', encoding='utf-8').write(json.dumps(spec, indent=2, ensure_ascii=False) + '\n')
sys.stderr.write('wrote %s (%d mutations)\n' % (S, len(spec)))
