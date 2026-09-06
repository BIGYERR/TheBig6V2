#!/usr/bin/env python3
"""Iron Asylum sabotage runner.

    python3 tests/sabotage.py <candidate.html> tests/sabotage/<vNNN>.json

Each mutation in the JSON is {"name","anchor","replacement","gate"}:
  - anchor must occur EXACTLY once in the candidate (else NOT-APPLIED — reported
    as its own outcome, never as SURVIVED; V177 lesson)
  - the mutated file is written to a temp path and the named gate is run on it
  - the gate must print `PASS n FAIL n`; a missing summary is a CRASH, which is
    NOT a trip (V167 lesson — a dead gate must never read as a passing one)
  - TRIPPED = FAIL > 0 on the named gate. SURVIVED = FAIL == 0.
Standing rules the runner enforces:
  - every gate path is made absolute before running (V185: relative paths made
    every mutation "trip" via MODULE_NOT_FOUND)
  - anchors are read from the JSON file, never from a shell string (V169: "\\n"
    in double quotes arrives as literal backslash-n)
  - a sweep where every mutation trips is reported with a warning — that is as
    suspicious as a survivor (V185)
Exit code: 0 only when every mutation TRIPPED and none was NOT-APPLIED or CRASHED.
"""
import json, os, re, subprocess, sys, tempfile

def run_gate(gate, html):
    gate = os.path.abspath(gate)
    r = subprocess.run(['node', gate, html], capture_output=True, text=True)
    out = (r.stdout or '') + (r.stderr or '')
    m = re.search(r'^PASS (\d+) FAIL (\d+)\s*$', out, re.M)
    if not m:
        return 'CRASH', None, None, out[-800:]
    return ('TRIPPED' if int(m.group(2)) > 0 else 'SURVIVED'), int(m.group(1)), int(m.group(2)), out

def main():
    if len(sys.argv) < 3:
        print(__doc__); sys.exit(2)
    cand = os.path.abspath(sys.argv[1]); spec = os.path.abspath(sys.argv[2])
    src = open(cand, encoding='utf-8').read()
    muts = json.load(open(spec, encoding='utf-8'))
    here = os.path.dirname(os.path.abspath(__file__))
    results = []
    with tempfile.TemporaryDirectory() as td:
        for m in muts:
            name, anchor, repl = m['name'], m['anchor'], m['replacement']
            gate = m['gate'] if os.path.isabs(m['gate']) else os.path.join(here, m['gate'])
            n = src.count(anchor)
            if n != 1:
                results.append((name, 'NOT-APPLIED', f'anchor count={n}')); continue
            mutated = src.replace(anchor, repl)
            if mutated == src:
                results.append((name, 'NOT-APPLIED', 'replacement identical to anchor')); continue
            path = os.path.join(td, f'sab_{re.sub(r"[^A-Za-z0-9]+","_",name)}.html')
            open(path, 'w', encoding='utf-8').write(mutated)
            status, p, f, out = run_gate(gate, path)
            detail = f'PASS {p} FAIL {f}' if p is not None else 'no summary: ' + out.strip().splitlines()[-1] if out.strip() else 'no output'
            results.append((name, status, f'{os.path.basename(gate)} {detail}'))

    width = max(len(r[0]) for r in results) if results else 10
    for name, status, detail in results:
        print(f'{status:<12} {name:<{width}}  {detail}')
    counts = {k: sum(1 for r in results if r[1] == k) for k in ('TRIPPED','SURVIVED','NOT-APPLIED','CRASH')}
    print(f"\nSABOTAGE tripped={counts['TRIPPED']} survived={counts['SURVIVED']} not_applied={counts['NOT-APPLIED']} crash={counts['CRASH']} of {len(results)}")
    if results and counts['TRIPPED'] == len(results) and len(results) >= 3:
        print('WARNING: every mutation tripped. Confirm at least one mutation targets ONLY one gate and that the others stayed green (V185).')
    sys.exit(0 if counts['TRIPPED'] == len(results) and results else 1)

if __name__ == '__main__':
    main()
