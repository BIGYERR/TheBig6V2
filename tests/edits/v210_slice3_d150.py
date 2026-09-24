# v210_slice3_d150.py — V210 slice 3: D150 (coach-ruled). THE SWAP UNIVERSE PASSES THE LENS
# BEFORE ANYONE READS IT. Engine C hands its _gearOK out; Engine D filters the harvested universe
# through it (plus, on the bodyweight tier, the bodyweight sweep's own test) and re-seeds the
# universe BEFORE deconflictAdjacentDupes, its first reader. Edits 1 to 3 are coach's surgery
# VERBATIM (tests/measure/v209_d70c_surgery.py, D150-C1a, C1b, C1c). Edit 4 rewrites the swap
# sheet comment that claimed "equipment-legal by construction" so it names the mechanism that now
# makes it true. Applies on top of slices 1 and 2.
#   python3 tests/edits/v210_slice3_d150.py index.html
# No ia-version bump in this slice.
import sys
P = sys.argv[1] if len(sys.argv) > 1 else 'index.html'
src = open(P, encoding='utf-8').read()
EDITS = [
 # D150-C1a: Engine C hands out the same predicate object the pools use
 ("  return { buildSections };",
  "  return { buildSections, gearOK:_gearOK };"),
 # D150-C1b: Engine D takes it
 ("  const { buildSections } = C;",
  "  const { buildSections, gearOK } = C;"),
 # D150-C1c: the universe passes the lens before its first reader
 ("  deconflictAdjacentDupes(weeks, cfg, seed, totalWeeks);",
  "  { const _isBW=cfg.equipment==='bodyweight'; const _u=_swapUniverseList().filter(n=>gearOK(n)&&!(_isBW&&(_BW_SUBS[n]||_BW_GEAR.test(n)))); _swapUniverseReset(); _swapUniverseAdd(_u); }\n  deconflictAdjacentDupes(weeks, cfg, seed, totalWeeks);"),
 # the comment the lens makes true
 ("// Candidates come from the harvested pick() universe, so they are equipment-legal\n// by construction, and are then run through applyInjuryFilter so an active injury\n// plan governs the swap sheet exactly as it governs generation.",
  "// Candidates come from the harvested pick() universe. V210 (D150) passes that universe\n// through the build's own gear lens (_gearOK, and on the bodyweight tier the sweep's own\n// test) before anyone reads it, so they are equipment-legal; travel variants are built by\n// the same buildProgram, so their keyed universes are too. They are then run through\n// applyInjuryFilter so an active injury plan governs the swap sheet exactly as it\n// governs generation."),
]
for i, (a, b) in enumerate(EDITS, 1):
    c = src.count(a)
    print(f"edit {i} anchor count={c}")
    if c != 1:
        sys.exit(f"ABORT: anchor {i} count {c}, nothing written")
for a, b in EDITS:
    src = src.replace(a, b, 1)
open(P, 'w', encoding='utf-8').write(src)
print("written", P)
