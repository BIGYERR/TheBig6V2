// MEASURE v212 — Mode A. Mario: "Kettlebell swing" card, prescription line "8", set row "SETS 2 × 8 as prescribed",
// card has swap + minus buttons. Does HEAD produce a bare-number RENDERED prescription line, from which source?
// usage: node tests/measure/v220_bare_rx.js <html> [--lite]
// Oracle: a HAND classifier over the string that lands in <div class="ex-detail"> (rendered by buildSectionsHTML
// in the VM, parsed out of HTML) and over raw item.detail. "Structured" = contains ×/x between digits, reps, sec,
// min, each, RPE, yd/yards/meters/m, 'sets of', hold, max/amrap. Nothing is asked of parseRx/_stripLeadingSets.
const path=require("path");
const {load}=require(path.resolve(__dirname,"..","harness.js"));
const FILE=process.argv[2], LITE=process.argv.includes("--lite");
const P2I=process.argv.indexOf("--phase2"), P2=P2I>=0;
const IA=load(FILE); console.log("artifact",FILE,"ia-version",IA.version);
const V=n=>{try{return IA.eval(n);}catch(e){return null;}};
const swapCandidates=V("swapCandidates"), _swapDetailFor=V("_swapDetailFor"), addedDetailFor=V("addedDetailFor"), addCandidates=V("addCandidates");
const buildSectionsHTML=V("buildSectionsHTML");
const strip=s=>String(s||"").replace(/<svg[\s\S]*?<\/svg>\s*/g,"").replace(/<[^>]+>/g,"").replace(/&amp;/g,"&").trim();
const STRUCT=/\d\s*[×x]\s*\d|\breps?\b|\bsec\b|\bmin\b|\beach\b|\brpe\b|\byd\b|\byards?\b|\bmeters?\b|\d\s*m\b|\bsets?\s+of\b|\bhold\b|\bmax\b|amrap|\bmiles?\b|\bmi\b|\bseconds?\b|\bminutes?\b/i;
const bare=s=>{const t=strip(s); return t!==""&&!STRUCT.test(t);};
const shape=s=>strip(s).replace(/\d+/g,"N").slice(0,70);
function inc(o,k,n){o[k]=(o[k]||0)+(n||1);}
const R={builds:0,crash:0,renderFail:0}; const RAWOF={}, SWX=[];
const S={}; // source -> {n,bare,shapes:{},byName:{},ex:{}}
function rec(src,name,det,ctx){S[src]=S[src]||{n:0,bare:0,shapes:{},byName:{},byNameN:{},ex:{},ctx:{}}; const o=S[src]; o.n++; inc(o.byNameN,name);
  if(bare(det)){o.bare++; const sh=shape(det); inc(o.shapes,sh); inc(o.byName,name); if(!o.ex[sh])o.ex[sh]=ctx+" :: "+name+" :: "+JSON.stringify(strip(det)); } }
const GR={}; // grammar catalogue from engine raw details, keyed by section kind
function grammar(kind,name,det){const sh=shape(det); GR[kind]=GR[kind]||{}; if(!GR[kind][sh])GR[kind][sh]={n:0,ex:name+" :: "+strip(det)}; GR[kind][sh].n++;}
function secKind(s){const L=strip(s.label||""); if(s._added)return "added"; if(/^main/i.test(L))return "main"; if(/^primer/i.test(L))return "primer";
  if(s.superset||s.type==="superset")return "superset"; if(s.core)return "core"; if(s.hip)return "hip"; return "straight:"+(L.split(/[ —-]/)[0]||"");}
function renderDetails(secs){ if(!buildSectionsHTML) return null;
  IA.ctx.__S=JSON.parse(JSON.stringify(secs));
  let h; try{h=IA.eval("buildSectionsHTML(__S,0)");}catch(e){R.renderFail++; return null;}
  return h; }
function scan(prog,cfg,tag){
  const W=prog.weeks||{}; const pc=Object.assign({},prog,{cfg});
  IA.ctx.__P=pc; try{IA.eval("activeProg=__P; activeProgId='m';");}catch(e){}
  Object.keys(W).forEach(w=>Object.keys(W[w]).forEach(d=>{const day=W[w][d]; if(!day||day.rest||!Array.isArray(day.sections)) return;
    try{IA.eval("currentWeek="+JSON.stringify(w)+"; currentDayKey="+JSON.stringify(d)+";");}catch(e){}
    const ctx=tag+" W"+w+" "+d;
    // engine raw + grammar
    day.sections.forEach(s=>(s.items||[]).forEach(it=>{const nm=strip(it.name); if(!nm||/^\s*<svg/.test(it.name||""))return;
      rec("engine.raw",nm,it.detail,ctx+" ["+secKind(s)+"]"); grammar(secKind(s),nm,it.detail);}));
    // engine rendered: parse each section separately so the item order maps
    day.sections.forEach((s,si)=>{const h=renderDetails([s]); if(h==null)return;
      const blocks=h.split(/class="exercise-item/).slice(1);
      blocks.forEach(b=>{const nm=strip((b.match(/class="ex-name">([\s\S]*?)<\/span>/)||[])[1]); const dm=b.match(/class="ex-detail">([\s\S]*?)<\/div>/);
        if(!nm||!dm)return; const k=secKind(s);
        const hasSwap=/ex-swapbtn/.test(b), hasSkip=/ex-skipbtn/.test(b), added=/YOU ADDED THIS/.test(b);
        rec("engine.rendered",nm,dm[1],ctx+" ["+k+(hasSwap?" swap":"")+(hasSkip?" minus":"")+(added?" added":"")+"]");
        if(bare(dm[1])){inc(S["engine.rendered"].ctx,k+"|swap="+hasSwap+"|minus="+hasSkip+"|added="+added);
          const ri=(s.items||[]).find(x=>strip(x.name)===nm); const rs=ri?shape(ri.detail):"?"; inc(RAWOF,nm+" | raw "+JSON.stringify(rs)+" -> shown "+JSON.stringify(strip(dm[1])));
          if(/swing/i.test(nm)&&SWX.length<6)SWX.push(ctx+" ["+strip(s.label)+"] raw="+JSON.stringify(ri&&ri.detail)+" shown="+JSON.stringify(strip(dm[1]))+" swap="+hasSwap+" minus="+hasSkip);
          inc(S["engine.rendered"].ctx,"week="+w); tag.split("|").forEach(t=>inc(S["engine.rendered"].ctx,"cfg:"+t));}
      });});
    // swap path: every candidate for every item, raw and as rendered in its own section
    if(swapCandidates&&_swapDetailFor) day.sections.forEach((s,si)=>(s.items||[]).forEach((it,ii)=>{const nm=strip(it.name); let c=null;
      try{c=swapCandidates(it.name,day,w,pc);}catch(e){} if(!c)return;
      [].concat(c.tier1||[],c.tier2||[]).forEach(n=>{let nd; try{nd=_swapDetailFor(n,it.detail);}catch(e){return;}
        rec("swap.raw",n,nd,ctx+" "+nm+"->"+n+" ["+secKind(s)+"]");
        if(!LITE&&(s.superset||s.type==="superset")){ // rendered inside the round: strip happens there
          const s2=JSON.parse(JSON.stringify(s)); s2.items[ii].name=n; s2.items[ii].detail=nd; const h=renderDetails([s2]); if(h==null)return;
          const b=h.split(/class="exercise-item/)[ii+1]||""; const dm=b.match(/class="ex-detail">([\s\S]*?)<\/div>/); if(dm) rec("swap.rendered(superset)",n,dm[1],ctx+" "+nm+"->"+n);}
      });}));
    // add path: every add candidate
    if(addCandidates&&addedDetailFor&&_swapDetailFor){let ac=null; try{ac=addCandidates(day,w,pc);}catch(e){}
      const names=[]; (function walk(x){ if(!x)return; if(typeof x==="string"){names.push(x);return;} if(Array.isArray(x)){x.forEach(walk);return;}
        if(typeof x==="object"){ if(typeof x.name==="string"){names.push(x.name);return;} Object.values(x).forEach(walk);} })(ac);
      [...new Set(names)].forEach(n=>{let ad; try{ad=_swapDetailFor(n,addedDetailFor(day,n,w,pc));}catch(e){return;}
        rec("add.raw",n,ad,ctx+" +"+n);});}
  }));
}
const TIERS=["commercial","home_full","crossfit","home_basic","bodyweight","minimal"];
const FOCUS=["support_prevention","support_strength","hypertrophy","strength"];
const EXPS=LITE?["intermediate"]:["beginner","intermediate","advanced"];
const GOALS=[{k:"liftonly",id:null},{k:"pace",id:"run_pace_goal"},{k:"half",id:"run_half"}];
const INJ=[{k:"healthy",v:null}]; ["knee","lowback","shoulder","elbow","ankle","hip","other"].forEach(r=>["protect","workaround"].forEach(t=>INJ.push({k:r+"/"+t,v:{region:r,tier:t}})));
function mk(t,f,x,g,i,sd,travel){const isRace=!!g.id&&/half/.test(g.id);
  return {name:"M",primaryPath:g.id?(isRace?"event":"cardio"):"lift",cardioTypes:g.id?["run"]:[],
   cardioGoals:g.id?{run:{id:g.id,label:g.k,mileBestMins:"10",mileBestSecs:"30",baselineDist:"5",baseline:"5mi",targetDist:"1.5",targetMins:"11",targetSecs:"0"}}:{},
   eventTargeted:isRace,raceDate:isRace?"2026-12-06":null,liftingFocus:f,experience:x,ageBracket:"18-35",equipment:t,unit:"lbs",
   restDays:["sun","wed"],days:["sun","mon","tue","wed","thu","fri","sat"],bench:135,squat:155,deadlift:185,seed:sd,...(travel?{_travel:true}:{}),...(i.v?{injury:i.v}:{})};}
function run(cfg,tag){try{const p=IA.buildProgram(cfg); R.builds++; scan(p,cfg,tag);}catch(e){R.crash++; if(R.crash<4)console.log("CRASH",tag,e.message);}}
// 0. Repro: any Kettlebell swing rendered with a bare line, HALF_MANNY first.
const {fixtures}=require(path.resolve(__dirname,"..","harness.js"));
run(JSON.parse(JSON.stringify(fixtures.HALF_MANNY)),"HALF_MANNY");
const swEx=Object.entries(S["engine.rendered"]&&S["engine.rendered"].ex||{}).filter(([k,v])=>/swing/i.test(v));
console.log("\n== REPRO HALF_MANNY: bare rendered lines",S["engine.rendered"]?S["engine.rendered"].bare:0,"/",S["engine.rendered"]?S["engine.rendered"].n:0);
Object.entries(S["engine.rendered"]?S["engine.rendered"].ex:{}).slice(0,8).forEach(([k,v])=>console.log("   ",JSON.stringify(k),"e.g.",v));
for(const k in S) delete S[k]; R.builds=0;
if(!P2)for(const t of TIERS)for(const f of FOCUS)for(const x of EXPS)for(const g of GOALS)for(const i of INJ)
  run(mk(t,f,x,g,i,76308,false),[t,f,x,g.k,i.k].join("|"));
if(!P2)for(const t of ["home_basic","bodyweight"])for(const f of FOCUS)for(const x of EXPS)for(const g of GOALS)for(const i of INJ)
  run(mk(t,f,x,g,i,76308,true),["travel_"+t,f,x,g.k,i.k].join("|"));
console.log("\n== LATTICE builds",R.builds,"crashes",R.crash,"renderFail",R.renderFail);
for(const src of Object.keys(S)){const o=S[src]; console.log("\n## "+src+": bare",o.bare,"/",o.n,"("+(100*o.bare/Math.max(1,o.n)).toFixed(2)+"%)");
  console.log("  top shapes:"); Object.entries(o.shapes).sort((a,b)=>b[1]-a[1]).slice(0,10).forEach(([k,v])=>console.log("   ",v,JSON.stringify(k),"e.g.",o.ex[k]));
  console.log("  by movement (bare/total):"); Object.entries(o.byName).sort((a,b)=>b[1]-a[1]).slice(0,15).forEach(([k,v])=>console.log("   ",v+"/"+o.byNameN[k],k));
  if(Object.keys(o.ctx).length){console.log("  segments:"); Object.entries(o.ctx).sort((a,b)=>a[0]<b[0]?-1:1).forEach(([k,v])=>console.log("   ",k,v));}}
console.log("\n== GRAMMAR (engine raw) top 4 shapes per section kind");
Object.keys(GR).sort().forEach(k=>{console.log(" ["+k+"]"); Object.entries(GR[k]).sort((a,b)=>b[1].n-a[1].n).slice(0,4).forEach(([sh,v])=>console.log("   ",v.n,JSON.stringify(sh),"e.g.",v.ex));});
console.log("\n== bare RENDERED lines: movement | raw data shape -> shown (top 20)"); Object.entries(RAWOF).sort((a,b)=>b[1]-a[1]).slice(0,20).forEach(([k,v])=>console.log("   ",v,k));
console.log("\n== Kettlebell swing examples"); SWX.forEach(x=>console.log("   ",x));

// ════ PHASE 2 (P-BARERX, coach provisional ruling) — node v220_bare_rx.js <V207.html> --phase2 <surgery.html>
// Surgery copy = V207 with the _dispDetail line wrapped: remainder matching /^\d+(\s*[–-]\s*\d+)?$/ gets ' reps'.
// Oracle for "bare": the phase-1 hand classifier (STRUCT), NOT the ruling regex. Expected after = before+' reps'
// iff before is bare AND matches the ruling regex; otherwise byte-identical. Data: JSON of prog.weeks per build.
if(P2){
  const SURG=process.argv[P2I+1]; const H=require(path.resolve(__dirname,"..","harness.js"));
  const B=load(SURG); console.log("\n==== PHASE 2  base",IA.version,"surgery",SURG,"ia-version",B.version);
  const RULE=/^\d+(\s*[–-]\s*\d+)?$/;
  const rend=(X,secs)=>{X.ctx.__S=JSON.parse(JSON.stringify(secs)); return X.eval("buildSectionsHTML(__S,0)");};
  const cards=h=>h.split(/class="exercise-item/).slice(1).map(b=>({nm:strip((b.match(/class="ex-name">([\s\S]*?)<\/span>/)||[])[1]),
      det:(b.match(/class="ex-detail">([\s\S]*?)<\/div>/)||[null,null])[1]}));
  const setCtx=(X,pc,w,d)=>{X.ctx.__P=pc; X.eval("activeProg=__P; activeProgId='m'; currentWeek="+JSON.stringify(w)+"; currentDayKey="+JSON.stringify(d)+";");};
  const Q={builds:0,dataDiff:0,cards:0,ssCards:0,bare:0,bareSingle:0,bareRange:0,bareOutside:0,outsideEx:{},
    expectOK:0,expectBad:0,badEx:[],nonBareSS:0,nonBareSSchanged:0,nonSSchanged:0,rxCalls:0,rxDiff:0,sample:{},
    swapCards:0,swapBare:0,swapRange:0,swapOutside:0,swapOK:0,swapBad:0,swapEx:null};
  const MOV=["Mountain climbers","Kettlebell swing","Burpees","Ball slams","High knees","Prone Y-T-W raises","Reverse snow angels","Wall slides","Broad jumps","Jump squats","Skater bounds"];
  function judge(before,after,where,isSwap){
    const b=strip(before||""); const isBare=bare(before||"");
    if(isSwap){Q.swapCards++; if(isBare){Q.swapBare++; if(/[–-]/.test(b))Q.swapRange++; if(!RULE.test(b))Q.swapOutside++;}}
    else if(isBare){Q.bare++; if(RULE.test(b)){ if(/[–-]/.test(b))Q.bareRange++; else Q.bareSingle++; } else {Q.bareOutside++; inc(Q.outsideEx,JSON.stringify(b));}}
    const want=(isBare&&RULE.test(b))?before+" reps":before;
    const ok=after===want;
    if(isSwap){ok?Q.swapOK++:Q.swapBad++;} else {ok?Q.expectOK++:Q.expectBad++;}
    if(!ok&&Q.badEx.length<8)Q.badEx.push(where+" before="+JSON.stringify(before)+" after="+JSON.stringify(after)+" want="+JSON.stringify(want));
    return isBare;
  }
  function p2build(cfg,tag,doSwap){
    let pA,pB; try{pA=IA.buildProgram(cfg); pB=B.buildProgram(cfg);}catch(e){console.log("CRASH",tag,e.message); return;}
    Q.builds++; if(JSON.stringify(pA.weeks)!==JSON.stringify(pB.weeks))Q.dataDiff++;
    const pcA=Object.assign({},pA,{cfg}), pcB=Object.assign({},pB,{cfg});
    const rxA=IA.eval("parseRx"), rxB=B.eval("parseRx");
    Object.keys(pA.weeks).forEach(w=>Object.keys(pA.weeks[w]).forEach(d=>{const day=pA.weeks[w][d]; if(!day||day.rest||!Array.isArray(day.sections))return;
      setCtx(IA,pcA,w,d); setCtx(B,pcB,w,d);
      day.sections.forEach(s=>{const ss=!!(s.superset||s.type==="superset");
        (s.items||[]).forEach(it=>{Q.rxCalls++; if(JSON.stringify(rxA(it.detail,it.name))!==JSON.stringify(rxB(it.detail,it.name)))Q.rxDiff++;});
        const cA=cards(rend(IA,[s])), cB=cards(rend(B,[s]));
        cA.forEach((c,k)=>{if(c.det==null)return; Q.cards++; const after=cB[k]&&cB[k].det;
          if(!ss){ if(after!==c.det)Q.nonSSchanged++; return; }
          Q.ssCards++; const wasBare=judge(c.det,after,tag+" W"+w+" "+d+" ["+strip(s.label)+"] "+c.nm,false);
          if(!wasBare){Q.nonBareSS++; if(after!==c.det)Q.nonBareSSchanged++; const sh=shape(c.det); if(!Q.sample["nb:"+sh]&&Object.keys(Q.sample).filter(k=>k.startsWith("nb:")).length<6)Q.sample["nb:"+sh]=c.nm+" "+JSON.stringify(strip(c.det))+" -> "+JSON.stringify(strip(after));}
          else if(MOV.includes(c.nm)&&!Q.sample[c.nm])Q.sample[c.nm]=tag+" W"+w+" "+d+" ["+strip(s.label)+"] "+JSON.stringify(c.det)+" -> "+JSON.stringify(after);});
        if(doSwap&&ss)(s.items||[]).forEach((it,ii)=>{let c=null; try{c=swapCandidates(it.name,day,w,pcA);}catch(e){} if(!c)return;
          [].concat(c.tier1||[],c.tier2||[]).forEach(n=>{const nd=_swapDetailFor(n,it.detail); const s2=JSON.parse(JSON.stringify(s)); s2.items[ii].name=n; s2.items[ii].detail=nd;
            const a=cards(rend(IA,[s2]))[ii], b=cards(rend(B,[s2]))[ii]; if(!a||a.det==null)return;
            const wb=judge(a.det,b&&b.det,tag+" W"+w+" "+d+" swap "+strip(it.name)+"->"+n,true);
            if(wb&&!Q.swapEx)Q.swapEx=tag+" W"+w+" "+d+" ["+strip(s.label)+"] "+strip(it.name)+" -> "+n+" data="+JSON.stringify(nd)+" "+JSON.stringify(a.det)+" -> "+JSON.stringify(b&&b.det);});});
      });}));
  }
  const MANNY=JSON.parse(JSON.stringify(H.fixtures.HALF_MANNY)); const pm=IA.buildProgram(MANNY), pmB=B.buildProgram(MANNY);
  console.log("HALF_MANNY progDigest base",H.progDigest(pm),"surgery",H.progDigest(pmB),"MANNY_DIGEST_BY_VERSION[207]",(H.MANNY_DIGEST_BY_VERSION||{})[207]);
  ["5","6"].forEach(w=>["tue","thu"].forEach(d=>{const day=pm.weeks[w][d]; if(!day||!day.sections)return; setCtx(IA,Object.assign({},pm,{cfg:MANNY}),w,d); setCtx(B,Object.assign({},pmB,{cfg:MANNY}),w,d);
    day.sections.filter(s=>s.superset||s.type==="superset").forEach(s=>{const a=cards(rend(IA,[s])), b=cards(rend(B,[s]));
      console.log("  W"+w+" "+d+" ["+strip(s.label)+"] rounds="+s.rounds); s.items.forEach((it,k)=>console.log("     ",it.name,"| data",JSON.stringify(it.detail),"| V207 shows",JSON.stringify(a[k]&&a[k].det),"| surgery",JSON.stringify(b[k]&&b[k].det)));});}));
  p2build(MANNY,"HALF_MANNY",true);
  for(const t of TIERS)for(const f of FOCUS)for(const x of ["beginner","intermediate","advanced"])for(const g of GOALS)for(const i of INJ)
    p2build(mk(t,f,x,g,i,76308,false),[t,f,x,g.k,i.k].join("|"),x==="intermediate"&&(t==="bodyweight"||t==="commercial")&&i.k==="healthy");
  for(const t of ["home_basic","bodyweight"])for(const f of FOCUS)for(const x of ["beginner","intermediate","advanced"])for(const g of GOALS)for(const i of INJ)
    p2build(mk(t,f,x,g,i,76308,true),["travel_"+t,f,x,g.k,i.k].join("|"),false);
  const {sample,outsideEx,badEx,swapEx,...rest}=Q; console.log("PHASE2 counts",JSON.stringify(rest));
  console.log("bare outside ruling regex:",JSON.stringify(outsideEx)); console.log("mismatches:",badEx);
  console.log("samples:"); Object.entries(sample).forEach(([k,v])=>console.log("   ",k,"::",v)); console.log("swap sample:",swapEx);
}
