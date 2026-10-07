#!/usr/bin/env python3
# Post-V233 tooling pass, conversion slice V5 (tests only; index.html untouched, ia-version stays 233).
# Ruling: Mario, tests/measure/v233_rulings/post_v233_proof_scope_decisions.md, Message 5; CLAUDE.md Proof scope,
# Row manifest and Version scope: "Every new gate, and every gate converted by hand, prints its rows through the
# shared status helper tests/status.js"; "Every row a gate declares prints exactly one status line (PASS, FAIL, SKIP
# or SCOPED OUT), and a declared row with no status line is red." Evidence: measure mR
# (tests/measure/v233_rulings/measure_row_status_mR.md): g229_d193_build and g229_d194_lens print 0 keyed lines;
# g230_d194_lens2 prints its primed rows (d193-k″, d193-e′, d194-q′) and its instrument rows with no parseable id.
#
# Diff class (V-a): gate printing routed through tests/status.js; every assertion's logic, inputs, expected values
# and oracle unchanged. Each gate: STAT.declare([...]) of exactly its row set, one status line per declared id, the
# helper's summary() in place of the gate's own. `STAT` because every gate here already binds `S` or `ST` in some
# scope. The gate's ok() keeps its name and its call sites, and gains the row key as its first argument (the R key the
# label already came from); its label is the R text without the `row <name>` prefix (the id carries the name). In
# g229_d194_lens and g230_d194_lens2 the verdicts are merged in the parent and printed there only; workers keep
# returning data. A boot failure, formerly one unkeyed `FAIL boot:` line, FAILS every declared row by name (the
# REFUSED path's form); exit 1 as before.
#
# Old -> new ids
#   g229_d193_build  a d193-a, b d193-b, d-BWSETS d193-d-BWSETS, d-GRAMMAR d193-d-GRAMMAR, d-WAVE d193-d-WAVE,
#                    d-LOADCAP d193-d-LOADCAP, f d193-f, g d193-g, h d193-h, j d193-j            (D193 gate claims)
#   g229_d194_lens   o d194-o, p-SWAP d194-p-SWAP, p-AUX d194-p-AUX, p-ADD d194-p-ADD, p-MARIO d194-p-MARIO,
#                    p-UNSTAMPED d194-p-UNSTAMPED, p-BRIDGE d194-p-BRIDGE                         (D194 gate claims)
#   g230_d194_lens2  inst-self d194-inst-self, inst-stamp d194-inst-stamp, inst-ov1 d194-inst-ov1 (a letter run then
#                    a digit is the id grammar), d193-k″ d193-k-dprime, d193-e′ d193-e-prime, d194-q′ d194-q-prime
#                    (ASCII only), and d193-e, d193-k, d193-l, d193-i, d193-i-r, d193-i-u, d194-eq, d194-postsweep
#                    unchanged.
#
# Every anchor is asserted count==1 in the file's state at that step; the first miss aborts the whole script before
# any file is written.
import os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
G = os.path.join(ROOT, 'tests', 'gates')
ID_RE = re.compile(r'^[A-Za-z]{1,6}[0-9][A-Za-z0-9.\-]*$')


def die(msg):
    print('ABORT: ' + msg)
    sys.exit(1)


def rep(name, src, old, new):
    n = src.count(old)
    if n != 1:
        die('%s: anchor count %d (want 1): %r' % (name, n, old[:120]))
    return src.replace(old, new)


HELPER_DOC = r"""// ROW IDS (post-V233 V5; CLAUDE.md Proof scope, Row manifest): every row prints its one status line through the
// shared helper tests/status.js. %s
// A row's label is its R text without the `row <name>` prefix (the id carries the name); a PASS keeps the figures in
// parentheses, a FAIL prints them as its detail. A boot failure, REFUSED or a setup failure FAILS every row by name.
"""

EDITS = {}

# ---------------------------------------------------------------- g229_d193_build ------------------------------
D193_IDS = [('a', 'd193-a'), ('b', 'd193-b'), ('dBW', 'd193-d-BWSETS'), ('dGR', 'd193-d-GRAMMAR'),
            ('dWV', 'd193-d-WAVE'), ('dLC', 'd193-d-LOADCAP'), ('f', 'd193-f'), ('g', 'd193-g'), ('h', 'd193-h'),
            ('j', 'd193-j')]
EDITS['g229_d193_build.js'] = [
(r"""let pass = 0, fail = 0;
const t0 = Date.now();
const ok = (l, c, g) => { if(c){ pass++; console.log('PASS ' + l + (g === undefined ? '' : ' (' + g + ')')); } else { fail++; console.log('FAIL ' + l + (g === undefined ? '' : ' (got ' + g + ')')); } };
const secs = () => ((Date.now() - t0) / 1000).toFixed(1) + ' s';
const done = () => { console.log('  runtime ' + secs()); console.log('\nPASS ' + pass + ' FAIL ' + fail); process.exit(fail ? 1 : 0); };
""",
r"""const t0 = Date.now();
""" + HELPER_DOC % 'Ids: d193-<the row\'s name> (D193\'s gate claim letters), declared from R\'s keys below.' + r"""const STAT = require('../status')('g229_d193_build');
const ID = { a:'d193-a', b:'d193-b', dBW:'d193-d-BWSETS', dGR:'d193-d-GRAMMAR', dWV:'d193-d-WAVE', dLC:'d193-d-LOADCAP', f:'d193-f', g:'d193-g', h:'d193-h', j:'d193-j' };
const lab = l => String(l).replace(/^row \S+ +/, '');
const ok = (k, l, c, g) => c ? STAT.pass(ID[k], lab(l) + (g === undefined ? '' : ' (' + g + ')')) : STAT.fail(ID[k], lab(l), g === undefined ? '' : 'got ' + g);
const secs = () => ((Date.now() - t0) / 1000).toFixed(1) + ' s';
const done = () => { console.log('  runtime ' + secs()); STAT.summary(); };
"""),
(r"""};

// ── TYPED ORACLE ─""",
 r"""};
STAT.declare(Object.keys(R).map(k => ID[k]));   // an R key with no id throws: no summary, red

// ── TYPED ORACLE ─"""),
(r"""try { IA = load(ART); STAMP = +IA.version; } catch(e){ console.log('FAIL boot: ' + e.message); fail++; done(); }""",
 r"""try { IA = load(ART); STAMP = +IA.version; } catch(e){ Object.keys(R).forEach(k => ok(k, R[k] + ' (boot: ' + e.message + ')', false)); done(); }"""),
(r"""  Object.keys(R).forEach(k => ok(R[k] + ' (REFUSED)', false));""",
 r"""  Object.keys(R).forEach(k => ok(k, R[k] + ' (REFUSED)', false));"""),
(r"""['a', 'b', 'dBW', 'dGR', 'dWV', 'dLC', 'h', 'j'].forEach(k => ok(R[k] + setupNote, false));""",
 r"""['a', 'b', 'dBW', 'dGR', 'dWV', 'dLC', 'h', 'j'].forEach(k => ok(k, R[k] + setupNote, false));"""),
(r"""    ok(R.a, selfAll""", r"""    ok('a', R.a, selfAll"""),
(r"""  ok(R.b + (has""", r"""  ok('b', R.b + (has"""),
(r"""const d = D[kind] || newD(); ok(R[key], selfAll""", r"""const d = D[kind] || newD(); ok(key, R[key], selfAll"""),
(r"""    ok(R.dBW + ' [V231""", r"""    ok('dBW', R.dBW + ' [V231"""),
(r"""    ok(R.dWV, patOK""", r"""    ok('dWV', R.dWV, patOK"""),
(r"""  if(!BASE_OK) ok(R.dLC + setupNote, false);""", r"""  if(!BASE_OK) ok('dLC', R.dLC + setupNote, false);"""),
(r"""    ok(R.h, selfAll""", r"""    ok('h', R.h, selfAll"""),
(r"""    ok(R.j + ' [V231""", r"""    ok('j', R.j + ' [V231"""),
(r"""  else ok(R.j, selfAll""", r"""  else ok('j', R.j, selfAll"""),
(r"""  ok(R.f + (VER""", r"""  ok('f', R.f + (VER"""),
(r"""  ok(R.g, allOK""", r"""  ok('g', R.g, allOK"""),
]

# ---------------------------------------------------------------- g229_d194_lens -------------------------------
D194_IDS = [('o', 'd194-o'), ('pSWAP', 'd194-p-SWAP'), ('pAUX', 'd194-p-AUX'), ('pADD', 'd194-p-ADD'),
            ('pMAR', 'd194-p-MARIO'), ('pUNS', 'd194-p-UNSTAMPED'), ('pBRI', 'd194-p-BRIDGE')]
EDITS['g229_d194_lens.js'] = [
(r"""let pass = 0, fail = 0; const t0 = Date.now();
const ok = (l, c, g) => { if(c){ pass++; console.log('PASS ' + l + (g === undefined ? '' : ' (' + g + ')')); } else { fail++; console.log('FAIL ' + l + (g === undefined ? '' : ' (got ' + g + ')')); } };
const secs = () => ((Date.now() - t0) / 1000).toFixed(1) + ' s';
const done = () => { console.log('  runtime ' + secs()); console.log('\nPASS ' + pass + ' FAIL ' + fail); process.exit(fail ? 1 : 0); };
""",
r"""const t0 = Date.now();
""" + HELPER_DOC % 'Ids: d194-<the row\'s name> (D194\'s gate claims), declared from ORDER below; the parent prints, workers return data.' + r"""const STAT = require('../status')('g229_d194_lens');
const ID = { o:'d194-o', pSWAP:'d194-p-SWAP', pAUX:'d194-p-AUX', pADD:'d194-p-ADD', pMAR:'d194-p-MARIO', pUNS:'d194-p-UNSTAMPED', pBRI:'d194-p-BRIDGE' };
const lab = l => String(l).replace(/^row \S+ +/, '');
const ok = (k, l, c, g) => c ? STAT.pass(ID[k], lab(l) + (g === undefined ? '' : ' (' + g + ')')) : STAT.fail(ID[k], lab(l), g === undefined ? '' : 'got ' + g);
const secs = () => ((Date.now() - t0) / 1000).toFixed(1) + ' s';
const done = () => { console.log('  runtime ' + secs()); STAT.summary(); };
"""),
(r"""const ORDER = ['o', 'pSWAP', 'pAUX', 'pADD', 'pMAR', 'pUNS', 'pBRI'];
""",
 r"""const ORDER = ['o', 'pSWAP', 'pAUX', 'pADD', 'pMAR', 'pUNS', 'pBRI'];
STAT.declare(ORDER.map(k => ID[k]));   // an ORDER key with no id throws: no summary, red
"""),
(r"""try { IA = load(ART); STAMP = +IA.version; } catch(e){ console.log('FAIL boot: ' + e.message); fail++; done(); }""",
 r"""try { IA = load(ART); STAMP = +IA.version; } catch(e){ ORDER.forEach(k => ok(k, R[k] + ' (boot: ' + e.message + ')', false)); done(); }"""),
(r"""  ORDER.forEach(k => ok(R[k] + ' (REFUSED)', false));""",
 r"""  ORDER.forEach(k => ok(k, R[k] + ' (REFUSED)', false));"""),
(r"""if(!FILES.B){ ORDER.forEach(k => { ok(R[k] + ' (setup: no V'""",
 r"""if(!FILES.B){ ORDER.forEach(k => { ok(k, R[k] + ' (setup: no V'"""),
(r"""const r = RES[k] || [false, 'row not computed']; ok(R[k], r[0], r[1]); });""",
 r"""const r = RES[k] || [false, 'row not computed']; ok(k, R[k], r[0], r[1]); });"""),
(r"""ORDER.forEach(k => ok(R[k] + ' (merge crashed)', false)); done(); });""",
 r"""ORDER.forEach(k => ok(k, R[k] + ' (merge crashed)', false)); done(); });"""),
]

# ---------------------------------------------------------------- g230_d194_lens2 ------------------------------
G230_IDS = [('inst-self', 'd194-inst-self'), ('inst-stamp', 'd194-inst-stamp'), ('inst-ov1', 'd194-inst-ov1'),
            ('d193-e', 'd193-e'), ('d193-k″', 'd193-k-dprime'), ('d193-e′', 'd193-e-prime'), ('d193-k', 'd193-k'),
            ('d193-l', 'd193-l'), ('d193-i', 'd193-i'), ('d193-i-r', 'd193-i-r'), ('d193-i-u', 'd193-i-u'),
            ('d194-eq', 'd194-eq'), ('d194-q′', 'd194-q-prime'), ('d194-postsweep', 'd194-postsweep')]
EDITS['g230_d194_lens2.js'] = [
(r"""let pass = 0, fail = 0; const t0 = Date.now();
const P = s => console.log(s);
const ok = (l, c, g) => { if(c){ pass++; P('PASS ' + l + (g === undefined ? '' : ' (' + g + ')')); } else { fail++; P('FAIL ' + l + (g === undefined ? '' : ' (got ' + g + ')')); } };
const done = () => { P('  runtime ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s'); P('\nPASS ' + pass + ' FAIL ' + fail); process.exit(fail ? 1 : 0); };
""",
r"""const t0 = Date.now();
const P = s => console.log(s);
""" + HELPER_DOC % 'Ids: the row names, ASCII and in the id grammar (inst-* -> d194-inst-*, ″ -> -dprime, ′ -> -prime), declared from ORDER below; the parent prints, workers return data.' + r"""const STAT = require('../status')('g230_d194_lens2');
const ID = { 'inst-self':'d194-inst-self', 'inst-stamp':'d194-inst-stamp', 'inst-ov1':'d194-inst-ov1', 'd193-e':'d193-e', 'd193-k″':'d193-k-dprime', 'd193-e′':'d193-e-prime',
  'd193-k':'d193-k', 'd193-l':'d193-l', 'd193-i':'d193-i', 'd193-i-r':'d193-i-r', 'd193-i-u':'d193-i-u', 'd194-eq':'d194-eq', 'd194-q′':'d194-q-prime', 'd194-postsweep':'d194-postsweep' };
const lab = l => String(l).replace(/^row \S+ +/, '');
const ok = (k, l, c, g) => c ? STAT.pass(ID[k], lab(l) + (g === undefined ? '' : ' (' + g + ')')) : STAT.fail(ID[k], lab(l), g === undefined ? '' : 'got ' + g);
const done = () => { P('  runtime ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s'); STAT.summary(); };
"""),
(r"""const ORDER = INST.concat(FIG);
""",
 r"""const ORDER = INST.concat(FIG);
STAT.declare(ORDER.map(k => ID[k]));   // an ORDER key with no id throws: no summary, red
"""),
(r"""try { IA = load(ART); STAMP = +IA.version; } catch(e){ P('FAIL boot: ' + e.message); fail++; done(); }""",
 r"""try { IA = load(ART); STAMP = +IA.version; } catch(e){ ORDER.forEach(k => ok(k, R[k] + ' (boot: ' + e.message + ')', false)); done(); }"""),
(r"""  ORDER.forEach(k => ok(R[k] + ' (REFUSED)', false));""",
 r"""  ORDER.forEach(k => ok(k, R[k] + ' (REFUSED)', false));"""),
(r"""if(!BF){ ORDER.forEach(k => ok(R[k] + ' (setup: no V'""",
 r"""if(!BF){ ORDER.forEach(k => ok(k, R[k] + ' (setup: no V'"""),
(r"""INST.forEach(k => { const r = RES[k] || [false, 'row not computed']; ok(R[k], r[0], r[1]); });""",
 r"""INST.forEach(k => { const r = RES[k] || [false, 'row not computed']; ok(k, R[k], r[0], r[1]); });"""),
(r"""    if(!INSTR_OK){ ok(R[k] + ' (not read: instrument ' + INST.filter(i => !(RES[i] && RES[i][0])).join(', ') + ' failed)', false); return; }""",
 r"""    if(!INSTR_OK){ ok(k, R[k] + ' (not read: instrument ' + INST.filter(i => !(RES[i] && RES[i][0])).map(i => ID[i]).join(', ') + ' failed)', false); return; }"""),
(r"""
    const r = RES[k] || [false, 'row not computed']; ok(R[k], r[0], r[1]); });""",
 r"""
    const r = RES[k] || [false, 'row not computed']; ok(k, R[k], r[0], r[1]); });"""),
(r"""ORDER.forEach(k => ok(R[k] + ' (merge crashed)', false)); done(); });""",
 r"""ORDER.forEach(k => ok(k, R[k] + ' (merge crashed)', false)); done(); });"""),
]

IDMAPS = {'g229_d193_build.js': D193_IDS, 'g229_d194_lens.js': D194_IDS, 'g230_d194_lens2.js': G230_IDS}


def js_keys(src, start_pat, name):
    """The keys of the R map: the quoted or bare keys at the start of each line of `const R = {` ... `};`."""
    i = src.find(start_pat)
    if i < 0 or src.count(start_pat) != 1:
        die(name + ': R map not found exactly once')
    j = src.index('\n};', i)
    keys = []
    for line in src[i + len(start_pat):j].split('\n'):
        m = re.match(r"\s*(?:'([^']+)'|([A-Za-z]\w*))\s*:", line)
        if m:
            keys.append(m.group(1) or m.group(2))
    return keys


# ── apply in memory; every anchor count==1 first ──
OUT = {}
for name, edits in EDITS.items():
    p = os.path.join(G, name)
    src = open(p, encoding='utf-8').read()
    for old, new in edits:
        src = rep(name, src, old, new)
    OUT[name] = src

# ── post-conditions: no old helper survives, every ok() call carries a key, every id is in the grammar ──
for name, src in OUT.items():
    code = re.sub(r'(?m)^\s*//.*$', '', src)
    for bad in ('pass++', 'fail++', "'FAIL boot: '", "'\\nPASS ' + pass", 'process.exit(fail'):
        if bad in code:
            die(name + ': old helper text survives: ' + bad)
    if re.search(r'\bok\(R[.\[]', code):
        die(name + ': an ok() call still passes a label first')
    ids = [i for _, i in IDMAPS[name]]
    if len(set(ids)) != len(ids):
        die(name + ': duplicate id')
    for i in ids:
        if not ID_RE.match(i):
            die(name + ': id outside the status.js grammar: ' + i)
    keys = js_keys(src, '\nconst R = {\n', name)
    want = [k for k, _ in IDMAPS[name]]
    if keys != want:
        die(name + ': R keys %r != id map keys %r' % (keys, want))
    for k, i in IDMAPS[name]:
        lit = ("'%s':'%s'" % (k, i)) if not re.match(r'^[A-Za-z]\w*$', k) else ('%s:%r' % (k, i)).replace('"', "'")
        if code.count(lit) != 1:
            die(name + ': ID map entry %s not found once' % lit)
    calls = re.findall(r'\bok\(([^,]+),', code)
    for c in calls:
        c = c.strip()
        if c in ('k', 'key', 'k, l'):
            continue
        if c.startswith('(k'):
            continue
        if not (c[0] == "'" and c[-1] == "'" and c[1:-1] in want):
            die(name + ': ok() call with key %r' % c)

for name, src in OUT.items():
    with open(os.path.join(G, name), 'w', encoding='utf-8') as f:
        f.write(src)
    print('wrote tests/gates/' + name + ' (' + str(len(EDITS[name])) + ' edits, ' + str(len(IDMAPS[name])) + ' ids)')
