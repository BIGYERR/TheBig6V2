'use strict';
// coach4 (V231 D196 re-ruling): the full-lower template's two hip-extension picks, measured. Read-only on the repo.
//   SCR=<scratch>/coach4 node d196a2_fix.js            prep (build fix trees, digests, typed cards) + workers + report
const path=require('path'),fs=require('fs'),cp=require('child_process'),crypto=require('crypto');
const ROOT='/Users/CanasBangin/Desktop/TheBig6V2';
const H=require(path.join(ROOT,'tests','harness.js'));const {load,fixtures,progDigest,DAYS}=H;
const SCR=process.env.SCR;if(!SCR)throw new Error('SCR unset');const F=n=>path.join(SCR,n);const SP=path.dirname(SCR);
const TP={V:path.join(SP,'base_v230.html'),ABx:path.join(SP,'measure5','t_ABx.html'),PREx:path.join(SP,'measure5','t_PREx.html'),C:F('cand.html'),PREf:F('t_PREf.html'),CF:F('t_CF.html'),CA:F('t_CA.html')};
const WANT={V:'72ac41c8d34034ce',ABx:'8d90f9463198e7d4',PREx:'450783528238a6ee',C:'1249c248a6794d1c'};
const CLOCK='2026-08-24';
const ANCH="const lowerHipExt=pick(hipExtBW,1,blockSeed(w)+20)[0];";
const FIXB="const _lhe0=pick(hipExtBW,1,blockSeed(w)+20)[0];const lowerHipExt=(_lhe0===lowerHinge)?(pick(hipExtBW.filter(x=>x!==lowerHinge),1,blockSeed(w)+20)[0]||_lhe0):_lhe0;";
const FIXA="const lowerHipExt=pick(hipExtBW.filter(x=>x!==lowerHinge),1,blockSeed(w)+20)[0]||pick(hipExtBW,1,blockSeed(w)+20)[0];";
const clone=x=>JSON.parse(JSON.stringify(x));const P=s=>console.log(s);
const sha=s=>crypto.createHash('sha256').update(s).digest('hex').slice(0,16);
const tally=(rows,key)=>{const m={};rows.forEach(r=>{const k=key(r);m[k]=(m[k]||0)+1;});return m;};
const fmt=m=>Object.keys(m).sort((a,b)=>m[b]-m[a]||(a<b?-1:1)).map(k=>k+' '+m[k]).join(' | ')||'(none)';
const bump=(o,k,n=1)=>{o[k]=(o[k]||0)+n;};
const clean=n=>String(n==null?'':n).replace(/<svg[\s\S]*?<\/svg>\s*/g,'').replace(/<[^>]+>/g,'').trim();
const ORDER=['mon','tue','wed','thu','fri','sat','sun'];
const CIRC='Leg circuit — runner armor',HEP='Hip extension + push',LS='Lower strength';
const BRIDGE='Single-leg glute bridge',BEDHT='Single-leg hip thrust (shoulders on bed)';
// ── lattices, verbatim from M19 (tests/measure/v231_d196a2_confirm.js :37-68) ──
const MARIO={name:'M',primaryPath:'lift',cardioTypes:[],cardioGoals:{},eventTargeted:false,raceDate:null,liftingFocus:'support_strength',experience:'beginner',ageBracket:'18-35',equipment:'commercial',unit:'lbs',restDays:['sun','wed'],days:DAYS.slice(),bench:135,squat:155,deadlift:185,seed:76308};
const FOC=['hypertrophy','strength','fatloss','balanced','support_strength','support_athletic','support_prevention'];
const FAM={race:[['run_5k',{}],['run_10k',{}],['run_half',{}],['run_marathon',{}]],test:[['run_pace_goal',{targetDist:'1.5',targetMins:'10',targetSecs:'30'}],['run_base',{}]],none:[[null,{}]]};
const TIERS6=['commercial','crossfit','home_full','home_basic','minimal','bodyweight'],EXPS=['beginner','intermediate','advanced'],SEEDS=[87747,76308,1234,4242],RESTS=[['sun','wed'],['sat','sun']];
const REGS=['knee','ankle','hip','lowback','shoulder','elbow'],ITIERS=['workaround','protect'];
function mk17(f,fam,eq,ei,si,ri,inj){const g=FAM[fam][(si+ei)%FAM[fam].length];
  const c={name:'M',primaryPath:/^support_/.test(f)?'event':'goal',cardioTypes:g[0]?['run']:[],cardioGoals:g[0]?{run:Object.assign({id:g[0],label:g[0],mileBestMins:'8',mileBestSecs:'0',baselineDist:'3',baseline:'3mi'},g[1])}:{},eventTargeted:false,liftingFocus:f,experience:EXPS[ei],ageBracket:'18-35',equipment:eq,unit:'lbs',restDays:RESTS[ri].slice(),days:DAYS.slice(),bench:135,squat:155,deadlift:185,seed:SEEDS[si]};
  if(inj)c.injury=inj;return c;}
function latM17(){const out=[];
  for(const f of FOC)for(const fam of Object.keys(FAM))for(const eq of TIERS6)for(let ei=0;ei<3;ei++)for(let si=0;si<4;si++)for(let ri=0;ri<2;ri++)out.push({L:'FULL',c:mk17(f,fam,eq,ei,si,ri,null)});
  let k=0;for(const r of REGS)for(const t of ITIERS)for(const f of FOC)for(const fam of Object.keys(FAM))for(const eq of TIERS6)for(let ri=0;ri<2;ri++){const ei=k%3,si=(k>>1)%4;k++;out.push({L:'INJ',c:mk17(f,fam,eq,ei,si,ri,{region:r,tier:t})});}
  for(const g of REGS)for(const t of ITIERS)for(const eq of ['commercial','crossfit','home_full','bodyweight'])for(const ex of EXPS)for(const fo of ['support_strength','support_athletic','support_prevention'])out.push({L:'L432',c:Object.assign(clone(MARIO),{injury:{region:g,tier:t},equipment:eq,experience:ex,liftingFocus:fo})});
  for(const g of REGS)for(const t of ITIERS)for(const eq of ['bodyweight','home_basic'])for(const ex of EXPS)for(const fo of ['balanced','strength','hypertrophy'])for(const rd of [['sun','wed'],['sat','sun']])out.push({L:'LBW',c:Object.assign(clone(MARIO),{injury:{region:g,tier:t},equipment:eq,experience:ex,liftingFocus:fo,restDays:rd})});
  return out;}
const K_TIERS=['commercial','crossfit','home_full','home_basic','bodyweight'];
const K_GOALS=[['run_5k',{}],['run_half',{}],['run_pace_goal',{targetDist:'1.5',targetMins:'10',targetSecs:'0'}],['run_base',{}],['run_10k',{}],['run_marathon',{}]];
const K_SEEDS=[76308,1234,4242,9001,31337,555,8086,20260];
function mkK(eq,gi,f,exp,age,si,inj){const [g,x]=K_GOALS[gi%K_GOALS.length];
  const c={name:'M',primaryPath:/^support_/.test(f)?'event':'goal',cardioTypes:['run'],cardioGoals:{run:Object.assign({id:g,label:g,mileBestMins:'8',mileBestSecs:'30',baselineDist:'3',baseline:'3mi'},x)},eventTargeted:false,liftingFocus:f,experience:exp,ageBracket:age,equipment:eq,unit:'lbs',restDays:RESTS[si%2].slice(),days:DAYS.slice(),bench:135,squat:155,deadlift:185,seed:K_SEEDS[si]};
  if(inj)c.injury=inj;return c;}
function latK(){const out=[];for(const eq of K_TIERS)K_GOALS.forEach((_,gi)=>FOC.forEach((f,fi)=>EXPS.forEach((e,ei)=>{const si=(gi+fi+ei)%2;out.push({L:'K',c:mkK(eq,gi,f,e,si?'55+':'18-35',si,{region:'knee',tier:'protect'})});})));return out;}
const E_TIERS=['commercial','home_full','crossfit','home_basic','bodyweight','minimal'],E_FOCUS=['hypertrophy','balanced'],E_EXPS=['beginner','advanced'];
const E_GOALS=[{k:'liftonly',id:null},{k:'pace',id:'run_pace_goal'},{k:'half',id:'run_half'}];
const E_INJ=[{k:'healthy',v:null},{k:'shoulder/protect',v:{region:'shoulder',tier:'protect'}},{k:'lowback/protect',v:{region:'lowback',tier:'protect'}},{k:'knee/protect',v:{region:'knee',tier:'protect'}}];
const E_RESTS=[{k:'sun',v:['sun']},{k:'sun+wed',v:['sun','wed']},{k:'sat+sun',v:['sat','sun']}],E_SEEDS=[1013,3039];
function eCfg(tier,focus,exp,g,inj,rest,seed){const isRace=!!g.id&&/5k|10k|half|marathon/.test(g.id);
  return {name:'M',primaryPath:g.id?(isRace?'event':'cardio'):'lift',cardioTypes:g.id?['run']:[],cardioGoals:g.id?{run:{id:g.id,label:g.k,mileBestMins:'10',mileBestSecs:'30',baselineDist:'5',baseline:'5mi',targetDist:'1.5',targetMins:'11',targetSecs:'0'}}:{},eventTargeted:isRace,raceDate:isRace?'2026-12-06':null,liftingFocus:focus,experience:exp,ageBracket:'18-35',equipment:tier,unit:'lbs',restDays:rest.v.slice(),days:['sun','mon','tue','wed','thu','fri','sat'],bench:135,squat:155,deadlift:185,seed};}
function latE(){const out=[];for(const t of E_TIERS)for(const f of E_FOCUS)for(const x of E_EXPS)for(const g of E_GOALS)for(const i of E_INJ)for(const r of E_RESTS)for(const sd of E_SEEDS){const c=eCfg(t,f,x,g,i,r,sd);if(i.v)c.injury={region:i.v.region,tier:i.v.tier};out.push({L:'E',c,ek:g.k});}return out;}
const ALL=()=>latM17().concat(latK(),latE());
const key=r=>{const c=r.c;return r.L+' '+c.equipment+'|'+c.liftingFocus+'|'+(c.cardioGoals&&c.cardioGoals.run?c.cardioGoals.run.id:'none')+'|'+(c.injury?c.injury.region+'/'+c.injury.tier:'none')+'|'+c.experience+'|'+c.ageBracket+'|s'+c.seed+'|'+c.restDays.join(',');};
// ── VM ──
const _VM={};function vm(t){if(_VM[t])return _VM[t];const X=load(TP[t]);const T=new Date(CLOCK+'T12:00:00').getTime();const RD=Date;class FD extends RD{constructor(...a){if(a.length)super(...a);else super(T);}static now(){return T;}}X.ctx.Date=FD;return _VM[t]=X;}
const stripJ=prog=>JSON.stringify(prog,(k,v)=>(k==='id'||k==='created'||k==='_swapUniverse'||k==='_swapUniverseByKey'||k==='__bw')?undefined:v);
function build(t,c){const X=vm(t);let p;try{p=X.buildProgram(clone(c));}catch(e){p={__crash:String(e&&e.message||e).slice(0,200),weeks:{}};}return p;}
const liveSecs=day=>(day&&!day.rest&&day.sections||[]).filter(s=>(s.items||[]).length);
const items=day=>{const o=[];liveSecs(day).forEach(s=>s.items.forEach((it,i)=>{if(it&&it.name){const lab=clean(s.label||s.coreHeader||''),d=clean(it.detail||'');o.push({lab,n:clean(it.name),d,i,len:s.items.length});}}));return o;};
const daySig=day=>JSON.stringify(liveSecs(day).map(s=>[clean(s.label||''),s.coreHeader||'',s.rounds||'',!!s.superset,s.items.map(it=>[clean(it.name),clean(it.detail||'')])]));
const card=day=>liveSecs(day).map(s=>clean(s.label||s.coreHeader||'')+(s.superset?' (SS '+(s.rounds||'')+')':'')+' :: '+s.items.map(it=>clean(it.name)+' '+clean(it.detail||'')).join(' | ')).join('\n        ');
const wk=p=>Object.keys(p.weeks||{}).sort((a,b)=>a-b);
const dayOf=(p,w,d)=>p&&p.weeks&&p.weeks[w]&&p.weeks[w][d];
const secBy=(day,lab)=>liveSecs(day).find(s=>clean(s.label)===lab);
const names=s=>s?s.items.map(i=>clean(i.name)):null;
// ── coach2's op matcher, verbatim ──
function ops(X,Y){const a=items(X),b=items(Y);const kk=i=>i.lab+'\u0001'+i.n+'\u0001'+i.d;const m={};b.forEach(i=>(m[kk(i)]=m[kk(i)]||[]).push(i));const rem=[];
  a.forEach(i=>{const l=m[kk(i)];if(l&&l.length)l.pop();else rem.push(i);});const add=[];Object.values(m).forEach(l=>l.forEach(i=>add.push(i)));const o=[];
  const take=(pred,kind)=>{for(let i=rem.length-1;i>=0;i--){const r=rem[i];const j=add.findIndex(x=>pred(r,x));if(j>=0){o.push({k:kind,r,a:add[j]});add.splice(j,1);rem.splice(i,1);}}};
  take((r,x)=>r.lab===x.lab&&r.n===x.n,'redetail');take((r,x)=>/^(Main|Primer)/.test(r.lab)&&/^(Main|Primer)/.test(x.lab),'rename');take((r,x)=>r.n===x.n,'relabel');take((r,x)=>r.lab===x.lab,'rename');
  rem.forEach(r=>o.push({k:'drop',r}));add.forEach(x=>o.push({k:'add',a:x}));return o;}
const opStr=o=>o.k+' '+(o.r?'['+o.r.lab+'] '+o.r.n+' '+o.r.d:'')+(o.r&&o.a?' -> ':'')+(o.a?'['+o.a.lab+'] '+o.a.n+' '+o.a.d:'');
// ── W5-step classifier: M19's, with D196 Amendment 2 AS AMENDED here (lowback branch) + D198 ──
const NOLOAD7=/^\d+ sets — RPE 7 \(leave 3 or more in reserve\)$/,NOLOAD6=/^\d+ sets — RPE 6 \(leave 3 or more in reserve\)$/;
const LB_LABS=/^Leg superset B$|^Lower strength$|^Leg circuit — runner armor$/;
function classifyW5(c,o,w,ctx){
  const eq=c.equipment,f=c.liftingFocus,inj=c.injury?c.injury.region+'/'+c.injury.tier:'none';
  const lab=(o.a||o.r).lab,labR=o.r?o.r.lab:'',labA=o.a?o.a.lab:'';const removal=o.r&&(o.k==='drop'||o.k==='rename');const st=l=>l.replace(/ — .*$/,'');
  const beg12=c.experience==='beginner'&&w<=2;
  // D198 (the fix) is judged first: it is not a D196 class and reaches every tier
  if(labR===HEP||labA===HEP){
    if(o.k==='rename'&&labR===HEP&&labA===HEP&&o.r.n===ctx.lsHingeAfter&&o.a.n!==ctx.lsHingeAfter)return 'D198-1(re-draw: HEP partner == the day\'s Lower strength hinge)';
    if(o.k==='add'&&labA===HEP&&o.a.n!==ctx.lsHingeAfter&&ctx.hepCollapsedBefore)return 'D198-2(partner restored on a pre-existing collision)';
    if(o.k==='drop'&&labR===HEP)return 'OUT:D198 removal under HEP '+o.r.n;
    return 'OUT:D198-other '+o.k+' '+o.r?.n+' -> '+o.a?.n;
  }
  const PL=['ankle/protect','knee/protect','lowback/protect','lowback/workaround'];
  if(eq!=='bodyweight'||!PL.includes(inj))return 'OUT:D196-outside-scope '+inj+' '+eq;
  if(o.k==='rename'&&/^(Main|Primer)/.test(labR)&&o.r.n==='Burpees'&&[BRIDGE,BEDHT].includes(o.a.n))return o.r.d===o.a.d?(/^Primer/.test(labR)?'D196-1(Primer)':'D196-1(Main)'):'OUT:D196-1 detail changed';
  if(/^(ankle|knee)/.test(inj)){
    const AK=/^Leg superset [AB]|^Leg isolation|^Leg$/;
    if(/^Leg circuit/.test(labR)||/^Leg circuit/.test(labA)){if(f!=='support_prevention')return 'OUT:circuit op off prevention';return 'D196-2-Am2('+inj+' circuit '+o.k+')';}
    if(inj==='knee/protect'&&(o.k==='drop'||o.k==='add')&&/^(Leg isolation|Calves)/.test(labR||labA))return 'D196-5'+(o.k==='add'?'-Am2(appear '+st(labA)+')':'(leave '+st(labR)+')');
    if(AK.test(labR||labA)&&AK.test(labA||labR))return 'D196-2(Leg sections '+o.k+')';
    return 'OUT:D196-ak-other '+o.k+' '+st(labR||labA);
  }
  // lowback
  if(o.k==='add'&&o.a.n==='Burpees'&&/^\d×10$/.test(o.a.d)&&/^Pull/.test(labA))return 'D196-3(pull N×10)';
  if(o.k==='relabel'&&labR==='Pull'&&labA==='Pull superset B')return 'D196-3(relabel Pull)';
  if(o.k==='add'&&o.a.n==='Burpees'&&/^\d×12$/.test(o.a.d)&&labA==='Explosive finisher')return 'D196-3-Am2(Explosive finisher N×12)';
  if(o.k==='relabel'&&o.r.n==='Burpees'&&labR===LS&&labA==='Explosive finisher'&&/^\d×12$/.test(o.a.d))return 'D196-3-Am2(Explosive finisher N×12; matcher pairs it with the Lower strength burpee)';
  const d4=(d)=>NOLOAD7.test(d)?'RPE 7':(NOLOAD6.test(d)&&beg12)?'RPE 6 beginner W1-2':null;
  if(o.k==='rename'&&o.r.n==='Burpees'&&o.a.n===BEDHT&&LB_LABS.test(labR)&&d4(o.a.d))return 'D196-4('+st(labR)+', '+d4(o.a.d)+')';
  if(o.k==='add'&&o.a.n===BEDHT&&labA===LS&&d4(o.a.d))return 'D196-4(Lower strength, '+d4(o.a.d)+'; matcher add-form)';
  if(o.k==='rename'&&o.r.n==='Burpees'&&o.a.n===BEDHT)return 'OUT:D196-4 wording not covered '+st(labR)+' '+o.a.d+' exp '+c.experience+' W'+w;
  return 'OUT:D196-lb-other '+o.k+' '+st(lab);
}
function classifyFL(c,o){const eq=c.equipment,inj=c.injury?c.injury.region+'/'+c.injury.tier:'none';if(eq!=='bodyweight'||inj==='none')return 'OUT:D197-outside-scope';
  if(o.k==='redetail'&&/RPE 8/.test(o.r.d)&&/RPE 7/.test(o.a.d)&&!/RPE 8/.test(o.a.d))return 'D197-1';if(o.k==='drop')return 'D197-2?(drop '+o.r.n+')';return 'OUT:D197-other '+o.k;}
const regTag=o=>{const t=[];if(o.r&&(o.k==='drop'||o.k==='rename')){const l=o.r.lab;if(/^Calf|^Calves/.test(l))t.push('calf');if(/^Leg circuit/.test(l))t.push('circuit');if(/hip|foot|ankle/i.test(l)&&!/^Leg circuit/.test(l))t.push('hip/foot');if(/^Main/.test(l))t.push('Main');}return t;};
const TREES=['V','ABx','PREx','PREf','C','CF','CA'];
function cell(row){const c=row.c;const R={k:key(row),L:row.L,eq:c.equipment,f:c.liftingFocus,exp:c.experience,rest:c.restDays.join(','),inj:c.injury?c.injury.region+'/'+c.injury.tier:'none',runner:!!(c.cardioTypes||[]).includes('run'),days:0,crash:null,hep:{},hepDays:[],w5:[],fl:[],cfb:[],cfa:[],uni:{}};
  const PB={};TREES.forEach(t=>PB[t]=build(t,c));const cr=TREES.filter(t=>PB[t].__crash);if(cr.length){R.crash=cr.join(',')+': '+PB[cr[0]].__crash;return R;}
  const U={};TREES.forEach(t=>U[t]=new Set(PB[t]._swapUniverse||[]));const dif=(a,b)=>({lost:[...U[a]].filter(n=>!U[b].has(n)),gain:[...U[b]].filter(n=>!U[a].has(n))});
  R.uni={VC:dif('V','C'),CCF:dif('C','CF'),CCA:dif('C','CA'),VCF:dif('V','CF')};
  TREES.forEach(t=>R.hep[t]={hepDays:0,collapsed:0,doubled:0,hepGone:0});
  wk(PB.V).forEach(w=>ORDER.forEach(d=>{R.days++;
    const per={};TREES.forEach(t=>{const D=dayOf(PB[t],w,d);const ls=secBy(D,LS),he=secBy(D,HEP);const ln=names(ls),hn=names(he);
      const st={ls:ln,hep:hn,collapsed:!!(he&&he.items.length===1),doubled:!!(ln&&hn&&ln.some(n=>hn.includes(n))),hepGone:!!(ls&&!he)};per[t]=st;const h=R.hep[t];
      if(he)h.hepDays++;if(st.collapsed)h.collapsed++;if(st.doubled)h.doubled++;if(st.hepGone)h.hepGone++;});
    const anyFlag=TREES.some(t=>per[t].collapsed||per[t].doubled||per[t].hepGone);
    const moved=daySig(dayOf(PB.C,w,d))!==daySig(dayOf(PB.CF,w,d));
    if(anyFlag||moved)R.hepDays.push({w:+w,d,per,moved});
    // W5 step with the fix: ABx -> PREf ; FL step: PREf -> CF ; the fix's own differential: C -> CF, C -> CA
    const X=dayOf(PB.ABx,w,d),Y=dayOf(PB.PREf,w,d);
    if(daySig(X)!==daySig(Y)){const ctx={lsHingeAfter:(per.PREf.ls||[])[1],hepCollapsedBefore:per.ABx.collapsed};
      ops(X,Y).forEach(o=>{const cl=classifyW5(c,o,+w,ctx);R.w5.push({c:cl,reg:regTag(o),w:+w,d,s:opStr(o),cx:/^OUT|D198/.test(cl)?('ABx: '+card(X)+'\n              PREf: '+card(Y)):null});});}
    const X2=dayOf(PB.PREf,w,d),Y2=dayOf(PB.CF,w,d);if(daySig(X2)!==daySig(Y2))ops(X2,Y2).forEach(o=>R.fl.push({c:classifyFL(c,o),w:+w,d,s:opStr(o)}));
    const X3=dayOf(PB.C,w,d),Y3=dayOf(PB.CF,w,d);if(daySig(X3)!==daySig(Y3)){const oo=ops(X3,Y3);if(!oo.length)R.cfb.push({w:+w,d,s:'(section flag only: superset/rounds)',k:'flag',lab:'-',reg:[]});oo.forEach(o=>R.cfb.push({w:+w,d,s:opStr(o),k:o.k,lab:(o.a||o.r).lab,reg:regTag(o),cx:'C: '+card(X3)+'\n              CF: '+card(Y3)}));}
    const X4=dayOf(PB.C,w,d),Y4=dayOf(PB.CA,w,d);if(daySig(X4)!==daySig(Y4)){const oo=ops(X4,Y4);if(!oo.length)R.cfa.push({w:+w,d,s:'(flag only)',k:'flag',lab:'-'});oo.forEach(o=>R.cfa.push({w:+w,d,s:opStr(o),k:o.k,lab:(o.a||o.r).lab}));}
  }));
  return R;}
function mkFix(src,dst,fix){const h=fs.readFileSync(src,'utf8');const n=h.split(ANCH).length-1;if(n!==1)throw new Error('anchor count '+n+' in '+src);const out=h.replace(ANCH,()=>fix);try{fs.unlinkSync(dst);}catch(e){}fs.writeFileSync(dst,out);return sha(out);}
function prep(){
  const repo=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');if(sha(repo)!==WANT.C)throw new Error('repo index.html is not the candidate: '+sha(repo));fs.writeFileSync(F('cand.html'),repo);
  P('  anchor `'+ANCH+'` count in candidate: '+(repo.split(ANCH).length-1)+' ; in V230: '+(fs.readFileSync(TP.V,'utf8').split(ANCH).length-1));
  P('  FIX-B (index-stable: same draw, seeded re-pick from the pool minus the hinge only when the draw collides): '+FIXB);
  P('  FIX-A (filter-before-pick, the sibling lowerPush idiom at :9479; narrows the array pick() registers): '+FIXA);
  P('  t_CF   (candidate + FIX-B) '+mkFix(F('cand.html'),TP.CF,FIXB));
  P('  t_CA   (candidate + FIX-A) '+mkFix(F('cand.html'),TP.CA,FIXA));
  P('  t_PREf (t_PREx + FIX-B)    '+mkFix(TP.PREx,TP.PREf,FIXB));
  for(const t of TREES){const s=fs.readFileSync(TP[t],'utf8');const h=sha(s);P('  tree '+t.padEnd(5)+h+(WANT[t]?(h===WANT[t]?' ok':' MISMATCH want '+WANT[t]):'')+' ia-version '+(s.match(/ia-version" content="(\d+)/)||[])[1]);if(WANT[t]&&h!==WANT[t])throw new Error('tree hash '+t);}
  P('  fixtures: '+Object.keys(fixtures).join(', '));
  const fx=Object.keys(fixtures).filter(k=>/MANNY|PRT|TING/i.test(k));
  for(const t of TREES)P('  digests '+t.padEnd(5)+fx.map(k=>{const a=progDigest(vm(t).buildProgram(clone(fixtures[k]))),b=progDigest(vm(t).buildProgram(clone(fixtures[k])));return k+' '+a+(a===b?'':' SELF-IDENTITY FAIL');}).join(' | '));
  // typed cards: (i) (ii) (iii) from M19, on V / ABx / PREx / PREf / C / CF
  const TC=[['(i)  Leg superset B beginner W1/W2 RPE 6',eCfg('bodyweight','hypertrophy','beginner',E_GOALS[0],E_INJ[2],E_RESTS[0],1013),[[1,'wed'],[3,'wed']]],
            ['(ii) Lower strength + Explosive finisher',eCfg('bodyweight','hypertrophy','beginner',E_GOALS[0],E_INJ[2],E_RESTS[0],3039),[[1,'sat'],[3,'sat']]],
            ['(iii) Lower strength + Hip extension + push collapse',eCfg('bodyweight','balanced','beginner',E_GOALS[0],E_INJ[2],E_RESTS[0],1013),[[3,'sat'],[4,'sat']]]];
  TC.forEach(([t,c,wd])=>{if(c.cardioGoals&&E_INJ[2].v)c.injury={region:'lowback',tier:'protect'};P('\n  TYPED '+t+'  '+key({L:'E',c}));
    wd.forEach(([w,d])=>{P('    W'+w+' '+d+':');for(const tr of ['V','ABx','PREx','PREf','C','CF']){const D=dayOf(build(tr,c),w,d);P('      '+tr.padEnd(5)+(D&&D.title?'['+clean(D.title)+'] ':'')+card(D));}});});
  // self-identity sample
  const L=ALL();const S=L.filter((_,i)=>i%97===0);let sv=0,sc=0,sf=0;for(const r of S){if(stripJ(build('V',r.c))===stripJ(build('V',r.c)))sv++;if(stripJ(build('C',r.c))===stripJ(build('C',r.c)))sc++;if(stripJ(build('CF',r.c))===stripJ(build('CF',r.c)))sf++;}
  P('\n  self-identity on '+S.length+' sampled configs (every 97th of '+L.length+'): V '+sv+', C '+sc+', CF '+sf);if(sv!==S.length||sc!==S.length||sf!==S.length)throw new Error('not self-identical');}
function worker(spec){const [a,b]=spec.split(':').map(Number);const out=ALL().slice(a,b).map(cell);fs.writeFileSync(F('res_'+a+'_'+b+'.json'),JSON.stringify(out));P('worker '+spec+' cells '+out.length);}
function run(){return new Promise(done=>{const N=ALL().length,CH=+(process.env.CH||120);const jobs=[];for(let i=0;i<N;i+=CH)jobs.push(i+':'+Math.min(N,i+CH));
  const par=+(process.env.PAR||7);let i=0,crash=0;const t0=Date.now();
  const one=j=>new Promise(res=>{const p=cp.spawn(process.execPath,['--max-old-space-size=4096',__filename],{env:Object.assign({},process.env,{WORKER:j}),stdio:['ignore','pipe','pipe']});let o='';p.stdout.on('data',x=>o+=x);p.stderr.on('data',x=>o+=x);p.on('exit',code=>{if(code){crash++;P('WORKER CRASH '+j+' '+o.slice(-800));}res();});});
  Promise.all(Array.from({length:par},async()=>{while(i<jobs.length)await one(jobs[i++]);})).then(()=>{P('RUN jobs '+jobs.length+' worker crashes '+crash+' '+((Date.now()-t0)/1000).toFixed(0)+' s');done(crash);});});}
function report(){const R=[];fs.readdirSync(SCR).filter(f=>/^res_\d+_\d+\.json$/.test(f)).sort((x,y)=>+x.split('_')[1]-+y.split('_')[1]).forEach(f=>JSON.parse(fs.readFileSync(F(f),'utf8')).forEach(x=>R.push(x)));
  const N=ALL().length;P('\nCELLS '+R.length+'/'+N+' | by lattice '+fmt(tally(R,x=>x.L))+' | crashes '+R.filter(x=>x.crash).length+(R.some(x=>x.crash)?' e.g. '+R.find(x=>x.crash).k+' '+R.find(x=>x.crash).crash:''));
  const G=R.filter(x=>!x.crash);const progs=rows=>new Set(rows.map(r=>r.k)).size;
  P('\n################ (A) `Hip extension + push` census per tree (days with the section; collapsed = 1 item; doubled = shares a name with Lower strength; hepGone = Lower strength without HEP)');
  for(const t of TREES){const s={hepDays:0,collapsed:0,doubled:0,hepGone:0};G.forEach(x=>Object.keys(s).forEach(k=>s[k]+=x.hep[t][k]));P('  '+t.padEnd(5)+JSON.stringify(s)+' | programs with a collapsed HEP '+G.filter(x=>x.hep[t].collapsed).length+', doubled '+G.filter(x=>x.hep[t].doubled).length+' of '+G.length);}
  const HD=G.flatMap(x=>x.hepDays.map(o=>Object.assign({k:x.k,L:x.L,eq:x.eq,f:x.f,inj:x.inj,exp:x.exp,rest:x.rest},o)));
  P('  V230 collapsed HEP days by L x tier x inj: '+fmt(tally(HD.filter(o=>o.per.V.collapsed),o=>o.L+' '+o.eq+' '+o.inj)));
  P('  V230 doubled  HEP days by L x tier x inj: '+fmt(tally(HD.filter(o=>o.per.V.doubled),o=>o.L+' '+o.eq+' '+o.inj)));
  P('  cand collapsed HEP days by L x tier x inj: '+fmt(tally(HD.filter(o=>o.per.C.collapsed),o=>o.L+' '+o.eq+' '+o.inj)));
  P('  cand doubled  HEP days by L x tier x inj: '+fmt(tally(HD.filter(o=>o.per.C.doubled),o=>o.L+' '+o.eq+' '+o.inj)));
  P('  CF   collapsed '+HD.filter(o=>o.per.CF.collapsed).length+' doubled '+HD.filter(o=>o.per.CF.doubled).length+' hepGone '+HD.filter(o=>o.per.CF.hepGone).length+' | CA collapsed '+HD.filter(o=>o.per.CA.collapsed).length+' doubled '+HD.filter(o=>o.per.CA.doubled).length);
  P('  collapsed/doubled days by rest pattern (V230): '+fmt(tally(HD.filter(o=>o.per.V.collapsed||o.per.V.doubled),o=>o.rest))+' | cand: '+fmt(tally(HD.filter(o=>o.per.C.collapsed||o.per.C.doubled),o=>o.rest)));
  P('\n################ (B) the fix\'s own differential, candidate -> CF (FIX-B)');
  const CB=G.flatMap(x=>x.cfb.map(o=>Object.assign({k:x.k,L:x.L,eq:x.eq,f:x.f,inj:x.inj,exp:x.exp,rest:x.rest},o)));
  P('  ops '+CB.length+' on '+new Set(CB.map(o=>o.k+o.w+o.d)).size+' days, '+progs(CB)+' programs of '+G.length+' | by L '+fmt(tally(CB,o=>o.L))+' | by kind '+fmt(tally(CB,o=>o.k))+' | by label '+fmt(tally(CB,o=>o.lab)));
  P('  by tier x inj: '+fmt(tally(CB,o=>o.eq+' '+o.inj)));
  P('  by focus: '+fmt(tally(CB,o=>o.f))+' | by rest: '+fmt(tally(CB,o=>o.rest))+' | by week: '+fmt(tally(CB,o=>'W'+o.w)));
  P('  regression tags: '+fmt(tally(CB.filter(o=>o.reg&&o.reg.length),o=>o.k+' '+o.reg.join('+'))));
  const TR=tally(CB,o=>o.k+' '+o.s.replace(/\d+(×|\s*sets)[^\]]*?(?=( ->|$))/g,'N').replace(/ — RPE [^\]]*/g,''));P('  transitions (top 40):');Object.keys(TR).sort((a,b)=>TR[b]-TR[a]).slice(0,40).forEach(t=>P('      '+String(TR[t]).padStart(4)+'  '+t));
  const CBc=CB.filter(o=>o.cx);const seen={};CBc.forEach(o=>{const kk=o.eq+'|'+o.inj+'|'+o.k;if(seen[kk])return;seen[kk]=1;P('    e.g. '+o.k+' '+o.lab+' @ '+o.k+' '+o.w+' '+o.d+' '+o.s+'\n              '+o.cx);});
  P('\n  FIX-A for comparison, candidate -> CA: ');const CA=G.flatMap(x=>x.cfa.map(o=>Object.assign({k:x.k,L:x.L,eq:x.eq,inj:x.inj},o)));
  P('  ops '+CA.length+' on '+new Set(CA.map(o=>o.k+o.w+o.d)).size+' days, '+progs(CA)+' programs | by tier x inj '+fmt(tally(CA,o=>o.eq+' '+o.inj))+' | by kind '+fmt(tally(CA,o=>o.k)));
  P('  universe C->CF: programs losing '+G.filter(x=>x.uni.CCF.lost.length).length+' gaining '+G.filter(x=>x.uni.CCF.gain.length).length+' | C->CA: losing '+G.filter(x=>x.uni.CCA.lost.length).length+' '+fmt(tally(G.flatMap(x=>x.uni.CCA.lost),n=>n))+' gaining '+G.filter(x=>x.uni.CCA.gain.length).length);
  P('\n################ (C) D196-6 universe V230 -> candidate (== V230 -> CF): programs gaining, by L x inj x tier');
  const UG=G.filter(x=>x.uni.VC.gain.length);P('  gaining '+UG.length+' of '+G.length+' | '+fmt(tally(UG,x=>x.L+' '+x.inj+' '+x.eq+' +'+x.uni.VC.gain.join('+')))+' | losing '+G.filter(x=>x.uni.VC.lost.length).length+' | V->CF gaining '+G.filter(x=>x.uni.VCF.gain.length).length+' losing '+G.filter(x=>x.uni.VCF.lost.length).length);
  P('\n################ (D) W5 step with the fix (ABx -> PREf), classified by the amended text; per lattice');
  for(const Ls of [['K'],['E'],['FULL','INJ','L432','LBW']]){const S=G.filter(x=>Ls.includes(x.L));const O=S.flatMap(x=>x.w5.map(o=>Object.assign({row:x},o)));const T=tally(O,o=>o.c);
    P('\n  == '+Ls.join('+')+': '+S.length+' configs; W5 ops '+O.length+'; OUTSIDE '+O.filter(o=>/^OUT/.test(o.c)).length);
    Object.keys(T).sort((a,b)=>T[b]-T[a]).forEach(cl=>{const X=O.filter(o=>o.c===cl);P('      '+String(T[cl]).padStart(6)+'  '+cl+'   | programs '+new Set(X.map(o=>o.row.k)).size+' | days '+new Set(X.map(o=>o.row.k+o.w+o.d)).size+' | inj '+fmt(tally(X,o=>o.row.inj)).slice(0,160)+' | tier '+fmt(tally(X,o=>o.row.eq)).slice(0,120)+' | exp '+fmt(tally(X,o=>o.row.exp)).slice(0,100)+' | rest '+fmt(tally(X,o=>o.row.rest)));
      X.slice(0,/^OUT/.test(cl)?4:(/D198|Am2/.test(cl)?2:1)).forEach(o=>P('            e.g. '+o.row.k+' W'+o.w+' '+o.d+' :: '+o.s+(o.cx?'\n              '+o.cx:'')));});
    const RG=O.filter(o=>o.reg.length);P('    regression TEXT tags on W5 ops: '+fmt(tally(RG,o=>o.reg.join('+')+' => '+o.c)).slice(0,1200));
    const FLO=S.flatMap(x=>x.fl.map(o=>Object.assign({row:x},o)));P('    FL step PREf -> CF: '+FLO.length+' ops | '+fmt(tally(FLO,o=>o.c)));}
  const O=G.flatMap(x=>x.w5);P('\nTOTAL W5 ops (ABx -> PREf) '+O.length+' | OUTSIDE '+O.filter(o=>/^OUT/.test(o.c)).length+' | per class: '+fmt(tally(O,o=>o.c)));
  P('REPORT DONE');}
if(process.env.WORKER)worker(process.env.WORKER);
else{(async()=>{P('coach4 d196a2_fix  clock '+CLOCK+'  configs '+ALL().length);P('PREP');prep();
  if(process.env.SKIPRUN!=='1'){fs.readdirSync(SCR).filter(f=>/^res_\d+_\d+\.json$/.test(f)).forEach(f=>fs.unlinkSync(F(f)));const cr=await run();if(cr)P('!!! worker crashes: '+cr);}
  report();})();}
