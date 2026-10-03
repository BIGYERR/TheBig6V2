#!/usr/bin/env python3
# V229 gate slice G1a: four era rows in three gate files, class (A) of gatekeeper's V229 pre-scan (the gates crash or go
# red only for want of a [229] row). Procedure: V228's tests/edits/v228_s4_era_g193_g197b_g200.py, keyed one version up.
# Rulings (standing ruling 4: each row is keyed to the ruling that leaves its value unmoved):
#   D194 P-INJLENS, tests/measure/v229_rulings/d194_injlens_ruling.md, "What deliberately does NOT change":
#     "`buildProgram` and the overlay variant build (already injured inside the engine; the lens does not touch
#     `applyOverlays`)." and "Every uninjured program: lists, cards, toasts byte-identical."
#   D193 P-CAPRPE build half, tests/measure/v228_rulings/d193_caprpe_ruling.md, "What deliberately does not change":
#     "Uninjured builds (filter returns at :8095)"; the clamp and the held test rewrite the detail of capped cards on
#     injured builds only, never a name.
#   E1 g193_samecard.js          OPEN_UNRULED_BY_VERSION[229] = [228], on the line after its [228] row.
#   E2 g197b_sweep.js            HF_LEAK_BY_VERSION[229]      = [228], on the line after its [228] row.
#   E3 g197b_sweep.js            B5C_BY_VERSION[229]          = [228], on the line after its [228] row.
#   E4 g200_pull_arbitration.js  SWAP_BY_VERSION[229]         = [228], on the line after its [228] row.
# Order: refuse unless index.html reads 229 (the V229 candidate) and no [229] token exists in these files; assert every
# anchor count==1; run each gate on the 229 tree WITHOUT the row and read the computed values off the failure lines;
# run a scratch mirror of each gate carrying exactly the bytes to be written; write nothing unless every computed value
# equals its [228] row and every mirror is green at the 228 counts (g193 53/0, g197b 30/0, g200_pull 18/0). A computed
# value that differs from [228] is class (D): nothing is written for that table and the slice parks (standing ruling 7).
# After the write, each gate runs on the V229 tree and on the V228 baseline and must stay green.
import sys, os, re, subprocess, hashlib

ROOT = '/Users/CanasBangin/Desktop/TheBig6V2'
P = ROOT + '/index.html'
SCR = '/private/tmp/claude-501/-Users-CanasBangin-Desktop-TheBig6V2/7d4ab7fc-ad06-4917-b0e4-faf3f7d43e66/scratchpad/builder/g1a'
BASE = '/private/tmp/claude-501/-Users-CanasBangin-Desktop-TheBig6V2/7d4ab7fc-ad06-4917-b0e4-faf3f7d43e66/scratchpad/base_v228.html'
CAND_SHA256 = 'd854af0a91f88a5d67c60dd458289bc0fff90c835c2f719775707f8548c56a71'
G = {'g193': ROOT + '/tests/gates/g193_samecard.js',
     'g197b': ROOT + '/tests/gates/g197b_sweep.js',
     'g200': ROOT + '/tests/gates/g200_pull_arbitration.js'}

def die(msg):
    print('REFUSED: ' + msg)
    sys.exit(1)

src_b = open(P, 'rb').read()
src = src_b.decode('utf-8')
txt = {k: open(v, encoding='utf-8').read() for k, v in G.items()}

# ── refusals ─────────────────────────────────────────────────────────────────────────────
if src.count('<meta name="ia-version" content="229">') != 1: die('index.html does not read ia-version 229 exactly once')
if src.count('<meta name="ia-version" content=') != 1: die('more than one ia-version meta')
if hashlib.sha256(src_b).hexdigest() != CAND_SHA256: die('index.html is not the pre-scanned V229 candidate (sha256 %s)' % hashlib.sha256(src_b).hexdigest())
for k, t in txt.items():
    if '[229]' in t: die(G[k] + ' already carries a [229] token')

WHY = ('V229 (D193 P-CAPRPE build half, D194 P-INJLENS part 1): ruled UNMOVED, reference to [228]; D194 '
       '(tests/measure/v229_rulings/d194_injlens_ruling.md) "What deliberately does NOT change": "`buildProgram` and the '
       'overlay variant build (already injured inside the engine; the lens does not touch `applyOverlays`)." and "Every '
       'uninjured program: lists, cards, toasts byte-identical."; D193 (tests/measure/v228_rulings/d193_caprpe_ruling.md) '
       '"What deliberately does not change": "Uninjured builds (filter returns at :8095)", and its build half rewrites '
       'only the detail of capped cards on injured builds, never a name')
PRINTED = 'printed equal to [228] on the V229 candidate (ia-version 229, sha d854af0a91f8) by builder with this gate before this row'

# (file key, map, carry note)
EDITS = [
 ('g193', 'OPEN_UNRULED_BY_VERSION',
  ' (' + PRINTED + ': 0 in the debt register, 0 unregistered, no class shrank; the Kettlebell swing 0 carries)'),
 ('g197b', 'HF_LEAK_BY_VERSION',
  ' (' + PRINTED + ': home_full machine 0, cable 0, survivors {} and {}; the [228] 0/0 carries)'),
 ('g197b', 'B5C_BY_VERSION',
  ' (' + PRINTED + ': same-card duplicates 0; the [228] 0 carries)'),
 ('g200', 'SWAP_BY_VERSION',
  ' (' + PRINTED + ': 138, census {"Kettlebell swing":138}; the p1 population 138 carries)'),
]

new = dict(txt)
for k, m, carry in EDITS:
    a = '\n' + m + '[228] = ' + m + '[227];   // '
    n = new[k].count(a)
    print('ANCHOR %s %s[228] row count %d' % (G[k].split('/')[-1], m, n))
    if n != 1: die('anchor %r count %d in %s' % (a.strip(), n, G[k]))
    i = new[k].index(a) + 1
    j = new[k].index('\n', i)            # end of the [228] row
    row = m + '[229] = ' + m + '[228];   // ' + WHY + carry
    if '\\u' in row: die('a \\u escape was typed into a row')
    new[k] = new[k][:j + 1] + row + '\n' + new[k][j + 1:]
    print('ROW ' + G[k].split('/')[-1] + ': ' + m + '[229]')

# ── 1. each gate on the 229 tree WITHOUT the row ─────────────────────────────────────────
os.makedirs(SCR + '/tmp', exist_ok=True)
env = dict(os.environ, TMPDIR=SCR + '/tmp')

def run(gate_path, art=P):
    r = subprocess.run(['bash', '-c', 'set -eo pipefail; node "%s" "%s" "%s"' % (gate_path, art, BASE)],
                       capture_output=True, text=True, env=env, cwd=ROOT)
    out = r.stdout + r.stderr
    m = re.findall(r'^PASS (\d+) FAIL (\d+)\s*$', out, re.M)
    return out, (tuple(map(int, m[-1])) if m else None)

pre = {k: run(G[k]) for k in G}
o, s = pre['g193']
if s is not None or 'no OPEN_UNRULED_BY_VERSION row for V229' not in o:
    die('g193 without the row did not crash on the named missing row (summary %r)' % (s,))
print('PRE g193  no row: CRASH (no OPEN_UNRULED_BY_VERSION row for V229), no summary; its value is read on the mirror below')

o, s = pre['g197b']
fails = re.findall(r'^FAIL (B\w+) .*->\s*(.*)$', o, re.M)   # greedy: the computed value is after the LAST arrow
names = [f[0] for f in fails]
got = dict(fails)
if s != (25, 5) or names != ['B4i', 'B4j', 'B4k', 'B4l', 'B5c']:
    die('g197b without the row: summary %r, fails %r (want 25/5 on B4i B4j B4k B4l B5c only)' % (s, names))
want197 = {'B4i': '0', 'B4j': '{} vs row null', 'B4k': '0', 'B4l': '{} vs row null', 'B5c': '0'}
for n, w in want197.items():
    if got[n].strip() != w: die('CLASS (D), REFUTED PREMISE (standing ruling 7): g197b %s computes %r, [228] row reads %r' % (n, got[n], w))
print('PRE g197b no row: PASS %d FAIL %d on %s; computed machine %s, cable %s, survivors %s / %s, B5c dup %s == [228]'
      % (s + (' '.join(names), got['B4i'].strip(), got['B4k'].strip(), got['B4j'].split(' vs ')[0], got['B4l'].split(' vs ')[0], got['B5c'].strip())))

o, s = pre['g200']
fl = re.findall(r'^  FAIL (\w+) ', o, re.M)
if s != (13, 5) or fl != ['P2c', 'P2d', 'P6', 'P4', 'P7']:
    die('g200 without the row: summary %r, fails %r (want 13/5 on P2c P2d P6 P4 P7 only)' % (s, fl))
if re.search(r'^  FAIL B1 ', o, re.M): die('g200 B1 fails: the MANNY row is missing')
gs = re.findall(r'got (\d+)\.', o)
if gs[:1] != ['138'] or 'got {"Kettlebell swing":138}' not in o:
    die('CLASS (D), REFUTED PREMISE (standing ruling 7): g200 computes %r / census not {"Kettlebell swing":138}; [228] row reads 138' % gs[:1])
other = sorted(set(re.findall(r'([A-Z][A-Z0-9_]*_BY_VERSION)', o)) - {'MANNY_DIGEST_BY_VERSION'})
if other: die('g200 names another _BY_VERSION map at 229: %r (report, do not add a fifth edit)' % other)
print('PRE g200  no row: PASS %d FAIL %d on %s; computed 138, census {"Kettlebell swing":138} == [228]; no other _BY_VERSION map named' % (s + (' '.join(fl),)))

# ── 2. a scratch mirror of each gate carrying exactly the bytes to be written ────────────
MIR = SCR + '/mirror/tests'
os.makedirs(MIR + '/gates', exist_ok=True)
for name, tgt in (('harness.js', ROOT + '/tests/harness.js'), ('measure', ROOT + '/tests/measure')):
    lp = MIR + '/' + name
    if not os.path.islink(lp): os.symlink(tgt, lp)
WANT = {'g193': (53, 0), 'g197b': (30, 0), 'g200': (18, 0)}
for k in G:
    mp = MIR + '/gates/' + G[k].split('/')[-1]
    open(mp, 'w', encoding='utf-8').write(new[k])
    o, s = run(mp)
    if s != WANT[k]: die('mirror %s with the row: summary %r, want %r\n%s' % (k, s, WANT[k], o[-3000:]))
    if k == 'g193':
        if 'SHRANK' in o: die('CLASS (D), REFUTED PREMISE (standing ruling 7): g193 debt register shrank at 229')
        if '(0 in the debt register, across 1 named class(es))' not in o:
            die('CLASS (D), REFUTED PREMISE (standing ruling 7): g193 debt total is not 0 at 229')
        print('MIRROR g193 computed: 0 in the debt register across 1 named class, no class shrank == [228]')
    print('MIRROR %-5s with the row: PASS %d FAIL %d' % ((k,) + s))

# ── 3. write ─────────────────────────────────────────────────────────────────────────────
for k in G:
    if k == 'g197b' and new[k] == txt[k]: die('g197b unchanged')
for k in G:
    open(G[k], 'w', encoding='utf-8').write(new[k])
    r = subprocess.run(['node', '--check', G[k]], capture_output=True, text=True)
    if r.returncode: die('node --check failed on ' + G[k] + ': ' + r.stderr)
    print('WROTE ' + G[k] + ' (node --check ok)')

# ── 4. after the write: each gate on the 229 tree and on the V228 baseline ──────────────
for k in G:
    o, s = run(G[k])
    print('POST %-5s on V229 tree: %s' % (k, ('PASS %d FAIL %d' % s) if s else 'NO SUMMARY'))
    if s != WANT[k]: die('post-write %s on V229: %r, want %r' % (k, s, WANT[k]))
    o, s = run(G[k], BASE)
    print('POST %-5s on V228 base: %s' % (k, ('PASS %d FAIL %d' % s) if s else 'NO SUMMARY'))
    if s != WANT[k]: die('post-write %s on the V228 baseline: %r, want %r\n%s' % (k, s, WANT[k], o[-2000:]))
print('OK: four [229]=[228] era rows written')
