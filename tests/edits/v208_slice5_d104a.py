#!/usr/bin/env python3
# V208 slice 5 — D104a (coach, V206 + V208-prep; RE-RULED after the slice 5 measure).
# The first build of this slice was PARKED (standing ruling 7): the legLoad early exit in
# deconflictLegLiftDays ran before the placement, so run_base's long run (keyed long, no legLoad) was
# never placed in 90 of 180 programs. Coach re-ruled; this script is the re-ruled slice:
#   E1 _nrcRunShape gains a third arm, run_base (solo and multi-sport), keyed on dose.key: long = key
#      `long`, speed = key `steady`, easy = every other run. _nrcLegCost is unchanged. The shape
#      carries `base` so the note can speak of the base week.
#   E2 the run_base note, ONE string. The steady variant ("Your hinge day rides your steady run...")
#      is NOT built: 0 of 2,160 programs on the 55+ low-baseline lattice and 0 of 360 on the 18-35
#      lattice carry a steady run in their placement week (tests/measure/v208_d104a_steady_probe.js),
#      so coach ruled it dead copy. And deconflictLegLiftDays reads the FIRST week whose runs carry a
#      `long` key, on every NSW arm; NRC, bike and swim carry no key and keep week 1.
#   E3 the reorder (coach, re-ruling point 1): the shape placement runs BEFORE the legLoad early exit.
#   E4 the call-site comment that said week 1 is representative.
# No meta bump. Every anchor asserted count==1 before anything is written; all-or-nothing.
# Usage: python3 tests/edits/v208_slice5_d104a.py [target.html]   (default: index.html)
import sys
P = sys.argv[1] if len(sys.argv) > 1 else '/Users/CanasBangin/Desktop/TheBig6V2/index.html'
src = open(P, encoding='utf-8').read()

EDITS = [
 # ── E1: the run_base arm in _nrcRunShape (and the two comments that said it fell through) ──
 ("""// tight and the NSW rule below runs as before. D127 (V205) widened the door: NRC race
// programs and the NSW pace family enter here; run_base and every other NSW goal do not,
// because _nrcRunShape returns null for them and the 48h rule runs unchanged.
function _nrcRunShape(wk1, trainDays){""",
  """// tight and the NSW rule below runs as before. D127 (V205) widened the door: NRC race
// programs and the NSW pace family enter here. D104a (V208): so does run_base, by its keys.
// Every other NSW goal gets a null shape and the 48h rule runs unchanged.
function _nrcRunShape(wk1, trainDays){"""),
 ("""  // (lsd_long true, lsd_easy false). INT and CHI are the speed days. Scoped to
  // run_pace_goal and its two V126 aliases; run_base and every other NSW goal fall
  // through with a null shape and keep the 48h rule below.
""",
  """  // (lsd_long true, lsd_easy false). INT and CHI are the speed days. Scoped to
  // run_pace_goal and its two V126 aliases. run_base has its own arm below (D104a); every
  // other NSW goal falls through with a null shape and keeps the 48h rule below.
"""),
 ("""  let long = null; const speed = new Set(), easy = new Set();
  trainDays.forEach(d => { const c = wk1[d]; if(!c || c.type!=='run') return;
""",
  """  let long = null, base = false; const speed = new Set(), easy = new Set();
  trainDays.forEach(d => { const c = wk1[d]; if(!c || c.type!=='run') return;
"""),
 ("""      else if(c.legLoad) long = d;
      else easy.add(d);
    } });
  if(!long) return null;
  const eve = _ISO_ORDER[(iso(long)+6)%7], after = _ISO_ORDER[(iso(long)+1)%7];
  return { long, eve, after, speed, easy, forbidden: new Set([long, eve]) };
}
""",
  """      else if(c.legLoad) long = d;
      else easy.add(d);
    } else if(c.goalId === 'run_base'){
      // D104a (V208): run_base reads its keys only. The long run is the long-keyed run (the V159
      // budgeted "Easy Run — Long" is keyed long and carries no legLoad); the steady run is the
      // base block's one quality day, so the hinge rides it; every other run is easy.
      base = true;
      const _k = c.dose && c.dose.key;
      if(_k === 'long') long = d; else if(_k === 'steady') speed.add(d); else easy.add(d);
    } });
  if(!long) return null;
  const eve = _ISO_ORDER[(iso(long)+6)%7], after = _ISO_ORDER[(iso(long)+1)%7];
  return { long, eve, after, speed, easy, forbidden: new Set([long, eve]), base };
}
"""),
 # ── E2: the run_base note, and the week the placement reads ─────────────────────────
 ("""  return { legRecoveryNote: 'Your hinge day rides a speed session so hard days stay hard. Nothing heavy lands the day before your long run.' };
}
function deconflictLegLiftDays(dayRoles, trainDays, cardioSchedule){
  const wk1 = cardioSchedule[1] || {};
""",
  """  // D104a (V208): run_base speaks of its own week.
  return { legRecoveryNote: shape.base ? 'Nothing heavy lands on your long run or the day before it. Your lifting days were placed around it.'
    : 'Your hinge day rides a speed session so hard days stay hard. Nothing heavy lands the day before your long run.' };
}
function deconflictLegLiftDays(dayRoles, trainDays, cardioSchedule){
  // D104a (V208): the placement reads the FIRST week whose runs carry a `long` key, on every NSW
  // arm (a test is not the long run, so the placement reads the next real one). NRC, bike and
  // swim carry no key, so they keep week 1, as does a program with no long-keyed run.
  const _lw = Object.keys(cardioSchedule).map(Number).filter(n => n >= 1).sort((a,b) => a-b)
    .find(n => trainDays.some(d => { const c = (cardioSchedule[n] || {})[d]; return !!(c && c.dose && c.dose.key === 'long'); }));
  const wk1 = cardioSchedule[_lw || 1] || {};
"""),
 # ── E3: the reorder — the shape placement runs before the legLoad early exit ─────────
 ("""  const legTaxing = new Set();
  trainDays.forEach(d => { const c = wk1[d]; if(c && c.legLoad) legTaxing.add(d); });
  if(!legTaxing.size) return { legRecoveryNote:null };
  // V189 (D36): race programs place by run shape. D127 (V205): so does the pace family —
  // routing is by the shape, not by a second goal test here, so there is exactly one place
  // that decides who takes the cost table. A null shape (run_base, every other NSW goal,
  // any week with no long run) falls straight through to the 48h branch below.
  const _nrc = nrcLegLiftPlacement(dayRoles, trainDays, wk1);
  if(_nrc) return _nrc;
""",
  """  // V189 (D36): race programs place by run shape. D127 (V205): so does the pace family —
  // routing is by the shape, not by a second goal test here, so there is exactly one place
  // that decides who takes the cost table. D104a (V208): run_base takes it too, and the
  // placement runs BEFORE the leg-load exit below: run_base's long run is the long-keyed run,
  // which carries no legLoad, so a week with no legLoad card still has a long run to place
  // around. A null shape (every other NSW goal, any program with no long run) falls through.
  const _nrc = nrcLegLiftPlacement(dayRoles, trainDays, wk1);
  if(_nrc) return _nrc;
  const legTaxing = new Set();
  trainDays.forEach(d => { const c = wk1[d]; if(c && c.legLoad) legTaxing.add(d); });
  if(!legTaxing.size) return { legRecoveryNote:null };
"""),
 # ── E4: the call-site comment that said week 1 is representative ────────────────────
 ("""  // the cardio. Session types repeat weekly, so week 1 is representative. See deconflictLegLiftDays.
""",
  """  // the cardio. Session types repeat weekly, so one week is representative: the first with a
  // long-keyed run (D104a), week 1 otherwise. See deconflictLegLiftDays.
"""),
]
for a, b in EDITS:
    n = src.count(a)
    if n != 1:
        sys.exit('ABORT: anchor count=%d: %r — nothing written' % (n, a[:90]))
for a, b in EDITS:
    src = src.replace(a, b, 1)
open(P, 'w', encoding='utf-8').write(src)
print('D104a (re-ruled) written to', P)
