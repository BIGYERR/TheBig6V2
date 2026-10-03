# M9 on CF4 (D194 P-INJLENS part 1), V229 chat 2026-10-03 — measure's report, saved verbatim by the main session

Script `tests/measure/v229_lens_cf4.js` (parts `trees | l1 | chains | single | report | report2 | du`), output `tests/measure/v229_lens_cf4.out.txt`, raw in `…/scratchpad/measure3/`.

MODE     B (before-picture). This is M9 on a CF4 copy for D194 P-INJLENS part 1. I ruled nothing and edited no tracked file.

**Short answer.** Every ruled (p), (o) and (q) figure prints as ruled on CF4, with one denominator off in the ruling's After block. There is one miss against (r) and the brief: `g227_d190_seam` is red on SL2 and on CF4 (row d-U, 3,579 of 12,282). It is green on V228 and on a slice-1-only copy. Slice 2 causes it, not the lens: CF4 equals SL2 exactly. Two more lists (aux picker and add picker) carry larger illegal-offer counts than the ruled swap figure, and the lens takes both to 0.

REPRO    Not applicable (Mode B). The setup is the same as `v229_overlay_injury.js`: start 2026-08-24, clock pinned 2026-09-24; overlay written by the app's own writer `_ovDraft…; applyInjuryDraft()` from 2026-09-21 (W5 Monday). **OV** = uninjured build plus that overlay. **FIX** = the fixture presentation, `cfg.injury` stored.

METHOD
- Trees (sha): V228 a53d3ea6c8d2 (HEAD); SL2 e5ade9595b39 (the working `index.html`, copied); SL1 55e12050c447 (V228 plus the slice-1 script, re-pointed at a scratch copy; its own asserts passed); CF4 68e0077e8096 (SL2 plus measure's surgery); V226 94ce52f12f8d (637bc8e, the g227 baseline).
- Lattices: L1 injured slice: 288 configs, W3 and W5, three list kinds (swap = `swapCandidates` tier1+tier2; aux = `auxSwapCandidates`; add = `addCandidates` gap+more+off), 16,018 rows per tree. D190 chains: 7 configs, 13,323 W5 and 5,257 W3 chains, on V228 OV, SL2 OV, CF4 OV and CF4 FIX. Named single programs.
- Oracle for "rejected": V228's `_swapInjuryOK` on the fully injured cfg, run in a separate judge VM. That is the ruled definition of 1,451; the tree under test only decides which cfg it hands over. Hand CAP table and hand RPE parse; ruling-literal R7 and TEST strings.
- Baselines equal themselves: two independent OV writes, ids and created stripped: equal, 3 of 3 trees. Two VMs on the same record: weeks and W3+W5 lists equal (19,932 bytes, non-empty). Cross-session: measure2's stored record equals this session's. V228 OV chains equal the measure2 run on 13,323 of 13,323 W5 and 5,257 of 5,257 W3.

FINDING  V228 | SL2 | CF4

**(p) L1 W5, swap lists:** rejected names offered 1,451 of 39,117 | 1,451 of 39,117 | **0 of 38,659**; cards offering ≥1 rejected name 1,387 of 4,529 | 1,387 | **0**; OV list == FIX list 3,142 of 4,529 (394 longer) | same | **4,529 of 4,529** (0 longer). V228 segments, cards ≥1: by region/tier lowback/workaround 758, shoulder/protect 336, knee/workaround 293; by equipment bodyweight 63, commercial 285, crossfit 284, home_basic 215, home_full 323, minimal 217; by experience beginner 733, advanced 654. Stamped: 4,529 of 4,529 on W5, 0 of 8,295 W3 rows.

**(p) L1 W5, aux lists (the `_powerAllowed` site):** rejected names offered 4,228 of 21,856 (V228 = SL2) | **0 of 17,340** (CF4); cards offering ≥1 941 of 1,754 (shoulder/protect 580, lowback 269, knee 92) | 0; OV list == FIX list 785 of 1,754 | **1,754 of 1,754**.

**(p) L1 W5, add picker:** rejected names offered 2,104 of 19,380 (V228 = SL2) | **0 of 19,142**; day pickers offering ≥1 1,120 of 1,440 (knee 480, shoulder 440, lowback 200) | 0; OV list == FIX list 320 of 1,440 | **1,440 of 1,440**.

**What moved on CF4 W5, compared with V228:** 3,476 lists. 3,420 removed only rejected names. The other 56 are all aux lists (knee 28, lowback 28; e.g. `Wall ball shots` drops `Dumbbell snatch`, `Kettlebell clean`): `_powerAllowed(…, injured)=false`, the ruled site, equal to the FIX list. 2,859 names backfilled under the list caps; 0 of them rejected. 0 lists moved on an unstamped day.

**(p) Identity rows (SL2 vs V228 | CF4 vs V228):** L1 W3 OV lists (pre-`from`) 8,295 of 8,295 | 8,295 of 8,295; L1 W3 FIX lists 5,172 of 5,172 | same; L1 W5 FIX lists (the fallback is exact) 7,723 of 7,723 | same; HALF_MANNY lists W3 30 of 30, W5 29 of 29 | same; mario_noinj lists W3 32 of 32, W5 32 of 32 | same.

**(p) mario knee/wa OV, W5** (`activeProg.cfg.injury` null; stamps on mon, tue, thu, fri, sat): swap lists 2 of 223 → 2 of 223 → **0 of 222** (V228: `tue Sumo deadlift: Jump squats`, `thu Barbell box squat: Jump squats`); aux lists 2 of 68 → 2 of 68 → 0 of 66 (`sat Mountain climbers: Burpees, High knees`); add picker 5 of 79 → 5 of 79 → 0 of 79 (Jump squats on all five days); OV == FIX 24 of 32 → 24 of 32 → 32 of 32; W3 OV lists 32 of 32 equal to V228. Lens on CF4 reads `{knee, workaround}` on W5 thu and `null` on W3 thu.

**(p) Thursday-from program (`from` 2026-09-24), CF4:** mon, tue, wed unstamped; thu, fri, sat stamped; lens `null` on mon–wed and `knee,workaround` on thu–sat. Lists equal to V228: mon 6 of 6, tue 7 of 7 (tue keeps V228's `Sumo deadlift: Jump squats`, 2 of 77, as ruled for an unstamped day). Rejected on V228: thu 2 of 56, fri 1 of 101, sat 3 of 55; on CF4: 0 of 55, 0 of 101, 0 of 53.

**(p) Travel-only overlay** (minimal, 09-22 to 09-24, on mario_noinj): stamped tue and thu; lens `null`; lists equal to V228: stamped days 13 of 13, whole W5 32 of 32, on SL2 and CF4.

**(p) Bridge and halfstep** (from `imBackFromInjury`): stamps bridge on W5 thu, fri, sat and W6 mon, tue; halfstep on W6 thu, fri, sat. Bridge days: rejected under knee/workaround 9 of 390 (V228) → 0 of 387 (CF4); lens reads `{…,bridge:true}`. Halfstep days: lens reads `{…,halfstep:true}`; the halfstep plan rejects 0 of 212; knee/workaround would have rejected 6; CF4 lists equal V228's uninjured read, 19 of 19.

**(o) Build half on overlay programs (V228 | SL2 | CF4):** lowback/wa bodyweight W5 capped cards above RPE 7: 2 (tue Single-leg hip thrust, thu Squat (slow 3s tempo)) | 0 | 0; mario W5 capped above 7: 0 | 0 | 0; mario W5 cue 1 | 1 | 1; strength 6-week W6 thu `Main — Barbell box squat` == TEST | == R7 | == R7; W6 tue `Main — Barbell Romanian deadlift` == TEST on all three. Spliced-day cards == FIX: mario 31 of 31, lowback_bw 30 of 30, strength6 W6 33 of 33, on every tree. D190 start cards, CF4 OV vs CF4 FIX: 13,323 of 13,323 equal on W5 (W3 differs in 5,227 of 5,257 because W3 is before `from`; presentation difference, not a finding).

**(q) Dormancy:** D190 OV chains, CF4 vs V228 and CF4 vs SL2: 0 of 13,323 W5 and 0 of 5,257 W3 move in any column (live, toast, boot, undo, undo+boot). CF4 OV W5: hold toasts 0, `_preHold` kept 0, `ph` entries 0. mario W5 thu hand chain on CF4: 8 of 8 lines equal V228 ("@ RPE 8" on every hop, boot, undo and undo+boot; three "Same job, same numbers." toasts; ph 0 of 3).

**(b):** HALF_MANNY digest `0ac7da6b1691a8e1` on V228, SL2 and CF4, self-stable. Uninjured builds (96 uninjured L1 configs, MARIO, HALF_MANNY) byte-identical to V228: SL2 98 of 98, CF4 98 of 98.

**INFO, stacked travel plus injury** (overlays sort by `created`; pinned clock gives both the same id, re-pinned 60 s later for the second writer): **Injury, then travel:** tue and thu carry the travel stamp `["substitute",{"equipment":"minimal"}]`; their build is uninjured (thu cue cards 0, against 1 under the injury stamp); the lens reads `null`, so CF4 still offers Jump squats there, 1 of 62 and 1 of 54; mon and fri carry the injury stamp: 0 rejected. **Travel, then injury:** every day carries the injury stamp; the travel equipment is gone from tue and thu; the lens reads the injury; 0 rejected.

**INFO, hist-restored trained day:** `snapshotDay(5,'tue')`: the snapshot carries `_ovKey` (deep copy), and the booted W5 tue equals the snapshot byte for byte; the lens reads `{knee,workaround}`: CF4 rejects 0 of 77 offers, V228 2 of 77. After `removeOverlay` and a boot: the snapshot day is still stamped, so the lens still reads the injury (0 of 77); unsnapshotted thu is unstamped, lens `null`, Jump squats returns (2 of 62).

**Informational, `g227_d190_seam`** (baseline V226): V228 PASS 7 FAIL 0. SL1 (slice 1 only) PASS 5 FAIL 2, expected red on (a): row a-U residue 83 of 11,998; row a-U′ created 1 of 326. SL2 PASS 6 FAIL 1 — **red**. CF4 PASS 6 FAIL 1 — **red**, the same as SL2.

**MISSES against ruled figures**
1. **(r), and the brief's "expected green" on SL2 and CF4:** row d-U is red on both. Printed row: `got residue 3579/12282 (no chip 0, chip != hand chip 0, undo not byte-identical 3579)`. By class (undo identical / total): hop1 0 of 2,277, collide2 0 of 392, hop2 5,298 of 6,132, hop3 582 of 644, exch3 359 of 373, cyc2 and cyc3 all identical. SL1 d-U residue is 0 of 12,282, so slice 2 creates this, not the lens. Field diff (`PART=du`), 3 of 3 sampled cases: after `undoSwap` on the FIX presentation, slice 2 leaves `_preHold` on the restored item where it was undefined before the hop. Examples: W3 mon Incline barbell press `"3×8–12 @ RPE 7"`, W3 fri Toes-to-bar `"3×6–10 @ RPE 7"`, W5 thu Single-leg hip thrust `"2×6–10 @ RPE 8"`. Two of those are uncapped. On OV, 0 of the 3 cases differ (the path is dormant). This contradicts R4's "D190's gate stays an honest green". Coach's call.
2. **The ruling's After block says "0 rejected of 221"; it prints 0 of 222.** Once Jump squats leaves `tue Sumo deadlift`, `Cable pull-through` backfills the tier2 cap of 5; the `thu Barbell box squat` list shortens by one. The FIX list is identical (32 of 32), so 222 is the fixture's number too. The (p) claim itself, "2 of 223 → 0", holds.

ROOT     The value is the injury the sheet's legality reads. Before the lens: `prog.cfg` at the head of `auxSwapCandidates`, `addCandidates` and `swapCandidates` (SL2 :9863 / :10005 / :10093), reaching `_swapInjuryOK` (:9989) and `_powerAllowed` (:9871); `prog.cfg.injury` is null on overlay programs. On CF4: the reads are `_dayPlanCfg(prog,day)` at CF4 :9863 / :10015 / :10103. Still on `cfg.injury` on CF4 (comment-stripped): `activeProg.cfg.injury` :14342 (the tap) and `prog.cfg.injury` :10355 (`applySessionSwaps`), the R3/R4 dormant sites.

**Surgery siting choices** (four anchors, each count==1, asserted before writing):
- **Helper:** `function _dayPlanCfg(prog,day)`, inserted directly above the `// Survives the athlete's injury plan?` comment that heads `_swapInjuryOK`, after `swapUniverseFor`. It calls `dayOverlayInfo` (declared later; hoisted).
- **Return rule:** returns `prog.cfg` itself (same reference) when the day has no stamp or the stamp's patch has no own `injury` key (a travel stamp), so the fallback is identity (FIX lists 7,723 of 7,723 equal). Otherwise returns `Object.assign({}, prog.cfg, {injury: patch.injury})`: injury only; equipment, experience and age from `prog.cfg`, so `_auxGearOK` is unchanged. Uses `hasOwnProperty`, not truthiness. A travel stamp falls to `prog.cfg`, which is what the travel variant (`{...prog.cfg, ...patch}`) was built with.
- **Callers:** in each of the three functions, `const cfg=(prog&&prog.cfg)||{};` becomes `const cfg=_dayPlanCfg(prog,day);`. `day` is already a parameter in all three. The sheet passes `activeProg.weeks[currentWeek][currentDayKey]` (`openSwapSheet`) and `_liveDay()` (`openAddSheet`). In `auxSwapCandidates` that one line feeds both `_powerAllowed` and `_swapInjuryOK`.
- **Not touched:** the tap guard, `applySessionSwaps`, `_swapInjuryOK`, `swapUniverseFor`, `applyOverlays`.

SPREAD   The same blind read reaches two more pickers the (p) claim names only in passing: the aux sheet (4,228 of 21,856 offers, 941 of 1,754 cards on V228) and the add picker (2,104 of 19,380 offers, 1,120 of 1,440 days on V228). Both are 0 on CF4 and equal FIX exactly. Two pre-existing seams sit outside this ruling: on a stacked day, a later travel overlay strips the injury from both the build and the lens; a hist snapshot keeps the injury stamp after the overlay is removed.

UNKNOWN  Whether all 3,579 d-U residues are `_preHold`-only (3 diffed, not the population). The aux judge counts `_swapInjuryOK` rejections only, not `_powerAllowed`. Not run: the lens on W6 and W7 at L1 scale; the reboot and undo modes on L1; the add picker's detail; S23–S26 discrimination (gatekeeper's). The pinned-clock id collision means stacking order on device depends on the real `created` values.
