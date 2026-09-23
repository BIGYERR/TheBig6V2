#!/usr/bin/env python3
# V208 closing slice (Mario split the version: V208 = slices 0-5c; D140 is V209, parked; Mario
# authorized the bump). Coach's exact text, four edits, one script, meta bump LAST:
#   1 tests/harness.js: the three HALF_MANNY era rows for 208, ruled UNMOVED, as REFERENCE rows
#     (coach printed shipped 0ac7da6b1691a8e1, deload-off 1069cd7f86eed204, core-off 9d14801a63111081
#     from the slice 0-5c tree with each gate's own method).
#   2 tests/gates/g199_deload_arbitration.js: DELOAD_ARB_BY_VERSION[208], ruled UNMOVED.
#   3 tests/gates/g202_int_doctrine.js: D142 renewal of the three-run licence to 208 (the constant,
#     the upTo:207 row, its note tail and the header lines V207's builder moved for 207). Slice 4b's
#     RUN_LABEL_BY_VERSION rows are left alone.
#   4 index.html: <meta name="ia-version"> 207 -> 208. LAST.
# Every anchor asserted count==1 in its file before anything is written; all-or-nothing.
import sys
R = '/Users/CanasBangin/Desktop/TheBig6V2/'
EDITS = {
 'tests/harness.js': [
  ("MANNY_DIGEST_BY_VERSION[207] = MANNY_DIGEST_BY_VERSION[206];   // D106a: ruled UNMOVED (NSW test-goal path only; NRC reads none of it)\n",
   "MANNY_DIGEST_BY_VERSION[207] = MANNY_DIGEST_BY_VERSION[206];   // D106a: ruled UNMOVED (NSW test-goal path only; NRC reads none of it)\n"
   "// V208: ruled UNMOVED, so a REFERENCE row. V208 stamps and renames NSW run sessions\n"
   "// (D103a), re-keys halfstep/protect (D103a slice 2), places run_base by shape (D104a)\n"
   "// and fixes the D106a shakeout; NRC reads none of it. Printed by coach from the slice\n"
   "// 0–5c working tree with this gate's own method: 0ac7da6b1691a8e1 on this run.\n"
   "MANNY_DIGEST_BY_VERSION[208] = MANNY_DIGEST_BY_VERSION[207];   // V208: ruled UNMOVED\n"),
  ("MANNY_DELOAD_OFF_DIGEST_BY_VERSION[207] = MANNY_DELOAD_OFF_DIGEST_BY_VERSION[206];   // D106a: ruled UNMOVED\n",
   "MANNY_DELOAD_OFF_DIGEST_BY_VERSION[207] = MANNY_DELOAD_OFF_DIGEST_BY_VERSION[206];   // D106a: ruled UNMOVED\n"
   "MANNY_DELOAD_OFF_DIGEST_BY_VERSION[208] = MANNY_DELOAD_OFF_DIGEST_BY_VERSION[207];   // V208: ruled UNMOVED (1069cd7f86eed204 printed by g199's method)\n"),
  ("MANNY_CORE_OFF_DIGEST_BY_VERSION[207] = MANNY_CORE_OFF_DIGEST_BY_VERSION[206];   // D106a: ruled UNMOVED\n",
   "MANNY_CORE_OFF_DIGEST_BY_VERSION[207] = MANNY_CORE_OFF_DIGEST_BY_VERSION[206];   // D106a: ruled UNMOVED\n"
   "MANNY_CORE_OFF_DIGEST_BY_VERSION[208] = MANNY_CORE_OFF_DIGEST_BY_VERSION[207];   // V208: ruled UNMOVED (9d14801a63111081 printed by g200's method)\n"),
 ],
 'tests/gates/g199_deload_arbitration.js': [
  ("DELOAD_ARB_BY_VERSION[207] = DELOAD_ARB_BY_VERSION[206];   // D106a: ruled UNMOVED (test-week pin and NSW trial; no section arbitration)\n",
   "DELOAD_ARB_BY_VERSION[207] = DELOAD_ARB_BY_VERSION[206];   // D106a: ruled UNMOVED (test-week pin and NSW trial; no section arbitration)\n"
   "DELOAD_ARB_BY_VERSION[208] = DELOAD_ARB_BY_VERSION[207];   // V208 D103a/D104a: ruled UNMOVED (NSW keys, labels and placement; no section arbitration)\n"),
 ],
 'tests/gates/g202_int_doctrine.js': [
  ("// THE THREE-RUN ARM IS A LICENCE, AND IT REFUSES ABOVE ia-version 207 (renewed from 206 by D142 at V207).\n",
   "// THE THREE-RUN ARM IS A LICENCE, AND IT REFUSES ABOVE ia-version 208 (renewed from 207 by D142 at V208).\n"),
  ("// NOT THE DOCTRINE AS RULED. It is keyed on 207, a number that exists today, and the\n",
   "// NOT THE DOCTRINE AS RULED. It is keyed on 208, a number that exists today, and the\n"),
  ("  { upTo: 207, arm: 'four-run', reps: 'table6',\n",
   "  { upTo: 208, arm: 'four-run', reps: 'table6',\n"),
  ("    // crossover's cross - 1, and that arm is LICENSED TO 207 and no further (D142 renewal at V207).\n",
   "    // crossover's cross - 1, and that arm is LICENSED TO 208 and no further (D142 renewal at V208).\n"),
  ("        + 'three-run arm still runs the V115 crossover and is licensed to 207 (D142 renewal at V207; D113a ruled, unbuilt)' }\n",
   "        + 'three-run arm still runs the V115 crossover and is licensed to 208 (D142 renewal at V208; D113a ruled, builds at V212)' }\n"),
  ("const THREE_RUN_LICENCE_TO = 207; // V207 renewal (D142): D113a ruled by Mario with the fallback, builds after V207. Renew by one per build until D113a ships.\n",
   "const THREE_RUN_LICENCE_TO = 208; // V208 renewal (D142): D113a ruled by Mario with the fallback, builds at V212. Renew by one per build until D113a ships.\n"),
 ],
 'index.html': [   # LAST: the meta bump
  ('<meta name="ia-version" content="207">', '<meta name="ia-version" content="208">'),
 ],
}
plans = {}
for f, eds in EDITS.items():
    s = open(R + f, encoding='utf-8').read()
    for a, b in eds:
        n = s.count(a)
        if n != 1:
            sys.exit('ABORT: %s anchor count=%d: %r — nothing written' % (f, n, a[:80]))
        s = s.replace(a, b, 1)
    plans[f] = s
for f in EDITS:   # dict order: index.html (the meta bump) is written last
    open(R + f, 'w', encoding='utf-8').write(plans[f])
print('V208 close written:', ', '.join(EDITS))
