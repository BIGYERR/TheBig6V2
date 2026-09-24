'use strict';
// v215_slice2_verify.js — builder's proof for V215 slices 1-2 (D149 + the two floors). Read-only on
// the artifacts it is handed. Prints the numbers the brief asks for:
//   (1) slice 1 == measure's cf0 arm (checked by cmp before this runs; digest-equality here is a conjunct)
//   (2) helper + floor (a) only is behaviour-equal to measure's cfb arm (progDigest, every lattice cfg)
//   (3) knee/protect home_full hip-extension items: base / cf0 / cfb / after (b)
//   (4) knee/protect section losses vs V214, same-name duplicate days, per tier
//   (5) the _slot collision rate of floor (b): a probe copy records hipExtPool length and whether
//       the slot drew, at the one line that reads the reservation (output proven identical to cur)
//   (6) where the floors change cards: after vs cfb (floor b) and cfb vs cf0 (floor a), per tier|plan
//   (7) commercial / crossfit knee/protect cards vs V214
//   node tests/edits/v215_slice2_verify.js <scratchdir> <base214.html> <cf0.html> <cfb.html> <aonly.html> <cur.html> [conc]
const fs=require('fs'), path=require('path'), cp=require('child_process');
const ROOT=path.join(__dirname,'..','..'); const H=require(path.join(ROOT,'tests','harness.js'));
const P=(...a)=>console.log(...a); const DAYS=H.DAYS;
const bump=(o,k,n=1)=>{o[k]=(o[k]||0)+n;};
const ARMS=['base','cf0','cfb','aonly','cur','probe'];
const clean=n=>String(n==null?'':n).replace(/<svg[\s\S]*?<\/svg>\s*/g,'').replace(/<[^>]+>/g,'').trim();
const live=d=>(d&&d.sections||[]).filter(s=>(s.items||[]).length);
const lab=s=>String(s.label||(s.coreHeader?'{core}':'(none)')).replace(/\s*[—-]\s.*$/,'');
const card=d=>JSON.stringify((d&&d.sections||[]).map(s=>[s.label,(s.items||[]).map(i=>[clean(i.name),i.detail])]));
const HX=/hip thrust|glute bridge|back extension|glute-ham|pull-through/i;
const GOALSL1=[['run_5k',{}],['run_half',{}],['run_pace_goal',{targetDist:'1.5',targetMins:'10',targetSecs:'0'}],['run_base',{}],['run_10k',{}],['run_marathon',{}]];
const GOALS={run_pace_goal:{targetDist:'1.5',targetMins:'10',targetSecs:'0'},run_base:{},run_5k:{},run_10k:{},run_half:{},run_marathon:{}};
const FOC=['hypertrophy','strength','fatloss','balanced','support_strength','support_athletic','support_prevention'];
const EXPS=['beginner','intermediate','advanced'], AGES=['18-35','36-54','55+'], RESTS=[['sun','wed'],['sat','sun']];
const SEEDS=[76308,1234,4242,9001,31337,555,8086,20260];
const REG=['shoulder','elbow','lowback','hip','knee','ankle'], ITIER=['workaround','protect'];
const base=(g,x,f,exp,age,eq,rest,seed,inj)=>{ const c={name:'M',primaryPath:/^support_/.test(f)?'event':'goal',cardioTypes:['run'],cardioGoals:{run:Object.assign({id:g,label:g,mileBestMins:'8',mileBestSecs:'30',baselineDist:'3',baseline:'3mi'},x)},eventTargeted:false,liftingFocus:f,experience:exp,ageBracket:age,equipment:eq,unit:'lbs',restDays:rest.slice(),days:DAYS.slice(),bench:135,squat:155,deadlift:185,seed}; if(inj) c.injury=inj; return c; };
function lattice(L,eq,part){ // measure's three lattices (tests/measure/v215_d149_remeasure.js), same construction
  const out=[];
  if(L==='L1'){ for(let si=0;si<SEEDS.length;si++){
      for(const f of FOC) for(const e of EXPS) for(const a of AGES){ const [g,x]=GOALSL1[(si+FOC.indexOf(f))%6]; out.push({inj:null,c:base(g,x,f,e,a,eq,RESTS[si%2],SEEDS[si])}); }
      for(const r of REG) for(const t of ITIER){ const [g,x]=GOALSL1[(si+FOC.indexOf('hypertrophy'))%6]; out.push({inj:{region:r,tier:t},c:base(g,x,'hypertrophy',EXPS[si%3],AGES[si%3],eq,RESTS[si%2],SEEDS[si],{region:r,tier:t})}); } } }
  else if(L==='L2'){ for(const g of Object.keys(GOALS)) for(const f of FOC) for(const exp of EXPS) for(const age of ['18-35','55+']) for(const rest of RESTS) for(const seed of [76308,1234]) out.push({inj:null,c:base(g,GOALS[g],f,exp,age,eq,rest,seed)}); }
  else { const regs=part==='a'?['knee','ankle','hip']:['lowback','shoulder','elbow'];
    for(const r of regs) for(const t of ITIER) for(const g of Object.keys(GOALS)) for(const f of FOC) for(const exp of EXPS) for(const [si,seed] of [[0,76308],[1,1234]]) out.push({inj:{region:r,tier:t},c:base(g,GOALS[g],f,exp,si?'55+':'18-35',eq,RESTS[si],seed,{region:r,tier:t})}); }
  return out;
}
const PROBE_A="    const hipExtSel= hipExtPool.length?(_slot(hipExtPool,1,bs+15,'lower',true)[0]||null):null;";
const PROBE_B=PROBE_A+"\n    if(globalThis.__HX) globalThis.__HX.push([hipExtPool.length,hipExtSel===null?0:1]);";

if(process.argv[2]==='--shard'){
  const [,,,dir,L,eq,part]=process.argv; const IA={}; ARMS.forEach(k=>IA[k]=H.load(path.join(dir,'v215v_'+k+'.html')));
  const R={L,eq,part,cfg:0,crash:{},digAB:0,digAbEx:[],digProbe:0,digCf0:0,hx:{},dup:{},secLoss:{},chB:{},chA:{},chV:{},lsb:{},lsb2:{},mainKP:{},probe:{}};
  for(const x of lattice(L,eq,part)){
    R.cfg++; const B={}; const ik=x.inj?x.inj.region+'/'+x.inj.tier:'healthy';
    try{ ARMS.forEach(k=>{ if(k==='probe') IA[k].ctx.__HX=[]; B[k]=IA[k].buildProgram(JSON.parse(JSON.stringify(x.c))); }); }catch(e){ bump(R.crash,String(e.message).slice(0,100)); continue; }
    const dg={}; ARMS.forEach(k=>dg[k]=H.progDigest(B[k]));
    if(dg.aonly!==dg.cfb){ R.digAB++; if(R.digAbEx.length<3) R.digAbEx.push(ik+' '+JSON.stringify(x.c.liftingFocus)); }
    if(dg.probe!==dg.cur) R.digProbe++;
    if(dg.cf0===dg.base) R.digCf0++;
    IA.probe.ctx.__HX.forEach(([n,s])=>{ bump(R.probe,ik+'|calls'); if(n===0) bump(R.probe,ik+'|poolEmpty'); else if(!s) bump(R.probe,ik+'|dropped'); else bump(R.probe,ik+'|drew'); });
    Object.keys(B.base.weeks).forEach(w=>DAYS.forEach(d=>{
      const d0=B.base.weeks[w][d];
      const cmp=(a,b,o)=>{ const x0=B[a].weeks[w]&&B[a].weeks[w][d], x1=B[b].weeks[w]&&B[b].weeks[w][d]; if(card(x0)!==card(x1)) bump(o,ik); };
      cmp('cfb','cur',R.chB); cmp('cf0','cfb',R.chA); cmp('base','cur',R.chV);
      if(!(x.inj&&x.inj.region==='knee'&&x.inj.tier==='protect')) return;
      for(const k of ['base','cf0','cfb','cur']){ const day=B[k].weeks[w]&&B[k].weeks[w][d]; if(!day) continue;
        const names=[]; live(day).forEach(s=>s.items.forEach(it=>names.push(clean(it.name))));
        bump(R.hx,k,names.filter(n=>HX.test(n)).length);
        const seen={}; if(names.some(n=>{ const r=seen[n]; seen[n]=1; return r; })) bump(R.dup,k);
      }
      const day=B.cur.weeks[w]&&B.cur.weeks[w][d];
      if(d0&&!d0.rest){ const m={}; live(d0).forEach(s=>bump(m,lab(s),-1)); live(day).forEach(s=>bump(m,lab(s),1)); Object.entries(m).forEach(([l,v])=>{ if(v<0) bump(R.secLoss,l,-v); }); }
      const lsb=live(day).find(s=>s.label==='Leg superset B');
      if(lsb){ bump(R.lsb,String(lsb.items.length)); if(lsb.items[1]) bump(R.lsb2,clean(lsb.items[1].name));
        const mn=live(day).find(s=>/^Main — /.test(s.label||'')); if(mn) bump(R.mainKP,clean(mn.items[0].name)); }
    }));
  }
  process.stdout.write(JSON.stringify(R)); process.exit(0);
}
const [S,FB,F0,FCB,FA,FC]=process.argv.slice(2); const CONC=+(process.argv[8]||6);
const SRC={base:FB,cf0:F0,cfb:FCB,aonly:FA,cur:FC};
Object.entries(SRC).forEach(([k,f])=>{ const o=path.join(S,'v215v_'+k+'.html'); try{fs.unlinkSync(o);}catch(e){} fs.copyFileSync(f,o); });
{ const cur=fs.readFileSync(FC,'utf8'); const c=cur.split(PROBE_A).length-1; if(c!==1){ P('PROBE ANCHOR count '+c); process.exit(1); }
  const o=path.join(S,'v215v_probe.html'); try{fs.unlinkSync(o);}catch(e){} fs.writeFileSync(o,cur.replace(PROBE_A,()=>PROBE_B)); }
const jobs=[]; const TIERS=['home_full','home_basic','commercial','crossfit','bodyweight'];
TIERS.forEach(eq=>['L1','L2'].forEach(L=>jobs.push([L,eq,'-'])));
['home_full','commercial','crossfit','home_basic','bodyweight'].forEach(eq=>['a','b'].forEach(pt=>jobs.push(['L3',eq,pt])));
const OUT={}; let qi=0, run=0;
(function next(){ if(qi>=jobs.length&&run===0) return report(); while(run<CONC&&qi<jobs.length){ const j=jobs[qi++]; run++;
  const p=cp.spawn('node',[__filename,'--shard',S,...j],{cwd:ROOT}); let b='',e=''; p.stdout.on('data',d=>b+=d); p.stderr.on('data',d=>e+=d);
  p.on('close',code=>{ OUT[j.join('_')]={code,b,e}; run--; process.stderr.write('done '+j.join('_')+' exit='+code+'\n'); next(); }); } })();
function report(){
  const R=[]; Object.entries(OUT).forEach(([k,o])=>{ try{ R.push(JSON.parse(o.b)); }catch(e){ P('SHARD FAILED '+k+' '+o.e.slice(0,300)); } });
  P('shards '+R.length+' of '+jobs.length+', configs '+R.reduce((a,r)=>a+r.cfg,0)+', crashes '+R.reduce((a,r)=>a+Object.keys(r.crash).length,0));
  P('\n(2) aonly vs cfb digest mismatches: '+R.reduce((a,r)=>a+r.digAB,0)+' of '+R.reduce((a,r)=>a+r.cfg,0)+(R.some(r=>r.digAbEx.length)?' e.g. '+R.map(r=>r.digAbEx.join('; ')).join(' '):''));
  P('    probe copy vs cur digest mismatches: '+R.reduce((a,r)=>a+r.digProbe,0));
  R.forEach(r=>{ const tag=r.L+' '+r.eq+(r.part!=='-'?' '+r.part:'');
    if(r.L==='L3'&&r.part==='a'||r.L==='L1'){
      P('\n['+tag+'] cfg '+r.cfg);
      if(Object.keys(r.hx).length){
        P('  (3) knee/protect hip-ext items base/cf0/cfb/after: '+['base','cf0','cfb','cur'].map(k=>r.hx[k]||0).join(' / '));
        P('  (4) knee/protect section losses vs V214: '+(Object.entries(r.secLoss).map(([l,v])=>l+' '+v).join(', ')||'0')+'   same-name duplicate days base/cf0/cfb/after: '+['base','cf0','cfb','cur'].map(k=>r.dup[k]||0).join(' / '));
        P('      Leg superset B item count (after): '+JSON.stringify(r.lsb)+'  2nd item: '+JSON.stringify(r.lsb2)+'  legs Main: '+JSON.stringify(r.mainKP));
      }
    }
    const pr=Object.entries(r.probe).filter(([k])=>/^(knee|ankle)\/protect/.test(k)); if(pr.length) P('  (5) '+tag+' probe (reservation reads): '+pr.map(([k,v])=>k+' '+v).join(', '));
    const nz=o=>Object.entries(o).map(([k,v])=>k+' '+v).join(', ')||'none';
    P('  (6) '+tag+' cards changed by floor b (cfb->after): '+nz(r.chB)+' | by floor a (cf0->cfb): '+nz(r.chA));
    if(r.eq==='commercial'||r.eq==='crossfit') P('  (7) '+tag+' cards changed vs V214 (knee/protect: '+(r.chV['knee/protect']||0)+'): '+nz(r.chV));
  });
  P('\nDONE');
}
