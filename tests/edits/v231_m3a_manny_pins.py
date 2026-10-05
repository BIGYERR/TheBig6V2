#!/usr/bin/env python3
# V231 gate maintenance G3a: the literal HALF_MANNY pins in four gates read the era table.
# Ruling: tests/measure/v231_rulings/v231_absorb_ruling.md section 4 ("(b) the 17 literal
# 0ac7da6b1691a8e1 pins, one rule"): every HALF_MANNY assertion that evaluates at >=231 reads
# MANNY_DIGEST_BY_VERSION[+IA.version] with row existence as a conjunct and compares the built
# digest to that row; the literal goes. Standing rulings 3 (wire a dead pin, never re-point it),
# 4 (a gate is keyed to the ruling it defends) and 5 (HALF_MANNY moves only by a ruling that
# printed the digest first).
# Files (this slice only): g207_gk_trial_present Q7, g207_test_week D9, g208_d103a_chip M1,
# g208_d103a_key K5. index.html is NOT touched (no version meta bump in this script).
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

def note(ruling):
    return (
        "// V231 MAINTENANCE (tests/measure/v231_rulings/v231_absorb_ruling.md section 4; standing rulings 3, 4 and 5):\n"
        "// this row defends " + ruling + "'s claim \"my ruling did not move HALF_MANNY\". The literal it compared\n"
        "// against went: the only object that carries that claim across later rulings is the era table that\n"
        "// standing ruling 5 governs, so the row reads MANNY_DIGEST_BY_VERSION[+IA.version], fails loudly when that\n"
        "// row is absent (row existence is a conjunct), and compares the built digest to it. Re-pointing the literal\n"
        "// to a later digest would be the vacuous line standing ruling 3 forbids; the row stays keyed to\n"
        "// " + ruling + " (standing ruling 4).\n"
    )

def era_check(label_head, label_tail):
    # returns the JS lines (no trailing newline) that compute the era row and assert it
    return (
        "  const eraV = +IA.version, eraHas = Object.prototype.hasOwnProperty.call(MANNY_DIGEST_BY_VERSION, eraV), eraRow = eraHas ? MANNY_DIGEST_BY_VERSION[eraV] : undefined;\n"
        "  ok('" + label_head + " HALF_MANNY digest is the era row MANNY_DIGEST_BY_VERSION[' + eraV + '] = ' + eraRow + ' (" + label_tail + ")',\n"
        "     eraHas && typeof eraRow === 'string' && /^[0-9a-f]{16}$/.test(eraRow) && hm === eraRow, hm + ' vs era row [' + eraV + '] ' + (eraHas ? eraRow : 'ABSENT')); }"
    )

REQ_LP = "const { load, progDigest } = require(path.join(__dirname, '..', 'harness.js'));"
REQ_LP_NEW = "const { load, progDigest, MANNY_DIGEST_BY_VERSION } = require(path.join(__dirname, '..', 'harness.js'));"

EDITS = {
    'tests/gates/g207_gk_trial_present.js': [
        ("const { progDigest } = require(path.join(__dirname, '..', 'harness.js'));",
         "const { progDigest, MANNY_DIGEST_BY_VERSION } = require(path.join(__dirname, '..', 'harness.js'));"),
        ("// Q7: HALF_MANNY is an NRC fixture; the fix-forward touches the NSW test pin and the LSD limb only.\n"
         "{ let hm; try { hm = progDigest(IA.buildProgram(clone(IA.fixtures.HALF_MANNY))); } catch(e){ hm = 'CRASH ' + e.message; }\n"
         "  ok('Q7 HALF_MANNY digest is 0ac7da6b1691a8e1 (ruled unmoved: no NRC card moves)', hm === '0ac7da6b1691a8e1', hm); }",
         "// Q7: HALF_MANNY is an NRC fixture; the fix-forward touches the NSW test pin and the LSD limb only.\n"
         + note('the D106a fix-forward') +
         "{ let hm; try { hm = progDigest(IA.buildProgram(clone(IA.fixtures.HALF_MANNY))); } catch(e){ hm = 'CRASH ' + e.message; }\n"
         + era_check('Q7', 'ruled unmoved: no NRC card moves')),
    ],
    'tests/gates/g207_test_week.js': [
        ("HALF_MANNY is V206's shipped digest\n"
         "//        (0ac7da6b1691a8e1): D106a moves no NRC card.",
         "HALF_MANNY's digest is the era\n"
         "//        row MANNY_DIGEST_BY_VERSION[ia-version] (D9; V231 absorb ruling section 4; it was V206's\n"
         "//        shipped digest through V230): D106a moves no NRC card."),
        (REQ_LP, REQ_LP_NEW),
        ("let hm; try { hm = progDigest(IA.buildProgram(JSON.parse(JSON.stringify(IA.fixtures.HALF_MANNY)))); } catch(e){ hm = 'CRASH ' + e.message; }\n"
         "eq('D9 HALF_MANNY digest is V206\\'s shipped digest (D106a moves no NRC card)', hm, '0ac7da6b1691a8e1');",
         note('D106a') +
         "{ let hm; try { hm = progDigest(IA.buildProgram(JSON.parse(JSON.stringify(IA.fixtures.HALF_MANNY)))); } catch(e){ hm = 'CRASH ' + e.message; }\n"
         + era_check('D9', 'D106a moves no NRC card')),
    ],
    'tests/gates/g208_d103a_chip.js': [
        (REQ_LP, REQ_LP_NEW),
        ("{ let hm; try { hm = progDigest(IA.buildProgram(clone(IA.fixtures.HALF_MANNY))); } catch(e){ hm = 'CRASH ' + e.message; }\n"
         "  ok('M1 HALF_MANNY digest is 0ac7da6b1691a8e1', hm === '0ac7da6b1691a8e1', hm); }",
         note('D103a slice 3') +
         "{ let hm; try { hm = progDigest(IA.buildProgram(clone(IA.fixtures.HALF_MANNY))); } catch(e){ hm = 'CRASH ' + e.message; }\n"
         + era_check('M1', 'D103a slice 3 moves no NRC card')),
    ],
    'tests/gates/g208_d103a_key.js': [
        ("//   K5  HALF_MANNY digest 0ac7da6b1691a8e1 (NRC fixture: nothing it prints is stamped).",
         "//   K5  HALF_MANNY digest is the era row MANNY_DIGEST_BY_VERSION[ia-version], row existence a\n"
         "//       conjunct (NRC fixture: nothing it prints is stamped; V231 absorb ruling section 4)."),
        (REQ_LP, REQ_LP_NEW),
        ("{ let hm; try { hm = progDigest(IA.buildProgram(clone(IA.fixtures.HALF_MANNY))); } catch(e){ hm = 'CRASH ' + e.message; }\n"
         "  ok('K5 HALF_MANNY digest is 0ac7da6b1691a8e1 (NRC: nothing it prints is stamped)', hm === '0ac7da6b1691a8e1', hm); }",
         note('D103a') +
         "{ let hm; try { hm = progDigest(IA.buildProgram(clone(IA.fixtures.HALF_MANNY))); } catch(e){ hm = 'CRASH ' + e.message; }\n"
         + era_check('K5', 'NRC: nothing it prints is stamped')),
    ],
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
    if 'MANNY_DIGEST_BY_VERSION' in src:
        die(rel + ' already names MANNY_DIGEST_BY_VERSION')
    if out.count(LIT) != 0:
        die(rel + ': the literal survives ' + str(out.count(LIT)) + ' time(s)')
    staged[p] = out

# Phase 2: write.
for p, out in staged.items():
    with open(p, 'w', encoding='utf-8') as f:
        f.write(out)
    print('wrote ' + os.path.relpath(p, REPO))
print('OK: 4 files, the literal gone from each; index.html untouched (' + sha16(os.path.join(REPO, 'index.html')) + ')')
