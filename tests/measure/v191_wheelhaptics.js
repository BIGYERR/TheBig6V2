// Measure pass — V192 question: "haptic feedback on the V182 scroll wheels".
// MODE B, before-picture. Nothing is ruled here and nothing is edited.
//
//   node tests/measure/v192_wheelhaptics.js index.html [limitConfigs]
//
// WHAT IS COUNTED
//   Denominator 1: every day entry in prog.weeks across the lattice.
//   Denominator 2: every day the session sheet (openDetail -> buildLogHTML) can open on.
//                  index.html:9952 routes rest days to openRestSheet instead, and the rest
//                  sheet renders no wheel markup, so REST DAYS ARE NOT A LOG-FORM DENOMINATOR.
//   Numerator:     log forms whose cardio field renders >=1 `.iaw` wheel, by wheel kind.
//
// ORACLE INDEPENDENCE
//   * MEASURED   = the SHIPPED renderer. cardioFieldHTML(...) is called and the markup is
//                  scraped for `<div class="iaw" data-kind="K"`. That is literally what the
//                  athlete's DOM contains. The renderer is not asked "how many wheels?".
//   * EXPECTED   = a HAND TABLE transcribed from the authoring contract at
//                  index.html:11820-11864, keyed on the dose kind:
//                      sport!=='run'                      -> 0 wheels
//                      run + dose.k==='time'              -> 0   (two number inputs, 11837-38)
//                      run + dose.k==='dist'              -> 0   (two number inputs, 11843-44)
//                      run + dose.k==='reps_dist'         -> 1   ['rept']       (11848)
//                      run + dose.k==='reps_time'         -> 0   (one number input, 11853)
//                      run + no dose (generic form)       -> 2   ['dist','pace'] (11862-63)
//                  The dose OBJECT is an input to the table, not the thing measured; it comes
//                  from the engine's doseFromCardio (index.html:11560), which is the same
//                  value buildLogHTML feeds the renderer at index.html:11889.
//   MEASURED vs EXPECTED are compared per day. Any disagreement is reported as CONTRACT-DRIFT.
//
// Standing traps honoured: cfg.seed pinned on every config; every rate prints its
// denominator; a crash is reported as a FAILED MEASUREMENT, never as "no findings".

const path = require('path');
const { load, fixtures } = require(path.join(__dirname, '..', 'harness'));

// ── the hand table (see header) ─────────────────────────────────────────────
function expectedWheels(sport, dose){
  if(sport !== 'run') return [];
  if(!dose || !dose.k) return ['dist','pace'];
  if(dose.k === 'reps_dist') return ['rept'];
  return [];                       // time / dist / reps_time
}

// ── scrape the shipped markup ───────────────────────────────────────────────
function measuredWheels(html){
  const out = [];
  const re = /<div class="iaw" data-kind="([a-z]+)"/g;
  let m; while((m = re.exec(String(html || {})))) out.push(m[1]);
  return out;
}

// ── lattice: same shape as tests/measure/v190_rounds.js ─────────────────────
const FOCUSES = ['strength','hypertrophy','fatloss','balanced','support_strength','support_athletic','support_prevention'];
const EXPS    = ['beginner','intermediate','advanced'];
const EQUIPS  = ['home_full','home_basic','commercial','crossfit','bodyweight'];
const RESTS   = [['sun','wed'], ['sat','sun'], ['wed']];
const SEEDS   = [76308, 13337, 90210];

const GOALS = [
  { key:'body_only',     cfg:{ primaryPath:'body',  cardioTypes:[],       cardioGoals:{}, eventTargeted:false, raceDate:null } },
  { key:'run_5k',        cfg:{ primaryPath:'event', cardioTypes:['run'],  cardioGoals:{ run:{ id:'run_5k',    label:'5K',   mileBestMins:'8',  mileBestSecs:'30', baselineDist:'3', baseline:'3mi' } }, eventTargeted:true,  raceDate:'2026-12-06' } },
  { key:'run_10k',       cfg:{ primaryPath:'event', cardioTypes:['run'],  cardioGoals:{ run:{ id:'run_10k',   label:'10K',  mileBestMins:'9',  mileBestSecs:'00', baselineDist:'4', baseline:'4mi' } }, eventTargeted:true,  raceDate:'2026-12-06' } },
  { key:'run_half',      cfg:{ primaryPath:'event', cardioTypes:['run'],  cardioGoals:{ run:{ id:'run_half',  label:'Half', mileBestMins:'10', mileBestSecs:'30', baselineDist:'5', baseline:'5mi' } }, eventTargeted:true,  raceDate:'2026-12-06' } },
  { key:'run_marathon',  cfg:{ primaryPath:'event', cardioTypes:['run'],  cardioGoals:{ run:{ id:'run_marathon', label:'Full', mileBestMins:'10', mileBestSecs:'00', baselineDist:'8', baseline:'8mi' } }, eventTargeted:true, raceDate:'2027-03-07' } },
  { key:'run_pace_goal', cfg:{ primaryPath:'event', cardioTypes:['run'],  cardioGoals:{ run:{ id:'run_pace_goal', label:'Pace', mileBestMins:'10', mileBestSecs:'30', baselineDist:'3', baseline:'3mi', targetDist:'1.5', targetMins:'9', targetSecs:'30' } }, eventTargeted:false, raceDate:null } },
  { key:'run_base',      cfg:{ primaryPath:'event', cardioTypes:['run'],  cardioGoals:{ run:{ id:'run_base',  label:'Base', mileBestMins:'11', mileBestSecs:'00', baselineDist:'2', baseline:'2mi' } }, eventTargeted:false, raceDate:null } },
  { key:'bike_50',       cfg:{ primaryPath:'event', cardioTypes:['bike'], cardioGoals:{ bike:{ id:'bike_50',  label:'50 mile', baselineDist:'20', baseline:'20mi' } }, eventTargeted:false, raceDate:null } },
  { key:'bike_ftp',      cfg:{ primaryPath:'event', cardioTypes:['bike'], cardioGoals:{ bike:{ id:'bike_ftp', label:'FTP',     baselineDist:'25', baseline:'25mi' } }, eventTargeted:false, raceDate:null } },
  { key:'swim_mile',     cfg:{ primaryPath:'event', cardioTypes:['swim'], cardioGoals:{ swim:{ id:'swim_mile',label:'Swim mile', baseline:'800 yd' } }, eventTargeted:false, raceDate:null } },
];

function buildLattice(limit){
  const out = [];
  for(const g of GOALS) for(const focus of FOCUSES) for(const exp of EXPS)
    for(const equip of EQUIPS) for(let ri=0; ri<RESTS.length; ri++) for(const seed of SEEDS){
      out.push({
        key:[g.key,focus,exp,equip,'r'+ri,seed].join('/'),
        goal:g.key, focus, exp, equip, rest:'r'+ri, seed,
        cfg: Object.assign({}, fixtures.HALF_MANNY, g.cfg, {
          name:'MEASURE', liftingFocus:focus, experience:exp, equipment:equip,
          restDays:RESTS[ri].slice(), days:['sun','mon','tue','wed','thu','fri','sat'],
          ageBracket:'18-35', unit:'lbs', bench:135, squat:155, deadlift:185, seed,
        }),
      });
    }
  return limit ? out.slice(0, limit) : out;
}

function pct(n,d){ return d ? (100*n/d).toFixed(2)+'%' : 'n/a'; }
function row(l,n,d){ return '    '+String(l).padEnd(26)+String(n).padStart(8)+' / '+String(d).padEnd(8)+pct(n,d).padStart(8); }
function bump(map,k,f){ const r = map[k] || (map[k]={den:0,any:0,dist:0,pace:0,rept:0,run:0}); r[f]++; return r; }

const file  = process.argv[2] || 'index.html';
const limit = process.argv[3] ? +process.argv[3] : 0;

let IA;
try { IA = load(file); }
catch(e){ console.log('FAILED MEASUREMENT — harness load threw: '+e.message); process.exit(1); }

// Reach the two non-exported names. A throw here is a failed measurement, not a result.
let doseFromCardio, cardioFieldHTML;
try {
  doseFromCardio  = IA.eval('doseFromCardio');
  cardioFieldHTML = IA.eval('cardioFieldHTML');
  if(typeof doseFromCardio !== 'function' || typeof cardioFieldHTML !== 'function')
    throw new Error('symbol missing from the VM context');
} catch(e){ console.log('FAILED MEASUREMENT — cannot reach renderer: '+e.message); process.exit(1); }

// ── Part 0: detent geometry, straight off _IAW_SPEC arithmetic (not off _iawList) ──
const SPEC = IA.eval('JSON.parse(JSON.stringify(_IAW_SPEC))');
const REPS = IA.eval('_IAW_REPS');
const ROW  = IA.eval('_IAW_ROW');
console.log('=== WHEEL GEOMETRY (from _IAW_SPEC, arithmetic done here) ===');
console.log('  row height '+ROW+'px, wrap copies '+REPS);
Object.keys(SPEC).forEach(k => {
  const cols = SPEC[k].cols.map(c => {
    const distinct = (c.max-c.min+1) + (c.nil?1:0);
    const wraps = !c.nil;
    return { distinct, wraps, dom: wraps ? distinct*REPS : distinct };
  });
  const combos = cols.reduce((a,c)=>a*c.distinct,1);
  console.log('  '+k.padEnd(5)+' cap="'+SPEC[k].cap+'"  cols='+cols.length
    +'  detents/col=['+cols.map(c=>c.distinct+(c.wraps?'(wrap, '+c.dom+' DOM rows)':'')).join(', ')+']'
    +'  distinct values='+combos);
});
console.log('');

// ── Part 1: the sweep ───────────────────────────────────────────────────────
const lattice = buildLattice(limit);
const T = {
  builds:0, buildErr:0, renderErr:0,
  dayEntries:0, restDays:0, logForms:0,
  cardioNull:0, cardioArray:0, cardioRun:0, cardioBike:0, cardioSwim:0, cardioOther:0,
  formsWithWheel:0, wheelsTotal:0, kDist:0, kPace:0, kRept:0,
  doseNull:0, doseTime:0, doseDist:0, doseRepsDist:0, doseRepsTime:0,
  drift:0,
  swapToRunWheels:0, swapNonRunDays:0,
};
const byGoal={}, byFocus={}, byExp={}, byEquip={}, byWeek={}, bySubtype={};
const driftEx=[];

lattice.forEach(L => {
  let prog;
  try { prog = IA.buildProgram(L.cfg); }
  catch(e){ T.buildErr++; return; }
  T.builds++;
  const weeks = prog.weeks || {};
  Object.keys(weeks).forEach(wk => {
    const week = weeks[wk] || {};
    Object.keys(week).forEach(d => {
      const day = week[d]; if(!day) return;
      T.dayEntries++;
      if(day.rest){ T.restDays++; return; }          // index.html:9952 — never reaches buildLogHTML
      T.logForms++;

      const c = day.cardio;
      if(Array.isArray(c)) T.cardioArray++;
      const ct = ((c && !Array.isArray(c) && c.type) || '').toLowerCase();
      if(!c) T.cardioNull++;
      else if(ct==='run') T.cardioRun++;
      else if(ct==='bike') T.cardioBike++;
      else if(ct==='swim') T.cardioSwim++;
      else T.cardioOther++;

      const hasCardio = (ct==='run'||ct==='bike'||ct==='swim');   // index.html:11883
      const dose = hasCardio ? doseFromCardio(c) : null;          // index.html:11889
      const sub  = (c && c.subtype) || '';
      if(hasCardio){
        if(!dose||!dose.k) T.doseNull++;
        else if(dose.k==='time') T.doseTime++;
        else if(dose.k==='dist') T.doseDist++;
        else if(dose.k==='reps_dist') T.doseRepsDist++;
        else if(dose.k==='reps_time') T.doseRepsTime++;
      }

      let html='';
      if(hasCardio){
        try { html = cardioFieldHTML(ct, {}, dose, sub); }
        catch(e){ T.renderErr++; return; }
      }
      const got = measuredWheels(html);
      const exp = expectedWheels(hasCardio?ct:'', dose);
      if(got.join(',') !== exp.join(',')){
        T.drift++;
        if(driftEx.length<20) driftEx.push(L.key+' W'+wk+' '+d+' ct='+ct+' dose='+(dose?dose.k:'null')+' sub="'+sub+'" got=['+got+'] expected=['+exp+']');
      }

      const gk=L.goal, fk=L.focus, ek=L.exp, qk=L.equip, wkk='W'+String(wk).padStart(2,'0');
      [[byGoal,gk],[byFocus,fk],[byExp,ek],[byEquip,qk],[byWeek,wkk]].forEach(([m,k])=>bump(m,k,'den'));
      if(ct==='run') [[byGoal,gk],[byFocus,fk],[byExp,ek],[byEquip,qk],[byWeek,wkk]].forEach(([m,k])=>bump(m,k,'run'));

      if(got.length){
        T.formsWithWheel++; T.wheelsTotal += got.length;
        got.forEach(k => { if(k==='dist')T.kDist++; else if(k==='pace')T.kPace++; else if(k==='rept')T.kRept++; });
        [[byGoal,gk],[byFocus,fk],[byExp,ek],[byEquip,qk],[byWeek,wkk]].forEach(([m,k])=>bump(m,k,'any'));
        got.forEach(k => [[byGoal,gk],[byFocus,fk],[byExp,ek],[byEquip,qk],[byWeek,wkk]].forEach(([m,kk])=>bump(m,kk,k)));
        const sk = (ct==='run'? (sub||'(no subtype)') : ct);
        const r = bySubtype[sk] || (bySubtype[sk]={den:0,any:0,dist:0,pace:0,rept:0,run:0});
        r.any++; got.forEach(k=>r[k]++);
      }
      if(hasCardio){
        const sk = (ct==='run'? (sub||'(no subtype)') : ct);
        const r = bySubtype[sk] || (bySubtype[sk]={den:0,any:0,dist:0,pace:0,rept:0,run:0});
        r.den++;
      }

      // SECOND PATH: setCardioSwap(index.html:12731) re-renders with a null dose. A
      // bike/swim day swapped to run therefore gets the GENERIC run form = 2 wheels.
      if(hasCardio && ct!=='run'){
        T.swapNonRunDays++;
        let h2=''; try { h2 = cardioFieldHTML('run', {}, null, sub); } catch(e){}
        if(measuredWheels(h2).length) T.swapToRunWheels++;
      }
    });
  });
});

// ── report ──────────────────────────────────────────────────────────────────
console.log('=== LATTICE ===');
console.log('  file: '+file+'  (ia-version '+IA.version+')');
console.log('  '+lattice.length+' configs = '+GOALS.length+' goals x '+FOCUSES.length+' focuses x '+EXPS.length
  +' experience x '+EQUIPS.length+' equipment x '+RESTS.length+' rest patterns x '+SEEDS.length+' pinned seeds'
  + (limit?('  [LIMITED to '+limit+']'):''));
console.log('  builds OK '+T.builds+' / build errors '+T.buildErr+' / render errors '+T.renderErr);
console.log('');
console.log('=== DENOMINATORS ===');
console.log(row('day entries (incl. rest)', T.dayEntries, T.dayEntries));
console.log(row('rest days (no log form)', T.restDays, T.dayEntries));
console.log(row('LOG FORMS RENDERED', T.logForms, T.dayEntries));
console.log(row('  cardio: none (lift only)', T.cardioNull, T.logForms));
console.log(row('  cardio: run', T.cardioRun, T.logForms));
console.log(row('  cardio: bike', T.cardioBike, T.logForms));
console.log(row('  cardio: swim', T.cardioSwim, T.logForms));
console.log(row('  cardio: array (no field)', T.cardioArray, T.logForms));
console.log(row('  cardio: other/unknown', T.cardioOther, T.logForms));
console.log('');
console.log('=== HEADLINE: log forms that render at least one wheel ===');
console.log(row('forms with >=1 wheel', T.formsWithWheel, T.logForms));
console.log(row('  ... of RUN days only', T.formsWithWheel, T.cardioRun));
console.log('  wheel instances rendered: '+T.wheelsTotal+'  (dist '+T.kDist+', pace '+T.kPace+', rept '+T.kRept+')');
console.log(row('generic run form (2 wheels)', T.kDist, T.cardioRun));
console.log(row('reps_dist form (1 wheel)', T.kRept, T.cardioRun));
console.log('');
console.log('=== DOSE KIND on run days (input to the hand table) ===');
console.log(row('dose null -> generic form', T.doseNull, T.cardioRun+T.cardioBike+T.cardioSwim));
console.log(row("dose k='time'", T.doseTime, T.cardioRun+T.cardioBike+T.cardioSwim));
console.log(row("dose k='dist'", T.doseDist, T.cardioRun+T.cardioBike+T.cardioSwim));
console.log(row("dose k='reps_dist'", T.doseRepsDist, T.cardioRun+T.cardioBike+T.cardioSwim));
console.log(row("dose k='reps_time'", T.doseRepsTime, T.cardioRun+T.cardioBike+T.cardioSwim));
console.log('');
console.log('=== CONTRACT DRIFT (measured markup vs hand table) ===');
console.log(row('days where they disagree', T.drift, T.logForms));
driftEx.forEach(x=>console.log('    '+x));
console.log('');
console.log('=== SECOND RENDER PATH: setCardioSwap to run (index.html:12741) ===');
console.log(row('non-run cardio days', T.swapNonRunDays, T.logForms));
console.log(row('  ...that yield 2 wheels if swapped to run', T.swapToRunWheels, T.swapNonRunDays));
console.log('');

function seg(title, map, denKey){
  console.log('=== SEGMENT: '+title+' ===');
  console.log('    '+'key'.padEnd(26)+'formsWithWheel / logForms      rate   | runDays  dist  pace  rept');
  Object.keys(map).sort().forEach(k=>{
    const r=map[k];
    console.log('    '+String(k).padEnd(26)+String(r.any).padStart(8)+' / '+String(r.den).padEnd(8)
      +pct(r.any,r.den).padStart(8)+'   | '+String(r.run).padStart(7)+String(r.dist).padStart(6)
      +String(r.pace).padStart(6)+String(r.rept).padStart(6));
  });
  console.log('');
}
seg('by goal', byGoal);
seg('by lifting focus', byFocus);
seg('by experience', byExp);
seg('by equipment', byEquip);
seg('by program week', byWeek);

console.log('=== SEGMENT: run subtype (denominator = cardio days of that kind) ===');
console.log('    '+'subtype'.padEnd(42)+'withWheel / cardioDays      rate   |  dist  pace  rept');
Object.keys(bySubtype).sort((a,b)=>bySubtype[b].den-bySubtype[a].den).forEach(k=>{
  const r=bySubtype[k];
  console.log('    '+String(k).slice(0,40).padEnd(42)+String(r.any).padStart(8)+' / '+String(r.den).padEnd(8)
    +pct(r.any,r.den).padStart(8)+'   | '+String(r.dist).padStart(5)+String(r.pace).padStart(6)+String(r.rept).padStart(6));
});
console.log('');
console.log('DONE. builds='+T.builds+' logForms='+T.logForms+' wheelInstances='+T.wheelsTotal);
