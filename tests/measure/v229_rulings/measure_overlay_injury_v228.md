# Overlay-injury reach of D190/D193 (V229 chat, 2026-10-02) — measure's report, saved verbatim by the main session

Raised by builder during V229 slice 2 (other-half grep); slice 3 parked under standing ruling 7. Script `tests/measure/v229_overlay_injury.js`, output `tests/measure/v229_overlay_injury.out.txt`.

MODE     A (prove a premise refutation that builder raised). Builder's claim reproduces in full. The one place it is incomplete: the build path also reaches overlay programs, and its effect leaks through the swap carry in both presentations (see SPREAD).

**Answer.** Builder's premise holds. Since V98, an injury in this app reaches a program only as an overlay, and no version in git ever wrote `cfg.injury`. On an overlay-injured program, slice 2's live half and D190's live and boot half deliver nothing: 0 hold toasts, 0 kept doses, 0 `ph` fields, 0 live clamps and 0 live cues. Every D190, D193 and M8 population figure was measured on a presentation the app cannot produce. The build half (cue, R2 clamp, R7) does reach the spliced days, byte-identically in both presentations.

REPRO    Base cfg is mario uninjured (commercial, support_strength, beginner, lift only, seed 76308). Start 2026-08-24, clock pinned 2026-09-24. The overlay is written by the app's own writer: `_ovDraft.injRegion='knee'; injTier='workaround'; from='2026-09-21'; applyInjuryDraft()`. On the slice-2 tree, the W5 thu chain at [3,1] (Single-leg hip thrust → Barbell hip thrust → Leg extension → Barbell good mornings):
- **OV presentation.** Hop 2 prints "2×6–10 @ RPE 8". The toast is "Leg extension in, barbell hip thrust out. Same job, same numbers." `_preHold` is none, and the record has 0 `ph` of 3 rx entries. Boot shows Barbell good mornings "2×6–10 @ RPE 8". Undo returns Leg extension "2×6–10 @ RPE 8".
- **Same chain with stored `cfg.injury`.** Hop 2 prints "@ RPE 7" with the R8 toast "…Same sets, same reps. Your injury plan holds this one at RPE 7." `_preHold` is kept, `ph` is 2 of 3, and undo returns "@ RPE 7".
- **Other trees.** V227, V228 and CF3 OV are identical to slice-2 OV for this chain: RPE 8, no toast, no keep. CF3 with `cfg.injury` matches slice 2 with `cfg.injury`, plus `_preHold` PRESENT at boot (its parked boot keep).

METHOD   `/Users/CanasBangin/Desktop/TheBig6V2/tests/measure/v229_overlay_injury.js`. Output: `/Users/CanasBangin/Desktop/TheBig6V2/tests/measure/v229_overlay_injury.out.txt`. The run parts are static, single, chains, l1, report, delta, delta2 and leak. Scratch is `…/7d4ab7fc…/scratchpad/measure2/`.
- **Trees, with sha:** V227 (5ce31e8) c9069fe64113; V228 (HEAD) a53d3ea6c8d2; SL2 (working index.html, copied) e5ade9595b39; CF3 (the M8 copy) caa16e0c6902.
- **Two presentations per config:** CFG is the stored `cfg.injury` used by D190, D193 and M8. OV is an uninjured build plus `applyInjuryDraft`. The stored record was read back and has `cfg.injury` undefined. `activeProg.cfg.injury` is null in OV and set in CFG.
- **Lattices:** The D190 lattice is 18,580 chains over 7 injured configs. 13,323 W5 chains are comparable, with the start card byte-identical across presentations in 13,323 of 13,323. 5,257 W3 chains are excluded: W3 is before the overlay's `from`, and the freeze serves the stored uninjured grid there. The D177 L1 injured slice is 288 of the 384 configs. It covers 4,529 W5 patterned cards, each hopped once to the CFG sheet's first candidate (4,521 had one). The start card is identical in both presentations in 4,521 of 4,521.
- **Baselines:** Each run equals itself (two VMs, pinned clock, overlay id and created stripped): 4 of 4. The presentations differ (`_ovKey` on 5 of 7 days in W5 and W6), so the instrument is not blind.
- **Oracles:** The hand CAP table (Amendment 1). The ruling's literal cue, R7 and R8 strings. A hand RPE parse. Source line order, for item 5. Presentation versus presentation, plus V228's pre-clamp carry for the leak.

FINDING
1. **Reachability.**
   - **Current writers.** On V228 and SL2, comments stripped, nothing writes `cfg.injury`. The only injury write shapes are the overlay patches at SL2 :15697 (`applyInjuryDraft`), :15719 and :15730 (`imBackFromInjury`), plus throwaway `injuryPlan({injury:…})` arguments at :15303, :15724 and :15725. No wizard, generate, edit, import or migration site writes it.
   - **History.** I scanned 77 distinct .html blobs in git (ia-version 81 to 228, plus 7 unversioned). `cfg.injury` is first read at V98, and that same blob already has `type:'injury'` overlays. That matches handoff line 1727 ("V97–V98 Injury overlays built (engine axis + UI)"). Non-overlay injury writes found: 0. The 2 hits are a v0 daily-log field (`logs[key]={…injury…}`), not cfg. The git blobs skip V89–97, V101, V105–107 and others, so those versions are unscanned.
   - **Older stored programs.** Can one carry `cfg.injury` today? Only if a version outside git wrote it, and nothing found shows one did.
   - **Mario's live program.** This is unknowable from the repo; the fixture HALF_MANNY is uninjured. Handoff line 1732 (V104) records Mario on an injury "live on Mario's own week 4", and that route was an overlay.
2. **Readers.** There are 14 `cfg.injury` reads (SL2 lines). The ones inside `engineD_synthesis`, which `buildProgram` reaches through the variant build, are not blind: :7375, `_injViewName` :8088, `_bwRung` :8566, `buildSections` :8991/:9382/:9502/:9530, and :10950/:10969. These are blind on an OV program: `applySessionSwaps` :10345; the live tap :14332; `_swapInjuryOK` :9990, through `swapCandidates` :10106, `auxSwapCandidates` :9873 (and :9871 power) and `addCandidates` :10019 — all of them read `prog.cfg`. :11970 and `_liveInjuryOverlay` :15560 read the overlay, so they are not blind. `dayOverlayInfo` :15412 / `_ovKey` (stamped at :15393) carries the patch on every spliced day, and `swapUniverseFor` :9982 reads it.
3. **Behaviour.**
   - **Spliced W5 cards are identical in CFG and OV on every tree:** mario: 31 cards, 2 on a capped pattern, 1 cue, 0 R7, 0 capped cards above RPE 7. lowback/workaround bodyweight: on V227 and V228, 2 capped cards print RPE 8 (Single-leg hip thrust, Squat slow tempo, "3 sets — RPE 8 …"). On SL2 and CF3 that is 0, in both presentations, so the build clamp reaches overlay days. R7 is not exercised: no test card falls in W5.
   - **Re-appended cue.** A live swap onto a capped pattern gets the cue 143 of 4,521 times on L1 with CFG, and 0 of 4,521 with OV, on both V228 and SL2.
   - **Class (iii) on SL2.** A live final onto a capped pattern prints above RPE 7 in 0 of 8,489 cases with CFG and 8,489 of 8,489 with OV. At boot with OV it is 8,351 of 8,489.
   - **Kept dose on SL2.** `_preHold` is kept in 13,323 of 13,323 chains with CFG and 0 with OV. `ph` entries are 25,752 with CFG and 0 with OV.
4. **Population: OV versus CFG, differing chains or hops.**

   | Tree | Lattice | Any | Live | Toast | Boot | Undo | Undo+boot |
   |---|---|---|---|---|---|---|---|
   | V228 | D190 W5 chains (13,323) | 138 | 0 | 0 | 138 (cue) | 0 | 0 |
   | V228 | L1 hops (4,521) | 143 | 143 | 0 | 143 | not run | not run |
   | SL2 | D190 W5 chains (13,323) | 13,323 | 8,489 | 13,323 | 8,489 | 10,834 | 10,523 |
   | SL2 | L1 hops (4,521) | 189 | 189 | 46 | 189 | not run | not run |

   - **Per config.** For SL2 chains, "any" is 100% in every config: mario 305, knee_protect 1,160, hip 606, lowback 2,627, shoulder 2,486, elbow 6,139.
   - **L1 by region on SL2:** knee/workaround 48 of 1,900 differ; lowback/workaround 141 of 1,706 differ, including 46 hold toasts; shoulder/protect 0 of 915 differ.
   - **What slice 2 moves with OV (V228 → SL2).** On the chains, 0 of 13,323 move in any column. On L1, 96 of 4,521 move (knee 32, lowback 64). All 96 come from the build clamp on the starting card, capped to capped. There are 0 toasts and 0 keeps.
   - **What a real (OV) athlete receives of D190's live and boot half today:** live cue 0 of 143; boot cue 0 of 138.
   - **What a real (OV) athlete receives of D193's live and boot half after slice 2:** hold toasts 0 of 13,323; live clamps 0 of 8,489; keeps 0.
5. **Ordering inside `refreshProgram`** (SL2 lines): `buildProgram(prog.cfg)` :15864 → `applyOverlays` :15878 → freeze (`_pierce` :16012) → `applyRestDayMoves` :16059 → `applySessionSwaps` :16073 → `pruneDayEdits` :16080. Trace on an OV boot: 30 `applyInjuryFilter(cfg.injury=null)` calls run, then `applyOverlays`, then 60 `applyInjuryFilter` calls on the knee variant, then `applySessionSwaps`, which sees W5 thu already spliced (1 cue card) with `prog.cfg.injury=null`, so its re-filter never runs. Conclusion: the boot re-filter does see the spliced plan, but its guard is blind.

ROOT     **The value.** The injury lives in `prog.overlays[].patch.injury`, with the day stamp `_ovKey` from :15393. It never lives in `prog.cfg.injury` on an app program.
- **Writers:** :15697, :15719 and :15730. `applyOverlays` :15343 builds `buildProgram({...prog.cfg, ...ov.patch})` and only splices days. `prog.cfg` is never touched.
- **Readers keyed on `cfg.injury`, blind on OV:** :14332 (tap: keep, filter, `_held`), :10345 (boot re-filter), :9990 (candidate legality), :9871 (aux power).

SPREAD
- **Candidate legality (pre-existing on V228, identical on SL2).** With OV, the swap sheet offers at least one movement the injury plan rejects on 1,387 of 4,529 W5 patterned cards. That is 1,451 rejected names out of 39,117 OV offers. By region and tier: lowback/workaround 758, shoulder/protect 336, knee/workaround 293. Present on every equipment tier. Examples (knee/workaround commercial): Sumo deadlift and Dumbbell goblet squat both offer Jump squats. Examples (lowback/workaround commercial): Lat pulldown offers L-sit chinups.
- **Build-held card swapped onto an uncapped movement (SL2, both presentations).** On 96 W5 cards the build changed the card from V228 to SL2 (the oracle is V228's own carried dose). Swapped onto an uncapped movement, the card carries the held RPE 7 instead of the dose beneath the hold in 96 of 96 cases with OV and 96 of 96 with CFG. With CFG, `_preHold` is kept 96 times, but it holds the held dose. Example: Reverse lunge (KB), V228 "2×10–12 each @ RPE 8", goes to Dumbbell split-stance deadlift [hinge] as "@ RPE 7". Target patterns: hinge 30, lunge 32, calf_iso 24, vpull 8, hip_ext 2. Whether R3 covers a build-held card is coach's call.
- `dayOverlayInfo` / `_ovKey` is an existing per-day carrier of the patch.

UNKNOWN
- What is in Mario's device storage, and the pre-V98 builds missing from git.
- I did not run the reboot-before-last-hop (R) or undo-route (U) modes, the D190 chains on V227 and CF3 (single programs only), the W3 chains or the W7 chains.
- Not measured: an OV `from` earlier than the current week, which is complicated by the freeze serving the stored uninjured grid on past weeks; `addCandidates` illegal offers; the bridge and halfstep overlays; travel plus injury stacked; and days with an `ia_hist_` snapshot.
- R7 was not exercised, because no test card falls in W5.
- The L1 slice hops only to the first candidate (mostly same pattern). The leak measure used the first uncapped candidate.
