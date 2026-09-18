#!/usr/bin/env python3
"""parallel_gate_suite_edit.py — TOOLING edit, not an app build. No ia-version bump.

Touches ONLY tests/sabotage.py and tests/gate.sh. index.html is not read or written.

INPUT STATE THIS SCRIPT EXPECTS
-------------------------------
The "PARALLEL" state: the 8-wide parallelization pass has ALREADY been applied to
both files. That means tests/sabotage.py already imports concurrent.futures, already
has `JOBS = int(os.environ.get('SABOTAGE_JOBS', '8'))`, already has the index-keyed
`run_one(i, m, td)` fanned out through a ThreadPoolExecutor with
`max_workers=max(1, JOBS)`, and already re-sorts results into spec order; and
tests/gate.sh already builds "$TMP/gatelist" and runs the gates through
`xargs -0 -n 1 -P "${GATE_JOBS:-8}"` with a sequential grading loop after it.
This script does NOT reproduce that pass. It starts from its output.

WHAT THIS SCRIPT ADDS (the hardening pass)
------------------------------------------
tests/sabotage.py
  S1  docstring: document the JOBS validation contract and the CRASH-row contract
  S2  jobs_from_env(): empty/unset means 8; 0, negative and non-numeric are a
      CONFIGURATION error and exit 2, never clamped
  S3  run_one(): wrap the body in try/except so a raising worker becomes a CRASH row
      for that mutation only, seed `name` from the index, and bind the row's REAL
      name before the tuple unpack (a row that has 'name' but is missing 'anchor'
      must report its name, not "mutation #i")
  S4  max_workers=max(1, JOBS) -> max_workers=JOBS (the clamp is now dead: a
      non-positive JOBS can no longer reach here)
tests/gate.sh
  G1  GATE_JOBS validation block, before gate 0, exit 1 (gate.sh's config-error code)
  G2  xargs -P "${GATE_JOBS:-8}" -> -P "$JOBS" (single validated source of truth)

Usage: python3 tests/edits/parallel_gate_suite_edit.py [ROOT]
ROOT defaults to the repo root (the parent of tests/). Every anchor is asserted
count == 1 before anything is written; the first miss aborts the whole script and
no file is touched.
"""
import os, sys

ROOT = os.path.abspath(sys.argv[1]) if len(sys.argv) > 1 else os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SAB  = os.path.join(ROOT, 'tests', 'sabotage.py')
GATE = os.path.join(ROOT, 'tests', 'gate.sh')

EDITS = []  # (path, tag, anchor, replacement)

# ---------------------------------------------------------------- S1 docstring
EDITS.append((SAB, 'S1 docstring: JOBS contract + CRASH-row contract', r'''    SABOTAGE_JOBS=1 reproduces the serial run exactly
  - a sweep where every mutation trips is reported with a warning''', r'''    SABOTAGE_JOBS=1 reproduces the serial run exactly. Empty or unset means 8
    (matching `${GATE_JOBS:-8}` in gate.sh); 0, negative or non-numeric is a
    CONFIGURATION error and exits 2 before any mutation runs, never clamped
  - a worker that raises is reported as a CRASH row for that mutation only: the
    report, the summary line and the exit code survive it
  - a sweep where every mutation trips is reported with a warning'''))

# ------------------------------------------------------------- S2 jobs_from_env
EDITS.append((SAB, 'S2 jobs_from_env()', r'''JOBS = int(os.environ.get('SABOTAGE_JOBS', '8'))  # SABOTAGE_JOBS=1 reproduces the serial run exactly
''', r'''def jobs_from_env(var, default=8):
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
'''))

# --------------------------------------------- S3 run_one: CRASH slot + real name
EDITS.append((SAB, 'S3 run_one try/except + name seed + real-name bind', r'''    # that sanitise to the same string cannot race for one file.
    def run_one(i, m, td):
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
''', r'''    # that sanitise to the same string cannot race for one file.
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
'''))

# ------------------------------------------------------------- S4 drop the clamp
EDITS.append((SAB, 'S4 drop max(1, JOBS) clamp', r'''ThreadPoolExecutor(max_workers=max(1, JOBS))''', r'''ThreadPoolExecutor(max_workers=JOBS)'''))

# ------------------------------------------------------ G1 GATE_JOBS validation
EDITS.append((GATE, 'G1 GATE_JOBS validation block', r'''trap 'rm -rf "$TMP"' EXIT

echo "== 0. version / filename invariant"''', r'''trap 'rm -rf "$TMP"' EXIT

# GATE_JOBS: empty or unset means 8. Only a POSITIVE integer is accepted. 0 is NOT
# clamped and NOT allowed — BSD xargs reads `-P 0` as UNBOUNDED, which would spawn
# every gate at once; a clamp would silently hide the typo instead. Negative and
# non-numeric are rejected the same way. This is a CONFIGURATION error, not a gate
# result, and it fires before gate 0 so no work is done on a bad value.
JOBS="${GATE_JOBS:-8}"
if ! printf '%s' "$JOBS" | grep -qE '^[0-9]+$' || [ "$JOBS" -lt 1 ]; then
  echo "FAIL: CONFIG: GATE_JOBS must be a positive integer, or empty/unset which means 8; got '$GATE_JOBS'"; exit 1
fi

echo "== 0. version / filename invariant"'''))

# ------------------------------------------------------------- G2 xargs -P "$JOBS"
EDITS.append((GATE, 'G2 xargs -P "$JOBS"', r'''    xargs -0 -n 1 -P "${GATE_JOBS:-8}" "$TMP/rungate.sh" < "$TMP/gatelist"''', r'''    xargs -0 -n 1 -P "$JOBS" "$TMP/rungate.sh" < "$TMP/gatelist"'''))

# ---------------------------------------------------------------------- apply
srcs = {}
for path in (SAB, GATE):
    if not os.path.exists(path):
        sys.exit(f'ABORT: missing {path}')
    srcs[path] = open(path, encoding='utf-8').read()

for path, tag, anchor, repl in EDITS:
    n = srcs[path].count(anchor)
    if n != 1:
        sys.exit(f'ABORT: [{tag}] anchor count={n} (expected 1) in {os.path.basename(path)} — nothing written')
    srcs[path] = srcs[path].replace(anchor, repl)
    print(f'  ok  {os.path.basename(path)}  {tag}')

for path, text in srcs.items():
    open(path, 'w', encoding='utf-8').write(text)
    print(f'WROTE {path}')
print(f'{len(EDITS)} replacements applied.')
