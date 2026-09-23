#!/usr/bin/env python3
# V205 slice 5, EDIT 3 (completion). Two measured facts the first pass did not have:
#
#  1. RANK 9 IS INERT on all 93 routed pace rows. The tie set after rank 8 already IS the
#     tie set after rank 9: every candidate still tied at rank 8 carries the same first
#     quality day. The addendum said rank 9 was "already implied by canonical"; measured,
#     it is implied completely. It is pinned here as an oracle-internal fact so that if
#     the space ever changes and rank 9 starts deciding weeks, a gate says so.
#  2. Because it is inert, NO mutation of rank 9 can trip a gate. S9 is therefore a
#     mutation defect by construction (a no-op mutation is a mutation defect, not a gate
#     defect), and it is removed rather than rewritten into a duplicate of S7.
import io, json, sys

def sub(src, old, new, label):
    n = src.count(old)
    if n != 1:
        sys.stderr.write('ABORT %s: anchor count==%d (expected 1)\n' % (label, n))
        sys.exit(1)
    sys.stderr.write('  anchor OK  %-24s  count=1  %+d bytes\n' % (label, len(new) - len(old)))
    return src.replace(old, new, 1)

G = 'tests/gates/g205_d129_tiebreak.js'
src = io.open(G, encoding='utf-8').read()

src = sub(src, """  // the measured refutation of the literal wording, pinned so it cannot drift silently
  ok(spanning===2,'P7 day-set-spanning residual ties is '+spanning+', the measure pinned 2');
}""", """  // the measured refutation of the literal wording, pinned so it cannot drift silently
  ok(spanning===2,'P7 day-set-spanning residual ties is '+spanning+', the measure pinned 2');
  // RANK 9 IS INERT. The tie set after rank 8 is already the tie set after rank 9 on
  // every routed row: candidates still tied at rank 8 all share a first quality day.
  // Oracle-internal — it pins the shape of the search space, not the engine's answer.
  let r9=0, r8=0;
  PACE_ROWS.forEach(r=>{
    const types=E.gs(r.cap,E.sp('run_pace_goal'),false,false);
    const all=space(r.train,r.cap,types,TP,true).map(c=>Object.assign({},c,{k7:c.rank.slice(0,7),k8:c.rank.slice(0,8)}));
    const t7=topBy(all,'k7').length, t8=topBy(all,'k8').length, t9=topBy(all,'rank').length;
    if(t7>t8) r8++;
    if(t8>t9) r9++;
  });
  console.log('  ties broken by rank 8: '+r8+'/'+PACE_ROWS.length+'; by rank 9: '+r9+'/'+PACE_ROWS.length);
  ok(r9===0,'P7 rank 9 broke '+r9+' ties; the measure found it inert on all 93 rows');
}""", 'rank 9 inertness')

src = sub(src, """//     sets — so P7 below pins the measured number and asserts the surviving form of
//     coach's own reason: a tie past rank 9 has the same HARD-day placement.
""", """//     sets — so P7 below pins the measured number and asserts the surviving form of
//     coach's own reason: a tie past rank 9 has the same HARD-day placement.
//   * RANK 9 SHIPS INERT. Measured over all 93 routed rows it breaks zero ties that
//     rank 8 left standing — "already implied by canonical" turns out to be complete.
//     It is pinned inert here, not asserted live, and no sabotage mutation can trip a
//     gate through it. That is coverage by construction, not coverage by omission.
""", 'header inertness')

io.open(G, 'w', encoding='utf-8').write(src)
sys.stderr.write('wrote %s\n' % G)

S = 'tests/sabotage/v205_d129.json'
spec = json.load(io.open(S, encoding='utf-8'))
before = len(spec)
spec = [m for m in spec if not m['name'].startswith('S9 ')]
if len(spec) != before - 1:
    sys.stderr.write('ABORT sabotage: S9 not found exactly once\n')
    sys.exit(1)
io.open(S, 'w', encoding='utf-8').write(json.dumps(spec, indent=2, ensure_ascii=False) + '\n')
sys.stderr.write('wrote %s (%d mutations, S9 removed as a no-op)\n' % (S, len(spec)))
