#!/usr/bin/env python3
# V193 slice 3 — D46-c (pillar gate reads _auxGearOK) + D47 (budget does not protect optional).
# ia-version is ALREADY 193. This script does NOT touch the meta.
import io, sys

P = '/Users/CanasBangin/Desktop/TheBig6V2/index.html'
src = io.open(P, encoding='utf-8').read()
orig = src
edits = []

def rep(tag, old, new):
    edits.append((tag, old, new))

# ── D46-c: replace the landmine-only pillar gate with the real per-tier legality table ──
OLD_GATE = """  // V193 (D44): CORE_PILLARS is injected at WEEK ASSEMBLY, downstream of the pool block,
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
"""
NEW_GATE = """  // V193 (D44): CORE_PILLARS is injected at WEEK ASSEMBLY, downstream of the pool block,
  // so _gearOK never saw it and 'Landmine rotations' printed on home_basic and minimal —
  // tiers whose own wizard copy says "No barbell". Every pillar the rotation reads is
  // filtered through _pi so one lens answers for all of them.
  //
  // V193 (D46-c): the lens is _auxGearOK — the per-tier legality table this file already
  // carries and the swap sheet already trusts — not a second private list. D44's gate knew
  // one word, 'landmine', so it answered for one member of one pillar; 'Cable woodchoppers'
  // (commercial owns the only cable) and 'Medicine ball rotary toss' walked straight past
  // it onto every tier. One table, two readers: draw time here, swap time in
  // auxSwapCandidates. A member added to any pillar later is gated the day it lands.
  //
  // NO FALLBACK TO THE UNFILTERED LIST. A filtered-empty pool that falls back to the raw
  // one is the V122 _gear trap: it leaks exactly on the tier the gate exists for, and it
  // leaks silently. The pillars _pi reads hold at least two legal members on every tier
  // (measured, all six tiers — rotational_power 3/3/4/5/7/6 for bodyweight / minimal /
  // home_basic / home_full / commercial / crossfit; anti_rotation 2 on bodyweight and 5
  // elsewhere; dynamic_bracing 4 everywhere), so the filter cannot empty a pillar. If a
  // future member list would drop one below two, the pillar must GROW, not the gate soften.
  //
  // Bodyweight is gated here too. D44 exempted it because the pillar then held four members
  // and _BW_SUBS mapped the landmine to 'Standing torso rotations (slow)' while the other
  // two rotational members both swept to 'Dead bug (slow tempo)' — filtering cost the tier
  // its third distinct movement and the pair collapsed to a ONE-ITEM block. D46 promoted
  // that substitution target to a real member and added two more, so bodyweight now draws
  // three distinct legal names on its own and the sweep no longer has to invent one.
  //
  // An undefined equip still means "gear unknown" and leaves the pillars untouched, so no
  // existing caller is silently narrowed.
  const _pi = key => equip===undefined
    ? P[key].items
    : (P[key].items||[]).filter(it=>_auxGearOK(it.name, equip));
"""
rep('D46-c pillar gate', OLD_GATE, NEW_GATE)

# ── D47: the set budget does not protect a section flagged optional ──
OLD_PROT = """  const _protected=s=>{
    const L=((s&&s.label)||'').toLowerCase();
    return s.core||s.hip||/^main\\b|^primer|^power\\b|^strength\\b/.test(L)||/hip|mobility|stretch/.test(L);
  };"""
NEW_PROT = """  const _protected=s=>{
    // V193 (D47): an OPTIONAL section is never protected. injectDynamicCore pushes the core
    // finisher with optional:true and s.core:true, and s.core won here — so the budget paid
    // for a finisher the engine itself called optional by trimming the prehab rail, which
    // ships under labels like 'Chest + knee' that match no protection and rank 1. Measured on
    // the D44 artifact: 69/8160 home_basic day-builds lost an item, top losses Dumbbell
    // lateral raise -14, Spanish squat hold (KB) -9, Wall sit -7 — two knee prehab, three
    // cuff/scap. _secRank already ranks s.optional at 3 (trimmed first); this clause simply
    // lets it be reached. Nothing else moves: the budget value, the cost model, the barbell
    // tier-3 guard and every non-optional protection are untouched.
    if(s&&s.optional) return false;
    const L=((s&&s.label)||'').toLowerCase();
    return s.core||s.hip||/^main\\b|^primer|^power\\b|^strength\\b/.test(L)||/hip|mobility|stretch/.test(L);
  };"""
rep('D47 optional not protected', OLD_PROT, NEW_PROT)

for tag, old, new in edits:
    n = src.count(old)
    if n != 1:
        sys.stderr.write('ABORT: anchor "%s" count==%d (need 1)\n' % (tag, n))
        sys.exit(1)

for tag, old, new in edits:
    src = src.replace(old, new, 1)
    print('applied: %s' % tag)

assert src != orig
io.open(P, 'w', encoding='utf-8').write(src)
print('wrote %s (%d -> %d bytes)' % (P, len(orig.encode('utf-8')), len(src.encode('utf-8'))))
