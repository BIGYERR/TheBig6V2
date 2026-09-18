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
  - mutations run JOBS-wide (SABOTAGE_JOBS, default 8) but are REPORTED in spec
    order, so the report and the exit code do not depend on completion order;
    SABOTAGE_JOBS=1 reproduces the serial run exactly. Empty or unset means 8
    (matching `${GATE_JOBS:-8}` in gate.sh); 0, negative or non-numeric is a
    CONFIGURATION error and exits 2 before any mutation runs, never clamped
  - a worker that raises is reported as a CRASH row for that mutation only: the
    report, the summary line and the exit code survive it
  - a sweep where every mutation trips is reported with a warning — that is as
    suspicious as a survivor (V185)
Exit code: 0 only when every mutation TRIPPED and none was NOT-APPLIED or CRASHED.
"""
import concurrent.futures, json, os, re, subprocess, sys, tempfile

def jobs_from_env(var, default=8):
    """Empty or unset means `default` — exported-but-empty must behave as unset,
    exactly as `${GATE_JOBS:-8}` does in gate.sh. Only a POSITIVE integer is
    accepted: 0, negative and non-numeric are rejected, NEVER clamped, because a
    silent clamp hides a typo and `-P 0` means unbounded to BSD xargs. This is a
    configuration error, so it exits 2 (the usage-error code) — rc=1 must keep
    meaning "the sweep ran and something was not TRIPPED"."""
    raw = os.environ.get(var, '')
    if raw == '':
        return default
    if not re.match(r'^[0-9]+$', raw) or int(raw) < 1:
        print(f'FAIL: CONFIG: {var} must be a positive integer, or empty/unset which means {default}; got {raw!r}')
        sys.exit(2)
    return int(raw)

JOBS = jobs_from_env('SABOTAGE_JOBS')  # SABOTAGE_JOBS=1 reproduces the serial run exactly

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
    # Mutations are independent: each writes its own mutated copy and runs one gate
    # in its own node process. They are fanned out JOBS-wide and the results are
    # collected into an index-keyed slot, then printed in SPEC ORDER below — so the
    # report, the counts and the exit code are identical to the serial run.
    # The work is entirely subprocess-bound, so threads (not processes) are enough:
    # subprocess.run drops the GIL while node is running.
    # `src` is read-only here; str.count and str.replace are pure. The only writes
    # are to a per-mutation path, which carries the index so that two mutation names
    # that sanitise to the same string cannot race for one file.
    # A raising worker must never kill the whole report. Every exception below —
    # a bad spec row, an unwritable temp path, a failure to spawn node — becomes a
    # CRASH row for THIS mutation, so its slot still fills, the row still prints in
    # SPEC ORDER, the SABOTAGE summary line still prints with it counted in crash,
    # and the process still exits 1. `name` is seeded from the index BEFORE m is
    # read, so a row is always emitted even if m['name'] itself raises.
    def run_one(i, m, td):
        name = f'mutation #{i}'
        try:
            name = m.get('name', name)   # bind the real name FIRST: the unpack below evaluates its whole RHS before binding anything
            name, anchor, repl = m['name'], m['anchor'], m['replacement']
            gate = m['gate'] if os.path.isabs(m['gate']) else os.path.join(here, m['gate'])
            n = src.count(anchor)
            if n != 1:
                return (i, name, 'NOT-APPLIED', f'anchor count={n}')
            mutated = src.replace(anchor, repl)
            if mutated == src:
                return (i, name, 'NOT-APPLIED', 'replacement identical to anchor')
            path = os.path.join(td, f'sab_{i:04d}_{re.sub(r"[^A-Za-z0-9]+","_",name)}.html')
            open(path, 'w', encoding='utf-8').write(mutated)
            status, p, f, out = run_gate(gate, path)
            detail = f'PASS {p} FAIL {f}' if p is not None else 'no summary: ' + out.strip().splitlines()[-1] if out.strip() else 'no output'
            return (i, name, status, f'{os.path.basename(gate)} {detail}')
        except Exception as e:
            return (i, name, 'CRASH', 'exception: ' + ' '.join(f'{type(e).__name__}: {e}'.split()))

    with tempfile.TemporaryDirectory() as td:
        with concurrent.futures.ThreadPoolExecutor(max_workers=JOBS) as pool:
            done = [fu.result() for fu in [pool.submit(run_one, i, m, td) for i, m in enumerate(muts)]]
    results = [(name, status, detail) for _, name, status, detail in sorted(done, key=lambda r: r[0])]

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
