// v205 — BEFORE-PICTURE for the re-ruled D128 (CHI minutes from Guide B Table 6).
// READ-ONLY. No ruling here. Oracles are hand tables + the doctrine text, never getCHI.
const fs=require('fs'), path=require('path'), os=require('os');
const H=require(path.join(__dirname,'..','harness.js'));
const SRC=path.join(__dirname,'..','..','index.html');
const IA=H.load(SRC);
const ALL=['sun','mon','tue','wed','thu','fri','sat'];
const say=(...a)=>console.log(...a);

// ── ORACLE 1: Table 6 CHI column, transcribed BY HAND from
//    doctrine/nsw_ptg_sealswcc_11pg.txt:35-60 (re-read this session, line by line).
const T6=[null,
 {r:1,m:15},{r:1,m:15},{r:1,m:16},{r:1,m:16},{r:1,m:17},{r:1,m:17},
 {r:1,m:18},{r:1,m:18},{r:1,m:19},{r:1,m:19},{r:1,m:20},{r:1,m:20},
 {r:2,m:12},{r:2,m:12},{r:2,m:12},{r:2,m:14},{r:2,m:14},{r:2,m:14},
 {r:2,m:16},{r:2,m:16},{r:2,m:16},{r:2,m:18},{r:2,m:18},{r:2,m:18},
 {r:2,m:20},{r:2,m:20}];
const t6at=w=>T6[Math.min(Math.max(w,1),26)];

// ── ORACLE 2: the cutback rule, transcribed by hand from index.html:3420-3422 and
//    3446-3450 (isCardioCutbackWeek + getCHI's cutback branch). Re-implemented here;
//    NOT called from the engine.
const isCut=(w,tw)=>(tw||0)>=10 && w%4===0 && w!==tw;
function expectedT6(w,tw){
  if(!isCut(w,tw)) return t6at(w);
  const p=t6at(w-1);
  return p.r>1 ? {r:p.r-1,m:p.m} : {r:1,m:Math.max(10,Math.round(p.m*0.7))};
}
const fmt=x=>x.r===1?(x.m+' min'):(x.r+' x '+x.m+' min');
const work=x=>x.r*x.m;

say('=== 1. TABLE 6 CHI COLUMN AS I READ IT (doctrine/nsw_ptg_sealswcc_11pg.txt:35-60) ===');
for(let w=1;w<=26;w++) say('  wk '+String(w).padStart(2)+' | '+fmt(T6[w]));
say('  >26 | "do not increase INT or CHI distances. Focus on increasing intensity." (line 61)');

// ── cfg factories ────────────────────────────────────────────────────────────
function runCfg(o={}){ return Object.assign({name:'M',primaryPath:'goal',cardioTypes:['run'],
  cardioGoals:{run:{id:'run_pace_goal',label:'Hit a Pace / Time Goal',targetDist:'1.5',paceUnit:'mi',
    targetMins:'10',targetSecs:'0',mileBestMins:'8',mileBestSecs:'0',baseline:''}},
  eventTargeted:false,liftingFocus:'support_prevention',experience:'intermediate',ageBracket:'18-35',
  equipment:'full_gym',unit:'lbs',restDays:['sun','wed'],days:ALL.slice(),
  bench:185,squat:255,deadlift:315,seed:76308},o); }

// pull every CHI card out of a built program: {w, sport, subtype, dose, detail}
function chiCards(prog){
  const out=[];
  Object.keys(prog.weeks||{}).sort((a,b)=>+a-+b).forEach(w=>{
    ALL.forEach(d=>{ const day=prog.weeks[w][d]; if(!day) return;
      const c=day.cardio; if(!c) return; const arr=Array.isArray(c)?c:[c];
      arr.forEach(s=>{ if(!/Continuous High Intensity|CHI/i.test(String(s.subtype||''))) return;
        out.push({w:+w,d:d,sport:s.type,subtype:s.subtype,dose:s.dose||null,
                  detail:String(s.detail||'').replace(/\s+/g,' ').slice(0,120)}); }); });
  });
  return out;
}
function doseStr(c){ const D=c.dose;
  if(D&&D.k==='reps_time') return D.reps+' x '+D.mins+' min (work '+(D.reps*D.mins)+')';
  if(D&&D.k==='time') return '1 x '+D.mins+' min (work '+D.mins+')';
  const m=/(\d+)\s*x\s*(\d+)\s*min/i.exec(c.detail)||/(\d+)\s*min/i.exec(c.detail);
  return 'dose:'+JSON.stringify(D)+' | detail~'+c.detail.slice(0,60); }

// ── 2. Mario's config: derived expectation vs engine today ───────────────────
say('\n=== 2. MARIO CONFIG (run_pace_goal 1.5/10:00, mile 8:00, intermediate, SUN+WED rest, seed 76308) ===');
const pm=IA.buildProgram(runCfg());
say('  engine totalWeeks = '+pm.totalWeeks);
const tw=pm.totalWeeks;
const derived=[]; for(let w=1;w<=tw;w++) derived.push(expectedT6(w,tw));
say('  DERIVED from Table 6 + existing cutback rule: '+derived.map(fmt).join(', '));
say('  coach expects: 15, 15, 16, 11, 17, 17, 18, 13, 19, 19, 20');
const coach=[15,15,16,11,17,17,18,13,19,19,20];
let mism=0; derived.forEach((x,i)=>{ const got=x.r===1?x.m:null;
  if(got!==coach[i]){mism++; say('    MISMATCH wk'+(i+1)+': derived '+fmt(x)+' vs coach '+coach[i]);} });
say('  reproduces: '+(mism===0?'YES (11/11 weeks)':'NO ('+mism+' weeks differ)'));
const cards=chiCards(pm);
say('  --- CHI cards the engine prints TODAY ---');
if(!cards.length) say('    *** NO CHI CARD IN THIS PROGRAM ***');
cards.forEach(c=>say('    W'+c.w+' '+c.d+' '+c.sport+' :: '+doseStr(c)));

// raw getCHI, if the symbol reached the VM context
say('  --- raw getCHI(week, '+tw+', true) ---');
if(typeof IA.getCHI==='function'){
  for(let w=1;w<=tw;w++){ const g=IA.getCHI(w,tw,true);
    const e=expectedT6(w,tw);
    say('    wk'+String(w).padStart(2)+' engine '+g.reps+' x '+g.minPerRep+' (work '+(g.reps*g.minPerRep)+
        ')   table6 '+fmt(e)+' (work '+work(e)+')   delta work '+((g.reps*g.minPerRep)-work(e))); }
} else say('    getCHI not on the VM context');

// ── 3. ceiling-4 counterfactual ──────────────────────────────────────────────
say('\n=== 3. CEILING-4 COUNTERFACTUAL (SPORT_CEILINGS.run_pace_goal 3 -> 4, source surgery on a COPY) ===');
const ORIG="run_5k: 4, run_10k: 4, run_base: 4, run_pace_goal: 3, run_mile_time: 3, run_15_under10: 3,";
const NEW ="run_5k: 4, run_10k: 4, run_base: 4, run_pace_goal: 4, run_mile_time: 4, run_15_under10: 4,";
const html=fs.readFileSync(SRC,'utf8'); const n=html.split(ORIG).length-1;
say('  anchor count == '+n+(n===1?' (ok)':' — NOT 1, surgery aborted'));
let IA4=null;
if(n===1){ const out=path.join(os.tmpdir(),'ia_v205_chi_ceil4.html');
  if(fs.existsSync(out)) fs.unlinkSync(out);
  fs.writeFileSync(out,html.replace(ORIG,NEW)); IA4=H.load(out); }
if(IA4){
  const p4=IA4.buildProgram(runCfg()); const c4=chiCards(p4);
  say('  totalWeeks='+p4.totalWeeks+'  CHI cards='+c4.length);
  c4.forEach(c=>say('    W'+c.w+' '+c.d+' :: '+doseStr(c)));
  if(typeof IA4.getCHI==='function'){
    say('  --- raw getCHI under ceiling 4 ---');
    for(let w=1;w<=p4.totalWeeks;w++){ const g=IA4.getCHI(w,p4.totalWeeks,true); const e=expectedT6(w,p4.totalWeeks);
      say('    wk'+String(w).padStart(2)+' engine '+g.reps+' x '+g.minPerRep+' (work '+(g.reps*g.minPerRep)+
          ')   table6 '+fmt(e)+' (work '+work(e)+')'); }
  }
}

// ── 4. the >26 limb ──────────────────────────────────────────────────────────
say('\n=== 4. THE >26 LIMB: which configs reach week 27+ ===');
const GOALS={run:['run_5k','run_10k','run_half','run_marathon','run_pace_goal','run_base'],
             swim:['swim_tri','swim_mile','swim_base','swim_100_time','swim_500_time'],
             bike:['bike_century','bike_50','bike_ftp','bike_cals','bike_base']};
const EXPS=['beginner','intermediate','advanced'];
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
let maxTW=0, over26=[];
let nCfg=0;
Object.keys(GOALS).forEach(sp=>GOALS[sp].forEach(gid=>EXPS.forEach(exp=>{
  let p; try{ p=IA.buildProgram(sportCfg(sp,gid,{experience:exp})); }catch(e){ say('  BUILD CRASH '+sp+'/'+gid+'/'+exp+': '+e.message); return; }
  nCfg++;
  if(p.totalWeeks>maxTW) maxTW=p.totalWeeks;
  if(p.totalWeeks>26) over26.push(sp+'/'+gid+'/'+exp+' = '+p.totalWeeks+'wk');
})));
say('  '+nCfg+' configs built (3 sports x goals x 3 experience, eventTargeted=false)');
say('  max totalWeeks observed = '+maxTW);
say('  configs with totalWeeks > 26: '+(over26.length?over26.join(', '):'NONE (0/'+nCfg+')'));
say('  raw getCHI(27, 30, true) = '+JSON.stringify(typeof IA.getCHI==='function'?IA.getCHI(27,30,true):'n/a'));
say('  raw getCHI(27, 30, false) = '+JSON.stringify(typeof IA.getCHI==='function'?IA.getCHI(27,30,false):'n/a'));

// ── 5. every reader of getCHI, per sport ─────────────────────────────────────
say('\n=== 5. CHI PRESCRIPTIONS TODAY, PER SPORT (representative programs) ===');
const REP=[['run','run_pace_goal'],['run','run_base'],['swim','swim_tri'],['swim','swim_mile'],
           ['swim','swim_base'],['swim','swim_500_time'],['bike','bike_50'],['bike','bike_base'],['bike','bike_ftp']];
const moved={run:{prog:0,cards:0},swim:{prog:0,cards:0},bike:{prog:0,cards:0}};
REP.forEach(([sp,gid])=>{
  let p; try{ p=IA.buildProgram(sportCfg(sp,gid)); }catch(e){ say('  '+sp+'/'+gid+' BUILD CRASH: '+e.message); return; }
  const cs=chiCards(p);
  say('  -- '+sp+'/'+gid+'  tw='+p.totalWeeks+'  CHI cards='+cs.length);
  cs.forEach(c=>{ const e=expectedT6(c.w,p.totalWeeks);
    say('     W'+String(c.w).padStart(2)+' '+doseStr(c)+'   | table6 '+fmt(e)+' (work '+work(e)+')'); });
});

// ── full sweep: how many programs / cards carry CHI, per sport ───────────────
say('\n=== 5b. SWEEP: how many programs and cards carry a CHI session ===');
const SEEDS=[76308,11111,42424];
const RESTS=[['sun','wed'],['sun'],['sat','sun','wed'],['tue','thu','sun']];
const tally={};
let progN=0;
Object.keys(GOALS).forEach(sp=>GOALS[sp].forEach(gid=>EXPS.forEach(exp=>SEEDS.forEach(sd=>RESTS.forEach(rd=>{
  let p; try{ p=IA.buildProgram(sportCfg(sp,gid,{experience:exp,seed:sd,restDays:rd})); }catch(e){ return; }
  progN++;
  const cs=chiCards(p);
  const t=tally[sp]||(tally[sp]={prog:0,progWithCHI:0,cards:0,overTable:0,weeks:0});
  t.prog++; t.weeks+=p.totalWeeks;
  if(cs.length){ t.progWithCHI++; t.cards+=cs.length;
    cs.forEach(c=>{ const D=c.dose; if(!D) return;
      const w2=(D.k==='reps_time')?D.reps*D.mins:(D.k==='time'?D.mins:0);
      if(w2>work(expectedT6(c.w,p.totalWeeks))) t.overTable++; }); }
}))))); 
say('  '+progN+' programs built (sport x goal x 3 exp x 3 seeds x 4 rest patterns)');
Object.keys(tally).forEach(sp=>{ const t=tally[sp];
  say('  '+sp.padEnd(5)+' programs '+t.prog+', with a CHI card '+t.progWithCHI+
      ' ('+(100*t.progWithCHI/t.prog).toFixed(1)+'%), CHI cards '+t.cards+
      ', cards dosed ABOVE Table 6 work '+t.overTable+'/'+t.cards); });

// ── 6. HALF_MANNY ────────────────────────────────────────────────────────────
say('\n=== 6. HALF_MANNY: does it carry any CHI card? ===');
const hm=IA.buildProgram(JSON.parse(JSON.stringify(H.fixtures.HALF_MANNY)));
const hc=chiCards(hm);
say('  goal='+H.fixtures.HALF_MANNY.cardioGoals.run.id+'  tw='+hm.totalWeeks+
    '  CHI cards='+hc.length+'  digest='+H.progDigest(hm));
hc.forEach(c=>say('    W'+c.w+' '+doseStr(c)));
say('\nDONE');
