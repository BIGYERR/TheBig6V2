#!/usr/bin/env python3
# V200 D89 re-pin, SLICE 3 of 4.
# Replaces the three stale/dead HALF_MANNY digest literals with reads of a
# version-keyed table sited in tests/harness.js. index.html is NOT touched.
#
# Files: tests/harness.js, tests/gates/g197a_pool_static.js,
#        tests/gates/g198_posterior_floor.js, tests/gates/g197b_sweep.js
# Every anchor asserted count==1 before any byte is written; abort on first miss.

import io, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))   # tests/
REPO = os.path.dirname(ROOT)

def rd(p):
    with io.open(p, encoding='utf-8') as f: return f.read()

def wr(p, s):
    with io.open(p, 'w', encoding='utf-8') as f: f.write(s)

EDITS = []   # (path, old, new, label)

def plan(relpath, old, new, label):
    EDITS.append((os.path.join(REPO, relpath), old, new, label))

# ── 1. harness.js: the two tables + export ─────────────────────────────────────────
H_OLD = """module.exports = { load, extractInlineJS, fixtures, weekGrid, progDigest, DAYS, EXPORT_NAMES };"""
H_NEW = """// ── HALF_MANNY digest, keyed by the ia-version of the artifact under test ──────────
// gate.sh runs every gate against the PREVIOUS artifact first, so a bare literal pin
// makes unrelated gates red on the old build for a reason none of them tests. A row
// per era keeps them green on BOTH artifacts for the right reason, and an artifact
// whose version has NO row fails loudly: the lookup is undefined and the consuming
// gate asserts the row exists before it compares. An unruled digest move is exactly
// what this table is here to catch.
// These tables are also the record of which ruling changed Mario's program and when.
// Two tables, never one: the deload-off digest is a COUNTERFACTUAL oracle (the engine
// with recoveryDeload suppressed) and must not share a row with the shipped program.
const MANNY_DIGEST_BY_VERSION = {
  198: '6e32421331693437',
  199: '6e32421331693437',
  200: 'd4364dd3fa63a3a1',   // D89 re-pin: the ruled digest move
};

const MANNY_DELOAD_OFF_DIGEST_BY_VERSION = {
  199: '75ae3d256b642a9d',
  200: '5fe2c6bb32c76498',   // D89 re-pin: the ruled digest move
};

module.exports = { load, extractInlineJS, fixtures, weekGrid, progDigest, DAYS, EXPORT_NAMES,
                   MANNY_DIGEST_BY_VERSION, MANNY_DELOAD_OFF_DIGEST_BY_VERSION };"""
plan('tests/harness.js', H_OLD, H_NEW, 'harness: both version-keyed digest tables + export')

# ── 2. g197a_pool_static.js: D1 reads the table ────────────────────────────────────
plan('tests/gates/g197a_pool_static.js',
     "const { load, fixtures, progDigest } = require(path.join(__dirname, '..', 'harness.js'));",
     "const { load, fixtures, progDigest, MANNY_DIGEST_BY_VERSION } = require(path.join(__dirname, '..', 'harness.js'));",
     'g197a: import the table')

plan('tests/gates/g197a_pool_static.js',
     "const MANNY_DIGEST = '6e32421331693437';",
     "const MANNY_DIGEST = MANNY_DIGEST_BY_VERSION[IA.version];   // era row, not a literal (D89)",
     'g197a: D1 pin becomes a table read')

plan('tests/gates/g197a_pool_static.js',
     "  ok('D1 HALF_MANNY digest is ' + MANNY_DIGEST, d === MANNY_DIGEST, d);",
     "  ok('D1 HALF_MANNY digest matches the V' + IA.version + ' row (' + (MANNY_DIGEST || 'NO ROW') + ')',\n"
     "     !!MANNY_DIGEST && d === MANNY_DIGEST,\n"
     "     d + (MANNY_DIGEST ? '' : ' — no MANNY_DIGEST_BY_VERSION row for V' + IA.version + ': an unruled digest move'));",
     'g197a: D1 assertion requires the row to exist')

# ── 3. g198_posterior_floor.js: C1 reads the table ─────────────────────────────────
plan('tests/gates/g198_posterior_floor.js',
     "const {load, fixtures, progDigest}=require(path.join(__dirname,'..','harness.js'));",
     "const {load, fixtures, progDigest, MANNY_DIGEST_BY_VERSION}=require(path.join(__dirname,'..','harness.js'));",
     'g198: import the table')

plan('tests/gates/g198_posterior_floor.js',
     "const dig=progDigest(IA.buildProgram(fixtures.HALF_MANNY));\n"
     "ok(dig==='6e32421331693437', 'C1 HALF_MANNY digest is 6e32421331693437 (got '+dig+')');",
     "const dig=progDigest(IA.buildProgram(fixtures.HALF_MANNY));\n"
     "const MANNY_DIGEST=MANNY_DIGEST_BY_VERSION[IA.version];   // era row, not a literal (D89)\n"
     "ok(!!MANNY_DIGEST && dig===MANNY_DIGEST,\n"
     "   'C1 HALF_MANNY digest matches the V'+IA.version+' row ('+(MANNY_DIGEST||'NO ROW — no MANNY_DIGEST_BY_VERSION entry for this version: an unruled digest move')+') (got '+dig+')');",
     'g198: C1 pin becomes a table read')

# ── 4. g197b_sweep.js: the dead constant is WIRED, not deleted and not re-pinned ───
plan('tests/gates/g197b_sweep.js',
     "const { load, fixtures, progDigest } = require(path.join(__dirname, '..', 'harness.js'));",
     "const { load, fixtures, progDigest, MANNY_DIGEST_BY_VERSION } = require(path.join(__dirname, '..', 'harness.js'));",
     'g197b: import the table')

plan('tests/gates/g197b_sweep.js',
     "const MANNY_DIGEST = '6e32421331693437';",
     "const MANNY_DIGEST = MANNY_DIGEST_BY_VERSION[IA.version];   // era row, not a literal (D89)",
     'g197b: dead literal becomes a table read')

B8_OLD = """
console.log('\\nPASS ' + pass + ' FAIL ' + fail);
process.exit(fail ? 1 : 0);"""
B8_NEW = """
// ── D89: this sweep's fixture family needs an identity pin of its own ──────────────
// MANNY_DIGEST sat here unread for three passes. g197b sweeps the family HALF_MANNY
// belongs to, so it was the one sweep gate over that fixture with no identity check.
console.log('\\n-- B8. HALF_MANNY identity --');
{
  const d = progDigest(IA.buildProgram(fixtures.HALF_MANNY));
  ok('B8a HALF_MANNY digest matches the V' + IA.version + ' row (' + (MANNY_DIGEST || 'NO ROW') + ')',
     !!MANNY_DIGEST && d === MANNY_DIGEST,
     d + (MANNY_DIGEST ? '' : ' — no MANNY_DIGEST_BY_VERSION row for V' + IA.version + ': an unruled digest move'));
}

console.log('\\nPASS ' + pass + ' FAIL ' + fail);
process.exit(fail ? 1 : 0);"""
plan('tests/gates/g197b_sweep.js', B8_OLD, B8_NEW, 'g197b: the missing assertion (Mario ruled ADD, not delete)')

# ── verify EVERY anchor count==1 before writing a single byte ──────────────────────
cache = {}
for p, old, new, label in EDITS:
    if p not in cache:
        if not os.path.exists(p):
            sys.exit('ABORT: missing file ' + p)
        cache[p] = rd(p)

bad = []
for p, old, new, label in EDITS:
    n = cache[p].count(old)
    print('  anchor %-2s %s  [%s]' % (n, label, os.path.basename(p)))
    if n != 1:
        bad.append('%s: count==%d (need 1) in %s' % (label, n, p))
    cache[p] = cache[p].replace(old, new, 1)

if bad:
    for b in bad: print('ABORT ' + b)
    sys.exit('ABORT: no file written')

# index.html is out of scope for this slice; assert it by construction.
for p in cache:
    if p.endswith('index.html'):
        sys.exit('ABORT: slice 3 must not write index.html')

for p, s in cache.items():
    wr(p, s)
    print('wrote ' + p)
print('OK: 9 replacements across %d files' % len(cache))
