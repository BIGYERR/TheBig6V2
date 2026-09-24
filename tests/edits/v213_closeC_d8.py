#!/usr/bin/env python3
# V213 close, part C — gatekeeper RED: v207_d106a.json M11 SURVIVED on V213 (it tripped on V212).
# M11 removes the INT from D106a's trial hierarchy (`_inW('chi') || _inW('int') ||` -> `_inW('chi') ||`).
# At >= 213 the D8a/D8b fixture (Mon/Wed/Fri, tw 1-2) deals INT + CHI + long, so the trial takes the CHI
# and the INT fallback is never reached there. The fallback is still live on the 7 SPACER calendars,
# whose week keeps easy / INT / long (D113a's spacer fallback) and deals no CHI.
#   1. tests/gates/g207_test_week.js: D8c / D8d, a >= 213 row on the spacer calendar Mon/Tue/Wed with a
#      Thursday test at tw 1 and tw 2 (2026-09-24 and 2026-10-01 are the Thursdays of weeks 1 and 2 from
#      Mon 2026-09-21, calendar facts). It asserts: the pre-pin week deals easy + INT + long and no CHI;
#      the trial sits on Thu and nowhere else (it took the INT slot); no INT and no CHI are left in the
#      test week; 0 hard runs at T-1/T-2. Below 213 the rows SKIP by name.
#      Probed before writing: on V213 the pinned week is Mon rest, Tue easy, Wed easy (the long at T-1
#      became the shakeout), Thu TRIAL. Under M11 Mon keeps its INT and the long is taken instead.
#      The excluded injury modes (easy, reduce, noimpact, noimpact_swim) get NO row: probed on V213,
#      their test weeks carry no TIME TRIAL card at all (the injury sweep prints an easy protected run
#      or an incline walk on the test day), so "the trial takes the INT slot" has no card to read there.
#   2. tests/sabotage/v207_d106a.json: M11's note gains the >= 213 named trip (D8c D8d). Anchor, gate
#      and replacement are unchanged.
# No index.html change. No ia-version change.
import io, sys

ROOT = '/Users/CanasBangin/Desktop/TheBig6V2/tests/'
G207 = ROOT + 'gates/g207_test_week.js'
SPEC = ROOT + 'sabotage/v207_d106a.json'

ANCHOR = "let hm; try { hm = progDigest(IA.buildProgram(JSON.parse(JSON.stringify(IA.fixtures.HALF_MANNY)))); } catch(e){ hm = 'CRASH ' + e.message; }\n"
ROW = """// D8c / D8d (V213, D113a era): a SPACER calendar keeps the fallback week, easy / INT / long, and deals no
// CHI, so D106a's hierarchy puts the trial in the INT slot. Mon/Tue/Wed training, Thursday test. The
// calendar is one of D113a's 7 spacer calendars (g213 derives them from the D130 text); the premise is
// asserted in the row, so a week that stops dealing the fallback fails here by name.
for(const [lab, tw, date] of [['D8c spacer Mon/Tue/Wed tw1', 1, '2026-09-24'], ['D8d spacer Mon/Tue/Wed tw2', 2, '2026-10-01']]){
  if(VER < 213){ skipRow(lab + ' is a D113a-era row (the spacer fallback ships on ia-version 213)'); continue; }
  const restS = ['thu','fri','sat','sun'];
  const p = build(pinned({restDays:restS, _raceDateCappedWeeks:tw, _testWeek:tw, raceDate:date}));
  const pre = build(pinned({restDays:restS, _raceDateCappedWeeks:tw, raceDate:date}));
  if(p.crash || pre.crash){ ok(lab + ' builds', false, p.crash || pre.crash); continue; }
  const preW = pre.weeks[tw], wk = p.weeks[tw];
  const q = (W, d) => W[d] && !W[d].rest && W[d].cardio ? cardQuality(W[d].cardio) : null;
  const isLongLSD = c => !!c && /^Long Slow Distance/.test(c.subtype || '') && !!c.legLoad;
  const preQ = DAYS.map(d => q(preW, d));
  const preLong = DAYS.some(d => preW[d] && !preW[d].rest && isLongLSD(preW[d].cardio));
  const intLeft = DAYS.filter(d => q(wk, d) === 'int'), chiLeft = DAYS.filter(d => q(wk, d) === 'chi');
  const hard12 = ['tue','wed'].filter(d => { const x = wk[d]; const c = x && !x.rest && x.cardio; return !!c && (isHard(c) || isTrial(c) || isLongLSD(c)); });
  ok(lab + ' Thursday test (D113a spacer fallback): premise easy + INT + long dealt with no CHI; the trial takes the INT slot on Thu and nowhere else, '
     + 'no INT or CHI left in the test week, 0 hard runs at T-1/T-2',
     preQ.filter(x => x === 'int').length === 1 && !preQ.includes('chi') && preLong
       && JSON.stringify(trials(p)) === JSON.stringify([tw + 'thu']) && intLeft.length === 0 && chiLeft.length === 0 && hard12.length === 0,
     JSON.stringify({pre: DAYS.map(d => preW[d] && preW[d].cardio ? String(preW[d].cardio.subtype).slice(0, 22) : null), trials: trials(p), intLeft, chiLeft, hard12}));
}
"""
NOTE_OLD = 'EXPECTED: D8a D8b only."'
NOTE_NEW = ('EXPECTED: D8a D8b only. At ia-version >= 213 (D113a) the tw 1-2 fixture deals INT + CHI + long and the trial '
            'takes the CHI, so D8a/D8b never reach the INT fallback; the named trip there is D8c and D8d, the spacer calendar '
            'Mon/Tue/Wed whose fallback week still deals easy / INT / long: the INT survives on Mon. EXPECTED at >= 213: D8c D8d only."')

g = io.open(G207, encoding='utf-8').read()
s = io.open(SPEC, encoding='utf-8').read()
c1, c2, c3 = g.count(ANCHOR), s.count(NOTE_OLD), g.count("'D8c spacer")
print('g207  HALF_MANNY D9 anchor        count=%d  (D8c already present=%d)' % (c1, c3))
print('v207_d106a.json M11 note anchor  count=%d' % c2)
if c1 != 1 or c2 != 1 or c3 != 0:
    sys.exit('ABORT: an anchor did not appear exactly once. Nothing written.')
g = g.replace(ANCHOR, ROW + ANCHOR, 1)
s = s.replace(NOTE_OLD, NOTE_NEW, 1)
io.open(G207, 'w', encoding='utf-8').write(g)
io.open(SPEC, 'w', encoding='utf-8').write(s)
print('WROTE', G207)
print('WROTE', SPEC)
