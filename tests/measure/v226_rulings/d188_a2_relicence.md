# D188 Class A2 re-licence: the tier reacts in both directions, and A1 owns the pace-goal length

Persisted verbatim by the orchestrator from coach's return, 2026-09-30 (coach is read-only). Evidence: `measure_a2_tierflips_v226.md`, `gatekeeper_run1_red.md`.

Coach, 2026-09-30, fresh spawn on gatekeeper run 1 RED. No new D-code (the D187 Class E pattern). All index.html edits stand.

**Finding.** My A2 bound "0 at 13:00" was wrong. My lattice ran run_base on hybrid/balanced only, where the long day is a fixed 45 minutes. On the event path with a support_* focus the run_base long run is `round5(dist × recovery/60)`, so a slower entered mile adds minutes and the 5-minute step crosses 45 or 75. Measure: 1,800 days / 1,080 of 28,350 beginner programs go to a longer tier (C→B 1,080, B→A 720), all run_base event support_*, mile 12:00 to 14:00, 0 in body focuses, 0 against the sign of (mile − 690). Printed this session, gatekeeper's cell (run_base 3mi, support_prevention, event, mon/thu/sun, seed 1000):

Before (V225, mile 13:00, LSD at the 11:30 default's 14:05 pace):
`W3 SAT [C 40.0min] Full Body Support {Easy Run — Long} :: Strength[Pushups (slow tempo), Feet-elevated inverted rows] | Explosive finisher[Jump squats, Burpees] | Core — Rotational Power[...]`

After (V226, same cell, the athlete's own 14:30 pace):
`W3 SAT [B 45.0min] Full Body Support {Easy Run — Long} :: Strength[Pushups (slow tempo), Feet-elevated inverted rows]`
TUE, WED, FRI of that week byte-identical. Same cell at 9:00: W4 B50→C40, W5 B55→B45, finisher returns. Same cell at 11:30: digest identical both sides (`8c72857ca9befafe`).

**Ruling 1, A2 both directions.** Coaching-correct. The run is the day, and the tier judges time on feet. A 13:00 beginner takes 45 minutes to cover what the default athlete covered in 40; the day was already tier B for him, the default was hiding it. Less lifting after a longer run for a slower beginner is the conservative direction and is exactly D187 Class E, which Mario concurred with at V225. Scoping the engine so run_base ignores the entered mile would print the athlete's pace on the card while computing his minutes from a stranger's. Rejected.

Licence as a fuzz predicate, beginner with entered mile m (seconds), V225 vs V226 of one cfg, same `totalWeeks`:
- P1 non-beginner, or beginner with no mile: 0 tier moves, 0 section changes.
- P2 every (week, day) long-run on one side is long-run on the other, same subtype. Tier order C<B<A. `sign(tier226 − tier225) ∈ {0, sign(m − 690)}`. At m = 690 the weekGrid is byte-identical.
- P3 the oracle tier from dose minutes and the doctrine lines (≥75 A, ≥45 B) equals the printed tier; minutes move with the same sign as (m − 690).
- P4 new-tier content: A lifting 0; B hinge 0, power 0, >8 sets 0; carries 0 on any tier.
- P5 long-run days whose tier did not move, and every non-long-run day: sections byte-identical.
Bound: 6,540 days shorter tier / 1,800 days longer tier in measure's lattice; gatekeeper's 18 fall inside P2.

**Ruling 2, Class A1-L.** "Length 0/480" was my lattice, not the rule. E3 (`calcProgramLength` reading the beginner's mile) is a licensed D188 read, and a pace goal's length is the gap between anchor and target: a truer anchor gives a truer length. Printed: pace 13:30 at 9:00, 11→9 weeks; at 13:00, 11→11 (cap). Class A1-L: `len226 ≠ len225` only when goal = run_pace_goal, beginner, mile entered, m ≠ 690, and `sign(len226 − len225) = sign(m − 690)`. Those programs are excluded from P2 and P5 (week realignment resections every day) and judged by P4 only. Bound: 315/28,350 (gatekeeper 144/7,992). G1's 9 stands.

**Recommendation:** ship V226 as built, A2 re-licensed both directions under P1 to P5, A1-L added, no engine change.
**Counter:** `round5` makes a 43-minute run print 45 and go tier B, so one printed step costs a 13:00 beginner his W3 finisher; pre-existing run_base rounding, same for the default athlete at W4, a §12 watch item, not this build's.

**Mario's call.** The slower beginner's long run now also lands on the tier rule and he lifts less that day. I recommend yes: this is the same rule you approved at V225, now pointed at the athlete's real number. Strongest counter: a five-minute rounding step is doing the deciding on W3.

**Athlete-facing.** You told us your mile time. We now plan your long run from your pace, not a guess. If you run slower than our guess, your long run takes more minutes. More time on your feet means less lifting that day. That is the same rule we used before. It just reads your number now. If you run faster, the long run is shorter and the lifting comes back. Nothing else in your week moves. Call: ship it, the long run judges the real you.

Files: `tests/measure/v226_rulings/measure_a2_tierflips_v226.md`, printed cells script `/private/tmp/claude-501/-Users-CanasBangin-Desktop-TheBig6V2/f12a37a6-7352-4251-8d99-97802f07477d/scratchpad/coach/a2_cells.js`.

## MARIO DECISION (2026-10-01)
Mario: "yes". Class A2 LICENSED IN BOTH DIRECTIONS under P1 to P5; Class A1-L (pace-goal length follows the beginner's entered mile) added. No engine change. `round5` threshold step logged as a §12 watch item, not this build.

## SESSION NOTE (gatekeeper run 2 GREEN, 2026-10-01)
Gatekeeper classed a seeded 9:00 mile shortening a pace goal 13→9 weeks as A1-L (sign correct) and asked whether "entered" covers seeded. Session reading, anchored in the ruling's own text: D188 Class A1 is defined as "beginner with a mile (typed or seeded)", and A1-L is A1's length consequence, so "entered" in A1-L means a mile present in cfg, typed or seeded. No re-ruling.
