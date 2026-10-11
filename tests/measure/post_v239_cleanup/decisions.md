# Post-V239 top-level cleanup — tests-only pass, no build

Mario, 2026-10-11, on the five-item proposal: "okay these 5 suggestions sound great to me... lets do it now, we need a
cleaner top level and better organization here". No coaching question; no D-code. `ia-version` stays 239, no tag, no
deploy proof (standing ruling 1). Worked in worktree `.claude/worktrees/cleanup-top-level` (branch `cleanup-top-level`,
base local `main` 618605d) because the main tree holds another session's uncommitted run-log work (one writer per
working tree).

## C1 — gate diff output moves under temp/
`tests/gate.sh` writes its blast-radius diff to `temp/last_diff.txt` instead of the repo root's `.last_diff.txt`.
Readers follow: `tests/tooling_selftest.sh` (G7 predicate and header comment), `.claude/skills/ship/SKILL.md` step 4,
`.gitignore` (the root `.last_diff.txt` entry goes; `/temp/` is ignored). Historical mentions in `tests/measure/` and
`tests/edits/` are records and stay as written.
At rebase onto the run-log work: its `tests/gate.sh` line 14 (`--collect "$RUNLOG_ROOT/.last_diff.txt"`) and the
`tools/run.mjs` header comment name the old path and follow C1.

## C2 — session profiler out of the root
`cc_agent_profile.py` moves to `tools/` and stays gitignored (the `.gitignore` pattern has no leading slash, so it
still matches there). `profile.txt` (one Sep 19 report, regenerable) is deleted. Both files are ignored, so both
changes happen in the main tree at landing; nothing in the repo reads either.

## C3 — design-system reference into docs/design/
Approved as: both `THE_ASYLUM_DS_REFERENCE*.md` files move to `docs/design/`, names unchanged.
Finding since approval: `_part_2` is not a second part. It is a later copy of the same document (identical sections
plus the V102 swap icon, bandage icon and "Exercise swap components" section, and "10 custom marks" for "8"). Part 1
holds nothing part 2 lacks. Both arrived in 77e7765 (V190 bootstrap) and neither has been edited since.
Recommended amendment (part 2's content as the one file, part 1 dropped) was put to Mario and not taken up; he asked
to finish and merge. So this pass ships the approved form: both files move as they are. The merge stays open for a
later pass. Names are unchanged, so the three code comments that cite `THE_ASYLUM_DS_REFERENCE.md` by name stay
correct; `CLAUDE.md`'s Files line and `README.md`'s folder table gain the path.

## Landing (Mario, 2026-10-11)
"when you are done, please merge this worktree back into main and run tests /eslint". Merge into local `main` after
gatekeeper is green and the branch is committed; then app and backend tests and lint run on the merged tree. No push
was asked for: local `main` is already ahead of `origin/main` by the Post-V239 no-build commits.

## C4 — INSTALL.md retired
`INSTALL.md` (the V190 bootstrap-pack install note: unzip the pack, `git add -A`, which is now banned) is deleted.
`README.md`'s tests row drops its `INSTALL.md` reference. Git history keeps it.

## C5 — baselines/README rule corrected
The README's "every release drops its artifact here" rule has not been followed since V196; git tags are the record.
Checked 2026-10-11: 52 tags V188..V239; every tag from V190 through V239 checks out an `index.html` reading its own
`ia-version`; V188 and V189 both check out V190 (the defect the folder was made for). The folder keeps V188 and V189
(their tags are wrong) and V196 (`tests/gates/g197d_d84_base.js` reads it). The rewrite says so.

## Proof waived (Mario, 2026-10-11)
"done yet? can we please force skip the gatekeeper?" Gatekeeper did not run. What was checked instead: `bash -n` on
`tests/gate.sh` and `tests/tooling_selftest.sh` (rc 0); every anchor count==1 in the three slice scripts; a live-reader
grep for each moved path (`.last_diff`, `INSTALL.md`, `THE_ASYLUM_DS_REFERENCE`) showing no reader left on an old path;
both design-system moves R100; `index.html` untouched. Not proven: the new `gate.sh` line 306 and the G7 self-test
predicate have never executed. The first `gate.sh` run of the next build is their first run; a wrong path fails there,
loudly (`set -e` on the `cp`), before anything ships. No row manifest was regenerated.

## Classification
CROSS-CUTTING: `tests/gate.sh` changes (Proof scope names it). Full suite, 30-minute budget. `index.html` is not
touched and must stay byte-identical to HEAD. No gate row is added, removed or renamed: no licence file, and any
row-manifest hunk is red.
