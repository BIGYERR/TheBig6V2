# P-SWAPDURABLE — a swap the athlete made stays made until the athlete undoes it

Coach ruling (fresh spawn, 2026-09-24, V221 build chat), provisional code (D-number at builder dispatch). Baseline for measure: V220 and the D177 working tree, identical on both. Evidence: `tests/measure/v221_swap_frozen.js` / `.out.txt`. Born from the D177 re-ruling (`p_swapfloor_ruling.md`, RE-RULING ON V220 (swap durability)).

## Finding

The swap lives only in `ia_swaps_`. `applySwapChoice` (:14203) and `undoSwap` (:14357) never write `ia_hist_`; add and skip do, through `_afterEdit` → `resnapshotDayEdit` (:14252 → :1305). The per-exercise Log (`logExerciseWeight` :13197, reached from the Log button :12910 → :14082, the KB size tap :14011, and the quiet re-save :12456) writes `ia_exw_` only, which D108 counts as a touch, so the day freezes with no snapshot and restores from the creation-day grid. `pruneSwaps` (:10278, called :15927 with `_swapCut = _cut`, ~:15824) deletes every record below `_cut`, and its comment ("the swap is baked into the stored week") is false: the stored grid carries the swapped-in lift in 0/1,008 runs. Result: REVERTED 628/1,008 (record pruned 628, snapshot holds donor 288, no snapshot 340, orphaned logs 144); DURABLE 380/1,008 (record kept 92, snapshot holds target 288). (Line numbers are the V221 working tree at ruling time; re-grep.)

## Coaching argument

The sheet tells the athlete "Dumbbell goblet squat in, barbell box squat out. Same job, same numbers." and from V221 "Reps move to 8 to 12." That is a prescription. In 628 of 1,008 orderings the next boot puts the box squat back without a word. The app does not un-make the athlete's decision, and it never does so silently. Second, V104's rule: the prescription on screen when the athlete started working is the record. Typing a load against a lift is starting work. The per-exercise Log is the one first-touch hook V104 missed, and D108 already counts that write as a touch, so today the day freezes "with no record of what it was frozen ON" (writeSetDraft's own comment, :1259) and hands back a grid the athlete may never have seen. Third, the log follows the lift: goblet sets in the ledger under a box squat card is the athlete's work filed against the wrong movement.

## What changes (three rules)

**R1. Swap and undo fold into the day's record the way add and skip do.** `applySwapChoice` and `undoSwap` call `resnapshotDayEdit(currentWeek,currentDayKey)` after their mutation, before `openDetail`. `resnapshotDayEdit`, never `snapshotDay`: it returns without writing when no snapshot exists, so a swap alone never freezes a day and never moves `_cut`. The comment at :1301 ("called ONLY from the add/skip handlers") becomes "called only from the athlete's own edit handlers: add, skip, swap, undo".

**R2. The per-exercise Log is a first touch.** `logExerciseWeight` calls `snapshotDay(w, dk)` on its own resolved week and day key before writing `ia_exw_`, when `dk` is a real day key. First-touch-wins makes it a no-op on any day already snapshotted. All three callers are the athlete's gesture on the viewed day; builder re-greps. D108's "selectKBSize is deliberately NOT changed" (~:15789) stands: a snapshot is not a completion record, it is the record D108's own justification asks for.

**R3. The prune goes.** Delete the `pruneSwaps` call, the function, the `_swapCut` writer and its comment (one call site, one writer, one reader; builder confirms). A record is the athlete's edit and lives until `undoSwap` → `clearSwap` retires it. `applySessionSwaps` is idempotent by name: on a snapshot-restored day carrying the swap nothing matches; on a pierced or stored day carrying the donor, the athlete's choice re-applies exactly as it does on every unfrozen week today.

## What deliberately does NOT change

- `snapshotDay` first-touch-wins at the five V104 hooks and `writeSetDraft`. The engine never rewrites a touched day.
- A swap does not freeze a day. `_cut`, `_maxTouched`, the four-store touch rule (D108), V133's pierce boundary and the injury legacy carve-out are untouched.
- Past untouched days still restore from the stored grid; R3 re-applies the swap on top only if the donor name is there. A stale device whose stored past day no longer carries the donor shows that stored day (V133's "dead record"); out of scope.
- `acceptSwapNudge` / `cfg.exSwapPrefs`. Rest-day moves and `ia_moves_`. Boot order (swaps, then adds and skips). Every D177 detail rule.
- No copy, no new toast.
- No migration. Existing tick-only days without a snapshot keep the legacy restore; records already pruned are gone (one re-tap).
- Nothing in `buildProgram`. HALF_MANNY digest unmoved, no era row.
- A swap or undo never deletes a log.

## Before (harness, W5 Thu Main, dated, today clock, goblet pair, reboot same day; D177 tree)

```
today|none|-                    1/1 SURVIVES  Dumbbell goblet squat :: 4×8–12 — RPE 7 (...)   rec=Barbell box squat->Dumbbell goblet squat
today|none, Mon draft in week   0/2 REVERTS   Barbell box squat :: 4×3                          rec=none hist=none
today|draft|swap_then_touch     1/1 SURVIVES  hist=Dumbbell goblet squat :: 4×8–12
today|draft|touch_then_swap     0/1 REVERTS   hist=Barbell box squat :: 4×3
today|tick|swap_then_touch      0/1 REVERTS   hist=none exw=dumbbell_goblet_squat onCard=false orphan=dumbbell_goblet_squat
today|tick|touch_then_swap      0/1 REVERTS   hist=none exw=barbell_box_squat
today|done|swap_then_touch      1/1 SURVIVES
today|done|touch_then_swap      0/1 REVERTS
past_nextwk|none|-              0/1 REVERTS   rec=none hist=none (stored grid)
UNDO draft|swap_then_touch      afterUndo=Barbell box squat | BOOT Dumbbell goblet squat :: 4×8–12 (undo LOST)
UNDO done|swap_then_touch       afterUndo=Barbell box squat | BOOT Dumbbell goblet squat :: 4×8–12 (undo LOST)
REVERTED 628/1008 (record pruned 628, hist holds donor 288, no hist 340, orphaned logs 144, stored grid carries target 0/1008)
```

## After (expected, R1 + R2 + R3)

```
every touch × order × clock × other-day cell   1/1 SURVIVES  Dumbbell goblet squat :: 4×8–12 — RPE 7 (leave ~3 reps in reserve), ramp up with 2–3 warmup sets, 2–3 min rest
  none, other-day touched        record kept; pierced live day + applySessionSwaps → goblet 4×8–12
  draft/done|touch_then_swap     hist=Dumbbell goblet squat :: 4×8–12 (R1 resnapshot)
  tick|swap_then_touch           hist=goblet (R2); exw=dumbbell_goblet_squat onCard=true orphan=-
  tick|touch_then_swap           hist=goblet (R2 then R1); exw=barbell_box_squat stays in the ledger, not deleted
  past_nextwk|none               record kept; stored day carries the donor in the harness → goblet 4×8–12
UNDO 7/7 orderings              BOOT Barbell box squat :: 4×3 — RPE 7 (...) (undo SURVIVES); undo also works after a reboot on a frozen day
DURABLE 1008/1008; logs keyed to a name never on the card when written 0/1008; exw entry count equal across reboot in every cell
verbatim pair (Front squat)     same durability table; detail stays 4×3 (D177 null row)
```

## Blast radius, in coaching terms

- Every goal, focus and calendar: a session-store behaviour, not an engine one. Any athlete who swaps then reboots gets the swapped lift back. Any athlete whose first gesture on a day is a Log tap or a KB size tap gets that day's shown card back after reboot instead of the creation-day grid.
- Undo becomes reachable on frozen days.
- The swap store keeps one small record per swap per day until undone. If a bound is wanted later, retire a record when its day's snapshot no longer carries the donor name.
- Lines carrying the refuted premise, to rewrite in the same build: `pruneSwaps` comment, `_swapCut` comment, `resnapshotDayEdit` comment :1301, handoff :177 (store table row), :474 (Persistence paragraph), §12 :1569 ("model the `ia_moves_` prune on `pruneSwaps`": the model was the defect), §12 :1579 ("Frozen days keep the swap via `ia_hist_`": only when the swap preceded the first touch).

## Freeze invariant

CLAUDE.md's "Week freeze is per-DAY. Injury overlays pierce untrained days only; trained days stay byte-identical" holds. Its meaning is made explicit, not amended: trained days stay byte-identical to what the athlete was SHOWN and the engine never rewrites them; the athlete's own edits fold into that record (add and skip since V109; swap and undo from this ruling). Recommend one clause on §11f's V104 line: "First touch wins against the engine and against later status taps; the athlete's own edits fold in. A swap alone never creates a snapshot."

Three things the fix must not do, each a gate row:
(a) a swap or undo on an untouched day writes no `ia_hist_` key and leaves `_cut` unchanged;
(b) an injury overlay still pierces a swapped-but-untrained day;
(c) a trained day with no swap is byte-identical across the build, and a tick-only day's `_cut` equals the baseline's for the same stores.

## Gate scope (gatekeeper) and measure still needed

Gate: (1) the lattice flip, copy 1,008/1,008, baseline 380/1,008; (2) undo 7/7, plus undo AFTER reboot on a `draft|swap_then_touch` day restores the donor `4×3` by position and survives a second reboot; (3) orphans 0/1,008 and exw entry counts equal across reboot; (4) negative controls (a)(b)(c); (5) 0 engine cards differ, HALF_MANNY digest equals the current row; (6) sabotage, four mutations each tripping a named row: drop R1 in `applySwapChoice`; drop R1 in `undoSwap`; drop R2; restore the `pruneSwaps` call.

Measure before builder: the undo-after-reboot cell; add or skip combined with a swap on a frozen day; a second swap on the same slot with records kept (`box→goblet`, `goblet→leg press`); one stale-grid case (stored W5 Thu without the donor); confirm `logExerciseWeight` callers.

## Ship slot: Mario's call

Recommendation: HOLD from V221; P-SWAPDURABLE leads V222 with this lattice as its before-picture. Pre-existing since V102/V104, identical on V220 and V221, so V221 regresses nothing; the fix sits on the freeze seam (V100, V104, V133, V202) and deserves its own measure, gate and sabotage cycle. Athlete cost meanwhile: one re-tap, which prints the window live.
Counter: D177 puts a louder promise in the toast on a swap the app keeps only 380 times in 1,008, and 144 of the failures file the athlete's own sets under a lift the card no longer shows; if Mario weighs the orphaned logs over the seam risk, ride it as the last V221 slice with gate rows 1 to 6.

## MARIO DECISION
- 2026-09-24, V221 build chat: HOLD from V221; P-SWAPDURABLE LEADS V222 (coach recommendation accepted). It is build 2b of the held queue, ahead of build 3. Re-baseline on V221 first; its gate row 1 must FAIL on V221 at 380/1,008.

## RE-RULING ON V221 (measure refutations)

(Fresh coach spawn, 2026-09-25, V222 build chat, on `tests/measure/v222_swapdurable_premise.out.txt`. Saved verbatim by the main session.)

**P-SWAPDURABLE (D-number at dispatch) — a swap the athlete made stays made until the athlete undoes it; re-ruled on `tests/measure/v222_swapdurable_premise.out.txt`.** Line numbers are the V221 tree; builder re-greps every one.

Coach's code-reading note: `applyDayEdits` (:10212) rewrites `_skipped` on every item from the store and dedups adds by name only (:10218-10223), so a kept edits record is not idempotent against a snapshot the way `applySessionSwaps` is; and `applySwapPrefs` (:10131) does one `map[it.name]` lookup per item, with the map built by plain assignment in `applySessionSwaps` (:10270-10271), so records never chain.

### What the numbers moved

R1 and R2 stand as worded (touch-then-swap 0/72 to 72/72 in every touch class; swap-only days write `ia_hist_` 0/36 on both copies). Four things in the prior ruling did not survive the measure:

1. **R3's "one call site, one writer, one reader" is false.** `_swapCut` (declared :15720, written :15831) is read at :15934 by `pruneSwaps` and at :15943 by `pruneDayEdits`. Deleting the writer leaves `typeof null` at :15943 and `pruneDayEdits` never runs again. That is the COPY tree: M3 30/42 with double-apply 6/42 (six skip-then-swap orderings lose the skip; six swap-an-added-lift orderings show the new lift and the original both). COPYa, which deletes only the call, is 42/42.
2. **"The athlete's choice re-applies exactly as it does on every unfrozen week today" was true of the code and false of the athlete.** M4: two swaps on one slot (box to goblet to leg press) on an untouched day boot to goblet, 1/1 on V221 and on both copies. `applySwapPrefs` looks each item up once; the map is `{box: goblet, goblet: leg press}` and the box squat becomes a goblet squat and stops. Pre-existing on the current week; with the record kept it now also reaches past untouched days, where V221 showed the donor.
3. **Gate row (3) and the After section disagreed on what an orphan is.** By the before-picture's metric (key not on the booted card) COPY reads 144/504, up from 72/504. The 144 are the athlete's own doing: a load typed against the box squat, then the box squat swapped away. The After section's line "exw=barbell_box_squat stays in the ledger, not deleted" is the ruling; the metric was wrong.
4. **The exw-count row passes 504/504 on V221.** It cannot tell the fix from the baseline.

One number in the measure widens R2 rather than narrowing it: on V221 every M3 `tick|…>add` and `tick|…>skipslot` cell boots with `add=- skip=-` (:176-229 of the out file). A day whose first touch is the per-exercise Log loses its adds and skips at the next boot, not only its swap, because the edits record is pruned by week and there is no snapshot for them to have folded into. R2 is what makes those cells 42/42 on COPYa.

### What changes from the prior ruling

**R3 is narrowed to R3'.** Delete the `pruneSwaps` call at :15934 and the `pruneSwaps` function at :10280 with its three-line comment (:10277-10279, the false premise). Keep `let _swapCut=null` (:15720), keep the writer `_swapCut = _cut` (:15831), keep `pruneDayEdits` (:10231) and its call (:15943). Rewrite the writer's comment (:15831, "frozen weeks bake the swap in; the record is then dead weight") to say what the variable now does: it carries the freeze cut to `pruneDayEdits` and nothing else. Whether the variable is renamed is the session's call, not the athlete's; my lean is keep the name and fix the comment, because a four-site rename buys the athlete nothing.

Why the two stores get opposite treatment, in one sentence for the comments: `applySessionSwaps` is idempotent against a snapshot (no donor name on the day, no-op), `applyDayEdits` is not (it rewrites every item's `_skipped` from the store and pushes adds deduped by name only), so on a touched week the edits prune is what keeps the store from arguing with a record that `resnapshotDayEdit` has already folded the edit into. `pruneDayEdits`'s comment at :10229 ("Same rationale as pruneSwaps") is rewritten to that rationale; it shares nothing with the deleted one.

**R4 is added: records on one day compose in recording order.** An item takes the `to` of the last record whose `from` is the name the item carries at that point in the chain: box to goblet then goblet to leg press resolves box to leg press; box to goblet then goblet to box (swapped back through the sheet, not undo) resolves box to box, which `applySwapPrefs` already treats as no hit (:10132). Site: the map build inside `applySessionSwaps` (:10270-10271), and only there. `applySwapPrefs` itself (:10125), its build-time caller on `cfg.exSwapPrefs` (:10904), `recordSwap`, `undoSwap` (:14364) and the undo-chip readers are untouched: undo already finds its record by `from` and walks the chain one step per tap (M4 COPY draft cells: leg press, chip offers goblet, undo, goblet, chip offers box, undo, box 4×3, store empty 3/3), so an untouched day resolved to leg press gets the same two-tap walk-back without a change to undo. Builder chooses the loop; the semantic above is the contract. R4's after-numbers below are expected, not printed: no copy in this pass carried it. Gatekeeper prints them on the artifact.

**R2's caller line is corrected.** Not "all three callers": two direct callers (Log button through `saveExWeight` :14056, KB chip `selectKBByKey` :14043 through `selectKBSize` :14016) plus the quiet re-save reaching `saveExWeight` from seven UI entry points, only on a card already logged. Every path is a gesture on the viewed day; 0 boot callers. The unmeasured onblur-after-navigation case does not widen anything: if an onblur can mis-key a day, it mis-keys the `ia_exw_` write today, and the day R2 snapshots is the day D108 already freezes for that write. R2 turns "freeze with no record" into "freeze with a record" on the same key.

**Gate row (3) is redefined and the exw-count row becomes a control.** A boot-orphaned log is an `ia_exw_` key that names a lift on the card the athlete last saw live and absent from the booted card. V221 72/504 (all in `tick|swap_then_touch`); fix 0/504. The old metric is dropped as a gate; its 144 on the fix are the "never deletes a log" line working. Exw entry count equal across reboot stays as negative control (d): 504/504 on both by design, labelled a control, not a fix-detecting row.

**The rewrite list grows.** Add: `pruneDayEdits` comment :10229-10230; `_swapCut` writer comment :15831; handoff :179 (store table row, was cited as :177: "pruned once the week freezes" goes); :482 (Persistence paragraph, was :474: the `pruneSwaps` sentence goes, "this store exists for one narrow window" goes, the record lives until undone); :1298 (held-queue line says "`pruneSwaps` and `_swapCut` are deleted"; now "the `pruneSwaps` call and function are deleted, `_swapCut` stays for `pruneDayEdits`"); §12 :1588 (was :1569; "model the `ia_moves_` prune on `pruneSwaps`" becomes: the model was the defect for a name-idempotent store, and `ia_moves_` needs its own re-apply semantics ruled before any prune); §12 :1597 (was :1579; "Frozen days keep the swap via `ia_hist_`" becomes "from V222, on every day").

### What deliberately does NOT change (additions to the prior list)

- `pruneDayEdits`, its per-week grain, its call and `_swapCut`'s writer. Ruled out of this build, not ruled correct: see the §12 item below.
- Swapping an added lift on an untouched day is lost at every boot, today and after (the :15938 ordering comment: adds run last, so the added item does not exist when swaps apply). On a snapshotted day R1 keeps it (COPYa `swapadded` 6/6 OK). Pre-existing, out of scope.
- `applySwapPrefs`, the build-time `cfg.exSwapPrefs` path, `recordSwap`'s same-`from` filter, D177 R4's `rx` positional undo.
- No bound on the swap store. M6: no reader counts records (the nudge reads `ia_swapct_`), nothing enumerates localStorage, about 175 bytes a record, about 12 KB at one swap per lifting day and about 40 KB worst case over 14 weeks against a 25,763-byte `ia_programs`. The prior ruling's deferred retirement rule stands as deferred.
- M5 stale grid: the kept record matches nothing and changes nothing; V133's "dead record" paragraph stands.
- Everything in the prior "does not change" list, the freeze invariant paragraph, and the §11f V104 clause.

### New §12 item (not this build, measure first)

**The `ia_edits_` prune is per-week and the freeze is per-day.** `_cut` is at least `_maxTouched + 1` (:15830), `ia_edits_` is not one of D108's four touch stores (:15815), so an add or skip on an untouched day in a week where another day is touched is deleted at the next boot and the untouched day rebuilds without it. Same shape as the swap lattice's `today|none, Mon draft in week 0/2 REVERTS`. Unmeasured. The fix is not "delete the prune" (COPY is the proof: 12/42 broken); it is a per-day retirement or a snapshot-aware `applyDayEdits`.

### Before (V221, from the measure)

```
M0  V221  DURABLE 190/504 (rec kept 46, hist holds target 144) | REVERTED 314/504 (rec pruned 314, hist donor 144, no hist 170, orphaned logs 72)
    none|-  46/72   draft|touch_then_swap 0/72   tick|swap_then_touch 0/72   tick|touch_then_swap 0/72   done|touch_then_swap 0/72
    orphaned-log cells by touch|order V221: {"tick|swap_then_touch":72}
M2  V221|draft|swap_then_touch   boot1=Dumbbell goblet squat 4×8–12 chip=- | undo-> Dumbbell goblet squat (undo unreachable)   1/7 orderings reach undo
M3  V221  live==boot 13/42   live==next-week boot 13/42   double-apply 0/42
    V221|tick|touch>swap>add   LIVE Dumbbell goblet squat 4×8–12 | add=Dumbbell hammer curl  ->  BOOT Barbell box squat 4×3 | add=-
M4  V221|none|-   live=Leg press  ->  BOOT1 Dumbbell goblet squat 4×8–12 chip=Barbell box squat
    V221|hist=none  (both records injected)  boot W5 Thu slot=Barbell box squat rec=none
```

### After (expected; R1 + R2 + R3' printed as COPYa, R4 expected)

```
M0  DURABLE 504/504 (rec kept 504, hist holds target 432) | REVERTED 0/504      every touch|order cell 72/72
    boot-orphaned logs (key on last live card, absent from booted card) 0/504   ; exw count equal across reboot 504/504 (control)
    tick|touch_then_swap   hist=goblet (R2 then R1); exw=barbell_box_squat stays in the ledger, not an orphan: the athlete swapped it out
M2  7/7 orderings: boot1 goblet 4×8–12 chip=Barbell box squat | undo-> Barbell box squat 4×3 (by position) rec=none hist=box | boot2, boot3 box 4×3
M3  live==boot 42/42   live==next-week boot 42/42   double-apply 0/42
    tick|touch>swap>add    BOOT Dumbbell goblet squat 4×8–12 | add=Dumbbell hammer curl
M4  untouched day, box->goblet->leg press:  BOOT1 Leg press 4×8–12 chip=Dumbbell goblet squat | undo-> goblet, chip box | undo-> Barbell box squat 4×3 rec=none   (R4, expected)
    snapshotted day, any order:              BOOT1 Leg press 4×8–12 3/3 (already on COPYa; hist carries it)
    past untouched day, same chain:          Leg press, not the donor (V221) and not goblet (COPYa)
M5  stale stored day: Barbell back squat 4×3, record kept, nothing applied (unchanged)
verbatim pair (Front squat)  same table; detail stays 4×3 (D177 null row)
```

### Revised gate scope (each row: V221, expected after)

| Row | Predicate | V221 | After |
|---|---|---|---|
| 1 | Lattice DURABLE (M0), per touch×order cell reported | 190/504 (380/1,008 with V220) | 504/504 |
| 1c | Control cells inside row 1: `draft|swap_then_touch`, `done|swap_then_touch` | 72/72 | 72/72 |
| 2 | Undo reachable after reboot, restores donor 4×3 by position, clears record, survives boots 2 and 3 | 1/7 | 7/7 |
| 3 | Boot-orphaned logs: exw key on the last live card, absent from the booted card | 72/504 | 0/504 |
| 3d | Control: exw entry count equal across reboot | 504/504 | 504/504 |
| 4 | M3 add/skip × swap on a frozen day: live==boot and live==next-week boot, 42 orderings | 13/42 | 42/42 |
| 4d | M3 double-apply (an added lift shown twice, or a skip lost) | 0/42 | 0/42 (COPY-shaped sabotage reads 6/42) |
| 5 | M4 untouched day, second swap on one slot: booted card shows the last choice; chip offers the middle lift; two undos reach the donor with the store empty | goblet 0/1 | leg press 1/1 |
| 5s | M4 snapshotted day, three orderings | 0/3 | 3/3 |
| 6a | Swap or undo on an untouched day writes no `ia_hist_`, `_cut` unchanged | 0/36 | 0/36 |
| 6b | Injury overlay still pierces a swapped, untrained day | unmeasured, gatekeeper prints on both | same on both |
| 6c | Trained day with no swap byte-identical across the build; tick-only `_cut` equals baseline | unmeasured, gatekeeper prints on both | same on both |
| 7 | 0 engine cards differ; HALF_MANNY digest equals the current row | pass | pass |

Sabotage, each tripping a named row: drop R1 in `applySwapChoice` (row 1, `draft|touch_then_swap`); drop R1 in `undoSwap` (row 2); drop R2 (rows 1 tick cells, 3, 4 tick cells); restore the `pruneSwaps` call AND function together (rows 1 `none` cells, 2, 5); delete the `_swapCut` writer, the COPY shape (row 4d at 6/42, row 4 at 30/42); drop R4's composition (row 5). A "restore the call only" mutation throws inside the :15933 try block and takes `applySessionSwaps` down with it; that trips row 1 for the wrong reason, so the spec restores both.

### Blast radius (additions)

Every goal, focus and calendar, session-store only, nothing in `buildProgram`. Beyond the prior list: a second swap on one slot now shows the athlete's last choice on untouched days, current week and past; a Log-first day now keeps its adds and skips across a reboot (R2, measured on V221 as lost). `pruneDayEdits` keeps pruning exactly as it does today.

### What needs Mario

One thing, ship scope: R4 rides in V222 or holds as build 2c. Recommend in: it is one map build inside a function this build already owns, its before-number is printed (goblet 1/1 on V221 and both copies), it has a clean row and a clean sabotage, and without it the after-table carries a cell where a record this build chose to keep shows a lift the athlete swapped out. Nothing doctrinal moves; the engine and HALF_MANNY are untouched; his own program gains what every program gains, and any swap of his that V221 already pruned stays one re-tap away, as before.

**Recommendation:** Ship V222 as R1 + R2 + R3' (call and function deleted, `_swapCut` writer and `pruneDayEdits` kept, both comments rewritten) + R4, with gate row 3 redefined as boot-orphaned logs (72 to 0), the exw count demoted to a control, and row 4 carried with its double-apply control at 0/42.

**Counter:** COPYa is the exact tree measure printed 504/504, 42/42 and 7/7 on and R4 is not, so if V222 must ship as a measured tree, hold R4 as build 2c and pin row 5 with a licence predicate that refuses above `ia-version` 222, never as a bare assertion of goblet.

## MARIO DECISION (re-ruling)
- 2026-09-25, V222 build chat: R4 SHIPS IN V222 (coach recommendation accepted). V222 = R1 + R2 + R3' + R4, gate rows as the revised gate scope above. D-code at dispatch: D181.

## SECOND RE-RULING ON V222 PARKED SLICE 3 (chain detail, snapshot re-apply)

(Fresh coach spawn, 2026-09-25, V222 build chat. Evidence: `tests/measure/v222_swapdurable_chain.out.txt`, `tests/measure/v222_swapdurable_chain_seg.out.txt` (scripts beside them), builder's `scratchpad/builder/s3/detail_probe.out.txt`, the parked working-tree diff (`git diff index.html`, 24+/19-), and the HALF_MANNY digest printed this session on `git show HEAD:index.html` and the working tree: `0ac7da6b1691a8e1` on both. Trees named as measure named them: BASE = V221, MAP = the parked tree (composed name map), STEP = one `applySwapPrefs` per record in array order, SKIPHIST = MAP with no swap re-apply on days the freeze restored from `ia_hist_`. Line numbers are the V222 working tree at ruling time; builder re-greps every one. Saved verbatim by the main session.)

**D181 — P-SWAPDURABLE, second re-ruling: the boot replays the athlete's swaps the way the athlete made them, and never onto a day the freeze restored from `ia_hist_`.**

### Finding: what the numbers moved

Seven lines of the prior rulings did not survive the chain measure. Each one, with the number that killed it:

1. **"`applySessionSwaps` is idempotent by name: on a snapshot-restored day carrying the swap nothing matches" (original R3) and "idempotent against a snapshot" (re-ruling, and slice 3's E9 comment).** False for any two records where one record's `to` is another's `from`. collide2 (slot i A→X, then slot j B→A) leaves A on the card, and A's own record renames it: snapshot {X, A} boots {X, X}. t1|collide2 rewritten 1,287/1,326 on MAP and STEP alike, 1,126 of them with a duplicate name on a trained card; t1|exch3 1,035/1,035. BASE 0 in every class, and not because of idempotence: `pruneSwaps` deleted every record below `_cut` before `applySessionSwaps` ran, and a snapshot key sits in `_touched` (:15813), so `_cut` is above every snapshot week. R3' deleted the prune and kept only the idempotence claim as the guard. The prune was doing two things: one wrong (killing the record, so undo was unreachable and past untouched days lost the swap) and one right (never re-applying onto a snapshot). R3' removed both. **R3' cannot ship without an explicit replacement for the second.**

2. **"Re-applies exactly as it does on every unfrozen week today" (original R3).** The re-apply is not the live path. `_swapDetailFor` (:10090) is a function of the target and the detail it is handed, so the live path runs one hop at a time and the boot must too. MAP hands it the chain end and the engine detail: untouched days with slot detail ≠ live 1,229/15,545 (hop2+cyc2, reachable only), 0 names wrong. STEP 70/15,545, 0 names. BASE 1,572 detail and 14,706 names wrong.

3. **The re-ruling's After line "M4 untouched … BOOT1 Leg press 4×8–12".** The line was right; the parked form does not meet it. MAP boots Leg press 4×5–8 (probe: `_swapDetailFor(LP, eng 4×3)` = 4×5–8; `_swapDetailFor(LP, goblet(eng))` = 4×8–12). STEP boots 4×8–12, printed. Mario's own case: the toast said "Reps move to 8 to 12" on the goblet hop and "Same job, same numbers" on the leg press hop, and MAP boots 5 to 8 without a word.

4. **R4's "box to box … no hit".** A 2-cycle through the sheet is two hops, not zero. Live: box 4×3 → goblet 4×8–12 → box 4×8–12 (null row carries verbatim). MAP composes box→box, no hit, boots the engine's box 4×3. STEP boots box 4×8–12 = live (seg §5). 2-cycles are reachable through the sheet in 1,132 of 15,545 chains (mario 474, manny 664).

5. **The freeze-invariant paragraph "trained days stay byte-identical to what the athlete was SHOWN and the engine never rewrites them."** True of the engine, false of the swap store on MAP and STEP: t1|collide2 1,287, t1|exch3 1,035, t1|hop2 19, up_bt|hop2 8,005/14,411 (the V221 snapshot holds goblet, the athlete trained goblet, V222 boots leg press). SKIPHIST 0 in every class and every mode. The invariant stands; R5 below is what makes the store obey it.

6. **Gate row 5 "booted card shows the last choice".** Name held on MAP; detail did not. The last choice includes the numbers the toast announced.

7. **STEP's 70 and its 157-row residue are not a form effect.** Every residue row's boot equals MAP's boot (157/157), and the mario rows are the boot-side injury re-filter appending "— hold RPE 7, two in the tank" to a superset item the live card showed as "2×8": `applySessionSwaps` runs `applyInjuryFilter` on a hit (:10279) and `applySwapChoice` never does. Pre-existing on V221, out of scope, carried to §12 below.

### Coaching argument

The prescription on screen when the athlete decides is the record. A swap is the athlete telling the app what the day is; the toast is the app telling the athlete the numbers. The boot's only job is to put back what the toast promised, in the order the athlete built it, through the same function the live path used. Anything else is a second lens on the same movement, and the one place a second lens is worse than none is where nobody sees the correction happen. The live path has two real defects the chain measure exposed (a rep window that only ever ratchets up, and a rep target lost through an unloadable middle hop); both are fixed on the live path with a toast, never at boot, and neither is this build.

A trained day is the record, full stop. R1 already folds every swap and undo into the snapshot, so on a V222-era day the snapshot carries the athlete's final choice by construction and the record on that day exists for one reader: the undo chip. There is nothing for the boot to add to a snapshot, and F2 shows what it subtracts.

### What changes

**R4 becomes R4': records on one day replay in recording order, one record per pass.** Site: the map build inside `applySessionSwaps` (:10274-10278) and only there. For each record in array order (the order `recordSwap` :10242 maintains by push), build a one-entry map `{from: to}` and call `applySwapPrefs(day.sections, m1)`; run the injury re-filter once if any pass hit, exactly as today. No composed map, no chain resolution, no sort by `ts`: array order is recording order by construction. `applySwapPrefs` (:10126), `_swapDetailFor`, `recordSwap`, `undoSwap` (:14369), the chip readers and the build-time `cfg.exSwapPrefs` caller are untouched. The `applySessionSwaps` header comment (:10263-10266, "Idempotent: a frozen week already carrying the swap has no name left to match") is rewritten: records replay in recording order through the same function the sheet used, so the booted card is the card the athlete built; days the freeze restored from `ia_hist_` never reach this function (R5).

**R5 is added: session swaps are never re-applied to a day the freeze restored from `ia_hist_`.** Site: `refreshProgram`. The `_snap` branch (:15904, `if(_snap){ _merged[d] = _snap; return; }`) marks its key; before `applySessionSwaps` (:15941) every marked key is withheld from the store object handed to it. The record is skipped, never deleted and never saved: undo on that day reads it (row 2, 7/7 on SKIPHIST). Days restored by branch 2 (touched, no snapshot: legacy) and branch 3 (past untouched, stored grid) still get the replay: on those the stored grid is the closest thing to what the athlete saw and carries the donor. The call-site comment (:15934-15938, "Idempotent by name match — a frozen week already carrying the swap has no name left to match") is rewritten to R5's sentence. Builder chooses the mechanism (a set the restore fills, or a filtered copy of the store); the semantic is the contract: a record keyed to a day the freeze restored from `ia_hist_` this boot is neither applied nor touched.

**R3' stands, conditional on R5.** The call and function stay deleted; `_swapCut` and `pruneDayEdits` stay as the re-ruling left them. Slice 2 is intact.

**Comments carrying the false premise, all rewritten in this build (four sites):**
- `pruneDayEdits` comment (:10230-10233, slice 3's E9). Must now say: session swaps are never applied to a day restored from `ia_hist_` (R5), because the snapshot carries the athlete's swaps by construction (R1) and re-applying a record onto it rewrites the day whenever one record's `to` is another's `from`. `applyDayEdits` has no such exclusion and is not idempotent (it rewrites every item's `_skipped` from the store and pushes adds deduped by name only), so on a touched week this prune is what keeps the store from arguing with a record `resnapshotDayEdit` has already folded the edit into.
- `applySessionSwaps` header (:10263-10266): as above under R4'.
- The `refreshProgram` call-site comment (:15934-15938): as above under R5.
- The swap-store header (:10147-10153, "The store covers exactly that window, from the swap until the first logged set, and prunes itself once the week freezes"): a record lives until the athlete undoes it (V222 D181); it is replayed in recording order on days the freeze did not restore from `ia_hist_` and left alone on days it did.

**Freeze-invariant clause (handoff §11f V104 line), one addition:** "…the athlete's own edits fold in. A swap alone never creates a snapshot. The swap store replays in recording order and never onto a day restored from `ia_hist_`."

### What the athlete sees on an untouched day (R4', all three lines printed on STEP)

- **Chain, box→goblet→leg press.** Live: box 4×3 → "Reps move to 8 to 12" → goblet 4×8–12 → "Same job, same numbers" → Leg press 4×8–12. Boot: Leg press 4×8–12. Chip offers goblet; undo → goblet 4×8–12, chip offers box; undo → box 4×3, store empty. (MAP booted 4×5–8; V221 booted goblet.)
- **2-cycle, box→goblet→box through the sheet.** Live: box 4×8–12 ("Same job, same numbers"). Boot: box 4×8–12. Chip offers goblet (record goblet→box); undo → goblet 4×8–12; undo → box 4×3 (undo walk on the 2-cycle is expected from `undoSwap`'s `rx`, not printed). (MAP booted box 4×3; V221 booted goblet.) Note the live card here is a positional Main at 8–12: that is D177's live path, §12 item (A) below, and the boot must reproduce it, not silently fix it.

### What deliberately does NOT change

- R1, R2 as landed (slices 1 and 2). Every line of the re-ruling's "does not change" list.
- `applySwapPrefs`, `_swapDetailFor`, `recordSwap` (including its same-`from` filter), `undoSwap`, D177 R4's `rx`, `applyDayEdits`, `pruneDayEdits`, `applyRestDayMoves`, `ia_moves_`, boot order (moves, swaps, edits).
- The boot-side injury re-filter after a swap hit (:10279). It is the STEP residue (70 detail rows, 0 names) and pre-exists this build; §12 (C).
- up_ts days from the V221 era (touch, then swap, no boot before upgrading): V222 boots the snapshot, which holds the donor, exactly as V221 would have. 14,376/14,412 hop2 days, equal to BASE. One re-tap, which R1 now folds into the snapshot so it holds. This is the deliberate cost of R5 and it is not a regression: V221 had already lost those swaps.
- up_bt days (chain, V221 boot, touch): the snapshot holds what V221 showed and the athlete trained on (goblet); V222 boots goblet. 0 rewrites.
- No record is ever deleted by the boot path. No bound on the store (M6 stands).
- Nothing in `buildProgram`. HALF_MANNY digest `0ac7da6b1691a8e1` on V221 and the parked tree, printed this session; no era row.

### Before (V221 and the parked MAP tree; mario W5 Thu, from seg §5 and the premise lattice)

```
box>goblet>LP|u      BASE DB goblet squat 4×8–12 !=live   MAP Leg press 4×5–8 !=live(4×8–12)   STEP Leg press 4×8–12 =live
box>goblet>box|u     BASE DB goblet squat 4×8–12 !=live   MAP BB box squat 4×3 !=live(4×8–12)  STEP BB box squat 4×8–12 =live
box>goblet>LP|t1     BASE BB box squat 4×3 !=live         MAP Leg press 4×8–12 =live           SKIPHIST Leg press 4×8–12 =live
box>goblet>LP|up_ts  BASE BB box squat 4×3 !=live         MAP Leg press 4×5–8 !=live           SKIPHIST BB box squat 4×3 !=live (= V221)
box>goblet>LP|up_bt  BASE DB goblet squat 4×8–12 =live    MAP Leg press 4×8–12 !=live          SKIPHIST DB goblet squat 4×8–12 =live
u|hop2+cyc2  detail!=live / name!=live of 15,545:  BASE 1,572/14,706   MAP 1,229/0   STEP 70/0   SKIPHIST 1,229/0
u|collide2 whole day!=live of 1,327: BASE 559  MAP 48  STEP 0        u|exch3 of 1,035: BASE 1,035  MAP 209  STEP 0
t1|collide2 boot!=hist of 1,326:  BASE 0  MAP 1,287 (dup name 1,126)  STEP 1,287  SKIPHIST 0
t1|exch3    boot!=hist of 1,035:  BASE 0  MAP 1,035  STEP 1,035  SKIPHIST 0
up_bt|hop2  boot!=hist of 14,411: BASE 0  MAP 8,005  STEP 8,005  SKIPHIST 0
up_ts|hop2  boot!=live of 14,412: BASE 14,376  MAP 1,132  STEP 87  SKIPHIST 14,376
premise lattice: V221 190/504, undo 1/7, M3 13/42 | MAP, STEP, SKIPHIST each 504/504, 7/7, 42/42, M4 snapshotted 3/3, neg (a) 0/36
```

### After (expected: R4' + R5 = STEP on days the freeze did not restore from `ia_hist_`, SKIPHIST on days it did; the two edits act on disjoint days and were not printed as one tree)

```
box>goblet>LP|u      Leg press 4×8–12 =live        (STEP printed)
box>goblet>box|u     BB box squat 4×8–12 =live     (STEP printed)
box>goblet>LP|t1     Leg press 4×8–12 =live =hist  (SKIPHIST printed)
box>goblet>LP|up_ts  BB box squat 4×3, = V221; one re-tap then holds   (SKIPHIST printed; the hold is R1, expected)
box>goblet>LP|up_bt  DB goblet squat 4×8–12 =live =hist   (SKIPHIST printed)
u|hop2+cyc2  detail!=live / name!=live of 15,545:  ≤70 / 0   whole day == live 15,533/15,666 (STEP printed; residue = boot injury re-filter, boot equals MAP boot 157/157)
u|collide2 whole day == live 1,327/1,327; u|exch3 1,035/1,035   (STEP printed 0/0/0)
hist-restored day boot == ia_hist_: 0 rewrites in hop2, cyc2, hop3, cyc3, collide2, exch3 × t1, t2, up_st, up_bt, up_ts   (SKIPHIST printed)
duplicate name on a booted hist-restored card: 0   (SKIPHIST printed)
premise lattice 504/504, undo 7/7, M3 42/42, M4 snapshotted 3/3, neg (a) 0/36   (printed on STEP and on SKIPHIST separately; S+S expected)
```

### Revised gate rows (each: V221, parked MAP, expected after)

| Row | Predicate | V221 | Parked MAP | After |
|---|---|---|---|---|
| 1 | Lattice DURABLE (M0), per cell | 190/504 | 504/504 | 504/504 |
| 1c | Controls `draft|swap_then_touch`, `done|swap_then_touch` | 72/72 | 72/72 | 72/72 |
| 2 | Undo reachable after reboot on a snapshotted day, donor 4×3 by position, record cleared, survives boots 2 and 3 | 1/7 | 7/7 | 7/7 |
| 3 | Boot-orphaned logs (key on last live card, absent from booted card) | 72/504 | 0/504 | 0/504 |
| 3d | Control: exw entry count equal across reboot | 504/504 | 504/504 | 504/504 |
| 4 | M3 add/skip × swap on a frozen day, live==boot and live==next-week boot | 13/42 | 42/42 | 42/42 |
| 4d | M3 double-apply | 0/42 | 0/42 | 0/42 |
| 5 | M4 untouched, box→goblet→leg press: booted card equals the last live card in name AND detail (Leg press 4×8–12); chip offers goblet; two undos reach box 4×3, store empty | goblet 4×8–12, 0/1 | Leg press 4×5–8, 0/1 | 1/1 (STEP printed) |
| 5s | M4 snapshotted day, three orderings | 0/3 | 3/3 | 3/3 |
| 5c NEW | 2-cycle on an untouched day through the sheet, box→goblet→box: booted card equals the last live card (box 4×8–12) | goblet, 0/1 | box 4×3, 0/1 | 1/1 (STEP printed) |
| 5L NEW | Untouched reachable chains, hop2+cyc2, two configs, W3/W5/W7: slot name ≠ live 0/15,545; slot detail ≠ live at most 70/15,545, and every residue row's boot equals a composed-map boot (so the residue is the injury re-filter, not the form). Licence predicate keyed on `ia-version` 222, refuses above | 14,706 / 1,572 | 0 / 1,229 | 0 / ≤70 (STEP printed 70) |
| 5X NEW | Untouched collide2 and exch3, whole day == live | 767/1,326, 0/1,035 | 1,279/1,327, 826/1,035 | 1,327/1,327, 1,035/1,035 (STEP printed) |
| 6a/6b/6c | As the re-ruling | | | same on both |
| 7 | 0 engine cards differ; HALF_MANNY digest equals the current row | `0ac7da6b1691a8e1` | same | same (printed this session) |
| 8 NEW control | A day restored from `ia_hist_` boots byte-equal to its snapshot in every class (hop2, cyc2, hop3, cyc3, collide2, exch3) and every snapshot mode (t1, t2, up_st, up_bt, up_ts) | 0 rewrites everywhere | t1|collide2 1,287, t1|exch3 1,035, t1|hop2 19, up_bt|hop2 8,005, up_bt|cyc2 643, up_ts|hop2 14,376 | 0 everywhere (SKIPHIST printed). Passes on V221 too; labelled a control; S4 below is what proves it |
| 8d NEW | No duplicate item name on a booted hist-restored card | 0 | 1,126 + 40 | 0 |
| 9 NEW | Upgrade equivalence: up_ts (V221 touch, chain, no boot) boots day-for-day what V221 boots (the snapshot, donor) | 14,376/14,412 boot≠live | 1,132 | 14,376/14,412, byte-equal to V221's boot (SKIPHIST printed). Then: one re-tap, reboot, holds (expected via R1; the `draft|touch_then_swap` 72/72 cell is that shape) |
| 10 NEW | The record on a hist-restored day survives the boot unchanged (skipped, never deleted or rewritten) and the undo chip is offered | n/a (pruned) | kept | kept |

Gatekeeper prints the S+S numbers on the final artifact with measure's own script (`v222_swapdurable_chain.js`, TREES = {BASE, FINAL}); hop2, cyc2, collide2 and exch3 are fully enumerated, hop3/cyc3 stay the sampled 667.

### Sabotage (each trips a named row; anchor `count==1` or NOT-APPLIED)

- S1: composed name map (the parked MAP shape) → rows 5, 5c, 5L, 8, 8d.
- S2: V221 plain assign, no chain → rows 5 (goblet), 5L.
- S3: replay in reverse array order → row 5 (goblet→LP finds nothing, then box→goblet).
- S4: drop R5 (apply onto hist-restored days) → rows 8, 8d, 9.
- S5: R5 deletes the record and saves instead of skipping → rows 2 (chip absent after reboot), 10.
- S6: R5 withholds every key (swaps never applied) → rows 1 (`none|-` 0/72), 5.
- The re-ruling's six stand: drop R1 in `applySwapChoice`; drop R1 in `undoSwap`; drop R2; restore `pruneSwaps` call and function together (rows 1 `none` with another day touched, 2, 5); delete the `_swapCut` writer (4d at 6/42); "drop R4" is S2.

### Slices

- Slices 1 and 2 (R1, R2, R3') survive as landed. Nothing in this re-ruling touches them.
- Slice 3 as parked is replaced in two of its hunks and kept in one: the R4 map build (:10274-10278) is superseded by R4'; E9 (:10230-10233) is superseded by the `pruneDayEdits` text above; the `ia-version` bump to 222 stands.
- Suggested cut (session's call): slice 3' = R4' replay + the `applySessionSwaps` header comment (one function, one or two edits). Slice 4 = R5: the `_snap` mark, the pre-apply withhold with its call-site comment, the `pruneDayEdits` comment, the swap-store header comment (four edits). Handoff lines: the re-ruling's list plus its own "idempotent against a snapshot" sentence (ruling file :116), superseded by this section.

### Unknowns carried (measure's list, plus two from code reading), and §12 additions

Not this build; none blocks it; each named so gatekeeper prints what it can and §12 holds the rest.

- Rest-day moves between the restore and the swaps: R5 keys on the restore key, `snapshotDay` and `recordSwap` key on the viewed day. A moved, snapshotted, swapped day is unmeasured and pre-existing (the original ruling's "Rest-day moves and `ia_moves_`" line). Gatekeeper prints one case on both trees as an information row.
- Add/skip combined with chains; undo on collide2/exch3 days (code reading: undo by name on a collide2 day yields two items of one name on the LIVE card with no boot involved, pre-existing); the 200 manny unreach rows; the 19 manny t1|hop2 rewrites (0 on SKIPHIST regardless).
- §12 (A), live path: `_swapDetailFor` raises to a window and never lowers, and a null-row lift carries whatever it is handed, so a 2-cycle or a hop back leaves a positional Main above REP_AFFINITY's 6-rep cap (box 4×8–12, seg §5). Fix on the live path with a cap branch mirroring the floor branch and its own toast; never at boot.
- §12 (B), live path: a rep target lost through an unloadable middle hop is never regained on a loadable end (1,117 of 16,341 chains end on "N sets"; seg §1). D177 R4's `rx` already holds the slot's original detail by position; re-derive there, with the V119 toast's inverse; never at boot.
- §12 (C), boot path: `applySessionSwaps` re-runs `applyInjuryFilter` on a hit and `applySwapChoice` never does, so an injured athlete's swapped superset boots with copy the live card never showed (Mario W5: 68 hop2 + 12 hop3 rows; manny 77, cause not isolated). Since V162 D3 the sheet's candidates are already injury-legal; measure whether the re-filter is redundant.
- §12 (D): `recordSwap`'s same-`from` filter collapses a chain that revisits its donor (box→goblet→box→LP stores [goblet→box, box→LP]; every form boots LP 4×5–8 against live 4×8–12). Unmeasured class, detail only, name correct.

### Blast radius, in coaching terms

Every goal, focus and calendar; session store only; `buildProgram` untouched (digest equal). Versus the parked tree: on untouched days with two or more swaps on one slot the booted numbers are now the numbers the toast announced (1,229 → ≤70 of 15,545 detail mismatches, 0 names either way); on untouched days with cross-slot chains the whole card matches the live card (collide2 48 → 0, exch3 209 → 0); on trained days nothing the boot does can change a card any more (collide2 1,287 → 0, exch3 1,035 → 0, V221-era up_bt 8,005 → 0, duplicate names 1,166 → 0); V221-era touch-then-swap days boot as V221 booted them (14,376, one re-tap that now holds). `pruneDayEdits` unchanged. Undo unchanged.

### What needs Mario

Two things, both his: ship scope and one doctrine-adjacent trade.

1. **Ship V222 as R1 + R2 + R3' + R4' + R5.** Note that "hold R4' and R5 as build 2c" is not available: R3' without R5 ships F2 (the prune was the only thing keeping records off snapshot days), so the alternative to shipping all five is holding the whole build.
2. **The up_ts trade.** R5 makes a trained day's snapshot absolute, even against the athlete's own swap that V221 lost before the upgrade: those 14,376 hop2 days boot the donor once, as V221 would have, and one re-tap now sticks. MAP or STEP without R5 would recover them, at the price of 8,005 rewritten trained days in up_bt and 1,126 trained cards with a duplicate name. His own program moves only the way every program moves: nothing in the engine, and if he swapped after logging on V221 without booting since, that day boots the donor once.

**Recommendation:** Ship V222 with R4' (per-record replay in recording order) and R5 (no re-apply onto a day restored from `ia_hist_`, record kept), gate rows 5, 5c, 5L, 5X, 8, 8d, 9, 10 added and sabotage S1 to S6 alongside the re-ruling's six; R3' is conditional on R5 and slices 1 and 2 stand.

**Counter:** MAP or STEP without R5 recovers 14,376 V221-era touch-then-swap days that R5 leaves one re-tap short, and MAP's leg press 4×5–8 is what the engine would have prescribed in that slot; both are silent corrections of a card the athlete was shown and told the numbers of, and the first costs 8,005 rewritten trained days, so the counter loses on the freeze invariant alone.

## MARIO DECISION (second re-ruling)
- 2026-09-25, V222 build chat: SHIP ALL FIVE. V222 = R1 + R2 + R3' + R4' + R5 (coach recommendation accepted). The up_ts trade ACCEPTED: a V221-era touch-then-swap day with no reboot since boots the donor once, as V221 would; one re-tap then holds. R5 stands as ruled; no re-apply onto a day restored from `ia_hist_`.
