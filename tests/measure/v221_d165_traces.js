// v221_d165_traces.js — MEASURE, pre-build traces for D165 as ruled (cf165b: redraw on collision at the lunge draw).
//   node tests/measure/v221_d165_traces.js            (D165 traces; prints the report)
//   require('./v221_d165_traces.js')                   (exports the tracer for v222_d166_traces.js)
// Base is V216 = git 3dc0146, never the working tree. The counterfactuals are rebuilt here by the same
// anchor-asserted one-line edits as tests/measure/v220_d165_d166_pool_twins.js (and checked byte-equal to the
// V220 scratch copies when those exist).
// INSTRUMENT: log-only __T/__TW snapshots of each day's [label,[names]] after every per-day and per-week pass
// (buildSections, applyInjuryFilter#1, recoveryDeload, capRegionalFatigue, injectDynamicCore, applyInjuryFilter#2,
// capSessionBudget) and after every post-loop pass (deconflictAdjacentDupes ... singletonSupersetSweep).
// A snapshot tagged X is the day AFTER X ran. Proven output-identical to the plain artifact on every config it reads.
// ORACLE: the snapshots themselves (what each pass handed the next); no pass is asked what it should have done.
'use strict';
const fs = require('fs'), path = require('path'), os = require('os'), { execSync } = require('child_process');
const REPO = path.join(__dirname, '..', '..');
const { load, progDigest, DAYS } = require(path.join(REPO, 'tests', 'harness.js'));
function rep1(src, a, b){ const n = src.split(a).length - 1; if(n !== 1) throw new Error('anchor count ' + n + ' for: ' + a.slice(0, 90)); return src.replace(a, () => b); }
const BASE_SRC = execSync('git -C ' + REPO + ' show 3dc0146:index.html', { maxBuffer: 1 << 27 }).toString();
const A165 = "    const lungeSel = _slot(lungePool,2,bs+7,'lower');";
const R165b = "    let lungeSel = _slot(lungePool,2,bs+7,'lower'); if(lungeSel[0]===squatSel) lungeSel=pick(lungePool.filter(n=>n!==squatSel),2,bs+7);";
const R165bLog = "    let lungeSel = _slot(lungePool,2,bs+7,'lower'); if(lungeSel[0]===squatSel){ const __p=lungePool.filter(n=>n!==squatSel); lungeSel=pick(__p,2,bs+7); if(globalThis.__LP) globalThis.__LP.push({pool:__p.slice(),sel:lungeSel.slice(),seed:bs+7,squat:squatSel}); }";
const A166r = "          {name:ex.cond[2],detail:vsets(3)+'×10'}]});";
const R166b = "          {name:(ex.cond[2]===ex.backMain?ex.cond[3]:ex.cond[2]),detail:vsets(3)+'×10'}]});";
const CF165B = rep1(BASE_SRC, A165, R165b), CF166B = rep1(BASE_SRC, A166r, R166b);
const PRE = "globalThis.__SN=null;globalThis.__LP=null;globalThis.__T=function(w,d,t,x){var S=globalThis.__SN;if(S){var k=w+'|'+d;(S[k]=S[k]||[]).push([t,JSON.stringify((x||[]).map(function(s){return [s.label,(s.items||[]).map(function(i){return i&&i.name;})];}))]);}return x;};"
  + "globalThis.__TW=function(W,t){Object.keys(W).forEach(function(w){Object.keys(W[w]||{}).forEach(function(d){var day=W[w][d];if(day&&Array.isArray(day.sections))globalThis.__T(w,d,t,day.sections);});});};";
function instr(src){
  src = rep1(src, "sections:capRegionalFatigue((_s=>isRecoveryWeek(w)?recoveryDeload(_s,cardio):_s)(applyInjuryFilter(buildSections(role,w,{fullVariant,wantCarry:d===carryHost,",
    "sections:__T(w,d,'capRegionalFatigue',capRegionalFatigue(__T(w,d,'recoveryDeload',(_s=>isRecoveryWeek(w)?recoveryDeload(_s,cardio):_s)(__T(w,d,'applyInjuryFilter#1',applyInjuryFilter(__T(w,d,'buildSections',buildSections(role,w,{fullVariant,wantCarry:d===carryHost,");
  src = rep1(src, "}),cfg)),role,cardio,goal)};", "})),cfg)))),role,cardio,goal))};");
  src = rep1(src, "injectDynamicCore(weeks[w], dayRoles, trainDays, w, cfg.equipment||'home_full');\n", "injectDynamicCore(weeks[w], dayRoles, trainDays, w, cfg.equipment||'home_full');\n    __TW({[w]:weeks[w]},'injectDynamicCore');\n");
  src = rep1(src, "_day.sections=applyInjuryFilter(_day.sections,cfg); });\n", "_day.sections=applyInjuryFilter(_day.sections,cfg); });\n    __TW({[w]:weeks[w]},'applyInjuryFilter#2');\n");
  src = rep1(src, "_day.sections=capSessionBudget(_day.sections,_day.cardio); });\n", "_day.sections=capSessionBudget(_day.sections,_day.cardio); });\n    __TW({[w]:weeks[w]},'capSessionBudget');\n");
  [["\n  if(cfg.equipment==='bodyweight') bodyweightSweep(", 'deconflictAdjacentDupes'], ['\n  hotNextHingeClampSweep(weeks);', 'bodyweightSweep|unloadable+grammar'],
   ['\n  preventionDoseSweep(weeks, cfg);', 'hotNextHingeClampSweep'], ['\n  d18LongRunDayPass(weeks);', 'preventionDoseSweep'], ['\n  raceEveLiftPass(weeks, totalWeeks);', 'd18LongRunDayPass'],
   ['\n  singletonSupersetSweep(weeks);', 'raceEveLiftPass'], ['\n  delete cfg._racePin;', 'singletonSupersetSweep']]
    .forEach(([a, t]) => { src = rep1(src, a, '\n  __TW(weeks,' + JSON.stringify(t) + ');' + a); });
  return src;
}
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'v221-'));
const W = (n, s) => { const p = path.join(TMP, n); fs.writeFileSync(p, s); return p; };
function loadI(name, src){ const X = load(W(name, src)); X.eval(PRE); return X; }
function traced(X, cfg){
  X.eval('globalThis.__SN={};globalThis.__LP=[];');
  const p = X.buildProgram(JSON.parse(JSON.stringify(cfg)));
  const sn = JSON.parse(X.eval('JSON.stringify(globalThis.__SN)')), lp = JSON.parse(X.eval('JSON.stringify(globalThis.__LP)'));
  X.eval('globalThis.__SN=null;globalThis.__LP=null;');
  const S = {}; Object.keys(sn).forEach(k => { S[k] = sn[k].map(([t, j]) => [t, JSON.parse(j)]); });
  return { p, S, lp };
}
// ── lattice: the WIDE lattice of v220 restricted to the three tiers where cf165b / cf166b move anything (v220: 0 moved elsewhere)
const GOALS = [['run_5k',{}],['run_half',{}],['run_pace_goal',{targetDist:'1.5',targetMins:'10',targetSecs:'0'}],['run_base',{}],['run_10k',{}],['run_marathon',{}]];
const FOC = ['hypertrophy','strength','fatloss','balanced','support_strength','support_athletic','support_prevention'];
const EXPS = ['beginner','intermediate','advanced'], AGES = ['18-35','36-54','55+'], RESTS = [['sun','wed'],['sat','sun']];
const SEEDS = [76308, 1234, 4242, 9001, 31337, 555, 8086, 20260];
const REG = ['shoulder','elbow','lowback','hip','knee','ankle'], ITIER = ['workaround','protect'];
function mk(eq, gi, f, exp, age, si, inj){
  const [g, x] = GOALS[gi % GOALS.length];
  const c = { name:'M', primaryPath: /^support_/.test(f) ? 'event' : 'goal', cardioTypes:['run'],
    cardioGoals:{ run: Object.assign({ id:g, label:g, mileBestMins:'8', mileBestSecs:'30', baselineDist:'3', baseline:'3mi' }, x) },
    eventTargeted:false, liftingFocus:f, experience:exp, ageBracket:age, equipment:eq, unit:'lbs',
    restDays: RESTS[si % 2].slice(), days: DAYS.slice(), bench:135, squat:155, deadlift:185, seed: SEEDS[si] };
  if(inj) c.injury = inj; return c;
}
const TIERS6 = ['commercial','crossfit','home_full','home_basic','minimal','bodyweight'];
const INJ = [null]; REG.forEach(r => ITIER.forEach(t => INJ.push({ region:r, tier:t })));
const LAT = [];
for(const eq of TIERS6) INJ.forEach((inj, ii) => FOC.forEach((f, fi) => EXPS.forEach((e, ei) => [0,1,2,3].forEach(si => [0,1].forEach(ri => {
  const c = mk(eq, ii + fi + ei + si, f, e, AGES[(fi + si) % 3], si, inj); c.restDays = RESTS[ri].slice(); LAT.push({ eq, inj, f, cfg: c });
})))));
const LAT3 = LAT.filter(x => /^(bodyweight|home_basic|minimal)$/.test(x.eq));
const ik = x => x.inj ? x.inj.region + '/' + x.inj.tier : 'healthy';
const clean = n => String(n == null ? '' : n).replace(/<svg[\s\S]*?<\/svg>\s*/g, '').replace(/<[^>]+>/g, '').trim();
const stem = l => String(l || '(core)').replace(/\s*[—-]\s.*$/, '');
const live = d => (d && !d.rest && d.sections || []).filter(s => (s.items || []).length);
const bump = (o, k, n = 1) => { o[k] = (o[k] || 0) + n; };
const top = (o, n = 60) => Object.entries(o || {}).sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, v]) => '    ' + v + '  ' + k).join('\n') || '    (none)';
const HINGE = /deadlift|\brdl\b|romanian|good morning|hinge|swing|pull-?through|back extension|hyperextension|reverse hyper|glute-ham|\bghr\b|hip thrust|glute bridge|nordic|hip extension/i;   // g211 hand regex
function classify(day){
  const L = live(day); const out = { c165: null, c166: null, main: null };
  const main = L.find(s => stem(s.label) === 'Main'); if(!main) return out;
  const mn = clean(main.items[0].name).toLowerCase(); out.main = clean(main.items[0].name);
  if(L.some(s => /^(Leg superset A|Leg circuit)$/.test(stem(s.label)) && s.items.some(i => clean(i.name).toLowerCase() === mn))) out.c165 = mn;
  if(L.some(s => stem(s.label) === 'Pull superset B' && s.items.some(i => clean(i.name).toLowerCase() === mn))) out.c166 = mn;
  return out;
}
const snapSig = secs => (secs || []).filter(s => (s[1] || []).length).map(s => s[0] + '[' + s[1].join(', ') + ']').join(' | ');
const trail = (S, k) => (S[k] || []);
// the stage after which predicate pred(secs) first turns false, given it was true at some earlier stage
function killer(tr, pred){ let was = false; for(const [t, secs] of tr){ const v = pred(secs); if(was && !v) return t; if(v) was = true; } return was ? '(survives)' : '(never present)'; }
// moved configs + days between a plain base and a plain cf
function movedDays(IA, CA, lat){
  const out = []; let progMoved = 0;
  lat.forEach(x => { const a = IA.buildProgram(JSON.parse(JSON.stringify(x.cfg))), b = CA.buildProgram(JSON.parse(JSON.stringify(x.cfg)));
    if(progDigest(a) === progDigest(b)) return; progMoved++;
    const days = []; Object.keys(a.weeks).forEach(w => DAYS.forEach(d => { if(JSON.stringify(a.weeks[w][d]) !== JSON.stringify(b.weeks[w][d])) days.push({ w, d }); }));
    out.push({ x, days, dA: progDigest(a), dB: progDigest(b) }); });
  return { out, progMoved };
}
module.exports = { rep1, BASE_SRC, CF165B, CF166B, R165bLog, A165, A166r, R166b, instr, loadI, traced, LAT, LAT3, ik, clean, stem, live, bump, top, HINGE, classify, snapSig, trail, killer, movedDays, load, progDigest, DAYS, W };

if(require.main === module){
  const scr = '/private/tmp/claude-501/-Users-CanasBangin-Desktop-TheBig6V2/788d23bc-397a-4c4b-9d6f-91ef5b233dad/scratchpad/cf/cf165b.html';
  if(fs.existsSync(scr)) console.log('cf165b rebuilt == V220 scratch cf165b: ' + (fs.readFileSync(scr, 'utf8') === CF165B));
  const IA = load(W('base.html', BASE_SRC)), CA = load(W('cf165b.html', CF165B));
  const IB = loadI('base_i.html', instr(BASE_SRC)), IC = loadI('cf165b_i.html', instr(rep1(BASE_SRC, A165, R165bLog)));
  console.log('base ia-version ' + IA.version + '; lattice ' + LAT3.length + ' configs (WIDE lattice, bodyweight|home_basic|minimal)');
  const M = movedDays(IA, CA, LAT3);
  console.log('cf165b moved programs ' + M.progMoved + '/' + LAT3.length + ', days ' + M.out.reduce((n, r) => n + r.days.length, 0));
  let idOK = 0; const R = { lostSec:[], lostItem:[], bw:{}, bwEx:[], t165Final:{}, t165Built:{}, t165Stage:{}, lp:{}, nonT:{} , hingeZero:0 };
  M.out.forEach(r => {
    const A = traced(IB, r.x.cfg), C = traced(IC, r.x.cfg);
    if(progDigest(A.p) === r.dA && progDigest(C.p) === r.dB) idOK++;
    C.lp.forEach(e => { const k = e.pool.join(' / ') + ' || seed ' + e.seed + ' -> ' + e.sel[0]; R.lp[k] = 1; });
    r.days.forEach(({ w, d }) => {
      const da = A.p.weeks[w][d], db = C.p.weeks[w][d], ca = classify(da), La = live(da), Lb = live(db), k = w + '|' + d;
      const cell = r.x.eq + ' ' + ik(r.x) + ' | ' + r.x.f + ' ' + r.x.cfg.experience + ' ' + r.x.cfg.ageBracket + ' seed ' + r.x.cfg.seed + ' rest ' + r.x.cfg.restDays.join('/') + ' | W' + w + ' ' + d + ' "' + da.title + '"';
      const tA = trail(A.S, k), tC = trail(C.S, k);
      const stA = La.map(s => stem(s.label)), stB = Lb.map(s => stem(s.label));
      const miss = stA.filter(s => stB.indexOf(s) < 0);
      const nA = La.reduce((m, s) => m + s.items.length, 0), nB = Lb.reduce((m, s) => m + s.items.length, 0);
      if(miss.length){
        const kills = miss.map(m => m + ' killed after ' + killer(tC, secs => secs.some(s => stem(s[0]) === m && (s[1] || []).length)));
        const hA = La.reduce((m, s) => m + s.items.filter(i => HINGE.test(clean(i.name))).length, 0), hB = Lb.reduce((m, s) => m + s.items.filter(i => HINGE.test(clean(i.name))).length, 0);
        if(hB === 0) R.hingeZero++;
        R.lostSec.push({ cell, kills, hinge: hA + '->' + hB, base: La.map(s => s.label + '[' + s.items.map(i => clean(i.name)).join(', ') + ']').join(' | '), cf: Lb.map(s => s.label + '[' + s.items.map(i => clean(i.name)).join(', ') + ']').join(' | '),
          cfTrail: tC.map(([t, secs]) => t + ': ' + snapSig(secs)) });
      } else if(nB < nA){
        const tot = tr => tr.map(([t, secs]) => [t, secs.reduce((m, s) => m + (s[1] || []).length, 0)]);
        const ta = tot(tA), tc = tot(tC); let at = '(none)'; const d0 = tc.length && ta.length ? tc[0][1] - ta[0][1] : 0;
        for(let i = 0; i < Math.min(ta.length, tc.length); i++) if(tc[i][1] - ta[i][1] < d0){ at = tc[i][0]; break; }
        R.lostItem.push({ cell, at, base: La.map(s => s.label + '[' + s.items.map(i => clean(i.name)).join(', ') + ']').join(' | '), cf: Lb.map(s => s.label + '[' + s.items.map(i => clean(i.name)).join(', ') + ']').join(' | '),
          baseTrail: tA.map(([t, secs]) => t + ': ' + snapSig(secs)), cfTrail: tC.map(([t, secs]) => t + ': ' + snapSig(secs)) });
      }
      if(ca.c165){
        const legC = Lb.find(s => /^(Leg superset A|Leg circuit)$/.test(stem(s.label))); bump(R.t165Final, legC ? clean(legC.items[0].name) : '(no Leg A/circuit)');
        const b0 = (tC.find(([t]) => t === 'buildSections') || [0, []])[1].find(s => /^(Leg superset A|Leg circuit)$/.test(stem(s[0])));
        bump(R.t165Built, b0 ? b0[1][0] : '(none at buildSections)');
        if(b0 && legC && b0[1][0] !== clean(legC.items[0].name)) bump(R.t165Stage, b0[1][0] + ' -> ' + clean(legC.items[0].name));
      } else {
        const tag = r.x.eq + (miss.length ? ' LOST-SECTION' : nB < nA ? ' LOST-ITEM' : nB > nA ? ' GAINED-ITEM' : ' SAME-COUNT');
        bump(R.nonT, tag);
        if(r.x.eq === 'bodyweight'){
          const main = classify(da).main;
          // base: the stage where the Leg superset A item equal to the Main disappears (the hidden twin)
          const twinPred = secs => secs.some(s => /^(Leg superset A|Leg circuit|Leg)$/.test(stem(s[0])) && (s[1] || []).some(n => n === main));
          const kb = killer(tA, twinPred);
          const legB = Lb.find(s => /^(Leg superset A|Leg circuit)$/.test(stem(s.label)));
          const legA = La.find(s => /^(Leg superset A|Leg circuit|Leg)$/.test(stem(s.label)));
          const key = 'Main=' + main + ' | base leg sec ' + (legA ? legA.label + '[' + legA.items.map(i => clean(i.name)).join(', ') + ']' : '(none)') + ' | base twin removed after ' + kb + ' | cf ' + (legB ? legB.label + '[' + legB.items.map(i => clean(i.name)).join(', ') + ']' : '(none)');
          bump(R.bw, key); if(R.bwEx.length < 2) R.bwEx.push({ cell, baseTrail: tA.map(([t, secs]) => t + ': ' + snapSig(secs)) });
        }
      }
    });
  });
  console.log('instrumented == plain (base AND cf165b digests), moved configs: ' + idOK + '/' + M.out.length);
  console.log('\n== Q1. cf165b days that LOST a section: ' + R.lostSec.length + ' (cf final carries zero hinge-regex items on ' + R.hingeZero + ')');
  const kc = {}; R.lostSec.forEach(z => z.kills.forEach(k => bump(kc, k))); console.log('  killer split:\n' + top(kc));
  const cc = {}; R.lostSec.forEach(z => bump(cc, z.cell.split(' | ').slice(0, 2).join(' | ').replace(/ seed.*$/, ''))); console.log('  by cell:\n' + top(cc));
  R.lostSec.forEach((z, i) => { console.log('  #' + (i + 1) + ' ' + z.cell + ' | hinge ' + z.hinge + ' | ' + z.kills.join('; ') + '\n     base: ' + z.base + '\n     cf:   ' + z.cf); if(i < 2) console.log('     cf trail:\n       ' + z.cfTrail.join('\n       ')); });
  console.log('\n== Q1b. cf165b days that LOST an item (no section lost): ' + R.lostItem.length);
  R.lostItem.forEach((z, i) => console.log('  #' + (i + 1) + ' ' + z.cell + ' | first stage where cf-base item gap opens: ' + z.at + '\n     base: ' + z.base + '\n     cf:   ' + z.cf + '\n     base trail:\n       ' + z.baseTrail.join('\n       ') + '\n     cf trail:\n       ' + z.cfTrail.join('\n       ')));
  console.log('\n== Q2. non-target moved days by tier + count change:\n' + top(R.nonT));
  console.log('  bodyweight non-target moved days, by Main / base leg section / stage that removed the base twin / cf leg section:\n' + top(R.bw, 40));
  R.bwEx.forEach(z => console.log('  example ' + z.cell + '\n       ' + z.baseTrail.join('\n       ')));
  console.log('\n== Q3. the D165 target days: first Leg A/circuit item in cf at buildSections:\n' + top(R.t165Built) + '\n  ... and on the final card:\n' + top(R.t165Final) + '\n  changed between buildSections and final:\n' + top(R.t165Stage));
  const pools = {}, bySel = {}; Object.keys(R.lp).forEach(k => { const [pool, rest] = k.split(' || '); bump(pools, pool); bump(bySel, pool + ' => ' + rest.replace(/^seed \d+ -> /, '')); });
  console.log('  redraw events (distinct pool+seed): ' + Object.keys(R.lp).length + '\n  pools:\n' + top(pools) + '\n  pick result by pool:\n' + top(bySel));
  const PK = CA.eval('pick'); Object.keys(pools).forEach(pl => { const pool = pl.split(' / '), dist = {}; for(let s = 0; s < 1000; s++) bump(dist, PK(pool, 2, s)[0]);
    console.log('  seed sweep 0..999 over pool [' + pl + ']: ' + JSON.stringify(dist)); });
  const seedsSeen = {}; Object.keys(R.lp).forEach(k => bump(seedsSeen, k.replace(/^.*\|\| seed (\d+) ->.*$/, '$1'))); console.log('  distinct seeds among redraw events: ' + Object.keys(seedsSeen).length);
}
