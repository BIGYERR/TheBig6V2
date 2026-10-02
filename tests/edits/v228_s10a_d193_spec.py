import json, pathlib, sys
src = pathlib.Path('/Users/CanasBangin/Desktop/TheBig6V2/index.html').read_text(encoding='utf-8')
G = 'gates/g228_d193_cueword.js'
STRIP = "/ — hold RPE 7, (?:two|three) in the tank$/"
FENCE = r"if(/\byards?\b|\byd\b|\bmeters?\b|\bsec\b|\bmin\b|\bhold\b|max time/i.test(d)) return null;"
M = [
 {"name": "S1-D193 R1 -> INJ_CAP_CUE back to the V227 wording: the cue says two in the tank again",
  "anchor": "const INJ_CAP_CUE=' — hold RPE 7, three in the tank';",
  "replacement": "const INJ_CAP_CUE=' — hold RPE 7, two in the tank';",
  "gate": G,
  "note": "NAMED TRIP: row c-LIT (word \"two\", want \"three\" = 10 − 7). Also b-ONECLASS (L9 2/9, L432 165/432, home_basic 48/108 against SUBST(V227)) and f-STORED (the capped target Reverse lunge (KB) re-cues \"two\"). EXPECTED: c-LIT, b-ONECLASS, f-STORED; f-STRIP and g-COUPLE stay green."},
 {"name": "S2-D193 R4 -> _stripCapCue forgets the retired wording: only \"three\" is stripped, a V227-stored \"two\" cue rides through a swap",
  "anchor": STRIP,
  "replacement": "/ — hold RPE 7, (?:three) in the tank$/",
  "gate": G,
  "note": "NAMED TRIP: row f-STRIP (hand strings: both \"two\" strips wrong) and f-STORED (mario knee/wa W5 thu Step-ups (KB), V227 grid at W6: the capped target keeps \"two in the tank\", RPE named so no re-append; the uncapped target carries the old cue). EXPECTED: f-STRIP, f-STORED; c-LIT, b-ONECLASS, g-COUPLE stay green."},
 {"name": "S3-D193 R4 -> _stripCapCue loses its end anchor: a cue-shaped phrase mid-detail is cut off",
  "anchor": STRIP,
  "replacement": "/ — hold RPE 7, (?:two|three) in the tank/",
  "gate": G,
  "note": "NAMED TRIP: row f-STRIP (hand near misses `3×10 — hold RPE 7, two in the tank, 2 min rest` and the `three` twin are stripped; identity is the rule on every non-cue detail). EXPECTED: f-STRIP only; c-LIT, b-ONECLASS, f-STORED, g-COUPLE stay green."},
 {"name": "S4-D193 R6 -> _addRxKind stops refusing \"hold\": a cued detail reads as a rep dose on the add path",
  "anchor": FENCE,
  "replacement": FENCE.replace(r"\bhold\b|", "", 1),
  "gate": G,
  "note": "NAMED TRIP: row g-COUPLE (_addRxKind of `3×10 — hold RPE 7, two in the tank` / `three` and the `2×10 each` twins returns \"reps\", want null). EXPECTED: g-COUPLE only; c-LIT, b-ONECLASS, f-STRIP, f-STORED stay green."},
]
for m in M:
    n = src.count(m["anchor"])
    if n != 1: sys.exit('REFUSED: anchor count %d for %s' % (n, m["name"][:20]))
    if m["replacement"] == m["anchor"]: sys.exit('REFUSED: no-op ' + m["name"][:20])
    if src.replace(m["anchor"], m["replacement"], 1) == src: sys.exit('REFUSED: no-op after replace ' + m["name"][:20])
out = pathlib.Path('/Users/CanasBangin/Desktop/TheBig6V2/tests/sabotage/v228_d193.json')
out.write_text(json.dumps(M, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
back = json.loads(out.read_text(encoding='utf-8'))
assert [b["anchor"] for b in back] == [m["anchor"] for m in M]
print('OK wrote', out, len(M), 'mutations; anchors count==1; em-dash literal:', '—' in out.read_text(encoding='utf-8'), '| \\u escapes:', '\\u' in out.read_text(encoding='utf-8'))
