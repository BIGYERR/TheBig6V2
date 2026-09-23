// V205 / D127 measure — does pull or legs land on the long-run eve on the NSW pace family?
//
//   node tests/measure/v205_d127_eve.js <html>
//
// Lattice: every rest-day combination that yields 4,5,6 or 7 training days (35+21+7+1 = 64
// combos) x 9 seeds, run_pace_goal, intermediate, 1.5 mi under 10:00. The oracle is the
// D36 doctrine text, not the engine: the long-run day and its EVE are off limits to the
// hinge and the squat. The long-run day is found by content (a run session carrying
// legLoad whose subtype is LSD), never by position; the eve is calendar arithmetic.
const path = require('path');
const { load } = require(path.join(__dirname, '..', 'harness.js'));
const IA = load(process.argv[2] || 'index.html');
const ISO = IA._ISO_ORDER;
const DAYS = ['sun','mon','tue','wed','thu','fri','sat'];
const PULL = 'Posterior Chain', LEGS = 'Leg Strength + Mobility';

function combos(arr, k){
  if(k === 0) return [[]];
  if(arr.length < k) return [];
  const [h, ...t] = arr;
  return combos(t, k-1).map(c => [h, ...c]).concat(combos(t, k));
}
function paceCfg(rest, seed){
  return { name:'P', primaryPath:'goal', cardioTypes:['run'],
    cardioGoals:{ run:{ id:'run_pace_goal', label:'Pace', targetDist:'1.5', targetMins:'10',
      targetSecs:'0', mileBestMins:'8', mileBestSecs:'30', baselineDist:'3', baseline:'3mi' } },
    eventTargeted:false, liftingFocus:'support_prevention', experience:'intermediate',
    ageBracket:'18-35', equipment:'crossfit', unit:'lbs', restDays:rest, days:DAYS.slice(),
    bench:135, squat:155, deadlift:185, seed };
}
const SEEDS = [1001,2002,3003,4004,5005,6006,7007,8008,9009];

const byDays = {}; let weeks = 0, hits = 0;
const roleTally = { pull:0, legs:0 };
const examples = [];
[3,2,1,0].forEach(nRest => {
  combos(DAYS, nRest).forEach(rest => {
    const nTrain = 7 - nRest;
    byDays[nTrain] = byDays[nTrain] || { weeks:0, hits:0 };
    SEEDS.forEach(seed => {
      const prog = IA.buildProgram(paceCfg(rest, seed));
      Object.keys(prog.weeks).forEach(wk => {
        const w = prog.weeks[wk];
        let long = null;
        DAYS.forEach(d => {
          const day = w[d]; if(!day || !day.cardio) return;
          const cs = Array.isArray(day.cardio) ? day.cardio : [day.cardio];
          cs.forEach(c => { if(c.type === 'run' && c.legLoad && /^Long Slow Distance \(LSD\)/.test(c.subtype||'')) long = d; });
        });
        weeks++; byDays[nTrain].weeks++;
        if(!long) return;
        const eve = ISO[(ISO.indexOf(long) + 6) % 7];
        const t = (w[eve] && w[eve].title) || '';
        if(t === PULL || t === LEGS){
          hits++; byDays[nTrain].hits++;
          roleTally[t === PULL ? 'pull' : 'legs']++;
          if(examples.length < 6) examples.push(`  ${nTrain}d rest=[${rest.join(',')}] seed=${seed} W${wk} long=${long} eve=${eve} -> ${t}`);
        }
      });
    });
  });
});

console.log('EVE HITS (pull or legs on the long-run eve), run_pace_goal lattice');
[4,5,6,7].forEach(n => { const b = byDays[n]; console.log(`  ${n} training days: ${b.hits} / ${b.weeks} weeks`); });
console.log(`  TOTAL:           ${hits} / ${weeks} weeks`);
console.log(`  by role: pull ${roleTally.pull}  legs ${roleTally.legs}`);
if(examples.length){ console.log('EXAMPLES'); examples.forEach(e => console.log(e)); }

// Non-pace NSW goals must still take the 48h branch: the D36 note is the placement's
// signature, so its ABSENCE is the proof the shape stayed null for them.
const D36 = 'Your hinge day rides a speed session so hard days stay hard. Nothing heavy lands the day before your long run.';
console.log('48h BRANCH RETAINED (D36 note must be absent)');
[['run_base',{id:'run_base',label:'Base',baselineDist:'3',baseline:'3mi',mileBestMins:'8',mileBestSecs:'30'}]].forEach(([id,g]) => {
  let seen = 0, tot = 0;
  [3,2,1,0].forEach(nRest => combos(DAYS, nRest).forEach(rest => SEEDS.slice(0,3).forEach(seed => {
    const c = paceCfg(rest, seed); c.cardioGoals = { run:g };
    const p = IA.buildProgram(c); tot++;
    if(p.legRecoveryNote && p.legRecoveryNote.indexOf(D36) >= 0) seen++;
  })));
  console.log(`  ${id}: D36 note on ${seen} / ${tot} programs (expect 0)`);
});
// And the pace family DOES carry it (all three ids).
['run_pace_goal','run_mile_time','run_15_under10'].forEach(id => {
  const c = paceCfg(['sun','wed'], 1001);
  c.cardioGoals = { run:{ ...c.cardioGoals.run, id } };
  const p = IA.buildProgram(c);
  console.log(`  ${id}: D36 note ${p.legRecoveryNote && p.legRecoveryNote.indexOf(D36) >= 0 ? 'PRESENT' : 'ABSENT'}`);
});
// Mario's own config.
const m = paceCfg(['sun','wed'], 76308);
const mp = IA.buildProgram(m);
let mh = 0, mw = 0;
Object.keys(mp.weeks).forEach(wk => { const w = mp.weeks[wk]; let long = null;
  DAYS.forEach(d => { const day = w[d]; if(!day || !day.cardio) return;
    const cs = Array.isArray(day.cardio) ? day.cardio : [day.cardio];
    cs.forEach(c => { if(c.type==='run' && c.legLoad && /^Long Slow Distance \(LSD\)/.test(c.subtype||'')) long = d; }); });
  mw++; if(!long) return; const eve = ISO[(ISO.indexOf(long)+6)%7];
  const t = (w[eve] && w[eve].title) || ''; if(t===PULL || t===LEGS) mh++; });
console.log(`MARIO (5 days, rest sun+wed, seed 76308): ${mh} / ${mw} weeks with an eve hit`);
console.log('NOTE AS RENDERED: ' + JSON.stringify(mp.legRecoveryNote));
