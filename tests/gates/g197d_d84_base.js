// g197d_d84_base — V197 D84, the BASELINE half of section E: the candidate is swept
// against the SHIPPED baseline (E1g / E1h) and the budget machinery is confined to the
// behaviour its last licensing ruling printed (E5 × 3). Six assertions. TWO need a
// baseline: E1g and E1h. FOUR need none and run on every invocation: E0, the liveness
// guard, and the three E5 behaviour digests (capSessionBudget, _itemCost, _setCount),
// which replay a frozen corpus through the candidate and are this file's only sabotage
// coverage of the app.
//
// SPLIT NOTE (V198, tests only). This file was section E (the baseline sweep) of g197_leg_accessory.js. That
// gate ran 58.9s and was 93% of gate.sh's wall time, and an 8-wide fan-out is bounded by
// its slowest member. The 109 assertions were split across g197a_pool_static.js,
// g197b_sweep.js, g197c_d84_cmp.js and g197d_d84_base.js: each lands in exactly one file,
// none dropped, none duplicated, every assertion keeping the bytes and the meaning it had.
// The five sections were proven independent first — 10,441 of 10,441 builds are private to
// their own section, IA.window.__SEC/__DAY have no reader anywhere, and localStorage is
// empty at every boundary — so there is no ordering constraint between the four files.
//
// WITH NO BASELINE THE TWO COMPARISON ASSERTIONS DO NOT RUN, ON PURPOSE. tests/sabotage.py
// runs `node <gate> mutated.html` with no argv[3], so under sabotage E1g and E1h are
// skipped and this file prints their "not run" line. The mutations that used to trip
// section E's comparisons stay pointed at g197c_d84_cmp.js.
//
// E5 IS NOT ONE OF THEM. Since the V198 tooling pass it needs no baseline and runs on every
// invocation, which closed a real hole: before that every app-grading assertion in this
// file sat behind if (BASE_HTML), so under sabotage the file graded nothing and printed a
// green summary no matter what the mutation did. Until Post-V233 E5 was a sha256 of
// capSessionBudget's SOURCE slice, paired with a comment-only mutation. Post-V233 (Mario:
// "Convert brittle line and text checks (like g224) to content checks.") it is three
// digests of the budget machinery's BEHAVIOUR on a frozen corpus, and
// tests/sabotage/v198.json M7 is a behavioural edit inside capSessionBudget that trips E5
// by name. See the E5 block for the corpus, the era rows and their provenance.
//
// WHAT IT MUST NEVER PRINT IS `PASS 0 FAIL 0`. gate.sh reads a MISSING summary as a crash,
// but it reads a summary of zero as green, and a zero summary is indistinguishable from a
// gate whose body was deleted. E0 therefore runs on every invocation, with or without a
// baseline: it needs no second artifact, it is answered by the lattice this file builds
// for itself, and it fails loudly if that enumeration is ever cut down.
//
// E0 IS TWO PARTS, because moving E5 out raised the no-baseline count, and a changing PASS
// count is exactly what once masked a dead gate body. The number is not relaxed, it is
// ASSERTED: done() computes how many assertions were actually PUT (passed, failed or
// refused) and fails by name if that is below NOBASE_MIN, the four that need no baseline
// (E0 and the three E5 behaviour digests). A body that stops executing anywhere above
// done() now produces a NAMED red instead of a shorter green, whichever assertions went
// missing — including the case E0's own lattice claim cannot see, where E0 passes and
// everything after it is gone. Under sabotage a clean artifact prints PASS 4 FAIL 0; fewer
// than four put, and a missing summary, are red.
//
// INTERNAL FAN-OUT. 1,728 configs built against the candidate, the moving release
// baseline (E1g) and the fixed V196 artifact (E1h) — twice per config when the release
// baseline IS V196, since then one load and one scan serve both. Fanned by CONFIG
// INDEX across G197_SHARDS workers (default 2, because gate.sh already runs eight gates at
// once on 8 cores and more workers here only oversubscribe them) and aggregated IN FULL
// before E1g and E1h
// run, so both still see all 95,232 day-cells. Workers ALWAYS exit 0 and are graded from
// their result files; a dead, empty or short worker prints FAIL E-shard by name.
//
// BASELINE-AWARENESS (V198, tests only). Two of the five comparison assertions had a
// premise that only held against one particular pair of artifacts, and both were found
// by running the gate outside that pair:
//   E1h ('Calves rises somewhere') is D84's own footprint. It is satisfiable ONLY against
//   a pre-D84 baseline, and it FAILED when V197 was compared to itself. It was first made
//   baseline-version-aware, which was only half the fix: every release chain from V199 on
//   carries a baseline >= 197, so E1h refused on every healthy run, forever. A FIXED
//   historical claim needs a FIXED artifact, so E1h is now RE-POINTED at
//   baselines/V196.html (the last release before D84) and no longer reads the moving
//   release baseline at all. E1g keeps that baseline: 'Calves falls nowhere since the last
//   release' is a regression guard and is SUPPOSED to move.
//   The refusal MACHINERY stays and still blocks (gate.sh greps REFUSED): it now fires
//   only when no pre-D84 artifact exists, which is a broken checkout and not a healthy
//   run. A no-op assertion is the vacuity defect this repo keeps paying for, so a claim
//   that cannot be put is still named, counted and red — never quietly skipped.
//   E5 capSessionBudget was pinned to the baseline under the premise that D84 touched no
//   budget machinery. D85 (V198) deliberately edits that function, so that comparison
//   fails by construction. The confinement is RE-PINNED to the D85-licensed TEXT rather
//   than deleted: deleting it is an unruled removal, and it is the one assertion in the
//   suite that sees the D85 edit as an EDIT rather than as an outcome.
//   POST-V233 it is put on BEHAVIOUR instead of text (the E5 block): the text pin went red
//   at V198, V199 twice and V231 pre with no behaviour change, and never saw D89's ruled
//   move, which sat outside its slice.
//
// Usage: node tests/gates/g197d_d84_base.js <candidate.html> [baseline.html]
// Internal: --shard i/N --out <json>   worker mode, never called by hand.
const fs   = require('fs');
const os   = require('os');
const path = require('path');
const cp   = require('child_process');
const crypto = require('crypto');
const { load } = require(path.join(__dirname, '..', 'harness.js'));

var SHARD_I = null, SHARD_N = 0, OUT = '', V196_ARG = '';
const POS = [];
{
  const a = process.argv.slice(2);
  for (let i = 0; i < a.length; i++) {
    if (a[i] === '--shard') { const m = String(a[++i] || '').split('/'); SHARD_I = parseInt(m[0], 10); SHARD_N = parseInt(m[1], 10); }
    else if (a[i] === '--out') OUT = a[++i];
    else if (a[i] === '--v196') V196_ARG = a[++i];
    else POS.push(a[i]);
  }
}
const WORKER = SHARD_I !== null;
const FILE = POS[0] || path.join(__dirname, '..', '..', 'index.html');
const RAW  = fs.readFileSync(FILE, 'utf8');
const IA   = load(FILE);
if (WORKER) console.log = function () {};   // a worker writes counters, never a verdict
const BASE_HTML = POS[1] && fs.existsSync(POS[1]) ? POS[1] : null;

// ── E1h's FIXED artifact. D84's footprint is a historical claim, so it is compared against
// a pinned pre-D84 release and never against the moving release baseline. baselines/V196.html
// is the committed copy of V196 (`git show V196:index.html`); it is preferred over extracting
// the tag at gate time because a gate must not depend on a .git directory, on a tag that can
// be moved, or on a subprocess per worker — and because this repo's rule is that when file and
// tag disagree, the file wins. The parent resolves the path once and hands it to every worker,
// so a worker never re-resolves and cannot disagree with its parent.
const V196_PATH = path.join(__dirname, '..', '..', 'baselines', 'V196.html');
function resolveV196() {
  if (BASE_HTML && iaVersion(fs.readFileSync(BASE_HTML, 'utf8')) === 196) return BASE_HTML;
  if (fs.existsSync(V196_PATH) && iaVersion(fs.readFileSync(V196_PATH, 'utf8')) === 196) return V196_PATH;
  return null;
}
const V196_HTML = WORKER ? (V196_ARG && fs.existsSync(V196_ARG) ? V196_ARG : null)
                         : (BASE_HTML ? resolveV196() : null);

let pass = 0, fail = 0, refused = 0;
// The number of assertions this file puts with NO baseline at all: E0 (the lattice
// enumeration) and the three E5 behaviour digests (capSessionBudget, _itemCost, _setCount).
// All four are answered by the candidate and the committed V196 corpus source alone.
// done() enforces it as a floor; see the E0 note in the header.
const NOBASE_MIN = 4;
function ok(name, cond, detail) {
  if (cond) { pass++; console.log('ok   ' + name); }
  else { fail++; console.log('FAIL ' + name + (detail !== undefined ? '  -> ' + detail : '')); }
}
// A refusal is an assertion that COULD NOT BE PUT, announced by name. It is not a pass,
// it is not silence, and it is echoed next to the summary so it cannot read as green.
function refuse(name, why) { refused++; console.log('REFUSE ' + name + '  -> ' + why); }

function iaVersion(src) {
  const m = /<meta name="ia-version" content="(\d+)"/.exec(String(src || ''));
  return m ? parseInt(m[1], 10) : null;
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


// ── SCRATCH. One private mkdtemp directory per process, removed on EVERY exit path
// including a throw. Never a fixed path: this gate now runs concurrently with the other
// three under gate.sh's fan-out and with its own workers.
var SCRATCH = '';
function cleanup() { try { if (SCRATCH) fs.rmSync(SCRATCH, { recursive: true, force: true }); } catch (e) {} SCRATCH = ''; }
process.on('exit', cleanup);
function done() {
  cleanup();
  // E0, second part: the LIVENESS FLOOR. A summary is only worth reading if the body that
  // produced it ran. This file always PUTS at least NOBASE_MIN assertions, because none
  // of them needs a second artifact, so a shorter count means assertions stopped executing.
  // That is the failure a summary of zero cannot express on its own, and the failure a
  // count that is merely adjusted upward would hide.
  const putN = pass + fail + refused;
  if (putN < NOBASE_MIN) {
    fail++;
    console.log('FAIL E0 liveness floor: only ' + putN + ' assertion(s) were put, minimum '
      + NOBASE_MIN + ' (E0 lattice enumeration, E5 capSessionBudget/_itemCost/_setCount behaviour '
      + 'digests) — none needs a baseline, so the gate body stopped executing');
  }
  if (refused) console.log('\nREFUSED ' + refused + ' assertion(s) — see the REFUSE lines above. A REFUSED assertion was NOT run and is NOT a pass.');
  console.log('\nPASS ' + pass + ' FAIL ' + fail);
  process.exit(fail ? 1 : 0);
}

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
// ── THE BASELINE SWEEP. Fanned across workers, aggregated in full, then asserted. ─────
function shardCount() {
  const raw = process.env.G197_SHARDS === undefined ? '' : String(process.env.G197_SHARDS);
  if (raw === '') return 2;
  if (!/^[0-9]+$/.test(raw) || parseInt(raw, 10) < 1) {
    fail++; console.log("FAIL: CONFIG: G197_SHARDS must be a positive integer, or empty/unset which means 2; got '" + raw + "'");
    return 0;
  }
  return parseInt(raw, 10);
}

function runShard() {
  let bFell = 0, bRose = 0, bCells = 0, rCells = 0; const bEg = [];
  var walked = 0;
  try {
    if (!BASE_HTML) throw new Error('worker started with no baseline');
    const IA_B = load(BASE_HTML);
    // E1g reads the moving release baseline, E1h the fixed V196 artifact. When they are the
    // same file (a V197-vs-V196 run) one load and one scan serve both.
    const IA_R = !V196_HTML ? null : (V196_HTML === BASE_HTML ? IA_B : load(V196_HTML));
    for (let _ci = 0; _ci < E_L.length; _ci++) {
      if (_ci % SHARD_N !== SHARD_I) continue;
      const c = E_L[_ci];
      walked++;
      let A1s, B1s, R1s = null;
      try {
        A1s = eScan(IA, c.cfg); B1s = eScan(IA_B, c.cfg);
        if (IA_R) R1s = (IA_R === IA_B) ? B1s : eScan(IA_R, c.cfg);
      } catch (e) { continue; }
      const hasL = (o,l) => o.labels.indexOf(l) >= 0;
      for (const dk of Object.keys(A1s)) {
        const A1 = A1s[dk], B1 = B1s[dk];
        if (B1) {
          bCells++;
          if (!hasL(A1,'Calves') && hasL(B1,'Calves')) { bFell++; if (bEg.length < 5) bEg.push(c.key + ' ' + dk); }
        }
        const R1 = R1s ? R1s[dk] : null;
        if (R1) { rCells++; if (hasL(A1,'Calves') && !hasL(R1,'Calves')) bRose++; }
      }
    }
    fs.writeFileSync(OUT, JSON.stringify({ ok: true, n: walked, bFell: bFell, bRose: bRose,
                                           bCells: bCells, rCells: rCells, bEg: bEg }));
  } catch (e) {
    try { fs.writeFileSync(OUT, JSON.stringify({ ok: false, n: walked, err: String((e && e.message) || e) })); } catch (e2) {}
  }
  process.exit(0);   // ALWAYS 0. The parent grades the FILE, never the exit code.
}

function mergeShards(outs, errs, N) {
  let bFell = 0, bRose = 0, bCells = 0, rCells = 0, walked = 0; let bEg = [];
  for (let i = 0; i < N; i++) {
    let j = null;
    try { const t = fs.readFileSync(outs[i], 'utf8'); if (t) j = JSON.parse(t); } catch (e) {}
    if (!j || j.ok !== true) {
      fail++;
      console.log('FAIL E-shard ' + i + '/' + N + ' produced no usable counters (baseline load or sweep failed)'
        + (j && j.err ? ' -> ' + j.err : '') + (errs[i] ? ' | stderr: ' + errs[i].slice(-400).trim() : ''));
      continue;
    }
    if (!j.n) { fail++; console.log('FAIL E-shard ' + i + '/' + N + ' walked 0 configs'); }
    walked += j.n; bFell += j.bFell; bRose += j.bRose; bCells += j.bCells;
    rCells += (j.rCells || 0); bEg = bEg.concat(j.bEg);
  }
  if (bEg.length > 5) bEg.length = 5;
  if (walked !== E_L.length) {
    fail++;
    console.log('FAIL E-shard union walked ' + walked + ' of ' + E_L.length + ' configs (the lattice was not covered)');
  }
  afterSweep(bCells, bFell, bRose, bEg, rCells);
}

function runParent() {
  if (!BASE_HTML) return afterSweep(0, 0, 0, [], 0);
  const N = shardCount();
  if (!N) return afterSweep(0, 0, 0, [], 0);
  SCRATCH = fs.mkdtempSync(path.join(os.tmpdir(), 'g197base-'));
  const outs = [], errs = [];
  let live = N;
  for (let i = 0; i < N; i++) {
    const of = path.join(SCRATCH, 'shard_' + i + '.json');
    outs.push(of); errs.push('');
    const ch = cp.spawn(process.execPath,
      [__filename, FILE, BASE_HTML, '--shard', i + '/' + N, '--out', of]
        .concat(V196_HTML ? ['--v196', V196_HTML] : []),
      { stdio: ['ignore', 'ignore', 'pipe'] });
    let fired = false;
    const fin = function () { if (fired) return; fired = true; if (--live === 0) mergeShards(outs, errs, N); };
    ch.stderr.on('data', function (d) { errs[i] += String(d); });
    ch.on('error', function (e) { errs[i] += String((e && e.message) || e); fin(); });
    ch.on('close', fin);
  }
}

function afterSweep(bCells, bFell, bRose, bEg, rCells) {
  ok('E0 lattice enumeration is the full tier × focus × experience × goal × injury × rest × seed product',
     E_L.length === 1728, E_L.length);
  if (BASE_HTML) {
    ok('E1g vs ' + path.basename(BASE_HTML) + ': Calves falls on zero day-cells (' + bCells + ' compared)',
       bCells > 0 && bFell === 0, bFell + ' e.g. ' + bEg.join(' ; '));
    // E1h is D84's own footprint: Calves must appear on cells where a PRE-D84 artifact had
    // none. D84 shipped IN V197, so the comparison is FIXED at V196 and does NOT read the
    // moving release baseline — pointed there it became unsatisfiable from V197 on and
    // refused forever. The claim is unchanged and still true; only its second artifact was
    // wrong. It now runs on every invocation that has a baseline at all.
    if (V196_HTML) {
      ok('E1h vs ' + path.basename(V196_HTML) + ' (fixed pre-D84 artifact, ia-version 196): '
         + 'Calves rises somewhere (' + rCells + ' day-cells compared)',
         rCells > 0 && bRose > 0, rCells + ' cells compared, ' + bRose + ' rises');
    } else {
      refuse('E1h vs a fixed pre-D84 artifact: Calves rises somewhere',
        'NOT RUN: no pre-D84 artifact to compare against. E1h needs baselines/V196.html '
        + '(ia-version 196, the last release before D84); it is missing or carries another '
        + 'version. Restore it with: git show V196:index.html > baselines/V196.html');
    }
  } else {
    console.log('   -- E1g/E1h not run: no baseline argv[3] (gate.sh passes one; sabotage.py does not)');
  }
// ── E5: CONFINEMENT OF THE BUDGET MACHINERY, READ OFF BEHAVIOUR ─────────────────────
// THE CLAIM IS UNCHANGED, and is the one this block has made since V198: "nothing has edited
// budget machinery since D85 without a ruling", and, for _itemCost and _setCount, "D85 owns
// the capSessionBudget trim loop and nothing else". What changed is WHERE it is read. Until
// Post-V233 it was a sha256 of capSessionBudget's SOURCE slice (`function capSessionBudget(`
// up to `\nfunction capRegionalFatigue`) plus a byte comparison of the _itemCost/_setCount
// slices against the baseline. That text pin went red at V198, V199 twice and V231 pre with
// no behaviour change (an alias, a declaration placed inside a slice, a comment), and it never
// saw the one ruled move that sat OUTSIDE its slice (D89, below). Mario, Post-V233: "Convert
// brittle line and text checks (like g224) to content checks."
// (tests/measure/v233_rulings/post_v233_proof_scope_decisions.md; evidence
// measure_tooling_inventory_mT.md BRITTLE PINS and v232_rulings/measure_gate_history_mH.md
// class B.) This RETIRES the V198 doctrine that the confinement must see a comment-only EDIT:
// a comment is not budget machinery. tests/sabotage/v198.json M7 is now a behavioural edit.
//
// THE CORPUS IS FROZEN. It is every day capSessionBudget is handed while the FIXED V196
// artifact (baselines/V196.html, the committed file E1h already reads) builds the 144 configs
// of this gate's own lattice at rest sun+wed and seed 1013: every tier × goal × injury, with
// focus and experience crossed (hypertrophy/beginner, balanced/advanced). It is captured from
// V196 and NEVER from the candidate, on purpose: the candidate's days move with every DRAW
// ruling, and a budget confinement that reddened on a draw change would be a draw pin, the
// same brittleness moved one step. The capture wraps V196's global binding at run time; no
// source text is read or injected anywhere. Each captured day is replayed through the
// CANDIDATE's capSessionBudget with its own cardio (so the interference cap is exercised
// too), and every item on it through _setCount and _itemCost; each stream is digested.
//
// THE ORACLE IS AN ERA ROW, NOT A HAND TABLE, deliberately: the claim is "nothing has moved
// since the licensing ruling", and a claim that a build moved nothing is an era row (CLAUDE.md
// Version scope). The rows are RANGES keyed to the ruling that last moved the budget's
// behaviour, the newest open-ended, the same shape as the old `<` predicates, so a build that
// moves nothing needs no row and tests/era_bump.py has nothing to carry. A DIGEST IS REFRESHED
// ONLY BY A RULING: when a row fails, the question is which ruling licensed the move, and the
// answer is a range row printed from the ruled tree that closes the open one. Printed by
// builder with this block's own corpus and replay on every tag V196..V233 (Post-V233 slice 3,
// tests/edits/post_v233_s3_brittle_pins.py):
//   196..197  pre-D85      V196 and V197 replay identically (one pre-D85 text digest covered both)
//   198..199  D85 (V198)   the posterior floor. D91 (V199) hoisted the lens to _isPostChain:
//                          the TEXT moved and the behaviour did not, so D91 has no row
//   200..230  D89 (V200)   _compoundTier reads Pallof press as core (tier 0), so the tier-3
//                          skip stops shielding it. Outside the old slice: never seen by text
//   231..     D195 (V231)  D195-B `_cost` (the _prehabHalf set) and the Leg circuit ii>=3 score
//   _setCount and _itemCost replay identically on every tag V196..V233: one open row each.
  const BUDGET_BEHAVIOUR_BY_ERA = [
    { from: 196, to: 197,      rule: 'pre-D85',     csb: '3606c512520dc264d5b41b04313e367ac212b4c0d2e6c2fe21337ca64135f87b' },
    { from: 198, to: 199,      rule: 'D85 (V198)',  csb: '42b54ee6913b887dd1ba112636b505c6cee53ce23d51c4590f2608639ebed91a' },
    { from: 200, to: 230,      rule: 'D89 (V200)',  csb: '470b536d85a0747dd37cadd59c017d802fc715f8c75cc2b801dde38aa95bfd0d' },
    { from: 231, to: Infinity, rule: 'D195 (V231)', csb: '6be03983288738c911e207419b94562ca482169d477584880ef5d75cf4a904be' },
  ];
  const ITEM_HELPERS_BY_ERA = [
    { from: 196, to: Infinity, rule: 'V196',
      setCount: 'f5a34d9cf980d05e9b2a6594b4093361fbf7324561afc3b2686aa5ed8e0087f8',
      itemCost: 'f026dbc4b39d120546af57a4753b66f78adb56442ab7b8feb4f306b279a6e649' },
  ];
  const cv = iaVersion(RAW);
  // An unknown ia-version is held to the newest row, as the old predicate held it to the newest text.
  const eraOf = T => cv === null ? T[T.length - 1] : (T.find(r => cv >= r.from && cv <= r.to) || null);
  const bRow = eraOf(BUDGET_BEHAVIOUR_BY_ERA), hRow = eraOf(ITEM_HELPERS_BY_ERA);
  const E5_CFGS = E_L.filter(c => c.key.endsWith('|sun+wed|1013')
    && ((c.cfg.liftingFocus === 'hypertrophy') === (c.cfg.experience === 'beginner')));
  function e5Corpus(src) {
    const IA_C = load(src);
    IA_C.eval('var __e5corp = []; var __e5csb = capSessionBudget; capSessionBudget = function (s, c) {'
      + ' __e5corp.push(JSON.stringify([s, c === undefined ? null : c])); return __e5csb(s, c); };');
    E5_CFGS.forEach(c => IA_C.buildProgram(c.cfg));
    return Array.from(new Set(JSON.parse(IA_C.eval('JSON.stringify(__e5corp)'))));
  }
  function e5Replay(corpus) {
    const csbFn = IA.eval('capSessionBudget'), scFn = IA.eval('_setCount'), icFn = IA.eval('_itemCost');
    const outs = [], sets = [], costs = []; let moved = 0;
    corpus.forEach(s => {
      const pair = JSON.parse(s), sec = pair[0], c = pair[1];
      const before = JSON.stringify(sec);
      const o = JSON.stringify(csbFn(JSON.parse(before), c === null ? undefined : c));
      outs.push(o); if (o !== before) moved++;
      sec.forEach(x => ((x && x.items) || []).forEach(it => { sets.push(scFn(it.detail)); costs.push(icFn(it, null)); }));
    });
    const H = t => crypto.createHash('sha256').update(t).digest('hex');
    return { n: corpus.length, moved: moved, items: sets.length,
             csb: H(outs.join('\n')), setCount: H(sets.join(',')), itemCost: H(costs.join(',')) };
  }
  const E5_SRC = resolveV196();
  let e5 = null, e5err = '';
  if (E5_SRC) { try { e5 = e5Replay(e5Corpus(E5_SRC)); } catch (e) { e5err = String((e && e.message) || e); } }
  const E5_ROWS = [
    ['capSessionBudget', bRow, 'csb', 'the posterior floor, the trunk floor, the trim order and the cap'],
    ['_itemCost',        hRow, 'itemCost', 'D85 owns the capSessionBudget trim loop and nothing else'],
    ['_setCount',        hRow, 'setCount', 'D85 owns the capSessionBudget trim loop and nothing else'],
  ];
  E5_ROWS.forEach(([nm, row, k, what]) => {
    const label = 'E5 ' + nm + ' replays the ' + (row ? row.rule : 'NO ROW') + ' behaviour on the frozen V196 budget corpus'
      + (e5 ? ' (' + e5.n + ' days, ' + e5.moved + ' trimmed, ' + e5.items + ' items)' : '')
      + ' — nothing since ' + (row ? row.rule : '?') + ' has moved it (' + what + ')';
    if (!E5_SRC) {
      refuse(label, 'NOT RUN: the corpus is captured from baselines/V196.html (ia-version 196) and it is '
        + 'missing or carries another version. Restore it with: git show V196:index.html > baselines/V196.html');
    } else if (!e5) {
      ok(label, false, 'corpus capture or replay threw: ' + e5err);
    } else {
      ok(label, !!row && e5.n > 0 && e5[k] === row[k],
         !row ? 'ia-version ' + cv + ' has no era row'
              : 'ia-version ' + cv + ' digest ' + e5[k].slice(0, 16) + ' != ' + row.rule + ' ' + row[k].slice(0, 16)
                + ' — ' + nm + ' behaviour moved; name the ruling, then print its range row');
    }
  });

  done();
}

if (WORKER) runShard(); else runParent();
