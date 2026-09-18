// ════════════════════════════════════════════════════════════════════════════════════
// v198_d85_posterior_floor.js — MEASURE PASS (read-only, rules nothing)
//
// Question on the table (D85, V198): a posterior-chain floor inside capSessionBudget
// (index.html:9416), applied at the DAY level in D50's shape, with a <=1 boundary.
// This script prints the BEFORE picture on the shipped artifact. It does not propose,
// rule or edit anything.
//
// WHAT IT ANSWERS
//   1. the posterior-free leg-cell census, with denominators, segmented by injury
//      state / equipment tier / focus / experience / goal / week.
//   2. the distribution the <=1 boundary rests on: posterior-chain items per leg cell
//      BEFORE capSessionBudget (the argument) and AFTER it (the return), so a floor at
//      <=1 can be read against where the mass actually sits.
//   3. the trim census: which branch of the loop ends the day, whether the cell is over
//      the cap already, and how much the tier-3 barbell exemption is skipping.
//
// ORACLE INDEPENDENCE
//   - the posterior-chain classifier is a HAND regex table (E_PAT below), typed from the
//     doctrine names, never read from _pattern(). It carries its own blindness probe.
//     _pattern is NOT consulted anywhere in this file.
//   - the budget cost model is hand-transcribed from the cap's documented rule
//     (stretch 0, holds/carries 0.5x sets, else sets, bare detail = 3 sets).
//   - the cap constant and the interference multiplier are read from the artifact by
//     calling the engine's own _cardioInterference for the cap, which is the only value
//     the script cannot derive without re-implementing a second function; it is used for
//     the over-cap census only, never for the posterior census.
//
// INSTRUMENTATION
//   capSessionBudget is the single call site at index.html:9766. It is wrapped in the VM
//   context after load (function declarations land on the context as writable globals),
//   so both the argument and the return value of every invocation are captured. cfg is
//   never mutated; seeds are pinned; the artifact is never edited.
//
// LATTICE
//   The g197c_d84_cmp.js lattice verbatim (6 tiers x 2 focus x 2 exp x 3 goals x 4 injury
//   x 3 rest x 2 seeds = 1728 config keys), so every number here is comparable with the
//   gate that produced the 186. lattice193.WIDE carries no injury state; this one does.
//
// USAGE
//   node tests/measure/v198_d85_posterior_floor.js [artifact.html] [shards]
// ════════════════════════════════════════════════════════════════════════════════════
const path = require('path');
const fs = require('fs');
const os = require('os');
const { fork } = require('child_process');
const { load } = require(path.join(__dirname, '..', 'harness.js'));

// ── the lattice (verbatim from tests/gates/g197c_d84_cmp.js) ───────────────────────
const E_TIERS = ['commercial','home_full','crossfit','home_basic','bodyweight','minimal'];
const E_FOCUS = ['hypertrophy','balanced'];
const E_EXPS  = ['beginner','advanced'];
const E_GOALS = [ { k:'liftonly', id:null }, { k:'pace', id:'run_pace_goal' }, { k:'half', id:'run_half' } ];
const E_INJ   = [ { k:'healthy', v:null },
                  { k:'shoulder/protect', v:{ region:'shoulder', tier:'protect' } },
                  { k:'lowback/protect',  v:{ region:'lowback',  tier:'protect' } },
                  { k:'knee/protect',     v:{ region:'knee',     tier:'protect' } } ];
const E_RESTS = [ { k:'sun', v:['sun'] }, { k:'sun+wed', v:['sun','wed'] }, { k:'sat+sun', v:['sat','sun'] } ];
const E_SEEDS = [1013, 3039];
function eCfg(tier, focus, exp, g, inj, rest, seed) {
  const isRace = !!g.id && /5k|10k|half|marathon/.test(g.id);
  return {
    name:'M', primaryPath: g.id ? (isRace ? 'event' : 'cardio') : 'lift',
    cardioTypes: g.id ? ['run'] : [],
    cardioGoals: g.id ? { run:{ id:g.id, label:g.k, mileBestMins:'10', mileBestSecs:'30',
                                baselineDist:'5', baseline:'5mi', targetDist:'1.5', targetMins:'11', targetSecs:'0' } } : {},
    eventTargeted: isRace, raceDate: isRace ? '2026-12-06' : null,
    liftingFocus: focus, experience: exp, ageBracket:'18-35',
    equipment: tier, unit:'lbs', restDays: rest.v.slice(),
    days:['sun','mon','tue','wed','thu','fri','sat'],
    bench:135, squat:155, deadlift:185, seed,
  };
}
const LAT = [];
for (const t of E_TIERS) for (const f of E_FOCUS) for (const x of E_EXPS) for (const g of E_GOALS)
  for (const i of E_INJ) for (const r of E_RESTS) for (const sd of E_SEEDS) {
    const c = eCfg(t,f,x,g,i,r,sd);
    if (i.v) c.injury = { region:i.v.region, tier:i.v.tier };
    LAT.push({ key:`${t}|${f}|${x}|${g.k}|${i.k}|${r.k}|${sd}`,
               tier:t, focus:f, exp:x, goal:g.k, inj:i.k, rest:r.k, seed:sd, cfg:c });
  }

// ── HAND ORACLE: posterior chain by name. Never _pattern(). ────────────────────────
const E_PAT = [
  ['calf_iso', /calf|calves|plantarflex/i],
  ['hip_ext',  /hip thrust|glute bridge|glute-ham|\bghr\b|nordic|back extension|hyperextension|reverse hyper|pull-?through/i],
  ['leg_iso',  /leg curl|leg extension|hamstring curl/i],
  ['hinge',    /deadlift|\brdl\b|romanian|good morning|\bswing\b|\bclean\b|\bsnatch\b|hinge|rack pull/i],
];
const ePat = n => { const t = String(n||''); for (const [p,r] of E_PAT) if (r.test(t)) return p; return null; };
const E_POSTERIOR = new Set(['hinge','hip_ext','leg_iso']);   // calf_iso is NOT posterior chain
const isLegCell = labels => labels.indexOf('Calves') >= 0 || labels.indexOf('Leg isolation') >= 0;
const postCount = names => names.reduce((a,n) => a + (E_POSTERIOR.has(ePat(n)) ? 1 : 0), 0);
// CENSUS B predicate, LABEL-INDEPENDENT. The leg-cell predicate above is keyed on two
// SECTION LABELS, and the budget deletes whole sections, so a day can lose its leg
// accessory label and drop out of that denominator while still being the athlete's leg
// day (D50: "a floor inside a container cannot stop the container being deleted").
// Census B asks the same question of the DAY: does this card load the legs at all, and
// does it carry any posterior chain. Hand regex, never _pattern.
const LEG_MOVE = /squat|lunge|step-?up|leg press|deadlift|hip thrust|glute|hamstring|leg curl|leg extension|calf|calves|wall sit|nordic|split squat|bridge|\bswing\b|good morning|romanian|back extension|hip airplane/i;
const isLegDay = names => names.some(n => LEG_MOVE.test(String(n||'')));

// ── HAND ORACLE: the budget's own cost rule ────────────────────────────────────────
const eSets    = d => { const m = String(d||'').match(/(\d+)\s*[×x]/); return m ? Math.max(1, parseInt(m[1],10)) : 3; };
const eStretch = n => /stretch|mobility|90\/90|foam|worlds greatest/i.test(n||'');
const eHalf    = n => /carry|wall sit|\bhold\b|plank|pallof|dead bug|bird dog|hang|l-sit|wiper|hollow|clamshell|side steps|side-lying|leg raises/i.test(n||'');
const eCost    = items => items.reduce((a,it) => a + (eStretch(it.n) ? 0 : (eHalf(it.n) ? eSets(it.d)*0.5 : eSets(it.d))), 0);

// ── HAND ORACLE: does this name carry an explicit implement token? Used ONLY to split
// the tier-3 population into "named barbell/loaded" vs "reached 3 by the fall-through".
const hasImplementTok = n => /barbell|trap bar|weighted|loaded|smith|dumbbell|kettlebell|\bdb\b|\bkb\b|machine|cable|band/i.test(n||'');

// ── blindness probe: the detector must be able to say both words ───────────────────
function probe(){
  const a = ['Back squat','Dumbbell bench press','Dumbbell standing calf raise'];
  const b = a.concat(['Nordic hamstring curl (anchored)']);
  const okA = postCount(a) === 0, okB = postCount(b) === 1;
  console.log('PROBE posterior detector: squat+press+calf -> ' + postCount(a)
    + ' (expect 0); +Nordic -> ' + postCount(b) + ' (expect 1) :: ' + ((okA&&okB)?'OK':'DETECTOR BROKEN'));
  if(!(okA&&okB)) process.exit(3);
}

// ── snapshot helpers ───────────────────────────────────────────────────────────────
function snap(sections){
  const labels = [], names = [], items = [];
  (sections||[]).forEach(sec => { labels.push(String((sec&&sec.label)||''));
    ((sec&&sec.items)||[]).forEach(it => { const n = String((it&&it.name)||'');
      names.push(n); items.push({ n, d:String((it&&it.detail)||'') }); }); });
  return { labels, names, items };
}

// ── the sweep for one shard ────────────────────────────────────────────────────────
// INSTRUMENT: the single call site (index.html:9766) is rewritten on a COPY of the
// artifact so every invocation records the WEEK and DAY it belongs to, plus the exact
// argument and return value. Identity matching was tried first and left 20,026 of
// 95,232 invocations unmatched, because later passes reassign day.sections; keying on
// (w,d) removes that blind spot and lets the script also count how often a pass AFTER
// the budget rewrites the card. index.html itself is never written.
const CALLSITE = "    Object.keys(weeks[w]).forEach(_d=>{ const _day=weeks[w][_d]; if(_day&&Array.isArray(_day.sections)) _day.sections=capSessionBudget(_day.sections,_day.cardio); });\n";
const CALLSITE_REC = "    Object.keys(weeks[w]).forEach(_d=>{ const _day=weeks[w][_d]; if(_day&&Array.isArray(_day.sections)){ var __mb=_day.sections; _day.sections=capSessionBudget(_day.sections,_day.cardio); if(typeof globalThis!=='undefined'&&globalThis.__MREC) globalThis.__MREC.push({w:String(w),d:String(_d),before:__mb,after:_day.sections,cardio:_day.cardio}); } });\n";

function instrument(artifact){
  const RAW = fs.readFileSync(artifact,'utf8');
  const n = RAW.split(CALLSITE).length - 1;
  if(n !== 1) { console.log('FAIL: capSessionBudget call-site anchor count=' + n + ', expected 1'); process.exit(5); }
  const out = path.join(os.tmpdir(), 'v198m_instr_' + path.basename(artifact) + '_' + process.pid + '.html');
  fs.writeFileSync(out, RAW.replace(CALLSITE, CALLSITE_REC));
  return out;
}

function sweep(artifact, mine){
  const instrPath = instrument(artifact);
  const IA = load(instrPath);
  IA.eval("globalThis.__MREC = []; var __INTERF=function(c){try{return _cardioInterference(c);}catch(e){return 0;}}; var __TIER=function(n){try{return _compoundTier(n);}catch(e){return -1;}};");
  const INTERF = IA.eval('__INTERF'), TIER3 = IA.eval('__TIER');
  const CAP_CONST = parseInt((IA.html.match(/const SESSION_SET_BUDGET = (\d+);/)||[])[1], 10);

  const R = {
    configs: 0, dayCells: 0, budgetInvocations: 0, unmatchedCells: 0,
    legCellsShipped: 0, postFreeShipped: 0, postFreeKeys: {},
    segShipped: {}, weekShipped: {},
    histBefore: {}, histAfter: {}, histShipped: {},
    legCellsBefore: 0, legCellsAfterCSB: 0,
    removedByBudget: 0, neverExisted: 0,
    overCapCells: 0, earlyReturnCells: 0, trimmedCells: 0, loopRanCells: 0,
    postFreeOverCap: 0, postFreeTrimmed: 0, postFreeEarlyReturn: 0,
    postFreeCardChangedAfterBudget: 0, cardsChangedAfterBudget: 0,
    pfPostBefore: {}, pfPostAfter: {},      // posterior count at budget-in / budget-out for the 186
    pfLostItems: {},                        // names the budget removed from those cells
    t3Names: {}, t3Hits: 0, t3CellsWithHit: 0, t3FallThroughHits: 0, t3TokenHits: 0,
    t3LegSection: {},
    examples: [],
  };
  const bump = (o,k) => { o[k] = (o[k]||0) + 1; };

  mine.forEach(L => {
    R.configs++;
    IA.eval('globalThis.__MREC.length = 0;');
    const prog = IA.buildProgram(L.cfg);
    const REC = IA.eval('globalThis.__MREC');
    R.budgetInvocations += REC.length;
    const byCell = new Map();
    REC.forEach(r => byCell.set(r.w + '/' + r.d, r));
    const W = prog.weeks || {};
    Object.keys(W).forEach(w => Object.keys(W[w]).forEach(d => {
      const day = W[w][d]; if(!day || day.rest || !Array.isArray(day.sections)) return;
      R.dayCells++;
      const shipped = snap(day.sections);
      const rec = byCell.get(String(w) + '/' + String(d));
      const seg = { tier:L.tier, focus:L.focus, exp:L.exp, goal:L.goal, inj:L.inj, week:'W'+w };
      const pfShipped = isLegCell(shipped.labels) && postCount(shipped.names) === 0;
      if(isLegDay(shipped.names)){
        R.legDaysShipped = (R.legDaysShipped||0) + 1;
        if(postCount(shipped.names) === 0){
          R.legDayPostFree = (R.legDayPostFree||0) + 1;
          R.legDaySeg = R.legDaySeg||{};
          Object.keys(seg).forEach(k => { R.legDaySeg[k+'='+seg[k]] = (R.legDaySeg[k+'='+seg[k]]||0)+1; });
          R.legDayKeys = R.legDayKeys||{}; R.legDayKeys[L.key] = (R.legDayKeys[L.key]||0)+1;
          if(!isLegCell(shipped.labels)) R.legDayPostFreeNoLabel = (R.legDayPostFreeNoLabel||0) + 1;
          if(day.role){ R.legDayRoles = R.legDayRoles||{}; R.legDayRoles[String(day.role)] = (R.legDayRoles[String(day.role)]||0)+1; }
        }
      }

      if(isLegCell(shipped.labels)){
        R.legCellsShipped++;
        const pc = postCount(shipped.names);
        bump(R.histShipped, pc >= 3 ? '3+' : String(pc));
        if(pc === 0){
          R.postFreeShipped++;
          bump(R.postFreeKeys, L.key);
          Object.keys(seg).forEach(k => bump(R.segShipped, k+'='+seg[k]));
          if(R.examples.length < 6) R.examples.push({ key:L.key, cell:'W'+w+'/'+d,
            labels: shipped.labels.join(' | '), names: shipped.names.join(', ') });
        }
      }
      if(!rec){ R.unmatchedCells++; return; }

      const before = snap(rec.before), after = snap(rec.after);
      const bLeg = isLegCell(before.labels), aLeg = isLegCell(after.labels);
      const pb = postCount(before.names), pa = postCount(after.names);
      if(bLeg){ R.legCellsBefore++; bump(R.histBefore, pb >= 3 ? '3+' : String(pb)); }
      if(aLeg){ R.legCellsAfterCSB++; bump(R.histAfter, pa >= 3 ? '3+' : String(pa)); }
      if(bLeg || aLeg){ if(pa === 0){ if(pb > 0) R.removedByBudget++; else R.neverExisted++; } }
      const cardChanged = after.names.join('|') !== shipped.names.join('|');
      if(cardChanged) R.cardsChangedAfterBudget++;

      const interf = INTERF(rec.cardio);
      const cap = Math.max(12, CAP_CONST - Math.round(interf * 2));
      const costBefore = eCost(before.items), costAfter = eCost(after.items);
      const early = costBefore <= cap;
      if(early) R.earlyReturnCells++; else { R.trimmedCells++; R.loopRanCells++; }
      const over = costAfter > cap;
      if(over) R.overCapCells++;
      // §12 records 2,399/95,232 over-cap cells. Three readings are printed so the
      // divergence is attributable: budget-OUT vs the SHIPPED card, and the interference-
      // adjusted cap vs the flat SESSION_SET_BUDGET.
      if(eCost(shipped.items) > cap) R.overCapShipped = (R.overCapShipped||0)+1;
      if(costAfter > CAP_CONST) R.overCapFlat = (R.overCapFlat||0)+1;
      if(eCost(shipped.items) > CAP_CONST) R.overCapShippedFlat = (R.overCapShippedFlat||0)+1;
      if(cap !== CAP_CONST) R.cellsWithInterference = (R.cellsWithInterference||0)+1;
      if(pfShipped){
        if(over) R.postFreeOverCap++;
        if(early) R.postFreeEarlyReturn++; else R.postFreeTrimmed++;
        const grp = early ? 'pfEarly' : 'pfTrim';
        R[grp+'Seg'] = R[grp+'Seg']||{};
        Object.keys(seg).forEach(k => { R[grp+'Seg'][k+'='+seg[k]] = (R[grp+'Seg'][k+'='+seg[k]]||0)+1; });
        R[grp+'Keys'] = R[grp+'Keys']||{}; R[grp+'Keys'][L.key] = (R[grp+'Keys'][L.key]||0)+1;
        if(over){ R.pfOverSeg = R.pfOverSeg||{}; R.pfOverSeg[early?'early':'trimmed'] = (R.pfOverSeg[early?'early':'trimmed']||0)+1; }
        if(cardChanged) R.postFreeCardChangedAfterBudget++;
        bump(R.pfPostBefore, pb >= 3 ? '3+' : String(pb));
        bump(R.pfPostAfter,  pa >= 3 ? '3+' : String(pa));
        const ac = {}; after.names.forEach(n => ac[n] = (ac[n]||0)+1);
        before.names.forEach(n => { if(ac[n]){ ac[n]--; return; } bump(R.pfLostItems, n); });
      }

      if(!early){
        let hit = 0;
        (rec.before||[]).forEach(sec => {
          const lab = String((sec&&sec.label)||'');
          ((sec&&sec.items)||[]).forEach(it => {
            const n = String((it&&it.name)||'');
            if(eStretch(n)) return;
            if(TIER3(n) !== 3) return;
            hit++; bump(R.t3Names, n); bump(R.t3LegSection, lab);
            if(hasImplementTok(n)) R.t3TokenHits++; else R.t3FallThroughHits++;
          });
        });
        R.t3Hits += hit;
        if(hit) R.t3CellsWithHit++;
      }
    }));
  });
  try { fs.unlinkSync(instrPath); } catch(e) {}
  return R;
}

// ── merge ──────────────────────────────────────────────────────────────────────────
function merge(a,b){
  Object.keys(b).forEach(k => {
    if(typeof b[k] === 'number') a[k] = (a[k]||0) + b[k];
    else if(Array.isArray(b[k])) a[k] = (a[k]||[]).concat(b[k]).slice(0,12);
    else { a[k] = a[k]||{}; Object.keys(b[k]).forEach(kk => a[k][kk] = (a[k][kk]||0) + b[k][kk]); }
  });
  return a;
}

// ── shard child ────────────────────────────────────────────────────────────────────
if(process.env.MSHARD !== undefined){
  const artifact = process.argv[2];
  const si = parseInt(process.env.MSHARD,10), sn = parseInt(process.env.MSHARDS,10);
  const mine = LAT.filter((_,i) => i % sn === si);
  const R = sweep(artifact, mine);
  fs.writeFileSync(process.env.MOUT, JSON.stringify(R));
  process.exit(0);
}

// ── parent ─────────────────────────────────────────────────────────────────────────
const artifact = process.argv[2] || path.join(__dirname,'..','..','index.html');
const SHARDS = parseInt(process.argv[3] || String(Math.min(8, os.cpus().length)), 10);
probe();
const ver = (fs.readFileSync(artifact,'utf8').match(/<meta name="ia-version" content="(\d+)"/)||[])[1];
console.log('ARTIFACT ' + artifact + '  ia-version=' + ver);
console.log('LATTICE  ' + LAT.length + ' config keys, ' + SHARDS + ' shards');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(),'v198m-'));
let done = 0; const outs = [];
for(let i=0;i<SHARDS;i++){
  const o = path.join(tmp,'s'+i+'.json'); outs.push(o);
  const ch = fork(__filename, [artifact], { env: Object.assign({}, process.env,
    { MSHARD:String(i), MSHARDS:String(SHARDS), MOUT:o }), stdio:'inherit' });
  ch.on('exit', code => {
    if(code !== 0){ console.log('FAIL: shard ' + i + ' exited ' + code); process.exit(4); }
    if(++done === SHARDS) report();
  });
}
function pct(n,d){ return d ? (100*n/d).toFixed(2)+'%' : 'n/a'; }
function top(o,n){ return Object.keys(o).sort((a,b)=>o[b]-o[a]).slice(0,n).map(k=>k+' '+o[k]); }
function report(){
  let R = {};
  outs.forEach(o => R = merge(R, JSON.parse(fs.readFileSync(o,'utf8'))));
  const keys = Object.keys(R.postFreeKeys||{});
  console.log('\n── 1. POSTERIOR-FREE LEG CELLS (shipped cards) ───────────────────────────');
  console.log('configs built              ' + R.configs);
  console.log('day cells (non-rest)       ' + R.dayCells);
  console.log('leg cells (Calves | Leg isolation label present)  ' + R.legCellsShipped
    + '  (' + pct(R.legCellsShipped, R.dayCells) + ' of day cells)');
  console.log('POSTERIOR-FREE leg cells   ' + R.postFreeShipped
    + ' / ' + R.legCellsShipped + '  (' + pct(R.postFreeShipped, R.legCellsShipped) + ')'
    + '  across ' + keys.length + ' config keys / ' + R.configs);
  console.log('segments (posterior-free count by axis):');
  ['inj','tier','focus','exp','goal','week'].forEach(ax => {
    const rows = Object.keys(R.segShipped||{}).filter(k=>k.indexOf(ax+'=')===0)
      .sort((a,b)=>R.segShipped[b]-R.segShipped[a]).map(k=>k+' '+R.segShipped[k]);
    console.log('  ' + ax.padEnd(6) + ' ' + (rows.length?rows.join('  '):'(none)'));
  });
  console.log('\n── 1b. CENSUS B: label-independent (any card that loads the legs) ───────');
  console.log('leg-LOADING day cells      ' + (R.legDaysShipped||0) + ' / ' + R.dayCells);
  console.log('POSTERIOR-FREE of those    ' + (R.legDayPostFree||0) + ' / ' + (R.legDaysShipped||0)
    + ' (' + pct(R.legDayPostFree||0, R.legDaysShipped||0) + ') across '
    + Object.keys(R.legDayKeys||{}).length + ' config keys / ' + R.configs);
  console.log('  of which carry NO Calves/Leg isolation label (invisible to census A): ' + (R.legDayPostFreeNoLabel||0));
  console.log('  day.role of those cells: ' + top(R.legDayRoles||{},8).join('  |  '));
  ['inj','tier','focus','exp','goal','week'].forEach(ax => {
    const rows = Object.keys(R.legDaySeg||{}).filter(k=>k.indexOf(ax+'=')===0)
      .sort((a,b)=>R.legDaySeg[b]-R.legDaySeg[a]).map(k=>k+' '+R.legDaySeg[k]);
    console.log('  ' + ax.padEnd(6) + ' ' + (rows.length?rows.join('  '):'(none)'));
  });
  console.log('\n── 2. POSTERIOR-CHAIN ITEMS PER LEG CELL ────────────────────────────────');
  const H = (lab,h,den) => console.log('  ' + lab.padEnd(28)
    + ['0','1','2','3+'].map(k=>k+': '+(h[k]||0)+' ('+pct(h[k]||0,den)+')').join('   ')
    + '   n=' + den);
  H('BEFORE capSessionBudget', R.histBefore||{}, R.legCellsBefore);
  H('AFTER  capSessionBudget', R.histAfter||{}, R.legCellsAfterCSB);
  H('SHIPPED card', R.histShipped||{}, R.legCellsShipped);
  console.log('  leg cells landing on 0 posterior: removed BY the budget ' + R.removedByBudget
    + ', never had one ' + R.neverExisted + '  (n=' + (R.removedByBudget+R.neverExisted) + ')');
  console.log('\n── 3. THE CAP AND THE TRIM LOOP ─────────────────────────────────────────');
  console.log('budget invocations         ' + R.budgetInvocations
    );
  console.log('cells under cap on arrival (early return :9425)  ' + R.earlyReturnCells
    + ' / ' + (R.earlyReturnCells+R.trimmedCells) + ' (' + pct(R.earlyReturnCells, R.earlyReturnCells+R.trimmedCells) + ')');
  console.log('cells STILL over cap after the loop              ' + R.overCapCells
    + ' / ' + R.dayCells + ' (' + pct(R.overCapCells, R.dayCells) + ')');
  console.log('   over-cap readings: budget-OUT/adj-cap ' + R.overCapCells + '  shipped/adj-cap ' + (R.overCapShipped||0)
    + '  budget-OUT/flat-20 ' + (R.overCapFlat||0) + '  shipped/flat-20 ' + (R.overCapShippedFlat||0)
    + '   (cells whose cap is reduced by cardio interference: ' + (R.cellsWithInterference||0) + ')');
  console.log('posterior-free leg cells that are over cap       ' + R.postFreeOverCap + ' / ' + R.postFreeShipped);
  console.log('posterior-free leg cells the budget TRIMMED      ' + R.postFreeTrimmed + ' / ' + R.postFreeShipped);
  console.log('posterior-free leg cells that never entered loop ' + R.postFreeEarlyReturn + ' / ' + R.postFreeShipped);
  console.log('cells unmatched to a budget invocation            ' + R.unmatchedCells + ' / ' + R.dayCells);
  console.log('cards rewritten by a pass AFTER the budget        ' + R.cardsChangedAfterBudget + ' / ' + R.dayCells
    + '   (of the posterior-free 186: ' + R.postFreeCardChangedAfterBudget + ')');
  console.log('THE ' + R.postFreeShipped + ': posterior items at budget-IN  ' + JSON.stringify(R.pfPostBefore));
  console.log('THE ' + R.postFreeShipped + ': posterior items at budget-OUT ' + JSON.stringify(R.pfPostAfter));
  ['pfEarly','pfTrim'].forEach(g => {
    const seg = R[g+'Seg']||{}, keys = Object.keys(R[g+'Keys']||{});
    const tot = Object.keys(seg).filter(k=>k.indexOf('inj=')===0).reduce((a,k)=>a+seg[k],0);
    console.log('  ' + (g==='pfEarly' ? 'ARRIVED at 0 (budget never ran the loop, no floor can reach them)'
                                      : 'TRIMMED to 0 by the loop (a day-level floor would bind)') + ': ' + tot
      + ' cells / ' + keys.length + ' keys');
    ['inj','tier','focus','exp','goal'].forEach(ax => {
      const rows = Object.keys(seg).filter(k=>k.indexOf(ax+'=')===0).sort((a,b)=>seg[b]-seg[a]).map(k=>k+' '+seg[k]);
      console.log('      ' + ax.padEnd(6) + ' ' + (rows.length?rows.join('  '):'(none)'));
    });
  });
  console.log('  over-cap split of the posterior-free cells: ' + JSON.stringify(R.pfOverSeg||{}));
  console.log('THE ' + R.postFreeShipped + ': items the budget removed from those cells: ' + top(R.pfLostItems||{},12).join('  |  '));
  console.log('\n── 4. TIER-3 BARBELL EXEMPTION (:9512) ──────────────────────────────────');
  console.log('candidate items skipped by the tier-3 guard      ' + R.t3Hits
    + ' over ' + R.t3CellsWithHit + ' trimming cells / ' + R.trimmedCells);
  console.log('  named implement (barbell/trap/weighted/...)    ' + R.t3TokenHits + ' (' + pct(R.t3TokenHits,R.t3Hits) + ')');
  console.log('  reached 3 by the _compoundTier fall-through    ' + R.t3FallThroughHits + ' (' + pct(R.t3FallThroughHits,R.t3Hits) + ')');
  console.log('  top names:    ' + top(R.t3Names||{}, 14).join('  |  '));
  console.log('  top sections: ' + top(R.t3LegSection||{}, 10).join('  |  '));
  console.log('\n── config keys carrying a posterior-free leg cell ───────────────────────');
  keys.sort().forEach(k => console.log('  ' + k + '  x' + R.postFreeKeys[k]));
  console.log('\n── example cells ───────────────────────────────────────────────────────');
  (R.examples||[]).forEach(e => console.log('  ' + e.key + ' ' + e.cell + '\n      ' + e.labels + '\n      ' + e.names));
  console.log('\nMEASURED ' + R.dayCells + ' day cells / ' + R.configs + ' configs. No ruling. No edit.');
  try { outs.forEach(o=>fs.unlinkSync(o)); } catch(e){}
}
