'use strict';
// V211 / D155 follow-up to v211_d155_tierb_draw.js: are the zero-lift tier B days the recovery
// (deload) weeks? Oracle for "recovery week" = prog.liftRecoveryWeeks (the list the week badge
// reads), joined against hand tier B (dose minutes) and "zero lift sections" by label class.
// Also: on the loaded-full long day, what the card holds BEFORE recoveryDeload (instrumented hook).
// usage: node tests/measure/v211_d155_tierb_draw_deload.js <dir>   (needs d155_v210.html, d155_cf153.html from the main script)
const fs=require('fs'), path=require('path'), H=require(path.join(__dirname,'..','harness.js'));
const S=process.argv[2]; const P=(...a)=>console.log(...a);
const cl=o=>JSON.parse(JSON.stringify(o)), DAYS=H.DAYS;
const mins=d=>!d?0:d.k==='time'?(+d.mins||0):(+d.mi||0)*(+d.tgt||0)/60;
const tierB=c=>{ if(!c||!c.dose) return false; const m=mins(c.dose); if(c.isNRC&&/rehearsal/i.test(c.detail||'')) return false; return m>=45&&m<75; };
const isLong=c=>!!(c&&c.dose&&((c.isNRC&&/^long run/i.test(c.subtype||'')&&!/race day|time trial/i.test(c.subtype||''))||(!c.isNRC&&c.type==='run'&&c.dose.key==='long')));
const live=d=>(d.sections||[]).filter(s=>(s.items||[]).length);
const isLift=s=>!/taper/i.test(s.label||'')&&!(s.coreHeader||s.core||/^trunk|core/i.test(s.label||''))&&!/mobility|stretch/i.test(s.label||'');
const bump=(o,k)=>{o[k]=(o[k]||0)+1;};
const raw=fs.readFileSync(path.join(S,'d155_v210.html'),'utf8');
const A='function recoveryDeload(', c0=raw.split(A).length-1; P('recoveryDeload anchor count',c0); if(c0!==1) process.exit(2);
const src=raw.replace(A,()=>'function recoveryDeload(');
const L={v210:H.load(path.join(S,'d155_v210.html')),cf153:H.load(path.join(S,'d155_cf153.html'))};
// lattice: the zero-lift segments only (hypertrophy/strength × home_full/commercial), both limbs
const EXP=['beginner','intermediate','advanced'], RESTS=[['sun','wed'],['sat','sun'],['sun'],['mon','wed','fri'],['tue','thu','sun']];
const list=[];
for(const plan of ['run_5k','run_10k','run_half','run_marathon']) for(const e of EXP) for(const r of RESTS) for(const q of ['home_full','commercial']) for(const f of ['hypertrophy','strength','balanced']) for(const s of [76308,1234]) for(const dated of [true,false])
  list.push({limb:'NRC',seg:plan,c:Object.assign(cl(H.fixtures.HALF_MANNY),{cardioTypes:['run'],cardioGoals:{run:{id:plan,label:plan,mileBestMins:'8',mileBestSecs:'15',baselineDist:'5',baseline:'5mi'}},primaryPath:dated?'event':'fitness',eventTargeted:dated,raceDate:dated?'2027-01-17':'',startDate:'2026-09-21',liftingFocus:f,experience:e,equipment:q,restDays:r.slice(),seed:s})});
const STAND={name:'X',primaryPath:'goal',eventTargeted:false,cardioTypes:['run'],cardioGoals:{run:{id:'run_pace_goal',label:'x',mileBestMins:'8',mileBestSecs:'15',mileBestSrc:{kind:'entered'},targetDist:'1.5',targetMins:'11',targetSecs:'0',paceUnit:'mi'}},liftingFocus:'balanced',experience:'intermediate',ageBracket:'18-35',equipment:'home_full',unit:'lbs',restDays:['sun','wed'],days:DAYS.slice(),bench:185,squat:255,deadlift:315,startDate:'2026-09-21',seed:24865};
for(const g of ['run_pace_goal','run_mile_time','run_15_under10','run_base']) for(const mm of [['8','15'],['12','0']]) for(const f of ['hypertrophy','strength','balanced']) for(const q of ['home_full','commercial']) for(const r of RESTS) for(const e of EXP) for(const seed of [24865,1001]){
  const c=cl(STAND); c.cardioGoals.run.id=g; c.cardioGoals.run.mileBestMins=mm[0]; c.cardioGoals.run.mileBestSecs=mm[1]; c.liftingFocus=f; c.equipment=q; c.restDays=r.slice(); c.experience=e; c.seed=seed; list.push({limb:'NSW',seg:g,c}); }
const R={};
for(const x of list) for(const k of ['v210','cf153']){ const p=L[k].buildProgram(cl(x.c)); const rw=new Set(p.liftRecoveryWeeks||[]), tw=new Set(p.taperWeeks||[]);
  for(let w=1;w<=p.totalWeeks;w++) for(const d of DAYS){ const y=p.weeks[w][d]; if(!y||y.rest||!isLong(y.cardio)||!tierB(y.cardio)) continue;
    const role=/^Full Body/.test(y.title)?'full':'other'; const zl=live(y).filter(isLift).length===0;
    const wk=rw.has(w)?'recovery':tw.has(w)?'taper':'normal';
    bump(R,x.limb+' | '+k+' | '+wk+' | role '+role+' | focus '+x.c.liftingFocus+' | '+(zl?'ZERO-LIFT':'has lift'));
  } }
Object.keys(R).sort().forEach(k=>P(String(R[k]).padStart(7)+'  '+k));
P('configs',list.length);
// the deload rule, printed verbatim from the artifact
const i=raw.indexOf('function recoveryDeload('); P('\n--- recoveryDeload (artifact text) ---\n'+raw.slice(i,raw.indexOf('\n}\n',i)+2));
P('DONE');
