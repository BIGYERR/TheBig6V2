#!/usr/bin/env python3
# Post-V233 tooling pass, retirement slice R3. Tests only: index.html untouched, ia-version stays 233.
#
# RULING (Mario, tests/measure/v233_rulings/post_v233_proof_scope_decisions.md, Message 3): "retire the 121 except
# g219's D167 rows ... Amend standing ruling 3 to say a build-scoped claim retires when the next build ships, and the
# previous-version run is its replacement." Session reading in the same file: class-iii rows and baseline-licence hits
# are build-scoped and retire the same way. Evidence: measure mE (tests/measure/v233_rulings/measure_exact_version_mE.md).
#
# Gates in this slice (node tests/version_scope.js --list before this script):
#   g210_equipment_denials.js:381  VER === D70C_ERA   O5b (the 210/209 pair; needs argv[3])
#   g211_d153_d155.js:66           PAIR = VER === ERA  G0 G2r G3 G4 G4b, per limb (NRC, NSW, D153): 15 rows
#   g212_d110a_swim.js:135         PAIR = VER === ERA  P0 P1 P2 P2 GT1b D5 (class ii), D4 HM (class iii)
#   g213_d113a.js:78               PAIR = VER === ERA  R0 R3 R3n R4p R6 (class ii), HM (class iii)
# Slice 9's class-i rows stay exactly as they are, with their own VER >= ERA predicates: g212 P1n and SH5, g213 R3v.
#
# What is kept because a live row reads it (the brief: keep that part):
#   g212  the V211 baseline loader and its PAIR guard, and the P1 loop over P1 with the baseline: P1n's predicate
#         (P1N_RAN = !!BASE || ...) reads BASE and, on the build pair, its audit rides that loop. g212 keeps 1 hit.
#   g213  the V212 baseline loader (not PAIR-gated; R3v, R7 and R8 read it) and the R3/R3v loop: its builds feed
#         R3v's crash and reach counts. Only R3's own compare (mv, ex, n) goes.
#   g211  the V210 loader was PAIR-gated and served the pair rows only (its own header: "build-pair rows only"), so it
#         retires with them. run() reads BASE on lines a live row shares (the p build and rw = (b || p)), so those
#         lines stay verbatim and BASE stays declared, null: its branches are inert, as they already were off 211.
#
# Diff classes: (R-a) the exact-version rows above retired with their predicates where nothing live reads them, the
# row names in each gate's below-era skip list, and every helper / constant / local nothing else reads (g210 BASEFILE,
# SECS, sc; g211 fs, os, cp, BASEFILE, PAIR, V210_COMMIT, pairRow, baseWhy, the retired R fields, pullThrough;
# g212 HM_DIGEST, pairRow, W, g0, g0bad; g213 PAIR, HM_DIGEST, pairRow, progDigest, fixtures, maxRuns, r6n, r6mv,
# r6ex, pN, pCells, pDiff, pex, and R3's n, mv, ex); (R-b) the four gates' lines in tests/version_scope_debt.txt:
# g210, g211 and g213 deleted (0 hits), g212's comment rewritten (1 hit left, the loader guard).
# Every anchor is asserted count == 1 against the progressively edited text before anything is written; a span edit
# asserts its start and its end anchor count == 1 each, end after start. The first miss aborts the whole script.
import os, re, sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
G = os.path.join(ROOT, 'tests', 'gates')
DEBT = os.path.join(ROOT, 'tests', 'version_scope_debt.txt')
RET = 'retired Post-V233 under standing ruling 3 (build-scoped; the previous-version run replaces it).'

def die(msg):
    print('ABORT: ' + msg); sys.exit(1)

# an edit is (anchor, replacement) or ('SPAN', start, end, replacement, [markers the span must contain])
EDITS = {
'g210_equipment_denials.js': [
  ('SPAN', "if(BASEFILE){\n  const BA = load(BASEFILE);\n",
   "} else skipRow('O5b section counts vs V209: no baseline given');\n",
   "// O5b (D70c: section counts equal V209's per config and day, the 210/209 build pair) " + RET + "\n",
   ["VER === D70C_ERA && +BA.version === D70C_ERA - 1", "ok('O5b section counts equal V209", "SECS[C.k]"]),
  # BASEFILE: read only by O5b
  ("const BASEFILE = process.argv[3] || null;\nconst IA = load(ART);\n",
   "const IA = load(ART);\n"),
  ("'O5a','O5b','O5c'", "'O5a','O5c'"),
  # SECS and the per-build section list sc: written by the lattice for O5b only
  ("const B = { S1:{}, S2:{}, G:{}, G5:{}, R:{}, ALL:{} }, NAMES = {}, SECS = {};\n",
   "const B = { S1:{}, S2:{}, G:{}, G5:{}, R:{}, ALL:{} }, NAMES = {};\n"),
  ("  builds++;\n  const sc = [];\n", "  builds++;\n"),
  ("const day = p.weeks[w][d]; sc.push(day && day.sections ? day.sections.length : -1);\n",
   "const day = p.weeks[w][d];\n"),
  ("  SECS[C.k] = sc.join(',');\n", ""),
],
'g211_d153_d155.js': [
  # fs, os, cp: read only by the V210 loader
  ("const fs = require('fs'), os = require('os'), path = require('path'), cp = require('child_process');\n",
   "const path = require('path');\n"),
  ("const BASEFILE = process.argv[3] || null;\n", ""),
  ("const PAIR = VER === ERA;                 // build-pair rows run only for candidate 211 vs V210\n"
   "const V210_COMMIT = 'd8d2f5ba89fa2d1630fa2b30fb76dceee55778f1';\n", ""),
  ("function pairRow(label, cond, got){\n"
   "  if(!PAIR){ scoped++; console.log('SCOPED OUT ' + label + ' [build pair 211/210 only; candidate is ' + VER + '] (now ' + got + ')'); return; }\n"
   "  ok(label, cond, got);\n"
   "}\n", ""),
  ("['HF','G0','G1','G2','G2v','G3','G4','G4b','G5','G6','HM']", "['HF','G1','G2','G2v','G5','G6','HM']"),
  ('SPAN', "// ── the V210 baseline (build-pair rows only) ",
   "  console.log('baseline: ' + (BASE ? 'V210 from ' + baseWhy : 'UNAVAILABLE (' + baseWhy + ')'));\n}\n",
   "// the V210 baseline loaded only for G0 G2r G3 G4 G4b (retired in run() below); BASE stays null, so run()'s baseline branches are inert.\n"
   "let BASE = null;\n",
   ["let BASE = null, baseWhy = '';", "if(PAIR){", "V210_COMMIT + ':index.html'"]),
  # the R fields only the retired rows read
  ("  const R = {baseHinge:{}, cfg:0, crash:0, tb:0, zero:0, d38:0, hinge:0, hingeEx:{}, hingeElse:0, over8:0, maxSets:0,\n"
   "    g6n:0, g6bad:0, g6ex:null, nonLong:0, nonLongDiff:0, acN:0, acDiff:0, recN:0, recDiff:0, diffEx:null, selfN:0, selfDiff:0, zeroEx:null, recFullB:0};\n",
   "  const R = {cfg:0, crash:0, tb:0, zero:0, d38:0, hinge:0, hingeEx:{}, hingeElse:0, over8:0, maxSets:0,\n"
   "    g6n:0, g6bad:0, g6ex:null, zeroEx:null, recFullB:0};\n"),
  # G0's sampler
  ("    if(BASE && idx % 25 === 0){ const b2 = BASE.buildProgram(cl(x.c)); R.selfN++; if(JSON.stringify(b.weeks) !== JSON.stringify(b2.weeks)) R.selfDiff++; }\n", ""),
  # G2r, G3, G4, G4b's per-day compare against V210
  ('SPAN', "      if(b){ const y0 = b.weeks[w] && b.weeks[w][d];",
   "' \"' + (y0 && y0.title) + '\"'; } }\n",
   "",
   ["R.baseHinge[it.name] = (", "R.nonLongDiff++", "R.recDiff++", "R.diffEx = "]),
  ('SPAN', "  if(!PAIR){ ['G0','G2r','G3','G4','G4b'].forEach(r => pairRow(L + ' ' + r, false, 'n/a')); return; }\n",
   "R.acDiff + ', first ' + R.diffEx);\n",
   "  // G0 G2r G3 G4 G4b (D153/D155: V210 built twice identical, the limb reaches V210's tier B hinges, recovery weeks and non-long-run days byte-identical to V210) " + RET + "\n",
   ["pairRow(L + ' G2r", "pairRow(L + ' G0", "pairRow(L + ' G3", "pairRow(L + ' G4 ", "pairRow(L + ' G4b"]),
  # fl.pullThrough: read only by G2r
  ("run('D153', D153, {tb:100, rec:10, pullThrough:true});\n", "run('D153', D153, {tb:100, rec:10});\n"),
],
'g212_d110a_swim.js': [
  ("const HM_DIGEST = '0ac7da6b1691a8e1';\n", ""),
  ("function pairRow(label, cond, got){\n"
   "  if(!PAIR){ scoped++; console.log('SCOPED OUT ' + label + ' [build pair 212/211 only; candidate is ' + VER + '] (now ' + got + ')'); return; }\n"
   "  ok(label, cond, got);\n"
   "}\n", ""),
  ("'D1','D2','D3','D4','D5','D6','D7','D8','FL1','GT1','GT1b','M2a','M2b','M2c','M2d','M2e','M2f','P0','P1','P1n','P2','HM','CP'",
   "'D1','D2','D3','D6','D7','D8','FL1','GT1','M2a','M2b','M2c','M2d','M2e','M2f','P1n','CP'"),
  # W: read only by P0
  ("const W = (I, c) => JSON.stringify(I.buildProgram(cl(c)).weeks);\n", ""),
  ("  let g0 = 0, g0bad = [], p1 = 0, p1bad = [];\n", "  let p1 = 0, p1bad = [];\n"),
  ("    for(const [lbl, c] of P1.slice(0, 12)){ g0++; if(W(BASE, c) !== W(BASE, c) && g0bad.length < 5) g0bad.push(lbl); }\n", ""),
  ('SPAN', "  pairRow('P0 identity fuzz: V211 built twice from one cfg is byte-identical (",
   "BASE ? p1bad.join(' | ') : 'NO BASELINE');\n",
   "  // P0 P1 (D110a: V211 built twice identical; P1's limbs byte-identical to V211 apart from the swim INT note) " + RET + "\n",
   ["V213 (standing ruling 4): P1 is the 212-vs-211 pair", "if(PAIR && ARGV_BASE_VER === VER) skipRow('P1 scoped", "pairRow('P1 run_pace_goal"]),
  ('SPAN', "// P2 — the swim time lattice: only swim INT cards move, and they keep V211's rep count\n{\n",
   "BASE ? repBad.join(' | ') : 'NO BASELINE');\n}\n",
   "// P2 (D110a: off the swim INT cards the swim time lattice is byte-identical to V211, and INT cards keep V211's rep count) " + RET + "\n",
   ["pairRow('P2 on the swim time lattice", "pairRow('P2 every swim INT card"]),
  ('SPAN', "{\n  const hm = progDigest(IA.buildProgram(cl(fixtures.HALF_MANNY)));\n",
   "hm === HM_DIGEST, hm);\n}\n",
   "// D4 GT1b D5 HM (D110a/D144: the 500 goal's typed pre-slice digests, the 100 goal's program length equal to V211's, HALF_MANNY typed 0ac7da6b1691a8e1) " + RET + "\n",
   ["pairRow('D4 the 500 goal", "pairRow('GT1b", "pairRow('D5 swim_100_time", "pairRow('HM HALF_MANNY"]),
],
'g213_d113a.js': [
  # R3n first: its lines would otherwise read like R3's
  ('SPAN', "// ── R3n: NRC multi-sport under the excluded modes is byte-identical to V212 (slice 2c)",
   "mv + ' moved, first ' + ex + ', crash ' + crash);\n  }\n}\n",
   "// R3n (D146 slice 2c: NRC multi-sport under the excluded modes byte-identical to V212) " + RET + "\n",
   ["else if(!PAIR) pairRow('R3n", "pairRow('R3n NRC multi-sport under the excluded modes"]),
  # progDigest, fixtures: read only by R6, R3, R3n, R0 and HM
  ("const { load, fixtures, progDigest } = require(path.join(__dirname, '..', 'harness.js'));\n",
   "const { load } = require(path.join(__dirname, '..', 'harness.js'));\n"),
  ("const PAIR = VER === ERA;                 // build-pair rows run only for candidate 213 vs V212\n", ""),
  ("const HM_DIGEST = '0ac7da6b1691a8e1';\n", ""),
  ("function pairRow(label, cond, got){\n"
   "  if(!PAIR){ scoped++; console.log('SCOPED OUT ' + label + ' [build pair 213/212 only; candidate is ' + VER + '] (now ' + got + ')'); return; }\n"
   "  ok(label, cond, got);\n"
   "}\n", ""),
  ("['HF','R0','R1','R1v','R2','R2v','R3','R3v','R3n','R8','R8n','R8v','R4','R4p','R5','R6','R7','R7v','HM']",
   "['HF','R1','R1v','R2','R2v','R3v','R8','R8n','R8v','R4','R5','R7','R7v']"),
  # maxRuns: read only by R6
  ("const maxRuns = p => Math.max(0, ...weeksOf(p).map(w => runsOf(p.weeks[w]).length));\n", ""),
  # R6
  ("  let n = 0, crash = 0, W = 0, uW = 0, ex = null, three = 0, r6n = 0, r6mv = 0, r6ex = null;\n",
   "  let n = 0, crash = 0, W = 0, uW = 0, ex = null, three = 0;\n"),
  ("    if(multi && BASE){ const b = build(BASE, cfg); if(maxRuns(b) <= 2){ r6n++; if(progDigest(b) !== progDigest(p)){ r6mv++; if(!r6ex) r6ex = JSON.stringify(x.ex) + ' rest=' + x.rest; } } }\n", ""),
  ("  if(!BASE) pairRow('R6 multi-sport pace builds with two runs a week at most need the V212 baseline', false, baseWhy);\n"
   "  else pairRow('R6 multi-sport pace builds whose V212 week holds two runs at most are unmoved against V212 (' + r6n + ' builds)', r6n > 100 && r6mv === 0, r6mv + ', first ' + r6ex);\n",
   "  // R6 (D113a/D146: multi-sport pace builds whose V212 week holds two runs at most unmoved against V212) " + RET + "\n"),
  # R3: its own calls and its compare; the loop stays (its builds feed R3v's crash and reach counts)
  ("  if(!BASE){ pairRow('R3 excluded injury modes need the V212 baseline', false, baseWhy); minRow('R3v excluded mode reach needs the V212 baseline', false, baseWhy); }\n",
   "  if(!BASE){ minRow('R3v excluded mode reach needs the V212 baseline', false, baseWhy); }\n"),
  ("    if(!PAIR) pairRow('R3 excluded injury modes byte-identical to V212', false, 'n/a');\n", ""),
  ("    let n = 0, mv = 0, ex = null, crash = 0; const reach = {}, multiReach = {};\n",
   "    let crash = 0; const reach = {}, multiReach = {};\n"),
  ("      n++; reach[mode] = (reach[mode] || 0) + 1; if(Object.keys(e).length) multiReach[mode] = (multiReach[mode] || 0) + 1;\n",
   "      reach[mode] = (reach[mode] || 0) + 1; if(Object.keys(e).length) multiReach[mode] = (multiReach[mode] || 0) + 1;\n"),
  ("      if(progDigest(a) !== progDigest(b)){ mv++; if(!ex) ex = mode + ' ' + JSON.stringify(e) + ' ' + inj.region + '/' + inj.tier + ' rest=' + rest; }\n", ""),
  ("    if(PAIR) pairRow('R3 excluded injury modes, pace solo and multi-sport: every build byte-identical to V212 (' + n + ' builds)', n > 0 && mv === 0, mv + ', first ' + ex);\n",
   "    // R3 (D113a: excluded injury modes, pace solo and multi-sport, byte-identical to V212) " + RET + "\n"),
  # R4p
  ("  let r4n = 0, r4bad = 0, r4ex = null, r5n = 0, r5bad = 0, r5ex = null, crash = 0, pN = 0, pCells = 0, pDiff = 0, pex = null;\n",
   "  let r4n = 0, r4bad = 0, r4ex = null, r5n = 0, r5bad = 0, r5ex = null, crash = 0;\n"),
  ("        if(PAIR && BASE){ pN++; const b = build(BASE, cfg);\n"
   "          weeksOf(b).forEach(w => DAYS.forEach(d => { pCells++; if(JSON.stringify(cards(b.weeks[w][d])) !== JSON.stringify(cards((p.weeks[w] || {})[d]))){ pDiff++; if(!pex) pex = cal + ' tw=' + tw + ' ' + f + ' W' + w + ' ' + d; } })); }\n", ""),
  ("  if(!BASE) pairRow('R4p the 7 spacer calendars need the V212 baseline', false, baseWhy);\n"
   "  else pairRow('R4p the 7 spacer calendars: cardio byte-identical to V212 on every day (' + pN + ' builds, ' + pCells + ' day-cells)', pN === 84 && pDiff === 0, pDiff + ', first ' + pex);\n",
   "  // R4p (D113a: the 7 spacer calendars' cardio byte-identical to V212) " + RET + "\n"),
  # R0 and HM
  ('SPAN', "// ── R0 / HM ──",
   "got === HM_DIGEST, got); }\n",
   "// R0 HM (D113a/D146: V212 built twice identical; HALF_MANNY typed 0ac7da6b1691a8e1) " + RET + "\n",
   ["pairRow('R0 V212 built twice", "pairRow('HM HALF_MANNY shipped digest"]),
],
}

# Post-edit reader checks (comments stripped): each retired name must be gone; each kept name must still be read.
GONE = {
  'g210_equipment_denials.js': [r'\bBASEFILE\b', r'\bSECS\b', r'(?<![\w.$])sc\b', r'\bD70C_ERA - 1\b', r"'O5b"],
  'g211_d153_d155.js': [r'(?<![\w.$])fs\b', r'(?<![\w.$])os\b', r'(?<![\w.$])cp\b', r'\bBASEFILE\b', r'\bPAIR\b', r'\bV210_COMMIT\b',
                        r'\bpairRow\b', r'\bbaseWhy\b', r'\bselfN\b', r'\bselfDiff\b', r'\bbaseHinge\b', r'\bnonLong', r'\bacN\b', r'\bacDiff\b',
                        r'\brecN\b', r'\brecDiff\b', r'\bdiffEx\b', r'\bpullThrough\b', r"'G0'", r"'G3'", r"'G4'", r"'G4b'"],
  'g212_d110a_swim.js': [r'\bHM_DIGEST\b', r'\bpairRow\b', r'(?<![\w.$])W\(', r'\bg0\b', r'\bg0bad\b', r'\bd4[cal]\b', r'\bgtA\b', r'\bd5bad\b', r'\brepBad\b'],
  'g213_d113a.js': [r'\bPAIR\b', r'\bHM_DIGEST\b', r'\bpairRow\b', r'\bprogDigest\b', r'\bfixtures\b', r'\bmaxRuns\b', r'\br6n\b', r'\br6mv\b',
                    r'\br6ex\b', r'\bpN\b', r'\bpCells\b', r'\bpDiff\b', r'(?<![\w.$])pex\b', r'(?<![\w.$])mv\b(?!:)', r"'R0'", r"'R3'", r"'R3n'", r"'R4p'", r"'R6'", r"'HM'"],
}
KEPT = {
  'g210_equipment_denials.js': [r'\bload\(ART\)', r'\bcells\b', r'\bclean\(', r'\bDAYS\b'],
  'g211_d153_d155.js': [r'\bBASE\b', r'\(b \|\| p\)', r'\bscoped\b', r'\bfl\.tb\b', r'\bfl\.rec\b', r"minRow|ok\('HM"],
  'g212_d110a_swim.js': [r'\bPAIR\b', r'\bBASE\b', r'\bV211_COMMIT\b', r'\bARGV_BASE_VER\b', r'\bWN\(BASE, c, false\)', r'\bP1N_RAN\b', r"minRow\('P1n", r"minRow\('SH5", r'\bscoped\b'],
  'g213_d113a.js': [r'\bBASE\b', r'\bV212_COMMIT\b', r"minRow\('R3v the lattice", r"minRow\('R3v excluded mode reach", r'\bscoped\b', r'\bbuild\(BASE, cfg\)'],
}

def strip_comments(s):
    s = re.sub(r'/\*[\s\S]*?\*/', '', s)
    return '\n'.join(re.sub(r'\s//\s.*$', '', re.sub(r'^\s*//.*$', '', l)) for l in s.split('\n'))

# 1. read every gate and apply every edit to the progressively edited text, asserting every anchor count == 1
out = {}
for fn, eds in EDITS.items():
    p = os.path.join(G, fn)
    s = open(p, encoding='utf-8').read()
    for k, e in enumerate(eds):
        if e[0] == 'SPAN':
            _, a, b, r, marks = e
            na, nb = s.count(a), s.count(b)
            if na != 1 or nb != 1:
                die(f'{fn} span {k}: start count={na}, end count={nb}: {a[:70]!r} .. {b[:70]!r}')
            i = s.index(a); j = s.index(b)
            if j < i:
                die(f'{fn} span {k}: end anchor precedes start anchor')
            body = s[i:j + len(b)]
            for m in marks:
                if body.count(m) != 1:
                    die(f'{fn} span {k}: marker count={body.count(m)} inside the span: {m!r}')
            s = s[:i] + r + s[j + len(b):]
        else:
            a, r = e
            n = s.count(a)
            if n != 1:
                die(f'{fn} edit {k}: anchor count={n}: {a[:90]!r}')
            s = s.replace(a, r)
    cs = strip_comments(s)
    for t in GONE[fn]:
        hits = [i + 1 for i, l in enumerate(cs.split('\n')) if re.search(t, l)]
        if hits:
            die(f'{fn}: retired name {t!r} still read on lines {hits}')
    for t in KEPT[fn]:
        if not re.search(t, cs):
            die(f'{fn}: kept name {t!r} no longer read')
    out[fn] = s

# (R-b) debt lines. The brief: change only this slice's lines, re-read the file immediately before writing.
DEBT_DEL = [
  'g210_equipment_denials.js 1  # 1 rows, mE classes 0/1/0\n',
  'g211_d153_d155.js 1  # 15 rows, mE classes 0/15/0\n',
  'g213_d113a.js 1  # 7 rows, mE classes 1/5/1\n',
]
DEBT_SUB = [
  ('g212_d110a_swim.js 1  # 10 rows, mE classes 2/6/2\n',
   'g212_d110a_swim.js 1  # 10 rows (mE 2/6/2): 8 retired Post-V233 R3, P1n and SH5 re-scoped by slice 9; the hit left is PAIR guarding the V211 baseline loader that P1n reads (P1N_RAN), not a row switch\n'),
]
d0 = open(DEBT, encoding='utf-8').read()   # pre-check, so a debt miss aborts before any gate is written
for L in DEBT_DEL + [a for a, _ in DEBT_SUB]:
    if d0.count(L) != 1:
        die(f'debt line count={d0.count(L)}: {L!r}')

# 2. write the gates
for fn, s in out.items():
    open(os.path.join(G, fn), 'w', encoding='utf-8').write(s)
    print('wrote tests/gates/' + fn)

# 3. debt file: re-read immediately before writing (another builder edits other lines of it)
d = open(DEBT, encoding='utf-8').read()
for L in DEBT_DEL:
    if d.count(L) != 1:
        die(f'debt line count={d.count(L)}: {L!r} (gates already written; fix the debt file by hand against version_scope.js)')
    d = d.replace(L, '')
for a, r in DEBT_SUB:
    if d.count(a) != 1:
        die(f'debt line count={d.count(a)}: {a!r} (gates already written; fix the debt file by hand against version_scope.js)')
    d = d.replace(a, r)
open(DEBT, 'w', encoding='utf-8').write(d)
print('wrote tests/version_scope_debt.txt (-%d lines, %d rewritten)' % (len(DEBT_DEL), len(DEBT_SUB)))
