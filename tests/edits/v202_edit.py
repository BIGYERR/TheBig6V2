# V202 slice 1 of 5 — D100 (the pace clock anchors on the entered mile and walks toward the
# entered goal) and D101 (one safe rate of pace improvement, not two).
# Three ruled edits. NO ia-version bump in this slice (slice 5 owns the bump).
# NO copy strings touched (slice 2 owns D101's note rewrite).
#
# E1  index.html:3580  _initialPace takes the entered mile best (beginner keeps the V172 default)
# E2  index.html:5333  the entered goal (dist in MILES, total secs, ageBracket) reaches arguments[9][10][11]
# E3  index.html:3524  the dampener cap IS the age-scaled table value; the 12 and the x2.5 go
#
# The km conversion is NOT rewritten: calcProgramLength's expression is hoisted into one helper
# (paceGoalTarget) that both the sizer and the session builder call, so 0.621 keeps exactly one
# live site on this path and :3582's rawTargetSecs/rawTargetDist equals the sizer's tPacePerMile
# by construction. Hoisting the helper to top level also hoists parseTimeToSecs out of
# calcProgramLength (it was nested and unreachable from the call site); it is a pure function
# with no closure and has exactly one existing caller.

import sys, io

PATH = "/Users/CanasBangin/Desktop/TheBig6V2/index.html"
src = io.open(PATH, encoding="utf-8").read()
orig_len = len(src)

def rep(s, old, new, name):
    n = s.count(old)
    print("anchor %-30s count==%d" % (name, n))
    assert n == 1, "ANCHOR NOT UNIQUE (abort, nothing written): " + name
    return s.replace(old, new, 1)

# ── A0: lift parseTimeToSecs out of calcProgramLength (pure, no closure, 1 caller) ──
A0_old = """  function parseTimeToSecs(txt) {
    if(!txt) return null;
    var parts = txt.split(':').map(Number);
    if(parts.length === 2) return parts[0]*60 + parts[1];
    if(parts.length === 3) return parts[0]*3600 + parts[1]*60 + parts[2];
    return null;
  }

"""
src = rep(src, A0_old, "", "A0 unnest parseTimeToSecs")

# ── A1: the single reader of the pace goal's entered target, at top level ──
A1_old = """// ── DYNAMIC PROGRAM LENGTH CALCULATOR ──
function calcProgramLength(cardioTypes, cardioGoals, liftingGoal) {"""
A1_new = """// ── PACE-GOAL TARGET: the single reader of what the athlete entered ──
// D100 (V202). Two readers need this number: calcProgramLength sizes the block on it and
// buildRunSession paces the weeks on it. When they each computed it, a km athlete got a block
// sized on one target and paced on another. The km conversion lives HERE and nowhere else on
// this path. Pure: reads the goal object, mutates nothing.
function parseTimeToSecs(txt) {
  if(!txt) return null;
  var parts = txt.split(':').map(Number);
  if(parts.length === 2) return parts[0]*60 + parts[1];
  if(parts.length === 3) return parts[0]*3600 + parts[1]*60 + parts[2];
  return null;
}
function paceGoalTarget(g) {
  g = g || {};
  var rawDist = parseFloat(g.targetDist) || 1.5;
  var tDist = (g.paceUnit === 'km') ? rawDist * 0.621 : rawDist;
  var tTotalSecs = null;
  if(g.targetMins !== undefined && g.targetMins !== '') {
    tTotalSecs = (+g.targetMins||0)*60 + (+g.targetSecs||0);
  } else if(g.targetTime) {
    tTotalSecs = parseTimeToSecs(g.targetTime);
  }
  return {
    tDist: tDist,
    tTotalSecs: tTotalSecs,
    tPacePerMile: (tTotalSecs && tDist > 0) ? (tTotalSecs / tDist) : null
  };
}

// ── DYNAMIC PROGRAM LENGTH CALCULATOR ──
function calcProgramLength(cardioTypes, cardioGoals, liftingGoal) {"""
src = rep(src, A1_old, A1_new, "A1 paceGoalTarget helper")

# ── A2: the sizer reads the helper (same numbers, one arithmetic) ──
A2_old = """        var rawDist = parseFloat(goal.targetDist) || 1.5;
        var tDist = (goal.paceUnit === 'km') ? rawDist * 0.621 : rawDist;
        var tTotalSecs = null;
        if(goal.targetMins !== undefined && goal.targetMins !== '') {
          tTotalSecs = (+goal.targetMins||0)*60 + (+goal.targetSecs||0);
        } else if(goal.targetTime) {
          tTotalSecs = parseTimeToSecs(goal.targetTime);
        }
        var tPacePerMile = (tTotalSecs && tDist > 0) ? (tTotalSecs / tDist) : null;"""
A2_new = """        // D100 (V202): one reader, so the block size and the weekly pace targets come
        // from the identical number for mi and km athletes alike.
        var _pgT = paceGoalTarget(goal);
        var tDist = _pgT.tDist;
        var tTotalSecs = _pgT.tTotalSecs;
        var tPacePerMile = _pgT.tPacePerMile;"""
src = rep(src, A2_old, A2_new, "A2 sizer reads helper")

# ── E1 / A3: the clock starts at the mile the athlete entered ──
A3_old = """    buildRunProgressionForLength._initialPace  = expPaceDefaults[experience||'intermediate'] || 570;"""
A3_new = """    // D100 (V202): the pace clock starts where the athlete actually is. _mileBestSecs is
    // already null for beginners (gated at the anchor above), so beginner keeps the V172
    // experience default of 690 and only non-beginners take the entered mile.
    buildRunProgressionForLength._initialPace  = _mileBestSecs || expPaceDefaults[experience||'intermediate'] || 570;"""
src = rep(src, A3_old, A3_new, "A3 E1 _initialPace anchor")

# ── E2 / A4: the entered goal reaches arguments[9][10][11] ──
A4_old = """          const sessionOverride = forceType ? null : assignedType;
          session = buildRunSession(
            _runGoalId, w, dayIdx, tw,
            baselineMiles, cfg.experience||'intermediate',
            forceType, cfg.eventTargeted !== false, sessionOverride,
            null, null, null, _mileBestSecs, isBaseCardio, _qPhase, _tap,"""
A4_new = """          const sessionOverride = forceType ? null : assignedType;
          // D100 (V202): the entered goal reaches the pace progression. Same reader as the
          // program-length sizer, so the block is sized and paced on one target. Read only
          // by the run_pace_goal branch of buildRunSession; every other run goal ignores it.
          const _pgT = paceGoalTarget(goal);
          session = buildRunSession(
            _runGoalId, w, dayIdx, tw,
            baselineMiles, cfg.experience||'intermediate',
            forceType, cfg.eventTargeted !== false, sessionOverride,
            _pgT.tDist, _pgT.tTotalSecs, cfg.ageBracket||'18-35', _mileBestSecs, isBaseCardio, _qPhase, _tap,"""
src = rep(src, A4_old, A4_new, "A4 E2 call site [9][10][11]")

# ── E3 / A5: one safe rate. No 12 s/mi/wk ceiling, no x2.5 multiplier — neither has a source ──
A5_old = """    // Adaptation dampener: physiology caps pace gains, further reduced by age bracket
    const maxPaceImprovementPerWeek = buildRunProgressionForLength._paceImprovePerWeek
      ? Math.min(12, buildRunProgressionForLength._paceImprovePerWeek * 2.5)
      : 12;"""
A5_new = """    // Adaptation dampener: physiology caps pace gains, further reduced by age bracket.
    // D101 (V202): ONE safe rate. The age-scaled table value set at the call site IS the cap.
    // The old ceiling of 12 s/mi/wk and the x2.5 multiplier had no source and let a compressed
    // timeline promise 30 s/mi in a week. Fallback mirrors expPaceDefaults above: the same
    // hand table, unscaled, for the case where the call site did not set the property.
    const expPaceImprove = {beginner:3, intermediate:5, advanced:7};   // V176 (D9)
    const maxPaceImprovementPerWeek = buildRunProgressionForLength._paceImprovePerWeek
      || expPaceImprove[exp] || 5;"""
src = rep(src, A5_old, A5_new, "A5 E3 dampener cap")

# NO ia-version bump in this slice: slice 5 owns it.
io.open(PATH, "w", encoding="utf-8").write(src)
print("bytes: %d -> %d (%+d)" % (orig_len, len(src), len(src) - orig_len))
print("ia-version: untouched by design (slice 5 bumps)")
