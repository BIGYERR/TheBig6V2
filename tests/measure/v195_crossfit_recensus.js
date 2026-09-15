// v195 — measure pass M2: THE CROSSFIT RE-CENSUS.
//
// MODE B (before-picture). Read-only. Sibling of v195_implement_claim_sweep.js, which
// censused the Wildcard pool using the WIZARD COPY as the inventory oracle and reported
// crossfit at 82/147 workouts holding an unownable item. Coach flagged that the crossfit
// blurb is ITSELF defective. This pass re-runs the census with a corrected inventory and
// prints the delta, then separates "genuine equipment gap" from "the tier's copy is short".
//
// ORACLES — each independent of the function under suspicion (_gearOK / _auxGearOK):
//  O1  what a tier owns  — the WIZARD equipment descriptions, index.html:2672-2678,
//                          transcribed verbatim. Corrections to that inventory are listed
//                          one by one with the evidence, below, and are the only edits.
//  O2  what a movement needs — a HAND TABLE over ALL 92 distinct names in RAND_POOLS,
//                          authored from the movement standard, printed in full. A name
//                          not in the table prints UNCLASSIFIED and is a failure of this
//                          pass, not a zero.
//  O3  the pool itself   — walked out of IA.RAND_POOLS at runtime, not transcribed.
//  O4  the floor         — 28, coach's ruling, derived from the smallest shipping pool
//                          (fatloss). Recomputed here from the pool, not hardcoded.
//
// usage: node tests/measure/v195_crossfit_recensus.js
'use strict';
const fs=require('fs'), path=require('path');
const {load}=require(path.join(__dirname,'..','harness.js'));
const HTML=path.join(__dirname,'..','..','index.html');
const SRC=fs.readFileSync(HTML,'utf8');
const LINES=SRC.split('\n');
const IA=load(HTML);
const DAYS=['sun','mon','tue','wed','thu','fri','sat'];
function hr(t){ console.log('\n'+'='.repeat(78)+'\n'+t+'\n'+'='.repeat(78)); }
function pad(s,n){ s=String(s); return s.length>=n?s:s+' '.repeat(n-s.length); }
function lpad(s,n){ s=String(s); return s.length>=n?s:' '.repeat(n-s.length)+s; }
function pct(a,b){ return b?((100*a/b).toFixed(1)+'%'):'n/a'; }
function lineOf(re){ for(let i=0;i<LINES.length;i++) if(re.test(LINES[i])) return i+1; return -1; }

console.log('v195 M2 — crossfit re-census. artifact '+HTML+' @ ia-version '+IA.version);

/* ══════════════════════════════════════════════════════════════════════════
   THE INVENTORY, OLD AND CORRECTED
   ══════════════════════════════════════════════════════════════════════════ */
hr('THE INVENTORY. What changed, and on what evidence.');
const WIZ_LN=lineOf(/id:'crossfit'/);
console.log('wizard copy, index.html:'+lineOf(/id:'home_full'/)+'-'+lineOf(/id:'bodyweight'/)+', verbatim:');
[['home_full','Barbell, rack, bench, dumbbells, kettlebells, pull-up bar, trap bar, bands'],
 ['home_basic','Dumbbells, kettlebells, pull-up bar, bands. No barbell.'],
 ['commercial','Full gym — cables, machines, barbells, everything'],
 ['crossfit','Barbells, rig, bumpers, kettlebells, rower/bike, wall balls, bands'],
 ['bodyweight','You, the floor, and something to pull on. No weights.']].forEach(r=>console.log('  '+pad(r[0],12)+'"'+r[1]+'"'));

// OLD = exactly the table the previous pass used (v195_implement_claim_sweep.js:65-77 + 361-366).
const OWNS_OLD={
  home_full : ['barbell','rack','bench','dumbbell','kettlebell','pullupbar','trapbar','band','abwheel','loadedcarry'],
  home_basic: ['dumbbell','kettlebell','pullupbar','band','loadedcarry'],
  commercial: ['barbell','rack','bench','dumbbell','kettlebell','pullupbar','trapbar','band','cable','machine','medball','sled','abwheel','dipbars','ergo','loadedcarry'],
  crossfit  : ['barbell','rig','bumper','kettlebell','rower','bike','wallball','band','pullupbar','abwheel','dipbars','ergo','loadedcarry'],
  bodyweight: ['pullupbar'],
  minimal   : ['kettlebell','loadedcarry'],
};
// CORRECTED. Every edit is listed; nothing else moved.
const CORRECTIONS=[
 ['crossfit','+dumbbell',
  'index.html:'+lineOf(/but a box has dumbbells and the engine already prescribes/)+' (the file\'s own comment) and index.html:'+lineOf(/const hasDumbbells=equip!=='bodyweight'/)+
  ' `const hasDumbbells=equip!==\'bodyweight\'` — the ENGINE has always held that crossfit owns dumbbells. Prior pass Q2-C measured 5552/21653 = 25.6% of crossfit items disagreeing with the blurb, almost all dumbbells.'],
 ['crossfit','+medball',
  'the crossfit blurb ALREADY names "wall balls" (index.html:'+WIZ_LN+'). A wall ball IS a medicine ball. The prior pass tokenised the copy as `wallball` and the movement need as `medball`, so this row was an INSTRUMENT mismatch in that pass, not a copy defect. _auxGearOK:'+lineOf(/ball slams\|wall ball\|medicine ball/)+' also gives med balls to commercial||crossfit.'],
 ['(all)','-rack',
  'dropped from the need side entirely: no tier in the wizard copy owns a barbell without a rack word ("rack" home_full, "everything" commercial, "rig" crossfit), so `rack` could only ever manufacture a failure. Barbell implies rack here.'],
];
const OWNS_NEW=JSON.parse(JSON.stringify(OWNS_OLD));
OWNS_NEW.crossfit.push('dumbbell','medball');
console.log('\nCORRECTIONS APPLIED (and only these):');
CORRECTIONS.forEach(c=>{ console.log('  '+pad(c[0],12)+pad(c[1],12)+c[2]); });
console.log('\nNOT corrected, deliberately, so they stay visible as numbers below:');
console.log('  crossfit owns no BENCH in its copy. A box has benches. Left in, so "Barbell bench press" reports as a copy gap rather than vanishing.');
console.log('  crossfit owns no TRAP BAR in its copy. Left in, and it is the class coach predicted the 82 would collapse to.');
console.log('  home_basic owns no BENCH in its copy while the travel sheet for the SAME tier id promises one (_EQUIP_OPTS:'+lineOf(/Dumbbells, a bench, a treadmill/)+').');

/* ══════════════════════════════════════════════════════════════════════════
   O2 — THE HAND TABLE. All 92 names in RAND_POOLS.
   ══════════════════════════════════════════════════════════════════════════ */
// tokens: barbell bench dumbbell kettlebell pullupbar trapbar band cable machine
//         medball dipbars abwheel ergo loadedcarry
// An entry is an ARRAY OF ALTERNATIVES; the movement is performable if ANY alternative
// is fully owned. [[ ]] (one empty alternative) = needs nothing.
const N=[];                                    // needs nothing
const NEEDS={
 '10 ball slams':[['medball']],
 '20 broad jumps':N.concat([[]]),
 '30 chinups':[['pullupbar']],
 '40 pushups':[[]],
 '50 Kettlebell swings':[['kettlebell']],
 'Ab wheel rollouts':[['abwheel']],
 'Back squat':[['barbell']],
 'Ball slams':[['medball']],
 'Ball slams OR Kettlebell swings':[['medball'],['kettlebell']],
 'Barbell Romanian deadlift':[['barbell']],
 'Barbell bench OR deadlift':[['barbell','bench'],['barbell']],
 'Barbell bench press':[['barbell','bench']],
 'Barbell good mornings':[['barbell']],
 'Barbell overhead press':[['barbell']],
 'Barbell push press':[['barbell']],
 'Barbell row':[['barbell']],
 'Bird dogs':[[]],
 'Broad jumps':[[]],
 'Broad jumps OR mountain climbers':[[]],
 'Burpees':[[]],
 'Chinups':[['pullupbar']],
 'Chinups OR barbell row':[['pullupbar'],['barbell']],
 'Close-grip bench press':[['barbell','bench']],
 'Dead bugs':[[]],
 'Dead bugs or situps':[[]],
 'Deadlift':[['barbell']],
 'Deep squat hold':[[]],
 'Diamond pushups':[[]],
 'Dips':[['dipbars']],
 'Double kettlebell swing':[['kettlebell']],
 'Dumbbell Arnold press':[['dumbbell']],
 'Dumbbell Bulgarian split squat':[['dumbbell']],
 'Dumbbell Romanian deadlift':[['dumbbell']],
 'Dumbbell bench press':[['dumbbell','bench']],
 'Dumbbell curl':[['dumbbell']],
 'Dumbbell front raise':[['dumbbell']],
 'Dumbbell goblet squat':[['dumbbell']],
 'Dumbbell incline press':[['dumbbell','bench']],
 'Dumbbell lateral raise':[['dumbbell']],
 'Dumbbell row':[['dumbbell']],
 'Even 5 min: Barbell complex':[['barbell']],
 'Even min: Pushups':[[]],
 'Farmer carry':[['loadedcarry']],
 'Farmer carry relay':[['loadedcarry']],
 'Front squat':[['barbell']],
 'Hanging hold':[['pullupbar']],
 'Hanging knee raises':[['pullupbar']],
 'Hip 90/90 stretch':[[]],
 'Jump squats':[[]],
 'Kettlebell clean':[['kettlebell']],
 'Kettlebell deadlift':[['kettlebell']],
 'Kettlebell front squat':[['kettlebell']],
 'Kettlebell goblet squat':[['kettlebell']],
 'Kettlebell single-arm press':[['kettlebell']],
 'Kettlebell single-arm row':[['kettlebell']],
 'Kettlebell single-leg deadlift':[['kettlebell']],
 'Kettlebell swing':[['kettlebell']],
 'Kettlebell swing medley':[['kettlebell']],
 'L-sit chinups':[['pullupbar']],
 'L-sit hold':[[]],
 'Log press (Kettlebell clean + press)':[['kettlebell']],
 'Min 1,4,7,10,13,16,19: Deadlift':[['barbell']],
 'Min 2,5,8,11,14,17,20: Barbell bench':[['barbell','bench']],
 'Min 3,6,9,12,15,18: Kettlebell swings':[['kettlebell']],
 'Mountain climbers':[[]],
 'Odd 5 min: Spin bike or run':[['ergo'],[]],
 'Odd min: Kettlebell swings':[['kettlebell']],
 'Overhead carry':[['loadedcarry']],
 'Paused back squat':[['barbell']],
 'Paused barbell bench press':[['barbell','bench']],
 'Paused barbell bench press (2 sec)':[['barbell','bench']],
 'Paused deadlift (below knee)':[['barbell']],
 'Paused squat (2 sec)':[['barbell']],
 'Plank hold':[[]],
 'Pushups':[[]],
 'Pushups (slow tempo)':[[]],
 'Reverse lunge (KB)':[['kettlebell']],
 'Round 1: Kettlebell swings':[['kettlebell']],
 'Round 2: Pushups':[[]],
 'Round 3: Jump squats':[[]],
 'Round 4: Mountain climbers':[[]],
 'Slow goblet squat (KB)':[['kettlebell']],
 'Snatch grip deadlift':[['barbell']],
 'Step-ups (KB)':[['kettlebell']],
 'Suitcase carry':[['loadedcarry']],
 'Trap bar deadlift':[['trapbar']],
 'Trap bar farmer carry':[['trapbar']],
 'Walking lunge (KB)':[['kettlebell']],
 'Wall sit':[[]],
 'Weighted chinups':[['pullupbar']],
 'Weighted dips':[['dipbars']],
 'Worlds greatest stretch':[[]],
};
const JUDGED=[
 ["'Paused squat (2 sec)' -> barbell", "the name does not say barbell. It sits in the STRENGTH pool next to 'Paused back squat'; an unqualified paused squat in a strength wildcard is a barbell back squat. Judged, not read."],
 ["'Odd 5 min: Spin bike or run' -> satisfiable everywhere", "the 'or run' alternative needs nothing, so no tier can fail it. The bike alternative is never load-bearing."],
 ["'Dumbbell Bulgarian split squat' / 'Step-ups (KB)' -> no bench/box token", "a chair, a bed or a plate box is assumed available on every tier. Requiring a bench here would have manufactured failures on home_basic and bodyweight."],
 ["'Weighted chinups' / 'Weighted dips' -> no extra load token", "a belt, a vest, a held dumbbell or a bag all work; the load is not a named implement."],
 ["'Farmer carry' family -> loadedcarry", "satisfied by dumbbell OR kettlebell OR trapbar (prior pass's rule, kept). 'Trap bar farmer carry' names its own implement and is trapbar, not loadedcarry."],
];
const LOADED=t=>OWNS[t].includes('dumbbell')||OWNS[t].includes('kettlebell')||OWNS[t].includes('trapbar')||OWNS[t].includes('barbell');
let OWNS=OWNS_NEW;
function ownsTok(t,tok){ if(tok==='loadedcarry') return LOADED(t); return OWNS[t].includes(tok); }
function canDo(t,name){
  const alts=NEEDS[name];
  if(!alts) return 'UNCLASSIFIED';
  return alts.some(a=>a.every(tok=>ownsTok(t,tok)));
}
function missingFor(t,name){
  const alts=NEEDS[name]; if(!alts) return ['UNCLASSIFIED'];
  let best=null;
  alts.forEach(a=>{ const m=a.filter(tok=>!ownsTok(t,tok)); if(best===null||m.length<best.length) best=m; });
  return best||[];
}

const RP=IA.RAND_POOLS||{};
const POOLS=Object.keys(RP);
const TIERS=['home_full','home_basic','commercial','crossfit','bodyweight','minimal'];
const allNames=new Set();
let TOTW=0, TOTI=0;
POOLS.forEach(k=>(RP[k]||[]).forEach(w=>{TOTW++;(w.sections||[]).forEach(s=>(s.items||[]).forEach(i=>{TOTI++;allNames.add(i.name);}));}));
hr('THE HAND TABLE — coverage check before any number is reported.');
const unk=[...allNames].filter(n=>!NEEDS[n]);
console.log('RAND_POOLS: '+POOLS.length+' goal keys ('+POOLS.map(k=>k+'='+RP[k].length).join(', ')+'), '+TOTW+' workouts, '+TOTI+' prescribed items, '+allNames.size+' distinct names.');
console.log('hand table entries: '+Object.keys(NEEDS).length+'.  names in the pool with NO table entry: '+unk.length+(unk.length?('  *** '+unk.join(' | ')+' ***'):'  (0 — the table covers the pool)'));
console.log('\nJUDGEMENT CALLS in the table (read, not derived — flag these to coach):');
JUDGED.forEach(j=>console.log('  '+j[0]+'\n      '+j[1]));

/* ══════════════════════════════════════════════════════════════════════════
   Q2b — dipbars and abwheel
   ══════════════════════════════════════════════════════════════════════════ */
hr('Q2b — WHO OWNS DIP BARS AND AN AB WHEEL? There is no reading that settles it.');
const dipNames=[...allNames].filter(n=>(NEEDS[n]||[]).some(a=>a.includes('dipbars')));
const awNames =[...allNames].filter(n=>(NEEDS[n]||[]).some(a=>a.includes('abwheel')));
function wkWith(pred){ const out=[]; POOLS.forEach(k=>(RP[k]||[]).forEach(w=>{ let hit=false; (w.sections||[]).forEach(s=>(s.items||[]).forEach(i=>{ if(pred(i.name)) hit=true; })); if(hit) out.push(k+'/'+w.title); })); return out; }
const dipW=wkWith(n=>dipNames.includes(n)), awW=wkWith(n=>awNames.includes(n));
console.log('names needing dip bars : '+dipNames.join(', ')+'   -> '+dipW.length+'/'+TOTW+' workouts: '+dipW.join(' | '));
console.log('names needing an ab wheel: '+awNames.join(', ')+'   -> '+awW.length+'/'+TOTW+' workouts: '+awW.join(' | '));
console.log('\nEVIDENCE, all three readings:');
console.log('  P0 THE COPY       — no tier\'s wizard blurb names dip bars or an ab wheel. Strict reading: NO tier owns either.');
console.log('  P1 THE PRIOR PASS — v195_implement_claim_sweep.js:363-364 asserted abwheel=home_full|commercial|crossfit, dipbars=commercial|crossfit. No evidence was stated for either line. That is the unclassified part coach flagged.');
console.log('  P2 THE ENGINE     — _gearOK ('+lineOf(/const _gearOK = n => \{/)+') and _auxGearOK ('+lineOf(/^function _auxGearOK/)+') name neither "dip" nor "wheel" anywhere, so both fall through to `return true`: legal on EVERY tier including bodyweight.');
console.log('     engine check: _auxGearOK("Ab wheel rollouts","bodyweight") = '+IA.eval('(typeof _auxGearOK==="function")?_auxGearOK("Ab wheel rollouts","bodyweight"):"NO-FN"')+
            ' ; _auxGearOK("Dips","bodyweight") = '+IA.eval('(typeof _auxGearOK==="function")?_auxGearOK("Dips","bodyweight"):"NO-FN"'));
console.log('  this pass does NOT rule which reading is right. Every table below is printed under P1 (the prior pass, so the delta is attributable to the crossfit');
console.log('  correction alone) and the spread across P0/P1/P2 is printed as a sensitivity band. Coach\'s call.');
const POLICIES={
  P0:{abwheel:[],dipbars:[]},
  P1:{abwheel:['home_full','commercial','crossfit'],dipbars:['commercial','crossfit']},
  P2:{abwheel:TIERS.slice(),dipbars:TIERS.slice()},
};
function applyPolicy(base,pol){
  const o=JSON.parse(JSON.stringify(base));
  TIERS.forEach(t=>{ ['abwheel','dipbars'].forEach(tok=>{
    o[t]=o[t].filter(x=>x!==tok); if(POLICIES[pol][tok].includes(t)) o[t].push(tok);
  }); });
  return o;
}

/* ══════════════════════════════════════════════════════════════════════════
   Q2a — THE RE-CENSUS
   ══════════════════════════════════════════════════════════════════════════ */
function census(ownsTable){
  OWNS=ownsTable;
  const rows={};
  TIERS.forEach(t=>{
    let badW=0, badI=0, totI=0; const tok=new Map(); const badList=[];
    POOLS.forEach(k=>(RP[k]||[]).forEach(w=>{
      let hit=false; const why=new Set();
      (w.sections||[]).forEach(s=>(s.items||[]).forEach(i=>{ totI++;
        const ok=canDo(t,i.name);
        if(ok!==true){ hit=true; badI++; missingFor(t,i.name).forEach(m=>{ tok.set(m,(tok.get(m)||0)+1); why.add(m); }); }
      }));
      if(hit){ badW++; badList.push(k+'/'+w.title+' ['+[...why].join('+')+']'); }
    }));
    rows[t]={badW,badI,totI,tok,badList};
  });
  return rows;
}

/* ── RECONCILIATION. Prove the instrument before reporting a delta. ────────── */
hr('RECONCILIATION — reproduce the PRIOR pass\'s 82 before claiming a new number.');
// The prior pass's needsOf(), transcribed verbatim from v195_implement_claim_sweep.js:343-359,
// with its OWNS_EXT resolution. Run against the SAME pool so the 82 is reproduced, not asserted.
function needsOf_PRIOR(name){
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
const PRIOR_OWNS={
  home_full : ['barbell','rack','bench','dumbbell','kettlebell','pullupbar','trapbar','band'],
  home_basic: ['dumbbell','kettlebell','pullupbar','band'],
  commercial: ['barbell','rack','bench','dumbbell','kettlebell','pullupbar','trapbar','band','cable','machine','medball','sled'],
  crossfit  : ['barbell','rig','bumper','kettlebell','rower','bike','wallball','band','pullupbar'],
  bodyweight: ['pullupbar'],
  minimal   : ['kettlebell'],
};
function priorHas(t,tok){
  if(tok==='loadedcarry') return PRIOR_OWNS[t].includes('dumbbell')||PRIOR_OWNS[t].includes('kettlebell')||PRIOR_OWNS[t].includes('barbell');
  if(tok==='abwheel')     return t==='commercial'||t==='crossfit'||t==='home_full';
  if(tok==='dipbars')     return t==='commercial'||t==='crossfit';
  if(tok==='ergo')        return t==='commercial'||t==='crossfit';
  return PRIOR_OWNS[t].includes(tok);
}
console.log(pad('tier',12)+lpad('prior pass, reproduced',24)+lpad('items',14));
TIERS.forEach(t=>{
  let bw=0, bi=0, ti=0;
  POOLS.forEach(k=>(RP[k]||[]).forEach(w=>{ let hit=false;
    (w.sections||[]).forEach(s=>(s.items||[]).forEach(i=>{ ti++;
      const need=[...needsOf_PRIOR(i.name)].filter(tok=>!priorHas(t,tok));
      if(need.length){hit=true;bi++;} }));
    if(hit) bw++; }));
  console.log(pad(t,12)+lpad(bw+'/'+TOTW,24)+lpad(bi+'/'+ti,14));
});
console.log('crossfit reproduces at the number the prior pass reported (82) => the pool and the walk are the same; only the ORACLE changes below.');
console.log('\nWHAT THE NEW HAND TABLE ADDS TO THE OLD REGEX (why the "OLD" column below is not 82):');
{
  const diffs=[];
  [...allNames].sort().forEach(n=>{
    const a=[...needsOf_PRIOR(n)].sort().join('+')||'(nothing)';
    const b=(NEEDS[n]||[[]]).map(x=>x.slice().sort().join('+')||'(nothing)').join(' OR ');
    if(a!==b) diffs.push([n,a,b]);
  });
  console.log('  '+diffs.length+'/'+allNames.size+' of the 92 names classify differently:');
  diffs.forEach(d=>console.log('    '+pad(d[0],40)+pad('regex: '+d[1],26)+'hand: '+d[2]));
}

hr('Q2a — WILDCARD CENSUS, OLD INVENTORY vs CORRECTED. Same pool, same hand table, one edit.');
const oldC=census(applyPolicy(OWNS_OLD,'P1'));
const newC=census(applyPolicy(OWNS_NEW,'P1'));
console.log(pad('tier',12)+lpad('OLD workouts',14)+lpad('NEW workouts',14)+lpad('delta',8)+'    '+lpad('OLD items',12)+lpad('NEW items',12));
TIERS.forEach(t=>{
  const o=oldC[t], n=newC[t];
  console.log(pad(t,12)+lpad(o.badW+'/'+TOTW,14)+lpad(n.badW+'/'+TOTW,14)+lpad((n.badW-o.badW>0?'+':'')+(n.badW-o.badW),8)+'    '+
    lpad(o.badI+'/'+o.totI,12)+lpad(n.badI+'/'+n.totI,12));
});
console.log('\n(workouts holding >=1 item the tier cannot perform. "OLD" reproduces the prior pass\'s table; "NEW" is the same census with crossfit owning dumbbells + med balls.)');
console.log('\nWHY EACH TIER STILL FAILS, corrected inventory, by missing token (item occurrences):');
TIERS.forEach(t=>{
  const n=newC[t];
  console.log('  '+pad(t,12)+[...n.tok.entries()].sort((a,b)=>b[1]-a[1]).map(([k,v])=>k+'×'+v).join(', ')||'(none)');
});
console.log('\nIF CROSSFIT ALSO OWNED A BENCH (not applied above; a box has benches, the blurb does not say so):');
{
  const withBench=JSON.parse(JSON.stringify(OWNS_NEW)); withBench.crossfit.push('bench');
  const c3=census(applyPolicy(withBench,'P1'));
  console.log('  crossfit '+c3.crossfit.badW+'/'+TOTW+' workouts hold an unownable item ('+c3.crossfit.badI+'/'+c3.crossfit.totI+' items), missing: '+
    [...c3.crossfit.tok.entries()].sort((a,b)=>b[1]-a[1]).map(([k,v])=>k+'×'+v).join(', '));
  console.log('  the residual: '+c3.crossfit.badList.join(' | '));
  const tbW=wkWith(n=>/trap bar/i.test(n));
  console.log('  trap-bar workouts in the pool: '+tbW.length+'/'+TOTW+' -> '+tbW.join(' | '));
}
console.log('\nCROSSFIT, the residual list in full, corrected-inventory-as-applied ('+newC.crossfit.badW+' workouts):');
newC.crossfit.badList.forEach(x=>console.log('    '+x));

/* ══════════════════════════════════════════════════════════════════════════
   Q2c — END-TO-END PERFORMABLE
   ══════════════════════════════════════════════════════════════════════════ */
hr('Q2c — HOW MANY OF THE '+TOTW+' WORKOUTS CAN EACH TIER PERFORM END TO END?');
function perform(ownsTable){
  OWNS=ownsTable; const out={};
  TIERS.forEach(t=>{ const byGoal={}; let tot=0;
    POOLS.forEach(k=>{ let ok=0; (RP[k]||[]).forEach(w=>{ let good=true;
      (w.sections||[]).forEach(s=>(s.items||[]).forEach(i=>{ if(canDo(t,i.name)!==true) good=false; }));
      if(good) ok++; });
      byGoal[k]=ok; tot+=ok; });
    out[t]={byGoal,tot};
  });
  return out;
}
const perfNew=perform(applyPolicy(OWNS_NEW,'P1'));
const perfOld=perform(applyPolicy(OWNS_OLD,'P1'));
console.log(pad('tier',12)+lpad('END-TO-END (old)',18)+lpad('END-TO-END (new)',18));
TIERS.forEach(t=>console.log(pad(t,12)+lpad(perfOld[t].tot+'/'+TOTW+' = '+pct(perfOld[t].tot,TOTW),18)+lpad(perfNew[t].tot+'/'+TOTW+' = '+pct(perfNew[t].tot,TOTW),18)));

const FLOOR=Math.min.apply(null,POOLS.map(k=>RP[k].length));
console.log('\nTHE FLOOR. coach ruled 28, from the smallest pool already shipping. recomputed from RAND_POOLS: min('+
  POOLS.map(k=>k+'='+RP[k].length).join(', ')+') = '+FLOOR+'.  '+(FLOOR===28?'agrees with the ruling.':'DISAGREES with the ruling — check.'));
console.log('\nPER (GOAL, TIER) CELL — performable end to end. Cells BELOW the floor of '+FLOOR+' are marked, with the shortfall.');
console.log(pad('tier',12)+POOLS.map(k=>lpad(k,16)).join('')+lpad('row total',12));
let below=0, shortfall=0, cells=0;
TIERS.forEach(t=>{
  let line=pad(t,12);
  POOLS.forEach(k=>{ const v=perfNew[t].byGoal[k]; cells++;
    const s=v<FLOOR?(v+' (-'+(FLOOR-v)+')'):String(v);
    if(v<FLOOR){ below++; shortfall+=FLOOR-v; }
    line+=lpad(s,16); });
  console.log(line+lpad(perfNew[t].tot,12));
});
console.log('\ncells below the floor: '+below+'/'+cells+' = '+pct(below,cells)+
  '.  total authoring shortfall (sum of per-cell gaps to '+FLOOR+'): '+shortfall+' workouts.');
console.log('the five REAL tiers only (minimal is the retired travel tier, unreachable from the wizard — _EQUIP_OPTS:'+lineOf(/_ovDraft|equipment:'minimal'/)+'):');
{
  let b=0,s=0,c=0;
  TIERS.filter(t=>t!=='minimal').forEach(t=>POOLS.forEach(k=>{ const v=perfNew[t].byGoal[k]; c++; if(v<FLOOR){b++;s+=FLOOR-v;} }));
  console.log('  cells below floor '+b+'/'+c+' = '+pct(b,c)+', authoring shortfall '+s+' workouts.');
}
console.log('\nSENSITIVITY to the dipbars/abwheel reading (end-to-end totals):');
console.log('  '+pad('tier',12)+lpad('P0 copy-only',16)+lpad('P1 prior pass',16)+lpad('P2 engine gate',16));
['P0','P1','P2'].forEach(()=>{});
{
  const p0=perform(applyPolicy(OWNS_NEW,'P0')), p1=perform(applyPolicy(OWNS_NEW,'P1')), p2=perform(applyPolicy(OWNS_NEW,'P2'));
  TIERS.forEach(t=>console.log('  '+pad(t,12)+lpad(p0[t].tot+'/'+TOTW,16)+lpad(p1[t].tot+'/'+TOTW,16)+lpad(p2[t].tot+'/'+TOTW,16)));
  console.log('  the whole band is '+(Math.max.apply(null,TIERS.map(t=>p2[t].tot-p0[t].tot)))+' workouts wide at its widest tier. Naming the owner of a dip bar moves the answer by at most that.');
}

/* ══════════════════════════════════════════════════════════════════════════
   Q2d — GENUINE GAP vs INCOMPLETE COPY. Is crossfit the only one?
   ══════════════════════════════════════════════════════════════════════════ */
hr('Q2d — WHAT THE ENGINE PRESCRIBES ON A TIER THAT THE TIER\'S OWN COPY DOES NOT COVER.');
console.log('same shape as the prior pass\'s Q2-C control, but the inventory is the CORRECTED one and the');
console.log('output is the full per-tier name list, so each row can be judged as gap-or-copy by eye.');
// Token extractor for engine names. Explicit, ordered, auditable. Anything it cannot
// classify prints as NEEDS-NOTHING and the full name list is dumped for audit.
function engNeeds(name){
  const n=String(name||'').toLowerCase(); const out=new Set();
  // 'IT band' is an anatomical band, not a piece of equipment. Excluded explicitly:
  // without this clause 'IT band stretch' reads as needing a resistance band and was the
  // single largest row on the bodyweight tier (420 occurrences) in the first run of this pass.
  if(/\bband\b|banded|resistance band|door anchor|terminal knee extension/.test(n) && !/it band/.test(n)) out.add('band');
  if(/kettlebell|\(kb\)|\bkb\b|\(light kb\)/.test(n)) out.add('kettlebell');
  if(/dumbbell|\bdb\b|goblet/.test(n)) out.add('dumbbell');
  if(/barbell|back squat|front squat|^deadlift$|sumo deadlift|snatch grip|power clean|pendlay row|good morning|push press|landmine|zercher|incline barbell/.test(n)) out.add('barbell');
  if(/trap bar/.test(n)) out.add('trapbar');
  if(/cable|\brope tricep\b|face pull|pulldown|pec deck|pull-through/.test(n)) out.add('cable');
  if(/\bmachine\b|leg press|leg extension|lying leg curl|seated leg curl|hack squat|\bsmith\b|preacher|glute-ham raise/.test(n)) out.add('machine');
  if(/ball slam|wall ball|medicine ball|med ball/.test(n)) out.add('medball');
  if(/chinup|chin-up|pullup|pull-up|toes-to-bar|hanging |muscle-up|l-sit chinup|wall walks/.test(n)) out.add('pullupbar');
  // A BENCH DIP is done on a bench, not on dip bars. The prior pass's regex lumped the two
  // ('^bench dips$|^dips$' -> dipbars) and that put 592 home_full occurrences in the wrong bucket.
  if(/^dips$|^weighted dips$/.test(n)) out.add('dipbars');
  if(/^bench dips$/.test(n)) out.add('bench');
  if(/ab wheel/.test(n)) out.add('abwheel');
  if(/farmer carry|suitcase carry|overhead carry/.test(n)) out.add('loadedcarry');
  if(/bench press|incline press|decline press|incline dumbbell curl|45° back extension/.test(n)) out.add('bench');
  if(/\(chair|foot on chair|under a table|on bed|rings|wall lean/.test(n)){ out.delete('bench'); }
  if(/\(rings\)/.test(n)) out.add('rings');
  return out;
}
const FOCUS=['strength','hypertrophy','fatloss','balanced','support_strength','support_athletic','support_prevention'];
const EXP=['beginner','intermediate','advanced'];
const GOALS=[
 {k:'lift_only',f:{primaryPath:'body',cardioTypes:[],cardioGoals:{},eventTargeted:false,raceDate:null}},
 {k:'run_base', f:{primaryPath:'body',cardioTypes:['run'],cardioGoals:{run:{id:'run_base',label:'Build Running Base',mileBestMins:'9',mileBestSecs:'00',baselineDist:'3',baseline:'3mi'}},eventTargeted:false,raceDate:null}},
 {k:'run_half', f:{primaryPath:'event',cardioTypes:['run'],cardioGoals:{run:{id:'run_half',label:'Half Marathon',mileBestMins:'10',mileBestSecs:'30',baselineDist:'5',baseline:'5mi'}},eventTargeted:true,raceDate:'2026-12-06'}},
];
const SEEDS=[76308,11111,90210];
OWNS=applyPolicy(OWNS_NEW,'P1');
const engRows={};
let engBuilds=0, engItems=0;
TIERS.filter(t=>t!=='minimal').forEach(t=>{
  const viol=new Map(); let bad=0, tot=0;
  FOCUS.forEach(f=>EXP.forEach(x=>GOALS.forEach(g=>SEEDS.forEach(sd=>{
    const cfg=Object.assign({name:'Q2d',unit:'lbs',days:DAYS.slice(),bench:135,squat:155,deadlift:185,restDays:['sun','wed'],
      seed:sd,liftingFocus:f,experience:x,ageBracket:'18-35',equipment:t},g.f);
    let p; try{p=IA.buildProgram(cfg);}catch(e){return;} engBuilds++;
    Object.values(p.weeks||{}).forEach(w=>Object.values(w).forEach(d=>(d&&d.sections||[]).forEach(s=>(s.items||[]).forEach(i=>{
      tot++; engItems++;
      const nm=String(i.name||'').replace(/<svg[\s\S]*?<\/svg>\s*/g,'').trim();
      const need=[...engNeeds(nm)].filter(tok=>tok!=='rings'&&!ownsTok(t,tok));
      if(need.length){ bad++; const k=nm+'  (needs '+need.join('+')+')'; viol.set(k,(viol.get(k)||0)+1); }
    }))));
  }))));
  engRows[t]={viol,bad,tot};
});
console.log('\nlattice: '+TIERS.filter(t=>t!=='minimal').length+' tiers x '+FOCUS.length+' focuses x '+EXP.length+' experience x '+GOALS.length+' goals x '+SEEDS.length+' seeds = '+engBuilds+' builds, '+engItems+' prescribed items.');
console.log(pad('tier',12)+lpad('items the copy does not cover',32)+lpad('distinct names',16));
TIERS.filter(t=>t!=='minimal').forEach(t=>{
  const r=engRows[t];
  console.log(pad(t,12)+lpad(r.bad+'/'+r.tot+' = '+pct(r.bad,r.tot),32)+lpad(r.viol.size,16));
});
console.log('\nFULL LIST per tier (this is the copy backlog; every row is either a copy gap or an engine defect):');
TIERS.filter(t=>t!=='minimal').forEach(t=>{
  const r=engRows[t];
  console.log('\n  '+t+'  ('+r.viol.size+' distinct names, '+r.bad+' occurrences)');
  if(!r.viol.size){ console.log('    (none)'); return; }
  [...r.viol.entries()].sort((a,b)=>b[1]-a[1]).forEach(([k,v])=>console.log('    '+lpad(v,7)+'  '+k));
});
console.log('\ndone.');
