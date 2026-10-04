# M13 — V230: the post-sweep reject class (gatekeeper finding 1b, the Burpees boot drop)

Measure's return, saved by the main session (V230 chat, 2026-10-03). Script `tests/measure/v230_postsweep_reject.js`, output
`tests/measure/v230_postsweep_reject.out.txt`. Gatekeeper's reproducer: `tests/measure/v230_gk_burpees_bootdrop.js`.

**First line of the return:** No. Across every non-reject day swapped, V230 produced no boot != live on an overlay program:
0/4,198 on L432 OV1, 0/4,248 on LBW OV1, 0/3,506 on LBW OV5 and 0/11 plus 0/8 on Mario. Every V230 overlay boot != live
found is in the post-sweep-reject class: 88/88 swaps on L432 and 62/62 on LBW.

```
MODE     B (before-picture). Gatekeeper's repro reproduced at its exact cell (ankle/protect|bodyweight|intermediate|balanced|
         sat,sun): V229 OV boot == live, V230 OV boot != live, 8 of 14 swaps on that build dropping.
REPRO    seed 76308, clock pinned (OV1 and FIX 2026-08-24; OV5 2026-09-24). Overlay written by applyInjuryDraft (_ovDraft.from
         2026-08-24 for OV1, 2026-09-21 for OV5), overlay id and created pinned. FIX = cfg.injury stored. V229 = base_v229.html
         (sha d854af0a…, == git 0bec3ec). V230 = working index.html (sha 72ac41c8d34034ce). Baseline equals itself 6/6. Tag tree
         equals V230 once __bw is stripped, 6/6.
METHOD   Lattices: L432 (g229 grid(): 6 regions × 2 tiers × {commercial, crossfit, home_full, bodyweight} × 3 experience × 3
         support focuses, Mario's base config, rest sun,wed); LBW (432: 6 × 2 × {bodyweight, home_basic} × 3 experience ×
         {balanced, strength, hypertrophy} × {sun,wed | sat,sun}); MARIO (knee/workaround, M12's config). 865 configs × V229/V230
         × OV1/FIX, plus OV5 on LBW and Mario, plus a TAG230 fixture pass: 5,191 cell runs, 0 crashes, 12,960 lifting days per
         lattice.
         Reject = a card that applyInjuryFilter, re-applied to a clone of the built day with the config's own injury (never read
         through _dayPlanCfg), drops, renames or re-details; matched by positional tag. Source by surgery: bodyweightSweep (:6900)
         stamps __bw on every name it changes; a hook just before the bodyweightSweep call (:11003) measures the reject set there.
         Reach: one round per non-reject card on every reject day (one swap of an OTHER card), then boot, reboot from the boot,
         undo every swap, boot after undo. Control round: one swap on up to 12 non-reject days per build. Boot oracle: the live
         day with the reject names removed or renamed, by hand.
FINDING
1. Population (identical V229 / V230; identical OV1 / FIX, 22/22 and 16/16 set equality with the tag fixture):
   L432: 22 rejects on 22 of 12,960 lifting days, in 11 of 432 builds.
     18 drops of `Burpees`: all ankle/protect, bodyweight; adv 6, beg 6, int 6; every one the sole item of `Main — Burpees`;
        W3 9 and W4 9, all thu.
     4 re-details of `Pushups (slow 3s eccentric)`: elbow/workaround, bodyweight, advanced only; sole item of `Chest volume`,
        W3 and W4 mon; "4 sets — RPE 8 (stop 2 reps short of failure)" → "4 sets — RPE 7 (leave 3 or more in reserve)".
     Segments: support_strength 8, support_athletic 8, support_prevention 6. commercial, crossfit, home_full: 0.
   LBW: 16 rejects on 16 of 12,960 days, in 8 of 432 builds. 12 Burpees drops (ankle/protect, balanced only; W3/W4, thu 6,
     wed 6); 4 Pushups re-details (elbow/workaround, advanced, balanced). strength, hypertrophy, home_basic: 0.
   OV5 (pierces W5+): 0 over 4,320 pierced days. The class lives only in W3 and W4.
   Lowback: 0 rejects (Burpees survive both lowback plans).
   Source: 38/38 carry a _bwFallback stamp. All 30 Burpees came from `Banded hip thrust` through the catch-all
     `return 'Burpees'` (:6537). All 8 Pushups came from `Dumbbell incline press` via the `/press|pushup|dip/` branch (:6530),
     not the catch-all.
   Before the sweep the hook counts 54 (L432) / 108 (LBW) rejects, all shoulder/workaround `Dumbbell bench press` renames on
     mon; the sweep renames them, none survives to the athlete. 0 new items from any refilter.
2. Reach (swaps that landed; 56/144 and 38/100 skipped, no candidate):
   L432 V229 OV1 boot != live 0/88 | V230 OV1 88/88 (70 by name, 18 by Pushups detail only); boot == hand oracle 88/88 |
     V229 FIX and V230 FIX 88/88 each.
   LBW V229 OV1 0/62 | V230 OV1 62/62 (44 by name, 18 by detail) | FIX 62/62 on both.
   By day: every reject day drops on every landed swap (L432: 4/4 ×18, 3/3 ×2, 5/5 ×2; 22 of 22 days).
   Reboot with no new tap == the first boot 88/88 and 62/62: the drop persists.
   Undo: 0 errors; live after undo == the built day 88/88; undo+boot == undo-live 88/88 with the built names: undo brings
     Burpees back.
   Without any tap the booted program keeps every reject.
   What the athlete sees: no empty section anywhere. For the 70 Burpees drops the Main section vanishes (Main count 1 → 0) and
     the day opens on `Leg superset A`. Example (ankle/protect|bodyweight|beginner|support_strength|sun,wed W3 thu, swap
     Single-leg glute bridge → Nordic hamstring curl (anchored)): live `Main — Burpees | Leg superset A: Nordic… | Knee
     stability | Leg superset B | Leg isolation | Hip stability`; boot the same day with `Main — Burpees` gone (5 sections).
   Accessory case (elbow/wa|bw|advanced|support_strength W3 mon, Archer pushups → Close-grip pushups): every name the same at
     boot; only `Chest volume` Pushups detail drops RPE 8 → RPE 7.
3. Live card at the tap: other cards moved 0/88 and 0/62; a reject card gone from live 0/88 and 0/62; the choice landed on
   another card 0. On V230 the tap never touches the reject set.
4. Mario: 0 rejects over 30 lifting days on FIX, OV1 and OV5 (OV5 pierces 20, W5+). Control boot != live 0/11 (OV1/FIX) and
   0/8 (OV5), both versions.
5. Closure (source classification only): 30 of 38 are catch-all `Burpees` landings from `Banded hip thrust` (a P-BWFALLBACK
   change of that landing is what would move them); 8 of 38 are the `/press/` branch Pushups re-details (P-FILTERLAST's Chest
   volume case), which a catch-all change would not reach.
6. MIX reachability (V230, comments stripped, untruncated): `.injury =` assignments 0; `delete .injury` 0; `['injury']` keys 0.
   `injury:` object keys 8 lines: :9995 _dayPlanCfg's returned copy; :15713 (applyInjuryDraft), :15735 and :15746
   (imBackFromInjury) overlay patch fields; :15319, :15740, :15741 throwaway injuryPlan({injury…}) probes; :15471 a label map.
   None writes a stored cfg. New programs come from doGenerate :7580, buildProgram(WD); WD's only writers are the literals at
   :2065 and :2185, neither with an injury key. 19 ia_programs writers, all through savePrograms (list in the out file).
   No app writer today produces a stored cfg.injury.
ROOT     The value is the built day's item names and details after the build's last name-changing pass. Writers: _bwFallback
         :6528 (catch-all :6537, /press/ branch :6530), called from bodyweightSweep :6902, which buildProgram calls at
         :11002/11003, after every in-build applyInjuryFilter call (:10947 section build, :10965 and :10985 week refilters,
         :7379 deconflict refilter). Nothing re-filters after the sweep. Reader that exposes it: applySessionSwaps :10340, whose
         guard and filter (:10358–10361) re-apply applyInjuryFilter(day.sections,_dayPlanCfg(prog,day)) to the WHOLE day
         whenever any record on that day hits. V229's guard read prog.cfg.injury, so FIX was already exposed and OV was not;
         V230 extends it to OV. The tap filter at :14350 judges only the swapped item.
SPREAD   applySessionSwaps :10361 (measured); applySwapChoice :14350 (single item, 0 effect, measured); _swapInjuryOK :10002
         (candidate gate on one name, not measured separately); undoSwap :14492 (no re-filter, restores the built day 88/88);
         deconflictAdjacentDupes refilter :7379 (runs before the sweep).
UNKNOWN  Not swept: liftingFocus fatloss, cardio/race/NRC primaryPaths, crossfit and home_full in LBW, seeds other than 76308.
         Multi-hop chains on one reject day not run. Pre-overlay legacy stored blobs with cfg.injury not re-measured (77-blob
         figure is the earlier pass's). The handoff's "54 Main — Burpees on L432" total not reprinted (only the rejects:
         ankle/protect 18; lowback 0). The 54/108 pre-sweep Dumbbell bench press renames: pass not traced. imBackFromInjury
         bridge/halfstep overlays not run through the boot path.
```
