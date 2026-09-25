// v220 re-baseline copy of v212_pacerate.js (only: OUT path, clock-end counters, pp.arr kept). Original header:
// v212 measure — P-PACERATE before-picture (coach proposal scratchpad/p_pacemodel_proposal.md §4, M1-M6).
// Read-only over <base.html>. Builds two source-surgery copies:
//   T1 paceImprove {beginner:3, intermediate:3, advanced:2}, T2 {4,3,2}; every `|| 4` / `|| 5`
//   rate fallback set to the intermediate value (3) so the copies test VALUES, not siting.
// Usage: node tests/measure/v212_pacerate.js <base.html> <scratch> <mode> [args]
//   modes: surgery | census | lattice <shard> <nshards> | summarize | confine | manny | mario
// ORACLES: length claims = hand formula transcribed from the proposal §0 text (not calcProgramLength);
//   gap = entered/default mile anchor minus goal pace per mile (date-free arithmetic);
//   confinement = paired builds identical except for the surgery (progDigest, clock pinned);
//   HALF_MANNY = the harness era row MANNY_DIGEST_BY_VERSION[209].
const path=require("path"), fs=require("fs");
const ART=path.resolve(process.argv[2]); const SCR=path.resolve(process.argv[3]||"/tmp"); const MODE=process.argv[4];
const R=Date;
if(MODE!=="manny"){ const NOW=new R(2026,8,22,21,16,0).getTime();
  class F extends R{constructor(...a){if(a.length===0)super(NOW);else super(...a);} static now(){return NOW;}}
  globalThis.Date=F; }
const H=require(path.resolve(__dirname,"..","harness.js"));
const T1F=path.join(SCR,"pacerate_T1.html"), T2F=path.join(SCR,"pacerate_T2.html");
const OLD="{beginner:3, intermediate:5, advanced:7}";
const SITES=[
  ["achievablePacePerMile", "  ageBracket = ageBracket || '18-35';\n  const paceImprove = {beginner:3, intermediate:5, advanced:7}[experience] || 4;", "|| 4;"],
  ["assessRunPaceCeiling",  "  const paceImprove = {beginner:3, intermediate:5, advanced:7}[exp] || 4;", "|| 4;"],
  ["calcProgramLength",     "  // Pace improvement: seconds per mile per week with interval training\n  const paceImprove = {beginner:3, intermediate:5, advanced:7}[experience] || 4;", "|| 4;"],
  ["D101 clock cap fallback","    const expPaceImprove = {beginner:3, intermediate:5, advanced:7};   // V176 (D9)\n    const maxPaceImprovementPerWeek = buildRunProgressionForLength._paceImprovePerWeek\n      || expPaceImprove[exp] || 5;", "|| 5;"],
  ["buildRunSession table", "    const expPaceImprove  = {beginner:3, intermediate:5, advanced:7};", null],
  ["buildRunSession fallback","    const baseImprove = expPaceImprove[experience||'intermediate'] || 5;", "|| 5;"],
];
function surgery(){
  const src=fs.readFileSync(ART,"utf8"); let bad=0;
  console.log("literal "+OLD+" count in base:",src.split(OLD).length-1);
  for(const [tag,tbl] of [["T1","{beginner:3, intermediate:3, advanced:2}"],["T2","{beginner:4, intermediate:3, advanced:2}"]]){
    let s=src;
    for(const [nm,anc,fb] of SITES){ const n=s.split(anc).length-1; console.log(tag,"anchor",nm.padEnd(26),"count",n); if(n!==1){bad++;continue;}
      let rep=anc.split(OLD).join(tbl); if(fb) rep=rep.split(fb).join("|| 3;"); s=s.replace(anc,()=>rep); }
    console.log(tag,"old literal left:",s.split(OLD).length-1,"| new literal count:",s.split(tbl).length-1,"| bytes changed:",s.length-src.length);
    const f=tag==="T1"?T1F:T2F; try{fs.unlinkSync(f);}catch(e){} fs.writeFileSync(f,s);
  }
  if(bad){console.log("NOT-APPLIED",bad);process.exit(2);}
}
function mkVM(file){ const IA=H.load(file); const els=new Map(); const mk=IA.window.document.createElement;
  IA.window.document.getElementById=id=>{ if(!els.has(id)){const e=mk("div"); e.id=id; els.set(id,e);} return els.get(id); };
  IA.eval(`var __PPS={}; (function(){var o=buildRunProgressionForLength; buildRunProgressionForLength=function(){var r=o.apply(this,arguments); var p=r&&r.paceProgression; if(p) __PPS[arguments[1]]={arr:Array.from(p),d:p._dampened,g:p._weeklyGain,rt:p._realisticTarget,ot:p._originalTarget,met:p._goalMet}; return r;};})();`);
  return {IA,els}; }
const fmt=s=>s==null?"-":Math.floor(Math.round(s)/60)+":"+String(Math.round(s)%60).padStart(2,"0");
const strip=h=>String(h||"").replace(/<svg[\s\S]*?<\/svg>/g,"").replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim();
function runItems(p){ const out=[]; Object.keys(p.weeks).sort((a,b)=>a-b).forEach(w=>{ const W=p.weeks[w]; Object.keys(W).forEach(d=>{ const c=W[d].cardio; (Array.isArray(c)?c:(c?[c]:[])).forEach(x=>{ if(x&&x.type==="run") out.push({w:+w,d,x}); }); }); }); return out; }
function build(V,o){ const IA=V.IA; IA.window.__O=o;
  IA.eval(`WD={primaryPath:"event",cardioTypes:["run"],experience:__O.exp,ageBracket:__O.age,eventTargeted:__O.ev,raceDate:__O.race,
    liftingFocus:"support_prevention",equipment:"crossfit",restDays:__O.rest,unit:"lbs",seed:24865,name:"M",cardioGoals:{run:__O.run},startDate:undefined}; __PPS={};`);
  V.els.clear(); IA.localStorage._map.clear(); IA.eval("activeProg=null");
  const rec=IA.eval(`calcProgramLength(["run"],{...WD.cardioGoals,_experience:WD.experience,_ageBracket:WD.ageBracket,_eventTargeted:WD.eventTargeted},LIFTING_FOCUS_TO_GOAL[WD.liftingFocus]||"balanced").weeks`);
  let ceil=null; try{ const c=IA.eval("assessRunPaceCeiling()"); ceil=c?+c.achievable.toFixed(1):null; }catch(e){ ceil="ERR "+e.message; }
  let fb=null; if(o.ev){ try{ IA.eval("updateRaceDateFeedback()"); fb=strip(V.els.get("raceDateFeedback").innerHTML); }catch(e){ fb="ERR "+e.message; } }
  try{IA.eval("doGenerate()");}catch(e){return {err:"threw "+e.message};} IA.flushTimers(Infinity);
  const p=IA.eval("activeProg"); if(!p) return {err:"no program"};
  const L=p.totalWeeks; const PPS=IA.eval("__PPS"); const pp=PPS[L]||null;
  const it=runItems(p); const intW={}, chiW={}, notes=new Set(), chiNotes=new Set(), intLines=[], chiLines=[];
  for(const {w,d,x} of it){ const k=x.dose&&x.dose.key;
    if(k==="int"){ if(intW[w]==null) intW[w]=x.dose.tgt; notes.add(String(x.note||"")); intLines.push("W"+w+" "+d+" "+x.detail+" || NOTE "+(x.note||"")); }
    if(k==="chi"){ if(chiW[w]==null) chiW[w]=x.dose.tgt!=null?x.dose.tgt:(x.detail||"").slice(0,40); chiNotes.add(String(x.note||"")); chiLines.push("W"+w+" "+d+" "+x.detail+" || NOTE "+(x.note||"")); } }
  return {p,L,rec,tw:IA.eval("WD._testWeek"),pp,intW,chiW,notes:[...notes],intLines,chiLines,ceil,fb,dg:H.progDigest(p)}; }
// ---- lattice ----
const DISTS=[1.0,1.5,3.1,6.2], EXPS=["beginner","intermediate","advanced"], AGES=["18-35","36-54","55+"];
const MILES=[null,450,480,570,690], OFFS=[-20,10,15,20,30,45,100], DATED=[0,4,8,12], RESTS=[["sun","wed"],["sat","sun"]];
const DEF={beginner:690,intermediate:570,advanced:450};
const W1MON="2026-09-21"; const U=s=>{const[y,m,d]=s.split("-").map(Number);return R.UTC(y,m-1,d);};
const raceFor=k=>new R(U(W1MON)+((k-1)*7+3)*864e5).toISOString().slice(0,10);
function cells(){ const out=[]; for(const dist of DISTS) for(const exp of EXPS) for(const age of AGES) for(const mile of MILES) for(const off of OFFS) for(const dt of DATED) for(const rest of RESTS) out.push({dist,exp,age,mile,off,dt,rest}); return out; }
function cellCfg(c){ const anchor=(c.exp!=="beginner"&&c.mile)?c.mile:DEF[c.exp]; const gp=anchor-c.off; const tot=Math.round(gp*c.dist);
  const run={id:"run_pace_goal",label:"Hit a Pace / Time Goal",targetDist:String(c.dist),paceUnit:"mi",targetMins:String(Math.floor(tot/60)),targetSecs:String(tot%60),targetTime:fmt(tot)};
  if(c.mile){ run.mileBestMins=String(Math.floor(c.mile/60)); run.mileBestSecs=String(c.mile%60); run.mileBestSrc={kind:"entered"}; }
  return {o:{exp:c.exp,age:c.age,ev:!!c.dt,race:c.dt?raceFor(c.dt):"",rest:c.rest,run},anchor,gap:anchor-tot/c.dist}; }
const slim=r=>r.err?{err:r.err}:{L:r.L,rec:r.rec,tw:r.tw,pp:r.pp?{arr:r.pp.arr.map(Math.round),w1:r.pp.arr[0],pk:Math.min(...r.pp.arr),rt:r.pp.rt,g:r.pp.g,d:r.pp.d,met:r.pp.met,ot:r.pp.ot}:null,intW:r.intW,chiW:r.chiW,notes:r.notes,ceil:r.ceil,fb:r.fb,dg:r.dg};
function lattice(sh,n){ const V=[mkVM(ART),mkVM(T1F),mkVM(T2F)]; console.log("versions",V.map(v=>v.IA.version).join("/"));
  const f=path.join(SCR,`pacerate_lattice_${sh}.jsonl`); try{fs.unlinkSync(f);}catch(e){} const fd=fs.openSync(f,"w"); const t0=R.now(); let k=0;
  cells().forEach((c,i)=>{ if(i%n!==sh) return; const {o,anchor,gap}=cellCfg(c); const rs=V.map(v=>slim(build(v,o)));
    fs.writeSync(fd,JSON.stringify({c,anchor,gap:+gap.toFixed(2),b:rs[0],t1:rs[1],t2:rs[2]})+"\n"); k++; });
  fs.closeSync(fd); console.log("shard",sh,"cells",k,"secs",((R.now()-t0)/1000).toFixed(0)); }
// hand oracle, transcribed from proposal §0 (non-beginner only; beginner adds a base-build term)
const TBL={base:{beginner:3,intermediate:5,advanced:7},t1:{beginner:3,intermediate:3,advanced:2},t2:{beginner:4,intermediate:3,advanced:2}};
const APS={"18-35":1.0,"36-54":0.85,"55+":0.65}, AM={"18-35":1.0,"36-54":1.07,"55+":1.15};
function handLen(arm,exp,age,gap,dist){ const rate=+(TBL[arm][exp]*APS[age]).toFixed(2); let n;
  if(gap<=0) n=4; else { const raw=Math.ceil(gap/rate); n=Math.min(Math.round(raw*1.25)+4, dist<=1?8:dist<=2?10:dist<=5?14:20); }
  n=Math.round(n*AM[age]); const cap=dist<=1?9:dist<=2?11:dist<=5?15:21; return {L:Math.max(6,Math.min(cap,n+1)),cap}; }
function summarize(){ const rows=[]; fs.readdirSync(SCR).filter(f=>/^pacerate_lattice_\d+\.jsonl$/.test(f)).forEach(f=>fs.readFileSync(path.join(SCR,f),"utf8").split("\n").filter(Boolean).forEach(l=>rows.push(JSON.parse(l))));
  const OUT=path.join(__dirname,"v220_rebase_pacerate.out.txt"); try{fs.unlinkSync(OUT);}catch(e){} const lines=[];
  const key=c=>`${c.dist}mi ${c.exp.slice(0,3)} ${c.age} mile ${c.mile?fmt(c.mile):"none"} off ${c.off>=0?"+":""}${c.off} ${c.dt?"dated+"+c.dt+"w":"undated"} ${c.rest.join("/")}`;
  const pr=x=>x.err?"ERR":`L${x.L} rec${x.rec} tw${x.tw==null?"-":x.tw} rt ${x.pp?fmt(x.pp.rt):"-"} g ${x.pp?x.pp.g:"-"}${x.pp&&x.pp.d?"D":""}${x.pp&&x.pp.met?"M":""} ceil ${x.ceil==null?"-":fmt(x.ceil)}`;
  let err=0; rows.forEach(r=>{ if(r.b.err||r.t1.err||r.t2.err) err++; lines.push(`${key(r.c)} gap ${r.gap} || B ${pr(r.b)} || T1 ${pr(r.t1)} || T2 ${pr(r.t2)}`); });
  fs.writeFileSync(OUT,lines.join("\n")+"\n");
  console.log("M2 lattice cells",rows.length,"(x3 builds =",rows.length*3,") errors",err,"| per-cell record:",OUT);
  const ok=rows.filter(r=>!r.b.err&&!r.t1.err&&!r.t2.err);
  // M2 change counts by segment
  const seg={}; const add=(k,arm,r)=>{ seg[k]=seg[k]||{n:0,t1L:0,t2L:0,t1rt:0,t2rt:0,t1dg:0,t2dg:0,t1c:0,t2c:0,bc:0}; const s=seg[k]; if(arm==="n"){s.n++; if(r.b.ceil!=null)s.bc++; if(r.t1.ceil!=null)s.t1c++; if(r.t2.ceil!=null)s.t2c++;
    if(r.t1.L!==r.b.L)s.t1L++; if(r.t2.L!==r.b.L)s.t2L++; if(r.b.pp&&r.t1.pp&&r.t1.pp.rt!==r.b.pp.rt)s.t1rt++; if(r.b.pp&&r.t2.pp&&r.t2.pp.rt!==r.b.pp.rt)s.t2rt++; if(r.t1.dg!==r.b.dg)s.t1dg++; if(r.t2.dg!==r.b.dg)s.t2dg++; } };
  ok.forEach(r=>{ add("ALL","n",r); add("exp "+r.c.exp,"n",r); add("exp/age "+r.c.exp+" "+r.c.age,"n",r); add("dist "+r.c.dist,"n",r); add("dated "+(r.c.dt?"+"+r.c.dt+"w":"none"),"n",r); add("off "+r.c.off,"n",r); });
  console.log("\n== M2 changes vs base (n | length moved T1/T2 | realisticTarget moved T1/T2 | digest moved T1/T2 | ceiling banner fires base/T1/T2)");
  Object.keys(seg).forEach(k=>{const s=seg[k]; console.log("  "+k.padEnd(30),"n",String(s.n).padStart(5),"| L",s.t1L,"/",s.t2L,"| rt",s.t1rt,"/",s.t2rt,"| dg",s.t1dg,"/",s.t2dg,"| ceil",s.bc,"/",s.t1c,"/",s.t2c);});
  // realistic-target shift (positive = the block promises a slower pace), undated, goal not met
  console.log("\n== M2 realistic-target shift vs base, s/mi slower (undated, goal not met in base) mean [min,max] n");
  const sh={}; ok.filter(r=>!r.c.dt&&r.b.pp&&!r.b.pp.met).forEach(r=>{ const k=r.c.exp+" "+r.c.age+" off+"+r.c.off; sh[k]=sh[k]||{a:[],b:[]}; sh[k].a.push(r.t1.pp.rt-r.b.pp.rt); sh[k].b.push(r.t2.pp.rt-r.b.pp.rt); });
  const st=a=>`${(a.reduce((x,y)=>x+y,0)/a.length).toFixed(1)} [${Math.min(...a).toFixed(1)},${Math.max(...a).toFixed(1)}]`;
  Object.keys(sh).forEach(k=>console.log("  "+k.padEnd(34),"T1",st(sh[k].a).padEnd(20),"T2",st(sh[k].b).padEnd(20),"n",sh[k].a.length));
  // dampened note firing
  console.log("\n== M2 dampened INT note (pp._dampened) cells, undated, by exp x off: base/T1/T2 of n");
  const dm={}; ok.filter(r=>!r.c.dt).forEach(r=>{const k=r.c.exp.padEnd(12)+" off "+String(r.c.off).padStart(4); dm[k]=dm[k]||[0,0,0,0]; dm[k][3]++; if(r.b.pp&&r.b.pp.d)dm[k][0]++; if(r.t1.pp&&r.t1.pp.d)dm[k][1]++; if(r.t2.pp&&r.t2.pp.d)dm[k][2]++;});
  Object.keys(dm).forEach(k=>console.log("  "+k,dm[k].slice(0,3).join("/"),"of",dm[k][3]));
  // P-CLOCKEND (a): undated, goal not met: realistic target (rounded s) printed by no week of the clock
  { const u=ok.filter(r=>!r.c.dt&&r.b.pp&&!r.b.pp.met); const miss=u.filter(r=>!r.b.pp.arr.includes(Math.round(r.b.pp.rt))); const gapS=miss.map(r=>Math.min(...r.b.pp.arr)-Math.round(r.b.pp.rt)); console.log("\n== P-CLOCKEND(a) undated not-met cells: rt printed by no week",miss.length,"/",u.length,"| last-week minus rt s/mi max",gapS.length?Math.max(...gapS):0);
    const u1=ok.filter(r=>!r.c.dt&&r.t1.pp&&!r.t1.pp.met); console.log("   T1 arm:",u1.filter(r=>!r.t1.pp.arr.includes(Math.round(r.t1.pp.rt))).length,"/",u1.length);
    const d=ok.filter(r=>r.c.dt&&r.b.tw!=null&&r.b.pp&&r.b.pp.arr.length>=3); const tapFaster=d.filter(r=>{const a=r.b.pp.arr; let k=a.length-1; while(k>0&&a[k-1]===a[k])k--; return k>=1 && k<a.length-1 && (a[k-1]-a[k])>0;}); console.log("   dated pinned cells whose held tail value is first printed one step after a decrease (held tail = a new, faster pace):",tapFaster.length,"/",d.length); }
  // M3
  console.log("\n== M3 cap-bound (undated, rec == distance cap; beginner: rec == 26) base/T1/T2, and hand-oracle agreement (non-beginner)");
  const cb={}; let hAgree={base:[0,0],t1:[0,0],t2:[0,0]}; const hMis=[];
  ok.filter(r=>!r.c.dt).forEach(r=>{ const k=r.c.exp+" "+r.c.age; cb[k]=cb[k]||[0,0,0,0]; cb[k][3]++;
    ["b","t1","t2"].forEach((a,i)=>{ const x=r[a]; const cap=r.c.exp==="beginner"?26:handLen("base",r.c.exp,r.c.age,1,r.c.dist).cap; if(x.rec===cap) cb[k][i]++;
      if(r.c.exp!=="beginner"){ const arm=a==="b"?"base":a; const h=handLen(arm,r.c.exp,r.c.age,r.gap,r.c.dist).L; hAgree[arm][1]++; if(h===x.rec) hAgree[arm][0]++; else if(hMis.length<8) hMis.push(key(r.c)+" "+arm+" hand "+h+" engine "+x.rec); } }); });
  Object.keys(cb).forEach(k=>console.log("  "+k.padEnd(22),cb[k].slice(0,3).join("/"),"of",cb[k][3]));
  console.log("  hand oracle == engine rec:",JSON.stringify(hAgree)); hMis.forEach(m=>console.log("   MIS",m));
  console.log("\n== M3 undated length (rec) by exp/age/dist/gap, base -> T1 -> T2 (distinct values over mile x rest)");
  const lt={}; ok.filter(r=>!r.c.dt).forEach(r=>{ const k=`${r.c.exp.padEnd(12)} ${r.c.age.padEnd(5)} ${String(r.c.dist).padEnd(3)}mi off ${String(r.c.off).padStart(4)}`; lt[k]=lt[k]||new Set(); lt[k].add(r.b.rec+"->"+r.t1.rec+"->"+r.t2.rec); });
  Object.keys(lt).forEach(k=>{ const v=[...lt[k]]; const moved=v.some(s=>{const [a,b,c]=s.split("->");return a!==b||a!==c;}); console.log("  "+k,v.join(" , "),moved?"  <- moves":""); });
  // M4 beginner confinement
  const beg=ok.filter(r=>r.c.exp==="beginner"); console.log("\n== M4 beginner cells: digest diffs T1",beg.filter(r=>r.t1.dg!==r.b.dg).length,"/",beg.length,"| T2",beg.filter(r=>r.t2.dg!==r.b.dg).length,"/",beg.length);
  const bg2=beg.filter(r=>r.b.pp&&r.t2.pp&&r.b.pp.d); console.log("  beginner dampened cells (base) weeklyGain base -> T2:",[...new Set(bg2.map(r=>r.c.age+" "+r.b.pp.g+"->"+r.t2.pp.g))].join(" ; "),"n",bg2.length);
  // dated: pinned cells whose length moved
  const pin=ok.filter(r=>r.c.dt&&r.b.tw!=null); console.log("\n== dated cells pinned to test week (base):",pin.length,"| length moved T1",pin.filter(r=>r.t1.L!==r.b.L).length,"T2",pin.filter(r=>r.t2.L!==r.b.L).length,"| pin state changed T1",ok.filter(r=>r.c.dt&&(r.b.tw==null)!==(r.t1.tw==null)).length,"T2",ok.filter(r=>r.c.dt&&(r.b.tw==null)!==(r.t2.tw==null)).length);
  const fbm=ok.filter(r=>r.c.dt&&r.b.fb!==r.t1.fb).length, fbm2=ok.filter(r=>r.c.dt&&r.b.fb!==r.t2.fb).length; console.log("  dated feedback card text moved T1",fbm,"T2",fbm2,"of",ok.filter(r=>r.c.dt).length);
  // spot: coach's §3 examples
  console.log("\n== §3 spot cells (undated, sun/wed, mile 8:00 for non-beginner)");
  ok.filter(r=>!r.c.dt&&r.c.rest[0]==="sun"&&(r.c.exp==="beginner"?r.c.mile==null:r.c.mile===480)&&r.c.age==="18-35"&&r.c.dist===1.5).forEach(r=>console.log("  "+key(r.c),"gap",r.gap,"| rec",r.b.rec,r.t1.rec,r.t2.rec,"| L",r.b.L,r.t1.L,r.t2.L,"| anchor@dist",r.b.pp?fmt(r.b.pp.w1):"-","| rt",r.b.pp?fmt(r.b.pp.rt):"-",r.t1.pp?fmt(r.t1.pp.rt):"-",r.t2.pp?fmt(r.t2.pp.rt):"-","| goal",r.b.pp?fmt(r.b.pp.ot):"-","| g",r.b.pp&&r.b.pp.g,r.t1.pp&&r.t1.pp.g,r.t2.pp&&r.t2.pp.g,"| ceil",fmt(r.b.ceil),fmt(r.t1.ceil),fmt(r.t2.ceil)));
}
function confine(){ const V=[mkVM(ART),mkVM(T1F),mkVM(T2F)]; const G=[["swim",{id:"swim_100_time"}],["swim",{id:"swim_500_time"}],["swim",{id:"swim_base"}],["swim",{id:"swim_mile"}],["swim",{id:"swim_tri"}],
  ["bike",{id:"bike_50"}],["bike",{id:"bike_base"}],["bike",{id:"bike_ftp"}],["bike",{id:"bike_century"}],["bike",{id:"bike_cals"}],
  ["run",{id:"run_base"}],["run",{id:"run_5k"}],["run",{id:"run_10k"}],["run",{id:"run_half"}],["run",{id:"run_marathon"}]];
  let n=0,d1=0,d2=0,err=0,self=0; const by={};
  for(const [t,g0] of G) for(const exp of EXPS) for(const age of AGES) for(const mile of [null,480]) for(const rest of RESTS) for(const seed of [24865,76308]){
    const g=Object.assign({label:g0.id},g0,{baselineDist:"3",baseline:"3mi"}); if(mile){g.mileBestMins="8";g.mileBestSecs="0";}
    const cfg={name:"C",primaryPath:"event",cardioTypes:[t],cardioGoals:{[t]:g},eventTargeted:/run_(5k|10k|half|marathon)/.test(g.id),raceDate:/run_(5k|10k|half|marathon)/.test(g.id)?"2027-01-17":"",
      liftingFocus:"support_prevention",experience:exp,ageBracket:age,equipment:"crossfit",unit:"lbs",restDays:rest,days:H.DAYS.slice(),bench:135,squat:155,deadlift:185,seed};
    let ds; try{ ds=V.map(v=>H.progDigest(v.IA.buildProgram(JSON.parse(JSON.stringify(cfg))))); if(H.progDigest(V[0].IA.buildProgram(JSON.parse(JSON.stringify(cfg))))===ds[0]) self++; }catch(e){err++;continue;}
    n++; by[g.id]=by[g.id]||[0,0,0]; by[g.id][0]++; if(ds[1]!==ds[0]){d1++;by[g.id][1]++;} if(ds[2]!==ds[0]){d2++;by[g.id][2]++;} }
  console.log("M4 confinement (buildProgram, clock pinned): cells",n,"errors",err,"| base==itself",self+"/"+n,"| T1 diffs",d1,"| T2 diffs",d2);
  Object.keys(by).forEach(k=>console.log("  "+k.padEnd(14),"n",by[k][0],"T1",by[k][1],"T2",by[k][2])); }
function manny(){ const rows={}; for(const [nm,f] of [["base",ART],["T1",T1F],["T2",T2F]]){ const IA=H.load(f); rows[nm]=[H.progDigest(IA.buildProgram(H.fixtures.HALF_MANNY)),H.progDigest(IA.buildProgram(H.fixtures.HALF_MANNY))]; }
  const src=fs.readFileSync(path.resolve(__dirname,"..","harness.js"),"utf8"); console.log("M5 HALF_MANNY digest (real clock). era row for 209 via harness chain; V208 printed row 0ac7da6b1691a8e1");
  Object.keys(rows).forEach(k=>console.log("  ",k.padEnd(5),rows[k][0],"self-stable",rows[k][0]===rows[k][1])); }
function mario(){ const V=[["base",mkVM(ART)],["T1",mkVM(T1F)],["T2",mkVM(T2F)]];
  const run=(tm,ts)=>({id:"run_pace_goal",label:"Hit a Pace / Time Goal",targetDist:"1.5",paceUnit:"mi",targetMins:String(tm),targetSecs:String(ts),targetTime:tm+":"+String(ts).padStart(2,"0"),mileBestMins:"8",mileBestSecs:"15",mileBestSrc:{kind:"entered"},baselineDist:"3",baseline:"3mi"});
  const CF=[["V202 as recorded (goal 1.5mi 10:30, test 2026-10-19)",{ev:true,race:"2026-10-19",run:run(10,30)}],["same, undated",{ev:false,race:"",run:run(10,30)}],
            ["coach's §3 reading (goal 7:44/mi = 1.5mi 11:36), undated",{ev:false,race:"",run:run(11,36)}],["coach's §3 reading, test 2026-10-19",{ev:true,race:"2026-10-19",run:run(11,36)}]];
  for(const [lbl,o0] of CF){ console.log("\n######## M6",lbl,"| seed 24865 intermediate 18-35 rest sun/wed mile 8:15");
    for(const [nm,v] of V){ const IA=v.IA; IA.eval("WD=null"); const o=Object.assign({exp:"intermediate",age:"18-35",rest:["sun","wed"]},o0); const r=build(v,o);
      if(r.err){console.log(nm,"ERR",r.err);continue;}
      console.log(`-- ${nm}: length ${r.L} (rec ${r.rec}, test week ${r.tw}) | clock W1 ${fmt(r.pp&&r.pp.arr[0])} realistic ${fmt(r.pp&&r.pp.rt)} goal ${fmt(r.pp&&r.pp.ot)} gain ${r.pp&&r.pp.g} dampened ${r.pp&&r.pp.d} | ceiling ${fmt(r.ceil)} | digest ${r.dg}`);
      if(r.fb) console.log("   feedback:",r.fb);
      console.log("   clock by week:",r.pp?r.pp.arr.map(fmt).join(" "):"-");
      r.intLines.forEach(l=>console.log("   INT",l)); r.chiLines.forEach(l=>console.log("   CHI",l)); } } }
function census(){ const src=fs.readFileSync(ART,"utf8").split("\n"); const pats=[/paceImprove|expPaceImprove/,/intermediate:\s*5\b/,/advanced:\s*7\b/,/agePaceScale/,/\bageMult\b/,/_paceImprovePerWeek/,/_weeklyGain/];
  console.log("M1 site census on",ART); src.forEach((l,i)=>{ if(pats.some(p=>p.test(l))) console.log("  :"+(i+1),l.trim().slice(0,170)); });
  const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);
  const T=path.resolve(__dirname,".."); const files=["gates","sabotage"].flatMap(s=>walk(path.join(T,s))).concat([path.join(T,"harness.js"),path.join(T,"gate.sh"),path.join(T,"sabotage.py")]).filter(f=>fs.existsSync(f));
  const tp=/intermediate:\s*5\b|advanced:\s*7\b|\b0\.65\b|\b0\.85\b|_paceImprovePerWeek|_weeklyGain|paceImprove|_realisticTarget|_dampened|safe rate|achievablePacePerMile|assessRunPaceCeiling/;
  console.log("M1 test pins (tests/gates, tests/sabotage, harness, gate.sh, sabotage.py):"); let n=0;
  files.forEach(f=>fs.readFileSync(f,"utf8").split("\n").forEach((l,i)=>{ if(tp.test(l)){n++; console.log("  "+path.relative(T,f)+":"+(i+1),l.trim().slice(0,170));} })); console.log("  test-pin lines",n);
  const mf=walk(path.join(T,"measure")).filter(f=>/\.js$/.test(f)&&!/v212_pacerate/.test(f)); let m=0; mf.forEach(f=>{ const s=fs.readFileSync(f,"utf8"); if(tp.test(s)) m++; }); console.log("  tests/measure scripts mentioning any pin token:",m,"of",mf.length); }
({surgery,census,summarize,confine,manny,mario,lattice:()=>lattice(+process.argv[5],+process.argv[6])})[MODE]();
