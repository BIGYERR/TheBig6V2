#!/usr/bin/env python3
# V205 slice 3 — D125 (amended), the chooser half.
# The pace family (run_pace_goal + its two aliases) takes _nrcSpacedRunDays's FULL
# objective. Types come from getSessionTypes, HARD gains int/chi/lsd_long, the recovery
# test reads lsd_easy, the long test reads lsd_long, and the long run becomes a scored
# PREFERENCE (objective rank 2) instead of the hard subset pin NRC keeps.
# ia-version is NOT bumped in this slice (stays 204; the ceiling literal is slice 4).
import io, sys

P = 'index.html'
src = io.open(P, encoding='utf-8').read()
reps = []

def rep(tag, old, new):
    reps.append((tag, old, new))

# ── EDIT 1 — PACE_GOALS: the routing set for the NSW pace family ──────────────
rep('1_pace_goals_set',
"""const NRC_GOALS = new Set(['run_5k', 'run_10k', 'run_half', 'run_marathon']);
""",
"""const NRC_GOALS = new Set(['run_5k', 'run_10k', 'run_half', 'run_marathon']);
// V205 (D125): the NSW pace family — the test goals whose weekly shape is INT + CHI +
// long + easy. The wizard aliases run_mile_time / run_15_under10 to run_pace_goal before
// the engine sees a cfg (_GOAL_ALIAS, V126); both legacy ids are listed anyway so this
// set answers the question for a cfg from any era. run_base is NOT here: a Lydiard block
// has no hard day to space, so the spacing chooser has nothing to choose.
const PACE_GOALS = new Set(['run_pace_goal', 'run_mile_time', 'run_15_under10']);
""")

# ── EDIT 2a — the V153 carve-out comment, and the chooser's head ──────────────
rep('2a_head',
"""  // NON-NRC PATHS ARE DELIBERATELY NOT ROUTED HERE: their types come from the NSW smart
  // assignment, which already spaces quality, and widening this chooser would move day
  // placement on every capped solo-sport config for no measured defect.
  function _nrcSpacedRunDays(cardioTrainDays, capDays, goalId){
    const types = getNRCSessionTypes(capDays, goalId);
    const HARD = new Set(['nrc_speed1','nrc_speed2','nrc_long']);
""",
"""  // V205 (D125): THE PACE FAMILY IS NOW ROUTED HERE TOO. V153 withheld this chooser from
  // non-NRC goals "for no measured defect". There is one. The even-spread chooser picks
  // days by spacing alone and never revisits the choice, so at a four-day ceiling 5,775
  // of 5,775 four- and five-day weeks put two hard sessions back to back, and the
  // permutation oracle proves 0 of them are fixable by re-ordering types on the same
  // days — spaceHardCardio is handed a board with no legal move. The pace family takes
  // the FULL objective, not a collision-only variant: types come from getSessionTypes
  // (the NSW table) instead of the NRC tables, and the four scored terms below read the
  // NSW tokens. Lift cost does not enter here; the shape is run layout first, lift
  // placement second, which is what the NRC path already does.
  //
  // ONE DIFFERENCE, AND IT IS DOCTRINE. For NRC the long run is PINNED to the last
  // training day of the week: a race plan has a race day and the long run rehearses it.
  // A test goal has no race day, and a long run followed by two rest days is coaching-
  // good, so for the pace family the long run is a PREFERENCE ranked second, under
  // collisions. That relaxation is what buys a collision-free week on the mon+tue,
  // mon+thu, wed+thu, mon+tue+thu and mon+wed+thu calendars. NRC behaviour is unchanged:
  // its subset and permutation constraints still force longLast to 1 on every candidate,
  // so the new term is constant there and cannot reorder an NRC choice.
  function _nrcSpacedRunDays(cardioTrainDays, capDays, goalId, paceFam){
    const types = paceFam ? getSessionTypes(capDays, isSpeedGoal(goalId), false, false)
                          : getNRCSessionTypes(capDays, goalId);
    // The objective is written once, in tokens. The NSW table's quality pair is INT then
    // CHI, which is the same sequence NRC prints as speed1 then speed2.
    const T = paceFam
      ? {long:'lsd_long', rec:'lsd_easy',       s1:'int',        s2:'chi'}
      : {long:'nrc_long', rec:'nrc_recovery',   s1:'nrc_speed1', s2:'nrc_speed2'};
    const HARD = new Set([T.s1, T.s2, T.long]);
""")

# ── EDIT 2b — subset enumeration: the pin is NRC-only ─────────────────────────
rep('2b_subsets',
"""    const subsets = [];
    (function sub(start, acc){
      if(acc.length===capDays){ if(acc[acc.length-1]===n-1) subsets.push(acc.slice()); return; }
""",
"""    // V205 (D125): the pin above is NRC-only. For the pace family every subset is legal
    // and "long on the last training day" is scored instead (longLast, rank 2).
    const subsets = [];
    (function sub(start, acc){
      if(acc.length===capDays){ if(paceFam || acc[acc.length-1]===n-1) subsets.push(acc.slice()); return; }
""")

# ── EDIT 2c — the long-run permutation rule reads the token ───────────────────
rep('2c_perm',
"""        if(p.includes('nrc_long') && p[p.length-1] !== 'nrc_long') continue;
""",
"""        // V205 (D125): NRC pins the long run to the last CHOSEN run day, which the subset
        // rule above pins in turn to the last training day. The pace family carries neither
        // pin. Both were one constraint doing one job — put the long at the end of the week —
        // and a test goal has no race day to end the week on. Dropping the permutation rule
        // as well as the subset rule is what reaches coll=0 on a four-training-day week,
        // where the day set is forced and the long run's slot is the only lever left. The
        // preference is scored below as longLast, at rank 2, under collisions.
        if(!paceFam && p.includes(T.long) && p[p.length-1] !== T.long) continue;
""")

# ── EDIT 2d — scoring and the comparator ──────────────────────────────────────
rep('2d_score',
"""        const speeds = days.filter(d=>typeOf[d]==='nrc_speed1'||typeOf[d]==='nrc_speed2');
        const speedsAfterRest = speeds.filter(d=>!inTrain.has(prevDay(d))).length;
        const longDay = days.find(d=>typeOf[d]==='nrc_long');
        const recBeforeLong = longDay && days.some(d=>typeOf[d]==='nrc_recovery' && circ(d,longDay)===1 && pos(d)<pos(longDay)) ? 1 : 0;
        const s1 = days.find(d=>typeOf[d]==='nrc_speed1'), s2 = days.find(d=>typeOf[d]==='nrc_speed2');
        const canonical = (s1 && s2 && pos(s1)<pos(s2)) ? 1 : 0;
        const cand = {idxs, typeOf, coll, speedsAfterRest, recBeforeLong, canonical};
        if(!best
          || cand.coll < best.coll
          || (cand.coll===best.coll && cand.speedsAfterRest > best.speedsAfterRest)
          || (cand.coll===best.coll && cand.speedsAfterRest===best.speedsAfterRest && cand.recBeforeLong > best.recBeforeLong)
          || (cand.coll===best.coll && cand.speedsAfterRest===best.speedsAfterRest && cand.recBeforeLong===best.recBeforeLong && cand.canonical > best.canonical)
        ) best = cand;
""",
"""        const speeds = days.filter(d=>typeOf[d]===T.s1||typeOf[d]===T.s2);
        const speedsAfterRest = speeds.filter(d=>!inTrain.has(prevDay(d))).length;
        const longDay = days.find(d=>typeOf[d]===T.long);
        const recBeforeLong = longDay && days.some(d=>typeOf[d]===T.rec && circ(d,longDay)===1 && pos(d)<pos(longDay)) ? 1 : 0;
        // Rank 2. Always 1 on the NRC path (the subset and permutation rules above make
        // it so), a real preference on the pace family.
        const longLast = (!longDay || longDay===cardioTrainDays[n-1]) ? 1 : 0;
        const s1 = days.find(d=>typeOf[d]===T.s1), s2 = days.find(d=>typeOf[d]===T.s2);
        const canonical = (s1 && s2 && pos(s1)<pos(s2)) ? 1 : 0;
        const cand = {idxs, typeOf, coll, longLast, speedsAfterRest, recBeforeLong, canonical};
        // Objective order, highest first: fewest collisions, long on the last training
        // day, speeds after a rest day, a recovery run padding the long, canonical
        // speed order. Ties keep the incumbent, so enumeration order is the last
        // tiebreak and the chooser stays deterministic with no seed.
        const _rank = c => [-c.coll, c.longLast, c.speedsAfterRest, c.recBeforeLong, c.canonical];
        if(!best) best = cand;
        else {
          const ka = _rank(cand), kb = _rank(best);
          for(let i=0;i<ka.length;i++){ if(ka[i]!==kb[i]){ if(ka[i]>kb[i]) best = cand; break; } }
        }
""")

# ── EDIT 3 — routing: the pace family enters the chooser ──────────────────────
rep('3_routing',
"""    const _nrcCapped = NRC_GOALS.has(_soloRunGoal) && capDays<nCardio && capDays>=2;   // V186: all four NRC goals
    if(_nrcCapped){
      const _pick = _nrcSpacedRunDays(cardioTrainDays, capDays, _soloRunGoal);
""",
"""    const _nrcCapped = NRC_GOALS.has(_soloRunGoal) && capDays<nCardio && capDays>=2;   // V186: all four NRC goals
    // V205 (D125): same gate for the NSW pace family. Capped below the week is still the
    // only case where a choice exists; run_base and every bike/swim goal keep the
    // even-spread fallback below, untouched.
    const _paceCapped = PACE_GOALS.has(_soloRunGoal) && capDays<nCardio && capDays>=2;
    if(_nrcCapped || _paceCapped){
      const _pick = _nrcSpacedRunDays(cardioTrainDays, capDays, _soloRunGoal, _paceCapped);
""")

# ── EDIT 4 — the NSW type loop honours the joint plan ─────────────────────────
rep('4_types_honour_plan',
"""        let st = isLastSportDay ? 'lsd_long' : (types[sportIdx] || 'lsd_easy');
""",
"""        // V205 (D125): the chooser's joint day+type plan wins OUTRIGHT when it ran —
        // including over the last-day default. That default is the old pin restated, and
        // under D125 the pace family's long run may sit mid-week to buy a collision-free
        // one. Where the chooser did not run (run_base, bike, swim, uncapped weeks) the
        // default stands untouched and the long run is still the last session of the week.
        const _planned = _nrcPlan && _nrcPlan[cardioTrainDays[globalDayIdx]];
        let st = _planned || (isLastSportDay ? 'lsd_long' : (types[sportIdx] || 'lsd_easy'));
""")

fail = False
for tag, old, new in reps:
    c = src.count(old)
    print('anchor %-22s count=%d' % (tag, c))
    if c != 1:
        fail = True
if fail:
    sys.exit('ABORT: anchor miss, nothing written')
for tag, old, new in reps:
    src = src.replace(old, new, 1)
io.open(P, 'w', encoding='utf-8').write(src)
print('WROTE %s (%d bytes)' % (P, len(src)))
