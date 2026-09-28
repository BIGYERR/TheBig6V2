// v212 measure M7 — P-TESTLEN before-picture (coach ruling p_safepace_ruling.md, M7).
// Usage: node tests/measure/v223_testlen_m7.js <base.html> <scratchdir>
// Builds a source-surgery copy of <base.html> (anchor count==1) where D106a's gate at doGenerate
// `_testWeek <= totalWeeksPreview` becomes `_testWeek <= Math.max(totalWeeksPreview, 26)`,
// i.e. a dated test goal pins to its test week whenever 1 <= _testWeek <= 26 (P-TESTLEN).
// ORACLES: test week = UTC-Monday date arithmetic from the built startDate (not testWeekIndex);
// "recommended" = the goal-derived length the gate compares against (calcProgramLength, as asked);
// before/after = paired builds identical except for the one-line surgery; HALF_MANNY via fixture.
const path=require("path"), fs=require("fs");
const ART=path.resolve(process.argv[2]); const SCR=path.resolve(process.argv[3]||"/tmp");
const R=Date; let NOW=new R(2026,8,22,21,16,0).getTime();
class F extends R{constructor(...a){if(a.length===0)super(NOW);else super(...a);} static now(){return NOW;}}
globalThis.Date=F;
const H=require(path.resolve(__dirname,"..","harness.js"));
const src=fs.readFileSync(ART,"utf8");
const ANC="if(!(_testWeek >= 1 && _testWeek <= totalWeeksPreview)) _testWeek = null;";
const nA=src.split(ANC).length-1; console.log("anchor count",nA); if(nA!==1){console.log("NOT-APPLIED");process.exit(2);}
const SURG=path.join(SCR,"testlen_surgery.html"); try{fs.unlinkSync(SURG);}catch(e){}
fs.writeFileSync(SURG,src.replace(ANC,"if(!(_testWeek >= 1 && _testWeek <= Math.max(totalWeeksPreview, 26))) _testWeek = null;"));
function mkVM(file){ const IA=H.load(file); const els=new Map(); const mk=IA.window.document.createElement;
  IA.window.document.getElementById=id=>{ if(!els.has(id)){const e=mk("div"); e.id=id; els.set(id,e);} return els.get(id); };
  return {IA,els}; }
const A=mkVM(ART), B=mkVM(SURG);
console.log("base ia-version",A.IA.version,"surgery ia-version",B.IA.version,"TZ",Intl.DateTimeFormat().resolvedOptions().timeZone);
const U=s=>{const[y,m,d]=s.split("-").map(Number);return R.UTC(y,m-1,d);};
const isoU=t=>new R(t).toISOString().slice(0,10);
const monU=t=>t-((new R(t).getUTCDay()+6)%7)*864e5;
const oracleTW=(s0,t0)=>{const s=U(s0),t=U(t0); if(t<s) return null; return Math.floor((monU(t)-monU(s))/864e5/7)+1;};
function build(V,o){ const IA=V.IA; IA.window.__O=o;
  IA.eval(`WD={primaryPath:"event",cardioTypes:["run"],experience:__O.exp,ageBracket:__O.age,eventTargeted:true,raceDate:__O.race,
    liftingFocus:"support_prevention",equipment:"crossfit",restDays:["sun","wed"],unit:"lbs",seed:4242,name:"M",cardioGoals:{run:__O.run},startDate:undefined};`);
  V.els.clear(); IA.localStorage._map.clear(); IA.eval("activeProg=null");
  const rec=IA.eval(`calcProgramLength(["run"],{...WD.cardioGoals,_experience:WD.experience,_ageBracket:WD.ageBracket,_eventTargeted:true},LIFTING_FOCUS_TO_GOAL[WD.liftingFocus]||"balanced").weeks`);
  try{IA.eval("doGenerate()");}catch(e){return {err:"threw "+e.message};} IA.flushTimers(Infinity);
  const p=IA.eval("activeProg"); if(!p) return {err:"no program"};
  return {p,rec,tw:IA.eval("WD._testWeek")}; }
const fmt=s=>Math.floor(s/60)+":"+String(s%60).padStart(2,"0");
const GOALS=[]; for(const t of [570,660,750,855]) GOALS.push(["1.5mi "+fmt(t),{id:"run_pace_goal",label:"x",targetDist:"1.5",paceUnit:"mi",targetMins:String(Math.floor(t/60)),targetSecs:String(t%60),targetTime:fmt(t)}]);
for(const t of [360,420,480,570]) GOALS.push(["1mi "+fmt(t),{id:"run_pace_goal",label:"x",targetDist:"1",paceUnit:"mi",targetMins:String(Math.floor(t/60)),targetSecs:String(t%60),targetTime:fmt(t)}]);
const W1MON="2026-09-21"; const raceFor=k=>isoU(U(W1MON)+((k-1)*7+3)*864e5);   // Thursday of program week k
const distB=k=>k<=4?"a 1-4":k<=8?"b 5-8":k<=12?"c 9-12":k<=16?"d 13-16":k<=20?"e 17-20":k<=26?"f 21-26":"g 27-30";
const T={n:0,err:0,orMis:0,cls:{},byExp:{},byDist:{},byAge:{},byGoal:{},delta:{}};
const C={changed:0,maxExt:0,maxEx:"",hit26:0,newlyPinned:0,unchangedDigestMis:0,ext:{prefixRun:0,prefixAll:0,suffixRun:0,neither:0},extDist:{},twNot:0};
const sigRun=w=>Object.keys(w).map(d=>{const c=w[d].cardio; const a=Array.isArray(c)?c:(c?[c]:[]); return a.filter(x=>x&&x.type==="run").map(x=>d+":"+x.subtype+JSON.stringify(x.dose||null)).join("+");}).join("|");
const sigAll=w=>JSON.stringify(w,(k,v)=>(k==="week"||k==="id")?undefined:v);
const bump=(o,k,c)=>{o[k]=o[k]||{inside:0,equal:0,beyond:0,beyond26:0,nullTW:0,n:0}; o[k][c]++; o[k].n++;};
let EX=null;
for(const [gl,run] of GOALS) for(const exp of ["beginner","intermediate","advanced"]) for(const age of ["18-35","36-54","55+"]) for(const mile of [null,480]) for(let k=1;k<=30;k++){
  const r=Object.assign({},run,mile?{mileBestMins:"8",mileBestSecs:"00"}:{}); const o={exp,age,race:raceFor(k),run:r};
  const a=build(A,o), b=build(B,o); T.n++;
  if(a.err||b.err){T.err++; continue;}
  const tw=oracleTW(a.p.startDate,o.race); if(a.tw!=null && a.tw!==tw) T.orMis++;
  const d=tw==null?null:tw-a.rec; const c=tw==null?"nullTW":tw>26&&tw>a.rec?"beyond26":d<0?"inside":d===0?"equal":"beyond";
  bump(T.cls,"all",c); bump(T.byExp,exp,c); bump(T.byDist,distB(k),c); bump(T.byAge,age,c); bump(T.byGoal,gl.split(" ")[0]+(mile?" +mile":" nomile"),c);
  if(d!=null){const db=d<=-10?"<=-10":d<0?"-9..-1":d===0?"0":d<=5?"+1..+5":d<=10?"+6..+10":d<=15?"+11..+15":">+15"; T.delta[db]=(T.delta[db]||0)+1;}
  const ta=a.p.totalWeeks, tb=b.p.totalWeeks;
  if(a.tw==null && b.tw!=null) C.newlyPinned++;
  if(ta!==tb){ C.changed++; const ext=tb-ta; if(ext>C.maxExt){C.maxExt=ext; C.maxEx=`${gl} ${exp} ${age} mile ${mile?"8:00":"none"} test wk ${tw}: ${ta} -> ${tb}`;} if(tb===26) C.hit26++;
    if(tb!==tw) C.twNot++; const eb=ext<=3?"+1..3":ext<=6?"+4..6":ext<=10?"+7..10":ext<=15?"+11..15":"+16..";C.extDist[eb]=(C.extDist[eb]||0)+1;
    const wa=a.p.weeks, wb=b.p.weeks; let pr=true,pa=true,sf=true;
    for(let i=1;i<=ta;i++){ if(sigRun(wa[i])!==sigRun(wb[i])) pr=false; if(sigAll(wa[i])!==sigAll(wb[i])) pa=false; if(sigRun(wa[i])!==sigRun(wb[i+ext])) sf=false; }
    if(pa) C.ext.prefixAll++; if(pr) C.ext.prefixRun++; if(sf) C.ext.suffixRun++; if(!pr&&!sf) C.ext.neither++;
    if(!EX && a.rec===9 && tw===20 && ta===9) EX={o,gl,a,b};
  } else { if(H.progDigest(a.p)!==H.progDigest(b.p)) C.unchangedDigestMis++; }
}
console.log("\n=== 1  _testWeek - recommended   (lattice",T.n,"builds, errors",T.err,", pinned _testWeek != date oracle:",T.orMis+")");
console.log("classes: inside = test before goal length end; equal; beyond = rec < tw <= 26; beyond26 = tw > 26 and > rec; nullTW = test before start");
const pr=(h,o)=>{console.log("-- "+h); Object.keys(o).sort().forEach(k=>{const x=o[k]; console.log("   ",k.padEnd(14),"n",x.n,"| inside",x.inside,"| equal",x.equal,"| beyond<=26",x.beyond,"| beyond26",x.beyond26,"| null",x.nullTW);});};
pr("all",T.cls); pr("by experience",T.byExp); pr("by weeks-to-test",T.byDist); pr("by age",T.byAge); pr("by goal / mile",T.byGoal);
console.log("-- delta histogram", JSON.stringify(T.delta));
console.log("\n=== 2  P-TESTLEN surgery");
console.log("  builds changing totalWeeks",C.changed+"/"+(T.n-T.err),"| largest extension",C.maxExt,"("+C.maxEx+")","| changed builds landing on 26",C.hit26,"| unpinned -> pinned",C.newlyPinned,"| changed build whose new length != date-oracle test week",C.twNot);
console.log("  unchanged-length builds whose digest moved anyway",C.unchangedDigestMis, "| extension histogram",JSON.stringify(C.extDist));
console.log("\n=== 3  what the extra weeks contain (over",C.changed,"changed builds)");
console.log("  run weeks 1..old identical to old program (extra weeks appended after)",C.ext.prefixRun,"| whole week objects identical",C.ext.prefixAll,"| old run weeks reappear as the LAST weeks (base prepended)",C.ext.suffixRun,"| neither (re-spread)",C.ext.neither);
const cw=(p)=>Object.keys(p.weeks).sort((x,y)=>x-y).map(w=>{const W=p.weeks[w]; const runs=Object.keys(W).map(d=>{const c=W[d].cardio; const a=Array.isArray(c)?c:(c?[c]:[]); return a.filter(x=>x&&x.type==="run").map(x=>d+" "+x.subtype.replace(/ \(.*\)/,"")+(x.dose?" "+[x.dose.reps&&x.dose.reps+"x",x.dose.m&&x.dose.m+"m",x.dose.min&&x.dose.min+"min",x.dose.tgt&&"@"+fmt(x.dose.tgt)].filter(Boolean).join(""):"")).join("+");}).filter(Boolean).join(" | ");
  const lift=Object.keys(W).map(d=>W[d].title).filter(t=>t&&!/rest/i.test(t)).slice(0,2).join(", "); return "  W"+String(w).padStart(2)+"  "+runs+"   [lift: "+lift+"]";}).join("\n");
if(EX){ console.log("  example:",EX.gl,EX.o.exp,EX.o.age,"mile",EX.o.run.mileBestMins?"8:00":"none","test",EX.o.race,"rec",EX.a.rec,"| before",EX.a.p.totalWeeks,"wk tw",EX.a.tw,"| after",EX.b.p.totalWeeks,"wk tw",EX.b.tw);
  console.log("-- BEFORE"); console.log(cw(EX.a.p)); console.log("-- AFTER"); console.log(cw(EX.b.p));
  for(const [n,p] of [["before",EX.a.p],["after",EX.b.p]]){const f=path.join(SCR,"testlen_example_"+n+".txt"); try{fs.unlinkSync(f);}catch(e){} fs.writeFileSync(f,H.weekGrid(p));}
  console.log("  full grids:",path.join(SCR,"testlen_example_{before,after}.txt"));
} else console.log("  NO example with rec 9 / test week 20 found — failed measurement for part 3 example");
console.log("\n=== 4  HALF_MANNY and non-test goals");
const hm=V=>H.progDigest(V.IA.buildProgram(H.fixtures.HALF_MANNY));
const hA=hm(A),hA2=hm(A),hB=hm(B); console.log("  HALF_MANNY base",hA,"self-stable",hA===hA2,"| surgery",hB,"| equal",hA===hB,"| era row 207",(H.MANNY_DIGEST_BY_VERSION||{})[207]);
let nr=0,nc=0,ne=0; const seg={};
for(const g of ["run_5k","run_10k","run_half","run_marathon","run_base"]) for(const exp of ["beginner","intermediate","advanced"]) for(const mile of [null,480]) for(const k of [4,8,12,16,20,26,30]){
  const o={exp,age:"18-35",race:raceFor(k),run:Object.assign({id:g,label:"x",paceUnit:"mi"},mile?{mileBestMins:"8",mileBestSecs:"00"}:{})};
  const a=build(A,o), b=build(B,o); if(a.err||b.err){ne++;continue;} nr++; if(H.progDigest(a.p)!==H.progDigest(b.p)){nc++; seg[g]=(seg[g]||0)+1;} }
console.log("  race + run_base dated builds",nr,"errors",ne,"| digest changed",nc,JSON.stringify(seg));
console.log("DONE");
