'use strict';
// V208 D140 follow-up (read-only): on NRC long-run days, which items does CF_A (F1+F2) ADD that base
// did not deal, and in what section label do carry-named items ride? Reuses <dir>/base.html and
// <dir>/cfA.html written by v208_d140_nrc_sweep.js. usage: node ... <dir>
const fs=require('fs'), path=require('path'), H=require(path.join(__dirname,'..','harness.js'));
const S=process.argv[2]; const B=H.load(path.join(S,'base.html')), A=H.load(path.join(S,'cfA.html'));
const cl=o=>JSON.parse(JSON.stringify(o)), P=(...a)=>console.log(...a), bump=(o,k)=>o[k]=(o[k]||0)+1;
const mins=d=>!d?0:d.k==='time'?(+d.mins||0):(+d.mi||0)*(+d.tgt||0)/60;
const isNrcLong=c=>!!(c&&c.isNRC&&c.dose&&/^long run/i.test(c.subtype||'')&&!/race day|time trial/i.test(c.subtype||''));
const tier=c=>{const m=mins(c.dose); if(/rehearsal/i.test(c.detail||'')) return 'A'; return m>=75?'A':m>=45?'B':'C';};
const PLANS=['run_5k','run_10k','run_half','run_marathon'], EXP=['beginner','intermediate','advanced'], AGE=['18-35','36-54','55+'];
const RESTS=[['sun','wed'],['sat','sun'],['sun'],['mon','wed','fri'],['tue','thu','sun']], EQ=['crossfit','commercial','home_full','home_basic','bodyweight'];
const FOC=['balanced','hypertrophy','strength','support_athletic','support_prevention','support_strength'];
const added={}, carryLbl={base:{},cfA:{}}, carryLong={base:{},cfA:{}}, addDays={n:0}; let cfgN=0, longDays={};
let i=0;
for(const plan of PLANS) for(const e of EXP) for(const a of AGE) for(const r of RESTS) for(const q of EQ) for(const f of FOC) for(const dated of [true,false]){ i++;
  const c=Object.assign(cl(H.fixtures.HALF_MANNY),{cardioGoals:{run:{id:plan,label:plan,mileBestMins:['7','8','10','12'][i%4],mileBestSecs:'0',baselineDist:'5',baseline:'5mi'}},
    primaryPath:dated?'event':'fitness',eventTargeted:dated,raceDate:dated?['2026-12-06','2027-01-17','2027-03-28'][i%3]:'',startDate:'2026-09-21',experience:e,ageBracket:a,restDays:r.slice(),equipment:q,liftingFocus:f,seed:76308});
  cfgN++; const pb=B.buildProgram(cl(c)), pa=A.buildProgram(cl(c));
  for(let w=1;w<=pb.totalWeeks;w++) H.DAYS.forEach(d=>{ const y=pb.weeks[w][d], z=pa.weeks[w][d]; if(!y||!isNrcLong(y.cardio)) return; const t=tier(y.cardio); bump(longDays,t);
    for(const [k,day] of [['base',y],['cfA',z]]){ let any=false; (day.sections||[]).forEach(s=>(s.items||[]).forEach(it=>{ if(/carry/i.test(it.name||'')){ any=true; bump(carryLbl[k],'tier '+t+' label "'+(s.label||'')+'"'); } })); if(any) bump(carryLong[k],'tier '+t); }
    const bn=new Set(); (y.sections||[]).forEach(s=>(s.items||[]).forEach(it=>bn.add((s.label||'')+'|'+it.name)));
    let ad=false; (z.sections||[]).forEach(s=>(s.items||[]).forEach(it=>{ if(!bn.has((s.label||'')+'|'+it.name)){ ad=true; bump(added,'tier '+t+' ['+(s.label||'')+'] '+it.name); } })); if(ad) addDays.n++; }); }
P('NRC solo lattice: '+cfgN+' configs (4 plans × 3 exp × 3 age × 5 rest × 5 equip × 6 focus × 2 dated/undated, seed 76308) | long-run days by hand tier',JSON.stringify(longDays));
P('long-run days carrying a carry-NAMED item: base',JSON.stringify(carryLong.base),' CF_A',JSON.stringify(carryLong.cfA));
P('carry items by tier and section label, base:'); Object.entries(carryLbl.base).sort((a,b)=>b[1]-a[1]).forEach(([k,v])=>P('  '+String(v).padStart(6)+' '+k));
P('carry items by tier and section label, CF_A:'); Object.entries(carryLbl.cfA).sort((a,b)=>b[1]-a[1]).forEach(([k,v])=>P('  '+String(v).padStart(6)+' '+k));
P('long-run days where CF_A deals an item base did not:',addDays.n); Object.entries(added).sort((a,b)=>b[1]-a[1]).forEach(([k,v])=>P('  '+String(v).padStart(6)+' '+k));
P('DONE');
