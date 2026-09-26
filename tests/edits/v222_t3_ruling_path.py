#!/usr/bin/env python3
# V222 (D181, P-SWAPDURABLE) post-proof rename slice t3: comment-only.
# The shipped ruling moved from tests/measure/v212_rulings/ to
# tests/measure/v222_rulings/ (shipped rulings take the shipping version's
# prefix). The two new V222 gates cite the old path in their line 7 header
# comment. This rewrites that one path string in each file and nothing else.
# index.html is not touched.
import os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OLD = "tests/measure/v212_rulings/p_swapdurable_ruling.md"
NEW = "tests/measure/v222_rulings/p_swapdurable_ruling.md"
FILES = ["tests/gates/g222_d181_durable.js", "tests/gates/g222_d181_chain.js"]


def die(msg):
    sys.stderr.write("ABORT: " + msg + "\n")
    sys.exit(1)


if not os.path.isfile(os.path.join(ROOT, NEW)):
    die("new ruling path does not exist on disk: " + NEW)

# Phase 1: assert every anchor before writing anything.
plans = []
for rel in FILES:
    path = os.path.join(ROOT, rel)
    with open(path, "rb") as fh:
        src = fh.read().decode("utf-8")
    n = src.count(OLD)
    if n != 1:
        die("%s: expected 1 occurrence of old path, found %d" % (rel, n))
    lines = src.split("\n")
    hits = [i for i, ln in enumerate(lines) if OLD in ln]
    if len(hits) != 1:
        die("%s: old path spans %d lines" % (rel, len(hits)))
    if not lines[hits[0]].lstrip().startswith("//"):
        die("%s: line %d holding the old path is not a // comment" % (rel, hits[0] + 1))
    out = src.replace(OLD, NEW, 1)
    # Nothing else changed: same line count, exactly one differing line,
    # and that line differs only by the path swap.
    a, b = src.split("\n"), out.split("\n")
    if len(a) != len(b):
        die("%s: line count changed" % rel)
    diff = [i for i in range(len(a)) if a[i] != b[i]]
    if diff != [hits[0]]:
        die("%s: unexpected changed lines %r" % (rel, [d + 1 for d in diff]))
    if a[hits[0]].replace(OLD, NEW) != b[hits[0]]:
        die("%s: changed line is not a pure path swap" % rel)
    if "v212_" in out:
        die("%s: %d v212_ remain after edit" % (rel, out.count("v212_")))
    if out.count(NEW) != src.count(NEW) + 1:
        die("%s: new path count not incremented by exactly 1" % rel)
    plans.append((rel, path, out, hits[0] + 1))

# Phase 2: write.
for rel, path, out, lineno in plans:
    with open(path, "wb") as fh:
        fh.write(out.encode("utf-8"))
    print("%s: line %d rewritten (comment only)" % (rel, lineno))

# Phase 3: re-read and re-assert on disk.
for rel, path, out, lineno in plans:
    with open(path, "rb") as fh:
        got = fh.read().decode("utf-8")
    if got != out:
        die("%s: on-disk content does not match planned output" % rel)
    if got.count("v212_") != 0:
        die("%s: v212_ present on disk after write" % rel)
    print("%s: v212_ count 0, new path count %d" % (rel, got.count(NEW)))
print("OK")
