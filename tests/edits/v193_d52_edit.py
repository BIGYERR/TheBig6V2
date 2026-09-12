#!/usr/bin/env python3
# V193 D52 — lowback/protect vertical-pull pool vs its own overlay.
# 1) pool literal drops 'L-sit chinups' (SPINE_SWAP nulls it) and keeps four survivors
# 2) whole-pool subtraction of backCompoundPool replaced by a single-name exclusion of
#    the DRAWN backMain at the row-slot draw site (proved downstream of backMain)
# 3) comment at the anti-rotation pillar site loses its stale legality table
# ia-version stays 193 by Mario's instruction: no meta bump in this script.
import io, sys

P = '/Users/CanasBangin/Desktop/TheBig6V2/index.html'
s = io.open(P, encoding='utf-8').read()
orig = s
reps = []

def rep(tag, old, new):
    reps.append((tag, old, new))

# ── EDIT 1 + 2: pool literal and the subtraction ────────────────────────────
rep('pool-comment', """        // V193 (same-card fix): D44's replacement was ANOTHER one-item literal, and on
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
""", """        // V193 (same-card fix): D44's replacement was ANOTHER one-item literal, and on
        // the two cable-less BARBELL tiers it named a movement backCompoundPool already
        // holds — so 'Assisted pullups' printed as the day's Main AND as Pull superset A
        // on 128 day-builds. The one-item pool is the defect, not the name inside it.
        // _slot already refuses a name the day has taken ('_took', active because this
        // branch dirties the upper domain), but with a single candidate the pool empties
        // under that guard and _slot takes the repeat instead of short-drawing. So the
        // branch gets a POOL.
        // Candidates are the app's own vertical pulls, verified through the real
        // _pattern: all of them read 'vpull', which P.drop's {hinge,row} does not touch
        // and P.dropNames does not match. None carries a barbell, cable, machine or
        // dumbbell token, so _gearOK passes every one on every tier; 'Weighted chinups'
        // needs something to hang off the athlete, so it is gated on the tier owning an
        // implement rather than left to a name test that cannot see it.
        //
        // V193 (D52): two errors stacked here and both are fixed on this line.
        // (a) The pool offered a movement its OWN overlay forbids. 'L-sit chinups' is
        //     loaded lumbar flexion, so this same pass nulls it in SPINE_SWAP — draw it
        //     and the overlay deletes it with no substitute, singletonSupersetSweep
        //     collapses the superset, and the athlete gets a lone press. 108 Full Body
        //     day-builds shipped with zero pulling. The membership is now derived, not
        //     guessed: EXLIB.back_pull minus the SPINE_SWAP null, plus the assisted
        //     regression from EXLIB.back_pull_joint. A pool built inside an injury branch
        //     may not name anything that branch's own filter removes — see
        //     tests/gates/g193_pool_overlay.js, which holds that for every branch and
        //     every gear tier and also holds D44's floor of two survivors.
        // (b) Subtracting the WHOLE backCompoundPool to prevent ONE duplicate is what
        //     starved home_full down to two members in the first place. Only one name can
        //     actually collide: the main the day DRAWS. That exclusion moved downstream to
        //     the row-slot draw site, where backMain exists (see _rowSrc). Nothing here
        //     narrows the swap universe either: every excluded name is a backCompoundPool
        //     member, and that pool is registered whole by the backMain slot first.
""")

rep('pool-literal', """        rowPool = hasCables?['Straight-arm pulldown']:['Assisted pullups','Neutral-grip chinups','Chinups','L-sit chinups','Weighted chinups']
          .filter(n=>hasDumbbells||!/weighted/i.test(n))
          .filter(n=>backCompoundPool.indexOf(n)<0);
""", """        rowPool = hasCables?['Straight-arm pulldown']:['Assisted pullups','Neutral-grip chinups','Chinups','Weighted chinups']
          .filter(n=>hasDumbbells||!/weighted/i.test(n));
""")

# ── EDIT 2b: the single-name exclusion at the draw site ─────────────────────
rep('rowsrc', """    const _rowUni = (rowPool||[]).filter(_isUnilateralRow);
    const _rowBi  = (rowPool||[]).filter(n=>!_isUnilateralRow(n));
    const _rowA   = _slot(_rowBi.length?_rowBi:rowPool,1,bs+3,'upper')[0]||null;
""", """    // V193 (D52): the pull day's MAIN is excluded here, by name, and only here. An
    // injury branch that rewrites rowPool may legitimately name the same vertical pulls
    // its main-lift pool holds; the only name that can print twice on the card is the one
    // backMain actually drew, so that is the only name subtracted. Scoped to a pool the
    // plan rewrote (V111): on a healthy bodyweight tier backCompoundPool and rowPool share
    // their inverted-row rungs on purpose, and ungated this would rewrite plans that have
    // no defect. The swap universe is untouched — backMain belongs to backCompoundPool,
    // which _slot registered whole three slots earlier. Falls back to the unfiltered pool
    // rather than emptying, the same rule _slot uses internally.
    const _rowSrc0 = (_inj&&rowPool!==_preInj.row)?(rowPool||[]).filter(n=>n!==backMain):(rowPool||[]);
    const _rowSrc  = _rowSrc0.length?_rowSrc0:(rowPool||[]);
    const _rowUni = _rowSrc.filter(_isUnilateralRow);
    const _rowBi  = _rowSrc.filter(n=>!_isUnilateralRow(n));
    const _rowA   = _slot(_rowBi.length?_rowBi:_rowSrc,1,bs+3,'upper')[0]||null;
""")

rep('rowbpool', """    const _rowInjUni=_inj&&rowPool!==_preInj.row&&!_rowBi.length;
    const _rowBpool=_rowInjUni?[]:(_rowUni.length?_rowUni:(rowPool||[])).filter(n=>n!==_rowA);
""", """    const _rowInjUni=_inj&&rowPool!==_preInj.row&&!_rowBi.length;
    const _rowBpool=_rowInjUni?[]:(_rowUni.length?_rowUni:_rowSrc).filter(n=>n!==_rowA);
""")

# ── EDIT 4: the stale legality table in the pillar comment ──────────────────
rep('pillar-comment', """  // V122 _gear trap. Measured floor: the only pillar members a lift card can hold are the
  // two carries, and anti_rotation keeps 3/2/4/4/5/4 members across bodyweight / minimal /
  // home_basic / home_full / commercial / crossfit once both are subtracted, so the pair
  // below always has two distinct names and the guard is unreachable.
""", """  // V122 _gear trap. The floor here is an invariant, not a table: under _auxGearOK the
  // bodyweight-legal set is a SUBSET of the minimal-legal set, so a bodyweight count can
  // never exceed a minimal count on the same pillar. Counts in comments are claims with no
  // gate behind them and they go stale silently, so the executable checks own this one:
  // the anti-rotation floor gate, and tests/measure/v193_d49_antirotation.js.
""")

for tag, old, new in reps:
    c = s.count(old)
    if c != 1:
        sys.stderr.write('ABORT %s: count==%d\\n' % (tag, c))
        sys.exit(1)
    s = s.replace(old, new, 1)

assert s != orig
io.open(P, 'w', encoding='utf-8').write(s)
print('OK %d replacements' % len(reps))
