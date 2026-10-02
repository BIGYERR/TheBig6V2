# D192 P-UNDOKEY — RE-RULING for V228: the undo chip names the lift that just left

Coach, fresh spawn, ruling against `tests/measure/v228_rulings/measure_undokey_v227.md` as given (every section, the 480 follow-up and the h5 last line). Target V228 (artifact V227, HEAD 5ce31e8; the working tree's D193 slices ignored). Printed this session from the V227 artifact with the harness: `ia-version 227 | weeks 14 | startDate null | seed 76308 | digest 0ac7da6b1691a8e1`, `self-stable yes`; HALF_MANNY W3 THU `Posterior Chain {Speed Run — Intervals} :: Main — Trap bar deadlift[Trap bar deadlift] | Pull superset A[Pendlay row, Weighted chinups] | Pull superset B[Kettlebell single-arm row, Broad jumps]`; W5 FRI `Recovery Lift {Recovery Run} :: … Core — Rotational Power[Band woodchopper (door anchor), Windshield wipers]`. Read on V227: `recordSwap` :10279–10291 (same-from filter :10286), `applySessionSwaps` :10305–10322, chip render :12825–12836, `swapOriginOf` :14176–14180, `undoSwap` :14436–14463, `resnapshotDayEdit` :1309 (`if(!h[k]) return;`), `_histRestored` :15812 and :16031, g227's rows d-U, d-U' and the INFO D192 line (:403–439), `tests/sabotage/v227_d190.json`, measure's `v228_undokey_lowback_v227.out.txt` U_d/U_d' rows for h3, h4, h5.

## 1. Finding (measure's, ruled against as given)

One read-side line (`swapOriginOf` :14179 `[0]` to `.pop()`, anchor count 1, no literal on it) heals the chip and the undo on every chain whose last target repeats an earlier target on the day: strict A>B>C>B hop3 28,246/28,246 wrong on V227 to 0 (HALF_MANNY 5,454/5,922 family chains; mario_noinj 6,190; lowback_wa 4,608; elbow_wa 6,032; mario 5,962), every hop4 revisit shape enumerated on lowback_wa W3 Mon+Tue 20,273/20,273 to 0 (A>B>C>D>B 9,172, A>B>C>D>C 9,672, A>B>C>A>C 735, A>B>A>C>A 694), the hop5 1,000-sample 191/191 to 0. Created wrong: 0 everywhere. No chip missing: 0. CF2 (also `.pop()` at `undoSwap` :14441) is byte-identical to CF on 21,609 chains; duplicate-`from` stores: 0 on every chain. HALF_MANNY `0ac7da6b1691a8e1` on V227, CF and CF2; 0 of 10 lattice digests move; no string moves. D190's (d) walk on CF: PASS 7 FAIL 0 on both trees; its INFO line goes from 28 wrong to 0 wrong, healed 28, created 0 of 44.

**The premise "CF boot == live after undo on every CF chain" is refuted as written.** The 480 "created" rows were the batched instrument (480/480 equal when each chain runs alone, fresh VM per act and per boot). The 268 boot != live on both trees are all A>B>A>B, D191's collapse, created 0 healed 0. But 2 of 1,000 five-tap lowback_wa chains are real: (i) A>B>C>D>C>B boots == live before the last tap, and after a correct undo boots Dumbbell row at the plan's capped dose while live keeps the carried bodyweight form; (ii) A>B>C>B>D>B boots != live before the undo already. Both have a repeated `from`.

## 2. The premise: retracted as written, restated on U

Retract "every CF chain." Restate: **on every chain whose store is a complete history (hop `from` names pairwise distinct, read off the chain tuple: D190's population U), boot == live after undo; on U' (a `from` repeats, so `recordSwap` :10286 has already dropped a record) boot == live after undo is D191's claim to prove, and D192 neither owes it nor can deliver it.**

This is a restatement, not a retreat, because on U it follows by construction. The chip is the last hop's `from`; on U that name owns exactly one record, the last one; `clearSwap` removes it and nothing else; the store after undo IS the store before the last tap. The boot after undo is therefore the boot before the last tap, which D190's row a-U proves equals live (residue 0 at V227), and the live day after undo equals the live day before the last tap by the rx restore (d2-UNDO below). Measure's isolated 480/480 is that corollary measured.

On U' the store after undo is the collapsed store minus the last record, not the pre-tap store. Chain (i) spelled out: hop 5 `Dumbbell row -> Cable curl` shares its `from` with hop 3 `Dumbbell row -> Inverted rows (bodyweight)`; :10286 drops hop 3 at the fifth tap. A correct undo leaves `[KB row -> Cable curl, Cable curl -> Dumbbell row, Inverted rows -> Dumbbell row]`; the third record finds nothing named Inverted rows on the card and is skipped; boot prints Dumbbell row `2×8 each — hold RPE 7, two in the tank`, live keeps `2 sets — RPE 8 (stop 2 reps short of failure)`. The write lost the hop. The read did not. V227 "passes" this chain only because its wrong undo jumps four taps to the grid lift and leaves three dead records, which erases the evidence. A gate that rewards that is a gate that asserts the wrong direction.

Coaching weight of the two chains, so nobody over-reads them:
- They bite only on a day the athlete has not logged. `resnapshotDayEdit` :1309 returns when no snapshot exists, and a day with a snapshot is restored from `ia_hist_` and never replayed (D181 R5, `_histRestored` :15812/:16031). One logged set on the day makes boot == live regardless of the store.
- The boot side is the plan's capped dose. The live side is a bodyweight sets form carried onto a loaded lift (V222 note (3)(B)) at RPE 8 on a capped pattern (D193's class, clamped by this same build). Neither is an injury exposure; the boot side is the better prescription.
- Chain (ii) is wrong on boot before the undo. D192 creates no wrong dose anywhere; it stops hiding a lost record on 2 of 1,000 five-tap chains.

## 3. Ruling: D192 ships at V228 as ruled, one line

**Changes:** `swapOriginOf` :14179 takes the most recent record whose `to` is the card's name (`.filter(...).pop()`). Nothing else.

**Deliberately does NOT change:** `undoSwap` :14441 stays first-match (section 4). `recordSwap` :10286's same-from filter stays (D191). `applySessionSwaps` replay order stays. `buildProgram` untouched. The chip label `SWAPPED IN for`, the button `put it back` and the toast `<lift> is back on the card.` are unchanged; only the lift name inside them moves.

**The two-chain class is not licensed; it is excluded by the hand rule and printed as INFO under D191.** A licence is a predicate keyed on an era that expires at a version. D191 has no ship version, so the only honest key would be `VER == 228`, which restarts the D181 5L treadmill (re-ruled at 222, 223, 224, 225, 226) for a class D192 does not own. INFO asserts nothing and needs no era; standing ruling 2 keys predicates, not prints. So D192's gate asserts boot == live after undo on U (froms pairwise distinct) and prints U' as INFO under D191 P-SWAPREVISIT with created and healed against V227 and every created chain printed by name with its repeated `from`. **No pair row on U' boot**: it would read created 2 and need the licence just refused. This is D190's row (a)/(a-U') construction minus the pair row, with the omission and its reason in the gate header.

**D191 inherits two lines (its §12 entry):** "D191's gate owns boot == live after undo on U' (D192 INFO at V228: hop3 268 A>B>A>B on both trees, hop5 lowback_wa 1,000-sample created 2 healed 24 vs V227). D191's slice takes `undoSwap` :14441 to `.pop()` in the same slice that changes `recordSwap`, with a seeded two-records-per-`from` row as its trip, if it rules the store keeps every record."

## 4. `undoSwap` :14441: waits for D191

Hold the prior ruling. (1) It is a provable no-op today: at most one record per `from` since the first commit, 0 duplicate-`from` stores on every chain, CF2 == CF 21,609/21,609. (2) A line that changes nothing cannot trip a gate: `.pop()` to `[0]` at :14441 would survive every spec by construction, which this repo reads as a mutation defect, and a line that ships without a named trip is standing ruling 3's dead pin in reverse. (3) The only row that could test it seeds a store with two records per `from`, a shape no writer produces, whose meaning (what one undo is on a revisited donor) is D191's open doctrine question; if D191 rules "undo pops the day's last record regardless of card", the by-`from` reader is rewritten anyway. D192 states the rule; the ruling that changes the store builds the `from` side, in the same slice, with its own trip. Counter: two readers of one store on different keys is the two-lens smell. Rebuttal: the lenses agree today by construction, and the inheritance line above is in D191's brief so it cannot be missed.

## 5. Gate, sabotage, fuzz

**`tests/gates/g228_d192_undokey.js`**, own file, keyed to D192, predicate `VER >= 228`, REFUSED below (every row FAILS by name on V227 under gate.sh). Baseline argv[3] = V227 with the g227 git fallback (`git show 5ce31e8:index.html`), because `sabotage.py` passes no argv[3]. Oracle never asks `swapOriginOf` or `undoSwap`: the chip, the store and the undo target are read off the chain tuple. Fresh VM per act and per boot (the 480 lesson). Populations by hand from the tuple: U_d / U_d' (tos pairwise distinct / some `to` repeats: the chip's population) and U / U' (froms pairwise distinct / some `from` repeats: the store's population). A>B>C>B is in U and in U_d'; A>B>A>B is in U' and in U_d'.

Walk: the g227 (d) walk's seven classes on the five configs (hop1, hop2, cyc2 enumerated; hop3, cyc3, collide2, exch3 sampled), plus a fixed-seed hop4 sample on lowback_wa W3 Mon+Tue with each of the four revisit shapes non-empty, plus measure's hop5 sample (seed `mulberry(0xC0FFEE+…)`, lowback_wa W3 Mon+Tue, 1,000) so its counts are reproducible.

| row | population | asserts | expected V228 | expected V227 (assumed 228) |
|---|---|---|---|---|
| **d2-CHIP** | whole walk | chip on the last hop's card is found and equals the last hop's `from`; residue 0; `|U_d'| > 0`; every shape non-empty | 0 wrong | wrong on every strict A>B>C>B (28/28 of the (d) walk's 72 U_d'; 0/44 A>B>A>B), every hop4 revisit sample, 191/1,000 hop5 |
| **d2-UNDO** | whole walk | after `undoSwap(chip)` the live day, clock fields stripped, is byte-identical to the live day before the last hop; on U the day's store equals the chain's first n−1 hops in recording order (hand list); on U' the store is not asserted | 0 wrong | the same failing set as d2-CHIP; store after A>B>C>B undo `[RDL -> DL, DL -> RDL]` vs hand `[TBDL -> RDL, RDL -> DL]` |
| **d2-BOOT-U** | U only | after undo a fresh-VM boot of the day equals live; residue 0; `|U| > 0`; every class and config prints | PASS | PASS (an invariance; corollary of a-U + d2-UNDO). Residue here on collide2 or exch3 refutes a-U or the replay, not D192: park, measure, re-rule (standing ruling 7) |
| **INFO D191 P-SWAPREVISIT** | U' | never asserted, never licensed: `|U'|`, boot != live after undo on candidate and baseline, created, healed, every created chain by name with its repeated `from` | within measure's instrument: hop3 268/268 both trees, created 0; hop4 2,999 vs 4,216, created 0, healed 1,217; hop5 54 vs 76, created 2 (A>B>C>D>C>B, A>B>C>B>D>B), healed 24 | same |
| **d2-MANNY** | HALF_MANNY | digest equals the era table (`0ac7da6b1691a8e1`); the D192 statement that one read-side line reaches no build | PASS | PASS |

A created count above 2 on the same seed, or any created chain whose froms are pairwise distinct, is a refutation, not INFO: stop and re-measure.

**D190's g227 row (d): not edited, not re-keyed.** d-U and d-U' (created 0 vs V226) stay true at 228 because D192 heals and never breaks. The INFO D192 line keeps printing; expected at 228: undo wrong 0, chip != hand chip 0, healed vs V226 28. §12's "re-keyed under it" resolves as: the assertion lives in g228; g227 is untouched.

**Sabotage `tests/sabotage/v228_d192.json`:** one mutation, `.pop()` to `[0]` at :14179, anchor `const hit=list.filter(e=>e&&e.to===name).pop();` count 1. NAMED TRIP: g228 d2-CHIP and d2-UNDO at the A>B>C>B, hop4 revisit and hop5 U_d' classes. d2-BOOT-U, INFO and d2-MANNY stay green, and g227's row (d) does not trip (by design; its INFO line prints 28 wrong again). d2-BOOT-U staying green under this spec is the proof the spec hits the chip key and not undo at large. The existing S6-D190 (drop the rx restore) also trips g228 d2-UNDO and d2-BOOT-U; adding g228 to its note is gatekeeper's shape call.

**Fuzz:** the "live == boot after undo" row is scoped to U by the hand rule; U' residue prints under D191.

**HALF_MANNY (standing ruling 5):** UNMOVED, `0ac7da6b1691a8e1` printed this session on V227 and by measure on CF and CF2. The era row `MANNY_DIGEST_BY_VERSION[228] = [227]` already exists for D193; D192 adds a clause to that row's comment, no new row, no new digest.

## 6. Blast radius (coaching terms)

- Every goal, focus, calendar, week, injured or not: the chip and the undo on any card reached by a chain whose last target was already a target on that day. The chip names the lift that just left instead of the grid lift; one undo walks back one step with the dose last seen on that lift; a chip follows; a second undo walks back again; the store keeps the live hops. HALF_MANNY: 5,454 of its hop3 family chains (W3 Thu example below).
- U' boot-after-undo on unlogged days: D191's class becomes visible where V227's jump hid it; 2/1,000 on the hop5 sample, 0 at hop3 and hop4 on everything measured.
- Nothing moves in `buildProgram`, any grid, run day, long-run tier, race week, or digest (0/10). No athlete-facing string.
- Not measured and accepted as not blocking: hop5 on the other four configs and hop4 beyond lowback_wa W3 Mon+Tue (the mechanism is a property of the store shape, not the config; the gate's INFO row prints them); device stores with two records per `from` (no writer has ever produced one).

## 7. Mario

Two lines, by ruling name. The first is his to decide (ship/hold on what his chip names); he was told at V227 and the question closed unanswered (handoff :830).

> **D192 P-UNDOKEY** ships in V228 with D193. On your program, a swap back onto a lift you already tried on that slot now shows a chip naming the lift that just left (W3 Thu: Deadlift, not Trap bar deadlift), and one undo walks back one step with the dose you last saw on it, then a chip follows. Nothing on your cards moves. Recommendation: ship.
>
> **D191 P-SWAPREVISIT**, FYI, not built: on a day you have not logged yet, a chain that swaps the same lift out twice already boots to a different dose than it showed (since V222). D192's one-step undo makes that visible on 2 of 1,000 five-tap chains measured, where the old two-tap jump hid it. One logged set on the day removes it. Recommendation: D191 queues after V228 with its own measure; no hold on D192.

## Before (V227, printed this session; mario and HALF_MANNY W3 Thu, Trap bar deadlift > Barbell RDL > Deadlift > Barbell RDL)

```
ia-version 227 | weeks 14 | startDate null | seed 76308 | digest 0ac7da6b1691a8e1
W3 THU Posterior Chain {Speed Run — Intervals} :: Main — Trap bar deadlift[Trap bar deadlift] | Pull superset A[Pendlay row, Weighted chinups] | Pull superset B[Kettlebell single-arm row, Broad jumps]
tap 3 -> RDL, store [TBDL->RDL, RDL->DL, DL->RDL]   chip "SWAPPED IN for Trap bar deadlift"
undo                                                 Trap bar deadlift (two taps back), no chip, store [RDL->DL, DL->RDL] dead
next boot                                            Trap bar deadlift
```

## After (expected V228)

```
ia-version 228 | weeks 14 | startDate null | seed 76308 | digest 0ac7da6b1691a8e1   (unmoved)
W3 THU Posterior Chain {Speed Run — Intervals} :: Main — Trap bar deadlift[Trap bar deadlift] | Pull superset A[Pendlay row, Weighted chinups] | Pull superset B[Kettlebell single-arm row, Broad jumps]   (unmoved)
tap 3 -> RDL, store [TBDL->RDL, RDL->DL, DL->RDL]   chip "SWAPPED IN for Deadlift"
undo                                                 Deadlift with its pre-tap detail, chip "SWAPPED IN for Barbell Romanian deadlift", store [TBDL->RDL, RDL->DL]
next boot                                            Deadlift (d2-BOOT-U; the chain is in U)
```

**Recommendation:** Ship D192 at V228 as one read-side line with the premise restated on U, `undoSwap` untouched until D191, a g228 gate whose d2-CHIP and d2-UNDO rows fail on V227 at the A>B>C>B class and whose U' complement prints as INFO under D191 with the two created hop5 chains named, and tell Mario in two lines with "ship" stated.

**Counter:** Hold D192 for a D191 build that fixes the write and the read together so no chain ever shows boot != live after undo; rebuttal, D191 has an unruled doctrine question and no measure, and holding leaves 28,246 wrong labels and two-tap jumps in place to protect 2 collapsed chains in 1,000 that already boot wrong on an unlogged day and that one logged set repairs.

---

## Mario's decision (2026-10-02, V228 chat) — main session record
"2. concur": **D192 P-UNDOKEY ships at V228**, with D193's wording part (R1 + R4) only; D193's clamp split to V229 (see `d193_caprpe_ruling.md`, round 2). D191 P-SWAPREVISIT queues after V228 (FYI given).
