#!/usr/bin/env python3
# V227 build, slice 3 of D190 P-SWAPSEAM: four era rows in three gate files. No version bump (slice 2 did it).
# Ruling: tests/measure/v227_rulings/d190_swapseam_ruling.md, RE-RULING 1 §C: "Era rows the build adds, all
# `[227] = [226]` by reference (standing ruling 5; nothing in any of these populations carries a pref off a
# cued source): ... `g193_samecard.js` `OPEN_UNRULED_BY_VERSION`; `g197b_sweep.js` `HF_LEAK_BY_VERSION`,
# `B5C_BY_VERSION`; ... `g200_pull_arbitration.js` `SWAP_BY_VERSION` and any other `_BY_VERSION` map its 227 run
# named". The g200 227 run (no row) names only MANNY_DIGEST_BY_VERSION besides SWAP_BY_VERSION, and B1 passes
# on it (slice 2's harness row), so SWAP_BY_VERSION is the only g200 row.
#   E1 g193_samecard.js          OPEN_UNRULED_BY_VERSION[227] = [226], on the line after its [226] row.
#   E2 g197b_sweep.js            HF_LEAK_BY_VERSION[227]      = [226], on the line after its [226] row.
#   E3 g197b_sweep.js            B5C_BY_VERSION[227]          = [226], on the line after its [226] row.
#   E4 g200_pull_arbitration.js  SWAP_BY_VERSION[227]         = [226], on the line after its [226] row.
# Order: refuse unless index.html reads 227 and no [227] row exists in these files; assert every anchor
# count==1; run each gate on the 227 tree WITHOUT the row (record which assertions fail or crash, and read the
# computed values off the failure lines); run a scratch mirror of each gate carrying exactly the bytes to be
# written; write nothing unless every computed value equals its [226] row and every mirror is green at the
# 226 counts (g193 53/0, g197b 30/0, g200_pull 18/0). A computed value that differs from [226] is a refuted
# premise and parks the slice (standing ruling 7).
import sys, os, re, subprocess

ROOT = '/Users/CanasBangin/Desktop/TheBig6V2'
P = ROOT + '/index.html'
SCR = '/private/tmp/claude-501/-Users-CanasBangin-Desktop-TheBig6V2/0d209eb9-c4f5-49d1-974c-7a51334cecdf/scratchpad/builder3'
BASE = '/private/tmp/claude-501/-Users-CanasBangin-Desktop-TheBig6V2/0d209eb9-c4f5-49d1-974c-7a51334cecdf/scratchpad/base_v226.html'
G = {'g193': ROOT + '/tests/gates/g193_samecard.js',
     'g197b': ROOT + '/tests/gates/g197b_sweep.js',
     'g200': ROOT + '/tests/gates/g200_pull_arbitration.js'}

def die(msg):
    print('REFUSED: ' + msg)
    sys.exit(1)

src = open(P, encoding='utf-8').read()
txt = {k: open(v, encoding='utf-8').read() for k, v in G.items()}

# ── refusals ─────────────────────────────────────────────────────────────────────────────
if src.count('<meta name="ia-version" content="227">') != 1: die('index.html does not read ia-version 227 exactly once')
if src.count('<meta name="ia-version" content=') != 1: die('more than one ia-version meta')
for k, t in txt.items():
    if '[227]' in t: die(G[k] + ' already carries a [227] token')

WHY = ('V227 (D190 P-SWAPSEAM): ruled UNMOVED, reference to [226]; the engine moves only on a config carrying '
       '`cfg.exSwapPrefs` sourced from a natively cued item under a plan with a cap, and this file\'s population '
       'carries none')
PRINTED = 'printed equal to [226] on the V227 working tree (slices 1 and 2) by builder with this gate before this row'

# (file key, map, carry note)
EDITS = [
 ('g193', 'OPEN_UNRULED_BY_VERSION',
  ' (' + PRINTED + ': 0 in the debt register, 0 unregistered, no class shrank; the Kettlebell swing 0 carries)'),
 ('g197b', 'HF_LEAK_BY_VERSION',
  ' (' + PRINTED + ': home_full machine 0, cable 0, survivors {} and {}; the swap seam draws no lift item, the [226] 0/0 carries)'),
 ('g197b', 'B5C_BY_VERSION',
  ' (' + PRINTED + ': same-card duplicates 0; the [226] 0 carries)'),
 ('g200', 'SWAP_BY_VERSION',
  ' (' + PRINTED + ': 138, census {"Kettlebell swing":138}; the swap seam does not reach the pull-day deload swap draw, the p1 population 138 carries)'),
]

new = dict(txt)
for k, m, carry in EDITS:
    a = '\n' + m + '[226] = ' + m + '[225];   // '
    if new[k].count(a) != 1: die('anchor %r count %d in %s' % (a.strip(), new[k].count(a), G[k]))
    i = new[k].index(a) + 1
    j = new[k].index('\n', i)            # end of the [226] row
    row = m + '[227] = ' + m + '[226];   // ' + WHY + carry
    new[k] = new[k][:j + 1] + row + '\n' + new[k][j + 1:]
    print('ROW ' + G[k].split('/')[-1] + ': ' + m + '[227]')

# ── 1. each gate on the 227 tree WITHOUT the row ─────────────────────────────────────────
os.makedirs(SCR + '/tmp', exist_ok=True)
env = dict(os.environ, TMPDIR=SCR + '/tmp')

def run(gate_path):
    r = subprocess.run(['bash', '-c', 'set -eo pipefail; node "%s" "%s" "%s"' % (gate_path, P, BASE)],
                       capture_output=True, text=True, env=env, cwd=ROOT)
    out = r.stdout + r.stderr
    m = re.findall(r'^PASS (\d+) FAIL (\d+)\s*$', out, re.M)
    return out, (tuple(map(int, m[-1])) if m else None)

pre = {k: run(G[k]) for k in G}
o, s = pre['g193']
if s is not None or 'no OPEN_UNRULED_BY_VERSION row for V227' not in o:
    die('g193 without the row did not crash on the named missing row (summary %r)' % (s,))
print('PRE g193  no row: CRASH (no OPEN_UNRULED_BY_VERSION row for V227), no summary')

o, s = pre['g197b']
fails = re.findall(r'^FAIL (B\w+) .*->\s*(.*)$', o, re.M)   # greedy: the computed value is after the LAST arrow
names = [f[0] for f in fails]
got = dict(fails)
if s != (25, 5) or names != ['B4i', 'B4j', 'B4k', 'B4l', 'B5c']:
    die('g197b without the row: summary %r, fails %r (want 25/5 on B4i B4j B4k B4l B5c only)' % (s, names))
want197 = {'B4i': '0', 'B4j': '{} vs row null', 'B4k': '0', 'B4l': '{} vs row null', 'B5c': '0'}
for n, w in want197.items():
    if got[n].strip() != w: die('REFUTED PREMISE (standing ruling 7): g197b %s computes %r, [226] row reads %r' % (n, got[n], w))
print('PRE g197b no row: PASS %d FAIL %d on %s; computed machine 0, cable 0, survivors {} {}, B5c dup 0 == [226]' % (s + (' '.join(names),)))

o, s = pre['g200']
fl = re.findall(r'^  FAIL (\w+) ', o, re.M)
if s != (13, 5) or fl != ['P2c', 'P2d', 'P6', 'P4', 'P7']:
    die('g200 without the row: summary %r, fails %r (want 13/5 on P2c P2d P6 P4 P7 only)' % (s, fl))
if re.search(r'^  FAIL B1 ', o, re.M): die('g200 B1 fails: the MANNY row is missing')
gs = re.findall(r'got (\d+)\.', o)
if gs[:1] != ['138'] or 'got {"Kettlebell swing":138}' not in o:
    die('REFUTED PREMISE (standing ruling 7): g200 computes %r / census not {"Kettlebell swing":138}; [226] row reads 138' % gs[:1])
other = sorted(set(re.findall(r'([A-Z][A-Z0-9_]*_BY_VERSION)', o)) - {'MANNY_DIGEST_BY_VERSION'})
if other: die('g200 names another _BY_VERSION map at 227: %r (report, do not add a fifth edit)' % other)
print('PRE g200  no row: PASS %d FAIL %d on %s; computed 138, census {"Kettlebell swing":138} == [226]; no other _BY_VERSION map named' % (s + (' '.join(fl),)))

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
        if 'SHRANK' in o: die('REFUTED PREMISE (standing ruling 7): g193 debt register shrank at 227')
        if '(0 in the debt register, across 1 named class(es))' not in o:
            die('REFUTED PREMISE (standing ruling 7): g193 debt total is not 0 at 227')
    print('MIRROR %-5s with the row: PASS %d FAIL %d' % ((k,) + s))

# ── 3. write ─────────────────────────────────────────────────────────────────────────────
for k in G:
    open(G[k], 'w', encoding='utf-8').write(new[k])
    r = subprocess.run(['node', '--check', G[k]], capture_output=True, text=True)
    if r.returncode: die('node --check failed on ' + G[k] + ': ' + r.stderr)
    print('WROTE ' + G[k] + ' (node --check ok)')
