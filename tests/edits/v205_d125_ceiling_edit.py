#!/usr/bin/env python3
# V205 slice 6 — D125 (amended), THE CEILING.
# The NSW pace family's weekly run ceiling goes 3 -> 4, CONDITIONALLY: four runs ship
# wherever the spacing chooser returns a collision-free layout (coll == 0), and the week
# falls back to three runs wherever it cannot. Keyed on the chooser's return alone, at
# every training-day count from 4 to 7. No day-count conjunct.
#
# ia-version is NOT bumped by this slice (stays 204; V205 is assembled across slices).
import io, sys

P = 'index.html'
src = io.open(P, encoding='utf-8').read()

EDITS = []

# ── EDIT 1: the ceiling literal, 3 -> 4 for the pace family ──────────────────────────
EDITS.append((
"""    run_5k: 4, run_10k: 4, run_base: 4, run_pace_goal: 3, run_mile_time: 3, run_15_under10: 3,""",
"""    // run_pace_goal: 4 (V205, D125 amended) — was 3. NSW Table 7 scales a pace block by
    // adding aerobic volume, and the fourth run is that volume: easy / INT / CHI / long.
    // The fourth run is CONDITIONAL on the spacing chooser returning a collision-free
    // layout; where it cannot, the consumer below and the caller in buildProgram fall the
    // week back to three. run_mile_time and run_15_under10 are aliased to run_pace_goal by
    // _GOAL_ALIAS before the engine reads a goal id, so these two rows are never consulted
    // — they move with it so the table cannot read as a contradiction.
    run_5k: 4, run_10k: 4, run_base: 4, run_pace_goal: 4, run_mile_time: 4, run_15_under10: 4,"""))

# ── EDIT 2: the ceiling consumer — four only where a chooser exists to prove it ───────
EDITS.append((
"""    // Cap sport days to its specific structural ceiling
    targets[t] = Math.min(ceiling, totalDays);""",
"""    // V205 (D125 amended): the pace family's fourth run is conditional on the spacing
    // chooser returning a collision-free layout, and that chooser only runs on a SOLO
    // cardio week. A multi-sport week never reaches it, so there is no coll==0 to key on
    // and the ruling's own fallback applies: the pace ceiling stays 3 there. Bike and swim
    // are untouched on both paths. Both callers (wizard nudge and engine) read this, so
    // the nudge cannot promise a fourth run the engine will not deal.
    const _ceil = (PACE_GOALS.has(goalId) && cardioTypes.length !== 1) ? Math.min(ceiling, 3) : ceiling;
    // Cap sport days to its specific structural ceiling
    targets[t] = Math.min(_ceil, totalDays);"""))

# ── EDIT 3: the pace gate — the chooser must run when the day set is FORCED ───────────
# At four training days the ceiling is now four, so capDays == nCardio and the day subset
# has no freedom left. The type permutation still does, and that permutation is the only
# lever that reaches coll == 0 on a four-training-day week. capDays becomes reassignable
# so the fallback below can drop it.
EDITS.append((
"""    const capDays = Math.min(_alloc.targets[solo] || nCardio, nCardio);""",
"""    let capDays = Math.min(_alloc.targets[solo] || nCardio, nCardio);"""))

EDITS.append((
"""    const _paceCapped = PACE_GOALS.has(_soloRunGoal) && capDays<nCardio && capDays>=2;""",
"""    // V205 (D125 amended): the pace gate is <= nCardio, not < nCardio. With the ceiling
    // at 4 a four-training-day week has capDays === nCardio and its day SET is forced, but
    // the long run's slot is not, and on a forced day set that permutation is the only
    // lever that reaches coll==0. Routing it to the even-spread fallback instead would
    // deal the table row blind and ship the collisions D125 exists to remove. NRC keeps
    // the strict < nCardio gate above: its subset and permutation pins leave a forced day
    // set with nothing to choose.
    const _paceCapped = PACE_GOALS.has(_soloRunGoal) && capDays<=nCardio && capDays>=2;"""))

# ── EDIT 4: the conditional fallback — a collision-dirty four-run week never ships ────
EDITS.append((
"""    if(_nrcCapped || _paceCapped){
      const _pick = _nrcSpacedRunDays(cardioTrainDays, capDays, _soloRunGoal, _paceCapped);
      _pick.idxs.forEach(i=>chosen.add(i));
      _nrcPlan = _pick.typeOf;   // read by the NRC type-assignment loop below
    } else if(capDays >= nCardio) {""",
"""    if(_nrcCapped || _paceCapped){
      let _pick = _nrcSpacedRunDays(cardioTrainDays, capDays, _soloRunGoal, _paceCapped);
      // V205 (D125 amended): THE CONDITIONAL CEILING, DECIDED HERE. Four runs ship only
      // where the chooser hands back a layout with zero hard-day collisions. Where it
      // cannot, the week drops to three runs and is re-laid at three. This is the whole
      // shape of the amended ruling: a crowded four-run week is worse coaching than a
      // clean three-run one, so coll>0 at four is never shipped. Keyed on the chooser's
      // return alone — there is no day-count conjunct, and every count from 4 to 7 is
      // asked the same question. Measured across all 64 rest-day calendars: 50 reach
      // coll==0 at four and keep it; the 14 that cannot are all four-training-day weeks
      // and each falls back through this branch to the three-run week that shipped before
      // this ruling. The three-run layout itself is NOT touched here.
      if(_paceCapped && capDays > 3 && (!_pick || _pick.coll > 0)){
        capDays = 3;
        _pick = _nrcSpacedRunDays(cardioTrainDays, capDays, _soloRunGoal, _paceCapped);
      }
      if(_pick){
        _pick.idxs.forEach(i=>chosen.add(i));
        _nrcPlan = _pick.typeOf;   // read by the NRC type-assignment loop below
      } else {
        // Unreachable on the pace arm (every subset is legal there, so `best` is always
        // set) and unreachable on NRC at capDays>=2. Kept so a future arm that can return
        // null degrades to the even-spread fallback instead of throwing.
        for(let k = 0; k < capDays; k++) chosen.add(Math.round(k * (nCardio - 1) / (capDays - 1)));
      }
    } else if(capDays >= nCardio) {"""))

for i, (old, new) in enumerate(EDITS, 1):
    c = src.count(old)
    print('anchor %d: count=%d  (+%d bytes)' % (i, c, len(new) - len(old)))
    if c != 1:
        sys.exit('ABORT: anchor %d matched %d times, expected exactly 1' % (i, c))
    src = src.replace(old, new, 1)

io.open(P, 'w', encoding='utf-8').write(src)
print('WROTE %s' % P)
