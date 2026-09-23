const {load, fixtures}=require('/Users/CanasBangin/Desktop/TheBig6V2/tests/harness.js');
const IA=load(process.argv[2]); const MODE=process.argv[3]||'stand';
const DAYS=['sun','mon','tue','wed','thu','fri','sat'];
const mins=d=>!d?0:d.k==='time'?(+d.mins||0):d.k==='dist'?(+d.mi||0)*(+d.tgt||0)/60:0;
const tierOf=m=>!m?null:m>=75?'A':m>=45?'B':'C';
const engN=det=>{const m=/^(\d+)\s*[x×]/.exec(det||'');return m?+m[1]:1;};
const docN=det=>{let m=/^(\d+)\s*[x×]/.exec(det||'');if(m)return +m[1];m=/\b(\d+)\s*sets?\b/i.exec(det||'');if(m)return +m[1];return 1;};
const STAND={name:'PRT TING',primaryPath:'goal',eventTargeted:false,cardioTypes:['run'],cardioGoals:{run:{id:'run_pace_goal',label:'Hit a Pace / Time Goal',mileBestMins:'8',mileBestSecs:'15',mileBestSrc:{kind:'entered'},targetDist:'1.5',targetMins:'11',targetSecs:'0',paceUnit:'mi'}},liftingFocus:'balanced',experience:'intermediate',ageBracket:'18-35',equipment:'home_full',unit:'lbs',restDays:['sun','wed'],days:DAYS.slice(),bench:185,squat:255,deadlift:315,startDate:'2026-09-21',seed:24865};
if(MODE==='stand'){
  const p=IA.buildProgram(JSON.parse(JSON.stringify(STAND)));
  console.log('totalWeeks',p.totalWeeks);
  for(let w=1;w<=p.totalWeeks;w++) DAYS.forEach(d=>{const day=p.weeks[w][d];if(!day||!day.cardio)return;const c=day.cardio;if(!(c.dose&&c.dose.key==='long'))return;
    const m=mins(c.dose);console.log(`W${w} ${d} ${c.subtype} dose=${JSON.stringify(c.dose)} min=${m.toFixed(1)} hand=${tierOf(m)} title="${day.title}"`);
    (day.sections||[]).forEach(s=>console.log('   ['+s.label+'] '+(s.items||[]).map(i=>i.name+' {'+i.detail+'} e'+engN(i.detail)+'/d'+docN(i.detail)).join(' | ')));});
} else {
  // survey: all item detail heads on days whose card is a long key (NSW) or NRC long run
  const heads={}; let diffDays=0, days=0;
  const cfgs=[];
  ['run_pace_goal','run_mile_time','run_15_under10','run_base'].forEach(g=>[24865,1001,7007].forEach(seed=>['home_full','crossfit','bodyweight','full_gym'].forEach(eq=>['balanced','hypertrophy','support_prevention'].forEach(f=>{const c=JSON.parse(JSON.stringify(STAND));c.cardioGoals.run.id=g;c.seed=seed;c.equipment=eq;c.liftingFocus=f;cfgs.push(c);}))));
  cfgs.forEach(c=>{const p=IA.buildProgram(c);for(let w=1;w<=p.totalWeeks;w++)DAYS.forEach(d=>{const day=p.weeks[w][d];if(!day||!day.cardio||!day.cardio.dose||day.cardio.dose.key!=='long')return;days++;let dd=false;
    (day.sections||[]).forEach(s=>(s.items||[]).forEach(i=>{const h=String(i.detail||'').replace(/\d+/g,'N').slice(0,22);const k=h+(engN(i.detail)!==docN(i.detail)?'  <-- e'+engN(i.detail)+' d'+docN(i.detail):'');heads[k]=(heads[k]||0)+1;if(engN(i.detail)!==docN(i.detail))dd=true;}));if(dd)diffDays++;});});
  console.log('NSW long-key days',days,'with an engine/doctrine set-count split:',diffDays);
  Object.entries(heads).sort((a,b)=>b[1]-a[1]).slice(0,40).forEach(([k,v])=>console.log(String(v).padStart(6),k));
}
