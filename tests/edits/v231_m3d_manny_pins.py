#!/usr/bin/env python3
# V231 gate maintenance G3d: the literal HALF_MANNY pins in the last four gates read the era table.
# Ruling: tests/measure/v231_rulings/v231_absorb_ruling.md section 4 ("(b) the 17 literal
# 0ac7da6b1691a8e1 pins, one rule"): every HALF_MANNY assertion that evaluates at >=231 reads
# MANNY_DIGEST_BY_VERSION[+IA.version] with row existence as a conjunct and compares the built
# digest to that row; the literal goes. Section 3 rows: "g226_d189:114/137 G10 | literal + row ->
# row only" and "g228_d192_undokey:131 d2-MANNY | literal + row -> row only" (d2-MANNY's chain
# era == typed == V227 collapses to the era row; the V227 digest stays printed as INFO).
# Standing rulings 3 (wire a dead pin, never re-point it), 4 (a gate is keyed to the ruling it
# defends) and 5 (HALF_MANNY moves only by a ruling that printed the digest first).
# Files (this slice only): g216_d156_longday HM, g223_d183_safepace HM ([NY] and [UTC], one const),
# g226_d189_pacedisclose G10 (G6b untouched), g228_d192_undokey d2-MANNY.
# index.html is NOT touched (no version meta bump in this script). Form copied from
# tests/edits/v231_m3a_manny_pins.py.
import hashlib, os, subprocess, sys

REPO = '/Users/CanasBangin/Desktop/TheBig6V2'
SCRATCH = '/private/tmp/claude-501/-Users-CanasBangin-Desktop-TheBig6V2/adf6a3cd-1bcb-472e-a3ec-2078adfbc3be/scratchpad'
CAND_SHA = '1249c248a6794d1c'
BASE_SHA = '72ac41c8d34034ce'
LIT = '0ac7da6b1691a8e1'

def sha16(p):
    with open(p, 'rb') as f:
        return hashlib.sha256(f.read()).hexdigest()[:16]

def die(msg):
    print('ABORT: ' + msg)
    sys.exit(1)

if sha16(os.path.join(REPO, 'index.html')) != CAND_SHA:
    die('index.html sha is not ' + CAND_SHA)
if sha16(os.path.join(SCRATCH, 'base_v230.html')) != BASE_SHA:
    die('base_v230.html sha is not ' + BASE_SHA)

def note(ruling, idx='+IA.version', extra=''):
    return (
        "// V231 MAINTENANCE (tests/measure/v231_rulings/v231_absorb_ruling.md sections 3 and 4; standing rulings 3, 4 and 5):\n"
        "// this row defends " + ruling + "'s claim \"my ruling did not move HALF_MANNY\". The literal it compared\n"
        "// against went: the only object that carries that claim across later rulings is the era table that\n"
        "// standing ruling 5 governs, so the row reads MANNY_DIGEST_BY_VERSION[" + idx + "], fails loudly when that\n"
        "// row is absent (row existence is a conjunct), and compares the built digest to it. Re-pointing the literal\n"
        "// to a later digest would be the vacuous line standing ruling 3 forbids; the row stays keyed to\n"
        "// " + ruling + " (standing ruling 4)." + extra + "\n"
    )

def era_vars(idx, table):
    return ("const eraV = " + idx + ", eraHas = Object.prototype.hasOwnProperty.call(" + table + ", eraV), eraRow = eraHas ? "
            + table + "[eraV] : undefined")

ERA_OK = "eraHas && typeof eraRow === 'string' && /^[0-9a-f]{16}$/.test(eraRow)"

EDITS = {
    # ── g216_d156: HM (one row, VER >= 216) ──
    'tests/gates/g216_d156_longday.js': [
        ("//   HM   HALF_MANNY digest, typed: 0ac7da6b1691a8e1 (an NRC race program; ruled unmoved).\n",
         "//   HM   HALF_MANNY digest is the era row MANNY_DIGEST_BY_VERSION[ia-version], row existence a conjunct\n"
         "//        (an NRC race program; ruled unmoved; V231 absorb ruling section 4).\n"),
        ("const { load, progDigest, fixtures } = require(path.join(__dirname, '..', 'harness.js'));",
         "const { load, progDigest, fixtures, MANNY_DIGEST_BY_VERSION } = require(path.join(__dirname, '..', 'harness.js'));"),
        ("const HM_DIGEST = '0ac7da6b1691a8e1';\n", ""),
        ("{ const d = progDigest(IA.buildProgram(cl(fixtures.HALF_MANNY)));\n"
         "  ok('HM HALF_MANNY digest is ' + HM_DIGEST + ' (ruled unmoved)', d === HM_DIGEST, d); }\n",
         note('D156') +
         "{ const d = progDigest(IA.buildProgram(cl(fixtures.HALF_MANNY)));\n"
         "  " + era_vars('+IA.version', 'MANNY_DIGEST_BY_VERSION') + ";\n"
         "  ok('HM HALF_MANNY digest is the era row MANNY_DIGEST_BY_VERSION[' + eraV + '] = ' + eraRow + ' (ruled unmoved)',\n"
         "     " + ERA_OK + " && d === eraRow, d + ' vs era row [' + eraV + '] ' + (eraHas ? eraRow : 'ABSENT')); }\n"),
    ],
    # ── g223_d183: HM CONTROL, one const read by the child under both [NY] and [UTC] ──
    'tests/gates/g223_d183_safepace.js': [
        ("//   HM    CONTROL  HALF_MANNY digest 0ac7da6b1691a8e1, self-stable (ruled unmoved; standing ruling 5).\n",
         "//   HM    CONTROL  HALF_MANNY digest is the era row MANNY_DIGEST_BY_VERSION[ia-version], row existence a\n"
         "//         conjunct (V231 absorb ruling section 4), self-stable (ruled unmoved; standing ruling 5).\n"),
        ("  HM: 'HM CONTROL: HALF_MANNY digest 0ac7da6b1691a8e1, self-stable',\n",
         "  HM: 'HM CONTROL: HALF_MANNY digest is the era row MANNY_DIGEST_BY_VERSION[ia-version] (row present), self-stable',\n"),
        ("const HALF_MANNY_DIGEST = '0ac7da6b1691a8e1';\n", ""),
        ("// ── HM: HALF_MANNY, ruled unmoved ──\n"
         "{ const bad = [];\n"
         "  const fx = H.fixtures.HALF_MANNY; if(fx.seed == null) bad.push('fixture seed is not pinned');\n"
         "  const d = [0, 1].map(() => tryDo(() => H.progDigest(IA.buildProgram(JSON.parse(JSON.stringify(fx))))));\n"
         "  if(d[0] !== d[1]) bad.push('not self-stable ' + J(d));\n"
         "  if(d[0] !== HALF_MANNY_DIGEST) bad.push('digest ' + J(d[0]) + ' want ' + HALF_MANNY_DIGEST);\n"
         "  row('HM', bad, 2); }\n",
         "// ── HM: HALF_MANNY, ruled unmoved ──\n"
         + note('D183', extra=' The child reads its own artifact\'s stamp, so [NY] and [UTC] read the same row.') +
         "{ const bad = [];\n"
         "  const fx = H.fixtures.HALF_MANNY; if(fx.seed == null) bad.push('fixture seed is not pinned');\n"
         "  const d = [0, 1].map(() => tryDo(() => H.progDigest(IA.buildProgram(JSON.parse(JSON.stringify(fx))))));\n"
         "  if(d[0] !== d[1]) bad.push('not self-stable ' + J(d));\n"
         "  " + era_vars('+IA.version', 'H.MANNY_DIGEST_BY_VERSION') + ";\n"
         "  if(!(" + ERA_OK + " && d[0] === eraRow)) bad.push('digest ' + J(d[0]) + ' vs era row [' + eraV + '] ' + (eraHas ? eraRow : 'ABSENT'));\n"
         "  row('HM', bad, 2, 'era row [' + eraV + '] ' + eraRow); }\n"),
    ],
    # ── g226_d189: G10 only (literal + row -> row only); G6b is the next run's and is not touched ──
    'tests/gates/g226_d189_pacedisclose.js': [
        ("const HM_DIGEST = '0ac7da6b1691a8e1';\n", ""),
        ("  G10: 'G10 ' + TAG + ' HALF_MANNY: MANNY_DIGEST_BY_VERSION[ver] exists, equals 0ac7da6b1691a8e1, and the build prints it',\n",
         "  G10: 'G10 ' + TAG + ' HALF_MANNY: MANNY_DIGEST_BY_VERSION[ver] exists, is a 16 hex digest, and the build prints it',\n"),
        ("// ── G10: HALF_MANNY ──\n"
         "guard('G10', () => {\n"
         "  const row = H.MANNY_DIGEST_BY_VERSION[VER], built = H.progDigest(build(IA, H.fixtures.HALF_MANNY));\n"
         "  ok(ROW.G10, row !== undefined && row === HM_DIGEST && built === row, 'row[' + VER + '] ' + J(row) + ', built ' + built);\n"
         "});\n",
         "// ── G10: HALF_MANNY ──\n"
         + note('D189', idx='VER', extra=' Section 3: "literal + row -> row only"; VER is this gate\'s own version variable.') +
         "guard('G10', () => {\n"
         "  " + era_vars('VER', 'H.MANNY_DIGEST_BY_VERSION') + ", built = H.progDigest(build(IA, H.fixtures.HALF_MANNY));\n"
         "  ok(ROW.G10, " + ERA_OK + " && built === eraRow, built + ' vs era row [' + eraV + '] ' + (eraHas ? eraRow : 'ABSENT'));\n"
         "});\n"),
    ],
    # ── g228_d192: d2-MANNY (literal + row -> row only) ──
    'tests/gates/g228_d192_undokey.js': [
        ("//   ERA TABLE   d2-MANNY: MANNY_DIGEST_BY_VERSION[VER] and the digest typed here, 0ac7da6b1691a8e1 (standing ruling 5,\n"
         "//               unmoved; printed by coach on V227 and by measure on CF and CF2).\n",
         "//   ERA TABLE   d2-MANNY: MANNY_DIGEST_BY_VERSION[VER], row existence a conjunct (standing ruling 5, unmoved; printed\n"
         "//               by coach on V227 and by measure on CF and CF2). The digest once typed here and the V227 baseline's\n"
         "//               digest left the assertion at V231 (absorb ruling sections 3 and 4: literal + row -> row only).\n"),
        ("//   V227 tree      INFO and d2-MANNY read the baseline from argv[3] if it reads 227, else from `git show\n"
         "//                  5ce31e8a5f175e69009f6e1c46b93f3d5e62eb47:index.html` (V227) into os.tmpdir(), because tests/sabotage.py\n"
         "//                  passes no argv[3] (g227's form). The run prints which source it used. No tree reading 227 FAILS\n"
         "//                  d2-MANNY and the refutation guard by name, never PASS.\n",
         "//   V227 tree      INFO and the refutation guard read the baseline from argv[3] if it reads 227, else from `git show\n"
         "//                  5ce31e8a5f175e69009f6e1c46b93f3d5e62eb47:index.html` (V227) into os.tmpdir(), because tests/sabotage.py\n"
         "//                  passes no argv[3] (g227's form). The run prints which source it used. No tree reading 227 FAILS\n"
         "//                  the refutation guard by name, never PASS. d2-MANNY prints the V227 digest when that tree is live\n"
         "//                  and asserts the era row only (V231 absorb ruling section 3).\n"),
        ("//   d2-MANNY   HALF_MANNY digest == MANNY_DIGEST_BY_VERSION[VER] == 0ac7da6b1691a8e1 == the V227 baseline's,\n",
         "//   d2-MANNY   HALF_MANNY digest == MANNY_DIGEST_BY_VERSION[VER], row existence a conjunct (V231 absorb ruling\n"
         "//              sections 3 and 4: the typed literal and the V227 equality left the row; V227's digest prints as INFO),\n"),
        ("const MANNY_TYPED = '0ac7da6b1691a8e1';\n", ""),
        ("  MANNY: 'row d2-MANNY D192 HALF_MANNY digest == era table == 0ac7da6b1691a8e1 == V227, self-stable; swapOriginOf reached 0 times by buildProgram and refreshProgram (counter wired)',\n",
         "  MANNY: 'row d2-MANNY D192 HALF_MANNY digest == era table row MANNY_DIGEST_BY_VERSION[VER] (row present), self-stable; swapOriginOf reached 0 times by buildProgram and refreshProgram (counter wired)',\n"),
        ("// V227 baseline (INFO, the guard, d2-MANNY): argv[3] if it reads 227, else `git show <V227_COMMIT>:index.html` into\n"
         "// os.tmpdir(), because tests/sabotage.py passes no argv[3]. fresh('B') reloads FILES.B on every chain, so the git copy\n"
         "// lives until exit. No tree reading 227 leaves B null; d2-MANNY and the guard then FAIL setup by name, never PASS.\n",
         "// V227 baseline (INFO, the guard; d2-MANNY prints its digest): argv[3] if it reads 227, else `git show <V227_COMMIT>:index.html` into\n"
         "// os.tmpdir(), because tests/sabotage.py passes no argv[3]. fresh('B') reloads FILES.B on every chain, so the git copy\n"
         "// lives until exit. No tree reading 227 leaves B null; the guard then FAILS setup by name, never PASS.\n"),
        ("  const era = MANNY_DIGEST_BY_VERSION[VER];\n"
         "  const dB = B ? progDigest(fresh('B').buildProgram(clone(fixtures.HALF_MANNY))) : null;\n"
         "  console.log('    d2-MANNY candidate ' + d1 + ' (self-stable ' + (d1 === d2) + ') | era[' + VER + '] ' + era + ' | typed ' + MANNY_TYPED + ' | V227 ' + (dB || 'n/a (' + baseWhy + ')')\n"
         "    + ' | swapOriginOf calls in 2 buildProgram + 1 refreshProgram: ' + nBuild + ', counter wired ' + wired);\n"
         "  ok(R.MANNY + (B ? '' : ' (setup: no V227 tree: ' + baseWhy + ')'), d1 === d2 && d1 === era && d1 === MANNY_TYPED && dB === d1 && nBuild === 0 && wired, d1 + ', calls ' + nBuild);\n",
         note('D192', idx='VER', extra=' Section 3: "literal + row -> row only"; VER is this gate\'s own version variable.').replace('\n// ', '\n  // ').replace('// V231', '  // V231', 1) +
         "  " + era_vars('VER', 'MANNY_DIGEST_BY_VERSION') + ";\n"
         "  const dB = B ? progDigest(fresh('B').buildProgram(clone(fixtures.HALF_MANNY))) : null;\n"
         "  console.log('    d2-MANNY candidate ' + d1 + ' (self-stable ' + (d1 === d2) + ') | era[' + eraV + '] ' + (eraHas ? eraRow : 'ABSENT') + ' | V227 (INFO) ' + (dB || 'n/a (' + baseWhy + ')')\n"
         "    + ' | swapOriginOf calls in 2 buildProgram + 1 refreshProgram: ' + nBuild + ', counter wired ' + wired);\n"
         "  ok(R.MANNY, d1 === d2 && " + ERA_OK + " && d1 === eraRow && nBuild === 0 && wired, d1 + ' vs era row [' + eraV + '] ' + (eraHas ? eraRow : 'ABSENT') + ', calls ' + nBuild);\n"),
    ],
}

GONE = {
    'tests/gates/g216_d156_longday.js': ['HM_DIGEST'],
    'tests/gates/g223_d183_safepace.js': ['HALF_MANNY_DIGEST'],
    'tests/gates/g226_d189_pacedisclose.js': ['HM_DIGEST'],
    'tests/gates/g228_d192_undokey.js': ['MANNY_TYPED'],
}

# Phase 1: every file equals HEAD, every anchor count==1, nothing written yet.
staged = {}
for rel, edits in EDITS.items():
    p = os.path.join(REPO, rel)
    with open(p, 'r', encoding='utf-8') as f:
        src = f.read()
    head = subprocess.run(['git', '-C', REPO, 'show', 'HEAD:' + rel], capture_output=True, check=True).stdout.decode('utf-8')
    if src != head:
        die(rel + ' differs from HEAD (another writer?)')
    out = src
    for old, new in edits:
        n = out.count(old)
        if n != 1:
            die(rel + ': anchor count ' + str(n) + ' != 1: ' + old[:80])
        out = out.replace(old, new)
    if out.count(LIT) != 0:
        die(rel + ': the literal survives ' + str(out.count(LIT)) + ' time(s)')
    for tok in GONE[rel]:
        if tok in out:
            die(rel + ': identifier ' + tok + ' survives')
    staged[p] = (src, out)

# g226_d189 G6b must be byte-identical (the next run's row).
src, out = staged[os.path.join(REPO, 'tests/gates/g226_d189_pacedisclose.js')]
g6b_src = [l for l in src.split('\n') if 'G6b' in l]
g6b_out = [l for l in out.split('\n') if 'G6b' in l]
if g6b_src != g6b_out or not g6b_src:
    die('g226_d189 G6b lines moved')

# Phase 2: write.
for p, (src, out) in staged.items():
    with open(p, 'w', encoding='utf-8') as f:
        f.write(out)
    print('wrote ' + os.path.relpath(p, REPO))
print('OK: 4 files, the literal gone from each; index.html untouched (' + sha16(os.path.join(REPO, 'index.html')) + ')')
