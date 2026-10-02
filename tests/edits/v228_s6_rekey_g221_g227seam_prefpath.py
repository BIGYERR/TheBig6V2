#!/usr/bin/env python3
# V228 build, slice 6: the (B) old-literal readers in three gate files. Ruling: D193 Amendment 2, "g227 gates", which
# stands under the split for the literal (tests/measure/v228_rulings/d193_caprpe_ruling.md): "Hand literals typed as
# "two" become version-predicated ("two" ≤227, "three" ≥228) so each still runs on V227", and "G3c power 118 is the
# gate reader: `cueBlind` strips both wordings, the same shape as R4". Standing rulings 4 (the gates stay keyed to
# D177/D190; D193 changes only the words they type) and 2 (the predicate reads the artifact's own ia-version).
#   E1 g221_d177_swapfloor.js :115-116  cueBlind strips / — hold RPE 7, (?:two|three) in the tank$/, still only VER > 226.
#   E2 g227_d190_seam.js      :157      CUE is "three" when VER >= 228, else "two". VER is a `let` declared at :226,
#                                       after :157 (TDZ), so the typed CUE moves to just after the VER block.
#   E3 g227_d190_prefpath.js  :116      the same; VER is declared at :158, so CUE moves to just after the VER block.
#                                       The HAND v226: strings (:121, :123) describe V226 and are not touched.
#   E4 g227_d190_prefpath.js  c2-iii    session decision (neither cue-blind nor a licence): at VER >= 228 each V226
#                                       baseline detail's exact suffix " — hold RPE 7, two in the tank" is read as
#                                       " — hold RPE 7, three in the tank" before the byte compare (D193 class (i), the
#                                       word and nothing else); below 228 unchanged. A cue appearing on or vanishing
#                                       from a non-target card still trips the row.
# c2-hand needs no edit: it fails on the 228 tree only through SELF (the population located by "two"), which E3 fixes.
# Order: refuse unless index.html reads 228; anchors count==1 on the pristine text; run each PRISTINE gate on the
# V227 baseline (record its row lines); run a scratch mirror carrying exactly the new bytes on the 228 tree (want
# FAIL 0) and on the V227 baseline (want FAIL 0 and every PASS/FAIL row line byte-equal to the pristine run); write;
# the written files must be byte-equal to the mirrors.
import sys, os, re, subprocess

ROOT = '/Users/CanasBangin/Desktop/TheBig6V2'
P = ROOT + '/index.html'
SCR = '/private/tmp/claude-501/-Users-CanasBangin-Desktop-TheBig6V2/3a93b6bd-f518-4d1a-a71e-2afb713a85f0/scratchpad/builder/s6'
B227 = '/private/tmp/claude-501/-Users-CanasBangin-Desktop-TheBig6V2/3a93b6bd-f518-4d1a-a71e-2afb713a85f0/scratchpad/base_v227.html'
B226 = SCR + '/base_v226.html'
G = {'g221': ROOT + '/tests/gates/g221_d177_swapfloor.js',
     'seam': ROOT + '/tests/gates/g227_d190_seam.js',
     'pref': ROOT + '/tests/gates/g227_d190_prefpath.js'}

def die(msg):
    print('REFUSED: ' + msg); sys.exit(1)

src = open(P, encoding='utf-8').read()
if src.count('<meta name="ia-version" content="228">') != 1 or src.count('<meta name="ia-version" content=') != 1:
    die('index.html does not read ia-version 228 exactly once')
txt = {k: open(v, encoding='utf-8').read() for k, v in G.items()}

TWO = "' — hold RPE 7, two in the tank'"
THREE = "' — hold RPE 7, three in the tank'"
WHY = ('V228 D193 R1 (split, Mario round 2; Amendment 2 "g227 gates"): the hand cue literal is version-predicated on '
       "the artifact's own ia-version, \"three\" at 228 and above, \"two\" at 227 and below, so the row still runs on V227")

def cue_site(gate_name):
    return ('// ' + WHY + '. Sited here, after VER: VER is a `let` declared above, so the old site (the HAND ORACLE / '
            'ORACLE block) would read it in its temporal dead zone.\n'
            'const CUE = VER >= 228 ? ' + THREE + ' : ' + TWO + ';\n')

EDITS = {
 'g221': [
   ("const D190_CUE = " + TWO + ";\n"
    "function cueBlind(s){ return (VER > 226 && typeof s === 'string' && s.endsWith(D190_CUE)) ? s.slice(0, s.length - D190_CUE.length) : s; }\n",
    "// V228 D193 R1 (split, Mario round 2; Amendment 2 \"g227 gates\": \"`cueBlind` strips both wordings, the same shape as R4\"):\n"
    "// the cue is recognised by shape, V227's \"two\" and V228's \"three\", still only above 226.\n"
    "const D190_CUE_RE = / — hold RPE 7, (?:two|three) in the tank$/;\n"
    "function cueBlind(s){ if(!(VER > 226 && typeof s === 'string')) return s; const m = D190_CUE_RE.exec(s); return m ? s.slice(0, m.index) : s; }\n"),
 ],
 'seam': [
   ("const CUE = " + TWO + ";\n",
    "// CUE is typed after the version predicate below (V228 D193 R1, split): it reads VER.\n"),
   ("console.log('g227 D190 seam | candidate ' + ART + ' ia-version ' + STAMP",
    cue_site('seam') + "console.log('g227 D190 seam | candidate ' + ART + ' ia-version ' + STAMP"),
 ],
 'pref': [
   ("const CUE = " + TWO + ";\n",
    "// CUE is typed after the version predicate below (V228 D193 R1, split): it reads VER.\n"),
   ("console.log('g227 D190 pref path | candidate ' + ART + ' ia-version ' + STAMP",
    cue_site('pref') + "console.log('g227 D190 pref path | candidate ' + ART + ' ia-version ' + STAMP"),
   # E4 (session decision on c2-iii): at VER >= 228 the V226 baseline detail's exact suffix "two" is read as "three"
   # before the byte compare; below 228 the compare is unchanged.
   ("      if(!a || !b || a.n !== b.n || a.det !== b.det) S3.moved.push(",
    "      // V228 D193 R1 (split), class (i), predicate on VER: at 228 and above the V226 baseline detail's exact suffix\n"
    "      // " + TWO + " is read as " + THREE + " before the byte compare, the word and nothing else;\n"
    "      // below 228 the compare is unchanged. A cue that appears on or vanishes from a non-target card still moves it.\n"
    "      const bDet = (b && VER >= 228 && b.det.endsWith(" + TWO + ")) ? b.det.slice(0, b.det.length - " + TWO + ".length) + " + THREE + " : (b && b.det);\n"
    "      if(!a || !b || a.n !== b.n || a.det !== bDet) S3.moved.push("),
 ],
}
new = {}
for k, eds in EDITS.items():
    t = txt[k]
    for old, rep in eds:
        if t.count(old) != 1: die('%s: anchor count %d: %r' % (k, t.count(old), old[:80]))
    for old, rep in eds:
        t = t.replace(old, rep, 1)
    new[k] = t
# the moved CUE must sit after `let VER` and before its first reader
for k in ('seam', 'pref'):
    t = new[k]; iv = t.index('\nlet VER = STAMP;'); ic = t.index('\nconst CUE = VER >= 228 ?')
    first_read = min(t.index(x) for x in ('endsWith(CUE)', 'CUE.length') if x in t)
    if not (iv < ic < first_read): die('%s: CUE not between let VER and its first reader' % k)
# token-gone scan, comments stripped
def code(t):
    t = re.sub(r'/\*[\s\S]*?\*/', '', t)
    return '\n'.join(re.sub(r'(^|[^:\\])//.*$', r'\1', l) for l in t.split('\n'))
for k in G:
    c = code(new[k])
    print('SCAN %-4s code-only: "two in the tank" %d, "three in the tank" %d, D190_CUE %d' % (k, c.count('two in the tank'), c.count('three in the tank'), len(re.findall(r'\bD190_CUE\b', c))))
if re.search(r'\bD190_CUE\b', code(new['g221'])): die('g221 still reads D190_CUE')

os.makedirs(SCR + '/tmp', exist_ok=True)
env = dict(os.environ, TMPDIR=SCR + '/tmp')
if not os.path.exists(B226):
    r = subprocess.run(['bash', '-c', 'set -eo pipefail; git -C "%s" show 637bc8e:index.html > "%s"' % (ROOT, B226)], capture_output=True, text=True)
    if r.returncode: die('git show V226 failed: ' + r.stderr)

def run(gate_path, art, base):
    r = subprocess.run(['bash', '-c', 'set -eo pipefail; node "%s" "%s" "%s"' % (gate_path, art, base)],
                       capture_output=True, text=True, env=env, cwd=ROOT)
    out = r.stdout + r.stderr
    m = re.findall(r'^PASS (\d+) FAIL (\d+)\s*$', out, re.M)
    return out, (tuple(map(int, m[-1])) if m else None)

def rows(o):
    return [l.rstrip() for l in o.split('\n') if re.match(r'^\s*(PASS|FAIL) ', l)]

MIR = SCR + '/mirror/tests'
os.makedirs(MIR + '/gates', exist_ok=True)
for name, tgt in (('harness.js', ROOT + '/tests/harness.js'), ('measure', ROOT + '/tests/measure')):
    lp = MIR + '/' + name
    if not os.path.islink(lp): os.symlink(tgt, lp)
BAD = []
for k in G:
    mp = MIR + '/gates/' + G[k].split('/')[-1]
    open(mp, 'w', encoding='utf-8').write(new[k])
    o0, s0 = run(G[k], B227, B226)          # pristine on V227
    o1, s1 = run(mp, P, B226)               # new bytes on the 228 tree; argv[3] = V226 (git show 637bc8e), the file the in-repo fallback loads, since the scratch mirror is outside the repo
    o2, s2 = run(mp, B227, B226)            # new bytes on V227
    for tag, o in (('pristine_227', o0), ('new_228', o1), ('new_227', o2)):
        open(SCR + '/%s_%s.out' % (k, tag), 'w', encoding='utf-8').write(o)
    print('RUN %-4s pristine on V227: %s | new on V228: %s | new on V227: %s' % (k, s0, s1, s2))
    same = rows(o0) == rows(o2)
    print('     %-4s V227 row lines pristine == new: %s (%d rows)' % (k, same, len(rows(o0))))
    if s1 is None or s1[1] != 0:
        for l in rows(o1):
            if re.match(r'^\s*FAIL', l): print('     228 ' + l[:400])
    if s2 is None or s2[1] != 0 or not same:
        BAD.append('%s on V227 changed or failed: %r vs pristine %r' % (k, s2, s0))
    if s1 is None or s1[1] != 0:
        BAD.append('%s on the 228 tree does not pass with the new bytes: %r' % (k, s1))
if BAD: die(' ; '.join(BAD) + ' (nothing written)')

for k in G:
    open(G[k], 'w', encoding='utf-8').write(new[k])
    r = subprocess.run(['node', '--check', G[k]], capture_output=True, text=True)
    if r.returncode: die('node --check failed on ' + G[k])
    if open(G[k], encoding='utf-8').read() != open(MIR + '/gates/' + G[k].split('/')[-1], encoding='utf-8').read(): die('written != mirror')
    print('WROTE ' + G[k] + ' (node --check ok, byte-equal to the mirror that ran)')
print('OK')
