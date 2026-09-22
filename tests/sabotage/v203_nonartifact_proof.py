#!/usr/bin/env python3
"""D120 sabotage: the two cases tests/sabotage.py structurally CANNOT run.

    python3 tests/sabotage/v203_nonartifact_proof.py [candidate.html]

WHY THIS FILE EXISTS
  sabotage.py reads ONE source — the candidate artifact (`src = open(cand).read()`)
  — counts the anchor in it, writes a mutated *.html and runs the named gate on that
  html. There is no target field and no second file. D120's two ruled mutations do
  not touch index.html at all: they touch the TEST SCAFFOLDING, the harness era table
  and the gate line that reads it. Put into v203.json they would count 0 anchors in
  the HTML and report NOT-APPLIED, which is the runner's word for "this mutation did
  not happen" — never a trip. Contorting them into an artifact-shaped mutation would
  prove something other than what coach ruled, so they are proved here instead and
  recorded in v203.json under `_nonartifact_cases` as documentation, outside the
  sweep. The sweep stays at 15 executable rows.

METHOD (identical in spirit to the runner)
  A temp tree gets a copy of tests/harness.js and tests/gates/g200_core_tier.js, the
  anchor is asserted count==1 in the file that actually holds it, the copy is mutated,
  and the SAME gate is run against the UNMUTATED index.html. A control run on the
  unmutated copies must be green first, or nothing below means anything.

  N1  strip the [203] row from MANNY_CORE_OFF_DIGEST_BY_VERSION  -> F1a RED
  N2  revert F1a to the pre-D120 literal '6e32421331693437'      -> F1a RED on V203

  Both must be DISCRIMINATING: exactly one row red, and it must be F1a. A mutation
  that reddens the whole gate proves the gate runs, not that F1a is load-bearing.
"""
import os, re, shutil, subprocess, sys, tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ART  = os.path.abspath(sys.argv[1]) if len(sys.argv) > 1 else os.path.join(ROOT, 'index.html')

HARNESS_REL = 'harness.js'
GATE_REL    = os.path.join('gates', 'g200_core_tier.js')

CASES = [
    dict(
        id='N1',
        file=HARNESS_REL,
        desc="the [203] row is stripped from MANNY_CORE_OFF_DIGEST_BY_VERSION: the era table "
             "loses its V203 entry, so the clause-off counterfactual has nothing to be pinned "
             "against. This is the exact shape of a future build that moves both arms and "
             "forgets the row — which is what standing ruling 5 says must fail loudly.",
        anchor="MANNY_CORE_OFF_DIGEST_BY_VERSION[203] = '658ad56c903ad829';   // D117 moved both arms; D120\n",
        repl="",
        expect_row='F1a',
    ),
    dict(
        id='N2',
        file=GATE_REL,
        desc="F1a is reverted to the pre-D120 literal: the counterfactual is compared against "
             "6e32421331693437, the V198/V199 value the gate pinned before D117 moved both arms. "
             "This is the state of the gate as it stood at the start of this session, and it must "
             "be RED on V203 — that is what makes D120 a repoint and not a cosmetic edit.",
        anchor="const CORE_OFF_ROW=MANNY_CORE_OFF_DIGEST_BY_VERSION[IA.version];   // era row, not a literal (D89)",
        repl="const CORE_OFF_ROW='6e32421331693437';   // SABOTAGE N2: pre-D120 literal",
        expect_row='F1a',
    ),
]

def run(gate_path):
    r = subprocess.run(['node', gate_path, ART], capture_output=True, text=True)
    out = (r.stdout or '') + (r.stderr or '')
    m = re.search(r'^PASS (\d+) FAIL (\d+)\s*$', out, re.M)
    if not m:
        return None, None, out, []
    fails = [l for l in out.splitlines() if l.startswith('  FAIL ')]
    return int(m.group(1)), int(m.group(2)), out, fails

bad = 0
print('artifact under test: %s' % ART)

with tempfile.TemporaryDirectory() as td:
    os.makedirs(os.path.join(td, 'gates'))
    shutil.copy2(os.path.join(ROOT, 'tests', HARNESS_REL), os.path.join(td, HARNESS_REL))
    shutil.copy2(os.path.join(ROOT, 'tests', GATE_REL),    os.path.join(td, GATE_REL))
    pristine = {rel: open(os.path.join(td, rel), encoding='utf-8').read() for rel in (HARNESS_REL, GATE_REL)}
    GATE = os.path.join(td, GATE_REL)

    p, f, out, fails = run(GATE)
    print('\nCONTROL (unmutated copies): PASS %s FAIL %s' % (p, f))
    if p is None or f != 0:
        print('FAIL: control is not green; every result below is meaningless')
        sys.exit(1)
    baseline_pass = p

    for c in CASES:
        target = os.path.join(td, c['file'])
        for rel, txt in pristine.items():
            open(os.path.join(td, rel), 'w', encoding='utf-8').write(txt)
        src = pristine[c['file']]
        n = src.count(c['anchor'])
        print('\n%s  target=tests/%s  anchor count=%d' % (c['id'], c['file'], n))
        print('    %s' % c['desc'])
        if n != 1:
            print('    NOT-APPLIED: anchor count=%d, expected 1' % n); bad += 1; continue
        mutated = src.replace(c['anchor'], c['repl'])
        if mutated == src:
            print('    NOT-APPLIED: replacement identical to anchor'); bad += 1; continue
        open(target, 'w', encoding='utf-8').write(mutated)

        p, f, out, fails = run(GATE)
        if p is None:
            print('    CRASH: no PASS/FAIL summary'); print(out[-600:]); bad += 1; continue
        status = 'TRIPPED' if f > 0 else 'SURVIVED'
        named = [l for l in fails if l.strip().startswith('FAIL ' + c['expect_row'])]
        disc  = (f == 1 and len(named) == 1 and p == baseline_pass - 1)
        print('    %s  PASS %d FAIL %d  (control was PASS %d FAIL 0)' % (status, p, f, baseline_pass))
        print('    RED rows (%d):' % len(fails))
        for l in fails:
            print('      %s' % l.strip())
        print('    discriminating (exactly %s red, every other row green): %s' % (c['expect_row'], 'YES' if disc else 'NO'))
        if status != 'TRIPPED' or not disc:
            bad += 1

print('\nNON-ARTIFACT SABOTAGE: %d of %d cases TRIPPED and discriminating' % (len(CASES) - bad, len(CASES)))
sys.exit(0 if bad == 0 else 1)
