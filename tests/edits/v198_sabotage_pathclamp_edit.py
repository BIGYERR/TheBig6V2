#!/usr/bin/env python3
# V198 tooling pre-work — TOOLING ONLY. Does NOT touch index.html and does NOT
# bump ia-version. Ruling: handoff §12, three entries (V194, V197, V197 again):
# tests/sabotage.py builds the mutant temp filename out of the mutation NAME and
# dies with OSError 63 ENAMETOOLONG before the mutation ever runs. Worked around
# three times by shortening names. Clamp it in the runner.
#
# Four replacements, every anchor asserted count==1, abort on the first miss:
#   1. import line          -> add hashlib (needed by the disambiguating digest)
#   2. new mutant_path()    -> inserted above run_gate(), with provenance comment
#   3. the stale inline comment about "carries the index" -> points at the clamp
#   4. the path= line       -> calls mutant_path(td, i, name)
import io, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TARGET = os.path.join(ROOT, 'sabotage.py')

src = io.open(TARGET, encoding='utf-8').read()
orig = src

REPL = []

# --- 1. imports ---------------------------------------------------------------
REPL.append((
    "import concurrent.futures, json, os, re, subprocess, sys, tempfile",
    "import concurrent.futures, hashlib, json, os, re, subprocess, sys, tempfile",
))

# --- 2. the clamp itself ------------------------------------------------------
CLAMP = '''# Filesystem limits the mutant path has to live inside. NAME_MAX is per path
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

'''
REPL.append((
    "def run_gate(gate, html):",
    CLAMP + "def run_gate(gate, html):",
))

# --- 3. the stale comment above run_one --------------------------------------
REPL.append((
    """    # `src` is read-only here; str.count and str.replace are pure. The only writes
    # are to a per-mutation path, which carries the index so that two mutation names
    # that sanitise to the same string cannot race for one file.""",
    """    # `src` is read-only here; str.count and str.replace are pure. The only writes
    # are to a per-mutation path from mutant_path(), which carries the index and a
    # digest of the full name so that two mutation names that sanitise, or clamp,
    # to the same string cannot race for one file. See mutant_path for why the
    # path is length-clamped and why the report is not.""",
))

# --- 4. the path construction ------------------------------------------------
REPL.append((
    """            path = os.path.join(td, f'sab_{i:04d}_{re.sub(r"[^A-Za-z0-9]+","_",name)}.html')""",
    """            path = mutant_path(td, i, name)   # clamped: a long name must never kill a sweep (V194/V197/V197)""",
))

for anchor, new in REPL:
    n = src.count(anchor)
    if n != 1:
        sys.stderr.write('ABORT: anchor count=%d (want 1) for:\n%s\n' % (n, anchor[:160]))
        sys.exit(1)
    src = src.replace(anchor, new)

if src == orig:
    sys.stderr.write('ABORT: no change\n')
    sys.exit(1)

io.open(TARGET, 'w', encoding='utf-8').write(src)
print('WROTE %s  (%d -> %d bytes, %d replacements)' % (TARGET, len(orig), len(src), len(REPL)))
