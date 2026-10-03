# D193 — P-CAPRPE: a capped pattern never prints above RPE 7, and the cue says what RPE 7 means

Ruled on V227 (HEAD 5ce31e8, ia-version 227), 2026-10-01. Evidence: `tests/measure/v228_rulings/measure_caprpe_v227.md` (measure, read in full) plus my own harness prints this session (scratch `…/scratchpad/coach/{print,count,attr}.js`, seed 76308, clock 2026-09-24). Everything quoted below was printed from the V227 artifact in this session.

## Finding

Three things are wrong and they are not the same thing.

1. **The literal is wrong by one rep.** The cue ` — hold RPE 7, two in the tank` (`INJ_CAP_CUE` :8091) disagrees with every other RPE 7 writer in the file: the RPE card (:1114, "RPE 8 ≈ 2 reps left in the tank"), `rpeFromWave` (:8223, RPE 7 → "leave ~3 reps in reserve", rir = round(10 − 7) = 3) and `_bwSetsFromDetail` (:6763, RPE 7 → "leave 3 or more in reserve"). An athlete who reads the card and the cue together is told two different efforts. Measure's counter on record (shipped since V142, nobody misread it) does not survive the arithmetic: the app states RPE 7 three ways and the cue is the odd one out.

2. **The cap has a hole shaped like a bodyweight Main.** `applyInjuryFilter` :8129 appends the cue only to a detail that names no RPE, and `scheme()`'s three literal branches (:8295, :8299, :8314) never read the clamped `wv.p`, so a capped pattern on the bodyweight tier prints `3 sets — RPE 8 (stop 2 reps short of failure)` and the filter walks past it. Printed this session, elbow/workaround bodyweight advanced athletic (cap hpress, tri_iso, bi_iso, row, vpull): `W1 mon [Main — Archer pushups] Archer pushups {hpress CAP} "3 sets — RPE 8 (stop 2 reps short of failure), ramp up with 2–3 warmup sets, 2–3 min rest"`. Knee/workaround bodyweight advanced: `W1 thu [Main — Split squat] Split squat {lunge CAP} "3 sets — RPE 8 …"`. My L432 count under the final-name lens matches measure: **304 of 8,402 capped cards name RPE 8, all bodyweight tier, 300 Main slots + 4 `Chest volume`**; 0 of 196 on L9; 0 on loaded tiers. The same hole is what D190 class (iii) fell through: a cued donor is stripped, `_swapDetailFor` hands `_bwSetsFromDetail` a bare `3×10`, it answers RPE 8, and the re-filter skips it because an RPE is named. Printed: `_swapDetailFor("Pushups", _stripCapCue("3×10 — hold RPE 7, two in the tank"))` → `"3 sets — RPE 8 (stop 2 reps short of failure)"`. Measure: 196/210 live, 196/210 boot, 202/218 build.

3. **The native RPE 7 on capped bodyweight accessories is not a leak; it is the reader honouring a prescription the filter wrote.** `_bwSetsFromDetail` reads any RPE the detail already names (6, 7, else 8). The filter writes "RPE 7" onto a capped fixed-rep card by the plan's rule; the sweep then keeps it. That is the same contract by which it keeps the Full Body literal's `@ RPE 7` (the 4 Decline pushups). Measure's 1,066 cards are RPE 7 because the plan said so, in words the reader is built to read. What was unruled is only that nothing stood behind the reader if the cue ever failed to land. D193 puts the clamp behind it.

Two findings outside this ruling's reach, both printed this session and both parked below: the 4 `Chest volume` cards and the 36 cued Burpees are post-filter renames, where `bodyweightSweep` (:6910, after the filter) changes the pattern the plan judged. The Burpees case is worse than a cue: lowback/protect bodyweight prints `W1 tue [Main — Burpees] Burpees "3 sets — RPE 8 (stop 2 reps short of failure), ramp up with 2–3 warmup sets, 3 min rest"`, pre-sweep `[Main — Banded hip thrust] Banded hip thrust {hip_ext CAP}`. The plan's one spine-neutral hinge substitute becomes a flexion plyo Main through `_bwFallback`'s catch-all (:6537).

## What ships (rule level; siting and form are the session's)

**R1 — The cue says three.** `INJ_CAP_CUE` becomes ` — hold RPE 7, three in the tank`. The leading ` — ` is the spec separator (exempt); the clause is a short declarative in the RPE card's own idiom; the verb "hold" stays (it is the coaching instruction, and it is also what `_addRxKind` :10018 keys on, see R6). The number is derived, not chosen: `rpeFromWave`'s rir at RPE 7 is 3, and `_bwSetsFromDetail` prints 3 for RPE 7. Probed: the new literal reads back identically to the old through `_bwSetsFromDetail` (RPE 7), `_addRxKind` (null), `_rxShort` ("3×10 at RPE 7"), `parseRx` (ignored). Nothing but the word changes on any cued card.

**R2 — The filter clamps.** Inside `applyInjuryFilter`, on a capped pattern, a detail that names an RPE above 7 is lowered to 7 and its reserve words are restated for 7. Not a second lens: the filter is already the plan's single writer on all three paths (D190), so one edit lands on build (:10907, :10925, :10945), boot (:10321) and live (:14301). The rewrite uses the RPE 7 line the file already prints: for the bwsets shape, `_bwSetsFromDetail`'s own `N sets — RPE 7 (leave 3 or more in reserve)`, so the 84 to 88 cards `bodyweightSweep` later re-derives come out byte-equal to the clamp's output; any trailing rest clause (`, ramp up with 2–3 warmup sets, 2–3 min rest`) is untouched. For any other RPE-bearing shape that reaches the filter (grammar `@ RPE 8` via a live swap from an uncued loaded donor onto a capped target, wave `RPE 8.5 (leave ~2 reps in reserve)`), the number drops to 7 and a reserve gloss restates to 3, by `rpeFromWave`'s arithmetic. Today 0 of 8,402 capped build cards carry those shapes; the live-swap population is unmeasured (M1 below). A detail that already names RPE ≤ 7 is left byte-identical and gets no cue (RPE 6 deload, RPE 5–6 taper, beginner 6–7, prevention 7, the clamped wave at 7). The cue predicate (`no RPE named → append`) is unchanged.

**R3 — Class (iii) returns to 7 by rule.** With R2 the re-filter after `_swapDetailFor` lowers the RPE 8 the reader produced. Printed expectation: `3 sets — RPE 7 (leave 3 or more in reserve)` on the capped unloadable end, live, boot and `exSwapPrefs` build alike. `_reRx` and the toasts do not move: D177's claim is the rep token (G3c, cue-blind above 226), and the clamp never touches a rep token. The sheet row still shows the donor's dose (`_rxShort`); the plan's hold shows on the card. That is D190's precedent for the cue and it stands for the clamp.

**R4 — The stripper recognises the cue by shape, not by today's spelling.** `_stripCapCue` (:8092, read at :10170 and :14295) strips the retired wording as well as the current one. Otherwise a card stored by V227 carries "two in the tank" through a swap onto the new card (measure: 124/140, 4 of them onto an uncapped target, the D190 defect class) and the re-append is skipped because an RPE is named. With R4 the carry is 0/140, capped targets are re-cued with the new words by the filter, and uncapped targets print no cue. One regex, both wordings; there is no constant to expire. `_stripCapCue` must still be the identity on every non-cue detail: printed, 0 of HALF_MANNY's 9 "tank" cards (`RPE 6 (recovery — leave 4+ reps in the tank)`, `RPE 6 (leave plenty in the tank)`) match the cue shape.

**R5 — Stored strings are the record and are not rewritten.** No migration of `ia_programs`, `ia_hist_` or `ia_swaps_` `rx.d`, and no display-time rewrite. §11e: a past week is a dead record, a trained day is byte-identical, an untouched day at or after the current week rebuilds live. So an injured athlete who started before V228 sees "three" on every day he can still train and "two" on the days he already trained or that are behind him. The prescription on those days was RPE 7 and still is; only the gloss was off by one rep, and the record of what he was shown stays true. Undo restores `rx.d` as recorded (old words on an old card): correct, the record is what undo promises. Measure's 70 old-literal cards on the 7 injured L9 configs are all W1–W4 past weeks.

**R6 — Readers that stay exactly as they are, each by rule.** `_bwSetsFromDetail` keeps reading the RPE a detail names (R2 stands behind it; making it cue-blind flips 1,066 native cards to RPE 8 with no filter after `bodyweightSweep` on the build path). `_addRxKind` keeps refusing "hold": until P-ADDSEAM runs the filter on the add path, that refusal is the only thing keeping the cue out of `ia_edits_` (measure: 0/3,380 adds stored it), so the word stays in the literal and the fence stays in the reader. `_rxShort` unchanged. `scheme()`'s three literals unchanged (they are right for an uninjured bodyweight athlete; HALF_MANNY and every uninjured build stay byte-identical). `bodyweightSweep` and `unloadableRxSweep` unchanged. The add path unchanged (P-ADDSEAM, §12). The V170 power note is closed without code: 0/576 power cards carry the cue on V227 (printed shoulder/workaround crossfit advanced athletic: 0), the `halfstep` tier that produced the V170 figure caps nothing since V142/D1, and the gate keeps a 0 row.

## What deliberately does not change
Uninjured builds (filter returns at :8095); `HALF_MANNY` (no injury, 0/388 cued, digest `0ac7da6b1691a8e1` printed this session on V227); wave mains (p-clamp :8253 already gives 7); taper, deload, beginner floor, prevention ceiling; loaded-tier cued details beyond the one word; toasts, `_reRx`, sheet rows; the add path; the two post-filter rename classes (parked). **HALF_MANNY may not move.** Era row `MANNY_DIGEST_BY_VERSION[228] = [227]` with the uninjured byte-identity row as its conjunct; measure's CFN/CFL copies already read `0ac7da6b1691a8e1`, and before builder the full CF copy (R1+R2+R4) is printed once more by measure (M3). If it moves, standing ruling 5 fires and this ruling comes back.

## Before (V227, printed)
```
elbow/wa bodyweight advanced athletic
  W1 mon [Main — Archer pushups] Archer pushups {hpress CAP}  "3 sets — RPE 8 (stop 2 reps short of failure), ramp up with 2–3 warmup sets, 2–3 min rest"
  W5 mon [Chest volume] Pushups (slow 3s eccentric) {hpress CAP}  "4 sets — RPE 7 (leave 3 or more in reserve)"
mario knee/wa commercial beginner
  W5 thu [Leg superset A] Step-ups (KB) {lunge CAP}  "2×10 each — hold RPE 7, two in the tank"
class (iii) probe
  _swapDetailFor("Pushups", _stripCapCue("3×10 — hold RPE 7, two in the tank")) -> "3 sets — RPE 8 (stop 2 reps short of failure)"
frozen W1 (V227 store, booted on V228)
  W1 thu [Leg superset A] Step-ups (KB) {lunge CAP}  "2×10 each — hold RPE 7, two in the tank"
lowback/protect bodyweight intermediate athletic
  W1 tue [Main — Burpees] Burpees {-}  "3 sets — RPE 8 (stop 2 reps short of failure), ramp up with 2–3 warmup sets, 3 min rest"   (pre-sweep: Banded hip thrust {hip_ext CAP})
  W3 thu [Leg superset B] Burpees {-}  "3×8 — hold RPE 7, two in the tank"
HALF_MANNY digest 0ac7da6b1691a8e1 | cued 0/388
```

## After (V228, expected)
```
  W1 mon [Main — Archer pushups] Archer pushups {hpress CAP}  "3 sets — RPE 7 (leave 3 or more in reserve), ramp up with 2–3 warmup sets, 2–3 min rest"
  W5 mon [Chest volume] Pushups (slow 3s eccentric) {hpress CAP}  "4 sets — RPE 7 (leave 3 or more in reserve)"      (unchanged)
  W5 thu [Leg superset A] Step-ups (KB) {lunge CAP}  "2×10 each — hold RPE 7, three in the tank"
  class (iii) end on a capped unloadable target -> "3 sets — RPE 7 (leave 3 or more in reserve)"   (live == boot == build)
  frozen W1 Step-ups (KB) "2×10 each — hold RPE 7, two in the tank"   (byte-identical: past week / trained day; a live swap from it carries 0 old words and re-cues "three" on a capped target)
  W1 tue [Main — Burpees] Burpees  "3 sets — RPE 7 (leave 3 or more in reserve), ramp up with 2–3 warmup sets, 3 min rest"   (class ii-b: right text, wrong movement until P-BWFALLBACK)
  W3 thu [Leg superset B] Burpees  "3×8 — hold RPE 7, three in the tank"   (literal only; the cue stays, P-FILTERLAST/P-BWFALLBACK)
HALF_MANNY digest 0ac7da6b1691a8e1 (unmoved)
```

## Blast radius (coaching terms, for the differential)
- **(i) Literal.** Every cued card, the word "two" becomes "three". L432 3,336 cards (workaround: shoulder 816, elbow 704, hip 418, lowback 348, ankle 162, knee 162; protect: elbow 432, knee 210, hip 60, lowback 24); L9 106; mario knee/wa 12. Includes the 36 Burpees.
- **(ii) Build clamp.** Capped bodyweight-tier Mains `RPE 8 (stop 2 reps short of failure)` → `RPE 7 (leave 3 or more in reserve)`, rest clause intact: 300 on L432 (knee/wa 28, ankle/wa 28, hip/wa 28, hip/pr 8, lowback/wa 48, lowback/pr 48, shoulder/wa 28, elbow/wa 56, elbow/pr 28); 0 on L9; 0 uninjured. **(ii-b)** 18 lowback/protect bodyweight `Main — Burpees` W1–W2 (pre-sweep hip_ext capped), same rewrite. Expected 318 on L432.
- **(iii) Swap ends.** Class (iii) RPE 8 → 7: live 196/210, boot 196/210, build 202/218 (elbow 82, shoulder 58, lowback 36, hip 20). **(iii-b)** uncued RPE>7 donors onto capped targets via live/boot/build swaps: unmeasured, sized by M1 before builder; the rewrite is number-to-7 plus reserve gloss.
- **(iv) Stored old literal.** Live swap from a V227-stored cued card: carry 124/140 → 0; capped targets re-cued with the new words (120), uncapped targets print no cue (4). Boot replay the same (90 → 0). Undo unchanged (140/140 restores the record).
- **Not moving.** All uninjured builds; HALF_MANNY; the 4 `Chest volume` cards (stay RPE 8, INFO row); every wave, taper, deload, beginner and prevention line; add path; toasts; sheet rows.

## Gate claims (one gate family, `g228_d193_caprpe`; keyed on ia-version 227 per standing rulings 2 and 4: the gate reads the artifact's own `ia-version`, REFUSES below 228, and run on the V227 artifact with the version assumed 228 fails at exactly the counts below)
- **(a) Cap contract, build.** Population U = capped cards whose pattern the filter judged (final name unchanged by `bodyweightSweep`, or renamed within the same pattern). 0 of U names RPE > 7, any shape, any tier, any slot. V227: 318 (300 + 18 Burpees Mains). **(a′) INFO**: capped cards renamed INTO the cap after the filter, count 4 on L432, prints and self-expires at 0 when P-FILTERLAST ships.
- **(b) Uncapped unchanged.** On injured builds, every uncapped card is byte-identical to V227 except class (i) words. On uninjured builds, byte-identical, full stop. HALF_MANNY digest `0ac7da6b1691a8e1`, era row [228]=[227].
- **(c) Literal arithmetic, independent oracle.** The number word in `INJ_CAP_CUE` equals round(10 − 7) spelled out, and equals the RPE card's "RPE 8 ≈ 2" shifted one point. V227: "two" ≠ 3.
- **(d) Agreement.** Every detail the clamp writes has reserve words that agree with its RPE number (7 ↔ 3). INFO row over the whole card universe (RPE 8 ↔ 2, 7 ↔ 3, 6 ↔ 4+), for gatekeeper to scope.
- **(e) Class (iii).** Cued donor → capped unloadable target reads RPE 7 live, boot and `exSwapPrefs` build; live == boot on 210/210. V227: 196/210 and 202/218 read 8.
- **(f) Stored literal.** A V227-built grid with the old words booted on V228: live swap carry 0/140, boot carry 0/140, re-cue with the new words on capped targets, 0 cue on uncapped targets; undo restores `rx.d` verbatim. `_stripCapCue` identity on every non-cue detail in HALF_MANNY and the L9 (0 false strips).
- **(g) Coupling guards.** `_addRxKind(new cue)` is null and 0 adds store the cue (D177 G8a already pins this; add a row keyed here). 0 power cards cued. A loaded-to-loaded swap still carries the donor verbatim through both hop sites.

## Sabotage (each must trip a named row)
S1 literal back to "two" → (c). S2 clamp branch removed → (a) 318, (e). S3 clamp applied regardless of cap → (b). S4 `_stripCapCue` exact-current-literal only → (f). S5 `_stripCapCue` loosened to strip any ` — …` tail → (g) verbatim carry, (b). S6 `_bwSetsFromDetail` made cue-blind → (a) (the 1,066 natives flip to 8). S7 clamp lowers the number but keeps "(stop 2 reps short of failure)" → (d). S8 `\bhold\b` removed from `_addRxKind` → (g).

## Measure before builder (standing ruling 7)
M1: uncued RPE>7 donors (grammar `@ RPE 8`, wave) onto capped targets, live/boot/build, L9 — the class (iii-b) count and shapes. M2: the after-grid on L432 from a CF copy carrying R1+R2+R4: expect 318 in (ii)/(ii-b), 3,336 in (i), 4 untouched in (a′), 0 elsewhere. M3: HALF_MANNY digest on that copy, expect `0ac7da6b1691a8e1`. If M1 shows a shape the R2 rewrite does not cover cleanly, it comes back here before a byte moves.

## Parked to §12
- **P-FILTERLAST (new).** On the build path `applyInjuryFilter` runs before `bodyweightSweep`, the last name-changing pass, so the plan judges a movement that is not the one on the card: 4 `Chest volume` cards (elbow/wa bodyweight advanced W3–W4, `Dumbbell incline press {vpress}` → `Pushups (slow 3s eccentric) {hpress CAP}` at RPE 8) and the 36 cued Burpees (hip_ext judged, no pattern printed). The honest fix is the filter as last writer on the build path as it already is live and at boot; the differential (drop rules, `noJumps`, `swapNames` now seeing post-rename names) is unmeasured, so it is not in V228. Recommend: measure the post-sweep re-filter differential on L432, then rule. Counter: fold the 4 into a vpress-preserving fallback instead; smaller, but it leaves the seam.
- **P-BWFALLBACK (new, coaching, the one I would pull forward).** `_bwFallback` (:6530) has no hip-extension row, so `Banded hip thrust`, the lift lowback/protect chose for being spine-neutral (:8614–8616), falls to `Burpees` on the bodyweight tier: 18 `Main — Burpees` Mains at RPE 8 with warmup sets and 3 min rest, plus 36 cued Burpees in `Leg superset B`, on a protect-tier low back. The plan's own no-band pool already names the right fallbacks (`Single-leg glute bridge`, `Single-leg hip thrust (shoulders on bed)`, :8467/:8471). Recommend: queue it as the next build after V228, measure first (every `_bwFallback` catch-all landing, all regions). Counter: ride V228; rejected because the rename changes the card's movement and the differential is unmeasured.
- **P-ADDSEAM** stays as written, with one line added: when the add path gets the filter, `_addRxKind` judges the stripped donor and the "hold" fence is retired; until then it is load-bearing (R6).

## Mario's calls (doctrine only; each with a pick)
1. **The words (his voice).** Ship ` — hold RPE 7, three in the tank`. Counter: ` — hold RPE 7 (leave 3 in reserve)`, one house phrasing with the wave line; I prefer the RPE card's idiom because the card is what the cue must agree with.
2. **The record.** Past weeks and trained days keep "two in the tank". Recommend yes: the prescription was RPE 7 and is RPE 7, the record stays true, and the population is injured athletes who started before V228. Counter: a display-time rewrite of the retired words so a program never shows both glosses; rejected as a write onto the record for a problem that ends with the program. His own program is uninjured and does not change either way.
3. **P-BWFALLBACK's doctrine.** Should a bandless hip thrust fall to the plan's own single-leg glute bridge rather than to Burpees? Recommend yes, ruled in its own build.

**Recommendation:** Ship D193 at V228 as R1–R6 (one literal, one clamp inside the filter, one shape-aware stripper, nothing else touched), with M1–M3 printed first and P-BWFALLBACK queued immediately behind it.

**Counter:** Put the clamp in `scheme()`'s three literal branches instead, fixing the 300 at source; rejected because it is a second lens on the cap (D190 rejected exactly that), it cannot reach class (iii) or a live swap, and it would reach uninjured cards that HALF_MANNY's digest protects.

## Mario's decisions (2026-10-01, V228 chat)
"Agree on all four, ship D193 at V228." By ruling name:
- **D193 wording:** ship ` — hold RPE 7, three in the tank` (coach's pick).
- **D193 record:** past weeks and trained days keep "two in the tank"; no stored-string rewrite (R5 stands).
- **D193 ships at V228 with D192 P-UNDOKEY riding it**, conditional on M1–M3 matching the ruling's expectations; any mismatch goes back to coach first.
- **P-BWFALLBACK:** a bandless hip thrust falls to the plan's own single-leg glute bridge, not Burpees. Queued as the build after V228, measure first.

---

# D193 — Amendment 1: corrected counts, the gate (a) lens, the four RPE shapes R2 names, and two tiers the lattice never built

Ruled on V227 (HEAD 5ce31e8, ia-version 227), 2026-10-01, V228 chat. Evidence: measure's M1–M3 (`/Users/CanasBangin/Desktop/TheBig6V2/tests/measure/v228_rulings/measure_caprpe_v227.md`, output `/Users/CanasBangin/Desktop/TheBig6V2/tests/measure/v228_caprpe_cf.out.txt`, script `/Users/CanasBangin/Desktop/TheBig6V2/tests/measure/v228_caprpe_cf.js`) read in full, plus my own prints this session on V227 and on a CF copy built with measure's three anchor-asserted surgeries (scratch only: `/private/tmp/claude-501/-Users-CanasBangin-Desktop-TheBig6V2/3a93b6bd-f518-4d1a-a71e-2afb713a85f0/scratchpad/coach/amend.js`, `amend2.js`, `amend3.js`, outputs `amend.out.txt`, `amend2.out.txt`, `amend3.out.txt`; seed 76308, clock 2026-09-24, mario base cfg). Everything quoted below was printed in this session. **No new D-code**: the rule Mario approved does not move; this is the D187 Class E shape (counts and gate scope corrected under the existing number).

## 1. The corrections, and why the ruling was off

**(i) The literal class is 3,372, not 3,336.** Printed on L432: cued cards 3,372 = 3,336 whose final name is still a capped pattern + 36 whose final name is `Burpees` (uncapped). All 3,372 were capped at filter time. The ruling added the 36 into a figure that had already excluded them. L9: 106 cued, 0 on an uncapped final name. The 36 are lowback/protect only, pre-sweep `Banded hip thrust {hip_ext}`: **24 in `Leg superset B` and 12 in `Leg circuit — runner armor`** (the ruling named only `Leg superset B`).

**(ii-b) The clamped Burpees Mains are 16, not 18, and sit on both lowback tiers.** Printed: `Main — Burpees` on L432 is 54 cards, 18 each on lowback/protect, lowback/workaround and ankle/protect, every one renamed from `Banded hip thrust {hip_ext}` by `_bwFallback`'s catch-all. The 18 I quoted was the lowback/protect cell's Main total across all nine experience×focus cells. Only 8 of those 18 print `RPE 8 (stop 2 reps short of failure)` (intermediate and advanced × athletic and strength, W1–W2); the 6 beginner Mains print the beginner floor `RPE 6–7 (leave 3–4 in reserve — learn the movement)` and the 4 prevention Mains print `RPE 7 (leave ~3 in reserve)`, both at or under 7 and untouched by R2. Lowback/workaround also caps `hip_ext` and adds 8 more at RPE 8 with the same split. Hence **16**, total clamp **316**. The ankle/protect 18 (W3–W4) are not in D193's radius: `hip_ext` is uncapped there, so nothing is clamped and gate (b) holds them byte-identical. They are a P-BWFALLBACK finding (a jump landed as a Main on a protected ankle) and are recorded in §9 below.

**(iv) The stored-literal population is 70, not 140.** The first pass counted grid-only and grid+hist at 70 each. Corrected: live carry 60/70 on V227 → 0/70 on CF; CF capped targets 60 re-cued "three" + 8 bwsets RPE 7; uncapped targets 2, no cue; boot replay landed 70/70, carry 60 → 0; undo restores `rx.d` verbatim 70/70 on both trees.

## 2. The gate (a) population, ruled

**U is defined by the filter's own lens: a card is in U when the pattern of the name `applyInjuryFilter` judged (the name before `bodyweightSweep`) is in the plan's cap.** This is the lens the ruling already chose for the clamp ("not a second lens", D190's one-lens rule applied to pool and post-filter), and it is the only definition under which "0 of U names RPE > 7" is exactly what R2 claims. The ruling's parenthetical ("final name unchanged, or renamed within the same pattern") was wrong and is withdrawn.

Consequences, printed on V227 L432:
- Final-name lens: 304 capped cards name RPE > 7. Filter-time lens: **316**. Both lenses: 300. Filter-only (judged capped, left the cap by rename): 16, the Burpees Mains. Final-only (uncapped when judged, entered the cap by rename): 4, the `Chest volume` pushups from `Dumbbell incline press {vpress}`.
- So **the cross-pattern Burpees rename is inside U, and (a)'s V227 count is 316, not 318 and not 300.**
- **(a′) INFO** stays at 4: cards capped under the final lens but not the filter lens. Self-expires at 0 when P-FILTERLAST ships.
- **(a″) INFO (new)**: cards capped under the filter lens but not the final lens, 52 on V227 L432 (16 clamped Mains + 36 cued accessories), all `Burpees` from a capped `Banded hip thrust`. Expected 0 when P-BWFALLBACK lands a `hip_ext` fallback; if the chosen fallback's pattern is not `hip_ext`, this row goes back to coach then.

How a gate sees the filter-time name is gatekeeper's call; both measure and I did it by tagging each item object with its pre-sweep name and `_pattern` in a `bodyweightSweep` wrapper, which rides the object through the sweep and leaves the build otherwise untouched. The oracle stays the hand-typed cap table.

## 3. The shapes R2 names, each with the file's own RPE 7 line

R2's sentence "its reserve words are restated for 7" presupposes reserve words. The rule, made explicit: **a capped detail naming RPE above 7 gets the number 7, and whatever reserve gloss it carried is replaced by the file's own RPE 7 gloss for that shape; a shape that carries no gloss gets none.** Four shapes reach the filter on a capped target; all four were printed this session.

| Shape (writer) | V227 text | After | Source of the RPE 7 line |
|---|---|---|---|
| bwsets (`scheme()` `!canAddLoad` / `_floor[1]===0`, :8299/:8314; `_bwSetsFromDetail` :6763) | `N sets — RPE 8 (stop 2 reps short of failure)[, ramp up …, rest]` | `N sets — RPE 7 (leave 3 or more in reserve)[, ramp up …, rest]` | `_bwSetsFromDetail`'s RPE 7 branch |
| grammar (`@ RPE` writers, 106 lines) | `N×R @ RPE 8`, `N×R each @ RPE 8` | `N×R @ RPE 7`, `N×R each @ RPE 7`, **no gloss, no cue** | The grammar never glosses: 0 of 106 `@ RPE` writer lines carry reserve words, and 10,468 RPE 7 grammar cards on L432 (`N×N–N @ RPE 7` 5,922, `each @ RPE 7` 2,384, `@ RPE 6–7` 1,496, `each @ RPE 6–7` 666) carry none. A gloss here would make the capped card the only glossed grammar line in the program. **This is the rule R2 intended; measure's "FLAG no gloss" is a measure artefact, not a defect.** |
| wave (`rpeFromWave` :8223) | `N×R — RPE 8.5 (leave ~2 reps in reserve), ramp up …, rest` / `RPE 9 (leave ~1 rep in reserve)` | `N×R — RPE 7 (leave ~3 reps in reserve), ramp up …, rest` | `rpeFromWave` at RPE 7: rir = round(10 − 7) = 3, plural |
| loadCapped (`scheme()` :8295, fires only when `cfg._travel && equip==='home_basic'`, :8437) | `3 sets of 8 to 12 — RPE 8 (heaviest pair you can find)` | `3 sets of 8 to 12 — RPE 7 (leave ~3 in reserve)` | The branch's own `_effEase` line, :8292. "Heaviest pair" is not a reserve gloss but it contradicts a hold at 7, so it goes. Measure's `_capClamp` would have left it; the rule now names it. |

An RPE range whose top exceeds 7 (`RPE 7–8`) collapses to `RPE 7`: 0 such tokens exist on L432 (the only grammar shape above 7 is `@ RPE N`, every wave RPE is a single number, the beginner floor's `6–7` is at 7), so this is a defensive clause and a synthetic INFO row, not a measure.

A detail at or under 7 stays byte-identical and gets no cue (unchanged from R2). The cue predicate (`no RPE named → append`) is unchanged.

## 4. The unmeasured items in the brief: none blocks builder

- **Wave shape onto a capped target: now measured, real, covered.** M1's 0 was an artefact of L9 being `support_strength` (the strength-support p-clamp at :8241 holds every wave at 7). On L432, 912 wave cards sit above 7, all `support_athletic`, and **516 of their sheet pairs land on a capped candidate** (`swapCandidates`' tier2 offers same-region cross-pattern lifts): ankle/protect 28, ankle/wa 140, knee/protect 40, knee/wa 140, lowback/wa 168. Live and boot on four `support_athletic` configs (20 rows, V227 vs CF): V227 RPE > 7 **20/20**, CF **0/20**, CF live == boot **20/20**, `~2 reps` and `~1 rep` both → `~3 reps`, 0 second RPE tokens, 0 other `~N`. Where the capped candidate is unloadable (Chinups → Inverted rows) the end is the bwsets shape, also clamped. **Gate row (e′) on these real donors; no synthetic needed.**
- **M1 live/boot on L432:** the clamp is one string rule in one writer, proven on L9 (114/114 → 0) and on the wave pairs above; the full L432 live sweep is sizing, not proof. INFO row with the 912/516 figures; fuzz covers the rest.
- **(iv) in grid+hist mode:** gate (f) runs both modes. Same strip at the same two sites, so expected live carry 0/70 in both; at boot, hist-restored days are not replayed (D181 R5), so the carry there is 0 by construction. If the row cannot pass it parks (standing ruling 7). Not a blocker.
- **Seeds other than 76308:** a fuzz row (random injured configs, 0 cards in U above RPE 7 except the (a′) class). Not a blocker.
- **`heaviest pair` shape:** travel-overlay only (0 on every plain build of every equipment value, printed). Gate row (h) below; a rule, not a blocker.

## 5. Two tiers the lattice never built (new, printed this session)

Measure's first UNKNOWN named "travel overlays and `home_basic`"; I built them.
- **`home_basic` is a wizard tier** (:2730, "Home Gym — Basic"). On its 108 injured builds (6 regions × 2 tiers × 3 experience × 3 focus, seed 76308): 2,092 capped cards, **120 name RPE > 7 under the final lens**, every one the bwsets shape (ankle/wa 28, hip/wa 28, lowback/protect 28, elbow/wa 12, hip/protect 8, knee/wa 8, lowback/wa 8). R2 clamps them by the same rule; the ruling never counted them. The filter-lens figure equals 120 unless a rename class exists on that tier; gatekeeper's V227 run of (a) prints it, and any difference is an INFO row of the (a′)/(a″) kind.
- **The travel overlay** builds `buildProgram({...cfg, ...patch, _travel:true})` (:15319) with equipment `home_basic` ("Mini gym", :15487) or `minimal` (the retired travel tier, :8363; `noLoad` at :8436). The filter runs inside that build, so R2 reaches it by construction. Plain `minimal` builds print **308** capped RPE > 7 (final lens; ankle/wa 28, elbow/wa 28, hip/protect 8, hip/wa 48, knee/protect 28, knee/wa 28, lowback/protect 56, lowback/wa 56, shoulder/wa 28); with `_travel:true` the count is unprinted, and `_travel` + `home_basic` is the only path to the `heaviest pair` shape.

**This widens the differential; it does not change the rule.** Gate (a) was already written "any shape, any tier, any slot" and Mario approved a clamp on capped patterns, not a clamp on four equipment values. Gatekeeper's lattice must add `home_basic`, and one travel-overlay row (h) must build through the overlay path.

## 6. Corrected blast radius (coaching terms)
- **(i) Literal:** 3,372 on L432 (3,336 capped-final + 36 Burpees), 106 on L9, 12 mario knee/wa. Plus `home_basic` (unprinted cue count; read on the gate's V227 run).
- **(ii) Clamp, bodyweight Mains:** 300 on L432, segment for segment as ruled. **(ii-b)** 16 Burpees Mains, lowback/protect 8 + lowback/workaround 8, W1–W2, intermediate and advanced, athletic and strength. **Total 316.** **(ii-c, new)** `home_basic` 120 (final lens). **(ii-d, new)** travel overlay: unprinted, same shapes.
- **(iii) Swap ends:** unchanged (196/210, 196/210, 202/218 → 0). **(iii-b)** L9 114 pairs → 0 live and boot, build 52/118 → 0; shapes 50 `@ RPE 7`, 12 `each @ RPE 7`, 48 bwsets, 4 bwsets+rest. Wave: 516 capped pairs on L432 `support_athletic`; 20 printed rows 20 → 0.
- **(iv) Stored literal:** 70, carry 60 → 0, 60 re-cued + 8 bwsets + 2 uncapped no cue, undo 70/70.
- **Not moving:** unchanged, with the 18 ankle/protect Burpees Mains added to the byte-identical set.

## 7. Corrected gate claims (`g228_d193_caprpe`, keyed on ia-version 227 as ruled)
- **(a)** U per §2. 0 of U names RPE > 7. V227: **316** on L432; `home_basic` lattice **120** (final lens; filter-lens read on the V227 run). **(a′)** INFO 4. **(a″)** INFO 52.
- **(b)** Unchanged claim; lattice widened to include `home_basic`. HALF_MANNY `0ac7da6b1691a8e1`, era row [228]=[227]; measure's 37/37 uninjured byte-identity stands.
- **(c)** Unchanged.
- **(d)** Agreement, one row per shape in §3: `RPE 7 (leave 3 or more in reserve)`, `RPE 7 (leave ~3 reps in reserve)`, `RPE 7 (leave ~3 in reserve)`; a grammar `@ RPE 7` with no gloss is agreement, not a flag. No card the clamp wrote keeps `stop 2 reps short`, `~2 reps`, `~1 rep` or `heaviest pair`.
- **(e)** Unchanged (196/210, 202/218 read 8 on V227). CF ends: live 196 bwsets RPE 7 + 14 re-cued "three"; build 202 + 16.
- **(e′, new)** Class (iii-b). L9: 114 → 0 live and boot, live == boot 114/114, build 52/118 → 0. Wave: the printed pairs (knee/wa commercial beginner support_athletic W5 and W6 tue `Sumo deadlift` → `Barbell box squat` and `Leg press`; lowback/wa commercial advanced support_athletic W1 and W2 tue `Chinups` → `Feet-elevated inverted rows` and `Inverted rows (bodyweight)`) read RPE 7 live and boot with the §3 texts; V227 reads 8.5, 9 and 8 on 20/20. INFO: 912 donors, 516 capped pairs on L432.
- **(f)** Population **70** per mode, both modes run: carry 0/70 live and boot, 60 re-cued "three", 8 bwsets RPE 7, 2 uncapped with no cue, undo 70/70. `_stripCapCue` 0 false strips of 1,722.
- **(g)** Unchanged.
- **(h, new)** Travel overlay. One injured config built through `{...cfg, ...patch, _travel:true}` with `home_basic` and with `minimal`: 0 cards in U above RPE 7; the `heaviest pair` shape on a capped card reads `3 sets of 8 to 12 — RPE 7 (leave ~3 in reserve)`. V227 count read on the gate's V227 run; if the overlay build produces 0 `heaviest pair` cards on capped patterns, that part becomes a synthetic-donor row and says so.

## 8. Sabotage
S2's expected trip is **(a) 316**, not 318. Add **S9**: clamp drops the number but keeps `(heaviest pair you can find)` → (d), (h). **S10**: clamp drops the wave number but keeps `~2 reps` → (d), (e′). S1, S3–S8 unchanged.

## 9. Corrected parked lines (replace the ruling's text verbatim)
- **P-FILTERLAST.** As written, with the 36 cued Burpees located correctly: 24 `Leg superset B` + 12 `Leg circuit — runner armor`, lowback/protect bodyweight.
- **P-BWFALLBACK (next build, Mario's doctrine call already made).** `_bwFallback` (:6530) has no hip-extension row, so `Banded hip thrust`, the lift the lowback plan chose for being spine-neutral (:8614–8616), falls to `Burpees` through the catch-all (:6537). Printed on V227 L432: 54 `Main — Burpees`, 18 each on lowback/protect, lowback/workaround and ankle/protect; of the 36 lowback Mains, 16 print RPE 8 with warmup sets and 3 min rest (the D193 (ii-b) population), 12 the beginner floor and 8 the prevention ceiling; the 18 ankle/protect Mains (W3–W4, every experience and focus, 8 at RPE 8) put a jump on a protected ankle. Plus 36 cued Burpees accessories on lowback/protect. The plan's own no-band pool already names the fallbacks (`Single-leg glute bridge`, `Single-leg hip thrust (shoulders on bed)`, :8467/:8471). Measure first: every `_bwFallback` catch-all landing, all regions and tiers, with the fallback's `_pattern` printed so (a″) can be expected to reach 0.
- **P-ADDSEAM** unchanged.

## 10. Mario's approvals: unchanged
Nothing here changes the behaviour he approved. The wording ` — hold RPE 7, three in the tank` ships; R5 stands (no stored-string rewrite); D192 rides; P-BWFALLBACK is queued next. What changed is the size of the differential: 316 on L432 (not 318), 3,372 cued (not 3,336), 70 stored (not 140), plus two injured-only tiers (`home_basic`, travel overlay) moving in the same approved class. His own program is uninjured and byte-identical. Tell him the corrected numbers in the session report; no new decision is required.

## Before (V227, printed)
```
L432  cued 3,372 (capped-final 3,336 + Burpees 36: Leg superset B 24, Leg circuit — runner armor 12)
L432  capped RPE>7: filter lens 316 (300 Mains + 16 Burpees Mains) | final lens 304 (300 + 4 Chest volume)
lowback/protect bodyweight  Main — Burpees 18: 8 "3 sets — RPE 8 (stop 2 reps short of failure), ramp up with 2–3 warmup sets, 3 min rest" | 6 beginner "RPE 6–7 (leave 3–4 in reserve — learn the movement)" | 4 prevention "RPE 7 (leave ~3 in reserve)"
lowback/workaround bodyweight  Main — Burpees 18, same split (8 at RPE 8)
knee/wa commercial beginner support_athletic  W5 tue Sumo deadlift -> Barbell box squat {squat}  live "4×3 — RPE 8.5 (leave ~2 reps in reserve), ramp up with 2–3 warmup sets, 3 min rest"
knee/wa commercial beginner support_athletic  W6 tue Sumo deadlift -> Barbell box squat {squat}  live "4×3 — RPE 9 (leave ~1 rep in reserve), ramp up with 2–3 warmup sets, 3 min rest"
lowback/wa commercial advanced support_athletic  W1 tue Chinups -> Feet-elevated inverted rows {row}  live "4 sets — RPE 8 (stop 2 reps short of failure)"
home_basic 108 injured builds  capped RPE>7 120 (final lens) | minimal 308 | heaviest pair 0 on every plain build
HALF_MANNY 0ac7da6b1691a8e1
```

## After (V228, expected; CF copy printed)
```
L432  (i) 3,372 "three" | (ii) 300 | (ii-b) 16 | total clamp 316 | (a′) 4 untouched | (a″) 52 | UNCLASSIFIED 0
  W5 tue Sumo deadlift -> Barbell box squat  live == boot  "4×3 — RPE 7 (leave ~3 reps in reserve), ramp up with 2–3 warmup sets, 3 min rest"
  W6 tue Sumo deadlift -> Barbell box squat  live == boot  "4×3 — RPE 7 (leave ~3 reps in reserve), ramp up with 2–3 warmup sets, 3 min rest"
  W5 tue Sumo deadlift -> Leg press          live == boot  "4×5–8 — RPE 7 (leave ~3 reps in reserve), ramp up with 2–3 warmup sets, 3 min rest"   (rep window is D177's, not this ruling's)
  W1 tue Chinups -> Feet-elevated inverted rows  live == boot  "4 sets — RPE 7 (leave 3 or more in reserve)"
  grammar end  "3×8–12 @ RPE 7" / "3×10 each @ RPE 7"   (no gloss, no cue)
  loadCapped end (travel + home_basic)  "3 sets of 8 to 12 — RPE 7 (leave ~3 in reserve)"
  (iv) 70: carry 0, 60 re-cued "three", 8 bwsets RPE 7, 2 uncapped no cue, undo 70/70
home_basic  0 in U above RPE 7 (V227: 120 final lens)
HALF_MANNY 0ac7da6b1691a8e1 (unmoved) | uninjured 37/37 byte-identical
```

**Recommendation:** Ship D193 at V228 exactly as Mario approved, with the counts corrected to 316 / 3,372 / 70, gate (a) keyed to the filter-time pattern with the Burpees inside U, R2 stated as the four-shape table in §3 (grammar stays gloss-free, the wave and `heaviest pair` glosses restate from `rpeFromWave` and :8292), and gatekeeper's lattice widened to `home_basic` plus one travel-overlay row; builder is not blocked by anything in the brief's item (5).

**Counter:** Hold builder until measure runs the CF copy on the `home_basic` lattice and a travel-overlay build so every V227 number is pre-stated rather than read off the gate's own first run; rejected because the rule is tier-blind and already approved as "any tier", the gate's V227 run is itself the measure for those rows, and a row that cannot pass parks under standing ruling 7 instead of shipping.

---

# D193 — Re-ruling 2 (Amendment 2): the hold is written on the card and never travels; a held pattern does not test; a toast reports every number the plan changed

Ruled on the working tree (V227 + slices 1 and 2, `ia-version` 228, `HALF_MANNY` `0ac7da6b1691a8e1` printed unmoved this session), 2026-10-01, V228 chat. Evidence: `tests/measure/v228_rulings/d193_caprpe_ruling.md` (prior ruling, Mario's decisions, Amendment 1) and measure's "Post-build pre-scan" in `tests/measure/v228_rulings/measure_caprpe_v227.md` (script `tests/measure/v228_caprpe_carry.js`, output `tests/measure/v228_caprpe_carry.out.txt`), both read in full, plus my own prints this session on V227 and on the working tree (scratch `/private/tmp/claude-501/-Users-CanasBangin-Desktop-TheBig6V2/3a93b6bd-f518-4d1a-a71e-2afb713a85f0/scratchpad/coach2/f1.js`, `f1b.js`, `f1c.js`, outputs `*.out.txt`; seed 76308, clock 2026-09-24, start 2026-08-24). Standing ruling 7 parked the build correctly: measure refuted the ruling's "live == boot" claim ((e), (e′), and the single-writer premise as R2 used it), and I retract that claim as stated. R1, R4, R5, R6 and the four-shape table in Amendment 1 §3 stand. R2 and R3 are re-stated below; one rule is added (R7) and one toast rule (R8).

## Finding

**F1 is real and live is the wrong side.** Printed on the working tree, mario knee/workaround, W5 thu, slot `[Leg superset B] Single-leg hip thrust "2×6–10 @ RPE 8"`, chain Barbell hip thrust → Leg extension → Barbell good mornings:
```
V228 live  hop1 Barbell hip thrust    "2×6–10 @ RPE 8"   toast: Same job, same numbers.
           hop2 Leg extension         "2×6–10 @ RPE 7"   toast: Same job, same numbers.        (clamp fired: leg_iso is capped)
           hop3 Barbell good mornings "2×6–10 @ RPE 7"   toast: Same job, same numbers.        (hinge is NOT capped for knee/wa)
V228 boot  Barbell good mornings "2×6–10 @ RPE 8"
V228 build Barbell hip thrust    "2×6–10 @ RPE 8"   (exSwapPrefs never chains: first hop only, pre-existing)
V228 DIRECT one hop Single-leg hip thrust -> Barbell good mornings  "2×6–10 @ RPE 8"
V227 live == boot == direct "2×6–10 @ RPE 8" on the same chain
```
Two routes to the same card, two doses. That is the latch D190 named and rejected ("a Nordic curl must not print RPE 7 because two taps ago the athlete passed through a goblet squat"). The clamp is the plan speaking about the leg extension; it has no business on a good morning the knee plan does not hold. Boot prints the athlete's dose; live prints the plan's hold on a movement the plan does not cap. Measure: 5,840 new live ≠ boot chains on the D190 lattice, every one ending on an uncapped movement, boot == pre-clamp carry on 5,840/5,840. The 487 pre-existing V227 chains are D191's revisit class and other V227 residue (my lowback/wa print above is one: Incline curl → inverted rows → Incline curl → Dumbbell curl, live ≠ boot on V227 too); not this ruling's.

Why the ruling missed it: D190 made the carry blind to the hold by stripping a suffix. The clamp is not a suffix. It rewrites the number in place, and once `8` has become `7` no stripper can find the 8. "One writer" was true; "the carry is blind to what the writer wrote" stopped being true the moment the writer could change a number.

**F2 is real and the number-only rewrite is the wrong card.** Printed, `commercial|strength|beginner|lift|knee/workaround`, 6-week program, W6 thu:
```
V227  [Main — Barbell box squat]  "Work up to one heavy set of 3 to 5 reps at RPE 9. Technique stays crisp. No grinding. Log the weight and the reps. That set is your new baseline."
V228  [Main — Barbell box squat]  "Work up to one heavy set of 3 to 5 reps at RPE 7. Technique stays crisp. No grinding. Log the weight and the reps. That set is your new baseline."
V228  W6 tue [Main — Barbell Romanian deadlift]  "… at RPE 9. … That set is your new baseline."   (hinge uncapped: the test stands)
uninjured twin  W6 thu [Main — Front squat]  "… at RPE 9 …"   (byte-identical on both trees)
```
"Heavy set" and "new baseline" are a rep-max test's words. At RPE 7 on a held knee they tell the athlete to push the one pattern the plan is holding. The e1RM card is advisory ("Optional — estimate a one-rep max from any recent set, just for your own records. Your training still runs on RPE.", :17556), so nothing programmatic reads the set; the harm is the instruction on the card.

**F4 is real.** Printed, knee/wa `support_athletic` W5 tue `Sumo deadlift → Barbell box squat`: card `4×3 — RPE 8.5 (leave ~2 reps in reserve), …` → `4×3 — RPE 7 (leave ~3 reps in reserve), …`, toast `Barbell box squat in, sumo deadlift out. Same job, same numbers.` Lowback/wa advanced athletic W1 tue `Chinups → Feet-elevated inverted rows`: card `4×6 — RPE 8 …` → `4 sets — RPE 7 (leave 3 or more in reserve)`, toast `… No load to add here, so take the sets to the same effort.` Both false. Measure: 1,172 pairs on the D177 L1 sweep. "Same numbers is a promise the app has to keep" (:14323) and R3's "toasts do not move" was wrong once the clamp could move a number the donor named.

**F3 and the widened population are the approved class.** Every one of the G3a/G3d/G3e/G3f/G3c-off fails is a clamp on a capped target (0 on uncapped, 0 unclassified), and the 2,247 changed build cards on the D177 lattice are literal, clamp or the Burpees rename. Mario approved "a capped pattern never prints above RPE 7, any shape, any tier, any slot". These are its size, not a new behaviour.

## What ships (rule level; siting and form are the session's)

**R2 (re-stated). The filter writes the hold on the movement on the card. The hold is a cue when the detail names no RPE and a clamp when it names one above 7.** Unchanged from Amendment 1 §3 except that the test prose is a fifth shape (R7). Slice 1's clamp inside `applyInjuryFilter` survives as-is: the filter is still the single writer and the clamp belongs there.

**R3 (re-stated). The dose that travels down a chain is the dose beneath the hold. Nothing un-writes a hold; the carry reads what was there before the plan wrote it.** D190 R2 generalised: stripping the cue was one way to read beneath the hold while the hold was only a suffix. From V228 the live tap keeps the pre-hold dose beside the card (the `_swapDetailFor` result before the re-filter) and the next hop carries from that, not from the card. Boot already does this by construction (`applySessionSwaps` replays the records with one filter at the end), so live == boot on every chain whose store keeps one record per hop, and a chain's end equals the direct one-hop swap to the same movement. Constraints on the kept dose: it never prints, never enters a sheet row, a digest or a toast, and never changes what undo restores (undo restores `rx.d` as recorded, R5's precedent). If it rides into `ia_hist_` through the day snapshot (`snapshotDay` deep-copies the day, :1320) that is harmless to the record, which is name and detail; gatekeeper's trained-day byte-identity rows compare those two fields as they do today. For a hop off a native card (no prior tap) the carry reads the card as it stands, as today: the stored grid has no "beneath" for a card the build clamped. **Expected (mario W5 thu): hop1 `2×6–10 @ RPE 8`, hop2 Leg extension `2×6–10 @ RPE 7`, hop3 Barbell good mornings `2×6–10 @ RPE 8`; boot `@ RPE 8`; direct `@ RPE 8`.** The number goes back up at hop 3 because the plan held the leg extension, not the good morning.
Rejected: filter between hops at boot so both sides print RPE 7 on the uncapped end. One lens, yes, but it would make the latch the rule: the DIRECT print above shows the same athlete swapping the same donor onto the same good morning in one tap gets RPE 8. Route-dependent prescription is what D190 exists to forbid.
Rejected for V228: live recomputes the slot from the stored grid plus the day's records (the boot lens called from the tap). It is the cleaner single lens but it touches D181 R5 (hist-restored days are never replayed) and would surface D191's dropped record on the live card mid-session. Parked as the counter below.

**R7 (new; Mario's doctrine call, D193-HELDTEST). A held pattern does not test.** On a capped pattern the strength test-week prescription (`_testRx`, :8950, the fifth RPE shape) is replaced by the hold, in the filter like every other shape: one working set at the cap, logged, no baseline. The two tests on patterns the plan does not hold run as written (printed: the RDL test stays at RPE 9 under knee/wa). Exact words, coach voice, no mid-sentence hyphens or em-dashes:
`Work up to one working set of 3 to 5 reps at RPE 7. Technique stays crisp. No grinding. Log the weight and the reps. Your injury plan holds this lift, so there is no new baseline here.`
Why: the cap is the plan's instruction to keep the pattern under RPE 7 for the whole program; a rep-max test is RPE 9 by definition on that pattern; prescription owns the fixed dimension and the plan owns the hold, so the plan wins and the test waits for a healthy joint. Same doctrine as travel (maintain, not progress) applied to an injured pattern. Reaches both the native W6 Main (28 build cards on the D177 lattice) and the live swap of an uncapped test onto a held target (56 rows, RDL → box squat). Uninjured programs and every uncapped test byte-identical.
Why this is Mario's: it removes a test from an injured athlete's program. Recommend yes. Counter: keep the test at the cap, number-only ("one heavy set of 3 to 5 at RPE 7 … new baseline"), on the grounds that a logged RPE 7 set is still a number to progress from; rejected because the words "heavy" and "baseline" are the instruction to push, and the e1RM card already offers the athlete a submax estimate without lying to him on the Main.

**R8 (new). The toast reports every number the plan changed on the card.** When the re-filter's clamp changed an RPE the donor named (clamp output ≠ its input), the toast says the hold instead of claiming the effort carried. A cue (an instruction added where no number was) still moves no toast: D190 R4 stands, "Same job, same numbers." is still true of a `2×10` that gains a cue. Exact strings, one per existing branch:
- verbatim pair: `{To} in, {from} out. Same sets, same reps. Your injury plan holds this one at RPE 7.`
- unloadable pair: `{To} in, {from} out. No load to add here. Your injury plan holds this one at RPE 7.`
- window pair: `{To} in, {from} out. The load runs out before the reps do here. Reps move to {a} to {b}. Your injury plan holds this one at RPE 7.`
Not a doctrine call: a toast that lies is a defect, and his own program is uninjured. The strings go to him quoted in the same message as D193-HELDTEST so he can veto the words in one breath; no decision gates the build on them.

**Slice 1: survives, with two added edits and one changed function.** (1) `_capRpeClamp` gains the fifth shape (R7). (2) One edit at the live hop site: the carry reads the kept pre-hold dose (R3). (3) One edit at the toast: the hold variants (R8). Slice 2 (version bump, era rows) unchanged. `HALF_MANNY` does not move (printed `0ac7da6b1691a8e1` on the working tree this session; every change above is behind `cfg.injury`).

## What deliberately does not change
R1 (` — hold RPE 7, three in the tank`), R4 (the stripper reads both wordings), R5 (no stored-string rewrite; undo restores the record), R6 (every reader as listed). Boot's replay and its single end-of-day filter: it is the side that was right. The build path (`exSwapPrefs` never chains: pre-existing, not this ruling's). The 487 V227 live ≠ boot chains (D191 and other residue; pinned not to grow, not closed). A hop off a native clamped card onto an uncapped movement carries the build's RPE 7 (route-independent, conservative, boot == live == direct): parked as P-HOLDBENEATH below, not a latch. Uninjured builds byte-identical.

## Before (printed this session on the working tree, V228 slices 1+2)
```
mario knee/wa W5 thu [Leg superset B] Single-leg hip thrust "2×6–10 @ RPE 8" -> Barbell hip thrust -> Leg extension -> Barbell good mornings
  live "2×6–10 @ RPE 7" | boot "2×6–10 @ RPE 8" | direct one hop "2×6–10 @ RPE 8" | live==boot false
knee/wa athletic W5 tue Sumo deadlift -> Barbell box squat  card "4×3 — RPE 7 (leave ~3 reps in reserve), …"  toast "Same job, same numbers."
lowback/wa adv athletic W1 tue Chinups -> Feet-elevated inverted rows  card "4 sets — RPE 7 (leave 3 or more in reserve)"  toast "… take the sets to the same effort."
strength beginner knee/wa W6 thu [Main — Barbell box squat] "Work up to one heavy set of 3 to 5 reps at RPE 7. … That set is your new baseline."
D190 lattice (measure): live != boot 6,327/18,580 (5,840 new, all uncapped ends; 487 V227 residue)
HALF_MANNY 0ac7da6b1691a8e1
```

## After (V228 final, expected)
```
mario knee/wa W5 thu chain: hop1 "2×6–10 @ RPE 8" | hop2 Leg extension "2×6–10 @ RPE 7" (toast: Leg extension in, barbell hip thrust out. Same sets, same reps. Your injury plan holds this one at RPE 7.) | hop3 Barbell good mornings "2×6–10 @ RPE 8" (toast: Same job, same numbers.)
  live == boot == direct "2×6–10 @ RPE 8"
Sumo deadlift -> Barbell box squat  card unchanged from today  toast "Barbell box squat in, sumo deadlift out. Same sets, same reps. Your injury plan holds this one at RPE 7."
Chinups -> Feet-elevated inverted rows  card unchanged  toast "Feet-elevated inverted rows in, chinups out. No load to add here. Your injury plan holds this one at RPE 7."
strength beginner knee/wa W6 thu [Main — Barbell box squat] "Work up to one working set of 3 to 5 reps at RPE 7. Technique stays crisp. No grinding. Log the weight and the reps. Your injury plan holds this lift, so there is no new baseline here."
  W6 tue [Main — Barbell Romanian deadlift] "… at RPE 9 … new baseline." (unchanged)   uninjured W6 thu Front squat unchanged
D190 lattice: live != boot 487/18,580, the same 487 chain ids as V227; uncapped ends == pre-hold carry 18,093/18,580
HALF_MANNY 0ac7da6b1691a8e1 (unmoved) | uninjured 47/47 byte-identical
```

## Blast radius (coaching terms, corrected and complete)
Injured athletes only, every goal, focus, tier and calendar. In addition to Amendment 1 §6:
- **(v) Live chains (R3).** A swapper who chains through a held movement onto an unheld one sees the athlete's dose on the unheld end, as boot and a direct swap already do. D190 lattice: 5,840 chains change live; boot and build unchanged. Pre-existing 487 unchanged.
- **(vi) Held test (R7).** Strength focus, programs of 6 weeks or fewer, W6 Main on a capped pattern: 28 build cards on the D177 L1 lattice (every one the one `_testRx` text); 56 live swap rows (uncapped test donor onto a capped target). Text replaced, not number-clamped.
- **(vii) Toasts (R8).** 1,172 pairs on the D177 L1 sweep (donor 7.5 to 9.5 → card 7): hold variant. Every other toast byte-identical.
- **D177 L1 lattice build (288 injured builds), the widened (i)/(ii):** 2,247 cards: literal 1,594; clamp bwsets 439 (`home_basic` Mains Squat (slow 3s tempo) 277 and Banded hip thrust 134, hypertrophy 45° back extension 28); clamp grammar `@ RPE 8` → `@ RPE 7` 130 (hypertrophy Reverse lunge (KB) 56, Dumbbell row 74, no gloss, per Amendment 1 §3); prose 28 (now R7's text); Burpees Mains 56 (the (ii-b) class on that lattice, inside U under the filter lens). 0 unclassified.
- **Not moving:** all uninjured builds; `HALF_MANNY`; every uncapped test; boot replay; build path; undo; stored strings.

## Gate claims (additions and corrections to Amendment 1 §7; all keyed on today's `ia-version` per standing rulings 2 and 4, REFUSE below 228, and each run on V227 fails at the stated count)
- **(e) and (e′) stand as single-hop rows** (my prints: Sumo → box squat and Chinups → inverted rows live == boot on both trees). The "live == boot" sentence is narrowed to single hops there; the chain claim moves to (i).
- **(i, new) Chain carry.** D190 lattice, every chain where the clamp fires on a non-final hop (18,580): live == boot on all but the V227 residue, and that residue is the same 487 chain ids (hand-listed from measure's V227 run, not re-read from the artifact); every uncapped end equals the pre-hold carry (18,093). Plus one hand row: mario W5 thu chain end == direct one-hop end == `2×6–10 @ RPE 8`. V228 slices 1+2: 6,327 ≠, 5,840 fail.
- **(j, new) Held test.** 28 build cards and 56 live rows print R7's text verbatim; 0 cards anywhere contain `at RPE 7. … new baseline` (the number-only shape); every uncapped `_testRx` card byte-identical to V227 (hand count read on the gate's V227 run); 0 on uninjured.
- **(k, new) Toast truth.** On the 1,172 clamp pairs the toast is the hold variant for the hand kind; 0 toasts say "same numbers" or "same effort" on a pair whose card RPE differs from the donor's; on every non-clamp pair the toast is byte-identical to V227. `g221` G6a's hand kind gains a `hold` flag from the hand cap table plus a hand RPE parse (independent oracle, never the engine).
- **(l) D177 verbatim rows re-scoped (G3a/G3d/G3e/G3f/G3c-off).** D177's claim is verbatim beneath the plan's hold: on uncapped targets byte-verbatim (0 fails, as today); on capped targets the card equals the hold applied to the donor (number 7, gloss by shape per Amendment 1 §3, rep token unchanged), above 227. V228 counts to absorb: 728 / 263 / 177 / 199 / 89. **G3c power 118** is the gate reader: `cueBlind` strips both wordings, the same shape as R4.
- **g227 gates.** Hand literals typed as "two" become version-predicated ("two" ≤227, "three" ≥228) so each still runs on V227; bH3 and every row asserting the class (iii) `2 sets — RPE 8 (stop 2 reps short of failure)` end expects `2 sets — RPE 7 (leave 3 or more in reserve)` above 227; the six injured c-DIGESTs are licensed to move, their new values printed by measure from the final tree before gatekeeper runs, never read off the gate's own first pass. Five `[228] = [227]` era rows: mechanical, agreed.
- **(a), (b), (c), (d), (f), (g), (h)** unchanged. (b) now also pins: boot replay and build path byte-identical to slices 1+2 on every injured config (R3 touches the live tap only).
- **INFO (P-HOLDBENEATH):** count of live chains whose hop 1 donor is a native build-clamped card and whose end is uncapped (the hold travels once, route-independently); read on V228, expected 0 when P-HOLDBENEATH lands.

## Sabotage (additions; S1 to S10 unchanged)
S11 live carry reads the clamped card (today's slice 1) → (i) 5,840. S12 boot filters between hops → (i) and (b). S13 hold sentence dropped from the toast → (k). S14 fifth shape number-only (today's text) → (j) 28 + 56. S15 fifth shape applied regardless of cap (the RDL test rewritten) → (b), (j). S16 kept dose printed as the card → (a) or (i).

## Measure before builder (standing ruling 7)
M4: the R3 carry on a CF copy, D190 lattice: live == boot 18,093/18,580, residue 487 by chain id, uncapped ends == pre-hold carry. M5: toasts on the 1,172 pairs → 0 false effort claims; non-clamp toasts byte-identical. M6: R7 text on 28 build + 56 live; uncapped tests unchanged; 0 uninjured. M7: `HALF_MANNY` `0ac7da6b1691a8e1` and uninjured byte-identity on the final CF. Any miss comes back here before a byte moves.

## Parked to §12
- **P-HOLDBENEATH (new).** A native card the build clamped has no dose beneath the hold in the stored grid, so a live swap off it onto an unheld movement carries RPE 7 once (route-independent; boot, live and direct agree; errs conservative). The fix is the stored grid keeping the pre-hold dose, a persisted-shape change. Measure first (count on the D190 lattice), rule after P-BWFALLBACK.
- **P-FILTERLAST, P-BWFALLBACK, P-ADDSEAM** as Amendment 1 §9. P-ADDSEAM gains: the add path's filter must write holds through the same kept-dose rule.

## Mario's approvals: what changes and what does not
Unchanged: the wording ` — hold RPE 7, three in the tank`; no stored-string rewrite; D192 P-UNDOKEY rides; P-BWFALLBACK is next. Changed: (1) **one new doctrine call, D193-HELDTEST**, a held pattern does not test (R7), with my text; (2) the toast strings (R8) reach him quoted, no decision required; (3) the build grows by one live-carry edit, the fifth shape and the toast variants, so **V228 waits for the re-ruled slice** rather than shipping slices 1+2 as they stand: those alone ship a route-dependent prescription to every injured swapper (5,840 of 18,580 chains on the D190 lattice).

**Recommendation:** Ship D193 at V228 with R3 as the kept pre-hold dose at the live tap, R7's held-test text on Mario's yes, and R8's hold toasts, slice 1 kept and extended rather than discarded, and gates (i), (j), (k), (l) plus S11 to S16 added, with M4 to M7 printed first.

**Counter:** Make live call the boot lens (recompute the slot from the stored grid and the day's records at each tap) so one function is the only carry and live == boot by construction with nothing kept on the item; rejected for V228 because it crosses D181 R5's hist-restored exemption and would print D191's dropped record on the live card, both unmeasured, while the kept dose closes the 5,840 with one edit and leaves boot, the side that was right, untouched.

---

# D193 — Amendment 3: the kept dose follows the card through boot and undo; the held-test words stay on the held lift; the toast gate claims only what the plan changed

Ruled on the working tree (V227 + slices 1 and 2, `ia-version` 228) and measure's CF2 copy (`/private/tmp/claude-501/-Users-CanasBangin-Desktop-TheBig6V2/3a93b6bd-f518-4d1a-a71e-2afb713a85f0/scratchpad/measure_caprpe/cf2/t_cf2.html`), 2026-10-01, V228 chat. Evidence: `/Users/CanasBangin/Desktop/TheBig6V2/tests/measure/v228_rulings/d193_caprpe_ruling.md` (all four parts) and measure's "Amendment 2 CF (M4–M7)" in `/Users/CanasBangin/Desktop/TheBig6V2/tests/measure/v228_rulings/measure_caprpe_v227.md` (script `tests/measure/v228_caprpe_cf2.js`, output `tests/measure/v228_caprpe_cf2.out.txt`), read in full, plus my own prints this session on CF2, the working tree and V227 (scratch `…/scratchpad/coach3/probe.js`, `probe2.js`, `probe4.js`, outputs `*.out.txt`; seed 76308, clock 2026-09-24, start 2026-08-24). Everything quoted below was printed in this session. **No new D-code and no new doctrine call.** Rule assumes Mario says yes to D193-HELDTEST; the decline case is two lines at the end.

## Finding

Items 1 and 3 are gate claims written wider than the rule. Item 2 is a real defect in the fifth shape. Item 4 is bigger than the brief: measure drove every chain in one page session, so M4 could not see that **the kept dose exists only in memory and only at the live tap**. Two ordinary routes rebuild F1's latch on CF2, printed on mario knee/workaround W5 thu:

- **Reboot between hops.** hop1 Barbell hip thrust `2×6–10 @ RPE 8` → hop2 Leg extension `@ RPE 7` (kept `@ RPE 8`) → reboot: slot `Leg extension @ RPE 7`, nothing kept (`ia_programs`, `ia_hist_PM`, `ia_swaps_PM` all carry no `_preHold`) → hop3 Barbell good mornings **live `@ RPE 7`**, boot after hop3 `@ RPE 8`, direct `@ RPE 8`. Slices 1+2 print the same 7/8; V227 8/8/8.
- **Undo onto a held card.** hop1 Leg extension `@ RPE 7` (kept 8) → hop2 Barbell good mornings `@ RPE 8` → undo (chip `Leg extension`): restored `@ RPE 7`, kept dose deleted → hop3 Barbell hip thrust **live `@ RPE 7`**, boot `@ RPE 8`, direct `@ RPE 8`. Measure's undo probe (B in my print too) undid back onto an uncapped card, where the latch cannot show.

Both are the route-dependent prescription D190 forbids and Amendment 2 ruled against. R3's sentence "live == boot on every chain whose store keeps one record per hop" was true only within one page session. I retract it as stated and re-state it below. The fix is not a new rule: it is R3's rule carried to the other two writers of a swapped card.

## 1. Gate (k) and the 458 — in scope, gate claim narrowed; the 458 parked as P-BWBUCKET

Printed on all three trees, no injury in play: `_swapDetailFor('Feet-elevated inverted rows', …)` reads `RPE 6.5 (leave ~4 reps in reserve)` → `3 sets — RPE 6 (leave 3 or more in reserve)`, `RPE 7.5 (leave ~3 reps in reserve)` → `4 sets — RPE 7 (…)`, `RPE 9 (leave ~1 rep in reserve)` → `4 sets — RPE 8 (stop 2 reps short of failure)`, `3×8 @ RPE 7.5` → `RPE 7`. `_bwSetsFromDetail` (:6754) has three effort buckets (`/rpe\s*6/`, `/rpe\s*7/`, else 8) and no cap input. The 458 are the reader's bucket, not the plan's hold: the 398 at 6.5 → 6 never touch the cap, and the 60 at 7.5 → 7 land on the hold's number by rounding, so the clamp's input already reads 7 and R8's own definition ("the plan changed a number") is correctly false there. Making R8 fire on them would need a second lens (raw donor RPE against the card) and would have the toast credit the plan for a rounding. The toast "take the sets to the same effort" at a half point is honest at the only resolution a bodyweight accessory has (Mario's Flag-2 no-load ruling, :6814).

**Rule.** R8 unchanged. **(k) narrowed:** on every pair where the re-filter's clamp changed the RPE the converted donor named, the toast is the hold variant for the hand kind; the hold toast appears on 0 other pairs; every other toast is byte-identical to V227. The hand oracle for "clamp pair": capped target by the hand cap table, and hand-bucketed converted-donor RPE > 7, where the hand bucket for an unloadable pair is the reader's own rule typed by hand (6 for `RPE 6.x`/light/easy, 7 for `RPE 7.x`, else 8) and for verbatim and window pairs the donor's named RPE. **Expected: 1,172 today + 71 (below, §2) = 1,243**, 0 false claims. **INFO row:** pairs outside that set whose card RPE differs from the donor's and whose toast claims the same effort: **458 on V227 and V228** (398 at 6.5 → 6, 60 at 7.5 → 7), pinned not to grow. **P-BWBUCKET (new, parked):** the unloadable reader rounds a half-point donor into three buckets and the toast says same effort; cap-blind, V227-identical, injured and uninjured alike (the 9 → 8 bucket on uncapped targets is the same class, population unmeasured). Measure both target classes before ruling; after P-BWFALLBACK. Nothing Mario approved moves.

## 2. R7 text on 113 uncapped targets — in scope and fixed: the fifth shape is recoverable by shape, so the carry reads beneath it

Printed on CF2, strength beginner commercial knee/workaround, W6 thu `[Main — Barbell box squat]` (R7 text): swap → `Barbell Romanian deadlift` (hinge, uncapped) **live == boot** `Work up to one working set of 3 to 5 reps at RPE 7. … Your injury plan holds this lift, so there is no new baseline here.`, toast "Same job, same numbers." Chain held test → Leg press (capped, R7 correct) → RDL: R7 on the RDL again. The sentence is false on a hinge the knee plan does not hold. Slices 1+2 print the number-only text there; V227 the RPE 9 test.

**Rule (R4 extended, R3 applied).** The held-test text is a cue in prose: it adds words where the plan holds, and unlike the number clamp it is lossless. `_testRx` (:8950) is one constant with three readers (:9126, :9208, :9255), so R7's text maps back to exactly one donor. The stripper the carry already uses at both hop sites (`_stripCapCue`, read at :10184 boot replay and :14309 live) recognises the fifth shape and returns `_testRx`'s text, exactly as it reads beneath ` — hold RPE 7, three in the tank`. The re-filter then decides the movement on the card: capped → R7 text; uncapped → the RPE 9 test, which is V227's card and the dose beneath the hold. Nothing un-writes a hold on a held lift; the carry reads what was there before the plan wrote it. Printed today: `_stripCapCue(R7 text)` is the identity (so this is one regex alternative, no constant), and `_stripCapCue` must stay the identity on `_testRx`'s own text and every non-cue detail. P-HOLDBENEATH keeps only the number clamp (lossy, conservative, route-independent); the prose leaves it.

**Doctrine check, the strongest counter:** a knee-held athlete swapping his held squat test onto a hinge gets a second hinge test that week (W6 tue already tests the RDL). That is his choice and D177's contract (the dose travels), it is what V227 did, and the alternatives are a false sentence (R7 on an unheld lift) or the number-only text R7 rejected. Mario's words do not change; only where they may appear: a held lift and nowhere else. **Expected live rows:** R7 on 127 (56 RPE 9 donors onto capped + 71 native held-test donors onto capped); the 113 uncapped targets print `_testRx` byte-identical to V227 with "Same job, same numbers." (true); the 71 move from "Same job, same numbers." to `{To} in, {from} out. Same sets, same reps. Your injury plan holds this one at RPE 7.` (true: one working set, 3 to 5 reps, held). 0 number-only anywhere.

## 3. The 2 Burpees — in scope under the filter lens; (j) was written under the final lens

Printed, strength beginner bodyweight lowback/workaround W6 tue `[Main — Burpees]`: V227 `Work up to one heavy set of 3 to 5 reps at RPE 9. … That set is your new baseline.` (a rep-max test on burpees, pre-sweep `Banded hip thrust {hip_ext CAP}`), slices 1+2 number-only at RPE 7, CF2 R7 text. Amendment 1 §2 already ruled U by the filter-time pattern and put the Burpees rename inside U; (j)'s "every uncapped `_testRx` card byte-identical" must use the same lens. **Corrected (j), build:** R7 text on **30** (28 capped-final + 2 filter-capped Burpees), 0 number-only, uncapped-by-filter-lens `_testRx` cards byte-identical to V227 **102/102**, uninjured 0 and 96/96. The 2 join (a″) INFO (filter-capped, final-uncapped; expires with P-BWFALLBACK) and are 2 of the 56 Burpees Mains in Amendment 2's D177 L1 breakdown: 54 take the number clamp, 2 take R7's text; 2,247 unchanged. P-BWFALLBACK gains the finding: on V227 the fallback put a rep-max test on burpees. Right text, wrong movement, as Amendment 1 said.

## 4. Undo and the kept dose — in scope and fixed: the dose beneath a card travels with the card through every writer

Three writers put a swapped card on the day: the live tap, the boot replay (`applySessionSwaps`, replay then one filter), and undo (`undoSwap` restores `rx.d` from the record). R3 as measured keeps the dose at the first only. **Rule:**
- **Live tap:** as CF2 (kept beside the card, never printed, never in a sheet row, digest or toast).
- **Boot replay:** keeps the pre-filter replay result beside each replayed item before the day's single filter, the same dose the live tap would have kept (the filter copies item fields through `{...it,name,detail}`, so it rides). This closes the reboot route.
- **Undo:** restores the dose beneath the restored card with the card. The record already stores the from-card's detail for undo and nothing else (D177 R4, `rx:[{s,i,d}]`); it now stores the from-card's kept dose beside it, and undo restores both. A record without it (every record from before V228, and every hop off a native card) restores the card with nothing kept, and the next carry reads the card as it stands, which is the P-HOLDBENEATH behaviour: route-independent and conservative. Measure's "delete on undo" is therefore right only when there is nothing to restore; leaving the undone hop's dose in place is wrong (a stale dose from a card no longer on the day) and is a sabotage row. **Siting note for builder:** undo's kept dose comes from the record, never from `applySwapPrefs`' intermediate (undo calls `applySwapPrefs` and then overwrites the detail from the record).
- **Scope guard:** the dose is kept only when the plan can write a hold (`cfg.injury`). On an uninjured program the card is its own beneath; nothing is kept and the live item stays byte-identical to V227 as an object.
- **Persistence:** the record field is an additive, optional field on `ia_swaps_` with D177 R4's exact precedent and fallback. The item field may be copied into `ia_hist_` by the day snapshot on a trained day (`snapshotDay` is a JSON deep copy, :1320) and into `ia_programs` by `applyRestMove` (:1417); nothing reads it back from a store except the two carry sites and undo, on the item it describes, where it is still true for an unchanged card. The build path never writes it. HALF_MANNY and every uninjured digest are of `buildProgram` output and do not see it (printed `0ac7da6b1691a8e1` on CF2, uninjured 133/133).

This is R3's rule, not a new one, and it changes nothing Mario approved: it closes the same latch Amendment 2 named on two routes M4 did not drive. The undo-then-boot result (18,580/18,580 == slices 1+2) stands; the 2,710 live-after-undo differences are R3 correctly propagating (the pre-last-hop card differs, 2,710/2,710). The ~1,500 chains on both trees where undo does not restore the pre-last-hop card (17,089 and 17,003 of 18,580) are not this ruling's: INFO, read on V227 by gatekeeper, D191/D192's class.

## Gate claims (corrections to Amendment 2; keyed on today's `ia-version`, REFUSE below 228)
- **(i) Chain carry** gains two rows. **(i-r) reboot:** every D190-lattice chain driven with a reboot before its last hop: live == boot == in-session end on all but the 487 residue (18,093/18,580); slices 1+2 and CF2 both fail (mario W5 thu: 7 vs 8). **(i-u) undo onto a held intermediate then one more hop:** live == boot == direct one-hop; lattice sized by M8; CF2 fails (mario: Barbell hip thrust 7 vs 8 vs 8). Plus the two hand rows above.
- **(j)** as §3 (build 30 / 0 / 102/102 / 0 uninjured) and §2 (live: R7 on 127, `_testRx` verbatim on 113 uncapped targets byte-identical to V227, 0 number-only).
- **(k)** as §1: 1,243 hold variants, 0 false claims, 0 hold toasts off the clamp set, every other toast byte-identical to V227; INFO 458 pinned.
- **(f)** adds: `_stripCapCue(R7 text) === _testRx` text; identity on `_testRx` itself and on every non-cue detail (0 false strips of 1,722 + HALF_MANNY's 9 "tank" cards).
- **(b)** adds: an uninjured live swap leaves the item with no kept dose (item JSON byte-identical to V227 after the hop); build path byte-identical to slices 1+2 (18,580/18,580 as measured).
- **(a″)** INFO 52 on L432 unchanged; on the D177 L1 lattice the 2 Burpees W6 tue Mains are named in it.
- **INFO P-HOLDBENEATH** now counts number-clamp natives only (expected 113 fewer than CF2's prose count, i.e. 0 R7 rows on uncapped targets).

## Sabotage (additions; S1–S16 stand, S16 and the undo row re-worded)
S17 stripper does not map R7 → (j) 113 on uncapped targets, (k) 71. S18 boot replay keeps no dose → (i-r) 18,093. S19 undo deletes the kept dose (measure's CF2 line) → (i-u). S20 undo leaves the undone hop's dose on the restored card → (i-u) and (a) or (i) (a bwsets dose printed on a loaded lift at the next hop). S21 dose kept on uninjured programs → (b) object row. S19 replaces the earlier reading of S16's undo case; S16 (kept dose printed as the card) stands.

## Measure before builder (standing ruling 7) — M8 on a CF3 copy
The CF2 surgeries with the undo line replaced by restore-from-record, plus the stripper's fifth shape, the boot-side kept dose, the record field and the injury guard. Print: (i-r) and (i-u) on the D190 lattice; (j) 30 / 127 / 113 / 0; (k) 1,243 / 0 / 458 INFO; (f) strip identity; `ia_programs`, `ia_hist_`, `ia_swaps_` contents after a hop, after a rest move and after a trained-day swap; HALF_MANNY `0ac7da6b1691a8e1`; uninjured 133/133 and the object row. Any miss returns here before a byte moves.

## Parked (replace the prior text)
- **P-HOLDBENEATH:** number clamp only. A native card the build clamped has no dose beneath its number in the stored grid (8, 8.5 and 9 all became 7), so a live swap off it onto an unheld movement carries 7 once, route-independently. The prose shape is out of this class as of Amendment 3. Measure first, rule after P-BWFALLBACK.
- **P-BWBUCKET (new):** §1.
- **P-BWFALLBACK:** adds the 2 W6 tue strength Burpees Mains, where V227 printed a rep-max test on burpees.
- **P-FILTERLAST, P-ADDSEAM:** unchanged; P-ADDSEAM's filter must keep the dose through the same rule.

## Mario
No new decision. D193-HELDTEST's words are unchanged and now appear only on a lift the plan holds; the R8 strings are unchanged. The build grows by the boot-side dose, the record field and undo's restore (engineering, the session's to site and slice; the record field is additive on `ia_swaps_` with D177 R4's precedent, and I recommend it over leaving an undo-shaped latch). Tell him in the report: the kept dose now survives a reboot and an undo, which the first measure could not see. **If he declines D193-HELDTEST:** the fifth shape, S14, S15, S17 and (j) go; the number-only text stays as slices 1+2 print it, and the 113 uncapped rows print it too, which is P-HOLDBENEATH's conservative class (true prescription, no hold sentence), not a false card; the 2 Burpees print the number-only text and stay in (a″). Everything else here stands.

## Before (printed this session)
```
mario knee/wa W5 thu  Single-leg hip thrust "2×6–10 @ RPE 8"
  CF2 reboot route: hop1 Barbell hip thrust "@ RPE 8" | hop2 Leg extension "@ RPE 7" (kept "@ RPE 8") | REBOOT (nothing kept; no store carries _preHold) | hop3 Barbell good mornings LIVE "@ RPE 7" | boot "@ RPE 8" | direct "@ RPE 8"
  CF2 undo route:   hop1 Leg extension "@ RPE 7" | hop2 Barbell good mornings "@ RPE 8" | UNDO -> Leg extension "@ RPE 7" (kept deleted) | hop3 Barbell hip thrust LIVE "@ RPE 7" | boot "@ RPE 8" | direct "@ RPE 8"
  slices 1+2 both routes live "@ RPE 7" / boot "@ RPE 8" | V227 "@ RPE 8" on every print
strength beginner commercial knee/wa W6 thu [Main — Barbell box squat]
  CF2 -> Barbell Romanian deadlift (uncapped) live == boot "Work up to one working set of 3 to 5 reps at RPE 7. … Your injury plan holds this lift, so there is no new baseline here."  toast "Same job, same numbers."
  CF2 -> Leg press (capped) R7 text, toast "Same job, same numbers." | chain -> Leg press -> RDL: R7 text on the RDL
  slices 1+2 -> RDL "Work up to one heavy set of 3 to 5 reps at RPE 7. … That set is your new baseline." | V227 "… at RPE 9. … new baseline."
strength beginner bodyweight lowback/wa W6 tue [Main — Burpees]  V227 "… heavy set … RPE 9 … new baseline." | slices 1+2 "… RPE 7 … new baseline." | CF2 R7 text
reader buckets, three trees identical, cap-blind: 6.5 -> "RPE 6 (leave 3 or more in reserve)" | 7.5 -> "RPE 7 (…)" | 9 -> "RPE 8 (stop 2 reps short of failure)"
M5: 458 pairs claim same effort with card RPE ≠ donor RPE, toast and card V227-identical (398 at 6.5→6, 60 at 7.5→7)
HALF_MANNY 0ac7da6b1691a8e1 (V227 == slices 1+2 == CF2)
```

## After (V228 final, expected)
```
mario W5 thu reboot route: replayed Leg extension "@ RPE 7" keeps "@ RPE 8" beneath | hop3 Barbell good mornings live "@ RPE 8" == boot == direct
mario W5 thu undo route:   undo -> Leg extension "@ RPE 7" with "@ RPE 8" beneath (from the record) | hop3 Barbell hip thrust "@ RPE 8" == boot == direct
held test -> Barbell Romanian deadlift: live == boot "Work up to one heavy set of 3 to 5 reps at RPE 9. … That set is your new baseline." (V227 byte-identical)  toast "Same job, same numbers."
held test -> Leg press: R7 text, toast "Leg press in, barbell box squat out. Same sets, same reps. Your injury plan holds this one at RPE 7."
held test -> Leg press -> RDL: RDL "… RPE 9 … new baseline." == boot == direct
W6 tue [Main — Burpees] lowback/wa bodyweight strength: R7 text (filter lens: hip_ext held; (a″) until P-BWFALLBACK)
D190 lattice: live == boot 18,093/18,580 in-session, after a reboot, and after an undo onto a held card; residue the same 487 ids
toasts: 1,243 hold variants, 0 false claims, 458 INFO byte-identical to V227 (P-BWBUCKET)
HALF_MANNY 0ac7da6b1691a8e1 (unmoved) | uninjured 133/133 | uninjured live swap keeps no dose
```

**Recommendation:** Ship D193 at V228 with the kept dose written by all three writers of a swapped card (live tap, boot replay, undo from the record, injured programs only), the stripper reading beneath the held-test prose so R7's words appear only on a held lift, (j) and (k) re-scoped as above with the 458 pinned as INFO under P-BWBUCKET, and M8 printed on a CF3 copy before builder.

**Counter:** Ship CF2 as measured and park the reboot and undo routes with P-HOLDBENEATH on the grounds that each needs a chain through a held intermediate; rejected because closing the app between two swaps is ordinary use, both routes print a route-dependent dose today (7 live, 8 at boot) that D190 and Amendment 2 already ruled against, and the fix is one rule applied twice more rather than a new one.

---

## Mario's decisions, round 2 (2026-10-02, V228 chat) — main session record, not coach text
"1, concur 2. concur 3. concur 4. concur", answering, by ruling name:
1. **D193 SPLIT.** V228 ships R1 (` — hold RPE 7, three in the tank`) and R4 (`_stripCapCue` strips both wordings, identity on every non-cue detail) only, with D192. **The clamp family moves to V229 in a fresh chat:** R2 (clamp in `applyInjuryFilter`, Amendment 1 §3 four shapes + R7's fifth), R3 (the kept pre-hold dose on all three writers: live tap, boot replay, undo from the record; injury-guarded; additive `ia_swaps_` record field, Amendment 3 §4), R7, R8, and their gates (a), (d), (e), (e′), (h), (i), (i-r), (i-u), (j), (k), (l) and sabotage S2, S3, S6, S7, S9–S21. Slice 1's clamp script `tests/edits/v228_s1_d193_caprpe.py` is PARKED for V229 (not applied at V228). Without R2, V228 moves no number: every injured card differs from V227 by the word "two" → "three" only, and class (iii) stays RPE 8 exactly as on V227.
2. **D192 P-UNDOKEY ships at V228** as re-ruled in `tests/measure/v228_rulings/d192_undokey_ruling.md`.
3. **D193-HELDTEST: yes** (R7's text, held lifts only), for V229.
4. **R8 hold toasts: ship as written**, for V229.

---

# D193 — Amendment 4: six M8 misses, every one a count or a gate-scope correction under the existing number; the toast trigger keys on the dose the clamp was handed; the undo-route shape difference is V222 note (3), not the hold

Ruled on shipped V228 (HEAD 2c1a89c, `ia-version` 228) and measure's CF3 copy (`/private/tmp/claude-501/-Users-CanasBangin-Desktop-TheBig6V2/7d4ab7fc-ad06-4917-b0e4-faf3f7d43e66/scratchpad/measure/t_cf3.html`), 2026-10-02, V229 chat. Evidence: `/Users/CanasBangin/Desktop/TheBig6V2/tests/measure/v228_rulings/d193_caprpe_ruling.md` (all parts, Mario's round 2 at the tail) and `/Users/CanasBangin/Desktop/TheBig6V2/tests/measure/v229_rulings/measure_caprpe_cf3_v228.md` (M8; script `tests/measure/v229_caprpe_cf3.js`, output `tests/measure/v229_caprpe_cf3.out.txt`), both read in full, plus my own prints this session on V227, V228 and CF3 (scratch only: `/private/tmp/claude-501/-Users-CanasBangin-Desktop-TheBig6V2/7d4ab7fc-ad06-4917-b0e4-faf3f7d43e66/scratchpad/coach/a4.js`, output `a4.out.txt`; seed 76308, clock 2026-09-24, start 2026-08-24; measure's chain helpers required read-only). Everything quoted below was printed in this session unless marked "measure". **No new D-code and no new doctrine call.** R1 to R8 stand as Amendments 1 to 3 left them; one trigger sentence (R8) is restated to what Amendment 3 §1's oracle already says.

## Finding

None of the six is a defect in the clamp, the kept dose or the held test. Four are gate claims written at the wrong scope (1, 3, 4, 6), one is a pre-existing class the brief mis-attributed to the hold (2), and one is a population the rule already covers but R8's sentence did not (5). The kept dose closes both routes Amendment 3 named (measure: (i-r) 18,093/18,580, (i-u) live == boot 11,096/11,096, live == pre-hold carry 11,096/11,096). `HALF_MANNY` `0ac7da6b1691a8e1` on all three trees; uninjured 133/133 (measure).

**Miss 1, (a″) is 72.** Printed on V228, the 72 lowback builds (protect + workaround × 4 equipment × 3 experience × 3 focus): filter-capped, final-uncapped cards 72, every one `Banded hip thrust>Burpees`, bodyweight tier only, protect 54 + workaround 18; by label Main 36, Leg superset B 24, Leg circuit 12; by kind cue 36, bwsets RPE>7 16, bwsets RPE≤7 20. The 20: 12 beginner Mains `3 sets — RPE 6–7 (leave 3–4 in reserve — learn the movement), ramp up with 2–3 warmup sets, 3 min rest` (W1–W2, three focuses, both tiers) and 8 prevention Mains at RPE 7. Amendment 1 §2's "52" subtracted the 20 Mains the clamp does not touch from a row whose definition does not ask about RPE. The definition stands; the number was wrong.

**Miss 2, the undo-route shape difference is V222 note (3) and is identical on V227, V228 and CF3.** Printed, `hip_wa#801`, W5 thu, native `Step-ups (KB)` `2×10 each — hold RPE 7, three in the tank` (lunge, capped):
```
V228  hop1 -> 45° back extension  "2 sets — RPE 8 (stop 2 reps short of failure)"   toast "…No load to add here, so take the sets to the same effort."
      hop2 -> Barbell hip thrust  "2 sets — RPE 8 (stop 2 reps short of failure)"   undo -> 45° back extension "2 sets — RPE 8 (…)"
      hop3 -> Glute-ham raise     "2 sets — RPE 8 (stop 2 reps short of failure)"   boot same   direct native -> Glute-ham raise "2×10 each — hold RPE 7, three in the tank"
CF3   hop1 -> 45° back extension  "2 sets — RPE 7 (leave 3 or more in reserve)"  kept "2 sets — RPE 8 (…)"   toast "…No load to add here. Your injury plan holds this one at RPE 7."
      hop2 -> Barbell hip thrust  "2 sets — RPE 7 (…)"  kept "2 sets — RPE 8 (…)"   undo -> 45° back extension "2 sets — RPE 7 (…)" with "2 sets — RPE 8 (…)" beneath
      hop3 -> Glute-ham raise     "2 sets — RPE 7 (leave 3 or more in reserve)"   boot same   direct "2×10 each — hold RPE 7, three in the tank"
V227  the V228 shape with "two"; live == boot, live != direct on the same chain
```
The rep target dies at hop 1, where `_swapDetailFor` hands an unloadable 45° back extension to `_bwSetsFromDetail` (`2×10 each` → `2 sets — RPE 8`), and the sets-form then rides onto every later lift, loadable or not. That is V222 note (3) verbatim ("a rep target lost through an unloadable middle hop is never regained on a loadable end"), recorded in §12 since V222 and injury-blind. From the res_U dumps: 5,868 of 11,096 chains print live ≠ direct on V228 and on CF3, the same 5,868 ids on both trees, and 5,868/5,868 have a bwsets card at hop 1; of the 8,399 chains whose hop 1 is bwsets, the 2,531 that still equal the direct hop are those whose native was already bwsets (208) or whose direct hop converts too (native cue 1,660, grammar 663). The hold-sensitive comparator (live == pre-hold carry along the route) is 11,096/11,096 on CF3 and 3,701/11,096 on V228. So the claim D193 owns passes in full; the claim it does not own was never true and is not the hold's. Note in passing what CF3 does fix on this chain: on V228 a capped hinge (Glute-ham raise) prints RPE 8 when reached through a chain and RPE 7 when reached directly; on CF3 it prints 7 on every route.

**Miss 3, (l) grew because Amendment 3 §2 made the prose hold recoverable.** Measure: G3a 832 = 529 hold-of-donor + 199 hold-of-window + 104 R7-native donors onto uncapped targets printing `_testRx`; G3e 202 = 177 + 25; G3c-off 168 = 89 + 79; G3d 263; G3f 199. Printed from the CF3 gate rows: 113 rows with D == R7 text land on uncapped targets and print `_testRx` (0 of them capped by the hand table; e.g. `knee/workaround W6 thu Barbell box squat -> Barbell Romanian deadlift`, toast "Same job, same numbers."), 71 land on capped targets and print R7's text (71/71 capped; toast "…Same sets, same reps. Your injury plan holds this one at RPE 7."). Amendment 2's (l) said "on uncapped targets byte-verbatim"; Amendment 3 §2 then ruled the carry reads beneath the prose hold, so the uncapped card is byte-verbatim to the donor read beneath its hold, not to the donor's text. The gate claim moves to the rule; the rule does not move. **G3c power:** HEAD's g221 reader already strips both wordings above 226 (`tests/gates/g221_d177_swapfloor.js` :155–156, `D190_CUE_RE = / — hold RPE 7, (?:two|three) in the tank$/`, shipped with R4 at V228). Measure: `G3c_pow_both` V228 0, CF3 0; the 118 exists only under the retired "two"-only reader. Amendment 2's "G3c power 118 to absorb" was absorbed at V228. V229 absorbs nothing there.

**Miss 4, (k) INFO 458 is the capped-target figure; the all-target figure is P-BWBUCKET's population, now measured, and 4,736 of it is not a changed number.** Printed over the D177 L1 gate rows (150,068 per tree), predicate "card RPE ≠ donor RPE, toast claims same numbers or same effort, no hold toast": V228 7,648 (capped 728, uncapped 6,920); CF3 7,378 (capped 458, uncapped 6,920). The 270 that leave between the trees are the capped unloadable pairs with donors 8.5/9/9.5 (130 + 100 + 40) that CF3 clamps to 7 with the hold toast. Of the 7,648, **4,736 are `RPE 6–7` donors whose card reads RPE 6**, e.g. healthy beginner `Machine chest press -> Dips`, D `2×12 — RPE 6–7, leave 3+ in reserve — 3 min rest, focus on form`, O `2 sets — RPE 6 (leave 3 or more in reserve)`, toast "…so take the sets to the same effort." A card inside the range the donor named is the same effort; the reader did not change a number, it picked one the donor allowed, and the reserve words agree (3+ ↔ 3 or more). Outside the donor's range: **2,912 on V228 (capped 728, uncapped 2,184), 2,642 on CF3 (capped 458, uncapped 2,184)**. Uncapped split (both trees): 6.5→6 1,009, 7.5→7 186, 8.5→8 451, 9→8 374, 9.5→8 164. The 9→8 rows are the ones with teeth (e.g. healthy hypertrophy W6 `Close-grip bench press -> Dips`, D `5×10 — RPE 9 (leave ~1 rep in reserve), last set AMRAP — log it…`, O `4 sets — RPE 8 (stop 2 reps short of failure)`, toast "same effort"); they are cap-blind and V227-identical, P-BWBUCKET as parked.

**Miss 5, the 196 are inside the rule; R8's sentence was narrower than its oracle, and V228's toast on them is false today.** Printed, `hip_wa#1199`, W5 thu, native `Barbell good mornings` `2×8 — hold RPE 7, three in the tank`, hop1 → Glute-ham raise (cue carried), hop2 → Nordic hamstring curl (anchored), unloadable, hinge capped:
```
V228  card "2 sets — RPE 8 (stop 2 reps short of failure)"   toast "Nordic hamstring curl (anchored) in, glute-ham raise out. No load to add here, so take the sets to the same effort."
CF3   card "2 sets — RPE 7 (leave 3 or more in reserve)"  kept "2 sets — RPE 8 (…)"   toast "Nordic hamstring curl (anchored) in, glute-ham raise out. No load to add here. Your injury plan holds this one at RPE 7."
```
On V228 the donor card said RPE 7 and the new card says 8, so "same effort" is a lie; this is the class (iii) hole R2 closes. On CF3 both sentences are true (7 → 7). Which one the rule calls for: the stripper reads beneath the cue (`2×8`), the reader guesses 8, the clamp writes 7. The number on the new card came from the plan, not from the carry, and the new card no longer shows a cue: its hold is written as a plain `RPE 7`. The toast is the only place this card's hold is named. That is the same reasoning Amendment 3 §2 used for the 71 R7-native donors onto capped targets (stripped to the RPE 9 test, re-held, hold toast "true: one working set, 3 to 5 reps, held"), and the same predicate Amendment 3 §1 typed into the (k) oracle ("hand-bucketed converted-donor RPE > 7 … no-RPE unloadable donors bucket to 8 per the reader rule"). The 196 were simply never on the L1 lattice (measure: "donor names none (cued/bare onto unloadable) 0" there). D190 R4 is untouched: a cue appended to a dose that names no RPE (`2×10` → `2×10 — hold RPE 7, three in the tank`) fires no clamp and keeps "Same job, same numbers." (the 14 cue ends of the same 210 pairs).

**Miss 6, labels.** Measure's by-name counts on the D177 L1 lattice (CF3 vs V227, totals unchanged at 2,247): clamp bwsets 439 = Split squat 116, Banded hip thrust 108, Squat (slow 3s tempo) 94, Dumbbell goblet squat 67, 45° back extension 28, Single-leg hip thrust 26; clamp grammar `@ RPE 8` → `@ RPE 7` 130 = Reverse lunge (KB) 56, Dumbbell row 46, Single-leg hip thrust 28; Burpees Mains 56 = 54 clamp + 2 R7; R7 text 28; literal 1,594. Amendment 2's "Squat (slow 3s tempo) 277, Banded hip thrust 134, Dumbbell row 74" and its per-equipment attributions are withdrawn.

## The rules (restated where a sentence was wrong; nothing Mario approved moves)

- **R8 trigger (restated).** The hold toast fires when the clamp changed the RPE of the dose it was handed: the donor read beneath its hold (`_stripCapCue`), converted for the target where the target is unloadable (`_bwSetsFromDetail`'s bucket). "An RPE the donor named" is retired from R8's sentence; the three strings and D190 R4 are unchanged. Measure's siting (`_held = /RPE/.test(_preF) && output !== _preF`) implements exactly this. Expected populations: L1 rows 1,243 (unchanged); L9 class (iii) pairs 196 hold toasts (V228: 196 "same effort" toasts on cards reading 8).
- **(i-u) claim (narrowed).** D193 claims live == boot == pre-hold carry along the route on every chain (11,096/11,096). "== direct" is asserted only where no intermediate is unloadable; where one is, the difference is V222 note (3), pinned as INFO at 5,868 on V228 and CF3 (same ids), not to grow.
- **(k) INFO (scoped).** The 458 is the capped-target row (V228 and CF3). The all-target row is P-BWBUCKET's population and reads a range donor as unchanged when the card lies inside the range: 2,912 on V228, 2,642 on CF3.
- **(a″) definition unchanged, figure 72.**
- **(l) predicate (as Amendment 3 §2 implies).** On uncapped targets the card equals the donor read beneath its hold by the hand stripper (both cue wordings; R7 text → `_testRx` text), byte-verbatim after that. On capped targets the card equals the hand hold applied to the stripped donor (number 7, gloss by shape per Amendment 1 §3, R7 text for the test prose, rep token unchanged).

## Corrected gate claims (V228 | CF3; keyed on today's `ia-version`, REFUSE below 229; each row named here must fail on V228 at the stated figure or carry a conjunct that does)
- **(a)** 316 → 0 on L432; `home_basic` 120 → 0. Unchanged. **(a′)** INFO 4 | 4. **(a″)** INFO **72 | 72** (36 Mains + 36 accessories, lowback/protect 54 + lowback/workaround 18, all `Banded hip thrust>Burpees`); the 16 Mains above 7 inside it are part of (a)'s 316.
- **(e)** unchanged (196/210 read 8 → 0; live == boot 210/210 both trees). **Gains (k″):** the 196 bwsets ends print the unloadable hold toast (V228 0, and V228's "same effort" on them is false); the 14 cue ends print "Same job, same numbers." (D190 R4).
- **(e′)** unchanged (114 → 0; 52/118 → 0; wave 20 → 0 with hold toasts 20/20).
- **(i)** unchanged (residue 487 by id). **(i-r)** live == boot == in-session end 18,093/18,580 on both trees; because that conjunct also passes on V228, the row carries "rebooted slot carries the kept dose 18,580/18,580" (V228 0) and "every capped end equals the hand hold" (V228 fails on the ends above 7). **(i-u)** live == boot 11,096/11,096 (both trees); live == pre-hold carry **3,701 | 11,096**; undone card carries the kept dose **0 | 11,096**; live == direct asserted on the hand-defined subset with no unloadable intermediate; INFO complement **5,868 | 5,868**, V222 note (3). Hand rows: mario W5 thu undo route (hop3 Barbell hip thrust `2×6–10 @ RPE 8` == boot == direct, measure CF3; V228 same text because nothing is clamped there, so the discriminating conjunct is the kept dose on the undone card: V228 null, CF3 `2×6–10 @ RPE 8`).
- **(j)** build 30 / 0 number-only / 102/102 / 0 uninjured; live R7 on 127 (56 TEST9 donors + 71 R7 natives), 113 R7-donor rows onto uncapped targets print `_testRx` byte-identical to V227 with "Same job, same numbers." Unchanged from Amendment 3 (measure reproduces all).
- **(k)** 1,243 hold variants (verbatim 684, unloadable 360, window 199), 0 false claims, 0 hold toasts off the clamp set, non-clamp toasts == V227 148,825/148,825. **INFO capped 458 | 458.** **INFO all targets (P-BWBUCKET, range-aware) 2,912 | 2,642**; the raw predicate 7,648 | 7,378 may be printed beside it but is not the pin.
- **(l)** per the predicate above. Rows to absorb on CF3 with the V228 figure 0: G3a 832, G3d 263, G3e 202, G3f 199, G3c-off 168. **G3c power 0 | 0**; the 118 line is deleted from the claim.
- **(f), (b), (c), (d), (g), (h)** unchanged. (b) still pins: uninjured object row 27/27, no `_preHold` on uninjured programs (measure 0).
- **INFO P-HOLDBENEATH:** 1,510 bwsets natives onto uncapped targets carry the held 7 (measure); 0 R7 rows on uncapped targets (the prose leaves the class, as Amendment 3 ruled).
- **Drop from D193's list:** Amendment 3 §4's INFO "~1,500 chains where undo does not restore the pre-last-hop card": measure reads 18,580/18,580 restored on V228 and CF3 since D192; D192's gate owns the chip.

## Sabotage
S2 → (a) 316 (as Amendment 1). S14 → (j) **30** + 56 (not 28). S17 → (j) 113, (k) 71 (unchanged). S19 and S20 trip the narrowed (i-u): the pre-hold comparator and the mario hand row (CF2's delete-on-undo printed Barbell hip thrust 7 vs 8 vs 8 there). **S22 (new):** R8 trigger keyed on the donor card as read (cue counted as RPE 7) instead of the converted dose → (k″) 196 and (k) 71 lose the hold toast. No spec changes for misses 1, 3, 4, 6; they are claim figures, not mutations.

## Parked-line changes (replace the prior text)
- **P-BWBUCKET:** population measured on the D177 L1 rows (V228). Raw predicate 7,648; 4,736 are `RPE 6–7` donors landing at RPE 6, inside the donor's range, not this class. Outside the range 2,912: capped 728 (458 at 6.5→6 and 7.5→7, which stay; 270 at 8.5/9/9.5→8, which V229 clamps to 7 with the hold toast) and uncapped 2,184 (6.5→6 1,009, 7.5→7 186, 8.5→8 451, 9→8 374, 9.5→8 164). Cap-blind, V227-identical. After P-BWFALLBACK.
- **V222 note (3)** gains: on the D190 lattice undo route, 5,868 of 11,096 chains end on a loadable lift with a sets-only dose because hop 1 was unloadable; same ids on V228 and CF3; V229's hold rides it correctly (`hip_wa#801` Glute-ham raise `2 sets — RPE 7 (leave 3 or more in reserve)`, toast "Same sets, same reps. Your injury plan holds this one at RPE 7." on a card that prints no reps). The toast string is not reopened; the sets-only dose on a loadable lift is the defect.
- **P-HOLDBENEATH:** INFO 1,510 on the L1 rows (number clamp only).
- **P-BWFALLBACK:** (a″) is 72 (36 Mains, 16 of them clamped by V229; 36 accessories), expected 0 when the fallback's pattern is `hip_ext`.
- **P-FILTERLAST, P-ADDSEAM:** unchanged.

## M8's UNKNOWNs: none blocks builder
Travel overlay (h): ruled in Amendment 1 §4/§7, V228 figure read on the gate's own previous-version run, parks if it cannot pass. Other seeds: fuzz row. Deeper (i-u) shapes: one rule (restore from the record), proven on 11,096 one-undo chains; gatekeeper adds one hand row (mario W5 thu, hop1 → hop2 → hop3 → undo → undo → hop4) that parks under standing ruling 7 if it cannot pass. Hist and past-week days: D181 R5 never replays a hist-restored day, so the kept dose on the hist item is the only carry source there and measure printed it riding (`ia_hist_PM w5_thu … "_preHold":"2×6–10 @ RPE 8"`, hop3 == boot); hand row, not a blocker. Add path: P-ADDSEAM, not this build. S11–S21: gatekeeper's step on the built artifact, after builder by definition.

## Siting: one conflict, one note
- **Conflict, siting #2.** The stripper maps R7 by exact string equality. R4's rule, extended to the fifth shape by Amendment 3 §2, is "by shape, not by today's spelling": the day R7's words are re-worded, every stored card carrying the old prose would ride onto an uncapped lift as prose (the Amendment 3 §2 defect returning) and the clamp's regex would not see it either. Recommend the stripper match the R7 shape (its fixed clauses with the number free), the same form `_capRpeClamp` already uses for `_testRx`. Counter: exact equality can never false-strip and no retired R7 wording exists today; acceptable for V229 only with a gate row pinning `_stripCapCue(INJ_HELD_TEST) === _testRx`, which (f) already carries.
- **Note, siting #1.** `_TEST_RX_TEXT` duplicates `_testRx`'s literal; prefer builder's alternative (hoist one text, `_testRx` reads it) so the gate's oracle has one string to pin. Not a rule conflict.
- #3 to #8 are consistent with Amendment 3 §4 (build path never writes the dose; undo restores from the record or deletes; injury guard; `ph` only when the from-card kept one). #5 implements the restated R8 trigger as-is.

## Before (printed this session, V228 shipped)
```
hip_wa#801 undo route  hop3 Glute-ham raise "2 sets — RPE 8 (stop 2 reps short of failure)" == boot | direct "2×10 each — hold RPE 7, three in the tank"   (capped hinge at 8 through the chain, 7 direct)
hip_wa#1199 hop2 Nordic hamstring curl  "2 sets — RPE 8 (stop 2 reps short of failure)"  toast "…No load to add here, so take the sets to the same effort."   (donor said RPE 7: false)
(a″) lowback 72 builds: 72 = Main 36 (16 RPE>7, 20 ≤7) + Leg superset B 24 + Leg circuit 12, all Banded hip thrust>Burpees, bodyweight
(k) INFO all targets 7648 (capped 728, uncapped 6920) | inside donor range (6–7 -> 6) 4736 | outside 2912
(i-u) live!=direct 5868/11096, all hop1 bwsets | live==pre-hold 3701 | kept dose on undone card 0
G3c power (HEAD reader, both wordings) 0 | measure: G3a 0, G3d 0, G3e 0, G3f 0, G3c-off 0
HALF_MANNY 0ac7da6b1691a8e1
```

## After (CF3 printed; expected at V229)
```
hip_wa#801 undo route  hop3 Glute-ham raise "2 sets — RPE 7 (leave 3 or more in reserve)" == boot | kept "2 sets — RPE 8 (…)" | direct "2×10 each — hold RPE 7, three in the tank"   (live==pre-hold 11096/11096; the shape gap is V222 note (3), INFO 5868)
hip_wa#1199 hop2 Nordic hamstring curl  "2 sets — RPE 7 (leave 3 or more in reserve)"  kept "2 sets — RPE 8 (…)"  toast "…No load to add here. Your injury plan holds this one at RPE 7."   (196 such on L9)
(a″) 72 unchanged (16 of its Mains now at 7, inside (a)'s 316 -> 0)
(k) 1243 hold variants, 0 false claims | INFO capped 458 | INFO all targets 2642 (raw 7378)
(l) G3a 832, G3d 263, G3e 202, G3f 199, G3c-off 168 under the beneath-the-hold predicate, 0 fails | G3c power 0
(j) 30 / 0 / 102/102 / 0 ; live 127, 113 uncapped print _testRx verbatim
HALF_MANNY 0ac7da6b1691a8e1 (unmoved) | uninjured 133/133
```

## Mario
Nothing reaches him. The clamp, the kept dose, D193-HELDTEST's words and the three R8 strings are exactly what he approved in round 2. The one item that looked like his, which toast the 196 cued-to-unloadable swaps get, is a scope correction under R8's own definition: the strings do not change, the plan did write the number on those cards, and V228's current sentence on them is false. For the session report: the corrected figures are (a″) 72, (k) INFO 458 capped and 2,642 all-target, (l) 832/263/202/199/168 with G3c power already 0 since V228, and the 5,868 undo-route shape differences are the V222 note (3) class, identical on V228.

**Recommendation:** Builder proceeds on CF3's shape with the corrected claims above (no code change to the clamp, kept dose or toasts beyond measure's surgery), the stripper matching R7 by shape rather than exact text, S14 at 30, S22 added, and the (i-u) and (i-r) rows carrying a kept-dose conjunct so each fails on V228.

**Counter:** Key R8 on the donor card as the athlete read it (the cue counting as RPE 7), which returns the 196 and the 71 to the generic toast and makes 1,243 into 1,172; rejected because the number on those cards came from the plan and the card no longer shows a cue, so the hold toast is the only place the hold is named, and Amendment 3 already ruled the 71 that way.

---

## Session decisions (V229 chat, 2026-10-02) — main session record, not coach text
- **Siting #2 (stripper):** take coach's recommendation. `_stripCapCue` recognises R7's text by shape (fixed clauses, number free), not by exact equality, and returns the one hoisted `_testRx` text.
- **Siting #1 (shared text):** one hoisted text. `_testRx` reads a top-level constant; the stripper returns that constant; no duplicated literal.
- Nothing reached Mario (coach: "Nothing reaches him"); Amendment 4 is a count and scope correction under D193 as approved in round 2.
