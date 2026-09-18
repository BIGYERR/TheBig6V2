// g197d_d84_base — V197 D84, the BASELINE half of section E: the candidate is swept
// against the SHIPPED baseline (E1g / E1h) and the budget machinery is proved byte-
// identical to it (E5 × 3). Six assertions: those five, which are baseline-only, plus E0,
// a guard that needs no baseline and runs on every invocation.
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
// WITH NO BASELINE THE FIVE COMPARISON ASSERTIONS DO NOT RUN, ON PURPOSE. tests/sabotage.py
// runs `node <gate> mutated.html` with no argv[3], so under sabotage this file prints its
// two "not run" lines and E1g/E1h/E5 are skipped. Every mutation that used to trip
// section E is re-pointed at g197c_d84_cmp.js, so this file still carries no sabotage
// coverage of the app.
//
// WHAT IT MUST NEVER PRINT IS `PASS 0 FAIL 0`. gate.sh reads a MISSING summary as a crash,
// but it reads a summary of zero as green, and a zero summary is indistinguishable from a
// gate whose body was deleted. E0 therefore runs on every invocation, with or without a
// baseline: it needs no second artifact, it is answered by the lattice this file builds
// for itself, and it fails loudly if that enumeration is ever cut down. Under sabotage
// this file prints PASS 1 FAIL 0.
//
// INTERNAL FAN-OUT. 1,728 configs built twice (candidate + baseline). Fanned by CONFIG
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
//   a pre-D84 baseline, and it FAILED when V197 was compared to itself. It is now
//   baseline-version-aware. On a baseline it cannot be satisfied against it does not
//   quietly skip — a no-op assertion is the vacuity defect this repo keeps paying for —
//   it prints a named REFUSE line and is counted in the REFUSED bucket, which is NOT a
//   pass and is printed beside the PASS/FAIL summary.
//   E5 capSessionBudget was pinned to the baseline under the premise that D84 touched no
//   budget machinery. D85 (V198) deliberately edits that function, so that comparison
//   fails by construction. The confinement is RE-PINNED to the D85-licensed TEXT rather
//   than deleted: deleting it is an unruled removal, and it is the one assertion in the
//   suite that sees the D85 edit as an EDIT rather than as an outcome.
//
// Usage: node tests/gates/g197d_d84_base.js <candidate.html> [baseline.html]
// Internal: --shard i/N --out <json>   worker mode, never called by hand.
const fs   = require('fs');
const os   = require('os');
const path = require('path');
const cp   = require('child_process');
const crypto = require('crypto');
const { load } = require(path.join(__dirname, '..', 'harness.js'));

var SHARD_I = null, SHARD_N = 0, OUT = '';
const POS = [];
{
  const a = process.argv.slice(2);
  for (let i = 0; i < a.length; i++) {
    if (a[i] === '--shard') { const m = String(a[++i] || '').split('/'); SHARD_I = parseInt(m[0], 10); SHARD_N = parseInt(m[1], 10); }
    else if (a[i] === '--out') OUT = a[++i];
    else POS.push(a[i]);
  }
}
const WORKER = SHARD_I !== null;
const FILE = POS[0] || path.join(__dirname, '..', '..', 'index.html');
const RAW  = fs.readFileSync(FILE, 'utf8');
const IA   = load(FILE);
if (WORKER) console.log = function () {};   // a worker writes counters, never a verdict
const BASE_HTML = POS[1] && fs.existsSync(POS[1]) ? POS[1] : null;

let pass = 0, fail = 0, refused = 0;
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
  let bFell = 0, bRose = 0, bCells = 0; const bEg = [];
  var walked = 0;
  try {
    if (!BASE_HTML) throw new Error('worker started with no baseline');
    const IA_B = load(BASE_HTML);
    for (let _ci = 0; _ci < E_L.length; _ci++) {
      if (_ci % SHARD_N !== SHARD_I) continue;
      const c = E_L[_ci];
      walked++;
      let A1s, B1s;
      try { A1s = eScan(IA, c.cfg); B1s = eScan(IA_B, c.cfg); } catch (e) { continue; }
      for (const dk of Object.keys(A1s)) {
        const A1 = A1s[dk], B1 = B1s[dk]; if (!B1) continue;
        bCells++;
        const hasL = (o,l) => o.labels.indexOf(l) >= 0;
        if (!hasL(A1,'Calves') && hasL(B1,'Calves')) { bFell++; if (bEg.length < 5) bEg.push(c.key + ' ' + dk); }
        if (hasL(A1,'Calves') && !hasL(B1,'Calves')) bRose++;
      }
    }
    fs.writeFileSync(OUT, JSON.stringify({ ok: true, n: walked, bFell: bFell, bRose: bRose, bCells: bCells, bEg: bEg }));
  } catch (e) {
    try { fs.writeFileSync(OUT, JSON.stringify({ ok: false, n: walked, err: String((e && e.message) || e) })); } catch (e2) {}
  }
  process.exit(0);   // ALWAYS 0. The parent grades the FILE, never the exit code.
}

function mergeShards(outs, errs, N) {
  let bFell = 0, bRose = 0, bCells = 0, walked = 0; let bEg = [];
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
    walked += j.n; bFell += j.bFell; bRose += j.bRose; bCells += j.bCells; bEg = bEg.concat(j.bEg);
  }
  if (bEg.length > 5) bEg.length = 5;
  if (walked !== E_L.length) {
    fail++;
    console.log('FAIL E-shard union walked ' + walked + ' of ' + E_L.length + ' configs (the lattice was not covered)');
  }
  afterSweep(bCells, bFell, bRose, bEg);
}

function runParent() {
  if (!BASE_HTML) return afterSweep(0, 0, 0, []);
  const N = shardCount();
  if (!N) return afterSweep(0, 0, 0, []);
  SCRATCH = fs.mkdtempSync(path.join(os.tmpdir(), 'g197base-'));
  const outs = [], errs = [];
  let live = N;
  for (let i = 0; i < N; i++) {
    const of = path.join(SCRATCH, 'shard_' + i + '.json');
    outs.push(of); errs.push('');
    const ch = cp.spawn(process.execPath,
      [__filename, FILE, BASE_HTML, '--shard', i + '/' + N, '--out', of],
      { stdio: ['ignore', 'ignore', 'pipe'] });
    let fired = false;
    const fin = function () { if (fired) return; fired = true; if (--live === 0) mergeShards(outs, errs, N); };
    ch.stderr.on('data', function (d) { errs[i] += String(d); });
    ch.on('error', function (e) { errs[i] += String((e && e.message) || e); fin(); });
    ch.on('close', fin);
  }
}

function afterSweep(bCells, bFell, bRose, bEg) {
  ok('E0 lattice enumeration is the full tier × focus × experience × goal × injury × rest × seed product',
     E_L.length === 1728, E_L.length);
  if (BASE_HTML) {
    ok('E1g vs ' + path.basename(BASE_HTML) + ': Calves falls on zero day-cells (' + bCells + ' compared)',
       bCells > 0 && bFell === 0, bFell + ' e.g. ' + bEg.join(' ; '));
    // E1h is D84's own footprint: Calves must appear on cells where the baseline had none.
    // D84 shipped IN V197, so only a baseline built before it can show the rise. Against a
    // V197-or-later baseline the claim is unsatisfiable by construction (it FAILED on
    // V197-vs-itself) and the honest answer is a refusal, not a pass and not a skip.
    const BV = iaVersion(fs.readFileSync(BASE_HTML, 'utf8'));
    if (BV !== null && BV < 197) {
      ok('E1h vs ' + path.basename(BASE_HTML) + ': Calves rises somewhere', bRose > 0, bRose);
    } else {
      refuse('E1h vs ' + path.basename(BASE_HTML) + ': Calves rises somewhere',
        'NOT RUN: this claim needs a pre-D84 baseline (ia-version < 197); this baseline reads '
        + (BV === null ? 'no ia-version meta' : 'ia-version ' + BV)
        + '. D84 landed in V197, so a V197-or-later baseline already carries the rise and the claim '
        + 'cannot be satisfied against it. Re-run with base_V196.html to put this assertion.');
    }
  } else {
    console.log('   -- E1g/E1h not run: no baseline argv[3] (gate.sh passes one; sabotage.py does not)');
  }
// ── E5: CONFINEMENT OF THE BUDGET MACHINERY. One claim, two mechanisms: nothing has
// edited budget machinery since D85 without a ruling.
//   capSessionBudget is PINNED TO ITS LICENSED TEXT by sha256. Until V198 it was pinned
//   to the shipped baseline under D84's premise that no budget machinery moved; D85
//   (V198) edits this function on purpose, so a baseline comparison now fails by
//   construction. Re-pinning keeps the confinement instead of deleting it — a deletion
//   would be an unruled removal, and this is the only assertion in the suite that sees
//   the D85 edit as an EDIT rather than as an outcome. Narrowing E5 to _itemCost/
//   _setCount was the other candidate mechanism and was REJECTED for the same reason:
//   it would leave the function D85 actually touched with no confinement at all.
//   _itemCost and _setCount are NOT D85's, so they keep the baseline byte comparison.
if (BASE_HTML) {
  const B = fs.readFileSync(BASE_HTML, 'utf8');
  const slice = (src, start, end) => { const a = src.indexOf(start); if (a < 0) return null;
    const b = src.indexOf(end, a); return b < 0 ? null : src.slice(a, b); };

  // PROVENANCE OF THE PINS. sha256 of the bytes from `function capSessionBudget(sections,
  // cardio){` up to (not including) `\nfunction capRegionalFatigue`.
  //   CSB_D85  — V198, the text LICENSED BY RULING D85: the {hinge, hip_ext} floor that
  //              makes the day's last posterior chain item ineligible for the trim loop.
  //   CSB_PRE  — the pre-D85 text. V196 and V197 carry it byte-for-byte identically, which
  //              is why one digest covers both and why this gate still answers V197-vs-V196.
  // A DIGEST IS REFRESHED ONLY BY A RULING. If this assertion fails, the question is not
  // 'what is the new digest' — it is 'which ruling licensed that edit to the budget'.
  const CSB_D85 = 'fb16df9c8a6798937d3e0a9904f23944bf3f68cac258a21ef772ccf9040357c3';
  const CSB_PRE = 'c8064f3cc1989cd5f60f308bc2644119162238c4946843ee3b9ccea8ebe06a5f';
  const csb = slice(RAW, 'function capSessionBudget(sections, cardio){', '\nfunction capRegionalFatigue');
  const cv  = iaVersion(RAW);
  const pre = cv !== null && cv < 198;           // a pre-D85 artifact is allowed the pre-D85 text
  const want = pre ? CSB_PRE : CSB_D85;
  const era  = pre ? 'pre-D85' : 'D85 (V198)';
  const dig  = csb === null ? null : crypto.createHash('sha256').update(csb).digest('hex');
  ok('E5 capSessionBudget is byte-for-byte the ' + era + ' licensed text '
     + '(licensing ruling D85; nothing since D85 has edited budget machinery)',
     dig !== null && dig === want,
     dig === null ? 'not found in candidate'
       : 'ia-version ' + cv + ' digest ' + dig.slice(0, 16) + ' != licensed ' + want.slice(0, 16)
         + ' — capSessionBudget was edited; name the ruling');

  const PARTS = [
    ['_itemCost',        'function _itemCost(it, sectionRegion){',       '\n// ── RECOVERY-WEEK VOLUME DELOAD'],
    ['_setCount',        'function _setCount(detail){',                  '\nfunction _itemCost'],
  ];
  PARTS.forEach(([nm, a, b]) => {
    const x = slice(RAW, a, b), y = slice(B, a, b);
    ok('E5 ' + nm + ' is byte-identical to the baseline (D85 owns the capSessionBudget trim loop and nothing else)',
       !!x && !!y && x === y, x === null ? 'not found in candidate' : (y === null ? 'not found in baseline' : 'differs'));
  });
} else {
  console.log('   -- E5 not run: no baseline argv[3]');
}

  done();
}

if (WORKER) runShard(); else runParent();
