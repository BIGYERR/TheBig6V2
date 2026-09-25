# P-SWAPFLOOR — a swapped Main is prescribed the way the engine would have prescribed the candidate

Coach ruling, provisional code (D-number assigned at builder dispatch). Measured on HEAD = V206 (57b3ed8), `ia-version 206`. Evidence: measure's `tests/measure/v221_goblet_low_reps.js` (4,320 builds, 0 crashes) plus this session's before-picture `scratchpad/p_swapfloor_before.js` (harness, seed 76308).

## Finding

The swap path keeps the donor's rep count on a movement whose load ceiling cannot reach it. The engine already knows the ceiling: `_REP_FLOOR` (index.html:9508) carries `[/goblet/i,[8,12]]` and `scheme()` (:7908–7923) applies it to every wave Main. `_swapDetailFor` (:9715) reads the same table but only acts on the `[0,0]` (unloadable) case; a non-zero window falls through and the donor text is copied verbatim. Repro, byte-identical to Mario's screenshot string:

```
Before (W5 Thu Legs, commercial|support_strength|beginner|liftonly|knee/workaround, seed 76308)
  Main — Barbell box squat :: 4×3 — RPE 7 (leave ~3 reps in reserve), ramp up with 2–3 warmup sets, 2–3 min rest
  swap sheet tier1: Leg press | Dumbbell goblet squat
  -> Dumbbell goblet squat :: 4×3 — RPE 7 (leave ~3 reps in reserve), ramp up with 2–3 warmup sets, 2–3 min rest   (floor [8,12] ignored)
```

The same program, two weeks earlier, shows what the engine's own writer prints for the same movement in the same slot:

```
  W3 Thu Main — Dumbbell goblet squat :: 4×8–12 — RPE 7 (leave ~3 reps in reserve), ramp up with 2–3 warmup sets, 2–3 min rest
```

Mario's card is on Monday and the harness repro is on Thursday only because his rest pattern differs; the prescription string is identical. `fixtures.HALF_MANNY` does NOT reproduce it (endurance wave, `3×8`; knee/workaround puts the goblet on Thu at `3×8`), so his live cfg is a strength-type wave, not the fixture. Confirm which program is live before the digest row is cut; the ruling does not depend on it.

## The coaching argument

RPE self-corrects load for a rep count. It cannot self-correct when the load that rep count needs cannot be held. A 4×3 at RPE 7 asks for roughly a 6RM load; on a goblet that is a dumbbell nobody can rack at the chest, so the athlete takes 45 lbs, does three reps at RPE 3, and the card lies about the day. The prescription owns the fixed dimension: on a load-ceilinged movement the fixed dimension is the window, the load is what the athlete finds inside it. V110 ruled this for the engine ("can load be added fast enough to track a descending wave?"). V119 opened the first hole in V102's "prescription carries verbatim" for movements with no load at all. This is the second and last hole, on the same table, with the same writer shape. I am arguing against the standing V102 line and the `applySwapChoice` comment ("RPE self-corrects for the movement, so there is no re-prescription pass to run"): that sentence is true for barbell to barbell and false for barbell to goblet, and the file has known it since V110.

## Rule

**R1. A swapped item is prescribed as the engine would have prescribed the candidate in that slot.** For a wave Main that means `scheme()`'s floor branch: if the candidate's `_repFloor` window is non-zero and the donor's rep token sits under the window's low end, the rep token becomes the window. Everything else in the string is kept byte for byte.

| dimension | kept or re-derived | why |
|---|---|---|
| sets | kept (`wv.s`) | the engine keeps them too (`scheme()` :7923) |
| reps | re-derived: `lo–hi` from `_repFloor` when donor reps < lo | the floor is the movement's, not the slot's |
| RPE + note | kept | effort is still the real target (V110) |
| ramp-up text | kept | engine keeps it on floored Mains (W3 Thu proof) |
| rest | kept | rest is written by the slot (`mRest`, :8558–8561), not the reps |
| anything not `S×R — RPE …` | untouched | see scope |

**R2. Scope is the wave Main grammar, by construction.** The branch fires only on a detail that starts `S×R — RPE` (a single number or a `lo–hi` range as R; compare the low end, exactly as `scheme()` does). `_powerPrescribe` writes `S×R — <cue>, <rest>` and never `RPE`, so **V170 D7 holds without a section test: `_repFloor` stays out of the power path.** Accessory strings use `@ RPE` and are untouched (the engine never floored them either). The `[0,0]` branch, `_BW_KEEP_FIXED` and the `isTrackableWeight` check stay exactly as V119 wrote them.

**R3. One movement joins the table: `Landmine reverse lunge` gets the unilateral window `[6,10]`.** Today `_repFloor('Landmine reverse lunge')` is `null` (matches no row: not `(KB)`, not `dumbbell`, not `single-leg`), so it is the largest bucket in the spread (1,830 at 5, 1,638 at 3, 1,134 at 2) and would survive R1 untouched. It is single-leg work with the bar end held at the chest: balance and the anterior hold cap the load, which is the `[6,10]` row's own definition ("balance caps expressible load"). Match it by name (`landmine.*lunge` or the literal), NOT by a bare `lunge` token: a bare token would give `Reverse lunge`, `Walking lunge` and `Side lunge (bodyweight)` a loaded window, and that is the §12 parked question ("a floor rule for EVERY bodyweight substitute, do not fix one name in isolation"), which this ruling deliberately does not reopen. `_repFloor` has exactly two readers (`scheme()` :7908, `_swapDetailFor` :9717), so the row's blast radius is those two paths only.

**R4. Undo restores the donor's own text.** `undoSwap` (:13865) restores the NAME through `applySwapPrefs(day.sections,back)`; the donor's floor is `null` so the detail passes through unchanged. After R1 that would leave `4×8–12` on a barbell box squat. This is pre-existing shape from V119 (an unloadable swap undone today leaves `3 sets — RPE 8` on the barbell) and R1 widens it, so it ships in the same build: `recordSwap` (:9844) stores the donor detail on the entry and `undoSwap` writes it back. Builder's call on the field name.

**R5. The toast gets a third branch.** Today: "Same job, same numbers." or "No load to add here, so take the sets to the same effort." When R1 moved the reps: `<to> in, <from> out. The load runs out before the reps do here. Same sets, same effort. Reps move to <lo> to <hi>.` Copy rule honoured: no mid-sentence dashes, short declaratives.

## Floor table (all from `_REP_FLOOR` as it stands; one addition)

| movement | window | source row | on Mario's donor `4×3 — RPE 7 (…)` |
|---|---|---|---|
| Dumbbell / Kettlebell goblet squat | 8–12 | `/goblet/` anterior load ceiling | `4×8–12 — RPE 7 (leave ~3 reps in reserve), ramp up with 2–3 warmup sets, 2–3 min rest` |
| Kettlebell swing | 10–15 | `/kettlebell swing|\bswing\b/` ballistic | `4×10–15 — RPE 7 (…)` (hinge Mains: `4×2 → 4×10–15`) |
| Kettlebell single-leg deadlift | 6–10 | unilateral row | `4×6–10 — RPE 7 (…)` (matches the engine's own home_basic Main print) |
| Dumbbell split-stance deadlift | 5–8 | generic DB/KB row | `4×5–8 — RPE 7 (…)` |
| Leg press | 5–8 | machine row | `4×5–8 — RPE 7 (…)` |
| Landmine reverse lunge | **6–10 (new, R3)** | unilateral row | `4×6–10 — RPE 7 (…)`; today unchanged `4×3` |
| DB bench / incline / decline / floor press, DB RDL, DB snatch | 5–8 | generic DB/KB row | a `5` donor stays `5`; `4×3 → 4×5–8` |
| Barbell lifts, Front squat, Barbell box squat | none | null row | verbatim, as today |

**KB swing on a strength Main: keep it offered, floor it.** It is harvested by hinge pattern and injury legality (`swapCandidates` :9659); it is the hinge that survives a knee, ankle, hip or low-back overlay, and that overlay athlete is exactly who opens the sheet (measure: all 573 goblet pairs at ≤5 are on knee/ankle/hip builds). `swapLoadNote` already prints "Much lighter than sumo deadlift. Volume holds, top-end strength does not." for a two-tier drop, so the trade is honest. What is not honest is `4×2` on a swing: V170 D2's own words, "a triple with two minutes' rest discards the one thing it is best at", and D2 cited `_REP_FLOOR`'s `[10,15]` as independent agreement. A swing on a strength Main prints `S×10–15` at the slot's RPE and rest. Not a new dialect, not a new number.

## Engine items measure raised (question 3)

- **DB Mains at 5 (decline 1,008, RDL 972, bench 864, floor 363, incline 252): acceptable, no change.** They sit ON the generic `[5,8]` floor, not under it. A 5-rep dumbbell press at RPE 7 to 8 is a real strength dose in a gym with a full rack; the `loadCapped` branch already owns the tier where the rack runs out. Ruling on the `[5,8]` number itself would be a separate table question with its own measure.
- **DB snatch at 3 in Power (19): acceptable, not this ruling.** V143 priced loaded derivatives at 1.0; `_powerReps` gives density reps only at cost ≤0.5, so a 1.0 movement takes the role's reps, and a loaded triple at "max intent" is V144 Ruling 2. V170 D7 keeps `_repFloor` out of that path on purpose; R2 preserves that by construction.

## Live programs (question 4): confirmed, with one amendment

All four swap writers funnel through `applySwapPrefs` → `_swapDetailFor`: the live tap (`applySwapChoice` :13739), the session store on rebuild (`applySessionSwaps` :9861, after the freeze), the permanent preference at build time (`cfg.exSwapPrefs`, :10477) and undo (:13873). So on the next boot every UNTRAINED day carrying a persisted swap onto a floored movement re-renders with the window; every TRAINED day restores from `ia_hist_` and stays byte-identical (the store's own comment: a frozen week "has no name left to match"). Amendment: if Mario has already logged a set on the 4×3 goblet day, that card stays 4×3 until he re-swaps it; a re-swap on a frozen day goes through `applySwapChoice` and prints the window. Gatekeeper should prove that frozen-day re-swap path, it is the one Mario will actually use.

## Deliberately NOT changed

Sets, RPE, note, ramp-up, rest on any swap. The swap universe (nothing added or removed from the sheet). `REP_AFFINITY` (a max cap on wave-pool entry; the floor already has a home in `_REP_FLOOR`, so no second map, per §12). The power path (V170 D7). Accessory and `+ EXERCISE` writers (clean, 0 of 223,200). The `[5,8]` generic DB floor and the KB lunges that ride it (`Reverse lunge (KB)`, `Walking lunge (KB)` match `\bkb\b`; a coherence question for the unilateral row, recorded as a watch item, not ruled). Bodyweight lunges (§12 parked). NRC sessions (untouched by construction; no run card carries the wave Main grammar).

## Blast radius, in coaching terms

- **Swap path (every goal, every calendar):** only pairs where the candidate's window sits above the donor's reps. That is strength, athletic, balanced and beginner support_strength waves in their low-rep weeks (strength wave rows 3 to 6 and 8 to 12: 4×4 down to 3×1). Endurance and hypertrophy waves sit at 8 and above, so a goblet never moves there; a swing still does (`3×8` hinge Main → `3×10–15`). HALF_MANNY's own Mains (`3×8`) do not move on a goblet swap.
- **Engine path:** only R3, only `Landmine reverse lunge` at a wave Main under 6 reps. Measure's engine ≤5 list does not contain it, so the expected count is 0 changed cards and an unmoved `HALF_MANNY` digest; both must be proved on a source-surgery copy, not assumed (standing ruling 5).
- **Injury overlays:** the goblet reaches the squat sheet on knee/ankle/hip workaround and protect (all 573 pairs). Healthy builds: 0 goblet pairs at ≤5; swing and single-leg pairs exist on healthy hinge Mains too.
- **Live devices:** untrained days only, as above.

## Measure still needed (before builder)

1. Counterfactual copy with R1 + R3 spliced: (a) `HALF_MANNY` digest and changed-card count (expect unmoved, 0); (b) engine-path changed cards across the v212 lattice (expect only `Landmine reverse lunge` wave Mains, expect 0); (c) the v212 spread table re-run: every remaining pair at ≤5 must be exactly 5 on a `[5,8]` movement, and no pair may print under its window.
2. Power-section swap scope: across the lattice, count swap donors whose section is `Power`, `Power — …` or `Explosive finisher`, and assert 0 of their details match `^\d+×\S+ — RPE`. That is the proof R2 keeps D7 by construction.
3. Undo shape today: one unloadable pair (`Barbell row 4×5 → Inverted row`, undo) printed before and after, to pin the pre-existing V119 shape R4 fixes.

## Bycatch (record in §12, not in this build)

`restNote` (:8544) appends ` — 3 min rest, focus on form` to a push Main that already ends `2–3 min rest`, so beginner push Mains print `…, 2–3 min rest — 3 min rest, focus on form` (seen on `commercial|support_strength|beginner` W5 Mon DB bench). Two rest clauses that disagree, and a mid-sentence dash in athlete copy.

## Before / After (expected)

```
Before  W5 Thu Legs :: Main — Barbell box squat[Barbell box squat] | Leg superset A[Step-ups (KB)] | Knee stability[Spanish squat hold (KB)] | Leg superset B[Kettlebell swing, Single-leg hip thrust] | Hip stability[…]
        swap -> Dumbbell goblet squat :: 4×3 — RPE 7 (leave ~3 reps in reserve), ramp up with 2–3 warmup sets, 2–3 min rest
        swap -> Leg press              :: 4×3 — RPE 7 (…)
        swap -> Kettlebell single-leg deadlift :: 4×3 — RPE 7 (…)
        W5 Tue Main — Sumo deadlift 4×2 -> Kettlebell swing :: 4×2 — RPE … (measured class: 891 pairs)

After   grid line unchanged (names only move on the athlete's tap)
        swap -> Dumbbell goblet squat :: 4×8–12 — RPE 7 (leave ~3 reps in reserve), ramp up with 2–3 warmup sets, 2–3 min rest
        swap -> Leg press              :: 4×5–8 — RPE 7 (…)
        swap -> Kettlebell single-leg deadlift :: 4×6–10 — RPE 7 (…)
        swap -> Landmine reverse lunge :: 4×6–10 — RPE 7 (…)   (R3)
        Sumo deadlift 4×2 -> Kettlebell swing :: 4×10–15 — RPE … (…), ramp up with 2–3 warmup sets, 3 min rest
        toast: "Dumbbell goblet squat in, barbell box squat out. The load runs out before the reps do here. Same sets, same effort. Reps move to 8 to 12."
```

Recommendation: ship R1 to R5 as one build, the swing stays on the sheet at its window, DB Mains at 5 and DB snatch at 3 stay as they are.
Counter: the purist line is to bar conditioning hinges (swing) from strength Main swaps entirely rather than window them; I reject it because it thins the sheet for exactly the overlay athlete and the load note already tells the truth about the trade.
