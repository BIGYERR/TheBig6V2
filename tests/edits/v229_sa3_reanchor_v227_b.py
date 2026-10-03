#!/usr/bin/env python3
# v229_sa3_reanchor_v227_b.py — V229 spec slice SA3: re-anchor the last four stale entries of tests/sabotage/v227_d190.json.
# Slices 2 and 3 rewrote the lines they targeted, so on the V229 candidate (index.html d854af0a91f8) each old anchor counts
# 0. Names, gates and note claims stay; each note gains one "V229 re-anchor:" sentence. All-or-none.
#   #6 S4-D190 R4: `const _reRx=(item.detail!==_base);` moves below the injury block; nothing else moves (_preF is taken
#      before the filter, so slice 2's keep and _held are byte-identical; only _reRx reads the filtered card).
#   #7 S5-D190 R5: only the boot filter call is disabled; slice 3's _renamed stamp stays. The whole-block reading trips the
#      same rows at the same figures and also removes the boot keep (D193 S18), a second mutation, so it is not used.
#   #8/#9 S6-D190 R6: the whole hit.rx restore block goes, slice 3's ph restore/delete with it.
# Checks: index.html sha starts d854af0a91f8; names as expected; each OLD anchor counts 0 (stale) and each NEW anchor
# counts 1; replacement != anchor; not already re-anchored; the JSON round-trips (indent 1, real UTF-8).
import hashlib, json, os, sys
ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
ART = os.path.join(ROOT, 'index.html')
P = os.path.join(ROOT, 'tests', 'sabotage', 'v227_d190.json')
if hashlib.sha256(open(ART, 'rb').read()).hexdigest()[:12] != 'd854af0a91f8':
    sys.exit('REFUSED: index.html is not the V229 candidate d854af0a91f8')
SRC = open(ART, encoding='utf-8').read()
# ── the new anchors and replacements (count==1 on the V229 candidate), sliced from the candidate's own text ──
A6 = "  const _reRx=(item.detail!==_base);\n  // V229 D193 (R3, R8; Amendment 3 section 4): on an injured program the tap keeps the dose before the re-filter beside the\n  // card (never printed, never in a sheet row, a digest or a toast), and _held says the plan's clamp changed the RPE of the\n  // dose it was handed. Nothing is kept on an uninjured program: the card is its own beneath.\n  const _preF=item.detail; let _held=false;\n  if(activeProg&&activeProg.cfg&&activeProg.cfg.injury){\n    item._preHold=_preF;\n    try{\n      const _fs=applyInjuryFilter([{label:'x',items:[{name:to,detail:item.detail}]}],activeProg.cfg);\n      const _fi=_fs&&_fs[0]&&_fs[0].items&&_fs[0].items[0];\n      if(_fi&&_fi.name===to){ _held=(/RPE/.test(_preF)&&_fi.detail!==_preF); item.detail=_fi.detail; }\n    }catch(e){}\n  }\n"
R6 = "  // V229 D193 (R3, R8; Amendment 3 section 4): on an injured program the tap keeps the dose before the re-filter beside the\n  // card (never printed, never in a sheet row, a digest or a toast), and _held says the plan's clamp changed the RPE of the\n  // dose it was handed. Nothing is kept on an uninjured program: the card is its own beneath.\n  const _preF=item.detail; let _held=false;\n  if(activeProg&&activeProg.cfg&&activeProg.cfg.injury){\n    item._preHold=_preF;\n    try{\n      const _fs=applyInjuryFilter([{label:'x',items:[{name:to,detail:item.detail}]}],activeProg.cfg);\n      const _fi=_fs&&_fs[0]&&_fs[0].items&&_fs[0].items[0];\n      if(_fi&&_fi.name===to){ _held=(/RPE/.test(_preF)&&_fi.detail!==_preF); item.detail=_fi.detail; }\n    }catch(e){}\n  }\n  const _reRx=(item.detail!==_base);\n"
A7 = "    if(hit && prog.cfg && prog.cfg.injury){\n      // the pre-filter replay result rides beside each renamed item; the filter copies item fields through\n      _renamed.forEach(it=>{ if(typeof it.detail==='string') it._preHold=it.detail; });\n      day.sections=applyInjuryFilter(day.sections,prog.cfg);\n    }"
R7 = "    if(hit && prog.cfg && prog.cfg.injury){\n      // the pre-filter replay result rides beside each renamed item; the filter copies item fields through\n      _renamed.forEach(it=>{ if(typeof it.detail==='string') it._preHold=it.detail; });\n      if(false) day.sections=applyInjuryFilter(day.sections,prog.cfg);\n    }"
A8 = "  if(Array.isArray(hit.rx)){\n    const _put=[];\n    hit.rx.forEach(function(p){\n      if(!p||typeof p.d!=='string') return;\n      const ps=day.sections[p.s], at=ps&&ps.items&&ps.items[p.i];\n      let it=(at&&at.name===from&&_put.indexOf(at)<0)?at:null;\n      if(!it) (day.sections||[]).some(function(s){return ((s&&s.items)||[]).some(function(x){\n        if(x&&x.name===from&&_put.indexOf(x)<0){it=x;return true;} return false;});});\n      // V229 D193 (Amendment 3 section 4) / D194 R6: the kept dose comes back from the record with the card, or nothing is kept.\n      if(it){it.detail=p.d;if(typeof p.ph==='string') it._preHold=p.ph; else delete it._preHold;_put.push(it);}\n    });\n  }\n  clearSwap(activeProgId,currentWeek,currentDayKey,from);"
R8 = '  clearSwap(activeProgId,currentWeek,currentDayKey,from);'
A9 = "  if(Array.isArray(hit.rx)){\n    const _put=[];\n    hit.rx.forEach(function(p){\n      if(!p||typeof p.d!=='string') return;\n      const ps=day.sections[p.s], at=ps&&ps.items&&ps.items[p.i];\n      let it=(at&&at.name===from&&_put.indexOf(at)<0)?at:null;\n      if(!it) (day.sections||[]).some(function(s){return ((s&&s.items)||[]).some(function(x){\n        if(x&&x.name===from&&_put.indexOf(x)<0){it=x;return true;} return false;});});\n      // V229 D193 (Amendment 3 section 4) / D194 R6: the kept dose comes back from the record with the card, or nothing is kept.\n      if(it){it.detail=p.d;if(typeof p.ph==='string') it._preHold=p.ph; else delete it._preHold;_put.push(it);}\n    });\n  }\n  clearSwap(activeProgId,currentWeek,currentDayKey,from);"
R9 = '  clearSwap(activeProgId,currentWeek,currentDayKey,from);'
NEW = {6:(A6, R6), 7:(A7, R7), 8:(A8, R8), 9:(A9, R9)}
NAME = {
 6: 'S4-D190 R4 -> the live filter moves above _reRx: a cue the filter appends reads as a moved dose and flips the toast',
 7: "S5-D190 R5 -> the boot re-filter in applySessionSwaps is disabled: the boot replays the cue-free carry and never writes the plan's cue",
 8: "S6-D190 R6 (d) -> the hit.rx restore block in undoSwap is dropped: undo brings the donor's name back but not its detail",
 9: 'S6-D190 R6 (g221 G5) -> the hit.rx restore block in undoSwap is dropped: the D177 window and cued donors come back with the grid detail',
}
CAND = 'Printed by builder 2026-10-03 on the V229 candidate (d854af0a91f8, base_v228 as argv[3], cuecap sha 091a4186bcbe): '
NOTE = {
 6: " V229 re-anchor: slice 2 (D193 R3/R8) put the kept dose (`const _preF=item.detail; let _held=false;`, `item._preHold=_preF;`) and `_held` between `_reRx` and the filter, so the old anchor counts 0 on the V229 candidate; the mutation still moves only `const _reRx=(item.detail!==_base);` below the injury block, and the move forces nothing else: `_preF` is taken before the filter, so the keep and `_held` are byte-identical to slice 2's and only `_reRx` reads the filtered card. " + CAND + "c-TOAST (toasts moved 3,744/9,882 hops against the pinned 1,706; 2,591 not a hold variant on a hand clamp pair), b-HAND-2, b-HAND-3 (their toast leg); b-ALL, b-HAND-1, c-UNINJ, c-DIGEST, c-MANNY green; cuecap PASS 5 FAIL 3 (unmutated 8/0).",
 7: " V229 re-anchor: slice 3 (D193 Amendment 3 §4, D194 Amendment 1 R6) put the boot keep (`_renamed.forEach(... it._preHold=it.detail ...)`) inside this guard before the filter, so the old anchor counts 0 on the V229 candidate; the mutation now disables only the filter call (`if(false) day.sections=applyInjuryFilter(...)`) and leaves the stamp. Both readings were run: disabling the whole guarded block trips the same rows at the same figures, so neither fails a named row; the call-only reading is kept because the block reading also removes the boot keep, which is D193's S18 (boot replay keeps no dose), a second mutation. " + CAND + "a-U residue 905/11,998, a-U' created 29, e 55/229; e-PRE, a-MEM, d-U, d-U' green; seam PASS 4 FAIL 3 (unmutated 7/0).",
 8: " V229 re-anchor: slice 3 (D193 Amendment 3 §4, D194 Amendment 1 R6) added the kept-dose restore (`if(typeof p.ph==='string') it._preHold=p.ph; else delete it._preHold;`) and a comment line inside this block, so the old anchor counts 0 on the V229 candidate; the whole `hit.rx` block still goes, the `ph` lines with it: undo restores nothing from the record. " + CAND + "d-U residue 3,924/12,282 (undo not byte-identical 3,924, no chip 0, chip != hand chip 0); also d-U' (created 8 of 44), not named; e-PRE, a-MEM, a-U, a-U', e green; seam PASS 5 FAIL 2 (unmutated 7/0).",
 9: " V229 re-anchor: same anchor and replacement as the row above (slice 3 added the `ph` restore/delete and a comment inside the block; the whole block goes). " + CAND + "G5a 110,353 of 150,068 not identical, G5b (Close-grip bench press -> Dips -> undo), G5c; G7-1a PASS (not named, as P11 measured); g221 PASS 17 FAIL 3 (unmutated 20/0).",
}
raw = open(P, encoding='utf-8').read(); d = json.loads(raw)
if json.dumps(d, indent=1, ensure_ascii=False) + '\n' != raw:
    sys.exit('ABORT: v227_d190.json does not round-trip (indent 1, ensure_ascii False); nothing written')
for i, (a, r) in sorted(NEW.items()):
    e = d[i]
    if e.get('name') != NAME[i]: sys.exit('ABORT: #' + str(i) + ' name is ' + repr(e.get('name'))[:90] + '; nothing written')
    if 'V229 re-anchor:' in e.get('note', ''): sys.exit('ABORT: #' + str(i) + ' already re-anchored; nothing written')
    if SRC.count(e['anchor']) != 0: sys.exit('ABORT: #' + str(i) + ' old anchor counts ' + str(SRC.count(e['anchor'])) + ' (not stale); nothing written')
    if SRC.count(a) != 1: sys.exit('ABORT: #' + str(i) + ' new anchor counts ' + str(SRC.count(a)) + '; nothing written')
    if a == r: sys.exit('ABORT: #' + str(i) + ' replacement == anchor; nothing written')
    e['anchor'] = a; e['replacement'] = r; e['note'] = e['note'] + NOTE[i]
    print('re-anchored v227_d190.json #' + str(i) + ' | ' + e['name'][:70])
with open(P, 'w', encoding='utf-8', newline='\n') as fh:
    fh.write(json.dumps(d, indent=1, ensure_ascii=False) + '\n')
print('wrote ' + P)
