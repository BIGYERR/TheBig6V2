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
  - a mutation whose gate has a pool column in tests/gate_times.txt (`<gate> <seconds> pool=<n>`: the gate
    runs workers of its own, g230 today) runs AFTER the others, one at a time, with GATE_POOL=<SABOTAGE_JOBS>
    in its environment, in every mode (post-V233 s11). The report stays in spec order, so it reads the same as
    when every mutation ran JOBS-wide. A third column that is not pool=<positive integer> exits 2 (CONFIG)
  - a worker that raises is reported as a CRASH row for that mutation only: the
    report, the summary line and the exit code survive it
  - a sweep where every mutation trips is reported with a warning — that is as
    suspicious as a survivor (V185)
Exit code: 0 only when every mutation TRIPPED and none was NOT-APPLIED or CRASHED.

Modes (post-V233 Proof scope; CLAUDE.md Proof scope, Sabotage). The plain call above is unchanged and is what
the 7-day full sweep runs, spec by spec.

    python3 tests/sabotage.py --anchors-only <cand> [spec ...] [--known <list>]
        Count every mutation's anchor in <cand> (default: every tests/sabotage/*.json) and run NO gate. Prints
        each NOT-APPLIED with its spec and name, then `ANCHORS n checked, k not-applied (d documented)`. Exit 1
        on an undocumented NOT-APPLIED, on a documented one whose anchor applies again (STALE: the list only
        shrinks), and on a spec row that cannot be read. The documented list is
        tests/sabotage/known_not_applied.txt (`<spec>.json <mutation name>  # reason, build`); it is a .txt and
        is never read as a spec.
    python3 tests/sabotage.py --gates g1,g2 <cand> [spec ...] [--known <list>] [--survivors <list>]
        Trip-run only the mutations whose gate basename is listed (`.js` optional). A listed gate that no
        selected mutation names is a failure.
    python3 tests/sabotage.py --proof-set <git-ref> <cand> [--dry] [--known <list>] [--survivors <list>]
        1. the anchor check above, over every spec. 2. the proof set: every mutation in a spec added since
        <ref>, every mutation naming a gate edited since <ref> (`tests/era_bump.py --era-only-diff <ref>`;
        era-only files do not count), every mutation naming a gate `node tests/version_scope.js --gates` lists
        (the backstop); each is printed with its reasons, then the set size by reason. 3. trip-run the set.
        --dry stops after 2. The verdict is the anchor check AND the trip run (with --dry, the anchor check).
In --gates and --proof-set a documented NOT-APPLIED is reported and does not fail the run, and so is a documented
SURVIVED: tests/sabotage/known_survivors.txt (post-V233 s8; the same line format, `--survivors <list>` overrides it,
--anchors-only never reads it). Every other row must TRIP: an undocumented survivor fails as it always has. A documented
survivor that TRIPS, or whose anchor no longer applies, fails as STALE, and so does a survivors line naming no spec or no
mutation (the list only shrinks). A listed survivor the selection does not run is not judged. An empty selection is a
failure. Exit 2 is a usage or configuration error in every mode.
"""
import concurrent.futures, hashlib, json, os, re, subprocess, sys, tempfile

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

# Filesystem limits the mutant path has to live inside. NAME_MAX is per path
# COMPONENT; PATH_MAX is the whole path. A path can be legal while its basename
# is not, and a basename can be legal while the path it hangs off is not, so the
# clamp below budgets against both.
NAME_MAX = 255    # bytes in one component (APFS, HFS+, ext4) — probed: 255 writes, 256 is errno 63
PATH_MAX = 1016   # bytes in a WHOLE path. darwin declares 1024 in sys/syslimits.h, but APFS
                  # here refuses at 1017 (probed, V198). Budget against the number that is
                  # actually true, not the number in the header.

def mutant_path(td, i, name, name_max=NAME_MAX, path_max=PATH_MAX):
    """Temp path for mutation `i`, clamped so no mutation NAME can be unwritable.

    V194, V197 and V197-again each lost a sweep to OSError 63 ENAMETOOLONG here:
    the mutant filename was built straight from the mutation name, a 364-byte
    name is legal JSON and not a legal filename, and the crash landed BEFORE the
    mutation ran, so the whole sweep died reporting nothing. Worked around three
    times by shortening names in the spec. Clamped in the runner instead.

    The budget is taken on the FULL PATH, not just the name fragment: the tempdir
    prefix counts, and short names under a long prefix are exactly what blew up.
    Both limits bind: the component limit is what fires under a normal /var/folders
    tempdir, the whole-path limit is what fires under a deep one.

    The digest is what makes truncation safe. Truncating turns two long names
    that share a prefix into ONE filename, and two mutations writing the same
    temp file is a worse defect than the crash it replaces: they would race, and
    a gate would silently score the wrong mutant. Appending 8 hex of the FULL
    original name makes the clamped stem a function of the whole name again, and
    keeps it traceable back to the row it came from. (The `sab_%04d_` index
    prefix already makes the path unique within one sweep; the digest keeps the
    guarantee from depending on that prefix, and survives it being changed.) It
    is appended ALWAYS, not only when truncating, so the disambiguator is on the
    hot path of every sweep and cannot rot as never-executed code.

    Only the PATH is clamped. The caller's `name` is untouched, so the
    TRIPPED / NOT-APPLIED report still prints the full original name verbatim.
    """
    stem = 'sab_%04d_' % i
    tag = '_' + hashlib.sha1(name.encode('utf-8')).hexdigest()[:8]
    ext = '.html'
    slug = re.sub(r'[^A-Za-z0-9]+', '_', name)            # ASCII after this, so len == bytes
    fixed = len(stem) + len(tag) + len(ext)
    room = min(name_max, path_max - (len(td.encode('utf-8')) + 1)) - fixed
    if room < 0:
        room = 0
    return os.path.join(td, stem + slug[:room] + tag + ext)

def run_gate(gate, html, env=None):
    gate = os.path.abspath(gate)
    r = subprocess.run(['node', gate, html], capture_output=True, text=True, env=env)
    out = (r.stdout or '') + (r.stderr or '')
    m = re.search(r'^PASS (\d+) FAIL (\d+)\s*$', out, re.M)
    if not m:
        return 'CRASH', None, None, out[-800:]
    return ('TRIPPED' if int(m.group(2)) > 0 else 'SURVIVED'), int(m.group(1)), int(m.group(2)), out

def run_mutation(src, here, i, m, td, pool=None):
    """One mutation against one candidate: (i, name, status, detail). Moved verbatim out of
    main() at post-V233 s6 so the plain call and the --gates / --proof-set modes trip-run
    through the SAME code; `src` and `here` were main()'s closure and are now parameters."""
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
        path = mutant_path(td, i, name)   # clamped: a long name must never kill a sweep (V194/V197/V197)
        open(path, 'w', encoding='utf-8').write(mutated)
        status, p, f, out = run_gate(gate, path, None if pool is None else dict(os.environ, GATE_POOL=str(pool)))
        detail = f'PASS {p} FAIL {f}' if p is not None else 'no summary: ' + out.strip().splitlines()[-1] if out.strip() else 'no output'
        return (i, name, status, f'{os.path.basename(gate)} {detail}')
    except Exception as e:
        return (i, name, 'CRASH', 'exception: ' + ' '.join(f'{type(e).__name__}: {e}'.split()))

# ---- modes: --anchors-only, --gates, --proof-set -------------------------------------------------------------
# Post-V233 Proof scope (Mario; tests/measure/v233_rulings/post_v233_proof_scope_decisions.md; CLAUDE.md Proof
# scope, Sabotage): every build anchor-checks every mutation in every spec with no gate run, then trip-runs its
# proof set. The plain `sabotage.py <cand> <spec>` call in main() is unchanged; the 7-day full sweep runs it.
import glob

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SPEC_DIR = os.path.join(HERE, 'sabotage')
KNOWN = os.path.join(SPEC_DIR, 'known_not_applied.txt')
KNOWN_SURV = os.path.join(SPEC_DIR, 'known_survivors.txt')   # post-V233 s8: read by --gates and --proof-set only
TRIP_PATHS = ('--known', '--survivors')                       # the path options of the two modes that trip-run
REQUIRED = ('name', 'anchor', 'replacement', 'gate')
USAGE = ('usage: sabotage.py --anchors-only <cand> [spec ...] [--known <list>]\n'
         '       sabotage.py --gates g1,g2 <cand> [spec ...] [--known <list>] [--survivors <list>]\n'
         '       sabotage.py --proof-set <git-ref> <cand> [--dry] [--known <list>] [--survivors <list>]')

def usage_exit(msg):
    print('FAIL: USAGE: ' + msg)
    print(USAGE)
    sys.exit(2)

def config_exit(msg):
    print('FAIL: CONFIG: ' + msg)
    sys.exit(2)

def one_line(e):
    return ' '.join(f'{type(e).__name__}: {e}'.split())

def take_flags(args, bare=(), paths=('--known',)):
    """Pull the path options (`--known PATH`; `--survivors PATH` too in the modes that pass TRIP_PATHS) and the bare
    flags out of args. Any other `--x` is a usage error, never ignored."""
    opts, rest, k = {}, [], 0
    while k < len(args):
        a = args[k]
        if a in paths:
            if k + 1 >= len(args) or args[k + 1].startswith('--'):
                usage_exit(a + ' needs a path')
            if a in opts:
                usage_exit(a + ' given twice')
            opts[a] = args[k + 1]
            k += 2
            continue
        if a in bare:
            opts[a] = True
        elif a.startswith('--'):
            usage_exit('unknown option ' + a)
        else:
            rest.append(a)
        k += 1
    return opts, rest

def read_cand(cand):
    p = os.path.abspath(cand)
    if not os.path.isfile(p):
        usage_exit('no such candidate ' + cand)
    return open(p, encoding='utf-8').read()

def spec_paths(args):
    """(paths, every): the named specs, or every tests/sabotage/*.json. The known list is a .txt, never a spec."""
    if not args:
        return sorted(glob.glob(os.path.join(SPEC_DIR, '*.json'))), True
    out = []
    for a in args:
        p = os.path.abspath(a)
        if not p.endswith('.json'):
            usage_exit(a + ' is not a spec: a spec is a .json file (tests/sabotage/known_not_applied.txt is the '
                       'documented list, never a spec)')
        if not os.path.isfile(p):
            usage_exit('no such spec ' + a)
        if p not in out:
            out.append(p)
    if len({os.path.basename(p) for p in out}) != len(out):
        usage_exit('two specs share one basename; the known list keys a spec by its basename')
    return out, False

def load_known(path):
    """{(spec basename, mutation name): (line, reason)}. Unreadable or repeated lines are a CONFIG error."""
    rel = os.path.relpath(path, ROOT)
    if not os.path.isfile(path):
        config_exit('no known list ' + rel + ' (an empty list is a file with no entry lines, not a missing file)')
    known = {}
    for k, raw in enumerate(open(path, encoding='utf-8').read().split('\n'), 1):
        line = raw.rstrip()
        if not line.strip() or line.lstrip().startswith('#'):
            continue
        sp, _, rest = line.partition(' ')
        name, sep, why = rest.partition('  # ')
        if not sp.endswith('.json') or not sep or not name or name != name.strip() or not why.strip():
            config_exit(f'{rel} line {k} unreadable, want "<spec>.json <mutation name>  # reason, build": {line}')
        if (sp, name) in known:
            config_exit(f'{rel} line {k} repeats {sp} {name}')
        known[(sp, name)] = (k, why.strip())
    return known

def load_rows(specs):
    """[(spec basename, index, mutation)] in spec order, and [(spec, name, why)] for what cannot be read."""
    rows, bad = [], []
    for p in specs:
        sp = os.path.basename(p)
        try:
            muts = json.load(open(p, encoding='utf-8'))
            if not isinstance(muts, list):
                raise ValueError('the top level is not a list of mutations')
        except Exception as e:
            bad.append((sp, '(whole spec)', 'unreadable: ' + one_line(e)))
            continue
        for i, m in enumerate(muts):
            if not isinstance(m, dict) or any(not isinstance(m.get(f), str) for f in REQUIRED):
                nm = m['name'] if isinstance(m, dict) and isinstance(m.get('name'), str) else f'mutation #{i}'
                bad.append((sp, nm, 'malformed: needs string ' + ', '.join(REQUIRED)))
                continue
            rows.append((sp, i, m))
    return rows, bad

def gate_rel(m):
    """The mutation's gate as a repo-relative path, resolved by the same join run_mutation makes."""
    g = m['gate'] if os.path.isabs(m['gate']) else os.path.join(HERE, m['gate'])
    return os.path.relpath(os.path.normpath(g), ROOT)

def gate_stem(g):
    return os.path.splitext(os.path.basename(g.strip()))[0]

def anchor_status(src, m):
    """The applies test run_mutation makes, with no gate run: (True, '') or (False, why)."""
    n = src.count(m['anchor'])
    if n != 1:
        return False, f'anchor count={n}'
    if src.replace(m['anchor'], m['replacement']) == src:
        return False, 'replacement identical to anchor'
    return True, ''

def anchors_check(src, specs, every, known):
    """Count every mutation's anchor in the candidate and run no gate. True only when every NOT-APPLIED is
    documented, no documented entry is stale and every spec row could be read."""
    rows, bad = load_rows(specs)
    na = []
    for sp, i, m in rows:
        ok, why = anchor_status(src, m)
        if not ok:
            na.append((sp, m['name'], why))
    undoc = 0
    for sp, name, why in na:
        if (sp, name) in known:
            print(f'NOT-APPLIED  documented    {sp}  {name}  ({why})  # {known[(sp, name)][1]}')
        else:
            undoc += 1
            print(f'NOT-APPLIED  UNDOCUMENTED  {sp}  {name}  ({why})')
    scope = {os.path.basename(p) for p in specs}
    names = {(sp, m['name']) for sp, _, m in rows}
    unapplied = {(sp, name) for sp, name, _ in na}
    stale = []
    for (sp, name), (k, _) in sorted(known.items(), key=lambda kv: kv[1][0]):
        if sp not in scope:
            if every:
                stale.append((k, sp, name, 'no spec ' + sp + ' in tests/sabotage'))
        elif (sp, name) not in names:
            stale.append((k, sp, name, 'no mutation of that name in ' + sp))
        elif (sp, name) not in unapplied:
            stale.append((k, sp, name, 'documented NOT-APPLIED, but its anchor now applies'))
    for k, sp, name, why in stale:
        print(f'STALE        known list line {k}: {sp}  {name}  ({why}; delete the line, the list only shrinks)')
    for sp, name, why in bad:
        print(f'CRASH        {sp}  {name}  ({why})')
    print(f'ANCHORS {len(rows)} checked, {len(na)} not-applied ({len(na) - undoc} documented)')
    if undoc or stale or bad:
        print(f'FAIL: anchors: {undoc} undocumented not-applied, {len(stale)} stale known entries, '
              f'{len(bad)} unreadable')
        return False
    return True

def survivors_gone(surv, rows, specs, every):
    """Survivors-list entries naming no spec (judged only when every spec is loaded) or no mutation in a loaded spec:
    [(line, spec, name, why)], each STALE. Whether a listed mutation still SURVIVES is judged by trip(), and only on
    the rows it runs."""
    scope = {os.path.basename(p) for p in specs}
    names = {(sp, m['name']) for sp, _, m in rows}
    gone = []
    for (sp, name), (k, _) in sorted(surv.items(), key=lambda kv: kv[1][0]):
        if sp not in scope:
            if every:
                gone.append((k, sp, name, 'no spec ' + sp + ' in tests/sabotage'))
        elif (sp, name) not in names:
            gone.append((k, sp, name, 'no mutation of that name in ' + sp))
    return gone

GATE_TIMES =os.path.join(HERE, 'gate_times.txt')   # post-V233 s11: its pool column marks a gate with workers of its own

def gate_pools(path=GATE_TIMES):
    """{gate basename: n} for every `<gate> <seconds> pool=<n>` line (post-V233 s11). No file means no such gate. A
    third column that is not pool=<positive integer>, or a fourth column, is a CONFIG error, as in gate.sh step 4."""
    if not os.path.isfile(path):
        return {}
    pools = {}
    for k, raw in enumerate(open(path, encoding='utf-8').read().split('\n'), 1):
        f = raw.split()
        if len(f) < 3 or f[0].startswith('#'):
            continue
        if len(f) != 3 or not re.fullmatch(r'pool=[1-9][0-9]*', f[2]):
            config_exit(f'{os.path.relpath(path, ROOT)} line {k}: a third column must be pool=<positive integer>, '
                        f'and nothing follows it; got: {raw.strip()}')
        pools[f[0]] = int(f[2][5:])
    return pools

def heavy_pool(m, pools):
    """The pool column of the mutation's gate, else None. A malformed row is light here and CRASHes in run_mutation
    exactly as before."""
    g = m.get('gate') if isinstance(m, dict) else None
    return pools.get(os.path.basename(g)) if isinstance(g, str) else None

def run_all(src, here, todo, td):
    """run_mutation over todo = [(i, mutation)]; the results in no fixed order (every caller sorts them by i). The light
    mutations run JOBS-wide; then each mutation whose gate has a pool column runs, one at a time in todo order, with
    GATE_POOL=JOBS (post-V233 s11): that gate's own workers must not multiply with JOBS mutations at once."""
    pools = gate_pools()
    light = [(i, m) for i, m in todo if heavy_pool(m, pools) is None]
    heavy = [(i, m) for i, m in todo if heavy_pool(m, pools) is not None]
    with concurrent.futures.ThreadPoolExecutor(max_workers=JOBS) as pool:
        done = [fu.result() for fu in [pool.submit(run_mutation, src, here, i, m, td) for i, m in light]]
    for i, m in heavy:
        done.append(run_mutation(src, here, i, m, td, pool=JOBS))
    return done

def trip(src, sel, known, surv, gone=()):
    """Trip-run sel = [(spec, index, mutation, reasons)] through run_mutation, JOBS-wide, reported in sel order.
    A documented NOT-APPLIED (known) and a documented SURVIVED (surv, post-V233 s8) are reported and do not fail;
    every other row must TRIP. A documented survivor that TRIPS or no longer applies is STALE and fails, and so is
    every entry in `gone` (survivors_gone): the list only shrinks."""
    with tempfile.TemporaryDirectory() as td:
        done = run_all(src, HERE, [(k, row[2]) for k, row in enumerate(sel)], td)   # pool-column gates last, serial
    res, stale = [], list(gone)
    for (_, name, status, detail), row in zip(sorted(done, key=lambda r: r[0]), sel):
        key = (row[0], name)
        doc = status == 'NOT-APPLIED' and key in known
        sdoc = status == 'SURVIVED' and key in surv
        tag = '  (documented)' if doc else '  (documented survivor)' if sdoc else ''
        if key in surv and status in ('TRIPPED', 'NOT-APPLIED'):
            stale.append((surv[key][0], row[0], name, 'documented SURVIVED, but it now '
                          + ('trips' if status == 'TRIPPED' else 'does not apply')))
            tag = '  (listed survivor: STALE)'
        res.append((row[0] + '  ' + name, status, detail + tag, doc, sdoc))
    width = max(len(r[0]) for r in res) if res else 10
    for label, status, detail, _, _ in res:
        print(f'{status:<12} {label:<{width}}  {detail}')
    for k, sp, name, why in sorted(stale):
        print(f'STALE        survivors list line {k}: {sp}  {name}  ({why}; delete the line, the list only shrinks)')
    counts = {k: sum(1 for r in res if r[1] == k) for k in ('TRIPPED', 'SURVIVED', 'NOT-APPLIED', 'CRASH')}
    doc = sum(1 for r in res if r[3])
    sv = sum(1 for r in res if r[4])
    print(f"\nSABOTAGE tripped={counts['TRIPPED']} survived={counts['SURVIVED']} not_applied={counts['NOT-APPLIED']} "
          f"crash={counts['CRASH']} of {len(res)} (documented not-applied {doc}, documented survivors {sv})")
    if res and counts['TRIPPED'] == len(res) and len(res) >= 3:
        print('WARNING: every mutation tripped. Confirm at least one mutation targets ONLY one gate and that the '
              'others stayed green (V185).')
    if stale:
        print(f'FAIL: {len(stale)} stale survivors list entries')
    return bool(res) and counts['TRIPPED'] + doc + sv == len(res) and not stale

def mode_anchors_only(args):
    opts, rest = take_flags(args)
    if not rest:
        usage_exit('--anchors-only needs a candidate')
    src = read_cand(rest[0])
    paths, every = spec_paths(rest[1:])
    known = load_known(os.path.abspath(opts.get('--known', KNOWN)))
    return 0 if anchors_check(src, paths, every, known) else 1

def mode_gates(args):
    opts, rest = take_flags(args, paths=TRIP_PATHS)
    if len(rest) < 2:
        usage_exit('--gates needs a comma list of gates and a candidate')
    want = []
    for g in rest[0].split(','):
        if g.strip() and gate_stem(g) not in want:
            want.append(gate_stem(g))
    if not want:
        usage_exit('--gates names no gate')
    src = read_cand(rest[1])
    paths, every = spec_paths(rest[2:])
    known = load_known(os.path.abspath(opts.get('--known', KNOWN)))
    surv = load_known(os.path.abspath(opts.get('--survivors', KNOWN_SURV)))
    rows, bad = load_rows(paths)
    sel = [(sp, i, m, []) for sp, i, m in rows if gate_stem(m['gate']) in want]
    missing = [g for g in want if not any(gate_stem(r[2]['gate']) == g for r in sel)]
    for sp, name, why in bad:
        print(f'CRASH        {sp}  {name}  ({why})')
    print(f'GATES {",".join(want)}: {len(sel)} of {len(rows)} mutations selected, {len(rows) - len(sel)} not run')
    for g in missing:
        print(f'FAIL: --gates {g}: no mutation in the selected specs names it')
    if not sel:
        print('FAIL: empty selection: nothing to trip-run')
        return 1
    ok = trip(src, sel, known, surv, survivors_gone(surv, rows, paths, every))
    return 0 if ok and not missing and not bad else 1

def git_out(*args):
    r = subprocess.run(['git', '-C', ROOT, '-c', 'core.quotepath=off'] + list(args), capture_output=True, text=True)
    if r.returncode != 0:
        config_exit('git ' + ' '.join(args) + ' failed: ' + r.stderr.strip())
    return r.stdout

def specs_added(ref):
    """Spec basenames added since ref: tracked adds against the working tree, plus untracked specs."""
    git_out('rev-parse', '--verify', '--quiet', ref + '^{commit}')
    d = os.path.relpath(SPEC_DIR, ROOT)
    paths = git_out('diff', '--name-only', '--no-renames', '--diff-filter=A', '-z', ref, '--', d).split('\0')
    paths += git_out('ls-files', '--others', '--exclude-standard', '-z', '--', d).split('\0')
    return sorted({os.path.basename(p) for p in paths if p.endswith('.json') and os.path.dirname(p) == d})

def files_edited(ref):
    """(edited, era_only) repo-relative paths from tests/era_bump.py --era-only-diff; its own summary line
    must agree with the lines parsed, so a format change cannot silently drop a gate."""
    r = subprocess.run([sys.executable, os.path.join(HERE, 'era_bump.py'), '--era-only-diff', ref],
                       capture_output=True, text=True)
    out = r.stdout or ''
    s = re.search(r'^era_bump --era-only-diff .*: (\d+) era-only, (\d+) edited$', out, re.M)
    edited = [x.group(1) for x in re.finditer(r'^edited {4}(.+?)  \(.*\)$', out, re.M)]
    era = [x.group(1) for x in re.finditer(r'^era-only {2}(.+?)  \(.*\)$', out, re.M)]
    if r.returncode != 0 or not s or int(s.group(1)) != len(era) or int(s.group(2)) != len(edited):
        config_exit(f'tests/era_bump.py --era-only-diff {ref} exited {r.returncode}; its summary line is missing '
                    f'or disagrees with the lines parsed:\n' + (out + (r.stderr or '')).strip()[-800:])
    return edited, era

def debt_gates():
    r = subprocess.run(['node', os.path.join(HERE, 'version_scope.js'), '--gates'], capture_output=True, text=True)
    if r.returncode != 0:
        config_exit(f'node tests/version_scope.js --gates exited {r.returncode}:\n'
                    + ((r.stdout or '') + (r.stderr or '')).strip()[-800:])
    return [ln.strip() for ln in r.stdout.splitlines() if ln.strip()]

def mode_proof_set(args):
    opts, rest = take_flags(args, bare=('--dry',), paths=TRIP_PATHS)
    if len(rest) != 2:
        usage_exit('--proof-set needs a git ref and a candidate')
    ref, cand = rest
    src = read_cand(cand)
    known = load_known(os.path.abspath(opts.get('--known', KNOWN)))
    surv = load_known(os.path.abspath(opts.get('--survivors', KNOWN_SURV)))
    paths, every = spec_paths([])
    print('== 1. anchor check: every mutation in every spec, no gate runs')
    a_ok = anchors_check(src, paths, every, known)
    added = specs_added(ref)
    edited, era = files_edited(ref)
    debt = debt_gates()
    rows, _ = load_rows(paths)   # an unreadable row has already failed the anchor check
    gates_dir = os.path.relpath(os.path.join(HERE, 'gates'), ROOT)
    debt_rel = {os.path.join(gates_dir, g) for g in debt}
    named = {gate_rel(m) for _, _, m in rows}
    eg = [p for p in edited if p in named or (os.path.dirname(p) == gates_dir and p.endswith('.js'))]
    sel = []
    for sp, i, m in rows:
        g = gate_rel(m)
        why = []
        if sp in added:
            why.append('spec-added')
        if g in eg:
            why.append('gate-edited ' + os.path.basename(g))
        if g in debt_rel:
            why.append('backstop ' + os.path.basename(g))
        if why:
            sel.append((sp, i, m, why))
    print(f'\n== 2. proof set since {ref}')
    print(f'specs added ({len(added)}): ' + (', '.join(added) or 'none'))
    print(f'gates edited ({len(eg)}; {len(era)} era-only file(s) do not count): '
          + (', '.join(os.path.basename(p) for p in eg) or 'none'))
    print(f'backstop gates ({len(debt)}, node tests/version_scope.js --gates): ' + (', '.join(debt) or 'none'))
    for p in eg:
        if p not in named:
            print('NOTE: edited gate ' + os.path.basename(p) + ': no mutation names it')
    for p in sorted(debt_rel):
        if p not in named:
            print('NOTE: backstop gate ' + os.path.basename(p) + ': no mutation names it')
    for sp, i, m, why in sel:
        print(f'IN  {sp}  [{"; ".join(why)}]  {m["name"]}')
    by = {r: sum(1 for row in sel if any(w.split()[0] == r for w in row[3]))
          for r in ('spec-added', 'gate-edited', 'backstop')}
    print(f"PROOF SET {len(sel)} mutations: spec-added {by['spec-added']}, gate-edited {by['gate-edited']}, "
          f"backstop {by['backstop']} (a mutation in for two reasons counts under each)")
    if not sel:
        print('FAIL: empty proof set: no spec added since ' + ref + ', no edited gate and no backstop gate is named')
        return 1
    if '--dry' in opts:
        print('DRY: no gate ran; the verdict is the anchor check: ' + ('PASS' if a_ok else 'FAIL'))
        return 0 if a_ok else 1
    print('\n== 3. trip-run the proof set')
    t_ok = trip(src, sel, known, surv, survivors_gone(surv, rows, paths, every))
    print('PROOF-SET anchors ' + ('ok' if a_ok else 'FAIL') + ', trip ' + ('ok' if t_ok else 'FAIL'))
    return 0 if a_ok and t_ok else 1

MODES = {'--anchors-only': mode_anchors_only, '--gates': mode_gates, '--proof-set': mode_proof_set}

def main():
    if len(sys.argv) > 1 and sys.argv[1] in MODES:
        sys.exit(MODES[sys.argv[1]](sys.argv[2:]))
    if len(sys.argv) > 1 and sys.argv[1].startswith('--'):
        usage_exit('unknown mode ' + sys.argv[1])
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
    # are to a per-mutation path from mutant_path(), which carries the index and a
    # digest of the full name so that two mutation names that sanitise, or clamp,
    # to the same string cannot race for one file. See mutant_path for why the
    # path is length-clamped and why the report is not.
    # A raising worker must never kill the whole report. Every exception below —
    # a bad spec row, an unwritable temp path, a failure to spawn node — becomes a
    # CRASH row for THIS mutation, so its slot still fills, the row still prints in
    # SPEC ORDER, the SABOTAGE summary line still prints with it counted in crash,
    # and the process still exits 1. `name` is seeded from the index BEFORE m is
    # read, so a row is always emitted even if m['name'] itself raises.
    # A mutation whose gate has a pool column in tests/gate_times.txt runs after the others, one at a time, with
    # GATE_POOL=JOBS (run_all; post-V233 s11). The print below is in spec order, so the report does not move.
    with tempfile.TemporaryDirectory() as td:
        done = run_all(src, here, list(enumerate(muts)), td)
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
