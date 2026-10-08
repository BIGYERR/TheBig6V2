#!/usr/bin/env python3
# V236 slice 4, edits 1 and 3 (ruling tests/measure/v236_rulings/v236_ruling_d218_d219.md).
#  1. index.html: the _iawCommit comment's second line says what is true from V236 (D218). Comment only.
#  3. tests/sabotage/v221_d179.json: the two `S6-D179 wheel flush` mutations lost their anchor when slice 2
#     rewrote handleDayStatus's flush line into `const _commit=…; if(_commit) iaWheelFlush(…)`. Each is re-anchored
#     on that line with its intent kept: (a) the flush call is dropped; (b) the flush runs on undo taps too.
#     Names, gate and notes are unchanged.
# Every anchor in both files is asserted count==1 before either file is written; all or nothing.
import sys, json

HTML = '/Users/CanasBangin/Desktop/TheBig6V2/index.html'
SPEC = '/Users/CanasBangin/Desktop/TheBig6V2/tests/sabotage/v221_d179.json'
html = open(HTML, encoding='utf-8').read()
spec = open(SPEC, encoding='utf-8').read()

H = [(
"""// Commit on scroll-settle, never per frame. Writes the hidden node then dispatches
// 'input' so the existing persistence listener does the saving (D3).
""",
"""// Commit on scroll-settle, never per frame. Writes the hidden node then dispatches
// 'input'; from V236 (D218) the listener saves only on a LIVE card (cardioLive).
""")]

OLD_A = "if(statusOf(currentWeek,dayKey)!==status) iaWheelFlush(document.getElementById('detailOverlay'));"
NEW_A = "if(_commit) iaWheelFlush(document.getElementById('detailOverlay'));"
OLD_B = "if(statusOf(currentWeek,dayKey)!==status) iaWheelFlush("
NEW_B = "if(_commit) iaWheelFlush("
# JSON text forms (each anchor as its own complete JSON string literal, closing quote included)
S = [(json.dumps(OLD_A, ensure_ascii=False), json.dumps(NEW_A, ensure_ascii=False)),
     (json.dumps(OLD_B, ensure_ascii=False), json.dumps(NEW_B, ensure_ascii=False))]

# The new anchors must apply exactly once in the candidate (the runner's own rule).
for a in (NEW_A, NEW_B):
    if html.count(a) != 1:
        sys.exit('ABORT: new anchor %r count=%d in index.html' % (a, html.count(a)))
for i, (old, new) in enumerate(H):
    if html.count(old) != 1:
        sys.exit('ABORT: html anchor %d count=%d' % (i, html.count(old)))
for i, (old, new) in enumerate(S):
    if spec.count(old) != 1:
        sys.exit('ABORT: spec anchor %d count=%d: %s' % (i, spec.count(old), old))

html2 = html
for old, new in H:
    html2 = html2.replace(old, new, 1)
spec2 = spec
for old, new in S:
    spec2 = spec2.replace(old, new, 1)

# The spec still parses, the two rows carry the new anchors, everything else in it is unchanged.
a, b = json.loads(spec), json.loads(spec2)
assert len(a) == len(b)
moved = [(x['name'], y['anchor']) for x, y in zip(a, b) if x != y]
assert [m[0] for m in moved] == [
    'S6-D179 wheel flush -> the flush call is dropped: a wheel still inside its 90 ms settle window is not committed before persistLogFields',
    'S6-D179 wheel flush -> the flush runs on undo taps too: an undo tap commits a coasting wheel early'], moved
for x, y in zip(a, b):
    if x != y:
        assert {k: v for k, v in x.items() if k != 'anchor'} == {k: v for k, v in y.items() if k != 'anchor'}
        assert html2.count(y['anchor']) == 1 and html2.replace(y['anchor'], y['replacement']) != html2

open(HTML, 'w', encoding='utf-8').write(html2)
open(SPEC, 'w', encoding='utf-8').write(spec2)
for n, an in moved:
    print('re-anchored:', n, '| anchor', json.dumps(an))
print('OK: 1 html replacement, 2 spec replacements written')
