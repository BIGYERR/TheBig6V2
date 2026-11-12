# Race plans: decisions

The four race-plan tables in `core/src/engine/nrc-race-bike-swim.ts` (`NRC_5K_TABLE`, `NRC_10K_TABLE`, `NRC_HALF_TABLE`,
`NRC_MARATHON_TABLE`): what each week of a 5K, 10K, half marathon or marathon program prescribes for the long run, the
speed runs and the recovery runs. The pace chart, plan lengths and floors, race alignment, the race-week pin and the
week's shape (D243, D244, D252 in `run-week-layout.md`) are ruled elsewhere. Measure: `tests/measure/race-plans_source-fingerprint.md`.
Tests: `tests/integration/race-plans.test.ts`, `tests/integration/run-names.test.ts`.

## D270 P-OWNPLANS: the four race plans are the app's own arrangement (PROPOSED, awaiting Mario's concurrence)

- **Date:** 2026-11-01. **Ruled by:** the main session in the coach hat, on Mario's "Yes, rule it" (2026-11-01), after
  the measure he asked for first ("Yes, measure first"). Amended in place 2026-11-11, still proposed: the 5K is
  re-authored for a first time runner, on Mario's question ("should not the 5k plan be a little more catered to a first
  time runner? 5k is small potatoes and a marathon plan i feel like could safely assume a first time runner isnt trying to
  do that off the couch"), which he concurred with ("i concur with the 5k rewrite"). Mario concurs or pushes back on the grids below before a line of
  code moves; the release line is filled in at ship time.
- **Finding (the measure):** the four tables hold 48 weeks and 75 speed-run slots filled by 39 distinct sessions, and
  every one of the 39 is a classic format: 13 mixed-pace sets, 6 sets of reps at one pace, 6 ladders or pyramids, 5
  tempos, 4 fartleks, 2 hill sessions, 2 progression tempos, 1 race-week sharpener. No session is anyone's: a 25:00 run
  at tempo pace, a 21:00 fartlek of 1:00 hard and 2:00 easy, 8 × 1:00 at 5K pace are the common vocabulary of distance
  coaching. What is the source's is the arrangement: all four plans opened with the same session and closed with the
  same session; 23 of the 39 sat in more than one plan on the source's weeks; every long-run sequence was the source's
  arithmetic to the row (the 5K's minute weeks, the half's 60-minute cutback, the marathon's two-hour and 90-minute
  weeks, its 18–22 mile range); every recovery-run minute was the source's. v0.255.1 (D268, D269) took the source's name
  off the page and the session titles off the cards; this ruling takes its arrangement out of the engine.
- **The ruling:**
  1. **The session library stays, every line of it.** The 39 sessions keep their structures, numbers, paces and
     recoveries, and their D269 names. Each is a classic format, and the coaching in them is sound: short reps at 5K
     pace for speed, tempos for the threshold, ladders and pyramids for pace change, hills for strength, fartleks for
     unstructured speed, a progression tempo and a sharpener for race week. They stop being a transcription and become
     the app's own library; from here a session's numbers change only by a ruling in this file.
  2. **Each plan's arrangement is re-authored, by rule, not by row.** The rules, the same for all four plans:
     - *The long run builds by the plan's own step and is miles throughout:* half a mile a week on the 5K from a 1.5 mile start
       (the 5K is a first time runner's plan, below), a mile a week on the 10K and the half, one to two miles on the
       marathon. No minute-based long run remains (the source's 15, 25,
       30 and 33 minute 5K weeks, the half's one hour, the marathon's two hours and 90 minutes); the engine's minute
       branch stays for a future ruling.
     - *A cutback every fourth week,* two thirds of the week before, to the nearest half mile, flagged `cutback`, so the
       athlete reads why the number dropped. The half's cutbacks fall on weeks 5 and 9, the marathon's on 4, 8 and 12,
       the 5K's and 10K's on week 4. There are no hold weeks (the source's half held weeks 5 and 9; D4e and V186 §6/F3
       retire with them).
     - *The peak long run is three weeks before the race,* flagged `peak`: 3.5 miles for the 5K, 8 for the 10K, 12 for the
       half, 20 for the marathon. The half then runs its dress rehearsal two weeks out (9 miles, `cutback` and
       `rehearsal`, the routine rehearsed, the pace the progression) and tapers to 7; the marathon tapers 14 then 10; the
       5K and 10K taper one week.
     - *Race week* keeps its shape: one short speed run early in the week, three recovery entries (a shakeout among
       them), the race on its day. Every race row is the plan's last row and keeps `race:true`, `THE RACE`.
     - *Speed runs move with the block:* the first third is short, fast and unstructured (fartleks, 1:00 reps, ladders),
       the middle is the threshold and race-pace reps (tempos, 2:00 to 7:00 reps, hills on the cutback weeks, where the
       legs are fresh and the volume is down), the last third is race-specific (the 8K tempo, the 42:00 of 10K to mile
       work on the half, the power pyramid on the marathon's peak week), and race week is a sharpener. The marathon's
       one weekly session leans on tempos; the 5K's on 5K-pace reps. No two plans share a week-1 session or a race-week
       session any more.
     - *Recovery runs grow with the long run* (10 to 25 minutes on the 5K, 25 to 35 on the 10K, 25 to 50 on the half,
       25 to 60 on the marathon), step back on cutback weeks, and race week prints the shakeouts in miles.
  3. **The source plans are reference reading, not the contract.** CLAUDE.md's "NRC session structures are verbatim"
     invariant and the handoff's "NRC table grammar (V171)" paragraph are rewritten: the tables are the app's own, the
     library's numbers move only by ruling here, and `doctrine/*.txt` is consulted the way any coaching text is. The
     `nrc_*` subtypes and the `NRC_*` names stay (persisted in every stored program, and a rename is a MAJOR).
- **The 5K is a first time runner's plan (coach, 2026-11-11; Mario concurred).** The source's 5K opened at a one mile
  long run with five and seven minute jogs: a plan people start running on. The 2026-11-01 draft opened at three miles
  with two twenty minute runs, a runner's 5K, written with the same hand as the other three. Coach reverses that: the 5K
  is the one plan that must assume no running base, and a marathon plan is the one that may assume a runner. The 5K's
  long runs are 1.5, 2, 2.5, 2 (cutback), 3, 3.5 (peak, two weeks out, so the distance is covered once before race day),
  3 (taper), the race; its easy runs start at 10 and 12 minutes and reach 20 and 25; race week is two short easy runs and
  a one mile shakeout. The speed pairs run soft to sharp: the 8 × 1:00 and the mile bursts in week 1, the fartleks in
  weeks 2 and 3, hills and the 20:00 tempo on the cutback, the two 20 minute rep sessions in week 5, the 3 × 7:00 and the
  25:00 tempo at the peak, the short sharp sets in the taper, the 9:00 sharpener in race week. A first time runner is a
  beginner in the app, so under D243 they run one session of each pair, two easy runs and the long run: four runs, none
  over 25 minutes until week 5. A runner who already covers three miles and picks a 5K gets an easy eight weeks and loses
  nothing: a 5K is won on the speed work, which is the same for everyone, and an advanced runner gets both sessions.
  Scaling the long run by experience would be a new mechanism, not built for the shortest plan. The 10K stays a runner's
  plan from four miles (where the source starts it too) and the marathon from six.
  *Backing, each claim against its source:* the NSW guide (`doctrine/physicaltrainingguide2020.txt`, LSD section) has a
  beginner's steady run start at twenty minutes where forty is typical, and injury avoided by a modest starting volume
  added to gradually; Hal Higdon's Novice 5K is eight weeks, three runs a week, 1.5 mile runs to a 3 mile longest run
  (halhigdon.com/training-programs/5k-training/novice-5k, the week 1 row from a club's copy of his schedule); the NHS
  Couch to 5K reaches 30 minutes of continuous running in nine weeks from 60 second runs
  (nhs.uk/better-health/get-active/get-running-with-couch-to-5k/couch-to-5k-running-plan); both cover the race distance
  before race day. On the ramp's steepness: NSW calls 10% a week a maximum and 5 to 8% ideal, citing nothing ("It has been
  suggested"); the rule is 1980s running lore (Ullyot, Henderson), and the one randomised trial of it, Buist et al. 2008
  (Am J Sports Med 36:33, 532 novices, a 13 week 10% programme against a standard 8 week one), found the same injury rate
  in both, about one in five; Nielsen et al. 2014 (J Orthop Sports Phys Ther, 874 novices followed a year) found more
  distance related injuries above a 30% rise over two weeks, short of significance. Coach's ramp rises 15 to 20% a week by
  time on feet with the week 4 cutback: over NSW's ideal, inside the 30% line, and the mainstream eight week arc. On speed
  work from week 1, which the walk and run plans omit: Ramskov et al. 2018 found no difference in injury risk between
  novices progressed by volume and by intensity, and the week 1 session is eight minutes of work. On the taper: Bosquet et
  al. 2007 (Med Sci Sports Exerc, 27 studies) found two weeks, volume cut 41 to 60%, intensity and frequency kept, the
  best taper; the 5K's volume is small, so week 7 is a light cut and race week the deep one, the sharpener keeping
  intensity. Easy running carries the week (Seiler's 80/20 reading; Esteve Lanao 2007): three of a beginner's four runs
  are easy. *Accepted costs, stated, not hidden:* the week to week rise is 15 to 20%, not NSW's 10%, because the plan
  length is pinned at eight weeks and a 10% ramp would need ten or eleven; the week 4 cutback is the safety valve. The
  peak long run is nearer a third of a beginner's four run week than the 20 to 25% Daniels is quoted at; unavoidable at
  four runs of this size, and the source's 4 mile peak sat in the same place.
- **What changes in the engine:** the 48 rows of the four tables, and nothing else in `nrc-race-bike-swim.ts`. The
  `detailIfHalfSlow` variant (D31) travels with the session that carries it (the 23:00 progression tempo, now half
  week 6 and marathon week 13). The After tables:

#### 5K (8 weeks, two speed runs and two recovery runs a week)

| Wk | Long run | Speed run 1 | Speed run 2 | Recovery runs |
|---|---|---|---|---|
| 1 | 1.5 mi | 8 × 1:00 at 5K Pace — 8:00 of work | Mile bursts between 5K and 10K reps — 6:00 of work, 7 efforts | 10 min, 12 min |
| 2 | 2 mi | 15:00 fartlek — 1:00 hard, 1:00 easy | Descending Mile reps with 10K floats — 8:00 of work, 9 efforts | 12 min, 15 min |
| 3 | 2.5 mi | Fartlek, recovery equals the effort — 9:15 of work, 14 efforts | 3 rounds of 5K, Mile and two Best bursts — 10:30 of work | 15 min, 20 min |
| 4 | 2 mi (cutback) | Hill workout — 5 rounds of 10K effort into Best effort | 20:00 tempo | 15 min, 15 min |
| 5 | 3 mi | 5 × 4:00 at 5K Pace — 20:00 of work | 10 × 2:00 at 5K Pace — 20:00 of work | 20 min, 20 min |
| 6 | 3.5 mi (peak) | 3 × 7:00 at 5K Pace — 21:00 of work | 25:00 tempo | 20 min, 25 min |
| 7 | 3 mi (taper) | Mile reps growing 0:30 → 1:30, each chased by 0:15 at Best — 6:15 of work | 5K bursts around a 3:00 10K rep — 8:00 of work, 11 efforts | 20 min, 15 min |
| 8 | **3.1 mi, the race** | Mile to 10K, then 7:00 easy — 9:00 of work | none: race week | 20 min, 15 min, 1 Mile |

#### 10K (8 weeks, two speed runs and two recovery runs)

| Wk | Long run | Speed run 1 | Speed run 2 | Recovery runs |
|---|---|---|---|---|
| 1 | 4 mi | 21:00 fartlek — 1:00 hard, 2:00 easy | Mixed-pace ladder down to Best — 10:00 of work, 10 efforts | 25 min, 25 min |
| 2 | 5 mi | Mixed-pace ladder — 9:00 of work, 5 efforts | 20:00 tempo | 25 min, 30 min |
| 3 | 6 mi | 5 × 5:00 at 10K Pace — 25:00 of work | 5K reps with a Mile-pace kicker — 15:00 of work, 10 efforts | 30 min, 30 min |
| 4 | 4.5 mi (cutback) | Hill workout — 3 rounds of 10K, 5K and Mile efforts | Out strong, back fast — 23:00 tempo | 25 min, 25 min |
| 5 | 7 mi | 5K reps around a 10:00 tempo — 22:00 of work | Descending ladder 10K → 5K → Mile → Best — 15:30 of work, 7 efforts | 30 min, 35 min |
| 6 | 8 mi (peak) | 8K tempo, bookended by 2K easy | 3 rounds of a 5K rep and four Mile-pace bursts — 15:00 of work | 35 min, 35 min |
| 7 | 6 mi (taper) | 10K bookends around 5K and Mile reps — 15:30 of work, 8 efforts | 20 × 0:30 at Mile Pace — 10:00 of work | 30 min, 25 min |
| 8 | **6.2 mi, the race** | 15:00 progression tempo — Recovery Pace down to Best | none: race week | 3 Mile, 25 min, 1 Mile |

#### Half marathon (14 weeks, two speed runs and two recovery runs)

| Wk | Long run | Speed run 1 | Speed run 2 | Recovery runs |
|---|---|---|---|---|
| 1 | 4 mi | 20 × 0:30 at Mile Pace — 10:00 of work | 21:00 fartlek — 1:00 hard, 2:00 easy | 25 min, 30 min |
| 2 | 5 mi | Mixed-pace ladder down to Best — 10:00 of work, 10 efforts | 20:00 tempo | 25 min, 30 min |
| 3 | 6 mi | 10 × 2:00 at 5K Pace — 20:00 of work | Hill workout — 5 rounds of 10K effort into Best effort | 30 min, 35 min |
| 4 | 7 mi | Descending ladder of Mile and 5K reps — 18:00 of work, 12 efforts | 25:00 tempo | 30 min, 35 min |
| 5 | 5 mi (cutback) | Four blocks, each shifting straight into Mile Pace — 14:00 of work | Fartlek, recovery equals the effort — 9:15 of work, 14 efforts | 25 min, 30 min |
| 6 | 8 mi | 5 × 5:00 at 10K Pace — 25:00 of work | 23:00 progression tempo — Marathon Pace to 10K Pace | 30 min, 40 min |
| 7 | 9 mi | Power pyramid — 22:00 of work, Mile to 10K and back | Out strong, back fast — 23:00 tempo | 35 min, 40 min |
| 8 | 10 mi | 3 × 7:00 at 5K Pace — 21:00 of work | 8K tempo, bookended by 2K easy | 35 min, 45 min |
| 9 | 7 mi (cutback) | Hill workout — 3 rounds of 10K, 5K and Mile efforts | 21:00 fartlek — 2:00 hard, 1:00 easy | 30 min, 35 min |
| 10 | 11 mi | 5K reps around a 10:00 tempo — 22:00 of work | 3 rounds of 10K → 5K → Mile — 42:00 of work | 40 min, 45 min |
| 11 | 12 mi (peak) | Pyramid from 10K to Best and back — 18:00 of work, 8 efforts | 3 rounds of 5K → 10K → Mile — 13:30 of work | 40 min, 50 min |
| 12 | 9 mi (cutback, rehearsal) | 5K reps with a Mile-pace kicker — 15:00 of work, 10 efforts | 15:00 progression tempo — Recovery Pace down to Best | 30 min, 40 min |
| 13 | 7 mi (taper) | 3 rounds of a 5K rep and three Mile-pace bursts — 11:15 of work | Mile to 10K, then 7:00 easy — 9:00 of work | 30 min, 3 Mile |
| 14 | **13.1 mi, the race** | Race-week sharpener — 11:00 of work around 5:00 at race pace | none: race week | 25 min, 20 min, 2 Mile |

#### Marathon (18 weeks, one speed run and three recovery runs)

| Wk | Long run | Speed run 1 | Speed run 2 | Recovery runs |
|---|---|---|---|---|
| 1 | 6 mi | 15:00 fartlek — 1:00 hard, 1:00 easy |  | 25 min, 30 min, 25 min |
| 2 | 7 mi | 8 × 1:00 at 5K Pace — 8:00 of work |  | 30 min, 30 min, 30 min |
| 3 | 8 mi | 20:00 tempo |  | 30 min, 35 min, 30 min |
| 4 | 6 mi (cutback) | Hill workout — 5 rounds of 10K effort into Best effort |  | 25 min, 30 min, 25 min |
| 5 | 9 mi | Mixed-pace ladder down to Best — 10:00 of work, 10 efforts |  | 30 min, 40 min, 30 min |
| 6 | 10 mi | 25:00 tempo |  | 35 min, 40 min, 35 min |
| 7 | 12 mi | 5 × 5:00 at 10K Pace — 25:00 of work |  | 35 min, 45 min, 35 min |
| 8 | 8 mi (cutback) | 21:00 fartlek — 1:00 hard, 2:00 easy |  | 30 min, 35 min, 30 min |
| 9 | 13 mi | 5K reps around a 10:00 tempo — 22:00 of work |  | 40 min, 45 min, 40 min |
| 10 | 14 mi | 8K tempo, bookended by 2K easy |  | 40 min, 50 min, 40 min |
| 11 | 16 mi | 3 × 7:00 at 5K Pace — 21:00 of work |  | 45 min, 50 min, 45 min |
| 12 | 10 mi (cutback) | Hill workout — 3 rounds of 10K, 5K and Mile efforts |  | 35 min, 40 min, 35 min |
| 13 | 17 mi | 23:00 progression tempo — Marathon Pace to 10K Pace |  | 45 min, 55 min, 45 min |
| 14 | 18 mi | Out strong, back fast — 23:00 tempo |  | 45 min, 60 min, 45 min |
| 15 | 20 mi (peak) | Power pyramid — 22:00 of work, Mile to 10K and back |  | 45 min, 60 min, 45 min |
| 16 | 14 mi (taper) | 21:00 fartlek — 2:00 hard, 1:00 easy |  | 40 min, 45 min, 35 min |
| 17 | 10 mi (taper) | Mile to 10K, then 7:00 easy — 9:00 of work |  | 35 min, 4 Mile, 30 min |
| 18 | **26.2 mi, the race** | Mixed-pace ladder — 9:00 of work, 5 efforts |  | 30 min, 3 Mile, 1 Mile |

- **Does deliberately not change:** the pace chart and its row lookup; `NRC_PLAN_WEEKS` (8, 8, 14, 18) and
  `NRC_PLAN_FLOOR` (4, 4, 6, 12); `raceAlignment`, the race-week pin and the time-trial branch; the one-speed-day rules
  (D243, D244, D252: a one-speed layout still prints the longer session, and the table below says which); the long-run
  card copy (D6's progression definition, the cutback, peak, taper, rehearsal and race-day notes); D4b's distance
  entries; the dose grammar; the session types and subtypes; the NSW goals; the 864-config lattice (no race goal on it).
- **Amended rulings:** D4d (range long runs dose the low end: no range remains, the rule is moot until a range is
  written again), D4e and V186 §6/F3 (the half's hold weeks: retired, the half has cutbacks instead), V186 §7a and §7b
  (two transcription calls on the source's rows: moot, the rows are the app's), D31 (the half-slower-than-marathon
  chart row: unchanged, the variant moves with its session), D251 and D252's oracles in `run-week-layout.test.ts` (the
  rule holds; the strings it is proved on are re-typed from the half table above).
- **Expected values (standing ruling 5):** printed from the source-surgery copy before the build, on v0.261.6
  (2026-11-11; the 2026-11-01 printing was on v0.255.1, and the ten releases between moved HALF_MANNY and the marathon
  underneath this ruling, so every digest below is re-printed on the current base, and the build's base is re-read again
  right before it). HALF_MANNY's digest moves from `147f083be4e04e34` to **`9f12fbf2112ab8bc`**; the seeded 5K
  `dd594b2ff2873fea` → `beb4c2abe83a6871`, the 10K `07a61b21dc381813` → `c9400c3ca61ff8c1`, the marathon
  `a01b89a7f5dc45ff` → `622f74ca6df2532d`; every other entry of
  `program-output.json` and all 864 lattice digests are unchanged. The cards, before and after, as the athlete reads them
  (the long run, the speed run the layout prints, the recovery runs; HALF_MANNY is Mario's live half, intermediate, so
  its one speed day prints the longer of the week's two sessions, D252):

#### half-manny (Mario, NRC half, crossfit)
Digest before 147f083be4e04e34 → after 9f12fbf2112ab8bc
| Wk | Before: long | speed | recovery | After: long | speed | recovery |
|---|---|---|---|---|---|---|
| 1 | 5K Run | 21:00 fartlek — 1:00 hard, 2:00 easy | 15 min, 25 min | 4 Mile Run | 21:00 fartlek — 1:00 hard, 2:00 easy | 25 min, 30 min |
| 2 | 4 Mile Run | 5K reps with a Mile-pace kicker — 15:00 of work, 10 efforts | 15 min, 35 min | 5 Mile Run | 20:00 tempo | 25 min, 30 min |
| 3 | 5 Mile Run | 3 × 7:00 at 5K Pace — 21:00 of work | 15 min, 30 min | 6 Mile Run | 10 × 2:00 at 5K Pace — 20:00 of work | 30 min, 35 min |
| 4 | 10K Run | 25:00 tempo | 15 min, 40 min | 7 Mile Run | 25:00 tempo | 30 min, 35 min |
| 5 | 10K Run | 23:00 progression tempo — Marathon Pace to 10K Pace | 15 min, 30 min | 5 Mile Run | Four blocks, each shifting straight into Mile Pace — 14:00 of work | 25 min, 30 min |
| 6 | 8 Mile Run | 20 × 0:30 at Mile Pace — 10:00 of work | 15 min, 45 min | 8 Mile Run | 5 × 5:00 at 10K Pace — 25:00 of work | 30 min, 40 min |
| 7 | 15K Run | Power pyramid — 22:00 of work, Mile to 10K and back | 15 min, 31 min | 9 Mile Run | Out strong, back fast — 23:00 tempo | 35 min, 40 min |
| 8 | 10 Mile Run | 10 × 2:00 at 5K Pace — 20:00 of work | 15 min, 35 min | 10 Mile Run | 8K tempo, bookended by 2K easy | 35 min, 45 min |
| 9 | 10 Mile Run | 8K tempo, bookended by 2K easy | 15 min, 35 min | 7 Mile Run | 21:00 fartlek — 2:00 hard, 1:00 easy | 30 min, 35 min |
| 10 | 13.1K Dress Rehearsal | 5K reps around a 10:00 tempo — 22:00 of work | 15 min, 45 min | 11 Mile Run | 3 rounds of 10K → 5K → Mile — 42:00 of work | 40 min, 45 min |
| 11 | 20K Run | 5 × 5:00 at 10K Pace — 25:00 of work | 15 min, 45 min | 12 Mile Run | Pyramid from 10K to Best and back — 18:00 of work, 8 efforts | 40 min, 50 min |
| 12 | One Hour Run | 3 rounds of 10K → 5K → Mile — 42:00 of work | 15 min, 60 min | 9 Mile Dress Rehearsal | 15:00 progression tempo — Recovery Pace down to Best | 30 min, 40 min |
| 13 | 7 Mile Run | 3 rounds of a 5K rep and four Mile-pace bursts — 15:00 of work | 15 min, 5K | 7 Mile Run | 3 rounds of a 5K rep and three Mile-pace bursts — 11:15 of work | 30 min, 3 Mile |
| 14 | 13.1 miles. Half Marathon race day (RACE DAY) | Race-week sharpener — 11:00 of work around 5:00 at race pace | 25 min, 2 Mile | 13.1 miles. Half Marathon race day (RACE DAY) | Race-week sharpener — 11:00 of work around 5:00 at race pace | 20 min, 2 Mile |

#### 5k race, commercial, strength, beginner
Digest before dd594b2ff2873fea → after beb4c2abe83a6871
| Wk | Before: long | speed | recovery | After: long | speed | recovery |
|---|---|---|---|---|---|---|
| 1 | One Mile Run | Mixed-pace ladder down to Best — 10:00 of work, 10 efforts | 5 min, 7 min | 1.5 Mile Run | 8 × 1:00 at 5K Pace — 8:00 of work | 10 min, 12 min |
| 2 | 15 Minute Run | Descending Mile reps with 10K floats — 8:00 of work, 9 efforts | 10 min, 12 min | 2 Mile Run | 15:00 fartlek — 1:00 hard, 1:00 easy | 12 min, 15 min |
| 3 | Easy Run | 15:00 fartlek — 1:00 hard, 1:00 easy | 2 Mile, 20 min | 2.5 Mile Run | 3 rounds of 5K, Mile and two Best bursts — 10:30 of work | 15 min, 20 min |
| 4 | 30 Minute Run | 3 rounds of 5K, Mile and two Best bursts — 10:30 of work | 25 min, 1 Mile | 2 Mile Run | 20:00 tempo | 15 min, 15 min |
| 5 | 33 Minute Run | Out strong, back fast — 23:00 tempo | 25 min, 25 min | 3 Mile Run | 5 × 4:00 at 5K Pace — 20:00 of work | 20 min, 20 min |
| 6 | 4 Mile Run | 25:00 tempo | 30 min, 31 min | 3.5 Mile Run | 25:00 tempo | 20 min, 25 min |
| 7 | 5K Run | 10K bookends around 5K and Mile reps — 15:30 of work, 8 efforts | 35 min, 25 min | 3 Mile Run | 5K bursts around a 3:00 10K rep — 8:00 of work, 11 efforts | 20 min, 15 min |
| 8 | 3.1 miles. 5K race day (RACE DAY) | 15:00 progression tempo — Recovery Pace down to Best | 25 min, 1K | 3.1 miles. 5K race day (RACE DAY) | Mile to 10K, then 7:00 easy — 9:00 of work | 15 min, 1 Mile |

#### 10k race, home basic, hypertrophy, advanced
Digest before 07a61b21dc381813 → after c9400c3ca61ff8c1
| Wk | Before: long | speed | recovery | After: long | speed | recovery |
|---|---|---|---|---|---|---|
| 1 | 5K Run | 8 × 1:00 at 5K Pace — 8:00 of work + Mixed-pace ladder down to Best — 10:00 of work, 10 efforts | 25 min | 4 Mile Run | 21:00 fartlek — 1:00 hard, 2:00 easy + Mixed-pace ladder down to Best — 10:00 of work, 10 efforts | 25 min |
| 2 | 5K Run | 10 × 2:00 at 5K Pace — 20:00 of work + Mile to 10K, then 7:00 easy — 9:00 of work | 25 min | 5 Mile Run | Mixed-pace ladder — 9:00 of work, 5 efforts + 20:00 tempo | 30 min |
| 3 | 4 Mile Run | Descending ladder 10K → 5K → Mile → Best — 15:30 of work, 7 efforts + Fartlek, recovery equals the effort — 9:15 of work, 14 efforts | 35 min | 6 Mile Run | 5 × 5:00 at 10K Pace — 25:00 of work + 5K reps with a Mile-pace kicker — 15:00 of work, 10 efforts | 30 min |
| 4 | 5 Mile Run | 25:00 tempo + 5K reps around a 10:00 tempo — 22:00 of work | 40 min | 4.5 Mile Run | Hill workout — 3 rounds of 10K, 5K and Mile efforts + Out strong, back fast — 23:00 tempo | 25 min |
| 5 | 10K Run | Out strong, back fast — 23:00 tempo + 3 rounds of 5K, Mile and two Best bursts — 10:30 of work | 40 min | 7 Mile Run | 5K reps around a 10:00 tempo — 22:00 of work + Descending ladder 10K → 5K → Mile → Best — 15:30 of work, 7 efforts | 35 min |
| 6 | 7 Mile Run | Hill workout — 3 rounds of 10K, 5K and Mile efforts + 20:00 tempo | 50 min | 8 Mile Run | 8K tempo, bookended by 2K easy + 3 rounds of a 5K rep and four Mile-pace bursts — 15:00 of work | 35 min |
| 7 | 10K Run | 3 × 7:00 at 5K Pace — 21:00 of work + 10K bookends around 5K and Mile reps — 15:30 of work, 8 efforts | 45 min | 6 Mile Run | 10K bookends around 5K and Mile reps — 15:30 of work, 8 efforts + 20 × 0:30 at Mile Pace — 10:00 of work | 30 min |
| 8 | 6.2 miles. 10K race day (RACE DAY) | 15:00 progression tempo — Recovery Pace down to Best | 25 min, 1 Mile | 6.2 miles. 10K race day (RACE DAY) | 15:00 progression tempo — Recovery Pace down to Best | 25 min, 1 Mile |

#### marathon, crossfit, athletic support, 36-45
Digest before a01b89a7f5dc45ff → after 622f74ca6df2532d
| Wk | Before: long | speed | recovery | After: long | speed | recovery |
|---|---|---|---|---|---|---|
| 1 | 5 Mile Run | 8 × 1:00 at 5K Pace — 8:00 of work | 10 min, 2 Mile | 6 Mile Run | 15:00 fartlek — 1:00 hard, 1:00 easy | 25 min, 30 min |
| 2 | 10K Run | Mixed-pace ladder down to Best — 10:00 of work, 10 efforts | 12 min, 5K | 7 Mile Run | 8 × 1:00 at 5K Pace — 8:00 of work | 30 min, 30 min |
| 3 | 7 Mile Run | 21:00 fartlek — 1:00 hard, 2:00 easy | 5K, 25 min | 8 Mile Run | 20:00 tempo | 30 min, 35 min |
| 4 | 10K Run | Hill workout — 5 rounds of 10K effort into Best effort | 30 min, 35 min | 6 Mile Run | Hill workout — 5 rounds of 10K effort into Best effort | 25 min, 30 min |
| 5 | 8 Mile Run | 5K reps around a 10:00 tempo — 22:00 of work | 40 min, 45 min | 9 Mile Run | Mixed-pace ladder down to Best — 10:00 of work, 10 efforts | 30 min, 40 min |
| 6 | 10 Mile Run | 3 rounds of a 5K rep and four Mile-pace bursts — 15:00 of work | 35 min, 45 min | 10 Mile Run | 25:00 tempo | 35 min, 40 min |
| 7 | 15K Run | 20:00 tempo | 35 min, 48 min | 12 Mile Run | 5 × 5:00 at 10K Pace — 25:00 of work | 35 min, 45 min |
| 8 | 20K Run | 3 × 7:00 at 5K Pace — 21:00 of work | 35 min, 60 min | 8 Mile Run | 21:00 fartlek — 1:00 hard, 2:00 easy | 30 min, 35 min |
| 9 | Half Marathon Run | 25:00 tempo | 45 min, 33 min | 13 Mile Run | 5K reps around a 10:00 tempo — 22:00 of work | 40 min, 45 min |
| 10 | Two Hour Run | 5 × 5:00 at 10K Pace — 25:00 of work | 50 min, 60 min | 14 Mile Run | 8K tempo, bookended by 2K easy | 40 min, 50 min |
| 11 | 14–16 Mile Run | Out strong, back fast — 23:00 tempo | 40 min, 35 min | 16 Mile Run | 3 × 7:00 at 5K Pace — 21:00 of work | 45 min, 50 min |
| 12 | 16–18 Mile Run | Hill workout — 3 rounds of 10K, 5K and Mile efforts | 60 min, 30 min | 10 Mile Run | Hill workout — 3 rounds of 10K, 5K and Mile efforts | 35 min, 40 min |
| 13 | 90 Minute Run | 3 rounds of 10K → 5K → Mile — 42:00 of work | 65 min, 31 min | 17 Mile Run | 23:00 progression tempo — Marathon Pace to 10K Pace | 45 min, 55 min |
| 14 | 18–22 Mile Run | 21:00 fartlek — 2:00 hard, 1:00 easy | 75 min, 30 min | 18 Mile Run | Out strong, back fast — 23:00 tempo | 45 min, 60 min |
| 15 | 15–16 Mile Run | Power pyramid — 22:00 of work, Mile to 10K and back | 45 min, 45 min | 20 Mile Run | Power pyramid — 22:00 of work, Mile to 10K and back | 45 min, 60 min |
| 16 | 12–14 Mile Run | 8K tempo, bookended by 2K easy | 80 min, 30 min | 14 Mile Run | 21:00 fartlek — 2:00 hard, 1:00 easy | 40 min, 45 min |
| 17 | 10 Mile Run | Mile to 10K, then 7:00 easy — 9:00 of work | 4 Mile, 60 min | 10 Mile Run | Mile to 10K, then 7:00 easy — 9:00 of work | 35 min, 4 Mile |
| 18 | 26.2 miles. Marathon race day (RACE DAY) | 15:00 progression tempo — Recovery Pace down to Best | 25 min, 1 Mile | 26.2 miles. Marathon race day (RACE DAY) | Mixed-pace ladder — 9:00 of work, 5 efforts | 3 Mile, 1 Mile |

- **Blast radius (tests):** 13 files and 44 tests of the 1,424 in `tests/unit` and `tests/integration` went red on the
  source-surgery page of 2026-11-01 (75 files, all green on v0.255.1's page; re-measured on the candidate at build time,
  the suite having grown since), every one for a reason this ruling names:
  `logging.test.ts` 17 (its hosts are HALF_MANNY's week 1: the 3.1 mile long run, the 25 minute recovery run, now 4
  miles and 25 and 30 minutes), `run-week-layout.test.ts` 12 (the half table's strings under D243, D244, D251, D252),
  `run-names.test.ts` 4 (the rows the D269 names sit on), `sport-swap.test.ts` 2 (W1 SAT 3.1 mi strip),
  `program-output.test.ts` 1 (the four race digests), `pop-ups.test.ts` 1 (HALF_MANNY's day census), `mile-anchor.test.ts`
  1 (a beginner half's week 1 and 2 labels), `clock-format.test.ts` 1 (the half at an 8:00 mile), and one HALF_MANNY
  digest each in `session-budget`, `runner-armor-circuit`, `compound-tier`, `core-trunk` and `deload`. The sweeps are
  classified at build time; the lattice holds no race goal.
- **Tests to hold:**
  1. `tests/integration/race-plans.test.ts` (new): each plan's long-run sequence equals the table above, typed by hand
     (5K 1.5, 2, 2.5, 2, 3, 3.5, 3, 3.1; 10K 4, 5, 6, 4.5, 7, 8, 6, 6.2; half 4, 5, 6, 7, 5, 8, 9, 10, 7, 11, 12, 9, 7,
     13.1; marathon 6, 7, 8, 6, 9, 10, 12, 8, 13, 14, 16, 10, 17, 18, 20, 14, 10, 26.2); every cutback-flagged week is
     shorter than the week before and every flagged week is the one named here; the peak is the plan's longest run and
     sits three rows before the race row, which is last; no row is minute-based; every speed slot's headline is one of
     the 39 library headlines, typed in the test, and the four week-1 sessions and the four race-week sessions are
     distinct across plans; HALF_MANNY prints, week by week, the one speed session named in the After column above (14
     hand values) and its digest is `9f12fbf2112ab8bc`; the 5K beginner prints 8 × 1:00, the 15:00 fartlek, the 3 rounds
     of 5K, Mile and Best, the 20:00 tempo, the 5 × 4:00, the 25:00 tempo, the 5K bursts, then the 9:00 sharpener.
  2. `tests/integration/run-names.test.ts`: the HEADLINES, LABELS and ON_THE_CARD oracles re-typed from the tables above
     (the D269 names hold; the rows they sit on moved); the GONE list unchanged.
  3. `tests/integration/run-week-layout.test.ts`: the D243, D244, D251 and D252 oracles re-typed from the half table
     (week 1 fartlek, week 2 tempo, week 3 the 10 × 2:00, week 12 the progression tempo on a tie, every advanced week
     both sessions in their slots); the rules themselves do not move.
  4. `tests/snapshots/program-output.json`: the four race entries regenerated to the digests above, the lattice file
     byte-identical.
  5. Every other file the blast radius names: its HALF_MANNY-hosted oracles re-typed to the new week-1 doses (a 4 mile
     long run, 25 and 30 minute recovery runs, the 21:00 fartlek), with no change to what it proves.
- **Recommendation:** ship it as the next MINOR (a ruling that changes what a program prescribes; Mario picks). Order of
  concurrence: 5K and 10K, then the marathon, then the half last, since it is Mario's live program. **Counter:** the
  cost is the suite, not the athlete: 13 test files and 44 tests ride on the old rows or on HALF_MANNY's week 1, and
  every one is re-typed in the same release; the alternative, deriving three plans now and the half after Mario's December race, keeps
  the source's half in the engine for another month and ships the tables in two releases.
- **Released:** not yet.
