# M14 — V231: P-BWFALLBACK + P-FILTERLAST before-picture (V230 tree)

Measure's return, saved by the main session (V231 chat, 2026-10-03). Script `tests/measure/v231_bwfallback.js`, output
`tests/measure/v231_bwfallback.out.txt` (re-runnable: `SCR=<scratch> PART=all node …`).

```
MODE     B (before-picture). Tree V230 (ia-version 230, HEAD 71c76d8 == origin/main, working tree == HEAD:index.html).
METHOD   2,628 builds per arm × 3 arms = 7,884, 0 worker crashes. L432 432 + LBW 432 (M13's definitions verbatim);
         M13's UNKNOWN cells: U_EQ 432 (crossfit/home_full on the LBW shape), U_FL 144 (fatloss), U_PATH 288 (run_base
         cardio, run_5k event, run_half event/NRC), U_SEED 648 (every bodyweight L432/LBW cell at seeds 11 and 90210);
         UNINJ 252 (bodyweight, 7 focuses × 3 exps × lift/run_base/run_half × 2 rests × 2 seeds). Clock pinned 2026-08-24,
         cfg.seed pinned. Tag tree stamps __bw + pushes an event on every name the sweep changes; snapshot right after
         bodyweightSweep catches any later renamer. Tag neutrality 32/32 per arm; self-identity 32/32; reused VM == fresh VM
         32/32. All 8 surgery anchors count 1. Oracles: (a″) with the CAP hand table copied from g229_d193_build.js (D193);
         adjacency = calendar order (mon..sun, sun→next mon); doubles by name and by name with parentheses stripped. CF-A /
         CF-B = one line `if(_pattern(name)==='hip_ext') return '<name>';` just above the catch-all `return 'Burpees'`
         (measurement arms from Mario's two doctrine names, not a ruling). Reproduction: V230 L432 re-filter differential 22
         (18 Burpees drops + 4 Pushups re-details), LBW 16 (12 + 4), == M13.

FINDING
1. Census on V230 (_bwFallback substitutions, not _BW_SUBS). The sweep runs on equipment==='bodyweight' only (:11002);
   home_basic, crossfit, home_full: 0 substitutions.
   Every catch-all source in all 7,884 builds is ONE movement: `Banded hip thrust{hip_ext} -> Burpees{-}`, 1,684 cards
   in 343 builds, every one reaching the final card. `Single-leg glute bridge (weighted)` reaches the sweep 0 times;
   carry branch fires 0; no other source hits the catch-all.
   Other branches pattern-preserving (Pushups ← Dumbbell bench/incline/decline/floor press; Squat (slow 3s tempo) ←
   Dumbbell goblet squat; Inverted row ← Dumbbell row / KB single-arm row) except `Dumbbell incline press{vpress} ->
   Pushups{hpress}`.
   Catch-all by lattice (Main/acc):
     L432 90 (54/36): lowback/protect 18 Main + 36 acc; lowback/workaround 18; ankle/protect 18
     LBW 204 (180/24): lowback/protect 84 + 24 acc; lowback/workaround 84; ankle/protect 12
     U_FL 60 (36/24)   U_PATH 184 (128/56, incl knee/protect 8)
     U_SEED 1,146 (1,116/30; ankle/protect 264 and knee/protect 264 Mains — knee/protect absent at seed 76308)
     U_EQ 0   UNINJ 0
   "54 Main — Burpees on L432" on V230: 18 lowback/protect + 18 lowback/workaround + 18 ankle/protect. RPE above 7: 8/54,
   all ankle/protect (lowback Mains 0 above 7: the V229 clamp at :8154 already applied). Accessories 36 on lowback/protect
   (Leg superset B 24, Leg circuit 12), all `N×8 — hold RPE 7, three in the tank`.
   Own-plan verdict on the landing (applyInjuryFilter on a clone of the built day): every ankle/protect and knee/protect
   Burpees Main is a DROP (L432 18, LBW 12, U_FL 12, U_PATH 48, U_SEED 528); every lowback Burpees card is KEEP.
   (a″) on V230 (filter-lens capped, final-lens uncapped): L432 72 = 36 Main (lowback/protect 18, lowback/workaround 18)
   + 36 acc (== V229); LBW 192; U_FL 48; U_PATH 136; U_SEED 618. Main RPE above 7: 0 everywhere.
   Test-shape Burpees Mains (W6): RPE 9 rep-max test 24 (all U_SEED, ankle/protect 12, knee/protect 12); held R7 text 36
   (LBW lowback 12, U_SEED lowback 24). L432 0 (no strength focus).

2. Build-path order: per-day applyInjuryFilter in week assembly (:10947) → injectDynamicCore (:10960) → re-filter
   (:10965) → capSessionBudget (:10970) → applySwapPrefs + re-filter (:10985) → swap universe reset (:10998) →
   deconflictAdjacentDupes (:10999, own filter :7379) → bodyweightSweep (:11002) [no in-build filter after this] →
   (non-bodyweight: unloadableRxSweep / accessoryGrammarSweep :11007) → hotNextHingeClampSweep (:11009),
   preventionDoseSweep (:11011), d18LongRunDayPass (:11014), raceEveLiftPass (:11015), d189DefaultAnchorNote,
   singletonSupersetSweep (:11017).
   Post-sweep name changes: L432, LBW, U_FL, U_SEED 0. U_PATH 1,488, identical in all three arms (d18 and race-week
   removals and mobility additions: +couch stretch/+foam roll/… 156 each, −burpees 54, …). No post-sweep pass renames a
   sweep landing; no added item is flagged by the re-filter.

3. Counterfactual arms (CF-A `Single-leg glute bridge`, CF-B `Single-leg hip thrust (shoulders on bed)`):
   (a″) 0 on every lattice, both arms. Catch-all landings left 0. New-row landings 1,684, 0 lost before the final card.
   Own-plan verdict on the landing 1,684/1,684 KEEP in both arms (including the ankle/knee protect Mains V230's plan drops).
   HALF_MANNY 0ac7da6b1691a8e1 both arms (unmoved). Builds with no catch-all hip_ext substitution byte-identical to V230
   (clock and tag stripped) 2,285/2,285 both arms; builds with one differ 343/343.
   Same-day doubles, CF-A: exact-name surviving doubles 0, BUT the sweep's dedupe is per DAY (`const seen={}` :6887, filter
   :6919); first card wins, so the Main landing deletes the plan's own later `Single-leg glute bridge`. 400 non-landing
   cards LOST vs V230 (U_SEED 318, U_PATH 40, L432 18, LBW 12, U_FL 12), from Leg superset A / Leg superset B / Leg
   isolation / Leg circuit on ankle/protect and knee/protect, mostly W3/W4 thu (62 each). When the deleted card was a
   section's last item the section disappears.
   Same-day doubles, CF-B: 0 lost; 346 same-movement doubles (name minus parentheses == landing's) with `Single-leg hip
   thrust` in Leg superset A / Leg isolation / Leg circuit (L432 14, LBW 8, U_FL 8, U_SEED 316).
   Adjacent-day same name: CF-A 287 (U_SEED 167, LBW 96, U_FL 24); CF-B 0; V230 Burpees 0. deconflictAdjacentDupes runs
   before the sweep, so these are never deconflicted.
   Collateral in BOTH arms: 132 GAINED `Burpees N×10` accessories on lowback Pull days (Pull / Pull superset B; L432 36,
   LBW 24, U_FL 24, U_PATH 48). V230's Main Burpees had deduped them out via the same per-day `seen`. singletonSupersetSweep
   re-forms the superset → 86 kept cards' labels move in CF-A, 66 in CF-B (Pull → Pull superset B; Leg superset A →
   "Leg" when its partner left). So the lowback Pull day still carries a Burpees card in both arms (the lowback plan keeps
   Burpees).
   Main detail on the landing passes through verbatim in both arms (1,514-card distribution == V230's): most common 548
   `3 sets — RPE 7 (leave 3 or more in reserve), ramp up with 2–3 warmup sets, 3 min rest`; 383 `3 sets — RPE 8 (stop 2
   reps short of failure), …2–3 min rest`; 407 of 1,514 above RPE 7, all ankle/knee protect; 24 RPE 9 rep-max tests; 36
   held R7.
   Accessory detail on the landing changes: V230 `N×8 — hold RPE 7, three in the tank` (170) → `N sets — RPE 7 (leave 3 or
   more in reserve)`. The landing is not in _BW_KEEP_FIXED (:6753), so _bwSetsFromDetail (:6909) rewrites it and the
   injury cue text is lost; RPE stays 7.

4. P-FILTERLAST — post-sweep re-filter differential (L432 + LBW + U_EQ + U_FL + U_PATH + U_SEED):
                 V230   CF-A   CF-B
     cards        638     20     20
     drops        618 Burpees (L432 18, LBW 12, U_FL 12, U_PATH 48, U_SEED 528) | 0 | 0
     renames        0      0      0
     Pushups re-details 20 / 20 / 20
     new items      0      0      0
   The 20 Pushups re-details are the same in every arm: L432 4, LBW 4, U_FL 4, U_SEED 8, U_EQ 0, U_PATH 0; all
   elbow/workaround advanced, Chest volume, W3/W4 mon, `4 sets — RPE 8 (stop 2 reps short of failure)` → `4 sets — RPE 7
   (leave 3 or more in reserve)`, swept from `Dumbbell incline press`.
   Amendment 4 condition: on L432 + LBW alone both arms MEET it (exactly 8 Pushups re-details, 0 drops, 0 new items,
   HALF_MANNY unmoved). Over L432 + LBW + the UNKNOWN cells both arms read 20, not 8: as worded NOT MET; the 12 extras are
   the same class (U_FL 4, U_SEED 8; same rows, other seeds/focus). The differential cannot see either arm's collateral:
   CF-A's 400 deleted cards and both arms' 132 regained Burpees are made by the sweep's dedupe, not the filter.

5. Day cards (out file "=== (5)", V230 / CF-A / CF-B):
   ankle/protect|bodyweight|beginner|support_strength|sun,wed W3/W4 thu: V230 `Main — Burpees` (RPE 7 ~3, warmups, 2–3 min)
     + `Leg superset A: Single-leg glute bridge` + `Leg isolation: Single-leg hip thrust`. CF-A: `Main — Single-leg glute
     bridge` and the Leg superset A section is gone. CF-B: `Main — Single-leg hip thrust (shoulders on bed)` beside `Leg
     isolation: Single-leg hip thrust`.
   ankle/protect|bodyweight|intermediate|balanced|sat,sun: W3/W4 thu is Push (light), identical all arms; its Burpees Main
     is on W3/W4 wed with the same CF-A deletion / CF-B double, at RPE 8.
   lowback/protect|bodyweight|beginner|support_strength: W3/W4 thu `Leg superset B: Burpees 2×8 — hold RPE 7, three in the
     tank` → landing at `2 sets — RPE 7`; W1/W2 tue `Main — Burpees` → landing and `Burpees 2×10` appears in a new `Pull
     superset B`.
   lowback/workaround W1/W2 tue: same, `Pull: Burpees 2×10` appears.

ROOT     _bwFallback (:6528–6537) has no hip_ext row, so `Banded hip thrust` (matched by \bband in _BW_GEAR :6527) reaches
         `return 'Burpees'`. Writers of `Banded hip thrust` on non-barbell tiers: injury pool overrides :8492, :8590, :8601,
         :8639, :8640, :8706 (lowback, ankle, knee plans). Readers of the sweep landing: label sync (:6905–6906);
         _BW_KEEP_FIXED / _bwSetsFromDetail (:6753, :6909); the per-day dedupe `seen` (:6887, :6919), which picks which
         same-named card dies; singletonSupersetSweep (:11017); d18LongRunDayPass hinge/hip_ext strip (:11134, 0 landings
         stripped here); the boot re-filter (:10361, _dayPlanCfg) and tap filter (:14350) — M13's Burpees drops.
SPREAD   per-day dedupe → CF-A 400 deletions, both arms' 132 regained Burpees; _bwSetsFromDetail → all 170 accessory
         details; Main detail passes through → 407 Main landings above RPE 7 on ankle/knee protect; adjacency CF-A 287.
         Pre-sweep readers judged the SOURCE pattern (hip_ext): filter clamp :8154, _isPostChain last-post-chain guards
         :10714 and :10865. On V230 the day's protected hip_ext prints as Burpees (pattern null); under either arm the
         landing is hip_ext again.
UNKNOWN  Boot, tap, undo and overlay presentations (OV1/OV5, refreshProgram re-filter) of the CF landings not run (fixture
         build only). Seeds beyond 76308/11/90210; minimal tier and _travel bodyweight; primaryPath 'both'. D195 P-HIPEXT's
         pool content not in this brief: its effect on these W3/W4 thu hip_ext cards and on the CF-A deletions is
         unmeasured. Same-movement doubles judged by stripping parentheses only; other hip_ext overlaps on landing days
         listed at [E4] (CF-A 568, CF-B 618 days with another hip_ext card), not classified. Whether either arm, or a dedupe
         change, is the fix is coach's call.
```
