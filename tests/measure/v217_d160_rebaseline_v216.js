// V217 measure (Mode B, re-baseline) — D160 CFb on ANY base (written for V216, run on V215 too for the D156 delta).
// Run: SCR=<dir> node tests/measure/v217_d160_rebaseline_v216.js <index.html>   (e.g. git show HEAD:index.html)
// Copies (source surgery, anchors count==1), instrumented identically to v217_d160_dedupe_order.js:
//   BASE = the artifact as given;  CFb = dedupe stays, per pair inA reads a D18-applied clone of the previous day.
// Oracles: phantom = rename trigger absent from the SHIPPED previous day (final output, not the suspect);
// non-phantom diff = whole buildProgram output (weeks + _swapUniverse + every other field), clock fields stripped,
// after proving BASE == BASE across rebuilds. Doctrine from the goal id (NSW test goals vs NRC race plans; >1 cardio type = multi).
const fs = require('fs'), path = require('path');
const { load, fixtures, progDigest } = require('../harness');
const SRC = path.resolve(process.argv[2] || ''); const SCR = process.env.SCR || require('os').tmpdir();
const html = fs.readFileSync(SRC, 'utf8'); const VER = (html.match(/ia-version" content="(\d+)"/) || [])[1];
const cnt = (s, a) => s.split(a).length - 1;
const INA = 'const inA=nameSet(A);';
const REN = '        it.name=to;\n        if(sec.label&&sec.label.indexOf(was)>=0) sec.label=sec.label.split(was).join(to);';
const CLAUSE = "  if(_auxFamily(name)==='core') return 0;\n";
[INA, REN, CLAUSE].forEach(a => { if(cnt(html, a) !== 1){ console.log('ANCHOR FAIL ' + cnt(html, a) + ' ' + JSON.stringify(a.slice(0, 70))); process.exit(2); } });
console.log('base ia-version ' + VER);
const inst = h => h.replace(INA, () => INA + ' globalThis.__DDP=(globalThis.__DDP||0)+1;')
  .replace(REN, () => REN + '\n        (globalThis.__DD||(globalThis.__DD=[])).push({w:+wB,d:dB,was:was,to:to,pw:+wA,pd:dA});');
const V = { BASE: inst(html),
  CFb: inst(html).replace(INA + ' globalThis', () => 'const inA=nameSet((function(){ if(!A) return A; const o={}; o[wA]={}; o[wA][dA]=JSON.parse(JSON.stringify(A)); d18LongRunDayPass(o); return o[wA][dA]; })()); globalThis') };
const wr = (n, s) => { const f = path.join(SCR, 'rb' + VER + '_' + n); try { fs.unlinkSync(f); } catch(e){} fs.writeFileSync(f, s); return f; };
const IA = {}; Object.keys(V).forEach(k => { IA[k] = load(wr(k + '.html', V[k])); });
const RAW = load(SRC); const cl = o => JSON.parse(JSON.stringify(o));
const WD = ['sun','mon','tue','wed','thu','fri','sat'];
function build(X, c){ X.window.__DD = []; X.window.__DDP = 0; const p = X.buildProgram(cl(c)); p.__dd = X.window.__DD; p.__ddp = X.window.__DDP; return p; }
const hm = (X, off) => { X.window.__DELOAD_OFF = !!off; try { return progDigest(X.buildProgram(cl(fixtures.HALF_MANNY))); } finally { X.window.__DELOAD_OFF = false; } };
console.log('instrument inert: raw ' + hm(RAW) + ' BASE ' + hm(IA.BASE) + ' | deload-off raw ' + hm(RAW, true) + ' BASE ' + hm(IA.BASE, true));
console.log('HALF_MANNY arms main / deload-off / core-off; pins 0ac7da6b1691a8e1 / 1069cd7f86eed204 / 9d14801a63111081');
Object.keys(V).forEach(k => { const CO = load(wr(k + '_coreoff.html', V[k].replace(CLAUSE, () => ''))); const a = hm(IA[k]), b = hm(IA[k], true), c = hm(CO);
  console.log('  ' + k.padEnd(5) + ' ' + a + ' / ' + b + ' / ' + c + '  ' + (a === '0ac7da6b1691a8e1' && b === '1069cd7f86eed204' && c === '9d14801a63111081' ? 'UNMOVED (matches pins)' : 'DIFFERS FROM PINS')); });
// ── lattice: identical to v217_d160_dedupe_order.js ──
const FOC6 = ['balanced','hypertrophy','strength','support_athletic','support_prevention','support_strength'];
const EQ = ['crossfit','commercial','home_full','home_basic','bodyweight'], EXP = ['beginner','intermediate','advanced'], AGE = ['18-35','36-54','55+'];
const RESTS = [['sun','wed'],['sat','sun'],['sun'],['mon','wed','fri'],['tue','thu','sun']];
const PLANS = ['run_5k','run_10k','run_half','run_marathon'], RACED = ['2026-12-06','2027-01-17','2027-03-28'];
const MILE = [['7','30'],['8','15'],['10','30'],['12','0']];
const EXTRAS = [{bike:'bike_base'},{swim:'swim_base'},{bike:'bike_ftp'},{swim:'swim_mile'},{bike:'bike_base',swim:'swim_base'}];
function nrcCfg(plan, o, i){
  const goals = {run:{id:plan,label:plan,mileBestMins:MILE[i%4][0],mileBestSecs:MILE[i%4][1],baselineDist:String([3,5,8][i%3]),baseline:[3,5,8][i%3]+'mi'}}, types = ['run'];
  if(o.ex && o.ex.bike){ types.push('bike'); goals.bike = {id:o.ex.bike,label:o.ex.bike,baselineDist:'10',baseline:'10mi'}; }
  if(o.ex && o.ex.swim){ types.push('swim'); goals.swim = {id:o.ex.swim,label:o.ex.swim,baselineDist:'1000',baseline:'1000m'}; }
  return Object.assign(cl(fixtures.HALF_MANNY), {name:'M',primaryPath:o.dated?'event':'fitness',cardioTypes:types,cardioGoals:goals,
    eventTargeted:!!o.dated,raceDate:o.dated?RACED[i%3]:'',startDate:'2026-09-21',liftingFocus:o.f,experience:o.e,ageBracket:AGE[i%3],equipment:o.q,restDays:o.r.slice(),seed:76308}); }
const L = []; let ii = 0;
for(const plan of PLANS) for(const e of EXP) for(const r of RESTS) for(const q of EQ) for(const f of FOC6) for(const dated of [true,false]) L.push({lat:'NRC', c:nrcCfg(plan, {e,r,q,f,dated}, ii++)});
for(const plan of PLANS) for(const ex of EXTRAS) for(const f of FOC6) for(const q of EQ) L.push({lat:'NRC multi', c:nrcCfg(plan, {ex,e:EXP[ii%3],r:RESTS[ii%2],q,f,dated:ii%2===0}, ii++)});
const STAND = {name:'M',primaryPath:'goal',eventTargeted:false,cardioTypes:['run'],cardioGoals:{run:{id:'run_pace_goal',label:'x',mileBestMins:'8',mileBestSecs:'15',mileBestSrc:{kind:'entered'},targetDist:'1.5',targetMins:'11',targetSecs:'0',paceUnit:'mi'}},
  liftingFocus:'balanced',experience:'intermediate',ageBracket:'18-35',equipment:'home_full',unit:'lbs',restDays:['sun','wed'],days:WD.slice(),bench:185,squat:255,deadlift:315,startDate:'2026-09-21',seed:24865};
for(const g of ['run_pace_goal','run_mile_time','run_15_under10','run_base']) for(const mm of [['8','15'],['12','0']]) for(const f of FOC6) for(const q of EQ) for(const r of RESTS) for(const e of EXP){
  const c = cl(STAND); c.cardioGoals.run.id = g; c.cardioGoals.run.mileBestMins = mm[0]; c.cardioGoals.run.mileBestSecs = mm[1]; c.liftingFocus = f; c.equipment = q; c.restDays = r.slice(); c.experience = e; L.push({lat:'NSW', c}); }
const GOALS = [['run_5k',{}],['run_half',{}],['run_pace_goal',{targetDist:'1.5',targetMins:'10',targetSecs:'0'}],['run_base',{}],['run_10k',{}],['run_marathon',{}]];
const SEEDS = [76308, 1234, 4242, 9001, 31337, 555, 8086, 20260];
for(const q of EQ) for(let si = 0; si < 8; si++) for(const rg of ['shoulder','elbow','lowback','hip','knee','ankle']) for(const t of ['workaround','protect']){
  const [g, x] = GOALS[si % 6];
  L.push({lat:'injury', c:{ name:'M', primaryPath:'goal', cardioTypes:['run'], cardioGoals:{ run: Object.assign({ id:g, label:g, mileBestMins:'8', mileBestSecs:'30', baselineDist:'3', baseline:'3mi' }, x) },
    eventTargeted:false, liftingFocus:'hypertrophy', experience:EXP[si % 3], ageBracket:AGE[si % 3], equipment:q, unit:'lbs', restDays:[['sun','wed'],['sat','sun']][si % 2].slice(), days:WD.slice(), bench:135, squat:155, deadlift:185, seed:SEEDS[si], injury:{region:rg,tier:t} }}); }
const doct = c => (c.cardioTypes || []).length > 1 ? 'multi' : (/^run_(5k|10k|half|marathon)$/.test(c.cardioGoals.run.id) ? 'NRC' : 'NSW');
// ── metrics ──
const names = y => [].concat(...((y && y.sections) || []).map(s => (s.items || []).map(i => String(i.name || ''))));
const CLOCK = new Set(['id','created','createdAt','updatedAt','ts','builtAt','generatedAt']);
const strip = p => JSON.stringify(p, (k, v) => (CLOCK.has(k) || k === '__dd' || k === '__ddp') ? undefined : v);
const T = {}; const bump = (k, n = 1) => { T[k] = (T[k] || 0) + n; };
const EX = {}; let selfDiff = 0, crash = 0, cfgs = 0;
const card = y => !y ? ['    (no day)'] : y.rest ? ['    REST'] : ((y.sections || []).map(s => '    [' + (s.label || '') + '] ' + (s.items || []).map(i => i.name + ' ' + (i.detail || '')).join(' | ')));
L.forEach((x, idx) => {
  const D = doct(x.c); let P = {};
  try { P.BASE = build(IA.BASE, x.c); P.CFb = build(IA.CFb, x.c); if(idx % 50 === 0){ const again = build(IA.BASE, x.c); if(strip(again) !== strip(P.BASE)) selfDiff++; bump('selfcheck rebuilds'); } }
  catch(e){ crash++; if(crash < 4) console.log('CRASH ' + x.lat + ' ' + e.message); return; }
  cfgs++; bump('cfg ' + D);
  if(process.env.KEYS) P.BASE.__dd.forEach(r => { if(!names(P.BASE.weeks[r.pw][r.pd]).includes(r.was)) fs.appendFileSync(process.env.KEYS, idx + ' ' + r.w + '|' + r.d + '|' + r.was + '->' + r.to + ' prevTier=' + (P.BASE.weeks[r.pw][r.pd].cardio && !Array.isArray(P.BASE.weeks[r.pw][r.pd].cardio) ? (RAW.eval('_longRunTier')(P.BASE.weeks[r.pw][r.pd].cardio) || '-') : '-') + ' goal=' + x.c.cardioGoals.run.id + ' dose=' + (((P.BASE.weeks[r.pw][r.pd].cardio||{}).dose||{}).key || '-') + '\n'); });
  ['BASE','CFb'].forEach(k => { bump(k + ' pairs checked', P[k].__ddp); bump(k + ' renames', P[k].__dd.length); bump(k + ' renames ' + D, P[k].__dd.length);
    P[k].__dd.forEach(r => { const Pd = P[k].weeks[r.pw] && P[k].weeks[r.pw][r.pd], Bd = P[k].weeks[r.w] && P[k].weeks[r.w][r.d];
      const ph = !names(Pd).includes(r.was), lost = !names(Bd).includes(r.to);
      if(ph){ bump(k + ' phantom'); bump(k + ' phantom ' + D); bump(k + ' phantom lat ' + x.lat); }
      if(lost) bump(k + ' unseen (renamed item not shipped)'); }); });
  const key = r => r.w + '|' + r.d + '|' + r.was + '->' + r.to;
  const bset = new Set(P.BASE.__dd.map(key)), cset = new Set(P.CFb.__dd.map(key));
  P.BASE.__dd.forEach(r => { if(cset.has(key(r))) return; const Pd = P.BASE.weeks[r.pw][r.pd]; const ph = !names(Pd).includes(r.was);
    bump('CFb drops a BASE rename (' + (ph ? 'phantom' : 'NON-phantom') + ')');
    const ek = 'example ' + D; if(ph && !EX[ek] && names(P.CFb.weeks[r.w][r.d]).includes(r.was)){
      EX[ek] = [x.lat + ' ' + D + ' goal=' + x.c.cardioGoals.run.id + ' focus=' + x.c.liftingFocus + ' exp=' + x.c.experience + ' eq=' + x.c.equipment + ' rest=' + x.c.restDays.join(',') + ' seed=' + x.c.seed + (x.c.injury ? ' injury=' + JSON.stringify(x.c.injury) : '') + (x.c.raceDate ? ' race=' + x.c.raceDate : '') + ' mile=' + x.c.cardioGoals.run.mileBestMins + ':' + x.c.cardioGoals.run.mileBestSecs,
        '  rename W' + r.w + ' ' + r.d + ': "' + r.was + '" -> "' + r.to + '", trigger = W' + r.pw + ' ' + r.pd + ' pre-D18; that day SHIPS:', ...card(P.BASE.weeks[r.pw][r.pd]),
        '  W' + r.w + ' ' + r.d + ' V' + VER + ' BASE card:', ...card(P.BASE.weeks[r.w][r.d]), '  W' + r.w + ' ' + r.d + ' CFb card:', ...card(P.CFb.weeks[r.w][r.d])].join('\n'); } });
  P.CFb.__dd.forEach(r => { if(!bset.has(key(r))) bump('CFb adds a rename BASE did not make'); });
  const sb = strip(P.BASE), sc = strip(P.CFb); if(sb === sc) return; bump('programs differing');
  if(JSON.stringify(P.BASE._swapUniverse || null) !== JSON.stringify(P.CFb._swapUniverse || null)) bump('DIFF _swapUniverse');
  if(JSON.stringify(P.BASE._swapUniverseByKey || null) !== JSON.stringify(P.CFb._swapUniverseByKey || null)) bump('DIFF _swapUniverseByKey');
  Object.keys(Object.assign({}, P.BASE, P.CFb)).filter(k => !CLOCK.has(k) && !['weeks','__dd','__ddp','_swapUniverse','_swapUniverseByKey'].includes(k))
    .forEach(k => { if(JSON.stringify(P.BASE[k]) !== JSON.stringify(P.CFb[k])) bump('DIFF top-level field ' + k); });
  const phDays = new Set(P.BASE.__dd.filter(r => !names(P.BASE.weeks[r.pw][r.pd]).includes(r.was)).map(r => r.w + '|' + r.d));
  for(const w of Object.keys(P.BASE.weeks)) for(const d of WD){ const yb = P.BASE.weeks[w][d], yc = P.CFb.weeks[w] && P.CFb.weeks[w][d];
    if(JSON.stringify(yb) === JSON.stringify(yc)) continue; bump('days differing ' + (phDays.has(w + '|' + d) ? '(phantom-rename day)' : '(NOT a phantom-rename day)'));
    const ren = P.BASE.__dd.filter(r => r.w === +w && r.d === d && !cset.has(key(r)));
    let okk = names(yb).length === names(yc).length;
    if(okk){ const ib = [].concat(...yb.sections.map(s => s.items || [])), ic = [].concat(...yc.sections.map(s => s.items || []));
      for(let i = 0; i < ib.length; i++){ const a = Object.assign({}, ib[i]), b = Object.assign({}, ic[i]);
        if(a.name !== b.name){ if(!ren.some(r => r.to === a.name && r.was === b.name)){ okk = false; bump('  item name differs, not a reverted rename'); } delete a.name; delete b.name; }
        const onRev = ren.some(r => r.to === ib[i].name && r.was === ic[i].name);
        if(JSON.stringify(a) !== JSON.stringify(b)) bump('  detail diff sits on the reverted item itself: ' + onRev + (onRev ? '' : ' [' + ib[i].name + ']'));
        if(JSON.stringify(a) !== JSON.stringify(b)){ okk = false; bump('  item non-name field differs: ' + Object.keys(Object.assign({}, a, b)).filter(z => JSON.stringify(a[z]) !== JSON.stringify(b[z])).join(',')); } }
      const lb = yb.sections.map(s => { let l = s.label || ''; ren.forEach(r => { l = l.split(r.to).join(r.was); }); return l; }).join('|'), lc = yc.sections.map(s => s.label || '').join('|');
      if(lb !== lc){ okk = false; bump('  label differs beyond the reverted rename'); }
      if(JSON.stringify(yb.sections.map(s => Object.assign({}, s, {items:0, label:0}))) !== JSON.stringify(yc.sections.map(s => Object.assign({}, s, {items:0, label:0})))){ okk = false; bump('  section field differs'); }
      if(JSON.stringify(Object.assign({}, yb, {sections:0})) !== JSON.stringify(Object.assign({}, yc, {sections:0}))){ okk = false; bump('  day field differs'); } }
    else bump('  item count differs');
    bump('days differing, explained ONLY by reverting a BASE phantom rename: ' + okk); }
});
console.log('\nconfigs ' + cfgs + ' / ' + L.length + ', crashed ' + crash + ', BASE self-diff ' + selfDiff + ' of ' + (T['selfcheck rebuilds'] || 0) + ' rebuilds');
Object.keys(T).sort().forEach(k => console.log('  ' + k + ': ' + T[k]));
Object.keys(EX).sort().forEach(k => console.log('\nEX ' + k + ':\n' + EX[k]));
