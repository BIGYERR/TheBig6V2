// v205_d125_ceiling.js — measure pass for D125 (amended), the CEILING half (slice 6).
// Answers, at FULL ENGINE level (not source surgery):
//   A. the 64-calendar table: who gets four runs and who falls back to three, losers named
//   B. every fallback calendar produces a CLEAN three-run week, not a crowded four-run one
//   C. Mario's full 11-week grid with lift sections
//   D. the long-run eve hit count across the lattice at the NEW ceiling (must be 0)
//   E. NRC / run_base / bike / swim unmoved
// Classification is by CONTENT: INT and CHI by subtype, the long run as the LSD carrying
// legLoad, the easy run as the LSD that does not. HARD = {int, chi, long}, the same set
// the chooser scores, and a collision is two HARD runs on adjacent CALENDAR days read
// circularly — never by list position.
const path = require('path');
const { load, weekGrid } = require(path.join(__dirname, '..', 'harness.js'));
const IA = load(process.argv[2] || path.join(__dirname, '..', '..', 'index.html'));
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
// Read one week's run layout by content.
function runsOf(w){
  const out = [];
  DAYS.forEach(d => {
    const day = w[d]; if(!day || !day.cardio) return;
    const cs = Array.isArray(day.cardio) ? day.cardio : [day.cardio];
    cs.forEach(c => {
      if(c.type !== 'run') return;
      const s = String(c.subtype || '');
      let t = null;
      if(/Interval \(INT\)/.test(s)) t = 'int';
      else if(/Continuous High Intensity \(CHI\)/.test(s)) t = 'chi';
      else if(/Long Slow Distance \(LSD\)/.test(s)) t = c.legLoad ? 'long' : 'easy';
      else t = 'other:' + s;
      out.push({ day:d, t });
    });
  });
  return out;
}
const HARD = new Set(['int','chi','long']);
const cpos = d => ISO.indexOf(d);
const circ = (a,b) => { const r = Math.abs(cpos(a)-cpos(b)); return Math.min(r, 7-r); };
function collisionsOf(runs){
  const h = runs.filter(r => HARD.has(r.t)).map(r => r.day);
  let n = 0;
  for(let a=0;a<h.length;a++) for(let b=a+1;b<h.length;b++) if(circ(h[a],h[b]) === 1) n++;
  return n;
}
const SEEDS = [1001,2002,3003,4004,5005,6006,7007,8008,9009];

// ── A + B: the 64-calendar table ─────────────────────────────────────────────────────
console.log('== A. 64 REST-DAY CALENDARS, run_pace_goal, seed 1001, week 1 ==');
const byDays = {}; const four = [], three = [], dirty = [];
[3,2,1,0].forEach(nRest => {
  combos(DAYS, nRest).forEach(rest => {
    const nTrain = 7 - nRest;
    byDays[nTrain] = byDays[nTrain] || { four:0, three:0, tot:0 };
    const prog = IA.buildProgram(paceCfg(rest, 1001));
    const runs = runsOf(prog.weeks['1']);
    const coll = collisionsOf(runs);
    const label = `${nTrain}d rest=[${rest.join(',')||'none'}]`;
    const shape = runs.map(r => r.day + ':' + r.t).join(' ');
    byDays[nTrain].tot++;
    if(runs.length === 4){ byDays[nTrain].four++; four.push({label, coll, shape}); }
    else { byDays[nTrain].three++; three.push({label, coll, shape, n:runs.length}); }
    if(coll > 0) dirty.push({label, n:runs.length, coll, shape});
  });
});
[4,5,6,7].forEach(n => {
  const b = byDays[n];
  console.log(`  ${n} training days: FOUR runs ${b.four}/${b.tot}   fell back to THREE ${b.three}/${b.tot}`);
});
console.log(`  TOTAL: four ${four.length}/64   three ${three.length}/64`);
console.log('== THE FALLBACK CALENDARS (named) ==');
three.forEach(r => console.log(`  ${r.label}  runs=${r.n} coll=${r.coll}  ${r.shape}`));
console.log('== B. COLLISION-DIRTY WEEKS ANYWHERE IN THE 64 (expect none) ==');
if(!dirty.length) console.log('  none — every shipped week, four-run and three-run alike, has coll=0');
dirty.forEach(r => console.log(`  DIRTY ${r.label} runs=${r.n} coll=${r.coll}  ${r.shape}`));

// B2: the fallback calendars across every seed and every built week, not just week 1.
let fbWeeks = 0, fbFour = 0, fbDirty = 0;
three.forEach(r => {
  const rest = r.label.replace(/^\dd rest=\[|\]$/g,'').split(',').filter(x => x && x !== 'none');
  SEEDS.forEach(seed => {
    const prog = IA.buildProgram(paceCfg(rest, seed));
    Object.keys(prog.weeks).forEach(wk => {
      const runs = runsOf(prog.weeks[wk]);
      fbWeeks++;
      if(runs.length > 3) fbFour++;
      if(collisionsOf(runs) > 0) fbDirty++;
    });
  });
});
console.log(`  fallback calendars, all seeds x all weeks: ${fbWeeks} weeks | >3 runs ${fbFour} | coll>0 ${fbDirty}  (expect 0 and 0)`);

// ── C: Mario ─────────────────────────────────────────────────────────────────────────
const mprog = IA.buildProgram(paceCfg(['sun','wed'], 76308));
console.log(`\n== C. MARIO — rest sun+wed, 5 training days, seed 76308, ${Object.keys(mprog.weeks).length} weeks ==`);
console.log(weekGrid(mprog, { showRest:false }));

// ── D: the long-run eve across the lattice at the NEW ceiling ────────────────────────
console.log('\n== D. LONG-RUN EVE HITS (pull or legs the day before the long run) ==');
const eveBy = {}; let eveW = 0, eveH = 0; const eveEx = [];
[3,2,1,0].forEach(nRest => combos(DAYS, nRest).forEach(rest => {
  const nTrain = 7 - nRest;
  eveBy[nTrain] = eveBy[nTrain] || { w:0, h:0 };
  SEEDS.forEach(seed => {
    const prog = IA.buildProgram(paceCfg(rest, seed));
    Object.keys(prog.weeks).forEach(wk => {
      const w = prog.weeks[wk];
      const long = (runsOf(w).find(r => r.t === 'long') || {}).day || null;
      eveW++; eveBy[nTrain].w++;
      if(!long) return;
      const eve = ISO[(ISO.indexOf(long) + 6) % 7];
      const t = (w[eve] && w[eve].title) || '';
      if(t === PULL || t === LEGS){
        eveH++; eveBy[nTrain].h++;
        if(eveEx.length < 6) eveEx.push(`  ${nTrain}d rest=[${rest.join(',')}] seed=${seed} W${wk} long=${long} eve=${eve} -> ${t}`);
      }
    });
  });
}));
[4,5,6,7].forEach(n => console.log(`  ${n} training days: ${eveBy[n].h} / ${eveBy[n].w} weeks`));
console.log(`  TOTAL: ${eveH} / ${eveW} weeks  (expect 0)`);
eveEx.forEach(e => console.log(e));

// ── E: everything the ruling does not touch ──────────────────────────────────────────
console.log('\n== E. UNTOUCHED PATHS: run count per week, week 1, rest sun+wed ==');
const OTHER = [
  ['run_base',    { id:'run_base', label:'Base', baselineDist:'3', baseline:'3mi', mileBestMins:'8', mileBestSecs:'30' }],
  ['run_half',    { id:'run_half', label:'Half', baselineDist:'5', baseline:'5mi', mileBestMins:'10', mileBestSecs:'30' }],
  ['run_5k',      { id:'run_5k', label:'5K', baselineDist:'3', baseline:'3mi', mileBestMins:'8', mileBestSecs:'30' }],
];
OTHER.forEach(([id, g]) => {
  const c = paceCfg(['sun','wed'], 1001); c.cardioGoals = { run:g };
  if(id !== 'run_base'){ c.primaryPath = 'event'; c.eventTargeted = true; c.raceDate = '2026-12-06'; }
  const p = IA.buildProgram(c);
  console.log(`  ${id}: ${runsOf(p.weeks['1']).length} runs  ${runsOf(p.weeks['1']).map(r=>r.day+':'+r.t).join(' ')}`);
});
['bike','swim'].forEach(sp => {
  const c = paceCfg(['sun','wed'], 1001);
  c.cardioTypes = [sp];
  c.cardioGoals = { [sp]: { id: sp + '_base', label:'Base', baselineDist:'3', baseline:'3mi' } };
  const p = IA.buildProgram(c);
  let n = 0;
  DAYS.forEach(d => { const day = p.weeks['1'][d]; if(!day || !day.cardio) return;
    const cs = Array.isArray(day.cardio) ? day.cardio : [day.cardio];
    cs.forEach(x => { if(x.type === sp) n++; }); });
  console.log(`  ${sp}_base: ${n} sessions`);
});
// Multi-sport pace + bike: no chooser runs there, so the ruling's fallback holds at 3.
const ms = paceCfg(['sun','wed'], 1001);
ms.cardioTypes = ['run','bike'];
ms.cardioGoals = { run: ms.cardioGoals.run, bike:{ id:'bike_base', label:'Base', baselineDist:'10', baseline:'10mi' } };
const msp = IA.buildProgram(ms);
console.log(`  MULTI-SPORT pace+bike: ${runsOf(msp.weeks['1']).length} runs (ruling's fallback: no chooser, so 3)`);
