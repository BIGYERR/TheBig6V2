#!/usr/bin/env python3
# V231 slice 7: D198 P-HEPDRAW (one engine line) + the g199 DELOAD_HINGE_BY_VERSION[231] row.
# Ruling: tests/measure/v231_rulings/v231_reruling2_d196a2_d198.md (D198). No ia-version change
# (231 is the build).
#
# Order (the brief): (1) refuse unless index.html sha256 starts 1249c248a6794d1c (or is already
# the D198 tree written by this script, 1b403743f8ad1b16, with the pre copy saved) and the V230
# base starts 72ac41c8d34034ce; (2) write the one engine line (anchor count==1), then require
# byte identity with coach's surgery tree coach4/t_CF.html; (3) print the g199 figures on the new
# candidate with the gate itself; (4) name the moved posterior items with a SCRATCH copy of g199
# carrying a census dump (the gate's own lattice, instrument and hand oracle; the gate file is not
# touched for this), proving the pre-D198 tree equals itself first; (5) write the g199 row ONLY if
# E1a/E1b read 12,372/9,322, E2 reads 12,372 at both ends and E3/G1/G2/G5 equal [230]'s; else park
# the row (standing ruling 7) and exit 2.
# Amendment 1 (RE-RULING 3): the census check reads the amended cause and the row text is read verbatim
# from the ruling file's section "(1) The corrected row, verbatim for builder".
import hashlib, json, os, re, shutil, subprocess, sys

REPO = '/Users/CanasBangin/Desktop/TheBig6V2'
SCR = '/private/tmp/claude-501/-Users-CanasBangin-Desktop-TheBig6V2/adf6a3cd-1bcb-472e-a3ec-2078adfbc3be/scratchpad'
WORK = SCR + '/builder_d198'
IDX = REPO + '/index.html'
BASE = SCR + '/base_v230.html'
TCF = SCR + '/coach4/t_CF.html'
PRE = WORK + '/pre_s7_1249c248.html'
GATE = REPO + '/tests/gates/g199_deload_arbitration.js'
CENSUS_GATE = WORK + '/g199_census_copy.js'
os.makedirs(WORK, exist_ok=True)
ENV = dict(os.environ, TMPDIR=WORK + '/')

def sha(p):
    return hashlib.sha256(open(p, 'rb').read()).hexdigest()

def die(msg, code=1):
    print('ABORT: ' + msg)
    sys.exit(code)

# ---- (1) refusals ---------------------------------------------------------------------------
if not sha(BASE).startswith('72ac41c8d34034ce'):
    die('base_v230.html sha ' + sha(BASE)[:16] + ' != 72ac41c8d34034ce')
if not sha(TCF).startswith('1b403743f8ad1b16'):
    die('coach4/t_CF.html sha ' + sha(TCF)[:16] + ' != 1b403743f8ad1b16')

OLD = b'const lowerHipExt=pick(hipExtBW,1,blockSeed(w)+20)[0];'
NEW = (b'const _lhe0=pick(hipExtBW,1,blockSeed(w)+20)[0];const lowerHipExt=(_lhe0===lowerHinge)?'
       b'(pick(hipExtBW.filter(x=>x!==lowerHinge),1,blockSeed(w)+20)[0]||_lhe0):_lhe0;')

s0 = sha(IDX)
if s0.startswith('1249c248a6794d1c'):
    shutil.copyfile(IDX, PRE)
    raw = open(IDX, 'rb').read()
    n = raw.count(OLD)
    if n != 1:
        die('engine anchor count %d != 1' % n)
    if raw.count(NEW) != 0:
        die('replacement text already present')
    raw = raw.replace(OLD, NEW)
    open(IDX, 'wb').write(raw)
    print('(2) wrote the D198 line: index.html ' + s0[:16] + ' -> ' + sha(IDX)[:16])
elif s0.startswith('1b403743f8ad1b16') and os.path.exists(PRE) and sha(PRE).startswith('1249c248a6794d1c'):
    print('(2) D198 line already present (index.html ' + s0[:16] + '), pre copy ' + PRE)
else:
    die('index.html sha ' + s0[:16] + ' is neither 1249c248a6794d1c nor the D198 tree with a saved pre copy')

if open(IDX, 'rb').read() != open(TCF, 'rb').read():
    die('index.html is not byte-identical to coach4/t_CF.html after the D198 line')
print('(2) cmp index.html coach4/t_CF.html: byte-identical')
NEW_SHA = sha(IDX)

# ---- (3) the gate's figures on the new candidate ---------------------------------------------
def run_gate(gate, art, extra_env=None, log=None):
    env = dict(ENV)
    if extra_env:
        env.update(extra_env)
    p = subprocess.run(['bash', '-c', 'set -eo pipefail; node "$0" "$1"', gate, art],
                       cwd=REPO, env=env, capture_output=True, text=True, timeout=1800)
    out = p.stdout + p.stderr
    if log:
        open(log, 'w').write(out)
    if not re.search(r'^PASS \d+ FAIL \d+$', out, re.M):
        die('gate ' + gate + ' on ' + art + ' printed no PASS/FAIL summary (crash); log ' + str(log))
    return out

g_out = run_gate(GATE, IDX, log=WORK + '/g199_new_prerow.txt')

def grab(pat, label):
    m = re.search(pat, g_out, re.M)
    if not m:
        die('could not read ' + label + ' off the g199 output')
    return m

m = grab(r'E1a posterior items entering the deload == .*? across (\d+) deload day builds \(got (\d+)\)', 'E1a')
D_DAY, E1a = int(m.group(1)), int(m.group(2))
m = grab(r'E1b posterior items leaving the deload == .*?\(tier B long-run days excluded by _longRunTier: (\d+) deload day builds\).*?; got (\d+)', 'E1b')
TIERB, E1b = int(m.group(1)), int(m.group(2))
m = grab(r"E2 __DELOAD_OFF control cuts nothing .*?\): (\d+) -> (\d+)\. E1b", 'E2')
E2a, E2b = int(m.group(1)), int(m.group(2))
m = grab(r'E3 STAGE-LOCAL .*?; got (\d+)\. This is', 'E3')
E3 = int(m.group(1))
m = grab(r'G1 Leg isolation DROPPED by the deload .*?; got (\d+)$', 'G1')
G1 = int(m.group(1))
m = grab(r'G2 of those dropped Leg isolation blocks, POSTERIOR-HOLDING .*?; got (\d+)$', 'G2')
G2 = int(m.group(1))
m = grab(r'G5 the killed-day holder census is EXACTLY .*?\(got (\{.*?\})\)', 'G5')
G5 = json.loads(m.group(1))
summary = re.search(r'^PASS \d+ FAIL \d+$', g_out, re.M).group(0)
print('(3) g199 on the new candidate (row [231] still the [230] reference): E1a %d across %d deload day builds, '
      'E1b %d (tier B long-run days excluded: %d), E2 %d -> %d, E3 %d of %d, G1 %d, G2 %d, G5 %s; %s'
      % (E1a, D_DAY, E1b, TIERB, E2a, E2b, E3, D_DAY, G1, G2, json.dumps(G5, separators=(',', ':')), summary))
print('    FAIL lines: ' + ' | '.join(l.strip()[:60] for l in g_out.splitlines() if l.strip().startswith('FAIL ')))

ROW230 = {'E1b': 9319, 'E3': 44, 'G5': {'Explosive finisher': 44}, 'E1a': 12369, 'G1': 1275}   # read off g199:160 ([219], which [220]..[230] reference)
figs_ok = (E1a == 12372 and E1b == 9322 and E2a == 12372 and E2b == 12372 and E3 == ROW230['E3']
           and G1 == ROW230['G1'] and G2 == ROW230['G1'] and G5 == ROW230['G5'])
if not figs_ok:
    die('PARKED (standing ruling 7): the figures do not read the ruling\'s 12,372 / 9,322 with E3/G1/G2/G5 '
        'equal to [230]; the engine line stays written, the g199 row is NOT written', 2)

# ---- (4) census: name the moved posterior items with a scratch copy of the gate -------------
gsrc = open(GATE, encoding='utf-8').read()
INJ = [
    ("require(path.join(__dirname,'..','harness.js'))",
     "require(" + json.dumps(REPO + '/tests/harness.js') + ")"),
    ("S.killedByDeloadX=(S.killedByDeloadX||0)+((killed&&!_tb)?1:0); S.killHoldX=S.killHoldX||{};",
     "S.killedByDeloadX=(S.killedByDeloadX||0)+((killed&&!_tb)?1:0); S.killHoldX=S.killHoldX||{};"
     " S.postDumpIn=S.postDumpIn||{}; S.postDumpOut=S.postDumpOut||{};"
     " (r.p1||[]).forEach(s=>(s.n||[]).forEach(n=>{ if(isPost(n)) bump(S.postDumpIn, L.key+'|W'+r.w+'|'+r.d+(_tb?'|tierB':'')+'||'+s.l+'::'+n); }));"
     " (r.p2||[]).forEach(s=>(s.n||[]).forEach(n=>{ if(isPost(n)) bump(S.postDumpOut, L.key+'|W'+r.w+'|'+r.d+(_tb?'|tierB':'')+'||'+s.l+'::'+n); }));"),
    ("  const N=R.on, F=R.off;",
     "  const N=R.on, F=R.off; if(process.env.G199DUMP) fs.writeFileSync(process.env.G199DUMP, JSON.stringify({inP1:N.postDumpIn||{}, outP2:N.postDumpOut||{}, offIn:F.postDumpIn||{}, offOut:F.postDumpOut||{}}));"),
]
for a, b in INJ:
    c = gsrc.count(a)
    if c != 1:
        die('census-copy anchor count %d != 1: %s' % (c, a[:60]), 2)
    gsrc = gsrc.replace(a, b)
open(CENSUS_GATE, 'w', encoding='utf-8').write(gsrc)

def census(art, tag):
    dump = WORK + '/census_' + tag + '.json'
    if os.path.exists(dump):
        os.remove(dump)
    run_gate(CENSUS_GATE, art, extra_env={'G199DUMP': dump}, log=WORK + '/census_' + tag + '.log')
    return json.load(open(dump))

preA = census(PRE, 'preA')
preB = census(PRE, 'preB')
if preA != preB:
    die('PARKED: the pre-D198 census does not equal itself; no diff is trusted', 2)
print('(4) pre-D198 census equals itself (%d entering keys, %d leaving keys)' % (len(preA['inP1']), len(preA['outP2'])))
new = census(IDX, 'new')

def by_day(d):
    out = {}
    for k, v in d.items():
        day, item = k.split('||', 1)
        out.setdefault(day, []).extend([item] * v)
    return out

def diff(stage):
    a, b = by_day(preA[stage]), by_day(new[stage])
    moved, renamed = [], []
    for day in sorted(set(a) | set(b)):
        x, y = sorted(a.get(day, [])), sorted(b.get(day, []))
        if x == y:
            continue
        (moved if len(x) != len(y) else renamed).append((day, len(y) - len(x), x, y))
    return moved, renamed

report = {}
for stage in ('inP1', 'outP2', 'offIn', 'offOut'):
    moved, renamed = diff(stage)
    report[stage] = (moved, renamed)
    print('    census %-6s: %d days change count (net %+d), %d days rename at equal count'
          % (stage, len(moved), sum(m[1] for m in moved), len(renamed)))
    for day, dn, x, y in moved:
        print('      MOVED %s %+d  added %s' % (day, dn, sorted(set(y) - set(x)) or [i for i in y if y.count(i) > x.count(i)]))
    for day, dn, x, y in renamed[:12]:
        print('      RENAME %s  %s -> %s' % (day, sorted(set(x) - set(y)), sorted(set(y) - set(x))))

# Census check, D198 Amendment 1 (RE-RULING 3, tests/measure/v231_rulings/v231_reruling2_d196a2_d198.md):
# the run of this script that read "three D198-2 adds" PARKED here; the amended cause is a NET +3 at p1
# and at p2 from four +1 days and one -1 day, all bodyweight|balanced|knee/protect|sun|s3039 deload
# Saturdays (stage-only), whose three programs ship byte-identical candidate -> D198 tree.
K = 'bodyweight|balanced|%s|%s|knee/protect|sun|3039|W%s|sat'
EXPECT = {
    K % ('advanced', 'half', '4'): (+1, 'Hip extension + push::Bodyweight back extension'),
    K % ('advanced', 'half', '8'): (+1, 'Hip extension + push::Bodyweight back extension'),
    K % ('advanced', 'pace', '4'): (+1, 'Hip extension + push::Bodyweight back extension'),
    K % ('advanced', 'pace', '8'): (+1, 'Hip extension + push::Bodyweight back extension'),
    K % ('beginner', 'half', '12'): (-1, 'Hip extension + push::Single-leg glute bridge'),
}

def delta_item(m):
    day, dn, x, y = m
    big, small = (list(y), x) if dn > 0 else (list(x), y)
    for i in small:
        big.remove(i)
    return big[0] if len(big) == 1 else None

for stage in ('inP1', 'outP2'):
    moved = report[stage][0]
    got = {m[0]: (m[1], delta_item(m)) for m in moved}
    if got != EXPECT:
        die('PARKED: census %s does not read the Amendment 1 cause; got %s' % (stage, json.dumps(got)), 2)
    if sum(v[0] for v in got.values()) != 3:
        die('PARKED: census %s net is not +3' % stage, 2)
print('(4) census reads the Amendment 1 cause at p1 and p2: net +3 = four +1 (Bodyweight back extension under '
      'Hip extension + push, advanced half/pace W4/W8) and one -1 (Single-leg glute bridge, beginner half W12), '
      'bodyweight|balanced|knee/protect|sun|s3039 deload Saturdays, none tier B')

# Shipped byte-identity of the three programs, configs built by the gate's own eCfg (extracted from g199).
gtext = open(GATE, encoding='utf-8').read()
i0 = gtext.index('function eCfg(')
i1 = gtext.index('\n}\n', i0) + 3
if gtext.count('function eCfg(') != 1:
    die('eCfg anchor count != 1', 2)
ECFG = gtext[i0:i1]
SHIPJS = WORK + '/ship_s7.js'
open(SHIPJS, 'w', encoding='utf-8').write(
    "const {load}=require(" + json.dumps(REPO + '/tests/harness.js') + ");\n" + ECFG +
    "const E_GOALS={pace:{k:'pace',id:'run_pace_goal'},half:{k:'half',id:'run_half'}};\n"
    "const A=load(process.argv[2]), B=load(process.argv[3]); let bad=0, days=0, selfBad=0;\n"
    "for(const [x,g] of [['advanced','half'],['advanced','pace'],['beginner','half']]){\n"
    "  const mk=()=>{const c=eCfg('bodyweight','balanced',x,E_GOALS[g],{k:'knee/protect',v:{region:'knee',tier:'protect'}},{k:'sun',v:['sun']},3039); c.injury={region:'knee',tier:'protect'}; return c;};\n"
    "  const pa=A.buildProgram(mk()), pa2=A.buildProgram(mk()), pb=B.buildProgram(mk());\n"
    "  if(JSON.stringify(pa.weeks)!==JSON.stringify(pa2.weeks)) selfBad++;\n"
    "  Object.keys(pa.weeks).forEach(w=>Object.keys(pa.weeks[w]).forEach(d=>{ days++; if(JSON.stringify(pa.weeks[w][d])!==JSON.stringify(pb.weeks[w]&&pb.weeks[w][d])) bad++; }));\n"
    "  if(Object.keys(pa.weeks).length!==Object.keys(pb.weeks).length) bad++;\n"
    "}\n"
    "console.log(JSON.stringify({days,bad,selfBad}));\n")
sp = subprocess.run(['bash', '-c', 'set -eo pipefail; node "$0" "$1" "$2"', SHIPJS, PRE, IDX],
                    cwd=REPO, env=ENV, capture_output=True, text=True, timeout=600)
try:
    shipr = json.loads(sp.stdout.strip().splitlines()[-1])
except Exception:
    die('ship check crashed: ' + sp.stdout[-400:] + sp.stderr[-400:], 2)
if shipr['selfBad'] != 0 or shipr['days'] == 0 or shipr['bad'] != 0:
    die('PARKED: the three knee/protect programs do not ship byte-identical (or the baseline is not self-identical): '
        + json.dumps(shipr), 2)
print('(4) shipped: the three bodyweight|balanced|knee/protect|sun|s3039 programs (advanced half, advanced pace, '
      'beginner half) are byte-identical pre-D198 -> D198 on %d of %d day builds; baseline self-identical'
      % (shipr['days'], shipr['days']))

# ---- (5) the g199 row: verbatim from D198 Amendment 1 section (1) -----------------------------
RULING = REPO + '/tests/measure/v231_rulings/v231_reruling2_d196a2_d198.md'
rtxt = open(RULING, encoding='utf-8').read()
H = '## (1) The corrected row, verbatim for builder'
if rtxt.count(H) != 1:
    die('ruling section anchor count != 1', 2)
sec = rtxt[rtxt.index(H) + len(H):]
f0 = sec.index('```\n') + 4
f1 = sec.index('\n```', f0)
ROW = sec[f0:f1]
LIT = "DELOAD_HINGE_BY_VERSION[231] = { E1b: 9322, E3: 44, G5: {'Explosive finisher': 44}, E1a: 12372, G1: 1275 };   // D198 P-HEPDRAW, cause per D198 Amendment 1"
if '\n' in ROW or not ROW.startswith(LIT):
    die('the ruling block is not the one-line literal row expected', 2)

PREFIX = 'DELOAD_HINGE_BY_VERSION[231] = DELOAD_HINGE_BY_VERSION[230];'
gtxt = open(GATE, encoding='utf-8').read()
glines = gtxt.split('\n')
hits = [i for i, l in enumerate(glines) if l.startswith(PREFIX)]
if len(hits) != 1 or gtxt.count(PREFIX) != 1:
    die('g199 [231] reference row count %d != 1' % len(hits), 2)
if gtxt.count('DELOAD_HINGE_BY_VERSION[231]') != 1:
    die('g199 carries more than one DELOAD_HINGE_BY_VERSION[231] mention', 2)
glines[hits[0]] = ROW
open(GATE, 'w', encoding='utf-8').write('\n'.join(glines))
print('(5) wrote g199 DELOAD_HINGE_BY_VERSION[231] literal row (D198 Amendment 1 verbatim) at line %d' % (hits[0] + 1))
