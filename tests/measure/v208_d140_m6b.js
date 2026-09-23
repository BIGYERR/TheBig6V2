const {load, fixtures, progDigest}=require('/Users/CanasBangin/Desktop/TheBig6V2/tests/harness.js');
const PRE=load(process.argv[2]), CF=load(process.argv[3]);
const DAYS=['sun','mon','tue','wed','thu','fri','sat'];
const mins=d=>!d?0:d.k==='time'?(+d.mins||0):d.k==='dist'?(+d.mi||0)*(+d.tgt||0)/60:0;
const tierOf=m=>!m?null:m>=75?'A':m>=45?'B':'C';
const engN=det=>{const m=/^(\d+)\s*[x×]/.exec(det||'');return m?+m[1]:1;};
const docN=det=>{let m=/^(\d+)\s*[x×]/.exec(det||'');if(m)return +m[1];m=/\b(\d+)\s*sets?\b/i.exec(det||'');if(m)return +m[1];return 1;};
const isStr=n=>/stretch|mobility|90\/90|foam|worlds greatest/i.test(n||'');
const LEG=/swing|clean|snatch|deadlift|romanian|\brdl\b|good morning|hip thrust|hip extension|glute bridge|squat|lunge|step-?up|\bleg\b|calf|calves|glute|nordic|broad jump|box jump|jump|bound|skater|wall ball|sled|pistol/i;
const sets=(day,f)=>(day.sections||[]).reduce((a,s)=>a+(s.items||[]).filter(i=>!isStr(i.name)).reduce((b,i)=>b+f(i.detail),0),0);
const STAND={name:'PRT TING',primaryPath:'goal',eventTargeted:false,cardioTypes:['run'],cardioGoals:{run:{id:'run_pace_goal',label:'Hit a Pace / Time Goal',mileBestMins:'8',mileBestSecs:'15',mileBestSrc:{kind:'entered'},targetDist:'1.5',targetMins:'11',targetSecs:'0',paceUnit:'mi'}},liftingFocus:'balanced',experience:'intermediate',ageBracket:'18-35',equipment:'home_full',unit:'lbs',restDays:['sun','wed'],days:DAYS.slice(),bench:185,squat:255,deadlift:315,startDate:'2026-09-21',seed:24865};
const cl=o=>JSON.parse(JSON.stringify(o));
const fmt=day=>(day.sections||[]).map(s=>'['+s.label+'] '+(s.items||[]).map(i=>i.name).join(', ')).join(' ; ')||'(none)';
console.log('#### STAND-IN SATURDAYS, before -> after (hand minutes, hand tier, doctrine sets / engine sets)');
{const a=PRE.buildProgram(cl(STAND)), b=CF.buildProgram(cl(STAND));
 for(let w=1;w<=a.totalWeeks;w++){const x=a.weeks[w].sat,y=b.weeks[w].sat;const m=mins(x.cardio.dose);
  console.log(`W${w} ${m.toFixed(1)} min ${tierOf(m)} | before: "${x.title}" ${fmt(x)} [doc ${sets(x,docN)} / eng ${sets(x,engN)}]`);
  console.log(`         after:  "${y.title}" ${fmt(y)} [doc ${sets(y,docN)} / eng ${sets(y,engN)}]`);}}
console.log('#### LATTICE (pace, mile, 1.5 under 10, run_base; 12:00-mile slow runner; run+bike; run+swim) x equipment x focus x seeds');
const cfgs=[];
[['run_pace_goal','8','15',['run']],['run_mile_time','8','15',['run']],['run_15_under10','8','15',['run']],['run_base','8','15',['run']],['run_pace_goal','12','0',['run']],['run_base','12','0',['run']],['run_pace_goal','8','15',['run','bike']],['run_pace_goal','8','15',['run','swim']]].forEach(([g,mm,ss,T])=>
 [24865,1001,7007].forEach(seed=>['home_full','crossfit','bodyweight','full_gym'].forEach(eq=>['balanced','hypertrophy','support_prevention'].forEach(f=>{
  const c=cl(STAND);c.cardioGoals.run.id=g;c.cardioGoals.run.mileBestMins=mm;c.cardioGoals.run.mileBestSecs=ss;c.cardioTypes=T.slice();
  if(T.includes('bike'))c.cardioGoals.bike={id:'bike_base',label:'Base',baselineDist:'10',baseline:'10mi'};
  if(T.includes('swim'))c.cardioGoals.swim={id:'swim_base',label:'Base',baselineDist:'1000',baseline:'1000m'};
  c.seed=seed;c.equipment=eq;c.liftingFocus=f;cfgs.push({tag:g+'/'+mm+':'+ss+'/'+T.join('+'),c});}))));
const st={};const bump=(k,n=1)=>st[k]=(st[k]||0)+n;const ex={};const note=(k,v)=>{if(!ex[k])ex[k]=v;};
cfgs.forEach(({tag,c})=>{const a=PRE.buildProgram(cl(c)),b=CF.buildProgram(cl(c));
 for(let w=1;w<=b.totalWeeks;w++)DAYS.forEach(d=>{const y=b.weeks[w][d],x=a.weeks[w][d];if(!y)return;
  const cd=y.cardio;const isLong=!!(cd&&cd.type==='run'&&cd.dose&&cd.dose.key==='long'&&!cd.isNRC);
  if(!isLong){ if(JSON.stringify(x)!==JSON.stringify(y)){bump('NON-LONG day changed');note('NON-LONG day changed',tag+' W'+w+' '+d);} return; }
  const t=tierOf(mins(cd.dose)); bump('long days '+t+' ('+tag.split('/')[0]+')');
  if(!(y.sections||[]).length && !(x.sections||[]).length) bump('long days '+t+' with no lifting either side');
  if(t==='A'){ if(y.title!=='Post-Run Mobility'||(y.sections||[]).some(s=>!/post-run mobility|taper/i.test(s.label||''))){bump('A not mobility-only');note('A not mobility-only',tag+' W'+w+' '+d+' '+fmt(y));} }
  if(t==='B'){ const dn=sets(y,docN);
    if(dn>8){bump('B doctrine sets > 8');note('B doctrine sets > 8',tag+' W'+w+' '+d+' doc '+dn+' eng '+sets(y,engN)+' '+fmt(y));}
    if((y.sections||[]).some(s=>/power|carry/i.test(s.label||'')))bump('B power/carry section');
    if((y.sections||[]).some(s=>(s.items||[]).some(i=>LEG.test(i.name||''))))bump('B leg-rx item');
    if((y.sections||[]).some(s=>/explosive|finisher|plyo|conditioning/i.test(s.label||''))){bump('B explosive/finisher section survives');note('B explosive/finisher section survives',tag+' W'+w+' '+d+' '+fmt(y));} }
  if(t==='C'){ const strip=z=>JSON.stringify({...z,sections:(z.sections||[]).filter(s=>!/carry/i.test(s.label||''))});
    if(strip(x)!==strip(y)){bump('C differs from pre beyond carries');note('C differs from pre beyond carries',tag+' W'+w+' '+d+'\n      pre '+fmt(x)+'\n      cf  '+fmt(y));}
    if((x.sections||[]).some(s=>/carry/i.test(s.label||'')))bump('C pre had a carry section'); }
 });});
Object.keys(st).sort().forEach(k=>console.log(String(st[k]).padStart(6),k));
Object.keys(ex).forEach(k=>console.log('  e.g. '+k+': '+ex[k]));
console.log('#### NRC (unchanged limb)');
const hm=o=>progDigest(o.buildProgram(cl(fixtures.HALF_MANNY)));console.log('HALF_MANNY pre',hm(PRE),'cf',hm(CF));
let nb=0,nb8=0,nbx='';const p=PRE.buildProgram(cl(fixtures.HALF_MANNY));for(let w=1;w<=p.totalWeeks;w++)DAYS.forEach(d=>{const y=p.weeks[w][d];if(!y||!y.cardio||!y.cardio.isNRC||!/^long run/i.test(y.cardio.subtype||''))return;if(tierOf(mins(y.cardio.dose))!=='B')return;nb++;const dn=sets(y,docN);if(dn>8){nb8++;if(!nbx)nbx='W'+w+' '+d+' doc '+dn+' eng '+sets(y,engN)+' '+fmt(y);}});
console.log('HALF_MANNY NRC tier B days',nb,'over 8 doctrine sets today',nb8,nbx);
