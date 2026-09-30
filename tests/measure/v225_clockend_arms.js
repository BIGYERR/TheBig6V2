const path=require("path"), fs=require("fs");
const ROOT="/Users/CanasBangin/Desktop/TheBig6V2"; const ART=path.join(ROOT,"index.html"); const SCR=__dirname; const MODE=process.argv[2];
const R=Date; if(MODE!=="manny"){ const NOW=new R(2026,8,22,21,16,0).getTime(); class F extends R{constructor(...a){if(a.length===0)super(NOW);else super(...a);} static now(){return NOW;}} globalThis.Date=F; }
const H=require(path.join(ROOT,"tests","harness.js"));
const OLD="{beginner:3, intermediate:5, advanced:7}", NEW="{beginner:3, intermediate:3, advanced:2}";
const T1S=[["  const paceImprove = {beginner:3, intermediate:5, advanced:7}[exp] || 4;","|| 4;"],
 ["  const paceImprove = {beginner:3, intermediate:5, advanced:7}[experience] || 4;","|| 4;"],
 ["    const expPaceImprove = {beginner:3, intermediate:5, advanced:7};   // V176 (D9)\n    const maxPaceImprovementPerWeek = buildRunProgressionForLength._paceImprovePerWeek\n      || expPaceImprove[exp] || 5;","|| 5;"],
 ["    const expPaceImprove  = {beginner:3, intermediate:5, advanced:7};",null],
 ["    const baseImprove = expPaceImprove[experience||'intermediate'] || 5;","|| 5;"]];
const RAW="    const rawImprovement = (initialPace - targetPace) / Math.max(buildWeeks, 1);";
const RT ="    const realisticTargetPace = initialPace - (weeklyImprovement * buildWeeks);";
function surg(src,t1,ce){ let s=src; const log=[];
  if(t1) for(const [a,fb] of T1S){ const n=s.split(a).length-1; log.push("T1 anchor n="+n); if(n!==1) throw new Error("anchor "+n); let r=a.split(OLD).join(NEW); if(fb) r=r.split(fb).join("|| 3;"); s=s.replace(a,()=>r); }
  if(ce){ for(const [a,r] of (ce==="b"?[[RAW,RAW.replace("Math.max(buildWeeks, 1)","Math.max(buildWeeks - 1, 1)")],[RT,RT.replace("weeklyImprovement * buildWeeks","weeklyImprovement * Math.max(buildWeeks - 1, 0)")]]:[[RT,RT.replace("weeklyImprovement * buildWeeks","weeklyImprovement * Math.max(buildWeeks - 1, 0)")]])){ const n=s.split(a).length-1; log.push("CE"+ce+" anchor n="+n); if(n!==1) throw new Error("ce anchor "+n); s=s.replace(a,()=>r);} }
  return [s,log]; }
const src=fs.readFileSync(ART,"utf8"); console.log("literal count "+OLD+":",src.split(OLD).length-1,"| ia-version",(src.match(/ia-version" content="(\d+)"/)||[])[1]);
const ARMS={B:[false,null],T1:[true,null],CEa:[false,"a"],CEb:[false,"b"],CET1:[true,"b"]}; const FILES={};
for(const k in ARMS){ const [s,log]=surg(src,...ARMS[k]); const f=path.join(SCR,"arm_"+k+".html"); fs.writeFileSync(f,s); FILES[k]=f; console.log(k,log.join(" ")||"none","bytes",s.length-src.length); }
const fmt=s=>s==null?"-":Math.floor(Math.round(s)/60)+":"+String(Math.round(s)%60).padStart(2,"0");
const strip=h=>String(h||"").replace(/<svg[\s\S]*?<\/svg>/g,"").replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim();
if(MODE==="manny"){ for(const k in FILES){ const IA=H.load(FILES[k]); const a=H.progDigest(IA.buildProgram(H.fixtures.HALF_MANNY)), b=H.progDigest(IA.buildProgram(H.fixtures.HALF_MANNY)); console.log("HALF_MANNY",k,a,b===a?"(self-identical)":"SELF-DIFF "+b); }
  console.log("era row 224 =",H.MANNY_DIGEST_BY_VERSION?H.MANNY_DIGEST_BY_VERSION[224]:"(not exported)"); process.exit(0); }
function mkVM(file){ const IA=H.load(file); const els=new Map(); const mk=IA.window.document.createElement;
  IA.window.document.getElementById=id=>{ if(!els.has(id)){const e=mk("div"); e.id=id; els.set(id,e);} return els.get(id); };
  IA.eval(`var __PPS={}; (function(){var o=buildRunProgressionForLength; buildRunProgressionForLength=function(){var r=o.apply(this,arguments); var p=r&&r.paceProgression; if(p) __PPS[arguments[1]]={arr:Array.from(p),d:p._dampened,g:p._weeklyGain,rt:p._realisticTarget,ot:p._originalTarget,met:p._goalMet}; return r;};})();`);
  return {IA,els}; }
function build(V,o){ const IA=V.IA; IA.window.__O=o;
  IA.eval(`WD={primaryPath:"event",cardioTypes:["run"],experience:__O.exp,ageBracket:__O.age,eventTargeted:__O.ev,raceDate:__O.race,liftingFocus:"support_prevention",equipment:"crossfit",restDays:__O.rest,unit:"lbs",seed:24865,name:"M",cardioGoals:{run:__O.run},startDate:undefined}; __PPS={};`);
  V.els.clear(); IA.localStorage._map.clear(); IA.eval("activeProg=null");
  const rec=IA.eval(`calcProgramLength(["run"],{...WD.cardioGoals,_experience:WD.experience,_ageBracket:WD.ageBracket,_eventTargeted:WD.eventTargeted},LIFTING_FOCUS_TO_GOAL[WD.liftingFocus]||"balanced").weeks`);
  let ceil=null; try{ const c=IA.eval("assessRunPaceCeiling("+rec+")"); ceil=c?c.achievable:null; }catch(e){ ceil="ERR "+e.message; }
  let fb=null; if(o.ev){ try{ IA.eval("updateRaceDateFeedback()"); fb=strip(V.els.get("raceDateFeedback").innerHTML); }catch(e){ fb="ERR "+e.message; } }
  try{IA.eval("doGenerate()");}catch(e){return {err:"threw "+e.message};} IA.flushTimers(Infinity);
  const p=IA.eval("activeProg"); if(!p) return {err:"no program"};
  const L=p.totalWeeks; const pp=IA.eval("__PPS")[L]||null; const notes=[]; const ints=[];
  Object.keys(p.weeks).sort((a,b)=>a-b).forEach(w=>{ const W=p.weeks[w]; Object.keys(W).forEach(d=>{ const c=W[d].cardio; (Array.isArray(c)?c:(c?[c]:[])).forEach(x=>{ if(x&&x.type==="run"&&x.dose&&x.dose.key==="int"){ ints.push("W"+w+" "+(x.detail||"").split(". ").slice(0,2).join(". ")); if(x.note&&!notes.includes(x.note)) notes.push(x.note); } }); }); });
  return {L,rec,pp,ceil,fb,dg:H.progDigest(p),notes,ints,taper:p.taperWeeks}; }
const run=(dist,tm,ts,mm,ms)=>({id:"run_pace_goal",label:"Hit a Pace / Time Goal",targetDist:String(dist),paceUnit:"mi",targetMins:String(tm),targetSecs:String(ts),targetTime:tm+":"+String(ts).padStart(2,"0"),...(mm!=null?{mileBestMins:String(mm),mileBestSecs:String(ms),mileBestSrc:{kind:"entered"}}:{}),baselineDist:"3",baseline:"3mi"});
const CF=[
 ["MARIO V202 dated: int 18-35, mile 8:15, 1.5mi in 10:30, test 2026-10-19",{exp:"intermediate",age:"18-35",ev:true,race:"2026-10-19",run:run(1.5,10,30,8,15)}],
 ["MARIO V202 undated: same goal",{exp:"intermediate",age:"18-35",ev:false,race:"",run:run(1.5,10,30,8,15)}],
 ["UNDAMPENED dated: int 18-35, mile 8:00, 1.5mi in 12:00 (8:00/mi), test +8w 2026-11-16",{exp:"intermediate",age:"18-35",ev:true,race:"2026-11-16",run:run(1.5,12,0,8,0)}],
 ["UNDAMPENED undated: int 18-35, mile 8:00, 1.5mi in 12:00",{exp:"intermediate",age:"18-35",ev:false,race:"",run:run(1.5,12,0,8,0)}],
 ["ADV undated: adv 18-35, mile 8:00, 1.5mi in 11:45 (7:50/mi)",{exp:"advanced",age:"18-35",ev:false,race:"",run:run(1.5,11,45,8,0)}],
 ["BEGINNER undated: beg 36-54, no mile, 1.5mi in 16:00 (10:40/mi)",{exp:"beginner",age:"36-54",ev:false,race:"",run:run(1.5,16,0)}],
 ["ADV 55+ dated: mile 7:00, 3.1mi in 22:00 (7:06/mi), test +12w 2026-12-14",{exp:"advanced",age:"55+",ev:true,race:"2026-12-14",run:run(3.1,22,0,7,0)}],
];
const V={}; for(const k in FILES) V[k]=mkVM(FILES[k]);
for(const [lbl,o0] of CF){ console.log("\n######## "+lbl+" | seed 24865 rest sun/wed | clock pinned 2026-09-22");
  for(const k in V){ const o=Object.assign({rest:["sun","wed"]},o0); V[k].IA.eval("WD=null"); const r=build(V[k],o); if(r.err){console.log(k,"ERR",r.err);continue;}
    const bw=r.pp?r.pp.arr.length-(r.taper||0):null;
    console.log(`-- ${k.padEnd(4)} L${r.L} rec${r.rec} taper${r.taper==null?"?":r.taper} | rt ${fmt(r.pp&&r.pp.rt)} goal ${fmt(r.pp&&r.pp.ot)} gain ${r.pp&&r.pp.g} damp ${r.pp&&r.pp.d} met ${r.pp&&r.pp.met} | ceil ${typeof r.ceil==="number"?fmt(r.ceil):r.ceil} | dg ${r.dg}`);
    console.log("   clock:",r.pp?r.pp.arr.map(fmt).join(" "):"-");
    if(r.fb) console.log("   card:",r.fb.slice(0,220));
    r.notes.filter(n=>/moves|reach|target for this block/i.test(n)).forEach(n=>console.log("   note:",n));
    console.log("   INT W1/last:",r.ints[0],"||",r.ints[r.ints.length-1]); } }
