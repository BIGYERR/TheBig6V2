// v194b — measure pass: "Barbell push press does not show up in Progress at all,
// and it should be a main lift" (Mario, device, week 3 Monday, day "Strength Support").
//
// MODE A (prove the report) then MODE B (the total sweep behind it). Read-only.
// Answers Q7..Q10 of the V194 scope extension. Never rules.
//
// ORACLES (each independent of the functions under suspicion):
//  Q7  — the reporter's own configuration: liftingFocus support_prevention is the ONLY
//        focus whose push day is titled "Strength Support" (roleLabelMap, index.html:9655,
//        isEndurance branch). ia_exw_/ia_hist_ are synthesised in the exact shape
//        saveExWeight(11921) and snapshotDay(1281) write, then handed to the real
//        ledgerModel. The carry-forward path is traced statically through reuseWeight
//        (11179) -> autoSaveSets (11141) -> writeSetDraft, which is not ia_exw_.
//  Q8  — main-slot membership is read off buildProgram's OWN output (item 0 of a /^main/i
//        section), the contract _slotOfEntry(15385) encodes. Never asks ledgerModel.
//  Q9  — every simulated entry uses the FROZEN detail the engine actually wrote for that
//        movement on that day, not an invented one.
//  Q10 — section labels are counted from the built programs, not from any label list.
//
// usage: node tests/measure/v194b_push_press_never_a_main.js [--fast]
const fs=require('fs'), path=require('path');
const {load, fixtures}=require(path.join(__dirname,'..','harness.js'));
const HTML=path.join(__dirname,'..','..','index.html');
const IA=load(HTML);
const FAST=process.argv.includes('--fast');
const srcLines=fs.readFileSync(HTML,'utf8').split('\n');
console.log('ia-version', IA.version, FAST?'(FAST: 1 seed)':'(FULL: 3 seeds)');
function pad(s,n){ s=String(s); return s.length>=n?s:s+' '.repeat(n-s.length); }
function call(fn,arg){ try{ return IA.eval('(typeof '+fn+'==="function")?'+fn+'('+JSON.stringify(arg)+'):"NO-FN"'); }catch(e){ return 'ERR:'+e.message; } }
const ledgerModel=IA.eval('ledgerModel');
const _slotOfEntry=IA.eval('_slotOfEntry');
const _rxRangeFor=IA.eval('_rxRangeFor');
const parseRx=IA.parseRx;
// buildExItem:11476 — `const loaded=isKB||isWeight` — the gate on every weight input.
const LFcache=new Map();
function loadedOf(n){
  if(LFcache.has(n)) return LFcache.get(n);
  const isKB=call('isKBExercise',n)===true;
  const v={isKB, isWeight:!isKB&&call('isTrackableWeight',n)===true};
  v.loaded=v.isKB||v.isWeight;
  LFcache.set(n,v); return v;
}
const clean=n=>String(n||'').replace(/<svg[\s\S]*?<\/svg>\s*/g,'').trim();

// ══════════════════════════════════════════════════════════════════════════════
// Q7 — REPRODUCE MARIO'S REPORT
// ══════════════════════════════════════════════════════════════════════════════
console.log('\n══ Q7 — REPRODUCE: Barbell push press, week 3 Monday, "Strength Support" ══');
// THE HALF MANNY is Mario's live fixture: support_prevention (=> goal 'endurance' =>
// roleLabelMap push day titled "Strength Support"), crossfit, intermediate, 18-35, seed 76308.
const MAR=Object.assign({}, fixtures.HALF_MANNY);
console.log('  reporter cfg: '+JSON.stringify({liftingFocus:MAR.liftingFocus,equipment:MAR.equipment,experience:MAR.experience,ageBracket:MAR.ageBracket,goal:MAR.cardioGoals.run.id,restDays:MAR.restDays,unit:MAR.unit,seed:MAR.seed}));
const progM=IA.buildProgram(MAR);
const dayM=progM.weeks['3'] && progM.weeks['3'].mon;
if(!dayM){ console.log('  MEASUREMENT FAILED: no week 3 monday in the reporter build'); }
else {
  console.log('  W3 MON title: "'+(dayM.title||'')+'"   rest='+!!dayM.rest);
  console.log('  sections, verbatim (label :: idx. name | detail):');
  (dayM.sections||[]).forEach((sec,si)=>{
    console.log('    ['+si+'] label="'+(sec.label||'')+'"  superset='+!!(sec.superset||sec.type==='superset')+(sec.rounds?('  rounds='+sec.rounds):''));
    (sec.items||[]).forEach((it,ii)=>{
      const nm=clean(it.name);
      console.log('        '+ii+'. '+pad(nm,40)+' | '+String(it.detail||'')+'   [loaded='+(loadedOf(nm).loaded?'YES':'no')+']');
    });
  });
}
// Where does push press live in this build, across all 14 weeks?
const PP='Barbell push press';
const ppSites=[];
Object.keys(progM.weeks).sort((a,b)=>+a-+b).forEach(wk=>Object.keys(progM.weeks[wk]).forEach(d=>{
  const day=progM.weeks[wk][d]; if(!day||!day.sections) return;
  day.sections.forEach(sec=>(sec.items||[]).forEach((it,ii)=>{
    if(clean(it.name)===PP) ppSites.push({wk:+wk,d,label:sec.label||'',ii,detail:it.detail||'',ss:!!(sec.superset||sec.type==='superset'),day});
  }));
}));
console.log('\n  "'+PP+'" placements in the reporter build: '+ppSites.length);
const ppBy={};
ppSites.forEach(s=>{ const k='label="'+s.label+'" idx='+s.ii+' mainRe='+(/^main/i.test(s.label)?'Y':'n'); ppBy[k]=(ppBy[k]||0)+1; });
Object.keys(ppBy).sort().forEach(k=>console.log('    '+pad(k,62)+' x'+ppBy[k]));
console.log('    sample detail: "'+((ppSites[0]||{}).detail||'')+'"');
console.log('    placements that satisfy _slotOfEntry main (/^main/i label AND idx 0): '
  +ppSites.filter(s=>/^main/i.test(s.label)&&s.ii===0).length+'/'+ppSites.length);

// Now log it the way the app does, and ask the real ledgerModel.
if(ppSites.length>=3){
  const key=IA.exStoreKey(PP);
  console.log('\n  exStoreKey("'+PP+'") = "'+key+'"   (EX_RENAMED_V113 maps "Push press" -> "'+PP+'", index.html:1702)');
  const use=ppSites.slice(0,3);
  const hist={}; use.forEach(s=>{ hist['w'+s.wk+'_'+s.d]=JSON.parse(JSON.stringify(s.day)); });
  const rx=parseRx(use[0].detail, PP);
  const tgt=(rx&&rx.target)||8;
  const exw={}; exw[key]={name:PP, entries:[]};
  [135,145,155].forEach((w,i)=>exw[key].entries.push({weight:w, setsReps:'', setsDone:[tgt,tgt,tgt], setsW:[w,w,w], week:use[i].wk, day:use[i].d, ts:1757000000000+i}));
  console.log('  synthesised ia_hist_ keys: '+Object.keys(hist).join(', '));
  console.log('  synthesised ia_exw_["'+key+'"].entries: '+JSON.stringify(exw[key].entries.map(e=>({w:e.week,d:e.day,wt:e.weight,sets:e.setsDone}))));
  use.forEach(s=>console.log('  _slotOfEntry(hist,"'+PP+'", w'+s.wk+'_'+s.d+') = '+_slotOfEntry(hist,PP,{week:s.wk,day:s.d})));
  const rr=_rxRangeFor(hist,PP,{week:use[0].wk,day:use[0].d});
  console.log('  _rxRangeFor on the frozen detail "'+use[0].detail+'" -> '+JSON.stringify(rr));
  const model=ledgerModel(exw,hist);
  ['mains','ladder','plain','unloaded'].forEach(b=>{
    const hit=(model[b]||[]).filter(r=>r.name===PP);
    console.log('  ledgerModel.'+pad(b,9)+' : '+(hit.length?JSON.stringify(hit[0]):'—'));
  });
  const anywhere=['mains','ladder','plain','unloaded'].filter(b=>(model[b]||[]).some(r=>r.name===PP));
  console.log('  => LOGGED push press surfaces in: '+(anywhere.join(', ')||'NOWHERE'));
}
// The other half of the report: an UNLOGGED movement.
console.log('\n  CARRY-FORWARD vs LOGGED — which one is Mario looking at?');
console.log('    screenshot state: LOAD empty, dashed chip "135 lbs, 3 weeks ago", header 0 / 7 LOGGED.');
[11179,11180,11181,11182,11183,11141,11142,11143,11144,11145,11146,11147].forEach(L=>console.log('    '+L+': '+(srcLines[L-1]||'').trim().slice(0,190)));
console.log('    -> reuseWeight(11179) fills the INPUT and calls autoSaveSets(11141); autoSaveSets writes');
console.log('       writeSetDraft (a draft) unless the card already carries .logged. Drafts never reach ia_exw_');
console.log('       (index.html:1207 "A draft NEVER reaches ia_exw_"). An untapped chip writes nothing at all.');
[11097,11098,11099,11100].forEach(L=>console.log('    '+L+': '+(srcLines[L-1]||'').trim().slice(0,190)));
console.log('    -> the chip\'s 135 lbs came from crossProgLastEntry(11097), which reads OTHER programs\'');
console.log('       ia_exw_ ("TEST TING"). renderProgressScreen reads getExWeightsFor(_vid) — this program only.');
{ // empty-store control
  const model0=ledgerModel({}, {});
  console.log('    control: ledgerModel({},{}) -> mains='+model0.mains.length+' ladder='+model0.ladder.length+' plain='+model0.plain.length+' unloaded='+model0.unloaded.length);
}

// ══════════════════════════════════════════════════════════════════════════════
// LATTICE for Q8 / Q9 / Q10
// ══════════════════════════════════════════════════════════════════════════════
const FOCUS=['strength','hypertrophy','fatloss','balanced','support_strength','support_athletic','support_prevention'];
const EQUIP=['home_full','home_basic','commercial','crossfit','bodyweight','minimal'];
const EXP=['beginner','intermediate','advanced'];
const AGE=['18-35','36-54','55+'];
const REST=[['sun','wed'],['sun']];
const SEEDS=FAST?[76308]:[76308,11111,90210];
const GOALS=[
  {k:'lift_only', f:{primaryPath:'body', cardioTypes:[], cardioGoals:{}, eventTargeted:false, raceDate:null}},
  {k:'run_base',  f:{primaryPath:'body', cardioTypes:['run'], cardioGoals:{run:{id:'run_base',label:'Build Running Base',mileBestMins:'9',mileBestSecs:'00',baselineDist:'3',baseline:'3mi'}}, eventTargeted:false, raceDate:null}},
  {k:'run_pace',  f:{primaryPath:'body', cardioTypes:['run'], cardioGoals:{run:{id:'run_pace_goal',label:'Hit a Pace / Time Goal',targetDist:'1.5',targetMins:'10',mileBestMins:'8',mileBestSecs:'30',baselineDist:'3',baseline:'3mi'}}, eventTargeted:false, raceDate:null}},
  {k:'run_half',  f:{primaryPath:'event', cardioTypes:['run'], cardioGoals:{run:{id:'run_half',label:'Half Marathon',mileBestMins:'10',mileBestSecs:'30',baselineDist:'5',baseline:'5mi'}}, eventTargeted:true, raceDate:'2026-12-06'}},
];
const INJ=['shoulder','elbow','lowback','hip','knee','ankle'].flatMap(r=>[{region:r,tier:'workaround'},{region:r,tier:'protect'}]);
function mkcfg(o){
  return Object.assign({name:'MEASURE', unit:'lbs', days:['sun','mon','tue','wed','thu','fri','sat'], bench:135, squat:155, deadlift:185},
    o.goal.f, {liftingFocus:o.focus, experience:o.exp, ageBracket:o.age, equipment:o.equip, restDays:o.rest.slice(), seed:o.seed, injury:o.inj||undefined});
}
const A=[]; GOALS.forEach(goal=>FOCUS.forEach(focus=>EQUIP.forEach(equip=>EXP.forEach(exp=>AGE.forEach(age=>REST.forEach(rest=>SEEDS.forEach(seed=>A.push({goal,focus,equip,exp,age,rest,seed,inj:null}))))))));
const B=[]; GOALS.forEach(goal=>FOCUS.forEach(focus=>EQUIP.forEach(equip=>INJ.forEach(inj=>SEEDS.slice(0,2).forEach(seed=>B.push({goal,focus,equip,exp:'intermediate',age:'18-35',rest:REST[0],seed,inj}))))));

const mainCells=new Map(), otherCells=new Map();   // name -> Set(cellId)
const mainByEquip=new Map();                       // equip -> Set(name)
const mainOcc=new Map(), otherOcc=new Map();
const sampMain=new Map(), sampOther=new Map();     // name -> [{wk,d,day,label,ii,detail}]
const labelCount=new Map();                        // section label -> count
const mainItemCount=new Map();                     // main-section item count -> occurrences
const mainIdx1=new Map();                          // name at idx>=1 of a main section -> count
let builds=0, crashed=0, items=0, sections=0; const crashes=[];
function bump(m,k){ m.set(k,(m.get(k)||0)+1); }
function addCell(m,n,c){ if(!m.has(n)) m.set(n,new Set()); m.get(n).add(c); }

function harvest(cellId, prog, equip){
  if(!mainByEquip.has(equip)) mainByEquip.set(equip,new Set());
  const _eqSet=mainByEquip.get(equip);
  Object.keys(prog.weeks||{}).forEach(wk=>{
    const week=prog.weeks[wk]||{};
    Object.keys(week).forEach(d=>{
      const day=week[d]; if(!day||!day.sections) return;
      day.sections.forEach(sec=>{
        sections++;
        const lab=sec.label||'';
        bump(labelCount,lab);
        const isMainSec=/^main/i.test(lab);
        const its=(sec.items||[]).filter(it=>it&&it.name&&!/^\s*<svg/i.test(it.name));
        if(isMainSec) bump(mainItemCount, its.length);
        (sec.items||[]).forEach((it,ii)=>{
          if(!it||!it.name) return;
          const nm=clean(it.name); if(!nm) return;
          items++;
          const isMain0=isMainSec&&ii===0;
          if(isMainSec&&ii>=1) bump(mainIdx1,nm);
          if(isMain0){ addCell(mainCells,nm,cellId); bump(mainOcc,nm); _eqSet.add(nm);
            if(!sampMain.has(nm)) sampMain.set(nm,[]);
            const S=sampMain.get(nm); if(S.length<3&&!S.some(x=>x.wk===+wk&&x.d===d)) S.push({wk:+wk,d,label:lab,ii,detail:it.detail||'',day:JSON.parse(JSON.stringify(day))});
          } else { addCell(otherCells,nm,cellId); bump(otherOcc,nm);
            if(!sampOther.has(nm)) sampOther.set(nm,[]);
            const S=sampOther.get(nm); if(S.length<3&&!S.some(x=>x.wk===+wk&&x.d===d)) S.push({wk:+wk,d,label:lab,ii,detail:it.detail||'',day:JSON.parse(JSON.stringify(day))});
          }
        });
      });
    });
  });
}
function run(list,tag){
  const t0=Date.now();
  list.forEach(o=>{
    const cfg=mkcfg(o);
    const cellId=[tag,o.goal.k,o.focus,o.equip,o.exp,o.age,o.rest.join('+'),o.inj?o.inj.region+'/'+o.inj.tier:'none',o.seed].join('|');
    try{ const prog=IA.buildProgram(cfg); builds++; harvest(cellId,prog,o.equip); }
    catch(e){ crashed++; if(crashes.length<10) crashes.push(cellId+' :: '+e.message); }
  });
  console.log('  '+tag+': '+list.length+' cells in '+((Date.now()-t0)/1000).toFixed(1)+'s');
}
console.log('\n── BUILDING LATTICE ──');
console.log('  A = goals4 x focus7 x equip6 x exp3 x age3 x rest2 x seeds'+SEEDS.length+' = '+A.length);
console.log('  B = goals4 x focus7 x equip6 x injury12 x seeds'+Math.min(2,SEEDS.length)+' = '+B.length);
run(A,'A'); run(B,'B');
console.log('builds='+builds+'  crashed='+crashed+'  sections='+sections+'  items='+items);
if(crashed) crashes.forEach(c=>console.log('  CRASH '+c));
if(!builds||!items){ console.log('MEASUREMENT FAILED — nothing printed'); process.exit(1); }

const allNames=[...new Set([...mainCells.keys(),...otherCells.keys()])].sort((a,b)=>a.localeCompare(b));
const loadedNames=allNames.filter(n=>loadedOf(n).loaded);
console.log('\n  distinct movement names programmed anywhere: '+allNames.length);
console.log('  of those, LOADED (weight field, buildExItem:11476): '+loadedNames.length);

// ══════════════════════════════════════════════════════════════════════════════
// Q8 — WHAT CAN NEVER BE A MAIN
// ══════════════════════════════════════════════════════════════════════════════
console.log('\n══ Q8 — EVERY LOADED MOVEMENT: (a) cells at item0 of /^main/i, (b) cells elsewhere ══');
console.log('  denominator: '+builds+' builds / '+sections+' sections / '+items+' items');
console.log(pad('name',44)+' | (a) main cells | (a) occ | (b) other cells | (b) occ');
loadedNames.forEach(n=>{
  const a=(mainCells.get(n)||new Set()).size, ao=mainOcc.get(n)||0;
  const b=(otherCells.get(n)||new Set()).size, bo=otherOcc.get(n)||0;
  console.log(pad(n,44)+' | '+String(a).padStart(14)+' | '+String(ao).padStart(7)+' | '+String(b).padStart(15)+' | '+String(bo).padStart(7));
});
const neverMain=loadedNames.filter(n=>!(mainCells.get(n)||new Set()).size);
console.log('\n  LOADED MOVEMENTS THAT ARE NEVER item0 OF A /^main/i SECTION — '+neverMain.length+'/'+loadedNames.length
  +' ('+(100*neverMain.length/loadedNames.length).toFixed(1)+'%), '+neverMain.reduce((a,n)=>a+(otherOcc.get(n)||0),0)+' programmed occurrences:');
neverMain.forEach(n=>console.log('    '+pad(n,44)+' other-cells='+String((otherCells.get(n)||new Set()).size).padStart(5)+'  occ='+String(otherOcc.get(n)||0).padStart(7)));
console.log('\n  IS "'+PP+'" IN THAT LIST: '+(neverMain.indexOf(PP)>=0?'YES':'NO')
  +'   (main cells='+((mainCells.get(PP)||new Set()).size)+', other cells='+((otherCells.get(PP)||new Set()).size)+', other occ='+(otherOcc.get(PP)||0)+')');
const everMain=[...mainCells.keys()];
console.log('\n  D11 comment (index.html:15376) claims "27 names ever occupy a main slot" over 1,080 builds.');
console.log('  THIS lattice: '+everMain.length+' names ever occupy a main slot over '+builds+' builds.');
console.log('  Of those, '+everMain.filter(n=>loadedOf(n).loaded).length+' are loaded and '+everMain.filter(n=>(otherCells.get(n)||new Set()).size>0).length+' also appear outside a main slot (D11: "26 of them also appear as accessories").');
console.log('  Names ever at item0 of /^main/i, cut by equipment tier (D11 was measured before the');
console.log('  bodyweight/minimal main-slot names existed in the sweep; this is the reconciliation):');
[...mainByEquip.keys()].sort().forEach(eq=>console.log('    '+pad(eq,12)+' '+String(mainByEquip.get(eq).size).padStart(3)+' names'));
const bbTiers=['home_full','commercial','crossfit'];
const bbUnion=new Set(); bbTiers.forEach(eq=>(mainByEquip.get(eq)||new Set()).forEach(n=>bbUnion.add(n)));
console.log('    barbell tiers (home_full+commercial+crossfit) union: '+bbUnion.size+' names');
const bbLoaded=[...bbUnion].filter(n=>loadedOf(n).loaded);
console.log('    of those, loaded: '+bbLoaded.length+' -> '+bbLoaded.sort().join(', '));

// ══════════════════════════════════════════════════════════════════════════════
// Q9 — WHAT NEVER SURFACES AT ALL
// ══════════════════════════════════════════════════════════════════════════════
console.log('\n══ Q9 — SIMULATE A PLAUSIBLE LOG FOR EVERY LOADED NAME, THEN ASK ledgerModel ══');
console.log('  every entry uses the FROZEN detail the engine wrote on that day; weight 60/70/80,');
console.log('  setsDone = the prescribed rep target from parseRx on that same detail.');
function simulate(n, samples){
  if(!samples||samples.length<1) return null;
  const key=IA.exStoreKey(n);
  const hist={}; samples.forEach(s=>{ hist['w'+s.wk+'_'+s.d]=s.day; });
  const rx=parseRx(samples[0].detail, n);
  const tgt=(rx&&rx.target)||10;
  const exw={}; exw[key]={name:n, entries:[]};
  samples.forEach((s,i)=>exw[key].entries.push({weight:60+10*i, setsReps:'', setsDone:[tgt,tgt,tgt], setsW:[60+10*i,60+10*i,60+10*i], week:s.wk, day:s.d, ts:1757000000000+i}));
  const model=ledgerModel(exw,hist);
  const b=['mains','ladder','plain','unloaded'].filter(k=>(model[k]||[]).some(r=>r.name===n));
  const rngs=samples.map(s=>_rxRangeFor(hist,n,{week:s.wk,day:s.d}));
  return {buckets:b, rngFirst:rngs[0], rngLast:rngs[rngs.length-1], rngs:rngs,
    flip: rngs.some(r=>!!r) && rngs.some(r=>!r),
    slot:_slotOfEntry(hist,n,{week:samples[0].wk,day:samples[0].d}),
    detail:samples[0].detail, detailLast:samples[samples.length-1].detail, label:samples[0].label, ii:samples[0].ii};
}
const dist={mains:0,ladder:0,plain:0,unloaded:0,none:0};
const noneList=[], rangeYes=[], rangeNo=[], flipList=[];
console.log('\n  --- logged in a NON-main position (what an accessory-only movement gets) ---');
console.log('  NOTE: ledgerModel:15458 calls _rxRangeFor on the LAST entry only, so the ladder/plain');
console.log('  decision is made by the frozen detail of the most recent session, not the first.');
console.log(pad('name',44)+' | bucket   | slot      | range 1st/last | frozen detail (first session)');
loadedNames.forEach(n=>{
  const r=simulate(n, sampOther.get(n));
  if(!r){ console.log(pad(n,44)+' | (never programmed outside a main slot)'); return; }
  const b=r.buckets[0]||'NONE';
  dist[b==='NONE'?'none':b]++;
  if(b==='NONE') noneList.push(n);
  (r.rngLast?rangeYes:rangeNo).push(n);
  if(r.flip) flipList.push(n+'  ['+r.rngs.map(x=>x?'Y':'n').join('')+']  first="'+r.detail+'" last="'+r.detailLast+'"');
  console.log(pad(n,44)+' | '+pad(b,8)+' | '+pad(String(r.slot),9)+' | '+pad((r.rngFirst?'Y':'n')+'/'+(r.rngLast?'Y':'n'),14)+' | '+String(r.detail).slice(0,66));
});
console.log('\n  bucket distribution over '+loadedNames.length+' loaded names logged outside a main slot:');
console.log('    mains '+dist.mains+'   ladder '+dist.ladder+'   plain '+dist.plain+'   unloaded '+dist.unloaded+'   NONE '+dist.none);
console.log('  names reaching NO bucket: '+(noneList.join(', ')||'none'));
console.log('  frozen detail carries an N×lo–hi range (the ladder gate, _rxRangeFor:15406): '
  +rangeYes.length+'/'+(rangeYes.length+rangeNo.length)+' = '+(100*rangeYes.length/Math.max(1,rangeYes.length+rangeNo.length)).toFixed(1)+'%');
console.log('    (D11 comment estimates ~50% of accessory rows carry one)');
console.log('  no-range names (last session carries no range -> can never reach the ladder): '+rangeNo.join(', '));
console.log('\n  RANGE FLIP — names whose 3 sampled sessions do not agree on whether a range exists ('+flipList.length+'/'+(rangeYes.length+rangeNo.length)+'):');
flipList.forEach(x=>console.log('    '+x));
console.log('    a flip means the same movement moves between the Range Ladder card and Other Accessory Work');
console.log('    depending only on WHICH SESSION was logged last.');

console.log('\n  --- the same names logged in a MAIN position, where one exists ---');
let mOK=0, mBad=0;
loadedNames.forEach(n=>{
  const s=sampMain.get(n); if(!s||!s.length) return;
  const r=simulate(n,s);
  const ok=r.buckets[0]==='mains';
  if(ok) mOK++; else { mBad++; console.log('    '+pad(n,44)+' expected mains, got '+(r.buckets[0]||'NONE')+'  slot='+r.slot); }
});
console.log('    '+mOK+' of '+(mOK+mBad)+' names with a main-slot sample land in mains when logged there.');

// exStoreKey aliasing: split / collide
console.log('\n  exStoreKey() aliasing over the '+allNames.length+' programmed names:');
const byKey=new Map();
allNames.forEach(n=>{ const k=IA.exStoreKey(n); if(!byKey.has(k)) byKey.set(k,new Set()); byKey.get(k).add(n); });
let coll=0;
byKey.forEach((set,k)=>{ if(set.size>1){ coll++; console.log('    COLLISION key="'+k+'" <- '+[...set].join(' | ')); } });
console.log('    '+coll+'/'+byKey.size+' store keys carry more than one programmed name');
const aliasSelf=[]; const aliasChain=[];
try{
  const AL=IA.EX_KEY_ALIAS||{};
  Object.keys(AL).forEach(k=>{ if(AL[k]===k) aliasSelf.push(k); if(AL[AL[k]]!==undefined) aliasChain.push(k+' -> '+AL[k]+' -> '+AL[AL[k]]); });
}catch(e){}
console.log('    EX_KEY_ALIAS self-maps: '+aliasSelf.length+(aliasSelf.length?' -> '+aliasSelf.join(', '):''));
console.log('    EX_KEY_ALIAS chains: '+aliasChain.length+(aliasChain.length?' -> '+aliasChain.join(' ; '):''));
// a programmed name whose slug differs from its stored key = the split risk
const aliased=allNames.filter(n=>IA.exStoreKey(n)!==String(n).toLowerCase().replace(/[^a-z0-9]/g,'_'));
console.log('    programmed names whose key is REWRITTEN by the alias map: '+aliased.length+(aliased.length?' -> '+aliased.map(n=>n+' => '+IA.exStoreKey(n)).join(' ; '):''));

// ══════════════════════════════════════════════════════════════════════════════
// Q10 — SECTION LABELS
// ══════════════════════════════════════════════════════════════════════════════
console.log('\n══ Q10 — EVERY DISTINCT SECTION LABEL ══');
const labs=[...labelCount.keys()].sort((a,b)=>labelCount.get(b)-labelCount.get(a));
console.log('  '+labs.length+' distinct labels over '+sections+' sections; '+labs.filter(l=>/^main/i.test(l)).length+' match /^main/i');
const mainLabs=labs.filter(l=>/^main/i.test(l)), otherLabs=labs.filter(l=>!/^main/i.test(l));
const mainSecTot=mainLabs.reduce((a,l)=>a+labelCount.get(l),0);
console.log('  /^main/i sections: '+mainSecTot+'/'+sections+' = '+(100*mainSecTot/sections).toFixed(1)+'%');
console.log('\n  --- labels matching /^main/i ('+mainLabs.length+') ---');
mainLabs.forEach(l=>console.log('    '+String(labelCount.get(l)).padStart(7)+'  "'+l+'"'));
console.log('\n  --- labels NOT matching /^main/i ('+otherLabs.length+') ---');
otherLabs.forEach(l=>console.log('    '+String(labelCount.get(l)).padStart(7)+'  "'+l+'"'));
console.log('\n  main-section item-count distribution (non-note items):');
[...mainItemCount.keys()].sort((a,b)=>a-b).forEach(k=>console.log('    '+k+' item'+(k===1?'':'s')+': '+mainItemCount.get(k)+' sections ('+(100*mainItemCount.get(k)/mainSecTot).toFixed(1)+'%)'));
const multi=[...mainItemCount.keys()].filter(k=>k>=2).reduce((a,k)=>a+mainItemCount.get(k),0);
console.log('    main sections carrying 2+ items: '+multi+'/'+mainSecTot+' = '+(100*multi/mainSecTot).toFixed(1)+'%');
console.log('\n  movements sitting at index >= 1 inside a /^main/i section (structurally excluded from mains):');
[...mainIdx1.keys()].sort((a,b)=>mainIdx1.get(b)-mainIdx1.get(a)).forEach(n=>
  console.log('    '+pad(n,44)+' '+String(mainIdx1.get(n)).padStart(7)+'   loaded='+(loadedOf(n).loaded?'YES':'no ')+'  ever-item0='+((mainCells.get(n)||new Set()).size?'YES':'no')));
