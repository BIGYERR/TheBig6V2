// v195 — measure pass: "a lift whose main-slot sessions are all unloaded".
//
// ledgerModel (index.html:15430) does:
//     const mainEns = all.filter(en => _slotOfEntry(hist,name,en)==='main');
//     if(mainEns.length){ const loaded = mainEns.filter(en=>+en.weight>0);
//                         if(!loaded.length) return;            // <-- THE SUSPECT
//                         ...; return; }
//     // ladder / plain / unloaded routing lives BELOW
// Concern: a movement with >=1 main-slot session and NO main-slot session carrying
// weight>0 returns before it can reach the `unloaded` bucket, so it never renders.
//
// MODE B (before-picture) with a MODE A repro of coach's concrete case first.
// READ-ONLY. Never rules. Answers Q1..Q6 of the V195 scope.
//
// TWO ARTIFACTS, measured separately (V194 is still with gatekeeper):
//   BASE = /tmp/m195_base_V193.html   (git show HEAD:index.html)
//   WORK = index.html                 (V194, D53/D54/D55)
// V194's D55 rewrote ledgerModel's range lookup, which sits BELOW the suspect block.
//
// ORACLES (each independent of ledgerModel):
//  Q1 — the guard chain is read from the WRITE path, not the read path:
//       exLoggable(11116) / buildExItem(11397, `const loaded=isKB||isWeight` at 11476)
//       / saveExWeight(12736) / logExerciseWeight(11897). The ia_exw_ row is produced by
//       calling the REAL logExerciseWeight against the REAL localStorage, then read back
//       out of the store as bytes. ledgerModel is never asked what a row looks like.
//  Q2 — ia_hist_ is a verbatim deep copy of the built day, exactly what snapshotDay(1281)
//       writes ("h[k]=JSON.parse(JSON.stringify(day))"). ia_exw_ entries are in the shape
//       logExerciseWeight(11921) pushes. Expected bucket comes from the authoring contract
//       in the comment at 15452 ("if(!(wt>0)) unloaded.push"), not from running the function.
//  Q3 — main-slot membership is read off buildProgram's OWN output (item 0 of a /^main/i
//       section — the V162 D0 contract that _slotOfEntry:15396 encodes). loaded-ness is
//       read from isKBExercise/isTrackableWeight, the same two predicates buildExItem:11476
//       uses to decide whether a weight input exists at all.
//  Q4 — exStoreKey() is the single writer of slug keys (CLAUDE.md); collisions are computed
//       over programmed names, not assumed.
//  Q5 — consumers are grepped out of the source text and printed with line numbers.
//  Q6 — the athlete-visible string is the return value of the REAL buildLedgerCards.
//
// usage: node tests/measure/v195_unloaded_main_slot_drop.js [--fast]
const fs=require('fs'), path=require('path');
const {load, fixtures, progDigest}=require(path.join(__dirname,'..','harness.js'));
const ROOT=path.join(__dirname,'..','..');
const WORK=path.join(ROOT,'index.html');
const BASE='/tmp/m195_base_V193.html';
const FAST=process.argv.includes('--fast');
function pad(s,n){ s=String(s); return s.length>=n?s:s+' '.repeat(n-s.length); }
function rpad(s,n){ s=String(s); return s.length>=n?s:' '.repeat(n-s.length)+s; }
const clean=n=>String(n||'').replace(/<svg[\s\S]*?<\/svg>\s*/g,'').trim();

if(!fs.existsSync(BASE)){ console.log('MEASUREMENT FAILED — '+BASE+' missing. Run: git show HEAD:index.html > '+BASE); process.exit(1); }

const A={}; // artifact registry
[['V194-work',WORK],['V193-base',BASE]].forEach(([tag,p])=>{
  const IA=load(p);
  A[tag]={IA, path:p, src:fs.readFileSync(p,'utf8'), lines:fs.readFileSync(p,'utf8').split('\n')};
});
console.log('ARTIFACTS');
Object.keys(A).forEach(t=>console.log('  '+pad(t,12)+' ia-version '+A[t].IA.version+'   '+A[t].path));
// baseline == itself, both artifacts (V182 lesson)
Object.keys(A).forEach(t=>{
  const IA=A[t].IA;
  const d1=progDigest(IA.buildProgram(fixtures.HALF_MANNY));
  const d2=progDigest(IA.buildProgram(fixtures.HALF_MANNY));
  console.log('  '+pad(t,12)+' HALF_MANNY digest '+d1+'  self-stable='+(d1===d2?'yes':'NO'));
  A[t].digest=d1;
});
console.log('  engine identical across the two artifacts: '+(A['V194-work'].digest===A['V193-base'].digest?'YES (same digest)':'NO'));

// per-artifact helpers
function mk(t){
  const IA=A[t].IA;
  const H={IA};
  H.ledgerModel=IA.eval('ledgerModel');
  H._slotOfEntry=IA.eval('_slotOfEntry');
  H._rxRangeFor=IA.eval('_rxRangeFor');
  H._setsOf=IA.eval('_setsOf');
  H.parseRx=IA.parseRx;
  H.exStoreKey=IA.exStoreKey;
  const c=new Map();
  H.loadedOf=function(n){
    if(c.has(n)) return c.get(n);
    const isKB=IA.eval('isKBExercise('+JSON.stringify(n)+')')===true;
    const isWeight=!isKB && IA.eval('isTrackableWeight('+JSON.stringify(n)+')')===true;
    const v={isKB,isWeight,loaded:isKB||isWeight};
    c.set(n,v); return v;
  };
  H.exLoggable=function(n,d){ return IA.eval('exLoggable('+JSON.stringify(n)+','+JSON.stringify(d||'')+')')===true; };
  return H;
}
Object.keys(A).forEach(t=>{ A[t].H=mk(t); });

// ═══════════════════════════════════════════════════════════════════════════════
// Q1 — DOES IT FIRE AT ALL? the ia_exw_ WRITE path for an unloaded main-slot lift
// ═══════════════════════════════════════════════════════════════════════════════
console.log('\n══════════════════════════════════════════════════════════════════════════');
console.log('Q1 — DOES AN UNLOADED MAIN-SLOT MOVEMENT EVER WRITE AN ia_exw_ ROW?');
console.log('══════════════════════════════════════════════════════════════════════════');
const TGT='Pushups (slow tempo)';
const FX=fixtures.HALF_MANNY;
console.log('  reporter cfg: '+JSON.stringify({goal:FX.cardioGoals.run.id,focus:FX.liftingFocus,equipment:FX.equipment,
  experience:FX.experience,ageBracket:FX.ageBracket,restDays:FX.restDays,seed:FX.seed}));

function placements(prog,name){
  const out=[];
  Object.keys(prog.weeks||{}).sort((a,b)=>+a-+b).forEach(wk=>{
    const week=prog.weeks[wk]||{};
    Object.keys(week).forEach(d=>{
      const day=week[d]; if(!day||!day.sections) return;
      day.sections.forEach((sec,si)=>(sec.items||[]).forEach((it,ii)=>{
        if(!it||!it.name) return;
        if(clean(it.name)!==name) return;
        out.push({wk:+wk,d,si,ii,label:sec.label||'',detail:it.detail||'',
          main0:/^main/i.test(sec.label||'')&&ii===0, day});
      }));
    });
  });
  return out;
}

const Q1={};
Object.keys(A).forEach(t=>{
  const IA=A[t].IA, H=A[t].H;
  const prog=IA.buildProgram(FX);
  const pl=placements(prog,TGT);
  Q1[t]={prog,pl};
  console.log('\n  ── '+t+' ──');
  console.log('  weeks='+Object.keys(prog.weeks).length+'  "'+TGT+'" placements: '+pl.length
    +'  (item0 of /^main/i: '+pl.filter(p=>p.main0).length+')');
  pl.forEach(p=>console.log('    W'+rpad(p.wk,2)+' '+p.d.toUpperCase()+'  label="'+pad(p.label,14)+'" idx='+p.ii
    +' main0='+(p.main0?'Y':'n')+'  detail="'+p.detail+'"'));
  const lf=H.loadedOf(TGT);
  console.log('  buildExItem:11476  isKB='+lf.isKB+'  isWeight(isTrackableWeight)='+lf.isWeight+'  => loaded='+lf.loaded);
  const w5=pl.filter(p=>p.wk===5&&p.d==='fri')[0]||pl.filter(p=>p.main0)[0]||pl[0];
  if(!w5){ console.log('  MEASUREMENT FAILED — no placement to test'); }
  else{
    const rx=H.parseRx(w5.detail,TGT);
    console.log('  on W'+w5.wk+' '+w5.d.toUpperCase()+':  parseRx -> '+JSON.stringify(rx));
    console.log('  exLoggable(name,detail) = '+H.exLoggable(TGT,w5.detail));
    console.log('  => card renders the ex-log block?  rx||loaded = '+(!!rx||lf.loaded)+'   (buildExItem:11477)');
    console.log('  => '+(rx?rx.sets:0)+' rep rows (11526 for(let s=0;s<rx.sets;s++)); per-set LOAD cell at 11551 is'
      +' guarded by if(loaded) -> '+(lf.loaded?'rendered':'NOT rendered'));
    console.log('  => collapsed Load input `exw_<key>` at 11572-11574 is guarded by if(loaded) -> '
      +(lf.loaded?'rendered':'NOT rendered'));
    console.log('  => Log button at 11610 is UNGUARDED inside the rx||loaded block -> rendered');
  }
});
console.log('\n  the three guards, verbatim (V194-work line numbers; identical bytes in V193-base):');
[11476,11477,11551,11566,11572,11610,12750,12752,12755,12768,12769,11899,11921,11922].forEach(L=>{
  const a=A['V194-work'].lines[L-1]||'', b=A['V193-base'].lines[L-1]||'';
  console.log('    '+rpad(L,5)+': '+a.trim().slice(0,150)+(a===b?'':'   [V193 DIFFERS: '+b.trim().slice(0,90)+']'));
});

// THE REAL WRITER. No DOM: call logExerciseWeight(11897) directly, which is what
// saveExWeight(12769) calls once its own guard at 12768 passes.
console.log('\n  ── REAL WRITE, against the real localStorage (logExerciseWeight:11897) ──');
Object.keys(A).forEach(t=>{
  const IA=A[t].IA;
  IA.localStorage.clear();
  IA.eval('activeProgId="P195"; currentWeek=5; currentDayKey="fri";');
  const p5=Q1[t].pl.filter(p=>p.wk===5&&p.d==='fri')[0]||Q1[t].pl.filter(p=>p.main0)[0];
  const rx=p5?A[t].H.parseRx(p5.detail,TGT):null;
  const tgtReps=(rx&&rx.target)||12;
  const sets=rx?rx.sets:3;
  const sd=new Array(sets).fill(tgtReps);
  // (a) weight 0 + setsDone populated — what an unloaded card produces (12751 storedW=0,
  //     hasW=false because there is no exw_ input at all; 12762 setsW=[] because there are
  //     no exsetw_ cells).
  IA.eval('logExerciseWeight('+JSON.stringify(TGT)+',0,"",5,'+JSON.stringify(sd)+',[],"fri")');
  const row=JSON.parse(IA.localStorage.getItem('ia_exw_P195')||'{}');
  console.log('  '+t+'  (a) weight=0, setsDone='+JSON.stringify(sd)+' ->  ia_exw_P195 = '+JSON.stringify(row));
  // (b) control — weight 0 AND no setsDone: the 11899 guard
  IA.localStorage.clear();
  IA.eval('logExerciseWeight('+JSON.stringify(TGT)+',0,"",5,[],[],"fri")');
  console.log('  '+t+'  (b) weight=0, setsDone=[]      ->  ia_exw_P195 = '
    +(IA.localStorage.getItem('ia_exw_P195')||'(key absent)')+'   [guard 11899]');
  IA.localStorage.clear();
});

// ═══════════════════════════════════════════════════════════════════════════════
// Q2 — IF A ROW EXISTS, WHAT HAPPENS?
// ═══════════════════════════════════════════════════════════════════════════════
console.log('\n══════════════════════════════════════════════════════════════════════════');
console.log('Q2 — THE ROW EXISTS. WHERE DOES ledgerModel PUT IT?');
console.log('══════════════════════════════════════════════════════════════════════════');
function synth(H, name, sites, weights){
  // ia_hist_ shape: snapshotDay(1281) deep-copies the built day under 'w<week>_<day>'
  const hist={}; sites.forEach(s=>{ hist['w'+s.wk+'_'+s.d]=JSON.parse(JSON.stringify(s.day)); });
  // ia_exw_ shape: logExerciseWeight(11921) entry
  const key=H.exStoreKey(name);
  const exw={}; exw[key]={name, entries:[]};
  sites.forEach((s,i)=>{
    const rx=H.parseRx(s.detail,name);
    const tgt=(rx&&rx.target)||12, ns=(rx&&rx.sets)||3;
    const w=weights?weights[i]:0;
    exw[key].entries.push({weight:w, setsReps:'', setsDone:new Array(ns).fill(tgt),
      setsW: w>0?new Array(ns).fill(w):[], week:s.wk, day:s.d, ts:1757000000000+i});
  });
  return {hist,exw,key};
}
function bucketsOf(model,name){
  return ['mains','ladder','plain','unloaded'].filter(b=>(model[b]||[]).some(r=>r.name===name));
}
Object.keys(A).forEach(t=>{
  const H=A[t].H;
  const pl=Q1[t].pl;
  const mainSites=pl.filter(p=>p.main0);
  const otherSites=pl.filter(p=>!p.main0);
  console.log('\n  ── '+t+' ──');
  console.log('  main0 placements available: '+mainSites.length+'   non-main placements available: '+otherSites.length);
  // TEST: logged on the main-slot days only
  if(mainSites.length){
    const S=synth(H,TGT,mainSites);
    console.log('  TEST  ia_exw_["'+S.key+'"] = '+JSON.stringify(S.exw[S.key]));
    console.log('        ia_hist_ keys = '+Object.keys(S.hist).join(', '));
    mainSites.forEach(s=>console.log('        _slotOfEntry(hist,name,{week:'+s.wk+',day:"'+s.d+'"}) = '
      +H._slotOfEntry(S.hist,TGT,{week:s.wk,day:s.d})));
    const m=H.ledgerModel(S.exw,S.hist);
    console.log('        ledgerModel returned: '+JSON.stringify(m));
    console.log('        buckets containing "'+TGT+'": '+(bucketsOf(m,TGT).join(', ')||'NONE'));
    console.log('        EXPECTED by the authoring contract at 15452 (wt<=0 -> unloaded): unloaded');
  } else console.log('  MEASUREMENT FAILED — no main0 placement in this build');
  // CONTROL: same movement, same rows, logged only where it is NOT a main slot
  if(otherSites.length){
    const S2=synth(H,TGT,otherSites.slice(0,Math.max(2,Math.min(3,otherSites.length))));
    const m2=H.ledgerModel(S2.exw,S2.hist);
    console.log('  CTRL  logged on '+Object.keys(S2.hist).length+' NON-main days ('+Object.keys(S2.hist).join(', ')+')');
    Object.keys(S2.hist).forEach(k=>{ const mm=k.match(/^w(\d+)_(.+)$/);
      console.log('        _slotOfEntry = '+H._slotOfEntry(S2.hist,TGT,{week:+mm[1],day:mm[2]})); });
    console.log('        ledgerModel returned: '+JSON.stringify(m2));
    console.log('        buckets containing "'+TGT+'": '+(bucketsOf(m2,TGT).join(', ')||'NONE'));
  } else console.log('  CTRL  (no non-main placement of this movement in this build)');
  // MIXED: main-slot days AND non-main days in the same store
  if(mainSites.length&&otherSites.length){
    const S3=synth(H,TGT,mainSites.concat(otherSites));
    const m3=H.ledgerModel(S3.exw,S3.hist);
    console.log('  MIX   '+(mainSites.length)+' main + '+(otherSites.length)+' non-main sessions, all weight 0');
    console.log('        ledgerModel returned: '+JSON.stringify(m3));
    console.log('        buckets: '+(bucketsOf(m3,TGT).join(', ')||'NONE')
      +'   sessions in store: '+S3.exw[S3.key].entries.length);
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// Q3 — THE DENOMINATOR (lattice)
// ═══════════════════════════════════════════════════════════════════════════════
console.log('\n══════════════════════════════════════════════════════════════════════════');
console.log('Q3 — THE LATTICE: every unloaded movement that is ever item0 of a /^main/i section');
console.log('══════════════════════════════════════════════════════════════════════════');
// same lattice as tests/measure/v194b_push_press_never_a_main.js
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
const CELLS=[];
GOALS.forEach(goal=>FOCUS.forEach(focus=>EQUIP.forEach(equip=>EXP.forEach(exp=>AGE.forEach(age=>REST.forEach(rest=>SEEDS.forEach(seed=>
  CELLS.push({tag:'A',goal,focus,equip,exp,age,rest,seed,inj:null}))))))));
GOALS.forEach(goal=>FOCUS.forEach(focus=>EQUIP.forEach(equip=>INJ.forEach(inj=>SEEDS.slice(0,2).forEach(seed=>
  CELLS.push({tag:'B',goal,focus,equip,exp:'intermediate',age:'18-35',rest:REST[0],seed,inj}))))));
console.log('  lattice: A='+CELLS.filter(c=>c.tag==='A').length+' (goals4 x focus7 x equip6 x exp3 x age3 x rest2 x seeds'+SEEDS.length+')'
  +'  B='+CELLS.filter(c=>c.tag==='B').length+' (goals4 x focus7 x equip6 x injury12 x seeds'+Math.min(2,SEEDS.length)+')'
  +'  TOTAL='+CELLS.length);

function sweep(t){
  const IA=A[t].IA, H=A[t].H;
  const R={builds:0,crashed:0,crashes:[],sections:0,items:0,mainSecs:0,
    main0Occ:new Map(), main0Cells:new Map(), otherOcc:new Map(), otherCells:new Map(),
    main0Loggable:new Map(), main0NotLoggable:new Map(),
    affected:0, affectedByEquip:new Map(), affectedByFocus:new Map(), affectedByGoal:new Map(),
    affectedByExp:new Map(), affectedByName:new Map(), affectedSessions:0, affectedMainSessions:0,
    cellsWithAny:0, cellsWithAffected:0, pairsMain0:0, pairsMain0Unloaded:0,
    rescuedByCollision:0, rescuedDetail:new Map(),
    notLoggablePairs:0, nameSeen:new Set(), sampMain:new Map(), sampOther:new Map(),
    byEquipNames:new Map(), cellsTotal:0, unloadedMain0Names:new Set(), loadedMain0Names:new Set(),
    mixedKey:new Map()};
  const bump=(m,k,v)=>m.set(k,(m.get(k)||0)+(v==null?1:v));
  const addc=(m,k,c)=>{ if(!m.has(k)) m.set(k,new Set()); m.get(k).add(c); };
  CELLS.forEach(o=>{
    const cfg=mkcfg(o);
    const cellId=[o.tag,o.goal.k,o.focus,o.equip,o.exp,o.age,o.rest.join('+'),o.inj?o.inj.region+'/'+o.inj.tier:'none',o.seed].join('|');
    let prog;
    try{ prog=IA.buildProgram(cfg); }
    catch(e){ R.crashed++; if(R.crashes.length<10) R.crashes.push(cellId+' :: '+e.message); return; }
    R.builds++; R.cellsTotal++;
    // per-cell harvest
    const cMain0=new Map();   // name -> {occ, loggableOcc, samples[]}
    const cOther=new Map();   // name -> occ
    const cNames=new Set();
    Object.keys(prog.weeks||{}).forEach(wk=>{
      const week=prog.weeks[wk]||{};
      Object.keys(week).forEach(d=>{
        const day=week[d]; if(!day||!day.sections) return;
        day.sections.forEach(sec=>{
          R.sections++;
          const isMainSec=/^main/i.test(sec.label||'');
          if(isMainSec) R.mainSecs++;
          (sec.items||[]).forEach((it,ii)=>{
            if(!it||!it.name) return;
            const nm=clean(it.name); if(!nm) return;
            if(/^\s*<svg/i.test(it.name)) return;
            R.items++; cNames.add(nm); R.nameSeen.add(nm);
            if(isMainSec&&ii===0){
              if(!cMain0.has(nm)) cMain0.set(nm,{occ:0,loggableOcc:0,samples:[]});
              const e=cMain0.get(nm); e.occ++;
              if(H.parseRx(it.detail||'',nm)||H.loadedOf(nm).loaded) e.loggableOcc++;
              if(e.samples.length<3) e.samples.push({wk:+wk,d,label:sec.label||'',ii,detail:it.detail||'',day});
              bump(R.main0Occ,nm); addc(R.main0Cells,nm,cellId);
              if(!R.byEquipNames.has(o.equip)) R.byEquipNames.set(o.equip,new Set());
              R.byEquipNames.get(o.equip).add(nm);
              if(!R.sampMain.has(nm)) R.sampMain.set(nm,{cfg:cellId,wk:+wk,d,label:sec.label||'',detail:it.detail||'',day:JSON.parse(JSON.stringify(day))});
            } else {
              cOther.set(nm,(cOther.get(nm)||0)+1);
              bump(R.otherOcc,nm); addc(R.otherCells,nm,cellId);
              if(!R.sampOther.has(nm)) R.sampOther.set(nm,{cfg:cellId,wk:+wk,d,label:sec.label||'',detail:it.detail||'',day:JSON.parse(JSON.stringify(day))});
            }
          });
        });
      });
    });
    // per-cell exStoreKey -> names, to find a loaded sibling under the same store key
    const keyToNames=new Map();
    cNames.forEach(n=>{ const k=H.exStoreKey(n); if(!keyToNames.has(k)) keyToNames.set(k,new Set()); keyToNames.get(k).add(n); });
    let cellHasAny=false, cellHasAff=false;
    cMain0.forEach((e,nm)=>{
      R.pairsMain0++;
      const lf=H.loadedOf(nm);
      if(lf.loaded){ R.loadedMain0Names.add(nm); return; }
      R.unloadedMain0Names.add(nm);
      R.pairsMain0Unloaded++;
      cellHasAny=true;
      if(!e.loggableOcc){ R.notLoggablePairs++; bump(R.main0NotLoggable,nm); return; }
      bump(R.main0Loggable,nm);
      // does ANY other programmed name in this cell share the store key AND carry load?
      const sibs=[...(keyToNames.get(H.exStoreKey(nm))||new Set())].filter(x=>x!==nm&&H.loadedOf(x).loaded);
      if(sibs.length){ R.rescuedByCollision++; bump(R.rescuedDetail,nm+' <- '+sibs.join('/')); return; }
      R.affected++; cellHasAff=true;
      R.affectedSessions+=e.occ+(cOther.get(nm)||0);
      R.affectedMainSessions+=e.occ;
      bump(R.affectedByEquip,o.equip); bump(R.affectedByFocus,o.focus);
      bump(R.affectedByGoal,o.goal.k); bump(R.affectedByExp,o.exp); bump(R.affectedByName,nm);
    });
    if(cellHasAny) R.cellsWithAny++;
    if(cellHasAff) R.cellsWithAffected++;
  });
  return R;
}
const SW={};
Object.keys(A).forEach(t=>{
  const t0=Date.now();
  SW[t]=sweep(t);
  console.log('\n  ── '+t+' — '+SW[t].builds+' builds in '+((Date.now()-t0)/1000).toFixed(1)+'s, crashed='+SW[t].crashed);
  const R=SW[t];
  if(R.crashed) R.crashes.forEach(c=>console.log('    CRASH '+c));
  if(!R.builds||!R.items){ console.log('    MEASUREMENT FAILED — nothing harvested'); return; }
  console.log('    denominator: '+R.builds+' builds / '+R.sections+' sections ('+R.mainSecs+' /^main/i) / '+R.items+' items');
  console.log('    distinct names programmed anywhere: '+R.nameSeen.size);
  const everMain=[...R.main0Cells.keys()];
  const unl=everMain.filter(n=>!A[t].H.loadedOf(n).loaded);
  console.log('    names EVER item0 of a /^main/i section: '+everMain.length);
  console.log('      of those UNLOADED (no weight field per buildExItem:11476): '+unl.length
    +'/'+everMain.length+' = '+(100*unl.length/everMain.length).toFixed(1)+'%');
  console.log('      of those LOADED: '+(everMain.length-unl.length));
  console.log('\n    EVERY UNLOADED item0-of-main NAME ('+unl.length+'):');
  console.log('      '+pad('name',40)+rpad('main0 cells',12)+rpad('main0 occ',11)+rpad('other cells',12)+rpad('other occ',11)+'  loggable-in-cells');
  unl.sort((a,b)=>(R.main0Cells.get(b)||new Set()).size-(R.main0Cells.get(a)||new Set()).size).forEach(n=>{
    console.log('      '+pad(n,40)+rpad((R.main0Cells.get(n)||new Set()).size,12)+rpad(R.main0Occ.get(n)||0,11)
      +rpad((R.otherCells.get(n)||new Set()).size,12)+rpad(R.otherOcc.get(n)||0,11)
      +'  '+(R.main0Loggable.get(n)||0)+' loggable / '+(R.main0NotLoggable.get(n)||0)+' not');
  });
  console.log('\n    (config, movement) PAIRS');
  console.log('      pairs where a movement is item0 of a main section : '+R.pairsMain0);
  console.log('      ...of which the movement is UNLOADED               : '+R.pairsMain0Unloaded
    +'  ('+(100*R.pairsMain0Unloaded/R.pairsMain0).toFixed(1)+'%)');
  console.log('      ...minus pairs that can never be logged (no rx)    : -'+R.notLoggablePairs);
  console.log('      ...minus pairs rescued by a loaded exStoreKey twin : -'+R.rescuedByCollision);
  console.log('      AFFECTED (config, movement) pairs                  : '+R.affected
    +' / '+R.pairsMain0+' main-slot pairs = '+(100*R.affected/R.pairsMain0).toFixed(1)+'%');
  console.log('      cells containing >=1 affected movement             : '+R.cellsWithAffected+'/'+R.builds
    +' = '+(100*R.cellsWithAffected/R.builds).toFixed(1)+'%');
  console.log('      sessions that would vanish if all were logged      : '+R.affectedSessions
    +' ('+R.affectedMainSessions+' main-slot + '+(R.affectedSessions-R.affectedMainSessions)+' non-main sessions of the same movement)');
  if(R.rescuedDetail.size){ console.log('      rescue detail:'); R.rescuedDetail.forEach((v,k)=>console.log('        '+pad(k,60)+v)); }
  const seg=(m,lbl)=>{ console.log('      by '+lbl+':'); [...m.keys()].sort((a,b)=>m.get(b)-m.get(a)).forEach(k=>console.log('        '+pad(k,22)+rpad(m.get(k),7))); };
  seg(R.affectedByEquip,'equipment'); seg(R.affectedByGoal,'goal'); seg(R.affectedByFocus,'lifting focus'); seg(R.affectedByExp,'experience');
  console.log('      by movement:');
  [...R.affectedByName.keys()].sort((a,b)=>R.affectedByName.get(b)-R.affectedByName.get(a))
    .forEach(k=>console.log('        '+pad(k,40)+rpad(R.affectedByName.get(k),8)));
  console.log('\n    names ever item0-of-main, by equipment tier:');
  [...R.byEquipNames.keys()].sort().forEach(eq=>{
    const s=[...R.byEquipNames.get(eq)];
    console.log('      '+pad(eq,12)+rpad(s.length,4)+' names, '+s.filter(n=>!A[t].H.loadedOf(n).loaded).length+' unloaded');
  });
});
// cross-artifact agreement
if(SW['V194-work']&&SW['V193-base']){
  const a=SW['V194-work'], b=SW['V193-base'];
  console.log('\n  V194 vs V193 on Q3: affected='+a.affected+' vs '+b.affected
    +'   pairsMain0='+a.pairsMain0+' vs '+b.pairsMain0
    +'   => '+(a.affected===b.affected&&a.pairsMain0===b.pairsMain0?'IDENTICAL':'THEY DISAGREE'));
}

// ═══════════════════════════════════════════════════════════════════════════════
// Q4 — MIXED CASE
// ═══════════════════════════════════════════════════════════════════════════════
console.log('\n══════════════════════════════════════════════════════════════════════════');
console.log('Q4 — MIXED: weighted and weightless sessions under ONE exStoreKey');
console.log('══════════════════════════════════════════════════════════════════════════');
console.log('  Two ways one store key can hold both. (a) two SPELLINGS of the movement, one');
console.log('  loaded one not, colliding on one slug. (b) ONE loaded movement where the athlete');
console.log('  filled the rep rows and left the Load box empty — legal: saveExWeight:12768 only');
console.log('  needs rows.length, storedW stays 0 (12751/12755), logExerciseWeight:11899 writes.');
Object.keys(A).forEach(t=>{
  const H=A[t].H, R=SW[t]; if(!R) return;
  console.log('\n  ── '+t+' ──');
  // (a) spelling collisions
  const byKey=new Map();
  [...R.nameSeen].forEach(n=>{ const k=H.exStoreKey(n); if(!byKey.has(k)) byKey.set(k,new Set()); byKey.get(k).add(n); });
  let coll=0, mixed=0;
  byKey.forEach((set,k)=>{
    if(set.size<2) return; coll++;
    const names=[...set];
    const L=names.filter(n=>H.loadedOf(n).loaded), U=names.filter(n=>!H.loadedOf(n).loaded);
    console.log('    key="'+pad(k,34)+'" <- '+names.join(' | ')+'   loaded='+L.length+' unloaded='+U.length
      +(L.length&&U.length?'   <== MIXED SPELLINGS':''));
    if(L.length&&U.length) mixed++;
  });
  console.log('    (a) store keys carrying >1 programmed name: '+coll+'/'+byKey.size
    +'   of those carrying BOTH a loaded and an unloaded spelling: '+mixed);
  // (b) one loaded movement, some main sessions weighted and some not
  console.log('\n    (b) ONE LOADED main lift, SOME main sessions logged without a weight');
  const prog=A[t].IA.buildProgram(FX);
  // pick the loaded movement with the most main0 placements in the reporter build
  const cand=new Map();
  Object.keys(prog.weeks).forEach(wk=>Object.keys(prog.weeks[wk]).forEach(d=>{
    const day=prog.weeks[wk][d]; if(!day||!day.sections) return;
    day.sections.forEach(sec=>{ if(!/^main/i.test(sec.label||'')) return;
      const it=(sec.items||[])[0]; if(!it||!it.name) return;
      const nm=clean(it.name); if(!H.loadedOf(nm).loaded) return;
      if(!cand.has(nm)) cand.set(nm,[]);
      cand.get(nm).push({wk:+wk,d,label:sec.label||'',detail:it.detail||'',ii:0,main0:true,day});
    });
  }));
  const pick=[...cand.keys()].sort((a,b)=>cand.get(b).length-cand.get(a).length)[0];
  if(!pick){ console.log('      MEASUREMENT FAILED — no loaded main-slot movement in the reporter build'); return; }
  const sites=cand.get(pick);
  const othr=placements(prog,pick).filter(p=>!p.main0);
  console.log('      movement: "'+pick+'"   main-slot sessions available: '+sites.length+'   non-main: '+othr.length);
  const key=H.exStoreKey(pick);
  const hist={}; sites.concat(othr).forEach(s=>{ hist['w'+s.wk+'_'+s.d]=JSON.parse(JSON.stringify(s.day)); });
  function store(mainWeights, otherWeight){
    const ents=[];
    sites.forEach((s,i)=>{ const rx=H.parseRx(s.detail,pick); const ns=(rx&&rx.sets)||3, tg=(rx&&rx.target)||5;
      const w=mainWeights[i]||0;
      ents.push({weight:w,setsReps:'',setsDone:new Array(ns).fill(tg),setsW:w?new Array(ns).fill(w):[],week:s.wk,day:s.d,ts:1757000000000+i}); });
    othr.forEach((s,i)=>{ const rx=H.parseRx(s.detail,pick); const ns=(rx&&rx.sets)||3, tg=(rx&&rx.target)||8;
      const w=otherWeight; ents.push({weight:w,setsReps:'',setsDone:new Array(ns).fill(tg),setsW:w?new Array(ns).fill(w):[],week:s.wk,day:s.d,ts:1757500000000+i}); });
    const o={}; o[key]={name:pick, entries:ents}; return o;
  }
  function report(lbl, exw){
    const ents=exw[key].entries;
    const mainEns=ents.filter(e=>H._slotOfEntry(hist,pick,e)==='main');
    const mainLoaded=mainEns.filter(e=>+e.weight>0);
    const m=H.ledgerModel(exw,hist);
    const hit=(m.mains||[]).filter(r=>r.name===pick)[0]||null;
    const anywhere=['mains','ladder','plain','unloaded'].filter(b=>(m[b]||[]).some(r=>r.name===pick));
    console.log('      '+lbl);
    console.log('        entries='+ents.length+'  main-slot='+mainEns.length+'  main-slot weight>0='+mainLoaded.length
      +'  non-main='+(ents.length-mainEns.length));
    console.log('        buckets: '+(anywhere.join(', ')||'NONE'));
    console.log('        mains row: '+JSON.stringify(hit));
    if(hit){
      console.log('        plotted='+hit.series.length+'  hidden='+hit.hidden
        +' (=all.length-mainEns.length='+ents.length+'-'+mainEns.length+')'
        +'  plotted+hidden='+(hit.series.length+hit.hidden)+' of '+ents.length+' logged'
        +'  => UNACCOUNTED '+(ents.length-hit.series.length-hit.hidden));
      console.log('        unloaded MAIN sessions dropped from the line AND absent from `hidden`: '+(mainEns.length-mainLoaded.length));
      const totReps=ents.reduce((s,e)=>s+(e.setsDone||[]).reduce((a,b)=>a+b,0),0);
      const lostReps=mainEns.filter(e=>!(+e.weight>0)).reduce((s,e)=>s+(e.setsDone||[]).reduce((a,b)=>a+b,0),0);
      console.log('        reps logged='+totReps+'  reps inside the dropped main sessions='+lostReps);
    }
  }
  const nAll=sites.map(()=>135);
  report('CONTROL  every main session carries a weight:', store(nAll, 95));
  const half=sites.map((s,i)=>i%2===0?135:0);
  report('MIXED    '+half.filter(w=>w>0).length+' of '+sites.length+' main sessions carry a weight:', store(half, 95));
  const none=sites.map(()=>0);
  report('ALL-BLANK every main session logged reps only, Load left empty:', store(none, 95));
  report('ALL-BLANK + non-main also blank:', store(none, 0));
});
// how many lattice pairs are EXPOSED to case (b): a LOADED movement at item0 of a main section
Object.keys(A).forEach(t=>{
  const R=SW[t]; if(!R) return;
  console.log('\n  '+t+' — (config, movement) pairs EXPOSED to case (b) [loaded movement at item0 of a main');
  console.log('    section; one weightless rep-only log on every main day of that movement drops it]: '
    +(R.pairsMain0-R.pairsMain0Unloaded)+'/'+R.pairsMain0+' = '
    +(100*(R.pairsMain0-R.pairsMain0Unloaded)/R.pairsMain0).toFixed(1)+'%');
  console.log('    TOTAL main-slot pairs at risk of the 15439 return (unloaded-by-name '+R.pairsMain0Unloaded
    +' certain + loaded-by-name '+(R.pairsMain0-R.pairsMain0Unloaded)+' athlete-dependent) = '+R.pairsMain0+'/'+R.pairsMain0+' = 100%');
});

// ═══════════════════════════════════════════════════════════════════════════════
// Q5 — WHO ELSE READS THIS
// ═══════════════════════════════════════════════════════════════════════════════
console.log('\n══════════════════════════════════════════════════════════════════════════');
console.log('Q5 — EVERY READER OF ledgerModel AND OF `hidden`');
console.log('══════════════════════════════════════════════════════════════════════════');
Object.keys(A).forEach(t=>{
  const L=A[t].lines;
  console.log('\n  ── '+t+' (ia-version '+A[t].IA.version+') ──');
  const pats=[['ledgerModel',/ledgerModel/],['buildLedgerCards',/buildLedgerCards/],['buildLedgerCard(',/buildLedgerCard\b/],
    ['model.mains/.ladder/.plain/.unloaded',/model\.(mains|ladder|plain|unloaded)/],
    ['led.mains/.accessories',/led\.(mains|accessories)/],['hidden',/\bhidden\b/],
    ['getExWeightsFor',/getExWeightsFor/]];
  pats.forEach(([lbl,re])=>{
    const hits=[]; L.forEach((ln,i)=>{ if(re.test(ln)) hits.push((i+1)+': '+ln.trim().slice(0,140)); });
    console.log('    ['+lbl+'] '+hits.length+' line(s)');
    hits.slice(0,14).forEach(h=>console.log('       '+h));
    if(hits.length>14) console.log('       ... +'+(hits.length-14)+' more');
  });
  // dead-code check on buildLedgerCard: definition + call sites
  const defs=[], calls=[];
  L.forEach((ln,i)=>{ if(/function\s+buildLedgerCard\s*\(/.test(ln)) defs.push(i+1);
    else if(/\bbuildLedgerCard\s*\(/.test(ln)) calls.push(i+1); });
  console.log('    buildLedgerCard: definitions at '+defs.join(',')+'  call sites: '+(calls.length?calls.join(','):'NONE -> DEAD')
    +'   (it reads led.accessories, a bucket ledgerModel no longer returns)');
});

// ═══════════════════════════════════════════════════════════════════════════════
// Q6 — THE EMPTY STATE (bodyweight tier, end to end)
// ═══════════════════════════════════════════════════════════════════════════════
console.log('\n══════════════════════════════════════════════════════════════════════════');
console.log('Q6 — A BODYWEIGHT-TIER PROGRAM, EVERY LIFT LOGGED, WHAT THE PROGRESS TAB RENDERS');
console.log('══════════════════════════════════════════════════════════════════════════');
const BWCFG=Object.assign({}, mkcfg({goal:GOALS[3],focus:'support_prevention',equip:'bodyweight',exp:'intermediate',age:'18-35',rest:REST[0],seed:76308,inj:null}));
console.log('  cfg: '+JSON.stringify({goal:'run_half',focus:BWCFG.liftingFocus,equipment:BWCFG.equipment,
  experience:BWCFG.experience,ageBracket:BWCFG.ageBracket,restDays:BWCFG.restDays,seed:BWCFG.seed}));
Object.keys(A).forEach(t=>{
  const IA=A[t].IA, H=A[t].H;
  console.log('\n  ── '+t+' ──');
  const prog=IA.buildProgram(BWCFG);
  console.log('  weeks='+Object.keys(prog.weeks).length+'  digest='+progDigest(prog));
  // harvest EVERY loggable item, and log every one of them the way the card would
  const hist={}, exw={};
  const main0Names=new Set(), allLogged=new Set();
  let rows=0;
  Object.keys(prog.weeks).sort((a,b)=>+a-+b).forEach(wk=>{
    const week=prog.weeks[wk];
    Object.keys(week).forEach(d=>{
      const day=week[d]; if(!day||!day.sections) return;
      let touched=false;
      day.sections.forEach(sec=>{
        const isMain=/^main/i.test(sec.label||'');
        (sec.items||[]).forEach((it,ii)=>{
          if(!it||!it.name||/^\s*<svg/i.test(it.name)) return;
          const nm=clean(it.name); if(!nm) return;
          if(isMain&&ii===0) main0Names.add(nm);
          const lf=H.loadedOf(nm), rx=H.parseRx(it.detail||'',nm);
          if(!rx&&!lf.loaded) return;                    // buildExItem:11477 renders no log block
          const key=H.exStoreKey(nm);
          if(!exw[key]) exw[key]={name:nm, entries:[]};
          const nsets=(rx&&rx.sets)||3, tgt=(rx&&rx.target)||12;
          // an unloaded card has no weight input at all (11551/11572 guarded by `loaded`)
          const w=lf.loaded?95:0;
          exw[key].entries.push({weight:w, setsReps:'', setsDone:new Array(nsets).fill(tgt),
            setsW:w?new Array(nsets).fill(w):[], week:+wk, day:d, ts:1757000000000+(rows++)});
          allLogged.add(nm); touched=true;
        });
      });
      if(touched) hist['w'+wk+'_'+d]=JSON.parse(JSON.stringify(day));
    });
  });
  console.log('  main-slot (item0 of /^main/i) movements in this program: '+[...main0Names].join(', '));
  console.log('    of those, loaded: '+[...main0Names].filter(n=>H.loadedOf(n).loaded).join(', ')||'(none)');
  console.log('  distinct movements logged: '+allLogged.size+'   ia_exw_ store keys: '+Object.keys(exw).length+'   entries: '+rows
    +'   ia_hist_ days: '+Object.keys(hist).length);
  const model=H.ledgerModel(exw,hist);
  console.log('  ledgerModel -> mains='+model.mains.length+' ladder='+model.ladder.length
    +' plain='+model.plain.length+' unloaded='+model.unloaded.length
    +'   TOTAL ROWS='+(model.mains.length+model.ladder.length+model.plain.length+model.unloaded.length)
    +'  of '+Object.keys(exw).length+' logged movements');
  const surfaced=new Set();
  ['mains','ladder','plain','unloaded'].forEach(b=>model[b].forEach(r=>surfaced.add(r.name)));
  const dropped=[...allLogged].filter(n=>!surfaced.has(n));
  console.log('  MOVEMENTS LOGGED BUT ABSENT FROM EVERY BUCKET: '+dropped.length+'/'+allLogged.size);
  dropped.forEach(n=>{
    const key=H.exStoreKey(n), ent=(exw[key]||{}).entries||[];
    const nMain=ent.filter(e=>H._slotOfEntry(hist,n,e)==='main').length;
    const nLoadedMain=ent.filter(e=>H._slotOfEntry(hist,n,e)==='main'&&+e.weight>0).length;
    const reps=ent.reduce((s,e)=>s+(e.setsDone||[]).reduce((a,b)=>a+b,0),0);
    console.log('    '+pad(n,40)+' sessions='+rpad(ent.length,4)+' main-slot='+rpad(nMain,4)
      +' main-slot-loaded='+rpad(nLoadedMain,3)+' reps='+rpad(reps,6)
      +'  '+(nMain&&!nLoadedMain?'<== dropped at 15439':'(other cause)'));
  });
  // what the athlete actually sees
  let html='';
  try{ html=IA.eval('buildLedgerCards')(model, 'lbs'); }
  catch(e){ console.log('  buildLedgerCards threw: '+e.message); }
  const txt=String(html).replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
  console.log('  buildLedgerCards HTML length: '+String(html).length+' chars');
  console.log('  cards rendered: '+(String(html).match(/Main Lifts/)?'Main Lifts ':'')
    +(String(html).match(/Range Ladder/)?'RangeLadder ':'')
    +(String(html).match(/Other Accessory Work/)?'OtherAccessoryWork ':'')||'(NONE)');
  console.log('  ATHLETE-VISIBLE TEXT:');
  (txt.match(/.{1,150}(\s|$)/g)||['(EMPTY)']).forEach(l=>console.log('    | '+l.trim()));
  // the counterfactual: the same store with the 15439 early return unable to fire,
  // computed OUTSIDE ledgerModel from the contract at 15452 — what the unloaded bucket
  // WOULD carry if those movements reached it.
  const would=dropped.map(n=>{
    const ent=(exw[H.exStoreKey(n)]||{}).entries||[];
    return {name:n, sessions:ent.length, reps:ent.reduce((s,e)=>s+(e.setsDone||[]).reduce((a,b)=>a+b,0),0)};
  });
  console.log('  rows the `unloaded` contract (15452) would have produced for the dropped movements:');
  would.forEach(r=>console.log('    '+pad(r.name,40)+r.reps.toLocaleString()+' reps · '+r.sessions+' sessions'));
});


// ═══════════════════════════════════════════════════════════════════════════════
// Q6b — THE TRUE EMPTY STATE: the athlete logs ONLY the main lift of each day
// ═══════════════════════════════════════════════════════════════════════════════
// buildLedgerCards(15560) returns '' when all four buckets are empty, and its ONLY
// call site (15770) appends that '' with no fallback copy. So an all-dropped store
// renders no ledger at all — not an empty state, an absence.
console.log('\n══════════════════════════════════════════════════════════════════════════');
console.log('Q6b — BODYWEIGHT TIER, ATHLETE LOGS ONLY THE MAIN LIFT OF EACH DAY');
console.log('══════════════════════════════════════════════════════════════════════════');
Object.keys(A).forEach(t=>{
  const IA=A[t].IA, H=A[t].H;
  const prog=IA.buildProgram(BWCFG);
  const hist={}, exw={}; let rows=0; const names=new Set();
  Object.keys(prog.weeks).sort((a,b)=>+a-+b).forEach(wk=>{
    const week=prog.weeks[wk];
    Object.keys(week).forEach(d=>{
      const day=week[d]; if(!day||!day.sections) return;
      let touched=false;
      day.sections.forEach(sec=>{
        if(!/^main/i.test(sec.label||'')) return;
        const it=(sec.items||[])[0]; if(!it||!it.name||/^\s*<svg/i.test(it.name)) return;
        const nm=clean(it.name); if(!nm) return;
        const lf=H.loadedOf(nm), rx=H.parseRx(it.detail||'',nm);
        if(!rx&&!lf.loaded) return;
        const key=H.exStoreKey(nm);
        if(!exw[key]) exw[key]={name:nm, entries:[]};
        const ns=(rx&&rx.sets)||3, tg=(rx&&rx.target)||12;
        const w=lf.loaded?95:0;
        exw[key].entries.push({weight:w,setsReps:'',setsDone:new Array(ns).fill(tg),
          setsW:w?new Array(ns).fill(w):[],week:+wk,day:d,ts:1757000000000+(rows++)});
        names.add(nm); touched=true;
      });
      if(touched) hist['w'+wk+'_'+d]=JSON.parse(JSON.stringify(day));
    });
  });
  const model=H.ledgerModel(exw,hist);
  const html=IA.eval('buildLedgerCards')(model,'lbs');
  const totReps=Object.values(exw).reduce((s,x)=>s+x.entries.reduce((a,e)=>a+(e.setsDone||[]).reduce((p,q)=>p+q,0),0),0);
  console.log('\n  ── '+t+' ──');
  console.log('    movements logged: '+names.size+'   sessions logged: '+rows+'   reps logged: '+totReps
    +'   ia_hist_ days: '+Object.keys(hist).length);
  console.log('    ledgerModel -> mains='+model.mains.length+' ladder='+model.ladder.length
    +' plain='+model.plain.length+' unloaded='+model.unloaded.length);
  console.log('    buildLedgerCards HTML length: '+String(html).length+' chars');
  console.log('    ATHLETE-VISIBLE TEXT: '+(String(html).replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim()||'(NOTHING — the Progress tab shows no lift ledger at all)'));
  console.log('    call site 15770 appends this with no else branch: '
    +(A[t].lines[(t==='V194-work'?15770:15764)-1]||'').trim());
});

console.log('\n══ END v195 ══');
