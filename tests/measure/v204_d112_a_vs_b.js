// V204 measure pass 6 — D112: three-way doctrine-source diff for Mario's PRT TING.
// READ-ONLY. index.html is never touched. Source surgery happens on a COPY of git HEAD.
//
// THE THREE COLUMNS
//   TODAY     = what the engine ships (amended-E1 artifact, so the pace clock matches
//               what will actually ship after D100/D101/E1).
//   A-governs = doctrine/physicaltrainingguide2020.txt (22pg, LSD/LI/SI)
//               + doctrine/ptg2020_tables_p13_14_16_17.txt (HAND-TRANSCRIBED, not OCR).
//   B-governs = doctrine/nsw_ptg_sealswcc_11pg.txt (11pg, LSD/CHI/INT, Table 6).
//
// ORACLES (none of them is the function under test):
//   A THU  : p13 row w, read as TEXT out of the hand-transcribed table file.
//            pace = week pace - 16 s/mi  (A lines 250-252: "400m interval pace about 4
//            seconds faster than your base pace"; 4 s/400m = 16 s/mi exactly).
//            recovery = 2-2.5 x work time (A line 249 and the p13 header).
//   A SAT  : p16 row w, read as TEXT. pace = week pace x 1.08 (A's worked example:
//            6:00/mi 1.5-mile -> LI 6:20-6:40, i.e. +5.6% to +11.1%, midpoint 1.083).
//            recovery = 7-10 min (A line ~299).
//   B      : Table 6 is NOT IN THE FILE (see Q0). Endpoints are corroborated by Table 7,
//            which IS in the file (line 22: "INT 10 x 1/4 mile", "CHI 2 x 20 minutes").
//            The week-by-week shape is a DECLARED ramp, flagged as such everywhere.
//   pace   : the SHARED clock. Taken from the engine's own rendered week pace (parsed out
//            of the INT card's "this week's goal of M:SS/mi" text), cross-checked against
//            paceProgression with the cutback-hold rule applied independently.
//   Q5     : the tables' own prose (A lines 259-268, 292-294) vs the transcribed rows.
//
// Usage: node tests/measure/v204_d112_a_vs_b.js
'use strict';
const path = require('path'), fs = require('fs'), cp = require('child_process');
const H = require(path.join(__dirname, '..', 'harness.js'));
const { load } = H;
const ROOT = path.join(__dirname, '..', '..');
const SP = '/private/tmp/claude-501/-Users-CanasBangin-Desktop-TheBig6V2/1580846a-7cbc-414f-9eda-cd358cd095ca/scratchpad';
const DAYS = ['sun','mon','tue','wed','thu','fri','sat'];
const M_PER_MI = 1609.344;
const fmt = s => `${Math.floor(s/60)}:${String(Math.round(s%60)).padStart(2,'0')}`;
const ms  = s => `${Math.floor(s/60)}:${String(Math.round(s%60)).padStart(2,'0')}`;

// ══════════════════════════════════════════════════════════════════════════════
// 0. ARTIFACT — git HEAD + slice1/slice2 surgery + the AMENDED E1 (rowPaceAt).
//    Byte-for-byte from tests/measure/v202_d100_chart_interp.js.
// ══════════════════════════════════════════════════════════════════════════════
const BASE = path.join(SP, 'v204_base.html');
const AM   = path.join(SP, 'v204_amend.html');
for (const f of [BASE, AM]) { try { fs.unlinkSync(f); } catch(e){} }
cp.execSync(`git -C ${JSON.stringify(ROOT)} show HEAD:index.html > ${JSON.stringify(BASE)}`, {shell:'/bin/bash'});
let src0 = fs.readFileSync(BASE, 'utf8');
function rep(s, old, neu, name){
  const n = s.split(old).length - 1;
  if (n !== 1) { console.log(`!! ANCHOR ${name} count==${n} — ABORT`); process.exit(3); }
  return s.replace(old, neu);
}
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
const HELPER_ANCHOR = `function isSpeedGoal(goalId) {`;
const HELPER = `const PACE_COLS = [ {d:1, k:'mile'}, {d:3.107, k:'fiveK'}, {d:6.214, k:'tenK'},
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
let s = src0;
s = rep(s, A0_old, '', 'A0');
s = rep(s, A1_old, A1_new, 'A1');
s = rep(s, A2_old, A2_new, 'A2');
s = rep(s, A4_old, A4_new, 'A4/E2');
s = rep(s, A5_old, A5_new, 'A5/E3');
s = rep(s, HELPER_ANCHOR, HELPER, 'HELPER rowPaceAt');
s = rep(s, A3_old, A3_am, 'A3/E1 amended');
fs.writeFileSync(AM, s);
if (!fs.statSync(AM).size) { console.log('!! empty artifact'); process.exit(3); }
const IA = load(AM);
console.log(`artifact: amended-E1 build of git HEAD, ia-version=${IA.version}  (index.html untouched)`);

// ══════════════════════════════════════════════════════════════════════════════
// 1. THE DOCTRINE TABLES, READ AS TEXT
// ══════════════════════════════════════════════════════════════════════════════
const TBL = fs.readFileSync(path.join(ROOT, 'doctrine', 'ptg2020_tables_p13_14_16_17.txt'), 'utf8');
function section(name){
  const i = TBL.indexOf(name); if(i < 0) throw new Error('missing section ' + name);
  const hdrEnd = TBL.indexOf('\n', i);                    // header's own trailing '=====' is on this line
  const j = TBL.indexOf('=====', hdrEnd);
  return TBL.slice(hdrEnd, j < 0 ? TBL.length : j);
}
function parseRows(sec, numeric){
  const out = {};
  sec.split('\n').forEach(L => {
    const m = L.match(/^\s*(\d+)\s*\|\s*([0-9.]+)\s*\|\s*(.+?)\s*$/);
    if(!m) return;
    const segs = m[3].trim().split(/\s+/).filter(x => x !== '-').map(Number).filter(x => isFinite(x));
    out[+m[1]] = { total: +m[2], segs };
  });
  return out;
}
const P13 = parseRows(section('PAGE 13 - RUNNING SHORT INTERVALS'));   // metres
const P16 = parseRows(section('PAGE 16 - RUNNING LONG INTERVALS'));    // miles
console.log(`doctrine A: p13 rows parsed = ${Object.keys(P13).length} (expect 26), p16 rows = ${Object.keys(P16).length} (expect 26)`);

// ── Q0: IS DOCTRINE B RENDERABLE AT ALL? ──────────────────────────────────────
const BTXT = fs.readFileSync(path.join(ROOT, 'doctrine', 'nsw_ptg_sealswcc_11pg.txt'), 'utf8');
console.log('\n════ Q0 — FIRST LINE: IS EITHER DOCTRINE UNRENDERABLE? ════');
const tabsPresent = [...new Set((BTXT.match(/Table \d+/g)||[]))].sort();
console.log(`  doctrine B table labels present in the file: ${tabsPresent.join(', ')}`);
console.log(`  "Table 6" occurrences in doctrine B: ${(BTXT.match(/Table 6/g)||[]).length}`);
const t7 = BTXT.indexOf('INT10 x 1/4 mile') >= 0 || BTXT.indexOf('10 x 1/4 mile') >= 0;
console.log(`  Table 7 endpoint corroboration present ("10 x 1/4 mile"): ${t7}`);
console.log(`  Table 7 endpoint corroboration present ("2 x 20 minutes"): ${BTXT.indexOf('2 x 20 minutes')>=0}`);
console.log(`  A p13 rows exceeding the engine's dose contract {k:'reps_dist',reps,m} (mixed segment lengths): ` +
  Object.keys(P13).filter(w => new Set(P13[w].segs).size > 1).length + ' / 26');
console.log(`  A p16 rows with mixed rep distances: ` +
  Object.keys(P16).filter(w => new Set(P16[w].segs).size > 1).length + ' / 26');

// ── B's week-by-week: DECLARED, not read. Stated as an assumption everywhere. ──
// B p9 (line 20): "You should always begin CHI and INT portions of the program at Week 1."
// Endpoints from Table 7 (line 22): INT 10 x 1/4 mile, CHI 2 x 20 minutes, at the late-week
// example schedule. Guide is 26 weeks. Linear ramp declared here:
function B_INT(w){ return Math.min(10, 4 + Math.floor((w-1) * 6 / 25)); }     // 4 -> 10 over 26 wk
function B_CHI(w){                                                            // 15->20, then 2x12->2x20
  if(w <= 13) return { reps:1, mins: Math.round(15 + (w-1) * 5 / 12) };
  const p = (w - 14) / 12;
  return { reps:2, mins: Math.round(12 + p * 8) };
}

// ══════════════════════════════════════════════════════════════════════════════
// 2. TODAY — the engine, at Mario's pinned cfg
// ══════════════════════════════════════════════════════════════════════════════
const SEED = 24865;
const mkCfg = (over) => Object.assign({
  name:'PRT TING', primaryPath:'event', cardioTypes:['run'],
  eventTargeted:true, raceDate:'2026-10-19',
  cardioGoals:{ run:{ id:'run_pace_goal', label:'Hit a Pace / Time Goal', paceUnit:'mi',
    baselineDist:'3', baseline:'3mi', targetDist:'1.5', targetMins:'10', targetSecs:'30',
    targetTime:'10:30', mileBestMins:'8', mileBestSecs:'15', mileBestSrc:{kind:'entered'} } },
  liftingFocus:'support_prevention', experience:'intermediate', ageBracket:'18-35',
  equipment:'full_gym', unit:'lbs', restDays:['sun','wed'], days:DAYS.slice(),
  bench:185, squat:245, deadlift:315, seed:SEED,
}, over || {});

function runDays(prog){
  const out = {}; const wks = prog.weeks || {};
  Object.keys(wks).forEach(w => DAYS.forEach(d => {
    const day = wks[w][d]; if(!day) return; let c = day.cardio; if(!c) return;
    (Array.isArray(c)?c:[c]).forEach(sx => { if(sx && sx.type==='run')
      out[`${w}|${d}`] = { w:+w, d, st:sx.subtype||'', detail:sx.detail||'', dose:sx.dose||null }; });
  }));
  return out;
}
function build(tw){
  const cfg = mkCfg({ _raceDateCappedWeeks: tw });
  const prog = IA.buildProgram(cfg);
  return { prog, tw: prog.totalWeeks, days: runDays(prog) };
}
const R11 = build(11), R5 = build(5);
console.log(`\nTODAY built: 11-wk cfg -> totalWeeks=${R11.tw} (${Object.keys(R11.days).length} run days), ` +
            `5-wk cfg -> totalWeeks=${R5.tw} (${Object.keys(R5.days).length} run days)`);
if(Object.keys(R11.days).length === 0){ console.log('!! NO RUN DAYS RENDERED — failed measurement'); process.exit(4); }

// pace clock, parsed out of TODAY's own cards (the SHARED clock)
function weekPaceOf(R, w){
  // 1) INT card prints "this week's goal of M:SS/mi"
  for(const k of Object.keys(R.days)){
    const c = R.days[k]; if(c.w !== w) continue;
    let m = c.detail.match(/this week's goal of (\d+):(\d\d)\/mi/);
    if(m) return { sec: +m[1]*60 + +m[2], src:'INT goal text' };
  }
  // 2) CHI dose tgt = weekPace * 1.08
  for(const k of Object.keys(R.days)){
    const c = R.days[k]; if(c.w !== w) continue;
    if(/Continuous High Intensity/.test(c.st) && c.dose && c.dose.tgt) return { sec: c.dose.tgt/1.08, src:'CHI tgt/1.08' };
  }
  // 3) cutback INT card holds prior week: fall back to the raw progression
  return null;
}
function ppArr(tw){
  return IA.eval(`(function(){
    buildRunSession('run_pace_goal', 1, 1, ${tw}, 1.5, 'intermediate', null, true, null, 1.5, 630, '18-35', 495, false, null, null);
    var p = buildRunProgressionForLength('run_pace_goal', ${tw}, 1.5, 'intermediate', true).paceProgression;
    return p ? {pp:p.slice(), realistic:p._realisticTarget} : null; })()`);
}
const PP11 = ppArr(11), PP5 = ppArr(5);
function isCut(w, tw){ return tw >= 10 && w % 4 === 0 && w !== tw; }
function clock(R, PP, w){
  const live = weekPaceOf(R, w);
  const idx  = isCut(w, R.tw) && w > 1 ? w - 2 : w - 1;     // cutback holds prior week
  const indep = PP && PP.pp[idx] != null ? PP.pp[idx] : null;
  return { sec: live ? live.sec : indep, live, indep };
}

// ══════════════════════════════════════════════════════════════════════════════
// 3. THE THREE RENDERERS  (prescription only — no second engine)
// ══════════════════════════════════════════════════════════════════════════════
function A_THU(w, wp){                       // SI, p13 row w
  const r = P13[w]; if(!r) return null;
  const pace = wp - 16;                      // A 250-252: 4 s/400m faster = 16 s/mi
  const workS = r.segs.map(m => m / M_PER_MI * pace);
  const workT = workS.reduce((a,b)=>a+b,0);
  const recLo = workS.reduce((a,t)=>a+2.0*t,0), recHi = workS.reduce((a,t)=>a+2.5*t,0);
  return { kind:'SI', segs:r.segs, metres:r.total, pace, workT, recLo, recHi,
    perSegRec: workS.map(t => `${ms(2*t)}-${ms(2.5*t)}`),
    text: `${r.segs.join('/')} m (${r.segs.length} reps, ${r.total} m) @ ${fmt(pace)}/mi · rec 2-2.5x work [${workS.map(t=>ms(2*t)+'-'+ms(2.5*t)).join(', ')}]` };
}
function A_SAT(w, wp){                       // LI, p16 row w
  const r = P16[w]; if(!r) return null;
  const pace = wp * 1.08;
  const workT = r.segs.reduce((a,mi)=>a+mi*pace, 0);
  const nRec = Math.max(0, r.segs.length - 1);
  return { kind:'LI', segs:r.segs, metres:r.total*M_PER_MI, pace, workT,
    recLo: nRec*420, recHi: nRec*600,
    text: `${r.segs.join(' + ')} mi (${r.segs.length} reps, ${r.total} mi) @ ${fmt(pace)}/mi · rec 7-10 min x${nRec}` };
}
function B_THU(w, wp){
  const reps = B_INT(w);
  const pace = wp - 16;                      // same SI pace rule; B gives no numeric pace
  const workT = reps * 400 / M_PER_MI * pace;
  return { kind:'INT', reps, metres: reps*400, pace, workT, recLo: NaN, recHi: NaN,
    text: `${reps} x 400 m @ ~${fmt(pace)}/mi · rec qualitative ("enough to maintain intensity")` };
}
function B_SAT(w, wp){
  const c = B_CHI(w); const pace = wp * 1.08;
  const workT = c.reps * c.mins * 60;
  const nRec = c.reps - 1;
  return { kind:'CHI', reps:c.reps, mins:c.mins, metres: workT / pace * M_PER_MI, pace, workT,
    recLo: nRec*c.mins*60/2, recHi: nRec*c.mins*60/2,
    text: (c.reps===1 ? `${c.mins} min continuous` : `${c.reps} x ${c.mins} min`) + ` @ ${fmt(pace)}/mi` };
}
function todayCell(R, w, day){
  const c = R.days[`${w}|${day}`];
  if(!c) return { text:'(no run)', metres:0, workT:0, recLo:0, recHi:0, kind:'-' };
  const d = c.dose || {};
  let metres = 0, workT = 0, recLo = 0, recHi = 0, kind = c.st.replace(/ —.*/,'');
  if(d.k === 'reps_dist'){ metres = d.reps * d.m; workT = metres / M_PER_MI * d.tgt; }
  else if(d.k === 'reps_time'){ workT = d.reps * d.mins * 60; metres = workT / d.tgt * M_PER_MI; recLo = recHi = (d.reps-1)*d.mins*60/2; }
  else if(d.k === 'time'){ workT = d.mins * 60; metres = workT / (d.tgt||600) * M_PER_MI; }
  else if(d.k === 'dist'){ metres = d.mi * M_PER_MI; workT = d.mi * (d.tgt||600); }
  let short = c.st;
  if(d.k === 'reps_dist') short = `${d.reps} x ${d.m} m @ ${fmt(d.tgt)}/mi · rec 200 m jog`;
  else if(d.k === 'reps_time') short = `${d.reps} x ${d.mins} min @ ${fmt(d.tgt)}/mi · rec ${Math.round(d.mins/2)} min`;
  else if(d.k === 'time') short = `${d.mins} min @ ${fmt(d.tgt||0)}/mi`;
  else if(d.k === 'dist') short = `${d.mi} mi @ ${fmt(d.tgt||0)}/mi`;
  return { text: short, subtype:c.st, metres, workT, recLo, recHi, kind, dose:d };
}

// ══════════════════════════════════════════════════════════════════════════════
// 4. Q1 / Q3 — THE CARD-BY-CARD DIFF
// ══════════════════════════════════════════════════════════════════════════════
function table(R, PP, label){
  console.log(`\n════ ${label} — ${R.tw} WEEKS, EVERY RUN DAY, THREE COLUMNS ════`);
  const rec = [];
  for(let w = 1; w <= R.tw; w++){
    const ck = clock(R, PP, w);
    const wp = ck.sec;
    const cut = isCut(w, R.tw);
    console.log(`\n── Week ${w}${cut?'  [engine cutback week]':''}  · shared week pace = ${wp?fmt(wp):'n/a'}/mi ` +
      `(live=${ck.live?fmt(ck.live.sec)+' via '+ck.live.src:'—'}, indep pp=${ck.indep?fmt(ck.indep):'—'})`);
    const mon = todayCell(R, w, 'mon'), thu = todayCell(R, w, 'thu'), sat = todayCell(R, w, 'sat');
    const aT = wp ? A_THU(w, wp) : null, aS = wp ? A_SAT(w, wp) : null;
    const bT = wp ? B_THU(w, wp) : null, bS = wp ? B_SAT(w, wp) : null;
    console.log(`   MON  TODAY: ${mon.text}   [${mon.subtype||'-'}]`);
    console.log(`        A    : ${mon.text}   (A has no LSD table; LSD identical by construction)`);
    console.log(`        B    : ${mon.text}   (B p2: LSD 40-90 min continuous; identical by construction)`);
    console.log(`   THU  TODAY: ${thu.text}   [${thu.subtype||'-'}]`);
    console.log(`        A SI : ${aT ? aT.text : 'n/a'}`);
    console.log(`        B INT: ${bT ? bT.text : 'n/a'}   [DECLARED ramp — Table 6 absent]`);
    console.log(`   SAT  TODAY: ${sat.text}   [${sat.subtype||'-'}]`);
    console.log(`        A LI : ${aS ? aS.text : 'n/a'}`);
    console.log(`        B CHI: ${bS ? bS.text : 'n/a'}   [DECLARED ramp — Table 6 absent]`);
    rec.push({ w, wp, cut, mon, thu, sat, aT, aS, bT, bS });
  }
  return rec;
}
const REC11 = table(R11, PP11, 'Q1');
const REC5  = table(R5,  PP5,  'Q3  (D106 COMPRESSED — the program he will actually run; table rows 1-5 under BOTH guides, since both index from week 1)');

// ══════════════════════════════════════════════════════════════════════════════
// 5. Q2 — QUANTIFY, WITH DENOMINATORS
// ══════════════════════════════════════════════════════════════════════════════
function quantify(REC, R, label){
  const n = REC.length;
  console.log(`\n════ Q2 — DIVERGENCE, ${label} (${n} weeks) ════`);
  // (a) cells differing, out of 3*n run days
  let dAB=0, dAT=0, dBT=0, denom=0;
  const seg = { mon:{AB:0,AT:0,BT:0}, thu:{AB:0,AT:0,BT:0}, sat:{AB:0,AT:0,BT:0} };
  REC.forEach(r => {
    // MON: identical by construction in all three
    denom += 3;
    // THU
    const a = r.aT ? r.aT.text : '', b = r.bT ? r.bT.text : '', t = r.thu.text;
    const aSame = r.aT && r.thu.dose && r.thu.dose.k==='reps_dist' &&
      new Set(r.aT.segs).size===1 && r.aT.segs.length===r.thu.dose.reps && r.aT.segs[0]===r.thu.dose.m;
    const bSame = r.bT && r.thu.dose && r.thu.dose.k==='reps_dist' && r.bT.reps===r.thu.dose.reps;
    const abSame = r.aT && r.bT && new Set(r.aT.segs).size===1 && r.aT.segs.length===r.bT.reps && r.aT.segs[0]===400;
    if(!abSame){ dAB++; seg.thu.AB++; } if(!aSame){ dAT++; seg.thu.AT++; } if(!bSame){ dBT++; seg.thu.BT++; }
    // SAT
    const satA_is = r.aS ? 'LI' : '-', satB_is = r.bS ? 'CHI' : '-';
    const satT_is = /Continuous High Intensity/.test(r.sat.subtype||'') ? 'CHI' : (/Interval/.test(r.sat.subtype||'') ? 'INT' : 'other');
    if(satA_is !== satB_is){ dAB++; seg.sat.AB++; }
    if(satA_is !== satT_is){ dAT++; seg.sat.AT++; }
    if(satB_is !== satT_is || !r.bS || !r.sat.dose || r.sat.dose.k==='reps_dist' ||
       (r.sat.dose.k==='time' ? r.bS.reps!==1 || r.bS.mins!==r.sat.dose.mins
        : r.bS.reps!==r.sat.dose.reps || r.bS.mins!==r.sat.dose.mins)){ dBT++; seg.sat.BT++; }
  });
  console.log(`(a) cells differing, out of ${denom} run days (${n} wk x 3 days):`);
  console.log(`      A vs B     : ${dAB}/${denom} = ${(100*dAB/denom).toFixed(1)}%   seg {mon:0, thu:${seg.thu.AB}, sat:${seg.sat.AB}}`);
  console.log(`      A vs TODAY : ${dAT}/${denom} = ${(100*dAT/denom).toFixed(1)}%   seg {mon:0, thu:${seg.thu.AT}, sat:${seg.sat.AT}}`);
  console.log(`      B vs TODAY : ${dBT}/${denom} = ${(100*dBT/denom).toFixed(1)}%   seg {mon:0, thu:${seg.thu.BT}, sat:${seg.sat.BT}}`);
  console.log(`      MON is identical in all three by construction: 0/${n} differ.`);

  // (b) weekly quality metres
  console.log(`\n(b) QUALITY METRES PER WEEK (THU + SAT work, recovery excluded):`);
  const tot = {T:0,A:0,B:0};
  console.log(`      wk |    TODAY |        A |        B`);
  REC.forEach(r => {
    const T = Math.round((r.thu.metres||0) + (r.sat.metres||0));
    const A = Math.round((r.aT?r.aT.metres:0) + (r.aS?r.aS.metres:0));
    const B = Math.round((r.bT?r.bT.metres:0) + (r.bS?r.bS.metres:0));
    tot.T+=T; tot.A+=A; tot.B+=B;
    console.log(`      ${String(r.w).padStart(2)} | ${String(T).padStart(8)} | ${String(A).padStart(8)} | ${String(B).padStart(8)}`);
  });
  console.log(`      ${n}-wk total: TODAY=${tot.T} m   A=${tot.A} m   B=${tot.B} m`);
  console.log(`      ratios vs TODAY: A=${(tot.A/tot.T).toFixed(3)}x  B=${(tot.B/tot.T).toFixed(3)}x`);
  // (b') PREMISE CHECK — the brief assumed TODAY runs TWO quality slots (THU + SAT).
  // It does not. Count how many of TODAY's SAT cells are actually quality.
  const satQual = REC.filter(r => /Interval|Continuous High Intensity/.test(r.sat.subtype||'')).length;
  const thuQual = REC.filter(r => /Interval|Continuous High Intensity/.test(r.thu.subtype||'')).length;
  console.log(`\n(b') PREMISE CHECK — quality slots per week actually rendered by TODAY:`);
  console.log(`      THU is a quality session in ${thuQual}/${n} weeks; SAT is a quality session in ${satQual}/${n} weeks.`);
  console.log(`      TODAY therefore runs ${( (thuQual+satQual)/n ).toFixed(2)} quality days/week; A and B both prescribe 2.00.`);
  console.log(`      Re-stated with TODAY's SAT LSD REMOVED from the numerator (like-for-like quality metres):`);
  let tq = 0; REC.forEach(r => { tq += (/Interval|Continuous High Intensity/.test(r.thu.subtype||'') ? r.thu.metres : 0)
                                      + (/Interval|Continuous High Intensity/.test(r.sat.subtype||'') ? r.sat.metres : 0); });
  console.log(`      TODAY quality metres = ${Math.round(tq)} m over ${n} wk   A = ${tot.A} m (${(tot.A/tq).toFixed(2)}x)   B = ${tot.B} m (${(tot.B/tq).toFixed(2)}x)`);
  console.log(`      TODAY THU dose series: ` + REC.map(r => { const d=r.thu.dose||{};
      return d.k==='reps_dist' ? `w${r.w}:${d.reps}x400m` : d.k==='reps_time' ? `w${r.w}:${d.reps}x${d.mins}min` : d.k==='time' ? `w${r.w}:${d.mins}min` : `w${r.w}:LSD`; }).join(' '));
  console.log(`      A SI  rep series:      ` + REC.map(r => `w${r.w}:${r.aT?r.aT.segs.length:'-'}(${r.aT?r.aT.metres:'-'}m)`).join(' '));
  console.log(`      B INT rep series:      ` + REC.map(r => `w${r.w}:${r.bT?r.bT.reps:'-'}x400m`).join(' '));

  // (c) time on feet including recovery
  console.log(`\n(c) TIME ON FEET PER QUALITY SESSION (work + mid-range recovery, m:ss):`);
  console.log(`      wk |      THU TODAY /        A /        B |      SAT TODAY /        A /        B`);
  REC.forEach(r => {
    const tof = x => x ? ms(x.workT + ((isFinite(x.recLo)?x.recLo:0) + (isFinite(x.recHi)?x.recHi:0))/2) : '  n/a';
    const tT = ms(r.thu.workT + (r.thu.recLo+r.thu.recHi)/2);
    const sT = ms(r.sat.workT + (r.sat.recLo+r.sat.recHi)/2);
    console.log(`      ${String(r.w).padStart(2)} | ${tT.padStart(14)} / ${tof(r.aT).padStart(8)} / ${(r.bT?ms(r.bT.workT)+'+rec?':'n/a').padStart(8)} | ` +
                `${sT.padStart(14)} / ${tof(r.aS).padStart(8)} / ${tof(r.bS).padStart(8)}`);
  });

  // (d) THU recovery delivered
  console.log(`\n(d) THU RECOVERY DELIVERED, as a ratio of work time:`);
  console.log(`      A prescribes 2.0-2.5x by doctrine (p13 header, A line 249).`);
  const ratios = [];
  REC.forEach(r => {
    const d = r.thu.dose;
    if(!(d && d.k==='reps_dist')) { console.log(`      wk ${r.w}: TODAY THU is not an interval session (${r.thu.subtype})`); return; }
    // TODAY: "walk or jog 200m between reps". Recovery pace read off the SAME chart row
    // the engine used for this week's recovery prescription (the LSD/MON card's tgt).
    const recPace = (r.mon.dose && r.mon.dose.tgt) ? r.mon.dose.tgt : null;
    if(!recPace){ console.log(`      wk ${r.w}: no recovery-pace anchor on MON`); return; }
    const workPerRep = d.m / M_PER_MI * d.tgt;
    const recPerRep  = 200 / M_PER_MI * recPace;
    ratios.push(recPerRep/workPerRep);
    console.log(`      wk ${String(r.w).padStart(2)}: work ${ms(workPerRep)}/rep @ ${fmt(d.tgt)}/mi · TODAY rec 200 m @ ${fmt(recPace)}/mi = ${ms(recPerRep)} = ` +
      `${(recPerRep/workPerRep).toFixed(3)}x   | A would give ${ms(2*workPerRep)}-${ms(2.5*workPerRep)} (2.0-2.5x)  | B gives no number`);
  });
  if(ratios.length) console.log(`      TODAY mean ratio = ${(ratios.reduce((a,b)=>a+b,0)/ratios.length).toFixed(3)}x over ${ratios.length}/${n} weeks  (A floor 2.0x -> shortfall ${( (ratios.reduce((a,b)=>a+b,0)/ratios.length) /2).toFixed(2)} of doctrine minimum)`);

  // (e) rep ceiling reached
  const lastT = REC[REC.length-1].thu.dose, lastA = REC[REC.length-1].aT, lastB = REC[REC.length-1].bT;
  const maxT = Math.max(...REC.map(r => (r.thu.dose&&r.thu.dose.k==='reps_dist')?r.thu.dose.reps:0));
  const maxA = Math.max(...REC.map(r => r.aT?r.aT.segs.length:0));
  const maxB = Math.max(...REC.map(r => r.bT?r.bT.reps:0));
  console.log(`\n(e) REP-COUNT CEILING actually reached by week ${n}:`);
  console.log(`      TODAY: max ${maxT} reps (final week ${lastT&&lastT.k==='reps_dist'?lastT.reps:'n/a'}) — doctrine cap 8`);
  console.log(`      A    : max ${maxA} intervals (final week ${lastA?lastA.segs.length:'n/a'}) — doctrine cap 8`);
  console.log(`      B    : max ${maxB} reps (final week ${lastB?lastB.reps:'n/a'}) — doctrine cap 10`);
}
quantify(REC11, R11, '11-WEEK');
quantify(REC5,  R5,  '5-WEEK COMPRESSED (D106)');

// ══════════════════════════════════════════════════════════════════════════════
// 6. Q4 — WHERE A IS SILENT AND B FILLS IT  (enumeration only, no ruling)
// ══════════════════════════════════════════════════════════════════════════════
console.log('\n════ Q4 — WHAT B SUPPLIES THAT A DOES NOT (list only, no ruling) ════');
const SILENCES = [
  ['3-run-day week structure',        'A: no weekly schedule table anywhere in 22 pages.', 'B Table 5 (line 20): Mon LSD / Thu INT / Sat CHI for running.'],
  ['same-day lifting placement',      'A: silent.', 'B line 20: "the schedule does not place upper body strength training and swimming or lower body strength training and running on the same days"; Table 5 Lift row Upper/Lower/Upper/Lower.'],
  ['warm-up protocol for quality',    'A: silent on warm-up duration.', 'B p8 (line 20): "For CHI and INT workouts, you should warm up for 10-15 minutes or more... add 4-5 high-intensity bursts lasting from 15 to 30 seconds."'],
  ['cool-down protocol',              'A: silent.', 'B p8: LSD 2-3 min easy jog + 2-3 min brisk walk; CHI/INT extended until breathing easy.'],
  ['week-1 indexing rule',            'A: tables are 26 rows with no instruction on where to enter.', 'B p9 (line 20): "You should always begin CHI and INT portions of the program at Week 1."'],
  ['entering LSD at a later week',    'A: silent.', 'B p9: "If you are already doing higher LSD mileage, you may begin at a later week in the program or add a second LSD session (see Table 7)."'],
  ['the CHI session type itself',     'A: has LSD + SI + LI only. There is no continuous-tempo session in A.', 'B p3: CHI = 15-20 min continuous at 90-95% of max sustainable pace, RPE 8-9.'],
  ['strength dose (sets/reps)',       'A: not in the running chapter measured here.', 'B p5 (line 14): single set of 8-12 reps, 8-12 exercises per session, upper/lower split on alternate days.'],
  ['calisthenics + core progression', 'A: silent here.', 'B Tables 2 and 3 (lines 14, 18).'],
  ['weak-event weighting',            'A: silent.', 'B p10-11 (line 22) Table 8: bias the schedule toward the slower event; run slower than 10:38 is the stated threshold.'],
  ['active recovery between reps',    'A: states it for both SI and LI (lines 269-270, ~300).', 'B p4 also states it ("brisk walking, easy stroking or slow jogging"). NOT a silence — both agree.'],
];
SILENCES.forEach((r,i) => { console.log(`  ${i+1}. ${r[0]}`); console.log(`       A: ${r[1]}`); console.log(`       B: ${r[2]}`); });
console.log(`  count: ${SILENCES.length - 1} silences in A that B fills, + 1 row where both speak and agree.`);

// ══════════════════════════════════════════════════════════════════════════════
// 7. Q5 — SANITY CHECK ON THE HAND-TRANSCRIBED TABLES
// ══════════════════════════════════════════════════════════════════════════════
console.log('\n════ Q5 — HAND-TRANSCRIBED TABLE SANITY (independent of the checksum) ════');
let f13 = 0, chk13 = 0;
const W = Object.keys(P13).map(Number).sort((a,b)=>a-b);
let prev = -Infinity;
W.forEach(w => {
  const r = P13[w];
  const sum = r.segs.reduce((a,b)=>a+b,0);
  chk13++;
  if(sum !== r.total){ console.log(`  FAIL p13 wk ${w}: segments sum ${sum} != stated total ${r.total}`); f13++; }
  if(r.total < prev){ console.log(`  FAIL p13 wk ${w}: total ${r.total} < previous week ${prev} (prose: progressive build)`); f13++; }
  prev = r.total;
  if(r.segs.length > 8){ console.log(`  FAIL p13 wk ${w}: ${r.segs.length} intervals > 8 (A line 259-260: "Do not run more than 8 intervals")`); f13++; }
  if(r.total > 3200){ console.log(`  FAIL p13 wk ${w}: total ${r.total} > 3200 m (A line 267-268)`); f13++; }
});
console.log(`  p13: ${chk13} rows checked, ${f13} violations (monotone non-decreasing / <=8 intervals / <=3200 m / self-checksum).`);
let f16 = 0, chk16 = 0, nonMono16 = [];
const W16 = Object.keys(P16).map(Number).sort((a,b)=>a-b);
let prev16 = -Infinity;
W16.forEach(w => {
  const r = P16[w];
  const sum = +r.segs.reduce((a,b)=>a+b,0).toFixed(4);
  chk16++;
  if(Math.abs(sum - r.total) > 1e-6){ console.log(`  FAIL p16 wk ${w}: segments sum ${sum} != stated total ${r.total}`); f16++; }
  if(r.segs.length > 4){ console.log(`  FAIL p16 wk ${w}: ${r.segs.length} intervals > 4 (A line 292: "1-4 intervals")`); f16++; }
  if(w >= 21 && (r.total < 4 || r.total > 4.5)){ console.log(`  FAIL p16 wk ${w}: late-block total ${r.total} outside 4-4.5 (A line 293-294)`); f16++; }
  if(r.total > 4.5){ console.log(`  FAIL p16 wk ${w}: total ${r.total} > 4.5 mi ceiling`); f16++; }
  if(r.total < prev16) nonMono16.push(`wk ${w}: ${r.total} < wk ${w-1}: ${prev16}`);
  prev16 = r.total;
});
console.log(`  p16: ${chk16} rows checked, ${f16} hard violations.`);
console.log(`  p16 non-monotone steps (NOT a violation — A line 293 only says "increase the total work to 4-4.5", not monotonically): ${nonMono16.length}` +
  (nonMono16.length ? '\n    ' + nonMono16.join('\n    ') : ''));
// A prose: LI reps must come from {1, 1.25, 1.5, 2, 3} miles (line 293-294)
const ALLOWED_LI = new Set([1, 1.25, 1.5, 2, 3]);
let badLI = [];
W16.forEach(w => P16[w].segs.forEach(mi => { if(!ALLOWED_LI.has(mi)) badLI.push(`wk ${w}: ${mi} mi`); }));
console.log(`  p16 rep distances outside A's stated menu {1, 1.25, 1.5, 2, 3} mi: ${badLI.length}` + (badLI.length ? ' -> ' + badLI.join(', ') : ''));
// A prose: SI segments must come from {200, 300, 400, 600, 800} m (line 265-266)
const ALLOWED_SI = new Set([200, 300, 400, 600, 800]);
let badSI = [];
W.forEach(w => P13[w].segs.forEach(m => { if(!ALLOWED_SI.has(m)) badSI.push(`wk ${w}: ${m} m`); }));
console.log(`  p13 segment lengths outside A's stated menu {200, 300, 400, 600, 800} m: ${badSI.length}` + (badSI.length ? ' -> ' + badSI.join(', ') : ''));
console.log(`\n  TOTAL Q5: PASS ${chk13 + chk16 - f13 - f16} FAIL ${f13 + f16}`);
console.log('\n[done]');
