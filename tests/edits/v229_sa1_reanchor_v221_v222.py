#!/usr/bin/env python3
# v229_sa1_reanchor_v221_v222.py — V229 spec slice SA1: re-anchor four stale sabotage entries. Slices 2 and 3 rewrote
# the lines these mutations targeted, so on the V229 candidate (index.html d854af0a91f8, ia-version 229) each old anchor
# counts 0 and gatekeeper's sweep would report it NOT-APPLIED. Each entry keeps its name, its gate and its note's claim;
# the anchor and replacement move to today's code with the same mutation intent, and the note gains one
# "V229 re-anchor:" sentence. All-or-none: both files are computed and checked before either is written.
#   tests/sabotage/v221_d177.json        #7 S2-D177 R4 (undoSwap writes no detail), #8 S1-D177 R5 (third toast dropped)
#   tests/sabotage/v222_d181_chain.json  #0 S1-D181 R4' (MAP shape), #1 S2-D181 R4' (V221 plain assign)
# Checks: index.html sha starts d854af0a91f8; each entry's name is the expected one; each OLD anchor counts 0 on the
# candidate (stale) and each NEW anchor counts 1; replacement != anchor; the JSON round-trips (indent 1, real UTF-8).
# Literal bytes (real em-dashes, en-dashes, multiplication signs); no escapes.
import hashlib, json, os, sys
ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
ART = os.path.join(ROOT, 'index.html')
SAB = os.path.join(ROOT, 'tests', 'sabotage')
if hashlib.sha256(open(ART, 'rb').read()).hexdigest()[:12] != 'd854af0a91f8':
    sys.exit('REFUSED: index.html is not the V229 candidate d854af0a91f8')
SRC = open(ART, encoding='utf-8').read()

# ── the new anchors and replacements (count==1 on the V229 candidate) ──
SHOW_OLD_HEAD = "  showToast(_held\n    ? (_rx.win\n"
NEW = {}
# v221 #7: undoSwap restore writes no detail (kept-dose restore left as slice 3 wrote it)
NEW[('v221_d177.json', 7)] = (
  "if(it){it.detail=p.d;if(typeof p.ph==='string') it._preHold=p.ph; else delete it._preHold;_put.push(it);}",
  "if(it){if(typeof p.ph==='string') it._preHold=p.ph; else delete it._preHold;_put.push(it);}")
# v221 #8: both window-toast tests (hold variant and plain) are false
_T8 = ("  showToast(_held\n"
  "    ? (_rx.win\n"
  "      ? to+' in, '+from.toLowerCase()+' out. The load runs out before the reps do here. Reps move to '+_rx.win[0]+' to '+_rx.win[1]+'. Your injury plan holds this one at RPE 7.'\n"
  "      : _reRx\n"
  "      ? to+' in, '+from.toLowerCase()+' out. No load to add here. Your injury plan holds this one at RPE 7.'\n"
  "      : to+' in, '+from.toLowerCase()+' out. Same sets, same reps. Your injury plan holds this one at RPE 7.')\n"
  "    : _rx.win\n")
NEW[('v221_d177.json', 8)] = (_T8, _T8.replace("    ? (_rx.win\n", "    ? (false\n").replace("    : _rx.win\n", "    : false\n"))
_LOOP = ("    let hit=false;\n"
  "    const _renamed=[];   // V229 D193 (A3 s4) / D194 R6: the items this replay renamed, by identity\n"
  "    list.forEach(e=>{\n"
  "      const m1=Object.create(null); m1[e.from]=e.to;\n"
  "      const _was=[]; day.sections.forEach(s=>((s&&s.items)||[]).forEach(it=>{ if(it&&it.name===e.from) _was.push(it); }));\n"
  "      if(applySwapPrefs(day.sections,m1)) hit=true;\n"
  "      _was.forEach(it=>{ if(it.name!==e.from&&_renamed.indexOf(it)<0) _renamed.push(it); });\n"
  "    });\n")
_KEEP_PRE = "    const _was=[]; day.sections.forEach(s=>((s&&s.items)||[]).forEach(it=>{ if(it&&map[it.name]!==undefined) _was.push({it:it,n:it.name}); }));\n"
_KEEP_POST = "    _was.forEach(x=>{ if(x.it.name!==x.n&&_renamed.indexOf(x.it)<0) _renamed.push(x.it); });\n"
NEW[('v222_d181_chain.json', 0)] = (_LOOP,
  "    let hit=false;\n"
  "    const _renamed=[];   // V229 D193 (A3 s4) / D194 R6: the items this replay renamed, by identity\n"
  "    const map=Object.create(null);\n"
  "    list.forEach(r=>{let cur=r.from;list.forEach(e=>{if(e.from===cur)cur=e.to;});map[r.from]=cur;});\n"
  + _KEEP_PRE +
  "    if(applySwapPrefs(day.sections,map)) hit=true;\n"
  + _KEEP_POST)
NEW[('v222_d181_chain.json', 1)] = (_LOOP,
  "    let hit=false;\n"
  "    const _renamed=[];   // V229 D193 (A3 s4) / D194 R6: the items this replay renamed, by identity\n"
  "    const map=Object.create(null);\n"
  "    list.forEach(e=>{ map[e.from]=e.to; });\n"
  + _KEEP_PRE +
  "    if(applySwapPrefs(day.sections,map)) hit=true;\n"
  + _KEEP_POST)

NAME = {
  ('v221_d177.json', 7): 'S2-D177 R4 -> undoSwap finds the stored item but never writes the detail back',
  ('v221_d177.json', 8): "S1-D177 R5 -> the third toast branch is dropped: a windowed swap says 'No load to add here'",
  ('v222_d181_chain.json', 0): "S1-D181 R4' -> the parked MAP shape: one composed name map (each record's from resolved to its chain end), one applySwapPrefs call",
  ('v222_d181_chain.json', 1): "S2-D181 R4' -> the V221 plain assign: map[e.from]=e.to, no chain, one applySwapPrefs call",
}
NOTE = {
  ('v221_d177.json', 7): " V229 re-anchor: slice 3 (D193 Amendment 3 §4, D194 Amendment 1 R6) widened this restore to write the kept dose beside the detail (`if(typeof p.ph==='string') it._preHold=p.ph; else delete it._preHold;`), so the old anchor counts 0 on the V229 candidate; the mutation now drops only `it.detail=p.d;` and leaves the kept-dose restore as slice 3 wrote it, so the detail write is still the one thing under test. Printed by builder 2026-10-03 on the V229 candidate (d854af0a91f8, base_v228 as argv[3]): G5a 27,456 of 150,068 not identical, G5b, G5c; g221 PASS 17 FAIL 3 (unmutated 20/0).",
  ('v221_d177.json', 8): " V229 re-anchor: slice 2 (D193 R8) wrapped this toast as `showToast(_held ? (…hold variants…) : _rx.win …`, so the window test now appears twice and the old anchor counts 0 on the V229 candidate; the mutation sets both window tests (the hold variant's and the plain one) to false, so a windowed swap falls to the 'No load to add here' branch on either side. Printed by builder 2026-10-03 on the V229 candidate (d854af0a91f8, base_v228 as argv[3]): G1b (toast `… No load to add here, so take the sets to the same effort.`), G6a (third toast 0 vs hand window 5,984), G7-2a; g221 PASS 17 FAIL 3 (unmutated 20/0).",
  ('v222_d181_chain.json', 0): " V229 re-anchor: slice 3 (D193 Amendment 3 §4, D194 Amendment 1 R6) widened this replay loop with the `_renamed` identity list that stamps the kept dose before the day's single filter, so the old anchor counts 0 on the V229 candidate; the anchor is the widened loop and the replacement keeps that list (an item is renamed when the one composed-map call changed its name), so only the MAP shape is mutated. Printed by builder 2026-10-03 on the V229 candidate (d854af0a91f8, base_v228 as argv[3]): row 5 (boots Leg press 4×5–8 against live 4×8–12), row 5c (boots box 4×3), row 5L (detail!=live 482/5,088, licence refused above 226), row 5X (collide2 787/809, exch3 578/716); rows 8, 8d, 9a, 9b green; g222 chain PASS 4 FAIL 4 (unmutated 8/0).",
  ('v222_d181_chain.json', 1): " V229 re-anchor: slice 3 (D193 Amendment 3 §4, D194 Amendment 1 R6) widened this replay loop with the `_renamed` identity list that stamps the kept dose before the day's single filter, so the old anchor counts 0 on the V229 candidate; the anchor is the widened loop and the replacement keeps that list (an item is renamed when the one plain-map call changed its name), so only the plain-assign shape is mutated. Printed by builder 2026-10-03 on the V229 candidate (d854af0a91f8, base_v228 as argv[3]): row 5 (boots Dumbbell goblet squat 4×8–12), row 5c (boots goblet), row 5L (name!=live 5,088/5,088), row 5X (exch3 0/716); rows 8, 8d, 9a, 9b green; g222 chain PASS 4 FAIL 4 (unmutated 8/0).",
}
out = {}
for f in ('v221_d177.json', 'v222_d181_chain.json'):
    p = os.path.join(SAB, f); raw = open(p, encoding='utf-8').read(); d = json.loads(raw)
    if json.dumps(d, indent=1, ensure_ascii=False) + '\n' != raw:
        sys.exit('ABORT: ' + f + ' does not round-trip (indent 1, ensure_ascii False); nothing written')
    for (ff, i), (a, r) in NEW.items():
        if ff != f: continue
        e = d[i]
        if e.get('name') != NAME[(f, i)]: sys.exit('ABORT: ' + f + ' #' + str(i) + ' name is ' + repr(e.get('name'))[:90] + '; nothing written')
        if SRC.count(e['anchor']) != 0: sys.exit('ABORT: ' + f + ' #' + str(i) + ' old anchor counts ' + str(SRC.count(e['anchor'])) + ' (not stale); nothing written')
        if SRC.count(a) != 1: sys.exit('ABORT: ' + f + ' #' + str(i) + ' new anchor counts ' + str(SRC.count(a)) + '; nothing written')
        if a == r: sys.exit('ABORT: ' + f + ' #' + str(i) + ' replacement == anchor; nothing written')
        if 'V229 re-anchor:' in e.get('note', ''): sys.exit('ABORT: ' + f + ' #' + str(i) + ' already re-anchored; nothing written')
        e['anchor'] = a; e['replacement'] = r; e['note'] = e['note'] + NOTE[(f, i)]
        print('re-anchored ' + f + ' #' + str(i) + ' | ' + e['name'][:60])
    out[p] = json.dumps(d, indent=1, ensure_ascii=False) + '\n'
for p, txt in out.items():
    with open(p, 'w', encoding='utf-8', newline='\n') as fh: fh.write(txt)
    print('wrote ' + p)
