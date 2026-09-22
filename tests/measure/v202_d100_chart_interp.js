// V202 measure pass 5 — D100 E1 AMENDED: _initialPace = rowPaceAt(_chartRow, targetDistMi).
// Read-only. Source surgery on a COPY of git HEAD (V201); index.html is never touched.
//
// ORACLES (independent of the function under test):
//   Q1  the literal PACE_CHART rows, read as text out of the artifact, fitted against two
//       models declared here (linear in distance, linear in log distance). Neither model
//       comes from the engine.
//   Q2f doctrine/physicaltrainingguide2020.txt lines 250-255: SI = most recent 1.5-mile
//       pace minus 4 s per 400. "Most recent 1.5-mile pace" is derived from the entered
//       mile best by RIEGEL (T2 = T1*(d2/d1)^1.06), a published endurance model that is
//       NOT the chart and NOT rowPaceAt.
//   Q4  HALF_MANNY digest pin from tests/harness.js MANNY_DIGEST_BY_VERSION.
//
// Usage: node tests/measure/v202_d100_chart_interp.js
'use strict';
const path = require('path'), fs = require('fs'), cp = require('child_process');
const { load, progDigest, fixtures, progDigest: _pd } = require(path.join(__dirname, '..', 'harness.js'));
const H = require(path.join(__dirname, '..', 'harness.js'));
const ROOT = path.join(__dirname, '..', '..');
const SP = '/private/tmp/claude-501/-Users-CanasBangin-Desktop-TheBig6V2/1580846a-7cbc-414f-9eda-cd358cd095ca/scratchpad';

// ── 0. artifacts: BASE = git HEAD (V201 clean). Never the working copy. ────────
const BASE = path.join(SP, 'base_V201.html');
const S1   = path.join(SP, 'mp5_slice1.html');
const AM   = path.join(SP, 'mp5_amend.html');
for (const f of [BASE, S1, AM]) { try { fs.unlinkSync(f); } catch(e){} }   // delete before regenerating
cp.execSync(`git -C ${JSON.stringify(ROOT)} show HEAD:index.html > ${JSON.stringify(BASE)}`, {shell:'/bin/bash'});
let src0 = fs.readFileSync(BASE, 'utf8');

function rep(s, old, neu, name){
  const n = s.split(old).length - 1;
  if (n !== 1) { console.log(`!! ANCHOR ${name} count==${n} — ABORT`); process.exit(3); }
  return s.replace(old, neu);
}

// ── slice-1 surgery, byte-for-byte from tests/edits/v202_edit.py (A0..A5) ─────
const A0_old = `  function parseTimeToSecs(txt) {
    if(!txt) return null;
    var parts = txt.split(':').map(Number);
    if(parts.length === 2) return parts[0]*60 + parts[1];
    if(parts.length === 3) return parts[0]*3600 + parts[1]*60 + parts[2];
    return null;
  }

`;
const A1_old = `// ── DYNAMIC PROGRAM LENGTH CALCULATOR ──
function calcProgramLength(cardioTypes, cardioGoals, liftingGoal) {`;
const A1_new = `function parseTimeToSecs(txt) {
  if(!txt) return null;
  var parts = txt.split(':').map(Number);
  if(parts.length === 2) return parts[0]*60 + parts[1];
  if(parts.length === 3) return parts[0]*3600 + parts[1]*60 + parts[2];
  return null;
}
function paceGoalTarget(g) {
  g = g || {};
  var rawDist = parseFloat(g.targetDist) || 1.5;
  var tDist = (g.paceUnit === 'km') ? rawDist * 0.621 : rawDist;
  var tTotalSecs = null;
  if(g.targetMins !== undefined && g.targetMins !== '') {
    tTotalSecs = (+g.targetMins||0)*60 + (+g.targetSecs||0);
  } else if(g.targetTime) {
    tTotalSecs = parseTimeToSecs(g.targetTime);
  }
  return { tDist: tDist, tTotalSecs: tTotalSecs,
    tPacePerMile: (tTotalSecs && tDist > 0) ? (tTotalSecs / tDist) : null };
}

// ── DYNAMIC PROGRAM LENGTH CALCULATOR ──
function calcProgramLength(cardioTypes, cardioGoals, liftingGoal) {`;
const A2_old = `        var rawDist = parseFloat(goal.targetDist) || 1.5;
        var tDist = (goal.paceUnit === 'km') ? rawDist * 0.621 : rawDist;
        var tTotalSecs = null;
        if(goal.targetMins !== undefined && goal.targetMins !== '') {
          tTotalSecs = (+goal.targetMins||0)*60 + (+goal.targetSecs||0);
        } else if(goal.targetTime) {
          tTotalSecs = parseTimeToSecs(goal.targetTime);
        }
        var tPacePerMile = (tTotalSecs && tDist > 0) ? (tTotalSecs / tDist) : null;`;
const A2_new = `        var _pgT = paceGoalTarget(goal);
        var tDist = _pgT.tDist;
        var tTotalSecs = _pgT.tTotalSecs;
        var tPacePerMile = _pgT.tPacePerMile;`;
const A3_old = `    buildRunProgressionForLength._initialPace  = expPaceDefaults[experience||'intermediate'] || 570;`;
const A3_s1  = `    buildRunProgressionForLength._initialPace  = _mileBestSecs || expPaceDefaults[experience||'intermediate'] || 570;`;
const A3_am  = `    buildRunProgressionForLength._initialPace  = rowPaceAt(_chartRow, rawTargetDist);`;
const A4_old = `          const sessionOverride = forceType ? null : assignedType;
          session = buildRunSession(
            _runGoalId, w, dayIdx, tw,
            baselineMiles, cfg.experience||'intermediate',
            forceType, cfg.eventTargeted !== false, sessionOverride,
            null, null, null, _mileBestSecs, isBaseCardio, _qPhase, _tap,`;
const A4_new = `          const sessionOverride = forceType ? null : assignedType;
          const _pgT = paceGoalTarget(goal);
          session = buildRunSession(
            _runGoalId, w, dayIdx, tw,
            baselineMiles, cfg.experience||'intermediate',
            forceType, cfg.eventTargeted !== false, sessionOverride,
            _pgT.tDist, _pgT.tTotalSecs, cfg.ageBracket||'18-35', _mileBestSecs, isBaseCardio, _qPhase, _tap,`;
const A5_old = `    // Adaptation dampener: physiology caps pace gains, further reduced by age bracket
    const maxPaceImprovementPerWeek = buildRunProgressionForLength._paceImprovePerWeek
      ? Math.min(12, buildRunProgressionForLength._paceImprovePerWeek * 2.5)
      : 12;`;
const A5_new = `    const expPaceImprove = {beginner:3, intermediate:5, advanced:7};
    const maxPaceImprovementPerWeek = buildRunProgressionForLength._paceImprovePerWeek
      || expPaceImprove[exp] || 5;`;

// the amended helper, sited next to paceChartLookup (Q5 names the seam)
const HELPER_ANCHOR = `function isSpeedGoal(goalId) {`;
const HELPER = `// ── ROW READ AT A DISTANCE (D100 amended, V202) ──
// PACE_CHART is a race-equivalence table: each row is one athlete, the columns are that
// athlete's average per-mile pace at 1 / 5K / 10K / half / marathon. rowPaceAt reads an
// already-interpolated row at an arbitrary distance in MILES, interpolating in LOG distance
// between the two bracketing columns. Clamped at both ends.
const PACE_COLS = [ {d:1, k:'mile'}, {d:3.107, k:'fiveK'}, {d:6.214, k:'tenK'},
                    {d:13.109, k:'half'}, {d:26.219, k:'marathon'} ];
function rowPaceAt(row, distMi) {
  const d = +distMi;
  if (!row || !isFinite(d) || d <= PACE_COLS[0].d) return row ? row[PACE_COLS[0].k] : null;
  const last = PACE_COLS[PACE_COLS.length-1];
  if (d >= last.d) return row[last.k];
  for (let i = 0; i < PACE_COLS.length - 1; i++) {
    const lo = PACE_COLS[i], hi = PACE_COLS[i+1];
    if (d >= lo.d && d <= hi.d) {
      const f = (Math.log(d) - Math.log(lo.d)) / (Math.log(hi.d) - Math.log(lo.d));
      return row[lo.k] + (row[hi.k] - row[lo.k]) * f;
    }
  }
  return row[last.k];
}

function isSpeedGoal(goalId) {`;

function surgery(kind){
  let s = src0;
  s = rep(s, A0_old, '', 'A0');
  s = rep(s, A1_old, A1_new, 'A1');
  s = rep(s, A2_old, A2_new, 'A2');
  s = rep(s, A4_old, A4_new, 'A4/E2');
  s = rep(s, A5_old, A5_new, 'A5/E3');
  if (kind === 'amend') {
    s = rep(s, HELPER_ANCHOR, HELPER, 'HELPER rowPaceAt');
    s = rep(s, A3_old, A3_am, 'A3/E1 amended');
  } else {
    s = rep(s, A3_old, A3_s1, 'A3/E1 slice1');
  }
  return s;
}
fs.writeFileSync(S1, surgery('slice1'));
fs.writeFileSync(AM, surgery('amend'));
if (!fs.statSync(S1).size || !fs.statSync(AM).size) { console.log('!! empty artifact'); process.exit(3); }
const IA = { BASE: load(BASE), S1: load(S1), AM: load(AM) };
console.log('artifacts: ' + Object.keys(IA).map(k=>k+'=ia'+IA[k].version).join(' '));

const fmt = s => `${Math.floor(s/60)}:${String(Math.round(s%60)).padStart(2,'0')}`;
const DAYS = ['sun','mon','tue','wed','thu','fri','sat'];
const COLS = [ {d:1,k:'mile'}, {d:3.107,k:'fiveK'}, {d:6.214,k:'tenK'}, {d:13.109,k:'half'}, {d:26.219,k:'marathon'} ];

// ════════════════════════════════════════════════════════════════════════
console.log('\n════ Q1 — THE TABLE\'S OWN SHAPE ════');
// Read PACE_CHART out of the artifact TEXT, not by calling the engine.
const chartTxt = src0.slice(src0.indexOf('const PACE_CHART = ['));
const rowTxt = chartTxt.slice(0, chartTxt.indexOf('];')+2);
const ROWS = [];
rowTxt.split('\n').forEach(L => {
  const m = L.match(/\{mile:(\d+).*?fiveK:(\d+).*?tenK:(\d+).*?half:(\d+).*?marathon:(\d+)/);
  if (m) ROWS.push({mile:+m[1], fiveK:+m[2], tenK:+m[3], half:+m[4], marathon:+m[5]});
});
console.log(`rows parsed from artifact text: ${ROWS.length} (expect 15)`);
const r1 = ROWS[0];
console.log(`coach's premise, row 1: mile=${r1.mile} fiveK=${r1.fiveK} tenK=${r1.tenK} half=${r1.half} marathon=${r1.marathon}`);
console.log(`  mile->5K  = +${r1.fiveK-r1.mile}s over log2(3.107)=${(Math.log2(3.107)).toFixed(3)} doublings = ${((r1.fiveK-r1.mile)/Math.log2(3.107)).toFixed(1)} s/doubling`);
console.log(`  5K->10K   = +${r1.tenK-r1.fiveK}s over exactly 1 doubling = ${(r1.tenK-r1.fiveK).toFixed(1)} s/doubling`);
console.log(`  linear-in-distance would need ${( (r1.fiveK-r1.mile)/(3.107-1) ).toFixed(1)} s/mi then ${( (r1.tenK-r1.fiveK)/(6.214-3.107) ).toFixed(1)} s/mi`);

// Least-squares fit of each row against y = a + b*x, x = d (LIN) and x = ln d (LOG).
function fit(xs, ys){
  const n = xs.length, mx = xs.reduce((a,b)=>a+b,0)/n, my = ys.reduce((a,b)=>a+b,0)/n;
  let sxy=0, sxx=0; for(let i=0;i<n;i++){ sxy += (xs[i]-mx)*(ys[i]-my); sxx += (xs[i]-mx)**2; }
  const b = sxy/sxx, a = my - b*mx;
  let sse=0, maxr=0; for(let i=0;i<n;i++){ const r = ys[i]-(a+b*xs[i]); sse += r*r; maxr = Math.max(maxr, Math.abs(r)); }
  return { rmse: Math.sqrt(sse/n), maxr };
}
const xLin = COLS.map(c=>c.d), xLog = COLS.map(c=>Math.log(c.d));
let winLog=0, winLin=0, sumLog=0, sumLin=0, worstLog=0, worstLin=0, inversions=[];
console.log('\n  row  anchor |  RMSE(lin-d)  RMSE(log-d)  better  | maxResid lin/log');
ROWS.forEach((r,i)=>{
  const ys = COLS.map(c=>r[c.k]);
  for(let j=1;j<ys.length;j++) if(ys[j] <= ys[j-1]) inversions.push(`row${i+1}(mile ${r.mile}) ${COLS[j-1].k}=${ys[j-1]} -> ${COLS[j].k}=${ys[j]}`);
  const L = fit(xLin, ys), G = fit(xLog, ys);
  sumLin += L.rmse*L.rmse; sumLog += G.rmse*G.rmse;
  worstLin = Math.max(worstLin, L.maxr); worstLog = Math.max(worstLog, G.maxr);
  if (G.rmse < L.rmse) winLog++; else winLin++;
  console.log(`  ${String(i+1).padStart(3)}  ${fmt(r.mile).padStart(6)} |  ${L.rmse.toFixed(2).padStart(10)}  ${G.rmse.toFixed(2).padStart(10)}  ${(G.rmse<L.rmse?'LOG':'LIN').padStart(6)}  | ${L.maxr.toFixed(1)} / ${G.maxr.toFixed(1)}`);
});
console.log(`\n  LOG better in ${winLog}/${ROWS.length} rows, LIN better in ${winLin}/${ROWS.length}`);
console.log(`  pooled RMSE  linear-in-distance = ${Math.sqrt(sumLin/ROWS.length).toFixed(2)} s/mi   linear-in-log-distance = ${Math.sqrt(sumLog/ROWS.length).toFixed(2)} s/mi`);
console.log(`  worst single residual  lin = ${worstLin.toFixed(1)} s/mi   log = ${worstLog.toFixed(1)} s/mi`);
console.log(`  monotone check: ${inversions.length} inversions / ${ROWS.length*4} adjacent column pairs` + (inversions.length?('\n    ' + inversions.join('\n    ')):''));

// ════════════════════════════════════════════════════════════════════════
console.log('\n════ Q2 — MARIO\'S PINNED "PRT TING" ════');
const SEED = 24865;
const base = (over) => Object.assign({
  name:'PRT TING', primaryPath:'event', cardioTypes:['run'],
  eventTargeted:true, raceDate:'2026-10-19',
  liftingFocus:'support_prevention', experience:'intermediate', ageBracket:'18-35',
  equipment:'full_gym', unit:'lbs', restDays:['sun','wed'], days:DAYS.slice(),
  bench:185, squat:245, deadlift:315, seed:SEED,
}, over || {});
const paceGoal = (g, over) => base(Object.assign({ cardioGoals:{ run: Object.assign({
  id:'run_pace_goal', label:'Hit a Pace / Time Goal', paceUnit:'mi',
  baselineDist:'3', baseline:'3mi' }, g) } }, over || {}));
const PINNED = paceGoal({ targetDist:'1.5', targetMins:'10', targetSecs:'30', targetTime:'10:30',
                          mileBestMins:'8', mileBestSecs:'15', mileBestSrc:{kind:'entered'} });

// (a) the chart read itself, printed from the amended artifact's own helper
const rowJS = `(function(){ var r = paceChartLookup('mile', 495); return {row:r, at15: rowPaceAt(r,1.5), at1: rowPaceAt(r,1), cols: PACE_COLS.map(function(c){return c.k+'@'+c.d+'='+r[c.k];}) }; })()`;
const rp = IA.AM.eval(rowJS);
console.log(`(a) _chartRow for mile best 8:15 (495 s): ` + rp.cols.join('  '));
console.log(`    brackets for 1.5 mi: mile@1.0=${rp.row.mile}  fiveK@3.107=${rp.row.fiveK}`);
console.log(`    log fraction = ln(1.5)/ln(3.107) = ${(Math.log(1.5)/Math.log(3.107)).toFixed(5)}`);
console.log(`    rowPaceAt(_chartRow, 1.5) = ${rp.at15.toFixed(3)} s/mi = ${fmt(rp.at15)}/mi   <-- amended _initialPace`);
console.log(`    rowPaceAt(_chartRow, 1.0) = ${rp.at1} (mile column, regression pin)`);

// (b)(c) progression meta, read off the engine of each artifact
function ppOf(ia, cfg){
  const prog = ia.buildProgram(cfg);
  // recompute the progression exactly as buildRunSession does, by calling it
  const p = ia.eval(`(function(){ return buildRunProgressionForLength; })()`);
  return prog;
}
function runSessions(prog){
  const out = []; const wks = prog.weeks||{};
  Object.keys(wks).sort((a,b)=>+a-+b).forEach(w => DAYS.forEach(d => {
    const day = wks[w][d]; if(!day) return; let c = day.cardio; if(!c) return;
    (Array.isArray(c)?c:[c]).forEach(s => { if(s && s.type==='run')
      out.push({w:+w, d, st:s.subtype||'', detail:s.detail||'', note:s.note||'', dose:s.dose||null}); });
  }));
  return out;
}
const progS1 = IA.S1.buildProgram(PINNED), progAM = IA.AM.buildProgram(PINNED);
// pull the live progression object out of the context after the build
function meta(ia){
  return ia.eval(`(function(){ var f=buildRunProgressionForLength; return {ip:f._initialPace, tp:f._targetPace, imp:f._paceImprovePerWeek}; })()`);
}
const mS1 = meta(IA.S1), mAM = meta(IA.AM);
console.log(`\n(b) slice1 : _initialPace=${mS1.ip}  _targetPace=${(mS1.tp||0).toFixed(2)}  improve/wk=${mS1.imp}`);
console.log(`    amended: _initialPace=${(mAM.ip||0).toFixed(3)}  _targetPace=${(mAM.tp||0).toFixed(2)}  improve/wk=${mAM.imp}`);
console.log(`    totalWeeks: slice1=${progS1.totalWeeks}  amended=${progAM.totalWeeks}`);
function ppArr(ia, cfg){
  return ia.eval(`(function(){
    var f=buildRunProgressionForLength;
    var r=buildRunProgressionForLength('run_pace_goal', ${cfg.tw}, 1.5, 'intermediate', true);
    return null; })()`);
}
// Read the progression straight out of a direct buildRunSession call with the same args
// the schedule builder passes, so _initialPace/_targetPace are set the same way.
function ppDirect(ia, tw, dist, totalSecs, age, mileSecs, exp){
  return ia.eval(`(function(){
    buildRunSession('run_pace_goal', 1, 1, ${tw}, 1.5, ${JSON.stringify(exp)}, null, true, null,
       ${dist}, ${totalSecs===null?'null':totalSecs}, ${JSON.stringify(age)}, ${mileSecs===null?'null':mileSecs}, false, null, null);
    var f = buildRunProgressionForLength;
    var p = buildRunProgressionForLength('run_pace_goal', ${tw}, 1.5, ${JSON.stringify(exp)}, true).paceProgression;
    return { ip:f._initialPace, tp:f._targetPace, imp:f._paceImprovePerWeek,
             pp: p ? p.slice() : null, dampened: p?p._dampened:null, gain: p?p._weeklyGain:null,
             realistic: p?p._realisticTarget:null, orig: p?p._originalTarget:null };
  })()`);
}
const dS1 = ppDirect(IA.S1, progS1.totalWeeks, 1.5, 630, '18-35', 495, 'intermediate');
const dAM = ppDirect(IA.AM, progAM.totalWeeks, 1.5, 630, '18-35', 495, 'intermediate');
[['slice1',dS1],['amended',dAM]].forEach(([n,d])=>{
  console.log(`\n(c) ${n}: initial=${(+d.ip).toFixed(2)} target=${(+d.tp).toFixed(2)} gain=${d.gain}/wk realistic=${d.realistic} (${fmt(d.realistic)}/mi) dampened=${d.dampened}`);
  console.log(`    paceProgression = [${d.pp.join(', ')}]`);
  console.log(`    as m:ss/mi      = [${d.pp.map(fmt).join(', ')}]`);
});

// (d) W1/W6/W10 INT + CHI + W1 LSD, read off the RENDERED sessions
function cells(prog){
  const S = runSessions(prog), out = {};
  S.forEach(s => {
    const k = `W${s.w} ${/Interval/.test(s.st)?'INT':/CHI|Continuous/.test(s.st)?'CHI':/Long|LSD|lsd/.test(s.st)?'LSD':s.st}`;
    if (out[k]) return;
    out[k] = { tgt: s.dose&&s.dose.tgt!=null?s.dose.tgt:null, paces:(s.detail.match(/\d+:\d\d(\/mi)?/g)||[]).join(',') };
  });
  return out;
}
const cS1 = cells(progS1), cAM = cells(progAM);
console.log('\n(d) rendered targets (dose.tgt s/mi -> m:ss/mi):');
['W1 INT','W1 CHI','W1 LSD','W6 INT','W6 CHI','W10 INT','W10 CHI'].forEach(k=>{
  const a = cS1[k], b = cAM[k];
  const f = v => v&&v.tgt!=null ? `${v.tgt} (${fmt(v.tgt)})` : (v?`[no tgt] ${v.paces}`:'—');
  console.log(`    ${k.padEnd(8)} slice1=${String(f(a)).padEnd(18)} amended=${String(f(b)).padEnd(18)} delta=${a&&b&&a.tgt!=null&&b.tgt!=null?((b.tgt-a.tgt>0?'+':'')+(b.tgt-a.tgt)):'n/a'}`);
});

// (e) delta vs what Mario was already shown
console.log('\n(e) DELTA vs slice-1-as-built (what he has already seen):');
console.log(`    _initialPace   495 -> ${(+dAM.ip).toFixed(1)}   (+${((+dAM.ip)-495).toFixed(1)} s/mi)`);
console.log(`    realistic      450 (7:30) -> ${dAM.realistic} (${fmt(dAM.realistic)})   (+${(dAM.realistic-450).toFixed(1)} s/mi)`);
console.log(`    coach predicted ~10 s/mi slower than 7:30; measured ${(dAM.realistic-450).toFixed(1)} s/mi slower.`);
[['W1 INT',470],['W6 INT',447],['W10 INT',486]].forEach(([k,claim])=>{
  const a = cS1[k]&&cS1[k].tgt, b = cAM[k]&&cAM[k].tgt;
  console.log(`    ${k}: coach-quoted slice1=${claim}  measured slice1=${a}  amended=${b}  delta=${b!=null&&a!=null?((b-a>0?'+':'')+(b-a)):'n/a'}`);
});

// (f) PTG oracle, s/400
console.log('\n(f) PTG SI ORACLE (guide lines 250-255: SI = recent 1.5-mi pace minus 4 s per 400)');
const MI_PER_400 = 400/1609.344;
const riegel15 = 495 * Math.pow(1.5, 1.06) / 1.5;          // independent: Riegel, not the chart
console.log(`    independent current 1.5-mi pace (Riegel from 8:15 mile) = ${riegel15.toFixed(2)} s/mi = ${(riegel15*MI_PER_400).toFixed(2)} s/400`);
console.log(`    chart read rowPaceAt(row,1.5)                            = ${rp.at15.toFixed(2)} s/mi  (agreement with Riegel: ${(rp.at15-riegel15>0?'+':'')}${(rp.at15-riegel15).toFixed(2)} s/mi)`);
const oracle400 = riegel15*MI_PER_400 - 4;
console.log(`    ORACLE SI target = ${oracle400.toFixed(2)} s/400 = ${(oracle400/MI_PER_400).toFixed(1)} s/mi = ${fmt(oracle400/MI_PER_400)}/mi`);
[['slice1',cS1['W1 INT']],['amended',cAM['W1 INT']]].forEach(([n,c])=>{
  if(!c||c.tgt==null){ console.log(`    ${n}: W1 INT has no dose.tgt — cannot grade`); return; }
  const s400 = c.tgt*MI_PER_400;
  console.log(`    ${n}: W1 INT = ${c.tgt} s/mi = ${s400.toFixed(2)} s/400  ->  delta vs oracle = ${(s400-oracle400>0?'+':'')}${(s400-oracle400).toFixed(2)} s/400`);
});

// ════════════════════════════════════════════════════════════════════════
console.log('\n════ Q3 — THE RESIDUAL HOLD CLASS (360 builds) ════');
const EXPS=['beginner','intermediate','advanced'], AGES=['18-35','36-54','55+'], UNITS=['mi','km'];
const ANCH=[{m:'6',s:'45',sec:405},{m:'8',s:'15',sec:495},{m:'9',s:'30',sec:570},{m:'11',s:'00',sec:660}];
const GOALS=[{d:'1.5',mm:'9',ss:'00'},{d:'1.5',mm:'10',ss:'30'},{d:'2',mm:'16',ss:'00'},{d:'3',mm:'21',ss:'00'},{d:'5',mm:'45',ss:'00'}];
const EXPDEF={beginner:690,intermediate:570,advanced:450};
let N=0, oldHold=0, newHold=0; const seg={};
const rows=[]; let sample=null;
for(const exp of EXPS) for(const age of AGES) for(const u of UNITS) for(const a of ANCH) for(const g of GOALS){
  N++;
  const mileSec = (exp==='beginner') ? EXPDEF.beginner : a.sec;   // beginner: anchor gated to default
  const dist = (u==='km') ? parseFloat(g.d)*0.621 : parseFloat(g.d);
  const totalSecs = (+g.mm)*60 + (+g.ss);
  const goalPace = totalSecs/dist;
  const row = IA.AM.eval(`paceChartLookup('mile', ${mileSec})`);
  const curAtD = IA.AM.eval(`rowPaceAt(paceChartLookup('mile', ${mileSec}), ${dist})`);
  const oH = goalPace >= mileSec;       // builder's old test: goal slower per mile than the mile anchor
  const nH = goalPace >= curAtD;        // amended: goal at-or-slower than current-at-goal-distance
  if(oH) oldHold++; if(nH) newHold++;
  const k = `${exp}/${u}`;
  seg[k]=seg[k]||{n:0,o:0,x:0}; seg[k].n++; if(oH) seg[k].o++; if(nH) seg[k].x++;
  if(nH && !sample) sample={exp,age,u,a,g,mileSec,dist,goalPace,curAtD};
}
console.log(`lattice: ${N} builds (3 exp x 3 age x 2 unit x 4 mile anchors x 5 goals)`);
console.log(`  OLD  (goal slower/mi than the MILE anchor)             : ${oldHold}/${N} (${(100*oldHold/N).toFixed(1)}%)   [builder reported 138/360]`);
console.log(`  NEW  (goal at-or-slower than CURRENT AT GOAL DISTANCE) : ${newHold}/${N} (${(100*newHold/N).toFixed(1)}%)`);
console.log('  segmented exp/unit:');
Object.entries(seg).sort().forEach(([k,v])=>console.log(`    ${k.padEnd(22)} n=${v.n}  old=${v.o}  new=${v.x}`));
if(sample){
  const s=sample;
  console.log(`\n  one residual athlete: exp=${s.exp} age=${s.age} unit=${s.u} mile=${fmt(s.mileSec)} goal=${s.g.d}${s.u} in ${s.g.mm}:${s.g.ss}`);
  console.log(`    goal dist in mi = ${s.dist.toFixed(3)}; goal pace = ${s.goalPace.toFixed(1)} s/mi (${fmt(s.goalPace)})`);
  console.log(`    BEFORE (slice1): initialPace = ${s.mileSec} (${fmt(s.mileSec)}) -> goal is ${(s.goalPace-s.mileSec).toFixed(1)} s/mi slower`);
  console.log(`    AFTER  (amend) : initialPace = ${s.curAtD.toFixed(1)} (${fmt(s.curAtD)}) -> goal is ${(s.goalPace-s.curAtD).toFixed(1)} s/mi slower`);
  const cfgH = paceGoal({targetDist:s.g.d, targetMins:s.g.mm, targetSecs:s.g.ss, targetTime:`${s.g.mm}:${s.g.ss}`,
    paceUnit:s.u, mileBestMins:s.a.m, mileBestSecs:s.a.s}, {experience:s.exp, ageBracket:s.age});
  const pH1 = IA.S1.buildProgram(cfgH), pHA = IA.AM.buildProgram(cfgH);
  const d1 = ppDirect(IA.S1, pH1.totalWeeks, s.dist.toFixed(4), (+s.g.mm)*60+(+s.g.ss), s.age, s.exp==='beginner'?null:s.mileSec, s.exp);
  const dA = ppDirect(IA.AM, pHA.totalWeeks, s.dist.toFixed(4), (+s.g.mm)*60+(+s.g.ss), s.age, s.exp==='beginner'?null:s.mileSec, s.exp);
  console.log(`    slice1  pp=[${d1.pp.join(', ')}] realistic=${d1.realistic} dampened=${d1.dampened}`);
  console.log(`    amended pp=[${dA.pp.join(', ')}] realistic=${dA.realistic} dampened=${dA.dampened}`);
  console.log(`    (coach ruled this class HOLDS: targetPace=min(goal,initial), _dampened false, flat pp.)`);
}

// ════════════════════════════════════════════════════════════════════════
console.log('\n════ Q4 — REGRESSION GUARD ════');
// 4a: goal distance EXACTLY 1 mile must be byte-identical slice1 vs amended
function sig(prog){
  return runSessions(prog).map(s=>`W${s.w}|${s.d}|${s.st}|${s.detail}|${s.note}|${JSON.stringify(s.dose)}`).join('\n');
}
let oneMiN=0, oneMiDiff=0;
for(const exp of EXPS) for(const age of AGES) for(const a of ANCH) for(const mm of ['5','6','7','8','10']){
  const cfg = paceGoal({targetDist:'1', targetMins:mm, targetSecs:'00', targetTime:mm+':00',
    mileBestMins:a.m, mileBestSecs:a.s}, {experience:exp, ageBracket:age});
  oneMiN++;
  if(sig(IA.S1.buildProgram(cfg)) !== sig(IA.AM.buildProgram(cfg))) oneMiDiff++;
}
console.log(`4a goal == 1.00 mi identical slice1 vs amended: ${oneMiN-oneMiDiff}/${oneMiN} identical, ${oneMiDiff} DIFFER (expect 0)`);

// 4b: other goals untouched
const OTHER = [
  ['run_5k',   {id:'run_5k',   label:'5K',   mileBestMins:'8', mileBestSecs:'15', baselineDist:'3'}],
  ['run_10k',  {id:'run_10k',  label:'10K',  mileBestMins:'8', mileBestSecs:'15', baselineDist:'3'}],
  ['run_half', {id:'run_half', label:'Half', mileBestMins:'10',mileBestSecs:'30', baselineDist:'5'}],
  ['run_base', {id:'run_base', label:'Base', mileBestMins:'8', mileBestSecs:'15', baselineDist:'3'}],
  ['run_mile_time',   {id:'run_mile_time',   label:'Mile', mileBestMins:'8', mileBestSecs:'15', baselineDist:'3'}],
  ['run_15_under10',  {id:'run_15_under10',  label:'1.5', mileBestMins:'8', mileBestSecs:'15', baselineDist:'3'}],
];
let othN=0, othDiff=0; const othSeg={};
for(const [gid,g] of OTHER) for(const exp of EXPS) for(const seed of [24865,11111,90210]){
  const cfg = base({cardioGoals:{run:g}, experience:exp, seed, raceDate:'2026-12-06'});
  othN++;
  const d = sig(IA.S1.buildProgram(cfg)) !== sig(IA.AM.buildProgram(cfg));
  if(d){ othDiff++; othSeg[gid]=(othSeg[gid]||0)+1; }
}
// bike + swim
for(const ct of [['bike',{id:'bike_50',label:'50mi'}],['swim',{id:'swim_500_time',label:'500'}]])
  for(const seed of [24865,11111]){
    const cfg = base({cardioTypes:[ct[0]], cardioGoals:{[ct[0]]:ct[1]}, seed, eventTargeted:false, raceDate:null});
    othN++;
    if(progDigest(IA.S1.buildProgram(cfg)) !== progDigest(IA.AM.buildProgram(cfg))){ othDiff++; othSeg[ct[0]]=(othSeg[ct[0]]||0)+1; }
  }
console.log(`4b non-pace-goal cardio changed cells: ${othDiff}/${othN} builds differ (expect 0)` + (othDiff?` — ${JSON.stringify(othSeg)}`:''));

// 4c: HALF_MANNY digest
const PIN = 'd4364dd3fa63a3a1';
const dg = { BASE: progDigest(IA.BASE.buildProgram(H.fixtures.HALF_MANNY)),
             S1:   progDigest(IA.S1.buildProgram(H.fixtures.HALF_MANNY)),
             AM:   progDigest(IA.AM.buildProgram(H.fixtures.HALF_MANNY)) };
// prove the baseline equals itself first
const selfOK = progDigest(IA.BASE.buildProgram(H.fixtures.HALF_MANNY)) === dg.BASE;
console.log(`4c HALF_MANNY self-stable on BASE: ${selfOK}`);
console.log(`    BASE(V201)=${dg.BASE}  slice1=${dg.S1}  amended=${dg.AM}  pin=${PIN}`);
console.log(`    amended == pin: ${dg.AM===PIN}`);

// 4d: beginner default row read at 1.5 mi
const beg = IA.AM.eval(`(function(){ var r=paceChartLookup('mile',690); return {row:r, at15:rowPaceAt(r,1.5)}; })()`);
console.log(`4d beginner default anchor 690: row.mile=${beg.row.mile} row.fiveK=${beg.row.fiveK} -> rowPaceAt(row,1.5)=${beg.at15.toFixed(2)} (${fmt(beg.at15)}/mi)`);
console.log(`    is it simply 690? ${beg.at15===690}  (delta ${(beg.at15-690).toFixed(2)} s/mi)`);
const begCfg = paceGoal({targetDist:'1.5',targetMins:'12',targetSecs:'00',targetTime:'12:00'},{experience:'beginner'});
const pb1 = IA.S1.buildProgram(begCfg), pbA = IA.AM.buildProgram(begCfg);
const db1 = ppDirect(IA.S1, pb1.totalWeeks, 1.5, 720, '18-35', null, 'beginner');
const dbA = ppDirect(IA.AM, pbA.totalWeeks, 1.5, 720, '18-35', null, 'beginner');
console.log(`    beginner 1.5mi in 12:00 -> slice1 initial=${db1.ip} realistic=${db1.realistic}; amended initial=${(+dbA.ip).toFixed(2)} realistic=${dbA.realistic}`);

console.log('\nMEASURE PASS 5 COMPLETE');

// ════════════════════════════════════════════════════════════════════════
console.log('\n════ Q4b FOLLOW-UP / Q1 FOLLOW-UP ════');
// Q4b: the 18 "non-pace-goal" diffs are run_mile_time + run_15_under10, which
// _GOAL_ALIAS (index.html:6676) normalises TO run_pace_goal at the single point where
// the engine first reads cfg.cardioGoals. Print the goalId the session actually carries.
const aliasCfg = base({cardioGoals:{run:{id:'run_mile_time',label:'Mile',mileBestMins:'8',mileBestSecs:'15',baselineDist:'3'}}, raceDate:'2026-12-06'});
const _ag = IA.AM.buildProgram(aliasCfg);
const _gid = (function(){ const wk=_ag.weeks['1']; for(const d of DAYS){ const dd=wk[d]; if(!dd||!dd.cardio) continue;
  for(const s of (Array.isArray(dd.cardio)?dd.cardio:[dd.cardio])) if(s.type==='run') return s.goalId; } return null; })();
console.log('  run_mile_time cfg -> session.goalId = ' + _gid + '  (aliased at index.html:6676; the 18 diffs ARE pace-goal builds)');

// Q1: is the row-15 half->marathon inversion REACHABLE through rowPaceAt?
// targetDist input (index.html:2790) is min=0.1 with NO max, so a >13.1 mi pace goal exists.
[600,660,690,720].forEach(m=>{
  const line = [13.1,16,20,26.2].map(d=>`${d}mi=${IA.AM.eval(`rowPaceAt(paceChartLookup('mile',${m}),${d})`).toFixed(1)}`).join(' ');
  const r = IA.AM.eval(`paceChartLookup('mile',${m})`);
  console.log(`  anchor ${fmt(m)}: ${line}   (half=${r.half} marathon=${r.marathon})`);
});
console.log('  -> on the 12:00 row the read DECREASES with distance: rowPaceAt returns a marathon');
console.log('     pace FASTER per mile than the half. Not a rowPaceAt defect; the table row inverts.');
