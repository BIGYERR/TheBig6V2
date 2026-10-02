# V228 measure: P-CAPRPE before-picture on V227

MODE B (before-picture). Tree: `index.html` ia-version 227, HEAD 5ce31e8 == origin/main. Read-only.

METHOD `tests/measure/v228_caprpe.js` (output `tests/measure/v228_caprpe.out.txt`, 0 crashes, every part printed a summary).
`SCR=<scratch> PART=all node tests/measure/v228_caprpe.js`
- Lattice L9: the 9 configs from V227's `v227_swapseam.js` (mario knee/wa, HALF_MANNY, mario_noinj, knee_protect, ankle/hip/lowback/shoulder/elbow wa), seed 76308, clock 2026-09-24, start 2026-08-24 (current week 5).
- Lattice L432: 6 regions x 2 tiers x 4 equipment (commercial, crossfit, home_full, bodyweight) x 3 experience x 3 focus. One build per tree, seed 76308, mario base cfg.
- Swap: every cued card occurrence x every sheet candidate (864 pairs), live `applySwapChoice`, boot replay through `refreshProgram`, and build `exSwapPrefs`.
- Add: every `addCandidates` name on every W1-W6 day of the 7 injured L9 configs (3,380 adds).
- Oracles. The cap contract is `injuryPlan`'s own authoring comment: "cap: patterns clamped to RPE 7". The cap table was typed by hand from source and agrees with the engine on 9/9 configs. RPE card text :1114. Arithmetic: `rpeFromWave` rir = round(10-RPE). Three counterfactual trees, each made by anchor-asserted surgery on a scratch copy:
  - CFN: cue append neutralised.
  - CFS: `_stripCapCue` made the identity, which is the V226 carry.
  - CFL: `INJ_CAP_CUE` literal changed to "three in the tank".
- Wrapping every `function X(weeks…)` pass for last-writer attribution leaves `progDigest` self-equal on 9/9 configs.

## 1. The literal: readers, writers, and the RPE card
- RPE card :1114 verbatim: "Lifting uses the same feel — it's how many reps you leave in reserve (RPE 8 ≈ 2 reps left in the tank)." `rpeFromWave` :8223-8224 gives RPE 7 => "leave ~3 reps in reserve" and RPE 8 => 2. `_bwSetsFromDetail` :6763 prints RPE 7 as "leave 3 or more in reserve". So the cue's "RPE 7, two in the tank" disagrees with all three.
- "two in the tank" and "hold RPE" each have 1 hit in the file, at :8091 (`const INJ_CAP_CUE`). "in the tank" has 7 hits (6 code): 1114, 8091, 8219, 8298, 8311, 12171, and 12385 (comment). Only :8091 is the cue.
- `INJ_CAP_CUE` has 3 hits:
  - :8091 declaration.
  - :8092 `_stripCapCue` (exact `endsWith`).
  - :8129 append, the single writer: `if(pat&&P.cap.has(pat)&&detail&&!/RPE/.test(detail)) detail=detail+INJ_CAP_CUE;`
- `_stripCapCue` has 3 hits: :8092, :10170 (`applySwapPrefs`, the boot and build replay), and :14295 (`applySwapChoice`, live).
- Detail readers that see the cue's words. Each was probed directly on cued strings.
  - `_bwSetsFromDetail` :6757 `/rpe\s*7/i` reads the cue as RPE 7. It is reached from three places:
    - `unloadableRxSweep` :11198
    - `bodyweightSweep` :6910
    - `_swapDetailFor` :10157, which serves live, boot and build swaps and also the add path at :14427.
  - `_addRxKind` :10018 `/\bhold\b/` refuses every cued detail as an add donor. The word "hold" in the cue trips the time-shape fence. Probe: `_addRxKind("3×10 — hold RPE 7, two in the tank")` returns null, while "3×10" returns "reps".
  - `_rxShort` :14188 `/RPE\s*([\d.]+)/` turns a cued donor into "3×10 at RPE 7" on the swap sheet (:14243).
  - `parseRx` ignores the cue: same `{sets, target}` with and without it.
  - The predicate at :8129 is the only `/RPE/` test on a detail.

## 2. Persistence (CFL: grid stored by V227, booted on a changed literal)
- Stores that hold the cued string:
  - `ia_programs` persisted grid (`savePrograms` :1217, 19 call sites).
  - `ia_hist_` snapshots (`snapshotDay` / `resnapshotDayEdit` :1309-1328).
  - `ia_swaps_` `rx[].d` (`recordSwap` :10279-10292). This is the donor detail as it stood, cue included.
- Stores that do not hold it:
  - `ia_edits_` `add.detail` (`recordAdd` :10208): 0/3,380 adds stored the cue, because `_addRxKind` refuses cued donors.
  - `ia_exw_` and `ia_logs_`: no detail string at their writer sites.
- Boot on CFL: frozen weeks W1-W4 keep the old literal. The 7 injured configs carry 70 old-literal cards and 36 new-literal cards on W5+, so each program shows both literals at once (mario 4 old / 2 new). Grid-only and grid+hist give the same numbers.
- Live swap from an old-literal card: 140 swaps (one per cued W1-W4 card, first candidate).
  - 124/140 carry the OLD literal onto the new card, because the strip misses and the `/RPE/` predicate then skips the re-append. Split: 120 onto a capped target, 4 onto an UNCAPPED target (the D190 defect class returns).
  - 16/140 become bwsets RPE 7, because the old cue is read by `_bwSetsFromDetail`.
- Boot replay of that record on CFL: target landed 104/140. 90 carry the old literal and 14 are bwsets RPE 7. The 36 that did not land are on `ia_hist_`-restored days, as D181 R5 prescribes.
- Undo: `rx` holds the old literal 140/140, and undo writes it back 140/140. This is the record, not a strip reader.

## 3. What the cap does
- Cap table (`injuryPlan` :7950-8080; halfstep caps nothing):

  | Region | Workaround caps | Protect caps |
  |---|---|---|
  | knee | squat, lunge, leg_iso | hinge |
  | ankle | squat, lunge | squat |
  | hip | hinge, lunge, hip_ext, squat | squat |
  | lowback | hinge, squat, row, hip_ext | squat, hip_ext |
  | shoulder | hpress, vpress, delt_iso | none |
  | elbow | hpress, tri_iso, bi_iso, row, vpull | row, vpull |

- "Already names an RPE" is `/RPE/.test(detail)` at :8129: case-sensitive, matched anywhere, on the pattern of the name before the swap.
- Wave mains are clamped separately in `scheme()` :8213-8216 (p to 0.61, which gives RPE 7). The literal branches never read `wv.p`, so the clamp cannot reach them:
  - :8293-8295 `loadCapped`: "RPE 8 (heaviest pair…)"
  - :8297-8299 `!canAddLoad`: "3 sets — RPE 8 (stop 2 reps short of failure)"
  - :8310-8314 `_floor[1]===0`
- Shapes on capped cards in L432 (8,402 capped of 77,693 cards):
  - CUE+fixed-rep: 3,336
  - bwsets: 3,092
  - wave-single: 1,674
  - wave-range: 300
- Also on capped cards, each 0: grammar `@ RPE`, RIR words without RPE, percent, lowercase rpe, power, time/hold with cue.
- Every one of the 3,336 cues landed on a fixed-rep base. 0 landed on a timed or hold base.
- All-card shapes: grammar@ 21,052, bwsets 18,675, wave-single 5,202, wave-range 1,404, power-noRPE 576, no-effort 27,412.

## 4. Counts
(a) Capped cards naming RPE > 7 at build:
- L9: 0/196.
- L432: 304/8,402. All 304 are on the bodyweight tier (304/2,060 bodyweight capped; 0/6,342 on the other three tiers) and all are the shape "N sets — RPE 8 (stop 2 reps short of failure)" on Main slots.
- Writer: `scheme()`'s literal branch. 216 stay in the build loop. 88 are carried by `bodyweightSweep` renaming Dumbbell bench press or goblet squat to a bodyweight substitute, with the input detail already at RPE 8.
- The filter skips all 304 because `/RPE/` matches.
- Segments:
  - Experience: advanced 132, intermediate 128, beginner 44.
  - Focus: support_athletic 152, support_strength 152, support_prevention 0.
  - Pattern: squat 128, hpress 60, row 56, hip_ext 40, lunge 20.
  - Week: W1/2 36 each, W3/4 50 each, W5/6 66 each.

(b) Capped power receiving the cue: L9 0/0 and L432 0/0. The census has 576 power cards: Kettlebell swing [hinge] 360 and Wall ball shots [no pattern] 216.
- Power appears only on workaround tiers. Swing appears only where hinge is uncapped. On hip and lowback, swing is dropped by name.
- So no power card is capped, and the V170 note's "power prescriptions always receive it" is 0/576 today.

(c) Cued cards: L9 106/196 capped. L432 3,336/8,402 capped.
- L432 by tier:
  - Workaround: shoulder 816, elbow 704, hip 418, lowback 348, ankle 162, knee 162.
  - Protect: elbow 432, knee 210, hip 60, lowback 24.
- L432 by equipment: commercial 1,100, home_full 1,042, crossfit 1,032, bodyweight 162.
- In L432, 36 cues sit on an UNCAPPED final card. All 36 are lowback/protect, where `bodyweightSweep` renames "Banded hip thrust" to "Burpees" after the filter has cued it.

(d) P10 split, confirmed on V227: 18 RPE-7 capped bwsets cards are 6 cue / 8 beginner floor / 4 other.
- The 4 (elbow 2, shoulder 2, W5-W6, "Decline pushups" at Strength [0][0]) are source text. :9496 writes the Full Body superset literal `vsets(3)+'×10–12 @ RPE 7 — full ROM, controlled'`, and `unloadableRxSweep` :11198 then sends it to `_bwSetsFromDetail`, whose `/rpe\s*7/` reads it.
- In L432, 1,066 of 2,366 capped RPE-7 bwsets cards are RPE 7 only because of the cue (CFN reads 8). Of the 1,066: `bodyweightSweep` 603, `unloadableRxSweep` 462, build loop 1. By equipment: bodyweight 604, crossfit 158, commercial 152, home_full 152. Prevention focus is 0, because its ceiling at :6758 already gives 7.

(e) Class (iii), cued donor to capped unloadable target:
- Live: 196/210 print bwsets RPE 8 (CFS gives RPE 7). The other 14 keep the fixed-rep form and are re-cued.
- Boot: 196/210. Live equals boot on 210/210.
- Build (`exSwapPrefs`, 75 prefs, 218 landed cards): 202/218.
- By config: elbow 82, shoulder 58/62, lowback 36, hip 20/22. Flat across W1-W6.

Add path (not reached by the filter): `applyAddChoice` :14421-14433 and `applyDayEdits` :10226 never call `applyInjuryFilter`.
- 156/862 capped adds print RPE > 7, all copied from a grammar donor "N×8–12 @ RPE 8". CFN gives the same 156/156.
- By config: shoulder 58, knee_protect 44, elbow 36, lowback 18.
- 6/114 capped bwsets adds change RPE with the cue only because `_addRxKind` refuses cued donors, so a different donor is picked.

## 5. HALF_MANNY
- No injury in the fixture (`injury` undefined, so `injuryPlan` returns null and the filter returns at :8095).
- 0/388 cards are cued and 0 contain "hold RPE". 9 contain "tank", all deload or taper copy from :8219/:8298/:8311.
- `progDigest` 0ac7da6b1691a8e1 is identical on V227, CFN and CFL. A fix confined to the injured path or the literal does not move it.
- Not covered: a fix that edits `_bwSetsFromDetail` or `scheme()`'s literals would reach uninjured cards, and that was not measured.

## 6. Paths a fix inside applyInjuryFilter would not reach
1. `scheme()` literal RPE 8 (:8295/:8299/:8314) on capped bodyweight mains: L432 304. It prints before the filter and passes its `/RPE/` predicate.
2. Post-filter `bodyweightSweep` :6910 renames: 88 of the 304, plus 36 cues landing on uncapped Burpees.
3. `_bwSetsFromDetail` :6757 reading the cue: L432 1,066 native cards, plus class (iii) through `_swapDetailFor` :10157.
4. Add path: 156 capped RPE 8 adds, plus the `_addRxKind` `\bhold\b` reader.
5. `_rxShort` :14188 shows the cued donor as "at RPE 7" on the sheet.
6. Stored strings meeting `_stripCapCue`'s exact `endsWith` at :10170 and :14295 (section 2).

## UNKNOWN
- Which of :8299 and :8314 wrote each of the 304; the instrument sees "build loop" only.
- Travel overlays and `home_basic` or other equipment tiers outside the four listed.
- Seeds other than 76308.
- Program lengths other than mario's.
- NRC and event configs other than HALF_MANNY.
- The V170 hostile-fuzz lattice that produced "576 occurrences" (not reproduced; the configs are not on record).
- Whether `ia_hist_` days with the old literal reach any reader other than display and undo.

---
# D193 pre-builder measures M1-M3 (CF copy R1+R2+R4)

METHOD `tests/measure/v228_caprpe_cf.js` (output `tests/measure/v228_caprpe_cf.out.txt`; 46 lines; 0 crashes, every part printed a summary). The CF copy is in scratch only (`…/measure_caprpe/cf_d193_227.html`) and was made from `index.html` V227 by three surgeries, each anchor count 1:
1. `const INJ_CAP_CUE=' — hold RPE 7, two in the tank';` changed to `three` (R1).
2. `_stripCapCue` changed to strip `/ — hold RPE 7, (?:two|three) in the tank$/` (R4). This edit also adds `_capClamp`:
   - The bwsets head `N sets — RPE x (stop 2 reps short of failure)` with x > 7 becomes `N sets — RPE 7 (leave 3 or more in reserve)`, and the tail is kept.
   - On any other shape, every `RPE a(–b)` token with a maximum above 7 becomes `RPE 7`. `leave ~N reps in reserve` becomes `leave ~3 reps in reserve`, and `stop 2 reps short of failure` becomes `leave 3 or more in reserve`.
   - RPE ≤ 7 is returned untouched.
3. The cue line gains `else if(pat&&P.cap.has(pat)&&detail) detail=_capClamp(detail);` (R2).

The R2 text is measure's reading of the ruling, written only to print the after-grid. It is not the build.

## M1: uncued RPE>7 donors onto capped targets, L9
- 7 injured configs, every uncued RPE>7 card times every sheet candidate: 1,637 pairs, 114 of them onto a capped target.
- Boot replay landed 114/114 on both trees.
- Class (iii-b), RPE>7 on the capped end:
  - Live: V227 114/114, CF 0.
  - Boot: V227 114/114, CF 0.
  - live == boot: 114/114 on both trees.
  - By config: elbow 48, lowback 28, shoulder 20, knee_protect 14, mario 4.
- Distinct end shapes: 4. Each is listed as V227, then CF.
  - `N×R @ RPE 8` (50) becomes `N×R @ RPE 7`. **Flag: no reserve gloss.** The grammar shape has no gloss on V227 either, so there is nothing to restate.
  - `N×R each @ RPE 8` (12) becomes `N×R each @ RPE 7`. **Flag: no reserve gloss.** Same reason.
  - `N sets — RPE 8 (stop 2 reps short of failure)` (48) becomes `N sets — RPE 7 (leave 3 or more in reserve)`. Clean.
  - `N sets — RPE 8 (stop 2 reps short of failure), ramp up with 2–3 warmup sets, 2–3 min rest` (4) becomes `N sets — RPE 7 (leave 3 or more in reserve), ramp up with 2–3 warmup sets, 2–3 min rest`. Clean, and the rest clause is intact.
- No end carries a second RPE token, a range, a disagreeing gloss, or a remaining RPE above 7.
- Donor shapes: `@ RPE 8` 96, `each @ RPE 8` 14, bwsets Main 4.
- **0 wave donors above 7 exist on L9** (mario's support_strength holds wave mains at 7), so the wave `RPE 8.5 (leave ~2 reps in reserve)` shape was not exercised.
- Build (`exSwapPrefs`): 48 prefs, 118 landed cards. RPE>7 drops from 52 on V227 to 0 on CF. All 52 are bwsets shapes (48 plain, 4 with the rest clause), and CF has 0 flags.

## M2: after-grid V227 vs CF, L432 (432 builds, 77,693 cards, positional)
- Classified, with UNCLASSIFIED **0**:
  - **(i) literal: 3,372, not 3,336.** That is the 3,336 capped cued cards plus the 36 cued Burpees. Measure's 3,336 counted capped cards only, so the ruling's "3,336 including the 36" is 36 short.
  - **(ii) clamp: 300.** All on bodyweight-tier Main slots, segment for segment the ruling's table (elbow/wa 56, lowback wa 48 and protect 48, and the rest at 28 or 8).
  - **(ii-b) clamp, Burpees Main: 16, not 18, and not lowback/protect only.** 8 lowback/protect and 8 lowback/workaround. All are W1–W2, intermediate and advanced, athletic and strength focus. Beginner and prevention: 0.
- Total clamp: 316.
- **(a′):** 4 capped cards still name RPE 8 on CF. They are the expected `[Chest volume] Pushups (slow 3s eccentric)` `4 sets — RPE 8 (stop 2 reps short of failure)`, elbow/wa bodyweight advanced, W3–W4, strength and athletic.
- **(iii)**, L9:
  - Live: RPE 8 drops from 196/210 on V227 to 0 on CF, and CF reads RPE 7 on 196.
  - Boot: the same.
  - live == boot on CF: 210/210.
  - The other 14 end as re-cued fixed-rep cards with the "three" wording.
  - Build: RPE 8 drops from 202/218 to 0, CF reads RPE 7 on 202, and the other 16 are re-cued.
- **(iv)**, grid stored by V227 and booted on CF. The first measure's 140 counted two modes (grid-only and grid+hist) at 70 swaps each, and this pass ran grid-only, so the population is **70**.
  - Live: the old wording is carried 0/70 (V227 tree: 60/70).
  - Capped targets on CF: 60 re-cued "three" and 8 bwsets RPE 7. Uncapped targets: 2, with no cue.
  - Boot replay: landed 70/70, old carry 0.
  - Undo restores the stored detail verbatim on 70/70 for both trees.
  - Booted CF programs show 70 old-literal cards, all W1–W4, and 36 new-literal cards on W5+.

## M3
- HALF_MANNY `progDigest`: V227 `0ac7da6b1691a8e1`, CF `0ac7da6b1691a8e1`, with CF self-equal.
- Uninjured builds (mario_noinj plus the 36 uninjured L432 cells): weeks JSON byte-identical 37/37, and the baseline is self-equal.
- CF `_stripCapCue` on non-cue details (L9 including HALF_MANNY): 0 false strips out of 1,722.

## UNKNOWN (this pass)
- The wave RPE>7 shape onto a capped target (0 donors on L9).
- M1 on L432. Its live and boot paths were not run.
- (iv) in grid+hist mode on CF.
- Seeds other than 76308.

---
# Post-build pre-scan (D193 slices 1+2 in the working tree, ia-version 228)

METHOD `tests/measure/v228_caprpe_carry.js` (output `tests/measure/v228_caprpe_carry.out.txt`; 0 worker crashes; every part printed a summary).

Frozen trees in scratch `…/measure_caprpe/carry/`:
- V227: `base_v227.html`, sha c9069fe64113.
- V228: the working `index.html`, sha fdd2eb848f59.
- NOCLAMP: V228 with the capped-branch `_capRpeClamp` call neutralised (anchor count 1). It stands in for the carry seeing the donor's pre-clamp dose, the analogue of D190's cue-blind carry.
- PRECARRY(end) = NOCLAMP end, run through `_capRpeClamp` when the end is capped.

F2–F4 use the D177 gate's own L1 sweep. `tests/gates/g221_d177_swapfloor.js` was copied to scratch with a row dump spliced in (4 anchors, each count 1) and run on V227 and V228 (150,068 rows each). The gate itself was not edited.

## F1 — the clamp carried off a middle card; live ≠ boot
**Population.** The D190 lattice: the 7 injured L9 configs, weeks 3/5/7, every day, every swappable slot. 46,042 two-hop chains were walked. 18,580 chains were kept where the clamp fires on a NON-final hop:
- hop2 or cyc2 with hop 1 firing: 388.
- hop3 off a chain whose hop 1 or hop 2 fires: 18,192.

All 18,580 were reachable on all three trees.

**Live vs boot.**
- V227: 487 chains read live ≠ boot (pre-existing D190 residue).
- NOCLAMP: 487.
- V228: 6,327. That is the same 487 plus **5,840 NEW**.
- V228 closed 0 of the V227 residue.

**The 5,840 new chains.**
- All end on an UNCAPPED movement. 0 end on a capped one.
- Live prints the clamp's 7: bwsets `RPE 7 (leave 3 or more in reserve)` ×4,410, `@ RPE 7` ×1,430.
- Boot prints 8: `RPE 8 (stop 2 reps short of failure)` and `@ RPE 8`.
- Boot == PRECARRY on 5,840/5,840. Boot == V227 boot on 5,840 (it differs only by the literal). Live == PRECARRY on 0.
- By chain class: hop3/h1 3,497, hop3/h2 1,955, hop2/h1 341, cyc2/h1 47.
- By config: elbow 1,927, lowback 1,789, shoulder 749, knee_protect 635, hip 495, mario 230, ankle 15.
- Builder's example reproduces (mario W5 thu): Barbell hip thrust > Leg extension > Barbell good mornings. Live `2×6–10 @ RPE 7`, boot and build `2×6–10 @ RPE 8`, pre-clamp carry `2×6–10 @ RPE 8`. V227 read `@ RPE 8` both live and boot.

**Mechanism.**
- Live: `applySwapChoice` reads the card as it stands. The previous hop's re-filter (:14315) has already clamped it, and `_stripCapCue` (:14309) removes only the cue, so the next hop's `_swapDetailFor` carries the clamped 7. An uncapped end is never re-raised.
- Boot: `applySessionSwaps` (:10319) replays every record through `applySwapPrefs` (:10184, `_swapDetailFor(to,_stripCapCue(it.detail))`) with NO filter between hops. The filter runs once, after the day's last record (:10334-10335). The intermediate card is never clamped, so the carry holds the donor's 8, and an uncapped end keeps it.
- So live is the side that departs from the pre-clamp carry. Boot equals it.

**Build** (`exSwapPrefs` {A:B, B:C(, C:D)}):
- `applySwapPrefs` is one pass per item, so a pref map never chains. The slot reads the first hop's target on 16,093/18,580 and the chain end on 2,487 (where a later key matches the slot's own name).
- Where the end landed: build == boot on 1,590 and build == live on 1,133.
- The build path never carries a clamped intermediate.

**Pre-existing 487** (V227 live ≠ boot already; V228 keeps them):
- capped bwsets→grammar@ 32, capped bwsets→prose 233, uncapped bwsets→grammar@ 76, uncapped bwsets→no-RPE 146.

## F2 — a fifth RPE shape (test-week prose) and the shapes on loaded non-support focuses
- **Live.** 56 gate rows carry one distinct text, all reaching capped targets and all rewritten. Example: `commercial|strength|beginner|lift|knee/workaround W6 tue Barbell Romanian deadlift -> Barbell box squat`.
  - V227 `Work up to one heavy set of 3 to 5 reps at RPE 9. Technique stays crisp. No grinding. Log the weight and the reps. That set is your new baseline.`
  - V228 `… at RPE 7. …` (the rest byte-equal, no gloss present or added).
- **Build path, gate L1 injured configs (288 builds).** 2,247 changed cards:
  - literal 1,594
  - clamp bwsets 439
  - clamp grammar@ 130
  - clamp prose 28
  - Burpees post-filter rename (the (ii-b) class): 56. They show as UNCLASSIFIED only because my final-name capped test does not see the pre-rename pattern.
- **Prose at build.** 28 cards, `commercial|strength|beginner|lift|knee/workaround W6 thu [Main — Barbell box squat]`, the same text, RPE 9 → 7. The test week's own Main on a capped pattern is rewritten at build.
- **@ RPE 8 → 7 at build** (hypertrophy focus; gloss-less):
  - `[Lower strength] Reverse lunge (KB) 2×10–12 each @ RPE 8` → `@ RPE 7`: 56 cards.
  - `[Upper superset] Dumbbell row 2×8–12 @ RPE 8` → `@ RPE 7`: 74 cards.
- **bwsets Mains RPE 8 → 7 on `home_basic`.** Squat (slow 3s tempo) 277 cards, Banded hip thrust 134. Neither tier nor focus is in L432.
- **Correction to section 4 above.** L432 covered the three support focuses only. The engine also builds `strength` and `hypertrophy` (the D177 gate's L1), and `home_basic`. Capped RPE>7 on those was not in the 304.
- The 2,965 gate rows whose donor changed between trees are build-path clamps on the native card (bwsets 2,781, prose 184). All carried verbatim on both trees.

## F3 — D177 verbatim-carry rows (V227 baseline: 0 fails on every row)
| Row | V228 fails | Clamp shapes (all on a capped target) |
|---|---|---|
| G3a | 728/104,375 | wave 567, bwsets 127, prose 34 |
| G3d | 263/32,188 | wave 263 |
| G3e | 177/37,307 | wave 105, bwsets 62, prose 10 |
| G3f | 199/5,984 | wave 199 |
| G3c off-grammar | 89/28,896 | bwsets 65, prose 24 |

- Every failing row on these five rows is a clamp on a capped target. 0 are on an uncapped target and 0 are unclassified.
- **G3c power 118/4,066 is not the clamp.** It is the literal: power donors with no RPE (`2×10`) onto capped targets now end `— hold RPE 7, three in the tank`. The gate's `cueBlind` (g221 :116) strips only `D190_CUE`, the old "two" wording at :115. That makes it a gate-side reader of the literal.

## F4 — toasts the clamp falsifies
- Of all 150,068 pairs, 1,172 have a card the clamp changed (donor RPE → card: 8→7 393, 8.5→7 307, 9→7 300, 9.5→7 100, 7.5→7 72). Every one of them shows a toast claiming the effort or numbers carry over:
  - `Same job, same numbers.`: 613
  - `No load to add here, so take the sets to the same effort.`: 360
  - `… Same sets, same effort. Reps move to a to b.`: 199
- G6a fails on only 84 of the 1,172 (bwsets 62, prose 22). Those are the rows where the gate's hand kind expects a different toast. The other 1,088 pass G6a while the toast's claim is false. G6a-failing rows that are not clamp rows: 0.

## UNKNOWN
- F1 on the gate's L1 configs (`strength`/`hypertrophy`/`home_basic`) and on hist-restored days.
- F1 hop3 chains whose third hop also fires (counted inside hop3/h2, not separated).
- Seeds other than 76308.
- Toasts on the boot path (boot has none).

---
# Amendment 2 CF (M4–M7)

METHOD `tests/measure/v228_caprpe_cf2.js` (output `tests/measure/v228_caprpe_cf2.out.txt`, 0 crashes, every part printed a summary).

The CF2 copy (`…/measure_caprpe/cf2/t_cf2.html`, sha a57b5f88f59d) was made from the working `index.html` (ia-version 228, sha fdd2eb848f59, equal to the carry pass's V228 copy). Six surgeries, each anchor count 1:
1. R7: `_capRpeClamp` returns the R7 text when the detail is the `_testRx` prose (any RPE).
2. R3: `_base=_stripCapCue(item._preHold ?? _wasDetail)`.
3. R3: `_preF` (the `_swapDetailFor` result) is captured before the re-filter.
4. R3/R8: `_held = /RPE/.test(_preF) && filter output != _preF`, and `item._preHold=_preF` is kept.
5. R8: three hold toasts in the ruling's exact strings.
6. `undoSwap` deletes `_preHold` on the restored item. **This is measure's reading, not the ruling's text.** The ruling only says "never changes what undo restores".

All six are measure's reading of the ruling, not the build. The chains reuse the carry pass's 18,580 D190-lattice chains and its V227 and NOCLAMP results. V228 and CF2 were re-run with per-hop card and toast, boot, `exSwapPrefs` build, and undo of the last hop (chip = `swapOriginOf`) followed by a boot. The toasts use the D177 gate L1 row dump on CF2 (150,068 rows, aligned with V227 and V228).

## M4
- **live ≠ boot.** V227 487, slices 1+2 6,327, CF2 **487**. The CF2 residue has **the same chain ids** as V227: 487 in both, 0 only-CF2, 0 only-V227.
- **CF2 live == pre-hold carry.** 18,580/18,580: uncapped ends 6,062/6,062 and capped ends 12,518/12,518. Slices 1+2 managed 12,518.
- CF2 boot == pre-hold carry on 18,093/18,580. The rest are the 487 residue.
- **mario W5 thu**, Single-leg hip thrust > Barbell hip thrust > Leg extension > Barbell good mornings:

  | Step | Card | Toast |
  |---|---|---|
  | hop 1 | `2×6–10 @ RPE 8` | "Same job, same numbers." |
  | hop 2 | `2×6–10 @ RPE 7` | "Leg extension in, barbell hip thrust out. Same sets, same reps. Your injury plan holds this one at RPE 7." |
  | hop 3 | `2×6–10 @ RPE 8` | "Same job, same numbers." |
  | boot | `@ RPE 8` | |
  | direct one hop | `2×6–10 @ RPE 8` | "Same job, same numbers." |

  Every value matches the ruling's expected text.
- **CF2 vs slices 1+2.**
  - Boot: byte-identical 18,580/18,580.
  - Build: byte-identical 18,580/18,580. Build never chains; it is the first hop only, as before.
  - Live changes on 6,062 chains, all with uncapped ends: 5,840 outside the V227 residue and **222 inside it**. Those 222 keep live ≠ boot but print a different live value.
- **Undo.**
  - Undo, then boot: identical to slices 1+2 on 18,580/18,580. Chips: 18,580 equal.
  - The live slot right after undo differs on 2,710 chains. On all 2,710, the card before the last hop already differs between trees, because R3 moved the intermediate card. Example: mario Leg extension > 45° back extension (knee/wa does not cap hip_ext) restores `2 sets — RPE 8 …` on CF2 against `RPE 7 …` on slices 1+2.
  - Undo restores the card as it stood before the last hop on CF2 17,089/18,580 and on slices 1+2 17,003/18,580.

## M5 (D177 L1 sweep, 150,068 pairs)
- **The clamp pairs** (the swap's re-filter changed an RPE: 1,172, the same population as the pre-scan):
  - The CF2 toast is the expected hold variant on 1,172/1,172: verbatim 613, unloadable 360, window 199.
  - False effort or numbers claims: 0.
- **Outside the clamp, 458 pairs still claim "same effort" while the card's RPE differs from the donor's.** All 458 are byte-identical to V227 in both toast and card:
  - 398 are 6.5 → 6: the unloadable conversion under a beginner or prevention floor.
  - 60 are 7.5 → 7: `_bwSetsFromDetail`'s `/rpe\s*7/` reads "RPE 7.5" as 7, so the clamp never sees an 8.
  - R8 does not reach them. Gate claim (k) as worded ("0 toasts say same numbers or same effort on a pair whose card RPE differs from the donor's") would fail on these 458, which are V227-identical.
- **Non-clamp pairs** (148,438): the toast is byte-identical to slices 1+2 and to V227 on 148,438/148,438. A hold toast appears on a non-clamp pair 0 times.
- The card changed between CF2 and slices 1+2 on 240 pairs. All 240 are the R7 text.

## M6 (R7)
- **Build** (gate L1, 384 builds = 288 injured + 96 healthy):
  - 30 cards print the R7 text. 28 are the capped test Mains.
  - **The other 2 are `Main — Burpees`**, strength focus, lowback/wa, bodyweight, W6 tue (beginner and advanced). The filter judged the pre-sweep Banded hip thrust (hip_ext, capped) and wrote R7, then `bodyweightSweep` renamed the card to Burpees. This is the (ii-b) post-filter rename class. Under the final-name lens these are the 2 of 104 "uncapped" test cards that are not byte-identical to V227 (102/104).
  - Number-only shape: 0. Uninjured: 0 R7 cards, and 96/96 builds byte-identical to V227.
- **Live** (gate rows): 240 rows print the R7 text.
  - 56 are from the RPE 9 test donor onto a capped target.
  - 184 are from a donor that is itself a native held-test card.
  - **113 of the 240 land on an UNCAPPED target.** The held-test text travels verbatim off the native card. This is the P-HOLDBENEATH class. Slices 1+2 printed the number-only text on these 113; V227 printed the RPE 9 test.
  - Number-only "at RPE 7 … new baseline" in any CF2 row: 0.

## M7
- HALF_MANNY `0ac7da6b1691a8e1` on V227, slices 1+2 and CF2.
- Uninjured byte-identity CF2 vs V227: 133/133 (the 37 support-lattice cells plus mario_noinj, and the 96 healthy gate L1 configs).
- `g227_d190_cuecap` c-DIGEST: progDigest(buildProgram), clock pinned 2026-09-24, each config built twice and self-equal, configs named as the gate names them. CF2 equals slices 1+2 on all eight.

| Config | CF2 | V227 |
|---|---|---|
| mario | 39679fdc5762f2b5 | 7681cf8e4b3d42da |
| ankle_wa | 24fea086fe087454 | 03e359b5731139a6 |
| hip_wa | 6c73687da203475a | f2ae1010ae57eab7 |
| lowback_wa | d6e7e7178c37c073 | d4de0af4ab123f38 |
| shoulder_wa | 7cd72ca7e37a6f29 | fdfc74330b68d5fc |
| elbow_wa | 9a1b2079ac9cf7bd | 1bd7fe074b3557ee |
| manny | 0ac7da6b1691a8e1 | unchanged |
| mario_noinj | d59b65f1d978a263 | unchanged |

## UNKNOWN
- R3 on hist-restored days, where `_preHold` would ride into `ia_hist_` through the snapshot.
- The `_preHold` deletion on undo was measure's choice. Leaving `_preHold` in place after undo was not measured.
- Seeds other than 76308.

## V228 split: g227 c-DIGEST values

Script `tests/measure/v228_cdigest.js`, output `tests/measure/v228_cdigest.out.txt` (PASS 44 FAIL 0). It mirrors g227 c-DIGEST: the same 8 CFGS (MARIO seed 76308 with knee/ankle/hip/lowback/shoulder/elbow at workaround, HALF_MANNY, mario_noinj), a fresh page per build, Date pinned to 2026-09-24T12:00 through `IA.ctx.Date`, and `progDigest(buildProgram(clone(cfg)))`. Every digest is built twice and is self-stable on both trees. The oracle takes the V227 build output and replaces ` — hold RPE 7, two in the tank` with ` — hold RPE 7, three in the tank` in every `detail` string. Both literals are typed from the ruling. The oracle is hashed with the harness `progDigest`. Neither literal occurs outside `detail` on either tree.

| config | V227 | V228 (working tree) | oracle | detail strings substituted |
|---|---|---|---|---|
| mario | 7681cf8e4b3d42da | 39679fdc5762f2b5 | 39679fdc5762f2b5 | 6 |
| ankle_wa | 03e359b5731139a6 | 24fea086fe087454 | 24fea086fe087454 | 6 |
| hip_wa | f2ae1010ae57eab7 | 6c73687da203475a | 6c73687da203475a | 16 |
| lowback_wa | d4de0af4ab123f38 | d6e7e7178c37c073 | d6e7e7178c37c073 | 12 |
| shoulder_wa | fdfc74330b68d5fc | 7cd72ca7e37a6f29 | 7cd72ca7e37a6f29 | 28 |
| elbow_wa | 1bd7fe074b3557ee | 9a1b2079ac9cf7bd | 9a1b2079ac9cf7bd | 30 |
| manny | 0ac7da6b1691a8e1 | 0ac7da6b1691a8e1 | 0ac7da6b1691a8e1 | 0 |
| mario_noinj | d59b65f1d978a263 | d59b65f1d978a263 | d59b65f1d978a263 | 0 |

V228 == oracle on 8/8 configs. V227 == V228 on the 2/2 uninjured configs. On all 6 injured configs the change is non-vacuous: V227 != V228, with 98 detail strings substituted in total.
