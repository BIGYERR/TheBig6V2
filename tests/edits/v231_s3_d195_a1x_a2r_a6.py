#!/usr/bin/env python3
# V231 slice 3 of 6 (engine): D195 Amendment 2 — A1x, A2r, A6.
# Ruling: tests/measure/v231_rulings/v231_reruling_d195a2_d196a1_d197a1.md
#  A1x: one line after the _dirty block registers the full post-reservation hipExt pool in the
#       swap universe, then filters it to single-leg hip thrust / glute bridge / pull-through
#       (minus Barbell hip thrust and Cable pull-through) on prevention builds.
#  A2r: runner prevention leg circuit appends ex.hipExt as its fourth item (2x8 each), when it
#       exists and is not the hinge itself. Rounds unchanged.
#  A6:  capSessionBudget trim loop scores leg circuit items at index >= 3 at section rank 3.
# No ia-version bump in this slice (slice 6 does it).
import sys, pathlib

P = pathlib.Path('/Users/CanasBangin/Desktop/TheBig6V2/index.html')
src = P.read_text(encoding='utf-8')

EDITS = [
    # A1x — anchor: the full _dirty block tail (upper: line + closing brace) and the blank line after.
    ("A1x",
     "    upper: chestCompoundPool!==_preInj.chest||rowPool!==_preInj.row||backCompoundPool!==_preInj.back\n"
     "  };\n",
     "    upper: chestCompoundPool!==_preInj.chest||rowPool!==_preInj.row||backCompoundPool!==_preInj.back\n"
     "  };\n"
     "  if(preventionSupport){ _swapUniverseAdd(hipExtPool); hipExtPool=hipExtPool.filter(n=>/hip thrust|glute bridge|pull-?through/i.test(n)&&n!=='Barbell hip thrust'&&n!=='Cable pull-through'); }\n"),
    # A2r — anchor: the whole runner-armor circuit push (label + three items), so the 2×8 line is pinned to it.
    ("A2r",
     "        s.push({label:'Leg circuit — runner armor',superset:true,rounds:2,items:[\n"
     "          {name:ex.lunge[0],detail:'2×10 each'},\n"
     "          {name:ex.kneeStab,detail:'2×25 sec'},\n"
     "          {name:ex.hinge[0],detail:'2×8'}]});\n",
     "        s.push({label:'Leg circuit — runner armor',superset:true,rounds:2,items:[\n"
     "          {name:ex.lunge[0],detail:'2×10 each'},\n"
     "          {name:ex.kneeStab,detail:'2×25 sec'},\n"
     "          {name:ex.hinge[0],detail:'2×8'}].concat((_isRunner&&ex.hipExt&&ex.hipExt!==ex.hinge[0])?[{name:ex.hipExt,detail:'2×8 each'}]:[])});\n"),
    # A6 — anchor: the D85 last-hinge guard line + the score line inside capSessionBudget's trim loop.
    ("A6",
     "        if(_postLeft<=1 && _isPost(it.name)) return;       // V198 (D85): the day's LAST hinge/hip_ext is not budget fodder\n"
     "        const score=sr*10+_itemRank(it.name);\n",
     "        if(_postLeft<=1 && _isPost(it.name)) return;       // V198 (D85): the day's LAST hinge/hip_ext is not budget fodder\n"
     "        const score=(((ii>=3)&&/^leg circuit/i.test((s&&s.label)||''))?3:sr)*10+_itemRank(it.name);\n"),
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
