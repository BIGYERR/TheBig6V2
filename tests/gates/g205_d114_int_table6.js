// g205_d114_int_table6.js — D114's INT half (ruled V202, built V205 slice 13).
//
// WHAT D114 RULED. getINTReps reads NSW Guide B Table 6's INT column ("Run/Swim (reps)")
// by CALENDAR WEEK, capped at Guide A's ceiling of 8 repeats. It replaces the V115 hand
// ramp, which spread 4 -> 8 across a `rampSpan` window BY POSITION.
//
// WHAT WENT WRONG WITHOUT IT. D125/D130 made the INT slot weekly instead of six-weekly.
// Run over an 11-week block the position ramp only reached its last rung in the final
// week, which is the taper, so the athlete topped out at SEVEN repeats and never reached
// the eight Guide A tells him to build to. That is the regression this gate pins shut.
//
// ORACLES, all independent of the engine:
//   * T2  is the 26-row column TYPED IN THIS FILE by hand from the guide. The engine is
//         never asked what the table says; it is told.
//   * T2b re-reads the column out of doctrine/nsw_ptg_sealswcc_11pg.txt and requires the
//         hand transcription in T2 to match the source file. Two independent readings of
//         the same page. The doctrine tree is gitignored, so an absent file is a NAMED
//         SKIP, never a silent pass and never a fail.
//   * T3  is the table's own tail rule, quoted: ">26: do not increase INT or CHI
//         distances." Row 26 forever.
//   * T4  is Guide A's ceiling of 8, applied over the raw column, which reaches 9 at
//         week 11 and 10 at week 13 and must never be allowed to print either.
//   * T7/T8 re-implement the cutback rule FROM THE PROSE the cutback branch states
//         (~40% off the prior build week, floor 3) and require the built CARDS to agree.
//   * T9  is the regression row: an 11-week block must actually REACH 8.
//
// VERSION PREDICATE (standing ruling 4). D114 ships on ia-version 205.
//   * at 205 and above intFromTable6 MUST exist; its absence is a named FAIL, never a skip.
//     A 205 artifact without it is an INCOMPLETE 205, and saying so is the point.
//   * below 205: NOT APPLICABLE, skipped, clean exit.
const path = require('path');
const fs = require('fs');
const { load } = require(path.join(__dirname, '..', 'harness.js'));
const ART = process.argv[2] || path.join(__dirname, '..', '..', 'index.html');
const IA = load(ART);

let pass = 0, fail = 0;
function ok(label, cond, got){
  if(cond){ pass++; console.log('  ok   ' + label); }
  else { fail++; console.log('FAIL ' + label + (got === undefined ? '' : ' (got ' + got + ')')); }
}
function skipRow(label){ console.log('  SKIP ' + label); }
function summary(code){ console.log('\nPASS ' + pass + ' FAIL ' + fail); process.exit(code); }

const D114_ERA = 205;
const VER = IA.version;
const HAS = IA.eval("typeof intFromTable6 === 'function' && Array.isArray(NSW_TABLE6_INT)");

if(!HAS && VER < D114_ERA){
  console.log('NOT APPLICABLE: ia-version ' + VER + ' predates D114 (V' + D114_ERA + ').');
  summary(0);
}
ok('T1 NSW_TABLE6_INT and intFromTable6 both exist (D114 requires them at ia-version >= '
   + D114_ERA + '; this artifact is ' + VER + ')', HAS, String(HAS));
if(!HAS) summary(1);

// ── D103a (V208) ERA ROWS for the run builder's quality labels (standing ruling 4) ──
// The CHI and the INT were renamed Long Interval (LI) and Short Interval (SI) at V208 (coach,
// D103a slice 4a). Bike and swim keep CHI and INT, so no bike or swim matcher reads this table.
// An artifact no row covers fails the ERA row below, and its matchers match nothing, so every
// row that finds a card by label goes red with it.
// T8a, T8 and T9 find Mario's INT cards by it. The pre-D103a row is the old matcher byte for byte.
const RUN_LABEL_BY_VERSION = [
  { from: 204, to: 207,      ruling: 'pre-D103a',    int: /INT/ },
  { from: 208, to: Infinity, ruling: 'D103a (V208)', int: /Short Interval \(SI\)/ },
];
const LBL = RUN_LABEL_BY_VERSION.filter(r => +VER >= r.from && +VER <= r.to)[0]
  || { ruling: 'NO ROW', int: /(?!)/ };
ok('ERA a RUN_LABEL_BY_VERSION row covers ia-version ' + VER + ' (' + LBL.ruling + ')', LBL.ruling !== 'NO ROW',
   'the run INT label has no ruled text at this version, so T8a, T8 and T9 are void');

// ── T2: the column, typed by hand from Table 6, INT header "Run/Swim (reps)" ──────
// wk 1..26. Raw, UNCAPPED — the cap is Guide A's and is applied by the reader, not stored.
const HAND = [null,
  4, 4, 5, 5, 6, 6, 7, 7, 8, 8,      // wk  1-10
  9, 9, 10, 10, 10, 10, 10, 10, 10, 10,  // wk 11-20
  10, 10, 10, 10, 10, 10];               // wk 21-26
const raw = IA.eval('JSON.stringify(NSW_TABLE6_INT)');
const got = JSON.parse(raw);
ok('T2a the stored column has 27 slots (index 0 unused, weeks 1..26)',
   got.length === 27 && got[0] === null, got.length + ' slots, [0]=' + got[0]);
let badRows = [];
for(let w = 1; w <= 26; w++) if(got[w] !== HAND[w]) badRows.push('wk' + w + ' want ' + HAND[w] + ' got ' + got[w]);
ok('T2 all 26 rows match the hand transcription of Table 6 INT', badRows.length === 0, badRows.join('; '));

// ── T2b: second, independent reading, straight out of the doctrine file ──────────
const DOC = path.join(__dirname, '..', '..', 'doctrine', 'nsw_ptg_sealswcc_11pg.txt');
if(!fs.existsSync(DOC)){
  skipRow('T2b doctrine/nsw_ptg_sealswcc_11pg.txt absent (gitignored tree); T2 hand table stands alone');
} else {
  const txt = fs.readFileSync(DOC, 'utf8');
  const fromDoc = [null];
  for(const line of txt.split('\n')){
    const m = line.match(/^\s*(\d{1,2})\s*\|[^|]*\|[^|]*\|[^|]*\|\s*(\d{1,2})\s*$/);
    if(m && +m[1] >= 1 && +m[1] <= 26 && +m[1] === fromDoc.length) fromDoc.push(+m[2]);
  }
  ok('T2b the doctrine file yields all 26 INT rows', fromDoc.length === 27, fromDoc.length - 1 + ' rows parsed');
  if(fromDoc.length === 27){
    const mism = [];
    for(let w = 1; w <= 26; w++) if(fromDoc[w] !== HAND[w]) mism.push('wk' + w + ' file ' + fromDoc[w] + ' hand ' + HAND[w]);
    ok('T2c the hand transcription equals the doctrine file, read independently', mism.length === 0, mism.join('; '));
  }
}

// ── the reader ────────────────────────────────────────────────────────────────────
const rd = w => IA.eval('intFromTable6(' + w + ')');

// ── T3: the ">26: do not increase" tail rule ─────────────────────────────────────
const row26 = Math.min(8, HAND[26]);
const past = [27, 28, 30, 40, 52, 104, 1000];
const bad3 = past.filter(w => rd(w) !== row26);
ok('T3 weeks past 26 all read row 26 (the guide\'s ">26: do not increase INT distances"), i.e. '
   + row26, bad3.length === 0, bad3.map(w => 'wk' + w + '=' + rd(w)).join(','));

// ── T4: Guide A's ceiling of 8, over a column whose raw values reach 10 ──────────
let maxSeen = 0, firstEight = 0;
for(let w = 1; w <= 26; w++){ const v = rd(w); if(v > maxSeen) maxSeen = v; if(!firstEight && v === 8) firstEight = w; }
ok('T4a the reader never exceeds Guide A\'s 8 repeats anywhere in 26 weeks', maxSeen === 8, 'max ' + maxSeen);
ok('T4b the cap is a LIVE bound, not vacuous: the raw column climbs past 8 (wk11=9, wk13=10)',
   HAND[11] > 8 && HAND[13] > 8, 'raw wk11=' + HAND[11] + ' wk13=' + HAND[13]);
ok('T4c the build reaches 8 at week 9 and holds it', firstEight === 9 && rd(9) === 8 && rd(26) === 8,
   'first 8 at wk' + firstEight);
ok('T4d the build OPENS on Guide A\'s 4 repeats', rd(1) === 4 && rd(2) === 4, rd(1) + ',' + rd(2));
let nonMono = [];
for(let w = 2; w <= 26; w++) if(rd(w) < rd(w-1)) nonMono.push('wk' + w);
ok('T4e the raw progression never steps backwards', nonMono.length === 0, nonMono.join(','));

// ── T5: CALENDAR, not phase. rampSpan must not move a single week ───────────────
const gi = (w, tw, mil, span) => IA.eval('getINTReps(' + w + ',' + tw + ',' + !!mil + ',' + (span === null ? 'null' : span) + ')');
let spanMoved = [];
for(const tw of [6, 8, 11, 12, 16, 20, 26]){
  for(let w = 1; w <= tw; w++){
    const ref = gi(w, tw, false, null);
    for(const span of [2, 3, 4, 6, 8, 12, 26]){
      if(gi(w, tw, false, span) !== ref) spanMoved.push('tw' + tw + ' wk' + w + ' span' + span);
    }
  }
}
ok('T5 rampSpan re-bases nothing: Table 6 is indexed on the training week itself',
   spanMoved.length === 0, spanMoved.slice(0, 6).join('; ') + (spanMoved.length > 6 ? ' +' + (spanMoved.length - 6) + ' more' : ''));

// ── T6/T7: the cutback rule, re-implemented here from the prose ─────────────────
// "interval VOLUME steps back ~40% off the prior build week and never progresses", floor 3.
const isCut = (w, tw) => (tw || 0) >= 10 && w % 4 === 0 && w !== tw;
const expect = (w, tw) => isCut(w, tw) ? Math.max(3, Math.round(Math.min(8, HAND[Math.min(Math.max(w - 1, 1), 26)]) * 0.6))
                                       : Math.min(8, HAND[Math.min(Math.max(w, 1), 26)]);
let engMiss = [];
for(const tw of [6, 8, 10, 11, 12, 14, 16, 20, 26]){
  for(let w = 1; w <= tw; w++) if(gi(w, tw, false, null) !== expect(w, tw)) engMiss.push('tw' + tw + ' wk' + w + ' want ' + expect(w, tw) + ' got ' + gi(w, tw, false, null));
}
ok('T6 the engine equals table-plus-cutback across 9 block lengths, hand computed here',
   engMiss.length === 0, engMiss.slice(0, 6).join('; '));
ok('T7 the cutback actually BITES on an 11-week block (wk4 and wk8 step back, wk11 does not)',
   gi(4, 11, false, null) === 3 && gi(8, 11, false, null) === 4 && gi(11, 11, false, null) === 8,
   gi(4, 11, false, null) + '/' + gi(8, 11, false, null) + '/' + gi(11, 11, false, null));

// ── T8/T9: Mario's block, end to end, against the built CARDS ───────────────────
const DAYS = ['sun','mon','tue','wed','thu','fri','sat'];
const marioCfg = { name:'M', primaryPath:'goal', cardioTypes:['run'],
  cardioGoals:{ run:{ id:'run_pace_goal', label:'Pace', targetDist:'1.5', targetMins:'10',
    targetSecs:'0', mileBestMins:'8', mileBestSecs:'0', baselineDist:'3', baseline:'3mi' } },
  eventTargeted:false, liftingFocus:'support_prevention', experience:'intermediate',
  ageBracket:'18-35', equipment:'crossfit', unit:'lbs', restDays:['sun','wed'],
  days:DAYS.slice(), bench:135, squat:155, deadlift:185, seed:76308 };
const prog = IA.buildProgram(marioCfg);
const wks = Object.keys(prog.weeks).map(Number).sort((a,b) => a - b);
const tw = wks.length;
const cardReps = [];
for(const wk of wks){
  for(const d of DAYS){
    const c = prog.weeks[wk][d] && prog.weeks[wk][d].cardio;
    if(c && LBL.int.test(c.subtype || '')) cardReps.push({ wk, reps: c.dose && c.dose.reps, detail: String(c.detail || '') });
  }
}
ok('T8a Mario\'s block is 11 weeks with one INT card per week', tw === 11 && cardReps.length === 11,
   'tw=' + tw + ' cards=' + cardReps.length);
// Hand-derived after-grid: table capped at 8, with the cutback on wk4 and wk8.
const WANT = [4, 4, 5, 3, 6, 6, 7, 4, 8, 8, 8];
let cardMiss = [];
cardReps.forEach((c, i) => {
  if(c.reps !== WANT[i]) cardMiss.push('wk' + c.wk + ' want ' + WANT[i] + ' got ' + c.reps);
  const m = c.detail.match(/^(\d+)x400m/);
  if(!m || +m[1] !== WANT[i]) cardMiss.push('wk' + c.wk + ' card text "' + c.detail.slice(0, 12) + '" want ' + WANT[i] + 'x400m');
});
ok('T8 Mario\'s printed INT cards read 4,4,5,3,6,6,7,4,8,8,8 in both dose and sentence',
   cardMiss.length === 0, cardMiss.slice(0, 6).join('; '));
ok('T9 THE REGRESSION ROW: an 11-week block REACHES Guide A\'s 8 repeats, and reaches it '
   + 'before the final week (the V115 position ramp reached 8 only in week 11, and in a '
   + 'tapered block never at all)',
   cardReps.some(c => c.reps === 8 && c.wk < 11), 'weeks at 8: ' + cardReps.filter(c => c.reps === 8).map(c => c.wk).join(','));

summary(fail === 0 ? 0 : 1);
