#!/usr/bin/env python3
# V213 slice 2c — coach ruled, measure proved on a copy (tests/measure/v213_nrc_excl.js): the NRC arm
# of the multi-sport run routing honours the exclusion key `_d113Excl`, as the pace arm already does.
# Measure on the copy: excluded-mode NRC multi-sport programs moved vs V212 0/21,888 (the pre-2c tree
# had re-sited all 21,888 of 71,280); 0/644,520 quality run cards under the excluded modes; uninjured
# D146 still 5,727/17,820 moved; COPY vs pre-2c V213 0/17,820 uninjured and 0/41,580 non-excluded
# injured; HALF_MANNY 0ac7da6b1691a8e1.
#   1. index.html: `(NRC_GOALS.has(_msG) && _k >= 2)` -> `(NRC_GOALS.has(_msG) && !_d113Excl && _k >= 2)`,
#      and the comment above it states the new scope (one hunk).
#   2. tests/gates/g213_d113a.js: R3n (>= 213, 213-vs-212 pair row): NRC multi-sport programs under the
#      four excluded modes are byte-identical to V212. Sample: run_5k + bike_base and run_half +
#      swim_base, one injury state per excluded mode, every calendar of 0 to 4 rest days.
#   3. tests/sabotage/v213_d113a.json: S6 drops `!_d113Excl` from the NRC gate; named trip R3n.
# ia-version is not touched (it reads 213 already).
import io, json, sys

ROOT = '/Users/CanasBangin/Desktop/TheBig6V2/'
IDX, GATE, SPEC = ROOT + 'index.html', ROOT + 'tests/gates/g213_d113a.js', ROOT + 'tests/sabotage/v213_d113a.json'

def check(src, reps, tag):
    bad = False
    for t, a, b in reps:
        c = src.count(a); print('%-12s %-40s count=%d' % (tag, t, c)); bad |= (c != 1)
    return bad

ENGINE = [
("E1 NRC gate honours the key",
 "(NRC_GOALS.has(_msG) && _k >= 2)",
 "(NRC_GOALS.has(_msG) && !_d113Excl && _k >= 2)"),
("E2 comment states the scope",
 "    // other sport keeps its order across the days the runs did not take. Pace routes from\n"
 "    // three runs up and never under an exclusion-key injury; NRC routes from two runs up.\n",
 "    // other sport keeps its order across the days the runs did not take. Pace routes from\n"
 "    // three runs up, NRC from two runs up, and neither under an exclusion-key injury (V213\n"
 "    // slice 2c, coach: those modes rewrite every run, so there is nothing left to space).\n"),
]

GATEREPS = [
("G1 header D146",
 "//   D146   A multi-sport NRC week with two or more runs is placed by the spacing chooser, and\n"
 "//          spaceHardCardio leaves that planned run week alone.\n",
 "//   D146   A multi-sport NRC week with two or more runs is placed by the spacing chooser, and\n"
 "//          spaceHardCardio leaves that planned run week alone. Under the four excluded modes it is\n"
 "//          not routed (coach, V213 slice 2c): those builds stay as V212 shipped them.\n"),
("G2 header rows",
 "//        build byte-identical to V212. PAIR. R3v: all four modes reached, each with multi-sport builds.\n",
 "//        build byte-identical to V212. PAIR. R3v: all four modes reached, each with multi-sport builds.\n"
 "//   R3n  the same claim on NRC multi-sport (slice 2c): run_5k + bike and run_half + swim under one\n"
 "//        state per excluded mode, every calendar, byte-identical to V212. PAIR.\n"),
("G3 header pair list",
 "//   R0, R3, R4p, R6 and HM say",
 "//   R0, R3, R3n, R4p, R6 and HM say"),
("G4 skip list",
 "['HF','R0','R1','R1v','R2','R2v','R3','R3v','R4',",
 "['HF','R0','R1','R1v','R2','R2v','R3','R3v','R3n','R4',"),
("G5 R3n row",
 "    pairRow('R3 excluded injury modes, pace solo and multi-sport: every build byte-identical to V212 (' + n + ' builds)', n > 0 && mv === 0, mv + ', first ' + ex);\n"
 "  }\n"
 "}\n",
 "    pairRow('R3 excluded injury modes, pace solo and multi-sport: every build byte-identical to V212 (' + n + ' builds)', n > 0 && mv === 0, mv + ', first ' + ex);\n"
 "  }\n"
 "}\n"
 "\n"
 "// ── R3n: NRC multi-sport under the excluded modes is byte-identical to V212 (slice 2c) ──────────\n"
 "// Coach, V213: the NRC arm of the multi-sport routing honours the exclusion key as the pace arm does.\n"
 "// Those modes rewrite every run, so there is nothing for the chooser to space and the week keeps the\n"
 "// layout V212 dealt it. V212's own injuryPlan picks the population; the claim is the identity.\n"
 "{\n"
 "  const MODES = new Set(['noimpact','noimpact_swim','easy','reduce']);\n"
 "  const INJ = [{region:'knee',tier:'protect'},{region:'hip',tier:'protect'},{region:'knee',tier:'workaround'},{region:'ankle',tier:'workaround'}];\n"
 "  const SAMPLE = [['run_5k', {bike:'bike_base'}], ['run_half', {swim:'swim_base'}]];\n"
 "  if(!BASE) pairRow('R3n NRC multi-sport excluded modes need the V212 baseline', false, baseWhy);\n"
 "  else if(!PAIR) pairRow('R3n NRC multi-sport excluded modes byte-identical to V212', false, 'n/a');\n"
 "  else {\n"
 "    const plan = BASE.eval('injuryPlan');\n"
 "    let n = 0, mv = 0, ex = null, crash = 0; const reach = {};\n"
 "    SAMPLE.forEach(([g, e], j) => INJ.forEach(inj => CALS.forEach((rest, i) => {\n"
 "      const cfg = mkCfg(g, e, rest, FOCI[(i + j) % 3], {injury:inj});\n"
 "      const mode = (plan(cl(cfg)) || {}).cardioMode || 'none'; if(!MODES.has(mode)) return;\n"
 "      let a, b; try { a = build(IA, cfg); b = build(BASE, cfg); } catch(err) { crash++; return; }\n"
 "      n++; reach[mode] = (reach[mode] || 0) + 1;\n"
 "      if(progDigest(a) !== progDigest(b)){ mv++; if(!ex) ex = g + ' ' + JSON.stringify(e) + ' ' + mode + ' ' + inj.region + '/' + inj.tier + ' rest=' + rest; }\n"
 "    })));\n"
 "    pairRow('R3n NRC multi-sport under the excluded modes (run_5k + bike, run_half + swim): every build byte-identical to V212 (' + n + ' builds, ' + JSON.stringify(reach) + ')',\n"
 "      crash === 0 && [...MODES].every(m => reach[m] > 0) && mv === 0, mv + ' moved, first ' + ex + ', crash ' + crash);\n"
 "  }\n"
 "}\n"),
]

S6 = {
  "name": "S6-D146 (slice 2c) -> the NRC arm of the multi-sport routing ignores the exclusion key: an NRC multi-sport week under noimpact / noimpact_swim / easy / reduce is re-placed by the chooser",
  "anchor": "(NRC_GOALS.has(_msG) && !_d113Excl && _k >= 2)",
  "replacement": "(NRC_GOALS.has(_msG) && _k >= 2)",
  "gate": "gates/g213_d113a.js",
  "note": "NAMED TRIP: R3n (NRC multi-sport excluded modes no longer byte-identical to V212). R3n is a build-pair row, so it runs only on a candidate reading ia-version 213."
}

x = io.open(IDX, encoding='utf-8').read()
g = io.open(GATE, encoding='utf-8').read()
spec = json.load(io.open(SPEC, encoding='utf-8'))
bad = check(x, ENGINE, 'index.html') | check(g, GATEREPS, 'g213')
if any(m['name'].startswith('S6') for m in spec): print('S6 already in spec'); bad = True
if bad:
    sys.exit('ABORT: an anchor did not appear exactly once. Nothing written.')
for t, a, b in ENGINE: x = x.replace(a, b, 1)
for t, a, b in GATEREPS: g = g.replace(a, b, 1)
spec.append(S6)
io.open(GATE, 'w', encoding='utf-8').write(g)
io.open(SPEC, 'w', encoding='utf-8').write(json.dumps(spec, indent=2, ensure_ascii=False) + '\n')
io.open(IDX, 'w', encoding='utf-8').write(x)
print('WROTE', GATE); print('WROTE', SPEC); print('WROTE', IDX)
