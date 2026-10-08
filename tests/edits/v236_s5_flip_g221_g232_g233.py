#!/usr/bin/env python3
# V236 slice 5: the existing gate rows D218 P-LOGBUTTON flips, ruling tests/measure/v236_rulings/v236_ruling_d218_d219.md
# ("Existing rows that flip", concurred by Mario 2026-10-08, with its Session notes). One edit per file:
#   tests/gates/g221_d179_donenav.js   W2 restated per its seed: stored 9:30 (LIVE) reads 9:30 at the undo tap and the
#                                      wheel's own settle stores 10:30; DOM-only 9:30 (DRAFT) stores nothing, hidden 10:30.
#   tests/gates/g232_d199_runwheel.js  D202-move: move-free / -fixed-mins / -derived / -fixed-mi / -back become hidden-node
#                                      claims plus a Log tap storing them; move-seedonly unchanged.
#   tests/gates/g233_d207_bikewheel.js D207-move: move-45 (and with it move-progress, move-haslog, which read its store)
#                                      needs a Log tap; move-seedonly, move-peg unchanged.
# Form (the V235 pattern): row names and keys stay; each flipped claim splits on ia-version, VER <= 235 runs today's code
# byte for byte, VER >= 236 asserts the D218 claim with hand values. A "Log tap" is the rendered #cardioLogBtn's own
# onclick, read from the markup and evaluated, so a missing button fails the claim.
# Every anchor is asserted count == 1 in its file before any write; all or nothing.
#   python3 tests/edits/v236_s5_flip_g221_g232_g233.py            writes the three gates in place
#   python3 tests/edits/v236_s5_flip_g221_g232_g233.py --out DIR  writes DIR/tests/gates/<gate> instead (dry run)
import os, sys

ROOT = '/Users/CanasBangin/Desktop/TheBig6V2'
OUT = None
if len(sys.argv) == 3 and sys.argv[1] == '--out':
    OUT = sys.argv[2]
elif len(sys.argv) != 1:
    sys.exit('usage: v236_s5_flip_g221_g232_g233.py [--out DIR]')

EDITS = {}

# ── g221_d179_donenav.js: W2 ─────────────────────────────────────────────────────────────────────────────────────
EDITS['tests/gates/g221_d179_donenav.js'] = [
(
"""//   W2   an undo tap inside the window is not flushed; the wheel's own settle commits later (neg ctl).
""",
"""//   W2   an undo tap inside the window is not flushed; the wheel's own settle commits later (neg ctl).
//        V236 (D218; tests/measure/v236_rulings/v236_ruling_d218_d219.md, "Existing rows that flip"): from VER 236 the
//        settle stores only on a LIVE day, so W2 runs per its seed (wheelCaseV236): stored 9:30 reads 9:30 at the undo
//        tap and the settle stores 10:30; a DOM-only 9:30 stores nothing at the tap or after, the hidden node reads
//        10:30. VER <= 235 keeps the claim above on wheelCase unchanged.
"""),
(
"""  W2:'W2 undo tap 40 ms into the window is not flushed: ia_logs_ reads ' + W_SEED + ' at the tap, the wheel settles ' + W_SETTLED + ' on its own, day stays open (neg ctl)',
""",
"""  W2:'W2 undo tap 40 ms into the window is not flushed: ia_logs_ reads ' + W_SEED + ' at the tap, the wheel settles ' + W_SETTLED + ' on its own, day stays open (neg ctl; from VER 236, D218, per seed: stored ' + W_SEED + ' reads ' + W_SEED + ' at the tap and settles ' + W_SETTLED + ', DOM-only ' + W_SEED + ' stores nothing and the hidden node reads ' + W_SETTLED + ')',
"""),
(
"""  E.cols = []; ev('popClose()');
  return { seeded, pending, atTap, later, open };
}
""",
"""  E.cols = []; ev('popClose()');
  return { seeded, pending, atTap, later, open };
}
// V236 (D218): the undo case per its seed, VER >= 236 only. The card's regime reads #cardioSwapWrap's data-planned /
// data-active, which this retaining stub never parses, so after each open they are copied from the rendered markup (what
// the browser's node carries) and the stub's dataset is put back after the case. The setup's Done is a commit tap, so the
// hidden node is first set to '' (an untouched card renders it blank; the stub would otherwise carry the previous case's
// 10:30 into that commit). seed 'store': the entry then holds run_pace 9:30 (LIVE); seed 'dom': 9:30 sits on the hidden
// node only (DRAFT).
function wheelCaseV236(st, seed){
  const [w, d] = runDay, wrap = E.IA.ctx.document.getElementById('cardioSwapWrap'), keep = Object.assign({}, wrap.dataset);
  const syncWrap = () => { const m = (els.detailBody.innerHTML || '').match(/<div\\b[^>]*\\sid="cardioSwapWrap"[^>]*>/);
    if(!m) throw new Error('no #cardioSwapWrap in the rendered day'); let a; const re = /\\sdata-([a-z]+)="([^"]*)"/g; while((a = re.exec(m[0]))) wrap.dataset[a[1]] = a[2]; };
  E.fresh(w, d); E.open(d); syncWrap(); els.log_run_pace.value = ''; E.tap(d, st); ev('popClose()');
  if(seed === 'store'){ const lk = ev('logKey(' + w + ",'" + d + "')"), logs = JSON.parse(LS.getItem('ia_logs_measure') || '{}');
    logs[lk] = Object.assign({}, logs[lk], { run_pace:W_SEED }); LS.setItem('ia_logs_measure', JSON.stringify(logs)); }
  E.open(d); syncWrap(); els.log_run_pace.value = W_SEED;
  const { wh, cols } = fakeWheel(false); E.cols = cols;
  ev('iaWheelInit')({ querySelectorAll:s => s === '.iaw' ? [wh] : [] }); advance(40);
  const seeded = [cols[0].scrollTop / WROW, cols[1].scrollTop / WROW];
  cols[0].scrollTop = W_TARGET_ROW * WROW; (cols[0]._lis.scroll || []).forEach(f => f()); advance(40);
  const pending = [...E.T.values()].some(t => t.kind === 'timeout');
  E.tap(d, st); const atTap = readPace(w, d), open = E.OPEN(); advance(200); const later = readPace(w, d), hidden = els.log_run_pace.value, logged = wrap.dataset.logged;
  E.cols = []; ev('popClose()');
  for(const k of Object.keys(wrap.dataset)) delete wrap.dataset[k]; Object.assign(wrap.dataset, keep);
  return { seed, seeded, pending, atTap, later, hidden, logged, open };
}
"""),
(
"""  for(const st of ['complete', 'skipped']){ const r = wheelCase(false, st, true);
    rec('W2', seededOk(r) && r.atTap === W_SEED && r.later === W_SETTLED && r.open, 'undo ' + st + ' ' + JSON.stringify(r)); }
}
row('W1', () => runDay ? tally('W1', 4) : [false, 'no training day renders a log_run_pace wheel']);
row('W2', () => runDay ? tally('W2', 2) : [false, 'no training day renders a log_run_pace wheel']);
""",
"""  if(VER <= 235) for(const st of ['complete', 'skipped']){ const r = wheelCase(false, st, true);
    rec('W2', seededOk(r) && r.atTap === W_SEED && r.later === W_SETTLED && r.open, 'undo ' + st + ' ' + JSON.stringify(r)); }
  // V236 (D218): per seed. Stored 9:30 is LIVE: the undo tap saves the form unflushed (9:30), the settle stores 10:30.
  // DOM-only 9:30 is DRAFT: nothing reaches run_pace at the tap or after; the settle lands on the hidden node, 10:30.
  else for(const st of ['complete', 'skipped']) for(const seed of ['store', 'dom']){ const r = wheelCaseV236(st, seed);
    const want = seed === 'store' ? r.atTap === W_SEED && r.later === W_SETTLED : r.atTap === '' && r.later === '' && r.hidden === W_SETTLED;
    rec('W2', seededOk(r) && want && r.open, 'undo ' + st + ' ' + JSON.stringify(r)); }
}
row('W1', () => runDay ? tally('W1', 4) : [false, 'no training day renders a log_run_pace wheel']);
row('W2', () => runDay ? tally('W2', VER >= 236 ? 4 : 2) : [false, 'no training day renders a log_run_pace wheel']);
"""),
]

# ── g232_d199_runwheel.js: D202-move ─────────────────────────────────────────────────────────────────────────────
EDITS['tests/gates/g232_d199_runwheel.js'] = [
(
"""//   D202-move   a moved fixed wheel commits two-decimal minutes / miles and persistLogFields stores them; away and back to
//               the seed face commits; a settle on the seed face alone writes nothing; doseDerived reads the stored value.
""",
"""//   D202-move   a moved fixed wheel commits two-decimal minutes / miles and persistLogFields stores them; away and back to
//               the seed face commits; a settle on the seed face alone writes nothing; doseDerived reads the stored value.
//               V236 (D218; tests/measure/v236_rulings/v236_ruling_d218_d219.md, "Existing rows that flip"): from VER 236
//               the card is DRAFT until it holds a run number, so move-free, move-fixed-mins, move-derived, move-fixed-mi
//               and move-back assert the hidden node with no entry, then a tap on the rendered Log button (its own
//               onclick) storing it; VER <= 235 keeps the claims as written. move-seedonly does not split.
"""),
(
"""a settle on the seed face alone writes nothing; doseDerived reads the stored value (15.5 min / 2 mi = 7:45/mi)',
""",
"""a settle on the seed face alone writes nothing; doseDerived reads the stored value (15.5 min / 2 mi = 7:45/mi) (from VER 236, D218: the move writes the hidden node only and a Log tap stores it)',
"""),
(
"""  const ddText = () => (C.els.doseDerived.innerHTML || '').replace(/<[^>]+>/g, ' ').replace(/\\s+/g, ' ').trim();
  step('move-time', () => {
""",
"""  const ddText = () => (C.els.doseDerived.innerHTML || '').replace(/<[^>]+>/g, ' ').replace(/\\s+/g, ' ').trim();
  // V236 (D218): a DRAFT card's wheel writes its hidden node and repaints the readout, nothing else; the Log tap is the
  // rendered #cardioLogBtn's own onclick. Each split step returns early from VER 236; VER <= 235 runs the code below it.
  const hidv = id => C.els[id] ? C.els[id].value : null;
  const tapLog = () => { const b = (C.els.detailBody.innerHTML.match(/<button\\b[^>]*\\sid="cardioLogBtn"[^>]*>/) || [])[0], oc = b && (b.match(/\\sonclick="([^"]*)"/) || [])[1];
    if(!oc) throw new Error('no rendered #cardioLogBtn with an onclick'); C.ev(oc); C.advance(500); };
  const moveTimeV236 = () => {
    C.ctx.__FORCE = DOSES.time; C.setLog(HW, HD, null); C.open(HW, HD);
    C.move(need('log_run_dist'), 0, '2');
    const p1 = C.entry(HW, HD), h1 = { mins:hidv('log_run_mins'), dist:hidv('log_run_dist') }, d1 = ddText(); tapLog(); const e1 = C.entry(HW, HD) || {};
    cj.push(['move-free', p1 === null && h1.mins === '' && h1.dist === '2.00' && d1.includes(pace(15, 2)) && /assuming planned 15 min/.test(d1) && (e1.run_mins || '') === '' && e1.run_dist === '2.00',
      'free miles to 2: entry before Log ' + J(p1) + ', hidden ' + J(h1) + ', derived "' + d1 + '"; Log stores ' + J({ run_mins:e1.run_mins, run_dist:e1.run_dist }) + ' (want null, {"mins":"","dist":"2.00"}, ' + pace(15, 2) + ', assuming planned 15 min; {"run_mins":"","run_dist":"2.00"})']);
    C.setLog(HW, HD, null); C.open(HW, HD);
    C.move(need('log_run_dist'), 0, '2'); C.move(need('log_run_mins'), 2, '30');
    const p2 = C.entry(HW, HD), h2 = hidv('log_run_mins'), d2 = ddText(); tapLog(); const e2 = C.entry(HW, HD) || {};
    cj.push(['move-fixed-mins', p2 === null && h2 === '15.50' && e2.run_mins === '15.50' && /^\\d+\\.\\d\\d$/.test(e2.run_mins), 'fixed 0:15:00 -> 0:15:30: entry before Log ' + J(p2) + ', hidden run_mins ' + J(h2) + '; Log stores run_mins ' + J(e2.run_mins) + ' (want null, "15.50"; "15.50", two decimals)']);
    const dd = tryv(() => C.ev('doseDerived')(DOSES.time, { mins:e2.run_mins, dist:e2.run_dist }));
    cj.push(['move-derived', d2.includes(pace(15.5, 2)) && !/assuming/.test(d2) && e2.run_pace === pace(15.5, 2) && dd && Math.round(dd.sec) === 465, 'derived before Log "' + d2 + '"; Log stores run_pace ' + J(e2.run_pace) + ', doseDerived(stored).sec ' + (dd && dd.sec) + ' (want ' + pace(15.5, 2) + ' = 465 s, no assuming)']);
  };
  const moveDistV236 = () => {
    C.ctx.__FORCE = DOSES.dist; C.setLog(HW, HD, null); C.open(HW, HD); const ws = need('log_run_dist');
    C.move(ws, 1, '2'); C.move(ws, 2, '5');
    const p = C.entry(HW, HD), h = hidv('log_run_dist'); tapLog(); const e = C.entry(HW, HD) || {};
    cj.push(['move-fixed-mi', p === null && h === '8.25' && e.run_dist === '8.25', 'fixed 8.00 -> 8.25: entry before Log ' + J(p) + ', hidden run_dist ' + J(h) + '; Log stores run_dist ' + J(e.run_dist) + ' (want null, "8.25"; "8.25")']);
  };
  const moveBackV236 = () => {
    C.ctx.__FORCE = DOSES.dist; C.setLog(HW, HD, null); C.open(HW, HD); const ws = need('log_run_dist');
    C.move(ws, 1, '5'); const a = hidv('log_run_dist'), pa = C.entry(HW, HD); C.move(ws, 1, '0'); const b = hidv('log_run_dist'), pb = C.entry(HW, HD), n = C.INPUTS.log_run_dist || 0;
    tapLog(); const e = C.entry(HW, HD) || {};
    cj.push(['move-back', a === '8.50' && b === '8.00' && n === 2 && pa === null && pb === null && e.run_dist === '8.00', 'away 8.50 then back to the seed face: hidden ' + J(a) + ' then ' + J(b) + ', input events ' + n + ', entry before Log ' + J(pa) + ' / ' + J(pb) + '; Log stores run_dist ' + J(e.run_dist) + ' (want "8.50", "8.00", 2, null / null; "8.00")']);
  };
  step('move-time', () => {
    if(VER >= 236) return moveTimeV236();
"""),
(
"""  step('move-dist', () => {
""",
"""  step('move-dist', () => {
    if(VER >= 236) return moveDistV236();
"""),
(
"""  step('move-back', () => {
""",
"""  step('move-back', () => {
    if(VER >= 236) return moveBackV236();
"""),
]

# ── g233_d207_bikewheel.js: D207-move ────────────────────────────────────────────────────────────────────────────
EDITS['tests/gates/g233_d207_bikewheel.js'] = [
(
"""//                    wheel opens on 0), so move-45 sees 1 input event, not 2; the blank seed-only settle rests hours on '0'.
""",
"""//                    wheel opens on 0), so move-45 sees 1 input event, not 2; the blank seed-only settle rests hours on '0'.
//                    V236 (D218; tests/measure/v236_rulings/v236_ruling_d218_d219.md, "Existing rows that flip"): from VER
//                    236 the card is DRAFT until it holds a ride, so move-45 asserts the hidden node 45.00 with no entry,
//                    then a tap on the rendered Log button (its own onclick) storing 45.00; move-progress and move-haslog
//                    read that store unchanged. move-seedonly and move-peg (stored 630.5 is LIVE) do not split.
"""),
(
"""a touched pegged 630.5 commits 599.98 (from VER 235 the hours step to 0 is a no-move: 1 input event, D215)',
""",
"""a touched pegged 630.5 commits 599.98 (from VER 235 the hours step to 0 is a no-move: 1 input event, D215; from VER 236, D218, the move writes the hidden node only and a Log tap stores 45.00)',
"""),
(
"""  const hid = () => C.els.log_bike_mins ? C.els.log_bike_mins.value : null;
""",
"""  const hid = () => C.els.log_bike_mins ? C.els.log_bike_mins.value : null;
  // V236 (D218): the Log tap is the rendered #cardioLogBtn's own onclick.
  const tapLog = () => { const b = (C.els.detailBody.innerHTML.match(/<button\\b[^>]*\\sid="cardioLogBtn"[^>]*>/) || [])[0], oc = b && (b.match(/\\sonclick="([^"]*)"/) || [])[1];
    if(!oc) throw new Error('no rendered #cardioLogBtn with an onclick'); C.ev(oc); C.advance(500); };
"""),
(
"""    C.move(need(), 0, '0'); C.move(need(), 1, '45');
    const e = C.entry(HW, HD) || {};
""",
"""    C.move(need(), 0, '0'); C.move(need(), 1, '45');
    // V236 (D218): DRAFT until a ride is stored; the moved wheel writes its hidden node, the Log tap stores it.
    if(VER >= 236){ const p = C.entry(HW, HD), h = hid(), n = C.INPUTS.log_bike_mins || 0; tapLog(); const e = C.entry(HW, HD) || {};
      cj.push(['move-45', p === null && h === '45.00' && n === 1 && e.bike_mins === '45.00', '0:00:00 -> hours 0 -> minutes 45: entry before Log ' + J(p) + ', hidden ' + J(h) + ', input events ' + n + '; Log stores bike_mins ' + J(e.bike_mins) + ' (want null, "45.00", 1; "45.00")']);
    } else {
    const e = C.entry(HW, HD) || {};
"""),
(
"""(C.INPUTS.log_bike_mins || 0) + ' (want "45.00", "45.00", ' + want45 + ')']);
""",
"""(C.INPUTS.log_bike_mins || 0) + ' (want "45.00", "45.00", ' + want45 + ')']);
    }
"""),
]

# ── check every anchor in every file, then write ────────────────────────────────────────────────────────────────
SRC = {}
for rel, reps in EDITS.items():
    src = open(os.path.join(ROOT, rel), encoding='utf-8').read()
    if 'V236 (D218' in src:
        sys.exit('ABORT: %s already carries a V236 (D218 edit' % rel)
    for i, (old, new) in enumerate(reps):
        n = src.count(old)
        if n != 1:
            sys.exit('ABORT: %s anchor %d count=%d\n%s' % (rel, i, n, old[:200]))
    SRC[rel] = src

OUTS = {}
for rel, reps in EDITS.items():
    out = SRC[rel]
    for old, new in reps:
        out = out.replace(old, new, 1)
    OUTS[rel] = out

for rel, out in OUTS.items():
    dst = os.path.join(OUT, rel) if OUT else os.path.join(ROOT, rel)
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    open(dst, 'w', encoding='utf-8').write(out)
    print('wrote %s (%d replacements)' % (dst, len(EDITS[rel])))
print('OK')
