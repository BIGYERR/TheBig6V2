#!/usr/bin/env python3
# V205 slice 7b — GATE RE-KEYING ONLY. index.html is NOT touched; ia-version stays 204.
#
# D130 splits rank 1 on the pace arm into UNTOLERATED and TOLERATED adjacency, and
# re-keys the conditional ceiling onto `_pick.untol`. Nine assertion rows across two
# gate files assert the D125-era shape D130 supersedes. Session scope call: RE-KEY,
# DO NOT RETIRE — the superseded rows carry the four-versus-three DECISION coverage
# that g205_d130_typed only pins at source level.
#
# TASK 1 (g205_d125_ceiling): P2, P3, P3e, P3f, P4, P6, P6b.
# TASK 2 (g205_d125_spaced):  P7, P8.
import io, os, sys

ROOT = '/Users/CanasBangin/Desktop/TheBig6V2'
CEIL = os.path.join(ROOT, 'tests', 'gates', 'g205_d125_ceiling.js')
SPCD = os.path.join(ROOT, 'tests', 'gates', 'g205_d125_spaced.js')

edits = []   # (path, old, new, label)

def rep(path, old, new, label):
    edits.append((path, old, new, label))

# ────────────────────────────────────────────────────────────────────────────────────
# TASK 1 — g205_d125_ceiling.js
# ────────────────────────────────────────────────────────────────────────────────────

# 1a. the header: what the oracles now assert.
rep(CEIL, """//   * P2 is an EXHAUSTIVE SEARCH written in this file. For each of the 64 rest-day
//     calendars it enumerates every subset of training days of size four crossed with
//     every permutation of the NSW four-day type row, and asks whether ANY layout reaches
//     zero hard-day collisions. That question is pure combinatorics over a hand-written
//     adjacency rule; the engine is never consulted to answer it. The engine must deal
//     four runs exactly where the search says four is reachable and three exactly where
//     it is not.
//   * P1 and P3 are the RULING'S AFTER-GRID typed in as literals: 50 of 64 calendars take
//     four runs (21/35 at four training days, 21/21, 7/7, 1/1), and the 14 that fall back
//     are named, one calendar per line.
//   * P4 is the SHIPPED WEEK read back by content: no week the engine builds, four-run or
//     three-run, may carry two hard runs on adjacent calendar days.
//   * P5 is MARIO's own calendar, hand-written from the ruling.
//   * P6 is the FALLBACK's shape: the 14 losers get three runs on every seed and in every
//     built week, never four. This is the row that a missing fallback turns red.
//   * P7 is SCOPE: the multi-sport path never reaches a chooser, so it has no coll===0 to
//     key on and the ruling's fallback holds there at three. run_base, NRC and bike/swim
//     are untouched.""",
"""//   * P2 is an EXHAUSTIVE SEARCH written in this file. For each of the 64 rest-day
//     calendars it enumerates every subset of training days of size four crossed with
//     every permutation of the NSW four-day type row, and asks whether ANY layout reaches
//     zero UNTOLERATED hard-day adjacencies. That question is pure combinatorics over a
//     hand-written adjacency rule and a hand-written tolerated pair; the engine is never
//     consulted to answer it. The engine must deal four runs exactly where the search
//     says untolerated zero is reachable, and three exactly where it is not.
//   * P1 and P3 are the RULING'S AFTER-GRID typed in as literals. Under D130 that grid
//     moved: 64 of 64 calendars take four runs (35/35 at four training days, 21/21, 7/7,
//     1/1). The 50-versus-14 split SURVIVES, on the axis it belongs on — 50 calendars
//     land (untol 0, tol 0) and 14 land (untol 0, tol 1), and those 14 are still named
//     here one calendar per line. They are no longer the calendars that fall back;
//     nothing falls back on single-sport pace any more, and P3f says so.
//   * P4 is the SHIPPED WEEK read back by content, swept 64 calendars x 3 seeds x every
//     built week: 6,336 hard-run pairs, of which ZERO may be untolerated, and every
//     tolerated one must belong to one of the 14.
//   * P5 is MARIO's own calendar, hand-written from the ruling.
//   * P6 is THE 14, re-keyed: the calendars that used to fall back now ship four runs on
//     every seed and in every built week, each paying exactly one tolerated CHI-on-eve
//     and never an untolerated adjacency. P6c keeps the three-run coverage alive where it
//     is still REACHED — multi-sport pace, measured 29 of 64 calendars on run+bike and
//     29 of 64 on run+swim, because multiSportTargets takes max() of the leg ceilings and
//     the chooser never runs on a multi-sport week.
//   * P7 is SCOPE: the multi-sport path never reaches a chooser, so it has no untol===0 to
//     key on and the ruling's fallback holds there at three. run_base, NRC and bike/swim
//     are untouched.""", 'CEIL header oracles')

# 1b. the scorer: collide() and fourIsReachable() become classify() and bestFour().
rep(CEIL, """function collide(days, types){
  const h = days.filter((d, i) => HARD.has(types[i]));
  for(let a = 0; a < h.length; a++) for(let b = a+1; b < h.length; b++) if(adj(h[a], h[b])) return true;
  return false;
}
// THE ORACLE: is a four-run, collision-free week reachable on this training calendar?
const FOUR_PERMS = perms(FOUR_ROW);
function fourIsReachable(train){
  return combos(train, 4).some(sub => FOUR_PERMS.some(p => !collide(sub, p)));
}""",
"""// D130: TWO HARD DAYS SIDE BY SIDE ARE NOT ONE THING. CHI on the EVE of the long run is
// TOLERATED — the long run is relative recovery under Guide A p.11, so a tempo the day
// before it is a legal pairing and not a collision to design out. Every other adjacency
// is UNTOLERATED. The pair is TYPED and DIRECTIONAL, not positional: prevDay is circular,
// so a Saturday CHI into a Sunday long counts and a Sunday CHI after a Saturday long does
// not. Written here from the ruling's prose; the engine is never asked.
const prevDay = d => ISO[(ISO.indexOf(d) + 6) % 7];
function classify(days, types){
  const typeOf = {}; days.forEach((d, i) => typeOf[d] = types[i]);
  const h = days.filter(d => HARD.has(typeOf[d]));
  const L = days.find(d => typeOf[d] === 'lsd_long');
  let untol = 0, tol = 0;
  for(let a = 0; a < h.length; a++) for(let b = a+1; b < h.length; b++){
    if(!adj(h[a], h[b])) continue;
    const x = h[a], y = h[b];
    const chiEve = !!L && ((typeOf[x] === 'chi' && y === L && x === prevDay(L))
                        || (typeOf[y] === 'chi' && x === L && y === prevDay(L)));
    if(chiEve) tol++; else untol++;
  }
  return { untol, tol };
}
// THE ORACLE: the best (untolerated, tolerated) pair a four-run week can reach on this
// training calendar, lexicographic, untolerated first. Four runs ship exactly where the
// untolerated half of that floor is zero.
const FOUR_PERMS = perms(FOUR_ROW);
function bestFour(train){
  let b = null;
  combos(train, 4).forEach(sub => FOUR_PERMS.forEach(p => {
    const s = classify(sub, p);
    if(!b || s.untol < b.untol || (s.untol === b.untol && s.tol < b.tol)) b = s;
  }));
  return b;
}""", 'CEIL classify/bestFour')

# 1c. P3 after-grid literals.
rep(CEIL, """const AFTER = { 4: { four: 21, tot: 35 }, 5: { four: 21, tot: 21 }, 6: { four: 7, tot: 7 }, 7: { four: 1, tot: 1 } };
// The 14 fallback calendars, named in the ruling. Rest days, sorted week order.
const FALLBACK = [""",
"""// D130 moved this grid: every calendar reaches untolerated zero at four runs, so every
// calendar takes four. Before D130 this read 21/35 at four training days.
const AFTER = { 4: { four: 35, tot: 35 }, 5: { four: 21, tot: 21 }, 6: { four: 7, tot: 7 }, 7: { four: 1, tot: 1 } };
// THE 14, named in the ruling. Before D130 these were the calendars that fell back to
// three runs. Under D130 they are the calendars whose four-run floor is (untol 0, tol 1):
// they ship four runs and pay exactly one tolerated CHI-on-eve. Same 14 calendars, same
// literal, a different claim. Rest days, sorted week order.
const TOL14 = [""", 'CEIL AFTER + TOL14 rename')

# 1d. the sweep loop: P2 keys on untolerated, and the (0,1) floor is recorded for P3f.
rep(CEIL, """const oracleMismatch = [], dirtyWeeks = [], fellBack = [];""",
"""const oracleMismatch = [], fellBack = [], tolFloor = [];""", 'CEIL loop decls')

rep(CEIL, """  // P2: the engine's count must equal the oracle's verdict.
  const reachable = fourIsReachable(train);
  if((days.length === 4) !== reachable)
    oracleMismatch.push(key + ' engine=' + days.length + ' runs, exhaustive search says four is ' +
                        (reachable ? 'REACHABLE' : 'IMPOSSIBLE'));
  // P4: whatever shipped must be collision free.
  if(collide(days, days.map(d => lay[d])))
    dirtyWeeks.push(key + ' -> ' + days.map(d => d + ':' + lay[d]).join(' '));
}));""",
"""  // P2: the engine's count must equal the oracle's verdict, and the verdict is now keyed
  // on the UNTOLERATED half of the floor alone. A calendar that can only reach untol 0 by
  // paying a tolerated CHI-on-eve still gets four runs; that is the whole of D130.
  const floor = bestFour(train);
  const reachable = floor.untol === 0;
  if((days.length === 4) !== reachable)
    oracleMismatch.push(key + ' engine=' + days.length + ' runs, exhaustive search says untolerated zero at four is ' +
                        (reachable ? 'REACHABLE' : 'IMPOSSIBLE'));
  // P3f: the calendars whose floor is (0,1) — untolerated clean, one tolerated pair paid.
  if(floor.untol === 0 && floor.tol > 0) tolFloor.push(key);
}));""", 'CEIL loop body')

# 1e. P3e and P3f.
rep(CEIL, """ok('P3e 50 of the 64 rest-day calendars take four runs', seen[4].four + seen[5].four + seen[6].four + seen[7].four === 50,
   seen[4].four + seen[5].four + seen[6].four + seen[7].four);
ok('P3f the 14 fallback calendars are exactly the ones the ruling names',
   fellBack.slice().sort().join(' | ') === FALLBACK.slice().sort().join(' | '),
   fellBack.slice().sort().join(' | '));""",
"""ok('P3e all 64 rest-day calendars take four runs (was 50 of 64 before D130 split rank 1)',
   seen[4].four + seen[5].four + seen[6].four + seen[7].four === 64,
   seen[4].four + seen[5].four + seen[6].four + seen[7].four);
// RE-KEYED, NOT RETIRED. The old claim was "the 14 that fall back are exactly these".
// D130 empties the fallback on single-sport pace, so the row now carries BOTH halves of
// what replaced it: nothing falls back, AND the same 14 named calendars are exactly the
// ones whose four-run floor costs one tolerated CHI-on-eve. Deleting the row would have
// dropped the 14-calendar literal, which is the only hand-written name list in this file.
ok('P3f D130 empties the fallback on single-sport pace, and the 14 the ruling names are exactly the calendars whose four-run floor is (untol 0, tol 1)',
   fellBack.length === 0 && tolFloor.slice().sort().join(' | ') === TOL14.slice().sort().join(' | '),
   'fellBack=[' + fellBack.join(' ') + '] floor(0,1)=' + tolFloor.slice().sort().join(' | '));""", 'CEIL P3e/P3f')

# 1f. P4 — swept, and split.
rep(CEIL, """// ── P4 nothing crowded ever ships ────────────────────────────────────────────────────
ok('P4 no shipped week carries two hard runs on adjacent calendar days (64 calendars)',
   dirtyWeeks.length === 0, dirtyWeeks.join(' | '));""",
"""// ── P4 nothing UNTOLERATED ever ships, anywhere ──────────────────────────────────────
// Widened from 64 week-1 layouts to 64 calendars x 3 seeds x every built week, because
// D130's claim is about a pair type and the later weeks swap INT and CHI in place: if
// that swap ever put INT on the long run's eve it would be an untolerated adjacency in a
// week nobody looked at. Denominator is hard-run PAIRS examined, not weeks.
{
  const SEEDS = [1001, 4004, 7007];
  let pairs = 0, untol = 0, tol = 0, weeks = 0; const stray = [], strayCal = {};
  [3,2,1,0].forEach(nRest => combos(DAYS, nRest).forEach(rest => {
    const key = rest.join(',') || 'none';
    SEEDS.forEach(seed => {
      const prog = IA.buildProgram(paceCfg(rest, seed));
      Object.keys(prog.weeks).forEach(wk => {
        const lay = runLayout(prog.weeks[wk]);
        const days = DAYS.filter(d => lay[d]);
        const h = days.filter(d => HARD.has(lay[d]));
        weeks++;
        pairs += h.length * (h.length - 1) / 2;
        const s = classify(days, days.map(d => lay[d]));
        untol += s.untol; tol += s.tol;
        if(s.untol > 0 && stray.length < 6) stray.push(key + ' seed' + seed + ' wk' + wk + ' -> ' + days.map(d => d + ':' + lay[d]).join(' '));
        if(s.tol > 0) strayCal[key] = 1;
      });
    });
  }));
  ok('P4 no built pace week carries an untolerated hard-run adjacency (' + pairs + ' hard-run pairs over ' + weeks + ' weeks)',
     pairs === 6336 && untol === 0, untol + ' untolerated: ' + stray.join(' | '));
  ok('P4b every tolerated adjacency that ships belongs to one of the 14, and no other calendar pays one',
     Object.keys(strayCal).sort().join(' | ') === TOL14.slice().sort().join(' | '),
     tol + ' tolerated across ' + Object.keys(strayCal).length + ' calendars: ' + Object.keys(strayCal).sort().join(' | '));
}""", 'CEIL P4')

# 1g. P6 / P6b re-keyed, P6c keeps the three-run coverage where it is still reached.
rep(CEIL, """{
  const SEEDS = [1001, 4004, 7007];
  let weeks = 0, over = 0, dirty = 0;
  FALLBACK.forEach(key => {
    const rest = key.split(',');
    SEEDS.forEach(seed => {
      const prog = IA.buildProgram(paceCfg(rest, seed));
      Object.keys(prog.weeks).forEach(wk => {
        const lay = runLayout(prog.weeks[wk]);
        const days = DAYS.filter(d => lay[d]);
        weeks++;
        if(days.length !== 3) over++;
        if(collide(days, days.map(d => lay[d]))) dirty++;
      });
    });
  });
  ok('P6 every fallback calendar builds exactly three runs in every week (' + weeks + ' weeks)', over === 0, over + ' off three');
  ok('P6b and every one of those three-run weeks is collision free', dirty === 0, dirty + ' crowded');
}""",
"""{
  const SEEDS = [1001, 4004, 7007];
  let weeks = 0, offFour = 0, untol = 0, tolWrong = 0;
  TOL14.forEach(key => {
    const rest = key.split(',');
    SEEDS.forEach(seed => {
      const prog = IA.buildProgram(paceCfg(rest, seed));
      Object.keys(prog.weeks).forEach(wk => {
        const lay = runLayout(prog.weeks[wk]);
        const days = DAYS.filter(d => lay[d]);
        weeks++;
        if(days.length !== 4) offFour++;
        const s = classify(days, days.map(d => lay[d]));
        untol += s.untol;
        if(s.tol !== 1) tolWrong++;
      });
    });
  });
  ok('P6 the 14 build exactly four runs in every week on every seed (' + weeks + ' weeks, was three before D130)',
     weeks === 462 && offFour === 0, offFour + ' off four of ' + weeks);
  ok('P6b and every one of those weeks pays exactly one tolerated CHI-on-eve and nothing untolerated',
     untol === 0 && tolWrong === 0, untol + ' untolerated, ' + tolWrong + ' weeks not at exactly one tolerated');
}
// ── P6c the three-run layout is not dead — it moved to multi-sport pace ──────────────
// D130 means no SINGLE-sport pace program falls back to three runs, so the four-versus-
// three decision would have no live coverage at all if this row did not exist. It does
// have one: multiSportTargets takes max() of the leg ceilings and then trims for the lift
// floor, and the chooser never runs on a multi-sport week, so getSessionTypes' three-day
// row is still reached. Measured, built, both sports: 29 of 64 calendars each.
{
  const want = { bike: 29, swim: 29 };
  const got = {}, dirty = [];
  ['bike','swim'].forEach(other => {
    let three = 0;
    [3,2,1,0].forEach(nRest => combos(DAYS, nRest).forEach(rest => {
      const ms = paceCfg(rest, 1001);
      ms.cardioTypes = ['run', other];
      ms.cardioGoals = { run: ms.cardioGoals.run, bike:{ id:'bike_base', label:'Base', baselineDist:'10', baseline:'10mi' },
        swim:{ id:'swim_base', label:'Base', baselineDist:'1000', baseline:'1000m' } };
      delete ms.cardioGoals[other === 'bike' ? 'swim' : 'bike'];
      const lay = runLayout(IA.buildProgram(ms).weeks['1']);
      const days = DAYS.filter(d => lay[d]);
      if(days.length === 3){
        three++;
        const s = classify(days, days.map(d => lay[d]));
        if(s.untol > 0 && dirty.length < 6) dirty.push(other + ' ' + (rest.join(',') || 'none') + ' -> ' + days.map(d => d + ':' + lay[d]).join(' '));
      }
    }));
    got[other] = three;
  });
  ok('P6c multi-sport pace still reaches the three-run week on 29 of 64 calendars for run+bike and run+swim',
     got.bike === want.bike && got.swim === want.swim, 'bike ' + got.bike + '/64, swim ' + got.swim + '/64');
  ok('P6d and every one of those three-run weeks is free of untolerated adjacency',
     dirty.length === 0, dirty.join(' | '));
}""", 'CEIL P6/P6b/P6c')

# ────────────────────────────────────────────────────────────────────────────────────
# TASK 2 — g205_d125_spaced.js
# ────────────────────────────────────────────────────────────────────────────────────

# 2a. the header objective: rank 1 is split.
rep(SPCD, """//   1. collisions minimised            (no two HARD runs on adjacent calendar days)""",
"""//   1. UNTOLERATED adjacencies minimised, and (V205, D130) that is not the same as
//      collisions minimised: CHI on the EVE of the long run is TOLERATED, every other
//      hard-day adjacency is untolerated.
//   1b. tolerated adjacencies minimised, under rank 1 and never traded against it.""", 'SPCD header rank 1')

# 2b. the oracle's rank head.
rep(SPCD, """      const hard = days.filter(d=>d && [T.s1,T.s2,T.long].indexOf(typeOf[d])>=0);
      let coll = 0;
      for(let a=0;a<hard.length;a++) for(let b=a+1;b<hard.length;b++) if(circ(hard[a],hard[b])===1) coll++;""",
"""      const hard = days.filter(d=>d && [T.s1,T.s2,T.long].indexOf(typeOf[d])>=0);
      // V205 (D130) SPLITS THIS ORACLE'S RANK HEAD, and it had to be split or it would go
      // on printing PASS while scoring a different objective from the engine. P1 and P8
      // only ever see rows where the day set is NOT forced, and on those rows untol==0
      // and tol==0 together, so -coll and [-untol,-tol] agree and the disagreement is
      // invisible. It is still the wrong objective. NRC IS UNCHANGED BY CONSTRUCTION:
      // off the pace template chiEve is false, so untol===coll and tol===0, and
      // [-coll, 0, ...] orders exactly as the shipped [-coll, ...] did.
      let coll = 0, untol = 0, tol = 0;
      for(let a=0;a<hard.length;a++) for(let b=a+1;b<hard.length;b++){
        if(circ(hard[a],hard[b])!==1) continue;
        coll++;
        const _x = hard[a], _y = hard[b];
        const chiEve = T === TP && !!longDay
          && ((typeOf[_x]===T.s2 && _y===longDay && _x===prevDay(longDay))
           || (typeOf[_y]===T.s2 && _x===longDay && _y===prevDay(longDay)));
        if(chiEve) tol++; else untol++;
      }""", 'SPCD space() split')

rep(SPCD, """      out.push({ days, typeOf, coll, rank:[-coll, ll, sar, rbl, (s1&&s2&&pos(s1)<pos(s2))?1:0] });""",
"""      out.push({ days, typeOf, coll, untol, tol, rank:[-untol, -tol, ll, sar, rbl, (s1&&s2&&pos(s1)<pos(s2))?1:0] });""",
'SPCD rank vector')

# 2c. P7 split, and the 14 literal it needs.
rep(SPCD, """let wkTot = 0, collHits = 0, p8rows = 0, p8bad = 0, p8skip = 0; const p8detail = [];""",
"""// THE 14, typed from the ruling: the calendars whose four-run floor is (untol 0, tol 1).
// Same literal as g205_d125_ceiling's TOL14, and deliberately duplicated rather than
// imported — a shared constant would let one edit move both oracles at once.
const TOL14 = [
  'sun,mon,tue', 'sun,mon,thu', 'sun,mon,sat', 'sun,wed,thu', 'sun,wed,sat',
  'sun,fri,sat', 'mon,tue,wed', 'mon,tue,fri', 'mon,thu,fri', 'tue,wed,thu',
  'tue,wed,sat', 'tue,fri,sat', 'wed,thu,fri', 'thu,fri,sat'
];
let wkTot = 0, untolHits = 0, tolHits = 0, p8rows = 0, p8bad = 0, p8skip = 0;
const p8detail = [], tolCals = {};""", 'SPCD P7 decls')

rep(SPCD, """    const hard = Object.keys(lay).filter(d => ['int','chi','lsd_long'].indexOf(lay[d]) >= 0);
    for(let a=0;a<hard.length;a++) for(let b=a+1;b<hard.length;b++) if(circ(hard[a],hard[b])===1) collHits++;""",
"""    const hard = Object.keys(lay).filter(d => ['int','chi','lsd_long'].indexOf(lay[d]) >= 0);
    const longD = Object.keys(lay).find(d => lay[d] === 'lsd_long');
    for(let a=0;a<hard.length;a++) for(let b=a+1;b<hard.length;b++){
      if(circ(hard[a],hard[b])!==1) continue;
      const _x = hard[a], _y = hard[b];
      const chiEve = !!longD && ((lay[_x]==='chi' && _y===longD && _x===prevDay(longD))
                              || (lay[_y]==='chi' && _x===longD && _y===prevDay(longD)));
      if(chiEve){ tolHits++; tolCals[rest.join(',') || 'none'] = 1; } else untolHits++;
    }""", 'SPCD P7 loop')

rep(SPCD, """ok('P7 no hard-run collisions in any built pace week (' + wkTot + ' weeks)', wkTot > 400 && collHits === 0, collHits + ' collisions');""",
"""// RE-KEYED BY D130. The old claim was "0 collisions over 704 weeks". Under the split the
// untolerated half must still be exactly zero; the tolerated half is not zero and is not
// supposed to be, so the row pins WHERE it is allowed to appear instead of forbidding it.
ok('P7 no built pace week carries an untolerated hard-run adjacency (' + wkTot + ' weeks)',
   wkTot > 400 && untolHits === 0, untolHits + ' untolerated');
ok('P7b every tolerated CHI-on-eve that ships belongs to one of the 14 named calendars, and no other calendar pays one',
   tolHits > 0 && Object.keys(tolCals).sort().join(' | ') === TOL14.slice().sort().join(' | '),
   tolHits + ' tolerated across ' + Object.keys(tolCals).length + ' calendars: ' + Object.keys(tolCals).sort().join(' | '));""",
'SPCD P7')

# 2d. P8's vacuity guard, re-scaled not removed.
rep(SPCD, """ok('P8 the built week the athlete gets is rank-optimal (' + p8rows + ' calendars, ' + p8skip + ' uncapped/skipped)',
   p8rows > 30 && p8bad === 0, p8bad + ' suboptimal: ' + p8detail.join(' | '));""",
"""// THE GUARD IS RE-SCALED, NOT REMOVED (V205, D130). This row skips any calendar whose
// built run count equals its training-day count, because there is no choice to be optimal
// about. D130 stopped every single-sport pace calendar from falling back to three, so the
// four-training-day calendars all became uncapped and the capped population went 35 -> 29.
// The claim itself never failed: p8bad has been 0 throughout. A vacuity guard reading a
// population a ruling legitimately shrank gets re-scaled to the new floor; deleting it
// would leave the row able to pass on an empty set.
ok('P8 the built week the athlete gets is rank-optimal (' + p8rows + ' calendars, ' + p8skip + ' uncapped/skipped)',
   p8rows > 25 && p8bad === 0, p8bad + ' suboptimal of ' + p8rows + ' rows: ' + p8detail.join(' | '));""",
'SPCD P8 guard')

# ────────────────────────────────────────────────────────────────────────────────────
# apply: every anchor count==1 BEFORE anything is written; abort whole script on first miss
# ────────────────────────────────────────────────────────────────────────────────────
src = {}
for p in (CEIL, SPCD):
    with io.open(p, 'r', encoding='utf-8') as f:
        src[p] = f.read()

fails = []
for path, old, new, label in edits:
    n = src[path].count(old)
    print('anchor %-28s count=%d  %s' % (label, n, os.path.basename(path)))
    if n != 1:
        fails.append('%s: count=%d (need 1)' % (label, n))
    src[path] = src[path].replace(old, new, 1)

# the rename TOL14 must leave no FALLBACK reference behind
leftover = src[CEIL].count('FALLBACK') + src[CEIL].count('fourIsReachable') + src[CEIL].count('collide(') + src[CEIL].count('dirtyWeeks')
print('leftover old symbols in ceiling gate: %d' % leftover)
if leftover: fails.append('ceiling gate still references FALLBACK/fourIsReachable/collide/dirtyWeeks: %d' % leftover)
left2 = src[SPCD].count('collHits')
print('leftover collHits in spaced gate: %d' % left2)
if left2: fails.append('spaced gate still references collHits: %d' % left2)

if fails:
    sys.stderr.write('ABORTED, nothing written:\n  ' + '\n  '.join(fails) + '\n')
    sys.exit(1)

for p in (CEIL, SPCD):
    with io.open(p, 'w', encoding='utf-8') as f:
        f.write(src[p])
print('WROTE %s\nWROTE %s' % (CEIL, SPCD))
