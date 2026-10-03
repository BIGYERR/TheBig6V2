// v228_hip_volume.js — MEASURE (before-picture), base V228 (HEAD 2c1a89c).
//   node tests/measure/v228_hip_volume.js <v228.html> [--names]
// Question (Mario): "how much hip work do workouts get? ... i dont think i have been assigned to do hip thrusts".
// ORACLE: a hand name table (CLASS below), written from exercise-science categories, never _pattern().
// Classes: 1 glute-dominant hip extension, 2 hinge, 3 frontal/rotational hip, 4 hip mobility (not loading).
'use strict';
const path = require('path');
const { load, DAYS } = require(path.join(__dirname, '..', 'harness.js'));
const argv = process.argv.slice(2);
const IA = load(argv[0]);
const NAMES = argv.includes('--names');
console.log('ia-version', IA.version);
const clean = n => String(n == null ? '' : n).replace(/<svg[\s\S]*?<\/svg>\s*/g, '').replace(/<[^>]+>/g, '').trim();
// ── hand classifier (order matters: mobility first, then 1, 3, 2) ──
const C4 = /stretch|90\/90 hip switch(?!.*weighted)|hip flexor|pigeon|worlds? greatest|frog stretch|hip circles|leg swings|hip opener|couch|lunge stretch|cossack.*(mobility)|hip cars/i;
const C1 = /hip thrust|glute bridge|frog pump|pull-?through|glute kickback|reverse hyper|hip extension machine/i;
const C3 = /clamshell|band(ed)? (side|lateral|monster)|monster walk|side steps|copenhagen|abduction|adduction|adductor|abductor|lateral lunge|side lunge|cossack|weighted 90\/90|hip airplane|fire hydrant|side.?lying (leg|hip)|lateral band|curtsy/i;
const C2 = /deadlift|\brdl\b|good morning|swing|back extension|glute-ham|\bghr\b|ghd|hip hinge|kettlebell clean|power clean|hang clean|snatch|nordic/i;
// Nordic / GHR are knee-flexion eccentric hamstring work; recorded as class 2 here but also split out (NORDIC_GHR) so a reader can move them.
const NORDIC = /nordic|glute-ham|\bghr\b/i;
const C5 = /hip flexion|hip flexor (march|raise|lift)|psoas march/i;
const NOTE = /^(Taper|Race week)\b/;
function cls(nm){ if(/weighted 90\/90/i.test(nm)) return 3; if(C5.test(nm)) return 5; if(C4.test(nm)) return 4; if(C1.test(nm)) return 1; if(C3.test(nm)) return 3; if(C2.test(nm)) return 2; return 0; }
function setsOf(it, sec){
  const d = clean(it.detail || it.rx || '');
  const m = d.match(/^(\d+)\s*[×x]/); if(m) return +m[1];
  const r = String(sec.rounds || '').match(/^(\d+)/); if(sec.superset && r) return +r[1];
  const m2 = d.match(/(\d+)\s*(sets|rounds)/i); if(m2) return +m2[1];
  return 1;
}
function liveSecs(day){ return (day && !day.rest && day.sections || []).filter(s => (s.items || []).length); }
function scan(prog){
  const weeks = {}, unk = {};
  Object.keys(prog.weeks).sort((a,b)=>a-b).forEach(w => {
    const W = { items:0, sets:0, c:{1:[0,0],2:[0,0],3:[0,0],4:[0,0],5:[0,0]}, list:{1:[],2:[],3:[],4:[],5:[]}, nordic:[0,0] };
    DAYS.forEach(d => liveSecs(prog.weeks[w][d]).forEach(s => s.items.forEach(it => {
      const nm = clean(it.name); if(!nm || NOTE.test(nm)) return; const k = cls(nm), st = setsOf(it, s);
      const lab = String(s.label || s.coreHeader || '');
      if(k === 4){ W.c[4][0]++; W.c[4][1] += st; W.list[4].push(d + ' ' + nm); return; }
      W.items++; W.sets += st;
      if(k){ W.c[k][0]++; W.c[k][1] += st; W.list[k].push(d + ' [' + lab.slice(0,24) + '] ' + nm + ' ' + clean(it.detail||'').slice(0,18)); if(NORDIC.test(nm)){ W.nordic[0]++; W.nordic[1]+=st; } }
      else unk[nm] = (unk[nm] || 0) + 1;
    })));
    weeks[w] = W;
  });
  return { weeks, unk };
}
const DAYMS = 86400000;
function mondayOf(iso){ const d = new Date(iso + 'T00:00:00'); const o = (d.getDay() + 6) % 7; return new Date(d - o * DAYMS); }
const TODAY = '2026-10-03';
function weekToday(prog, cfg){ if(cfg && cfg.raceDate){ const n = Object.keys(prog.weeks).length; const st = new Date(mondayOf(cfg.raceDate) - (n - 1) * 7 * DAYMS); prog.__start = st.getFullYear() + '-' + String(st.getMonth()+1).padStart(2,'0') + '-' + String(st.getDate()).padStart(2,'0'); return Math.floor(Math.round((mondayOf(TODAY) - st) / DAYMS) / 7) + 1; } if(!prog.startDate) return null; return Math.floor((new Date(TODAY + 'T00:00:00') - mondayOf(prog.startDate)) / DAYMS / 7) + 1; }
const base = { primaryPath:'event', cardioTypes:['run'], eventTargeted:true, experience:'intermediate', ageBracket:'18-35', equipment:'crossfit', unit:'lbs',
  restDays:['sun','wed'], days:DAYS.slice(), bench:135, squat:155, deadlift:185 };
const PRT = Object.assign({}, base, { name:'PRT TING', liftingFocus:'support_athletic', raceDate:'2026-10-20', seed:87747,
  cardioGoals:{ run:{ id:'run_pace_goal', label:'Hit a Pace / Time Goal', mileBestMins:'8', mileBestSecs:'0', baselineDist:'3', baseline:'3mi', targetDist:'1.5', targetMins:'10', targetSecs:'30' } } });
const MANNY = Object.assign({}, base, { name:'THE HALF MANNY', liftingFocus:'support_prevention', raceDate:'2026-12-06', seed:76308,
  cardioGoals:{ run:{ id:'run_half', label:'Half Marathon', mileBestMins:'8', mileBestSecs:'0', baselineDist:'5', baseline:'5mi' } } });
const FIX = IA.fixtures.HALF_MANNY;
function sig(p){ const o = []; Object.keys(p.weeks).forEach(w => DAYS.forEach(d => liveSecs(p.weeks[w][d]).forEach(s => s.items.forEach(it => o.push(w+d+clean(it.name)+'|'+clean(it.detail)))))); return o.join('\n'); }
function report(tag, cfg){
  const p = IA.buildProgram(JSON.parse(JSON.stringify(cfg)));
  const p2 = IA.buildProgram(JSON.parse(JSON.stringify(cfg)));
  const R = scan(p), tw = weekToday(p, cfg);
  console.log('\n==== ' + tag + ' | goal=' + p.goal + ' focus=' + cfg.liftingFocus + ' run=' + cfg.cardioGoals.run.id + ' seed=' + cfg.seed + ' | start (race week = last week, date arithmetic)=' + p.__start + ' (engine prog.startDate=' + p.startDate + ')' + ' totalWeeks=' + (p.totalWeeks || Object.keys(p.weeks).length) + ' | today ' + TODAY + ' = week ' + tw + ' | self-identical ' + (sig(p) === sig(p2)));
  console.log(' wk  lived  items sets | C1 glute-ext it/sets | C2 hinge it/sets (nordic/ghr) | C3 frontal it/sets | C4 mobility it/sets');
  const T = { items:0, sets:0, c:{1:[0,0],2:[0,0],3:[0,0],4:[0,0],5:[0,0]}, nordic:[0,0] };
  Object.keys(R.weeks).forEach(w => { const W = R.weeks[w];
    const mark = tw == null ? '' : (+w < tw ? 'lived' : +w === tw ? 'TODAY' : '');
    console.log(' W' + String(w).padEnd(3) + mark.padEnd(6) + String(W.items).padStart(5) + String(W.sets).padStart(5) + ' | ' + W.c[1].join('/').padEnd(19) + ' | ' + (W.c[2].join('/') + ' (' + W.nordic.join('/') + ')').padEnd(29) + ' | ' + W.c[3].join('/').padEnd(17) + ' | ' + W.c[4].join('/') + ' | C5 flexor ' + W.c[5].join('/'));
    T.items += W.items; T.sets += W.sets; [1,2,3,4,5].forEach(k => { T.c[k][0] += W.c[k][0]; T.c[k][1] += W.c[k][1]; }); T.nordic[0]+=W.nordic[0]; T.nordic[1]+=W.nordic[1]; });
  const pc = (a, b) => (100 * a / b).toFixed(1) + '%';
  console.log(' TOTAL lift items ' + T.items + ' sets ' + T.sets + ' | C1 ' + T.c[1][0] + ' items (' + pc(T.c[1][0], T.items) + ') ' + T.c[1][1] + ' sets (' + pc(T.c[1][1], T.sets) + ') | C2 ' + T.c[2][0] + '/' + T.c[2][1] + ' (' + pc(T.c[2][1], T.sets) + ' of sets; nordic/ghr ' + T.nordic.join('/') + ') | C3 ' + T.c[3][0] + '/' + T.c[3][1] + ' (' + pc(T.c[3][1], T.sets) + ') | C4 mobility ' + T.c[4][0] + '/' + T.c[4][1] + ' | C5 hip-flexor strength ' + T.c[5][0] + '/' + T.c[5][1]);
  console.log(' -- item lists by week --');
  Object.keys(R.weeks).forEach(w => { const W = R.weeks[w]; [1,2,3,4,5].forEach(k => { if(W.list[k].length) console.log('  W' + w + ' C' + k + ': ' + W.list[k].join(' ; ')); }); });
  if(NAMES) console.log(' -- unclassified names --\n  ' + Object.entries(R.unk).sort((a,b)=>b[1]-a[1]).map(e => e[1] + ' ' + e[0]).join('\n  '));
  return p;
}
const pP = report('PRT TING', PRT);
const pM = report('THE HALF MANNY (pasted)', MANNY);
const pF = report('HALF_MANNY fixture (harness)', FIX);
console.log('\nfixture vs pasted: fixture mile ' + FIX.cardioGoals.run.mileBestMins + ':' + FIX.cardioGoals.run.mileBestSecs + ' baseline ' + FIX.cardioGoals.run.baseline + ' vs pasted 8:00; lift-item sequences equal: ' + (sig(pM) === sig(pF)));
// weekday title map for the two live programs
[['PRT', pP], ['MANNY', pM]].forEach(([t, p]) => { console.log('\n' + t + ' day titles W1: ' + ['mon','tue','wed','thu','fri','sat','sun'].map(d => { const x = p.weeks[1][d]; return d + '=' + (x ? (x.rest ? 'rest' : (x.title || '')) : '-') + (x && x.cardio ? '{' + [].concat(x.cardio).map(c => c.subtype || c.type).join('+') + '}' : ''); }).join(' | ')); });
// ── C. day-type trace: which days carry a Leg superset B and what is in it ──
[['PRT', pP], ['MANNY', pM]].forEach(([t, p]) => {
  const ls = {}, legDays = {};
  Object.keys(p.weeks).forEach(w => DAYS.forEach(d => { const day = p.weeks[w][d]; if(!day || day.rest) return;
    const labs = liveSecs(day).map(s => s.label || s.coreHeader || '');
    if(/leg|lower/i.test(day.title || '')) legDays['W' + w + ' ' + d + ' ' + day.title] = labs.join(' | ');
    liveSecs(day).forEach(s => { if(/Leg superset B|Hip extension/i.test(s.label || '')) ls['W' + w + ' ' + d] = s.items.map(i => clean(i.name)).join(' + '); }); }));
  console.log('\n' + t + ' Leg superset B / Hip extension sections: ' + Object.keys(ls).length); Object.entries(ls).forEach(e => console.log('   ' + e[0] + ': ' + e[1]));
  console.log(t + ' lower-titled days: ' + Object.keys(legDays).length); Object.entries(legDays).slice(0, 40).forEach(e => console.log('   ' + e[0] + ' :: ' + e[1]));
});
// ── D. lattice ──
const FOC = ['hypertrophy','strength','fatloss','balanced','support_strength','support_athletic','support_prevention'];
const FAM = { race:[['run_5k',{}],['run_10k',{}],['run_half',{}],['run_marathon',{}]], test:[['run_pace_goal',{targetDist:'1.5',targetMins:'10',targetSecs:'30'}],['run_base',{}]], none:[[null,{}]] };
const TIERS = ['commercial','crossfit','home_full','home_basic','minimal','bodyweight'];
const EXPS = ['beginner','intermediate','advanced'], SEEDS = [87747, 76308, 1234, 4242];
const RESTS = [['sun','wed'],['sat','sun']];
const L = {}; let N = 0, crash = 0; const crashEx = [];
const glob1 = {};
for(const f of FOC) for(const fam of Object.keys(FAM)) for(const eq of TIERS) for(let ei = 0; ei < 3; ei++) for(let si = 0; si < SEEDS.length; si++) for(let ri = 0; ri < 2; ri++){
  const g = FAM[fam][(si + ei) % FAM[fam].length];
  const c = { name:'M', primaryPath: /^support_/.test(f) ? 'event' : 'goal', cardioTypes: g[0] ? ['run'] : [], cardioGoals: g[0] ? { run: Object.assign({ id:g[0], label:g[0], mileBestMins:'8', mileBestSecs:'0', baselineDist:'3', baseline:'3mi' }, g[1]) } : {},
    eventTargeted:false, liftingFocus:f, experience:EXPS[ei], ageBracket:'18-35', equipment:eq, unit:'lbs', restDays:RESTS[ri].slice(), days:DAYS.slice(), bench:135, squat:155, deadlift:185, seed:SEEDS[si] };
  let p; try { p = IA.buildProgram(c); } catch(e){ crash++; if(crashEx.length < 3) crashEx.push(f+' '+fam+' '+eq+' '+e.message); continue; }
  N++;
  const R = scan(p); const nw = Object.keys(R.weeks).length;
  let c1 = 0, c1s = 0, c2s = 0, c3s = 0, sets = 0;
  Object.values(R.weeks).forEach(W => { c1 += W.c[1][0]; c1s += W.c[1][1]; c2s += W.c[2][1]; c3s += W.c[3][1]; sets += W.sets; W.list[1].forEach(x => { const nm = x.replace(/^\w+ \[[^\]]*\] /, '').replace(/ \d.*$/, ''); glob1[nm] = (glob1[nm]||0)+1; }); });
  for(const key of [f + ' | ' + fam + ' | ' + eq, 'FOCUS ' + f, 'FAM ' + fam, 'TIER ' + eq, 'EXP ' + EXPS[ei], 'ALL']){
    const o = L[key] = L[key] || { n:0, hit:0, c1sPerWk:0, c2sPerWk:0, c3sPerWk:0, setsPerWk:0 };
    o.n++; if(c1) o.hit++; o.c1sPerWk += c1s / nw; o.c2sPerWk += c2s / nw; o.c3sPerWk += c3s / nw; o.setsPerWk += sets / nw;
  }
}
console.log('\n==== D. LATTICE ' + N + ' builds (' + FOC.length + ' foci x 3 families x ' + TIERS.length + ' tiers x 3 exp x ' + SEEDS.length + ' seeds x 2 rests), crash ' + crash + ' ' + crashEx.join(' ; '));
const row = (k, o) => '  ' + k.padEnd(46) + ' builds>=1 C1 ' + (o.hit + '/' + o.n).padEnd(8) + ' meanC1 sets/wk ' + (o.c1sPerWk / o.n).toFixed(2).padStart(5) + ' | C2 ' + (o.c2sPerWk / o.n).toFixed(2).padStart(5) + ' | C3 ' + (o.c3sPerWk / o.n).toFixed(2).padStart(5) + ' | lift sets/wk ' + (o.setsPerWk / o.n).toFixed(1);
['ALL'].concat(Object.keys(L).filter(k => /^(FOCUS|FAM|TIER|EXP) /.test(k))).forEach(k => console.log(row(k, L[k])));
console.log(' -- cells (focus | family | tier) --');
Object.keys(L).filter(k => k.includes(' | ')).forEach(k => console.log(row(k, L[k])));
console.log(' -- C1 names drawn across lattice (item-weeks) --'); Object.entries(glob1).sort((a,b)=>b[1]-a[1]).forEach(e => console.log('   ' + e[1] + ' ' + e[0]));

// ── C. pool + filter trace via a SOURCE-SURGERY copy (scratch only; index.html untouched) ──
// One inserted line at the legs builder logs what the hipExt slot DREW, before any post-pass.
const fs = require('fs');
const SURG = argv[argv.indexOf('--surg') + 1];
{
  const html = fs.readFileSync(argv[0], 'utf8');
  const anchor = "const _isRunner = (cfg.cardioTypes||[]).indexOf('run') >= 0;";
  const n = html.split(anchor).length - 1;
  console.log('\n==== C. surgery anchor count ' + n + ' (must be 1)');
  if(n !== 1) throw new Error('anchor count ' + n);
  fs.writeFileSync(SURG, html.replace(anchor, anchor + " if(globalThis.__HIPLOG) globalThis.__HIPLOG.push({w:w, hipExt:ex.hipExt||null, prev:!!preventionSupport, pool:hipExtPool.slice(), hinge0:ex.hinge[0], lunge0:ex.lunge[0]});"));
}
const IA2 = load(SURG);
const nameSet = p => { const o = []; Object.keys(p.weeks).forEach(w => DAYS.forEach(d => liveSecs(p.weeks[w][d]).forEach(s => s.items.forEach(it => o.push(w + '|' + d + '|' + clean(it.name)))))); return o; };
function trace(tag, cfg){
  IA2.eval('globalThis.__HIPLOG=[]');
  const p = IA2.buildProgram(JSON.parse(JSON.stringify(cfg)));
  const log = IA2.eval('globalThis.__HIPLOG'); IA2.eval('globalThis.__HIPLOG=null');
  const ref = IA.buildProgram(JSON.parse(JSON.stringify(cfg)));
  console.log('\n' + tag + ': surgery copy == unmodified build: ' + (sig(p) === sig(ref)) + ' | legs-builder calls ' + log.length);
  if(log[0]) console.log('  hipExtPool at legs site (W1): ' + JSON.stringify(log[0].pool) + ' | preventionSupport=' + log[0].prev);
  const printed = nameSet(p);
  log.forEach(e => { const onCard = e.hipExt ? printed.filter(x => x.startsWith(e.w + '|') && x.endsWith('|' + e.hipExt)) : [];
    console.log('  W' + e.w + ' drew hipExt=' + JSON.stringify(e.hipExt) + ' (class ' + (e.hipExt ? cls(e.hipExt) : '-') + ') hinge0=' + e.hinge0 + ' | printed that week: ' + (onCard.length ? onCard.join(',') : 'NO') + (e.prev ? ' | prevention branch never reads ex.hipExt' : '')); });
  // pass ablation: which post-pass removes it
  for(const flag of ['__BUDGET_OFF','__DELOAD_OFF','__CAP_OFF','__REGIONAL_OFF']){
    IA.eval('globalThis.' + flag + '=true');
    const q = IA.buildProgram(JSON.parse(JSON.stringify(cfg)));
    IA.eval('globalThis.' + flag + '=false');
    const R = scan(q); let c1 = 0, c1s = 0; const nm = []; Object.keys(R.weeks).forEach(w => { c1 += R.weeks[w].c[1][0]; c1s += R.weeks[w].c[1][1]; R.weeks[w].list[1].forEach(x => nm.push('W' + w + ' ' + x.replace(/ \d.*$/, ''))); });
    console.log('  ablation ' + flag + ': C1 items ' + c1 + ' sets ' + c1s + (nm.length ? ' :: ' + nm.join(' ; ') : ''));
  }
}
trace('PRT TING', PRT); trace('THE HALF MANNY (pasted)', MANNY);
// ── C2. lattice: drawn vs printed at the legs site, and budget ablation ──
{
  const D = {}; let builds = 0;
  for(const f of FOC) for(const fam of Object.keys(FAM)) for(const eq of TIERS) for(let ei = 0; ei < 3; ei++) for(let si = 0; si < SEEDS.length; si++){
    const g = FAM[fam][(si + ei) % FAM[fam].length];
    const c = { name:'M', primaryPath: /^support_/.test(f) ? 'event' : 'goal', cardioTypes: g[0] ? ['run'] : [], cardioGoals: g[0] ? { run: Object.assign({ id:g[0], label:g[0], mileBestMins:'8', mileBestSecs:'0', baselineDist:'3', baseline:'3mi' }, g[1]) } : {},
      eventTargeted:false, liftingFocus:f, experience:EXPS[ei], ageBracket:'18-35', equipment:eq, unit:'lbs', restDays:['sun','wed'], days:DAYS.slice(), bench:135, squat:155, deadlift:185, seed:SEEDS[si] };
    IA2.eval('globalThis.__HIPLOG=[]');
    let p; try { p = IA2.buildProgram(JSON.parse(JSON.stringify(c))); } catch(e){ IA2.eval('globalThis.__HIPLOG=null'); continue; }
    const log = IA2.eval('globalThis.__HIPLOG'); IA2.eval('globalThis.__HIPLOG=null'); builds++;
    IA2.eval('globalThis.__BUDGET_OFF=true'); const pb = IA2.buildProgram(JSON.parse(JSON.stringify(c))); IA2.eval('globalThis.__BUDGET_OFF=false');
    const pr = nameSet(p), prb = nameSet(pb);
    for(const key of ['FOCUS ' + f, 'TIER ' + eq, 'FAM ' + fam, 'ALL']){
      const o = D[key] = D[key] || { legsDays:0, prev:0, drawn:0, drawnC1:0, printed:0, printedC1:0, printedNoBudget:0, printedC1NoBudget:0 };
      log.forEach(e => { o.legsDays++; if(e.prev){ o.prev++; return; } if(!e.hipExt) return; o.drawn++; const c1 = cls(e.hipExt) === 1; if(c1) o.drawnC1++;
        const on = pr.some(x => x.startsWith(e.w + '|') && x.endsWith('|' + e.hipExt)); const onb = prb.some(x => x.startsWith(e.w + '|') && x.endsWith('|' + e.hipExt));
        if(on){ o.printed++; if(c1) o.printedC1++; } if(onb){ o.printedNoBudget++; if(c1) o.printedC1NoBudget++; } });
    }
  }
  console.log('\n==== C2. legs-site hipExt draw vs print, ' + builds + ' builds (rest sun/wed), budget ablation = __BUDGET_OFF rebuild');
  Object.keys(D).forEach(k => { const o = D[k]; console.log('  ' + k.padEnd(28) + ' legs-builder calls ' + o.legsDays + ' | prevention branch (slot never read) ' + o.prev + ' | hipExt drawn ' + o.drawn + ' (C1 ' + o.drawnC1 + ') | printed ' + o.printed + '/' + o.drawn + ' (C1 ' + o.printedC1 + '/' + o.drawnC1 + ') | with budget OFF printed ' + o.printedNoBudget + '/' + o.drawn + ' (C1 ' + o.printedC1NoBudget + '/' + o.drawnC1 + ')'); });
}
console.log('DONE');
