# V231 session calls (main session record; gate form and scope only, no ruling changed)

1. **`g231_d195_hipext` a-cfA / a-cfB keep the candidate-text presence check** (gate run 1's question). The counterfactuals
   are built from the baseline plus the slice replacements, and each replacement must also be present once in the candidate,
   so the counterfactual is the candidate's own code and the conjunct fails on V230 for its own reason. Cost: a slice-2/3
   sabotage trips D195-A-a as well as its named row; one mutation tripping two rows is acceptable (a named row still trips).
2. **D195-A-a carries no `14aacbced1c527d7` conjunct.** The re-ruling: "keep it only if the session re-prints it"; not
   re-printed, so not kept.
3. **D196-c fourth cell.** The prior ruling's row names "knee/protect intermediate support_strength W3/W4 thu", but at seed
   76308 that cell prints `Main — Bodyweight back extension` on V230, W5 and ALL (coach1 cards :502–581; knee/protect has 0
   `Main — Burpees` on the 324 bodyweight L432+LBW cells at s76308). The class itself is real at other seeds (M14: U_SEED
   knee/protect 264 Burpees Mains; U_PATH 8). The ruling's claim about D196's effect (knee/protect lands on the bridge) is
   intact; only the cell pointer is wrong. Call: D196-c types a knee/protect bodyweight cell at a seed where V230 prints
   `Main — Burpees` (s11 or s90210 from M14's U_SEED), PLUS builder's substitute `ankle/protect|bodyweight|intermediate|
   balanced|sat,sun` W3/W4 wed (bridge Main at RPE 8), which the ruling's printed cards quote. Five typed cells.
4. **D196-b both-thrust conjunct scope.** Over all 324 bodyweight cells the candidate has 82 days carrying both
   `Single-leg hip thrust` and `Single-leg hip thrust (shoulders on bed)`, the SAME 82 days as V230, all in plans D196 does
   not touch (knee/workaround, shoulder ×2, elbow ×2, ankle/workaround; bodyweight beginner/intermediate hypertrophy; W1–W6
   wed on sat,sun / thu on sun,wed). The ruling's "both 0 on V230 too" is true only on the four D196 plans. D196's own claim
   (it adds no such day) holds: 82 == 82. Call: D196-b = (i) 0 both-thrust days on ankle/protect, knee/protect,
   lowback/protect, lowback/workaround; (ii) over all 324 cells the both-thrust day set equals V230's typed 82-day set (no
   additions, no removals); (iii) 0 adjacent `Single-leg glute bridge` days over all 324 (0 on both trees); plus the carried
   Burpees conjunct. The 82 pre-existing days are parked to §12 as **P-BWTHRUSTDOUBLE** (INFO, pre-existing, P-BWHTNAME's
   neighbour: a bench-name thrust and the bed thrust on one bodyweight card).
5. **Sabotage S-a's named row is D196-c**, not D196-a: with the ankle literal reverted, D197's post-sweep re-filter drops
   the swept Burpees on ankle/protect, leaving no Main, so D196-a's Main-Burpees count reads 0 (gate run 3's spot check).
   The day losing its Main is itself caught by D196-c's typed card.
6. **D195-A-b's oracle is the A step, built in-gate** (gate run 5 parked the row as written). Written against V230 + B's
   restorations, it charged 9 bodyweight knee/ankle-protect runner days to A that are D196-1 (Main Burpees → bridge) and
   D196-2 (the ankle/protect circuit lunge-slot re-draw), both ruled classes; the re-ruling measured A as "ABx vs B" (the A
   step), not against V230. Call: A-b compares the candidate with the NOT-A tree = baseline + slices 1, 4, 5, 6 (each
   replacement present once in the candidate, the a-cfB pattern). Per runner prevention leg day: candidate items == NOT-A's
   + at most one item appended at the end of `Leg circuit — runner armor`; removals only from `Loaded carry finisher` or an
   optional/core block (A-4); circuit positions 1–2 literally equal NOT-A's; calf present wherever NOT-A has it; knee/protect
   circuit length == NOT-A's. No ruling claim moved: the shard's 9 days are classified D196 changes the old oracle could not see.
7. **D195-A-b's non-runner clause reads "byte-identical to NOT-A"** (the re-ruling's own claim: "non-runner prevention leg
   days are byte-identical to B (0/2,592 move)"). The row's shorthand "carry a three-item circuit" is false on V230 itself
   (48 of 528 non-runner days have a 2- or 1-item circuit on V230, V230 budget-off and the candidate alike); circuit length
   already equals V230's on 528/528.
8. **D195-A-f gets bodyweight lowback cells** so its lowback clause is not vacuous (gate run 5's shard had none: 0/0).
   Add lowback/protect and lowback/workaround bodyweight prevention cells (race and test families) from coach's INJ lattice;
   the clause (V230 ∪ {`Single-leg hip thrust (shoulders on bed)`}) must evaluate on ≥ 1 program.
9. **`g231_d195b_cost` shard and additions accepted** (gate run 6). Shard: M15's FULL constructor at s87747 and s76308, all
   experiences, prevention plus `support_athletic` and `balanced` (648 configs) plus the typed B-3 cell. b-B2 adds M15's
   printed landmine cell (FULL support_prevention | race | commercial | intermediate | s1234 | sun,wed, W3 tue) so the B-2
   check is not vacuous (0 landmine changes on the two-seed shard alone). B-3 is typed removal-only (the split-stance DL is
   already in V230's budget-off day). b-other (0 changed cells with no item op) enforces the re-ruling's "any op outside the
   classes above" regression clause. S-8 targets D195-B-a.
10. **Sabotage spec `tests/sabotage/v231_d195_d196_d197.json` (13 mutations) accepted.** S-7 is a literal move: one
    22,585-byte anchor from the hipExtPool definition's last line through the A1x line, replacement = the same text with
    A1x directly after the definition (coach's `AN.A1` prior site). It reproduces the defect (`Bodyweight back extension`
    as a circuit item on loaded commercial knee/protect) at commercial 4/126, not the ruling's 18/126: the 18 is PRIORALL's
    figure, which also carried the prior A2–A4; it trips D195-A-e (`e-others`, `e-home_full`, `e-prev`) and D195-A-b
    (`b-knee`). S-b / S-c mutate the lens declarations' bodyweight strings (single-anchor form; no ReferenceError). Row-level
    attribution: every mutation trips its named row on a behavioral conjunct (not presence-only). The gate-level sweep is
    vacuous for 11 of 13 until `MANNY_DIGEST_BY_VERSION[231]` lands (a-era / d-era red on the clean candidate); gatekeeper
    re-runs the full sweep on the final artifact.
    Old specs: 7 anchors count 0 on the candidate, all also 0 on V230 (pre-existing, not moved by V231): example.json no-op,
    v193_samecard M13, v195 M12, v197 M4, v200 M4, v200 M5, v201 M4.
11. **g229_d193 row b keeps `movedAll` at ≥231** (G6's question). The absorb ruling's kept list names the object row,
    `_preHold` and MANNY; `movedAll` (> 0 clamp moves on L432, HB, L1) asserts D193's own clamp still changes V228's
    detail, a behavioral claim of the ruling the row defends, not a byte-identity claim; it passes on both trees (L432 316,
    HB 120, L1 653). Kept in `bKeep`.
12. **g228 d2-MANNY reads the era row only** (G3d's question). The absorb ruling's "literal + row → row only" drops the
    typed literal AND the `dB === d1` V227-baseline equality (the old chain era == typed == V227; at 231 the V227 equality is
    false by ruling). The V227 digest still prints as INFO. g226 G10 and g228 d2-MANNY key the row on each gate's own `VER`
    (identical to `+IA.version` except under an announced IA_ASSUME_VERSION discrimination run); g216/g223 use `+IA.version`.
13. **g229_d194 p-SWAP/p-AUX/p-ADD use the plain split, not the durable form** (G7). The durable form ("a FIX list differs
    from V228 only on a day whose card differs") fails on the candidate at 61 lists on card-identical days (e.g. L1#262
    bodyweight support_prevention beginner half lowback/workaround W5 tue: the `Single-leg hip thrust` swap list, the add
    picker, thu `Squat (slow 3s tempo)`); 0 on V230. Reading: the swap universe changed under an unchanged card, which is
    D196-6 (bodyweight lowback universes gain `Single-leg hip thrust (shoulders on bed)`); gatekeeper confirms the 61 sit on
    bodyweight lowback programs. G7's calls accepted: row-set symmetry scoped ≤230 with W3/FIX == V228 (it compares those
    populations' row counts with V228; candidate 169/288 configs differ, printed on the SKIP line); row j's `J_BURPEES 0`
    counts the candidate's final name, with both renamed cards required to come from `Burpees`; row j keeps asserting the 96
    uninjured L1 builds exist (only the 96/96 byte-identity is scoped).
14. **g230 at ≥231 (G5′) accepted.** The reach jobs do not run at ≥231 (they exist only for (ii) and the typed-build re-read;
    the typed Burpees card is no longer on the day); the ≥231 d194-postsweep branch also requires V229 == the typed 22 in the
    same run (the row's baseline convention, proving the 0 is not a blind instrument); the bed-thrust conjunct maps g221's
    out/off/null/toast-moved to g230's bt.G3a/bt.off/bt.nul and bt.clamp == bt.hv == 10; setup-fail and merge-crash paths
    still FAIL every row (only the normal path SKIPs d194-fixture).
15. **D198 gate (`g231_d198_hepdraw.js`) reads D198-a on shipped cards, hinge slot** (D198 Amendment 1); lead-slot census 80
    printed, not asserted; stage INFO (sweep entry) counts 10 lead-slot stage-only days on the candidate vs g199's p1 four:
    different stage, same P-HEPSINGLETON class, never shipped.
