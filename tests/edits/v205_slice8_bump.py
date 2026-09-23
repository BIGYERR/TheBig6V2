#!/usr/bin/env python3
# V205 slice 8, EDIT 1 of 4: the ia-version bump, 204 -> 205.
# Mario authorised V205 by name ("ship V205 without D113, and give D113 its own version").
# This script has exactly ONE replacement and it is the version meta bump, which is
# therefore trivially the last replacement in the script (standing procedure).
import io, sys

PATH = 'index.html'
src = io.open(PATH, encoding='utf-8').read()

OLD = '<meta name="ia-version" content="204">'
NEW = '<meta name="ia-version" content="205">'

n = src.count(OLD)
print('anchor count <meta ia-version 204> = %d' % n)
assert n == 1, 'ABORT: expected exactly 1 ia-version anchor, found %d' % n
assert src.count('content="205"') == 0, 'ABORT: content="205" already present'

src = src.replace(OLD, NEW)

assert src.count('content="205"') == 1
assert src.count('content="204"') == 0

io.open(PATH, 'w', encoding='utf-8').write(src)
print('WROTE index.html: ia-version 204 -> 205')
