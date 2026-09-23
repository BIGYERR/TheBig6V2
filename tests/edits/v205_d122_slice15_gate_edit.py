#!/usr/bin/env python3
# V205 slice 15 — D122 (pin shape). GATE ONLY. index.html is NOT touched and ia-version
# stays at 205. Four anchored replacements in tests/gates/g202_int_doctrine.js:
#   R1  the hand oracle block (Table 6 typed, cutback/taper/crossover/V115 hand ramps,
#       the reps row, the pace row) inserted after handRecTxt.
#   R2  the D7 header comment replaced by the era table (three mechanisms) + the
#       three-run LICENCE keyed ia-version <= 205.
#   R3  the D7 body replaced: the rule read off the week grid, per build, plus the
#       era-keyed PRT TING grid derived by hand.
#   R4  the file header amended to record the amendment.
import io, sys, os

P = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'gates', 'g202_int_doctrine.js')
P = os.path.normpath(P)
src = io.open(P, encoding='utf-8').read()
orig = src

def rep(old, new, tag):
    global src
    n = src.count(old)
    if n != 1:
        sys.stderr.write('ABORT %s: anchor count==%d (want 1)\n' % (tag, n))
        sys.exit(1)
    src = src.replace(old, new, 1)
    print('  %s anchor count==1 ok' % tag)

# ── R1 ───────────────────────────────────────────────────────────────────────
A1 = """const handRecTxt = tgt => { const r = handRec(tgt);
  return 'Recovery: ' + clk(r.lo) + ' to ' + clk(r.hi) + ' of easy jogging or walking. Keep moving.'; };
"""

N1 = A1 + """
// ── THE HAND ORACLE FOR CARD COUNT, REPS AND PACE (D122, V205 slice 15) ──────
// Everything below is TYPED HERE and derived HERE. Not one line of it calls the engine
// and compares the answer to itself. The Table 6 column is transcribed from the guide,
// Guide A's ceiling is the REPS_CEILING already typed at the top of this file from A
// 259-263, and the cutback, taper and crossover arithmetic is the ruled arithmetic
// written out as arithmetic. A mutation inside the app moves one side of every
// comparison below and one side only.

// Guide B, Table 6, the "Run/Swim (reps)" column, weeks 1 through 26, transcribed:
//   4 4 5 5 6 6 7 7 8 8 9 9 then 10 from week 13 to week 26.
// Line 61 of that page is the table's own tail rule (">26: do not increase"), which is
// why the reader below clamps the WEEK at 26 and reads row 26 forever after.
const T6_INT_RAW = [null, 4,4, 5,5, 6,6, 7,7, 8,8, 9,9, 10,10,10,10,10,10,10, 10,10,10,10,10,10,10];
const t6Raw  = w => T6_INT_RAW[Math.max(1, Math.min(Math.round(w) || 1, 26))];
// Guide A's ceiling sits OVER the table: start at 4, build progressively to 8, and past 8
// work on pace rather than on more repeats. Table 6's raw column reaches 9 at week 11 and
// 10 at week 13; A's cap holds the prescription at 8 from week 9 onward.
const t6Int  = w => Math.min(REPS_CEILING, t6Raw(w));

// The three week-shape predicates, as arithmetic.
const handTaperWks  = tw => Math.max(2, Math.round(tw * 0.12));     // event-targeted, non-base
const handIsTaper   = (w, tw) => w > tw - handTaperWks(tw);
const handIsCutback = (w, tw) => tw >= 10 && w % 4 === 0 && w !== tw;
const handBuildWks  = tw => tw - handTaperWks(tw);
// The compressed quality slot's crossover: first CHI week. NRC's 5K crosses at 5-of-8 and
// its 10K at 4-of-8; 0.55 splits them, floor of 3 so a short block still gets a real
// interval phase. This is the V115 mechanism, not doctrine, and the licence below says so.
const handCrossover = tw => Math.max(3, Math.ceil((tw || 6) * 0.55));

// REPS, V205 (Table 6): the calendar row, under A's ceiling, then the cutback branch,
// then the taper branch. Cutback steps back ~40% off the PRIOR week's build value and
// never progresses; taper holds intensity and cuts volume to 55%.
const handRepsT6 = (w, tw) => {
  const b = handIsCutback(w, tw) ? Math.max(3, Math.round(t6Int(w - 1) * 0.6)) : t6Int(w);
  return handIsTaper(w, tw) ? Math.max(2, Math.round(b * 0.55)) : b;
};
// REPS, <=V204 (V115 position ramp): 4 -> 8 spread by POSITION across a span, not by
// calendar week. The same cutback and taper branches sit over it.
const handRepsV115 = (w, tw, span) => {
  const s = Math.max(2, span || tw || 6);
  const ramp = x => Math.min(REPS_CEILING, 4 + Math.floor((x - 1) * 4 / Math.max(s - 1, 1)));
  const b = handIsCutback(w, tw) ? Math.max(3, Math.round(ramp(w - 1) * 0.6)) : ramp(w);
  return handIsTaper(w, tw) ? Math.max(2, Math.round(b * 0.55)) : b;
};

// PACE, the D101/D111 clock. D101: one safe rate, the age-scaled table value IS the cap,
// so an intermediate at 18-35 walks 5 s/mi/wk and never faster. D111: the INT target is
// that week's goal pace less A's 16 s/mi. Three limbs, and all three are load-bearing:
//   * the build weeks step by the gain;
//   * THE TAPER HOLDS. Taper weeks freeze at the realistic target, which is one whole
//     step BELOW the last build week and is then repeated. Extending the ramp linearly
//     through the taper is wrong: measure's own first pass did exactly that and produced
//     443 for an 11-week W11 where the engine and the ruling both say 448.
//   * a cutback week holds the PRIOR card's target, which is the sentence it prints.
const PACE_CAP_INT_18_35 = 5;                 // D101, intermediate x age scale 1.0
const handPaceRow = (anchor, goalPace, tw) => {
  const target = Math.min(goalPace, anchor);  // a goal already met parks the clock flat
  const bw     = handBuildWks(tw);
  const gain   = Math.min((anchor - target) / Math.max(bw, 1), PACE_CAP_INT_18_35);
  const real   = +(anchor - gain * bw).toFixed(1);
  const tgt = [];
  for(let w = 1; w <= tw; w++){
    const a = (w > bw) ? real : +(Math.max(anchor - gain * bw, anchor - gain * (w - 1))).toFixed(1);
    tgt.push(Math.round(a - INT_SUB));
  }
  for(let w = 2; w <= tw; w++) if(handIsCutback(w, tw)) tgt[w - 1] = tgt[w - 2];
  return tgt;
};

// The five ANCHORS the pace rows need, hand-derived from the athlete's entered mile and
// the pace chart the same way g202_pace_anchor.js derives its PIN. Four of them need no
// interpolation at all: an entered mile that lands ON a chart row, read at the MILE
// column, IS that row's mile value. Only the 3-mile goal interpolates, and its two
// bracketing columns are typed here.
const CHART_ROW_5_30 = { mile: 330, fiveK: 360 };   // the 5:30 row, mile and 5K columns
const COL_D_MILE = 1, COL_D_5K = 3.107;             // the columns' true distances in miles
const handRowPaceAt3mi = (row) =>
  row.mile + (row.fiveK - row.mile) * (Math.log(3 / COL_D_MILE) / Math.log(COL_D_5K / COL_D_MILE));
"""
rep(A1, N1, 'R1 hand oracle block')

# ── R2 ───────────────────────────────────────────────────────────────────────
A2 = """// D7 — the pinned after-grid, as literals
// ═════════════════════════════════════════════════════════════════════════════
// The PRT TING cfg of g202_pace_anchor.js. Hand route: the pinned progression array is
// [509.3, 504.3, 499.3, 494.3, 489.3, 484.3, ...] at D101's 5 s/mi/wk. The rep grid is
// 4,4,5,3,7,8 and week 4 is the cutback, which holds the PRIOR week's array entry. Each
// week's interval target is its array entry less D111's 16 s/mi:
//   W1 509.3-16=493.3 -> 493 (8:13)   W2 504.3-16=488.3 -> 488 (8:08)
//   W3 499.3-16=483.3 -> 483 (8:03)   W4 cutback, holds W3's entry -> 483 (8:03)
//   W5 489.3-16=473.3 -> 473 (7:53)   W6 484.3-16=468.3 -> 468 (7:48)
// The recovery band is that week's own target: tgt x 400 / 1609.344, x2 and x2.5.
// Both ruled sentences are typed out here verbatim from coach's ruling and compared whole.
"""

BAR = '═' * 77
N2 = """// D7 — the INT CARD COUNT is a RULE, read off the week grid, per build
// """ + BAR + """
// AMENDED BY D122 (V205 slice 15), pin shape. This row used to be six weeks of literals.
// V205 made the INT slot weekly (D125/D130) and the same PRT TING cfg now prints ELEVEN
// cards, so the literal went red. Writing 11 in its place would have been green and would
// have been WRONG: a scalar 11 is a number transcribed out of a failure message, and
// measure proved it false on 2,232 of 3,240 pace builds. THE PIN IS A FUNCTION, NOT A
// SCALAR. What follows is the rule, applied to each build's own week grid.
//
// THE RULE
//   * FOUR-RUN WEEKS carry ONE INT card EVERY week, cutback and taper weeks INCLUDED.
//     A four-run week with no INT card is a miss. The cutback and the taper cut the DOSE
//     and keep the CARD; that is D114 and the taper ruling as built, and it is exactly
//     why eleven weeks give eleven cards rather than nine.
//   * THREE-RUN WEEKS carry `cross - 1` cards, in weeks 1 through cross - 1, where
//     cross = max(3, ceil(tw x 0.55)). That reproduces every low count measured:
//     11 weeks -> 6, 9 weeks -> 4, 6 weeks -> 3.
//   * a build whose weeks are neither uniformly four-run nor uniformly three-run is NOT
//     skipped. It is a named miss, so an unclassified shape cannot pass quietly.
//
// THE THREE-RUN ARM IS A LICENCE, AND IT REFUSES ABOVE ia-version 205.
// D113 and D122 have already ruled the crossover RETIRED on the pace family, and slice 7c
// which retires it is PARKED. So the three-run arm below pins THE ARTIFACT AS SHIPPED,
// NOT THE DOCTRINE AS RULED. It is keyed on 205, a number that exists today, and the
// build that ships D113/D122 must re-pin it as "one INT and one CHI every week at three
// runs" or fail here by name. It does not expire quietly and it does not expire never.
//
// THE ERA TABLE NAMES THREE MECHANISMS, not one mechanism at two lengths. Row existence
// is a conjunct of D7, so an artifact with no row fails loudly instead of skipping.
const INT_MECHANISM_BY_VERSION = [
  { upTo: 204, arm: 'three-run', reps: 'v115',
    // SIX cards on the 11-week PRT TING cfg, because the compressed quality slot runs INT
    // weeks 1 to cross-1 and CHI thereafter. Reps come from the V115 POSITION ramp spread
    // over intSpan = cross - 1, which on this cfg is a span of 6 and gives 4,4,5,3,7,8.
    // THIS ROW IS NOT DERIVABLE FROM TABLE 6, and a future reader who tries will fail:
    // Table 6 over the same six weeks gives 4,4,5,3,6,6. The two mechanisms agree for
    // four weeks and diverge at week 5. D7c below asserts that divergence out loud so
    // this sentence cannot rot into decoration.
    note: 'V115 position ramp over intSpan; six cards; NOT Table 6' },
  { upTo: 205, arm: 'four-run', reps: 'table6',
    // ELEVEN cards on the same cfg: the INT slot is weekly, and Table 6 is read on the
    // CALENDAR week, through the cutback branch at weeks 4 and 8 and the taper branch at
    // weeks 10 and 11. That is the second mechanism.
    //
    // The THIRD mechanism is the three-run arm as it still stands on this same artifact:
    // where a pace build still lands on three run days the card count is still the V115
    // crossover's cross - 1, and that arm is LICENSED TO 205 and no further.
    note: 'Table 6 on the calendar week through the cutback and taper branches; the '
        + 'three-run arm still runs the V115 crossover and is licensed to 205' }
];
const IAV = +IA.version;
const INT_ERA = INT_MECHANISM_BY_VERSION.filter(r => IAV <= r.upTo)[0] || null;
const THREE_RUN_LICENCE_TO = 205;
if(IAV > THREE_RUN_LICENCE_TO){
  FAIL++;
  console.log('  FAIL D7-LICENCE the three-run INT card rule in this file pins cross - 1 cards, which is '
    + 'THE ARTIFACT AS SHIPPED AT ia-version ' + THREE_RUN_LICENCE_TO + ' AND NOT THE DOCTRINE AS RULED. '
    + 'D113 and D122 retired the crossover on the pace family. This artifact is ia-version ' + IAV
    + ', above the licence, so the arm must be RE-PINNED as "one INT and one CHI every week at three '
    + 'runs" by the build that ships D113/D122. Re-point nothing; rewrite the arm.');
}
"""
rep(A2, N2, 'R2 era table + licence')

# ── R3 ───────────────────────────────────────────────────────────────────────
START = """const PINNED = paceGoal({ targetDist:'1.5', targetMins:'10', targetSecs:'30', targetTime:'10:30',
  mileBestMins:'8', mileBestSecs:'15', mileBestSrc:{kind:'entered'} });
"""
END = """  + `byte-identical to the ruling and each recovery band that week's own 2 to 2.5x`
  + (d7bad.length ? ' — first miss: ' + d7bad[0] : ''));
"""
i = src.find(START); j = src.find(END)
if src.count(START) != 1 or src.count(END) != 1 or i < 0 or j < i:
    sys.stderr.write('ABORT R3: START count=%d END count=%d\n' % (src.count(START), src.count(END)))
    sys.exit(1)
print('  R3 start anchor count==1 ok; R3 end anchor count==1 ok')
OLD3 = src[i:j + len(END)]

N3 = """const PINNED = paceGoal({ targetDist:'1.5', targetMins:'10', targetSecs:'30', targetTime:'10:30',
  mileBestMins:'8', mileBestSecs:'15', mileBestSrc:{kind:'entered'} });

// The hand rows. REPS first: a pure function of the week and the block length, so these
// four rows are derived here and typed here as the answer the function must give.
const HAND_REPS_ROWS = { 6:  [4,4,5,5,3,3],
                         9:  [4,4,5,5,6,6,7,4,4],
                         11: [4,4,5,3,6,6,7,4,8,4,4],
                         15: [4,4,5,3,6,6,7,4,8,8,8,5,8,4,4] };
// Read them: at 6 and 9 weeks there is no cutback at all, because a cutback needs a block
// of ten weeks or more; the 3,3 and the 4,4 at the tail are the TAPER branch. At 11 and 15
// the 3 at week 4 and the 4 at week 8 are cutbacks off weeks 3 and 7, the 5 at week 12 is
// a cutback off week 11's capped 8, and the tail 4,4 is the taper again.
//
// PACE next. Five representative athletes, one per shape the clock can take, each with a
// hand anchor and a hand goal; the row itself is derived by handPaceRow.
const PACE_REPS = [
  { tag: '8:15 mile, 1.5 mi goal',  anchor: 509.3064395186472, goal: 630/1.5, tw: 11,
    cfg: paceGoal({ targetDist:'1.5', targetMins:'10', targetSecs:'30', targetTime:'10:30',
      mileBestMins:'8', mileBestSecs:'15', mileBestSrc:{kind:'entered'} }),
    row: [493,488,483,483,473,468,463,463,453,448,448] },
  { tag: '5:30 mile, 3 mi goal',    anchor: handRowPaceAt3mi(CHART_ROW_5_30), goal: 630/3, tw: 15,
    cfg: paceGoal({ targetDist:'3', targetMins:'10', targetSecs:'30', targetTime:'10:30',
      mileBestMins:'5', mileBestSecs:'30', mileBestSrc:{kind:'entered'} }),
    row: [343,338,333,333,323,318,313,313,303,298,293,293,283,278,278] },
  { tag: '12:00 mile, 1 mi goal',   anchor: 720, goal: 630, tw: 9,
    cfg: paceGoal({ targetDist:'1', targetMins:'10', targetSecs:'30', targetTime:'10:30',
      mileBestMins:'12', mileBestSecs:'00', mileBestSrc:{kind:'entered'} }),
    row: [704,699,694,689,684,679,674,669,669] },
  // BELOW the D101 cap: the gap is 30 s/mi over 7 build weeks, so the clock walks
  // 30/7 = 4.286 s/mi/wk and the cap never binds. The row is not a multiple of 5.
  { tag: '11:00 mile, 1 mi goal',   anchor: 660, goal: 630, tw: 9,
    cfg: paceGoal({ targetDist:'1', targetMins:'10', targetSecs:'30', targetTime:'10:30',
      mileBestMins:'11', mileBestSecs:'00', mileBestSrc:{kind:'entered'} }),
    row: [644,640,635,631,627,623,618,614,614] },
  // GOAL ALREADY MET: a 5:30 miler asked for 10:30 over a mile is already faster than the
  // goal, so the working target is his own anchor, the gain is zero and the clock parks.
  { tag: '5:30 mile, 1 mi goal',    anchor: 330, goal: 630, tw: 6,
    cfg: paceGoal({ targetDist:'1', targetMins:'10', targetSecs:'30', targetTime:'10:30',
      mileBestMins:'5', mileBestSecs:'30', mileBestSrc:{kind:'entered'} }),
    row: [314,314,314,314,314,314] }
];

const ruledDetail = g => g.cb
  ? `${g.reps}x400m at ${clk(g.tgt)}/mi. Cutback week. Same target as last week, fewer reps. `
    + handRecTxt(g.tgt) + ' ' + WARMUP
  : `${g.reps}x400m at ${clk(g.tgt)}/mi. This week's goal pace is ${clk(g.tgt + INT_SUB)}/mi. `
    + handRecTxt(g.tgt) + ' ' + WARMUP;

// ── the arm each build is in, read off ITS OWN week grid ─────────────────────
function armOf(prog){
  const wks = prog.weeks || {}, tw = prog.totalWeeks || 0;
  const per = [];
  for(let w = 1; w <= tw; w++){
    let n = 0;
    DAYS.forEach(d => { const day = wks[w] && wks[w][d]; if(!day || !day.cardio) return;
      (Array.isArray(day.cardio) ? day.cardio : [day.cardio]).forEach(s => { if(s && s.type === 'run') n++; }); });
    per.push(n);
  }
  if(!per.length) return { arm:'none', tw, per };
  if(per.every(n => n >= 4)) return { arm:'four-run', tw, per, want: Array.from({length:tw}, (_,i) => i+1) };
  if(per.every(n => n === 3)) return { arm:'three-run', tw, per,
    want: Array.from({length: handCrossover(tw) - 1}, (_,i) => i+1) };
  return { arm:'mixed', tw, per };
}

let d7bad = [], d7four = 0, d7three = 0, d7lens = {};

// D7a — the hand functions reproduce the typed rows. The oracle checks itself before it
// is allowed to judge anything: a hand row and a hand function that disagree means the
// derivation below is not the derivation written down above it.
Object.keys(HAND_REPS_ROWS).forEach(k => {
  const tw = +k, got = Array.from({length:tw}, (_,i) => handRepsT6(i+1, tw));
  if(JSON.stringify(got) !== JSON.stringify(HAND_REPS_ROWS[k]))
    d7bad.push(`hand reps row ${tw}wk derives ${got.join(',')} but is typed ${HAND_REPS_ROWS[k].join(',')}`);
});
PACE_REPS.forEach(r => {
  const got = handPaceRow(r.anchor, r.goal, r.tw);
  if(JSON.stringify(got) !== JSON.stringify(r.row))
    d7bad.push(`hand pace row "${r.tag}" derives ${got.join(',')} but is typed ${r.row.join(',')}`);
});
if(!INT_ERA) d7bad.push(`no INT_MECHANISM_BY_VERSION row covers ia-version ${IAV}: the era table must name `
  + `this artifact's mechanism before any grid below can mean anything`);

// D7b — THE RULE, on every build in the lattice plus the pinned cfg.
const D7_POP = LAT.concat([PINNED]);
for(const cfg of D7_POP){
  let prog; try { prog = IA.buildProgram(JSON.parse(JSON.stringify(cfg))); }
  catch(e){ d7bad.push('build crash: ' + e.message); continue; }
  const a = armOf(prog);
  if(a.arm === 'mixed' || a.arm === 'none'){
    d7bad.push(`${a.tw}wk build is neither uniformly four-run nor uniformly three-run (runs per week `
      + `${a.per.join(',')}): the card rule has no arm for it and it must not pass unclassified`);
    continue;
  }
  if(a.arm === 'three-run'){
    d7three++;
    if(INT_ERA && INT_ERA.arm !== 'three-run')
      d7bad.push(`${a.tw}wk build is three-run but the era row for ia-version ${IAV} names the `
        + `${INT_ERA.arm} arm as this artifact's mechanism`);
  } else {
    d7four++;
    if(INT_ERA && INT_ERA.arm !== 'four-run')
      d7bad.push(`${a.tw}wk build is four-run but the era row for ia-version ${IAV} names the `
        + `${INT_ERA.arm} arm as this artifact's mechanism`);
  }
  d7lens[a.tw] = (d7lens[a.tw] || 0) + 1;
  const cards = ints(prog);
  const gotW = cards.map(c => c.w);
  if(JSON.stringify(gotW) !== JSON.stringify(a.want))
    d7bad.push(`${a.tw}wk ${a.arm} build carries INT cards in weeks ${gotW.join(',') || '(none)'} `
      + `but the rule says ${a.want.join(',')}`
      + (a.arm === 'four-run' ? ' (one every week, cutback and taper included)'
                              : ` (cross - 1 = ${handCrossover(a.tw) - 1} cards, cross = ${handCrossover(a.tw)})`));
  // reps, by the era's mechanism
  const span = handCrossover(a.tw) - 1;
  const wantReps = a.want.map(w => (INT_ERA && INT_ERA.reps === 'v115')
    ? handRepsV115(w, a.tw, span) : handRepsT6(w, a.tw));
  const gotReps = cards.map(c => c.dose && c.dose.reps);
  if(gotW.length === a.want.length && JSON.stringify(gotReps) !== JSON.stringify(wantReps))
    d7bad.push(`${a.tw}wk ${a.arm} build prescribes reps ${gotReps.join(',')} but the `
      + `${INT_ERA ? INT_ERA.reps : '?'} mechanism derives ${wantReps.join(',')}`);
  // structural pace laws, anchor-free, on every build
  const tg = cards.map(c => c.dose && c.dose.tgt);
  for(let k = 1; k < tg.length; k++) if(tg[k] > tg[k-1])
    d7bad.push(`${a.tw}wk build target got SLOWER at W${cards[k].w} (${tg[k-1]} -> ${tg[k]})`);
  a.want.forEach((w, k) => { if(handIsCutback(w, a.tw) && k > 0 && tg[k] !== tg[k-1])
    d7bad.push(`${a.tw}wk W${w} is a cutback and must hold W${w-1}'s target (${tg[k-1]}), logged ${tg[k]}`); });
  const tap = a.want.map((w,k) => handIsTaper(w, a.tw) ? tg[k] : null).filter(v => v !== null);
  if(tap.length > 1 && tap.some(v => v !== tap[0]))
    d7bad.push(`${a.tw}wk taper weeks must all HOLD one target, logged ${tap.join(',')}`);
}

// D7c — the era row's own claim, asserted rather than asserted-in-prose: the <=204 rep
// row is NOT derivable from Table 6. The two mechanisms agree for four weeks and diverge.
const V115_11 = Array.from({length:6}, (_,i) => handRepsV115(i+1, 11, 6));
const T6_11_6 = HAND_REPS_ROWS[11].slice(0, 6);
if(JSON.stringify(V115_11) === JSON.stringify(T6_11_6))
  d7bad.push(`the era table claims the <=204 row is not derivable from Table 6, but the V115 ramp and `
    + `Table 6 agree on all six weeks (${V115_11.join(',')}): the claim has gone vacuous`);

// D7d — the pinned PRT TING grid, card by card, whole sentence, era-keyed.
const pProg  = IA.buildProgram(JSON.parse(JSON.stringify(PINNED)));
const pArm   = armOf(pProg);
const pSpan  = handCrossover(pArm.tw) - 1;
const pPace  = handPaceRow(509.3064395186472, 630/1.5, pArm.tw);
const PIN_GRID = (pArm.want || []).map(w => ({
  w, reps: (INT_ERA && INT_ERA.reps === 'v115') ? handRepsV115(w, pArm.tw, pSpan) : handRepsT6(w, pArm.tw),
  tgt: pPace[w-1], cb: handIsCutback(w, pArm.tw) }));
const pCards = ints(pProg);
if(pCards.length !== PIN_GRID.length)
  d7bad.push(`PRT TING carries ${pCards.length} INT cards, the ${INT_ERA ? INT_ERA.arm : '?'} rule derives ${PIN_GRID.length}`);
PIN_GRID.forEach((g, i) => {
  const c = pCards[i]; if(!c){ d7bad.push(`PRT TING W${g.w} missing`); return; }
  if(c.w !== g.w) d7bad.push(`PRT TING card ${i} is W${c.w} want W${g.w}`);
  if(!c.dose) { d7bad.push(`PRT TING W${g.w} no dose`); return; }
  if(c.dose.reps !== g.reps) d7bad.push(`PRT TING W${g.w} reps ${c.dose.reps} want ${g.reps}`);
  if(c.dose.tgt !== g.tgt) d7bad.push(`PRT TING W${g.w} tgt ${c.dose.tgt} want ${g.tgt}`);
  const hr = handRec(g.tgt);
  if(!c.dose.rec || c.dose.rec.lo !== hr.lo || c.dose.rec.hi !== hr.hi)
    d7bad.push(`PRT TING W${g.w} rec ${JSON.stringify(c.dose.rec)} want {lo:${hr.lo},hi:${hr.hi}}`);
  if(c.detail !== ruledDetail(g)) d7bad.push(`PRT TING W${g.w} detail\\n     got  |${c.detail}|\\n     want |${ruledDetail(g)}|`);
});

// D7e — the five pace representatives, absolute targets, against their hand rows.
PACE_REPS.forEach(r => {
  let prog; try { prog = IA.buildProgram(JSON.parse(JSON.stringify(r.cfg))); }
  catch(e){ d7bad.push(`pace rep "${r.tag}" build crash: ` + e.message); return; }
  const a = armOf(prog);
  if(a.tw !== r.tw){ d7bad.push(`pace rep "${r.tag}" sizes to ${a.tw} weeks, the row is derived for ${r.tw}`); return; }
  if(!a.want) return;
  const want = a.want.map(w => r.row[w-1]);
  const got  = ints(prog).map(c => c.dose && c.dose.tgt);
  if(JSON.stringify(got) !== JSON.stringify(want))
    d7bad.push(`pace rep "${r.tag}" logs ${got.join(',')} but the D101/D111 clock derives ${want.join(',')}`);
});

const d7arms = `${d7four} four-run and ${d7three} three-run of ${D7_POP.length}`;
ok(d7bad.length === 0 && (d7four + d7three) === D7_POP.length && !!INT_ERA,
  `D7 the INT card count is a FUNCTION, not a scalar: across ${d7arms} builds at block lengths `
  + `${Object.keys(d7lens).sort((a,b)=>a-b).map(k=>k+'wk x'+d7lens[k]).join(', ')} every four-run week carries `
  + `exactly one INT card including its cutback and taper weeks, and every three-run block carries `
  + `cross - 1 cards with cross = max(3, ceil(tw x 0.55)); the era row for ia-version ${IAV} names the `
  + `${INT_ERA ? INT_ERA.arm + '/' + INT_ERA.reps : 'MISSING'} mechanism; reps come from `
  + `${INT_ERA && INT_ERA.reps === 'v115' ? 'the V115 position ramp' : 'raw Table 6 under A\\'s ceiling of ' + REPS_CEILING}`
  + ` through the cutback and taper branches; and five hand pace rows, including one below the `
  + `${PACE_CAP_INT_18_35} s/mi/wk cap and one already-met goal, land on the second`
  + (d7bad.length ? ' — first miss: ' + d7bad[0] : ''));
"""
rep(OLD3, N3, 'R3 D7 body')

# ── R4 ───────────────────────────────────────────────────────────────────────
A4 = """// Usage: node tests/gates/g202_int_doctrine.js [artifact]
// Prints PASS n FAIL n. Expected to FAIL on V201 and on the slice-2 artifact: neither
// carries E8-E11.
"""
N4 = """// V205 slice 15 (D122, pin shape): D7 stopped being six weeks of literals and became the
// RULE, applied to each build's own week grid. It now passes on V204 and on V205 by
// reading the era table below, and the three-run arm is a LICENCE that refuses above
// ia-version 205. Nothing in index.html moved for this amendment.
//
// Usage: node tests/gates/g202_int_doctrine.js [artifact]
// Prints PASS n FAIL n. Expected to FAIL on V201 and on the slice-2 artifact: neither
// carries E8-E11.
"""
rep(A4, N4, 'R4 header note')

if src == orig:
    sys.stderr.write('ABORT: no change\n'); sys.exit(1)
io.open(P, 'w', encoding='utf-8').write(src)
print('WROTE %s (%d -> %d bytes)' % (P, len(orig), len(src)))
