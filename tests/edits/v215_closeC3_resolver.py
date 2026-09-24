# v215_closeC3_resolver.py — V215 close, part C3 (4 edits, tests only). g193_pool_overlay's resolver learns
# _floorPool, and _gear stops being the identity, so the knee/protect squatPool line V215 wrote
# (_floorPool(_gear([...]),2,'Single-leg glute bridge')) resolves again and D44's two-name floor runs on it.
# _gear has to filter by tier for the check to mean anything: with _gear as the identity the pool reads three
# names on every tier with or without the floor, so removing floor (a) could never trip it.
#   1  gearOK(): the implement a pool member needs, typed from its NAME, read against the hand GEAR table.
#      GHD names are a station from ia-version 215 (D149); through 214 Glute-ham raise needed the barbell
#      tier (the old barbell clause) and 45° back extension needed nothing (standing ruling 4).
#   2  resolve(): _gear filters with gearOK by tier; _floorPool(pool,min,add) appends add when the resolved
#      pool holds fewer than min names, as the engine's does; both are known identifiers.
#   3  the resolver's comment names the forms it can evaluate.
#   4  g193_pool_overlay_debt.txt: a gear-accurate _gear shows that ankle/protect squatPool is ONE name on
#      home_full from 215 (D149-D4a gear-gates it; home_full owns neither the station nor cables). Coach ruled
#      no floor there (2b dropped). It is recorded as named thin-pool debt keyed >=215, not hidden.
#   python3 tests/edits/v215_closeC3_resolver.py [gates_dir]   (default tests/gates; a scratch dir for trials)
import io, os, sys
D = sys.argv[1] if len(sys.argv) > 1 else '/Users/CanasBangin/Desktop/TheBig6V2/tests/gates'
PG = os.path.join(D, 'g193_pool_overlay.js'); PL = os.path.join(D, 'g193_pool_overlay_debt.txt')
s = io.open(PG, encoding='utf-8').read(); l = io.open(PL, encoding='utf-8').read()
A1 = "// ── 1. Carve the injury pool-override chain out of the source. ───────────────\n"
B1 = ("// ── HAND TABLE: the implement a pool member needs, typed from its NAME. Only _gear() and\n"
      "// _floorPool() consult it, because they are the two pool forms whose output depends on the tier.\n"
      "// GHD names are a station from ia-version 215 (D149: commercial and crossfit own one). Through 214\n"
      "// a Glute-ham raise needed the barbell tier and a 45° back extension needed nothing.\n"
      "const GEAR_VER = +IA.version;\n"
      "function gearOK(nm, g){\n"
      "  const n = String(nm).toLowerCase();\n"
      "  if (/glute[- ]ham|\\bghr\\b|45° back extension/.test(n))\n"
      "    return GEAR_VER >= 215 ? g.hasGHD : (/glute[- ]ham|\\bghr\\b/.test(n) ? g.hasBarbell : true);\n"
      "  if (/\\bbarbell\\b|^trap bar|^power clean|^hang clean|^rack pull|^back squat|^front squat|^bench press$|close-grip bench/.test(n)) return g.hasBarbell;\n"
      "  if (/cable|\\brope\\b|face pull|pulldown|pec deck|\\bleg press\\b|leg extension|leg curl|hack squat|\\bsmith\\b|preacher|\\bmachine\\b/.test(n)) return g.hasCables;\n"
      "  if (/\\bdumbbell|\\bdb\\b|goblet/.test(n)) return g.hasDumbbells;\n"
      "  return true;\n"
      "}\n\n" + A1)
R0 = "    !['hasBarbell','hasCables','hasDumbbells','isCrossfit','hasGHD','isBW','_gear','_bw',"
R1 = "    const v = f(g.hasBarbell, g.hasCables, g.hasDumbbells, g.isCrossfit, g.hasGHD, g.isBW, _gear, _bw);\n"
for a in (A1, R0, R1):
    if s.count(a) != 1: sys.exit(f"ABORT: gate anchor count {s.count(a)}: {a[:60]}, nothing written")
A2 = s[s.index(R0):s.index(R1) + len(R1)]
B2 = (A2
  .replace("'isBW','_gear','_bw',", "'isBW','_gear','_floorPool','_bw',", 1)
  .replace("  const _gear = a => a;                       // gear legality is checked separately\n",
           "  const _gear = a => a.filter(nm => gearOK(nm, g));   // the tier's gear gate (hand table above)\n"
           "  const _floorPool = (p, min, add) => p.length >= min ? p : p.concat([add]);   // V215 D149: append when short\n", 1)
  .replace("'isBW','_gear','_bw',\n", "'isBW','_gear','_floorPool','_bw',\n", 1)
  .replace("g.isBW, _gear, _bw);", "g.isBW, _gear, _floorPool, _bw);", 1))
if B2.count('_floorPool') != 4 or B2.count('gearOK') != 1: sys.exit(f"ABORT: resolver rewrite incomplete (_floorPool {B2.count('_floorPool')}, want 4: whitelist, definition, parameter, argument), nothing written")
A3 = "// Only expressions built out of gear predicates, array literals, _gear and _bw are\n// resolvable."
B3 = "// Only expressions built out of gear predicates, array literals, _gear (filtered by tier), _floorPool\n// (V215) and _bw are resolvable."
A4 = "thin-pool elbow/protect chestCompoundPool\n"
B4 = (A4 +
  "# V215 (D149): a gear-accurate resolver shows ankle/protect squatPool is ONE name on home_full. D149-D4a\n"
  "# gear-gates the literal and home_full owns neither the GHD station nor cables, so Barbell hip thrust is\n"
  "# left alone. Coach ruled no floor here (2b dropped: the day's main is still a barbell hip thrust).\n"
  "# Count: 12 pools from V215.\n"
  ">=215 thin-pool ankle/protect squatPool\n")
EDITS = [('g', A1, B1), ('g', A2, B2), ('g', A3, B3), ('l', A4, B4)]
for i, (w, a, b) in enumerate(EDITS, 1):
    c = (s if w == 'g' else l).count(a)
    print(f"edit {i} anchor count={c}")
    if c != 1 or a == b: sys.exit(f"ABORT: anchor {i} count {c}, nothing written")
for w, a, b in EDITS:
    if w == 'g': s = s.replace(a, b, 1)
    else: l = l.replace(a, b, 1)
io.open(PG, 'w', encoding='utf-8').write(s); io.open(PL, 'w', encoding='utf-8').write(l)
print('written', PG, PL)
