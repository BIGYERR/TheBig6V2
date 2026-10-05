#!/usr/bin/env python3
# V232 ERA RUN E1 (builder slice 4a, test files only; index.html is not edited): six reference era rows in four files,
# each written on the line after its [231] row.
# Precedent and form: tests/edits/v231_e1_era_harness_g193_g200_g219.py (refusals; every figure printed on both trees
# before anything is written; nothing is written if a figure differs; each row's comment cites its ruling).
# Ruling (standing ruling 4: each row is keyed to the ruling it defends; standing ruling 5: HALF_MANNY moves only by a
# ruling that printed the digest first):
#   D199–D206 P-RUNWHEEL, tests/measure/v232_rulings/v232_ruling_d199_d206.md, header "HALF_MANNY digest printed this
#   session: `weeks 14 | startDate null | seed 76308 | digest 2d35e8f743680cfa`", and "What does not change, on every
#   config": "`buildProgram`, `progDigest` (HALF_MANNY stays `2d35e8f743680cfa`)" ... "The "after grid" is the log form;
#   no week grid moves."; Mario's calls in tests/measure/v232_rulings/v232_session_calls.md item 7 ("Build named by
#   Mario: V232."). V232 changes only log-form markup, the wheel machinery and one CSS rule (slices
#   tests/edits/v232_s1_wheel_machinery.py, v232_s2_run_forms.py, v232_s3_width_bump.py).
#   Why: tests/measure/v232_rulings/gatekeeper_dryrun.md (31 gates red on a V231 stamped 232, every one a version table
#   with no [232] row; standing ruling 2).
#   E1a tests/harness.js                     MANNY_DIGEST_BY_VERSION[232]            = MANNY_DIGEST_BY_VERSION[231]
#   E1b tests/harness.js                     MANNY_DELOAD_OFF_DIGEST_BY_VERSION[232] = MANNY_DELOAD_OFF_DIGEST_BY_VERSION[231]
#   E1c tests/harness.js                     MANNY_CORE_OFF_DIGEST_BY_VERSION[232]   = MANNY_CORE_OFF_DIGEST_BY_VERSION[231]
#   E2  tests/gates/g193_samecard.js         OPEN_UNRULED_BY_VERSION[232]            = OPEN_UNRULED_BY_VERSION[231]
#   E3  tests/gates/g200_pull_arbitration.js SWAP_BY_VERSION[232]                    = SWAP_BY_VERSION[231]
#   E4  tests/gates/g219_samecard_draws.js   ERA[232]                                = ERA[231]
#   g197b's and g199's tables are slice 4b; this script does not touch them.
# Order: refuse unless index.html is the V232 candidate (ia-version 232, shasum 03b5924d809d) and the baseline is V231
# (ia-version 231, shasum d7c42961ba83), the four files are clean against HEAD and carry no [232] token, the ruling and
# the session calls carry the text the comments quote, and each table has a reader beyond its declaration and rows
# (standing ruling 3); assert every anchor count==1. Then print, on both trees:
#   E1a-c the three HALF_MANNY digests, LIVE: the harness fixture (shipped), g199's B2 method (__DELOAD_OFF=true) and
#         g200_core_tier's F1a method (the one core clause line removed, cloned fixture); each built twice;
#   E2-E4 the three gates' own figures, read from the outputs builder produced before this script, under SCR/out:
#         base_<g>.txt  = `bash -c 'set -eo pipefail; node tests/gates/<g>.js <base_v231>'` (repo gate, its [231] row)
#         cand_<g>.txt  = the same gate from a scratch mirror of tests/ carrying only the bare `[232] = [231]` row, run
#                         against index.html (the candidate cannot be measured by the repo gate before the row exists:
#                         g193 throws at its row lookup)
#         probe193_<t>.txt = g193 from that mirror plus one console.log of the open-unruled set after debtTotal
#                         (the V231 E1 probe), on both trees.
# A figure that differs between the trees, or from the [231] value, parks its row (standing ruling 7): nothing is written.
import sys, os, re, subprocess, hashlib, json

ROOT = '/Users/CanasBangin/Desktop/TheBig6V2'
P = ROOT + '/index.html'
SCRATCH = '/private/tmp/claude-501/-Users-CanasBangin-Desktop-TheBig6V2/1eef1ef9-e437-4c3d-b4fd-0893934e3a1e/scratchpad'
SCR = SCRATCH + '/builder4a'
BASE = SCRATCH + '/base_v231.html'
OUT = SCR + '/out'
CAND_SHA = '03b5924d809d'          # shasum (sha1), first 12
BASE_SHA = 'd7c42961ba83'
RULING = ROOT + '/tests/measure/v232_rulings/v232_ruling_d199_d206.md'
CALLS = ROOT + '/tests/measure/v232_rulings/v232_session_calls.md'
HARNESS = ROOT + '/tests/harness.js'
F = {'harness': HARNESS,
     'g193': ROOT + '/tests/gates/g193_samecard.js',
     'g200': ROOT + '/tests/gates/g200_pull_arbitration.js',
     'g219': ROOT + '/tests/gates/g219_samecard_draws.js'}
GATEFILE = {'g193': 'g193_samecard', 'g200': 'g200_pull_arbitration', 'g219': 'g219_samecard_draws'}
EDITS = [('harness', 'MANNY_DIGEST_BY_VERSION'), ('harness', 'MANNY_DELOAD_OFF_DIGEST_BY_VERSION'),
         ('harness', 'MANNY_CORE_OFF_DIGEST_BY_VERSION'), ('g193', 'OPEN_UNRULED_BY_VERSION'),
         ('g200', 'SWAP_BY_VERSION'), ('g219', 'ERA')]
DIG = '2d35e8f743680cfa'           # MANNY_DIGEST_BY_VERSION[231], the ruling's printed digest
DIG_OFF = '145c60296526a949'       # MANNY_DELOAD_OFF_DIGEST_BY_VERSION[231]
DIG_CORE = '5770a4b1c4e2404d'      # MANNY_CORE_OFF_DIGEST_BY_VERSION[231]


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


src_b = open(P, 'rb').read()
src = src_b.decode('utf-8')
base_b = open(BASE, 'rb').read()
txt = {k: open(v, encoding='utf-8').read() for k, v in F.items()}

# ── 0. refusals ─────────────────────────────────────────────────────────────────────────
if src.count('<meta name="ia-version" content=') != 1: die('index.html: not exactly one ia-version meta')
if src.count('<meta name="ia-version" content="232">') != 1: die('index.html does not read ia-version 232')
if base_b.decode('utf-8').count('<meta name="ia-version" content="231">') != 1: die('baseline does not read ia-version 231')
cs, bs = hashlib.sha1(src_b).hexdigest(), hashlib.sha1(base_b).hexdigest()
if not cs.startswith(CAND_SHA): die('index.html is not the V232 candidate (shasum %s)' % cs)
if not bs.startswith(BASE_SHA): die('baseline is not V231 (shasum %s)' % bs)
print('TREES candidate ia-version 232 shasum %s | V231 baseline ia-version 231 shasum %s' % (cs[:12], bs[:12]))
r = subprocess.run(['git', 'diff', '--quiet', 'HEAD', '--'] + list(F.values()), cwd=ROOT)
if r.returncode != 0: die('one of the four target files differs from HEAD')
for k, t in txt.items():
    if '[232]' in t: die(F[k] + ' already carries a [232] token')

rul = open(RULING, encoding='utf-8').read()
calls = open(CALLS, encoding='utf-8').read()
Q_HDR = 'HALF_MANNY digest printed this session: `weeks 14 | startDate null | seed 76308 | digest 2d35e8f743680cfa`'
Q_DNC = '**What does not change, on every config:**'
Q1 = '`buildProgram`, `progDigest` (HALF_MANNY stays `2d35e8f743680cfa`)'
Q2 = 'The "after grid" is the log form; no week grid moves.'
for q in (Q_HDR, Q_DNC, Q1, Q2):
    if rul.count(q) != 1: die('the ruling does not carry %r exactly once (%d)' % (q, rul.count(q)))
i_dnc = rul.index(Q_DNC)
para = rul[i_dnc:rul.index('\n', i_dnc)]
if Q1 not in para or Q2 not in para: die('the quoted text is not in the "What does not change" paragraph')
if calls.count('Build named by Mario: V232.') != 1: die('session calls item 7 does not name the build V232')
print('RULING and session calls carry every line the comments quote')

# standing ruling 3: each table is read beyond its declaration and its rows (a dead pin is wired, never re-pointed)
gate_srcs = {}
for fn in sorted(os.listdir(ROOT + '/tests/gates')):
    if fn.endswith('.js'): gate_srcs[fn] = open(ROOT + '/tests/gates/' + fn, encoding='utf-8').read()
for k, m in EDITS:
    t = txt[k]
    tok = re.compile(r'(?<![A-Za-z0-9_])' + re.escape(m) + r'(?![A-Za-z0-9_])')
    lines = [l for l in t.split('\n') if tok.search(l)]
    decl = [l for l in lines if re.match(r'\s*(const|var|let)\s+' + re.escape(m) + r'\s*=', l)]
    rows = [l for l in lines if re.match(re.escape(m) + r'\[\d+\]\s*=', l)]
    readers = [l for l in lines if l not in decl and l not in rows]
    ext = sorted(fn for fn, s in gate_srcs.items() if fn != os.path.basename(F[k]) and tok.search(s))
    print('SR3  %-36s grep -c %d  (declaration %d, rows %d, other lines %d, other gate files %d)'
          % (m, len(lines), len(decl), len(rows), len(readers), len(ext)))
    if len(decl) != 1: die('%s: declaration count %d' % (m, len(decl)))
    if len(lines) <= len(decl): die('%s: grep -c %d is not above the declaration count' % (m, len(lines)))
    if not readers and not ext: die('%s: no reader beyond its declaration and rows (standing ruling 3)' % m)

# anchors: the [231] row starts exactly one line in its file
for k, m in EDITS:
    a = '\n' + m + '[231] = '
    n = txt[k].count(a)
    print('ANCHOR %s %s[231] row count %d' % (os.path.basename(F[k]), m, n))
    if n != 1: die('anchor %r count %d in %s' % (a.strip(), n, F[k]))

# ── 1. E1a-c: the three HALF_MANNY digests, live, on both trees ────────────────────────────
os.makedirs(SCR + '/tmp', exist_ok=True)
env = dict(os.environ, TMPDIR=SCR + '/tmp')
PROBE_JS = SCR + '/e1_digest_probe.js'
open(PROBE_JS, 'w', encoding='utf-8').write(r"""
const path=require('path'),fs=require('fs');
const H=require(%s);
const ART=process.argv[2], OUTD=process.argv[3];
const cl=o=>JSON.parse(JSON.stringify(o));
const IP=H.load(ART);
const p=IP.buildProgram(H.fixtures.HALF_MANNY);
const d1=H.progDigest(p), d1b=H.progDigest(IP.buildProgram(H.fixtures.HALF_MANNY));
IP.eval("globalThis.__DELOAD_OFF=true;");
const o1=H.progDigest(IP.buildProgram(H.fixtures.HALF_MANNY)), o1b=H.progDigest(IP.buildProgram(H.fixtures.HALF_MANNY));
IP.eval("globalThis.__DELOAD_OFF=false;");
const RAW=fs.readFileSync(ART,'utf8'); const CLAUSE="  if(_auxFamily(name)==='core') return 0;\n";
const CN=RAW.split(CLAUSE).length-1; const MP=path.join(OUTD,'cf_'+path.basename(ART)); fs.writeFileSync(MP,RAW.replace(CLAUSE,''));
const MO=H.load(MP);
const c1=H.progDigest(MO.buildProgram(cl(H.fixtures.HALF_MANNY))), c1b=H.progDigest(MO.buildProgram(cl(H.fixtures.HALF_MANNY)));
console.log(JSON.stringify({version:IP.version,weeks:Object.keys(p.weeks||{}).length,startDate:p.startDate,seed:p.seed,
  shipped:d1,shippedStable:d1===d1b,deloadOff:o1,deloadOffStable:o1===o1b,clauseCount:CN,coreOff:c1,coreOffStable:c1===c1b}));
""" % json.dumps(HARNESS))


def digests(art):
    r = subprocess.run(['bash', '-c', 'set -eo pipefail; node "%s" "%s" "%s"' % (PROBE_JS, art, SCR + '/tmp')],
                       capture_output=True, text=True, env=env, cwd=ROOT)
    if r.returncode: die('digest probe failed on %s: %s' % (art, r.stdout[-800:] + r.stderr[-800:]))
    return json.loads(r.stdout.strip().split('\n')[-1])


dc, db = digests(P), digests(BASE)
for tree, d in (('candidate', dc), ('V231 base', db)):
    print('FIG  E1 %-9s weeks %d | startDate %s | seed %d | digest %s (self-stable %s) | __DELOAD_OFF %s (self-stable %s) '
          '| core clause count %d, core-off %s (self-stable %s)'
          % (tree, d['weeks'], d['startDate'], d['seed'], d['shipped'], d['shippedStable'], d['deloadOff'],
             d['deloadOffStable'], d['clauseCount'], d['coreOff'], d['coreOffStable']))
    if not (d['shippedStable'] and d['deloadOffStable'] and d['coreOffStable']):
        die('%s is not self-stable on an arm; nothing is compared' % tree)
    if d['clauseCount'] != 1: die('%s: core clause count %d, the F1a counterfactual is not constructible' % (tree, d['clauseCount']))
    if (d['weeks'], d['startDate'], d['seed']) != (14, None, 76308): die('%s: fixture header moved' % tree)
if dc['shipped'] != DIG or db['shipped'] != DIG:
    die('PARK E1a (standing ruling 7): HALF_MANNY candidate %s, V231 %s, the ruling says it stays %s' % (dc['shipped'], db['shipped'], DIG))
if dc['deloadOff'] != DIG_OFF or db['deloadOff'] != DIG_OFF:
    die('PARK E1b (standing ruling 7): __DELOAD_OFF candidate %s, V231 %s, [231] reads %s' % (dc['deloadOff'], db['deloadOff'], DIG_OFF))
if dc['coreOff'] != DIG_CORE or db['coreOff'] != DIG_CORE:
    die('PARK E1c (standing ruling 7): core-off candidate %s, V231 %s, [231] reads %s' % (dc['coreOff'], db['coreOff'], DIG_CORE))

# ── 2. E2-E4: the gates' own figures, both trees ──────────────────────────────────────────
def rd(name):
    p = OUT + '/' + name
    if not os.path.exists(p): die('missing gate output ' + p)
    return open(p, encoding='utf-8').read()


go = {k: (rd('cand_%s.txt' % g), rd('base_%s.txt' % g)) for k, g in GATEFILE.items()}
WANT = {'g193': (53, 0), 'g200': (18, 0), 'g219': (15, 0)}
for k, (oc, ob) in go.items():
    sc, sb = summ(oc), summ(ob)
    print('RUN  %-22s candidate %s | V231 base %s' % (GATEFILE[k], sc, sb))
    if sc != WANT[k] or sb != WANT[k]: die('PARK %s (standing ruling 7): summary candidate %r, V231 %r, want %r' % (k, sc, sb, WANT[k]))
if 'V232 row' not in go['g200'][0] or 'V231 row' not in go['g200'][1]: die('g200 outputs are not keyed V232 / V231')
if 'ia-version 232 era row 232' not in go['g219'][0] or 'ia-version 231 era row 231' not in go['g219'][1]:
    die('g219 outputs are not keyed V232 / V231')

# E2 g193
pc, pb = rd('probe193_cand.txt'), rd('probe193_base.txt')
if summ(pc) != WANT['g193'] or summ(pb) != WANT['g193']: die('g193 probe summaries %r %r' % (summ(pc), summ(pb)))
f193c = one(r'^PROBE g193 open-unruled set (.*)$', pc, 'g193 probe on candidate')
f193b = one(r'^PROBE g193 open-unruled set (.*)$', pb, 'g193 probe on V231')
print('FIG  g193 candidate: ' + f193c)
print('FIG  g193 V231 base: ' + f193b)
if f193c != f193b: die('PARK E2 (standing ruling 7): the open-unruled set moved: candidate %r, V231 %r' % (f193c, f193b))
if f193c != '{} main {} unregistered 0 debt 0 days 59832': die('E2: not the [231] figure ({} / 0 / 0 / 59832): %r' % f193c)
for o in go['g193'] + (pc, pb):
    if 'SHRANK' in o: die('PARK E2 (standing ruling 7): g193 debt register SHRANK')
    one(r'^  swept (864) builds / 59832 day-builds$', o, 'g193 swept line')
if go['g193'][0] != go['g193'][1]: die('g193 outputs differ between the trees')
print('FIG  g193 swept 864 builds / 59832 day-builds, no class shrank, output byte-identical on both trees')

# E3 g200
def fig200(o):
    return (one(r'^  \S+\s+P2c .*? of (\d+) deload day builds \((\d+) of which offer both blocks\); got (\d+)\.', o, 'g200 P2c'),
            one(r'^  \S+\s+P2d .*?: of the (\d+) both-enter deload pull cards .*? — (\d+) ALSO carry', o, 'g200 P2d'),
            one(r'^  \S+\s+P6 .*?; got (\{[^}]*\})\.', o, 'g200 P6'),
            one(r'^  \S+\s+P4 .*?: of the (\d+) cards where Pull superset B holds the hinge at p1, (\d+) arrive', o, 'g200 P4'),
            one(r'^  \S+\s+P7 .*?: of the (\d+) positive-limb deload pull cards, (\d+) ship', o, 'g200 P7'))


f200c, f200b = fig200(go['g200'][0]), fig200(go['g200'][1])
print('FIG  g200 candidate: P2c %r P2d %r P6 %s P4 %r P7 %r' % f200c)
print('FIG  g200 V231 base: P2c %r P2d %r P6 %s P4 %r P7 %r' % f200b)
if f200c != f200b: die('PARK E3 (standing ruling 7): SWAP figure moved: candidate %r, V231 %r' % (f200c, f200b))
if f200c != (('1120', '210', '138'), ('138', '138'), '{"Kettlebell swing":138}', ('138', '138'), ('138', '138')):
    die('E3: not the [231] figures: %r' % (f200c,))
if go['g200'][0].replace('V232 row', 'V231 row') != go['g200'][1]: die('g200 outputs differ beyond the row label')

# E4 g219
CNT = r'^   sweep [0-9.]+ s on \d+ workers; counters (\{.*\})$'
t219c, t219b = json.loads(one(CNT, go['g219'][0], 'g219 counters on candidate')), json.loads(one(CNT, go['g219'][1], 'g219 counters on V231'))
RK = ['dup', 'li', 'tgt', 'ck', 'ckNo', 'bic1', 'c165', 'c166']
print('FIG  g219 candidate: counters ' + json.dumps(t219c, separators=(',', ':')))
print('FIG  g219 V231 base: counters ' + json.dumps(t219b, separators=(',', ':')))
if t219c != t219b: die('PARK E4 (standing ruling 7): g219 counters moved: candidate %r, V231 %r' % (t219c, t219b))
if [t219c[x] for x in RK] != [0, 0, 0, 4770, 891, 412, 0, 0] or t219c['n'] != 13104 or t219c['crash'] != 0:
    die('E4: R1–R8 are not the [231] 0,0,0,4770,891,412,0,0 over 13104 configs: %r' % (t219c,))
for o in go['g219']:
    one(r'^PASS F1 D164 repro W1 mon Chest volume reads the era row \(Pec deck 3×12–15 @ RPE 6–7\)$', o, 'g219 F1')
    one(r'^PASS F2 D164 repro W1 mon: a name printed twice on the card is absent$', o, 'g219 F2')

# ── 3. the rows ──────────────────────────────────────────────────────────────────────────
TREES = ('on the V232 candidate (ia-version 232, shasum %s) and on the V231 baseline (ia-version 231, shasum %s)'
         % (CAND_SHA, BASE_SHA))
HEAD = ('V232 (D199–D206 P-RUNWHEEL): ruled UNMOVED, reference to [231]; tests/measure/v232_rulings/v232_ruling_d199_d206.md '
        '"What does not change, on every config": "' + Q1 + '" and "' + Q2 + '"; V232 changes only log-form markup, the '
        'wheel machinery and one CSS rule (Mario\'s calls, tests/measure/v232_rulings/v232_session_calls.md item 7; slices '
        'tests/edits/v232_s1_wheel_machinery.py, v232_s2_run_forms.py, v232_s3_width_bump.py), and none of them reaches '
        'buildProgram')
MIRROR = ('(the candidate through a scratch mirror of tests/ carrying only this bare reference row, since the repo gate '
          'cannot read the candidate before the row exists)')
ROWS = {
    'MANNY_DIGEST_BY_VERSION':
        HEAD + '; standing ruling 5: the ruling printed `weeks 14 | startDate null | seed 76308 | digest ' + DIG + '` on '
        'the V231 tree before the build and V232 does not move it, so this row is a reference, not a literal; printed '
        'equal ' + TREES + ' by builder with the harness fixture before this row: weeks 14 | startDate null | seed 76308 '
        '| digest ' + DIG + ' on both trees, built twice and self-stable on both',
    'MANNY_DELOAD_OFF_DIGEST_BY_VERSION':
        HEAD + '; same reasoning as MANNY_DIGEST_BY_VERSION[232] (standing ruling 5: a reference, not a literal): with '
        'buildProgram untouched the __DELOAD_OFF arm builds the same fixture through the same engine; printed equal '
        + TREES + ' by builder with g199\'s B2 method (pristine load, globalThis.__DELOAD_OFF=true, the arm built twice '
        'and self-stable) before this row: ' + DIG_OFF + ' on both trees, against the shipped ' + DIG + ' on both, so '
        'B3 stays non-vacuous',
    'MANNY_CORE_OFF_DIGEST_BY_VERSION':
        HEAD + '; same reasoning as MANNY_DIGEST_BY_VERSION[232] (standing ruling 5: a reference, not a literal): the '
        'core-off counterfactual strips the one _compoundTier clause V232 does not touch; printed equal ' + TREES + ' by '
        'builder with g200_core_tier\'s F1a method (the one `_auxFamily(name)===\'core\'` clause line removed, clause '
        'count 1 on both trees, cloned fixture, the arm built twice and self-stable) before this row: ' + DIG_CORE +
        ' on both trees',
    'OPEN_UNRULED_BY_VERSION':
        HEAD + '; printed equal ' + TREES + ' by builder with this gate before this row ' + MIRROR + ', plus one '
        'console.log of the open-unruled set after debtTotal: open-unruled set {} on both trees, 0 unregistered, 0 in '
        'the debt register over 864 builds / 59832 day-builds, no class shrank, PASS 53 FAIL 0 on both, the gate '
        'output byte-identical; the Kettlebell swing 0 carries',
    'SWAP_BY_VERSION':
        HEAD + '; printed equal ' + TREES + ' by builder with this gate before this row ' + MIRROR + ': P2c 138 of '
        '1120 deload day builds (210 offer both blocks), P2d 138 of 138, P6 census {"Kettlebell swing":138}, P4 138 of '
        '138, P7 138 of 138 on both trees, PASS 18 FAIL 0 on both, the outputs differing only in the row label; the p1 '
        'population 138 carries',
    'ERA':
        HEAD + '; printed equal ' + TREES + ' by builder with this gate before this row ' + MIRROR + ': R1 dup 0, R2 '
        'li 0, R3 tgt 0, R4 ck 4770, R5 ckNo 891, R6 bic1 412, R7 c165 0, R8 c166 0 on both trees (counters over 13104 '
        'configs, 0 crashed), and F1 Pec deck 3×12–15 @ RPE 6–7 and F2 no twin pass under the row on both, PASS 15 '
        'FAIL 0 on both; the [231] row carries',
}

new = dict(txt)
for k, m in EDITS:
    row = m + '[232] = ' + m + '[231];   // ' + ROWS[m]
    if chr(92) + 'u' in row: die('a \\u escape was typed into a row')
    if '\n' in row: die('a newline in a row')
    a = '\n' + m + '[231] = '
    if new[k].count(a) != 1: die('anchor %r count %d' % (a.strip(), new[k].count(a)))
    i = new[k].index(a) + 1
    j = new[k].index('\n', i)
    new[k] = new[k][:j + 1] + row + '\n' + new[k][j + 1:]
    print('ROW  %s: %s' % (os.path.basename(F[k]), row[:200]))

for k in F:
    if new[k] != txt[k]:
        open(F[k], 'w', encoding='utf-8').write(new[k])
for k in F:
    r = subprocess.run(['node', '--check', F[k]], capture_output=True, text=True)
    if r.returncode: die('node --check failed on %s: %s' % (F[k], r.stderr[-600:]))
    print('CHECK node --check %s ok' % os.path.basename(F[k]))
print('WROTE 6 rows in 4 files')
