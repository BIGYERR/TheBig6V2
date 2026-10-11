#!/usr/bin/env python3
# Post-V239 top-level cleanup, slice 3 of 3 (Mario's decision C3,
# tests/measure/post_v239_cleanup/decisions.md). No ia-version bump; index.html untouched.
#
# Edit 1 (run before this script, by hand): mkdir -p docs/design, then
#   git mv THE_ASYLUM_DS_REFERENCE.md docs/design/
#   git mv THE_ASYLUM_DS_REFERENCE_part_2.md docs/design/
# This script does edits 2 and 3:
#   2. CLAUDE.md Files bullet: path token only -> `docs/design/THE_ASYLUM_DS_REFERENCE*.md`.
#   3. README.md folder table: one `docs/` row directly after the `tests/` row.
# Every anchor is asserted count==1 across both files before anything is written;
# any miss aborts with no writes.
import os
import sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))

CLAUDE_OLD = "- `THE_ASYLUM_DS_REFERENCE*.md` — design system (bone `#F4F1E8`, ink, signal orange `#CF4E1A`; `asyIcon()` inline SVG, never emoji in chrome).\n"
CLAUDE_NEW = "- `docs/design/THE_ASYLUM_DS_REFERENCE*.md` — design system (bone `#F4F1E8`, ink, signal orange `#CF4E1A`; `asyIcon()` inline SVG, never emoji in chrome).\n"

README_OLD = "| `tests/` | the gates every version of `index.html` passes before it ships | run locally (`CLAUDE.md`) |\n"
README_NEW = README_OLD + "| `docs/` | reference for agents and Mario: the design system (`docs/design/`) | not shipped; it rides along on Pages with the rest of the repo, and the app never reads it |\n"

EDITS = [
    ('CLAUDE.md', CLAUDE_OLD, CLAUDE_NEW),
    ('README.md', README_OLD, README_NEW),
]

texts = {}
for rel, old, new in EDITS:
    path = os.path.join(ROOT, rel)
    if rel not in texts:
        with open(path, 'r', encoding='utf-8', newline='') as f:
            texts[rel] = f.read()
    n = texts[rel].count(old)
    print('anchor %s count=%d' % (rel, n))
    if n != 1:
        print('ABORT: anchor in %s count=%d (want 1); nothing written' % (rel, n))
        sys.exit(1)

# The README row must not already exist (re-run guard).
if texts['README.md'].count('| `docs/` |') != 0:
    print('ABORT: README.md already has a `docs/` row; nothing written')
    sys.exit(1)

for rel, old, new in EDITS:
    texts[rel] = texts[rel].replace(old, new, 1)

for rel in texts:
    with open(os.path.join(ROOT, rel), 'w', encoding='utf-8', newline='') as f:
        f.write(texts[rel])
    print('wrote %s' % rel)
