#!/usr/bin/env python3
# V226 slice 7a4: two per-version reference rows. Tests only; index.html is not touched.
# Ruling: tests/measure/v226_rulings/d188_d189_ruling.md (D188 P-BEGINNERMILE, D189 P-PACEDISCLOSE, accepted by
# Mario 2026-09-30). Same routine-upkeep form as slice 7a3 (tests/edits/v226_edit_7a3.py).
# Two edits (one per file):
#   1. g200_pull_arbitration.js  SWAP_BY_VERSION[226] = [225]   (reference row)
#   2. g219_samecard_draws.js    ERA[226] = [225]               (reference row)
# Both are routine per-version table upkeep (session decision, V226 build 5): every value each table compares was
# printed equal to [225] on the V226 working tree by builder, with this script run against a scratch copy, before
# the rows were written. They are references, never copies of numbers.
# Every anchor asserts count==1; both files are written together, only after every assertion passed.
# Usage: python3 v226_edit_7a4.py [ROOT]   (ROOT defaults to the repo; a scratch tree is used for the pre-check)
import sys

ROOT = (sys.argv[1] if len(sys.argv) > 1 else "/Users/CanasBangin/Desktop/TheBig6V2").rstrip("/") + "/"
FILES = {
    "g200": ROOT + "tests/gates/g200_pull_arbitration.js",
    "g219": ROOT + "tests/gates/g219_samecard_draws.js",
}
SRC = {k: open(p, encoding="utf-8").read() for k, p in FILES.items()}


def rep(key, old, new, label):
    n = SRC[key].count(old)
    if n != 1:
        sys.stderr.write("ABORT %s: anchor count %d (want 1); nothing written\n" % (label, n))
        sys.exit(1)
    SRC[key] = SRC[key].replace(old, new, 1)


def after_line(key, prefix, newline, label):
    lines = [l for l in SRC[key].split("\n") if l.startswith(prefix)]
    if len(lines) != 1:
        sys.stderr.write("ABORT %s: line-prefix count %d (want 1); nothing written\n" % (label, len(lines)))
        sys.exit(1)
    rep(key, lines[0] + "\n", lines[0] + "\n" + newline + "\n", label)


UPKEEP = ("routine per-version table upkeep, session decision for V226 build 5: D188 reads a beginner's mile and "
          "D189 discloses a default anchor, and no value this table compares moved; printed equal to [225] on the "
          "V226 working tree (slices 1 to 6 landed) by builder with this gate before this row")

# ── 1. g200_pull_arbitration.js ──────────────────────────────────────────────────────────────────
after_line("g200", "SWAP_BY_VERSION[225] = SWAP_BY_VERSION[224];",
    "SWAP_BY_VERSION[226] = SWAP_BY_VERSION[225];   // V226 (D188 P-BEGINNERMILE, D189 P-PACEDISCLOSE): "
    "UNMOVED, reference to [225] (" + UPKEEP + "; neither ruling reaches the pull-day deload swap draw, the p1 "
    "population 138 carries)",
    "g200 SWAP 226")

# ── 2. g219_samecard_draws.js ────────────────────────────────────────────────────────────────────
after_line("g219", "ERA[225] = ERA[224];",
    "ERA[226] = ERA[225];   // V226 (D188 P-BEGINNERMILE, D189 P-PACEDISCLOSE): "
    "UNMOVED, reference to [225] (" + UPKEEP + "; neither ruling reaches the lift-side draw this file audits, "
    "dup 0 li 0 tgt 0 ck 4770 ckNo 891 bic1 412 c165 0 c166 0 and the Pec deck fixture carry)",
    "g219 ERA 226")

for k, p in FILES.items():
    open(p, "w", encoding="utf-8").write(SRC[k])
print("v226_edit_7a4: 2 files written:", ", ".join(FILES[k] for k in FILES))
