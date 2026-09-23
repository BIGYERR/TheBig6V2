// V208 measure (Mode B) — D104 HARD DAYS HARD on the NSW path. Before-picture on ia-version 205.
// Read-only. Question: where does heavy lower / hinge lifting land relative to the hard runs?
// ORACLES (independent of the placer):
//  - calendar adjacency: the renderer's own date map, _progDayDate :11025 / dayDateFor :17222 —
//    week w runs MON..SUN, so Sat(w)->Sun(w)->Mon(w+1). Computed here by index arithmetic.
//  - lower-lift day: the BUILT card — a "Main — <lift>" section whose lift is a squat/hinge/
//    lunge pattern by name (regex below), not dayRoles. Engine role (title Legs/Pull) is
//    printed alongside as a second lens, with the agreement rate.
//  - run class: the shipped subtype string. INT = "(INT)", CHI = "(CHI)", LSD = "Long Slow
//    Distance". The LONG LSD is the LSD with the most minutes in its detail that week
//    (miles x10 if no minutes), not legLoad.
const path=require('path');
const {load,weekGrid}=require(path.join(__dirname,'..','harness.js'));
const IA=load(path.join(__dirname,'..','..','index.html'));
const ISO=['mon','tue','wed','thu','fri','sat','sun'];
const ALL=['sun','mon','tue','wed','thu','fri','sat'];   // engine ALL_DAYS_ORDER :1872
const out=[];const P=s=>{out.push(s);console.log(s);};
P('ia-version '+IA.version);

const LOWER_MAIN=/squat|deadlift|\brdl\b|romanian|good morning|hip thrust|lunge|step-?up|\bclean\b|snatch|trap bar/i;
const HINGE_MAIN=/deadlift|\brdl\b|romanian|good morning|hip thrust|\bclean\b|snatch/i;
function stripSvg(n){return String(n||'').replace(/<svg[\s\S]*?<\/svg>\s*/g,'');}
function mainLift(day){
  const s=(day.sections||[]).find(x=>/^Main\s*—/.test(x.label||'')); if(!s) return null;
  return stripSvg((s.items||[])[0]&&s.items[0].name);
}
function cardios(day){ if(!day||!day.cardio) return []; return Array.isArray(day.cardio)?day.cardio:[day.cardio]; }
function mins(c){ const t=(c.detail||''); let m=t.match(/(\d+)\s*(?:-|–)?\s*min/); if(m) return +m[1];
  m=t.match(/([\d.]+)\s*(?:mi\b|mile)/); if(m) return +m[1]*10; return 0; }
// V208 fix after first run: run_base names its aerobic runs "Easy Run", "Easy Run + Strides",
// "Steady Aerobic Run"; all are the aerobic family. A subtype carrying "Long" is the long run
// outright; otherwise the week's longest aerobic run by minutes is.
function runClass(c){ const s=c.subtype||''; if(/\(INT\)/.test(s)) return 'INT'; if(/\(CHI\)/.test(s)) return 'CHI';
  if(/Long Slow Distance|\bLSD\b|Easy Run|Steady Aerobic|Long/.test(s)) return 'LSD'; return 'OTHER:'+s.replace(/ — .*/,''); }
const BIKE_HARD=/interval|\(CHI\)|sweet spot|threshold|vo2|ftp|tempo/i;

// Classify one program: returns array of per-day records over every week.
function classify(prog){
  const tw=prog.totalWeeks; const recs={};
  for(let w=1;w<=tw;w++){ const wk=prog.weeks[w]||{};
    // find the week's long LSD by minutes
    let longD=null,longM=-1;
    ISO.forEach(d=>cardios(wk[d]).forEach(c=>{ if(c.type==='run'&&runClass(c)==='LSD'){ const m=mins(c)+(/Long/.test((c.subtype||'').replace(/Long Slow Distance/,''))?1e6:0); if(m>=longM){longM=m;longD=d;} } }));
    ISO.forEach(d=>{ const day=wk[d]; const r={w,d,rest:!day||!!day.rest,run:null,hardBike:false,lower:false,hinge:false,role:(day&&day.title)||'',main:null,legLoadRun:false};
      if(day&&!day.rest){ const ml=mainLift(day); r.main=ml; r.lower=!!(ml&&LOWER_MAIN.test(ml)); r.hinge=!!(ml&&HINGE_MAIN.test(ml)); }
      cardios(day).forEach(c=>{ if(c.type==='run'){ let k=runClass(c); if(k==='LSD') k=(d===longD)?'LONG':'EASY'; r.run=k; r.legLoadRun=!!c.legLoad; r.sub=c.subtype; }
        if(c.type==='bike' && BIKE_HARD.test(c.subtype||'')) r.hardBike=true; if(c.type==='bike') r.bike=c.subtype; if(c.type==='swim') r.swim=c.subtype; });
      recs[w+'_'+d]=r; });
  }
  const at=(w,i)=>{ if(i<0){w--;i+=7;} if(i>6){w++;i-=7;} return recs[w+'_'+ISO[i]]||null; };
  return {recs,at,tw};
}
const HARD=k=>k==='INT'||k==='CHI';

// ── lattice ──
const GOALS={
  run_pace_goal:{types:['run'],g:{run:{id:'run_pace_goal',mileBestMins:'8',mileBestSecs:'15',mileBestSrc:{kind:'entered'},targetDist:'1.5',targetMins:'11',targetSecs:'0',paceUnit:'mi'}}},
  run_mile_time:{types:['run'],g:{run:{id:'run_mile_time',mileBestMins:'8',mileBestSecs:'15',targetDist:'1',targetMins:'7',targetSecs:'30',paceUnit:'mi'}}},
  run_base:{types:['run'],g:{run:{id:'run_base',mileBestMins:'8',mileBestSecs:'15',baseline:'2.5 miles'}}},
  'run_pace+swim_base':{types:['run','swim'],g:{run:{id:'run_pace_goal',mileBestMins:'8',mileBestSecs:'15',targetDist:'1.5',targetMins:'11',targetSecs:'0',paceUnit:'mi'},swim:{id:'swim_base'}}},
  'run_base+bike_base':{types:['run','bike'],g:{run:{id:'run_base',mileBestMins:'8',mileBestSecs:'15',baseline:'2.5 miles'},bike:{id:'bike_base'}}},
  'run_pace+bike_base':{types:['run','bike'],g:{run:{id:'run_pace_goal',mileBestMins:'8',mileBestSecs:'15',targetDist:'1.5',targetMins:'11',targetSecs:'0',paceUnit:'mi'},bike:{id:'bike_base'}}},
  bike_base:{types:['bike'],g:{bike:{id:'bike_base'}}},
  swim_base:{types:['swim'],g:{swim:{id:'swim_base'}}},
};
const EXP=['beginner','intermediate','advanced'];
const REST=[[],['sun'],['sat'],['sun','wed'],['sat','sun'],['mon','fri'],['sun','wed','sat'],['tue','thu','sat'],['sun','tue','thu','sat'],['mon','wed','fri','sun']];
const SEEDS=[24865,7,4242];
const WKOUT=[4,8,12];
const FOCUS=['balanced','support_strength'];
function mkCfg(gk,exp,rest,seed,wo,focus){
  const race=new Date('2026-09-21T00:00:00'); race.setDate(race.getDate()+wo*7);
  return {primaryPath:'event',eventTargeted:true,raceDate:race.toISOString().slice(0,10),cardioTypes:GOALS[gk].types.slice(),
    cardioGoals:JSON.parse(JSON.stringify(GOALS[gk].g)),liftingFocus:focus,experience:exp,ageBracket:'18-35',equipment:'home_full',unit:'lbs',
    restDays:rest.slice(),days:ALL.slice(),bench:185,squat:255,deadlift:315,name:'M',startDate:'2026-09-21',seed};
}
const CATS=['AFTER_LONG','SAME_HARD','SAME_INT','SAME_CHI','SAME_LONG','SAME_EASY','NO_RUN','BEFORE_HARD','AFTER_HARD','LSD_EVE','LONG_OR_EVE','SAME_HARDBIKE','BEFORE_HARDBIKE'];
function tally(T,key,flags){ T[key]=T[key]||{n:0}; T[key].n++; CATS.forEach(c=>{ if(flags[c]) T[key][c]=(T[key][c]||0)+1; }); }
function flagsFor(C,r){
  const i=ISO.indexOf(r.d); const prev=C.at(r.w,i-1), next=C.at(r.w,i+1);
  const f={};
  f.SAME_HARD=HARD(r.run); f.SAME_INT=r.run==='INT'; f.SAME_CHI=r.run==='CHI';
  f.SAME_LONG=r.run==='LONG'; f.SAME_EASY=r.run==='EASY'; f.NO_RUN=!r.run;
  f.BEFORE_HARD=!!(next&&HARD(next.run)); f.AFTER_HARD=!!(prev&&HARD(prev.run));
  f.LSD_EVE=!!(next&&next.run==='LONG'); f.LONG_OR_EVE=f.SAME_LONG||f.LSD_EVE;
  f.AFTER_LONG=!!(prev&&prev.run==='LONG');
  f.SAME_HARDBIKE=r.hardBike; f.BEFORE_HARDBIKE=!!(next&&next.hardBike);
  return f;
}
const T={all:{},goal:{},days:{},exp:{},focus:{},week:{},wo:{},hinge:{},role:{}};
let builds=0,crash=0,lowerDays=0,roleAgree=0,roleN=0,trainDaysTotal=0;
const subtypeVocab={};
// clamp-seam instrument: engine neighbour per hotNextHingeClampSweep :6534 / buildSections :10431
let seamHinge=0,seamDiverge=0; const DIG={};
Object.keys(GOALS).forEach(gk=>EXP.forEach(exp=>REST.forEach(rest=>SEEDS.forEach(seed=>WKOUT.forEach(wo=>FOCUS.forEach(focus=>{
  const cfg=mkCfg(gk,exp,rest,seed,wo,focus); let prog;
  try{prog=IA.buildProgram(cfg);}catch(e){crash++; if(crash<5)P('CRASH '+gk+' '+exp+' '+rest+' '+seed+': '+e.message); return;}
  builds++; const _dg=require(path.join(__dirname,'..','harness.js')).progDigest(prog); const _dk=[gk,exp,rest.join('+'),seed,focus].join('|'); DIG[_dk]=DIG[_dk]||new Set(); DIG[_dk].add(_dg);
  if(wo!==WKOUT[0]) return;   // weeks-out axis: digests compared below, lower-day counts taken once per distinct cfg
  const C=classify(prog);
  Object.values(C.recs).forEach(r=>{
    if(r.sub) subtypeVocab[r.sub]=(subtypeVocab[r.sub]||0)+1;
    if(r.rest) return; trainDaysTotal++;
    const roleHeavy=/^(Legs|Pull)\b/.test(r.role); if(r.main){ roleN++; if(roleHeavy===r.lower) roleAgree++; }
    if(r.hinge){ // seam: Sat reads next week's Sun, Sun reads same week's Mon
      const di=ALL.indexOf(r.d); const ew=di===6?r.w+1:r.w, ed=ALL[(di+1)%7];
      const eng=prog.weeks[ew]&&prog.weeks[ew][ed]; const i=ISO.indexOf(r.d); const cal=C.at(r.w,i+1);
      const engLL=cardios(eng).some(c=>c.legLoad); const calLL=!!(cal&&prog.weeks[cal.w]&&cardios(prog.weeks[cal.w][cal.d]).some(c=>c.legLoad));
      seamHinge++; if(engLL!==calLL) seamDiverge++;
    }
    if(!r.lower) return; lowerDays++;
    const f=flagsFor(C,r);
    tally(T.all,'ALL',f); tally(T.goal,gk,f); tally(T.days,String(7-rest.length)+'d',f); tally(T.exp,exp,f); tally(T.focus,focus,f);
    tally(T.week,r.w===1?'w1':(r.w===C.tw?'final':'mid'),f); tally(T.wo,wo+'wk',f); tally(T.hinge,r.hinge?'hinge-main':'squat/lunge-main',f);
    tally(T.role,r.role.replace(/ —.*/,''),f);
  });
}))))));
const LAT=Object.keys(GOALS).length*EXP.length*REST.length*SEEDS.length*WKOUT.length*FOCUS.length;
P('\n===== LATTICE =====');
const _multi=Object.values(DIG).filter(s=>s.size>1).length; P(`weeks-out axis: cfgs whose progDigest differs across raceDate 4/8/12 wk: ${_multi}/${Object.keys(DIG).length} (counts below are taken once per cfg at 4 wk)`);
P(`builds ${builds}/${LAT}  crashes ${crash}  training days ${trainDaysTotal}  lower-lift days (oracle) ${lowerDays}`);
P(`oracle vs engine role (title Legs/Pull) agreement on days with a Main: ${roleAgree}/${roleN}`);
P('run subtype vocabulary (heads): '+JSON.stringify(subtypeVocab));
function pr(title,obj){ P('\n-- '+title+' --  (each cell = count/denominator of lower-lift days; categories overlap)');
  P('key'.padEnd(20)+CATS.map(c=>c.padStart(16)).join(''));
  Object.keys(obj).forEach(k=>{ const o=obj[k]; P(k.padEnd(20)+CATS.map(c=>((o[c]||0)+'/'+o.n).padStart(16)).join('')); }); }
pr('ALL',T.all); pr('by goal',T.goal); pr('by training days',T.days); pr('by experience',T.exp); pr('by focus',T.focus);
pr('by week',T.week); pr('by weeks-out',T.wo); pr('by main pattern',T.hinge); pr('by engine role title',T.role);
P(`\nhinge-clamp seam (:6534/:10431 read Sat->next Sun, Sun->same-week Mon; calendar is Sat->Sun->next Mon): hinge-main days ${seamHinge}, days where engine-neighbour legLoad != calendar-neighbour legLoad: ${seamDiverge}`);

// ── MARIO: PRT TING ──
const mario={primaryPath:'event',eventTargeted:true,raceDate:'2026-10-19',cardioTypes:['run'],
 cardioGoals:{run:{id:'run_pace_goal',label:'Hit a Pace / Time Goal',mileBestMins:'8',mileBestSecs:'15',mileBestSrc:{kind:'entered'},targetDist:'1.5',targetMins:'11',targetSecs:'0',paceUnit:'mi'}},
 liftingFocus:'balanced',experience:'intermediate',ageBracket:'18-35',equipment:'home_full',unit:'lbs',restDays:['sun','wed'],days:ALL.slice(),
 bench:185,squat:255,deadlift:315,name:'PRT TING',startDate:'2026-09-21',seed:24865};
const mp=IA.buildProgram(mario); const MC=classify(mp); const MT={};
P('\n===== PRT TING (seed 24865, run_pace_goal, 5 days, rest sun+wed) totalWeeks='+mp.totalWeeks+' legRecoveryNote='+JSON.stringify(mp.legRecoveryNote));
for(let w=1;w<=MC.tw;w++){ P(' W'+w+'  '+ISO.map(d=>{const r=MC.recs[w+'_'+d]; if(!r||r.rest) return d+':REST'; return d+':'+(r.role.replace(/ —.*/,'').replace(/\s+/g,''))+(r.lower?(r.hinge?'[HINGE]':'[SQ]'):'')+'/'+(r.run||'-');}).join('  ')); }
Object.values(MC.recs).forEach(r=>{ if(!r.rest&&r.lower) tally(MT,'PRT_TING',flagsFor(MC,r)); });
pr('PRT TING lower-lift days',MT);
P('\nPRT TING week grid (weekGrid):'); P(weekGrid(mp));
// ── LENS 2: hinge / plyometric items in ANY section (not only Main) on long-run days and eves ──
// Oracle = item names. Primer/Taper sections excluded. Denominator = long-run days / eve days that are training days.
const ACC_HL=/swing|jump|bound|broad|deadlift|\brdl\b|romanian|\bclean\b|snatch|good morning|hip thrust/i;
const L2={}; const L2ex={};
function l2(prog,gk){ const C=classify(prog);
  Object.values(C.recs).forEach(r=>{ if(r.rest) return; const day=prog.weeks[r.w][r.d];
    const hits=(day.sections||[]).filter(x=>!/^(Primer|Taper)/.test(x.label||'')&&!x.core).flatMap(x=>(x.items||[]).map(i=>stripSvg(i.name))).filter(n=>ACC_HL.test(n));
    const i=ISO.indexOf(r.d), nx=C.at(r.w,i+1);
    const tags=[]; if(r.run==='LONG') tags.push('LONG_DAY'); if(nx&&nx.run==='LONG') tags.push('LONG_EVE'); if(HARD(r.run)) tags.push('HARD_DAY'); if(r.run==='EASY') tags.push('EASY_DAY');
    tags.forEach(t=>{ const k=gk+'|'+t; L2[k]=L2[k]||[0,0]; L2[k][1]++; if(hits.length){ L2[k][0]++; L2ex[t]=L2ex[t]||{}; hits.forEach(h=>L2ex[t][h]=(L2ex[t][h]||0)+1); } });
  }); }
Object.keys(GOALS).forEach(gk=>EXP.forEach(exp=>REST.forEach(rest=>SEEDS.forEach(seed=>FOCUS.forEach(focus=>{ l2(IA.buildProgram(mkCfg(gk,exp,rest,seed,4,focus)),gk); })))));
P('\n===== LENS 2: days carrying ANY hinge/plyo item (Main or accessory/finisher), by goal x day-kind (hits/days) =====');
Object.keys(L2).sort().forEach(k=>P('  '+k.padEnd(34)+(L2[k][0]+'/'+L2[k][1]).padStart(14)));
Object.keys(L2ex).forEach(t=>P('  top items on '+t+': '+JSON.stringify(Object.entries(L2ex[t]).sort((a,b)=>b[1]-a[1]).slice(0,8))));
P('\nPRINTED '+out.length+' LINES');
