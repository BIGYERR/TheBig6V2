#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""TESTS-ONLY. Split tests/gates/g197_leg_accessory.js (109 assertions, 58.9s, 93% of
gate.sh's wall time) into four gate files, none of them over 15s.

    python3 tests/edits/split_g197_gate.py

  g197a_pool_static.js   sections A + C + D   (41 assertions, ~0.1s)
  g197b_sweep.js         section  B           (29 assertions, ~12s)
  g197c_d84_cmp.js       section  E, the comparison sweep + its tails (34)
  g197d_d84_base.js      section  E, the baseline sweep + E5           (5, baseline-only)

METHOD. The assertion text is never retyped. Every block is SLICED out of the original by
an anchor asserted count == 1, so the four files carry the same bytes the 109 assertions
are made of and byte-identity against today's output is structural rather than hoped for.
Only the drivers are new: section C grows a local render-day harvest (section B used to
collect its 14 day-objects as a side effect), and section E's two sweeps are fanned across
worker processes that aggregate EVERY counter before the first assertion runs.

NOTHING IS APPORTIONED. The exact global counts (B4i, B4j, B4k, B4l, B5b, B5c, B5d), the
four down-only ratchets (E3c, E3d, E3f, E3g -- E3f and E3g sit exactly AT their ceiling),
the ratio claim (E4p), the existentials (B2, B3, B6a, E1f, E4o, E2c) and the coverage
claims (E1b, E1c) all still see the complete lattice.

index.html is NOT touched. No ia-version bump. Nothing is committed.
"""
import json, os, sys

HERE  = os.path.dirname(os.path.abspath(__file__))
TESTS = os.path.abspath(os.path.join(HERE, '..'))
GATES = os.path.join(TESTS, 'gates')
SRC   = os.path.join(GATES, 'g197_leg_accessory.js')
SPEC  = os.path.join(TESTS, 'sabotage', 'v197.json')

RAW = open(SRC, encoding='utf-8').read()

# ── anchor helpers. Nothing is written until every anchor has hit exactly once. ───────
def at(hay, needle, what, where='g197_leg_accessory.js'):
    n = hay.count(needle)
    if n != 1:
        sys.exit('ABORT: anchor for %s occurs %d times in %s (want exactly 1): %r'
                 % (what, n, where, needle[:90]))
    return hay.index(needle)

def cut(hay, needle, what, where='g197_leg_accessory.js'):
    i = at(hay, needle, what, where)
    return i, i + len(needle)

# ── top-level section banners ────────────────────────────────────────────────────────
A_HDR = '// A. STATIC — the pool itself, read out of the source and judged by the hand table\n'
B_HDR = '// B. THE SWEEP — 3,528 builds, every tier, plus the travel Room-only tier\n'
C_HDR = '// C. RENDER — the four surfaces, and the row the athlete actually reads\n'
D_HDR = "// D. MARIO'S FIXTURE MUST NOT MOVE\n"
E_HDR = '// E. V197 (D84) — CALVES IS PUSHED BEFORE LEG ISOLATION\n'

def banner(hdr, what):
    """start of the ═ rule line that opens the section whose title line is `hdr`"""
    i = at(RAW, hdr, what)
    j = RAW.rindex('// ═', 0, i)
    return j

bA, bB, bC, bD, bE = (banner(h, n) for h, n in
                      ((A_HDR, 'section A'), (B_HDR, 'section B'), (C_HDR, 'section C'),
                       (D_HDR, 'section D'), (E_HDR, 'section E')))
if not (bA < bB < bC < bD < bE):
    sys.exit('ABORT: the five section banners are not in A B C D E order')

TAIL_MARK = "\nconsole.log('\\nPASS ' + pass + ' FAIL ' + fail);\n"
bTail = at(RAW, TAIL_MARK, 'the PASS/FAIL summary')

# ── the shared preamble, sub-sliced so files 3 and 4 can reuse ok() and the DOM stub ──
iOk   = at(RAW, 'let pass = 0, fail = 0;\n', 'the pass/fail counters')
iStub = at(RAW, '// ── retaining DOM stub', 'the retaining DOM stub')
iHand = at(RAW, '// ── HAND ORACLE: what a NAME needs, what a TIER owns', 'the hand gear table')
if not (iOk < iStub < iHand < bA):
    sys.exit('ABORT: preamble blocks are out of order')

PRE_HEAD   = RAW[:iOk]
OK_BLOCK   = RAW[iOk:iStub]
STUB_BLOCK = RAW[iStub:iHand]
HAND_BLOCK = RAW[iHand:bA]
PRE   = RAW[:bA]
SEC_A = RAW[bA:bB]
SEC_B = RAW[bB:bC]
SEC_C = RAW[bC:bD]
SEC_D = RAW[bD:bE]
SEC_E = RAW[bE:bTail]
TAIL  = RAW[bTail:]

# ── section E, sub-sliced ────────────────────────────────────────────────────────────
E_CMP_IF   = "\nif (CMP) {\n  const cmpPath = path.join(os.tmpdir(), 'g197_d84_cmp_' + process.pid + '.html');\n"
E_RAN      = 'const ranE = !!CMP && eCells > 0;\n'
E_BASE_TOP = '// and against the shipped baseline, when gate.sh hands one over\n'
E_E2_TOP   = '// ── E2: exactly two labels move.'
E_E5_TOP   = '// byte-identity of the machinery D84 must not have touched, against the shipped baseline\n'

iCmpIf          = at(SEC_E, E_CMP_IF, 'the E comparison driver', 'section E')
iRan0, iRan1    = cut(SEC_E, E_RAN, 'the ranE line', 'section E')
iBase           = at(SEC_E, E_BASE_TOP, 'the E baseline block', 'section E')
iE2             = at(SEC_E, E_E2_TOP, 'the E2 block', 'section E')
iE5             = at(SEC_E, E_E5_TOP, 'the E5 byte-identity block', 'section E')
if not (iCmpIf < iRan0 < iBase < iE2 < iE5):
    sys.exit('ABORT: section E sub-blocks are out of order')

E_HEAD   = SEC_E[:iCmpIf] + '\n'   # banner + E0 + lattice + hand tables + E3a + eScan + counters + E4h-k
E_DRIVER = SEC_E[iCmpIf:iRan0]
E_RAN_LN = SEC_E[iRan0:iRan1]
E_E1     = SEC_E[iRan1:iBase]
E_BASEBL = SEC_E[iBase:iE2]
E_TAILS  = SEC_E[iE2:iE5]
E_E5     = SEC_E[iE5:]

# the comparison sweep's loop BODY, verbatim
L_OPEN  = '    for (const c of E_L) {\n'
L_SHUT  = '\n    }\n    try { fs.unlinkSync(cmpPath); } catch (e) {}\n'
_, iLo  = cut(E_DRIVER, L_OPEN, 'the cmp sweep loop head', 'the E driver')
iLc     = at(E_DRIVER, L_SHUT, 'the cmp sweep loop tail', 'the E driver')
CMP_BODY = E_DRIVER[iLo:iLc]

# the baseline sweep's loop BODY and its two ok() calls, verbatim
_, iBo  = cut(E_BASEBL, L_OPEN, 'the baseline sweep loop head', 'the E baseline block')
iBc     = at(E_BASEBL, "\n    }\n    ok('E1g vs '", 'the baseline sweep loop tail', 'the E baseline block')
BASE_BODY = E_BASEBL[iBo:iBc]
iOk0    = at(E_BASEBL, "    ok('E1g vs '", 'the E1g assertion', 'the E baseline block')
iOk1    = at(E_BASEBL, '\n  }\n} else {', 'the end of the E1g/E1h pair', 'the E baseline block')
BASE_OKS = E_BASEBL[iOk0:iOk1]

# the E lattice and eScan, for the baseline file
iLat  = at(E_HEAD, '// ── the lattice: every tier, every injury state.', 'the E lattice', 'section E head')
iHt   = at(E_HEAD, '// ── hand tables ', 'the E hand tables', 'section E head')
iScan = at(E_HEAD, 'function eScan(IA_, cfg) {', 'eScan', 'section E head')
iCnt  = at(E_HEAD, '\nlet eCells = 0,', 'the E counters', 'section E head')
if not (iLat < iHt < iScan < iCnt):
    sys.exit('ABORT: section E head blocks are out of order')
E_LAT  = E_HEAD[iLat:iHt]
E_SCAN = E_HEAD[iScan:iCnt]

# ── per-file header lines ────────────────────────────────────────────────────────────
OLD_H1 = '// g197_leg_accessory — V197 (D75 / D76 / D78 / the 8302 guard / D70b).\n'
OLD_US = '// Usage: node tests/gates/g197_leg_accessory.js <candidate.html>\n'
at(PRE, OLD_H1, 'the file header line', 'the preamble')
at(PRE, OLD_US, 'the usage line', 'the preamble')

SPLIT_NOTE = """//
// SPLIT NOTE (V198, tests only). This file was section {sec} of g197_leg_accessory.js. That
// gate ran 58.9s and was 93% of gate.sh's wall time, and an 8-wide fan-out is bounded by
// its slowest member. The 109 assertions were split across g197a_pool_static.js,
// g197b_sweep.js, g197c_d84_cmp.js and g197d_d84_base.js: each lands in exactly one file,
// none dropped, none duplicated, every assertion keeping the bytes and the meaning it had.
// The five sections were proven independent first — 10,441 of 10,441 builds are private to
// their own section, IA.window.__SEC/__DAY have no reader anywhere, and localStorage is
// empty at every boundary — so there is no ordering constraint between the four files.
//
"""

# ════════════════════════════════════════════════════════════════════════════════════
# FILE 1 — A + C + D
# ════════════════════════════════════════════════════════════════════════════════════
F1_H1 = '// g197a_pool_static — V197 (D75 / D76 / D78 / the 8302 guard / D70b): the POOL, the\n' \
        '// RENDER surfaces and HALF_MANNY. Sections A, C and D of the old g197 gate.\n'
F1_US = '// Usage: node tests/gates/g197a_pool_static.js <candidate.html>\n'

HARVEST = """// ════════════════════════════════════════════════════════════════════════════════════
// RENDER-DAY HARVEST (V198 split). Section C's input is the 14 day-objects section B used
// to collect as a side effect of its 3,528-build sweep: for every equipment tier, the
// FIRST config in lattice order that opens a "Leg isolation" section, and the FIRST that
// opens a core section. The selection rule and the visit order below are the sweep's own,
// so the harvest is the same 14 objects in the same order; a config that can no longer
// fill either slot for its tier is skipped UNBUILT, which is what makes this ~0.04s
// instead of 12s. This is plumbing, not an oracle — C's oracles are in C, and if this
// harvest ever came up short C1 would read `0 blank of 0 rendered` and fail on
// `rowsRendered > 0` rather than go quietly green.
// ════════════════════════════════════════════════════════════════════════════════════
const renderDays = [];
const seenRenderTier = {};
{
  const HL = lattice(TIERS, false).concat(lattice(['bodyweight'], true));
  const WANT = TIERS_PLUS.length * 2;          // one Leg-isolation day + one core day per tier
  for (const c of HL) {
    if (renderDays.length >= WANT) break;
    if (seenRenderTier[c.tier] && seenRenderTier['core_' + c.tier]) continue;
    let p; try { p = IA.buildProgram(c.cfg); } catch (e) { continue; }
    for (const cell of cells(p)) {
      (cell.day.sections||[]).forEach(s => {
        if ((s.label||'') !== SECTION) return;
        if (!seenRenderTier[c.tier]) { seenRenderTier[c.tier] = 1; renderDays.push({ tier: c.tier, key: c.key, sec: s, day: cell.day }); }
      });
      if (!seenRenderTier['core_' + c.tier] && (cell.day.sections||[]).some(s => s.core)) {
        seenRenderTier['core_' + c.tier] = 1;
        renderDays.push({ tier: c.tier + ' (core day)', key: c.key, sec: (cell.day.sections||[]).filter(s => s.core)[0], day: cell.day });
      }
    }
  }
}

"""

F1 = (PRE.replace(OLD_H1, F1_H1 + SPLIT_NOTE.format(sec='A, C and D'))
         .replace(OLD_US, F1_US)
      + SEC_A + HARVEST + SEC_C + SEC_D + TAIL)

# ════════════════════════════════════════════════════════════════════════════════════
# FILE 2 — B
# ════════════════════════════════════════════════════════════════════════════════════
F2_H1 = '// g197b_sweep — V197 (D70b / D75 / D76 / D78): the 3,528-build lattice sweep.\n' \
        '// Section B of the old g197 gate, whole and unmodified.\n'
F2_US = '// Usage: node tests/gates/g197b_sweep.js <candidate.html>\n'

F2 = (PRE.replace(OLD_H1, F2_H1 + SPLIT_NOTE.format(sec='B'))
         .replace(OLD_US, F2_US)
      + SEC_B + TAIL)

# ════════════════════════════════════════════════════════════════════════════════════
# FILE 3 — E, the comparison sweep
# ════════════════════════════════════════════════════════════════════════════════════
F3_HEAD = """// g197c_d84_cmp — V197 D84: Calves is pushed before Leg isolation. The COMPARISON sweep.
// Section E of the old g197 gate, minus the two baseline-only claims (g197d_d84_base.js).
""" + SPLIT_NOTE.format(sec='E (the comparison sweep)') + """// INTERNAL FAN-OUT, AND WHY IT CHANGES NOTHING. The sweep is 1,728 configs built twice —
// once on the candidate, once on the swapped-back comparison artifact. It is fanned by
// CONFIG INDEX across G197_SHARDS worker processes (default 4, not 8: this gate already
// runs inside gate.sh's own 8-wide fan-out) and EVERY counter is aggregated back into this
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

"""

F3_SCRATCH = """
// ── SCRATCH. One private mkdtemp directory per process, created only in the parent and
// removed on EVERY exit path including a throw (process.on('exit')). The old gate wrote
// os.tmpdir()/g197_d84_cmp_<pid>.html and unlinked it after the sweep — a path that
// load() could skip by throwing, and the file leaked. Nothing named g197_d84_cmp_* is
// written any more, and two concurrent runs cannot collide because mkdtemp owns the name.
var SCRATCH = '';
function cleanup() { try { if (SCRATCH) fs.rmSync(SCRATCH, { recursive: true, force: true }); } catch (e) {} SCRATCH = ''; }
process.on('exit', cleanup);
function done() { cleanup(); console.log('\\nPASS ' + pass + ' FAIL ' + fail); process.exit(fail ? 1 : 0); }

"""

F3_DRIVER = """
// ── THE SWEEP. Fanned across workers, aggregated in full, and only then asserted. ─────
// G197_SHARDS: empty or unset means 4. Only a POSITIVE integer is accepted — 0, negative
// and non-numeric are rejected, never clamped, exactly as GATE_JOBS and FUZZ_SHARDS are.
// A bad value is a CONFIGURATION error and it is reported as a FAIL with a summary line,
// because gate.sh reads a missing summary as a crash.
function shardCount() {
  const raw = process.env.G197_SHARDS === undefined ? '' : String(process.env.G197_SHARDS);
  if (raw === '') return 4;
  if (!/^[0-9]+$/.test(raw) || parseInt(raw, 10) < 1) {
    fail++; console.log("FAIL: CONFIG: G197_SHARDS must be a positive integer, or empty/unset which means 4; got '" + raw + "'");
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
""" + CMP_BODY + """
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
""" + E_RAN_LN + E_E1 + E_TAILS + """
  done();
}

if (WORKER) runShard(); else runParent();
"""

F3 = F3_HEAD + OK_BLOCK + STUB_BLOCK + F3_SCRATCH + E_HEAD + F3_DRIVER

# ════════════════════════════════════════════════════════════════════════════════════
# FILE 4 — E, the baseline sweep
# ════════════════════════════════════════════════════════════════════════════════════
F4_HEAD = """// g197d_d84_base — V197 D84, the BASELINE half of section E: the candidate is swept
// against the SHIPPED baseline (E1g / E1h) and the budget machinery is proved byte-
// identical to it (E5 × 3). Five assertions, every one of them baseline-only.
""" + SPLIT_NOTE.format(sec='E (the baseline sweep)') + """// WITH NO BASELINE THIS FILE ASSERTS NOTHING, ON PURPOSE. tests/sabotage.py runs
// `node <gate> mutated.html` with no argv[3], so under sabotage this file prints its two
// "not run" lines and `PASS 0 FAIL 0`. That is a valid summary, not a crash — gate.sh
// reads a MISSING summary as a crash, and this file must never produce one. It therefore
// has zero sabotage coverage by construction; every mutation that used to trip section E
// is re-pointed at g197c_d84_cmp.js.
//
// INTERNAL FAN-OUT. 1,728 configs built twice (candidate + baseline). Fanned by CONFIG
// INDEX across G197_SHARDS workers (default 4) and aggregated IN FULL before E1g and E1h
// run, so both still see all 95,232 day-cells. Workers ALWAYS exit 0 and are graded from
// their result files; a dead, empty or short worker prints FAIL E-shard by name.
//
// Usage: node tests/gates/g197d_d84_base.js <candidate.html> [baseline.html]
// Internal: --shard i/N --out <json>   worker mode, never called by hand.
const fs   = require('fs');
const os   = require('os');
const path = require('path');
const cp   = require('child_process');
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

"""

F4_SCRATCH = """
// ── SCRATCH. One private mkdtemp directory per process, removed on EVERY exit path
// including a throw. Never a fixed path: this gate now runs concurrently with the other
// three under gate.sh's fan-out and with its own workers.
var SCRATCH = '';
function cleanup() { try { if (SCRATCH) fs.rmSync(SCRATCH, { recursive: true, force: true }); } catch (e) {} SCRATCH = ''; }
process.on('exit', cleanup);
function done() { cleanup(); console.log('\\nPASS ' + pass + ' FAIL ' + fail); process.exit(fail ? 1 : 0); }

"""

F4_DRIVER = """
// ── THE BASELINE SWEEP. Fanned across workers, aggregated in full, then asserted. ─────
function shardCount() {
  const raw = process.env.G197_SHARDS === undefined ? '' : String(process.env.G197_SHARDS);
  if (raw === '') return 4;
  if (!/^[0-9]+$/.test(raw) || parseInt(raw, 10) < 1) {
    fail++; console.log("FAIL: CONFIG: G197_SHARDS must be a positive integer, or empty/unset which means 4; got '" + raw + "'");
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
""" + BASE_BODY + """
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
  if (BASE_HTML) {
""" + BASE_OKS + """
  } else {
    console.log('   -- E1g/E1h not run: no baseline argv[3] (gate.sh passes one; sabotage.py does not)');
  }
""" + E_E5 + """
  done();
}

if (WORKER) runShard(); else runParent();
"""

F4 = F4_HEAD + OK_BLOCK + STUB_BLOCK + F4_SCRATCH + E_LAT + E_SCAN + F4_DRIVER

# ════════════════════════════════════════════════════════════════════════════════════
# sabotage spec re-pointing. Exact-string surgery, one occurrence at a time, so the rest
# of the file stays byte-identical. M9/M10 name g193_budget_floor.js and do not move.
# ════════════════════════════════════════════════════════════════════════════════════
GATE_LINE = '    "gate": "gates/g197_leg_accessory.js"'
NOTE = ('multi-section mutation. Caught by %s as well; pointed at %s because that section '
        'gives the most specific diagnosis: %s')
REPOINT = [
    # (mutation, new gate, note-or-None)
    ('M1',  'g197a_pool_static.js', None),
    ('M2',  'g197a_pool_static.js',
     NOTE % ('sections B, C and E', 'A',
             'A3/A6/A8 name the emptied pool itself, where the downstream sections only see its '
             'consequences. C3 alone also catches M2, M3, M6 and M7.')),
    ('M3',  'g197a_pool_static.js',
     NOTE % ('section B (B1 counts the nameless items)', 'C',
             'C1 is pointed at the ruled symptom by name — the superset row the athlete reads with '
             'nothing in its name slot — and reports it as blanks/rows rather than as a bulk count. '
             'C3 alone also catches M2, M3, M6 and M7.')),
    ('M4',  'g197b_sweep.js', None),
    ('M5',  'g197a_pool_static.js', None),
    ('M6',  'g197b_sweep.js',
     NOTE % ('section C (C3 sees the dose vanish from a rendered card)', 'B',
             'B6b states the claim exactly — every Wall sit renders n×25 sec, never a rep count — '
             'and B6a proves the assertion is not vacuous first.')),
    ('M7',  'g197b_sweep.js',
     NOTE % ('sections C and E', 'B',
             'B4m names the legality hole directly (no leg machine reaches a cable-less tier) and the '
             'B4 census prints the offending names per tier. C3 alone also catches M2, M3, M6 and M7.')),
    ('M8',  'g197a_pool_static.js', None),
    ('M11', 'g197c_d84_cmp.js', None),
    ('M12', 'g197c_d84_cmp.js', None),
]

spec = open(SPEC, encoding='utf-8').read()
n = spec.count(GATE_LINE)
if n != len(REPOINT):
    sys.exit('ABORT: v197.json names gates/g197_leg_accessory.js %d times, expected %d' % (n, len(REPOINT)))

out, cursor = [], 0
for mut, gate, note in REPOINT:
    i = spec.index(GATE_LINE, cursor)
    repl = '    "gate": "gates/%s"' % gate
    if note:
        repl += ',\n    "note": %s' % json.dumps(note, ensure_ascii=False)
    out.append(spec[cursor:i]); out.append(repl)
    cursor = i + len(GATE_LINE)
out.append(spec[cursor:])
spec_new = ''.join(out)
if spec_new.count('g197_leg_accessory.js'):
    sys.exit('ABORT: v197.json still names the deleted gate')
json.loads(spec_new)   # it must still be JSON before it is written

# ════════════════════════════════════════════════════════════════════════════════════
# WRITE. Every anchor has hit; nothing before this line touched the tree.
# ════════════════════════════════════════════════════════════════════════════════════
WRITES = [
    (os.path.join(GATES, 'g197a_pool_static.js'), F1),
    (os.path.join(GATES, 'g197b_sweep.js'),       F2),
    (os.path.join(GATES, 'g197c_d84_cmp.js'),     F3),
    (os.path.join(GATES, 'g197d_d84_base.js'),    F4),
    (SPEC, spec_new),
]
for p, body in WRITES:
    open(p, 'w', encoding='utf-8').write(body)
    print('wrote %-46s %7d bytes' % (os.path.relpath(p, TESTS), len(body)))
os.remove(SRC)
print('removed %s (the split replaces it)' % os.path.relpath(SRC, TESTS))
