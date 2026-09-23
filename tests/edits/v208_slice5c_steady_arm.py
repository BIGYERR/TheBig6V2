#!/usr/bin/env python3
# V208 slice 5c — D104a follow-up (coach, on builder's two decisions):
#   (a) REMOVE the unreachable `steady -> speed` arm from _nrcRunShape's run_base branch: "an arm no
#       lattice reaches is a claim no gate defends". run_base keys long only; every other run is easy.
#       §12: reinstate with a measure that reaches it (0 of 2,160 55+ and 0 of 360 18-35 programs carry
#       a steady run in their placement week: tests/measure/v208_d104a_steady_probe.js).
#   (b) deconflictSameRegion keeps its week-1 read; g208_d104a_runbase R1 is the watch (it asserts, at
#       >= 208, no lower Main on a long-keyed run or its eve in any week of any run_base program, which
#       is exactly the outcome that read could break). Comment only; no new row.
# Files: index.html (1 edit), tests/gates/g208_d104a_runbase.js (comments), tests/sabotage/v208_d104a.json
# (M1 re-anchored: its anchor was the run_base block this slice rewrites). No meta bump. Every anchor
# asserted count==1; all files planned in memory, nothing written on any miss.
import sys, json
R = '/Users/CanasBangin/Desktop/TheBig6V2/'
OLD_ARM = """    } else if(c.goalId === 'run_base'){
      // D104a (V208): run_base reads its keys only. The long run is the long-keyed run (the V159
      // budgeted "Easy Run — Long" is keyed long and carries no legLoad); the steady run is the
      // base block's one quality day, so the hinge rides it; every other run is easy.
      base = true;
      const _k = c.dose && c.dose.key;
      if(_k === 'long') long = d; else if(_k === 'steady') speed.add(d); else easy.add(d);
    } });
"""
NEW_ARM = """    } else if(c.goalId === 'run_base'){
      // D104a (V208): run_base reads its keys only. The long run is the long-keyed run (the V159
      // budgeted "Easy Run — Long" is keyed long and carries no legLoad); every other run is easy.
      // No speed day: no measured lattice puts a steady run in the placement week, so the steady
      // arm is not built (coach; reinstate with a measure that reaches it).
      base = true;
      if(c.dose && c.dose.key === 'long') long = d; else easy.add(d);
    } });
"""
GATE_EDITS = [
 ("""//   * _nrcRunShape has a run_base arm keyed on dose.key: long = key `long` (the V159 budgeted
//     "Easy Run — Long", no legLoad), speed = key `steady`, easy = the rest. _nrcLegCost unchanged.
""",
  """//   * _nrcRunShape has a run_base arm keyed on dose.key: long = key `long` (the V159 budgeted
//     "Easy Run — Long", no legLoad), easy = the rest. _nrcLegCost unchanged. The steady -> speed
//     arm was removed at slice 5c (coach: an arm no lattice reaches is a claim no gate defends).
"""),
 ("""//   R1  lower Main on a long-KEYED run or its eve, by calendar, over every week: 0 (run_base solo,
//       +bike, +swim). R1i prints the minutes-lens classifier count, UNASSERTED (coach).
""",
  """//   R1  lower Main on a long-KEYED run or its eve, by calendar, over every week: 0 (run_base solo,
//       +bike, +swim). R1i prints the minutes-lens classifier count, UNASSERTED (coach).
//       R1 is also the WATCH on deconflictSameRegion (coach, slice 5c): it still reads week 1 while
//       the placement reads the first long-keyed week, so on the programs placed from a later week
//       (R0 proves the class is reached) the region pass judges a different week. R1 = 0 is the
//       outcome that read could break. Measured at slice 5c: blinding the region guard to the shape,
//       or zeroing its cardio cost, moves no leg role in this lattice (both survive R1), so the
//       watch has no mutation that trips it today; drift that ever lands a lift there trips R1.
"""),
]
plans = {}
h = open(R + 'index.html', encoding='utf-8').read()
if h.count(OLD_ARM) != 1: sys.exit('ABORT: index.html run_base arm count=%d — nothing written' % h.count(OLD_ARM))
plans[R + 'index.html'] = h.replace(OLD_ARM, NEW_ARM, 1)
g = open(R + 'tests/gates/g208_d104a_runbase.js', encoding='utf-8').read()
for a, b in GATE_EDITS:
    if g.count(a) != 1: sys.exit('ABORT: gate anchor count=%d: %r — nothing written' % (g.count(a), a[:70]))
    g = g.replace(a, b, 1)
plans[R + 'tests/gates/g208_d104a_runbase.js'] = g
spec = json.load(open(R + 'tests/sabotage/v208_d104a.json', encoding='utf-8'))
m1 = [m for m in spec if m['name'].startswith('M1 ')]
if len(m1) != 1 or m1[0]['anchor'] != OLD_ARM: sys.exit('ABORT: spec M1 is not the slice 5 anchor — nothing written')
m1[0]['anchor'] = NEW_ARM
m1[0]['note'] = 'Re-anchored at slice 5c on the long-only arm. ' + m1[0]['note']
new_h = plans[R + 'index.html']
for m in spec:
    if new_h.count(m['anchor']) != 1: sys.exit('ABORT: spec %s anchor count=%d after the edit — nothing written' % (m['name'][:3], new_h.count(m['anchor'])))
plans[R + 'tests/sabotage/v208_d104a.json'] = json.dumps(spec, indent=2, ensure_ascii=False) + '\n'
for p, s in plans.items():
    open(p, 'w', encoding='utf-8').write(s)
print('slice 5c written:', ', '.join(p.replace(R, '') for p in plans))
