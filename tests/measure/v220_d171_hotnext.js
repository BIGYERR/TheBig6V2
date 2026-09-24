// V220 measure (Mode B) — D171 trace: hotNext (build, :10826 on V217) and hotNextHingeClampSweep (:6796) read "tomorrow"
// through the Sunday-first ALL_DAYS_ORDER, so Saturday's tomorrow is W+1 Sunday and Sunday's is W Monday. CFhn = both read
// _ISO_ORDER (calendar). Base: V217 7af6ad9 (pass the file). Read-only; kept per CLAUDE.md.
// Run:   SCR=<dir> SHARD=i NSH=n node tests/measure/v220_d171_hotnext.js <V217.html>   -> SCR/d171_shard_i.json
//        SCR=<dir> MODE=merge NSH=n node tests/measure/v220_d171_hotnext.js              -> summed report
// Instrument (both arms, identical, anchors count==1): the day under construction (__CUR, set where hotNext is computed,
// cleared before deconflictAdjacentDupes); every scheme() evaluation of a hinge name {day, name, p, taper, deload, hot};
// every sweep day {hot, hinge items with detail}; every sweep rewrite {was, now}. CLAMP ORACLE: the two rules' own text
// (main: hot && !taper && !deload && p>0.61 -> p 0.61; sweep: '@ RPE 8' -> '@ RPE 7', 'RPE 8 (stop 2 reps short of
// failure)' -> 'RPE 7 (leave 3 or more in reserve)'); CALENDAR ORACLE: Monday-start date arithmetic, as in v218_d167.
// Lattice: the 15,180 configs of v218_d167_adj_pairs.js, block copied verbatim.
const fs = require('fs'), path = require('path');
const { load, fixtures, progDigest } = require('../harness');
const SCR = process.env.SCR || require('os').tmpdir(), MODE = process.env.MODE || 'run', NSH = +(process.env.NSH || 1);
const cl = o => JSON.parse(JSON.stringify(o));
if(MODE === 'merge'){
  const T = {}, EX = {}, CHK = [];
  for(let s = 0; s < NSH; s++){ const f = path.join(SCR, 'd171_shard_' + s + '.json'); if(!fs.existsSync(f)){ console.log('MISSING SHARD ' + s + ' -> measurement FAILED'); process.exit(2); }
    const j = JSON.parse(fs.readFileSync(f, 'utf8')); Object.keys(j.T).forEach(k => T[k] = (T[k] || 0) + j.T[k]); Object.keys(j.EX).forEach(k => { if(!EX[k]) EX[k] = j.EX[k]; }); CHK.push(...j.CHK); }
  CHK.forEach(l => console.log('CHK ' + l)); Object.keys(T).sort().forEach(k => console.log('  ' + k + ': ' + T[k])); Object.keys(EX).sort().forEach(k => console.log('\nEX ' + k + '\n' + EX[k]));
  process.exit(0);
}
const B7 = path.resolve(process.argv[2]); const SHARD = +(process.env.SHARD || 0);
const h7 = fs.readFileSync(B7, 'utf8'); const cnt = (s, a) => s.split(a).length - 1;
const HN1_OLD = "      const _di=ALL_DAYS_ORDER.indexOf(d);\n      const _nw=_di===ALL_DAYS_ORDER.length-1?w+1:w, _ndk=ALL_DAYS_ORDER[(_di+1)%7];";
const HN1_NEW = "      const _di=_ISO_ORDER.indexOf(d);\n      const _nw=_di===_ISO_ORDER.length-1?w+1:w, _ndk=_ISO_ORDER[(_di+1)%7];";
const HN2_OLD = "      const _di=ALL_DAYS_ORDER.indexOf(d);\n      const _nw=_di===_last?(+w+1):+w, _ndk=ALL_DAYS_ORDER[(_di+1)%7];";
const HN2_NEW = "      const _di=_ISO_ORDER.indexOf(d);\n      const _nw=_di===_last?(+w+1):+w, _ndk=_ISO_ORDER[(_di+1)%7];";
const A_CUR = "      const hotNext=!!(_nc&&_nc.legLoad);";
const A_SCH = "    if(_hotNextDay && exName && !wv._taper && !wv._deload && typeof wv.p==='number' && wv.p>0.61 && _pattern(exName)==='hinge') wv={...wv, p:0.61};";
const A_DED = "  deconflictAdjacentDupes(weeks, cfg, seed, totalWeeks);";
const A_NX = "      const nx=weeks[_nw]&&weeks[_nw][_ndk];";
const A_SF = "        if(nd!==det) sec.items[ii]={...it, detail:nd};";
const CLAUSE = "  if(_auxFamily(name)==='core') return 0;\n";
[HN1_OLD, HN2_OLD, A_CUR, A_SCH, A_DED, A_NX, A_SF, CLAUSE].forEach(a => { if(cnt(h7, a) !== 1){ console.log('ANCHOR FAIL ' + cnt(h7, a) + ' ' + JSON.stringify(a)); process.exit(2); } });
const hn = h => h.replace(HN1_OLD, () => HN1_NEW).replace(HN2_OLD, () => HN2_NEW);
const inst = h => h.replace(A_CUR, () => A_CUR + " globalThis.__CUR=w+'|'+d;")
  .replace(A_SCH, () => "    if(exName && _pattern(exName)==='hinge') (globalThis.__SC||(globalThis.__SC=[])).push({cur:globalThis.__CUR,ex:exName,p:wv.p,t:!!wv._taper,dl:!!wv._deload,hot:!!_hotNextDay});\n" + A_SCH)
  .replace(A_DED, () => "  globalThis.__CUR=null;\n" + A_DED)
  .replace(A_NX, () => A_NX + " (globalThis.__SW||(globalThis.__SW=[])).push({w:+w,d:d,hot:!!(nx&&nx.cardio&&nx.cardio.legLoad),hinge:day.sections.reduce((a,s)=>a.concat((s.items||[]).filter(i=>i&&i.name&&_pattern(i.name)==='hinge').map(i=>i.name+' :: '+(i.detail||''))),[])});")
  .replace(A_SF, () => A_SF + " if(nd!==det)(globalThis.__SF||(globalThis.__SF=[])).push({w:+w,d:d,name:it.name,det:det,nd:nd});");
const wr = (n, s) => { const f = path.join(SCR, 'd171_s' + SHARD + '_' + n); try { fs.unlinkSync(f); } catch(e){} fs.writeFileSync(f, s); return f; };
if(hn(h7) === h7){ console.log('SURGERY NO-OP hn'); process.exit(2); }
const X = { base: load(wr('base_i.html', inst(h7))), hn: load(wr('hn_i.html', inst(hn(h7)))) };
const CHK = [], T = {}, EX = {}; const bump = (k, n = 1) => { if(n) T[k] = (T[k] || 0) + n; };
const PAT = X.base.eval('_pattern');
const hm = (Xc, off) => { Xc.window.__DELOAD_OFF = !!off; try { return progDigest(Xc.buildProgram(cl(fixtures.HALF_MANNY))); } finally { Xc.window.__DELOAD_OFF = false; } };
const RAW = {};
if(SHARD === 0){ [['base', h7], ['hn', hn(h7)]].forEach(([k, h]) => { const R = load(wr(k + '.html', h)), CO = load(wr(k + '_coreoff.html', h.replace(CLAUSE, () => ''))); RAW[k] = R;
  const a = hm(R), b = hm(R, true), c = hm(CO), i = hm(X[k]);
  CHK.push('HALF_MANNY ' + k + ' raw ' + a + ' / deload-off ' + b + ' / core-off ' + c + ' vs pins 0ac7da6b1691a8e1 / 1069cd7f86eed204 / 9d14801a63111081: ' + (a === '0ac7da6b1691a8e1' && b === '1069cd7f86eed204' && c === '9d14801a63111081' ? 'UNMOVED' : 'MOVED') + '; instrumented ' + i + (i === a ? ' (inert)' : ' (NOT INERT)')); }); }
// ── lattices (NRC solo / NRC multi / NSW solo / injury from v217_d160_multisport_knockons 'mine'; NSW multi from 'multi';
//    gk pace+bike from 'gk' (coach's 607/609 cross-check); rest sweep added here: patterns that TRAIN sat and/or sun) ──
const WD = ['sun','mon','tue','wed','thu','fri','sat'], OFF = {mon:0,tue:1,wed:2,thu:3,fri:4,sat:5,sun:6}, ISO = ['mon','tue','wed','thu','fri','sat','sun'];
const L = [];
const STAND = {name:'M',primaryPath:'goal',eventTargeted:false,cardioTypes:['run'],cardioGoals:{run:{id:'run_pace_goal',label:'x',mileBestMins:'8',mileBestSecs:'15',mileBestSrc:{kind:'entered'},targetDist:'1.5',targetMins:'11',targetSecs:'0',paceUnit:'mi'}},
  liftingFocus:'balanced',experience:'intermediate',ageBracket:'18-35',equipment:'home_full',unit:'lbs',restDays:['sun','wed'],days:WD.slice(),bench:185,squat:255,deadlift:315,startDate:'2026-09-21',seed:24865};
const FOC6 = ['balanced','hypertrophy','strength','support_athletic','support_prevention','support_strength'];
const EQ = ['crossfit','commercial','home_full','home_basic','bodyweight'], EXP = ['beginner','intermediate','advanced'], AGE = ['18-35','36-54','55+'];
const RESTS = [['sun','wed'],['sat','sun'],['sun'],['mon','wed','fri'],['tue','thu','sun']];
{ const PLANS = ['run_5k','run_10k','run_half','run_marathon'], RACED = ['2026-12-06','2027-01-17','2027-03-28'], MILE = [['7','30'],['8','15'],['10','30'],['12','0']];
  const EXTRAS = [{bike:'bike_base'},{swim:'swim_base'},{bike:'bike_ftp'},{swim:'swim_mile'},{bike:'bike_base',swim:'swim_base'}];
  const nrc = (plan, o, i) => { const goals = {run:{id:plan,label:plan,mileBestMins:MILE[i%4][0],mileBestSecs:MILE[i%4][1],baselineDist:String([3,5,8][i%3]),baseline:[3,5,8][i%3]+'mi'}}, types = ['run'];
    if(o.ex && o.ex.bike){ types.push('bike'); goals.bike = {id:o.ex.bike,label:o.ex.bike,baselineDist:'10',baseline:'10mi'}; }
    if(o.ex && o.ex.swim){ types.push('swim'); goals.swim = {id:o.ex.swim,label:o.ex.swim,baselineDist:'1000',baseline:'1000m'}; }
    return Object.assign(cl(fixtures.HALF_MANNY), {name:'M',primaryPath:o.dated?'event':'fitness',cardioTypes:types,cardioGoals:goals,eventTargeted:!!o.dated,raceDate:o.dated?RACED[i%3]:'',startDate:'2026-09-21',liftingFocus:o.f,experience:o.e,ageBracket:AGE[i%3],equipment:o.q,restDays:o.r.slice(),seed:76308}); };
  let ii = 0;
  for(const plan of PLANS) for(const e of EXP) for(const r of RESTS) for(const q of EQ) for(const f of FOC6) for(const dated of [true,false]) L.push({mix:'NRC solo', c:nrc(plan, {e,r,q,f,dated}, ii++)});
  for(const plan of PLANS) for(const ex of EXTRAS) for(const f of FOC6) for(const q of EQ) L.push({mix:'NRC multi', c:nrc(plan, {ex,e:EXP[ii%3],r:RESTS[ii%2],q,f,dated:ii%2===0}, ii++)});
  for(const g of ['run_pace_goal','run_mile_time','run_15_under10','run_base']) for(const mm of [['8','15'],['12','0']]) for(const f of FOC6) for(const q of EQ) for(const r of RESTS) for(const e of EXP){
    const c = cl(STAND); c.cardioGoals.run.id = g; c.cardioGoals.run.mileBestMins = mm[0]; c.cardioGoals.run.mileBestSecs = mm[1]; c.liftingFocus = f; c.equipment = q; c.restDays = r.slice(); c.experience = e; L.push({mix:'NSW solo', c}); }
  const GOALS = [['run_5k',{}],['run_half',{}],['run_pace_goal',{targetDist:'1.5',targetMins:'10',targetSecs:'0'}],['run_base',{}],['run_10k',{}],['run_marathon',{}]], SEEDS = [76308, 1234, 4242, 9001, 31337, 555, 8086, 20260];
  for(const q of EQ) for(let si = 0; si < 8; si++) for(const rg of ['shoulder','elbow','lowback','hip','knee','ankle']) for(const t of ['workaround','protect']){ const [g, x] = GOALS[si % 6];
    L.push({mix:'injury', c:{ name:'M', primaryPath:'goal', cardioTypes:['run'], cardioGoals:{ run: Object.assign({ id:g, label:g, mileBestMins:'8', mileBestSecs:'30', baselineDist:'3', baseline:'3mi' }, x) }, eventTargeted:false, liftingFocus:'hypertrophy', experience:EXP[si % 3], ageBracket:AGE[si % 3], equipment:q, unit:'lbs', restDays:[['sun','wed'],['sat','sun']][si % 2].slice(), days:WD.slice(), bench:135, squat:155, deadlift:185, seed:SEEDS[si], injury:{region:rg,tier:t} }}); }
  const MIX = [['pace+bike','run_pace_goal',{bike:1}],['pace+swim','run_pace_goal',{swim:1}],['pace+bike+swim','run_pace_goal',{bike:1,swim:1}],['base+bike','run_base',{bike:1}]];
  for(const [mk, g, o] of MIX) for(const mm of [['8','15'],['12','0']]) for(const f of FOC6.concat(['fatloss'])) for(const q of EQ) for(const r of RESTS) for(const e of EXP){
    const c = cl(STAND); c.cardioGoals.run.id = g; c.cardioGoals.run.mileBestMins = mm[0]; c.cardioGoals.run.mileBestSecs = mm[1]; c.liftingFocus = f; c.equipment = q; c.restDays = r.slice(); c.experience = e;
    if(o.bike){ c.cardioTypes.push('bike'); c.cardioGoals.bike = {id:'bike_base',label:'Bb',baselineDist:'10',baseline:'10mi'}; }
    if(o.swim){ c.cardioTypes.push('swim'); c.cardioGoals.swim = {id:'swim_base',label:'Sb',baselineDist:'1000',baseline:'1000m'}; }
    L.push({mix:'NSW multi ' + mk, c}); }
  const ALL = ['sun','mon','tue','wed','thu','fri','sat'], mb = {mileBestMins:'8', mileBestSecs:'15', mileBestSrc:{kind:'entered'}}; const INJ = [null, null, {region:'knee',tier:'workaround'}, {region:'elbow',tier:'workaround'}]; let j = 0;
  for(const eq of ['commercial','crossfit','home_full','home_basic','bodyweight']) for(const fo of ['strength','hypertrophy','balanced','support_prevention','support_athletic','fatloss']) for(const ex of EXP) for(const rs of [['sun','wed'], ['sat','sun'], ['mon','thu','sun'], ['sun']]) for(const seed of [24865, 76308, 99991]){ const inj = INJ[(j++) % 4];
    const c = {name:'GK', primaryPath:'event', eventTargeted:false, raceDate:'', cardioTypes:['run','bike'], cardioGoals:{run:{id:'run_pace_goal', label:'P', ...mb, targetDist:'1.5', targetMins:'11', targetSecs:'0', paceUnit:'mi'}, bike:{id:'bike_base', label:'Bb'}}, liftingFocus:fo, experience:ex, ageBracket:'18-35', equipment:eq, unit:'lbs', restDays:rs, days:ALL.slice(), bench:185, squat:255, deadlift:315, startDate:'2026-10-05', seed};
    if(inj) c.injury = inj; L.push({mix:'gk pace+bike', c}); }
  const RS2 = [[], ['mon'], ['wed'], ['fri'], ['sat'], ['mon','fri'], ['wed','sat'], ['tue','fri'], ['mon','thu']];
  for(const [g, nrcp] of [['run_half', true], ['run_pace_goal', false]]) for(const r of RS2) for(const f of FOC6) for(const q of EQ) for(const e of EXP){
    const c = nrcp ? Object.assign(cl(fixtures.HALF_MANNY), {name:'M', primaryPath:'fitness', eventTargeted:false, raceDate:'', startDate:'2026-09-21', cardioTypes:['run'], cardioGoals:{run:{id:g,label:g,mileBestMins:'8',mileBestSecs:'15',baselineDist:'5',baseline:'5mi'}}, liftingFocus:f, experience:e, equipment:q, restDays:r.slice(), seed:76308}) : Object.assign(cl(STAND), {liftingFocus:f, experience:e, equipment:q, restDays:r.slice()});
    L.push({mix:'rest sweep ' + (nrcp ? 'NRC half' : 'NSW pace'), c}); }
}
// ── helpers ──
const dix = (w, d) => (w - 1) * 7 + OFF[d];
const live = y => !!(y && !y.rest && Array.isArray(y.sections));
const flat = y => live(y) ? [].concat(...y.sections.map((s, si) => (s.items || []).map((i, ii) => ({si, ii, lab:s.label || '', name:i.name, detail:i.detail || ''})))) : [];
const card = y => !y ? ['      (none)'] : y.rest ? ['      REST'] : [(y.cardio ? '      <cardio> ' + (y.cardio.subtype || y.cardio.type || '') + (y.cardio.legLoad ? ' [legLoad]' : '') : '      <no cardio>')].concat((y.sections || []).map(s => '      [' + (s.label || '') + '] ' + (s.items || []).map(i => i.name + ' ' + (i.detail || '')).join(' | ')));
const gram = s => String(s || '').replace(/\d+(\.\d+)?/g, '#');
const tagOf = x => JSON.stringify({g:Object.keys(x.c.cardioGoals || {}).map(k => x.c.cardioGoals[k].id), f:x.c.liftingFocus, e:x.c.experience, q:x.c.equipment, r:x.c.restDays, inj:x.c.injury || null, race:x.c.raceDate || ''});
const ex = (k, lines) => { if(!EX[k]) EX[k] = lines.join('\n'); };
function build(k, c){ const Xk = X[k]; Xk.window.__SC = []; Xk.window.__SW = []; Xk.window.__SF = []; Xk.window.__CUR = null; const p = cl(Xk.buildProgram(cl(c)));
  return { p, sc: Xk.window.__SC.slice(), sw: Xk.window.__SW.slice(), sf: Xk.window.__SF.slice() }; }
const fires = r => r.hot && !r.t && !r.dl && typeof r.p === 'number' && r.p > 0.61;
let crash = 0, n = 0, inChk = 0, inBad = 0, dateChk = 0, dateBad = 0; const t0 = Date.now();
L.forEach((x, idx) => { if(idx % NSH !== SHARD) return; n++;
  let a, b; try { a = build('base', x.c); b = build('hn', x.c); } catch(e){ crash++; if(crash < 4) CHK.push('CRASH ' + x.mix + ' ' + e.message); return; }
  const M = x.mix, rg = (x.c.cardioGoals.run || {}).id || '-'; bump('configs | ' + M); bump('configs | ALL');
  if(SHARD === 0 && n <= 40){ inChk += 2; if(progDigest(RAW.base.buildProgram(cl(x.c))) !== progDigest(a.p)) inBad++; if(progDigest(RAW.hn.buildProgram(cl(x.c))) !== progDigest(b.p)) inBad++; }
  if(idx % 53 === 0 && x.c.startDate){ const gd = X.base.eval('_progDayDate'), pp = {startDate:x.c.startDate}, m0 = gd(pp, 1, 'mon'); for(const w of Object.keys(a.p.weeks)) for(const d of ISO){ dateChk++; const dt = gd(pp, +w, d); if(!dt || Math.round((dt - m0) / 864e5) !== dix(+w, d)) dateBad++; } }
  // index logs by day
  const byDay = (arr, kf) => { const m = {}; arr.forEach(r => { const k = kf(r); if(k == null) return; (m[k] = m[k] || []).push(r); }); return m; };
  const scA = byDay(a.sc, r => r.cur), scB = byDay(b.sc, r => r.cur), swA = byDay(a.sw, r => r.w + '|' + r.d), swB = byDay(b.sw, r => r.w + '|' + r.d), sfA = byDay(a.sf, r => r.w + '|' + r.d), sfB = byDay(b.sf, r => r.w + '|' + r.d);
  bump('scheme hinge evaluations outside a day build (cur null) | base', a.sc.filter(r => !r.cur).length); bump('scheme hinge evaluations outside a day build (cur null) | hn', b.sc.filter(r => !r.cur).length);
  // oracle: shipped-view disagreement, the v218 definition (hinge-carrying day, shipped cardio legLoad of engine-tomorrow vs calendar-tomorrow)
  const C = {}; for(const w of Object.keys(a.p.weeks)) for(const d of ISO) C[dix(+w, d)] = {w:+w, d, y:a.p.weeks[w][d]};
  const days = new Set(); for(const w of Object.keys(a.p.weeks)) for(const d of ISO) days.add(w + '|' + d);
  days.forEach(k => { const [ws, d] = k.split('|'), w = +ws; const ya = a.p.weeks[w][d], yb = b.p.weeks[w] && b.p.weeks[w][d];
    const mainA = (scA[k] || []), mainB = (scB[k] || []), hotMA = mainA.some(r => r.hot), hotMB = mainB.some(r => r.hot);
    const swa = (swA[k] || [])[0], swb = (swB[k] || [])[0], hotSA = !!(swa && swa.hot), hotSB = !!(swb && swb.hot);
    const hingeShipped = flat(ya).filter(i => PAT(i.name) === 'hinge');
    // v218 shipped-view disagreement
    let shipDis = false; if(live(ya) && hingeShipped.length){ const di = WD.indexOf(d), nw = di === 6 ? w + 1 : w, nd = WD[(di + 1) % 7]; const ye = a.p.weeks[nw] && a.p.weeks[nw][nd], yc = C[dix(w, d) + 1] && C[dix(w, d) + 1].y;
      shipDis = !!(ye && ye.cardio && ye.cardio.legLoad) !== !!(yc && yc.cardio && yc.cardio.legLoad); }
    const engDis = (mainA.length && hotMA !== hotMB) || (swa && swb && hotSA !== hotSB);
    const changed = JSON.stringify(ya) !== JSON.stringify(yb);
    if(!shipDis && !engDis && !changed) return;
    const dk = (d === 'sat' || d === 'sun') ? d : 'mon..fri';
    // main clamp firing per hinge name
    const fA = new Set(mainA.filter(fires).map(r => r.ex)), fB = new Set(mainB.filter(fires).map(r => r.ex));
    const mainOn = [...fB].filter(e => !fA.has(e)), mainOff = [...fA].filter(e => !fB.has(e));
    const sfa = (sfA[k] || []).map(r => r.name + '|' + r.det), sfb = (sfB[k] || []).map(r => r.name + '|' + r.det);
    const swOn = sfb.filter(z => !sfa.includes(z)), swOff = sfa.filter(z => !sfb.includes(z));
    const fired = [mainOn.length ? 'main starts' : '', mainOff.length ? 'main stops' : '', swOn.length ? 'sweep starts' : '', swOff.length ? 'sweep stops' : ''].filter(Boolean).join('+') || 'no clamp change';
    bump('DAY | ' + (shipDis ? 'shipped-view disagreement' : 'shipped-view agree') + ' | ' + (engDis ? 'engine-view disagreement' : 'engine-view agree') + ' | ' + (changed ? 'CHANGED' : 'unchanged') + ' | ' + dk);
    if(!changed && !engDis && !shipDis) return;
    const dir = (hotMB || hotSB) && !(hotMA || hotSA) ? 'calendar hot, engine cold' : (hotMA || hotSA) && !(hotMB || hotSB) ? 'engine hot, calendar cold' : 'mixed/equal';
    if(changed){
      bump('CHANGED | ALL | by clamp | ' + fired); bump('CHANGED | ALL | by direction | ' + dir); bump('CHANGED | ALL | by weekday | ' + d);
      bump('CHANGED | by mix | ' + M); bump('CHANGED | by run goal | ' + rg); bump('CHANGED | by tier | ' + x.c.equipment); bump('CHANGED | by focus | ' + x.c.liftingFocus); bump('CHANGED | by exp | ' + x.c.experience); bump('CHANGED | by injury | ' + (x.c.injury ? x.c.injury.region + '/' + x.c.injury.tier : 'none')); bump('CHANGED | by rest | ' + x.c.restDays.join(','));
      bump('CHANGED | by week position | ' + (w === Object.keys(a.p.weeks).length ? 'final week' : 'W' + w + ' not final'));
      const ia = flat(ya), ib = flat(yb);
      if(ia.length !== ib.length) bump('CHANGED | INV item count differs'); if(JSON.stringify((ya.sections || []).map(s => s.label)) !== JSON.stringify((yb.sections || []).map(s => s.label))) bump('CHANGED | INV section labels differ');
      if(JSON.stringify(ya.cardio) !== JSON.stringify(yb.cardio)) bump('CHANGED | INV cardio differs'); if(ya.title !== yb.title || JSON.stringify(ya.tags) !== JSON.stringify(yb.tags)) bump('CHANGED | INV title/tags differ');
      const topA = Object.assign({}, ya, {sections:null}), topB = Object.assign({}, yb, {sections:null}); if(JSON.stringify(topA) !== JSON.stringify(topB)) bump('CHANGED | INV any non-section field differs');
      let nonHinge = 0;
      ia.forEach((it, q) => { const jt = ib[q]; if(!jt || (it.name === jt.name && it.detail === jt.detail)) return; const h = PAT(it.name) === 'hinge';
        if(!h) nonHinge++; if(it.name !== jt.name) bump('CHANGED | ITEM name changed');
        bump('ITEM | ' + (h ? 'hinge' : 'NOT HINGE') + ' | ' + it.name + ' | ' + gram(it.detail) + '  ->  ' + gram(jt.detail));
        bump('ITEM exact | ' + it.name + ' | ' + it.detail + '  ->  ' + jt.detail);
        bump('ITEM | section | ' + (/^(main|primer|power)/i.test(it.lab) ? 'main|primer|power' : 'accessory/other: ' + it.lab.split(/[ —:(]/)[0])); });
      if(nonHinge) bump('CHANGED | INV a NON-hinge item changed');
      if(!hingeShipped.length && !flat(yb).some(i => PAT(i.name) === 'hinge')) bump('CHANGED | INV day has no hinge item');
      ex('changed ' + fired + ' | ' + dir + ' | ' + d, [M + ' ' + tagOf(x) + ' W' + w + ' ' + d + '  main on ' + JSON.stringify(mainOn) + ' off ' + JSON.stringify(mainOff) + '  sweep on ' + JSON.stringify(swOn) + ' off ' + JSON.stringify(swOff), '   base:', ...card(ya), '   CFhn:', ...card(yb), '   calendar tomorrow W' + (C[dix(w, d) + 1] || {}).w + ' ' + (C[dix(w, d) + 1] || {}).d + ':', ...card((C[dix(w, d) + 1] || {}).y).slice(0, 1), '   engine tomorrow:', ...card((() => { const di = WD.indexOf(d), nw = di === 6 ? w + 1 : w, nd = WD[(di + 1) % 7]; return a.p.weeks[nw] && a.p.weeks[nw][nd]; })()).slice(0, 1)]);
    } else {
      // why an engine- or shipped-view disagreement day did not move
      const why = [];
      const hotFlipMain = mainA.length && hotMA !== hotMB, hotFlipSw = swa && swb && hotSA !== hotSB;
      if(!hotFlipMain && !hotFlipSw) why.push('engine sees no flip (shipped-view only: ' + (!live(ya) ? 'day not live' : 'build-time/sweep-time legLoad differs from shipped') + ')');
      if(hotFlipMain){ const rs = (hotMB ? mainB : mainA); why.push('main: ' + (rs.every(r => r.t) ? 'taper' : rs.every(r => r.dl) ? 'deload' : rs.every(r => r.t || r.dl) ? 'taper/deload' : rs.every(r => typeof r.p !== 'number') ? 'no numeric p' : rs.every(r => !(r.p > 0.61) || r.t || r.dl) ? 'p already <= 0.61 (' + [...new Set(rs.map(r => r.p))].sort().join(',') + ')' : 'would fire (?)')); }
      else if(engDis || shipDis) why.push(mainA.length ? 'main: hot unchanged' : 'main: no hinge main built on this day');
      if(hotFlipSw){ const hi = (swb.hinge || []); why.push('sweep: ' + (!hi.length ? 'no hinge item at sweep time' : 'hinge detail grammar ' + [...new Set(hi.map(h => gram(h.split(' :: ')[1])))].sort().join(' ; '))); }
      else if(shipDis && swa && swb) why.push('sweep: hot unchanged at sweep time');
      const key = why.join(' || ');
      bump('UNMOVED | ' + (shipDis ? 'shipped-view' : '') + (engDis ? ' engine-view' : '') + ' | ' + dk + ' | ' + dir + ' | ' + key);
      bump('UNMOVED by mix | ' + (shipDis ? 'shipped-view' : 'engine-only') + ' | ' + M);
      if(shipDis) (hotFlipSw ? (swb.hinge || []) : []).forEach(h => bump('UNMOVED shipped-view hinge item exact | ' + d + ' | ' + dir + ' | ' + h));
      if(shipDis) bump('UNMOVED shipped-view by week position | ' + (w === Object.keys(a.p.weeks).length ? 'final week' : 'not final'));
      ex('unmoved ' + dk + ' | ' + key.slice(0, 90), [M + ' ' + tagOf(x) + ' W' + w + ' ' + d, '   scheme hinge evals base ' + JSON.stringify(mainA.map(r => [r.ex, r.p, r.t, r.dl, r.hot])) + ' hn ' + JSON.stringify(mainB.map(r => [r.ex, r.p, r.t, r.dl, r.hot])), '   sweep base ' + JSON.stringify(swa) + ' hn ' + JSON.stringify(swb), ...card(ya)]);
    }
  });
  // clock/identity fields differ between any two builds; compare weeks, and name every other top-level key that differs
  if(JSON.stringify(a.p.weeks) !== JSON.stringify(b.p.weeks)) bump('PROGRAMS weeks changed | ' + M); bump('PROGRAMS | ' + M);
  new Set(Object.keys(a.p).concat(Object.keys(b.p))).forEach(k => { if(k !== 'weeks' && JSON.stringify(a.p[k]) !== JSON.stringify(b.p[k])) bump('PROGRAMS top-level key differs base vs CFhn | ' + k); });
  if(SHARD === 0 && n <= 20){ const a2 = build('base', x.c); new Set(Object.keys(a.p)).forEach(k => { if(JSON.stringify(a.p[k]) !== JSON.stringify(a2.p[k])) bump('SELF top-level key differs base vs base rebuild | ' + k); }); if(JSON.stringify(a.p.weeks) !== JSON.stringify(a2.p.weeks)) bump('SELF weeks differ base vs base rebuild'); bump('SELF rebuilds'); }
  if(n % 300 === 0) process.stderr.write('shard ' + SHARD + ' ' + n + ' ' + Math.round((Date.now() - t0) / 1000) + 's\n');
});
CHK.push('shard ' + SHARD + ' configs ' + n + ', crashed ' + crash + ', instrumented==raw ' + (inChk - inBad) + '/' + inChk + ', calendar vs _progDayDate ' + (dateChk - dateBad) + '/' + dateChk);
const OUT = path.join(SCR, 'd171_shard_' + SHARD + '.json'); try { fs.unlinkSync(OUT); } catch(e){} fs.writeFileSync(OUT, JSON.stringify({T, EX, CHK}));
console.log('shard ' + SHARD + ' done ' + n + ' configs, ' + crash + ' crashes');
