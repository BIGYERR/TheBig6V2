#!/usr/bin/env python3
# v229_sa2_reanchor_v227_a.py — V229 spec slice SA2: re-anchor four stale entries of tests/sabotage/v227_d190.json
# (#0/#1 S1-D190 R3 (a)/(b), the live filter call dropped; #2/#3 S2-D190 R2 live (a)/(b), the strip dropped). Slice 2
# (D193 R3/R8) rewrote both applySwapChoice sites, so on the V229 candidate (index.html d854af0a91f8) each old anchor
# counts 0. Names, gates and note claims stay; each note gains one "V229 re-anchor:" sentence. All-or-none.
#   #0/#1: only the filter call goes (`const _fs=null;`); the injury guard and slice 2's keep (`item._preHold=_preF;`)
#          stay, so the card keeps the unfiltered carry, no hold is written at the tap and `_held` stays false.
#   #2/#3: V227's own replacement, `const _base=_wasDetail;`: the carry reads the card as it stands. D193 Amendment 2 R3
#          names the kept dose "D190 R2 generalised" (the read beneath the hold), so the strip on today's code has two
#          arms and both go; keeping the kept-dose arm left cuecap's named b-HAND-2/b-HAND-3 green (printed by builder).
# Checks: index.html sha starts d854af0a91f8; names as expected; each OLD anchor counts 0 (stale) and each NEW anchor
# counts 1; replacement != anchor; not already re-anchored; the JSON round-trips (indent 1, real UTF-8).
import hashlib, json, os, sys
ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
ART = os.path.join(ROOT, 'index.html')
P = os.path.join(ROOT, 'tests', 'sabotage', 'v227_d190.json')
if hashlib.sha256(open(ART, 'rb').read()).hexdigest()[:12] != 'd854af0a91f8':
    sys.exit('REFUSED: index.html is not the V229 candidate d854af0a91f8')
SRC = open(ART, encoding='utf-8').read()
# ── the new anchors and replacements (count==1 on the V229 candidate) ──
NEW = {}
_FILT_OLD = "    item._preHold=_preF;\n    try{\n      const _fs=applyInjuryFilter([{label:'x',items:[{name:to,detail:item.detail}]}],activeProg.cfg);\n"
_FILT_NEW = "    item._preHold=_preF;\n    try{\n      const _fs=null;\n"
NEW[0] = (_FILT_OLD, _FILT_NEW)
NEW[1] = (_FILT_OLD, _FILT_NEW)
_STRIP_OLD = "  const _base=_stripCapCue((typeof item._preHold==='string')?item._preHold:_wasDetail);\n"
_STRIP_NEW = "  const _base=_wasDetail;\n"
NEW[2] = (_STRIP_OLD, _STRIP_NEW)
NEW[3] = (_STRIP_OLD, _STRIP_NEW)

NAME = {
 0: "S1-D190 R3 (a) -> the live filter call in applySwapChoice is dropped: the plan never re-decides the cue on the tapped card",
 1: "S1-D190 R3 (b) -> the live filter call in applySwapChoice is dropped: cue <=> cap breaks on the live hop",
 2: "S2-D190 R2 live (a) -> the strip in applySwapChoice is dropped: the tap carries the donor's cue into _swapDetailFor",
 3: "S2-D190 R2 live (b) -> the strip in applySwapChoice is dropped: a cued donor's cue survives onto an uncapped target"
}
CAND = 'Printed by builder 2026-10-03 on the V229 candidate (d854af0a91f8, base_v228 as argv[3], cuecap sha 091a4186bcbe): '
NOTE = {
 0: " V229 re-anchor: slice 2 (D193 R3/R8) wrote the kept dose (`item._preHold=_preF;`) and `_held` into this guard, so the old anchor counts 0 on the V229 candidate; the mutation now drops only the filter call (`const _fs=null;`): the guard and the keep stay as slice 2 wrote them, the card keeps the unfiltered carry, no hold is written at the tap and `_held` stays false. " + CAND + "a-U residue 905/11,998, a-U' created 29, e 55/229; e-PRE, a-MEM, d-U, d-U' green; seam PASS 4 FAIL 3 (unmutated 7/0).",
 1: " V229 re-anchor: same anchor and replacement as the (a) row above (slice 2 moved the guard; only the filter call is dropped, the keep stays, `_held` stays false). " + CAND + "b-ALL 2,038/9,882 hops, b-HAND-1, b-HAND-2, b-HAND-3; also c-TOAST, the V229 hold-toast pin (moved 0 against the pinned 1,706: no filter, no clamp, no hold toast); c-UNINJ, c-DIGEST, c-MANNY green; cuecap PASS 3 FAIL 5 (unmutated 8/0).",
 2: " V229 re-anchor: slice 2 (D193 R3) widened the strip to read beneath the hold on either source (`_stripCapCue((typeof item._preHold==='string')?item._preHold:_wasDetail)`), so the old anchor counts 0 on the V229 candidate; the replacement is V227's own, `const _base=_wasDetail;`: the carry reads the card as it stands. D193 Amendment 2 R3 names the kept dose D190 R2 generalised (the read beneath the hold), so dropping the strip on today's code drops both arms of that read; keeping the kept-dose arm leaves the strip half in place (printed: cuecap's b-HAND-2 and b-HAND-3 stay green under it). " + CAND + "a-U residue 396/11,998 (ankle/wa W3 thu included: hop2 40, hop1 4, collide2 4, cyc2 1, exch3 1), a-U' created 9, e 174/229; e-PRE, a-MEM, d-U, d-U' green; seam PASS 4 FAIL 3 (unmutated 7/0).",
 3: " V229 re-anchor: same anchor and replacement as the (a) row above (`const _base=_wasDetail;`, both arms of the read beneath the hold dropped, see there). " + CAND + "b-ALL 1,130/9,882 hops, b-HAND-2 (hop2 live `2×8 — hold RPE 7, three in the tank` against boot `2×8`), b-HAND-3; also c-TOAST, the V229 hold-toast pin (moved 69 against the pinned 1,706); b-HAND-1, c-UNINJ, c-DIGEST, c-MANNY green; cuecap PASS 4 FAIL 4 (unmutated 8/0).",
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
