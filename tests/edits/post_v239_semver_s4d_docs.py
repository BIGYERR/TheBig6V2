#!/usr/bin/env python3
# Post-V239 semver, slice 4, part D: the docs that state the native version mapping. config.xml's version values are
# left as they stand (1.0.239 / 239): no test or check asserts them, and scripts/ios.mjs rewrites them on the next
# iOS build. Every anchor asserted count==1 before anything is written; the first miss aborts the whole script.
import os, sys
WT = '/Users/CanasBangin/Desktop/TheBig6V2/.claude/worktrees/semver'

EDITS = {
'app/config.xml': [
  ("  so a phone shows which build it carries (ia-version 238 = 1.0.238, build 238).\n",
   "  so a phone shows which build it carries. Both are the canonical M.m.p (ia-version 239 = 0.239.0, 0.239.1 = 0.239.1).\n"),
],
'app/README.md': [
  ("- **Version** follows `ia-version`. 238 ships as `1.0.238`, build `238`. `scripts/ios.mjs` keeps `config.xml` in step.\n",
   "- **Version** follows `ia-version`: version and build are both its canonical `MAJOR.MINOR.PATCH` (legacy `239` ships as\n"
   "  `0.239.0`, `0.239.1` as `0.239.1`; the app is pre-1.0). `scripts/ios.mjs` keeps `config.xml` in step.\n"),
],
}

texts = {}
for rel, pairs in EDITS.items():
    with open(os.path.join(WT, rel), encoding='utf-8') as fh:
        src = fh.read()
    for old, new in pairs:
        n = src.count(old)
        if n != 1:
            sys.exit('ABORT: %s: anchor found %d times: %r' % (rel, n, old[:90]))
        src = src.replace(old, new)
    texts[rel] = src
for rel, src in texts.items():
    with open(os.path.join(WT, rel), 'w', encoding='utf-8') as fh:
        fh.write(src)
    print('edited', rel, len(EDITS[rel]), 'hunks')
