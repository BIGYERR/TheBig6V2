// V202 measure pass 3 — D100/D101 target wiring.
// Q-P1: is the entered goal (and the entered current pace, and ageBracket) read at all?
// Q-P2: counterfactual printed from SOURCE-SURGERY COPIES (CLAUDE.md standing ruling 5),
//       never off a built artifact.
// Oracle: the pace-progression formula as WRITTEN AT index.html:3517-3546 is the contract;
//   expected values are computed here by hand arithmetic from the athlete's entered fields
//   (mile best 8:15 = 495 s, goal 1.5 mi in 10:30 = 630 s => 420 s/mi) and from
//   doctrine/physicaltrainingguide2020.txt (400 m repeat = mile pace x 0.2475 -> 119.0 s
//   at a 8:00/mi mile target). Never from the engine's own output.
// Read-only. Usage: node tests/measure/v202_d100_target_wiring.js
const path = require('path'), fs = require('fs');
const { load, progDigest, fixtures } = require(path.join(__dirname, '..', 'harness.js'));

const ROOT = path.join(__dirname, '..', '..');
const SP = '/private/tmp/claude-501/-Users-CanasBangin-Desktop-TheBig6V2/1580846a-7cbc-414f-9eda-cd358cd095ca/scratchpad';
const ART = {
  V201: path.join(ROOT, 'index.html'),
  A:    path.join(SP, 'surgA.html'),
  AB:   path.join(SP, 'surgAB.html'),
};
const IA = {};
for (const k of Object.keys(ART)) { IA[k] = load(ART[k]); }
console.log('artifacts: ' + Object.keys(ART).map(k => k + '=ia' + IA[k].version).join(' '));

const fmt = s => `${Math.floor(s/60)}:${String(Math.round(s%60)).padStart(2,'0')}`;
const DAYS = ['sun','mon','tue','wed','thu','fri','sat'];

// ── cfg builders (reused from v202_run_path_A.js) ───────────────────────────
const SEED = 24865;
const base = (over) => Object.assign({
  name:'PRT TING', primaryPath:'event', cardioTypes:['run'],
  eventTargeted:true, raceDate:'2026-10-19',
  liftingFocus:'support_prevention', experience:'intermediate', ageBracket:'18-35',
  equipment:'full_gym', unit:'lbs',
  restDays:['sun','wed'], days:DAYS.slice(),
  bench:185, squat:245, deadlift:315, seed:SEED,
}, over || {});
const paceGoal = (g, over) => base(Object.assign({ cardioGoals:{ run: Object.assign({
  id:'run_pace_goal', label:'Hit a Pace / Time Goal', paceUnit:'mi',
  baselineDist:'3', baseline:'3mi' }, g) } }, over || {}));

// THE pinned "PRT TING" cfg: 8:15 current mile, goal 1.5 mi in 10:30.
const PINNED = paceGoal({ targetDist:'1.5', targetMins:'10', targetSecs:'30', targetTime:'10:30',
                          mileBestMins:'8', mileBestSecs:'15', mileBestSrc:{kind:'entered'} });

// ── extraction helpers (read the RENDERED prescription, not engine internals) ──
function runSessions(prog){
  const out = [];
  const wks = prog.weeks || {};
  Object.keys(wks).sort((a,b)=>+a-+b).forEach(w => DAYS.forEach(d => {
    const day = wks[w][d]; if (!day) return;
    let c = day.cardio; if (!c) return;
    (Array.isArray(c)?c:[c]).forEach(s => { if (s && s.type === 'run')
      out.push({ w:+w, d, st:s.subtype||'', detail:s.detail||'', note:s.note||'', dose:s.dose||null, title:s.title||'' });
    });
  }));
  return out;
}
// Pace signature = every pace token the athlete can read, in week/day order.
function paceSig(prog){
  return runSessions(prog).map(s => {
    const paces = (s.detail.match(/\d+:\d\d\/mi/g) || []).join(',');
    const tgt = s.dose && s.dose.tgt != null ? 'tgt' + s.dose.tgt : '';
    return `W${s.w}${s.d}${s.st}|${paces}|${tgt}`;
  }).join(';');
}
function cellSig(prog){                      // whole-program cell signature for regression counts
  return JSON.stringify(prog.weeks, (k,v) => (k==='id'||k==='created'||k==='_swapUniverse'||k==='_swapUniverseByKey') ? undefined : v);
}
// The engine's own week goal, as PRINTED to the athlete ("this week's goal of M:SS/mi").
function weekGoalsPrinted(prog){
  const m = {};
  runSessions(prog).forEach(s => {
    const g = s.detail.match(/goal of (\d+:\d\d)\/mi/);
    if (g) m[s.w] = g[1];
  });
  return m;
}
function build(k, cfg){ return IA[k].buildProgram(JSON.parse(JSON.stringify(cfg))); }
// Reach the non-exported progression builder to READ the array it built for this cfg.
// Statics are sticky from the last buildRunSession call of the build just performed.
function ppFor(k, prog, cfg){
  const tw = prog.totalWeeks;
  const bm = parseFloat(cfg.cardioGoals.run.baselineDist) || 1.5;
  try {
    const r = IA[k].eval(`(function(){ const p = buildRunProgressionForLength('run_pace_goal', ${tw}, ${bm}, '${cfg.experience}', true).paceProgression;
      return JSON.stringify({arr:p, dampened:p._dampened, gain:p._weeklyGain, real:p._realisticTarget, orig:p._originalTarget,
                             ip:buildRunProgressionForLength._initialPace, tp:buildRunProgressionForLength._targetPace,
                             imp:buildRunProgressionForLength._paceImprovePerWeek}); })()`);
    return JSON.parse(r);
  } catch(e){ return { err: e.message }; }
}

let SECTION = (t) => console.log('\n' + '='.repeat(78) + '\n' + t + '\n' + '='.repeat(78));

// ════════════════════════════════════════════════════════════════════════════
SECTION('Q-P1a  SOURCE ADJUDICATION (quoted from index.html)');
const src = fs.readFileSync(ART.V201, 'utf8').split('\n');
const quote = (a,b) => { for (let i=a;i<=b;i++) console.log(String(i).padStart(4)+': '+src[i-1]); };
console.log('--- index.html:3578-3590 (the READ side) ---'); quote(3578, 3590);
console.log('--- index.html:3553 (the signature: arguments[0..8] are NAMED) ---'); quote(3553, 3553);
console.log('--- index.html:5325-5340 (the WRITE side: the single call site) ---'); quote(5325, 5340);
console.log('\ngrep COUNTS in index.html:');
['arguments\\[9\\]','arguments\\[10\\]','arguments\\[11\\]','arguments\\[12\\]','buildRunSession\\(','_paceImprovePerWeek','_targetPace','agePaceScale']
  .forEach(p => { const re = new RegExp(p, 'g');
    console.log('  /' + p + '/ -> ' + (fs.readFileSync(ART.V201,'utf8').match(re)||[]).length); });

// ════════════════════════════════════════════════════════════════════════════
SECTION('Q-P1b  SWEEP: vary ONLY targetMins / targetSecs / targetDist (V201)');
const targets = [];
for (const dist of ['1','1.5','2','3','5'])
  for (const mm of ['5','6','7','8','10','12','20','25'])
    for (const ss of ['0','30'])
      targets.push({ targetDist:dist, targetMins:mm, targetSecs:ss, targetTime:`${mm}:${ss.padStart(2,'0')}` });
const anchors = [ {}, { mileBestMins:'8', mileBestSecs:'15', mileBestSrc:{kind:'entered'} } ];
let n = 0; const sigs = {}; const byAnchor = {};
for (const anch of anchors) {
  const key = anch.mileBestMins ? 'anchor 8:15 entered' : 'no anchor';
  byAnchor[key] = {};
  for (const t of targets) {
    const cfg = paceGoal(Object.assign({}, t, anch));
    const prog = build('V201', cfg);
    const s = paceSig(prog);
    sigs[s] = (sigs[s]||0)+1; byAnchor[key][s] = (byAnchor[key][s]||0)+1; n++;
  }
}
console.log(`builds: ${n} (2 anchors x ${targets.length} goal entries), everything else held`);
console.log(`DISTINCT prescribed-pace signatures across all ${n}: ${Object.keys(sigs).length}`);
Object.keys(byAnchor).forEach(k => console.log(`  segment "${k}" (${targets.length} builds): ${Object.keys(byAnchor[k]).length} distinct signature(s)`));
const changed = n - Math.max(...Object.values(sigs));
console.log(`builds whose paces differ from the modal signature: ${changed} / ${n}`);

// ════════════════════════════════════════════════════════════════════════════
SECTION('Q-P1c  _targetPace and ageBracket reachability (V201)');
const EXPDEF = { beginner:690, intermediate:570, advanced:450 };
let tpOk = 0, tpTot = 0, tpBad = [];
for (const exp of ['beginner','intermediate','advanced']) {
  for (const t of targets.slice(0, 20)) {
    const cfg = paceGoal(Object.assign({}, t, { mileBestMins:'8', mileBestSecs:'15' }), { experience: exp });
    const prog = build('V201', cfg);
    const got = IA.V201.eval('buildRunProgressionForLength._targetPace');
    const want = EXPDEF[exp] * 0.85;
    tpTot++;
    if (Math.abs(got - want) < 1e-9) tpOk++; else tpBad.push(`${exp} ${t.targetDist}mi ${t.targetTime}: got ${got} want ${want}`);
  }
}
console.log(`ORACLE: _targetPace must equal 0.85 x expPaceDefaults[experience] if the goal is unread.`);
console.log(`_targetPace === 0.85 x default on ${tpOk}/${tpTot} builds (${(100*tpOk/tpTot).toFixed(1)}%)`);
tpBad.slice(0,5).forEach(x => console.log('  MISMATCH ' + x));
console.log('  per experience: beginner want ' + EXPDEF.beginner*0.85 + ', intermediate want ' + EXPDEF.intermediate*0.85 + ', advanced want ' + EXPDEF.advanced*0.85);

console.log('\nageBracket sweep (V201): 18-35 / 36-54 / 55+, all else held');
for (const art of ['V201','A','AB']) {
  const ageSigs = {};
  ['18-35','36-54','55+'].forEach(ab => {
    const cfg = paceGoal({ targetDist:'1.5', targetMins:'10', targetSecs:'30', targetTime:'10:30',
                           mileBestMins:'8', mileBestSecs:'15' }, { ageBracket: ab });
    const prog = build(art, cfg);
    const s = paceSig(prog);
    ageSigs[ab] = { sig:s, imp: IA[art].eval('buildRunProgressionForLength._paceImprovePerWeek') };
  });
  const uniq = new Set(Object.values(ageSigs).map(x=>x.sig));
  console.log(`  [${art}] distinct pace signatures across 3 age brackets: ${uniq.size} / 3  |  _paceImprovePerWeek: ` +
    Object.entries(ageSigs).map(([k,v])=>k+'='+v.imp).join(' '));
}

// ════════════════════════════════════════════════════════════════════════════
SECTION("Q-P1d  coach's arithmetic check (PINNED cfg, V201)");
const pV = build('V201', PINNED);
const ppV = ppFor('V201', pV, PINNED);
console.log(`totalWeeks=${pV.totalWeeks} startDate=${pV.startDate}`);
console.log(`engine statics: _initialPace=${ppV.ip} _targetPace=${ppV.tp} _paceImprovePerWeek=${ppV.imp}`);
console.log(`paceProgression = [${(ppV.arr||[]).join(' ')}]  dampened=${ppV.dampened} gain=${ppV.gain} realistic=${ppV.real} original=${ppV.orig}`);
console.log(`ORACLE: 570*0.85 = ${570*0.85};  (570-484.5)/9 = ${((570-484.5)/9).toFixed(4)};  484.5*1.08 = ${(484.5*1.08).toFixed(1)} s = ${fmt(484.5*1.08)}/mi`);
runSessions(pV).filter(s=>['int','chi'].includes(s.st)).forEach(s =>
  console.log(`  W${s.w} ${s.d.toUpperCase()} ${s.st.toUpperCase()} :: ${s.detail}`));

// ════════════════════════════════════════════════════════════════════════════
SECTION('Q-P2  COUNTERFACTUAL — V201 | +A | +A+B on the PINNED "PRT TING" cfg');
const P = {}; const PP = {};
for (const k of ['V201','A','AB']) { P[k] = build(k, PINNED); PP[k] = ppFor(k, P[k], PINNED); }
console.log('\n--- P2a  paceProgression ---');
for (const k of ['V201','A','AB']) {
  const p = PP[k];
  console.log(`[${k.padEnd(4)}] tw=${P[k].totalWeeks} ip=${p.ip} tp=${p.tp} impPerWk=${p.imp} gain=${p.gain} realistic=${p.real} orig=${p.orig} dampened=${p.dampened}`);
  console.log(`        pp = [${(p.arr||[]).join(' ')}]`);
  console.log(`        pp(m:ss) = [${(p.arr||[]).map(fmt).join(' ')}]`);
}
console.log("\nCOACH PREDICTED +A pp = 495 486.7 478.3 [478.3] 461.7 453.3 445 [445] 428.3 420 420");
console.log("COACH PREDICTED +A+B: gain 5, realistic 450");

console.log('\n--- P2b  THU (INT/CHI) by week: subtype, reps, prescribed pace, stated week goal ---');
for (const k of ['V201','A','AB']) {
  console.log(`[${k}]`);
  runSessions(P[k]).filter(s => s.d === 'thu').forEach(s => {
    const g = (s.detail.match(/goal of (\d+:\d\d)\/mi/)||[])[1] || '-';
    const rp = (s.detail.match(/(\d+)x(\d+)m at (\d+:\d\d)\/mi/)||[]);
    console.log(`  W${String(s.w).padStart(2)} ${s.st.toUpperCase().padEnd(4)} reps=${rp[1]||'-'}x${rp[2]||'-'}m pace=${rp[3]||(s.detail.match(/\d+:\d\d\/mi/)||['-'])[0]} tgt=${s.dose&&s.dose.tgt!=null?s.dose.tgt:'-'} weekGoal=${g}`);
  });
}
console.log('\n--- P2c  W1 and W6 MON / SAT LSD distance and pace ---');
for (const k of ['V201','A','AB']) {
  console.log(`[${k}]`);
  runSessions(P[k]).filter(s => [1,6].includes(s.w) && ['mon','sat'].includes(s.d)).forEach(s =>
    console.log(`  W${s.w} ${s.d.toUpperCase()} ${s.st.padEnd(9)} :: ${s.detail.slice(0,150)}`));
}
console.log('\n--- P2d  dampened-note branch (index.html:3831-3839) ---');
for (const k of ['V201','A','AB']) {
  const fired = runSessions(P[k]).filter(s => /Pace capped at/.test(s.note));
  console.log(`[${k}] _dampened=${PP[k].dampened}  notes firing: ${fired.length}`);
  if (fired.length) console.log(`   W${fired[0].w} ${fired[0].d}: ${fired[0].note}`);
}

// ════════════════════════════════════════════════════════════════════════════
SECTION('Q-P2e  REGRESSION GUARD — non-pace-goal lattice, V201 vs +A vs +A+B');
const others = {};
[['run_5k','3.1'],['run_10k','6.2'],['run_half','13.1'],['run_marathon','26.2'],['run_base','5']].forEach(([id,bd]) => {
  ['beginner','intermediate','advanced'].forEach(exp => {
    others[`${id}/${exp}`] = base({ cardioGoals:{ run:{ id, label:id, mileBestMins:'8', mileBestSecs:'15', baselineDist:bd, baseline:bd+'mi' } },
                                    experience:exp, raceDate:'2026-12-20' });
  });
});
['bike_base','bike_ftp'].forEach(id => { others[id] = base({ cardioTypes:['bike'], cardioGoals:{ bike:{ id, label:id } } }); });
['swim_base','swim_distance'].forEach(id => { others[id] = base({ cardioTypes:['swim'], cardioGoals:{ swim:{ id, label:id } } }); });
let regN = 0, regA = 0, regAB = 0; const regBad = [];
for (const [k, cfg] of Object.entries(others)) {
  const b = cellSig(build('V201', cfg)), a = cellSig(build('A', cfg)), ab = cellSig(build('AB', cfg));
  regN++; if (a !== b) { regA++; regBad.push('+A  changed ' + k); }
  if (ab !== b) { regAB++; regBad.push('+A+B changed ' + k); }
}
console.log(`non-pace-goal configs: ${regN}  |  changed under +A: ${regA}/${regN}  |  changed under +A+B: ${regAB}/${regN}`);
regBad.forEach(x => console.log('  !! ' + x));
console.log('\nHALF_MANNY digest:');
for (const k of ['V201','A','AB']) {
  const d1 = progDigest(build(k, fixtures.HALF_MANNY)), d2 = progDigest(build(k, fixtures.HALF_MANNY));
  console.log(`  [${k.padEnd(4)}] ${d1}  self-stable=${d1===d2?'yes':'NO'}  vs pin d4364dd3fa63a3a1: ${d1==='d4364dd3fa63a3a1'?'UNMOVED':'MOVED'}`);
}

// ════════════════════════════════════════════════════════════════════════════
SECTION('Q-P2f  BEGINNER GUARD (V172 rule: beginner always 690 = 11:30/mi)');
for (const k of ['V201','A','AB']) {
  const cfg = paceGoal({ targetDist:'1.5', targetMins:'10', targetSecs:'30', targetTime:'10:30',
                         mileBestMins:'8', mileBestSecs:'15' }, { experience:'beginner' });
  const p = build(k, cfg); const pp = ppFor(k, p, cfg);
  console.log(`  [${k.padEnd(4)}] _initialPace=${pp.ip} (want 690) pp[0]=${(pp.arr||[])[0]} _targetPace=${pp.tp}  PASS=${pp.ip===690}`);
}

// ════════════════════════════════════════════════════════════════════════════
SECTION('Q-P2g  HOW MANY BUILDS DOES +A+B CHANGE — full lattice');
const lat = [];
const GOALS = {
  run_pace_goal: g => ({ id:'run_pace_goal', label:'pace', paceUnit:'mi', baselineDist:'3', baseline:'3mi', ...g }),
};
let latN = 0, latA = 0, latAB = 0; const seg = {};
for (const exp of ['beginner','intermediate','advanced'])
  for (const age of ['18-35','36-54','55+'])
    for (const t of [{targetDist:'1',targetMins:'6',targetSecs:'30'},{targetDist:'1.5',targetMins:'10',targetSecs:'30'},
                     {targetDist:'3',targetMins:'21',targetSecs:'0'},{targetDist:'5',targetMins:'45',targetSecs:'0'}])
      for (const anch of [{}, {mileBestMins:'8',mileBestSecs:'15'}, {mileBestMins:'6',mileBestSecs:'45'}, {mileBestMins:'11',mileBestSecs:'0'}])
        for (const sd of [24865, 11111, 90210])
          for (const rd of [['sun','wed'],['sun','wed','fri']]) {
            const cfg = paceGoal(Object.assign({targetTime:`${t.targetMins}:${String(t.targetSecs).padStart(2,'0')}`}, t, anch),
                                 { experience:exp, ageBracket:age, seed:sd, restDays:rd });
            const b = cellSig(build('V201', cfg)), a = cellSig(build('A', cfg)), ab = cellSig(build('AB', cfg));
            latN++;
            const key = `run_pace_goal/${exp}`;
            seg[key] = seg[key] || { n:0, a:0, ab:0 };
            seg[key].n++;
            if (a !== b) { latA++; seg[key].a++; }
            if (ab !== b) { latAB++; seg[key].ab++; }
          }
console.log(`run_pace_goal lattice: ${latN} builds (3 exp x 3 age x 4 goals x 4 anchors x 3 seeds x 2 rest patterns)`);
console.log(`  changed by +A   : ${latA}/${latN} (${(100*latA/latN).toFixed(1)}%)`);
console.log(`  changed by +A+B : ${latAB}/${latN} (${(100*latAB/latN).toFixed(1)}%)`);
Object.entries(seg).forEach(([k,v]) => console.log(`  ${k.padEnd(28)} n=${v.n}  +A=${v.a}  +A+B=${v.ab}`));
console.log(`\nTOTAL builds this pass: ${n + tpTot + 9 + 3 + regN*3 + 3 + latN*3}`);
console.log('MEASURE PASS COMPLETE');

// ════════════════════════════════════════════════════════════════════════════
// APPENDIX (run with --appendix): Q-P1b segmented by totalWeeks.
// calcProgramLength (index.html:3113-3122) DOES read targetDist/Mins/Secs and sets
// program LENGTH. So a raw signature diff conflates length with pace. Segment by tw
// and ask the only question that matters: for a FIXED tw, do the per-week prescribed
// pace VALUES ever move when the goal moves?
if (process.argv.includes('--appendix')) {
  const buckets = {};
  let N = 0;
  for (const anch of [{}, { mileBestMins:'8', mileBestSecs:'15' }])
    for (const dist of ['1','1.5','2','3','5'])
      for (const mm of ['5','6','7','8','10','12','20','25'])
        for (const ss of ['0','30']) {
          const cfg = paceGoal(Object.assign({ targetDist:dist, targetMins:mm, targetSecs:ss,
                                               targetTime:`${mm}:${ss.padStart(2,'0')}` }, anch));
          const prog = build('V201', cfg);
          const tw = prog.totalWeeks;
          // pace VALUES only, week/day/subtype keyed — length-independent within a bucket
          const vals = runSessions(prog).map(s => `W${s.w}${s.d}${s.st}=${s.dose&&s.dose.tgt!=null?s.dose.tgt:''}/${(s.detail.match(/\d+:\d\d\/mi/g)||[]).join(',')}`).join(';');
          const ak = anch.mileBestMins ? 'anchor8:15' : 'noAnchor';
          buckets[ak+'|tw'+tw] = buckets[ak+'|tw'+tw] || {};
          buckets[ak+'|tw'+tw][vals] = (buckets[ak+'|tw'+tw][vals]||0) + 1;
          N++;
        }
  console.log('\nAPPENDIX: Q-P1b segmented by totalWeeks — ' + N + ' builds');
  let moved = 0, tot = 0;
  Object.keys(buckets).sort().forEach(k => {
    const b = buckets[k], cnt = Object.values(b).reduce((a,c)=>a+c,0), uniq = Object.keys(b).length;
    tot += cnt; if (uniq > 1) moved += cnt - Math.max(...Object.values(b));
    console.log(`  ${k.padEnd(22)} builds=${String(cnt).padStart(3)}  distinct pace-value sets=${uniq}`);
  });
  console.log(`  => builds whose PACE VALUES differ from their length-peers: ${moved} / ${tot}`);
  // and the tw spread itself, to show length IS wired
  const tws = {};
  for (const dist of ['1','1.5','3','5']) for (const mm of ['5','10','25']) {
    const cfg = paceGoal({ targetDist:dist, targetMins:mm, targetSecs:'0', targetTime:mm+':00' });
    tws[`${dist}mi in ${mm}:00`] = build('V201', cfg).totalWeeks;
  }
  console.log('  totalWeeks by goal (calcProgramLength DOES read it): ' + JSON.stringify(tws));
}
