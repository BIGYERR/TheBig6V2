// V218 measure (Mode B) — D167 before-picture: _adjDayPairs walks Sun..Sat (ALL_DAYS_ORDER) plus W sat > W+1 sun,
// while the week renders Mon..Sun. Read-only. Kept per CLAUDE.md.
// Run:   SCR=<dir> SHARD=i NSH=n node tests/measure/v218_d167_adj_pairs.js <V216.html> <V217.html>   -> SCR/d167_shard_i.json
//        SCR=<dir> MODE=merge NSH=n node tests/measure/v218_d167_adj_pairs.js                         -> summed report
// ADJACENCY ORACLE: date arithmetic on a Monday-start week (mon=0..sun=6, day index (w-1)*7+off), the calendar the week view
// renders (order mon..sun + dayOffset + _progDayDate/getWeekMonday). Cross-checked against _progDayDate on a sample. Never
// _adjDayPairs. ELIGIBILITY ("the dedupe would act on this B item"): the dedupe's own stated contract, B item outside a
// main|primer|power section, isTrackableWeight, _pattern non-null, name present anywhere on A (shipped cards).
// ARMS per base (source surgery, anchors count==1): base; cf = calendar pairs Mon..Sun + W sun > W+1 mon, the forEach index
// is the seed index (literal rewrite); cfs = same pairs, each pair keeps the seed index it holds today (isolates pairing from
// the seed shift); hn = hotNext + hotNextHingeClampSweep read the calendar tomorrow (spread reader, uninstrumented).
const fs = require('fs'), path = require('path');
const { load, fixtures, progDigest } = require('../harness');
const SCR = process.env.SCR || require('os').tmpdir(), MODE = process.env.MODE || 'run', NSH = +(process.env.NSH || 1);
const cl = o => JSON.parse(JSON.stringify(o));
if(MODE === 'merge'){
  const T = {}, EX = {}, CHK = [];
  for(let s = 0; s < NSH; s++){ const f = path.join(SCR, 'd167_shard_' + s + '.json'); if(!fs.existsSync(f)){ console.log('MISSING SHARD ' + s + ' -> measurement FAILED'); process.exit(2); }
    const j = JSON.parse(fs.readFileSync(f, 'utf8')); Object.keys(j.T).forEach(k => T[k] = (T[k] || 0) + j.T[k]); Object.keys(j.EX).forEach(k => { if(!EX[k]) EX[k] = j.EX[k]; }); CHK.push(...j.CHK); }
  CHK.forEach(l => console.log('CHK ' + l));
  Object.keys(T).sort().forEach(k => console.log('  ' + k + ': ' + T[k]));
  Object.keys(EX).sort().forEach(k => console.log('\nEX ' + k + '\n' + EX[k]));
  process.exit(0);
}
const [B6, B7] = process.argv.slice(2).map(p => path.resolve(p)); const SHARD = +(process.env.SHARD || 0);
const h6 = fs.readFileSync(B6, 'utf8'), h7 = fs.readFileSync(B7, 'utf8');
const cnt = (s, a) => s.split(a).length - 1;
const IN6 = 'const inA=nameSet(A);', IN7 = 'const inA=nameSet(_d18View(A, wA, dA));', EMP = 'if(!cands.length) return;', REN = '        it.name=to;\n';
const ADJ_OLD = "    for(let i=1;i<ALL_DAYS_ORDER.length;i++) out.push([w,ALL_DAYS_ORDER[i-1],w,ALL_DAYS_ORDER[i]]);\n    if(w<totalWeeks) out.push([w,'sat',w+1,'sun']);";
const ADJ_CF  = "    for(let i=1;i<_ISO_ORDER.length;i++) out.push([w,_ISO_ORDER[i-1],w,_ISO_ORDER[i]]);\n    if(w<totalWeeks) out.push([w,'sun',w+1,'mon']);";
const ADJ_CFS = "    for(let i=1;i<_ISO_ORDER.length;i++) out.push([w,_ISO_ORDER[i-1],w,_ISO_ORDER[i],(w-1)*7+(i<6?i:0)]);\n    if(w<totalWeeks) out.push([w,'sun',w+1,'mon',(w-1)*7+6]);";
const SEED_OLD = 'seededRand(seed+wB*97+pi*13+ii)', SEED_S = 'seededRand(seed+wB*97+(pair.length>4?pair[4]:pi)*13+ii)';
const HN1_OLD = "      const _di=ALL_DAYS_ORDER.indexOf(d);\n      const _nw=_di===ALL_DAYS_ORDER.length-1?w+1:w, _ndk=ALL_DAYS_ORDER[(_di+1)%7];";
const HN1_NEW = "      const _di=_ISO_ORDER.indexOf(d);\n      const _nw=_di===_ISO_ORDER.length-1?w+1:w, _ndk=_ISO_ORDER[(_di+1)%7];";
const HN2_OLD = "      const _di=ALL_DAYS_ORDER.indexOf(d);\n      const _nw=_di===_last?(+w+1):+w, _ndk=ALL_DAYS_ORDER[(_di+1)%7];";
const HN2_NEW = "      const _di=_ISO_ORDER.indexOf(d);\n      const _nw=_di===_last?(+w+1):+w, _ndk=_ISO_ORDER[(_di+1)%7];";
const CLAUSE = "  if(_auxFamily(name)==='core') return 0;\n";
[[h6, IN6], [h7, IN7]].forEach(([h, IN]) => [IN, EMP, REN, ADJ_OLD, SEED_OLD, HN1_OLD, HN2_OLD, CLAUSE].forEach(a => { if(cnt(h, a) !== 1){ console.log('ANCHOR FAIL ' + cnt(h, a) + ' ' + JSON.stringify(a)); process.exit(2); } }));
const VIEW6 = '(function(){const o={};o[wA]={};o[wA][dA]=JSON.parse(JSON.stringify(A));d18LongRunDayPass(o);return o[wA][dA];})()', VIEW7 = '_d18View(A, wA, dA)';
const inst = (h, IN, VIEW) => h.replace(IN, () => IN + ' const __pre=nameSet(A), __vw=nameSet(' + VIEW + '); (globalThis.__PA||(globalThis.__PA={}))[wA+"|"+dA+">"+wB+"|"+dB]=Object.keys(__pre).sort().join(",");')
  .replace(EMP, () => 'const __e={pw:+wA,pd:dA,w:+wB,d:dB,pi:pi,si:B.sections.indexOf(sec),ii:ii,lab:String(sec.label||""),was:it.name,pre:!!__pre[it.name.toLowerCase()],vw:!!__vw[it.name.toLowerCase()],n:cands.length,top:cands.slice(0,3),onB:Object.keys(onB).sort().join(","),to:null}; (globalThis.__TR||(globalThis.__TR=[])).push(__e); ' + EMP)
  .replace(REN, () => REN + '        __e.to=to;\n');
const cf = h => h.replace(ADJ_OLD, () => ADJ_CF), cfs = h => h.replace(ADJ_OLD, () => ADJ_CFS).replace(SEED_OLD, () => SEED_S), hn = h => h.replace(HN1_OLD, () => HN1_NEW).replace(HN2_OLD, () => HN2_NEW);
const wr = (n, s) => { const f = path.join(SCR, 'd167_s' + SHARD + '_' + n); try { fs.unlinkSync(f); } catch(e){} fs.writeFileSync(f, s); return f; };
const SRC = { '216': [h6, IN6, VIEW6], '217': [h7, IN7, VIEW7] };
const RAWSRC = {}; Object.keys(SRC).forEach(b => { const h = SRC[b][0]; RAWSRC[b] = h; RAWSRC[b + 'cf'] = cf(h); RAWSRC[b + 'cfs'] = cfs(h); RAWSRC[b + 'hn'] = hn(h); });
Object.keys(RAWSRC).forEach(k => { if(k.length > 3 && RAWSRC[k] === SRC[k.slice(0, 3)][0]){ console.log('SURGERY NO-OP ' + k); process.exit(2); } });
const ARMK = ['216', '216cf', '216cfs', '217', '217cf', '217cfs'];
const X = {}; ARMK.forEach(k => { const b = k.slice(0, 3); X[k] = load(wr(k + 'i.html', inst(RAWSRC[k], SRC[b][1], SRC[b][2]))); });
X['216hn'] = load(wr('216hn.html', RAWSRC['216hn'])); X['217hn'] = load(wr('217hn.html', RAWSRC['217hn']));
const CHK = [], T = {}, EX = {}; const bump = (k, n = 1) => { if(n) T[k] = (T[k] || 0) + n; };
const TW = X['216'].eval('isTrackableWeight'), PAT = X['216'].eval('_pattern');
const hm = (Xc, off) => { Xc.window.__DELOAD_OFF = !!off; try { return progDigest(Xc.buildProgram(cl(fixtures.HALF_MANNY))); } finally { Xc.window.__DELOAD_OFF = false; } };
if(SHARD === 0){
  CHK.push('HALF_MANNY restDays ' + JSON.stringify(fixtures.HALF_MANNY.restDays) + ' goal ' + JSON.stringify(Object.keys(fixtures.HALF_MANNY.cardioGoals || {}).map(k => fixtures.HALF_MANNY.cardioGoals[k].id)));
  Object.keys(RAWSRC).forEach(k => { const R = load(wr(k + '.html', RAWSRC[k])), CO = load(wr(k + '_coreoff.html', RAWSRC[k].replace(CLAUSE, () => '')));
    const a = hm(R), b = hm(R, true), c = hm(CO); const inert = X[k] ? hm(X[k]) : '(uninstrumented arm)';
    CHK.push('HALF_MANNY ' + k.padEnd(6) + ' raw ' + a + ' / deload-off ' + b + ' / core-off ' + c + '  vs pins 0ac7da6b1691a8e1 / 1069cd7f86eed204 / 9d14801a63111081: ' + (a === '0ac7da6b1691a8e1' && b === '1069cd7f86eed204' && c === '9d14801a63111081' ? 'UNMOVED' : 'MOVED [' + [a !== '0ac7da6b1691a8e1' ? 'raw' : '', b !== '1069cd7f86eed204' ? 'deload-off' : '', c !== '9d14801a63111081' ? 'core-off' : ''].filter(Boolean).join(',') + ']') + '  instrumented ' + inert + (X[k] ? (inert === a ? ' (inert)' : ' (NOT INERT)') : ''));
    if(k === '216' || k === '217') X[k + 'raw'] = R; });
}
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
const lc = s => String(s || '').toLowerCase();
const isMainSec = s => /^(main|primer|power)/i.test((s && s.label) || ''), isMainOnly = s => /^main/i.test((s && s.label) || '');
const isStr = n => /stretch|mobility|90\/90|foam|worlds greatest|breath/i.test(n || '');
const names = y => live(y) ? [].concat(...y.sections.map(s => (s.items || []).map(i => lc(i.name)))) : [];
const calOf = p => { const m = {}; for(const w of Object.keys(p.weeks)) for(const d of ISO) if(p.weeks[w]) m[dix(+w, d)] = {w:+w, d, y:p.weeks[w][d]}; return m; };
const ptypeOf = dA => dA === 'sat' ? 'sat>sun same week' : dA === 'sun' ? 'sun>mon W+1' : 'interior mon..sat';
const card = y => !y ? ['      (none)'] : y.rest ? ['      REST'] : [(y.cardio ? '      <cardio> ' + (y.cardio.subtype || y.cardio.type || '') : '      <no cardio>')].concat((y.sections || []).map(s => '      [' + (s.label || '') + '] ' + (s.items || []).map(i => i.name).join(' | ')));
const tagOf = x => JSON.stringify({g:Object.keys(x.c.cardioGoals || {}).map(k => x.c.cardioGoals[k].id), f:x.c.liftingFocus, e:x.c.experience, q:x.c.equipment, r:x.c.restDays, s:x.c.seed, inj:x.c.injury || null, race:x.c.raceDate || ''});
const ex = (k, lines) => { if(!EX[k]) EX[k] = lines.join('\n'); };
function build(k, c){ const Xk = X[k]; Xk.window.__TR = []; Xk.window.__PA = {}; const p = cl(Xk.buildProgram(cl(c))); return { p, tr: (Xk.window.__TR || []).slice(), pa: Object.assign({}, Xk.window.__PA || {}) }; }
function analyze(arm, R, x){
  const M = x.mix, p = R.p, C = calOf(p), rs = 'rest[' + x.c.restDays.join(',') + ']';
  // (a) renames by the calendar gap of the pair the dedupe used
  R.tr.forEach(e => { const gap = dix(e.w, e.d) - dix(e.pw, e.pd); const g = gap === 1 ? '+1 calendar' : gap === -6 ? '-6 backwards (W sun>W mon)' : gap === 8 ? '+8 (W sat>W+1 sun)' : 'gap ' + gap;
    if(!e.to){ if(e.n === 0) bump(arm + ' | ' + M + ' | triggers left in place, pool empty | ' + g); return; }
    bump(arm + ' | ' + M + ' | renames | ' + g); bump(arm + ' | ALL | renames | ' + g);
    if(gap !== 1){ bump(arm + ' | ALL | wrong-pair renames by ' + rs); bump(arm + ' | ALL | wrong-pair renames by focus ' + x.c.liftingFocus); bump(arm + ' | ALL | wrong-pair renames by exp ' + x.c.experience); bump(arm + ' | ALL | wrong-pair renames by B weekday ' + e.d); }
    const pv = C[dix(e.w, e.d) - 1], nx = C[dix(e.w, e.d) + 1];
    if(!(pv && names(pv.y).includes(lc(e.was)))) bump(arm + ' | ' + M + ' | renames whose trigger the CALENDAR-previous shipped day lacks | ' + g);
    if((pv && names(pv.y).includes(lc(e.to))) || (nx && names(nx.y).includes(lc(e.to)))) bump(arm + ' | ' + M + ' | renames whose NEW name repeats a calendar neighbour (shipped) | ' + g);
    bump(arm + ' | ALL | rename section label head | ' + (e.lab.split(/[ —:(]/)[0] || '(empty)'));
    if(gap !== 1 && (arm === '216' || arm === '217')) ex(arm + ' wrong-pair rename ' + g + ' | ' + M, [M + ' ' + tagOf(x), '   dedupe pair W' + e.pw + ' ' + e.pd + ' > W' + e.w + ' ' + e.d + ' renamed "' + e.was + '" -> "' + e.to + '"', '   dedupe-yesterday W' + e.pw + ' ' + e.pd + ':', ...card(p.weeks[e.pw][e.pd]), '   calendar-yesterday ' + (pv ? 'W' + pv.w + ' ' + pv.d : '-') + ':', ...card(pv && pv.y), '   W' + e.w + ' ' + e.d + ' (shipped):', ...card(p.weeks[e.w][e.d])]); });
  // (b) shipped calendar-adjacent repeats and forward-Main collisions, every calendar pair
  Object.keys(C).map(Number).sort((a, b) => a - b).forEach(i => { const A = C[i], B = C[i + 1]; if(!A || !B || !live(A.y) || !live(B.y)) return;
    const pt = ptypeOf(A.d); bump(arm + ' | ' + M + ' | calendar pairs both live | ' + pt);
    const nA = new Set(names(A.y)); let el = 0, loose = 0, fm = 0, fmL = 0, fmMO = 0; const elN = [], fmN = [];
    B.y.sections.forEach(sec => (sec.items || []).forEach(it => { const n = lc(it.name); if(!n || !nA.has(n)) return;
      if(!isStr(n)) loose++; if(!isMainSec(sec) && TW(it.name) && PAT(it.name)){ el++; elN.push(it.name); } }));
    const mainB = new Set(), mainOnlyB = new Set(); B.y.sections.forEach(sec => (sec.items || []).forEach(it => { if(isMainSec(sec)) mainB.add(lc(it.name)); if(isMainOnly(sec)) mainOnlyB.add(lc(it.name)); }));
    A.y.sections.forEach(sec => { if(isMainSec(sec)) return; (sec.items || []).forEach(it => { const n = lc(it.name); if(!n || isStr(n)) return; if(mainB.has(n)){ fm++; fmN.push(it.name); if(TW(it.name) && PAT(it.name)) fmL++; } if(mainOnlyB.has(n)) fmMO++; }); });
    bump(arm + ' | ' + M + ' | ELIGIBLE same-name repeats (dedupe contract) | ' + pt, el); bump(arm + ' | ' + M + ' | any-name repeats (non-stretch) | ' + pt, loose);
    if(el) bump(arm + ' | ' + M + ' | calendar pairs holding >=1 eligible repeat | ' + pt);
    bump(arm + ' | ' + M + ' | forward-Main collisions (A accessory = B main|primer|power) | ' + pt, fm); bump(arm + ' | ' + M + ' | forward-Main collisions, loaded+patterned | ' + pt, fmL); bump(arm + ' | ' + M + ' | forward-Main collisions (A accessory = B /^main/ only) | ' + pt, fmMO);
    if(el && pt !== 'interior mon..sat' && (arm === '216' || arm === '217')) ex(arm + ' unseen repeat ' + pt + ' | ' + M, [M + ' ' + tagOf(x), '   W' + A.w + ' ' + A.d + ' -> W' + B.w + ' ' + B.d + ' repeats ' + JSON.stringify(elN), '   W' + A.w + ' ' + A.d + ':', ...card(A.y), '   W' + B.w + ' ' + B.d + ':', ...card(B.y)]);
    if(fm && (arm === '216') ) ex(arm + ' forward-Main ' + M, [M + ' ' + tagOf(x), '   W' + A.w + ' ' + A.d + ' accessory = W' + B.w + ' ' + B.d + ' main: ' + JSON.stringify(fmN), ...card(A.y), '   next:', ...card(B.y)]);
  });
  // (c) hotNext exposure (base arms only): tomorrow's legLoad, engine lens (ALL_DAYS_ORDER, sat>W+1 sun) vs calendar
  if(arm === '216' || arm === '217') Object.keys(C).map(Number).forEach(i => { const A = C[i]; if(!live(A.y)) return;
    if(!names(A.y).some(n => PAT(n) === 'hinge') && !A.y.sections.some(s => (s.items || []).some(it => PAT(it.name) === 'hinge'))) return;
    const di = WD.indexOf(A.d), nw = di === 6 ? A.w + 1 : A.w, nd = WD[(di + 1) % 7]; const ye = p.weeks[nw] && p.weeks[nw][nd], yc = C[i + 1] && C[i + 1].y;
    const le = !!(ye && ye.cardio && ye.cardio.legLoad), lcn = !!(yc && yc.cardio && yc.cardio.legLoad); const dk = A.d === 'sat' || A.d === 'sun' ? A.d : 'mon..fri';
    bump(arm + ' | ' + M + ' | hinge-carrying days | ' + dk); if(le !== lcn) bump(arm + ' | ' + M + ' | hinge days where engine-tomorrow legLoad != calendar-tomorrow legLoad | ' + dk + ' | ' + (le ? 'engine hot, calendar cold' : 'engine cold, calendar hot')); });
}
function diffArms(tag, a, b, x){ const M = x.mix; let chg = 0;
  for(const w of Object.keys(b.p.weeks)) for(const d of ISO){ const y6 = a.p.weeks[w] && a.p.weeks[w][d], y7 = b.p.weeks[w] && b.p.weeks[w][d]; if(JSON.stringify(y6) === JSON.stringify(y7)) continue; chg++;
    bump(tag + ' | ALL | days changed by weekday | ' + d); bump(tag + ' | ' + M + ' | days changed');
    if(!!(y6 && y6.rest) !== !!(y7 && y7.rest)) bump(tag + ' | ALL | LOSS rest flag differs');
    const s6 = (y6 && y6.sections) || [], s7 = (y7 && y7.sections) || [];
    if(s6.length !== s7.length) bump(tag + ' | ALL | LOSS section count differs'); if(JSON.stringify(s6.map(s => s.label)) !== JSON.stringify(s7.map(s => s.label))) bump(tag + ' | ALL | section label list differs');
    if(JSON.stringify(s6.map(s => (s.items || []).length)) !== JSON.stringify(s7.map(s => (s.items || []).length))) bump(tag + ' | ALL | LOSS item count differs (per section)');
    if(JSON.stringify(y6 && y6.cardio) !== JSON.stringify(y7 && y7.cardio)) bump(tag + ' | ALL | CARDIO object differs');
    const n6 = names(y6), n7 = names(y7); let k = 0; for(let q = 0; q < Math.max(n6.length, n7.length); q++) if(n6[q] !== n7[q]) k++; bump(tag + ' | ALL | item names changed', k);
    if(n7.length - new Set(n7).size > n6.length - new Set(n6).size) bump(tag + ' | ALL | same-day duplicate ADDED'); }
  if(chg) bump(tag + ' | ' + M + ' | programs changed'); bump(tag + ' | ' + M + ' | programs');
  if(JSON.stringify(a.p._swapUniverse) !== JSON.stringify(b.p._swapUniverse)) bump(tag + ' | ALL | _swapUniverse differs');
  if(!a.tr || !b.tr) return;
  const pk = e => e.w + '|' + e.d + '|' + e.si + '|' + e.ii; const m6 = new Map(a.tr.filter(e => e.to).map(e => [pk(e), e])), m7 = new Map(b.tr.filter(e => e.to).map(e => [pk(e), e])); const all7 = new Map(b.tr.map(e => [pk(e), e]));
  new Set([...m6.keys(), ...m7.keys()]).forEach(k => { const e6 = m6.get(k), e7 = m7.get(k); const d = (e6 || e7).d;
    if(e6 && !e7){ const z = all7.get(k); bump(tag + ' | ' + M + ' | rename DISAPPEARS | B ' + d + ' | ' + (z ? (z.n === 0 ? 'pool empty now' : 'evaluated, other') : 'trigger no longer reached (pair gone or name not on new A)')); }
    else if(e7 && !e6) bump(tag + ' | ' + M + ' | rename APPEARS | B ' + d + ' | pair ' + ptypeOf(e7.pd));
    else if(e6.to !== e7.to) bump(tag + ' | ' + M + ' | rename RETARGETS | B ' + d + ' | ' + (JSON.stringify(e6.top) === JSON.stringify(e7.top) ? 'same top3, seed index only' : 'pool differs')); });
}
function d160(tag, a, b, x){ const M = x.mix; const posKey = e => e.w + '|' + e.d + '|' + e.si + '|' + e.ii, pairK = e => e.pw + '|' + e.pd + '>' + e.w + '|' + e.d;
  const m6 = new Map(a.tr.map(e => [posKey(e), e])), m7 = new Map(b.tr.map(e => [posKey(e), e]));
  new Set([...m6.keys(), ...m7.keys()]).forEach(k => { const e6 = m6.get(k), e7 = m7.get(k); const o6 = e6 ? e6.to : null, o7 = e7 ? e7.to : null; if(o6 === o7) return;
    const e = e6 || e7, p = pairK(e), aDiff = a.pa[p] !== b.pa[p]; let c;
    if(o6 && !o7 && e6.pre && !e6.vw && !aDiff) c = 'P  reverted phantom';
    else if(aDiff) c = 'A  yesterday differs' + (o7 && !o6 ? ', V217 renames' : o6 && !o7 ? ', V217 does not rename' : ', different target');
    else if(o6 && o7) c = 'B  target changed';
    else if(o7 && !o6) c = 'C  new rename: ' + (!e6 ? (e7.vw && !e7.pre ? 'D18 view ADDS the trigger' : 'V216 never evaluated it') : (e6.n === 0 ? 'V216 pool empty, V217 pool opens' : 'other'));
    else c = 'D  V216 rename gone, not phantom: ' + (e7 && e7.n === 0 ? 'V217 pool empty' : 'other');
    bump(tag + ' | ' + M + ' | ' + c); bump(tag + ' | ALL | ' + c); });
}
// ── run ──
let crash = 0, dateChk = 0, dateBad = 0, idChk = 0, idBad = 0, inChk = 0, inBad = 0, n = 0; const t0 = Date.now();
L.forEach((x, idx) => { if(idx % NSH !== SHARD) return; n++;
  const P = {}; try { ARMK.forEach(k => P[k] = build(k, x.c)); ['216hn', '217hn'].forEach(k => P[k] = { p: cl(X[k].buildProgram(cl(x.c))) }); } catch(e){ crash++; bump('CRASH | ' + x.mix); if(crash < 4) CHK.push('CRASH ' + x.mix + ' ' + tagOf(x) + ' ' + e.message); return; }
  bump('configs | ' + x.mix); bump('configs | ALL');
  if(SHARD === 0 && n <= 40){ for(const b of ['216', '217']){ inChk++; const r = progDigest(X[b + 'raw'].buildProgram(cl(x.c))); if(r !== progDigest(P[b].p)) inBad++; idChk++; if(r !== progDigest(X[b + 'raw'].buildProgram(cl(x.c)))) idBad++; } }
  if(idx % 53 === 0 && x.c.startDate){ const gd = X['216'].eval('_progDayDate'), pp = {startDate:x.c.startDate}, mon0 = gd(pp, 1, 'mon'); for(const w of Object.keys(P['216'].p.weeks)) for(const d of ISO){ dateChk++; const dt = gd(pp, +w, d); if(!dt || Math.round((dt - mon0) / 864e5) !== dix(+w, d)) dateBad++; } }
  ARMK.forEach(k => analyze(k, P[k], x));
  ['216', '217'].forEach(b => { diffArms(b + '->' + b + 'cf', P[b], P[b + 'cf'], x); diffArms(b + '->' + b + 'cfs', P[b], P[b + 'cfs'], x); diffArms(b + '->' + b + 'hn (hotNext calendar)', P[b], P[b + 'hn'], x); });
  d160('D160 216->217 base pairing', P['216'], P['217'], x); d160('D160 216cf->217cf', P['216cf'], P['217cf'], x); d160('D160 216cfs->217cfs', P['216cfs'], P['217cfs'], x);
  if(n % 200 === 0) process.stderr.write('shard ' + SHARD + ' ' + n + ' ' + Math.round((Date.now() - t0) / 1000) + 's\n');
});
CHK.push('shard ' + SHARD + ' configs ' + n + ', crashed ' + crash + ', calendar oracle vs _progDayDate ' + (dateChk - dateBad) + '/' + dateChk + ' agree, instrumented==raw ' + (inChk - inBad) + '/' + inChk + ', raw self-identity ' + (idChk - idBad) + '/' + idChk);
const OUT = path.join(SCR, 'd167_shard_' + SHARD + '.json'); try { fs.unlinkSync(OUT); } catch(e){} fs.writeFileSync(OUT, JSON.stringify({T, EX, CHK}));
console.log('shard ' + SHARD + ' done ' + n + ' configs, ' + crash + ' crashes, ' + Math.round((Date.now() - t0) / 1000) + 's');
