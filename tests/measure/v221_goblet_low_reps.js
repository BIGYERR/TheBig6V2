// MEASURE v212 (provisional number) — Mode A. Mario: Week 5 Mon "MAIN — GOBLET SQUAT" 4×3 — RPE 7, injury overlay (Easy Run (protected)).
// usage: node tests/measure/v221_goblet_low_reps.js <html> [--lite]
// Oracle: reps are parsed from the printed detail string by a HAND regex (first "S×R" or "N reps"),
// never from scheme()/_repFloor. Slot = section label text. Chest/single-implement names = HAND regex below.
const path=require("path");
const {load,fixtures}=require(path.resolve(__dirname,"..","harness.js"));
const FILE=process.argv[2], LITE=process.argv.includes("--lite");
const IA=load(FILE); console.log("artifact",FILE,"ia-version",IA.version);
const E=n=>{try{return IA.eval(n);}catch(e){return null;}};
const swapCandidates=E("swapCandidates"), _swapDetailFor=E("_swapDetailFor"), addedDetailFor=E("addedDetailFor");
const clean=s=>String(s||"").replace(/<svg[\s\S]*?<\/svg>\s*/g,"").trim();
function lowReps(det){ const d=String(det||"");
  let m=d.match(/^\s*\d+\s*[×x]\s*(\d+)/); if(m) return +m[1];
  m=d.match(/^\s*(\d+)\s*reps?\b/i); if(m) return +m[1];
  m=d.match(/heavy\s*(\d+)RM/i); if(m) return +m[1];
  return null; }
const GOB=/goblet/i;
const CHEST=/goblet|front[- ]?rack|single[- ]?(kb|kettlebell)|landmine|bodyweight|\bband|banded|\(kb\)|kettlebell|dumbbell|\bdb\b|\bkb\b|chair|\bbed\b/i;
const LOWER=/squat|lunge|step-?up|deadlift|rdl|hinge|thrust|bridge|swing|split|pistol|leg/i;
const slotOf=s=>{const L=clean(s.label); if(/^main/i.test(L)) return "Main"; if(/^primer/i.test(L)) return "Primer"; if(s.superset) return "Superset"; return "Other:"+L.split(/[ —-]/)[0];};
function inc(o,k,n){o[k]=(o[k]||0)+(n||1);}
const A={cfgs:0,crash:0,items:0,gob:0,gobLE5:0,gobMainLE5:0,gobBySlotReps:{},gobLE5Ctx:{},gobLE5Ex:[],chestLE5:{},chestLE5Ex:{},parked:0,
  swap:{mainSquat:0,offersGob:0,le5:0,ex:[],gobNames:{},byCtx:{}}, add:{calls:0,le5:0,ex:[]}, sp:{items:0,pairs:0,le5:0,itemsGobSqLE5:0,byName:{}}};
function scan(prog,cfg,tag,ctx){
  const W=prog.weeks||{}; const pc=Object.assign({},prog,{cfg});
  if(JSON.stringify(W).includes("Easy Run (protected)")) A.parked++;
  Object.keys(W).forEach(w=>Object.keys(W[w]).forEach(d=>{const day=W[w][d]; if(!day||day.rest) return;
    const deload=(day.title&&/deload/i.test(day.title))||/deload/i.test(JSON.stringify(day.sections||[]).slice(0,4000))?"deload?":"";
    (day.sections||[]).forEach(s=>(s.items||[]).forEach(it=>{A.items++;
      const nm=clean(it.name), det=String(it.detail||""), lr=lowReps(det), sl=slotOf(s);
      if(GOB.test(nm)){A.gob++; inc(A.gobBySlotReps,sl+"|"+(lr===null?"open":lr));
        if(lr!==null&&lr<=5){A.gobLE5++; if(sl==="Main")A.gobMainLE5++; ctx.forEach(c=>inc(A.gobLE5Ctx,c)); if(A.gobLE5Ex.length<8)A.gobLE5Ex.push(tag+" W"+w+" "+d+" ["+clean(s.label)+"] "+nm+" :: "+det);}}
      if(CHEST.test(nm)&&lr!==null&&lr<=5){const k=nm+" | "+sl+" | "+lr; inc(A.chestLE5,k); if(!A.chestLE5Ex[k])A.chestLE5Ex[k]=tag+" W"+w+" "+d+" :: "+det;}
      // SWAP PATH: every Main squat-pattern item -> what goblet candidates does the sheet offer, what dose lands.
      if(sl==="Main"&&/squat/i.test(nm)&&!GOB.test(nm)&&swapCandidates){A.swap.mainSquat++;
        let c=null; try{c=swapCandidates(nm,day,w,pc);}catch(e){}
        const gs=c?[].concat(c.tier1||[],c.tier2||[]).filter(n=>GOB.test(n)):[];
        if(gs.length){A.swap.offersGob++;
          gs.forEach(g=>{inc(A.swap.gobNames,g); const nd=_swapDetailFor(g,det), r=lowReps(nd);
            if(r!==null&&r<=5){A.swap.le5++; ctx.forEach(x=>inc(A.swap.byCtx,x)); if(A.swap.ex.length<6)A.swap.ex.push(tag+" W"+w+" "+d+" "+nm+" ["+det+"] -> "+g+" ["+nd+"]");}});}}
    }));
    // SPREAD: every Main item (any lift) -> every CHEST/single-implement candidate the sheet offers; landed reps.
    if(swapCandidates)(day.sections||[]).forEach(s=>{if(slotOf(s)!=="Main")return;(s.items||[]).forEach(it=>{const nm=clean(it.name),det=String(it.detail||"");
      let c=null; try{c=swapCandidates(nm,day,w,pc);}catch(e){} if(!c)return; A.sp.items++;
      let gsq=false; [].concat(c.tier1||[],c.tier2||[]).forEach(n=>{if(!CHEST.test(n))return; const nd=_swapDetailFor(n,det), r=lowReps(nd); A.sp.pairs++;
        if(r!==null&&r<=5){A.sp.le5++; inc(A.sp.byName,n+" -> "+r); if(/goblet squat/i.test(n))gsq=true;}});
      if(gsq)A.sp.itemsGobSqLE5++;});});
    // ADD PATH: "+ EXERCISE" goblet onto this day.
    if(addedDetailFor){A.add.calls++; let ad=null; try{ad=addedDetailFor(day,"Dumbbell goblet squat",w,pc);}catch(e){}
      const r=lowReps(ad); if(r!==null&&r<=5){A.add.le5++; if(A.add.ex.length<4)A.add.ex.push(tag+" W"+w+" "+d+" -> "+ad);}}
  }));
}
const TIERS=["commercial","home_full","crossfit","home_basic","bodyweight","minimal"];
const FOCUS=["support_prevention","support_strength","hypertrophy","strength"];
const EXPS=LITE?["intermediate"]:["beginner","intermediate","advanced"];
const GOALS=[{k:"liftonly",id:null},{k:"pace",id:"run_pace_goal"},{k:"half",id:"run_half"}];
const INJ=[{k:"healthy",v:null}]; ["knee","lowback","shoulder","elbow","ankle","hip","other"].forEach(r=>["protect","workaround"].forEach(t=>INJ.push({k:r+"/"+t,v:{region:r,tier:t}})));
const SEEDS=[76308];
function mk(t,f,x,g,i,sd,travel){const isRace=!!g.id&&/half/.test(g.id);
  return {name:"M",primaryPath:g.id?(isRace?"event":"cardio"):"lift",cardioTypes:g.id?["run"]:[],
   cardioGoals:g.id?{run:{id:g.id,label:g.k,mileBestMins:"10",mileBestSecs:"30",baselineDist:"5",baseline:"5mi",targetDist:"1.5",targetMins:"11",targetSecs:"0"}}:{},
   eventTargeted:isRace,raceDate:isRace?"2026-12-06":null,liftingFocus:f,experience:x,ageBracket:"18-35",equipment:t,unit:"lbs",
   restDays:["sun","wed"],days:["sun","mon","tue","wed","thu","fri","sat"],bench:135,squat:155,deadlift:185,seed:sd,...(travel?{_travel:true}:{}),...(i.v?{injury:i.v}:{})};}
function run(cfg,tag,ctx){try{const p=IA.buildProgram(cfg); A.cfgs++; scan(p,cfg,tag,ctx);}catch(e){A.crash++; if(A.crash<4)console.log("CRASH",tag,e.message);}}
// 0. Reporter-shaped repro: HALF_MANNY under every injury, week 5 Monday Main.
console.log("\n== REPRO HALF_MANNY W5 mon, every injury overlay");
for(const i of INJ){const cfg={...JSON.parse(JSON.stringify(fixtures.HALF_MANNY)),...(i.v?{injury:i.v}:{})}; delete cfg.injury; if(i.v)cfg.injury=i.v;
  try{const p=IA.buildProgram(cfg); const day=p.weeks["5"]&&p.weeks["5"].mon; if(!day||day.rest){console.log("  ",i.k,"W5 mon rest/absent");continue;}
    const main=(day.sections||[]).filter(s=>/^main/i.test(clean(s.label))).map(s=>clean(s.label)+": "+(s.items||[]).map(it=>clean(it.name)+" :: "+it.detail).join(" / "));
    const prot=(day.sections||[]).some(s=>/protected/i.test(s.subtype||""));
    let sw=""; (day.sections||[]).forEach(s=>{if(/^main/i.test(clean(s.label)))(s.items||[]).forEach(it=>{const c=swapCandidates(clean(it.name),day,"5",Object.assign({},p,{cfg}));const g=[].concat(c.tier1,c.tier2).filter(n=>GOB.test(n));g.forEach(n=>sw+=" | swap->"+n+" ["+_swapDetailFor(n,it.detail)+"]");});});
    console.log("  ",i.k.padEnd(18),"title="+JSON.stringify(day.title),"protectedRun="+prot,"|",main.join(" || "),sw);
  }catch(e){console.log("  ",i.k,"CRASH",e.message);}}
// 1. Lattice
for(const t of TIERS)for(const f of FOCUS)for(const x of EXPS)for(const g of GOALS)for(const i of INJ)for(const sd of SEEDS)
  run(mk(t,f,x,g,i,sd,false),[t,f,x,g.k,i.k].join("|"),["tier="+t,"focus="+f,"goal="+g.k,"inj="+i.k]);
for(const t of ["home_basic","bodyweight"])for(const f of FOCUS)for(const x of EXPS)for(const g of GOALS)for(const i of INJ)
  run(mk(t,f,x,g,i,76308,true),["travel",t,f,x,g.k,i.k].join("|"),["tier=travel_"+t,"focus="+f,"goal="+g.k,"inj="+i.k]);
console.log("\n== LATTICE builds",A.cfgs,"crashes",A.crash,"| builds with protected easy run",A.parked,"| items",A.items);
console.log("ENGINE goblet items",A.gob,"| goblet <=5 reps",A.gobLE5,"| of which Main",A.gobMainLE5);
console.log("goblet slot|lowReps:"); Object.entries(A.gobBySlotReps).sort().forEach(([k,n])=>console.log("   ",n,k));
A.gobLE5Ex.forEach(x=>console.log("  EX",x)); Object.entries(A.gobLE5Ctx).forEach(([k,n])=>console.log("  CTX",k,n));
console.log("CHEST/single-implement names at <=5 reps (name | slot | reps):"); Object.entries(A.chestLE5).sort((a,b)=>b[1]-a[1]).forEach(([k,n])=>console.log("   ",n,k,LOWER.test(k)?"[lower]":"","::",A.chestLE5Ex[k]));
console.log("\nSWAP Main squat items",A.swap.mainSquat,"| offering a goblet",A.swap.offersGob,"| goblet swap landing <=5 reps",A.swap.le5);
console.log("  goblet names offered:",JSON.stringify(A.swap.gobNames)); A.swap.ex.forEach(x=>console.log("  EX",x));
Object.entries(A.swap.byCtx).forEach(([k,n])=>console.log("  SWCTX",k,n));
console.log("SPREAD Main items swept",A.sp.items,"| Main items where a goblet SQUAT swap lands <=5",A.sp.itemsGobSqLE5,"| (item,chest-candidate) pairs",A.sp.pairs,"| landing <=5",A.sp.le5);
Object.entries(A.sp.byName).sort((a,b)=>b[1]-a[1]).forEach(([k,n])=>console.log("   ",n,k));
console.log("ADD goblet calls (one per trained day)",A.add.calls,"| <=5 reps",A.add.le5); A.add.ex.forEach(x=>console.log("  EX",x));
console.log("DONE");
