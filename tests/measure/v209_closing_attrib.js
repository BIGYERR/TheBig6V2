// v209_closing_attrib.js — companion to v209_closing_rows.js. Attributes any movement of g199's
// shipped-card counts (C1/C3/C5/D2) between V208 and V209 to the cells that changed.
// Lattice and posterior lens copied from tests/gates/g199_deload_arbitration.js (hand table E_PAT,
// {hinge,hip_ext}); isRecoveryWeek read from the engine only to split deload/non-deload, same as g199.
// Usage: node tests/measure/v209_closing_attrib.js <v208.html> <v209.html>
const path=require('path'), crypto=require('crypto');
const {load}=require(path.join(__dirname,'..','harness.js'));
const E_PAT=[['calf_iso',/calf|calves|plantarflex/i],
 ['hip_ext',/hip thrust|glute bridge|glute-ham|\bghr\b|nordic|back extension|hyperextension|reverse hyper|pull-?through/i],
 ['leg_iso',/leg curl|leg extension|hamstring curl/i],
 ['hinge',/deadlift|\brdl\b|romanian|good morning|\bswing\b|\bclean\b|\bsnatch\b|hinge|rack pull/i]];
const ePat=n=>{const t=String(n||'');for(const [p,r] of E_PAT) if(r.test(t)) return p; return null;};
const isPost=n=>{const p=ePat(n);return p==='hinge'||p==='hip_ext';};
const E_TIERS=['commercial','home_full','crossfit','home_basic','bodyweight','minimal'];
const E_FOCUS=['hypertrophy','balanced'], E_EXPS=['beginner','advanced'];
const E_GOALS=[{k:'liftonly',id:null},{k:'pace',id:'run_pace_goal'},{k:'half',id:'run_half'}];
const E_INJ=[{k:'healthy',v:null},{k:'shoulder/protect',v:{region:'shoulder',tier:'protect'}},
  {k:'lowback/protect',v:{region:'lowback',tier:'protect'}},{k:'knee/protect',v:{region:'knee',tier:'protect'}}];
const E_RESTS=[{k:'sun',v:['sun']},{k:'sun+wed',v:['sun','wed']},{k:'sat+sun',v:['sat','sun']}];
const E_SEEDS=[1013,3039];
function eCfg(tier,focus,exp,g,inj,rest,seed){
  const isRace=!!g.id&&/5k|10k|half|marathon/.test(g.id);
  return {name:'M',primaryPath:g.id?(isRace?'event':'cardio'):'lift',cardioTypes:g.id?['run']:[],
    cardioGoals:g.id?{run:{id:g.id,label:g.k,mileBestMins:'10',mileBestSecs:'30',baselineDist:'5',
      baseline:'5mi',targetDist:'1.5',targetMins:'11',targetSecs:'0'}}:{},
    eventTargeted:isRace,raceDate:isRace?'2026-12-06':null,liftingFocus:focus,experience:exp,
    ageBracket:'18-35',equipment:tier,unit:'lbs',restDays:rest.v.slice(),
    days:['sun','mon','tue','wed','thu','fri','sat'],bench:135,squat:155,deadlift:185,seed};
}
const LAT=[];
for(const t of E_TIERS)for(const f of E_FOCUS)for(const x of E_EXPS)for(const g of E_GOALS)
  for(const i of E_INJ)for(const r of E_RESTS)for(const sd of E_SEEDS){
    const c=eCfg(t,f,x,g,i,r,sd); if(i.v) c.injury={region:i.v.region,tier:i.v.tier};
    LAT.push({key:`${t}|${f}|${x}|${g.k}|${i.k}|${r.k}|${sd}`,g:g.k,cfg:c}); }
const sha=s=>crypto.createHash('sha256').update(s).digest('hex').slice(0,16);
// deload flag: g199's own anchor, instrumented to record isRecoveryWeek(w) per week (inert: it only adds a record).
const fs=require('fs'), os=require('os');
const A_PIPE="      weeks[w][d]={title,dot:cardio?cardio.type:'lift',tags,cardio,sections:capRegionalFatigue((_s=>isRecoveryWeek(w)?recoveryDeload(_s):_s)(applyInjuryFilter(buildSections(role,w,{fullVariant,wantCarry:d===carryHost,cardio,hotNext}),cfg)),role,cardio,goal)};";
function inst(f,tag){ const R=fs.readFileSync(f,'utf8'); const n=R.split(A_PIPE).length-1; if(n!==1){ console.log('FAIL anchor count '+n+' in '+f); process.exit(1); }
  const o=path.join(os.tmpdir(),'v209attrib_'+tag+'_'+process.pid+'.html'); fs.writeFileSync(o,R.replace(A_PIPE,"      if(globalThis.__DLW)globalThis.__DLW[String(w)]=!!isRecoveryWeek(w);\n"+A_PIPE)); return o; }
const A=load(inst(path.resolve(process.argv[2]),'a')), B=load(inst(path.resolve(process.argv[3]),'b'));
function run(IA,cfg,off){ IA.eval('globalThis.__DELOAD_OFF='+(!!off)+';globalThis.__DLW={};'); const p=IA.buildProgram(JSON.parse(JSON.stringify(cfg))); p.__dlw=JSON.parse(JSON.stringify(IA.eval('globalThis.__DLW'))); IA.eval('globalThis.__DELOAD_OFF=false;'); return p; }
function wkStats(IA,p){ const o={}; Object.keys(p.weeks||{}).forEach(w=>{ let n=0; const days={};
  Object.keys(p.weeks[w]).forEach(d=>{ const day=p.weeks[w][d]; let k=0; ((day&&day.sections)||[]).forEach(s=>((s&&s.items)||[]).forEach(it=>{ if(isPost(it&&it.name)) k++; })); days[d]=k; n+=k; });
  o[w]={n,days,sha:sha(JSON.stringify(p.weeks[w])),dl:!!p.__dlw[w]}; }); return o; }
const T={cfg:0,weeks:0,dayCells:0,cellsChanged:0,byGoal:{},C1:{a:0,b:0},C5:{a:0,b:0},D2:{a:0,b:0},flipsC1:[],flipsC5:[],flipsD2:[],postItemsLost:0,postItemsGained:0,lostBy:{},changedTier:{},changedLabels:{}};
const bump=(o,k,n)=>{o[k]=(o[k]||0)+(n||1);};
function tierOf(IA,c){ try{ return IA.eval('_longRunTier')(c)||'none'; }catch(e){ return 'err'; } }
LAT.forEach(L=>{ T.cfg++;
  const pa=run(A,L.cfg,false), pb=run(B,L.cfg,false), pao=run(A,L.cfg,true), pbo=run(B,L.cfg,true);
  const a=wkStats(A,pa), b=wkStats(B,pb), ao=wkStats(A,pao), bo=wkStats(B,pbo);
  Object.keys(b).forEach(w=>{ T.weeks++; if(b[w].dl) T.dlWeeks=(T.dlWeeks||0)+1;
    const za=a[w].n===0, zb=b[w].n===0; if(za) T.C1.a++; if(zb) T.C1.b++;
    if(za!==zb) T.flipsC1.push(L.key+' w'+w+' '+(za?'0->'+b[w].n:a[w].n+'->0')+(b[w].dl?' DL':''));
    if(b[w].dl){ const zoa=ao[w].n===0, zob=bo[w].n===0; if(zoa) T.C5.a++; if(zob) T.C5.b++; if(zoa!==zob) T.flipsC5.push(L.key+' w'+w+' off:'+ao[w].n+'->'+bo[w].n);
      const ia=a[w].sha===ao[w].sha, ib=b[w].sha===bo[w].sha; if(ia) T.D2.a++; if(ib) T.D2.b++; if(ia!==ib) T.flipsD2.push(L.key+' w'+w+' identical '+ia+'->'+ib); }
    if(b[w].dl) Object.keys(pb.weeks[w]).forEach(d=>{ const ea=(a[w].days[d]===0&&ao[w].days[d]>0), eb=(b[w].days[d]===0&&bo[w].days[d]>0);
      T.E6=T.E6||{a:0,b:0,flips:[]}; if(ea) T.E6.a++; if(eb) T.E6.b++;
      if(ea!==eb){ const c=pbo.weeks[w][d]&&pbo.weeks[w][d].cardio; T.E6.flips.push(L.key+' w'+w+' '+d+' on '+a[w].days[d]+'->'+b[w].days[d]+' off '+ao[w].days[d]+'->'+bo[w].days[d]+' tier(V209) '+tierOf(B,c)+' '+((c&&c.subtype)||'-')+' key '+((c&&c.dose&&c.dose.key)||'-')); } });
    Object.keys(pb.weeks[w]).forEach(d=>{ T.dayCells++; const da=pa.weeks[w][d], db=pb.weeks[w][d];
      if(JSON.stringify(da)!==JSON.stringify(db)){ T.cellsChanged++; bump(T.byGoal,L.g);
        const t=tierOf(B,db&&db.cardio); bump(T.changedTier,L.g+'|tier '+t+'|'+((db&&db.cardio&&db.cardio.isNRC)?'NRC':'NSW')+'|key '+((db&&db.cardio&&db.cardio.dose&&db.cardio.dose.key)||'-'));
        const la=((da&&da.sections)||[]).map(s=>s.label||'(core/unlabelled)'), lb=((db&&db.sections)||[]).map(s=>s.label||'(core/unlabelled)');
        la.filter(x=>lb.indexOf(x)<0).forEach(x=>bump(T.changedLabels,'dropped '+x));
        const d0=a[w].days[d], d1=b[w].days[d]; if(d1<d0){ T.postItemsLost+=d0-d1;
          ((da&&da.sections)||[]).forEach(s=>((s&&s.items)||[]).forEach(it=>{ if(isPost(it.name)) bump(T.lostBy,(s.label||'(core)')+' :: '+it.name.replace(/\s*\(.*/,'')); })); }
        if(d1>d0) T.postItemsGained+=d1-d0; } }); }); });
let dlw=0; console.log('inert check: instrumented V209 digest == pristine on 3 configs: '+[0,700,1500].map(i=>{const P=load(path.resolve(process.argv[3]));return require(path.join(__dirname,'..','harness.js')).progDigest(P.buildProgram(JSON.parse(JSON.stringify(LAT[i].cfg))))===require(path.join(__dirname,'..','harness.js')).progDigest(B.buildProgram(JSON.parse(JSON.stringify(LAT[i].cfg))));}).join(','));
console.log('lattice '+T.cfg+' configs, '+T.weeks+' weeks, '+T.dayCells+' day-cells');
console.log('deload weeks (V209 arm) '+T.dlWeeks+' (g199 D1a expects 2,880)');
console.log('day-cells changed V208->V209: '+T.cellsChanged+'  by goal '+JSON.stringify(T.byGoal));
console.log('changed cells by (goal|V209 tier|NRC/NSW|dose.key): '+JSON.stringify(T.changedTier));
console.log('section labels dropped on changed cells: '+JSON.stringify(T.changedLabels));
console.log('posterior items lost '+T.postItemsLost+' gained '+T.postItemsGained+' ; lost from: '+JSON.stringify(T.lostBy));
console.log('C1 zero-posterior weeks (shipped): V208 '+T.C1.a+'  V209 '+T.C1.b+'  flips '+T.flipsC1.length);
T.flipsC1.slice(0,60).forEach(x=>console.log('   '+x));
console.log('C5 zero-posterior DELOAD weeks, deload OFF: V208 '+T.C5.a+'  V209 '+T.C5.b+'  flips '+T.flipsC5.length); T.flipsC5.slice(0,30).forEach(x=>console.log('   '+x));
console.log('D2 deload weeks byte-identical on/off: V208 '+T.D2.a+'  V209 '+T.D2.b+'  flips '+T.flipsD2.length); T.flipsD2.slice(0,30).forEach(x=>console.log('   '+x));
console.log('E6-shape (deload day: shipped 0 posterior ON, >0 OFF): V208 '+(T.E6?T.E6.a:0)+'  V209 '+(T.E6?T.E6.b:0)+'  flips '+(T.E6?T.E6.flips.length:0)); (T.E6?T.E6.flips:[]).slice(0,40).forEach(x=>console.log('   '+x));
