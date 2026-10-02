#!/usr/bin/env python3
# V227 build, slice 1 of D190 P-SWAPSEAM: the four seam edits to index.html. NO ia-version bump in this slice.
# Ruling: tests/measure/v227_rulings/d190_swapseam_ruling.md (D190 plus its RE-RULING 1, the live text where they
# differ). Mario: "Ship D190 at V227". The surgery is byte for byte the tree measure proved
# (scratchpad/measure2/d190_226.html); this script adds only two comment blocks on top of it.
#   E1 (R2) the cue literal hoisted to INJ_CAP_CUE beside applyInjuryFilter, plus _stripCapCue (exact suffix only).
#   E2 (R2) applyInjuryFilter's appender reads INJ_CAP_CUE.
#   E3 (R2) applySwapPrefs hop: _swapDetailFor sees the stripped donor (boot replay, undo, cfg.exSwapPrefs pass).
#   E4 (R2, R4, R3) applySwapChoice: strip, carry, _reRx against the stripped donor, then the plan's filter on
#      {name:to, detail} in a throwaway section, detail taken only when the item survives under its own name.
# _swapDetailFor, the toasts, recordSwap/undoSwap/clearSwap, the boot re-filter (R5) and undo (R6) are untouched.
# Every anchor is asserted count==1 before anything is written; all or none. Refuses unless ia-version is 226.
import sys

P = '/Users/CanasBangin/Desktop/TheBig6V2/index.html'
src = open(P, encoding='utf-8').read()

def die(msg):
    print('REFUSED: ' + msg)
    sys.exit(1)

VER_META = '<meta name="ia-version" content="226">'
if src.count(VER_META) != 1:
    die('index.html is not at ia-version 226 (meta anchor count %d)' % src.count(VER_META))

# Names this slice introduces must not already exist anywhere in the file.
for name in ('INJ_CAP_CUE', '_stripCapCue'):
    if src.count(name) != 0:
        die('%s already present (count %d); a duplicate top-level declaration is a gate failure' % (name, src.count(name)))

EDITS = []

# E1: constant + stripper, top level, between _injViewName and applyInjuryFilter.
A1 = ("function _injViewName(n,cfg){ if(!cfg||!cfg.injury) return n; const P=injuryPlan(cfg); if(!P||!P.swapNames||!P.swapNames[n]) return n; const g=_gearLens((cfg&&cfg.equipment)||'home_full'); if(!g(n)) return n; const to=P.swapNames[n]; const FB={'Cable pushdown':'Close-grip pushups'}; return g(to)?to:(FB[to]||to); }\n"
      "function applyInjuryFilter(sections,cfg){\n")
B1 = ("function _injViewName(n,cfg){ if(!cfg||!cfg.injury) return n; const P=injuryPlan(cfg); if(!P||!P.swapNames||!P.swapNames[n]) return n; const g=_gearLens((cfg&&cfg.equipment)||'home_full'); if(!g(n)) return n; const to=P.swapNames[n]; const FB={'Cable pushdown':'Close-grip pushups'}; return g(to)?to:(FB[to]||to); }\n"
      "// V227 D190 P-SWAPSEAM (R2): the plan's cap cue is one literal, read by the appender in applyInjuryFilter and by\n"
      "// the stripper both swap hops run before _swapDetailFor, so the carry never sees it and the filter alone writes it.\n"
      "const INJ_CAP_CUE=' — hold RPE 7, two in the tank';\n"
      "function _stripCapCue(d){ return (typeof d==='string'&&d.endsWith(INJ_CAP_CUE))?d.slice(0,d.length-INJ_CAP_CUE.length):d; }\n"
      "function applyInjuryFilter(sections,cfg){\n")
EDITS.append(('E1', A1, B1))

# E2: the appender reads the constant.
A2 = "      if(pat&&P.cap.has(pat)&&detail&&!/RPE/.test(detail)) detail=detail+' — hold RPE 7, two in the tank';\n"
B2 = "      if(pat&&P.cap.has(pat)&&detail&&!/RPE/.test(detail)) detail=detail+INJ_CAP_CUE;\n"
EDITS.append(('E2', A2, B2))

# E3: applySwapPrefs hop strips before carry.
A3 = ("      it.name=to; hit=true;\n"
      "      it.detail=_swapDetailFor(to,it.detail);\n")
B3 = ("      it.name=to; hit=true;\n"
      "      it.detail=_swapDetailFor(to,_stripCapCue(it.detail));\n")
EDITS.append(('E3', A3, B3))

# E4: applySwapChoice, the ruling's order block (R2, R4, R3).
A4 = ("  item.name=to;\n"
      "  const _wasDetail=item.detail;\n"
      "  const _rx={};\n"
      "  item.detail=_swapDetailFor(to,item.detail,_rx);\n"
      "  const _reRx=(item.detail!==_wasDetail);\n")
B4 = ("  item.name=to;\n"
      "  const _wasDetail=item.detail;\n"
      "  // V227 D190 P-SWAPSEAM: the carry is blind to the plan's cue (R2), _reRx reads the stripped donor so a cue never\n"
      "  // moves a toast (R4), and the plan's filter alone decides the cue for the movement now on the card (R3).\n"
      "  const _base=_stripCapCue(_wasDetail);\n"
      "  const _rx={};\n"
      "  item.detail=_swapDetailFor(to,_base,_rx);\n"
      "  const _reRx=(item.detail!==_base);\n"
      "  if(activeProg&&activeProg.cfg&&activeProg.cfg.injury){\n"
      "    try{\n"
      "      const _fs=applyInjuryFilter([{label:'x',items:[{name:to,detail:item.detail}]}],activeProg.cfg);\n"
      "      const _fi=_fs&&_fs[0]&&_fs[0].items&&_fs[0].items[0];\n"
      "      if(_fi&&_fi.name===to) item.detail=_fi.detail;\n"
      "    }catch(e){}\n"
      "  }\n")
EDITS.append(('E4', A4, B4))

# Assert every anchor first; refuse on the first miss.
for tag, a, b in EDITS:
    n = src.count(a)
    if n != 1:
        die('%s anchor count %d (expected 1)' % (tag, n))

out = src
for tag, a, b in EDITS:
    if out.count(a) != 1:
        die('%s anchor count changed mid-script' % tag)
    out = out.replace(a, b, 1)

if out.count('INJ_CAP_CUE') != 4 or out.count('_stripCapCue') != 3:
    die('post-check: INJ_CAP_CUE %d (want 4), _stripCapCue %d (want 3)' % (out.count('INJ_CAP_CUE'), out.count('_stripCapCue')))
if out.count(VER_META) != 1:
    die('post-check: ia-version moved; this slice does not bump')

open(P, 'w', encoding='utf-8').write(out)
print('OK: E1 E2 E3 E4 applied; ia-version stays 226')
