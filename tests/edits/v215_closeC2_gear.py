# v215_closeC2_gear.py — V215 close, part C2 (3 edits, tests only), tests/gates/g193_pool_overlay.js.
# D149 added a gear predicate, hasGHD = commercial || crossfit (index.html, beside hasCables). The gate's
# header says its gear table is transcribed by hand and "if someone changes a tier definition this table
# must be edited by hand, deliberately". Without it the resolver treats hasGHD as a foreign identifier,
# leaves hip/protect hipExtPool UNRESOLVED, and its thin-pool debt reads stale although the pool is still
# one member on every tier. Transcribed, not computed: GHD on commercial and crossfit (Mario, D149).
#   1  header: the transcribed predicates include hasGHD
#   2  GEAR: hasGHD per tier
#   3  resolve(): hasGHD is a known predicate and is passed into the evaluated expression
# The replacements for 2 and 3 are built from their anchors, so every other byte is carried as is.
#   python3 tests/edits/v215_closeC2_gear.py
import io, sys
P = '/Users/CanasBangin/Desktop/TheBig6V2/tests/gates/g193_pool_overlay.js'
s = io.open(P, encoding='utf-8').read()
H_A = "//   * the gear predicates are a hand table transcribed from the four one-line definitions\n//     (_tierHasBarbell, hasCables, hasDumbbells, isCrossfit). If someone changes a tier\n"
H_B = "//   * the gear predicates are a hand table transcribed from the five one-line definitions\n//     (_tierHasBarbell, hasCables, hasDumbbells, isCrossfit, and hasGHD from V215 D149). If someone changes a tier\n"
TIERS = [('bodyweight', 'false'), ('minimal', 'false'), ('home_basic', 'false'), ('home_full', 'false'), ('commercial', 'true'), ('crossfit', 'true')]
G_A = s[s.index("const GEAR = {\n"):s.index("};\n", s.index("const GEAR = {\n")) + 3] if s.count("const GEAR = {\n") == 1 else None
if G_A is None: sys.exit("ABORT: GEAR anchor count != 1, nothing written")
G_B = G_A
for t, v in TIERS:
    pre = "  " + t + ":"
    if G_B.count(pre) != 1 or G_B.count("isBW:") != 6: sys.exit(f"ABORT: GEAR row {t} not unique, nothing written")
    i = G_B.index(pre); j = G_B.index("isBW:", i)
    G_B = G_B[:j] + "hasGHD:" + v + (' ' if v == 'true' else '') + ", " + G_B[j:]
R_A0 = "    !['hasBarbell','hasCables','hasDumbbells','isCrossfit','isBW','_gear','_bw',"
R_A1 = "    const v = f(g.hasBarbell, g.hasCables, g.hasDumbbells, g.isCrossfit, g.isBW, _gear, _bw);\n"
for a in (R_A0, R_A1):
    if s.count(a) != 1: sys.exit(f"ABORT: resolver anchor count {s.count(a)}, nothing written")
R_A = s[s.index(R_A0):s.index(R_A1) + len(R_A1)]
R_B = (R_A
  .replace("!['hasBarbell','hasCables','hasDumbbells','isCrossfit','isBW',", "!['hasBarbell','hasCables','hasDumbbells','isCrossfit','hasGHD','isBW',", 1)
  .replace("new Function('hasBarbell','hasCables','hasDumbbells','isCrossfit','isBW',", "new Function('hasBarbell','hasCables','hasDumbbells','isCrossfit','hasGHD','isBW',", 1)
  .replace("f(g.hasBarbell, g.hasCables, g.hasDumbbells, g.isCrossfit, g.isBW,", "f(g.hasBarbell, g.hasCables, g.hasDumbbells, g.isCrossfit, g.hasGHD, g.isBW,", 1))
if R_B.count('hasGHD') != 3: sys.exit(f"ABORT: resolver rewrite placed hasGHD {R_B.count('hasGHD')} times, want 3; nothing written")
EDITS = [(H_A, H_B), (G_A, G_B), (R_A, R_B)]
for i, (a, b) in enumerate(EDITS, 1):
    c = s.count(a)
    print(f"edit {i} anchor count={c}")
    if c != 1 or a == b: sys.exit(f"ABORT: anchor {i} count {c}, nothing written")
for a, b in EDITS:
    s = s.replace(a, b, 1)
io.open(P, 'w', encoding='utf-8').write(s)
print('written', P)
