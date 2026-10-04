#!/usr/bin/env python3
# V230 slice 7b: the four era rows gatekeeper's first V230 run found missing in g199 and g219, by the V229 precedent
# (tests/edits/v229_g1b_era_g199_g219.py, itself G1a's procedure keyed one version up) and session call 11
# (tests/measure/v230_rulings/v230_session_calls.md: "[230] = [229] by reference, each row written only after its figure
# is printed on the candidate and equals V229's ... A figure that moves parks its row.").
# Ruling (standing ruling 4: each row is keyed to the ruling that leaves its value unmoved):
#   D194 P-INJLENS R3′ (Amendment 1), tests/measure/v229_rulings/d194_injlens_ruling.md: "V230 (D194 part 2) is the lens
#     alone." and "V230 moves two guards and two filter cfgs and nothing else." The V229 -> V230 diff is the ia-version
#     meta and four lines in applySessionSwaps and applySwapChoice onto `_dayPlanCfg`; buildProgram is untouched, and
#     gatekeeper's identity fuzz printed buildProgram + refreshProgram byte-identical V229 == V230 on 2,160 of 2,160 configs.
#   E1 g199_deload_arbitration.js  DELOAD_ARB_BY_VERSION[230]   = [229], on the line after its [229] row.
#   E2 g199_deload_arbitration.js  E6_BY_VERSION[230]           = [229], on the line after its [229] row.
#   E3 g199_deload_arbitration.js  DELOAD_HINGE_BY_VERSION[230] = [229], on the line after its [229] row.
#   E4 g219_samecard_draws.js      ERA[230]                     = ERA[229], on the line after its [229] row.
# Order: refuse unless index.html is the pre-scanned V230 candidate and no [230] token exists in these files; assert
# every anchor count==1; print each table's figure on BOTH trees the same way: (a) each gate as it stands on the V230
# candidate (no [230] row), (b) a scratch mirror of each gate with its [229] rows removed on the V229 baseline (no row
# for 229), so both runs print the computed value on the failure line with one parser; require exactly the expected
# failing row IDs on each tree (every one in one of these four tables), and require V230 == V229 == the [229] row value
# (the [229] rows resolve by reference to the literal rows typed below). Any row whose figure differs is class (D): that
# row PARKS (standing ruling 7) and nothing is written for it. Then a scratch mirror carrying exactly the bytes to be
# written must be green at the V229 counts (g199 56/0, g219 15/0); only then write once. After the write, each gate runs
# on the V230 candidate and on the V229 baseline and must stay green.
import sys, os, re, subprocess, hashlib

ROOT = '/Users/CanasBangin/Desktop/TheBig6V2'
P = ROOT + '/index.html'
SCR = '/private/tmp/claude-501/-Users-CanasBangin-Desktop-TheBig6V2/1cdb8ea3-6810-4976-acce-c88cc911f698/scratchpad/builder7b'
BASE = '/private/tmp/claude-501/-Users-CanasBangin-Desktop-TheBig6V2/1cdb8ea3-6810-4976-acce-c88cc911f698/scratchpad/base_v229.html'
CAND_SHA256 = '72ac41c8d34034ce66bcb0fcc2cfcdaa0e1f7f2afe802b2cf053370ac5622387'
BASE_SHA256 = 'd854af0a91f88a5d67c60dd458289bc0fff90c835c2f719775707f8548c56a71'
G = {'g199': ROOT + '/tests/gates/g199_deload_arbitration.js',
     'g219': ROOT + '/tests/gates/g219_samecard_draws.js'}

# The [229] rows, resolved by hand through their reference chains ([229] -> [228] -> ..., typed in
# tests/edits/v229_g1b_era_g199_g219.py from the gate files, never read off a run):
#   DELOAD_ARB_BY_VERSION[229] -> [219] = { capLSBkilled: 18, zeroWeeks: 264, zeroWeeksNonDeload: 264,
#                                           zeroWeeksDeloadOff: 0, dlIdentical: 19 }
#   E6_BY_VERSION[229] -> 28
#   DELOAD_HINGE_BY_VERSION[229] -> { E1b: 9319, E3: 44, G5: {'Explosive finisher': 44}, E1a: 12369, G1: 1275 }
#   ERA[229] (g219) -> { dup:0, li:0, tgt:0, ck:4770, ckNo:891, bic1:412, c165:0, c166:0,
#                        fx:{ exact:'Pec deck 3×12–15 @ RPE 6–7', noDup:true } }
ROW229_G199 = {  # failing row id -> the [229] value its failure line must report
    'C1': '264', 'C3': '264', 'C5': '0', 'D2': '19', 'I3': '18',                          # DELOAD_ARB
    'E1a': '12369', 'E1b': '9319', 'E2': '12369 -> 12369', 'E3': '44', 'G1': '1275',      # DELOAD_HINGE
    'G2': '1275', 'G5': '{"Explosive finisher":44}',
    'E6': '28',                                                                           # E6
}
TABLE_G199 = {'C1': 'DELOAD_ARB', 'C3': 'DELOAD_ARB', 'C5': 'DELOAD_ARB', 'D2': 'DELOAD_ARB', 'I3': 'DELOAD_ARB',
              'E1a': 'DELOAD_HINGE', 'E1b': 'DELOAD_HINGE', 'E2': 'DELOAD_HINGE', 'E3': 'DELOAD_HINGE',
              'G1': 'DELOAD_HINGE', 'G2': 'DELOAD_HINGE', 'G5': 'DELOAD_HINGE', 'E6': 'E6'}
ROW229_G219 = {'F1': 'Pec deck 3×12–15 @ RPE 6–7', 'F2': '[]', 'R1': '0', 'R2': '0', 'R3': '0', 'R4': '4770',
               'R5': '891', 'R6': '412', 'R7': '0', 'R8': '0'}
TABLE_PREFIX = {'DELOAD_ARB': 'DELOAD_ARB_BY_VERSION', 'DELOAD_HINGE': 'DELOAD_HINGE_BY_VERSION', 'E6': 'E6_BY_VERSION'}

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
if hashlib.sha256(src_b).hexdigest() != CAND_SHA256: die('index.html is not the pre-scanned V230 candidate (sha256 %s)' % hashlib.sha256(src_b).hexdigest())
if hashlib.sha256(base_b).hexdigest() != BASE_SHA256: die('baseline is not V229 0bec3ec:index.html (sha256 %s)' % hashlib.sha256(base_b).hexdigest())
if base_b.decode('utf-8').count('<meta name="ia-version" content="229">') != 1: die('baseline does not read ia-version 229')
for k, t in txt.items():
    if '[230]' in t: die(G[k] + ' already carries a [230] token')

WHY = ('V230 (D194 P-INJLENS part 2): ruled UNMOVED, reference to [229]; D194 R3′ (Amendment 1, '
       'tests/measure/v229_rulings/d194_injlens_ruling.md): "V230 (D194 part 2) is the lens alone." and "V230 moves two '
       'guards and two filter cfgs and nothing else."; the diff from V229 is the ia-version meta and four lines in '
       'applySessionSwaps and applySwapChoice onto `_dayPlanCfg`, buildProgram untouched; gatekeeper\'s identity fuzz '
       '(tests/measure/v230_rulings/v230_session_calls.md item 11): buildProgram + refreshProgram byte-identical V229 == '
       'V230 on 2,160 of 2,160 configs')
PRINTED = ('printed equal on the V230 candidate (ia-version 230, sha 72ac41c8d340) and on the V229 baseline (ia-version 229, '
           'sha d854af0a91f8) by builder with this gate before this row')

# (file key, row prefix, carry note)
EDITS = [
 ('g199', 'DELOAD_ARB_BY_VERSION',
  ' (' + PRINTED + ': C1 zero-posterior weeks 264, C3 non-deload 264, C5 deload-off 0, D2 byte-identical deload weeks 19, '
  'I3 Leg superset B killed by the cap 18; the [229] row carries)'),
 ('g199', 'E6_BY_VERSION',
  ' (' + PRINTED + ': E6 end-to-end 28; the [229] 28 carries)'),
 ('g199', 'DELOAD_HINGE_BY_VERSION',
  ' (' + PRINTED + ': E1a 12369, E1b 9319, E2 12369 -> 12369, E3 44, G1 1275, G2 1275, G5 {"Explosive finisher":44}; '
  'the [229] row carries)'),
 ('g219', 'ERA',
  ' (' + PRINTED + ': F1 Pec deck 3×12–15 @ RPE 6–7, F2 no twin, R1 dup 0, R2 li 0, R3 tgt 0, R4 ck 4770, R5 ckNo 891, '
  'R6 bic1 412, R7 c165 0, R8 c166 0; the [229] row carries)'),
]

new = dict(txt)
no229 = dict(txt)   # mirror source for the V229 print: the [229] rows removed, so V229 has no row and prints its figure
for k, m, carry in EDITS:
    a = '\n' + m + '[229] = ' + m + '[228];   // '
    n = new[k].count(a)
    print('ANCHOR %s %s[229] row count %d' % (G[k].split('/')[-1], m, n))
    if n != 1: die('anchor %r count %d in %s' % (a.strip(), n, G[k]))
    i = new[k].index(a) + 1
    j = new[k].index('\n', i)            # end of the [229] row
    row = m + '[230] = ' + m + '[229];   // ' + WHY + carry
    if '\\u' in row: die('a \\u escape was typed into a row')
    new[k] = new[k][:j + 1] + row + '\n' + new[k][j + 1:]
    if no229[k].count(a) != 1: die('no229 anchor %r count != 1' % a.strip())
    i2 = no229[k].index(a) + 1
    j2 = no229[k].index('\n', i2)
    no229[k] = no229[k][:i2] + no229[k][j2 + 1:]
    if (m + '[229]') in no229[k].replace('\n' + m + '[230]', ''):
        die('no229 mirror of %s still reads %s[229]' % (k, m))
    print('ROW ' + G[k].split('/')[-1] + ': ' + m + '[230]')

os.makedirs(SCR + '/tmp', exist_ok=True)
env = dict(os.environ, TMPDIR=SCR + '/tmp')

def run(gate_path, art):
    r = subprocess.run(['bash', '-c', 'set -eo pipefail; node "%s" "%s"' % (gate_path, art)],
                       capture_output=True, text=True, env=env, cwd=ROOT)
    out = r.stdout + r.stderr
    m = re.findall(r'^PASS (\d+) FAIL (\d+)\s*$', out, re.M)
    return out, (tuple(map(int, m[-1])) if m else None)

MIR = SCR + '/mirror/tests'
os.makedirs(MIR + '/gates', exist_ok=True)
for name, tgt in (('harness.js', ROOT + '/tests/harness.js'), ('measure', ROOT + '/tests/measure')):
    lp = MIR + '/' + name
    if not os.path.islink(lp): os.symlink(tgt, lp)
def mirror(k, body):
    mp = MIR + '/gates/' + G[k].split('/')[-1]
    open(mp, 'w', encoding='utf-8').write(body)
    return mp

def g199_val(n, l):
    if n == 'E2':
        mm = re.search(r': (\d+) -> (\d+)\. ', l); return mm and (mm.group(1) + ' -> ' + mm.group(2))
    if n == 'E6':
        mm = re.search(r'\): (\d+) deload day builds ship zero posterior', l); return mm and mm.group(1)
    mm = re.search(r'got (\{[^}]*\}|\d+)', l); return mm and mm.group(1)

def read199(o, s, tree):
    lines = {mm.group(1): mm.group(0) for mm in re.finditer(r'^  FAIL (\w+) .*$', o, re.M)}
    names = list(lines)
    if s != (43, 13) or sorted(names) != sorted(ROW229_G199):
        die('g199 no-row on %s: summary %r, fails %r (want 43/13 on %s only)' % (tree, s, names, ' '.join(sorted(ROW229_G199))))
    return {n: g199_val(n, lines[n]) for n in names}

def read219(o, s, tree, ver):
    fl = re.findall(r'^FAIL (\w+) .*\(NO ERA ROW for ia-version %d\) \(got (.*)\)\s*$' % ver, o, re.M)
    names = [f[0] for f in fl]
    allfail = re.findall(r'^FAIL (\w+) ', o, re.M)
    if s != (5, 10) or sorted(names) != sorted(ROW229_G219) or sorted(allfail) != sorted(names):
        die('g219 no-row on %s: summary %r, fails %r / %r (want 5/10 on %s only)' % (tree, s, names, allfail, ' '.join(sorted(ROW229_G219))))
    return {n: v.strip() for n, v in fl}

# ── 1. print each table's figure on both trees, no row on either ─────────────────────────
o30_199 = run(G['g199'], P);                  open(SCR + '/pre_v230_g199.out', 'w', encoding='utf-8').write(o30_199[0])
o30_219 = run(G['g219'], P);                  open(SCR + '/pre_v230_g219.out', 'w', encoding='utf-8').write(o30_219[0])
o29_199 = run(mirror('g199', no229['g199']), BASE); open(SCR + '/pre_v229_norow_g199.out', 'w', encoding='utf-8').write(o29_199[0])
o29_219 = run(mirror('g219', no229['g219']), BASE); open(SCR + '/pre_v229_norow_g219.out', 'w', encoding='utf-8').write(o29_219[0])
v30_199 = read199(*o30_199, tree='V230 candidate'); v29_199 = read199(*o29_199, tree='V229 baseline')
v30_219 = read219(*o30_219, tree='V230 candidate', ver=230); v29_219 = read219(*o29_219, tree='V229 baseline', ver=229)

parked = []
print('FIGURES g199 (V230 candidate | V229 baseline | [229] row), no row on either tree; summaries %r | %r' % (o30_199[1], o29_199[1]))
for t in ('DELOAD_ARB', 'DELOAD_HINGE', 'E6'):
    bad = []
    for n in [x for x in ROW229_G199 if TABLE_G199[x] == t]:
        eq = v30_199[n] == v29_199[n] == ROW229_G199[n]
        print('    %-12s %-4s %-26s | %-26s | %-26s %s' % (t, n, v30_199[n], v29_199[n], ROW229_G199[n], 'EQUAL' if eq else 'DIFFERS'))
        if not eq: bad.append(n)
    if bad: parked.append((TABLE_PREFIX[t], bad))
print('FIGURES g219 (V230 candidate | V229 baseline | ERA[229]), no row on either tree; summaries %r | %r' % (o30_219[1], o29_219[1]))
bad = []
for n in ROW229_G219:
    eq = v30_219[n] == v29_219[n] == ROW229_G219[n]
    print('    ERA          %-4s %-26s | %-26s | %-26s %s' % (n, v30_219[n], v29_219[n], ROW229_G219[n], 'EQUAL' if eq else 'DIFFERS'))
    if not eq: bad.append(n)
if bad: parked.append(('ERA', bad))
if parked:
    for m, b in parked:
        print('PARKED (class D, standing ruling 7): %s rows %s' % (m, ', '.join(b)))
    die('a figure moved; nothing written (the script stays in tests/edits/)')

# ── 2. a scratch mirror of each gate carrying exactly the bytes to be written ────────────
WANT = {'g199': (56, 0), 'g219': (15, 0)}
for k in G:
    o, s = run(mirror(k, new[k]), P)
    if s != WANT[k]: die('mirror %s with the rows on V230: summary %r, want %r\n%s' % (k, s, WANT[k], o[-3000:]))
    print('MIRROR %-5s with the rows on V230: PASS %d FAIL %d' % ((k,) + s))

# ── 3. write ─────────────────────────────────────────────────────────────────────────────
for k in G:
    open(G[k], 'w', encoding='utf-8').write(new[k])
    r = subprocess.run(['node', '--check', G[k]], capture_output=True, text=True)
    if r.returncode: die('node --check failed on ' + G[k] + ': ' + r.stderr)
    print('WROTE ' + G[k] + ' (node --check ok)')

# ── 4. after the write: each gate on the V230 candidate and on the V229 baseline ─────────
for k in G:
    for tree, art in (('V230 candidate', P), ('V229 baseline', BASE)):
        o, s = run(G[k], art)
        open(SCR + '/post_%s_%s.out' % ('v230' if art == P else 'v229', k), 'w', encoding='utf-8').write(o)
        print('POST %-5s on %s: %s' % (k, tree, ('PASS %d FAIL %d' % s) if s else 'NO SUMMARY'))
        if s != WANT[k]: die('post-write %s on %s: %r, want %r\n%s' % (k, tree, s, WANT[k], o[-2000:]))
print('OK: four [230]=[229] era rows written')
