// v205 — part 2: raw getCHI via source surgery on a COPY, per-goal segmentation of the
// CHI population, and what each of the three readers actually CONSUMES from getCHI.
// READ-ONLY. index.html is never written.
const fs=require('fs'), path=require('path'), os=require('os');
const H=require(path.join(__dirname,'..','harness.js'));
const SRC=path.join(__dirname,'..','..','index.html');
const ALL=['sun','mon','tue','wed','thu','fri','sat'];
const say=(...a)=>console.log(...a);

// surgery: hang getCHI off an ALREADY-exported object so the harness can see it.
const ANCH="function getCHI(week, totalWeeks, isMilGoal, phaseFrom, phaseTo) {";
const html=fs.readFileSync(SRC,'utf8');
const n=html.split(ANCH).length-1;
say('anchor count == '+n+(n===1?' (ok)':' — NOT 1, aborted'));
if(n!==1) process.exit(2);
const patched=html.replace(ANCH, ANCH)  // no-op; we append after the function body instead
  .replace("function isCardioCutbackWeek(week, totalWeeks){",
           "function isCardioCutbackWeek(week, totalWeeks){");
// append an exporter right before the exportShim by piggybacking on SPORT_CEILINGS
const ANCH2="const SPORT_CEILINGS";
const n2=patched.split(ANCH2).length-1;
say('SPORT_CEILINGS anchor count == '+n2);
const out=path.join(os.tmpdir(),'ia_v205_chi_probe.html');
if(fs.existsSync(out)) fs.unlinkSync(out);
// inject the probe assignment immediately after getCHI's closing "  return at(week);\n}"
const TAIL="  return at(week);\n}";
const n3=patched.split(TAIL).length-1;
say('getCHI tail anchor count == '+n3);
if(n3!==1){ say('ABORT: tail anchor not unique'); process.exit(2); }
fs.writeFileSync(out, patched.replace(TAIL, TAIL+"\nglobalThis.__probe_getCHI=getCHI;globalThis.__probe_cut=isCardioCutbackWeek;\n"));
const IA=H.load(out);
const G=IA.ctx.__probe_getCHI;
const CUT=IA.ctx.__probe_cut;
say('probe wired: getCHI='+(typeof G)+'  isCardioCutbackWeek='+(typeof CUT));
if(typeof G!=='function'){ say('MEASUREMENT FAILED: probe not wired'); process.exit(2); }

// hand oracle (same transcription as v205_chi_table6.js)
const T6=[null,{r:1,m:15},{r:1,m:15},{r:1,m:16},{r:1,m:16},{r:1,m:17},{r:1,m:17},{r:1,m:18},{r:1,m:18},
 {r:1,m:19},{r:1,m:19},{r:1,m:20},{r:1,m:20},{r:2,m:12},{r:2,m:12},{r:2,m:12},{r:2,m:14},{r:2,m:14},
 {r:2,m:14},{r:2,m:16},{r:2,m:16},{r:2,m:16},{r:2,m:18},{r:2,m:18},{r:2,m:18},{r:2,m:20},{r:2,m:20}];
const t6=w=>T6[Math.min(Math.max(w,1),26)];
const isCut=(w,tw)=>(tw||0)>=10&&w%4===0&&w!==tw;
function exp6(w,tw){ if(!isCut(w,tw)) return t6(w); const p=t6(w-1);
  return p.r>1?{r:p.r-1,m:p.m}:{r:1,m:Math.max(10,Math.round(p.m*0.7))}; }
const f=x=>x.r===1?(x.m+' min'):(x.r+' x '+x.m+' min');

say('\n=== A. RAW getCHI, no phase window, isMilGoal=true, tw=11 (Mario) — engine vs Table 6 ===');
for(let w=1;w<=11;w++){ const g=G(w,11,true), e=exp6(w,11);
  say('  wk'+String(w).padStart(2)+'  engine '+g.reps+' x '+g.minPerRep+' (work '+(g.reps*g.minPerRep)+')   table6 '+
      f(e).padEnd(12)+'(work '+(e.r*e.m)+')   engine/table work ratio '+((g.reps*g.minPerRep)/(e.r*e.m)).toFixed(2)); }

say('\n=== B. THE >26 LIMB, probed directly ===');
[[27,30,true],[27,30,false],[30,40,true],[40,52,true]].forEach(([w,tw,m])=>
  say('  getCHI('+w+','+tw+','+m+') = '+JSON.stringify(G(w,tw,m))));
say('  (isMilGoal is true only for run_pace_goal (index.html:3619) and swim_tri/swim_mile (:4452);');
say('   bike passes false literally at :4326, so the limb is unreachable from bike by construction.)');

say('\n=== C. CHI POPULATION, SEGMENTED BY GOAL (sport x goal x 3 exp x 3 seeds x 4 rest) ===');
const GOALS={run:['run_5k','run_10k','run_half','run_marathon','run_pace_goal','run_base'],
             swim:['swim_tri','swim_mile','swim_base','swim_100_time','swim_500_time'],
             bike:['bike_century','bike_50','bike_ftp','bike_cals','bike_base']};
const EXPS=['beginner','intermediate','advanced'], SEEDS=[76308,11111,42424];
const RESTS=[['sun','wed'],['sun'],['sat','sun','wed'],['tue','thu','sun']];
function sportCfg(sport,gid,o={}){
  const g={id:gid,label:gid};
  if(sport==='run'){ if(gid==='run_pace_goal') Object.assign(g,{targetDist:'1.5',paceUnit:'mi',targetMins:'10',targetSecs:'0',mileBestMins:'8',mileBestSecs:'0',baseline:''});
    else Object.assign(g,{mileBestMins:'8',mileBestSecs:'0',baselineDist:'3',baseline:'3mi'}); }
  if(sport==='swim') Object.assign(g,{swimBest:'2:00',baseline:'500',baselineDist:'500',targetMins:'10',targetSecs:'0'});
  if(sport==='bike') Object.assign(g,{baseline:'10',baselineDist:'10'});
  return Object.assign({name:'M',primaryPath:'goal',cardioTypes:[sport],cardioGoals:{[sport]:g},
    eventTargeted:false,liftingFocus:'support_prevention',experience:'intermediate',ageBracket:'18-35',
    equipment:'full_gym',unit:'lbs',restDays:['sun','wed'],days:ALL.slice(),
    bench:185,squat:255,deadlift:315,seed:76308},o);
}
function chiCards(prog){ const out=[];
  Object.keys(prog.weeks||{}).sort((a,b)=>+a-+b).forEach(w=>ALL.forEach(d=>{
    const day=prog.weeks[w][d]; if(!day) return; const c=day.cardio; if(!c) return;
    (Array.isArray(c)?c:[c]).forEach(s=>{ if(!/Continuous High Intensity|CHI/i.test(String(s.subtype||''))) return;
      out.push({w:+w,sport:s.type,dose:s.dose||null,detail:String(s.detail||'').replace(/\s+/g,' ')}); }); }));
  return out; }
const seg={};
let PROG=0, CARDS=0, maxTW=0;
Object.keys(GOALS).forEach(sp=>GOALS[sp].forEach(gid=>EXPS.forEach(exp=>SEEDS.forEach(sd=>RESTS.forEach(rd=>{
  let p; try{ p=IA.buildProgram(sportCfg(sp,gid,{experience:exp,seed:sd,restDays:rd})); }catch(e){ return; }
  PROG++; if(p.totalWeeks>maxTW) maxTW=p.totalWeeks;
  const cs=chiCards(p); CARDS+=cs.length;
  const k=sp+'/'+gid, t=seg[k]||(seg[k]={prog:0,withCHI:0,cards:0,minDosed:0,differ:0,over:0,tw:p.totalWeeks});
  t.prog++; if(cs.length) t.withCHI++; t.cards+=cs.length;
  cs.forEach(c=>{ const D=c.dose; if(!D||(D.k!=='time'&&D.k!=='reps_time')) return; t.minDosed++;
    const eR=exp6(c.w,p.totalWeeks), gR=(D.k==='reps_time')?{r:D.reps,m:D.mins}:{r:1,m:D.mins};
    if(gR.r!==eR.r||gR.m!==eR.m) t.differ++;
    if(gR.r*gR.m>eR.r*eR.m) t.over++; });
})))));
say('  '+PROG+' programs, '+CARDS+' CHI cards total, max totalWeeks observed = '+maxTW);
say('  goal                progs  w/CHI  cards  minute-dosed  differ-from-T6  over-T6');
Object.keys(seg).sort().forEach(k=>{ const t=seg[k];
  say('  '+k.padEnd(20)+String(t.prog).padStart(5)+String(t.withCHI).padStart(7)+
      String(t.cards).padStart(7)+String(t.minDosed).padStart(14)+
      String(t.differ).padStart(16)+String(t.over).padStart(9)); });

say('\n=== D. WHAT EACH READER CONSUMES FROM getCHI ===');
say('  run  index.html:3690  -> chiMins=chi.minPerRep (:3828), chiReps=chi.reps (:3829)  -> MINUTES');
say('  bike index.html:4326  -> chiMins=chi.minPerRep (:4420), chiReps=chi.reps (:4421)  -> MINUTES');
say('  swim index.html:4459  -> chiReps=chi.reps ONLY (:4537); minPerRep is NEVER read on the swim path.');
say('       swim CHI distance comes from chiYards (:4534-4536), a separate 200+pct*600 ramp.');
say('  grep evidence (minPerRep call sites): 3711 (run taper), 3828 (run print), 4339/4420 (bike),');
say('       4438 (bike dose), 4468 (swim TAPER only — rewrites chi, then never reads .minPerRep).');
// print the swim CHI yards ramp against Table 6 minutes so the size of the scope change is visible
say('\n  -- swim_mile, intermediate, seed 76308: what the athlete reads today vs Table 6 minutes --');
const ps=IA.buildProgram(sportCfg('swim','swim_mile'));
chiCards(ps).forEach(c=>{ const m=/Main set:([^.]*\.)/.exec(c.detail)||/(\d+[^.]*yards[^.]*\.)/.exec(c.detail);
  say('     W'+String(c.w).padStart(2)+' dose='+JSON.stringify(c.dose)+'  main~'+(m?m[1].trim().slice(0,70):c.detail.slice(0,70))+
      '   | table6 '+f(exp6(c.w,ps.totalWeeks))); });
say('\nDONE');
