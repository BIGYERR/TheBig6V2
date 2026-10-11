#!/usr/bin/env python3
# Post-V239 top-level cleanup, slice 1 of 3: Mario's decision C1 (tests/measure/post_v239_cleanup/decisions.md).
# tests/gate.sh writes its blast-radius diff to temp/last_diff.txt instead of the repo root's .last_diff.txt; the
# readers follow (tests/tooling_selftest.sh header comment and G7 predicate, .claude/skills/ship/SKILL.md step 4) and
# .gitignore drops the root .last_diff.txt entry (and its "# scratch" comment) for an ignored /temp/.
# Tests-only tooling: index.html is not touched and there is no ia-version bump (stays 239). Row names, status lines and
# the diff content are unchanged. History under tests/measure/ and tests/edits/ stays as written.
# Every anchor is asserted count==1 (the EOF anchor: count==1 and at the end) before any write; one miss aborts with no
# writes.
import os, sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))

# (relative path, old, new) in file order; the .gitignore EOF append is handled as its own anchor below.
EDITS = [
    ('tests/gate.sh',
     '  cp "$TMP/diff.txt" "$HERE/../.last_diff.txt"; echo "   full diff -> .last_diff.txt"\n',
     '  mkdir -p "$HERE/../temp"; cp "$TMP/diff.txt" "$HERE/../temp/last_diff.txt"; echo "   full diff -> temp/last_diff.txt"\n'),
    ('tests/tooling_selftest.sh',
     '# writes .last_diff.txt).\n',
     '# writes temp/last_diff.txt).\n'),
    ('tests/tooling_selftest.sh',
     '[ -s "$GA/.last_diff.txt" ]',
     '[ -s "$GA/temp/last_diff.txt" ]'),
    ('.claude/skills/ship/SKILL.md',
     'read `.last_diff.txt`',
     'read `temp/last_diff.txt`'),
    ('.gitignore',
     '# scratch\n.last_diff.txt\n',
     ''),
]
GI_EOF_OLD = '.claude/worktrees/\n'
GI_EOF_NEW = '.claude/worktrees/\n\n# gate output and run logs; local, never committed\n/temp/\n'

def die(msg):
    print('ABORT (no file written): ' + msg)
    sys.exit(1)

texts = {}
for rel, _, _ in EDITS:
    if rel not in texts:
        p = os.path.join(ROOT, rel)
        if not os.path.isfile(p): die('missing file ' + rel)
        with open(p, 'r', encoding='utf-8', newline='') as f: texts[rel] = f.read()

# Phase 1: assert every anchor against the untouched text.
for i, (rel, old, new) in enumerate(EDITS, 1):
    n = texts[rel].count(old)
    print('anchor %d %s count=%d' % (i, rel, n))
    if n != 1: die('anchor %d in %s: count %d, want 1: %r' % (i, rel, n, old))
gi = texts['.gitignore']
n = gi.count(GI_EOF_OLD)
print('anchor %d .gitignore (EOF) count=%d endswith=%s' % (len(EDITS) + 1, n, gi.endswith(GI_EOF_OLD)))
if n != 1 or not gi.endswith(GI_EOF_OLD): die('.gitignore EOF anchor: count %d, endswith %s' % (n, gi.endswith(GI_EOF_OLD)))
if '/temp/' in gi: die('.gitignore already ignores /temp/')

# Phase 2: apply in memory, re-asserting each anchor on the running text.
out = dict(texts)
for i, (rel, old, new) in enumerate(EDITS, 1):
    if out[rel].count(old) != 1: die('anchor %d in %s moved during apply' % (i, rel))
    out[rel] = out[rel].replace(old, new, 1)
g = out['.gitignore']
if g.count(GI_EOF_OLD) != 1 or not g.endswith(GI_EOF_OLD): die('.gitignore EOF anchor moved during apply')
out['.gitignore'] = g[:-len(GI_EOF_OLD)] + GI_EOF_NEW

# Phase 3: post-conditions on the new text, then write.
if '.last_diff' in out['tests/gate.sh'] or '.last_diff' in out['tests/tooling_selftest.sh']: die('old path survives in a tool')
if '.last_diff' in out['.claude/skills/ship/SKILL.md'] or '.last_diff' in out['.gitignore']: die('old path survives in a reader')
if '# scratch' in out['.gitignore']: die('"# scratch" comment survives')
for rel in out:
    if out[rel] == texts[rel]: die('no change in ' + rel)
for rel in out:
    with open(os.path.join(ROOT, rel), 'w', encoding='utf-8', newline='') as f: f.write(out[rel])
    print('wrote ' + rel)
print('OK: C1 slice 1 applied (%d anchors)' % (len(EDITS) + 1))
