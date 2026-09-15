// v195 — measure pass: every athlete-facing string that asserts an implement.
//
// MODE B (before-picture). Read-only. Answers Q1..Q4 of the V195 brief.
// Scope is the WHOLE FILE, not the progress tab: V194 shipped D53/D54 against
// "copy asserting equipment the app does not know the athlete has" and the
// previous sweep was scoped to progress/ledger copy only. index.html:7276
// (scheme()'s loadCapped branch, "heaviest pair you can find") survived it.
//
// ORACLES — each independent of the function under suspicion:
//  O1  what a tier owns   — the WIZARD equipment descriptions, index.html:2672-2678,
//                           and the TRAVEL sheet descriptions, _EQUIP_OPTS:13912-13914,
//                           transcribed verbatim below. These are the app's OWN
//                           promise to the athlete; never _gearOK / _auxGearOK.
//  O2  the contract       — index.html:2671, verbatim: "The program only prescribes
//                           exercises you can actually do."
//  O3  implement count    — a HAND TABLE of how many implements each movement needs,
//                           authored from the movement standard, not from any name
//                           regex in the file. Every name that reaches the branch is
//                           in the table; an unlisted name is reported as UNCLASSIFIED
//                           and is a failure of this pass, not a zero.
//  O4  reachability       — walked out of buildProgram's own output (item detail
//                           strings), never out of scheme() internals.
//  O5  the copy inventory — string literals lifted out of index.html by line number,
//                           with the engine's own name universe (EXLIB + RAND_POOLS +
//                           every name emitted over a 756-build sweep) subtracted so
//                           exercise NAMES do not drown the copy.
//
// usage: node tests/measure/v195_implement_claim_sweep.js [--fast]
'use strict';
const fs=require('fs'), path=require('path');
const {load}=require(path.join(__dirname,'..','harness.js'));
const HTML=path.join(__dirname,'..','..','index.html');
const SRC=fs.readFileSync(HTML,'utf8');
const LINES=SRC.split('\n');
const IA=load(HTML);
const FAST=process.argv.includes('--fast');
const DAYS=['sun','mon','tue','wed','thu','fri','sat'];
function hr(t){ console.log('\n'+'='.repeat(78)+'\n'+t+'\n'+'='.repeat(78)); }
function pad(s,n){ s=String(s); return s.length>=n?s:s+' '.repeat(n-s.length); }
function lpad(s,n){ s=String(s); return s.length>=n?s:' '.repeat(n-s.length)+s; }
function pct(a,b){ return b?((100*a/b).toFixed(1)+'%'):'n/a'; }
function bump(m,k){ m.set(k,(m.get(k)||0)+1); }
function bump2(m,k,s){ if(!m.has(k)) m.set(k,new Map()); bump(m.get(k),s); }
function call(fn,args){ try{ return IA.eval('(typeof '+fn+'==="function")?'+fn+'('+args.map(a=>JSON.stringify(a)).join(',')+'):"NO-FN"'); }catch(e){ return 'ERR:'+e.message; } }

console.log('v195 implement-claim sweep — ia-version '+IA.version+(FAST?'  (FAST)':'  (FULL)'));
console.log('artifact: '+HTML);

// ── O1. WHAT EACH TIER PROMISES (verbatim, by line) ──────────────────────────
// Wizard, index.html:2672-2678.
const WIZARD_COPY={
  home_full : [2672,'Barbell, rack, bench, dumbbells, kettlebells, pull-up bar, trap bar, bands'],
  home_basic: [2675,'Dumbbells, kettlebells, pull-up bar, bands. No barbell.'],
  commercial: [2676,'Full gym — cables, machines, barbells, everything'],
  crossfit  : [2677,'Barbells, rig, bumpers, kettlebells, rower/bike, wall balls, bands'],
  bodyweight: [2678,'You, the floor, and something to pull on. No weights.'],
};
// Travel sheet, _EQUIP_OPTS, index.html:13912-13914. THREE options only.
const TRAVEL_COPY={
  bodyweight: [13912,'Room only','Nothing but you. A floor, a wall, and a chair.'],
  home_basic: [13913,'Mini gym','Dumbbells, a bench, a treadmill. The standard hotel setup.'],
  commercial: [13914,'Full gym','Racks, barbells, cables. A resort gym or a real gym nearby.'],
};
// Derived from the copy above, one token per noun the copy names. NOT from _gearOK.
const TIER_OWNS={
  home_full : ['barbell','rack','bench','dumbbell','kettlebell','pullupbar','trapbar','band'],
  home_basic: ['dumbbell','kettlebell','pullupbar','band'],
  commercial: ['barbell','rack','bench','dumbbell','kettlebell','pullupbar','trapbar','band','cable','machine','medball','sled'],
  crossfit  : ['barbell','rig','bumper','kettlebell','rower','bike','wallball','band','pullupbar'],
  bodyweight: ['pullupbar'],
  minimal   : ['kettlebell'],
};
const TRAVEL_OWNS={
  bodyweight: ['chair','wall','floor'],
  home_basic: ['dumbbell','bench','treadmill'],
  commercial: ['rack','barbell','cable'],
};

// ── O3. IMPLEMENT COUNT PER MOVEMENT (hand table) ────────────────────────────
// How many DISTINCT implements the standard execution of the movement needs.
//   'pair'   two matched implements (both hands loaded, symmetric)
//   'one'    exactly one implement (goblet, single-arm, one bell, unilateral)
//   'either' genuinely runs on one OR two and the name does not say which
//   'none'   no implement at all (bodyweight / optional plate on the back)
// Authored from the movement standard. Deliberately generous to the app: any
// movement that CAN be run with two is only counted false when two is not the
// standard execution. Adding a name here is the only legal way to grow it.
const IMPLEMENTS={
  'Dumbbell bench press'          : {n:'pair', also:['bench'], why:'two dumbbells, flat bench'},
  'Dumbbell incline press'        : {n:'pair', also:['bench'], why:'two dumbbells, incline bench'},
  'Dumbbell decline press'        : {n:'pair', also:['bench'], why:'two dumbbells, decline bench'},
  'Dumbbell Romanian deadlift'    : {n:'pair', also:[],        why:'two dumbbells, one per hand'},
  'Dumbbell goblet squat'         : {n:'one',  also:[],        why:'one dumbbell held at the chest'},
  'Kettlebell goblet squat'       : {n:'one',  also:[],        why:'one bell held at the chest'},
  'Kettlebell swing'              : {n:'one',  also:[],        why:'one bell, two hands on it'},
  'Kettlebell single-leg deadlift': {n:'one',  also:[],        why:'one bell, offset load is the point'},
  'Step-ups (KB)'                 : {n:'either',also:['step'], why:'one bell goblet or two at the sides'},
  'Single-leg squat (assisted)'   : {n:'none', also:[],        why:'bodyweight, a chair or post to hold'},
  'Pushup variation (weighted)'   : {n:'none', also:[],        why:'bodyweight; optional single plate on the back'},
  // reachable from the same no-barbell pools on a non-travel build; listed so the
  // table stays wider than the branch and an unlisted name is a real surprise.
  'Kettlebell single-arm row'     : {n:'one',  also:[],        why:'one bell, one hand'},
  'Dumbbell row'                  : {n:'either',also:[],       why:'one dumbbell supported, or two'},
  'Resistance band row'           : {n:'none', also:['band'],  why:'band, not a weight'},
  'TRX row (if available)'        : {n:'none', also:['trx'],   why:'straps'},
  'Kettlebell Romanian deadlift'  : {n:'either',also:[],       why:'one or two bells'},
  'Double Kettlebell deadlift'    : {n:'pair', also:[],        why:'the name says two'},
  'Dumbbell Bulgarian split squat': {n:'either',also:['chair'],why:'one or two dumbbells'},
  'Reverse lunge (KB)'            : {n:'either',also:[],       why:'one or two bells'},
  'Walking lunge (KB)'            : {n:'either',also:[],       why:'one or two bells'},
  'Dumbbell goblet side lunge'    : {n:'one',  also:[],        why:'one dumbbell at the chest'},
  'Incline pushups (hands on bed)': {n:'none', also:[],        why:'bodyweight'},
  'Pushups (slow 3s eccentric)'   : {n:'none', also:[],        why:'bodyweight'},
  'Decline pushups (feet elevated)':{n:'none',also:[],         why:'bodyweight'},
  'Diamond pushups'               : {n:'none', also:[],        why:'bodyweight'},
  'Archer pushups'                : {n:'none', also:[],        why:'bodyweight'},
};

// ── PART 1 (Q1). THE loadCapped BRANCH ───────────────────────────────────────
// index.html:7274-7277
//   if(loadCapped){
//     if(wv._taper||wv._deload) return '2 sets of 12 to 15 — RPE 6 (light and clean)';
//     return '3 sets of 8 to 12 — RPE '+(_effEase||'8 (heaviest pair you can find)');
//   }
// index.html:7434  const loadCapped = !!cfg._travel && equip==='home_basic';
// index.html:13745 _travel is set ONLY here, only for ov.type==='substitute'.
const PAIR_LIT='8 (heaviest pair you can find)';
const CAP_WORK=/^3 sets of 8 to 12 — RPE /;
const CAP_EASY=/^2 sets of 12 to 15 — RPE 6 \(light and clean\)/;
const PAIR_RE=/3 sets of 8 to 12 — RPE 8 \(heaviest pair you can find\)/;

const FOCUS=['strength','hypertrophy','fatloss','balanced','support_strength','support_athletic','support_prevention'];
const EXP=['beginner','intermediate','advanced'];
const AGE=['18-35','36-54','55+'];
const REST=[['sun','wed'],['sun']];
const SEEDS=FAST?[76308]:[76308,11111,90210];
const GOALS=[
 {k:'lift_only',f:{primaryPath:'body',cardioTypes:[],cardioGoals:{},eventTargeted:false,raceDate:null}},
 {k:'run_base', f:{primaryPath:'body',cardioTypes:['run'],cardioGoals:{run:{id:'run_base',label:'Build Running Base',mileBestMins:'9',mileBestSecs:'00',baselineDist:'3',baseline:'3mi'}},eventTargeted:false,raceDate:null}},
 {k:'run_pace', f:{primaryPath:'body',cardioTypes:['run'],cardioGoals:{run:{id:'run_pace_goal',label:'Hit a Pace / Time Goal',targetDist:'1.5',targetMins:'10',mileBestMins:'8',mileBestSecs:'30',baselineDist:'3',baseline:'3mi'}},eventTargeted:false,raceDate:null}},
 {k:'run_half', f:{primaryPath:'event',cardioTypes:['run'],cardioGoals:{run:{id:'run_half',label:'Half Marathon',mileBestMins:'10',mileBestSecs:'30',baselineDist:'5',baseline:'5mi'}},eventTargeted:true,raceDate:'2026-12-06'}},
];
function mkcfg(o){
  const c=Object.assign({name:'V195',unit:'lbs',days:DAYS.slice(),bench:135,squat:155,deadlift:185},
    o.goal.f,{liftingFocus:o.focus,experience:o.exp,ageBracket:o.age,equipment:o.equip,
    restDays:o.rest.slice(),seed:o.seed});
  if(o.travel) c._travel=true;
  if(o.inj) c.injury=o.inj;
  return c;
}

hr('Q1 — DOES _travel + home_basic GUARANTEE A MATCHED PAIR?');
console.log('wizard   home_basic ('+WIZARD_COPY.home_basic[0]+'): "'+WIZARD_COPY.home_basic[1]+'"');
console.log('travel   home_basic ('+TRAVEL_COPY.home_basic[0]+'): "'+TRAVEL_COPY.home_basic[1]+' — '+TRAVEL_COPY.home_basic[2]+'"');
console.log('travel picker offers exactly '+Object.keys(TRAVEL_COPY).length+' options: '+
  Object.entries(TRAVEL_COPY).map(([k,v])=>k+'="'+v[1]+'"').join(', '));
console.log('_ovDraft default equipment (13907) = "minimal"; openOverlaySheet (13925) overwrites it to "home_basic".');
console.log('the only writer of _ovDraft.equipment after that is _ovSet from _EQUIP_OPTS (14028), so "minimal" is unreachable from the sheet.');
console.log('commercial is a declared no-op (14002/14190), so a travel overlay that BUILDS anything is bodyweight (noLoad) or home_basic (loadCapped). Two outcomes, not an edge case.');

const capByName=new Map(), capByFocus=new Map(), capByExp=new Map(), capByWeek=new Map(), capByGoal=new Map();
const pairByName=new Map(); const sectionOfHit=new Map();
let travelBuilds=0, travelItems=0, capWork=0, capEasy=0, pairHits=0, easeHits=0, crashes=0;
const crashList=[];
const A=[];
GOALS.forEach(goal=>FOCUS.forEach(focus=>EXP.forEach(exp=>AGE.forEach(age=>REST.forEach(rest=>SEEDS.forEach(seed=>{
  A.push({goal,focus,exp,age,rest,seed,equip:'home_basic',travel:true});
}))))));
A.forEach(o=>{
  const cfg=mkcfg(o); let prog;
  try{ prog=IA.buildProgram(cfg); }catch(e){ crashes++; if(crashList.length<5)crashList.push(e.message); return; }
  travelBuilds++;
  Object.keys(prog.weeks||{}).forEach(wk=>{
    const week=prog.weeks[wk]||{};
    Object.keys(week).forEach(d=>{
      const day=week[d]; if(!day||!day.sections) return;
      day.sections.forEach(sec=>{
        (sec.items||[]).forEach(it=>{
          travelItems++;
          const det=String(it.detail||'');
          if(!CAP_WORK.test(det) && !CAP_EASY.test(det)) return;
          const nm=String(it.name||'').replace(/<svg[\s\S]*?<\/svg>\s*/g,'').trim();
          bump(capByName,nm);
          bump(sectionOfHit,String(sec.label||'').replace(/—.*$/,'').trim()||'(no label)');
          if(CAP_EASY.test(det)){ capEasy++; return; }
          capWork++;
          if(PAIR_RE.test(det)){ pairHits++; bump(pairByName,nm);
            bump(capByFocus,o.focus); bump(capByExp,o.exp); bump(capByGoal,o.goal.k);
            bump(capByWeek,(+wk<=2?'w1-2':(+wk<=4?'w3-4':(+wk<=6?'w5-6':'w7+'))));
          } else { easeHits++; }
        });
      });
    });
  });
});
console.log('\nlattice: '+A.length+' travel configs (goal x focus x exp x age x rest x seed, equipment=home_basic, _travel=true), '+
  travelBuilds+' built, '+crashes+' crashed, '+travelItems+' prescribed items walked.');
if(crashes) console.log('  CRASHES (a crash is a failed measurement, not an absence): '+crashList.join(' | '));
console.log('loadCapped branch fired on '+(capWork+capEasy)+' / '+travelItems+' items ('+pct(capWork+capEasy,travelItems)+').');
console.log('  taper/deload arm  "2 sets of 12 to 15 — RPE 6 (light and clean)"   : '+capEasy+'  (no implement claim)');
console.log('  work arm          "3 sets of 8 to 12 — RPE ..."                    : '+capWork);
console.log('    ...of which carry the PAIR claim  "'+PAIR_LIT+'": '+pairHits+' ('+pct(pairHits,capWork)+' of the work arm)');
console.log('    ...of which carry _effEase instead (beginner wk1-4 / prevention) : '+easeHits+' ('+pct(easeHits,capWork)+')');
console.log('\nsections the branch prints under: '+[...sectionOfHit.entries()].sort((a,b)=>b[1]-a[1]).map(([k,v])=>k+'='+v).join(', '));

hr('Q1 — IMPLEMENT REQUIREMENT OF EVERY MOVEMENT THAT REACHES THE PAIR CLAIM');
let nPair=0,nOne=0,nEither=0,nNone=0,nUnk=0, oPair=0,oOne=0,oEither=0,oNone=0,oUnk=0;
console.log(pad('movement',34)+lpad('pair-claim hits',16)+'  '+pad('needs',7)+'  why');
[...pairByName.entries()].sort((a,b)=>b[1]-a[1]).forEach(([nm,c])=>{
  const t=IMPLEMENTS[nm];
  const kind=t?t.n:'UNCLASSIFIED';
  console.log(pad(nm,34)+lpad(c,16)+'  '+pad(kind,7)+'  '+(t?t.why+(t.also.length?'  [+'+t.also.join(',')+']':''):'*** NOT IN THE HAND TABLE — this pass did not classify it ***'));
  if(kind==='pair'){nPair++;oPair+=c;} else if(kind==='one'){nOne++;oOne+=c;}
  else if(kind==='either'){nEither++;oEither+=c;} else if(kind==='none'){nNone++;oNone+=c;}
  else {nUnk++;oUnk+=c;}
});
const distinct=pairByName.size;
console.log('\ndistinct movements reaching the pair claim: '+distinct);
console.log('  two-implement (a matched pair IS the movement) : '+nPair+'/'+distinct+'   occurrences '+oPair+'/'+pairHits+' ('+pct(oPair,pairHits)+')');
console.log('  single-implement (goblet / one bell / one arm) : '+nOne+'/'+distinct+'   occurrences '+oOne+'/'+pairHits+' ('+pct(oOne,pairHits)+')');
console.log('  either one or two, the name does not say       : '+nEither+'/'+distinct+'   occurrences '+oEither+'/'+pairHits+' ('+pct(oEither,pairHits)+')');
console.log('  neither (no implement at all)                  : '+nNone+'/'+distinct+'   occurrences '+oNone+'/'+pairHits+' ('+pct(oNone,pairHits)+')');
console.log('  UNCLASSIFIED (pass failure if nonzero)         : '+nUnk+'/'+distinct+'   occurrences '+oUnk);
console.log('\nVERDICT on "'+PAIR_LIT+'":');
console.log('  strictly TRUE   (pair is the movement)         : '+oPair+' / '+pairHits+'  = '+pct(oPair,pairHits));
console.log('  strictly FALSE  (one implement, or none)       : '+(oOne+oNone)+' / '+pairHits+'  = '+pct(oOne+oNone,pairHits));
console.log('  UNDECIDED by the name (either)                 : '+oEither+' / '+pairHits+'  = '+pct(oEither,pairHits));
console.log('  => SOMETIMES-FALSE: '+nPair+' of the '+distinct+' movements genuinely are pair movements, '+(nOne+nNone)+' are not, '+nEither+' undecided.');
console.log('\nsegmented (pair-claim occurrences):');
console.log('  by focus : '+[...capByFocus.entries()].sort().map(([k,v])=>k+'='+v).join('  '));
console.log('  by exp   : '+[...capByExp.entries()].sort().map(([k,v])=>k+'='+v).join('  '));
console.log('  by goal  : '+[...capByGoal.entries()].sort().map(([k,v])=>k+'='+v).join('  '));
console.log('  by week  : '+[...capByWeek.entries()].sort().map(([k,v])=>k+'='+v).join('  '));

hr('Q1b — CONTROL: the same lattice WITHOUT _travel never reaches the branch');
let ctrlItems=0, ctrlCap=0, ctrlBuilds=0;
A.slice(0,FAST?60:240).forEach(o=>{
  const cfg=mkcfg(Object.assign({},o,{travel:false})); let prog;
  try{ prog=IA.buildProgram(cfg); }catch(e){ return; }
  ctrlBuilds++;
  Object.values(prog.weeks||{}).forEach(w=>Object.values(w).forEach(d=>{(d&&d.sections||[]).forEach(s=>{(s.items||[]).forEach(it=>{
    ctrlItems++; const det=String(it.detail||''); if(CAP_WORK.test(det)||CAP_EASY.test(det)) ctrlCap++;
  });});}));
});
console.log('non-travel home_basic: '+ctrlBuilds+' builds, '+ctrlItems+' items, loadCapped copy on '+ctrlCap+' ('+pct(ctrlCap,ctrlItems)+').');
console.log('=> the branch is exclusive to the travel overlay. Baseline proves itself.');

// ── PART 2 (Q2). THE FULL COPY SWEEP ─────────────────────────────────────────
// O5: every single-line string literal in index.html, minus the engine's own name
// universe (EXLIB + RAND_POOLS + every name emitted over a 756-build sweep), minus
// CSS. Then hand-classified. The inventory is printed in full so it is auditable.
hr('Q2 — BUILDING THE NAME UNIVERSE (so exercise NAMES do not drown the copy)');
const NAMES=new Set();
(function walk(o){ if(typeof o==='string'){NAMES.add(o.toLowerCase().trim());return;}
  if(Array.isArray(o)){o.forEach(walk);return;} if(o&&typeof o==='object'){Object.values(o).forEach(walk);} })([IA.EXLIB,IA.RAND_POOLS]);
let uniBuilds=0;
['home_full','home_basic','commercial','crossfit','bodyweight','minimal'].forEach(eq=>
 FOCUS.forEach(f=>EXP.forEach(x=>GOALS.forEach(g=>[false,true].forEach(tv=>{
  const cfg=Object.assign({name:'U',unit:'lbs',days:DAYS.slice(),bench:135,squat:155,deadlift:185,restDays:['sun','wed'],seed:76308,liftingFocus:f,experience:x,ageBracket:'18-35',equipment:eq},g.f);
  if(tv) cfg._travel=true;
  let p; try{p=IA.buildProgram(cfg);}catch(e){return;} uniBuilds++;
  Object.values(p.weeks||{}).forEach(w=>Object.values(w).forEach(d=>{(d&&d.sections||[]).forEach(s=>{
    (s.items||[]).forEach(i=>NAMES.add(String(i.name||'').replace(/<svg[\s\S]*?<\/svg>\s*/g,'').toLowerCase().trim()));
  });}));
})))));
console.log('name universe: '+NAMES.size+' distinct movement names, from EXLIB + RAND_POOLS + '+uniBuilds+' builds across all 6 tiers x travel on/off.');

// nearest enclosing declaration, for "emitting function"
const DECL=[];
for(let i=0;i<LINES.length;i++){
  const m=LINES[i].match(/^\s{0,4}(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/)
       || LINES[i].match(/^\s{0,2}(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:function|\(|\{|\[)/);
  if(m) DECL.push([i+1,m[1]]);
}
function fnAt(ln){ let best='(top level)'; for(const [l,n] of DECL){ if(l<=ln) best=n; else break; } return best; }

const TOK=/\b(pairs?|both hands|each hand|a set of|barbells?|bars?|kettlebells?|bells?|dumbbells?|plates?|machines?|cables?|bands?|sled|racks?|bench|weights?|heaviest|grab)\b/i;
const CSS=/font-|var\(--|[0-9]px|;\s*[a-z-]+:|flex:|display:|margin|padding|border|background|color:|text-transform|letter-spacing/;
const raw=[];
for(let i=0;i<LINES.length;i++){
  const L=LINES[i];
  const re=/'((?:\\.|[^'\\])*)'|"((?:\\.|[^"\\])*)"|`((?:\\.|[^`\\])*)`/g; let m;
  while((m=re.exec(L))){
    const s=(m[1]!==undefined?m[1]:(m[2]!==undefined?m[2]:m[3]))||'';
    if(s.length<5||!TOK.test(s)||CSS.test(s)||!/\s/.test(s)) continue;
    const bare=s.replace(/<[^>]*>/g,'').replace(/\$\{[^}]*\}/g,'').trim().toLowerCase();
    if(NAMES.has(bare)) continue;
    if(/^[a-z0-9 _\-.#>:,%()\/\[\]=*+]+$/.test(s)&&!/[A-Z]/.test(s)&&!/[.,!?'’]\s/.test(s)&&s.split(/\s+/).length<=4) continue;
    raw.push({ln:i+1,s:s.replace(/\s+/g,' ')});
  }
}
// HTML text nodes (multi-line template literals the literal scan cannot see)
for(let i=0;i<LINES.length;i++){
  if(/^\s*(\/\/|\*|\/\*)/.test(LINES[i])) continue;
  const re=/>([^<>{}]{6,})</g; let m;
  while((m=re.exec(LINES[i]))){
    const s=m[1].trim(); if(!TOK.test(s)||NAMES.has(s.toLowerCase())) continue;
    if(raw.some(r=>r.ln===i+1&&r.s.indexOf(s)>=0)) continue;
    raw.push({ln:i+1,s:s.replace(/\s+/g,' '),node:true});
  }
}
raw.sort((a,b)=>a.ln-b.ln);
console.log('candidate strings carrying an implement / quantity token: '+raw.length+' (after name + CSS subtraction).');

// Hand classification. Every candidate lands in exactly one bucket.
// 'NAME'  — an exercise name in a literal pool the universe sweep did not reach
//           (alias maps, NRC transcriptions, curated wildcard days). Named separately.
// 'DEV'   — developer-facing: regex source, key, label of a code construct.
// 'COPY'  — athlete-facing prose. These are the deliverable.
const DEV_LINES=new Set([1169,5678,6062,7358,7370,9887,10552,11787,12199,6684]);
const ALIAS_BLOCK=[1690,1770];       // EX_KEY_ALIAS / EX_RENAMED_V113 scrub table
const NRC_BLOCK=[3400,4600];         // doctrine-transcribed run sessions
const RAND_BLOCK=[9939,10099];       // RAND_POOLS curated wildcard days
const EXLIB_BLOCK=[1500,1700];
function bucket(r){
  if(DEV_LINES.has(r.ln)) return 'DEV';
  if(r.ln>=ALIAS_BLOCK[0]&&r.ln<=ALIAS_BLOCK[1]) return 'NAME';
  if(r.ln>=EXLIB_BLOCK[0]&&r.ln<=EXLIB_BLOCK[1]) return 'NAME';
  if(r.ln>=RAND_BLOCK[0]&&r.ln<=RAND_BLOCK[1]) return 'WILDCARD';
  if(r.ln>=NRC_BLOCK[0]&&r.ln<=NRC_BLOCK[1]) return 'NRC';
  if(/^(Main — |Barbell |Dumbbell |Kettlebell |Cable |Resistance band |Trap bar |Single-arm |Double |Bench dips|Toes-to-bar|Close-grip|Paused|Light Kettlebell|Snatch grip|DB bench)/.test(r.s)&&r.s.split(' ').length<=6) return 'NAME';
  return 'COPY';
}
const groups={};
raw.forEach(r=>{ const b=bucket(r); (groups[b]=groups[b]||[]).push(r); });
console.log('  '+Object.entries(groups).map(([k,v])=>k+'='+v.length).sort().join('  '));
console.log('  (RAND_POOLS detail strings were subtracted with the name universe — the wildcard surface gets its own census below.)');

hr('Q2 — THE COPY INVENTORY (athlete-facing prose carrying an implement/quantity token)');
console.log(pad('line',7)+pad('function',26)+'string');
console.log('-'.repeat(78));
(groups.COPY||[]).forEach(r=>{
  console.log(pad(r.ln,7)+pad(fnAt(r.ln).slice(0,25),26)+r.s.slice(0,200));
});
console.log('\nnon-copy buckets, for audit:');
['NAME','NRC','DEV'].forEach(b=>{
  console.log('  '+b+' ('+((groups[b]||[]).length)+'): lines '+(groups[b]||[]).map(r=>r.ln).join(','));
});

// What a movement NAME requires, read the way an athlete reads it. Hand rules, not
// _gearOK / _auxGearOK — the question is "what has to be in the room", and the engine's
// own gate is the thing being audited, so it cannot also be the oracle.
function needsOf(name){
  const n=String(name||'').toLowerCase(); const out=new Set();
  if(/\bband\b|resistance band/.test(n)) out.add('band');
  if(/kettlebell|\(kb|\bkb\b/.test(n)) out.add('kettlebell');
  if(/dumbbell|\bdb\b|db |\(db/.test(n)) out.add('dumbbell');
  if(/barbell|back squat|front squat|^deadlift|sumo deadlift|snatch grip|power clean|thruster|good morning|push press|overhead press|close-grip bench|barbell complex|bench press$/.test(n)) out.add('barbell');
  if(/trap bar/.test(n)) out.add('trapbar');
  if(/cable|pushdown|pec deck|face pull|pulldown/.test(n)) out.add('cable');
  if(/machine|leg press|hack squat|leg extension|leg curl|smith/.test(n)) out.add('machine');
  if(/ball slam|wall ball|medicine ball|med ball/.test(n)) out.add('medball');
  if(/chinup|chin-up|pullup|pull-up|toes-to-bar|hanging |muscle-up|l-sit chinup/.test(n)) out.add('pullupbar');
  if(/farmer carry|suitcase carry|overhead carry|farmer/.test(n)) out.add('loadedcarry');
  if(/ab wheel/.test(n)) out.add('abwheel');
  if(/bench dips \(chair\)|\(chair|foot on chair/.test(n)) out.delete('barbell');
  if(/^bench dips$|^dips$/.test(n)) out.add('dipbars');
  if(/rower|row erg|bike|assault bike/.test(n)) out.add('ergo');
  return out;
}
const OWNS_EXT={  // the three synthetic tokens above, resolved per tier from TIER_OWNS
  loadedcarry: t=>TIER_OWNS[t].includes('dumbbell')||TIER_OWNS[t].includes('kettlebell')||TIER_OWNS[t].includes('barbell'),
  abwheel:     t=>t==='commercial'||t==='crossfit'||t==='home_full',
  dipbars:     t=>t==='commercial'||t==='crossfit',
  ergo:        t=>t==='commercial'||t==='crossfit',
};
function tierHas(tier,tok){
  if(OWNS_EXT[tok]) return OWNS_EXT[tok](tier);
  return TIER_OWNS[tier].includes(tok);
}

hr('Q2-A — THE WILDCARD SCREEN (RAND_POOLS). GATE: goal only. Equipment is NEVER read.');
console.log('getActivePool (10103-10106): `RAND_POOLS[activeProg.goal]` when randFilter==="mine", `Object.values(RAND_POOLS).flat()` when "all".');
console.log('reroll (10125) renders the picked workout verbatim. No equipment argument reaches either function.');
const RP=IA.RAND_POOLS||{};
const TIERS=['home_full','home_basic','commercial','crossfit','bodyweight','minimal'];
const poolKeys=Object.keys(RP);
let wcWorkouts=0, wcItems=0;
poolKeys.forEach(k=>{ (RP[k]||[]).forEach(w=>{ wcWorkouts++; (w.sections||[]).forEach(s=>{ wcItems+=(s.items||[]).length; }); }); });
console.log('pool: '+poolKeys.length+' goal keys ('+poolKeys.join(', ')+'), '+wcWorkouts+' workouts, '+wcItems+' prescribed items.');
console.log('\n'+pad('tier',12)+pad('owns (from the wizard copy)',56)+lpad('workouts w/ >=1 unownable item',32));
const wcRows=[];
TIERS.forEach(t=>{
  let bad=0, badItems=0, tot=0, totItems=0; const worst=new Map();
  poolKeys.forEach(k=>{ (RP[k]||[]).forEach(w=>{ tot++; let hit=false;
    (w.sections||[]).forEach(s=>{ (s.items||[]).forEach(i=>{ totItems++;
      const need=[...needsOf(i.name)].filter(tok=>!tierHas(t,tok));
      if(need.length){ hit=true; badItems++; bump(worst,need[0]); }
    }); });
    if(hit) bad++;
  }); });
  wcRows.push([t,bad,tot,badItems,totItems,worst]);
  console.log(pad(t,12)+pad(TIER_OWNS[t].join(','),56)+lpad(bad+'/'+tot+' = '+pct(bad,tot),32));
});
console.log('\nitem-level, same denominator set:');
wcRows.forEach(([t,bad,tot,badItems,totItems,worst])=>{
  console.log('  '+pad(t,12)+lpad(badItems+'/'+totItems,12)+' = '+pad(pct(badItems,totItems),7)+
    '  top missing: '+[...worst.entries()].sort((a,b)=>b[1]-a[1]).slice(0,4).map(([k,v])=>k+'×'+v).join(', '));
});
console.log('\nquantity claims inside wildcard DETAIL strings (class (b)), ungated the same way:');
const QCLAIM=/\bpairs?\b|both hands|each hand|each arm|two KBs|heaviest bells|one Kettlebell/i;
let qHits=0;
poolKeys.forEach(k=>{ (RP[k]||[]).forEach(w=>{
  (w.sections||[]).forEach(s=>{
    if(QCLAIM.test(String(s.label||''))){ qHits++; console.log('  ['+k+'] '+w.title+' — SECTION LABEL: "'+s.label+'"'); }
    (s.items||[]).forEach(i=>{ if(QCLAIM.test(String(i.detail||''))){ qHits++; console.log('  ['+k+'] '+w.title+' — '+i.name+': "'+i.detail+'"'); } });
  });
}); });
console.log('  total quantity claims in the wildcard pool: '+qHits+' / '+wcItems+' items + section labels.');
const PROG_GOALS=Object.values(IA.LIFTING_FOCUS_TO_GOAL||{});
const missing=[...new Set(PROG_GOALS)].filter(g=>!poolKeys.includes(g));
console.log('\nbycatch: LIFTING_FOCUS_TO_GOAL (2074) can produce '+[...new Set(PROG_GOALS)].join(', ')+'.');
console.log('  RAND_POOLS has no key for: '+(missing.length?missing.join(', '):'(none)')+
  ' -> getActivePool falls back to RAND_POOLS.balanced (10104) while buildRandFilterBar (10116) still prints the goal label.');

hr('Q2-B — _INJ_EFFECT (13973-13985). GATE: region + tier. Equipment is NEVER read.');
const INJ_CLAIMS=[
  {ln:13974,reg:'knee',tier:'protect',claim:'"Leg day becomes a posterior chain day. Hip thrusts, glute work, hamstrings."',
   test:it=>/hip thrust/i.test(it), needs:'hip thrust present'},
  {ln:13981,reg:'lowback',tier:'protect',claim:'"legs go machine based"',
   test:it=>/machine|leg press|leg extension|leg curl|hack squat/i.test(it), needs:'a machine movement present'},
  {ln:13984,reg:'elbow',tier:'workaround',claim:'"skullcrushers become pushdowns"',
   test:it=>/pushdown/i.test(it), needs:'a pushdown present'},
  {ln:13982,reg:'shoulder',tier:'workaround',claim:'"Face pulls stay, they help."',
   test:it=>/face pull/i.test(it), needs:'a face pull present'},
  {ln:13978,reg:'hip',tier:'workaround',claim:'"swings are out"',
   test:it=>!/swing/i.test(it), needs:'NO swing present'},
];
const SEEDS2=FAST?[76308,11111]:[76308,11111,90210,4242];
console.log('lattice per row: '+(6*7*3*4*SEEDS2.length)+' builds (6 tiers x 7 focuses x 3 exp x 4 goals x '+SEEDS2.length+' seeds).');
console.log(pad('inj copy',46)+pad('tier',12)+lpad('builds where the claim HOLDS',30));
INJ_CLAIMS.forEach(c=>{
  const row=[];
  TIERS.forEach(t=>{
    let ok=0,n=0;
    FOCUS.forEach(f=>EXP.forEach(x=>GOALS.forEach(g=>SEEDS2.forEach(sd=>{
      const cfg=Object.assign({name:'I',unit:'lbs',days:DAYS.slice(),bench:135,squat:155,deadlift:185,restDays:['sun','wed'],seed:sd,
        liftingFocus:f,experience:x,ageBracket:'18-35',equipment:t,injury:{region:c.reg,tier:c.tier}},g.f);
      let p; try{p=IA.buildProgram(cfg);}catch(e){return;} n++;
      const all=[]; Object.values(p.weeks||{}).forEach(w=>Object.values(w).forEach(d=>{(d&&d.sections||[]).forEach(s=>{(s.items||[]).forEach(i=>all.push(String(i.name||'')));});}));
      const joined=all.join(' | ');
      if(c.test(joined)) ok++;
    }))));
    row.push([t,ok,n]);
  });
  console.log(pad(c.reg+'/'+c.tier+' '+c.claim,46).slice(0,46));
  row.forEach(([t,ok,n])=>console.log('    '+pad(t,12)+lpad(ok+'/'+n,10)+' = '+pad(pct(ok,n),7)+'   ('+c.needs+')'));
});

hr('Q2-C — CONTROL: do ENGINE-emitted names respect the tier the wizard copy promised?');
console.log('oracle: TIER_OWNS, transcribed from index.html:2672-2678. Contract: index.html:2671 "The program only prescribes exercises you can actually do."');
const leakByTier=new Map(); const leakNames=new Map();
let ctrlN=0, ctrlI=0;
TIERS.forEach(t=>{
  let bad=0, tot=0;
  FOCUS.forEach(f=>EXP.forEach(x=>GOALS.forEach(g=>{
    const cfg=Object.assign({name:'C',unit:'lbs',days:DAYS.slice(),bench:135,squat:155,deadlift:185,restDays:['sun','wed'],seed:76308,
      liftingFocus:f,experience:x,ageBracket:'18-35',equipment:t},g.f);
    let p; try{p=IA.buildProgram(cfg);}catch(e){return;} ctrlN++;
    Object.values(p.weeks||{}).forEach(w=>Object.values(w).forEach(d=>{(d&&d.sections||[]).forEach(s=>{(s.items||[]).forEach(i=>{
      tot++; ctrlI++;
      const nm=String(i.name||'').replace(/<svg[\s\S]*?<\/svg>\s*/g,'').trim();
      const need=[...needsOf(nm)].filter(tok=>!tierHas(t,tok));
      if(need.length){ bad++; bump(leakNames,t+' :: '+nm+' (needs '+need.join('+')+')'); }
    });});}));
  })));
  leakByTier.set(t,[bad,tot]);
});
console.log(ctrlN+' builds, '+ctrlI+' prescribed items.');
[...leakByTier.entries()].forEach(([t,[b,n]])=>console.log('  '+pad(t,12)+lpad(b+'/'+n,14)+' = '+pct(b,n)));
const topLeak=[...leakNames.entries()].sort((a,b)=>b[1]-a[1]).slice(0,15);
if(topLeak.length){ console.log('  top name/tier disagreements with the WIZARD COPY (not necessarily engine defects — the copy may be the thing that is short):');
  topLeak.forEach(([k,v])=>console.log('    '+lpad(v,7)+'  '+k)); }
else console.log('  none.');

hr('Q2-D — ENGINE-emitted DETAIL strings: implement + quantity claims, by tier');
const detTok=/\bpairs?\b|both hands|each hand|each arm|heaviest bells|load the bar|add a plate|find a rack|grab a bench/i;
const detSide=/\beach\b/i;
const byTierDet=new Map();
TIERS.forEach(t=>{
  let tot=0, claim=0, side=0;
  FOCUS.forEach(f=>EXP.forEach(x=>GOALS.forEach(g=>[false,true].forEach(tv=>{
    const cfg=Object.assign({name:'D',unit:'lbs',days:DAYS.slice(),bench:135,squat:155,deadlift:185,restDays:['sun','wed'],seed:76308,
      liftingFocus:f,experience:x,ageBracket:'18-35',equipment:t},g.f);
    if(tv) cfg._travel=true;
    let p; try{p=IA.buildProgram(cfg);}catch(e){return;}
    Object.values(p.weeks||{}).forEach(w=>Object.values(w).forEach(d=>{(d&&d.sections||[]).forEach(s=>{(s.items||[]).forEach(i=>{
      const det=String(i.detail||''); tot++;
      if(detTok.test(det)) claim++;
      if(detSide.test(det)) side++;
    });});}));
  }))));
  byTierDet.set(t,[claim,side,tot]);
});
[...byTierDet.entries()].forEach(([t,[c,s,n]])=>console.log('  '+pad(t,12)+' implement/quantity claim '+lpad(c,7)+'/'+lpad(n,7)+' = '+pad(pct(c,n),7)+'   per-side "each" '+lpad(s,7)+' = '+pct(s,n)));
console.log('  the ONLY implement/quantity claim any engine-emitted detail carries is scheme():7276. "each" is the per-side marker parseRx:11016 reads; it is a SIDE claim, not an implement claim.');

hr('Q2-E — BYCATCH: cable/machine NAMES on tiers whose wizard copy names no cable or machine');
console.log('EXLIB.shoulder_iso (1539) is drawn RAW at index.html:8364-8365 (`_fA=...:EXLIB.shoulder_iso`), not through _gear (7397).');
const cableNames=new Map(); const cableSec=new Map();
let cbBuilds=0;
TIERS.forEach(t=>{
  FOCUS.forEach(f=>EXP.forEach(x=>GOALS.forEach(g=>SEEDS.forEach(sd=>{
    const cfg=Object.assign({name:'E',unit:'lbs',days:DAYS.slice(),bench:135,squat:155,deadlift:185,restDays:['sun','wed'],seed:sd,
      liftingFocus:f,experience:x,ageBracket:'18-35',equipment:t},g.f);
    let p; try{p=IA.buildProgram(cfg);}catch(e){return;} cbBuilds++;
    Object.values(p.weeks||{}).forEach(w=>Object.values(w).forEach(d=>{(d&&d.sections||[]).forEach(s=>{(s.items||[]).forEach(i=>{
      const nm=String(i.name||'').replace(/<svg[\s\S]*?<\/svg>\s*/g,'').trim();
      const need=[...needsOf(nm)];
      if((need.includes('cable')||need.includes('machine'))&&!tierHas(t,'cable')&&!tierHas(t,'machine')){
        bump(cableNames,t+' :: '+nm); bump(cableSec,t+' :: '+String(s.label||''));
      }
    });});}));
  }))));
});
console.log(cbBuilds+' builds. cable/machine-named items on cable-less tiers:');
const cl=[...cableNames.entries()].sort((a,b)=>b[1]-a[1]);
if(!cl.length) console.log('  none.');
cl.slice(0,20).forEach(([k,v])=>console.log('  '+lpad(v,7)+'  '+k));
console.log('  sections: '+[...cableSec.entries()].sort((a,b)=>b[1]-a[1]).slice(0,8).map(([k,v])=>k+'×'+v).join(' | '));

hr('Q2-H — BYCATCH: a NAME that claims an implement no predicate can see');
console.log('EXLIB.hip_stability (1583) holds "Hip airplane (light KB)". EQUIP_TOKENS.kettlebell (11701) is ["kettlebell","kb ","kb-","(kb"] —');
console.log('"(light KB)" matches none of them, so isKBExercise=false, isDBExercise=false, isTrackableWeight=false.');
console.log('the CARD says KB; the LOG side gives it neither a Load field (11476) nor the Bell size chips (12711).');
{
  let hb=0, tot=0; const byT=new Map();
  TIERS.forEach(t=>{ let k=0,n=0;
    FOCUS.forEach(f=>EXP.forEach(x=>SEEDS.forEach(sd=>{
      const cfg=Object.assign({name:'H',unit:'lbs',days:DAYS.slice(),bench:135,squat:155,deadlift:185,restDays:['sun','wed'],seed:sd,
        liftingFocus:f,experience:x,ageBracket:'18-35',equipment:t},GOALS[0].f);
      let p; try{p=IA.buildProgram(cfg);}catch(e){return;} n++; tot++;
      let found=false;
      Object.values(p.weeks||{}).forEach(w=>Object.values(w).forEach(d=>{(d&&d.sections||[]).forEach(sc=>{(sc.items||[]).forEach(i=>{ if(/hip airplane/i.test(String(i.name||''))) found=true; });});}));
      if(found){ k++; hb++; }
    })));
    byT.set(t,[k,n]);
  });
  console.log('  builds containing it: '+hb+'/'+tot);
  [...byT.entries()].forEach(([t,[k,n]])=>console.log('    '+pad(t,12)+lpad(k+'/'+n,10)+' = '+pct(k,n)));
  console.log('  predicates: isKBExercise='+call('isKBExercise',['Hip airplane (light KB)'])+
              '  isDBExercise='+call('isDBExercise',['Hip airplane (light KB)'])+
              '  isTrackableWeight='+call('isTrackableWeight',['Hip airplane (light KB)'])+
              '  _stationClass='+call('_stationClass',['Hip airplane (light KB)']));
}

hr('Q2-F — THE PASS LIST (gated tightly enough that the claim is always true)');
const PASSES=[
  [2672,'renderWizardStep','"Barbell, rack, bench, dumbbells, kettlebells, pull-up bar, trap bar, bands"','this string DEFINES home_full; it is the promise, not a claim about one','PASS by definition'],
  [2676,'renderWizardStep','"Full gym — cables, machines, barbells, everything"','defines commercial','PASS by definition'],
  [2678,'renderWizardStep','"You, the floor, and something to pull on. No weights."','defines bodyweight','PASS by definition'],
  [7275,'scheme','"2 sets of 12 to 15 — RPE 6 (light and clean)"','loadCapped taper/deload arm','PASS — names no implement'],
  [7277,'scheme','"3 sets — RPE 8 (stop 2 reps short of failure)"','!canAddLoad arm','PASS — names no implement'],
  [7919,'buildSections','"Work up to one heavy set of 3 to 5 reps at RPE 9 ... Log the weight and the reps."','_testRx, test week on a barbell goal','PASS — "the weight" is generic, no implement, no quantity'],
  [12805,'_rxShort','"Whatever you pick keeps "+_rxShort(detail)+"."','swap sheet; _rxShort (12806-12812) keeps only /\\d+ sets|\\d+×\\d+/ + RPE','PASS — truncation drops the parenthetical, so 7276 does NOT propagate here'],
  [12606,'(prog nudge)','"Time to add weight. ... Go up in weight today"','regex ^(\\d+)×(\\d+)–(\\d+) — a double-progression range row only','PASS — "3 sets of 8 to 12" cannot match, so travel never sees it'],
  [15568,'buildLedgerCards','"The heaviest set you actually did, and the working weight behind it."','ledger mains card; only renders when model.mains is non-empty','PASS — generic "weight", no implement'],
  [15582,'buildLedgerCards','"Hit the top of the range on every set, then add weight and start back at the bottom."','Range Ladder card; rows are loaded accessories with a rep range','PASS for the card; see 1106 for the ungated twin'],
  [11480,'buildExItem','"Load" / "Top set" / the lb|kg unit slot','gated on loaded = isKB||isTrackableWeight (11476)','PASS — names no implement'],
];
console.log(pad('line',7)+pad('function',20)+'string / gate / verdict');
PASSES.forEach(r=>{
  console.log(pad(r[0],7)+pad(r[1].slice(0,19),20)+r[2]);
  console.log(' '.repeat(27)+'gate: '+r[3]);
  console.log(' '.repeat(27)+r[4]);
});

hr('Q2-G — THE FAIL / AT-RISK LIST (athlete-facing, asserts something the tier may not provide)');
const FAILS=[
  [7276,'scheme','"3 sets of 8 to 12 — RPE 8 (heaviest pair you can find)"','(b) quantity — a matched PAIR',
   'cfg._travel && equipment===\'home_basic\' && !taper && !deload && !_effEase',
   'measured in Q1: '+pairHits+' occurrences over '+travelBuilds+' travel builds / '+travelItems+' items; strictly FALSE on '+(oOne+oNone)+'/'+pairHits+' = '+pct(oOne+oNone,pairHits)],
  [1106,'(static HTML, rpe-info modal)','"Accessories: hit the top of the rep range on every set, then add weight and start back at the bottom of the range."','(c) affordance — "add weight"',
   'NONE. Static markup inside #rpeInfo; shown by showRpeInfo() on every program, every tier.',
   'fires on 6/6 equipment tiers including bodyweight, where nothing can be added'],
  [2155,'setCalcLift','the 1RM estimator lift chips: "Deadlift" / "Squat" / "Bench"','(a) implement — three barbell lifts, by name',
   'NONE. calcLift defaults to \'Deadlift\' (1496); the estimator renders on the Progress tab for every program.',
   'hardcoded; no equipment read anywhere in runCalc/setCalcLift/the estimator markup (15833-15845)'],
  [12711,'buildKBChips','"Bell size" + a 9-chip bell ladder (15/20/25/35/44/53/62/70/80 lb)','(a) implement — a kettlebell, and a SIZE ladder that assumes a rack of them',
   'isKBExercise(name) — a NAME regex (11839 -> hasEquip -> EQUIP_TOKENS.kettlebell)',
   'name-inference site; fires wherever the name says kettlebell, on any tier that drew the name'],
  [12848,'openSwapSheet','"This round runs on one implement — picks lower down break that flow."','(b) quantity — asserts the round is single-implement',
   'sec.superset && _impl(item.name) matches >=1 other item in the section (12844-12849)',
   '_impl is a 5th name-inference regex; see Q3'],
  [13981,'_INJ_EFFECT','"Nothing loads the spine. Hinges and rows sit out, legs go machine based, core stays anti extension only."','(a) implement — MACHINES',
   'injury.region===\'lowback\' && tier===\'protect\'. Equipment is never read.',
   'measured above'],
  [13984,'_INJ_EFFECT','"Straight bar work moves to neutral grips, skullcrushers become pushdowns, dips and carries are out"','(a) a BAR, and a cable PUSHDOWN',
   'injury.region===\'elbow\' && tier===\'workaround\'. Equipment is never read.',
   'measured above'],
  [13982,'_INJ_EFFECT','"Face pulls stay, they help."','(a) implement — a cable',
   'injury.region===\'shoulder\' && tier===\'workaround\'. Equipment is never read.',
   'measured above'],
  [13913,'_EQUIP_OPTS','"Mini gym — Dumbbells, a bench, a treadmill. The standard hotel setup."','(c) affordance, and it CONTRADICTS the wizard copy for the same tier id',
   'travel sheet only. Same `home_basic` enum drives the engine in both cases.',
   'wizard home_basic (2675) says "Dumbbells, kettlebells, pull-up bar, bands. No barbell." — no bench, no treadmill; travel says no kettlebell, no band, no pull-up bar'],
  [14021,'_renderTravelTab','"Grab the heaviest load you can control and work in the 8 to 12 range. If that still feels easy, go single arm."','(c) affordance — V194 D54 already neutralised the implement; "go single arm" still assumes a one-hand-able load',
   '_ovDraft.equipment!==\'bodyweight\' inside the travel sheet, i.e. home_basic (commercial is a no-op)',
   'the SHEET copy and the PRESCRIPTION copy (7276) describe the same session with two different grammars'],
  [10040,'RAND_POOLS.athletic','"Farmer carry — 5×40 yards, heaviest bells"','(a)+(b) implement + quantity (plural bells)',
   'NONE beyond activeProg.goal. Wildcard screen never reads equipment.','measured in Q2-A'],
  [10028,'RAND_POOLS.fatloss','section label "5 rounds with two KBs — 90s rest"','(b) quantity — TWO kettlebells',
   'NONE beyond activeProg.goal.','measured in Q2-A'],
  [10038,'RAND_POOLS.athletic','section label "5 rounds 90s rest — one Kettlebell no putting it down"','(b) quantity — one kettlebell',
   'NONE beyond activeProg.goal.','measured in Q2-A'],
  [10054,'RAND_POOLS.athletic','"Farmer carry relay — 3×50 yards each hand"','(b) quantity — each hand, i.e. two implements',
   'NONE beyond activeProg.goal.','measured in Q2-A'],
];
FAILS.forEach(r=>{
  console.log(pad(r[0],7)+r[1]);
  console.log('   string : '+r[2]);
  console.log('   class  : '+r[3]);
  console.log('   gate   : '+r[4]);
  console.log('   pop    : '+r[5]);
});

hr('Q3 — HOW MANY MECHANISMS? (what each copy site infers its implement FROM)');
const MECH=[
  ['7276  scheme loadCapped',            '(i) equipment tier', 'cfg._travel && equip===\'home_basic\' (7434). The TIER is asked; the MOVEMENT is not.'],
  ['1106  rpe-info modal',               '(iv) nothing',       'static markup, no condition of any kind'],
  ['2155  1RM estimator chips',          '(iv) nothing',       'three barbell lift names hardcoded in an array literal'],
  ['12711 buildKBChips "Bell size"',     '(ii) movement NAME', 'isKBExercise (11839) -> hasEquip -> EQUIP_TOKENS.kettlebell (11699)'],
  ['11476 buildExItem loaded/Load box',  '(iii) loaded bool',  'loaded = isKB || isTrackableWeight (11441/11444/11476)'],
  ['12848 swap sheet flow note',         '(ii) movement NAME', '_impl, its OWN inline regex at 12844 — /kettlebell|\\(kb/, /dumbbell|\\(db/, /barbell|trap bar/'],
  ['13981 _INJ_EFFECT lowback/protect',  '(iv) nothing',       'region+tier only; equipment never read'],
  ['13982 _INJ_EFFECT shoulder/workarnd','(iv) nothing',       'region+tier only'],
  ['13984 _INJ_EFFECT elbow/workaround', '(iv) nothing',       'region+tier only'],
  ['13913 _EQUIP_OPTS "Mini gym" desc',  '(i) equipment tier', 'the string IS the tier description — but a SECOND one, disagreeing with 2675'],
  ['14021 travel sheet holds copy',      '(i) equipment tier', '_ovDraft.equipment===\'bodyweight\' ? A : B — two branches for three options'],
  ['10028/10038/10040/10054 wildcard',   '(iv) nothing',       'authored into RAND_POOLS; getActivePool (10103) reads activeProg.goal only'],
];
const mc={};
MECH.forEach(m=>{ mc[m[1]]=(mc[m[1]]||0)+1; console.log(pad(m[0],38)+pad(m[1],22)+m[2]); });
console.log('\nmechanism census over '+MECH.length+' athlete-facing implement-claim sites:');
Object.entries(mc).sort().forEach(([k,v])=>console.log('  '+pad(k,22)+v));

hr('Q3b — IS ANY COPY SITE A FIFTH/SIXTH NAME-INFERENCE SITE, AND DO ANY TWO DISAGREE?');
console.log('handoff §12 counts FOUR name-inference sites; the V177 watch item calls _impl (12844) the FIFTH.');
console.log('this pass adds buildKBChips/"Bell size" as a consumer of isKBExercise — a READER of an existing site, not a new one.');
// The Q3b universe must be MOVEMENT NAMES only. NAMES also holds RAND_POOLS section
// labels and workout titles (walk() takes every string leaf) — comparing a predicate
// against "Bench PR Attempt" measures nothing. Rebuild from name fields alone.
const EXNAMES=new Set();
(function w2(o){ if(Array.isArray(o)){o.forEach(w2);return;}
  if(o&&typeof o==='object'){ if(typeof o.name==='string') EXNAMES.add(o.name.trim());
    Object.values(o).forEach(w2); return; }
  if(typeof o==='string') EXNAMES.add(o.trim()); })(IA.EXLIB);
Object.values(IA.RAND_POOLS||{}).forEach(pl=>(pl||[]).forEach(w=>(w.sections||[]).forEach(sc=>(sc.items||[]).forEach(i=>{ if(i&&i.name) EXNAMES.add(String(i.name).trim()); }))));
['home_full','home_basic','commercial','crossfit','bodyweight','minimal'].forEach(eq=>FOCUS.forEach(f=>EXP.forEach(x=>GOALS.forEach(g=>[false,true].forEach(tv=>{
  const cfg=Object.assign({name:'X',unit:'lbs',days:DAYS.slice(),bench:135,squat:155,deadlift:185,restDays:['sun','wed'],seed:76308,liftingFocus:f,experience:x,ageBracket:'18-35',equipment:eq},g.f);
  if(tv) cfg._travel=true;
  let p2; try{p2=IA.buildProgram(cfg);}catch(e){return;}
  Object.values(p2.weeks||{}).forEach(w=>Object.values(w).forEach(d=>{(d&&d.sections||[]).forEach(sc=>{(sc.items||[]).forEach(i=>EXNAMES.add(String(i.name||'').replace(/<svg[\s\S]*?<\/svg>\s*/g,'').trim()));});}));
})))));
const NAMEARR=[...EXNAMES].filter(Boolean).sort();
const _implJS=function(n){const N=String(n||'').toLowerCase();
  return /kettlebell|\(kb/.test(N)?'kb':(/dumbbell|\(db/.test(N)?'db':(/barbell|trap bar/.test(N)?'bb':null));};
let dKB=0,dDB=0,dLoad=0,dStation=0, tot=0;
const exKB=[],exDB=[],exLoad=[];
NAMEARR.forEach(n=>{
  if(!n) return; tot++;
  const impl=_implJS(n);
  const isKB=call('isKBExercise',[n])===true;
  const isDB=call('isDBExercise',[n])===true;
  const trk =call('isTrackableWeight',[n])===true;
  const st  =call('_stationClass',[n]);
  const mine=needsOf(n);
  if((impl==='kb')!==isKB){ dKB++; if(exKB.length<8) exKB.push(n+'  [_impl='+impl+' isKBExercise='+isKB+']'); }
  if((impl==='db')!==isDB){ dDB++; if(exDB.length<8) exDB.push(n+'  [_impl='+impl+' isDBExercise='+isDB+']'); }
  const mineLoaded=['barbell','dumbbell','kettlebell','trapbar','cable','machine','medball','loadedcarry'].some(t=>mine.has(t));
  if(mineLoaded!==trk){ dLoad++; if(exLoad.length<10) exLoad.push(n+'  [name reads loaded='+mineLoaded+' isTrackableWeight='+trk+']'); }
  if(impl==='bb'&&st!=='RACK') dStation++;
});
console.log('\nname universe compared: '+tot+' names.');
console.log('  _impl(12844) says kb  vs isKBExercise(11839)      : '+dKB+'/'+tot+' disagree ('+pct(dKB,tot)+')');
exKB.forEach(e=>console.log('      '+e));
console.log('  _impl(12844) says db  vs isDBExercise(11844)      : '+dDB+'/'+tot+' disagree ('+pct(dDB,tot)+')');
exDB.forEach(e=>console.log('      '+e));
console.log('  the NAME reads loaded vs isTrackableWeight(11760) : '+dLoad+'/'+tot+' disagree ('+pct(dLoad,tot)+')');
exLoad.forEach(e=>console.log('      '+e));
console.log('  _impl says barbell vs _stationClass(1656)!==RACK  : '+dStation+'/'+tot);

hr('Q4 — WHAT ELSE DID THE V194 SCOPE MISS? (other writers of the same two values)');
console.log('D53 touched buildMainLiftBlock (15513). Every OTHER writer of a progress / gain / delta string:');
[
 [15519,'buildMainLiftBlock','" · up <b>N lbs</b>"  — the gain clause D53 edited; still the only implement-free form'],
 [15520,'buildMainLiftBlock','" · heaviest in week N" — same line, no implement claim  (PASS)'],
 [15568,'buildLedgerCards','"The heaviest set you actually did, and the working weight behind it."  (PASS)'],
 [15581,'buildLedgerCards','"You have stepped the weight up N times across your accessories this block."  (PASS)'],
 [15582,'buildLedgerCards','"Hit the top of the range on every set, then add weight and start back at the bottom."  (PASS as a card; the UNGATED twin is 1106)'],
 [15586,'buildLedgerCards','"...the movement is ready for more weight."  (PASS)'],
 [15550,'_ladderRow','"Add weight" status chip  (PASS — no implement)'],
 [12619,'showProgressNudge','"Time to add weight. ... Go up in weight today and start back at the bottom of the range."  (PASS — gated to a N×L–H row)'],
 [11170,'setDelta','"+N" / "-N" per-set rep delta badge  (PASS — reps, not load)'],
 [1106 ,'(static)','"Accessories: hit the top of the rep range ... then add weight"  — SAME SENTENCE as 15582 but with NO gate at all'],
].forEach(r=>console.log('  '+lpad(r[0],6)+'  '+pad(r[1],22)+r[2]));
console.log('\nD54 touched _renderTravelTab (14019-14021). Every OTHER travel-overlay copy branch:');
[
 [14005,'_renderTravelTab','isNoOp: "A real gym means nothing needs to change. Train your program as written."  (PASS)'],
 [14019,'_renderTravelTab','bodyweight arm: "...Reps are yours: three sets, stop two short of failure. Run past 25 and it is time for a harder variant."  (PASS — no implement)'],
 [14021,'_renderTravelTab','non-bodyweight arm: the D54 string; "go single arm" still assumes a one-hand-able load'],
 [13913,'_EQUIP_OPTS','"Dumbbells, a bench, a treadmill." — the tier description itself; NOT touched by D54 and it disagrees with 2675'],
 [13864,'renderOverlayChip','patchLbl "Mini gym" / "Room only" / "Full gym"  (PASS — labels, no claim)'],
 [13809,'travelTagHTML','the "Travel" day tag  (PASS)'],
 [13833,'overlayBackCopy','"<date> picks your program back up." / "That runs to the end of your program."  (PASS)'],
].forEach(r=>console.log('  '+lpad(r[0],6)+'  '+pad(r[1],22)+r[2]));
console.log('\nEvery OTHER reader of a frozen prescription DETAIL (the string 7276 writes):');
[
 [11401,'buildExItem','_dispDetail — renders it verbatim on the card. THE reader that shows "heaviest pair you can find".'],
 [11475,'buildExItem','parseRx(detail) — 11010-11017 has a branch written specifically for this literal; reads the numbers, not the parenthetical  (PASS)'],
 [11442,'buildExItem','isOpenEnded regex on the detail  (PASS)'],
 [12858,'openSwapSheet','_rxShort(detail) -> "Whatever you pick keeps 3 sets at RPE 8."  (PASS — truncates the parenthetical away)'],
 [12899,'doSwap','_swapDetailFor(to, detail) — can REWRITE the detail; 9055-9068 only rewrites when _repFloor(name)[1]===0'],
 [12606,'showProgressNudge','regex ^(\\d+)×(\\d+)–(\\d+) — cannot match "3 sets of 8 to 12"  (PASS)'],
 [12968,'(day est)','parseRx for the set count  (PASS)'],
 [15414,'ledgerModel','it.detail harvested for the accessory range  (PASS)'],
 [9066 ,'_swapDetailFor','isTrackableWeight(name,detail)  (PASS)'],
 [12406,'(logged count)','exLoggable(name, detail)  (PASS)'],
].forEach(r=>console.log('  '+lpad(r[0],6)+'  '+pad(r[1],22)+r[2]));

hr('Q2 — COMMENTS THAT WOULD BECOME ATHLETE-FACING IF COPIED INTO A STRING');
console.log('(out of scope as code, listed because that is how 7276 got written)');
const CMT=[
  [7426,'"loadCapped — a hotel rack. Real load, but it tops out around 40 lb" — asserts a RACK and a number the app never checks'],
  [7431,'"Light dumbbells are useless for triples ... going single arm is the way to make a light dumbbell heavy again" — asserts dumbbells'],
  [11010,'"Emitted by the travel/loadCapped branch (\\"3 sets of 8 to 12 — RPE 8 (heaviest pair you can find)\\")" — the pair literal, quoted a SECOND time in parseRx\'s comment'],
  [8791,'"a hotel dumbbell cannot express a triple"'],
  [7350,'"Every tier the wizard offers lists dumbbells except Bodyweight only ... CrossFit\'s blurb abbreviates ... but a box has dumbbells" — the file already knows the wizard copy is short'],
  [13741,'"_travel ... lets Mini gym mean a hotel rack (a few light dumbbells, hold the line) while the SAME home_basic tier chosen in the wizard means a real home gym"'],
];
CMT.forEach(c=>console.log('  '+lpad(c[0],6)+'  '+c[1]));
console.log('\nverbatim check that 11010 really carries the literal:');
console.log('  index.html:11010  '+LINES[11009].trim().slice(0,160));
console.log('  index.html:7276   '+LINES[7275].trim().slice(0,160));

hr('WHAT THIS PASS DID NOT MEASURE');
[
 'the swap and skip paths: a swapped-in movement inherits the frozen detail unless _swapDetailFor rewrites it — not swept here',
 'ia_hist_ snapshots: a day frozen while a travel overlay was live keeps the pair string forever; no snapshot lattice was run',
 'unit:"kg" — every string above was measured on unit:"lbs" only',
 'EX_KEY_ALIAS fold-at-render, and whether an aliased name changes which copy branch fires',
 'the NRC run-session transcriptions (doctrine-verbatim, out of scope by the NRC invariant)',
 'multi-line template literal copy that carries an implement token across a line break (the text-node scan catches one line at a time)',
 'aria-label / title attributes: all 20 aria-labels were read by hand (grep) and none names an implement or a quantity; no automated attribute sweep was run',
 'the wildcard census uses the WIZARD copy as the inventory oracle; it does not ask whether the wizard copy is itself complete (7350 says crossfit\'s is not)',
].forEach(s=>console.log('  - '+s));
console.log('\ndone.');
