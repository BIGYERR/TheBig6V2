#!/usr/bin/env python3
# V232 ERA RUN E2 (builder slice 4b, test files only; index.html is not edited): five reference era rows in two gate
# files, each written on the line after its [231] row.
# Precedent and form: tests/edits/v231_e2_era_g197b_g199.py and this build's tests/edits/v232_e1_era_harness_g193_g200_g219.py
# (slice 4a, accepted: session call 15): refusals; every figure printed on both trees before anything is written;
# nothing is written for a figure that differs; each row's comment cites its ruling.
# Ruling (standing ruling 4: each row is keyed to the ruling it defends):
#   D199–D206 P-RUNWHEEL, tests/measure/v232_rulings/v232_ruling_d199_d206.md, "What does not change, on every config":
#   "`buildProgram`, `progDigest` (HALF_MANNY stays `2d35e8f743680cfa`)" ... "The "after grid" is the log form; no week
#   grid moves."; Mario's calls in tests/measure/v232_rulings/v232_session_calls.md item 7 ("Build named by Mario: V232.").
#   Why: tests/measure/v232_rulings/gatekeeper_dryrun.md (a V231 stamped 232: g197b B4i-l and B5c, g199 C1 C3 C5 D2 I3,
#   E1a E1b E2 E3 G1 G2 G5 and E6 red only for want of a [232] row; standing ruling 2).
#   E2a tests/gates/g197b_sweep.js              HF_LEAK_BY_VERSION[232]      = HF_LEAK_BY_VERSION[231]
#   E2b tests/gates/g197b_sweep.js              B5C_BY_VERSION[232]          = B5C_BY_VERSION[231]
#   E2c tests/gates/g199_deload_arbitration.js  DELOAD_ARB_BY_VERSION[232]   = DELOAD_ARB_BY_VERSION[231]
#   E2d tests/gates/g199_deload_arbitration.js  DELOAD_HINGE_BY_VERSION[232] = DELOAD_HINGE_BY_VERSION[231]
#   E2e tests/gates/g199_deload_arbitration.js  E6_BY_VERSION[232]           = E6_BY_VERSION[231]
# Order: refuse unless index.html is the V232 candidate (ia-version 232, shasum 03b5924d809d) and the baseline is V231
# (ia-version 231, shasum d7c42961ba83), both gate files are clean against HEAD and carry no [232] token, harness.js
# carries slice 4a's MANNY_DIGEST_BY_VERSION[232] reference (g197b B8a and g199 B1/B2 read it), the ruling carries the
# quoted text, and each table has a reader beyond its declaration and rows (standing ruling 3); assert every anchor
# count==1. The figures are the gates' own lines, read from the outputs builder produced before this script, under SCR/out4b:
#   base_<g>.txt = `bash -c 'set -eo pipefail; node tests/gates/<g>.js <base_v231> <base_v231>'` (repo gate, its [231] rows)
#   cand_<g>.txt = the same gate from a scratch mirror of tests/ (slice 4a's rows plus only the bare `[232] = [231]` rows
#                  for this gate), run as `node <mirror gate> index.html <base_v231>`
# A figure that differs between the trees, or from the [231] row, parks its row (standing ruling 7): nothing is written.
import sys, os, re, subprocess, hashlib, json

ROOT = '/Users/CanasBangin/Desktop/TheBig6V2'
P = ROOT + '/index.html'
SCRATCH = '/private/tmp/claude-501/-Users-CanasBangin-Desktop-TheBig6V2/1eef1ef9-e437-4c3d-b4fd-0893934e3a1e/scratchpad'
SCR = SCRATCH + '/builder4a'
BASE = SCRATCH + '/base_v231.html'
OUT = SCR + '/out4b'
CAND_SHA = '03b5924d809d'          # shasum (sha1), first 12
BASE_SHA = 'd7c42961ba83'
RULING = ROOT + '/tests/measure/v232_rulings/v232_ruling_d199_d206.md'
CALLS = ROOT + '/tests/measure/v232_rulings/v232_session_calls.md'
HARNESS = ROOT + '/tests/harness.js'
F = {'g197b': ROOT + '/tests/gates/g197b_sweep.js',
     'g199': ROOT + '/tests/gates/g199_deload_arbitration.js'}
GATEFILE = {'g197b': 'g197b_sweep', 'g199': 'g199_deload_arbitration'}
EDITS = [('g197b', 'HF_LEAK_BY_VERSION'), ('g197b', 'B5C_BY_VERSION'), ('g199', 'DELOAD_ARB_BY_VERSION'),
         ('g199', 'DELOAD_HINGE_BY_VERSION'), ('g199', 'E6_BY_VERSION')]


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
if r.returncode != 0: die('one of the two target gate files differs from HEAD')
for k, t in txt.items():
    if '[232]' in t: die(F[k] + ' already carries a [232] token')
h = open(HARNESS, encoding='utf-8').read()
for m in ('MANNY_DIGEST_BY_VERSION', 'MANNY_DELOAD_OFF_DIGEST_BY_VERSION'):
    if len(re.findall(r'^' + m + r'\[232\] = ' + m + r'\[231\];   // V232 \(D199–D206 P-RUNWHEEL\)', h, re.M)) != 1:
        die('harness.js does not carry slice 4a\'s %s[232] reference row exactly once' % m)

rul = open(RULING, encoding='utf-8').read()
calls = open(CALLS, encoding='utf-8').read()
Q_DNC = '**What does not change, on every config:**'
Q1 = '`buildProgram`, `progDigest` (HALF_MANNY stays `2d35e8f743680cfa`)'
Q2 = 'The "after grid" is the log form; no week grid moves.'
for q in (Q_DNC, Q1, Q2):
    if rul.count(q) != 1: die('the ruling does not carry %r exactly once (%d)' % (q, rul.count(q)))
i_dnc = rul.index(Q_DNC)
para = rul[i_dnc:rul.index('\n', i_dnc)]
if Q1 not in para or Q2 not in para: die('the quoted text is not in the "What does not change" paragraph')
if calls.count('Build named by Mario: V232.') != 1: die('session calls item 7 does not name the build V232')
print('RULING and session calls carry every line the comments quote')

# standing ruling 3: each table is read beyond its declaration and its rows
for k, m in EDITS:
    t = txt[k]
    tok = re.compile(r'(?<![A-Za-z0-9_])' + re.escape(m) + r'(?![A-Za-z0-9_])')
    lines = [l for l in t.split('\n') if tok.search(l)]
    decl = [l for l in lines if re.match(r'\s*(const|var|let)\s+' + re.escape(m) + r'\s*=', l)]
    rows = [l for l in lines if re.match(re.escape(m) + r'\[\d+\]\s*=', l)]
    readers = [l for l in lines if l not in decl and l not in rows and not l.lstrip().startswith('//')]
    print('SR3  %-24s grep -c %d  (declaration %d, rows %d, reader lines %d)' % (m, len(lines), len(decl), len(rows), len(readers)))
    if len(decl) != 1: die('%s: declaration count %d' % (m, len(decl)))
    if len(lines) <= len(decl): die('%s: grep -c %d is not above the declaration count' % (m, len(lines)))
    if not readers: die('%s: no reader beyond its declaration and rows (standing ruling 3)' % m)

for k, m in EDITS:
    a = '\n' + m + '[231] = '
    n = txt[k].count(a)
    print('ANCHOR %s %s[231] row count %d' % (os.path.basename(F[k]), m, n))
    if n != 1: die('anchor %r count %d in %s' % (a.strip(), n, F[k]))

# ── 1. the gates' own figures, both trees ─────────────────────────────────────────────────
def rd(name):
    p = OUT + '/' + name
    if not os.path.exists(p): die('missing gate output ' + p)
    return open(p, encoding='utf-8').read()


go = {k: (rd('cand_%s.txt' % g), rd('base_%s.txt' % g)) for k, g in GATEFILE.items()}
SUM = {}
for k, (oc, ob) in go.items():
    sc, sb = summ(oc), summ(ob)
    print('RUN  %-24s candidate %s | V231 base %s' % (GATEFILE[k], sc, sb))
    if not sc or not sb or sc[1] != 0 or sb[1] != 0 or sc != sb:
        die('PARK %s (standing ruling 7): summary candidate %r, V231 %r' % (k, sc, sb))
    if re.search(r'^REFUSED', oc + ob, re.M): die('%s: a REFUSED line' % k)
    SUM[k] = sc


def fig197(o):
    return (one(r'^   home_full: (machine \d+  cable \d+  \{.*\})$', o, 'g197b home_full census line'),
            one(r'^   duplicate-name-on-one-card items: (\d+)  \(of which a harvested name: (\d+)\)$', o, 'g197b B5 line'))


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


f197c, f197b = fig197(go['g197b'][0]), fig197(go['g197b'][1])
f199c, f199b = fig199(go['g199'][0]), fig199(go['g199'][1])
print('FIG  g197b candidate: home_full %s | B5 duplicates %s (harvested %s)' % ((f197c[0],) + f197c[1]))
print('FIG  g197b V231 base: home_full %s | B5 duplicates %s (harvested %s)' % ((f197b[0],) + f197b[1]))


def show199(d):
    return ('C1 %s of %s weeks | C3 %s (denominator %s) | C5 %s | D2 identical %d (%s differ of %s) | I3 %s of %s entering '
            '(n=%s) | E1a %s of %s day builds | E1b %s (tier B excluded %s, cut %s) | E2 %s -> %s | E3 %s of %s | '
            'G1 %s (n=%s, carried %s) | G2 %s | G5 %s | E6 %s'
            % (d['C1'][1], d['C1'][0], d['C3'][1], d['C3'][0], d['C5'], int(d['D2'][1]) - int(d['D2'][0]), d['D2'][0],
               d['D2'][1], d['I3'][2], d['I3'][0], d['I3'][1], d['E1a'][1], d['E1a'][0], d['E1b'][2], d['E1b'][0],
               d['E1b'][1], d['E2'][0], d['E2'][1], d['E3'][1], d['E3'][0], d['G1'][2], d['G1'][0], d['G1'][1], d['G2'],
               d['G5'], d['E6']))


print('FIG  g199  candidate: ' + show199(f199c))
print('FIG  g199  V231 base: ' + show199(f199b))

ARB = ('C1', 'C3', 'C5', 'D2', 'I3')
HINGE = ('E1a', 'E1b', 'E2', 'E3', 'G1', 'G2', 'G5')
FIGS = {
    'HF_LEAK_BY_VERSION': (f197c[0], f197b[0]),
    'B5C_BY_VERSION': (f197c[1], f197b[1]),
    'DELOAD_ARB_BY_VERSION': (tuple(f199c[x] for x in ARB), tuple(f199b[x] for x in ARB)),
    'DELOAD_HINGE_BY_VERSION': (tuple(f199c[x] for x in HINGE), tuple(f199b[x] for x in HINGE)),
    'E6_BY_VERSION': (f199c['E6'], f199b['E6']),
}
for m, (c, b) in FIGS.items():
    if c != b: die('PARK %s (standing ruling 7): figure differs between the trees: candidate %r, V231 %r' % (m, c, b))
# the equal figures must be the [231] rows' values
hm = re.match(r'machine (\d+)  cable (\d+)  (\{.*\})$', f197c[0])
if (hm.group(1), hm.group(2), json.loads(hm.group(3))) != ('0', '0', {}):
    die('PARK HF_LEAK (standing ruling 7): not the [231] 0/0 {}: %r' % f197c[0])
if f197c[1] != ('0', '0'): die('PARK B5C (standing ruling 7): not the [231] 0: %r' % (f197c[1],))
d = f199c
got_arb = (d['C1'][1], d['C3'][1], d['C5'], int(d['D2'][1]) - int(d['D2'][0]), d['I3'][2])
if got_arb != ('240', '240', '0', 17, '18'):
    die('PARK DELOAD_ARB (standing ruling 7): not the [231] zeroWeeks 240 / zeroWeeksNonDeload 240 / zeroWeeksDeloadOff 0 / '
        'dlIdentical 17 / capLSBkilled 18: %r' % (got_arb,))
got_h = (d['E1a'][1], d['E1b'][2], d['E2'], d['E3'][1], d['G1'][2], d['G2'], json.loads(d['G5']))
if got_h != ('12372', '9322', ('12372', '12372'), '44', '1275', '1275', {'Explosive finisher': 44}):
    die('PARK DELOAD_HINGE (standing ruling 7): not the [231] E1a 12372 / E1b 9322 / E3 44 / G1 1275 / G5 44: %r' % (got_h,))
if d['E6'] != '28': die('PARK E6 (standing ruling 7): not the [231] 28: %r' % d['E6'])

# ── 2. the rows ──────────────────────────────────────────────────────────────────────────
TREES = ('on the V232 candidate (ia-version 232, shasum %s) and on the V231 baseline (ia-version 231, shasum %s)'
         % (CAND_SHA, BASE_SHA))
HEAD = ('V232 (D199–D206 P-RUNWHEEL): ruled UNMOVED, reference to [231]; tests/measure/v232_rulings/v232_ruling_d199_d206.md '
        '"What does not change, on every config": "' + Q1 + '" and "' + Q2 + '"; V232 changes only log-form markup, the '
        'wheel machinery and one CSS rule (Mario\'s calls, tests/measure/v232_rulings/v232_session_calls.md item 7; slices '
        'tests/edits/v232_s1_wheel_machinery.py, v232_s2_run_forms.py, v232_s3_width_bump.py), and none of them reaches '
        'buildProgram')
MIRROR = ('(the candidate through a scratch mirror of tests/ carrying slice 4a\'s rows and only the bare [232] reference '
          'rows of this file, the baseline through the repo gate, each run with the V231 baseline as argv[3])')
S197 = 'PASS %d FAIL %d on both' % SUM['g197b']
S199 = 'PASS %d FAIL %d on both' % SUM['g199']
PRE = HEAD + '; printed equal ' + TREES + ' by builder with this gate before this row ' + MIRROR + ': '
ROWS = {
    'HF_LEAK_BY_VERSION':
        PRE + 'home_full machine %s, cable %s, survivors %s on both trees, %s; the [231] 0/0 carries'
        % (hm.group(1), hm.group(2), json.dumps(json.loads(hm.group(3)), separators=(',', ':')), S197),
    'B5C_BY_VERSION':
        PRE + 'same-card duplicates %s (of which a harvested name: %s) on both trees, %s; the [231] 0 carries'
        % (f197c[1] + (S197,)),
    'DELOAD_ARB_BY_VERSION':
        PRE + 'C1 %s of %s weeks, C3 %s (denominator %s), C5 %s, D2 %d identical (%s differ of %s), I3 %s of %s entering '
        'the cap on both trees, %s; the [231] row (zeroWeeks 240, zeroWeeksNonDeload 240, zeroWeeksDeloadOff 0, '
        'dlIdentical 17, capLSBkilled 18) carries'
        % (d['C1'][1], d['C1'][0], d['C3'][1], d['C3'][0], d['C5'], int(d['D2'][1]) - int(d['D2'][0]), d['D2'][0],
           d['D2'][1], d['I3'][2], d['I3'][0], S199),
    'DELOAD_HINGE_BY_VERSION':
        PRE + 'E1a %s across %s deload day builds, E1b %s (tier B long-run days excluded: %s), E2 %s -> %s, E3 %s of %s, '
        'G1 %s, G2 %s, G5 %s on both trees, %s; the [231] row carries'
        % (d['E1a'][1], d['E1a'][0], d['E1b'][2], d['E1b'][0], d['E2'][0], d['E2'][1], d['E3'][1], d['E3'][0],
           d['G1'][2], d['G2'], json.dumps(json.loads(d['G5']), separators=(',', ':')), S199),
    'E6_BY_VERSION':
        PRE + 'E6 end-to-end %s of %s deload day builds on both trees, %s; the [231] 28 carries'
        % (d['E6'], d['E1a'][0], S199),
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
print('WROTE 5 rows in 2 files')
