# V193 (RED fix): two same-card duplicate defects.
#   Fix 1 — lowback/protect cable-less rowPool was a one-item literal that collided
#           with the pull day's own main lift (128/41754 day-builds).
#   Fix 2 — the injected dynamic core block could draw a carry the day had already
#           placed as its 'Loaded carry finisher' (16/41754 day-builds).
# ia-version stays 193: this is a red-build repair, not a new release.
import io, sys

P = '/Users/CanasBangin/Desktop/TheBig6V2/index.html'
s = io.open(P, encoding='utf-8').read()

reps = []

# ── Fix 1 ────────────────────────────────────────────────────────────────────
old1 = """        // itself. Cable-less tiers get the hanging vertical pull this branch's own
        // comment prescribes. Also 'vpull', so P.drop's row rule leaves it alone.
        rowPool = hasCables?['Straight-arm pulldown']:['Assisted pullups'];
"""
new1 = """        // itself. Cable-less tiers get the hanging vertical pull this branch's own
        // comment prescribes. Also 'vpull', so P.drop's row rule leaves it alone.
        //
        // V193 (same-card fix): D44's replacement was ANOTHER one-item literal, and on
        // the two cable-less BARBELL tiers it named a movement backCompoundPool already
        // holds — so 'Assisted pullups' printed as the day's Main AND as Pull superset A
        // on 128 day-builds. The one-item pool is the defect, not the name inside it.
        // _slot already refuses a name the day has taken ('_took', active because this
        // branch dirties the upper domain), but with a single candidate the pool empties
        // under that guard and _slot takes the repeat instead of short-drawing. So the
        // branch gets a POOL, and the main-lift pool is subtracted from it by name.
        // Candidates are the app's own vertical pulls (EXLIB.back_pull plus the assisted
        // regression), verified through the real _pattern: all five read 'vpull', which
        // P.drop's {hinge,row} does not touch and P.dropNames does not match. None carries
        // a barbell, cable, machine or dumbbell token, so _gearOK passes every one on
        // every tier; 'Weighted chinups' needs something to hang off the athlete, so it is
        // gated on the tier owning an implement rather than left to a name test that
        // cannot see it. Members left AFTER the subtraction: 2 on home_full and crossfit
        // (their main pool holds the other three), 5 on home_basic and minimal, 4 on
        // bodyweight. Never one. Commercial keeps the pulldown: its main pool cannot
        // contain a straight-arm pulldown, so that branch has nothing to collide with.
        rowPool = hasCables?['Straight-arm pulldown']:['Assisted pullups','Neutral-grip chinups','Chinups','L-sit chinups','Weighted chinups']
          .filter(n=>hasDumbbells||!/weighted/i.test(n))
          .filter(n=>backCompoundPool.indexOf(n)<0);
"""
reps.append(('fix1-rowpool', old1, new1))

# ── Fix 2a — getDynamicCoreBlock takes the day's card ─────────────────────────
old2 = "function getDynamicCoreBlock(week, role, isHardRunToday, tomorrowHot, slot, equip){\n"
new2 = "function getDynamicCoreBlock(week, role, isHardRunToday, tomorrowHot, slot, equip, onCard){\n"
reps.append(('fix2-signature', old2, new2))

# ── Fix 2b — _pi also subtracts what the card already prescribes ──────────────
old3 = """  const _pi = key => equip===undefined
    ? P[key].items
    : (P[key].items||[]).filter(it=>_auxGearOK(it.name, equip));
"""
new3 = """  //
  // V193 (same-card fix): a SECOND lens, on the same draw. 'Farmer carry' is a member of
  // anti_rotation and is also the movement the lift day's 'Loaded carry finisher' picks,
  // and the two never spoke — 16 day-builds printed the identical carry twice on one card,
  // one per loaded gear tier. The CORE BLOCK yields, not the finisher, because the core
  // block is the LATER reader: it is injected at week assembly and can see the built card,
  // while the finisher runs inside buildSections and cannot see a block that does not exist
  // yet. Same shape as the anti-extension/anti-rotation walk in the protect-tier branch.
  // The subtraction runs AFTER the gear filter, so it can never widen legality, and the
  // guard below can only ever hand back a gear-legal list — it is a crash guard, not the
  // V122 _gear trap. Measured floor: the only pillar members a lift card can hold are the
  // two carries, and anti_rotation keeps 3/2/4/4/5/4 members across bodyweight / minimal /
  // home_basic / home_full / commercial / crossfit once both are subtracted, so the pair
  // below always has two distinct names and the guard is unreachable.
  const _onCard = onCard || Object.create(null);
  const _pi = key => {
    const g = equip===undefined
      ? (P[key].items||[])
      : (P[key].items||[]).filter(it=>_auxGearOK(it.name, equip));
    const d = g.filter(it=>!_onCard[String(it.name||'').trim().toLowerCase()]);
    return d.length ? d : g;
  };
"""
reps.append(('fix2-pi', old3, new3))

# ── Fix 2c — the caller reads the card it is about to append to ───────────────
old4 = """    const block=getDynamicCoreBlock(week, dayRoles[day], isHardRun(day), hot, slot, equip);
"""
new4 = """    // V193 (same-card fix): the names this day already prescribes, read off the BUILT
    // sections rather than re-derived, so the core draw and the section builder can never
    // disagree about what is on the card. Lowercased on the same axis the bodyweight
    // dedupe sweep uses.
    const _onCardNames=Object.create(null);
    ((weekObj[day]&&weekObj[day].sections)||[]).forEach(function(sec){
      ((sec&&sec.items)||[]).forEach(function(it){ if(it&&it.name) _onCardNames[String(it.name).trim().toLowerCase()]=1; });
    });
    const block=getDynamicCoreBlock(week, dayRoles[day], isHardRun(day), hot, slot, equip, _onCardNames);
"""
reps.append(('fix2-caller', old4, new4))

for name, old, new in reps:
    n = s.count(old)
    if n != 1:
        sys.stderr.write('ANCHOR MISS %s: count==%d\n' % (name, n))
        sys.exit(1)
    s = s.replace(old, new, 1)
    sys.stdout.write('applied %s\n' % name)

io.open(P, 'w', encoding='utf-8').write(s)
sys.stdout.write('WROTE %s\n' % P)
