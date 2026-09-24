// v221_d170_regional_hinge.js — MEASURE, before-picture for D170 ("capRegionalFatigue takes the day's last hinge;
// D85 floor via _isPostChain"). Base is V216 = git 3dc0146, never the working tree.
//   node tests/measure/v221_d170_regional_hinge.js            (sharded sweep + report; writes the CF artifact to SCR/cf/cf170.html)
//   node tests/measure/v221_d170_regional_hinge.js --cfb      (same sweep against cf170b: the skip gated on role==='legs', D170 as ruled;
//                                                              writes SCR/cf/cf170b.html and asserts every Push (light) day byte-identical to base)
// INSTRUMENT (log-only, proven output-identical by digest on every config):
//   __RCTX at the capRegionalFatigue call site (w, d, title, role); inside capRegionalFatigue an 'enter' event after the
//   hypertrophy/empty early returns, one event per splice (name, label, rank, region, _isPostChain(name), live posterior
//   count on the day BEFORE the splice, section emptied), an 'ok' event on the under-cap exit and a 'brk' event on the
//   no-candidate exit. Plus the v221_d165 per-pass snapshots (__T/__TW).
// LENS: _isPostChain verbatim from the artifact (the D85 lens, as asked). Cross-checked against the g198 hand regex.
// COUNTERFACTUAL cf170: capRegionalFatigue skips a candidate that is _isPostChain while the day holds <=1 _isPostChain item,
//   counted live over `out` at the top of every trim iteration — the same condition capSessionBudget uses at :10589.
// ORACLE: the removal events themselves (what was on the day before and after the splice); the pass is never asked
//   whether it should have removed it.
'use strict';
const fs = require('fs'), path = require('path'), os = require('os'), { fork } = require('child_process');
const T = require('./v221_d165_traces.js');
const { rep1, BASE_SRC, instr, loadI, traced, LAT, ik, clean, stem, bump, top, load, progDigest, DAYS, W } = T;
const SCR = '/private/tmp/claude-501/-Users-CanasBangin-Desktop-TheBig6V2/788d23bc-397a-4c4b-9d6f-91ef5b233dad/scratchpad';

// ── surgery ────────────────────────────────────────────────────────────────
const A_CANDS = "    // Every trimmable item in the region: rank>0, has a pattern, not the protected compound.\n    const cands=[];\n";
const A_PROT  = "        if(si*100+ii===protKey) return;          // the protected heaviest compound\n";
const POSTLEFT = "    const _postLeft=out.reduce((a,s)=>a+((s&&s.items)||[]).reduce((b,it)=>b+(_isPostChain(it&&it.name)?1:0),0),0);\n";
const CF170 = rep1(rep1(BASE_SRC, A_CANDS, POSTLEFT + A_CANDS), A_PROT, A_PROT + "        if(_postLeft<=1 && _isPostChain(it.name)) return;   // cf170: the day's LAST hinge/hip_ext is not regional fodder\n");
const CF170B = rep1(rep1(BASE_SRC, A_CANDS, POSTLEFT + A_CANDS), A_PROT, A_PROT + "        if(role==='legs' && _postLeft<=1 && _isPostChain(it.name)) return;   // cf170: the day's LAST hinge/hip_ext is not regional fodder (cf170b: legs role only)\n");
const CFB = process.argv.indexOf('--cfb') >= 0, CFSRC = CFB ? CF170B : CF170, CFN = CFB ? 'cf170b' : 'cf170';
// ── log-only instrument, applied to base and to cf170 ───────────────────────
function logI(src, isCF){
  src = rep1(src, "      weeks[w][d]={title,dot:cardio?cardio.type:'lift',tags,cardio,sections:capRegionalFatigue(",
    "      globalThis.__RCTX={w:String(w),d:String(d),t:title,r:role};\n      weeks[w][d]={title,dot:cardio?cardio.type:'lift',tags,cardio,sections:capRegionalFatigue(");
  src = rep1(src, "  // Deep-ish copy so we never mutate buildSections' output.\n",
    "  if(globalThis.__RL) globalThis.__RL.push({c:globalThis.__RCTX,e:'enter',pin:sections.reduce((a,s)=>a+((s&&s.items)||[]).reduce((b,it)=>b+(_isPostChain(it&&it.name)?1:0),0),0)});\n  // Deep-ish copy so we never mutate buildSections' output.\n");
  src = rep1(src, "    if(!over.length) break;\n    const region=over[0];\n", "    if(!over.length){ if(globalThis.__RL) globalThis.__RL.push({c:globalThis.__RCTX,e:'ok'}); break; }\n    const region=over[0];\n");
  src = rep1(src, (isCF ? POSTLEFT : '') + A_CANDS, (isCF ? POSTLEFT : '') + A_CANDS + "    let __skip=0;\n");
  if(isCF) src = CFB ? rep1(src, "        if(role==='legs' && _postLeft<=1 && _isPostChain(it.name)) return;   // cf170", "        if(role==='legs' && _postLeft<=1 && _isPostChain(it.name)){ __skip=1; return; }   // cf170")
                     : rep1(src, "        if(_postLeft<=1 && _isPostChain(it.name)) return;   // cf170", "        if(_postLeft<=1 && _isPostChain(it.name)){ __skip=1; return; }   // cf170");
  src = rep1(src, "    if(!cands.length) break; // nothing left", "    if(!cands.length){ if(globalThis.__RL) globalThis.__RL.push({c:globalThis.__RCTX,e:'brk',skip:__skip,reg:region}); break; } // nothing left");
  src = rep1(src, "    const cand=cands[0];\n    const sec=out[cand.si];\n",
    "    const cand=cands[0];\n    const sec=out[cand.si];\n    if(globalThis.__RL){ const __it=sec.items[cand.ii]; globalThis.__RL.push({c:globalThis.__RCTX,e:'cut',n:__it.name,l:sec.label,rk:cand.rk,reg:region,post:_isPostChain(__it.name)?1:0,left:out.reduce((a,s)=>a+((s&&s.items)||[]).reduce((b,it)=>b+(_isPostChain(it&&it.name)?1:0),0),0),emp:sec.items.length===1?1:0,skip:__skip}); }\n");
  return src;
}
const R198 = /deadlift|\brdl\b|romanian|good morning|\bswing\b|\bclean\b|\bsnatch\b|hinge|rack pull|hip thrust|glute bridge|glute-ham|\bghr\b|nordic|back extension|hyperextension|reverse hyper|pull-?through/i;   // g198 hand regex
const cl = o => JSON.parse(JSON.stringify(o));

// ── lattice ────────────────────────────────────────────────────────────────
function lattice(){
  const L = LAT.map(x => ({ eq:x.eq, inj:ik(x), f:x.f, cfg:x.cfg, mix: /run_(5k|10k|half|marathon)/.test(x.cfg.cardioGoals.run.id) ? 'NRC solo' : 'NSW solo' }));
  const TI = ['commercial','crossfit','home_full','home_basic','minimal','bodyweight'], FO = ['hypertrophy','strength','fatloss','balanced','support_strength','support_athletic','support_prevention'], EX = ['beginner','intermediate','advanced'];
  const RS = [['sun','wed'],['sat','sun']], SD = [76308, 4242];
  const MIX = [['pace+bike','run_pace_goal',{bike:1}],['pace+swim','run_pace_goal',{swim:1}],['pace+bike+swim','run_pace_goal',{bike:1,swim:1}],['base+bike','run_base',{bike:1}]];
  const base = (eq, f, e, r, s) => ({ name:'M', primaryPath: /^support_/.test(f) ? 'event' : 'goal', eventTargeted:false, liftingFocus:f, experience:e, ageBracket:'18-35', equipment:eq, unit:'lbs', restDays:r.slice(), days:DAYS.slice(), bench:135, squat:155, deadlift:185, seed:s });
  TI.forEach(eq => FO.forEach(f => EX.forEach(e => RS.forEach(r => SD.forEach(s => {
    MIX.forEach(([k, g, o]) => { const c = base(eq, f, e, r, s); c.cardioTypes = ['run']; c.cardioGoals = { run:{ id:g, label:g, mileBestMins:'8', mileBestSecs:'30', baselineDist:'3', baseline:'3mi', targetDist:'1.5', targetMins:'11', targetSecs:'0', paceUnit:'mi' } };
      if(o.bike){ c.cardioTypes.push('bike'); c.cardioGoals.bike = { id:'bike_base', label:'Bb', baselineDist:'10', baseline:'10mi' }; }
      if(o.swim){ c.cardioTypes.push('swim'); c.cardioGoals.swim = { id:'swim_base', label:'Sb', baselineDist:'1000', baseline:'1000m' }; }
      L.push({ eq, inj:'healthy', f, cfg:c, mix:'NSW multi ' + k }); });
    const c = base(eq, f, e, r, s); c.primaryPath = 'lift'; c.cardioTypes = []; c.cardioGoals = {}; L.push({ eq, inj:'healthy', f, cfg:c, mix:'lift only' });
  })))));
  return L;
}
const goalOf = x => x.mix === 'lift only' ? 'lift' : x.cfg.cardioGoals.run.id;

// ── worker ─────────────────────────────────────────────────────────────────
function worker(k, n){
  const IA = load(W('base_' + k + '.html', BASE_SRC)), CA = load(W(CFN + '_' + k + '.html', CFSRC));
  const IB = loadI('base_i_' + k + '.html', instr(logI(BASE_SRC, false))), IC = loadI(CFN + '_i_' + k + '.html', instr(logI(CFSRC, true)));
  const PC = IA.eval('_isPostChain');
  const post = names => names.reduce((a, nm) => a + (PC(nm) ? 1 : 0), 0);
  const dayNames = day => (day && !day.rest && day.sections || []).reduce((a, s) => a.concat((s.items || []).map(i => i && i.name)), []);
  const L = lattice(), R = { cfgs:0, idA:0, idC:0, lift:0, enter:0, trimDays:0, trimItems:0, lp:[], den:{}, moved:0, movedDays:0, outside:0, movedCls:{}, stageDiff:{}, firstStage:{}, reg:{agree:0, dis:[]}, cfSkipDays:0, ex:[], zeroKill:{}, titleTier:{}, otherDays:{}, movedTitle:{} };
  const rl = X => { const r = JSON.parse(X.eval('JSON.stringify(globalThis.__RL)')); X.eval('globalThis.__RL=null;'); return r; };
  for(let i = k; i < L.length; i += n){
    const x = L[i], cfg = x.cfg; R.cfgs++;
    const pa = IA.buildProgram(cl(cfg)), pc = CA.buildProgram(cl(cfg));
    IB.eval('globalThis.__RL=[];'); const A = traced(IB, cfg); const ea = rl(IB);
    IC.eval('globalThis.__RL=[];'); const C = traced(IC, cfg); const ec = rl(IC);
    if(progDigest(A.p) === progDigest(pa)) R.idA++; if(progDigest(C.p) === progDigest(pc)) R.idC++;
    const seg = { tier:x.eq, inj:x.inj, mix:x.mix, goal:goalOf(x), focus:x.f, exp:cfg.experience };
    const byDay = ev => { const m = {}; ev.forEach(e => { const kk = e.c.w + '|' + e.c.d; (m[kk] = m[kk] || []).push(e); }); return m; };
    const DA = byDay(ea), DC = byDay(ec);
    Object.keys(pa.weeks).forEach(w => DAYS.forEach(d => { const day = pa.weeks[w][d]; if(day && !day.rest && (day.sections || []).length) R.lift++; }));
    Object.keys(DA).forEach(kk => {
      const ev = DA[kk], [w, d] = kk.split('|'), title = ev[0].c.t;
      if(!ev.some(e => e.e === 'enter')) return; R.enter++;
      const cuts = ev.filter(e => e.e === 'cut'); if(!cuts.length) return;
      R.trimDays++; R.trimItems += cuts.length;
      const segD = Object.assign({ title }, seg);
      Object.keys(segD).forEach(s => bump(R.den, s + ' | ' + segD[s]));
      const lp = cuts.find(e => e.post && e.left <= 1); if(!lp) return;
      if(R198.test(clean(lp.n))) R.reg.agree++; else if(R.reg.dis.length < 20) R.reg.dis.push(clean(lp.n));
      const shipA = post(dayNames(pa.weeks[w][d])), shipC = post(dayNames(pc.weeks[w][d]));
      const afterCRF = (A.S[kk] || []).find(([t]) => t === 'capRegionalFatigue');
      const postAfter = afterCRF ? afterCRF[1].reduce((a, s) => a + post(s[1] || []), 0) : -1;
      const ecd = DC[kk] || [], sk = ecd.find(e => e.skip && (e.e === 'cut' || e.e === 'brk'));
      const outc = !sk ? '(no cf skip event)' : sk.e === 'brk' ? 'NOTHING: no candidate left, loop breaks with ' + sk.reg + ' over its regional cap' : 'next candidate: rank ' + sk.rk + ' ' + (sk.post ? 'POSTERIOR ' : '') + stem(sk.l);
      const cfCuts = ecd.filter(e => e.e === 'cut').length, cfExit = ecd.some(e => e.e === 'ok') ? 'under cap' : ecd.some(e => e.e === 'brk') ? 'OVER cap (no candidate)' : 'guard exhausted';
      const baseExit = ev.some(e => e.e === 'ok') ? 'under cap' : ev.some(e => e.e === 'brk') ? 'OVER cap (no candidate)' : 'guard exhausted';
      R.cfSkipDays += sk ? 1 : 0;
      if(shipC === 0){ const pp = secs => secs.reduce((a, s) => a + post(s[1] || []), 0) > 0; bump(R.zeroKill, 'cf170 posterior last removed by ' + T.killer(C.S[kk] || [], pp) + ' | ' + title + ' | ' + x.mix + ' | ' + x.eq); }
      bump(R.titleTier, title + ' | ' + x.eq + ' | ' + x.mix.replace(/ .*$/, ''));
      R.lp.push(Object.assign({ w:+w, d, sec:stem(lp.l), label:lp.l, rk:lp.rk, reg:lp.reg, name:clean(lp.n), pin:ev.find(e => e.e === 'enter').pin, emp:lp.emp, postAfter, shipA, shipC, outc, sk: sk && sk.e === 'cut' ? clean(sk.n) : null, cutsA:cuts.length, cutsC:cfCuts, baseExit, cfExit }, segD));
      if(R.ex.length < 4 && (R.ex.length < 2 || x.mix !== 'NRC solo')){
        const card = day => (day.sections || []).filter(s => (s.items || []).length).map(s => s.label + '[' + s.items.map(i => clean(i.name)).join(', ') + ']').join(' | ');
        R.ex.push({ cell: x.mix + ' ' + x.eq + ' ' + x.inj + ' ' + x.f + ' ' + cfg.experience + ' seed ' + cfg.seed + ' rest ' + cfg.restDays.join('/') + ' goal ' + goalOf(x) + ' | W' + w + ' ' + d + ' "' + title + '"',
          removed: clean(lp.n) + ' from ' + lp.l + ' (rank ' + lp.rk + ', region ' + lp.reg + ')', outc,
          into: (A.S[kk].find(([t]) => t === 'recoveryDeload') || [0, []])[1].filter(s => (s[1] || []).length).map(s => s[0] + '[' + s[1].map(clean).join(', ') + ']').join(' | '),
          base: card(pa.weeks[w][d]), cf: card(pc.weeks[w][d]) });
      }
    });
    // ── what moves under cf170
    const strip = p => JSON.stringify(p, (kk, v) => (kk === 'id' || kk === 'created' || kk === '_swapUniverse' || kk === '_swapUniverseByKey' || kk === 'weeks') ? undefined : v);
    if(strip(pa) !== strip(pc)) R.outside++;
    if(progDigest(pa) === progDigest(pc)) continue; R.moved++;
    Object.keys(pa.weeks).forEach(w => DAYS.forEach(d => {
      if(JSON.stringify(pa.weeks[w][d]) === JSON.stringify(pc.weeks[w][d])) return; R.movedDays++;
      const kk = w + '|' + d, ev = DA[kk] || [], isLP = ev.some(e => e.e === 'cut' && e.post && e.left <= 1);
      const tA = A.S[kk] || [], tC = C.S[kk] || [];
      let first = '(no stage differs: diff is outside sections)'; for(let j = 0; j < Math.max(tA.length, tC.length); j++){ if(JSON.stringify(tA[j]) !== JSON.stringify(tC[j])){ first = (tA[j] || tC[j])[0]; break; } }
      bump(R.firstStage, (isLP ? 'last-post day' : 'OTHER day') + ' | first differing stage ' + first);
      bump(R.movedCls, isLP ? 'base last-post day' : 'other day');
      bump(R.movedTitle, pa.weeks[w][d].title + (isLP ? ' (base last-post day)' : ' (other day)'));
      if(!isLP){ const nm = day => (day.sections || []).map(s => s.label + '[' + (s.items || []).map(i => clean(i.name)).join(', ') + ']').join(' | '); const a = nm(pa.weeks[w][d]), b = nm(pc.weeks[w][d]); const ia = a.split(' | '), ib = b.split(' | '); bump(R.otherDays, (pa.weeks[w][d].title) + ' :: ' + ia.filter(q => ib.indexOf(q) < 0).join(' ; ') + '  ->  ' + ib.filter(q => ia.indexOf(q) < 0).join(' ; ')); }
      const ms = secs => (secs || []).reduce((a, s) => a.concat((s[1] || []).map(nm => clean(nm))), []);
      let after = false;
      for(let j = 1; j < Math.min(tA.length, tC.length); j++){
        const st = tA[j][0]; if(st === 'capRegionalFatigue'){ after = true; continue; } if(!after) continue;
        const cntA = ms(tA[j - 1][1]).length - ms(tA[j][1]).length, cntC = ms(tC[j - 1][1]).length - ms(tC[j][1]).length;
        if(cntA !== cntC) bump(R.stageDiff, pa.weeks[w][d].title + ' | ' + st + ' | net items removed base ' + cntA + ' vs cf ' + cntC);
      }
    }));
  }
  return R;
}

if(process.argv[2] === '--shard'){ const r = worker(+process.argv[3], +process.argv[4]); process.send(r, () => process.exit(0)); }
else if(require.main === module){
  fs.mkdirSync(path.join(SCR, 'cf'), { recursive:true });
  const cfp = path.join(SCR, 'cf', CFN + '.html'); if(fs.existsSync(cfp)) fs.unlinkSync(cfp); fs.writeFileSync(cfp, CFSRC);
  const IA = load(W('base_main.html', BASE_SRC)), CA = load(W(CFN + '_main.html', CFSRC));
  console.log('MODE ' + CFN + ' | base ia-version ' + IA.version + ' | ' + CFN + ' written to ' + cfp + ' (' + CFSRC.length + ' bytes, base ' + BASE_SRC.length + ')');
  console.log('_isPostChain as shipped: ' + BASE_SRC.split('\n').find(l => /^function _isPostChain/.test(l)));
  console.log('D85 floor line as shipped: ' + BASE_SRC.split('\n').find(l => /V198 \(D85\): the day.s LAST hinge\/hip_ext is not budget fodder/.test(l)).trim());
  const HM = require(path.join(__dirname, '..', 'harness.js')).fixtures.HALF_MANNY;
  const d1 = progDigest(IA.buildProgram(cl(HM))), d2 = progDigest(IA.buildProgram(cl(HM)));
  console.log('base HALF_MANNY == itself: ' + (d1 === d2) + ' (' + d1 + ')');
  const dm = x => progDigest(x.buildProgram(cl(HM)));
  const offArm = X => { X.eval('globalThis.__DELOAD_OFF=true;'); const r = dm(X); X.eval('globalThis.__DELOAD_OFF=false;'); return r; };
  console.log('HALF_MANNY main arm       base ' + d1 + ' | cf170 ' + dm(CA) + ' | row 0ac7da6b1691a8e1');
  console.log('HALF_MANNY deload-off arm base ' + offArm(IA) + ' | cf170 ' + offArm(CA) + ' | row 1069cd7f86eed204 (plain artifact + __DELOAD_OFF; g199 prints the instrumented form)');
  const LENS = ['Kettlebell swing','Kettlebell single-leg deadlift','Dumbbell split-stance deadlift','Barbell Romanian deadlift','Barbell good mornings','Single-leg glute bridge','Nordic hamstring curl (anchored)'];
  const IR = IA.eval('_itemRegion'), SR = IA.eval('_sectionRegion'), PT = IA.eval('_pattern');
  LENS.forEach(n => console.log('  lens ' + n + ': _pattern=' + PT(n) + ' _itemRegion=' + IR(n) + ' | _sectionRegion(Light finisher, push)=' + SR('Light finisher','push') + ' _sectionRegion(Leg superset B, legs)=' + SR('Leg superset B','legs')));
  const L = lattice(), N = Math.min(8, os.cpus().length), parts = [];
  console.log('lattice ' + L.length + ' configs; shards ' + N);
  let done = 0;
  for(let k = 0; k < N; k++){ const ch = fork(__filename, ['--shard', String(k), String(N)].concat(CFB ? ['--cfb'] : [])); ch.on('message', m => { parts.push(m); if(++done === N) report(parts); }); ch.on('exit', c => { if(c) { console.log('SHARD ' + k + ' CRASHED exit ' + c); process.exitCode = 1; } }); }
}
function merge(parts){
  const R = { cfgs:0, idA:0, idC:0, lift:0, enter:0, trimDays:0, trimItems:0, lp:[], den:{}, moved:0, movedDays:0, outside:0, movedCls:{}, stageDiff:{}, firstStage:{}, reg:{agree:0, dis:[]}, cfSkipDays:0, ex:[], zeroKill:{}, titleTier:{}, otherDays:{}, movedTitle:{} };
  parts.forEach(p => { ['cfgs','idA','idC','lift','enter','trimDays','trimItems','moved','movedDays','outside','cfSkipDays'].forEach(k => R[k] += p[k]); R.lp = R.lp.concat(p.lp); R.ex = R.ex.concat(p.ex);
    ['den','movedCls','stageDiff','firstStage','zeroKill','titleTier','otherDays','movedTitle'].forEach(k => Object.entries(p[k]).forEach(([a, b]) => bump(R[k], a, b))); R.reg.agree += p.reg.agree; R.reg.dis = R.reg.dis.concat(p.reg.dis); });
  return R;
}
function report(parts){
  const R = merge(parts), LP = R.lp;
  console.log('\n== IDENTITY: instrumented == plain, base ' + R.idA + '/' + R.cfgs + ', cf170 ' + R.idC + '/' + R.cfgs);
  console.log('\n== Q1. DENOMINATORS: configs ' + R.cfgs + ' | lifting day builds ' + R.lift + ' | day builds reaching the trim loop (not hypertrophy, nonempty) ' + R.enter + ' | days the loop trims >=1 item ' + R.trimDays + ' (' + R.trimItems + ' items)');
  console.log('   days where capRegionalFatigue removes the day\'s LAST _isPostChain item: ' + LP.length + ' of ' + R.trimDays + ' trim days (' + (100 * LP.length / R.trimDays).toFixed(2) + '%), of ' + R.enter + ' loop days');
  console.log('   g198 hand regex agrees the removed item is hinge/hip_ext: ' + R.reg.agree + '/' + LP.length + (R.reg.dis.length ? ' | disagreements: ' + [...new Set(R.reg.dis)].join('; ') : ''));
  const cut = (key) => { const o = {}; LP.forEach(z => bump(o, z[key])); return Object.entries(o).sort((a, b) => b[1] - a[1]).map(([k, v]) => '    ' + v + ' / ' + (R.den[key + ' | ' + k] || 0) + ' trim days  ' + k).join('\n'); };
  ['mix','goal','tier','inj','focus','exp','title'].forEach(k => console.log('  by ' + k + ':\n' + cut(k)));
  const c2 = f => { const o = {}; LP.forEach(z => bump(o, f(z))); return top(o, 40); };
  console.log('  by section the item was cut from (label stem | rank):\n' + c2(z => z.sec + ' | rank ' + z.rk));
  console.log('  by removed item:\n' + c2(z => z.name));
  console.log('  by region being trimmed:\n' + c2(z => z.reg));
  console.log('  posterior items on the day entering the loop:\n' + c2(z => 'pin ' + z.pin));
  console.log('  section emptied by the cut (splice at :10749):\n' + c2(z => z.emp ? 'section emptied and removed' : 'section kept other items'));
  console.log('  by week:\n' + c2(z => 'W' + z.w));
  console.log('  posterior on the day after the loop / on the SHIPPED base card / on the SHIPPED cf170 card:\n' + c2(z => 'after-loop ' + z.postAfter + ' | shipped base ' + z.shipA + ' | shipped cf170 ' + z.shipC));
  console.log('\n== Q2. by title family (the D85 floor carries no day-type condition; every row below is inside its scope):\n' + c2(z => z.title + ' [' + z.mix.replace(/ .*$/, '') + ']'));
  console.log('\n== Q3. cf170 — on the ' + LP.length + ' base last-post days (cf skip event seen on ' + R.cfSkipDays + '):');
  console.log('  what is taken instead at that iteration:\n' + c2(z => z.outc));
  console.log('  alternate item taken (top):\n' + c2(z => z.sk || '(none)'));
  console.log('  loop exit, base -> cf170:\n' + c2(z => z.baseExit + ' -> ' + z.cfExit));
  console.log('  items the loop removes on the day, cf170 minus base:\n' + c2(z => 'delta ' + (z.cutsC - z.cutsA)));
  console.log('  moved programs ' + R.moved + '/' + R.cfgs + ' | moved days ' + R.movedDays + ' | programs moved OUTSIDE weeks (id/created/_swapUniverse stripped) ' + R.outside + '/' + R.cfgs);
  console.log('  moved days by class:\n' + top(R.movedCls) + '\n  first differing pass stage:\n' + top(R.firstStage));
  console.log('  downstream passes (after capRegionalFatigue) whose net item removal differs base vs cf170, on moved days:\n' + top(R.stageDiff));
  console.log('  the cf170 days still shipping ZERO posterior, by the pass that removed the last one:\n' + top(R.zeroKill));
  console.log('  base last-post days by title | tier | mix family:\n' + top(R.titleTier, 80));
  console.log('  OTHER moved days (no base last-post event), changed sections base -> cf170 (top 25):\n' + top(R.otherDays, 25));
  const X2 = f => { const o = {}; LP.forEach(z => bump(o, z.title + ' | ' + f(z))); return top(o, 60); };
  console.log('\n== BY TITLE (' + CFN + '):\n  shipped posterior base -> cf:\n' + X2(z => 'ship ' + z.shipA + ' -> ' + z.shipC));
  console.log('  what is cut instead:\n' + X2(z => z.outc));
  console.log('  alternate item:\n' + X2(z => z.sk || '(none)'));
  console.log('  loop exit base -> cf:\n' + X2(z => z.baseExit + ' -> ' + z.cfExit));
  console.log('  moved days by title:\n' + top(R.movedTitle, 60));
  const pushMoved = Object.entries(R.movedTitle).filter(([k]) => /^Push \(light\)/.test(k)).reduce((a, [, v]) => a + v, 0);
  const pushLP = LP.filter(z => z.title === 'Push (light)').length;
  console.log('  ASSERT Push (light) days moved == 0 (base last-post Push (light) days ' + pushLP + '): ' + (pushMoved === 0 ? 'PASS' : 'FAIL') + ' (' + pushMoved + ' moved)');
  R.ex.slice(0, 6).forEach(z => console.log('  EXAMPLE ' + z.cell + '\n     removed: ' + z.removed + '\n     cf170: ' + z.outc + '\n     into loop: ' + z.into + '\n     base ship: ' + z.base + '\n     cf   ship: ' + z.cf));
}
module.exports = { CF170, logI, lattice };
