// g206_d137_runbase_chi.js — the gate for D137 (amended; Mario concurred "hold at 20"):
// run_base's Steady Aerobic Run (the CHI limb, one continuous piece) holds on Table 6's
// last single-piece CHI row from week 13 on, instead of reading the two-piece rows'
// per-piece minutes (12) as if they were one continuous run.
//
// ORACLES, all independent of the engine:
//   * S1 is the RULING'S HAND SERIES, typed from coach's after-grid for the 16-week
//     run_base config below. Minutes are read off the CARD detail ("N min steady"),
//     never from getCHI, so the gate checks what the athlete reads.
//   * S2 re-derives the cap from the DOCTRINE TEXT: Table 6 CHI rows 1-12 must read
//     15 15 16 16 17 17 18 18 19 19 20 20, and the cap is (first row whose CHI column
//     reads "2 x") minus 1. The call site's literal must equal that number. doctrine/ is
//     gitignored; if it is absent S2 is NOT RUN and counted as a FAIL, never a pass.
//   * S3 is the SITING claim in its two named wrong forms: 12 is V205's per-piece
//     minutes printed as one piece; 14 is the week-argument clamp that moved the cutback
//     clock (measured wrong on 70/1,836, tests/measure/v206_d137_runbase_chi.js).
//   * S4 is the PACE CONTROL. S4a: PRT TING (tests/measure/v202_run_path_B.js) is
//     unmoved against the baseline file, scoped to the D137 build pair only (candidate
//     206, baseline 205) per standing ruling 4. S4b: PRT TING without an event prints
//     Table 6 rows 1-11 with the hand cutback arithmetic (16*0.7=11.2->11,
//     18*0.7=12.6->13), confirmed identical on V205 before D137 was built. S4c: PRT TING
//     is 11 weeks and never reaches the capped rows, so it cannot see the cap leak off
//     run_base. A pace goal with bike_50 runs 14 weeks with a run CHI card in weeks 13
//     and 14, and those must print Table 6 rows 13-14 (2 x 12).
//
// VERSION PREDICATE (standing ruling 4). D137 ships on ia-version 206. Below 206 every
// row is NOT APPLICABLE and skipped, never a bare PASS. No env escape: no other gate
// in this repo uses one, and the slice 4 meta bump is what activates this gate.
'use strict';
const path = require('path');
const fs = require('fs');
const { load, fixtures } = require(path.join(__dirname, '..', 'harness.js'));
const ART = process.argv[2] || path.join(__dirname, '..', '..', 'index.html');
const BASEFILE = process.argv[3] || null;
const IA = load(ART);
const VER = +IA.version;
const D137_ERA = 206;

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

const ROWS = ['S1a','S1b','S1c','S1d','S2a','S2b','S2c','S3','S4a','S4b','S4c'];
if(VER < D137_ERA){
  console.log('NOT APPLICABLE: ia-version ' + VER + ' predates D137 (V' + D137_ERA + ').');
  for(const r of ROWS) skipRow(r + ' skipped below the D137 era');
  summary();
}

const DAYS = ['sun','mon','tue','wed','thu','fri','sat'];
function cardsOf(p, pred){
  const out = {};
  for(let w = 1; w <= p.totalWeeks; w++) for(const d of DAYS){
    const day = p.weeks[w] && p.weeks[w][d]; if(!day || !day.cardio) continue;
    for(const c of [].concat(day.cardio)) if(c && pred(c)) (out[w] = out[w] || []).push(String(c.detail || '').replace(/\s+/g, ' '));
  }
  return out;
}
function seriesOf(p, pred, read){
  const cs = cardsOf(p, pred), s = [];
  for(let w = 1; w <= p.totalWeeks; w++) s.push(cs[w] ? cs[w].map(read).join('/') : '-');
  return s;
}

// ── S1 — the ruling's 16-week run_base series, read off the cards ────────────────
// cfg shape from tests/measure/v206_d137_runbase_chi.js mkCfg (run-only, intermediate,
// 55+, baselineDist 0.1, rest sun/wed, seed 76308, race date 2027-06-01 when evented).
function rbCfg(evt){
  return Object.assign({}, fixtures.HALF_MANNY, {name:'RB', primaryPath:'fitness', cardioTypes:['run'],
    cardioGoals:{run:{id:'run_base', label:'Build Running Base', baselineDist:'0.1', baseline:'0.1mi'}},
    eventTargeted:evt, raceDate:evt ? '2027-06-01' : '', experience:'intermediate', ageBracket:'55+',
    restDays:['sun','wed'], seed:76308});
}
const isSteady = c => c.type === 'run' && /^Steady Aerobic Run/.test(String(c.subtype || ''));
const steadyMin = d => { const m = d.match(/^(\d+) min steady/); return m ? m[1] : '?'; };
const RULING = {
  event:   ['-','15','16','11','17','17','18','13','19','19','20','14','20','20','12','-'],
  noEvent: ['-','15','16','11','17','17','18','13','19','19','20','14','20','20','20','-'],
};
const rbE = IA.buildProgram(rbCfg(true)), rbN = IA.buildProgram(rbCfg(false));
eq('S1a the evented run_base config is 16 weeks (the series below is keyed to it)', rbE.totalWeeks, 16);
eq('S1b the no-event run_base config is 16 weeks', rbN.totalWeeks, 16);
const sE = seriesOf(rbE, isSteady, steadyMin), sN = seriesOf(rbN, isSteady, steadyMin);
eq('S1c evented run_base Steady minutes by week match the ruling\'s hand series', sE, RULING.event);
eq('S1d no-event run_base Steady minutes by week match the ruling\'s hand series', sN, RULING.noEvent);

// ── S2 — the cap, derived from the doctrine text, equals the literal at the call site ─
const DOC = path.join(__dirname, '..', '..', 'doctrine', 'nsw_ptg_sealswcc_11pg.txt');
if(!fs.existsSync(DOC)){
  for(const r of ['S2a','S2b','S2c']){ fail++; console.log('FAIL ' + r + ' NOT RUN: doctrine/nsw_ptg_sealswcc_11pg.txt is absent (gitignored; regenerate it per doctrine/README.md). The cap cannot be derived, and a claim that did not run is not a pass.'); }
} else {
  const rows = [null];
  for(const L of fs.readFileSync(DOC, 'utf8').split('\n')){
    const m = L.match(/^\s*(\d+)\s*\|[^|]*\|[^|]*\|\s*([^|]*?)\s*\|/);
    if(!m) continue;
    const wk = +m[1]; if(wk < 1 || wk > 26 || rows[wk] !== undefined) continue;
    rows[wk] = m[2];
  }
  const single = rows.slice(1, 13).map(c => /^\d+$/.test(c) ? +c : c);
  eq('S2a doctrine Table 6 CHI rows 1-12 are single pieces reading', single, [15,15,16,16,17,17,18,18,19,19,20,20]);
  const firstTwo = rows.findIndex((c, i) => i >= 1 && typeof c === 'string' && /^2\s*x\s*\d+$/.test(c));
  const cap = firstTwo - 1;
  ok('S2b the first two-piece CHI row in the doctrine text is row 13, so the single-piece cap is 12',
     firstTwo === 13 && cap === 12, 'first "2 x" row ' + firstTwo + ', cap ' + cap);
  const SRC = fs.readFileSync(ART, 'utf8').replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
  const lits = SRC.match(/getCHI\(week,[^;\n]*goalId\s*===\s*'run_base'\s*\?\s*(\d+)\s*:\s*0\s*\)/g) || [];
  const lit = lits.length === 1 ? +lits[0].match(/\?\s*(\d+)\s*:/)[1] : null;
  ok('S2c exactly one run call site passes the run_base row cap, and its literal equals the doctrine-derived cap (' + cap + ')',
     lits.length === 1 && lit === cap, lits.length + ' call site(s), literal ' + lit);
}

// ── S3 — siting: weeks 13-15 without an event hold the 20 minute row ─────────────
const bad3 = [];
for(const w of [13, 14, 15]){
  const v = sN[w - 1];
  if(v === '12') bad3.push('W' + w + ' reads 12: the two-piece rows\' per-piece minutes printed as one continuous piece (V205)');
  else if(v === '14') bad3.push('W' + w + ' reads 14: the week argument was clamped, which moves the cutback clock (70/1,836)');
  else if(v !== '20') bad3.push('W' + w + ' reads ' + v);
}
ok('S3 no-event run_base weeks 13, 14 and 15 read 20 (row 12 held), not 12 and not 14', bad3.length === 0, bad3.join(' | '));

// ── S4 — pace control ────────────────────────────────────────────────────────────
// PRT TING, verbatim from tests/measure/v202_run_path_B.js pinned().
function prt(over){
  return Object.assign({
    primaryPath:'event', eventTargeted:true, raceDate:'2026-10-19', cardioTypes:['run'],
    cardioGoals:{ run:{ id:'run_pace_goal', label:'Hit a Pace / Time Goal',
      mileBestMins:'8', mileBestSecs:'15', mileBestSrc:{kind:'entered'},
      targetDist:'1.5', targetMins:'11', targetSecs:'0', paceUnit:'mi' } },
    liftingFocus:'balanced', experience:'intermediate', ageBracket:'18-35',
    equipment:'home_full', unit:'lbs', restDays:['sun','wed'], days:DAYS.slice(),
    bench:185, squat:255, deadlift:315, name:'PRT TING', startDate:'2026-09-21', seed:24865
  }, over || {});
}
const isRunCHI = c => c.type === 'run' && /Continuous High/i.test(String(c.subtype || ''));
const chiDose = d => { const m = d.match(/^(?:(\d+)\s*x\s*)?(\d+)\s*min/); return m ? (m[1] ? m[1] + 'x' + m[2] : m[2]) : '?'; };

// S4a — unmoved against the baseline, scoped to the D137 build pair only.
if(!BASEFILE){
  skipRow('S4a no baseline passed as argv[3]; the D137 pair diff did not run (S4b and S4c still stand)');
} else {
  const IB = load(BASEFILE);
  if(VER !== D137_ERA || +IB.version !== D137_ERA - 1){
    skipRow('S4a scoped to the D137 build pair (candidate 206 vs baseline 205); this pair is ' + VER + ' vs ' + IB.version);
  } else {
    const a = seriesOf(IA.buildProgram(prt()), isRunCHI, chiDose), b = seriesOf(IB.buildProgram(prt()), isRunCHI, chiDose);
    ok('S4a PRT TING (run_pace_goal, 11 weeks, evented) CHI series is identical to the V205 baseline: ' + b.join(' '),
       a.length === 11 && JSON.stringify(a) === JSON.stringify(b), a.join(' '));
  }
}
// S4b — PRT TING without an event: Table 6 rows 1-11 with the hand cutback arithmetic.
const pN = IA.buildProgram(prt({primaryPath:'goal', eventTargeted:false, raceDate:''}));
eq('S4b PRT TING without an event prints Table 6 rows 1-11 with cutbacks at weeks 4 and 8',
   seriesOf(pN, isRunCHI, chiDose), ['15','15','16','11','17','17','18','13','19','19','20']);
// S4c — the pace goal that DOES reach the capped rows must still read rows 13-14.
const pcCfg = Object.assign({}, fixtures.HALF_MANNY, {name:'PG', primaryPath:'fitness', cardioTypes:['run','bike'],
  cardioGoals:{run:{id:'run_pace_goal', label:'Hit a Pace / Time Goal', mileBestMins:'8', mileBestSecs:'15',
    targetDist:'1.5', targetMins:'11', targetSecs:'0', paceUnit:'mi'}, bike:{id:'bike_50', label:'bike_50'}},
  eventTargeted:false, raceDate:'', experience:'beginner', ageBracket:'36-54', restDays:['sun','wed'], seed:76308});
const pc = IA.buildProgram(pcCfg);
const sPC = seriesOf(pc, isRunCHI, chiDose);
ok('S4c run_pace_goal + bike_50 (14 weeks, no event) prints Table 6 rows 13-14 (2 x 12) in weeks 13 and 14: the cap stays on run_base',
   pc.totalWeeks === 14 && sPC[12] === '2x12' && sPC[13] === '2x12', 'tw ' + pc.totalWeeks + ', series ' + sPC.join(' '));

summary();
