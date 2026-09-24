#!/usr/bin/env python3
# V218 closeA — ruling-5 era rows for D157 (coach printed them on the V218-stamped tree). Tests only.
# Each [218] row goes directly after its [217] sibling; coach's comments copied verbatim.
# Guards: every [217] anchor count==1 at line start; no [218] row exists yet for any table.
# No version bump, no commit (brief).
import re, sys
HARN = '/Users/CanasBangin/Desktop/TheBig6V2/tests/harness.js'
G197 = '/Users/CanasBangin/Desktop/TheBig6V2/tests/gates/g197b_sweep.js'

EDITS = [
  (HARN, 'MANNY_DIGEST_BY_VERSION',
   "MANNY_DIGEST_BY_VERSION[218] = MANNY_DIGEST_BY_VERSION[217];   // D157: ruled UNMOVED (0ac7da6b1691a8e1 / 1069cd7f86eed204 / 9d14801a63111081 printed by coach on the V218-stamped tree with g199's and g200's methods; 0/98 days; D157 is swim sizer length and three swim labels, HALF_MANNY holds 0 swim sessions)"),
  (HARN, 'MANNY_DELOAD_OFF_DIGEST_BY_VERSION',
   "MANNY_DELOAD_OFF_DIGEST_BY_VERSION[218] = MANNY_DELOAD_OFF_DIGEST_BY_VERSION[217];   // D157: ruled UNMOVED (1069cd7f86eed204 printed by coach on the V218-stamped tree)"),
  (HARN, 'MANNY_CORE_OFF_DIGEST_BY_VERSION',
   "MANNY_CORE_OFF_DIGEST_BY_VERSION[218] = MANNY_CORE_OFF_DIGEST_BY_VERSION[217];   // D157: ruled UNMOVED (9d14801a63111081 printed by coach on the V218-stamped tree)"),
  (G197, 'HF_LEAK_BY_VERSION',
   "HF_LEAK_BY_VERSION[218] = HF_LEAK_BY_VERSION[217];   // D157: ruled UNMOVED (0/0 printed; the swim sizer and three labels draw no lift item)"),
]

src = {HARN: open(HARN, encoding='utf-8').read(), G197: open(G197, encoding='utf-8').read()}
plan = []
for i, (f, t, row) in enumerate(EDITS, 1):
    s = src[f]
    if s.count(t + '[218]') != 0 or re.search(r'(?m)^\s*218\s*:', s):
        print('ABORT: E%d a [218] row already exists for %s' % (i, t)); sys.exit(2)
    anchor = '\n' + t + '[217] = ' + t + '[216];'
    n = s.count(anchor)
    if n != 1:
        print('ABORT: E%d anchor count %d: %r' % (i, n, anchor)); sys.exit(2)
    plan.append((f, t, anchor, row))
for i, (f, t, anchor, row) in enumerate(plan, 1):
    s = src[f]
    a = s.index(anchor) + 1
    eol = s.index('\n', a)
    src[f] = s[:eol + 1] + row + '\n' + s[eol + 1:]
    print('applied E%d %s[218] after line: %s...' % (i, t, s[a:a + 70]))
for f, t, anchor, row in plan:
    if src[f].count(t + '[218]') != 1 or src[f].count(row) != 1:
        print('ABORT: post-condition %s' % t); sys.exit(3)
for f in src:
    open(f, 'w', encoding='utf-8').write(src[f])
print('written')
