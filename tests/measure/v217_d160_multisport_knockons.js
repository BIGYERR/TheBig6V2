// V217 measure (Mode B) — D160 knock-ons: why V217 (CFb, _d18View) moves days that are not reverted phantoms.
// Run: SCR=<dir> LAT=gk|mine|multi node tests/measure/v217_d160_multisport_knockons.js <V216 base.html> <V217 cand.html>
// Instrument (both builds, identical, source surgery, anchors count==1): at every trigger that reaches the candidate
// filter, log {pair, B position, was, was-in-raw-A, was-in-D18-view-of-A, pool size, top3, onB, to}; per pair, the raw
// A name set. Knock-on classes are derived by comparing the two logs position by position (not by asking either build).
// Athlete view oracle: CALENDAR adjacency by hand date arithmetic (Monday-start week, mon=0..sun=6, as the calendar
// the athlete lives in), cross-checked against _progDayDate; the dedupe's own _adjDayPairs adjacency is reported beside it.
const fs = require('fs'), path = require('path');
const { load, fixtures, progDigest } = require('../harness');
const [B6, B7] = process.argv.slice(2).map(p => path.resolve(p)); const SCR = process.env.SCR || require('os').tmpdir(); const LAT = process.env.LAT || 'gk';
const h6 = fs.readFileSync(B6, 'utf8'), h7 = fs.readFileSync(B7, 'utf8');
const cnt = (s, a) => s.split(a).length - 1;
const IN6 = 'const inA=nameSet(A);', IN7 = 'const inA=nameSet(_d18View(A, wA, dA));', EMP = 'if(!cands.length) return;', REN = '        it.name=to;\n';
const CLAUSE = "  if(_auxFamily(name)==='core') return 0;\n";
[[h6, IN6], [h7, IN7], [h6, EMP], [h7, EMP], [h6, REN], [h7, REN], [h7, CLAUSE]].forEach(([h, a]) => { if(cnt(h, a) !== 1){ console.log('ANCHOR FAIL ' + cnt(h, a) + ' ' + JSON.stringify(a)); process.exit(2); } });
const VIEW6 = '(function(){const o={};o[wA]={};o[wA][dA]=JSON.parse(JSON.stringify(A));d18LongRunDayPass(o);return o[wA][dA];})()', VIEW7 = '_d18View(A, wA, dA)';
const inst = (h, IN, VIEW) => h.replace(IN, () => IN + ' const __pre=nameSet(A), __vw=nameSet(' + VIEW + '); (globalThis.__PA||(globalThis.__PA={}))[wA+"|"+dA+">"+wB+"|"+dB]=Object.keys(__pre).sort().join(",");')
  .replace(EMP, () => 'const __e={pw:+wA,pd:dA,w:+wB,d:dB,si:B.sections.indexOf(sec),ii:ii,was:it.name,pre:!!__pre[it.name.toLowerCase()],vw:!!__vw[it.name.toLowerCase()],n:cands.length,top:cands.slice(0,3),onB:Object.keys(onB).sort().join(","),to:null}; (globalThis.__TR||(globalThis.__TR=[])).push(__e); ' + EMP)
  .replace(REN, () => REN + '        __e.to=to;\n');
const wr = (n, s) => { const f = path.join(SCR, 'ko_' + LAT + '_' + n); try { fs.unlinkSync(f); } catch(e){} fs.writeFileSync(f, s); return f; };
const X6 = load(wr('v216i.html', inst(h6, IN6, VIEW6))), X7 = load(wr('v217i.html', inst(h7, IN7, VIEW7)));
const R6 = load(B6), R7 = load(B7); const cl = o => JSON.parse(JSON.stringify(o));
const hm = (X, off) => { X.window.__DELOAD_OFF = !!off; try { return progDigest(X.buildProgram(cl(fixtures.HALF_MANNY))); } finally { X.window.__DELOAD_OFF = false; } };
console.log('LAT ' + LAT + '  inert: V216 raw/inst ' + hm(R6) + '/' + hm(X6) + '  V217 raw/inst ' + hm(R7) + '/' + hm(X7));
if(LAT === 'gk'){ const CO = load(wr('v217_coreoff.html', h7.replace(CLAUSE, () => '')));
  const a = hm(R7), b = hm(R7, true), c = hm(CO); console.log('HALF_MANNY V217 raw ' + a + ' / ' + b + ' / ' + c + '  vs pins 0ac7da6b1691a8e1 / 1069cd7f86eed204 / 9d14801a63111081: ' + (a === '0ac7da6b1691a8e1' && b === '1069cd7f86eed204' && c === '9d14801a63111081' ? 'UNMOVED' : 'MOVED')); }
function build(X, c){ X.window.__TR = []; X.window.__PA = {}; const p = cl(X.buildProgram(cl(c))); return { p, tr: X.window.__TR.slice(), pa: Object.assign({}, X.window.__PA) }; }
const WD = ['sun','mon','tue','wed','thu','fri','sat'], OFF = {mon:0,tue:1,wed:2,thu:3,fri:4,sat:5,sun:6}, ISO = ['mon','tue','wed','thu','fri','sat','sun'];
// ── lattices ──
const L = [];
if(LAT === 'gk'){ // exact copy of tests/measure/v217_gk_lattice.js config construction
  const ALL = ['sun','mon','tue','wed','thu','fri','sat'], mb = {mileBestMins:'8', mileBestSecs:'15', mileBestSrc:{kind:'entered'}};
  const GOALS = [ {k:'pace', types:['run'], goals:{run:{id:'run_pace_goal', label:'P', ...mb, targetDist:'1.5', targetMins:'11', targetSecs:'0', paceUnit:'mi'}}},
    {k:'base', types:['run'], goals:{run:{id:'run_base', label:'B', ...mb}}},
    {k:'half', types:['run'], goals:{run:{id:'run_half', label:'H', ...mb, baselineDist:'5', baseline:'5mi'}}, race:'2026-12-06'},
    {k:'mara', types:['run'], goals:{run:{id:'run_marathon', label:'M', ...mb, baselineDist:'8', baseline:'8mi'}}},
    {k:'pace+bike', types:['run','bike'], goals:{run:{id:'run_pace_goal', label:'P', ...mb, targetDist:'1.5', targetMins:'11', targetSecs:'0', paceUnit:'mi'}, bike:{id:'bike_base', label:'Bb'}}},
    {k:'bike', types:['bike'], goals:{bike:{id:'bike_base', label:'Bb'}}} ];
  const INJ = [null, null, {region:'knee',tier:'workaround'}, {region:'elbow',tier:'workaround'}];
  const all = []; for(const G of GOALS) for(const eq of ['commercial','crossfit','home_full','home_basic','bodyweight']) for(const fo of ['strength','hypertrophy','balanced','support_prevention','support_athletic','fatloss']) for(const ex of ['beginner','intermediate','advanced']) for(const rs of [['sun','wed'], ['sat','sun'], ['mon','thu','sun'], ['sun']]) for(const seed of [24865, 76308, 99991]) all.push({G, eq, fo, ex, rs, seed});
  all.forEach((x, i) => { const inj = INJ[i % 4];
    const c = {name:'GK', primaryPath:'event', eventTargeted:!!x.G.race, raceDate:x.G.race||'', cardioTypes:x.G.types.slice(), cardioGoals:cl(x.G.goals), liftingFocus:x.fo, experience:x.ex, ageBracket:'18-35', equipment:x.eq, unit:'lbs', restDays:x.rs, days:ALL.slice(), bench:185, squat:255, deadlift:315, startDate:'2026-10-05', seed:x.seed};
    if(inj) c.injury = inj; L.push({mix:'gk ' + x.G.k, tag:x.G.k + '|' + x.eq + '|' + x.fo + '|' + x.ex + '|' + x.rs.join('') + '|' + x.seed + '|' + JSON.stringify(inj), c}); });
}
const STAND = {name:'M',primaryPath:'goal',eventTargeted:false,cardioTypes:['run'],cardioGoals:{run:{id:'run_pace_goal',label:'x',mileBestMins:'8',mileBestSecs:'15',mileBestSrc:{kind:'entered'},targetDist:'1.5',targetMins:'11',targetSecs:'0',paceUnit:'mi'}},
  liftingFocus:'balanced',experience:'intermediate',ageBracket:'18-35',equipment:'home_full',unit:'lbs',restDays:['sun','wed'],days:WD.slice(),bench:185,squat:255,deadlift:315,startDate:'2026-09-21',seed:24865};
const FOC6 = ['balanced','hypertrophy','strength','support_athletic','support_prevention','support_strength'];
const EQ = ['crossfit','commercial','home_full','home_basic','bodyweight'], EXP = ['beginner','intermediate','advanced'], AGE = ['18-35','36-54','55+'];
const RESTS = [['sun','wed'],['sat','sun'],['sun'],['mon','wed','fri'],['tue','thu','sun']];
if(LAT === 'mine'){ // the 8,280 lattice of v217_d160_dedupe_order.js / v217_d160_rebaseline_v216.js
  const PLANS = ['run_5k','run_10k','run_half','run_marathon'], RACED = ['2026-12-06','2027-01-17','2027-03-28'], MILE = [['7','30'],['8','15'],['10','30'],['12','0']];
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
}
if(LAT === 'multi'){ // NSW multi-sport extension: pace+bike, pace+swim, pace+bike+swim, run_base+bike
  const MIX = [['pace+bike','run_pace_goal',{bike:1}],['pace+swim','run_pace_goal',{swim:1}],['pace+bike+swim','run_pace_goal',{bike:1,swim:1}],['base+bike','run_base',{bike:1}]];
  for(const [mk, g, o] of MIX) for(const mm of [['8','15'],['12','0']]) for(const f of FOC6.concat(['fatloss'])) for(const q of EQ) for(const r of RESTS) for(const e of EXP){
    const c = cl(STAND); c.cardioGoals.run.id = g; c.cardioGoals.run.mileBestMins = mm[0]; c.cardioGoals.run.mileBestSecs = mm[1]; c.liftingFocus = f; c.equipment = q; c.restDays = r.slice(); c.experience = e;
    if(o.bike){ c.cardioTypes.push('bike'); c.cardioGoals.bike = {id:'bike_base',label:'Bb',baselineDist:'10',baseline:'10mi'}; }
    if(o.swim){ c.cardioTypes.push('swim'); c.cardioGoals.swim = {id:'swim_base',label:'Sb',baselineDist:'1000',baseline:'1000m'}; }
    L.push({mix:'NSW ' + mk, c}); }
}
// ── metrics ──
const T = {}, EX = {}; const bump = (k, n = 1) => { T[k] = (T[k] || 0) + n; };
const names = y => [].concat(...((y && !y.rest && y.sections) || []).map(s => (s.items || []).map(i => String(i.name || ''))));
const isMainSec = s => /^(main|primer|power)/i.test((s && s.label) || '');
const isStr = n => /stretch|mobility|90\/90|foam|worlds greatest|breath/i.test(n || '');
const accNames = y => new Set([].concat(...((y && !y.rest && y.sections) || []).map(s => (s.items || []).map(i => String(i.name || '').toLowerCase()))).filter(n => n && !isStr(n)));
const cal = p => { const m = {}; for(const w of Object.keys(p.weeks)) for(const d of ISO) m[((+w - 1) * 7 + OFF[d])] = {w:+w, d}; return m; };
const dix = (w, d) => (w - 1) * 7 + OFF[d];
const card = y => !y ? ['      (none)'] : y.rest ? ['      REST'] : (y.sections || []).map(s => '      [' + (s.label || '') + '] ' + (s.items || []).map(i => i.name + ' ' + (i.detail || '')).join(' | '));
let dateChk = 0, dateBad = 0, crash = 0;
const posKey = e => e.w + '|' + e.d + '|' + e.si + '|' + e.ii;
L.forEach((x, idx) => {
  let a, b; try { a = build(X6, x.c); b = build(X7, x.c); } catch(e){ crash++; if(crash < 4) console.log('CRASH ' + x.mix + ' ' + e.message); return; }
  const M = x.mix; bump(M + ' | configs');
  if(idx % 97 === 0 && x.c.startDate){ const gd = R7.eval('_progDayDate'), pp = {startDate:x.c.startDate}, mon0 = gd(pp, 1, 'mon'); for(const w of Object.keys(a.p.weeks)) for(const d of ISO){ dateChk++; const dt = gd(pp, +w, d); if(!dt || Math.round((dt - mon0) / 864e5) !== dix(+w, d)) dateBad++; } }
  const ph6 = a.tr.filter(e => e.to && e.pre && !e.vw); bump(M + ' | V216 renames', a.tr.filter(e => e.to).length); bump(M + ' | V217 renames', b.tr.filter(e => e.to).length);
  bump(M + ' | V216 phantom (dedupe-yesterday: trigger in raw A, not in D18 view)', ph6.length); bump(M + ' | V217 phantom (same test)', b.tr.filter(e => e.to && e.pre && !e.vw).length);
  ph6.forEach(e => bump('trigger ' + M + ' | ' + e.was));
  // calendar-yesterday phantom (gatekeeper's oracle): trigger absent from the SHIPPED calendar-previous day
  const C6 = cal(a.p), C7 = cal(b.p);
  a.tr.filter(e => e.to).forEach(e => { const pv = C6[dix(e.w, e.d) - 1]; const shipped = pv ? a.p.weeks[pv.w][pv.d] : null; if(!names(shipped).map(s => s.toLowerCase()).includes(e.was.toLowerCase())) bump(M + ' | V216 renames whose trigger the CALENDAR-previous shipped day lacks'); });
  a.tr.filter(e => e.to).forEach(e => { const cp = dix(e.w, e.d) - dix(e.pw, e.pd); bump(M + ' | V216 renames by dedupe-pair calendar gap ' + cp + ' day(s)'); });
  // position-by-position event comparison
  const m6 = new Map(a.tr.map(e => [posKey(e), e])), m7 = new Map(b.tr.map(e => [posKey(e), e]));
  const keys = new Set([...m6.keys(), ...m7.keys()]); const dayCls = {};
  const pairK = e => e.pw + '|' + e.pd + '>' + e.w + '|' + e.d;
  const clsOf = {};
  const sorted = [...keys].sort((k1, k2) => { const [w1, d1] = k1.split('|'), [w2, d2] = k2.split('|'); return (w1 - w2) || (WD.indexOf(d1) - WD.indexOf(d2)); });
  sorted.forEach(k => { const e6 = m6.get(k), e7 = m7.get(k); const o6 = e6 ? e6.to : null, o7 = e7 ? e7.to : null; if(o6 === o7) return;
    const e = e6 || e7; const pk = pairK(e); const aDiff = a.pa[pk] !== b.pa[pk];
    let c;
    if(o6 && !o7 && e6.pre && !e6.vw && !aDiff) c = 'P  reverted phantom';
    else if(aDiff){ // yesterday's raw names differ between builds at the time the dedupe read them
      const up = Object.keys(clsOf).filter(q => { const [w, d] = q.split('|'); return +w === e.pw && d === e.pd; }).map(q => clsOf[q]);
      c = 'A  yesterday differs (upstream: ' + ([...new Set(up)].map(s => s.slice(0, 2).trim()).sort().join('+') || 'none logged') + ')';
      if(o7 && !o6) c += ', V217 renames'; else if(o6 && !o7) c += ', V217 does not rename'; else c += ', different target'; }
    else if(o6 && o7){ const onBd = e6.onB !== e7.onB; const gained = e7.top.filter(n => !e6.top.includes(n)); const pa = new Set((a.pa[pk] || '').split(','));
      c = 'B  target changed: ' + (onBd ? 'onB differs (earlier item on same day renamed differently)' : gained.some(n => pa.has(n.toLowerCase())) ? 'candidate filter: a D18-stripped name of yesterday re-enters the pool' : 'pool differs, other'); }
    else if(o7 && !o6){ c = 'C  new rename: ' + (!e6 ? (e7.vw && !e7.pre ? 'D18 view ADDS the trigger' : 'V216 never evaluated it') : (e6.n === 0 ? 'V216 pool empty, V217 pool opens (fewer exclusions)' : 'V216 had a pool but no rename (?)')); }
    else c = 'D  V216 rename gone, not phantom: ' + (e7 && e7.n === 0 ? 'V217 pool empty' : 'other');
    clsOf[k] = c; bump('event ' + M + ' | ' + c); bump('event ALL | ' + c);
    { const lc = s => String(s || '').toLowerCase(); const n6 = lc(o6 || e.was), n7 = lc(o7 || e.was);
      const has = (p, w, d, n) => !!(p.weeks[w] && p.weeks[w][d]) && names(p.weeks[w][d]).map(lc).includes(n);
      const calP = (C, j) => C[j]; const cp6 = calP(C6, dix(e.w, e.d) - 1), cp7 = calP(C7, dix(e.w, e.d) - 1), cn6 = calP(C6, dix(e.w, e.d) + 1), cn7 = calP(C7, dix(e.w, e.d) + 1);
      const onDay6 = has(a.p, e.w, e.d, n6), onDay7 = has(b.p, e.w, e.d, n7);
      const rp6 = onDay6 && cp6 && has(a.p, cp6.w, cp6.d, n6), rp7 = onDay7 && cp7 && has(b.p, cp7.w, cp7.d, n7);
      const rn6 = onDay6 && cn6 && has(a.p, cn6.w, cn6.d, n6), rn7 = onDay7 && cn7 && has(b.p, cn7.w, cn7.d, n7);
      const dp6 = onDay6 && has(a.p, e.pw, e.pd, n6), dp7 = onDay7 && has(b.p, e.pw, e.pd, n7);
      const cc = c.slice(0, 2).trim();
      bump('VERDICT ' + cc + ' | item ships on its day V216/V217 ' + onDay6 + '/' + onDay7);
      bump('VERDICT ' + cc + ' | item repeats CALENDAR-yesterday shipped V216/V217 ' + !!rp6 + '/' + !!rp7);
      bump('VERDICT ' + cc + ' | item repeats CALENDAR-tomorrow shipped V216/V217 ' + !!rn6 + '/' + !!rn7);
      bump('VERDICT ' + cc + ' | item repeats DEDUPE-yesterday shipped V216/V217 ' + !!dp6 + '/' + !!dp7);
      bump('VERDICT ' + cc + ' | trigger "' + e.was + '" in D18 view of yesterday V216/V217 ' + (e6 ? e6.vw : '-') + '/' + (e7 ? e7.vw : '-')); }
    const dk = e.w + '|' + e.d; (dayCls[dk] = dayCls[dk] || new Set()).add(c.slice(0, 2).trim());
    if(!EX[c] && c[0] !== 'P'){ const pv = C7[dix(e.w, e.d) - 1];
      EX[c] = [M + ' ' + (x.tag || JSON.stringify({g:x.c.cardioGoals.run && x.c.cardioGoals.run.id, t:x.c.cardioTypes, f:x.c.liftingFocus, e:x.c.experience, q:x.c.equipment, r:x.c.restDays, s:x.c.seed})),
        '   W' + e.w + ' ' + e.d + ' item[' + e.si + '][' + e.ii + '] "' + e.was + '"  V216 -> ' + JSON.stringify(o6) + ' (pool ' + (e6 ? e6.n + ' top ' + JSON.stringify(e6.top) : 'not evaluated') + ')  V217 -> ' + JSON.stringify(o7) + ' (pool ' + (e7 ? e7.n + ' top ' + JSON.stringify(e7.top) : 'not evaluated') + ')',
        '   dedupe-yesterday W' + e.pw + ' ' + e.pd + ' raw names V216 [' + a.pa[pk] + ']', '                          raw names V217 [' + b.pa[pk] + ']',
        '   dedupe-yesterday SHIPS (V217):', ...card(b.p.weeks[e.pw][e.pd]), '   calendar-yesterday ' + (pv ? 'W' + pv.w + ' ' + pv.d : '-') + ' SHIPS (V216 / V217):', ...card(pv && a.p.weeks[pv.w][pv.d]), ...card(pv && b.p.weeks[pv.w][pv.d]),
        '   W' + e.w + ' ' + e.d + ' V216:', ...card(a.p.weeks[e.w][e.d]), '   W' + e.w + ' ' + e.d + ' V217:', ...card(b.p.weeks[e.w][e.d])].join('\n'); } });
  // day-level: every day whose final card differs, classified by its events; athlete view + invariants
  let chg = 0;
  for(const w of Object.keys(b.p.weeks)) for(const d of ISO){ const y6 = a.p.weeks[w] && a.p.weeks[w][d], y7 = b.p.weeks[w][d]; if(JSON.stringify(y6) === JSON.stringify(y7)) continue; chg++;
    const cs = dayCls[w + '|' + d] ? [...dayCls[w + '|' + d]].sort().join('+') : 'no dedupe event on this day';
    bump('day ' + M + ' | ' + cs); bump('day ALL | ' + cs);
    // invariants
    const n6 = names(y6), n7 = names(y7); if(n6.length !== n7.length) bump('INV item count differs | ' + cs);
    const dup = n => n.length - new Set(n.map(s => s.toLowerCase())).size; if(dup(n7) > dup(n6)){ bump('INV V217 adds a same-day duplicate | ' + cs); if(!EX['INV dup ' + cs]) EX['INV dup ' + cs] = [M + ' ' + JSON.stringify({g:x.c.cardioGoals.run && x.c.cardioGoals.run.id, t:x.c.cardioTypes, f:x.c.liftingFocus, e:x.c.experience, q:x.c.equipment, r:x.c.restDays, s:x.c.seed, inj:x.c.injury}) + ' W' + w + ' ' + d, '   V216:', ...card(y6), '   V217:', ...card(y7), '   V216 dedupe events: ' + JSON.stringify(a.tr.filter(e => e.w === +w && e.d === d).map(e => [e.was, e.to, e.pre, e.vw]))].join('\n'); } if(dup(n7) < dup(n6)){ bump('INV V217 removes a same-day duplicate | ' + cs); if(!EX['INV undup ' + cs]) EX['INV undup ' + cs] = [M + ' W' + w + ' ' + d, '   V216:', ...card(y6), '   V217:', ...card(y7)].join('\n'); }
    // athlete view: accessory same-name items shared with the CALENDAR neighbours and with the DEDUPE neighbours, shipped cards
    const di = dix(+w, d); const nb = (C, p, j) => { const z = C[j]; return z ? p.weeks[z.w][z.d] : null; };
    const shared = (y, z) => { const s1 = accNames(y), s2 = accNames(z); return [...s1].filter(n => s2.has(n)).length; };
    const pi = WD.indexOf(d); const dPrev = pi > 0 ? [+w, WD[pi - 1]] : [+w - 1, 'sat'], dNext = pi < 6 ? [+w, WD[pi + 1]] : [+w + 1, 'sun'];
    const gd = (p, q) => p.weeks[q[0]] ? p.weeks[q[0]][q[1]] : null;
    const cal6 = shared(y6, nb(C6, a.p, di - 1)) + shared(y6, nb(C6, a.p, di + 1)), cal7 = shared(y7, nb(C7, b.p, di - 1)) + shared(y7, nb(C7, b.p, di + 1));
    const ded6 = shared(y6, gd(a.p, dPrev)) + shared(y6, gd(a.p, dNext)), ded7 = shared(y7, gd(b.p, dPrev)) + shared(y7, gd(b.p, dNext));
    bump('VIEW calendar-adjacent accessory repeats V216 | ' + cs, cal6); bump('VIEW calendar-adjacent accessory repeats V217 | ' + cs, cal7);
    if(cal7 > cal6) bump('VIEW days where V217 has MORE calendar-adjacent repeats | ' + cs);
    if(cal7 !== cal6){ const rep = (y, z) => { const s2 = accNames(z); const out = []; ((y && !y.rest && y.sections) || []).forEach(sc => (sc.items || []).forEach(it => { const n = String(it.name || '').toLowerCase(); if(n && !isStr(n) && s2.has(n)){ const zm = ((z && z.sections) || []).some(q => isMainSec(q) && (q.items || []).some(i2 => String(i2.name || '').toLowerCase() === n)); out.push(it.name + (isMainSec(sc) ? ' [Main here]' : '') + (zm ? ' [Main on neighbour]' : '')); } })); return out; };
      const r6 = rep(y6, nb(C6, a.p, di - 1)).map(q => 'prev:' + q).concat(rep(y6, nb(C6, a.p, di + 1)).map(q => 'next:' + q)), r7 = rep(y7, nb(C7, b.p, di - 1)).map(q => 'prev:' + q).concat(rep(y7, nb(C7, b.p, di + 1)).map(q => 'next:' + q));
      bump('VIEW-DELTA ' + M + ' | ' + cs + ' W' + w + ' ' + d + ' | V216 ' + JSON.stringify(r6) + ' -> V217 ' + JSON.stringify(r7)); } if(cal7 < cal6) bump('VIEW days where V217 has FEWER calendar-adjacent repeats | ' + cs);
    bump('VIEW dedupe-adjacent accessory repeats V216 | ' + cs, ded6); bump('VIEW dedupe-adjacent accessory repeats V217 | ' + cs, ded7);
    if(ded7 > ded6) bump('VIEW days where V217 has MORE dedupe-adjacent repeats | ' + cs); if(ded7 < ded6) bump('VIEW days where V217 has FEWER dedupe-adjacent repeats | ' + cs); }
  if(chg) bump(M + ' | programs changed');
  if(JSON.stringify(a.p._swapUniverse) !== JSON.stringify(b.p._swapUniverse)) bump('INV _swapUniverse differs');
});
console.log('configs ' + L.length + ', crashed ' + crash + ', calendar oracle vs _progDayDate: ' + (dateChk - dateBad) + '/' + dateChk + ' agree');
Object.keys(T).sort().forEach(k => console.log('  ' + k + ': ' + T[k]));
Object.keys(EX).sort().forEach(k => console.log('\nEX ' + k + '\n' + EX[k]));
