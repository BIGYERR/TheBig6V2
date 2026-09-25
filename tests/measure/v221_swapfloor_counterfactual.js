// MEASURE v212 (provisional) — Mode B, before-build check on coach's P-SWAPFLOOR (R1 + R3).
// usage: node tests/measure/v221_swapfloor_counterfactual.js <base.html> <copy-out.html> [--lite] [--r3=landmine] [--r4]
// copy1 (first ruling): no flags. copy2 (re-ruling RR2/RR3): --r3=landmine --r4. copy3 (RR4): --r3=alt --r4
// Builds a source-surgery COPY of <base> (anchors asserted count==1), never touches index.html.
// Oracles: Q1 expected string is literal (ruling text). Q2 windows are a HAND table from the
// ruling's floor table (not _repFloor). Reps parsed by a hand regex. Q3 compares base vs copy cards.
const fs=require("fs"),path=require("path");
const {load,fixtures,progDigest}=require(path.resolve(__dirname,"..","harness.js"));
const BASE=process.argv[2], COPY=process.argv[3], LITE=process.argv.includes("--lite"), R3TOK=process.argv.includes("--r3=landmine"), R3ALT=process.argv.includes("--r3=alt"), R4=process.argv.includes("--r4");
let src=fs.readFileSync(BASE,"utf8");
function splice(anchor,repl){const n=src.split(anchor).length-1; if(n!==1){console.log("ANCHOR count="+n+" :: "+anchor.slice(0,80));process.exit(2);} src=src.replace(anchor,()=>repl);}
// R1
splice("  if(!(fl&&fl[1]===0)) return detail;                 // movement can express a rep target",
"  if(fl&&fl[1]!==0){\n    const _m=/^(\\d+×)(\\d+(?:–\\d+)?)( — RPE )/.exec(detail);\n    if(_m){const _lo=parseInt(_m[2],10); if(!(_lo>=fl[0])) return _m[1]+fl[0]+'–'+fl[1]+detail.slice(_m[1].length+_m[2].length);}\n    return detail;\n  }\n  if(!(fl&&fl[1]===0)) return detail;                 // movement can express a rep target");
// R3
splice("[/split squat|step-?up|single-leg|single leg|pistol/i, [6,10]]",R3ALT?"[/split squat|step-?up|single-leg|single leg|pistol|landmine (reverse lunge|rotational press)/i, [6,10]]":R3TOK?"[/split squat|step-?up|single-leg|single leg|pistol|landmine/i, [6,10]]":"[/split squat|step-?up|single-leg|single leg|pistol|^Landmine reverse lunge$/i, [6,10]]");
if(R4){ // RR3: recordSwap stores the donor detail; undoSwap writes it back; legacy records (no detail) stay name-only
  splice("function recordSwap(pid,week,dayKey,from,to){","function recordSwap(pid,week,dayKey,from,to,detail){");
  splice("  list.push({from:from,to:to,ts:Date.now()});","  const _e={from:from,to:to,ts:Date.now()}; if(typeof detail==='string')_e.detail=detail; list.push(_e);");
  splice("  recordSwap(activeProgId,currentWeek,currentDayKey,from,to);","  recordSwap(activeProgId,currentWeek,currentDayKey,from,to,_wasDetail);");
  splice("  applySwapPrefs(day.sections,back);\n  clearSwap(","  const _tgt=[]; (day.sections||[]).forEach(s=>((s&&s.items)||[]).forEach(it=>{if(it&&it.name===hit.to)_tgt.push(it);}));\n  applySwapPrefs(day.sections,back);\n  if(typeof hit.detail==='string') _tgt.forEach(it=>{it.detail=hit.detail;});\n  clearSwap(");
}
fs.writeFileSync(COPY,src);
const B=load(BASE), C=load(COPY); console.log("base ia-version",B.version,"| copy ia-version",C.version);
const clean=s=>String(s||"").replace(/<svg[\s\S]*?<\/svg>\s*/g,"").trim();
const lowReps=d=>{const m=String(d||"").match(/^\s*\d+\s*[×x]\s*(\d+)/);return m?+m[1]:null;};
const HAND=[[/goblet/i,[8,12]],[/kettlebell swing/i,[10,15]],[/kettlebell single-leg deadlift/i,[6,10]],[/^Landmine reverse lunge$/,[6,10]],
 [/dumbbell split-stance deadlift|leg press|^dumbbell (bench|incline|decline|floor) press|^dumbbell (romanian deadlift|rdl|snatch)/i,[5,8]],
 [/^barbell|^front squat/i,null],[/dumbbell|kettlebell|\bdb\b|\bkb\b/i,[5,8]]]; // last row = ruling: generic loaded non-barbell
const CHEST=/goblet|front[- ]?rack|single[- ]?(kb|kettlebell)|landmine|bodyweight|\bband|banded|\(kb\)|kettlebell|dumbbell|\bdb\b|\bkb\b|chair|\bbed\b/i; // v212 spread scope, verbatim
const hand=n=>{for(const [re,w] of HAND) if(re.test(n)) return {w}; return undefined;};
function mk(t,f,x,g,i,sd,travel){const isRace=!!g.id&&/half/.test(g.id);
  return {name:"M",primaryPath:g.id?(isRace?"event":"cardio"):"lift",cardioTypes:g.id?["run"]:[],
   cardioGoals:g.id?{run:{id:g.id,label:g.k,mileBestMins:"10",mileBestSecs:"30",baselineDist:"5",baseline:"5mi",targetDist:"1.5",targetMins:"11",targetSecs:"0"}}:{},
   eventTargeted:isRace,raceDate:isRace?"2026-12-06":null,liftingFocus:f,experience:x,ageBracket:"18-35",equipment:t,unit:"lbs",
   restDays:["sun","wed"],days:["sun","mon","tue","wed","thu","fri","sat"],bench:135,squat:155,deadlift:185,seed:sd,...(travel?{_travel:true}:{}),...(i.v?{injury:i.v}:{})};}
const LO={k:"liftonly",id:null};
// ── Q1 premise
console.log("\n== Q1 PREMISE commercial|support_strength|beginner|liftonly|knee/workaround seed 76308 W5 thu");
const EXP="4×8–12 — RPE 7 (leave ~3 reps in reserve), ramp up with 2–3 warmup sets, 2–3 min rest";
const rcfg=mk("commercial","support_strength","beginner",LO,{v:{region:"knee",tier:"workaround"}},76308);
for(const [tag,IA] of [["HEAD",B],["COPY",C]]){const p=IA.buildProgram(rcfg);const day=p.weeks["5"].thu;
  const sec=day.sections.find(s=>/^main/i.test(clean(s.label)));const it=sec.items[0];
  const out=IA.eval("_swapDetailFor")("Dumbbell goblet squat",it.detail);
  console.log(" ",tag,"donor",clean(it.name),"::",it.detail,"\n   -> goblet ::",out,"|",out===EXP?"PASS":"FAIL");}
// ── Lattice
const TIERS=["commercial","home_full","crossfit","home_basic","bodyweight","minimal"],FOCUS=["support_prevention","support_strength","hypertrophy","strength"];
const EXPS=LITE?["intermediate"]:["beginner","intermediate","advanced"],GOALS=[LO,{k:"pace",id:"run_pace_goal"},{k:"half",id:"run_half"}];
const INJ=[{k:"healthy",v:null}];["knee","lowback","shoulder","elbow","ankle","hip","other"].forEach(r=>["protect","workaround"].forEach(t=>INJ.push({k:r+"/"+t,v:{region:r,tier:t}})));
const L=[];for(const t of TIERS)for(const f of FOCUS)for(const x of EXPS)for(const g of GOALS)for(const i of INJ)L.push([mk(t,f,x,g,i,76308,false),[t,f,x,g.k,i.k].join("|")]);
for(const t of ["home_basic","bodyweight"])for(const f of FOCUS)for(const x of EXPS)for(const g of GOALS)for(const i of INJ)L.push([mk(t,f,x,g,i,76308,true),["travel",t,f,x,g.k,i.k].join("|")]);
const R={builds:0,crash:{HEAD:0,COPY:0},cards:0,cardDiff:0,cardEx:[],digDiff:0,
 pairs:0,pairsChanged:0,changedBy:{},suffixBad:0,le5:{},le5All:0,exc:[],under:0,underEx:[],unlisted:{},
 ch:{pairs:0,le5:0,by:{},exc:{}},pw:{sections:0,items:0,rpeItems:0,rpeEx:[],swapPairs:0,swapRpe:0,swapChanged:0},undoPick:null};
const inc=(o,k)=>o[k]=(o[k]||0)+1; const PIN={items:0,chC:0,chB:0,byC:{},named:{}},DUP={days:0,ex:null}; const patC=C.eval("_pattern"); const NAMED=["Dumbbell renegade rows","Kettlebell windmill","Suitcase carry"];
const LM={det:{},cards:{},changed:{},swapDonor:{},swapCand:{},secs:{}};
const sdB=B.eval("_swapDetailFor"),sdC=C.eval("_swapDetailFor"),scC=C.eval("swapCandidates"),rfB=B.eval("_repFloor");
for(const [cfg,tag] of L){let pb,pc;
  try{pb=B.buildProgram(cfg);}catch(e){R.crash.HEAD++;continue;} try{pc=C.buildProgram(cfg);}catch(e){R.crash.COPY++;continue;}
  R.builds++; if(progDigest(pb)!==progDigest(pc))R.digDiff++;
  const pcc=Object.assign({},pc,{cfg});
  Object.keys(pc.weeks).forEach(w=>Object.keys(pc.weeks[w]).forEach(d=>{const dc=pc.weeks[w][d],db=pb.weeks[w]&&pb.weeks[w][d]; if(!dc||dc.rest)return;
    {const seen={};let dup=null;(dc.sections||[]).forEach((s,si)=>(s.items||[]).forEach((it,ii)=>{const k=it.name;if(seen[k]&&!dup)dup={name:k,a:seen[k],b:[si,ii]};if(!seen[k])seen[k]=[si,ii];}));
      if(dup){let c=null;try{c=scC(clean(dup.name),dc,w,pcc);}catch(e){} const n=c?[].concat(c.tier1||[],c.tier2||[]).length:0; if(n){DUP.days++; if(!DUP.ex)DUP.ex={cfg,tag,w,d,name:dup.name,to:[].concat(c.tier1||[],c.tier2||[])[0],a:dup.a,b:dup.b};}}}
    (dc.sections||[]).forEach((s,si)=>{const sb=db&&db.sections&&db.sections[si]; const L2=clean(s.label);
      (s.items||[]).forEach((it,ii)=>{R.cards++; const ib=sb&&sb.items&&sb.items[ii];
        if(!ib||ib.name!==it.name||ib.detail!==it.detail){R.cardDiff++; if(R.cardEx.length<5)R.cardEx.push(tag+" W"+w+" "+d+" ["+L2+"] "+(ib?clean(ib.name)+" :: "+ib.detail:"<none>")+"  =>  "+clean(it.name)+" :: "+it.detail);}
        if(/landmine/i.test(it.name)){const k=clean(it.name); inc(LM.cards,k); (LM.det[k]=LM.det[k]||new Set()).add(String(it.detail)); inc(LM.secs,k+" @ "+L2.split(/ [—-] /)[0]+" :: "+String(it.detail).slice(0,40)); if(!ib||ib.detail!==it.detail)inc(LM.changed,k);}
        {const nm=it.name; let pn=null; try{pn=patC(nm);}catch(e){} if(pn==null){PIN.items++; const oc=sdC(nm,it.detail),ob=sdB(nm,it.detail); if(oc!==it.detail){PIN.chC++;inc(PIN.byC,clean(nm)+" :: "+it.detail);} if(ob!==it.detail)PIN.chB++;
          const hit=NAMED.find(x=>clean(nm)===x); if(hit){const k=hit+" | changed="+(oc!==it.detail); inc(PIN.named,k);}}}
        const isPow=/^power|explosive finisher/i.test(L2), isMain=/^main/i.test(L2);
        if(isPow){R.pw.items++; if(/^\d+×\S+ — RPE/.test(String(it.detail||""))){R.pw.rpeItems++; if(R.pw.rpeEx.length<5)R.pw.rpeEx.push(tag+" W"+w+" "+d+" "+clean(it.name)+" :: "+it.detail);}}
        if(!isPow&&!isMain)return;
        let c=null;try{c=scC(clean(it.name),dc,w,pcc);}catch(e){} if(!c)return;
        [].concat(c.tier1||[],c.tier2||[]).forEach(n=>{const a=sdB(n,it.detail),b=sdC(n,it.detail);
          if(/landmine/i.test(n)){inc(LM.swapCand,n+(a!==b?" CHANGED":" same"));} if(/landmine/i.test(it.name))inc(LM.swapDonor,clean(it.name));
          if(isPow){R.pw.swapPairs++; if(/^\d+×\S+ — RPE/.test(String(it.detail)))R.pw.swapRpe++; if(a!==b)R.pw.swapChanged++; return;}
          R.pairs++;
          if(a!==b){R.pairsChanged++; inc(R.changedBy,n);
            const ma=/^(\d+×)\d+(?:–\d+)?/.exec(a),mb=/^(\d+×)\d+(?:–\d+)?/.exec(b);
            if(!ma||!mb||a.slice(ma[0].length)!==b.slice(mb[0].length)||ma[1]!==mb[1])R.suffixBad++;}
          if(!R.undoPick&&rfB(n)&&rfB(n)[1]===0&&a!==it.detail)R.undoPick={cfg,tag,w,d,from:clean(it.name),to:n};
          const r=lowReps(b); const h=hand(n);
          if(CHEST.test(n)){R.ch.pairs++; if(r!==null&&r<=5){R.ch.le5++; inc(R.ch.by,n+" -> "+r+" hand="+(h===undefined?"unlisted":JSON.stringify(h.w))); if(!(r===5&&h&&h.w&&h.w[0]===5&&h.w[1]===8))inc(R.ch.exc,n+" -> "+r);}}
          if(h===undefined)inc(R.unlisted,n);
          if(h&&h.w&&r!==null&&r<h.w[0]){R.under++; if(R.underEx.length<5)R.underEx.push(tag+" "+n+" :: "+b);}
          if(r!==null&&r<=5){R.le5All++; inc(R.le5,n+" -> "+r+" hand="+(h===undefined?"unlisted":JSON.stringify(h.w)));
            if(!(r===5&&h&&h.w&&h.w[0]===5&&h.w[1]===8)&&R.exc.length<12&&!(h&&h.w===null))R.exc.push(tag+" W"+w+" "+d+" "+clean(it.name)+" -> "+n+" :: "+b);}
        });});});}));}
console.log("\n== LATTICE builds",R.builds,"of",L.length,"crash",JSON.stringify(R.crash));
console.log("== Q3 ENGINE cards compared",R.cards,"| changed",R.cardDiff,"| builds with digest moved",R.digDiff); R.cardEx.forEach(x=>console.log("  EX",x));
const hm=[B,C].map(IA=>progDigest(IA.buildProgram(JSON.parse(JSON.stringify(fixtures.HALF_MANNY)))));
const hm2=progDigest(B.buildProgram(JSON.parse(JSON.stringify(fixtures.HALF_MANNY))));
console.log("  HALF_MANNY digest HEAD",hm[0],"(self",hm2===hm[0]?"stable":"UNSTABLE",") COPY",hm[1],hm[0]===hm[1]?"UNMOVED":"MOVED");
console.log("== Q2 SPREAD Main (item,candidate) pairs",R.pairs,"| changed by R1/R3",R.pairsChanged,"| changed outside the rep token",R.suffixBad,"| landing under HAND window",R.under);
Object.entries(R.changedBy).sort((a,b)=>b[1]-a[1]).forEach(([k,n])=>console.log("   changed",n,k)); R.underEx.forEach(x=>console.log("  UNDER",x));
console.log("  pairs at <=5 on COPY",R.le5All,"by candidate:"); Object.entries(R.le5).sort((a,b)=>b[1]-a[1]).forEach(([k,n])=>console.log("   ",n,k));
console.log("  exceptions (<=5, not exactly 5 on a hand [5,8], excluding hand-null barbell):"); R.exc.forEach(x=>console.log("   EXC",x));
console.log("  candidates not in HAND table:",JSON.stringify(R.unlisted));
console.log("== Q2b CHEST-scope (v212 spread) pairs",R.ch.pairs,"| <=5",R.ch.le5); Object.entries(R.ch.by).sort((a,b)=>b[1]-a[1]).forEach(([k,n])=>console.log("   ",n,k));
console.log("  CHEST exceptions (<=5 and not exactly 5 on a hand [5,8]):",Object.values(R.ch.exc).reduce((a,b)=>a+b,0)); Object.entries(R.ch.exc).sort((a,b)=>b[1]-a[1]).forEach(([k,n])=>console.log("    EXC",n,k));
console.log("== LANDMINE census. _repFloor HEAD vs COPY:"); ["Landmine reverse lunge","Landmine rotational press","Landmine rotations"].forEach(n=>console.log("   ",n,JSON.stringify(rfB(n)),"->",JSON.stringify(C.eval("_repFloor")(n))));
console.log("  engine cards by name",JSON.stringify(LM.cards),"| changed",JSON.stringify(LM.changed)); Object.entries(LM.secs).sort((a,b)=>b[1]-a[1]).slice(0,12).forEach(([k,n])=>console.log("    card",n,k));
Object.keys(LM.det).forEach(k=>{let ch=0;LM.det[k].forEach(d=>{if(sdC(k,d)!==d)ch++;});console.log("  _swapDetailFor(COPY) on",k,"distinct engine details",LM.det[k].size,"| changed",ch);});
console.log("  as swap candidate (Main/Power donors)",JSON.stringify(LM.swapCand),"| as swap donor",JSON.stringify(LM.swapDonor));
console.log("== Q4 POWER items",R.pw.items,"| with S×R — RPE grammar",R.pw.rpeItems,"| power swap pairs",R.pw.swapPairs,"| of which donor RPE",R.pw.swapRpe,"| changed base->copy",R.pw.swapChanged); R.pw.rpeEx.forEach(x=>console.log("  EX",x));
// ── Q5 undo through the real handlers
function undo(IA,cfg,w,d,from,to,label,legacy){const p=IA.buildProgram(cfg);p.cfg=cfg;p.id="P1";const G=IA.eval("globalThis");G.__p=p;
  IA.eval("activeProg=globalThis.__p;activeProgId='P1';currentWeek="+(+w)+";currentDayKey='"+d+"';");
  const day=p.weeks[w][d];let si=-1,ii=-1;day.sections.forEach((s,a)=>(s.items||[]).forEach((it,b)=>{if(si<0&&clean(it.name)===from){si=a;ii=b;}}));
  const it=()=>day.sections[si].items[ii]; const b0=it().detail;
  IA.eval("_swapCtx={secIdx:"+si+",itemIdx:"+ii+",name:"+JSON.stringify(it().name)+"};");
  try{IA.eval("applySwapChoice")(to);}catch(e){console.log("   (applySwapChoice threw after mutate?)",e.message);} const b1=it().name+" :: "+it().detail;
  const rec=IA.eval("getSwaps('P1')")["w"+w+"_"+d]; const had=rec&&rec[0]&&("detail" in rec[0]);
  if(legacy){IA.eval("(function(){const s=getSwaps('P1');Object.keys(s).forEach(k=>s[k].forEach(e=>{delete e.detail;}));saveSwaps('P1',s);})()");}
  console.log("     record carried detail:",had,legacy?"(stripped: legacy)":"");
  try{IA.eval("undoSwap")(from);}catch(e){console.log("   (undoSwap threw)",e.message);} const b2=it().name+" :: "+it().detail;
  console.log("  ",label,"\n     before:",from,"::",b0,"\n     swap  :",b1,"\n     undo  :",b2,"|",it().detail===b0?"detail RESTORED":"detail NOT restored");}
console.log("== PIN null-_pattern items",PIN.items,"| _swapDetailFor changes on COPY",PIN.chC,"| on HEAD",PIN.chB); Object.entries(PIN.byC).sort((a,b)=>b[1]-a[1]).slice(0,10).forEach(([k,n])=>console.log("    ",n,k));
NAMED.forEach(x=>{let p=null;try{p=patC(x);}catch(e){} console.log("   named",x,"_pattern="+JSON.stringify(p),"_repFloor COPY="+JSON.stringify(C.eval("_repFloor")(x)));}); console.log("   named on engine cards",JSON.stringify(PIN.named));
console.log("== DUP days with a repeated item name where it is swappable",DUP.days);
if(DUP.ex){const e=DUP.ex; console.log("   example",e.tag,"W"+e.w,e.d,JSON.stringify(e.name),"at",JSON.stringify(e.a),JSON.stringify(e.b),"-> swap to",e.to);
  for(const [tag,IA] of [["HEAD",B],["COPY",C]]){const p=IA.buildProgram(e.cfg);p.cfg=e.cfg;p.id="P1";IA.eval("globalThis").__p=p;IA.eval("activeProg=globalThis.__p;activeProgId='P1';currentWeek="+(+e.w)+";currentDayKey='"+e.d+"';");
    const day=p.weeks[e.w][e.d]; const b0=JSON.stringify(day.sections); const A=()=>day.sections[e.a[0]].items[e.a[1]],Bi=()=>day.sections[e.b[0]].items[e.b[1]];
    IA.eval("_swapCtx={secIdx:"+e.a[0]+",itemIdx:"+e.a[1]+",name:"+JSON.stringify(e.name)+"};"); try{IA.eval("applySwapChoice")(e.to);}catch(x){}
    const s1=[A().name+" :: "+A().detail,Bi().name+" :: "+Bi().detail]; try{IA.eval("undoSwap")(clean(e.name)===e.name?e.name:e.name);}catch(x){}
    const b2=JSON.stringify(day.sections);
    console.log("  ",tag,"before A/B:",JSON.stringify(JSON.parse(b0)[e.a[0]].items[e.a[1]].detail),"| after swap A:",s1[0],"B:",s1[1],"| after undo A:",A().name+" :: "+A().detail,"B:",Bi().name+" :: "+Bi().detail,"| day byte-identical:",b0===b2);}}
console.log("\n== Q5 UNDO");
const u=R.undoPick; console.log("  unloadable pick:",u&&(u.tag+" W"+u.w+" "+u.d+" "+u.from+" -> "+u.to));
for(const [tag,IA] of [["HEAD",B],["COPY",C]]){ if(u)undo(IA,u.cfg,u.w,u.d,u.from,u.to,tag+" unloadable");
  undo(IA,rcfg,"5","thu","Barbell box squat","Dumbbell goblet squat",tag+" goblet (repro)");
  undo(IA,rcfg,"5","thu","Barbell box squat","Dumbbell goblet squat",tag+" goblet LEGACY record (detail field deleted before undo)",true);}
console.log("DONE");
