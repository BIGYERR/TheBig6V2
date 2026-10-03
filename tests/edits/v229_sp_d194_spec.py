#!/usr/bin/env python3
# v229_sp_d194_spec.py — V229 sabotage spec for D194 P-INJLENS part 1 and the dormant kept dose (D193 slices 2 and 3).
# Writes tests/sabotage/v229_d194.json once (refuses if it exists). Ruling: tests/measure/v229_rulings/d194_injlens_ruling.md
# (D194 "Sabotage" S23 to S26; Amendment 1 "Sabotage" S18, S19, S20, S20b, S21, S27; Amendment 2 "Sabotage"; session note).
# Every anchor is asserted count==1 on the candidate index.html and every replacement differs from its anchor before
# anything is written; the first miss aborts the whole script with nothing written. One gate per entry.
import json, pathlib, sys
ROOT = pathlib.Path(__file__).resolve().parents[2]
CAND = ROOT / 'index.html'
OUT = ROOT / 'tests' / 'sabotage' / 'v229_d194.json'
RUL = 'tests/measure/v229_rulings/d194_injlens_ruling.md'

# ── anchors (literal candidate text) ──────────────────────────────────────────────────────────────────────────────
BOOT_KEEP = ("    if(hit && prog.cfg && prog.cfg.injury){\n"
             "      // the pre-filter replay result rides beside each renamed item; the filter copies item fields through\n"
             "      _renamed.forEach(it=>{ if(typeof it.detail==='string') it._preHold=it.detail; });\n")
BOOT_STAMP = ("      _renamed.forEach(it=>{ if(typeof it.detail==='string') it._preHold=it.detail; });\n"
              "      day.sections=applyInjuryFilter(day.sections,prog.cfg);\n")
UNDO = "      if(it){it.detail=p.d;if(typeof p.ph==='string') it._preHold=p.ph; else delete it._preHold;_put.push(it);}\n"
TAP_GUARD = "  if(activeProg&&activeProg.cfg&&activeProg.cfg.injury){\n    item._preHold=_preF;\n"
TAP_FILTER = "      const _fs=applyInjuryFilter([{label:'x',items:[{name:to,detail:item.detail}]}],activeProg.cfg);\n"
LENS_HEAD = "function _dayPlanCfg(prog,day){\n  const base=(prog&&prog.cfg)||{};\n"
LENS_READ = ("  const ov=dayOverlayInfo(day);\n"
             "  if(!ov||!ov.patch||!Object.prototype.hasOwnProperty.call(ov.patch,'injury')) return base;\n")
SWAP_CFG = "function swapCandidates(outName,day,week,prog){\n  const cfg=_dayPlanCfg(prog,day);   // D194 R1\n"
AUX_CFG = "  const cfg=_dayPlanCfg(prog,day);   // D194 R1 (equipment unchanged: injury only)\n"
ADD_CFG = "function addCandidates(day,week,prog){\n  const cfg=_dayPlanCfg(prog,day);   // D194 R1\n"

G_LENS, G_BUILD = 'gates/g229_d194_lens.js', 'gates/g229_d193_build.js'
G_UNDO, G_SEAM, G_FLOOR = 'gates/g228_d192_undokey.js', 'gates/g227_d190_seam.js', 'gates/g221_d177_swapfloor.js'

M = [
 ("S18-D194 A1 -> the boot replay keeps no dose: the _renamed stamp inside the injury guard is dropped",
  BOOT_STAMP, "      day.sections=applyInjuryFilter(day.sections,prog.cfg);\n", G_UNDO,
  "NAMED TRIP: row d2-BOOT-U (" + RUL + ", Amendment 1 Sabotage S18: upper bound 1,378 of 1,587 with neither half; figure read on the run): after undo a fresh boot of the day no longer equals the live day on the fixture. Also trips g229_d194_lens q (fixture conjunct: the mario RB reboot slot loses _preHold \"2×6–10 @ RPE 8\"). EXPECTED: d2-BOOT-U (printed by builder at V229: residue 1,282 of 1,587, inside the ruled bound). GUARD also reads FAIL on this mutant (projected hop5 created 7, walk+hop4 0); it is a side trip, not the named one (Amendment 2 Sabotage)."),
 ("S19-D194 A1 -> undo always deletes the kept dose, never restores ph from the record",
  UNDO, "      if(it){it.detail=p.d;delete it._preHold;_put.push(it);}\n", G_SEAM,
  "NAMED TRIP: row d-U (" + RUL + ", Amendment 1 Sabotage S19: at least 6,132 + 644 + 373 = 7,149 of 12,282 by M9's classes, plus the cyc classes): a restored card that carried a dose before the last hop comes back without it. Also g228_d192_undokey d2-UNDO and d2-BOOT-U. EXPECTED: d-U (printed by builder at V229: residue 9,613 of 12,282); d-U' also reads FAIL (created 44 of 44)."),
 ("S20-D194 A1 -> undo leaves the undone hop's dose: the restore block reverts to V228's line",
  UNDO, "      if(it){it.detail=p.d;_put.push(it);}\n", G_FLOOR,
  "NAMED TRIP: row G5a (" + RUL + ", Amendment 1 Sabotage S20: G5a 102,720 of 150,068 not byte-identical after swap then undo; also G5c). The same mutation trips g227_d190_seam d-U 3,579 of 12,282 and g228_d192_undokey d2-UNDO 230 of 2,201. EXPECTED: G5a (printed by builder at V229: 102,720 of 150,068) and G5c."),
 ("S20b-D194 A1 -> undo restores ph when the record has one but does not delete the kept dose when it has none",
  UNDO, "      if(it){it.detail=p.d;if(typeof p.ph==='string') it._preHold=p.ph;_put.push(it);}\n", G_SEAM,
  "NAMED TRIP: row d-U (" + RUL + ", Amendment 1 Sabotage S20b: the native-restore classes, hop1 2,277 + collide2 392 = 2,669 of 12,282): a restored native card keeps the undone hop's _preHold. Also g221_d177_swapfloor G5a 102,720. EXPECTED: d-U (printed by builder at V229: residue 2,669 of 12,282)."),
 ("S21-D194 A1 -> the tap keeps a dose on an uninjured program: the keep is written outside the cfg.injury guard",
  TAP_GUARD, "  item._preHold=_preF;\n  if(activeProg&&activeProg.cfg&&activeProg.cfg.injury){\n", G_BUILD,
  "NAMED TRIP: row b (" + RUL + ", Amendment 1 Sabotage S21 and the (b) addition: no _preHold on an uninjured item after a build, two live swaps, a boot replay or an undo; object row V228 byte-identical): the uninjured hops carry _preHold. No figure ruled; read on the run. Also g229_d194_lens q (the overlay tap keeps a dose). EXPECTED: b (printed by builder at V229: object row 0 of 27 slots equal V228, _preHold 83 after hops/boot/undo, ph 27 in records)."),
 ("S23-D194 -> the lens helper returns prog.cfg regardless of the day",
  LENS_HEAD, LENS_HEAD + "  return base;\n", G_LENS,
  "NAMED TRIP: row p-SWAP (" + RUL + ", D194 Sabotage S23: (p) 1,451): rejected names offered 1,451 of 39,117, cards 1,387 of 4,529. Also p-AUX 4,228 / 941, p-ADD 2,104 / 1,120, p-MARIO swap 2 of 223, p-UNSTAMPED thu/fri/sat 2/1/3, p-BRIDGE 9 of 390. EXPECTED: p-SWAP, p-AUX, p-ADD, p-MARIO, p-UNSTAMPED, p-BRIDGE; o and q stay green (printed by builder at V229 at exactly these figures)."),
 ("S24a-D194 -> swapCandidates left on prog.cfg",
  SWAP_CFG, "function swapCandidates(outName,day,week,prog){\n  const cfg=(prog&&prog.cfg)||{};\n", G_LENS,
  "NAMED TRIP: row p-SWAP (" + RUL + ", D194 Sabotage S24a: (p) by list): 1,451 of 39,117, cards 1,387. Also p-MARIO swap 2 of 223 (tue Sumo deadlift, thu Barbell box squat: Jump squats), p-UNSTAMPED, p-BRIDGE. EXPECTED: p-SWAP, p-MARIO, p-UNSTAMPED, p-BRIDGE; o, p-AUX, p-ADD, q stay green (printed by builder at V229: 1,451 / 1,387; swap 2 of 223; thu/fri/sat 1/0/0; bridge 2 of 388)."),
 ("S24b-D194 -> auxSwapCandidates left on prog.cfg (the _powerAllowed site with it)",
  AUX_CFG, "  const cfg=(prog&&prog.cfg)||{};\n", G_LENS,
  "NAMED TRIP: row p-AUX (" + RUL + ", D194 Sabotage S24b: (p) by list; Amendment 1 (p): aux 4,228 of 21,856): 4,228 of 21,856, cards 941 of 1,754. Also p-MARIO aux 2 of 68, p-UNSTAMPED, p-BRIDGE. EXPECTED: p-AUX, p-MARIO, p-UNSTAMPED, p-BRIDGE; o, p-SWAP, p-ADD, q stay green (printed by builder at V229: 4,228 / 941; aux 2 of 68; thu/fri/sat 0/0/2; bridge 2 of 389)."),
 ("S24c-D194 -> addCandidates left on prog.cfg",
  ADD_CFG, "function addCandidates(day,week,prog){\n  const cfg=(prog&&prog.cfg)||{};\n", G_LENS,
  "NAMED TRIP: row p-ADD (" + RUL + ", D194 Sabotage S24c: (p) by list; Amendment 1 (p): add 2,104 of 19,380): 2,104 of 19,380, day pickers 1,120 of 1,440. Also p-MARIO add 5 of 79, p-UNSTAMPED, p-BRIDGE. EXPECTED: p-ADD, p-MARIO, p-UNSTAMPED, p-BRIDGE; o, p-SWAP, p-AUX, q stay green (printed by builder at V229: 2,104 / 1,120; add 5 of 79; thu/fri/sat 1/1/1; bridge 5 of 387)."),
 ("S25-D194 -> the tap guard and its filter cfg read the lens (premature activation of D194 part 2)",
  TAP_GUARD + "    try{\n" + TAP_FILTER,
  "  if(_dayPlanCfg(activeProg,day).injury){\n    item._preHold=_preF;\n    try{\n      const _fs=applyInjuryFilter([{label:'x',items:[{name:to,detail:item.detail}]}],_dayPlanCfg(activeProg,day));\n", G_LENS,
  "NAMED TRIP: row q (" + RUL + ", D194 Sabotage S25: (q)): on the overlay program the U2 hop onto Leg extension prints \"2×6–10 @ RPE 7\" with the hold toast and keeps _preHold; the sample moves on every W5 chain (printed by builder at V229: 568 of 568 W5, 473 of 591 W3 through the batch-level _preHold count). EXPECTED: q only."),
 ("S26-D194 -> the lens reads the week's Monday stamp instead of the day's",
  LENS_READ,
  "  const _wk=Object.values((prog&&prog.weeks)||{}).find(w=>w&&Object.values(w).includes(day));\n  const ov=dayOverlayInfo(_wk&&_wk.mon?_wk.mon:day);\n  if(!ov||!ov.patch||!Object.prototype.hasOwnProperty.call(ov.patch,'injury')) return base;\n", G_LENS,
  "NAMED TRIP: row p-UNSTAMPED (" + RUL + ", D194 Sabotage S26: (p) the Thursday-from program): with from on Thursday, thu/fri/sat read Monday's empty stamp and offer V228's rejected names again, 2/1/3. Also p-BRIDGE (halfstep days read the bridge patch). EXPECTED: p-UNSTAMPED, p-BRIDGE (printed by builder at V229: thu/fri/sat 2/1/3; bridge 6 of 390, halfstep 14/19)."),
 ("S27-D194 A1 -> the boot keep is written outside the prog.cfg.injury guard",
  BOOT_KEEP,
  "    _renamed.forEach(it=>{ if(typeof it.detail==='string') it._preHold=it.detail; });\n    if(hit && prog.cfg && prog.cfg.injury){\n      // the pre-filter replay result rides beside each renamed item; the filter copies item fields through\n", G_LENS,
  "NAMED TRIP: row q (" + RUL + ", Amendment 1 Sabotage S27: (q), an overlay program's booted item carries _preHold; also (b)): every booted overlay program in the sample carries _preHold (printed by builder at V229: 1,159 of 1,159) and the RB reboot slot keeps a dose. Also g229_d193_build b. EXPECTED: q only."),
]

if OUT.exists():
    sys.exit('REFUSED: ' + str(OUT) + ' already exists; this script writes the spec once and never overwrites it')
src = CAND.read_text(encoding='utf-8')
rows = []
for name, anchor, repl, gate, note in M:
    n = src.count(anchor)
    if n != 1: sys.exit('ABORT (nothing written): ' + name.split(' ')[0] + ' anchor count ' + str(n))
    if repl == anchor: sys.exit('ABORT (nothing written): ' + name.split(' ')[0] + ' replacement equals anchor')
    if not (ROOT / 'tests' / gate).exists(): sys.exit('ABORT (nothing written): ' + name.split(' ')[0] + ' gate missing ' + gate)
    rows.append({'name': name, 'anchor': anchor, 'replacement': repl, 'gate': gate, 'note': note})
with open(OUT, 'x', encoding='utf-8') as fh:
    json.dump(rows, fh, ensure_ascii=False, indent=1); fh.write('\n')
print('wrote ' + str(OUT) + ' (' + str(len(rows)) + ' mutations)')
