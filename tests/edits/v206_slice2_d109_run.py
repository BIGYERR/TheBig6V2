#!/usr/bin/env python3
# V206 slice 2 of 4 — D109 (amended, coach-ruled): the run-builder copy sweep.
# Applies entries 1–22 of coach's replacement table (tests/measure/v206_d109_table.txt),
# which are buildRunSession's strings. Entries 23–56 (NRC, bike, swim) are slices 3–4.
# New text is applied VERBATIM from the table; this script edits no copy of its own.
#
# Table format: "@@ n" = required source count, then the old text, a "--" line, then the
# new text. Backslash sequences (\n, \') sit in the table exactly as they sit in source.
#
# All-or-nothing. Before anything is written:
#   * the table is the one coach ruled (sha256 pinned below), and parses to 56 entries;
#   * each old string's count in index.html equals its "@@ n";
#   * every occurrence lies inside buildRunSession's body (from "function buildRunSession("
#     to the first line matching ^} after it), and no two occurrences overlap;
#   * after the in-memory rewrite, the file outside that body is byte-identical and the
#     body still ends at the same ^} line.
# ia-version is NOT bumped here; slice 4 owns the bump.
import hashlib, re, sys

PATH  = '/Users/CanasBangin/Desktop/TheBig6V2/index.html'
TABLE = '/Users/CanasBangin/Desktop/TheBig6V2/tests/measure/v206_d109_table.txt'
TABLE_SHA256 = '8dfe5e17e8b0bad0ca7838dc834030690afa9ceccb1f3ceb538ff4d2c9918894'
FIRST, LAST = 1, 22          # buildRunSession's entries
FN = 'buildRunSession'

def die(msg):
    sys.exit('ABORT: ' + msg)

raw_b = open(TABLE, 'rb').read()
if hashlib.sha256(raw_b).hexdigest() != TABLE_SHA256:
    die('table sha256 is not the ruled table (%s)' % hashlib.sha256(raw_b).hexdigest())
lines = raw_b.decode('utf-8').split('\n')
if lines and lines[-1] == '':
    lines = lines[:-1]

ents, i = [], 0
while i < len(lines):
    m = re.match(r'^@@ (\d+)$', lines[i])
    if not m:
        die('table line %d is not an "@@ n" header: %r' % (i + 1, lines[i]))
    n, old, new = int(m.group(1)), [], []
    i += 1
    while i < len(lines) and lines[i] != '--':
        old.append(lines[i]); i += 1
    if i >= len(lines):
        die('entry %d has no "--" separator' % (len(ents) + 1))
    i += 1
    while i < len(lines) and not re.match(r'^@@ \d+$', lines[i]):
        new.append(lines[i]); i += 1
    ents.append((n, '\n'.join(old), '\n'.join(new)))
if len(ents) != 56:
    die('table parses to %d entries, want 56' % len(ents))

src = open(PATH, encoding='utf-8').read()

def body_span(s):
    if s.count('function %s(' % FN) != 1:
        die('function %s( count=%d (want 1)' % (FN, s.count('function %s(' % FN)))
    a = s.index('function %s(' % FN)
    m = re.compile(r'^\}', re.M).search(s, a)
    if not m:
        die('no ^} after function %s(' % FN)
    return a, m.end()

A, E = body_span(src)
mine = ents[FIRST - 1:LAST]

# ── pass 1: every assertion, nothing written ────────────────────────────────
spans, expect = [], 0
for k, (n, old, new) in enumerate(mine, FIRST):
    if not old or old == new:
        die('entry %d: empty or identity replacement' % k)
    c = src.count(old)
    if c != n:
        die('entry %d: count=%d, table says @@ %d: %r' % (k, c, n, old[:80]))
    for mm in re.finditer(re.escape(old), src):
        if not (A <= mm.start() and mm.end() <= E):
            die('entry %d: occurrence at char %d lies outside %s' % (k, mm.start(), FN))
        spans.append((mm.start(), mm.end(), k))
    expect += n
spans.sort()
for (s1, e1, k1), (s2, e2, k2) in zip(spans, spans[1:]):
    if s2 < e1:
        die('entries %d and %d overlap at char %d' % (k1, k2, s2))

# ── pass 2: rewrite the body in memory, left to right over the asserted spans ──
out, pos = [], 0
for s, e, k in spans:
    out.append(src[pos:s]); out.append(mine[k - FIRST][2]); pos = e
out.append(src[pos:])
dst = ''.join(out)

A2, E2 = body_span(dst)
if dst[:A2] != src[:A] or dst[E2:] != src[E:]:
    die('bytes outside %s moved' % FN)
if src[A:E].count('\n') != dst[A2:E2].count('\n'):
    die('%s changed its line count; the ^} terminator may have moved' % FN)
for k, (n, old, new) in enumerate(mine, FIRST):
    if old in dst[A2:E2]:
        die('entry %d: old text still present after rewrite' % k)

open(PATH, 'w', encoding='utf-8').write(dst)
print('v206 slice 2 (D109 run): %d entries, %d replacements inside %s, ia-version untouched'
      % (len(mine), expect, FN))
