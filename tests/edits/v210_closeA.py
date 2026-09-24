# v210_closeA.py — V210 close, part A (tests only; the meta bump is part B, v210_closeB.py).
# Coach's text VERBATIM. D149 is HELD out of V210; its parked slice stays in the scratchpad.
#   1. tests/harness.js            MANNY era rows [210] (ruled UNMOVED, REFERENCE rows)
#   2. g199_deload_arbitration.js  DELOAD_ARB_BY_VERSION[210], E6_BY_VERSION[210] (ruled UNMOVED)
#   3. g197b_sweep.js              B4i-B4l become an era table: the V209 pin (200 Preacher curl,
#                                  13 finisher cables) at <=209, the ruled D70c MOVE to 0 at 210
#   4. g202_int_doctrine.js        D142 licence renewal 209 -> 210 (D113a builds at V213)
# Every anchor is asserted count==1 before anything is written; the first miss aborts all four.
#   python3 tests/edits/v210_closeA.py
import sys, os
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
def P(rel): return os.path.join(ROOT, rel)
plan = {}   # path -> list of (kind, a, b)   kind 'rep' = replace a with b; 'span' = replace [a, b0) with b1

plan['tests/harness.js'] = [('rep',
 "MANNY_CORE_OFF_DIGEST_BY_VERSION[209] = MANNY_CORE_OFF_DIGEST_BY_VERSION[208];   // D140: ruled UNMOVED\n",
 "MANNY_CORE_OFF_DIGEST_BY_VERSION[209] = MANNY_CORE_OFF_DIGEST_BY_VERSION[208];   // D140: ruled UNMOVED\n"
 "// V210: ruled UNMOVED, written as a REFERENCE. D70c/D150 touch only pools HALF_MANNY never\n"
 "// draws from (0 machine, cable or GHD names on 388/388 items) and the swap universe, which\n"
 "// progDigest strips; 2b adds Front squat to the older advanced pool and withholds it under\n"
 "// shoulder/elbow plans, neither of which is this fixture. Printed by coach from the source-\n"
 "// surgery copy BEFORE the build: 0ac7da6b1691a8e1, universe 86 -> 86, nothing removed.\n"
 "MANNY_DIGEST_BY_VERSION[210] = MANNY_DIGEST_BY_VERSION[209];   // D70c/D150/2b: ruled UNMOVED\n"
 "MANNY_DELOAD_OFF_DIGEST_BY_VERSION[210] = MANNY_DELOAD_OFF_DIGEST_BY_VERSION[209];   // ruled UNMOVED\n"
 "MANNY_CORE_OFF_DIGEST_BY_VERSION[210] = MANNY_CORE_OFF_DIGEST_BY_VERSION[209];   // ruled UNMOVED\n")]

plan['tests/gates/g199_deload_arbitration.js'] = [
 ('rep',
  "DELOAD_ARB_BY_VERSION[209] = DELOAD_ARB_BY_VERSION[208];   // D140: ruled UNMOVED (C1 364, C3 364, C5 32, D2 19, I3 496 printed identical; 0 zero-posterior flips in 17,856 weeks)\n",
  "DELOAD_ARB_BY_VERSION[209] = DELOAD_ARB_BY_VERSION[208];   // D140: ruled UNMOVED (C1 364, C3 364, C5 32, D2 19, I3 496 printed identical; 0 zero-posterior flips in 17,856 weeks)\n"
  "DELOAD_ARB_BY_VERSION[210] = DELOAD_ARB_BY_VERSION[209];   // D70c/D150: ruled UNMOVED (C1 364, C3 364, C5 32, D2 19, I3 496 identical; 0 zero-posterior flips in 17,856 + 17,280 weeks)\n"),
 ('rep',
  "const E6_BY_VERSION = { 208: 36 }; E6_BY_VERSION[209] = 28;   // D140: ruled MOVE\n",
  "const E6_BY_VERSION = { 208: 36 }; E6_BY_VERSION[209] = 28;   // D140: ruled MOVE\n"
  "E6_BY_VERSION[210] = E6_BY_VERSION[209];   // D70c/D150: ruled UNMOVED (28; posterior items identical 51,722 / 47,494)\n"),
]

plan['tests/gates/g197b_sweep.js'] = [('span',
 "// home_full: the 200 survivors are OUT OF SCOPE for V197 and PINNED so they cannot grow.\n",
 "ok('B4m no leg machine reaches a cable-less tier',",
 "// B4i-B4l era table. The 200 Preacher curls and 13 finisher cables were V197's out-of-scope\n"
 "// leak, PINNED so they could not grow. D70c closes them (finisher through _gear; universe\n"
 "// through D150). A LITERAL row asserts a ruled MOVE; <=209 keeps the pin. Row existence is a conjunct.\n"
 "const HF_LEAK_BY_VERSION = { 209: { machine:200, cable:13, names:{ 'Preacher curl':200, 'Cable lateral raise':6, 'Face pull':7 } } };\n"
 "HF_LEAK_BY_VERSION[210] = { machine:0, cable:0, names:{} };   // D70c: the ruled MOVE\n"
 "const HF_LEAK = HF_LEAK_BY_VERSION[(+IA.version <= 209) ? 209 : +IA.version];\n"
 "// Survivors of one kind, read off the census and off the row through the same needs() table,\n"
 "// compared name for name and count for count: no extras, no missing.\n"
 "const hfOfKind = (names, kind) => { const o = {}; Object.keys(names || {}).filter(n => needs(n).indexOf(kind) >= 0).forEach(n => { o[n] = names[n]; }); return o; };\n"
 "const hfSame = (a, b) => { const ka = Object.keys(a).sort(), kb = Object.keys(b).sort(); return ka.length === kb.length && ka.every((k, i) => k === kb[i] && a[k] === b[k]); };\n"
 "const hfRowTxt = HF_LEAK ? '' : ' (NO ERA ROW for ia-version ' + IA.version + ')';\n"
 "ok('B4i home_full machine items == the era row (V209 pin 200, the raw-EXLIB Preacher curl; V210 D70c 0)' + hfRowTxt,\n"
 "   !!HF_LEAK && census.home_full.machine === HF_LEAK.machine, census.home_full.machine);\n"
 "ok('B4j home_full machine survivors are exactly the era row\\'s names and counts' + hfRowTxt,\n"
 "   !!HF_LEAK && hfSame(hfOfKind(census.home_full.names, 'machine'), hfOfKind(HF_LEAK.names, 'machine')),\n"
 "   JSON.stringify(hfOfKind(census.home_full.names, 'machine')) + ' vs row ' + JSON.stringify(HF_LEAK ? hfOfKind(HF_LEAK.names, 'machine') : null));\n"
 "ok('B4k home_full cable items == the era row (V209 pin 13; V210 D70c 0)' + hfRowTxt,\n"
 "   !!HF_LEAK && census.home_full.cable === HF_LEAK.cable, census.home_full.cable);\n"
 "ok('B4l home_full cable survivors are exactly the era row\\'s names and counts' + hfRowTxt,\n"
 "   !!HF_LEAK && hfSame(hfOfKind(census.home_full.names, 'cable'), hfOfKind(HF_LEAK.names, 'cable')),\n"
 "   JSON.stringify(hfOfKind(census.home_full.names, 'cable')) + ' vs row ' + JSON.stringify(HF_LEAK ? hfOfKind(HF_LEAK.names, 'cable') : null));\n")]

plan['tests/gates/g202_int_doctrine.js'] = [
 ('rep', "// THE THREE-RUN ARM IS A LICENCE, AND IT REFUSES ABOVE ia-version 209 (renewed from 208 by D142 at V209).",
         "// THE THREE-RUN ARM IS A LICENCE, AND IT REFUSES ABOVE ia-version 210 (renewed from 209 by D142 at V210)."),
 ('rep', "NOT THE DOCTRINE AS RULED. It is keyed on 209, a number that exists today, and the",
         "NOT THE DOCTRINE AS RULED. It is keyed on 210, a number that exists today, and the"),
 ('rep', "  { upTo: 209, arm: 'four-run', reps: 'table6',",
         "  { upTo: 210, arm: 'four-run', reps: 'table6',"),
 ('rep', "crossover's cross - 1, and that arm is LICENSED TO 209 and no further (D142 renewal at V209).",
         "crossover's cross - 1, and that arm is LICENSED TO 210 and no further (D142 renewal at V210)."),
 ('rep', "three-run arm still runs the V115 crossover and is licensed to 209 (D142 renewal at V209; D113a ruled, builds at V212)' }",
         "three-run arm still runs the V115 crossover and is licensed to 210 (D142 renewal at V210; D113a ruled, builds at V213)' }"),
 ('rep', "const THREE_RUN_LICENCE_TO = 209; // V209 renewal (D142): D113a ruled by Mario with the fallback, builds at V212. Renew by one per build until D113a ships.",
         "const THREE_RUN_LICENCE_TO = 210; // V210 renewal (D142): D113a ruled by Mario with the fallback, builds at V213 (queue re-ordered at V210). Renew by one per build until D113a ships."),
]

out = {}
for rel, edits in plan.items():
    s = open(P(rel), encoding='utf-8').read()
    for i, e in enumerate(edits, 1):
        if e[0] == 'rep':
            c = s.count(e[1]); print(f"{rel} edit {i} anchor count={c}")
            if c != 1: sys.exit(f"ABORT: {rel} anchor {i} count {c}, nothing written")
            s = s.replace(e[1], e[2], 1)
        else:
            c0, c1 = s.count(e[1]), s.count(e[2]); print(f"{rel} span {i} anchors count={c0},{c1}")
            if c0 != 1 or c1 != 1 or s.index(e[1]) > s.index(e[2]): sys.exit(f"ABORT: {rel} span {i} anchors {c0},{c1}, nothing written")
            a = s.index(e[1]); b = s.index(e[2]); s = s[:a] + e[3] + s[b:]
    out[rel] = s
for rel, s in out.items():
    open(P(rel), 'w', encoding='utf-8').write(s)
print("written", len(out), "files")
