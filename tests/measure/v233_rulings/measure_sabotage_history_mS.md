# Post-V233 measure S: the sabotage sweep's own history, V190–V233 (record + git, not the engine), 2026-10-05

Asked by Mario, who is moving the sweep off per-build to "run it when any gate file is added or edited, or once a week,
whichever comes first": "If the history shows the V221 dead gates appeared with no gate changes nearby, tell me before
applying the rule." Script: tests/measure/v233_sabotage_history.py (`meta`: git and anchor history; `run`: the V221 trio
re-run on tag trees). Outputs are in the session scratchpad measure_S/ (meta.out, run.out, run_*.log). Oracles: tag dates
and `git diff --name-status` between tags; NOT-APPLIED recomputed as str.count(anchor)==1 on each tag's own index.html
(these counts match the record: 637/626/595/... mutations, 7 NOT-APPLIED at V221–V233); TRIPPED/SURVIVED only from each tag
tree's own tests/sabotage.py run against that tag's index.html. Uncommitted at writing; ride the next tests-only commit.

## Direct answer (V221 event, proven by running it)
v219.json S1-D167, S3-D171 and S4-D167, gate g219_d167_pairs.js:
- V219 tree on V219 html: TRIPPED 5/5 (S1 FAIL 6, S3 FAIL 2, S4 FAIL 1).
- V220 tree on V220 html: S1, S3, S4 SURVIVED (PASS 4 FAIL 0); S2 and S5 still trip. V221 tree on V221 html: the same.
- V220 tree on V220 html re-stamped ia-version 219 (one meta line): TRIPPED 5/5, the same FAIL counts as V219.
So the trio went dead at V220 (8ee4385). The cause was index.html only: the version bump 219 → 220 turned off g219's
`PAIR = VER === ERA` (ERA 219) pair rows. g219_d167_pairs.js has exactly one commit, V219 (920fa0a), and was never edited
again through V233. The only other file it requires is harness.js, and V220 changed only three MANNY era rows there, which
g219 does not read. But V220 was NOT a build without gate changes: it added 3 gate files and edited 7 others (g190,
g193_samecard, g197b, g199, g200_pull, g205_pace_eve, g219_samecard_draws). Under the proposed trigger, V220 fires a full sweep.
Practice at the time: V219 ran only its own spec (12/12). V220 ran its own spec, v190 and five adjacent specs. V221 ran the
full sweep and found the trio (one build and 3.8 h later).

## Cadence and trigger reach
44 tags, 43 intervals, 29.88 days: 10.07 builds per week (ISO weeks 36–41: 2, 3, 7, 22, 7, 3). Longest gap: V192 → V193,
124.6 h. A 7-day timer never expired between two builds.
A tests/gates file was added or edited in 43/43 intervals. harness.js was edited in 34/43, always in an interval that also
edited a gate. index.html changed in 43/43.

## Sweep scope per build (record)
Full sweep (every spec, or every spec except example.json): V192–V199, V206–V218 (the era replay; V209–V215 state only
"0 NOT-APPLIED caused", V216–V218 also state "0 SURVIVED") and V221–V233. That is 34/44.
Own spec or partial: V190, V191, V200, V201, V202, V203, V204, V205, V219, V220. That is 10/44.
Full-sweep counts: V221 477/488, V222 488/499, V223 517/528, V224 519/530, V225 524/535, V226 540/551, V227 550/561,
V228 555/566, V229 579/590, V230 584/595, V231 598/609, V232 615/626, V233 626/637. Each has 4 survivors, 7 NOT-APPLIED
and 0 crashes. V196 161/162, V197 173/174 (the 1 is example.json). V193 124/124, V194 134/134, V195 150/150, V198 178/178,
V199 187/187.
Wall time: V232 8,636 s and V233 4,908 s (83 specs, 637 mutations, 8 jobs). One mutation naming g230_d194_lens2 costs a full
gate run of about 13–19 min; at V230 six of them took about 60 min concurrently.

## Non-trip events on older specs (cross-build), classed
- Real gate hole (a gate went dead): 1 event, 3 mutations. g219 trio, V220, cause index.html (version bump), gate file
  unchanged. Found V221. Carried as a documented survivor V221–V233 (13 builds).
- Documented survivor by design: v205_d122_threerun_v204 S4. It survives on V205 html (proven) and trips on V204 html
  (proven), so it is scoped to ≤204 by its own note. It has been carried since V205.
- Mutation defect, redundant: V201, two v200 mutations SURVIVED because D94 (index.html) moved their observable off g200.
  They were retired the same build as byte-identical duplicates of v199 M1/M8. g200_pull_arbitration.js was edited at V201.
- Mutation defect, anchor drift to NOT-APPLIED: 62 events across 15 builds (V199 1, V202 1, V203 1, V206 4, V208 10,
  V209 1, V216 1, V219 4, V220 2, V223 7, V225 3, V226 6, V227 1, V229 12, V230 8). 55/62 were re-anchored in the same
  build. 7/62 were not:
  v201 M4 at V202 (era-scoped by design, carried);
  v202 M10 at V203 (unseen V203–V205, re-anchored V206: 3 builds, 22.6 h);
  v193_samecard M13, v197 M4, v200 M4 and v200 M5 at V219 (unseen V219–V220, found V221: 2 builds, 10.9 h, carried since);
  v195 M12 at V220 (found V221: 1 build, 3.8 h, carried since).
- Deliberate no-op: example.json, NOT-APPLIED at every tag (44/44).
- Tooling: sabotage.py lost three sweeps to ENAMETOOLONG (V194, V197, V197 again; per its own docstring). The fix was the
  clamp, 3c55b3f.

## Cause of each event: gate or harness edit, or index.html only
- Every NOT-APPLIED drift is an index.html text change by construction. 0/62 fell in a build with no gate add/edit.
- 18/62 fell in a build that did not edit the gate the mutation names: V202 1, V203 1, V206 1, V209 1, V216 1, V220 1,
  V229 6, V230 6. The 4 at V219 did name an edited gate.
- No event in V190–V233 traces to a harness.js change.

## Counterfactual lag under the proposed trigger
Read as written ("any tests/gates file added or edited, or 7 days"), the trigger fires on 43/43 builds, the same cadence as
a per-build full sweep. Each hole would have been caught at 0 builds and 0 days:
- g219 trio: 1 build / 3.8 h earlier than practice.
- V219 quartet: 2 builds / 10.9 h earlier.
- v195 M12: 1 build / 3.8 h earlier.
- v202 M10: 3 builds / 22.6 h earlier.
Counting harness.js changes nothing: it adds 0 firings over 43 intervals.
Read narrowly ("only when the gate a spec names is edited, else weekly"), the g219 trio waits for the weekly run. Its gate was
never edited after V219. Taking the last full sweep as V218 (2026-09-24 10:14), the timer falls due 2026-10-01 10:14, and the
first build after that is V227 (2026-10-01 21:22). That is 7 builds and 6.99 days after V220. Under the same reading, 18/62
drift events wait for the weekly run.

## Unknown
- Wall time of any sweep before V232. Sweep counts for V200–V205 beyond what the record states.
- Whether the V209–V215 era replay ran the gates or only checked anchors.
- Tests-only passes that ran sabotage (Post-V199 M1 is the only one recorded).
- Which gate v202 M10 and v195 M12 name was not printed (only whether the named gate changed).
- The full sweep itself was not re-run.
