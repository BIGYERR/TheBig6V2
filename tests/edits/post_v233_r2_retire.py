#!/usr/bin/env python3
# Post-V233 tooling pass, retirement slice R2 (tests only; index.html untouched, ia-version stays 233).
# Mario, tests/measure/v233_rulings/post_v233_proof_scope_decisions.md Message 3: the dark build-scoped rows
# retire; standing ruling 3 as amended: a build-scoped claim retires when the next build ships, and the
# previous-version run is its replacement. Evidence: measure mE (measure_exact_version_mE.md).
# Gates: g208_d103a_key (K4), g208_d103a_readers (H4, E7b, I2, I3, S2, S3, N1), g208_d104a_runbase (R7, R8b),
# g209_d140_tier (K2, C2, N1, L1). Each retired row goes with its predicate and any helper only it read;
# every live row is kept byte for byte. Diff classes: (R-a) rows retired, (R-b) version_scope_debt.txt lines.
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
        if re.search(r'\b' + re.escape(w) + r'\b', code):
            die(f'{name}: {w} still read after the retirement')


out = {}

# ---- g208_d103a_key: K4 (D103a slices 1-3 inertness, the 208 build pair) ------------------------------
f = 'g208_d103a_key.js'
s = open(os.path.join(G, f), encoding='utf-8').read()
s = rep(f, s, "const BASEFILE = process.argv[3] || null;\n", '')
s = rep(f, s, "['K0','K1','K2','K2b','K3','K4','K5']", "['K0','K1','K2','K2b','K3','K5']")
s = cut(f, s, 'function canon(v){\n', 'const clone = v =>', must=('Object.keys(v).sort()',))
s = cut(f, s, '// ── K4: inertness against the pre-slice tree', '// ── K5 ──',
        must=('VER !== ERA', 'ok(`K4', 'IB.buildProgram'), must_not=('ok(`K5',),
        new='// K4 ' + TAIL + ' It defended D103a slices 1-3: the stamp is inert, every program byte-identical with dose.key stripped.\n')
gone(f, s, ['BASEFILE', 'canon', 'IB'])
out[f] = s

# ---- g208_d103a_readers: H4, E7b, I2, I3, S2, S3, N1 (D103a slice 2 and 2b, the 207/208 pair) ---------
f = 'g208_d103a_readers.js'
s = open(os.path.join(G, f), encoding='utf-8').read()
s = rep(f, s, "['R','H','E','I','S','N','M']", "['R','H','E','I','S','M']")
s = rep(f, s, "const BASE_OK = !!IB && VER === ERA && (+IB.version === 207 || +IB.version === 208);\n"
              "const BASE_WHY = !IB ? 'no baseline passed as argv[3]' : 'baseline ia-version ' + IB.version + ' is neither V207 nor the V208 pre-slice tree';\n", '')
s = cut(f, s, '// label -> class, for unkeyed (baseline) cards.', 'const keyOf = c =>', must=('function labelKey(c){',))
s = cut(f, s, 'const NRCCFG = [];\n', 'const build = (A, cfg) =>', must=('NRCCFG.push(',))
# H: H4's before4/after4 and the baseline count; `before` stays null, so H2/H3 print 'n/a' exactly as at 233
s = cut(f, s, "  // before: the baseline's cuts by label class.", '  const bf = k =>',
        must=('let before4 = null, after4 = {};', 'if(BASE_OK){ before = {}; before4 = {};'), must_not=('let before = null;',))
s = cut(f, s, "  if(!BASE_OK) skip('H4 '", '}\n// ── E: easy and reduce', must=('ok(`H4',),
        new='  // H4 ' + TAIL + ' It defended D103a slice 2: the halfstep cut counts for int, chi, long and steady equal the baseline\'s.\n')
# E1's bench-before count reads the baseline only; benchBefore stays 'n/a', so E1 prints exactly as at 233
s = cut(f, s, '  if(BASE_OK){ let pb = 0, tb = 0;', '  ok(`E1 easy mode parks', must=("benchBefore = pb + '/' + tb; }",))
s = cut(f, s, "  if(!BASE_OK) skip('E7b '", '}\n// ── I: interference', must=('ok(`E7b',),
        new='  // E7b ' + TAIL + ' It defended D103a slice 2b: without an injury the strides count equals the baseline\'s.\n')
# I: CB and the V207 relabel feed I2 and I3 only
s = rep(f, s, "const CI = IA.eval('_cardioInterference'), CB = BASE_OK ? IB.eval('_cardioInterference') : null;",
              "const CI = IA.eval('_cardioInterference');")
s = cut(f, s, '  // the card V207 printed for this key:', '  let n = 0; const bad = [], badB = []', must=('const HEAD207 =', 'const as207 ='))
s = rep(f, s, 'let n = 0; const bad = [], badB = [], badR = []; let nu = 0, nu7 = 0; const badU = [];',
              'let n = 0; const bad = [], badR = [];')
s = rep(f, s, """ if(CB && v !== CB(as207(c))) badB.push(k + ' ' + v + ' baseline ' + CB(as207(c)) + ' on "' + as207(c).subtype + '"');""", '')
s = cut(f, s, '    if(CB){ nu++;', '  ok(`I1 keyed INT and CHI', must=('nu7++', 'badU.push('), new='    }));\n')
s = cut(f, s, "  if(!CB){ skip('I2 '", '}\n// ── S: shape', must=('ok(`I2', 'ok(`I3'),
        new='  // I2 and I3 ' + TAIL + ' They defended D103a slice 2: keyed INT and CHI, and the unkeyed path, read the baseline\'s _cardioInterference value.\n')
s = cut(f, s, "  if(!BASE_OK) skip('S2 '", '}\n// ── N: NRC, bike and swim', must=('ok(\'S2', 'ok(`S3', 'VER !== ERA'),
        new='  // S2 and S3 ' + TAIL + ' They defended D103a slice 2: the unkeyed shape equals the baseline\'s, and only week-1-test programs move against the pre-slice tree.\n')
s = cut(f, s, '// ── N: NRC, bike and swim', '// ── M: HALF_MANNY', must=('ok(`N1',),
        new='// N1 ' + TAIL + ' It defended D103a slice 2: NRC, bike and swim programs, injured or not, byte-identical to the baseline.\n')
gone(f, s, ['BASE_OK', 'BASE_WHY', 'CB', 'labelKey', 'NRCCFG', 'HEAD207', 'as207', 'badB', 'badU', 'nu', 'nu7', 'before4', 'after4'])
out[f] = s

# ---- g208_d104a_runbase: R7 (the 207/208 pair), R8b (the V208 close build pair) -------------------------
f = 'g208_d104a_runbase.js'
s = open(os.path.join(G, f), encoding='utf-8').read()
s = rep(f, s, "const BASEFILE = process.argv[3] || null;\n", '')
s = rep(f, s, "const ROWS = ['R0','R0b','R1','R2','R3','R4','R5','R6','R7','R8a','R8b','M1'];",
              "const ROWS = ['R0','R0b','R1','R2','R3','R4','R5','R6','R8a','M1'];")
s = cut(f, s, '// ── R7: undated pace/mile and NRC against the baseline', '// ── M1 ──',
        must=('+IB.version === 207', 'ok(`R7'),
        new='// R7 ' + TAIL + ' It defended D104a: undated pace/mile and NRC role grids and notes equal the baseline\'s.\n')
s = cut(f, s, "  if(!BASEFILE) skip('R8b", '// V231 (absorb ruling section 4', must=('VER !== ERA', 'ok(`R8b'), must_not=('ok(`R8a',),
        new='  // R8b ' + TAIL + ' It defended the D104a V208 close guard: programs with a lift day byte-identical to the pre-edit tree.\n}\n')
gone(f, s, ['BASEFILE', 'IB'])
out[f] = s

# ---- g209_d140_tier: K2, C2, N1, L1 (the D140 build pair, 209 vs 208) -----------------------------------
f = 'g209_d140_tier.js'
s = open(os.path.join(G, f), encoding='utf-8').read()
s = rep(f, s, "const BASEFILE = process.argv[3] || null;\n", '')
s = rep(f, s, "const ROWS = ['T0','T1','T2','A1','A2','B1','B2','B3','B4','B5','K0','K1','K2','C2','N1','L1','M1'];",
              "const ROWS = ['T0','T1','T2','A1','A2','B1','B2','B3','B4','B5','K0','K1','M1'];")
s = cut(f, s, "// V208's day with the carry ban applied by hand:", '\n// ── fixtures', must=('function stripCarry(day){',))
s = rep(f, s, "const IB = BASEFILE ? load(BASEFILE) : null;\nconst PAIR = !!IB && VER === D140_ERA && +IB.version === D140_ERA - 1;\n", '')
s = rep(f, s, 'const bad = { A1:[], A2:[], B1:[], B2:[], B3:[], B5:[], K0:[], C2:[], N1:[] };',
              'const bad = { A1:[], A2:[], B1:[], B2:[], B3:[], B5:[], K0:[] };')
s = rep(f, s, 'cPowCore = 0, k0Bad = 0, c2Bad = 0, n1Bad = 0, nonLong = 0, baseCarry = 0;', 'cPowCore = 0, k0Bad = 0, nonLong = 0;')
s = rep(f, s, 'const moved = { NSW:0, NRC:0 };\n', '')
s = rep(f, s, '  const q = PAIR ? IB.buildProgram(cl(L.cfg)) : null;\n', '')
s = rep(f, s, '    const bday = q && q.weeks[w] ? q.weeks[w][d] : null;\n', '')
s = rep(f, s, "      if(PAIR && JSON.stringify(day) !== JSON.stringify(bday)){ n1Bad++; note('N1', where); }\n", '')
s = rep(f, s, '    if(PAIR && bday){ if(JSON.stringify(day) !== JSON.stringify(bday)) moved[limb]++; baseCarry += carryN(bday); }\n', '')
s = cut_line(f, s, '      if(PAIR && bday && JSON.stringify(day) !== JSON.stringify(stripCarry(bday))){', "note('C2'")
s = cut(f, s, '  if(PAIR){\n    const b = IB.buildProgram', '}\n\n// ── pair rows', must=('ok(\'K2', "skipRow('K2"),
        new='  // K2 ' + TAIL + ' It defended D140\'s premise: on V208 the carry case dealt its carries in a section whose label never says carry.\n')
s = cut(f, s, '// ── pair rows: what D140 must not move', '\n// ── M1 HALF_MANNY', must=("ok('C2", "ok('N1", "ok('L1"),
        new='// C2, N1 and L1 ' + TAIL + ' They defended D140: tier C long-run days are V208\'s less carries, non-long days are V208\'s, and D140 moved long-run days on both limbs.\n')
gone(f, s, ['BASEFILE', 'IB', 'PAIR', 'stripCarry', 'c2Bad', 'n1Bad', 'baseCarry', 'moved', 'bday', 'q'])
out[f] = s

# ---- write the gates (every gate anchor has passed) ---------------------------------------------------
for f, s in out.items():
    open(os.path.join(G, f), 'w', encoding='utf-8').write(s)
    print('wrote tests/gates/' + f)

# ---- version_scope_debt.txt LAST: re-read now (a parallel builder edits other lines), one line per gate ---
d = open(DEBT, encoding='utf-8').read()
d = rep('debt', d, 'g208_d103a_key.js 1  # 1 rows, mE classes 0/1/0\n', '')
d = rep('debt', d, 'g208_d103a_readers.js 5  # 7 rows, mE classes 0/7/0\n',
        "g208_d103a_readers.js 1  # 7 rows (mE 0/7/0) retired Post-V233 R2; the hit left is E3e's V213 tree source (IB.version === 213), not a row switch\n")
d = rep('debt', d, 'g208_d104a_runbase.js 3  # 2 rows, mE classes 0/2/0\n', '')
d = rep('debt', d, 'g209_d140_tier.js 1  # 4 rows, mE classes 0/4/0\n', '')
open(DEBT, 'w', encoding='utf-8').write(d)
print('wrote tests/version_scope_debt.txt')
