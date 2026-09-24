#!/usr/bin/env python3
# V213 slice 2a — D113a (as amended by coach) + D146: the multi-sport run placement routes
# through the spacing chooser, and spaceHardCardio leaves a chooser-planned run week alone.
# Runs AFTER slice 1 (tests/edits/v205_d113_d122_edit.py, unchanged). Source: measure's proven
# surgery, tests/measure/v213_d113a_amended.js prep (W decl, flag decls, P placement, SHC x3)
# with the key widened per tests/measure/v213_d113a_full3.js prep (WNEW). The D106a eve rule in
# that file is D158 and is NOT here. Renamed from the surgery: _d113Walk -> _d113Excl, because
# after coach's widening the key is no longer walk-only. ia-version is not touched.
import sys, io

P = "index.html"
src = io.open(P, encoding="utf-8").read()
reps = []

def rep(old, new, tag):
    reps.append((old, new, tag))

# ── EDIT 1: the exclusion key and the two per-build flags ───────────────────
rep(
"  const _d132Plan = injuryPlan(cfg);\n",
"""  const _d132Plan = injuryPlan(cfg);
  // V213 (D113a amended): THE EXCLUSION KEY, READ ONCE. These four cardio modes are the
  // injury sweeps that rewrite every run in the week (injuryPlan / injurySweepCardio), so
  // no run keeps its quality and there is nothing for the D113 row or the placement
  // chooser to space. Excluded builds keep the V212 layout byte for byte. halfstep and
  // swimout rewrite some runs, not all, and stay routed. Passed to the chooser as a
  // parameter, never read from a closure.
  const _d113Excl = !!(_d132Plan && ['noimpact','noimpact_swim','easy','reduce'].includes(_d132Plan.cardioMode));
""",
"E1a exclusion key")

rep(
"  let _nrcPlan = null;\n",
"""  let _nrcPlan = null;
  // V213 (D146): true when the multi-sport placement below handed the run days to the
  // spacing chooser. spaceHardCardio reads it and leaves that run layout alone.
  let _msFlag = false;
  // V213 (D113a): true when the chooser's three-run fallback fired (easy / INT / long).
  // Read by _compressedQuality so the fallback week keeps the V115 crossover.
  let _d113Fb = false;
""",
"E1b flag decls")

# ── EDIT 2: the multi-sport greedy tail routes the run days through the chooser ─
rep(
"      dayToSport.push(pick); assigned[pick]++;\n    }\n  }\n",
"""      dayToSport.push(pick); assigned[pick]++;
    }
    // V213 (D113a amended / D146): THE RUN DAYS ARE PLACED BY THE SPACING CHOOSER. The
    // greedy spread above counts sessions per sport and is blind to which run is hard, so
    // on a multi-sport week it could put the long run beside a quality run. The quota it
    // dealt is kept: the same number of run days, re-sited by _nrcSpacedRunDays, and every
    // other sport keeps its order across the days the runs did not take. Pace routes from
    // three runs up and never under an exclusion-key injury; NRC routes from two runs up.
    { const _msG = cardioTypes.includes('run') && cardioGoals.run && cardioGoals.run.id; const _msPace = PACE_GOALS.has(_msG);
      const _k = dayToSport.filter(s => s === 'run').length;
      if(((_msPace && !_d113Excl && _k >= 3) || (NRC_GOALS.has(_msG) && _k >= 2)) && !isBaseCardio){ const _pk = _nrcSpacedRunDays(cardioTrainDays, _k, _msG, _msPace);
        if(_pk){ const _oth = dayToSport.filter(s => s !== 'run'); const _ix = new Set(_pk.idxs); let _o = 0;
          for(let i = 0; i < dayToSport.length; i++) dayToSport[i] = _ix.has(i) ? 'run' : _oth[_o++]; _nrcPlan = _pk.typeOf; _msFlag = true; _d113Fb = !!_pk._fbFired; } } }
  }
""",
"E2 multi-sport placement routing")

# ── EDIT 3: the call site names the sport to leave alone ───────────────────
rep(
"  spaceHardCardio(sportSessionTypes, sportDayIndices, cardioTrainDays, dayToSport);\n",
"""  // V213 (D146): a run week the chooser planned is already spaced on the real calendar.
  // Swapping its types here would undo the plan, so the run sport is skipped.
  spaceHardCardio(sportSessionTypes, sportDayIndices, cardioTrainDays, dayToSport, _msFlag ? 'run' : null);
""",
"E3 spaceHardCardio call")

# ── EDIT 4: spaceHardCardio honours the skip ───────────────────────────────
rep(
"function spaceHardCardio(sportSessionTypes, sportDayIndices, cardioTrainDays, dayToSport){\n",
"function spaceHardCardio(sportSessionTypes, sportDayIndices, cardioTrainDays, dayToSport, _skipSport){\n",
"E4a spaceHardCardio signature")

rep(
"  for(const sp of sports){\n    const days = sportDayIndices[sp] || [];\n",
"""  for(const sp of sports){
    if(sp === _skipSport) continue;   // V213 (D146): chooser-planned run week, left as planned
    const days = sportDayIndices[sp] || [];
""",
"E4b spaceHardCardio loop skip")

fail = False
for old, new, tag in reps:
    c = src.count(old)
    print("%-42s count=%d" % (tag, c))
    if c != 1:
        fail = True
if fail:
    sys.exit("ABORT: an anchor did not appear exactly once. Nothing written.")

for old, new, tag in reps:
    src = src.replace(old, new, 1)

io.open(P, "w", encoding="utf-8").write(src)
print("WROTE", P)
