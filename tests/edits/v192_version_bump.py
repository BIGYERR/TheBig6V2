#!/usr/bin/env python3
# V192 final slice: version meta bump only (191 -> 192).
# All content edits for V192 landed in:
#   tests/edits/v192_edit.py            (D41 side lunge)
#   tests/edits/v192_d42_edit.py        (D42 landmine rotational press)
#   tests/edits/v192_d42b_d43_edit.py   (D42 _pattern / lowback drop, D43 floor press)
#   tests/edits/v192_d42c_slice3_edit.py(D42 side print + barbell gate)
# This script touches exactly one byte-range: the ia-version meta.
import io, sys

PATH = "/Users/CanasBangin/Desktop/TheBig6V2/index.html"

with io.open(PATH, "r", encoding="utf-8", newline="") as f:
    src = f.read()

orig = src

def rep(s, old, new, label):
    n = s.count(old)
    if n != 1:
        sys.stderr.write("ABORT %s: anchor count==%d (expected 1)\n" % (label, n))
        sys.exit(1)
    print("anchor OK  %-16s count==1" % label)
    return s.replace(old, new, 1)

# --- guard: the only "content=\"191\"" in the file is the version meta ---
stray = src.count('content="191"')
if stray != 1:
    sys.stderr.write('ABORT guard: content="191" appears %d times (expected 1)\n' % stray)
    sys.exit(1)
print('guard OK   content="191" appears exactly once in the file')

if src.count('content="192"') != 0:
    sys.stderr.write('ABORT guard: content="192" already present\n')
    sys.exit(1)
print('guard OK   content="192" not yet present')

# --- LAST replacement in the script: the version meta bump ---
src = rep(src,
          '<meta name="ia-version" content="191">',
          '<meta name="ia-version" content="192">',
          "ia-version")

if src == orig:
    sys.stderr.write("ABORT: no change produced\n")
    sys.exit(1)

with io.open(PATH, "w", encoding="utf-8", newline="") as f:
    f.write(src)

print("WROTE %s  (%d -> %d bytes)" % (PATH, len(orig.encode("utf-8")), len(src.encode("utf-8"))))
