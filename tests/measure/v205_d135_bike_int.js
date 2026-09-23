// v205 slice 14 (D135) — before/after picture for the bike INT fork.
// READ-ONLY. Prints per-goal digests, the bike INT rep ladder, Mario's run ramp,
// and HALF_MANNY. Run against any artifact: node tests/measure/v205_d135_bike_int.js <art>
const path=require('path');
const H=require(path.join(__dirname,'..','harness.js'));
const ART=process.argv[2]||path.join(__dirname,'..','..','index.html');
const IA=H.load(ART);
const ALL=['sun','mon','tue','wed','thu','fri','sat'];
const say=(...a)=>console.log(...a);

function cfg(sport,goalId,baseMin,extra){
  return Object.assign({name:'M',primaryPath:'goal',cardioTypes:[sport],
    cardioGoals:{[sport]:{id:goalId,label:goalId,baseline:baseMin+' min',baselineDist:String(baseMin)}},
    eventTargeted:false,liftingFocus:'support_prevention',experience:'intermediate',ageBracket:'18-35',
    equipment:'full_gym',unit:'lbs',restDays:['sun','wed'],days:ALL.slice(),
    bench:185,squat:255,deadlift:315,seed:76308},extra||{});
}
const CASES=[['bike','bike_century',60],['bike','bike_ftp',45],['bike','bike_50',40],['bike','bike_cals',25],
             ['swim','swim_tri',30],['swim','swim_mile',30],['swim','swim_500_time',20]];
say('artifact '+ART+'  ia-version '+IA.version);
say('\n=== per-goal progDigest ===');
for(const [sport,goal,b] of CASES){
  let d;
  try{ d=H.progDigest(IA.buildProgram(cfg(sport,goal,b))); }catch(e){ d='BUILD ERROR '+e.message; }
  say('  '+goal.padEnd(16)+' '+d);
}
say('\n=== bike INT cards (reps x work) per goal, all weeks ===');
for(const [sport,goal,b] of CASES.filter(c=>c[0]==='bike')){
  let p; try{ p=IA.buildProgram(cfg(sport,goal,b)); }catch(e){ say('  '+goal+' BUILD ERROR'); continue; }
  const rows=[];
  Object.keys(p.weeks).sort((a,b)=>+a-+b).forEach(w=>ALL.forEach(d=>{
    const day=p.weeks[w][d]; if(!day||day.rest||!day.cardio) return;
    (Array.isArray(day.cardio)?day.cardio:[day.cardio]).forEach(c=>{
      if(String(c.type)!=='bike') return;
      const det=String(c.detail||'').replace(/\s+/g,' ');
      const m=det.match(/^(\d+) x ([^/]+)max effort/);
      if(m) rows.push('W'+w+':'+m[1]);
    });
  }));
  say('  '+goal.padEnd(16)+' tw='+p.totalWeeks+'  INT: '+(rows.join(' ')||'(none)'));
}
say('\n=== Mario: run_pace_goal INT ramp (400m rep counts, in week order) ===');
const MARIO=cfg('run','run_pace_goal',3,{primaryPath:'goal',eventTargeted:false,
  cardioGoals:{run:{id:'run_pace_goal',label:'run_pace_goal',baseline:'3 mi',baselineDist:'3',
    paceGoal:'7:00',currentPace:'8:00',goalDistance:'1.5'}}});
try{
  const p=IA.buildProgram(MARIO); const reps=[];
  Object.keys(p.weeks).sort((a,b)=>+a-+b).forEach(w=>ALL.forEach(d=>{
    const day=p.weeks[w][d]; if(!day||day.rest||!day.cardio) return;
    (Array.isArray(day.cardio)?day.cardio:[day.cardio]).forEach(c=>{
      const det=String(c.detail||'').replace(/\s+/g,' ');
      const m=det.match(/^(\d+)x(400|800)m/); if(m) reps.push(m[1]);
    });
  }));
  say('  tw='+p.totalWeeks+'  ramp: '+reps.join(' '));
}catch(e){ say('  BUILD ERROR '+e.message); }
say('\n=== Mario, 11-week event-targeted pace goal (the ramp D114 fixed) ===');
const M11={name:'PRT TING',primaryPath:'event',cardioTypes:['run'],eventTargeted:true,
  raceDate:'2026-12-07',liftingFocus:'support_prevention',experience:'intermediate',
  ageBracket:'18-35',equipment:'full_gym',unit:'lbs',restDays:['sun','wed'],
  days:ALL.slice(),bench:185,squat:245,deadlift:315,seed:24865,
  cardioGoals:{run:{id:'run_pace_goal',label:'Hit a Pace / Time Goal',paceUnit:'mi',baselineDist:'3',baseline:'3mi'}}};
try{
  const p=IA.buildProgram(M11); const reps=[];
  Object.keys(p.weeks).sort((a,b)=>+a-+b).forEach(w=>ALL.forEach(d=>{
    const day=p.weeks[w][d]; if(!day||day.rest||!day.cardio) return;
    (Array.isArray(day.cardio)?day.cardio:[day.cardio]).forEach(c=>{
      const det=String(c.detail||'').replace(/\s+/g,' ');
      const m=det.match(/^(\d+)x(400|800)m/); if(m) reps.push(m[1]);
    });
  }));
  say('  tw='+p.totalWeeks+'  ramp: '+reps.join(' ')+'   digest '+H.progDigest(p));
}catch(e){ say('  BUILD ERROR '+e.message); }

say('\n=== HALF_MANNY ===');
say('  '+H.progDigest(IA.buildProgram(IA.fixtures.HALF_MANNY))+'   (era row '+H.MANNY_DIGEST_BY_VERSION[IA.version]+')');
