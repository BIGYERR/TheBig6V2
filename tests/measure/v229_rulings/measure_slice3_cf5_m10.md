# M10 on CF5 (D194 Amendment 1), V229 chat 2026-10-03 — measure's report, saved verbatim by the main session

Script `tests/measure/v229_slice3_cf5.js` (parts `tree | gates | single | chains | report | guard | toastjobs | toast`), output `tests/measure/v229_slice3_cf5.out.txt`, raw in `…/scratchpad/measure3/cf5/`.

MODE     B (before-picture). This is M10 on a CF5 copy for D194 Amendment 1. I ruled nothing and edited no tracked file.

**Short answer.** Items 1, 3, 4 and 5 print exactly as Amendment 1 rules. Item 2 has **one miss: `g228_d192_undokey` on CF5 is PASS 4 FAIL 1, because GUARD is not clear.** The residue is the case the brief names: 115 of 117 created chains differ only in `_preHold`, all on D191-class chains (a repeated `from`). Per the brief, this goes back to coach before builder.

METHOD
- Trees: CF5 = sha 5ff9119afd7e, built from CF4 (68e0077e8096, M9's copy). Baselines from tags: V220 22daccb44d8f, V221 c28606362b96, V226 94ce52f12f8d, V227 c9069fe64113.
- Baselines equal themselves: V228 OV mario chains in this run equal the M9 run, 0 of 320 differ. M9 already proved stored-record and list self-equality on the same helpers.
- Oracles: the After block's literal route strings; Amendment 3 §4's persistence paragraph as a hand rule; the shipped gates' own rows. Each "byte-identical" claim is checked tree against tree (V228, SL2).

FINDING

**(1) diff CF4 → CF5.** `diff -u` shows exactly 2 hunks: `@@ -10348,11 +10348,16 @@` (applySessionSwaps) and `@@ -14505,7 +14510,8 @@` (undoSwap); 1 line removed, 7 added. mario OV W5 on CF5: swap 0 of 222 (22 cards), aux 0 of 66, add 0 of 79. HALF_MANNY `0ac7da6b1691a8e1` on V228 and CF5, self-stable. Uninjured builds CF5 == V228: 98 of 98. (b) object row, mario_noinj W5 thu, 4 hops then boot, undo-all, undo+boot: `_preHold` keys 0/0/0/0 on CF5 and on V228; the day JSON equals V228's at all 4 steps; no `ph` in the record.

**(2) Gates.** Each gate ran with its own usage-line baseline (seam, cuecap, prefpath: V226; undokey, cueword: V227; g221: V220; g222: V221).

| Gate | CF5 | V228 | Ruled |
|---|---|---|---|
| g227 seam | **7/0**; d-U residue 0 of 12,282; a-U 0 of 11,998; a-U′ created 0 | 7/0 | 7/0 ✓ |
| g228 undokey | **4/1**; d2-UNDO 0 of 2,201; d2-BOOT-U 0 of 1,587; **GUARD FAIL** "hop5 created 36, walk+hop4 created 81, created with no repeated from 0" | 4/0, GUARD clear | 4/0, GUARD clear — **MISS** |
| g221 | 14/6: G5a PASS, G5c PASS; G3a 832, G3c off-grammar 168 (power 0), G3d 263, G3e 202, G3f 199, G6a 1,252 | 20/0 | ✓ at the absorb figures |
| g227 cuecap | 7/1: c-TOAST 1,706 of 9,882 | 8/0 | ✓ |
| g228 cueword | 4/1: b-ONECLASS L432 380 of 432, home_basic 72 of 108 (same as the working tree) | 5/0 | ✓ |
| g222 chain | 8/0 | 8/0 | ✓ |
| g222 durable | 10/0 | 10/0 | ✓ |
| g227 prefpath | 4/0 | 4/0 | ✓ |

"Every moved toast a hold variant": the gate prints no examples, so I measured it on a different population. On the D190 chain lattice, fixture presentation, hop1/hop2/cyc2, CF5 vs V226: 1,915 of 2,268 hop toasts moved, and all 1,915 end with " Your injury plan holds this one at RPE 7."; 0 do not. By config: elbow 958, shoulder 442, lowback 350, hip 143, mario 22. This corroborates the claim; it is not the gate's 9,882.

**(3) mario W5 thu hand routes on CF5.** Fixture presentation, all three match the After block: U1: hop1 Barbell hip thrust `"2×6–10 @ RPE 8"` `_preHold "2×6–10 @ RPE 8"`, then undo → `Single-leg hip thrust "2×6–10 @ RPE 8" _preHold none`, day identical true. U2: undo → `Leg extension "2×6–10 @ RPE 7" _preHold "2×6–10 @ RPE 8"`, day identical true. RB: reboot slot `Leg extension "2×6–10 @ RPE 7" _preHold "2×6–10 @ RPE 8"`; hop3 live, boot and direct all `"2×6–10 @ RPE 8"`, equal. Before (SL2), for contrast: U1 leaves a stale `_preHold` (identical false); RB reboot slot shows `_preHold none`, with live `@ RPE 7` against boot and direct `@ RPE 8`. Overlay presentation: CF5 == V228 on 3 of 3 lines ("@ RPE 8" everywhere, `_preHold none`, identical true).

**(4) (q), D190 overlay chains, CF5 vs V228.** 0 of 13,323 W5 and 0 of 5,257 W3 move in any column (start, live, toast, boot, undo, undo+boot). `_preHold` keys: live 0, boot 0, undo 0, undo+boot 0 on the slot; booted days carrying any `_preHold` 0; undone days 0. `ph` 0, hold toasts 0.

**(5) Stores on the fixture** (mario, two hops, Barbell hip thrust then Leg extension). ia_programs: 0 `_preHold` after the hop, after the reboot, after the trained-day swap, and after that reboot. ia_swaps_PM: one `ph`, `w5_thu[1].rx[0].ph="2×6–10 @ RPE 8"` (the second hop's from-card), after hop and after reboot; identical on SL2. ia_hist_PM: `_preHold` appears only on the trained day, `w5_thu s3i1 = "2×6–10 @ RPE 8"`; it survives a reboot and the hist-restored slot carries it. Name and detail projection: CF5 == SL2 in all three stores at every step; CF5 == V228 except `ia_hist_PM` on the trained day, where the snapshot holds the held `"@ RPE 7"` that slice 2's tap writes on the fixture (V228 writes `@ RPE 8`) — slice 2's, unchanged by slice 3. Untrained reboot slot: CF5 `Leg extension "@ RPE 7" _preHold "@ RPE 8"`; SL2 `_preHold none`. Every placement matches §4 (record field; `ia_hist_` through a trained-day snapshot; never `ia_programs` without a rest move).

**MISS: GUARD (D191 class).** `PART=guard` replays GUARD's 117 printed created chains by hand: 80 walk, 1 hop4, 36 hop5. Main shapes: A>B>A>B 41, A>B>A>C 39, A>B>C>D>A>E 24.

| Tree | Boot == live after undo | Boot ≠ live, `_preHold` only | Boot ≠ live, `_preHold` + detail |
|---|---|---|---|
| V228 | 115 of 117 | — | — (2 differ on detail alone, pre-existing D191 residue) |
| SL2 | 0 | 115 | 2 |
| CF5 | 0 | 115 | 2 |

Example: walk knee_wa W3 tue A>B>A>B, Weighted chinups > Barbell row > Weighted chinups > Barbell row, chip "Weighted chinups". After undo the live item is `Weighted chinups "2×5–6 @ RPE 7" _preHold "2×5–6 @ RPE 7"`; the boot is the same name and detail with no `_preHold`. This is a key-set difference in the whole-day comparison, on chains where the live path and the boot path diverge. **Coach's call.** The count CF5 has to move is 117 created (hop5 36 > 2, walk+hop4 81 > 0), where V228 has hop5 2 and walk+hop4 0.

**Surgery siting choices** (the reference for builder):
- **U, undoSwap:** in the `hit.rx.forEach` restore block, `if(it){it.detail=p.d;_put.push(it);}` becomes `if(it){it.detail=p.d;if(typeof p.ph==='string') it._preHold=p.ph; else delete it._preHold;_put.push(it);}`. No `cfg.injury` guard on undo, following R6's text; still dormant: `ph` is only written under the tap's guard, and `delete` does nothing to an item without the key (measured: overlay 0 and uninjured 0). Items that `applySwapPrefs(back)` renames but that no rx entry matches, and records from before V221 with no rx, are left as they were.
- **B, applySessionSwaps (identity list):** before the replay, `const _renamed=[];`. Per record pass: collect `_was` = items whose name equals `e.from` (by reference), call `applySwapPrefs` unchanged, then add to `_renamed` each `_was` item whose name no longer equals `e.from`. Inside the existing `if(hit && prog.cfg && prog.cfg.injury){`, before `applyInjuryFilter`: `_renamed.forEach(it=>{ if(typeof it.detail==='string') it._preHold=it.detail; });` — the unfiltered replay detail; the filter copies item fields through, and the RB print shows it survives. Why it satisfies R6: a native twin on a collide day keeps its own name, so it is never in `_was` and stays unstamped; a cycle (A→B→A) is stamped because pass 1 renamed it. `applySwapPrefs` and its other callers (:10984 build path, :14500 undo) are untouched, and its boolean contract is unchanged. CF3's `keep` parameter not reused.

ROOT     The value is `_preHold` on day items. Writers on CF5: the tap (14343, slice 2), the boot replay (B hunk), undo (U hunk). Readers: the tap carry (14334), and the g227/g228/g221 whole-day comparisons. The GUARD residue arises where undo restores a kept dose but the record store, after D191's collapse, replays nothing on boot.

SPREAD   `ia_hist_` persistence was measured and is as §4 describes. `applyRestMove`'s `ia_programs` path was not exercised.

UNKNOWN  The gate's own c-TOAST population (9,882): the 2,268-hop corroboration is a different lattice. `applyRestMove` with a kept dose. GUARD on the overlay presentation: by construction no `_preHold`, but not run through the gate. Whether the 2 `_preHold`+detail chains are anything beyond the pre-existing V228 detail residue plus the key.
