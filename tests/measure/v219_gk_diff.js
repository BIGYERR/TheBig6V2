'use strict';
// v219_gk_diff.js — GATEKEEPER differential. Lattice construction copied from v219_chain_rebaseline.js (inputs only);
// every oracle below is this file's own. node v219_gk_diff.js <shard> <n>  -> /tmp/v219_gk/shard_<i>.json
const fs=require('fs'); const REPO='/Users/CanasBangin/Desktop/TheBig6V2';
const { load, fixtures, DAYS } = require(REPO+'/tests/harness.js');
const cl=o=>JSON.parse(JSON.stringify(o));
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
const SH=+process.argv[2], NS=+process.argv[3];
const cnt=(s,a)=>s.split(a).length-1;
const cand=fs.readFileSync(REPO+'/index.html','utf8');
function rev(src,pairs){let o=src;pairs.forEach(([a,b])=>{if(cnt(o,a)!==1)throw new Error('anchor '+cnt(o,a)+' '+a.slice(0,60));o=o.replace(a,()=>b);});if(o===src)throw new Error('noop');return o;}
const XR_SRC=rev(cand,[["    for(let i=1;i<_ISO_ORDER.length;i++) out.push([w,_ISO_ORDER[i-1],w,_ISO_ORDER[i],(w-1)*7+(i<6?i:0)]);\n    if(w<totalWeeks) out.push([w,'sun',w+1,'mon',(w-1)*7+6]);","    for(let i=1;i<ALL_DAYS_ORDER.length;i++) out.push([w,ALL_DAYS_ORDER[i-1],w,ALL_DAYS_ORDER[i]]);\n    if(w<totalWeeks) out.push([w,'sat',w+1,'sun']);"],['seededRand(seed+wB*97+(pair.length>4?pair[4]:pi)*13+ii)','seededRand(seed+wB*97+pi*13+ii)']]);
const UH_SRC=rev(cand,[["      const _di=_ISO_ORDER.indexOf(d);\n      const _nw=_di===_ISO_ORDER.length-1?w+1:w, _ndk=_ISO_ORDER[(_di+1)%7];","      const _di=ALL_DAYS_ORDER.indexOf(d);\n      const _nw=_di===ALL_DAYS_ORDER.length-1?w+1:w, _ndk=ALL_DAYS_ORDER[(_di+1)%7];"]]);
fs.mkdirSync('/tmp/v219_gk',{recursive:true});
fs.writeFileSync('/tmp/v219_gk/xr.html',XR_SRC); fs.writeFileSync('/tmp/v219_gk/uh.html',UH_SRC);
const A={base:'/tmp/base_V218.html',cand:REPO+'/index.html',xr:'/tmp/v219_gk/xr.html',uh:'/tmp/v219_gk/uh.html'};
for(let k=1;k<=6;k++)A['s'+k]='/tmp/v219_cf_step'+k+'.html'; A.g1='/tmp/v219_cf_step1.html';
for(let k=2;k<=7;k++)A['g'+k]='/tmp/v219_single'+k+'.html';
const IA={}; for(const k in A) IA[k]=load(A[k]);
const strip=p=>JSON.parse(JSON.stringify(p,(k,v)=>(k==='id'||k==='created')?undefined:v));
const T={}, EX=[]; const bump=(k,n=1)=>T[k]=(T[k]||0)+n; const ex=(k,s)=>{bump('EX#'+k); if((T['EX#'+k])<=40) EX.push(k+' :: '+s);};
const LIVE=d=>(d&&!d.rest&&d.sections||[]).filter(s=>(s.items||[]).length);
const names=d=>LIVE(d).flatMap(s=>s.items.map(i=>i.name));
const shape=d=>JSON.stringify(LIVE(d).map(s=>(s.items||[]).length));
const labels=d=>(d&&d.sections||[]).map(s=>String(s.label||s.coreHeader||''));
const noRpe=s=>String(s).replace(/RPE\s*[\d.–\-]+/g,'RPE#');
// D171 text-only: same section/label/item names in order; details differ only in RPE text
function rpeOnly(a,b){ if(!a||!b||!a.sections||!b.sections) return false; if(a.sections.length!==b.sections.length) return false;
  let diff=false; for(let i=0;i<a.sections.length;i++){ const x=a.sections[i], y=b.sections[i]; const xs=cl(x), ys=cl(y); const xi=xs.items||[], yi=ys.items||[];
    if(xi.length!==yi.length) return false; for(let j=0;j<xi.length;j++){ if(xi[j].name!==yi[j].name) return false; if(xi[j].detail!==yi[j].detail){ diff=true; if(noRpe(xi[j].detail)!==noRpe(yi[j].detail)) return false; } xi[j].detail=yi[j].detail='';}
    if(JSON.stringify(xs)!==JSON.stringify(ys)) return false; }
  const ao=cl(a), bo=cl(b); delete ao.sections; delete bo.sections; return diff && JSON.stringify(ao)===JSON.stringify(bo); }
// rename-only: same sections, same item counts, names differ, nothing else differs besides names/labels
function renameOnly(a,b){ if(!a||!b) return false; if(shape(a)!==shape(b)) return false; if(JSON.stringify(labels(a).map((l,i)=>l.replace(/—.*/,'')))!==JSON.stringify(labels(b).map(l=>l.replace(/—.*/,'')))) return false;
  const ao=cl(a), bo=cl(b); const na=names(a), nb=names(b); return JSON.stringify(na)!==JSON.stringify(nb); }
const HINGE=/deadlift|\bswing|good morning|hip thrust|glute bridge|pull-through|\brdl\b|back extension|hyperextension|nordic|kettlebell swing/i;
const ORD=['mon','tue','wed','thu','fri','sat','sun'];
const U2=U.filter((_,i)=>i%NS===SH);
const CL=['D167','D171','D159','D164s1','D164s2','D170','D165','D166'];
let nIdent=0;
for(let ui=0; ui<U.length; ui++){ if(ui%NS!==SH) continue; const x=U[ui];
  const P={}; let crash=false;
  for(const k in IA){ if(k==='xr' && x.lat!=='C') continue; try{ P[k]=strip(IA[k].buildProgram(cl(x.c))); }catch(e){ bump('CRASH '+k); ex('CRASH', k+' '+ui+' '+e.message); crash=true; } }
  if(crash) continue;
  if(ui%4===0){ nIdent++; const b2=strip(IA.base.buildProgram(cl(x.c))); if(JSON.stringify(b2)!==JSON.stringify(P.base)){bump('IDENT base FAIL'); ex('IDENT',ui);} const c2=strip(IA.cand.buildProgram(cl(x.c))); if(JSON.stringify(c2)!==JSON.stringify(P.cand)) bump('IDENT cand FAIL'); }
  bump('configs'); bump('configs '+x.lat);
  if(JSON.stringify(P.base._swapUniverse||null)!==JSON.stringify(P.cand._swapUniverse||null)||JSON.stringify(P.base._swapUniverseByKey||null)!==JSON.stringify(P.cand._swapUniverseByKey||null)) bump('SWAPUNIVERSE diff');
  if(JSON.stringify(P.uh)!==JSON.stringify(P.cand)) { bump('UNDEFENDED hotNext revert moves output (configs)'); ex('UH',ui); }
  const W=Object.keys(P.base.weeks||{}).map(Number).sort((a,b)=>a-b); const last=W[W.length-1];
  const sunTrain=!(x.c.restDays||[]).includes('sun'); const ik=x.ik;
  const day=(k,w,d)=>P[k].weeks&&P[k].weeks[w]&&P[k].weeks[w][d];
  const J=o=>JSON.stringify(o===undefined?null:o);
  // R6
  if(x.lat==='W'&&ik==='elbow/workaround') for(const k of ['base','s3','s4','cand']) W.forEach(w=>ORD.forEach(d=>{const y=day(k,w,d); LIVE(y).forEach(s=>{ if(/^Biceps/.test(String(s.label||''))&&s.items.length===1) bump('R6 bic1 '+k);});}));
  // in-chain D167 (lat C): cand vs xr
  if(x.lat==='C'){ let prog=false; const ev={};
    W.forEach(w=>ORD.forEach(d=>{ const a=day('xr',w,d), b=day('cand',w,d); if(J(a)===J(b)) return; prog=true; ev[w+d]=1; bump('INCHAIN days'); bump('INCHAIN '+d);
      if(J(a&&a.cardio)!==J(b&&b.cardio)||!!(a&&a.rest)!==!!(b&&b.rest)) bump('INCHAIN cardio/rest diff');
      if(!sunTrain) bump('INCHAIN on Sunday-rest config');
      if(shape(a)!==shape(b)) bump('INCHAIN loss/shape');
      if(!['sun','mon'].includes(d)){ const pi=ORD.indexOf(d); const pw=pi===0?w-1:w, pd=pi===0?'sun':ORD[pi-1];
        const prevIn=J(day('xr',pw,pd))!==J(day('cand',pw,pd));
        const na=names(a), nb=names(b); const ch=[]; na.forEach((n,i)=>{ if(n!==nb[i]) ch.push([n,nb[i]]); });
        const within=ch.length>0&&ch.every(([p,q])=>HINGE.test(p)===HINGE.test(q));
        const swap=renameOnly(a,b);
        // depth: prev day itself mid-week cascade?
        const depth2=prevIn&&!['sun','mon'].includes(pd);
        bump('INCHAIN midweek'); if(!(prevIn&&swap&&within&&!depth2)) bump('INCHAIN midweek BREAKS D167a');
        ex('MIDWEEK', 'ui '+ui+' '+x.mix+' '+x.eq+' '+x.f+' '+x.c.experience+' rest '+x.c.restDays.join('/')+' seed '+x.c.seed+' W'+w+' '+d+' prevIn '+prevIn+' swap '+swap+' within '+within+' depth2 '+depth2+' '+JSON.stringify(ch)); }
    })); if(prog) bump('INCHAIN programs'); }
  // union differential base vs cand
  let pch=false;
  W.forEach(w=>ORD.forEach(d=>{ const b0=day('base',w,d), c0=day('cand',w,d); if(J(b0)===J(c0)) return; pch=true; bump('DIFF days');
    if(J(b0&&b0.cardio)!==J(c0&&c0.cardio)||!!(b0&&b0.rest)!==!!(c0&&c0.rest)) bump('DIFF cardio/rest');
    const chain=['base','s1','s2','s3','s4','s5','s6','cand']; const steps=[];
    for(let k=1;k<=7;k++) if(J(day(chain[k-1],w,d))!==J(day(chain[k],w,d))) steps.push(k);
    const singles=[]; for(let k=1;k<=7;k++){ const g=k===1?'g1':'g'+k; if(J(day(g,w,d))!==J(b0)) singles.push(k); }
    if(!singles.length) bump('INTERACTION lat '+x.lat);
    const fails=[];
    for(const k of steps){ const a=day(chain[k-1],w,d), b=day(chain[k],w,d); let cls, ok;
      const la=labels(a).concat(labels(b)).join('|');
      if(k===1){ if(rpeOnly(a,b)){ cls='D171'; ok=(w===last&&(d==='sat'||d==='sun')); }
                 else { cls='D167'; ok=renameOnly(a,b)&&sunTrain&&(d==='sun'||d==='mon'||d==='tue'); if(d==='tue'){ bump('D167 step1 tue'); ok=ok&&J(day('base',w,'mon'))!==J(day('s1',w,'mon')); } } }
      else if(k===2){ cls='D159'; ok=/Leg isolation/.test(la)||renameOnly(a,b); }
      else if(k===3){ cls='D164s1'; ok=ik==='shoulder/workaround'; }
      else if(k===4){ cls='D164s2'; ok=ik==='elbow/workaround'&&(/Biceps/.test(la)||renameOnly(a,b)); }
      else if(k===5){ cls='D170'; ok=/leg/i.test(String((b&&b.title)||''))||renameOnly(a,b); }
      else if(k===6){ cls='D165'; ok=/leg/i.test(String((b&&b.title)||''))||renameOnly(a,b); }
      else { cls='D166'; ok=['home_basic','minimal','bodyweight'].includes(x.eq)&&(/Pull superset B/.test(la)||renameOnly(a,b)||/core|Core/.test(la)); }
      bump('CLASS '+cls+' days'); if(!ok){ fails.push(cls); ex('UNCLASS '+cls, 'ui '+ui+' '+x.lat+' '+x.eq+' '+ik+' '+x.f+' W'+w+' '+d+' title '+(b&&b.title)+' :: '+labels(a).join('|')+' => '+labels(b).join('|')); }
    }
    if(!steps.length) { bump('UNCLASS no step'); }
    if(fails.length) bump('UNCLASSIFIED days');
  })); if(pch) bump('DIFF programs');
}
T.identSampled=nIdent;
fs.writeFileSync('/tmp/v219_gk/shard_'+SH+'.json',JSON.stringify({T,EX}));
