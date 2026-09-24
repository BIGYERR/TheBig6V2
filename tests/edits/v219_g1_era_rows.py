#!/usr/bin/env python3
# V219 gate slice G1: era rows in existing gates, keyed by ia-version (D133). Rows for 218 and below untouched.
# Values are exactly what measure's counterfactual step 7 gate runs print (/tmp/v219_gates/<gate>_s7.out),
# attributed step by step from _s2 .. _s7: E1a/G1 move at step 2 (D159), C1/C3/C5/I3 and B5c 187 -> 185 at
# step 5 (D170), B5c 185 -> 0 at step 6 (D165), g200's 150 -> 138 and g193's swing 28 -> 0 at step 7 (D166).
# Every anchor asserted count==1 on its file before anything is written; the first miss aborts all four.
import sys
G = '/Users/CanasBangin/Desktop/TheBig6V2/tests/gates/'

# ── 1. g199: V219 rows ─────────────────────────────────────────────────────────
G199 = [
  ("DELOAD_HINGE_BY_VERSION[218] = DELOAD_HINGE_BY_VERSION[217];   // D157: ruled UNMOVED (E1a 12384 E1b 9319 E3 44 G1 1290 G5 44 printed)\n",
   "DELOAD_HINGE_BY_VERSION[218] = DELOAD_HINGE_BY_VERSION[217];   // D157: ruled UNMOVED (E1a 12384 E1b 9319 E3 44 G1 1290 G5 44 printed)\n"
   "DELOAD_ARB_BY_VERSION[219] = { capLSBkilled: 18, zeroWeeks: 264, zeroWeeksNonDeload: 264, zeroWeeksDeloadOff: 0, dlIdentical: 19 };   // D170 (cf170b): ruled MOVE. capRegionalFatigue no longer trims a legs day's last hinge or hip extension, so C1 364 -> 264, C3 364 -> 264, C5 32 -> 0 and I3 496 -> 18 (Leg superset B killed). D2 19 printed unmoved\n"
   "E6_BY_VERSION[219] = E6_BY_VERSION[218];   // V219: ruled UNMOVED (28 printed at step 7)\n"
   "DELOAD_HINGE_BY_VERSION[219] = { E1b: 9319, E3: 44, G5: {'Explosive finisher': 44}, E1a: 12369, G1: 1275 };   // D159 (cfA): ruled MOVE. E1a 12,384 -> 12,369 and G1 1,290 -> 1,275: all 15 of 15 are the duplicate Leg isolation Single-leg glute bridge beside the same Main, which now leaves before the deload; the shipped deload card is byte-identical (/tmp/v219_fu_g199.txt). E1b 9319, E3 44, G5 44 printed unmoved\n"),
]

# ── 2. g197b: B5c keyed by version ────────────────────────────────────────────
G197B = [
  ("const HF_LEAK = HF_LEAK_BY_VERSION[(+IA.version <= 209) ? 209 : +IA.version];\n",
   "const HF_LEAK = HF_LEAK_BY_VERSION[(+IA.version <= 209) ? 209 : +IA.version];\n"
   "// B5c's same-card duplicate count, keyed by ia-version (D133). 187 through V218 (the bare literal B5c read until V219).\n"
   "const B5C_BY_VERSION = { 218: 187 };\n"
   "B5C_BY_VERSION[219] = 0;   // D170 then D165: ruled MOVE. D170 (cf170b) 187 -> 185 printed; D165 (cf165b) redraws the lunge slot when it collides with a step-up Main, 185 -> 0\n"
   "const B5C_ROW = B5C_BY_VERSION[(+IA.version <= 218) ? 218 : +IA.version];   // no row -> B5c FAILS\n"),
  ("ok('B5c same-card duplicates == 187 (240 at V196/V197;",
   "ok('B5c same-card duplicates == ' + B5C_ROW + ' (the V' + IA.version + ' row; 187 through V218, 240 at V196/V197;"),
  ("', dup === 187, dup);",
   "', B5C_ROW !== undefined && dup === B5C_ROW, dup);"),
]

# ── 3. g200: the positive-limb population keyed by version ────────────────────
G200 = [
  ("const IP=load(ART), II=load(ins.file);\n",
   "const IP=load(ART), II=load(ins.file);\n"
   "// ERA ROW (D133): the positive-limb population P2c, P2d, P4, P6 and P7 are pinned to. 150 through V218.\n"
   "// V219 D166 (cf166c): when ex.cond[2] is the pull day's Main, Pull superset B prints the row alone, so the swing\n"
   "// no longer enters p1 beside a swing Main (census enterPost=none 60 -> 72). No row -> all five FAIL.\n"
   "const SWAP_BY_VERSION = { 218: 150 };\n"
   "SWAP_BY_VERSION[219] = 138;   // D166: ruled MOVE (150 -> 138)\n"
   "const SWAP_N = SWAP_BY_VERSION[(+IP.version <= 218) ? 218 : +IP.version];\n"),
  ("  ok(R.swapCards===150,",
   "  ok(SWAP_N!==undefined&&R.swapCards===SWAP_N,"),
  ("at p1 == 150 of '+R.dlDayBuilds",
   "at p1 == '+SWAP_N+' (the V'+IP.version+' row) of '+R.dlDayBuilds"),
  ("  ok(R.mainPostSwap===150&&R.swapCards===150,",
   "  ok(SWAP_N!==undefined&&R.mainPostSwap===SWAP_N&&R.swapCards===SWAP_N,"),
  ("at p1. WANT 150 OF 150. '",
   "at p1. WANT '+SWAP_N+' OF '+SWAP_N+' (the V'+IP.version+' row). '"),
  ("R.swapItems['Kettlebell swing']===150;",
   "SWAP_N!==undefined&&R.swapItems['Kettlebell swing']===SWAP_N;"),
  ("== {\"Kettlebell swing\":150} —",
   "== {\"Kettlebell swing\":'+SWAP_N+'} (the V'+IP.version+' row) —"),
  ("  ok(R.p4Survive===150&&R.swapCards===150,",
   "  ok(SWAP_N!==undefined&&R.p4Survive===SWAP_N&&R.swapCards===SWAP_N,"),
  ("intact (want 150 of 150, zero losses)",
   "intact (want '+SWAP_N+' of '+SWAP_N+', zero losses)"),
  ("  ok(R.p7VPull===150&&R.swapCards===150,",
   "  ok(SWAP_N!==undefined&&R.p7VPull===SWAP_N&&R.swapCards===SWAP_N,"),
  ("hand table (want 150 of 150).",
   "hand table (want '+SWAP_N+' of '+SWAP_N+')."),
]

# ── 4. g193: the swing class is a ruled 0 at V219 ─────────────────────────────
G193 = [
  ("const OPEN_UNRULED = {\n  'Kettlebell swing': 28,\n};\n",
   "// Keyed by ia-version (D133). V219 D166 (cf166c): when ex.cond[2] is the Main, Pull superset B prints the row\n"
   "// alone, so the swing class is a RULED 0 and any recurrence fails G3a by name. No other class SHRANK at step 7.\n"
   "const OPEN_UNRULED_BY_VERSION = { 218: { 'Kettlebell swing': 28 } };\n"
   "OPEN_UNRULED_BY_VERSION[219] = { 'Kettlebell swing': 0 };   // D166: ruled MOVE (28 -> 0)\n"
   "const OPEN_UNRULED = OPEN_UNRULED_BY_VERSION[(+IA.version <= 218) ? 218 : +IA.version];\n"
   "if (!OPEN_UNRULED) throw new Error('g193: no OPEN_UNRULED_BY_VERSION row for V' + IA.version + ': an unruled register (D133)');\n"),
]

JOBS = [('g199_deload_arbitration.js', G199), ('g197b_sweep.js', G197B), ('g200_pull_arbitration.js', G200), ('g193_samecard.js', G193)]
out = {}
for f, edits in JOBS:
    s = open(G + f, encoding='utf-8').read()
    for i, (a, b) in enumerate(edits):
        n = s.count(a)
        print('%s anchor %d count %d :: %r' % (f, i, n, a[:60]))
        if n != 1:
            print('ABORT: %s anchor %d count %d' % (f, i, n)); sys.exit(2)
        s = s.replace(a, b, 1)
    out[f] = s
for f in out:
    open(G + f, 'w', encoding='utf-8').write(out[f])
print('written ' + ', '.join(out))
