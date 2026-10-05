#!/usr/bin/env python3
# V231 ERA RUN E2: four reference era rows in two gate files, each written on the line after its [230] row.
# Precedent and form: tests/edits/v231_e1_era_harness_g193_g200_g219.py (written this session) and
# tests/edits/v230_s7a_era_g193_g197b_g200.py (refusals; every figure printed on both trees before anything is written;
# nothing is written for a figure that differs; each row's comment cites its ruling).
# Rulings (standing ruling 4: each row is keyed to the ruling it defends):
#   D195 P-HIPEXT Amendment 2, D196 P-BWFALLBACK Amendment 1, D197 P-FILTERLAST Amendment 1:
#     tests/measure/v231_rulings/v231_reruling_d195a2_d196a1_d197a1.md, superseding A1–A4 of
#     tests/measure/v231_rulings/v231_ruling_d196_d195a1_d197.md, whose D196 and D197 surgery and D195-B stand.
#   Measure M18 (tests/measure/v231_rulings/measure_gate_candidate_m18.md) printed, on the V231 candidate, "Equal to
#     [230]: DELOAD_HINGE (g199:193) E1a 12,369, E1b 9,319, E3 44/15,360, G1 1,275; E6 (g199:186) 28; ... HF_LEAK
#     (g197b:236) and B5C (g197b:251) 0".
#   E2a tests/gates/g197b_sweep.js              HF_LEAK_BY_VERSION[231]      = HF_LEAK_BY_VERSION[230]
#   E2b tests/gates/g197b_sweep.js              B5C_BY_VERSION[231]          = B5C_BY_VERSION[230]
#   E2c tests/gates/g199_deload_arbitration.js  E6_BY_VERSION[231]           = E6_BY_VERSION[230]
#   E2d tests/gates/g199_deload_arbitration.js  DELOAD_HINGE_BY_VERSION[231] = DELOAD_HINGE_BY_VERSION[230]
#   g199's other moved rows (DELOAD_ARB, F2, F3, I2, B2) are a coach's to rule: this script does not touch them.
# Order: refuse unless index.html is the V231 candidate (ia-version 231, sha 1249c248a6794d1c) and the baseline is V230
# (ia-version 230, sha 72ac41c8d34034ce), both gate files are clean against HEAD and carry no [231] token, harness.js
# carries E1's MANNY_DIGEST_BY_VERSION[231], M18 and the ruling say what the comments cite; assert every anchor count==1.
# Run each gate on the candidate WITHOUT the rows and on the V230 baseline, and print each table's figure on both trees:
#   g197b the gate's own unconditional prints: the B4 census line "home_full: machine N  cable N  {names}" (HF_LEAK) and
#         the B5 line "duplicate-name-on-one-card items: N  (of which a harvested name: N)" (B5C);
#   g199  the computed "got" figures of E6 (end-to-end) and of every row reading DELOAD_HINGE (E1a, E1b with its tier B
#         exclusion count, E2's __DELOAD_OFF both ends, E3 with its denominator, G1, G2, G5) plus the unconditional
#         "CENSUS deload-hinge" line.
# A figure that differs between the trees parks its row (standing ruling 7): that row is not written and is reported.
# Then a scratch mirror carrying exactly the bytes to be written must reproduce, on both trees, V230's counts for g197b
# and, for g199, V230's counts on V230 and on the candidate the pre-write failing set minus the rows written; then write
# once, node --check, and re-run both gates on both trees.
import sys, os, re, subprocess, hashlib, json

ROOT = '/Users/CanasBangin/Desktop/TheBig6V2'
P = ROOT + '/index.html'
SCR = '/private/tmp/claude-501/-Users-CanasBangin-Desktop-TheBig6V2/adf6a3cd-1bcb-472e-a3ec-2078adfbc3be/scratchpad/builder_e2'
BASE = '/private/tmp/claude-501/-Users-CanasBangin-Desktop-TheBig6V2/adf6a3cd-1bcb-472e-a3ec-2078adfbc3be/scratchpad/base_v230.html'
CAND_SHA = '1249c248a6794d1c'
BASE_SHA = '72ac41c8d34034ce'
RULING = ROOT + '/tests/measure/v231_rulings/v231_reruling_d195a2_d196a1_d197a1.md'
RULING0 = ROOT + '/tests/measure/v231_rulings/v231_ruling_d196_d195a1_d197.md'
M18 = ROOT + '/tests/measure/v231_rulings/measure_gate_candidate_m18.md'
HARNESS = ROOT + '/tests/harness.js'
F = {'g197b': ROOT + '/tests/gates/g197b_sweep.js',
     'g199': ROOT + '/tests/gates/g199_deload_arbitration.js'}
GATES = ['g197b', 'g199']
EDITS = [('g197b', 'HF_LEAK_BY_VERSION'), ('g197b', 'B5C_BY_VERSION'),
         ('g199', 'E6_BY_VERSION'), ('g199', 'DELOAD_HINGE_BY_VERSION')]
# g199 rows each map reads (the gate's own consumers: E6_ROW_FOR at E6; DELOAD_HINGE_ROW_FOR at E1a E1b E2 E3 G1 G2 G5)
READERS = {'E6_BY_VERSION': ['E6'], 'DELOAD_HINGE_BY_VERSION': ['E1a', 'E1b', 'E2', 'E3', 'G1', 'G2', 'G5']}
# g199 rows a coach is ruling (brief): B2 reads MANNY_DELOAD_OFF[231]; C1 C3 C5 D2 I3 read DELOAD_ARB[231]; F2 F3 I2 and
# I2c/I2d are engine moves (M18 (c)/(d)). None of them is this script's to make green.
COACH = {'B2', 'C1', 'C3', 'C5', 'D2', 'I3', 'F2', 'F3', 'I2', 'I2c', 'I2d'}
G197B_PRE_FAILS = ['B4i', 'B4j', 'B4k', 'B4l', 'B5c']

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
if r.returncode != 0: die('one of the two target gate files differs from HEAD')
for k, t in txt.items():
    if '[231]' in t: die(F[k] + ' already carries a [231] token')
h = open(HARNESS, encoding='utf-8').read()
if len(re.findall(r"^MANNY_DIGEST_BY_VERSION\[231\] = '2d35e8f743680cfa';", h, re.M)) != 1:
    die('harness.js does not carry E1\'s MANNY_DIGEST_BY_VERSION[231] row exactly once (g197b B8a and g199 B1 read it)')
for pth in (RULING, RULING0):
    if not os.path.isfile(pth): die('missing ruling file ' + pth)
rul = open(RULING, encoding='utf-8').read()
for pat, what in ((r'D195[^\n]*Amendment 2', 'D195 ... Amendment 2'), (r'D196[^\n]*Amendment 1', 'D196 ... Amendment 1'),
                  (r'D197[^\n]*Amendment 1', 'D197 ... Amendment 1')):
    if not re.search(pat, rul): die('the re-ruling does not name %s on one line' % what)
m18 = open(M18, encoding='utf-8').read()
M18_HINGE = 'DELOAD_HINGE (g199:193) E1a 12,369, E1b 9,319, E3 44/15,360, G1 1,275'
M18_E6 = 'E6 (g199:186) 28'
M18_HFB5 = 'HF_LEAK (g197b:236) and B5C (g197b:251) 0'
for need in ('Equal to [230]: ' + M18_HINGE + '; ' + M18_E6 + ';', M18_HFB5 + ';'):
    if m18.count(need) != 1: die('M18 does not print %r exactly once' % need)
print('RULING names D195 Amendment 2, D196 Amendment 1, D197 Amendment 1; M18 carries every line the comments quote')

def anchor(m): return '\n' + m + '[230] = ' + m + '[229];   // '
for k, m in EDITS:
    n = txt[k].count(anchor(m))
    print('ANCHOR %s %s[230] row count %d' % (F[k].split('/')[-1], m, n))
    if n != 1: die('anchor %r count %d in %s' % (anchor(m).strip(), n, F[k]))

def with_rows(rows):
    new = dict(txt)
    for k, m in EDITS:
        if m not in rows: continue
        a = anchor(m)
        i = new[k].index(a) + 1
        j = new[k].index('\n', i)            # end of the [230] row
        row = rows[m]
        if not row.startswith(m + '[231] = ' + m + '[230];   // '): die('row for %s is not a reference to [230]' % m)
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
def fails197(o): return re.findall(r'^FAIL (B\w+) ', o, re.M)
def fails199(o): return re.findall(r'^  FAIL (\S+) ', o, re.M)
def oks199(o): return re.findall(r'^  ok   (\S+) ', o, re.M)

# ── 1. each gate on the candidate WITHOUT the rows, and on the V230 baseline ─────────────
pre, preb, WANT = {}, {}, {}
for k in GATES:
    (pre[k], preb[k]) = run_many([(F[k], P, BASE), (F[k], BASE, None)])
    print('PRE  %-5s on V230 base: %s' % (k, sstr(preb[k][1])))
    if not preb[k][1] or preb[k][1][1] != 0: die('%s on the V230 baseline is not green before the edit\n%s' % (k, preb[k][0][-2000:]))
    WANT[k] = preb[k][1]

o, s = pre['g197b']
f197 = fails197(o)
if s is None or f197 != G197B_PRE_FAILS or sum(s) != sum(WANT['g197b']):
    die('g197b without the rows: summary %r, fails %r (want %d/%d on %s only)\n%s'
        % (s, f197, WANT['g197b'][0] - 5, 5, ' '.join(G197B_PRE_FAILS), o[-2500:]))
print('PRE  g197b on candidate, no rows: %s on %s (B8a reads MANNY_DIGEST[231], E1, and passes)' % (sstr(s), ' '.join(f197)))

o, s = pre['g199']
f199 = fails199(o)
MINE = set(READERS['E6_BY_VERSION'] + READERS['DELOAD_HINGE_BY_VERSION'])
if s is None: die('g199 on the candidate without the rows: no summary (crash)\n' + o[-2500:])
if not MINE <= set(f199): die('g199 without the rows: %r do not all fail (fails %r)' % (sorted(MINE), f199))
if 'no DELOAD_HINGE_BY_VERSION row for V231' not in o or 'no E6_BY_VERSION row covers this ia-version' not in o:
    die('g199 without the rows does not name the missing E6 / DELOAD_HINGE rows')
outside = sorted(set(f199) - MINE - COACH)
if outside: die('g199 on the candidate fails rows that are neither these four era rows\' readers nor coach-ruled: %r' % outside)
if sum(s) != sum(WANT['g199']): die('g199 candidate row total %d != V230 %d' % (sum(s), sum(WANT['g199'])))
print('PRE  g199  on candidate, no rows: %s on %s' % (sstr(s), ' '.join(f199)))
print('     of which this script\'s readers: %s; coach-ruled: %s' % (' '.join(x for x in f199 if x in MINE), ' '.join(x for x in f199 if x in COACH)))

# ── 2. the figures, on both trees ────────────────────────────────────────────────────────
def fig197(o):
    return (one(r'^   home_full: (machine \d+  cable \d+  \{.*\})$', o, 'g197b home_full census line'),
            one(r'^   duplicate-name-on-one-card items: (\d+)  \(of which a harvested name: (\d+)\)$', o, 'g197b B5 line'))
f197c, f197b = fig197(pre['g197b'][0]), fig197(preb['g197b'][0])
print('FIG  g197b candidate: home_full %s | B5 duplicates %s (harvested %s)' % ((f197c[0],) + f197c[1]))
print('FIG  g197b V230 base: home_full %s | B5 duplicates %s (harvested %s)' % ((f197b[0],) + f197b[1]))

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
    d['CENSUS'] = one(r'^     CENSUS deload-hinge excluding tier B long-run days \(_longRunTier\): (E1b \d+ E3 \d+ G5 \{[^}]*\} '
                      r'\| tier B deload day builds \d+)$', o, 'g199 CENSUS deload-hinge')
    # info only (coach-ruled DELOAD_ARB readers), never part of a row written here
    d['_C5'] = one(OKF + r'C5 __DELOAD_OFF comparator: .*?; got (\d+)', o, 'g199 C5')
    d['_I3'] = one(OKF + r'I3 capRegionalFatigue kills exactly .*?; got (\d+)', o, 'g199 I3')
    return d
f199c, f199b = fig199(pre['g199'][0]), fig199(preb['g199'][0])
for nm, d in (('candidate', f199c), ('V230 base', f199b)):
    print('FIG  g199  %s: E6 %s | E1a %s of %s day builds | E1b %s (tier B excluded %s, cut %s) | E2 %s -> %s | E3 %s of %s | '
          'G1 %s (n=%s, carried %s) | G2 %s | G5 %s | CENSUS %s'
          % (nm, d['E6'], d['E1a'][1], d['E1a'][0], d['E1b'][2], d['E1b'][0], d['E1b'][1], d['E2'][0], d['E2'][1],
             d['E3'][1], d['E3'][0], d['G1'][2], d['G1'][0], d['G1'][1], d['G2'], d['G5'], d['CENSUS']))
    print('     (info, coach-ruled DELOAD_ARB readers) C5 got %s, I3 got %s' % (d['_C5'], d['_I3']))

# per-row figure keys; a row is written only if every key it reads is equal on both trees
FIGS = {
 'HF_LEAK_BY_VERSION': (f197c[0], f197b[0]),
 'B5C_BY_VERSION': (f197c[1], f197b[1]),
 'E6_BY_VERSION': (f199c['E6'], f199b['E6']),
 'DELOAD_HINGE_BY_VERSION': (tuple(f199c[x] for x in ('E1a', 'E1b', 'E2', 'E3', 'G1', 'G2', 'G5', 'CENSUS')),
                             tuple(f199b[x] for x in ('E1a', 'E1b', 'E2', 'E3', 'G1', 'G2', 'G5', 'CENSUS'))),
}
PARKED = [m for m, (c, b) in FIGS.items() if c != b]
for m in PARKED:
    print('PARK %s (standing ruling 7): figure differs between the trees: candidate %r, V230 %r' % (m, FIGS[m][0], FIGS[m][1]))
# the equal figures must be M18's and the [230] row's values
hm = re.match(r'machine (\d+)  cable (\d+)  (\{.*\})$', f197c[0])
if 'HF_LEAK_BY_VERSION' not in PARKED and (hm.group(1), hm.group(2), json.loads(hm.group(3))) != ('0', '0', {}):
    die('HF_LEAK: the both-tree figure is not M18\'s 0/0 {}: %r' % f197c[0])
if 'B5C_BY_VERSION' not in PARKED and f197c[1][0] != '0': die('B5C: the both-tree figure is not M18\'s 0: %r' % (f197c[1],))
if 'E6_BY_VERSION' not in PARKED and f199c['E6'] != '28': die('E6: the both-tree figure is not M18\'s 28: %r' % f199c['E6'])
if 'DELOAD_HINGE_BY_VERSION' not in PARKED:
    d = f199c
    got = (d['E1a'][1], d['E1b'][2], d['E2'], d['E3'][1], d['E3'][0], d['G1'][2], d['G2'], json.loads(d['G5']))
    want = ('12369', '9319', ('12369', '12369'), '44', '15360', '1275', '1275', {'Explosive finisher': 44})
    if got != want: die('DELOAD_HINGE: the both-tree figure is not M18\'s / the [230] row\'s: got %r want %r' % (got, want))
TOWRITE = [(k, m) for k, m in EDITS if m not in PARKED]
if not TOWRITE: die('every row parked; nothing is written')

# ── 3. the rows ──────────────────────────────────────────────────────────────────────────
RUL3 = 'V231 (D195 P-HIPEXT Amendment 2, D196 P-BWFALLBACK with Amendment 1, D197 P-FILTERLAST with Amendment 1)'
WHY = (RUL3 + ': ruled UNMOVED, reference to [230], keyed to the three V231 rulings (standing ruling 4), none of which '
       'moves this figure (tests/measure/v231_rulings/v231_reruling_d195a2_d196a1_d197a1.md, superseding A1–A4 of '
       'tests/measure/v231_rulings/v231_ruling_d196_d195a1_d197.md, whose D196 and D197 surgery and D195-B stand); measure M18 '
       '(tests/measure/v231_rulings/measure_gate_candidate_m18.md) printed it equal to [230] on the V231 candidate: %s; '
       'printed equal on the V231 candidate (ia-version 231, sha ' + cs[:12] + ') and on the V230 baseline (ia-version 230, '
       'sha ' + bs[:12] + ') by builder with this gate before this row: %s')
d = f199c
ROWS = {
 'HF_LEAK_BY_VERSION':
   'HF_LEAK_BY_VERSION[231] = HF_LEAK_BY_VERSION[230];   // ' + WHY % (
     M18_HFB5, 'home_full machine %s, cable %s, survivors %s on both trees; the [230] 0/0 carries'
     % (hm.group(1), hm.group(2), json.dumps(json.loads(hm.group(3)), separators=(',', ':')))),
 'B5C_BY_VERSION':
   'B5C_BY_VERSION[231] = B5C_BY_VERSION[230];   // ' + WHY % (
     M18_HFB5, 'same-card duplicates %s (of which a harvested name: %s) on both trees; the [230] 0 carries' % f197c[1]),
 'E6_BY_VERSION':
   'E6_BY_VERSION[231] = E6_BY_VERSION[230];   // ' + WHY % (
     M18_E6, 'E6 end-to-end %s of %s deload day builds on both trees; the [230] 28 carries' % (d['E6'], d['E1a'][0])),
 'DELOAD_HINGE_BY_VERSION':
   'DELOAD_HINGE_BY_VERSION[231] = DELOAD_HINGE_BY_VERSION[230];   // ' + WHY % (
     M18_HINGE, 'E1a %s across %s deload day builds, E1b %s (tier B long-run days excluded: %s), E2 %s -> %s, E3 %s of %s, '
     'G1 %s, G2 %s, G5 %s on both trees; the [230] row carries'
     % (d['E1a'][1], d['E1a'][0], d['E1b'][2], d['E1b'][0], d['E2'][0], d['E2'][1], d['E3'][1], d['E3'][0], d['G1'][2],
        d['G2'], d['G5'])),
}
ROWS = {m: ROWS[m] for _, m in TOWRITE}
new = with_rows(ROWS)
for k, m in TOWRITE: print('ROW  %s: %s ...' % (F[k].split('/')[-1], ROWS[m][:150]))
MINE_W = set(x for _, m in TOWRITE for x in READERS.get(m, []))
EXP199 = sorted(set(f199) - MINE_W)          # candidate's failing set once the rows land

def check(k, oc, sc, ob, sb, stage):
    if sb != WANT[k]: die('%s %s on V230 %r, want %r\n%s' % (stage, k, sb, WANT[k], ob[-3000:]))
    if k == 'g197b':
        exp = [x for x in G197B_PRE_FAILS if (x.startswith('B4') and 'HF_LEAK_BY_VERSION' in PARKED)
               or (x == 'B5c' and 'B5C_BY_VERSION' in PARKED)]
        fl = fails197(oc)
        if sc is None or fl != exp or sum(sc) != sum(WANT[k]):
            die('PARK (standing ruling 7): %s g197b on the candidate %s on %r, want FAIL %d on %r\n%s'
                % (stage, sstr(sc), fl, len(exp), exp, oc[-3000:]))
        return fl
    fl = fails199(oc)
    if sc is None: die('%s g199 on the candidate: no summary (crash)\n%s' % (stage, oc[-3000:]))
    if sorted(fl) != EXP199: die('PARK (standing ruling 7): %s g199 on the candidate fails %r, want exactly %r\n%s' % (stage, fl, EXP199, oc[-3000:]))
    if not MINE_W <= set(oks199(oc)): die('%s g199: %r not all ok on the candidate' % (stage, sorted(MINE_W)))
    return fl

# ── 4. a scratch mirror carrying exactly the bytes to be written, on both trees ──────────
MIR = SCR + '/mirror/tests'
os.makedirs(MIR + '/gates', exist_ok=True)
for name, tgt in (('harness.js', HARNESS), ('measure', ROOT + '/tests/measure')):
    lp = MIR + '/' + name
    if not os.path.islink(lp): os.symlink(tgt, lp)
for k in GATES:
    mp = MIR + '/gates/' + F[k].split('/')[-1]
    open(mp, 'w', encoding='utf-8').write(new[k])
    (oc, sc), (ob, sb) = run_many([(mp, P, BASE), (mp, BASE, None)])
    fl = check(k, oc, sc, ob, sb, 'mirror')
    print('MIRROR %-5s with the rows: candidate %s%s | V230 %s' % (k, sstr(sc), (' on ' + ' '.join(fl)) if fl else '', sstr(sb)))

# ── 5. write once ────────────────────────────────────────────────────────────────────────
for k in GATES:
    if new[k] == txt[k] and any(kk == k for kk, _ in TOWRITE): die(k + ' unchanged')
for k in GATES:
    if new[k] == txt[k]: continue
    open(F[k], 'w', encoding='utf-8').write(new[k])
    r = subprocess.run(['node', '--check', F[k]], capture_output=True, text=True)
    if r.returncode: die('node --check failed on ' + F[k] + ': ' + r.stderr)
    print('WROTE ' + F[k] + ' (node --check ok)')

# ── 6. after the write ───────────────────────────────────────────────────────────────────
for k in GATES:
    (oc, sc), (ob, sb) = run_many([(F[k], P, BASE), (F[k], BASE, None)])
    print('POST %-5s on candidate (V230 as argv[3]): %s' % (k, sstr(sc)))
    print('POST %-5s on V230 as the candidate:     %s' % (k, sstr(sb)))
    fl = check(k, oc, sc, ob, sb, 'post')
    if fl:
        print('POST %-5s candidate failing rows: %s (coach-ruled: %s; this script\'s: %s)'
              % (k, ' '.join(fl), ' '.join(x for x in fl if x in COACH), ' '.join(x for x in fl if x in MINE) or 'none'))
        for l in re.findall(r'^\s*FAIL \S.*$', oc, re.M): print('       ' + l[:200])
    dd = [l for l in zip(ob.splitlines(), preb[k][0].splitlines()) if l[0] != l[1]]
    print('POST %-5s V230 output vs before the write: %d lines vs %d, %d differing%s'
          % (k, len(ob.splitlines()), len(preb[k][0].splitlines()), len(dd), ('; first: %r' % (dd[0],))[:300] if dd else ''))
if PARKED: print('PARKED rows (not written): ' + ' '.join(PARKED))
print('OK: %d [231] = [230] era rows written: %s' % (len(TOWRITE), ' '.join(m for _, m in TOWRITE)))
