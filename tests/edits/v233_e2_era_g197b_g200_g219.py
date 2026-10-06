#!/usr/bin/env python3
# V233 ERA RUN E2 (builder slice 4b, test files only; index.html is not edited): four reference era rows in three gate
# files, each written on the line after its [232] row.
# Precedent and form: tests/edits/v232_e2_era_g197b_g199.py and this build's tests/edits/v233_e1_era_harness_g193.py
# (slice 4a): refusals; every figure printed on both trees before anything is written; nothing is written for a figure
# that differs; each row's comment cites its ruling (4a's wording).
# Ruling (standing ruling 4: each row is keyed to the ruling it defends):
#   D207–D211 P-BIKEWHEEL, tests/measure/v233_rulings/v233_ruling_d207_d211.md, header "No program output moves in this
#   build: `buildProgram` is untouched, every week grid and digest is identical before and after" ... "The existing pin
#   must still read `2d35e8f743680cfa` on 233."; "What does not change, on every config": "`buildProgram`, `progDigest`";
#   Mario's calls in tests/measure/v233_rulings/v233_session_calls.md item 6 ("Build named by Mario: V233.") and item 13
#   (the era tables take a [233] REFERENCE row to [232]).
#   Why: tests/measure/v233_rulings/gatekeeper_dryrun.md (a V232 stamped 233 is red only for want of a [233] row; every
#   measured value equals [232]: g200_pull 138 {"Kettlebell swing":138}; g219 R4 4770, R5 891, R6 412, others 0;
#   standing ruling 2).
#   E2a tests/gates/g197b_sweep.js           HF_LEAK_BY_VERSION[233] = HF_LEAK_BY_VERSION[232]   (B4i-B4l)
#   E2b tests/gates/g197b_sweep.js           B5C_BY_VERSION[233]     = B5C_BY_VERSION[232]       (B5c)
#   E2c tests/gates/g200_pull_arbitration.js SWAP_BY_VERSION[233]    = SWAP_BY_VERSION[232]      (P2c P2d P4 P6 P7)
#   E2d tests/gates/g219_samecard_draws.js   ERA[233]                = ERA[232]                  (F1 F2 R1-R8)
#   g199's tables are slice 4c (a parallel builder); this script neither reads for writing nor touches
#   tests/gates/g199_deload_arbitration.js.
# Order: refuse unless index.html is the V233 candidate (ia-version 233, shasum 44c37852e835) and the baseline is V232
# (ia-version 232, shasum 03b5924d809d, == 6ee30ea:index.html), the three gate files are clean against HEAD and carry no
# [233] token, harness.js and g193 carry slice 4a's [233] reference rows, the ruling, session calls and dry run carry the
# text the comments quote, and each table has a reader beyond its declaration and rows on comment-stripped source
# (standing ruling 3); assert every anchor count==1. The figures are the gates' own lines, read from the outputs builder
# produced before this script, under SCR/out:
#   base_<g>.txt = `bash -c 'set -eo pipefail; node tests/gates/<g>.js <base_v232>'` (repo gate, its [232] rows)
#   cand_<g>.txt = the same gate from a scratch mirror of tests/ (harness.js as in the repo, so slice 4a's rows, plus only
#                  the bare `[233] = [232]` rows of this slice), run as `node <mirror gate> index.html`
# A figure that differs between the trees, or from the [232] row, parks its row (standing ruling 7): nothing is written.
import sys, os, re, subprocess, hashlib, json

ROOT = '/Users/CanasBangin/Desktop/TheBig6V2'
P = ROOT + '/index.html'
SCRATCH = '/private/tmp/claude-501/-Users-CanasBangin-Desktop-TheBig6V2/b82cbfbd-5831-4ae1-91fa-14396a9a31d5/scratchpad'
SCR = SCRATCH + '/builder4b'
BASE = SCRATCH + '/base_v232.html'
OUT = SCR + '/out'
CAND_SHA = '44c37852e835'          # shasum (sha1), first 12
BASE_SHA = '03b5924d809d'
RULING = ROOT + '/tests/measure/v233_rulings/v233_ruling_d207_d211.md'
CALLS = ROOT + '/tests/measure/v233_rulings/v233_session_calls.md'
DRYRUN = ROOT + '/tests/measure/v233_rulings/gatekeeper_dryrun.md'
SLICE = ROOT + '/tests/edits/v233_s1_bike_wheel.py'
HARNESS = ROOT + '/tests/harness.js'
G193 = ROOT + '/tests/gates/g193_samecard.js'
F = {'g197b': ROOT + '/tests/gates/g197b_sweep.js',
     'g200': ROOT + '/tests/gates/g200_pull_arbitration.js',
     'g219': ROOT + '/tests/gates/g219_samecard_draws.js'}
GATEFILE = {'g197b': 'g197b_sweep', 'g200': 'g200_pull_arbitration', 'g219': 'g219_samecard_draws'}
EDITS = [('g197b', 'HF_LEAK_BY_VERSION'), ('g197b', 'B5C_BY_VERSION'), ('g200', 'SWAP_BY_VERSION'), ('g219', 'ERA')]
WANT = {'g197b': (30, 0), 'g200': (18, 0), 'g219': (15, 0)}   # the [232] rows' own PASS counts


def die(msg):
    print('REFUSED: ' + msg)
    sys.exit(1)


def one(pat, o, what):
    f = re.findall(pat, o, re.M)
    if len(f) != 1: die('cannot read %s (%d matches of %r)' % (what, len(f), pat))
    return f[0]


def summ(o):
    m = re.findall(r'^PASS (\d+) FAIL (\d+)\s*$', o, re.M)
    return tuple(map(int, m[-1])) if m else None


def strip_comments(s):
    out = []
    for l in s.split('\n'):
        if re.match(r'\s*//', l): continue
        out.append(re.sub(r'\s//.*$', '', l))
    return '\n'.join(out)


src_b = open(P, 'rb').read()
src = src_b.decode('utf-8')
base_b = open(BASE, 'rb').read()
txt = {k: open(v, encoding='utf-8').read() for k, v in F.items()}

# ── 0. refusals ─────────────────────────────────────────────────────────────────────────
if src.count('<meta name="ia-version" content=') != 1: die('index.html: not exactly one ia-version meta')
if src.count('<meta name="ia-version" content="233">') != 1: die('index.html does not read ia-version 233')
if base_b.decode('utf-8').count('<meta name="ia-version" content="232">') != 1: die('baseline does not read ia-version 232')
cs, bs = hashlib.sha1(src_b).hexdigest(), hashlib.sha1(base_b).hexdigest()
if not cs.startswith(CAND_SHA): die('index.html is not the V233 candidate (shasum %s)' % cs)
if not bs.startswith(BASE_SHA): die('baseline is not V232 (shasum %s)' % bs)
hb = subprocess.run(['git', 'show', '6ee30ea:index.html'], cwd=ROOT, capture_output=True).stdout
if hashlib.sha1(hb).hexdigest() != bs: die('baseline is not byte-equal to git show 6ee30ea:index.html')
print('TREES candidate ia-version 233 shasum %s | V232 baseline ia-version 232 shasum %s (== 6ee30ea:index.html)' % (cs[:12], bs[:12]))
r = subprocess.run(['git', 'diff', '--quiet', 'HEAD', '--'] + list(F.values()), cwd=ROOT)
if r.returncode != 0: die('one of the three target gate files differs from HEAD')
for k, t in txt.items():
    if '[233]' in t: die(F[k] + ' already carries a [233] token')
if not os.path.exists(SLICE): die('missing slice ' + SLICE)
h = open(HARNESS, encoding='utf-8').read()
for m in ('MANNY_DIGEST_BY_VERSION', 'MANNY_DELOAD_OFF_DIGEST_BY_VERSION', 'MANNY_CORE_OFF_DIGEST_BY_VERSION'):
    if len(re.findall(r'^' + m + r'\[233\] = ' + m + r'\[232\];   // V233 \(D207–D211 P-BIKEWHEEL\)', h, re.M)) != 1:
        die('harness.js does not carry slice 4a\'s %s[233] reference row exactly once' % m)
g193 = open(G193, encoding='utf-8').read()
if len(re.findall(r'^OPEN_UNRULED_BY_VERSION\[233\] = OPEN_UNRULED_BY_VERSION\[232\];   // V233 \(D207–D211 P-BIKEWHEEL\)',
                  g193, re.M)) != 1:
    die('g193 does not carry slice 4a\'s OPEN_UNRULED_BY_VERSION[233] reference row exactly once')
print('SLICE 4a rows present: harness.js x3, g193 x1')

rul = open(RULING, encoding='utf-8').read()
calls = open(CALLS, encoding='utf-8').read()
dry = open(DRYRUN, encoding='utf-8').read()
Q0 = 'No program output moves in this build: `buildProgram` is untouched, every week grid and digest is identical before and after'
Q_PIN = 'The existing pin must still read `2d35e8f743680cfa` on 233.'
Q_NOROW = 'no `MANNY_DIGEST_BY_VERSION` row is added'
Q_DNC = '**What does not change, on every config:**'
Q1 = '`buildProgram`, `progDigest`'
for q in (Q0, Q_PIN, Q_NOROW, Q_DNC):
    if rul.count(q) != 1: die('the ruling does not carry %r exactly once (%d)' % (q, rul.count(q)))
i_dnc = rul.index(Q_DNC)
para = rul[i_dnc:rul.index('\n', i_dnc)]
if not para.startswith(Q_DNC + ' ' + Q1): die('the "What does not change" paragraph does not open with %r' % Q1)
C6 = 'Build named by Mario: V233.'
C6b = 'D211 V233 is the bike wheel plus the shared 9:59:59 clamp only'
C13 = 'The era tables still take a [233] REFERENCE row to [232]'
for q in (C6, C6b, C13):
    if calls.count(q) != 1: die('session calls do not carry %r exactly once (%d)' % (q, calls.count(q)))
if not re.search(r'^6\. .*' + re.escape(C6), calls, re.M): die('session calls item 6 does not name the build V233')
if not re.search(r'^13\. .*' + re.escape(C13), calls, re.M): die('session calls item 13 does not carry the reference-row reading')
for q in ('Tables needing a [233] row (11, all "row per version", each [233] a reference to [232]):',
          'g200_pull 138 {"Kettlebell swing":138}; g219 R4 4770, R5 891, R6 412, others 0.',
          '- g197b_sweep HF_LEAK_BY_VERSION (decl :215, [232] :238; B4i-B4l), B5C_BY_VERSION (decl :241, [232] :255; B5c)',
          '- g200_pull_arbitration SWAP_BY_VERSION (decl :290, [232] :304; P2c P2d P4 P6 P7)',
          '- g219_samecard_draws ERA (decl :133, [232] :153; F1 F2 R1-R8)'):
    if dry.count(q) != 1: die('the dry run does not carry %r exactly once (%d)' % (q, dry.count(q)))
print('RULING, session calls and dry run carry every line the comments quote')

# standing ruling 3: each table is read beyond its declaration and its rows, on comment-stripped source
for k, m in EDITS:
    t = txt[k]
    tok = re.compile(r'(?<![A-Za-z0-9_])' + re.escape(m) + r'(?![A-Za-z0-9_])')
    gc = len([l for l in t.split('\n') if tok.search(l)])
    lines = [l for l in strip_comments(t).split('\n') if tok.search(l)]
    decl = [l for l in lines if re.match(r'\s*(const|var|let)\s+' + re.escape(m) + r'\s*=', l)]
    rows = [l for l in lines if re.match(re.escape(m) + r'\[\d+\]\s*=', l)]
    readers = [l for l in lines if l not in decl and l not in rows and re.search(re.escape(m) + r'\[', l)]
    print('SR3  %-20s grep -c %d  (code lines: declaration %d, rows %d, readers %d: %s)'
          % (m, gc, len(decl), len(rows), len(readers), ' | '.join(l.strip()[:70] for l in readers)))
    if len(decl) != 1: die('%s: declaration count %d' % (m, len(decl)))
    if gc <= len(decl): die('%s: grep -c %d is not above the declaration count' % (m, gc))
    if not readers: die('%s: no reader beyond its declaration and rows (standing ruling 3)' % m)

for k, m in EDITS:
    a = '\n' + m + '[232] = '
    n = txt[k].count(a)
    print('ANCHOR %s %s[232] row count %d' % (os.path.basename(F[k]), m, n))
    if n != 1: die('anchor %r count %d in %s' % (a.strip(), n, F[k]))

# ── 1. the gates' own figures, both trees ─────────────────────────────────────────────────
def rd(name):
    p = OUT + '/' + name
    if not os.path.exists(p): die('missing gate output ' + p)
    return open(p, encoding='utf-8').read()


go = {k: (rd('cand_%s.txt' % g), rd('base_%s.txt' % g)) for k, g in GATEFILE.items()}
for k, (oc, ob) in go.items():
    sc, sb = summ(oc), summ(ob)
    print('RUN  %-22s candidate (mirror) %s | V232 base (repo gate) %s' % (GATEFILE[k], sc, sb))
    if sc != WANT[k] or sb != WANT[k]:
        die('PARK %s (standing ruling 7): summary candidate %r, V232 %r, want %r' % (k, sc, sb, WANT[k]))
    if re.search(r'^REFUSED', oc + ob, re.M): die('%s: a REFUSED line' % k)
if 'V233 row' not in go['g200'][0] or 'V232 row' not in go['g200'][1]: die('g200 outputs are not keyed V233 / V232')
if 'ia-version 233 era row 233' not in go['g219'][0] or 'ia-version 232 era row 232' not in go['g219'][1]:
    die('g219 outputs are not keyed V233 / V232')


# E2a / E2b g197b
def fig197(o):
    return (one(r'^   home_full: (machine \d+  cable \d+  \{.*\})$', o, 'g197b home_full census line'),
            one(r'^   duplicate-name-on-one-card items: (\d+)  \(of which a harvested name: (\d+)\)$', o, 'g197b B5 line'))


f197c, f197b = fig197(go['g197b'][0]), fig197(go['g197b'][1])
print('FIG  g197b candidate: home_full %s | B5 duplicates %s (harvested %s)' % ((f197c[0],) + f197c[1]))
print('FIG  g197b V232 base: home_full %s | B5 duplicates %s (harvested %s)' % ((f197b[0],) + f197b[1]))
if f197c[0] != f197b[0]: die('PARK HF_LEAK (standing ruling 7): figure differs: candidate %r, V232 %r' % (f197c[0], f197b[0]))
if f197c[1] != f197b[1]: die('PARK B5C (standing ruling 7): figure differs: candidate %r, V232 %r' % (f197c[1], f197b[1]))
hm = re.match(r'machine (\d+)  cable (\d+)  (\{.*\})$', f197c[0])
if (hm.group(1), hm.group(2), json.loads(hm.group(3))) != ('0', '0', {}):
    die('PARK HF_LEAK (standing ruling 7): not the [232] 0/0 {}: %r' % f197c[0])
if f197c[1] != ('0', '0'): die('PARK B5C (standing ruling 7): not the [232] 0: %r' % (f197c[1],))
for o in go['g197b']:
    one(r'^ok   B5c same-card duplicates == 0 \(the V23[23] row;', o, 'g197b B5c ok line')


# E2c g200
def fig200(o):
    return (one(r'^  \S+\s+P2c .*? of (\d+) deload day builds \((\d+) of which offer both blocks\); got (\d+)\.', o, 'g200 P2c'),
            one(r'^  \S+\s+P2d .*?: of the (\d+) both-enter deload pull cards .*? — (\d+) ALSO carry', o, 'g200 P2d'),
            one(r'^  \S+\s+P6 .*?; got (\{[^}]*\})\.', o, 'g200 P6'),
            one(r'^  \S+\s+P4 .*?: of the (\d+) cards where Pull superset B holds the hinge at p1, (\d+) arrive', o, 'g200 P4'),
            one(r'^  \S+\s+P7 .*?: of the (\d+) positive-limb deload pull cards, (\d+) ship', o, 'g200 P7'))


f200c, f200b = fig200(go['g200'][0]), fig200(go['g200'][1])
print('FIG  g200 candidate: P2c %r P2d %r P6 %s P4 %r P7 %r' % f200c)
print('FIG  g200 V232 base: P2c %r P2d %r P6 %s P4 %r P7 %r' % f200b)
if f200c != f200b: die('PARK SWAP (standing ruling 7): SWAP figure moved: candidate %r, V232 %r' % (f200c, f200b))
if f200c != (('1120', '210', '138'), ('138', '138'), '{"Kettlebell swing":138}', ('138', '138'), ('138', '138')):
    die('PARK SWAP (standing ruling 7): not the [232] figures: %r' % (f200c,))
g200_label_only = go['g200'][0].replace('V233 row', 'V232 row') == go['g200'][1]
print('FIG  g200 outputs differ only in the row label: %s' % g200_label_only)

# E2d g219
CNT = r'^   sweep [0-9.]+ s on \d+ workers; counters (\{.*\})$'
t219c = json.loads(one(CNT, go['g219'][0], 'g219 counters on candidate'))
t219b = json.loads(one(CNT, go['g219'][1], 'g219 counters on V232'))
RK = ['dup', 'li', 'tgt', 'ck', 'ckNo', 'bic1', 'c165', 'c166']
print('FIG  g219 candidate: counters ' + json.dumps(t219c, separators=(',', ':')))
print('FIG  g219 V232 base: counters ' + json.dumps(t219b, separators=(',', ':')))
if t219c != t219b: die('PARK ERA (standing ruling 7): g219 counters moved: candidate %r, V232 %r' % (t219c, t219b))
if [t219c[x] for x in RK] != [0, 0, 0, 4770, 891, 412, 0, 0] or t219c['n'] != 13104 or t219c['crash'] != 0:
    die('PARK ERA (standing ruling 7): R1–R8 are not the [232] 0,0,0,4770,891,412,0,0 over 13104 configs: %r' % (t219c,))
for o in go['g219']:
    one(r'^PASS F1 D164 repro W1 mon Chest volume reads the era row \(Pec deck 3×12–15 @ RPE 6–7\)$', o, 'g219 F1')
    one(r'^PASS F2 D164 repro W1 mon: a name printed twice on the card is absent$', o, 'g219 F2')

# ── 2. the rows ──────────────────────────────────────────────────────────────────────────
TREES = ('on the V233 candidate (ia-version 233, shasum %s) and on the V232 baseline (ia-version 232, shasum %s)'
         % (CAND_SHA, BASE_SHA))
HEAD = ('V233 (D207–D211 P-BIKEWHEEL): ruled UNMOVED, reference to [232]; tests/measure/v233_rulings/v233_ruling_d207_d211.md '
        '"What does not change, on every config": "' + Q1 + '" and the header "' + Q0 + '" and "' + Q_PIN + '"; V233 is the '
        'bike wheel plus the shared 9:59:59 clamp only (Mario\'s calls, tests/measure/v233_rulings/v233_session_calls.md '
        'item 6, D211 and "' + C6 + '"; slice tests/edits/v233_s1_bike_wheel.py); the ruling\'s "' + Q_NOROW + '" means no '
        'NEW digest value, the era tables taking a [233] REFERENCE row to [232] (session calls item 13; '
        'tests/measure/v233_rulings/gatekeeper_dryrun.md, standing ruling 2)')
MIRROR = ('(the candidate through a scratch mirror of tests/ carrying slice 4a\'s harness rows and only the bare [233] '
          'reference rows of this slice, since the repo gate cannot read the candidate before the row exists; the baseline '
          'through the repo gate)')
PRE = HEAD + '; printed equal ' + TREES + ' by builder with this gate before this row ' + MIRROR + ': '
S = {k: 'PASS %d FAIL %d on both' % WANT[k] for k in WANT}
ROWS = {
    'HF_LEAK_BY_VERSION':
        PRE + 'home_full machine %s, cable %s, survivors %s on both trees, %s; the [232] 0/0 carries'
        % (hm.group(1), hm.group(2), json.dumps(json.loads(hm.group(3)), separators=(',', ':')), S['g197b']),
    'B5C_BY_VERSION':
        PRE + 'same-card duplicates %s (of which a harvested name: %s) on both trees, %s; the [232] 0 carries'
        % (f197c[1] + (S['g197b'],)),
    'SWAP_BY_VERSION':
        PRE + 'P2c %s of %s deload day builds (%s offer both blocks), P2d %s of %s, P6 census %s, P4 %s of %s, P7 %s of %s '
        'on both trees, %s%s; the p1 population 138 carries'
        % (f200c[0][2], f200c[0][0], f200c[0][1], f200c[1][1], f200c[1][0], f200c[2], f200c[3][1], f200c[3][0],
           f200c[4][1], f200c[4][0], S['g200'], ', the outputs differing only in the row label' if g200_label_only else ''),
    'ERA':
        PRE + 'R1 dup %d, R2 li %d, R3 tgt %d, R4 ck %d, R5 ckNo %d, R6 bic1 %d, R7 c165 %d, R8 c166 %d on both trees '
        '(counters over %d configs, %d crashed), and F1 Pec deck 3×12–15 @ RPE 6–7 and F2 no twin pass under the row on '
        'both, %s; the [232] row carries'
        % (tuple(t219c[x] for x in RK) + (t219c['n'], t219c['crash'], S['g219'])),
}

new = dict(txt)
for k, m in EDITS:
    row = m + '[233] = ' + m + '[232];   // ' + ROWS[m]
    if chr(92) + 'u' in row: die('a \\u escape was typed into a row')
    if '\n' in row: die('a newline in a row')
    a = '\n' + m + '[232] = '
    if new[k].count(a) != 1: die('anchor %r count %d' % (a.strip(), new[k].count(a)))
    i = new[k].index(a) + 1
    j = new[k].index('\n', i)
    new[k] = new[k][:j + 1] + row + '\n' + new[k][j + 1:]
    print('ROW  %s: %s' % (os.path.basename(F[k]), row[:160]))

for k in F:
    if new[k] != txt[k]:
        open(F[k], 'w', encoding='utf-8').write(new[k])
for k in F:
    r = subprocess.run(['node', '--check', F[k]], capture_output=True, text=True)
    if r.returncode: die('node --check failed on %s: %s' % (F[k], r.stderr[-600:]))
    print('CHECK node --check %s ok' % os.path.basename(F[k]))
print('WROTE 4 rows in 3 files')
