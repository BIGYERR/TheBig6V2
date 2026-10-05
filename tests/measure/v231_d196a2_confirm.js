'use strict';
// M19 (V231): confirm the absorb coach's proposed D196 Amendment 2 population before gatekeeper classifies
// the blast radius (standing ruling 7). Read-only on the repo; trees are scratch copies.
//   SCR=<scratch>/measure6 node tests/measure/v231_d196a2_confirm.js            (prep + workers + report)
// Trees: V = V230 (base_v230.html), B / ABx / PREx = measure5 part trees, ALLx = the candidate index.html (copied).
// Lattices: M17 (6,912: FULL + INJ + L432 + LBW, verbatim from v231_coach2_surgery.js), g215 LAT_K (630, tables
// and mk() verbatim from tests/gates/g215_d149_ghd.js), g199 LAT (1,728, eCfg verbatim from g199_deload_arbitration.js).
// Op matcher = coach2's ops() (v231_coach2_surgery.js:107). Classifier = coach2's classify() re-pointed at the FINAL
// class list (re-ruling "Final diff-class list for V231") plus the proposed D196 Amendment 2 text. Oracle for the
// class boundary is the ruling TEXT; the engine is only asked what it printed.
const path=require('path'),fs=require('fs'),cp=require('child_process'),crypto=require('crypto');
const ROOT='/Users/CanasBangin/Desktop/TheBig6V2';
const H=require(path.join(ROOT,'tests','harness.js'));const {load,fixtures,progDigest,DAYS}=H;
const SCR=process.env.SCR;if(!SCR)throw new Error('SCR unset');const F=n=>path.join(SCR,n);
const SP=path.dirname(SCR);
const TP={V:path.join(SP,'base_v230.html'),B:F('t_B.html'),ABx:F('t_ABx.html'),PREx:F('t_PREx.html'),ALLx:F('cand.html'),C2ALLx:path.join(SP,'coach2','t_ALLx.html')};
const WANT={V:'72ac41c8d34034ce',B:'b958d4b09b1181bc',ABx:'8d90f9463198e7d4',PREx:'450783528238a6ee',ALLx:'1249c248a6794d1c',C2ALLx:'0e3e0dea88ce0f12'};
const CLOCK='2026-08-24';
// SLOT instrument: each tree gets a tagged twin whose circuit construction literal stamps __slot on the item object
// (lunge / hold / hinge / hipExt). prep() proves tagged == untagged (stripJ drops __slot) before anything is read.
const SLOT_AN=[["{name:ex.lunge[0],detail:'2×10 each'}","{name:ex.lunge[0],detail:'2×10 each',__slot:'lunge'}"],["{name:ex.kneeStab,detail:'2×25 sec'}","{name:ex.kneeStab,detail:'2×25 sec',__slot:'hold'}"],["{name:ex.hinge[0],detail:'2×8'}]","{name:ex.hinge[0],detail:'2×8',__slot:'hinge'}]"],["{name:ex.hipExt,detail:'2×8 each'}","{name:ex.hipExt,detail:'2×8 each',__slot:'hipExt'}"]];
const TAGP=t=>F('tag_'+t+'.html');
function mkTagged(){for(const t of ['V','B','ABx','PREx','ALLx']){let h=fs.readFileSync(TP[t],'utf8');const cs=SLOT_AN.map(([a])=>h.split(a).length-1);
  P('  slot tag anchors '+t.padEnd(5)+cs.join(',')+(t==='V'?' (V230/B have no hipExt item: 0 expected there)':''));
  SLOT_AN.forEach(([a,b],i)=>{if(cs[i]>1)throw new Error('slot anchor '+t+' '+i+' count '+cs[i]);if(cs[i]===1)h=h.replace(a,()=>b);});
  if(cs[0]!==1||cs[1]!==1||cs[2]!==1)throw new Error('slot anchors missing on '+t);try{fs.unlinkSync(TAGP(t));}catch(e){}fs.writeFileSync(TAGP(t),h);}}
const clone=x=>JSON.parse(JSON.stringify(x));const P=s=>console.log(s);
const sha=s=>crypto.createHash('sha256').update(s).digest('hex').slice(0,16);
const tally=(rows,key)=>{const m={};rows.forEach(r=>{const k=key(r);m[k]=(m[k]||0)+1;});return m;};
const fmt=m=>Object.keys(m).sort((a,b)=>m[b]-m[a]||(a<b?-1:1)).map(k=>k+' '+m[k]).join(' | ')||'(none)';
const bump=(o,k,n=1)=>{o[k]=(o[k]||0)+n;};
const clean=n=>String(n==null?'':n).replace(/<svg[\s\S]*?<\/svg>\s*/g,'').replace(/<[^>]+>/g,'').trim();
const ORDER=['mon','tue','wed','thu','fri','sat','sun'];
const CIRC='Leg circuit — runner armor';
const BRIDGE='Single-leg glute bridge',BEDHT='Single-leg hip thrust (shoulders on bed)';
// ── M17 lattice, verbatim (coach2 surgery :19-32) ──
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
// ── g215 LAT_K, verbatim (g215_d149_ghd.js :85-141) ──
const K_TIERS=['commercial','crossfit','home_full','home_basic','bodyweight'];
const K_GOALS=[['run_5k',{}],['run_half',{}],['run_pace_goal',{targetDist:'1.5',targetMins:'10',targetSecs:'0'}],['run_base',{}],['run_10k',{}],['run_marathon',{}]];
const K_AGES=['18-35','36-54','55+'],K_SEEDS=[76308,1234,4242,9001,31337,555,8086,20260];
function mkK(eq,gi,f,exp,age,si,inj){const [g,x]=K_GOALS[gi%K_GOALS.length];
  const c={name:'M',primaryPath:/^support_/.test(f)?'event':'goal',cardioTypes:['run'],cardioGoals:{run:Object.assign({id:g,label:g,mileBestMins:'8',mileBestSecs:'30',baselineDist:'3',baseline:'3mi'},x)},eventTargeted:false,liftingFocus:f,experience:exp,ageBracket:age,equipment:eq,unit:'lbs',restDays:RESTS[si%2].slice(),days:DAYS.slice(),bench:135,squat:155,deadlift:185,seed:K_SEEDS[si]};
  if(inj)c.injury=inj;return c;}
function latK(){const out=[];for(const eq of K_TIERS)K_GOALS.forEach((_,gi)=>FOC.forEach((f,fi)=>EXPS.forEach((e,ei)=>{const si=(gi+fi+ei)%2;out.push({L:'K',c:mkK(eq,gi,f,e,si?'55+':'18-35',si,{region:'knee',tier:'protect'})});})));return out;}
// ── g199 LAT, verbatim (g199_deload_arbitration.js :214-235) ──
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
const _VM={};function vm(t){if(_VM[t])return _VM[t];const X=load(/^T_/.test(t)?TAGP(t.slice(2)):TP[t]);const T=new Date(CLOCK+'T12:00:00').getTime();const RD=Date;class FD extends RD{constructor(...a){if(a.length)super(...a);else super(T);}static now(){return T;}}X.ctx.Date=FD;return _VM[t]=X;}
const stripJ=prog=>JSON.stringify(prog,(k,v)=>(k==='id'||k==='created'||k==='_swapUniverse'||k==='_swapUniverseByKey'||k==='__bw'||k==='__slot')?undefined:v);
function build(t,c,flags){const X=vm(process.env.WORKER&&t!=='C2ALLx'?'T_'+t:t);(flags||[]).forEach(f=>X.ctx[f]=true);let p;try{p=X.buildProgram(clone(c));}catch(e){p={__crash:String(e&&e.message||e).slice(0,200),weeks:{}};}(flags||[]).forEach(f=>{delete X.ctx[f];});return p;}
const liveSecs=day=>(day&&!day.rest&&day.sections||[]).filter(s=>(s.items||[]).length);
const slotOf=(lab,it)=>!/^Leg circuit/.test(lab)?null:(it.__slot||'untagged');
const items=day=>{const o=[];liveSecs(day).forEach(s=>s.items.forEach((it,i)=>{if(it&&it.name){const lab=clean(s.label||s.coreHeader||''),d=clean(it.detail||'');o.push({lab,n:clean(it.name),d,i,len:s.items.length,slot:slotOf(lab,it)});}}));return o;};
const daySig=day=>JSON.stringify(liveSecs(day).map(s=>[clean(s.label||''),s.coreHeader||'',s.rounds||'',!!s.superset,s.items.map(it=>[clean(it.name),clean(it.detail||'')])]));
const card=day=>liveSecs(day).map(s=>clean(s.label||s.coreHeader||'')+(s.superset?' (SS '+(s.rounds||'')+')':'')+' :: '+s.items.map(it=>clean(it.name)+' '+clean(it.detail||'')).join(' | ')).join('\n        ');
const wk=p=>Object.keys(p.weeks||{}).sort((a,b)=>a-b);
const dayOf=(p,w,d)=>p&&p.weeks&&p.weeks[w]&&p.weeks[w][d];
const circ=day=>{const s=liveSecs(day).find(s=>clean(s.label)===CIRC);return s?s.items.map(i=>clean(i.name)+' '+clean(i.detail||'')+' {'+(i.__slot||'untagged')+'}'):null;};
const circN=day=>{const s=liveSecs(day).find(s=>clean(s.label)===CIRC);return s?s.items.map(i=>clean(i.name)):null;};
// ── coach2's op matcher, verbatim (:107-112) ──
function ops(X,Y){const a=items(X),b=items(Y);const kk=i=>i.lab+'\u0001'+i.n+'\u0001'+i.d;const m={};b.forEach(i=>(m[kk(i)]=m[kk(i)]||[]).push(i));const rem=[];
  a.forEach(i=>{const l=m[kk(i)];if(l&&l.length)l.pop();else rem.push(i);});const add=[];Object.values(m).forEach(l=>l.forEach(i=>add.push(i)));const o=[];
  const take=(pred,kind)=>{for(let i=rem.length-1;i>=0;i--){const r=rem[i];const j=add.findIndex(x=>pred(r,x));if(j>=0){o.push({k:kind,r,a:add[j]});add.splice(j,1);rem.splice(i,1);}}};
  take((r,x)=>r.lab===x.lab&&r.n===x.n,'redetail');take((r,x)=>/^(Main|Primer)/.test(r.lab)&&/^(Main|Primer)/.test(x.lab),'rename');take((r,x)=>r.n===x.n,'relabel');take((r,x)=>r.lab===x.lab,'rename');
  rem.forEach(r=>o.push({k:'drop',r}));add.forEach(x=>o.push({k:'add',a:x}));return o;}
const opStr=o=>o.k+' '+(o.r?'['+o.r.lab+(o.r.slot?' #'+o.r.i+'/'+o.r.len+' '+o.r.slot:'')+'] '+o.r.n+' '+o.r.d:'')+(o.r&&o.a?' -> ':'')+(o.a?'['+o.a.lab+(o.a.slot?' #'+o.a.i+'/'+o.a.len+' '+o.a.slot:'')+'] '+o.a.n+' '+o.a.d:'');
const setsOf=d=>{const m=String(d).match(/^(\d+)\s*(×|sets)/);return m?+m[1]:null;};
// ── classifier against the FINAL list + D196 Amendment 2 (proposed). OUT: = outside the amended list. ──
function classify(step,c,o,ctx){
  const eq=c.equipment,f=c.liftingFocus,inj=c.injury?c.injury.region+'/'+c.injury.tier:'none';
  const lab=(o.a||o.r).lab,labR=o.r?o.r.lab:'',labA=o.a?o.a.lab:'';const runner=!!(c.cardioTypes&&c.cardioTypes.includes('run'));
  const removal=o.r&&(o.k==='drop'||o.k==='rename');const st=l=>l.replace(/ — .*$/,'');
  if(step==='B'){
    if(o.k==='redetail'&&o.r.n==='Landmine rotational press'&&/^3×15/.test(o.r.d)&&/^2×15/.test(o.a.d))return 'B-2';
    if(o.k==='rename'&&labR===labA&&ctx.pat(o.r.n)===ctx.pat(o.a.n))return 'B-3';
    if(removal)return 'OUT:B-removal('+o.k+') '+st(labR);
    return ctx.inBo(o.a)?'B-1':'OUT:B-not-in-V230-budget-off '+st(lab);
  }
  if(step==='A'){
    if(f!=='support_prevention')return 'OUT:A-outside-prevention';
    if(o.k==='add'&&labA===CIRC){if(!runner)return 'OUT:A-1 on non-runner';if(inj==='knee/protect')return 'OUT:A-1 on knee/protect';return 'A-1';}
    if(removal){const ab=ctx.abl(o.r);
      if(ab.budget&&!ab.regional){if(/carry/i.test(labR)&&/^(shoulder|elbow)\/protect$/.test(inj))return 'A-4(carry)';if(ctx.isCore(o.r)&&/^(shoulder|elbow)\/protect$/.test(inj))return 'A-4(optional core item)';return 'OUT:A-budget-removal '+st(labR)+' @'+inj;}
      return 'OUT:A-removal('+(ab.regional?'regional':'neither')+') '+st(labR)+': '+o.r.n;}
    if(/^Leg isolation/.test(lab))return 'OUT:A-2/A-3 (withdrawn) '+o.k;
    return 'OUT:A-other '+o.k+' '+st(lab);
  }
  if(step==='W5'){
    const PL=['ankle/protect','knee/protect','lowback/protect','lowback/workaround'];
    if(eq!=='bodyweight'||!PL.includes(inj))return 'OUT:D196-outside-scope '+inj+' '+eq;
    if(o.k==='rename'&&/^(Main|Primer)/.test(labR)&&o.r.n==='Burpees'&&[BRIDGE,BEDHT].includes(o.a.n))return o.r.d===o.a.d?(/^Primer/.test(labR)?'D196-1(Primer)':'D196-1(Main)'):'OUT:D196-1 detail changed';
    if(/^(ankle|knee)/.test(inj)){
      const AK=/^Leg superset [AB]|^Leg isolation|^Leg$/;
      if(/^Leg circuit/.test(labR)||/^Leg circuit/.test(labA)){
        if(f!=='support_prevention')return 'OUT:circuit op off prevention';
        const sl=(o.r&&o.r.slot)||(o.a&&o.a.slot);const cross=(o.k==='relabel')?' (relabel '+labR.replace(/ — .*$/,'')+' -> '+labA.replace(/ — .*$/,'')+')':'';
        if(inj==='ankle/protect'&&sl==='lunge')return 'D196-2(ankle circuit lunge '+o.k+cross+')';
        if(inj==='knee/protect'&&(sl==='lunge'||sl==='hinge'))return 'D196-2-Am2(knee circuit '+sl+' '+o.k+cross+')';
        if(inj==='ankle/protect'&&sl==='hinge')return 'D196-2-Am2(ankle circuit hinge '+o.k+cross+')';
        return 'OUT:circuit '+sl+' slot '+o.k+cross+' @'+inj;}
      if(inj==='knee/protect'&&(o.k==='drop'||o.k==='add')&&/^(Leg isolation|Calves)/.test(labR||labA))return 'D196-5'+(o.k==='add'?'-Am2(appear '+st(labA)+')':'(leave '+st(labR)+')');
      if(removal){const ab=ctx.abl(o.r);if(ab.regional&&!ab.budget)return 'OUT:W5 regional-trim drop '+st(labR)+': '+o.r.n;}
      if(AK.test(labR||labA)&&AK.test(labA||labR))return 'D196-2(Leg sections '+o.k+')';
      return 'OUT:D196-ak-other '+o.k+' '+st(labR||labA);
    }
    if(o.k==='add'&&o.a.n==='Burpees'&&/^\d×10$/.test(o.a.d)&&/^Pull/.test(labA))return 'D196-3';
    if(o.k==='relabel'&&labR==='Pull'&&labA==='Pull superset B')return 'D196-3(relabel)';
    if(o.k==='rename'&&o.r.n==='Burpees'&&o.a.n===BEDHT&&/^\d+ sets — RPE 7 \(leave 3 or more in reserve\)$/.test(o.a.d))return 'D196-4';
    if(o.k==='rename'&&o.r.n==='Burpees'&&o.a.n===BEDHT&&o.r.d===o.a.d)return 'OUT:D196-lb accessory landing, detail verbatim (not D196-4 wording)';
    return 'OUT:D196-lb-other '+o.k+' '+st(lab);
  }
  if(step==='FL'){
    if(eq!=='bodyweight'||inj==='none')return 'OUT:D197-outside-scope';
    if(o.k==='redetail'&&/RPE 8/.test(o.r.d)&&/RPE 7/.test(o.a.d)&&!/RPE 8/.test(o.a.d))return 'D197-1';
    if(o.k==='drop'&&ctx.preSweepLacks(o.r))return 'D197-2';
    if(o.k==='drop')return 'OUT:D197-drop of a name the pre-sweep card also had '+o.r.n;
    return 'OUT:D197-other '+o.k;
  }
  return 'OUT:?';
}
// regression-by-definition TEXT tags (re-ruling :128), independent of the class
const regTag=(step,o)=>{const t=[];if(o.r&&(o.k==='drop'||o.k==='rename')){const l=o.r.lab;
  if(/^Calf|^Calves/.test(l))t.push('calf-line removal');if(/^Leg circuit/.test(l))t.push('circuit-item removal');if(/hip|foot|ankle/i.test(l)&&!/^Leg circuit/.test(l))t.push('hip/foot item removal');if(/^Main/.test(l))t.push('Main removal');
  if(step==='A'&&/^Leg circuit/.test(l)&&o.r.i<2)t.push('A circuit pos1-2 change');}
  return t;};
const MKCHAIN=[['B','V','B'],['A','B','ABx'],['W5','ABx','PREx'],['FL','PREx','ALLx']];
const TREES=['V','B','ABx','PREx','ALLx'];
function cell(row){const c=row.c;const R={k:key(row),L:row.L,eq:c.equipment,f:c.liftingFocus,inj:c.injury?c.injury.region+'/'+c.injury.tier:'none',runner:!!(c.cardioTypes||[]).includes('run'),days:0,chg:{},ops:[],circ:[],calves:[],fourth:[],uni:null,circN:{V:0,ALLx:0,same:0},crash:null};
  const PB={};TREES.forEach(t=>PB[t]=build(t,c));const cr=TREES.filter(t=>PB[t].__crash);if(cr.length){R.crash=cr.join(',')+': '+PB[cr[0]].__crash;return R;}
  const Xv=vm('V');const pat=n=>Xv.eval('_pattern('+JSON.stringify(n)+')')||'-';
  let Vbo=null;const ABL={};const fl=(t,f)=>{const k=t+f;return ABL[k]=ABL[k]||build(t,c,[f]);};
  const uv=new Set(PB.V._swapUniverse||[]),ua=new Set(PB.ALLx._swapUniverse||[]);R.uni={lost:[...uv].filter(n=>!ua.has(n)),gain:[...ua].filter(n=>!uv.has(n))};
  wk(PB.V).forEach(w=>ORDER.forEach(d=>{R.days++;
    const dV=dayOf(PB.V,w,d),dA=dayOf(PB.ALLx,w,d);
    // circuits
    const cv=circ(dV),ca=circ(dA);if(cv)R.circN.V++;if(ca)R.circN.ALLx++;if(cv&&ca&&JSON.stringify(cv)===JSON.stringify(ca))R.circN.same++;
    if(ca&&ca.length>=4&&(R.inj==='knee/protect'||!R.runner))R.fourth.push({w:+w,d,ca});
    if((cv||ca)&&JSON.stringify(cv)!==JSON.stringify(ca)){const per={};TREES.forEach(t=>per[t]=circ(dayOf(PB[t],w,d)));
      const first=TREES.slice(1).find(t=>JSON.stringify(per[t])!==JSON.stringify(per.V));const firstFinal=TREES.slice(1).find(t=>JSON.stringify(per[t])===JSON.stringify(ca));
      const ab={};['__REGIONAL_OFF','__BUDGET_OFF'].forEach(f=>{ab[f]={cand:circ(dayOf(fl('ALLx',f),w,d)),V:circ(dayOf(fl('V',f),w,d))};});
      R.circ.push({w:+w,d,per,first,firstFinal,ab,cardio:dA&&dA.cardio?(dA.cardio.subtype||dA.cardio.type):'-'});}
    // Calves sections
    const hasCalves=t=>liveSecs(dayOf(PB[t],w,d)).some(s=>/^Calves/.test(clean(s.label||'')));
    if(TREES.some(t=>hasCalves(t)!==hasCalves('V'))){const per={};TREES.forEach(t=>per[t]=hasCalves(t));R.calves.push({w:+w,d,per,first:TREES.slice(1).find(t=>per[t]!==per.V),cardV:card(dV),cardA:card(dA)});}
    for(const [step,x,y] of MKCHAIN){const X=dayOf(PB[x],w,d),Y=dayOf(PB[y],w,d);if(daySig(X)===daySig(Y))continue;bump(R.chg,step);
      const coreLabs=new Set(liveSecs(X||{}).filter(s=>s.core||s.optional).map(s=>clean(s.label||s.coreHeader||'')));
      const ctx={pat,inBo:it=>{Vbo=Vbo||build('V',c,['__BUDGET_OFF']);return items(dayOf(Vbo,w,d)).some(z=>z.n===it.n&&z.d===it.d);},isCore:it=>coreLabs.has(it.lab),
        abl:it=>({regional:items(dayOf(fl(y,'__REGIONAL_OFF'),w,d)).some(z=>z.n===it.n),budget:items(dayOf(fl(y,'__BUDGET_OFF'),w,d)).some(z=>z.n===it.n)}),
        preSweepLacks:null};
      // D197-2 oracle: the dropped name must be a sweep landing = absent from the same day of the non-bodyweight twin? Not derivable
      // without the sweep tag; use the definitional test instead: the dropped item is forbidden by the injury plan, i.e. the
      // candidate's own applyInjuryFilter removes it from the PREx card (asked of the filter, recorded as such in the report).
      ctx.preSweepLacks=it=>{const X2=vm('ALLx');X2.ctx.__SEC=[{label:it.lab,items:[{name:it.n,detail:it.d}]}];X2.ctx.__CFG=clone(c);let r;try{r=X2.eval('JSON.stringify(applyInjuryFilter(__SEC,__CFG))');}catch(e){return false;}return !JSON.parse(r).some(s=>(s.items||[]).some(i=>clean(i.name)===it.n));};
      ops(X,Y).forEach(o=>{const cl=classify(step,c,o,ctx);R.ops.push({step,c:cl,reg:regTag(step,o),w:+w,d,s:opStr(o),cx:/^OUT/.test(cl)?(x+': '+card(X)+'\n              '+y+': '+card(Y)):null});});}
  }));
  return R;}
function prep(){const lines=[];
  for(const t of Object.keys(TP)){const s=fs.readFileSync(TP[t],'utf8');const h=sha(s);P('  tree '+t.padEnd(6)+h+(h===WANT[t]?' ok':' MISMATCH want '+WANT[t])+' ia-version '+(s.match(/ia-version" content="(\d+)/)||[])[1]);if(h!==WANT[t])throw new Error('tree hash '+t);}
  const repo=sha(fs.readFileSync(path.join(ROOT,'index.html'),'utf8'));P('  repo index.html '+repo+(repo===WANT.ALLx?' == cand copy':' DIFFERS from cand copy'));
  const hm={};for(const t of TREES.concat(['C2ALLx'])){const a=progDigest(vm(t).buildProgram(clone(fixtures.HALF_MANNY))),b=progDigest(vm(t).buildProgram(clone(fixtures.HALF_MANNY)));hm[t]=a;P('  HALF_MANNY '+t.padEnd(6)+a+(a===b?' self-identical':' SELF-IDENTITY FAIL '+b));}
  mkTagged();{const L0=ALL();const S0=L0.filter((r,i)=>i%97===0||(r.L==='K'&&r.c.equipment==='bodyweight'&&r.c.liftingFocus==='support_prevention'));let ti=0,tn=0,tagged=0,circ=0;
    for(const r of S0)for(const t of ['V','B','ABx','PREx','ALLx']){tn++;const a=vm(t).buildProgram(clone(r.c)),b=vm('T_'+t).buildProgram(clone(r.c));if(stripJ(a)===stripJ(b))ti++;
      Object.values(b.weeks||{}).forEach(W=>Object.values(W||{}).forEach(D=>liveSecs(D).filter(s=>clean(s.label)===CIRC).forEach(s=>s.items.forEach(it=>{circ++;if(it.__slot)tagged++;}))));}
    P('  tagged twin == untagged (stripJ minus __slot) on '+tn+' builds ('+S0.length+' configs x 5 trees, incl. all 18 LAT_K bodyweight prevention): '+ti+'/'+tn+' | circuit items carrying a slot tag '+tagged+'/'+circ);if(ti!==tn)throw new Error('tag not inert');}
  const L=ALL();const S=L.filter((_,i)=>i%97===0);let sv=0,sa=0,eqc=0;for(const r of S){if(stripJ(build('V',r.c))===stripJ(build('V',r.c)))sv++;if(stripJ(build('ALLx',r.c))===stripJ(build('ALLx',r.c)))sa++;if(stripJ(build('ALLx',r.c))===stripJ(build('C2ALLx',r.c)))eqc++;}
  P('  self-identity on '+S.length+' sampled configs (every 97th of '+L.length+'): V '+sv+'/'+S.length+', cand '+sa+'/'+S.length+' | cand == coach2 t_ALLx (version line only differs) '+eqc+'/'+S.length);
  if(sv!==S.length||sa!==S.length)throw new Error('baseline not self-identical');}
function worker(spec){const [a,b]=spec.split(':').map(Number);const out=ALL().slice(a,b).map(cell);fs.writeFileSync(F('res_'+a+'_'+b+'.json'),JSON.stringify(out));P('worker '+spec+' cells '+out.length);}
function run(){return new Promise(done=>{const N=ALL().length,CH=+(process.env.CH||120);const jobs=[];for(let i=0;i<N;i+=CH)jobs.push(i+':'+Math.min(N,i+CH));
  const par=+(process.env.PAR||7);let i=0,crash=0;const t0=Date.now();
  const one=j=>new Promise(res=>{const p=cp.spawn(process.execPath,['--max-old-space-size=4096',__filename],{env:Object.assign({},process.env,{WORKER:j}),stdio:['ignore','pipe','pipe']});let o='';p.stdout.on('data',x=>o+=x);p.stderr.on('data',x=>o+=x);p.on('exit',code=>{if(code){crash++;P('WORKER CRASH '+j+' '+o.slice(-800));}res();});});
  Promise.all(Array.from({length:par},async()=>{while(i<jobs.length)await one(jobs[i++]);})).then(()=>{P('RUN jobs '+jobs.length+' worker crashes '+crash+' '+((Date.now()-t0)/1000).toFixed(0)+' s');done(crash);});});}
function report(){const R=[];fs.readdirSync(SCR).filter(f=>/^res_\d+_\d+\.json$/.test(f)).sort((x,y)=>+x.split('_')[1]-+y.split('_')[1]).forEach(f=>JSON.parse(fs.readFileSync(F(f),'utf8')).forEach(x=>R.push(x)));
  const N=ALL().length;P('\nCELLS '+R.length+'/'+N+' | by lattice '+fmt(tally(R,x=>x.L))+' | build crashes '+R.filter(x=>x.crash).length+(R.some(x=>x.crash)?' e.g. '+R.find(x=>x.crash).k+' '+R.find(x=>x.crash).crash:''));
  if(R.length!==N)P('!!! INCOMPLETE: '+(N-R.length)+' cells missing');
  // (1) LAT_K circuit
  const K=R.filter(x=>x.L==='K'&&!x.crash);P('\n################ (1) g215 LAT_K ('+K.length+' configs, knee/protect, all run goals) — `'+CIRC+'` V230 -> candidate');
  P('  circuits per tier, V230 -> cand (days with a circuit on either side; identical / V / cand):');
  K_TIERS.forEach(t=>{const S=K.filter(x=>x.eq===t);const ch=S.flatMap(x=>x.circ);P('    '+t.padEnd(11)+'circuit days V '+S.reduce((a,x)=>a+x.circN.V,0)+', cand '+S.reduce((a,x)=>a+x.circN.ALLx,0)+', identical '+S.reduce((a,x)=>a+x.circN.same,0)+', changed days '+ch.length+' on '+S.filter(x=>x.circ.length).length+' programs (of '+S.length+'; prevention '+S.filter(x=>x.f==='support_prevention').length+')');});
  const KC=K.flatMap(x=>x.circ.map(o=>Object.assign({k:x.k,f:x.f,eq:x.eq},o)));
  P('  changed circuit days: '+KC.length+' on '+new Set(KC.map(o=>o.k)).size+' programs | by focus '+fmt(tally(KC,o=>o.f))+' | by tier '+fmt(tally(KC,o=>o.eq)));
  P('  first step the circuit differs from V230: '+fmt(tally(KC,o=>o.first))+' | first step equal to the final card: '+fmt(tally(KC,o=>o.firstFinal)));
  P('  __REGIONAL_OFF: cand circuit unchanged by the flag '+KC.filter(o=>JSON.stringify(o.ab.__REGIONAL_OFF.cand)===JSON.stringify(o.per.ALLx)).length+'/'+KC.length+'; the V->cand change survives with the flag on both trees '+KC.filter(o=>JSON.stringify(o.ab.__REGIONAL_OFF.cand)!==JSON.stringify(o.ab.__REGIONAL_OFF.V)).length+'/'+KC.length);
  P('  __BUDGET_OFF  : cand circuit unchanged by the flag '+KC.filter(o=>JSON.stringify(o.ab.__BUDGET_OFF.cand)===JSON.stringify(o.per.ALLx)).length+'/'+KC.length+'; the V->cand change survives with the flag on both trees '+KC.filter(o=>JSON.stringify(o.ab.__BUDGET_OFF.cand)!==JSON.stringify(o.ab.__BUDGET_OFF.V)).length+'/'+KC.length);
  const nm=s=>s.replace(/ (2×|2 sets).*$/,'');const kind=o=>{const a=(o.per.V||[]).map(nm),b=(o.per.ALLx||[]).map(nm);const sl=s=>(s.match(/\{(\w+)\}$/)||[])[1]||'?';
    if(a.length===b.length){if(a.length===1)return 'singleton rename ('+sl(o.per.V[0])+' slot)';const pos=a.map((x,i)=>x!==b[i]?i:-1).filter(i=>i>=0);return pos.map(i=>(i===0?'position-1':'position-'+(i+1))+' rename ('+sl(o.per.V[i])+' slot)').join(' + ');}
    const gone=(o.per.V||[]).filter(x=>!(o.per.ALLx||[]).includes(x)).map(sl);return (b.length<a.length?'drop':'add')+' ('+a.length+'->'+b.length+', V slots leaving: '+gone.join(',')+')';};
  const KO=[];KC.forEach(o=>kind(o).split(' + ').forEach(k=>KO.push(Object.assign({kind:k},o))));
  P('  ops by kind ('+KO.length+' ops on '+KC.length+' days): '+fmt(tally(KO,o=>o.kind)));
  P('  transitions V230 -> cand (names): ');const nm2=s=>s.replace(/ (2×|2 sets)[^{]*/,' ');const TT=tally(KC,o=>'['+(o.per.V||[]).map(nm2).join(', ')+'] -> ['+(o.per.ALLx||[]).map(nm2).join(', ')+']');Object.keys(TT).sort((a,b)=>TT[b]-TT[a]).forEach(t=>P('      '+String(TT[t]).padStart(3)+'  '+t));
  KC.filter(o=>/^drop|^add/.test(kind(o))).forEach(o=>P('    '+kind(o)+': '+o.k+' W'+o.w+' '+o.d+' {'+o.cardio+'} V '+JSON.stringify(o.per.V)+' -> cand '+JSON.stringify(o.per.ALLx)+' | per-step '+TREES.map(t=>t+'='+(o.per[t]||[]).length).join(' ')));
  // all lattices circuit census
  const AC=R.filter(x=>!x.crash).flatMap(x=>x.circ.map(o=>Object.assign({k:x.k,L:x.L,f:x.f,eq:x.eq,inj:x.inj,runner:x.runner},o)));
  P('\n  circuit changes on ALL lattices ('+R.length+' cells): '+AC.length+' days | by L '+fmt(tally(AC,o=>o.L))+' | by inj x tier x first-step: '+fmt(tally(AC,o=>o.inj+' '+o.eq+' @'+o.first)).slice(0,1500));
  const nonA=AC.filter(o=>o.first!=='ABx'||JSON.stringify(o.per.ABx)!==JSON.stringify(o.per.ALLx));P('  of which NOT a pure A-step change (first != ABx, or ABx != final): '+nonA.length+' | by L x inj x tier x first: '+fmt(tally(nonA,o=>o.L+' '+o.inj+' '+o.eq+' @'+o.first)).slice(0,1500));
  // (2) Calves on g199
  const E=R.filter(x=>x.L==='E'&&!x.crash);const EC=E.flatMap(x=>x.calves.map(o=>Object.assign({k:x.k,inj:x.inj,eq:x.eq},o)));
  P('\n################ (2) g199 LAT ('+E.length+' configs): days where a `Calves` section exists on one side only, V230 vs any tree: '+EC.length);
  P('  V230 -> cand: appear '+EC.filter(o=>!o.per.V&&o.per.ALLx).length+', leave '+EC.filter(o=>o.per.V&&!o.per.ALLx).length+', transient (V == cand) '+EC.filter(o=>o.per.V===o.per.ALLx).length+' | by inj x tier: '+fmt(tally(EC,o=>o.inj+' '+o.eq+' '+(o.per.V?'leave':'appear')))+' | first step: '+fmt(tally(EC,o=>o.first)));
  EC.forEach(o=>P('    '+(o.per.V?'LEAVE ':'APPEAR')+' '+o.k+' W'+o.w+' '+o.d+' per-step '+TREES.map(t=>t+'='+(o.per[t]?1:0)).join(' ')));
  const ex=EC.find(o=>!o.per.V&&o.per.ALLx);if(ex)P('    typed: '+ex.k+' W'+ex.w+' '+ex.d+'\n      V230: '+ex.cardV+'\n      cand: '+ex.cardA);
  const ALLC=R.filter(x=>!x.crash).flatMap(x=>x.calves.map(o=>Object.assign({L:x.L,inj:x.inj,eq:x.eq},o)));P('  Calves presence changes on ALL lattices: '+ALLC.length+' | by L x inj x tier x dir x first: '+fmt(tally(ALLC,o=>o.L+' '+o.inj+' '+o.eq+' '+(o.per.V===o.per.ALLx?'transient':o.per.V?'leave':'appear')+' @'+o.first)));
  // (3) full classification
  P('\n################ (3) day-op classification V230 -> B -> ABx -> PREx -> cand, final list + D196 Am.2 (proposed)');
  for(const Ls of [['K'],['E'],['FULL','INJ','L432','LBW']]){const S=R.filter(x=>Ls.includes(x.L)&&!x.crash);const O=S.flatMap(x=>x.ops.map(o=>Object.assign({row:x},o)));
    P('\n  == lattice '+Ls.join('+')+': '+S.length+' configs, '+S.reduce((a,x)=>a+x.days,0)+' days; days changed V->cand by step '+fmt(Object.assign({},...['B','A','W5','FL'].map(s=>({[s]:S.reduce((a,x)=>a+(x.chg[s]||0),0)}))))+'; ops '+O.length+'; OUTSIDE '+O.filter(o=>/^OUT/.test(o.c)).length);
    for(const step of ['B','A','W5','FL']){const OS=O.filter(o=>o.step===step);if(!OS.length)continue;const T=tally(OS,o=>o.c);P('    STEP '+step+' ops '+OS.length+' | outside '+OS.filter(o=>/^OUT/.test(o.c)).length);
      Object.keys(T).sort((a,b)=>T[b]-T[a]).forEach(cl=>{const X=OS.filter(o=>o.c===cl);P('      '+String(T[cl]).padStart(6)+'  '+cl+'   | programs '+new Set(X.map(o=>o.row.k)).size+' | inj '+fmt(tally(X,o=>o.row.inj)).slice(0,200)+' | tier '+fmt(tally(X,o=>o.row.eq)).slice(0,160));
        X.slice(0,/^OUT/.test(cl)?4:(/Am2|B-3|D197-2/.test(cl)?3:1)).forEach(o=>P('            e.g. '+o.row.k+' W'+o.w+' '+o.d+' :: '+o.s+(o.cx?'\n              '+o.cx:'')));});}
    const RG=O.filter(o=>o.reg.length);P('    regression-by-definition TEXT tags (re-ruling :128) on ops: '+RG.length+' | '+fmt(tally(RG,o=>o.step+' '+o.reg.join('+')+' => '+o.c)).slice(0,1600));
    RG.slice(0,6).forEach(o=>P('            e.g. '+o.row.k+' W'+o.w+' '+o.d+' :: '+o.s));
    const FO=S.flatMap(x=>x.fourth.map(o=>Object.assign({k:x.k,inj:x.inj,runner:x.runner},o)));P('    four-item circuit on knee/protect or a non-runner (cand): '+FO.length+(FO.length?' e.g. '+FO[0].k+' W'+FO[0].w+' '+FO[0].d:''));
    const UL=S.filter(x=>x.uni&&x.uni.lost.length),UG=S.filter(x=>x.uni&&x.uni.gain.length);P('    swap universe V230 -> cand: programs losing a name '+UL.length+'/'+S.length+(UL.length?' '+fmt(tally(UL.flatMap(x=>x.uni.lost),n=>n)):'')+' | gaining '+UG.length+' '+fmt(tally(UG,x=>x.inj+' '+x.eq+' +'+x.uni.gain.join('+'))).slice(0,400));
  }
  const O=R.filter(x=>!x.crash).flatMap(x=>x.ops.map(o=>Object.assign({row:x},o)));const out=O.filter(o=>/^OUT/.test(o.c));
  P('\nTOTAL ops '+O.length+' over '+R.length+' configs; OUTSIDE the amended list '+out.length+' ('+(O.length?(100*out.length/O.length).toFixed(3):'0')+'%) | by step '+fmt(tally(out,o=>o.step))+' | per class (all lattices): '+fmt(tally(O,o=>o.c.replace(/ e\.g\..*$/,''))).slice(0,3000));
  P('REPORT DONE');}
if(process.env.WORKER)worker(process.env.WORKER);
else{(async()=>{P('M19 v231_d196a2_confirm  clock '+CLOCK+'  configs '+ALL().length);P('PREP');prep();
  if(process.env.SKIPRUN!=='1'){fs.readdirSync(SCR).filter(f=>/^res_\d+_\d+\.json$/.test(f)).forEach(f=>fs.unlinkSync(F(f)));const cr=await run();if(cr)P('!!! worker crashes: '+cr);}
  report();})();}
