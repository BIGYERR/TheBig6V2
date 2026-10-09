// MEASURE v212 (provisional) — which stored days does refreshProgram KEEP vs REBUILD?
// usage: node tests/measure/v212_stored_grid_freeze.js <html>
// Method: plant a unique sentinel item on chosen stored days, set touch stores, run refreshProgram,
// report whether the sentinel survives. "Today" is moved by moving startDate back k weeks
// (curWk = floor((today - Monday(startDate))/7)+1, the formula at refreshProgram's date cut).
// Oracle: sentinel presence (a string the engine cannot emit), not any engine predicate.
const path=require("path");
const {load,fixtures}=require(path.resolve(__dirname,"..","harness.js"));
const IA=load(process.argv[2]); console.log("artifact ia-version",IA.version);
const LS=IA.localStorage, refresh=IA.eval("refreshProgram");
let total=0, kept=0; const tally={};
function run(curWk,label,touchCur){
  const id="frz_"+curWk+"_"+label; const prog=JSON.parse(JSON.stringify(IA.buildProgram(fixtures.HALF_MANNY)));
  prog.id=id; prog.cfg=JSON.parse(JSON.stringify(fixtures.HALF_MANNY)); prog.seed=prog.cfg.seed;
  const mon=new Date(); mon.setHours(0,0,0,0); mon.setDate(mon.getDate()-((mon.getDay()+6)%7)-7*(curWk-1));
  prog.startDate=mon.getFullYear()+"-"+String(mon.getMonth()+1).padStart(2,"0")+"-"+String(mon.getDate()).padStart(2,"0");
  const tw=Object.keys(prog.weeks).length;
  const train=w=>Object.keys(prog.weeks[w]).filter(d=>!prog.weeks[w][d].rest);
  const cases=[]; const add=(tag,w,d,kind)=>{ if(w<1||w>tw||!d) return; cases.push({tag,w,d,kind}); };
  const cd=train(curWk);
  add("a past-week untrained",curWk-1,train(curWk-1>=1?curWk-1:1)[0],"none");
  add("a2 past-week hist-only",curWk-1,train(curWk-1>=1?curWk-1:1)[1],"hist");
  if(touchCur){ add("b cur trained (comp)",curWk,cd[0],"comp"); add("b2 cur trained (hist snap)",curWk,cd[1],"hist"); }
  add("c cur untrained",curWk,cd[2],"none");
  add("d next week",curWk+1,train(Math.min(tw,curWk+1))[0],"none");
  add("e +4 weeks",curWk+4,train(Math.min(tw,curWk+4))[0],"none");
  const comp={}, hist={};
  cases.forEach(c=>{ const S="SENTINEL_"+c.w+"_"+c.d;
    prog.weeks[c.w][c.d].sections=(prog.weeks[c.w][c.d].sections||[]).concat([{label:"x",items:[{name:S,detail:"3×25 sec"}]}]);
    if(c.kind==="comp") comp["w"+c.w+"_"+c.d]=true;
    if(c.kind==="hist") hist["w"+c.w+"_"+c.d]=JSON.parse(JSON.stringify(prog.weeks[c.w][c.d])); });
  LS.setItem("ia_comp_"+id,JSON.stringify(comp)); LS.setItem("ia_hist_"+id,JSON.stringify(hist));
  const out=refresh(prog);
  cases.forEach(c=>{ const S="SENTINEL_"+c.w+"_"+c.d; const k=JSON.stringify((out.weeks[c.w]||{})[c.d]||{}).includes(S);
    total++; if(k) kept++; const T=c.tag.split(" ")[0]; tally[T]=tally[T]||[0,0]; tally[T][1]++; if(k) tally[T][0]++;
    console.log("curWk="+curWk+" "+label+" | "+c.tag+" W"+c.w+" "+c.d+" -> "+(k?"KEPT (stored)":"REBUILT (live)")); });
}
for(const cw of [2,4,7]){ run(cw,"curTouched",true); run(cw,"curUntouched",false); }
console.log("\nSUMMARY kept",kept,"/",total); Object.entries(tally).forEach(([k,v])=>console.log("  case",k,"kept",v[0],"/",v[1]));
const p=IA.buildProgram(fixtures.HALF_MANNY);
console.log("PROGRAM top-level keys:",Object.keys(p).filter(k=>k!=="weeks").join(","));
console.log("  created",p.created,"| startDate",p.startDate,"| blockOpen",p.blockOpen,"| version-like",Object.keys(p).filter(k=>/ver|built|engine/i.test(k)).join(",")||"(none)");
console.log("DONE");
