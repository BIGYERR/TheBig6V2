#!/usr/bin/env python3
# V231 slice 4 of 6 (engine): D196 P-BWFALLBACK, part 1 — the two lenses + ankle/knee squat literals.
# Ruling: tests/measure/v231_rulings/v231_ruling_d196_d195a1_d197.md (D196, surgery unchanged by
#         tests/measure/v231_rulings/v231_reruling_d195a2_d196a1_d197a1.md).
# Mario: "Bed hip thrust" for low back, glute bridge for ankle/knee.
#  L:   two local lenses declared right after _bw, inside the builder closure where isBW lives.
#       _bwHTlb is unread until slice 5 (the three lowback literals); that is expected.
#  KP:  knee/protect squat literal 'Banded hip thrust' -> _bwHTak.
#  AP:  ankle/protect squat literal 'Banded hip thrust' -> _bwHTak.
# Index-stable: pool length and order untouched. Loaded tiers byte-identical (lens returns the
# old literal when !isBW). No ia-version bump in this slice (slice 6 does it).
import sys, pathlib

P = pathlib.Path('/Users/CanasBangin/Desktop/TheBig6V2/index.html')
src = P.read_text(encoding='utf-8')

EDITS = [
    # L — anchor: the _bw declaration line (unique); lenses inserted directly after it.
    ("L",
     "  const _bw=(bwPool,other)=>isBW?_bwRung(bwPool):other;\n",
     "  const _bw=(bwPool,other)=>isBW?_bwRung(bwPool):other;\n"
     "  const _bwHTlb=isBW?'Single-leg hip thrust (shoulders on bed)':'Banded hip thrust';\n"
     "  const _bwHTak=isBW?'Single-leg glute bridge':'Banded hip thrust';\n"),
    # KP — anchor: the whole knee/protect squatPool line.
    ("KP",
     "        squatPool = hasBarbell?_floorPool(_gear(['Barbell hip thrust','45° back extension','Cable pull-through']),2,'Single-leg glute bridge'):['Banded hip thrust','Single-leg glute bridge','Bodyweight back extension'];\n",
     "        squatPool = hasBarbell?_floorPool(_gear(['Barbell hip thrust','45° back extension','Cable pull-through']),2,'Single-leg glute bridge'):[_bwHTak,'Single-leg glute bridge','Bodyweight back extension'];\n"),
    # AP — anchor: the whole ankle/protect squatPool line.
    ("AP",
     "        squatPool = hasCables?['Leg press','Dumbbell goblet squat']:hasBarbell?_gear(['Barbell hip thrust','45° back extension']):['Banded hip thrust','Single-leg glute bridge'];\n",
     "        squatPool = hasCables?['Leg press','Dumbbell goblet squat']:hasBarbell?_gear(['Barbell hip thrust','45° back extension']):[_bwHTak,'Single-leg glute bridge'];\n"),
]

# Assert every anchor count==1 before any write; abort on first miss.
for tag, old, new in EDITS:
    n = src.count(old)
    print(f"{tag}: anchor count = {n}")
    if n != 1:
        print(f"ABORT: {tag} anchor count {n} != 1; nothing written", file=sys.stderr)
        sys.exit(1)
    if src.count(new) != 0:
        print(f"ABORT: {tag} replacement already present; nothing written", file=sys.stderr)
        sys.exit(1)

out = src
for tag, old, new in EDITS:
    assert out.count(old) == 1, tag
    out = out.replace(old, new, 1)

P.write_text(out, encoding='utf-8')
print("written:", P)
