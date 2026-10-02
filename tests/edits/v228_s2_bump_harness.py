#!/usr/bin/env python3
# V228 build, slice 2 of D193 P-CAPRPE: the ia-version bump plus three era rows in tests/harness.js.
# Ruling: tests/measure/v228_rulings/d193_caprpe_ruling.md, "What deliberately does not change": "**HALF_MANNY may
# not move.** Era row `MANNY_DIGEST_BY_VERSION[228] = [227]` with the uninjured byte-identity row as its conjunct".
# The deload-off and core-off maps are the same population (uninjured HALF_MANNY counterfactuals). Mario: "ship D193
# at V228".
#   E1 index.html <meta name="ia-version"> 227 -> 228 (the last write).
#   E2 MANNY_DIGEST_BY_VERSION[228]            = [227], on the line after its [227] row.
#   E3 MANNY_DELOAD_OFF_DIGEST_BY_VERSION[228] = [227], on the line after its [227] row.
#   E4 MANNY_CORE_OFF_DIGEST_BY_VERSION[228]   = [227], on the line after its [227] row.
# Order: refuse unless index.html reads 227 and slice 1's _capRpeClamp is present; assert every anchor count==1;
# then PRINT the three HALF_MANNY digests (plain, g199's __DELOAD_OFF arm, g200_core_tier's clause-removed
# counterfactual) on the slice-1 tree AND on a scratch copy carrying E1 (the V228 working tree, slices 1 and 2);
# write nothing unless all six read 0ac7da6b1691a8e1 / 1069cd7f86eed204 / 9d14801a63111081 (standing ruling 5;
# a miss is a refuted premise and parks the slice, standing ruling 7). The meta bump is the last write.
import sys, os, json, subprocess

ROOT = '/Users/CanasBangin/Desktop/TheBig6V2'
P = ROOT + '/index.html'
H = ROOT + '/tests/harness.js'
SCR = '/private/tmp/claude-501/-Users-CanasBangin-Desktop-TheBig6V2/3a93b6bd-f518-4d1a-a71e-2afb713a85f0/scratchpad/builder'

def die(msg):
    print('REFUSED: ' + msg)
    sys.exit(1)

src = open(P, encoding='utf-8').read()
har = open(H, encoding='utf-8').read()

# ── refusals ─────────────────────────────────────────────────────────────────────────────
META_OLD = '<meta name="ia-version" content="227">'
META_NEW = '<meta name="ia-version" content="228">'
if src.count(META_OLD) != 1: die('index.html does not read ia-version 227 exactly once (count %d)' % src.count(META_OLD))
if src.count('<meta name="ia-version" content=') != 1: die('more than one ia-version meta')
if src.count('_capRpeClamp') != 2: die("slice 1's _capRpeClamp is absent (want definition + one reader, count %d): slice 1 has not landed" % src.count('_capRpeClamp'))
if "const INJ_CAP_CUE=' — hold RPE 7, three in the tank';" not in src: die("slice 1's INJ_CAP_CUE literal is absent: slice 1 has not landed")

# ── anchors: each [227] row at line start, exactly once; no [228] row yet ──────────────
EXPECT = {'MANNY_DIGEST_BY_VERSION': '0ac7da6b1691a8e1',
          'MANNY_DELOAD_OFF_DIGEST_BY_VERSION': '1069cd7f86eed204',
          'MANNY_CORE_OFF_DIGEST_BY_VERSION': '9d14801a63111081'}
WHY = ('V228 (D193 P-CAPRPE): ruled UNMOVED, reference to [227]; the cue literal, the clamp and the stripper all sit '
       'behind applyInjuryFilter\'s plan, which returns on an uninjured config before any of them is read, and '
       'HALF_MANNY is uninjured')
ROWS = {
 'MANNY_DIGEST_BY_VERSION':
   'MANNY_DIGEST_BY_VERSION[228] = MANNY_DIGEST_BY_VERSION[227];   // ' + WHY +
   ' (standing ruling 5: the ruling (tests/measure/v228_rulings/d193_caprpe_ruling.md) states "**HALF_MANNY may not '
   'move.** Era row `MANNY_DIGEST_BY_VERSION[228] = [227]` with the uninjured byte-identity row as its conjunct", and '
   'Amendment 1 section 7 (b) restates it; that conjunct printed by builder on the V228 slice-1 tree: uninjured weeks '
   'byte-identical V227 vs V228 on 47/47 builds (mario uninjured, HALF_MANNY, 45 cells over five equipment values); '
   '0ac7da6b1691a8e1 / 1069cd7f86eed204 / 9d14801a63111081 printed by builder on the V228 working tree (slices 1 and 2) '
   'with the harness fixture and g199\'s and g200\'s methods before this row)',
 'MANNY_DELOAD_OFF_DIGEST_BY_VERSION':
   'MANNY_DELOAD_OFF_DIGEST_BY_VERSION[228] = MANNY_DELOAD_OFF_DIGEST_BY_VERSION[227];   // ' + WHY +
   ' (same reasoning as MANNY_DIGEST_BY_VERSION[228]: HALF_MANNY is uninjured, so the filter returns before the cue, '
   'clamp or stripper with recoveryDeload suppressed too; 1069cd7f86eed204 printed by builder on the V228 working tree '
   '(slices 1 and 2) with g199\'s method before this row)',
 'MANNY_CORE_OFF_DIGEST_BY_VERSION':
   'MANNY_CORE_OFF_DIGEST_BY_VERSION[228] = MANNY_CORE_OFF_DIGEST_BY_VERSION[227];   // ' + WHY +
   ' (the core-off counterfactual is unreached the same way MANNY_DIGEST_BY_VERSION[228] and '
   'MANNY_DELOAD_OFF_DIGEST_BY_VERSION[228] are; 9d14801a63111081 printed by builder on the V228 working tree '
   '(slices 1 and 2) with g200\'s method before this row)',
}
anchors = {}
for m in EXPECT:
    a = '\n' + m + '[227] = ' + m + '[226];   // '
    if har.count(a) != 1: die('harness anchor %r count %d' % (a.strip(), har.count(a)))
    if ('\n' + m + '[228]') in har: die(m + '[228] already present')
    anchors[m] = a

# ── print the digests BEFORE any write ──────────────────────────────────────────────────
os.makedirs(SCR, exist_ok=True)
CAND = SCR + '/v228_s2_candidate.html'
open(CAND, 'w', encoding='utf-8').write(src.replace(META_OLD, META_NEW))
PRINTER = SCR + '/v228_s2_digests.js'
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
const MP=path.join(SCR,'v228_s2_coreoff_'+path.basename(ART));
fs.writeFileSync(MP,RAW.replace(CLAUSE,''));
const MO=Hm.load(MP);
const core=Hm.progDigest(MO.buildProgram(JSON.parse(JSON.stringify(Hm.fixtures.HALF_MANNY))));
const fx=Hm.fixtures.HALF_MANNY;
console.log(JSON.stringify({file:path.basename(ART),ver:IA.version,dig,stable:dig===dig2,off,clauseN,core,
  injury:fx.injury===undefined?'undefined':fx.injury, exSwapPrefs:fx.exSwapPrefs===undefined?'undefined':fx.exSwapPrefs}));
''' % json.dumps(H))

def printed(art):
    r = subprocess.run(['node', PRINTER, art, SCR], capture_output=True, text=True)
    if r.returncode != 0: die('digest printer crashed on %s: %s' % (art, r.stderr[-2000:]))
    line = [l for l in r.stdout.splitlines() if l.startswith('{')][-1]
    d = json.loads(line)
    print('PRINTED', json.dumps(d))
    return d

for art, ver in ((P, '227'), (CAND, '228')):
    d = printed(art)
    if str(d['ver']) != ver: die('%s reads ia-version %s, want %s' % (art, d['ver'], ver))
    if not d['stable']: die('%s: HALF_MANNY is not self-stable' % art)
    if d['clauseN'] != 1: die('%s: the core clause appears %d times, g200 counterfactual not constructible' % (art, d['clauseN']))
    got = {'MANNY_DIGEST_BY_VERSION': d['dig'], 'MANNY_DELOAD_OFF_DIGEST_BY_VERSION': d['off'],
           'MANNY_CORE_OFF_DIGEST_BY_VERSION': d['core']}
    for m, want in EXPECT.items():
        if got[m] != want: die('PREMISE REFUTED (standing ruling 7): %s on V%s printed %s, ruling says %s' % (m, ver, got[m], want))
    if d['injury'] not in (None, 'undefined'): die('fixtures.HALF_MANNY.injury is not null: %r' % d['injury'])

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
    i227 = [k for k, l in enumerate(L) if l.startswith(m + '[227] = ')]
    i228 = [k for k, l in enumerate(L) if l.startswith(m + '[228] = ')]
    assert len(i227) == 1 and len(i228) == 1 and i228[0] == i227[0] + 1, (m, i227, i228)
    print('ROW', m, '[228] at harness.js:%d' % (i228[0] + 1))
print('OK: E1 meta 227->228, E2-E4 three [228]=[227] rows')
