#!/usr/bin/env python3
"""Post-V239 top-level cleanup, slice 2 of 3 (tests-only tooling pass, no ia-version bump; stays 239).

Rulings (tests/measure/post_v239_cleanup/decisions.md):
  C4  INSTALL.md is deleted; README.md's tests row drops its INSTALL.md reference.
  C5  baselines/README.md "Rule going forward." paragraph is rewritten: git tags are the record from
      V190 on; the folder keeps V188, V189 (wrong tags) and V196 (g197d_d84_base.js reads it).
  plus the .gitignore comment above node_modules/ left uncommented by slice 1.

Edits here (all anchors asserted count==1 before any write; abort with no writes on the first miss):
  E2  README.md tests row: "run locally (`INSTALL.md`, `CLAUDE.md`)" -> "run locally (`CLAUDE.md`)"
  E3  baselines/README.md: replace ONLY the "**Rule going forward.**" paragraph
  E4  .gitignore: insert "# dependencies, caches and OS junk" directly above node_modules/
Edit 1 (git rm INSTALL.md) is run by hand after this script succeeds.
index.html is not touched. No version meta bump (none ruled).
"""
import os
import sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))


def die(msg):
    sys.stderr.write("ABORT (no files written): " + msg + "\n")
    sys.exit(1)


# ---------- E3 new paragraph: ruling text, hard-wrapped near 100 columns, no code span broken ----------
RULING_C5 = (
    "**The rule now.** Git tags are the record of every release from V190 on. Checked 2026-10-11: "
    "each tag from V190 through V239 checks out an `index.html` that reads its own `ia-version`, so "
    "`git show V<N>:index.html` gives the previous build for any blast-radius run. Only V188 and V189 "
    "are wrong (both tags check out V190), so their files here are the only true copies. This folder "
    "no longer grows with each release. It keeps three files: V188 and V189 for that reason, and V196 "
    "because `tests/gates/g197d_d84_base.js` reads it as its fixed pre-D84 artifact. Add a file here "
    "only when a gate needs a pinned artifact on disk. If a tag and a file ever disagree, the file "
    "wins: grep the artifact, never trust a label."
)
NEW_PARA_LINES = [
    "**The rule now.** Git tags are the record of every release from V190 on. Checked 2026-10-11: each",
    "tag from V190 through V239 checks out an `index.html` that reads its own `ia-version`, so",
    "`git show V<N>:index.html` gives the previous build for any blast-radius run. Only V188 and V189 are",
    "wrong (both tags check out V190), so their files here are the only true copies. This folder no",
    "longer grows with each release. It keeps three files: V188 and V189 for that reason, and V196",
    "because `tests/gates/g197d_d84_base.js` reads it as its fixed pre-D84 artifact. Add a file here only",
    "when a gate needs a pinned artifact on disk. If a tag and a file ever disagree, the file wins: grep",
    "the artifact, never trust a label.",
]
if " ".join(NEW_PARA_LINES) != RULING_C5:
    die("E3 wrapped lines do not join to the ruling text")
for ln in NEW_PARA_LINES:
    if len(ln) > 100:
        die("E3 wrapped line over 100 columns: %r" % ln)
    if ln.count("`") % 2:
        die("E3 wrapped line breaks a code span: %r" % ln)

OLD_PARA = (
    "**Rule going forward.** Every release drops its artifact here as `V<N>.html` in the same commit that\n"
    "ships it, and the commit gets tagged `V<N>`. The tag and the file are two records of one thing; if\n"
    "they ever disagree, the file wins — grep the artifact, never trust a label.\n"
)
NEW_PARA = "\n".join(NEW_PARA_LINES) + "\n"

# ---------- edit table: (relative path, old, new, label) ----------
EDITS = [
    ("README.md",
     "run locally (`INSTALL.md`, `CLAUDE.md`)",
     "run locally (`CLAUDE.md`)",
     "E2 README tests row"),
    ("baselines/README.md",
     OLD_PARA,
     NEW_PARA,
     "E3 baselines README rule paragraph"),
    (".gitignore",
     "doctrine/*.txt\nnode_modules/\n",
     "doctrine/*.txt\n# dependencies, caches and OS junk\nnode_modules/\n",
     "E4 .gitignore dependencies comment"),
]

# ---------- phase 1: read and assert every anchor; no writes ----------
texts = {}
for rel, old, new, label in EDITS:
    p = os.path.join(ROOT, rel)
    if rel not in texts:
        if not os.path.isfile(p):
            die("%s: missing file %s" % (label, rel))
        with open(p, "r", encoding="utf-8", newline="") as f:
            texts[rel] = f.read()
    n = texts[rel].count(old)
    print("anchor %-40s %-22s count=%d" % (label, rel, n))
    if n != 1:
        die("%s: anchor count %d != 1 in %s" % (label, n, rel))
    if texts[rel].count(new) != 0 and new not in old:
        die("%s: replacement text already present in %s" % (label, rel))

# E4 extra guard: the comment line must not already exist anywhere in .gitignore
if texts[".gitignore"].count("# dependencies, caches and OS junk") != 0:
    die("E4: comment already present in .gitignore")

# ---------- phase 2: apply in memory, then write ----------
out = dict(texts)
for rel, old, new, label in EDITS:
    out[rel] = out[rel].replace(old, new, 1)

for rel in out:
    if out[rel] == texts[rel]:
        die("%s unchanged after replacement (empty diff)" % rel)

for rel, body in out.items():
    with open(os.path.join(ROOT, rel), "w", encoding="utf-8", newline="") as f:
        f.write(body)
    print("wrote", rel)
print("OK: 3 edits applied; now run: git rm INSTALL.md")
