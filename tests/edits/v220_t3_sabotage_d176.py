#!/usr/bin/env python3
# V220 test slice T3: tests/sabotage/v220_d176.json, one mutation against D176 (P-BARERX), schema of
# tests/sabotage/v216_d156.json ({name, anchor, replacement, gate, note}). The anchor is the whole V220
# _dispDetail line (code only, no trailing comment); the replacement is the V219 form of the same line.
# The en-dash inside the regex is a literal U+2013 (bytes e2 80 93), asserted below. Refuses to overwrite.
import sys, os, json
F = '/Users/CanasBangin/Desktop/TheBig6V2/tests/sabotage/v220_d176.json'
if os.path.exists(F):
    print('ABORT: %s exists' % F); sys.exit(3)
ANCHOR = r"const _dispDetail=(_ssRounds!=null&&!i._skipped)?_stripLeadingSets(i.detail||'').replace(/^\d+(\s*[–-]\s*\d+)?$/,'$& reps'):(i.detail||'');"
REPL   = r"const _dispDetail=(_ssRounds!=null&&!i._skipped)?_stripLeadingSets(i.detail||''):(i.detail||'');"
assert ANCHOR.encode('utf-8').count(b'[\xe2\x80\x93-]') == 1, 'en-dash is not a literal U+2013'
assert ANCHOR.count('\\d') == 2 and ANCHOR.count('\\s') == 2, 'regex backslashes'
ROWS = [{
  "name": "S1-D176 -> the ' reps' append is dropped: a bare count inside a round block renders as a bare number again (the V219 _dispDetail line)",
  "anchor": ANCHOR,
  "replacement": REPL,
  "gate": "gates/g190_rounds.js",
  "note": "NAMED TRIP in g190_rounds.js rows G11f hand table (want 10 reps / 8–12 reps, got 10 / 8–12) and G11f lattice "
          "(348 of 1,468 unique numeric-rounds sections disagree on the V220 tree copy); G11f floor keeps passing, it counts "
          "the population, not the render. Builder saw PASS 47 FAIL 2 on a scratch tree stamped 220. Needs ia-version >= 220: "
          "below 220 G11f SKIPs and G11b (the pre-D176 contract) runs, so the mutation survives by design. The anchor is the "
          "same line sabotage/v190.json M4 anchors; the two mutations never apply together.",
}]
txt = json.dumps(ROWS, ensure_ascii=False, indent=1) + '\n'
back = json.loads(txt)
assert back[0]['anchor'] == ANCHOR and back[0]['replacement'] == REPL and back[0]['anchor'] != back[0]['replacement']
open(F, 'w', encoding='utf-8').write(txt)
print('written ' + F)
