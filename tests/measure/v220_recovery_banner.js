// v220_recovery_banner.js — measure (Mode A/B): the week-view "Recovery spacing" banner.
// Which text sources feed prog.legRecoveryNote, how often it renders, split by goal family.
// Oracle for "shows": the render predicate at the week view is `if(activeProg.legRecoveryNote)`
// (truthy); text classification is by literal sentence match against the source strings.
// usage: node tests/measure/v220_recovery_banner.js <html>
"use strict";
const H = require("/Users/CanasBangin/Desktop/TheBig6V2/tests/harness.js");
const IA = H.load(process.argv[2]);
const clone = v => JSON.parse(JSON.stringify(v));
const mb = {mileBestMins:"8", mileBestSecs:"15", mileBestSrc:{kind:"entered"}};
const GOALS = [
  {k:"pace", fam:"NSW test", types:["run"], goals:{run:{id:"run_pace_goal", ...mb, targetDist:"1.5", targetMins:"11", targetSecs:"0", paceUnit:"mi"}}},
  {k:"mile", fam:"NSW test", types:["run"], goals:{run:{id:"run_mile_time", ...mb, targetDist:"1", targetMins:"7", targetSecs:"0", paceUnit:"mi"}}},
  {k:"u10",  fam:"NSW test", types:["run"], goals:{run:{id:"run_15_under10", ...mb, targetDist:"1.5", targetMins:"9", targetSecs:"59", paceUnit:"mi"}}},
  {k:"base", fam:"run_base", types:["run"], goals:{run:{id:"run_base", ...mb}}},
  {k:"5k",   fam:"NRC race", types:["run"], goals:{run:{id:"run_5k", ...mb}}},
  {k:"10k",  fam:"NRC race", types:["run"], goals:{run:{id:"run_10k", ...mb}}},
  {k:"half", fam:"NRC race", types:["run"], goals:{run:{id:"run_half", ...mb, baselineDist:"5", baseline:"5mi"}}},
  {k:"mara", fam:"NRC race", types:["run"], goals:{run:{id:"run_marathon", ...mb, baselineDist:"8", baseline:"8mi"}}},
  {k:"bike", fam:"bike/swim", types:["bike"], goals:{bike:{id:"bike_base"}}},
  {k:"swim", fam:"bike/swim", types:["swim"], goals:{swim:{id:"swim_base"}}},
  {k:"lift", fam:"lift-only", types:[], goals:{}, over:{primaryPath:"body"}},
];
const FOCUS = ["balanced","strength","support_prevention"];
const EXP = ["beginner","intermediate","advanced"];
const EQUIP = ["home_full","commercial","bodyweight"];
const RESTS = [["sun","wed"],["sat","sun"],["mon","thu","sun"],["sun"],["wed","sat","sun"]];
const SEEDS = [24865, 76308];
// sentence catalogue: literal text from the source lines (independent of which branch emitted it)
const S = {
  "D36nrc":  "Your hinge day rides a speed session so hard days stay hard.",
  "D36base": "Nothing heavy lands on your long run or the day before it.",
  "leg1":    "Your heavy lifting was spaced out from your hardest runs",
  "leg2":    "Your heavy lifting was kept off the same day as your hardest runs",
  "leg3":    "heavy lifting and your hardest runs still fall close together",
  "regOK":   "Your same-region lifting days were spaced out",
  "regStuck":"some same-region lifting still lands on back-to-back days",
};
const R = {}; const inc = (o,k)=>{o[k]=(o[k]||0)+1;};
const bump = (key, sub) => { R[key] = R[key] || {n:0, shown:0, crash:0, combos:{}}; return R[key]; };
let N=0, SHOWN=0, CRASH=0, MARIO=0, dashEm=0, dashSp=0; const leak = {};
for(const G of GOALS) for(const f of FOCUS) for(const e of EXP) for(const q of EQUIP) for(const rs of RESTS) for(const seed of SEEDS){
  const cfg = Object.assign({name:"M", primaryPath:"event", eventTargeted:false, raceDate:"", cardioTypes:G.types.slice(), cardioGoals:clone(G.goals),
    liftingFocus:f, experience:e, ageBracket:"18-35", equipment:q, unit:"lbs", restDays:rs.slice(), days:["sun","mon","tue","wed","thu","fri","sat"],
    bench:185, squat:255, deadlift:315, seed}, G.over||{});
  const cells = [bump(G.fam), bump("goal:"+G.k), bump("focus:"+f), bump("rest:"+rs.join("/"))];
  let p; N++; cells.forEach(c=>c.n++);
  try { p = IA.buildProgram(cfg); } catch(err){ CRASH++; cells.forEach(c=>c.crash++); continue; }
  const n = p.legRecoveryNote;
  const tags = n ? Object.keys(S).filter(k => n.indexOf(S[k])>=0) : [];
  const combo = n ? (tags.join("+") || "UNCLASSIFIED:"+n.slice(0,60)) : "none";
  cells.forEach(c=>{ inc(c.combos, combo); if(n) c.shown++; });
  if(n){ SHOWN++; if(n.indexOf("—")>=0) dashEm++; if(/ - /.test(n)) dashSp++; if(tags.includes("leg1") && tags.includes("regOK")) MARIO++; }
  // is the placement explained anywhere else in the built program? scan every string outside legRecoveryNote
  const q2 = Object.assign({}, p); delete q2.legRecoveryNote; delete q2.cfg;
  const txt = JSON.stringify(q2);
  for(const k of ["spaced out","placed around","48 hours","hard days stay hard","same muscles","back-to-back","day before your long run"]) if(txt.indexOf(k)>=0) inc(leak, k);
}
if(N===0) throw new Error("no builds");
console.log("builds", N, "crash", CRASH, "banner shown", SHOWN, "("+(100*SHOWN/(N-CRASH)).toFixed(1)+"%)");
console.log("Mario text (leg tier1 + region spaced):", MARIO, "/", N-CRASH);
console.log("shown notes with em-dash:", dashEm, "/", SHOWN, " with spaced hyphen:", dashSp, "/", SHOWN);
for(const k of Object.keys(R)) console.log(k.padEnd(22), "n", String(R[k].n).padStart(4), "shown", String(R[k].shown).padStart(4), "crash", R[k].crash, JSON.stringify(R[k].combos));
console.log("placement phrases found elsewhere in built program (builds containing):", JSON.stringify(leak));
const hm = IA.buildProgram(clone(H.fixtures.HALF_MANNY));
console.log("HALF_MANNY legRecoveryNote:", JSON.stringify(hm.legRecoveryNote));
