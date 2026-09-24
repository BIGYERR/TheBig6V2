#!/usr/bin/env python3
# V213 slice 2b — D113a (as amended by coach): the spacer fallback at three pace runs, the V115
# crossover kept on the fallback week, and the D113 three-day row gated off the exclusion key.
# Runs AFTER slice 1 (tests/edits/v205_d113_d122_edit.py) and slice 2a
# (tests/edits/v213_slice2a_routing.py). Source: measure's proven surgery,
# tests/measure/v213_d113a_amended.js prep (chooser signature + W row gate, spacer fallback,
# solo chooser calls x2, solo fallback flag, E3a W gate, E3b crossover kept on fallback), with
# _d113Walk renamed _d113Excl (slice 2a) and the chooser parameter _walk renamed _excl.
# ia-version is not touched.
import sys, io

P = "index.html"
src = io.open(P, encoding="utf-8").read()
reps = []

def rep(old, new, tag):
    reps.append((old, new, tag))

# ── EDIT 1: the chooser takes the fallback flag and the exclusion key ───────
rep(
"""  function _nrcSpacedRunDays(cardioTrainDays, capDays, goalId, paceFam){
    const types = paceFam ? getSessionTypes(capDays, isSpeedGoal(goalId), false, false, true)
""",
"""  // V213 (D113a): `_fb` asks for the fallback three-run row (easy / INT / long) and is only
  // ever passed by the chooser's own fallback below. `_excl` is the exclusion key read once
  // in buildCardioProgression (`_d113Excl`); under it the pace arm reads the V212 row, not
  // the D113 row.
  function _nrcSpacedRunDays(cardioTrainDays, capDays, goalId, paceFam, _fb, _excl){
    const types = paceFam ? (_fb ? ['lsd_easy','int','lsd_long'] : getSessionTypes(capDays, isSpeedGoal(goalId), false, false, !_excl))
""",
"E1 chooser signature + D113 row gate")

# ── EDIT 2: the spacer fallback ─────────────────────────────────────────────
rep(
"    return best; // {idxs:[...], typeOf:{dayKey:type}, ...} — never null for capDays≥1\n",
"""    // V213 (D113a): THE SPACER FALLBACK. Three pace runs as INT / CHI / long need three
    // days no two of which put hard beside hard, and 7 of the 35 three-day calendars have
    // no such layout. There the week keeps the V212 shape, easy / INT / long, and the one
    // quality slot crosses INT to CHI at the V115 crossover. The flag rides on the RETURNED
    // object, never on a closure, so a gate that lifts this function into a bare VM runs it.
    if(paceFam && capDays === 3 && !_fb && best && best.untol > 0){ const _alt = _nrcSpacedRunDays(cardioTrainDays, capDays, goalId, paceFam, true, _excl); if(_alt){ _alt._fbFired = true; return _alt; } }
    return best; // {idxs:[...], typeOf:{dayKey:type}, ...} — never null for capDays≥1
""",
"E2 spacer fallback")

# ── EDIT 3: the solo call site passes the key and reads the fallback flag ───
rep(
"      let _pick = _nrcSpacedRunDays(cardioTrainDays, capDays, _soloRunGoal, _paceCapped);\n",
"      let _pick = _nrcSpacedRunDays(cardioTrainDays, capDays, _soloRunGoal, _paceCapped, undefined, _d113Excl);\n",
"E3a solo chooser call (first)")

rep(
"""        _pick = _nrcSpacedRunDays(cardioTrainDays, capDays, _soloRunGoal, _paceCapped);
      }
      if(_pick){
        _pick.idxs.forEach(i=>chosen.add(i));
        _nrcPlan = _pick.typeOf;   // read by the NRC type-assignment loop below
""",
"""        _pick = _nrcSpacedRunDays(cardioTrainDays, capDays, _soloRunGoal, _paceCapped, undefined, _d113Excl);
      }
      if(_pick){
        _pick.idxs.forEach(i=>chosen.add(i));
        _nrcPlan = _pick.typeOf;   // read by the NRC type-assignment loop below
        _d113Fb = !!_pick._fbFired;   // V213 (D113a): the fallback week keeps the V115 crossover
""",
"E3b solo chooser call (retry) + fallback flag")

# ── EDIT 4: the engine's pace flag and the crossover fork ──────────────────
rep(
"      const _paceSession = type === 'run' && PACE_GOALS.has(goalId);\n",
"""      // V213 (D113a): not a pace session for the D113 row under the exclusion key. Those
      // weeks keep the V212 row and the V115 crossover.
      const _paceSession = type === 'run' && PACE_GOALS.has(goalId) && !_d113Excl;
""",
"E4a _paceSession exclusion gate")

rep(
"""      const _compressedQuality = sportDays.length === 3 && !baseMode && !isBaseCardio
                                 && !_paceSession && (protectInt || _perfRun);""",
"""      // V213 (D113a): `|| _d113Fb` re-opens the fork for the chooser's fallback week. That
      // week is easy / INT / long with one quality slot, which is exactly what the V115
      // crossover exists to periodize, so the slot crosses INT to CHI there. This supersedes
      // the V205 notes that say `_qslot` is never set on a pace goal: it is, on a fallback week.
      const _compressedQuality = sportDays.length === 3 && !baseMode && !isBaseCardio
                                 && (!_paceSession || _d113Fb) && (protectInt || _perfRun);""",
"E4b _compressedQuality kept on fallback")

rep(
"      // fires for a three-day swim_500_time / swim_100_time block.\n",
"""      // fires for a three-day swim_500_time / swim_100_time block.
      // V213 (D113a): and for a pace week the chooser's spacer fallback laid out as easy /
      // INT / long, and for a pace week under the exclusion key. Both set `_qslot` again.
""",
"E4c week-loop comment")

fail = False
for old, new, tag in reps:
    c = src.count(old)
    print("%-46s count=%d" % (tag, c))
    if c != 1:
        fail = True
if fail:
    sys.exit("ABORT: an anchor did not appear exactly once. Nothing written.")

for old, new, tag in reps:
    if src.count(old) != 1:
        sys.exit("ABORT: anchor %s drifted to count %d after an earlier replacement. Nothing written." % (tag, src.count(old)))
    src = src.replace(old, new, 1)

io.open(P, "w", encoding="utf-8").write(src)
print("WROTE", P)
