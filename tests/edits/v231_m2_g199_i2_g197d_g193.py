#!/usr/bin/env python3
# V231 GATE MAINTENANCE RUN G2 (four edits, three files): the absorb ruling's slice G2.
# Precedent and form: tests/edits/v231_m1_harness_g199_arb_f2f3.py (this session): refusals; every figure printed on both
# trees before anything is written; a scratch mirror carrying exactly the bytes to be written; a row whose figure is not
# as ruled parks (standing ruling 7) and is not written; each row's comment cites its ruling (standing ruling 4).
# Ruling: tests/measure/v231_rulings/v231_absorb_ruling.md, slicing "G2: g199 I2 era + I2c/I2d SKIP; g197d E5 D195 era;
# g193 allowlist; g193 Function params." and its rows:
#   g199:627 I2 | ABSORB: `VER>=231 ? 0 : 108` | 0 | D196-4 | `IP.version>=231` | V230 108. I2c/I2d | RETIRE at >=231 to
#     SKIP lines (never PASS/FAIL). I2b unchanged (0).
#   g197d:389 | E5 | ABSORB: add era `cv >= 231` -> CSB_D195 = '5e8f2f07...', rule label 'D195'; older eras kept.
#   g193_pool_overlay | INSTRUMENT FIX (two edits): `_bwHTak`, `_bwHTlb` in the resolver's identifier allowlist and in the
#     `new Function` parameters, hand-transcribed from index.html:8445-8446.
# Edits:
#   G2a tests/gates/g199_deload_arbitration.js  I2 inline era on IP.version>=231 (0, V230 108); I2c and I2d print one named
#       SKIP line each at >=231 (the g228/g221 form: console.log('SKIP ' + ...), counted neither PASS nor FAIL); below 231
#       all three rows print V230's text byte for byte (one contiguous replacement of the four I2/I2c/I2d lines; I2b
#       untouched)
#   G2b tests/gates/g197d_d84_base.js           E5 era cv >= 231 -> CSB_D195, rule 'D195'; pre-D85, D85, D91 eras kept
#   G2c tests/gates/g193_pool_overlay.js        resolver allowlist += '_bwHTak','_bwHTlb'
#   G2d tests/gates/g193_pool_overlay.js        resolver hand-table constants + `new Function` parameters and arguments
# Refuse unless index.html is the V231 candidate (ia-version 231, sha 1249c248a6794d1c) and the baseline is V230
# (ia-version 230, sha 72ac41c8d34034ce); g199 differs from HEAD only by this session's E2/M1 rows; g197d and g193 are
# clean against HEAD; no target row exists; the ruling carries every quoted row; every anchor count==1.
import sys, os, re, subprocess, hashlib, json, shutil, difflib

ROOT = '/Users/CanasBangin/Desktop/TheBig6V2'
P = ROOT + '/index.html'
SCRROOT = '/private/tmp/claude-501/-Users-CanasBangin-Desktop-TheBig6V2/adf6a3cd-1bcb-472e-a3ec-2078adfbc3be/scratchpad'
SCR = SCRROOT + '/builder_m2'
BASE = SCRROOT + '/base_v230.html'
TB = SCRROOT + '/measure5/t_B.html'
CAND_SHA, BASE_SHA, TB_SHA = '1249c248a6794d1c', '72ac41c8d34034ce', 'b958d4b09b1181bc'
ABSORB = ROOT + '/tests/measure/v231_rulings/v231_absorb_ruling.md'
SUCC = ROOT + '/tests/gates/g231_d196_bwfallback.js'
HARN = ROOT + '/tests/harness.js'
F = {'g199': ROOT + '/tests/gates/g199_deload_arbitration.js',
     'g197d': ROOT + '/tests/gates/g197d_d84_base.js',
     'g193': ROOT + '/tests/gates/g193_pool_overlay.js'}
CSB_D195 = '5e8f2f07d1c52dfc01523f3613a66a4ac36b2c1c5849cd91567d322f99f5ddbd'
CSB_D91 = '36b5b8efdfa1d3d86e235654d17b3c28e5fd2161520901c9acc4ed02a0b80fc5'
CSB_B16 = '10a5806729632f09'
PREHAB = 'const _prehabHalf=new Set([].concat(EXLIB.hip_stability,EXLIB.knee_stability,EXLIB.foot_ankle,EXLIB.foot_ankle_bw)); const _cost='
SCORE_OLD = 'const score=sr*10+_itemRank(it.name);'
SCORE_NEW = "const score=(((ii>=3)&&/^leg circuit/i.test((s&&s.label)||''))?3:sr)*10+_itemRank(it.name);"
SRC_HTLB = "  const _bwHTlb=isBW?'Single-leg hip thrust (shoulders on bed)':'Banded hip thrust';"
SRC_HTAK = "  const _bwHTak=isBW?'Single-leg glute bridge':'Banded hip thrust';"
UNRES_3 = ['knee/protect hipExtPool', 'hip/workaround hingePool', 'shoulder/protect fullPushPool']
G193_CAND, G193_BASE = (223, 0), (220, 0)
SKIP_TXT = ("the renamer no longer lands Burpees on a posterior slot (D196); successor rows g231_d196_bwfallback "
            "D196-a/D196-c and this file's I2 at 0")

def die(msg):
    print('REFUSED: ' + msg)
    sys.exit(1)

src_b = open(P, 'rb').read(); src = src_b.decode('utf-8')
base_b = open(BASE, 'rb').read(); base = base_b.decode('utf-8')
txt = {k: open(v, encoding='utf-8').read() for k, v in F.items()}

# ── refusals ─────────────────────────────────────────────────────────────────────────────
if src.count('<meta name="ia-version" content=') != 1 or src.count('<meta name="ia-version" content="231">') != 1:
    die('index.html does not read ia-version 231 exactly once')
if base.count('<meta name="ia-version" content="230">') != 1: die('baseline does not read ia-version 230')
cs, bs = hashlib.sha256(src_b).hexdigest(), hashlib.sha256(base_b).hexdigest()
if not cs.startswith(CAND_SHA): die('index.html is not the V231 candidate (sha256 %s)' % cs)
if not bs.startswith(BASE_SHA): die('baseline is not V230 (sha256 %s)' % bs)
print('TREES candidate ia-version 231 sha %s | V230 baseline ia-version 230 sha %s' % (cs[:16], bs[:16]))

def head_delta(path):
    d = subprocess.run(['git', 'diff', '-U0', 'HEAD', '--', path], cwd=ROOT, capture_output=True, text=True).stdout
    return ([l[1:] for l in d.splitlines() if l.startswith('+') and not l.startswith('+++')],
            [l[1:] for l in d.splitlines() if l.startswith('-') and not l.startswith('---')])
ADD199 = ['DELOAD_ARB_BY_VERSION[231] = { capLSBkilled: 18, zeroWeeks: 240, zeroWeeksNonDeload: 240, zeroWeeksDeloadOff: 0, dlIdentical: 17 };   // ',
          'E6_BY_VERSION[231] = E6_BY_VERSION[230];   // ',
          'DELOAD_HINGE_BY_VERSION[231] = DELOAD_HINGE_BY_VERSION[230];   // ',
          '  // V231 era for F2 and F3 (',
          "  const F23_V231=IP.version>=231?",
          "  ok(g(N.lblP2all,'Leg superset B')===(IP.version>=231?15702:15720),",
          "  ok(g(N.lblP2all,'Leg superset A')+g(N.lblP2all,'Leg superset B')===(IP.version>=231?30246:30264),",
          "    'F3 ACCESSORY-BLOCK CONSERVATION: A + B after the deload == '+(IP.version>=231?"]
REM199 = ["  ok(g(N.lblP2all,'Leg superset B')===15720,",
          "  ok(g(N.lblP2all,'Leg superset A')+g(N.lblP2all,'Leg superset B')===30264,",
          "    'F3 ACCESSORY-BLOCK CONSERVATION: A + B after the deload == 30,264,"]
add, rem = head_delta(F['g199'])
if (len(add) != len(ADD199) or len(rem) != len(REM199) or any(not a.startswith(p) for a, p in zip(add, ADD199))
        or any(not r.startswith(p) for r, p in zip(rem, REM199))):
    die('g199 differs from HEAD by more than this session\'s E2/M1 rows: +%d -%d %r' % (len(add), len(rem), [a[:50] for a in add]))
print('CLEAN g199_deload_arbitration.js against HEAD except this session\'s rows (+%d -%d: DELOAD_ARB[231], E6[231], DELOAD_HINGE[231], F2/F3 era)' % (len(add), len(rem)))
for k in ('g197d', 'g193'):
    if subprocess.run(['git', 'diff', '--quiet', 'HEAD', '--', F[k]], cwd=ROOT).returncode: die('%s differs from HEAD' % F[k])
    print('CLEAN %s against HEAD' % F[k].split('/')[-1])
for k, tok in (('g199', 'I2_V231'), ('g199', 'SKIP I2c'), ('g199', '(I2_V231?0:108)'), ('g197d', 'CSB_D195'), ('g197d', 'preD195'),
               ('g193', '_bwHTak'), ('g193', '_bwHTlb')):
    if tok in txt[k]: die('%s already carries %r (a pre-existing target row)' % (F[k], tok))
ab = open(ABSORB, encoding='utf-8').read()
for need in ("- g199:627 I2 | ABSORB: `VER>=231 ? 0 : 108` | 0 | D196-4 | `IP.version>=231` | V230 108. The 108 cells printed: all 108 are `rem[Leg superset B :: Burpees] add[Leg superset B :: Single-leg hip thrust (shoulders on bed)]` on bodyweight lowback/protect",
             'I2c/I2d | RETIRE at ≥231 to SKIP lines (never PASS/FAIL): "' + SKIP_TXT + '". I2b unchanged (0).',
             "- g197d:389 | E5 | ABSORB: add era `cv >= 231` → `CSB_D195 = '" + CSB_D195 + "'`, rule label 'D195' (D195-B `_cost` + D195 Am. 2 A6); older eras kept | 5e8f2f07d1c52dfc (V230 36b5b8efdfa1d3d8…, B " + CSB_B16 + ")",
             "- g193_pool_overlay | INSTRUMENT FIX (two edits): add `_bwHTak`, `_bwHTlb` to the resolver's identifier allowlist and to the `new Function` parameters, hand-transcribed from `index.html:8445–8446` as `const _bwHTak = g.isBW ? 'Single-leg glute bridge' : 'Banded hip thrust'; const _bwHTlb = g.isBW ? 'Single-leg hip thrust (shoulders on bed)' : 'Banded hip thrust';`",
             'candidate `PASS 223 FAIL 0`, unresolved 3 (knee/protect hipExtPool, hip/workaround hingePool, shoulder/protect fullPushPool, the same three as V230), `DEBT thin-pool ankle/protect squatPool (1 gear tiers)` live again, no stale-debt failure; V230 under the same instrument `PASS 220 FAIL 0`, unresolved 3.',
             '- G2: g199 I2 era + I2c/I2d SKIP; g197d E5 D195 era; g193 allowlist; g193 Function params.',
             'Every absorbed row must FAIL on V230 by its stated conjunct and PASS on the candidate; every scoped row must PASS on V230 by its ≤230 branch and print SKIP (never FAIL) at 231.'):
    if ab.count(need) != 1: die('the absorb ruling does not carry %r exactly once' % need[:100])
succ = open(SUCC, encoding='utf-8').read()
if 'D196-a' not in succ or 'D196-c' not in succ: die('the successor gate g231_d196_bwfallback does not carry D196-a and D196-c')
L = src.split('\n')
if L[8444] != SRC_HTLB or L[8445] != SRC_HTAK or src.count(SRC_HTLB) != 1 or src.count(SRC_HTAK) != 1:
    die('index.html:8445-8446 are not the two hip-thrust literals the ruling transcribes: %r %r' % (L[8444], L[8445]))
if '_bwHTak' in base or '_bwHTlb' in base: die('V230 already names _bwHTak/_bwHTlb: the instrument fix would move V230')
print('RULING carries every quoted row; successor rows D196-a/D196-c exist; index.html:8445-8446 read the transcribed literals; V230 names neither identifier')

# ── anchors ──────────────────────────────────────────────────────────────────────────────
# G2a: the four I2 / I2c (two lines) / I2d lines, I2b after them untouched
T = txt['g199'].split('\n')
i0 = [i for i, l in enumerate(T) if l.startswith("  ok(N.swapReBudget===108,'I2 of the same 2,160, '")]
if len(i0) != 1: die('g199 I2 line count %d' % len(i0))
i0 = i0[0]
I2L, I2cL1, I2cL2, I2dL, I2bL = T[i0:i0 + 5]
if not (I2L.endswith(');') and I2cL1 == "  ok(g(N.reBudRename,'Leg superset B: Banded hip thrust -> Burpees')===N.swapReBudget,"
        and I2cL2.startswith("    'I2c and the cause is named, once, for all '") and I2cL2.endswith(');')
        and I2dL.startswith("  ok(g(N.reBudTier,'bodyweight')===N.swapReBudget,'I2d every one of them is on the bodyweight tier") and I2dL.endswith(');')
        and I2bL.startswith("  ok(N.swapReBudgetWeekZero===0,'I2b and not one of those '")):
    die('g199 I2/I2c/I2d/I2b lines are not in the expected shape')
OLD_I2 = '\n'.join([I2L, I2cL1, I2cL2, I2dL]) + '\n'
MSG_I2_OLD = I2L[len('  ok(N.swapReBudget===108,'):-2]
# G2b: the E5 era block
OLD_E5 = txt['g197d'][txt['g197d'].index("  const CSB_D91 = '"):]
OLD_E5 = OLD_E5[:OLD_E5.index("// the ruling that licenses THIS era's text\n") + len("// the ruling that licenses THIS era's text\n")]
# G2c / G2d
OLD_AL = ("    !['hasBarbell','hasCables','hasDumbbells','isCrossfit','hasGHD','isBW','_gear','_floorPool','_bw','filter','test','n','i','indexOf','length','RX','slice'].includes(id));\n")
OLD_FN = ("  const _bw = (bw, other) => (g.isBW ? bw : other);\n"
          "  try {\n"
          "    const f = new Function('hasBarbell','hasCables','hasDumbbells','isCrossfit','hasGHD','isBW','_gear','_floorPool','_bw',\n"
          "      'return (' + src + ');');\n"
          "    const v = f(g.hasBarbell, g.hasCables, g.hasDumbbells, g.isCrossfit, g.hasGHD, g.isBW, _gear, _floorPool, _bw);\n")
for k, a, nm in (('g199', OLD_I2, 'I2+I2c+I2d (four lines)'), ('g197d', OLD_E5, 'E5 era block (CSB_D91 .. rule)'),
                 ('g193', OLD_AL, 'resolver allowlist line'), ('g193', OLD_FN, 'resolver _bw + new Function block')):
    n = txt[k].count(a)
    print('ANCHOR %s %s count %d' % (F[k].split('/')[-1], nm, n))
    if n != 1: die('anchor %s count %d' % (nm, n))
if OLD_E5.count("const want = preD85 ? CSB_PRE : (preD91 ? CSB_D85 : CSB_D91);") != 1: die('E5 want line not in the block')

# ── figures 1: E5's slice, by the gate's own method (slice + sha256) ─────────────────────
def slc(s, a, b):
    i = s.find(a)
    if i < 0: return None
    j = s.find(b, i)
    return None if j < 0 else s[i:j]
CSB_A, CSB_Z = 'function capSessionBudget(sections, cardio){', '\nfunction capRegionalFatigue'
def h(s): return None if s is None else hashlib.sha256(s.encode('utf-8')).hexdigest()
cC, cB = slc(src, CSB_A, CSB_Z), slc(base, CSB_A, CSB_Z)
hC, hB = h(cC), h(cB)
hT = None
if os.path.exists(TB):
    tb_b = open(TB, 'rb').read()
    if hashlib.sha256(tb_b).hexdigest().startswith(TB_SHA): hT = h(slc(tb_b.decode('utf-8'), CSB_A, CSB_Z))
print('FIG  E5 capSessionBudget sha256: candidate %s | V230 %s | B-alone tree %s' % (hC, hB, hT or 'not read'))
PARK = {}
if hC != CSB_D195: PARK['E5'] = 'candidate digest %s, the ruling says %s' % (hC, CSB_D195)
elif hB != CSB_D91: PARK['E5'] = 'V230 digest %s is not the D91 text %s' % (hB, CSB_D91)
elif hT is not None and not hT.startswith(CSB_B16): PARK['E5'] = 'B-alone digest %s, the ruling says %s' % (hT, CSB_B16)
lb, lc = cB.split('\n'), cC.split('\n')
ops = [o for o in difflib.SequenceMatcher(None, lb, lc, autojunk=False).get_opcodes() if o[0] != 'equal']
pairs = []
for tag, a1, a2, b1, b2 in ops:
    print('FIG  E5 slice diff %s V230[%d:%d] -> candidate[%d:%d]' % (tag, a1, a2, b1, b2))
    for x in lb[a1:a2]: print('       - ' + x.strip()[:260])
    for x in lc[b1:b2]: print('       + ' + x.strip()[:260])
    if tag == 'replace' and a2 - a1 == 1 and b2 - b1 == 1: pairs.append((lb[a1], lc[b1]))
two = (len(ops) == 2 and len(pairs) == 2
       and pairs[0][0].strip().startswith('const _cost=') and pairs[0][1].strip().startswith(PREHAB)
       and pairs[0][0][:len(pairs[0][0]) - len(pairs[0][0].lstrip())] == pairs[0][1][:len(pairs[0][1]) - len(pairs[0][1].lstrip())]
       and pairs[1][0].strip() == SCORE_OLD and pairs[1][1].strip() == SCORE_NEW)
print('FIG  E5 slice: %d V230 lines, %d candidate lines, exactly the two ruled lines move: %s' % (len(lb), len(lc), 'yes' if two else 'NO'))
if 'E5' not in PARK and not two: PARK['E5'] = 'the slice diff is not exactly the two ruled lines'
for nm, a, b in (('_itemCost', 'function _itemCost(it, sectionRegion){', '\n// ── RECOVERY-WEEK VOLUME DELOAD'), ('_setCount', 'function _setCount(detail){', '\nfunction _itemCost')):
    x, y = slc(src, a, b), slc(base, a, b)
    print('FIG  E5 %s byte-identical candidate vs V230: %s' % (nm, 'yes' if (x and x == y) else 'NO'))
    if 'E5' not in PARK and not (x and x == y): PARK['E5'] = '%s differs between the trees' % nm

# ── gate runner ──────────────────────────────────────────────────────────────────────────
os.makedirs(SCR + '/tmp', exist_ok=True)
env = dict(os.environ, TMPDIR=SCR + '/tmp')
def summ(o):
    m = re.findall(r'^PASS (\d+) FAIL (\d+)\s*$', o, re.M)
    return tuple(map(int, m[-1])) if m else None
def run_many(jobs):
    ps = []
    for g, art, b in jobs:
        cmd = 'set -eo pipefail; node "%s" "%s"%s' % (g, art, (' "%s"' % b) if b else '')
        ps.append(subprocess.Popen(['bash', '-c', cmd], stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, env=env, cwd=ROOT))
    out = []
    for p in ps:
        o, _ = p.communicate(); out.append((o, summ(o)))
    return out
def sstr(s): return ('PASS %d FAIL %d' % s) if s else 'NO SUMMARY (crash)'
def fails(k, o):
    if k == 'g199': return re.findall(r'^  FAIL (\S+) ', o, re.M)
    if k == 'g197d': return re.findall(r'^FAIL (\S+)', o, re.M)
    return [l for l in o.splitlines() if l.startswith('FAIL ')]
def one(pat, o, what):
    f = re.findall(pat, o, re.M)
    if len(f) != 1: die('cannot read %s (%d matches)' % (what, len(f)))
    return f[0]
def i2(o):
    return {'I2': one(r'^  (ok   |FAIL )I2 of the same 2,160, (\d+) cells', o, 'I2'),
            'I2c': one(r'^  (ok   |FAIL )I2c and the cause is named, once, for all (\d+): (.*)$', o, 'I2c'),
            'I2d': one(r'^  (ok   |FAIL )I2d every one of them is on the bodyweight tier \((.*?)\)\. ', o, 'I2d'),
            'I2b': one(r'^  (ok   |FAIL )I2b and not one of those (\d+) cells leaves its WEEK without posterior \((\d+)\)', o, 'I2b')}
def unres(o):
    n = re.findall(r'^unresolved assignments \(not statically evaluable, NOT counted as passes\): (\d+)$', o, re.M)
    return (int(n[0]) if n else 0), re.findall(r'^   - (.*)$', o, re.M)
DEBT_RX = r'^DEBT thin-pool ankle/protect squatPool\s+\(1 gear tiers\)$'
def hsha(): return hashlib.sha256(open(HARN, 'rb').read()).hexdigest()[:16]
def jobs(gs):
    return [(gs['g199'], P, BASE), (gs['g199'], BASE, None), (gs['g197d'], P, BASE), (gs['g197d'], BASE, None),
            (gs['g193'], P, BASE), (gs['g193'], BASE, None)]
def pack(r): return {'g199': (r[0], r[1]), 'g197d': (r[2], r[3]), 'g193': (r[4], r[5])}

# ── figures 2: the three gates as they stand, on both trees ──────────────────────────────
H0 = hsha()
PRE = pack(run_many(jobs(F)))
print('PRE  harness.js sha %s' % H0)
for k in F:
    (oc, sc), (ob, sb) = PRE[k]
    print('PRE  %-5s candidate (V230 as argv[3]): %s%s | V230 as the candidate: %s'
          % (k, sstr(sc), (' on ' + ' | '.join(x[:90] for x in fails(k, oc))) if fails(k, oc) else '', sstr(sb)))
    if not sb or sb[1] != 0: die('%s on V230 is not green before the edit\n%s' % (k, ob[-2500:]))
    if sc is None: die('%s on the candidate: no summary (crash)\n%s' % (k, oc[-2500:]))
if fails('g199', PRE['g199'][0][0]) != ['I2']: die('g199 on the candidate fails %r, want I2 only' % fails('g199', PRE['g199'][0][0]))
if fails('g197d', PRE['g197d'][0][0]) != ['E5']: die('g197d on the candidate fails %r, want E5 only' % fails('g197d', PRE['g197d'][0][0]))
if sum(PRE['g199'][0][1]) != sum(PRE['g199'][1][1]): die('g199 row totals differ between the trees before the edit')
XC, XB = i2(PRE['g199'][0][0]), i2(PRE['g199'][1][0])
for nmT, X in (('candidate', XC), ('V230 base', XB)):
    print('FIG  g199 %s: I2 %s %s | I2c %s %s (%s) | I2d %s (%s) | I2b %s %s cells, %s weeks'
          % (nmT, X['I2'][0].strip(), X['I2'][1], X['I2c'][0].strip(), X['I2c'][1], X['I2c'][2][-160:], X['I2d'][0].strip(), X['I2d'][1],
             X['I2b'][0].strip(), X['I2b'][1], X['I2b'][2]))
if XC['I2'][1] != '0': PARK['I2'] = 'candidate I2 reads %s, the ruling says 0' % XC['I2'][1]
elif XB['I2'][1] != '108' or XB['I2'][0].strip() != 'ok': PARK['I2'] = 'V230 I2 reads %s %s, V230 is 108' % XB['I2']
elif XB['I2c'][0].strip() != 'ok' or XB['I2d'][0].strip() != 'ok' or 'Leg superset B: Banded hip thrust -> Burpees' not in XB['I2c'][2]:
    PARK['I2'] = 'V230 I2c/I2d are not ok on the Banded hip thrust -> Burpees rename'
elif XC['I2b'][0].strip() != 'ok' or XB['I2b'][0].strip() != 'ok' or XC['I2b'][2] != '0' or XB['I2b'][2] != '0':
    PARK['I2'] = 'I2b is not ok at 0 on both trees'
eC = one(r'^FAIL E5 capSessionBudget is byte-for-byte the D91 \(V199\) licensed text .*digest ([0-9a-f]{16}) != licensed ([0-9a-f]{16}).*$', PRE['g197d'][0][0], 'E5 candidate')
eB = one(r'^ok   (E5 capSessionBudget is byte-for-byte the D91 \(V199\) licensed text .*)$', PRE['g197d'][1][0], 'E5 V230')
print('FIG  g197d E5 candidate FAIL digest %s != licensed %s | V230: ok %s' % (eC[0], eC[1], eB[:110]))
if 'E5' not in PARK and eC[0] != CSB_D195[:16]: PARK['E5'] = 'the gate prints candidate digest %s' % eC[0]
uC, uB = unres(PRE['g193'][0][0]), unres(PRE['g193'][1][0])
print('FIG  g193 candidate %s unresolved %d (%s) | V230 %s unresolved %d (%s)'
      % (sstr(PRE['g193'][0][1]), uC[0], ', '.join(uC[1]), sstr(PRE['g193'][1][1]), uB[0], ', '.join(uB[1])))
print('FIG  conjuncts on V230: I2 at 231 wants 0, V230 reads %s; E5 at 231 wants %s, V230 hashes %s' % (XB['I2'][1], CSB_D195[:16], (hB or '')[:16]))
for r, why in PARK.items(): print('PARK %s (standing ruling 7): %s' % (r, why))

# ── the replacements ─────────────────────────────────────────────────────────────────────
RUL = 'tests/measure/v231_rulings/v231_absorb_ruling.md'
NEW_I2 = (
    "  // V231 era for I2, and I2c/I2d retired at 231 (" + RUL + ", the g199:627 I2 row: \"ABSORB: `VER>=231 ? 0 : 108` | 0 | "
    "D196-4 | `IP.version>=231` | V230 108\" and \"I2c/I2d | RETIRE at ≥231 to SKIP lines (never PASS/FAIL)\"), a predicate on "
    "today's ia-version (standing ruling 2), keyed to D196 P-BWFALLBACK (standing ruling 4): the 108 V230 cells are all "
    "rem[Leg superset B :: Burpees] add[Leg superset B :: Single-leg hip thrust (shoulders on bed)] on bodyweight lowback/protect, "
    "so the post-build rename I2c and I2d named no longer happens; printed by builder with this gate before this edit: I2 "
    + XC['I2'][1] + " on the V231 candidate (sha " + cs[:12] + "), " + XB['I2'][1] + " on the V230 baseline (sha " + bs[:12] +
    "). I2b is unchanged. Below 231 all three rows print V230's text byte for byte; at 231 I2c and I2d print one named SKIP "
    "line each (the g228 form), never PASS and never FAIL.\n"
    "  const I2_V231=IP.version>=231, I2_SKIP=r=>'SKIP '+r+': RETIRED at ia-version '+IP.version+' (era 230 and below): '+\""
    + SKIP_TXT + " (" + RUL + ", the g199:627 I2 row). Never PASS, never FAIL.\";\n"
    "  ok(N.swapReBudget===(I2_V231?0:108),I2_V231?('I2 of the same 2,160, '+N.swapReBudget+' cells reach the SHIPPED card with "
    "no posterior left (V231 era, D196 P-BWFALLBACK: V230 shipped 108, every one the Leg superset B Banded hip thrust renamed "
    "to Burpees after capSessionBudget on bodyweight lowback/protect; the V231 card carries Single-leg hip thrust (shoulders on "
    "bed) there). I2c and I2d are retired at 231'):(" + MSG_I2_OLD + "));\n"
    "  if(I2_V231) console.log(I2_SKIP('I2c')); else " + I2cL1.lstrip() + "\n" + I2cL2 + "\n"
    "  if(I2_V231) console.log(I2_SKIP('I2d')); else " + I2dL.lstrip() + "\n")
tb_txt = ('the B-alone tree (measure5/t_B.html, sha ' + TB_SHA + ') ' + hT[:16]) if hT else 'the B-alone tree not read'
NEW_E5_HEAD = (
    "  //   CSB_D195 — V231, the text LICENSED BY RULING D195 (D195-B `_cost` + D195 Amendment 2 A6; " + RUL + ", the g197d:389\n"
    "  //              E5 row: \"add era `cv >= 231` → `CSB_D195`, rule label 'D195' ...; older eras kept\"). Exactly two\n"
    "  //              lines of the slice move from the D91 text: `const _cost=…` gains the `_prehabHalf` set in front of it,\n"
    "  //              and `const score=sr*10+…` scores a Leg circuit item at ii>=3 as 3. Printed by builder with this gate's\n"
    "  //              own slice and sha256 before this edit: candidate (ia-version 231, sha " + cs[:12] + ") " + (hC or '')[:16] + ",\n"
    "  //              V230 (sha " + bs[:12] + ") " + (hB or '')[:16] + " (the D91 text), " + tb_txt + ".\n"
    "  //              CSB_D91 stays accepted for 199..230, so V230 keeps hashing to its own era.\n"
    "  const CSB_D195 = '" + CSB_D195 + "';\n")
NEW_E5 = NEW_E5_HEAD + OLD_E5
NEW_E5 = NEW_E5.replace(
    "  const preD91 = cv !== null && cv < 199;        // V198: allowed the D85 text\n",
    "  const preD91 = cv !== null && cv < 199;        // V198: allowed the D85 text\n"
    "  const preD195 = cv !== null && cv < 231;       // V199..V230: allowed the D91 text (the D195 era is cv >= 231)\n", 1)
NEW_E5 = NEW_E5.replace(
    "  const want = preD85 ? CSB_PRE : (preD91 ? CSB_D85 : CSB_D91);\n",
    "  const want = preD85 ? CSB_PRE : (preD91 ? CSB_D85 : (preD195 ? CSB_D91 : CSB_D195));\n", 1)
NEW_E5 = NEW_E5.replace(
    "  const era  = preD85 ? 'pre-D85' : (preD91 ? 'D85 (V198)' : 'D91 (V199)');\n",
    "  const era  = preD85 ? 'pre-D85' : (preD91 ? 'D85 (V198)' : (preD195 ? 'D91 (V199)' : 'D195 (V231)'));\n", 1)
NEW_E5 = NEW_E5.replace(
    "  const rule = preD91 ? 'D85' : 'D91';           // the ruling that licenses THIS era's text\n",
    "  const rule = preD91 ? 'D85' : (preD195 ? 'D91' : 'D195');   // the ruling that licenses THIS era's text\n", 1)
if NEW_E5.count('preD195') != 4: die('E5 era block: the D195 era did not land on all four lines (%d)' % NEW_E5.count('preD195'))
NEW_AL = OLD_AL.replace("'_bw','filter',", "'_bw','_bwHTak','_bwHTlb','filter',", 1)
NEW_FN = ("  const _bw = (bw, other) => (g.isBW ? bw : other);\n"
          "  // V231 INSTRUMENT FIX (" + RUL + ", the g193_pool_overlay row): the two hip-thrust literals D195/D196 name in\n"
          "  // pool expressions, hand-transcribed from index.html:8445–8446 (tier and lens predicates are a hand table, never\n"
          "  // read from a build). V230 names neither, so V230 resolves exactly as before.\n"
          "  const _bwHTak = g.isBW ? 'Single-leg glute bridge' : 'Banded hip thrust';\n"
          "  const _bwHTlb = g.isBW ? 'Single-leg hip thrust (shoulders on bed)' : 'Banded hip thrust';\n"
          "  try {\n"
          "    const f = new Function('hasBarbell','hasCables','hasDumbbells','isCrossfit','hasGHD','isBW','_gear','_floorPool','_bw','_bwHTak','_bwHTlb',\n"
          "      'return (' + src + ');');\n"
          "    const v = f(g.hasBarbell, g.hasCables, g.hasDumbbells, g.isCrossfit, g.hasGHD, g.isBW, _gear, _floorPool, _bw, _bwHTak, _bwHTlb);\n")
for s in (NEW_I2, NEW_E5, NEW_AL, NEW_FN):
    if chr(92) + 'u' in s: die('a \\u escape was typed into a replacement')
NEW = dict(txt)
if 'I2' not in PARK: NEW['g199'] = txt['g199'].replace(OLD_I2, NEW_I2, 1)
if 'E5' not in PARK: NEW['g197d'] = txt['g197d'].replace(OLD_E5, NEW_E5, 1)
NEW['g193'] = txt['g193'].replace(OLD_AL, NEW_AL, 1).replace(OLD_FN, NEW_FN, 1)

# ── expectations with the edit ───────────────────────────────────────────────────────────
def check(k, R, stage):
    (oc, sc), (ob, sb) = R[k]
    bad = []
    if ob != PRE[k][1][0]: bad.append('V230 output moved')
    if sc is None: return bad + ['candidate crash']
    fl = fails(k, oc)
    if k == 'g199':
        if 'I2' in PARK: return bad + ([] if fl == ['I2'] else ['fails %r' % fl])
        sk = re.findall(r'^SKIP (I2[cd]): RETIRED at ia-version 231 ', oc, re.M)
        x = re.findall(r'^  (ok   |FAIL )I2 of the same 2,160, (\d+) cells', oc, re.M)
        if fl: bad.append('fails %r' % fl)
        if sk != ['I2c', 'I2d']: bad.append('SKIP lines %r' % sk)
        if x != [('ok   ', '0')]: bad.append('I2 %r' % x)
        if re.findall(r'^  (?:ok   |FAIL )I2[cd] ', oc, re.M): bad.append('I2c/I2d still assert')
        if sc[0] != PRE[k][1][1][0] - 2: bad.append('PASS %d, want V230 %d - 2' % (sc[0], PRE[k][1][1][0]))
    elif k == 'g197d':
        if 'E5' in PARK: return bad + ([] if fl == ['E5'] else ['fails %r' % fl])
        if fl: bad.append('fails %r' % fl)
        if len(re.findall(r"^ok   E5 capSessionBudget is byte-for-byte the D195 \(V231\) licensed text \(licensing ruling D195; ", oc, re.M)) != 1:
            bad.append('E5 not ok on the D195 era')
        if sum(sc) != sum(PRE[k][0][1]): bad.append('row total moved')
    else:
        n, us = unres(oc)
        if sc != G193_CAND: bad.append('candidate %s, ruled PASS 223 FAIL 0' % sstr(sc))
        if n != 3 or sorted(us) != sorted(UNRES_3): bad.append('unresolved %d %r' % (n, us))
        if len(re.findall(DEBT_RX, oc, re.M)) != 1: bad.append('DEBT thin-pool ankle/protect squatPool line absent')
        if 'stale debt' in oc: bad.append('stale debt')
        nb, ub = unres(ob)
        if sb != G193_BASE or nb != 3 or sorted(ub) != sorted(UNRES_3): bad.append('V230 %s unresolved %d' % (sstr(sb), nb))
    return bad

# ── a scratch mirror carrying exactly the bytes to be written, on both trees ─────────────
MR = SCR + '/mirror'
if os.path.isdir(MR): shutil.rmtree(MR)
os.makedirs(MR + '/tests/gates')
os.symlink(HARN, MR + '/tests/harness.js')
os.symlink(ROOT + '/tests/measure', MR + '/tests/measure')
os.symlink(ROOT + '/baselines', MR + '/baselines')
os.symlink(ROOT + '/tests/gates/g193_pool_overlay_debt.txt', MR + '/tests/gates/g193_pool_overlay_debt.txt')
MF = {}
for k in F:
    MF[k] = MR + '/tests/gates/' + F[k].split('/')[-1]
    open(MF[k], 'w', encoding='utf-8').write(NEW[k])
    r = subprocess.run(['node', '--check', MF[k]], capture_output=True, text=True)
    if r.returncode: die('node --check failed on the mirror of %s: %s' % (k, r.stderr))
MIR = pack([(o.replace(MR, ROOT), sm) for o, sm in run_many(jobs(MF))])   # the mirror's own path normalised to the repo's
for k in F:
    (oc, sc), (ob, sb) = MIR[k]
    b = check(k, MIR, 'mirror')
    print('MIRROR %-5s candidate %s | V230 %s, V230 output byte-identical to before: %s%s'
          % (k, sstr(sc), sstr(sb), 'yes' if ob == PRE[k][1][0] else 'NO', (' | NOT AS RULED: ' + '; '.join(b)) if b else ''))
    if b:
        row = {'g199': 'I2', 'g197d': 'E5', 'g193': 'G193'}[k]
        PARK[row] = 'mirror: ' + '; '.join(b); NEW[k] = txt[k]
        print('PARK %s (standing ruling 7): %s' % (row, PARK[row]))
        print(oc[-2000:])
if all(NEW[k] == txt[k] for k in F): die('every row parked; nothing is written')

# ── write once ───────────────────────────────────────────────────────────────────────────
for k in F:
    if NEW[k] == txt[k]: continue
    open(F[k], 'w', encoding='utf-8').write(NEW[k])
    r = subprocess.run(['node', '--check', F[k]], capture_output=True, text=True)
    if r.returncode: die('node --check failed on ' + F[k] + ': ' + r.stderr)
    print('WROTE ' + F[k] + ' (node --check ok)')

# ── after the write ──────────────────────────────────────────────────────────────────────
POST = pack(run_many(jobs(F)))
H1 = hsha()
print('POST harness.js sha %s (%s)' % (H1, 'unchanged since PRE' if H1 == H0 else 'MOVED since PRE: another builder edited it'))
allbad = []
for k in F:
    (oc, sc), (ob, sb) = POST[k]
    print('POST %-5s on candidate (V230 as argv[3]): %s' % (k, sstr(sc)))
    print('POST %-5s on V230 as the candidate:     %s' % (k, sstr(sb)))
    for l in [l for l in (oc + ob).splitlines() if re.match(r'^\s*FAIL ', l)]: print('       ' + l[:240])
    for l in re.findall(r'^SKIP .*$', oc, re.M): print('       ' + l[:300])
    if k == 'g193':
        n, us = unres(oc); print('       candidate unresolved %d: %s | DEBT line: %s' % (n, ', '.join(us), ' | '.join(re.findall(DEBT_RX, oc, re.M))))
    dd = [l for l in zip(ob.splitlines(), PRE[k][1][0].splitlines()) if l[0] != l[1]]
    print('POST %-5s V230 output vs before the write: byte-identical %s (%d differing lines)%s; candidate output == mirror: %s'
          % (k, 'yes' if ob == PRE[k][1][0] else 'NO', len(dd), (' first %r' % (dd[0],))[:300] if dd else '', 'yes' if oc == MIR[k][0][0] else 'no'))
    b = check(k, POST, 'post')
    if b: allbad.append('%s: %s' % (k, '; '.join(b)))
if PARK: print('PARKED rows (not written): ' + '; '.join('%s (%s)' % kv for kv in PARK.items()))
if allbad: die('written, but not as expected after the write: %r (standing ruling 7: report, nothing committed)' % allbad)
print('OK: written %s; g199, g197d, g193_pool_overlay green on both trees' % ', '.join(k for k in F if NEW[k] != txt[k]))
