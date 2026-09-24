'use strict';
// v219_chain_rebaseline.js — MEASURE (Mode B), V219 before-picture: the six cleared queue rulings applied CUMULATIVELY
// to V218 (git HEAD 485c2d5 / 44fd483, ia-version 218) in build order, plus each ruling ALONE on V218 (interaction oracle).
//   node tests/measure/v219_chain_rebaseline.js --build                 writes the step artifacts, prints anchors + HALF_MANNY
//   SCR=<dir> node tests/measure/v219_chain_rebaseline.js --sweep i n   shard worker -> SCR/v219_shard_i.json
//   SCR=<dir> node tests/measure/v219_chain_rebaseline.js --merge n     summed report
// SURGERIES, lifted verbatim (never re-derived) from:
//   step1  D167 CFs + D171 hn   v218_d167_adj_pairs.js (ADJ_CFS, SEED_S, HN1/HN2) = v220_d171_hotnext.js (HN1/HN2)
//   step2  D159 cfA             v219_d159_cfa_paths.js
//   step3  D164 cfa slice 1     v220_d164_floorpress_twice.js F.a = v220_d164_ck_link.js S1 + VIEW
//   step4  D164 slice 2         v220_d164_ck_link.js S2
//   step5  D170 cf170b          v221_d170_regional_hinge.js --cfb (POSTLEFT + A_CANDS, A_PROT legs-scoped)
//   step6  D165 cf165b          v221_d165_traces.js (A165 -> R165b)
//   step7  D166 cf166c          v222_d166_traces.js --cfc (A166r -> R166c)
// Every anchor is counted on THAT step's input (chain) and on V218 (singles); anything but 1 aborts and is the finding.
// ORACLES: the day card is its own oracle (a name on >=2 items of one card; Main name inside Leg superset A/Leg circuit or
// Pull superset B; Chest + knee sections with no /press|pushup|dips|crossover|pec deck|fly/ item), Monday-start date
// arithmetic for the calendar (D167), whole-day JSON equality for blast. No engine function is asked what a card should be;
// _isPostChain / isTrackableWeight / _pattern are read only as the RULINGS' OWN lens (D85 lens for D170, the dedupe contract
// for D167 eligibility), exactly as the source scripts read them.
// LATTICES, copied verbatim: WIDE 13,104 (v220_d165_d166_pool_twins.js = D159/D164/D165/D166), D170 extra 2,520 healthy
// NSW multi + lift-only (v221_d170 lattice()), D167 15,180 (v218_d167_adj_pairs.js). CK = WIDE shoulder/workaround (1,008,
// identical to v220_d164_ck_link LAT_CK). D159 cfA slice = WIDE ankle/protect hypertrophy bodyweight|home_basic|minimal.
const fs = require('fs'), path = require('path'), { execSync } = require('child_process');
const REPO = '/Users/CanasBangin/Desktop/TheBig6V2';
const { load, fixtures, progDigest, DAYS } = require(REPO + '/tests/harness.js');
const MODE = process.argv[2] || '--build', SCR = process.env.SCR || '/tmp/v219_scr';
const cl = o => JSON.parse(JSON.stringify(o)); const cnt = (s, a) => s.split(a).length - 1;

// ── surgeries (verbatim) ─────────────────────────────────────────────────────
const ADJ_OLD = "    for(let i=1;i<ALL_DAYS_ORDER.length;i++) out.push([w,ALL_DAYS_ORDER[i-1],w,ALL_DAYS_ORDER[i]]);\n    if(w<totalWeeks) out.push([w,'sat',w+1,'sun']);";
const ADJ_CFS = "    for(let i=1;i<_ISO_ORDER.length;i++) out.push([w,_ISO_ORDER[i-1],w,_ISO_ORDER[i],(w-1)*7+(i<6?i:0)]);\n    if(w<totalWeeks) out.push([w,'sun',w+1,'mon',(w-1)*7+6]);";
const SEED_OLD = 'seededRand(seed+wB*97+pi*13+ii)', SEED_S = 'seededRand(seed+wB*97+(pair.length>4?pair[4]:pi)*13+ii)';
const HN1_OLD = "      const _di=ALL_DAYS_ORDER.indexOf(d);\n      const _nw=_di===ALL_DAYS_ORDER.length-1?w+1:w, _ndk=ALL_DAYS_ORDER[(_di+1)%7];";
const HN1_NEW = "      const _di=_ISO_ORDER.indexOf(d);\n      const _nw=_di===_ISO_ORDER.length-1?w+1:w, _ndk=_ISO_ORDER[(_di+1)%7];";
const HN2_OLD = "      const _di=ALL_DAYS_ORDER.indexOf(d);\n      const _nw=_di===_last?(+w+1):+w, _ndk=ALL_DAYS_ORDER[(_di+1)%7];";
const HN2_NEW = "      const _di=_ISO_ORDER.indexOf(d);\n      const _nw=_di===_last?(+w+1):+w, _ndk=_ISO_ORDER[(_di+1)%7];";
const D159_OLD = 'const legIso=pick(_laLeft.length>=2?_laLeft:_laGear,2', D159_NEW = 'const legIso=pick(_laLeft.length>=2?_laLeft:(_laLeft.length?_laLeft:_laGear),2';
const A_AIF = "function applyInjuryFilter(sections,cfg){";
const VIEW = "function _injViewName(n,cfg){ if(!cfg||!cfg.injury) return n; const P=injuryPlan(cfg); if(!P||!P.swapNames||!P.swapNames[n]) return n; const g=_gearLens((cfg&&cfg.equipment)||'home_full'); if(!g(n)) return n; const to=P.swapNames[n]; const FB={'Cable pushdown':'Close-grip pushups'}; return g(to)?to:(FB[to]||to); }\n";
const S1 = [
  ["        s.forEach(function(sec){((sec&&sec.items)||[]).forEach(function(it){if(it&&it.name)t[it.name]=1;});});\n        for(let i=0;i<prefs.length;i++){ if(prefs[i]&&!t[prefs[i]]) return prefs[i]; }\n        for(let i=0;i<chestAccPool.length;i++){ if(chestAccPool[i]&&!t[chestAccPool[i]]) return chestAccPool[i]; }",
   "        s.forEach(function(sec){((sec&&sec.items)||[]).forEach(function(it){if(it&&it.name){t[it.name]=1;t[_injViewName(it.name,cfg)]=1;}});});\n        const _fr=function(n){return n&&!t[n]&&!t[_injViewName(n,cfg)];};\n        for(let i=0;i<prefs.length;i++){ if(_fr(prefs[i])) return prefs[i]; }\n        for(let i=0;i<chestAccPool.length;i++){ if(_fr(chestAccPool[i])) return chestAccPool[i]; }"],
  ["        const chestPool=chestPoolRaw.filter(x=>x!==ex.chestMain);", "        const chestPool=chestPoolRaw.filter(x=>x!==ex.chestMain&&_injViewName(x,cfg)!==_injViewName(ex.chestMain,cfg));"],
  ["        const chest2=pick(chestPool.filter(x=>x!==secondary),2,blockSeed(w)+101);", "        const chest2=pick(chestPool.filter(x=>x!==secondary&&_injViewName(x,cfg)!==_injViewName(secondary,cfg)),2,blockSeed(w)+101);"]];
const S2 = [
  ["        const bis=pick(_bicPool,2,blockSeed(w)+104);",
   "        const bis=pick(_bicPool,2,blockSeed(w)+104);\n        if(bis[1]&&_injViewName(bis[1],cfg)===_injViewName(bis[0],cfg)){ const _alt=_bicPool.filter(n=>n!==bis[0]&&_injViewName(n,cfg)!==_injViewName(bis[0],cfg)); if(_alt.length) bis[1]=pick(_alt,1,blockSeed(w)+104)[0]; }"],
  ["        const _sp=_ssPair(bis[0],bis[1],_bicPool,_bicPool);", "        const _sp=_ssPair(bis[0],bis[1],_bicPool,_bicPool.filter(n=>_injViewName(n,cfg)!==_injViewName(bis[0],cfg)));"]];
const A_CANDS = "    // Every trimmable item in the region: rank>0, has a pattern, not the protected compound.\n    const cands=[];\n";
const A_PROT  = "        if(si*100+ii===protKey) return;          // the protected heaviest compound\n";
const POSTLEFT = "    const _postLeft=out.reduce((a,s)=>a+((s&&s.items)||[]).reduce((b,it)=>b+(_isPostChain(it&&it.name)?1:0),0),0);\n";
const P170 = "        if(role==='legs' && _postLeft<=1 && _isPostChain(it.name)) return;   // cf170: the day's LAST hinge/hip_ext is not regional fodder (cf170b: legs role only)\n";
const A165 = "    const lungeSel = _slot(lungePool,2,bs+7,'lower');";
const R165b = "    let lungeSel = _slot(lungePool,2,bs+7,'lower'); if(lungeSel[0]===squatSel) lungeSel=pick(lungePool.filter(n=>n!==squatSel),2,bs+7);";
const A166r = "          {name:ex.cond[2],detail:vsets(3)+'×10'}]});";
const R166c = "          ...(ex.cond[2]===ex.backMain?[]:[{name:ex.cond[2],detail:vsets(3)+'×10'}])]});";
// step 3's VIEW helper is inserted AFTER S1 (ck_link: withView(apply(RAW,S1))); step 4 needs VIEW, which step 3 put there.
const STEPS = [
  { k:1,  id:'D167 CFs + D171', pairs:[[ADJ_OLD, ADJ_CFS], [SEED_OLD, SEED_S], [HN1_OLD, HN1_NEW], [HN2_OLD, HN2_NEW]] },
  { k:2,  id:'D159 cfA', pairs:[[D159_OLD, D159_NEW]] },
  { k:3,  id:'D164 cfa slice 1', pairs:S1.concat([[A_AIF, VIEW + A_AIF]]) },
  { k:4,  id:'D164 slice 2', pairs:S2 },
  { k:5,  id:'D170 cf170b', pairs:[[A_CANDS, POSTLEFT + A_CANDS], [A_PROT, A_PROT + P170]] },
  { k:6,  id:'D165 cf165b', pairs:[[A165, R165b]] },
  { k:7,  id:'D166 cf166c', pairs:[[A166r, R166c]] } ];
const SINGLE_PAIRS = { 2:STEPS[1].pairs, 3:STEPS[2].pairs, 4:S2.concat([[A_AIF, VIEW + A_AIF]]), 5:STEPS[4].pairs, 6:STEPS[5].pairs, 7:STEPS[6].pairs };
function apply(src, pairs, tag, log){ let out = src;
  pairs.forEach(([a, b], i) => { const n = cnt(out, a); if(log) log.push(tag + ' anchor ' + i + ' count ' + n + ' :: ' + JSON.stringify(a.slice(0, 70)));
    if(n !== 1) throw new Error('ANCHOR FAIL ' + tag + ' anchor ' + i + ' count ' + n); out = out.replace(a, () => b); });
  if(out === src) throw new Error('SURGERY NO-OP ' + tag); return out; }
const ART = { base:'/tmp/base_V218.html', s1a:'/tmp/v219_cf_step1a_d167only.html' };
for(let k = 1; k <= 7; k++) ART['s' + k] = '/tmp/v219_cf_step' + k + '.html';
for(let k = 2; k <= 7; k++) ART['g' + k] = '/tmp/v219_single' + k + '.html';
const CHAIN = ['base','s1','s2','s3','s4','s5','s6','s7'];

if(MODE === '--build'){
  const base = fs.readFileSync(ART.base, 'utf8'); const L = [];
  console.log('base ' + ART.base + ' ia-version ' + (base.match(/ia-version" content="(\d+)"/) || [])[1] + ' bytes ' + base.length);
  const put = (f, s) => { if(fs.existsSync(f)) fs.unlinkSync(f); fs.writeFileSync(f, s); };
  let cur = base; const srcs = { base };
  STEPS.forEach(st => { cur = apply(cur, st.pairs, 'CHAIN step' + st.k + ' ' + st.id, L); srcs['s' + st.k] = cur; put(ART['s' + st.k], cur); });
  put('/tmp/v219_cf_chain.html', cur);
  srcs.s1a = apply(base, STEPS[0].pairs.slice(0, 2), 'S1A D167 CFs only', L); put(ART.s1a, srcs.s1a);
  for(let k = 2; k <= 7; k++){ srcs['g' + k] = apply(base, SINGLE_PAIRS[k], 'SINGLE ' + STEPS[k - 1].id + ' on V218', L); put(ART['g' + k], srcs['g' + k]); }
  const v216 = execSync('git -C ' + REPO + ' show 3dc0146:index.html', { maxBuffer:1 << 27 }).toString();
  put('/tmp/v219_V216_cfs_hn.html', apply(v216, STEPS[0].pairs, 'V216 CFs+hn (g217 like-with-like baseline)', L));
  L.forEach(l => console.log(l));
  const CLAUSE = "  if(_auxFamily(name)==='core') return 0;\n";
  const hm = (X, off) => { X.window.__DELOAD_OFF = !!off; try { return progDigest(X.buildProgram(cl(fixtures.HALF_MANNY))); } finally { X.window.__DELOAD_OFF = false; } };
  { const A = load(ART.base), B = load(ART.base); console.log('SELF base==base: ' + (hm(A) === hm(B) && hm(A) === hm(A)) + ' ' + hm(A)); }
  Object.keys(ART).forEach(k => { const s = srcs[k] || fs.readFileSync(ART[k], 'utf8'); const X = load(ART[k]);
    const tmp = path.join(SCR, 'coreoff_' + k + '.html'); if(fs.existsSync(tmp)) fs.unlinkSync(tmp); fs.writeFileSync(tmp, s.replace(CLAUSE, ''));
    console.log('HALF_MANNY ' + k.padEnd(4) + ' v' + X.version + ' raw ' + hm(X) + ' deload-off ' + hm(X, true) + ' core-off ' + (cnt(s, CLAUSE) === 1 ? hm(load(tmp)) : 'CLAUSE count ' + cnt(s, CLAUSE)) + '  ' + ART[k]); });
  process.exit(0);
}

// ── lattices (verbatim) ──────────────────────────────────────────────────────
const GOALS = [['run_5k',{}],['run_half',{}],['run_pace_goal',{targetDist:'1.5',targetMins:'10',targetSecs:'0'}],['run_base',{}],['run_10k',{}],['run_marathon',{}]];
const FOC = ['hypertrophy','strength','fatloss','balanced','support_strength','support_athletic','support_prevention'];
const EXPS = ['beginner','intermediate','advanced'], AGES = ['18-35','36-54','55+'], RESTS2 = [['sun','wed'],['sat','sun']];
const SEEDS = [76308, 1234, 4242, 9001, 31337, 555, 8086, 20260];
const REG = ['shoulder','elbow','lowback','hip','knee','ankle'], ITIER = ['workaround','protect'];
function mk(eq, gi, f, exp, age, si, inj){ const [g, x] = GOALS[gi % GOALS.length];
  const c = { name:'M', primaryPath: /^support_/.test(f) ? 'event' : 'goal', cardioTypes:['run'], cardioGoals:{ run: Object.assign({ id:g, label:g, mileBestMins:'8', mileBestSecs:'30', baselineDist:'3', baseline:'3mi' }, x) },
    eventTargeted:false, liftingFocus:f, experience:exp, ageBracket:age, equipment:eq, unit:'lbs', restDays: RESTS2[si % 2].slice(), days: DAYS.slice(), bench:135, squat:155, deadlift:185, seed: SEEDS[si] };
  if(inj) c.injury = inj; return c; }
const TIERS6 = ['commercial','crossfit','home_full','home_basic','minimal','bodyweight'];
const INJ = [null]; REG.forEach(r => ITIER.forEach(t => INJ.push({ region:r, tier:t })));
const U = [];
for(const eq of TIERS6) INJ.forEach((inj, ii) => FOC.forEach((f, fi) => EXPS.forEach((e, ei) => [0,1,2,3].forEach(si => [0,1].forEach(ri => {
  const c = mk(eq, ii + fi + ei + si, f, e, AGES[(fi + si) % 3], si, inj); c.restDays = RESTS2[ri].slice();
  U.push({ lat:'W', eq, ik: inj ? inj.region + '/' + inj.tier : 'healthy', f, c }); })))));
{ const TI = TIERS6, EX = EXPS, RS = [['sun','wed'],['sat','sun']], SD = [76308, 4242];
  const MIX = [['pace+bike','run_pace_goal',{bike:1}],['pace+swim','run_pace_goal',{swim:1}],['pace+bike+swim','run_pace_goal',{bike:1,swim:1}],['base+bike','run_base',{bike:1}]];
  const base = (eq, f, e, r, s) => ({ name:'M', primaryPath: /^support_/.test(f) ? 'event' : 'goal', eventTargeted:false, liftingFocus:f, experience:e, ageBracket:'18-35', equipment:eq, unit:'lbs', restDays:r.slice(), days:DAYS.slice(), bench:135, squat:155, deadlift:185, seed:s });
  TI.forEach(eq => FOC.forEach(f => EX.forEach(e => RS.forEach(r => SD.forEach(s => {
    MIX.forEach(([k, g, o]) => { const c = base(eq, f, e, r, s); c.cardioTypes = ['run']; c.cardioGoals = { run:{ id:g, label:g, mileBestMins:'8', mileBestSecs:'30', baselineDist:'3', baseline:'3mi', targetDist:'1.5', targetMins:'11', targetSecs:'0', paceUnit:'mi' } };
      if(o.bike){ c.cardioTypes.push('bike'); c.cardioGoals.bike = { id:'bike_base', label:'Bb', baselineDist:'10', baseline:'10mi' }; }
      if(o.swim){ c.cardioTypes.push('swim'); c.cardioGoals.swim = { id:'swim_base', label:'Sb', baselineDist:'1000', baseline:'1000m' }; }
      U.push({ lat:'X', eq, ik:'healthy', f, c }); });
    const c = base(eq, f, e, r, s); c.primaryPath = 'lift'; c.cardioTypes = []; c.cardioGoals = {}; U.push({ lat:'X', eq, ik:'healthy', f, c }); })))));
}
{ const WD = ['sun','mon','tue','wed','thu','fri','sat'];
  const STAND = {name:'M',primaryPath:'goal',eventTargeted:false,cardioTypes:['run'],cardioGoals:{run:{id:'run_pace_goal',label:'x',mileBestMins:'8',mileBestSecs:'15',mileBestSrc:{kind:'entered'},targetDist:'1.5',targetMins:'11',targetSecs:'0',paceUnit:'mi'}},
    liftingFocus:'balanced',experience:'intermediate',ageBracket:'18-35',equipment:'home_full',unit:'lbs',restDays:['sun','wed'],days:WD.slice(),bench:185,squat:255,deadlift:315,startDate:'2026-09-21',seed:24865};
  const FOC6 = ['balanced','hypertrophy','strength','support_athletic','support_prevention','support_strength'];
  const EQ = ['crossfit','commercial','home_full','home_basic','bodyweight'], EXP = ['beginner','intermediate','advanced'], AGE = ['18-35','36-54','55+'];
  const RESTS = [['sun','wed'],['sat','sun'],['sun'],['mon','wed','fri'],['tue','thu','sun']];
  const P = x => U.push(Object.assign({ lat:'C', eq:x.c.equipment, ik: x.c.injury ? x.c.injury.region + '/' + x.c.injury.tier : 'healthy', f:x.c.liftingFocus }, x));
  const PLANS = ['run_5k','run_10k','run_half','run_marathon'], RACED = ['2026-12-06','2027-01-17','2027-03-28'], MILE = [['7','30'],['8','15'],['10','30'],['12','0']];
  const EXTRAS = [{bike:'bike_base'},{swim:'swim_base'},{bike:'bike_ftp'},{swim:'swim_mile'},{bike:'bike_base',swim:'swim_base'}];
  const nrc = (plan, o, i) => { const goals = {run:{id:plan,label:plan,mileBestMins:MILE[i%4][0],mileBestSecs:MILE[i%4][1],baselineDist:String([3,5,8][i%3]),baseline:[3,5,8][i%3]+'mi'}}, types = ['run'];
    if(o.ex && o.ex.bike){ types.push('bike'); goals.bike = {id:o.ex.bike,label:o.ex.bike,baselineDist:'10',baseline:'10mi'}; }
    if(o.ex && o.ex.swim){ types.push('swim'); goals.swim = {id:o.ex.swim,label:o.ex.swim,baselineDist:'1000',baseline:'1000m'}; }
    return Object.assign(cl(fixtures.HALF_MANNY), {name:'M',primaryPath:o.dated?'event':'fitness',cardioTypes:types,cardioGoals:goals,eventTargeted:!!o.dated,raceDate:o.dated?RACED[i%3]:'',startDate:'2026-09-21',liftingFocus:o.f,experience:o.e,ageBracket:AGE[i%3],equipment:o.q,restDays:o.r.slice(),seed:76308}); };
  let ii = 0;
  for(const plan of PLANS) for(const e of EXP) for(const r of RESTS) for(const q of EQ) for(const f of FOC6) for(const dated of [true,false]) P({mix:'NRC solo', c:nrc(plan, {e,r,q,f,dated}, ii++)});
  for(const plan of PLANS) for(const ex of EXTRAS) for(const f of FOC6) for(const q of EQ) P({mix:'NRC multi', c:nrc(plan, {ex,e:EXP[ii%3],r:RESTS[ii%2],q,f,dated:ii%2===0}, ii++)});
  for(const g of ['run_pace_goal','run_mile_time','run_15_under10','run_base']) for(const mm of [['8','15'],['12','0']]) for(const f of FOC6) for(const q of EQ) for(const r of RESTS) for(const e of EXP){
    const c = cl(STAND); c.cardioGoals.run.id = g; c.cardioGoals.run.mileBestMins = mm[0]; c.cardioGoals.run.mileBestSecs = mm[1]; c.liftingFocus = f; c.equipment = q; c.restDays = r.slice(); c.experience = e; P({mix:'NSW solo', c}); }
  for(const q of EQ) for(let si = 0; si < 8; si++) for(const rg of ['shoulder','elbow','lowback','hip','knee','ankle']) for(const t of ['workaround','protect']){ const [g, x] = GOALS[si % 6];
    P({mix:'injury', c:{ name:'M', primaryPath:'goal', cardioTypes:['run'], cardioGoals:{ run: Object.assign({ id:g, label:g, mileBestMins:'8', mileBestSecs:'30', baselineDist:'3', baseline:'3mi' }, x) }, eventTargeted:false, liftingFocus:'hypertrophy', experience:EXP[si % 3], ageBracket:AGE[si % 3], equipment:q, unit:'lbs', restDays:[['sun','wed'],['sat','sun']][si % 2].slice(), days:WD.slice(), bench:135, squat:155, deadlift:185, seed:SEEDS[si], injury:{region:rg,tier:t} }}); }
  const MIX = [['pace+bike','run_pace_goal',{bike:1}],['pace+swim','run_pace_goal',{swim:1}],['pace+bike+swim','run_pace_goal',{bike:1,swim:1}],['base+bike','run_base',{bike:1}]];
  for(const [mk2, g, o] of MIX) for(const mm of [['8','15'],['12','0']]) for(const f of FOC6.concat(['fatloss'])) for(const q of EQ) for(const r of RESTS) for(const e of EXP){
    const c = cl(STAND); c.cardioGoals.run.id = g; c.cardioGoals.run.mileBestMins = mm[0]; c.cardioGoals.run.mileBestSecs = mm[1]; c.liftingFocus = f; c.equipment = q; c.restDays = r.slice(); c.experience = e;
    if(o.bike){ c.cardioTypes.push('bike'); c.cardioGoals.bike = {id:'bike_base',label:'Bb',baselineDist:'10',baseline:'10mi'}; }
    if(o.swim){ c.cardioTypes.push('swim'); c.cardioGoals.swim = {id:'swim_base',label:'Sb',baselineDist:'1000',baseline:'1000m'}; }
    P({mix:'NSW multi ' + mk2, c}); }
  const ALL = ['sun','mon','tue','wed','thu','fri','sat'], mb = {mileBestMins:'8', mileBestSecs:'15', mileBestSrc:{kind:'entered'}}; const INJ4 = [null, null, {region:'knee',tier:'workaround'}, {region:'elbow',tier:'workaround'}]; let j = 0;
  for(const eq of ['commercial','crossfit','home_full','home_basic','bodyweight']) for(const fo of ['strength','hypertrophy','balanced','support_prevention','support_athletic','fatloss']) for(const ex of EXP) for(const rs of [['sun','wed'], ['sat','sun'], ['mon','thu','sun'], ['sun']]) for(const seed of [24865, 76308, 99991]){ const inj = INJ4[(j++) % 4];
    const c = {name:'GK', primaryPath:'event', eventTargeted:false, raceDate:'', cardioTypes:['run','bike'], cardioGoals:{run:{id:'run_pace_goal', label:'P', ...mb, targetDist:'1.5', targetMins:'11', targetSecs:'0', paceUnit:'mi'}, bike:{id:'bike_base', label:'Bb'}}, liftingFocus:fo, experience:ex, ageBracket:'18-35', equipment:eq, unit:'lbs', restDays:rs, days:ALL.slice(), bench:185, squat:255, deadlift:315, startDate:'2026-10-05', seed};
    if(inj) c.injury = inj; P({mix:'gk pace+bike', c}); }
  const RS2 = [[], ['mon'], ['wed'], ['fri'], ['sat'], ['mon','fri'], ['wed','sat'], ['tue','fri'], ['mon','thu']];
  for(const [g, nrcp] of [['run_half', true], ['run_pace_goal', false]]) for(const r of RS2) for(const f of FOC6) for(const q of EQ) for(const e of EXP){
    const c = nrcp ? Object.assign(cl(fixtures.HALF_MANNY), {name:'M', primaryPath:'fitness', eventTargeted:false, raceDate:'', startDate:'2026-09-21', cardioTypes:['run'], cardioGoals:{run:{id:g,label:g,mileBestMins:'8',mileBestSecs:'15',baselineDist:'5',baseline:'5mi'}}, liftingFocus:f, experience:e, equipment:q, restDays:r.slice(), seed:76308}) : Object.assign(cl(STAND), {liftingFocus:f, experience:e, equipment:q, restDays:r.slice()});
    P({mix:'rest sweep ' + (nrcp ? 'NRC half' : 'NSW pace'), c}); }
}
const LATN = { W:'WIDE', X:'D170extra', C:'D167' };

// ── card oracles ─────────────────────────────────────────────────────────────
const clean = n => String(n == null ? '' : n).replace(/<svg[\s\S]*?<\/svg>\s*/g, '').replace(/<[^>]+>/g, '').trim();
const stem = s => String(s.label || (s.coreHeader ? '{core}' : '(none)')).replace(/\s*[—-]\s.*$/, '');
const live = d => (d && !d.rest && d.sections || []).filter(s => (s.items || []).length);
const CHEST = /press|pushup|dips|crossover|pec deck|fly/i;
const ISO = ['mon','tue','wed','thu','fri','sat','sun'], OFF = {mon:0,tue:1,wed:2,thu:3,fri:4,sat:5,sun:6};
const isMainSec = s => /^(main|primer|power)/i.test((s && s.label) || '');
function cardInfo(day, H){ const L = live(day); const o = { live:L.length > 0, dup:[], li:0, c165:0, c166:0, ck:0, ckNo:0, post:0, items:0, secs:L.length };
  if(!L.length) return o; const where = {};
  L.forEach(s => s.items.forEach(it => { o.items++; const k = clean(it.name).toLowerCase(); if(k) (where[k] = where[k] || []).push(stem(s)); if(H.PC(it && it.name)) o.post++; }));
  o.dup = Object.keys(where).filter(k => where[k].length >= 2).map(k => [k, where[k].slice().sort().join(' + ')]);
  if(L.some(s => /^Leg isolation/.test(String(s.label || '')) && s.items.some(i => where[clean(i.name).toLowerCase()].length >= 2))) o.li = 1;
  const main = L.find(s => stem(s) === 'Main'); const mn = main ? clean(main.items[0].name).toLowerCase() : null;
  if(mn){ if(L.some(s => /^(Leg superset A|Leg circuit)$/.test(stem(s)) && s.items.some(i => clean(i.name).toLowerCase() === mn))) o.c165 = 1;
    if(L.some(s => stem(s) === 'Pull superset B' && s.items.some(i => clean(i.name).toLowerCase() === mn))) o.c166 = 1; }
  L.forEach(s => { if(/^Chest \+ knee/.test(String(s.label || ''))){ o.ck++; if(!s.items.some(i => CHEST.test(clean(i.name)))) o.ckNo++; } });
  return o; }
const sig = d => live(d).map(s => s.label + '[' + s.items.map(i => clean(i.name)).join(', ') + ']').join(' | ');

if(MODE === '--sweep'){
  const K = +process.argv[3], N = +process.argv[4]; const KEYS = Object.keys(ART); const X = {}; KEYS.forEach(k => X[k] = load(ART[k]));
  const H = { PC: X.base.eval('_isPostChain'), TW: X.base.eval('isTrackableWeight'), PAT: X.base.eval('_pattern') };
  const IP = X.base.eval('injuryPlan'), FB = X.base.eval('typeof SWAP_GEAR_FALLBACK!=="undefined"?SWAP_GEAR_FALLBACK:{}');
  const TGT = {}; ['shoulder','elbow'].forEach(r => { const s = new Set(); TIERS6.forEach(eq => { const p = IP({ injury:{region:r, tier:'workaround'}, equipment:eq }); Object.values((p && p.swapNames) || {}).forEach(v => { s.add(String(v).toLowerCase()); if(FB[v]) s.add(String(FB[v]).toLowerCase()); }); }); TGT[r + '/workaround'] = s; });
  const T = {}, EX = {}; const bump = (k, n = 1) => { if(n) T[k] = (T[k] || 0) + n; }; const ex = (k, s) => { (EX[k] = EX[k] || []); if(EX[k].length < 4) EX[k].push(s); };
  const strip = p => { const o = Object.assign({}, p); delete o.id; delete o.created; delete o.startDate; delete o.weeks; delete o.cfg; return JSON.stringify(o); };
  const tag = x => (LATN[x.lat] + ' ' + (x.mix || '') + ' ' + x.eq + ' ' + x.ik + ' ' + x.f + ' ' + x.c.experience + ' ' + (x.c.ageBracket || '') + ' seed ' + x.c.seed + ' rest ' + x.c.restDays.join('/') + ' goal ' + Object.keys(x.c.cardioGoals || {}).map(k => x.c.cardioGoals[k].id).join('+')).replace(/\s+/g, ' ');
  for(let i = K; i < U.length; i += N){ const x = U[i]; const LN = LATN[x.lat]; bump('cfgs | ' + LN);
    const P = {}; let crash = false;
    for(const k of KEYS){ try { P[k] = X[k].buildProgram(cl(x.c)); } catch(e){ bump('CRASH | ' + k + ' | ' + LN); ex('CRASH ' + k, tag(x) + ' :: ' + e.message); crash = true; } }
    if(crash) continue;
    const dk = []; Object.keys(P.base.weeks).forEach(w => DAYS.forEach(d => { if(P.base.weeks[w] && P.base.weeks[w][d] !== undefined) dk.push(w + '|' + d); }));
    const J = {}, C = {}; KEYS.forEach(k => { J[k] = {}; C[k] = {}; dk.forEach(q => { const [w, d] = q.split('|'); const y = P[k].weeks[w] && P[k].weeks[w][d]; J[k][q] = JSON.stringify(y); C[k][q] = cardInfo(y, H); }); });
    const TOP = {}; KEYS.forEach(k => TOP[k] = strip(P[k]));
    // per-artifact census
    const shw = x.ik === 'shoulder/workaround', elw = x.ik === 'elbow/workaround';
    for(const k of KEYS){ const pre = k + ' | ' + LN + ' | ';
      dk.forEach(q => { const c = C[k][q]; if(!c.live) return;
        if(c.dup.length){ bump(pre + 'dup days (any name on >=2 items)'); bump(pre + 'dup days by tier ' + x.eq); }
        if(c.li) bump(pre + 'D159 Leg isolation holds an on-card name');
        if(x.lat === 'W' && x.ik === 'ankle/protect' && x.f === 'hypertrophy' && /bodyweight|home_basic|minimal/.test(x.eq) && c.li) bump(pre + 'D159 cfA-slice Leg isolation dup');
        if(shw || elw){ const hit = c.dup.filter(([n]) => TGT[x.ik].has(n)); if(hit.length){ bump(pre + 'D164 swap-target dup days ' + x.ik); hit.forEach(([n, w]) => bump(pre + 'D164 ' + x.ik + ' dup ' + n + ' :: ' + w)); } }
        if(shw && c.ck){ bump(pre + 'D164 CK sections', c.ck); bump(pre + 'D164 CK sections with no chest movement', c.ckNo); }
        if(c.c165) bump(pre + 'D165 twin days (Main in Leg superset A/Leg circuit)'); if(c.c166) bump(pre + 'D166 twin days (Main in Pull superset B)');
        if(c.post === 0 && c.items) bump(pre + 'zero-posterior live days');
      });
      if(x.lat === 'C'){ const cal = {}; Object.keys(P[k].weeks).forEach(w => ISO.forEach(d => { if(P[k].weeks[w]) cal[(w - 1) * 7 + OFF[d]] = { w:+w, d, y:P[k].weeks[w][d] }; }));
        Object.keys(cal).map(Number).forEach(ix => { const A = cal[ix], B = cal[ix + 1]; if(!A || !B || !live(A.y).length && !(A.y && !A.y.rest && Array.isArray(A.y.sections)) ) return;
          if(!(A.y && !A.y.rest && Array.isArray(A.y.sections)) || !(B.y && !B.y.rest && Array.isArray(B.y.sections))) return;
          const pt = A.d === 'sat' ? 'sat>sun' : A.d === 'sun' ? 'sun>mon' : 'interior';
          const nA = new Set([].concat(...A.y.sections.map(s => (s.items || []).map(i => String(i.name || '').toLowerCase()))));
          B.y.sections.forEach(sec => (sec.items || []).forEach(it => { const n = String(it.name || '').toLowerCase(); if(!n || !nA.has(n)) return; if(!isMainSec(sec) && H.TW(it.name) && H.PAT(it.name)) bump(pre + 'D167 eligible calendar repeats ' + pt); })); }); }
    }
    // step diffs
    const diffPair = (a, b, label) => { let dd = 0; const pre = label + ' | ' + LN + ' | ';
      dk.forEach(q => { if(J[a][q] === J[b][q]) return; dd++; const [w, d] = q.split('|'); const ca = C[a][q], cb = C[b][q]; const ya = P[a].weeks[w][d], yb = P[b].weeks[w][d];
        bump(pre + 'days moved'); bump(pre + 'days moved by weekday ' + d); bump(pre + 'days moved by tier ' + x.eq); bump(pre + 'days moved by cell ' + x.ik);
        if(!!(ya && ya.rest) !== !!(yb && yb.rest)) bump(pre + 'LOSS rest flag differs');
        if(JSON.stringify(ya && ya.cardio) !== JSON.stringify(yb && yb.cardio)) bump(pre + 'cardio differs');
        if(cb.secs < ca.secs) bump(pre + 'live sections lost'); if(cb.secs > ca.secs) bump(pre + 'live sections gained');
        if(cb.items < ca.items) bump(pre + 'days with fewer items'); if(cb.items > ca.items) bump(pre + 'days with more items');
        if(ca.dup.length && !cb.dup.length) bump(pre + 'dup day fixed'); if(!ca.dup.length && cb.dup.length){ bump(pre + 'dup day introduced'); ex(label + ' dup introduced', tag(x) + ' W' + w + ' ' + d + ' :: ' + cb.dup.map(z => z.join(' @ ')).join('; ')); }
        if(ca.post === 0 && cb.post > 0) bump(pre + 'zero-posterior day rescued, title ' + String(yb.title).replace(/\s*\(.*$/, ''));
        if(ca.post > 0 && cb.post === 0) bump(pre + 'posterior lost to zero, title ' + String(yb.title).replace(/\s*\(.*$/, ''));
        bump(pre + 'moved title ' + String(yb && yb.title || '').replace(/\s*\(.*$/, ''));
        // detail-only / superset-only shape
        const nd = y => JSON.stringify(y, (kk, v) => kk === 'detail' ? undefined : v), ns = y => JSON.stringify(y, (kk, v) => (kk === 'superset' && !v) ? undefined : v);
        if(nd(ya) === nd(yb)) bump(pre + 'shape: detail text only'); else if(ns(ya) === ns(yb)) bump(pre + 'shape: superset undefined->false only');
        if(+w === P[b].totalWeeks) bump(pre + 'in final week');
        if(label === 'step2 D159'){ if(!live(ya).some(s => /^Leg isolation/.test(s.label)) && live(yb).some(s => /^Leg isolation/.test(s.label))) bump(pre + 'class A Leg isolation gained ' + sig({sections:live(yb).filter(s => /^Leg isolation/.test(s.label))})); }
        if(label === 'step7 D166'){ const oth = (L) => L.filter(s => stem(s) !== 'Pull superset B').map(s => s.label + ':' + s.items.length).join('|'); const la = live(ya), lb = live(yb);
          const gainOther = lb.some(s => { if(stem(s) === 'Pull superset B') return false; const t = la.find(z => z.label === s.label); return t && s.items.length > t.items.length; });
          if(gainOther){ bump(pre + 'class C: a non-Pull-B section holds more items'); ex('step7 class C', tag(x) + ' W' + w + ' ' + d + '\n      before: ' + sig(ya) + '\n      after:  ' + sig(yb)); } }
        if(label === 'step5 D170' && /push/i.test(String(yb.title)) && /light/i.test(String(yb.title))) { bump(pre + 'Push (light) day moved'); ex('step5 Push light moved', tag(x) + ' W' + w + ' ' + d); }
      });
      if(dd || TOP[a] !== TOP[b]) bump(pre + 'programs moved');
      if(JSON.stringify(P[a]._swapUniverse || null) !== JSON.stringify(P[b]._swapUniverse || null) || JSON.stringify(P[a]._swapUniverseByKey || null) !== JSON.stringify(P[b]._swapUniverseByKey || null)) bump(pre + 'swap universe differs');
      if(TOP[a] !== TOP[b]) bump(pre + 'top-level non-clock field differs'); };
    diffPair('base', 's1', 'step1 D167+D171'); diffPair('base', 's1a', 'step1a D167 CFs alone'); diffPair('s1a', 's1', 'step1b D171 on top of CFs');
    diffPair('s1', 's2', 'step2 D159'); diffPair('s2', 's3', 'step3 D164s1'); diffPair('s3', 's4', 'step4 D164s2'); diffPair('s4', 's5', 'step5 D170'); diffPair('s5', 's6', 'step6 D165'); diffPair('s6', 's7', 'step7 D166');
    diffPair('base', 's7', 'NET V218->chain');
    for(let k = 2; k <= 7; k++) diffPair('base', 'g' + k, 'single' + k + ' ' + STEPS[k - 1].id + ' alone on V218');
    // interaction: chain day vs singles
    const SG = ['s1','g2','g3','g4','g5','g6','g7']; let pm = false;
    dk.forEach(q => { const chg = SG.filter(k => J[k][q] !== J.base[q]); const cc = J.s7[q] !== J.base[q];
      const [w, d] = q.split('|'); const pre = 'INTER | ' + LN + ' | ';
      if(!cc && !chg.length) return;
      if(cc && !chg.length){ bump(pre + 'EMERGENT: chain moves, no single moves'); ex('EMERGENT', tag(x) + ' W' + w + ' ' + d + '\n      V218:  ' + sig(P.base.weeks[w][d]) + '\n      chain: ' + sig(P.s7.weeks[w][d])); return; }
      if(!cc && chg.length){ bump(pre + 'CANCELLED: a single moves, chain equals V218 [' + chg.join(',') + ']'); ex('CANCELLED', tag(x) + ' W' + w + ' ' + d + ' singles ' + chg.join(',')); return; }
      if(chg.length === 1){ if(J.s7[q] === J[chg[0]][q]) bump(pre + 'clean: one single, chain == that single [' + chg[0] + ']');
        else { bump(pre + 'MODIFIED: one single moves, chain differs from it [' + chg[0] + ']'); ex('MODIFIED ' + chg[0], tag(x) + ' W' + w + ' ' + d + '\n      V218:   ' + sig(P.base.weeks[w][d]) + '\n      single: ' + sig(P[chg[0]].weeks[w][d]) + '\n      chain:  ' + sig(P.s7.weeks[w][d])); } return; }
      bump(pre + 'COMPOSED: ' + chg.length + ' singles move the day [' + chg.join(',') + ']'); if(!SG.some(k => J[k][q] === J.s7[q])) bump(pre + 'COMPOSED and chain equals none of them'); ex('COMPOSED ' + chg.join(','), tag(x) + ' W' + w + ' ' + d);
    });
  }
  const f = path.join(SCR, 'v219_shard_' + K + '.json'); if(fs.existsSync(f)) fs.unlinkSync(f); fs.writeFileSync(f, JSON.stringify({ T, EX, n:U.length }));
  console.log('shard ' + K + '/' + N + ' done'); process.exit(0);
}
if(MODE === '--merge'){ const N = +process.argv[3]; const T = {}, EX = {}; let n = 0;
  for(let s = 0; s < N; s++){ const f = path.join(SCR, 'v219_shard_' + s + '.json'); if(!fs.existsSync(f)){ console.log('MISSING SHARD ' + s + ' -> measurement FAILED'); process.exit(2); }
    const o = JSON.parse(fs.readFileSync(f, 'utf8')); n = o.n; Object.keys(o.T).forEach(k => T[k] = (T[k] || 0) + o.T[k]); Object.keys(o.EX).forEach(k => { EX[k] = (EX[k] || []).concat(o.EX[k]).slice(0, 6); }); }
  console.log('union lattice ' + n + ' configs'); Object.keys(T).sort().forEach(k => console.log('  ' + k + ': ' + T[k]));
  Object.keys(EX).sort().forEach(k => console.log('\nEX ' + k + '\n    ' + EX[k].join('\n    '))); process.exit(0); }
