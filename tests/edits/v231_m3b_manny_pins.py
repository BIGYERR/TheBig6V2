#!/usr/bin/env python3
# V231 gate maintenance G3b: the literal HALF_MANNY pins in four gates read the era table.
# Ruling: tests/measure/v231_rulings/v231_absorb_ruling.md section 4 (b) ("the 17 literal
# 0ac7da6b1691a8e1 pins, one rule"): every HALF_MANNY assertion that evaluates at >= 231 reads
# MANNY_DIGEST_BY_VERSION[+IA.version] with row existence as a conjunct and compares the built digest
# to that row; the literal goes. Standing rulings 3 (wire a dead pin, never re-point it), 4 (a gate is
# keyed to the ruling it defends) and 5 (HALF_MANNY moves only by a ruling that printed the digest first).
# Files: g208_d103a_readers M1, g208_d104a_runbase M1, g209_d140_tier M1, g210_equipment_denials O6 and
# O6r (O6u untouched). index.html is NOT touched (no version meta bump in this script).
# Refuses unless index.html and the V230 baseline match their sha256 prefixes and every target file is
# byte-identical to HEAD; every anchor must occur exactly once; nothing is written on the first miss.
import hashlib, subprocess, sys, os

REPO = '/Users/CanasBangin/Desktop/TheBig6V2'
BASE = '/private/tmp/claude-501/-Users-CanasBangin-Desktop-TheBig6V2/adf6a3cd-1bcb-472e-a3ec-2078adfbc3be/scratchpad/base_v230.html'
SHAS = {os.path.join(REPO, 'index.html'): '1249c248a6794d1c', BASE: '72ac41c8d34034ce'}

def die(msg):
    print('ABORT: ' + msg); sys.exit(1)

for p, want in SHAS.items():
    got = hashlib.sha256(open(p, 'rb').read()).hexdigest()[:16]
    if got != want: die('%s sha256 %s, want %s' % (p, got, want))

HEAD_NOTE = ('// V231 (absorb ruling section 4, tests/measure/v231_rulings/v231_absorb_ruling.md; standing rulings\n'
             '// 3, 4 and 5): this row defends ITS ruling\'s claim that it did not move HALF_MANNY. The typed\n'
             '// literal is gone: the only object that carries that claim across later rulings is the era table\n'
             '// standing ruling 5 governs, so the row compares the built digest to MANNY_DIGEST_BY_VERSION[ia-version]\n'
             '// and fails loudly when that row is absent. Re-pointing the literal to a later digest would be the\n'
             '// vacuous line standing ruling 3 forbids; deleting the row would be an unruled removal.\n')

ROWCHK = "typeof %s === 'string' && /^[0-9a-f]{16}$/.test(%s)"

EDITS = {
'tests/gates/g208_d103a_readers.js': [
  ("const { load, progDigest, extractInlineJS } = require(path.join(__dirname, '..', 'harness.js'));\n",
   "const { load, progDigest, extractInlineJS, MANNY_DIGEST_BY_VERSION } = require(path.join(__dirname, '..', 'harness.js'));\n"),
  ("{ let hm; try { hm = progDigest(IA.buildProgram(clone(IA.fixtures.HALF_MANNY))); } catch(e){ hm = 'CRASH ' + e.message; }\n"
   "  ok('M1 HALF_MANNY digest is 0ac7da6b1691a8e1 (NRC: no reader change reaches it)', hm === '0ac7da6b1691a8e1', hm); }\n",
   HEAD_NOTE +
   "{ const row = MANNY_DIGEST_BY_VERSION[VER], rowOk = " + (ROWCHK % ('row', 'row')) + ";\n"
   "  let hm; try { hm = progDigest(IA.buildProgram(clone(IA.fixtures.HALF_MANNY))); } catch(e){ hm = 'CRASH ' + e.message; }\n"
   "  ok('M1 HALF_MANNY digest equals its era row MANNY_DIGEST_BY_VERSION[' + VER + '] = ' + row + ', and that row exists (NRC: no reader change reaches it)',\n"
   "     rowOk && hm === row, rowOk ? hm : 'NO ERA ROW for ia-version ' + VER + ' (built ' + hm + ')'); }\n"),
],
'tests/gates/g208_d104a_runbase.js': [
  ("//   M1  HALF_MANNY digest 0ac7da6b1691a8e1.\n",
   "//   M1  HALF_MANNY digest equals its era row MANNY_DIGEST_BY_VERSION[ia-version]; the row must exist\n"
   "//       (V231, absorb ruling section 4: the era table, not a typed literal, carries D104a's claim).\n"),
  ("const { load, progDigest, fixtures } = require(path.join(__dirname, '..', 'harness.js'));\n",
   "const { load, progDigest, fixtures, MANNY_DIGEST_BY_VERSION } = require(path.join(__dirname, '..', 'harness.js'));\n"),
  ("{ let hm; try { hm = progDigest(IA.buildProgram(clone(fixtures.HALF_MANNY))); } catch(e){ hm = 'CRASH ' + e.message; }\n"
   "  ok('M1 HALF_MANNY digest is 0ac7da6b1691a8e1 (NRC: D104a does not reach it)', hm === '0ac7da6b1691a8e1', hm); }\n",
   HEAD_NOTE +
   "{ const row = MANNY_DIGEST_BY_VERSION[VER], rowOk = " + (ROWCHK % ('row', 'row')) + ";\n"
   "  let hm; try { hm = progDigest(IA.buildProgram(clone(fixtures.HALF_MANNY))); } catch(e){ hm = 'CRASH ' + e.message; }\n"
   "  ok('M1 HALF_MANNY digest equals its era row MANNY_DIGEST_BY_VERSION[' + VER + '] = ' + row + ', and that row exists (NRC: D104a does not reach it)',\n"
   "     rowOk && hm === row, rowOk ? hm : 'NO ERA ROW for ia-version ' + VER + ' (built ' + hm + ')'); }\n"),
],
'tests/gates/g209_d140_tier.js': [
  ("//   * M1 is HALF_MANNY's shipped digest as measure printed it (unmoved on all three arms).\n",
   "//   * M1 is HALF_MANNY's digest against its era row MANNY_DIGEST_BY_VERSION[ia-version] (the row must\n"
   "//     exist). Measure printed it unmoved by D140 on all three arms; from V231 the era table, not a\n"
   "//     typed literal, carries that claim (absorb ruling section 4).\n"),
  ("const { load, fixtures, progDigest } = require(path.join(__dirname, '..', 'harness.js'));\n",
   "const { load, fixtures, progDigest, MANNY_DIGEST_BY_VERSION } = require(path.join(__dirname, '..', 'harness.js'));\n"),
  ("{\n"
   "  let hm; try { hm = progDigest(IA.buildProgram(cl(fixtures.HALF_MANNY))); } catch(e){ hm = 'CRASH ' + e.message; }\n"
   "  ok('M1 HALF_MANNY shipped digest is unmoved by D140 (0ac7da6b1691a8e1, measure\\'s print)', hm === '0ac7da6b1691a8e1', hm);\n"
   "}\n",
   HEAD_NOTE +
   "{\n"
   "  const row = MANNY_DIGEST_BY_VERSION[VER], rowOk = " + (ROWCHK % ('row', 'row')) + ";\n"
   "  let hm; try { hm = progDigest(IA.buildProgram(cl(fixtures.HALF_MANNY))); } catch(e){ hm = 'CRASH ' + e.message; }\n"
   "  ok('M1 HALF_MANNY shipped digest is unmoved by D140: it equals its era row MANNY_DIGEST_BY_VERSION[' + VER + '] = ' + row + ', and that row exists',\n"
   "     rowOk && hm === row, rowOk ? hm : 'NO ERA ROW for ia-version ' + VER + ' (built ' + hm + ')');\n"
   "}\n"),
],
'tests/gates/g210_equipment_denials.js': [
  ("//   O6  HALF_MANNY digest, typed: 0ac7da6b1691a8e1 (ruled unmoved; coach's surgery copy).\n",
   "//   O6  HALF_MANNY digest against its era row MANNY_DIGEST_BY_VERSION[ia-version], the row must exist\n"
   "//       (ruled unmoved; coach's surgery copy printed it at V210; V231 absorb ruling section 4 retired\n"
   "//       the typed literal here and in O6r).\n"),
  ("const MANNY = '0ac7da6b1691a8e1';\n"
   "const mp = IA.buildProgram(IA.fixtures.HALF_MANNY), md = progDigest(mp);\n"
   "ok('O6 HALF_MANNY digest is ' + MANNY + ' (ruled unmoved)', md === MANNY, md);\n",
   HEAD_NOTE.replace("this row defends ITS ruling's", "O6 and O6r defend ITS ruling's") +
   "const MANNY = MANNY_DIGEST_BY_VERSION[VER], MANNY_ROW = " + (ROWCHK % ('MANNY', 'MANNY')) + ";\n"
   "const mp = IA.buildProgram(IA.fixtures.HALF_MANNY), md = progDigest(mp);\n"
   "ok('O6 HALF_MANNY digest equals its era row MANNY_DIGEST_BY_VERSION[' + VER + '] = ' + MANNY + ', and that row exists (ruled unmoved)',\n"
   "   MANNY_ROW && md === MANNY, MANNY_ROW ? md : 'NO ERA ROW for ia-version ' + VER + ' (built ' + md + ')');\n"),
  ("owned(FINAL, 'O6r the harness era row for ia-version ' + VER + ' exists and reads ' + MANNY, MANNY_DIGEST_BY_VERSION[VER] === MANNY, MANNY_DIGEST_BY_VERSION[VER]);\n",
   "owned(FINAL, 'O6r the harness era row for ia-version ' + VER + ' exists and reads the digest the candidate builds (' + md + ')',\n"
   "      MANNY_ROW && MANNY === md, MANNY_ROW ? MANNY : 'NO ERA ROW for ia-version ' + VER);\n"),
],
}

# refuse if any target differs from HEAD
for rel in EDITS:
    r = subprocess.run(['git', '-C', REPO, 'diff', '--quiet', 'HEAD', '--', rel])
    if r.returncode != 0: die(rel + ' differs from HEAD')

out = {}
for rel, reps in EDITS.items():
    src = open(os.path.join(REPO, rel), encoding='utf-8').read()
    for old, new in reps:
        n = src.count(old)
        if n != 1: die('%s: anchor count %d, want 1: %r' % (rel, n, old[:90]))
        src = src.replace(old, new)
    if '0ac7da6b1691a8e1' in src: die(rel + ': the literal survives')
    out[rel] = src

for rel, src in out.items():
    open(os.path.join(REPO, rel), 'w', encoding='utf-8').write(src)
    print('wrote ' + rel)
