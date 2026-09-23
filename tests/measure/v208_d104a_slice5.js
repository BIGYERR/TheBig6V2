// V208 slice 5 (D104a) before/after. Read-only. Usage: node v208_d104a_slice5.js <pre.html> <post.html>
// (A) the run_base hard-days lattice of v208_remeasure_on_v207.js section (a), verbatim cfgs, with the
//     v208_d104_hard_days.js classifier made rename-aware: "(SI)" is the INT, "(LI)" the CHI, checked
//     BEFORE the LSD test (a bare /Long/ would otherwise read "Long Interval (LI)" as the long run).
//     Oracle: card content (subtype, minutes) + calendar adjacency by index (Sat w -> Sun w -> Mon w+1).
// (B) dated pace/mile programs, the remeasure (b) lattice: every role grid and note pre vs post, and
//     the test-in-week-1 class printed program by program (role grid + note), summarised by class.
//     T-1/T-2 lift sections by date arithmetic from START.
// (C) undated pace/mile and NRC programs: progDigest pre == post.
const path=require('path');
const H=require(path.join(__dirname,'..','harness.js'));
const [PRE,POST]=process.argv.slice(2);
const A=H.load(PRE), B=H.load(POST);
const P=s=>console.log(s);
P('pre '+PRE+' ia-version '+A.version+' | post '+POST+' ia-version '+B.version);
const ISO=['mon','tue','wed','thu','fri','sat','sun'], ALL=['sun','mon','tue','wed','thu','fri','sat'];
const clone=o=>JSON.parse(JSON.stringify(o));
const stripSvg=n=>String(n||'').replace(/<svg[\s\S]*?<\/svg>\s*/g,'');
const cardios=day=>(!day||!day.cardio)?[]:(Array.isArray(day.cardio)?day.cardio:[day.cardio]);
const LOWER_MAIN=/squat|deadlift|\brdl\b|romanian|good morning|hip thrust|lunge|step-?up|\bclean\b|snatch|trap bar/i;
function mainLift(day){ const s=(day.sections||[]).find(x=>/^Main\s*—/.test(x.label||'')); if(!s) return null; return stripSvg((s.items||[])[0]&&s.items[0].name); }
function mins(c){ const t=(c.detail||''); let m=t.match(/(\d+)\s*(?:-|–)?\s*min/); if(m) return +m[1]; m=t.match(/([\d.]+)\s*(?:mi\b|mile)/); if(m) return +m[1]*10; return 0; }
function runClass(c){ const s=c.subtype||''; if(/\((INT|SI)\)/.test(s)) return 'INT'; if(/\((CHI|LI)\)/.test(s)) return 'CHI';
  if(/Long Slow Distance|\bLSD\b|Easy Run|Steady Aerobic|Long/.test(s)) return 'LSD'; return 'OTHER:'+s.replace(/ — .*/,''); }
function classify(prog){
  const tw=prog.totalWeeks; const recs={};
  for(let w=1;w<=tw;w++){ const wk=prog.weeks[w]||{}; let longD=null,longM=-1;
    ISO.forEach(d=>cardios(wk[d]).forEach(c=>{ if(c.type==='run'&&runClass(c)==='LSD'){ const m=mins(c)+(/Long/.test((c.subtype||'').replace(/Long Slow Distance/,''))?1e6:0); if(m>=longM){longM=m;longD=d;} } }));
    ISO.forEach(d=>{ const day=wk[d]; const r={w,d,rest:!day||!!day.rest,run:null,lower:false};
      if(day&&!day.rest){ const ml=mainLift(day); r.lower=!!(ml&&LOWER_MAIN.test(ml)); }
      cardios(day).forEach(c=>{ if(c.type==='run'){ let k=runClass(c); if(k==='LSD') k=(d===longD)?'LONG':'EASY'; r.run=k; } });
      recs[w+'_'+d]=r; }); }
  const at=(w,i)=>{ if(i<0){w--;i+=7;} if(i>6){w++;i-=7;} return recs[w+'_'+ISO[i]]||null; };
  return {recs,at,tw};
}
const GOALS={
  run_base:{types:['run'],g:{run:{id:'run_base',mileBestMins:'8',mileBestSecs:'15',baseline:'2.5 miles'}}},
  'run_base+bike_base':{types:['run','bike'],g:{run:{id:'run_base',mileBestMins:'8',mileBestSecs:'15',baseline:'2.5 miles'},bike:{id:'bike_base'}}},
  run_pace_goal:{types:['run'],g:{run:{id:'run_pace_goal',mileBestMins:'8',mileBestSecs:'15',mileBestSrc:{kind:'entered'},targetDist:'1.5',targetMins:'11',targetSecs:'0',paceUnit:'mi'}}},
  'run_pace+bike_base':{types:['run','bike'],g:{run:{id:'run_pace_goal',mileBestMins:'8',mileBestSecs:'15',targetDist:'1.5',targetMins:'11',targetSecs:'0',paceUnit:'mi'},bike:{id:'bike_base'}}},
};
const EXP=['beginner','intermediate','advanced'];
const REST=[[],['sun'],['sat'],['sun','wed'],['sat','sun'],['mon','fri'],['sun','wed','sat'],['tue','thu','sat'],['sun','tue','thu','sat'],['mon','wed','fri','sun']];
const SEEDS=[24865,7,4242]; const WKOUT=[4,8,12]; const FOCUS=['balanced','support_strength'];
function mkCfg(gk,exp,rest,seed,wo,focus){ const race=new Date('2026-09-21T00:00:00'); race.setDate(race.getDate()+wo*7);
  return {primaryPath:'event',eventTargeted:true,raceDate:race.toISOString().slice(0,10),cardioTypes:GOALS[gk].types.slice(),
    cardioGoals:clone(GOALS[gk].g),liftingFocus:focus,experience:exp,ageBracket:'18-35',equipment:'home_full',unit:'lbs',
    restDays:rest.slice(),days:ALL.slice(),bench:185,squat:255,deadlift:315,name:'M',startDate:'2026-09-21',seed}; }
const hasLongKey=p=>Object.keys(p.weeks).some(w=>ISO.some(d=>cardios(p.weeks[w][d]).some(c=>c.type==='run'&&c.dose&&c.dose.key==='long')));
function sectionA(IAx){
  const T={};
  Object.keys(GOALS).forEach(gk=>EXP.forEach(exp=>REST.forEach(rest=>SEEDS.forEach(seed=>WKOUT.forEach(wo=>FOCUS.forEach(focus=>{
    const prog=IAx.buildProgram(mkCfg(gk,exp,rest,seed,wo,focus));
    const t=T[gk]=T[gk]||{builds:0,nul:0,notes:{},noLong:0,noLongNul:0,lower:0,LONG_OR_EVE:0,SAME_LONG:0,EVE:0,AFTER:0,cfgs:0};
    t.builds++; const nl=prog.legRecoveryNote==null; if(nl) t.nul++; const lk=hasLongKey(prog); if(!lk){ t.noLong++; if(nl) t.noLongNul++; }
    const nk=(prog.legRecoveryNote||'null').slice(0,60); t.notes[nk]=(t.notes[nk]||0)+1;
    if(wo!==WKOUT[0]) return;
    const C=classify(prog); t.cfgs++;
    Object.values(C.recs).forEach(r=>{ if(r.rest||!r.lower) return; t.lower++;
      const i=ISO.indexOf(r.d), nx=C.at(r.w,i+1), pv=C.at(r.w,i-1); const sl=r.run==='LONG', ev=!!(nx&&nx.run==='LONG');
      if(sl) t.SAME_LONG++; if(ev) t.EVE++; if(sl||ev) t.LONG_OR_EVE++; if(pv&&pv.run==='LONG') t.AFTER++; });
  }))))));
  return T;
}
P('\n==== (A) run_base hard-days lattice, 4 goals x 540 builds; lower-Main counts at weeks-out 4 (as the V207 measure) ====');
const TA=sectionA(A), TB=sectionA(B);
Object.keys(GOALS).forEach(gk=>{ [['pre',TA[gk]],['post',TB[gk]]].forEach(([tag,t])=>{
  P(`  ${tag.padEnd(4)} ${gk.padEnd(20)} lower-Main on long or eve ${t.LONG_OR_EVE}/${t.lower} (same-day ${t.SAME_LONG}, eve ${t.EVE}; day after long ${t.AFTER})  legRecoveryNote null ${t.nul}/${t.builds}  no long-keyed run ${t.noLong}/${t.builds} (of which null note ${t.noLongNul})`); });
  P('       notes post: '+Object.entries(TB[gk].notes).map(([k,v])=>v+'x "'+k+'…"').join(' | ')); });

// (B) dated
const RUN={id:'run_pace_goal',label:'Hit a Pace / Time Goal',mileBestMins:'8',mileBestSecs:'15',mileBestSrc:{kind:'entered'},targetDist:'1.5',targetMins:'11',targetSecs:'0',paceUnit:'mi'};
const MILE={id:'run_mile_time',mileBestMins:'8',mileBestSecs:'15',targetDist:'1',targetMins:'7',targetSecs:'30',paceUnit:'mi'};
const MIX={run:{types:['run']},'run+bike':{types:['run','bike'],x:{bike:{id:'bike_base'}}},'run+swim':{types:['run','swim'],x:{swim:{id:'swim_base'}}}};
const START=new Date(2026,9,5);
const isoOff=n=>{ const d=new Date(START); d.setDate(d.getDate()+n); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); };
function mkDated(goal,mk,rest,tw,wd,seed){ return {name:'GK',primaryPath:'event',eventTargeted:true,raceDate:isoOff(7*(tw-1)+wd),_testWeek:tw,_raceDateCappedWeeks:tw,
    cardioTypes:MIX[mk].types.slice(),cardioGoals:Object.assign({run:clone(goal)},clone(MIX[mk].x||{})),liftingFocus:'balanced',experience:'intermediate',
    ageBracket:'18-35',equipment:'home_full',unit:'lbs',restDays:rest.slice(),days:ALL.slice(),bench:185,squat:255,deadlift:315,startDate:isoOff(0),seed}; }
const grid=p=>ISO.map(d=>{ const x=p.weeks[1]&&p.weeks[1][d]; return d+':'+(!x||x.rest?'REST':(x.title||'?')); }).join(' ');
const liftN=day=>(day&&day.sections||[]).filter(s=>(s.items||[]).length).length;   // any section with items (T-1/T-2 carry none: g207 D3)
P('\n==== (B) dated pace/mile: 2 goals x 3 mixes x 10 rest x tw {1,2,3,6} x 7 weekdays x 2 seeds ====');
const byTw={}; const w1=[]; const cls={}; let tT=0,tBad=0,tBadPre=0;
[RUN,MILE].forEach(goal=>Object.keys(MIX).forEach(mk=>REST.forEach(rest=>[1,2,3,6].forEach(tw=>[0,1,2,3,4,5,6].forEach(wd=>[24865,7].forEach(seed=>{
  const cfg=mkDated(goal,mk,rest,tw,wd,seed); const pa=A.buildProgram(clone(cfg)), pb=B.buildProgram(clone(cfg));
  const ch=grid(pa)!==grid(pb)||pa.legRecoveryNote!==pb.legRecoveryNote, dg=H.progDigest(pa)!==H.progDigest(pb);
  const b=byTw[tw]=byTw[tw]||{n:0,roleOrNote:0,digest:0,weeks:{}}; b.n++; if(ch) b.roleOrNote++; if(dg) b.digest++; b.weeks[pb.totalWeeks]=(b.weeks[pb.totalWeeks]||0)+1;
  // T-1 / T-2 by date arithmetic: the test is at day offset 7*(tw-1)+wd from START (Mon of week 1)
  const off=7*(tw-1)+wd; [1,2].forEach(k=>{ const o=off-k; if(o<0) return; const w=Math.floor(o/7)+1, d=ISO[o%7]; tT++; const day=pb.weeks[w]&&pb.weeks[w][d]; if(liftN(day)>0) tBad++; const dA=pa.weeks[w]&&pa.weeks[w][d]; if(liftN(dA)>0) tBadPre++; });
  if(tw===1){ const k=(ch?'CHANGED':'same')+' '+goal.id+' '+mk+' '+(7-rest.length)+'d'; cls[k]=(cls[k]||0)+1;
    w1.push(`  ${goal.id} ${mk} rest=[${rest}] wd=${ISO[wd]} seed=${seed} tw=${pb.totalWeeks}wk ${ch?'CHANGED':'same'}\n     pre  ${grid(pa)} | note ${pa.legRecoveryNote?JSON.stringify(pa.legRecoveryNote.slice(0,70)):'null'}\n     post ${grid(pb)} | note ${pb.legRecoveryNote?JSON.stringify(pb.legRecoveryNote.slice(0,70)):'null'}`); }
}))))));
Object.keys(byTw).forEach(tw=>{ const b=byTw[tw]; P(`  tw=${tw}: ${b.n} programs, week-1 role grid or note changed ${b.roleOrNote}, progDigest changed ${b.digest}, program lengths ${JSON.stringify(b.weeks)}`); });
P(`  T-1/T-2 days with any section with items: pre ${tBadPre}/${tT}, post ${tBad}/${tT}`);
P('  test-in-week-1 class summary: '+JSON.stringify(cls));
P('  test-in-week-1 programs (first 12 printed; full list with --all):');
(process.argv.includes('--all')?w1:w1.slice(0,12)).forEach(s=>P(s));

// (C) undated pace/mile + NRC
P('\n==== (C) undated pace/mile and NRC: progDigest pre == post ====');
const C={};
[['run_pace_goal',RUN],['run_mile_time',MILE]].forEach(([id,g])=>Object.keys(MIX).forEach(mk=>REST.forEach(rest=>[24865,7].forEach(seed=>{
  const cfg=mkDated(g,mk,rest,1,0,seed); delete cfg._testWeek; delete cfg._raceDateCappedWeeks; cfg.eventTargeted=false; cfg.raceDate=null; cfg.primaryPath='goal';
  const k='undated '+id; C[k]=C[k]||[0,0]; C[k][1]++; if(H.progDigest(A.buildProgram(clone(cfg)))===H.progDigest(B.buildProgram(clone(cfg)))) C[k][0]++; }))));
['run_5k','run_10k','run_half','run_marathon'].forEach(g=>Object.keys(MIX).forEach(mk=>[['sun'],['sun','wed'],[],['sat','sun']].forEach(rest=>{
  const cfg=Object.assign(clone(H.fixtures.HALF_MANNY),{cardioTypes:MIX[mk].types.slice(),cardioGoals:Object.assign({run:{id:g,label:g}},clone(MIX[mk].x||{})),restDays:rest,seed:76308});
  const k='NRC '+g; C[k]=C[k]||[0,0]; C[k][1]++; if(H.progDigest(A.buildProgram(clone(cfg)))===H.progDigest(B.buildProgram(clone(cfg)))) C[k][0]++; })));
Object.keys(C).forEach(k=>P(`  ${k.padEnd(22)} identical ${C[k][0]}/${C[k][1]}`));
