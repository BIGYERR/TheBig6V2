// v225 measure — D186 P-CLOCKEND lattice widening of v225_clockend_arms.js (coach's 7-cell spot check).
// Lattice = v212_pacerate.js cells(): run_pace_goal x dist{1,1.5,3.1,6.2} x exp x age x mile{none,7:30,8:00,9:30,11:30}
//   x goal offset{-20,+10,+15,+20,+30,+45,+100 s/mi} x {undated,+4w,+8w,+12w} x rest{sun/wed,sat/sun}, seed 24865, clock pinned 2026-09-22 21:16.
// Arms (source surgery of <base.html>, anchors count==1): B, T1, CEa (multiplier only), CEb (divisor + multiplier), CET1.
// Usage: node v225_clockend_lattice.js <base.html> <scratch> surgery | lattice <shard> <n> [limit] | summarize | manny
// ORACLES (never the suspect clock): bw = L - hand taper (eventOn ? max(2,round(L*0.12)) : 0), cross-checked vs p.taperWeeks;
//   note string vs a hand m:ss of pp[bw-1]; G3 vs the ENTERED goal (_originalTarget = goal secs / dist, recomputed by hand too);
//   flip prediction = hand rate table {3,5,7} x age scale, gap/bw <= cap < gap/max(bw-1,1), gap = pp[0] - entered goal.
const path=require("path"), fs=require("fs");
const ART=path.resolve(process.argv[2]); const SCR=path.resolve(process.argv[3]); const MODE=process.argv[4];
const R=Date;
if(MODE!=="manny"){ const NOW=new R(2026,8,22,21,16,0).getTime(); class F extends R{constructor(...a){if(a.length===0)super(NOW);else super(...a);} static now(){return NOW;}} globalThis.Date=F; }
const H=require(path.resolve(__dirname,"..","harness.js"));
const OLD="{beginner:3, intermediate:5, advanced:7}", NEW="{beginner:3, intermediate:3, advanced:2}";
const T1S=[["  const paceImprove = {beginner:3, intermediate:5, advanced:7}[exp] || 4;","|| 4;"],
 ["  const paceImprove = {beginner:3, intermediate:5, advanced:7}[experience] || 4;","|| 4;"],
 ["    const expPaceImprove = {beginner:3, intermediate:5, advanced:7};   // V176 (D9)\n    const maxPaceImprovementPerWeek = buildRunProgressionForLength._paceImprovePerWeek\n      || expPaceImprove[exp] || 5;","|| 5;"],
 ["    const expPaceImprove  = {beginner:3, intermediate:5, advanced:7};",null],
 ["    const baseImprove = expPaceImprove[experience||'intermediate'] || 5;","|| 5;"]];
const RAW="    const rawImprovement = (initialPace - targetPace) / Math.max(buildWeeks, 1);";
const RT ="    const realisticTargetPace = initialPace - (weeklyImprovement * buildWeeks);";
const ARMS={B:[false,null],T1:[true,null],CEa:[false,"a"],CEb:[false,"b"],CET1:[true,"b"]};
const armFile=k=>path.join(SCR,"v225_arm_"+k+".html");
function surg(src,t1,ce){ let s=src; const log=[];
  if(t1) for(const [a,fb] of T1S){ const n=s.split(a).length-1; log.push("T1 n="+n); if(n!==1) throw new Error("T1 anchor count "+n); let r=a.split(OLD).join(NEW); if(fb) r=r.split(fb).join("|| 3;"); s=s.replace(a,()=>r); }
  if(ce){ const reps=[[RT,RT.replace("weeklyImprovement * buildWeeks","weeklyImprovement * Math.max(buildWeeks - 1, 0)")]];
    if(ce==="b") reps.unshift([RAW,RAW.replace("Math.max(buildWeeks, 1)","Math.max(buildWeeks - 1, 1)")]);
    for(const [a,r] of reps){ const n=s.split(a).length-1; log.push("CE"+ce+" n="+n); if(n!==1) throw new Error("CE anchor count "+n); s=s.replace(a,()=>r); } }
  return [s,log]; }
const fmt=s=>{ if(s==null) return "-"; const t=Math.round(s); return Math.floor(t/60)+":"+String(t%60).padStart(2,"0"); };  // hand m:ss
function mkVM(file){ const IA=H.load(file); const els=new Map(); const mk=IA.window.document.createElement;
  IA.window.document.getElementById=id=>{ if(!els.has(id)){const e=mk("div"); e.id=id; els.set(id,e);} return els.get(id); };
  IA.eval(`var __PPS={}; (function(){var o=buildRunProgressionForLength; buildRunProgressionForLength=function(){var r=o.apply(this,arguments); var p=r&&r.paceProgression; if(p) __PPS[arguments[1]]={arr:Array.from(p),d:p._dampened,g:p._weeklyGain,rt:p._realisticTarget,ot:p._originalTarget,met:p._goalMet}; return r;};})();`);
  return {IA,els}; }
function build(V,o){ const IA=V.IA; IA.window.__O=o;
  IA.eval(`WD={primaryPath:"event",cardioTypes:["run"],experience:__O.exp,ageBracket:__O.age,eventTargeted:__O.ev,raceDate:__O.race,liftingFocus:"support_prevention",equipment:"crossfit",restDays:__O.rest,unit:"lbs",seed:24865,name:"M",cardioGoals:{run:__O.run},startDate:undefined}; __PPS={};`);
  V.els.clear(); IA.localStorage._map.clear(); IA.eval("activeProg=null");
  try{IA.eval("doGenerate()");}catch(e){return {err:"threw "+e.message};} IA.flushTimers(Infinity);
  const p=IA.eval("activeProg"); if(!p) return {err:"no program"};
  const L=p.totalWeeks; const pp=IA.eval("__PPS")[L]||null; const tgt=new Set(); const noteKinds=new Set(); let nInt=0;
  Object.keys(p.weeks).forEach(w=>{ const W=p.weeks[w]; Object.keys(W).forEach(d=>{ const c=W[d].cardio; (Array.isArray(c)?c:(c?[c]:[])).forEach(x=>{ if(x&&x.type==="run"&&x.dose&&x.dose.key==="int"){ nInt++; const n=String(x.note||""); const m=n.match(/target for this block is (\d+:\d\d)\/mi/); if(m) tgt.add(m[1]); noteKinds.add(/needs more weeks/.test(n)?"SI":/already within/.test(n)?"MET":/Zone 5/.test(n)?"Z5":"OTHER"); } }); }); });
  return {L,taper:p.taperWeeks,pp,tgt:[...tgt],nk:[...noteKinds],nInt,dg:H.progDigest(p)}; }
const DISTS=[1.0,1.5,3.1,6.2], EXPS=["beginner","intermediate","advanced"], AGES=["18-35","36-54","55+"];
const MILES=[null,450,480,570,690], OFFS=[-20,10,15,20,30,45,100], DATED=[0,4,8,12], RESTS=[["sun","wed"],["sat","sun"]];
const DEF={beginner:690,intermediate:570,advanced:450};
const W1MON="2026-09-21"; const U=s=>{const[y,m,d]=s.split("-").map(Number);return R.UTC(y,m-1,d);};
const raceFor=k=>new R(U(W1MON)+((k-1)*7+3)*864e5).toISOString().slice(0,10);
function cells(){ const out=[]; for(const dist of DISTS) for(const exp of EXPS) for(const age of AGES) for(const mile of MILES) for(const off of OFFS) for(const dt of DATED) for(const rest of RESTS) out.push({dist,exp,age,mile,off,dt,rest}); return out; }
function cellCfg(c){ const anchor=(c.exp!=="beginner"&&c.mile)?c.mile:DEF[c.exp]; const gp=anchor-c.off; const tot=Math.round(gp*c.dist);
  const run={id:"run_pace_goal",label:"Hit a Pace / Time Goal",targetDist:String(c.dist),paceUnit:"mi",targetMins:String(Math.floor(tot/60)),targetSecs:String(tot%60),targetTime:fmt(tot)};
  if(c.mile){ run.mileBestMins=String(Math.floor(c.mile/60)); run.mileBestSecs=String(c.mile%60); run.mileBestSrc={kind:"entered"}; }
  return {o:{exp:c.exp,age:c.age,ev:!!c.dt,race:c.dt?raceFor(c.dt):"",rest:c.rest,run},goalPace:tot/c.dist}; }
const LAT_ARMS=(process.env.LAT_ARMS||"B,CEa,CEb").split(","); const LAT_PFX=process.env.LAT_PFX||"v225_lat_";
function lattice(sh,n,limit){ const V={}; LAT_ARMS.forEach(k=>V[k]=mkVM(armFile(k)));
  const f=path.join(SCR,`${LAT_PFX}${sh}.jsonl`); try{fs.unlinkSync(f);}catch(e){} const fd=fs.openSync(f,"w"); const t0=R.now(); let k=0;
  cells().forEach((c,i)=>{ if(i%n!==sh) return; if(limit&&k>=limit) return; const {o,goalPace}=cellCfg(c); const rec={i,c,goalPace};
    LAT_ARMS.forEach(a=>{ V[a].IA.eval("WD=null"); rec[a]=build(V[a],o); }); fs.writeSync(fd,JSON.stringify(rec)+"\n"); k++; });
  fs.closeSync(fd); console.log("shard",sh,"cells",k,"secs",((R.now()-t0)/1000).toFixed(0)); }
const HT={"18-35":1.0,"36-54":0.85,"55+":0.65}, BT={beginner:3,intermediate:5,advanced:7};
function summarize(){ const rows=[]; fs.readdirSync(SCR).filter(f=>/^v225_lat_\d+\.jsonl$/.test(f)).forEach(f=>fs.readFileSync(path.join(SCR,f),"utf8").split("\n").filter(Boolean).forEach(l=>rows.push(JSON.parse(l))));
  rows.sort((a,b)=>a.i-b.i); const uniq=new Set(rows.map(r=>r.i)).size;
  console.log("cells read",rows.length,"unique",uniq,"expected",cells().length);
  const E={}; LAT_ARMS.forEach(a=>E[a]=rows.filter(r=>r[a].err||!r[a].pp).length); console.log("errors / no pp per arm",JSON.stringify(E));
  const ok=rows.filter(r=>LAT_ARMS.every(a=>!r[a].err&&r[a].pp));
  const tapH=(r,a)=>r.c.dt?Math.max(2,Math.round(r[a].L*0.12)):0;
  let tapMis=0, otMis=0, Ldiff={CEa:0,CEb:0}; ok.forEach(r=>{ LAT_ARMS.forEach(a=>{ if((r[a].taper||[]).length!==tapH(r,a)) tapMis++; if(Math.abs(r[a].pp.ot-r.goalPace)>0.1) otMis++; }); ["CEa","CEb"].forEach(a=>{ if(r[a].L!==r.B.L) Ldiff[a]++; }); });
  console.log("oracle checks: hand taper != p.taperWeeks",tapMis,"of",ok.length*3,"| _originalTarget != hand goal pace (0.1s)",otMis,"of",ok.length*3,"| length moved vs B",JSON.stringify(Ldiff));
  const T={}; const inc=(k,pass)=>{ T[k]=T[k]||[0,0]; T[k][1]++; if(pass) T[k][0]++; };
  const fails={}; const addF=(k,r)=>{ fails[k]=fails[k]||[]; if(fails[k].length<3) fails[k].push(r); };
  ok.forEach(r=>{ LAT_ARMS.forEach(a=>{ const x=r[a], pp=x.pp, bw=x.L-tapH(r,a), last=pp.arr[bw-1]; const seg=r.c.dt?"dated":"undated";
    const handMet = pp.arr[0]-r.goalPace<=0;
    if(handMet!==pp.met) inc(a+" metcheck hand==engine",false); else inc(a+" metcheck hand==engine",true);
    if(!pp.met){
      const p1=Math.abs(last-pp.rt)<=0.1; inc(a+" G1a last==rt ALL",p1); inc(a+" G1a last==rt "+seg,p1); inc(a+" G1a last==rt "+(pp.d?"damp":"undamp"),p1); if(!p1) addF(a+" G1a "+seg,`${JSON.stringify(r.c)} bw${bw} last ${last} rt ${pp.rt}`);
      if(x.tgt.length){ const p2=x.tgt.length===1&&x.tgt[0]===fmt(last); inc(a+" G1b note==fmt(last) ALL(notes printed)",p2); inc(a+" G1b note==fmt(last) "+seg,p2); if(!p2) addF(a+" G1b "+seg,`${JSON.stringify(r.c)} note ${x.tgt} last ${fmt(last)}`); }
      else inc(a+" G1b no target-note printed (not-met)"+(pp.d?" DAMPENED":" undamp"),true);
      if(bw<x.L){ const p3=pp.arr.slice(bw).every(v=>Math.abs(v-last)<=0.1); inc(a+" G2 taper==last ALL",p3); if(!p3) addF(a+" G2",`${JSON.stringify(r.c)} bw${bw} arr ${pp.arr.map(fmt).join(" ")}`); }
      if(!pp.d){ const p4=Math.abs(last-pp.ot)<=0.1; inc(a+" G3 undamp last==goal ALL",p4); inc(a+" G3 undamp last==goal "+seg,p4); if(!p4) addF(a+" G3 "+seg,`${JSON.stringify(r.c)} bw${bw} last ${fmt(last)} goal ${fmt(pp.ot)} arr ${pp.arr.map(fmt).join(" ")}`);
        const everGoal=pp.arr.some(v=>Math.abs(v-pp.ot)<=0.1); inc(a+" G3x undamp goal printed in ANY week",everGoal); }
    } else { const p5=pp.arr.every(v=>v===pp.arr[0]); inc(a+" G4 met all==W1",p5); if(!p5) addF(a+" G4",`${JSON.stringify(r.c)} arr ${pp.arr.map(fmt).join(" ")}`); }
  }); });
  console.log("\n== GATES (pass / total)"); Object.keys(T).sort().forEach(k=>console.log("  "+k.padEnd(52),String(T[k][0]).padStart(5),"/",String(T[k][1]).padStart(5)));
  console.log("\n== sample failures (<=3 each)"); Object.keys(fails).sort().forEach(k=>fails[k].forEach(s=>console.log("  ["+k+"] "+s)));
  // G4 / digest identity on goal-met cells B vs CEb
  let metDg=[0,0]; ok.filter(r=>r.B.pp.met).forEach(r=>{ metDg[1]++; if(r.B.dg===r.CEb.dg) metDg[0]++; }); console.log("\nG4b goal-met cells whole-program digest B==CEb",metDg[0],"/",metDg[1]);
  // KEY: dampened flips
  const bwOf=(r,a)=>r[a].L-tapH(r,a);
  const flip=(r,a)=>!r.B.pp.met&&r.B.pp.d===false&&r[a].pp.d===true;
  const back=(r,a)=>!r.B.pp.met&&r.B.pp.d===true&&r[a].pp.d===false;
  const S={}; const sadd=(k,r)=>{ S[k]=S[k]||{n:0,nm:0,und:0,fb:0,fa:0,bk:0,pred:0,predOK:0}; const s=S[k]; s.n++; if(!r.B.pp.met){s.nm++; if(!r.B.pp.d) s.und++;} if(flip(r,"CEb")) s.fb++; if(flip(r,"CEa")) s.fa++; if(back(r,"CEb")) s.bk++;
    const bw=bwOf(r,"B"), gap=r.B.pp.arr[0]-r.goalPace, cap=+(BT[r.c.exp]*HT[r.c.age]).toFixed(2); const pr=gap>0&&bw>=2&&gap/bw<=cap&&gap/(bw-1)>cap; if(pr) s.pred++; if(pr===flip(r,"CEb")) s.predOK++; };
  ok.forEach(r=>{ sadd("ALL",r); sadd("exp "+r.c.exp,r); sadd("age "+r.c.age,r); sadd("bw "+String(bwOf(r,"B")).padStart(2),r); sadd("dated "+(r.c.dt?"+"+r.c.dt+"w":"none"),r); sadd("off "+r.c.off,r); sadd("dist "+r.c.dist,r); sadd("exp x dated "+r.c.exp+" "+(r.c.dt?"+"+r.c.dt:"0"),r); });
  console.log("\n== KEY: _dampened false->true, B -> arm (same cell, same L unless noted). n=cells | notmet(B) | undamp notmet(B) | flip CEb | flip CEa | true->false CEb | hand-predicted flips | hand==engine");
  Object.keys(S).forEach(k=>{const s=S[k]; console.log("  "+k.padEnd(34),"n",String(s.n).padStart(5),"| nm",String(s.nm).padStart(5),"| und",String(s.und).padStart(5),"| flipCEb",String(s.fb).padStart(4),"| flipCEa",String(s.fa).padStart(4),"| back",s.bk,"| pred",String(s.pred).padStart(4),"| agree",s.predOK+"/"+s.n);});
  console.log("\n== flipped cells (CEb), all:"); ok.filter(r=>flip(r,"CEb")).forEach(r=>{ const bw=bwOf(r,"B"); console.log(`  ${r.c.dist}mi ${r.c.exp.slice(0,3)} ${r.c.age} mile ${r.c.mile?fmt(r.c.mile):"none"} off+${r.c.off} ${r.c.dt?"+"+r.c.dt+"w":"undated"} ${r.c.rest.join("/")} | L${r.B.L} bw${bw} gap ${(r.B.pp.arr[0]-r.goalPace).toFixed(1)} | B g ${r.B.pp.g} last ${fmt(r.B.pp.arr[bw-1])} goal ${fmt(r.B.pp.ot)} | CEb g ${r.CEb.pp.g} last ${fmt(r.CEb.pp.arr[bw-1])} short by ${(r.CEb.pp.arr[bw-1]-r.CEb.pp.ot).toFixed(1)}s | note kinds B ${r.B.nk} CEb ${r.CEb.nk}`); });
  // SI note appearance delta
  let siB=0,siC=0,siGain=0; ok.forEach(r=>{ const b=r.B.nk.includes("SI"), c=r.CEb.nk.includes("SI"); if(b)siB++; if(c)siC++; if(c&&!b)siGain++; }); console.log("\nSI 'needs more weeks' note printed: B",siB,"CEb",siC,"cells gaining it under CEb",siGain,"of",ok.length);
  // digest moves B->CEb
  let dm=0; ok.forEach(r=>{ if(r.B.dg!==r.CEb.dg) dm++; }); console.log("whole-program digest moved B->CEb",dm,"of",ok.length);
}
function manny(){ const want="0ac7da6b1691a8e1"; for(const k of Object.keys(ARMS)){ const IA=H.load(armFile(k)); const a=H.progDigest(IA.buildProgram(H.fixtures.HALF_MANNY)), b=H.progDigest(IA.buildProgram(H.fixtures.HALF_MANNY)); console.log("HALF_MANNY",k,"v"+IA.version,a,b===a?"self-identical":"SELF-DIFF "+b,a===want?"== 0ac7da6b1691a8e1":"!= 0ac7da6b1691a8e1"); } }
function surgery(){ const src=fs.readFileSync(ART,"utf8"); console.log("base ia-version",(src.match(/ia-version" content="(\d+)"/)||[])[1],"| literal count",src.split(OLD).length-1);
  for(const k in ARMS){ const [s,log]=surg(src,...ARMS[k]); const f=armFile(k); try{fs.unlinkSync(f);}catch(e){} fs.writeFileSync(f,s); console.log(k,log.join(" ")||"untouched","bytes",s.length-src.length); } }
// pair mode (coordinator follow-up): _dampened flips base->arm for the SHIPPED pair T1 -> CET1 (or any PAIR=base,arm).
// Merges jsonl files with prefixes in PAIR_PFX by cell index i. Hand cap table keyed by the base arm's rate table.
function pairSum(){ const [BA,AR]=(process.env.PAIR||"T1,CET1").split(","); const OLDT={beginner:3,intermediate:5,advanced:7}, NEWT={beginner:3,intermediate:3,advanced:2}; const TBLS={B:OLDT,CEa:OLDT,CEb:OLDT,T1:NEWT,CET1:NEWT};
  const byI=new Map(); (process.env.PAIR_PFX||"v225_lat_,v225_latT_").split(",").forEach(px=>fs.readdirSync(SCR).filter(f=>new RegExp("^"+px+"\\d+\\.jsonl$").test(f)).forEach(f=>fs.readFileSync(path.join(SCR,f),"utf8").split("\n").filter(Boolean).forEach(l=>{ const r=JSON.parse(l); const o=byI.get(r.i)||{i:r.i,c:r.c,goalPace:r.goalPace}; Object.keys(r).forEach(k=>{ if(!["i","c","goalPace"].includes(k)) o[k]=r[k]; }); byI.set(r.i,o); })));
  const rows=[...byI.values()].filter(r=>r[BA]&&r[AR]); console.log("PAIR",BA,"->",AR,"cells with both arms",rows.length,"errors",rows.filter(r=>r[BA].err||r[AR].err||!r[BA].pp||!r[AR].pp).length);
  const tap=(r,a)=>r.c.dt?Math.max(2,Math.round(r[a].L*0.12)):0; let tapMis=0, Lmv=0; rows.forEach(r=>{ [BA,AR].forEach(a=>{ if((r[a].taper||[]).length!==tap(r,a)) tapMis++; }); if(r[BA].L!==r[AR].L) Lmv++; }); console.log("hand taper mismatches",tapMis,"| length moved",BA,"->",AR,Lmv);
  const T={}; const inc=(k,ok)=>{T[k]=T[k]||[0,0];T[k][1]++;if(ok)T[k][0]++;};
  rows.forEach(r=>[BA,AR].forEach(a=>{ const x=r[a],pp=x.pp,bw=x.L-tap(r,a),last=pp.arr[bw-1],seg=r.c.dt?"dated":"undated";
    if(!pp.met){ inc(a+" G1a last==rt "+seg,Math.abs(last-pp.rt)<=0.1); if(x.tgt.length) inc(a+" G1b note==fmt(last)",x.tgt.length===1&&x.tgt[0]===fmt(last)); if(bw<x.L) inc(a+" G2 taper==last",pp.arr.slice(bw).every(v=>Math.abs(v-last)<=0.1)); if(!pp.d) inc(a+" G3 undamp last==goal "+seg,Math.abs(last-pp.ot)<=0.1); }
    else inc(a+" G4 met all==W1",pp.arr.every(v=>v===pp.arr[0])); }));
  console.log("== gates (pass/total)"); Object.keys(T).sort().forEach(k=>console.log("  "+k.padEnd(40),T[k][0],"/",T[k][1]));
  const bwOf=r=>r[BA].L-tap(r,BA); const flip=r=>!r[BA].pp.met&&!r[BA].pp.d&&r[AR].pp.d; const back=r=>!r[BA].pp.met&&r[BA].pp.d&&!r[AR].pp.d;
  const S={}; const add=(k,r)=>{S[k]=S[k]||{n:0,nm:0,und:0,f:0,bk:0,pr:0,ag:0}; const s=S[k]; s.n++; if(!r[BA].pp.met){s.nm++; if(!r[BA].pp.d)s.und++;} if(flip(r))s.f++; if(back(r))s.bk++;
    const bw=bwOf(r), gap=r[BA].pp.arr[0]-r.goalPace, cap=+(TBLS[BA][r.c.exp]*({"18-35":1,"36-54":0.85,"55+":0.65})[r.c.age]).toFixed(2); const pr=gap>0&&bw>=2&&gap/bw<=cap&&gap/(bw-1)>cap; if(pr)s.pr++; if(pr===flip(r))s.ag++; };
  rows.forEach(r=>{ add("ALL",r); add("exp "+r.c.exp,r); add("age "+r.c.age,r); add("bw "+String(bwOf(r)).padStart(2),r); add("dated "+(r.c.dt?"+"+r.c.dt+"w":"none"),r); add("off "+r.c.off,r); add("dist "+r.c.dist,r); });
  console.log("== flips "+BA+" -> "+AR+": n | notmet("+BA+") | undamp notmet | FLIP | true->false | hand-pred | hand==engine");
  Object.keys(S).sort().forEach(k=>{const s=S[k]; console.log("  "+k.padEnd(20),"n",String(s.n).padStart(5),"| nm",String(s.nm).padStart(5),"| und",String(s.und).padStart(5),"| FLIP",String(s.f).padStart(4),"| back",s.bk,"| pred",String(s.pr).padStart(4),"| agree",s.ag+"/"+s.n);});
  const F=rows.filter(flip); const q=a=>{ if(!a.length) return "n 0"; const b=[...a].sort((x,y)=>x-y); return `n ${b.length} min ${b[0].toFixed(1)} p50 ${b[b.length>>1].toFixed(1)} p90 ${b[Math.floor(b.length*0.9)].toFixed(1)} max ${b[b.length-1].toFixed(1)} mean ${(b.reduce((x,y)=>x+y,0)/b.length).toFixed(2)}`; };
  const sf=a=>F.map(r=>{const bw=r[a].L-tap(r,a); return r[a].pp.arr[bw-1]-r[a].pp.ot;});
  console.log("flipped set, last build week short of entered goal (s/mi):",BA,q(sf(BA)),"||",AR,q(sf(AR)));
  console.log("flipped set,",AR,"note prints goal m:ss == block target m:ss:",F.filter(r=>r[AR].tgt.length===1&&r[AR].tgt[0]===fmt(r[AR].pp.ot)).length);
  [BA,AR].forEach(a=>{ const D=rows.filter(r=>!r[a].pp.met&&r[a].pp.d); console.log(a,"dampened",D.length,"of",rows.length,"| SI note goal m:ss == target m:ss",D.filter(r=>r[a].tgt.length===1&&r[a].tgt[0]===fmt(r[a].pp.ot)).length); });
  console.log("digest moved",BA,"->",AR,rows.filter(r=>r[BA].dg!==r[AR].dg).length,"of",rows.length);
}
({surgery,summarize,manny,pair:pairSum,lattice:()=>lattice(+process.argv[5],+process.argv[6],+(process.argv[7]||0))})[MODE]();
