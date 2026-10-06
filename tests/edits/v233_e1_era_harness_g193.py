#!/usr/bin/env python3
# V233 ERA RUN E1 (builder slice 4a, test files only; index.html is not edited): four reference era rows in two files,
# each written on the line after its [232] row.
# Precedent and form: tests/edits/v232_e1_era_harness_g193_g200_g219.py (refusals; every figure printed on both trees
# before anything is written; nothing is written if a figure differs; each row's comment cites its ruling).
# Ruling (standing ruling 4: each row is keyed to the ruling it defends; standing ruling 5: HALF_MANNY moves only by a
# ruling that printed the digest first):
#   D207–D211 P-BIKEWHEEL, tests/measure/v233_rulings/v233_ruling_d207_d211.md, header "HALF_MANNY digest printed this
#   session from the 232 tree: `weeks 14 | startDate null | seed 76308 | digest 2d35e8f743680cfa`" ... "No program
#   output moves in this build: `buildProgram` is untouched, every week grid and digest is identical before and after"
#   ... "The existing pin must still read `2d35e8f743680cfa` on 233."; "What does not change, on every config":
#   "`buildProgram`, `progDigest`"; Mario's calls in tests/measure/v233_rulings/v233_session_calls.md item 6 ("Build
#   named by Mario: V233.") and item 13 (the ruling's "no `MANNY_DIGEST_BY_VERSION` row is added" means no NEW digest
#   value; the era tables still take a [233] REFERENCE row to [232]).
#   Why: tests/measure/v233_rulings/gatekeeper_dryrun.md (a V232 stamped 233 is red only for want of a [233] row in 11
#   tables; every measured value equals the [232] row; standing ruling 2).
#   E1a tests/harness.js             MANNY_DIGEST_BY_VERSION[233]            = MANNY_DIGEST_BY_VERSION[232]
#   E1b tests/harness.js             MANNY_DELOAD_OFF_DIGEST_BY_VERSION[233] = MANNY_DELOAD_OFF_DIGEST_BY_VERSION[232]
#   E1c tests/harness.js             MANNY_CORE_OFF_DIGEST_BY_VERSION[233]   = MANNY_CORE_OFF_DIGEST_BY_VERSION[232]
#   E1d tests/gates/g193_samecard.js OPEN_UNRULED_BY_VERSION[233]            = OPEN_UNRULED_BY_VERSION[232]
#   The other seven tables of the dry run (g197b, g199 x3, g200_pull, g219, ...) are other slices; this script does not
#   touch them.
# Order: refuse unless index.html is the V233 candidate (ia-version 233, shasum 44c37852e835) and the baseline is V232
# (ia-version 232, shasum 03b5924d809d), the two files are clean against HEAD and carry no [233] token, the ruling and
# the session calls carry the text the comments quote, and each table has a reader beyond its declaration and rows on
# comment-stripped source (standing ruling 3); assert every anchor count==1. Then print, on both trees:
#   E1a-c the three HALF_MANNY digests, LIVE: the harness fixture (shipped), g199's B2 method (__DELOAD_OFF=true) and
#         g200_core_tier's F1a method (the one core clause line removed, cloned fixture); each built twice; and each
#         equal to the harness's own [232] row;
#   E1d   g193's own figures, read from the outputs builder produced before this script, under SCR/out:
#         base_g193_samecard.txt = `bash -c 'set -eo pipefail; node tests/gates/g193_samecard.js <base_v232>'`
#         cand_g193_samecard.txt = the same gate from a scratch mirror of tests/ carrying only the bare `[233] = [232]`
#                                  rows, run against index.html (the repo gate throws at its row lookup on 233)
#         probe193_<t>.txt       = g193 from a second mirror plus one console.log of the open-unruled set after
#                                  debtTotal (the V231/V232 E1 probe), on both trees.
# A figure that differs between the trees, or from the [232] value, parks its row (standing ruling 7): nothing is written.
import sys, os, re, subprocess, hashlib, json

ROOT = '/Users/CanasBangin/Desktop/TheBig6V2'
P = ROOT + '/index.html'
SCRATCH = '/private/tmp/claude-501/-Users-CanasBangin-Desktop-TheBig6V2/b82cbfbd-5831-4ae1-91fa-14396a9a31d5/scratchpad'
SCR = SCRATCH + '/builder4a'
BASE = SCRATCH + '/base_v232.html'
OUT = SCR + '/out'
CAND_SHA = '44c37852e835'          # shasum (sha1), first 12
BASE_SHA = '03b5924d809d'
RULING = ROOT + '/tests/measure/v233_rulings/v233_ruling_d207_d211.md'
CALLS = ROOT + '/tests/measure/v233_rulings/v233_session_calls.md'
DRYRUN = ROOT + '/tests/measure/v233_rulings/gatekeeper_dryrun.md'
SLICE = ROOT + '/tests/edits/v233_s1_bike_wheel.py'
HARNESS = ROOT + '/tests/harness.js'
F = {'harness': HARNESS,
     'g193': ROOT + '/tests/gates/g193_samecard.js'}
EDITS = [('harness', 'MANNY_DIGEST_BY_VERSION'), ('harness', 'MANNY_DELOAD_OFF_DIGEST_BY_VERSION'),
         ('harness', 'MANNY_CORE_OFF_DIGEST_BY_VERSION'), ('g193', 'OPEN_UNRULED_BY_VERSION')]
DIG = '2d35e8f743680cfa'           # the ruling's printed digest; MANNY_DIGEST_BY_VERSION[232]
DIG_OFF = '145c60296526a949'       # MANNY_DELOAD_OFF_DIGEST_BY_VERSION[232]
DIG_CORE = '5770a4b1c4e2404d'      # MANNY_CORE_OFF_DIGEST_BY_VERSION[232]


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
if r.returncode != 0: die('one of the two target files differs from HEAD')
for k, t in txt.items():
    if '[233]' in t: die(F[k] + ' already carries a [233] token')
if not os.path.exists(SLICE): die('missing slice ' + SLICE)

rul = open(RULING, encoding='utf-8').read()
calls = open(CALLS, encoding='utf-8').read()
dry = open(DRYRUN, encoding='utf-8').read()
Q_HDR = 'HALF_MANNY digest printed this session from the 232 tree: `weeks 14 | startDate null | seed 76308 | digest 2d35e8f743680cfa`'
Q0 = 'No program output moves in this build: `buildProgram` is untouched, every week grid and digest is identical before and after'
Q_PIN = 'The existing pin must still read `2d35e8f743680cfa` on 233.'
Q_NOROW = 'no `MANNY_DIGEST_BY_VERSION` row is added'
Q_DNC = '**What does not change, on every config:**'
Q1 = '`buildProgram`, `progDigest`'
for q in (Q_HDR, Q0, Q_PIN, Q_NOROW, Q_DNC):
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
if dry.count('Tables needing a [233] row (11, all "row per version", each [233] a reference to [232]):') != 1:
    die('the dry run does not list the 11 tables')
print('RULING, session calls and dry run carry every line the comments quote')

# the gates whose methods E1b and E1c reproduce still use them
g199 = open(ROOT + '/tests/gates/g199_deload_arbitration.js', encoding='utf-8').read()
gcore = [fn for fn in os.listdir(ROOT + '/tests/gates') if fn.startswith('g200_core')]
if len(gcore) != 1: die('g200_core gate file count %d' % len(gcore))
gcs = open(ROOT + '/tests/gates/' + gcore[0], encoding='utf-8').read()
if '__DELOAD_OFF' not in g199: die('g199 no longer carries the __DELOAD_OFF arm')
if "_auxFamily(name)==='core'" not in gcs: die('%s no longer names the core clause' % gcore[0])

# standing ruling 3: each table is read beyond its declaration and its rows, on comment-stripped source
gate_srcs = {}
for fn in sorted(os.listdir(ROOT + '/tests/gates')):
    if fn.endswith('.js'): gate_srcs[fn] = strip_comments(open(ROOT + '/tests/gates/' + fn, encoding='utf-8').read())
for k, m in EDITS:
    t = txt[k]
    tok = re.compile(r'(?<![A-Za-z0-9_])' + re.escape(m) + r'(?![A-Za-z0-9_])')
    gc = len([l for l in t.split('\n') if tok.search(l)])
    lines = [l for l in strip_comments(t).split('\n') if tok.search(l)]
    decl = [l for l in lines if re.match(r'\s*(const|var|let)\s+' + re.escape(m) + r'\s*=', l)]
    rows = [l for l in lines if re.match(re.escape(m) + r'\[\d+\]\s*=', l)]
    readers = [l for l in lines if l not in decl and l not in rows]
    ext = sorted(fn for fn, s in gate_srcs.items() if fn != os.path.basename(F[k]) and tok.search(s))
    print('SR3  %-36s grep -c %d  (code lines: declaration %d, rows %d, readers %d; other gate files reading it %d%s)'
          % (m, gc, len(decl), len(rows), len(readers), len(ext), (': ' + ', '.join(ext[:8]) + (' ...' if len(ext) > 8 else '')) if ext else ''))
    if len(decl) != 1: die('%s: declaration count %d' % (m, len(decl)))
    if gc <= len(decl): die('%s: grep -c %d is not above the declaration count' % (m, gc))
    if k == 'harness' and not ext: die('%s: no gate reads it (standing ruling 3)' % m)
    if k != 'harness' and not readers: die('%s: no reader beyond its declaration and rows (standing ruling 3)' % m)

# anchors: the [232] row starts exactly one line in its file
for k, m in EDITS:
    a = '\n' + m + '[232] = '
    n = txt[k].count(a)
    print('ANCHOR %s %s[232] row count %d' % (os.path.basename(F[k]), m, n))
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
  shipped:d1,shippedStable:d1===d1b,deloadOff:o1,deloadOffStable:o1===o1b,clauseCount:CN,coreOff:c1,coreOffStable:c1===c1b,
  row232:[H.MANNY_DIGEST_BY_VERSION[232],H.MANNY_DELOAD_OFF_DIGEST_BY_VERSION[232],H.MANNY_CORE_OFF_DIGEST_BY_VERSION[232]]}));
""" % json.dumps(HARNESS))


def digests(art):
    r = subprocess.run(['bash', '-c', 'set -eo pipefail; node "%s" "%s" "%s"' % (PROBE_JS, art, SCR + '/tmp')],
                       capture_output=True, text=True, env=env, cwd=ROOT)
    if r.returncode: die('digest probe failed on %s: %s' % (art, r.stdout[-800:] + r.stderr[-800:]))
    return json.loads(r.stdout.strip().split('\n')[-1])


dc, db = digests(P), digests(BASE)
for tree, d in (('candidate', dc), ('V232 base', db)):
    print('FIG  E1 %-9s weeks %d | startDate %s | seed %d | digest %s (self-stable %s) | __DELOAD_OFF %s (self-stable %s) '
          '| core clause count %d, core-off %s (self-stable %s)'
          % (tree, d['weeks'], d['startDate'], d['seed'], d['shipped'], d['shippedStable'], d['deloadOff'],
             d['deloadOffStable'], d['clauseCount'], d['coreOff'], d['coreOffStable']))
    if not (d['shippedStable'] and d['deloadOffStable'] and d['coreOffStable']):
        die('%s is not self-stable on an arm; nothing is compared' % tree)
    if d['clauseCount'] != 1: die('%s: core clause count %d, the F1a counterfactual is not constructible' % (tree, d['clauseCount']))
    if (d['weeks'], d['startDate'], d['seed']) != (14, None, 76308): die('%s: fixture header moved' % tree)
print('FIG  harness [232] rows: %s / %s / %s' % tuple(dc['row232']))
if dc['row232'] != [DIG, DIG_OFF, DIG_CORE]: die('the harness [232] rows are not %s / %s / %s' % (DIG, DIG_OFF, DIG_CORE))
if dc['version'] != 233 and str(dc['version']) != '233': die('harness load of the candidate reads version %r' % dc['version'])
if dc['shipped'] != DIG or db['shipped'] != DIG:
    die('PARK E1a (standing ruling 7): HALF_MANNY candidate %s, V232 %s, the ruling says it stays %s' % (dc['shipped'], db['shipped'], DIG))
if dc['deloadOff'] != DIG_OFF or db['deloadOff'] != DIG_OFF:
    die('PARK E1b (standing ruling 7): __DELOAD_OFF candidate %s, V232 %s, [232] reads %s' % (dc['deloadOff'], db['deloadOff'], DIG_OFF))
if dc['coreOff'] != DIG_CORE or db['coreOff'] != DIG_CORE:
    die('PARK E1c (standing ruling 7): core-off candidate %s, V232 %s, [232] reads %s' % (dc['coreOff'], db['coreOff'], DIG_CORE))

# ── 2. E1d: g193's own figures, both trees ────────────────────────────────────────────────
def rd(name):
    p = OUT + '/' + name
    if not os.path.exists(p): die('missing gate output ' + p)
    return open(p, encoding='utf-8').read()


oc, ob = rd('cand_g193_samecard.txt'), rd('base_g193_samecard.txt')
pc, pb = rd('probe193_cand.txt'), rd('probe193_base.txt')
WANT = (53, 0)
for nm, o in (('candidate (mirror)', oc), ('V232 base (repo gate)', ob), ('probe candidate', pc), ('probe V232 base', pb)):
    print('RUN  g193_samecard %-22s %s' % (nm, summ(o)))
    if summ(o) != WANT: die('PARK E1d (standing ruling 7): g193 %s summary %r, want %r' % (nm, summ(o), WANT))
    if 'SHRANK' in o: die('PARK E1d (standing ruling 7): g193 debt register SHRANK on ' + nm)
    one(r'^  swept (864) builds / 59832 day-builds$', o, 'g193 swept line on ' + nm)
f193c = one(r'^PROBE g193 open-unruled set (.*)$', pc, 'g193 probe on candidate')
f193b = one(r'^PROBE g193 open-unruled set (.*)$', pb, 'g193 probe on V232')
print('FIG  g193 candidate: ' + f193c)
print('FIG  g193 V232 base: ' + f193b)
if f193c != f193b: die('PARK E1d (standing ruling 7): the open-unruled set moved: candidate %r, V232 %r' % (f193c, f193b))
if f193c != '{} main {} unregistered 0 debt 0 days 59832': die('E1d: not the [232] figure ({} / 0 / 0 / 59832): %r' % f193c)
if oc != ob: die('g193 outputs differ between the trees')
print('FIG  g193 swept 864 builds / 59832 day-builds, no class shrank, output byte-identical on both trees')

# ── 3. the rows ──────────────────────────────────────────────────────────────────────────
TREES = ('on the V233 candidate (ia-version 233, shasum %s) and on the V232 baseline (ia-version 232, shasum %s)'
         % (CAND_SHA, BASE_SHA))
HEAD = ('V233 (D207–D211 P-BIKEWHEEL): ruled UNMOVED, reference to [232]; tests/measure/v233_rulings/v233_ruling_d207_d211.md '
        '"What does not change, on every config": "' + Q1 + '" and the header "' + Q0 + '" and "' + Q_PIN + '"; V233 is the '
        'bike wheel plus the shared 9:59:59 clamp only (Mario\'s calls, tests/measure/v233_rulings/v233_session_calls.md '
        'item 6, D211 and "' + C6 + '"; slice tests/edits/v233_s1_bike_wheel.py); the ruling\'s "' + Q_NOROW + '" means no '
        'NEW digest value, the era tables taking a [233] REFERENCE row to [232] (session calls item 13; '
        'tests/measure/v233_rulings/gatekeeper_dryrun.md, standing ruling 2)')
MIRROR = ('(the candidate through a scratch mirror of tests/ carrying only this bare reference row, since the repo gate '
          'cannot read the candidate before the row exists)')
ROWS = {
    'MANNY_DIGEST_BY_VERSION':
        HEAD + '; standing ruling 5: the ruling printed `weeks 14 | startDate null | seed 76308 | digest ' + DIG + '` from '
        'the 232 tree before the build and V233 does not move it, so this row is a reference, not a literal; printed '
        'equal ' + TREES + ' by builder with the harness fixture before this row: weeks 14 | startDate null | seed 76308 '
        '| digest ' + DIG + ' on both trees, built twice and self-stable on both',
    'MANNY_DELOAD_OFF_DIGEST_BY_VERSION':
        HEAD + '; same reasoning as MANNY_DIGEST_BY_VERSION[233] (standing ruling 5: a reference, not a literal): with '
        'buildProgram untouched the __DELOAD_OFF arm builds the same fixture through the same engine; printed equal '
        + TREES + ' by builder with g199\'s B2 method (pristine load, globalThis.__DELOAD_OFF=true, the arm built twice '
        'and self-stable) before this row: ' + DIG_OFF + ' on both trees, against the shipped ' + DIG + ' on both, so '
        'B3 stays non-vacuous',
    'MANNY_CORE_OFF_DIGEST_BY_VERSION':
        HEAD + '; same reasoning as MANNY_DIGEST_BY_VERSION[233] (standing ruling 5: a reference, not a literal): the '
        'core-off counterfactual strips the one _compoundTier clause V233 does not touch; printed equal ' + TREES + ' by '
        'builder with g200_core_tier\'s F1a method (the one `_auxFamily(name)===\'core\'` clause line removed, clause '
        'count 1 on both trees, cloned fixture, the arm built twice and self-stable) before this row: ' + DIG_CORE +
        ' on both trees',
    'OPEN_UNRULED_BY_VERSION':
        HEAD + '; printed equal ' + TREES + ' by builder with this gate before this row ' + MIRROR + ', plus one '
        'console.log of the open-unruled set after debtTotal: open-unruled set {} on both trees, 0 unregistered, 0 in '
        'the debt register over 864 builds / 59832 day-builds, no class shrank, PASS 53 FAIL 0 on both, the gate '
        'output byte-identical; the Kettlebell swing 0 carries',
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
print('WROTE 4 rows in 2 files')
