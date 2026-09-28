# P-RACEDATE — THE RACE DATE IS PARSED ONCE, AND THE COUNTDOWN IS LIVE (coach, provisional, V206 baseline)

Measured this session: `node tests/measure/v223_race_date_tz.js scratchpad/base.html` (ia-version 206), plus a
26,520-pair DST parity probe of `raceAlignment.weeksOut` under `TZ=America/New_York`. Evidence quoted below is
from those runs, not from the report.

## Finding

The engine is clean: across 1,460 builds (365 race dates × New York, Los Angeles, UTC, Tokyo) race-day index,
week count, `startDate`, race-day key and `progDigest` differ from the UTC build in **0/1,460**. Every engine
reader goes through `_parseLocalDate` (:14567) or `getWeekMonday` (:11054), both `new Date(y, m-1, d)`.

Four athlete-facing surfaces do `new Date('YYYY-MM-DD')` (UTC midnight) and then `toLocaleDateString`, so in
every US zone they print the day before the race: **365/365** wrong in New York and Los Angeles, 0/365 in UTC
and Tokyo, for every weekday equally (`{"Sun":53,"Mon":52,…}`). The header at :11508 uses
`_fmtStartDay(progAlignment(p).raceIso,true)` and is right 365/365. Mario's card and header disagree because
one parses the way the engine does and the other does not.

"Time out" is a wizard-time snapshot. `raceDateWeeks` is written once at :2284, read by the wizard review row
(:3022) and the card and copy text (:14213), never by the engine, never rewritten. It reads 13 on every day of
the program and after a race move, while the engine's own `weeksOut` reads 10 today and 11 after the move.
(Mario's device says 14: his build week was Aug 24 to 30; the harness builds on Aug 31 and says 13.)

A fifth defect the measure did not cover, found while checking what the new helper may safely read:
`raceAlignment.weeksOut` at :4202 is `Math.floor((race - today)/86400000/7)` on raw milliseconds. Across the
spring-forward transition the span is one hour short, so a race exactly 7k days out floors to k-1. In New York
it disagrees with the rounded day count on **1,071/26,520** (today, race) pairs, e.g. 2026-11-16 → 2027-03-15,
119 days: engine 16, calendar 17. Readers: `underFloor` (:4207, wizard feedback colour :2303 and copy :1966)
and the aligned-start sentence `al.weeksOut + ' weeks out'` (:1959). `openWeek` and `futureWeeks` already
`Math.round` days first and are unaffected, which is why the grid is timezone-clean.

## Before (harness, TZ=America/New_York, HALF_MANNY built on the wizard day 2026-08-31, race 2026-12-06)

```
today 2026-09-22   card   "Race date Dec 5, 2026"   "Time out 13 weeks"          engine weeksOut 10
                   copy   "Event: Dec 5, 2026 (13 wks out)"
                   header "Sun, Dec 6, 2026"                                      (correct)
2026-11-20 (wk 12) mile   "Days out 15   Race day Dec 5, 2026   Week 12 of 14"   (UTC box: 16 / Dec 6)
wizard 2026-08-31  review "Race date Dec 5, 2026 (13 weeks away)"
after setProgRace(2026-12-13) on 2026-09-22:
                   card   "Race date Dec 12, 2026"  "Time out 13 weeks"          engine weeksOut 11
                   stored top-level raceDate 2026-12-06, cfg.raceDate 2026-12-13
```

## Ruling

**(i) One parser, one formatter, four surfaces.** The date string on the Programs card (:14199), the mile
lock sheet "Race day" (:14402), the wizard review row (:3022) and, through `progSelData.raceStr`, the copy
text (:14477) all print `_fmtStartDay(iso, true)`. It already exists, it already feeds the header, and it is
`_parseLocalDate` underneath, the same parser the engine uses. No new date formatter. The weekday comes with
it on purpose: D14a §1 says the entered date's weekday always wins and "half = Sunday" is a default, never an
assumption. Mario's own Sat Dec 5 / Sun Dec 6 slip is the use case, and a card that prints the weekday lets
the athlete catch it without opening the week view. The mile sheet's "Days out" arithmetic at :14401 keeps
its `Math.round` and changes only its input (local parse), so 15 becomes 16 on Nov 20.

**(ii) "Time out" becomes a live countdown from one pure helper, `raceCountdown(raceIso, todayIso)`.**
Sited beside `raceAlignment` (:4194), pure like it: dates in, numbers out, no DOM, no WD, no program object.
```
race  = _parseLocalDate(raceIso); today = todayIso ? _parseLocalDate(todayIso) : local midnight
days  = Math.round((race - today)/86400000)        // the mile sheet's own arithmetic, :14401
weeks = Math.floor(days/7)                         // updateRaceDateFeedback :2277 and raceAlignment :4202
```
No new constant: 86400000 and the floor-by-7 are the file's own. It takes the ISO, not `progAlignment(p)`,
because a test goal carrying a date (D106a) has no NRC alignment and its card must count down too. It rounds
days before it floors weeks so it is right across DST (the engine's `weeksOut` is not; see (v)).

Card value, key stays "Time out". Copy rule applied: no dashes, short, coach voice.
```
days >= 7   "10 weeks"   ("1 week")        weeks = floor(days/7); the unit a plan is built in
1..6        "6 days"     ("1 day")         race week is counted in days
0           "Race day"                     the header's own word for the day
< 0         "Behind you"                   neutral about whether he ran it; the row stays so the card
                                           still says what this program was for
```
Copy text: `Event: Sun, Dec 6, 2026 (10 weeks out)` / `(6 days out)` / `(race day)` / `(behind you)`.
Mile lock sheet: the row reads "Days out" with the helper's `days` while days ≥ 1 ("16"), and the same
"Race day" / "Behind you" strings at 0 and below. The sheet keeps days at every horizon because D116 put it
there on purpose: three weeks out the taper is lived in days, and the V203 flag records the popup was written
to agree with the card, so both now read one helper. The row prints whenever a race date is set; the old
`s.raceWeeks ? … : ''` guard, which hid the row at 0 weeks, goes.

**(iii) Wizard review row.** The number is right at wizard time (local parse at :2270, refreshed on every
input) and the date is wrong (UTC parse at :3022). Fix the date with `_fmtStartDay(WD.raceDate, true)` and
take the number from `raceCountdown(WD.raceDate)` so the review row and the card cannot drift; keep the
phrase "(13 weeks away)", and under a week "(6 days away)", on the day "(race day)". After this, nothing reads
`WD.raceDateWeeks` or `cfg.raceDateWeeks`.

**(iv) Dead stored fields.** Remove `raceDate` and `raceDateWeeks` from the program literal at :10510. Standing
ruling 3 does not govern this: it is about assertion pins in the gate suite (a constant declared to defend a
claim). A persisted field is data on the athlete's record, and the invariant that governs it is architectural:
`buildProgram` is a pure function of `cfg`, `progAlignment` reads `cfg.raceDate`, and a second copy that
`setProgRace` never writes is already disagreeing after one move (measured above: top 12-06, cfg 12-13). Keeping
it in sync would make a zero-reader field look maintained, which is the exact failure ruling 3 names for
re-pointed pins. Measured readers: 0 (`p.raceDate\b` 0 hits; `p.raceDateWeeks` only the :14213 fallback this
ruling retires; the only test hit, `g203_mile_pencil.js:189`, reads the cfg fixture, not the program object).
Stored programs keep the stale keys harmlessly; no migration, nothing reads them. `cfg.raceDateWeeks` stays
written by the wizard (:2284, :2757, :2901): removing it is three wizard-DOM edits for no athlete-visible
change. Record it in §12 as debt and change the :2284 comment to say it is unread since P-RACEDATE.

**(v) FOLDED IN: one day-count in the file.** Measure (`tests/measure/v223_weeksout_dst.js`) verified the
claim and bounded it: New York wrong on 1,330/42,420 pairs, every one an exact multiple of 7 days spanning
the spring-forward; engine footprint 0/5,320 (`totalWeeks`, `startDate`, `blockOpen`, race day, `openWeek`,
`futureWeeks`, digest). Nothing in the engine reads `weeksOut` or `underFloor`; readers are :1959 (copy),
:1966 (warning and shorter-plan offer), :2303 (colour), :3016 (`warn` class), `underFloor` flipping on
182/5,320. So this is the same class as (i) to (iv), display, and it stays inside P-RACEDATE: `raceAlignment`
:4202 becomes `raceCountdown(raceIso, todayIso).weeks`. The reason is the ruling's own principle. If
`raceAlignment` keeps its raw floor, the wizard's aligned-start sentence at :1959 ("18 weeks out") and the
card's "Time out" ("19 weeks") print different numbers for the same race on the same day, the disagreement
this ruling exists to end. Order: the helper lands with :4202 in the first slice, the parse sites follow.

:2279 to :2280 (`daysUntil`, `weeksUntil` in `updateRaceDateFeedback`) carry the same raw floor and take the
same substitution, `raceCountdown(WD.raceDate)`, but only after measure prints one reader: :2339
`achievablePacePerMile(weeksUntil, …)` computes the safe-pace offer, and if accepting that offer writes WD, a
week's progression can move a pace the athlete keeps. The other readers (:2286, :2290, :2307, :2330, :2331,
:2346) are wizard copy. Measure :2339's `safePace` under both arithmetics across the spring-forward lattice
and whether the offer writes WD; if it writes nothing, :2279 rides in the same slice as :4202.

**(vi) MOVED TO P-SAFEPACE (V207 re-ruling).** P-SAFEPACE owns `updateRaceDateFeedback` wholesale: the
:2279 to :2280 substitution and its gate live there, the offer is removed and its sentence reads `_tw`, so
the offer gate below is void. "Existing cfgs untouched" stands. Kept for the record: Measure (`v223_weeksout_dst.js wu`):
`daysUntil` one day short on 9,709/42,420 New York pairs (every span containing 2027-03-14), `weeksUntil` one
week short on 1,330/42,420, UTC 0 on both. The offer at :2339 is not copy: the show/hide gate flips on
3,479/47,880 offer rows, the printed pace differs on 16,191/19,719, and `applySuggestedPace` (:2251) writes
`WD.cardioGoals.run.targetMins/targetSecs` (:2253) and `targetTime` (:2391), which `paceGoalTarget` (:3052)
feeds to `calcProgramLength` and `buildRunSession`: `progDigest` moved on 245/245 clicks, `totalWeeks` on
62/245 (33:52 builds 16 weeks, 33:48 builds 17). So a wrong count, one spring, seven-day multiples, reaches a
built program through the athlete's own click. Same root cause, same fix, same helper: :2279 to :2280 become
`const {days:daysUntil, weeks:weeksUntil} = raceCountdown(WD.raceDate)`. It stays inside P-RACEDATE because
the principle is one day-count in the file; it takes its own slice because its gate is not a display gate.
`buildProgram` does not change: the defect is upstream of cfg, in what the wizard suggests. The "isn't
enough" copy (:2307, :2330, :2331) reads the same variables, writes nothing, and needs no measure.

Gate for this slice: the offer table (show/hide, `safePace`, `secsToMMSS` line) under `TZ=America/New_York`
against the hand-rounded day oracle across the spring-forward lattice, and the identity fuzz proving a pinned
cfg builds the same digest before and after (engine untouched). Sabotage: restore the raw floor at :2279 must
trip the offer gate; restore it at :4202 must trip the countdown gate.

**Existing cfgs: nothing touches them.** The engine repairs what the engine wrote, never what the athlete
chose. D106a's backfill rewrote `_raceDateCappedWeeks`, a pin the engine derived wrongly. A target pace the
athlete accepted from an offer is his goal: the cfg carries no provenance that says it came from a click, a
rewrite would presume he would have clicked the other number, and it would move untrained weeks mid-block.
The error is also the conservative one: one week short offers a slower pace (11:17 against 11:16) and a plan
that fits it. The pure-function-of-cfg invariant is exactly why leaving cfg alone is safe: every rebuild
returns the program he accepted. Population: US zones, pace goal with a date, span across a spring-forward,
exact seven-day multiple, offer shown, offer clicked. Mario's live program (NRC half) has no offer path.

`testWeekIndex` (D106a, built in V207 at :4231) rounds Monday differences (:4234) and is DST-safe. Note
satisfied by inspection.

## After (expected, same harness, TZ=America/New_York)

```
today 2026-09-22   card   "Race date Sun, Dec 6, 2026"   "Time out 10 weeks"      (75 days)
                   copy   "Event: Sun, Dec 6, 2026 (10 weeks out)"
                   header "Sun, Dec 6, 2026"                                      (unchanged)
2026-11-20 (wk 12) mile   "Days out 16   Race day Sun, Dec 6, 2026   Week 12 of 14"
2026-11-29         card   "Time out 1 week"      2026-11-30  "Time out 6 days"
2026-12-06         card   "Time out Race day"    2026-12-07  "Time out Behind you"
wizard 2026-08-31  review "Race date Sun, Dec 6, 2026 (13 weeks away)"            (97 days)
after setProgRace(2026-12-13) on 2026-09-22:
                   card   "Race date Sun, Dec 13, 2026"  "Time out 11 weeks"     (82 days; engine 11)
                   stored top-level raceDate/raceDateWeeks absent; cfg.raceDate 2026-12-13
UTC and Tokyo: every string identical to the New York column.
```

## What does not change
`buildProgram`, `raceAlignment` (this slice), `progAlignment`, `setProgRace`'s alignment path, the header,
`_fmtStartDay`, `_parseLocalDate`, every grid on every goal, focus, calendar and week. `HALF_MANNY` digest is
unchanged, no card changes, so no `MANNY_DIGEST_BY_VERSION` row is owed. NRC tables untouched.

## Blast radius (for gatekeeper)
Display only, every program with a race date: NRC race goals (5K, 10K, half, marathon) and D106a test goals
with a date, in every zone west of UTC the date moves one day later on the card, the mile lock sheet, the
wizard review and the copy text, and gains a weekday; in UTC and east the date is unchanged and only gains
the weekday. "Time out" changes on every such program on every day it is viewed. Expected diff hunks: :3022,
:10510, :14199, :14213 and the card row at ~:14227, :14398 to :14402, :14477, one new helper. Gate: the four
surfaces against the measure's y/m/d hand oracle, spawned under `TZ=America/New_York` AND `TZ=UTC` (the
harness passes the host clock through, printed "harness pins TZ? NO", so a gate that does not set TZ passes
on a UTC box while the phone is wrong), plus a Time out state table (weeks, 1 week, days, 1 day, Race day,
Behind you) against date arithmetic with a movable clock. Sabotage: restore `new Date(c.raceDate)` in
`progSelData` must trip; restore `s.raceWeeks` read must trip; drop the `< 0` branch must trip.

## Seen in passing, not ruled here
Athlete-facing mid-sentence em-dashes: :2291 "Less than a week away — not enough time to train.",
:1945 "— set by race date" / "— short first week", the `setProgRace` toast "Race day Sun, Dec 13 — plan
starts Mon, Sep 7". Copy-rule debt for a copy pass. Three labels for one thing: "Race date" (card),
"RACE DAY" (header), "Race day" (mile sheet); harmless, left alone.

Recommendation: one ruling, P-RACEDATE, sliced for the four-edit cap: helper + :4202 first, the four parse
sites, the :10510 removal, then :2279 with the offer gate. No migration of stored cfgs.
Mario's call (doctrine, stored records): leaving accepted goals alone. Recommend leave. Slicing is the session's. Mario has decided the card: weekday,
live countdown, "Behind you" after the race.
Counter: keep the card date bare ("Dec 6, 2026") to match the old look; I would not, because the weekday is
the one thing that catches the Sat/Sun slip and the header already prints it.

## MARIO DECISION (2026-09-23)
- Card reads weekday + live countdown (coach recommendation accepted): "Race date Sun, Dec 6, 2026 / Time out 10 weeks", then "Behind you" after race day.
- Ship slot: HOLD for more screenshots.
- Item 5 (weeksOut DST): measure v223_weeksout_dst.js says display only (0/5,320 engine rows move). Back with coach to fold or split.
- P-RACEDATE existing cfgs built from a wrong safe-pace offer: pending Mario (recommend leave alone).

## MARIO DECISION (2026-09-24, build-1 chat)
- Existing cfgs built from a wrong safe-pace offer: LEAVE ALONE (Mario: "i concur with no"). No repair, no migration, no backfill of stored target paces. Build 3 fixes the source only (P-RACEDATE week count; P-SAFEPACE removes the offer button).
- Re-baselined on V219 (`tests/measure/v220_rebase_build3.out.txt`): still reproduces (NY/LA card wrong 365/365; weeksOut DST display-only 1,330/42,420, engine 0/5,320); nothing in V210–V219 touched the date seams.

## D182 AMENDMENT (a) — V223 session, fresh coach under standing ruling 7 (saved verbatim by the main session)

Real D-code at dispatch: **D182**. Context: S1 (`raceCountdown`, raceAlignment weeksOut), S2 (`raceCountdownWords`, card, copy text) and S3 E1–E3 (mile sheet, wizard review, :2287 comment) landed on the V223 working tree; builder parked S3 E4 = (iv) because `progDigest` hashes the whole program object and removing the two keys moved all three HALF_MANNY arms with zero card change.

D182 — amendment (a): (iv) withdrawn, (iii) restated, review row past the race
(fresh re-ruling under standing ruling 7; builder's parked E4 stays parked)

MEASURED THIS SESSION (coach's own print, V222 stamp, D182 S1/S2/S3 E1–E3 on the tree)
tree.html : main 0ac7da6b1691a8e1 | deload-off 1069cd7f86eed204 | core-off 9d14801a63111081 (g199 and g200 methods; rows[222] match)
e4.html   : main f4caf0db22192178 | deload-off 98805dd3c9b86fb5 | core-off 866cf676cf1683ac (scratch copy, literal keys removed, anchor count=1)
`--grid` 73/73 lines, diff = line 2 only (the digest). Zero cards change. Top-level race keys on the built program: tree [raceDate 2026-12-06, raceDateWeeks null], e4 []. rows[223] do not exist yet on any arm. 24 gate files carry the literal 0ac7da6b1691a8e1; builder's gate run names 5 failing rows (g199 B1/B2, g200_core_tier F1a/F1b, g222 R7).
Wizard: `updateRaceDateFeedback` :2289 prints "That date has already passed." and returns; `wizardNext` (:2177) has no race-date check, so a past date reaches the review step.

Q1 — (iv) Dead stored fields: WITHDRAWN from D182. Recorded as §12 debt.
Reason: standing ruling 5's era row records a card change coach printed before and after. Here the changed-card list is empty. A row that says "the digest moved, nothing the athlete sees moved" is the maintained-looking pin that defends nothing (standing ruling 3's failure), and it costs three literal era rows plus five gate rows for zero athlete-visible change inside a display ruling. D109, the only copy-only precedent, still moved text on 53/98 days. The architectural argument stands but has zero readers (builder's trace: 0 in index.html, 0 in tests), and stored programs keep the keys regardless (no migration was ever ruled). Rejected alternative: adding raceDate/raceDateWeeks to `progDigest`'s strip list, which hides the move instead of ruling it.
(iii) closing sentence now reads: "After this, nothing reads `WD.raceDateWeeks`; the wizard still writes it (:2284, :2757, :2901). `cfg.raceDateWeeks` has one reader, the program literal at :10510, which copies it and `cfg.raceDate` into two stored keys nothing reads. Both are §12 debt."
§12 line (verbatim): "- **D182 DEAD STORED RACE KEYS (debt, not a defect).** The program literal (:10510) copies `cfg.raceDate` and `cfg.raceDateWeeks` into two top-level keys with zero readers; the top-level `raceDate` goes stale after `setProgRace`, cfg is the truth. Removing them moves all three HALF_MANNY arms with zero card change (coach, V222 tree: 0ac7da6b1691a8e1→f4caf0db22192178, 1069cd7f86eed204→98805dd3c9b86fb5, 9d14801a63111081→866cf676cf1683ac; grid 73/73 identical). Pay it, with the three wizard writes, in the next build that moves HALF_MANNY by a card ruling; the era rows are printed then. Parked edit: `tests/edits/v223_s3_d182_sheet_review_literal.py --e4`."
Era rows owed by V223: `MANNY_DIGEST_BY_VERSION[223] = [222]`, `MANNY_DELOAD_OFF_DIGEST_BY_VERSION[223] = [222]`, `MANNY_CORE_OFF_DIGEST_BY_VERSION[223] = [222]`, comment "D182: ruled UNMOVED (0ac7da6b1691a8e1 / 1069cd7f86eed204 / 9d14801a63111081 printed by coach on the V222 tree with S1–S3 landed; (iv) withdrawn, see §12)". Same reference-row form for SWAP_BY_VERSION (g200_pull), ERA (g219), g199's three tables and g197b's two.

Q2 — Mile lock sheet at 0 and below: KEEP AS LANDED. Rows: day ≥1 "Days out | 16" then "Race day | Sun, Dec 6, 2026"; day 0 "Days out | Race day" then "Race day | Sun, Dec 6, 2026"; past "Days out | Behind you" then "Race day | Sun, Dec 6, 2026". This is the prior ruling's text, which Mario concurred with, and it is the helper's own words: card, copy and sheet share one vocabulary and cannot drift. No new string.

Q3 — Wizard review row past the race: PRINT "(behind you)". Amend E2's expression to
`return !w ? '' : cd.days<=0 ? ' ('+w.copy+')' : ' ('+w.card+' away)';`
giving "(13 weeks away)", "(6 days away)", "(race day)", "(behind you)". The state table is then complete with the helper's own word, and the review row cannot drift from the card, which is the sentence D182 exists to enforce. The review step is reachable with a past date (measured above), so the row is the last screen before Build and should not be silent. This is athlete-facing copy on the wizard, not Mario's program; his call only if he wants a different word than the card's. Recommendation "(behind you)"; counter: no phrase, because the parenthesis is a countdown and :2290 already warns. I would not: the red line is on an earlier step.

WHAT CHANGES (builder): E2's ternary as above; the :2287 E3 comment stands; S3's E4 stays parked (anchor assert stays, `--e4` path stays); three reference era rows [223] on the harness arms and the gate tables above; §12 line.
WHAT DELIBERATELY DOES NOT CHANGE: `buildProgram`, the program literal at :10510, `progDigest`'s strip list, `raceCountdown`/`raceCountdownWords`, the card, the mile sheet as landed, every grid on every goal, focus, calendar and week. HALF_MANNY digest 0ac7da6b1691a8e1 on all three arms.

BEFORE (tree, V222 stamp, S1–S3 E1–E3 landed)
  weeks 14 | startDate null | seed 76308 | digest 0ac7da6b1691a8e1
  W14 SAT Shakeout {Recovery Run} ::
  W14 SUN Race Day {Long Run — RACE DAY} ::
  review past race: "Race date Sun, Dec 6, 2026"            (no phrase)
AFTER (expected)
  weeks 14 | startDate null | seed 76308 | digest 0ac7da6b1691a8e1   (grid byte-identical, 73/73)
  review past race: "Race date Sun, Dec 6, 2026 (behind you)"
  (counterfactual REJECTED, e4.html: digest f4caf0db22192178, grid otherwise byte-identical)

BLAST RADIUS: zero engine, zero cards, every goal and calendar unmoved. One wizard string state (past race date) on programs built toward an already-passed date. Gate: the review-row state table gains a `<0` row; sabotage "restore `cd.days<0 ? ''`" must trip it.

SEEN IN PASSING, NOT RULED: `wizardNext` does not block a past race date; a plan can be built toward a race behind the athlete. §12 watch item for a wizard-validation build.

Recommendation: withdraw (iv) into §12 debt, keep the mile sheet as landed, print "(behind you)" on the review row, and ship V223 with reference era rows on all three arms.
Counter: keep (iv) and pay the three literal era rows now, since the digests are printed and the tree is clean; I would not, because an era row with zero changed cards teaches the suite that the HALF_MANNY pin can move for nothing.
