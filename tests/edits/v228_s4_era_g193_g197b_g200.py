#!/usr/bin/env python3
# V228 build, slice 4: four era rows in three gate files, the (A) class of slice 3's pre-scan. No version bump
# (slice 3 did it). Rulings: D193 P-CAPRPE as split by Mario round 2 (tests/measure/v228_rulings/d193_caprpe_ruling.md:
# "V228 ships R1 ... and R4 ... only, with D192"; "Without R2, V228 moves no number") and D192 P-UNDOKEY
# (tests/measure/v228_rulings/d192_undokey_ruling.md: one read-side line in swapOriginOf, "`buildProgram` untouched").
#   E1 g193_samecard.js          OPEN_UNRULED_BY_VERSION[228] = [227], on the line after its [227] row.
#   E2 g197b_sweep.js            HF_LEAK_BY_VERSION[228]      = [227], on the line after its [227] row.
#   E3 g197b_sweep.js            B5C_BY_VERSION[228]          = [227], on the line after its [227] row.
#   E4 g200_pull_arbitration.js  SWAP_BY_VERSION[228]         = [227], on the line after its [227] row.
# Order (V227 s3's): refuse unless index.html reads 228 and no [228] row exists in these files; assert every anchor
# count==1; run each gate on the 228 tree WITHOUT the row (record which assertions fail or crash, and read the
# computed values off the failure lines); run a scratch mirror of each gate carrying exactly the bytes to be
# written; write nothing unless every computed value equals its [227] row and every mirror is green at the 227
# counts (g193 53/0, g197b 30/0, g200_pull 18/0). A computed value that differs from [227] is a refuted premise and
# parks the slice (standing ruling 7). After the write, each gate is run on the V227 baseline and must stay green.
import sys, os, re, subprocess

ROOT = '/Users/CanasBangin/Desktop/TheBig6V2'
P = ROOT + '/index.html'
SCR = '/private/tmp/claude-501/-Users-CanasBangin-Desktop-TheBig6V2/3a93b6bd-f518-4d1a-a71e-2afb713a85f0/scratchpad/builder/s4'
BASE = '/private/tmp/claude-501/-Users-CanasBangin-Desktop-TheBig6V2/3a93b6bd-f518-4d1a-a71e-2afb713a85f0/scratchpad/base_v227.html'
G = {'g193': ROOT + '/tests/gates/g193_samecard.js',
     'g197b': ROOT + '/tests/gates/g197b_sweep.js',
     'g200': ROOT + '/tests/gates/g200_pull_arbitration.js'}

def die(msg):
    print('REFUSED: ' + msg)
    sys.exit(1)

src = open(P, encoding='utf-8').read()
txt = {k: open(v, encoding='utf-8').read() for k, v in G.items()}

# ── refusals ─────────────────────────────────────────────────────────────────────────────
if src.count('<meta name="ia-version" content="228">') != 1: die('index.html does not read ia-version 228 exactly once')
if src.count('<meta name="ia-version" content=') != 1: die('more than one ia-version meta')
if '_capRpeClamp' in src: die('the parked clamp is on this tree')
for k, t in txt.items():
    if '[228]' in t: die(G[k] + ' already carries a [228] token')

WHY = ('V228 (D193 P-CAPRPE split to R1+R4, D192 P-UNDOKEY): ruled UNMOVED, reference to [227]; neither ruling moves a '
       'build number: the one-class oracle shows injured grids differ from V227 by the cue word only and uninjured '
       'grids are byte-identical, and D192 is one read-side line in swapOriginOf')
PRINTED = 'printed equal to [227] on the V228 working tree (slice 3) by builder with this gate before this row'

# (file key, map, carry note)
EDITS = [
 ('g193', 'OPEN_UNRULED_BY_VERSION',
  ' (' + PRINTED + ': 0 in the debt register, 0 unregistered, no class shrank; the Kettlebell swing 0 carries)'),
 ('g197b', 'HF_LEAK_BY_VERSION',
  ' (' + PRINTED + ': home_full machine 0, cable 0, survivors {} and {}; the [227] 0/0 carries)'),
 ('g197b', 'B5C_BY_VERSION',
  ' (' + PRINTED + ': same-card duplicates 0; the [227] 0 carries)'),
 ('g200', 'SWAP_BY_VERSION',
  ' (' + PRINTED + ': 138, census {"Kettlebell swing":138}; the p1 population 138 carries)'),
]

new = dict(txt)
for k, m, carry in EDITS:
    a = '\n' + m + '[227] = ' + m + '[226];   // '
    if new[k].count(a) != 1: die('anchor %r count %d in %s' % (a.strip(), new[k].count(a), G[k]))
    i = new[k].index(a) + 1
    j = new[k].index('\n', i)            # end of the [227] row
    row = m + '[228] = ' + m + '[227];   // ' + WHY + carry
    new[k] = new[k][:j + 1] + row + '\n' + new[k][j + 1:]
    print('ROW ' + G[k].split('/')[-1] + ': ' + m + '[228]')

# ── 1. each gate on the 228 tree WITHOUT the row ─────────────────────────────────────────
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
if s is not None or 'no OPEN_UNRULED_BY_VERSION row for V228' not in o:
    die('g193 without the row did not crash on the named missing row (summary %r)' % (s,))
print('PRE g193  no row: CRASH (no OPEN_UNRULED_BY_VERSION row for V228), no summary')

o, s = pre['g197b']
fails = re.findall(r'^FAIL (B\w+) .*->\s*(.*)$', o, re.M)   # greedy: the computed value is after the LAST arrow
names = [f[0] for f in fails]
got = dict(fails)
if s != (25, 5) or names != ['B4i', 'B4j', 'B4k', 'B4l', 'B5c']:
    die('g197b without the row: summary %r, fails %r (want 25/5 on B4i B4j B4k B4l B5c only)' % (s, names))
want197 = {'B4i': '0', 'B4j': '{} vs row null', 'B4k': '0', 'B4l': '{} vs row null', 'B5c': '0'}
for n, w in want197.items():
    if got[n].strip() != w: die('REFUTED PREMISE (standing ruling 7): g197b %s computes %r, [227] row reads %r' % (n, got[n], w))
print('PRE g197b no row: PASS %d FAIL %d on %s; computed machine 0, cable 0, survivors {} {}, B5c dup 0 == [227]' % (s + (' '.join(names),)))

o, s = pre['g200']
fl = re.findall(r'^  FAIL (\w+) ', o, re.M)
if s != (13, 5) or fl != ['P2c', 'P2d', 'P6', 'P4', 'P7']:
    die('g200 without the row: summary %r, fails %r (want 13/5 on P2c P2d P6 P4 P7 only)' % (s, fl))
if re.search(r'^  FAIL B1 ', o, re.M): die('g200 B1 fails: the MANNY row is missing')
gs = re.findall(r'got (\d+)\.', o)
if gs[:1] != ['138'] or 'got {"Kettlebell swing":138}' not in o:
    die('REFUTED PREMISE (standing ruling 7): g200 computes %r / census not {"Kettlebell swing":138}; [227] row reads 138' % gs[:1])
other = sorted(set(re.findall(r'([A-Z][A-Z0-9_]*_BY_VERSION)', o)) - {'MANNY_DIGEST_BY_VERSION'})
if other: die('g200 names another _BY_VERSION map at 228: %r (report, do not add a fifth edit)' % other)
print('PRE g200  no row: PASS %d FAIL %d on %s; computed 138, census {"Kettlebell swing":138} == [227]; no other _BY_VERSION map named' % (s + (' '.join(fl),)))

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
        if 'SHRANK' in o: die('REFUTED PREMISE (standing ruling 7): g193 debt register shrank at 228')
        if '(0 in the debt register, across 1 named class(es))' not in o:
            die('REFUTED PREMISE (standing ruling 7): g193 debt total is not 0 at 228')
    print('MIRROR %-5s with the row: PASS %d FAIL %d' % ((k,) + s))

# ── 3. write ─────────────────────────────────────────────────────────────────────────────
for k in G:
    open(G[k], 'w', encoding='utf-8').write(new[k])
    r = subprocess.run(['node', '--check', G[k]], capture_output=True, text=True)
    if r.returncode: die('node --check failed on ' + G[k] + ': ' + r.stderr)
    print('WROTE ' + G[k] + ' (node --check ok)')

# ── 4. after the write: each gate on the 228 tree and on the V227 baseline ──────────────
for k in G:
    o, s = run(G[k])
    print('POST %-5s on V228 tree: %s' % (k, ('PASS %d FAIL %d' % s) if s else 'NO SUMMARY'))
    if s != WANT[k]: die('post-write %s on V228: %r, want %r' % (k, s, WANT[k]))
    o, s = run(G[k], BASE)
    print('POST %-5s on V227 base: %s' % (k, ('PASS %d FAIL %d' % s) if s else 'NO SUMMARY'))
    if s is None or s[1] != 0: die('post-write %s on the V227 baseline is not green: %r\n%s' % (k, s, o[-2000:]))
print('OK: four [228]=[227] era rows written')
