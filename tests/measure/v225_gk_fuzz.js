// gatekeeper V225 identity + differential fuzz. usage: node v225_gk_fuzz.js <base> <cand> <shard> <nshards> <outjson>
"use strict";
const R=Date; const NOW=new R(2026,8,22,21,16,0).getTime();
class F extends R{constructor(...a){if(a.length===0)super(NOW);else super(...a);} static now(){return NOW;}} globalThis.Date=F;
const H=require("/Users/CanasBangin/Desktop/TheBig6V2/tests/harness.js");
const fs=require("fs");
const [BF,CF,SH,NS,OUT]=process.argv.slice(2); const sh=+SH, ns=+NS;
const A=H.load(BF), A2=H.load(BF), C=H.load(CF);
const clone=v=>JSON.parse(JSON.stringify(v));
const strip=(k,v)=>(k==='id'||k==='created'||k==='_swapUniverse'||k==='_swapUniverseByKey')?undefined:v;
const J=p=>JSON.stringify(p,strip);
const DAYS=["sun","mon","tue","wed","thu","fri","sat"];
const SAFE="That is the safe rate for your experience and age. ";
// flatten program into keyed map: (week, day, label, movement#occ) -> json
function flat(p){ const m=new Map(); const W=p.weeks||{};
  for(const k of Object.keys(p)) if(k!=="weeks") m.set("TOP|"+k, JSON.stringify(p[k],strip));
  for(const w of Object.keys(W)) for(const d of Object.keys(W[w])){ const day=W[w][d]; if(!day){m.set(`${w}|${d}|DAY`,"null");continue;}
    for(const k of Object.keys(day)) if(k!=="sections"&&k!=="cardio") m.set(`${w}|${d}|DAYF|${k}`,JSON.stringify(day[k],strip));
    const occ={};
    (day.sections||[]).forEach(s=>{ const lab=String(s.label||s.coreHeader||"");
      for(const k of Object.keys(s)) if(k!=="items") m.set(`${w}|${d}|SEC|${lab}|${k}`,JSON.stringify(s[k],strip));
      (s.items||[]).forEach(it=>{ const kk=`${w}|${d}|ITEM|${lab}|${it.name}`; occ[kk]=(occ[kk]||0)+1; m.set(kk+"#"+occ[kk],JSON.stringify(it,strip)); }); });
    const c=day.cardio; (Array.isArray(c)?c:(c?[c]:[])).forEach((x,i)=>m.set(`${w}|${d}|CARDIO|${x&&x.type}|${i}`,JSON.stringify(x,strip)));
  }
  return m; }
const cells=[];
const mb={mileBestMins:"8",mileBestSecs:"15",mileBestSrc:{kind:"entered"}};
const G1=[["run_pace_goal",{run:{id:"run_pace_goal",...mb,targetDist:"1.5",targetMins:"11",targetSecs:"0",paceUnit:"mi"}},["run"]],
 ["run_mile_time",{run:{id:"run_mile_time",...mb,targetDist:"1",targetMins:"7",targetSecs:"0",paceUnit:"mi"}},["run"]],
 ["run_15_under10",{run:{id:"run_15_under10",...mb,targetDist:"1.5",targetMins:"9",targetSecs:"59",paceUnit:"mi"}},["run"]],
 ["run_base",{run:{id:"run_base",...mb,baselineDist:"3",baseline:"3mi"}},["run"]],
 ["run_5k",{run:{id:"run_5k",...mb}},["run"]],["run_10k",{run:{id:"run_10k",...mb}},["run"]],
 ["run_half",{run:{id:"run_half",...mb,baselineDist:"5",baseline:"5mi"}},["run"]],["run_marathon",{run:{id:"run_marathon",...mb,baselineDist:"8",baseline:"8mi"}},["run"]],
 ["swim_base",{swim:{id:"swim_base"}},["swim"]],["swim_mile",{swim:{id:"swim_mile"}},["swim"]],["swim_tri",{swim:{id:"swim_tri"}},["swim"]],
 ["swim_100_time",{swim:{id:"swim_100_time",swimUnit:"yd",baseMins:"1",baseSecs:"40",base500Mins:"9",base500Secs:"0",targetMins:"1",targetSecs:"20"}},["swim"]],
 ["swim_500_time",{swim:{id:"swim_500_time",swimUnit:"yd",baseMins:"9",baseSecs:"0",targetMins:"7",targetSecs:"0"}},["swim"]],
 ["bike_base",{bike:{id:"bike_base"}},["bike"]],["bike_ftp",{bike:{id:"bike_ftp"}},["bike"]],["bike_50",{bike:{id:"bike_50"}},["bike"]],
 ["bike_century",{bike:{id:"bike_century"}},["bike"]],["bike_cals",{bike:{id:"bike_cals"}},["bike"]],["lift_only",{},[]]];
const RACE=new Set(["run_5k","run_10k","run_half","run_marathon"]);
for(const [gid,goals,types] of G1) for(const f of ["balanced","strength","support_prevention","hypertrophy"]) for(const e of ["beginner","intermediate","advanced"])
 for(const q of ["commercial","home_full","bodyweight"]) for(const rs of [["sun","wed"],["sat","sun"],["mon","thu","sun"]]) for(const dated of [false,true]) for(const seed of [24865,76308]){
  const ev=dated&&gid!=="lift_only";
  cells.push({L:"L1",gid,cfg:{name:"M",primaryPath:gid==="lift_only"?"body":"event",eventTargeted:ev,raceDate:ev?"2026-12-06":"",cardioTypes:types.slice(),cardioGoals:clone(goals),liftingFocus:f,experience:e,ageBracket:"18-35",equipment:q,unit:"lbs",restDays:rs,days:DAYS.slice(),bench:185,squat:255,deadlift:315,seed,startDate:"2026-09-21"}}); }
// L2: pace-goal lattice (exp x age x mile x dist x offset x dated)
const DEF={beginner:690,intermediate:570,advanced:450}; const fmt=s=>Math.floor(s/60)+":"+String(Math.round(s%60)).padStart(2,"0");
for(const e of ["beginner","intermediate","advanced"]) for(const age of ["18-35","36-54","55+"]) for(const mile of [null,450,480,570,690]) for(const dist of [1,1.5,3.1,6.2]) for(const off of [-20,10,20,45]) for(const dt of [0,4,8,12]){
  const anchor=(e!=="beginner"&&mile)?mile:DEF[e]; const tot=Math.round((anchor-off)*dist);
  const run={id:"run_pace_goal",targetDist:String(dist),paceUnit:"mi",targetMins:String(Math.floor(tot/60)),targetSecs:String(tot%60)};
  if(mile){run.mileBestMins=String(Math.floor(mile/60)); run.mileBestSecs=String(mile%60); run.mileBestSrc={kind:"entered"};}
  const race=dt?new R(R.UTC(2026,8,21)+((dt-1)*7+3)*864e5).toISOString().slice(0,10):"";
  cells.push({L:"L2",gid:"run_pace_goal",cfg:{name:"M",primaryPath:"event",eventTargeted:!!dt,raceDate:race,cardioTypes:["run"],cardioGoals:{run},liftingFocus:"support_prevention",experience:e,ageBracket:age,equipment:"crossfit",unit:"lbs",restDays:["sun","wed"],days:DAYS.slice(),bench:135,squat:155,deadlift:185,seed:24865,startDate:"2026-09-21"}}); }
// L3: swim time goals, aggressive + moderate, exp x age x dated
for(const id of ["swim_100_time","swim_500_time"]) for(const e of ["beginner","intermediate","advanced"]) for(const age of ["18-35","36-54","55+"]) for(const tg of ["hard","mod","easy"]) for(const dt of [0,8]){
  const g= id==="swim_100_time" ? {id,swimUnit:"yd",baseMins:"1",baseSecs:"50",base500Mins:"10",base500Secs:"0",targetMins:"1",targetSecs:{hard:"15",mod:"40",easy:"48"}[tg]}
                               : {id,swimUnit:"yd",baseMins:"10",baseSecs:"0",targetMins:{hard:"7",mod:"9",easy:"9"}[tg],targetSecs:{hard:"0",mod:"0",easy:"45"}[tg]};
  const race=dt?"2026-11-18":"";
  cells.push({L:"L3",gid:id,cfg:{name:"M",primaryPath:"event",eventTargeted:!!dt,raceDate:race,cardioTypes:["swim"],cardioGoals:{swim:g},liftingFocus:"balanced",experience:e,ageBracket:age,equipment:"commercial",unit:"lbs",restDays:["sun","wed"],days:DAYS.slice(),bench:135,squat:155,deadlift:185,seed:24865,startDate:"2026-09-21"}}); }
const PACE=new Set(["run_pace_goal","run_mile_time","run_15_under10"]);
const T={cells:0,sessions:0,crash:0,crashEx:[],selfDiff:0,selfEx:[],equal:0,byClass:{},unclassified:0,uEx:[],perGoalDiff:{},lenMoved:0,r5notes:0,siNoteBaseHasSafe:0,shortForm:0,safeInCand:0,tierFlips:{},tierDays:0,tEx:[]};
const inc=(o,k,n=1)=>{o[k]=(o[k]||0)+n;};
cells.forEach((c,i)=>{ if(i%ns!==sh) return; T.cells++;
  let pa,pa2,pc; try{pa=A.buildProgram(clone(c.cfg)); pa2=C&&A2.buildProgram(clone(c.cfg)); pc=C.buildProgram(clone(c.cfg));}catch(e){T.crash++; if(T.crashEx.length<5)T.crashEx.push(c.L+" "+c.gid+" "+e.message); return;}
  const ja=J(pa); if(ja!==J(pa2)){T.selfDiff++; if(T.selfEx.length<3)T.selfEx.push(c.L+" "+c.gid);}
  const ma=flat(pa), mc=flat(pc); T.sessions+=[...ma.keys()].filter(k=>/\|CARDIO\||\|ITEM\|/.test(k)).length;
  for(const v of mc.values()) if(v.includes("That is the safe rate")) T.safeInCand++;
  for(const v of mc.values()) if(/"note":"SI: Pace moves [^"]*each week\. The target for this block/.test(v)) T.shortForm++;
  if(ja===J(pc)){T.equal++; return;}
  inc(T.perGoalDiff,c.L+":"+c.gid);
  const keys=new Set([...ma.keys(),...mc.keys()]); const diffs=[...keys].filter(k=>ma.get(k)!==mc.get(k));
  const uncl=(why)=>{T.unclassified++; if(T.uEx.length<8)T.uEx.push(c.L+" "+c.gid+" "+JSON.stringify(c.cfg.experience)+" "+why);};
  if(PACE.has(c.gid)){
    if(pa.totalWeeks!==pc.totalWeeks){T.lenMoved++; inc(T.byClass,`D187 undated sizer length move (${c.gid}, ${c.cfg.eventTargeted?"dated":"undated"})`); 
      if(c.cfg.eventTargeted) uncl("DATED length move "+pa.totalWeeks+"->"+pc.totalWeeks); return;}
    const bad=diffs.filter(k=>!/\|CARDIO\|run\|/.test(k));
    const tierOf=(p,w,d)=>{const day=p.weeks[w]&&p.weeks[w][d]; if(!day||!day.cardio) return null; const cs=Array.isArray(day.cardio)?day.cardio:[day.cardio]; for(const x of cs){const t=A.eval("_longRunTier")(x); if(t) return t;} return null;};
    const tierBad=bad.filter(k=>{const [w,d]=k.split("|"); return tierOf(pa,w,d)!==tierOf(pc,w,d);});
    if(bad.length&&tierBad.length===bad.length){ const flips={}; for(const k of tierBad){const [w,d]=k.split("|"); flips[w+"|"+d]=tierOf(pa,w,d)+">"+tierOf(pc,w,d);} for(const v of Object.values(flips)) inc(T.tierFlips,v); T.tierDays+=Object.keys(flips).length;
      inc(T.byClass,`UNRULED D18 long-run tier flip moves lift day (${c.gid})`); if(T.tEx.length<4)T.tEx.push(c.L+" "+c.gid+" "+c.cfg.experience+" "+c.cfg.ageBracket+" "+JSON.stringify(flips)); return; }
    if(bad.length){ uncl("non-run-cardio key differs: "+bad.slice(0,3).join(" ; ")+" "+(ma.get(bad[0])||"").slice(0,160)+" => "+(mc.get(bad[0])||"").slice(0,160)); return; }
    inc(T.byClass,`D186/D187 run cardio clock/note (${c.gid})`, 1); return; }
  if(c.gid==="swim_100_time"||c.gid==="swim_500_time"){
    for(const k of diffs){ const a=ma.get(k), b=mc.get(k); if(!a||!b||!/\|CARDIO\|swim\|/.test(k)||a.split(SAFE).join("")!==b){ uncl("swim key "+k+" "+String(a).slice(0,120)+" => "+String(b).slice(0,120)); return; } T.r5notes++; }
    inc(T.byClass,"D187 R5 swim safe-rate sentence deleted"); return; }
  uncl("confinement: non-pace goal differs: "+diffs.slice(0,3).join(" ; "));
});
fs.writeFileSync(OUT,JSON.stringify(T));
console.log("shard",sh,"done",JSON.stringify({cells:T.cells,crash:T.crash,self:T.selfDiff,uncl:T.unclassified}));
