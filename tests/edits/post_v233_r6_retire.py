#!/usr/bin/env python3
# Post-V233 tooling pass, retirement slice R6 (tests only; index.html untouched, ia-version stays 233).
# Mario, tests/measure/v233_rulings/post_v233_proof_scope_decisions.md Message 3: the dark build-scoped rows
# retire; standing ruling 3 as amended: a build-scoped claim retires when the next build ships, and the
# previous-version run is its replacement. Evidence: measure mE (measure_exact_version_mE.md).
# Gates: g221_d177_swapfloor (G4a, G7-4, G8a, G9), g221_d180_blockopen (P1, P2, P3, I5), g222_d181_durable
# (6b, 6c, 7), g223_d184_testlen (R5 and NRC0, each in NY and UTC). Each retired row goes with its predicate and any
# helper only it read; every live row is kept byte for byte.
# Kept on purpose (a live row reads them):
#   g221_d177  the V220 pair loader (VER === ERA): G4b and G4c read it on 221 through `let B4 = B` (slice 9's loader,
#              left exactly as it is); L2 and its lattice, because the run echo prints L2.length.
#   g222       the V221 loader (VER === ERA): the WRAP install and the INFO print (never counts) read B.
#   g223       `pair` (VER === ERA) and the V222 loader: live R1 carries a pair-scoped blast-radius conjunct that reads
#              G184_PAIR, G184_BASE and G184_BASE_WHY; it is kept exactly as it is.
#   every gate: require bindings (R1/R2/R4 precedent); g223's isControl (unread before this slice) loses only the
#              retired names.
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
    if a and src[a - 1] != '\n':
        die(f'{name}: prefix does not start a line: {prefix[:60]!r}')
    b = src.index('\n', a) + 1
    if must not in src[a:b]:
        die(f'{name}: line lacks {must!r}')
    return src[:a] + new + src[b:]


def strip_comments(s):
    s = re.sub(r'/\*[\s\S]*?\*/', '', s)
    return re.sub(r'(^|[^:\\])//[^\n]*', r'\1', s)


def word_n(code, w):
    return len(re.findall(r'(?<![A-Za-z0-9_$])' + re.escape(w) + r'(?![A-Za-z0-9_$])', code))


def gone(name, src, words, literal=()):
    code = strip_comments(src)
    for w in words:
        if word_n(code, w):
            die(f'{name}: {w} still read after the retirement')
    for w in literal:
        if w in code:
            die(f'{name}: {w!r} still in the code after the retirement')


def still(name, src, words):
    code = strip_comments(src)
    for w in words:
        if not word_n(code, w):
            die(f'{name}: {w} is no longer read, but a kept reader needs it')


def hits(name, src, want):
    n = strip_comments(src).count('VER === ERA')
    if n != want:
        die(f'{name}: {n} VER === ERA predicates left, want {want}')


def kept(name, before, after, pieces):
    for p in pieces:
        if before.count(p) != 1 or after.count(p) != 1:
            die(f'{name}: kept piece not byte-identical exactly once: {p[:70]!r}')


out = {}

# ---- g221_d177_swapfloor: G4a, G7-4, G8a (the 221/220 pair), G9 (HALF_MANNY typed, 221 only) --------------------
f = 'g221_d177_swapfloor.js'
s0 = s = open(os.path.join(G, f), encoding='utf-8').read()
KEEP177 = [
    s0[s0.index("// G4b and G4c run from D177's era onward"):s0.index("const sdB4 = B4 ? B4.eval('_swapDetailFor') : null;")],
    "const sdB4 = B4 ? B4.eval('_swapDetailFor') : null;\nconst minRow = (key, cond, got) => {\n  if(VER >= ERA && sdB4) return ok(R[key], cond, got);\n  return ok(R[key] + ' (setup: ' + base4Why + ')', false);\n};\n",
    "      if(n === 'Landmine rotations'){ S.lr++; if(!!sdB4 && sdB4(it.name, it.detail) !== sdE(it.name, it.detail)) S.lrDiff++; }\n",
    "      if(n === 'Dumbbell renegade rows'){ S.rr++; if(!!sdB4 && sdB4(it.name, it.detail) !== sdE(it.name, it.detail)) S.rrDiff++; }\n",
    "minRow('G4b', S.lr > 0 && S.lrDiff === 0, S.lrDiff + ' of ' + S.lr);\nminRow('G4c', S.rr > 0 && S.rrDiff === 0, S.rrDiff + ' of ' + S.rr);\n",
    "let B = null, baseWhy = '';\nif(VER === ERA){\n",
]
s = rep(f, s, "const MANNY = '0ac7da6b1691a8e1';\n", '')
s = rep(f, s, "const skipRow = (l, why) => { skip++; console.log('SKIP ' + l + ': ' + why); };\n", '')
s = cut_line(f, s, "  G4a:'G4a (pair) L1:", '(RR5)')
s = cut_line(f, s, "  G74:'G7-4 (pair) L2", 'against V220')
s = cut_line(f, s, "  G8a:'G8a (pair) L2", 'add-path')
s = cut_line(f, s, "  G9:'G9 HALF_MANNY digest '", 'MANNY')
s = cut_line(f, s, "const PAIR_ROWS = ['G4a', 'G74', 'G8a'];", 'PAIR_ROWS')
# the pair rows' predicate, their echo and pairRow; the V220 loader above them stays (G4b/G4c read it on 221)
s = cut(f, s, 'const PAIR = VER === ERA && !!B;\n', "// G4b and G4c run from D177's era onward",
        must=("console.log('  pair rows: '", 'const pairRow = (key, cond, got) => {', "is not D177's build pair"), must_not=('B4',))
s = rep(f, s, "const sdB = PAIR ? B.eval('_swapDetailFor') : null;\n", '')
s = rep(f, s, 'toastBad:0, t3:0, pn:0, pnDiff:0, mainDiff:0,', 'toastBad:0, t3:0, pn:0,')
s = rep(f, s, "S.pn++; const n = clean(it.name), differ = PAIR && sdB(it.name, it.detail) !== sdE(it.name, it.detail);\n"
              "      if(differ){ S.pnDiff++; note('pn', n + ' :: ' + it.detail); }\n",
              "S.pn++; const n = clean(it.name);\n")
s = rep(f, s, '          if(PAIR && sdB(to, D) !== O) S.mainDiff++;\n', '')
s = cut_line(f, s, "pairRow('G4a', ", 'S.pnDiff',
             new='// G4a ' + TAIL + ' It defended D177 RR5: on the build pair no _pattern-null item differed under _swapDetailFor against V220 while Main swap pairs did.\n')
s = cut(f, s, '// L2 (pair): G7-4 engine cards, G8a add path\n', '// G8b the add-path fallback',
        must=('if(PAIR){', "pairRow('G74'", "pairRow('G8a'", "} else { pairRow('G74', false, 'no pair'); pairRow('G8a', false, 'no pair'); }"),
        new='// G7-4 and G8a ' + TAIL + " They defended D177 on its build pair (221 vs 220): over L2 no engine card and no add-path detail moved against V220.\n\n")
s = cut(f, s, '// G9 HALF_MANNY\n', "console.log('  runtime ", must=("if(VER === ERA) row('G9'", 'else skipRow(R.G9'),
        new='// G9 ' + TAIL + ' It defended standing ruling 5 at D177: the HALF_MANNY digest typed for 221, self-stable.\n')
gone(f, s, ['MANNY', 'PAIR_ROWS', 'sdB', 'PAIR', 'pairRow', 'skipRow', 'pnDiff', 'mainDiff', 'differ'],
     literal=("'G4a'", "'G74'", "'G8a'", "'G9'", 'R.G9', 'R.G4a'))
still(f, s, ['B', 'baseWhy', 'B4', 'sdB4', 'minRow', 'L2', 'skip', 'exs', 'note'])
hits(f, s, 1)
kept(f, s0, s, KEEP177)
out[f] = s

# ---- g221_d180_blockopen: P1, P2, P3 (the 221/220 pair), I5 (HALF_MANNY typed, 221 only) -------------------------
f = 'g221_d180_blockopen.js'
s0 = s = open(os.path.join(G, f), encoding='utf-8').read()
s = rep(f, s, 'const BASEFILE = process.argv[3] || null;\n', '')
s = rep(f, s, "const ERA = 221, BASE_ERA = 220, V220_COMMIT = '8ee4385b6108a2eade639628aa99dee0ab201950';", 'const ERA = 221;')
s = rep(f, s, "const MANNY = '0ac7da6b1691a8e1';\n", '')
s = rep(f, s, "const skipRow = (l, why) => { skip++; console.log('SKIP ' + l + ': ' + why); };\n", '')
s = cut_line(f, s, "  I5:'I5 (v) progDigest(buildProgram(HALF_MANNY)) = '", 'MANNY')
s = cut(f, s, "  P1:'P1 (pair) refreshProgram lattice", '\n// ── RUN ', must=("P2:'P2 (pair)", "P3:'P3 (pair)", "const PAIR_ROWS = ['P1', 'P2', 'P3'];"),
        new='};\n')
s = cut(f, s, "// Baseline for the pair rows: D180's build pair is 221 against 220.\n", 'const row = (key, fn) => {',
        must=('if(VER === ERA){', 'const PAIR = VER === ERA && !!BASE;', 'const pairRow = (key, fn) => {', "is not D180's build pair"))
s = cut(f, s, "if(VER === ERA) row('I5', ", "row('T1', () =>", must=("else skipRow(R.I5, ",),
        new='// I5 ' + TAIL + ' It defended standing ruling 5 at D180: the HALF_MANNY digest typed for 221, self-stable.\n')
END180 = "} else PAIR_ROWS.forEach(k => pairRow(k, () => [false, 'no pair']));\n"
s = cut(f, s, '// ── PAIR rows: candidate 221 against V220 ', END180,
        must=('if(PAIR){', "pairRow('P1'", "pairRow('P2'", "pairRow('P3'", 'tableRead(BASE)'),
        new='// P1, P2 and P3 ' + TAIL + ' They defended D180 (P-BLOCKOPEN) on its build pair (221 vs 220): the refreshProgram lattice, the wizard landing and the Before column against V220.\n')
s = rep(f, s, END180, '')
# MANNY by its readers, not the bare word: the fixture's name string "THE HALF MANNY" is live
gone(f, s, ['BASE', 'baseWhy', 'BASEFILE', 'BASE_ERA', 'V220_COMMIT', 'PAIR_ROWS', 'PAIR', 'pairRow', 'skipRow', 'tP', 'LB', 'LB2', 'WB', 'WB2', 'TB'],
     literal=("'I5'", 'R.I5', "'P1'", "'P2'", "'P3'", 'const MANNY', '=== MANNY', "' + MANNY"))
still(f, s, ['T_BEFORE', 'lattice', 'wizardRun', 'tableRead', 'LC', 'WC', 'TC', 'skip', 'secs'])
hits(f, s, 0)
out[f] = s

# ---- g222_d181_durable: 6b, 6c, 7 (the 222/221 pair) -------------------------------------------------------------
f = 'g222_d181_durable.js'
s0 = s = open(os.path.join(G, f), encoding='utf-8').read()
KEEP222 = [
    "let B = null, baseWhy = '';\nif(VER === ERA){\n",
    "E(IA, WRAP); if(B) E(B, WRAP);\n",
    "if(B) infoMove(B, 'baseline V' + B.version);\n",
]
s = rep(f, s, "const skipRow = (l, why) => { skip++; console.log('SKIP ' + l + ': ' + why); };\n", '')
# the hand cut (D108's cut, typed) and its date helpers: 6c only
s = cut(f, s, 'const dayNum = iso => ', 'const HAND_W5THU = ', must=('const handWeek = iso => ',))
s = cut(f, s, "// D108's cut, typed:", '\n// ── FIXTURES ', must=('const handCut = ', 'const HAND_CUT = '))
# the 97-config lattice of row 7 and its builder: 7 only
s = cut(f, s, 'function mk(t, f, x, g, i, seed){\n', '\n// ── ROWS (static', must=('const LO = ', 'const L7 = [MARIO()];', 'L7.push(mk('))
s = cut_line(f, s, "  R6b:'6b PAIR CONTROL", 'must-not (b)')
s = cut_line(f, s, "  R6c:'6c PAIR CONTROL", 'must-not (c)')
s = cut_line(f, s, "  R7: '7 PAIR CONTROL", 'L7.length')
s = cut(f, s, '// HALF_MANNY first, on an unpinned clock, exactly as the harness prints it.\n', "let B = null, baseWhy = '';", must=('const MANNY_C = ',))
s = cut(f, s, 'const PAIR = VER === ERA && !!B;\n', '\n// ── DRIVER ',
        must=("console.log('  pair rows: '", 'const pairRow = (key, cond, got) => {', "is not D181's build pair", 'const MANNY_B = '))
s = cut(f, s, '// ── PAIR ROWS 6b, 6c, 7 ', '// ── INFO: rest-day moved',
        must=('function run6b(X){', 'function run6c(X){', 'if(PAIR){', "pairRow('R6b'", "pairRow('R6c'", "pairRow('R7'",
              "} else { pairRow('R6b', false, 'no pair'); pairRow('R6c', false, 'no pair'); pairRow('R7', false, 'no pair'); }"),
        new='// 6b, 6c and 7 ' + TAIL + ' They defended D181 (P-SWAPDURABLE) on its build pair (222 vs 221): must-not (b), must-not (c) with the hand cut, and no engine card moved against V221.\n\n')
gone(f, s, ['skipRow', 'MANNY_C', 'MANNY_B', 'L7', 'mk', 'LO', 'HALF', 'HAND_CUT', 'handCut', 'handWeek', 'dayNum', 'run6b', 'run6c', 'PAIR', 'pairRow'],
     literal=("'R6b'", "'R6c'", "'R7'", 'R.R7'))
still(f, s, ['B', 'START', 'MARIO', 'cutNow', 'skip', 'infoMove'])
hits(f, s, 1)
kept(f, s0, s, KEEP222)
out[f] = s

# ---- g223_d184_testlen: R5 and NRC0 (the 223/222 pair; each in NY and UTC) ---------------------------------------
f = 'g223_d184_testlen.js'
s0 = s = open(os.path.join(G, f), encoding='utf-8').read()
KEEP223 = [
    s0[s0.index('  // The V222 baseline for NRC0 (pair-scoped: only at 223).\n'):s0.index('  // R5 (pair-scoped): g203, the lighter choice')],
    s0[s0.index("// ── R1 resolver lattice ──"):s0.index("// ── R2 builds on the (c) cells ──")],
    "const TAG = process.env.G184_ZONE, VER = +process.env.G184_VER, PAIR = process.env.G184_PAIR === '1';\n",
]
s = cut_line(f, s, "  R5: 'R5 CONTROL: HALF_MANNY", 'g203 98/98')
s = cut_line(f, s, "  NRC0: 'NRC0 CONTROL (blast radius vs V222)", "M7\\'s 210")
s = rep(f, s, "['NRC0', 'R3S', 'R4D', 'R4B', 'R5', 'R6N'].includes(key)", "['R3S', 'R4D', 'R4B', 'R6N'].includes(key)")
s = cut_line(f, s, "const PAIR_ONLY = ['NRC0', 'R5'];", 'PAIR_ONLY')
WANT223 = '  const want = ROW_KEYS.filter(k => pair || !PAIR_ONLY.includes(k));\n'
s = cut(f, s, '  // R5 (pair-scoped): g203, the lighter choice', WANT223, must=("let g203 = '';", 'g203_mile_pencil.js'))
s = rep(f, s, WANT223, '  const want = ROW_KEYS;\n')
s = rep(f, s, 'G184_BASE_WHY: baseWhy,\n        G184_G203: g203 }),', 'G184_BASE_WHY: baseWhy }),')
s = cut(f, s, '// ── R5 CONTROL HALF_MANNY and g203 (pair-scoped).', "console.log('CHILD ' + TAG",
        must=("else guard('R5', ", "row('R5', ", 'ROWS.NRC0', "row('NRC0', "),
        new='// R5 and NRC0 ' + TAIL + " They defended D184 (P-TESTLEN) on its build pair (223 vs 222): R5 the HALF_MANNY digest and g203 98/98, NRC0 M7's 210 race and run_base builds digest-identical to V222.\n\n")
gone(f, s, ['PAIR_ONLY', 'g203', 'G184_G203'], literal=('ROWS.R5', 'ROWS.NRC0', "'NRC0'", "'R5'"))
still(f, s, ['pair', 'PAIR', 'basePath', 'baseWhy', 'tmpBase', 'PREV', 'PREV_COMMIT', 'RD0', 'thuOfWeek', 'clone', 'mkVM'])
hits(f, s, 1)
kept(f, s0, s, KEEP223)
out[f] = s

# ---- version_scope_debt.txt (re-read immediately before writing; only this slice's four lines) --------------------
d = open(DEBT, encoding='utf-8').read()
d = cut_line('debt', d, 'g221_d177_swapfloor.js 5  #', 'mE classes 2/3/1',
             new='g221_d177_swapfloor.js 1  # 6 rows (mE 2/3/1): G4a, G7-4, G8a and G9 retired Post-V233 R6, G4b and G4c re-scoped by slice 9; the hit left is VER === ERA guarding the V220 pair loader that G4b and G4c read on 221 (B4 = B), not a row switch\n')
d = cut_line('debt', d, 'g221_d180_blockopen.js 5  #', 'mE classes 0/3/1')
d = cut_line('debt', d, 'g222_d181_durable.js 4  #', 'mE classes 0/3/0',
             new='g222_d181_durable.js 1  # 3 rows (mE 0/3/0) retired Post-V233 R6; the hit left is VER === ERA guarding the V221 loader that the WRAP install and the INFO print (never counts) read, not a row switch\n')
d = cut_line('debt', d, 'g223_d184_testlen.js 1  #', 'mE classes 0/2/2',
             new='g223_d184_testlen.js 1  # 4 rows (mE 0/2/2) retired Post-V233 R6; the hit left is pair (VER === ERA) guarding the V222 loader that live R1 reads for its pair-scoped blast-radius conjunct, not a row switch\n')

for f, s in out.items():
    open(os.path.join(G, f), 'w', encoding='utf-8').write(s)
    print('wrote tests/gates/' + f)
open(DEBT, 'w', encoding='utf-8').write(d)
print('wrote tests/version_scope_debt.txt')
