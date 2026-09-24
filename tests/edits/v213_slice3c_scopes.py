#!/usr/bin/env python3
# V213 slice 3c — three gates whose rows D113a / D146 trip for reasons that are not regressions.
#   (i)   tests/gates/g207_test_week.js D8a/D8b: the premise "three-run tw1/tw2, no CHI dealt, INT on
#         Mon" is V212's three-run week. From 213 the three-run week deals INT + CHI + long, and the
#         trial takes the CHI slot (D106a's hierarchy). ERA ROWS: <=212 keeps the old premise and
#         assertion byte for byte; >=213 asserts the D113a form: INT + CHI + long dealt before the pin,
#         the trial on Sun and nowhere else, no CHI left, any INT left sits 3 or more calendar days
#         before the trial, and 0 hard runs (INT, CHI, a leg-loading LSD, a trial) at T-1 and T-2.
#   (ii)  tests/gates/g208_d103a_key.js K4 and (iii) g208_d103a_readers.js S3: build-pair byte identity
#         written for V208's own slices (candidate 208 against its pre-slice tree, both 208). They ran
#         on ANY same-version pair, so a later build before its bump (212 against V212) ran them and
#         D113a's moves tripped them. Standing ruling 4: they now run only when the candidate reads
#         208, and SKIP by name on every other pair.
# No index.html change. No ia-version change.
import io, sys

ROOT = '/Users/CanasBangin/Desktop/TheBig6V2/tests/gates/'

def apply(fname, reps):
    p = ROOT + fname
    src = io.open(p, encoding='utf-8').read()
    bad = False
    for tag, old, new in reps:
        c = src.count(old)
        print('%-24s %-40s count=%d' % (fname, tag, c))
        if c != 1: bad = True
    if bad:
        sys.exit('ABORT: an anchor in %s did not appear exactly once. Nothing written.' % fname)
    for tag, old, new in reps:
        if src.count(old) != 1:
            sys.exit('ABORT: %s anchor %s drifted. Nothing written.' % (fname, tag))
        src = src.replace(old, new, 1)
    return p, src

G207 = [
("E1 D8 era rows",
"""  ok(lab + ' Sunday test: premise holds (no CHI dealt, INT on Mon); the trial is on Sun, Mon rests, no INT left, both LSDs kept',
     !preQ.some(q => q === 'chi') && preQ[0] === 'int'
       && JSON.stringify(trials(p)) === JSON.stringify([tw + 'sun']) && !!wk.mon && !!wk.mon.rest
       && !DAYS.some(d => wk[d] && isHard(wk[d].cardio)) && JSON.stringify(lsd) === '["wed","fri"]',
     JSON.stringify({pre: preSub, trials: trials(p), mon: wk.mon && wk.mon.title, lsd}));""",
"""  // V213 (D113a) ERA ROWS (standing ruling 4). Through 212 the three-run week is easy / INT / long and
  // the row below is the one D106a shipped. From 213 it is INT / CHI / long, so the premise is gone by
  // ruling and the row asserts what D106a's hierarchy does with the new week.
  if(VER <= 212)
  ok(lab + ' Sunday test: premise holds (no CHI dealt, INT on Mon); the trial is on Sun, Mon rests, no INT left, both LSDs kept',
     !preQ.some(q => q === 'chi') && preQ[0] === 'int'
       && JSON.stringify(trials(p)) === JSON.stringify([tw + 'sun']) && !!wk.mon && !!wk.mon.rest
       && !DAYS.some(d => wk[d] && isHard(wk[d].cardio)) && JSON.stringify(lsd) === '["wed","fri"]',
     JSON.stringify({pre: preSub, trials: trials(p), mon: wk.mon && wk.mon.title, lsd}));
  else {
    const preW = pre.weeks[tw];
    const preLong = DAYS.some(d => preW[d] && preW[d].cardio && /^Long Slow Distance/.test(preW[d].cardio.subtype || '') && !!preW[d].cardio.legLoad);
    const TI = DAYS.indexOf('sun');
    const intLeft = DAYS.filter(d => wk[d] && !wk[d].rest && cardQuality(wk[d].cardio) === 'int');
    const chiLeft = DAYS.filter(d => wk[d] && !wk[d].rest && cardQuality(wk[d].cardio) === 'chi');
    const hardAt = d => { const x = wk[d]; const c = x && !x.rest && x.cardio; return !!c && (isHard(c) || isTrial(c) || (/^Long Slow Distance/.test(c.subtype || '') && !!c.legLoad)); };
    const hard12 = ['fri','sat'].filter(hardAt);   // T-2 and T-1 of a Sunday test, same ISO week
    ok(lab + ' Sunday test (D113a era): premise INT + CHI + long dealt; the trial takes the CHI slot on Sun and nowhere else, no CHI left, '
       + 'any INT left sits 3 or more days before the trial, 0 hard runs at T-1/T-2',
       preQ.includes('int') && preQ.includes('chi') && preLong
         && JSON.stringify(trials(p)) === JSON.stringify([tw + 'sun']) && chiLeft.length === 0
         && intLeft.every(d => TI - DAYS.indexOf(d) >= 3) && hard12.length === 0,
       JSON.stringify({pre: preSub, trials: trials(p), intLeft, chiLeft, hard12}));
  }"""),
]

GKEY = [
("E1 K4 scoped to the V208 pair",
"""  if(+IB.version !== VER) console.log('SKIP K4 runs only against the pre-slice tree at the same ia-version (build-time proof for D103a slices 1-3); this pair is ' + VER + ' vs ' + IB.version);""",
"""  if(+IB.version !== VER) console.log('SKIP K4 runs only against the pre-slice tree at the same ia-version (build-time proof for D103a slices 1-3); this pair is ' + VER + ' vs ' + IB.version);
  // V213 (standing ruling 4): K4 is V208's own build pair. A later build before its bump also reads the
  // same version as its baseline, and its ruled moves are not K4's business.
  else if(VER !== ERA) console.log('SKIP K4 scoped to the D103a build pair (candidate 208 against its 208 pre-slice tree); this pair is ' + VER + ' vs ' + IB.version + ', a later build before its bump');"""),
]

GREAD = [
("E1 S3 scoped to the V208 pair",
"""  if(!(IB && +IB.version === VER)) skip('S3 runs only against the pre-slice tree at the same ia-version; ' + (IB ? 'this pair is ' + VER + ' vs ' + IB.version : 'no baseline'));""",
"""  if(!(IB && +IB.version === VER)) skip('S3 runs only against the pre-slice tree at the same ia-version; ' + (IB ? 'this pair is ' + VER + ' vs ' + IB.version : 'no baseline'));
  // V213 (standing ruling 4): S3 is V208's own build pair. A later build before its bump also reads the
  // same version as its baseline, and its ruled moves are not S3's business.
  else if(VER !== ERA) skip('S3 scoped to the D103a slice 2 build pair (candidate 208 against its 208 pre-slice tree); this pair is ' + VER + ' vs ' + IB.version + ', a later build before its bump');"""),
]

out = [apply('g207_test_week.js', G207), apply('g208_d103a_key.js', GKEY), apply('g208_d103a_readers.js', GREAD)]
for p, s in out:
    io.open(p, 'w', encoding='utf-8').write(s)
    print('WROTE', p)
