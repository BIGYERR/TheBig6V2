// V208 before-picture RE-MEASURE on V207 (Mode B). Read-only. Rulings under build: D103a, D104a, D140.
// Usage: node tests/measure/v208_remeasure_on_v207.js [V206 artifact path for the D106a identity check]
// Sections:
//  (a) run_base hard-days lattice (v208_d104_hard_days.js lattice + classifier, verbatim logic),
//      V207 vs V206, plus the null legRecoveryNote count and a per-cfg digest identity V206==V207.
//  (b) dated pace programs: the trial card and the shakeout card(s), their fields, and what every
//      label reader returns on them. Oracle for "where the test is": date arithmetic from START.
//      Oracle for "which card is the shakeout": the PRE-PIN build (same cfg, _testWeek deleted,
//      same length), exactly as g207_gk_trial_present does; a day whose pre-pin run was INT/CHI and
//      whose pinned run is an LSD is a B4 substitution. The raceEveLiftPass title "Shakeout" is the
//      second lens.
//  (c) v209 C/D label experiment (source surgery at the CHI subtype literal), undated lattice as V205,
//      plus a dated sub-lattice to see whether trial/shakeout days move.
//  (d) STAND-IN for Mario's new pace program (PRT TING shape), undated and dated.
//  (e) MANNY_DIGEST_BY_VERSION rows 206/207 and HALF_MANNY digest.
const path=require('path'),fs=require('fs'),os=require('os');
const H=require(path.join(__dirname,'..','harness.js'));
const SRC=path.join(__dirname,'..','..','index.html');
const html=fs.readFileSync(SRC,'utf8');
const IA=H.load(SRC);
const V206P=process.argv[2]||null; const IA6=V206P?H.load(V206P):null;
const out=[];const P=s=>{out.push(s);console.log(s);};
P('ia-version '+IA.version+(IA6?'  | comparison artifact ia-version '+IA6.version:'  | no V206 artifact given'));
const ISO=['mon','tue','wed','thu','fri','sat','sun'];
const ALL=['sun','mon','tue','wed','thu','fri','sat'];
const clone=o=>JSON.parse(JSON.stringify(o));
const stripSvg=n=>String(n||'').replace(/<svg[\s\S]*?<\/svg>\s*/g,'');
const cardios=day=>(!day||!day.cardio)?[]:(Array.isArray(day.cardio)?day.cardio:[day.cardio]);
const E=IA.eval;

// ════════════════════ (a) ════════════════════
const LOWER_MAIN=/squat|deadlift|\brdl\b|romanian|good morning|hip thrust|lunge|step-?up|\bclean\b|snatch|trap bar/i;
const HINGE_MAIN=/deadlift|\brdl\b|romanian|good morning|hip thrust|\bclean\b|snatch/i;
function mainLift(day){ const s=(day.sections||[]).find(x=>/^Main\s*—/.test(x.label||'')); if(!s) return null; return stripSvg((s.items||[])[0]&&s.items[0].name); }
function mins(c){ const t=(c.detail||''); let m=t.match(/(\d+)\s*(?:-|–)?\s*min/); if(m) return +m[1]; m=t.match(/([\d.]+)\s*(?:mi\b|mile)/); if(m) return +m[1]*10; return 0; }
function runClass(c){ const s=c.subtype||''; if(/\(INT\)/.test(s)) return 'INT'; if(/\(CHI\)/.test(s)) return 'CHI';
  if(/Long Slow Distance|\bLSD\b|Easy Run|Steady Aerobic|Long/.test(s)) return 'LSD'; return 'OTHER:'+s.replace(/ — .*/,''); }
function classify(prog){
  const tw=prog.totalWeeks; const recs={};
  for(let w=1;w<=tw;w++){ const wk=prog.weeks[w]||{}; let longD=null,longM=-1;
    ISO.forEach(d=>cardios(wk[d]).forEach(c=>{ if(c.type==='run'&&runClass(c)==='LSD'){ const m=mins(c)+(/Long/.test((c.subtype||'').replace(/Long Slow Distance/,''))?1e6:0); if(m>=longM){longM=m;longD=d;} } }));
    ISO.forEach(d=>{ const day=wk[d]; const r={w,d,rest:!day||!!day.rest,run:null,lower:false,hinge:false,role:(day&&day.title)||''};
      if(day&&!day.rest){ const ml=mainLift(day); r.lower=!!(ml&&LOWER_MAIN.test(ml)); r.hinge=!!(ml&&HINGE_MAIN.test(ml)); }
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
function sectionA(IAx,tag){
  const T={}; const NUL={}; const DG={}; let builds=0,crash=0;
  Object.keys(GOALS).forEach(gk=>EXP.forEach(exp=>REST.forEach(rest=>SEEDS.forEach(seed=>WKOUT.forEach(wo=>FOCUS.forEach(focus=>{
    const cfg=mkCfg(gk,exp,rest,seed,wo,focus); let prog;
    try{prog=IAx.buildProgram(cfg);}catch(e){crash++; if(crash<4)P('CRASH '+tag+' '+gk+': '+e.message); return;}
    builds++; const k=[gk,exp,rest.join('+'),seed,wo,focus].join('|'); DG[k]=H.progDigest(prog);
    NUL[gk]=NUL[gk]||[0,0]; NUL[gk][1]++; if(prog.legRecoveryNote==null) NUL[gk][0]++;
    if(wo!==WKOUT[0]) return;
    const C=classify(prog); T[gk]=T[gk]||{lower:0,LONG_OR_EVE:0,SAME_LONG:0,LSD_EVE:0,SAME_HARD:0,wk1NoLong:0,cfgs:0};
    const t=T[gk]; t.cfgs++; if(!ISO.some(d=>C.recs['1_'+d]&&C.recs['1_'+d].run==='LONG')) t.wk1NoLong++;
    Object.values(C.recs).forEach(r=>{ if(r.rest||!r.lower) return; t.lower++;
      const i=ISO.indexOf(r.d), nx=C.at(r.w,i+1); const sl=r.run==='LONG', ev=!!(nx&&nx.run==='LONG');
      if(sl) t.SAME_LONG++; if(ev) t.LSD_EVE++; if(sl||ev) t.LONG_OR_EVE++; if(r.run==='INT'||r.run==='CHI') t.SAME_HARD++; });
  }))))));
  return {T,NUL,DG,builds,crash};
}
P('\n════ (a) run_base hard-days lattice: 4 goals x 3 exp x 10 rest x 3 seeds x 3 weeks-out x 2 focus = 2,160 builds per artifact ════');
P('    counts of lower-Main days taken at weeks-out 4 (as v208_d104_hard_days.js); null-note over all weeks-out');
const A7=sectionA(IA,'V207'); const A6=IA6?sectionA(IA6,'V206'):null;
[['V207',A7],['V206',A6]].forEach(([tag,A])=>{ if(!A) return;
  P(` ${tag}: builds ${A.builds} crashes ${A.crash}`);
  Object.keys(A.T).forEach(gk=>{ const t=A.T[gk];
    P(`   ${tag} ${gk.padEnd(20)} lower-Main on long run or its eve ${t.LONG_OR_EVE}/${t.lower} (same-day long ${t.SAME_LONG}, eve ${t.LSD_EVE}; on INT/CHI ${t.SAME_HARD})  wk1 with no long run ${t.wk1NoLong}/${t.cfgs} cfgs  legRecoveryNote null ${A.NUL[gk][0]}/${A.NUL[gk][1]}`); }); });
if(A6){ const byG={}; Object.keys(A7.DG).forEach(k=>{ const g=k.split('|')[0]; byG[g]=byG[g]||[0,0]; byG[g][1]++; if(A7.DG[k]===A6.DG[k]) byG[g][0]++; });
  P('   progDigest V206 == V207 per cfg: '+Object.keys(byG).map(g=>g+' '+byG[g][0]+'/'+byG[g][1]).join('  ')); }
{ const nb=A7.NUL['run_base'], nbb=A7.NUL['run_base+bike_base']; P(`   run_base family null legRecoveryNote (V207): ${nb[0]+nbb[0]}/${nb[1]+nbb[1]}`);
  if(A6){ const a=A6.NUL['run_base'], b=A6.NUL['run_base+bike_base']; P(`   run_base family null legRecoveryNote (V206): ${a[0]+b[0]}/${a[1]+b[1]}`); } }

// ════════════════════ (b) ════════════════════
P('\n════ (b) dated pace programs: trial + shakeout cards ════');
const HARD_SRC=(IA.js.match(/const HARD=(\/interval\|tempo[^\n;]*\/i);/)||[])[1];
const HALFSTEP_HARD=HARD_SRC?eval(HARD_SRC):null;
P('halfstep HARD regex read from source: '+HARD_SRC+'  (index.html line '+(html.split('\n').findIndex(l=>l.includes('const HARD=/interval|tempo'))+1)+')');
const RUN={id:'run_pace_goal',label:'Hit a Pace / Time Goal',mileBestMins:'8',mileBestSecs:'15',mileBestSrc:{kind:'entered'},targetDist:'1.5',targetMins:'11',targetSecs:'0',paceUnit:'mi'};
const MILE={id:'run_mile_time',mileBestMins:'8',mileBestSecs:'15',targetDist:'1',targetMins:'7',targetSecs:'30',paceUnit:'mi'};
const MIX={run:{types:['run']},'run+bike':{types:['run','bike'],x:{bike:{id:'bike_base'}}},'run+swim':{types:['run','swim'],x:{swim:{id:'swim_base'}}}};
const START=new Date(2026,9,5);   // Mon 2026-10-05, local
const isoOff=n=>{ const d=new Date(START); d.setDate(d.getDate()+n); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); };
const START_ISO=isoOff(0);
const TWS=[1,2,3,6]; const RESTB=REST; const SEEDB=[24865,7];
function mkDated(goal,mk,rest,tw,wd,seed,IAx){ const rd=isoOff(7*(tw-1)+wd);
  return {name:'GK',primaryPath:'event',eventTargeted:true,raceDate:rd,_testWeek:tw,_raceDateCappedWeeks:tw,
    cardioTypes:MIX[mk].types.slice(),cardioGoals:Object.assign({run:clone(goal)},clone(MIX[mk].x||{})),liftingFocus:'balanced',experience:'intermediate',
    ageBracket:'18-35',equipment:'home_full',unit:'lbs',restDays:rest.slice(),days:ALL.slice(),bench:185,squat:255,deadlift:315,startDate:START_ISO,seed}; }
const liftSecs=day=>(day&&day.sections||[]).filter(s=>(s.items||[]).length);
const cnt=(m,k)=>{m[k]=(m[k]||0)+1;};
const B={progs:0,crash:0,twAgree:0,trialsPerProg:{},trialPlace:{},trialSub:{},trialDoseK:{},trialLegLoad:{},trialTitle:{},trialLiftSecs:{},trialSecs:{},
  b4:0,b4Sub:{},b4LegLoad:{},b4Title:{},b4Lift:{},b4DoseK:{},shkTitle:0,shkSub:{},shkLegLoad:{},shkLift:{},shkDose:{},trialW1:0,trialW1Shape:{}};
const samples={trial:[],b4:[],shk:[]}; const readerSeen={};
function readers(card,kind){
  const sub=card.subtype||'', det=card.detail||'';
  const r={
    runSessionCode:E('runSessionCode')(sub), _runClass:E('_runClass')(sub), _cardioInterference:E('_cardioInterference')(card),
    halfstepHARD_regex:HALFSTEP_HARD?HALFSTEP_HARD.test(sub+' '+det):'n/a', halfstep_isHardH:!!(card.legLoad||(HALFSTEP_HARD&&HALFSTEP_HARD.test(sub+' '+det))),
    _longRunTier:E('_longRunTier')(card),
    nrcRunShape_speedRx:/^(Interval \(INT\)|Continuous High Intensity \(CHI\))/.test(sub),
    nrcRunShape_role:(()=>{ const s=E('_nrcRunShape')({mon:card},['mon']); if(!s) return 'null(no long)'; return s.long==='mon'?'long':s.speed.has('mon')?'speed':'easy'; })(),
    raceEvePass_finder_RACEDAY_TIMETRIAL:/RACE DAY|TIME TRIAL/i.test(sub), pin_finder:/RACE DAY|TIME TRIAL/.test(sub)
  };
  const key=kind+' '+JSON.stringify(r); readerSeen[key]=(readerSeen[key]||0)+1;
}
[RUN,MILE].forEach(goal=>Object.keys(MIX).forEach(mk=>RESTB.forEach(rest=>TWS.forEach(tw=>[0,1,2,3,4,5,6].forEach(wd=>SEEDB.forEach(seed=>{
  const cfg=mkDated(goal,mk,rest,tw,wd,seed); let p,pre;
  try{ p=clone(IA.buildProgram(clone(cfg))); const pc=clone(cfg); delete pc._testWeek; pre=clone(IA.buildProgram(pc)); }catch(e){ B.crash++; if(B.crash<4) P('CRASH (b) '+e.message); return; }
  B.progs++; if(E('testWeekIndex')(START_ISO,cfg.raceDate)===tw) B.twAgree++;
  const td=ISO[(wd)%7];   // START is a Monday, so offset wd is ISO[wd]
  const trials=[];
  Object.keys(p.weeks).forEach(w=>ISO.forEach(d=>cardios(p.weeks[w][d]).forEach(c=>{ if(/TIME TRIAL/.test(c.subtype||'')) trials.push({w:+w,d,c,day:p.weeks[w][d]}); })));
  cnt(B.trialsPerProg,trials.length);
  trials.forEach(t=>{ cnt(B.trialPlace,(t.w===tw&&t.d===td)?'on test week+weekday':'ELSEWHERE'); cnt(B.trialSub,t.c.subtype); cnt(B.trialDoseK,JSON.stringify(Object.keys(t.c.dose||{}))+' k='+(t.c.dose&&t.c.dose.k));
    cnt(B.trialLegLoad,String(t.c.legLoad)); cnt(B.trialTitle,t.day.title); cnt(B.trialLiftSecs,liftSecs(t.day).length); cnt(B.trialSecs,(t.day.sections||[]).length);
    if(samples.trial.length<3) samples.trial.push({mk,goal:goal.id,rest:rest.join('+'),tw,td,card:t.c,title:t.day.title});
    readers(t.c,'TRIAL');
    if(t.w===1){ B.trialW1++; const sh=E('_nrcRunShape')(Object.fromEntries(ISO.map(d=>[d,cardios(p.weeks[1][d]).find(c=>c.type==='run')||null])),ISO.filter(d=>!rest.includes(d)));
      cnt(B.trialW1Shape,!sh?'null':(sh.long===t.d?'trial read as LONG':'long='+sh.long)); } });
  // shakeout lens 1: B4 substitutions (pre-pin INT/CHI -> pinned LSD) in weeks tw-1..tw
  [tw-1,tw].forEach(w=>{ if(w<1) return; ISO.forEach(d=>{ const a=cardios(pre.weeks[w]&&pre.weeks[w][d]).find(c=>c.type==='run'), b=cardios(p.weeks[w]&&p.weeks[w][d]).find(c=>c.type==='run');
    if(a&&b&&/\((INT|CHI)\)/.test(a.subtype||'')&&!/\((INT|CHI)\)|TIME TRIAL/.test(b.subtype||'')){ B.b4++; const day=p.weeks[w][d];
      cnt(B.b4Sub,b.subtype); cnt(B.b4LegLoad,String(b.legLoad)); cnt(B.b4Title,day.title); cnt(B.b4Lift,liftSecs(day).length); cnt(B.b4DoseK,b.dose?b.dose.k:'none');
      if(samples.b4.length<3) samples.b4.push({mk,goal:goal.id,rest:rest.join('+'),tw,td,w,d,pre:a.subtype,card:b,title:day.title}); readers(b,'B4-EASY'); } }); });
  // shakeout lens 2: raceEveLiftPass title
  Object.keys(p.weeks).forEach(w=>ISO.forEach(d=>{ const day=p.weeks[w][d]; if(day&&day.title==='Shakeout'){ B.shkTitle++; const c=cardios(day).find(x=>x.type==='run')||{};
    cnt(B.shkSub,c.subtype); cnt(B.shkLegLoad,String(c.legLoad)); cnt(B.shkLift,liftSecs(day).length); cnt(B.shkDose,c.dose?c.dose.k:'none');
    if(samples.shk.length<3) samples.shk.push({mk,goal:goal.id,rest:rest.join('+'),tw,td,w,d,card:c}); readers(c,'SHAKEOUT-TITLE'); } }));
}))))));
P(`dated lattice: 2 goals x 3 mixes x 10 rest x 4 test weeks {1,2,3,6} x 7 test weekdays x 2 seeds = ${B.progs} programs (crashes ${B.crash}); engine testWeekIndex agrees with date arithmetic ${B.twAgree}/${B.progs}`);
P(' TRIAL  per program: '+JSON.stringify(B.trialsPerProg)+'  placement: '+JSON.stringify(B.trialPlace));
P('        subtype: '+JSON.stringify(B.trialSub)); P('        dose keys: '+JSON.stringify(B.trialDoseK)+'  legLoad: '+JSON.stringify(B.trialLegLoad));
P('        day title: '+JSON.stringify(B.trialTitle)+'  lift sections (with items): '+JSON.stringify(B.trialLiftSecs)+'  sections total: '+JSON.stringify(B.trialSecs));
P('        trial in week 1: '+B.trialW1+'  -> _nrcRunShape on the real W1: '+JSON.stringify(B.trialW1Shape));
samples.trial.forEach(s=>P('        sample '+JSON.stringify(s)));
P(` B4 EASY SUBSTITUTE (pre-pin INT/CHI -> pinned non-quality run, weeks tw-1..tw): ${B.b4} cards`);
P('        subtype: '+JSON.stringify(B.b4Sub)+'  legLoad: '+JSON.stringify(B.b4LegLoad)+'  dose.k: '+JSON.stringify(B.b4DoseK));
P('        day title: '+JSON.stringify(B.b4Title)+'  lift sections: '+JSON.stringify(B.b4Lift));
samples.b4.forEach(s=>P('        sample '+JSON.stringify(s)));
P(` "Shakeout"-TITLED DAYS (raceEveLiftPass :10706): ${B.shkTitle} over ${B.progs} programs`);
P('        subtype: '+JSON.stringify(B.shkSub)+'  legLoad: '+JSON.stringify(B.shkLegLoad)+'  dose.k: '+JSON.stringify(B.shkDose)+'  lift sections: '+JSON.stringify(B.shkLift));
samples.shk.forEach(s=>P('        sample '+JSON.stringify(s)));
P(' READER RESULTS on these cards (distinct result vectors x count):');
Object.keys(readerSeen).forEach(k=>P('   '+readerSeen[k]+'x  '+k));
// Source scan: every regex literal / indexOf token on a code line that reads .subtype or .title, comments stripped,
// tested against the strings the new cards and the D103a rename carry.
P('\n (b2) SOURCE SCAN: label readers (lines reading .subtype/.title with a regex .test/.exec/.match or indexOf), // comments stripped');
const PROBE={TRIAL:'1.5 Mile Test — TIME TRIAL',MILETRIAL:'1 Mile Test — TIME TRIAL',LSD:'Long Slow Distance (LSD)',TITLE_TEST:'Test Day',TITLE_SHAKE:'Shakeout',CHI:'Continuous High Intensity (CHI)',LI:'Long Interval (LI)',INT:'Interval (INT)',SI:'Short Interval (SI)'};
const hitsBy={}; let scanned=0;
html.split('\n').forEach((ln,i)=>{ const code=ln.replace(/(^|[^:'"\\])\/\/.*$/,'$1'); if(!/(subtype|\.title)\b/.test(code)) return;
  const rx=[...code.matchAll(/\/((?:\\.|\[[^\]\n]*\]|[^\/\\\n\[*])(?:\\.|\[[^\]\n]*\]|[^\/\\\n\[])*)\/([gimsuy]*)(?=\s*\.(?:test|exec)\(|\)|\s*,)/g)].map(m=>{ try{return new RegExp(m[1],m[2]);}catch(e){return null;} }).filter(r=>r&&/[A-Za-z]{3}/.test(r.source));
  const io=[...code.matchAll(/indexOf\('([^']+)'\)/g)].map(m=>m[1]);
  if(!rx.length&&!io.length) return; scanned++;
  const hit=[]; Object.keys(PROBE).forEach(k=>{ const s=PROBE[k]; if(rx.some(r=>{r.lastIndex=0;return r.test(s);})||io.some(t=>s.toLowerCase().indexOf(t)>=0)) hit.push(k); });
  const key=hit.join(',')||'-'; hitsBy[key]=hitsBy[key]||[]; hitsBy[key].push(i+1);
  if(hit.some(h=>/TRIAL|TITLE/.test(h))) P('   :'+(i+1)+' ['+hit.join(',')+']  '+code.trim().slice(0,150));
});
P('   lines scanned '+scanned+'; hit-vector -> line count: '+JSON.stringify(Object.fromEntries(Object.entries(hitsBy).map(([k,v])=>[k,v.length]))));
['CHI','LI','INT','SI'].forEach(k=>P('   lines whose readers match '+k+': '+Object.entries(hitsBy).filter(([h])=>h.split(',').includes(k)).flatMap(([,v])=>v).sort((a,b)=>a-b).join(',')));

// ════════════════════ (c) ════════════════════
P('\n════ (c) v209 C/D label experiment on V207 ════');
const OLD='Continuous High Intensity (CHI)';
const C_ANC="    subtype = 'Continuous High Intensity (CHI)' + (isTaperWeek ? ' — Taper' : '');";
function surg(name,edits){ let h=html; edits.forEach(([a,b])=>{ const n=h.split(a).length-1; if(n!==1) throw new Error(name+': anchor count '+n); h=h.replace(a,b); });
  const f=path.join(os.tmpdir(),'v208re_'+name+'.html'); fs.writeFileSync(f,h); return H.load(f); }
P('anchor count at CHI literal (index.html:'+(html.split('\n').findIndex(l=>l===C_ANC)+1)+'): '+(html.split(C_ANC).length-1));
const VC=surg('C',[[C_ANC,C_ANC.replace(OLD,'Long Interval (LI)')]]), VD=surg('D',[[C_ANC,C_ANC.replace(OLD,'Zqx Session (ZQX)')]]);
const RUNG={
  run_pace_goal:{run:{id:'run_pace_goal',mileBestMins:'8',mileBestSecs:'15',targetDist:'1.5',targetMins:'11',targetSecs:'0',paceUnit:'mi'}},
  run_mile_time:{run:{id:'run_mile_time',mileBestMins:'8',mileBestSecs:'15',targetDist:'1',targetMins:'7',targetSecs:'30',paceUnit:'mi'}},
  run_base:{run:{id:'run_base',mileBestMins:'8',mileBestSecs:'15',baseline:'2.5 miles'}},
  run_5k:{run:{id:'run_5k',mileBestMins:'10',mileBestSecs:'30',baselineDist:'3',baseline:'3mi'}},
  run_10k:{run:{id:'run_10k',mileBestMins:'10',mileBestSecs:'30',baselineDist:'4',baseline:'4mi'}},
  run_half:{run:{id:'run_half',mileBestMins:'10',mileBestSecs:'30',baselineDist:'5',baseline:'5mi'}},
  run_marathon:{run:{id:'run_marathon',mileBestMins:'10',mileBestSecs:'30',baselineDist:'8',baseline:'8mi'}},
  'run_pace+swim':{run:{id:'run_pace_goal',mileBestMins:'8',mileBestSecs:'15',targetDist:'1.5',targetMins:'11',targetSecs:'0',paceUnit:'mi'},swim:{id:'swim_base'}},
  'run_pace+bike':{run:{id:'run_pace_goal',mileBestMins:'8',mileBestSecs:'15',targetDist:'1.5',targetMins:'11',targetSecs:'0',paceUnit:'mi'},bike:{id:'bike_base'}},
  bike_base:{bike:{id:'bike_base'}}, swim_base:{swim:{id:'swim_base'}} };
function mk9(gk,exp,rest,seed,focus){ const nrc=/^run_(5k|10k|half|marathon)$/.test(gk);
  return {primaryPath:'event',eventTargeted:true,raceDate:nrc?'2026-12-06':'2026-10-19',cardioTypes:Object.keys(RUNG[gk]),cardioGoals:clone(RUNG[gk]),
   liftingFocus:focus,experience:exp,ageBracket:'18-35',equipment:'home_full',unit:'lbs',restDays:rest.slice(),days:ALL.slice(),bench:185,squat:255,deadlift:315,name:'M',startDate:'2026-09-21',seed}; }
function cards(prog){ const m={}; Object.keys(prog.weeks).forEach(w=>ISO.forEach(d=>{ const x=prog.weeks[w][d]; if(x) m[w+'_'+d]=x; })); return m; }
const strip=o=>JSON.stringify(o,(k,v)=>(k==='id'||k==='created'||k==='_swapUniverse'||k==='_swapUniverseByKey')?undefined:v);
function diff(pa,pb,map){ const a=cards(pa),b=cards(pb); const ch=[]; Object.keys(a).forEach(k=>{ let sb=strip(b[k]); if(map) sb=sb.split(map).join(OLD); if(strip(a[k])!==sb) ch.push(k); }); return ch; }
const RC={C:{p:0,d:0,g:{}},D:{p:0,d:0,g:{}}}; let N9=0,D9=0,chiN=0;
Object.keys(RUNG).forEach(gk=>EXP.forEach(exp=>REST.forEach(rest=>SEEDS.forEach(seed=>FOCUS.forEach(focus=>{
  const cfg=mk9(gk,exp,rest,seed,focus); const b=IA.buildProgram(clone(cfg)), c=VC.buildProgram(clone(cfg)), d=VD.buildProgram(clone(cfg));
  N9++; const cb=cards(b); D9+=Object.keys(cb).length; Object.values(cb).forEach(x=>cardios(x).forEach(s=>{ if(/\(CHI\)/.test(s.subtype||'')) chiN++; }));
  [['C',c,'Long Interval (LI)'],['D',d,'Zqx Session (ZQX)']].forEach(([k,pp,map])=>{ const ch=diff(b,pp,map); const r=RC[k]; r.g[gk]=r.g[gk]||0; if(ch.length){ r.p++; r.d+=ch.length; r.g[gk]++; } });
})))));
P(`undated lattice ${N9} programs, ${D9} day cards, ${chiN} CHI sessions`);
['C','D'].forEach(k=>P(`  BASE -> ${k} (${k==='C'?'"Long Interval (LI)"':'"Zqx Session (ZQX)"'}), label-normalised: programs changed ${RC[k].p}/${N9}, day cards changed ${RC[k].d}/${D9}; by goal ${JSON.stringify(RC[k].g)}`));
// dated sub-lattice: do the trial / shakeout days move under the rename?
{ let n=0,pc=0,dc=0,trialCh=0,trialN=0,b4Ch=0,shkCh=0,shkN=0; const where={};
  [RUN,MILE].forEach(goal=>Object.keys(MIX).forEach(mk=>RESTB.forEach(rest=>TWS.forEach(tw=>[0,3,5].forEach(wd=>{
    const cfg=mkDated(goal,mk,rest,tw,wd,24865); const b=clone(IA.buildProgram(clone(cfg)));
    [['D',VD,'Zqx Session (ZQX)'],['C',VC,'Long Interval (LI)']].forEach(([k,V,map])=>{ const pp=clone(V.buildProgram(clone(cfg))); const ch=diff(b,pp,map);
      if(k==='D'){ n++; if(ch.length){pc++; dc+=ch.length;} }
      Object.keys(cards(b)).forEach(key=>{ const day=cards(b)[key]; const isT=cardios(day).some(c=>/TIME TRIAL/.test(c.subtype||'')), isS=day.title==='Shakeout';
        if(k==='D'){ if(isT) trialN++; if(isS) shkN++; }
        if(ch.includes(key)){ if(isT) trialCh++; if(isS) shkCh++; cnt(where,k+' '+(isT?'trial':isS?'shakeout':'other')); } });
    });
  })))));
  P(`  dated sub-lattice ${n} programs (2 goals x 3 mixes x 10 rest x 4 tw x 3 weekdays, seed 24865): BASE->D programs changed ${pc}/${n}, day cards ${dc}`);
  P(`  changed days by kind (C and D): ${JSON.stringify(where)}; trial days ${trialN} (changed across C+D ${trialCh}), Shakeout-titled days ${shkN} (changed ${shkCh})`); }

// ════════════════════ (d) ════════════════════
P('\n════ (d) STAND-IN for Mario\'s new pace program (PRT TING shape; real cfg unknown) ════');
const SI_BASE={primaryPath:'event',cardioTypes:['run'],cardioGoals:{run:clone(RUN)},liftingFocus:'balanced',experience:'intermediate',ageBracket:'18-35',
  equipment:'home_full',unit:'lbs',restDays:['sun','wed'],days:ALL.slice(),bench:185,squat:255,deadlift:315,name:'STAND-IN',startDate:'2026-09-28',seed:24865};
const goalLen=E('calcProgramLength')(['run'],{run:clone(RUN),_experience:'intermediate',_ageBracket:'18-35',_eventTargeted:true},'balanced').weeks;
const SI_U=Object.assign(clone(SI_BASE),{eventTargeted:false,raceDate:null});
const SI_RD='2026-10-26';   // Monday, date arithmetic: 2026-09-28 + 28 days -> week 5, weekday Mon (PRT TING's offset: start 09-21, test Mon 10-19)
const SI_TW=Math.floor((Date.UTC(2026,9,26)-Date.UTC(2026,8,28))/864e5/7)+1;
const SI_D=Object.assign(clone(SI_BASE),{eventTargeted:true,raceDate:SI_RD,_testWeek:SI_TW,_raceDateCappedWeeks:SI_TW});
P(`goal length (calcProgramLength) ${goalLen}; dated variant test ${SI_RD} -> week ${SI_TW} by date arithmetic; engine testWeekIndex ${E('testWeekIndex')('2026-09-28',SI_RD)}`);
[['STAND-IN undated',SI_U],['STAND-IN dated (test Mon '+SI_RD+')',SI_D]].forEach(([tag,cfg])=>{
  const p=IA.buildProgram(clone(cfg));
  P(`\n -- ${tag}: totalWeeks ${p.totalWeeks}, digest ${H.progDigest(p)}, legRecoveryNote ${JSON.stringify(p.legRecoveryNote)}`);
  P('    W1: '+ISO.map(d=>{ const x=p.weeks[1][d]; if(!x||x.rest) return d+':REST'; const r=cardios(x).find(c=>c.type==='run'); const ml=mainLift(x);
    return d+':'+String(x.title).replace(/\s+/g,'')+(ml&&LOWER_MAIN.test(ml)?(HINGE_MAIN.test(ml)?'[HINGE]':'[SQ]'):'')+'/'+(r?(r.subtype.replace(/ — .*/,'')+(r.legLoad?'*LL':'')):'-'); }).join('  '));
  P('    W1 Main lifts: '+ISO.map(d=>{ const x=p.weeks[1][d]; return x&&!x.rest?d+'='+(mainLift(x)||'-'):null; }).filter(Boolean).join(' | '));
  P('    Saturday run by week (subtype | legLoad | dose | minutes: dose-derived [time mins, or mi*tgt/60 as _longRunTier reads] / detail-parsed):');
  for(let w=1;w<=p.totalWeeks;w++){ const x=p.weeks[w]&&p.weeks[w].sat; const r=cardios(x).find(c=>c.type==='run');
    if(!r){ P(`     W${w} sat: ${x?(x.title+' (no run)'):'REST/none'}`); continue; }
    const d=r.dose||{}; const dm=d.k==='time'?(+d.mins||0):(+d.mi||0)*(+d.tgt||0)/60;
    const dt=(r.detail||'').match(/(\d+)\s*(?:-|–)?\s*min/); const dmi=(r.detail||'').match(/([\d.]+)\s*(?:mi\b|mile)/);
    P(`     W${w} sat: ${r.subtype} | legLoad ${r.legLoad} | dose ${JSON.stringify(d)} | dose-min ${dm?dm.toFixed(1):'n/a'} / detail ${dt?dt[1]+' min':dmi?dmi[1]+' mi':'n/a'} | title ${x.title} | lift sections ${liftSecs(x).length} | isNRC ${!!r.isNRC} -> _longRunTier today ${E('_longRunTier')(r)}`); }
  P('    weekGrid:\n'+H.weekGrid(p).split('\n').slice(0,14).join('\n'));
});

// ════════════════════ (e) ════════════════════
P('\n════ (e) HALF_MANNY digest table ════');
const M=H.MANNY_DIGEST_BY_VERSION; const mg=H.progDigest(IA.buildProgram(IA.fixtures.HALF_MANNY)), mg2=H.progDigest(IA.buildProgram(IA.fixtures.HALF_MANNY));
P(`row 206: ${JSON.stringify(M[206])}  row 207: ${JSON.stringify(M[207])}  ('206' in table: ${206 in M}, '207' in table: ${207 in M})`);
P(`HALF_MANNY on V207: ${mg}  self-stable: ${mg===mg2}  equals row[207]: ${mg===M[207]}  equals 0ac7da6b1691a8e1: ${mg==='0ac7da6b1691a8e1'}`);
if(IA6) P(`HALF_MANNY on V206: ${H.progDigest(IA6.buildProgram(IA6.fixtures.HALF_MANNY))}`);
P('\nPRINTED '+out.length+' LINES');

// ════════════════════ addendum (same run) ════════════════════
// (a2) engine lens for "week 1 has no long run": no W1 run carries legLoad (what deconflictLegLiftDays :6991 reads).
P('\n════ (a2) run_base W1 legLoad lens (all weeks-out, 540 cfgs per goal) ════');
['run_base','run_base+bike_base'].forEach(gk=>{ let n=0,noLL=0,nullNote=0,both=0;
  EXP.forEach(exp=>REST.forEach(rest=>SEEDS.forEach(seed=>WKOUT.forEach(wo=>FOCUS.forEach(focus=>{ const p=IA.buildProgram(mkCfg(gk,exp,rest,seed,wo,focus)); n++;
    const ll=ISO.some(d=>!rest.includes(d)&&cardios(p.weeks[1][d]).some(c=>c.legLoad)); if(!ll) noLL++; if(p.legRecoveryNote==null){ nullNote++; if(!ll) both++; } })))));
  P(`  ${gk}: W1 with no legLoad run on a train day ${noLL}/${n}; null legRecoveryNote ${nullNote}/${n}; null AND no-legLoad ${both}`); });
// (b3) trial-in-W1 _nrcRunShape null cases: is the test weekday a declared rest day?
{ const t={}; [RUN,MILE].forEach(goal=>Object.keys(MIX).forEach(mk=>RESTB.forEach(rest=>[0,1,2,3,4,5,6].forEach(wd=>SEEDB.forEach(seed=>{
    const p=IA.buildProgram(clone(mkDated(goal,mk,rest,1,wd,seed))); const td=ISO[wd]; const td_rest=rest.includes(td);
    const wk1=Object.fromEntries(ISO.map(d=>[d,cardios(p.weeks[1][d]).find(c=>c.type==='run')||null])); const sh=E('_nrcRunShape')(wk1,ISO.filter(d=>!rest.includes(d)));
    cnt(t,(td_rest?'test on declared rest day':'test on train day')+' -> '+(!sh?'null':sh.long===td?'trial=LONG':'long elsewhere')); })))));
  P('\n════ (b3) tw=1 programs, _nrcRunShape on real W1 by test-day kind ════\n  '+JSON.stringify(t)); }
// (b4) BROAD source scan: every regex literal in code (comments stripped), any line, tested against the new strings.
P('\n════ (b4) broad scan: every regex literal in index.html code that matches a probe string ════');
{ const PR={TRIAL:'1.5 Mile Test — TIME TRIAL',TITLE_TEST:'Test Day',TITLE_SHAKE:'Shakeout',CHI:'Continuous High Intensity (CHI)',LI:'Long Interval (LI)',SI:'Short Interval (SI)',INT:'Interval (INT)'};
  const res={}; let nrx=0;
  const lines=html.split('\n'); const s0=lines.findIndex(l=>/<script>\s*$/.test(l)||/<script>/.test(l));
  lines.forEach((ln,i)=>{ if(i<s0) return; const code=ln.replace(/(^|[^:'"\\])\/\/.*$/,'$1');
    for(const m of code.matchAll(/(^|[=(,:!&|?;{}\s])\/((?:\\.|\[[^\]\n]*\]|[^\/\\\n\[*])(?:\\.|\[[^\]\n]*\]|[^\/\\\n\[])*)\/([gimsuy]*)/g)){
      let r; try{ r=new RegExp(m[2],m[3].replace('g','')); }catch(e){ continue; } if(!/[A-Za-z]{3}/.test(r.source)) continue; nrx++;
      Object.keys(PR).forEach(k=>{ if(r.test(PR[k])){ res[k]=res[k]||[]; res[k].push(':'+(i+1)+' '+r.toString().slice(0,90)); } }); } });
  P('  regex literals scanned: '+nrx);
  Object.keys(res).forEach(k=>{ P(`  ${k} matched by ${res[k].length} literals:`); res[k].forEach(x=>P('     '+x)); }); }
P('\nPRINTED '+out.length+' LINES');

// (b5) halfstep HARD regex (:7537) on NSW easy runs (legLoad false, run, not NRC): the regex reads subtype+detail,
// so easy-run copy can trip it. Undated (c) lattice, run goals only. Optional 3rd arg: V205 artifact.
P('\n════ (b5) halfstep HARD regex on legLoad:false NSW run cards ════');
{ const arts=[['V207',IA]]; if(IA6) arts.push(['V206',IA6]); if(process.argv[3]) arts.push(['V205',H.load(process.argv[3])]);
  arts.forEach(([tag,IAx])=>{ const src=(IAx.js.match(/const HARD=(\/interval\|tempo[^\n;]*\/i);/)||[])[1]; const RX=eval(src); const g={}; const tok={};
    ['run_pace_goal','run_mile_time','run_base','run_pace+bike'].forEach(gk=>EXP.forEach(exp=>REST.forEach(rest=>SEEDS.forEach(seed=>{
      const p=IAx.buildProgram(mk9(gk,exp,rest,seed,'balanced')); g[gk]=g[gk]||[0,0];
      Object.values(cards(p)).forEach(day=>cardios(day).forEach(c=>{ if(c.type!=='run'||c.isNRC||c.legLoad) return; g[gk][1]++; const s=(c.subtype||'')+' '+(c.detail||'');
        if(RX.test(s)){ g[gk][0]++; const m=s.match(RX); cnt(tok,m[0].toLowerCase()); } })); })))); 
    P(`  ${tag}: `+Object.keys(g).map(k=>k+' '+g[k][0]+'/'+g[k][1]).join('  ')+'   matched token: '+JSON.stringify(tok)); }); }
P('\nPRINTED '+out.length+' LINES');
