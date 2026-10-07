#!/usr/bin/env python3
# Post-V233 tooling pass, slice 6: tests/sabotage.py modes and the documented NOT-APPLIED list.
# Tests-only. index.html is NOT touched; ia-version stays 233; no bump.
# Ruling: Mario, tests/measure/v233_rulings/post_v233_proof_scope_decisions.md, as written in CLAUDE.md Proof scope:
#   "Sabotage. Every build: anchor-check every mutation in every spec (no gate runs), then trip-run the build's own
#    spec, every mutation naming a gate the build edited, and every mutation naming a gate that still has a row
#    scoped to one exact ia-version. ..."
# Evidence: measure mS (all 62 NOT-APPLIED events were index.html anchor drift), gatekeeper_run1.md (V233 sweep:
# 7 documented NOT-APPLIED).
# Edits (every anchor asserted count==1; the script aborts on the first miss and writes nothing):
#   E1 (T-j) sabotage.py docstring: document the three modes.
#   E2 (T-j) sabotage.py: main()'s nested run_one body moves verbatim to module-level run_mutation(src, here, ...);
#            main() keeps run_one as a one-line delegate, so the plain call trips through the same code as the modes.
#   E3 (T-j) sabotage.py: --anchors-only / --gates / --proof-set, dispatched at the top of main(). The plain
#            `sabotage.py <cand> <spec>` path is otherwise untouched.
#   E4 (T-k) NEW tests/sabotage/known_not_applied.txt, every line built from the spec row's own name and verified
#            to count 0 in today's index.html before it is written.
import json, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SAB = os.path.join(ROOT, 'tests', 'sabotage.py')
KNOWN = os.path.join(ROOT, 'tests', 'sabotage', 'known_not_applied.txt')
CAND = os.path.join(ROOT, 'index.html')

def die(msg):
    print('ABORT: ' + msg)
    sys.exit(1)

def one(text, anchor, what):
    n = text.count(anchor)
    if n != 1:
        die(f'{what}: anchor count={n}, want 1')

src = open(SAB, encoding='utf-8').read()
orig = src

# ---- E1: docstring -------------------------------------------------------------------------------------------------
E1_OLD = 'Exit code: 0 only when every mutation TRIPPED and none was NOT-APPLIED or CRASHED.\n"""\n'
E1_NEW = r'''Exit code: 0 only when every mutation TRIPPED and none was NOT-APPLIED or CRASHED.

Modes (post-V233 Proof scope; CLAUDE.md Proof scope, Sabotage). The plain call above is unchanged and is what
the 7-day full sweep runs, spec by spec.

    python3 tests/sabotage.py --anchors-only <cand> [spec ...] [--known <list>]
        Count every mutation's anchor in <cand> (default: every tests/sabotage/*.json) and run NO gate. Prints
        each NOT-APPLIED with its spec and name, then `ANCHORS n checked, k not-applied (d documented)`. Exit 1
        on an undocumented NOT-APPLIED, on a documented one whose anchor applies again (STALE: the list only
        shrinks), and on a spec row that cannot be read. The documented list is
        tests/sabotage/known_not_applied.txt (`<spec>.json <mutation name>  # reason, build`); it is a .txt and
        is never read as a spec.
    python3 tests/sabotage.py --gates g1,g2 <cand> [spec ...] [--known <list>]
        Trip-run only the mutations whose gate basename is listed (`.js` optional). A listed gate that no
        selected mutation names is a failure.
    python3 tests/sabotage.py --proof-set <git-ref> <cand> [--dry] [--known <list>]
        1. the anchor check above, over every spec. 2. the proof set: every mutation in a spec added since
        <ref>, every mutation naming a gate edited since <ref> (`tests/era_bump.py --era-only-diff <ref>`;
        era-only files do not count), every mutation naming a gate `node tests/version_scope.js --gates` lists
        (the backstop); each is printed with its reasons, then the set size by reason. 3. trip-run the set.
        --dry stops after 2. The verdict is the anchor check AND the trip run (with --dry, the anchor check).
In --gates and --proof-set a documented NOT-APPLIED is reported and does not fail the run; every other row
must TRIP. An empty selection is a failure. Exit 2 is a usage or configuration error in every mode.
"""
'''
one(src, E1_OLD, 'E1 docstring tail')
src = src.replace(E1_OLD, E1_NEW)

# ---- E2: run_one body -> module-level run_mutation ---------------------------------------------------------------
E2_START = "    def run_one(i, m, td):\n        name = f'mutation #{i}'\n"
E2_END = "            return (i, name, 'CRASH', 'exception: ' + ' '.join(f'{type(e).__name__}: {e}'.split()))\n"
one(src, E2_START, 'E2 run_one start')
one(src, E2_END, 'E2 run_one end')
s = src.index(E2_START); e = src.index(E2_END) + len(E2_END)
if not s < e:
    die('E2 run_one end precedes its start')
block = src[s:e]
lines = block.split('\n')
if lines[-1] != '':
    die('E2 block does not end on a newline')
for ln in lines[:-1]:
    if ln and not ln.startswith('    '):
        die('E2 block line not indented by 4: ' + ln)
moved = '\n'.join(ln[4:] for ln in lines)
HEAD_OLD = "def run_one(i, m, td):\n"
if not moved.startswith(HEAD_OLD) or moved.count(HEAD_OLD) != 1:
    die('E2 moved block does not open with run_one')
RUN_MUTATION = ('def run_mutation(src, here, i, m, td):\n'
                '    """One mutation against one candidate: (i, name, status, detail). Moved verbatim out of\n'
                '    main() at post-V233 s6 so the plain call and the --gates / --proof-set modes trip-run\n'
                '    through the SAME code; `src` and `here` were main()\'s closure and are now parameters."""\n'
                + moved[len(HEAD_OLD):])
DELEGATE = "    def run_one(i, m, td):\n        return run_mutation(src, here, i, m, td)\n"
src = src[:s] + DELEGATE + src[e:]

# ---- E3: modes + dispatch ------------------------------------------------------------------------------------------
E3_OLD = "def main():\n    if len(sys.argv) < 3:\n        print(__doc__); sys.exit(2)\n"
MODES = r'''# ---- modes: --anchors-only, --gates, --proof-set -------------------------------------------------------------
# Post-V233 Proof scope (Mario; tests/measure/v233_rulings/post_v233_proof_scope_decisions.md; CLAUDE.md Proof
# scope, Sabotage): every build anchor-checks every mutation in every spec with no gate run, then trip-runs its
# proof set. The plain `sabotage.py <cand> <spec>` call in main() is unchanged; the 7-day full sweep runs it.
import glob

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SPEC_DIR = os.path.join(HERE, 'sabotage')
KNOWN = os.path.join(SPEC_DIR, 'known_not_applied.txt')
REQUIRED = ('name', 'anchor', 'replacement', 'gate')
USAGE = ('usage: sabotage.py --anchors-only <cand> [spec ...] [--known <list>]\n'
         '       sabotage.py --gates g1,g2 <cand> [spec ...] [--known <list>]\n'
         '       sabotage.py --proof-set <git-ref> <cand> [--dry] [--known <list>]')

def usage_exit(msg):
    print('FAIL: USAGE: ' + msg)
    print(USAGE)
    sys.exit(2)

def config_exit(msg):
    print('FAIL: CONFIG: ' + msg)
    sys.exit(2)

def one_line(e):
    return ' '.join(f'{type(e).__name__}: {e}'.split())

def take_flags(args, bare=()):
    """Pull `--known PATH` and the bare flags out of args. Any other `--x` is a usage error, never ignored."""
    opts, rest, k = {}, [], 0
    while k < len(args):
        a = args[k]
        if a == '--known':
            if k + 1 >= len(args) or args[k + 1].startswith('--'):
                usage_exit('--known needs a path')
            if a in opts:
                usage_exit('--known given twice')
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

def trip(src, sel, known):
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

def mode_anchors_only(args):
    opts, rest = take_flags(args)
    if not rest:
        usage_exit('--anchors-only needs a candidate')
    src = read_cand(rest[0])
    paths, every = spec_paths(rest[1:])
    known = load_known(os.path.abspath(opts.get('--known', KNOWN)))
    return 0 if anchors_check(src, paths, every, known) else 1

def mode_gates(args):
    opts, rest = take_flags(args)
    if len(rest) < 2:
        usage_exit('--gates needs a comma list of gates and a candidate')
    want = []
    for g in rest[0].split(','):
        if g.strip() and gate_stem(g) not in want:
            want.append(gate_stem(g))
    if not want:
        usage_exit('--gates names no gate')
    src = read_cand(rest[1])
    paths, _ = spec_paths(rest[2:])
    known = load_known(os.path.abspath(opts.get('--known', KNOWN)))
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
    ok = trip(src, sel, known)
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
    opts, rest = take_flags(args, bare=('--dry',))
    if len(rest) != 2:
        usage_exit('--proof-set needs a git ref and a candidate')
    ref, cand = rest
    src = read_cand(cand)
    known = load_known(os.path.abspath(opts.get('--known', KNOWN)))
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
    t_ok = trip(src, sel, known)
    print('PROOF-SET anchors ' + ('ok' if a_ok else 'FAIL') + ', trip ' + ('ok' if t_ok else 'FAIL'))
    return 0 if a_ok and t_ok else 1

MODES = {'--anchors-only': mode_anchors_only, '--gates': mode_gates, '--proof-set': mode_proof_set}

'''
E3_NEW = (RUN_MUTATION + '\n' + MODES +
          "def main():\n"
          "    if len(sys.argv) > 1 and sys.argv[1] in MODES:\n"
          "        sys.exit(MODES[sys.argv[1]](sys.argv[2:]))\n"
          "    if len(sys.argv) > 1 and sys.argv[1].startswith('--'):\n"
          "        usage_exit('unknown mode ' + sys.argv[1])\n"
          "    if len(sys.argv) < 3:\n        print(__doc__); sys.exit(2)\n")
one(src, E3_OLD, 'E3 main head')
src = src.replace(E3_OLD, E3_NEW)

# ---- E4: the documented NOT-APPLIED list ---------------------------------------------------------------------------
# (spec, name prefix, reason). The name written is the spec row's own name, matched by exactly one prefix hit, and
# its anchor must count 0 in today's index.html (verified, not copied from the record).
ENTRIES = [
    ('example.json', 'no-op mutation', 'deliberate no-op, the runner reports NOT-APPLIED and never SURVIVED; NOT-APPLIED at every tag (mS 44/44)'),
    ('v193_samecard.json', 'M13 -> ', 'anchor drift, index.html V219; unseen V219 to V220, found V221, carried since (mS)'),
    ('v195.json', 'M12 (gk P2) -> ', 'anchor drift, index.html V220; found V221, carried since (mS)'),
    ('v197.json', 'M4 -> ', 'anchor drift, index.html V219; unseen V219 to V220, found V221, carried since (mS)'),
    ('v200.json', 'M4 -> ', 'anchor drift, index.html V219; unseen V219 to V220, found V221, carried since (mS)'),
    ('v200.json', 'M5 -> ', 'anchor drift, index.html V219; unseen V219 to V220, found V221, carried since (mS)'),
    ('v201.json', 'M4 -> ', 'era-scoped by design: the candidate declares ia-version 202, a stand-in for the ruled harness row deletion; NOT-APPLIED since V202 (mS)'),
]
if os.path.exists(KNOWN):
    die('E4: ' + KNOWN + ' already exists')
html = open(CAND, encoding='utf-8').read()
out = [
    '# Documented NOT-APPLIED sabotage mutations, read by tests/sabotage.py --anchors-only, --gates and --proof-set.',
    '# Post-V233 Proof scope (Mario; CLAUDE.md Proof scope, Sabotage): every build anchor-checks every mutation in',
    '# every spec with no gate run. A NOT-APPLIED mutation not on this list fails the check by spec and name.',
    '# One line per mutation:  <spec>.json <mutation name>  # reason, build',
    '# The name is the spec row\'s "name" field verbatim; a line splits at its first two-spaces-hash-space.',
    '# THIS LIST ONLY SHRINKS. A listed mutation whose anchor applies again, or that no spec holds any more, fails',
    '# the check as STALE until its line is deleted. A mutation re-anchored by a build leaves the list that build.',
    '# Sources: tests/measure/v233_rulings/gatekeeper_run1.md (V233 sweep: 7 NOT-APPLIED, all documented) and',
    '# tests/measure/v233_rulings/measure_sabotage_history_mS.md (cause and first build of each). Each anchor',
    '# verified to count 0 in index.html at ia-version 233 when this list was written (post-V233 s6).',
]
for spec, prefix, why in ENTRIES:
    muts = json.load(open(os.path.join(ROOT, 'tests', 'sabotage', spec), encoding='utf-8'))
    hits = [m for m in muts if m['name'].startswith(prefix)]
    if len(hits) != 1:
        die(f'E4: {spec} {prefix!r}: {len(hits)} mutations, want 1')
    m = hits[0]
    if '  # ' in m['name'] or m['name'] != m['name'].strip() or '\n' in m['name']:
        die(f'E4: {spec} {prefix!r}: name cannot be written on one known-list line')
    n = html.count(m['anchor'])
    if n != 0:
        die(f'E4: {spec} {prefix!r}: anchor counts {n} in index.html today, want 0 (not NOT-APPLIED)')
    out.append(f'{spec} {m["name"]}  # {why}')

if src == orig:
    die('sabotage.py unchanged')
open(SAB, 'w', encoding='utf-8').write(src)
open(KNOWN, 'w', encoding='utf-8').write('\n'.join(out) + '\n')
print('wrote tests/sabotage.py (E1 E2 E3) and tests/sabotage/known_not_applied.txt (E4, %d entries)' % len(ENTRIES))
