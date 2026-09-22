// v202_d96_longrun_and_chipdiff.js — two loose ends:
//  (a) the actual Saturday long-run dose in A weeks 1-14 vs B weeks 1-6 (gap-list item a);
//  (b) the byte difference between "A active viewing A" and "B active viewing A" on Progress.
const path=require('path');
const H=require(path.join(__dirname,'..','harness.js'));
const IA=H.load(path.join(__dirname,'..','..','index.html'));
const P=s=>console.log(s);
const PACE_CFG={name:'PACE BLOCK',primaryPath:'event',cardioTypes:['run'],
  cardioGoals:{run:{id:'run_pace_goal',label:'1.5 Mile Time',mileBestMins:'10',mileBestSecs:'30',baselineDist:'1.5',baseline:'1.5mi'}},
  eventTargeted:false,liftingFocus:'support_prevention',experience:'intermediate',ageBracket:'18-35',
  equipment:'crossfit',unit:'lbs',restDays:['sun','wed'],days:['sun','mon','tue','wed','thu','fri','sat'],
  bench:135,squat:155,deadlift:185,seed:76308};
const A=IA.buildProgram(IA.fixtures.HALF_MANNY), B=IA.buildProgram(PACE_CFG);
P('ia-version '+IA.version);
P('sample A W4 sat cardio object keys: '+Object.keys(A.weeks[4].sat.cardio||{}).join(','));
P(JSON.stringify(A.weeks[4].sat.cardio).slice(0,300));
function line(p,w,d){const day=p.weeks[w]&&p.weeks[w][d];if(!day)return '(none)';const c=day.cardio;const a=Array.isArray(c)?c:(c?[c]:[]);
  return a.map(x=>JSON.stringify(x).replace(/"/g,'').slice(0,150)).join(' + ')||'(no cardio)';}
P('\nA (half, 14 wk) Saturday:');for(let w=1;w<=A.totalWeeks;w++)P('  A W'+String(w).padStart(2)+' '+line(A,w,'sat'));
P('\nB (1.5-mile pace goal, '+B.totalWeeks+' wk) Saturday:');for(let w=1;w<=B.totalWeeks;w++)P('  B W'+String(w).padStart(2)+' '+line(B,w,'sat'));
function longest(p,lo,hi){let best=0,where='';for(let w=lo;w<=hi;w++)Object.keys(p.weeks[w]||{}).forEach(d=>{
  const c=p.weeks[w][d].cardio;const a=Array.isArray(c)?c:(c?[c]:[]);
  a.forEach(x=>{const cands=[x.dist,x.distance,x.miles,x.mi,(x.dose&&x.dose.dist)].map(Number).filter(v=>!isNaN(v));
    const v=cands.length?Math.max.apply(null,cands):0; if(v>best){best=v;where='W'+w+' '+d+' '+(x.subtype||x.type||'');}});});
  return best+' mi ('+where+')';}
P('\nlongest run A weeks 4-7 (the rung held during a detour): '+longest(A,4,7));
P('longest run A weeks 1-3: '+longest(A,1,3));
P('longest run A weeks 8-14: '+longest(A,8,14));
P('longest run anywhere in B: '+longest(B,1,B.totalWeeks));
P('\nDONE');
