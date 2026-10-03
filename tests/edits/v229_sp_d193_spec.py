#!/usr/bin/env python3
# v229_sp_d193_spec.py — V229 sabotage spec for D193 P-CAPRPE's build half (the clamp, R7's held test, the stripper) and
# the live-path mutations whose ruled rows are V230's but which trip a shipped V229 row. Writes tests/sabotage/v229_d193.json
# once (refuses if it exists). Rulings: tests/measure/v228_rulings/d193_caprpe_ruling.md (original Sabotage, Amendments 1,
# 2, 3 and 4) and tests/measure/v229_rulings/d194_injlens_ruling.md (D194 Sabotage, restating them for V229). Names carry
# a V229- prefix so none collides with tests/sabotage/v228_d193.json. Every anchor is asserted count==1 on the candidate
# index.html and every replacement differs from its anchor before anything is written; one gate per entry.
import json, pathlib, sys
ROOT = pathlib.Path(__file__).resolve().parents[2]
CAND = ROOT / 'index.html'
OUT = ROOT / 'tests' / 'sabotage' / 'v229_d193.json'

# ── anchors (literal candidate text) ──
CLAMP_LINE = "      if(pat&&P.cap.has(pat)&&detail) detail=/RPE/.test(detail)?_capRpeClamp(detail):detail+INJ_CAP_CUE;   // V229 D193 (R2, R7)\n"
BW_RPE = "  let rpe=/rpe\\s*6|light|easy/i.test(detail||'')?'6':/rpe\\s*7/i.test(detail||'')?'7':'8';\n"
GLOSS = "    return 'RPE 7'+(/^ \\(stop/.test(g)?' (leave 3 or more in reserve)':/^ \\(heaviest/.test(g)?' (leave ~3 in reserve)':' (leave ~3 reps in reserve)');\n"
FIFTH = "  if(/^Work up to one heavy set of 3 to 5 reps at RPE [\\d.]+\\. Technique stays crisp\\. No grinding\\. Log the weight and the reps\\. That set is your new baseline\\.$/.test(d)) return INJ_HELD_TEST;\n"
STRIP_R7 = "if(/^Work up to one working set of 3 to 5 reps at RPE [\\d.]+\\. Technique stays crisp\\. No grinding\\. Log the weight and the reps\\. Your injury plan holds this lift, so there is no new baseline here\\.$/.test(d)) return TEST_RX_TEXT; "
CARRY = "  const _base=_stripCapCue((typeof item._preHold==='string')?item._preHold:_wasDetail);\n"
TOAST = ("      ? to+' in, '+from.toLowerCase()+' out. The load runs out before the reps do here. Reps move to '+_rx.win[0]+' to '+_rx.win[1]+'. Your injury plan holds this one at RPE 7.'\n"
         "      : _reRx\n"
         "      ? to+' in, '+from.toLowerCase()+' out. No load to add here. Your injury plan holds this one at RPE 7.'\n"
         "      : to+' in, '+from.toLowerCase()+' out. Same sets, same reps. Your injury plan holds this one at RPE 7.')\n")
PRINT = "      if(_fi&&_fi.name===to){ _held=(/RPE/.test(_preF)&&_fi.detail!==_preF); item.detail=_fi.detail; }\n"

R193 = 'tests/measure/v228_rulings/d193_caprpe_ruling.md'
R194 = 'tests/measure/v229_rulings/d194_injlens_ruling.md'
G_BUILD, G_SEAM, G_FLOOR = 'gates/g229_d193_build.js', 'gates/g227_d190_seam.js', 'gates/g221_d177_swapfloor.js'
M = [
 ("V229-S2-D193 R2 -> the clamp branch in applyInjuryFilter is removed: a capped RPE above 7 rides through",
  CLAMP_LINE, "      if(pat&&P.cap.has(pat)&&detail) detail=/RPE/.test(detail)?detail:detail+INJ_CAP_CUE;   // V229 D193 (R2, R7)\n", G_BUILD,
  "NAMED TRIP: row a (" + R193 + " Amendment 1 section 8 and Amendment 4: (a) 316; " + R194 + " Sabotage: S2 -> (a) 316, (o) lowback 2). Printed by builder at V229: L432 316 of U 8,462 above RPE 7, home_basic 120 of 2,092. Also b, d-BWSETS, d-GRAMMAR, d-WAVE, d-LOADCAP, h and j (FAIL 8), and g229_d194_lens o (lowback 2). EXPECTED: a."),
 ("V229-S3-D193 R2 -> the clamp is applied regardless of cap: uncapped injured cards are held too",
  CLAMP_LINE, CLAMP_LINE + "      else if(detail&&/RPE/.test(detail)) detail=_capRpeClamp(detail);\n", G_BUILD,
  "NAMED TRIP: row b (" + R193 + " original Sabotage S3 -> (b); " + R194 + " Sabotage: S3 -> (b)). Printed by builder at V229: outside the clamp population 478 of 1,053 byte-identical to V228. Also j (unheld test cards 36 of 102) and d-WAVE. EXPECTED: b."),
 ("V229-S6-D193 R2 -> _bwSetsFromDetail is made cue-blind: a cued bodyweight native reads RPE 8",
  BW_RPE, "  const _cb=_stripCapCue(detail||'');\n  let rpe=/rpe\\s*6|light|easy/i.test(_cb)?'6':/rpe\\s*7/i.test(_cb)?'7':'8';\n", G_BUILD,
  "NAMED TRIP: row a (" + R193 + " original Sabotage S6 -> (a), the 1,066 natives flip to 8; " + R194 + " Sabotage: S6 as Amendments 1 and 4). Printed by builder at V229: L432 1,066 of U 8,462 above RPE 7, home_basic 334. Also b and h. EXPECTED: a."),
 ("V229-S7-D193 R2 -> the bwsets clamp lowers the number but keeps (stop 2 reps short of failure)",
  GLOSS, "    return 'RPE 7'+(/^ \\(stop/.test(g)?' (stop 2 reps short of failure)':/^ \\(heaviest/.test(g)?' (leave ~3 in reserve)':' (leave ~3 reps in reserve)');\n", G_BUILD,
  "NAMED TRIP: row d-BWSETS (" + R193 + " original Sabotage S7 -> (d); " + R194 + " Sabotage: S7 as Amendments 1 and 4). Printed by builder at V229: 1,211 of 1,239 bwsets holds keep the forbidden gloss. EXPECTED: d-BWSETS only."),
 ("V229-S9-D193 R2 -> the loadCapped clamp keeps (heaviest pair you can find)",
  GLOSS, "    return 'RPE 7'+(/^ \\(stop/.test(g)?' (leave 3 or more in reserve)':/^ \\(heaviest/.test(g)?' (heaviest pair you can find)':' (leave ~3 reps in reserve)');\n", G_BUILD,
  "NAMED TRIP: row d-LOADCAP (" + R193 + " Amendment 1 section 8: S9 -> (d), (h); " + R194 + " Sabotage: S9 as Amendments 1 and 4). Printed by builder at V229: 310 of 310 loadCapped holds keep `heaviest pair`. Also h (0 of 2 heaviest-pair cards read the hold). EXPECTED: d-LOADCAP, h."),
 ("V229-S10-D193 R2 -> the wave clamp drops the number but keeps ~2 reps",
  GLOSS, "    return 'RPE 7'+(/^ \\(stop/.test(g)?' (leave 3 or more in reserve)':/^ \\(heaviest/.test(g)?' (leave ~3 in reserve)':g);\n", G_BUILD,
  "NAMED TRIP: row d-WAVE (" + R193 + " Amendment 1 section 8: S10 -> (d), (e'); " + R194 + " Sabotage: S10 as Amendments 1 and 4). Printed by builder at V229: 2 of 2 held wave texts keep `~2 reps` / `~1 rep`. EXPECTED: d-WAVE only."),
 ("V229-S14-D193 R7 -> the fifth shape is number-only: a held test keeps the heavy-set baseline words at RPE 7",
  FIFTH, "", G_BUILD,
  "NAMED TRIP: row j (" + R193 + " Amendment 2 S14 and Amendment 4: (j) 30; " + R194 + " Sabotage: S14 -> (j) 30, (o) R7 row). Printed by builder at V229: R7 on 0 of 30 held test cards, number-only 30. Also g229_d194_lens o (strength W6 thu). EXPECTED: j only."),
 ("V229-S15-D193 R7 -> the fifth shape is applied regardless of cap: an unheld test card prints the held-test words",
  CLAMP_LINE, CLAMP_LINE + "      else if(detail&&/^Work up to one heavy set of 3 to 5 reps at RPE [\\d.]+\\. /.test(detail)) detail=INJ_HELD_TEST;\n", G_BUILD,
  "NAMED TRIP: row j (" + R193 + " Amendment 2 S15 -> (b), (j); " + R194 + " Sabotage: S15 -> (b), (j)). Printed by builder at V229: unheld test cards byte-identical to V228 36 of 102. Also b (outside 1,017 of 1,053). EXPECTED: j, b."),
 ("V229-S17-D193 R7 -> the stripper does not map R7's held-test text back to the test",
  STRIP_R7, "", G_BUILD,
  "NAMED TRIP: row f (" + R193 + " Amendment 3 S17; " + R194 + " Sabotage: S17 -> (f)). Printed by builder at V229: _stripCapCue(INJ_HELD_TEST) WRONG, 2 hand strings wrong. EXPECTED: f only."),
 ("V229-S11-D193 R3 -> the live carry reads the clamped card, not the kept dose beneath it",
  CARRY, "  const _base=_stripCapCue(_wasDetail);\n", G_SEAM,
  "NAMED TRIP: row a-U (" + R193 + " Amendment 2 S11 -> (i) 5,840, a V230 row per " + R194 + " R3'; at V229 the shipped trip is D190's live == boot row, which " + R194 + " R4 names and M9 printed red on slice 1 alone, a-U 83 of 11,998, a-U' 1 of 326). Printed by builder at V229: a-U residue 83 of 11,998, a-U' created 1 of 326. EXPECTED: a-U, a-U'."),
 ("V229-S13-D193 R8 -> the hold sentence is dropped from the swap toast",
  TOAST, TOAST.replace(" Your injury plan holds this one at RPE 7.", ""), G_FLOOR,
  "NAMED TRIP: row G6a (" + R193 + " Amendment 2 S13 -> (k), a V230 row per " + R194 + " R3'; at V229 G6a is re-keyed under D193 R8 per " + R194 + " Amendment 1 (r): every moved toast ends in the hold sentence, count pinned). Printed by builder at V229: moved 1,243 (pin 1,243), not a hold variant on a hand clamp pair 1,243. EXPECTED: G6a only."),
 ("V229-S16-D193 R3 -> the kept pre-hold dose is printed as the card instead of the plan's held dose",
  PRINT, "      if(_fi&&_fi.name===to){ _held=(/RPE/.test(_preF)&&_fi.detail!==_preF); item.detail=_preF; }\n", G_FLOOR,
  "NAMED TRIP: rows G3a, G3c, G3d, G3e, G3f (" + R193 + " Amendment 2 S16 -> (a) or (i); at V229 these D177 rows are re-keyed under D193 Amendment 4 per " + R194 + " Amendment 1 (r) and read the dose beneath the hold). Printed by builder at V229: beneath-the-hold misses G3a 767, G3c 106, G3d 263, G3e 199, G3f 199. EXPECTED: G3a, G3c, G3d, G3e, G3f."),
]

if OUT.exists():
    sys.exit('REFUSED: ' + str(OUT) + ' already exists; this script writes the spec once and never overwrites it')
src = CAND.read_text(encoding='utf-8')
rows = []
for name, anchor, repl, gate, note in M:
    tag = name.split(' ')[0]
    n = src.count(anchor)
    if n != 1: sys.exit('ABORT (nothing written): ' + tag + ' anchor count ' + str(n))
    if repl == anchor: sys.exit('ABORT (nothing written): ' + tag + ' replacement equals anchor')
    if not (ROOT / 'tests' / gate).exists(): sys.exit('ABORT (nothing written): ' + tag + ' gate missing ' + gate)
    rows.append({'name': name, 'anchor': anchor, 'replacement': repl, 'gate': gate, 'note': note})
old = ROOT / 'tests' / 'sabotage' / 'v228_d193.json'
if old.exists():
    clash = {r['name'] for r in rows} & {r['name'] for r in json.loads(old.read_text(encoding='utf-8'))}
    if clash: sys.exit('ABORT (nothing written): names collide with v228_d193.json: ' + ', '.join(sorted(clash)))
with open(OUT, 'x', encoding='utf-8') as fh:
    json.dump(rows, fh, ensure_ascii=False, indent=1); fh.write('\n')
print('wrote ' + str(OUT) + ' (' + str(len(rows)) + ' mutations)')
