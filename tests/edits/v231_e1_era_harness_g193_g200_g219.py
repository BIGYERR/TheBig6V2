#!/usr/bin/env python3
# V231 ERA RUN E1: four era rows in four files, each written on the line after its [230] row.
# Precedent and form: tests/edits/v230_s7a_era_g193_g197b_g200.py (refusals; every figure printed on both trees before
# anything is written; nothing is written if a figure differs; each row's comment cites its ruling).
# Rulings (standing ruling 4: each row is keyed to the ruling it defends; standing ruling 5: HALF_MANNY moves only by a
# ruling that printed the digest first):
#   D195 P-HIPEXT Amendment 2, D196 P-BWFALLBACK Amendment 1, D197 P-FILTERLAST Amendment 1:
#     tests/measure/v231_rulings/v231_reruling_d195a2_d196a1_d197a1.md, "HALF_MANNY digests (fixture seed 76308; standing
#     ruling 5)": "ABx = ABn = PREx = ALLx  2d35e8f743680cfa  universe 86  ← ERA ROW 231" and "B alone, W5 alone, FL alone
#     0ac7da6b1691a8e1  unmoved"; it supersedes A1–A4 of tests/measure/v231_rulings/v231_ruling_d196_d195a1_d197.md, whose
#     D196 and D197 surgery and D195-B stand.
#   Measure M18 (tests/measure/v231_rulings/measure_gate_candidate_m18.md) printed, on the V231 candidate, OPEN_UNRULED
#     53/53, SWAP P2c 138 and P6 {Kettlebell swing:138}, and g219 R1–R8 = 0,0,0,4770,891,412,0,0, each equal to [230].
#   E1 tests/harness.js                    MANNY_DIGEST_BY_VERSION[231] = '2d35e8f743680cfa'  (a NEW literal: the ruled move)
#   E2 tests/gates/g193_samecard.js        OPEN_UNRULED_BY_VERSION[231] = OPEN_UNRULED_BY_VERSION[230]
#   E3 tests/gates/g200_pull_arbitration.js SWAP_BY_VERSION[231] = SWAP_BY_VERSION[230]
#   E4 tests/gates/g219_samecard_draws.js  ERA[231] = ERA[230]
# Order: refuse unless index.html is the V231 candidate (ia-version 231, sha 1249c248a6794d1c) and the baseline is V230
# (ia-version 230, sha 72ac41c8d34034ce), the four files are clean against HEAD and carry no [231] token, the ruling text
# says what the E1 comment quotes; assert every anchor count==1. Print, before writing:
#   E1  the HALF_MANNY digest with the harness fixture on both trees (candidate must be 2d35e8f743680cfa and self-stable,
#       V230 0ac7da6b1691a8e1), the --grid diff (exactly W1–W12 TUE, each = the V230 line with Single-leg hip thrust
#       appended to Leg circuit — runner armor) and the hip thrust item's detail on all 12 (2×6–10 each @ RPE 7);
#   E2  g193's open-unruled set through a scratch probe mirror (the draft row plus one console.log after debtTotal);
#   E3  g200's computed P2c / P2d / P6 / P4 / P7 figures (the gate's own lines);
#   E4  g219's unconditional counters line (R1–R8 = dup li tgt ck ckNo bic1 c165 c166).
# A figure that differs between the trees parks its row (standing ruling 7): the script writes nothing and reports it.
# Then a scratch mirror tree carrying exactly the bytes to be written must be green on the candidate and on V230 at V230's
# counts; then write once, node --check, and re-run on both trees plus the two g231 gates that read MANNY_DIGEST[231].
import sys, os, re, subprocess, hashlib, json

ROOT = '/Users/CanasBangin/Desktop/TheBig6V2'
P = ROOT + '/index.html'
SCR = '/private/tmp/claude-501/-Users-CanasBangin-Desktop-TheBig6V2/adf6a3cd-1bcb-472e-a3ec-2078adfbc3be/scratchpad/builder_e1'
BASE = '/private/tmp/claude-501/-Users-CanasBangin-Desktop-TheBig6V2/adf6a3cd-1bcb-472e-a3ec-2078adfbc3be/scratchpad/base_v230.html'
CAND_SHA = '1249c248a6794d1c'
BASE_SHA = '72ac41c8d34034ce'
RULING = ROOT + '/tests/measure/v231_rulings/v231_reruling_d195a2_d196a1_d197a1.md'
M18 = ROOT + '/tests/measure/v231_rulings/measure_gate_candidate_m18.md'
F = {'harness': ROOT + '/tests/harness.js',
     'g193': ROOT + '/tests/gates/g193_samecard.js',
     'g200': ROOT + '/tests/gates/g200_pull_arbitration.js',
     'g219': ROOT + '/tests/gates/g219_samecard_draws.js'}
GATES = ['g193', 'g200', 'g219']
G231 = [ROOT + '/tests/gates/g231_d195_hipext.js', ROOT + '/tests/gates/g231_d196_bwfallback.js']
DIG_231 = '2d35e8f743680cfa'
DIG_230 = '0ac7da6b1691a8e1'
HT = 'Single-leg hip thrust'
DETAIL = '2×6–10 each @ RPE 7'
CIRCUIT = 'Leg circuit — runner armor'

def die(msg):
    print('REFUSED: ' + msg)
    sys.exit(1)

src_b = open(P, 'rb').read()
src = src_b.decode('utf-8')
base_b = open(BASE, 'rb').read()
txt = {k: open(v, encoding='utf-8').read() for k, v in F.items()}

# ── refusals ─────────────────────────────────────────────────────────────────────────────
if src.count('<meta name="ia-version" content=') != 1: die('index.html: not exactly one ia-version meta')
if src.count('<meta name="ia-version" content="231">') != 1: die('index.html does not read ia-version 231')
cs, bs = hashlib.sha256(src_b).hexdigest(), hashlib.sha256(base_b).hexdigest()
if not cs.startswith(CAND_SHA): die('index.html is not the V231 candidate (sha256 %s)' % cs)
if not bs.startswith(BASE_SHA): die('baseline is not V230 (sha256 %s)' % bs)
if base_b.decode('utf-8').count('<meta name="ia-version" content="230">') != 1: die('baseline does not read ia-version 230')
print('TREES candidate ia-version 231 sha %s | V230 baseline ia-version 230 sha %s' % (cs[:16], bs[:16]))
r = subprocess.run(['git', 'diff', '--quiet', 'HEAD', '--'] + list(F.values()), cwd=ROOT)
if r.returncode != 0: die('one of the four target files differs from HEAD')
for k, t in txt.items():
    if '[231]' in t: die(F[k] + ' already carries a [231] token')
rul = open(RULING, encoding='utf-8').read()
if len(re.findall(r'^ABx = ABn = PREx = ALLx\s+2d35e8f743680cfa\s+universe 86\s+← ERA ROW 231', rul, re.M)) != 1:
    die('the ruling does not carry the "ABx = ABn = PREx = ALLx 2d35e8f743680cfa ← ERA ROW 231" line exactly once')
if len(re.findall(r'^B alone, W5 alone, FL alone\s+0ac7da6b1691a8e1\s+unmoved', rul, re.M)) != 1:
    die('the ruling does not carry the "B alone, W5 alone, FL alone 0ac7da6b1691a8e1 unmoved" line exactly once')
if len(re.findall(r'D195-A-a\*\* HALF_MANNY era row 231 = `2d35e8f743680cfa`; conjuncts: B-alone counterfactual '
                  r'`0ac7da6b1691a8e1`, A-without-B counterfactual `f5ed630033ebe3db`', rul)) != 1:
    die('the ruling does not carry the D195-A-a era-row line with its two counterfactual conjuncts exactly once')
m18 = open(M18, encoding='utf-8').read()
for need in ('OPEN_UNRULED\n    (g193_samecard:318; throws at :320 = the crash) 53/53', 'SWAP_BY_VERSION\n    (g200_pull:302) P2c 138, P6 {Kettlebell swing:138}',
             'g219 ERA (:151) R1–R8 = 0,0,0,4770,891,412,0,0'):
    if m18.count(need) != 1: die('M18 does not print %r exactly once' % need)
print('RULING and M18 carry every line the comments quote')

EDITS = [('harness', 'MANNY_DIGEST_BY_VERSION'), ('g193', 'OPEN_UNRULED_BY_VERSION'),
         ('g200', 'SWAP_BY_VERSION'), ('g219', 'ERA')]
for k, m in EDITS:
    a = '\n' + m + '[230] = ' + m + '[229];   // '
    n = txt[k].count(a)
    print('ANCHOR %s %s[230] row count %d' % (F[k].split('/')[-1], m, n))
    if n != 1: die('anchor %r count %d in %s' % (a.strip(), n, F[k]))
PROBE_ANCHOR = '\nconst debtTotal = names.filter(n => OPEN_UNRULED[n] !== undefined).reduce((a, n) => a + dupByName[n], 0);\n'
if txt['g193'].count(PROBE_ANCHOR) != 1: die('g193 probe anchor (const debtTotal) count %d' % txt['g193'].count(PROBE_ANCHOR))

def with_rows(rows):
    new = dict(txt)
    for k, m in EDITS:
        a = '\n' + m + '[230] = ' + m + '[229];   // '
        i = new[k].index(a) + 1
        j = new[k].index('\n', i)            # end of the [230] row
        row = rows[m]
        if chr(92) + 'u' in row: die('a \\u escape was typed into a row')
        if '\n' in row: die('a newline in a row')
        new[k] = new[k][:j + 1] + row + '\n' + new[k][j + 1:]
    return new

os.makedirs(SCR + '/tmp', exist_ok=True)
env = dict(os.environ, TMPDIR=SCR + '/tmp')

def summ(out):
    m = re.findall(r'^PASS (\d+) FAIL (\d+)\s*$', out, re.M)
    return tuple(map(int, m[-1])) if m else None

def run_many(jobs):
    """jobs: list of (gate_path, artifact, base_or_None); run concurrently, return [(out, summary)]."""
    ps = []
    for g, art, b in jobs:
        cmd = 'set -eo pipefail; node "%s" "%s"%s' % (g, art, (' "%s"' % b) if b else '')
        ps.append(subprocess.Popen(['bash', '-c', cmd], stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, env=env, cwd=ROOT))
    res = []
    for p in ps:
        o, _ = p.communicate()
        res.append((o, summ(o)))
    return res

def one(pat, o, what):
    f = re.findall(pat, o, re.M)
    if len(f) != 1: die('cannot read %s (%d matches of %r)' % (what, len(f), pat))
    return f[0]

def sstr(s): return ('PASS %d FAIL %d' % s) if s else 'NO SUMMARY (crash)'

# ── E1 figure: the HALF_MANNY digest, grid and the hip thrust detail, on both trees ──────
def harness(art, extra=''):
    r = subprocess.run(['bash', '-c', 'set -eo pipefail; node "%s" "%s" %s' % (F['harness'], art, extra)],
                       capture_output=True, text=True, env=env, cwd=ROOT)
    if r.returncode: die('harness failed on %s: %s' % (art, r.stdout[-800:] + r.stderr[-800:]))
    return r.stdout
hc, hb = harness(P, '--grid'), harness(BASE, '--grid')
dc = one(r'^weeks \d+ \| startDate \S+ \| seed 76308 \| digest ([0-9a-f]{16})$', hc, 'candidate digest')
db = one(r'^weeks \d+ \| startDate \S+ \| seed 76308 \| digest ([0-9a-f]{16})$', hb, 'V230 digest')
print('FIG  E1 HALF_MANNY candidate %s (%s) | V230 %s (%s)' % (dc, one(r'^self-stable (.*)$', hc, 'c self'), db, one(r'^self-stable (.*)$', hb, 'b self')))
if 'self-stable yes' not in hc or 'self-stable yes' not in hb: die('a tree is not self-stable on HALF_MANNY; nothing is diffed')
if dc != DIG_231: die('PARK (standing ruling 7): candidate HALF_MANNY digest %s, the ruling printed %s' % (dc, DIG_231))
if db != DIG_230: die('PARK (standing ruling 7): V230 HALF_MANNY digest %s, the [230] row reads %s' % (db, DIG_230))
lc, lb = hc.splitlines()[3:], hb.splitlines()[3:]
if len(lc) != len(lb): die('grid line counts differ: candidate %d, V230 %d' % (len(lc), len(lb)))
diffs = [(x, y) for x, y in zip(lb, lc) if x != y]
if not diffs: die('an empty grid diff on a moved digest')
tag = CIRCUIT + '['
want_days = ['W%d TUE' % w for w in range(1, 13)]
got_days = [' '.join(y.split(' ')[:2]) for _, y in diffs]
if got_days != want_days: die('PARK (standing ruling 7): grid diff days %r, the ruling says W1–W12 TUE' % got_days)
for x, y in diffs:
    if x.count(tag) != 1: die('V230 line lacks one %r: %r' % (tag, x[:160]))
    i = x.index(tag); j = x.index(']', i)
    if y != x[:j] + ', ' + HT + x[j:]: die('PARK (standing ruling 7): %s moves beyond the appended %s' % (x[:7], HT))
print('FIG  E1 grid: %d of %d day lines differ, exactly W1–W12 TUE, each = the V230 line with %s appended to %s'
      % (len(diffs), len(lb), HT, CIRCUIT))
PROBE_JS = SCR + '/hipthrust_probe.js'
open(PROBE_JS, 'w', encoding='utf-8').write(
    "const H = require(" + json.dumps(F['harness']) + ");\n"
    "const IA = H.load(process.argv[2]); const DETAIL = process.argv[3];\n"
    "const prog = IA.buildProgram(H.fixtures.HALF_MANNY); const out = [];\n"
    "Object.keys(prog.weeks).sort((a, b) => a - b).forEach(wk => Object.keys(prog.weeks[wk]).forEach(d => {\n"
    "  const day = prog.weeks[wk][d]; if (!day || !day.sections) return;\n"
    "  day.sections.forEach(s => (s.items || []).forEach((it, idx) => {\n"
    "    const nm = String(it.name).replace(/<svg[\\s\\S]*?<\\/svg>\\s*/g, '');\n"
    "    if (/hip thrust/i.test(nm)) out.push({ wk: +wk, d, sec: s.label || s.coreHeader || '', idx, n: (s.items || []).length,\n"
    "      name: nm, keys: Object.keys(it).filter(k => it[k] === DETAIL) });\n"
    "  }));\n"
    "}));\n"
    "console.log(JSON.stringify(out));\n")
def ht(art):
    r = subprocess.run(['node', PROBE_JS, art, DETAIL], capture_output=True, text=True, env=env, cwd=ROOT)
    if r.returncode: die('hip thrust probe failed on %s: %s' % (art, r.stderr[-800:]))
    return json.loads(r.stdout.strip().splitlines()[-1])
hcI, hbI = ht(P), ht(BASE)
new12 = [e for e in hcI if e['name'] == HT]
if any(e['name'] == HT for e in hbI): die('V230 already carries %s on HALF_MANNY' % HT)
rest_c = [dict(e) for e in hcI if e['name'] != HT]
if json.dumps(rest_c, sort_keys=True) != json.dumps(hbI, sort_keys=True):
    die('the other hip thrust items moved between V230 and the candidate: %r vs %r' % (rest_c, hbI))
ok12 = [e for e in new12 if e['d'] == 'tue' and e['sec'] == CIRCUIT and e['idx'] == 3 and e['n'] == 4 and e['keys']]
if [e['wk'] for e in ok12] != list(range(1, 13)) or len(new12) != 12:
    die('PARK (standing ruling 7): %s on the candidate is %r, the ruling says W1–W12 tue, fourth circuit item, %s' % (HT, new12, DETAIL))
dkey = sorted(set(k for e in ok12 for k in e['keys']))
print('FIG  E1 %s: 12 items, W1–W12 tue, %s index 3 of 4, field %s == %r on all 12; V230 carries 0'
      % (HT, CIRCUIT, '/'.join(dkey), DETAIL))

# ── 1. each era gate on the candidate WITHOUT the row, and on the V230 baseline ──────────
pre, preb = {}, {}
for k in GATES:
    (pre[k], preb[k]) = run_many([(F[k], P, BASE), (F[k], BASE, None)])
WANT = {}
for k in GATES:
    print('PRE  %-4s on V230 base: %s' % (k, sstr(preb[k][1])))
    if not preb[k][1] or preb[k][1][1] != 0: die('%s on the V230 baseline is not green before the edit\n%s' % (k, preb[k][0][-2000:]))
    WANT[k] = preb[k][1]

o, s = pre['g193']
if s is not None or 'no OPEN_UNRULED_BY_VERSION row for V231' not in o:
    die('g193 without the row did not crash on the named missing row (summary %r)\n%s' % (s, o[-1500:]))
print('PRE  g193 on candidate, no row: CRASH (no OPEN_UNRULED_BY_VERSION row for V231), no summary; its figure is read on the probe mirror below')

o, s = pre['g200']
fl = re.findall(r'^  FAIL (\w+) ', o, re.M)
if s is None or sorted(fl) != sorted(['B1', 'P2c', 'P2d', 'P6', 'P4', 'P7']):
    die('g200 without the rows: summary %r, fails %r (want B1 P2c P2d P6 P4 P7 only)\n%s' % (s, fl, o[-2000:]))
other = sorted(set(re.findall(r'([A-Z][A-Z0-9_]*_BY_VERSION)', o)) - {'MANNY_DIGEST_BY_VERSION'})
if other: die('g200 names another _BY_VERSION map at 231: %r (report, do not add a fifth edit)' % other)
print('PRE  g200 on candidate, no rows: %s on %s (B1 reads MANNY_DIGEST[231], E1); no other _BY_VERSION map named' % (sstr(s), ' '.join(fl)))

o, s = pre['g219']
f219 = re.findall(r'^FAIL (\w+) ', o, re.M)
R8 = ['R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7', 'R8']
if s is None or not set(R8) <= set(f219) or not set(f219) <= set(R8 + ['F1', 'F2']) or 'NO ERA ROW for ia-version 231' not in o:
    die('g219 without the row: summary %r, fails %r (want R1–R8, F1/F2 at most, on the named missing row)\n%s' % (s, f219, o[-2000:]))
print('PRE  g219 on candidate, no row: %s on %s (NO ERA ROW for ia-version 231)' % (sstr(s), ' '.join(f219)))

# ── 2. the figures, on both trees ────────────────────────────────────────────────────────
def fig200(o):
    return (one(r'^  \S+\s+P2c .*? of (\d+) deload day builds \((\d+) of which offer both blocks\); got (\d+)\.', o, 'g200 P2c'),
            one(r'^  \S+\s+P2d .*?: of the (\d+) both-enter deload pull cards .*? — (\d+) ALSO carry', o, 'g200 P2d'),
            one(r'^  \S+\s+P6 .*?; got (\{[^}]*\})\.', o, 'g200 P6'),
            one(r'^  \S+\s+P4 .*?: of the (\d+) cards where Pull superset B holds the hinge at p1, (\d+) arrive', o, 'g200 P4'),
            one(r'^  \S+\s+P7 .*?: of the (\d+) positive-limb deload pull cards, (\d+) ship', o, 'g200 P7'))
f200c, f200b = fig200(pre['g200'][0]), fig200(preb['g200'][0])
print('FIG  g200 candidate: P2c %r P2d %r P6 %s P4 %r P7 %r' % f200c)
print('FIG  g200 V230 base: P2c %r P2d %r P6 %s P4 %r P7 %r' % f200b)
if f200c != f200b: die('PARK E3 (standing ruling 7): SWAP figure moved: candidate %r, V230 %r' % (f200c, f200b))
if f200c[0][2] != '138' or json.loads(f200c[2]) != {'Kettlebell swing': 138}: die('E3: the figure is not M18\'s 138 / {Kettlebell swing:138}: %r' % (f200c,))

CNT = r'^   sweep [0-9.]+ s on \d+ workers; counters (\{.*\})$'
t219c, t219b = json.loads(one(CNT, pre['g219'][0], 'g219 counters on candidate')), json.loads(one(CNT, preb['g219'][0], 'g219 counters on V230'))
RK = ['dup', 'li', 'tgt', 'ck', 'ckNo', 'bic1', 'c165', 'c166']
print('FIG  g219 candidate: counters ' + json.dumps(t219c, separators=(',', ':')))
print('FIG  g219 V230 base: counters ' + json.dumps(t219b, separators=(',', ':')))
if t219c != t219b: die('PARK E4 (standing ruling 7): g219 counters moved: candidate %r, V230 %r' % (t219c, t219b))
if [t219c[x] for x in RK] != [0, 0, 0, 4770, 891, 412, 0, 0]: die('E4: R1–R8 are not M18\'s 0,0,0,4770,891,412,0,0: %r' % ([t219c[x] for x in RK],))
f1l = re.findall(r'^FAIL F1 .*$', pre['g219'][0], re.M)
f1got = (f1l[0][:240] if len(f1l) == 1 else '(unreadable: %d F1 lines)' % len(f1l)) if 'F1' in f219 else '(F1 passed without the row)'
print('FIG  g219 candidate F1 card without the row: ' + f1got)

# g193: a scratch probe mirror (the draft rows plus one console.log after debtTotal), on both trees
MIR = SCR + '/mirror/tests'
os.makedirs(MIR + '/gates', exist_ok=True)
lp = MIR + '/measure'
if not os.path.islink(lp): os.symlink(ROOT + '/tests/measure', lp)
DRAFT = {m: m + '[231] = ' + (("'" + DIG_231 + "'") if k == 'harness' else (m + '[230]')) + ';   // DRAFT' for k, m in EDITS}
draft = with_rows(DRAFT)
open(MIR + '/harness.js', 'w', encoding='utf-8').write(draft['harness'])
probe = draft['g193'].replace(PROBE_ANCHOR, PROBE_ANCHOR +
        "console.log('PROBE g193 open-unruled set ' + JSON.stringify(dupByName) + ' main ' + JSON.stringify(mainDupByName) + "
        "' unregistered ' + unregTotal + ' debt ' + debtTotal + ' days ' + days);\n", 1)
pp = MIR + '/gates/g193_probe.js'
open(pp, 'w', encoding='utf-8').write(probe)
(pc, pb) = run_many([(pp, P, BASE), (pp, BASE, None)])
def fig193(o, s, tree):
    if s != WANT['g193']: die('g193 probe on %s: summary %r, want %r\n%s' % (tree, s, WANT['g193'], o[-2000:]))
    if 'SHRANK' in o: die('PARK E2 (standing ruling 7): g193 debt register SHRANK on ' + tree)
    return one(r'^PROBE g193 open-unruled set (.*)$', o, 'g193 probe on ' + tree)
f193c, f193b = fig193(*pc, 'candidate'), fig193(*pb, 'V230 base')
print('FIG  g193 candidate: ' + f193c)
print('FIG  g193 V230 base: ' + f193b)
if f193c != f193b: die('PARK E2 (standing ruling 7): the open-unruled set moved: candidate %r, V230 %r' % (f193c, f193b))
pm = re.match(r'(\{.*\}) main (\{.*\}) unregistered (\d+) debt (\d+) days (\d+)$', f193c)
if not pm: die('cannot parse the g193 probe line %r' % f193c)

# ── 3. the rows ──────────────────────────────────────────────────────────────────────────
RUL3 = ('V231 (D195 P-HIPEXT Amendment 2, D196 P-BWFALLBACK with Amendment 1, D197 P-FILTERLAST with Amendment 1)')
WHY = (RUL3 + ': ruled UNMOVED, reference to [230], keyed to the three V231 rulings, none of which moves this figure '
       '(tests/measure/v231_rulings/v231_reruling_d195a2_d196a1_d197a1.md, superseding A1–A4 of '
       'tests/measure/v231_rulings/v231_ruling_d196_d195a1_d197.md, whose D196 and D197 surgery and D195-B stand); measure M18 '
       '(tests/measure/v231_rulings/measure_gate_candidate_m18.md) printed it equal to [230] on the V231 candidate: %s; '
       'printed equal on the V231 candidate (ia-version 231, sha ' + cs[:12] + ') and on the V230 baseline (ia-version 230, '
       'sha ' + bs[:12] + ') by builder with this gate before this row: %s')
ROWS = {
 'MANNY_DIGEST_BY_VERSION':
   "MANNY_DIGEST_BY_VERSION[231] = '" + DIG_231 + "';   // " + RUL3 + ': the ruled digest move, a LITERAL (D94-t), not a '
   'reference: D195 Amendment 2 moves HALF_MANNY by ruling (tests/measure/v231_rulings/v231_reruling_d195a2_d196a1_d197a1.md, '
   '"HALF_MANNY digests (fixture seed 76308; standing ruling 5)": "ABx = ABn = PREx = ALLx  2d35e8f743680cfa  universe 86  '
   '← ERA ROW 231"), printed by coach from the surgery copy ALLx (the whole V231 change as re-ruled) before the build '
   '(standing ruling 5); its row D195-A-a keys this row with the counterfactual conjuncts B alone 0ac7da6b1691a8e1 and '
   'A without B f5ed630033ebe3db; the 12 Tuesdays W1–W12 gain `' + HT + ' ' + DETAIL + '` as the fourth `' + CIRCUIT +
   '` item, nothing else moves; B alone, D196 alone and D197 alone each leave it 0ac7da6b1691a8e1 (the ruling\'s "B alone, '
   'W5 alone, FL alone  0ac7da6b1691a8e1  unmoved"); ' + DIG_231 + ' printed by builder on the V231 candidate (ia-version '
   '231, sha ' + cs[:12] + ') with the harness fixture, self-stable, against ' + DIG_230 + ' on the V230 baseline (sha ' +
   bs[:12] + '), before this row: the --grid diff is %d day lines, W1–W12 TUE, each the V230 line with %s appended to %s, '
   'and the item\'s %s reads %s on all 12' % (len(diffs), HT, CIRCUIT, '/'.join(dkey), DETAIL),
 'OPEN_UNRULED_BY_VERSION':
   'OPEN_UNRULED_BY_VERSION[231] = OPEN_UNRULED_BY_VERSION[230];   // ' + WHY % (
     'OPEN_UNRULED 53/53',
     'open-unruled set %s on both trees, %s unregistered, %s in the debt register over %s day-builds, no class shrank, '
     'PASS %d FAIL %d on both; the Kettlebell swing 0 carries' % (pm.group(1), pm.group(3), pm.group(4), pm.group(5), *WANT['g193'])),
 'SWAP_BY_VERSION':
   'SWAP_BY_VERSION[231] = SWAP_BY_VERSION[230];   // ' + WHY % (
     'P2c 138, P6 {Kettlebell swing:138}',
     'P2c %s of %s deload day builds (%s offer both blocks), P2d %s of %s, P6 census %s, P4 %s of %s, P7 %s of %s on both '
     'trees; the p1 population 138 carries' % (f200c[0][2], f200c[0][0], f200c[0][1], f200c[1][1], f200c[1][0], f200c[2],
                                              f200c[3][1], f200c[3][0], f200c[4][1], f200c[4][0])),
 'ERA':
   'ERA[231] = ERA[230];   // ' + WHY % (
     'R1–R8 = 0,0,0,4770,891,412,0,0',
     'R1 dup %d, R2 li %d, R3 tgt %d, R4 ck %d, R5 ckNo %d, R6 bic1 %d, R7 c165 %d, R8 c166 %d on both trees (counters over '
     '%d configs, %d crashed), and F1 Pec deck 3×12–15 @ RPE 6–7 and F2 no twin pass under the row on both; the [230] row '
     'carries' % tuple([t219c[x] for x in RK] + [t219c['n'], t219c['crash']])),
}
new = with_rows(ROWS)
for k, m in EDITS: print('ROW  %s: %s' % (F[k].split('/')[-1], ROWS[m][:150] + ' ...'))

# ── 4. a scratch mirror tree carrying exactly the bytes to be written, on both trees ─────
open(MIR + '/harness.js', 'w', encoding='utf-8').write(new['harness'])
for k in GATES: open(MIR + '/gates/' + F[k].split('/')[-1], 'w', encoding='utf-8').write(new[k])
mh = subprocess.run(['bash', '-c', 'set -eo pipefail; node "%s" "%s"' % (MIR + '/harness.js', P)], capture_output=True, text=True, env=env)
if mh.returncode or hc.splitlines()[:3] != mh.stdout.splitlines()[:3]: die('the mirror harness does not boot as the real one: ' + mh.stdout + mh.stderr)
mt = subprocess.run(['node', '-e', 'const H=require(%s);console.log(H.MANNY_DIGEST_BY_VERSION[231]+" "+H.MANNY_DIGEST_BY_VERSION[230])'
                     % json.dumps(MIR + '/harness.js')], capture_output=True, text=True, env=env)
if mt.stdout.strip() != DIG_231 + ' ' + DIG_230: die('mirror harness table reads %r' % mt.stdout)
print('MIRROR harness boots as the real one; MANNY_DIGEST_BY_VERSION[231] %s, [230] %s' % tuple(mt.stdout.split()))
for k in GATES:
    mp = MIR + '/gates/' + F[k].split('/')[-1]
    (oc, sc), (ob, sb) = run_many([(mp, P, BASE), (mp, BASE, None)])
    print('MIRROR %-4s with the rows: candidate %s | V230 %s' % (k, sstr(sc), sstr(sb)))
    if sc != WANT[k]: die('PARK (standing ruling 7): mirror %s on the candidate %r, want %r\n%s' % (k, sc, WANT[k], oc[-3000:]))
    if sb != WANT[k]: die('mirror %s on V230 %r, want %r\n%s' % (k, sb, WANT[k], ob[-3000:]))

# ── 5. write once ────────────────────────────────────────────────────────────────────────
for k in F:
    if new[k] == txt[k]: die(k + ' unchanged')
for k in F:
    open(F[k], 'w', encoding='utf-8').write(new[k])
    r = subprocess.run(['node', '--check', F[k]], capture_output=True, text=True)
    if r.returncode: die('node --check failed on ' + F[k] + ': ' + r.stderr)
    print('WROTE ' + F[k] + ' (node --check ok)')

# ── 6. after the write ───────────────────────────────────────────────────────────────────
hb2 = harness(P)
print('POST harness boot on the candidate: ' + ' | '.join(hb2.splitlines()[:3]))
bad = []
for k in GATES:
    (oc, sc), (ob, sb) = run_many([(F[k], P, BASE), (F[k], BASE, None)])
    print('POST %-4s on candidate (V230 as argv[3]): %s' % (k, sstr(sc)))
    print('POST %-4s on V230 as the candidate:     %s' % (k, sstr(sb)))
    for l in re.findall(r'^\s*FAIL \S.*$', oc + ob, re.M)[:6]: print('       ' + l[:220])
    if sc != WANT[k] or sb != WANT[k]: bad.append(k)
    d = [l for l in zip(ob.splitlines(), preb[k][0].splitlines()) if l[0] != l[1]]
    print('POST %-4s V230 output vs before the write: %d lines vs %d, %d differing%s'
          % (k, len(ob.splitlines()), len(preb[k][0].splitlines()), len(d), ('; first: %r' % (d[0],))[:300] if d else ''))
for g in G231:
    (o, s), = run_many([(g, P, BASE)])
    print('POST %s on candidate (V230 as argv[3]): %s' % (g.split('/')[-1], sstr(s)))
    for l in re.findall(r'^.*\bFAIL\b.*$', o, re.M):
        if not re.match(r'^PASS \d+ FAIL \d+\s*$', l): print('       ' + l[:260])
    if not s or s[1]: bad.append(g.split('/')[-1])
if bad: die('written, but not green after the write: %r (standing ruling 7: report, nothing committed)' % bad)
print('OK: four [231] era rows written (E1 literal %s; E2–E4 = [230])' % DIG_231)
