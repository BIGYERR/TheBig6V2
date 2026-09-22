// V202 PHASE D — identity fuzz. READ-ONLY. Compares /tmp/base_V201.html vs index.html.
// Self-identity first (baseline == itself), then difference, then classification.
'use strict';
const path = require('path');
const H = require(path.join(__dirname, '..', 'harness.js'));
const ROOT = path.join(__dirname, '..', '..');
const BASE = process.argv[2] || '/tmp/base_V201.html';
const CAND = process.argv[3] || path.join(ROOT, 'index.html');
const DAYS = ['sun','mon','tue','wed','thu','fri','sat'];

const IB = H.load(BASE), IC = H.load(CAND);
console.log('artifacts: baseline V' + IB.version + '  candidate V' + IC.version);

// ── LATTICE ───────────────────────────────────────────────────────────────────
const SEEDS = [24865, 76308, 11111];
const EXPS = ['beginner','intermediate','advanced'];
const AGES = ['18-35','36-54','55+'];
const EQUIP = ['full_gym','crossfit','commercial','home_full','bodyweight'];
const RESTS = [['sun','wed'], ['sat','sun'], ['sun'], ['sun','tue','thu'], ['wed','sat','sun']];
const RACEDATES = ['2026-10-19','2026-11-23','2027-01-25','2026-12-06'];
const ANCHORS = [ {mileBestMins:'7', mileBestSecs:'30'}, {mileBestMins:'11', mileBestSecs:'30'},
                  {mileBestMins:'', mileBestSecs:''}, {mileBestMins:'5', mileBestSecs:'45'} ];

// goal specs: [tag, sport, goalObj-partial]
const GOALS = [];
// run_pace_goal — faster goals and already-met goals, mi and km
const PG = [
  ['pg_1.5mi_9:00_fast', {targetDist:'1.5', targetMins:'9',  targetSecs:'0',  paceUnit:'mi'}],
  ['pg_1.5mi_10:00',     {targetDist:'1.5', targetMins:'10', targetSecs:'0',  paceUnit:'mi'}],
  ['pg_1mi_6:00_fast',   {targetDist:'1',   targetMins:'6',  targetSecs:'0',  paceUnit:'mi'}],
  ['pg_3mi_30:00_met',   {targetDist:'3',   targetMins:'30', targetSecs:'0',  paceUnit:'mi'}],
  ['pg_5mi_60:00_met',   {targetDist:'5',   targetMins:'60', targetSecs:'0',  paceUnit:'mi'}],
  ['pg_2km_8:00_fast',   {targetDist:'2',   targetMins:'8',  targetSecs:'0',  paceUnit:'km'}],
  ['pg_2km_16:00_met',   {targetDist:'2',   targetMins:'16', targetSecs:'0',  paceUnit:'km'}],
  ['pg_10km_60:00',      {targetDist:'10',  targetMins:'60', targetSecs:'0',  paceUnit:'km'}],
  ['pg_0.5mi_3:00_fast', {targetDist:'0.5', targetMins:'3',  targetSecs:'0',  paceUnit:'mi'}],
  ['pg_26.2mi_240',      {targetDist:'26.2',targetMins:'240',targetSecs:'0',  paceUnit:'mi'}],
];
PG.forEach(([t,g]) => GOALS.push([t,'run', Object.assign({id:'run_pace_goal', label:'Hit a Pace / Time Goal', baselineDist:'3', baseline:'3mi'}, g)]));
// the two legacy aliases — explicitly in the lattice (phase C: 336-cell lattice never entered them)
GOALS.push(['legacy_mile_time','run',   {id:'run_mile_time',   label:'Mile Time',     baselineDist:'3', baseline:'3mi', targetDist:'1',   targetMins:'6', targetSecs:'0', paceUnit:'mi'}]);
GOALS.push(['legacy_15_under10','run',  {id:'run_15_under10',  label:'1.5mi under 10',baselineDist:'3', baseline:'3mi', targetDist:'1.5', targetMins:'10',targetSecs:'0', paceUnit:'mi'}]);
// the rest of the run catalog
['run_5k','run_10k','run_half','run_marathon','run_base'].forEach(id =>
  GOALS.push([id,'run', {id, label:id, baselineDist:'3', baseline:'3mi'}]));
// bike + swim
['bike_century','bike_50','bike_ftp','bike_cals','bike_base'].forEach(id => GOALS.push([id,'bike',{id,label:id}]));
['swim_tri','swim_mile','swim_100_time','swim_500_time','swim_base'].forEach(id => GOALS.push([id,'swim',{id,label:id}]));

const FOCUS = ['support_prevention','strength','hypertrophy','power'];
const cfgs = [];
let n = 0;
for (const [tag, sport, goal] of GOALS) {
  for (const exp of EXPS) for (const age of AGES) {
    for (const seed of SEEDS) {
      const anc = ANCHORS[n % ANCHORS.length];
      const cg = {}; cg[sport] = Object.assign({}, goal, sport === 'run' ? anc : {});
      cfgs.push({ tag: tag + '|' + exp + '|' + age + '|s' + seed + '|a' + (n % ANCHORS.length),
        cfg: { name:'FUZZ', primaryPath:'event', cardioTypes:[sport], cardioGoals:cg,
          eventTargeted:true, raceDate: RACEDATES[n % RACEDATES.length],
          liftingFocus: FOCUS[n % FOCUS.length], experience: exp, ageBracket: age,
          equipment: EQUIP[n % EQUIP.length], unit:'lbs',
          restDays: RESTS[n % RESTS.length].slice(), days: DAYS.slice(),
          bench:185, squat:245, deadlift:315, seed } });
      n++;
    }
  }
}

// ── CELLS: keyed on (week, day, label, movement), never on position ───────────
function cells(prog){
  const out = new Map();
  const put = (k, v) => { let i = 0, kk = k; while(out.has(kk)) kk = k + '#' + (++i); out.set(kk, v); };
  const wks = prog.weeks || {};
  Object.keys(wks).sort((a,b)=>+a-+b).forEach(w => DAYS.forEach(d => {
    const day = wks[w][d]; if(!day) return;
    const P = 'W' + w + '|' + d;
    put(P + '|META|day', JSON.stringify({title:day.title, dot:day.dot, tags:day.tags, rest:day.rest}));
    const cs = day.cardio ? (Array.isArray(day.cardio) ? day.cardio : [day.cardio]) : [];
    cs.forEach(c => put(P + '|CARDIO|' + (c.subtype || c.type || '?'), JSON.stringify(c)));
    (day.sections||[]).forEach(s => {
      const lab = s.label || s.coreHeader || '(nolabel)';
      put(P + '|SECMETA|' + lab, JSON.stringify(Object.assign({}, s, {items:undefined})));
      (s.items||[]).forEach(it => put(P + '|ITEM|' + lab + '|' + String(it.name).replace(/<svg[\s\S]*?<\/svg>\s*/g,''), JSON.stringify(it)));
    });
  }));
  const top = JSON.parse(JSON.stringify(prog, (k,v)=> (k==='id'||k==='created'||k==='weeks'||k==='_swapUniverse'||k==='_swapUniverseByKey')?undefined:v));
  put('TOP|prog', JSON.stringify(top));
  return out;
}

// ── CLASSIFIERS ───────────────────────────────────────────────────────────────
const NOTE_OLD_PLAIN = 'INT — Interval: Zone 5 (95%+ max HR) on work efforts. All-out on each rep, full recovery between. Build from 4 reps to 10 — hard cap at 10. Quality over quantity — if pace drops, stop.';
const NOTE_NEW_PLAIN = 'INT — Interval: Zone 5 (95%+ max HR) on work efforts. All out on each rep. Take the full recovery. Build from 4 reps to 8. Hard cap at 8. Quality over quantity. If pace drops, stop.';
const NOTE_GOALMET   = 'Your goal pace is already within your current pace. This block holds your pace and builds your reps.';
const APPENDIX = ' PACE CLOCK: Injury time froze your targets. This week resumes from the last pace you trained, not the calendar week.';
const OLD_DAMP = /^INT — Interval: Pace capped at \+[\d.]+s\/mi\/week \(physiological safety limit\)\. Full goal of [\d:]+\/mi requires more time — realistic target for this block is [\d:]+\/mi\. Hit the prescribed pace precisely\.$/;
const NEW_DAMP = /^INT — Interval: Pace moves [\d.]+ seconds per mile each week\. That is the safe rate for your experience and age\. Your full goal of [\d:]+\/mi needs more weeks than this block has\. The target for this block is [\d:]+\/mi\. Hit the prescribed pace precisely\.$/;
const CUTBACK = /^CUTBACK WEEK:/;
const NEW_REC = /Recovery: \d+:\d\d to \d+:\d\d of easy jogging or walking\. Keep moving\./;
const NEW_WARM = 'Warm up 10 to 15 minutes. Build from an easy jog. Add 4 to 5 bursts of 15 to 30 seconds. Cool down until breathing is easy.';
const PACE_FAMILY = new Set(['run_pace_goal','run_mile_time','run_15_under10']);

function stripApp(s){ return s.endsWith(APPENDIX) ? s.slice(0, -APPENDIX.length) : s; }

function classifyCardio(ob, oc, tag){
  const cls = [];
  const keys = new Set([...Object.keys(ob), ...Object.keys(oc)]);
  for (const k of keys) {
    const a = JSON.stringify(ob[k]), b = JSON.stringify(oc[k]);
    if (a === b) continue;
    const isINT = /^Interval \(INT\)/.test(String(oc.subtype||ob.subtype||''));
    const fam = PACE_FAMILY.has(oc.goalId || ob.goalId);
    if (k === 'note') {
      const A = stripApp(ob.note||''), B = stripApp(oc.note||'');
      const appAdded = (oc.note||'').endsWith(APPENDIX) && !(ob.note||'').endsWith(APPENDIX);
      if (A !== B) {
        if (A === NOTE_OLD_PLAIN && B === NOTE_NEW_PLAIN) cls.push('D-copy:INT_note_10to8');
        else if (B === NOTE_GOALMET) cls.push('E7:goal_met_note');
        else if (OLD_DAMP.test(A) && NEW_DAMP.test(B)) cls.push('D-copy:dampened_note');
        else if (OLD_DAMP.test(A) && B === NOTE_NEW_PLAIN) cls.push('D101:note_class_flip_damp_to_plain');
        else if (A === NOTE_OLD_PLAIN && NEW_DAMP.test(B)) cls.push('D101:note_class_flip_plain_to_damp');
        else if (OLD_DAMP.test(A) && B === NOTE_GOALMET) cls.push('E7:goal_met_note');
        else if (CUTBACK.test(A) && CUTBACK.test(B)) cls.push('UNCLASSIFIED:cutback_note_moved');
        else cls.push('UNCLASSIFIED:note(' + tag + ')');
      }
      if (appAdded) cls.push('D2b-iii:pace_clock_appendix');
      else if (!(oc.note||'').endsWith(APPENDIX) && (ob.note||'').endsWith(APPENDIX)) cls.push('UNCLASSIFIED:appendix_lost');
      continue;
    }
    if (k === 'detail') {
      if (!fam) { cls.push('UNCLASSIFIED:detail_non_pacefam(' + tag + ')'); continue; }
      const A = ob.detail||'', B = oc.detail||'';
      const maskClock = t => t.replace(/\d+:\d\d/g, '<CLK>');
      if (isINT) {
        const okRec = NEW_REC.test(B) && B.indexOf(NEW_WARM) >= 0;
        const oldRec = /Recovery: walk or jog 200m|5 min easy warmup/.test(A);
        if (okRec && oldRec) { cls.push('D105/D111/D112:int_detail_rewrite'); continue; }
        if (maskClock(A) === maskClock(B)) { cls.push('D100/D101:pace_value_moved(INT)'); continue; }
        cls.push('UNCLASSIFIED:int_detail(' + tag + ')'); continue;
      }
      // non-INT session on the NSW pace-goal path: only the printed pace clock may move
      if (maskClock(A) === maskClock(B)) { cls.push('D100/D101:pace_value_moved(' + (ob.subtype||'?').split(' ')[0] + ')'); continue; }
      cls.push('UNCLASSIFIED:nonint_detail_structure(' + tag + ')'); continue;
    }
    if (k === 'dose') {
      const da = ob.dose || {}, db = oc.dose || {};
      const dks = new Set([...Object.keys(da), ...Object.keys(db)]);
      const moved = [...dks].filter(x => JSON.stringify(da[x]) !== JSON.stringify(db[x]));
      if (!fam) { cls.push('UNCLASSIFIED:dose_non_pacefam(' + tag + ')'); continue; }
      const onlyTgtRec = moved.every(x => x === 'tgt' || x === 'rec');
      if (onlyTgtRec && isINT) cls.push('D105/D111:int_dose_' + moved.sort().join('+'));
      else if (onlyTgtRec) cls.push('D100/D101:dose_tgt_moved');
      else cls.push('UNCLASSIFIED:dose_fields_' + moved.sort().join('+') + '(' + tag + ')');
      continue;
    }
    if (k === 'subtype') { cls.push('UNCLASSIFIED:subtype(' + tag + ')'); continue; }
    cls.push('UNCLASSIFIED:field_' + k + '(' + tag + ')');
  }
  return cls;
}

function classify(key, vb, vc, tag){
  const kind = key.split('|')[2];
  if (kind === 'CARDIO') {
    let ob, oc;
    try { ob = JSON.parse(vb === undefined ? 'null' : vb); oc = JSON.parse(vc === undefined ? 'null' : vc); } catch(e){ return ['UNCLASSIFIED:parse']; }
    if (!ob || !oc) return ['UNCLASSIFIED:cardio_cell_appeared_or_vanished(' + tag + ')'];
    return classifyCardio(ob, oc, tag);
  }
  if (kind === 'TOP' || key === 'TOP|prog') {
    let ob, oc; try { ob = JSON.parse(vb); oc = JSON.parse(vc); } catch(e){ return ['UNCLASSIFIED:top_parse']; }
    const ks = new Set([...Object.keys(ob||{}), ...Object.keys(oc||{})]);
    const ch = [...ks].filter(k => JSON.stringify(ob[k]) !== JSON.stringify(oc[k]));
    return ch.map(k => 'UNCLASSIFIED:top_' + k + '(' + tag + ')');
  }
  return ['UNCLASSIFIED:' + kind + '(' + tag + ')'];
}

// ── RUN ───────────────────────────────────────────────────────────────────────
const clone = c => JSON.parse(JSON.stringify(c));
let selfOK = 0, selfBad = [], selfOKc = 0, selfBadC = [];
let totalCells = 0, diffCells = 0;
const classCount = {}, unclassified = [], SAMPLE = {}, FAMCLASS = {};
const famStats = {};   // tag-family -> {cfgs, cells, diffs}
const famOf = t => t.split('|')[0];

for (const {tag, cfg} of cfgs) {
  const pb1 = IB.buildProgram(clone(cfg)), pb2 = IB.buildProgram(clone(cfg));
  const d1 = H.progDigest(pb1), d2 = H.progDigest(pb2);
  if (d1 === d2) selfOK++; else selfBad.push(tag);
  const pc1 = IC.buildProgram(clone(cfg)), pc2 = IC.buildProgram(clone(cfg));
  if (H.progDigest(pc1) === H.progDigest(pc2)) selfOKc++; else selfBadC.push(tag);

  const A = cells(pb1), B = cells(pc1);
  const keys = new Set([...A.keys(), ...B.keys()]);
  const f = famOf(tag);
  famStats[f] = famStats[f] || {cfgs:0, cells:0, diffs:0, diffCfgs:0};
  famStats[f].cfgs++;
  let dhere = 0;
  for (const k of keys) {
    totalCells++; famStats[f].cells++;
    const vb = A.get(k), vc = B.get(k);
    if (vb === vc) continue;
    diffCells++; famStats[f].diffs++; dhere++;
    const cl = classify(k, vb, vc, tag);
    if (!cl.length) { unclassified.push('EMPTY-CLASS ' + tag + ' ' + k); classCount['UNCLASSIFIED:empty'] = (classCount['UNCLASSIFIED:empty']||0)+1; }
    for (const c of cl) {
      classCount[c] = (classCount[c]||0) + 1;
      const bc = c.split('(')[0]; FAMCLASS[f] = FAMCLASS[f]||{}; FAMCLASS[f][bc]=(FAMCLASS[f][bc]||0)+1;
      if (c.startsWith('UNCLASSIFIED')) unclassified.push(tag + ' || ' + k + ' || ' + c + '\n      OLD ' + String(vb).slice(0,400) + '\n      NEW ' + String(vc).slice(0,400));
      if (!SAMPLE[c.split('(')[0]]) SAMPLE[c.split('(')[0]] = tag + ' ' + k + '\n      OLD ' + String(vb).slice(0,300) + '\n      NEW ' + String(vc).slice(0,300);
    }
  }
  if (dhere) famStats[f].diffCfgs++;
}

console.log('\nSELF-IDENTITY  baseline ' + selfOK + '/' + cfgs.length + ' stable' + (selfBad.length ? ('  UNSTABLE: ' + selfBad.slice(0,5).join(',')) : '') );
console.log('SELF-IDENTITY  candidate ' + selfOKc + '/' + cfgs.length + ' stable' + (selfBadC.length ? ('  UNSTABLE: ' + selfBadC.slice(0,5).join(',')) : '') );
console.log('CONFIGS ' + cfgs.length + '  CELLS ' + totalCells + '  DIFF-CELLS ' + diffCells);
console.log('\nCENSUS BY GOAL FAMILY (diff cells / cells, cfgs moved / cfgs)');
Object.keys(famStats).sort().forEach(f => {
  const s = famStats[f];
  console.log('  ' + f.padEnd(22) + ' ' + String(s.diffs).padStart(6) + '/' + String(s.cells).padEnd(7) + '  cfgs ' + s.diffCfgs + '/' + s.cfgs);
});
console.log('\nCLASSES PER MOVING FAMILY');
Object.keys(FAMCLASS).sort().forEach(f => console.log('  ' + f + ' :: ' + Object.keys(FAMCLASS[f]).sort().map(c=>c+'='+FAMCLASS[f][c]).join('  ')));
console.log('\nCLASSES');
Object.keys(classCount).sort().forEach(c => console.log('  ' + String(classCount[c]).padStart(6) + '  ' + c));
const U = Object.keys(classCount).filter(c=>c.startsWith('UNCLASSIFIED')).reduce((a,c)=>a+classCount[c],0);
console.log('\nSAMPLES');
Object.keys(SAMPLE).sort().forEach(c => console.log('  [' + c + '] ' + SAMPLE[c]));
console.log('\nUNCLASSIFIED DIFFERENCES: ' + U);
unclassified.slice(0, 25).forEach(u => console.log('   ! ' + u));
if (unclassified.length > 25) console.log('   ... ' + (unclassified.length-25) + ' more');
if (diffCells === 0) console.log('\n!! EMPTY DIFF — instrument defect until proven otherwise');
