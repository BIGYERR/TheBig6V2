# M12 — V230 before-picture: D194 part 2 (the lens alone) on the overlay presentation, CF6 = V229 + the four site edits

Measure's return, saved by the main session (V230 chat, 2026-10-03). Script `tests/measure/v230_lens_cf6.js`, output
`tests/measure/v230_lens_cf6.out.txt` (626 lines, 0 CRASH). Scratch trees (cf6.html = V229 + the four site edits) under the
V230 session scratchpad `measure/v230/`.

**First line of the return:** Both premises of R3′ hold. The four-site surgery is the whole change. CF6's overlay
presentation equals the fixture on every row and route measured, with 0 differences. Every printed figure matches D193
Amendments 2 to 4 and D194 Amendment 1. Nothing in this pass refutes the ruling.

```
MODE     B (before-picture)
METHOD   tests/measure/v230_lens_cf6.js, output in tests/measure/v230_lens_cf6.out.txt (626 lines, 0 CRASH)
         Lattice: the D190 chain lattice (18,580 chains on 7 injured L9 configs; W5 13,323, W3 5,257), modes S, R and U;
           L9 single-hop pairs (e) 210 and (e′) 114; the g221 D177 L1 sweep (150,068 swap pairs on 384 configs);
           mario W5 thu hand routes; the knee/wa strength W6 thu test; 13 gate files on 3 trees.
         Trees: V229 = HEAD 0bec3ec (sha d854af0a91f8, equals the working index.html). CF6 = V229 + 4 site edits.
           CF6S22 = CF6 + the S22 mutation. CF6_230 = CF6 with ia-version stamped 230.
         Presentations:
           CFG  = fixture, cfg.injury stored, clock 2026-09-24.
           OV5  = app writer applyInjuryDraft from W5 Monday, clock W5 Thursday. This is the ruling's and (q)'s state.
           OV1  = applyInjuryDraft from W1 Monday, clock W1 Monday. Every week is spliced, because the freeze pierces only
                  weeks at or after the current week.
           CFG1 = fixture at the W1 clock.
           STAMP = applyOverlays' output shape built synthetically for the g221 sweep.
         Instrument checks (all PASS):
           every stored record equals itself in two VMs;
           an OV1 day equals the fixture day with the stamp removed, every week (sampled on 3 configs);
           STAMP equals the real writer, 294/294 days;
           V229 CFG == CF6 CFG, 18,580/18,580 chains and 150,068/150,068 g221 rows;
           CFG == CFG1, 18,580/18,580.
         Oracles: the fixture column on the same tree (the ruling's stated expected answer); the hand CAP table, hand
           hold, hand stripper and hand RPE parse (copied from v229_caprpe_cf3.js); V228 and V227 g221 rows from the
           V229-chat scratch; the ruled R7 and R8 strings. Nothing asks _dayPlanCfg or applyInjuryFilter for the answer.
FINDING  Overlay == fixture on CF6: 0 differences on every row below. V229's overlay differs on 100% of the lattice.
ROOT     The four sites (V229 line numbers), each anchor count==1. diff V229→CF6 is 4 hunks / 8 lines and nothing else:
           :10358 applySessionSwaps guard        `if(hit && prog.cfg && prog.cfg.injury){`        → `_dayPlanCfg(prog,day).injury`
           :10361 applySessionSwaps filter cfg   `applyInjuryFilter(day.sections,prog.cfg)`        → `_dayPlanCfg(prog,day)`
           :14347 applySwapChoice guard          `if(activeProg&&activeProg.cfg&&activeProg.cfg.injury){` → `_dayPlanCfg(activeProg,day).injury`
           :14350 applySwapChoice filter cfg     `applyInjuryFilter([...],activeProg.cfg)`         → `_dayPlanCfg(activeProg,day)`
         `_dayPlanCfg(prog,day)` is at :9991. It returns prog.cfg (the same object) unless dayOverlayInfo(day).patch has
           an own `injury` key; then it returns Object.assign({}, prog.cfg, {injury: patch.injury}). It reads the
           `_ovKey` stamp that applyOverlays writes. Callers today: :9863 auxSwapCandidates, :10015 addCandidates,
           :10103 swapCandidates.
         HALF_MANNY: V229 0ac7da6b1691a8e1, CF6 0ac7da6b1691a8e1 (twice), CF6S22 0ac7da6b1691a8e1. Unmoved.
SPREAD   Every `.injury` token in V229 is outside `buildProgram`'s own body: 34 of 34, comments stripped, untruncated.
         `buildProgram` spans only :11244–11252, a thin wrapper, so the engine functions are classified as build path.
           In the four sites:   :10358, :14347 (guards). The two filter cfgs, :10361 and :14350, are the only
                                outside-engine callers that pass prog.cfg or activeProg.cfg to applyInjuryFilter.
           Already on the lens: :9871 auxSwapCandidates (_powerAllowed on the local cfg from _dayPlanCfg); :9995 is
                                _dayPlanCfg's own read.
           Helpers (the caller passes cfg):
             :7951 injuryPlan. Outside the engine its callers pass applyInjuryFilter's cfg (so the four sites decide),
                   a typed literal in paceShiftMap :15319, or literals in imBackFromInjury :15740–15741.
             :10000 _swapInjuryOK. All 3 sheet callers (9873, 10029, 10116) pass the lens cfg; the 4th (7354) is
                   deconflictAdjacentDupes, which is build path.
             :8088 _injViewName. All 12 callers are inside engineC_kinematics.
           Build path, on no tap/boot/undo/reboot route by static reachability: :7375 deconflictAdjacentDupes;
             :8566, :8991 ×2, :9382 ×2, :9502, :9530 engineC_kinematics; :10965, :10984 engineD_synthesis.
           Other (they read the overlay list `ov.patch.injury`, not cfg.injury):
             renderWeekView :11985, :11986, :12028. These gate the week pill and the "HURT?" button label, at week level
               from activeProg.overlays. They sit on the tap and undo route through openDetail>handleDayStatus>
               renderWeekView. That route was not driven: the harness stubs openDetail and renderWeekView.
             paceShiftMap :15316–15319 (run pace shift, reboot route).
             refreshProgram :16013 (the freeze-pierce week ranges).
             renderOverlayChip :15487–15511, _liveInjuryOverlay :15581, imBackFromInjury :15730–15731,
               openInjurySheet :15567 (chips and sheets).
           Possible fifth site: none among cfg.injury readers. The renderWeekView reads are the only "other" readers on
           the tap/undo route. They decide no card, dose or toast, but I flag them as instructed.

[1] Sites: printed above. All four lines read prog.cfg / activeProg.cfg. On an overlay program that injury is null
    (printed: activeProg.cfg.injury null, W5 thu stamped ["injury",{"injury":{"region":"knee","tier":"workaround"}}]).

[3] D193 live rows. Each row shows V229 OV | CF6 OV | CF6 fixture.
  (i)    18,580 chains, OV1 vs CFG1:
           live != boot     487 | 487 | 487 (same ids: both 487, 0 only-one-side)
           kept _preHold    0 | 18,580 | 18,580
           ph in record     0 | 35,949 | 35,949
           hold toasts      0 | 39,203 | 39,203
           booted slot carries _preHold   0 | 18,580 | 18,580
           live end on a capped pattern above RPE 7   12,518 | 0 | 0
         W5 on OV5: residue 330 | 330 | 330, capped above 7 8,489 | 0 | 0.
  (i-r)  live==boot==in-session end 18,093 | 18,093 | 18,093 of 18,580.
         Rebooted slot carries the kept dose 0 | 18,580 | 18,580.
         R-mode OV1 vs CFG1 equivalence: 0 of 18,580 differ.
         W5 OV5: 12,993 of 13,323 on all three; kept dose 0 | 13,323 | 13,323.
  (i-u)  11,096 chains.
           live==boot      11,096 on all three
           live==direct    5,228 on all three (complement 5,868 = V222 note (3) INFO, as ruled)
           undone card carries the kept dose   0 | 11,096 | 11,096
         U-mode equivalence: 0 of 11,096 differ. W5 OV5: 8,269 chains, the same shape.
  (e)    210 pairs on all three.
           live bwsets RPE 8   196 | 0 | 0
           RPE 7               0 | 196 | 196
           cue ends            0 | 14 | 14
           live==boot          210 on all three
           (k″) hold toast on the 196 bwsets ends   0 | 196 | 196
           "Same job, same numbers."                14 on all three
         CF6 OV1 == CF6 CFG1 210/210 (live, toast, boot, _preHold). OV5 subset (W≥5): 72/72.
         Example of what moves: elbow_wa W1 tue Barbell row "2×8 — hold RPE 7, three in the tank" -> Feet-elevated inverted rows.
           V229 OV: "2 sets — RPE 8 (stop 2 reps short of failure)", toast "…No load to add here, so take the sets to the same effort."
           CF6 OV:  "2 sets — RPE 7 (leave 3 or more in reserve)", toast "…No load to add here. Your injury plan holds this one at RPE 7."
  (e′)   114 pairs. Live RPE>7 114 | 0 | 0; boot RPE>7 114 | 0 | 0; hold toasts 0 | 114 | 114.
         CF6 OV == fixture 114/114 on OV1 and on OV5.
  (k)    g221 L1 rows, 150,068 each. STAMP vs CFG on CF6: card differs 0, toast differs 0.
           CF6 STAMP and CF6 CFG: 1,243 clamp pairs, 1,243 hand hold variants (verbatim 684, unloadable 360,
             window 199), 0 false claims, 0 hold toasts off the clamp set, non-clamp toasts == V227 148,825/148,825,
             INFO capped 458.
           V229 STAMP: 0 hold variants, 1,243 false same-numbers/effort claims, INFO capped 728.
           V229 STAMP → CF6 STAMP moves 1,361 cards and 1,243 toasts. The cards are more than the toasts: they include the
             D190 cue arriving at the tap, e.g. knee/wa W5 sat Kettlebell swing -> Step-ups (KB) "2×10" →
             "2×10 — hold RPE 7, three in the tank".
  (l)    CF6 STAMP == CF6 CFG on every row: G3a 832 (529 / 199 / 104), G3c power 0, G3c-off 168, G3d 263, G3e 202, G3f 199.
         V229 STAMP: G3a 143, G3c-off 96, G3d 0, G3e 47, G3f 0.
  (j) live  R7 text 127 on CF6 STAMP and CFG, 0 on V229 STAMP. 113 R7 donors onto uncapped targets print _testRx on all.

[4] Equivalence row, S mode, CF6 overlay vs fixture. Compared on live card, _preHold, every toast, boot, undo (with
    chip), undo+boot, ph, and whole-day JSON (stamp removed) for live, boot, undo and undo+boot:
      OV1 vs CFG1, all weeks: 0 of 18,580 differ on anything (W5 0 of 13,323; W3 0 of 5,257).
        Per config, all 0: elbow_wa 8,369, shoulder_wa 3,708, lowback_wa 3,531, hip_wa 1,405, knee_protect 1,232,
        mario 320, ankle_wa 15.
      OV5 vs CFG, W5 spliced: 0 of 13,323. Unspliced W3 on OV5: V229 == CF6, 0 of 5,257 move.
      Before picture, V229 OV1 vs fixture: 18,580/18,580 differ.
        live 12,518 | boot 12,518 | undo 15,589 | undo+boot 15,053 | toasts 18,580 | _preHold and ph 18,580
        V229 OV5, W5: 13,323/13,323.
      Differing class on CF6: none.

[5] (q) on CF6 at 229: FAIL, as expected. Conjuncts that tripped: hand routes MOVED; == V228 false; sample moved 568 of
      568 W5 and 544 of 591 W3; kept 568; ph 585; hold toasts 252; booted/undone _preHold 1,112. The fixture conjunct
      still holds (keeps 568, hold toasts 252, boot keeps 568).
    (q) on CF6_230: REFUSED ("ia-version 230 is past V229; D194 part 2 must re-key this row").
    S22 (`_held` keyed on the donor as read, cue = RPE 7, else the donor's first RPE):
      (k″) loses the hold toast on 196 of 196 on OV1, and 196 of 196 on the fixture. Cards moved by S22: 0.
      Example: elbow_wa Barbell row cue → Feet-elevated inverted rows: "…No load to add here, so take the sets to the same effort."
      (k) 71 under S22 was not measured; the S22 run covered only the (e) pairs.

[6] Mario's routes. CF6 OV5 == CF6 fixture on every line. V229 OV5 prints "2×6–10 @ RPE 8" with _preHold none on
    every hop, boot, undo and direct.
      U0  CF6 OV: hop1 Barbell hip thrust "@ RPE 8" | hop2 Leg extension "2×6–10 @ RPE 7" _preHold "…@ RPE 8",
          toast "Leg extension in, barbell hip thrust out. Same sets, same reps. Your injury plan holds this one at RPE 7."
          | hop3 Barbell good mornings "@ RPE 8" | BOOT "@ RPE 8" | UNDO -> Leg extension "@ RPE 7" _preHold "@ RPE 8"
          | UNDO+BOOT the same.
      U1  undo -> Single-leg hip thrust "@ RPE 8", _preHold none, day identical true.
      U2  hop1 Leg extension "@ RPE 7" + hold toast | undo -> Leg extension "@ RPE 7" _preHold "@ RPE 8" (from ph)
          | hop3 Barbell hip thrust "@ RPE 8" == BOOT == DIRECT.
      RB  REBOOT slot Leg extension "@ RPE 7" _preHold "@ RPE 8" | hop3 GM "@ RPE 8" == BOOT == DIRECT | UNDO and
          UNDO+BOOT Leg extension "@ RPE 7".
    knee/wa strength beginner commercial, OV5, W6 thu Barbell box squat → Leg press:
      V229 TEST9 (RPE 9, "new baseline"), toast "Same job, same numbers.".
      CF6  INJ_HELD_TEST (R7 text), toast "Leg press in, barbell box squat out. Same sets, same reps. Your injury plan
           holds this one at RPE 7.", BOOT the same. Equals the fixture.
      → Barbell Romanian deadlift (uncapped) prints TEST9 + "Same job, same numbers." on both trees and both
        presentations.

[7] Gates. Every run printed a summary: 0 crashes in 39 runs.
    V229: all green (g229_d194_lens 8/0).
    CF6 at 229: all green except g229_d194_lens 7/1 (row q, above).
    CF6_230, rows that are not PASS:
      g229_d194_lens q    REFUSED (FAIL).
      g227_d190_cuecap c-MANNY      FAIL "[227]===[226], HALF_MANNY 0ac7da6b1691a8e1 != [230]".
      g228_d192_undokey d2-MANNY    FAIL "(got 0ac7da6b1691a8e1, calls 0)".
      g229_d193_build b             FAIL "MANNY [229]===[228], 0ac7da6b1691a8e1 != [230]". Its other conjuncts held:
                                    outside 1053/1053, uninjured 133/133, object row 27/27, _preHold 0.
      Root of the three MANNY fails: no MANNY_DIGEST_BY_VERSION[230] era row. The digest itself is unmoved.
      g228_d193_cueword b-ONECLASS stays REFUSED (never PASS, never FAIL), as at 229.
      g222_d181_chain 5L licence REFUSED above 226, residue 0, row PASS (same at 229).
      Everything else in g221 ×4, g222 ×2, g227 ×3 and g228 ×2 PASSES at 230, apart from the SKIP pair rows scoped
      to earlier builds.

[8] P-OVSTACK: not exercised. Every stored program in this lattice carries exactly 1 overlay, so 0 stacked-overlay days
    were measured. The count V229 vs CF6 is unknown, not zero.

UNKNOWN  - The rendered card and sheet DOM after a tap: openDetail and renderWeekView are stubbed, so the renderWeekView
           overlay readers (:11985–12028) were not driven.
         - The (e) exSwapPrefs build half: build path, not one of the four sites.
         - (k) 71 under S22.
         - Stacked overlays (P-OVSTACK) and the travel-equipment question: not run, per brief.
         - Trained/hist-restored days and removeOverlay after a swap (D181 R5 route), bridge and halfstep overlays:
           not driven on CF6.
         - Seeds other than 76308.
         - OV1 uses the W1 clock. Every check printed equal (CFG == CFG1 18,580/18,580), but a clock-dependent effect on
           any other path is not excluded.
```
