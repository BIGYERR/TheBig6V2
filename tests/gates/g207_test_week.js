// g207_test_week.js — the gate for D106a slice A (coach, Mario concurred; guard added by
// coach's re-ruling after builder's premise stop): a test goal (run_pace_goal family) with a
// test date inside the goal length ends on the test week. doGenerate writes two persisted
// pins from the RESOLVED start, _testWeek and _raceDateCappedWeeks = _testWeek || goalLen;
// buildProgram never sees a date. The run taper array reads the published taperWeeksFor
// window, and with no build weeks (tw 1-2) it steps down from the start value B.
//
// ORACLES, all independent of the engine:
//   * H  is a HAND DATE TABLE for testWeekIndex: Monday arithmetic done on a calendar,
//        week N = floor((Mon(test) - Mon(start)) / 7 days) + 1, null before the start.
//        The gate pins TZ=America/New_York so the two DST rows are live (Z0 proves the
//        offset really moves across 2026-03-08; if it does not, Z0 FAILS, never skips).
//   * F  is the 5-week PRT TING fixture (tests/measure/v202_run_path_B.js pinned cfg):
//        length 5, Taper printed on W4-W5 only (hand window: max(2, round(0.12 x 5)) = 2),
//        W1-W3 cardio (subtype + dose) equal to the SAME cfg built without the pins, which
//        is 11 weeks (the goal length, recorded in the D106a ruling as the g202_d108 literal).
//   * T  is a HAND ARITHMETIC table of the long run for tw 1..8, read off the card detail
//        the athlete reads. B = 2.5 (index.html longStarts.run_pace_goal.intermediate).
//        Build: +max(0.5 mi, 10%) a week: 3.0 3.5 4.0 4.5 5.0 5.5 (no deload under 10 wk).
//        Window: max(2, round(0.12 tw)) = 2 for every tw 1..8; build weeks = tw - 2.
//        Taper step t: round1(peak x (1 - (t+1)/3 x 0.4)) = peak x 0.8667, peak x 0.7333;
//        peak = the last build week, or B when there are none (tw 1-2: 2.2, 1.8).
//          tw1 [2.2]            tw2 [2.2,1.8]          tw3 [3,2.6,2.2]
//          tw4 [3,3.5,3.0,2.6]  tw5 [3,3.5,4,3.5,2.9]  tw6 [3,3.5,4,4.5,3.9,3.3]
//          tw7 [3,3.5,4,4.5,5,4.3,3.7]                 tw8 [3,3.5,4,4.5,5,5.5,4.8,4.0]
//        Dip row: a week dips when its long run is below max(B, every earlier week). The
//        dip set must equal the Taper-labelled set must equal the hand window. V206 fails
//        it at tw 1..5 (tw5: one dipped week against a two-week window).
//   * B  is the no-move control, scoped to the D106a build pair only (candidate 207 vs
//        baseline 206, standing ruling 4): tw 6, 7, 8 and the unpinned 11-week build are
//        byte-equal to the baseline file. Without a baseline, or on another pair, SKIP.
//   * G  drives doGenerate itself in the harness VM (IA.eval + IA.flushTimers) and reads
//        the STORED program out of ia_programs. Hand values: start Mon 2026-09-21, test
//        Mon 2026-10-19 = week 5. A Sunday start with Sunday rest snaps to Mon 2026-09-28
//        (D25), so the same test is week 4 from the RESOLVED start and would be 5 from the
//        raw field. The undated case runs on the SAME WD after the dated one, so a pin
//        that is only written when set would survive into it (the latch rule).
//   * D  is SLICE B, the test week (limbs ii and iii; gaps 1 and 2 and the run-card guard
//        ruled by coach). Test weekdays are calendar facts: 2026-10-19 Mon, 10-20 Tue,
//        10-22 Thu, 10-24 Sat, 10-04 and 09-27 Sun. The trial is found by SUBTYPE (the
//        case-sensitive TIME TRIAL the pin finder reads), never by position. Card strings are
//        coach's verbatim text; 11:00 over 1.5 mi is 440 s/mi = 7:20 by hand. The Tuesday
//        shakeout's dose is the untagged easy LSD of the same cfg built WITHOUT the test pin
//        (the pre-move card), and 2.3 mi by the T table's easy-array arithmetic (easy start
//        1.625, 2.1 2.6 3.1, peak 3.1 x 0.7333 = 2.3). HALF_MANNY is V206's shipped digest
//        (0ac7da6b1691a8e1): D106a moves no NRC card. NRC keeps Race Day, and a bike LSD on an
//        NRC multi-sport eve keeps the title it had (the refuted premise that led to the guard).
//   SCOPING: T, F2 and B build with the LENGTH pin only (_raceDateCappedWeeks). With the test
//   pin as well, slice B turns week tw into the test week, which is D's claim, not theirs.
//
// VERSION PREDICATE (standing ruling 4). D106a ships on ia-version 207. Below 207 every
// row is NOT APPLICABLE and skipped, never a bare PASS.
'use strict';
process.env.TZ = 'America/New_York';
const path = require('path');
const { load, progDigest } = require(path.join(__dirname, '..', 'harness.js'));
const ART = process.argv[2] || path.join(__dirname, '..', '..', 'index.html');
const BASEFILE = process.argv[3] || null;
const IA = load(ART);
const VER = +IA.version;
const D106A_ERA = 207;

let pass = 0, fail = 0, skip = 0;
function ok(label, cond, got){
  if(cond){ pass++; console.log('PASS ' + label); }
  else { fail++; console.log('FAIL ' + label + (got === undefined ? '' : ' (got ' + got + ')')); }
}
function eq(label, got, want){
  ok(label + ' == ' + JSON.stringify(want), JSON.stringify(got) === JSON.stringify(want), JSON.stringify(got));
}
function skipRow(label){ skip++; console.log('SKIP ' + label); }
function summary(){ console.log('\nPASS ' + pass + ' FAIL ' + fail); process.exit(fail ? 1 : 0); }

const ROWS = ['Z0','H1','H2','H3','H4','H5','H6','H7','H8','H9','F1','F2','F3',
  'T1..T8 (a hand series, b Taper set, c dip set, f finite)','B6','B7','B8','B11',
  'D1','D2','D3','D4','D5','D6','D7','D8','D9','D10','D11','D12',
  'G1','G2','G3','G4','G5','G6','G7'];
if(VER < D106A_ERA){
  console.log('NOT APPLICABLE: ia-version ' + VER + ' predates D106a (V' + D106A_ERA + ').');
  for(const r of ROWS) skipRow(r + ' skipped below the D106a era');
  summary();
}

// ── ERA ROWS: how a run card names its quality session (standing ruling 4) ───────────
// Keyed to the RULING, D103a, which ships on ia-version 208, not to the version this gate
// shipped on. Through 207 the two NSW quality runs are named "Interval (INT)" and
// "Continuous High Intensity (CHI)" and carry no key, so a card is read by its name.
// From 208 the same two cards are named "Short Interval (SI)" and "Long Interval (LI)" and
// every NSW run card carries dose.key; a card is read by its key (int / chi), and E1
// requires its NSW name to agree with that key on every run card read, so every claim
// below is still about the named card the athlete sees. D103a moved words, not days: no
// expectation in this file changes with the era. A version with no row is a named FAIL.
const RUN_CARD_ERAS = [
  { hi: 207, name: { int: /^Interval \(INT\)/, chi: /^Continuous High Intensity \(CHI\)/ }, key: null },
  { lo: 208, name: { int: /^Short Interval \(SI\)/, chi: /^Long Interval \(LI\)/ }, key: { int: 'int', chi: 'chi' } }
];
const CARD_ROWS = RUN_CARD_ERAS.filter(r => (r.lo === undefined || VER >= r.lo) && (r.hi === undefined || VER <= r.hi));
if(CARD_ROWS.length !== 1){
  ok('E0 ia-version ' + VER + ' reads its run cards through exactly one era row', false, CARD_ROWS.length + ' rows match');
  summary();
}
const CARD = CARD_ROWS[0];
console.log('NOTE run cards read through the ' + (CARD.key ? '208+ row (D103a names, dose.key)' : '207- row (INT / CHI names)'));
let cardsRead = 0, cardSplit = 0; const cardSplitAt = [];
function runQuality(c){
  const s = String(c.subtype || '');
  const byName = CARD.name.int.test(s) ? 'int' : CARD.name.chi.test(s) ? 'chi' : null;
  if(!CARD.key) return byName;
  const k = c.dose && c.dose.key;
  const byKey = k === CARD.key.int ? 'int' : k === CARD.key.chi ? 'chi' : null;
  cardsRead++;
  if(byKey !== byName){ cardSplit++; if(cardSplitAt.length < 4) cardSplitAt.push(s + ' key=' + k); }
  return byKey;
}
// Bike and swim cards were not renamed by D103a and carry no key; they keep the names they
// have always had, in every era. Run cards go through the era row.
const BIKE_SWIM_CARD = { int: /^Interval \(INT\)/, chi: /^Continuous High Intensity \(CHI\)/ };
const cardQuality = c => !c ? null : c.type === 'run' ? runQuality(c)
  : BIKE_SWIM_CARD.int.test(String(c.subtype || '')) ? 'int'
  : BIKE_SWIM_CARD.chi.test(String(c.subtype || '')) ? 'chi' : null;

const DAYS = ['mon','tue','wed','thu','fri','sat','sun'];
const B = 2.5;
function pinned(over){
  return Object.assign({
    primaryPath:'event', eventTargeted:true, raceDate:'2026-10-19',
    cardioTypes:['run'],
    cardioGoals:{ run:{ id:'run_pace_goal', label:'Hit a Pace / Time Goal',
      mileBestMins:'8', mileBestSecs:'15', mileBestSrc:{kind:'entered'},
      targetDist:'1.5', targetMins:'11', targetSecs:'0', paceUnit:'mi' } },
    liftingFocus:'balanced', experience:'intermediate', ageBracket:'18-35',
    equipment:'home_full', unit:'lbs', restDays:['sun','wed'],
    days:['sun','mon','tue','wed','thu','fri','sat'],
    bench:185, squat:255, deadlift:315, name:'PRT TING', startDate:'2026-09-21', seed:24865
  }, over || {});
}
function cardsOf(p, w){
  const out = [];
  for(const d of DAYS){ const day = p.weeks[w] && p.weeks[w][d]; if(!day || !day.cardio) continue;
    for(const c of [].concat(day.cardio)) if(c) out.push(c); }
  return out;
}
const isLSD = c => /^Long Slow Distance \(LSD\)/.test(String(c.subtype || ''));
function longOf(p, w){
  const ds = cardsOf(p, w).filter(isLSD).map(c => parseFloat(String(c.detail || '')));
  return ds.length ? Math.max(...ds) : null;
}
function taperSet(p){
  const s = [];
  for(let w = 1; w <= p.totalWeeks; w++) if(cardsOf(p, w).some(c => /Taper/.test(String(c.subtype || '')))) s.push(w);
  return s;
}
function build(cfg){ try { return IA.buildProgram(cfg); } catch(e){ return {crash: e.message}; } }

// ── Z0 — the DST rows below are live only if this process really observes DST ─────────
const offMar2 = new Date(2026, 2, 2).getTimezoneOffset(), offMar9 = new Date(2026, 2, 9).getTimezoneOffset();
ok('Z0 TZ America/New_York observes the 2026-03-08 spring-forward (offset ' + offMar2 + ' -> ' + offMar9 + ')', offMar2 !== offMar9);

// ── H — hand date table for testWeekIndex ─────────────────────────────────────────────
let twi = null;
try { twi = IA.eval('typeof testWeekIndex === "function" ? testWeekIndex : null'); } catch(e){ twi = null; }
const H = [
  ['H1 Mon 2026-09-21 start, Mon test four weeks later', '2026-09-21', '2026-10-19', 5],
  ['H2 Sunday test, the day before that Monday',        '2026-09-21', '2026-10-18', 4],
  ['H3 test in the start week (Thu)',                    '2026-09-21', '2026-09-24', 1],
  ['H4 test before the start',                           '2026-09-21', '2026-09-18', null],
  ['H5 same Monday week but the test precedes a Wed start', '2026-09-23', '2026-09-21', null],
  ['H6 partial week 1: Wed start, Mon test is Monday arithmetic (not 26 days / 7)', '2026-09-23', '2026-10-19', 5],
  ['H7 US fall-back 2026-11-01 inside the span (g195 row start)', '2026-10-05', '2026-11-02', 5],
  ['H8 US spring-forward 2026-03-08 inside the span (a 6d23h week)', '2026-03-02', '2026-03-09', 2],
  ['H9 unreadable test date',                            '2026-09-21', 'soon', null],
];
if(!twi){ for(const [lab] of H) ok(lab + ': testWeekIndex exists', false, 'undefined'); }
else for(const [lab, s, t, want] of H){ let got; try { got = twi(s, t); } catch(e){ got = 'THREW ' + e.message; } eq(lab, got, want); }

// ── F — the 5-week PRT TING fixture against the same cfg without the pins ─────────────
const p5 = build(pinned({_raceDateCappedWeeks:5, _testWeek:5}));
const p0 = build(pinned());
if(p5.crash || p0.crash){ ok('F1-F3 fixture builds', false, p5.crash || p0.crash); }
else {
  ok('F1 pinned build is 5 weeks and the unpinned build is the 11-week goal length',
     p5.totalWeeks === 5 && !p5.weeks[6] && p0.totalWeeks === 11, p5.totalWeeks + '/' + p0.totalWeeks);
  const p5n = build(pinned({_raceDateCappedWeeks:5}));   // length pin only (see SCOPING)
  eq('F2 Taper printed on weeks (length pin only)', p5n.crash ? p5n.crash : taperSet(p5n), [4, 5]);
  const sig = (p, w) => JSON.stringify(DAYS.map(d => [].concat(((p.weeks[w] || {})[d] || {}).cardio || []).filter(Boolean).map(c => [c.subtype, c.dose])));
  const same = [1, 2, 3].filter(w => sig(p5, w) === sig(p0, w));
  eq('F3 W1-W3 cardio (subtype + dose) equal to the unpinned build, weeks equal', same, [1, 2, 3]);
}

// ── T — the long run and the taper window for tw 1..8 ────────────────────────────────
const LONG_HAND = {1:[2.2], 2:[2.2,1.8], 3:[3,2.6,2.2], 4:[3,3.5,3.0,2.6], 5:[3,3.5,4,3.5,2.9],
  6:[3,3.5,4,4.5,3.9,3.3], 7:[3,3.5,4,4.5,5,4.3,3.7], 8:[3,3.5,4,4.5,5,5.5,4.8,4.0]};
for(let tw = 1; tw <= 8; tw++){
  const p = build(pinned({_raceDateCappedWeeks:tw}));   // length pin only (see SCOPING)
  if(p.crash || p.totalWeeks !== tw){ ok('T' + tw + ' builds ' + tw + ' weeks', false, p.crash || p.totalWeeks); continue; }
  const L = []; for(let w = 1; w <= tw; w++) L.push(longOf(p, w));
  const win = []; for(let w = Math.max(1, tw - 2 + 1); w <= tw; w++) win.push(w);
  eq('T' + tw + 'a long run read off the cards', L, LONG_HAND[tw]);
  eq('T' + tw + 'b Taper-labelled weeks equal the hand window', taperSet(p), win);
  const dips = []; let hi = B;
  L.forEach((v, i) => { if(v < hi) dips.push(i + 1); if(v > hi) hi = v; });
  eq('T' + tw + 'c weeks whose long run dips below max(B, every earlier week)', dips, win);
  const bad = [];
  for(let w = 1; w <= tw; w++) for(const c of cardsOf(p, w)) if(/Infinity|NaN/.test(String(c.detail || '') + JSON.stringify(c.dose || {}))) bad.push('W' + w + ' ' + c.subtype);
  if(tw <= 2) ok('T' + tw + 'f every card finite and every long run strictly below B (' + B + ')',
                 bad.length === 0 && L.every(v => Number.isFinite(v) && v < B), bad.slice(0, 2).join('; ') + ' L=' + JSON.stringify(L));
  else ok('T' + tw + 'f every card finite', bad.length === 0, bad.slice(0, 2).join('; '));
}

// ── B — no move at six weeks and up, scoped to the D106a build pair ───────────────────
const BROWS = [['B6', 6], ['B7', 7], ['B8', 8], ['B11', null]];
if(!BASEFILE){ for(const [r] of BROWS) skipRow(r + ' no baseline passed as argv[3]; the D106a pair diff did not run'); }
else {
  const IB = load(BASEFILE);
  if(!(VER === 207 && +IB.version === 206)){
    for(const [r] of BROWS) skipRow(r + ' scoped to the D106a build pair (candidate 207 vs baseline 206); this pair is ' + VER + ' vs ' + IB.version);
  } else for(const [r, tw] of BROWS){
    const cfg = tw ? pinned({_raceDateCappedWeeks:tw}) : pinned();   // length pin only (see SCOPING)
    let a, b; try { a = JSON.stringify(IA.buildProgram(JSON.parse(JSON.stringify(cfg))).weeks); } catch(e){ a = 'CRASH ' + e.message; }
    try { b = JSON.stringify(IB.buildProgram(JSON.parse(JSON.stringify(cfg))).weeks); } catch(e){ b = 'CRASH ' + e.message; }
    ok(r + ' ' + (tw ? tw + '-week' : 'unpinned 11-week') + ' PRT TING weeks byte-equal to the V206 baseline', a === b && !/^CRASH/.test(a), a.length + ' vs ' + b.length + ' bytes');
  }
}

// ── D — slice B: the test week ────────────────────────────────────────────────────────
const TRIAL_DETAIL = '1.5 mi. Goal 11:00 (7:20/mi).';
const TRIAL_NOTE = 'TEST DAY: Run it like the real thing. Warm up fully. Log your time. It anchors your next block.';
const isTrial = c => !!c && c.type === 'run' && /TIME TRIAL/.test(String(c.subtype || ''));
const isHard = c => { const q = cardQuality(c); return q === 'int' || q === 'chi'; };   // era rows, top of file
function trials(p){ const t = []; for(let w = 1; w <= p.totalWeeks; w++) for(const d of DAYS){ const c = p.weeks[w] && p.weeks[w][d] && p.weeks[w][d].cardio; if(isTrial(c)) t.push(w + d); } return t; }
function runCells(p, w){ return DAYS.filter(d => { const x = p.weeks[w][d]; return x && !x.rest && x.cardio && x.cardio.type === 'run'; }); }
const tpin = over => pinned(Object.assign({_raceDateCappedWeeks:5, _testWeek:5}, over || {}));

const dm = build(tpin());
if(dm.crash){ ok('D1-D4 Monday fixture builds', false, dm.crash); }
else {
  const m = dm.weeks[5].mon, mc = m && m.cardio;
  ok('D1 test Mon 2026-10-19: W5 has exactly one run cell, on Mon, TIME TRIAL, dose dist 1.5, no sections, title Test Day',
     JSON.stringify(runCells(dm, 5)) === '["mon"]' && isTrial(mc) && mc.dose && mc.dose.k === 'dist' && mc.dose.mi === 1.5
       && (m.sections || []).length === 0 && m.title === 'Test Day',
     JSON.stringify({runs: runCells(dm, 5), sub: mc && mc.subtype, dose: mc && mc.dose, secs: (m.sections || []).length, title: m.title}));
  eq('D2 W5 Tue-Sun rest (days that are not rest)', ['tue','wed','thu','fri','sat','sun'].filter(d => !(dm.weeks[5][d] && dm.weeks[5][d].rest)), []);
  const sat4 = dm.weeks[4].sat, fri4 = dm.weeks[4].fri;
  ok('D3 W4 Sat (T-2) is Shakeout with no sections; W4 Fri (T-3) keeps its Primer',
     sat4.title === 'Shakeout' && (sat4.sections || []).length === 0 && (fri4.sections || []).some(s => /^Primer/.test(s.label || '')),
     JSON.stringify({sat: sat4.title, satSecs: (sat4.sections || []).length, fri: (fri4.sections || []).map(s => s.label)}));
  ok('D4 the trial card prints coach\'s text exactly, with no dash in either string',
     !!mc && mc.detail === TRIAL_DETAIL && mc.note === TRIAL_NOTE && !/[-‐-―]/.test(mc.detail + mc.note),
     JSON.stringify({detail: mc && mc.detail, note: mc && mc.note}));
}
const vp = {};
for(const [lab, date, day] of [['D5a Tue', '2026-10-20', 'tue'], ['D5b Thu', '2026-10-22', 'thu'], ['D5c Sat', '2026-10-24', 'sat']]){
  const p = build(tpin({raceDate: date})); vp[day] = p;
  if(p.crash){ ok(lab + ' builds', false, p.crash); continue; }
  eq(lab + ' test ' + date + ': the only TIME TRIAL in the program sits on W5 ' + day, trials(p), ['5' + day]);
}
if(vp.sat && !vp.sat.crash){ const t = vp.sat.weeks[5].thu; ok('D6 Sat test: Thu (T-2) holds no INT or CHI', !(t && isHard(t.cardio)), t && t.cardio && t.cardio.subtype); }
else ok('D6 Sat test builds', false);
if(vp.tue && !vp.tue.crash){
  const pre = build(pinned({_raceDateCappedWeeks:5, raceDate:'2026-10-20'}));   // no test pin: the pre-move week
  const preEasy = pre.crash ? null : pre.weeks[5].fri.cardio;
  const mo = vp.tue.weeks[5].mon;
  ok('D7a Tue test: Mon (T-1) holds no INT; it is the untagged easy LSD, titled Shakeout',
     !!(mo && mo.cardio) && !isHard(mo.cardio) && mo.cardio.subtype === 'Long Slow Distance (LSD)' && mo.title === 'Shakeout',
     JSON.stringify({sub: mo && mo.cardio && mo.cardio.subtype, title: mo && mo.title}));
  ok('D7b the shakeout dose equals the pre-move untagged easy LSD (W5 Fri without the test pin), 2.3 mi by hand',
     !!preEasy && preEasy.subtype === 'Long Slow Distance (LSD)' && !!(mo && mo.cardio)
       && JSON.stringify(mo.cardio.dose) === JSON.stringify(preEasy.dose) && mo.cardio.dose.mi === 2.3,
     JSON.stringify({shakeout: mo && mo.cardio && mo.cardio.dose, pre: preEasy && preEasy.dose}));
  eq('D7c Tue test: Wed-Sun rest (days that are not rest)', ['wed','thu','fri','sat','sun'].filter(d => !(vp.tue.weeks[5][d] && vp.tue.weeks[5][d].rest)), []);
} else ok('D7 Tue test builds', false);
for(const [lab, tw, date] of [['D8a three-run tw1', 1, '2026-09-27'], ['D8b three-run tw2', 2, '2026-10-04']]){
  const rest3 = ['sun','tue','thu','sat'];
  const p = build(pinned({restDays:rest3, _raceDateCappedWeeks:tw, _testWeek:tw, raceDate:date}));
  const pre = build(pinned({restDays:rest3, _raceDateCappedWeeks:tw, raceDate:date}));
  if(p.crash || pre.crash){ ok(lab + ' builds', false, p.crash || pre.crash); continue; }
  const preSub = DAYS.map(d => pre.weeks[tw][d] && pre.weeks[tw][d].cardio ? pre.weeks[tw][d].cardio.subtype : null);
  const preQ = DAYS.map(d => pre.weeks[tw][d] && pre.weeks[tw][d].cardio ? cardQuality(pre.weeks[tw][d].cardio) : null);
  const wk = p.weeks[tw];
  const lsd = DAYS.filter(d => wk[d] && !wk[d].rest && wk[d].cardio && /^Long Slow Distance/.test(wk[d].cardio.subtype || ''));
  // V213 (D113a) ERA ROWS (standing ruling 4). Through 212 the three-run week is easy / INT / long and
  // the row below is the one D106a shipped. From 213 it is INT / CHI / long, so the premise is gone by
  // ruling and the row asserts what D106a's hierarchy does with the new week.
  if(VER <= 212)
  ok(lab + ' Sunday test: premise holds (no CHI dealt, INT on Mon); the trial is on Sun, Mon rests, no INT left, both LSDs kept',
     !preQ.some(q => q === 'chi') && preQ[0] === 'int'
       && JSON.stringify(trials(p)) === JSON.stringify([tw + 'sun']) && !!wk.mon && !!wk.mon.rest
       && !DAYS.some(d => wk[d] && isHard(wk[d].cardio)) && JSON.stringify(lsd) === '["wed","fri"]',
     JSON.stringify({pre: preSub, trials: trials(p), mon: wk.mon && wk.mon.title, lsd}));
  else {
    const preW = pre.weeks[tw];
    const preLong = DAYS.some(d => preW[d] && preW[d].cardio && /^Long Slow Distance/.test(preW[d].cardio.subtype || '') && !!preW[d].cardio.legLoad);
    const TI = DAYS.indexOf('sun');
    const intLeft = DAYS.filter(d => wk[d] && !wk[d].rest && cardQuality(wk[d].cardio) === 'int');
    const chiLeft = DAYS.filter(d => wk[d] && !wk[d].rest && cardQuality(wk[d].cardio) === 'chi');
    const hardAt = d => { const x = wk[d]; const c = x && !x.rest && x.cardio; return !!c && (isHard(c) || isTrial(c) || (/^Long Slow Distance/.test(c.subtype || '') && !!c.legLoad)); };
    const hard12 = ['fri','sat'].filter(hardAt);   // T-2 and T-1 of a Sunday test, same ISO week
    ok(lab + ' Sunday test (D113a era): premise INT + CHI + long dealt; the trial takes the CHI slot on Sun and nowhere else, no CHI left, '
       + 'any INT left sits 3 or more days before the trial, 0 hard runs at T-1/T-2',
       preQ.includes('int') && preQ.includes('chi') && preLong
         && JSON.stringify(trials(p)) === JSON.stringify([tw + 'sun']) && chiLeft.length === 0
         && intLeft.every(d => TI - DAYS.indexOf(d) >= 3) && hard12.length === 0,
       JSON.stringify({pre: preSub, trials: trials(p), intLeft, chiLeft, hard12}));
  }
}
// D8c / D8d (V213, D113a era): a SPACER calendar keeps the fallback week, easy / INT / long, and deals no
// CHI, so D106a's hierarchy puts the trial in the INT slot. Mon/Tue/Wed training, Thursday test. The
// calendar is one of D113a's 7 spacer calendars (g213 derives them from the D130 text); the premise is
// asserted in the row, so a week that stops dealing the fallback fails here by name.
for(const [lab, tw, date] of [['D8c spacer Mon/Tue/Wed tw1', 1, '2026-09-24'], ['D8d spacer Mon/Tue/Wed tw2', 2, '2026-10-01']]){
  if(VER < 213){ skipRow(lab + ' is a D113a-era row (the spacer fallback ships on ia-version 213)'); continue; }
  const restS = ['thu','fri','sat','sun'];
  const p = build(pinned({restDays:restS, _raceDateCappedWeeks:tw, _testWeek:tw, raceDate:date}));
  const pre = build(pinned({restDays:restS, _raceDateCappedWeeks:tw, raceDate:date}));
  if(p.crash || pre.crash){ ok(lab + ' builds', false, p.crash || pre.crash); continue; }
  const preW = pre.weeks[tw], wk = p.weeks[tw];
  const q = (W, d) => W[d] && !W[d].rest && W[d].cardio ? cardQuality(W[d].cardio) : null;
  const isLongLSD = c => !!c && /^Long Slow Distance/.test(c.subtype || '') && !!c.legLoad;
  const preQ = DAYS.map(d => q(preW, d));
  const preLong = DAYS.some(d => preW[d] && !preW[d].rest && isLongLSD(preW[d].cardio));
  const intLeft = DAYS.filter(d => q(wk, d) === 'int'), chiLeft = DAYS.filter(d => q(wk, d) === 'chi');
  const hard12 = ['tue','wed'].filter(d => { const x = wk[d]; const c = x && !x.rest && x.cardio; return !!c && (isHard(c) || isTrial(c) || isLongLSD(c)); });
  ok(lab + ' Thursday test (D113a spacer fallback): premise easy + INT + long dealt with no CHI; the trial takes the INT slot on Thu and nowhere else, '
     + 'no INT or CHI left in the test week, 0 hard runs at T-1/T-2',
     preQ.filter(x => x === 'int').length === 1 && !preQ.includes('chi') && preLong
       && JSON.stringify(trials(p)) === JSON.stringify([tw + 'thu']) && intLeft.length === 0 && chiLeft.length === 0 && hard12.length === 0,
     JSON.stringify({pre: DAYS.map(d => preW[d] && preW[d].cardio ? String(preW[d].cardio.subtype).slice(0, 22) : null), trials: trials(p), intLeft, chiLeft, hard12}));
}
let hm; try { hm = progDigest(IA.buildProgram(JSON.parse(JSON.stringify(IA.fixtures.HALF_MANNY)))); } catch(e){ hm = 'CRASH ' + e.message; }
eq('D9 HALF_MANNY digest is V206\'s shipped digest (D106a moves no NRC card)', hm, '0ac7da6b1691a8e1');
function markerDays(p){
  const flat = []; [p.totalWeeks - 1, p.totalWeeks].forEach(w => { if(p.weeks[w]) DAYS.forEach(d => flat.push({w, d})); });
  const ri = flat.findIndex(x => { const y = p.weeks[x.w][x.d]; return y && y.cardio && /RACE DAY|TIME TRIAL/i.test(y.cardio.subtype || ''); });
  return {flat, ri};
}
const nrcBase = Object.assign({}, IA.fixtures.HALF_MANNY, {restDays:['sun'], seed:76308});
const ntt = build(Object.assign({}, nrcBase, {cardioGoals:{run:{id:'run_5k', label:'5K', mileBestMins:'10', mileBestSecs:'30'}}, eventTargeted:false, raceDate:''}));
if(ntt.crash) ok('D10 NRC 5K time trial builds', false, ntt.crash);
else { const {flat, ri} = markerDays(ntt); const x = ri >= 0 ? ntt.weeks[flat[ri].w][flat[ri].d] : null;
  ok('D10 an NRC 5K time trial (no race date) is still titled Race Day', !!x && /TIME TRIAL/.test(x.cardio.subtype) && x.title === 'Race Day', x && x.title); }
const nms = build(Object.assign({}, nrcBase, {cardioTypes:['run','bike'], cardioGoals:{run:{id:'run_5k', label:'5K'}, bike:{id:'bike_base', label:'Bike'}}, eventTargeted:true, raceDate:'2026-11-19'}));
if(nms.crash) ok('D11 NRC 5K + bike builds', false, nms.crash);
else { const {flat, ri} = markerDays(nms); const eves = [];
  for(const k of [1, 2]){ const x = ri - k >= 0 ? flat[ri - k] : null; if(!x) continue; const y = nms.weeks[x.w][x.d];
    if(y && !y.rest && y.cardio && y.cardio.type !== 'run' && /^long slow distance/i.test(y.cardio.subtype || '')) eves.push({k, title: y.title, head: String(y.cardio.subtype).split(' — ')[0]}); }
  ok('D11 NRC 5K + bike: the bike LSD on the race eve window keeps its own title, never Shakeout or Easy Run (fixture must hold one)',
     eves.length > 0 && eves.every(e => e.title === e.head), JSON.stringify(eves)); }
if(!BASEFILE){ skipRow('D12 no baseline passed as argv[3]; the NRC confinement diff did not run'); }
else {
  const IB2 = load(BASEFILE);
  if(!(VER === 207 && +IB2.version === 206)) skipRow('D12 scoped to the D106a build pair (candidate 207 vs baseline 206); this pair is ' + VER + ' vs ' + IB2.version);
  else {
    const RACE = {run_5k:'2026-11-19', run_10k:'2026-11-21', run_half:'2026-12-26', run_marathon:'2027-01-24'};
    let n = 0; const moved = [];
    for(const g of Object.keys(RACE)) for(const T of [['run'], ['run','bike'], ['run','swim']]) for(const R of [['sun'], ['sun','wed']]) for(const evt of [true, false]){
      const cfg = Object.assign({}, nrcBase, {cardioTypes:T, restDays:R, eventTargeted:evt, raceDate: evt ? RACE[g] : '',
        cardioGoals: Object.assign({run:{id:g, label:g}}, T.includes('bike') ? {bike:{id:'bike_base', label:'Bike'}} : {}, T.includes('swim') ? {swim:{id:'swim_base', label:'Swim'}} : {})});
      let a, b; try { a = JSON.stringify(IA.buildProgram(JSON.parse(JSON.stringify(cfg))).weeks); } catch(e){ a = 'CRASH ' + e.message; }
      try { b = JSON.stringify(IB2.buildProgram(JSON.parse(JSON.stringify(cfg))).weeks); } catch(e){ b = 'CRASH ' + e.message; }
      n++; if(a !== b || /^CRASH/.test(a)) moved.push(g + ' ' + T.join('+') + ' [' + R + '] ' + evt);
    }
    ok('D12 NRC confinement: ' + n + ' NRC builds (4 goals x run, run+bike, run+swim x 2 rest sets x dated/undated) byte-equal to V206', moved.length === 0, moved.length + ' moved: ' + moved.slice(0, 3).join('; '));
  }
}

// ── G — doGenerate writes the pins onto the stored program ────────────────────────────
function gen(fields){
  IA.eval('Object.assign(WD, ' + JSON.stringify(fields) + ')');
  IA.eval('doGenerate()');
  const sub = IA.eval("document.getElementById('generateSub').textContent");
  IA.flushTimers();
  const ps = IA.eval('getPrograms()');
  return { sub, prog: ps[ps.length - 1], n: ps.length };
}
let gOk = true;
try {
  IA.eval("(function(){ const o = document.getElementById; const m = {}; document.getElementById = function(id){ return m[id] || (m[id] = o.call(document, id)); }; })()");
  IA.eval('WD');
} catch(e){ gOk = false; ok('G0 doGenerate driveable in the harness VM', false, e.message); }
if(gOk){
  const base = pinned(); delete base.seed;
  const runs = [
    ['G1 dated test goal, start Mon 2026-09-21, test Mon 2026-10-19', Object.assign({}, base, {seed:24865}), 5, 5, '2026-09-21', 'Building your 5-week program...'],
    ['G2 same WD, no date (a pin from G1 must not survive)', {eventTargeted:false, raceDate:''}, null, 11, '2026-09-21', 'Building your 11-week program...'],
    ['G3 test before the start', {eventTargeted:true, raceDate:'2026-09-14'}, null, 11, '2026-09-21', null],
    ['G4 test past the goal length (D138, out of scope)', {eventTargeted:true, raceDate:'2026-12-28'}, null, 11, '2026-09-21', null],
    ['G5 snapped start: Sun 2026-09-27 with Sunday rest resolves to Mon 2026-09-28, test is week 4', {eventTargeted:true, raceDate:'2026-10-19', startDate:'2026-09-27'}, 4, 4, '2026-09-28', 'Building your 4-week program...'],
  ];
  let before = IA.eval('getPrograms().length');
  for(const [lab, f, tw, len, start, sub] of runs){
    let r; try { r = gen(f); } catch(e){ ok(lab, false, 'THREW ' + e.message); continue; }
    if(!r.prog || r.n !== before + 1){ ok(lab + ': a program was stored', false, r.n + ' stored'); continue; }
    before = r.n;
    const c = r.prog.cfg || {};
    ok(lab + ': stored cfg carries _testWeek=' + tw + ' and _raceDateCappedWeeks=' + len + ', totalWeeks ' + len + ', start ' + start,
       Object.prototype.hasOwnProperty.call(c, '_testWeek') && c._testWeek === tw && c._raceDateCappedWeeks === len
         && r.prog.totalWeeks === len && r.prog.startDate === start,
       JSON.stringify({_testWeek:c._testWeek, capped:c._raceDateCappedWeeks, totalWeeks:r.prog.totalWeeks, start:r.prog.startDate}));
    if(sub) eq(lab + ': the generate screen names the length that builds', r.sub, sub);
  }
  const outs = [
    ['G6 run_base with a date has no test week', {startDate:'2026-09-21', raceDate:'2026-10-19', eventTargeted:true,
      cardioGoals:{run:{id:'run_base', label:'Build Running Base', baselineDist:'2', baseline:'2mi'}}}],
    ['G7 an NRC race goal with a date has no test week (raceAlignment owns it)', {startDate:'2026-09-21', raceDate:'2026-11-22', eventTargeted:true,
      cardioGoals:{run:{id:'run_5k', label:'5K', mileBestMins:'8', mileBestSecs:'15'}}}],
  ];
  for(const [lab, f] of outs){
    let r; try { r = gen(f); } catch(e){ ok(lab, false, 'THREW ' + e.message); continue; }
    const c = (r.prog && r.prog.cfg) || {};
    ok(lab + ': stored _testWeek null and the length is not capped to week 5',
       r.n === before + 1 && c._testWeek === null && c._raceDateCappedWeeks === r.prog.totalWeeks && r.prog.totalWeeks !== 5,
       JSON.stringify({n:r.n, _testWeek:c._testWeek, capped:c._raceDateCappedWeeks, totalWeeks:r.prog && r.prog.totalWeeks}));
    before = r.n;
  }
}
// ── E1 the 208+ row reads the key, and the key must say what the name says ──────────
if(CARD.key) ok('E1 every run card read at ia-version ' + VER + ' names the same quality session in its NSW name and its dose.key (' + cardsRead + ' run cards)',
  cardsRead > 0 && cardSplit === 0, cardSplit + ' disagree: ' + cardSplitAt.join(' | '));
summary();
