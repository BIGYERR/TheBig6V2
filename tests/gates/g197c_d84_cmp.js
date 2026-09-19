// g197c_d84_cmp — V197 D84: Calves is pushed before Leg isolation. The COMPARISON sweep.
// Section E of the old g197 gate, minus the two baseline-only claims (g197d_d84_base.js).
//
// SPLIT NOTE (V198, tests only). This file was section E (the comparison sweep) of g197_leg_accessory.js. That
// gate ran 58.9s and was 93% of gate.sh's wall time, and an 8-wide fan-out is bounded by
// its slowest member. The 109 assertions were split across g197a_pool_static.js,
// g197b_sweep.js, g197c_d84_cmp.js and g197d_d84_base.js: each lands in exactly one file,
// none dropped, none duplicated, every assertion keeping the bytes and the meaning it had.
// The five sections were proven independent first — 10,441 of 10,441 builds are private to
// their own section, IA.window.__SEC/__DAY have no reader anywhere, and localStorage is
// empty at every boundary — so there is no ordering constraint between the four files.
//
// INTERNAL FAN-OUT, AND WHY IT CHANGES NOTHING. The sweep is 1,728 configs built twice —
// once on the candidate, once on the swapped-back comparison artifact. It is fanned by
// CONFIG INDEX across G197_SHARDS worker processes (default 2, not 8: this gate already
// runs inside gate.sh's own 8-wide fan-out, and two of those eight fork workers of their
// own, so on 8 cores a wider fan-out only buys oversubscription. Measured in-suite: 4
// shards 24.96-25.11s, 2 shards 21.38s, at the same total CPU) and EVERY counter is
// aggregated back into this
// process BEFORE the first assertion runs. Nothing is apportioned: the exact counts, the
// four down-only ratchets, the E4p ratio and the existentials all still see the complete
// lattice and keep the exact meaning they had. A shard is a way to spend four cores on one
// census, never a way to cut the census up.
// Workers ALWAYS exit 0 and are graded from their RESULT FILES. A dead, empty, short or
// unparseable worker prints FAIL E-shard by name; it cannot contribute zero counters in
// silence, and a union that does not cover all 1,728 configs is its own named failure.
// The only thing the fan-out can reorder is the first five EXAMPLES printed inside a
// failure detail string, which are merged in shard order; on a green run every one of
// those lists is empty.
//
// Usage: node tests/gates/g197c_d84_cmp.js <candidate.html> [baseline.html]
//        (the baseline is accepted and ignored; g197d_d84_base.js owns every baseline claim)
// Internal: --shard i/N --out <json> --cmp <html>   worker mode, never called by hand.
const fs   = require('fs');
const path = require('path');
const cp   = require('child_process');
const { load } = require(path.join(__dirname, '..', 'harness.js'));

var SHARD_I = null, SHARD_N = 0, OUT = '', CMP_PATH = '';
const POS = [];
{
  const a = process.argv.slice(2);
  for (let i = 0; i < a.length; i++) {
    if (a[i] === '--shard') { const m = String(a[++i] || '').split('/'); SHARD_I = parseInt(m[0], 10); SHARD_N = parseInt(m[1], 10); }
    else if (a[i] === '--out') OUT = a[++i];
    else if (a[i] === '--cmp') CMP_PATH = a[++i];
    else POS.push(a[i]);
  }
}
const WORKER = SHARD_I !== null;
const FILE = POS[0] || path.join(__dirname, '..', '..', 'index.html');
const RAW  = fs.readFileSync(FILE, 'utf8');
const IA   = load(FILE);
if (WORKER) console.log = function () {};   // a worker writes counters, never a verdict

let pass = 0, fail = 0;
function ok(name, cond, detail) {
  if (cond) { pass++; console.log('ok   ' + name); }
  else { fail++; console.log('FAIL ' + name + (detail !== undefined ? '  -> ' + detail : '')); }
}

// ── retaining DOM stub (the V195 lesson): the harness hands out a FRESH element per
// getElementById, so an innerHTML write lands on a throwaway and a read-back sees
// nothing. Anything that renders below reads its output back through this. ──────────
const DOM_STUB = "__g197mk=function(id){return {id:id,tagName:'DIV',textContent:'',innerHTML:'',value:'',placeholder:'',style:{},dataset:{},children:[],"
  + "classList:{add:function(){},remove:function(){},toggle:function(){},contains:function(){return false;}},"
  + "setAttribute:function(){},getAttribute:function(){return null;},removeAttribute:function(){},hasAttribute:function(){return false;},"
  + "appendChild:function(c){return c;},removeChild:function(c){return c;},insertBefore:function(c){return c;},remove:function(){},"
  + "replaceChildren:function(){},scrollTo:function(){},scrollIntoView:function(){},focus:function(){},blur:function(){},click:function(){},"
  + "addEventListener:function(){},removeEventListener:function(){},querySelector:function(){return null;},querySelectorAll:function(){return[];},"
  + "closest:function(){return null;},getBoundingClientRect:function(){return {top:0,left:0,right:0,bottom:0,width:0,height:0};},"
  + "offsetWidth:0,offsetHeight:0,scrollTop:0,scrollHeight:0,clientHeight:0};};"
  + "__g197els={};document.getElementById=function(id){if(!__g197els[id])__g197els[id]=__g197mk(id);return __g197els[id];};"
  + "document.querySelectorAll=function(){return[];};document.querySelector=function(){return null;};";
try { IA.eval(DOM_STUB); } catch (e) { console.log('FAIL dom-stub install -> ' + e.message); fail++; }


// ── SCRATCH. One private mkdtemp directory per process, created only in the parent and
// removed on EVERY exit path including a throw (process.on('exit')). The old gate wrote
// os.tmpdir()/g197_d84_cmp_<pid>.html and unlinked it after the sweep — a path that
// load() could skip by throwing, and the file leaked. Nothing named g197_d84_cmp_* is
// written any more, and two concurrent runs cannot collide because mkdtemp owns the name.
var SCRATCH = '';
function cleanup() { try { if (SCRATCH) fs.rmSync(SCRATCH, { recursive: true, force: true }); } catch (e) {} SCRATCH = ''; }
process.on('exit', cleanup);
function done() { cleanup(); console.log('\nPASS ' + pass + ' FAIL ' + fail); process.exit(fail ? 1 : 0); }

// ════════════════════════════════════════════════════════════════════════════════════
// E. V197 (D84) — CALVES IS PUSHED BEFORE LEG ISOLATION
//
// capSessionBudget's trim tie-break scores a section (_secRank*10 + _itemRank) and breaks
// a tie by POSITION, later loses first. 'Calves' and 'Leg isolation' both score 2/0, so on
// a day over budget the section pushed SECOND is the one evicted. Before D84 that was
// Calves: the card dropped its only loaded plantarflexion and kept an isolation slot that
// was a third repetition of a pattern already run twice. D84 swaps the push order. Nothing
// else moves — no cap, no rank function, no pool, no seed.
//
// ORACLES here, none of them the engine's own output:
//   - the COMPARISON ARTIFACT is this same file with the two push lines swapped back, built
//     here by text surgery with an exact-count assert. Both artifacts are then swept on the
//     same lattice, so every difference is attributable to the push order and nothing else.
//   - the direction of every claim ("Calves must never fall", "exactly two labels move",
//     "posterior-free cells stay inside bodyweight + lowback/protect") is the RULING, typed
//     out below. The engine is never asked what it thinks the answer should be.
//   - the budget cost function is hand-transcribed from the cap's own rule, and the
//     posterior-chain classifier is a hand regex table with its own blindness probe.
//   - the four config keys of the known, confined cost are typed from the ruling.
// ════════════════════════════════════════════════════════════════════════════════════
console.log('\n-- E. D84: Calves before Leg isolation --');
const os = require('os');
const CALF_PUSH = "        s.push({label:'Calves',items:[{name:calf,detail:hsets+'×15–20'}]});\n";
const ISO_PUSH  = "        s.push({label:'Leg isolation',superset:_laItems.length>1,rounds:hsets,items:_laItems});\n";
const D84_ORDER = CALF_PUSH + ISO_PUSH;   // after D84
const OLD_ORDER = ISO_PUSH + CALF_PUSH;   // before D84

// ── E0: the source shape D84 asserts ────────────────────────────────────────────────
const nCalf = RAW.split(CALF_PUSH).length - 1;
const nIso  = RAW.split(ISO_PUSH).length - 1;
ok('E0a the Calves push exists exactly once', nCalf === 1, 'count=' + nCalf);
ok('E0b the Leg isolation push exists exactly once', nIso === 1, 'count=' + nIso);
const hasNew = (RAW.split(D84_ORDER).length - 1) === 1;
const hasOld = (RAW.split(OLD_ORDER).length - 1) === 1;
ok('E0c D84 order: Calves is pushed BEFORE Leg isolation', hasNew && !hasOld,
   hasOld ? 'the pre-D84 order is still in the file' : 'neither order found as an adjacent pair');
// comparison artifact: the same file with the pair swapped, whichever way round it sits.
let CMP = null, cmpWhy = '';
if (hasNew)      { CMP = RAW.replace(D84_ORDER, OLD_ORDER); cmpWhy = 'pre-D84 order'; }
else if (hasOld) { CMP = RAW.replace(OLD_ORDER, D84_ORDER); cmpWhy = 'post-D84 order'; }
ok('E0d a comparison artifact could be derived by swapping the two pushes', !!CMP,
   'neither push order is present as an adjacent pair — the block was edited, not reordered');

// ── the lattice: every tier, every injury state. lattice193.WIDE carries no injured
// athlete at all, and section B above is healthy-only, which is exactly how a regression
// that only bites a protected knee or a protected low back gets through. ─────────────
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
    ...(inj.v ? { injury:{ region: inj.v.region, tier: inj.v.tier } } : {}),
  };
}
const E_L = [];
for (const t of E_TIERS) for (const f of E_FOCUS) for (const x of E_EXPS) for (const g of E_GOALS)
  for (const i of E_INJ) for (const r of E_RESTS) for (const sd of E_SEEDS)
    E_L.push({ key:`${t}|${f}|${x}|${g.k}|${i.k}|${r.k}|${sd}`, tier:t, inj:i.k, cfg:eCfg(t,f,x,g,i,r,sd) });

// ── hand tables ─────────────────────────────────────────────────────────────────────
// posterior chain, by name. Written here, not read from _pattern.
const E_PAT = [
  ['calf_iso', /calf|calves|plantarflex/i],
  ['hip_ext',  /hip thrust|glute bridge|glute-ham|\bghr\b|nordic|back extension|hyperextension|reverse hyper|pull-?through/i],
  ['leg_iso',  /leg curl|leg extension|hamstring curl/i],
  ['hinge',    /deadlift|\brdl\b|romanian|good morning|\bswing\b|\bclean\b|\bsnatch\b|hinge|rack pull/i],
];
const ePat = n => { const t = String(n||''); for (const [p,r] of E_PAT) if (r.test(t)) return p; return null; };
// THE SHIPPED LENS, and nothing wider. index.html:9523 (D85, V198) tests
// {hinge, hip_ext} and states the exclusion in terms: leg_iso is DELIBERATELY EXCLUDED
// because EXLIB.leg_accessory holds 'Leg extension' and 'Leg press' alongside
// 'Lying leg curl'. leg_iso is a SLOT, not a muscle — it carries pure quad movements, so
// it is not a posterior signal. This gate read {hinge, hip_ext, leg_iso} until V198
// tooling slice D, which made it count a leg extension as posterior chain and so let a
// card the engine calls posterior-free read as covered. A gate whose lens is wider than
// the guard's cannot see the guard's own boundary.
const E_POSTERIOR = new Set(['hinge','hip_ext']);
// one copy of the predicate, shared by the CAUSED census (E3b) and the TOTAL census
// (E3e-E3g). A leg cell is one carrying either leg accessory label; it is posterior-free
// when no name on the card reads as hinge or hip extension (the shipped lens; leg
// isolation is not posterior, see above).
const eLegCell = o => o.labels.indexOf('Calves') >= 0 || o.labels.indexOf('Leg isolation') >= 0;
const eZeroP   = o => eLegCell(o) && !o.names.some(n => E_POSTERIOR.has(ePat(n)));
// the budget's own cost rule, hand-transcribed: stretch is free, holds and carries are
// half, everything else is its set count, and a detail with no N× reads as three.
const eSets    = d => { const m = String(d||'').match(/(\d+)\s*[×x]/); return m ? Math.max(1, parseInt(m[1],10)) : 3; };
const eStretch = n => /stretch|mobility|90\/90|foam|worlds greatest/i.test(n||'');
const eHalf    = n => /carry|wall sit|\bhold\b|plank|pallof|dead bug|bird dog|hang|l-sit|wiper|hollow|clamshell|side steps|side-lying|leg raises/i.test(n||'');
const eCost    = cell => cell.items.reduce((a,it) => a + (eStretch(it.n) ? 0 : (eHalf(it.n) ? eSets(it.d)*0.5 : eSets(it.d))), 0);
// the ruling's own list of the known, confined cost (D85 owns the fix, V198)
const D85_KEYS = [
  'bodyweight|hypertrophy|beginner|half|lowback/protect|sun|1013',
  'bodyweight|hypertrophy|beginner|half|lowback/protect|sun+wed|3039',
  'bodyweight|hypertrophy|beginner|pace|lowback/protect|sun+wed|1013',
  'bodyweight|hypertrophy|beginner|pace|lowback/protect|sat+sun|3039',
];
// ── E3a: the posterior-chain detector is not blind (probe, no engine involved) ───────
{
  const blind = { labels:['Calves'], names:['Back squat','Dumbbell bench press','Dumbbell standing calf raise'],
                  items:[] };
  const seeing = { labels:['Calves'], names:['Back squat','Nordic hamstring curl (anchored)'], items:[] };
  const zero = eZeroP;   // the function the sweep actually uses, not a re-typed copy
  ok('E3a detector probe: a card with squat + press + calf raise reads as posterior-free', zero(blind));
  ok('E3a detector probe: adding a Nordic makes the same card read as posterior-covered', !zero(seeing));
  // E3a lens probe (V198 tooling slice E). The ONLY assertion of the shipped lens that
  // exists. index.html:9523 (D85, V198) tests {hinge, hip_ext} and excludes leg_iso in
  // terms: EXLIB.leg_accessory holds 'Leg extension' and 'Leg press' beside 'Lying leg
  // curl', so leg_iso is a SLOT, not a muscle, and a quad movement is not a posterior
  // signal (Mario, V198 ruling). Why a hand card and not a sweep: gatekeeper's full
  // lattice probe read 2879 leg cells, 31 naming leg_iso, and all 31 ALSO named
  // hinge/hip_ext — 0 cells can distinguish the narrow lens from the wide one, so no
  // lattice sweep and no app mutation can ever red a widening. This line can.
  const lens = { labels:['Leg isolation'], names:['Back squat','Leg extension'], items:[] };
  ok('E3a lens probe: a card with squat + leg extension reads as posterior-free (leg_iso is a slot, not a muscle)',
     zero(lens));
}

// ── the sweep ───────────────────────────────────────────────────────────────────────
function eScan(IA_, cfg) {
  const p = IA_.buildProgram(cfg); const out = {}; const W = p.weeks || {};
  Object.keys(W).forEach(w => Object.keys(W[w]).forEach(d => {
    const day = W[w][d]; if (!day || day.rest) return;
    const labels = [], names = [], items = [];
    (day.sections||[]).forEach(sec => { labels.push(String(sec.label||''));
      (sec.items||[]).forEach(it => { const n = String((it&&it.name)||'');
        names.push(n); items.push({ n, d:String((it&&it.detail)||'') }); }); });
    out[w + '/' + d] = { labels, names, items };
  }));
  return out;
}
let eCells = 0, eChanged = 0, eFell = 0, eRose = 0, eThrew = 0, eCostOut = 0;
let eCostDown = 0, eCostMax = -Infinity;                       // D87: direction and observed peak
let eOverA = 0, eOverUnchanged = 0, eOverIntroduced = 0;       // D87: the cap census
let eZeroAllCells = 0;                                         // D86: the TOTAL posterior-free population
const eFellEg = [], eCostEg = [], eCostDownEg = [], eLabelDelta = {}, eZeroNew = {}, eZeroAll = {},
      eInjSeen = {}, eTierSeen = {};
// ── D87: the Δcost ceiling is DERIVED from the file's own table, not asserted in prose.
// The residual between the two push orders is one accessory slot. The Calves section is
// exactly ONE item carrying hsets sets (CALF_PUSH above), and hsets is declared
// `cfg.experience==='advanced'?4:3` at every site in the file. So the most a single
// Calves slot can cost is (items × max hsets) = 4, and Δcost cannot exceed it. Parsed
// here, so an edit that changes the section's item count or the hsets table MOVES this
// ceiling instead of silently falsifying a hard-coded 4.
const HSETS_VALS = [];
{ const re = /const hsets\s*=\s*cfg\.experience\s*===\s*'advanced'\s*\?\s*(\d+)\s*:\s*(\d+);/g;
  let m; while ((m = re.exec(RAW))) HSETS_VALS.push([parseInt(m[1],10), parseInt(m[2],10)]); }
const HSETS_MAX  = HSETS_VALS.length ? Math.max.apply(null, HSETS_VALS.map(v => Math.max(v[0], v[1]))) : 0;
const CALF_ITEMS = (CALF_PUSH.match(/\{name:/g) || []).length;
const E_SLOT_MAX = HSETS_MAX * CALF_ITEMS;
const E_CAP      = parseInt(((RAW.match(/const SESSION_SET_BUDGET = (\d+);/) || [])[1] || '0'), 10);
ok('E4h the hsets table parses and every site agrees (the ceiling has a source)',
   HSETS_VALS.length >= 3 && HSETS_VALS.every(v => v[0] === HSETS_VALS[0][0] && v[1] === HSETS_VALS[0][1]),
   JSON.stringify(HSETS_VALS));
ok('E4i the Calves section is exactly one item, dosed off hsets',
   CALF_ITEMS === 1 && /detail:hsets\+/.test(CALF_PUSH), 'items=' + CALF_ITEMS);
ok('E4j the derived one-slot ceiling is a positive number of sets', E_SLOT_MAX > 0, E_SLOT_MAX);
ok('E4k the cap value parses out of the file (not typed here)', E_CAP > 0, E_CAP);
console.log('   derived: hsets max ' + HSETS_MAX + ' × ' + CALF_ITEMS + ' Calves item = Δcost ceiling '
  + E_SLOT_MAX + ' sets; cap read from the file = ' + E_CAP);

// ── THE SWEEP. Fanned across workers, aggregated in full, and only then asserted. ─────
// G197_SHARDS: empty or unset means 2. Only a POSITIVE integer is accepted — 0, negative
// and non-numeric are rejected, never clamped, exactly as GATE_JOBS and FUZZ_SHARDS are.
// A bad value is a CONFIGURATION error and it is reported as a FAIL with a summary line,
// because gate.sh reads a missing summary as a crash.
function shardCount() {
  const raw = process.env.G197_SHARDS === undefined ? '' : String(process.env.G197_SHARDS);
  if (raw === '') return 2;
  if (!/^[0-9]+$/.test(raw) || parseInt(raw, 10) < 1) {
    fail++; console.log("FAIL: CONFIG: G197_SHARDS must be a positive integer, or empty/unset which means 2; got '" + raw + "'");
    return 0;
  }
  return parseInt(raw, 10);
}
function shardResult(walked) {
  return { ok: true, n: walked, eCells: eCells, eChanged: eChanged, eFell: eFell, eRose: eRose,
           eThrew: eThrew, eCostOut: eCostOut, eCostDown: eCostDown,
           eCostMax: (eCostMax === -Infinity ? null : eCostMax),
           eOverA: eOverA, eOverUnchanged: eOverUnchanged, eOverIntroduced: eOverIntroduced,
           eZeroAllCells: eZeroAllCells, eFellEg: eFellEg, eCostEg: eCostEg, eCostDownEg: eCostDownEg,
           eLabelDelta: eLabelDelta, eZeroNew: eZeroNew, eZeroAll: eZeroAll,
           eInjSeen: eInjSeen, eTierSeen: eTierSeen };
}
function absorb(j) {
  eCells += j.eCells; eChanged += j.eChanged; eFell += j.eFell; eRose += j.eRose;
  eThrew += j.eThrew; eCostOut += j.eCostOut; eCostDown += j.eCostDown;
  eOverA += j.eOverA; eOverUnchanged += j.eOverUnchanged; eOverIntroduced += j.eOverIntroduced;
  eZeroAllCells += j.eZeroAllCells;
  if (j.eCostMax !== null && j.eCostMax > eCostMax) eCostMax = j.eCostMax;
  Array.prototype.push.apply(eFellEg, j.eFellEg);
  Array.prototype.push.apply(eCostEg, j.eCostEg);
  Array.prototype.push.apply(eCostDownEg, j.eCostDownEg);
  [[j.eLabelDelta, eLabelDelta], [j.eZeroNew, eZeroNew], [j.eZeroAll, eZeroAll],
   [j.eInjSeen, eInjSeen], [j.eTierSeen, eTierSeen]].forEach(function (t) {
    Object.keys(t[0]).forEach(function (k) { t[1][k] = (t[1][k] || 0) + t[0][k]; });
  });
}

function runShard() {
  var walked = 0;
  try {
    if (!CMP_PATH) throw new Error('worker started with no --cmp artifact');
    const IA_CMP = load(CMP_PATH);
    for (let _ci = 0; _ci < E_L.length; _ci++) {
      if (_ci % SHARD_N !== SHARD_I) continue;
      const c = E_L[_ci];
      walked++;
      let A1s, B1s;
      try { A1s = eScan(IA, c.cfg); B1s = eScan(IA_CMP, c.cfg); } catch (e) { eThrew++; continue; }
      eInjSeen[c.inj] = 1; eTierSeen[c.tier] = 1;
      for (const dk of Object.keys(A1s)) {
        const A1 = A1s[dk], B1 = B1s[dk]; if (!B1) continue;
        eCells++;
        const hasL = (o,l) => o.labels.indexOf(l) >= 0;
        if (!hasL(A1,'Calves') && hasL(B1,'Calves')) { eFell++; if (eFellEg.length < 5) eFellEg.push(c.key + ' ' + dk); }
        if (hasL(A1,'Calves') && !hasL(B1,'Calves')) eRose++;
        const same = A1.labels.join('|') === B1.labels.join('|') && A1.names.join('|') === B1.names.join('|');
        // ── D87 cap census, over EVERY cell and not only the changed ones. A cell that is
        // over the cap AND byte-identical to the pre-D84 artifact was over the cap before
        // D84 existed. That is the whole of the claim.
        const costA = eCost(A1), costB = eCost(B1);
        if (costA > E_CAP) { eOverA++; if (same) eOverUnchanged++; else if (costB <= E_CAP) eOverIntroduced++; }
        // ── D86 total census: posterior-free leg cells in the shipped artifact, caused by
        // the reorder or pre-existing. The ratchet below is a ceiling on this population.
        if (eZeroP(A1)) { eZeroAllCells++; eZeroAll[c.key] = (eZeroAll[c.key] || 0) + 1; }
        if (same) continue;
        eChanged++;
        const ca = {}, cb = {};
        A1.labels.forEach(l => ca[l] = (ca[l]||0)+1);
        B1.labels.forEach(l => cb[l] = (cb[l]||0)+1);
        new Set(Object.keys(ca).concat(Object.keys(cb))).forEach(l => {
          const d = (ca[l]||0) - (cb[l]||0); if (d) eLabelDelta[l] = (eLabelDelta[l]||0) + d; });
        const dc = costA - costB;
        if (dc > E_SLOT_MAX) { eCostOut++; if (eCostEg.length < 5) eCostEg.push(c.key + ' ' + dk + ' Δ' + dc); }
        if (dc < 0) { eCostDown++; if (eCostDownEg.length < 5) eCostDownEg.push(c.key + ' ' + dk + ' Δ' + dc); }
        if (dc > eCostMax) eCostMax = dc;
        if (eZeroP(A1) && !eZeroP(B1)) eZeroNew[c.key] = (eZeroNew[c.key]||0) + 1;
      }
    }
    fs.writeFileSync(OUT, JSON.stringify(shardResult(walked)));
  } catch (e) {
    try { fs.writeFileSync(OUT, JSON.stringify({ ok: false, n: walked, err: String((e && e.message) || e) })); } catch (e2) {}
  }
  process.exit(0);   // ALWAYS 0. The parent grades the FILE, never the exit code.
}

function mergeShards(outs, errs, N) {
  let walked = 0;
  for (let i = 0; i < N; i++) {
    let j = null;
    try { const t = fs.readFileSync(outs[i], 'utf8'); if (t) j = JSON.parse(t); } catch (e) {}
    if (!j || j.ok !== true) {
      fail++;
      console.log('FAIL E-shard ' + i + '/' + N + ' produced no usable counters'
        + (j && j.err ? ' -> ' + j.err : '') + (errs[i] ? ' | stderr: ' + errs[i].slice(-400).trim() : ''));
      continue;
    }
    if (!j.n) { fail++; console.log('FAIL E-shard ' + i + '/' + N + ' walked 0 configs'); }
    walked += j.n; absorb(j);
  }
  [eFellEg, eCostEg, eCostDownEg].forEach(function (a) { if (a.length > 5) a.length = 5; });
  if (walked !== E_L.length) {
    fail++;
    console.log('FAIL E-shard union walked ' + walked + ' of ' + E_L.length + ' configs (the lattice was not covered)');
  }
  console.log('   swept ' + E_L.length + ' configs (' + cmpWhy + ' comparison), ' + eCells + ' day-cells, ' + eThrew + ' threw');
  afterSweep();
}

function runParent() {
  if (!CMP) { console.log('   no comparison artifact — E1/E2/E3b cannot run'); return afterSweep(); }
  const N = shardCount();
  if (!N) return afterSweep();
  SCRATCH = fs.mkdtempSync(path.join(os.tmpdir(), 'g197cmp-'));
  const cmpFile = path.join(SCRATCH, 'cmp.html');
  fs.writeFileSync(cmpFile, CMP);
  const outs = [], errs = [];
  let live = N;
  for (let i = 0; i < N; i++) {
    const of = path.join(SCRATCH, 'shard_' + i + '.json');
    outs.push(of); errs.push('');
    const ch = cp.spawn(process.execPath,
      [__filename, FILE, '--cmp', cmpFile, '--shard', i + '/' + N, '--out', of],
      { stdio: ['ignore', 'ignore', 'pipe'] });
    let fired = false;
    const fin = function () { if (fired) return; fired = true; if (--live === 0) mergeShards(outs, errs, N); };
    ch.stderr.on('data', function (d) { errs[i] += String(d); });
    ch.on('error', function (e) { errs[i] += String((e && e.message) || e); fin(); });
    ch.on('close', fin);
  }
}

function afterSweep() {
const ranE = !!CMP && eCells > 0;

// ── E1: two-sided. Calves may not fall ANYWHERE, on any injury state, on any tier ────
ok('E1a the sweep ran and covers day-cells', ranE, eCells + ' cells');
ok('E1b all four injury states built', Object.keys(eInjSeen).length === 4, Object.keys(eInjSeen).join(','));
ok('E1c all six equipment tiers built', Object.keys(eTierSeen).length === 6, Object.keys(eTierSeen).join(','));
ok('E1d no build threw', eThrew === 0, eThrew);
ok('E1e Calves FALLS on zero day-cells (the side a "it rose" assertion cannot see)',
   ranE && eFell === 0, eFell + ' cells lost Calves, e.g. ' + eFellEg.join(' ; '));
ok('E1f Calves RISES somewhere: D84 is actually in the artifact', ranE && eRose > 0, eRose);
// ── E2: exactly two labels move. A third is an unruled removal ───────────────────────
{
  const moved = Object.keys(eLabelDelta).filter(l => eLabelDelta[l] !== 0).sort();
  ok('E2a exactly two section labels move', ranE && moved.length === 2, JSON.stringify(eLabelDelta));
  ok('E2b the two are Calves and Leg isolation',
     ranE && moved.length === 2 && moved.indexOf('Calves') >= 0 && moved.indexOf('Leg isolation') >= 0,
     JSON.stringify(moved));
  ok('E2c Calves rises and Leg isolation falls (the ruled direction)',
     ranE && eLabelDelta['Calves'] > 0 && eLabelDelta['Leg isolation'] < 0, JSON.stringify(eLabelDelta));
  console.log('   label delta: ' + JSON.stringify(eLabelDelta) + ' over ' + eChanged + ' changed day-cells');
}

// ── E3b: the known cost stays confined. SET membership, never a count: V198's posterior
// floor (D85) drives this set toward empty and must not have to edit this gate, while any
// drift outside the ruled family prints the offending config key by name. ─────────────
{
  const found = Object.keys(eZeroNew).sort();
  const inFamily = k => { const p2 = k.split('|');
    return p2[0] === 'bodyweight' && p2[1] === 'hypertrophy' && p2[4] === 'lowback/protect'; };
  const out = found.filter(k => !inFamily(k));
  const causedCells = found.reduce((a, k) => a + eZeroNew[k], 0);
  console.log('   posterior-free leg cells CAUSED by the reorder: ' + found.length + ' config keys, '
    + causedCells + ' cells');
  found.forEach(k => console.log('      ' + eZeroNew[k] + ' cells  ' + k + (D85_KEYS.indexOf(k) >= 0 ? '   <- named in the ruling' : '')));
  ok('E3b every posterior-free cell the reorder creates is bodyweight + hypertrophy + lowback/protect (D85 owns the fix)',
     ranE && out.length === 0, JSON.stringify(out));

  // ── D86 RATCHET. The predicate above names the MECHANISM: lowback/protect strips the
  // hinge rail before the budget runs, so the leg day reaches capSessionBudget with one
  // posterior piece instead of three and any tie-break evicting it lands on zero. Healthy,
  // knee/protect and shoulder/protect still have a hinge to spare and never do this.
  // A predicate alone is LOOSE: it would swallow a new defect landing inside the same
  // family. These four ceilings are one-sided and DOWN-ONLY, so V198's D85 drives them
  // toward zero and this gate TIGHTENS rather than going red. The predicate catches a
  // defect that escapes the family; the ratchet catches one that hides inside it.
  //
  // COACH'S COUNTER, recorded here so nobody reads these four as engine facts: a ratchet
  // pinned to today's census is a number with a date on it. If V198's D85 lands mid-
  // lattice, someone has to RE-BASELINE these from a fresh census rather than read them
  // as a property of the engine.
  // PROVENANCE: this gate's own E-sweep on V197 (2026-09-16) and tests/measure/
  // v197_d84_census.js — 18 keys / 120 cells caused, 33 keys / 186 cells total.
  const RATCHET = { causedCells: 120, causedKeys: 18, totalCells: 186, totalKeys: 33 };
  ok('E3c ratchet: cells the reorder makes posterior-free <= ' + RATCHET.causedCells + ' (down-only)',
     ranE && causedCells <= RATCHET.causedCells, causedCells);
  ok('E3d ratchet: config keys the reorder makes posterior-free <= ' + RATCHET.causedKeys + ' (down-only)',
     ranE && found.length <= RATCHET.causedKeys, found.length);
  // The CAUSED set is the narrow family (bodyweight + hypertrophy + lowback/protect).
  // The PRE-EXISTING set is wider in focus and tier, but shares the one MECHANISM that
  // makes any of it possible: lowback/protect strips the hinge rail before the budget
  // runs, so a leg day reaches capSessionBudget with one posterior piece instead of
  // three and any eviction lands on zero. Healthy, knee/protect and shoulder/protect
  // always keep a hinge to spare. So the TOTAL population is asserted against the
  // mechanism, not against the caused family.
  const carriesLowback = k => k.split('|')[4] === 'lowback/protect';
  const allKeys = Object.keys(eZeroAll).sort();
  const preKeys = allKeys.filter(k => found.indexOf(k) < 0);
  const outAll  = allKeys.filter(k => !carriesLowback(k));
  console.log('   posterior-free leg cells TOTAL in the artifact (caused + pre-existing): '
    + eZeroAllCells + ' cells over ' + allKeys.length + ' config keys; '
    + preKeys.length + ' of those keys pre-date the reorder:');
  preKeys.forEach(k => console.log('      ' + eZeroAll[k] + ' cells  ' + k + '   <- pre-existing'));
  ok('E3e every posterior-free leg cell in the artifact, caused or pre-existing, carries lowback/protect (the mechanism)',
     ranE && outAll.length === 0, JSON.stringify(outAll));
  ok('E3f ratchet: total posterior-free leg cells <= ' + RATCHET.totalCells + ' (down-only)',
     ranE && eZeroAllCells <= RATCHET.totalCells, eZeroAllCells);
  ok('E3g ratchet: total posterior-free leg config keys <= ' + RATCHET.totalKeys + ' (down-only)',
     ranE && allKeys.length <= RATCHET.totalKeys, allKeys.length);
  D85_KEYS.forEach(k => console.log('   ruling key ' + k + ': ' + (eZeroNew[k] || 0) + ' cells'));
}

// ── E4: the cap was not raised. The ruling swaps which item is evicted, nothing else ──
{
  const budgets = RAW.match(/const SESSION_SET_BUDGET = (\d+);/g) || [];
  ok('E4a SESSION_SET_BUDGET is still declared exactly once', budgets.length === 1, budgets.join(' '));
  ok('E4b SESSION_SET_BUDGET is still 20', budgets.length === 1 && /= 20;/.test(budgets[0]), budgets[0]);
  ok('E4c the trim tie-break still resolves a tie to the LATER position (that is what D84 uses)',
     /score===best\.score && pos>best\.pos/.test(RAW.replace(/\s+/g, ' ')) ||
     /score === best\.score && pos > best\.pos/.test(RAW.replace(/\s+/g, ' ')),
     'the pos>best.pos tie-break is gone — the reorder no longer decides anything');
  // ── D87: Δcost ∈ [0, E_SLOT_MAX], where the ceiling is DERIVED above from the file's
  // own hsets table and the Calves section's item count. Not prose, and it survives an
  // edit that changes either one.
  ok('E4d no changed day-cell costs more than one derived accessory slot (Δ <= ' + E_SLOT_MAX
     + ', from hsets ' + HSETS_MAX + ' × ' + CALF_ITEMS + ' item)',
     ranE && eCostOut === 0, eCostOut + ' cells, e.g. ' + eCostEg.join(' ; '));
  ok('E4l no changed day-cell moves DOWN (Δ >= 0: one direction, so this is a residual and not a redistribution)',
     ranE && eCostDown === 0, eCostDown + ' cells, e.g. ' + eCostDownEg.join(' ; '));
  console.log('   Δcost observed max ' + (eCostMax === -Infinity ? 'n/a' : eCostMax)
    + ' against a derived ceiling of ' + E_SLOT_MAX + ' (informational, not an assertion)');

  // ── D87: the cap has never been hard where protected work alone exceeds it, and that
  // predates D84 by four versions. The trim is a THRESHOLD test, not a minimisation:
  //   while(_total(out)>cap && guard++<16){ ... if(!best) break; }   (index.html:9503-9519)
  // When every remaining item is protected, _compoundTier 3 or zero-cost, `best` is null
  // and the loop LEAVES the day over the cap. Stated here as a fact about the baseline so
  // nobody later reads an over-cap card as a V197 regression.
  const flat = RAW.replace(/\s+/g, ' ');
  ok('E4m the trim is a threshold loop, not a minimiser: while(_total(out)>cap && guard++<16)',
     (flat.split('while(_total(out)>cap && guard++<16)').length - 1) === 1,
     'the threshold loop is not in the file in that shape');
  ok('E4n the trim bails out when only protected work is left: if(!best) break',
     (flat.split('if(!best) break;').length - 1) === 1,
     'the !best bail-out is gone — the cap would then be claimed as hard');
  ok('E4o over-cap day-cells are PRE-EXISTING: some sit over the cap and are byte-identical to the pre-D84 artifact',
     ranE && eOverUnchanged > 0, eOverUnchanged);
  ok('E4p over-cap is not a D84 artifact: over-cap cells outnumber every cell D84 changed',
     ranE && eOverA > eChanged, eOverA + ' over cap vs ' + eChanged + ' changed');
  console.log('   cap census: ' + eOverA + ' of ' + eCells + ' day-cells sit over the cap (' + E_CAP + '); '
    + eOverUnchanged + ' are untouched by D84 and so were over before it; ' + eOverIntroduced
    + ' crossed the cap under D84; ' + eChanged + ' cells changed at all, so at least '
    + (eOverA - eChanged) + ' were already over.');
}

  done();
}

if (WORKER) runShard(); else runParent();
