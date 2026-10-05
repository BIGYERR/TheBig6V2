// coach6 prototype of the proposed row: late-plan boot under hand oracles, D190 shard. TREE=<html> OUT=<json> [RMAX]
'use strict';
const path=require('path'),fs=require('fs'),cp=require('child_process');
const ROOT='/Users/CanasBangin/Desktop/TheBig6V2'; const {load,fixtures}=require(path.join(ROOT,'tests','harness.js'));
const TREE=process.env.TREE, OUT=process.env.OUT; const RMAX=+(process.env.RMAX||99);
const START='2026-08-24', FROMS={PRE1:START,PRE5:'2026-09-21',OVOV:START,OVT:START}, CLOCKS={PRE1:START,PRE5:'2026-09-24',OVOV:START,OVT:START};
const REGS=['knee','ankle','hip','lowback','shoulder','elbow']; const OTHER=r=>REGS[(REGS.indexOf(r)+1)%REGS.length];
const LATE={PRE1:{base:'UNINJ',inj:c=>c.injury},PRE5:{base:'UNINJ',inj:c=>c.injury},OVOV:{base:'OV1',inj:c=>({region:OTHER(c.injury.region),tier:c.injury.tier})},OVT:{base:'OV1',inj:c=>({region:c.injury.region,tier:c.injury.tier==='workaround'?'protect':'workaround'})}};
// HAND tables (typed from index.html injuryPlan :7973-7998 and JUMPS :8122; never read at runtime)
const HAND_NOJUMPS=new Set(['knee','ankle']);
const HAND_JUMPS=/jump|burpee|broad|bound|box jump|high knees|tuck/i;   // typed copy of the plan's JUMPS, used only to classify names
const clone=x=>JSON.parse(JSON.stringify(x)); const CLK=/^_?(ts|at|time|stamp|clock|now|created)$/i; const JS=v=>JSON.stringify(v,(k,x)=>CLK.test(k)?undefined:x);
const MARIO={name:'M',primaryPath:'lift',cardioTypes:[],cardioGoals:{},eventTargeted:false,raceDate:null,liftingFocus:'support_strength',experience:'beginner',ageBracket:'18-35',equipment:'commercial',unit:'lbs',restDays:['sun','wed'],days:['sun','mon','tue','wed','thu','fri','sat'],bench:135,squat:155,deadlift:185,seed:76308};
const CELLS=REGS.map(g=>({k:g+'/workaround|commercial|beginner|support_strength|sun,wed',c:Object.assign(clone(MARIO),{injury:{region:g,tier:'workaround'}})}));
const HELP="globalThis.__cands=function(day,w,name){var c=swapCandidates(name,day,w,activeProg);if(!c.pattern&&_auxFamily(name))return auxSwapCandidates(name,day,activeProg).slice();return c.tier1.concat(c.tier2);};globalThis.__T=[];showToast=function(m){__T.push(String(m));};openDetail=function(){};closeSwapSheet=function(){};renderWeekView=function(){};closeOverlaySheet=function(){};bumpSwapCount=function(){return false;};try{closeRestSheet=function(){};}catch(e){}";
const E=(X,c)=>X.eval(c);
function fresh(pres){const X=load(TREE);const T=new Date(CLOCKS[pres]+'T12:00:00').getTime();const RD=Date;class FD extends RD{constructor(...a){if(a.length)super(...a);else super(T);}static now(){return T;}}X.ctx.Date=FD;E(X,HELP);return X;}
function setup(X,st){X.localStorage.clear();X.ctx.__SP=JSON.parse(st);E(X,"savePrograms([__SP]);activeProgId='PM';activeProg=refreshProgram(getPrograms().find(function(x){return x.id==='PM';}));");}
function bootFrom(src,dst){const ls=new Map(src.localStorage._map);dst.localStorage.clear();for(const [k,v] of ls)dst.localStorage.setItem(k,v);E(dst,"activeProgId='PM';activeProg=refreshProgram(getPrograms().find(function(x){return x.id==='PM';}));");}
function writeOverlay(X,oi,from){const n0=+E(X,'JSON.stringify((activeProg.overlays||[]).length)');E(X,"_ovDraft.injRegion="+JSON.stringify(oi.region)+";_ovDraft.injTier="+JSON.stringify(oi.tier)+";_ovDraft.from='"+from+"';applyInjuryDraft();");if(+E(X,'JSON.stringify((activeProg.overlays||[]).length)')!==n0+1)throw new Error('overlay not written');}
function stored(c,pres){const X=fresh(pres);const base=LATE[pres].base;const cfg=clone(c);delete cfg.injury;const s=clone(X.buildProgram(clone(cfg)));Object.assign(s,{id:'PM',name:'M',created:1,startDate:START,cfg:clone(cfg)});let j=JSON.stringify(s);
  if(base==='OV1'){setup(X,j);writeOverlay(X,c.injury,START);const o=JSON.parse(E(X,"localStorage.getItem('ia_programs')")).find(x=>x.id==='PM');(o.overlays||[]).forEach(v=>{v.id='ov_fixed';v.created=1;});j=JSON.stringify(o);}return j;}
const handInj=(c,pres,w)=>pres==='PRE5'?(w>=5?c.injury:null):LATE[pres].inj(c);
const weeksOf=X=>JSON.parse(E(X,'JSON.stringify(activeProg.weeks)'));
const dayKeys=W=>{const o=[];Object.keys(W).forEach(w=>Object.keys(W[w]||{}).forEach(d=>{const dy=W[w][d];if(dy&&Array.isArray(dy.sections)&&dy.sections.some(s=>s&&s.items&&s.items.length))o.push([+w,d]);}));return o;};
const cardsOf=dy=>{const o=[];(dy&&dy.sections||[]).forEach((s,si)=>(s.items||[]).forEach((it,ii)=>{if(it&&it.name)o.push({si,ii,n:it.name,d:it.detail||''});}));return o;};
const clean=s=>String(s||'').replace(/<svg[\s\S]*?<\/svg>\s*/g,'').trim();
const sig=dy=>!dy||!dy.sections?'(none)':dy.sections.map(s=>clean(s.label)+'{'+(s.items||[]).map(it=>clean(it.name)+'|'+(it.detail||'')).join(';')+'}').join(' ');
const dayJ=(X,w,d)=>JSON.parse(E(X,'JSON.stringify(activeProg.weeks['+w+'].'+d+')'));
function trySwap(X,w,d,card,used,want){E(X,'currentWeek='+w+";currentDayKey='"+d+"';");let cs=[];try{cs=JSON.parse(E(X,"JSON.stringify(__cands(activeProg.weeks["+w+"]."+d+","+w+","+JSON.stringify(card.n)+"))"));}catch(e){return{err:'cands'};}
  cs=cs.map(x=>typeof x==='string'?x:(x&&x.name)).filter(Boolean).filter(x=>!used.has(x.toLowerCase())); if(want){ if(!cs.includes(want)) return {notOffered:true,offered:cs.slice(0,6)}; cs=[want]; }
  for(const to of cs.slice(0,2)){const before=JSON.stringify(dayJ(X,w,d));X.ctx.__c={secIdx:card.si,itemIdx:card.ii,name:card.n,detail:card.d};X.ctx.__to=to;try{E(X,'__T.length=0;_swapCtx=__c;applySwapChoice(__to);');}catch(e){return{err:'apply'};}
    const after=dayJ(X,w,d);if(JSON.stringify(after)!==before)return{to,after};}return{none:true};}
// hand judgement of one booted day under the hand plan: duplicate names in a section; jump names on a noJumps region
function judge(dy,hi){const r={dup:0,jump:0,dupEx:null,jumpEx:null};if(!hi)return r;(dy&&dy.sections||[]).forEach(s=>{const names=(s.items||[]).map(it=>clean(it.name));const seen=new Set();names.forEach(n=>{if(seen.has(n)){r.dup++;r.dupEx=r.dupEx||(clean(s.label)+'{'+names.join(';')+'}');}seen.add(n);if(HAND_NOJUMPS.has(hi.region)&&HAND_JUMPS.test(n)){r.jump++;r.jumpEx=r.jumpEx||(clean(s.label)+':'+n);}});});return r;}
// TYPED cells (M20's three examples + nothing else): one swap, then the late plan, then boot
const TYPED=[{id:'T1',pres:'PRE1',region:'knee',w:3,d:'sat',from:'Mountain climbers',to:'High knees'},{id:'T2',pres:'OVOV',region:'ankle',w:5,d:'tue',from:'Incline dumbbell curl',to:'Barbell curl'},{id:'T3',pres:'OVT',region:'hip',w:5,d:'sat',from:'Mountain climbers',to:'Burpees'}];
function worker(spec){const [pres,ri]=spec.split(':');const cell=CELLS[+ri];const c=cell.c;const t0=Date.now();
  const rec={k:cell.k,pres,err:null,rounds:0,swaps:0,skips:0,boots:0,judged:0,dup:0,jump:0,dupEx:[],jumpEx:[],rebootNe:0,persist:0,swDays:0,typed:[]};
  try{const st=stored(c,pres);const X=fresh(pres);setup(X,st);const W0=weeksOf(X);const DK=dayKeys(W0);const SD=DK.filter(([w])=>pres!=='PRE5'||w>=5);const maxR=Math.max(0,...SD.map(([w,d])=>cardsOf(W0[w][d]).length));
    for(let r=0;r<Math.min(maxR,RMAX);r++){const Y=fresh(pres);setup(Y,st);const done=[];rec.rounds++;
      for(const [w,d] of SD){const cs=cardsOf(W0[w][d]);const card=cs[r];if(!card)continue;const used=new Set(cardsOf(dayJ(Y,w,d)).map(x=>x.n.toLowerCase()));const s=trySwap(Y,w,d,card,used);if(!s.to){rec.skips++;continue;}rec.swaps++;done.push({w,d,card,to:s.to});}
      if(!done.length)continue; writeOverlay(Y,LATE[pres].inj(c),FROMS[pres]);
      const B=fresh(pres);bootFrom(Y,B);const R=fresh(pres);bootFrom(B,R);const WB=weeksOf(B),WR=weeksOf(R);
      done.forEach(x=>{rec.swDays++;const dy=WB[x.w]&&WB[x.w][x.d];const it=dy&&dy.sections[x.card.si]&&dy.sections[x.card.si].items[x.card.ii];if(it&&it.name===x.to)rec.persist++;});
      for(const w of Object.keys(WB))for(const d of Object.keys(WB[w]||{})){rec.boots++;const a=WB[w][d];if(JS(a)!==JS(WR[w]&&WR[w][d]))rec.rebootNe++;const hi=handInj(c,pres,+w);if(!hi||!a||!a.sections)continue;rec.judged++;const j=judge(a,hi);rec.dup+=j.dup;rec.jump+=j.jump;if(j.dupEx&&rec.dupEx.length<2)rec.dupEx.push('W'+w+' '+d+' '+j.dupEx);if(j.jumpEx&&rec.jumpEx.length<2)rec.jumpEx.push('W'+w+' '+d+' '+j.jumpEx);}}
    // typed cells for this (pres, region)
    for(const T of TYPED.filter(t=>t.pres===pres&&t.region===c.injury.region)){const Y=fresh(pres);setup(Y,st);const W=weeksOf(Y);const card=cardsOf(W[T.w][T.d]).find(x=>x.n===T.from);let out={id:T.id};
      if(!card){out.err='from not on day: '+sig(W[T.w][T.d]);}else{const used=new Set(cardsOf(W[T.w][T.d]).map(x=>x.n.toLowerCase()));const s=trySwap(Y,T.w,T.d,card,used,T.to);if(!s.to){out.err='swap not landed '+JSON.stringify(s);}else{out.built=sig(W[T.w][T.d]);out.live=sig(s.after);writeOverlay(Y,LATE[pres].inj(c),FROMS[pres]);const B=fresh(pres);bootFrom(Y,B);out.boot=sig(dayJ(B,T.w,T.d));out.plan=E(B,'JSON.stringify(_dayPlanCfg(activeProg,activeProg.weeks['+T.w+'].'+T.d+').injury||null)');}}
      rec.typed.push(out);}
  }catch(e){rec.err=String(e&&e.stack||e).slice(0,300);}
  rec.secs=((Date.now()-t0)/1000).toFixed(0);fs.writeFileSync(OUT+'.'+spec.replace(':','_')+'.json',JSON.stringify(rec));console.log('worker '+spec+' '+rec.secs+'s');}
if(process.env.WORKER){worker(process.env.WORKER);}
else{const jobs=[];for(const pres of ['PRE1','PRE5','OVOV','OVT'])for(let i=0;i<CELLS.length;i++)jobs.push(pres+':'+i);let i=0;const t0=Date.now();const par=+(process.env.PAR||6);
  const one=j=>new Promise(res=>{const p=cp.spawn(process.execPath,['--max-old-space-size=4096',__filename],{env:Object.assign({},process.env,{WORKER:j}),stdio:['ignore','pipe','pipe']});let o='';p.stdout.on('data',x=>o+=x);p.stderr.on('data',x=>o+=x);p.on('exit',code=>{if(code)console.log('CRASH '+j+' '+o.slice(-400));res();});});
  Promise.all(Array.from({length:par},async()=>{while(i<jobs.length)await one(jobs[i++]);})).then(()=>{const R=[];for(const j of jobs){try{R.push(JSON.parse(fs.readFileSync(OUT+'.'+j.replace(':','_')+'.json','utf8')));}catch(e){R.push({k:j,err:'MISSING'});}}
    const sum=(A,f)=>A.reduce((a,x)=>a+(f(x)||0),0);console.log('TREE '+TREE+' wall '+((Date.now()-t0)/1000).toFixed(0)+'s | cells '+R.length+' errors '+R.filter(x=>x.err).length);R.filter(x=>x.err).forEach(x=>console.log('  ERR '+x.k+' '+x.pres+' '+x.err));
    for(const pres of ['PRE1','PRE5','OVOV','OVT']){const A=R.filter(x=>x.pres===pres);console.log('  '+pres.padEnd(5)+' rounds '+sum(A,x=>x.rounds)+' swaps '+sum(A,x=>x.swaps)+' (skipped '+sum(A,x=>x.skips)+') persisted '+sum(A,x=>x.persist)+'/'+sum(A,x=>x.swDays)+' | booted days '+sum(A,x=>x.boots)+' judged '+sum(A,x=>x.judged)+' | DUP sections '+sum(A,x=>x.dup)+' | JUMP on noJumps '+sum(A,x=>x.jump)+' | reboot!=boot '+sum(A,x=>x.rebootNe)+' | secs/cell '+A.map(x=>x.secs).join(','));A.forEach(x=>{x.dupEx.slice(0,1).forEach(e=>console.log('     dup  '+x.k.split('|')[0]+' '+e.slice(0,200)));x.jumpEx.slice(0,1).forEach(e=>console.log('     jump '+x.k.split('|')[0]+' '+e.slice(0,200)));});}
    const T=R.flatMap(x=>x.typed||[]);T.forEach(t=>{console.log('  TYPED '+t.id+(t.err?' ERR '+t.err:' plan '+t.plan));if(!t.err){console.log('     built '+t.built);console.log('     live  '+t.live);console.log('     boot  '+t.boot);}});
    fs.writeFileSync(OUT+'.all.json',JSON.stringify(R));});}
