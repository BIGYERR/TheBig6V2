#!/usr/bin/env python3
# V228 build, slice 7: g227_d190_cuecap.js, the last (B) gate. Ruling: D193 Amendment 2, "g227 gates", standing under
# the split for the literal (tests/measure/v228_rulings/d193_caprpe_ruling.md): "Hand literals typed as "two" become
# version-predicated ("two" ≤227, "three" ≥228) so each still runs on V227" and "the six injured c-DIGESTs are licensed
# to move, their new values printed by measure from the final tree before gatekeeper runs, never read off the gate's own
# first pass". Under the split there is no clamp: BW8 (bH3's class (iii) end, RPE 8) is untouched.
#   E1 CUE (:131): `VER >= 228` -> "three", else "two". VER is a `let` declared at :209, so CUE is sited just after the
#      VER block (the old line would read VER in its temporal dead zone).
#   E2 RX8C (:136): RX8 + CUE. RX8 and BW8 untouched. HANDS (:138-142) reads RX8C at load time, so it moves verbatim
#      to sit after RX8C.
#   E3 the bH1/bH2 row labels (:121-122) type `{RX8C}` and are filled from the predicated RX8C before any row prints,
#      so a label never says "two" while the row asserts "three" (at V227 they print byte-identical to today).
#   E4 c-DIGEST: at VER >= 228 the six injured configs compare against measure's hand table
#      (tests/measure/v228_cdigest.out.txt: V227 output with the cue word substituted, hashed by the harness progDigest);
#      manny and mario_noinj compare against the V226 baseline as today. Below 228 the row is unchanged.
# Order: refuse unless index.html reads 228; anchors count==1 on the pristine text; pristine gate on V227; scratch
# mirror with the new bytes on the 228 tree and on V227 (FAIL 0 both; V227 PASS/FAIL row lines byte-equal to pristine);
# write; written == mirror.
import sys, os, re, subprocess

ROOT = '/Users/CanasBangin/Desktop/TheBig6V2'
P = ROOT + '/index.html'
SCR = '/private/tmp/claude-501/-Users-CanasBangin-Desktop-TheBig6V2/3a93b6bd-f518-4d1a-a71e-2afb713a85f0/scratchpad/builder/s7'
B227 = '/private/tmp/claude-501/-Users-CanasBangin-Desktop-TheBig6V2/3a93b6bd-f518-4d1a-a71e-2afb713a85f0/scratchpad/base_v227.html'
B226 = '/private/tmp/claude-501/-Users-CanasBangin-Desktop-TheBig6V2/3a93b6bd-f518-4d1a-a71e-2afb713a85f0/scratchpad/builder/s6/base_v226.html'
GATE = ROOT + '/tests/gates/g227_d190_cuecap.js'

def die(msg):
    print('REFUSED: ' + msg); sys.exit(1)

src = open(P, encoding='utf-8').read()
if src.count('<meta name="ia-version" content="228">') != 1 or src.count('<meta name="ia-version" content=') != 1:
    die('index.html does not read ia-version 228 exactly once')
t = open(GATE, encoding='utf-8').read()

TWO = "' — hold RPE 7, two in the tank'"
THREE = "' — hold RPE 7, three in the tank'"
LBL_OLD = "`2×8 — hold RPE 7, two in the tank`"

# the HANDS block, moved verbatim
h0 = t.index('const HANDS = [\n'); h1 = t.index('\n];\n', h0) + 4
HANDS_BLOCK = t[h0:h1]
if t.count('const HANDS = [\n') != 1 or HANDS_BLOCK.count("{ key:'bH") != 3: die('HANDS block not as read')

DIG = {'mario': '39679fdc5762f2b5', 'ankle_wa': '24fea086fe087454', 'hip_wa': '6c73687da203475a',
       'lowback_wa': 'd6e7e7178c37c073', 'shoulder_wa': '7cd72ca7e37a6f29', 'elbow_wa': '9a1b2079ac9cf7bd'}
DIG_JS = '{ ' + ', '.join("%s:'%s'" % (k, v) for k, v in DIG.items()) + ' }'

NEW_SITE = (
  "// V228 D193 R1 (split, Mario round 2; Amendment 2 \"g227 gates\"): the hand cue literal is version-predicated on the\n"
  "// artifact's own ia-version, \"three\" at 228 and above, \"two\" at 227 and below, so every row still runs on V227. Sited\n"
  "// here, after VER (a `let` declared above): the old TYPED ORACLE site would read it in its temporal dead zone. RX8C and\n"
  "// HANDS read CUE at load time, so they sit here too (HANDS moved verbatim); the bH1/bH2 labels are filled from RX8C.\n"
  "const CUE = VER >= 228 ? " + THREE + " : " + TWO + ";\n"
  "const RX8C = RX8 + CUE;\n"
  + HANDS_BLOCK +
  "R.bH1 = R.bH1.split('{RX8C}').join(RX8C); R.bH2 = R.bH2.split('{RX8C}').join(RX8C);\n")

EDITS = [
  # E3 labels
  ("Dumbbell goblet squat ends " + LBL_OLD + ", live == boot',", "Dumbbell goblet squat ends `{RX8C}`, live == boot',"),
  ("Kettlebell swing (2×8) -> Dumbbell goblet squat (" + LBL_OLD + ") -> Dumbbell split-stance deadlift", "Kettlebell swing (2×8) -> Dumbbell goblet squat (`{RX8C}`) -> Dumbbell split-stance deadlift"),
  # E1 old site
  ("const CUE = " + TWO + ";\n", "// CUE, RX8C and HANDS are typed after the version predicate below (V228 D193 R1, split): they read VER.\n"),
  # E2 old site: RX8C leaves the line, RX8 and BW8 stay
  ("const RX8 = '2×8', RX8C = '2×8 — hold RPE 7, two in the tank', BW8 = '2 sets — RPE 8 (stop 2 reps short of failure)';\n",
   "const RX8 = '2×8', BW8 = '2 sets — RPE 8 (stop 2 reps short of failure)';\n"),
  # HANDS leaves its old site
  (HANDS_BLOCK, ""),
  # E1/E2/E3 new site, after the VER block
  ("console.log('g227 D190 cue <=> cap + pairs | candidate ' + ART", NEW_SITE + "console.log('g227 D190 cue <=> cap + pairs | candidate ' + ART"),
  # E4 c-DIGEST
  ("  else { const eq = Object.keys(CFGS).filter(ck => !/SELF/.test(DG.C[ck]) && !/SELF/.test(DG.B[ck]) && DG.C[ck] === DG.B[ck]).length;\n"
   "    ok(R.cDIGEST, eq === Object.keys(CFGS).length, eq + '/' + Object.keys(CFGS).length + ' configs equal'); }\n",
   "  else {\n"
   "    // V228 D193 R1 (split), class (i): at VER >= 228 the six injured configs are licensed to move by the cue word only and\n"
   "    // read against measure's hand table (tests/measure/v228_cdigest.out.txt: V227 output with the word substituted, hashed\n"
   "    // by the harness progDigest), never against this gate's own run; manny and mario_noinj still read against V226.\n"
   "    // Below 228 the row is unchanged.\n"
   "    const D193_DIGEST = " + DIG_JS + ";\n"
   "    const wantOf = ck => (VER >= 228 && Object.prototype.hasOwnProperty.call(D193_DIGEST, ck)) ? D193_DIGEST[ck] : DG.B[ck];\n"
   "    if(VER >= 228) console.log('    c-DIGEST at ' + VER + ': ' + Object.keys(D193_DIGEST).map(ck => ck + ' want ' + D193_DIGEST[ck]).join(', ') + ' (D193 class (i), measure); manny, mario_noinj want V' + BASE_ERA);\n"
   "    const eq = Object.keys(CFGS).filter(ck => !/SELF/.test(DG.C[ck]) && !/SELF/.test(DG.B[ck]) && DG.C[ck] === wantOf(ck)).length;\n"
   "    ok(R.cDIGEST + (VER >= 228 ? ' (at 228 and above: the six injured against the D193 class (i) table)' : ''), eq === Object.keys(CFGS).length, eq + '/' + Object.keys(CFGS).length + ' configs equal'); }\n"),
]
new = t
for old, rep in EDITS:
    if t.count(old) != 1: die('anchor count %d: %r' % (t.count(old), old[:90]))
for old, rep in EDITS:
    if new.count(old) != 1: die('anchor lost after an earlier edit: %r' % old[:90])
    new = new.replace(old, rep, 1)
iv = new.index('\nlet VER = STAMP;'); ic = new.index('\nconst CUE = VER >= 228 ?'); ih = new.index('const HANDS = [\n')
first = min(new.index(x) for x in ("HANDS.", "HANDS)", "of HANDS") if x in new)
if not (iv < ic < ih < first): die('CUE/HANDS not between let VER and the first HANDS reader')

def code(s):
    s = re.sub(r'/\*[\s\S]*?\*/', '', s)
    return '\n'.join(re.sub(r'(^|[^:\\])//.*$', r'\1', l) for l in s.split('\n'))
c = code(new)
lines_two = [l.strip()[:120] for l in c.split('\n') if 'two in the tank' in l]
print('SCAN code-only "two in the tank": %d line(s): %r' % (len(lines_two), lines_two))
if len(lines_two) != 1 or not lines_two[0].startswith('const CUE = VER >= 228 ?'): die('a "two in the tank" token outside the predicate')

os.makedirs(SCR + '/tmp', exist_ok=True)
env = dict(os.environ, TMPDIR=SCR + '/tmp')
def run(gate_path, art, base):
    r = subprocess.run(['bash', '-c', 'set -eo pipefail; node "%s" "%s" "%s"' % (gate_path, art, base)], capture_output=True, text=True, env=env, cwd=ROOT)
    out = r.stdout + r.stderr
    m = re.findall(r'^PASS (\d+) FAIL (\d+)\s*$', out, re.M)
    return out, (tuple(map(int, m[-1])) if m else None)
rows = lambda o: [l.rstrip() for l in o.split('\n') if re.match(r'^\s*(PASS|FAIL) ', l)]

MIR = SCR + '/mirror/tests'
os.makedirs(MIR + '/gates', exist_ok=True)
for name, tgt in (('harness.js', ROOT + '/tests/harness.js'), ('measure', ROOT + '/tests/measure')):
    lp = MIR + '/' + name
    if not os.path.islink(lp): os.symlink(tgt, lp)
mp = MIR + '/gates/g227_d190_cuecap.js'
open(mp, 'w', encoding='utf-8').write(new)
o0, s0 = run(GATE, B227, B226)       # pristine on V227
o1, s1 = run(mp, P, B226)            # new bytes on 228; argv[3] = V226 (byte-equal to 637bc8e), the scratch mirror is outside the repo
o2, s2 = run(mp, B227, B226)         # new bytes on V227
for tag, o in (('pristine_227', o0), ('new_228', o1), ('new_227', o2)):
    open(SCR + '/cuecap_%s.out' % tag, 'w', encoding='utf-8').write(o)
same = rows(o0) == rows(o2)
print('RUN cuecap pristine on V227: %s | new on 228: %s | new on V227: %s | V227 row lines pristine == new: %s (%d rows)' % (s0, s1, s2, same, len(rows(o0))))
for l in rows(o1):
    if re.match(r'^\s*FAIL', l): print('  228 ' + l[:400])
if s1 is None or s1[1] != 0 or s2 is None or s2[1] != 0 or not same: die('not green, or V227 rows moved (nothing written)')

open(GATE, 'w', encoding='utf-8').write(new)
r = subprocess.run(['node', '--check', GATE], capture_output=True, text=True)
if r.returncode: die('node --check failed')
if open(GATE, encoding='utf-8').read() != open(mp, encoding='utf-8').read(): die('written != mirror')
print('WROTE ' + GATE + ' (node --check ok, byte-equal to the mirror that ran)')
