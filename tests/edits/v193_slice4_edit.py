# V193 slice 4 — two fixes at the protect-tier upper-limb seam (~line 7852 of index.html).
#
# Fix 1 (D46-c reaches its third reader): the protect-tier shoulder/elbow branch builds its
# own anti-rotation draw with a /carry/i strip and NO gear gate. Route it through the same
# _auxGearOK lens every other pillar reader uses. 'Pallof press' was printing 20x on
# bodyweight and 20x on minimal, tiers that own no band.
#
# Fix 2 (regression D49 introduced): 'Bird dogs' is a member of BOTH anti_rotation (D49) and
# anti_extension.static, and this branch pushes both sections from two independent rotations,
# so 85 of 8,820 days printed 'Bird dogs' twice. deconflictAdjacentDupes is adjacent-DAY only
# and returns early on core items, so nothing downstream can see it. The anti-rotation section
# re-draws from its own pillar; anti_extension keeps the name because 'Bird dogs' is the
# anti-extension member it was written as.
#
# ia-version stays 193 (same release, later slice). No version replacement in this script.
import io, sys

P = '/Users/CanasBangin/Desktop/TheBig6V2/index.html'
src = io.open(P, encoding='utf-8').read()

def rep(old, new, tag):
    global src
    n = src.count(old)
    if n != 1:
        sys.stderr.write('ABORT %s: anchor count==%d (want 1)\n' % (tag, n))
        sys.exit(1)
    src = src.replace(old, new, 1)
    sys.stdout.write('ok %s\n' % tag)

# ── 1. the comment that claims two readers ───────────────────────────────────
rep(
"""  // it onto every tier. One table, two readers: draw time here, swap time in
  // auxSwapCandidates. A member added to any pillar later is gated the day it lands.""",
"""  // it onto every tier. One table, THREE readers: draw time here, swap time in
  // auxSwapCandidates, and the protect-tier upper-limb branch in buildSections, which
  // builds its own anti-rotation draw and was the reader D46-c missed. A member added to
  // any pillar later is gated the day it lands, on all three.""",
'comment: two readers -> three')

# ── 2. gear-gate the protect-tier anti-rotation draw ─────────────────────────
rep(
"""        const _ar=CORE_PILLARS.anti_rotation.items.filter(it=>!/carry/i.test(it.name));""",
"""        // V193 (D46-c, slice 4): the gear gate reaches this draw too. This branch was the
        // THIRD reader of the pillar and the only one with no lens on it, so 'Pallof press'
        // — tagged band gear in _AUX_GEAR — printed on bodyweight and on minimal, neither of
        // which owns a band. Same predicate, same table, no second private list. The carry
        // strip stays: it is this day's own rule, not a gear rule. Measured legal members
        // after both filters: 2 on bodyweight, 3 on minimal, 4 on the four gear tiers, so the
        // pair below always has two distinct names to draw and no fallback is needed.
        const _ar=CORE_PILLARS.anti_rotation.items.filter(it=>!/carry/i.test(it.name)&&_auxGearOK(it.name,equip));""",
'fix1: _ar through _auxGearOK')

# ── 3. de-duplicate the two trunk sections ───────────────────────────────────
rep(
"""        const _ae=CORE_PILLARS.anti_extension.static;
        s.push({label:'Trunk — anti-rotation',items:[{..._rot(_ar,0)},{..._rot(_ar,1)}]});
        s.push({label:'Trunk — anti-extension',items:[{..._rot(_ae,0)},{..._rot(_ae,2)}]});""",
"""        const _ae=CORE_PILLARS.anti_extension.static;
        // V193 (slice 4): 'Bird dogs' is a member of BOTH pillars — D49 added it to
        // anti-rotation and anti_extension.static has always held it — and these two sections
        // draw from two independent rotations, so the same movement could land on both and
        // print twice on one card. deconflictAdjacentDupes cannot catch it: it compares
        // ADJACENT DAYS and returns early on core items by design.
        // Anti-extension keeps the name when they collide. 'Bird dogs' is the anti-extension
        // member it was written as (contralateral reach against spinal extension), and the
        // anti-rotation pillar has somewhere else to go on every tier. The anti-rotation
        // section walks its own rotation forward past any name the anti-extension pair
        // already took, so an uncontested week draws exactly the pair it drew before.
        const _aePick=[_rot(_ae,0),_rot(_ae,2)];
        const _taken=Object.create(null); _aePick.forEach(it=>{_taken[it.name]=1;});
        const _arPick=[];
        for(let _k=0;_k<_ar.length&&_arPick.length<2;_k++){
          const _it=_rot(_ar,_k);
          if(_taken[_it.name]) continue;
          _taken[_it.name]=1; _arPick.push(_it);
        }
        s.push({label:'Trunk — anti-rotation',items:_arPick.map(it=>({...it}))});
        s.push({label:'Trunk — anti-extension',items:_aePick.map(it=>({...it}))});""",
'fix2: trunk sections de-duplicated')

io.open(P, 'w', encoding='utf-8').write(src)
sys.stdout.write('WROTE %s\n' % P)
