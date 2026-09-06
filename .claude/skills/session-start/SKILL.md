---
name: session-start
description: Verify the canonical Iron Asylum artifact and handoff agree before any work. Run at the start of every session, or when Mario says "session start" / "where are we".
---
Run these, in order, and report the four lines. Do not begin design or edits until all four agree.

1. Version on disk:
   `grep -oE '<meta name="ia-version" content="[0-9]+"' index.html`
   Also `ls *.html` — there must be exactly one HTML file in the repo root.
2. Version the handoff claims:
   `grep -m1 -oE '\*\*Working file:\*\*[^\n]*V[0-9]+' IRON_ASYLUM_HANDOFF_1_1.md`
3. Digest line for that exact version at the tail:
   `grep -nE '^- \*\*V<N>' IRON_ASYLUM_HANDOFF_1_1.md`
   A file version with NO digest line means a build was dropped or the previous session never folded its entry. Say so; do not silently continue.
4. Git state: `git status --short && git log --oneline -3 && git tag --list 'V*' | tail -3`.
   Uncommitted changes in `index.html` at session start are a red flag: ask Mario before proceeding.

Then print the before-picture for the live program so the session has a baseline in context:
`bash -c 'set -eo pipefail; node tests/harness.js index.html --grid' | head -40`

Report:
```
FILE     index.html  ia-version N
HANDOFF  header VN / digest line: present|MISSING
GIT      clean|dirty, HEAD <sha> <msg>, last tag VN
QUEUE    <§12 ruled-and-unbuilt items, one line>
```
