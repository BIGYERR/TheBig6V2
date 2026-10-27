# Supersets: decisions

How a superset or circuit is built and drawn: the round count (`_secRounds`), the rows inside a round
(`buildExItem` with `_ssRounds`), and the block's demotion to straight sets when only one member is left live
(`buildSectionsHTML`, `frontends/app/src/legacy/src/js/week-view-sections.ts`). What a card logs is `parseRx` in the
same file. The engine builds the sections (`core/src/engine/engine-c.ts`). The V162, V175 (D28) and V190 (D39) rulings,
in the handoff, are the history before this file. Tests: `tests/integration/supersets.test.ts`,
and `frontends/app/test/unit/session-sections.test.ts`. Measures: `tests/measure/supersets_survivor-straight-sets.ts`,
`tests/measure/supersets_circuit-size.ts`, each with its `.out.txt`.

## D253: P-SURVIVOR, the last live member keeps its own line (v0.249.0)

- **Date:** reported and ruled 2026-10-26. **Ruled by:** the main session on its measure (a defect: no doctrine, no
  change to what a program prescribes). **Bump:** MINOR, v0.249.0 (Mario, the batch). **Shipped:** v0.249.0.
- **The report (Mario, screenshot of week 10 Monday, Posterior Chain, "Pull superset A — reduced to straight sets",
  Barbell row skipped):** "why is chinups in seconds? tf does that mean". The card read "2×2 sets — RPE 7 (leave 3 or
  more in reserve)" and logged his two sets as "7 / 5 sec", +5 and +3 against a target of 2.
- **The finding (measure, 865 programs: HALF_MANNY and the 864-config lattice FULL, every member of every superset
  tried as the one live member):** 93,550 members tried. 30,702 have a line that opens "N sets" (the bodyweight and
  effort copy), and every one of them is drawn as "N×N sets …" and logged in seconds: the reduction puts the round
  count in front of any line that does not open "N×", and `parseRx`'s strict grammar takes the "s" of "sets" as its
  seconds token, because the token needs no word boundary. In all 30,702 the round count equals the member's own N, so
  the member's own line already carries the true set count. The same loose token reads two Wildcard lines as seconds:
  Dumbbell incline press "4×12 slow" and Dumbbell bench press "3×15 slow". No other line on the lattice is misread.
- **What changes:**
  - A superset reduced to one live member draws that member's own line when it opens "N sets", as it already does
    when it opens "N×". The mapping has two copies and both change: `buildSectionsHTML` on the single-file page and
    `session-sections-model.ts` (`frontends/app/src/app/screens/day-detail/`) in the iOS app. `parseRx` is one
    function, which the iOS app reaches through the bridge.
  - `parseRx` reads a unit (sec, s, yd) after "N×M" only as a whole word, so "N×M sets" and "N×M slow" log reps.
- **What deliberately does not change:** the stored items (`i.detail`), a superset with two or more live members, the
  rounds header, a line that opens with a rep count ("10 reps" still becomes "R×10"), every line that names a unit as a
  word ("3×25 sec", "3×30s each", "4×20 yd"), and the stored logs. A log holds its numbers and the unit is read from
  the line when the card is drawn, so the 7 and 5 already logged read as reps once this ships.
- **Expected values (typed from the ruling):** with Barbell row skipped, Chinups at "2 sets — RPE 7 (leave 3 or more in
  reserve)" is drawn as exactly that line and logs 2 open sets of reps; `parseRx("2×2 sets — RPE 7 …")` is not
  seconds; `parseRx("4×12 slow")` is 4 sets of 12 reps and `parseRx("3×15 slow")` 3 sets of 15; `parseRx("3×25 sec")`
  is 3 sets of 25 seconds, `parseRx("3×30s each")` 3 sets of 30 seconds a side, as today.
- **Tests:** in `tests/integration/supersets.test.ts`, the survivor's line on the reporter's day (HALF_MANNY week 10
  Monday, Pull superset A, Barbell row skipped), on Mario's second report (a Full Body day, "Strength — reduced to
  straight sets", Feet-elevated inverted rows skipped, Pushups (slow tempo) drawn "3×3 sets — RPE 7 …" and logged as
  "3 × 3 sec") and on a 4 set member, and the parser cases above; in
  `frontends/app/test/unit/session-sections.test.ts`, the iOS app's copy on the reporter's day.

## D254: P-CIRCUIT3, a circuit holds three movements; the hip thrust follows it (v0.249.0; amends D195 Amendment 2, P-HIPEXT)

- **Date:** asked and ruled 2026-10-26. **Ruled by:** Mario ("cap it, but refer to coach we still need hip work"),
  coach hat on where the hip work goes, Mario concurring ("concur"). **Bump:** MINOR, v0.249.0 (Mario, the batch). **Shipped:** v0.249.0.
- **The report (Mario, screenshots of week 9's leg day):** "for a user its alot to set up at a commercial gym...so
  maybe keep circuits in a program to like 3 workouts? willing to hear pushback".
- **The finding (measure, 865 programs, `tests/measure/supersets_circuit-size.ts`):** 42,941 circuits: 38,393 of two
  movements, 1,428 of three, 3,120 of four. Every four-movement circuit is `Leg circuit — runner armor`, in 262 of the
  865 programs and on every HALF_MANNY leg day, W1 to W12. Its fourth movement is always the hip extension P-HIPEXT
  added at V231: Single-leg hip thrust 1,632, Single-leg glute bridge (weighted) 780, Single-leg hip thrust (shoulders
  on bed) 360, Banded hip thrust 300, Single-leg glute bridge 48.
- **Coach:** "Cap the circuit at three and keep the hip work. The hip thrust comes out of the circuit, not out of the
  day. It's the one direct glute max movement on a runner's leg day, and push off is glute work; the hinge in slot
  three helps but doesn't replace it. Done after the circuit as its own two sets, it costs no extra station during
  the round, and it keeps everything P-HIPEXT bought."
- **What changes:**
  - A program circuit holds at most three movements.
  - On prevention runner leg days the runner armor circuit keeps its lunge, knee hold and hinge, two rounds as now.
    The hip extension P-HIPEXT draws moves to its own straight-set section right after the circuit, at the same
    prescription (`2×8 each`, printed `2×6–10 each @ RPE 7`), the same draw and the same gate (`_isRunner`, non-null,
    not the circuit's hinge).
  - What P-HIPEXT gave the fourth slot follows the movement: it is still the first item either trim takes (rank 3),
    and `capRegionalFatigue`'s fifth leg movement is allowed while that section exists, in place of "while a
    four-item circuit exists". The section is labelled `Glute — runner armor`: a label with "hip", "mobility" or
    "stretch" in it is prehab to the budget, which protects it.
  - **Amendment 1 (2026-10-26, measure, then Mario):** the after-picture (`tests/measure/supersets_circuit-cap-after.ts`,
    865 programs) showed 3,120 changed days: 2,334 where the hip extension moved after the circuit and 786 where it
    vanished, 489 recovery weeks and 297 deload weeks ("leave plenty in the tank"), because a reduced week keeps one
    accessory block and the moved section was a second. Inside the round it had survived. Put to Mario ("keep it on
    those weeks too?"): "Keep it on those weeks". So the reduced-week rule keeps the section whenever the block it
    keeps is the runner armor circuit.
- **What deliberately does not change:** which movements are drawn, the circuit's rounds and rest, the calf, hip
  stability, foot and ankle and carry sections, non-runner prevention leg days (P-RUNNERONLY), and the Wildcards, which
  are named workouts drawn from their own pools ("in a program", Mario).
- **Expected values:** HALF_MANNY's leg day, every week W1 to W12: the circuit holds three movements and the hip
  thrust stands alone after it, in `Glute — runner armor`, recovery weeks included. The after-picture, printed before
  the golden files were regenerated (standing ruling 5; every HALF_MANNY card before and after is in
  `tests/measure/supersets_circuit-cap-after.out.txt`): HALF_MANNY's digest b04eeaee9fe1ef46 becomes e47eb1012ab04bff,
  self-stable; over 865 programs 3,120 days change, every one the move and nothing else; circuits of four movements go
  from 3,120 to 0; hip thrust and glute bridge items stay 12,820.
- **Tests:** in `tests/integration/supersets.test.ts`, no program circuit on the lattice sample holds more than three
  movements; in `tests/integration/runner-armor-circuit.test.ts`, HALF_MANNY's leg days carry the three-movement
  circuit and the hip extension after it, and a stacked speed-run leg day still sheds the hip thrust first.
