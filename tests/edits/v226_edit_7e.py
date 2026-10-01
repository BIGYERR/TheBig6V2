#!/usr/bin/env python3
# V226 slice 7e: g225_d187_pacerate.js CONFINEMENT under the sabotage runner.
#
# Defect (proved in slice 7e, not assumed): tests/sabotage.py invokes every gate as `node <gate> <html>`
# with no argv[3]. CONFINEMENT reads its baseline only from argv[3] and fails closed without one, so on the
# UNMUTATED control it is RED and every v225 mutation on this gate trips whatever it does (all-trip).
# Not new at 226: V225's own gate (git show 3591994) fails closed the same way with no argv baseline.
# Cause: missing baseline. Not a wrong-version baseline, not the D189 fail-closed clause.
#
# Fix: CONFINEMENT resolves its baseline by era, the g226 pattern. Era 225 (VER < 226) compares against
# V224, the gate's own documented baseline; era 226+ (D189 Class B) compares against V225. argv[3] is used
# only when it is stamped the wanted version; otherwise the pinned commit is pulled with `git show` into
# os.tmpdir(). No baseline at all still fails closed. The self-equality check, the fail-closed clause on an
# unchanged run_base before the strip, and the strip-then-equal assertion are untouched.
#
# Writes all edits or none: every anchor asserted count==1 on the working text, file written once at the end.
import sys

P = '/Users/CanasBangin/Desktop/TheBig6V2/tests/gates/g225_d187_pacerate.js'
src = open(P, encoding='utf-8').read()
txt = src

def rep(old, new, tag):
    global txt
    n = txt.count(old)
    if n != 1:
        print('ABORT %s: anchor count %d, want 1' % (tag, n))
        sys.exit(1)
    txt = txt.replace(old, new, 1)
    print('ok %s' % tag)

# E1: requires for the git-show fallback
rep("const path = require('path'), fs = require('fs');\n",
    "const path = require('path'), fs = require('fs'), os = require('os'), cp = require('child_process');\n",
    'E1 requires')

# E2: pinned baseline commits, keyed by era
rep("const D189_ERA = 226;\n",
    "const D189_ERA = 226;\n"
    "// CONFINEMENT baseline (V226 slice 7e): tests/sabotage.py passes no argv[3], so a baseline read only from argv\n"
    "// failed closed on the control and made every mutation on this gate trip. The baseline is now resolved by era:\n"
    "// argv[3] if it reads the wanted version, else `git show <pinned commit>:index.html` into os.tmpdir().\n"
    "// Era 225 wants V224 (the D187 confinement baseline); era 226+ wants V225 (D189 Class B's before-state).\n"
    "const V224_COMMIT = '7b61da8d66da290186bb27236af63d0eff3d33dd';   // V224: D185 P-WCTODAY\n"
    "const V225_COMMIT = '35919943d766606dcbf5e09c98a08b5782dc2223';   // V225: D186/D187\n",
    'E2 pins')

# E3: header line no longer claims a missing argv baseline fails closed
rep("(BASEFILE ? ' | baseline ' + BASEFILE : ' | NO BASELINE (confinement will fail closed)')",
    "(BASEFILE ? ' | argv baseline ' + BASEFILE : ' | no argv baseline (CONFINEMENT pulls its pinned commit)')",
    'E3 header')

# E4: CONFINEMENT resolves its baseline by era; no baseline still fails closed
rep("  if(!BASEFILE || !fs.existsSync(BASEFILE)){\n"
    "    ok(ROW_LABELS[9], false, 'no baseline artifact provided (fail closed, not a silent pass)');\n"
    "  } else {\n"
    "    const BASE = H.load(BASEFILE);\n",
    "  const WANT_BASE = VER >= D189_ERA ? 225 : 224;\n"
    "  const PIN = WANT_BASE === 225 ? V225_COMMIT : V224_COMMIT;\n"
    "  let BASE = null, baseWhy = '';\n"
    "  if(BASEFILE){\n"
    "    if(!fs.existsSync(BASEFILE)) baseWhy = 'argv baseline missing; ';\n"
    "    else { try { const b = H.load(BASEFILE); if(+b.version === WANT_BASE){ BASE = b; baseWhy = 'argv ' + BASEFILE; } else baseWhy = 'argv baseline reads ' + b.version + ', not ' + WANT_BASE + '; '; } catch(e){ baseWhy = 'argv baseline failed to boot: ' + e.message + '; '; } }\n"
    "  }\n"
    "  if(!BASE){\n"
    "    const f = path.join(os.tmpdir(), 'g225_d187_v' + WANT_BASE + '_' + process.pid + '.html');\n"
    "    try {\n"
    "      try { fs.unlinkSync(f); } catch(e){}\n"
    "      fs.writeFileSync(f, cp.execFileSync('git', ['-C', ROOT, 'show', PIN + ':index.html'], { maxBuffer: 1 << 27 }));\n"
    "      const b = H.load(f); if(+b.version === WANT_BASE){ BASE = b; baseWhy += 'git ' + PIN.slice(0, 7); } else baseWhy += 'git copy reads ' + b.version;\n"
    "    } catch(e){ baseWhy += 'git show failed: ' + String(e.message).slice(0, 80); }\n"
    "    try { fs.unlinkSync(f); } catch(e){}\n"
    "  }\n"
    "  console.log('  CONFINEMENT baseline: ' + (BASE ? 'V' + WANT_BASE + ' from ' + baseWhy : 'UNAVAILABLE (' + baseWhy + ')'));\n"
    "  if(!BASE){\n"
    "    ok(ROW_LABELS[9], false, 'no V' + WANT_BASE + ' baseline (fail closed, not a silent pass): ' + baseWhy);\n"
    "  } else {\n",
    'E4 confinement baseline')

if txt == src:
    print('ABORT: no change'); sys.exit(1)
open(P, 'w', encoding='utf-8').write(txt)
print('WROTE ' + P)
