#!/usr/bin/env python3
# Post-V233 tooling pass, retirement slice R7. Tests only: index.html untouched, ia-version stays 233.
#
# RULING (Mario, tests/measure/v233_rulings/post_v233_proof_scope_decisions.md, Message 3): "retire the 121 except
# g219's D167 rows ... Amend standing ruling 3 to say a build-scoped claim retires when the next build ships, and the
# previous-version run is its replacement." Session reading in the same file: class-iii rows and baseline-licence hits
# are build-scoped and retire the same way, g193_budget_floor's BASE_VER === '192' / '197' / '198' among them.
# Evidence: measure mE (tests/measure/v233_rulings/measure_exact_version_mE.md); g193 is not in mE.
#
# Gates in this slice (node tests/version_scope.js --list before this script):
#   g229_d194_lens.js:328          VER === ERA (Q_LIVE)                       q (class iii; SKIP from 230 on)
#   g232_d199_runwheel.js:288,484  VER === ERA loader / VER !== ERA           D-untouched (class ii; the loader
#                                                                             fetched V231 for this row only)
#   g233_d207_bikewheel.js:281,458 VER === ERA loader / VER !== ERA           D211-untouched (class ii; the one
#                                                                             live exact-version row, PASS at 233)
#   g193_budget_floor.js:406,410   BASE_VER === '197' / '198'                 D85 / D91 displacement licences (B3
#                                                                             d85/d91LicenceClaims, B4c's 'Leg'
#                                                                             class licence, B4c1 to B4c4)
#   g193_budget_floor.js:483,495   BASE_VER === '192'                         B1b V192 core-census cross-check
#   g193_budget_floor.js:791       BASE_VER === '192'                         B3 V192 prehab-census cross-check
#   g193_budget_floor.js:928,937   BASE_VER === '192'                         B4 V192 non-optional-table cross-check
#   g193_budget_floor.js:1219      BASE_VER === '197'                         B4g2 V197 leg-compound cross-check
# None of the g193 hits is a REFUSE predicate and none selects the oracle file a live row reads: each switches its
# own assertion on one baseline version and is dark on every invocation since that baseline shipped.
#
# Diff classes: (R-a) the rows above retired with their predicates, their DEFER / N/A markers, the names in each
# gate's row table / order, and every helper, constant and loaded baseline nothing else reads (comments stripped);
# (R-b) the four gates' lines in tests/version_scope_debt.txt deleted (each gate goes to 0 hits).
# Kept because a live row reads them: g229 PX / patMemo / pat (row o), CAP, KNEE_STAMP; g193 D85_DISPLACED_NAMES,
# D47_RAIL_PER_TIER, V197_PREHAB_OTHER_* (the no-baseline D85/D47 floor), V192_CORE_NONLR_WIDE (B1b's no-baseline
# floor), D85_RULED_LEGFAM (B4g0), V197_LEG_COMPOUND_WIDE (B4g0); g232/g233 `skip` (the summary line reads it).
# Header comment blocks are left as they are (R1 to R4 precedent).
# Every anchor is asserted count == 1 before anything is written; the first miss aborts the whole script.
import os, re, sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
G = os.path.join(ROOT, 'tests', 'gates')
DEBT = os.path.join(ROOT, 'tests', 'version_scope_debt.txt')
RET = 'retired Post-V233 under standing ruling 3 (build-scoped; the previous-version run replaces it).'


def die(msg):
    sys.exit('ABORT ' + msg)


def one(s, a, what):
    n = s.count(a)
    if n != 1:
        die('%s: anchor count %d != 1: %r' % (what, n, a[:100]))


def rep(s, a, b, what):
    one(s, a, what)
    return s.replace(a, b)


def block(s, start, end, b, what, keep_end=False, to_eol=False):
    one(s, start, what + ' start')
    one(s, end, what + ' end')
    i, j = s.index(start), s.index(end)
    if j <= i:
        die(what + ': end before start')
    k = j if keep_end else j + len(end)
    if to_eol:
        k = s.index('\n', k) + 1
    return s[:i] + b + s[k:]


def dline(s, prefix, what):
    one(s, prefix, what)
    i = s.index(prefix)
    ls = s.rfind('\n', 0, i) + 1
    if s[ls:i].strip():
        die(what + ': prefix does not start its line')
    le = s.index('\n', i) + 1
    return s[:ls] + s[le:]


# ── g229_d194_lens.js: row q (D194 part 1's dormancy pin) ────────────────────────────────────────────────────────
def g229(s):
    w = 'g229'
    s = rep(s, ", cp = require('child_process'), crypto = require('crypto');", ", cp = require('child_process');", w + ' crypto')
    s = rep(s, "const SHARDS = 4, MARK = '__G229_RESULT__', SEED = 229194, DRAWS = 3;", "const SHARDS = 4, MARK = '__G229_RESULT__';", w + ' SEED/DRAWS')
    for p in ["const HOLDT = 'Your injury plan holds this one at RPE 7.';", "const TSAME = (to, from) => to + ' in, '",
              "const D8 = '2×6–10 @ RPE 8', D7 = '2×6–10 @ RPE 7';", "const SLHT = 'Single-leg hip thrust', BHT = ",
              "const CK7 = ['mario', 'knee_protect',"]:
        s = dline(s, p, w + ' ' + p[:12])
    for p in ['  + "globalThis.__cands=function(day,w,name){', '  + "globalThis.__canSwap=function(day,si,ii){',
              '  + "globalThis.__countPH=function(){']:
        s = dline(s, p, w + ' HELP ' + p[16:30])
    s = rep(s, 'return !_swapInjuryOK(n,cfg);});};"\n', 'return !_swapInjuryOK(n,cfg);});};";\n', w + ' HELP end')
    s = dline(s, 'function bootFrom(src, dst){', w + ' bootFrom')
    s = block(s, 'const slotOf = (IA, w, d, si, ii) =>',
              "const h12 = s => crypto.createHash('sha1').update(String(s)).digest('hex').slice(0, 12);\n", '', w + ' slotOf..h12')
    s = rep(s, 'const res = { ok:true, l1:[], q:[] };', 'const res = { ok:true, l1:[] };', w + ' worker res')
    s = block(s, '  for(const t of spec.q){',
              '    res.q.push({ ck:t.ck, tree:t.tree, pres:t.pres, n:out.length, rows:out }); }\n', '', w + ' worker q')
    s = dline(s, "  q:     'row q           DORMANCY PIN (VER === 229)", w + ' R.q')
    s = rep(s, "const ORDER = ['o', 'pSWAP', 'pAUX', 'pADD', 'pMAR', 'pUNS', 'pBRI', 'q'];",
            "const ORDER = ['o', 'pSWAP', 'pAUX', 'pADD', 'pMAR', 'pUNS', 'pBRI'];", w + ' ORDER')
    s = dline(s, 'const Q_LIVE = VER === ERA;', w + ' Q_LIVE')
    s = block(s, '// V230 (D194 part 2, Amendment 1 R3′): past 229 (q) is retired, not inverted',
              "the row is era 229 only). Never PASS, never FAIL.');\n",
              "// q (D194 part 1's dormancy pin on every overlay program, era 229; Amendment 1 R3′) " + RET + '\n', w + ' Q_RETIRE')
    s = rep(s, "if(!FILES.B){ ORDER.forEach(k => { if(k === 'q' && !Q_LIVE){ Q_RETIRE(); return; } ok(R[k] + ' (setup: no V'",
            "if(!FILES.B){ ORDER.forEach(k => { ok(R[k] + ' (setup: no V'", w + ' setup q branch')
    s = block(s, '// ── CHAIN SAMPLE (drawn on the baseline; see SAMPLE)', 'const CHAINS = {}; ',
              "// q's chain sample " + RET + ' pat() stays: row o reads it.\n', w + ' sample head')
    s = block(s, 'if(Q_LIVE) try { const X = fresh(BF); let tot = 0; const den = [];\n',
              "P('  SAMPLE generation CRASH ' + String(e && e.stack || e).slice(0, 400)); }\n", '', w + ' sample body')
    s = dline(s, "const QT = []; CK7.forEach(ck => {", w + ' QT')
    s = rep(s, '({ art:CF, base:BF, l1:[], q:[], chains:{} })', '({ art:CF, base:BF, l1:[] })', w + ' shards')
    s = dline(s, '(Q_LIVE ? QT : []).forEach((t, i) => {', w + ' QT deal')
    s = block(s, '// (q) hand routes U1, U2, RB on mario W5 thu, overlay on both trees, fixture on the candidate\n',
              'fc.direct.d === D8;\n});\n\n', '', w + ' routes')
    s = block(s, '  // q sample\n  if(Q_LIVE){\n',
              "QR.got + (RES.qh ? '; hand routes ' + RES.qh[1] : '')];\n  }\n", '', w + ' merge q')
    s = rep(s, "  ORDER.forEach(k => { if(k === 'q' && !Q_LIVE){ Q_RETIRE(); return; }\n    const r = RES[k]",
            "  ORDER.forEach(k => {\n    const r = RES[k]", w + ' print q branch')
    return s


# ── g232_d199_runwheel.js / g233_d207_bikewheel.js: the build-pair "moved nothing" rows ───────────────────────────
def pair_gate(s, w, era, base_line, row, rtab_prefix, head, row_end, extra):
    s = rep(s, "const fs = require('fs'), path = require('path'), os = require('os'), cp = require('child_process');",
            "const fs = require('fs'), path = require('path');", w + ' os/cp')
    s = rep(s, 'const { load, progDigest } = H;', 'const { load } = H;', w + ' progDigest')
    s = dline(s, 'const BASEFILE = process.argv[3] ? path.resolve(process.argv[3]) : null;', w + ' BASEFILE')
    s = rep(s, base_line, 'const ERA = %d;' % era, w + ' BASE_ERA/commit')
    for p in extra:
        s = dline(s, p, w + ' ' + p[:16])
    s = dline(s, "const skipRow = (l, why) => { skip++; P('SKIP ' + l + ': ' + why); };", w + ' skipRow')
    s = dline(s, 'const TMPS = [];', w + ' TMPS')
    s = dline(s, "process.on('exit', () => TMPS.forEach(", w + ' TMPS exit')
    s = dline(s, 'function tmpWrite(tag, text){', w + ' tmpWrite')
    s = dline(s, rtab_prefix, w + ' R row')
    s = block(s, "let BF = null, baseWhy = '';\n",
              "P('  V' + BASE_ERA + ' baseline: ' + (BF ? 'LIVE (' + baseWhy + ')' : 'not loaded (' + baseWhy + ')'));\n", '', w + ' loader')
    s = block(s, head, row_end, row + '\n', w + ' rowUntouched')
    return s


def g233(s):
    s = pair_gate(s, 'g233', 233, "const ERA = 233, BASE_ERA = 232, V232_COMMIT = '6ee30ea';",
                  "// D211-untouched (D211, the V233 build pair: D207 to D210 moved only the bike form against V232; HALF_MANNY era row 233) " + RET,
                  "  'D211-untouched': 'row D211-untouched (pair 233 vs 232)",
                  '// ── ROW D211-untouched (pair 233 vs 232 only)', "  row('D211-untouched', cj);\n}\n",
                  ["const MANNY_HAND = '2d35e8f743680cfa';"])
    return rep(s, ", 'D211-untouched':rowUntouched };", ' };', 'g233 ROWS')


# ── g193_budget_floor.js: the baseline licences and the one-baseline cross-checks ────────────────────────────────
def g193(s):
    w = 'g193'
    s = block(s, '// D85 (V198) licence switch. Read the long note above prehabClaim before touching it. It is\n',
              'var D91_LICENCE_ON = false;\n',
              '// The D85 (V198) and D91 (V199) licence switches (armed only on a V197 / V198 baseline) ' + RET + '\n', w + ' switches')
    s = dline(s, 'const V192_NONOPT_NARROW = {', w + ' V192_NONOPT_NARROW')
    s = block(s, "  // D85 (V198): the licence is armed HERE and nowhere else, from the baseline's own\n",
              "  D91_LICENCE_ON = (String(BASE_VER) === '198' && !USE_FULL);\n", '', w + ' arming')
    s = dline(s, "  defer('B4 baseline-identity cross-check against the transcribed V192 non-optional-deletion tables (wide and narrow)', 'no baseline file supplied');",
              w + ' B4 xchk defer')
    s = block(s, '    // The transcribed fallback and the live baseline must agree, or the table is a fossil\n',
              ": 'the baseline supplied is v' + BASE_VER + ', not v192, so nothing on this run confirms the fallback table is still the V192 truth');\n    }\n",
              "    // B1b's live-baseline cross-check of the transcribed V192 off-long-run core census (V193 widening; asserted only on a V192 baseline) " + RET + '\n',
              w + ' B1b xchk')
    s = block(s, "    defer('B1b live-baseline cross-check of the transcribed V192 off-long-run core census',\n",
              "      'no baseline file supplied; the table is applied as a floor below but nothing on this run confirms it is still the V192 truth');\n",
              '', w + ' B1b xchk defer')
    s = block(s, '// ── D85 DISPLACEMENT LICENCE (V198)', 'const D85_DISPLACEMENT_SUM  = 661;',
              "// B3 (D85, V198): the licensed-displacement table " + RET + ' The names, the D47 rail and the V197 floor below stay: the no-baseline floor reads them.\n',
              w + ' D85 table', to_eol=True)
    s = block(s, '// ── D91 DISPLACEMENT LICENCE (V199)', 'const D91_DISPLACED_NAMES = [',
              '// B3 (D91, V199): the licensed-displacement table and names ' + RET + '\n', w + ' D91 table', to_eol=True)
    s = block(s, '// ── B3 (D85, LICENCE): the displacement, asserted as an equality and confined by name ──',
              '// ── B3: prehab delta vs V192, on both lattices',
              '// B3 (D85, V198) and B3 (D91, V199) licence claims (equality and confinement against a V197 / V198 baseline) ' + RET + '\n\n',
              w + ' licence claims', keep_end=True)
    s = block(s, '  // THE V192-SPECIFIC CROSS-CHECK. This claim needs a baseline that IS V192; it cannot be\n',
              "    defer(XCHK, 'no baseline file supplied; the table is applied as the floor below but nothing on this run confirms it is still the V192 truth');\n  }\n",
              '  // B3 live-baseline cross-check of the hand-transcribed V192 prehab census (asserted only on a V192 baseline) ' + RET + '\n',
              w + ' B3 xchk')
    s = block(s, '    // D85 (V198): on the wide lattice against the V197 baseline the bare ratchet below is\n',
              '      d91LicenceClaims(tag, cand, base);\n    }\n    else if (!belowBase.length) ok(',
              "    // B3's D85 / D91 licence branches (V197 / V198 baselines) " + RET + '\n    if (!belowBase.length) ok(',
              w + ' B3 licence branches')
    s = block(s, "    if (BASE_VER === '192' && USE_FULL){\n",
              "', not v192, so nothing on this run confirms either table is still the V192 truth');\n    }\n",
              "    // B4's baseline-identity cross-check against the transcribed V192 non-optional-deletion tables (asserted only on a V192 baseline) " + RET + '\n',
              w + ' B4 xchk')
    s = block(s, '  // ── D85 CLASS LICENCE (V198)',
              '  const D85_LICENSED_CLS = D85_LICENCE_ON ? Object.keys(D85_NEW_CLASSES_WIDE) : [];\n', '', w + ' B4c licence')
    s = rep(s, 'const newKinds = Object.keys(C.kinds).filter(k => allowed.indexOf(k) < 0 && D85_LICENSED_CLS.indexOf(k) < 0);',
            'const newKinds = Object.keys(C.kinds).filter(k => allowed.indexOf(k) < 0);', w + ' B4c newKinds')
    s = rep(s, "' that oracle emptied' +\n    (D85_LICENSED_CLS.length ? ' plus the D85-licensed [' + D85_LICENSED_CLS.join(', ') + ']' : '') + ')');",
            "' that oracle emptied)');", w + ' B4c message')
    legfam = re.findall(r'(?m)^  const D85_RULED_LEGFAM = .*\n', s)
    if len(legfam) != 1:
        die(w + ' D85_RULED_LEGFAM line count %d' % len(legfam))
    s = block(s, '  if (D85_LICENCE_ON){\n    const wrongCls',
              "                : 'no baseline file supplied, so there is no census to fall from');\n  }\n",
              "  // B4c1 to B4c4 (D85, V198: the licensed 'Leg' class census and the two counter-claims, keyed to a V197 baseline) " + RET
              + ' D85_RULED_LEGFAM stays: B4g0 reads it.\n' + legfam[0], w + ' B4c1-4')
    s = block(s, '    // B4g2 — the pin is a transcription of a real artifact, so it is re-proved against that\n',
              "        : 'no baseline file supplied, so there is no artifact on this run to cross-check the pinned table against');\n",
              '    // B4g2 (D81: the pinned V197 leg-compound census re-proved on a V197 baseline) ' + RET + '\n', w + ' B4g2')
    return s


def g232_fixed(s):
    s = pair_gate(s, 'g232', 232, "const ERA = 232, BASE_ERA = 231, V231_COMMIT = '5d9354b';",
                  "// D-untouched (the V232 build pair: D199 to D206 moved no generic run, reps_dist, bike or swim markup against V231; HALF_MANNY era row 232) " + RET,
                  "  'D-untouched': 'row D-untouched (pair 232 vs 231)",
                  '// ── ROW D-untouched (pair 232 vs 231 only)', "  row('D-untouched', cj);\n}\n", [])
    return rep(s, ", 'D-untouched':rowUntouched };", ' };', 'g232 ROWS')


# ── comments-stripped reader check ───────────────────────────────────────────────────────────────────────────────
def strip(src):
    out = []
    for line in src.split('\n'):
        i, q, res = 0, None, ''
        while i < len(line):
            c = line[i]
            if q:
                res += c
                if c == '\\':
                    res += line[i + 1:i + 2]; i += 2; continue
                if c == q:
                    q = None
            elif c in '"\'`':
                q = c; res += c
            elif line.startswith('//', i):
                break
            else:
                res += c
            i += 1
        out.append(res)
    return '\n'.join(out)


def readers(code, name):
    return len(re.findall(r'(?<![\w$])' + re.escape(name) + r'(?![\w$])', code))


CHECK = {
    'g229_d194_lens.js': (
        ['Q_LIVE', 'Q_RETIRE', 'CHAINS', 'prng', 'pick', 'pickK', 'QT', 'QR', 'routes', 'routeLines', 'fmtS', 'hop', 'undoLast',
         'slotOf', 'dayJ', 'rxOf', 'h12', 'crypto', 'bootFrom', 'D8', 'D7', 'SLHT', 'BHT', 'LEXT', 'BGM', 'HOLDT', 'TSAME', 'DRAWS',
         'SEED', 'CK7', '__cands', '__canSwap', '__countPH', 'spec.q'],
        ['PX', 'patMemo', 'pat', 'CAP', 'KNEE_STAMP', 'guard', 'stripClock', 'MARK', 'judgeMk', 'stored', 'weekLists', 'rowKey', 'setup', 'fresh']),
    'g232_d199_runwheel.js': (
        ['BF', 'baseWhy', 'BASEFILE', 'BASE_ERA', 'V231_COMMIT', 'tmpWrite', 'TMPS', 'skipRow', 'cp', 'os', 'progDigest', 'rowUntouched'],
        ['skip', 'H', 'load', 'DOSES', 'fs', 'path', 'mkEnv']),
    'g233_d207_bikewheel.js': (
        ['BF', 'baseWhy', 'BASEFILE', 'BASE_ERA', 'V232_COMMIT', 'tmpWrite', 'TMPS', 'skipRow', 'cp', 'os', 'progDigest', 'rowUntouched', 'MANNY_HAND'],
        ['skip', 'H', 'load', 'RUN_TIME_DOSE', 'fs', 'path', 'mkEnv']),
    'g193_budget_floor.js': (
        ['D85_LICENCE_ON', 'D91_LICENCE_ON', 'd85LicenceClaims', 'd91LicenceClaims', 'D85_DISPLACEMENT_WIDE', 'D85_DISPLACEMENT_SUM',
         'D91_DISPLACEMENT_WIDE', 'D91_DISPLACEMENT_SUM', 'D91_DISPLACED_NAMES', 'XCHK', 'D85_NEW_CLASSES_WIDE', 'D85_LICENSED_CLS',
         'D85_RULED_TOTAL', 'D85_LEG_FAMILY', 'V192_NONOPT_NARROW'],
        ['D85_DISPLACED_NAMES', 'D47_RAIL_PER_TIER', 'V197_PREHAB_OTHER_WIDE', 'V197_PREHAB_OTHER_SUM', 'V192_CORE_NONLR_WIDE',
         'V192_NONOPT_WIDE', 'D85_RULED_LEGFAM', 'V197_LEG_COMPOUND_WIDE', 'totB', 'totC', 'BASE_VER', 'na', 'info', 'railClaim', 'USE_FULL']),
}

EDITS = {'g229_d194_lens.js': g229, 'g232_d199_runwheel.js': g232_fixed, 'g233_d207_bikewheel.js': g233, 'g193_budget_floor.js': g193}

out = {}
for f, fn in EDITS.items():
    p = os.path.join(G, f)
    src = open(p, encoding='utf-8').read()
    new = fn(src)
    code = strip(new)
    gone, kept = CHECK[f]
    bad = [n for n in gone if readers(code, n)]
    if bad:
        die('%s: retired names still read: %s' % (f, bad))
    lost = [n for n in kept if readers(code, n) < 2]
    if lost:
        die('%s: kept names no longer read: %s' % (f, lost))
    vs = re.findall(r"BASE_VER\)? === '\d+'|VER [!=]== ERA\b", code)
    if vs:
        die('%s: exact-version predicate left: %s' % (f, vs))
    out[p] = new
    print('%-24s %5d -> %5d lines' % (f, src.count('\n'), new.count('\n')))

for p, new in out.items():
    open(p, 'w', encoding='utf-8').write(new)

# (R-b) re-read the debt file immediately before writing; delete only this slice's four lines
d = open(DEBT, encoding='utf-8').read()
for gate in ['g193_budget_floor.js 8  #', 'g229_d194_lens.js 1  #', 'g232_d199_runwheel.js 2  #', 'g233_d207_bikewheel.js 2  #']:
    lines = [l for l in d.split('\n') if l.startswith(gate)]
    if len(lines) != 1:
        die('debt line %r count %d' % (gate, len(lines)))
    one(d, lines[0] + '\n', 'debt ' + gate)
    d = d.replace(lines[0] + '\n', '')
open(DEBT, 'w', encoding='utf-8').write(d)
print('debt: g193_budget_floor 8 -> 0, g229_d194_lens 1 -> 0, g232_d199_runwheel 2 -> 0, g233_d207_bikewheel 2 -> 0 (lines deleted)')
