// v212 measure M8 — P-TESTLEN pre-build measures (coach ruling p_safepace_ruling.md, "Measures before build (M8)").
// Usage: node tests/measure/v223_testlen_m8.js <base.html> <scratchdir> [parts=12345]
// Source-surgery copies of <base.html>, every anchor count==1 or NOT-APPLIED exit:
//   S1 = M7 surgery: doGenerate gate  _testWeek <= Math.max(totalWeeksPreview, 26)          (as briefed)
//   S2 = S1 + progTestPin (setProgStart + refreshProgram backfill) tw <= Math.max(len, 26)  (the second writer)
//   S3 = S2 + backfill guard `=== undefined` -> `== null`   (COUNTERFACTUAL: measures what a null-keyed backfill would move)
// ORACLES: test week by Date.UTC Monday arithmetic from the built startDate; test weekday from the date string;
// trained-day identity = JSON of the stored day / ia_hist_ snapshot vs the refreshed day (bytes, not an engine predicate);
// copy = regex over rendered wizard HTML vs built prog.totalWeeks.
const path=require("path"), fs=require("fs");
const ART=path.resolve(process.argv[2]); const SCR=path.resolve(process.argv[3]||"/tmp"); const PARTS=process.argv[4]||"12345";
const R=Date; let NOW=new R(2026,8,22,21,16,0).getTime();
class F extends R{constructor(...a){if(a.length===0)super(NOW);else super(...a);} static now(){return NOW;}}
globalThis.Date=F;
const setToday=iso=>{const[y,m,d]=iso.split("-").map(Number);NOW=new R(y,m-1,d,21,16,0).getTime();};
const H=require(path.resolve(__dirname,"..","harness.js"));
const src=fs.readFileSync(ART,"utf8");
const ANC1="if(!(_testWeek >= 1 && _testWeek <= totalWeeksPreview)) _testWeek = null;";
const ANC2="return {tw: (tw >= 1 && tw <= len) ? tw : null, len};";
const ANC3="if(prog.cfg._testWeek === undefined){";
const cnt=a=>src.split(a).length-1;
console.log("anchor counts",cnt(ANC1),cnt(ANC2),cnt(ANC3)); if(cnt(ANC1)!==1||cnt(ANC2)!==1||cnt(ANC3)!==1){console.log("NOT-APPLIED");process.exit(2);}
const s1=src.replace(ANC1,"if(!(_testWeek >= 1 && _testWeek <= Math.max(totalWeeksPreview, 26))) _testWeek = null;");
const s2=s1.replace(ANC2,"return {tw: (tw >= 1 && tw <= Math.max(len, 26)) ? tw : null, len};");
const s3=s2.replace(ANC3,"if(prog.cfg._testWeek == null){");
const FILES={}; for(const [k,s] of [["S1",s1],["S2",s2],["S3",s3]]){ const f=path.join(SCR,"testlen_m8_"+k+".html"); try{fs.unlinkSync(f);}catch(e){} fs.writeFileSync(f,s); FILES[k]=f; }
function mkVM(file){ const IA=H.load(file); const els=new Map(); const mk=IA.window.document.createElement;
  IA.window.document.getElementById=id=>{ if(!els.has(id)){const e=mk("div"); e.id=id; els.set(id,e);} return els.get(id); };
  return {IA,els}; }
const V={base:mkVM(ART),S1:mkVM(FILES.S1),S2:mkVM(FILES.S2),S3:mkVM(FILES.S3)};
console.log("versions",Object.entries(V).map(([k,v])=>k+"="+v.IA.version).join(" "),"TZ",Intl.DateTimeFormat().resolvedOptions().timeZone);
const U=s=>{const[y,m,d]=s.split("-").map(Number);return R.UTC(y,m-1,d);};
const isoU=t=>new R(t).toISOString().slice(0,10); const addD=(iso,n)=>isoU(U(iso)+n*864e5);
const monU=t=>t-((new R(t).getUTCDay()+6)%7)*864e5;
const oracleTW=(s0,t0)=>{const s=U(s0),t=U(t0); if(t<s) return null; return Math.floor((monU(t)-monU(s))/864e5/7)+1;};
const DOW=["sun","mon","tue","wed","thu","fri","sat"]; const dowOf=iso=>DOW[new R(U(iso)).getUTCDay()];
const ORD=["mon","tue","wed","thu","fri","sat","sun"];
const fmt=s=>Math.floor(s/60)+":"+String(s%60).padStart(2,"0");
const txt=h=>(h||"").replace(/<svg[\s\S]*?<\/svg>/g,"").replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim();
function setWD(Vm,o){ Vm.IA.window.__O=o;
  Vm.IA.eval(`WD={primaryPath:"event",cardioTypes:["run"],experience:__O.exp,ageBracket:__O.age||"18-35",eventTargeted:true,raceDate:__O.race,
    liftingFocus:"support_prevention",equipment:"crossfit",restDays:__O.rest,unit:"lbs",seed:4242,name:"M",cardioGoals:{run:__O.run},startDate:undefined};`);
  Vm.els.clear(); }
function rec(Vm){ return Vm.IA.eval(`calcProgramLength(["run"],{...WD.cardioGoals,_experience:WD.experience,_ageBracket:WD.ageBracket,_eventTargeted:true},LIFTING_FOCUS_TO_GOAL[WD.liftingFocus]||"balanced").weeks`); }
function gen(Vm){ const IA=Vm.IA; IA.localStorage._map.clear(); IA.eval("activeProg=null");
  try{IA.eval("doGenerate()");}catch(e){return {err:"threw "+e.message};} IA.flushTimers(Infinity);
  const p=IA.eval("activeProg"); if(!p) return {err:"no program"};
  return {p,tw:IA.eval("WD._testWeek"),sub:(Vm.els.get("generateSub")||{}).textContent}; }
function copy(Vm){ const IA=Vm.IA;
  IA.eval('wizardStep=WIZARD_STEPS.indexOf("cardio_goal");renderWizardStep();updateRaceDateFeedback()');
  const body=Vm.els.get("wizardBody").innerHTML, fb=txt((Vm.els.get("raceDateFeedback")||{innerHTML:""}).innerHTML);
  IA.eval('wizardStep=WIZARD_STEPS.indexOf("name");renderWizardStep()'); const nb=txt(Vm.els.get("wizardBody").innerHTML);
  return {hdr:+((body.match(/Program length: (\d+) weeks/)||[])[1])||null, fb, name:+((nb.match(/Program length\s*(\d+)\s*weeks?/i)||[])[1])||null}; }
const GOALS=[]; for(const t of [570,660,750,855]) GOALS.push(["1.5mi "+fmt(t),{id:"run_pace_goal",label:"x",targetDist:"1.5",paceUnit:"mi",targetMins:String(Math.floor(t/60)),targetSecs:String(t%60),targetTime:fmt(t)}]);
for(const t of [360,420,480,570]) GOALS.push(["1mi "+fmt(t),{id:"run_pace_goal",label:"x",targetDist:"1",paceUnit:"mi",targetMins:String(Math.floor(t/60)),targetSecs:String(t%60),targetTime:fmt(t)}]);
const W1MON="2026-09-21"; const raceFor=(k,wd)=>isoU(U(W1MON)+((k-1)*7+wd)*864e5);
const runOn=(p,w,d)=>{const c=((p.weeks[w]||{})[d]||{}).cardio; return (Array.isArray(c)?c:(c?[c]:[])).filter(x=>x&&x.type==="run");};
const bump=(o,k)=>{o[k]=(o[k]||0)+1;};
const T0=Date.now();

// ======================= PART 1 =======================
if(PARTS.includes("1")){
console.log("\n=== 1  rest patterns (S1 vs base, paired). test on Thu and Sat of program week k, k=1..30");
const RESTS={"sun (6 train)":["sun"],"sat,sun (5)":["sat","sun"],"mon,fri (5)":["mon","fri"],"fri,sat,sun (4)":["fri","sat","sun"],"mon,wed,fri,sun (3)":["mon","wed","fri","sun"],"sun,wed (5, M7)":["sun","wed"]};
const TOT={n:0,err:0,changed:0,endNotTest:0,ex:[]};
for(const [rk,rest] of Object.entries(RESTS)){
  const S={n:0,err:0,changed:0,endNotTest:0,orMis:0,newPin:0,beyond26:0,unchDigest:0,testDay:{},afterTestTrain:0,prefixRun:0,ext:{}};
  for(const [gl,run] of GOALS) for(const exp of ["beginner","intermediate","advanced"]) for(const age of ["18-35","55+"]) for(const mile of [null,480]) for(const wd of [3,5]) for(let k=1;k<=30;k++){
    const r=Object.assign({},run,mile?{mileBestMins:"8",mileBestSecs:"00"}:{}); const o={exp,age,rest,race:raceFor(k,wd),run:r};
    setToday("2026-09-22"); setWD(V.base,o); const a=gen(V.base); setWD(V.S1,o); const b=gen(V.S1); S.n++;
    if(a.err||b.err){S.err++; if(TOT.ex.length<5) TOT.ex.push(rk+" "+gl+" "+(a.err||b.err)); continue;}
    const tw=oracleTW(b.p.startDate,o.race); if(b.tw!=null&&b.tw!==tw) S.orMis++;
    if(a.tw==null&&b.tw!=null) S.newPin++; if(tw>26) S.beyond26++;
    const ta=a.p.totalWeeks, tb=b.p.totalWeeks;
    if(ta!==tb){ S.changed++; bump(S.ext,tb-ta<=5?"+1..5":tb-ta<=10?"+6..10":tb-ta<=15?"+11..15":"+16..");
      if(tb!==tw||b.tw!==tw){ S.endNotTest++; if(TOT.ex.length<8) TOT.ex.push(`${rk} ${gl} ${exp} k${k} ${o.race}: built ${tb} oracle tw ${tw} pinned ${b.tw}`); }
      const rd=dowOf(o.race); const rs=runOn(b.p,tb,rd); bump(S.testDay,rs.length?rs.map(x=>x.subtype.replace(/\(.*\)/,"").trim()).join("+"):("NO RUN ON "+rd+(rest.includes(rd)?" (rest day)":"")));
      const after=ORD.slice(ORD.indexOf(rd)+1).filter(d=>{const day=(b.p.weeks[tb]||{})[d]; return day&&!day.rest&&((day.sections||[]).length||runOn(b.p,tb,d).length);}); if(after.length) S.afterTestTrain++;
      let pr=true; for(let i=1;i<=3&&i<=ta;i++) if(JSON.stringify(runOn(a.p,i,"x"))!==JSON.stringify(runOn(b.p,i,"x"))||JSON.stringify(Object.keys(a.p.weeks[i]).map(d=>runOn(a.p,i,d).map(x=>x.subtype)))!==JSON.stringify(Object.keys(b.p.weeks[i]).map(d=>runOn(b.p,i,d).map(x=>x.subtype)))) pr=false; if(pr) S.prefixRun++;
    } else if(H.progDigest(a.p)!==H.progDigest(b.p)) S.unchDigest++;
  }
  console.log(`-- ${rk.padEnd(20)} builds ${S.n} err ${S.err} | changed ${S.changed} | changed not ending on oracle test week ${S.endNotTest} | pinned!=oracle ${S.orMis} | unpinned->pinned ${S.newPin} | oracle tw>26 ${S.beyond26} | same-length digest moved ${S.unchDigest}`);
  console.log(`   ext ${JSON.stringify(S.ext)} | last-week run on test weekday: ${JSON.stringify(S.testDay)} | changed builds with training after the test day ${S.afterTestTrain} | W1-3 run subtypes equal ${S.prefixRun}/${S.changed}`);
  TOT.n+=S.n; TOT.err+=S.err; TOT.changed+=S.changed; TOT.endNotTest+=S.endNotTest;
}
console.log("   TOTAL builds",TOT.n,"err",TOT.err,"changed",TOT.changed,"changed-not-on-test",TOT.endNotTest,"examples:",JSON.stringify(TOT.ex));
console.log("   t",Math.round((Date.now()-T0)/1000),"s");
}

// ======================= PART 2 =======================
if(PARTS.includes("2")){
console.log("\n=== 2  stored V209 program, _testWeek null, trained days, boot the copy (refreshProgram) and setProgStart");
const R2={}; const exs=[];
const cases=[]; for(const [gl,run] of [GOALS[0],GOALS[3],GOALS[4],GOALS[7]]) for(const exp of ["beginner","advanced"]) for(const k of [10,14,20,26,28]) for(const cw of [2,4,7]) for(const shape of ["asStored(null)","pre-V207(undefined)"]) cases.push({gl,run,exp,k,cw,shape});
for(const c of cases){
  const o={exp:c.exp,rest:["sun","wed"],race:raceFor(c.k,3),run:Object.assign({},c.run,{mileBestMins:"8",mileBestSecs:"00"})};
  setToday("2026-09-22"); setWD(V.base,o); const g=gen(V.base); if(g.err){bump(R2,"GEN ERR");continue;}
  const store=JSON.parse(JSON.stringify(Object.fromEntries(V.base.IA.localStorage._map)));
  const progs=JSON.parse(store.ia_programs); const P0=progs[0]; const id=P0.id;
  const hadKey=Object.prototype.hasOwnProperty.call(P0.cfg,"_testWeek"); const storedTW=P0.cfg._testWeek;
  if(c.shape.startsWith("pre")) delete P0.cfg._testWeek;
  store.ia_programs=JSON.stringify(progs);
  // today = Tuesday of week cw; weeks 1..cw-1 fully trained (comp; hist snapshot on every other day), week cw first train day trained
  const today=addD("2026-09-22",7*(c.cw-1)); const comp={}, hist={}; const trained=[];
  for(let w=1;w<=c.cw;w++){ const days=Object.keys(P0.weeks[w]||{}).filter(d=>!P0.weeks[w][d].rest).sort((x,y)=>ORD.indexOf(x)-ORD.indexOf(y));
    const pick=w<c.cw?days:days.filter(d=>ORD.indexOf(d)<=1).slice(0,1);
    pick.forEach((d,i)=>{ const key="w"+w+"_"+d; comp[key]=true; if(i%2===0) hist[key]=JSON.parse(JSON.stringify(P0.weeks[w][d])); trained.push([w,d]); }); }
  store["ia_comp_"+id]=JSON.stringify(comp); store["ia_hist_"+id]=JSON.stringify(hist);
  for(const vk of ["base","S1","S2","S3"]){
    const IA=V[vk].IA; setToday(today); IA.localStorage._map.clear(); for(const [k,v] of Object.entries(store)) IA.localStorage._map.set(k,v);
    let out; try{ out=IA.eval("refreshProgram")(JSON.parse(store.ia_programs)[0]); }catch(e){ bump(R2,vk+" refresh threw "+e.message); continue; }
    const pers=JSON.parse(IA.localStorage._map.get("ia_programs"))[0].cfg;
    let trainedMoved=0; trained.forEach(([w,d])=>{ if(JSON.stringify((out.weeks[w]||{})[d])!==JSON.stringify(P0.weeks[w][d])) trainedMoved++; });
    const chW=[]; for(let w=1;w<=Math.max(P0.totalWeeks,out.totalWeeks);w++) if(JSON.stringify(out.weeks[w])!==JSON.stringify(P0.weeks[w])) chW.push(w);
    const firstCh=chW.length?chW[0]:"-"; const ot=oracleTW(P0.startDate,o.race);
    const key=`${vk.padEnd(4)} ${c.shape.padEnd(20)} test<=26:${c.k<=26}`;
    R2[key]=R2[key]||{n:0,ext:0,endOnTest:0,trainedDays:0,trainedMoved:0,persistTW:{},firstChangedWeek:{},changedBeforeCw:0};
    const Z=R2[key]; Z.n++; if(out.totalWeeks>P0.totalWeeks) Z.ext++; if(out.totalWeeks===ot) Z.endOnTest++; Z.trainedDays+=trained.length; Z.trainedMoved+=trainedMoved;
    bump(Z.persistTW,String(pers._testWeek)); bump(Z.firstChangedWeek,"cw"+c.cw+":W"+firstCh); if(chW.some(w=>w<c.cw)) Z.changedBeforeCw++;
    if(!exs.find(x=>x[0]===key)&&out.totalWeeks!==P0.totalWeeks) exs.push([key,`${c.gl} ${c.exp} test wk ${c.k} cw ${c.cw}: stored ${P0.totalWeeks}wk key ${hadKey?JSON.stringify(storedTW):"absent"} -> ${out.totalWeeks}wk, changed weeks ${chW.join(",")}`]);
    // setProgStart (resume/re-date path) on the refreshed program, same start
    if(vk!=="base"&&c.cw===2&&c.exp==="beginner"){ try{ IA.eval("activeProgId="+JSON.stringify(id)+";activeProg=__AP;".replace("__AP","JSON.parse(localStorage.getItem('ia_programs'))[0]")); IA.eval("activeProg=refreshProgram(activeProg)");
        IA.eval("setProgStart("+JSON.stringify(P0.startDate)+")"); IA.flushTimers(Infinity); const ap=IA.eval("activeProg");
        const sk=`${vk} setProgStart ${c.shape} test<=26:${c.k<=26}`; R2[sk]=R2[sk]||{n:0,len:{}}; R2[sk].n++; bump(R2[sk].len,"k"+c.k+":"+P0.totalWeeks+"->"+ap.totalWeeks+" tw "+ap.cfg._testWeek);
      }catch(e){ bump(R2,vk+" setProgStart threw "+e.message.slice(0,60)); } }
  }
}
console.log("   stored programs",cases.length/2,"x 2 cfg shapes; stored cfg carries _testWeek key as written by V209:",(()=>{setToday("2026-09-22");setWD(V.base,{exp:"beginner",rest:["sun","wed"],race:raceFor(20,3),run:GOALS[4][1]});const g=gen(V.base);return JSON.stringify({has:Object.prototype.hasOwnProperty.call(g.p.cfg,"_testWeek"),val:g.p.cfg._testWeek,cap:g.p.cfg._raceDateCappedWeeks,tot:g.p.totalWeeks});})());
for(const [k,z] of Object.entries(R2)) console.log("  ",k,JSON.stringify(z));
exs.forEach(x=>console.log("   ex",x[0],"|",x[1]));
console.log("   t",Math.round((Date.now()-T0)/1000),"s");
}

// ======================= PART 3 =======================
if(PARTS.includes("3")){
console.log("\n=== 3  D25 snap: test 0..7 days out x 7 weekdays x 7 rest patterns, base vs S1");
const RESTS={none:[],sun:["sun"],"sun,wed":["sun","wed"],"sat,sun":["sat","sun"],"fri,sat,sun":["fri","sat","sun"],"mon,wed,fri":["mon","wed","fri"],"thu..sun":["thu","fri","sat","sun"]};
const run={id:"run_pace_goal",label:"x",targetDist:"1.5",paceUnit:"mi",mileBestMins:"8",mileBestSecs:"00",targetMins:"12",targetSecs:"0",targetTime:"12:00"};
const tab={}, diffs={n:0,d:0}; const ex=[];
for(let wd=0;wd<7;wd++) for(let du=0;du<=7;du++) for(const [rk,rest] of Object.entries(RESTS)){
  const today=addD("2026-09-21",wd); const race=addD(today,du); const o={exp:"intermediate",rest,race,run};
  const row={};
  for(const vk of ["base","S1"]){ setToday(today); setWD(V[vk],o); const cp=copy(V[vk]); setWD(V[vk],o); const b=gen(V[vk]); if(b.err){row[vk]={err:b.err};continue;}
    row[vk]={tw:b.tw,tot:b.p.totalWeeks,start:b.p.startDate,ot:oracleTW(b.p.startDate,race),fb:cp.fb.slice(0,140),hdr:cp.hdr,sub:b.sub,dig:H.progDigest(b.p)}; }
  diffs.n++; if(row.base.dig!==row.S1.dig) diffs.d++;
  const s=row.S1; const cls=s.ot==null?"TEST BEFORE START":s.tw==null?"unpinned":"pinned";
  const k=`${cls} tw=${s.tw} built=${s.tot}`; bump(tab,k);
  if(cls==="TEST BEFORE START"&&ex.length<3) ex.push(`${today}(${dowOf(today)}) rest ${rk} test ${race}(${dowOf(race)}) +${du}d: start ${s.start}, built ${s.tot} wk, generate screen "${s.sub}", callout "${s.fb}"`);
}
console.log("   builds",diffs.n,"| base vs S1 digest differs",diffs.d); Object.keys(tab).sort().forEach(k=>console.log("   ",k,tab[k])); ex.forEach(x=>console.log("   ex",x));
}

// ======================= PART 4 + 5 =======================
if(PARTS.includes("4")||PARTS.includes("5")){
console.log("\n=== 4/5  copy vs built length on S1 (rest sun,wed; clock 2026-09-22; test Thu of week k)");
const M={}; const ex={};
for(const [gl,run] of GOALS) for(const exp of ["beginner","intermediate","advanced"]) for(const mile of [null,480]) for(let k=1;k<=30;k++){
  const o={exp,rest:["sun","wed"],race:raceFor(k,3),run:Object.assign({},run,mile?{mileBestMins:"8",mileBestSecs:"00"}:{})};
  setToday("2026-09-22"); setWD(V.base,o); const a=gen(V.base); setWD(V.S1,o); const cp=copy(V.S1); setWD(V.S1,o); const b=gen(V.S1); if(a.err||b.err){bump(M,"ERR");continue;}
  const r=rec(V.S1); const cls=k>26?(k>r?"beyond26":"k>26 inside rec"):(a.p.totalWeeks!==b.p.totalWeeks?"changed":"unchanged");
  const subN=+((b.sub.match(/(\d+)-week/)||[])[1]);
  M[cls]=M[cls]||{n:0,hdrEqBuilt:0,nameEqBuilt:0,subEqBuilt:0,hdrEqRec:0,fbSays:{}}; const Z=M[cls]; Z.n++;
  const fbN=+((cp.fb.match(/our (\d+)-week program/)||[])[1])||null; Z.fbN=Z.fbN||{eqBuilt:0,eqRec:0,none:0}; if(fbN==null) Z.fbN.none++; else if(fbN===b.p.totalWeeks) Z.fbN.eqBuilt++; else if(fbN===r) Z.fbN.eqRec++;
  if(cp.hdr===b.p.totalWeeks) Z.hdrEqBuilt++; if(cp.name===b.p.totalWeeks) Z.nameEqBuilt++; if(subN===b.p.totalWeeks) Z.subEqBuilt++; if(cp.hdr===r) Z.hdrEqRec++;
  const fbk=cp.fb.replace(/\d+/g,"N").replace(/(Your|✓)/,"$1").slice(0,120); bump(Z.fbSays,fbk);
  if(!ex[cls]) ex[cls]=`${gl} ${exp} mile ${mile?"8:00":"none"} test wk ${k} (${o.race}): rec ${r}, built ${b.p.totalWeeks}, _testWeek ${b.tw}, header "${cp.hdr} weeks", name step "${cp.name} weeks", generate "${b.sub}", callout "${cp.fb.slice(0,200)}"`;
  if(cls==="beyond26"&&k===30&&!ex.b30){ const last=b.p.totalWeeks; ex.b30=`k30: builds ${last} wk, ends ${addD(b.p.startDate,0)} + ${last} wks; weeks between program end and test week (oracle ${oracleTW(b.p.startDate,o.race)}): ${oracleTW(b.p.startDate,o.race)-last}; last-week Thu run: ${JSON.stringify(runOn(b.p,last,"thu").map(x=>x.subtype))}`; }
}
for(const [k,z] of Object.entries(M)) { if(typeof z!=="object"){console.log("  ",k,z);continue;} console.log("  ",k.padEnd(16),"n",z.n,"| header==built",z.hdrEqBuilt,"| name-step==built",z.nameEqBuilt,"| generate screen==built",z.subEqBuilt,"| header==recommended",z.hdrEqRec,"| callout N-week:",JSON.stringify(z.fbN)); Object.entries(z.fbSays).sort((a,b)=>b[1]-a[1]).slice(0,4).forEach(([s,n])=>console.log("        callout x"+n+": "+s)); }
for(const [k,e] of Object.entries(ex)) console.log("   ex",k,"|",e);
}

// ======================= PART 6 =======================
if(PARTS.includes("6")){
console.log("\n=== 6  program generated on the copy, pinned past goal length, then setProgStart (same start / +7d / -7d) and a plain reboot");
const R6={};
for(const vk of ["S1","S2"]) for(const [gl,run] of GOALS) for(const exp of ["beginner","advanced"]) for(const k of [12,14,20,26]) for(const shift of [0,7,-7,"reboot"]){
  const o={exp,rest:["sun","wed"],race:raceFor(k,3),run:Object.assign({},run,{mileBestMins:"8",mileBestSecs:"00"})};
  setToday("2026-09-22"); setWD(V[vk],o); const b=gen(V[vk]); if(b.err){bump(R6,"ERR");continue;} const IA=V[vk].IA; const r=rec(V[vk]);
  if(b.p.totalWeeks<=r) continue;   // only builds P-TESTLEN extended
  const before=b.p.totalWeeks; let after,tw;
  try{ if(shift==="reboot"){ const p=IA.eval("refreshProgram")(JSON.parse(IA.localStorage._map.get("ia_programs"))[0]); after=p.totalWeeks; tw=p.cfg._testWeek; }
       else { IA.eval("setProgStart("+JSON.stringify(addD(b.p.startDate,shift))+")"); IA.flushTimers(Infinity); const ap=IA.eval("activeProg"); after=ap.totalWeeks; tw=ap.cfg._testWeek; } }
  catch(e){ bump(R6,vk+" threw "+e.message.slice(0,60)); continue; }
  const key=vk+" shift "+shift; R6[key]=R6[key]||{n:0,kept:0,shrankToGoalLen:0,other:{}}; const Z=R6[key]; Z.n++;
  const exp2=shift==="reboot"?before:before-(shift/7);
  if(after===exp2) Z.kept++; else if(after===r) Z.shrankToGoalLen++; else bump(Z.other,before+"->"+after+" tw "+tw);
}
for(const [k,z] of Object.entries(R6)) console.log("  ",k,JSON.stringify(z));
console.log("   (expected length after re-date = test week from the new start: before - shift/7)");
}

// ======================= HALF_MANNY + race/run_base =======================
console.log("\n=== HALF_MANNY and race/run_base");
const hm=vk=>H.progDigest(V[vk].IA.buildProgram(H.fixtures.HALF_MANNY));
console.log("   HALF_MANNY",["base","base","S1","S2","S3"].map(hm).join(" "),"| era row 209",(H.MANNY_DIGEST_BY_VERSION||{})[209]);
let nr=0,ne=0; const nc={S1:0,S2:0,S3:0};
for(const gid of ["run_5k","run_10k","run_half","run_marathon","run_base"]) for(const exp of ["beginner","intermediate","advanced"]) for(const mile of [null,480]) for(const k of [4,8,12,16,20,26,30]){
  const o={exp,rest:["sun","wed"],race:raceFor(k,3),run:Object.assign({id:gid,label:"x",paceUnit:"mi"},mile?{mileBestMins:"8",mileBestSecs:"00"}:{})};
  setToday("2026-09-22"); setWD(V.base,o); const a=gen(V.base); if(a.err){ne++;continue;} nr++;
  for(const vk of ["S1","S2","S3"]){ setWD(V[vk],o); const b=gen(V[vk]); if(b.err||H.progDigest(a.p)!==H.progDigest(b.p)) nc[vk]++; } }
console.log("   race + run_base dated builds",nr,"errors",ne,"| digest changed",JSON.stringify(nc));
console.log("t",Math.round((Date.now()-T0)/1000),"s  DONE");
