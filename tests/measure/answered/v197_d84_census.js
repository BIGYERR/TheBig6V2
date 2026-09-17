// v197_d84_census — builder's verification of D84 (Calves pushed before Leg isolation).
// Builds the same lattice on three artifacts: the candidate, the candidate with the two
// pushes swapped BACK (pre-reorder, derived here by text surgery, count==1 asserted),
// and V196. Prints the changed-cell census, the label delta, the per-injury split, the
// Calves-falls census and the zero-posterior-chain key set.
// Usage: node tests/measure/v197_d84_census.js [cand.html] [v196.html]
const fs = require('fs'), path = require('path'), os = require('os');
const { load, fixtures, progDigest } = require(path.join(__dirname, '..', 'harness.js'));

const CAND = process.argv[2] || path.join(__dirname, '..', '..', 'index.html');
const V196 = process.argv[3] || '/tmp/base_V196.html';
const RAW  = fs.readFileSync(CAND, 'utf8');

// ── derive the pre-reorder artifact: swap the two pushes back ───────────────────────
const CALF_PUSH = "        s.push({label:'Calves',items:[{name:calf,detail:hsets+'×15–20'}]});\n";
const ISO_PUSH  = "        s.push({label:'Leg isolation',superset:_laItems.length>1,rounds:hsets,items:_laItems});\n";
const AFTER  = CALF_PUSH + ISO_PUSH;
const BEFORE = ISO_PUSH + CALF_PUSH;
if (RAW.split(AFTER).length - 1 !== 1) { console.log('ABORT: post-reorder anchor count != 1'); process.exit(1); }
const PRE_PATH = path.join(os.tmpdir(), 'v197_prereorder.html');
fs.writeFileSync(PRE_PATH, RAW.replace(AFTER, BEFORE));

const A = { cand: load(CAND), pre: load(PRE_PATH) };
if (fs.existsSync(V196)) A.v196 = load(V196);
console.log('artifacts: cand + pre-reorder' + (A.v196 ? ' + V196' : ' (NO V196)'));

// ── lattice ─────────────────────────────────────────────────────────────────────────
const TIERS  = ['commercial','home_full','crossfit','home_basic','bodyweight','minimal'];
const FOCUS  = ['hypertrophy','balanced'];
const EXPS   = ['beginner','advanced'];
const GOALS  = [
  { k:'liftonly', id:null },
  { k:'pace',     id:'run_pace_goal' },
  { k:'half',     id:'run_half' },
];
const INJ = [
  { k:'healthy',          v:null },
  { k:'shoulder/protect', v:{ region:'shoulder', tier:'protect' } },
  { k:'lowback/protect',  v:{ region:'lowback',  tier:'protect' } },
  { k:'knee/protect',     v:{ region:'knee',     tier:'protect' } },
];
const RESTS = [ { k:'sun', v:['sun'] }, { k:'sun+wed', v:['sun','wed'] }, { k:'sat+sun', v:['sat','sun'] } ];
const SEEDS = [1013, 3039];

function mkCfg(tier, focus, exp, g, inj, rest, seed) {
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
    ...(inj.v ? { injury: { region: inj.v.region, tier: inj.v.tier } } : {}),
  };
}
const L = [];
for (const t of TIERS) for (const f of FOCUS) for (const e of EXPS) for (const g of GOALS)
  for (const i of INJ) for (const r of RESTS) for (const s of SEEDS)
    L.push({ key:`${t}|${f}|${e}|${g.k}|${i.k}|${r.k}|${s}`, inj:i.k, cfg: mkCfg(t,f,e,g,i,r,s) });
console.log('lattice: ' + L.length + ' configs');

// ── hand pattern table (NOT the engine's _pattern) ──────────────────────────────────
const PAT = [
  ['calf_iso', /calf|calves|plantarflex/i],
  ['hip_ext',  /hip thrust|glute bridge|glute-ham|\bghr\b|nordic|back extension|hyperextension|reverse hyper|pull-?through/i],
  ['leg_iso',  /leg curl|leg extension|hamstring curl/i],
  ['hinge',    /deadlift|\brdl\b|romanian|good morning|\bswing\b|\bclean\b|\bsnatch\b|hinge|rack pull/i],
];
const patOf = n => { const s = String(n||''); for (const [p,r] of PAT) if (r.test(s)) return p; return null; };
const POSTERIOR = new Set(['hinge','hip_ext','leg_iso']);
// hand transcription of the budget's own cost rule (index.html:9418-9421): stretch is free,
// holds and carries are half, everything else is its set count; a missing N× reads as 3.
const _setCount = d => { const m = String(d||'').match(/(\d+)\s*[×x]/); return m ? Math.max(1, parseInt(m[1],10)) : 3; };
const _isStretch = n => /stretch|mobility|90\/90|foam|worlds greatest/i.test(n||'');
const _isHalf = n => /carry|wall sit|\bhold\b|plank|pallof|dead bug|bird dog|hang|l-sit|wiper|hollow|clamshell|side steps|side-lying|leg raises/i.test(n||'');
const dayCost = o => (o.items||[]).reduce((a,it)=> a + (_isStretch(it.n) ? 0 : (_isHalf(it.n) ? _setCount(it.d)*0.5 : _setCount(it.d))), 0);

function scan(IA, cfg) {
  const p = IA.buildProgram(cfg);
  const out = {};
  const W = p.weeks || {};
  Object.keys(W).sort((a,b)=>+a-+b).forEach(w => Object.keys(W[w]).forEach(d => {
    const day = W[w][d]; if (!day || day.rest) return;
    const labels = [], names = [], items = [];
    (day.sections||[]).forEach(sec => { labels.push(String(sec.label||''));
      (sec.items||[]).forEach(it => { names.push(String((it&&it.name)||''));
        items.push({ n:String((it&&it.name)||''), d:String((it&&it.detail)||'') }); }); });
    out[w+'/'+d] = { labels, names, items };
  }));
  return out;
}

const changed = [], calvesLost = { pre:[], v196:[] }, labelDelta = {};
const perInj = {}; INJ.forEach(i => perInj[i.k] = 0);
const netItems = {}; INJ.forEach(i => netItems[i.k] = 0);
const gained = {}, lost = {}, zeroPost = {}, zpNew = {}, zpPre = {}, zp196 = {};
let dayCells = 0, cmp196 = 0, costUp = 0, costDown = 0, maxUp = 0, maxCostCand = 0, over20 = 0; const costUpEg = [];
for (const c of L) {
  let a, b, z;
  try { a = scan(A.cand, c.cfg); b = scan(A.pre, c.cfg); } catch (e) { console.log('THREW ' + c.key + ' ' + e.message); continue; }
  if (A.v196) { try { z = scan(A.v196, c.cfg); } catch (e) { z = null; } }
  for (const dk of Object.keys(a)) {
    dayCells++;
    const A1 = a[dk], B1 = b[dk];
    const has = (o,l) => o.labels.indexOf(l) >= 0;
    // Calves must never FALL, against pre-reorder and against V196
    if (!has(A1,'Calves') && B1 && has(B1,'Calves')) calvesLost.pre.push(c.key + ' ' + dk);
    if (z && z[dk]) { cmp196++; if (!has(A1,'Calves') && has(z[dk],'Calves')) calvesLost.v196.push(c.key + ' ' + dk); }
    // changed cells
    const same = B1 && A1.labels.join('|') === B1.labels.join('|') && A1.names.join('|') === B1.names.join('|');
    if (B1 && !same) {
      changed.push(c.key + ' ' + dk);
      perInj[c.inj]++;
      netItems[c.inj] += (A1.names.length - B1.names.length);
      const ca = {}, cb = {};
      A1.labels.forEach(l => ca[l] = (ca[l]||0)+1);
      B1.labels.forEach(l => cb[l] = (cb[l]||0)+1);
      new Set(Object.keys(ca).concat(Object.keys(cb))).forEach(l => {
        const d = (ca[l]||0) - (cb[l]||0); if (d) labelDelta[l] = (labelDelta[l]||0) + d; });
      const dc = dayCost(A1) - dayCost(B1);
      if (dayCost(A1) > maxCostCand) maxCostCand = dayCost(A1);
      if (dayCost(A1) > 20) over20++;
      if (dc > 0) { costUp++; if (dc > maxUp) maxUp = dc;
        if (costUpEg.length < 3) costUpEg.push(c.key+' '+dk+' +'+dc+' ('+dayCost(B1)+'->'+dayCost(A1)+')'); }
      else if (dc < 0) costDown++;
      const na = {}, nb = {};
      A1.names.forEach(n => na[n] = (na[n]||0)+1);
      B1.names.forEach(n => nb[n] = (nb[n]||0)+1);
      new Set(Object.keys(na).concat(Object.keys(nb))).forEach(n => {
        const d = (na[n]||0) - (nb[n]||0);
        if (d > 0) gained[n] = (gained[n]||0)+d; else if (d < 0) lost[n] = (lost[n]||0)-d; });
    }
    // zero posterior chain, on the candidate, on LEG-ACCESSORY cells only (the cards
    // this block writes to: a 'Calves' or 'Leg isolation' section is present)
    const legCell = o => o && (o.labels.indexOf('Calves')>=0 || o.labels.indexOf('Leg isolation')>=0);
    const zp = o => legCell(o) && !o.names.some(n => POSTERIOR.has(patOf(n)));
    if (zp(A1)) zeroPost[c.key] = (zeroPost[c.key]||0) + 1;
    if (zp(A1) && !zp(B1)) zpNew[c.key] = (zpNew[c.key]||0) + 1;
    if (zp(B1)) zpPre[c.key] = (zpPre[c.key]||0) + 1;
    if (z && z[dk] && zp(z[dk])) zp196[c.key] = (zp196[c.key]||0) + 1;
  }
}

console.log('\nday-cells swept: ' + dayCells + ' (V196-comparable ' + cmp196 + ')');
console.log('changed cells:   ' + changed.length);
console.log('label delta:     ' + JSON.stringify(labelDelta));
console.log('per injury:      ' + JSON.stringify(perInj));
console.log('net items:       ' + JSON.stringify(netItems));
console.log('Calves LOST vs pre-reorder: ' + calvesLost.pre.length + (calvesLost.pre.length?('  e.g. '+calvesLost.pre.slice(0,3).join(' ; ')):''));
console.log('Calves LOST vs V196:        ' + (A.v196 ? calvesLost.v196.length : 'n/a') + (calvesLost.v196.length?('  e.g. '+calvesLost.v196.slice(0,3).join(' ; ')):''));
const top = o => Object.keys(o).sort((x,y)=>o[y]-o[x]).slice(0,8).map(k=>k+' '+o[k]);
console.log('budget cost on changed cells: UP ' + costUp + ' / DOWN ' + costDown + ' maxUp ' + maxUp + ' maxCost ' + maxCostCand + ' over-20 ' + over20 + (costUpEg.length?('  e.g. '+costUpEg.join(' ; ')):''));
console.log('gained items:    ' + JSON.stringify(top(gained)));
console.log('lost items:      ' + JSON.stringify(top(lost)));
const tot = o => Object.keys(o).reduce((a,k)=>a+o[k],0);
console.log('\nzero-posterior LEG cells  cand ' + tot(zeroPost) + ' in ' + Object.keys(zeroPost).length + ' keys'
  + ' | pre-reorder ' + tot(zpPre) + ' in ' + Object.keys(zpPre).length
  + ' | V196 ' + tot(zp196) + ' in ' + Object.keys(zp196).length);
console.log('\nCAUSED BY D84 (zero on cand, not on pre-reorder) — ' + tot(zpNew) + ' cells in ' + Object.keys(zpNew).length + ' keys:');
Object.keys(zpNew).sort().forEach(k => console.log('   ' + zpNew[k] + ' cells  ' + k));
console.log('\nPRE-EXISTING (zero already on pre-reorder):');
Object.keys(zpPre).sort().forEach(k => console.log('   ' + zpPre[k] + ' cells  ' + k));

console.log('\nHALF_MANNY digest cand=' + progDigest(A.cand.buildProgram(fixtures.HALF_MANNY))
          + ' pre=' + progDigest(A.pre.buildProgram(fixtures.HALF_MANNY))
          + (A.v196 ? ' v196=' + progDigest(A.v196.buildProgram(fixtures.HALF_MANNY)) : ''));
