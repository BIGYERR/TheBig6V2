# M15 — V231: D195 P-HIPEXT re-printed on V230, with its P-BWFALLBACK and injury overlap

Measure's return, saved by the main session (V231 chat, 2026-10-03). Script `tests/measure/v231_hipext.js`, output
`tests/measure/v231_hipext.out.txt` (PARTs prep, work, single, report, probe, drift).

**Headline (measure):** the ruling's main premise for A did not survive. With A on, the D4 calf line leaves 9 of 12
HALF_MANNY Tuesdays, with or without B, and on the V228 tree the ruling was written on too. `capRegionalFatigue` removes it,
and the ruling never printed that pass. Standing ruling 7: back to coach before builder.

```
MODE     B (before-picture). D195 P-HIPEXT re-printed on V230, with its overlap with P-BWFALLBACK and the injury plans.
METHOD   Copies from V230: HOOK (V230 + logging hooks that fire only when a global is set), B, A, AB (A then B); A also on
         V228 (git show 2c1a89c). Every anchor count 1. Neutrality: HOOK == pristine 67/67 progDigests; baseline == itself
         67/67 in prep and 718/718 spot rebuilds; IFW wrapper on == off 64/64; HALF_MANNY 0ac7da6b1691a8e1 on pristine and
         HOOK. Lattice 3,888 configs, 0 crashes: FULL 3,024 (v228's D lattice verbatim: 7 foci × 3 families × 6 tiers × 3 exp
         × 4 seeds × 2 rest patterns); L432 432 and LBW 432 (verbatim from v230_postsweep_reject.js, cfg.injury set directly).
         Oracles: the v228 hand C1–C5 name classifier (never _pattern); section labels the builder writes; recovery weeks =
         weeks where the __DELOAD_OFF build differs; pass attribution by ablation (__REGIONAL_OFF, __BUDGET_OFF,
         __DELOAD_OFF).

0. DRIFT V228 → V230
   Unmoved: HALF_MANNY W6 Tue before-card identical to the ruling (budget view 17.5/20). Legs site on the v228 lattice
   (FULL, sun/wed, 1,512 builds): C1 printed 3,551/6,298, budget-off 4,969/6,298, all names 5,553/10,260 (== v228).
   support_prevention C1 0/360 on the five loaded tiers. PRT Tue budget views W1 24.5, W2 25.5, W3 23, W5 23, W6 23, W7 24,
   W9 25.5 vs cap 20; W4 17, W8 18; PRT hip-extension draws unchanged.
   The ruling's "bodyweight 34/72" is a MISREAD, not drift: v228's three family cells are 16 + 18 + 18 = 52/72; V230 52/72.
   Locations on V230: preventionSupport :8203; hipExtPool :8490; hipExtBW :8496 (reader `pick(hipExtBW` :9471);
   HIP-EXTENSION RESERVATION / _left :8729 / :8743; ex.hipExt draw (_slot) :8865; hipExt:hipExtSel :8935; prevention branch
   (never reads ex.hipExt) :9281; circuit push :9291; non-prevention reader `if(ex.hipExt)` :9322; recoveryDeload :10469;
   SESSION_SET_BUDGET :10570; capSessionBudget :10571; _isHalf :10576; _cost (_isHalf's only reader) :10577;
   capRegionalFatigue :10729; pass order :10947; budget caller :10970; bodyweightSweep call :11002.

1. A on the 432 FULL prevention builds (3,420 leg days)
   Item lands: A alone gained on 2,788/3,420 leg days; A+B 2,976/3,420. Builds with ≥1 C1 item 0/72 → 72/72 on each of the
   five loaded tiers; bodyweight 52/72 → 62/72. A changes 0 programs outside support_prevention (0/3,312).
   Carry lost: 0/3,420, both arms.
   D4 calf line lost: 1,745 days A alone, 1,898 A+B. A+B: all 1,898 restored with capRegionalFatigue off. A alone: 1,161
   restored by regional off; the other 584 come back under neither single ablation (each pass removes the calf when the
   other is off).
   A also takes from non-runner prevention leg days: the `Calves` section 732 times, `Leg isolation` 120 times, plus 152
   `Wall sit` items swapped into Leg isolation — capRegionalFatigue again.
   HALF_MANNY Tue calf line W1–W12:
     V230              YYY-YYY-YYY-
     A                 ------------
     AB                ------------
     A, regional off   YYY-YYY-YYY-
     V228 + A          ------------
   The ruling's after-card ("everything else identical; carry stays", "displaces nothing") is false in 9 of 12 weeks. The
   carry does stay. A's budget view equals V's (19.5, 17.5, …) because the 2 calf sets leave before the budget sees the day.
   Bodyweight hinge == hipExt omissions: 96 (all bodyweight, uninjured, beginner or intermediate, `Single-leg glute bridge`).
   capRegionalFatigue removing the new item itself: 271 days A alone (all bodyweight); 392 A+B.
   Budget removing the new item: 188 A alone (37 or 40 per loaded tier); 0 A+B.
   Recovery weeks: recoveryDeload reaches the fourth item 0 times; item present on 283/324 recovery leg days A alone,
   318/324 A+B.

2. B on the full lattice (149,148 day cells)
   11,934 cells change in 2,028/3,888 programs. Removals 0. Added 16,053 items, every one present in V230's __BUDGET_OFF
   build (0 new). 14 detail changes, all `Landmine rotational press` 3×15 → 2×15 on loaded prevention W3 Push days (B keeps
   the superset today's budget collapses; == the budget-off card). C1 printed at the legs site: 4,715/6,298 (v228 lattice),
   9,244/13,692 (full lattice). Most-restored: Farmer carry 2,131, Suitcase carry 1,876, TKE 1,663, Spanish squat hold
   1,570, Wall sit 1,262, Barbell hip thrust 788.

3. PRT W9 Mon after B: budget view 22 → 20.5 vs cap 17; `Conditioning :: Burpees 3×12` comes back; no core item comes back.
   PRT W9 Tue after B == the ruling's after-card exactly, at 20 = cap. PRT day cells changed 9/77.

4. Printed string for the new item: crossfit/commercial/home_full `Single-leg hip thrust 2×6–10 each @ RPE 7` (beginners
   `@ RPE 6–7`; hip/workaround held `2×8 each — hold RPE 7, three in the tank`). minimal/home_basic: `Single-leg glute bridge
   (weighted) 2×6–10 each @ RPE 7`; `Banded hip thrust 2 sets — RPE 7 (leave 3 or more in reserve)` (no-load wording).
   bodyweight: `… 2 sets — RPE 7 (leave 3 or more in reserve)`.

5. HALF_MANNY digests: V230 0ac7da6b1691a8e1; B 0ac7da6b1691a8e1 (weeks byte-identical; raw JSON differs only in id and
   created, which also differ between two V230 builds); A = A+B = 14aacbced1c527d7; A on V228 the same digest. 12/12 Tue
   W1–W12 change, W13–W14 identical. All cards for V, B, A, A+B in the out file, PART=single §0c.

6. P-BWFALLBACK overlap: bodyweightSweep ran on 828/828 bodyweight builds, 0/3,060 others; its only gate is
   cfg.equipment==='bodyweight' (:11002). Overlays reach it only through a substitute overlay whose patch sets the equipment
   (:15826–15827), which applyOverlays (:15359) builds into a variant (read in source, not built).
   Today's sweep on the five A names: `Single-leg hip thrust` kept; `Single-leg glute bridge` kept; `Single-leg hip thrust
   (shoulders on bed)` kept; `Banded hip thrust` _BW_GEAR hit (band) → Burpees; `Single-leg glute bridge (weighted)`
   _BW_GEAR hit (weighted) → Burpees. The two Burpees names only come from the minimal/home_basic pools, which the sweep
   never touches. Result: the new item seen before the sweep on 119 days; landed on Burpees or any fallback name 0 times,
   every tier, region, overlay, week. No other circuit item renamed by the sweep on prevention leg days.
   Same-day doubles: exact-name 0. Two C1 items same day: 26 with A alone, all bodyweight, `Single-leg hip thrust (shoulders
   on bed)` next to the circuit hinge `Single-leg glute bridge` (24 uninjured, 2 ankle/workaround); same before and after
   the sweep.

7. Injury plans on L432 prevention (144 builds, 864 leg days, no run):
     lowback/protect    0/72  never built: the reservation (:8743) empties A's all-C1 pool, pick null
     lowback/workaround 0/72  same
     ankle/protect      0/72  same
     hip/protect        0/72  plan replaces the pool after A with a back extension; built on 54, filter drops 54/54; bw null 18
     hip/workaround    54/72  filter re-details 54/54 to the hold wording; bw null 18
     knee/protect       0/72  reservation fallback gives `Bodyweight back extension` (not C1); built on 30, capRegionalFatigue
                              removes it (seen in the regional-off card); null 42
     ankle/workaround  72/72  kept
     knee/workaround, shoulder ×2, elbow ×2: 62/72 each (10 bodyweight picks not on the card)
   No plan renames the item. B on the injured lattices: L432 43/12,960 cells, LBW 206/12,960; removals 0; added 43 and 220,
   all present in the budget-off build.

ROOT     A's displacement: the leg-region cap in capRegionalFatigue (:10729) counts the new 2 sets against the legs region;
         that pass runs before the budget (:10947, then :10970), so it trims the calf section first. On the V228 file the
         ruling worked out the displacement from budget arithmetic only. B's write site and reader: _cost (:10577) is the
         only reader of _isHalf (:10576); B prices 9 more members at half (monster walks, band abduction, hip airplane,
         seated band hip flexion, TKE, tibialis raise, banded dorsiflexion, soleus raise, ankle CARs).
SPREAD   Other readers of the hip-extension pool: non-prevention Leg superset B (:9322); `pick(hipExtBW` full-body day
         (:9471); full-body _rdl pick from hingePool + hipExtPool (:9436); the injury-block rewrites (knee/protect,
         hip/protect, lowback/protect), all after A's filter; the reservation (:8743), which drops A's item on 3 plans. A
         changes nothing outside prevention, so none of these show a diff.
UNKNOWN  Overlay variants not built (no substitute-to-bodyweight overlay, no injury overlay on stored programs; only
         cfg.injury builds). Calf displacement not cut by family × experience beyond tier and week rows. A's item as its own
         section after the calf (the ruling's named fallback shape) not measured — shape question for coach. The parallel
         P-BWFALLBACK measure not read. Whether to amend A for the capRegionalFatigue displacement is coach's call.
```
