#!/usr/bin/env python3
# V228 build, slice 5: the last four era rows in two gate files, the rest of the (A) class of slice 3's pre-scan.
# No version bump (slice 3 did it). Rulings: D193 P-CAPRPE as split by Mario round 2
# (tests/measure/v228_rulings/d193_caprpe_ruling.md: "V228 ships R1 ... and R4 ... only, with D192"; "Without R2,
# V228 moves no number") and D192 P-UNDOKEY (tests/measure/v228_rulings/d192_undokey_ruling.md: one read-side line in
# swapOriginOf, "`buildProgram` untouched").
#   E1 g199_deload_arbitration.js  DELOAD_ARB_BY_VERSION[228]   = [227], on the line after its [227] row (:176).
#   E2 g199_deload_arbitration.js  E6_BY_VERSION[228]           = [227], on the line after its [227] row (:180).
#   E3 g199_deload_arbitration.js  DELOAD_HINGE_BY_VERSION[228] = [227], on the line after its [227] row (:184).
#   E4 g219_samecard_draws.js      ERA[228]                     = ERA[227], on the line after its [227] row (:148).
# Order (slice 4's): refuse unless index.html reads 228, the parked clamp is absent and no [228] row exists in these
# files; assert every anchor count==1 at its expected line; run each gate on the 228 tree WITHOUT the rows (only the
# NO-ROW assertions may fail, and every computed value read off a failure line must equal the [227] value slice 3's
# pre-scan printed); run a scratch mirror of each gate carrying exactly the bytes to be written and require the 227
# counts (g199 56/0, g219 15/0); write; then each gate green on the 228 tree and on the V227 baseline. A computed
# value that differs from [227] is a refuted premise and parks the slice (standing ruling 7).
import sys, os, re, subprocess

ROOT = '/Users/CanasBangin/Desktop/TheBig6V2'
P = ROOT + '/index.html'
SCR = '/private/tmp/claude-501/-Users-CanasBangin-Desktop-TheBig6V2/3a93b6bd-f518-4d1a-a71e-2afb713a85f0/scratchpad/builder/s5'
BASE = '/private/tmp/claude-501/-Users-CanasBangin-Desktop-TheBig6V2/3a93b6bd-f518-4d1a-a71e-2afb713a85f0/scratchpad/base_v227.html'
G = {'g199': ROOT + '/tests/gates/g199_deload_arbitration.js',
     'g219': ROOT + '/tests/gates/g219_samecard_draws.js'}
HARNESS = ROOT + '/tests/harness.js'

def die(msg):
    print('REFUSED: ' + msg)
    sys.exit(1)

src = open(P, encoding='utf-8').read()
txt = {k: open(v, encoding='utf-8').read() for k, v in G.items()}
har = open(HARNESS, encoding='utf-8').read()

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

# (file key, map, expected 1-based line of the [227] row, carry note)
EDITS = [
 ('g199', 'DELOAD_ARB_BY_VERSION', 176, 'C1 264 C3 264 C5 0 D2 19 I3 18 carry'),
 ('g199', 'E6_BY_VERSION', 180, 'E6 28 carries'),
 ('g199', 'DELOAD_HINGE_BY_VERSION', 184, 'E1a 12369 E1b 9319 E3 44 G1 1275 G5 44 carry'),
 ('g219', 'ERA', 148, 'dup 0 li 0 tgt 0 ck 4770 ckNo 891 bic1 412 c165 0 c166 0 and the Pec deck fixture carry'),
]

# Anchors on the PRISTINE text, then insert bottom-up per file so the line assertions hold.
for k, m, want_line, carry in EDITS:
    prefix = m + '[227] = ' + m + '[226];   // '
    if txt[k].count('\n' + prefix) != 1: die('%s: anchor %r count %d, want 1' % (G[k], prefix, txt[k].count('\n' + prefix)))
    lines = txt[k].split('\n')
    hits = [i for i, l in enumerate(lines) if l.startswith(prefix)]
    if len(hits) != 1 or hits[0] + 1 != want_line: die('%s: anchor %r at lines %r, want [%d]' % (G[k], prefix, [h + 1 for h in hits], want_line))
new = dict(txt)
for k, m, want_line, carry in sorted(EDITS, key=lambda e: -e[2]):
    lines = new[k].split('\n')
    i = [n for n, l in enumerate(lines) if l.startswith(m + '[227] = ')][0]
    lines.insert(i + 1, m + '[228] = ' + m + '[227];   // ' + WHY + ' (' + PRINTED + '; ' + carry + ')')
    new[k] = '\n'.join(lines)
for k in G:
    want = sum(1 for e in EDITS if e[0] == k)
    if new[k].count('[228] = ') != want or len(new[k].split('\n')) != len(txt[k].split('\n')) + want:
        die('%s: the edit did not land exactly %d rows' % (G[k], want))
for k, m, want_line, carry in EDITS:
    lines = new[k].split('\n')
    i = [n for n, l in enumerate(lines) if l.startswith(m + '[227] = ')][0]
    if not lines[i + 1].startswith(m + '[228] = ' + m + '[227];   // '): die('%s: %s[228] not directly after [227]' % (G[k], m))
    print('ROW %s:%d %s[228]' % (G[k].split('/')[-1], i + 2, m))

# ── 1. each gate on the 228 tree WITHOUT the rows ────────────────────────────────────────
os.makedirs(SCR + '/tmp', exist_ok=True)
env = dict(os.environ, TMPDIR=SCR + '/tmp')

def run(gate_path, art=P):
    r = subprocess.run(['bash', '-c', 'set -eo pipefail; node "%s" "%s" "%s"' % (gate_path, art, BASE)],
                       capture_output=True, text=True, env=env, cwd=ROOT)
    out = r.stdout + r.stderr
    m = re.findall(r'^PASS (\d+) FAIL (\d+)\s*$', out, re.M)
    return out, (tuple(map(int, m[-1])) if m else None)

def fail_lines(o):
    return [(m.group(1), m.group(0)) for m in re.finditer(r'^\s*FAIL (\w+) .*$', o, re.M)]

def other_maps(o, adding):
    named = set(re.findall(r'([A-Z][A-Z0-9_]*_BY_VERSION)', o)) - set(adding)
    return sorted(n for n in named if (n + '[228]') not in har and all((n + '[228]') not in t for t in new.values()))

pre = {k: run(G[k]) for k in G}

o, s = pre['g199']
fl = fail_lines(o)
names = [n for n, _ in fl]
W199 = ['C1', 'C3', 'C5', 'D2', 'E1a', 'E1b', 'E2', 'E3', 'E6', 'G1', 'G2', 'G5', 'I3']
if s != (43, 13) or names != W199: die('g199 without the rows: summary %r, fails %r (want 43/13 on %s)' % (s, names, ' '.join(W199)))
if any('NO ROW' not in l for _, l in fl): die('g199: a failing line does not name NO ROW: %r' % [n for n, l in fl if 'NO ROW' not in l])
L = dict(fl)
got199 = {n: (re.search(r'got (\{[^}]*\}|\d+)', L[n]) or [None, None])[1] for n in W199 if n not in ('E2', 'E6')}
got199['E2'] = (re.search(r': (\d+) -> (\d+)\.', L['E2']) or [None])[0]
got199['E6'] = (re.search(r'\): (\d+) deload day builds ship zero posterior', L['E6']) or [None, None])[1]
want199 = {'C1': '264', 'C3': '264', 'C5': '0', 'D2': '19', 'E1a': '12369', 'E1b': '9319', 'E2': ': 12369 -> 12369.',
           'E3': '44', 'E6': '28', 'G1': '1275', 'G2': '1275', 'G5': '{"Explosive finisher":44}', 'I3': '18'}
for n, w in want199.items():
    if got199.get(n) != w: die('REFUTED PREMISE (standing ruling 7): g199 %s computes %r, [227] reads %r' % (n, got199.get(n), w))
om = other_maps(o, ['DELOAD_ARB_BY_VERSION', 'E6_BY_VERSION', 'DELOAD_HINGE_BY_VERSION'])
if om: die('g199 names another _BY_VERSION map with no [228] row: %r (report, do not add it here)' % om)
print('PRE g199 no rows: PASS %d FAIL %d, only NO-ROW fails (%s); computed C1 264 C3 264 C5 0 D2 19 E1a 12369 E1b 9319 E2 12369->12369 E3 44 E6 28 G1 1275 G2 1275 G5 {"Explosive finisher":44} I3 18 == [227]' % (s + (' '.join(names),)))

o, s = pre['g219']
fl = fail_lines(o)
names = [n for n, _ in fl]
W219 = ['F1', 'F2', 'R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7', 'R8']
if s != (5, 10) or names != W219: die('g219 without the row: summary %r, fails %r (want 5/10 on %s)' % (s, names, ' '.join(W219)))
if any('NO ERA ROW for ia-version 228' not in l for _, l in fl): die('g219: a failing line is not NO ERA ROW')
L = dict(fl)
got219 = {n: (re.search(r'\(got (.*)\)\s*$', L[n]) or [None, None])[1] for n in W219}
want219 = {'F1': 'Pec deck 3×12–15 @ RPE 6–7', 'F2': '[]', 'R1': '0', 'R2': '0', 'R3': '0', 'R4': '4770', 'R5': '891', 'R6': '412', 'R7': '0', 'R8': '0'}
for n, w in want219.items():
    if got219.get(n) != w: die('REFUTED PREMISE (standing ruling 7): g219 %s computes %r, ERA[227] reads %r' % (n, got219.get(n), w))
om = other_maps(o, [])
if om: die('g219 names a _BY_VERSION map with no [228] row: %r (report, do not add it here)' % om)
print('PRE g219 no row: PASS %d FAIL %d, only NO ERA ROW fails (%s); computed fixture "Pec deck 3×12–15 @ RPE 6–7" no twin, R1 0 R2 0 R3 0 R4 4770 R5 891 R6 412 R7 0 R8 0 == ERA[227]' % (s + (' '.join(names),)))

# ── 2. a scratch mirror of each gate carrying exactly the bytes to be written ────────────
MIR = SCR + '/mirror/tests'
os.makedirs(MIR + '/gates', exist_ok=True)
for name, tgt in (('harness.js', HARNESS), ('measure', ROOT + '/tests/measure')):
    lp = MIR + '/' + name
    if not os.path.islink(lp): os.symlink(tgt, lp)
WANT = {'g199': (56, 0), 'g219': (15, 0)}
for k in G:
    mp = MIR + '/gates/' + G[k].split('/')[-1]
    open(mp, 'w', encoding='utf-8').write(new[k])
    o, s = run(mp)
    if s != WANT[k]: die('mirror %s with the rows: summary %r, want %r\n%s' % (k, s, WANT[k], o[-3000:]))
    print('MIRROR %s with the rows: PASS %d FAIL %d' % ((k,) + s))

# ── 3. write ─────────────────────────────────────────────────────────────────────────────
for k in G:
    open(G[k], 'w', encoding='utf-8').write(new[k])
    r = subprocess.run(['node', '--check', G[k]], capture_output=True, text=True)
    if r.returncode: die('node --check failed on ' + G[k] + ': ' + r.stderr)
    print('WROTE ' + G[k] + ' (node --check ok)')

# ── 4. after the write: each gate on the 228 tree and on the V227 baseline ──────────────
for k in G:
    o, s = run(G[k])
    print('POST %s on V228 tree: %s' % (k, ('PASS %d FAIL %d' % s) if s else 'NO SUMMARY'))
    if s != WANT[k]: die('post-write %s on V228: %r, want %r' % (k, s, WANT[k]))
    o, s = run(G[k], BASE)
    print('POST %s on V227 base: %s' % (k, ('PASS %d FAIL %d' % s) if s else 'NO SUMMARY'))
    if s is None or s[1] != 0: die('post-write %s on the V227 baseline is not green: %r\n%s' % (k, s, o[-2000:]))
print('OK: four [228]=[227] era rows written (3 in g199_deload_arbitration.js, 1 in g219_samecard_draws.js)')
