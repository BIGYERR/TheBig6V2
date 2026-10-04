#!/usr/bin/env python3
# V230 slice 7a: four era rows in three gate files, gatekeeper's first V230 run (RED): the gates crash or go red only for
# want of a [230] row. Session call 11 (tests/measure/v230_rulings/v230_session_calls.md): the V229 precedent
# tests/edits/v229_g1a_era_g193_g197b_g200.py, keyed one version up; [230] = [229] by reference, each row written only after
# its figure is printed on the candidate and on V229 and the two are equal. A figure that moves parks its row.
# Rulings (standing ruling 4: each row is keyed to the ruling that leaves its value unmoved):
#   D194 P-INJLENS part 2, tests/measure/v229_rulings/d194_injlens_ruling.md, Amendment 1 R3′: "V230 (D194 part 2) is the
#     lens alone." and "V230 moves two guards and two filter cfgs and nothing else." The four lines sit in
#     applySessionSwaps and applySwapChoice; buildProgram is untouched.
#   Gatekeeper's identity fuzz (session call 11): buildProgram + refreshProgram byte-identical V229 == V230 on 2,160 of
#     2,160 configs.
#   E1 g193_samecard.js          OPEN_UNRULED_BY_VERSION[230] = [229], on the line after its [229] row.
#   E2 g197b_sweep.js            HF_LEAK_BY_VERSION[230]      = [229], on the line after its [229] row.
#   E3 g197b_sweep.js            B5C_BY_VERSION[230]          = [229], on the line after its [229] row.
#   E4 g200_pull_arbitration.js  SWAP_BY_VERSION[230]         = [229], on the line after its [229] row.
# Order: refuse unless index.html is the V230 candidate (ia-version 230, sha 72ac41c8d340), the baseline is V229
# (sha d854af0a91f8), the three gate files are clean against HEAD and carry no [230] token; assert every anchor count==1;
# run each gate on the candidate WITHOUT the row and on the V229 baseline, and print each table's figure on both trees:
#   g193  the open-unruled set (dupByName / mainDupByName, read by a scratch probe mirror: the bytes to be written plus one
#         console.log line after debtTotal; the set is computed before and independently of the register), plus G2a's
#         debt/unregistered counts and no SHRANK note;
#   g197b the gate's own unconditional prints: the B4 census line "home_full: machine N  cable N  {names}" and the B5 line
#         "duplicate-name-on-one-card items: N  (of which a harvested name: N)";
#   g200  the computed figures in the P2c / P2d / P6 / P4 / P7 lines (got N, census, N of N).
# Write nothing unless every figure is equal on both trees and every exact-bytes mirror is green on the candidate at the
# V229 counts (g193 53/0, g197b 30/0, g200_pull 18/0). A figure that differs is class (D): nothing is written and the
# slice parks (standing ruling 7). After the write, each gate runs on the candidate and on the V229 baseline and must be
# green; the baseline's output must be unchanged from before the write.
import sys, os, re, subprocess, hashlib, json

ROOT = '/Users/CanasBangin/Desktop/TheBig6V2'
P = ROOT + '/index.html'
SCR = '/private/tmp/claude-501/-Users-CanasBangin-Desktop-TheBig6V2/1cdb8ea3-6810-4976-acce-c88cc911f698/scratchpad/builder7a'
BASE = '/private/tmp/claude-501/-Users-CanasBangin-Desktop-TheBig6V2/1cdb8ea3-6810-4976-acce-c88cc911f698/scratchpad/base_v229.html'
CAND_SHA256 = '72ac41c8d34034ce66bcb0fcc2cfcdaa0e1f7f2afe802b2cf053370ac5622387'
BASE_SHA256 = 'd854af0a91f88a5d67c60dd458289bc0fff90c835c2f719775707f8548c56a71'
G = {'g193': ROOT + '/tests/gates/g193_samecard.js',
     'g197b': ROOT + '/tests/gates/g197b_sweep.js',
     'g200': ROOT + '/tests/gates/g200_pull_arbitration.js'}
WANT = {'g193': (53, 0), 'g197b': (30, 0), 'g200': (18, 0)}

def die(msg):
    print('REFUSED: ' + msg)
    sys.exit(1)

src_b = open(P, 'rb').read()
src = src_b.decode('utf-8')
base_b = open(BASE, 'rb').read()
txt = {k: open(v, encoding='utf-8').read() for k, v in G.items()}

# ── refusals ─────────────────────────────────────────────────────────────────────────────
if src.count('<meta name="ia-version" content="230">') != 1: die('index.html does not read ia-version 230 exactly once')
if src.count('<meta name="ia-version" content=') != 1: die('more than one ia-version meta')
if hashlib.sha256(src_b).hexdigest() != CAND_SHA256: die('index.html is not the V230 candidate (sha256 %s)' % hashlib.sha256(src_b).hexdigest())
if hashlib.sha256(base_b).hexdigest() != BASE_SHA256: die('baseline is not V229 (sha256 %s)' % hashlib.sha256(base_b).hexdigest())
if base_b.decode('utf-8').count('<meta name="ia-version" content="229">') != 1: die('baseline does not read ia-version 229')
r = subprocess.run(['git', 'diff', '--quiet', 'HEAD', '--'] + list(G.values()), cwd=ROOT)
if r.returncode != 0: die('one of the three gate files differs from HEAD')
for k, t in txt.items():
    if '[230]' in t: die(G[k] + ' already carries a [230] token')

WHY = ('V230 (D194 P-INJLENS part 2, the lens alone): ruled UNMOVED, reference to [229]; D194 '
       '(tests/measure/v229_rulings/d194_injlens_ruling.md) Amendment 1 R3′: "V230 moves two guards and two filter cfgs '
       'and nothing else" (the tap guard and filter cfg in applySwapChoice, the boot guard and filter cfg in '
       'applySessionSwaps, all onto _dayPlanCfg); buildProgram is untouched, and gatekeeper\'s identity fuzz '
       '(tests/measure/v230_rulings/v230_session_calls.md item 11) printed buildProgram + refreshProgram byte-identical '
       'V229 == V230 on 2,160 of 2,160 configs')
PRINTED = ('printed equal on the V230 candidate (ia-version 230, sha 72ac41c8d340) and on the V229 baseline (sha '
           'd854af0a91f8) by builder with this gate before this row')

EDITS = [('g193', 'OPEN_UNRULED_BY_VERSION'), ('g197b', 'HF_LEAK_BY_VERSION'),
         ('g197b', 'B5C_BY_VERSION'), ('g200', 'SWAP_BY_VERSION')]
for k, m in EDITS:
    a = '\n' + m + '[229] = ' + m + '[228];   // '
    n = txt[k].count(a)
    print('ANCHOR %s %s[229] row count %d' % (G[k].split('/')[-1], m, n))
    if n != 1: die('anchor %r count %d in %s' % (a.strip(), n, G[k]))
PROBE_ANCHOR = '\nconst debtTotal = names.filter(n => OPEN_UNRULED[n] !== undefined).reduce((a, n) => a + dupByName[n], 0);\n'
if txt['g193'].count(PROBE_ANCHOR) != 1: die('g193 probe anchor (const debtTotal) count %d' % txt['g193'].count(PROBE_ANCHOR))

def with_rows(carries):
    new = dict(txt)
    for k, m in EDITS:
        a = '\n' + m + '[229] = ' + m + '[228];   // '
        i = new[k].index(a) + 1
        j = new[k].index('\n', i)            # end of the [229] row
        row = m + '[230] = ' + m + '[229];   // ' + WHY + ' (' + PRINTED + ': ' + carries[m] + ')'
        if chr(92) + 'u' in row: die('a \\u escape was typed into a row')
        if '\n' in row: die('a newline in a row')
        new[k] = new[k][:j + 1] + row + '\n' + new[k][j + 1:]
    return new

os.makedirs(SCR + '/tmp', exist_ok=True)
env = dict(os.environ, TMPDIR=SCR + '/tmp')

def run(gate_path, art):
    r = subprocess.run(['bash', '-c', 'set -eo pipefail; node "%s" "%s"' % (gate_path, art)],
                       capture_output=True, text=True, env=env, cwd=ROOT)
    out = r.stdout + r.stderr
    m = re.findall(r'^PASS (\d+) FAIL (\d+)\s*$', out, re.M)
    return out, (tuple(map(int, m[-1])) if m else None)

def one(pat, o, what):
    f = re.findall(pat, o, re.M)
    if len(f) != 1: die('cannot read %s (%d matches of %r)' % (what, len(f), pat))
    return f[0]

# ── 1. each gate on the candidate WITHOUT the row, and on the V229 baseline ──────────────
pre = {k: run(G[k], P) for k in G}
preb = {k: run(G[k], BASE) for k in G}
for k in G:
    print('PRE  %-5s on V229 base: %s' % (k, ('PASS %d FAIL %d' % preb[k][1]) if preb[k][1] else 'NO SUMMARY'))
    if preb[k][1] != WANT[k]: die('%s on the V229 baseline is not %r before the edit' % (k, WANT[k]))

o, s = pre['g193']
if s is not None or 'no OPEN_UNRULED_BY_VERSION row for V230' not in o:
    die('g193 without the row did not crash on the named missing row (summary %r)' % (s,))
print('PRE  g193  on candidate, no row: CRASH (no OPEN_UNRULED_BY_VERSION row for V230), no summary; its figure is read on the probe mirror below')

o, s = pre['g197b']
names = re.findall(r'^FAIL (B\w+) ', o, re.M)
if s != (25, 5) or names != ['B4i', 'B4j', 'B4k', 'B4l', 'B5c']:
    die('g197b without the row: summary %r, fails %r (want 25/5 on B4i B4j B4k B4l B5c only)' % (s, names))
print('PRE  g197b on candidate, no row: PASS %d FAIL %d on %s' % (s + (' '.join(names),)))

o, s = pre['g200']
fl = re.findall(r'^  FAIL (\w+) ', o, re.M)
if s != (13, 5) or fl != ['P2c', 'P2d', 'P6', 'P4', 'P7']:
    die('g200 without the row: summary %r, fails %r (want 13/5 on P2c P2d P6 P4 P7 only)' % (s, fl))
other = sorted(set(re.findall(r'([A-Z][A-Z0-9_]*_BY_VERSION)', o)) - {'MANNY_DIGEST_BY_VERSION'})
if other: die('g200 names another _BY_VERSION map at 230: %r (report, do not add a fifth edit)' % other)
print('PRE  g200  on candidate, no row: PASS %d FAIL %d on %s; no other _BY_VERSION map named' % (s + (' '.join(fl),)))

# ── 2. the figures, on both trees ────────────────────────────────────────────────────────
# g197b: the gate's own unconditional prints (independent of the era row)
def fig197(o):
    return (one(r'^   home_full: (machine \d+  cable \d+  \{.*\})$', o, 'g197b home_full census line'),
            one(r'^   (duplicate-name-on-one-card items: \d+  \(of which a harvested name: \d+\))$', o, 'g197b B5 line'))
f197c, f197b = fig197(pre['g197b'][0]), fig197(preb['g197b'][0])
print('FIG  g197b candidate: home_full %s | %s' % f197c)
print('FIG  g197b V229 base: home_full %s | %s' % f197b)
if f197c[0] != f197b[0]: die('CLASS (D), PARK (standing ruling 7): HF_LEAK figure moved: candidate %r, V229 %r' % (f197c[0], f197b[0]))
if f197c[1] != f197b[1]: die('CLASS (D), PARK (standing ruling 7): B5C figure moved: candidate %r, V229 %r' % (f197c[1], f197b[1]))
hm = re.match(r'machine (\d+)  cable (\d+)  (\{.*\})$', f197c[0])
hf_names = json.loads(hm.group(3))
b5 = re.match(r'duplicate-name-on-one-card items: (\d+)', f197c[1]).group(1)

# g200: the computed figures in the five row-keyed lines (the row-dependent "want" text is not read)
def fig200(o):
    return (one(r'^  \S+\s+P2c .*? of (\d+) deload day builds \((\d+) of which offer both blocks\); got (\d+)\.', o, 'g200 P2c'),
            one(r'^  \S+\s+P2d .*?: of the (\d+) both-enter deload pull cards .*? — (\d+) ALSO carry', o, 'g200 P2d'),
            one(r'^  \S+\s+P6 .*?; got (\{[^}]*\})\.', o, 'g200 P6'),
            one(r'^  \S+\s+P4 .*?: of the (\d+) cards where Pull superset B holds the hinge at p1, (\d+) arrive', o, 'g200 P4'),
            one(r'^  \S+\s+P7 .*?: of the (\d+) positive-limb deload pull cards, (\d+) ship', o, 'g200 P7'))
f200c, f200b = fig200(pre['g200'][0]), fig200(preb['g200'][0])
print('FIG  g200  candidate: P2c %r P2d %r P6 %s P4 %r P7 %r' % f200c)
print('FIG  g200  V229 base: P2c %r P2d %r P6 %s P4 %r P7 %r' % f200b)
if f200c != f200b: die('CLASS (D), PARK (standing ruling 7): SWAP figure moved: candidate %r, V229 %r' % (f200c, f200b))
swap_n, swap_census = f200c[0][2], f200c[2]

# g193: a scratch probe mirror (the bytes to be written plus one console.log after debtTotal), on both trees
MIR = SCR + '/mirror/tests'
os.makedirs(MIR + '/gates', exist_ok=True)
for name, tgt in (('harness.js', ROOT + '/tests/harness.js'), ('measure', ROOT + '/tests/measure')):
    lp = MIR + '/' + name
    if not os.path.islink(lp): os.symlink(tgt, lp)
PRB = SCR + '/probe/tests'
os.makedirs(PRB + '/gates', exist_ok=True)
for name, tgt in (('harness.js', ROOT + '/tests/harness.js'), ('measure', ROOT + '/tests/measure')):
    lp = PRB + '/' + name
    if not os.path.islink(lp): os.symlink(tgt, lp)
draft = with_rows({m: 'DRAFT' for _, m in EDITS})
probe = draft['g193'].replace(PROBE_ANCHOR, PROBE_ANCHOR +
        "console.log('PROBE g193 open-unruled set ' + JSON.stringify(dupByName) + ' main ' + JSON.stringify(mainDupByName) + "
        "' unregistered ' + unregTotal + ' debt ' + debtTotal + ' days ' + days);\n", 1)
pp = PRB + '/gates/g193_samecard.js'
open(pp, 'w', encoding='utf-8').write(probe)
def fig193(o, s, tree):
    if s != WANT['g193']: die('g193 probe on %s: summary %r, want %r\n%s' % (tree, s, WANT['g193'], o[-2000:]))
    if 'SHRANK' in o: die('CLASS (D), PARK (standing ruling 7): g193 debt register SHRANK on ' + tree)
    return one(r'^PROBE g193 open-unruled set (.*)$', o, 'g193 probe on ' + tree)
f193c = fig193(*run(pp, P), 'candidate')
f193b = fig193(*run(pp, BASE), 'V229 base')
print('FIG  g193  candidate: ' + f193c)
print('FIG  g193  V229 base: ' + f193b)
if f193c != f193b: die('CLASS (D), PARK (standing ruling 7): the open-unruled set moved: candidate %r, V229 %r' % (f193c, f193b))
g193set = f193c.split(' main ')[0]

CARRY = {
 'OPEN_UNRULED_BY_VERSION': 'open-unruled set %s on both trees, 0 unregistered, 0 in the debt register, no class shrank; '
                            'the Kettlebell swing 0 carries' % g193set,
 'HF_LEAK_BY_VERSION': 'home_full machine %s, cable %s, survivors %s on both trees; the [229] 0/0 carries'
                       % (hm.group(1), hm.group(2), json.dumps(hf_names, separators=(',', ':'))),
 'B5C_BY_VERSION': 'same-card duplicates %s on both trees; the [229] 0 carries' % b5,
 'SWAP_BY_VERSION': '%s on both trees, census %s; the p1 population 138 carries' % (swap_n, swap_census),
}
new = with_rows(CARRY)
for k, m in EDITS: print('ROW  %s: %s[230] = %s[229]   // ... (%s)' % (G[k].split('/')[-1], m, m, CARRY[m]))

# ── 3. a scratch mirror of each gate carrying exactly the bytes to be written ────────────
for k in G:
    mp = MIR + '/gates/' + G[k].split('/')[-1]
    open(mp, 'w', encoding='utf-8').write(new[k])
    o, s = run(mp, P)
    if s != WANT[k]: die('mirror %s with the row on the candidate: summary %r, want %r\n%s' % (k, s, WANT[k], o[-3000:]))
    print('MIRROR %-5s with the row on the candidate: PASS %d FAIL %d' % ((k,) + s))

# ── 4. write once ────────────────────────────────────────────────────────────────────────
for k in G:
    if new[k] == txt[k]: die(k + ' unchanged')
for k in G:
    open(G[k], 'w', encoding='utf-8').write(new[k])
    r = subprocess.run(['node', '--check', G[k]], capture_output=True, text=True)
    if r.returncode: die('node --check failed on ' + G[k] + ': ' + r.stderr)
    print('WROTE ' + G[k] + ' (node --check ok)')

# ── 5. after the write: each gate on the candidate and on the V229 baseline ─────────────
for k in G:
    o, s = run(G[k], P)
    print('POST %-5s on candidate: %s' % (k, ('PASS %d FAIL %d' % s) if s else 'NO SUMMARY'))
    if s != WANT[k]: die('post-write %s on the candidate: %r, want %r\n%s' % (k, s, WANT[k], o[-2000:]))
    o, s = run(G[k], BASE)
    print('POST %-5s on V229 base: %s' % (k, ('PASS %d FAIL %d' % s) if s else 'NO SUMMARY'))
    if s != WANT[k]: die('post-write %s on the V229 baseline: %r, want %r\n%s' % (k, s, WANT[k], o[-2000:]))
    d = [l for l in zip(o.splitlines(), preb[k][0].splitlines()) if l[0] != l[1]]
    nl = (len(o.splitlines()), len(preb[k][0].splitlines()))
    print('POST %-5s V229 base output vs before the write: %d lines vs %d, %d differing line(s)%s'
          % (k, nl[0], nl[1], len(d), ('; first: %r' % (d[0],)) if d else ''))
print('OK: four [230]=[229] era rows written')
