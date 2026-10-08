#!/usr/bin/env python3
# V236 slice 3 of 4 (D219 marker, D218 `.logged` CSS, the V182 comment, the version bump), ruling
# tests/measure/v236_rulings/v236_ruling_d218_d219.md (incl. "Session notes"). Requires slices 1 and 2
# (tests/edits/v236_s1_regime.py, v236_s2_button.py) already applied.
# Edits: (1) updateRPEDisplay sets data-touched="1" on #log_rpe; (2) the Log button's inline style moves into
# a #cardioLogBtn rule beside `.ex-log .ex-logbtn`, plus #cardioLogBtn.logged on the --run tokens; (3) the
# stale V182 wheel comment says what is true from V236; (4) ia-version 235 -> 236, the last replacement.
# Every anchor asserted count==1 before any write; all or nothing.
import sys

PATH = '/Users/CanasBangin/Desktop/TheBig6V2/index.html'
src = open(PATH, encoding='utf-8').read()

if src.count('function logCardio(){') != 1 or src.count('function cardioLive(dayKey){') != 1:
    sys.exit('ABORT: slices 1 and 2 not present')
for tok in ('#cardioLogBtn{', '#cardioLogBtn.logged', 'dataset.touched = ', "dataset.touched='1'"):
    if src.count(tok) != 0:
        sys.exit('ABORT: %r already present (%d)' % (tok, src.count(tok)))

INLINE = ' style="width:100%;margin-top:12px;padding:12px;border-radius:6px;letter-spacing:0.08em"'
R = []

# ── Edit 1: D219, the slider marks itself touched ───────────────────────────
R.append((
"""function updateRPEDisplay(val) {
  const el = document.getElementById('rpeDisplay');
  if(el) el.textContent = val + ' — ' + (RPE_LABELS[+val]||'');
}
""",
"""function updateRPEDisplay(val) {
  const el = document.getElementById('rpeDisplay');
  if(el) el.textContent = val + ' — ' + (RPE_LABELS[+val]||'');
  // V236 (D219): a moved slider is a claimed RPE. Its only caller is the range's own oninput,
  // an attribute handler that runs before the persist listener openDetail adds, so the marker
  // is on the node when persistLogFields reads it. A render never calls this: the thumb
  // resting at 5 stays unmarked and stores no number.
  const r = document.getElementById('log_rpe');
  if(r) r.dataset.touched = '1';
}
"""))

# ── Edit 2: the Log button's CSS and its logged state ───────────────────────
R.append((
""".ex-log .ex-logbtn{width:100%;margin-top:12px;padding:12px;border-radius:6px;letter-spacing:0.08em;}
""",
""".ex-log .ex-logbtn{width:100%;margin-top:12px;padding:12px;border-radius:6px;letter-spacing:0.08em;}
/* V236 (D218): the cardio card's Log button, the lift's full-width Log. Logged reads in the run green the logged
   tag (.t-logged) and a logged lift's inputs use; the inset ring is the border without moving the button. */
#cardioLogBtn{width:100%;margin-top:12px;padding:12px;border-radius:6px;letter-spacing:0.08em;}
#cardioLogBtn.logged{background:var(--run-dim);color:var(--run);box-shadow:inset 0 0 0 1px var(--run);}
"""))
R.append((
'onclick="logCardio()"' + INLINE + '>',
'onclick="logCardio()">'))

# ── Edit 3: the V182 wheel comment, true from V236 ──────────────────────────
R.append((
"""// One writer for all three wheel sites. Each wheel drives a HIDDEN input that keeps
// the field's existing id, so persistLogFields and both listener arrays are untouched
// (D3) — the wheel dispatches 'input' on that hidden node and the V131 chain fires
// exactly as it did for a typed box.
""",
"""// One writer for all three wheel sites. Each wheel drives a HIDDEN input that keeps
// the field's existing id, and a settle writes that node and dispatches 'input' on it.
// From V236 (D218) the listeners on those ids persist only once the card is LIVE
// (cardioLive): on a DRAFT card a settle moves the node and the derived readout and
// nothing else, and the Log tap (logCardio), Done or Skip commits the form through
// persistLogFields.
"""))

# ── Edit 4: the version bump, last ──────────────────────────────────────────
R.append((
'<meta name="ia-version" content="235">',
'<meta name="ia-version" content="236">'))

for i, (old, new) in enumerate(R):
    n = src.count(old)
    if n != 1:
        sys.exit('ABORT: anchor %d count=%d\n%s' % (i, n, old[:160]))
out = src
for old, new in R:
    out = out.replace(old, new, 1)

assert out.count(INLINE) == 0
assert out.count('#cardioLogBtn{') == 1 and out.count('#cardioLogBtn.logged{') == 1
assert out.count('<meta name="ia-version" content="236">') == 1
open(PATH, 'w', encoding='utf-8').write(out)
print('OK: %d replacements written' % len(R))
