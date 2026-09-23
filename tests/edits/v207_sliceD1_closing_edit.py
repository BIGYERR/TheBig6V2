#!/usr/bin/env python3
# V207 closing slice D1 (Mario authorized the bump; coach's rulings verbatim):
#   1. tests/harness.js: three REFERENCE era rows at 207, ruled UNMOVED (D106a).
#   2. tests/gates/g199_deload_arbitration.js: DELOAD_ARB_BY_VERSION[207] REFERENCE row.
#   3. tests/gates/g202_int_doctrine.js: D142 renewal of the three-run licence to 207.
#   4. index.html: ia-version 206 -> 207 (LAST).
# Every anchor in every file is asserted count==1 BEFORE any file is written; abort on the first miss.
import sys
ROOT = '/Users/CanasBangin/Desktop/TheBig6V2/'
PLAN = {}   # path -> list of (name, old, new)

PLAN['tests/harness.js'] = [
 ('H1 MANNY 207',
  "MANNY_DIGEST_BY_VERSION[206] = '0ac7da6b1691a8e1';   // D109: the ruled digest move (copy only, 53/98 days text-only)\n",
  "MANNY_DIGEST_BY_VERSION[206] = '0ac7da6b1691a8e1';   // D109: the ruled digest move (copy only, 53/98 days text-only)\n"
  "// V207: ruled UNMOVED, so a REFERENCE row. Coach printed it on the V206 tag and a slice-A copy,\n"
  "// identical to [206]. D106a touches the NSW test-goal path only.\n"
  "MANNY_DIGEST_BY_VERSION[207] = MANNY_DIGEST_BY_VERSION[206];   // D106a: ruled UNMOVED (NSW test-goal path only; NRC reads none of it)\n"),
 ('H2 DELOAD_OFF 207',
  "MANNY_DELOAD_OFF_DIGEST_BY_VERSION[206] = '1069cd7f86eed204';   // D109: the ruled digest move\n",
  "MANNY_DELOAD_OFF_DIGEST_BY_VERSION[206] = '1069cd7f86eed204';   // D109: the ruled digest move\n"
  "// V207: ruled UNMOVED, so a REFERENCE row (coach printed it on the V206 tag and a slice-A copy).\n"
  "MANNY_DELOAD_OFF_DIGEST_BY_VERSION[207] = MANNY_DELOAD_OFF_DIGEST_BY_VERSION[206];   // D106a: ruled UNMOVED\n"),
 ('H3 CORE_OFF 207',
  "MANNY_CORE_OFF_DIGEST_BY_VERSION[206] = '9d14801a63111081';   // D109: the ruled digest move (copy only, 53/98 days text-only)\n",
  "MANNY_CORE_OFF_DIGEST_BY_VERSION[206] = '9d14801a63111081';   // D109: the ruled digest move (copy only, 53/98 days text-only)\n"
  "// V207: ruled UNMOVED, so a REFERENCE row (coach printed it on the V206 tag and a slice-A copy).\n"
  "MANNY_CORE_OFF_DIGEST_BY_VERSION[207] = MANNY_CORE_OFF_DIGEST_BY_VERSION[206];   // D106a: ruled UNMOVED\n"),
]
PLAN['tests/gates/g199_deload_arbitration.js'] = [
 ('G199 207',
  "DELOAD_ARB_BY_VERSION[206] = DELOAD_ARB_BY_VERSION[205];   // V206 D109/D137: ruled UNMOVED\n",
  "DELOAD_ARB_BY_VERSION[206] = DELOAD_ARB_BY_VERSION[205];   // V206 D109/D137: ruled UNMOVED\n"
  "DELOAD_ARB_BY_VERSION[207] = DELOAD_ARB_BY_VERSION[206];   // D106a: ruled UNMOVED (test-week pin and NSW trial; no section arbitration)\n"),
]
PLAN['tests/gates/g202_int_doctrine.js'] = [
 ('INT header refuses',
  "// THE THREE-RUN ARM IS A LICENCE, AND IT REFUSES ABOVE ia-version 206 (renewed from 205 by D142).\n",
  "// THE THREE-RUN ARM IS A LICENCE, AND IT REFUSES ABOVE ia-version 207 (renewed from 206 by D142 at V207).\n"),
 ('INT header keyed',
  "// NOT THE DOCTRINE AS RULED. It is keyed on 206, a number that exists today, and the\n",
  "// NOT THE DOCTRINE AS RULED. It is keyed on 207, a number that exists today, and the\n"),
 ('INT row upTo',
  "  { upTo: 206, arm: 'four-run', reps: 'table6',\n",
  "  { upTo: 207, arm: 'four-run', reps: 'table6',\n"),
 ('INT row comment',
  "    // crossover's cross - 1, and that arm is LICENSED TO 206 and no further (D142 renewal).\n",
  "    // crossover's cross - 1, and that arm is LICENSED TO 207 and no further (D142 renewal at V207).\n"),
 ('INT row note',
  "        + 'three-run arm still runs the V115 crossover and is licensed to 206' }\n",
  "        + 'three-run arm still runs the V115 crossover and is licensed to 207 (D142 renewal at V207; D113a ruled, unbuilt)' }\n"),
 ('INT licence const',
  "const THREE_RUN_LICENCE_TO = 206; // V206 renewal (D142): D113 parked by Mario at V205, routed through the spacing chooser this session, not in V206. Renew by one per build until D113 ships.\n",
  "const THREE_RUN_LICENCE_TO = 207; // V207 renewal (D142): D113a ruled by Mario with the fallback, builds after V207. Renew by one per build until D113a ships.\n"),
]
PLAN['index.html'] = [
 ('META ia-version 206 -> 207 (last)',
  '<meta name="ia-version" content="206">',
  '<meta name="ia-version" content="207">'),
]

srcs = {p: open(ROOT + p, encoding='utf-8').read() for p in PLAN}
for p, edits in PLAN.items():
    for name, old, new in edits:
        n = srcs[p].count(old)
        if n != 1:
            print('ABORT: %s anchor %r count=%d (need 1). Nothing written.' % (p, name, n)); sys.exit(1)
outs = {}
for p, edits in PLAN.items():
    s = srcs[p]
    for name, old, new in edits:
        assert s.count(old) == 1, name
        s = s.replace(old, new, 1); print('applied', p, '|', name)
    outs[p] = s
assert outs['index.html'].count('name="ia-version" content="207"') == 1
assert outs['tests/gates/g202_int_doctrine.js'].count('upTo: 206') == 0
# index.html (the version bump) is written LAST.
for p in [k for k in PLAN if k != 'index.html'] + ['index.html']:
    open(ROOT + p, 'w', encoding='utf-8').write(outs[p])
print('OK: D1 written; ia-version 207')
