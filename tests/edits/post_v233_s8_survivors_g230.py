#!/usr/bin/env python3
# Post-V233 tooling pass, slice 8. Tests only: index.html is NOT touched, ia-version stays 233, no bump.
#   E1 (T-o) NEW tests/sabotage/known_survivors.txt: one line per documented SURVIVED mutation, same format and STALE
#            semantics as known_not_applied.txt. Every line is built from the spec row's own "name" field; the four
#            entries are the V233 sweep's four documented survivors (tests/measure/v233_rulings/gatekeeper_run1.md:
#            "survivors = documented (v205_d122_threerun_v204 S4; v219 S1-D167, S3-D171, S4-D167)"), causes from mS.
#   E2 (T-p) tests/sabotage.py: --gates and --proof-set read it (--survivors overrides, like --known). A documented
#            survivor that SURVIVES is reported and does not fail; one that TRIPS or no longer applies is STALE and
#            fails; a line naming no spec or no mutation is STALE; an undocumented survivor fails as today. main() and
#            run_mutation are untouched, so the plain `sabotage.py <cand> <spec>` output is byte-identical.
#   E3 (T-q) tests/gates/g230_d194_lens2.js: the lattice shards merge in CK7 order then shard index, never in JOBS
#            index order (which follows enum finish order and pool size), so the d194-eq / d193-i-r / d193-i-u "e.g."
#            samples are the same at any pool.
# Every anchor is asserted count==1 before anything is written; the first miss aborts the whole script.
import json, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
P = lambda *a: os.path.join(ROOT, *a)
SAB = P('tests', 'sabotage.py')
G230 = P('tests', 'gates', 'g230_d194_lens2.js')
SURV = P('tests', 'sabotage', 'known_survivors.txt')

def die(msg):
    print('ABORT: ' + msg)
    sys.exit(1)

def rep(src, old, new, label):
    n = src.count(old)
    if n != 1:
        die(f'{label}: anchor count={n}, want 1')
    return src.replace(old, new)

# ---- E1: the survivors list, built from the spec rows' own names ------------------------------------------------
def row_name(spec, prefix):
    muts = json.load(open(P('tests', 'sabotage', spec), encoding='utf-8'))
    hit = [m['name'] for m in muts if m['name'].startswith(prefix)]
    if len(hit) != 1:
        die(f'{spec}: {len(hit)} rows start with {prefix!r}, want 1')
    if '  # ' in hit[0] or hit[0] != hit[0].strip():
        die(f'{spec} {prefix}: the name cannot be split from its reason')
    return hit[0]

V219_WHY = ("gate went dead, index.html V220: g219_d167_pairs.js keys its pair rows PAIR = VER === ERA (ERA 219), so the "
            "219 to 220 version bump turned them off on an unedited gate; SURVIVED since V220 (8ee4385), found V221, "
            "carried since; V220 html re-stamped ia-version 219 trips it again ({}) (mS)")
ENTRIES = [
    ('v205_d122_threerun_v204.json', 'S4 -> ',
     "survivor by design: it moves the three-run quality crossover only the <=204 artifact reads; on V205 and later the "
     "pace lattice is four-run and the anchor changes no INT card, so it survives on V205 html and trips on V204 html "
     "(both proven); scoped to <=204 by its own name; carried since V205 (mS)"),
    ('v219.json', 'S1-D167 -> ', V219_WHY.format('FAIL 6')),
    ('v219.json', 'S3-D171 -> ', V219_WHY.format('FAIL 2')),
    ('v219.json', 'S4-D167 -> ', V219_WHY.format('FAIL 1')),
]
HEAD = '''# Documented SURVIVED sabotage mutations, read by tests/sabotage.py --gates and --proof-set (post-V233 s8).
# A mutation on this list that SURVIVES its gate is reported as a documented survivor and does not fail the run. A
# SURVIVED mutation NOT on this list fails the run by spec and name, as it always has.
# One line per mutation:  <spec>.json <mutation name>  # reason, build
# The name is the spec row's "name" field verbatim; a line splits at its first two-spaces-hash-space.
# THIS LIST ONLY SHRINKS. A listed mutation that TRIPS its gate again, or whose anchor no longer applies, or that no
# spec holds any more, fails the run as STALE until its line is deleted. A build that re-arms a dead gate (standing
# ruling 3: wire a dead pin, never re-point it) deletes that gate's lines the same build. A listed mutation the
# selection does not run is not judged.
# The plain `sabotage.py <cand> <spec>` call (the 7-day full sweep) never reads this list: there every survivor prints
# SURVIVED and the spec exits 1, so gatekeeper sees each one at every full sweep.
# Sources: tests/measure/v233_rulings/gatekeeper_run1.md (V233 sweep: survived=4, all documented) and
# tests/measure/v233_rulings/measure_sabotage_history_mS.md (the cause and first build of each).
'''
if os.path.exists(SURV):
    die('tests/sabotage/known_survivors.txt already exists')
surv_txt = HEAD + ''.join(f'{sp} {row_name(sp, pre)}  # {why}\n' for sp, pre, why in ENTRIES)

# ---- E2: sabotage.py ---------------------------------------------------------------------------------------------
sab = open(SAB, encoding='utf-8').read()
sab0 = sab
sab = rep(sab, '''    python3 tests/sabotage.py --gates g1,g2 <cand> [spec ...] [--known <list>]
        Trip-run only the mutations whose gate basename is listed (`.js` optional). A listed gate that no
        selected mutation names is a failure.
    python3 tests/sabotage.py --proof-set <git-ref> <cand> [--dry] [--known <list>]
''', '''    python3 tests/sabotage.py --gates g1,g2 <cand> [spec ...] [--known <list>] [--survivors <list>]
        Trip-run only the mutations whose gate basename is listed (`.js` optional). A listed gate that no
        selected mutation names is a failure.
    python3 tests/sabotage.py --proof-set <git-ref> <cand> [--dry] [--known <list>] [--survivors <list>]
''', 'docstring mode lines')
sab = rep(sab, '''In --gates and --proof-set a documented NOT-APPLIED is reported and does not fail the run; every other row
must TRIP. An empty selection is a failure. Exit 2 is a usage or configuration error in every mode.
"""''', '''In --gates and --proof-set a documented NOT-APPLIED is reported and does not fail the run, and so is a documented
SURVIVED: tests/sabotage/known_survivors.txt (post-V233 s8; the same line format, `--survivors <list>` overrides it,
--anchors-only never reads it). Every other row must TRIP: an undocumented survivor fails as it always has. A documented
survivor that TRIPS, or whose anchor no longer applies, fails as STALE, and so does a survivors line naming no spec or no
mutation (the list only shrinks). A listed survivor the selection does not run is not judged. An empty selection is a
failure. Exit 2 is a usage or configuration error in every mode.
"""''', 'docstring closing paragraph')
sab = rep(sab, '''KNOWN = os.path.join(SPEC_DIR, 'known_not_applied.txt')
REQUIRED = ('name', 'anchor', 'replacement', 'gate')
USAGE = ('usage: sabotage.py --anchors-only <cand> [spec ...] [--known <list>]\\n'
         '       sabotage.py --gates g1,g2 <cand> [spec ...] [--known <list>]\\n'
         '       sabotage.py --proof-set <git-ref> <cand> [--dry] [--known <list>]')
''', '''KNOWN = os.path.join(SPEC_DIR, 'known_not_applied.txt')
KNOWN_SURV = os.path.join(SPEC_DIR, 'known_survivors.txt')   # post-V233 s8: read by --gates and --proof-set only
TRIP_PATHS = ('--known', '--survivors')                       # the path options of the two modes that trip-run
REQUIRED = ('name', 'anchor', 'replacement', 'gate')
USAGE = ('usage: sabotage.py --anchors-only <cand> [spec ...] [--known <list>]\\n'
         '       sabotage.py --gates g1,g2 <cand> [spec ...] [--known <list>] [--survivors <list>]\\n'
         '       sabotage.py --proof-set <git-ref> <cand> [--dry] [--known <list>] [--survivors <list>]')
''', 'KNOWN and USAGE')
sab = rep(sab, '''def take_flags(args, bare=()):
    """Pull `--known PATH` and the bare flags out of args. Any other `--x` is a usage error, never ignored."""
    opts, rest, k = {}, [], 0
    while k < len(args):
        a = args[k]
        if a == '--known':
            if k + 1 >= len(args) or args[k + 1].startswith('--'):
                usage_exit('--known needs a path')
            if a in opts:
                usage_exit('--known given twice')
''', '''def take_flags(args, bare=(), paths=('--known',)):
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
''', 'take_flags')
sab = rep(sab, r'''def trip(src, sel, known):
    """Trip-run sel = [(spec, index, mutation, reasons)] through run_mutation, JOBS-wide, reported in sel order.
    A documented NOT-APPLIED is reported and does not fail; every other row must TRIP."""
    with tempfile.TemporaryDirectory() as td:
        with concurrent.futures.ThreadPoolExecutor(max_workers=JOBS) as pool:
            done = [fu.result() for fu in [pool.submit(run_mutation, src, HERE, k, row[2], td)
                                           for k, row in enumerate(sel)]]
    res = []
    for (_, name, status, detail), row in zip(sorted(done, key=lambda r: r[0]), sel):
        doc = status == 'NOT-APPLIED' and (row[0], name) in known
        res.append((row[0] + '  ' + name, status, detail + ('  (documented)' if doc else ''), doc))
    width = max(len(r[0]) for r in res) if res else 10
    for label, status, detail, _ in res:
        print(f'{status:<12} {label:<{width}}  {detail}')
    counts = {k: sum(1 for r in res if r[1] == k) for k in ('TRIPPED', 'SURVIVED', 'NOT-APPLIED', 'CRASH')}
    doc = sum(1 for r in res if r[3])
    print(f"\nSABOTAGE tripped={counts['TRIPPED']} survived={counts['SURVIVED']} not_applied={counts['NOT-APPLIED']} "
          f"crash={counts['CRASH']} of {len(res)} (documented not-applied {doc})")
    if res and counts['TRIPPED'] == len(res) and len(res) >= 3:
        print('WARNING: every mutation tripped. Confirm at least one mutation targets ONLY one gate and that the '
              'others stayed green (V185).')
    return bool(res) and counts['TRIPPED'] + doc == len(res)
''', r'''def survivors_gone(surv, rows, specs, every):
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

def trip(src, sel, known, surv, gone=()):
    """Trip-run sel = [(spec, index, mutation, reasons)] through run_mutation, JOBS-wide, reported in sel order.
    A documented NOT-APPLIED (known) and a documented SURVIVED (surv, post-V233 s8) are reported and do not fail;
    every other row must TRIP. A documented survivor that TRIPS or no longer applies is STALE and fails, and so is
    every entry in `gone` (survivors_gone): the list only shrinks."""
    with tempfile.TemporaryDirectory() as td:
        with concurrent.futures.ThreadPoolExecutor(max_workers=JOBS) as pool:
            done = [fu.result() for fu in [pool.submit(run_mutation, src, HERE, k, row[2], td)
                                           for k, row in enumerate(sel)]]
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
''', 'trip')
sab = rep(sab, '''def mode_gates(args):
    opts, rest = take_flags(args)
''', '''def mode_gates(args):
    opts, rest = take_flags(args, paths=TRIP_PATHS)
''', 'mode_gates flags')
sab = rep(sab, '''    paths, _ = spec_paths(rest[2:])
    known = load_known(os.path.abspath(opts.get('--known', KNOWN)))
    rows, bad = load_rows(paths)
''', '''    paths, every = spec_paths(rest[2:])
    known = load_known(os.path.abspath(opts.get('--known', KNOWN)))
    surv = load_known(os.path.abspath(opts.get('--survivors', KNOWN_SURV)))
    rows, bad = load_rows(paths)
''', 'mode_gates lists')
sab = rep(sab, '''    ok = trip(src, sel, known)
''', '''    ok = trip(src, sel, known, surv, survivors_gone(surv, rows, paths, every))
''', 'mode_gates trip')
sab = rep(sab, '''    opts, rest = take_flags(args, bare=('--dry',))
''', '''    opts, rest = take_flags(args, bare=('--dry',), paths=TRIP_PATHS)
''', 'mode_proof_set flags')
sab = rep(sab, '''    known = load_known(os.path.abspath(opts.get('--known', KNOWN)))
    paths, every = spec_paths([])
''', '''    known = load_known(os.path.abspath(opts.get('--known', KNOWN)))
    surv = load_known(os.path.abspath(opts.get('--survivors', KNOWN_SURV)))
    paths, every = spec_paths([])
''', 'mode_proof_set lists')
sab = rep(sab, '''    t_ok = trip(src, sel, known)
''', '''    t_ok = trip(src, sel, known, surv, survivors_gone(surv, rows, paths, every))
''', 'mode_proof_set trip')
# the plain call must not move: main() and run_mutation byte-identical
def body(s, fn):   # from `fn` to the next top-level def or the modes banner, whichever comes first (else EOF)
    a = s.index(fn)
    ends = [e for e in (s.find('\ndef ', a + 1), s.find('\n# ---- modes', a + 1)) if e > 0]
    return s[a:min(ends) if ends else None]
for fn in ('def jobs_from_env(', 'def mutant_path(', 'def run_gate(', 'def run_mutation(', 'def main():'):
    if sab0.count(fn) != 1 or sab.count(fn) != 1 or body(sab0, fn) != body(sab, fn):
        die(fn + ' changed: the plain call must stay byte-identical')

# ---- E3: g230 deterministic lattice merge order ------------------------------------------------------------------
g = open(G230, encoding='utf-8').read()
g = rep(g, '''  const AJ = JOBS.map((j, i) => j.kind === 'lat' ? res[i] : undefined).filter(x => x !== undefined);
''', '''  // The lattice shards merge in a FIXED order, CK7 order then shard index (post-V233 s8). runPool splices a config's lat
  // shards in at its cursor when that config's enum job lands, so their JOBS index follows enum finish order and the
  // pool size; merged in that order, addInto's first-example-wins kept a different "e.g." chain at pool 8 than at
  // pool 3. Every lattice merge below (LA, LPC, and the e.g. samples of d193-i-r, d193-i-u and d194-eq) reads AJ in
  // this order, so the gate's output is the same at any pool apart from the clock line. The counts are sums and
  // never depended on it.
  const AJ = JOBS.map((j, i) => j.kind === 'lat' ? { ck:j.ck, shard:j.shard, r:res[i] } : undefined).filter(x => x !== undefined)
    .sort((a, b) => CK7.indexOf(a.ck) - CK7.indexOf(b.ck) || a.shard - b.shard).map(x => x.r);
''', 'g230 AJ')

# ---- write (only after every anchor held) -------------------------------------------------------------------------
open(SURV, 'w', encoding='utf-8').write(surv_txt)
open(SAB, 'w', encoding='utf-8').write(sab)
open(G230, 'w', encoding='utf-8').write(g)
print('wrote tests/sabotage/known_survivors.txt (%d entries), tests/sabotage.py, tests/gates/g230_d194_lens2.js' % len(ENTRIES))
