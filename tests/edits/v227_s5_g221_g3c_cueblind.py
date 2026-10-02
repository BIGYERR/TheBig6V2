#!/usr/bin/env python3
# V227 build, slice 5 of D190 P-SWAPSEAM: re-scope D177's gate row G3c in tests/gates/g221_d177_swapfloor.js.
# NO ia-version bump in this slice (index.html is already at 227). Touches that one gate file only.
# Ruling: tests/measure/v227_rulings/d190_swapseam_ruling.md, "Gates" item (RE-RULING 1 section C: "Stands"):
#   G3c's `O !== D` comparison on power and off-grammar pairs becomes cue-blind above 226 (strip the literal from
#   both sides before comparing), predicate `VER > 226`. Not an era list: a permanent narrowing of the predicate to
#   the claim D177 actually made (R2, the rep token). The cue byte goes into D190's gate's custody.
#   G6a: no re-scope. G3a's `O !== D && stripRep(O) !== stripRep(D)` untouched.
#   E1 typed literal D190_CUE plus cueBlind(s): exact suffix removed when VER > 226, identity otherwise. The oracle
#      never reads the engine's INJ_CAP_CUE. Placed beside stripRep; called only inside the L1 loop, after VER is set.
#   E2 the power compare goes through cueBlind on both sides.
#   E3 the off-grammar compare does the same.
#   E4 the R.G3c label says the compare is cue-blind above 226 (D190).
# Every anchor is asserted count==1 before anything is written; all or none.
import sys

P = '/Users/CanasBangin/Desktop/TheBig6V2/tests/gates/g221_d177_swapfloor.js'
src = open(P, encoding='utf-8').read()

def die(msg):
    print('REFUSED: ' + msg)
    sys.exit(1)

for name in ('D190_CUE', 'cueBlind'):
    if src.count(name) != 0:
        die('%s already present (count %d)' % (name, src.count(name)))

# VER is a `let` at top level; cueBlind must only be called after it is set. The L1 loop compares sit after it.
if src.count('let VER = STAMP;') != 1:
    die('VER anchor count %d' % src.count('let VER = STAMP;'))

EDITS = []

# E1: literal + helper, beside stripRep.
A1 = "const stripRep = s => String(s).replace(REP_TOKEN, (m, sets) => sets + '×#');\n"
B1 = ("const stripRep = s => String(s).replace(REP_TOKEN, (m, sets) => sets + '×#');\n"
      "// D190: the plan's cue is a second live-path writer outside `_swapDetailFor`; D177's claim is the rep token.\n"
      "// So G3c's power and off-grammar compares are cue-blind above 226: the exact suffix is removed from both sides,\n"
      "// once, before comparing. Typed here, never read from the engine. At 226 and below this is identity. The cue\n"
      "// byte itself is in D190's gate's custody (tests/measure/v227_rulings/d190_swapseam_ruling.md, Gates).\n"
      "const D190_CUE = ' — hold RPE 7, two in the tank';\n"
      "function cueBlind(s){ return (VER > 226 && typeof s === 'string' && s.endsWith(D190_CUE)) ? s.slice(0, s.length - D190_CUE.length) : s; }\n")
EDITS.append(('E1', A1, B1))

# E2: power compare.
A2 = "            S.pow++; if(O !== D){ S.powChg++; note('pow', where + ' :: ' + D + ' => ' + O); }\n"
B2 = "            S.pow++; if(cueBlind(O) !== cueBlind(D)){ S.powChg++; note('pow', where + ' :: ' + D + ' => ' + O); }\n"
EDITS.append(('E2', A2, B2))

# E3: off-grammar compare.
A3 = "          if(H.k === 'offgram'){ S.offN++; if(O !== D){ S.offChg++; note('off', where + ' :: ' + D + ' => ' + O); } }\n"
B3 = "          if(H.k === 'offgram'){ S.offN++; if(cueBlind(O) !== cueBlind(D)){ S.offChg++; note('off', where + ' :: ' + D + ' => ' + O); } }\n"
EDITS.append(('E3', A3, B3))

# E4: the row label.
A4 = "  G3c:'G3c L1: 0 power pairs change, 0 Main donors outside the S×R — RPE grammar change (R2)',\n"
B4 = "  G3c:'G3c L1: 0 power pairs change, 0 Main donors outside the S×R — RPE grammar change (R2); compare cue-blind above 226 (D190)',\n"
EDITS.append(('E4', A4, B4))

for tag, a, b in EDITS:
    n = src.count(a)
    if n != 1:
        die('%s anchor count %d (want 1)' % (tag, n))

out = src
for tag, a, b in EDITS:
    out = out.replace(a, b, 1)

for tag, a, b in EDITS:
    if out.count(b) != 1:
        die('%s did not land exactly once' % tag)

open(P, 'w', encoding='utf-8').write(out)
print('OK: ' + ', '.join(t for t, _, _ in EDITS) + ' landed in ' + P)
