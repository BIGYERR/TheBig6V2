// ════════════════════════════════════════════════════════════════════════════════════
// v199_d88_leg_draw.js — MEASURE PASS (read-only, rules nothing, proposes nothing)
//
// QUESTION ON THE TABLE (D88): the 746 draw-side zero-posterior weeks no floor can
// reach. D88 is ruled as a DRAW defect, not a filter defect: on commercial the leg day's
// accessory slot drew 'Leg press' from EXLIB.leg_accessory (index.html:1589) while the
// same pool holds four hamstring/glute names.
//
// WHAT THIS PRINTS
//   1. the 746, reproduced on the v198_d85_posterior_floor lattice, segmented, with the
//      budget-IN check that makes a week DRAW-side rather than budget-side.
//   2. the draw: every slot that can print a posterior movement on a leg day, the pool it
//      draws from, the legal member set per equipment tier after _gear/_gearOK, and the
//      picked-vs-available census. Frozen / stride behaviour is measured, not assumed.
//   3. the same-lens table: every posterior-chain lens in the file, disagreeing where it
//      disagrees.
//   4. the candidate population a pool-side rule could move (sizing only, NO fix).
//   5. D90 CONTEXT (labelled, not D88 evidence): current unilateral leg coverage.
//
// ORACLE INDEPENDENCE
//   The posterior classifier is a HAND regex table typed from the doctrine movement names
//   (E_PAT below) with a blindness probe. _pattern() is NEVER consulted as the oracle; it
//   is READ ONLY in section 3, where the question is literally "do the lenses agree".
//   NOTE: this file deliberately does NOT copy v198_d85_posterior_floor.js:91, whose
//   E_POSTERIOR wrongly includes leg_iso (it counts 'Leg extension' as posterior chain).
//   Here E_POSTERIOR = {hinge, hip_ext}, D85's shipped lens.
//
// INSTRUMENTATION (four anchors, count==1 asserted on the artifact before any write; the
// artifact itself is never written — a COPY is instrumented in tmpdir and unlinked)
//   A capSessionBudget call site   -> budget-IN / budget-OUT per (week,day)
//   B the legIso pick             -> gear pool, same-card-subtracted pool, picked pair, seed
//   C the lower-slot selections   -> hingePool / hipExtPool / hingeSel / hipExtSel per block
//   D const _gear                 -> the closure, so per-tier legality is read from the
//                                    engine's own filter rather than re-implemented
//
// USAGE
//   node tests/measure/v199_d88_leg_draw.js [artifact.html] [shards]
// ════════════════════════════════════════════════════════════════════════════════════
const path = require('path');
const fs   = require('fs');
const os   = require('os');
const { fork } = require('child_process');
const { load } = require(path.join(__dirname, '..', 'harness.js'));

// ── the lattice: v198_d85_posterior_floor.js verbatim (1728 config keys) ────────────
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

// ── HAND ORACLE ────────────────────────────────────────────────────────────────────
// Typed from the doctrine movement names. _pattern() is not the source.
const E_PAT = [
  ['calf_iso', /calf|calves|plantarflex/i],
  ['hip_ext',  /hip thrust|glute bridge|glute-ham|\bghr\b|nordic|back extension|hyperextension|reverse hyper|pull-?through/i],
  ['leg_iso',  /leg curl|leg extension|hamstring curl/i],
  ['hinge',    /deadlift|\brdl\b|romanian|good morning|\bswing\b|\bclean\b|\bsnatch\b|hinge|rack pull/i],
];
const ePat = n => { const t = String(n||''); for (const [p,r] of E_PAT) if (r.test(t)) return p; return null; };
// D85's SHIPPED lens. leg_iso is NOT posterior chain (a leg extension is a pure quad
// movement and a machine leg curl is not hip extension). This is the fix to the defect
// recorded at v198_d85_posterior_floor.js:91.
const E_POSTERIOR = new Set(['hinge','hip_ext']);
const isPost   = n => E_POSTERIOR.has(ePat(n));
const postCount = names => names.reduce((a,n) => a + (isPost(n) ? 1 : 0), 0);
// D90 CONTEXT ONLY. Unilateral = one limb at a time, by name.
const UNI = /lunge|split squat|step-?up|single-?leg|one-?leg|pistol|skater|bulgarian|rear-foot|suitcase/i;
const isUni = n => UNI.test(String(n||''));
// label-independent "this card loads the legs" (v198 script's LEG_MOVE verbatim)
const LEG_MOVE = /squat|lunge|step-?up|leg press|deadlift|hip thrust|glute|hamstring|leg curl|leg extension|calf|calves|wall sit|nordic|split squat|bridge|\bswing\b|good morning|romanian|back extension|hip airplane/i;
const isLegDay = names => names.some(n => LEG_MOVE.test(String(n||'')));

function probe(){
  const cases = [
    ['Back squat', 0], ['Leg extension', 0], ['Lying leg curl', 0], ['Leg press', 0],
    ['Dumbbell standing calf raise', 0],
    ['Nordic hamstring curl (anchored)', 1], ['Single-leg glute bridge', 1],
    ['Single-leg hip thrust', 1], ['Barbell Romanian deadlift', 1], ['Banded hip thrust', 1],
  ];
  let bad = 0;
  cases.forEach(([n,e]) => { const g = postCount([n]); if(g !== e){ bad++; console.log('  PROBE MISS ' + n + ' -> ' + g + ' expected ' + e); } });
  const u = [['Dumbbell Bulgarian split squat',true],['Back squat',false],['Step-ups (KB)',true],['Leg press',false]];
  u.forEach(([n,e]) => { if(isUni(n) !== e){ bad++; console.log('  PROBE MISS uni ' + n); } });
  console.log('PROBE hand oracle: ' + (cases.length+u.length) + ' cases, ' + bad + ' miss :: ' + (bad?'DETECTOR BROKEN':'OK'));
  if(bad) process.exit(3);
}

// ── INSTRUMENTATION ────────────────────────────────────────────────────────────────
const A_CSB   = "    Object.keys(weeks[w]).forEach(_d=>{ const _day=weeks[w][_d]; if(_day&&Array.isArray(_day.sections)) _day.sections=capSessionBudget(_day.sections,_day.cardio); });\n";
const A_CSB_R = "    Object.keys(weeks[w]).forEach(_d=>{ const _day=weeks[w][_d]; if(_day&&Array.isArray(_day.sections)){ var __mb=_day.sections; _day.sections=capSessionBudget(_day.sections,_day.cardio); if(typeof globalThis!=='undefined'&&globalThis.__MREC) globalThis.__MREC.push({w:String(w),d:String(_d),before:__mb,after:_day.sections}); } });\n";

const A_LEG   = "const legIso=pick(_laLeft.length>=2?_laLeft:_laGear,2,blockSeed(w)+105);";
const A_LEG_R = A_LEG + "if(typeof globalThis!=='undefined'&&globalThis.__LREC)globalThis.__LREC.push({w:String(w),gear:_laGear.slice(),left:_laLeft.slice(),used:(_laLeft.length>=2?_laLeft:_laGear).slice(),picked:legIso.slice(),sd:blockSeed(w)+105});";

const A_SLOT   = "const hipExtSel= hipExtPool.length?(_slot(hipExtPool,1,bs+15,'lower',true)[0]||null):null;";
const A_SLOT_R = A_SLOT + "if(typeof globalThis!=='undefined'&&globalThis.__SREC)globalThis.__SREC.push({bs:bs,hingePool:hingePool.slice(),hipExtPool:hipExtPool.slice(),hingeSel:(hingeSel||[]).slice(),hipExtSel:hipExtSel,squatSel:squatSel,lungeSel:(lungeSel||[]).slice()});";

const A_GEAR   = "  const _gear = pool => (pool||[]).filter(_gearOK);";
const A_GEAR_R = A_GEAR + "if(typeof globalThis!=='undefined'){globalThis.__GEARFN=_gear;globalThis.__GEAROK=_gearOK;}";

function instrument(artifact){
  let RAW = fs.readFileSync(artifact,'utf8');
  [[A_CSB,A_CSB_R],[A_LEG,A_LEG_R],[A_SLOT,A_SLOT_R],[A_GEAR,A_GEAR_R]].forEach(([a,b],i) => {
    const n = RAW.split(a).length - 1;
    if(n !== 1){ console.log('FAIL: anchor ' + i + ' count=' + n + ' (expected 1) in ' + artifact); process.exit(5); }
    RAW = RAW.replace(a, b);
  });
  const out = path.join(os.tmpdir(), 'v199m_' + path.basename(artifact).replace(/[^a-z0-9._]/gi,'_') + '_' + process.pid + '.html');
  fs.writeFileSync(out, RAW);
  return out;
}

function snapNames(sections){
  const names = [], labels = [];
  (sections||[]).forEach(sec => { labels.push(String((sec&&sec.label)||''));
    ((sec&&sec.items)||[]).forEach(it => names.push(String((it&&it.name)||''))); });
  return { names, labels };
}

// ── the sweep ──────────────────────────────────────────────────────────────────────
function sweep(artifact, mine){
  const instrPath = instrument(artifact);
  const IA = load(instrPath);
  IA.eval("globalThis.__MREC=[];globalThis.__LREC=[];globalThis.__SREC=[];");

  const R = {
    configs:0, weeks:0, dayCells:0, legDays:0,
    zeroWeeks:0, zeroWeeksKeys:{}, zSeg:{},
    zeroWeeksDrawSide:0, zeroWeeksBudgetSide:0, zdSeg:{}, zbSeg:{},
    zeroWeeksWithLegDay:0, zeroWeeksNoLegDay:0,
    // section-label provenance of posterior items that DO ship
    postBySection:{}, postByName:{},
    // what a zero-posterior week's leg days actually carry
    zeroLegNames:{}, zeroLegLabels:{},
    // legIso draw census
    draws:0, drawsByTier:{}, drawPoolPostAvail:0, drawPickedPost:0,
    drawMissed:0, drawMissedByTier:{}, drawMissedNames:{},
    drawPoolSizes:{}, drawUsedIsGear:0, drawUsedIsLeft:0,
    gearPoolByTier:{}, usedPoolPostByTier:{}, pickedNamesByTier:{},
    drawSeeds:{}, drawDistinctPairsPerCfg:{},
    // slot census
    slots:0, hipExtNull:0, hipExtNullByInj:{}, hingePoolPostByTier:{}, hipExtPoolEmpty:0,
    hingeSelPost:0, hipExtSelPost:0, slotPoolNames:{},
    // sizing counterfactual
    flipLegIso:0, flipLegIsoSeg:{}, flipSlot:0, flipEither:0, flipNeither:0, flipNeitherSeg:{},
    flipLegIsoSurvives:0,
    // D90
    uniLegDays:0, uniItemsTotal:0, uniZeroLegDays:0, uniPerLegDay:{}, uniWeeksZero:0,
    uniZeroSeg:{}, legSupersetAEmpty:0,
    examples:[],
  };
  const bump=(o,k)=>{o[k]=(o[k]||0)+1;};
  const add =(o,k,v)=>{o[k]=(o[k]||0)+v;};

  mine.forEach(L => {
    R.configs++;
    IA.eval('globalThis.__MREC.length=0;globalThis.__LREC.length=0;globalThis.__SREC.length=0;');
    const prog = IA.buildProgram(L.cfg);
    const MREC = IA.eval('globalThis.__MREC');
    const LREC = IA.eval('globalThis.__LREC');
    const SREC = IA.eval('globalThis.__SREC');
    const seg = { inj:L.inj, tier:L.tier, focus:L.focus, exp:L.exp, goal:L.goal };

    // budget-IN posterior count per week
    const inByWeek = {};
    MREC.forEach(r => { const s = snapNames(r.before);
      inByWeek[r.w] = (inByWeek[r.w]||0) + postCount(s.names); });

    // legIso draws per week
    const drawByWeek = {};
    LREC.forEach(r => {
      R.draws++; bump(R.drawsByTier, L.tier);
      const used = r.used||[], gear = r.gear||[], pk = r.picked||[];
      const availPost = used.filter(isPost);
      const pickedPost = pk.filter(isPost);
      if(availPost.length) R.drawPoolPostAvail++;
      if(pickedPost.length) R.drawPickedPost++;
      if(availPost.length && !pickedPost.length){
        R.drawMissed++; bump(R.drawMissedByTier, L.tier);
        pk.forEach(n => bump(R.drawMissedNames, String(n)));
      }
      bump(R.drawPoolSizes, L.tier + ':used=' + used.length);
      if(used.length === gear.length) R.drawUsedIsGear++; else R.drawUsedIsLeft++;
      gear.forEach(n => bump(R.gearPoolByTier, L.tier + '::' + n));
      add(R.usedPoolPostByTier, L.tier, availPost.length);
      pk.forEach(n => bump(R.pickedNamesByTier, L.tier + '::' + String(n)));
      bump(R.drawSeeds, L.tier + ':' + String(r.sd));
      const k = L.key + '||' + pk.join('+');
      R.drawDistinctPairsPerCfg[L.key] = R.drawDistinctPairsPerCfg[L.key] || {};
      R.drawDistinctPairsPerCfg[L.key][pk.join('+')] = 1;
      drawByWeek[r.w] = drawByWeek[r.w] || [];
      drawByWeek[r.w].push({ availPost: availPost.length, picked: pk.slice() });
    });

    SREC.forEach(r => {
      R.slots++;
      if(!(r.hipExtPool||[]).length) R.hipExtPoolEmpty++;
      if(r.hipExtSel == null){ R.hipExtNull++; bump(R.hipExtNullByInj, L.inj + '/' + L.tier); }
      else if(isPost(r.hipExtSel)) R.hipExtSelPost++;
      (r.hingeSel||[]).slice(0,1).forEach(n => { if(isPost(n)) R.hingeSelPost++; });
      add(R.hingePoolPostByTier, L.tier, (r.hingePool||[]).filter(isPost).length);
      (r.hingePool||[]).forEach(n => bump(R.slotPoolNames, 'hinge::' + L.inj + '::' + String(n)));
      (r.hipExtPool||[]).forEach(n => bump(R.slotPoolNames, 'hipExt::' + L.inj + '::' + String(n)));
    });
    // slot pools are drawn once per BLOCK, not per week: record the ratio
    const slotFlipWeeks = new Set();
    SREC.forEach(r => { if(((r.hingePool||[]).some(isPost)) || ((r.hipExtPool||[]).some(isPost))) slotFlipWeeks.add('any'); });

    const W = prog.weeks || {};
    Object.keys(W).forEach(w => {
      R.weeks++;
      let wkPost = 0, wkLegDays = 0, wkUni = 0, wkHasLeg = false;
      const legNames = [];
      Object.keys(W[w]).forEach(d => {
        const day = W[w][d]; if(!day || day.rest || !Array.isArray(day.sections)) return;
        R.dayCells++;
        const s = snapNames(day.sections);
        const pc = postCount(s.names);
        wkPost += pc;
        (day.sections||[]).forEach(sec => ((sec&&sec.items)||[]).forEach(it => {
          const n = String((it&&it.name)||'');
          if(isPost(n)){ bump(R.postBySection, String((sec&&sec.label)||'(nolabel)')); bump(R.postByName, n); }
        }));
        if(isLegDay(s.names)){
          R.legDays++; wkLegDays++; wkHasLeg = true;
          const u = s.names.filter(isUni).length;
          R.uniItemsTotal += u; wkUni += u;
          if(u) R.uniLegDays++; else R.uniZeroLegDays++;
          bump(R.uniPerLegDay, String(Math.min(u,4)));
          if(s.labels.indexOf('Leg superset A') < 0) R.legSupersetAEmpty++;
          if(pc === 0){ s.names.forEach(n => bump(R.zeroLegNames, n)); s.labels.forEach(l => bump(R.zeroLegLabels, l)); }
        }
      });
      if(wkUni === 0 && wkHasLeg){ R.uniWeeksZero++; Object.keys(seg).forEach(k => bump(R.uniZeroSeg, k+'='+seg[k])); }
      if(wkPost === 0){
        R.zeroWeeks++;
        bump(R.zeroWeeksKeys, L.key);
        Object.keys(seg).forEach(k => bump(R.zSeg, k+'='+seg[k]));
        bump(R.zSeg, 'week=W'+w);
        if(wkHasLeg) R.zeroWeeksWithLegDay++; else R.zeroWeeksNoLegDay++;
        const budgetIn = inByWeek[w] || 0;
        if(budgetIn === 0){ R.zeroWeeksDrawSide++; Object.keys(seg).forEach(k => bump(R.zdSeg, k+'='+seg[k])); }
        else { R.zeroWeeksBudgetSide++; Object.keys(seg).forEach(k => bump(R.zbSeg, k+'='+seg[k])); }
        // sizing: could a pool-side rule at the legIso slot have flipped this week?
        const dws = drawByWeek[w] || [];
        const canLegIso = dws.some(x => x.availPost > 0);
        const canSlot = slotFlipWeeks.has('any');
        if(canLegIso){ R.flipLegIso++; Object.keys(seg).forEach(k => bump(R.flipLegIsoSeg, k+'='+seg[k])); }
        if(canSlot) R.flipSlot++;
        if(canLegIso || canSlot) R.flipEither++;
        else { R.flipNeither++; Object.keys(seg).forEach(k => bump(R.flipNeitherSeg, k+'='+seg[k])); }
        // does the slot the rule would act on SURVIVE to the shipped card?
        if(canLegIso){
          let survived = false;
          Object.keys(W[w]).forEach(d => { const day=W[w][d]; if(!day||!Array.isArray(day.sections)) return;
            if(snapNames(day.sections).labels.indexOf('Leg isolation') >= 0) survived = true; });
          if(survived) R.flipLegIsoSurvives++;
        }
        if(R.examples.length < 8 && wkHasLeg){
          Object.keys(W[w]).forEach(d => { const day=W[w][d];
            if(!day||day.rest||!Array.isArray(day.sections)) return;
            const s2 = snapNames(day.sections);
            if(R.examples.length < 8 && isLegDay(s2.names) && postCount(s2.names)===0)
              R.examples.push({ key:L.key, cell:'W'+w+'/'+d, labels:s2.labels.join(' | '), names:s2.names.join(', '),
                               budgetIn: inByWeek[w]||0, draws: JSON.stringify(drawByWeek[w]||[]) });
          });
        }
      }
    });
  });
  try{ fs.unlinkSync(instrPath); }catch(e){}
  R.drawDistinctPairsPerCfg = Object.keys(R.drawDistinctPairsPerCfg)
    .reduce((a,k)=>{ const n = Object.keys(R.drawDistinctPairsPerCfg[k]).length; a['distinct='+n]=(a['distinct='+n]||0)+1; return a; }, {});
  return R;
}

// ── per-tier legality, read from the engine's OWN _gear closure ─────────────────────
function tierLegality(artifact){
  const instrPath = instrument(artifact);
  const IA = load(instrPath);
  const POOL = IA.EXLIB ? (IA.EXLIB.leg_accessory||[]) : [];
  const out = {};
  E_TIERS.forEach(t => {
    const c = eCfg(t,'hypertrophy','advanced',E_GOALS[0],E_INJ[0],E_RESTS[0],1013);
    IA.buildProgram(c);
    const gear = IA.eval('globalThis.__GEARFN');
    out[t] = gear(POOL);
  });
  try{ fs.unlinkSync(instrPath); }catch(e){}
  return { pool: POOL, byTier: out, version: IA.version };
}

// ── the same-lens table ────────────────────────────────────────────────────────────
function lensTable(artifact){
  const IA = load(artifact);
  const POOL = (IA.EXLIB && IA.EXLIB.leg_accessory) || [];
  const EXTRA = ['Barbell Romanian deadlift','Banded hip thrust','45° back extension','Conventional deadlift'];
  const names = POOL.concat(EXTRA);
  const REG = IA.eval("(typeof _PATTERN_REGION!=='undefined'?_PATTERN_REGION:{})");
  const rows = names.map(n => {
    let p = null; try { p = IA._pattern ? IA._pattern(n) : null; } catch(e) { p = 'ERR:'+e.message; }
    return { name:n, enginePattern:p, handPattern:ePat(n), region: REG[p] || '-',
             d85Posterior: E_POSTERIOR.has(p), handPosterior: isPost(n),
             g197cPosterior: new Set(['hinge','hip_ext','leg_iso']).has(p) };
  });
  return rows;
}

// ── merge ──────────────────────────────────────────────────────────────────────────
function merge(a,b){
  Object.keys(b).forEach(k => {
    if(typeof b[k] === 'number') a[k] = (a[k]||0) + b[k];
    else if(Array.isArray(b[k])) a[k] = (a[k]||[]).concat(b[k]).slice(0,16);
    else { a[k] = a[k]||{}; Object.keys(b[k]).forEach(kk => a[k][kk] = (a[k][kk]||0) + b[k][kk]); }
  });
  return a;
}


// ════════════════════════════════════════════════════════════════════════════════════
// PHASE 2 — PIPELINE ATTRIBUTION.  node tests/measure/v199_d88_leg_draw.js <art> <shards> --phase2
//
// Phase 1 refutes the stated root cause (the legIso draw picks a posterior member on
// 10,056 of 10,080 draws), so phase 2 asks the day-build pipeline where the posterior
// item is actually lost. index.html:9790 composes FOUR passes on one line:
//     capRegionalFatigue( (isRecoveryWeek ? recoveryDeload : id)( applyInjuryFilter(
//         buildSections(...) , cfg) ), role, cardio, goal)
// and capSessionBudget runs later in its own loop. The line is split on a COPY so each
// stage's output is snapshotted; the artifact is never written. Same hand oracle.
// ════════════════════════════════════════════════════════════════════════════════════
const A_PIPE = "      weeks[w][d]={title,dot:cardio?cardio.type:'lift',tags,cardio,sections:capRegionalFatigue((_s=>isRecoveryWeek(w)?recoveryDeload(_s):_s)(applyInjuryFilter(buildSections(role,w,{fullVariant,wantCarry:d===carryHost,cardio,hotNext}),cfg)),role,cardio,goal)};";
const A_PIPE_R = [
"      var __p0=buildSections(role,w,{fullVariant,wantCarry:d===carryHost,cardio,hotNext});",
"      var __p1=applyInjuryFilter(__p0,cfg);",
"      var __p2=isRecoveryWeek(w)?recoveryDeload(__p1):__p1;",
"      var __p3=capRegionalFatigue(__p2,role,cardio,goal);",
"      if(typeof globalThis!=='undefined'&&globalThis.__PREC)globalThis.__PREC.push({w:String(w),d:String(d),role:String(role),deload:!!isRecoveryWeek(w),p0:globalThis.__SNAP(__p0),p1:globalThis.__SNAP(__p1),p2:globalThis.__SNAP(__p2),p3:globalThis.__SNAP(__p3)});",
"      weeks[w][d]={title,dot:cardio?cardio.type:'lift',tags,cardio,sections:__p3};"
].join("\n");

function instrument2(artifact){
  let RAW = fs.readFileSync(artifact,'utf8');
  [[A_PIPE,A_PIPE_R],[A_CSB,A_CSB_R]].forEach(([a,b],i) => {
    const n = RAW.split(a).length - 1;
    if(n !== 1){ console.log('FAIL: phase2 anchor ' + i + ' count=' + n + ' (expected 1)'); process.exit(5); }
    RAW = RAW.replace(a,b);
  });
  const out = path.join(os.tmpdir(), 'v199p2_' + path.basename(artifact).replace(/[^a-z0-9._]/gi,'_') + '_' + process.pid + '.html');
  fs.writeFileSync(out, RAW);
  return out;
}

const SNAP_FN = "globalThis.__SNAP=function(a){return (a||[]).map(function(s){return {l:String((s&&s.label)||''),n:(((s&&s.items)||[]).map(function(i){return String((i&&i.name)||'');}))};});};";
const secPost = secs => (secs||[]).reduce((a,s)=>a+postCount(s.n||[]),0);

function sweep2(artifact, mine){
  const instrPath = instrument2(artifact);
  const IA = load(instrPath);
  IA.eval(SNAP_FN + "globalThis.__PREC=[];globalThis.__MREC=[];");
  const R = { configs:0, weeks:0, zeroWeeks:0, stage:{}, stageSeg:{}, stageWeekIdx:{},
    deloadInv:0, deloadPostIn:0, deloadPostOut:0, deloadKilled:0, deloadKilledLabels:{},
    deloadKeptLabel:{}, deloadDroppedPostLabel:{},
    injInv:0, injKilled:0, injKilledSeg:{},
    capInv:0, capKilled:0, capKilledLabels:{},
    p0ZeroDays:0, p0ZeroRoles:{}, legRoleDaysNoPost:0, legRoleDayLabels:{},
    zeroWeekRoles:{}, zeroWeekDeloadWeeks:0, zeroWeekAllTaper:0,
    lsbBuilt:0, lsbAtP1:0, lsbAtP2:0, lsbAtP3:0, lsbShipped:0,
    lsaBuilt:0, lsaAtP2:0,
    examples:[] };
  const bump=(o,k)=>{o[k]=(o[k]||0)+1;};

  mine.forEach(L => {
    R.configs++;
    IA.eval('globalThis.__PREC.length=0;globalThis.__MREC.length=0;');
    const prog = IA.buildProgram(L.cfg);
    const PREC = IA.eval('globalThis.__PREC');
    const MREC = IA.eval('globalThis.__MREC');
    const seg = { inj:L.inj, tier:L.tier, focus:L.focus, exp:L.exp, goal:L.goal };
    const wk = {};
    const has = (secs,lab) => (secs||[]).some(s => s.l === lab && (s.n||[]).length);

    PREC.forEach(r => {
      const k = r.w;
      wk[k] = wk[k] || { p0:0,p1:0,p2:0,p3:0,deload:false,roles:{} };
      wk[k].p0 += secPost(r.p0); wk[k].p1 += secPost(r.p1);
      wk[k].p2 += secPost(r.p2); wk[k].p3 += secPost(r.p3);
      if(r.deload) wk[k].deload = true;
      bump(wk[k].roles, r.role);

      if(has(r.p0,'Leg superset B')) R.lsbBuilt++;
      if(has(r.p1,'Leg superset B')) R.lsbAtP1++;
      if(has(r.p2,'Leg superset B')) R.lsbAtP2++;
      if(has(r.p3,'Leg superset B')) R.lsbAtP3++;
      if(has(r.p0,'Leg superset A')) R.lsaBuilt++;
      if(has(r.p2,'Leg superset A')) R.lsaAtP2++;

      const a0=secPost(r.p0), a1=secPost(r.p1), a2=secPost(r.p2), a3=secPost(r.p3);
      R.injInv++; if(a0>0 && a1===0){ R.injKilled++; Object.keys(seg).forEach(x=>bump(R.injKilledSeg,x+'='+seg[x])); }
      if(r.deload){ R.deloadInv++; R.deloadPostIn+=a1; R.deloadPostOut+=a2;
        if(a1>0 && a2===0){ R.deloadKilled++;
          (r.p1||[]).forEach(s=>{ if(postCount(s.n||[])) bump(R.deloadDroppedPostLabel, s.l||'(nolabel)'); });
          (r.p2||[]).forEach(s=>bump(R.deloadKeptLabel, s.l||'(nolabel)')); } }
      R.capInv++; if(a2>0 && a3===0){ R.capKilled++; (r.p2||[]).forEach(s=>{ if(postCount(s.n||[])) bump(R.capKilledLabels, s.l||'(nolabel)'); }); }
      if(a0===0){ R.p0ZeroDays++; bump(R.p0ZeroRoles, r.role);
        if(r.role==='legs'){ R.legRoleDaysNoPost++; (r.p0||[]).forEach(s=>bump(R.legRoleDayLabels, s.l||'(nolabel)')); } }
    });

    const inW = {}; MREC.forEach(r => { inW[r.w]=(inW[r.w]||0)+secPost(IA.eval('globalThis.__SNAP')(r.before)); });
    const W = prog.weeks||{};
    Object.keys(W).forEach(w => {
      R.weeks++;
      let shipped = 0;
      Object.keys(W[w]).forEach(d => { const day=W[w][d]; if(!day||day.rest||!Array.isArray(day.sections)) return;
        (day.sections||[]).forEach(sec => ((sec&&sec.items)||[]).forEach(it => { if(isPost(String((it&&it.name)||''))) shipped++; }));
        if((day.sections||[]).some(s=>String((s&&s.label)||'')==='Leg superset B')) R.lsbShipped++; });
      if(shipped) return;
      R.zeroWeeks++;
      const s = wk[w] || {p0:0,p1:0,p2:0,p3:0,deload:false,roles:{}};
      let stage;
      if(s.p0===0) stage='1 never built (buildSections produced none)';
      else if(s.p1===0) stage='2 applyInjuryFilter';
      else if(s.p2===0) stage='3 recoveryDeload';
      else if(s.p3===0) stage='4 capRegionalFatigue';
      else if((inW[w]||0)===0) stage='5 a pass between p3 and the budget';
      else stage='6 capSessionBudget';
      bump(R.stage, stage);
      Object.keys(seg).forEach(x=>bump(R.stageSeg, stage+'||'+x+'='+seg[x]));
      bump(R.stageWeekIdx, stage+'||W'+w);
      if(s.deload) R.zeroWeekDeloadWeeks++;
      Object.keys(s.roles).forEach(rr=>bump(R.zeroWeekRoles, rr));
      if(R.examples.length<10) R.examples.push({key:L.key, w:'W'+w, stage, p:[s.p0,s.p1,s.p2,s.p3,inW[w]||0], roles:Object.keys(s.roles).join(',')});
    });
  });
  try{ fs.unlinkSync(instrPath); }catch(e){}
  return R;
}

function report2(R){
  const pc=(n,d)=>d?(100*n/d).toFixed(2)+'%':'n/a';
  const top=(o,n)=>Object.keys(o).sort((a,b)=>o[b]-o[a]).slice(0,n).map(k=>k+' '+o[k]);
  console.log('\n══ PHASE 2 — WHERE THE POSTERIOR ITEM IS LOST ════════════════════════════');
  console.log('configs ' + R.configs + '  weeks ' + R.weeks + '  ZERO-POSTERIOR WEEKS ' + R.zeroWeeks);
  console.log('attribution (FIRST pipeline stage at which the week reaches 0 posterior):');
  Object.keys(R.stage).sort().forEach(k => {
    console.log('   ' + k.padEnd(46) + String(R.stage[k]).padStart(5) + ' (' + pc(R.stage[k],R.zeroWeeks) + ')');
    ['inj','tier','focus','goal'].forEach(a => {
      const rows=Object.keys(R.stageSeg).filter(x=>x.indexOf(k+'||'+a+'=')===0).sort((x,y)=>R.stageSeg[y]-R.stageSeg[x]).map(x=>x.split('||')[1]+' '+R.stageSeg[x]);
      console.log('        ' + a.padEnd(6) + ' ' + (rows.length?rows.join('  '):'(none)'));
    });
    const wrows=Object.keys(R.stageWeekIdx).filter(x=>x.indexOf(k+'||W')===0).sort((x,y)=>R.stageWeekIdx[y]-R.stageWeekIdx[x]).map(x=>x.split('||')[1]+' '+R.stageWeekIdx[x]);
    console.log('        week   ' + wrows.join('  '));
  });
  console.log('\nper-PASS kill census (day cells, n=' + R.injInv + ' day builds):');
  console.log('   applyInjuryFilter  took a day from >0 posterior to 0: ' + R.injKilled + ' (' + pc(R.injKilled,R.injInv) + ')');
  console.log('   recoveryDeload     invocations ' + R.deloadInv + ', posterior items in ' + R.deloadPostIn + ' -> out ' + R.deloadPostOut
    + ', days taken >0 -> 0: ' + R.deloadKilled + ' (' + pc(R.deloadKilled,R.deloadInv) + ' of deload day builds)');
  console.log('      section labels holding the posterior item it dropped: ' + top(R.deloadDroppedPostLabel,10).join('  |  '));
  console.log('      section labels it KEPT instead:                       ' + top(R.deloadKeptLabel,10).join('  |  '));
  console.log('   capRegionalFatigue took a day from >0 posterior to 0: ' + R.capKilled + ' (' + pc(R.capKilled,R.capInv) + ')');
  console.log('      labels: ' + top(R.capKilledLabels,8).join('  |  '));
  console.log('\nLeg superset B survival (the day\'s hinge/hip_ext section), day cells:');
  console.log('   built by buildSections ' + R.lsbBuilt + '  -> after injury filter ' + R.lsbAtP1
    + '  -> after deload ' + R.lsbAtP2 + '  -> after regional cap ' + R.lsbAtP3 + '  -> shipped ' + R.lsbShipped);
  console.log('   Leg superset A for comparison: built ' + R.lsaBuilt + ' -> after deload ' + R.lsaAtP2);
  console.log('\ndays whose buildSections output carried NO posterior at all: ' + R.p0ZeroDays
    + '   by role: ' + top(R.p0ZeroRoles,8).join('  '));
  console.log('   role==="legs" days with zero posterior straight out of buildSections: ' + R.legRoleDaysNoPost);
  console.log('      their section labels: ' + top(R.legRoleDayLabels,14).join('  |  '));
  console.log('\nzero-week role composition: ' + top(R.zeroWeekRoles,10).join('  |  ')
    + '   (weeks flagged isRecoveryWeek: ' + R.zeroWeekDeloadWeeks + ')');
  console.log('\nexamples [p0,p1,p2,p3,budgetIn]:');
  (R.examples||[]).forEach(e => console.log('   ' + e.key + ' ' + e.w + '  ' + e.stage + '  ' + JSON.stringify(e.p) + '  roles:' + e.roles));
  console.log('\nPHASE 2 MEASURED ' + R.weeks + ' weeks / ' + R.configs + ' configs. No ruling. No edit.');
}

// ── shard child ────────────────────────────────────────────────────────────────────
if(process.env.MSHARD !== undefined){
  const artifact = process.argv[2];
  const si = parseInt(process.env.MSHARD,10), sn = parseInt(process.env.MSHARDS,10);
  const mine = LAT.filter((_,i) => i % sn === si);
  const R = (process.env.MPHASE === '2') ? sweep2(artifact, mine) : sweep(artifact, mine);
  fs.writeFileSync(process.env.MOUT, JSON.stringify(R));
  process.exit(0);
}

// ── parent ─────────────────────────────────────────────────────────────────────────
const artifact = path.resolve(process.argv[2] || path.join(__dirname,'..','..','index.html'));
const SHARDS = parseInt(process.argv[3] || String(Math.min(8, os.cpus().length)), 10);
const PHASE2 = process.argv.indexOf('--phase2') >= 0;
probe();
const ver = (fs.readFileSync(artifact,'utf8').match(/<meta name="ia-version" content="(\d+)"/)||[])[1];
console.log('ARTIFACT ' + artifact + '  ia-version=' + ver);
console.log('LATTICE  ' + LAT.length + ' config keys, ' + SHARDS + ' shards');

const TL = PHASE2 ? null : tierLegality(artifact);
const LT = PHASE2 ? null : lensTable(artifact);

const tmp = fs.mkdtempSync(path.join(os.tmpdir(),'v199m-'));
let done = 0; const outs = [];
for(let i=0;i<SHARDS;i++){
  const o = path.join(tmp,'s'+i+'.json'); outs.push(o);
  const ch = fork(__filename, [artifact], { env: Object.assign({}, process.env,
    { MSHARD:String(i), MSHARDS:String(SHARDS), MOUT:o, MPHASE: PHASE2?'2':'1' }), stdio:'inherit' });
  ch.on('exit', code => {
    if(code !== 0){ console.log('FAIL: shard ' + i + ' exited ' + code); process.exit(4); }
    if(++done === SHARDS){ if(PHASE2){ let R={}; outs.forEach(o=>R=merge(R,JSON.parse(fs.readFileSync(o,'utf8')))); report2(R); try{outs.forEach(o=>fs.unlinkSync(o));fs.rmdirSync(tmp);}catch(e){} } else report(); }
  });
}
function pct(n,d){ return d ? (100*n/d).toFixed(2)+'%' : 'n/a'; }
function top(o,n){ return Object.keys(o).sort((a,b)=>o[b]-o[a]).slice(0,n).map(k=>k+' '+o[k]); }
function ax(o,a){ const rows = Object.keys(o||{}).filter(k=>k.indexOf(a+'=')===0).sort((x,y)=>o[y]-o[x]).map(k=>k+' '+o[k]); return rows.length?rows.join('  '):'(none)'; }

function report(){
  let R = {};
  outs.forEach(o => R = merge(R, JSON.parse(fs.readFileSync(o,'utf8'))));

  console.log('\n══ 1. THE ZERO-POSTERIOR WEEKS (D88\'s 746) ═══════════════════════════════');
  console.log('PREDICATE: a (config, week) where NO non-rest day in that week carries any item');
  console.log('           whose HAND pattern is hinge or hip_ext. leg_iso is NOT posterior.');
  console.log('configs ' + R.configs + '   weeks ' + R.weeks + '   non-rest day cells ' + R.dayCells + '   leg-loading days ' + R.legDays);
  console.log('ZERO-POSTERIOR WEEKS  ' + R.zeroWeeks + ' / ' + R.weeks + ' (' + pct(R.zeroWeeks,R.weeks) + ')  across '
    + Object.keys(R.zeroWeeksKeys||{}).length + ' config keys / ' + R.configs);
  ['inj','tier','focus','exp','goal','week'].forEach(a => console.log('   ' + a.padEnd(6) + ' ' + ax(R.zSeg,a)));
  console.log('\nDRAW-SIDE vs BUDGET-SIDE (budget-IN posterior count for the whole week):');
  console.log('   DRAW-SIDE  (0 posterior at budget-IN, no budget guard can reach) ' + R.zeroWeeksDrawSide
    + ' / ' + R.zeroWeeks + ' (' + pct(R.zeroWeeksDrawSide,R.zeroWeeks) + ')');
  ['inj','tier','focus','exp','goal'].forEach(a => console.log('      ' + a.padEnd(6) + ' ' + ax(R.zdSeg,a)));
  console.log('   BUDGET-SIDE (had posterior at budget-IN, lost it after) ' + R.zeroWeeksBudgetSide
    + ' / ' + R.zeroWeeks + ' (' + pct(R.zeroWeeksBudgetSide,R.zeroWeeks) + ')');
  ['inj','tier'].forEach(a => console.log('      ' + a.padEnd(6) + ' ' + ax(R.zbSeg,a)));
  console.log('   zero weeks that HAVE a leg-loading day ' + R.zeroWeeksWithLegDay + ', that have none ' + R.zeroWeeksNoLegDay);

  console.log('\n══ 2. THE DRAW ═══════════════════════════════════════════════════════════');
  console.log('EXLIB.leg_accessory (index.html:1589), ' + TL.pool.length + ' members:');
  TL.pool.forEach(n => console.log('   ' + (isPost(n)?'POST ':'  -  ') + n + '   hand=' + (ePat(n)||'null')));
  console.log('legal member set after _gear/_gearOK, per tier (read from the engine\'s own closure):');
  E_TIERS.forEach(t => { const m = TL.byTier[t]||[]; const p = m.filter(isPost);
    console.log('   ' + t.padEnd(11) + ' ' + m.length + '/' + TL.pool.length + ' legal, ' + p.length + ' posterior  [' + m.join(', ') + ']'); });
  console.log('\nlegIso draw (index.html:8342  pick(_laLeft.length>=2?_laLeft:_laGear, 2, blockSeed(w)+105)):');
  console.log('   draws ' + R.draws + '   used the same-card-subtracted pool ' + R.drawUsedIsLeft + ', used the raw gear pool ' + R.drawUsedIsGear);
  console.log('   draws whose POOL held >=1 posterior member  ' + R.drawPoolPostAvail + ' / ' + R.draws + ' (' + pct(R.drawPoolPostAvail,R.draws) + ')');
  console.log('   draws that PICKED >=1 posterior member      ' + R.drawPickedPost + ' / ' + R.draws + ' (' + pct(R.drawPickedPost,R.draws) + ')');
  console.log('   >>> MISSED: posterior available, none picked ' + R.drawMissed + ' / ' + R.drawPoolPostAvail + ' (' + pct(R.drawMissed,R.drawPoolPostAvail) + ')');
  console.log('      by tier: ' + top(R.drawMissedByTier,8).join('  '));
  console.log('      what got picked instead: ' + top(R.drawMissedNames,10).join('  |  '));
  console.log('   used-pool sizes: ' + top(R.drawPoolSizes,14).join('  '));
  console.log('   picked names by tier (top 20): ' + top(R.pickedNamesByTier,20).join('  |  '));
  console.log('   distinct legIso PAIRS per config (freeze check): ' + JSON.stringify(R.drawDistinctPairsPerCfg));
  console.log('   distinct draw seeds per tier (top 12): ' + top(R.drawSeeds,12).join('  '));
  console.log('\nlower-slot draws (index.html:7848 hingeSel / 7849 hipExtSel):');
  console.log('   slot draws ' + R.slots + '   hipExtPool EMPTY ' + R.hipExtPoolEmpty + '   hipExtSel==null ' + R.hipExtNull
    + ' (' + pct(R.hipExtNull,R.slots) + ')');
  console.log('   hipExtSel==null by inj/tier (top 12): ' + top(R.hipExtNullByInj,12).join('  |  '));
  console.log('   hingeSel[0] posterior ' + R.hingeSelPost + ' / ' + R.slots + '   hipExtSel posterior ' + R.hipExtSelPost + ' / ' + R.slots);
  console.log('   pool membership by injury (top 24): ' + top(R.slotPoolNames,24).join('  |  '));
  console.log('\nwhere posterior items DO ship, by section label: ' + top(R.postBySection,12).join('  |  '));
  console.log('by name (top 14): ' + top(R.postByName,14).join('  |  '));
  console.log('\nwhat a ZERO week\'s leg day carries instead — names (top 16): ' + top(R.zeroLegNames,16).join('  |  '));
  console.log('   labels (top 12): ' + top(R.zeroLegLabels,12).join('  |  '));

  console.log('\n══ 3. THE SAME-LENS TABLE ════════════════════════════════════════════════');
  console.log('   ' + 'name'.padEnd(34) + 'engine _pattern'.padEnd(16) + 'hand'.padEnd(10) + 'region'.padEnd(8) + 'D85  hand  g197c');
  LT.forEach(r => console.log('   ' + r.name.padEnd(34) + String(r.enginePattern).padEnd(16) + String(r.handPattern).padEnd(10)
    + String(r.region).padEnd(8) + (r.d85Posterior?'YES ':' no ') + ' ' + (r.handPosterior?'YES ':' no ') + ' ' + (r.g197cPosterior?'YES':' no')));
  console.log('   D85 lens = {hinge,hip_ext} (index.html:9523). g197c lens = {hinge,hip_ext,leg_iso}.');
  console.log('   _PATTERN_REGION (index.html:9311) maps ALL SIX leg patterns to one bucket, "legs".');

  console.log('\n══ 4. SIZING THE CANDIDATE POPULATION (no fix, no design) ════════════════');
  console.log('of the ' + R.zeroWeeks + ' zero-posterior weeks:');
  console.log('   reachable at the legIso slot (that week ran a legIso draw whose pool held a posterior member) '
    + R.flipLegIso + ' (' + pct(R.flipLegIso,R.zeroWeeks) + ')');
  console.log('      ... and the Leg isolation section SURVIVED to the shipped card: ' + R.flipLegIsoSurvives + ' / ' + R.flipLegIso);
  ['inj','tier','goal','focus'].forEach(a => console.log('      ' + a.padEnd(6) + ' ' + ax(R.flipLegIsoSeg,a)));
  console.log('   reachable at a hinge/hipExt slot pool ' + R.flipSlot + ' (' + pct(R.flipSlot,R.zeroWeeks) + ')');
  console.log('   reachable at EITHER ' + R.flipEither + '   reachable at NEITHER ' + R.flipNeither);
  ['inj','tier','goal'].forEach(a => console.log('      NEITHER ' + a.padEnd(6) + ' ' + ax(R.flipNeitherSeg,a)));
  console.log('   UPPER BOUND on a pool-side rule at the legIso slot alone: ' + R.zeroWeeks + ' -> ' + (R.zeroWeeks - R.flipLegIso)
    + ' (and ' + (R.zeroWeeks - R.flipLegIsoSurvives) + ' if the section must also survive the budget)');

  console.log('\n══ 5. D90 CONTEXT — unilateral leg coverage (NOT D88 evidence) ═══════════');
  console.log('leg-loading day cells ' + R.legDays);
  console.log('   with >=1 unilateral item ' + R.uniLegDays + ' (' + pct(R.uniLegDays,R.legDays) + '),  with ZERO ' + R.uniZeroLegDays
    + ' (' + pct(R.uniZeroLegDays,R.legDays) + ')');
  console.log('   unilateral items per leg day: ' + JSON.stringify(R.uniPerLegDay) + '  (total items ' + R.uniItemsTotal + ')');
  console.log('   leg days with NO "Leg superset A" label ' + R.legSupersetAEmpty + ' / ' + R.legDays);
  console.log('   WEEKS with a leg day and zero unilateral items anywhere ' + R.uniWeeksZero + ' / ' + R.weeks);
  ['inj','tier','goal','focus','exp'].forEach(a => console.log('      ' + a.padEnd(6) + ' ' + ax(R.uniZeroSeg,a)));

  console.log('\n══ EXAMPLES (zero-posterior week, leg day) ═══════════════════════════════');
  (R.examples||[]).forEach(e => console.log('  ' + e.key + ' ' + e.cell + '  budgetInPost=' + e.budgetIn
    + '\n      labels: ' + e.labels + '\n      names:  ' + e.names + '\n      draws:  ' + e.draws));
  console.log('\nMEASURED ' + R.weeks + ' weeks / ' + R.dayCells + ' day cells / ' + R.configs + ' configs. No ruling. No edit.');
  try{ outs.forEach(o=>fs.unlinkSync(o)); fs.rmdirSync(tmp); }catch(e){}
}
