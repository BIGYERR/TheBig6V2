# V230 — session form calls (main session record, not coach text)

Build: D194 P-INJLENS part 2, the lens alone (Mario 2026-10-03: "V230: build D194 P-INJLENS part 2 — the lens alone (tap and
boot guards onto _dayPlanCfg); order already approved as 'D194 QUEUE ORDER: Part 2 first'"). Ruling:
`tests/measure/v229_rulings/d194_injlens_ruling.md` R3′ (Amendment 1). Measure: `measure_lens_overlay_cf6_m12.md` (M12).

## Measure did not refute (standing ruling 7 not triggered)
M12: both premises of R3′ hold. diff V229 → CF6 is the four site hunks and nothing else; CF6 overlay == fixture on every
row, 0 of 18,580 chains differ on live, toast, boot, undo, undo+boot; HALF_MANNY `0ac7da6b1691a8e1` unmoved. The ruling
goes to builder unchanged; no coach spawn.

## Siting and form (the session's to decide; nothing here reached Mario)
1. **The four edits are M12's ROOT lines, verbatim.** Builder's candidate before the bump must be byte-identical to
   measure's CF6 (`cmp`), so every M12 figure carries to the candidate by construction.
2. **One new gate family, `tests/gates/g230_d194_lens2.js`, rows named for the ruling each defends** (standing ruling 4):
   `d193-e`, `d193-e′`, `d193-k`, `d193-k″`, `d193-l` (single hop and the g221 L1 sweep), `d193-i`, `d193-i-r`, `d193-i-u`
   (the D190 lattice), `d194-eq` (the equivalence row) and `d194-q′` (the re-keyed dormancy pin, now asserting delivery
   on typed hand routes). One file because every row is true only through the lens and the overlay lattice is driven
   once. Version predicate on the g229 idiom: below 230 every row REFUSED by name; `IA_ASSUME_VERSION=230` lifts a file
   stamped exactly 229 for a discrimination run, on which every row FAILS at its V229 figure (M12's V229 OV column).
3. **(q) is retired, not inverted, in `g229_d194_lens.js`.** At `VER === 229` it asserts as today; at 230 and up it prints a
   `SKIP q … retired at ia-version 230 by D194 part 2; delivery asserted by g230_d194_lens2 d194-q′ and d194-eq` line
   (b-ONECLASS's V229 precedent: a column-0 REFUSED or a named FAIL would red gate.sh). The delivery assertion lives in
   g230 as `d194-q′`, typed from M12 [5]/[6] (mario U0/U1/U2/RB lines, knee/wa W6 thu Leg press INJ_HELD_TEST with the
   hold toast, and the 1,159-chain sample's figures), so the hand routes stay a typed oracle and not only a differential.
4. **Era rows `[230] = [229]` by reference** in `MANNY_DIGEST_BY_VERSION`, `MANNY_DELOAD_OFF_DIGEST_BY_VERSION` and
   `MANNY_CORE_OFF_DIGEST_BY_VERSION` (tests/harness.js), each citing D194 "What deliberately does NOT change" and M12's
   CF6 HALF_MANNY print; builder prints the three digests on the candidate with the harness fixture and g199's/g200's
   methods before writing the rows. Without them g227 c-MANNY, g228 d2-MANNY and g229 b fail at 230 (M12 [7]); the digest
   itself does not move.
5. **Sabotage `tests/sabotage/v230_d194.json`:** S22 (R8 trigger keyed on the donor as read → `d193-k″` 196 of 196, M12 [5])
   and one revert per site (tap guard, tap filter cfg, boot guard, boot filter cfg back to `activeProg.cfg` / `prog.cfg`),
   each tripping a named row (`d194-eq` at minimum). Numbers continue after D194's S27.
6. **renderWeekView's overlay readers (:11985, :11986, :12028; week pill and "HURT?" label) stay out of V230.** M12: they
   read `activeProg.overlays`, the plan's own source, at week level, and decide no card, dose or toast; R3′ says "nothing
   else". Recorded as INFO beside P-OVSTACK (a week-level reader on a stacked week is the same composition question).
7. **d194-q′ carries the typed hand routes only; the 1,159-chain sample is dropped** (amends item 3). `d194-eq` asserts every
   one of the 18,580 lattice chains and `d193-i` pins kept / ph / hold-toast counts, so the sample (a V229 stand-in for a
   lattice the V228 tree could not generate) adds nothing at 230.
8. **g230_d194_lens2 runs ~12 minutes** (slice 4: 93% in `refreshProgram` → `buildProgram` per batch setup and boot; the lattice
   was not cut). Accepted for V230; recorded in the handoff as a gate.sh cost. Each sabotage mutation that names it costs one
   full run.
9. **Builder form calls accepted, for gatekeeper to classify:** populations and the k″ 196/14 split come from the V229 baseline
   tree with expected values typed; same-run baseline conjuncts on OV1 only (V229's OV5 figures proved by the discrimination
   run); the (i-u) complement 5,868 pinned exactly as INFO (D193 Amendment 4 "not to grow"); day JSON compared by sha1 with
   `_ovKey` and clock fields removed.
10. **Eight shipped sabotage mutations lose their anchor on V230** (count 1 on V229, 0 on V230; every other of the 595 is
    unchanged), because their anchors include the four lines the lens moved. They are re-anchored to V230's text with the
    same mutation intent, the V229 precedent (`tests/edits/v229_sa*_reanchor_*.py`), never left as NOT-APPLIED debt:
    - `v227_d190.json` S1 (a), S1 (b), S4, S5: re-anchored, same gates (g227 seam / cuecap drive the fixture, which the lens
      leaves unchanged: `_dayPlanCfg` returns prog.cfg's own injury there).
    - `v229_d194.json` S18 (g228 d2-BOOT-U) and S21 (g229_d193_build b): re-anchored, same gates.
    - `v229_d194.json` S27: re-anchored, and its gate moves from g229_d194_lens (q), retired at 230, to g229_d193_build row (b),
      the second trip D194 Amendment 1's sabotage list names for it ("(q) … also (b)").
    - `v229_d194.json` S25 ("premature activation of D194 part 2") is **retired**: its replacement is the V230 build in meaning (it
      differs only by dropping the tap's `activeProg&&` null check, which V230 keeps; slice 6b), so on V230 its anchor
      counts 0 and its intent is shipped, and its named row (q) is retired. Its inverse is covered by v230 S28 (tap guard) and S29 (tap
      filter cfg). Entry removed with this line as the record.

## After gatekeeper's first run (RED, 2026-10-03)
11. **RED cause: five shipped gates carry per-version tables with no [230] row** (g193 OPEN_UNRULED_BY_VERSION, which crashes;
    g197b HF_LEAK / B5C_BY_VERSION; g199 DELOAD_ARB / E6 / DELOAD_HINGE; g200 SWAP_BY_VERSION; g219_samecard_draws). M12 [7]
    ran only the swap-driving families, so it missed them. The fix is the V229 precedent (`tests/edits/v229_g1a_era_g193_g197b_g200.py`,
    `v229_g1b_era_g199_g219.py`): [230] = [229] by reference, each row written only after its figure is printed on the candidate
    and equals V229's (gatekeeper's identity fuzz: buildProgram + refreshProgram byte-identical V229 == V230 on 2,160 of 2,160
    configs). A figure that moves parks its row.
12. **g230's inst-fix stops gating the figure rows** (gatekeeper finding 2). S22 moves the fixture too, so inst-fix failed and
    every row printed "not read"; d193-k″'s typed 196/196 was never observed under its own mutation. inst-fix becomes a claim row
    (the fixture presentation did not move; R3′ "nothing else") that fails by name and blocks nothing; inst-self, inst-stamp and
    inst-ov1 stay as gating instruments.
13. **Blast-radius class L2 restated** (gatekeeper finding 1a). "Never on an unswapped card" was the main session's wording and
    is false: the boot re-filter runs over the whole swapped day, so on a swapped day whose plan differs from `prog.cfg` the
    unswapped cards are filtered by the day's plan too. That is D194 R1 itself (every reader reads the day's plan). On MIX
    (cfg.injury plus a different overlay injury; no app writer has produced cfg.injury since V98) V229 boot drift 10,583 → V230 42,
    every move toward live. Classified L2, ruled by R1.
14. **The Burpees boot drop (gatekeeper finding 1b) goes to measure, then a fresh coach.** buildProgram's `bodyweightSweep`
    (after the build's filter, P-FILTERLAST) lands `Burpees` through `_bwFallback`'s catch-all (P-BWFALLBACK, V231) on
    ankle/protect and knee/protect days; the boot re-filter drops it, so after a swap on that day boot != live. On the fixture
    this is V229 and V230 alike; V230 extends it to overlay programs, as the equivalence row requires. Reproducer:
    `tests/measure/v230_gk_burpees_bootdrop.js`. Ship-or-hold is a doctrine question; nothing ships until it is ruled.
15. **Census correction (finding 3):** item 10's "595" was counted after v230_d194.json was written and before S25 was removed;
    the sweep total is 594.
16. **Amendment 4 (coach) and Mario's two calls are in the D194 ruling file** (Amendment 4 = coach's "Amendment 2", renumbered:
    Amendments 1–3 already existed). Ship V230; P-FILTERLAST folds into V231 under coach's printed-differential condition.
    Slice 9 writes the INFO row `d194-postsweep` (VER === 230, refuses at 231) and sabotage S32-D194-A4.
17. **d194-eq's baseline clause compares V229 OV1 with the candidate's CFG1** (gatekeeper's form call 2, accepted; slice 8 showed
    it trips under S22 because S22 moves the candidate's fixture). Kept: d194-fixture claims the fixture is unmoved, so on any
    tree where that claim holds the clause reads V229's own before-picture; where it fails, the extra trip adds a FAIL and masks
    nothing.
18. **Second gatekeeper run scope.** index.html is byte-identical to the swept candidate (72ac41c8…). Every spec whose named gate
    file changed since the first sweep (g193, g197b, g199, g200, g219, g230) or which changed itself (v230_d194.json) is re-run in
    full; every other spec is carried from the first sweep only after its (index sha, gate sha, spec sha) triple is proved
    identical. gate.sh runs in full on the final artifact.
