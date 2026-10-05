# M19 — V231: standing-ruling-7 confirmation of the proposed D196 Amendment 2 (saved by the main session)

Measure's return, V231 chat, 2026-10-04. Script `tests/measure/v231_d196a2_confirm.js`, output
`tests/measure/v231_d196a2_confirm.out.txt` (read it for the full tables). Trees: V230 72ac41c8d34034ce, t_B b958d4b09b1181bc,
t_ABx 8d90f9463198e7d4, t_PREx 450783528238a6ee, candidate 1249c248a6794d1c. Lattices: M17's 6,912 (FULL 3,024 + INJ 3,024 +
L432 432 + LBW 432), g215 LAT_K 630, g199 LAT 1,728 = 9,270 configs, 0 crashes. Classifier: coach2's ops() and classifier
pointed at the re-ruling's "Final diff-class list" plus the proposed Am. 2 text (A-2/A-3 counted outside, withdrawn).
Circuit slot instrument: `__slot` tags at the circuit literal, proven inert 570/570.

FINDING
(1) LAT_K circuit: 44 confirmed, 2 drops confirmed, other tiers identical confirmed; "18 programs" REFUTED: 10 of the 18
    bodyweight knee/protect prevention programs. All 44 first differ at PREx and equal the final card from PREx; 0 at B, ABx,
    cand; both ablations leave them unchanged. Kinds: position-1 lunge rename 18 ([Bodyweight back extension, SL RDL] →
    [Single-leg hip thrust, SL RDL]); position-2 hinge rename 14 ([SL hip thrust, Bodyweight back extension] → [SL hip thrust,
    SL RDL]); singleton lunge rename 10; hinge drop 2 (bodyweight|support_prevention|run_pace_goal|knee/protect|advanced|
    s76308|sun,wed W9/W10 thu). By slot: lunge 28, hinge 16, hold 0.
(2) g199 LAT Calves: 6 at PREx confirmed (bodyweight|balanced|none|knee/protect|advanced|s1013 W5/W6); also 9 at B (B-1).
    LAT_K adds 18 Calves appearances at PREx on 2 programs and 36 Leg isolation removals on 4 programs (covered by the amended
    D196-5 wording, but its parenthetical cites only g199's 6).
(3) Full classification: 45,753 ops; **234 (0.511%) OUTSIDE the amended list: the amended list does NOT cover 100%.**
    M17 lattice 30,977 ops, 0 outside; LAT_K 2,438, 0 outside; g199 LAT 12,338, **234 outside**, all at the D196 step
    (ABx → PREx), all lowback/protect bodyweight, hypertrophy and balanced focus, beginner and advanced, 42 programs, 153 days:
    - 72: `Leg superset B` rename `Burpees 2×8 — hold RPE 7, three in the tank` → `Single-leg hip thrust (shoulders on bed)
      2 sets — RPE 6 (leave 3 or more in reserve)`, 36 programs, all beginner. Same landing as D196-4 but at the RPE 6 wording;
      D196-4's text and coach2's regex say RPE 7 (615 such landings on this lattice do match RPE 7). e.g. E bodyweight|
      hypertrophy|none|lowback/protect|beginner|s1013|sun W1 wed.
    - 60 + 60: `Lower strength :: Burpees 2×10 — hold RPE 7…` → `Single-leg hip thrust (shoulders on bed) 2 sets — RPE 6…`,
      and `Explosive finisher` gains `Burpees 2×12` and becomes a superset (V230: `Single-leg wall sit 2×30 sec` alone), 12
      programs. No class names a Burpees returning in `Explosive finisher` (D196-3 names `N×10` on pull days only). e.g. E
      bodyweight|hypertrophy|none|lowback/protect|beginner|s3039|sun W1 sat.
    - 21 + 21: `Lower strength` Burpees → bed thrust, and `Hip extension + push` LOSES its own `Single-leg hip thrust
      (shoulders on bed)` and goes from a superset to a single item (Pushups only), 5 programs. e.g. E bodyweight|balanced|
      none|lowback/protect|beginner|s1013|sun W3 sat.
    These cells are absent from M17's lattice (its lowback/protect bodyweight hypertrophy/balanced cells are seed 76308 only).
Per-class totals over 9,270 configs (M17-only in brackets): B-1 39,276 [26,548]; B-2 28; B-3 17 [1]; A-1 3,014; A-4 carry 43,
    core 90; D196-1 Main 1,202 [603], Primer 60 [24]; D196-2 Leg sections rename 387, drop 121, add 64, relabel 20 [172 total];
    D196-2 ankle circuit lunge slot 19 [7 rename, 6 relabel, 6 drop]; D196-2-Am2 knee circuit 44; D196-3 132 + 70 relabel
    [120 + 58]; D196-4 860 [245]; D196-5 leave Leg isolation 36 (LAT_K); D196-5-Am2 appear Calves 24 (LAT_K 18 + g199 6);
    D197-1 12; D197-2 0 (its 9 days are on g215 LAT_G, not swept). Every re-ruling M17 figure reproduces.
Regression-list checks: calf-line removals 0; four-item circuit on knee/protect or a non-runner 0; swap-universe names lost
    0/9,270; A-step changes outside prevention 0. Literal collisions with "any removal of a circuit item … or a Main": 1,202
    D196-1 Main renames; 44 knee circuit ops incl. 2 drops; 13 ankle circuit renames/drops; 38 D196-4 renames inside the
    lowback/protect bodyweight prevention circuit hinge slot (INJ 26, L432 12), counted in the re-ruling's 245 though D196-4's
    text says "accessory".
Universe: D196-6 is 138 programs on M17's full lattice (lowback/protect 69 + lowback/workaround 69) and 60 on g199; the
    re-ruling's "18 programs" is L432's bodyweight lowback count (coach2 swept FULL + L432 only).
ROOT: the knee/ankle literals (`_bwHTak`, slice 4) make the knee/protect bodyweight Main the bridge; the prevention circuit's
    lunge literal re-draws at cand:9294–9297. The 234 come from the lowback literals (`_bwHTlb`, slice 5) on the bodyweight
    lift templates' `Lower strength` / `Leg superset B` slots, including the beginner RPE 6 landing; re-draw site inside those
    templates not traced.
UNKNOWN: g215 LAT_G not swept; g199's 1-rest cells not separated; universe compared V230 vs cand only; cause of the beginner
    RPE 6 wording not traced.
