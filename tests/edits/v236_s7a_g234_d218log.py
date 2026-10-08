#!/usr/bin/env python3
# V236 slice 7a (gates only), D218/D219 Amendment 1 (foot of tests/measure/v236_rulings/v236_ruling_d218_d219.md).
#  1. g234 preOk, Amendment 1 (d): the line as worded, J(STAMP >= 236 ? {planned,active,logged:'0'} : {planned,active});
#     the exact-dataset compare is kept.
#  2. g236 D218-log, Amendment 1 (a): the PARKED run-pace conjunct is replaced by the restated hand oracle: W1 FRI (time
#     form) after D218-draft's roll, run_pace ''; and W1 SAT (dist form), fresh store, roll 0:47:13: entry null before
#     the tap, then run_mins "47.22", run_dist "3.1", run_pace "15:14/mi", rpe ''. Row name unchanged.
# Every anchor in both files asserted count==1 before either file is written; all or nothing. index.html is not touched.
import sys

G234 = '/Users/CanasBangin/Desktop/TheBig6V2/tests/gates/g234_d213_swapkeep.js'
G236 = '/Users/CanasBangin/Desktop/TheBig6V2/tests/gates/g236_d218_logbutton.js'
g234 = open(G234, encoding='utf-8').read()
g236 = open(G236, encoding='utf-8').read()

R234 = [(
"""const preOk = PRE.sub === 'Long Run' && PRE.wrap === J({ planned:'run', active:'run' }) && PRE.strip;
""",
"""// D218/D219 Amendment 1 (d): from VER 236 the wrap carries the regime attribute at every render, '0' on an empty store
// (D218 item 1); the exact-dataset compare is kept.
const preOk = PRE.sub === 'Long Run' && PRE.wrap === J(STAMP >= 236 ? { planned:'run', active:'run', logged:'0' } : { planned:'run', active:'run' }) && PRE.strip;
""")]

R236 = [(
"""// licence file's: tests/measure/v236_rulings/v236_row_ruled.txt.
""",
"""// licence file's: tests/measure/v236_rulings/v236_row_ruled.txt. D218/D219 Amendment 1 (the ruling file's foot) restates
// D218-log (a).
"""), (
"""//   D218-log       then the Log tap: run_mins "47.22", run_dist "", rpe "", ia_hist_ snapshot present, button Logged ✓,
//                  data-logged "1", toast Run logged ✓. PARKED conjunct run-pace: the ruling asks run_pace "derived
//                  (47.22 x 60 / plan miles by hand)", but W1 FRI is a time dose with no plan miles and the candidate (like
//                  V235) stores run_pace "" there; no hand value exists for it, so the conjunct FAILS by name, PARKED, back
//                  to coach (the 3.1 mi derivation holds on W1 SAT, see D218-chip's control).
""",
"""//   D218-log       (Amendment 1 (a)) W1 FRI, the time form (plan 25 min, no plan miles), after D218-draft's roll 0:47:13,
//                  the Log tap: run_mins "47.22", run_dist "", run_pace "" (the time form derives pace from miles and none
//                  were rolled), rpe "", ia_hist_ snapshot present, button Logged ✓, data-logged "1", toast Run logged ✓.
//                  W1 SAT, the dist form (plan 3.1 mi), fresh store, roll 0:47:13: entry null before the tap; the tap
//                  stores run_mins "47.22", run_dist "3.1" (the V148 plan stamp lands at the tap), run_pace "15:14/mi"
//                  (47.22 x 60 = 2833.2 s / 3.1 mi = 913.9 s, rounded to 914 s = 15:14), rpe "".
"""), (
"""  'D218-log':       'D218-log (VER >= 236) the Log tap stores run_mins 47.22, rpe blank, snapshot, Logged ✓, toast Run logged ✓ (run-pace conjunct PARKED)',
""",
"""  'D218-log':       'D218-log (VER >= 236) the Log tap: W1 FRI time form stores 47.22 with pace and rpe blank, snapshot, Logged ✓, toast Run logged ✓; W1 SAT dist form stores 47.22, 3.1, 15:14/mi',
"""), (
"""      ['toast', C.toast() === COPY.run, 'toast ' + J(C.toast()) + ' (hand "Run logged ✓")'],
      ['run-pace', false, 'PARKED, back to coach: the ruling asks run_pace "derived (47.22 x 60 / plan miles by hand)"; W1 FRI is a time dose (plan 25 min, no plan miles), so no hand value exists, and the candidate stores run_pace ' + J(L.run_pace) + ' (V235 stores "" on the same roll)']]);
});
""",
"""      ['toast', C.toast() === COPY.run, 'toast ' + J(C.toast()) + ' (hand "Run logged ✓")'],
      ['run_pace', L.run_pace === '', 'W1 FRI time form run_pace ' + J(L.run_pace) + ' (hand "": no miles rolled, Amendment 1 (a))']].concat(satLog()));
});
// D218/D219 Amendment 1 (a): W1 SAT, the dist form (plan 3.1 mi), fresh store, roll 0:47:13, then the Log tap.
function satLog(){
  fresh(); C.open(1, 'sat'); C.roll(C.need('log_run_mins'), [[1, '47'], [2, '13']]);
  const pre = C.entry(1, 'sat'); const tapped = C.log(); const T = C.entry(1, 'sat') || {};
  return [['sat-pre', pre === null, 'W1 SAT roll 0:47:13: entry before the tap ' + J(pre) + ' (hand null)'],
    ['sat-tap', tapped && T.run_mins === TAIL && T.run_dist === SAT_DIST && T.run_pace === SAT_PACE && T.rpe === '',
      'W1 SAT Log: run_mins ' + J(T.run_mins) + ', run_dist ' + J(T.run_dist) + ', run_pace ' + J(T.run_pace) + ', rpe ' + J(T.rpe) + ' (hand "47.22", "3.1", "15:14/mi", "")']];
}
""")]

for name, src, R in (('g234', g234, R234), ('g236', g236, R236)):
    for i, (old, new) in enumerate(R):
        if src.count(old) != 1:
            sys.exit('ABORT: %s anchor %d count=%d\n%s' % (name, i, src.count(old), old[:140]))
g234b, g236b = g234, g236
for old, new in R234: g234b = g234b.replace(old, new, 1)
for old, new in R236: g236b = g236b.replace(old, new, 1)
assert 'PARKED' not in g236b
open(G234, 'w', encoding='utf-8').write(g234b)
open(G236, 'w', encoding='utf-8').write(g236b)
print('OK: g234 %d replacement(s); g236 %d replacement(s)' % (len(R234), len(R236)))
