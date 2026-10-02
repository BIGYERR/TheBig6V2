#!/usr/bin/env python3
# V227 build, slice 10 of D190 P-SWAPSEAM: the three D190 gates resolve their V226 tree without argv[3].
# NO ia-version bump (index.html is already at 227). index.html is not touched by this slice.
#
# Why (slice 9 finding): tests/sabotage.py runs `node <gate> <mutant>` with no argv[3]. g227_d190_seam, g227_d190_cuecap
# and g227_d190_prefpath read their V226 tree from argv[3] only, so on the CLEAN V227 tree under sabotage.py they were
# already red by setup (seam a-U'; cuecap c-TOAST, c-UNINJ, c-DIGEST; prefpath c2-ii, c2-iii) and every mutation read
# TRIPPED vacuously. This is the V226 slice 7e defect. Its fix (tests/gates/g225_d187_pacerate.js:38-43,
# g226_d188_beginnermile.js, g226_d189_pacedisclose.js): argv[3] if it reads the wanted version, else
# `git show <pinned commit>:index.html` into os.tmpdir(), and the run prints which source it used.
#
#   E1 tests/gates/g227_d190_seam.js      row a-U' baseline: argv[3] if it reads 226, else git show of the V226 commit.
#                                         Header usage, ORACLE V226 and VERSION PREDICATE V226-tree lines say so.
#                                         Row (d) is PARKED pending a coach re-ruling; nothing in it is touched.
#   E2 tests/gates/g227_d190_cuecap.js    the same, for the pair rows c-TOAST, c-UNINJ, c-DIGEST.
#   E3 tests/gates/g227_d190_prefpath.js  the same, for c2-ii (its reference) and c2-iii (the pair).
#   E4 tests/sabotage/v227_d190.json      drop slice 9's dated CONTROL clause from each note (it said the clean tree
#                                         fails under sabotage.py with no argv[3]; after E1-E3 that is false). The
#                                         sentence after it ("Row d of g227_d190_seam is PARKED ...") is still true and
#                                         stays. Nothing else in the spec changes: proven by a JSON compare below.
#
# One difference from the g225/g226 form, forced by these gates: fresh('B') reloads FILES.B from disk on every chain,
# so the git copy cannot be unlinked right after the version check. It is unlinked on process 'exit' instead.
# If neither source yields a tree reading 226 (git missing, the commit unreadable), B stays null and the pair rows
# FAIL setup by name, exactly as before. Never PASS.
#
# Every anchor is asserted count==1 before anything is written; all files or none.
import json, re, sys

ROOT = '/Users/CanasBangin/Desktop/TheBig6V2'
SEAM = ROOT + '/tests/gates/g227_d190_seam.js'
CUECAP = ROOT + '/tests/gates/g227_d190_cuecap.js'
PREF = ROOT + '/tests/gates/g227_d190_prefpath.js'
SPEC = ROOT + '/tests/sabotage/v227_d190.json'
V226_COMMIT = '637bc8e24a243daf3803a554125bba117f44281f'

def die(msg):
    print('REFUSED: ' + msg)
    sys.exit(1)

def rd(p):
    return open(p, encoding='utf-8').read()

def rep(src, old, new, where, name):
    n = src.count(old)
    if n != 1:
        die('%s anchor %s count=%d, want 1' % (where, name, n))
    return src.replace(old, new, 1)

ERA_LINE = 'const ERA = 227, BASE_ERA = 226;\n'
COMMIT_LINE = ("const V226_COMMIT = '" + V226_COMMIT + "';   // V226: D188/D189 (the V226 artifact, forever)\n")

def resolver(rows, tag, prefix_js):
    # One resolver, the same bytes in all three gates except the rows it names, its temp-file tag and the console
    # prefix each gate already printed.
    return (
        "// V226 baseline for " + rows + " (V227 slice 10, the V226 slice 7e form of g225_d187_pacerate.js and the g226\n"
        "// gates): argv[3] if it reads 226, else `git show <V226_COMMIT>:index.html` into os.tmpdir(), because\n"
        "// tests/sabotage.py passes no argv[3]. fresh('B') reloads FILES.B on every chain, so the git copy lives until\n"
        "// exit. No tree reading 226 leaves B null and the pair rows FAIL setup by name, never PASS.\n"
        "let B = null, baseWhy = '';\n"
        "if(BASEFILE){\n"
        "  if(!fs.existsSync(BASEFILE)) baseWhy = 'argv[3] ' + BASEFILE + ' missing; ';\n"
        "  else { try { const b = load(BASEFILE); if(+b.version === BASE_ERA){ B = b; FILES.B = BASEFILE; baseWhy = 'argv[3] ' + BASEFILE; } else baseWhy = 'argv[3] reads ia-version ' + b.version + ', not ' + BASE_ERA + '; '; } catch(e){ baseWhy = 'argv[3] failed to boot: ' + String(e && e.message || e).slice(0, 120) + '; '; } }\n"
        "} else baseWhy = 'no argv[3]; ';\n"
        "if(!B){\n"
        "  const f = path.join(os.tmpdir(), '" + tag + "_v' + BASE_ERA + '_' + process.pid + '.html');\n"
        "  try {\n"
        "    try { fs.unlinkSync(f); } catch(e){}\n"
        "    process.on('exit', () => { try { fs.unlinkSync(f); } catch(e){} });\n"
        "    fs.writeFileSync(f, cp.execFileSync('git', ['-C', ROOT, 'show', V226_COMMIT + ':index.html'], { maxBuffer: 1 << 27 }));\n"
        "    const b = load(f); if(+b.version === BASE_ERA){ B = b; FILES.B = f; baseWhy += 'git show ' + V226_COMMIT.slice(0, 7) + ':index.html (fallback)'; } else baseWhy += 'git copy reads ia-version ' + b.version + ', not ' + BASE_ERA;\n"
        "  } catch(e){ baseWhy += 'git show failed: ' + String(e && e.message || e).slice(0, 80); }\n"
        "}\n"
        "console.log(" + prefix_js + " + (B ? 'LIVE (' + baseWhy + ')' : 'SETUP FAILED (' + baseWhy + ')'));\n"
    )

out = {}

# ── E1 seam ────────────────────────────────────────────────────────────────────────────────────────────────────────
s = rd(SEAM)
if s.count('V226_COMMIT') != 0: die('seam already carries V226_COMMIT')
s = rep(s, "//   node tests/gates/g227_d190_seam.js <candidate.html> <baseline_V226.html>\n",
           "//   node tests/gates/g227_d190_seam.js <candidate.html> [baseline_V226.html]\n", 'seam', 'usage1')
s = rep(s, "//   IA_ASSUME_VERSION=227 node tests/gates/g227_d190_seam.js <tree stamped 226> <baseline_V226.html>   (discrimination only)\n",
           "//   IA_ASSUME_VERSION=227 node tests/gates/g227_d190_seam.js <tree stamped 226> [baseline_V226.html]   (discrimination only)\n", 'seam', 'usage2')
s = rep(s, "//   V226   row a-U' only: the baseline's own act and boot of the same chain (argv[3], must read 226).\n",
           "//   V226   row a-U' only: the baseline's own act and boot of the same chain (argv[3] if it reads 226, else the pinned\n"
           "//          V226 commit; see VERSION PREDICATE).\n", 'seam', 'oracle-V226')
s = rep(s, "//   V226 tree      row a-U' reads the baseline from argv[3]. It must read 226, or the row FAILS setup by name, never PASS.\n",
           "//   V226 tree      row a-U' reads the baseline from argv[3] if it reads 226, else from `git show\n"
           "//                  " + V226_COMMIT + ":index.html` (V226) into os.tmpdir(): tests/sabotage.py passes\n"
           "//                  no argv[3] (the V226 slice 7e defect; the fix is the g225_d187_pacerate.js / g226 form). The run\n"
           "//                  prints which source it used. If neither yields a tree reading 226 (git missing, the commit\n"
           "//                  unreadable), the row FAILS setup by name, never PASS.\n", 'seam', 'VP-V226-tree')
s = rep(s, "const fs = require('fs'), path = require('path');\n",
           "const fs = require('fs'), path = require('path'), os = require('os'), cp = require('child_process');\n", 'seam', 'require')
s = rep(s, ERA_LINE, ERA_LINE + COMMIT_LINE, 'seam', 'ERA')
SEAM_OLD = (
    "// V226 baseline for row a-U'\n"
    "let B = null, baseWhy = '';\n"
    "try {\n"
    "  if(!BASEFILE) baseWhy = 'no argv[3]';\n"
    "  else { const b = load(BASEFILE); if(+b.version === BASE_ERA){ B = b; FILES.B = BASEFILE; baseWhy = 'argv[3] ' + BASEFILE; } else baseWhy = 'argv[3] reads ' + b.version + ', not ' + BASE_ERA; }\n"
    "} catch(e){ baseWhy = 'baseline load failed: ' + String(e && e.message || e).slice(0, 160); B = null; }\n"
    "console.log('  V226 tree: ' + (B ? 'LIVE (' + baseWhy + ')' : 'SETUP FAILED (' + baseWhy + ')'));\n")
s = rep(s, SEAM_OLD, resolver("row a-U'", 'g227_d190_seam', "'  V226 tree: '"), 'seam', 'resolver')
out[SEAM] = s

# ── E2 cuecap ──────────────────────────────────────────────────────────────────────────────────────────────────────
s = rd(CUECAP)
if s.count('V226_COMMIT') != 0: die('cuecap already carries V226_COMMIT')
s = rep(s, "//   node tests/gates/g227_d190_cuecap.js <candidate.html> <baseline_V226.html>\n",
           "//   node tests/gates/g227_d190_cuecap.js <candidate.html> [baseline_V226.html]\n", 'cuecap', 'usage1')
s = rep(s, "//   IA_ASSUME_VERSION=227 node tests/gates/g227_d190_cuecap.js <tree stamped 226> <baseline_V226.html>   (discrimination only)\n",
           "//   IA_ASSUME_VERSION=227 node tests/gates/g227_d190_cuecap.js <tree stamped 226> [baseline_V226.html]   (discrimination only)\n", 'cuecap', 'usage2')
s = rep(s, "//   V226   the pair rows: the same chains run on the baseline in argv[3] (what V226 printed on the same taps).\n",
           "//   V226   the pair rows: the same chains run on the V226 baseline (argv[3] if it reads 226, else the pinned V226\n"
           "//          commit; see VERSION PREDICATE), what V226 printed on the same taps.\n", 'cuecap', 'oracle-V226')
s = rep(s, "//   Pair rows (c-TOAST, c-UNINJ, c-DIGEST) read the baseline from argv[3]. It must read ia-version 226, or those rows\n"
           "//   FAIL setup by name, never PASS. c-MANNY reads the harness table, not the baseline.\n",
           "//   Pair rows (c-TOAST, c-UNINJ, c-DIGEST) read the baseline from argv[3] if it reads ia-version 226, else from\n"
           "//   `git show " + V226_COMMIT + ":index.html` (V226) into os.tmpdir(): tests/sabotage.py passes no\n"
           "//   argv[3] (the V226 slice 7e defect; the fix is the g225_d187_pacerate.js / g226 form). The run prints which source\n"
           "//   it used. If neither yields a tree reading 226 (git missing, the commit unreadable), those rows FAIL setup by\n"
           "//   name, never PASS. c-MANNY reads the harness table, not the baseline.\n", 'cuecap', 'VP-pair-rows')
s = rep(s, "const path = require('path');\nconst H = require(path.join(__dirname, '..', 'harness.js'));\n",
           "const path = require('path'), fs = require('fs'), os = require('os'), cp = require('child_process');\n"
           "const H = require(path.join(__dirname, '..', 'harness.js'));\n", 'cuecap', 'require')
s = rep(s, ERA_LINE, ERA_LINE + COMMIT_LINE, 'cuecap', 'ERA')
CUECAP_OLD = (
    "let B = null, baseWhy = '';\n"
    "if(!BASEFILE) baseWhy = 'no argv[3]';\n"
    "else { try { const b = load(BASEFILE); if(+b.version === BASE_ERA){ B = b; FILES.B = BASEFILE; baseWhy = 'argv[3] ' + BASEFILE; } else baseWhy = 'argv[3] reads ia-version ' + b.version + ', not ' + BASE_ERA; }\n"
    "  catch(e){ baseWhy = 'argv[3] load failed: ' + String(e && e.message || e).slice(0, 160); } }\n"
    "console.log('  V' + BASE_ERA + ' baseline: ' + (B ? 'LIVE (' + baseWhy + ')' : 'SETUP FAILED (' + baseWhy + ')'));\n")
s = rep(s, CUECAP_OLD, resolver('the pair rows c-TOAST, c-UNINJ, c-DIGEST', 'g227_d190_cuecap', "'  V' + BASE_ERA + ' baseline: '"), 'cuecap', 'resolver')
out[CUECAP] = s

# ── E3 prefpath ────────────────────────────────────────────────────────────────────────────────────────────────────
s = rd(PREF)
if s.count('V226_COMMIT') != 0: die('prefpath already carries V226_COMMIT')
s = rep(s, "//   node tests/gates/g227_d190_prefpath.js <candidate.html> <baseline_V226.html>\n",
           "//   node tests/gates/g227_d190_prefpath.js <candidate.html> [baseline_V226.html]\n", 'prefpath', 'usage1')
s = rep(s, "//   IA_ASSUME_VERSION=227 node tests/gates/g227_d190_prefpath.js <tree stamped 226> <baseline_V226.html>   (discrimination only)\n",
           "//   IA_ASSUME_VERSION=227 node tests/gates/g227_d190_prefpath.js <tree stamped 226> [baseline_V226.html]   (discrimination only)\n", 'prefpath', 'usage2')
s = rep(s, "built on the BASELINE (argv[3],\n//           V226), so it never",
           "built on the BASELINE (V226,\n//           see VERSION PREDICATE), so it never", 'prefpath', 'oracle-UNINJ')
s = rep(s, "//   Baseline    rows c2-ii (its reference) and c2-iii (the pair) read the baseline from argv[3]. It must read 226, or\n"
           "//               those rows FAIL setup by name, never PASS. Row c2-i and the HAND row need no baseline.\n",
           "//   Baseline    rows c2-ii (its reference) and c2-iii (the pair) read the baseline from argv[3] if it reads 226, else\n"
           "//               from `git show " + V226_COMMIT + ":index.html` (V226) into os.tmpdir():\n"
           "//               tests/sabotage.py passes no argv[3] (the V226 slice 7e defect; the fix is the g225_d187_pacerate.js\n"
           "//               / g226 form). The run prints which source it used. If neither yields a tree reading 226 (git\n"
           "//               missing, the commit unreadable), those rows FAIL setup by name, never PASS. Row c2-i and the HAND\n"
           "//               row need no baseline.\n", 'prefpath', 'VP-baseline')
s = rep(s, "const fs = require('fs'), path = require('path');\n",
           "const fs = require('fs'), path = require('path'), os = require('os'), cp = require('child_process');\n", 'prefpath', 'require')
s = rep(s, ERA_LINE, ERA_LINE + COMMIT_LINE, 'prefpath', 'ERA')
PREF_OLD = (
    "// V226 baseline (argv[3] only)\n"
    "let B = null, baseWhy = '';\n"
    "try {\n"
    "  if(BASEFILE){ const b = load(BASEFILE); if(+b.version === BASE_ERA){ B = b; FILES.B = BASEFILE; baseWhy = 'argv[3] ' + BASEFILE; } else baseWhy = 'argv[3] reads ia-version ' + b.version + ', not ' + BASE_ERA; }\n"
    "  else baseWhy = 'no argv[3]';\n"
    "} catch(e){ baseWhy = 'baseline load failed: ' + String(e && e.message || e).slice(0, 160); B = null; }\n"
    "console.log('  V226 baseline: ' + (B ? 'LIVE (' + baseWhy + ')' : 'SETUP FAILED (' + baseWhy + ')'));\n")
s = rep(s, PREF_OLD, resolver('rows c2-ii and c2-iii', 'g227_d190_prefpath', "'  V226 baseline: '"), 'prefpath', 'resolver')
out[PREF] = s

# ── E4 sabotage spec ───────────────────────────────────────────────────────────────────────────────────────────────
t = rd(SPEC)
CONTROL_RX = re.compile(r' CONTROL \(2026-10-01, V227 slice 9\): tests/sabotage\.py passes no argv\[3\], and this gate reads its'
                        r' V226 tree from argv\[3\] only, so on the CLEAN V227 tree it already FAILs its pair rows by setup'
                        r' \([^)]*\)\. A TRIPPED here is therefore not evidence by itself until the gate resolves its baseline'
                        r' without argv\[3\] \(the V226 slice 7e fix in g225/g226\); the named rows were read with argv\[3\]'
                        r' base_v226\.')
before = json.loads(t)
for i, row in enumerate(before):
    n = len(CONTROL_RX.findall(row['note']))
    if n != 1:
        die('spec row %d (%s) CONTROL clause count=%d, want 1' % (i, row['name'][:40], n))
n_total = len(CONTROL_RX.findall(t))
if n_total != len(before):
    die('spec CONTROL clause total %d != rows %d' % (n_total, len(before)))
t2 = CONTROL_RX.sub('', t)
after = json.loads(t2)
if len(after) != len(before): die('spec row count moved')
for i, (a, b) in enumerate(zip(after, before)):
    if set(a) != set(b): die('spec row %d keys moved' % i)
    for k in b:
        if k == 'note':
            if CONTROL_RX.sub('', b[k]) != a[k]: die('spec row %d note moved beyond the CONTROL clause' % i)
            if 'Row d of g227_d190_seam is PARKED and is named by no mutation.' not in a[k]: die('spec row %d lost the PARKED sentence' % i)
            if 'CONTROL' in a[k]: die('spec row %d still says CONTROL' % i)
        elif a[k] != b[k]:
            die('spec row %d field %s moved' % (i, k))
out[SPEC] = t2

# ── write all or none ──────────────────────────────────────────────────────────────────────────────────────────────
for p, txt in out.items():
    open(p, 'w', encoding='utf-8').write(txt)
    print('wrote ' + p)
print('OK: E1-E4 landed')
