#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""V201 / D94 — SLICE 4 of 4. Gate-only. index.html is NOT touched by this script.

Adds to tests/gates/g200_pull_arbitration.js:
  A6   the V_PULL vertical-pull hand oracle's 14-name blindness probe (lifted from
       tests/measure/v201_d94_population.js), asserted the way A4 and A5 assert theirs.
  P2d  the D94 conjunct is EXERCISED on the whole positive limb: 150 of the 150
       enterPost=B cards also carry a posterior Main at p1. Coach's ruled number.
       The 210-of-210 superset is PRINTED as context and NOT pinned.
  P7   150 of 150 shipped cards carry a V_PULL item — the assertion that says what
       D94 is actually for. Reads the SHIPPED card by design.

Every anchor is asserted count==1 before anything is written; the first miss aborts the
whole script with NOTHING written. Literal bytes throughout (real em-dashes, real ×, °).
E_PAT and cls() are NOT touched: they must stay byte-identical to g199's.
"""
import io, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
G200 = os.path.join(ROOT, 'gates', 'g200_pull_arbitration.js')

src = io.open(G200, encoding='utf-8').read()
orig = src
reps = []


def rep(tag, anchor, new):
    reps.append((tag, anchor, new))


# ── R1. the V_PULL hand table and its 14-name probe, lifted verbatim from measure ──────
rep('R1 V_PULL table + probe',
"""  ['45° back extension',1],['Kettlebell swing',1],['Dumbbell split-stance deadlift',1],['Barbell hip thrust',1]];
""",
"""  ['45° back extension',1],['Kettlebell swing',1],['Dumbbell split-stance deadlift',1],['Barbell hip thrust',1]];

// ── HAND ORACLE 2: vertical pull. LIFTED VERBATIM from tests/measure/v201_d94_population.js,
// where the D94 population was measured. Typed from the movement names, never from an engine
// predicate: this file calls neither _isPostChain nor _pattern nor any classifier of the app's.
// A vertical pull loads the lat from overhead — bar, ring or rope above the shoulder, elbow
// travelling from overhead to the ribs. Rows are HORIZONTAL and must read 0; face pulls and
// pullovers are neither and must read 0. Those four negatives are what make the table an
// oracle rather than a substring search for the word "pull".
const V_PULL=/pull-?down|pull-?up|pullup|chin-?up|chinup|lat prayer|muscle-?up|\\bhang(ing)? row\\b(?!)|kneeling.*pulldown|straight-?arm pulldown|\\bpull-?ups?\\b/i;
const isVPull=n=>V_PULL.test(String(n||''));
// A6 probe: 14 names, seven positives and seven negatives, expected column hand-typed.
const VPROBE=[['Lat pulldown',1],['Neutral-grip pulldown',1],['Chinups',1],['Pull-ups',1],
  ['Assisted pull-up',1],['Kneeling band pulldown',1],['Straight-arm pulldown',1],
  ['Barbell row',0],['Pendlay row',0],['Chest-supported row',0],['Face pull',0],
  ['Dumbbell pullover',0],['Inverted row (supinated, under a table)',0],['Kettlebell swing',0]];
""")

# ── R2. accumulator slots ──────────────────────────────────────────────────────────────
rep('R2 blank() slots',
"""  census:{},viol:0,violShape:{},
""",
"""  census:{},viol:0,violShape:{},
  mainPostSwap:0,p7VPull:0,p7Names:{},p7Miss:[],
""")

# ── R3. the sweep-side counters ────────────────────────────────────────────────────────
rep('R3 sweep counters',
"""      secOf(r.p1,'Pull superset B').forEach(s=>s.n.forEach(n=>{if(isPost(n))bump(S.swapItems,n);}));
""",
"""      secOf(r.p1,'Pull superset B').forEach(s=>s.n.forEach(n=>{if(isPost(n))bump(S.swapItems,n);}));
      // ── P2d: does the D94 conjunct actually FIRE on this positive-limb card? Read off p1,
      //    the deload's INPUT, with the same cls() 'main' limb and the same E_PAT the app's
      //    own __mainPost uses on its side of the seam. ──
      if(mainPost) S.mainPostSwap++;
      // ── P7: the vertical pull, read off the SHIPPED card. This is the only other pin in
      //    this file that reads a shipped card (P4 is the first), and it is deliberate: P7
      //    asserts what the athlete ends up holding, not what the arbitration selected. ──
      const vp=[].concat(...(ship||[]).map(s=>s.n||[])).filter(isVPull);
      if(vp.length){S.p7VPull++;vp.forEach(n=>bump(S.p7Names,n));}
      else if(S.p7Miss.length<3)S.p7Miss.push({cfg:L.key,card:'w'+r.w+' '+r.d,
        shipped:(ship||[]).map(s=>s.l+' ['+s.n.join(' + ')+']')});
""")

# ── R4. A6, asserted the way A4 and A5 assert theirs ───────────────────────────────────
rep('R4 A6 probe assertion',
"""  +(clsBad.length?' — misreads '+clsBad.map(x=>x[0].l+'=>'+cls(x[0])+' want '+x[1]).join(', '):''));
""",
"""  +(clsBad.length?' — misreads '+clsBad.map(x=>x[0].l+'=>'+cls(x[0])+' want '+x[1]).join(', '):''));
const vprobeBad=VPROBE.filter(([n,e])=>(isVPull(n)?1:0)!==e);
ok(vprobeBad.length===0,'A6 the hand VERTICAL-PULL oracle passes its blindness probe on all '+VPROBE.length+' names, '
  +VPROBE.filter(x=>x[1]===1).length+' positives and '+VPROBE.filter(x=>x[1]===0).length+' negatives. The negatives are the load-bearing half: three horizontal rows, a face pull and a pullover must all read 0, so P7 cannot be satisfied by a section that merely has the word pull in a movement name. P7 is void without this row'
  +(vprobeBad.length?' — misreads '+vprobeBad.map(x=>x[0]).join(', '):''));
""")

# ── R5. P2d ────────────────────────────────────────────────────────────────────────────
rep('R5 P2d assertion',
"""  console.log('── P6. the whole positive limb is ONE NAME, now said out loud as an equality ──');
""",
"""  console.log('── P2d. the D94 conjunct is EXERCISED on the positive limb, not merely asserted ──');
  ok(R.mainPostSwap===150&&R.swapCards===150,
    'P2d THE NEW CONJUNCT FIRES ON EVERY CARD IT DECIDES: of the '+R.swapCards+' both-enter deload pull cards whose Pull superset B holds an E_PAT posterior item at p1 — D91\\'s positive limb, which is exactly the set of cards D94 changes the answer on — '+R.mainPostSwap+' ALSO carry a Main-class section holding an E_PAT posterior item at p1. WANT 150 OF 150. '
    + 'WHY THIS IS A SEPARATE ASSERTION FROM P2: P2 reads 0 violations of 210, and a clause that never fired would produce that same 0 on the 60 no-posterior cards while quietly leaving the other 150 selecting B — except it would not, because those 150 would then be violations. What P2 cannot show on its own is that all 210 reach A by the TWO different routes it claims. P2d pins the route: if this count were 149, one card would keep B, D94 would decide nothing there, and the conjunct would be carrying less than the ruling says it carries. The equality is what makes P2\\'s green a consequence of D94 rather than an arithmetic coincidence. '
    + 'CONTEXT, PRINTED AND DELIBERATELY NOT PINNED: across ALL '+R.bothEnter+' both-enter cards the Main-class posterior count reads '+R.mainPostCards+' (measured 210 of 210 — a superset of the 150, because the 60 cards that enter with NO posterior accessory still carry a posterior Main). Coach ruled 150 of 150. 210 of 210 is a STRONGER claim than the one ruled, and a stronger claim than the ruling is still an unruled claim, so it is printed here for drift and pinned nowhere. '
    + 'THIS IS A LEGITIMATE PIN FOR THE SAME REASON P2c IS: it is read off p1, the deload\\'s INPUT, so it is a property of the program builder UPSTREAM of the arbitration and the arbitration cannot move it. It therefore reads 150 on all four artifacts and SEPARATES NOTHING. That is correct and intended: separation is P2, P4 and P7. P2d\\'s job is to stop the positive limb being declared decisive without being shown decisive.');

  console.log('── P6. the whole positive limb is ONE NAME, now said out loud as an equality ──');
""")

# ── R6. P7 ─────────────────────────────────────────────────────────────────────────────
rep('R6 P7 assertion',
"""  console.log('── SCOPE NOTE ──');
""",
"""  console.log('── P7. the vertical pull: what D94 is FOR, read off the shipped card ──');
  console.log('     CENSUS vertical-pull names on the shipped positive-limb cards '+JSON.stringify(R.p7Names));
  (R.p7Miss||[]).forEach((e,i)=>console.log('     P7 MISS EX '+(i+1)+' '+JSON.stringify(e)));
  ok(R.p7VPull===150&&R.swapCards===150,
    'P7 THE DAY KEEPS ITS VERTICAL PULL: of the '+R.swapCards+' positive-limb deload pull cards, '+R.p7VPull+' ship a card carrying at least one VERTICAL PULL by the V_PULL hand table (want 150 of 150). This is the assertion that says what D94 is FOR. P2 proves WHICH BLOCK the arbitration selected and P4 proves the block survived the trip; neither of them says a word about what is IN it, and the defect D94 removes is not a label going missing, it is a MOVEMENT going missing. '
    + 'THE DEFECT, MEASURED: on the L-healthy lattice 135 of 135 cards shipped with ZERO vertical pull. The movements deleted were L-sit chinups on 90 of them and Neutral-grip chinups on 45. The day\\'s only overhead pull was being thrown away to keep a conditioning-pool Kettlebell swing on a card whose Main is already a deadlift variant. On THIS mini lattice under D94 the census reads {"Weighted chinups":90,"L-sit chinups":60}; the names are printed above as context and are NOT pinned, because the ruled claim is that the vertical pull is THERE, not which one was drawn. '
    + 'ORACLE INDEPENDENCE: V_PULL is a hand table typed from the movement names and proved by A6\\'s 14-name blindness probe, seven positives and seven negatives, the negatives including three horizontal rows, a face pull and a pullover. It is NEVER a call into the engine\\'s classifier — this file calls neither _isPostChain nor _pattern, and P7 adds no exception to that. '
    + 'P7 READS THE SHIPPED CARD BY DESIGN, which is the point and which is what distinguishes it from P2: P2 keys on the p1/p2 stage record because g193_samecard.js:374 rules that the Pull superset A LABEL is not asserted to survive to the card. P7 asserts no label. It asserts that an overhead pull is on the card the athlete holds, by whatever label it ends up under, so it does not collide with that ruling. '
    + 'SEPARATION: V200 and V199 select Pull superset B on all 150 of these cards, and Pull superset B is a row-family accessory plus the ex.cond[2] conditioning draw — neither is a vertical pull — so P7 reads 0 of 150 and is RED on both. V198 never selects B, keeps A, and is GREEN here, correct and expected. IF P7 IS GREEN ON V200 IT IS NOT MEASURING WHAT IT CLAIMS: report that, do not adjust the pin.');

  console.log('── SCOPE NOTE ──');
""")

# ── R7. the acceptance table in the header, extended to the two new separating rows ────
rep('R7 header acceptance table',
"""//   V201 (D94 shipped)      all green.
//   V200                    P2 FAIL with EXACTLY 150 violations, P4 FAIL 0 of 150.
//   V199                    P2 FAIL with EXACTLY 150 violations, P4 FAIL 0 of 150.
""",
"""//   V201 (D94 shipped)      all green.
//   V200                    P2 FAIL with EXACTLY 150 violations, P4 FAIL 0 of 150,
//                           P7 FAIL 0 of 150 (the artifact ships no vertical pull on them).
//   V199                    P2 FAIL with EXACTLY 150 violations, P4 FAIL 0 of 150,
//                           P7 FAIL 0 of 150.
""")

# ── apply: assert every anchor count==1 FIRST, abort the whole script on the first miss ─
bad = [(t, src.count(a)) for t, a, _ in reps if src.count(a) != 1]
if bad:
    for t, n in bad:
        print('ANCHOR MISS  %-28s count=%d' % (t, n))
    print('ABORT: nothing written.')
    sys.exit(1)

for t, a, n in reps:
    src = src.replace(a, n, 1)
    print('ok  %-28s' % t)

if src == orig:
    print('ABORT: no change produced.')
    sys.exit(1)

io.open(G200, 'w', encoding='utf-8').write(src)
print('WROTE %s  (%d -> %d bytes)' % (G200, len(orig.encode('utf-8')), len(src.encode('utf-8'))))
