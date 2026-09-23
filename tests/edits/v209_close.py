#!/usr/bin/env python3
# V209 closing slice (Mario authorized the bump). D140 era rows, coach's exact text, then the
# ia-version meta 208 -> 209 LAST.
#   harness.js          MANNY_* [209] reference rows (coach printed all three arms on the final
#                       tree: 0ac7da6b1691a8e1 / 1069cd7f86eed204 / 9d14801a63111081, UNMOVED).
#   g199                DELOAD_ARB_BY_VERSION[209] reference row; E6's bare literal 36 -> an era
#                       table (208: 36, 209: 28, ruled MOVE). g199 has no top-level version
#                       predicate, so E6 has always run on every artifact it was pointed at: the
#                       208 row is read for every ia-version at or below 208 and older runs keep
#                       reading 36. Row existence is a conjunct of E6 (no row -> named FAIL).
#   g202_int_doctrine   THREE_RUN_LICENCE_TO 208 -> 209 (D142 renewal at V209), the four-run row
#                       upTo 209, its note tail, and the header lines that name the licence.
#   index.html          <meta name="ia-version" content="208"> -> 209, the last replacement.
# Every anchor asserted count==1 in memory before any file is written; the first miss aborts
# the whole script and nothing is written. Literal bytes (—, ×), no escapes.
import sys, pathlib

ROOT = pathlib.Path('/Users/CanasBangin/Desktop/TheBig6V2')

HARNESS = [(
"MANNY_CORE_OFF_DIGEST_BY_VERSION[208] = MANNY_CORE_OFF_DIGEST_BY_VERSION[207];   // V208: ruled UNMOVED (9d14801a63111081 printed by g200's method)\n",
"MANNY_CORE_OFF_DIGEST_BY_VERSION[208] = MANNY_CORE_OFF_DIGEST_BY_VERSION[207];   // V208: ruled UNMOVED (9d14801a63111081 printed by g200's method)\n"
"// V209: ruled UNMOVED, so a REFERENCE row. D140 tiers NSW long-run days and F1/F2 and\n"
"// the item carry ban run in the shared pass, but HALF_MANNY's three NRC tier B days were\n"
"// already at or under eight sets by doctrine count and carry no explosive, power-core or\n"
"// carry item. Printed by coach on the final tree: 0ac7da6b1691a8e1 / 1069cd7f86eed204 /\n"
"// 9d14801a63111081 on this run.\n"
"MANNY_DIGEST_BY_VERSION[209] = MANNY_DIGEST_BY_VERSION[208];   // D140: ruled UNMOVED\n"
"MANNY_DELOAD_OFF_DIGEST_BY_VERSION[209] = MANNY_DELOAD_OFF_DIGEST_BY_VERSION[208];   // D140: ruled UNMOVED\n"
"MANNY_CORE_OFF_DIGEST_BY_VERSION[209] = MANNY_CORE_OFF_DIGEST_BY_VERSION[208];   // D140: ruled UNMOVED\n"
)]

G199 = [
("//     builder's after-check. Days >0 -> 0 == 36. Reported by E6, never mixed into E3.\n",
 "//     builder's after-check. Days >0 -> 0 == the E6_BY_VERSION row (36 through V208, 28 from\n"
 "//     V209 under D140). Reported by E6, never mixed into E3.\n"),
("DELOAD_ARB_BY_VERSION[208] = DELOAD_ARB_BY_VERSION[207];   // V208 D103a/D104a: ruled UNMOVED (NSW keys, labels and placement; no section arbitration)\n",
 "DELOAD_ARB_BY_VERSION[208] = DELOAD_ARB_BY_VERSION[207];   // V208 D103a/D104a: ruled UNMOVED (NSW keys, labels and placement; no section arbitration)\n"
 "DELOAD_ARB_BY_VERSION[209] = DELOAD_ARB_BY_VERSION[208];   // D140: ruled UNMOVED (C1 364, C3 364, C5 32, D2 19, I3 496 printed identical; 0 zero-posterior flips in 17,856 weeks)\n"
 "\n"
 "// E6 counts deload day builds where the shipped card has zero posterior and the\n"
 "// __DELOAD_OFF control has some. D140 (V209) moves it 36 -> 28: eight NSW pace tier B\n"
 "// long-run days in deload weeks 4 and 8 whose control-arm posterior item is now stripped\n"
 "// by the tier. The shipped card was already zero on both builds; nothing an athlete\n"
 "// sees changed. A bare literal here was a V208 pin dressed as a claim.\n"
 "const E6_BY_VERSION = { 208: 36 }; E6_BY_VERSION[209] = 28;   // D140: ruled MOVE\n"
 "// Row lookup. This gate has no top-level version predicate: the bare 36 ran on EVERY artifact it\n"
 "// was ever pointed at. So the 208 row is read for every ia-version at or below 208 (older runs keep\n"
 "// reading 36 and do not newly fail), and from 209 each version needs its own row. No row -> E6 FAILS.\n"
 "const E6_ROW_FOR = v => E6_BY_VERSION[(+v <= 208) ? 208 : +v];\n"),
("  ok(R.endToEnd===36,'E6 END-TO-END (p1 -> shipped card, folding in capRegionalFatigue and capSessionBudget): '+R.endToEnd+' deload day builds ship zero posterior where __DELOAD_OFF ships some. Reported beside E3\\'s stage-local 60, never mixed into it');\n",
 "  const E6_ROW=E6_ROW_FOR(IP.version);\n"
 "  ok(E6_ROW!==undefined&&R.endToEnd===E6_ROW,'E6 END-TO-END (p1 -> shipped card, folding in capRegionalFatigue and capSessionBudget): '+R.endToEnd+' deload day builds ship zero posterior where __DELOAD_OFF ships some == '+(E6_ROW===undefined?'NO ROW':E6_ROW)+' (the V'+IP.version+' E6_BY_VERSION row'+(E6_ROW===undefined?': no E6_BY_VERSION row covers this ia-version':'')+'). Reported beside E3\\'s stage-local 60, never mixed into it');\n"),
]

G202 = [
("// THE THREE-RUN ARM IS A LICENCE, AND IT REFUSES ABOVE ia-version 208 (renewed from 207 by D142 at V208).\n",
 "// THE THREE-RUN ARM IS A LICENCE, AND IT REFUSES ABOVE ia-version 209 (renewed from 208 by D142 at V209).\n"),
("// NOT THE DOCTRINE AS RULED. It is keyed on 208, a number that exists today, and the\n",
 "// NOT THE DOCTRINE AS RULED. It is keyed on 209, a number that exists today, and the\n"),
("  { upTo: 208, arm: 'four-run', reps: 'table6',\n",
 "  { upTo: 209, arm: 'four-run', reps: 'table6',\n"),
("    // crossover's cross - 1, and that arm is LICENSED TO 208 and no further (D142 renewal at V208).\n",
 "    // crossover's cross - 1, and that arm is LICENSED TO 209 and no further (D142 renewal at V209).\n"),
("three-run arm still runs the V115 crossover and is licensed to 208 (D142 renewal at V208; D113a ruled, builds at V212)' }\n",
 "three-run arm still runs the V115 crossover and is licensed to 209 (D142 renewal at V209; D113a ruled, builds at V212)' }\n"),
("const THREE_RUN_LICENCE_TO = 208; // V208 renewal (D142): D113a ruled by Mario with the fallback, builds at V212. Renew by one per build until D113a ships.\n",
 "const THREE_RUN_LICENCE_TO = 209; // V209 renewal (D142): D113a ruled by Mario with the fallback, builds at V212. Renew by one per build until D113a ships.\n"),
]

INDEX = [('<meta name="ia-version" content="208">', '<meta name="ia-version" content="209">')]   # LAST

PLAN = [('tests/harness.js', HARNESS), ('tests/gates/g199_deload_arbitration.js', G199),
        ('tests/gates/g202_int_doctrine.js', G202), ('index.html', INDEX)]
out = []
for rel, edits in PLAN:
    p = ROOT / rel
    src = p.read_text(encoding='utf-8')
    for i, (old, new) in enumerate(edits, 1):
        n = src.count(old)
        if n != 1:
            print('ABORT %s edit %d: anchor count %d (want 1): %r' % (rel, i, n, old[:90])); sys.exit(1)
        src = src.replace(old, new, 1)
    out.append((p, src))
for p, src in out:            # index.html (the meta bump) is written last
    p.write_text(src, encoding='utf-8')
    print('wrote', p.relative_to(ROOT))
