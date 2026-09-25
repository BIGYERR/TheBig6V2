// v212 measure: verify coach P-POPCOND claim 1 (HALF_MANNY training weekdays; Sunday = race day = season fire?)
// Usage: node tests/measure/v220_popcond_verify.js <artifact.html>
// Oracle: weekday from date arithmetic on prog.startDate (independent JS Date), race day from cfg.raceDate.
const path=require("path"); const H=require(path.join(__dirname,"..","harness.js"));
const IA=H.load(process.argv[2]); console.log("ia-version",IA.version);
const cfg=JSON.parse(JSON.stringify(H.fixtures.HALF_MANNY)); const prog=IA.buildProgram(cfg);
if(!prog.startDate){ const al=IA.eval('raceAlignment("run_half","2026-12-06",true,"2026-08-01")'); console.log("raceAlignment",JSON.stringify(al)); prog.startDate=al.start; }
console.log("startDate",prog.startDate,"totalWeeks",prog.totalWeeks,"raceDate",cfg.raceDate);
const ORD=["mon","tue","wed","thu","fri","sat","sun"]; const off={mon:0,tue:1,wed:2,thu:3,fri:4,sat:5,sun:6};
const [y,m,d]=prog.startDate.split("-").map(Number); const s0=new Date(Date.UTC(y,m-1,d)); const sdow=s0.getUTCDay(); // 1=Mon
const mon0=new Date(s0); mon0.setUTCDate(mon0.getUTCDate()-((sdow+6)%7));
const cnt={}, cntInBlock={}; const sundays=[]; let last=null;
for(let w=1;w<=prog.totalWeeks;w++){ const wk=prog.weeks[w]; for(const k of ORD){ const day=wk&&wk[k]; if(!day||day.rest) continue;
  const dt=new Date(mon0); dt.setUTCDate(dt.getUTCDate()+(w-1)*7+off[k]); const iso=dt.toISOString().slice(0,10);
  cnt[k]=(cnt[k]||0)+1; if(iso<prog.startDate) continue; cntInBlock[k]=(cntInBlock[k]||0)+1;
  const lbl=(day.label||day.title||day.name||"")+" | "+(day.subtype||day.cardio?.subtype||"");
  if(k==="sun") sundays.push([w,iso,lbl]); if(!last||iso>last[1]) last=[w,iso,k,lbl]; }}
console.log("non-rest by weekday (all):",JSON.stringify(cnt)); console.log("non-rest by weekday (on/after startDate):",JSON.stringify(cntInBlock));
console.log("sunday entries:",JSON.stringify(sundays)); console.log("last dated non-rest day:",JSON.stringify(last), "== raceDate?", last&&last[1]===cfg.raceDate);
// engine view: finalScheduledDay() in the VM
IA.ctx.__P=prog; IA.eval("activeProg=globalThis.__P; activeProgId=\"m\";");
const f=IA.eval("finalScheduledDay()"); console.log("engine finalScheduledDay:",f&&f.week,f&&f.d,f&&f.date&&f.date.toString());
const sd=IA.eval("scheduledDays()"); const byDow={}; sd.forEach(x=>{byDow[x.d]=(byDow[x.d]||0)+1}); console.log("engine scheduledDays n",sd.length,"by weekday",JSON.stringify(byDow));
// claim-1 follow-up: weekend is read off the wall clock at fire time. Mark Saturday wk1 (2026-09-05) on Sunday 2026-09-06 10:00.
const RD=Date; const NOW=new RD(2026,8,6,10,0).getTime();
class FD extends RD{ constructor(...a){ if(a.length===0) super(NOW); else super(...a);} static now(){return NOW;} }
IA.ctx.Date=FD; const pc=IA.eval("popContext()"); console.log("popContext() at Sun 2026-09-06 10:00 (marking any day, e.g. wk1 sat):",JSON.stringify(pc));
const f2=IA.eval("finalScheduledDay()"); console.log("wk1 sat is final day?", f2.week===1&&f2.d==="sat");
