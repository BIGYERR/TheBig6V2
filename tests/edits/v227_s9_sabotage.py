#!/usr/bin/env python3
# V227 slice 9 of D190 P-SWAPSEAM: the sabotage specs. No version bump, index.html untouched.
#   1. creates tests/sabotage/v227_d190.json (S1-D190 .. S5-D190, one row per gate the ruling names as a trip;
#      RE-RULING 1 §C of tests/measure/v227_rulings/d190_swapseam_ruling.md)
#   2. re-anchors tests/sabotage/v221_d177.json S1-D177 RR3 onto the D190 line in applySwapPrefs (same §C).
# Every anchor is asserted count==1 before anything is written; the script aborts on the first miss.
import json, os, sys

ROOT = '/Users/CanasBangin/Desktop/TheBig6V2'
HTML = os.path.join(ROOT, 'index.html')
NEW_SPEC = os.path.join(ROOT, 'tests/sabotage/v227_d190.json')
OLD_SPEC = os.path.join(ROOT, 'tests/sabotage/v221_d177.json')

def die(msg):
    print('ABORT: ' + msg); sys.exit(1)

src = open(HTML, encoding='utf-8').read()
if '<meta name="ia-version" content="227">' not in src:
    die('index.html is not ia-version 227')

# ── the D190 lines the mutations bite on (literal bytes from the V227 tree) ──────────────────────────────────────
R3_OPEN = "  if(activeProg&&activeProg.cfg&&activeProg.cfg.injury){\n    try{\n      const _fs=applyInjuryFilter("
R3_BLOCK = ("  if(activeProg&&activeProg.cfg&&activeProg.cfg.injury){\n"
            "    try{\n"
            "      const _fs=applyInjuryFilter([{label:'x',items:[{name:to,detail:item.detail}]}],activeProg.cfg);\n"
            "      const _fi=_fs&&_fs[0]&&_fs[0].items&&_fs[0].items[0];\n"
            "      if(_fi&&_fi.name===to) item.detail=_fi.detail;\n"
            "    }catch(e){}\n"
            "  }\n")
RERX = "  const _reRx=(item.detail!==_base);\n"
LIVE_STRIP = "  const _base=_stripCapCue(_wasDetail);"
PREF_LINE = "      it.detail=_swapDetailFor(to,_stripCapCue(it.detail));"
PREF_LINE_V226 = "      it.detail=_swapDetailFor(to,it.detail);"
BOOT_REFILTER = "    if(hit && prog.cfg && prog.cfg.injury){\n      day.sections=applyInjuryFilter(day.sections,prog.cfg);\n    }"

for nm, a in [('R3_OPEN', R3_OPEN), ('R3_BLOCK', R3_BLOCK), ('RERX+R3_BLOCK', RERX + R3_BLOCK), ('LIVE_STRIP', LIVE_STRIP),
              ('PREF_LINE', PREF_LINE), ('BOOT_REFILTER', BOOT_REFILTER)]:
    n = src.count(a)
    if n != 1: die('index.html anchor %s count=%d, want 1' % (nm, n))
n = src.count(PREF_LINE_V226)
if n != 0: die('the V226 pref line is still in index.html (count=%d): the RR3 re-anchor premise is refuted' % n)

CONTROL = (" CONTROL (2026-10-01, V227 slice 9): tests/sabotage.py passes no argv[3], and this gate reads its V226 tree from"
           " argv[3] only, so on the CLEAN V227 tree it already FAILs its pair rows by setup ({setup}). A TRIPPED here is"
           " therefore not evidence by itself until the gate resolves its baseline without argv[3] (the V226 slice 7e"
           " fix in g225/g226); the named rows were read with argv[3] base_v226. Row d of g227_d190_seam is PARKED and"
           " is named by no mutation.")
SETUP = {
    'seam': "a-U'",
    'cuecap': 'c-TOAST, c-UNINJ, c-DIGEST',
    'prefpath': 'c2-ii, c2-iii',
}
G = {
    'seam': 'gates/g227_d190_seam.js',
    'cuecap': 'gates/g227_d190_cuecap.js',
    'prefpath': 'gates/g227_d190_prefpath.js',
}

M1 = dict(anchor=R3_OPEN, replacement="  if(false){\n    try{\n      const _fs=applyInjuryFilter(")
M2 = dict(anchor=LIVE_STRIP, replacement="  const _base=_wasDetail;")
M3 = dict(anchor=PREF_LINE, replacement=PREF_LINE_V226)
M4 = dict(anchor=RERX + R3_BLOCK, replacement=R3_BLOCK + RERX)
M5 = dict(anchor=BOOT_REFILTER,
          replacement="    if(false && hit && prog.cfg && prog.cfg.injury){\n      day.sections=applyInjuryFilter(day.sections,prog.cfg);\n    }")

rows = [
  (M1, 'seam', "S1-D190 R3 (a) -> the live filter call in applySwapChoice is dropped: the plan never re-decides the cue on the tapped card",
   "NAMED TRIP: row a-U (ruling: 128 on measure's population; gate builder, argv[3] base_v226: residue 566/11,998) and the"
   " pair row a-U' (created 12). Also row e (53/229). The (b) trip of the same mutation is the next row. EXPECTED: a-U, a-U', e;"
   " a-MEM and e-PRE stay green."),
  (M1, 'cuecap', "S1-D190 R3 (b) -> the live filter call in applySwapChoice is dropped: cue <=> cap breaks on the live hop",
   "NAMED TRIP: row b-ALL (gate builder, argv[3] base_v226: 2,038/9,882 hops) and b-HAND-1, b-HAND-2, b-HAND-3. EXPECTED:"
   " those four; c-MANNY stays green (no build-path change)."),
  (M2, 'seam', "S2-D190 R2 live (a) -> the strip in applySwapChoice is dropped: the tap carries the donor's cue into _swapDetailFor",
   "NAMED TRIP: row a-U on the ankle/wa W3 class (gate builder, argv[3] base_v226: residue 556/11,998, ankle/wa W3 thu"
   " included) and the pair row a-U' (created 18). Also row e (176/229). EXPECTED: a-U, a-U', e; a-MEM and e-PRE stay green."),
  (M2, 'cuecap', "S2-D190 R2 live (b) -> the strip in applySwapChoice is dropped: a cued donor's cue survives onto an uncapped target",
   "NAMED TRIP: row b-ALL (gate builder, argv[3] base_v226: 1,130/9,882 hops), b-HAND-2 and b-HAND-3 (ankle/wa W3 thu:"
   " the goblet squat's cue rides onto the split-stance deadlift and the Nordic curl). EXPECTED: those three; b-HAND-1 and"
   " c-MANNY stay green."),
  (M3, 'seam', "S3-D190 R2 boot (e) -> the strip in applySwapPrefs is dropped: the boot replay carries the donor's cue, live != boot on chains off a natively cued item",
   "NAMED TRIP: row e on the natively cued chains (gate builder, argv[3] base_v226: live != boot 176/229). Also a-U"
   " (548/11,998) and the pair row a-U' (created 18). EXPECTED: e, a-U, a-U'; a-MEM and e-PRE stay green."),
  (M3, 'prefpath', "S3-D190 R2 build (c2-i) -> the strip in applySwapPrefs is dropped: a cfg.exSwapPrefs build pins the source's cue to the target",
   "NAMED TRIP: row c2-i on the build path (ruling: 192 cards / 138 builds on U2's population; gate builder, argv[3]"
   " base_v226: 210 cards in 71 builds = U2 192 + P9b ankle 18), c2-ii (68/138) and c2-hand. EXPECTED: c2-i, c2-ii, c2-hand;"
   " c2-iii stays green (only target cards move)."),
  (M4, 'cuecap', "S4-D190 R4 -> the live filter moves above _reRx: a cue the filter appends reads as a moved dose and flips the toast",
   "NAMED TRIP: row c-TOAST (ruling: 133 on measure's population; gate builder, argv[3] base_v226: 2,038/9,882 hops),"
   " b-HAND-2 and b-HAND-3 (their toast leg). EXPECTED: c-TOAST, b-HAND-2, b-HAND-3; b-ALL, b-HAND-1 and c-MANNY stay green"
   " (the card is the same; only the toast moves). Bycatch to check, not this row's gate: g221_d177_swapfloor G6a."),
  (M5, 'seam', "S5-D190 R5 -> the boot re-filter in applySessionSwaps is disabled: the boot replays the cue-free carry and never writes the plan's cue",
   "NAMED TRIP: row a-U (gate builder, argv[3] base_v226: residue 566/11,998) and the pair row a-U' (created 12). Also"
   " row e (53/229). EXPECTED: a-U, a-U', e; a-MEM and e-PRE stay green."),
]

spec = []
for m, g, name, note in rows:
    a, r = m['anchor'], m['replacement']
    if src.count(a) != 1: die('mutation anchor not count 1: ' + name)
    if a == r or src.replace(a, r) == src: die('no-op mutation: ' + name)
    spec.append({'name': name, 'anchor': a, 'replacement': r, 'gate': G[g],
                 'note': note + CONTROL.format(setup=SETUP[g])})

# ── v221_d177.json S1-D177 RR3 re-anchor (text-level, every line asserted count==1 in the JSON text) ───────────────
old_txt = open(OLD_SPEC, encoding='utf-8').read()
old_parsed = json.loads(old_txt)
OLD_A = '"anchor": "      it.detail=_swapDetailFor(to,it.detail);",'
NEW_A = '"anchor": "      it.detail=_swapDetailFor(to,_stripCapCue(it.detail));",'
OLD_R = '"replacement": "      it.detail=(function(f){return (f&&f[1]!==0)?it.detail:_swapDetailFor(to,it.detail);})(_repFloor(to));",'
# Same shape: an IIFE on _repFloor(to); a floored candidate skips _swapDetailFor (D177's window), anything else runs
# the live line. The donor expression of the line was `it.detail`; on the D190 line it is `_stripCapCue(it.detail)`,
# so both branches take it. The skip branch therefore reverts D177's window only, never D190's strip.
NEW_R = '"replacement": "      it.detail=(function(f){return (f&&f[1]!==0)?_stripCapCue(it.detail):_swapDetailFor(to,_stripCapCue(it.detail));})(_repFloor(to));",'
OLD_N = 'G7-1a (W1 4×6, W2 4×5, W5/W6 4×3 goblet). The live tap keeps its own call, so G1 stays green."'
NEW_N = ('G7-1a (W1 4×6, W2 4×5, W5/W6 4×3 goblet). The live tap keeps its own call, so G1 stays green.'
         ' Re-anchored V227 (D190 RE-RULING 1 §C): the V226 line is gone, the spec bites on the D190 line; the donor'
         ' expression `it.detail` becomes `_stripCapCue(it.detail)` in both branches, so only D177\'s window is skipped."')
for nm, a in [('OLD_A', OLD_A), ('OLD_R', OLD_R), ('OLD_N', OLD_N)]:
    n = old_txt.count(a)
    if n != 1: die('v221_d177.json %s count=%d, want 1' % (nm, n))
new_txt = old_txt.replace(OLD_A, NEW_A).replace(OLD_R, NEW_R).replace(OLD_N, NEW_N)
new_parsed = json.loads(new_txt)
rr3 = [i for i, e in enumerate(old_parsed) if e['anchor'] == PREF_LINE_V226]
if len(rr3) != 1: die('RR3 row not unique in v221_d177.json')
i = rr3[0]
if len(new_parsed) != len(old_parsed): die('row count moved')
for k, (o, n_) in enumerate(zip(old_parsed, new_parsed)):
    if k != i and o != n_: die('a row other than RR3 moved: #%d' % k)
e = new_parsed[i]
if e['anchor'] != PREF_LINE or src.count(e['anchor']) != 1: die('re-anchored RR3 is not count 1 in index.html')
if e['gate'] != old_parsed[i]['gate'] or e['name'] != old_parsed[i]['name']: die('RR3 name or gate moved')
if src.replace(e['anchor'], e['replacement']) == src: die('re-anchored RR3 is a no-op')

# ── write ──────────────────────────────────────────────────────────────────────────────────────────────────────────
with open(NEW_SPEC, 'w', encoding='utf-8') as f:
    f.write(json.dumps(spec, ensure_ascii=False, indent=1) + '\n')
with open(OLD_SPEC, 'w', encoding='utf-8') as f:
    f.write(new_txt)
chk = json.load(open(NEW_SPEC, encoding='utf-8'))
assert [c['anchor'] for c in chk] == [s['anchor'] for s in spec]
print('OK wrote %s (%d rows) and re-anchored %s row #%d (%s)' % (NEW_SPEC, len(spec), OLD_SPEC, i, e['name']))
