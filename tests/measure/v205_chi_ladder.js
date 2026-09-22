// v205 — CHI minute ladder, every week of an 11-week pace-goal program.
// Oracle: NSW PTG Guide A caps a long continuous interval at 20 minutes of work.
const path=require('path');
const { load } = require(path.join(__dirname,'..','harness.js'));
const IA = load(process.argv[2] || path.join(__dirname,'..','..','index.html'));
const ALL=['sun','mon','tue','wed','thu','fri','sat'];
function cfg(o={}){ return Object.assign({ name:'M',primaryPath:'goal',cardioTypes:['run'],
  cardioGoals:{run:{id:'run_pace_goal',label:'Hit a Pace / Time Goal',targetDist:'1.5',paceUnit:'mi',
    targetMins:'10',targetSecs:'0',mileBestMins:'8',mileBestSecs:'0',baseline:''}},
  eventTargeted:false,liftingFocus:'support_prevention',experience:'intermediate',ageBracket:'18-35',
  equipment:'full_gym',unit:'lbs',restDays:['sun','wed'],days:ALL.slice(),
  bench:185,squat:255,deadlift:315,seed:76308},o); }
function report(tag,c){
  const p=IA.buildProgram(c);
  console.log('\n── '+tag+' — weeks='+p.totalWeeks);
  Object.keys(p.weeks).sort((a,b)=>+a-+b).forEach(w=>{
    ALL.forEach(d=>{ const day=p.weeks[w][d]; if(!day||day.rest||!day.cardio) return;
      const arr=Array.isArray(day.cardio)?day.cardio:[day.cardio];
      arr.forEach(cd=>{ const s=String(cd.subtype||'');
        if(!/Tempo|Threshold|CHI|Continuous High/i.test(s)) return;
        const det=String(cd.detail||'').replace(/\s+/g,' ');
        const m=det.match(/^(?:(\d+)\s*x\s*)?(\d+(?:\.\d+)?)\s*min/i);
        const reps=m?(+(m[1]||1)):null, mins=m?+m[2]:null;
        console.log('  W'+String(w).padStart(2)+' '+d.toUpperCase()+' ['+s+'] reps='+reps+' minPerRep='+mins
          +' totalWork='+(reps&&mins?reps*mins:'?')+'min'+((mins&&mins>20)?'   >>> OVER 20 MIN PER INTERVAL':'')
          +'\n        '+det.slice(0,150));
      });
    });
  });
}
report('Mario: 5 train days, rest SUN+WED, intermediate, seed 76308', cfg());
report('same but ADVANCED', cfg({experience:'advanced'}));
report('same but BEGINNER', cfg({experience:'beginner'}));
report('6 train days (rest SUN) intermediate', cfg({restDays:['sun']}));
