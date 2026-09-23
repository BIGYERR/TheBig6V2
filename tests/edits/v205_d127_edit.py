#!/usr/bin/env python3
# V205 slice 2 — D127: the pace family places pull and legs by the D36 cost table.
#
# ia-version is NOT touched in this slice (stays 204; the bump is Mario's, later).
#
# Finding (measure): nrcLegLiftPlacement never fired on the pace goal because
# _nrcRunShape demanded c.isNRC. The NSW pace path prints `Long Slow Distance (LSD)`
# and sets no isNRC, so the shape was null and deconflictLegLiftDays fell through to
# the 48-hour branch, which degrades to first-available-day order on a 4-run/5-day week.
#
# Ruling D127: run_pace_goal and its two legacy aliases place by _nrcLegCost, with the
# NSW subtypes mapped onto the shape D36 already understands: INT and CHI are speed
# days, the legLoad LSD is the long run, the other LSD is the easy day, forbidden is
# the long run and its eve. Same table, same tiebreaks, same note text, no new constant.
# run_base and every other NSW goal keep the 48h rule.
#
# isNRC is deliberately NOT faked on the cardio object: that flag means Nike-verbatim
# and every other reader depends on it meaning exactly that. The mapping is at the
# shape level, inside _nrcRunShape, which is the SINGLE producer read by both the
# placement and deconflictSameRegion's guard — so a region swap cannot undo the
# placement on the pace family either (the "one cost table, two readers" invariant).

import io, sys

PATH = 'index.html'
src = io.open(PATH, encoding='utf-8').read()
orig = src
edits = []

def rep(tag, old, new):
    global src
    n = src.count(old)
    if n != 1:
        sys.stderr.write('ABORT %s: anchor count==%d (expected 1)\n' % (tag, n))
        sys.exit(1)
    src = src.replace(old, new, 1)
    edits.append((tag, n))

# ── EDIT 1 — the type mapping (the only behavioural hunk) ────────────────────
rep('E1_shape_classification',
"""  let long = null; const speed = new Set(), easy = new Set();
  trainDays.forEach(d => { const c = wk1[d]; if(!c || !c.isNRC || c.type!=='run') return;
    if(/^long run/i.test(c.subtype||'')) long = d; else if(/^speed run/i.test(c.subtype||'')) speed.add(d); else easy.add(d); });
""",
"""  // D127 (V205): the pace family reaches this same shape through its own lens. The NSW
  // engine sets no isNRC (that flag means Nike-verbatim and is not faked here) and names
  // BOTH of its easy runs `Long Slow Distance (LSD)`, so the long run is told from the
  // easy one by legLoad — the flag the scheduler already sets from assignedType
  // (lsd_long true, lsd_easy false). INT and CHI are the speed days. Scoped to
  // run_pace_goal and its two V126 aliases; run_base and every other NSW goal fall
  // through with a null shape and keep the 48h rule below.
  const _paceFam = g => g==='run_pace_goal' || g==='run_mile_time' || g==='run_15_under10';
  let long = null; const speed = new Set(), easy = new Set();
  trainDays.forEach(d => { const c = wk1[d]; if(!c || c.type!=='run') return;
    if(c.isNRC){
      if(/^long run/i.test(c.subtype||'')) long = d; else if(/^speed run/i.test(c.subtype||'')) speed.add(d); else easy.add(d);
    } else if(_paceFam(c.goalId)){
      const _st = c.subtype||'';
      if(/^(Interval \\(INT\\)|Continuous High Intensity \\(CHI\\))/.test(_st)) speed.add(d);
      else if(c.legLoad) long = d;
      else easy.add(d);
    } });
""")

# ── EDIT 2 — the routing comments at the seam, made true ────────────────────
# (a) the cost-table header claimed non-NRC programs never enter here. They do now.
rep('E2a_header_scope',
"""// tight and the NSW rule below runs as before. Non-NRC programs never enter here.
""",
"""// tight and the NSW rule below runs as before. D127 (V205) widened the door: NRC race
// programs and the NSW pace family enter here; run_base and every other NSW goal do not,
// because _nrcRunShape returns null for them and the 48h rule runs unchanged.
""")

# (b) the call site in deconflictLegLiftDays.
rep('E2b_call_site',
"""  const _nrc = nrcLegLiftPlacement(dayRoles, trainDays, wk1);   // V189 (D36): race programs place by run shape
  if(_nrc) return _nrc;
""",
"""  // V189 (D36): race programs place by run shape. D127 (V205): so does the pace family —
  // routing is by the shape, not by a second goal test here, so there is exactly one place
  // that decides who takes the cost table. A null shape (run_base, every other NSW goal,
  // any week with no long run) falls straight through to the 48h branch below.
  const _nrc = nrcLegLiftPlacement(dayRoles, trainDays, wk1);
  if(_nrc) return _nrc;
""")

# ── EDIT 4 — keep forbidden = {long, eve} true AFTER the region swap ────────
# deconflictSameRegion's guard reads the same shape, so on the pace family it now scores
# forbidden days at 10 and can no longer swap a hinge back onto the long-run eve. Only the
# comment needed correcting; the code already reads _nrcRunShape.
rep('E4_region_guard_scope',
"""  // V189 (D36): on NRC programs the leg roles are scored by the placement's own cost table
  // (forbidden days weigh 10), so a region swap can never make the placement worse. Off NRC
  // the count is the V30 one, byte-identical.
""",
"""  // V189 (D36): on NRC programs the leg roles are scored by the placement's own cost table
  // (forbidden days weigh 10), so a region swap can never make the placement worse. D127
  // (V205): the pace family now produces a shape too, so the same guard holds there and the
  // long-run eve stays forbidden through the region pass. Where _nrcRunShape is null the
  // count is the V30 one, byte-identical.
""")

if src == orig:
    sys.stderr.write('ABORT: no change\n'); sys.exit(1)
io.open(PATH, 'w', encoding='utf-8').write(src)
for t, n in edits:
    print('OK %-26s count==%d' % (t, n))
print('wrote %s  %d -> %d bytes' % (PATH, len(orig), len(src)))
