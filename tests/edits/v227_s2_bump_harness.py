#!/usr/bin/env python3
# V227 build, slice 2 of D190 P-SWAPSEAM: the ia-version bump plus three era rows in tests/harness.js.
# Ruling: tests/measure/v227_rulings/d190_swapseam_ruling.md, RE-RULING 1 §C: "Era rows the build adds, all
# `[227] = [226]` by reference (standing ruling 5; nothing in any of these populations carries a pref off a
# cued source): tests/harness.js MANNY_DIGEST_BY_VERSION, MANNY_DELOAD_OFF_DIGEST_BY_VERSION,
# MANNY_CORE_OFF_DIGEST_BY_VERSION". Mario: "Ship D190 at V227".
#   E1 index.html <meta name="ia-version"> 226 -> 227 (the only line the V226 bump changed, 637bc8e).
#   E2 MANNY_DIGEST_BY_VERSION[227]            = [226], on the line after its [226] row.
#   E3 MANNY_DELOAD_OFF_DIGEST_BY_VERSION[227] = [226], on the line after its [226] row.
#   E4 MANNY_CORE_OFF_DIGEST_BY_VERSION[227]   = [226], on the line after its [226] row.
# Order: refuse unless index.html reads 226 and slice 1's INJ_CAP_CUE is present; assert every anchor count==1;
# then PRINT the three HALF_MANNY digests (plain, g199's __DELOAD_OFF arm, g200_core_tier's clause-removed
# counterfactual) on the slice-1 tree AND on a scratch copy carrying E1 (the V227 working tree, slices 1 and 2);
# write nothing unless all six read 0ac7da6b1691a8e1 / 1069cd7f86eed204 / 9d14801a63111081 (standing ruling 5;
# a miss is a refuted premise and parks the slice, standing ruling 7). The meta bump is the last write.
import sys, os, json, subprocess

ROOT = '/Users/CanasBangin/Desktop/TheBig6V2'
P = ROOT + '/index.html'
H = ROOT + '/tests/harness.js'
SCR = '/private/tmp/claude-501/-Users-CanasBangin-Desktop-TheBig6V2/0d209eb9-c4f5-49d1-974c-7a51334cecdf/scratchpad/builder'

def die(msg):
    print('REFUSED: ' + msg)
    sys.exit(1)

src = open(P, encoding='utf-8').read()
har = open(H, encoding='utf-8').read()

# ── refusals ─────────────────────────────────────────────────────────────────────────────
META_OLD = '<meta name="ia-version" content="226">'
META_NEW = '<meta name="ia-version" content="227">'
if src.count(META_OLD) != 1: die('index.html does not read ia-version 226 exactly once (count %d)' % src.count(META_OLD))
if src.count('<meta name="ia-version" content=') != 1: die('more than one ia-version meta')   # :18095 names the tag in a comment, no content=
if src.count('INJ_CAP_CUE') < 1: die("slice 1's INJ_CAP_CUE is absent: slice 1 has not landed")
if '_stripCapCue' not in src: die("slice 1's _stripCapCue is absent: slice 1 has not landed")

# ── anchors: each [226] row at line start, exactly once; no [227] row yet ──────────────
EXPECT = {'MANNY_DIGEST_BY_VERSION': '0ac7da6b1691a8e1',
          'MANNY_DELOAD_OFF_DIGEST_BY_VERSION': '1069cd7f86eed204',
          'MANNY_CORE_OFF_DIGEST_BY_VERSION': '9d14801a63111081'}
WHY = ('V227 (D190 P-SWAPSEAM): ruled UNMOVED, reference to [226]; the engine moves only on a config carrying '
       '`cfg.exSwapPrefs` sourced from a natively cued item under a plan with a cap, and this file\'s population '
       'carries none')
ROWS = {
 'MANNY_DIGEST_BY_VERSION':
   'MANNY_DIGEST_BY_VERSION[227] = MANNY_DIGEST_BY_VERSION[226];   // ' + WHY +
   ' (standing ruling 5: the ruling (tests/measure/v227_rulings/d190_swapseam_ruling.md) states "HALF_MANNY week '
   'grid: unmoved, digest `0ac7da6b1691a8e1`, era row `[227]=[226]` by reference (standing ruling 5, no new digest '
   'because none moved)", and RE-RULING 1 §C restates the row; HALF_MANNY is uninjured and '
   '`fixtures.HALF_MANNY` carries no `exSwapPrefs` (printed undefined); 0ac7da6b1691a8e1 / 1069cd7f86eed204 / 9d14801a63111081 printed by '
   'builder on the V227 working tree (slices 1 and 2) with the harness fixture and g199\'s and g200\'s methods '
   'before this row)',
 'MANNY_DELOAD_OFF_DIGEST_BY_VERSION':
   'MANNY_DELOAD_OFF_DIGEST_BY_VERSION[227] = MANNY_DELOAD_OFF_DIGEST_BY_VERSION[226];   // ' + WHY +
   ' (same reasoning as MANNY_DIGEST_BY_VERSION[227]: HALF_MANNY is uninjured with no swap preference, so the '
   'arm is unreached with recoveryDeload suppressed too; RE-RULING 1 states the deload-off arm unmoved by g199 '
   '56/0 on D190@226; 1069cd7f86eed204 printed by builder on the V227 working tree (slices 1 and 2) with g199\'s '
   'method before this row)',
 'MANNY_CORE_OFF_DIGEST_BY_VERSION':
   'MANNY_CORE_OFF_DIGEST_BY_VERSION[227] = MANNY_CORE_OFF_DIGEST_BY_VERSION[226];   // ' + WHY +
   ' (the core-off counterfactual is unreached the same way MANNY_DIGEST_BY_VERSION[227] and '
   'MANNY_DELOAD_OFF_DIGEST_BY_VERSION[227] are; RE-RULING 1 states the core-off arm unmoved by g200_core_tier '
   '43/0 on D190@226; 9d14801a63111081 printed by builder on the V227 working tree (slices 1 and 2) with g200\'s '
   'method before this row)',
}
anchors = {}
for m in EXPECT:
    a = '\n' + m + '[226] = ' + m + '[225];   // '
    if har.count(a) != 1: die('harness anchor %r count %d' % (a.strip(), har.count(a)))
    if ('\n' + m + '[227]') in har: die(m + '[227] already present')
    anchors[m] = a

# ── print the digests BEFORE any write ──────────────────────────────────────────────────
os.makedirs(SCR, exist_ok=True)
CAND = SCR + '/v227_s2_candidate.html'
open(CAND, 'w', encoding='utf-8').write(src.replace(META_OLD, META_NEW))
PRINTER = SCR + '/v227_s2_digests.js'
open(PRINTER, 'w', encoding='utf-8').write(r'''
const fs=require('fs'), path=require('path');
const Hm=require(%s);
const ART=process.argv[2], SCR=process.argv[3];
const IA=Hm.load(ART);
// harness fixture, plain (as harness.js --grid prints it), built twice for self-stability
const dig=Hm.progDigest(IA.buildProgram(Hm.fixtures.HALF_MANNY));
const dig2=Hm.progDigest(IA.buildProgram(JSON.parse(JSON.stringify(Hm.fixtures.HALF_MANNY))));
// g199 B2's method: the plain artifact, globalThis.__DELOAD_OFF=true, progDigest of HALF_MANNY
IA.eval("globalThis.__DELOAD_OFF=true;");
const off=Hm.progDigest(IA.buildProgram(Hm.fixtures.HALF_MANNY));
IA.eval("globalThis.__DELOAD_OFF=false;");
// g200_core_tier F1a's method: the artifact with the one family-core clause removed, a cloned HALF_MANNY
const RAW=fs.readFileSync(ART,'utf8');
const CLAUSE="  if(_auxFamily(name)==='core') return 0;\n";
const clauseN=RAW.split(CLAUSE).length-1;
const MP=path.join(SCR,'v227_s2_coreoff_'+path.basename(ART));
fs.writeFileSync(MP,RAW.replace(CLAUSE,''));
const MO=Hm.load(MP);
const core=Hm.progDigest(MO.buildProgram(JSON.parse(JSON.stringify(Hm.fixtures.HALF_MANNY))));
const fx=Hm.fixtures.HALF_MANNY;
console.log(JSON.stringify({file:path.basename(ART),ver:IA.version,dig,stable:dig===dig2,off,clauseN,core,
  exSwapPrefs:fx.exSwapPrefs===undefined?'undefined':fx.exSwapPrefs, injuries:fx.injuries===undefined?'undefined':fx.injuries}));
''' % json.dumps(H))

def printed(art):
    r = subprocess.run(['node', PRINTER, art, SCR], capture_output=True, text=True)
    if r.returncode != 0: die('digest printer crashed on %s: %s' % (art, r.stderr[-2000:]))
    line = [l for l in r.stdout.splitlines() if l.startswith('{')][-1]
    d = json.loads(line)
    print('PRINTED', json.dumps(d))
    return d

for art, ver in ((P, '226'), (CAND, '227')):
    d = printed(art)
    if str(d['ver']) != ver: die('%s reads ia-version %s, want %s' % (art, d['ver'], ver))
    if not d['stable']: die('%s: HALF_MANNY is not self-stable' % art)
    if d['clauseN'] != 1: die('%s: the core clause appears %d times, g200 counterfactual not constructible' % (art, d['clauseN']))
    got = {'MANNY_DIGEST_BY_VERSION': d['dig'], 'MANNY_DELOAD_OFF_DIGEST_BY_VERSION': d['off'],
           'MANNY_CORE_OFF_DIGEST_BY_VERSION': d['core']}
    for m, want in EXPECT.items():
        if got[m] != want: die('PREMISE REFUTED (standing ruling 7): %s on V%s printed %s, ruling says %s' % (m, ver, got[m], want))
    if d['exSwapPrefs'] not in (None, 'undefined'): die('fixtures.HALF_MANNY.exSwapPrefs is not null: %r' % d['exSwapPrefs'])

# ── writes: E2-E4 (harness rows), then E1 (meta bump) last ─────────────────────────────
for m, a in anchors.items():
    i = har.index(a)
    eol = har.index('\n', i + 1)
    har = har[:eol + 1] + ROWS[m] + '\n' + har[eol + 1:]
open(H, 'w', encoding='utf-8').write(har)
src = src.replace(META_OLD, META_NEW)
open(P, 'w', encoding='utf-8').write(src)

# ── post-state ───────────────────────────────────────────────────────────────────────────
src2 = open(P, encoding='utf-8').read(); har2 = open(H, encoding='utf-8').read()
assert src2.count(META_NEW) == 1 and src2.count(META_OLD) == 0
L = har2.split('\n')
for m in EXPECT:
    i226 = [k for k, l in enumerate(L) if l.startswith(m + '[226] = ')]
    i227 = [k for k, l in enumerate(L) if l.startswith(m + '[227] = ')]
    assert len(i226) == 1 and len(i227) == 1 and i227[0] == i226[0] + 1, (m, i226, i227)
    print('ROW', m, '[227] at harness.js:%d' % (i227[0] + 1))
print('OK: E1 meta 226->227, E2-E4 three [227]=[226] rows')
