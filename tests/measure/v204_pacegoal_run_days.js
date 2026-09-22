// v204 — Mario: "5 training days, rest Sun+Wed, 1.5mi pace goal, only 3 run days a week.
// Shouldn't I get two LSDs, an LI and an SI?"
// Oracle: doctrine/physicaltrainingguide2020.txt p.20 (lines 327-331): 2 LSD + 1 LI + 1 SI
// per week. Read from the guide, NOT from the engine.
const path = require('path');
const { load, weekGrid } = require(path.join(__dirname, '..', 'harness.js'));

const ART = process.argv[2] || path.join(__dirname, '..', '..', 'index.html');
const IA = load(ART);

function cfg(o={}){
  return Object.assign({
    name:'MARIO PACE', primaryPath:'goal', cardioTypes:['run'],
    cardioGoals:{ run:{ id:'run_pace_goal', label:'Hit a Pace / Time Goal',
      targetDist:'1.5', paceUnit:'mi', targetMins:'10', targetSecs:'0', targetTime:'10:00',
      mileBestMins:'8', mileBestSecs:'0', baseline:'' } },
    eventTargeted:false,
    liftingFocus:'support_prevention', experience:'intermediate', ageBracket:'18-35',
    equipment:'full_gym', unit:'lbs',
    restDays:['sun','wed'], days:['sun','mon','tue','wed','thu','fri','sat'],
    bench:185, squat:255, deadlift:315, seed:76308,
  }, o);
}

// Classify a day's cardio into NSW vocabulary from the SUBTYPE STRING the engine prints.
function classify(day){
  const c = day && day.cardio;
  if(!c) return null;
  const arr = Array.isArray(c) ? c : [c];
  return arr.map(x => x.subtype || x.type || '?').join('+');
}
function nswClass(sub){
  if(!sub) return null;
  const s = String(sub);
  if(/Interval \(INT\)/.test(s)) return 'INT';
  if(/Tempo|Threshold|CHI/i.test(s)) return 'CHI';
  if(/Long Run|LSD.*Long|Long Slow/i.test(s)) return 'LSD_LONG';
  if(/Easy|Recovery|LSD/i.test(s)) return 'LSD_EASY';
  return 'OTHER:'+s;
}

function series(prog){
  const out = [];
  const ORD = ['mon','tue','wed','thu','fri','sat','sun'];
  Object.keys(prog.weeks).sort((a,b)=>+a-+b).forEach(w=>{
    const wk = prog.weeks[w];
    let n=0; const census={};
    ORD.forEach(d=>{ const day=wk[d]; if(!day||day.rest) return;
      const sub=classify(day); if(!sub) return;
      n++; const k=nswClass(sub); census[k]=(census[k]||0)+1; });
    out.push({w:+w, runs:n, census});
  });
  return out;
}

function fullGrid(prog){
  const ORD = ['mon','tue','wed','thu','fri','sat','sun'];
  const lines=[];
  Object.keys(prog.weeks).sort((a,b)=>+a-+b).forEach(w=>{
    const wk=prog.weeks[w];
    ORD.forEach(d=>{
      const day=wk[d];
      if(!day){ lines.push(`W${w} ${d.toUpperCase().padEnd(3)} (absent)`); return; }
      if(day.rest){ lines.push(`W${w} ${d.toUpperCase().padEnd(3)} REST`); return; }
      const sub=classify(day);
      const secs=(day.sections||[]).map(s=>(s.label||s.coreHeader||'?')).join(' | ');
      lines.push(`W${w} ${d.toUpperCase().padEnd(3)} cardio=${(sub||'—').padEnd(34)} | title=${(day.title||'').slice(0,34).padEnd(34)} | sections=${secs}`);
    });
  });
  return lines.join('\n');
}

const MODE = process.argv[3] || 'all';

if(MODE==='all' || MODE==='grid'){
  const prog = IA.buildProgram(cfg());
  console.log(`### ARTIFACT ia-version=${IA.version}  weeks=${Object.keys(prog.weeks).length}  goalId(cfg)=run_pace_goal`);
  console.log('### Q1 FULL GRID — 5 train days, rest sun+wed, intermediate, seed 76308');
  console.log(fullGrid(prog));
  console.log('\n### Q2/Q3 RUN-DAY SERIES + NSW CENSUS');
  const s = series(prog);
  s.forEach(r=>console.log(`W${String(r.w).padStart(2)}  runs=${r.runs}  ${JSON.stringify(r.census)}`));
  console.log('RUN-DAY SERIES: [' + s.map(r=>r.runs).join(',') + ']');
  console.log('ORACLE (PTG p.20 l.327-331): 2 LSD + 1 LI + 1 SI = 4 run slots/wk');
}

if(MODE==='all' || MODE==='sens'){
  console.log('\n### Q6 SENSITIVITY — train days x rest placement, seed 76308');
  const restSets = [
    ['sun','wed','sat'],            // 4 train days
    ['sun','wed'],                  // 5 train days (Mario)
    ['sun','thu'],                  // 5, other placement
    ['fri','sat'],                  // 5, weekend rest
    ['sun'],                        // 6 train days
    ['wed'],                        // 6, midweek rest
    [],                             // 7 train days
  ];
  const focuses = ['support_prevention','support_strength','balanced','strength','hypertrophy','fatloss'];
  console.log('rest / trainDays / focus -> run-day series');
  restSets.forEach(rd=>{
    focuses.forEach(f=>{
      const c = cfg({restDays:rd, liftingFocus:f});
      let s;
      try { s = series(IA.buildProgram(c)); }
      catch(e){ console.log(`  rest=${rd.join('+')||'none'} n=${7-rd.length} ${f} -> CRASH ${e.message}`); return; }
      const uniq = [...new Set(s.map(r=>r.runs))];
      console.log(`  rest=${(rd.join('+')||'none').padEnd(14)} n=${7-rd.length} ${f.padEnd(19)} -> [${s.map(r=>r.runs).join(',')}] distinct=${uniq.join('/')}`);
    });
  });
}

if(MODE==='all' || MODE==='lattice'){
  console.log('\n### Q2b LATTICE — is 3 flat or a ramp? (experience x seed x focus x days)');
  const exps=['beginner','intermediate','advanced'];
  const seeds=[76308,11111,42424,99001,5150];
  const dayCounts=[[ 'sun','wed','sat'],['sun','wed'],['sun'],[]];
  const focuses=['support_prevention','support_strength','support_athletic','balanced','strength','hypertrophy','fatloss'];
  let builds=0, ramped=0, flat3=0, flatOther=0;
  const byDays={};
  exps.forEach(ex=>seeds.forEach(sd=>dayCounts.forEach(rd=>focuses.forEach(f=>{
    let s; const n=7-rd.length;
    try{ s=series(IA.buildProgram(cfg({experience:ex,seed:sd,restDays:rd,liftingFocus:f}))); }
    catch(e){ console.log(`CRASH ${ex}/${sd}/${n}/${f}: ${e.message}`); return; }
    builds++;
    const u=[...new Set(s.map(r=>r.runs))];
    if(u.length>1) ramped++; else if(u[0]===3) flat3++; else flatOther++;
    const key=`n=${n}`;
    byDays[key]=byDays[key]||{};
    const sig=s.map(r=>r.runs).join(',');
    byDays[key][sig]=(byDays[key][sig]||0)+1;
  }))));
  console.log(`builds=${builds}  ramped(non-constant series)=${ramped}  flat-at-3=${flat3}  flat-other=${flatOther}`);
  Object.keys(byDays).sort().forEach(k=>{
    console.log(` ${k}:`);
    Object.entries(byDays[k]).sort((a,b)=>b[1]-a[1]).forEach(([sig,n])=>console.log(`    ${n.toString().padStart(4)} x [${sig}]`));
  });
}
