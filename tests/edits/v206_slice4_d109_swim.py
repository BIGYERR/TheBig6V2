#!/usr/bin/env python3
# V206 slice 4 of 4 — D109 (amended, coach-ruled): the swim builder copy sweep, then the
# ia-version bump 205 → 206 (Mario authorised the bump for this version).
# Applies entries 46–56 of coach's replacement table (tests/measure/v206_d109_table.txt),
# which are buildSwimSession's strings (12 replacements: entry 49 is "@@ 2"). Entries 1–22
# (run) landed in slice 2, entries 23–45 (NRC + bike) in slice 3. New text is applied
# VERBATIM from the table; this script edits no copy of its own.
#
# Table format: "@@ n" = required source count, then the old text, a "--" line, then the
# new text. Backslash sequences (\n, \') sit in the table exactly as they sit in source.
#
# All-or-nothing. Before anything is written:
#   * the table is the one coach ruled (sha256 pinned below), and parses to 56 entries;
#   * each old string's count in index.html equals its "@@ n", and the total equals
#     coach's figure (swim 12);
#   * every occurrence lies inside buildSwimSession's body (from "function buildSwimSession("
#     to the first line matching ^} after it), and no two occurrences overlap;
#   * after the in-memory rewrite, every byte outside the body is identical, the body still
#     ends at its own ^} line with an unchanged line count, and no old text survives;
#   * THEN, and last, the ia-version meta is bumped 205 → 206 on a count==1 anchor, and the
#     final text differs from the swim-only text in exactly that one tag.
import hashlib, re, sys

PATH  = '/Users/CanasBangin/Desktop/TheBig6V2/index.html'
TABLE = '/Users/CanasBangin/Desktop/TheBig6V2/tests/measure/v206_d109_table.txt'
TABLE_SHA256 = '8dfe5e17e8b0bad0ca7838dc834030690afa9ceccb1f3ceb538ff4d2c9918894'
FN, FIRST, LAST, TOTAL = 'buildSwimSession', 46, 56, 12
META_OLD = '<meta name="ia-version" content="205">'
META_NEW = '<meta name="ia-version" content="206">'

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

def body_span(s, fn):
    if s.count('function %s(' % fn) != 1:
        die('function %s( count=%d (want 1)' % (fn, s.count('function %s(' % fn)))
    a = s.index('function %s(' % fn)
    m = re.compile(r'^\}', re.M).search(s, a)
    if not m:
        die('no ^} after function %s(' % fn)
    return a, m.end()

# ── pass 1: every assertion, nothing written ────────────────────────────────
if src.count(META_OLD) != 1:
    die('meta anchor count=%d (want 1): %s' % (src.count(META_OLD), META_OLD))
if src.count(META_NEW) != 0:
    die('meta already reads 206')
A, E = body_span(src, FN)
spans, got = [], 0
for k in range(FIRST, LAST + 1):
    n, old, new = ents[k - 1]
    if not old or old == new:
        die('entry %d: empty or identity replacement' % k)
    c = src.count(old)
    if c != n:
        die('entry %d: count=%d, table says @@ %d: %r' % (k, c, n, old[:80]))
    for mm in re.finditer(re.escape(old), src):
        if not (A <= mm.start() and mm.end() <= E):
            die('entry %d: occurrence at char %d lies outside %s' % (k, mm.start(), FN))
        spans.append((mm.start(), mm.end(), k))
    got += n
if got != TOTAL:
    die('%s: %d replacements from the table, coach says %d' % (FN, got, TOTAL))
spans.sort()
for (s1, e1, k1), (s2, e2, k2) in zip(spans, spans[1:]):
    if s2 < e1:
        die('entries %d and %d overlap at char %d' % (k1, k2, s2))

# ── pass 2: rewrite in memory, left to right over the asserted spans ────────
out, pos = [], 0
for s, e, k in spans:
    out.append(src[pos:s]); out.append(ents[k - 1][2]); pos = e
out.append(src[pos:])
dst = ''.join(out)

A2, E2 = body_span(dst, FN)
if src[:A] != dst[:A2] or src[E:] != dst[E2:]:
    die('bytes outside the %s body moved' % FN)
if src[A:E].count('\n') != dst[A2:E2].count('\n'):
    die('%s changed its line count; the ^} terminator may have moved' % FN)
for k in range(FIRST, LAST + 1):
    n, old, new = ents[k - 1]
    if old in dst[A2:E2]:
        die('entry %d: old text still present after rewrite' % k)
    if dst[A2:E2].count(new) < n:
        die('entry %d: new text sits %d times in %s, want >= %d' % (k, dst[A2:E2].count(new), FN, n))

# ── last replacement: the version meta ──────────────────────────────────────
if dst.count(META_OLD) != 1:
    die('meta anchor count=%d after the swim rewrite (want 1)' % dst.count(META_OLD))
fin = dst.replace(META_OLD, META_NEW, 1)
if fin.count(META_NEW) != 1 or fin.count(META_OLD) != 0 or len(fin) != len(dst):
    die('meta bump did not land as exactly one same-length tag')
if [j for j in range(len(fin)) if fin[j] != dst[j]] != [dst.index(META_OLD) + len(META_OLD) - 3]:
    die('meta bump changed more than the one digit it owns')

open(PATH, 'w', encoding='utf-8').write(fin)
print('v206 slice 4 (D109 swim): %s %d, ia-version 205 -> 206' % (FN, got))
