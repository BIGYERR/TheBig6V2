'use strict';
// coach2 V231 re-ruling prints (read-only on the repo; scratch trees only). Amended change = W5 + B + A1x/A2/A3/A5 + FL.
const path=require('path'),fs=require('fs'),cp=require('child_process'),crypto=require('crypto');
const ROOT='/Users/CanasBangin/Desktop/TheBig6V2';
const H=require(path.join(ROOT,'tests','harness.js'));
const {load,fixtures,progDigest,DAYS}=H;
const SCR=process.env.SCR; if(!SCR) throw new Error('SCR unset'); const F=n=>path.join(SCR,n);
const PART=process.env.PART||'none';
const CLOCK='2026-08-24';
const clone=x=>JSON.parse(JSON.stringify(x)); const P=s=>console.log(s);
const sha=s=>crypto.createHash('sha256').update(s).digest('hex').slice(0,16);
const tally=(rows,key)=>{const m={};rows.forEach(r=>{const k=key(r);m[k]=(m[k]||0)+1;});return m;};
const fmt=m=>Object.keys(m).sort((a,b)=>m[b]-m[a]||(a<b?-1:1)).map(k=>k+' '+m[k]).join(' | ')||'(none)';
const bump=(o,k,n=1)=>{o[k]=(o[k]||0)+n;};
const clean=n=>String(n==null?'':n).replace(/<svg[\s\S]*?<\/svg>\s*/g,'').replace(/<[^>]+>/g,'').trim();
const ORDER=['mon','tue','wed','thu','fri','sat','sun'];
const CIRC='Leg circuit — runner armor';
const BRIDGE='Single-leg glute bridge', BEDHT='Single-leg hip thrust (shoulders on bed)';
const MARIO={name:'M',primaryPath:'lift',cardioTypes:[],cardioGoals:{},eventTargeted:false,raceDate:null,liftingFocus:'support_strength',experience:'beginner',ageBracket:'18-35',equipment:'commercial',unit:'lbs',restDays:['sun','wed'],days:DAYS.slice(),bench:135,squat:155,deadlift:185,seed:76308};
const FOC=['hypertrophy','strength','fatloss','balanced','support_strength','support_athletic','support_prevention'];
const FAM={race:[['run_5k',{}],['run_10k',{}],['run_half',{}],['run_marathon',{}]],test:[['run_pace_goal',{targetDist:'1.5',targetMins:'10',targetSecs:'30'}],['run_base',{}]],none:[[null,{}]]};
const TIERS6=['commercial','crossfit','home_full','home_basic','minimal','bodyweight'],EXPS=['beginner','intermediate','advanced'],SEEDS=[87747,76308,1234,4242],RESTS=[['sun','wed'],['sat','sun']];
const REGS=['knee','ankle','hip','lowback','shoulder','elbow'],ITIERS=['workaround','protect'];
function mk(f,fam,eq,ei,si,ri,inj){const g=FAM[fam][(si+ei)%FAM[fam].length];
  const c={name:'M',primaryPath:/^support_/.test(f)?'event':'goal',cardioTypes:g[0]?['run']:[],cardioGoals:g[0]?{run:Object.assign({id:g[0],label:g[0],mileBestMins:'8',mileBestSecs:'0',baselineDist:'3',baseline:'3mi'},g[1])}:{},eventTargeted:false,liftingFocus:f,experience:EXPS[ei],ageBracket:'18-35',equipment:eq,unit:'lbs',restDays:RESTS[ri].slice(),days:DAYS.slice(),bench:135,squat:155,deadlift:185,seed:SEEDS[si]};
  if(inj)c.injury=inj;return c;}
function lattice(){const out=[];  // M17's lattice verbatim: FULL 3,024 + INJ 3,024 + L432 432 + LBW 432
  for(const f of FOC)for(const fam of Object.keys(FAM))for(const eq of TIERS6)for(let ei=0;ei<3;ei++)for(let si=0;si<4;si++)for(let ri=0;ri<2;ri++)out.push({L:'FULL',f,fam,eq,exp:EXPS[ei],rest:RESTS[ri].join(','),inj:'none',c:mk(f,fam,eq,ei,si,ri,null)});
  let k=0;for(const r of REGS)for(const t of ITIERS)for(const f of FOC)for(const fam of Object.keys(FAM))for(const eq of TIERS6)for(let ri=0;ri<2;ri++){const ei=k%3,si=(k>>1)%4;k++;out.push({L:'INJ',f,fam,eq,exp:EXPS[ei],rest:RESTS[ri].join(','),inj:r+'/'+t,c:mk(f,fam,eq,ei,si,ri,{region:r,tier:t})});}
  for(const g of REGS)for(const t of ITIERS)for(const eq of ['commercial','crossfit','home_full','bodyweight'])for(const ex of EXPS)for(const fo of ['support_strength','support_athletic','support_prevention'])out.push({L:'L432',f:fo,fam:'none',eq,exp:ex,rest:'sun,wed',inj:g+'/'+t,c:Object.assign(clone(MARIO),{injury:{region:g,tier:t},equipment:eq,experience:ex,liftingFocus:fo})});
  for(const g of REGS)for(const t of ITIERS)for(const eq of ['bodyweight','home_basic'])for(const ex of EXPS)for(const fo of ['balanced','strength','hypertrophy'])for(const rd of [['sun','wed'],['sat','sun']])out.push({L:'LBW',f:fo,fam:'none',eq,exp:ex,rest:rd.join(','),inj:g+'/'+t,c:Object.assign(clone(MARIO),{injury:{region:g,tier:t},equipment:eq,experience:ex,liftingFocus:fo,restDays:rd})});
  return out;}
// g215's LAT_G (760) + LAT_K (630), verbatim shapes
const G_GOALS=[['run_5k',{}],['run_half',{}],['run_pace_goal',{targetDist:'1.5',targetMins:'10',targetSecs:'0'}],['run_base',{}],['run_10k',{}],['run_marathon',{}]];
const G_AGES=['18-35','36-54','55+'],G_SEEDS=[76308,1234,4242,9001,31337,555,8086,20260],G_REG=['shoulder','elbow','lowback','hip','knee','ankle'],G_TIERS=['commercial','crossfit','home_full','home_basic','bodyweight'];
function mkG(eq,gi,f,exp,age,si,inj){const [g,x]=G_GOALS[gi%G_GOALS.length];const c={name:'M',primaryPath:/^support_/.test(f)?'event':'goal',cardioTypes:['run'],cardioGoals:{run:Object.assign({id:g,label:g,mileBestMins:'8',mileBestSecs:'30',baselineDist:'3',baseline:'3mi'},x)},eventTargeted:false,liftingFocus:f,experience:exp,ageBracket:age,equipment:eq,unit:'lbs',restDays:RESTS[si%2].slice(),days:DAYS.slice(),bench:135,squat:155,deadlift:185,seed:G_SEEDS[si]};if(inj)c.injury=inj;return c;}
function g215(){const out=[];
  for(const eq of G_TIERS)for(let si=0;si<G_SEEDS.length;si++){FOC.forEach((f,fi)=>out.push({L:'G',eq,f,inj:'none',c:mkG(eq,si+fi,f,EXPS[(si+fi)%3],G_AGES[(si+2*fi)%3],si,null)}));
    G_REG.forEach((r,ri)=>ITIERS.forEach((t,ti)=>out.push({L:'G',eq,f:FOC[(si+ri+ti)%7],inj:r+'/'+t,c:mkG(eq,si+ri,FOC[(si+ri+ti)%7],EXPS[(si+ri)%3],G_AGES[(si+ti)%3],si,{region:r,tier:t})})));}
  for(const eq of G_TIERS)G_GOALS.forEach((_,gi)=>FOC.forEach((f,fi)=>EXPS.forEach((e,ei)=>{const si=(gi+fi+ei)%2;out.push({L:'K',eq,f,inj:'knee/protect',c:mkG(eq,gi,f,e,si?'55+':'18-35',si,{region:'knee',tier:'protect'})});})));
  return out;}
const base={primaryPath:'event',cardioTypes:['run'],eventTargeted:true,experience:'intermediate',ageBracket:'18-35',equipment:'crossfit',unit:'lbs',restDays:['sun','wed'],days:DAYS.slice(),bench:135,squat:155,deadlift:185};
const PRT=Object.assign({},base,{name:'PRT TING',liftingFocus:'support_athletic',raceDate:'2026-10-20',seed:87747,cardioGoals:{run:{id:'run_pace_goal',label:'Hit a Pace / Time Goal',mileBestMins:'8',mileBestSecs:'0',baselineDist:'3',baseline:'3mi',targetDist:'1.5',targetMins:'10',targetSecs:'30'}}});
// ── surgery (prior coach's anchors verbatim + two new) ──
function rep(h,a,b,tag){const n=h.split(a).length-1;P('  anchor ['+tag+'] count '+n);if(n!==1)throw new Error('anchor '+tag+' count '+n);return h.replace(a,()=>b);}
const AN={
  BW0:"const _bw=(bwPool,other)=>isBW?_bwRung(bwPool):other;",
  K:"_floorPool(_gear(['Barbell hip thrust','45° back extension','Cable pull-through']),2,'Single-leg glute bridge'):['Banded hip thrust','Single-leg glute bridge','Bodyweight back extension'];",
  AK:"hasBarbell?_gear(['Barbell hip thrust','45° back extension']):['Banded hip thrust','Single-leg glute bridge'];",
  LBPB:"_gear(['Neutral-grip chinups','Chinups','Lat pulldown','Assisted pullups']):['Banded hip thrust','Single-leg glute bridge'];",
  LBPH:"        hingePool = ['Banded hip thrust','Single-leg glute bridge'];",
  LBWB:"_gear(['Weighted chinups','Neutral-grip chinups','Lat pulldown','Chinups']):['Banded hip thrust','Single-leg hip thrust'];",
  B:"const _cost=it=>{ if(!it||_isStretch(it.name)) return 0; const s=_setCount(it.detail); return _isHalf(it.name)?s*0.5:s; };",
  A1:"    :_bw(['Single-leg glute bridge','Bodyweight back extension','Single-leg hip thrust (shoulders on bed)','Nordic hamstring curl (anchored)'],['Banded hip thrust','Single-leg glute bridge (weighted)','Nordic hamstring curl (anchored)','Bodyweight back extension']);",
  A2:"          {name:ex.hinge[0],detail:'2×8'}]});",
  R0:"function capRegionalFatigue(sections, role, cardio, goal){",
  R1:"const _capFor = r => Math.max(6, _setCap(r) - (r==='legs' ? _legCut : _uppCut));",
  R2:"((regionMoves[r]||0)-_moveCap(r))*4",
  R3:"(regionMoves[r]||0)>_moveCap(r))",
  R4:"),role,cardio,goal)};",
  FL:"  if(cfg.equipment==='bodyweight') bodyweightSweep(weeks, cfg.experience, cfg.liftingFocus==='support_prevention');\n",
  DC:"  deconflictAdjacentDupes(weeks, cfg, seed, totalWeeks);\n",
  RK:"    if(/secondary compound|conditioning|delts|chest volume|pull superset a|leg superset a/.test(L)) return 1;",
  T1:"        const _was=it.name;\n        if(_BW_SUBS[it.name]) it.name=_BW_SUBS[it.name];\n        else if(_BW_GEAR.test(it.name)) it.name=_bwFallback(it.name);\n",
  DIRTY:"    upper: chestCompoundPool!==_preInj.chest||rowPool!==_preInj.row||backCompoundPool!==_preInj.back\n  };\n",
  RK2:"    if(/superset b|biceps|triceps|leg isolation|calves|accessory|pump|chest \\+ knee/.test(L)) return 2;",
  SC:"        const score=sr*10+_itemRank(it.name);",
};
const surgW5=h=>{h=rep(h,AN.BW0,AN.BW0+"\n  const _bwHTlb=isBW?'Single-leg hip thrust (shoulders on bed)':'Banded hip thrust';\n  const _bwHTak=isBW?'Single-leg glute bridge':'Banded hip thrust';",'W5 lens');
  for(const k of ['K','AK'])h=rep(h,AN[k],AN[k].replace("'Banded hip thrust'","_bwHTak"),'W5 writer '+k);for(const k of ['LBPB','LBPH','LBWB'])h=rep(h,AN[k],AN[k].replace("'Banded hip thrust'","_bwHTlb"),'W5 writer '+k);return h;};
const surgB=h=>rep(h,AN.B,"const _prehabHalf=new Set([].concat(EXLIB.hip_stability,EXLIB.knee_stability,EXLIB.foot_ankle,EXLIB.foot_ankle_bw)); const _cost=it=>{ if(!it||_isStretch(it.name)) return 0; const s=_setCount(it.detail); return (_isHalf(it.name)||_prehabHalf.has(it.name))?s*0.5:s; };",'B _cost membership');
// A1x: the prevention subset is the LAST writer of hipExtPool (after every injury plan and the reservation), and the full pool is registered to the swap universe first
const surgA1x=h=>rep(h,AN.DIRTY,AN.DIRTY+"  if(preventionSupport){ _swapUniverseAdd(hipExtPool); hipExtPool=hipExtPool.filter(n=>/hip thrust|glute bridge|pull-?through/i.test(n)&&n!=='Barbell hip thrust'&&n!=='Cable pull-through'); }\n",'A1x prevention subset after the reservation');
const surgA1old=h=>rep(h,AN.A1,AN.A1+"\n  if(preventionSupport) hipExtPool=hipExtPool.filter(n=>/hip thrust|glute bridge|pull-?through/i.test(n)&&n!=='Barbell hip thrust'&&n!=='Cable pull-through');",'A1 (prior site) prevention pool subset');
const surgA2=h=>rep(h,AN.A2,"          {name:ex.hinge[0],detail:'2×8'}].concat((ex.hipExt&&ex.hipExt!==ex.hinge[0])?[{name:ex.hipExt,detail:'2×8 each'}]:[])});",'A2 fourth circuit item');
// A2r: the fourth circuit item is built on runner builds only, the gate D4's calf line already uses in the same block
const surgA2r=h=>rep(h,AN.A2,"          {name:ex.hinge[0],detail:'2×8'}].concat((_isRunner&&ex.hipExt&&ex.hipExt!==ex.hinge[0])?[{name:ex.hipExt,detail:'2×8 each'}]:[])});",'A2r fourth circuit item, runner builds only');
const surgA3=h=>{h=rep(h,AN.R0,"function capRegionalFatigue(sections, role, cardio, goal, prev){",'A3 signature');
  h=rep(h,AN.R1,AN.R1+"\n  const _moveCapFor = r => _moveCap(r) + ((prev && role==='legs' && r==='legs') ? 1 : 0);",'A3 sprawl allowance');
  h=rep(h,AN.R2,"((regionMoves[r]||0)-_moveCapFor(r))*4",'A3 overAmt'); h=rep(h,AN.R3,"(regionMoves[r]||0)>_moveCapFor(r))",'A3 over');
  return rep(h,AN.R4,"),role,cardio,goal,cfg.liftingFocus==='support_prevention')};",'A3 call site');};
const surgA4=h=>rep(h,AN.RK,"    if(/secondary compound|conditioning|delts|chest volume|pull superset a|leg superset a|calf — achilles/.test(L)) return 1;",'A4 achilles calf rank 1');
// A5: the added fourth circuit item is the first thing the regional trim takes (rank 3 at index >= 3 of the circuit; V124 per-item precedent)
const surgA5=h=>rep(h,AN.RK2,"    if(/^leg circuit/.test(L)) return (itemIdx>=3) ? 3 : 2;\n"+AN.RK2,'A5 fourth circuit item rank 3');
// A3c: the allowance exists only while the circuit holds four items (read live on `out`, like D85's count); no signature, no call site
const surgA3c=h=>{h=rep(h,AN.R1,AN.R1+"\n  const _moveCapFor = r => _moveCap(r) + ((role==='legs' && r==='legs' && out.some(s=>/^leg circuit/i.test((s&&s.label)||'')&&((s&&s.items)||[]).length>=4)) ? 1 : 0);",'A3c circuit-keyed sprawl allowance');
  h=rep(h,AN.R2,"((regionMoves[r]||0)-_moveCapFor(r))*4",'A3c overAmt'); return rep(h,AN.R3,"(regionMoves[r]||0)>_moveCapFor(r))",'A3c over');};
// A6: the fourth circuit item is rank-3 budget fodder (after the carry and the optional core's spare item, before every ruled training item)
const surgA6=h=>rep(h,AN.SC,"        const score=(((ii>=3)&&/^leg circuit/i.test((s&&s.label)||''))?3:sr)*10+_itemRank(it.name);",'A6 fourth circuit item budget rank 3');
const surgFL=h=>rep(h,AN.FL,"  if(cfg.equipment==='bodyweight'){ bodyweightSweep(weeks, cfg.experience, cfg.liftingFocus==='support_prevention');\n    if(cfg.injury) Object.keys(weeks).forEach(_w=>Object.keys(weeks[_w]||{}).forEach(_d=>{ const _day=weeks[_w][_d]; if(_day&&Array.isArray(_day.sections)) _day.sections=applyInjuryFilter(_day.sections,cfg); })); }\n",'FL post-sweep re-filter');
const tag=h=>rep(h,AN.T1,AN.T1+"        if(_was!==it.name){ it.__bw={src:(_BW_SUBS[_was]?'SUBS':'FB'),was:_was}; }\n",'sweep tag');
const snap=h=>rep(h,AN.DC,AN.DC+"  if(globalThis.__PRE!==undefined) globalThis.__PRE=JSON.stringify(weeks);\n",'pre-sweep snapshot');
const Ax1_=h=>surgA6(surgA5(surgA3c(surgA2(surgA1x(h)))));  // round 2: A1x + A2 (all prevention) + A3c + A5 + A6
const Ax_=h=>surgA6(surgA5(surgA3c(surgA2r(surgA1x(h)))));  // round 3 (the ruling): A1x + A2r (runner builds) + A3c + A5 + A6
const TREES=['V','B','W5','FL','Ax','ABx','ABn','ABo','PREx','ALLx','ALLxt','PRExt','ALLxs','ABx1','ALLx1','PRIORALL'];
const TP={};TREES.forEach(t=>TP[t]=F('t_'+t+'.html'));
const _VM={};function vm(t){if(_VM[t])return _VM[t];const X=load(TP[t]);const T=new Date(CLOCK+'T12:00:00').getTime();const RD=Date;class FD extends RD{constructor(...a){if(a.length)super(...a);else super(T);}static now(){return T;}}X.ctx.Date=FD;return _VM[t]=X;}
const stripJ=prog=>JSON.stringify(prog,(k,v)=>(k==='id'||k==='created'||k==='_swapUniverse'||k==='_swapUniverseByKey'||k==='__bw')?undefined:v);
function build(t,c,flags){const X=vm(t);(flags||[]).forEach(f=>X.ctx[f]=true);let p;try{p=X.buildProgram(clone(c));}catch(e){p={__crash:String(e&&e.message||e).slice(0,200),weeks:{}};}(flags||[]).forEach(f=>{delete X.ctx[f];});return p;}
const liveSecs=day=>(day&&!day.rest&&day.sections||[]).filter(s=>(s.items||[]).length);
const items=day=>{const o=[];liveSecs(day).forEach(s=>s.items.forEach(it=>{if(it&&it.name)o.push({lab:clean(s.label||s.coreHeader||''),n:clean(it.name),d:clean(it.detail||''),bw:it.__bw||null});}));return o;};
const daySig=day=>JSON.stringify(liveSecs(day).map(s=>[clean(s.label||''),s.coreHeader||'',s.rounds||'',!!s.superset,s.items.map(it=>[clean(it.name),clean(it.detail||'')])]));
const card=day=>liveSecs(day).map(s=>clean(s.label||s.coreHeader||'')+(s.superset?' (SS '+(s.rounds||'')+')':'')+' :: '+s.items.map(it=>clean(it.name)+' '+clean(it.detail||'')+(it.__bw?' [<'+it.__bw.was+']':'')).join(' | ')).join('\n        ');
const wk=p=>Object.keys(p.weeks||{}).sort((a,b)=>a-b);
const msetDiff=(a,b)=>{const m={};a.forEach(x=>m[x]=(m[x]||0)+1);const o=[];b.forEach(x=>{if(m[x])m[x]--;});Object.keys(m).forEach(k=>{for(let i=0;i<m[k];i++)o.push(k);});return o;};
// ops (M17's) ──
function ops(X,Y){const a=items(X),b=items(Y);const key=i=>i.lab+'\u0001'+i.n+'\u0001'+i.d;const m={};b.forEach(i=>(m[key(i)]=m[key(i)]||[]).push(i));const rem=[];
  a.forEach(i=>{const l=m[key(i)];if(l&&l.length)l.pop();else rem.push(i);});const add=[];Object.values(m).forEach(l=>l.forEach(i=>add.push(i)));const o=[];
  const take=(pred,kind)=>{for(let i=rem.length-1;i>=0;i--){const r=rem[i];const j=add.findIndex(x=>pred(r,x));if(j>=0){o.push({k:kind,r,a:add[j]});add.splice(j,1);rem.splice(i,1);}}};
  take((r,x)=>r.lab===x.lab&&r.n===x.n,'redetail');take((r,x)=>/^(Main|Primer)/.test(r.lab)&&/^(Main|Primer)/.test(x.lab),'rename');take((r,x)=>r.n===x.n,'relabel');take((r,x)=>r.lab===x.lab,'rename');
  rem.forEach(r=>o.push({k:'drop',r}));add.forEach(x=>o.push({k:'add',a:x}));return o;}
const opStr=o=>o.k+' '+(o.r?'['+o.r.lab+'] '+o.r.n+' '+o.r.d:'')+(o.r&&o.a?' -> ':'')+(o.a?'['+o.a.lab+'] '+o.a.n+' '+o.a.d:'');
const setsOf=d=>{const m=String(d).match(/^(\d+)\s*(×|sets)/);return m?+m[1]:null;};
// classify: M17's classes + the amendments this re-ruling proposes; `abl` = {regional:bool,budget:bool} for removals (lazy)
function classify(step,row,o,ctx){
  const eq=row.c.equipment,f=row.c.liftingFocus,inj=row.c.injury?row.c.injury.region+'/'+row.c.injury.tier:'none';
  const lab=(o.a||o.r).lab,labR=o.r?o.r.lab:'',labA=o.a?o.a.lab:'';const runner=!!(row.c.cardioTypes&&row.c.cardioTypes.includes('run'));
  const removal=o.r&&(o.k==='drop'||o.k==='rename');
  if(step==='B'){
    if(o.k==='redetail'&&o.r.n==='Landmine rotational press'&&/^3×15/.test(o.r.d)&&/^2×15/.test(o.a.d))return 'B-2';
    if(o.k==='rename'&&labR===labA&&ctx.pat(o.r.n)===ctx.pat(o.a.n))return 'B-3(adjacent-day re-space, same label, same pattern)';
    if(removal)return ctx.inBo(o.r)?'UNCLASSIFIED:B-removal(in budget-off)':'UNCLASSIFIED:B-removal';
    return ctx.inBo(o.a)?'B-1':'UNCLASSIFIED:B-not-in-budget-off';
  }
  if(step==='A'){
    if(f!=='support_prevention')return 'UNCLASSIFIED:A-outside-prevention';
    if(o.k==='add'&&labA===CIRC)return 'A-1';
    if(/^Leg isolation/.test(labR||labA)&&!runner){if(o.k==='redetail'&&setsOf(o.a.d)!=null&&setsOf(o.r.d)!=null&&setsOf(o.a.d)<setsOf(o.r.d))return 'A-3';return 'A-2('+o.k+')';}
    if(removal){const ab=ctx.abl(o.r);
      if(ab.budget&&!ab.regional){ if(/carry/i.test(labR)) return 'A-4(budget: carry finisher)'; if(ctx.isCore(o.r)) return 'A-4(budget: optional core item)'; return 'A-4(budget: '+labR.replace(/ — .*$/,'')+')'; }
      if(ab.regional)return 'UNCLASSIFIED:A-regional-removal '+labR.replace(/ — .*$/,'')+': '+o.r.n;
      return 'UNCLASSIFIED:A-removal(other) '+labR.replace(/ — .*$/,'')+': '+o.r.n;}
    if(/^Leg isolation/.test(lab)){if(runner)return 'UNCLASSIFIED:A-2-on-runner-day';if(o.k==='redetail'&&setsOf(o.a.d)!=null&&setsOf(o.r.d)!=null&&setsOf(o.a.d)<setsOf(o.r.d))return 'A-3';return 'A-2';}
    if(o.k==='relabel')return 'A-2(relabel '+labR+' -> '+labA+')';
    return 'UNCLASSIFIED:A-other';
  }
  if(step==='W5'){
    const PL=['ankle/protect','knee/protect','lowback/protect','lowback/workaround'];
    if(eq!=='bodyweight'||!PL.includes(inj))return 'UNCLASSIFIED:D196-outside-scope';
    if(o.k==='rename'&&/^(Main|Primer)/.test(labR)&&o.r.n==='Burpees'&&[BRIDGE,BEDHT].includes(o.a.n))return o.r.d===o.a.d?(/^Primer/.test(labR)?'D196-1(Primer label)':'D196-1'):'UNCLASSIFIED:D196-1-detail-changed';
    if(/^(ankle|knee)/.test(inj)){
      const AK=/^Leg superset [AB]|^Leg isolation|^Leg$|^Leg circuit/;
      if(removal){const ab=ctx.abl(o.r);if(ab.regional&&!ab.budget)return 'D196-6?(regional drop '+labR.replace(/ — .*$/,'')+': '+o.r.n+')';if(/^Leg circuit/.test(labR))return 'UNCLASSIFIED:D196-circuit-removal('+o.k+') '+o.r.n;}
      if(/^Leg circuit/.test(labR||labA))return 'D196-2(circuit '+o.k+')';
      if(AK.test(labR||labA)&&AK.test(labA||labR))return 'D196-2';
      if(inj==='knee/protect'&&o.k==='drop'&&/^(Leg isolation|Calves)/.test(labR))return 'D196-5';
      return 'UNCLASSIFIED:D196-ak-other';
    }
    if(o.k==='add'&&o.a.n==='Burpees'&&/^\d×10$/.test(o.a.d)&&/^Pull/.test(labA))return 'D196-3('+o.a.d+')';
    if(o.k==='relabel'&&labR==='Pull'&&labA==='Pull superset B')return 'D196-3';
    if(o.k==='rename'&&o.r.n==='Burpees'&&o.a.n===BEDHT&&/^\d+ sets — RPE 7 \(leave 3 or more in reserve\)$/.test(o.a.d))return 'D196-4';
    if(o.k==='rename'&&o.r.n==='Burpees'&&o.a.n===BEDHT&&o.r.d===o.a.d)return 'D196-L(accessory landing, detail verbatim)';
    return 'UNCLASSIFIED:D196-lb-other';
  }
  if(step==='FL'){
    if(eq!=='bodyweight'||inj==='none')return 'UNCLASSIFIED:D197-outside-scope';
    if(o.k==='redetail'&&/RPE 8/.test(o.r.d)&&/RPE 7/.test(o.a.d)&&!/RPE 8/.test(o.a.d))return 'D197-1';
    if(o.k==='drop'&&o.r.bw&&o.r.bw.src==='FB')return 'D197-2(own-plan drop of a sweep catch-all name: '+o.r.n+' < '+o.r.bw.was+' @'+inj+')';
    if(o.k==='drop'&&o.r.bw)return 'D197-2(own-plan drop of a sweep substitution: '+o.r.n+' < '+o.r.bw.was+' @'+inj+')';
    if(o.k==='drop')return 'UNCLASSIFIED:D197-drop(not a sweep landing) '+o.r.n+' @'+inj;
    return 'UNCLASSIFIED:D197-other';
  }
  return 'UNCLASSIFIED:?';
}
function mkCost(X){const EX=X.EXLIB;const prehab=new Set([].concat(EX.hip_stability||[],EX.knee_stability||[],EX.foot_ankle||[],EX.foot_ankle_bw||[]));const isStretch=/stretch|mobility|90\/90|foam|worlds greatest/i,isHalf=/carry|wall sit|\bhold\b|plank|pallof|dead bug|bird dog|hang|l-sit|wiper|hollow|clamshell|side steps|side-lying|leg raises/i;const scC={};
  const sc=d=>{if(d in scC)return scC[d];return scC[d]=+X.eval('_setCount('+JSON.stringify(d)+')');};
  return {total:day=>liveSecs(day).reduce((a,s)=>a+s.items.reduce((b,it)=>{if(!it||!it.name||isStretch.test(it.name))return b;const n=sc(it.detail||'');return b+((isHalf.test(it.name)||prehab.has(it.name))?n*0.5:n);},0),0),
    cap:day=>{X.ctx.__CD=(day&&day.cardio)||null;const i=+X.eval('_cardioInterference(__CD)');return Math.max(12,20-Math.round(i*2));}};}
// ════════ PREP ════════
function prep(){
  Object.values(TP).forEach(f=>{if(!/PRIORALL/.test(f))try{fs.unlinkSync(f);}catch(e){}});fs.readdirSync(SCR).filter(f=>/^res_/.test(f)).forEach(f=>fs.unlinkSync(F(f)));
  const src=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');const ver=(src.match(/<meta name="ia-version" content="(\d+)"/)||[])[1];
  const head=cp.execSync('git rev-parse --short HEAD',{cwd:ROOT}).toString().trim(),git=cp.execSync('git show HEAD:index.html',{cwd:ROOT,maxBuffer:1<<26}).toString();
  P('PREP ia-version '+ver+' HEAD '+head+' working tree == HEAD:index.html '+(git===src)+' sha '+sha(src)+' | PRIORALL sha '+sha(fs.readFileSync(TP.PRIORALL,'utf8')));
  const T={};T.V=src;P('B:');T.B=surgB(src);P('W5:');T.W5=surgW5(src);P('FL:');T.FL=surgFL(src);
  P('Ax (A1x + A2 + A3 + A5, no B):');T.Ax=Ax_(src);P('ABx (B + Ax):');T.ABx=surgB(T.Ax);
  P('ABn (B + A1x + A2r + A3c, NO A5 NO A6):');T.ABn=surgB(surgA3c(surgA2r(surgA1x(src))));
  P('ABo (B + A1 prior site + A2r + A3c + A5 + A6):');T.ABo=surgB(surgA6(surgA5(surgA3c(surgA2r(surgA1old(src))))));
  P('ABx1 / ALLx1 (round 2: A2 ungated):');T.ABx1=surgB(Ax1_(src));T.ALLx1=surgFL(surgB(Ax1_(T.W5)));
  P('PREx (W5 + B + Ax):');T.PREx=surgB(Ax_(T.W5));P('ALLx (PREx + FL):');T.ALLx=surgFL(T.PREx);
  P('tag/snap trees:');T.ALLxt=tag(T.ALLx);T.PRExt=tag(T.PREx);T.ALLxs=snap(T.ALLx);
  TREES.filter(t=>t!=='PRIORALL').forEach(t=>fs.writeFileSync(TP[t],T[t]));
  P('\nHALF_MANNY digests (fixture seed '+fixtures.HALF_MANNY.seed+', clock pinned '+CLOCK+'):');
  const dg={};for(const t of TREES){const X=vm(t);const a=progDigest(X.buildProgram(clone(fixtures.HALF_MANNY))),b=progDigest(X.buildProgram(clone(fixtures.HALF_MANNY)));dg[t]=a;P('  '+t.padEnd(9)+a+(a===b?'':'  SELF-IDENTITY FAIL '+b)+'  universe '+(X.buildProgram(clone(fixtures.HALF_MANNY))._swapUniverse||[]).length);}
  P('  == V230: '+TREES.filter(t=>dg[t]===dg.V).join(' ')+' | moved: '+TREES.filter(t=>dg[t]!==dg.V).map(t=>t+'='+dg[t]).join(' '));
  P('PRT TING digests: '+['V','B','Ax','ABx','PREx','ALLx','PRIORALL'].map(t=>t+'='+progDigest(vm(t).buildProgram(clone(PRT)))).join(' '));
  const L=lattice().filter((x,i)=>i%173===0);let n=0,neu=0,neu2=0;for(const c of L){n++;if(stripJ(build('ALLx',c.c))===stripJ(build('ALLxt',c.c)))neu++;if(stripJ(build('PREx',c.c))===stripJ(build('PRExt',c.c)))neu2++;}P('tag neutrality ALLx vs ALLxt '+neu+'/'+n+' | PREx vs PRExt '+neu2+'/'+n);
  const t0=Date.now();for(let i=0;i<10;i++)build('ALLx',L[i%L.length].c);P('ms/build ~'+((Date.now()-t0)/10).toFixed(0));
  P('PREP DONE');
}
// ════════ WORKERS ════════
const PREV=()=>lattice().filter(x=>x.f==='support_prevention');
function clsCell(row){const R={ops:[],days:0,chg:{},vall:0,vprior:0,crash:null};
  const P0={};for(const t of ['V','B','ABx','PREx','ALLx','PRIORALL','ALLx1'])P0[t]=build(t,row.c);R.vx1=0;R.x1ops=[];const cr=Object.keys(P0).filter(t=>P0[t].__crash);if(cr.length){R.crash=cr.join(',');return R;}
  const Xv=vm('V');const pat=n=>Xv.eval('_pattern('+JSON.stringify(n)+')')||'-';
  const Vbo=build('V',row.c,['__BUDGET_OFF']);const ABL={};
  const flagDay=(t,fl,w,d)=>{const k=t+fl;ABL[k]=ABL[k]||build(t,row.c,[fl]);const Z=ABL[k].weeks&&ABL[k].weeks[w]&&ABL[k].weeks[w][d];return items(Z);};
  const CHAIN=[['B','V','B'],['A','B','ABx'],['W5','ABx','PREx'],['FL','PREx','ALLx']];
  wk(P0.V).forEach(w=>ORDER.forEach(d=>{R.days++;const sV=daySig(P0.V.weeks[w][d]),sA=daySig(P0.ALLx.weeks[w]&&P0.ALLx.weeks[w][d]),sP=daySig(P0.PRIORALL.weeks[w]&&P0.PRIORALL.weeks[w][d]);if(sV!==sA)R.vall++;if(sP!==sA)R.vprior++;const s1=daySig(P0.ALLx1.weeks[w]&&P0.ALLx1.weeks[w][d]);if(s1!==sA){R.vx1++;ops(P0.ALLx1.weeks[w][d],P0.ALLx.weeks[w][d]).forEach(o=>R.x1ops.push({w:+w,d,s:opStr(o)}));}
    for(const [step,x,y] of CHAIN){const X=P0[x].weeks[w]&&P0[x].weeks[w][d],Y=P0[y].weeks[w]&&P0[y].weeks[w][d];if(daySig(X)===daySig(Y))continue;bump(R.chg,step);
      const bo=items(Vbo.weeks&&Vbo.weeks[w]&&Vbo.weeks[w][d]);const coreLabs=new Set(liveSecs(X||{}).filter(s=>s.core||s.optional).map(s=>clean(s.label||s.coreHeader||'')));
      const ctx={pat,inBo:it=>bo.some(z=>z.n===it.n&&z.d===it.d),isCore:it=>coreLabs.has(it.lab),abl:it=>({regional:flagDay(y,'__REGIONAL_OFF',w,d).some(z=>z.n===it.n),budget:flagDay(y,'__BUDGET_OFF',w,d).some(z=>z.n===it.n)})};
      const os=ops(X,Y);os.forEach(o=>{const c=classify(step,row,o,ctx);R.ops.push({step,c,w:+w,d,s:opStr(o),cx:/^UNCLASSIFIED/.test(c)?(x+': '+card(X)+'\n              '+y+': '+card(Y)):null});});}}));
  return R;}
function prevCell(row){const R={};for(const t of ['V','B','ABx','ABn'])R[t]=build(t,row.c);const rec={k:row.L+' '+row.f+'|'+row.fam+'|'+row.eq+'|'+row.inj+'|'+row.exp+'|s'+row.c.seed+'|'+row.rest,inj:row.inj,eq:row.eq,fam:row.fam,legs:[],nonLeg:0,crash:Object.keys(R).filter(t=>R[t].__crash).join(',')};if(rec.crash)return rec;
  const cost=mkCost(vm('B'));let Rbo=null,Rro=null;
  wk(R.V).forEach(w=>ORDER.forEach(d=>{const dv=R.V.weeks[w][d];if(!dv||!liveSecs(dv).length)return;
    const circ=t=>liveSecs(R[t].weeks[w]&&R[t].weeks[w][d]||{}).find(s=>clean(s.label)===CIRC)||null;const has=(t,re)=>liveSecs(R[t].weeks[w]&&R[t].weeks[w][d]||{}).some(s=>re.test(clean(s.label)));
    if(!circ('V')){if(daySig(R.ABx.weeks[w][d])!==daySig(R.B.weeks[w][d]))rec.nonLeg++;return;}
    const nm=t=>items(R[t].weeks[w][d]).map(x=>x.lab+' :: '+x.n);const c2=t=>{const c=circ(t);return c?c.items.slice(0,2).map(i=>clean(i.name)).join(' > '):'(no circuit)';};
    const rem=msetDiff(nm('B'),nm('ABx')),add=msetDiff(nm('ABx'),nm('B'));
    const row2={w:+w,d,cardio:(dv.cardio?(dv.cardio.subtype||dv.cardio.type):'-'),exp:row.exp,rest:row.rest,circ:{V:circ('V').items.length,B:(circ('B')||{items:[]}).items.length,ABx:(circ('ABx')||{items:[]}).items.length,ABn:(circ('ABn')||{items:[]}).items.length},
      first2same:c2('B')===c2('ABx'),first2sameN:c2('B')===c2('ABn'),calf:{B:has('B',/^Calf — achilles/),ABx:has('ABx',/^Calf — achilles/),ABn:has('ABn',/^Calf — achilles/)},carry:{B:has('B',/carry/i),ABx:has('ABx',/carry/i),ABn:has('ABn',/carry/i)},
      rem,add,fourth:(circ('ABx')&&circ('ABx').items.length>=4)?clean(circ('ABx').items[3].name):null,
      bud:(rem.length||add.length>1)?{capB:cost.cap(R.B.weeks[w][d]),totB:cost.total(R.B.weeks[w][d]),totABx:cost.total(R.ABx.weeks[w][d]),totABxBO:(()=>{Rbo=Rbo||build('ABx',row.c,['__BUDGET_OFF']);return cost.total(Rbo.weeks[w][d]);})()}:null,
      abl:rem.length?rem.map(x=>{const n=x.split(' :: ')[1];Rbo=Rbo||build('ABx',row.c,['__BUDGET_OFF']);Rro=Rro||build('ABx',row.c,['__REGIONAL_OFF']);const hb=items(Rbo.weeks[w][d]).some(z=>z.n===n),hr=items(Rro.weeks[w][d]).some(z=>z.n===n);return x+' ['+((hr?'regional ':'')+(hb?'budget':'')||'neither')+']';}):[]};
    rec.legs.push(row2);}));
  return rec;}
function kCell(row){const FB_FROM="(_R==='knee'&&_T==='protect') ? _floorPool(_left,1,'Bodyweight back extension') : _left",FB_TO='_left';
  const rec={k:row.L+' '+row.eq+'|'+row.f+'|'+row.inj+'|'+row.c.experience+'|'+row.c.ageBracket+'|s'+row.c.seed+'|'+row.c.restDays.join(','),L:row.L,eq:row.eq,f:row.f,inj:row.inj,fire:{},fl:[],crash:''};
  if(row.L==='K'){for(const t of ['V','ABx','ALLx','PRIORALL']){if(!kCell.CF)kCell.CF={};if(!kCell.CF[t]){const html=vm(t).html;const c=html.split(FB_FROM).length-1;if(c!==1){rec.crash+='FB anchor '+t+' '+c+';';continue;}const f=F('cfB_'+t+'.html');fs.writeFileSync(f,html.replace(FB_FROM,()=>FB_TO));kCell.CF[t]=load(f);}
    const p=build(t,row.c);let q;try{q=kCell.CF[t].buildProgram(clone(row.c));}catch(e){q={__crash:1};}rec.fire[t]=(p.__crash||q.__crash)?'crash':(progDigest(p)!==progDigest(q));}}
  // D197 differential PRExt -> ALLx (tagged PRE so dropped names carry __bw.was)
  const pP=build('PRExt',row.c),pA=build('ALLx',row.c);if(pP.__crash||pA.__crash){rec.crash+='build;';return rec;}
  wk(pP).forEach(w=>ORDER.forEach(d=>{const X=pP.weeks[w]&&pP.weeks[w][d],Y=pA.weeks[w]&&pA.weeks[w][d];if(daySig(X)===daySig(Y))return;ops(X,Y).forEach(o=>rec.fl.push({w:+w,d,c:classify('FL',row,o,{}),s:opStr(o)}));}));
  return rec;}
function uniCell(row){const pv=build('V',row.c);if(pv.__crash)return {k:row.L,prev:row.f==='support_prevention',crash:1};const uv=new Set(pv._swapUniverse||[]);const o={k:row.L,eq:row.eq,prev:row.f==='support_prevention',t:{}};
  for(const t of ['Ax','W5','ALLx','PRIORALL']){const pt=build(t,row.c);if(pt.__crash){o.t[t]={crash:1};continue;}const ut=new Set(pt._swapUniverse||[]);o.t[t]={lost:[...uv].filter(n=>!ut.has(n)),gain:[...ut].filter(n=>!uv.has(n))};}return o;}
function worker(spec){const [job,i0,i1]=spec.split(':');let out=[];
  if(job==='cls')out=lattice().slice(+i0,+i1).map(r=>Object.assign({k:r.L+' '+r.f+'|'+r.fam+'|'+r.eq+'|'+r.inj+'|'+r.exp+'|s'+r.c.seed+'|'+r.rest,L:r.L,f:r.f,fam:r.fam,eq:r.eq,inj:r.inj,exp:r.exp,rest:r.rest,runner:!!(r.c.cardioTypes&&r.c.cardioTypes.includes('run'))},clsCell(r)));
  else if(job==='prev')out=PREV().slice(+i0,+i1).map(prevCell);
  else if(job==='k')out=g215().slice(+i0,+i1).map(kCell);
  else if(job==='uni')out=lattice().filter(x=>x.L==='FULL'||x.L==='L432').slice(+i0,+i1).map(uniCell);
  fs.writeFileSync(F('res_'+spec.replace(/:/g,'_')+'.json'),JSON.stringify(out));P('worker '+spec+' cells '+out.length);}
function run(){return new Promise(done=>{const jobs=[];const add=(job,N,CH)=>{for(let i=0;i<N;i+=CH)jobs.push(job+':'+i+':'+Math.min(N,i+CH));};
  const J=(process.env.JOBS||'cls,prev,k,uni').split(',');if(J.includes('cls'))add('cls',lattice().length,288);if(J.includes('prev'))add('prev',PREV().length,84);if(J.includes('k'))add('k',g215().length,139);if(J.includes('uni'))add('uni',lattice().filter(x=>x.L==='FULL'||x.L==='L432').length,432);
  const par=+(process.env.PAR||6);let i=0,crash=0;const t0=Date.now();
  const one=j=>new Promise(res=>{const p=cp.spawn(process.execPath,['--max-old-space-size=4096',__filename],{env:Object.assign({},process.env,{WORKER:j,PART:'none'}),stdio:['ignore','pipe','pipe']});let o='';p.stdout.on('data',x=>o+=x);p.stderr.on('data',x=>o+=x);p.on('exit',code=>{if(code){crash++;P('WORKER CRASH '+j+' '+o.slice(-800));}else P(o.trim());res();});});
  Promise.all(Array.from({length:par},async()=>{while(i<jobs.length)await one(jobs[i++]);})).then(()=>{P('RUN jobs '+jobs.length+' crashes '+crash+' '+((Date.now()-t0)/1000).toFixed(0)+' s');done();});});}
const loadRes=pre=>{const R=[];fs.readdirSync(SCR).filter(f=>new RegExp('^res_'+pre+'_.*\\.json$').test(f)).sort().forEach(f=>JSON.parse(fs.readFileSync(F(f),'utf8')).forEach(x=>R.push(x)));return R;};
// ════════ REPORT ════════
function report(){
  const C=loadRes('cls');P('\n################ (1) CLASSIFIER V -> B -> ABx -> PREx -> ALLx on M17\'s lattice: '+C.length+' configs ('+fmt(tally(C,x=>x.L))+'), crashes '+C.filter(x=>x.crash).length+(C.some(x=>x.crash)?' '+fmt(tally(C.filter(x=>x.crash),x=>x.crash)):''));
  P('  ALLx (round 3, A2 runner-gated) vs ALLx1 (round 2, A2 on every prevention build): programs differing '+C.filter(x=>x.vx1).length+', days '+C.reduce((a,x)=>a+x.vx1,0)+' | by INJ '+fmt(tally(C.filter(x=>x.vx1),x=>x.inj))+' | by FAM '+fmt(tally(C.filter(x=>x.vx1),x=>x.fam))+' | ops '+fmt(tally(C.flatMap(x=>x.x1ops),o=>o.s.replace(/ \d.*$/,'').replace(/\] [^\]]*$/,']'))).slice(0,1400));
  const days=C.reduce((a,x)=>a+x.days,0);P('  V->ALLx: programs changed '+C.filter(x=>x.vall).length+'/'+C.length+', days '+C.reduce((a,x)=>a+x.vall,0)+'/'+days+' | ALLx vs PRIOR ALL (coach1 t_ALL): programs differing '+C.filter(x=>x.vprior).length+', days '+C.reduce((a,x)=>a+x.vprior,0)+' by L: '+fmt(tally(C.filter(x=>x.vprior),x=>x.L))+' | by INJ: '+fmt(tally(C.filter(x=>x.vprior),x=>x.inj)));
  for(const step of ['B','A','W5','FL']){const O=C.flatMap(x=>x.ops.filter(o=>o.step===step).map(o=>Object.assign({row:x},o)));const dayc=C.reduce((a,x)=>a+(x.chg[step]||0),0);
    P('\n  STEP '+step+': days changed '+dayc+' | ops '+O.length+' | UNCLASSIFIED ops '+O.filter(o=>/^UNCLASSIFIED/.test(o.c)).length);
    const T=tally(O,o=>o.c);Object.keys(T).sort((a,b)=>T[b]-T[a]).forEach(c=>{const S=O.filter(o=>o.c===c);P('    '+String(T[c]).padStart(6)+'  '+c+'   | INJ '+fmt(tally(S,o=>o.row.inj)).slice(0,260)+' | TIER '+fmt(tally(S,o=>o.row.eq)).slice(0,200)+' | FAM '+fmt(tally(S,o=>o.row.fam))+' | runner '+S.filter(o=>o.row.runner).length);
      S.slice(0,/UNCLASSIFIED|A-4|B-3|D196-6|D197-2/.test(c)?3:1).forEach(o=>P('          e.g. '+o.row.k+' W'+o.w+' '+o.d+' :: '+o.s+(o.cx?'\n              '+o.cx:'')));});}
  const PR=loadRes('prev');const legs=PR.flatMap(r=>r.legs.map(x=>Object.assign({k:r.k,inj:r.inj,eq:r.eq,fam:r.fam},x)));
  P('\n################ (2) D195 amended (ABx = B + A1x/A2/A3/A5) vs B on EVERY prevention build in the lattice: '+PR.length+' builds (crash '+PR.filter(r=>r.crash).length+'), leg days '+legs.length+', non-leg days ABx != B: '+PR.reduce((a,r)=>a+r.nonLeg,0));
  const run=legs.filter(x=>x.fam!=='none'),dry=legs.filter(x=>x.cardio==='-'),stk=legs.filter(x=>x.cardio!=='-');
  P('  leg days by family: '+fmt(tally(legs,x=>x.fam))+' | 4th printed by family: '+fmt(tally(legs.filter(x=>x.circ.ABx===4),x=>x.fam))+' | non-runner (fam none) leg days ABx != B: '+legs.filter(x=>x.fam==='none'&&(x.rem.length||x.add.length||x.circ.ABx!==x.circ.B)).length);
  P('  fourth item printed: '+legs.filter(x=>x.circ.ABx===4).length+'/'+legs.length+' (dry '+dry.filter(x=>x.circ.ABx===4).length+'/'+dry.length+', run-stacked '+stk.filter(x=>x.circ.ABx===4).length+'/'+stk.length+') | without A5 (ABn): '+legs.filter(x=>x.circ.ABn===4).length);
  P('  calf lost (B has, ABx lacks): '+legs.filter(x=>x.calf.B&&!x.calf.ABx).length+'/'+legs.filter(x=>x.calf.B).length+' | without A5: '+legs.filter(x=>x.calf.B&&!x.calf.ABn).length);
  P('  carry lost (B has, ABx lacks): '+legs.filter(x=>x.carry.B&&!x.carry.ABx).length+'/'+legs.filter(x=>x.carry.B).length+' by plan x tier: '+fmt(tally(legs.filter(x=>x.carry.B&&!x.carry.ABx),x=>x.inj+' '+x.eq))+' | by fam: '+fmt(tally(legs.filter(x=>x.carry.B&&!x.carry.ABx),x=>x.fam))+' | on runner programs: '+legs.filter(x=>x.carry.B&&!x.carry.ABx&&x.fam!=='none').length);
  P('  circuit positions 1-2 changed B -> ABx: '+legs.filter(x=>!x.first2same).length+'/'+legs.length+' | without A5: '+legs.filter(x=>!x.first2sameN).length+' '+fmt(tally(legs.filter(x=>!x.first2sameN),x=>x.inj+' '+x.eq+' {'+x.cardio+'}')).slice(0,300));
  P('  items removed B -> ABx: '+legs.reduce((a,x)=>a+x.rem.length,0)+' '+fmt(tally(legs.flatMap(x=>x.abl),x=>x)).slice(0,900));
  P('  removal days by plan x tier x fam: '+fmt(tally(legs.filter(x=>x.rem.length),x=>x.inj+' '+x.eq+' '+x.fam)).slice(0,900));
  const bd=legs.filter(x=>x.bud);P('  budget view on removal/extra-add days ('+bd.length+'): B final total vs cap: '+fmt(tally(bd,x=>'B '+x.bud.totB+'/'+x.bud.capB))+' | ABx budget-off total: '+fmt(tally(bd,x=>'off '+x.bud.totABxBO+'/'+x.bud.capB))+' | ABx final: '+fmt(tally(bd,x=>'final '+x.bud.totABx+'/'+x.bud.capB)));
  P('  items added B -> ABx beyond the 4th: '+fmt(tally(legs.flatMap(x=>x.add.filter(a=>!/^Leg circuit/.test(a))),x=>x)).slice(0,600));
  P('  4th item NOT built, by plan x tier: '+fmt(tally(legs.filter(x=>x.circ.ABx<4),x=>x.inj+' '+x.eq)).slice(0,1200));
  P('  4th item by plan :: name: '+fmt(tally(legs.filter(x=>x.circ.ABx===4),x=>x.inj+' :: '+x.fourth)).slice(0,1500));
  P('  knee/protect days carrying a 4th item: '+legs.filter(x=>x.inj==='knee/protect'&&x.circ.ABx===4).length+'/'+legs.filter(x=>x.inj==='knee/protect').length+' | Bodyweight back extension as 4th anywhere: '+legs.filter(x=>x.fourth==='Bodyweight back extension').length+' '+fmt(tally(legs.filter(x=>x.fourth==='Bodyweight back extension'),x=>x.inj+' '+x.eq)));
  P('  stacked-run days where the thrust yields (ABx 3 items, dry same cell prints 4): '+stk.filter(x=>x.circ.ABx<4&&x.circ.ABn===4).length+' | by rest x exp: '+fmt(tally(stk.filter(x=>x.circ.ABx<4&&x.circ.ABn===4),x=>x.rest+' '+x.exp+' {'+x.cardio+'}')).slice(0,400));
  const K=loadRes('k');P('\n################ (3) g215 lattices (LAT_G '+K.filter(x=>x.L==='G').length+' + LAT_K '+K.filter(x=>x.L==='K').length+'), crash '+K.filter(x=>x.crash).length);
  const KK=K.filter(x=>x.L==='K');for(const t of ['V','ABx','ALLx','PRIORALL'])P('  floor (b) fires on '+t.padEnd(8)+' : '+G_TIERS.map(e=>e+' '+KK.filter(x=>x.eq===e&&x.fire[t]===true).length+'/'+KK.filter(x=>x.eq===e).length).join(', ')+'  | prevention cells firing: '+KK.filter(x=>x.f==='support_prevention'&&x.fire[t]===true).length+'/'+KK.filter(x=>x.f==='support_prevention').length);
  const FLo=K.flatMap(x=>x.fl.map(o=>Object.assign({row:x},o)));P('  D197 ops PREx -> ALLx on g215 lattices: '+FLo.length+' | '+fmt(tally(FLo,o=>o.c)));FLo.filter(o=>/drop|UNCL/.test(o.c)).slice(0,12).forEach(o=>P('     '+o.row.k+' W'+o.w+' '+o.d+' :: '+o.s));
  const U=loadRes('uni');P('\n################ (4) swap universe V vs tree, FULL + L432 ('+U.length+'; prevention '+U.filter(x=>x.prev).length+')');
  for(const t of ['Ax','W5','ALLx','PRIORALL'])for(const pv of [true,false]){const S=U.filter(x=>x.prev===pv&&x.t&&x.t[t]&&!x.t[t].crash);const ch=S.filter(x=>x.t[t].lost.length||x.t[t].gain.length);P('  '+t.padEnd(8)+(pv?'PREV':'CTRL')+' universe changed '+ch.length+'/'+S.length+' by tier: '+TIERS6.map(e=>e+' '+ch.filter(x=>x.eq===e).length+'/'+S.filter(x=>x.eq===e).length).join(', ')+' | names: '+fmt(tally(ch.flatMap(x=>x.t[t].lost.map(n=>'-'+n).concat(x.t[t].gain.map(n=>'+'+n))),n=>n)).slice(0,500));}
  P('REPORT DONE');
}
// ════════ CARDS ════════
function cards(){
  const L=lattice();const find=(pred)=>L.find(pred);
  const show=(title,cell,daysWanted,trees)=>{P('\n=== '+title+'\n    cfg '+cell.L+' '+cell.f+'|'+cell.fam+'|'+cell.eq+'|'+cell.inj+'|'+cell.exp+'|s'+cell.c.seed+'|'+cell.rest);const PS={};trees.forEach(t=>PS[t]=build(t,cell.c));const cost=mkCost(vm('B'));
    for(const [w,d] of daysWanted){P('  W'+w+' '+d+(PS[trees[0]].weeks[w]&&PS[trees[0]].weeks[w][d]&&PS[trees[0]].weeks[w][d].cardio?' {'+(PS[trees[0]].weeks[w][d].cardio.subtype||PS[trees[0]].weeks[w][d].cardio.type)+'}':' {dry}'));
      trees.forEach((t,i)=>{const dy=PS[t].weeks[w]&&PS[t].weeks[w][d];const same=i>0&&daySig(dy)===daySig(PS[trees[i-1]].weeks[w]&&PS[trees[i-1]].weeks[w][d]);P('    ['+t.padEnd(8)+'] budget '+cost.total(dy||{})+'/'+cost.cap(dy||{})+(same?' (identical to '+trees[i-1]+')':'\n        '+card(dy||{})));});}};
  // F1: carry lost on shoulder/protect prevention runner day (M17's example)
  const f1=find(x=>x.L==='INJ'&&x.inj==='shoulder/protect'&&x.f==='support_prevention'&&x.eq==='commercial'&&x.fam==='race');
  if(f1){const pB=build('B',f1.c);const legDay=w=>ORDER.find(d=>liveSecs(pB.weeks[w]&&pB.weeks[w][d]||{}).some(s=>clean(s.label)===CIRC));show('F1 shoulder/protect prevention runner leg day: B vs ABx vs ABx budget-off',f1,[[1,legDay(1)],[2,legDay(2)],[4,legDay(4)]],['V','B','ABx']);
    vm('ABx').ctx.__BUDGET_OFF=true;const po=build('ABx',f1.c);delete vm('ABx').ctx.__BUDGET_OFF;const cost=mkCost(vm('B'));for(const w of [1,2]){const d=legDay(w);P('    [ABx bo ] budget '+cost.total(po.weeks[w][d])+'/'+cost.cap(po.weeks[w][d])+'\n        '+card(po.weeks[w][d]));}}
  const f1e=find(x=>x.L==='INJ'&&x.inj==='elbow/protect'&&x.f==='support_prevention'&&/commercial|crossfit/.test(x.eq)&&x.fam!=='none');if(f1e){const pB=build('B',f1e.c);const d1=ORDER.find(d=>liveSecs(pB.weeks[1]&&pB.weeks[1][d]||{}).some(s=>clean(s.label)===CIRC));show('F1b elbow/protect prevention runner leg day',f1e,[[1,d1],[2,d1]],['B','ABx']);}
  const fh=find(x=>x.L==='INJ'&&x.inj==='shoulder/protect'&&x.f==='support_prevention'&&x.eq==='commercial'&&x.fam==='test'&&x.exp==='intermediate'&&x.c.seed===87747&&x.rest==='sat,sun');
  if(fh)show('F1c round-1 hold-loss cell (shoulder/protect, stacked W3 mon): B / ABx1 (A5 only) / ABx (A5 + A6)',fh,[[3,'mon'],[1,'mon']],['B','ABx1','ABx']);
  P('\n=== station classes: '+['Glute-ham raise','Barbell good mornings','Dumbbell split-stance deadlift','Single-leg hip thrust','Barbell hip thrust'].map(n=>n+' = '+vm('V').eval('_stationClass('+JSON.stringify(n)+')')).join(' | '));
  // F2: the circuit lunge removal cell (M17 example: FULL prevention race bodyweight beginner s76308 sat/sun W3 mon)
  const f2=find(x=>x.L==='FULL'&&x.f==='support_prevention'&&x.fam==='race'&&x.eq==='bodyweight'&&x.exp==='beginner'&&x.c.seed===76308&&x.rest==='sat,sun');if(f2)show('F2 M17 circuit-lunge cell: B vs ABn (no A5/A6) vs ABx',f2,[[3,'mon'],[1,'mon']],['B','ABn','ABx','PRIORALL']);
  // the prior ruling's stacked cell
  const f2b=find(x=>x.L==='FULL'&&x.f==='support_prevention'&&x.fam==='race'&&x.eq==='commercial'&&x.exp==='beginner'&&x.c.seed===87747&&x.rest==='sat,sun');if(f2b)show('F2b prior ruling D195-A-d cell (stacked speed run W1 mon): V / B / ABn / ABx',f2b,[[1,'mon'],[3,'mon']],['V','B','ABn','ABx']);
  // F3: knee/protect commercial prevention beginner run_5k s76308 W1 thu (M17 F2 example) V vs PRIORALL vs ALLx
  const g=g215();const f3=g.find(x=>x.L==='K'&&x.eq==='commercial'&&x.f==='support_prevention'&&x.c.experience==='beginner'&&x.c.cardioGoals.run.id==='run_5k'&&x.c.seed===76308);
  if(f3){const cell={L:'K',f:f3.f,fam:'race',eq:f3.eq,inj:f3.inj,exp:f3.c.experience,rest:f3.c.restDays.join(','),c:f3.c};show('F3 knee/protect commercial prevention (g215 cell): V / PRIORALL / ALLx',cell,[[1,'thu'],[3,'thu']],['V','PRIORALL','ALLx']);}
  // F4: D197 drop cell (ankle/workaround bodyweight hypertrophy s4242) with the sweep source
  const f4=g.find(x=>x.L==='G'&&x.inj==='ankle/workaround'&&x.eq==='bodyweight'&&x.f==='hypertrophy'&&x.c.seed===4242);
  if(f4){const cell={L:'G',f:f4.f,fam:'race',eq:f4.eq,inj:f4.inj,exp:f4.c.experience,rest:f4.c.restDays.join(','),c:f4.c};P('    (age '+f4.c.ageBracket+', goal '+f4.c.cardioGoals.run.id+')');show('F4 D197 drop cell: V / PRExt (tagged: [<source]) / ALLx',cell,[[1,'mon'],[2,'mon']],['V','PRExt','ALLx']);}
  // F6d: ankle/protect bodyweight circuit bridge drop under W5 (regional) — find one from the cls results
  const C=loadRes('cls');const ex6=C.find(x=>x.ops.some(o=>/D196-6\?/.test(o.c)));
  if(ex6){const cell=L.find(x=>(x.L+' '+x.f+'|'+x.fam+'|'+x.eq+'|'+x.inj+'|'+x.exp+'|s'+x.c.seed+'|'+x.rest)===ex6.k);const o=ex6.ops.find(o=>/D196-6\?/.test(o.c));
    if(cell){show('F6d W5-step regional drop example (ABx -> PREx), with PREx regional-off and the pre-sweep snapshot',cell,[[o.w,o.d]],['ABx','PREx','ALLx']);
      vm('PREx').ctx.__REGIONAL_OFF=true;const pr=build('PREx',cell.c);delete vm('PREx').ctx.__REGIONAL_OFF;P('    [PREx regional-off]\n        '+card(pr.weeks[o.w][o.d]));
      const X=vm('ALLxs');X.eval('globalThis.__PRE=null');const p=X.buildProgram(clone(cell.c));const pre=JSON.parse(X.eval('globalThis.__PRE'));X.eval('globalThis.__PRE=undefined');P('    [ALLx pre-sweep snapshot]\n        '+card(pre[o.w][o.d])+'\n    [ALLx final]\n        '+card(p.weeks[o.w][o.d]));}}
  // F7: B's rename: knee/workaround W7 wed Barbell good mornings -> Dumbbell split-stance deadlift
  const ex7=C.find(x=>x.ops.some(o=>o.step==='B'&&/B-3|B-removal/.test(o.c)));
  if(ex7){const cell=L.find(x=>(x.L+' '+x.f+'|'+x.fam+'|'+x.eq+'|'+x.inj+'|'+x.exp+'|s'+x.c.seed+'|'+x.rest)===ex7.k);const o=ex7.ops.find(o=>o.step==='B'&&/B-3|B-removal/.test(o.c));
    if(cell){const pv=build('V',cell.c),pb=build('B',cell.c);P('\n=== F7 B-step rename cell '+ex7.k+' :: '+o.s);const di=ORDER.indexOf(o.d);const prevs=[[o.w,ORDER[(di+6)%7]],[o.w,o.d],[o.w,ORDER[(di+1)%7]]];if(di===0)prevs[0]=[o.w-1,'sun'];
      for(const [w,d] of prevs){P('  W'+w+' '+d+'\n    [V] '+card(pv.weeks[w]&&pv.weeks[w][d]||{})+'\n    [B] '+card(pb.weeks[w]&&pb.weeks[w][d]||{}));}}}
  // HALF_MANNY: every Tue, V vs ALLx; W13/W14; non-Tue changed; swap sheet
  P('\n=== HALF_MANNY (fixture seed '+fixtures.HALF_MANNY.seed+') V230 vs ALLx, every Tue; other days');
  const MV=build('V',fixtures.HALF_MANNY),MA=build('ALLx',fixtures.HALF_MANNY),MP=build('PRIORALL',fixtures.HALF_MANNY);let calfV='',calfA='',carV='',carA='',nonTue=0,prior=0;
  wk(MV).forEach(w=>{ORDER.forEach(d=>{if(daySig(MV.weeks[w][d]||{})!==daySig(MA.weeks[w][d]||{})&&d!=='tue')nonTue++;if(daySig(MP.weeks[w][d]||{})!==daySig(MA.weeks[w][d]||{}))prior++;});const v=MV.weeks[w].tue,a=MA.weeks[w].tue;const has=(dy,re)=>liveSecs(dy||{}).some(s=>re.test(clean(s.label)));calfV+=has(v,/^Calf — achilles/)?'Y':'-';calfA+=has(a,/^Calf — achilles/)?'Y':'-';carV+=has(v,/carry/i)?'Y':'-';carA+=has(a,/carry/i)?'Y':'-';
    P('  W'+w+' tue '+(v.title||'')+(daySig(v)===daySig(a)?'  (identical V230 == ALLx)':''));if(daySig(v)!==daySig(a)){P('    V230: '+card(v));P('    ALLx: '+card(a));}else if(w<=1||w>=13)P('    card: '+card(v));});
  P('  calf W1..W14 V230 '+calfV+' ALLx '+calfA+' | carry V230 '+carV+' ALLx '+carA+' | non-Tue days changed '+nonTue+' | days ALLx != PRIOR ALL: '+prior);
  const sc=t=>vm(t).swapCandidates||vm(t).eval('swapCandidates');const candNames=r=>{const o=[];if(!r)return o;(Array.isArray(r)?[r]:Object.values(r).filter(Array.isArray)).forEach(a=>a.forEach(c=>{const n=clean(typeof c==='string'?c:(c&&c.name));if(n)o.push(n);}));return o;};
  let asked=0,shrunk=0,grew=0;const lostBy={},gainBy={};wk(MV).forEach(w=>ORDER.forEach(d=>{const a=MV.weeks[w][d],b=MA.weeks[w][d];const nb=new Set(items(b).map(i=>i.n));const seen=new Set();items(a).forEach(i=>{if(!nb.has(i.n)||seen.has(i.n))return;seen.add(i.n);asked++;let ca,cb;try{ca=candNames(sc('V')(i.n,a,w,MV));cb=candNames(sc('ALLx')(i.n,b,w,MA));}catch(e){ca=['CRASH'];cb=[];}const lost=ca.filter(n=>!cb.includes(n)),gain=cb.filter(n=>!ca.includes(n));if(lost.length){shrunk++;lost.forEach(n=>bump(lostBy,'W'+w+' '+d+' ['+i.lab+'] '+i.n+' -> '+n+(items(b).some(z=>z.n===n)?' (now on the ALLx card)':'')));}if(gain.length){grew++;gain.forEach(n=>bump(gainBy,n));}});}));
  P('  swap sheet V vs ALLx: items asked '+asked+', lose >= 1 option '+shrunk+', gain >= 1 '+grew+' | universe V '+(MV._swapUniverse||[]).length+' ALLx '+(MA._swapUniverse||[]).length+' lost '+JSON.stringify((MV._swapUniverse||[]).filter(n=>!(MA._swapUniverse||[]).includes(n)))+' gained '+JSON.stringify((MA._swapUniverse||[]).filter(n=>!(MV._swapUniverse||[]).includes(n))));
  Object.keys(lostBy).forEach(k=>P('     lost: '+k));P('     gained names: '+JSON.stringify(gainBy));
  P('\n=== PRT TING (seed 87747): V / B / ALLx W9 mon, W9 tue, W10 tue, W1 mon');const PRv=build('V',PRT),PRb=build('B',PRT),PRa=build('ALLx',PRT);for(const [w,d] of [[9,'mon'],[9,'tue'],[10,'tue'],[1,'mon']]){P('  PRT W'+w+' '+d+'\n    V    '+card(PRv.weeks[w][d])+'\n    B    '+(daySig(PRb.weeks[w][d])===daySig(PRv.weeks[w][d])?'(identical to V230)':card(PRb.weeks[w][d]))+'\n    ALLx '+(daySig(PRa.weeks[w][d])===daySig(PRb.weeks[w][d])?'(identical to B)':card(PRa.weeks[w][d])));}
  let n=0,t=0;wk(PRv).forEach(w=>ORDER.forEach(d=>{t++;if(daySig(PRv.weeks[w][d]||{})!==daySig(PRa.weeks[w][d]||{}))n++;}));P('  PRT day cells changed V->ALLx: '+n+'/'+t+' | ALLx == B on every cell: '+(()=>{let s=true;wk(PRv).forEach(w=>ORDER.forEach(d=>{if(daySig(PRb.weeks[w][d]||{})!==daySig(PRa.weeks[w][d]||{}))s=false;}));return s;})());
  P('CARDS DONE');
}
async function main(){if(process.env.WORKER)return worker(process.env.WORKER);
  if(PART==='prep'||PART==='all')prep();if(PART==='run'||PART==='all')await run();if(PART==='report'||PART==='all')report();if(PART==='cards'||PART==='all')cards();}
main();
