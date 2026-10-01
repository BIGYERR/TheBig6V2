// V226 measure: full population of D188-driven long-run tier moves (Class A2), V225 vs V226.
// usage: node v226_a2_tierflips.js run <base.html> <cand.html> <mode beg|eq|nonbeg> <shard> <nshards> <out.json>
//        node v226_a2_tierflips.js agg <out1.json> <out2.json> ...
// Oracle: tier thresholds are the doctrine numbers (CLAUDE.md / D18: >=75 A, 45-75 B, <45 C), applied here
// to minutes read off the dose; the artifact's _longRunTier is used only to IDENTIFY long-run cards and is
// cross-checked against the independent threshold (mismatch counted). Banned-content check uses its own regexes.
"use strict";
const R=Date; const NOW=new R(2026,8,30,21,0,0).getTime();
class F extends R{constructor(...a){if(a.length===0)super(NOW);else super(...a);} static now(){return NOW;}} globalThis.Date=F;
const fs=require("fs");
const argv=process.argv.slice(2);
const inc=(o,k,n=1)=>{o[k]=(o[k]||0)+n;};
if(argv[0]==="probe"){
  // probe: segment the non-tier moves and print the mechanism rows. usage: probe <base> <cand>
  const H=require("/Users/CanasBangin/Desktop/TheBig6V2/tests/harness.js");
  const A=H.load(argv[1]), C=H.load(argv[2]); const DAYS=["sun","mon","tue","wed","thu","fri","sat"];
  const strip=(k,v)=>(k==='id'||k==='created'||k==='_swapUniverse'||k==='_swapUniverseByKey')?undefined:v;
  const lr=(IA,day)=>{ if(!day||!day.cardio) return null; for(const x of [].concat(day.cardio)){ if(!x) continue; const t=IA.eval("_longRunTier")(x); if(t){const d=x.dose||{}; return {t,m:+((d.k==='time'?(+d.mins||0):(+d.mi||0)*(+d.tgt||0)/60).toFixed(1)),mi:d.mi,tgt:d.tgt,key:d.key,sub:x.subtype};} } return null; };
  const G={pace12:{id:"run_pace_goal",targetDist:"1.5",targetMins:"12",targetSecs:"0",paceUnit:"mi"},pace1330:{id:"run_pace_goal",targetDist:"1.5",targetMins:"13",targetSecs:"30",paceUnit:"mi"},"5k":{id:"run_5k"},"10k":{id:"run_10k"},half:{id:"run_half"},mara:{id:"run_marathon"},base:{id:"run_base"},base3mi:{id:"run_base",baselineDist:"3",baseline:"3mi"}};
  const MI={none:0,"9:00":540,"10:00":600,"11:30":690,"13:00":780,"14:00":840};
  const mk=(gk,ms,foc,path,rs,seed,eq)=>{const run=JSON.parse(JSON.stringify(G[gk])); if(ms){run.mileBestMins=String(Math.floor(ms/60));run.mileBestSecs=String(ms%60);run.mileBestSrc={kind:"entered"};} const race=["run_5k","run_10k","run_half","run_marathon"].includes(run.id);
    return {name:"M",primaryPath:path,eventTargeted:race,raceDate:race?"2026-12-20":"",liftingFocus:foc,experience:"beginner",ageBracket:"18-35",equipment:eq||"commercial",unit:"lbs",restDays:rs,days:DAYS.slice(),bench:185,squat:255,deadlift:315,seed,startDate:"2026-10-05",cardioTypes:["run"],cardioGoals:{run}};};
  // 1. gatekeeper example
  const gc=mk("base3mi",780,"support_prevention","event",["mon","thu","sun"],1000);
  const ga=A.buildProgram(JSON.parse(JSON.stringify(gc))), gcc=C.buildProgram(JSON.parse(JSON.stringify(gc)));
  console.log("GK example W3 sat V225",JSON.stringify(lr(A,ga.weeks[3].sat)),"V226",JSON.stringify(lr(C,gcc.weeks[3].sat)));
  console.log("   V225 detail:",String(ga.weeks[3].sat.cardio.detail||[].concat(ga.weeks[3].sat.cardio)[0].detail).slice(0,70));
  console.log("   V226 detail:",String([].concat(gcc.weeks[3].sat.cardio)[0].detail).slice(0,70));
  // 2. per goal x mile x focus (seed 1000, sun/wed): totalWeeks, LR minutes list, non-LR sec changes
  for(const gk of Object.keys(G)) for(const m of Object.keys(MI)) for(const [foc,path] of [["support_prevention","event"],["balanced","hybrid"]]){
    const cfg=mk(gk,MI[m],foc,path,["sun","wed"],1000);
    const pa=A.buildProgram(JSON.parse(JSON.stringify(cfg))), pc=C.buildProgram(JSON.parse(JSON.stringify(cfg)));
    let nonLR=0, lrA=[], lrC=[], weeksSecMoved=new Set();
    Object.keys(pa.weeks).sort((a,b)=>a-b).forEach(w=>DAYS.forEach(d=>{const da=pa.weeks[w][d], dc=pc.weeks[w]&&pc.weeks[w][d]; const a=lr(A,da), c=lr(C,dc);
      if(a) lrA.push("W"+w+":"+a.t+a.m); if(c) lrC.push("W"+w+":"+c.t+c.m);
      if(!a&&!c&&JSON.stringify((da&&da.sections)||[],strip)!==JSON.stringify((dc&&dc.sections)||[],strip)){nonLR++; weeksSecMoved.add(w);} }));
    console.log(["ROW",gk,m,foc,"wks",pa.totalWeeks+">"+pc.totalWeeks,"titlesW",JSON.stringify(Object.keys(pa.weeks).map(w=>(pa.weeks[w].mon||{}).title||'').slice(0,0)),"nonLRsec",nonLR,"wks:"+[...weeksSecMoved].join(",")].join(" "));
    console.log("    A "+lrA.join(" ")); console.log("    C "+lrC.join(" "));
  }
  // 3. what does run_base produce as long-run days on the hybrid path vs event path at 13:00, seed 1000
  process.exit(0);
}
if(argv[0]==="agg"){
  const T={}; const ex=[]; const all=[];
  for(const f of argv.slice(1)){ const t=JSON.parse(fs.readFileSync(f,"utf8")); all.push(t); }
  const modes=[...new Set(all.map(t=>t.mode))];
  for(const m of modes){ const ts=all.filter(t=>t.mode===m); const S={};
    for(const t of ts) for(const k of Object.keys(t.c)){ if(typeof t.c[k]==="number") inc(S,k,t.c[k]); else { S[k]=S[k]||{}; for(const kk of Object.keys(t.c[k])) inc(S[k],kk,t.c[k][kk]); } }
    const progs=new Set(), days=new Set(); ts.forEach(t=>t.moves.forEach(mv=>{progs.add(mv.cell); days.add(mv.cell+"|"+mv.w+"|"+mv.d);}));
    console.log("==== MODE "+m+" shards "+ts.length);
    for(const k of Object.keys(S).sort()){ if(typeof S[k]==="number") console.log("  "+k+": "+S[k]); else { console.log("  "+k+":"); Object.keys(S[k]).sort().forEach(kk=>console.log("      "+kk+": "+S[k][kk])); } }
    console.log("  unique moved programs: "+progs.size+"   unique moved days: "+days.size);
    const mv=ts.flatMap(t=>t.moves); mv.slice(0,4).forEach(x=>console.log("  EX "+JSON.stringify(x)));
    const odd=ts.flatMap(t=>t.odd); console.log("  odd n="+odd.length); odd.slice(0,8).forEach(x=>console.log("  ODD "+x));
  }
  process.exit(0);
}
const [ ,BF,CF,MODE,SH,NS,OUT]=argv; const sh=+SH, ns=+NS;
const H=require("/Users/CanasBangin/Desktop/TheBig6V2/tests/harness.js");
const A=H.load(BF), A2=H.load(BF), C=H.load(CF), C2=H.load(CF);
const clone=v=>JSON.parse(JSON.stringify(v));
const strip=(k,v)=>(k==='id'||k==='created'||k==='_swapUniverse'||k==='_swapUniverseByKey')?undefined:v;
const J=p=>JSON.stringify(p,strip);
const DAYS=["sun","mon","tue","wed","thu","fri","sat"];
const GOALS=[["pace12",{id:"run_pace_goal",targetDist:"1.5",targetMins:"12",targetSecs:"0",paceUnit:"mi"}],["pace1330",{id:"run_pace_goal",targetDist:"1.5",targetMins:"13",targetSecs:"30",paceUnit:"mi"}],
 ["5k",{id:"run_5k"}],["10k",{id:"run_10k"}],["half",{id:"run_half"}],["half5mi",{id:"run_half",baselineDist:"5",baseline:"5mi"}],
 ["mara",{id:"run_marathon"}],["mara8mi",{id:"run_marathon",baselineDist:"8",baseline:"8mi"}],["base",{id:"run_base"}],["base3mi",{id:"run_base",baselineDist:"3",baseline:"3mi"}]];
const MILES={none:null,"9:00":540,"10:00":600,"11:00":660,"11:30":690,"12:00":720,"12:30":750,"13:00":780,"14:00":840};
const FOCI=[["support_strength","event"],["support_athletic","event"],["support_prevention","event"],["strength","hybrid"],["hypertrophy","hybrid"],["fatloss","hybrid"],["balanced","hybrid"]];
const AGES=["18-35","36-54","55+"]; const RESTS=[["sun","wed"],["sat","sun"],["mon","thu","sun"]];
let SEEDS=[1000,1001,1002,1003,76308], EQ=["commercial"], EXPS=["beginner"];
if(MODE==="eq"){ SEEDS=[1000,76308]; EQ=["commercial","home_full","bodyweight"]; }
if(MODE==="nonbeg"){ SEEDS=[1000,76308]; EXPS=["intermediate","advanced"]; }
const cells=[];
for(const [gk,g] of GOALS) for(const mk of Object.keys(MILES)) for(const [foc,path] of FOCI) for(const age of AGES) for(const rs of RESTS) for(const seed of SEEDS) for(const eq of EQ) for(const e of EXPS){
  const run=clone(g); const ms=MILES[mk]; if(ms){run.mileBestMins=String(Math.floor(ms/60)); run.mileBestSecs=String(ms%60); run.mileBestSrc={kind:"entered"};}
  const race=["run_5k","run_10k","run_half","run_marathon"].includes(g.id);
  cells.push({key:[gk,mk,foc,age,rs.join("/"),seed,eq,e].join(" "),gk,mk,foc,age,rs:rs.join("/"),seed,eq,e,
    cfg:{name:"M",primaryPath:path,eventTargeted:race,raceDate:race?"2026-12-20":"",liftingFocus:foc,experience:e,ageBracket:age,equipment:eq,unit:"lbs",restDays:rs,days:DAYS.slice(),bench:185,squat:255,deadlift:315,seed,startDate:"2026-10-05",cardioTypes:["run"],cardioGoals:{run}}});
}
const T={mode:MODE,c:{cells:0,builds:0,crash:0,selfChecked:0,selfDiffBase:0,selfDiffCand:0,progIdentical:0,lrDaysBase:0,lrDaysCand:0,tierOracleMismatch:0,
  moves:0,dir:{},byGoal:{},byMile:{},byFocus:{},byWeek:{},byAge:{},byRest:{},byEq:{},byDirGoalMile:{},byDirFocus:{},signAgainst:0,signRule:{},
  secChangedSameTier:0,secChangedNonLR:0,lrDaysSecChangedTotal:0,ban_carry:0,ban_hingeB:0,ban_powerB:0,ban_liftA:0,lrDaysCandChecked:0,setsOverB:0,
  tierLRPresence:{}},moves:[],odd:[]};
const c=T.c;
function lrCard(IA,day){ if(!day||!day.cardio) return null; for(const x of [].concat(day.cardio)){ if(!x) continue; const t=IA.eval("_longRunTier")(x); if(t){ const d=x.dose||{}; const m=d.k==='time'?(+d.mins||0):(+d.mi||0)*(+d.tgt||0)/60; return {t,m,x}; } } return null; }
const ownTier=(x)=>/rehearsal/i.test(x.x.detail||'')?'A':(x.m>=75?'A':x.m>=45?'B':'C');
const secSig=day=>JSON.stringify((day&&day.sections)||[],strip);
const HINGE=/deadlift|romanian|\brdl\b|good morning|hip thrust|kettlebell swing|\bswing\b|clean|snatch/i;
const POWER=/power|explosive|plyo/i;
const liftSecs=day=>((day&&day.sections)||[]).filter(s=>!/mobility|taper/i.test(s.label||''));
const setsOf=day=>liftSecs(day).reduce((a,s)=>a+(s.items||[]).reduce((b,it)=>{const m=String(it.detail||'').match(/^(\d+)\s*×/); return b+(m?+m[1]:0);},0),0);
cells.forEach((cl,i)=>{ if(i%ns!==sh) return; c.cells++;
  let pa,pc; try{ pa=A.buildProgram(clone(cl.cfg)); pc=C.buildProgram(clone(cl.cfg)); c.builds+=2;
    if(i%7===0){ c.selfChecked++; if(J(pa)!==J(A2.buildProgram(clone(cl.cfg)))) c.selfDiffBase++; if(J(pc)!==J(C2.buildProgram(clone(cl.cfg)))) c.selfDiffCand++; }
  }catch(e){ c.crash++; if(T.odd.length<30) T.odd.push("CRASH "+cl.key+" "+e.message); return; }
  if(J(pa)===J(pc)) c.progIdentical++;
  const W=new Set([...Object.keys(pa.weeks||{}),...Object.keys(pc.weeks||{})]);
  for(const w of W) for(const d of DAYS){
    const da=pa.weeks[w]&&pa.weeks[w][d], dc=pc.weeks[w]&&pc.weeks[w][d];
    const la=lrCard(A,da), lc=lrCard(C,dc);
    if(la) c.lrDaysBase++; if(lc) c.lrDaysCand++;
    if(la&&ownTier(la)!==la.t) c.tierOracleMismatch++; if(lc&&ownTier(lc)!==lc.t) c.tierOracleMismatch++;
    if(lc){ c.lrDaysCandChecked++;
      if(liftSecs(dc).some(s=>(s.items||[]).some(it=>/carry/i.test(it.name||''))||/carry/i.test((s.label||'')+(s.coreHeader||'')))) c.ban_carry++;
      if(lc.t==='A'&&liftSecs(dc).length) c.ban_liftA++;
      if(lc.t==='B'){ if(liftSecs(dc).some(s=>(s.items||[]).some(it=>HINGE.test(it.name||'')))) c.ban_hingeB++; if(liftSecs(dc).some(s=>POWER.test((s.label||'')+' '+(s.coreHeader||'')))) c.ban_powerB++; if(setsOf(dc)>8) c.setsOverB++; }
    }
    const sch=secSig(da)!==secSig(dc);
    const ta=la?la.t:'-', tc=lc?lc.t:'-';
    if(la||lc) inc(c.tierLRPresence,ta+">"+tc+(sch?" sec-changed":" sec-same"));
    if(ta===tc){ if(sch){ if(la) c.secChangedSameTier++; else c.secChangedNonLR++; if(T.odd.length<30) T.odd.push("SECMOVE tier "+ta+" "+cl.key+" W"+w+" "+d); } continue; }
    c.moves++; if(sch) c.lrDaysSecChangedTotal++;
    const dir=ta+">"+tc; inc(c.dir,dir); inc(c.byGoal,cl.gk+" "+dir); inc(c.byMile,cl.mk+" "+dir); inc(c.byFocus,cl.foc+" "+dir); inc(c.byWeek,"W"+w+" "+dir);
    inc(c.byAge,cl.age+" "+dir); inc(c.byRest,cl.rs+" "+dir); inc(c.byEq,cl.eq+" "+dir); inc(c.byDirGoalMile,dir+" "+cl.gk+" "+cl.mk); inc(c.byDirFocus,dir+" "+cl.foc+" "+cl.gk);
    const ms=MILES[cl.mk]; const sgn=ms==null?"none":ms<690?"faster":ms>690?"slower":"equal";
    const order={A:3,B:2,C:1,'-':0}; const shorter=order[tc]<order[ta];
    const expect = sgn==="faster"?true: sgn==="slower"?false:null;
    if(expect===null || (tc==='-'||ta==='-') || expect!==shorter) c.signAgainst++;
    inc(c.signRule,sgn+" "+(shorter?"shorter-tier":"longer-tier"));
    T.moves.push({cell:cl.key,w,d,dir,mA:la?+la.m.toFixed(2):null,mC:lc?+lc.m.toFixed(2):null,detA:la&&la.x.detail,detC:lc&&lc.x.detail,doseA:la&&la.x.dose,doseC:lc&&lc.x.dose,sec:sch,
      gridA:sch?H.weekGrid({weeks:{[w]:{[d]:da}}}).slice(0,260):"",gridC:sch?H.weekGrid({weeks:{[w]:{[d]:dc}}}).slice(0,260):""});
  }
});
fs.writeFileSync(OUT,JSON.stringify(T));
console.log("shard",MODE,sh,"cells",c.cells,"crash",c.crash,"moves",c.moves);
