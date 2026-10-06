#!/usr/bin/env python3
# V233 ERA RUN E3 (builder slice 4c, test files only; index.html is not edited): three reference era rows in one gate
# file, each written on the line after its [232] row.
# Precedent and form: tests/edits/v232_e2_era_g197b_g199.py (refusals, the gate's own lines parsed on both trees) and
# this build's tests/edits/v233_e1_era_harness_g193.py (slice 4a: the comment wording reused verbatim); every figure
# printed on both trees before anything is written; nothing is written for a figure that differs; each row's comment
# cites its ruling.
# Ruling (standing ruling 4: each row is keyed to the ruling it defends):
#   D207–D211 P-BIKEWHEEL, tests/measure/v233_rulings/v233_ruling_d207_d211.md, header "No program output moves in this
#   build: `buildProgram` is untouched, every week grid and digest is identical before and after" ... "The existing pin
#   must still read `2d35e8f743680cfa` on 233."; "What does not change, on every config": "`buildProgram`,
#   `progDigest`"; Mario's calls in tests/measure/v233_rulings/v233_session_calls.md item 6 ("Build named by Mario:
#   V233.") and item 13 (the era tables still take a [233] REFERENCE row to [232]).
#   Why: tests/measure/v233_rulings/gatekeeper_dryrun.md (a V232 stamped 233 is red only for want of a [233] row; every
#   measured value beside a missing row equals that table's [232] row; standing ruling 2).
#   E3a tests/gates/g199_deload_arbitration.js  DELOAD_ARB_BY_VERSION[233]   = DELOAD_ARB_BY_VERSION[232]   (C1 C3 C5 D2 I3)
#   E3b tests/gates/g199_deload_arbitration.js  E6_BY_VERSION[233]           = E6_BY_VERSION[232]           (E6)
#   E3c tests/gates/g199_deload_arbitration.js  DELOAD_HINGE_BY_VERSION[233] = DELOAD_HINGE_BY_VERSION[232] (E1a E1b E2 E3 G1 G2 G5)
#   The other tables of the dry run are slices 4a (harness, g193) and 4b (g197b, g200_pull, g219); this script does not
#   touch them.
# Order: refuse unless index.html is the V233 candidate (ia-version 233, shasum 44c37852e835) and the baseline is V232
# (ia-version 232, shasum 03b5924d809d, == git show 6ee30ea:index.html), g199 is clean against HEAD and carries no
# [233] token, harness.js carries slice 4a's three [233] reference rows (g199 B1/B2 read two of them), the ruling, the
# session calls and the dry run carry the quoted text, and each table has a reader beyond its declaration and rows on
# comment-stripped source (standing ruling 3); assert every anchor count==1. The figures are the gate's own lines, read
# from the outputs builder produced before this script, under SCR/out:
#   base_g199_deload_arbitration.txt = `bash -c 'set -eo pipefail; node tests/gates/g199_deload_arbitration.js
#                                       <base_v232> <base_v232>'` (repo gate, its [232] rows)
#   cand_g199_deload_arbitration.txt = the same gate from a scratch mirror of tests/ (harness.js byte-equal to the repo's,
#                                       carrying slice 4a's rows, plus only the bare `[233] = [232]` rows of this file),
#                                       run as `node <mirror gate> index.html <base_v232>`
# A figure that differs between the trees, or from the [232] row, parks its row (standing ruling 7): nothing is written.
import sys, os, re, subprocess, hashlib, json

ROOT = '/Users/CanasBangin/Desktop/TheBig6V2'
P = ROOT + '/index.html'
SCRATCH = '/private/tmp/claude-501/-Users-CanasBangin-Desktop-TheBig6V2/b82cbfbd-5831-4ae1-91fa-14396a9a31d5/scratchpad'
SCR = SCRATCH + '/builder4c'
BASE = SCRATCH + '/base_v232.html'
OUT = SCR + '/out'
MIRROR_H = SCR + '/mirror/tests/harness.js'
CAND_SHA = '44c37852e835'          # shasum (sha1), first 12
BASE_SHA = '03b5924d809d'
RULING = ROOT + '/tests/measure/v233_rulings/v233_ruling_d207_d211.md'
CALLS = ROOT + '/tests/measure/v233_rulings/v233_session_calls.md'
DRYRUN = ROOT + '/tests/measure/v233_rulings/gatekeeper_dryrun.md'
SLICE = ROOT + '/tests/edits/v233_s1_bike_wheel.py'
SLICE4A = ROOT + '/tests/edits/v233_e1_era_harness_g193.py'
HARNESS = ROOT + '/tests/harness.js'
F = {'g199': ROOT + '/tests/gates/g199_deload_arbitration.js'}
GATEFILE = {'g199': 'g199_deload_arbitration'}
EDITS = [('g199', 'DELOAD_ARB_BY_VERSION'), ('g199', 'E6_BY_VERSION'), ('g199', 'DELOAD_HINGE_BY_VERSION')]


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
if r.returncode != 0: die('the target gate file differs from HEAD')
for k, t in txt.items():
    if '[233]' in t: die(F[k] + ' already carries a [233] token')
for s in (SLICE, SLICE4A):
    if not os.path.exists(s): die('missing slice ' + s)
h = open(HARNESS, encoding='utf-8').read()
for m in ('MANNY_DIGEST_BY_VERSION', 'MANNY_DELOAD_OFF_DIGEST_BY_VERSION', 'MANNY_CORE_OFF_DIGEST_BY_VERSION'):
    if len(re.findall(r'^' + m + r'\[233\] = ' + m + r'\[232\];   // V233 \(D207–D211 P-BIKEWHEEL\)', h, re.M)) != 1:
        die('harness.js does not carry slice 4a\'s %s[233] reference row exactly once' % m)
if open(MIRROR_H, 'rb').read() != h.encode('utf-8'): die('the mirror harness.js is not byte-equal to tests/harness.js')

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
D_EQ = "every measured value beside a missing row equals that table's [232] row"
D_199 = ('g199_deload_arbitration DELOAD_ARB_BY_VERSION (decl :58, [232] :181; C1 C3 C5 D2 I3), E6_BY_VERSION (decl :116, '
         '[232] :190; E6), DELOAD_HINGE_BY_VERSION (decl :130, [232] :199; E1a E1b E2 E3 G1 G2 G5)')
for q in (D_EQ, D_199):
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
    readers = [l for l in lines if l not in decl and l not in rows]
    print('SR3  %-24s grep -c %d  (code lines: declaration %d, rows %d, readers %d: %s)'
          % (m, gc, len(decl), len(rows), len(readers), ' | '.join(x.strip()[:70] for x in readers)))
    if len(decl) != 1: die('%s: declaration count %d' % (m, len(decl)))
    if gc <= len(decl): die('%s: grep -c %d is not above the declaration count' % (m, gc))
    if not readers: die('%s: no reader beyond its declaration and rows (standing ruling 3)' % m)

for k, m in EDITS:
    a = '\n' + m + '[232] = '
    n = txt[k].count(a)
    print('ANCHOR %s %s[232] row count %d' % (os.path.basename(F[k]), m, n))
    if n != 1: die('anchor %r count %d in %s' % (a.strip(), n, F[k]))

# ── 1. the gate's own figures, both trees ─────────────────────────────────────────────────
def rd(name):
    p = OUT + '/' + name
    if not os.path.exists(p): die('missing gate output ' + p)
    return open(p, encoding='utf-8').read()


go = {k: (rd('cand_%s.txt' % g), rd('base_%s.txt' % g)) for k, g in GATEFILE.items()}
SUM = {}
for k, (oc, ob) in go.items():
    sc, sb = summ(oc), summ(ob)
    print('RUN  %-24s candidate %s | V232 base %s' % (GATEFILE[k], sc, sb))
    if not sc or not sb or sc[1] != 0 or sb[1] != 0 or sc != sb:
        die('PARK %s (standing ruling 7): summary candidate %r, V232 %r' % (k, sc, sb))
    if re.search(r'^REFUSED', oc + ob, re.M): die('%s: a REFUSED line' % k)
    if oc.count('the V233 ') == 0 or ob.count('the V232 ') == 0: die('%s: the runs did not read the expected rows' % k)
    # the only version-bearing text in the output: the row labels ("the V233 ... row") and the I2c/I2d SKIP lines
    # ("RETIRED at ia-version 233"); everything else must be byte-identical
    if oc.replace('V233', 'V232').replace('ia-version 233', 'ia-version 232') != ob:
        die('%s: outputs differ beyond the version labels' % k)
    SUM[k] = sc
print('RUN  g199 outputs byte-identical on both trees once the version labels (V233, ia-version 233) read 232')

OKF = r'^  (?:ok   |FAIL )'
ROWV = r'(?:NO ROW|\d+)'


def fig199(o):
    d = {}
    d['E6'] = one(OKF + r'E6 END-TO-END \(p1 -> shipped card, folding in capRegionalFatigue and capSessionBudget\): (\d+) deload '
                  r'day builds ship zero posterior where __DELOAD_OFF ships some == ', o, 'g199 E6')
    d['E1a'] = one(OKF + r'E1a posterior items entering the deload == ' + ROWV + r' \(the V\d+ DELOAD_HINGE_BY_VERSION row\) '
                   r'across (\d+) deload day builds \(got (\d+)\)', o, 'g199 E1a')
    d['E1b'] = one(OKF + r'E1b posterior items leaving the deload == ' + ROWV + r' \(the V\d+ DELOAD_HINGE_BY_VERSION row\) '
                   r'\(tier B long-run days excluded by _longRunTier: (\d+) deload day builds\), a cut of (\d+) \([0-9.]+%\); '
                   r'got (\d+)', o, 'g199 E1b')
    d['E2'] = one(OKF + r"E2 __DELOAD_OFF control cuts nothing \(both ends == the row's E1a, " + ROWV + r'\): (\d+) -> (\d+)\. '
                  r'E1b is a real deletion', o, 'g199 E2')
    d['E3'] = one(OKF + r'E3 STAGE-LOCAL \(p1 -> p2\): deload day builds taken from >0 posterior to 0 == ' + ROWV +
                  r' of (\d+) \(the V\d+ DELOAD_HINGE_BY_VERSION row\).*?; got (\d+)\. This is coach', o, 'g199 E3')
    d['G1'] = one(OKF + r'G1 Leg isolation DROPPED by the deload == ' + ROWV + r' .*?DENOMINATOR: deload day builds '
                  r'\(n=(\d+)\), of which (\d+) carried the block in\..*; got (\d+)$', o, 'g199 G1')
    d['G2'] = one(OKF + r'G2 of those dropped Leg isolation blocks, POSTERIOR-HOLDING == .*; got (\d+)$', o, 'g199 G2')
    d['G5'] = one(OKF + r'G5 the killed-day holder census is EXACTLY .*\(got (\{[^}]*\})\)', o, 'g199 G5')
    d['C1'] = one(OKF + r'C1 zero-posterior weeks on the SHIPPED card == ' + ROWV + r' \(the V\d+ DELOAD_ARB_BY_VERSION row\) '
                  r'of (\d+) weeks \(1,728 configs\); got (\d+)', o, 'g199 C1')
    d['C3'] = one(OKF + r'C3 the surviving ' + ROWV + r" \(the V\d+ row\) are all NON-deload weeks \(denominator (\d+)\), "
                  r"so C2's zero holds: got (\d+)", o, 'g199 C3')
    d['C5'] = one(OKF + r'C5 __DELOAD_OFF comparator: .*?; got (\d+)', o, 'g199 C5')
    d['D2'] = one(OKF + r'D2 ' + ROWV + r' deload weeks \(the V\d+ row\) are byte-identical with the deload off, so the '
                  r'sha-method deload count is ' + ROWV + r' \((\d+) differ of (\d+)\)', o, 'g199 D2')
    d['I3'] = one(OKF + r'I3 capRegionalFatigue kills exactly ' + ROWV + r' Leg superset B sections \(the V\d+ row\), out of '
                  r'(\d+) entering the cap \(all day builds, n=(\d+)\); got (\d+)', o, 'g199 I3')
    return d


f199c, f199b = fig199(go['g199'][0]), fig199(go['g199'][1])


def show199(d):
    return ('C1 %s of %s weeks | C3 %s (denominator %s) | C5 %s | D2 identical %d (%s differ of %s) | I3 %s of %s entering '
            '(n=%s) | E1a %s of %s day builds | E1b %s (tier B excluded %s, cut %s) | E2 %s -> %s | E3 %s of %s | '
            'G1 %s (n=%s, carried %s) | G2 %s | G5 %s | E6 %s'
            % (d['C1'][1], d['C1'][0], d['C3'][1], d['C3'][0], d['C5'], int(d['D2'][1]) - int(d['D2'][0]), d['D2'][0],
               d['D2'][1], d['I3'][2], d['I3'][0], d['I3'][1], d['E1a'][1], d['E1a'][0], d['E1b'][2], d['E1b'][0],
               d['E1b'][1], d['E2'][0], d['E2'][1], d['E3'][1], d['E3'][0], d['G1'][2], d['G1'][0], d['G1'][1], d['G2'],
               d['G5'], d['E6']))


print('FIG  g199  candidate: ' + show199(f199c))
print('FIG  g199  V232 base: ' + show199(f199b))

ARB = ('C1', 'C3', 'C5', 'D2', 'I3')
HINGE = ('E1a', 'E1b', 'E2', 'E3', 'G1', 'G2', 'G5')
FIGS = {
    'DELOAD_ARB_BY_VERSION': (tuple(f199c[x] for x in ARB), tuple(f199b[x] for x in ARB)),
    'E6_BY_VERSION': (f199c['E6'], f199b['E6']),
    'DELOAD_HINGE_BY_VERSION': (tuple(f199c[x] for x in HINGE), tuple(f199b[x] for x in HINGE)),
}
for m, (c, b) in FIGS.items():
    if c != b: die('PARK %s (standing ruling 7): figure differs between the trees: candidate %r, V232 %r' % (m, c, b))
# the equal figures must be the [232] rows' values ([232] = [231] for all three; hand-copied from the [231] literals)
d = f199c
got_arb = (d['C1'][1], d['C3'][1], d['C5'], int(d['D2'][1]) - int(d['D2'][0]), d['I3'][2])
if got_arb != ('240', '240', '0', 17, '18'):
    die('PARK DELOAD_ARB (standing ruling 7): not the [232] zeroWeeks 240 / zeroWeeksNonDeload 240 / zeroWeeksDeloadOff 0 / '
        'dlIdentical 17 / capLSBkilled 18: %r' % (got_arb,))
if d['E6'] != '28': die('PARK E6 (standing ruling 7): not the [232] 28: %r' % d['E6'])
got_h = (d['E1a'][1], d['E1b'][2], d['E2'], d['E3'][1], d['G1'][2], d['G2'], json.loads(d['G5']))
if got_h != ('12372', '9322', ('12372', '12372'), '44', '1275', '1275', {'Explosive finisher': 44}):
    die('PARK DELOAD_HINGE (standing ruling 7): not the [232] E1a 12372 / E1b 9322 / E3 44 / G1 1275 / G5 44: %r' % (got_h,))

# ── 2. the rows ──────────────────────────────────────────────────────────────────────────
TREES = ('on the V233 candidate (ia-version 233, shasum %s) and on the V232 baseline (ia-version 232, shasum %s)'
         % (CAND_SHA, BASE_SHA))
HEAD = ('V233 (D207–D211 P-BIKEWHEEL): ruled UNMOVED, reference to [232]; tests/measure/v233_rulings/v233_ruling_d207_d211.md '
        '"What does not change, on every config": "' + Q1 + '" and the header "' + Q0 + '" and "' + Q_PIN + '"; V233 is the '
        'bike wheel plus the shared 9:59:59 clamp only (Mario\'s calls, tests/measure/v233_rulings/v233_session_calls.md '
        'item 6, D211 and "' + C6 + '"; slice tests/edits/v233_s1_bike_wheel.py); the ruling\'s "' + Q_NOROW + '" means no '
        'NEW digest value, the era tables taking a [233] REFERENCE row to [232] (session calls item 13; '
        'tests/measure/v233_rulings/gatekeeper_dryrun.md, standing ruling 2)')
MIRROR = ('(the candidate through a scratch mirror of tests/ carrying slice 4a\'s rows and only the bare [233] reference '
          'rows of this file, the baseline through the repo gate, each run with the V232 baseline as argv[3])')
S199 = 'PASS %d FAIL %d on both' % SUM['g199']
PRE = HEAD + '; printed equal ' + TREES + ' by builder with this gate before this row ' + MIRROR + ': '
ROWS = {
    'DELOAD_ARB_BY_VERSION':
        PRE + 'C1 %s of %s weeks, C3 %s (denominator %s), C5 %s, D2 %d identical (%s differ of %s), I3 %s of %s entering '
        'the cap on both trees, %s; the [232] row (zeroWeeks 240, zeroWeeksNonDeload 240, zeroWeeksDeloadOff 0, '
        'dlIdentical 17, capLSBkilled 18) carries'
        % (d['C1'][1], d['C1'][0], d['C3'][1], d['C3'][0], d['C5'], int(d['D2'][1]) - int(d['D2'][0]), d['D2'][0],
           d['D2'][1], d['I3'][2], d['I3'][0], S199),
    'E6_BY_VERSION':
        PRE + 'E6 end-to-end %s of %s deload day builds on both trees, %s; the [232] 28 carries'
        % (d['E6'], d['E1a'][0], S199),
    'DELOAD_HINGE_BY_VERSION':
        PRE + 'E1a %s across %s deload day builds, E1b %s (tier B long-run days excluded: %s), E2 %s -> %s, E3 %s of %s, '
        'G1 %s, G2 %s, G5 %s on both trees, %s; the [232] row carries'
        % (d['E1a'][1], d['E1a'][0], d['E1b'][2], d['E1b'][0], d['E2'][0], d['E2'][1], d['E3'][1], d['E3'][0],
           d['G1'][2], d['G2'], json.dumps(json.loads(d['G5']), separators=(',', ':')), S199),
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
    print('ROW  %s: %s' % (os.path.basename(F[k]), row[:200]))

for k in F:
    if new[k] != txt[k]:
        open(F[k], 'w', encoding='utf-8').write(new[k])
for k in F:
    r = subprocess.run(['node', '--check', F[k]], capture_output=True, text=True)
    if r.returncode: die('node --check failed on %s: %s' % (F[k], r.stderr[-600:]))
    print('CHECK node --check %s ok' % os.path.basename(F[k]))
print('WROTE 3 rows in 1 file')
