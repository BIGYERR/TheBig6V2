# V232 session calls (P-RUNWHEEL)

1. Session start: ia-version 231, handoff header V231, digest line present, HEAD 5d9354b == origin/main, tag V231.
   Working tree: handoff carries the uncommitted P-RUNWHEEL §12 line (concurrent chat's edit); v212_* untracked.
2. Mario named the build: V232 P-RUNWHEEL, wheels (not typed digits) for the dosed run forms' minutes and distance; measure first.
3. Measure A (code side) and measure B (lattice) ran in parallel; returns saved as measure_code_mA.md and measure_lattice_mB.md.
4. Session decision (form): stored run_mins stays decimal minutes; the wheel converts at its own parse/format seam, so no
   reader, gate or stored log changes. Bike minutes, swim yards and the rest-day sheet are out of scope unless Mario widens it.
5. Coach spawned fresh for the ruling (D199 onward). Return saved verbatim as v232_ruling_d199_d206.md (D199-D206).
6. Session read of iaWheelInit (index.html:13678-13700) before taking the ruling to Mario: the seed lands `col.scrollTop`
   inside a rAF AFTER the scroll listener is attached, and the listener's 90 ms settle calls `_iawCommit` with no source
   check. Browsers fire `scroll` for programmatic scrollTop changes, and the `_iawRecenter` comment confirms the design
   leans on `_iawCommit`'s string dedupe to absorb them. Measure A's "iaWheelInit never writes" holds only in a harness
   whose scrollTop setter fires nothing. Consequence: a seed face that differs from the stored string commits on open on
   device. Today that is harmless (generic-form values are wheel-made, so faces match). Under D202 a plan-seeded fixed
   wheel over `''` would commit the plan on open (the day reads logged without a touch), and D203's "display-only"
   clamps (`3.456`, `100`) would rewrite on open. Ruled form (session): commits are gated on a user touch of the wheel
   (touchstart/pointerdown/wheel marks it), so seed and recentre scrolls never write. This is the mechanism for D200's
   gate and makes D203's display-only true on device; it does not change what the ruling ships, so it does not go back to
   coach. Gatekeeper's gate must use a scrollTop stub that dispatches `scroll` so the guard is actually exercised.
7. Mario's calls (AskUserQuestion, 2026-10-05): D199 H:MM:SS (recommended); D202 plan on the fixed wheel, dash on the
   free wheel (recommended); D205 runs now, bike minutes first item of the next build, swim keeps its box, rest sheet
   parked (recommended); D206 copy shipped EXCEPT "Hours first." is dropped (Mario took coach's counter): the dist-form
   free time sub-label reads `Off the watch.` only. Build named by Mario: V232.
8. Guard form revised before builder (supersedes the touch-gating mechanism in call 6; the requirement is unchanged).
   A touch gate would make every commit depend on touch-event coverage and would re-key g221 (a D179 gate whose hand-built
   pace wheel scrolls with no touch event). Instead: a SEED-FACE guard. iaWheelInit records the face it seeded
   (`_iawFormat` of the seed columns) on the wheel; `_iawCommit` returns without writing while the wheel has never settled
   on a face different from that seed face; the first settle on a different face marks the wheel moved and commits, and
   every later settle commits through the existing dedupe. Effects: open-a-day never writes on any wheel (plan seed,
   legacy lossy values, generic form); a wheel whose seed face equals its stored string behaves exactly as today (g221's
   seeded-then-moved case still commits). D202's "lands back on the planned value" commits once the athlete has rested on
   another face first; a flick that never rests elsewhere leaves `''`, which already means as planned on the fixed wheel.
9. Pre-dispatch check (CLAUDE.md rhythm 4) before slice 1: see the builder brief's header.
10. Slice 1 landed (tests/edits/v232_s1_wheel_machinery.py; index.html +33 −4, 5 hunks): `hms` kind, dec3 optional
    whole, hms parse/format, seed-face guard. Digest 2d35e8f743680cfa unchanged; builder self-check PASS 64 FAIL 0
    (36000/36000 seconds round-trip; guard 14/14; V231 negative control writes on open); g221 PASS 27 FAIL 0 SKIP 3.
    Builder notes accepted as form: hours clamp literal (650 shows 9:50:00, display only); a colon string parses its
    leading number (no stored run_mins can hold a colon: number box or decimal emitter); hours off the dash with 00:00
    commits `0.00` (doseDerived reads it as blank; same state the dist wheel already allows).
11. Slice 2 landed (tests/edits/v232_s2_run_forms.py; index.html now +58 −20 vs HEAD): plan arg on iaWheelHTML,
    plan seed in iaWheelInit, time/dist/reps_time branches wheeled and stacked with D206 copy as amended. Digest
    unchanged; self-check PASS 52 FAIL 0 (open writes nothing on 3 kinds and on 29/29 HALF_MANNY dosed run days; moved
    wheels persist and doseDerived reads them; untouched forms 60/60 byte-identical); g221 PASS 27 FAIL 0 SKIP 3; g191
    PASS 26 FAIL 0. cardioFieldHTML's two callers (buildLogHTML via openDetail :14148, setCardioSwap :14756) both call
    iaWheelInit after rendering.
12. Browser-pane preview of the stacked forms refused (navigation to the local server denied); visual check deferred
    to Mario's device after deploy. Builder's derived widths stand in: solo wheel 178.2px, 58.73px columns = generic Miles
    columns. Two empty stray files in the repo root (0 bytes, 07:49, shell-redirect debris from a measure script) removed.
13. Gatekeeper dry run saved (gatekeeper_dryrun.md): 31 gates red on the stamp alone, all 11 missing [232] era rows;
    convention (V229-V231): an unmoved row is a REFERENCE to the prior row, its comment quoting the ruling's
    does-not-change text and the value printed equal on the candidate by builder with that gate before the row.
14. Slice 4c landed: tests/gates/g232_d199_runwheel.js (9 rows; candidate PASS 9/0 incl. D-untouched after 4a's
    harness rows; V231 as candidate PASS 0 FAIL 8 SKIP 1, every behaviour row failing on behaviour conjuncts, not only the
    version) and tests/sabotage/v232_d199.json (17 mutations, anchors count==1, all trip their named row on builder's
    single-gate run). Lattice: HALF_MANNY + 12 run-goal programs, 365 dosed run days (206 time, 159 dist); reps_time by
    hand-built dose only (D204). Header citations of calls 8 and 12 match this file.
15. Slice 4a landed (tests/edits/v232_e1_era_harness_g193_g200_g219.py): six [232] reference rows (harness x3, g193,
    g200_pull, g219), every figure printed equal on candidate 03b5924d809d and V231 d7c42961ba83 before the row; the six
    named gates green plus all 23 MANNY-only reds from the dry run green (each up by exactly its dry-run FAIL count).
    Remaining: g197b HF_LEAK/B5C and g199 DELOAD_ARB/DELOAD_HINGE/E6 (slice 4b).
16. Slice 4b landed (tests/edits/v232_e2_era_g197b_g199.py): five [232] reference rows (g197b HF_LEAK, B5C; g199
    DELOAD_ARB, DELOAD_HINGE, E6), figures equal on both trees; g197b PASS 30 FAIL 0, g199 PASS 54 FAIL 0. All 11 tables
    from the dry run covered. Candidate frozen for gatekeeper: index.html sha 03b5924d809d.
17. Gatekeeper run 1 RED on g224_d185_wctoday section 1 only (saved gatekeeper_run1.md). Session decision (gate scope,
    not doctrine): section 1's five positional rows ("line 643..647") carry the V224 build's own layout premise
    (standing ruling 4), which held through V231 because no CSS landed above :643. They are scoped by a predicate to
    ia-version <= 231 and SKIP above it with the reason named; successor rows check the same claim position-free on every
    version >= 224: each of the five strings occurs exactly once in the <style> text and they are contiguous in V224's
    order (the D185 rule immediately after the `.wc-mark{…}` base, `.wc-mark-w` immediately after it). Not chosen:
    re-pointing the indices to 649-653 (standing ruling 3: a re-pointed pin looks freshly maintained and breaks on the
    next insertion) and moving hunk G's CSS below :653 (dodges the gate, leaves the landmine). `_DOSE_INPUT_STYLE`
    (now unread) is recorded debt beside `.log-row`; removal is unlicensed.
18. Slice 5 landed (tests/edits/v232_e3_g224_rekey.py): g224 section 1 positional rows scoped to <= 231 (SKIP above,
    counted in neither PASS nor FAIL), section 1b position-free successors (5 exactly-once rows + 1 contiguity row).
    Candidate PASS 29 FAIL 0 (5 SKIP); V231 as candidate PASS 34 FAIL 0; v224_d185.json 2/2 tripped on the candidate.
    Spec (a)'s note still names the 646/647 rows (now SKIP on 232; the 1b rows trip instead); spec not edited.
19. Gatekeeper run 2 GREEN (saved gatekeeper_run2.md): ALL GATES PASS 96/96; sabotage 615/4/7/0 of 626 = V231's
    documented debt exactly; v232_d199 17/17. Blast and fuzz from run 1 stand on sha 03b5924d809d.
20. Handoff folded (handoff-update): header V232, registry D206/D207, Most recent work + notes, §8 wheels rewritten, two
    §10b lessons, §11f V232 entry + V182 D1 amended marker, §12 (P-RUNWHEEL deleted; P-BIKEWHEEL, P-RESTWHEEL, V232 debt
    added), one digest line. Committed by explicit path (v212_* stay untracked).
