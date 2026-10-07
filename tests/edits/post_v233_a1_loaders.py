#!/usr/bin/env python3
# Post-V233 cleanup slice A1 (tests only; index.html untouched, ia-version stays 233).
# Decision: Mario, tests/measure/v233_rulings/post_v233_proof_scope_decisions.md, Message 3, and CLAUDE.md standing
# ruling 3 as amended: "A check written to switch off after its own build ... retires when the next build ships, and
# the previous-version run (Proof scope) is its replacement." The four `VER === ERA` remnants the retirement slices
# R3/R6 kept (a live row read them on the build pair only) are ruled build-scoped and retire here:
#   g212_d110a_swim      the V211 baseline loader under PAIR, and P1n's `!!BASE ||` term (P1n otherwise unchanged)
#   g221_d177_swapfloor  the V220 pair loader under VER === ERA; G4b/G4c always use their own V220 loader
#   g222_d181_durable    the V221 loader under VER === ERA, and the WRAP/INFO lines that exist only for it
#   g223_d184_testlen    `pair`, the V222 loader, the stale "NRC0 baseline:" print, and R1's blast-radius sub-check
# Then the four gates' lines in tests/version_scope_debt.txt are deleted (each reaches 0 hits).
# Every anchor is asserted count==1 on the text as it stands at that point; the first miss aborts before any write.
import os, re, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
GD = os.path.join(ROOT, 'tests', 'gates')
DEBT = os.path.join(ROOT, 'tests', 'version_scope_debt.txt')
RET = 'retired Post-V233 under standing ruling 3 (build-scoped; the previous-version run replaces it).'

def die(msg):
    print('ABORT: ' + msg); sys.exit(1)

def rep(name, s, old, new):
    n = s.count(old)
    if n != 1: die('%s: anchor count %d, want 1: %r' % (name, n, old[:120]))
    return s.replace(old, new)

def cut(name, s, start, end, must, new):
    # replace the span from `start` through the end of `end`; both anchors count==1, `must` lines inside the span
    for a in (start, end):
        n = s.count(a)
        if n != 1: die('%s: span anchor count %d, want 1: %r' % (name, n, a[:120]))
    i = s.index(start); j = s.index(end) + len(end)
    if j <= i: die('%s: span anchors out of order' % name)
    span = s[i:j]
    for m in must:
        if span.count(m) != 1: die('%s: span lacks %r' % (name, m[:120]))
    return s[:i] + new + s[j:]

def code(s):
    # comments stripped (whole-line // and trailing // after code), strings kept: the token-gone scan
    out = []
    for l in s.split('\n'):
        if l.lstrip().startswith('//'): continue
        m = re.search(r'(^|[\s;){},])//.*$', l)
        out.append(l[:m.start() + len(m.group(1))] if m else l)
    return '\n'.join(out)

def gone(name, s, toks):
    c = code(s)
    for t in toks:
        n = len(re.findall(t, c))
        if n: die('%s: %r still read %d time(s) after the edit' % (name, t, n))

new = {}

# ── g212_d110a_swim ─────────────────────────────────────────────────────────────────────────────────
g = 'g212_d110a_swim'; s = open(os.path.join(GD, g + '.js'), encoding='utf-8').read()
s = rep(g, s, "const fs = require('fs'), os = require('os'), path = require('path'), cp = require('child_process');\n",
              "const fs = require('fs'), path = require('path');\n")
s = rep(g, s, "const BASEFILE = process.argv[3] || null;\n", "")
s = rep(g, s, "const PAIR = VER === ERA;\nconst V211_COMMIT = '6adba21f8214516ec8b743f8a76c76d835e76eb5';\n", "")
s = rep(g, s, "// 212 up. P1n and SH5 are minimum rows; the pair rows keep PAIR.\n", "// 212 up. P1n and SH5 are minimum rows.\n")
s = cut(g, s, "// ── the V211 baseline (build-pair rows only) ",
        "  console.log('baseline: ' + (BASE ? 'V211 from ' + baseWhy : 'UNAVAILABLE (' + baseWhy + ')'));\n}\n",
        ["// (D4 and D5 run after the baseline loads; see below.)\n", "let BASE = null, baseWhy = '', ARGV_BASE_VER = null;\n", "if(PAIR){\n",
         "cp.execFileSync('git', ['-C', repo, 'show', V211_COMMIT + ':index.html']"],
        "// The V211 baseline loader (D110a's build pair, 212 vs 211: P0, P1, P2, D4, D5 and P1n's pair path read it) " + RET + "\n")
s = rep(g, s, "  let p1 = 0, p1bad = [];\n  if(BASE){\n"
              "    for(const [lbl, c] of P1){ p1++; if(WN(IA, c, true) !== WN(BASE, c, false) && p1bad.length < 8) p1bad.push(lbl + ' ' + c.experience + ' seed ' + c.seed); }\n"
              "  }\n", "")
s = rep(g, s, "  // On the build pair the audit rides the P1 loop above; off it (no V211 loaded) the same audit runs on the candidate.\n"
              "  const P1N_RAN = !!BASE || (VER >= ERA && (P1.forEach(([, c]) => WN(IA, c, true)), true));\n",
              "  const P1N_RAN = (VER >= ERA && (P1.forEach(([, c]) => WN(IA, c, true)), true));\n")
gone(g, s, [r'\bBASEFILE\b', r'\bPAIR\b', r'\bV211_COMMIT\b', r'\bBASE\b', r'\bbaseWhy\b', r'\bARGV_BASE_VER\b', r'\bos\.', r'\bcp\.', r'\bp1bad\b', r'VER === ERA'])
if not re.search(r'\bfs\.', code(s)): die(g + ': fs has no reader left; the require line edit is wrong')
for keep in ["minRow('P1n every swim INT note on those builds opens with the typed D110a distance note, build to 8 (' + p1n + ' cards)', P1N_RAN && p1n >= 20 && p1nBad.length === 0, P1N_RAN ? p1nBad.join(' | ') : 'NO BASELINE');"]:
    if s.count(keep) != 1: die(g + ': P1n row text moved')
new[g] = s

# ── g221_d177_swapfloor ─────────────────────────────────────────────────────────────────────────────
g = 'g221_d177_swapfloor'; s = open(os.path.join(GD, g + '.js'), encoding='utf-8').read()
s = cut(g, s, "// Baseline for the pair rows: D177's build pair is 221 against 220.\n",
        "let B4 = B, base4Why = baseWhy;\nif(VER >= ERA && !B4){\n  base4Why = '';\n",
        ["let B = null, baseWhy = '';\nif(VER === ERA){\n", "if(+b.version === BASE_ERA){ B = b; baseWhy += 'baseline from git ' + V220_COMMIT.slice(0, 7); } else baseWhy += 'git reads ' + b.version;\n",
         "// every version from 221 up, so off the build pair they load V220 themselves. The pair rows keep B and PAIR above.\n"],
        "// The V220 pair loader (D177's build pair, 221 vs 220: G4a, G7-4, G8a and G9 read it, and G4b and G4c on 221 through B4 = B) " + RET + "\n"
        "// G4b and G4c run from D177's era onward (Version scope): the named no-change under _swapDetailFor is against V220 at\n"
        "// every version from 221 up, so they load V220 themselves.\n"
        "let B4 = null, base4Why = '';\nif(VER >= ERA){\n")
s = rep(g, s, "      // G4b and G4c (minimum rows) read V220 through sdB4 at every version from 221 up; on the build pair sdB4 is sdB.\n",
              "      // G4b and G4c (minimum rows) read V220 through sdB4 at every version from 221 up.\n")
gone(g, s, [r'\bbaseWhy\b', r'VER === ERA', r'let B = ', r'= B[,;]', r'\(!B\)', r'\bB = b\b'])
for keep in ["if(BASEFILE){ const b = load(BASEFILE); if(+b.version === BASE_ERA) B4 = b; else base4Why = 'argv[3] reads ' + b.version + '; '; }\n",
             "if(+b.version === BASE_ERA){ B4 = b; base4Why += 'baseline from git ' + V220_COMMIT.slice(0, 7); } else base4Why += 'git reads ' + b.version;\n",
             "const sdB4 = B4 ? B4.eval('_swapDetailFor') : null;\n"]:
    if s.count(keep) != 1: die(g + ': G4b/G4c loader text moved: ' + keep[:80])
new[g] = s

# ── g222_d181_durable ───────────────────────────────────────────────────────────────────────────────
g = 'g222_d181_durable'; s = open(os.path.join(GD, g + '.js'), encoding='utf-8').read()
s = rep(g, s, "const BASEFILE = process.argv[3] || null;\nconst ERA = 222, BASE_ERA = 221, V221_COMMIT = '57b9dee80269743a40b350aa399351661dd9c06b';\n",
              "const ERA = 222;\n")
s = cut(g, s, "let B = null, baseWhy = '';\nif(VER === ERA){\n",
        "  } catch(e){ baseWhy += 'baseline load failed: ' + String(e && e.message || e).slice(0, 160); B = null; }\n}\n",
        ["cp.execFileSync('git', ['show', V221_COMMIT + ':index.html']", "if(BASEFILE){ const b = load(BASEFILE); if(+b.version === BASE_ERA) B = b;"],
        "// The V221 loader (D181's build pair, 222 vs 221: 6b, 6c and 7 read it, and the WRAP install and INFO print on the baseline) " + RET + "\n")
s = rep(g, s, "E(IA, WRAP); if(B) E(B, WRAP);\n", "E(IA, WRAP);\n")
s = rep(g, s, "if(B) infoMove(B, 'baseline V' + B.version);\n", "")
# module bindings left with no reader come off the require line
req = "const fs = require('fs'), path = require('path'), os = require('os'), cp = require('child_process');\n"
if s.count(req) != 1: die(g + ': require line anchor')
body = code(s.replace(req, ''))
keepmods = [(n, r) for n, r in (('fs', "fs = require('fs')"), ('path', "path = require('path')"), ('os', "os = require('os')"), ('cp', "cp = require('child_process')")) if re.search(r'\b' + n + r'\.', body)]
print(g + ': require keeps ' + ', '.join(n for n, _ in keepmods))
if 'path' not in [n for n, _ in keepmods]: die(g + ': path has no reader left; the require scan is wrong')
s = s.replace(req, 'const ' + ', '.join(r for _, r in keepmods) + ';\n')
gone(g, s, [r'\bB\b', r'\bbaseWhy\b', r'\bBASEFILE\b', r'\bBASE_ERA\b', r'\bV221_COMMIT\b', r'VER === ERA', r'\bos\.', r'\bcp\.'])
if s.count("infoMove(IA, 'candidate V' + STAMP);\n") != 1: die(g + ': candidate INFO print moved')
new[g] = s

# ── g223_d184_testlen ───────────────────────────────────────────────────────────────────────────────
g = 'g223_d184_testlen'; s = open(os.path.join(GD, g + '.js'), encoding='utf-8').read()
s = rep(g, s, "const fs = require('fs'), os = require('os'), path = require('path'), cp = require('child_process'), vm = require('vm');\n",
              "const fs = require('fs'), path = require('path'), cp = require('child_process'), vm = require('vm');\n")
s = rep(g, s, "const BASEARG = process.argv[3] ? path.resolve(process.argv[3]) : null;\nconst ERA = 223, PREV = 222, PREV_COMMIT = '2694374';\n",
              "const ERA = 223;\n")
s = rep(g, s, "moved-not-(c) 0; blast radius vs V222: every non-(c) return and every 2-argument return byte-equal to V222',\n",
              "moved-not-(c) 0',\n")
s = rep(g, s, "  let tmpBase = null;\n  const done = () => { if(tmpBase){ try { fs.unlinkSync(tmpBase); } catch(e){} } console.log('\\nPASS ' + pass + ' FAIL ' + fail); process.exit(fail ? 1 : 0); };\n",
              "  const done = () => { console.log('\\nPASS ' + pass + ' FAIL ' + fail); process.exit(fail ? 1 : 0); };\n")
s = cut(g, s, "  // The V222 baseline for NRC0 (pair-scoped: only at 223).\n  const pair = VER === ERA;\n",
        "    console.log('NRC0 baseline: ' + (basePath ? baseWhy : 'NONE (' + baseWhy + ')'));\n  }\n",
        ["  let basePath = '', baseWhy = '';\n", "cp.execFileSync('git', ['-C', ROOT, 'show', PREV_COMMIT + ':index.html']"],
        "  // The V222 loader and `pair` (D184's build pair, 223 vs 222: NRC0 and R1's blast-radius part read them) " + RET + "\n")
s = rep(g, s, "{ TZ: tz, G184_ZONE: tag, G184_VER: String(VER), G184_PAIR: pair ? '1' : '', G184_BASE: basePath, G184_BASE_WHY: baseWhy }),",
              "{ TZ: tz, G184_ZONE: tag }),")
s = rep(g, s, "const TAG = process.env.G184_ZONE, VER = +process.env.G184_VER, PAIR = process.env.G184_PAIR === '1';\n",
              "const TAG = process.env.G184_ZONE;\n")
s = rep(g, s, "  const BP = PAIR ? process.env.G184_BASE : '';\n  let B = null;\n"
              "  if(PAIR){ if(!BP) bad.push('no V222 baseline (' + process.env.G184_BASE_WHY + '): the blast-radius part did not run, not a pass'); else B = mkVM(BP); }\n"
              "  let cOk = 0, eqV = 0, eq2 = 0, movedV = 0, moved = 0, cMovedV = 0, selfOk = 0; const seenB = new Set();\n",
              "  // R1's blast-radius part (D184's build pair: every non-(c) and 2-argument return byte-equal to V222) " + RET + "\n"
              "  let cOk = 0, moved = 0;\n")
s = rep(g, s, "    const cr = callAll(V, pts), br = B ? callAll(B, pts) : null;\n"
              "    if(br){ if(J(br) === J(callAll(B, pts))) selfOk++; else bad.push('the V222 baseline does not equal itself on ' + gl + ' today ' + today); for(const q of br) seenB.add(q[0]); }\n",
              "    const cr = callAll(V, pts);\n")
s = rep(g, s, "      if(br){ const b3 = br[i][0], b2 = br[i][1];\n"
              "        if(c2 === b2) eq2++; else why.push('2-argument return ' + c2 + ' vs V222 ' + b2);\n"
              "        if(!x.c){ if(c3 === b3) eqV++; else { why.push('return ' + c3 + ' vs V222 ' + b3); if(r3.start !== JSON.parse(b3).start) movedV++; } }\n"
              "        else if(r3.start !== JSON.parse(b3).start) cMovedV++;\n"
              "      }\n", "")
s = rep(g, s, "  if(B && seenB.size < 2) bad.push('the V222 returns are not input-sensitive (' + seenB.size + ' distinct): an empty diff proves nothing');\n"
              "  const nonC = LAT.length - CC.length;\n", "")
s = rep(g, s, "    + '; moved-not-(c) ' + moved + (B ? '; blast radius vs V222 (' + (process.env.G184_BASE_WHY || '') + '; baseline self-equal ' + selfOk + '/14 chunks, ' + seenB.size + ' distinct returns): non-(c) byte-equal ' + eqV + '/' + nonC + ', 2-argument byte-equal ' + eq2 + '/' + LAT.length\n"
              "      + ', moved-not-(c) vs V222 ' + movedV + ', (c) moved vs V222 ' + cMovedV : PAIR ? '' : '; blast radius vs V222 SCOPED OUT (candidate ' + VER + ', not ' + ERA + ' vs ' + PREV + ')'));\n",
              "    + '; moved-not-(c) ' + moved);\n")
gone(g, s, [r'\bpair\b(?! rows)', r'\bPAIR\b', r'\bbasePath\b', r'\bbaseWhy\b', r'\btmpBase\b', r'\bBASEARG\b', r'\bPREV\b', r'\bPREV_COMMIT\b',
            r'G184_(VER|PAIR|BASE)', r'\bBP\b', r'\bselfOk\b', r'\bseenB\b', r'\beqV\b', r'\beq2\b', r'\bmovedV\b', r'\bcMovedV\b', r'\bnonC\b', r'\bbr\b',
            r'mkVM\(BP\)', r'callAll\(B,', r'VER === ERA', r'\bos\.'])
for keep in ["const V = mkVM(ART);", "STAMP = stampOf(ART);", "cp.spawnSync(process.execPath, [__filename, ART]"]:
    if s.count(keep) != 1: die(g + ': kept reader moved: ' + keep)
new[g] = s

# ── write the gates, prove they parse, prove version_scope sees 0 hits on each ───────────────────────
for g, s in new.items():
    open(os.path.join(GD, g + '.js'), 'w', encoding='utf-8').write(s)
    r = subprocess.run(['node', '--check', os.path.join(GD, g + '.js')], capture_output=True, text=True)
    if r.returncode: die(g + ': node --check failed: ' + r.stderr[-400:])
    print('wrote + node --check ok: tests/gates/' + g + '.js')
r = subprocess.run(['node', os.path.join(ROOT, 'tests', 'version_scope.js'), '--list'], capture_output=True, text=True)
left = [l for l in r.stdout.split('\n') if any(g in l for g in new)]
if left: die('version_scope --list still has hits on this slice\'s gates: ' + ' | '.join(left))
print('version_scope --list: 0 hits on ' + ', '.join(new))

# ── the debt file: re-read immediately before writing (another builder edits other lines in parallel) ──
DL = {
 'g212_d110a_swim': "g212_d110a_swim.js 1  # 10 rows (mE 2/6/2): 8 retired Post-V233 R3, P1n and SH5 re-scoped by slice 9; the hit left is PAIR guarding the V211 baseline loader that P1n reads (P1N_RAN), not a row switch\n",
 'g221_d177_swapfloor': "g221_d177_swapfloor.js 1  # 6 rows (mE 2/3/1): G4a, G7-4, G8a and G9 retired Post-V233 R6, G4b and G4c re-scoped by slice 9; the hit left is VER === ERA guarding the V220 pair loader that G4b and G4c read on 221 (B4 = B), not a row switch\n",
 'g222_d181_durable': "g222_d181_durable.js 1  # 3 rows (mE 0/3/0) retired Post-V233 R6; the hit left is VER === ERA guarding the V221 loader that the WRAP install and the INFO print (never counts) read, not a row switch\n",
 'g223_d184_testlen': "g223_d184_testlen.js 1  # 4 rows (mE 0/2/2) retired Post-V233 R6; the hit left is pair (VER === ERA) guarding the V222 loader that live R1 reads for its pair-scoped blast-radius conjunct, not a row switch\n",
}
d = open(DEBT, encoding='utf-8').read()
for g, line in DL.items():
    d = rep('version_scope_debt.txt', d, line, '')
open(DEBT, 'w', encoding='utf-8').write(d)
print('debt: deleted the lines for ' + ', '.join(DL))
