#!/usr/bin/env python3
# V206 slice 3 of 4 — D109 (amended, coach-ruled): the NRC and bike builder copy sweep.
# Applies entries 23–37 of coach's replacement table (tests/measure/v206_d109_table.txt),
# which are buildNRCSession's strings (15 replacements), and entries 38–45, which are
# buildBikeSession's strings (8 replacements). Entries 1–22 (run) landed in slice 2;
# entries 46–56 (swim) are slice 4. New text is applied VERBATIM from the table; this
# script edits no copy of its own.
#
# Table format: "@@ n" = required source count, then the old text, a "--" line, then the
# new text. Backslash sequences (\n, \') sit in the table exactly as they sit in source.
#
# All-or-nothing across BOTH builders. Before anything is written:
#   * the table is the one coach ruled (sha256 pinned below), and parses to 56 entries;
#   * each old string's count in index.html equals its "@@ n", and the per-builder totals
#     equal coach's figures (NRC 15, bike 8);
#   * every occurrence lies inside its own builder's body (from "function buildXSession(" to
#     the first line matching ^} after it), and no two occurrences overlap;
#   * after the in-memory rewrite, every byte outside the two bodies is identical, each body
#     still ends at its own ^} line with an unchanged line count, and no old text survives.
# ia-version is NOT bumped here; slice 4 owns the bump.
import hashlib, re, sys

PATH  = '/Users/CanasBangin/Desktop/TheBig6V2/index.html'
TABLE = '/Users/CanasBangin/Desktop/TheBig6V2/tests/measure/v206_d109_table.txt'
TABLE_SHA256 = '8dfe5e17e8b0bad0ca7838dc834030690afa9ceccb1f3ceb538ff4d2c9918894'
# (builder, first entry, last entry, coach's replacement total)
GROUPS = [('buildNRCSession', 23, 37, 15),
          ('buildBikeSession', 38, 45, 8)]

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
bodies, spans, per = [], [], {}
for fn, first, last, total in GROUPS:
    A, E = body_span(src, fn)
    bodies.append((A, E, fn))
    got = 0
    for k in range(first, last + 1):
        n, old, new = ents[k - 1]
        if not old or old == new:
            die('entry %d: empty or identity replacement' % k)
        c = src.count(old)
        if c != n:
            die('entry %d: count=%d, table says @@ %d: %r' % (k, c, n, old[:80]))
        for mm in re.finditer(re.escape(old), src):
            if not (A <= mm.start() and mm.end() <= E):
                die('entry %d: occurrence at char %d lies outside %s' % (k, mm.start(), fn))
            spans.append((mm.start(), mm.end(), k))
        got += n
    if got != total:
        die('%s: %d replacements from the table, coach says %d' % (fn, got, total))
    per[fn] = got
bodies.sort()
for (a1, e1, f1), (a2, e2, f2) in zip(bodies, bodies[1:]):
    if a2 < e1:
        die('%s and %s bodies overlap' % (f1, f2))
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

# bytes outside the two bodies are identical, gap by gap
new_bodies = sorted((body_span(dst, fn) + (fn,)) for _, _, fn in bodies)
if [f for _, _, f in new_bodies] != [f for _, _, f in bodies]:
    die('builder order changed')
cuts_src = [0] + [x for a, e, _ in bodies for x in (a, e)] + [len(src)]
cuts_dst = [0] + [x for a, e, _ in new_bodies for x in (a, e)] + [len(dst)]
for j in range(0, len(cuts_src), 2):
    if src[cuts_src[j]:cuts_src[j + 1]] != dst[cuts_dst[j]:cuts_dst[j + 1]]:
        die('bytes outside the builder bodies moved (gap %d)' % (j // 2))
for (a, e, fn), (a2, e2, _) in zip(bodies, new_bodies):
    if src[a:e].count('\n') != dst[a2:e2].count('\n'):
        die('%s changed its line count; the ^} terminator may have moved' % fn)
for fn, first, last, _ in GROUPS:
    a2, e2 = body_span(dst, fn)
    for k in range(first, last + 1):
        n, old, new = ents[k - 1]
        if old in dst[a2:e2]:
            die('entry %d: old text still present after rewrite' % k)
        if dst[a2:e2].count(new) < n:
            die('entry %d: new text sits %d times in %s, want >= %d' % (k, dst[a2:e2].count(new), fn, n))

open(PATH, 'w', encoding='utf-8').write(dst)
print('v206 slice 3 (D109 NRC + bike): %s, ia-version untouched'
      % ', '.join('%s %d' % (fn, per[fn]) for fn, _, _, _ in GROUPS))
