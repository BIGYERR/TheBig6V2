#!/usr/bin/env python3
# V226 slice 6 of 7: D189 P-PACEDISCLOSE S1 pass (class B), g222 5L licence extended to 226,
# ia-version 225 -> 226.
# Ruling: tests/measure/v226_rulings/d188_d189_ruling.md, D189 F11, Item 7, Item 10, MARIO
# DECISION (2026-09-30).
# Premises checked before writing:
#   - engineD_synthesis(cfg, A, ...): cfg is the build cfg (carries experience); cardioTypes and
#     cardioGoals are A's, engineA's normalisation keeps every goal object (same ref, or
#     {...g, id} for an alias), so mileBest* ride through. The stored prog.cfg is
#     {...cfg,cardioTypes,cardioGoals,goal,seed}: the card's runAnchorInfo reads the same shape.
#   - After raceEveLiftPass only singletonSupersetSweep runs (no cardio, no note), then the
#     return; buildProgram returns D directly. Nothing after the call writes c.note.
#   - runAnchorInfo reads cfg only; paceChartLookup returns copies.
# Every anchor count==1 at the moment it is replaced, or nothing is written (index.html and the
# gate file are written together, only after every assertion passed). Version meta is last.
import sys

ROOT = "/Users/CanasBangin/Desktop/TheBig6V2/"
PATH = ROOT + "index.html"
GATE = ROOT + "tests/gates/g222_d181_chain.js"
src = open(PATH, encoding="utf-8").read()
gsrc = open(GATE, encoding="utf-8").read()


def rep(text, old, new, label):
    n = text.count(old)
    if n != 1:
        sys.stderr.write("ABORT %s: anchor count %d (want 1); nothing written\n" % (label, n))
        sys.exit(1)
    return text.replace(old, new, 1)


# 1. F11 call, directly after raceEveLiftPass (after every note writer in engineD_synthesis).
CALL_OLD = "  raceEveLiftPass(weeks, totalWeeks);   // V189 (D38): no lifting from two days out through the race\n"
CALL_NEW = (CALL_OLD +
    "  d189DefaultAnchorNote(weeks, {...cfg, cardioTypes, cardioGoals});   // V226 (D189 S1): after every note writer; a throwaway spread, cfg untouched\n")
src = rep(src, CALL_OLD, CALL_NEW, "F11 call")

# 2. F11 function, before function d18LongRunDayPass(weeks){ (verbatim from the ruling).
FN_OLD = "function d18LongRunDayPass(weeks){\n"
FN_NEW = (
    "// V226 (D189 S1): a program anchored on the experience default says so once, on the first paced\n"
    "// run of week 1, appended after the app-owned note (the V171 text stays an exact prefix). Self-\n"
    "// expiring: kind 'default' only, so a pencil edit rebuilds the future weeks and the sentence is gone.\n"
    "function d189DefaultAnchorNote(weeks, cfg){\n"
    "  const a = runAnchorInfo(cfg); if(!a || a.kind !== 'default') return;\n"
    "  const w1 = weeks['1'] || weeks[1]; if(!w1) return;\n"
    "  for(const d of _ISO_ORDER){ const day = w1[d]; if(!day || day.rest) continue;\n"
    "    for(const c of [].concat(day.cardio||[])){ if(!c || c.type!=='run') continue;\n"
    "      if(/RACE DAY|TIME TRIAL|^Benchmark Run/i.test(c.subtype||'') || (c.dose && c.dose.key==='bench')) continue;\n"
    "      if(!/\\d:\\d\\d\\/mi/.test(c.detail||'')) continue;\n"
    "      const m=_fmtMileAnchor(a.anchorSec), art=/^(8|11|18):/.test(m)?'an':'a';\n"
    "      c.note = (c.note ? c.note+' ' : '') + 'Paces here start from '+art+' '+m+' mile, the '+a.exp+' default. Tap the pencil on your program card to enter your mile time. Every run ahead of you rebuilds off it.';\n"
    "      return; } }\n"
    "}\n"
    + FN_OLD)
src = rep(src, FN_OLD, FN_NEW, "F11 function")

# 3. g222 5L licence: era 226 (Item 10, no new D-code). The R5L label (:96) already reads
#    LIC5L_ERAS; the header comment's era list is the same fact and moves with it.
LIC_OLD = "const LIC5L_ERAS = [222, 223, 224, 225], LIC5L_MAX = 70, LIC5L_OF = 15545;\n"
LIC_NEW = "const LIC5L_ERAS = [222, 223, 224, 225, 226], LIC5L_MAX = 70, LIC5L_OF = 15545;\n"
gsrc = rep(gsrc, LIC_OLD, LIC_NEW, "LIC5L_ERAS")
CMT_OLD = "LIC5L_ERAS.includes(VER): eras 222, 223, 224, 225 (each added by a re-ruling that\n"
CMT_NEW = "LIC5L_ERAS.includes(VER): eras 222, 223, 224, 225, 226 (each added by a re-ruling that\n"
gsrc = rep(gsrc, CMT_OLD, CMT_NEW, "LIC5L comment")

# 4. Version meta, LAST.
VER_OLD = '<meta name="ia-version" content="225">'
VER_NEW = '<meta name="ia-version" content="226">'
src = rep(src, VER_OLD, VER_NEW, "ia-version")

open(PATH, "w", encoding="utf-8").write(src)
open(GATE, "w", encoding="utf-8").write(gsrc)
print("v226_edit_6: 5 replacements written (index.html x3, g222 x2)")
