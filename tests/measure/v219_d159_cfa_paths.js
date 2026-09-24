'use strict';
// V219 (D159) measure pass — prove or refute coach's premise for cfA
// (Leg isolation fallback `_laLeft.length>=2?_laLeft:(_laLeft.length?_laLeft:_laGear)`).
// Base is V216 = git 3dc0146, never the working tree. cfA is constructed here by the
// same one-line anchor-asserted edit and checked byte-equal to coach's scratch cfA if given.
// Instrumentation (log-only) at the capSessionBudget call site and at its splice; proven
// output-identical to the uninstrumented artifact on every config before anything is read.
// Oracle: the pre-budget snapshot (what the builder handed the pass) against the post-budget
// snapshot and the pass's own splice log — never "ask capSessionBudget what it should do".
const fs=require('fs'),os=require('os'),path=require('path'),{execSync}=require('child_process');
const REPO='/Users/CanasBangin/Desktop/TheBig6V2';
const {load,progDigest,DAYS}=require(REPO+'/tests/harness.js');
const TMP=process.env.MEASURE_TMP||fs.mkdtempSync(path.join(os.tmpdir(),'v219m-'));
const COACH_CFA=process.env.COACH_CFA||'';
const base=execSync('git -C '+REPO+' show 3dc0146:index.html',{maxBuffer:1<<26}).toString();
function rep1(src,a,b){const n=src.split(a).length-1;if(n!==1)throw new Error('anchor count '+n+' for: '+a.slice(0,80));return src.replace(a,()=>b);}
const cfA=rep1(base,'const legIso=pick(_laLeft.length>=2?_laLeft:_laGear,2','const legIso=pick(_laLeft.length>=2?_laLeft:(_laLeft.length?_laLeft:_laGear),2');
if(COACH_CFA){console.log('cfA constructed == coach scratch cfA: '+(fs.readFileSync(COACH_CFA,'utf8')===cfA));}
function instr(src){
  src=rep1(src,'_day.sections=capSessionBudget(_day.sections,_day.cardio); });',
   '{ const __k=w+"|"+_d; const __on=!!globalThis.__BLOG; if(__on){ (globalThis.__BLOG[__k]=globalThis.__BLOG[__k]||[]).push({pre:JSON.parse(JSON.stringify(_day.sections))}); globalThis.__EVCUR={meta:null,ev:[]}; } _day.sections=capSessionBudget(_day.sections,_day.cardio); if(__on){ const __e=globalThis.__BLOG[__k]; const __r=__e[__e.length-1]; __r.post=JSON.parse(JSON.stringify(_day.sections)); __r.meta=globalThis.__EVCUR.meta; __r.ev=globalThis.__EVCUR.ev; globalThis.__EVCUR=null; } } });');
  src=rep1(src,'  const cap=Math.max(12, SESSION_SET_BUDGET - Math.round(_cardioInterference(cardio)*2));\n',
   '  const cap=Math.max(12, SESSION_SET_BUDGET - Math.round(_cardioInterference(cardio)*2));\n  if(globalThis.__EVCUR) globalThis.__EVCUR.meta={cap:cap,total:_total(sections)};\n');
  src=rep1(src,'\n    sec.items.splice(best.ii,1);\n',
   '\n    if(globalThis.__EVCUR) globalThis.__EVCUR.ev.push({label:sec.label,name:sec.items[best.ii].name,detail:sec.items[best.ii].detail,score:best.score,totalBefore:_total(out),cap:cap,itemsLeftAfter:sec.items.length-1});\n    sec.items.splice(best.ii,1);\n');
  return src;
}
const W=(n,s)=>{const p=path.join(TMP,n);fs.writeFileSync(p,s);return p;};
const IA=load(W('base.html',base)),CA=load(W('cfA.html',cfA)),IAi=load(W('base_i.html',instr(base))),CAi=load(W('cfA_i.html',instr(cfA)));
const clean=n=>String(n==null?'':n).replace(/<svg[\s\S]*?<\/svg>\s*/g,'').replace(/<[^>]+>/g,'').trim();
const live=d=>(d&&!d.rest&&d.sections||[]).filter(s=>(s.items||[]).length);
const LI=s=>/^Leg isolation/.test(String(s&&s.label||''));
// ---- lattice: identical to coach_d159_cfa46.js (ankle/protect hypertrophy slice of the WIDE lattice) ----
const GOALS=[['run_5k',{}],['run_half',{}],['run_pace_goal',{targetDist:'1.5',targetMins:'10',targetSecs:'0'}],['run_base',{}],['run_10k',{}],['run_marathon',{}]];
const EXPS=['beginner','intermediate','advanced'],AGES=['18-35','36-54','55+'],RESTS=[['sun','wed'],['sat','sun']],SEEDS=[76308,1234,4242,9001,31337,555,8086,20260];
function mk(eq,gi,f,exp,age,si,inj){const [g,x]=GOALS[gi%GOALS.length];const c={name:'M',primaryPath:'goal',cardioTypes:['run'],cardioGoals:{run:Object.assign({id:g,label:g,mileBestMins:'8',mileBestSecs:'30',baselineDist:'3',baseline:'3mi'},x)},eventTargeted:false,liftingFocus:f,experience:exp,ageBracket:age,equipment:eq,unit:'lbs',restDays:RESTS[si%2].slice(),days:DAYS.slice(),bench:135,squat:155,deadlift:185,seed:SEEDS[si]};if(inj)c.injury=inj;return c;}
const LAT=[];['bodyweight','home_basic','minimal'].forEach(eq=>EXPS.forEach((e,ei)=>[0,1,2,3].forEach(si=>[0,1].forEach(ri=>{const c=mk(eq,12+ei+si,'hypertrophy',e,AGES[si%3],si,{region:'ankle',tier:'protect'});c.restDays=RESTS[ri].slice();LAT.push({eq,cfg:c});}))));
const bump=(o,k,n)=>{o[k]=(o[k]||0)+(n||1);};
const top=o=>Object.entries(o).sort((a,b)=>b[1]-a[1]).map(([k,v])=>'    '+v+'  '+k).join('\n')||'    (none)';
function build(X,cfg,logOn){X.eval('globalThis.__BLOG='+(logOn?'{}':'null')+';globalThis.__EVCUR=null;');const p=X.buildProgram(JSON.parse(JSON.stringify(cfg)));const log=X.eval('globalThis.__BLOG');X.eval('globalThis.__BLOG=null;');return {p,log:log?JSON.parse(JSON.stringify(log)):null};}
// deep diff -> list of {path,a,b}
function ddiff(a,b,p,out){if(JSON.stringify(a)===JSON.stringify(b))return out;const ta=a===null?'null':typeof a,tb=b===null?'null':typeof b;
  if(ta==='object'&&tb==='object'&&Array.isArray(a)===Array.isArray(b)){const ks=new Set(Object.keys(a).concat(Object.keys(b)));ks.forEach(k=>ddiff(a[k],b[k],p+(Array.isArray(a)?'['+k+']':'.'+k),out));}
  else out.push({path:p,a,b});return out;}
const keyed=secs=>{const seen={},m={};(secs||[]).forEach(s=>{const L=String(s.label);seen[L]=(seen[L]||0)+1;m[L+'#'+seen[L]]=s;});return m;};
const secSig=s=>s?JSON.stringify(s):'(absent)';
// ---- step 0: baseline equals itself; instrumentation is output-identical ----
let selfEq=0,instrEq=0,nb=0;const multiCall={};
LAT.forEach(x=>{const a1=progDigest(IA.buildProgram(JSON.parse(JSON.stringify(x.cfg)))),a2=progDigest(IA.buildProgram(JSON.parse(JSON.stringify(x.cfg))));if(a1===a2)selfEq++;
  const ai=build(IAi,x.cfg,true),ci=build(CAi,x.cfg,true);const c1=progDigest(CA.buildProgram(JSON.parse(JSON.stringify(x.cfg))));
  if(progDigest(ai.p)===a1&&progDigest(ci.p)===c1)instrEq++;nb++;Object.values(ai.log).forEach(v=>{if(v.length>1)bump(multiCall,'calls/day='+v.length);});x.A=ai;x.C=ci;});
console.log('LATTICE '+LAT.length+' configs (bodyweight|home_basic|minimal x 3 exp x 4 seeds x 2 rest patterns, ankle/protect, hypertrophy)');
console.log('baseline self-equal: '+selfEq+'/'+LAT.length+' ; instrumented==uninstrumented (base AND cfA): '+instrEq+'/'+nb+' ; multi-call days: '+JSON.stringify(multiCall));
// ---- classify moved days exactly as coach did ----
let moved=0,dup=0,n42=0,n46=0,postEqFinal=0,postEqFinalN=0;const tiers={},dupT={};
const G42=[],S46=[];
LAT.forEach(x=>{const a=x.A.p,b=x.C.p;Object.keys(a.weeks).forEach(w=>DAYS.forEach(d=>{
  const da=a.weeks[w][d],db=b.weeks[w][d];
  const la=(x.A.log[w+'|'+d]||[]).slice(-1)[0];if(la&&da&&Array.isArray(da.sections)){postEqFinalN++;if(JSON.stringify(la.post)===JSON.stringify(da.sections))postEqFinal++;}
  if(JSON.stringify(da)===JSON.stringify(db))return;moved++;
  const where={};live(da).forEach(s=>s.items.forEach(it=>bump(where,clean(it.name).toLowerCase())));
  if(Object.values(where).some(v=>v>=2)){dup++;bump(dupT,x.eq);return;}
  const rec={x,w,d,da,db,la,lc:(x.C.log[w+'|'+d]||[]).slice(-1)[0]};
  if(live(db).length>live(da).length){n42++;G42.push(rec);bump(tiers,'gained '+x.eq);}else{n46++;S46.push(rec);bump(tiers,'same-shape '+x.eq);}
}));});
console.log('\nMOVED days base->cfA: '+moved+' ; dup-excluded '+dup+' '+JSON.stringify(dupT)+' ; gained-section '+n42+' ; same-shape '+n46);
console.log('by tier:\n'+top(tiers));
console.log('logged post-budget sections == final day sections (base, all logged days): '+postEqFinal+'/'+postEqFinalN);
// ---- (1)+(2) the 42 ----
const q={};const evB={},evC={},otherMoved={},otherEv={},gainedWhat={},exs=[];
G42.forEach(r=>{const {la,lc,da,db}=r;
  const bPre=(la.pre||[]).filter(LI),bPost=(la.post||[]).filter(LI),cPre=(lc.pre||[]).filter(LI),cPost=(lc.post||[]).filter(LI);
  const bFin=(da.sections||[]).filter(LI),cFin=(db.sections||[]).filter(LI);
  bump(q,'BASE pre-budget Leg isolation sections='+bPre.length+' items='+bPre.map(s=>s.items.length).join(',')+' superset='+bPre.map(s=>s.superset).join(','));
  bump(q,'BASE post-budget Leg isolation sections='+bPost.length+' ; final='+bFin.length);
  bump(q,'BASE over budget? total>cap: '+(la.meta?(la.meta.total>la.meta.cap):'no-meta(under cap, early return)'));
  const bLI=(la.ev||[]).filter(e=>LI(e));bump(q,'BASE budget evictions from Leg isolation: '+bLI.length+' (of '+(la.ev||[]).length+' total evictions that day)');
  bLI.forEach(e=>bump(evB,'score '+e.score+' total '+e.totalBefore+'>cap '+e.cap+' left '+e.itemsLeftAfter+' : '+clean(e.name)));
  bump(q,'cfA pre-budget Leg isolation sections='+cPre.length+' items='+cPre.map(s=>s.items.length).join(',')+' superset='+cPre.map(s=>s.superset).join(','));
  bump(q,'cfA post-budget Leg isolation sections='+cPost.length+' ; final='+cFin.length);
  bump(q,'cfA over budget? total>cap: '+(lc.meta?(lc.meta.total>lc.meta.cap):'no-meta(under cap, early return)')+(lc.meta?' (total '+lc.meta.total+' cap '+lc.meta.cap+')':''));
  const cLI=(lc.ev||[]).filter(e=>LI(e));bump(q,'cfA budget evictions from Leg isolation: '+cLI.length+' (of '+(lc.ev||[]).length+' total)');
  cLI.forEach(e=>bump(evC,clean(e.name)));
  // eviction multiset outside Leg isolation, base vs cfA
  const nonLI=ev=>(ev||[]).filter(e=>!LI(e)).map(e=>e.label+' :: '+clean(e.name)).sort().join(' ; ');
  bump(otherEv,(nonLI(la.ev)===nonLI(lc.ev)?'same':'DIFFERENT')+' non-LegIso evictions: base['+nonLI(la.ev)+'] cfA['+nonLI(lc.ev)+']');
  // pre-budget sections other than LI identical?
  const pa=keyed(la.pre),pc=keyed(lc.pre);Object.keys(Object.assign({},pa,pc)).forEach(k=>{if(/^Leg isolation/.test(k))return;if(secSig(pa[k])!==secSig(pc[k]))bump(otherMoved,'PRE-budget '+k);});
  // final day: every section other than LI, full JSON
  const fa=keyed(da.sections),fc=keyed(db.sections);Object.keys(Object.assign({},fa,fc)).forEach(k=>{if(/^Leg isolation/.test(k))return;if(secSig(fa[k])!==secSig(fc[k]))bump(otherMoved,'FINAL '+k+' : '+ddiff(fa[k],fc[k],'',[]).map(z=>z.path+' '+JSON.stringify(z.a)+'->'+JSON.stringify(z.b)).join(' | '));});
  // section order
  const ord=s=>(s||[]).map(z=>z.label).filter(l=>!/^Leg isolation/.test(l)).join('|');if(ord(da.sections)!==ord(db.sections))bump(otherMoved,'FINAL section ORDER differs (ex-LegIso)');
  // day-level fields
  Object.keys(Object.assign({},da,db)).forEach(k=>{if(k==='sections')return;if(JSON.stringify(da[k])!==JSON.stringify(db[k]))bump(otherMoved,'DAY field '+k);});
  cFin.forEach(s=>bump(gainedWhat,s.label+' ['+s.items.map(i=>clean(i.name)+' :: '+i.detail).join(', ')+'] superset='+s.superset+' rounds='+s.rounds));
  if(exs.length<2)exs.push(r.x.eq+' '+r.x.cfg.experience+' seed '+r.x.cfg.seed+' rest '+r.x.cfg.restDays.join('/')+' goal '+r.x.cfg.cardioGoals.run.id+' W'+r.w+' '+r.d+' "'+clean(da.title)+'"\n      base pre LI: '+JSON.stringify(bPre.map(s=>s.items.map(i=>clean(i.name)+' '+i.detail)))+' meta '+JSON.stringify(la.meta)+'\n      base evictions: '+JSON.stringify((la.ev||[]).map(e=>e.label+'::'+clean(e.name)+'@'+e.score))+'\n      cfA  pre LI: '+JSON.stringify(cPre.map(s=>s.items.map(i=>clean(i.name)+' '+i.detail)))+' meta '+JSON.stringify(lc.meta)+'\n      cfA  evictions: '+JSON.stringify((lc.ev||[]).map(e=>e.label+'::'+clean(e.name)+'@'+e.score)));
});
console.log('\n== (1)(2) THE '+n42+' GAINED-SECTION DAYS ==\n'+top(q));
console.log('BASE Leg isolation evictions (reason = pass state at splice):\n'+top(evB));
console.log('cfA Leg isolation evictions:\n'+top(evC));
console.log('non-Leg-isolation evictions, base vs cfA:\n'+top(otherEv));
console.log('ANY other section / field that moved on these days:\n'+top(otherMoved));
console.log('what cfA prints:\n'+top(gainedWhat));
console.log('examples:\n  '+exs.join('\n  '));
// ---- (3) the 46 ----
const p46={},where46={},stage46={};
S46.forEach(r=>{const dd=ddiff(r.da,r.db,'',[]);dd.forEach(z=>{bump(p46,z.path.replace(/\[\d+\]/g,'[i]')+' : '+JSON.stringify(z.a)+' -> '+JSON.stringify(z.b));
  const m=z.path.match(/^\.sections\[(\d+)\]/);if(m){const sa=r.da.sections[+m[1]];bump(where46,String(sa&&sa.label)+' items='+(sa&&sa.items||[]).length);}});
  // where in pipeline did it appear: pre-budget, post-budget, or later
  const st=(r.la&&r.lc)?('pre '+(JSON.stringify(r.la.pre)===JSON.stringify(r.lc.pre)?'EQ':'DIFF')+' / post '+(JSON.stringify(r.la.post)===JSON.stringify(r.lc.post)?'EQ':'DIFF')):'no budget log';
  bump(stage46,st);
  // base pre LI shape
  if(r.la){const b=(r.la.pre||[]).filter(LI),c=(r.lc.pre||[]).filter(LI);bump(stage46,'pre LI base items='+b.map(s=>s.items.length+'/ss='+s.superset).join(',')+' cfA items='+c.map(s=>s.items.length+'/ss='+s.superset).join(','));
    bump(stage46,'base LI evictions '+(r.la.ev||[]).filter(LI).length+' ; cfA LI evictions '+(r.lc.ev||[]).filter(LI).length+' ; non-LI evictions equal: '+(JSON.stringify((r.la.ev||[]).filter(e=>!LI(e)).map(e=>e.label+e.name))===JSON.stringify((r.lc.ev||[]).filter(e=>!LI(e)).map(e=>e.label+e.name))));}
});
console.log('\n== (3) THE '+n46+' SAME-SHAPE DAYS ==\nevery differing leaf path:\n'+top(p46)+'\nsection carrying it:\n'+top(where46)+'\npipeline stage:\n'+top(stage46));
// ---- PHASE B: the budget log refuted "evicted by capSessionBudget" on its face; locate the writer ----
// Snapshot every day after each post-budget pass in buildProgram (log-only; identity re-proven).
const STAGES=[['\n  deconflictAdjacentDupes(weeks, cfg, seed, totalWeeks);','S0 after budget (+swapPrefs)'],
 ["\n  if(cfg.equipment==='bodyweight') bodyweightSweep(",'S1 after deconflictAdjacentDupes'],
 ['\n  hotNextHingeClampSweep(weeks);','S2 after bodyweightSweep|unloadable+grammar'],
 ['\n  preventionDoseSweep(weeks, cfg);','S3 after hotNextHingeClampSweep'],
 ['\n  d18LongRunDayPass(weeks);','S4 after preventionDoseSweep'],
 ['\n  raceEveLiftPass(weeks, totalWeeks);','S5 after d18LongRunDayPass'],
 ['\n  singletonSupersetSweep(weeks);','S6 after raceEveLiftPass'],
 ['\n  delete cfg._racePin;','S7 after singletonSupersetSweep']];
function instr2(src){STAGES.forEach(([a,tag])=>{src=rep1(src,a,'\n  if(globalThis.__PSNAP) globalThis.__PSNAP.push(['+JSON.stringify(tag)+',JSON.stringify(weeks)]);'+a);});return src;}
const IAs=load(W('base_s.html',instr2(instr(base)))),CAs=load(W('cfA_s.html',instr2(instr(cfA))));
function buildS(X,cfg){X.eval('globalThis.__PSNAP=[];globalThis.__BLOG=null;');const p=X.buildProgram(JSON.parse(JSON.stringify(cfg)));const s=X.eval('globalThis.__PSNAP.map(z=>[z[0],z[1]])');X.eval('globalThis.__PSNAP=null;');return {p,snaps:s.map(([t,j])=>[t,JSON.parse(j)])};}
const liSig=secs=>{const L=(secs||[]).filter(LI);return L.length?L.map(s=>s.items.length+'it/ss='+('superset' in s?s.superset:'ABSENT')+'['+s.items.map(i=>clean(i.name)).join('+')+']').join(','):'none';};
const byCfg=new Map();[...G42.map(r=>['42',r]),...S46.map(r=>['46',r])].forEach(([k,r])=>{if(!byCfg.has(r.x))byCfg.set(r.x,[]);byCfg.get(r.x).push([k,r]);});
let idS=0,idN=0;const firstB={},firstC={},trail={};
byCfg.forEach((list,x)=>{const A=buildS(IAs,x.cfg),C=buildS(CAs,x.cfg);idN++;if(progDigest(A.p)===progDigest(x.A.p)&&progDigest(C.p)===progDigest(x.C.p))idS++;
  list.forEach(([k,r])=>{const sb=A.snaps.map(([t,wk])=>[t,liSig(wk[r.w]&&wk[r.w][r.d]&&wk[r.w][r.d].sections)]),sc=C.snaps.map(([t,wk])=>[t,liSig(wk[r.w]&&wk[r.w][r.d]&&wk[r.w][r.d].sections)]);
    const f=(arr,o)=>{for(let i=1;i<arr.length;i++)if(arr[i][1]!==arr[i-1][1]){bump(o,'['+k+'] '+arr[i][0].replace(/^S\d /,'').replace(/^after /,'changed by pass before: ')+' : '+arr[i-1][1]+'  ==>  '+arr[i][1]);}};
    f(sb,firstB);f(sc,firstC);
    bump(trail,'['+k+'] base S0 '+sb[0][1]+' | final '+sb[sb.length-1][1]+' || cfA S0 '+sc[0][1]+' | final '+sc[sc.length-1][1]);});});
console.log('\n== PHASE B: which post-budget pass changes Leg isolation (88 days) ==');
console.log('snapshot build identical to plain build: '+idS+'/'+idN+' configs');
console.log('BASE Leg isolation transitions (stage label = snapshot AFTER which the change is first seen):\n'+top(firstB));
console.log('cfA Leg isolation transitions:\n'+top(firstC));
console.log('S0 vs final, per day:\n'+top(trail));
// ---- PHASE C: (a) who owns the name bodyweightSweep deduped on the 42; (b) do the 46 render differently ----
const owner={};G42.forEach(r=>{const bPre=(r.la.post||[]).filter(LI);const fin=r.da.sections||[];
  bPre.forEach(s=>s.items.forEach(it=>{const k=clean(it.name).toLowerCase();const o=fin.filter(z=>!LI(z)&&(z.items||[]).some(i=>clean(i.name).toLowerCase()===k)).map(z=>z.label);
    bump(owner,clean(it.name)+' -> already on the card in: '+(o.length?o.join(' + '):'NOT FOUND (removed for another reason)'));}));});
console.log('\n== PHASE C ==\n(a) 42 days: every base Leg isolation item alive after the budget, and the final section that already carries the same name:\n'+top(owner));
const rend={};let rendErr=0;
S46.forEach(r=>{try{const ha=IA.eval('buildSectionsHTML')(r.da.sections,0),hb=CA.eval('buildSectionsHTML')(r.db.sections,0);bump(rend,'buildSectionsHTML '+(ha===hb?'IDENTICAL':'DIFFERENT'));
  const ta=IA.eval('sessionTimeEst')(r.da),tb=CA.eval('sessionTimeEst')(r.db);bump(rend,'sessionTimeEst '+(JSON.stringify(ta)===JSON.stringify(tb)?'IDENTICAL':'DIFFERENT '+JSON.stringify(ta)+'/'+JSON.stringify(tb)));
  const i=r.da.sections.findIndex(LI),j=r.db.sections.findIndex(LI);const fa=IA.eval('exControlFlags')(r.da.sections[i],0,r.da.sections[i].items[0]),fb=CA.eval('exControlFlags')(r.db.sections[j],0,r.db.sections[j].items[0]);
  bump(rend,'exControlFlags '+(JSON.stringify(fa)===JSON.stringify(fb)?'IDENTICAL':'DIFFERENT'));
  bump(rend,'serialized day bytes base '+JSON.stringify(r.da).length+' cfA '+JSON.stringify(r.db).length);}catch(e){rendErr++;bump(rend,'ERROR '+String(e&&e.message).slice(0,120));}});
console.log('(b) 46 days, readers executed on base vs cfA day (errors '+rendErr+'):\n'+top(rend));
