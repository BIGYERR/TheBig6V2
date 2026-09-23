// v205_d133_lost_weeks — MEASURE (read-only). Pass 1 attributed the weeks that GAINED posterior
// (C1 +24, C5 +12). This pass attributes the ones that moved the WRONG way: C1's 16 weeks that
// lost all posterior at V205 and C5's 4 new __DELOAD_OFF zeros. Coach's condition says an
// unattributed cell blocks the re-pin, so the losing side has to be printed too.
// Same anchor, same lattice, same hand oracle. Neither artifact is written.
const path=require('path'), fs=require('fs'), os=require('os');
const {fork}=require('child_process');
const {load}=require(path.join(__dirname,'..','harness.js'));
const ROOT=path.join(__dirname,'..','..');
const SCRATCH='/private/tmp/claude-501/-Users-CanasBangin-Desktop-TheBig6V2/1db5e723-d366-4a95-870d-30d83a70cafc/scratchpad';
const ARTS={v204:path.join(SCRATCH,'v204.html'), v205:path.join(ROOT,'index.html')};
const E_PAT=[['calf_iso',/calf|calves|plantarflex/i],
  ['hip_ext',/hip thrust|glute bridge|glute-ham|\bghr\b|nordic|back extension|hyperextension|reverse hyper|pull-?through/i],
  ['leg_iso',/leg curl|leg extension|hamstring curl/i],
  ['hinge',/deadlift|\brdl\b|romanian|good morning|\bswing\b|\bclean\b|\bsnatch\b|hinge|rack pull/i]];
const ePat=n=>{const t=String(n||'');for(const [p,r] of E_PAT) if(r.test(t)) return p; return null;};
const isPost=n=>{const p=ePat(n);return p==='hinge'||p==='hip_ext';};
const cardPost=c=>(c||[]).reduce((a,s)=>a+(s.n||[]).reduce((b,n)=>b+(isPost(n)?1:0),0),0);
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
    LAT.push({key:`${t}|${f}|${x}|${g.k}|${i.k}|${r.k}|${sd}`,cfg:c}); }
const A_PIPE="      weeks[w][d]={title,dot:cardio?cardio.type:'lift',tags,cardio,sections:capRegionalFatigue((_s=>isRecoveryWeek(w)?recoveryDeload(_s):_s)(applyInjuryFilter(buildSections(role,w,{fullVariant,wantCarry:d===carryHost,cardio,hotNext}),cfg)),role,cardio,goal)};";
const A_PIPE_R=[
"      var __p1=applyInjuryFilter(buildSections(role,w,{fullVariant,wantCarry:d===carryHost,cardio,hotNext}),cfg);",
"      var __p2=isRecoveryWeek(w)?recoveryDeload(__p1):__p1;",
"      var __p3=capRegionalFatigue(__p2,role,cardio,goal);",
"      if(typeof globalThis!=='undefined'&&globalThis.__G199)globalThis.__G199.push({w:String(w),d:String(d),dl:!!isRecoveryWeek(w),role:String(role),",
"        hot:!!hotNext,ci:(function(){try{return _cardioInterference(cardio);}catch(e){return null;}})(),",
"        cs:cardio?String(cardio.subtype||''):'',cl:!!(cardio&&cardio.legLoad),",
"        p1:globalThis.__SNAP(__p1),p2:globalThis.__SNAP(__p2),p3:globalThis.__SNAP(__p3)});",
"      weeks[w][d]={title,dot:cardio?cardio.type:'lift',tags,cardio,sections:__p3};"].join("\n");
const SNAP_FN="globalThis.__SNAP=function(a){return (a||[]).map(function(s){var it=((s&&s.items)||[]);return {"
 +"l:String((s&&s.label)||''),n:it.map(function(i){return String((i&&i.name)||'');})};});};";
function instrument(art,tag){const RAW=fs.readFileSync(art,'utf8');const n=RAW.split(A_PIPE).length-1;
  if(n!==1) throw new Error('ANCHOR count=='+n+' in '+art);
  const out=path.join(os.tmpdir(),'m133c_'+tag+'.html');fs.writeFileSync(out,RAW.replace(A_PIPE,A_PIPE_R));return out;}
function sweep(ver,mine){
  const f=instrument(ARTS[ver],ver+'_'+process.pid); const IA=load(f);
  IA.eval(SNAP_FN+"globalThis.__G199=[];globalThis.__DELOAD_OFF=false;");
  const weeks={}, cells={};
  mine.forEach(L=>{ ['on','off'].forEach(m=>{
      IA.eval("globalThis.__G199.length=0;globalThis.__DELOAD_OFF="+(m==='off')+";");
      const prog=IA.buildProgram(L.cfg); const REC=IA.eval('globalThis.__G199'); const W=prog.weeks||{};
      Object.keys(W).forEach(w=>{ let tot=0;
        Object.keys(W[w]).forEach(d=>{ let n=0;
          ((W[w][d]&&W[w][d].sections)||[]).forEach(s=>((s&&s.items)||[]).forEach(it=>{if(isPost(it&&it.name))n++;}));
          tot+=n;
          if(m==='on'){ const dk=L.key+'|'+w+'|'+d; cells[dk]=cells[dk]||{};
            cells[dk].shipPost=n; cells[dk].ship=((W[w][d]&&W[w][d].sections)||[]).map(s=>String(s.label||'')).join(' | '); }
        });
        const wk=L.key+'|'+w; weeks[wk]=weeks[wk]||{}; weeks[wk][m==='on'?'on':'off']=tot; });
      if(m!=='on') return;
      REC.forEach(r=>{ const dk=L.key+'|'+r.w+'|'+r.d, c=cells[dk]=cells[dk]||{};
        c.role=r.role;c.ci=r.ci;c.sub=r.cs;c.hot=r.hot;c.cl=r.cl;c.dl=!!r.dl;
        c.a1=cardPost(r.p1);c.a2=cardPost(r.p2);c.a3=cardPost(r.p3);
        weeks[L.key+'|'+r.w].dl=!!r.dl;
        c.p2=(r.p2||[]).map(s=>s.l).join(' | '); c.p3=(r.p3||[]).map(s=>s.l).join(' | ');
        c.post2=(r.p2||[]).filter(s=>(s.n||[]).some(isPost)).map(s=>s.l+':'+(s.n||[]).filter(isPost).join('/')).join(' ; ');
      });
    }); });
  try{fs.unlinkSync(f);}catch(e){}
  return {weeks,cells};
}
if(process.env.M133CSHARD!==undefined){
  const si=+process.env.M133CSHARD,sn=+process.env.M133CSHARDS;
  const mine=LAT.filter((_,i)=>i%sn===si);
  fs.writeFileSync(process.env.M133COUT,JSON.stringify({v204:sweep('v204',mine),v205:sweep('v205',mine)}));
  process.exit(0);
}
const SH=+(process.argv[2]||8),outs=[],kids=[];
for(let i=0;i<SH;i++){const o=path.join(os.tmpdir(),'m133c_'+i+'_'+process.pid+'.json');outs.push(o);
  try{fs.unlinkSync(o);}catch(e){}
  kids.push(new Promise((res,rej)=>{const k=fork(__filename,[],{env:Object.assign({},process.env,
    {M133CSHARD:String(i),M133CSHARDS:String(SH),M133COUT:o}),stdio:'inherit'});
    k.on('exit',c=>c===0?res():rej(new Error('shard '+i+' exit '+c)));}));}
Promise.all(kids).then(()=>{
  const W4={},W5={},C4={},C5={};
  outs.forEach(o=>{const j=JSON.parse(fs.readFileSync(o,'utf8'));
    Object.assign(W4,j.v204.weeks);Object.assign(W5,j.v205.weeks);
    Object.assign(C4,j.v204.cells);Object.assign(C5,j.v205.cells);try{fs.unlinkSync(o);}catch(e){}});
  const show=(wk)=>{ console.log('\n  WEEK '+wk+'   dl='+W5[wk].dl+'   ON 204='+W4[wk].on+'->205='+W5[wk].on
      +'   OFF 204='+W4[wk].off+'->205='+W5[wk].off);
    Object.keys(C5).filter(k=>k.startsWith(wk+'|')).forEach(k=>{ const a=C4[k]||{},b=C5[k];
      const ch=(a.role!==b.role)||(a.ci!==b.ci)||(a.shipPost!==b.shipPost)||(a.p3!==b.p3)||(a.hot!==b.hot);
      if(!ch) return;
      console.log('     '+k.split('|').pop().padEnd(4)+' role '+a.role+'->'+b.role+' | ci '+a.ci+'->'+b.ci
        +' | sub "'+(a.sub||'')+'"->"'+(b.sub||'')+'" | hotNext '+a.hot+'->'+b.hot+' | legLoad '+a.cl+'->'+b.cl
        +' | post p1/p2/p3 '+a.a1+'/'+a.a2+'/'+a.a3+'->'+b.a1+'/'+b.a2+'/'+b.a3+' | shipPost '+a.shipPost+'->'+b.shipPost);
      console.log('        p2   204: '+a.p2+'\n        p2   205: '+b.p2);
      console.log('        p3   204: '+a.p3+'\n        p3   205: '+b.p3);
      console.log('        post 204: '+a.post2+'\n        post 205: '+b.post2);
    }); };
  const z4=Object.keys(W4).filter(k=>W4[k].on===0), z5=Object.keys(W5).filter(k=>W5[k].on===0);
  const Z4=new Set(z4),Z5=new Set(z5);
  const lost=z5.filter(k=>W4[k]&&!Z4.has(k));
  console.log('=== C1 WEEKS THAT LOST ALL POSTERIOR AT V205 ('+lost.length+' of '+Object.keys(W5).length+' weeks) ===');
  lost.forEach(show);
  const o4=Object.keys(W4).filter(k=>W4[k].dl&&W4[k].off===0), o5=Object.keys(W5).filter(k=>W5[k].dl&&W5[k].off===0);
  const O4=new Set(o4); const newZero=o5.filter(k=>W4[k]&&!O4.has(k));
  console.log('\n=== C5 NEW __DELOAD_OFF ZEROS AT V205 ('+newZero.length+') ===');
  newZero.forEach(show);
  console.log('\n=== TOTALS (restated) ===');
  console.log('C1 zeroWeeks 204='+z4.length+' 205='+z5.length+'  gained='+z4.filter(k=>W5[k]&&!Z5.has(k)).length+' lost='+lost.length);
  console.log('C5 offZeros  204='+o4.length+' 205='+o5.length+'  fixed='+o4.filter(k=>W5[k]&&!(new Set(o5)).has(k)).length+' new='+newZero.length);
}).catch(e=>{console.error('MEASUREMENT FAILED:',e.message);process.exit(1);});
