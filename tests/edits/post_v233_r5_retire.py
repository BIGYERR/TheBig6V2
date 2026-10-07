#!/usr/bin/env python3
# Post-V233 tooling pass, retirement slice R5 (tests only; index.html untouched, ia-version stays 233).
# Mario, tests/measure/v233_rulings/post_v233_proof_scope_decisions.md Message 3: the dark build-scoped rows
# retire; standing ruling 3 as amended: a build-scoped claim retires when the next build ships, and the
# previous-version run is its replacement. Session reading: class-iii rows retire the same way.
# Evidence: measure mE (measure_exact_version_mE.md).
# Gates: g217_d160_dedupe_view (R1 x4, R2, D1, E1: PAIR = VER === 217), g218_d157_swim_sizer (F0 x3, C1 x2, C2,
# HM, LB3, ST2: PAIR = VER === ERA; U2 and its VER >= ERA predicate untouched), g221_d178_active (Bnp, W2, W3,
# H1-H4, M1), g221_d179_donenav (P1, P2, G9). Each retired row goes with its predicate and any helper only it
# read; every live row is kept byte for byte.
# PARKED (not touched here): g217's K-limb pair rows (K1 V216 -> candidate delta x2, K2 x2, K3, K4 x2, K5 x2, K6)
# are switched by PAIR_SCOPE = VER <= 218, a range predicate, not by equality to one ia-version; mE counts them
# in g217's 17. The three CLOSED era tables they read and their tests/era_bump.py registry are untouched.
# Diff classes: (R-a) rows retired, (R-b) version_scope_debt.txt lines.
# Every anchor counts exactly 1 before anything is written; the first miss aborts the whole script.
import os, re, sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
G = os.path.join(ROOT, 'tests', 'gates')
DEBT = os.path.join(ROOT, 'tests', 'version_scope_debt.txt')
TAIL = 'retired Post-V233 under standing ruling 3 (build-scoped; the previous-version run replaces it).'


def die(msg):
    print('ABORT: ' + msg)
    sys.exit(1)


def rep(name, src, old, new):
    n = src.count(old)
    if n != 1:
        die(f'{name}: anchor count {n} != 1: {old[:90]!r}')
    return src.replace(old, new)


def cut(name, src, start, end, must=(), new='', must_not=()):
    """Replace src[start_marker : end_marker) with new; both markers count 1, the cut holds every `must`."""
    for m in (start, end):
        n = src.count(m)
        if n != 1:
            die(f'{name}: marker count {n} != 1: {m[:90]!r}')
    a, b = src.index(start), src.index(end)
    if b <= a:
        die(f'{name}: end marker precedes start marker: {start[:60]!r}')
    piece = src[a:b]
    for m in must:
        if m not in piece:
            die(f'{name}: cut lacks {m!r}')
    for m in must_not:
        if m in piece:
            die(f'{name}: cut holds {m!r}, which is live')
    return src[:a] + new + src[b:]


def cut_line(name, src, prefix, must, new=''):
    """Replace the whole line that starts with prefix (prefix counts 1) and holds must."""
    n = src.count(prefix)
    if n != 1:
        die(f'{name}: line prefix count {n} != 1: {prefix[:90]!r}')
    a = src.index(prefix)
    b = src.index('\n', a) + 1
    if must not in src[a:b]:
        die(f'{name}: line lacks {must!r}')
    return src[:a] + new + src[b:]


def strip_comments(s):
    s = re.sub(r'/\*[\s\S]*?\*/', '', s)
    return re.sub(r'(^|[^:\\])//[^\n]*', r'\1', s)


def gone(name, src, words):
    code = strip_comments(src)
    for w in words:
        if re.search(r'(?<![\w.$])' + re.escape(w) + r'\b', code):
            die(f'{name}: {w} still read after the retirement')


out = {}
# ---- g217_d160_dedupe_view: R1 x4, R2, D1, E1 (D160 CFb's build pair, candidate 217 against V216) ---------
f = 'g217_d160_dedupe_view.js'
s = open(os.path.join(G, f), encoding='utf-8').read()
s = rep(f, s, "const ROWS = ['I0','F0'].concat(LATS.map(l => 'P1 ' + l), LATS.map(l => 'R1 ' + l), ['R2','D1','E1','W1','U1','U2','C1'], KNAMES);",
              "const ROWS = ['I0','F0'].concat(LATS.map(l => 'P1 ' + l), ['W1','U1','U2','C1'], KNAMES);")
s = rep(f, s, "const rkey = r => r.w + '|' + r.d + '|' + r.pw + '|' + r.pd + '|' + r.was + '>' + r.to;\n", '')
s = rep(f, s, "const PAIR = VER === 217 && !!BASE;\n"
              "const S = {}; LATS.forEach(l => S[l] = { cfg:0, crash:0, cRen:0, cPh:{}, cOut:0, cUn:0, bRen:0, bPh:{}, bOut:0, bUn:0, r1bad:0, r1ex:'', ex:'' });",
              "const S = {}; LATS.forEach(l => S[l] = { cfg:0, crash:0, cRen:0, cPh:{}, cOut:0, cUn:0, bRen:0, bPh:{}, bOut:0, bUn:0, ex:'' });")
s = rep(f, s, "const TRIG = {}, TO = {}, DF = { progs:0, days:0, bad:0, top:0, ex:'' };", "const TRIG = {}, TO = {};")
s = cut(f, s, 'const fieldsBut = (o, ks) =>', 'CAND.X.window.__VC = 0;', must=('function dayShape(', 'const stripTop = p =>'))
s = rep(f, s, '    const kept = [];\n', '')
s = rep(f, s, 'else { if(k.ph) s.bOut++; kept.push(rkey(r)); } });', 'else { if(k.ph) s.bOut++; } });')
s = cut(f, s, '    if(PAIR){ const phOn = {}', '\n});\nconst sum = o =>', must=('DF.progs++', 's.r1bad++', 'kept.sort()'), new='  }')
s = cut(f, s, "LATS.forEach(l => { const s = S[l];\n  if(!PAIR){ skipRow('R1 '", '\n// ── W1, U1, U2, C1',
        must=("ok('R1 '", "ok('R2 ", "ok('D1 ", "ok('E1 "), must_not=("ok('P1 ", "ok('W1 "),
        new='// R1, R2, D1 and E1 ' + TAIL + " They defended D160 CFb on its build pair (candidate 217 against V216):"
            " V216's renames minus its in-scope phantoms, the totals 6,817 / 0 / 983, the 62-program blast radius and the reporter example.\n")
gone(f, s, ['PAIR', 'DF', 'fieldsBut', 'dayShape', 'stripTop', 'rkey', 'kept', 'r1bad', 'r1ex', 'REP'])
out[f] = s
# ---- g218_d157_swim_sizer: F0 x3, C1 x2, C2, HM, LB3, ST2 (D157's build pair, 218 against V217) ----------
f = 'g218_d157_swim_sizer.js'
s = open(os.path.join(G, f), encoding='utf-8').read()
s = rep(f, s, "const ROWS = ['U1','L1','L2','Z1','ST1','LB1','LB2','OT1','Z2','F0','U2','C1','C2','ST2','HM','LB3'];",
              "const ROWS = ['U1','L1','L2','Z1','ST1','LB1','LB2','OT1','Z2','U2'];")
s = rep(f, s, 'const PAIR = VER === ERA;\n', '')
s = rep(f, s, 'const B = load(V217FILE);\n', '')
s = rep(f, s, 'const LC = LENFN(C), LB = LENFN(B);', 'const LC = LENFN(C);')
s = cut(f, s, '  if(PAIR){ const v = len(LB, UNIT', '  // U2 runs from the D157 era onward',
        must=("ok('F0 V217 before-picture", "skipRow('F0 unit before-picture"), must_not=("ok('U2 ",),
        new='  // F0 (unit) ' + TAIL + ' It defended D157 on its build pair: V217 sized the unit entry 7 weeks with no swim warning, so U1 could fail.\n')
s = rep(f, s, '{ const L = { n:0, bad:0, ex:[], moved:0, lbl:0, twins:0, twinBad:0, twinEx:[] };', '{ const L = { n:0, bad:0, ex:[], lbl:0 };')
s = cut_line(f, s, '    L.twins++; if(PAIR){', 'L.twinBad++')
s = rep(f, s, '      if(PAIR){ const lb = len(LB, g, exp, age); if(!lenEq(lb, lt)) L.moved++; } } }', '    } }')
s = cut(f, s, "  if(PAIR){ ok('F0 V217 sized '", '// ── L2: full-build lattice',
        must=("ok('C1 controls, sizer: ' + (L.twins", "skipRow('C1 m:ss sizer controls", '// C1 continued', 'n === 81', "skipRow('C1 non-time sizer controls"),
        must_not=("ok('L1 ",),
        new='  // F0 (L1) and C1 (m:ss twins) ' + TAIL + " They defended D157 on its build pair: V217 sized seconds-only entries off their twin, and every m:ss twin kept V217's weeks and warning.\n}\n\n"
            '// C1 (non-time goals) ' + TAIL + " It defended D157 on its build pair: the non-time swim goals and time goals with no time kept V217's weeks and warning.\n\n")
s = rep(f, s, 'const S = { n:0, bad:0, ex:[], impure:0, moved:0, crash:0 };', 'const S = { n:0, bad:0, ex:[], impure:0, crash:0 };')
s = rep(f, s, '      if(PAIR){ try { const v = build(B, mkCfg({ g:swimGoal(goal, t, c, tf, cf), exp, age, mix })); if(!(v.p.totalWeeks === tw.p.totalWeeks && wsig(v.p) === wsig(tw.p))) S.moved++; } catch(err){ S.crash++; } } } }',
              '    } }')
s = rep(f, s, "  if(PAIR) ok('F0 V217 built ' + S.moved + '/' + S.n + ' L2 seconds-only entries off their twin (> 0, so L2 can fail)', S.moved > 0);\n"
              "  else skipRow('F0 L2 before-picture (pair only)'); }",
              '  // F0 (L2) ' + TAIL + ' It defended D157 on its build pair: V217 built seconds-only entries off their twin, so L2 could fail.\n}')
s = rep(f, s, '  let n = 0, bad = 0, ex = [], v217time = 0;', '  let n = 0, bad = 0, ex = [];')
s = rep(f, s, r"      if(PAIR && /\(\d+:\d+\//.test(String(len(LB, g, exp, age).warning || ''))) v217time++; }", '    }')
s = cut_line(f, s, "  if(PAIR) console.log('  INFO Z1", 'v217time')
s = cut(f, s, '// ── C2: full-build controls', '// ── LB1 / LB2 / OT1 / Z2 / LB3',
        must=("ok('C2 controls", "ok('HM HALF_MANNY", "skipRow('HM HALF_MANNY"),
        new='// C2 and HM ' + TAIL + " They defended D157 on its build pair: m:ss swim, other swim, no-time, run, no-cardio and bike programs kept V217's progDigest, and HALF_MANNY was V217's.\n\n")
s = rep(f, s, 'const CL = lvm(ART), BL = PAIR ? lvm(V217FILE) : null;', 'const CL = lvm(ART);')
s = cut(f, s, '  // LB3: canonical m:ss labels byte-identical to V217 (pair only)\n', '\n\n// ── ST1 / ST2',
        must=("ok('LB3 twin byte-compat", "skipRow('LB3"), must_not=("ok('Z2 ",),
        new='  // LB3 ' + TAIL + " It defended D157 on its build pair: 1,398 canonical m:ss targets kept V217's pace line, initial render and sizer warnings byte for byte.\n}")
s = rep(f, s, 'const b1 = boot(V217FILE, store), b2 = boot(V217FILE, store), s1 = boot(ART, store);', 'const b1 = boot(V217FILE, store), s1 = boot(ART, store);')
s = cut(f, s, '    if(PAIR){ const self = progDigest(b1.p)', '\n\ndone();',
        must=("ok('ST2 ", "skipRow('ST2 "), must_not=("ok('ST1 ",),
        new='    // ST2 ' + TAIL + " It defended D157 on its build pair: the candidate's boot of the V217-stored program equalled V217's own boot.\n  } }")
gone(f, s, ['PAIR', 'B', 'LB', 'BL', 'b2', 'twins', 'twinBad', 'twinEx', 'moved', 'v217time'])
out[f] = s
# ---- g221_d178_active: Bnp, W2, W3, H1-H4 (D178's build pair, 221 against V220), M1 (HALF_MANNY on 221) ----
f = 'g221_d178_active.js'
s = open(os.path.join(G, f), encoding='utf-8').read()
s = rep(f, s, "const fs = require('fs'), path = require('path'), os = require('os'), cp = require('child_process');\n"
              "const { load, progDigest } = require(path.join(__dirname, '..', 'harness.js'));",
              "const path = require('path');\nconst { load } = require(path.join(__dirname, '..', 'harness.js'));")
s = rep(f, s, "const BASEFILE = process.argv[3] || null;\nconst ERA = 221, BASE_ERA = 220, V220_COMMIT = '8ee4385b6108a2eade639628aa99dee0ab201950';\n"
              "const MANNY = '0ac7da6b1691a8e1';\n", 'const ERA = 221;\n')
for pre in ("  Bnp:'Bnp (pair)", "  W2:'W2 (pair)", "  W3:'W3 (pair)", "  H1:'H1 (pair)", "  H2:'H2 (pair)", "  H3:'H3 (pair)", "  H4:'H4 (pair)"):
    s = cut_line(f, s, pre, 'V220')
s = cut_line(f, s, "  M1:'M1 HALF_MANNY digest '", 'MANNY')
s = rep(f, s, "const PAIR_ROWS = ['Bnp', 'W2', 'W3', 'H1', 'H2', 'H3', 'H4'];\n", '')
s = cut(f, s, "let BASEART = null, baseWhy = '', TMP = null;\n", 'const safe = fn =>',
        must=('const PAIR = VER === ERA && !!BASEART;', "console.log('  pair rows: '"))
s = cut(f, s, 'const pairRow = (key, fn) => {\n', '\n// ── FIXTURES', must=('if(PAIR) return row(key, fn);',))
s = rep(f, s, 'const lsDump = I => JSON.stringify([...I.localStorage._map.entries()].sort());\n', '')
s = cut(f, s, "  pairRow('Bnp', () => {\n", '}\n\n// ── L: legacy-delete backfill', must=('V220 differs from itself',),
        new='  // Bnp ' + TAIL + ' It defended D178 on its build pair: boot with no pointer left storage, globals, screen and toasts identical to V220.\n')
s = cut(f, s, '  let WBS = null;\n', '}\n\n// ── H: archive / delete handoff', must=("pairRow('W2'", "pairRow('W3'"), must_not=("row('W1'",),
        new='  // W2 and W3 ' + TAIL + ' They defended D178 on its build pair: the wizard landing and the loaded program identical to V220.\n')
s = cut(f, s, '// ── H: archive / delete handoff, both arms (pair)', '// ── M: HALF_MANNY',
        must=('function hWorld(', "pairRow(key, () => { const b1 = hWorld"),
        new='// H1 to H4 ' + TAIL + ' They defended D178 on its build pair: archive and delete of the active program, both arms, identical to V220.\n\n')
s = cut(f, s, '// ── M: HALF_MANNY', "console.log('  runtime '", must=("row('M1'", 'skipRow(R.M1', 'if(TMP) try'),
        new="// M1 " + TAIL + " It defended D178's HALF_MANNY claim (standing ruling 5): digest 0ac7da6b1691a8e1 on candidate 221, self-stable.\n\n")
gone(f, s, ['PAIR', 'PAIR_ROWS', 'pairRow', 'BASEART', 'baseWhy', 'TMP', 'BASEFILE', 'BASE_ERA', 'V220_COMMIT', 'MANNY',
            'progDigest', 'lsDump', 'hWorld', 'wBase', 'WBS', 'fs', 'os', 'cp'])
out[f] = s
# ---- g221_d179_donenav: P1, P2 (D179's build pair, 221 against V220), G9 (HALF_MANNY on 221) ---------------
f = 'g221_d179_donenav.js'
s = open(os.path.join(G, f), encoding='utf-8').read()
s = rep(f, s, "const fs = require('fs'), path = require('path'), os = require('os'), cp = require('child_process');\n"
              "const H = require(path.join(__dirname, '..', 'harness.js'));\nconst { load, progDigest } = H;",
              "const path = require('path');\nconst H = require(path.join(__dirname, '..', 'harness.js'));\nconst { load } = H;")
s = rep(f, s, "const BASEFILE = process.argv[3] || null;\nconst ERA = 221, BASE_ERA = 220, V220_COMMIT = '8ee4385b6108a2eade639628aa99dee0ab201950';\n"
              "const MANNY = '0ac7da6b1691a8e1';\n", 'const ERA = 221;\n')
s = cut_line(f, s, "  P1:'P1 (pair)", 'V220')
s = cut_line(f, s, "  P2:'P2 (pair)", 'V220')
s = cut_line(f, s, "  G9:'G9 HALF_MANNY digest '", 'MANNY')
s = rep(f, s, "const PAIR_ROWS = ['P1', 'P2'];\n", '')
s = cut(f, s, "// Baseline for the pair rows: D179's build pair is 221 against 220.", 'const safe = fn =>',
        must=('const PAIR = VER === ERA && !!B;', 'const pairRow = (key, cond, got) => {', "console.log('  pair rows: '"))
s = cut(f, s, '// ---- P: pair rows, the untouched classes against V220 ----', '// ---- G9 HALF_MANNY ----',
        must=('function pairTranscript(', "pairRow('P1'", "pairRow('P2'"),
        new='// P1 and P2 ' + TAIL + ' They defended D179 on its build pair: the pending week renders and the reopened day bodies and footers byte-identical to V220.\n\n')
s = cut(f, s, '// ---- G9 HALF_MANNY ----', 'if(E.errs.length)', must=("row('G9'", 'skipRow(R.G9'),
        new="// G9 " + TAIL + " It defended D179's HALF_MANNY claim (standing ruling 5): digest 0ac7da6b1691a8e1 on candidate 221, self-stable.\n")
gone(f, s, ['PAIR', 'PAIR_ROWS', 'pairRow', 'pairTranscript', 'B', 'B2', 'baseWhy', 'BASEFILE', 'BASE_ERA', 'V220_COMMIT',
            'MANNY', 'progDigest', 'fs', 'os', 'cp'])
out[f] = s
# ---- write the gates (every gate anchor has passed) ---------------------------------------------------
for f, s in out.items():
    open(os.path.join(G, f), 'w', encoding='utf-8').write(s)
    print('wrote tests/gates/' + f)
# ---- version_scope_debt.txt LAST: re-read now (parallel builders edit other lines), one line per gate ----
d = open(DEBT, encoding='utf-8').read()
d = rep('debt', d, 'g217_d160_dedupe_view.js 1  # 17 rows, mE classes 0/17/0\n', '')
d = rep('debt', d, 'g218_d157_swim_sizer.js 1  # 10 rows, mE classes 1/9/0\n', '')
d = rep('debt', d, 'g221_d178_active.js 5  # 8 rows, mE classes 0/7/1\n', '')
d = rep('debt', d, 'g221_d179_donenav.js 5  # 3 rows, mE classes 0/2/1\n', '')
open(DEBT, 'w', encoding='utf-8').write(d)
print('wrote tests/version_scope_debt.txt')
