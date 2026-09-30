// g225_d186_clockend.js — GATE for D186 (P-CLOCKEND): the block target is the last build week's
// pace; the taper holds it; the note names it; the coach amendment's copy guard drops the
// "needs more weeks" sentence when the goal and the block target round to the identical m:ss.
//
//   node tests/gates/g225_d186_clockend.js <candidate.html>
//   IA_ASSUME_VERSION=225 node tests/gates/g225_d186_clockend.js <tree stamped 224>   (discrimination run only)
//
// THE RULING THIS DEFENDS: tests/measure/v225_rulings/d186_d187_pacerate_clockend_v225.md, D186 section
// ("What changes: E1, E2, the comment") and the amendment's item (2) ("The redundant note: a copy guard,
// string equality, no constant"). D-code D186. Evidence: measure's v225_clockend_lattice.js (10,080 cells,
// hand==engine 10080/10080) and the amendment's flip re-count (164/10,080, CEb the ruled arm).
//
// ORACLES (never the engine's own `_realisticTarget`/`_originalTarget` alone):
//   bw          hand taperWeeksFor: dated -> Math.max(2, Math.round(L*0.12)), undated -> 0. This mirrors the
//               engine's OWN taperWeeksFor formula (a different, un-suspect function; buildRunProgressionForLength
//               never calls it) typed independently here, then cross-checked against the program's own
//               p.taperWeeks.length as a control (TAPER CONTROL row) so a formula drift is visible.
//   handMet     pp.arr[0] - enteredGoalSecsPerMile <= 0, cross-checked against the engine's own `_goalMet`.
//   fmt         a hand m:ss formatter (round, floor/mod), never the engine's `_clkMS`.
//   note text   read from the built program's actual INT session `.note` string via regex, never re-derived
//               from the engine's own pp array.
//
// GATES (from the ruling, "Gate D186"):
//   G1  not-met cells: pp[bw-1] == pp._realisticTarget (0.1s), AND the printed "target for this block is
//       X/mi" equals fmt(pp[bw-1]) when such a note was printed.
//   G2  every taper week (index >= bw) == pp[bw-1] (0.1s).
//   G3  (the metric that separates the correct two-line fix from a broken one-line fix): un-dampened
//       not-met cells land ON the entered goal: pp[bw-1] == pp._originalTarget (0.1s).
//   G4  goal-met cells: every week == the initial pace (pp[0]), unchanged (E7).
//   COPY_GUARD  the amendment's item (2): for every dampened not-met cell, the printed note contains
//       "needs more weeks" iff fmt(pp._originalTarget) != fmt(pp[bw-1]). The dedicated SAMEFMT cell
//       reproduces coach's own example (beginner 55+, no mile, goal 11:20, +8w dated) to exercise the
//       TRUE branch; the other dampened cells in the sample exercise the FALSE branch.
//
// VERSION PREDICATE (standing rulings 2 and 4). D186 ships at 225.
//   below 225   REFUSED, every row FAILS by name.
//   225 and up  every row asserts.
//   IA_ASSUME_VERSION=225 lifts a file stamped exactly 224 to 225 for a discrimination run (not a ship proof).
//   On the real V224 tree this reproduces the ruling's finding: G1 fails (the note names a pace no build
//   week prints), G3 fails on every un-dampened not-met cell (the goal is never prescribed before the taper).
'use strict';
const path = require('path');
const H = require(path.join(__dirname, '..', 'harness.js'));
const ROOT = path.join(__dirname, '..', '..');
const ART = path.resolve(process.argv[2] || path.join(ROOT, 'index.html'));
const ERA = 225;

let pass = 0, fail = 0;
const t0 = Date.now();
const ok = (l, c, g) => { if(c){ pass++; console.log('PASS ' + l + (g === undefined ? '' : ' (' + g + ')')); } else { fail++; console.log('FAIL ' + l + (g === undefined ? '' : ' (got ' + g + ')')); } };
const done = () => { console.log('  runtime ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s'); console.log('\nPASS ' + pass + ' FAIL ' + fail); process.exit(fail ? 1 : 0); };

let STAMP = NaN;
try { STAMP = +H.load(ART).version; } catch(e){ console.log('FAIL boot: ' + e.message); fail++; done(); }
let VER = STAMP;
if(process.env.IA_ASSUME_VERSION === String(ERA) && STAMP === ERA - 1){
  VER = ERA; console.log('ASSUMED ia-version ' + ERA + ' on a file stamped ' + STAMP + ' (IA_ASSUME_VERSION): a discrimination run, not a ship proof');
} else if(process.env.IA_ASSUME_VERSION !== undefined){
  console.log('IA_ASSUME_VERSION=' + process.env.IA_ASSUME_VERSION + ' IGNORED (it lifts only a file stamped exactly ' + (ERA - 1) + ' to ' + ERA + ')');
}
console.log('g225 D186 clockend | candidate ' + ART + ' ia-version ' + STAMP + (VER !== STAMP ? ' (assumed ' + VER + ')' : ''));

const ROW_LABELS = ['G1a last==realisticTarget', 'G1b note==fmt(last)', 'G2 taper==last', 'G3 undamp last==goal', 'G4 met all==W1', 'COPY_GUARD sameFmt<->no-needs-more-weeks', 'COPY_GUARD PIN three-conjunct proof', 'TAPER CONTROL hand==engine', 'MET CONTROL hand==engine'];
if(!(VER >= ERA)){
  console.log('REFUSED: ia-version ' + VER + ' predates D186 P-CLOCKEND (V' + ERA + '). No row may pass on it.');
  ROW_LABELS.forEach(l => ok(l + ' (REFUSED)', false));
  done();
}

// ── the VM: one boot, a __PPS hook on buildRunProgressionForLength (the suspect function itself is
//    never asked to grade its own output; it is only asked to HAND BACK the array the hook reads) ──
const IA = H.load(ART);
(function pinClock(){
  const RD = Date, T = new RD(2026, 8, 22, 21, 16, 0).getTime();
  class FD extends RD { constructor(...a){ if(a.length) super(...a); else super(T); } static now(){ return T; } }
  IA.ctx.Date = FD;
})();
const ELS = new Map(); const MK_EL = IA.window.document.createElement;
IA.window.document.getElementById = id => { if(!ELS.has(id)){ const e = MK_EL('div'); e.id = id; ELS.set(id, e); } return ELS.get(id); };
IA.eval('showToast = function(){};');
IA.eval(`var __PPS={}; (function(){var o=buildRunProgressionForLength; buildRunProgressionForLength=function(){var r=o.apply(this,arguments); var p=r&&r.paceProgression; if(p) __PPS[arguments[1]]={arr:Array.from(p),d:p._dampened,g:p._weeklyGain,rt:p._realisticTarget,ot:p._originalTarget,met:p._goalMet}; return r;};})();`);

const fmt = s => { if(s == null) return '-'; const t = Math.round(s); return Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0'); }; // hand m:ss, never _clkMS
const U = iso => { const [y, m, d] = iso.split('-').map(Number); return Date.UTC(y, m - 1, d); };
const W1MON = '2026-09-21';
const raceFor = wk => new Date(U(W1MON) + ((wk - 1) * 7 + 3) * 864e5).toISOString().slice(0, 10); // Thursday of week `wk`
const DEF = { beginner: 690, intermediate: 570, advanced: 450 }; // D9 defaults, independent of PACE_IMPROVE

function build(o){
  IA.eval(`WD={primaryPath:"event",cardioTypes:["run"],experience:${J(o.exp)},ageBracket:${J(o.age)},eventTargeted:${o.ev ? 'true' : 'false'},raceDate:${J(o.race || '')},liftingFocus:"support_prevention",equipment:"crossfit",restDays:${J(o.rest)},unit:"lbs",seed:24865,name:"M",cardioGoals:{run:${JSON.stringify(o.run)}},startDate:undefined}; __PPS={};`);
  ELS.clear(); IA.localStorage._map.clear(); IA.eval('activeProg=null;');
  let err = null;
  try { IA.eval('doGenerate()'); } catch(e){ err = e.message; }
  IA.flushTimers(Infinity);
  const p = IA.eval('activeProg');
  if(err || !p) return { err: err || 'no program' };
  const L = p.totalWeeks;
  const pp = IA.eval('__PPS')[L];
  if(!pp) return { err: 'no pace progression captured for L=' + L };
  const tgt = [], noteKinds = new Set();
  Object.keys(p.weeks || {}).forEach(w => {
    const W = p.weeks[w];
    Object.keys(W).forEach(d => {
      const c = W[d].cardio;
      (Array.isArray(c) ? c : (c ? [c] : [])).forEach(x => {
        if(x && x.type === 'run' && x.dose && x.dose.key === 'int'){
          const n = String(x.note || '');
          const m = n.match(/target for this block is (\d+:\d\d)\/mi/);
          if(m) tgt.push(m[1]);
          noteKinds.add(/needs more weeks/.test(n) ? 'SI-long' : /Hit the prescribed pace precisely/.test(n) ? 'SI-short' : /already within/.test(n) ? 'MET' : /Zone 5/.test(n) ? 'Z5' : 'OTHER');
        }
      });
    });
  });
  return { L, taper: p.taperWeeks || [], pp, tgt: [...new Set(tgt)], nk: [...noteKinds] };
}
function J(v){ return JSON.stringify(v); }

function cellCfg(c){
  const anchor = (c.exp !== 'beginner' && c.mile) ? c.mile : DEF[c.exp];
  const goalPace = anchor - c.off;
  const dist = c.dist;
  const tot = Math.round(goalPace * dist);
  const run = { id: 'run_pace_goal', label: 'Hit a Pace / Time Goal', targetDist: String(dist), paceUnit: 'mi', targetMins: String(Math.floor(tot / 60)), targetSecs: String(tot % 60), targetTime: fmt(tot) };
  if(c.mile){ run.mileBestMins = String(Math.floor(c.mile / 60)); run.mileBestSecs = String(c.mile % 60); run.mileBestSrc = { kind: 'entered' }; }
  return { o: { exp: c.exp, age: c.age, ev: !!c.dt, race: c.dt ? raceFor(c.dt) : '', rest: c.rest || ['sun', 'wed'], run }, goalPace };
}

// ── representative sample (not the full 10,080-cell lattice; measure already proved that) ──
const CELLS = [
  { lbl: 'SAMEFMT(coach ex)', dist: 1.0, exp: 'beginner', age: '55+', mile: null, off: 10, dt: 8 },       // beginner 55+, no mile, goal 11:20, +8w dated
  { lbl: 'dampened-dated-1', dist: 3.1, exp: 'advanced', age: '55+', mile: 420, off: 100, dt: 12 },
  { lbl: 'dampened-undated-1', dist: 3.1, exp: 'advanced', age: '55+', mile: 420, off: 100, dt: 0 },
  { lbl: 'undamp-dated-1', dist: 1.5, exp: 'intermediate', age: '18-35', mile: 480, off: 10, dt: 8 },
  { lbl: 'undamp-undated-1', dist: 1.5, exp: 'intermediate', age: '18-35', mile: 480, off: 10, dt: 0 },
  { lbl: 'goalmet-1', dist: 1.5, exp: 'intermediate', age: '18-35', mile: 480, off: -20, dt: 8 },
  { lbl: 'sweep-1', dist: 1.5, exp: 'beginner', age: '18-35', mile: null, off: 20, dt: 0 },
  { lbl: 'sweep-2', dist: 1.5, exp: 'beginner', age: '36-54', mile: null, off: 20, dt: 8 },
  { lbl: 'sweep-3', dist: 1.5, exp: 'intermediate', age: '36-54', mile: 480, off: 20, dt: 0 },
  { lbl: 'sweep-4', dist: 1.5, exp: 'intermediate', age: '55+', mile: 480, off: 20, dt: 8 },
  { lbl: 'sweep-5', dist: 1.5, exp: 'advanced', age: '18-35', mile: 420, off: 20, dt: 0 },
  { lbl: 'sweep-6', dist: 1.5, exp: 'advanced', age: '36-54', mile: 420, off: 20, dt: 8 },
  { lbl: 'sweep-7', dist: 1.0, exp: 'intermediate', age: '18-35', mile: 480, off: 15, dt: 4 },
  { lbl: 'sweep-8', dist: 3.1, exp: 'intermediate', age: '18-35', mile: 480, off: 15, dt: 12 },
  { lbl: 'sweep-9', dist: 6.2, exp: 'advanced', age: '18-35', mile: 420, off: 30, dt: 8 },
  { lbl: 'undamp-dated-2', dist: 1.5, exp: 'advanced', age: '18-35', mile: 420, off: 5, dt: 4 },
  { lbl: 'undamp-undated-2', dist: 1.0, exp: 'intermediate', age: '18-35', mile: 480, off: 3, dt: 0 },
];

const bad = { G1a: [], G1b: [], G2: [], G3: [], G4: [], CG: [], TAP: [], MET: [] };
let nMet = 0, nNotMet = 0, nDamp = 0, nUndamp = 0, nTaperChecked = 0, nCG = 0, anyShortForm = false;
const errs = [];
for(const c of CELLS){
  const { o, goalPace } = cellCfg(c);
  const r = build(o);
  if(r.err){ errs.push(c.lbl + ': ' + r.err); continue; }
  const L = r.L, pp = r.pp;
  const handTap = o.ev ? Math.max(2, Math.round(L * 0.12)) : 0;
  nTaperChecked++;
  if((r.taper || []).length !== handTap) bad.TAP.push(c.lbl + ' hand taper ' + handTap + ' engine ' + (r.taper || []).length);
  const bw = L - handTap;
  const handMet = pp.arr[0] - goalPace <= 0;
  if(handMet !== pp.met) bad.MET.push(c.lbl + ' hand ' + handMet + ' engine ' + pp.met);
  if(!pp.met){
    nNotMet++;
    const last = pp.arr[bw - 1];
    if(!(Math.abs(last - pp.rt) <= 0.1)) bad.G1a.push(c.lbl + ' last ' + last + ' rt ' + pp.rt);
    if(r.tgt.length){
      const want = fmt(last);
      if(!(r.tgt.length === 1 && r.tgt[0] === want)) bad.G1b.push(c.lbl + ' note ' + J(r.tgt) + ' want ' + want);
    }
    if(bw < L){
      const p2 = pp.arr.slice(bw).every(v => Math.abs(v - last) <= 0.1);
      if(!p2) bad.G2.push(c.lbl + ' arr ' + pp.arr.map(fmt).join(' ') + ' bw ' + bw);
    }
    if(pp.d) nDamp++; else nUndamp++;
    if(!pp.d){
      if(!(Math.abs(last - pp.ot) <= 0.1)) bad.G3.push(c.lbl + ' last ' + fmt(last) + ' goal ' + fmt(pp.ot) + ' arr ' + pp.arr.map(fmt).join(' '));
    } else {
      // COPY_GUARD: dampened not-met cells are exactly where the sameFmt guard fires or does not.
      nCG++;
      const sameFmt = fmt(pp.ot) === fmt(last);
      const hasLong = r.nk.includes('SI-long'), hasShort = r.nk.includes('SI-short');
      if(hasShort) anyShortForm = true;
      if(sameFmt && !(hasShort && !hasLong)) bad.CG.push(c.lbl + ' sameFmt=true expected SHORT form, got ' + J(r.nk));
      if(!sameFmt && !(hasLong && !hasShort) && (hasLong || hasShort)) bad.CG.push(c.lbl + ' sameFmt=false expected LONG form, got ' + J(r.nk));
    }
  } else {
    nMet++;
    const p4 = pp.arr.every(v => v === pp.arr[0]);
    if(!p4) bad.G4.push(c.lbl + ' arr ' + pp.arr.map(fmt).join(' '));
  }
}

if(errs.length) console.log('  cell build errors: ' + errs.join(' | '));
console.log('  sample ' + CELLS.length + ' cells | met ' + nMet + ' | not-met ' + nNotMet + ' (dampened ' + nDamp + ', undamped ' + nUndamp + ') | copy-guard cells ' + nCG);

ok('G1a not-met last-build-week == _realisticTarget (0.1s)', bad.G1a.length === 0, bad.G1a.slice(0, 3).join(' | '));
ok('G1b printed "target for this block" == fmt(last build week)', bad.G1b.length === 0, bad.G1b.slice(0, 3).join(' | '));
ok('G2 every taper week == last build week (0.1s)', bad.G2.length === 0, bad.G2.slice(0, 3).join(' | '));
ok('G3 un-dampened not-met: last build week lands ON the entered goal', bad.G3.length === 0 && nUndamp > 0, bad.G3.slice(0, 3).join(' | ') || ('n=' + nUndamp));
ok('G4 goal-met: every week == initial pace (E7 unchanged)', bad.G4.length === 0 && nMet > 0, bad.G4.slice(0, 3).join(' | ') || ('n=' + nMet));
ok('COPY_GUARD: sameFmt <-> short-form note (coach amendment item 2)', bad.CG.length === 0 && nCG > 0, bad.CG.slice(0, 3).join(' | ') || ('n=' + nCG));

// ── COPY_GUARD PIN (D187 amendment 2, coach 2026-09-29): a real V224-discriminating cell ──
// The SAMEFMT cell above is a V225-era example; gatekeeper found it lands one second off under
// V224's own math and does not itself discriminate. This pin cell does. Built via
// IA.buildProgram DIRECTLY (bypassing doGenerate/the wizard): a blank mile on a non-beginner
// run_pace_goal now correctly refuses at the WIZARD seam (D187 R3, _mileEntryState), but that
// refusal is not in buildProgram itself, and R3 is already proven separately by
// g225_d187_pacerate.js's MILE-REQUIRED rows. This pin is about the CLOCK's copy, not the mile
// gate, so it reads the engine directly the same way g202_pace_anchor.js's PIN does.
// Oracle: pure string extraction from the printed note, never pp fields -- the redundancy this
// guard exists to stop IS a string-level fact (the same m:ss printed twice), so the honest check
// reads the two m:ss substrings the note itself prints and compares them as strings.
{
  const PIN_CFG = {
    name: 'M', primaryPath: 'event', cardioTypes: ['run'], eventTargeted: false, raceDate: '',
    liftingFocus: 'balanced', experience: 'intermediate', ageBracket: '55+', equipment: 'crossfit', unit: 'lbs',
    restDays: ['sun', 'wed'], days: ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'], bench: 135, squat: 155, deadlift: 185,
    seed: 24865, startDate: '2026-09-21',
    cardioGoals: { run: { id: 'run_pace_goal', label: 'Hit a Pace / Time Goal', targetDist: '1.5', paceUnit: 'mi', targetMins: '13', targetSecs: '45', targetTime: '13:45' } },
  };
  function pinNotes(){
    const p = IA.buildProgram(JSON.parse(JSON.stringify(PIN_CFG)));
    const notes = [];
    Object.keys(p.weeks || {}).forEach(w => ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'].forEach(d => {
      const day = p.weeks[w][d]; if(!day || !day.cardio) return;
      (Array.isArray(day.cardio) ? day.cardio : [day.cardio]).forEach(x => {
        if(x && x.type === 'run' && x.dose && x.dose.key === 'int') notes.push(String(x.note || ''));
      });
    }));
    return notes;
  }
  const LONG_RX = /Your full goal of (\d+:\d\d)\/mi needs more weeks than this block has\. The target for this block is (\d+:\d\d)\/mi/;
  const SHORT_RX = /^SI: Pace moves [\d.]+ seconds per mile each week\. The target for this block is \d+:\d\d\/mi\. Hit the prescribed pace precisely\.$/;
  const classify = note => { const m = LONG_RX.exec(note); if(m) return { form: 'long', equal: m[1] === m[2], goal: m[1], target: m[2] }; if(SHORT_RX.test(note)) return { form: 'short' }; return { form: 'other' }; };
  const pinCls = pinNotes().map(classify);
  const pinBad = [];
  if(STAMP < ERA){
    // (a) the real pre-D186 engine (V224, natural or under IA_ASSUME_VERSION discrimination on a
    // file genuinely stamped 224): the pin cell must show the redundant long form, goal == target.
    // This is a PURE STRING check (the note's own printed m:ss substrings), never pp fields.
    const w1 = pinCls[0];
    if(!(w1 && w1.form === 'long' && w1.equal)) pinBad.push('(a) V224 pin W1 expected LONG form with goal==target, got ' + J(w1));
    ok('COPY_GUARD PIN (a) V224: named cell prints the redundant long form (goal==target, the bug this guard exists to stop)', pinBad.length === 0, pinBad.join(' | ') || J(pinCls[0]));
  } else {
    // (b) on the real post-D186 engine (V225+): the SAME pin cell, by the same pure-string check,
    // must no longer print goal==target in the long form. bad.CG (computed above, over the whole
    // 17-cell sweep via the pp-field sameFmt<->form relationship) already proves 0/N sweep cells
    // are misclassified; this re-checks the specific pin cell by the independent string route.
    const w1 = pinCls[0];
    if(w1 && w1.form === 'long' && w1.equal) pinBad.push('(b) V225 pin cell still prints long-form goal==target: ' + J(w1));
    if(bad.CG.length) pinBad.push('(b) sweep COPY_GUARD mismatches: ' + bad.CG.slice(0, 2).join(' | '));
    // (c) at least one V225 cell in the existing sweep prints the short form (tracked during the
    // main CELLS loop above as anyShortForm, e.g. the SAMEFMT(coach ex) cell).
    if(!anyShortForm) pinBad.push('(c) no V225 cell in the sweep prints the short form');
    ok('COPY_GUARD PIN (b)+(c) V225: pin cell and whole sweep print 0 goal==target long forms, and >=1 cell prints the short form', pinBad.length === 0, pinBad.join(' | ') || ('pin ' + J(w1) + '; short form seen ' + anyShortForm));
  }
}

ok('TAPER CONTROL: hand taperWeeksFor == engine p.taperWeeks.length', bad.TAP.length === 0, bad.TAP.slice(0, 3).join(' | '));
ok('MET CONTROL: hand (pp[0] <= goal) == engine _goalMet', bad.MET.length === 0, bad.MET.slice(0, 3).join(' | '));
ok('no cell build errors', errs.length === 0, errs.join(' | '));

done();
