#!/usr/bin/env python3
# V193 = D44 — the gear-gate batch.
#  Fix 1  CORE_PILLARS acquires a barbell gate so 'Landmine rotations' cannot print on a
#         tier with no barbell (home_basic / minimal / bodyweight). A landmine is a barbell
#         with one end anchored. Same shape V192 used on shoulderAccPool.
#  Fix 2  lowback/protect's rowPool literal ['Straight-arm pulldown'] never passed through
#         _gear/_gearOK, so a cable movement shipped on every cable-less tier including
#         bodyweight. Gains the hasCables branch its sibling branches already have.
#  Fix 3  COPY ONLY. Bands are named in the home_full and crossfit equipment blurbs. The
#         banded prehab rail stays exactly as it is.
import io, sys, os

P = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 'index.html')
src = io.open(P, encoding='utf-8').read()
orig = src

def rep(old, new, tag):
    global src
    n = src.count(old)
    if n != 1:
        sys.stderr.write('ABORT [%s]: anchor count==%d, expected 1\n' % (tag, n))
        sys.exit(1)
    src = src.replace(old, new, 1)
    print('ok  %s' % tag)

# ── FIX 1 ────────────────────────────────────────────────────────────────────
# 1a. Single source of truth for "this tier owns a barbell". buildProgram already knew;
#     the week-assembly pass (engineD_synthesis) did not, and the core injector runs there.
rep(
"""// Run session types that heavily tax legs/CNS — mirror of the cardio legLoad speed set.
const CORE_SPEED_TYPES = new Set(['int','nrc_speed1','nrc_speed2']);""",
"""// Run session types that heavily tax legs/CNS — mirror of the cardio legLoad speed set.
const CORE_SPEED_TYPES = new Set(['int','nrc_speed1','nrc_speed2']);

// V193 (D44): which tiers own a barbell. buildProgram computed this inline and the answer
// was unreachable from week assembly, where the core injector runs — so the one pool that
// is injected after the pool block had no gear gate at all. One definition, two readers.
function _tierHasBarbell(equip){ return equip==='home_full'||equip==='commercial'||equip==='crossfit'; }""",
'1a fn _tierHasBarbell')

rep(
"""  const hasBarbell=equip==='home_full'||equip==='commercial'||isCrossfit;""",
"""  const hasBarbell=_tierHasBarbell(equip);""",
'1b buildProgram reads the shared helper')

# 1c. The gate itself, inside the core block builder.
rep(
"""function getDynamicCoreBlock(week, role, isHardRunToday, tomorrowHot, slot){
  const P = CORE_PILLARS;
  const R = week + (slot||0); // rotation seed — offset by slot so the week's two core days differ""",
"""function getDynamicCoreBlock(week, role, isHardRunToday, tomorrowHot, slot, equip){
  const P = CORE_PILLARS;
  // V193 (D44): CORE_PILLARS is injected at WEEK ASSEMBLY, downstream of the pool block,
  // so _gearOK never saw it and 'Landmine rotations' printed on home_basic and minimal —
  // tiers whose own wizard copy says "No barbell". A landmine IS a barbell with one end
  // anchored. Gated in shoulderAccPool's V192 shape: drop the barbell-implement member,
  // keep the pillar. Read through _pi so every pillar is filtered by the same lens and a
  // landmine added to another pillar later cannot leak. An undefined equip means "gear
  // unknown" and leaves the pillars untouched, so no existing caller is silently narrowed.
  //
  // THE BODYWEIGHT TIER IS DELIBERATELY NOT GATED HERE. It already has a bail: _BW_SUBS
  // maps 'Landmine rotations' to 'Standing torso rotations (slow)', and that target was
  // chosen in V178 precisely so a rotated pair cannot collapse — the other two rotational
  // members both sweep to 'Dead bug (slow tempo)'. Filtering the landmine out of the pool
  // instead of substituting it removes the third distinct member, so the rotation hands
  // back two names that sweep to the same movement and the per-section dedup prints a
  // ONE-ITEM core block. Measured: 15/90 bodyweight core finishers. Substitution and
  // pool-gating are two different answers to the same question; each tier gets one.
  const _gateLandmine = equip!==undefined && equip!=='bodyweight' && !_tierHasBarbell(equip);
  const _pi = key => _gateLandmine
    ? (P[key].items||[]).filter(it=>!/landmine/i.test(it.name))
    : P[key].items;
  const R = week + (slot||0); // rotation seed — offset by slot so the week's two core days differ""",
'1c getDynamicCoreBlock gate')

rep(
"""    items=[rot(P.anti_extension.static, R), rot(P.anti_rotation.items, R)]; // rotating static brace + low-fatigue anti-rotation""",
"""    items=[rot(P.anti_extension.static, R), rot(_pi('anti_rotation'), R)]; // rotating static brace + low-fatigue anti-rotation""",
'1d hard-run branch')

rep(
"""    items = [rot(P[pillar].items, R), rot(P[pillar].items, R+1)].filter((v,i,a)=>a.indexOf(v)===i).slice(0,2);""",
"""    items = [rot(_pi(pillar), R), rot(_pi(pillar), R+1)].filter((v,i,a)=>a.indexOf(v)===i).slice(0,2);""",
'1e hot-tomorrow branch')

rep(
"""      items = (key==='dynamic_bracing')
        ? [rot(P.dynamic_bracing.items, R), rot(P.dynamic_bracing.items, R+1)].filter((v,i,a)=>a.indexOf(v)===i).slice(0,2)
        : P[key].items.slice(0,2);""",
"""      items = (key==='dynamic_bracing')
        ? [rot(_pi('dynamic_bracing'), R), rot(_pi('dynamic_bracing'), R+1)].filter((v,i,a)=>a.indexOf(v)===i).slice(0,2)
        : _pi(key).slice(0,2);""",
'1f clear-runway branch')

rep(
"""function injectDynamicCore(weekObj, dayRoles, trainDays, week){""",
"""function injectDynamicCore(weekObj, dayRoles, trainDays, week, equip){""",
'1g injectDynamicCore signature')

rep(
"""    const block=getDynamicCoreBlock(week, dayRoles[day], isHardRun(day), hot, slot);""",
"""    const block=getDynamicCoreBlock(week, dayRoles[day], isHardRun(day), hot, slot, equip);""",
'1h injectDynamicCore call')

rep(
"""    if(includeCore && !inTaper(w) && !isRecoveryWeek(w)) injectDynamicCore(weeks[w], dayRoles, trainDays, w);""",
"""    if(includeCore && !inTaper(w) && !isRecoveryWeek(w)) injectDynamicCore(weeks[w], dayRoles, trainDays, w, cfg.equipment||'home_full');""",
'1i engineD_synthesis call site')

# ── FIX 2 ────────────────────────────────────────────────────────────────────
# Root cause: the literal pool. _gear() is never applied here, and applying it would not
# have helped — _gear falls back to the RAW pool when the filter empties it, and a
# one-item illegal pool empties. So the branch needs the cable-less arm its siblings
# (elbow/protect, squatPool two lines up) already carry. 'Assisted pullups' is this
# branch's own stated doctrine three lines above: a hanging vertical pull is
# spine-decompressive. It scores 'vpull', so it survives P.drop = {hinge,row}; it needs
# no cable and no barbell; and it already appears in this same branch's backCompoundPool.
rep(
"""        rowPool = ['Straight-arm pulldown'];""",
"""        // V193 (D44): the pulldown is a CABLE movement and this literal never passed
        // through _gear, so it shipped on minimal, home_basic and bodyweight — a tier
        // whose copy is "You, the floor, and something to pull on". _gear would not have
        // saved it either: a one-item pool empties under the filter and falls back to
        // itself. Cable-less tiers get the hanging vertical pull this branch's own
        // comment prescribes. Also 'vpull', so P.drop's row rule leaves it alone.
        rowPool = hasCables?['Straight-arm pulldown']:['Assisted pullups'];""",
'2 lowback/protect rowPool gear branch')

# ── FIX 3 ── copy only. No engine change, no prehab movement removed. ─────────
rep(
"""desc:'Barbell, rack, bench, dumbbells, kettlebells, pull-up bar, trap bar'}""",
"""desc:'Barbell, rack, bench, dumbbells, kettlebells, pull-up bar, trap bar, bands'}""",
'3a home_full copy names bands')

rep(
"""desc:'Barbells, rig, bumpers, kettlebells, rower/bike, wall balls'}""",
"""desc:'Barbells, rig, bumpers, kettlebells, rower/bike, wall balls, bands'}""",
'3b crossfit copy names bands')

# ── VERSION BUMP — always last ───────────────────────────────────────────────
rep(
"""<meta name="ia-version" content="192">""",
"""<meta name="ia-version" content="193">""",
'version 192 -> 193')

if src == orig:
    sys.stderr.write('ABORT: no change\n'); sys.exit(1)
io.open(P, 'w', encoding='utf-8').write(src)
print('WROTE %s' % P)
