// MEASURE v212 (provisional number) — Mode A. Mario: "Slow goblet squat 3×25 sec" with an LBS box.
// usage: node tests/measure/v221_slow_goblet_timed.js <html> [--lite]
// Oracle for "dynamic rep movement vs static": a HAND token list below (holds, carries,
// planks, isometrics, stretches, intervals), NOT the engine's isTimeExercise/_auxFamily.
// Every sec-dosed name is printed so the classification is auditable by eye.
const path=require("path");
const {load,fixtures}=require(path.resolve(__dirname,"..","harness.js"));
const FILE=process.argv[2], LITE=process.argv.includes("--lite");
const IA=load(FILE); console.log("artifact",FILE,"ia-version",IA.version);
const parseRx=IA.eval("parseRx");
const STATIC=/hold|wall sit|plank|hang\b|carry|walk\b|walks\b|isometric|stretch|l-sit|hollow|copenhagen|bridge hold|breath|pallof|farmer|suitcase|march|stance|balance|foam|roll|mobility|flow|dead bug|bird dog|jump rope|skip|shuffle|sprint|bike|row erg|ski|rower|burpee|mountain climber|jumping jack|high knees|battle rope|crawl|bear|superman|spanish squat|terminal knee|sled|drag|push\b|airplane/i;
function scan(prog,tag,acc){
  const W=prog.weeks||{};
  Object.keys(W).forEach(w=>Object.keys(W[w]).forEach(d=>{const day=W[w][d]; if(!day||day.rest) return;
    (day.sections||[]).forEach(s=>(s.items||[]).forEach(it=>{acc.items++;
      const nm=String(it.name||"").replace(/<svg[\s\S]*?<\/svg>\s*/g,""), det=String(it.detail||"");
      let rx=null; try{rx=parseRx(det,nm);}catch(e){}
      const sec=(rx&&rx.kind==="sec")||/\bsec\b/.test(det);
      if(/goblet/i.test(nm)){acc.goblet++; if(sec) acc.gobletSec.push(tag+" W"+w+" "+d+" ["+(s.label||"")+"] "+nm+" :: "+det);}
      if(/slow goblet/i.test(nm)) acc.slow.push(tag+" W"+w+" "+d+" ["+(s.label||"")+"] "+nm+" :: "+det);
      if(sec){acc.sec++; const k=nm; acc.secNames[k]=(acc.secNames[k]||0)+1;
        if(!STATIC.test(nm)){acc.dyn++; acc.dynNames[k]=acc.dynNames[k]||{n:0,ex:[]}; acc.dynNames[k].n++;
          if(acc.dynNames[k].ex.length<2) acc.dynNames[k].ex.push(tag+" W"+w+" "+d+" ["+(s.label||"")+"] "+det);}}
    }));}));
}
function newAcc(){return {items:0,sec:0,dyn:0,goblet:0,gobletSec:[],slow:[],secNames:{},dynNames:{},cfgs:0,crash:0};}
const M=newAcc(); const pm=IA.buildProgram(fixtures.HALF_MANNY); scan(pm,"MANNY",M);
console.log("\n== HALF_MANNY: items",M.items,"sec-dosed",M.sec,"goblet items",M.goblet,"goblet sec",M.gobletSec.length,"slow goblet",M.slow.length);
M.slow.forEach(x=>console.log("  ",x)); M.gobletSec.forEach(x=>console.log("  ",x));
const ks={}; Object.keys(pm.weeks).forEach(w=>Object.keys(pm.weeks[w]).forEach(d=>{const day=pm.weeks[w][d]; if(!day||day.rest)return;(day.sections||[]).forEach(s=>(s.items||[]).forEach(it=>{if(/\bsec\b/.test(it.detail||"")){const k=it.name+" | "+s.label+" | "+it.detail; ks[k]=(ks[k]||0)+1;}}));}));
console.log("  HALF_MANNY sec-dosed items:"); Object.entries(ks).forEach(([k,n])=>console.log("    ",n,k));
const TIERS=["commercial","home_full","crossfit","home_basic","bodyweight","minimal"];
const FOCUS=LITE?["support_prevention","hypertrophy"]:["support_prevention","support_strength","hypertrophy","strength"];
const EXPS=["beginner","intermediate","advanced"];
const GOALS=[{k:"liftonly",id:null},{k:"pace",id:"run_pace_goal"},{k:"half",id:"run_half"}];
const INJ=[{k:"healthy",v:null},{k:"knee/protect",v:{region:"knee",tier:"protect"}},{k:"lowback/protect",v:{region:"lowback",tier:"protect"}}];
const RESTS=[["sun","wed"],["sun"]]; const SEEDS=LITE?[76308]:[76308,1013];
const L=newAcc(); const seg={};
for(const t of TIERS)for(const f of FOCUS)for(const x of EXPS)for(const g of GOALS)for(const i of INJ)for(const r of RESTS)for(const sd of SEEDS){
  const isRace=!!g.id&&/half/.test(g.id);
  const cfg={name:"M",primaryPath:g.id?(isRace?"event":"cardio"):"lift",cardioTypes:g.id?["run"]:[],
   cardioGoals:g.id?{run:{id:g.id,label:g.k,mileBestMins:"10",mileBestSecs:"30",baselineDist:"5",baseline:"5mi",targetDist:"1.5",targetMins:"11",targetSecs:"0"}}:{},
   eventTargeted:isRace,raceDate:isRace?"2026-12-06":null,liftingFocus:f,experience:x,ageBracket:"18-35",equipment:t,unit:"lbs",
   restDays:r.slice(),days:["sun","mon","tue","wed","thu","fri","sat"],bench:135,squat:155,deadlift:185,seed:sd,...(i.v?{injury:i.v}:{})};
  const before={dyn:L.dyn,sec:L.sec,items:L.items,slow:L.slow.length};
  try{scan(IA.buildProgram(cfg),[t,f,x,g.k,i.k,r.join("+"),sd].join("|"),L); L.cfgs++;}catch(e){L.crash++; if(L.crash<4) console.log("CRASH",t,f,x,g.k,i.k,e.message);}
  for(const [dim,v] of [["tier",t],["focus",f],["goal",g.k],["inj",i.k]]){const K=dim+"="+v; seg[K]=seg[K]||{items:0,sec:0,dyn:0,slow:0};
    seg[K].items+=L.items-before.items; seg[K].sec+=L.sec-before.sec; seg[K].dyn+=L.dyn-before.dyn; seg[K].slow+=L.slow.length-before.slow;}
}
console.log("\n== LATTICE: configs built",L.cfgs,"crashes",L.crash,"| items",L.items,"| sec-dosed",L.sec,"| sec-dosed NOT matching static oracle",L.dyn,"| goblet items",L.goblet,"| goblet sec-dosed",L.gobletSec.length,"| slow goblet",L.slow.length);
L.slow.slice(0,5).forEach(x=>console.log("  SLOW",x)); L.gobletSec.slice(0,5).forEach(x=>console.log("  GOBSEC",x));
console.log("-- all sec-dosed names (count):"); Object.entries(L.secNames).sort((a,b)=>b[1]-a[1]).forEach(([k,n])=>console.log("   ",n,k,STATIC.test(k)?"":"  <== not in static oracle"));
console.log("-- non-static sec-dosed, examples:"); Object.entries(L.dynNames).forEach(([k,v])=>console.log("   ",v.n,k,"::",v.ex.join(" || ")));
console.log("-- segments:"); Object.entries(seg).forEach(([k,v])=>console.log("   ",k,JSON.stringify(v)));
const E=n=>IA.eval(n);
for(const nm of ["Slow goblet squat","Slow goblet squat (KB)","Squat (slow 3s tempo)","Kettlebell goblet squat"]){
  const r={}; for(const fn of ["exStoreKey","isTimeExercise","isKBExercise","isTrackableWeight","_auxFamily","_pattern"]){try{r[fn]=E(fn)(nm);}catch(e){r[fn]="ERR "+e.message;}}
  try{r.exLoggable=E("exLoggable")(nm,"3×25 sec");}catch(e){r.exLoggable="ERR";}
  try{r.canon=E("EX_CANON_NAME")[E("exStoreKey")(nm)]||null;}catch(e){r.canon="ERR";}
  console.log("PROBE",JSON.stringify(nm),JSON.stringify(r));
}
console.log("PROBE parseRx(3×25 sec)",JSON.stringify(parseRx("3×25 sec","Slow goblet squat")));
console.log("PROBE parseRx(4×15 — 3 sec down)",JSON.stringify(parseRx("4×15 — 3 sec down","Slow goblet squat (KB)")));
try{console.log("PROBE _addRxKind(3×25 sec)",JSON.stringify(E("_addRxKind")("3×25 sec","Slow goblet squat")));}catch(e){console.log("PROBE _addRxKind ERR",e.message);}
console.log("PROBE EXLIB.knee_stability",JSON.stringify(E("EXLIB").knee_stability));
// 4. Freeze-path probe: does a STORED (pre-V113/V122) prescription survive refreshProgram?
try{
  const LS=IA.localStorage, prog=JSON.parse(JSON.stringify(IA.buildProgram(fixtures.HALF_MANNY)));
  prog.id="v212probe"; prog.cfg=JSON.parse(JSON.stringify(fixtures.HALF_MANNY)); prog.seed=prog.cfg.seed;
  const mon=new Date(); mon.setHours(0,0,0,0); mon.setDate(mon.getDate()-((mon.getDay()+6)%7)-14); // Monday two weeks back -> current week 3
  prog.startDate=mon.toISOString().slice(0,10);
  const DAYK=Object.keys(prog.weeks["1"]).filter(d=>!prog.weeks["1"][d].rest).slice(0,2);
  const planted={label:"Chest + knee",superset:true,rounds:3,items:[{name:"Push-up",detail:"3×12"},{name:"Slow goblet squat",detail:"3×25 sec"}]};
  DAYK.forEach(d=>prog.weeks["1"][d].sections=(prog.weeks["1"][d].sections||[]).concat([JSON.parse(JSON.stringify(planted))]));
  LS.setItem("ia_comp_v212probe",JSON.stringify({["w1_"+DAYK[0]]:true}));
  const out=IA.eval("refreshProgram")(prog);
  const has=d=>JSON.stringify(out.weeks["1"][d]).includes("Slow goblet squat");
  console.log("FREEZE probe: touched day w1_"+DAYK[0]+" keeps planted item:",has(DAYK[0]),"| untouched day w1_"+DAYK[1]+" keeps it:",has(DAYK[1]));
}catch(e){console.log("FREEZE probe CRASH",e.message);}
console.log("DONE");
