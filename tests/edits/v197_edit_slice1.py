# tests/edits/v197_edit_slice1.py
# V197 SLICE 1 — the pool fix. D75 (harvest + key rename + the Wall sit dose),
# D76 (same-card subtraction), and the 8302 legIso[1] guard.
# ORDER MATTERS: the harvest IS the crash guard. _gear's fallback removal (D70b) is
# slice 2 and must not land before this file boots.
import io, sys

P = 'index.html'
src = io.open(P, encoding='utf-8').read()
orig = src
reps = []

def rep(old, new, label):
    reps.append((old, new, label))

# ── 1. D75: EXLIB.leg_iso -> EXLIB.leg_accessory, + four gear-free names ─────
rep(
"""  // V178 (D1): standing cable hamstring curl — knee flexion in a running-relevant standing
  // posture. Lives in leg_iso (which is _gear'd, so the cable gate applies) NOT in hinge
  // (which is not). _pattern reads 'hamstring curl' → leg_iso, added the same session.
  leg_iso:['Leg extension','Lying leg curl','Seated leg curl','Leg press','Standing cable hamstring curl'],""",
"""  // V178 (D1): standing cable hamstring curl — knee flexion in a running-relevant standing
  // posture. Lives in leg_accessory (which is _gear'd, so the cable gate applies) NOT in
  // hinge (which is not). _pattern reads 'hamstring curl' → leg_iso, added the same session.
  // V197 (D75): renamed from leg_iso and four gear-free names harvested. The old pool was
  // five machine/cable names: ZERO legal members on every tier but commercial. It only ever
  // printed because _gear's fallback handed the illegal pool straight back. The slot's job
  // is direct low-cost quad and hamstring volume AFTER the compounds, not "single-joint",
  // so the key no longer makes a _pattern claim the slot never asked for. Commercial keeps
  // all five machine names: it owns the machines. _pattern and _PATTERN_REGION are NOT
  // touched — leg_iso, hip_ext and lunge all map to 'legs' (9255), so volume accounting is
  // identical, and the knee/protect drop at 6981 is already right (a glute bridge and a hip
  // thrust are the safest loaded movements an angry knee can do, and P.dropNames at 6976
  // name-catches nordic / wall sit / spanish squat anyway).
  // Excluded by ruling, do not add back: 'Spanish squat hold (KB)' (a hold, needs a KB,
  // _compoundTier 2, kneeStabSel already draws it), 'Step-ups (KB)' (loaded unilateral
  // compound, already in EXLIB.lunge which feeds Leg superset A on the same card),
  // 'Dumbbell Bulgarian split squat' (_compoundTier 2, the hardest unilateral leg movement
  // in the file — the day's THIRD leg block is not where it belongs).
  leg_accessory:['Leg extension','Lying leg curl','Seated leg curl','Leg press','Standing cable hamstring curl','Nordic hamstring curl (anchored)','Single-leg glute bridge','Single-leg hip thrust','Wall sit'],""",
"D75 EXLIB.leg_iso -> leg_accessory + harvest")

# ── 2. D76 subtraction + D75 dose, at the sole reader (8297) ────────────────
rep(
"""      if(denseHypertrophy){
        // Leg isolation (quad/ham machines) + direct calves — both missing before.
        const isOlder=(cfg.ageBracket==='55+'||cfg.ageBracket==='36-54');
        const hsets=cfg.experience==='advanced'?4:3;
        const repB=isOlder?'15':'12';
        const legIso=pick(_gear(EXLIB.leg_iso),2,blockSeed(w)+105);""",
"""      if(denseHypertrophy){
        // Leg accessory — direct quad/ham volume after the compounds — plus direct calves.
        const isOlder=(cfg.ageBracket==='55+'||cfg.ageBracket==='36-54');
        const hsets=cfg.experience==='advanced'?4:3;
        const repB=isOlder?'15':'12';
        // V197 (D76): same-card subtraction, in _pi's exact shape (index.html:6119-6126).
        // The gear filter runs FIRST so the subtraction can never widen legality, and the
        // whole gear-filtered list is restored if fewer than TWO names survive, because
        // this slot picks two — one honest duplicate beats one undefined. Without it a
        // card prints the same movement under two headings: Wall sit is also drawn by
        // kneeStabSel (7831), and the harvested hip-extension names also live in
        // hipExtPool and in the bodyweight hingePool. NSW p.7 item 6 forbids it directly,
        // and _itemCost charges holds at 0.5× so capSessionBudget never catches it.
        // The subject is `s` itself: every name already written onto THIS day's card,
        // which is exactly ex.lunge, ex.hinge, ex.kneeStab and ex.hipExt as they were
        // actually pushed, including the _ssPair rewrite of Leg superset B.
        const _laGear=_gear(EXLIB.leg_accessory);
        const _laOn=Object.create(null);
        s.forEach(sec=>((sec&&sec.items)||[]).forEach(it=>{const nm=String((it&&it.name)||'').trim().toLowerCase();if(nm)_laOn[nm]=1;}));
        const _laLeft=_laGear.filter(n=>!_laOn[String(n||'').trim().toLowerCase()]);
        // V197 (D75): the slot writes hsets+'×'+repB and "3×12" is unexecutable for an
        // isometric. 25 sec is the number the file already carries for a hold in the
        // ACCESSORY position (ex.kneeStab at 8179/8256/8270/8273). The finisher position
        // is 30 sec and this is not the finisher. No new constant, no new predicate.
        const _laDose=n=>hsets+'×'+(_auxFamily(n)==='hold'?'25 sec':repB);
        const legIso=pick(_laLeft.length>=2?_laLeft:_laGear,2,blockSeed(w)+105);""",
"D76 same-card subtraction + D75 hold dose")

# ── 3. THE 8302 GUARD: legIso[1] was written unconditionally ────────────────
rep(
"""        s.push({label:'Leg isolation',superset:true,rounds:hsets,items:[{name:legIso[0],detail:hsets+'×'+repB},{name:legIso[1],detail:hsets+'×'+repB}]});""",
"""        // V197: legIso[1] was written unconditionally. _gear's fallback used to guarantee
        // five members, so it always existed; with the fallback honest (D70b) a one-member
        // pool would print a superset whose second item is {name:undefined}, and
        // buildSectionsHTML, sessionLogProgress, sessionTimeEst and buildHeroPreview ALL
        // throw on that with no try on the path — the week view does not draw. Only this
        // site: the other 23 unguarded index sites are latent, not live.
        const _laItems=[{name:legIso[0],detail:_laDose(legIso[0])}];
        if(legIso[1])_laItems.push({name:legIso[1],detail:_laDose(legIso[1])});
        s.push({label:'Leg isolation',superset:_laItems.length>1,rounds:hsets,items:_laItems});""",
"8302 legIso[1] guard")

fail = []
for old, new, label in reps:
    c = src.count(old)
    print('anchor count==%d  %s' % (c, label))
    if c != 1:
        fail.append(label)
if fail:
    sys.exit('ABORT: anchor count != 1 for: ' + '; '.join(fail))

for old, new, label in reps:
    src = src.replace(old, new, 1)

assert src != orig
io.open(P, 'w', encoding='utf-8').write(src)
print('slice 1 written: %d replacements' % len(reps))
