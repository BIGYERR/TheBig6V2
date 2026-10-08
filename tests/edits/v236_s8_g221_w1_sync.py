#!/usr/bin/env python3
# V236 slice 8: g221_d179 W1, setup only, per tests/measure/v236_rulings/v236_ruling_d218_d219.md, section
# "Added to 'Existing rows that flip' before the final run". From VER >= 236 wheelCase copies the rendered
# #cardioSwapWrap data-* onto the retaining stub (as on device, where closeDetail only drops .open and the wrap keeps its
# data), so cardioLive reads the run sport and a Done entry is LIVE; the stub's dataset is put back after each case.
# The sync is factored into wrapSync(), which wheelCaseV236 (slice 5, W2) now calls too. VER <= 235: wheelCase runs
# exactly as before (ws is null, no sync, no restore). W1's claim, name, description and tally are unchanged.
# Every anchor is asserted count == 1 before any write; all or nothing.
#   python3 tests/edits/v236_s8_g221_w1_sync.py            writes the gate in place
#   python3 tests/edits/v236_s8_g221_w1_sync.py --out DIR  writes DIR/tests/gates/g221_d179_donenav.js (dry run)
import os, sys

ROOT = '/Users/CanasBangin/Desktop/TheBig6V2'
REL = 'tests/gates/g221_d179_donenav.js'
OUT = None
if len(sys.argv) == 3 and sys.argv[1] == '--out':
    OUT = sys.argv[2]
elif len(sys.argv) != 1:
    sys.exit('usage: v236_s8_g221_w1_sync.py [--out DIR]')

R = []

# 1. header: W1's setup note (comment only)
R.append((
"""//   W1   a wheel scrolled 9:30 -> 10:30 and tapped inside its 90 ms window saves 10:30 (Done, Skip; layout loss on close).
""",
"""//   W1   a wheel scrolled 9:30 -> 10:30 and tapped inside its 90 ms window saves 10:30 (Done, Skip; layout loss on close).
//        V236 (D218), setup only: from VER 236 the case copies the rendered #cardioSwapWrap data-* onto the stub
//        (wrapSync), so the card's regime reads the run sport as on device; the claim is unchanged.
"""))

# 2. wrapSync helper + wheelCase syncs from VER 236
R.append((
"""function wheelCase(layoutLoss, st, undo){
  const [w, d] = runDay; E.fresh(w, d);
  if(undo){ E.open(d); E.tap(d, st); ev('popClose()'); }
  E.open(d); els.log_run_pace.value = W_SEED;
  const { wh, cols } = fakeWheel(layoutLoss); E.cols = cols;
""",
"""// V236 (D218): the card's regime reads #cardioSwapWrap's data-planned / data-active, which this retaining stub never
// parses. wrapSync().sync() copies them from the rendered markup after an open (what the browser's node carries; on device
// closeDetail only drops .open and the wrap keeps them); restore() puts the stub's dataset back after the case.
function wrapSync(){
  const wrap = E.IA.ctx.document.getElementById('cardioSwapWrap'), keep = Object.assign({}, wrap.dataset);
  return { wrap,
    sync:() => { const m = (els.detailBody.innerHTML || '').match(/<div\\b[^>]*\\sid="cardioSwapWrap"[^>]*>/);
      if(!m) throw new Error('no #cardioSwapWrap in the rendered day'); let a; const re = /\\sdata-([a-z]+)="([^"]*)"/g; while((a = re.exec(m[0]))) wrap.dataset[a[1]] = a[2]; },
    restore:() => { for(const k of Object.keys(wrap.dataset)) delete wrap.dataset[k]; Object.assign(wrap.dataset, keep); } };
}
function wheelCase(layoutLoss, st, undo){
  const [w, d] = runDay; E.fresh(w, d);
  const ws = VER >= 236 ? wrapSync() : null;   // V236 (D218): W1 setup only; VER <= 235 never syncs
  if(undo){ E.open(d); if(ws) ws.sync(); E.tap(d, st); ev('popClose()'); }
  E.open(d); els.log_run_pace.value = W_SEED;
  if(ws) ws.sync();
  const { wh, cols } = fakeWheel(layoutLoss); E.cols = cols;
"""))

R.append((
"""  E.tap(d, st); const atTap = readPace(w, d), open = E.OPEN(); advance(200); const later = readPace(w, d);
  E.cols = []; ev('popClose()');
  return { seeded, pending, atTap, later, open };
}
""",
"""  E.tap(d, st); const atTap = readPace(w, d), open = E.OPEN(); advance(200); const later = readPace(w, d);
  E.cols = []; ev('popClose()');
  if(ws) ws.restore();
  return { seeded, pending, atTap, later, open };
}
"""))

# 3. wheelCaseV236 calls the shared helper (behaviour unchanged)
R.append((
"""// V236 (D218): the undo case per its seed, VER >= 236 only. The card's regime reads #cardioSwapWrap's data-planned /
// data-active, which this retaining stub never parses, so after each open they are copied from the rendered markup (what
// the browser's node carries) and the stub's dataset is put back after the case. The setup's Done is a commit tap, so the
""",
"""// V236 (D218): the undo case per its seed, VER >= 236 only. The wrap's sport is synced after each open and put back after
// the case through wrapSync, as in wheelCase. The setup's Done is a commit tap, so the
"""))

R.append((
"""  const [w, d] = runDay, wrap = E.IA.ctx.document.getElementById('cardioSwapWrap'), keep = Object.assign({}, wrap.dataset);
  const syncWrap = () => { const m = (els.detailBody.innerHTML || '').match(/<div\\b[^>]*\\sid="cardioSwapWrap"[^>]*>/);
    if(!m) throw new Error('no #cardioSwapWrap in the rendered day'); let a; const re = /\\sdata-([a-z]+)="([^"]*)"/g; while((a = re.exec(m[0]))) wrap.dataset[a[1]] = a[2]; };
""",
"""  const [w, d] = runDay, ws = wrapSync(), wrap = ws.wrap, syncWrap = ws.sync;
"""))

R.append((
"""  for(const k of Object.keys(wrap.dataset)) delete wrap.dataset[k]; Object.assign(wrap.dataset, keep);
  return { seed, seeded, pending, atTap, later, hidden, logged, open };
""",
"""  ws.restore();
  return { seed, seeded, pending, atTap, later, hidden, logged, open };
"""))

src = open(os.path.join(ROOT, REL), encoding='utf-8').read()
if 'function wrapSync(' in src:
    sys.exit('ABORT: wrapSync already present')
for i, (old, new) in enumerate(R):
    n = src.count(old)
    if n != 1:
        sys.exit('ABORT: anchor %d count=%d\n%s' % (i, n, old[:200]))
out = src
for old, new in R:
    out = out.replace(old, new, 1)
assert out.count('function wrapSync(') == 1 and out.count('ws.restore()') == 2
dst = os.path.join(OUT, REL) if OUT else os.path.join(ROOT, REL)
os.makedirs(os.path.dirname(dst), exist_ok=True)
open(dst, 'w', encoding='utf-8').write(out)
print('wrote %s (%d replacements)\nOK' % (dst, len(R)))
