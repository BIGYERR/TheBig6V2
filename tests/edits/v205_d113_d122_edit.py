#!/usr/bin/env python3
# V205 slice 7 — D122 (no INT->CHI phase split on NSW pace goals) + D113 (the three-run
# week is INT / CHI / long). ia-version stays at 204; this is not a release edit.
import sys, io

P = "index.html"
src = io.open(P, encoding="utf-8").read()
reps = []

def rep(old, new, tag):
    reps.append((old, new, tag))

# ── EDIT 1a: getSessionTypes learns the pace family ─────────────────────────
rep(
"  function getSessionTypes(nDays, protectInt, baseMode, thresholdGoal) {",
"  function getSessionTypes(nDays, protectInt, baseMode, thresholdGoal, paceFam) {",
"E1a getSessionTypes signature")

# ── EDIT 1b: the 3-day row. D113. ───────────────────────────────────────────
rep(
"    if(nDays === 3) return protectInt ? ['lsd_easy','int','lsd_long'] : ['lsd_easy','chi','lsd_long'];",
"""    // V205 (D113): THE THREE-RUN PACE WEEK IS INT / CHI / LONG. Under D125's amended
    // ceiling three runs is no longer the pace family's only shape, it is the FALLBACK
    // shape for the 14 four-training-day calendars that cannot hold four runs without a
    // collision. Those athletes must not also lose the second quality session, so the
    // easy LSD yields the slot rather than one of the two qualities. Guide B: "You should
    // always begin CHI and INT portions of the program at Week 1" — both run every week,
    // from week 1, at every day count the pace family can reach. The easy run is aerobic
    // volume and is the cheapest thing in the week to drop; dropping a quality day is
    // what the old row did and it is what D122 retires. Non-pace goals keep the old
    // protectInt coin flip: swim_500_time and swim_100_time are the only other goals that
    // reach the protectInt arm, they are outside both rulings, and their single quality
    // slot is still periodized by the crossover below.
    if(nDays === 3) return paceFam ? ['int','chi','lsd_long']
                   : (protectInt ? ['lsd_easy','int','lsd_long'] : ['lsd_easy','chi','lsd_long']);""",
"E1b three-day row")

# ── EDIT 1c: retire the crossover's claim over the pace family, in the prose ─
rep(
"""  // `qualityCrossoverWeek` is the crossover; the swap happens per-week at the call site,
  // because sportSessionTypes is built once and read inside the week loop.""",
"""  // `qualityCrossoverWeek` is the crossover; the swap happens per-week at the call site,
  // because sportSessionTypes is built once and read inside the week loop.
  //
  // V205 (D122): THE CROSSOVER NO LONGER REACHES THE PACE FAMILY. The paragraph above is
  // NRC reasoning, and it leaked onto an NSW goal. Guide B is explicit that CHI and INT
  // both begin at Week 1, and Guide A's p.13 and p.16 tables both start at week 1: on a
  // test goal there is no phase split to periodize. The compression existed only because
  // three run days left room for exactly ONE quality slot; D113 above gives the three-run
  // week both, so on this goal the compression has nothing left to compress and the
  // `_compressedQuality` seam is gated off it below.
  //
  // The machinery is FORKED, not deleted, and its remaining job is not NRC. NRC run goals
  // never reach `_compressedQuality` at all — `isNRC` takes them down the getNRCSessionTypes
  // branch before this table is consulted, so no NRC program has ever set `_qslot`. What is
  // left is swim_500_time and swim_100_time at exactly three swim days: `isSpeedGoal`
  // carries both, neither is in PACE_GOALS, and neither ruling touches swimming. That is
  // the live consumer, and it is why this function stays.""",
"E1c crossover prose")

# ── EDIT 2: the chooser passes the pace flag through ────────────────────────
rep(
"    const types = paceFam ? getSessionTypes(capDays, isSpeedGoal(goalId), false, false)",
"    const types = paceFam ? getSessionTypes(capDays, isSpeedGoal(goalId), false, false, true)",
"E2 chooser call")

# ── EDIT 3a: the engine's own call, and the pace predicate it needs ─────────
rep(
"""      const thresholdGoal = goalId === 'bike_ftp';
      const types = getSessionTypes(sportDays.length, protectInt, baseMode, thresholdGoal);""",
"""      const thresholdGoal = goalId === 'bike_ftp';
      // V205 (D113/D122): the NSW pace family, named by the same set the ceiling and the
      // chooser gate read, so the table row, the conditional fourth run and the spacing
      // chooser cannot disagree about who is a pace athlete. run_mile_time and
      // run_15_under10 are aliased to run_pace_goal before the engine sees a goal id; the
      // set carries all three so a future un-aliasing cannot silently drop them.
      const _paceSession = type === 'run' && PACE_GOALS.has(goalId);
      const types = getSessionTypes(sportDays.length, protectInt, baseMode, thresholdGoal, _paceSession);""",
"E3a engine call + _paceSession")

# ── EDIT 3b: gate _compressedQuality off the pace family ───────────────────
rep(
"""      const _compressedQuality = sportDays.length === 3 && !baseMode && !isBaseCardio
                                 && (protectInt || _perfRun);""",
"""      // V205 (D122): `!_paceSession` is the fork. Without it the D113 row would be read
      // by the compression below and both quality days would collapse back to INT, which
      // is the phase split this ruling retires, restated. The conjunct is placed on the
      // FLAG rather than on the two reads of it downstream so there is one statement of
      // who is compressed, not two that can drift.
      const _compressedQuality = sportDays.length === 3 && !baseMode && !isBaseCardio
                                 && !_paceSession && (protectInt || _perfRun);""",
"E3b _compressedQuality fork")

# ── EDIT 3c: the week-loop crossover comment states its remaining scope ────
rep(
"""      // V115: the compressed single quality slot flips INT -> CHI at the crossover.
      // Everything downstream reads `assignedType` exactly as before, including legLoad.""",
"""      // V115: the compressed single quality slot flips INT -> CHI at the crossover.
      // Everything downstream reads `assignedType` exactly as before, including legLoad.
      // V205 (D122): `_qslot` is never set on a pace goal now, so this line is a no-op
      // there and every pace week reads `assignedTypeBase` for all tw weeks. It still
      // fires for a three-day swim_500_time / swim_100_time block.""",
"E3c week-loop comment")

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
