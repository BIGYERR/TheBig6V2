#!/usr/bin/env python3
# V202 slice 1b — re-pin of g202_pace_anchor.js / g202_pace_copy.js and the sabotage spec
# under coach's AMENDED D100 (anchor = the athlete's own chart row READ AT THE GOAL DISTANCE).
# The assertions are NOT weakened: P1's oracle becomes a hand chart + hand log interpolation
# typed in the gate, and every pinned literal moves to measure's surgery values.
import io, os, json

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
def patch(rel, subs):
    p = os.path.join(ROOT, rel)
    s = io.open(p, encoding='utf-8').read(); orig = s
    for label, old, new in subs:
        n = s.count(old)
        assert n == 1, 'ANCHOR MISS [%s in %s]: count==%d' % (label, rel, n)
        print('  anchor ok  %-8s %s' % (label, rel))
        s = s.replace(old, new, 1)
    assert s != orig
    io.open(p, 'w', encoding='utf-8').write(s)
    print('  WROTE', rel)

# ═══════════════ g202_pace_anchor.js ═══════════════
A_HDR_OLD = """// D100: the pace clock anchors on the mile the athlete ENTERED and walks toward the goal the
//       athlete ENTERED. One reader of that goal, so the block is sized and paced on one number."""
A_HDR_NEW = """// D100 (AMENDED): the pace clock anchors on the athlete's OWN CHART ROW, READ AT THE DISTANCE
//       THEY ENTERED, and walks toward the goal they entered. One reader of that goal, so the
//       block is sized and paced on one number. The first cut anchored on the entered MILE
//       itself; measure showed that started a 1.5-mile goal at a pace the athlete only holds
//       for a mile, and 138 of this gate's 360 builds then had a goal "slower" than the anchor
//       and parked flat. The beginner keeps the 690 s/mi ROW, not the number 690."""
A_ORC_OLD = """//   * every expected pace is hand arithmetic on the athlete's ENTERED fields: entered mile
//     mm:ss -> seconds, entered goal mm:ss -> seconds, divided by the entered distance in miles."""
A_ORC_NEW = """//   * every expected pace is hand arithmetic on the athlete's ENTERED fields: entered mile
//     mm:ss -> seconds, entered goal mm:ss -> seconds, divided by the entered distance in miles.
//   * the pace chart's five distance columns are TRANSCRIBED below from the doctrine table and
//     read at the goal distance by the gate's OWN log interpolation, running maximum and clamps.
//     The gate never calls rowPaceAt to decide what rowPaceAt should have said; it types the
//     ruled arithmetic and compares. A mutation inside the app's helper moves one side only."""

A_HAND_OLD = """const DAYS = ['sun','mon','tue','wed','thu','fri','sat'];
const SEED = 24865;"""
A_HAND_NEW = """// The five distance columns of the pace chart, transcribed by hand. Columns sit at their true
// distances in miles; the gate reads a row at an arbitrary goal distance the way the ruling says
// to: log interpolation between the bracketing columns, a running maximum across the columns in
// distance order (a longer distance is never a faster pace), and a clamp to the table's own
// bounds at both ends. rowPaceAt(row, 1.0) must return the mile column exactly.
const HAND_COLS = [ {d:1,k:'mile'}, {d:3.107,k:'fiveK'}, {d:6.214,k:'tenK'},
                    {d:13.109,k:'half'}, {d:26.219,k:'marathon'} ];
const HAND_CHART = [
  //mile fiveK tenK half marathon
  [300, 330, 345, 360, 375], [330, 360, 375, 390, 410], [360, 390, 405, 435, 445],
  [390, 425, 440, 455, 480], [420, 460, 475, 500, 515], [450, 485, 505, 525, 550],
  [480, 520, 540, 570, 585], [510, 550, 570, 595, 615], [540, 580, 600, 640, 650],
  [570, 615, 635, 665, 685], [600, 640, 665, 705, 720], [630, 675, 695, 730, 755],
  [660, 700, 720, 775, 780], [690, 735, 755, 795, 800], [720, 760, 785, 845, 825],
].map(r => ({ mile:r[0], fiveK:r[1], tenK:r[2], half:r[3], marathon:r[4] }));
// interpolate a full row from a mile anchor, the way the chart has always been read
function handRow(mileSec){
  const R = HAND_CHART, K = ['mile','fiveK','tenK','half','marathon'];
  if(mileSec <= R[0].mile) return Object.assign({}, R[0]);
  if(mileSec >= R[R.length-1].mile) return Object.assign({}, R[R.length-1]);
  for(let i = 0; i < R.length - 1; i++){
    if(mileSec >= R[i].mile && mileSec <= R[i+1].mile){
      const f = (mileSec - R[i].mile) / (R[i+1].mile - R[i].mile), o = {};
      for(const k of K) o[k] = Math.round(R[i][k] + (R[i+1][k] - R[i][k]) * f);
      return o;
    }
  }
  return Object.assign({}, R[R.length-1]);
}
function handRowPaceAt(row, distMiles){
  let run = -Infinity;
  const v = HAND_COLS.map(c => { run = Math.max(run, +row[c.k]); return {d:c.d, p:run}; });
  const d = +distMiles;
  if(!(d > 0) || d <= v[0].d) return v[0].p;
  if(d >= v[v.length-1].d)    return v[v.length-1].p;
  for(let i = 0; i < v.length - 1; i++){
    if(d >= v[i].d && d <= v[i+1].d){
      const f = (Math.log(d) - Math.log(v[i].d)) / (Math.log(v[i+1].d) - Math.log(v[i].d));
      return v[i].p + (v[i+1].p - v[i].p) * f;
    }
  }
  return v[v.length-1].p;
}

const DAYS = ['sun','mon','tue','wed','thu','fri','sat'];
const SEED = 24865;"""

A_P1_OLD = """// ── P1 — D100 anchor: the clock starts at the ENTERED mile (beginner keeps the default) ──
let p1bad = [], p1beg = 0, p1nonbeg = 0;
for(const r of rows){
  const want = r.exp === 'beginner'
    ? EXP_DEFAULT.beginner
    : hand.secs(r.mb[0], r.mb[1]);
  if(r.exp === 'beginner') p1beg++; else p1nonbeg++;
  if(Math.abs(r.pp.ip - want) > 1e-9) p1bad.push(`${r.exp}/${r.mb.join(':')} got ${r.pp.ip} want ${want}`);
}
ok(p1bad.length === 0, `P1 D100 _initialPace is the entered mile for every non-beginner and 690 for every beginner: `
  + `${rows.length - p1bad.length} of ${rows.length} (${p1nonbeg} non-beginner, ${p1beg} beginner)`
  + (p1bad.length ? ' — first miss: ' + p1bad[0] : ''));
ok(rows.filter(r => r.exp === 'beginner').every(r => r.pp.ip === 690),
  `P1b the V172 beginner rule survives D100: every one of ${p1beg} beginner builds anchors at 690 s/mi `
  + `regardless of the mile time entered`);
ok(rows.filter(r => r.exp !== 'beginner').every(r => r.pp.ip !== EXP_DEFAULT[r.exp]
    || r.pp.ip === hand.secs(r.mb[0], r.mb[1])),
  'P1c no non-beginner build silently falls back to its experience default while a mile time is on file');"""
A_P1_NEW = """// ── P1 — amended D100 anchor: the athlete's own row, READ AT THE GOAL DISTANCE ──
let p1bad = [], p1beg = 0, p1nonbeg = 0;
for(const r of rows){
  const anchorMile = r.exp === 'beginner' ? EXP_DEFAULT.beginner : hand.secs(r.mb[0], r.mb[1]);
  const d = hand.miles(r.goal.targetDist, r.unit);
  r.handIP = handRowPaceAt(handRow(anchorMile), d);
  r.handMileCol = handRow(anchorMile).mile;
  r.handDist = d;
  if(r.exp === 'beginner') p1beg++; else p1nonbeg++;
  if(Math.abs(r.pp.ip - r.handIP) > 1e-9)
    p1bad.push(`${r.exp}/${r.mb.join(':')}/goal ${r.goal.targetDist}${r.unit} got ${r.pp.ip} want ${r.handIP.toFixed(4)}`);
}
ok(p1bad.length === 0, `P1 amended D100 _initialPace is the athlete's own chart row read at the goal `
  + `distance — the entered mile's row for every non-beginner, the 690 row for every beginner: `
  + `${rows.length - p1bad.length} of ${rows.length} (${p1nonbeg} non-beginner, ${p1beg} beginner)`
  + (p1bad.length ? ' — first miss: ' + p1bad[0] : ''));
const p1bBad = rows.filter(r => r.exp === 'beginner')
  .filter(r => Math.abs(r.pp.ip - handRowPaceAt(handRow(EXP_DEFAULT.beginner), r.handDist)) > 1e-9);
ok(p1bBad.length === 0,
  `P1b the V172 beginner rule survives the amendment: all ${p1beg} beginner builds anchor on the `
  + `690 s/mi ROW regardless of the mile time entered, converted to their own goal distance `
  + `(at a 1-mile goal that row reads 690 exactly; at 1.5 mi it reads 706.09, not 690)`
  + (p1bBad.length ? ' — first miss: ' + `${p1bBad[0].exp}/${p1bBad[0].mb.join(':')} got ${p1bBad[0].pp.ip}` : ''));
const p1cBad = rows.filter(r => r.exp !== 'beginner').filter(r => {
  const mine = handRowPaceAt(handRow(hand.secs(r.mb[0], r.mb[1])), r.handDist);
  const dflt = handRowPaceAt(handRow(EXP_DEFAULT[r.exp]), r.handDist);
  return Math.abs(r.pp.ip - mine) > 1e-9
      || (Math.abs(mine - dflt) > 1e-9 && Math.abs(r.pp.ip - dflt) < 1e-9);
});
ok(p1cBad.length === 0, 'P1c no non-beginner build silently falls back to its experience-default ROW '
  + 'while a mile time is on file');
// P1d — the SHAPE of the amendment, independent of the fitted numbers: at or below a mile the
// anchor IS the mile column; past a mile it is strictly slower. A revert to the mile-pace anchor
// fails this row without the gate needing to agree on a single interpolated second.
let p1dShort = 0, p1dLong = 0, p1dBad = [];
for(const r of rows){
  if(r.handDist <= 1){ p1dShort++; if(Math.abs(r.pp.ip - r.handMileCol) > 1e-9)
      p1dBad.push(`${r.exp}/${r.handDist.toFixed(4)} mi got ${r.pp.ip} want mile column ${r.handMileCol}`); }
  else { p1dLong++; if(r.pp.ip <= r.handMileCol + 1e-9)
      p1dBad.push(`${r.exp}/${r.handDist.toFixed(4)} mi anchor ${r.pp.ip} not slower than mile column ${r.handMileCol}`); }
}
ok(p1dBad.length === 0, `P1d the anchor equals the mile column at or below one mile (${p1dShort} builds) `
  + `and is strictly slower past it (${p1dLong} builds): a longer goal never starts the clock at the `
  + `athlete's mile pace` + (p1dBad.length ? ' — first miss: ' + p1dBad[0] : ''));"""

A_P5B_OLD = """let p5bad = [], p5flatBad = [], p5improving = 0, p5slower = 0;
for(const r of rows){
  const a = r.pp.arr;
  const handTarget = hand.secs(r.goal.targetMins, r.goal.targetSecs) / hand.miles(r.goal.targetDist, r.unit);
  if(handTarget >= r.pp.ip){"""
A_P5B_NEW = """let p5bad = [], p5flatBad = [], p5improving = 0, p5slower = 0;
for(const r of rows){
  const a = r.pp.arr;
  const handTarget = hand.secs(r.goal.targetMins, r.goal.targetSecs) / hand.miles(r.goal.targetDist, r.unit);
  if(handTarget >= r.handIP){"""
A_P5B2_OLD = """ok(p5flatBad.length === 0, `P5b when the entered goal is SLOWER than the entered mile the engine invents no `
  + `improvement and holds one pace all block: ${p5slower - p5flatBad.length} of ${p5slower} such builds flat, `
  + `none faster than the anchor (unruled behaviour, pinned so a later ruling can move it deliberately)`
  + (p5flatBad.length ? ' — first miss: ' + p5flatBad[0] : ''));"""
A_P5B2_NEW = """ok(p5flatBad.length === 0 && p5slower === 0,
  `P5b the amendment removes the flat-park case from this lattice: ${p5slower} of ${rows.length} builds `
  + `have an entered goal slower than their own distance-converted anchor. The first cut of E1, which `
  + `anchored on the mile pace itself, parked 138 of these 360 flat — that is why D100 was amended, and `
  + `a return of any flat build here means the anchor went back to the mile`
  + (p5flatBad.length ? ' — first flat: ' + p5flatBad[0] : ''));"""

A_PIN_OLD = """const PIN = {
  weeks: 11, initial: 495, target: 420, gain: 5, realistic: 450, dampened: true,
  arr: [495,490,485,480,475,470,465,460,455,450,450],
  cards: [ { w:1,  st:/Interval/,                tgt:470, pace:'7:50/mi'  },
           { w:6,  st:/Interval/,                tgt:447, pace:'7:27/mi'  },
           { w:10, st:/Continuous High Intensity/, tgt:486, pace:'8:06/mi' },
           { w:1,  st:/Long Slow Distance/,      tgt:645, pace:'10:45/mi' } ],
};"""
A_PIN_NEW = """// Measure's surgery values under the AMENDED D100 (tests/measure/v202_d100_chart_interp.js):
// the 8:15 mile interpolates to row mile 495 / fiveK 535, read at 1.5 mi in log distance
// (fraction 0.35766) for an anchor of 509.306 s/mi. Mario confirmed the resulting 7:44/mi.
const PIN = {
  weeks: 11, initial: 509.3064395186472, target: 420, gain: 5, realistic: 464.3, dampened: true,
  arr: [509.3,504.3,499.3,494.3,489.3,484.3,479.3,474.3,469.3,464.3,464.3],
  cards: [ { w:1,  st:/Interval/,                tgt:484, pace:'8:04/mi'  },
           { w:6,  st:/Interval/,                tgt:460, pace:'7:40/mi'  },
           { w:10, st:/Continuous High Intensity/, tgt:501, pace:'8:21/mi' },
           { w:1,  st:/Long Slow Distance/,      tgt:659, pace:'10:59/mi' } ],
};
// the same number, derived here instead of quoted: the mile and 5K columns of the 8:15 row,
// read at 1.5 miles in log distance. Two independent routes to one pin.
const PIN_HAND = handRowPaceAt(handRow(495), 1.5);"""

A_Q2_OLD = """ok(pPP.ip === PIN.initial, `Q2 pinned anchor ${PIN.initial} s/mi = the 8:15 mile entered (got ${pPP.ip})`);"""
A_Q2_NEW = """ok(Math.abs(pPP.ip - PIN.initial) < 1e-9,
  `Q2 pinned anchor ${PIN.initial.toFixed(4)} s/mi = the 8:15 mile's chart row read at 1.5 mi `
  + `(got ${pPP.ip})`);
ok(Math.abs(pPP.ip - PIN_HAND) < 1e-9 && Math.abs(PIN_HAND - PIN.initial) < 1e-9,
  `Q2b the pinned anchor re-derives from the hand chart: 495 + (535-495) x ln(1.5)/ln(3.107) = `
  + `${PIN_HAND.toFixed(4)} (measure's surgery printed ${PIN.initial.toFixed(4)})`);"""
A_Q5_OLD = """ok(pPP.real === PIN.realistic, `Q5 pinned realistic target ${PIN.realistic} s/mi (got ${pPP.real})`);"""
A_Q5_NEW = """ok(pPP.real === PIN.realistic, `Q5 pinned realistic target ${PIN.realistic} s/mi = anchor `
  + `${PIN.initial.toFixed(1)} less ${PIN.gain} s/mi/wk over 9 walked weeks, printed 7:44/mi `
  + `(got ${pPP.real})`);"""
A_Q8_OLD = """ok(qbad.length === 0, `Q8 the four pinned cards read W1 INT 470 (7:50/mi), W6 INT 447 (7:27/mi), `
  + `W10 CHI 486 (8:06/mi), W1 LSD 645 (10:45/mi), each printed pace equal to its own prescribed seconds`
  + (qbad.length ? ' — first miss: ' + qbad[0] : ''));"""
A_Q8_NEW = """ok(qbad.length === 0, `Q8 the four pinned cards read W1 INT 484 (8:04/mi), W6 INT 460 (7:40/mi), `
  + `W10 CHI 501 (8:21/mi), W1 LSD 659 (10:59/mi), each printed pace equal to its own prescribed seconds`
  + (qbad.length ? ' — first miss: ' + qbad[0] : ''));

// ── R — the four ruled properties of the row reader, each on a hand-built row ──
const rowAt = (row, d) => IA.eval(`rowPaceAt(${JSON.stringify(row)}, ${d})`);
const R495 = handRow(495);
ok(rowAt(R495, 1.0) === R495.mile,
  `R1 rowPaceAt(row, 1.0) returns the mile column EXACTLY (${R495.mile}, got ${rowAt(R495, 1.0)}): a `
  + `one-mile goal is anchored on the athlete's mile and nothing is lost to interpolation`);
const RBEG = handRow(EXP_DEFAULT.beginner);
ok(Math.abs(rowAt(RBEG, 1.5) - handRowPaceAt(RBEG, 1.5)) < 1e-9 && Math.abs(rowAt(RBEG, 1.5) - 706.09) < 0.01,
  `R2 the beginner's DEFAULT row converts on the same terms: 690/735 read at 1.5 mi is 706.09, not `
  + `690 (got ${rowAt(RBEG, 1.5)}). A beginner whose anchor did not convert would be the only athlete `
  + `anchored on the wrong distance`);
const INVERTED = { mile:720, fiveK:760, tenK:785, half:845, marathon:825 };
ok(rowAt(INVERTED, 26.219) === 845 && rowAt(INVERTED, 20) === 845,
  `R3 the running maximum holds: the slowest chart row inverts (half 845 then marathon 825) and the `
  + `goal-distance input is min="0.1" with no max, so that row IS reachable. A longer distance is `
  + `never a faster pace — 26.219 mi reads 845, not 825 (got ${rowAt(INVERTED, 26.219)})`);
ok(rowAt(R495, 0.5) === R495.mile && rowAt(R495, 0.1) === R495.mile
   && rowAt(R495, 50) === R495.marathon && rowAt(R495, 26.219) === R495.marathon,
  `R4 both clamps hold at the table's own bounds: below a mile reads the mile column `
  + `(${R495.mile}), above the marathon column reads the marathon column (${R495.marathon})`);
let rMono = [];
for(let d = 0.2; d <= 30; d += 0.1){ const a = rowAt(R495, d), b = rowAt(R495, d + 0.1);
  if(b < a - 1e-9) rMono.push(`${d.toFixed(1)} -> ${(d+0.1).toFixed(1)}: ${a} -> ${b}`); }
ok(rMono.length === 0, `R5 the reader is monotone non-decreasing in distance across 0.2 to 30 mi `
  + `(299 steps)` + (rMono.length ? ' — first miss: ' + rMono[0] : ''));"""

patch('tests/gates/g202_pace_anchor.js', [
  ('hdr', A_HDR_OLD, A_HDR_NEW), ('oracle', A_ORC_OLD, A_ORC_NEW),
  ('handchart', A_HAND_OLD, A_HAND_NEW), ('P1', A_P1_OLD, A_P1_NEW),
  ('P5b-cmp', A_P5B_OLD, A_P5B_NEW), ('P5b-row', A_P5B2_OLD, A_P5B2_NEW),
  ('PIN', A_PIN_OLD, A_PIN_NEW), ('Q2', A_Q2_OLD, A_Q2_NEW),
  ('Q5', A_Q5_OLD, A_Q5_NEW), ('Q8', A_Q8_OLD, A_Q8_NEW),
])

# ═══════════════ g202_pace_copy.js ═══════════════
C_HDR_OLD = """//   * the two numbers inside the E4 sentence (5 s/mi/wk, 7:00/mi goal, 7:30/mi block target) are
//     the same hand values g202_pace_anchor.js derives from the athlete's ENTERED fields, and are
//     re-derived here from the entered mm:ss rather than read off the note."""
C_HDR_NEW = """//   * the numbers inside the E4 sentence (5 s/mi/wk, 7:00/mi goal, 7:44/mi block target) are the
//     same hand values g202_pace_anchor.js derives from the athlete's ENTERED fields, and are
//     re-derived here from the entered mm:ss rather than read off the note. The block target is
//     7:44/mi under the AMENDED D100 (the anchor is the 8:15 row read at 1.5 mi, not the 8:15
//     mile itself); it read 7:30/mi against the first cut of E1, which coach retracted."""
C_HAND_OLD = """const HAND_REACH = 450;                                                 // D101 realistic target, pinned by g202_pace_anchor Q5"""
C_HAND_NEW = """// Amended D100: the anchor is the 8:15 row (mile 495, 5K 535) read at 1.5 mi in log distance.
const HAND_ANCHOR = 495 + (535 - 495) * Math.log(1.5) / Math.log(3.107);   // 509.3064 s/mi
const HAND_REACH  = +(HAND_ANCHOR - HAND_GAIN * 9).toFixed(1);             // 464.3 s/mi -> 7:44/mi
                                                        // D101 realistic target, pinned by g202_pace_anchor Q5"""
patch('tests/gates/g202_pace_copy.js', [('hdr', C_HDR_OLD, C_HDR_NEW), ('reach', C_HAND_OLD, C_HAND_NEW)])

# ═══════════════ tests/sabotage/v202.json ═══════════════
sp = os.path.join(ROOT, 'tests', 'sabotage', 'v202.json')
spec = json.load(io.open(sp, encoding='utf-8'))
m1 = [m for m in spec if m['name'].startswith('M1 ')]
assert len(m1) == 1, 'M1 not unique'
m1 = m1[0]
m1['name'] = ("M1 -> the amended D100 is reverted to the FIRST cut of E1: the anchor goes back to the "
  "athlete's MILE pace instead of their own row read at the goal distance. The mile the athlete entered "
  "still reaches the clock, so nothing looks missing — a 1.5-mile goal simply starts at a pace the "
  "athlete only holds for a mile, which is the defect coach amended the ruling to remove")
m1['anchor'] = "    buildRunProgressionForLength._initialPace  = rowPaceAt(_chartRow, rawTargetDist);"
m1['replacement'] = "    buildRunProgressionForLength._initialPace  = _mileBestSecs || expPaceDefaults[experience||'intermediate'] || 570;"
m1['note'] = ("NAMED TRIP: g202 P1d, the row that says the anchor equals the mile column at or below one "
  "mile and is STRICTLY SLOWER past it. P1d is the declared target rather than P1 because it fails on the "
  "SHAPE of the amendment and needs no agreement on a single interpolated second, so it cannot be "
  "satisfied by a gate whose hand chart drifted. P1 must go red with it (288 of 360 builds have a goal "
  "past a mile) and P1c too. EXPECTED COLLATERAL, DISCLOSED: P5b goes red — this is the mutation that "
  "brings the 138 flat-parked builds back, which is the measured reason the ruling was amended — and the "
  "pinned row goes with it: Q2, Q2b, Q5, Q7, Q8. Q3 stays GREEN (the TARGET wiring is untouched) and "
  "R1..R5 stay GREEN, because rowPaceAt is still present and still correct; it has merely stopped being "
  "called. A suite that only tested the helper would ship this mutant. P1b goes red on the beginner "
  "segment too: the beginner's 690 ROW stops converting. B1 GREEN.")
m12 = {
  "name": ("M12 -> the running maximum is dropped from the row reader. Every column is read as tabulated, "
    "so the one chart row that inverts (mile 12:00: half 845, marathon 825) now promises a marathon pace "
    "FASTER than the same athlete's half pace. Fourteen of fifteen rows are unaffected and the pinned "
    "athlete is unaffected, so the app is correct everywhere a reviewer is likely to look"),
  "anchor": "  var v = ROW_PACE_COLS.map(function(c){ run = Math.max(run, +row[c.k]); return {d:c.d, p:run}; });",
  "replacement": "  var v = ROW_PACE_COLS.map(function(c){ run = +row[c.k]; return {d:c.d, p:run}; });",
  "gate": "gates/g202_pace_anchor.js",
  "note": ("NAMED TRIP: g202 R3, which builds the inverted row ITSELF (mile 720, fiveK 760, tenK 785, half "
    "845, marathon 825) and requires 26.219 mi to read 845. R5 must go red with it — monotone "
    "non-decreasing in distance is the general form of the same claim, and R3 alone could be satisfied by "
    "special-casing one row. R3 reads a row the gate typed, not a row of PACE_CHART, so a later edit to the "
    "app's table cannot make this mutation unreachable. EXPECTED COLLATERAL: none. The pinned 8:15 athlete "
    "does not invert and every sweep row is at or under 5 miles, so P1, P1b, P1c, P1d, Q2..Q8 and B1 all "
    "stay GREEN. That is the point: this mutant ships a correct program for every athlete in the lattice "
    "and a wrong one for the slowest row in the chart."),
}
m13 = {
  "name": ("M13 -> the interpolation between chart columns goes linear instead of log. The shape is "
    "unchanged, the clamps and the running maximum survive, and the number moves by about 7 s/mi at 1.5 "
    "miles — enough to move every prescribed second in the block and small enough to read as rounding"),
  "anchor": "      var f = (Math.log(d) - Math.log(v[i].d)) / (Math.log(v[i+1].d) - Math.log(v[i].d));",
  "replacement": "      var f = (d - v[i].d) / (v[i+1].d - v[i].d);",
  "gate": "gates/g202_pace_anchor.js",
  "note": ("NAMED TRIP: g202 Q2b, the row that RE-DERIVES the pinned anchor as 495 + (535-495) x "
    "ln(1.5)/ln(3.107) in the gate's own arithmetic. Q2 must go red with it (the literal measure printed "
    "from the surgery copy) and so must P1, which computes the log fraction for all 360 builds. WHY BOTH: "
    "Q2 is a literal pin and Q2b is the derivation, and a linear model that happened to agree at one "
    "distance would still fail the sweep. EXPECTED COLLATERAL: Q5, Q7, Q8 red (the after-grid hangs off the "
    "anchor), and g202_pace_copy C1 red, because the ruled note prints the block target and the gate "
    "derives 7:44/mi from the log model. R1 must STAY GREEN — rowPaceAt(row, 1.0) returns the mile column "
    "under either model, which is exactly why R1 alone can never see this. R3, R4 GREEN. B1 GREEN."),
}
spec.append(m12); spec.append(m13)
io.open(sp, 'w', encoding='utf-8').write(json.dumps(spec, indent=2, ensure_ascii=False) + '\n')
print('  WROTE tests/sabotage/v202.json  (%d mutations)' % len(spec))
