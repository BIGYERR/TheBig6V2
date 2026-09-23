// v205_d134_pair_check — MEASURE (read-only). Coach's D134 CONDITIONAL, printed.
//
// CONDITION (coach, verbatim): "for every legs-on-speed placement, print the pair total
// against every alternative pair with legs off a speed day; if no alternative ties or
// beats it, the placement is correct as ruled."
//
// ORACLE — the cost table is TRANSCRIBED BY HAND from the authoring comment above
// _nrcRunShape in index.html (the D36 block, lines ~6757-6760). _nrcLegCost is NEVER
// called. The comment reads:
//   Forbidden = the long-run day and its eve  -> Infinity
//   pull: clean 0 · speed same-day 0.5 · recovery-run same-day 1 · day after speed 1
//         · day before speed 2 · day after long 2
//   legs: clean 0 · day after speed 1 · recovery-run same-day 1 · speed same-day 1.5
//         · day before speed 2 · day after long 2
//   "Every ordered (pull, legs) pair is scored; min total wins, then the widest spacing
//    between the two axial days, then the earliest legs day."
// The run-week SHAPE is likewise derived here from the cardio objects' own fields
// (subtype text + legLoad), not from _nrcRunShape's return value.
//
// Lattice: the accepted V205 D133 lattice (1,728 configs), cfg.seed pinned.
// Neither artifact is written. index.html is read only.
const path=require('path'), fs=require('fs'), os=require('os');
const {fork}=require('child_process');
const {load}=require(path.join(__dirname,'..','harness.js'));
const ROOT=path.join(__dirname,'..','..');
const SCRATCH='/private/tmp/claude-501/-Users-CanasBangin-Desktop-TheBig6V2/1db5e723-d366-4a95-870d-30d83a70cafc/scratchpad';
const ARTS={v204:path.join(SCRATCH,'v204.html'), v205:path.join(ROOT,'index.html')};
const ISO=['mon','tue','wed','thu','fri','sat','sun'];

// ── HAND TABLE (transcribed, independent of _nrcLegCost) ─────────────────────
function handCost(shape, role, d){
  if(shape.forbidden.has(d)) return Infinity;
  const i=ISO.indexOf(d), prev=ISO[(i+6)%7], next=ISO[(i+1)%7];
  let c=0;
  if(shape.speed.has(d)) c += (role==='pull' ? 0.5 : 1.5);   // speed same-day
  if(shape.easy.has(d))  c += 1;                              // recovery-run same-day
  if(shape.speed.has(prev)) c += 1;                           // day after speed
  if(shape.speed.has(next)) c += 2;                           // day before speed
  if(d===shape.after) c += 2;                                 // day after long
  return c;
}
// ── HAND SHAPE, from the cardio fields ───────────────────────────────────────
const PACE=g=>g==='run_pace_goal'||g==='run_mile_time'||g==='run_15_under10';
function handShape(wk1, trainDays){
  let long=null; const speed=new Set(), easy=new Set();
  trainDays.forEach(d=>{ const c=wk1[d]; if(!c||c.type!=='run') return;
    const st=String(c.subtype||'');
    if(c.isNRC){ if(/^long run/i.test(st)) long=d; else if(/^speed run/i.test(st)) speed.add(d); else easy.add(d); }
    else if(PACE(c.goalId)){
      if(/^(Interval \(INT\)|Continuous High Intensity \(CHI\))/.test(st)) speed.add(d);
      else if(c.legLoad) long=d; else easy.add(d);
    } });
  if(!long) return null;
  const i=ISO.indexOf(long);
  return {long, eve:ISO[(i+6)%7], after:ISO[(i+1)%7], speed, easy, forbidden:new Set([long, ISO[(i+6)%7]])};
}
function dist(a,b){const r=Math.abs(ISO.indexOf(a)-ISO.indexOf(b));return Math.min(r,7-r);}
// Full pair scan for a record. Returns chosen total + every alternative with legs off speed.
function pairScan(rec){
  const shape=handShape(rec.wk1, rec.trainDays); if(!shape) return null;
  const pulls=rec.trainDays, legss=rec.trainDays;
  const all=[];
  pulls.forEach(p=>legss.forEach(l=>{ if(p===l) return;
    const cp=handCost(shape,'pull',p), cl=handCost(shape,'legs',l);
    if(!isFinite(cp)||!isFinite(cl)) return;
    all.push({p,l,cp,cl,t:cp+cl,sp:dist(p,l),legsOnSpeed:shape.speed.has(l)}); }));
  // `after` is a dayRoles map keyed by DAY -> role; invert it to find the chosen days.
  const dayOf=r=>rec.trainDays.find(d=>rec.after[d]===r)||null;
  const chosenP=dayOf('pull'), chosenL=dayOf('legs');
  const chosen=all.find(x=>x.p===chosenP&&x.l===chosenL)||null;
  return {shape,all,chosen,chosenP,chosenL};
}
// ── lattice (accepted V205 D133 lattice) ─────────────────────────────────────
const E_TIERS=['commercial','home_full','crossfit','home_basic','bodyweight','minimal'];
const E_FOCUS=['hypertrophy','balanced'], E_EXPS=['beginner','advanced'];
const E_GOALS=[{k:'liftonly',id:null},{k:'pace',id:'run_pace_goal'},{k:'half',id:'run_half'}];
const E_INJ=[{k:'healthy',v:null},{k:'shoulder/protect',v:{region:'shoulder',tier:'protect'}},
  {k:'lowback/protect',v:{region:'lowback',tier:'protect'}},{k:'knee/protect',v:{region:'knee',tier:'protect'}}];
const E_RESTS=[{k:'sun',v:['sun']},{k:'sun+wed',v:['sun','wed']},{k:'sat+sun',v:['sat','sun']}];
const E_SEEDS=[1013,3039];
function eCfg(tier,focus,exp,g,inj,rest,seed){
  const isRace=!!g.id&&/5k|10k|half|marathon/.test(g.id);
  return {name:'M',primaryPath:g.id?(isRace?'event':'cardio'):'lift',cardioTypes:g.id?['run']:[],
    cardioGoals:g.id?{run:{id:g.id,label:g.k,mileBestMins:'10',mileBestSecs:'30',baselineDist:'5',
      baseline:'5mi',targetDist:'1.5',targetMins:'11',targetSecs:'0'}}:{},
    eventTargeted:isRace,raceDate:isRace?'2026-12-06':null,liftingFocus:focus,experience:exp,
    ageBracket:'18-35',equipment:tier,unit:'lbs',restDays:rest.v.slice(),
    days:['sun','mon','tue','wed','thu','fri','sat'],bench:135,squat:155,deadlift:185,seed};
}
const LAT=[];
for(const t of E_TIERS)for(const f of E_FOCUS)for(const x of E_EXPS)for(const g of E_GOALS)
  for(const i of E_INJ)for(const r of E_RESTS)for(const sd of E_SEEDS){
    const c=eCfg(t,f,x,g,i,r,sd); if(i.v) c.injury={region:i.v.region,tier:i.v.tier};
    LAT.push({key:`${t}|${f}|${x}|${g.k}|${i.k}|${r.k}|${sd}`,cfg:c}); }

// ── instrumentation: two anchors, count==1 asserted on each artifact ─────────
const A_PLACE="  const _nrc = nrcLegLiftPlacement(dayRoles, trainDays, wk1);";
const A_PLACE_R=[
"  var __before=JSON.parse(JSON.stringify(dayRoles));",
"  const _nrc = nrcLegLiftPlacement(dayRoles, trainDays, wk1);",
"  if(typeof globalThis!=='undefined'&&globalThis.__D134){ globalThis.__D134.push({",
"    key:String(globalThis.__K||''), ret:!!_nrc, trainDays:trainDays.slice(),",
"    before:__before, after:JSON.parse(JSON.stringify(dayRoles)),",
"    wk1:(function(){var o={};trainDays.forEach(function(d){var c=wk1[d];o[d]=c?{type:String(c.type||''),",
"      subtype:String(c.subtype||''),legLoad:!!c.legLoad,isNRC:!!c.isNRC,goalId:String(c.goalId||'')}:null;});return o;})()",
"  }); }"].join("\n");
const A_PIPE="      weeks[w][d]={title,dot:cardio?cardio.type:'lift',tags,cardio,sections:capRegionalFatigue((_s=>isRecoveryWeek(w)?recoveryDeload(_s):_s)(applyInjuryFilter(buildSections(role,w,{fullVariant,wantCarry:d===carryHost,cardio,hotNext}),cfg)),role,cardio,goal)};";
const A_PIPE_R=[
"      if(typeof globalThis!=='undefined'&&globalThis.__D134C)globalThis.__D134C.push({key:String(globalThis.__K||''),",
"        w:String(w),d:String(d),role:String(role),cl:!!(cardio&&cardio.legLoad),",
"        sub:cardio?String(cardio.subtype||''):'',at:cardio?String(cardio.assignedType||''):''});",
A_PIPE].join("\n");
function instrument(art,tag){
  const RAW=fs.readFileSync(art,'utf8');
  [[A_PLACE,'place'],[A_PIPE,'pipe']].forEach(([a,n])=>{const c=RAW.split(a).length-1;
    if(c!==1) throw new Error('ANCHOR '+n+' count=='+c+' in '+art);});
  const out=path.join(os.tmpdir(),'m134_'+tag+'.html');
  fs.writeFileSync(out, RAW.replace(A_PLACE,A_PLACE_R).replace(A_PIPE,A_PIPE_R));
  return out;
}
function sweep(ver,mine){
  const f=instrument(ARTS[ver],ver+'_'+process.pid); const IA=load(f);
  IA.eval("globalThis.__D134=[];globalThis.__D134C=[];globalThis.__K='';");
  const place={}, cells={};
  mine.forEach(L=>{
    IA.eval("globalThis.__D134.length=0;globalThis.__D134C.length=0;globalThis.__K="+JSON.stringify(L.key)+";");
    IA.buildProgram(L.cfg);
    const P=IA.eval('globalThis.__D134'), C=IA.eval('globalThis.__D134C');
    if(P.length) place[L.key]=P[P.length-1];       // last placement call wins the roles used
    if(P.length>1) place[L.key].multi=P.length;
    C.forEach(r=>{ cells[L.key+'|'+r.w+'|'+r.d]={role:r.role,cl:r.cl,sub:r.sub,at:r.at}; });
  });
  try{fs.unlinkSync(f);}catch(e){}
  return {place,cells};
}
if(process.env.M134SHARD!==undefined){
  const si=+process.env.M134SHARD,sn=+process.env.M134SHARDS;
  const mine=LAT.filter((_,i)=>i%sn===si);
  fs.writeFileSync(process.env.M134OUT,JSON.stringify({v204:sweep('v204',mine),v205:sweep('v205',mine)}));
  process.exit(0);
}
const SH=+(process.argv[2]||8),outs=[],kids=[];
for(let i=0;i<SH;i++){const o=path.join(os.tmpdir(),'m134_'+i+'_'+process.pid+'.json');outs.push(o);
  try{fs.unlinkSync(o);}catch(e){}
  kids.push(new Promise((res,rej)=>{const k=fork(__filename,[],{env:Object.assign({},process.env,
    {M134SHARD:String(i),M134SHARDS:String(SH),M134OUT:o}),stdio:'inherit'});
    k.on('exit',c=>c===0?res():rej(new Error('shard '+i+' exit '+c)));}));}
Promise.all(kids).then(()=>{
  const P4={},P5={},C4={},C5={};
  outs.forEach(o=>{const j=JSON.parse(fs.readFileSync(o,'utf8'));
    Object.assign(P4,j.v204.place);Object.assign(P5,j.v205.place);
    Object.assign(C4,j.v204.cells);Object.assign(C5,j.v205.cells);try{fs.unlinkSync(o);}catch(e){}});
  const K=Object.keys(C5);
  console.log('=== DENOMINATORS ===');
  console.log('configs='+LAT.length+'   day cells='+K.length+'   configs reaching the placement: V204='
    +Object.keys(P4).length+'  V205='+Object.keys(P5).length);
  // population: legs-role day carrying legLoad cardio
  const ll=(C)=>K.filter(k=>C[k]&&C[k].role==='legs'&&C[k].cl);
  const ll4=ll(C4), ll5=ll(C5);
  console.log('legs-role AND legLoad cardio:  V204='+ll4.length+'  V205='+ll5.length+'  delta='+(ll5.length-ll4.length));
  // THE RELOCATED SET: was role=pull & legLoad=false at V204, is role=legs with an INT at V205
  const reloc=K.filter(k=>C4[k]&&C5[k]&&C4[k].role==='pull'&&C4[k].cl===false
    && C5[k].role==='legs' && /^Interval \(INT\)/.test(C5[k].sub));
  console.log('RELOCATED cells (V204 pull/legLoad:false -> V205 legs/Interval (INT)): '+reloc.length);
  const relocCfg=[...new Set(reloc.map(k=>k.split('|').slice(0,7).join('|')))];
  console.log('  distinct configs behind them: '+relocCfg.length+'   (weeks/config avg '
    +(reloc.length/Math.max(1,relocCfg.length)).toFixed(2)+')');
  const byDay={}; reloc.forEach(k=>{const d=k.split('|').pop();byDay[d]=(byDay[d]||0)+1;});
  console.log('  by weekday: '+JSON.stringify(byDay));
  // ── THE CONDITION ──────────────────────────────────────────────────────────
  let noShape=0, noRec=0, chosenMissing=0;
  const rows=[], offenders=[];
  relocCfg.forEach(ck=>{
    const rec=P5[ck]; if(!rec){noRec++;return;}
    const S=pairScan(rec); if(!S){noShape++;return;}
    if(!S.chosen){chosenMissing++;return;}
    const alts=S.all.filter(x=>!x.legsOnSpeed && !(x.p===S.chosenP&&x.l===S.chosenL));
    const best=alts.length?Math.min(...alts.map(x=>x.t)):Infinity;
    const ties=alts.filter(x=>x.t===S.chosen.t), beats=alts.filter(x=>x.t<S.chosen.t);
    const nCells=reloc.filter(k=>k.startsWith(ck+'|')).length;
    const row={ck,nCells,chosen:S.chosen,bestAlt:best,ties:ties.length,beats:beats.length,
      altN:alts.length,S};
    rows.push(row);
    if(ties.length||beats.length) offenders.push(row);
  });
  console.log('\n=== D134 CONDITION: chosen pair total vs every alternative with LEGS OFF A SPEED DAY ===');
  console.log('configs scanned='+rows.length+'  (no placement record='+noRec+', no shape='+noShape+', chosen pair not in scan='+chosenMissing+')');
  const cellsOf=rs=>rs.reduce((a,r)=>a+r.nCells,0);
  console.log('configs with an alternative that BEATS  : '+rows.filter(r=>r.beats).length+'  ('+cellsOf(rows.filter(r=>r.beats))+' cells)');
  console.log('configs with an alternative that TIES   : '+rows.filter(r=>r.ties&&!r.beats).length+'  ('+cellsOf(rows.filter(r=>r.ties&&!r.beats))+' cells)');
  console.log('configs where the chosen pair is STRICTLY better than every legs-off-speed alternative: '
    +rows.filter(r=>!r.ties&&!r.beats).length+'  ('+cellsOf(rows.filter(r=>!r.ties&&!r.beats))+' cells)');
  console.log('VERDICT cells with an alternative that ties or beats: '+cellsOf(offenders)+' / '+reloc.length);
  const fmt=r=>'    chosen pull='+r.S.chosenP+'('+r.S.chosen.cp+') legs='+r.S.chosenL+'('+r.S.chosen.cl+') total='+r.S.chosen.t
    +' | best legs-off-speed alt='+r.bestAlt+' over '+r.altN+' alts | ties='+r.ties+' beats='+r.beats;
  offenders.slice(0,40).forEach(r=>{console.log('  OFFENDER '+r.ck+'  cells='+r.nCells);console.log(fmt(r));
    r.S.all.filter(x=>!x.legsOnSpeed&&x.t<=r.S.chosen.t).slice(0,6).forEach(x=>
      console.log('      alt pull='+x.p+'('+x.cp+') legs='+x.l+'('+x.cl+') total='+x.t+' spacing='+x.sp));});
  // distribution of the margin
  const marg={}; rows.forEach(r=>{const m=(r.bestAlt===Infinity?'no-alt':(r.bestAlt-r.S.chosen.t).toFixed(1));marg[m]=(marg[m]||0)+r.nCells;});
  console.log('margin (best legs-off-speed alt total MINUS chosen total), by cells: '+JSON.stringify(marg));
  const shp={}; rows.forEach(r=>{const s='speed='+[...r.S.shape.speed].join(',')+' long='+r.S.shape.long+' easy='+[...r.S.shape.easy].join(',');shp[s]=(shp[s]||0)+r.nCells;});
  console.log('shapes behind the relocated cells (cells): '+JSON.stringify(shp));
  // ── TASK 3: the named cohort weeks, if supplied ────────────────────────────
  const COH=process.env.M134_COHORT_FILE;
  if(COH&&fs.existsSync(COH)){
    const keys=fs.readFileSync(COH,'utf8').split('\n').map(s=>s.trim()).filter(Boolean);
    console.log('\n=== COHORT (C1-lost / C5-new-zero weeks), '+keys.length+' week keys supplied ===');
    keys.forEach(wk=>{
      const ck=wk.split('|').slice(0,7).join('|');
      const inReloc=reloc.filter(k=>k.startsWith(wk+'|'));
      const r=rows.find(x=>x.ck===ck);
      console.log('  '+wk+'  relocated cells in this week='+inReloc.length
        +(r?('  | chosen total='+r.S.chosen.t+' pull='+r.S.chosenP+' legs='+r.S.chosenL
            +'  best legs-off-speed alt='+r.bestAlt+'  ties='+r.ties+' beats='+r.beats)
          :'  | no pair-scan row for this config'+(P5[ck]?'':' (no placement record)')));
    });
  } else console.log('\n=== COHORT: no M134_COHORT_FILE supplied — cohort check NOT RUN ===');
  // ── TASK 4: control, V204 placements scored under the same table ───────────
  console.log('\n=== CONTROL: V204 placements for the same configs, scored under the same hand table ===');
  let c_noRec=0,c_noShape=0,c_notFound=0; const ctl=[];
  relocCfg.forEach(ck=>{ const rec=P4[ck];
    if(!rec||!rec.ret){c_noRec++;return;}
    const S=pairScan(rec); if(!S){c_noShape++;return;}
    if(!S.chosen){c_notFound++;return;}
    const minAll=Math.min(...S.all.map(x=>x.t));
    ctl.push({ck,t:S.chosen.t,min:minAll,minimal:S.chosen.t===minAll});
  });
  console.log('V204 configs with NO pair-search placement at all (the search never ran): '+c_noRec+' / '+relocCfg.length);
  console.log('V204 configs scored: '+ctl.length+'  cost-minimal under the table: '+ctl.filter(x=>x.minimal).length
    +'  non-minimal: '+ctl.filter(x=>!x.minimal).length);
  ctl.filter(x=>!x.minimal).slice(0,15).forEach(x=>console.log('    NON-MINIMAL '+x.ck+' chosen='+x.t+' min='+x.min));
  // V204 placement days scored under V205's shape, for the same configs (the real control)
  let scored=0, tiedOrBeaten=0;
  relocCfg.forEach(ck=>{ const r5=P5[ck], r4=P4[ck]; if(!r5||!r4) return;
    const S=pairScan(r5); if(!S||!S.chosen) return;
    const d4=r=>r4.trainDays.find(d=>r4.after[d]===r)||null;
    const p=d4('pull'), l=d4('legs'); if(!p||!l) return;
    const x=S.all.find(y=>y.p===p&&y.l===l); scored++;
    if(x&&x.t<=S.chosen.t) tiedOrBeaten++; });
  console.log("V204's OWN (pull,legs) days re-scored under the V205 shape+table: "+scored
    +' configs, of which ties-or-beats V205 choice: '+tiedOrBeaten);
  // What V204 actually did, and what its OWN week shape was (the search's input, pre-D127).
  const v4rows={};
  relocCfg.forEach(ck=>{ const r4=P4[ck], r5=P5[ck]; if(!r4||!r5) return;
    const d4=r=>r4.trainDays.find(d=>r4.after[d]===r)||null;
    const p=d4('pull'), l=d4('legs');
    const sh4=handShape(r4.wk1,r4.trainDays);
    const S5=pairScan(r5);
    const x=S5?S5.all.find(y=>y.p===p&&y.l===l):null;
    const subs=r4.trainDays.map(d=>d+':'+((r4.wk1[d]&&r4.wk1[d].subtype)||'-')+(r4.wk1[d]&&r4.wk1[d].legLoad?'*':'')).join(' ');
    const k='V204 ret='+r4.ret+' pull='+p+' legs='+l+' | V204 handShape='+(sh4?('speed='+[...sh4.speed].join(',')+' long='+sh4.long+' easy='+[...sh4.easy].join(',')):'NULL')
      +' | that pair under V205 table total='+(x?x.t:'forbidden/absent')+' vs V205 chosen '+(S5&&S5.chosen?S5.chosen.t:'?')
      +' | V204 wk1: '+subs;
    v4rows[k]=(v4rows[k]||0)+reloc.filter(z=>z.startsWith(ck+'|')).length; });
  Object.keys(v4rows).forEach(k=>console.log('   ['+v4rows[k]+' cells] '+k));
  // and the V205 week-1 cardio for the same configs, for the shape comparison
  const v5rows={};
  relocCfg.forEach(ck=>{ const r5=P5[ck]; if(!r5) return;
    const subs=r5.trainDays.map(d=>d+':'+((r5.wk1[d]&&r5.wk1[d].subtype)||'-')+(r5.wk1[d]&&r5.wk1[d].legLoad?'*':'')).join(' ');
    v5rows[subs]=(v5rows[subs]||0)+reloc.filter(z=>z.startsWith(ck+'|')).length; });
  Object.keys(v5rows).forEach(k=>console.log('   [V205 wk1, '+v5rows[k]+' cells] '+k));
  console.log('\nDONE');
}).catch(e=>{console.error('MEASUREMENT FAILED:',e.message);process.exit(1);});
