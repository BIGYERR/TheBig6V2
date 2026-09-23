// v205_d7_pin_derivation.js — MEASURE, read-only. The D7 re-pin derivation.
// Question: g202_int_doctrine D7 pins SIX INT cards on the PRT TING cfg. On V205 the
// engine prints 11. What is the derived count, does it vary, what rep row should the
// grid assert, and does V204 really produce six?
//
// ORACLE — none of it read from the function under suspicion (getINTReps/intFromTable6):
//  * Table 6's INT column, typed here from doctrine/nsw_ptg_sealswcc_11pg.txt line 26
//    (the OCR stream "LSDCHIINTWeek...") and line 34's hand table: 4 4 5 5 6 6 7 7 8 8
//    9 9 then 10 from wk13. Guide A 259-263's ceiling of 8 applied over the top.
//  * the cutback CALENDAR (w%4==0, w!=tw, tw>=10) and the 0.6 factor: ruled and shipped
//    at V204, re-typed here.
//  * the taper window max(2, round(tw*0.12)) and the 0.55 quality factor: ruled V115/V116,
//    re-typed here.
//  * the INT-per-week count: the NSW weekly row is exactly one INT slot per week for
//    nDays>=4 (Table 5 / the app's own doctrine comment "exactly 1 INT + 1 CHI per week").
//    So cards = one per week that carries the slot. Weeks are counted from the program.
//
// Usage: node tests/measure/v205_d7_pin_derivation.js [artifact] [--json]
const path = require('path');
const { load, DAYS } = require(path.join(__dirname, '..', 'harness.js'));
const ART = process.argv[2] || path.join(__dirname, '..', '..', 'index.html');
const IA = load(ART);
console.log('== artifact ia-version ' + IA.version + ' (' + ART + ')');

// ── typed doctrine ───────────────────────────────────────────────────────────
const T6_RAW = [null,4,4,5,5,6,6,7,7,8,8,9,9,10,10,10,10,10,10,10,10,10,10,10,10,10,10];
const CEIL_A = 8;
const rawReps = w => Math.min(CEIL_A, T6_RAW[Math.max(1, Math.min(Math.round(w)||1, 26))]);
const isCut   = (w, tw) => tw >= 10 && w % 4 === 0 && w !== tw;
const taperWks= tw => Math.max(2, Math.round(tw * 0.12));
const handReps = (w, tw, evented) => {
  let r = isCut(w, tw) ? Math.max(3, Math.round(rawReps(w-1) * 0.6)) : rawReps(w);
  const tk = evented ? taperWks(tw) : 0;
  if(tk > 0 && w > tw - tk) r = Math.max(2, Math.round(r * 0.55));
  return r;
};

// ── the PRT TING cfg, byte-copied from g202_int_doctrine.js ──────────────────
const base = (o) => Object.assign({
  name:'PRT TING', primaryPath:'event', cardioTypes:['run'], eventTargeted:true,
  raceDate:'2026-10-19', liftingFocus:'support_prevention', experience:'intermediate',
  ageBracket:'18-35', equipment:'full_gym', unit:'lbs',
  restDays:['sun','wed'], days:['sun','mon','tue','wed','thu','fri','sat'],
  bench:185, squat:245, deadlift:315, seed:24865 }, o||{});
const paceGoal = (g, over) => base(Object.assign({ cardioGoals:{ run: Object.assign(
  { id:'run_pace_goal', label:'Hit a Pace / Time Goal', paceUnit:'mi', baselineDist:'3', baseline:'3mi' }, g) } }, over||{}));
const PINNED = paceGoal({ targetDist:'1.5', targetMins:'10', targetSecs:'30', targetTime:'10:30',
  mileBestMins:'8', mileBestSecs:'15', mileBestSrc:{kind:'entered'} });

function runSessions(prog){
  const out = []; const wks = prog.weeks || {};
  Object.keys(wks).sort((a,b)=>+a-+b).forEach(w => DAYS.forEach(d => {
    const day = wks[w][d]; if(!day) return; let c = day.cardio; if(!c) return;
    (Array.isArray(c)?c:[c]).forEach(s => { if(s && s.type === 'run')
      out.push({ w:+w, d, st:s.subtype||'', detail:s.detail||'', dose:s.dose||null }); });
  }));
  return out;
}
const isINT = r => /Interval \(INT\)/.test(r.st);
const isCHI = r => /\(CHI\)/.test(r.st);

// ── 1. the PRT TING week-by-week derivation ──────────────────────────────────
function table(cfg, label){
  const prog = IA.buildProgram(cfg);
  const tw = Object.keys(prog.weeks||{}).length;
  const rs = runSessions(prog);
  const evented = !!cfg.eventTargeted;
  console.log('\n-- ' + label + ' — ' + tw + ' weeks, ' + rs.length + ' run sessions, '
    + (rs.length/tw).toFixed(2) + ' run days/week');
  console.log('  wk | runs | INT? | CHI? | reps | HAND | tgt  | branch');
  let ints = 0, mism = [];
  for(let w=1; w<=tw; w++){
    const wr = rs.filter(r=>r.w===w);
    const i = wr.filter(isINT), c = wr.filter(isCHI);
    const tk = evented ? taperWks(tw) : 0;
    const branch = (isCut(w,tw)?'cutback ':'') + (tk>0 && w>tw-tk ? 'taper' : '') || 'build';
    const hand = handReps(w, tw, evented);
    const got = i.length ? (i[0].dose ? i[0].dose.reps : null) : null;
    if(i.length) ints++;
    if(i.length && got !== hand) mism.push('W'+w+' engine '+got+' hand '+hand);
    console.log('  ' + String(w).padStart(2) + ' |  ' + String(wr.length).padStart(3)
      + ' |  ' + (i.length? String(i.length):'-') + '   |  ' + (c.length? String(c.length):'-')
      + '   |  ' + String(got==null?'-':got).padStart(3) + ' | ' + String(hand).padStart(4)
      + ' | ' + String(i.length&&i[0].dose?i[0].dose.tgt:'-').padStart(4) + ' | ' + branch);
  }
  console.log('  INT cards: engine ' + ints + ' / hand-derived ' + tw + ' (one slot per week, NSW weekly row)');
  console.log('  rep row engine: [' + rs.filter(isINT).map(r=>r.dose?r.dose.reps:'?').join(',') + ']');
  console.log('  rep row HAND  : [' + Array.from({length:tw},(_,k)=>handReps(k+1,tw,evented)).join(',') + ']');
  console.log('  rep mismatches: ' + (mism.length ? mism.join('; ') : 'NONE'));
  console.log('  tgt row engine: [' + rs.filter(isINT).map(r=>r.dose?r.dose.tgt:'?').join(',') + ']');
  return { tw, ints, runsPerWk: rs.length/tw, mism, repRow: rs.filter(isINT).map(r=>r.dose?r.dose.reps:null),
           tgtRow: rs.filter(isINT).map(r=>r.dose?r.dose.tgt:null) };
}
const PIN = table(PINNED, 'PRT TING (the D7 cfg) seed 24865');

// ── 2. does the count vary? the sweep ────────────────────────────────────────
const GOALS = {
  run_pace_goal: { id:'run_pace_goal', label:'Hit a Pace / Time Goal', paceUnit:'mi', baselineDist:'3', baseline:'3mi',
                   targetDist:'1.5', targetMins:'10', targetSecs:'30', targetTime:'10:30' },
  run_mile_time: { id:'run_mile_time', label:'Mile Time', paceUnit:'mi', baselineDist:'1', baseline:'1mi',
                   targetDist:'1', targetMins:'6', targetSecs:'00', targetTime:'6:00' },
  run_15_under10:{ id:'run_15_under10', label:'1.5 Mile Under 10', paceUnit:'mi', baselineDist:'1.5', baseline:'1.5mi',
                   targetDist:'1.5', targetMins:'9', targetSecs:'45', targetTime:'9:45' },
  run_base:      { id:'run_base', label:'Build an Aerobic Base', paceUnit:'mi', baselineDist:'3', baseline:'3mi' }
};
const RESTS = [ ['sun','wed'], ['sun'], ['sun','wed','fri'], ['sun','tue','thu','sat'], ['sun','mon','wed','fri'] ];
const MILES = [['5','30'],['6','30'],['8','15'],['9','30'],['11','00'],['12','00']];
const SEEDS = [24865, 777, 31337];
const EXPS  = ['beginner','intermediate','advanced'];
const DATES = ['2026-10-19','2026-11-30','2027-01-25','2026-12-14'];

const rows = [];
let crashes = 0;
for(const gk of Object.keys(GOALS)) for(const rest of RESTS) for(const exp of EXPS)
  for(const [mm,ss] of MILES) for(const seed of SEEDS) for(const rd of DATES){
    const g = Object.assign({}, GOALS[gk], { mileBestMins:mm, mileBestSecs:ss, mileBestSrc:{kind:'entered'} });
    const cfg = base({ cardioGoals:{ run:g }, restDays:rest, experience:exp, seed, raceDate:rd });
    let prog; try { prog = IA.buildProgram(cfg); } catch(e){ crashes++; continue; }
    const tw = Object.keys(prog.weeks||{}).length;
    const rs = runSessions(prog);
    const ic = rs.filter(isINT).length;
    const maxRuns = Math.max(0, ...Array.from({length:tw},(_,k)=>rs.filter(r=>r.w===k+1).length));
    const hand = Array.from({length:tw},(_,k)=>handReps(k+1,tw,true));
    const eng  = rs.filter(isINT).map(r=>r.dose?r.dose.reps:null);
    rows.push({ goal:gk, rest:rest.length, exp, mm:mm+':'+ss, seed, rd, tw, ints:ic, runDays:maxRuns,
                full: ic === tw, repOK: ic===tw && JSON.stringify(eng)===JSON.stringify(hand), eng, hand });
  }
console.log('\n== SWEEP: ' + rows.length + ' builds, ' + crashes + ' crashes');
function seg(key){
  const m = {};
  rows.forEach(r => { const k = r[key]; (m[k] = m[k] || []).push(r); });
  Object.keys(m).sort().forEach(k => {
    const v = m[k]; const full = v.filter(r=>r.full).length;
    const counts = {}; v.forEach(r=>counts[r.ints+'/'+r.tw]=(counts[r.ints+'/'+r.tw]||0)+1);
    const top = Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,6).map(e=>e[0]+'x'+e[1]).join(' ');
    console.log('  ' + key + '=' + k + ': ' + full + '/' + v.length + ' weekly-INT; ints/tw ' + top);
  });
}
['goal','rest','exp'].forEach(seg);
const paceFam = rows.filter(r=>r.goal!=='run_base');
console.log('  pace family: ' + paceFam.filter(r=>r.full).length + '/' + paceFam.length + ' have INT every week');
const distr = {}; paceFam.forEach(r=>distr[r.ints]=(distr[r.ints]||0)+1);
console.log('  INT-count distribution (pace family): ' + JSON.stringify(distr));
const twd = {}; paceFam.forEach(r=>twd[r.tw]=(twd[r.tw]||0)+1);
console.log('  program-length distribution: ' + JSON.stringify(twd));
const byTw = {}; paceFam.forEach(r=>{ (byTw[r.tw]=byTw[r.tw]||new Set()).add(r.ints); });
console.log('  ints per length: ' + Object.keys(byTw).sort((a,b)=>a-b).map(k=>k+'wk->{'+[...byTw[k]].sort((a,b)=>a-b).join(',')+'}').join(' '));
const badRep = paceFam.filter(r=>r.full && !r.repOK);
console.log('  rep-row disagreements vs hand Table 6: ' + badRep.length + ' / ' + paceFam.filter(r=>r.full).length + ' weekly-INT builds');
if(badRep.length) console.log('   first: tw=' + badRep[0].tw + ' eng [' + badRep[0].eng + '] hand [' + badRep[0].hand + ']');
const notFull = paceFam.filter(r=>!r.full);
console.log('  non-weekly pace builds: ' + notFull.length + (notFull.length ? ' first: ' + JSON.stringify({goal:notFull[0].goal,rest:notFull[0].rest,tw:notFull[0].tw,ints:notFull[0].ints,runDays:notFull[0].runDays}) : ''));
const rd3 = paceFam.filter(r=>r.runDays<=3);
console.log('  builds capped at <=3 run days: ' + rd3.length + '; of those weekly-INT: ' + rd3.filter(r=>r.full).length);

// ── 4. the V204 side: is the six-card grid what V204 actually produces? ──────
// Hand derivation of SIX, independent of D7's literal: on V204 the pace family was not
// routed through the spaced chooser, the run week was capped at 3 days, and a 3-day week
// with protectInt hits the COMPRESSED quality slot — one slot, INT until the crossover,
// CHI after. The crossover is the ruled V115 rule max(3, ceil(tw*0.55)); an 11-week block
// crosses at week 7, so INT occupies weeks 1..6. SIX, and the sixth is the last one.
const CROSS = tw => Math.max(3, Math.ceil((tw||6) * 0.55));
console.log('\n== V204 side');
console.log('  hand: cross(11) = max(3, ceil(11*0.55)) = ' + CROSS(11) + ' -> INT weeks 1..' + (CROSS(11)-1) + ' = ' + (CROSS(11)-1) + ' cards');
console.log('  hand: cross(9) = ' + CROSS(9) + ' -> ' + (CROSS(9)-1) + ' cards; cross(6) = ' + CROSS(6) + ' -> ' + (CROSS(6)-1) + ' cards');
let V4 = null;
try {
  const IA4 = load('/tmp/v204.html');
  console.log('  loaded V204 artifact ia-version ' + IA4.version);
  const p4 = IA4.buildProgram(PINNED);
  const tw4 = Object.keys(p4.weeks||{}).length;
  const rs4 = []; const wks = p4.weeks||{};
  Object.keys(wks).sort((a,b)=>+a-+b).forEach(w => DAYS.forEach(d => {
    const day = wks[w][d]; if(!day) return; let c = day.cardio; if(!c) return;
    (Array.isArray(c)?c:[c]).forEach(s => { if(s && s.type==='run') rs4.push({w:+w,d,st:s.subtype||'',detail:s.detail||'',dose:s.dose||null}); });
  }));
  const i4 = rs4.filter(isINT);
  console.log('  V204 PRT TING: ' + tw4 + ' weeks, ' + rs4.length + ' run sessions, '
    + (rs4.length/tw4).toFixed(2) + ' run days/week');
  console.log('  V204 INT cards: ' + i4.length + ' at weeks [' + i4.map(r=>r.w).join(',') + ']');
  console.log('  V204 reps: [' + i4.map(r=>r.dose?r.dose.reps:'?').join(',') + ']  tgt: [' + i4.map(r=>r.dose?r.dose.tgt:'?').join(',') + ']');
  console.log('  V204 CHI weeks: [' + rs4.filter(isCHI).map(r=>r.w).join(',') + ']');
  V4 = { tw:tw4, ints:i4.length, reps:i4.map(r=>r.dose?r.dose.reps:null), tgt:i4.map(r=>r.dose?r.dose.tgt:null) };
  // 5. control: does any OTHER g202 row depend on the six-card count?
  // The rows that read rep counts are D3b (opens on 4, reaches the ceiling 8) and D9d
  // (the note's stated cap equals the engine's highest prescribed rep). Both are counted
  // here on BOTH artifacts over the gate's own lattice.
  const LATC = [];
  for(const [mm,ss] of MILES) for(const dist of ['1','1.5','3']) for(const seed of SEEDS)
    LATC.push(paceGoal({ targetDist:dist, targetMins:'10', targetSecs:'30', targetTime:'10:30',
      mileBestMins:mm, mileBestSecs:ss, mileBestSrc:{kind:'entered'} }, { seed }));
  LATC.push(paceGoal({ targetDist:'1.5', targetMins:'10', targetSecs:'30', targetTime:'10:30',
    mileBestMins:'6', mileBestSecs:'46', mileBestSrc:{kind:'entered'} }, { seed:76308 }));
  for(const [tag, eng] of [['V205', IA], ['V204', IA4]]){
    let blocks=0, top=0, max=0, opens4=0, cards=0, lens={};
    for(const cfg of LATC){
      let p; try { p=eng.buildProgram(cfg); } catch(e){ continue; }
      const wk=p.weeks||{}; const rr=[];
      Object.keys(wk).sort((a,b)=>+a-+b).forEach(w=>DAYS.forEach(d=>{
        const day=wk[w][d]; if(!day) return; let c=day.cardio; if(!c) return;
        (Array.isArray(c)?c:[c]).forEach(s=>{ if(s&&s.type==='run') rr.push({w:+w,st:s.subtype||'',dose:s.dose||null}); });
      }));
      const ic=rr.filter(isINT).filter(r=>r.dose&&r.dose.reps!=null);
      if(!ic.length) continue;
      blocks++; cards+=ic.length; lens[ic.length]=(lens[ic.length]||0)+1;
      if(ic[0].dose.reps===4) opens4++;
      const mx=Math.max(...ic.map(c=>c.dose.reps)); max=Math.max(max,mx);
      if(ic.some(c=>c.dose.reps===8)) top++;
    }
    console.log('  [' + tag + '] gate lattice: ' + blocks + ' blocks, ' + cards + ' INT cards; opens on 4: '
      + opens4 + '/' + blocks + '; blocks reaching 8: ' + top + '/' + blocks + '; highest rep ' + max
      + '; cards-per-block ' + JSON.stringify(lens));
  }
} catch(e){ console.log('  V204 MEASUREMENT FAILED: ' + e.message); }
