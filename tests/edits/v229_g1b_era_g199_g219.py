#!/usr/bin/env python3
# V229 gate slice G1b: the last four era rows of class (A) in gatekeeper's V229 pre-scan, by G1a's procedure and rule
# (tests/edits/v229_g1a_era_g193_g197b_g200.py, itself V228's s4 procedure keyed one version up).
# Rulings (standing ruling 4: each row is keyed to the ruling that leaves its value unmoved):
#   D194 P-INJLENS, tests/measure/v229_rulings/d194_injlens_ruling.md, "What deliberately does NOT change":
#     "`buildProgram` and the overlay variant build (already injured inside the engine; the lens does not touch
#     `applyOverlays`)." and "Every uninjured program: lists, cards, toasts byte-identical."
#   D193 P-CAPRPE build half, tests/measure/v228_rulings/d193_caprpe_ruling.md, "What deliberately does not change":
#     "Uninjured builds (filter returns at :8095)"; the clamp and the held test rewrite the detail of capped cards on
#     injured builds only, never a name.
#   E1 g199_deload_arbitration.js  DELOAD_ARB_BY_VERSION[229]   = [228], on the line after its [228] row.
#   E2 g199_deload_arbitration.js  E6_BY_VERSION[229]           = [228], on the line after its [228] row.
#   E3 g199_deload_arbitration.js  DELOAD_HINGE_BY_VERSION[229] = [228], on the line after its [228] row.
#   E4 g219_samecard_draws.js      ERA[229]                     = ERA[228], on the line after its [228] row.
# Order: refuse unless index.html is the pre-scanned V229 candidate and no [229] token exists in these files; assert
# every anchor count==1; run each gate on the 229 tree WITHOUT the rows, require exactly the expected failing row IDs
# (every one belongs to one of these four tables) and read each computed value off its failure line; compare each with
# the [228] row's value (the [228] rows resolve by reference to the literal rows typed below); run a scratch mirror of
# each gate carrying exactly the bytes to be written (green at the V228 counts g199 56/0, g219 15/0); only then write.
# Any computed value that differs from [228] is class (D): nothing is written and the slice parks (standing ruling 7).
# After the write, each gate runs on the V229 tree and on the V228 baseline and must stay green.
import sys, os, re, subprocess, hashlib, json

ROOT = '/Users/CanasBangin/Desktop/TheBig6V2'
P = ROOT + '/index.html'
SCR = '/private/tmp/claude-501/-Users-CanasBangin-Desktop-TheBig6V2/7d4ab7fc-ad06-4917-b0e4-faf3f7d43e66/scratchpad/builder/g1b'
BASE = '/private/tmp/claude-501/-Users-CanasBangin-Desktop-TheBig6V2/7d4ab7fc-ad06-4917-b0e4-faf3f7d43e66/scratchpad/base_v228.html'
CAND_SHA256 = 'd854af0a91f88a5d67c60dd458289bc0fff90c835c2f719775707f8548c56a71'
G = {'g199': ROOT + '/tests/gates/g199_deload_arbitration.js',
     'g219': ROOT + '/tests/gates/g219_samecard_draws.js'}

# The [228] rows, resolved by hand through their reference chains (typed from the gate files, never read off a run):
#   DELOAD_ARB_BY_VERSION[228] -> ... -> [219] = { capLSBkilled: 18, zeroWeeks: 264, zeroWeeksNonDeload: 264,
#                                                  zeroWeeksDeloadOff: 0, dlIdentical: 19 }
#   E6_BY_VERSION[228] -> 28
#   DELOAD_HINGE_BY_VERSION[228] -> { E1b: 9319, E3: 44, G5: {'Explosive finisher': 44}, E1a: 12369, G1: 1275 }
#   ERA[228] (g219) -> { dup:0, li:0, tgt:0, ck:4770, ckNo:891, bic1:412, c165:0, c166:0,
#                        fx:{ exact:'Pec deck 3×12–15 @ RPE 6–7', noDup:true } }
ROW228_G199 = {  # failing row id -> the [228] value its failure line must report
    'C1': '264', 'C3': '264', 'C5': '0', 'D2': '19', 'I3': '18',                          # DELOAD_ARB
    'E1a': '12369', 'E1b': '9319', 'E2': '12369 -> 12369', 'E3': '44', 'G1': '1275',      # DELOAD_HINGE
    'G2': '1275', 'G5': '{"Explosive finisher":44}',
    'E6': '28',                                                                           # E6
}
TABLE_G199 = {'C1': 'DELOAD_ARB', 'C3': 'DELOAD_ARB', 'C5': 'DELOAD_ARB', 'D2': 'DELOAD_ARB', 'I3': 'DELOAD_ARB',
              'E1a': 'DELOAD_HINGE', 'E1b': 'DELOAD_HINGE', 'E2': 'DELOAD_HINGE', 'E3': 'DELOAD_HINGE',
              'G1': 'DELOAD_HINGE', 'G2': 'DELOAD_HINGE', 'G5': 'DELOAD_HINGE', 'E6': 'E6'}
ROW228_G219 = {'F1': 'Pec deck 3×12–15 @ RPE 6–7', 'F2': '[]', 'R1': '0', 'R2': '0', 'R3': '0', 'R4': '4770',
               'R5': '891', 'R6': '412', 'R7': '0', 'R8': '0'}

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

# (file key, row prefix, carry note)
EDITS = [
 ('g199', 'DELOAD_ARB_BY_VERSION',
  ' (' + PRINTED + ': C1 zero-posterior weeks 264, C3 non-deload 264, C5 deload-off 0, D2 byte-identical deload weeks 19, '
  'I3 Leg superset B killed by the cap 18; the [228] row carries)'),
 ('g199', 'E6_BY_VERSION',
  ' (' + PRINTED + ': E6 end-to-end 28; the [228] 28 carries)'),
 ('g199', 'DELOAD_HINGE_BY_VERSION',
  ' (' + PRINTED + ': E1a 12369, E1b 9319, E2 12369 -> 12369, E3 44, G1 1275, G2 1275, G5 {"Explosive finisher":44}; '
  'the [228] row carries)'),
 ('g219', 'ERA',
  ' (' + PRINTED + ': F1 Pec deck 3×12–15 @ RPE 6–7, F2 no twin, R1 dup 0, R2 li 0, R3 tgt 0, R4 ck 4770, R5 ckNo 891, '
  'R6 bic1 412, R7 c165 0, R8 c166 0; the [228] row carries)'),
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

# ── 1. each gate on the 229 tree WITHOUT the rows ────────────────────────────────────────
os.makedirs(SCR + '/tmp', exist_ok=True)
env = dict(os.environ, TMPDIR=SCR + '/tmp')

def run(gate_path, art=P):
    r = subprocess.run(['bash', '-c', 'set -eo pipefail; node "%s" "%s" "%s"' % (gate_path, art, BASE)],
                       capture_output=True, text=True, env=env, cwd=ROOT)
    out = r.stdout + r.stderr
    m = re.findall(r'^PASS (\d+) FAIL (\d+)\s*$', out, re.M)
    return out, (tuple(map(int, m[-1])) if m else None)

pre = {k: run(G[k]) for k in G}
open(SCR + '/pre_g199.out', 'w', encoding='utf-8').write(pre['g199'][0])
open(SCR + '/pre_g219.out', 'w', encoding='utf-8').write(pre['g219'][0])

# g199: exactly 13 failing rows, every one in DELOAD_ARB / DELOAD_HINGE / E6; computed value read off each line.
o, s = pre['g199']
lines = {mm.group(1): mm.group(0) for mm in re.finditer(r'^  FAIL (\w+) .*$', o, re.M)}
names = list(lines)
if s != (43, 13) or sorted(names) != sorted(ROW228_G199):
    die('g199 without the rows: summary %r, fails %r (want 43/13 on %s only)' % (s, names, ' '.join(sorted(ROW228_G199))))
def g199_val(n, l):
    if n == 'E2':
        mm = re.search(r': (\d+) -> (\d+)\. ', l); return mm and (mm.group(1) + ' -> ' + mm.group(2))
    if n == 'E6':
        mm = re.search(r'\): (\d+) deload day builds ship zero posterior', l); return mm and mm.group(1)
    mm = re.search(r'got (\{[^}]*\}|\d+)', l); return mm and mm.group(1)
got199 = {}
for n in names:
    v = g199_val(n, lines[n])
    got199[n] = v
    if v != ROW228_G199[n]:
        die('CLASS (D), REFUTED PREMISE (standing ruling 7): g199 %s (%s) computes %r, [228] row reads %r' % (n, TABLE_G199[n], v, ROW228_G199[n]))
print('PRE g199  no rows: PASS %d FAIL %d; the 13 failing rows, each in its table, computed == [228]:' % s)
for t in ('DELOAD_ARB', 'DELOAD_HINGE', 'E6'):
    print('    %-12s %s' % (t, ', '.join('%s %s' % (n, got199[n]) for n in names if TABLE_G199[n] == t)))

# g219: exactly 10 failing rows, every one an ERA field; computed value read off each line.
o, s = pre['g219']
fl = re.findall(r'^FAIL (\w+) .*\(NO ERA ROW for ia-version 229\) \(got (.*)\)\s*$', o, re.M)
names = [f[0] for f in fl]
allfail = re.findall(r'^FAIL (\w+) ', o, re.M)
if s != (5, 10) or sorted(names) != sorted(ROW228_G219) or sorted(allfail) != sorted(names):
    die('g219 without the row: summary %r, fails %r / %r (want 5/10 on %s only)' % (s, names, allfail, ' '.join(sorted(ROW228_G219))))
got219 = dict(fl)
for n, w in ROW228_G219.items():
    if got219[n].strip() != w:
        die('CLASS (D), REFUTED PREMISE (standing ruling 7): g219 %s computes %r, ERA[228] reads %r' % (n, got219[n], w))
print('PRE g219  no row: PASS %d FAIL %d on %s; computed == ERA[228]: %s' % (s + (' '.join(names), ', '.join('%s %s' % (n, got219[n]) for n in names))))

# ── 2. a scratch mirror of each gate carrying exactly the bytes to be written ────────────
MIR = SCR + '/mirror/tests'
os.makedirs(MIR + '/gates', exist_ok=True)
for name, tgt in (('harness.js', ROOT + '/tests/harness.js'), ('measure', ROOT + '/tests/measure')):
    lp = MIR + '/' + name
    if not os.path.islink(lp): os.symlink(tgt, lp)
WANT = {'g199': (56, 0), 'g219': (15, 0)}
for k in G:
    mp = MIR + '/gates/' + G[k].split('/')[-1]
    open(mp, 'w', encoding='utf-8').write(new[k])
    o, s = run(mp)
    if s != WANT[k]: die('mirror %s with the rows: summary %r, want %r\n%s' % (k, s, WANT[k], o[-3000:]))
    print('MIRROR %-5s with the rows: PASS %d FAIL %d' % ((k,) + s))

# ── 3. write ─────────────────────────────────────────────────────────────────────────────
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
