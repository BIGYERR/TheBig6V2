// V205 measure — "Can calcProgramLength give run_base a block of 13 weeks or more?"
// Mode B before-picture for coach's single outstanding condition on D128 (Table 6 row 13
// = 2 x 12, which stops being "one light tempo").
// READ-ONLY. Sweeps every input calcProgramLength reads on the run_base path.
//
// ORACLE (independent of calcProgramLength): the climb is re-simulated below from the
// stated contract ("safe weekly build rate by experience, deload every 4th week at 70%
// of the last build, +2 settle, age multiplier, +1 grace, ceiling 26, floor 6"), coded
// separately from the engine body; and cross-checked end-to-end against
// buildProgram().totalWeeks, which is a second code path to the same number.
const path = require('path');
const { load, fixtures } = require(path.join(__dirname, '..', 'harness.js'));
const IA = load(path.join(__dirname, '..', '..', 'index.html'));
console.log('ia-version', IA.IA_VERSION);

// ---- independent oracle -------------------------------------------------
function oracleWeeks(exp, age, baseline){
  const pct = {beginner:0.08, intermediate:0.10, advanced:0.12}[exp];
  const ageMult = {'55+':1.15,'36-54':1.07,'18-35':1.0}[age];
  const defaults = {beginner:0.5, intermediate:1.5, advanced:3.0};
  let cur;
  if(exp==='beginner') cur = Math.max(2.0, (baseline===null? 2.0 : baseline) || 2.0);
  else cur = (baseline===null ? defaults[exp] : (baseline || defaults[exp]));
  const tgt = 5.0;                 // run_base distance target
  const p = pct * 1.5;             // 5.0mi <= 6.2mi => short goal
  let n;
  if(cur >= tgt*0.9) n = 4;
  else {
    let miles = cur, lastBuild = cur, w = 0;
    while(miles < tgt*0.9 && w < 52){
      w++;
      if(w % 4 === 0) miles = lastBuild * 0.70;
      else { const nx = Math.min(tgt, lastBuild + Math.max(0.5, lastBuild*p)); miles = nx; lastBuild = nx; }
    }
    n = Math.min(w + 2, 36);
  }
  n = Math.round(n * ageMult);
  n = Math.min(26, n + 1);
  return Math.max(6, n);
}

// ---- lattice ------------------------------------------------------------
const EXPS = ['beginner','intermediate','advanced'];
const AGES = ['18-35','36-54','55+'];
// baselineDist: the UI input is <input type=number min=0 step=0.1> (index.html:2868),
// so every non-negative 0.1 step is reachable. Sweep 0.0 -> 10.0 plus "unset".
const BASE = [null];
for(let x=0; x<=100; x++) BASE.push(+(x/10).toFixed(1));
const EVT = [true,false];

const dist = {}, byExp = {}, byAge = {}, byBase = {};
let n=0, oracleOK=0, oracleBAD=[], max=-1, maxCfg=null;
const ge13 = [];
for(const exp of EXPS) for(const age of AGES) for(const b of BASE) for(const evt of EVT){
  const g = { id:'run_base', label:'Running Base' };
  if(b!==null){ g.baselineDist = String(b); g.baseline = b + 'mi'; }
  const goals = { run:g, _experience:exp, _ageBracket:age, _eventTargeted:evt };
  const w = IA.calcProgramLength(['run'], goals, 'balanced').weeks;
  n++;
  dist[w]=(dist[w]||0)+1;
  (byExp[exp]=byExp[exp]||{})[w]=((byExp[exp]||{})[w]||0)+1;
  (byAge[age]=byAge[age]||{})[w]=((byAge[age]||{})[w]||0)+1;
  const o = oracleWeeks(exp, age, b);
  if(o===w) oracleOK++; else if(oracleBAD.length<10) oracleBAD.push({exp,age,b,evt,engine:w,oracle:o});
  if(w>max){ max=w; maxCfg={exp,age,b,evt}; }
  if(w>=13) ge13.push({exp,age,b,evt,w});
}
console.log('\n=== 1. calcProgramLength(run_base) ===');
console.log('configs swept:', n, '(3 experience x 3 age x 102 baselineDist incl. unset x 2 eventTargeted)');
console.log('oracle agreement:', oracleOK+'/'+n);
if(oracleBAD.length) console.log('oracle disagreements (first 10):', JSON.stringify(oracleBAD));
console.log('MAX OBSERVED:', max, 'at', JSON.stringify(maxCfg));
console.log('distribution weeks->count:', JSON.stringify(dist));
console.log('by experience:', JSON.stringify(byExp));
console.log('by ageBracket:', JSON.stringify(byAge));
console.log('configs >=13 weeks:', ge13.length, '/', n);
if(ge13.length) console.log('  >=13 sample:', JSON.stringify(ge13.slice(0,12)));

// ---- eventTargeted / raceDate: does a far race date move it? ------------
console.log('\n=== 1b. eventTargeted toggle ===');
let evtDiff=0, evtN=0;
for(const exp of EXPS) for(const age of AGES) for(const b of BASE){
  const mk=(evt)=>{ const g={id:'run_base'}; if(b!==null){g.baselineDist=String(b);g.baseline=b+'mi';}
    return IA.calcProgramLength(['run'],{run:g,_experience:exp,_ageBracket:age,_eventTargeted:evt},'balanced').weeks; };
  evtN++; if(mk(true)!==mk(false)) evtDiff++;
}
console.log('run_base lengths that differ on _eventTargeted:', evtDiff, '/', evtN);

// ---- multi-sport: can another cardio type lift the block past 12? -------
console.log('\n=== 1c. run_base + a second sport (maxWeeks is a MAX over types) ===');
const SW=['swim_tri','swim_mile','swim_100_time','swim_500_time','swim_base'];
const BK=['bike_century','bike_50','bike_ftp','bike_cals','bike_base'];
let msMax=-1,msCfg=null,ms13=0,msN=0;
for(const exp of EXPS) for(const age of AGES) for(const other of SW.concat(BK)){
  const type = other.startsWith('swim')?'swim':'bike';
  const goals={ run:{id:'run_base'}, _experience:exp,_ageBracket:age,_eventTargeted:true };
  goals[type]={id:other};
  const w=IA.calcProgramLength(['run',type],goals,'balanced').weeks;
  msN++; if(w>=13) ms13++;
  if(w>msMax){msMax=w;msCfg={exp,age,other};}
}
console.log('configs:',msN,' MAX:',msMax,'at',JSON.stringify(msCfg),' >=13:',ms13+'/'+msN);

// ---- 2. buildProgram cross-check + CHI cards at the max -----------------
console.log('\n=== 2. buildProgram().totalWeeks cross-check ===');
function mkCfg(exp,age,b,evt,seed){
  const g={id:'run_base',label:'Running Base'};
  if(b!==null){g.baselineDist=String(b);g.baseline=b+'mi';}
  return Object.assign({}, fixtures.HALF_MANNY, {
    name:'RUNBASE', primaryPath:'fitness', cardioTypes:['run'], cardioGoals:{run:g},
    eventTargeted:evt, raceDate: evt? '2027-06-01' : '', experience:exp, ageBracket:age,
    seed: seed||76308
  });
}
let bpMax=-1,bpCfg=null,bpN=0,agree=0,disagree=[];
for(const exp of EXPS) for(const age of AGES) for(const b of [null,0,0.1,0.5,1,1.5,2,3,4,5,8]) for(const evt of EVT){
  const cfg=mkCfg(exp,age,b,evt);
  let p; try{ p=IA.buildProgram(cfg); }catch(e){ console.log('CRASH',exp,age,b,evt,e.message); continue; }
  bpN++;
  const cl=IA.calcProgramLength(['run'],{run:cfg.cardioGoals.run,_experience:exp,_ageBracket:age,_eventTargeted:evt},'balanced').weeks;
  if(p.totalWeeks===cl) agree++; else if(disagree.length<8) disagree.push({exp,age,b,evt,build:p.totalWeeks,calc:cl});
  if(p.totalWeeks>bpMax){bpMax=p.totalWeeks;bpCfg={exp,age,b,evt};}
}
console.log('builds:',bpN,' totalWeeks==calcProgramLength:',agree+'/'+bpN, disagree.length?JSON.stringify(disagree):'');
console.log('MAX buildProgram totalWeeks:', bpMax, 'at', JSON.stringify(bpCfg));

if(bpMax>=13){
  console.log('\n=== 2b. run cards, weeks 13.. on the max config ===');
  const cfg=mkCfg(bpCfg.exp,bpCfg.age,bpCfg.b,bpCfg.evt);
  const p=IA.buildProgram(cfg);
  const subs={};
  Object.keys(p.weeks).sort((a,b)=>+a-+b).forEach(wk=>{
    Object.keys(p.weeks[wk]).forEach(d=>{
      const day=p.weeks[wk][d]; const cs=day&&day.cardio?(Array.isArray(day.cardio)?day.cardio:[day.cardio]):[];
      cs.forEach(c=>{ if(!c) return; subs[c.subtype||c.type]=(subs[c.subtype||c.type]||0)+1; });
    });
  });
  console.log('distinct run subtypes across all ' + p.totalWeeks + ' weeks:', JSON.stringify(subs));
  let printed=0;
  Object.keys(p.weeks).sort((a,b)=>+a-+b).forEach(wk=>{
    if(+wk<13) return;
    ['mon','tue','wed','thu','fri','sat','sun'].forEach(d=>{
      const day=p.weeks[wk][d]; const cs=day&&day.cardio?(Array.isArray(day.cardio)?day.cardio:[day.cardio]):[];
      cs.forEach(c=>{ if(!c) return; printed++;
        console.log(`W${wk} ${d.toUpperCase()} [${c.subtype||c.type}] ${c.detail||''}`);
      });
    });
  });
  console.log('cards printed for weeks 13+:', printed);
  if(!printed) console.log('MEASUREMENT FAILED: no cards printed for weeks 13+');
} else {
  console.log('\n=== 2b. skipped: no config reached 13 weeks ===');
}

// ---- 3. what the run_base CHI branch actually prints, week by week ------
// index.html:4032-4041 — the run_base limb of the CHI writer uses chiMins ONLY and
// never reads chiReps. Print the whole series so coach can see rows 13+ as cards.
console.log('\n=== 3. Steady Aerobic Run minutes by week, max config (16 wk) ===');
{
  const cfg=mkCfg('intermediate','55+',0.1,true);
  const p=IA.buildProgram(cfg);
  const series=[];
  Object.keys(p.weeks).sort((a,b)=>+a-+b).forEach(wk=>{
    Object.keys(p.weeks[wk]).forEach(d=>{
      const day=p.weeks[wk][d]; const cs=day&&day.cardio?(Array.isArray(day.cardio)?day.cardio:[day.cardio]):[];
      cs.forEach(c=>{ if(c && c.subtype==='Steady Aerobic Run') series.push('W'+wk+'='+JSON.stringify(c.dose)); });
    });
  });
  console.log(series.join('  '));
  console.log('table rows for the same weeks (chiFromTable6 is not exported; rows are the literal NSW_TABLE6_CHI at index.html:3531):');
  console.log('  wk11-12 {reps:1,min:20}  wk13-15 {reps:2,min:12}  wk16-18 {reps:2,min:14}');
}

// ---- 4. how many run_base builds land >=13 weeks, end to end ------------
console.log('\n=== 4. buildProgram sweep: share of run_base builds at >=13 weeks ===');
{
  let N=0,G=0,mx=0; const byW={};
  for(const exp of EXPS) for(const age of AGES) for(const b of BASE) {
    const g={id:'run_base'}; if(b!==null){g.baselineDist=String(b);g.baseline=b+'mi';}
    const w=IA.calcProgramLength(['run'],{run:g,_experience:exp,_ageBracket:age,_eventTargeted:true},'balanced').weeks;
    N++; byW[w]=(byW[w]||0)+1; if(w>=13)G++; if(w>mx)mx=w;
  }
  console.log('single-run run_base configs:',N,' >=13wk:',G,'('+(100*G/N).toFixed(1)+'%)',' max:',mx);
}
