#!/usr/bin/env python3
# V226 slice 4 of 7: D189 P-PACEDISCLOSE wizard copy (class D). F1 helper, F2/F3 the two
# wizard "Current mile time" spans, F4 D9's >25:00 string.
# Ruling: tests/measure/v226_rulings/d188_d189_ruling.md, D189 F1-F4 (Mario "all yes",
# 2026-09-30; copy (c) and (d) accepted by name).
# No ia-version bump in this slice (stays 225). Every anchor count==1 at the moment it is
# replaced, or nothing is written.
import sys

PATH = "/Users/CanasBangin/Desktop/TheBig6V2/index.html"
src = open(PATH, encoding="utf-8").read()

OLD_SPAN = ('<div class="input-label">Current mile time <span style="color:var(--muted);font-weight:400">'
            'Optional. It sets your training paces.</span></div>')
NEW_SPAN = ('<div class="input-label">Current mile time <span style="color:var(--muted);font-weight:400">'
            '${_mileFieldHelp()}</span></div>')

HELPER = (
    "function _mileFieldHelp(){\n"
    "  const g=(WD.cardioGoals&&WD.cardioGoals.run)||{}; const exp=WD.experience||'intermediate';\n"
    "  if(g.id==='run_pace_goal' && exp!=='beginner') return 'Required. Your paces and your program length start from it.';\n"
    "  const a=runAnchorInfo({cardioTypes:['run'],cardioGoals:{run:{id:g.id||'run_base'}},experience:exp}); if(!a) return 'Optional.';\n"
    "  const m=_fmtMileAnchor(a.anchorSec), art=/^(8|11|18):/.test(m)?'an':'a';\n"
    "  return 'Optional. Leave it blank and your paces come from '+art+' '+m+' mile, the '+exp+' default. Enter a mile only if you have timed one.';\n"
    "}\n"
)

EDITS = [
    # F1: new helper, inserted before _mileAdvisoryHTML
    ("F1",
     "function _mileAdvisoryHTML(){",
     HELPER + "function _mileAdvisoryHTML(){"),
    # F2: first wizard site (V225 :2856), widened by its bare input-group opener
    ("F2",
     '\n            <div class="input-group" style="margin-top:8px">\n              ' + OLD_SPAN,
     '\n            <div class="input-group" style="margin-top:8px">\n              ' + NEW_SPAN),
    # F3: second wizard site (V225 :2877), widened by its ${(t==='run') ? ` opener
    ("F3",
     "${(t==='run') ? `<div class=\"input-group\" style=\"margin-top:8px\">\n              " + OLD_SPAN,
     "${(t==='run') ? `<div class=\"input-group\" style=\"margin-top:8px\">\n              " + NEW_SPAN),
    # F4: D9 >25:00 (V225 :7496)
    ("F4",
     "Over 25:00 reads as a walk, not a run. Leave it blank and the program anchors on your experience level instead.",
     "Over 25:00 reads as a walk, not a run. Check the entry."),
]

# Pre-check every anchor against the untouched source.
for name, old, new in EDITS:
    n = src.count(old)
    if n != 1:
        sys.exit("ABORT %s: anchor count %d != 1; nothing written" % (name, n))
if src.count("_mileFieldHelp") != 0:
    sys.exit("ABORT: _mileFieldHelp already present; nothing written")
if src.count("Optional. It sets your training paces.") != 2:
    sys.exit("ABORT: expected exactly 2 old span literals; nothing written")

out = src
for name, old, new in EDITS:
    n = out.count(old)
    if n != 1:
        sys.exit("ABORT %s: anchor count %d != 1 after earlier edits; nothing written" % (name, n))
    out = out.replace(old, new, 1)
    print("applied", name)

if out.count("Optional. It sets your training paces.") != 0:
    sys.exit("ABORT: old span literal survives; nothing written")
if out.count("${_mileFieldHelp()}") != 2:
    sys.exit("ABORT: expected 2 helper call sites; nothing written")

open(PATH, "w", encoding="utf-8").write(out)
print("wrote", PATH)
