# V228 slice 10b: tests/sabotage/v228_d192.json (S1-D192) + D192 clause on MANNY_DIGEST_BY_VERSION[228]'s comment.
import json, sys
ROOT = '/Users/CanasBangin/Desktop/TheBig6V2'
html = open(ROOT + '/index.html', encoding='utf-8').read()
A = 'const hit=list.filter(e=>e&&e.to===name).pop();'
assert html.count(A) == 1, ('anchor', html.count(A))
spec = [{
  "name": "S1-D192 swapOriginOf -> first record whose `to` is the card's name ([0]): the chip names the grid lift, not the lift that just left",
  "anchor": A,
  "replacement": 'const hit=list.filter(e=>e&&e.to===name)[0];',
  "gate": "gates/g228_d192_undokey.js",
  "note": "NAMED TRIP: d2-CHIP and d2-UNDO on the A>B>C>B, hop4 revisit and hop5 U_d' classes (gate builder, no argv[3], git 5ce31e8 fallback: 448/2,201 each; walk strict A>B>C>B 96/96, each hop4 revisit shape 40/40, hop5 191/1,000, the PIN). EXPECTED: d2-CHIP, d2-UNDO; d2-BOOT-U, INFO and d2-MANNY stay green by design (proof the spec hits the chip key, not undo at large). g227 row (d) does not trip by design; its INFO D192 line prints 28 wrong again."
}]
p = ROOT + '/tests/sabotage/v228_d192.json'
import os
assert not os.path.exists(p), 'spec exists'
open(p, 'w', encoding='utf-8').write(json.dumps(spec, indent=1, ensure_ascii=False) + '\n')
h = ROOT + '/tests/harness.js'
s = open(h, encoding='utf-8').read()
lines = [l for l in s.split('\n') if l.startswith('MANNY_DIGEST_BY_VERSION[228] = MANNY_DIGEST_BY_VERSION[227];')]
assert len(lines) == 1, len(lines)
L = lines[0]
assert s.count(L) == 1 and L.endswith('before this row)'), 'row anchor'
add = "; D192 P-UNDOKEY: one read-side line (swapOriginOf), reaches no build; ruled UNMOVED (tests/measure/v228_rulings/d192_undokey_ruling.md section 5: \"D192 adds a clause to that row's comment, no new row, no new digest\"; 0ac7da6b1691a8e1 printed by g228_d192_undokey.js d2-MANNY on the V228 working tree, swapOriginOf reached 0 times by buildProgram and refreshProgram)"
s = s.replace(L, L + add)
open(h, 'w', encoding='utf-8').write(s)
print('spec written, harness row 228 comment extended')
