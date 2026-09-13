// v194 — measure pass: "on the bar" in buildMainLiftBlock (index.html:15513).
//
// MODE A (prove the reported defect) + MODE B (before-picture for the whole population).
// Read-only. Answers Q1..Q6 of the V194 brief with counts and denominators.
//
// ORACLES (each independent of the function under suspicion):
//  Q1  population  — walked out of buildProgram's OWN output: item 0 of a /^main/i
//                    section. That is the authoring contract _slotOfEntry (15385) and
//                    exControlFlags (11389) both encode. Never asks ledgerModel.
//  Q1b reachable   — a name can only carry en.weight>0 if buildExItem gives it a weight
//                    field: `loaded = isKB || isWeight` (11466), isKB=isKBExercise(11839),
//                    isWeight=!isKB && isTrackableWeight(11760). Read from the app's own
//                    predicates, which are upstream of and independent of the ledger.
//  Q2  buckets     — the V162 D2 regex copied VERBATIM from index.html:12844.
//  Q3  semantics   — the label/placeholder/help strings are read out of the HTML source
//                    by line, not from any function.
//  Q4  unilateral  — the AUTHORED detail string. parseRx:10957 sets perSide purely from
//                    /each/ on the detail, so the detail IS the app's only per-side
//                    signal. A name regex is reported beside it as a second, independent
//                    signal so the two can be compared.
//  Q6  repro       — synthesises ia_exw_/ia_hist_ in the exact shape saveExWeight(11921)
//                    and snapshotDay(1281) write, then calls the real ledgerModel +
//                    buildMainLiftBlock.
//
// usage: node tests/measure/v194_main_lift_implement_copy.js [--fast]
const fs=require('fs'), path=require('path');
const {load}=require(path.join(__dirname,'..','harness.js'));
const HTML=path.join(__dirname,'..','..','index.html');
const IA=load(HTML);
const FAST=process.argv.includes('--fast');

console.log('ia-version', IA.version, FAST?'(FAST: 1 seed)':'(FULL: 3 seeds)');

// ── the V162 D2 implement regex, copied verbatim from index.html:12844 ──────────
const _impl=function(n){const N=String(n||'').toLowerCase();
  return /kettlebell|\(kb/.test(N)?'kb':(/dumbbell|\(db/.test(N)?'db':(/barbell|trap bar/.test(N)?'bb':null));};
const _hitKB=n=>/kettlebell|\(kb/.test(String(n||'').toLowerCase());
const _hitDB=n=>/dumbbell|\(db/.test(String(n||'').toLowerCase());
const _hitBB=n=>/barbell|trap bar/.test(String(n||'').toLowerCase());

function call(fn,arg){ try{ return IA.eval('(typeof '+fn+'==="function")?'+fn+'('+JSON.stringify(arg)+'):"NO-FN"'); }catch(e){ return 'ERR:'+e.message; } }
// buildExItem:11466 — `const loaded=isKB||isWeight`, the gate on every weight input.
function loadedFlags(n){
  const isKB=call('isKBExercise',n)===true;
  const isWeight=!isKB && call('isTrackableWeight',n)===true;
  return {isKB, isWeight, loaded:isKB||isWeight, isDB:call('isDBExercise',n)===true};
}
function pad(s,n){ s=String(s); return s.length>=n?s:s+' '.repeat(n-s.length); }

// ── LATTICE ────────────────────────────────────────────────────────────────────
const FOCUS=['strength','hypertrophy','fatloss','balanced','support_strength','support_athletic','support_prevention'];
const EQUIP=['home_full','home_basic','commercial','crossfit','bodyweight','minimal']; // home_basic == the "Mini gym" hotel tier (_EQUIP_OPTS:13913); minimal == retired travel tier
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
  return Object.assign({
    name:'MEASURE', unit:'lbs',
    days:['sun','mon','tue','wed','thu','fri','sat'],
    bench:135, squat:155, deadlift:185,
  }, o.goal.f, {
    liftingFocus:o.focus, experience:o.exp, ageBracket:o.age,
    equipment:o.equip, restDays:o.rest.slice(), seed:o.seed,
    injury:o.inj||undefined,
  });
}

const cellsOf=new Map(), occ=new Map(), detailEach=new Map(), detailSample=new Map(), ssMain=new Map();
const byFocus=new Map(), byEquip=new Map(), byInj=new Map(), byExp=new Map(), byWeek=new Map();
let builds=0, mainSections=0, crashed=0; const crashes=[];
function bump(m,k){ m.set(k,(m.get(k)||0)+1); }
function bump2(m,k,sub){ if(!m.has(k)) m.set(k,new Map()); bump(m.get(k),sub); }

function harvest(cellId, cfg, prog){
  Object.keys(prog.weeks||{}).forEach(wk=>{
    const week=prog.weeks[wk]||{};
    Object.keys(week).forEach(d=>{
      const day=week[d]; if(!day||!day.sections) return;
      day.sections.forEach(sec=>{
        if(!/^main/i.test(sec.label||'')) return;
        mainSections++;
        const it=(sec.items||[])[0]; if(!it||!it.name) return;
        const nm=String(it.name).replace(/<svg[\s\S]*?<\/svg>\s*/g,'').trim();
        if(!nm) return;
        if(!cellsOf.has(nm)) cellsOf.set(nm,new Set());
        cellsOf.get(nm).add(cellId);
        bump(occ,nm);
        if(sec.superset||sec.type==='superset') bump(ssMain,nm);
        const det=String(it.detail||'');
        if(!detailEach.has(nm)) detailEach.set(nm,{each:0,total:0});
        const de=detailEach.get(nm); de.total++; if(/\beach\b/i.test(det)) de.each++;
        if(!detailSample.has(nm)) detailSample.set(nm,det);
        if(/\beach\b/i.test(det)) detailSample.set(nm,det);   // prefer an "each" sample if one exists
        bump2(byFocus,nm,cfg.liftingFocus);
        bump2(byEquip,nm,cfg.equipment);
        bump2(byExp,nm,cfg.experience);
        bump2(byInj,nm,cfg.injury?(cfg.injury.region+'/'+cfg.injury.tier):'none');
        bump2(byWeek,nm,+wk<=4?'w1-4':(+wk<=8?'w5-8':'w9+'));
      });
    });
  });
}

function run(list,tag){
  const t0=Date.now();
  list.forEach(o=>{
    const cfg=mkcfg(o);
    const cellId=[tag,o.goal.k,o.focus,o.equip,o.exp,o.age,o.rest.join('+'),o.inj?o.inj.region+'/'+o.inj.tier:'none',o.seed].join('|');
    try{ const prog=IA.buildProgram(cfg); builds++; harvest(cellId,cfg,prog); }
    catch(e){ crashed++; if(crashes.length<10) crashes.push(cellId+' :: '+e.message); }
  });
  console.log('  '+tag+': '+list.length+' cells in '+((Date.now()-t0)/1000).toFixed(1)+'s');
}

const A=[]; // no injury, full cross
GOALS.forEach(goal=>FOCUS.forEach(focus=>EQUIP.forEach(equip=>EXP.forEach(exp=>AGE.forEach(age=>REST.forEach(rest=>SEEDS.forEach(seed=>{
  A.push({goal,focus,equip,exp,age,rest,seed,inj:null});
})))))));
const B=[]; // injury cross
GOALS.forEach(goal=>FOCUS.forEach(focus=>EQUIP.forEach(equip=>INJ.forEach(inj=>SEEDS.slice(0,2).forEach(seed=>{
  B.push({goal,focus,equip,exp:'intermediate',age:'18-35',rest:REST[0],seed,inj});
})))));

console.log('\n── BUILDING LATTICE ──');
console.log('  A = goals4 x focus7 x equip6 x exp3 x age3 x rest2 x seeds'+SEEDS.length+' = '+A.length);
console.log('  B = goals4 x focus7 x equip6 x injury12 x seeds'+Math.min(2,SEEDS.length)+' = '+B.length);
run(A,'A'); run(B,'B');
console.log('builds='+builds+'  crashed='+crashed+'  /^main/i sections walked='+mainSections+'  distinct main-slot names='+cellsOf.size);
if(crashed) crashes.forEach(c=>console.log('  CRASH '+c));
if(!builds||!mainSections){ console.log('MEASUREMENT FAILED — nothing printed'); process.exit(1); }

const names=[...cellsOf.keys()].sort((a,b)=>a.localeCompare(b));
const FL={}; names.forEach(n=>FL[n]=loadedFlags(n));

// ── Q1 ─────────────────────────────────────────────────────────────────────────
console.log('\n══ Q1 — EVERY DISTINCT NAME THAT CAN OCCUPY A MAIN SLOT ══');
console.log('denominator: '+builds+' builds / '+mainSections+' /^main/i sections');
console.log(pad('name',44)+' | cells | item0 occ | bucket | weight-field | flags');
names.forEach(n=>{
  const f=FL[n];
  console.log(pad(n,44)+' | '+String(cellsOf.get(n).size).padStart(5)+' | '+String(occ.get(n)).padStart(9)
    +' | '+pad(_impl(n)||'NULL',6)+' | '+pad(f.loaded?'YES':'no',12)+' | '+(f.isKB?'isKB ':'')+(f.isWeight?'isWeight ':'')+(f.isDB?'isDB':''));
});

// ── Q1b — the subpopulation that can actually reach buildMainLiftBlock ─────────
const reach=names.filter(n=>FL[n].loaded);
const unreach=names.filter(n=>!FL[n].loaded);
const rOcc=reach.reduce((a,n)=>a+occ.get(n),0), tOcc=names.reduce((a,n)=>a+occ.get(n),0);
console.log('\n══ Q1b — REACHABLE SUBPOPULATION (ledgerModel:15437 keeps only +en.weight>0) ══');
console.log('  names with a weight field (loaded = isKB||isWeight, buildExItem:11466): '+reach.length+'/'+names.length
  +'   item0 occurrences '+rOcc+'/'+tOcc+' ('+(100*rOcc/tOcc).toFixed(1)+'%)');
console.log('  names with NO weight field (can never print in Main Lifts): '+unreach.length+'/'+names.length+' — '+unreach.join(', '));
const rb={kb:0,db:0,bb:0,null:0};
reach.forEach(n=>rb[_impl(n)||'null']++);
const ro={kb:0,db:0,bb:0,null:0};
reach.forEach(n=>ro[_impl(n)||'null']+=occ.get(n));
console.log('  of the '+reach.length+' reachable names: bb '+rb.bb+', db '+rb.db+', kb '+rb.kb+', NULL '+rb.null);
console.log('  of the '+rOcc+' reachable item0 occurrences: bb '+ro.bb+', db '+ro.db+', kb '+ro.kb+', NULL '+ro.null
  +'   -> "on the bar" is unsupported on '+(rOcc-ro.bb)+'/'+rOcc+' = '+(100*(rOcc-ro.bb)/rOcc).toFixed(1)+'%');
console.log('  reachable names, sorted:'); reach.forEach(n=>console.log('    '+pad(n,44)+' '+pad(_impl(n)||'NULL',5)+' occ='+occ.get(n)));

// ── Q2 ─────────────────────────────────────────────────────────────────────────
const buckets={kb:[],db:[],bb:[],null:[]};
names.forEach(n=>buckets[_impl(n)||'null'].push(n));
console.log('\n══ Q2 — IMPLEMENT BUCKETS (regex verbatim from index.html:12844, V162 D2) ══');
['kb','db','bb','null'].forEach(b=>{
  const c=buckets[b].length;
  console.log('  '+pad(b,5)+' '+String(c).padStart(3)+'/'+names.length+'  ('+(100*c/names.length).toFixed(1)+'%)   cells='
    +buckets[b].reduce((a,n)=>a+cellsOf.get(n).size,0)+'  item0 occ='+buckets[b].reduce((a,n)=>a+occ.get(n),0));
});
console.log('\n  FULL NULL residue ('+buckets.null.length+' names) — the set the copy has to survive:');
buckets.null.forEach(n=>console.log('    '+pad(n,44)+' weight-field='+(FL[n].loaded?'YES':'no ')+'  cells='+String(cellsOf.get(n).size).padStart(5)+'  occ='+String(occ.get(n)).padStart(6)));
const lnull=buckets.null.filter(n=>FL[n].loaded);
console.log('\n  LOADED-BUT-NULL (has a weight field, classifies null) — '+lnull.length+'/'+buckets.null.length+' of the residue, '
  +lnull.reduce((a,n)=>a+occ.get(n),0)+' occurrences:');
lnull.forEach(n=>console.log('    '+pad(n,44)+' occ='+occ.get(n)+'   (machine/cable/plate/bare-lift name, no implement token)'));
console.log('\n  MULTI-MATCH / MISFIRE check (name satisfying more than one of the three tests):');
let multi=0;
names.forEach(n=>{
  const hits=[_hitKB(n)&&'kb',_hitDB(n)&&'db',_hitBB(n)&&'bb'].filter(Boolean);
  if(hits.length>1){ multi++; console.log('    '+pad(n,44)+' matches ['+hits.join(',')+'] -> regex returns '+_impl(n)); }
});
console.log('    '+multi+'/'+names.length+' main-slot names match more than one implement test');
// same misfire scan over the WHOLE movement library, not just main slots
let lib=[];
function deep(v){ if(typeof v==='string'){ lib.push(v); return; } if(Array.isArray(v)){ v.forEach(deep); return; } if(v&&typeof v==='object'){ if(typeof v.name==='string') lib.push(v.name); Object.values(v).forEach(deep); } }
try{ deep(IA.EXLIB); }catch(e){}
try{ deep(IA.eval('typeof RAND_POOLS!=="undefined"?RAND_POOLS:null')); }catch(e){}
try{ deep(IA.eval('typeof RAND_POOLS!=="undefined"?RAND_POOLS:null')); }catch(e){}
const libU=[...new Set(lib)];
let libMulti=[];
libU.forEach(n=>{ const h=[_hitKB(n),_hitDB(n),_hitBB(n)].filter(Boolean); if(h.length>1) libMulti.push(n); });
console.log('    whole EXLIB: '+libMulti.length+'/'+libU.length+' names match more than one test'+(libMulti.length?' -> '+libMulti.join(' | '):''));

// ── Q3 ─────────────────────────────────────────────────────────────────────────
console.log('\n══ Q3 — WHAT en.weight MEANS: THE LOG INPUT SURFACE, VERBATIM ══');
const srcLines=fs.readFileSync(HTML,'utf8').split('\n');
const q3lines=[11441,11444,11446,11448,11476,11480,11559,11560,11561,11567,11568,11569,11573,11574,11575,11588,11593,11594,11606,11921,11922,11923,11924,11925,12773];
q3lines.forEach(L=>{ const t=(srcLines[L-1]||'').trim(); if(t) console.log('  '+L+': '+t.slice(0,220)); });
console.log('\n  per-hand / per-side / combined assertions anywhere in the file:');
const pats=[/per hand/i,/each hand/i,/per side/i,/in each hand/i,/combined weight/i,/total weight/i,/both dumbbell/i,/one bell/i,/per bell/i,/per dumbbell/i,/one dumbbell/i,/heaviest pair/i];
let found=0;
srcLines.forEach((L,i)=>{ pats.forEach(p=>{ if(p.test(L)){ found++; console.log('    '+(i+1)+': '+L.trim().slice(0,200)); } }); });
console.log('    '+found+' matching lines in the whole file');
console.log('\n  same-scalar check: buildMainLiftBlock hLbl/fLbl (15507/15508) and the chart series (15517 ws=m.series.map(p=>p.wt))');
console.log('  both read ledgerModel mains.heavy.wt / mains.first.wt / series[].wt, all three assigned from +en.weight at 15442-15444.');

// ── Q4 ─────────────────────────────────────────────────────────────────────────
console.log('\n══ Q4 — ONE-SIDED MAIN-SLOT NAMES ══');
console.log('  oracle A: the AUTHORED detail contains /\\beach\\b/ — parseRx:10957 derives perSide from exactly this');
console.log('  oracle B: independent name regex (single-|one-arm|one-leg|bulgarian|split squat|suitcase|offset|staggered|unilateral)');
const nameUni=n=>/\bsingle[- ]|one[- ]arm|one[- ]leg|bulgarian|split squat|suitcase|offset|staggered|unilateral/i.test(n);
let uniA=0, uniB=0, agree=0, uniLoaded=0, uniLoadedOcc=0;
names.forEach(n=>{
  const de=detailEach.get(n), a=de.each>0, b=nameUni(n);
  if(a) uniA++; if(b) uniB++; if(a===b) agree++;
  if(b&&FL[n].loaded){ uniLoaded++; uniLoadedOcc+=occ.get(n); }
  if(a||b) console.log('    '+pad(n,44)+' detail-each '+String(de.each).padStart(6)+'/'+String(de.total).padStart(6)
    +'  nameregex='+(b?'Y':'n')+'  bucket='+pad(_impl(n)||'NULL',5)+' weight-field='+(FL[n].loaded?'YES':'no')
    +'\n        sample detail: "'+detailSample.get(n)+'"');
});
console.log('    detail-"each": '+uniA+'/'+names.length+'   name-regex: '+uniB+'/'+names.length+'   oracles agree on '+agree+'/'+names.length);
console.log('    one-sided AND carrying a weight field (the set where per-side load matters): '+uniLoaded+'/'+names.length+', '+uniLoadedOcc+' item0 occurrences');
console.log('    main-slot item0 details containing /\\beach\\b/: '+names.reduce((a,n)=>a+detailEach.get(n).each,0)+'/'+mainSections);
console.log('    -> parseRx.perSide is therefore false on every main slot; rxSuffix:11041 never prints "/side" there.');

// ── SEGMENTATION ───────────────────────────────────────────────────────────────
function seg(title,map){
  console.log('\n══ SEGMENT — '+title+' ══');
  const S=new Map();
  names.forEach(n=>{ const b=_impl(n)||'null'; const L=FL[n].loaded;
    (map.get(n)||new Map()).forEach((cnt,k)=>{
      if(!S.has(k)) S.set(k,{kb:0,db:0,bb:0,null:0,tot:0,ldTot:0,ldBB:0});
      const s=S.get(k); s[b]+=cnt; s.tot+=cnt; if(L){ s.ldTot+=cnt; if(b==='bb') s.ldBB+=cnt; }
    });
  });
  [...S.keys()].sort().forEach(k=>{ const s=S.get(k);
    console.log('  '+pad(k,20)+' bb '+String(s.bb).padStart(6)+'  db '+String(s.db).padStart(6)+'  kb '+String(s.kb).padStart(6)
      +'  NULL '+String(s.null).padStart(6)+'   | weight-field occ '+String(s.ldTot).padStart(6)
      +'  of which non-bb '+(s.ldTot?(100*(s.ldTot-s.ldBB)/s.ldTot).toFixed(1):'--')+'%');
  });
}
seg('equipment tier', byEquip);
seg('lifting focus', byFocus);
seg('experience', byExp);
seg('injury state', byInj);
seg('week band', byWeek);
let ssTot=0; ssMain.forEach(v=>ssTot+=v);
console.log('\n  main sections that are ALSO supersets (exControlFlags:11389 excludes these from isMainSlot, _slotOfEntry:15385 does not): '
  +ssTot+' occurrences / '+mainSections+' main sections');

// ── Q6 ─────────────────────────────────────────────────────────────────────────
console.log('\n══ Q6 — REPRODUCTION (real ledgerModel + real buildMainLiftBlock) ══');
reproFor(n=>_impl(n)==='db','DUMBBELL');
reproFor(n=>_impl(n)==='kb','KETTLEBELL');
reproFor(n=>_impl(n)===null&&FL[n]&&FL[n].loaded,'LOADED-NULL (machine)');
reproFor(n=>nameUni(n)&&FL[n]&&FL[n].loaded,'ONE-SIDED');
reproFor(n=>_impl(n)==='bb','BARBELL (control — the only case the copy is true for)');

function reproFor(pred, tag){
  for(const o of A){
    const cfg=mkcfg(o);
    let prog; try{ prog=IA.buildProgram(cfg); }catch(e){ continue; }
    const hits=[];
    Object.keys(prog.weeks).sort((a,b)=>+a-+b).forEach(wk=>{
      Object.keys(prog.weeks[wk]).forEach(d=>{
        const day=prog.weeks[wk][d]; if(!day||!day.sections) return;
        day.sections.forEach(sec=>{
          if(!/^main/i.test(sec.label||'')) return;
          const it=(sec.items||[])[0]; if(!it||!it.name) return;
          const nm=String(it.name).replace(/<svg[\s\S]*?<\/svg>\s*/g,'').trim();
          if(pred(nm)) hits.push({wk:+wk,d,nm,detail:it.detail||'',day});
        });
      });
    });
    if(!hits.length) continue;
    const nm=hits[0].nm, mine=hits.filter(h=>h.nm===nm);
    if(mine.length<3) continue;
    const key=IA.exStoreKey(nm);
    const hist={}; mine.forEach(h=>{ hist['w'+h.wk+'_'+h.d]=JSON.parse(JSON.stringify(h.day)); });
    const exw={}; exw[key]={name:nm, entries:[]};
    const loads=[60,70,80], reps=[12,10,8];
    mine.slice(0,3).forEach((h,i)=>{
      exw[key].entries.push({weight:loads[i], setsReps:'3x'+reps[i], setsDone:[reps[i],reps[i],reps[i]],
        setsW:[loads[i],loads[i],loads[i]], week:h.wk, day:h.d, ts:1757000000000+i});
    });
    const model=IA.eval('ledgerModel')(exw,hist);
    const m=model.mains.filter(x=>x.name===nm)[0];
    console.log('\n  ['+tag+']');
    console.log('  cfg: {liftingFocus:'+cfg.liftingFocus+', equipment:'+cfg.equipment+', experience:'+cfg.experience
      +', ageBracket:'+cfg.ageBracket+', goal:'+o.goal.k+', restDays:['+cfg.restDays.join(',')+'], injury:none, unit:lbs, seed:'+cfg.seed+'}');
    console.log('  name="'+nm+'"  exStoreKey="'+key+'"  bucket='+(_impl(nm)||'NULL')+'  weight-field='+(loadedFlags(nm).loaded?'YES':'no'));
    console.log('  prescription: "'+mine[0].detail+'"');
    console.log('  main-slot sessions synthesised: '+mine.slice(0,3).map(h=>'w'+h.wk+'_'+h.d).join(', ')+'  @ 60/70/80 lbs x 12/10/8');
    if(!m){ console.log('  ledgerModel did NOT classify it as a main — repro FAILED'); return; }
    const html=IA.eval('buildMainLiftBlock')(m,'lbs');
    const line=html.replace(/<svg[\s\S]*?<\/svg>/g,'[chart svg]');
    console.log('  RENDERED HTML:\n  '+line);
    console.log('  RENDERED TEXT: '+line.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim());
    console.log('  contains "on the bar": '+/on the bar/.test(html));
    return;
  }
  console.log('\n  ['+tag+'] no lattice cell produced 3 main-slot sessions of one such name — repro not attempted');
}

// ── Q5 ─────────────────────────────────────────────────────────────────────────
console.log('\n══ Q5 — OTHER READERS OF THE SAME FRAME ══');
const q5=[
  ['15513','THE DEFECT — " on the bar" literal, buildMainLiftBlock'],
  ['15479','hLbl — heaviest set, disp(hv.wt) (implement-neutral)'],
  ['15480','fLbl — opening set, disp(fs.wt) (implement-neutral)'],
  ['15507','gain = disp(hv.wt)-disp(fs.wt) — the value "on the bar" annotates'],
  ['15512','Opened at <fLbl> (implement-neutral)'],
  ['15514','heaviest in week N (implement-neutral)'],
  ['15544','ladder: "Add weight" (implement-neutral)'],
  ['15545','ladder: "N to go" (implement-neutral)'],
  ['15562','Main Lifts card footer (implement-neutral)'],
  ['15573','"ready to move up" (implement-neutral)'],
  ['15575','"You have stepped the weight up N times" (implement-neutral)'],
  ['15576','"add weight and start back at the bottom" (implement-neutral)'],
  ['15580','ladder footer "ready for more weight" (implement-neutral)'],
  ['15183','buildLedgerCard "best set NxR" (DEAD - see reachability below)'],
  ['15190','buildLedgerCard e1RM row (DEAD)'],
  ['15202','buildLedgerCard accessory e1RM (DEAD)'],
  ['15205','buildLedgerCard footer (DEAD)'],
  ['12619','rangeTopNudgeHTML "Time to add weight." (implement-neutral)'],
  ['12620','"Go up in weight today" (implement-neutral)'],
  ['1106','rpe-info-note accessories (implement-neutral)'],
  ['11559','per-set load cell + "Top" pip'],
  ['11561','per-set unit chip = wunit'],
  ['11567','"Top set" / "Every set" footer label'],
  ['11569','"This is what tracks your progress"'],
  ['11573','collapsed field label "Top set" / "Load"'],
  ['11575','unit chip = wunit (lb for KB, lbs/kg otherwise)'],
  ['11593','stale-load warning "That N lbs ..."'],
  ['11606','"Fill every set with N lbs"'],
  ['12773','toast "N lbs logged"'],
  ['9036','swapLoadNote "Much lighter than X" (implement-neutral)'],
  ['14020','travel overlay bodyweight copy'],
  ['14021','travel overlay Mini-gym copy — ASSERTS A PAIR ("grab the heaviest pair", "go single arm")'],
  ['15663','big-3 weekly chart reader of en.weight — excludes dumbbell by name'],
  ['15664','big-3 squat guard'],
  ['15665','big-3 deadlift guard'],
];
q5.forEach(([L,why])=>{ const t=(srcLines[+L-1]||'').trim(); console.log('  '+L+'  ['+why+']\n      '+t.slice(0,240)); });
// is buildLedgerCard reachable? strip comments first (§10b).
const noComment=fs.readFileSync(HTML,'utf8').split('\n').map(l=>l.replace(/^\s*\/\/.*$/,'')).join('\n');
const refs=(noComment.match(/buildLedgerCard\b(?!s)/g)||[]).length;
const refsS=(noComment.match(/buildLedgerCards\b/g)||[]).length;
console.log('\n  reachability (comments stripped): buildLedgerCard  refs='+refs+' (1 == definition only == DEAD)   buildLedgerCards refs='+refsS);


// ── EXTRA: the RAND_POOLS (wildcard) 'Main' population ─────────────────────────
// A wildcard day renders through buildSectionsHTML(10862) -> buildExItem(11390), so its
// movements CAN write ia_exw_ entries. But completeWildcard(10156) calls markDayComplete,
// which snapshots the PROGRAM day into ia_hist_ (snapshotDay:1281) — never the wildcard.
// _slotOfEntry(15385) resolves against that snapshot, so a wildcard-only name resolves to
// null and never reaches buildMainLiftBlock. Printed here so the boundary is on the record.
console.log('\n══ EXTRA — RAND_POOLS wildcard "Main" item0 names ══');
let RP=null; try{ RP=IA.eval('typeof RAND_POOLS!=="undefined"?RAND_POOLS:null'); }catch(e){}
if(!RP){ console.log('  RAND_POOLS not reachable from the harness context — NOT MEASURED'); }
else{
  const wnames=new Map();
  Object.keys(RP).forEach(goal=>(RP[goal]||[]).forEach(w=>(w.sections||[]).forEach(sec=>{
    if(!/^main/i.test(sec.label||'')) return;
    const it=(sec.items||[])[0]; if(!it||!it.name) return;
    bump(wnames,it.name);
  })));
  const wn=[...wnames.keys()].sort();
  console.log('  '+wn.length+' distinct wildcard main-slot names across '+Object.keys(RP).length+' goal pools');
  wn.forEach(n=>console.log('    '+pad(n,44)+' bucket='+pad(_impl(n)||'NULL',5)+' weight-field='+(loadedFlags(n).loaded?'YES':'no ')+'  in-engine-main-population='+(cellsOf.has(n)?'YES':'no')));
  const overlap=wn.filter(n=>cellsOf.has(n));
  console.log('  overlap with the engine main-slot population: '+overlap.length+'/'+wn.length+' — '+(overlap.join(', ')||'none'));
}
