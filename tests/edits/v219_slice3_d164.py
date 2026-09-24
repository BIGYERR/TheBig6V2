#!/usr/bin/env python3
# V219 slice 3 of 4 — D164 part 1, cfa (coach, V217): "pool and post-filter reason through one lens."
# _accFresh and the dense chestPool / chest2 dedupe on the pre-rename name; ruled: those draws see the plan's
# name. _injViewName(n,cfg) is the plan's rename seen through the athlete's gear (Cable pushdown falls back to
# Close-grip pushups when the gear lacks it).
# Lifted VERBATIM from tests/measure/v219_chain_rebaseline.js step 3: S1 (3 pairs) then [A_AIF, VIEW + A_AIF].
# Oracle: applied on step 2, result is byte-identical to /tmp/v219_cf_step3.html.
# No gate, no sabotage, no version bump in this slice.
import sys
P = '/Users/CanasBangin/Desktop/TheBig6V2/index.html'
src = open(P, encoding='utf-8').read()

VIEW = "function _injViewName(n,cfg){ if(!cfg||!cfg.injury) return n; const P=injuryPlan(cfg); if(!P||!P.swapNames||!P.swapNames[n]) return n; const g=_gearLens((cfg&&cfg.equipment)||'home_full'); if(!g(n)) return n; const to=P.swapNames[n]; const FB={'Cable pushdown':'Close-grip pushups'}; return g(to)?to:(FB[to]||to); }\n"
A_AIF = "function applyInjuryFilter(sections,cfg){"

EDITS = [
  # A0 _accFresh: the taken set and the freshness test both see the plan's name.
  ("        s.forEach(function(sec){((sec&&sec.items)||[]).forEach(function(it){if(it&&it.name)t[it.name]=1;});});\n        for(let i=0;i<prefs.length;i++){ if(prefs[i]&&!t[prefs[i]]) return prefs[i]; }\n        for(let i=0;i<chestAccPool.length;i++){ if(chestAccPool[i]&&!t[chestAccPool[i]]) return chestAccPool[i]; }",
   "        s.forEach(function(sec){((sec&&sec.items)||[]).forEach(function(it){if(it&&it.name){t[it.name]=1;t[_injViewName(it.name,cfg)]=1;}});});\n        const _fr=function(n){return n&&!t[n]&&!t[_injViewName(n,cfg)];};\n        for(let i=0;i<prefs.length;i++){ if(_fr(prefs[i])) return prefs[i]; }\n        for(let i=0;i<chestAccPool.length;i++){ if(_fr(chestAccPool[i])) return chestAccPool[i]; }"),
  # A1 dense chestPool: drop anything that renames onto the Main.
  ("        const chestPool=chestPoolRaw.filter(x=>x!==ex.chestMain);",
   "        const chestPool=chestPoolRaw.filter(x=>x!==ex.chestMain&&_injViewName(x,cfg)!==_injViewName(ex.chestMain,cfg));"),
  # A2 chest2: drop anything that renames onto the secondary.
  ("        const chest2=pick(chestPool.filter(x=>x!==secondary),2,blockSeed(w)+101);",
   "        const chest2=pick(chestPool.filter(x=>x!==secondary&&_injViewName(x,cfg)!==_injViewName(secondary,cfg)),2,blockSeed(w)+101);"),
  # A3 VIEW: the helper lands immediately before applyInjuryFilter.
  (A_AIF, VIEW + A_AIF),
]

for i, (a, b) in enumerate(EDITS):
    n = src.count(a)
    print('anchor A%d count %d :: %r' % (i, n, a[:70]))
    if n != 1:
        print('ABORT: anchor A%d count %d' % (i, n)); sys.exit(2)
    src = src.replace(a, b, 1)
if src.count("function _injViewName(") != 1 or src.count("const chestPool=chestPoolRaw.filter(x=>x!==ex.chestMain);") != 0:
    print('ABORT: post-condition'); sys.exit(3)
open(P, 'w', encoding='utf-8').write(src)
print('written')
