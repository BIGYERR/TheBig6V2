// V206 measure (Mode B) — D137 segmentation follow-up to v206_d137_runbase_chi.js.
//   node tests/measure/v206_d137_runbase_seg.js <v205.html> <v204.html>
// Q: (a) of the tw>=13 run-only configs, which print NO Steady card at w>=13, and why (what is
// on the run days instead); (b) multi-sport: which run subtypes print at w>=13 on run_base, and
// does any Steady card print at all; (c) V204 configs that did NOT climb W12->W13.
'use strict';
const path=require('path');
const {load,fixtures}=require(path.join(__dirname,'..','harness.js'));
const [A205,A204]=process.argv.slice(2);
const IA5=load(A205), IA4=load(A204); const P=(...a)=>console.log(...a);
P('ia',IA5.version,IA4.version);
function mkCfg(o){ const g={id:'run_base',label:'Build Running Base'}; if(o.b!==null){g.baselineDist=String(o.b);g.baseline=o.b+'mi';}
  const goals={run:g}; if(o.swim) goals.swim={id:o.swim,label:o.swim}; if(o.bike) goals.bike={id:o.bike,label:o.bike};
  return Object.assign({},fixtures.HALF_MANNY,{name:'RB',primaryPath:'fitness',cardioTypes:o.types,cardioGoals:goals,eventTargeted:o.evt,raceDate:o.evt?'2027-06-01':'',experience:o.exp,ageBracket:o.age,restDays:o.rest||['sun','wed'],seed:76308}); }
function runCards(ia,cfg){ const p=ia.buildProgram(cfg); const out=[]; Object.keys(p.weeks).forEach(wk=>Object.keys(p.weeks[wk]).forEach(d=>{const day=p.weeks[wk][d]; const cs=day&&day.cardio?(Array.isArray(day.cardio)?day.cardio:[day.cardio]):[]; cs.forEach(c=>out.push({wk:+wk,type:c.type,st:String(c.subtype||''),det:String(c.detail||'')}));})); return {tw:p.totalWeeks,cards:out,p}; }
const EXPS=['beginner','intermediate','advanced'], AGES=['18-35','36-54','55+']; const BASE=[null]; for(let x=0;x<=100;x++) BASE.push(+(x/10).toFixed(1));
const segA={}; const noCardEg={}; const stTally={};
let v4n=0; const v4bad=[];
for(const exp of EXPS) for(const age of AGES) for(const b of BASE) for(const evt of [true,false]){
  const cfg=mkCfg({types:['run'],b,evt,exp,age}); const r=runCards(IA5,cfg); if(r.tw<13) continue;
  const st13=r.cards.filter(c=>c.wk>=13&&/^Steady Aerobic/.test(c.st)).length;
  const stAll=r.cards.filter(c=>/^Steady Aerobic/.test(c.st)).length;
  const k=`${exp} evt=${evt}`; segA[k]=segA[k]||{n:0,withSteady13:0,withSteadyAny:0,tw:{}}; segA[k].n++; if(st13) segA[k].withSteady13++; if(stAll) segA[k].withSteadyAny++; segA[k].tw[r.tw]=(segA[k].tw[r.tw]||0)+1;
  if(!st13){ const t=r.cards.filter(c=>c.wk===13&&c.type==='run').map(c=>c.st).join(' + '); stTally[exp+': '+t]=(stTally[exp+': '+t]||0)+1; }
  // V204
  const r4=runCards(IA4,cfg); const g=(rr,w)=>{const c=rr.cards.find(c=>c.wk===w&&/^Steady Aerobic/.test(c.st)); const m=c&&c.det.match(/^(\d+) min/); return m?+m[1]:null;};
  const a=g(r4,12), bb=g(r4,13); if(a!=null&&bb!=null){ v4n++; if(bb<a) v4bad.push(`${exp}|${age}|${b}|${evt} tw=${r4.tw} V204 W11..W${r4.tw}: `+Array.from({length:r4.tw-10},(_,i)=>g(r4,11+i)).join(' ')); }
}
P('\n(a) run-only tw>=13 by exp x evt: '+JSON.stringify(segA,null,0));
P('    week-13 run subtypes where no Steady card prints at w>=13:'); Object.entries(stTally).forEach(([k,v])=>P('     '+v+'  '+k));
P(`\n(c) V204 W13 < W12 on ${v4bad.length}/${v4n}; first 4:`); v4bad.slice(0,4).forEach(x=>P('    '+x));
// (b) multi-sport
const SW=['swim_tri','swim_mile','swim_100_time','swim_500_time','swim_base'], BK=['bike_century','bike_50','bike_ftp','bike_cals','bike_base'];
const combos=[]; SW.forEach(s=>combos.push({types:['run','swim'],swim:s})); BK.forEach(k=>combos.push({types:['run','bike'],bike:k})); SW.forEach(s=>BK.forEach(k=>combos.push({types:['run','swim','bike'],swim:s,bike:k})));
let n=0, ge13=0, anySteady=0; const sub13={}, perWeekRuns={};
for(const c of combos) for(const exp of EXPS) for(const age of AGES) for(const b of [null,0,0.5,1,2,3,5]) for(const evt of [true,false]){
  const r=runCards(IA5,mkCfg(Object.assign({b,evt,exp,age},c))); n++;
  if(r.cards.some(x=>/^Steady Aerobic/.test(x.st))) anySteady++;
  if(r.tw<13) continue; ge13++;
  const k=r.cards.filter(x=>x.wk>=13&&x.type==='run').map(x=>x.st.replace(/ — .*/,'')); new Set(k).forEach(s=>sub13[s]=(sub13[s]||0)+1);
  const rw=r.cards.filter(x=>x.wk===13&&x.type==='run').length; perWeekRuns[rw]=(perWeekRuns[rw]||0)+1;
}
P(`\n(b) multi-sport: ${n} configs; any Steady card anywhere: ${anySteady}/${n}; tw>=13: ${ge13}`);
P('    run subtypes printed at w>=13 (configs carrying each): '+JSON.stringify(sub13));
P('    run sessions in week 13 (configs): '+JSON.stringify(perWeekRuns));
