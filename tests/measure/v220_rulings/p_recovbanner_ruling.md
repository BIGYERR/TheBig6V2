# P-RECOVBANNER (2026-09-23) — The week view stops explaining the placement; the placement stays

Provisional code; real D-code assigned at builder dispatch (registry said next free D153 at ruling time).
Persisted by the orchestrator from coach's return (coach is read-only).
Mario: "is this necessary? I'd vote to remove it honestly, it's just explaining what the engine should be doing."

## Summary
- **Mario's call 1: remove the banner.** Coach concurs, on measured grounds: on Mario's screenshot config the "same-region" sentence sits over Back squat Monday and Sumo deadlift Tuesday (the region pass is press-only, V30 `regionOf`), so it promises what the engine does not do; on bike programs it says "your hardest runs" to a rider (90/90 bike shows); on HALF_MANNY it says "Your hinge day rides a speed session" in race week, where the trap bar primer rides a Recovery Run. A week-1 claim printed on 14 weeks is the §10b latch in copy.
- **Mario's call 2 (build):** ride with P-EMOJI's chrome build, this slice first (both zero-engine).
- **Session's (recorded, not asked):** `legRecoveryNote` stays as an engine trace (gates and 6 sabotage rows key on it; standing ruling 3 keep-and-wire); g205 P4b/P4c get a source predicate, not a version number; P-EMOJI's ♻️ row and its sabotage (1) struck (counts 16→15, 25→24); no text survives; D109a's note sub-item closes moot.
- **Measure needed:** none for the ruling. For dispatch: index.html moved 12 lines between coach's two reads (concurrent V210 edits); builder anchors on text.

## 0. Premise checks
- HEAD 3b98a0c = V209; measured on scratchpad `base.html` (ia-version 209). Measure's numbers (`tests/measure/v220_recovery_banner.js`) reproduced: 2,970 builds, 0 crash, banner on 2,190 (73.7%). NRC race 1,080/1,080, NSW test 810/810, run_base 210/270, bike 90/270, swim 0/270, lift-only 0/270. Mario's exact text on 18/2,970, all bike + support_prevention + sun/wed.
- `progDigest` does not read `legRecoveryNote`. HALF_MANNY digest 0ac7da6b1691a8e1 unaffected.
- No day-reorder feature exists (0 hits: moveDay( / reorderDay / swapDay / dragDay).
- Readers of the field (13 occurrences): engine sources :7003 :7026 :7055 :7196 :7220, join :7662-7666, plan read :10523, program write :10656 (`_liftDay ? legRecoveryNote : null`), render :11814-11815 (only screen). Comment-stripped: `Recovery spacing` 1, `activeProg.legRecoveryNote` 2, `♻` 1.

## 1. Before (HEAD V209)
HALF_MANNY, every week carries: "♻️ Recovery spacing: Your hinge day rides a speed session so hard days stay hard. Nothing heavy lands the day before your long run." W14 thu main is "Trap bar deadlift 2×12 — RPE 5–6 (primer…)" riding a Recovery Run, contradicting the banner.
Mario's screenshot config (bike_base, support_prevention, sun/wed, seed 24865): W1 mon Back squat [LSD], tue Sumo deadlift; banner claims same-region spacing.

## 2. Ruling: the banner goes. Nothing else on the athlete's screen changes.
(a) Hard days hard and the run is the day are things the week SHOWS. If the athlete cannot see it, the grid is the defect, not the missing caption.
(b) One week's claim printed on every week; contradicts W14's card. §10b latch in copy.
(c) Bike: "hardest runs" to a non-runner. Mario's week: promises same-region spacing the press-only region pass does not do.
(d) The why matters only at a decision; the week view has none. The RPE 7 cap is already the number on the card. The "add a rest day" advice fires on 36/2,970, all bike layouts already carrying three rest days.
(e) If Mario ever wants a why: once, in the plan overview at creation. Not ruled here.

## 3. What changes (index.html, 2 edits, anchors by text, each grep -c == 1)
E1 delete the block: `// ── leg-recovery note (kept) ──` / `let leg='';` / `if(activeProg.legRecoveryNote){ leg='<div …♻️ <b …>Recovery spacing:</b> '+activeProg.legRecoveryNote+'</div>'; }`
E2 `list.innerHTML=strip+hero+_wcTag+stats+leg;` → `list.innerHTML=strip+hero+_wcTag+stats;`

## 4. What does NOT change
Placement functions (`nrcLegLiftPlacement`, `deconflictLegLiftDays`, `deconflictSameRegion`), the join, the `_liftDay` guard. Zero days move. The field on the program and in `ia_programs` (engine trace, ~200 bytes; no migration). The six source strings byte-identical (no longer athlete copy; D109a tier-string sub-item MOOT; re-rule and de-dash before any return to a screen). HALF_MANNY digest; no era row.

## 5. The field stays (standing ruling 3)
Wired pin: g205 P3a/P3b/P3c/P3d/P4a, g208 R2/R3/R8a, sabotage v205 M9 and v208 M1–M5 key on it as the placement's branch signature. Re-keying onto grid predicates is a separate tests pass (§12 debt: "legRecoveryNote is a trace named like copy; re-key g205 P3/P4a and g208 R2/R3/R8a onto placement predicates, then retire the field").
P4b/P4c go vacuous; licence as a source predicate (standing ruling 2):
    const ON_SCREEN = /activeProg\.legRecoveryNote/.test(commentStrippedInlineJS);
    P4b/P4c run when ON_SCREEN, else skip('P4b/P4c the note left the week view (P-RECOVBANNER); the string is an engine trace').
P4a keeps running. g208 untouched (R8a "prints" now means "carries", label only). v205 M9 and v208 M1–M5 unchanged.

## 6. New gate and sabotage (builder names at dispatch; ERA = the build's own ia-version)
G-RECOVBANNER, oracle = comment-stripped inline JS:
  B1 `Recovery spacing` count 0 (today 1); B2 `activeProg.legRecoveryNote` count 0 (today 2); B3 `♻` count 0 (today 1); B4 buildProgram(HALF_MANNY).legRecoveryNote === the hand-typed D36 string. PASS n FAIL n; RED on V209, GREEN on the build.
Sabotage: S1 re-append the banner div → B1/B2. S2 `legRecoveryNote:null` → B4 plus g205 P3a/P4a and g208 R2. S3 re-insert `♻️` in the wk-stats block → B3 (and P-EMOJI's gate once built).

## 7. P-EMOJI: the ♻️ edit is VOID
Strike P-EMOJI §4 row "Week-view recovery banner", §6 sabotage (1) "re-insert ♻️ at the recovery banner", §8 "Week view: programs carrying a legRecoveryNote". Counts 16→15 and 25→24. P-RECOVBANNER slice ships before P-EMOJI's chrome slice in the same build.

## 8. Copy
No athlete-facing text survives.

## 9. Blast radius
Week view loses the banner on 2,190/2,970 builds (all NRC race incl. HALF_MANNY, all NSW test, run_base 210/270, bike 90/270). Grid, cards, engine output, storage: 0 change (gatekeeper asserts 2,970-build grid identity). Tests: g205 P4b/P4c source predicate; one new gate; three probes; P-EMOJI amended per §7.

**Recommendation:** delete the two render lines, keep the field as the gates' branch marker with a source predicate on P4b/P4c, void P-EMOJI's ♻️ row, ship in the same build as P-EMOJI's chrome slice.
**Counter:** the tier-2/3 line "hinge work the day before a hard run is capped at RPE 7 automatically" is the only sentence telling a tightly packed athlete WHY his deadlift reads RPE 7; if Mario wants that kept, it belongs on that hinge card on that day (separate small ruling), never back on the week view.

## MARIO DECISION
- Remove: Mario's own vote (2026-09-23), coach concurs. Ship slot: HOLD with the batch.
