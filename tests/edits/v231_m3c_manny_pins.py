#!/usr/bin/env python3
# V231 gate maintenance G3c: the literal HALF_MANNY pins in four more gates read the era table.
# Ruling: tests/measure/v231_rulings/v231_absorb_ruling.md section 4 ("(b) the 17 literal
# 0ac7da6b1691a8e1 pins, one rule"): every HALF_MANNY assertion that evaluates at >=231 reads
# MANNY_DIGEST_BY_VERSION[+IA.version] with row existence as a conjunct and compares the built
# digest to that row; the literal goes. Standing rulings 3 (wire a dead pin, never re-point it),
# 4 (a gate is keyed to the ruling it defends) and 5 (HALF_MANNY moves only by a ruling that
# printed the digest first). Form copied from tests/edits/v231_m3a_manny_pins.py (G3a).
# Files (this slice only): g211_d153_d155 HM, g214_d158_eve HM, g215_d149_ghd HM (P1 is NOT
# touched: a later run owns it), g216_d154_swap_lens HM. index.html is NOT touched (no version
# meta bump in this script).
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
REQ_LPFD = "const { load, progDigest, fixtures, DAYS } = require(path.join(__dirname, '..', 'harness.js'));"
REQ_LPFD_NEW = "const { load, progDigest, fixtures, DAYS, MANNY_DIGEST_BY_VERSION } = require(path.join(__dirname, '..', 'harness.js'));"
HM_CONST = "const HM_DIGEST = '0ac7da6b1691a8e1';\n"

EDITS = {
    'tests/gates/g211_d153_d155.js': [
        ("//   HM  HALF_MANNY shipped digest, typed: 0ac7da6b1691a8e1 (ruled unmoved; outside the branch).",
         "//   HM  HALF_MANNY digest is the era row MANNY_DIGEST_BY_VERSION[ia-version], row existence a\n"
         "//       conjunct (ruled unmoved; outside the branch; V231 absorb ruling section 4)."),
        ("const { load, fixtures, progDigest, DAYS } = require(path.join(__dirname, '..', 'harness.js'));",
         "const { load, fixtures, progDigest, DAYS, MANNY_DIGEST_BY_VERSION } = require(path.join(__dirname, '..', 'harness.js'));"),
        (HM_CONST, ""),
        ("ok('HM HALF_MANNY shipped digest is ' + HM_DIGEST + ' (ruled unmoved)', progDigest(IA.buildProgram(cl(fixtures.HALF_MANNY))) === HM_DIGEST, progDigest(IA.buildProgram(cl(fixtures.HALF_MANNY))));",
         note('D153/D155') +
         "{ const hm = progDigest(IA.buildProgram(cl(fixtures.HALF_MANNY)));\n"
         + era_check('HM', 'ruled unmoved')),
    ],
    'tests/gates/g214_d158_eve.js': [
        ("//   HM   HALF_MANNY digest, typed: 0ac7da6b1691a8e1 (ruled unmoved: an NRC fixture, no test pin).",
         "//   HM   HALF_MANNY digest is the era row MANNY_DIGEST_BY_VERSION[ia-version], row existence a\n"
         "//        conjunct (ruled unmoved: an NRC fixture, no test pin; V231 absorb ruling section 4)."),
        ("SKIP by name on every other pair. HM is typed and runs from 214 up.",
         "SKIP by name on every other pair. HM reads the era row and runs from 214 up."),
        (REQ_LP, REQ_LP_NEW),
        ("{ let hm; try { hm = progDigest(IA.buildProgram(clone(IA.fixtures.HALF_MANNY))); } catch(e){ hm = 'CRASH ' + e.message; }\n"
         "  ok('HM HALF_MANNY digest is 0ac7da6b1691a8e1 (ruled unmoved: an NRC fixture carries no test pin)', hm === '0ac7da6b1691a8e1', hm); }",
         note('D158') +
         "{ let hm; try { hm = progDigest(IA.buildProgram(clone(IA.fixtures.HALF_MANNY))); } catch(e){ hm = 'CRASH ' + e.message; }\n"
         + era_check('HM', 'ruled unmoved: an NRC fixture carries no test pin')),
    ],
    'tests/gates/g215_d149_ghd.js': [
        ("//   HM   HALF_MANNY digest, typed: 0ac7da6b1691a8e1 (crossfit owns the station; ruled unmoved).",
         "//   HM   HALF_MANNY digest is the era row MANNY_DIGEST_BY_VERSION[ia-version], row existence a\n"
         "//        conjunct (crossfit owns the station; ruled unmoved; V231 absorb ruling section 4)."),
        (REQ_LPFD, REQ_LPFD_NEW),
        (HM_CONST, ""),
        ("const hm = progDigest(IA.buildProgram(clone(fixtures.HALF_MANNY)));\n"
         "ok('HM HALF_MANNY digest is ' + HM_DIGEST + ' (ruled unmoved)', hm === HM_DIGEST, hm);",
         note('D149') +
         "{ const hm = progDigest(IA.buildProgram(clone(fixtures.HALF_MANNY)));\n"
         + era_check('HM', 'ruled unmoved')),
    ],
    'tests/gates/g216_d154_swap_lens.js': [
        ("//   HM   HALF_MANNY digest, typed: 0ac7da6b1691a8e1 (no injury on the fixture; ruled unmoved).",
         "//   HM   HALF_MANNY digest is the era row MANNY_DIGEST_BY_VERSION[ia-version], row existence a\n"
         "//        conjunct (no injury on the fixture; ruled unmoved; V231 absorb ruling section 4)."),
        (REQ_LPFD, REQ_LPFD_NEW),
        (HM_CONST, ""),
        ("{ const d = progDigest(IA.buildProgram(clone(fixtures.HALF_MANNY)));\n"
         "  ok('HM HALF_MANNY digest is ' + HM_DIGEST + ' (ruled unmoved)', d === HM_DIGEST, d); }",
         note('D154') +
         "{ const hm = progDigest(IA.buildProgram(clone(fixtures.HALF_MANNY)));\n"
         + era_check('HM', 'ruled unmoved')),
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
    if 'MANNY_DIGEST_BY_VERSION' in src:
        die(rel + ' already names MANNY_DIGEST_BY_VERSION')
    out = src
    for old, new in edits:
        n = out.count(old)
        if n != 1:
            die(rel + ': anchor count ' + str(n) + ' != 1: ' + old[:80])
        out = out.replace(old, new)
    if out.count(LIT) != 0:
        die(rel + ': the literal survives ' + str(out.count(LIT)) + ' time(s)')
    if out.count('HM_DIGEST') != 0:
        die(rel + ': HM_DIGEST survives ' + str(out.count('HM_DIGEST')) + ' time(s)')
    staged[p] = out

# Phase 2: write.
for p, out in staged.items():
    with open(p, 'w', encoding='utf-8') as f:
        f.write(out)
    print('wrote ' + os.path.relpath(p, REPO))
print('OK: 4 files, the literal gone from each; index.html untouched (' + sha16(os.path.join(REPO, 'index.html')) + ')')
