// v205_d130_task3_multisport.js — TASK 3 (slice 7b): after D130 no SINGLE-SPORT pace
// program falls back to three runs. Is getSessionTypes' THREE-DAY row still reached on
// the pace family at all, and by whom? Built evidence, not source reading: multi-sport
// pace (run+bike, run+swim) across every rest-day calendar, run days counted BY CONTENT.
const path = require('path');
const { load } = require(path.join(__dirname, '..', 'harness.js'));
const ART = process.argv[2] || path.join(__dirname, '..', '..', 'index.html');
const IA = load(ART);
const DAYS = ['sun','mon','tue','wed','thu','fri','sat'];
function combos(a,k){ if(k===0) return [[]]; if(a.length<k) return []; const [h,...t]=a; return combos(t,k-1).map(c=>[h,...c]).concat(combos(t,k)); }
function cfgFor(rest, seed, extra){
  const g = { run:{ id:'run_pace_goal', label:'Pace', targetDist:'1.5', targetMins:'10', targetSecs:'0',
    mileBestMins:'8', mileBestSecs:'30', baselineDist:'3', baseline:'3mi' } };
  if(extra === 'bike') g.bike = { id:'bike_base', label:'Base', baselineDist:'10', baseline:'10mi' };
  if(extra === 'swim') g.swim = { id:'swim_base', label:'Base', baselineDist:'1000', baseline:'1000m' };
  return { name:'P', primaryPath:'goal', cardioTypes: extra ? ['run', extra] : ['run'],
    cardioGoals:g, eventTargeted:false, liftingFocus:'support_prevention', experience:'intermediate',
    ageBracket:'18-35', equipment:'crossfit', unit:'lbs', restDays:rest, days:DAYS.slice(),
    bench:135, squat:155, deadlift:185, seed };
}
function runLayout(w){
  const out = {};
  DAYS.forEach(d => { const c = w[d] && w[d].cardio; if(!c) return;
    (Array.isArray(c)?c:[c]).forEach(s => { if(s.type!=='run') return; const st = String(s.subtype||'');
      if(/^Interval/.test(st)) out[d]='int'; else if(/^Continuous High Intensity/.test(st)) out[d]='chi';
      else if(/^Long Slow Distance/.test(st)) out[d] = s.legLoad ? 'lsd_long' : 'lsd_easy'; else out[d]='other'; }); });
  return out;
}
['solo','bike','swim'].forEach(mode => {
  const extra = mode === 'solo' ? null : mode;
  const hist = {}; const three = []; let cal = 0;
  [3,2,1,0].forEach(nRest => combos(DAYS,nRest).forEach(rest => {
    cal++;
    const lay = runLayout(IA.buildProgram(cfgFor(rest, 1001, extra)).weeks['1']);
    const days = DAYS.filter(d=>lay[d]);
    hist[days.length] = (hist[days.length]||0)+1;
    if(days.length === 3) three.push((rest.join('+')||'none') + ' -> ' + days.map(d=>d+':'+lay[d]).join(' '));
  }));
  console.log('\n=== pace ' + (extra ? '+ ' + extra : 'SOLO') + ' : ' + cal + ' rest-day calendars, week 1 run-day histogram ===');
  Object.keys(hist).sort().forEach(k => console.log('   ' + k + ' runs: ' + hist[k] + ' calendars'));
  console.log('   three-run calendars: ' + three.length);
  three.slice(0,8).forEach(s => console.log('     ' + s));
});
// The two programs the task names, printed whole (week 1) for the record.
[['bike',['sun','wed']], ['swim',['sun','wed']]].forEach(([extra, rest]) => {
  const prog = IA.buildProgram(cfgFor(rest, 1001, extra));
  console.log('\n=== BUILT: pace + ' + extra + ', rest ' + rest.join('+') + ', seed 1001, week 1 ===');
  DAYS.forEach(d => { const w = prog.weeks['1'][d]; if(!w) return;
    const cs = w.cardio ? (Array.isArray(w.cardio)?w.cardio:[w.cardio]) : [];
    console.log('  ' + d.toUpperCase() + (w.rest?' REST':'') + ' | ' + (w.title||'-') + ' | ' +
      (cs.map(c=>c.type+':'+String(c.subtype||'?').replace(/\s*\(.*/,'')+(c.legLoad?'[legLoad]':'')).join(' + ')||'no cardio'));
  });
});
