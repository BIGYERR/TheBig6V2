// MEASURE v212 (provisional) — is stored prog.weeks ever rewritten, and what does a PAST UNTRAINED day show?
// usage: node tests/measure/v212_stored_grid_rewrite.js <base.html> <scratch-dir>
// Engine A = base. Engine B = source-surgery scratch copy (knee_stability pool entry renamed).
// CREATION content = A's build plus a planted sentinel, standing for "the creation-day build".
// Oracle: string presence of three distinguishable markers, not any engine predicate.
const path=require("path"),fs=require("fs");
const {load,fixtures}=require(path.resolve(__dirname,"..","harness.js"));
const BASE=process.argv[2], DIR=process.argv[3];
const src=fs.readFileSync(BASE,"utf8");
const ANCH="knee_stability:['Spanish squat hold (KB)',";
const cnt=src.split(ANCH).length-1; console.log("surgery anchor count",cnt); if(cnt!==1){console.log("NOT-APPLIED");process.exit(1);}
const bPath=path.join(DIR,"engineB.html"); fs.writeFileSync(bPath,src.replace(ANCH,"knee_stability:['SPANISH_B hold (KB)',"));
const A=load(BASE), B=load(bPath);
const mondayBack=k=>{const m=new Date();m.setHours(0,0,0,0);m.setDate(m.getDate()-((m.getDay()+6)%7)-7*k);return m.getFullYear()+"-"+String(m.getMonth()+1).padStart(2,"0")+"-"+String(m.getDate()).padStart(2,"0");};
const clone=o=>JSON.parse(JSON.stringify(o));
function refreshAt(IA,stored,curWk,id){const p=clone(stored);p.id=id;p.startDate=curWk==null?null:mondayBack(curWk-1);
  IA.localStorage.setItem("ia_comp_"+id,"{}");IA.localStorage.setItem("ia_hist_"+id,"{}");return IA.eval("refreshProgram")(p);}
const cls=day=>{const s=JSON.stringify(day||{});return s.includes("CREATION_SENTINEL")?"CREATION":s.includes("SPANISH_B")?"B-live":s.includes("Spanish squat hold (KB)")?"A-live(saw)":"other";};
// stored program built by engine A, with a creation sentinel on every non-rest day
const stored=clone(A.buildProgram(fixtures.HALF_MANNY)); stored.cfg=clone(fixtures.HALF_MANNY); stored.seed=stored.cfg.seed;
Object.keys(stored.weeks).forEach(w=>Object.keys(stored.weeks[w]).forEach(d=>{const x=stored.weeks[w][d];if(!x.rest)x.sections=(x.sections||[]).concat([{label:"x",items:[{name:"CREATION_SENTINEL",detail:"1×1"}]}]);}));
const NW=Object.keys(stored.weeks).length;
let W0=null; for(let w=2;w<=NW-2&&W0==null;w++){ if(Object.keys(stored.weeks[w]).some(d=>JSON.stringify(stored.weeks[w][d]).includes("Spanish squat hold (KB)"))) W0=w; }
const W1=W0+2;
const wk3=Object.keys(stored.weeks[W0]).filter(d=>JSON.stringify(stored.weeks[W0][d]).includes("Spanish squat hold (KB)"));
console.log("probe week W"+W0+", days carrying the knee_stability marker:",wk3.join(",")||"(none)","| later today = W"+W1);
const s1=refreshAt(A,stored,W0,"s1"); console.log("STEP1 today=W"+W0+" engine A: shown as",wk3.map(d=>d+"="+cls(s1.weeks[W0][d])).join(" "));
const s2=refreshAt(B,stored,W1,"s2"); console.log("STEP2 today=W"+W1+" engine B, stored=creation, never trained: W"+W0+" shows",wk3.map(d=>d+"="+cls(s2.weeks[W0][d])).join(" "));
const stored3=clone(stored); stored3.weeks=clone(s1.weeks);
const s3=refreshAt(B,stored3,W1,"s3"); console.log("STEP3 same, but stored grid rewritten at STEP1 by a full-object saver: W"+W0+" shows",wk3.map(d=>d+"="+cls(s3.weeks[W0][d])).join(" "));
// 4. tallies over every non-rest past day at today=W5, engine B, stored=creation
const tally={}; Object.keys(s2.weeks).forEach(w=>Object.keys(s2.weeks[w]).forEach(d=>{const x=s2.weeks[w][d];if(!x||x.rest)return;const k=(+w<5?"past":+w===5?"current":"future")+":"+(JSON.stringify(x).includes("CREATION_SENTINEL")?"creation":"live");tally[k]=(tally[k]||0)+1;}));
console.log("STEP4 today=W5 engine B, all non-rest days:",JSON.stringify(tally));
// 5. startDate == null
const s5=refreshAt(B,stored,null,"s5"); const t5={};
Object.keys(s5.weeks).forEach(w=>Object.keys(s5.weeks[w]).forEach(d=>{const x=s5.weeks[w][d];if(!x||x.rest)return;const k=JSON.stringify(x).includes("CREATION_SENTINEL")?"creation":"live";t5[k]=(t5[k]||0)+1;}));
console.log("STEP5 startDate=null engine B, all non-rest days:",JSON.stringify(t5));
console.log("DONE");
