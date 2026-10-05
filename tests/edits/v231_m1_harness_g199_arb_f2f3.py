#!/usr/bin/env python3
# V231 GATE MAINTENANCE RUN G1 (four edits, two files): the absorb ruling's slice G1.
# Precedent and form: tests/edits/v231_e1_era_harness_g193_g200_g219.py and tests/edits/v231_e2_era_g197b_g199.py (this
# session): refusals; every figure printed on both trees before anything is written; a row whose figure is not as ruled
# parks (standing ruling 7) and is not written; each row's comment cites its ruling.
# Rulings (standing ruling 4: each row is keyed to the ruling it defends; standing ruling 5: HALF_MANNY and its
# counterfactual arms move only by a ruling that printed the digest first):
#   ABSORB  tests/measure/v231_rulings/v231_absorb_ruling.md, section 1 (harness era rows), section 2 (DELOAD_ARB) and the
#           g199 F2/F3 row of section 3; slicing "G1: harness `MANNY_DELOAD_OFF[231]` literal; harness `MANNY_CORE_OFF[231]`
#           literal; g199 `DELOAD_ARB_BY_VERSION[231]` literal; g199 F2/F3 era literals."
#   RERUL   tests/measure/v231_rulings/v231_reruling_d195a2_d196a1_d197a1.md: D195 Amendment 2 (class A-1, the fourth
#           runner-armor item) and D196 Amendment 1 (D196-1 extended to `Primer —`; D196-2 re-draw); it supersedes A1–A4 of
#           tests/measure/v231_rulings/v231_ruling_d196_d195a1_d197.md, whose D196 and D197 surgery and D195-B stand.
#   M18     tests/measure/v231_rulings/measure_gate_candidate_m18.md printed the same figures on the candidate.
# Edits:
#   M1a tests/harness.js                       MANNY_DELOAD_OFF_DIGEST_BY_VERSION[231] = '145c60296526a949'  (LITERAL, ruled MOVE)
#   M1b tests/harness.js                       MANNY_CORE_OFF_DIGEST_BY_VERSION[231]   = '5770a4b1c4e2404d'  (LITERAL, ruled MOVE)
#   M1c tests/gates/g199_deload_arbitration.js DELOAD_ARB_BY_VERSION[231] = { 18, 240, 240, 0, 17 }      (LITERAL, ruled MOVE)
#   M1d tests/gates/g199_deload_arbitration.js F2 / F3 inline era on IP.version>=231: 15702 / 30246 (V230 15720 / 30264)
#       (F2 and F3 are adjacent: one contiguous replacement; below 231 both rows print V230's text byte for byte)
# Order: refuse unless index.html is the V231 candidate (ia-version 231, sha 1249c248a6794d1c) and the baseline is V230
# (ia-version 230, sha 72ac41c8d34034ce); both target files differ from HEAD only by this session's E1/E2 rows; no target
# row exists yet; the ruling and M18 carry what the comments quote; every anchor count==1. Print, before writing:
#   the three HALF_MANNY arms on both trees (shipped and deload-off by g199's B1/B2 method, shipped and core-off by
#   g200_core_tier's F1b/F1a CLAUSE-strip method), each built twice (self-stable), the clause count, the 12-Tuesday day
#   diff of each counterfactual arm vs V230's arm, and the shipped-vs-arm deltas on each tree;
#   g199's own C1 C3 C5 C6 D2 I3 F1 F2 F3 B1 B2 figures and g200_core_tier's F0 F1a F1b on both trees, before the rows.
# Then a scratch mirror carrying exactly the bytes to be written must reproduce V230's counts on V230 and, on the
# candidate, the pre-write failing set minus the readers of the rows written; then write once, node --check, re-run.
import sys, os, re, subprocess, hashlib, json, collections, shutil

ROOT = '/Users/CanasBangin/Desktop/TheBig6V2'
P = ROOT + '/index.html'
SCR = '/private/tmp/claude-501/-Users-CanasBangin-Desktop-TheBig6V2/adf6a3cd-1bcb-472e-a3ec-2078adfbc3be/scratchpad/builder_m1'
BASE = '/private/tmp/claude-501/-Users-CanasBangin-Desktop-TheBig6V2/adf6a3cd-1bcb-472e-a3ec-2078adfbc3be/scratchpad/base_v230.html'
CAND_SHA = '1249c248a6794d1c'
BASE_SHA = '72ac41c8d34034ce'
ABSORB = ROOT + '/tests/measure/v231_rulings/v231_absorb_ruling.md'
RERUL = ROOT + '/tests/measure/v231_rulings/v231_reruling_d195a2_d196a1_d197a1.md'
M18 = ROOT + '/tests/measure/v231_rulings/measure_gate_candidate_m18.md'
F = {'harness': ROOT + '/tests/harness.js',
     'g199': ROOT + '/tests/gates/g199_deload_arbitration.js'}
G200C = ROOT + '/tests/gates/g200_core_tier.js'
SH_231, SH_230 = '2d35e8f743680cfa', '0ac7da6b1691a8e1'
DO_231, DO_230 = '145c60296526a949', '1069cd7f86eed204'
CO_231, CO_230 = '5770a4b1c4e2404d', '9d14801a63111081'
ARB_231 = {'capLSBkilled': 18, 'zeroWeeks': 240, 'zeroWeeksNonDeload': 240, 'zeroWeeksDeloadOff': 0, 'dlIdentical': 17}
ARB_230 = {'capLSBkilled': 18, 'zeroWeeks': 264, 'zeroWeeksNonDeload': 264, 'zeroWeeksDeloadOff': 0, 'dlIdentical': 19}
ARB_LIT = '{ capLSBkilled: 18, zeroWeeks: 240, zeroWeeksNonDeload: 240, zeroWeeksDeloadOff: 0, dlIdentical: 17 }'
F2_231, F2_230, F3_231, F3_230 = 15702, 15720, 30246, 30264
HT = 'Single-leg hip thrust'
DETAIL = '2×6–10 each @ RPE 7'
CIRCUIT = 'Leg circuit — runner armor'
NEW_ITEM = CIRCUIT + ' :: ' + HT + ' :: ' + DETAIL
WANT_12 = ['W%d tue' % w for w in range(1, 13)]
WANT_OFF_DELTA = ['W4 mon', 'W4 tue', 'W4 thu', 'W8 mon', 'W8 tue', 'W8 thu', 'W12 mon', 'W12 tue', 'W12 thu', 'W12 fri']
WANT_CORE_DELTA = ['W11 mon']
# readers of each row (the gates' own consumers): B2 reads MANNY_DELOAD_OFF; g200_core_tier F1a reads MANNY_CORE_OFF;
# C1 C3 C5 D2 I3 read DELOAD_ARB; F2 F3 are the inline era.
READERS = {'DO': ('g199', ['B2']), 'CO': ('g200c', ['F1a']), 'ARB': ('g199', ['C1', 'C3', 'C5', 'D2', 'I3']),
           'F23': ('g199', ['F2', 'F3'])}
# the candidate's g199 rows a later run handles (absorb ruling slice G2: I2 era, I2c/I2d SKIP)
LATER = {'I2', 'I2c', 'I2d'}

def die(msg):
    print('REFUSED: ' + msg)
    sys.exit(1)

src_b = open(P, 'rb').read()
src = src_b.decode('utf-8')
base_b = open(BASE, 'rb').read()
txt = {k: open(v, encoding='utf-8').read() for k, v in F.items()}
g200c_txt = open(G200C, encoding='utf-8').read()

# ── refusals ─────────────────────────────────────────────────────────────────────────────
if src.count('<meta name="ia-version" content=') != 1: die('index.html: not exactly one ia-version meta')
if src.count('<meta name="ia-version" content="231">') != 1: die('index.html does not read ia-version 231')
cs, bs = hashlib.sha256(src_b).hexdigest(), hashlib.sha256(base_b).hexdigest()
if not cs.startswith(CAND_SHA): die('index.html is not the V231 candidate (sha256 %s)' % cs)
if not bs.startswith(BASE_SHA): die('baseline is not V230 (sha256 %s)' % bs)
if base_b.decode('utf-8').count('<meta name="ia-version" content="230">') != 1: die('baseline does not read ia-version 230')
print('TREES candidate ia-version 231 sha %s | V230 baseline ia-version 230 sha %s' % (cs[:16], bs[:16]))

def head_delta(path):
    d = subprocess.run(['git', 'diff', '-U0', 'HEAD', '--', path], cwd=ROOT, capture_output=True, text=True).stdout
    add = [l[1:] for l in d.splitlines() if l.startswith('+') and not l.startswith('+++')]
    rem = [l[1:] for l in d.splitlines() if l.startswith('-') and not l.startswith('---')]
    return add, rem
SESSION_ROWS = {'harness': ["MANNY_DIGEST_BY_VERSION[231] = '2d35e8f743680cfa';   // "],
                'g199': ['E6_BY_VERSION[231] = E6_BY_VERSION[230];   // ',
                         'DELOAD_HINGE_BY_VERSION[231] = DELOAD_HINGE_BY_VERSION[230];   // ']}
for k, pref in SESSION_ROWS.items():
    add, rem = head_delta(F[k])
    if rem or len(add) != len(pref) or any(not a.startswith(p) for a, p in zip(add, pref)):
        die('%s differs from HEAD by more than this session\'s E1/E2 rows: +%d -%d (%r)' % (F[k], len(add), len(rem), [a[:60] for a in add]))
    print('CLEAN %s against HEAD except this session\'s rows: %s' % (F[k].split('/')[-1], ' | '.join(a[:40] for a in add)))
if subprocess.run(['git', 'diff', '--quiet', 'HEAD', '--', G200C], cwd=ROOT).returncode: die('g200_core_tier.js differs from HEAD')
for k, tok in (('harness', 'MANNY_DELOAD_OFF_DIGEST_BY_VERSION[231]'), ('harness', 'MANNY_CORE_OFF_DIGEST_BY_VERSION[231]'),
               ('g199', 'DELOAD_ARB_BY_VERSION[231]'), ('g199', 'IP.version>=231'), ('g199', '15702'), ('g199', '30246'),
               ('g199', 'F23_V231')):
    if tok in txt[k]: die('%s already carries %r (a pre-existing target row)' % (F[k], tok))
ab = open(ABSORB, encoding='utf-8').read()
for need in ('`MANNY_DELOAD_OFF_DIGEST_BY_VERSION[231]` | ABSORB as a LITERAL row (ruled MOVE, D94-t convention) | `145c60296526a949` (cand == ALLx; V230/B 1069cd7f86eed204) | A-1',
             '`MANNY_CORE_OFF_DIGEST_BY_VERSION[231]` | ABSORB as a LITERAL row | `5770a4b1c4e2404d` (cand == ALLx; V230/B 9d14801a63111081) | A-1',
             'differs on exactly 12 of 98 days, W1–W12 Tue, each `add[Leg circuit — runner armor :: Single-leg hip thrust :: 2×6–10 each @ RPE 7]`, 0 removals',
             'the same 10 days on both trees (W4 mon/tue/thu, W8 mon/tue/thu, W12 mon/tue/thu/fri), so B3 stays non-vacuous',
             'core-off arm differs on exactly the same 12 Tuesdays by the same fourth item; shipped-vs-core-off delta W11 mon on both trees',
             '**2. `DELOAD_ARB_BY_VERSION[231]` (g199:179)** | ABSORB as a LITERAL row `' + ARB_LIT + '` | keyed 231 | V230 reads 264/264/0/19',
             '| ABSORB inline era: `VER>=231 ? 15702 : 15720`, `VER>=231 ? 30246 : 30264` | 15,702 / 30,246 | D196-1/-2/-5 | `IP.version>=231` | V230 reads 15,720/30,264',
             '- G1: harness `MANNY_DELOAD_OFF[231]` literal; harness `MANNY_CORE_OFF[231]` literal; g199 `DELOAD_ARB_BY_VERSION[231]` literal; g199 F2/F3 era literals.'):
    if ab.count(need) != 1: die('the absorb ruling does not carry %r exactly once' % need[:90])
ru = open(RERUL, encoding='utf-8').read()
for need in ('## D195 — Amendment 2:', '## D196 — Amendment 1 (labels and doses the ruling did not name; no code change)'):
    if ru.count(need) != 1: die('the re-ruling does not carry %r exactly once' % need)
m18 = open(M18, encoding='utf-8').read()
for need in ('MANNY_DELOAD_OFF (harness:393) 145c60296526a949 vs 1069cd7f86eed204, moves at A (g199 B2).',
             'MANNY_CORE_OFF (harness:412) 5770a4b1c4e2404d vs 9d14801a63111081, moves at A (g200_core:151 F1a).',
             'g199:561 F2 15,720 → 15,702; g199:562 F3 30,264 → 30,246 (D196).'):
    if m18.count(need) != 1: die('M18 does not print %r exactly once' % need)
print('RULINGS: the absorb ruling, the re-ruling and M18 carry every line the comments quote')

A_DO = '\nMANNY_DELOAD_OFF_DIGEST_BY_VERSION[230] = MANNY_DELOAD_OFF_DIGEST_BY_VERSION[229];   // '
A_CO = '\nMANNY_CORE_OFF_DIGEST_BY_VERSION[230] = MANNY_CORE_OFF_DIGEST_BY_VERSION[229];   // '
A_ARB = '\nDELOAD_ARB_BY_VERSION[230] = DELOAD_ARB_BY_VERSION[229];   // '
OLD_F23 = (
    "  ok(g(N.lblP2all,'Leg superset B')===15720,'F2 Leg superset B present after the deload == 15,720, same all-day-builds denominator; got '+g(N.lblP2all,'Leg superset B'));\n"
    "  ok(g(N.lblP2all,'Leg superset A')+g(N.lblP2all,'Leg superset B')===30264,\n"
    "    'F3 ACCESSORY-BLOCK CONSERVATION: A + B after the deload == 30,264, the identical total V198 shipped as 16,704 + 13,560. The ruling SWAPS which block survives, it ADDS NO SETS. Without this a build that kept BOTH blocks would satisfy every other criterion in this file; got '+(g(N.lblP2all,'Leg superset A')+g(N.lblP2all,'Leg superset B')));\n")
for k, a, nm in (('harness', A_DO, 'MANNY_DELOAD_OFF[230] row'), ('harness', A_CO, 'MANNY_CORE_OFF[230] row'),
                 ('g199', A_ARB, 'DELOAD_ARB[230] row'), ('g199', OLD_F23, 'F2+F3 block (three adjacent lines)')):
    n = txt[k].count(a)
    print('ANCHOR %s %s count %d' % (F[k].split('/')[-1], nm, n))
    if n != 1: die('anchor %s count %d in %s' % (nm, n, F[k]))

os.makedirs(SCR + '/tmp', exist_ok=True)
env = dict(os.environ, TMPDIR=SCR + '/tmp')

def summ(out):
    m = re.findall(r'^PASS (\d+) FAIL (\d+)\s*$', out, re.M)
    return tuple(map(int, m[-1])) if m else None

def run_many(jobs):
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
def fails(o): return re.findall(r'^  FAIL (\S+) ', o, re.M)
def oks(o): return re.findall(r'^  ok   (\S+) ', o, re.M)

# ── 1. the three HALF_MANNY arms, on both trees, by the gates' own methods ───────────────
PROBE_JS = SCR + '/arms_probe.js'
open(PROBE_JS, 'w', encoding='utf-8').write(
    "const H=require(" + json.dumps(F['harness']) + ");\n"
    "const fs=require('fs'), path=require('path'), crypto=require('crypto');\n"
    "const art=process.argv[2], tmpdir=process.argv[3];\n"
    "const CIRC=" + json.dumps(CIRCUIT, ensure_ascii=False) + ", HT=" + json.dumps(HT) + ";\n"
    "const RAW=fs.readFileSync(art,'utf8');\n"
    "const CLAUSE=\"  if(_auxFamily(name)==='core') return 0;\\n\";\n"          # g200_core_tier.js:62, verbatim
    "const clauseN=RAW.split(CLAUSE).length-1;\n"
    "const STRIP=(k,v)=>(k==='id'||k==='created'||k==='_swapUniverse'||k==='_swapUniverseByKey')?undefined:v;\n"  # progDigest's strip
    "const sha=s=>crypto.createHash('sha256').update(s).digest('hex').slice(0,16);\n"
    "const nm=n=>String(n).replace(/<svg[\\s\\S]*?<\\/svg>\\s*/g,'');\n"
    "const lab=s=>(s.label||s.coreHeader||'');\n"
    "function days(prog){ const o={}; Object.keys(prog.weeks||{}).sort((a,b)=>a-b).forEach(wk=>['mon','tue','wed','thu','fri','sat','sun'].forEach(d=>{\n"
    "  const day=prog.weeks[wk][d], k='W'+wk+' '+d; if(day===undefined||day===null){ o[k]=null; return; }\n"
    "  const c=JSON.parse(JSON.stringify(day,STRIP));\n"
    "  const items=[]; (c.sections||[]).forEach(s=>(s.items||[]).forEach(it=>items.push(lab(s)+' :: '+nm(it.name)+' :: '+it.detail)));\n"
    "  const m=JSON.parse(JSON.stringify(c)); (m.sections||[]).forEach(s=>{ if(lab(s)===CIRC&&Array.isArray(s.items)) s.items=s.items.filter(it=>nm(it.name)!==HT); });\n"
    "  o[k]={h:sha(JSON.stringify(c)), hMinusHT:sha(JSON.stringify(m)), items};\n"
    "})); return o; }\n"
    "const D=H.progDigest;\n"
    "// g199 B1/B2 (g199_deload_arbitration.js:500-504): pristine load, the fixture as-is, __DELOAD_OFF toggled\n"
    "const IP=H.load(art);\n"
    "const p1=IP.buildProgram(H.fixtures.HALF_MANNY), p1b=IP.buildProgram(H.fixtures.HALF_MANNY);\n"
    "IP.eval('globalThis.__DELOAD_OFF=true;');\n"
    "const po=IP.buildProgram(H.fixtures.HALF_MANNY), pob=IP.buildProgram(H.fixtures.HALF_MANNY);\n"
    "IP.eval('globalThis.__DELOAD_OFF=false;');\n"
    "const p1c=IP.buildProgram(H.fixtures.HALF_MANNY);\n"
    "// g200_core_tier F1a/F1b (g200_core_tier.js:139-153): the clause line removed, cloned fixture\n"
    "const IA=H.load(art);\n"
    "const MP=path.join(tmpdir,'counterfactual_'+IA.version+'.html'); fs.writeFileSync(MP, RAW.replace(CLAUSE,''));\n"
    "const MO=H.load(MP); fs.unlinkSync(MP);\n"
    "const fx=()=>JSON.parse(JSON.stringify(H.fixtures.HALF_MANNY));\n"
    "const pc=IA.buildProgram(fx()), pcb=IA.buildProgram(fx()), pm=MO.buildProgram(fx()), pmb=MO.buildProgram(fx());\n"
    "console.log(JSON.stringify({version:IP.version, seed:p1.seed, clauseN,\n"
    "  dig:{shipped:D(p1), shipped2:D(p1b), shipped3:D(p1c), off:D(po), off2:D(pob), shippedC:D(pc), shippedC2:D(pcb), core:D(pm), core2:D(pmb)},\n"
    "  days:{shipped:days(p1), off:days(po), shippedC:days(pc), core:days(pm)}}));\n")

def arms(art):
    r = subprocess.run(['bash', '-c', 'set -eo pipefail; node "%s" "%s" "%s"' % (PROBE_JS, art, SCR + '/tmp')],
                       capture_output=True, text=True, env=env, cwd=ROOT)
    if r.returncode: die('arms probe failed on %s: %s' % (art, r.stdout[-800:] + r.stderr[-800:]))
    return json.loads(r.stdout.strip().splitlines()[-1])
AC, AB = arms(P), arms(BASE)
for nmT, A in (('candidate', AC), ('V230 base', AB)):
    d = A['dig']
    st = (d['shipped'] == d['shipped2'] == d['shipped3'] == d['shippedC'] == d['shippedC2'], d['off'] == d['off2'], d['core'] == d['core2'])
    print('ARMS %s ia-version %s seed %s clause count %d: shipped %s | deload-off %s | core-off %s | self-stable shipped/off/core %s'
          % (nmT, A['version'], A['seed'], A['clauseN'], d['shipped'], d['off'], d['core'], '/'.join('yes' if x else 'NO' for x in st)))
    if not all(st): die('PARK all (standing ruling 7): an arm on %s is not self-stable (or the two methods disagree on shipped); nothing is diffed' % nmT)
    if A['clauseN'] != 1: die('the core clause count on %s is %d, not 1: the counterfactual is not constructible' % (nmT, A['clauseN']))
    if str(A['seed']) != '76308': die('HALF_MANNY seed on %s is %r, not 76308' % (nmT, A['seed']))
if AC['dig']['shipped'] != SH_231 or AB['dig']['shipped'] != SH_230:
    die('the shipped HALF_MANNY digests are %s / %s, not E1\'s %s / %s' % (AC['dig']['shipped'], AB['dig']['shipped'], SH_231, SH_230))

def dkeys(a, b):
    if list(a.keys()) != list(b.keys()): die('day keys differ between two programs')
    return [k for k in a if (a[k] is None) != (b[k] is None) or (a[k] and b[k] and a[k]['h'] != b[k]['h'])]
def ndays(a): return sum(1 for v in a.values() if v is not None)

def cross(arm):
    """V230's arm -> candidate's arm: (differing day keys, per-day op lines, all-days-as-ruled flag, rest-identical count)."""
    a, b = AB['days'][arm], AC['days'][arm]
    ks = dkeys(a, b)
    lines, good, rest_eq = [], True, 0
    for k in ks:
        if a[k] is None or b[k] is None: lines.append('%s presence moved' % k); good = False; continue
        bi, ci = a[k]['items'], b[k]['items']
        add = list((collections.Counter(ci) - collections.Counter(bi)).elements())
        rem = list((collections.Counter(bi) - collections.Counter(ci)).elements())
        idx = [i for i, s in enumerate(bi) if s.startswith(CIRCUIT + ' :: ')]
        placed = bool(idx) and len(idx) == 3 and ci == bi[:idx[-1] + 1] + [NEW_ITEM] + bi[idx[-1] + 1:]
        same_rest = a[k]['h'] == b[k]['hMinusHT']
        rest_eq += same_rest
        lines.append('%-8s add[%s] rem[%s] fourth-circuit-item %s, rest of day byte-identical %s'
                     % (k, ' | '.join(add), ' | '.join(rem), 'yes' if placed else 'NO', 'yes' if same_rest else 'NO'))
        if add != [NEW_ITEM] or rem or not placed: good = False
    return ks, lines, good and ks == WANT_12, rest_eq

PARK = {}
for arm, row, want_c, want_b in (('off', 'DO', DO_231, DO_230), ('core', 'CO', CO_231, CO_230)):
    ks, lines, good, rest_eq = cross(arm)
    print('FIG  %s arm, V230 -> candidate: %d of %d days differ (%d of %d on the shipped arm)'
          % (arm, len(ks), ndays(AB['days'][arm]), len(dkeys(AB['days']['shipped'], AC['days']['shipped'])), ndays(AB['days']['shipped'])))
    for l in lines: print('       ' + l)
    if AC['dig'][arm] != want_c: PARK[row] = 'candidate %s arm digest %s, the ruling says %s' % (arm, AC['dig'][arm], want_c)
    elif AB['dig'][arm] != want_b: PARK[row] = 'V230 %s arm digest %s, the [230] row reads %s' % (arm, AB['dig'][arm], want_b)
    elif not good: PARK[row] = '%s arm day diff is not exactly W1–W12 tue, each add[%s], 0 removals' % (arm, NEW_ITEM)
    elif ndays(AB['days'][arm]) != 98 or ndays(AC['days'][arm]) != 98: PARK[row] = '%s arm does not hold 98 days' % arm
    globals()['REST_' + row] = rest_eq
d_off = {t: dkeys(A['days']['shipped'], A['days']['off']) for t, A in (('c', AC), ('b', AB))}
d_core = {t: dkeys(A['days']['shippedC'], A['days']['core']) for t, A in (('c', AC), ('b', AB))}
print('FIG  shipped vs deload-off delta: candidate %s | V230 %s' % (', '.join(d_off['c']), ', '.join(d_off['b'])))
print('FIG  shipped vs core-off delta:   candidate %s | V230 %s' % (', '.join(d_core['c']), ', '.join(d_core['b'])))
if 'DO' not in PARK and not (d_off['c'] == d_off['b'] == WANT_OFF_DELTA):
    PARK['DO'] = 'shipped-vs-deload-off delta is not the ruled 10 days on both trees'
if 'CO' not in PARK and not (d_core['c'] == d_core['b'] == WANT_CORE_DELTA):
    PARK['CO'] = 'shipped-vs-core-off delta is not W11 mon on both trees'

# ── 2. each gate on the candidate WITHOUT the rows, and on the V230 baseline ─────────────
(c199, b199, c200, b200) = run_many([(F['g199'], P, BASE), (F['g199'], BASE, None), (G200C, P, BASE), (G200C, BASE, None)])
pre = {'g199': c199, 'g200c': c200}
preb = {'g199': b199, 'g200c': b200}
WANT = {}
for k in ('g199', 'g200c'):
    print('PRE  %-5s on V230 base: %s' % (k, sstr(preb[k][1])))
    if not preb[k][1] or preb[k][1][1] != 0: die('%s on the V230 baseline is not green before the edit\n%s' % (k, preb[k][0][-2500:]))
    WANT[k] = preb[k][1]
    s = pre[k][1]
    if s is None: die('%s on the candidate: no summary (crash)\n%s' % (k, pre[k][0][-2500:]))
    if sum(s) != sum(WANT[k]): die('%s candidate row total %d != V230 %d' % (k, sum(s), sum(WANT[k])))
    print('PRE  %-5s on candidate, no rows: %s on %s' % (k, sstr(s), ' '.join(fails(pre[k][0]))))
f199 = fails(pre['g199'][0])
ALLR = set(x for _, (g, rs) in READERS.items() if g == 'g199' for x in rs)
if not (ALLR | {'I2'}) <= set(f199) or not set(f199) <= (ALLR | LATER):
    die('g199 on the candidate fails %r; want every reader of these rows plus I2, and nothing outside %r' % (f199, sorted(ALLR | LATER)))
if fails(pre['g200c'][0]) != ['F1a']: die('g200_core_tier on the candidate fails %r, want F1a only' % fails(pre['g200c'][0]))

OKF = r'^  (?:ok   |FAIL )'
ROWV = r'(?:NO ROW|\d+)'   # the gate prints NO ROW where the era row is absent
def fig199(o):
    d = {}
    d['B1'] = one(OKF + r'B1 HALF_MANNY progDigest matches .*?\(got ([0-9a-f]{16})\)', o, 'g199 B1')
    d['B2'] = one(OKF + r'B2 with __DELOAD_OFF the same fixture matches .*?\(got ([0-9a-f]{16})\)', o, 'g199 B2')
    d['B3'] = one(r'^  (ok  |FAIL) B3 the two fixture digests differ', o, 'g199 B3').strip()
    d['C1'] = one(OKF + r'C1 zero-posterior weeks on the SHIPPED card == ' + ROWV + r' \(the V\d+ DELOAD_ARB_BY_VERSION row\) of (\d+) weeks '
                  r'\(1,728 configs\); got (\d+)', o, 'g199 C1')
    d['C3'] = one(OKF + r"C3 the surviving " + ROWV + r" \(the V\d+ row\) are all NON-deload weeks \(denominator (\d+)\), so C2's zero holds: "
                  r'got (\d+)', o, 'g199 C3')
    d['C5'] = one(OKF + r'C5 __DELOAD_OFF comparator: .*?; got (\d+)', o, 'g199 C5')
    d['C6'] = one(r'^  (ok  |FAIL) C6 shipped \((\d+)\) <= __DELOAD_OFF \((\d+)\)', o, 'g199 C6')
    d['D2'] = one(OKF + r'D2 ' + ROWV + r' deload weeks \(the V\d+ row\) are byte-identical with the deload off, so the sha-method deload count '
                  r'is ' + ROWV + r' \((\d+) differ of (\d+)\)\..*; got (\d+)', o, 'g199 D2')
    d['I3'] = one(OKF + r'I3 capRegionalFatigue kills exactly ' + ROWV + r' Leg superset B sections \(the V\d+ row\), out of (\d+) entering '
                  r'the cap \(all day builds, n=(\d+)\); got (\d+)', o, 'g199 I3')
    d['F1'] = one(OKF + r'F1 Leg superset A present after the deload == 14,544\..*; got (\d+)$', o, 'g199 F1')
    d['F2'] = one(OKF + r'F2 Leg superset B present after the deload == [0-9,]+.*?; got (\d+)$', o, 'g199 F2')
    d['F3'] = one(OKF + r'F3 ACCESSORY-BLOCK CONSERVATION: A \+ B after the deload == .*; got (\d+)$', o, 'g199 F3')
    return d
def fig200(o):
    return {'F0': one(OKF + r'F0 the V200 clause is present exactly once, .*\(count (\d+)\)', o, 'g200c F0'),
            'F1a': one(OKF + r'F1a the counterfactual matches .*?\(got ([0-9a-f]{16})\)', o, 'g200c F1a'),
            'F1b': one(OKF + r'F1b the candidate ships .*?\(got ([0-9a-f]{16})\)', o, 'g200c F1b')}
X = {'c': fig199(pre['g199'][0]), 'b': fig199(preb['g199'][0])}
Y = {'c': fig200(pre['g200c'][0]), 'b': fig200(preb['g200c'][0])}
for t, nmT in (('c', 'candidate'), ('b', 'V230 base')):
    d, e = X[t], Y[t]
    print('FIG  g199  %s: B1 %s B2 %s B3 %s | C1 %s of %s weeks | C3 %s (denominator %s) | C5 %s | C6 %s %s <= %s | D2 %s (%s differ of %s) | '
          'I3 %s of %s entering (n=%s) | F1 %s | F2 %s | F3 %s'
          % (nmT, d['B1'], d['B2'], d['B3'], d['C1'][1], d['C1'][0], d['C3'][1], d['C3'][0], d['C5'], d['C6'][0].strip(), d['C6'][1],
             d['C6'][2], d['D2'][2], d['D2'][0], d['D2'][1], d['I3'][2], d['I3'][0], d['I3'][1], d['F1'], d['F2'], d['F3']))
    print('FIG  g200c %s: F0 clause count %s | F1a core-off %s | F1b shipped %s' % (nmT, e['F0'], e['F1a'], e['F1b']))
# the gates' own digests must equal the arms probe (same methods)
if (X['c']['B2'], X['b']['B2'], Y['c']['F1a'], Y['b']['F1a']) != (AC['dig']['off'], AB['dig']['off'], AC['dig']['core'], AB['dig']['core']):
    die('the gates\' own deload-off / core-off digests disagree with the arms probe')
def arb(d): return {'capLSBkilled': int(d['I3'][2]), 'zeroWeeks': int(d['C1'][1]), 'zeroWeeksNonDeload': int(d['C3'][1]),
                    'zeroWeeksDeloadOff': int(d['C5']), 'dlIdentical': int(d['D2'][2])}
if arb(X['c']) != ARB_231: PARK['ARB'] = 'candidate DELOAD_ARB figures %r, the ruling says %r' % (arb(X['c']), ARB_231)
elif arb(X['b']) != ARB_230: PARK['ARB'] = 'V230 DELOAD_ARB figures %r, the [230] row reads %r' % (arb(X['b']), ARB_230)
elif X['c']['C6'][0].strip() != 'ok' or X['b']['C6'][0].strip() != 'ok': PARK['ARB'] = 'C6 is not ok on both trees'
if (int(X['c']['F2']), int(X['c']['F3'])) != (F2_231, F3_231): PARK['F23'] = 'candidate F2/F3 %s/%s, the ruling says %d/%d' % (X['c']['F2'], X['c']['F3'], F2_231, F3_231)
elif (int(X['b']['F2']), int(X['b']['F3'])) != (F2_230, F3_230): PARK['F23'] = 'V230 F2/F3 %s/%s, V230 reads %d/%d' % (X['b']['F2'], X['b']['F3'], F2_230, F3_230)
for r, why in PARK.items(): print('PARK %s (standing ruling 7): %s' % (r, why))
TOWRITE = [r for r in ('DO', 'CO', 'ARB', 'F23') if r not in PARK]
if not TOWRITE: die('every row parked; nothing is written')

# ── 3. the rows ──────────────────────────────────────────────────────────────────────────
RUL3 = 'V231 (D195 P-HIPEXT Amendment 2, D196 P-BWFALLBACK with Amendment 1, D197 P-FILTERLAST with Amendment 1)'
RERUL_CITE = ('tests/measure/v231_rulings/v231_reruling_d195a2_d196a1_d197a1.md, superseding A1–A4 of '
              'tests/measure/v231_rulings/v231_ruling_d196_d195a1_d197.md, whose D196 and D197 surgery and D195-B stand')
TREES = 'the V231 candidate (ia-version 231, sha ' + cs[:12] + ') and the V230 baseline (ia-version 230, sha ' + bs[:12] + ')'
DAYS12 = 'W1–W12 Tue, each add[' + NEW_ITEM + '], 0 removals'
ROWS = {
 'DO':
   "MANNY_DELOAD_OFF_DIGEST_BY_VERSION[231] = '" + DO_231 + "';   // " + RUL3 + ': the ruled digest move, a LITERAL (D94-t), '
   'not a reference: the absorb ruling (tests/measure/v231_rulings/v231_absorb_ruling.md section 1, the '
   '`MANNY_DELOAD_OFF_DIGEST_BY_VERSION[231]` row: "ABSORB as a LITERAL row (ruled MOVE, D94-t convention) | `' + DO_231 +
   '` (cand == ALLx; V230/B ' + DO_230 + ') | A-1") printed it from the candidate and from the surgery copy ALLx with g199\'s '
   '__DELOAD_OFF method before this row (standing ruling 5), class A-1 of D195 Amendment 2 (' + RERUL_CITE + '); the B-alone '
   'tree and V230 read ' + DO_230 + ' (measure M18, tests/measure/v231_rulings/measure_gate_candidate_m18.md: "moves at A (g199 '
   'B2)"); the deload-off arm V230 -> candidate differs on exactly %d of %d days, ' + DAYS12 + '; the shipped-vs-deload-off '
   'delta is the same %d days on both trees (W4 mon/tue/thu, W8 mon/tue/thu, W12 mon/tue/thu/fri), so B3 stays non-vacuous; '
   'printed by builder on ' + TREES + ' with g199\'s B2 method (pristine load, globalThis.__DELOAD_OFF=true), each arm built '
   'twice and self-stable, before this row: candidate ' + DO_231 + ', V230 ' + DO_230 + ', the item the fourth `' + CIRCUIT +
   '` item on all 12 and the rest of each of the 12 days byte-identical on %d of 12',
 'CO':
   "MANNY_CORE_OFF_DIGEST_BY_VERSION[231] = '" + CO_231 + "';   // " + RUL3 + ': the ruled digest move, a LITERAL (D94-t), not '
   'a reference: the absorb ruling (tests/measure/v231_rulings/v231_absorb_ruling.md section 1, the '
   '`MANNY_CORE_OFF_DIGEST_BY_VERSION[231]` row: "ABSORB as a LITERAL row | `' + CO_231 + '` (cand == ALLx; V230/B ' + CO_230 +
   ') | A-1") printed it from the candidate and from the surgery copy ALLx with g200\'s CLAUSE-strip method (clause count 1 on '
   'every tree) before this row (standing ruling 5), class A-1 of D195 Amendment 2 (' + RERUL_CITE + '); the B-alone tree and '
   'V230 read ' + CO_230 + ' (measure M18: "moves at A (g200_core:151 F1a)"); the core-off arm differs on exactly the same 12 '
   'Tuesdays by the same fourth item (%d of %d days, ' + DAYS12 + '); the shipped-vs-core-off delta is W11 mon on both trees; '
   'printed by builder on ' + TREES + ' with g200_core_tier\'s F1a method (the one `_auxFamily(name)===\'core\'` clause line '
   'removed, clause count 1 on both trees, cloned fixture), each arm built twice and self-stable, before this row: candidate '
   + CO_231 + ', V230 ' + CO_230 + ', the rest of each of the 12 days byte-identical on %d of 12',
 'ARB':
   'DELOAD_ARB_BY_VERSION[231] = ' + ARB_LIT + ';   // ' + RUL3 + ': ruled MOVE, a LITERAL row (D94-t, D133) keyed to the '
   'three V231 rulings (standing ruling 4): the absorb ruling (tests/measure/v231_rulings/v231_absorb_ruling.md section 2: '
   '"ABSORB as a LITERAL row `' + ARB_LIT + '` | keyed 231 | V230 reads 264/264/0/19"); C1/C3 264 -> 240: the 24 lost '
   'zero-posterior weeks are bodyweight|balanced|run_half|{beginner,advanced}|{lowback/protect,knee/protect}|s1013 W13 and W14, '
   'every one a D196-1 Primer rename (`Primer — Burpees` -> `Primer — Single-leg hip thrust (shoulders on bed)` / `Single-leg '
   'glute bridge`, detail verbatim; D196 Amendment 1 extends D196-1 to `Primer —`, ' + RERUL_CITE + '), so the taper week now '
   'carries posterior; D2 19 -> 17: the 2 are bodyweight|balanced|run_half|advanced|knee/protect|s3039 W8, shipped cards V230 '
   '== candidate (0 ops), class B-1 in the counterfactual deload-off arm (B\'s cost lens keeps Leg superset B :: Single-leg '
   'Romanian deadlift (bodyweight) there and the deload cuts it on the shipped arm); C5 0 and I3 18 unmoved (measure M18, '
   'tests/measure/v231_rulings/measure_gate_candidate_m18.md, printed the same); printed by builder with this gate before '
   'this row: candidate (ia-version 231, sha ' + cs[:12] + ') C1 %s of %s weeks, C3 %s (denominator %s), C5 %s, D2 %s (%s '
   'differ of %s), I3 %s of %s entering the cap, C6 %s <= %s; V230 baseline (ia-version 230, sha ' + bs[:12] + ') C1 %s, C3 '
   '%s, C5 %s, D2 %s, I3 %s',
}
dC, dB = X['c'], X['b']
ROWS['DO'] = ROWS['DO'] % (len(WANT_12), 98, len(WANT_OFF_DELTA), globals().get('REST_DO', 0))
ROWS['CO'] = ROWS['CO'] % (len(WANT_12), 98, globals().get('REST_CO', 0))
ROWS['ARB'] = ROWS['ARB'] % (dC['C1'][1], dC['C1'][0], dC['C3'][1], dC['C3'][0], dC['C5'], dC['D2'][2], dC['D2'][0], dC['D2'][1],
                             dC['I3'][2], dC['I3'][0], dC['C6'][1], dC['C6'][2], dB['C1'][1], dB['C3'][1], dB['C5'], dB['D2'][2], dB['I3'][2])
NEW_F23 = (
    "  // V231 era for F2 and F3 (tests/measure/v231_rulings/v231_absorb_ruling.md section 3, the g199:561 F2 / :562 F3 row: "
    "\"ABSORB inline era: `VER>=231 ? 15702 : 15720`, `VER>=231 ? 30246 : 30264` | 15,702 / 30,246 | D196-1/-2/-5 | "
    "`IP.version>=231` | V230 reads 15,720/30,264\"), a predicate on today's ia-version (standing ruling 2), keyed to D196 "
    "P-BWFALLBACK Amendment 1 (" + RERUL_CITE + ") and the absorb ruling's D196 Amendment 2 class text (standing ruling 4): "
    "the 18 cells are bodyweight|balanced|{none,run_pace_goal,run_half}|advanced|knee/protect|s1013 W5/W6 wed or thu, where "
    "D196-1 renames the Main burpee to the bridge, the D196-2 re-draw takes Single-leg Romanian deadlift (bodyweight) out of "
    "Leg superset B (the block goes singleton) and on 6 of them a Calves section appears (D196-5); printed by builder with "
    "this gate before this edit: F2 " + dC['F2'] + " / F3 " + dC['F3'] + " on the V231 candidate (sha " + cs[:12] + "), F2 " +
    dB['F2'] + " / F3 " + dB['F3'] + " on the V230 baseline (sha " + bs[:12] + "). Below 231 both rows print V230's text "
    "byte for byte.\n"
    "  const F23_V231=IP.version>=231?' (V231 era: 18 below V230, the D196 re-draw on 18 bodyweight knee/protect W5/W6 cells; "
    "tests/measure/v231_rulings/v231_absorb_ruling.md)':'';\n"
    "  ok(g(N.lblP2all,'Leg superset B')===(IP.version>=231?15702:15720),'F2 Leg superset B present after the deload == '"
    "+(IP.version>=231?'15,702':'15,720')+', same all-day-builds denominator'+F23_V231+'; got '+g(N.lblP2all,'Leg superset B'));\n"
    "  ok(g(N.lblP2all,'Leg superset A')+g(N.lblP2all,'Leg superset B')===(IP.version>=231?30246:30264),\n"
    "    'F3 ACCESSORY-BLOCK CONSERVATION: A + B after the deload == '+(IP.version>=231?'30,246, 18 below the 30,264 V198 "
    "shipped as 16,704 + 13,560 and V230 kept'+F23_V231:'30,264, the identical total V198 shipped as 16,704 + 13,560')+'. The "
    "ruling SWAPS which block survives, it ADDS NO SETS. Without this a build that kept BOTH blocks would satisfy every other "
    "criterion in this file; got '+(g(N.lblP2all,'Leg superset A')+g(N.lblP2all,'Leg superset B')));\n")

def with_rows(which):
    new = dict(txt)
    for r in which:
        if r == 'F23':
            new['g199'] = new['g199'].replace(OLD_F23, NEW_F23, 1)
            continue
        k, a = {'DO': ('harness', A_DO), 'CO': ('harness', A_CO), 'ARB': ('g199', A_ARB)}[r]
        row = ROWS[r]
        if chr(92) + 'u' in row: die('a \\u escape was typed into a row')
        if '\n' in row: die('a newline in a row')
        i = new[k].index(a) + 1
        j = new[k].index('\n', i)            # end of the [230] row
        new[k] = new[k][:j + 1] + row + '\n' + new[k][j + 1:]
    if chr(92) + 'u' in NEW_F23: die('a \\u escape was typed into the F2/F3 block')
    return new
new = with_rows(TOWRITE)
for r in TOWRITE:
    print('ROW  %s: %s ...' % (r, (ROWS[r] if r != 'F23' else NEW_F23.split('\n')[2])[:170]))
EXP = {'g199': sorted(set(f199) - set(x for r in TOWRITE if READERS[r][0] == 'g199' for x in READERS[r][1])),
       'g200c': [] if 'CO' in TOWRITE else ['F1a']}

def check(k, oc, sc, ob, sb, stage):
    if sb != WANT[k]: die('%s %s on V230 %r, want %r\n%s' % (stage, k, sb, WANT[k], ob[-3000:]))
    if sc is None: die('%s %s on the candidate: no summary (crash)\n%s' % (stage, k, oc[-3000:]))
    fl = sorted(fails(oc))
    if fl != EXP[k]: die('PARK (standing ruling 7): %s %s on the candidate fails %r, want exactly %r\n%s' % (stage, k, fl, EXP[k], oc[-3000:]))
    mine = set(x for r in TOWRITE if READERS[r][0] == k for x in READERS[r][1])
    if not mine <= set(oks(oc)): die('%s %s: %r not all ok on the candidate' % (stage, k, sorted(mine)))
    return fl

# ── 4. a scratch mirror carrying exactly the bytes to be written, on both trees ──────────
MIR = SCR + '/mirror/tests'
if os.path.isdir(SCR + '/mirror'): shutil.rmtree(SCR + '/mirror')
os.makedirs(MIR + '/gates')
os.symlink(ROOT + '/tests/measure', MIR + '/measure')
open(MIR + '/harness.js', 'w', encoding='utf-8').write(new['harness'])
open(MIR + '/gates/g199_deload_arbitration.js', 'w', encoding='utf-8').write(new['g199'])
open(MIR + '/gates/g200_core_tier.js', 'w', encoding='utf-8').write(g200c_txt)
mt = subprocess.run(['node', '-e', 'const H=require(%s);console.log([H.MANNY_DIGEST_BY_VERSION[231],H.MANNY_DELOAD_OFF_DIGEST_BY_VERSION[231],'
                     'H.MANNY_CORE_OFF_DIGEST_BY_VERSION[231],H.MANNY_DELOAD_OFF_DIGEST_BY_VERSION[230],H.MANNY_CORE_OFF_DIGEST_BY_VERSION[230]].join(" "))'
                     % json.dumps(MIR + '/harness.js')], capture_output=True, text=True, env=env)
want_t = ' '.join([SH_231, DO_231 if 'DO' in TOWRITE else 'undefined', CO_231 if 'CO' in TOWRITE else 'undefined', DO_230, CO_230])
if mt.stdout.strip() != want_t: die('mirror harness tables read %r, want %r (%s)' % (mt.stdout.strip(), want_t, mt.stderr[-400:]))
print('MIRROR harness tables [231] shipped/deload-off/core-off and [230] deload-off/core-off: ' + mt.stdout.strip())
(mc199, mb199, mc200, mb200) = run_many([(MIR + '/gates/g199_deload_arbitration.js', P, BASE), (MIR + '/gates/g199_deload_arbitration.js', BASE, None),
                                         (MIR + '/gates/g200_core_tier.js', P, BASE), (MIR + '/gates/g200_core_tier.js', BASE, None)])
for k, (oc, sc), (ob, sb) in (('g199', mc199, mb199), ('g200c', mc200, mb200)):
    fl = check(k, oc, sc, ob, sb, 'mirror')
    print('MIRROR %-5s with the rows: candidate %s%s | V230 %s' % (k, sstr(sc), (' on ' + ' '.join(fl)) if fl else '', sstr(sb)))

# ── 5. write once ────────────────────────────────────────────────────────────────────────
for k in F:
    if new[k] == txt[k]: continue
    open(F[k], 'w', encoding='utf-8').write(new[k])
    r = subprocess.run(['node', '--check', F[k]], capture_output=True, text=True)
    if r.returncode: die('node --check failed on ' + F[k] + ': ' + r.stderr)
    print('WROTE ' + F[k] + ' (node --check ok)')

# ── 6. after the write ───────────────────────────────────────────────────────────────────
hb = subprocess.run(['bash', '-c', 'set -eo pipefail; node "%s" "%s"' % (F['harness'], P)], capture_output=True, text=True, env=env)
print('POST harness boot on the candidate (rc %d): %s' % (hb.returncode, ' | '.join(hb.stdout.splitlines()[:3])))
bad = [] if hb.returncode == 0 else ['harness boot']
(pc199, pb199, pc200, pb200) = run_many([(F['g199'], P, BASE), (F['g199'], BASE, None), (G200C, P, BASE), (G200C, BASE, None)])
for k, (oc, sc), (ob, sb) in (('g199', pc199, pb199), ('g200c', pc200, pb200)):
    print('POST %-5s on candidate (V230 as argv[3]): %s' % (k, sstr(sc)))
    print('POST %-5s on V230 as the candidate:     %s' % (k, sstr(sb)))
    fl = sorted(fails(oc))
    for l in re.findall(r'^\s*FAIL \S.*$', oc + ob, re.M): print('       ' + l[:240])
    if sb != WANT[k] or sc is None or fl != EXP[k]: bad.append(k)
    same = ob == preb[k][0]
    dd = [l for l in zip(ob.splitlines(), preb[k][0].splitlines()) if l[0] != l[1]]
    print('POST %-5s V230 output vs before the write: byte-identical %s (%d lines vs %d, %d differing%s)'
          % (k, 'yes' if same else 'NO', len(ob.splitlines()), len(preb[k][0].splitlines()), len(dd), ('; first: %r' % (dd[0],))[:300] if dd else ''))
    if not same: bad.append(k + ' V230 output moved')
if PARK: print('PARKED rows (not written): ' + ' '.join(PARK))
if bad: die('written, but not as expected after the write: %r (standing ruling 7: report, nothing committed)' % bad)
print('OK: %d rows written: %s; g199 on the candidate red only on %s (slice G2); g200_core_tier green on both trees'
      % (len(TOWRITE), ' '.join(TOWRITE), ' '.join(EXP['g199']) or 'nothing'))
