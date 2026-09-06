# Iron Asylum — Claude Code bootstrap pack

Drop-in for the `TheBig6V2` repo. Everything here was run against V190 before packing:
harness boots the app and builds THE HALF MANNY, `tests/gate.sh` is green (10/10), the sabotage
runner trips a real mutation and reports a fake one as NOT-APPLIED.

## Install (once)

```bash
cd ~/Desktop/TheBig6V2                    # your clone
unzip -o ~/Downloads/iron_asylum_claude_code_pack.zip -d .
grep -oE 'content="[0-9]+"' index.html    # confirm what is deployed
bash -c 'set -eo pipefail; tests/gate.sh index.html'   # must end with ALL GATES PASS
git add -A && git commit -m "Claude Code bootstrap: agents, skills, harness, gates" && git push
```

If `index.html` in the repo is older than V190, copy `iron_asylum_v4RUNNINGV190.html` from the
Claude project over it as `index.html` first (one HTML file in the repo, always).

## What landed

```
CLAUDE.md                         standing rules every agent reads automatically
.claude/agents/coach.md           read-only doctrine authority (opus)
.claude/agents/builder.md         read/write implementer
.claude/agents/gatekeeper.md      read+bash verifier — blocks ship
.claude/skills/session-start/     "session start" → four-line status
.claude/skills/ship/              full gate sequence → GREEN/RED
.claude/skills/handoff-update/    the seven-element fold
tests/harness.js                  VM boot, HALF_MANNY fixture, weekGrid(), progDigest()
tests/gate.sh                     version/syntax/dupe-lint/boot/gates/blast-radius runner
tests/gates/g000_boot.js          the gate template (independent oracle, PASS n FAIL n)
tests/sabotage.py + sabotage/     mutation runner (count==1, NOT-APPLIED, CRASH ≠ pass)
tests/lint_allow.txt              known duplicate declarations = debt
tests/measure/, tests/edits/      measure-pass scripts and edit scripts, kept as record
doctrine/*.txt                    page-ordered OCR of NSW + four NRC plans (gitignored)
IRON_ASYLUM_HANDOFF_1_1.md        current handoff (V190), same file as the project
THE_ASYLUM_DS_REFERENCE*.md       design system
```

## First session in Claude Code (Code tab → open the repo folder)

1. "Run session-start."
2. "Have coach rule on <the next §12 item>." Coach prints the before grid from the harness, rules, prints the after grid.
   (The Friday hinge and race-week lifting shipped in V189; the V190 grid already shows RDL on Thursday's speed day and a bare Shakeout / Race Day.)
3. Concur or push back.
4. "Have builder implement that as V191." Builder saves `/tmp/base_V190.html` from git first.
5. "Have gatekeeper run ship on V191."
6. "Run handoff-update."  Then `git add -A && git commit -m "V191: <title>" && git tag V191 && git push --tags origin main`.

## Two things the pack found on V190, for the queue

- `_isoToday` is declared twice (lines 1832 and 13452). Same behaviour, second wins by hoisting.
  Harmless today, exactly the V119 class. Listed in `tests/lint_allow.txt` as debt; remove one copy
  in V191 and delete the line.
- The handoff has digest lines through V189 but none for V190 (header bullet only). `session-start`
  will flag it; add the V190 line at the tail before the next build.

## Conventions this pack assumes (your ruling if you want them different)

- The repo holds exactly one HTML, `index.html`. The version lives in the meta tag and in a git tag
  `V<N>`; the `iron_asylum_v4RUNNINGV<N>.html` filename convention retires. `gate.sh` still enforces
  filename == meta if you ever hand it a V-named file.
- Gatekeeper blocks. A build is not done until its verdict block says GREEN.
- `doctrine/` is gitignored so Pages does not publish it; `tests/` is committed and therefore public.
