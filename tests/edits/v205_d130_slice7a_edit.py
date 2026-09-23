#!/usr/bin/env python3
# V205 slice 7a — D130 (amended): typed hard-day adjacency on the pace family.
#
# Two edits, four anchored replacements:
#   E1  split rank 1 in _nrcSpacedRunDays into untolerated / tolerated (3 anchors:
#       the collision loop, the cand literal, the _rank key)
#   E2  re-key the D125 conditional ceiling at :5312 to read untolerated, not total
#
# ia-version is NOT bumped by this script. Slice 7a is a prerequisite for slice 7;
# the bump is a later slice's business and Mario owns it.
import sys, io

PATH = 'index.html'
src = io.open(PATH, encoding='utf-8').read()

reps = []

def rep(tag, old, new):
    reps.append((tag, old, new))

# ── E1a. THE COLLISION LOOP → TYPED ──────────────────────────────────────────
rep('E1a coll loop', """        let coll = 0;
        for(let a=0;a<hardDays.length;a++) for(let b=a+1;b<hardDays.length;b++)
          if(circ(hardDays[a],hardDays[b])===1) coll++;
""", """        // V205 (D130 amended): RANK 1 IS SPLIT, AND ON THE PACE FAMILY ONLY. Two hard
        // days on adjacent days are not one thing. CHI on the EVE of the long LSD is
        // TOLERATED: the long run is relative recovery under Guide A p.11 and not a hard
        // day, which is this engine's own earlier ruling, so a tempo the day before it is
        // a legal pairing and not a collision to design out. Every other adjacency stays
        // UNTOLERATED and must be ZERO — INT beside CHI, INT beside the long either way,
        // and any quality session the day AFTER the long run. Untolerated is rank 1;
        // tolerated is rank 1b, minimised and never traded for a worse untolerated count.
        // Measured on the counterfactual: untolerated reaches 0 on all 64 rest-day
        // calendars, 14 of them pay exactly one tolerated CHI-on-eve, and (0,1) is the
        // FLOOR on those 14 — not an aspiration. The other 50 land (0,0).
        // NRC IS UNTOUCHED BY CONSTRUCTION: off the pace arm untol is coll and tol is a
        // constant 0, so the rank key below is the shipped key with a constant spliced in.
        const _longD = days.find(d=>typeOf[d]===T.long);
        let coll = 0, _untol = 0, _tol = 0;
        for(let a=0;a<hardDays.length;a++) for(let b=a+1;b<hardDays.length;b++){
          if(circ(hardDays[a],hardDays[b])!==1) continue;
          coll++;
          const _x = hardDays[a], _y = hardDays[b];
          // Tolerated is a TYPED pair, not a position: s2 (CHI) sitting on prevDay of the
          // long run. prevDay is circular, so a Saturday CHI into a Sunday long counts and
          // a Sunday CHI after a Saturday long does not.
          const _chiEve = !!_longD && ((typeOf[_x]===T.s2 && _y===_longD && _x===prevDay(_longD))
                                    || (typeOf[_y]===T.s2 && _x===_longD && _y===prevDay(_longD)));
          if(_chiEve) _tol++; else _untol++;
        }
        const untol = paceFam ? _untol : coll;
        const tol   = paceFam ? _tol   : 0;
""")

# ── E1b. THE CANDIDATE CARRIES BOTH COUNTS ───────────────────────────────────
rep('E1b cand literal',
    "        const cand = {idxs, typeOf, coll, longLast, speedsAfterRest, recBeforeLong, canonical, identity, spread, qualRest, qualFirst};",
    "        const cand = {idxs, typeOf, coll, untol, tol, longLast, speedsAfterRest, recBeforeLong, canonical, identity, spread, qualRest, qualFirst};")

# ── E1c. THE RANK KEY ────────────────────────────────────────────────────────
rep('E1c rank key',
    "        const _rank = c => [-c.coll, c.longLast, c.speedsAfterRest, c.recBeforeLong, c.canonical, c.identity, c.spread, c.qualRest, c.qualFirst];",
    "        // V205 (D130 amended): rank 1 is -untol, rank 1b is -tol. Ranks 2..9 are\n"
    "        // unchanged and keep their shipped order. -c.coll is GONE from the key: a\n"
    "        // total that mixes a tolerated pair with an untolerated one cannot rank them.\n"
    "        const _rank = c => [-c.untol, -c.tol, c.longLast, c.speedsAfterRest, c.recBeforeLong, c.canonical, c.identity, c.spread, c.qualRest, c.qualFirst];")

# ── E2. THE CONDITIONAL CEILING READS UNTOLERATED ────────────────────────────
rep('E2 ceiling', """      // V205 (D125 amended): THE CONDITIONAL CEILING, DECIDED HERE. Four runs ship only
      // where the chooser hands back a layout with zero hard-day collisions. Where it
      // cannot, the week drops to three runs and is re-laid at three. This is the whole
      // shape of the amended ruling: a crowded four-run week is worse coaching than a
      // clean three-run one, so coll>0 at four is never shipped. Keyed on the chooser's
      // return alone — there is no day-count conjunct, and every count from 4 to 7 is
      // asked the same question. Measured across all 64 rest-day calendars: 50 reach
      // coll==0 at four and keep it; the 14 that cannot are all four-training-day weeks
      // and each falls back through this branch to the three-run week that shipped before
      // this ruling. The three-run layout itself is NOT touched here.
      if(_paceCapped && capDays > 3 && (!_pick || _pick.coll > 0)){""", """      // V205 (D125 amended, RE-KEYED BY D130): THE CONDITIONAL CEILING, DECIDED HERE.
      // Four runs ship only where the chooser hands back a layout with zero UNTOLERATED
      // hard-day adjacencies. Where it cannot, the week drops to three runs and is re-laid
      // at three. The shape of the ruling is unchanged — a crowded four-run week is worse
      // coaching than a clean three-run one — but D130 says what crowded means: a CHI on
      // the long run's eve is not crowding, and the total this line used to read could not
      // tell the two apart. Keyed on the chooser's return alone; there is no day-count
      // conjunct, and every count from 4 to 7 is asked the same question.
      // HISTORY, AND IT MATTERS. Under the unsplit total, 50 of the 64 rest-day calendars
      // reached coll==0 at four and 14 fell through here to three runs. Under the split,
      // untolerated is 0 on ALL 64 and the fallback fires on NONE of them: the 14 now ship
      // four runs paying exactly one tolerated CHI-on-eve, and the 50 are byte-identical
      // to what they shipped before, because {coll==0} and {untol==0 and tol==0} select
      // the same candidate. The branch stays live — it still guards a chooser that returns
      // nothing and any future calendar shape that cannot reach untol==0.
      if(_paceCapped && capDays > 3 && (!_pick || _pick.untol > 0)){""")

for tag, old, new in reps:
    c = src.count(old)
    print('%-18s count=%d' % (tag, c))
    if c != 1:
        sys.exit('ABORT: %s matched %d times, expected 1' % (tag, c))

for tag, old, new in reps:
    src = src.replace(old, new, 1)

io.open(PATH, 'w', encoding='utf-8').write(src)
print('WROTE', PATH, len(src), 'chars')
