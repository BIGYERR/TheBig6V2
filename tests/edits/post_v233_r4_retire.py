#!/usr/bin/env python3
# Post-V233 tooling pass, retirement slice R4 (tests only; index.html untouched, ia-version stays 233).
# Mario, tests/measure/v233_rulings/post_v233_proof_scope_decisions.md Message 3: the dark build-scoped rows
# retire; standing ruling 3 as amended: a build-scoped claim retires when the next build ships, and the
# previous-version run is its replacement. Evidence: measure mE (measure_exact_version_mE.md).
# Gates: g214_d158_eve (D5, D6, D7), g215_d149_ghd (K1, K2), g216_d154_swap_lens (Q1, Q2, Q3, Q4),
# g216_d156_longday (F0, F2, F3, N1, K1). Each retired row goes with its predicate and any helper only it read;
# every live row is kept byte for byte. Kept on purpose: g214's V213 loader (BASEFILE when it reads 213, else git
# bc3cccc), because the live ruling-level row D8 reads it; TMP in the g216 gates, because done() reads it; require
# bindings (R1/R2 precedent). Diff classes: (R-a) rows retired, (R-b) version_scope_debt.txt lines.
# Every anchor counts exactly 1 before anything is written; the first miss aborts the whole script.
import os, re, subprocess, sys

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
    if a and src[a - 1] != '\n':
        die(f'{name}: prefix does not start a line: {prefix[:60]!r}')
    b = src.index('\n', a) + 1
    if must not in src[a:b]:
        die(f'{name}: line lacks {must!r}')
    return src[:a] + new + src[b:]


def strip_comments(s):
    s = re.sub(r'/\*[\s\S]*?\*/', '', s)
    return re.sub(r'(^|[^:\\])//[^\n]*', r'\1', s)


def gone(name, src, words, literal=()):
    code = strip_comments(src)
    for w in words:
        if re.search(r'\b' + re.escape(w) + r'\b', code):
            die(f'{name}: {w} still read after the retirement')
    for w in literal:
        if w in code:
            die(f'{name}: {w!r} still in the code after the retirement')


out = {}

# ---- g214_d158_eve: D5, D6 (the 214/213 build pair), D7 (V214 fix, the 214/213 pair) ---------------------
f = 'g214_d158_eve.js'
s = open(os.path.join(G, f), encoding='utf-8').read()
s = rep(f, s, "const ROWS = ['D0','D1','D2','D2v','D3','D4','D5','D6','D7','D8','HM'];",
              "const ROWS = ['D0','D1','D2','D2v','D3','D4','D8','HM'];")
# the baseline echo's predicate named only the pair rows ("not read (pair rows are scoped to candidate 214)")
s = rep(f, s, "(BASE ? 'V213 from ' + baseWhy : (VER === ERA ? 'UNAVAILABLE (' + baseWhy + ')' : 'not read (pair rows are scoped to candidate 214)'))",
              "(BASE ? 'V213 from ' + baseWhy : 'UNAVAILABLE (' + baseWhy + ')')")
s = rep(f, s, ", d3:[], d4:[], d5n:0, d5:[], d5t2:0};", ", d3:[], d4:[]};")
s = cut(f, s, '  // D5 (pair)\n', '}\nconst L = `${A.n} dated NSW test programs', must=('A.d5n++', 'A.d5t2++', 'BASE.buildProgram'),
        must_not=('A.d4.push',))
s = cut(f, s, '// ── D5 / D6: the build pair ──', '// ── D7 / D8: the protect-park modes', must=('VER === ERA && BASE', 'ok(`D5', 'ok(`D6'),
        new='// D5 and D6 ' + TAIL + ' They defended D158: dated NSW programs byte-identical to V213 on every day but the eve, and NRC race-pinned and undated NSW programs byte-identical to V213.\n')
s = cut_line(f, s, "    if(VER === ERA) ok('D7 the lift-role pair row needs V213'", "console.log('SKIP D7")
s = rep(f, s, "const plan = IA.eval('injuryPlan'); let n = 0, crash = 0, d8n = 0; const d7 = [], d8 = [], reach = {};",
              "const plan = IA.eval('injuryPlan'); let crash = 0, d8n = 0; const d8 = [], reach = {};")
s = rep(f, s, "catch(e){ crash++; continue; }\n      n++;\n", "catch(e){ crash++; continue; }\n")
s = cut_line(f, s, '      T.forEach(x => { const ra = role(at(a, x)), rb = role(at(b, x));', 'd7.push(')
s = cut(f, s, '    if(VER === ERA) ok(`D7 PAIR:', '    ok(`D8 under the protect-park modes', must=('SKIP D7 scoped',),
        new="    // D7 " + TAIL + " It defended the V214 fix (coach) to D158: across the injured dated lattice the lift role of T-2, T-1 and the test day equals V213's.\n")
gone(f, s, ['d5n', 'd5t2', 'd5', 'shk', 'd7', 'moved', 'nrc', 'ra', 'rb'], literal=('VER === ERA',))
blk = strip_comments(s[s.index('// ── D7 / D8'):s.index('// V231 MAINTENANCE')])
if re.search(r'\bn\b', blk):
    die(f + ': the D7 lattice count n is still read in the D7/D8 block')
out[f] = s

# ---- g215_d149_ghd: K1, K2 (the 215/214 build pair) -------------------------------------------------------
f = 'g215_d149_ghd.js'
s = open(os.path.join(G, f), encoding='utf-8').read()
s = rep(f, s, "const BASEFILE = process.argv[3] || null;\n", '')
s = rep(f, s, "const VER = +IA.version, ERA = 215, V214_COMMIT = '978b0b56bd5c2470972146d618d64292ca48a241';",
              "const VER = +IA.version, ERA = 215;")
s = rep(f, s, "const ROWS = ['G1','G1v','G1h','G2','G3','G4','L1','F0','F1','F1o','F2','F2o','P1','K1','K2','K3','HM'];",
              "const ROWS = ['G1','G1v','G1h','G2','G3','G4','L1','F0','F1','F1o','F2','F2o','P1','K3','HM'];")
# stem: K1's section-loss count read it, nothing else
s = cut_line(f, s, 'const stem = s => ', 's.coreHeader')
s = cut(f, s, "let V214 = null, v214err = '';\n", "console.log('hand FIRE_A '",
        must=('if(VER === ERA){', 'const PAIR = VER === ERA;', "console.log('candidate ia-version '"), must_not=('CF_A',))
s = rep(f, s, "let built = 0, crash = 0, swCrash = 0, tBuilt = 0, tCrash = 0, k2g = 0, k2gN = 0; const k2gEx = [];",
              "let built = 0, crash = 0, swCrash = 0, tBuilt = 0, tCrash = 0;")
s = cut(f, s, '  if(PAIR && V214 && OWNS[x.eq].GHD){ k2gN++;', '}\nfor(const x of LAT_T){', must=('k2gEx.push(',))
s = rep(f, s, "const K = { cfg:{}, crash:0, fa:{}, fb:{}, probeBad:0, pr:{}, loss:{}, lossEx:[], dup:{}, dupEx:[], k2:0, k2N:0, k2Ex:[],",
              "const K = { cfg:{}, crash:0, fa:{}, fb:{}, probeBad:0, pr:{}, dup:{}, dupEx:[],")
s = cut_line(f, s, '  let b = null; if(PAIR && V214){', 'V214.buildProgram')
s = cut_line(f, s, '  if(PAIR && V214 && OWNS[t].GHD){ K.k2N++;', 'K.k2Ex.push(')
s = cut(f, s, '    if(b){ const d0 = b.weeks[w] && b.weeks[w][d];', "    const lsb = secs.find(s => s.label === 'Leg superset B');",
        must=('K.lossEx.push(',))
s = cut(f, s, "if(PAIR){\n  TIERS.forEach(t => ok('K1 ", "TIERS.forEach(t => ok('K3 ", must=("skipRow('K2 pair 215/214 only')", 'ok(\'K2 commercial'),
        new='// K1 and K2 ' + TAIL + ' They defended D149: on knee/protect no tier lost a section against V214, and commercial and crossfit programs stayed byte-identical to V214.\n')
gone(f, s, ['BASEFILE', 'V214', 'v214err', 'PAIR', 'V214_COMMIT', 'k2g', 'k2gN', 'k2gEx', 'stem', 'd0'],
     literal=('K.loss', 'K.k2', 'VER === ERA'))
out[f] = s

# ---- g216_d154_swap_lens: Q1, Q2, Q3, Q4 (the 216/215 build pair, V215 with D156 grafted) -------------------
f = 'g216_d154_swap_lens.js'
s = open(os.path.join(G, f), encoding='utf-8').read()
s = rep(f, s, "const BASEFILE = process.argv[3] || null;\n", '')
s = rep(f, s, "const VER = +IA.version, ERA = 216, V215_COMMIT = '7474f0607bfdf50b768e95221a1f7e9ef52067b6';",
              "const VER = +IA.version, ERA = 216;")
s = rep(f, s, "const ROWS = ['U0','U1','U2','U3','P1','P2','P3','P4','Q1','Q2','Q3','Q4','C1','C2','HM'];",
              "const ROWS = ['U0','U1','U2','U3','P1','P2','P3','P4','C1','C2','HM'];")
s = cut(f, s, '// baseline for the pair rows\n', 'const DEN = {}, CGP = {}', must=('const PAIR = VER === ERA;', 'graft D156', 'V215 = load(g)'))
s = rep(f, s, "const DEN = {}, CGP = {}, SKULL = {}, CPC = {}, DUP = {}, DUPEX = [], Q = { bw:[0,0], com:[0,0], noswap:[0,0] }, QEX = { bw:[], com:[], noswap:[] };",
              "const DEN = {}, CGP = {}, SKULL = {}, CPC = {}, DUP = {}, DUPEX = [];")
# klass and its readers (CAL, prevDay, itemsOf, labelsOf, sub) and the Q4 tallies: Q4 only
s = cut(f, s, '// Q4 classes, by name and detail only', 'CELLS.forEach(c => {', must=('function klass(', 'const Q4 = {}, Q4X = [];', 'const prevDay ='),
        must_not=('const flat =',))
s = cut(f, s, '  if(!PAIR || !V215) return;\n', "});\nok('P0 every lattice config builds", must=('klass(x, y, prevDay(p, w, d))', 'V215.buildProgram'))
s = cut(f, s, "if(!PAIR){ ['Q1','Q2','Q3','Q4']", '\n// ── copy ', must=("ok('Q1 PAIR", "ok('Q4 PAIR", 'CENSUS'),
        new="// Q1, Q2, Q3 and Q4 " + TAIL + " They defended D154: bodyweight, commercial and no-swap programs byte-identical to V215 with D156 grafted, and every changed elbow/workaround day on a no-cable tier is the swap as ruled or a coach-accepted class.\n")
gone(f, s, ['BASEFILE', 'V215', 'v215err', 'PAIR', 'V215_COMMIT', 'Q', 'QEX', 'Q4', 'Q4X', 'klass', 'sub', 'labelsOf', 'itemsOf',
            'prevDay', 'CAL', 'lane'], literal=('VER === ERA',))
out[f] = s

# ---- g216_d156_longday: F0 (pair fixture), F2, F3, N1, K1 (the 216/215 build pair) -------------------------
f = 'g216_d156_longday.js'
s = open(os.path.join(G, f), encoding='utf-8').read()
s = rep(f, s, "const BASEFILE = process.argv[3] || null;\n", '')
s = rep(f, s, "const VER = +IA.version, ERA = 216, V215_COMMIT = '7474f0607bfdf50b768e95221a1f7e9ef52067b6';",
              "const VER = +IA.version, ERA = 216;")
s = rep(f, s, "const ROWS = ['F0','F1','F2','F3','G1','G2','N1','K1','HM'];", "const ROWS = ['F1','G1','G2','HM'];")
# kClass's helpers (clean, stem, prevDay, dayOf) and the pair tallies' bump: pair rows only
s = cut_line(f, s, 'const clean = n => ', '<svg')
s = cut_line(f, s, 'const stem = s => ', 's.coreHeader')
s = cut_line(f, s, 'const bump = (o, k, n = 1) => ', 'o[k]')
s = cut_line(f, s, 'const prevDay = (p, w, d) => ', "'sat'")
s = cut_line(f, s, 'const dayOf = (p, w, d) => ', 'p.weeks[w][d]')
# V215 and the NODD twin: K1 alone read the twin, the pair rows alone read V215
s = cut(f, s, '// ── baseline and the NODD twin', '// ── run ──', must=('const PAIR = VER === ERA;', 'NODD = load(f)', 'V215 = load(f)'))
s = rep(f, s, "S[l] = { cfg:0, crash:0, longFin:0, longFinEx:[], chgLong:{}, K:0, X:0, XEx:[], nrcDiff:0, nrcEx:[] });",
              "S[l] = { cfg:0, crash:0, longFin:0, longFinEx:[] });")
s = rep(f, s, "const F0 = {}, F2 = { lost:0, of:0 }, F3 = { n:0, diff:0, ex:[] }, G = { bDays:0, zero:0, over8:0, max:0, ex:[] };",
              "const G = { bDays:0, zero:0, over8:0, max:0, ex:[] };")
s = cut(f, s, 'function kClass(', 'L.forEach(x => {', must=("return 'prev day not long and unchanged';",))
s = rep(f, s, "  const R = S[x.lat]; let p, b = null;\n  try { p = IA.buildProgram(cl(x.c)); if(PAIR && V215) b = V215.buildProgram(cl(x.c)); } catch(e){ R.crash++; return; }",
              "  const R = S[x.lat]; let p;\n  try { p = IA.buildProgram(cl(x.c)); } catch(e){ R.crash++; return; }")
s = rep(f, s, "  R.cfg++;\n  let nodd = null;\n", "  R.cfg++;\n")
s = rep(f, s, "    const y = p.weeks[w][d], o = b && b.weeks[w] && b.weeks[w][d];\n"
              "    if(x.lat === 'NRC'){ if(b && JSON.stringify(o) !== JSON.stringify(y)){ R.nrcDiff++; if(R.nrcEx.length < 3) R.nrcEx.push(x.k + ' W' + w + ' ' + d); } return; }",
              "    const y = p.weeks[w][d];\n    if(x.lat === 'NRC') return;")
s = cut(f, s, '    if(!b) return;\n', '  }));\n});\nconst tot', must=('kClass(p, b, w, d, o, y, nodd)', 'F2.lost++', 'F3.diff++'),
        must_not=('G.bDays++',))
s = cut(f, s, "if(!PAIR) skipRow('F0 fixture", "NSW_LATS.forEach(l => ok('F1 ", must=("ok('F0 fixture: V215",),
        new='// F0 ' + TAIL + ' It was the D156 pair rows\' fixture: V215 printed an Arms or Delts finisher on NSW long days of tier B and tier C.\n')
s = cut(f, s, "if(!PAIR){ ['F2','F3','N1','K1']", '// V231 MAINTENANCE', must=("ok('F2 PAIR", "ok('F3 PAIR", "ok('N1 PAIR", "ok('K1 PAIR"),
        new='// F2, F3, N1 and K1 ' + TAIL + ' They defended D156: tier C days lost the finisher V215 printed, tier A long days and NRC programs stayed byte-identical to V215, and every other changed day was a long day or the knock-on rename class.\n')
gone(f, s, ['BASEFILE', 'V215', 'v215err', 'PAIR', 'V215_COMMIT', 'NODD', 'nodderr', 'nodd', 'kClass', 'F0', 'F2', 'F3', 'clean',
            'stem', 'bump', 'prevDay', 'dayOf', 'chgLong', 'nrcDiff', 'nrcEx', 'XEx'], literal=('VER === ERA', 'o = b', 'b = V215'))
out[f] = s

# ---- write the gates (every gate anchor has passed) ---------------------------------------------------
for f, s in out.items():
    open(os.path.join(G, f), 'w', encoding='utf-8').write(s)
    print('wrote tests/gates/' + f)
for f in out:
    r = subprocess.run(['node', '--check', os.path.join(G, f)], capture_output=True, text=True)
    if r.returncode:
        die(f + ': node --check failed: ' + r.stderr.strip()[:300])

# ---- every exact-version hit in the four gates is gone (version_scope.js --list), else the debt stays ---------
r = subprocess.run(['node', os.path.join(ROOT, 'tests', 'version_scope.js'), '--list'], capture_output=True, text=True, cwd=ROOT)
left = [l for l in r.stdout.splitlines() if l.split(':')[0] in out]
if left:
    die('exact-version hits left: ' + '; '.join(left))

# ---- version_scope_debt.txt LAST: re-read now (a parallel builder edits other lines), one line per gate ---
d = open(DEBT, encoding='utf-8').read()
d = rep('debt', d, 'g214_d158_eve.js 4  # 3 rows, mE classes 0/3/0\n', '')
d = rep('debt', d, 'g215_d149_ghd.js 2  # 2 rows, mE classes 0/2/0\n', '')
d = rep('debt', d, 'g216_d154_swap_lens.js 1  # 4 rows, mE classes 0/4/0\n', '')
d = rep('debt', d, 'g216_d156_longday.js 1  # 5 rows, mE classes 0/5/0\n', '')
open(DEBT, 'w', encoding='utf-8').write(d)
print('wrote tests/version_scope_debt.txt')
