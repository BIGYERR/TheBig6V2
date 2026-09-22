#!/usr/bin/env python3
# V204 slice 10 — D-code registry catch-up ONLY.
# Coach issued D128 (Guide A 30-minute total-work ceiling binds the CHI ramp,
# as A's 8-rep ceiling already binds the SI ramp under D114) minutes after
# slice 9 wrote the registry line at D127. D128 belongs to the unbuilt run-day
# work shipping as V205, but the registry tracks ASSIGNED, not built.
# Touches IRON_ASYLUM_HANDOFF_1_1.md line 10 and nothing else.
import hashlib, pathlib, sys

ROOT = pathlib.Path(__file__).resolve().parents[2]
HANDOFF = ROOT / "IRON_ASYLUM_HANDOFF_1_1.md"
INDEX = ROOT / "index.html"

# Guard: this slice must not disturb the artifact.
INDEX_MD5 = "63c47db9a81aef91d13addf011005d52"
before_md5 = hashlib.md5(INDEX.read_bytes()).hexdigest()
if before_md5 != INDEX_MD5:
    sys.exit("ABORT: index.html md5 %s != expected %s" % (before_md5, INDEX_MD5))

src = HANDOFF.read_text(encoding="utf-8")

OLD = "highest assigned = D127. Next free = D128."
NEW = "highest assigned = D128. Next free = D129."

n = src.count(OLD)
print("anchor count: %d" % n)
if n != 1:
    sys.exit("ABORT: anchor count==%d, expected 1" % n)
if src.count(NEW) != 0:
    sys.exit("ABORT: replacement text already present")

# Line 10 and only line 10.
lines = src.split("\n")
if OLD not in lines[9]:
    sys.exit("ABORT: anchor is not on line 10")

src = src.replace(OLD, NEW, 1)
HANDOFF.write_text(src, encoding="utf-8")

after_md5 = hashlib.md5(INDEX.read_bytes()).hexdigest()
if after_md5 != INDEX_MD5:
    sys.exit("ABORT: index.html changed during this script")
print("WROTE IRON_ASYLUM_HANDOFF_1_1.md line 10; index.html md5 unchanged %s" % after_md5)
