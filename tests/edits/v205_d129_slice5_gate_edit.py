#!/usr/bin/env python3
# V205 slice 5, EDIT 3 — the gate assertion for D129 (addendum).
#
# The claim under proof changes. It was "every chooser decision resolves at rank 7 or
# above" (measure script section C). Coach withdrew that as over-specified and adopted:
# enumeration order never decides between candidates with distinct DAY SETS.
#
# MEASURED, AND IT DOES NOT HOLD AS WORDED: 2 of 93 pace rows keep a tie after rank 9,
# and on BOTH the tied candidates have DIFFERENT day sets. They differ only in which day
# carries the recovery run; the long run and every quality session sit on the same day
# with the same type. So the gate pins the number actually found (2 of 93) and asserts
# the part of coach's own reason that survives the measure: a tie surviving rank 9 has
# the same HARD-day placement, which is the same week. The literal day-set wording is
# referred back to coach and is NOT re-ruled here.
import io, sys

def sub(src, old, new, label):
    n = src.count(old)
    if n != 1:
        sys.stderr.write('ABORT %s: anchor count==%d (expected 1)\n' % (label, n))
        sys.exit(1)
    sys.stderr.write('  anchor OK  %-26s  count=1  %+d bytes\n' % (label, len(new) - len(old)))
    return src.replace(old, new, 1)

G = 'tests/gates/g205_d129_tiebreak.js'
src = io.open(G, encoding='utf-8').read()

# 1. header transcription of the addendum
src = sub(src, """//   * Ranks 6 and 7 are pace-family-only. Live on the NRC arm they moved 168/804 rows,
//     against the ruling's own "NRC identical on 804/804".
""", """//   * Ranks 6 and 7 are pace-family-only. Live on the NRC arm they moved 168/804 rows,
//     against the ruling's own "NRC identical on 804/804".
//
// THE ADDENDUM (D129, same session), transcribed:
//   * rank 8, REST INTO THE LONG RUN — among layouts still tied after rank 7, the one
//     whose LAST quality session sits furthest before the long run wins. Freshest legs
//     into the week's longest run.
//   * rank 9, EARLIEST FIRST QUALITY DAY — below rank 8. Already implied by canonical;
//     made explicit so it is a rank rather than an accident.
//   * Both are pace-family-only, so NRC must not move at all: 804/804 identical.
//   * THE CLAIM UNDER PROOF CHANGED. It was "every chooser decision resolves at rank 7
//     or above". It is now about the athlete's DAYS, not his types: types may tie, days
//     may not be an artifact of loop order. Measured, the wording does not hold as
//     written — 2 of 93 rows keep a tie after rank 9 and both tie sets span two day
//     sets — so P7 below pins the measured number and asserts the surviving form of
//     coach's own reason: a tie past rank 9 has the same HARD-day placement.
""", 'header')

# 2. the oracle scores ranks 8 and 9 too
src = sub(src, """      const ident=pace&&idxs.join(',')===evk?1:0;
      const spread=pace?-longestFree(days):0;
      out.push({idxs,days,typeOf,ruled,rank:ruled.concat([ident,spread]),ident,lf:longestFree(days)});""",
"""      const ident=pace&&idxs.join(',')===evk?1:0;
      const spread=pace?-longestFree(days):0;
      // ranks 8 and 9, retyped from the addendum's prose. The LAST quality session before
      // the long run is the one with the smallest backward circular distance from it;
      // rank 8 maximises that distance. Rank 9 negates the first quality day's position.
      const qd=days.filter(d=>typeOf[d]===T.s1||typeOf[d]===T.s2);
      const qr=(pace&&longDay&&qd.length)?Math.min.apply(null,qd.map(d=>(pos(longDay)-pos(d)+7)%7)):0;
      const qf=(pace&&qd.length)?-pos(qd[0]):0;
      out.push({idxs,days,typeOf,ruled,rank:ruled.concat([ident,spread,qr,qf]),ident,qr,qf,
                hard:days.filter(d=>typeOf[d]!==T.rec).map(d=>d+':'+typeOf[d]).join(' '),
                lf:longestFree(days)});""", 'oracle ranks 8/9')

# 3. P7 + P8, appended before the summary line
src = sub(src, """
console.log('PASS '+PASS+' FAIL '+FAIL);""",
"""
// ── P7: DAYS ARE NEVER AN ARTIFACT OF LOOP ORDER. The residual tie count after
//        rank 9 is pinned to the number measured, and every surviving tie must be
//        the same week: same long run day, same quality days, same types on them.
//        Only the recovery day may differ. ──────────────────────────────────────
console.log('P7 residual ties after rank 9, and what the survivors look like');
{
  let resid=0, spanning=0, hardSplit=0;
  PACE_ROWS.forEach(r=>{
    const types=E.gs(r.cap,E.sp('run_pace_goal'),false,false);
    const tied=topBy(space(r.train,r.cap,types,TP,true),'rank');
    if(tied.length<2) return;
    resid++;
    const dsets=tied.map(c=>c.idxs.join(',')).filter((v,i,a)=>a.indexOf(v)===i);
    if(dsets.length>1) spanning++;
    const hards=tied.map(c=>c.hard).filter((v,i,a)=>a.indexOf(v)===i);
    if(hards.length>1){ hardSplit++; console.log('  FAIL P7 rest '+r.nm+' cap'+r.cap+
      ' tie spans two hard-day placements: '+hards.join('  |  ')); }
    console.log('  residual tie: rest '+r.nm+' cap'+r.cap+' x'+tied.length+' -> '+
      tied.map(c=>lay(r.train,c)).join('  |  '));
  });
  console.log('  rows with a tie surviving rank 9: '+resid+'/'+PACE_ROWS.length+
              ' (spanning more than one day set: '+spanning+')');
  ok(resid===2,'P7 residual tie count is '+resid+'/93, the measure pinned 2');
  ok(hardSplit===0,'P7: '+hardSplit+' residual ties put the hard days on different days');
  // the measured refutation of the literal wording, pinned so it cannot drift silently
  ok(spanning===2,'P7 day-set-spanning residual ties is '+spanning+', the measure pinned 2');
}

// ── P8: AFTER-GRID HAND ROW. The ruling names this resolution for the five-way
//        tie at rest=fri, cap 4. Typed in as a literal. ───────────────────────
console.log('P8 after-grid: rest fri, four-run ceiling');
{
  const train=DAYS.filter(d=>d!=='fri');
  const pick=E.c(train,4,'run_pace_goal',true);
  const want='MON:int WED:chi THU:lsd_easy SAT:lsd_long';
  console.log('  '+lay(train,pick));
  ok(lay(train,pick)===want,'P8 layout is "'+lay(train,pick)+'", the ruling says "'+want+'"');
  // rank 8 is the term that decides it: last quality Wednesday, three days clear of the long
  const got=engIn(space(train,4,E.gs(4,E.sp('run_pace_goal'),false,false),TP,true),pick,train);
  ok(got&&got.qr===3,'P8 rest into the long run is '+(got?got.qr:'?')+' days, the ruling says 3');
}

console.log('PASS '+PASS+' FAIL '+FAIL);""", 'P7+P8')

io.open(G, 'w', encoding='utf-8').write(src)
sys.stderr.write('wrote %s\n' % G)

# ── sabotage: S3's anchor moved with the rank vector; ranks 8 and 9 get their own ──
import json
S = 'tests/sabotage/v205_d129.json'
spec = json.load(io.open(S, encoding='utf-8'))
old_rank = "        const _rank = c => [-c.coll, c.longLast, c.speedsAfterRest, c.recBeforeLong, c.canonical, c.identity, c.spread];"
new_rank = "        const _rank = c => [-c.coll, c.longLast, c.speedsAfterRest, c.recBeforeLong, c.canonical, c.identity, c.spread, c.qualRest, c.qualFirst];"
hits = [m for m in spec if m['anchor'] == old_rank]
if len(hits) != 1:
    sys.stderr.write('ABORT sabotage: %d mutations anchored on the old rank vector\n' % len(hits))
    sys.exit(1)
hits[0]['anchor'] = new_rank
hits[0]['replacement'] = hits[0]['replacement'].replace('c.spread];', 'c.spread, c.qualRest, c.qualFirst];')
sys.stderr.write('  sabotage S3 re-anchored on the nine-term rank vector\n')

spec.append({
  "name": "S7 -> rank 8 is voided while every line that computes it stays. The backward distance from the long run to the last quality session is still measured, still carried on the candidate; the rank slot reads a constant. The five-way tie at rest=fri falls back to enumeration order and the athlete gets whichever layout the loop reached first",
  "anchor": "        const qualRest = paceFam ? _qualRest : 0;",
  "replacement": "        const qualRest = 0;",
  "gate": "gates/g205_d129_tiebreak.js",
  "note": "NAMED TRIP: P8 goes red because rest=fri cap 4 no longer resolves to the layout the ruling names. P1 goes red on the rows whose pick is no longer a maximum of the nine-term objective. P7 goes red because the residual tie count rises above the pinned 2. EXPECTED: P1, P7, P8."
})
spec.append({
  "name": "S8 -> rank 8 inverts. The term is still a metric, still circular, still pace-family-only, but the sign flips: the layout whose last quality session sits CLOSEST to the long run wins, so the athlete runs quality the day before his longest run and the week still scores a clean collision count because collisions rule at rank 1",
  "anchor": "        const qualRest = paceFam ? _qualRest : 0;",
  "replacement": "        const qualRest = paceFam ? -_qualRest : 0;",
  "gate": "gates/g205_d129_tiebreak.js",
  "note": "NAMED TRIP: P8 goes red naming the layout taken against the ruling's, and its rest-into-the-long-run distance. P1 goes red on every row rank 8 decides. EXPECTED: P1, P8."
})
spec.append({
  "name": "S9 -> rank 9 is voided the same way. The first quality day is still found and still negated; the rank slot reads a constant, so the ties rank 8 cannot split fall through to enumeration order instead of to the earliest quality day",
  "anchor": "        const qualFirst = (paceFam && _firstQual) ? -pos(_firstQual) : 0;",
  "replacement": "        const qualFirst = 0;",
  "gate": "gates/g205_d129_tiebreak.js",
  "note": "NAMED TRIP: P7 goes red because the residual tie count rises above the pinned 2. P1 goes red on the rows rank 9 decides. EXPECTED: P1, P7."
})
io.open(S, 'w', encoding='utf-8').write(json.dumps(spec, indent=2, ensure_ascii=False) + '\n')
sys.stderr.write('wrote %s (%d mutations)\n' % (S, len(spec)))
