# P-BARERX — a bare count inside a round block prints its unit (coach, provisional, unbuilt)

Artifact measured: `/Users/CanasBangin/Desktop/TheBig6V2/index.html` ia-version 207 (working tree). Scripts: `tests/measure/v220_bare_rx.js` (measure), `<scratchpad>/p_barerx_render.js`, `<scratchpad>/p_barerx_prehab.js` (coach, this session).

## Finding (printed this session)
HALF_MANNY W3–W6 Tue, `Leg circuit — runner armor`, `rounds:2`, writer `index.html:8953-8956` literal `'2×8'`:
```
[Leg circuit — runner armor] header: 2 Rounds — no rest between exercises · 90s rest between rounds
  Dumbbell goblet side lunge | raw="2×8–12 each @ RPE 7" | shown="8–12 each @ RPE 7"
  Wall sit                   | raw="2×25 sec"            | shown="25 sec"
  Kettlebell swing           | raw="2×8"                 | shown="8"
```
First superset card per movement (raw → shown): Ball slams 2×10→"10" (HALF_MANNY W1 Thu Pull superset B); Broad jumps 2×10→"10" (W3 Thu); Burpees 2×10→"10" (W7 Thu); Jump squats 2×10→"10" (W11 Thu); High knees 2×15→"15" and Skater bounds 2×10→"10" (bodyweight tier W1 Sat Explosive finisher); Mountain climbers 2×10→"10" (bodyweight W9 Thu Pull superset B); Reverse snow angels 2×8→"8" (beginner bodyweight W1 Thu Pull superset A); Wall slides 3×12→"12" and Prone Y-T-W raises 3×12→"12" (hypertrophy beginner bodyweight W1 Mon Delts).
Strip behaviour: `"3×8–10"`→`"8–10"` is the only other wordless remainder the strip can produce; 0 of 1,866 superset sections on a 37-build lattice carry it. Every other grammar keeps words after the strip (`"8 — RPE 7 (…)"`, `"10 — fast and crisp, 60s rest"`, `"15 each"`, `"25 sec"`, `"RPE 7 (leave 3 or more in reserve)"`, `"15 reps"`).

## Mario's calls

**1. The word is "reps". No side word. No time word.**
Source, not invented: the preset library `index.html:10851-10862` already writes superset members as `'12 reps'`, `'8 reps'`, `'20 reps'`, `'max reps'`, `'10 each'`, `'30 sec'`. That is the house grammar for a member inside a round block, and the strip already leaves it readable. Climbers, high knees and skater bounds do NOT get "each side": no writer appends `' each'` to them (`' each'` is written only by `_isOneArmPress`, `_isUnilateralRow`, the carry table `_CARRY_PER_SIDE` and the lunge literal `'2×10 each'`); the preset library itself writes `Mountain climbers 20 reps`; and `parseRx` keys `perSide` on `/each/`, so a card saying "10 per side" over a log row counting 10 would be the D39 contradiction in a new coat. Not a time: `_BW_KEEP_FIXED` holds these at a fixed count precisely because the count is the dose; timed members already carry `sec`. Prone Y-T-W at "12 reps" is a plain count in the data's intent; if the athlete reads it as 12 of the sequence that is the pre-existing meaning, unchanged here.
Recommendation: "N reps". Counter: 10 mountain climbers total is a light dose; that is a dose question for the cond writers, not a unit question, and it is not reopened here.

**2. Display, not data.**
(a) D39-v stands: `item.detail` untouched, `parseRx` five callers, gate G11a/G11d protect it. (b) Decisive on coaching grounds: the "8" Mario sees is on W3–W6 of a live program. Every week is in the persisted `ia_programs` grid and any trained day is frozen in `ia_hist_`; a data fix reaches neither, so only the display fixes the card he is looking at. (c) Writers keep their anchors: `tests/sabotage/v192_d42c_shoulder_side.json` and `tests/sabotage/v201.json` anchor on `vsets(3)+'×8'` writer lines and would go NOT-APPLIED under a writer rewrite. (d) The 17 templates already say "15 reps"; a display rule makes the engine converge on the template grammar without editing either side.
Recommendation: display. Counter: a data fix would make the swap sheet and add sheet print "reps" too; but those readers do not strip, so they already print `2×8` with its own structure, and nothing is bare there (measure: 0 bare in 3.26M add lines, 0 in 5.74M swap lines).

**3. Unit only. No effort words.**
Effort in a round block is carried by the header ("2 Rounds — no rest between exercises · 90s rest between rounds") and by the members that have a load ("8–12 each @ RPE 7" sits on the same card). The bare members are fixed-count by design. "fast and crisp, 60s rest" is the power block's grammar and its rest clause contradicts the header's "no rest between exercises". A per-movement cue ("hips snap") is copy without a table; it would be an invented constant.
Recommendation: "8 reps" and nothing after it. Counter: Mario said "or something"; if he wants the coach voice on these rows it is a movement cue table under its own ruling, not a unit rule.

## The rule
In `buildExItem`, on the `_dispDetail` line (`index.html:12321`), after `_stripLeadingSets` and only when `_ssRounds!=null`: if the remainder matches `/^\d+(\s*[–-]\s*\d+)?$/` append `' reps'`. `_stripLeadingSets` itself does not change (it is in g190's SEAM list and `refStrip` mirrors it). Range branch is defensive and unprinted on the lattice: pin it with a synthetic section in the gate, the way G11 pins `SS3`.

Deliberately NOT changed: `item.detail`; `parseRx`; `_setLeadingSets`; every writer (8765, 8865, 8873, 8888, 8908, 9163, 8953); the preset library; `rounds:null` blocks (they never reach the strip, `SSNULL` rows render `"3×10"` intact); non-superset cards (`2×15 each`, `3×25 sec`); the log row "SETS 2 × 8 as prescribed"; the swing's dose in a hinge slot (§12 V190 watch item 4, still open).

## After (expected)
```
Leg circuit — runner armor · 2 Rounds — no rest between exercises · 90s rest between rounds
  Dumbbell goblet side lunge   8–12 each @ RPE 7   (unchanged)
  Wall sit                     25 sec              (unchanged)
  Kettlebell swing             8 reps              (was: 8)
Pull superset B   Ball slams 10 reps · Broad jumps 10 reps · Burpees 10 reps · Jump squats 10 reps
Explosive finisher (bw)   High knees 15 reps · Skater bounds 10 reps
Pull superset A/B (bw)    Mountain climbers 10 reps · Reverse snow angels 8 reps
Delts (bw)                Wall slides 12 reps · Prone Y-T-W raises 12 reps
```

## Blast radius (coaching terms)
Every superset member whose detail is `N×M` with no trailing words, on every goal, focus and calendar: 46,418 / 1,184,488 rendered engine cards (3.92%) plus 70,712 / 2,682,979 swap-rendered members. Sections that draw them: Pull superset A/B, Conditioning, Light finisher, Explosive finisher, Accessory and Delts on the bodyweight tier, Leg circuit on prevention. HALF_MANNY: W3–W6 Tue swing; W1/W3/W7/W11 Thu Pull superset B; W5/W6 Thu Pull superset B swing. **Data diff is zero by construction**: `progDigest` hashes `prog` data and the render never writes it, so `MANNY_DIGEST_BY_VERSION[<next>]` is the [207] row, ruled UNMOVED, and every changed card is a rendered string.
Gates: `tests/gates/g190_rounds.js` G11b (`details === refStrip(detail)`) trips on the new artifact and has no version predicate (grep: none). Expected and correct; it needs an era predicate keyed on `ia-version <= 207` (standing rules 2/4), plus a new family asserting bare-remainder → `+ ' reps'` against its own regex over `refStrip`, not over `_stripLeadingSets`. `tests/sabotage/v190.json` anchors the exact `_dispDetail` line: re-anchor, `count==1`. `v192_d42c` and `v201` anchors untouched.

## Measure still needed before build
1. HALF_MANNY W5/W6 Thu Pull superset B swing, raw and shown (I printed Tue and the first hit per movement only).
2. Bare `N–N` range remainders on the full lattice (37 builds here read 0).
3. Swap-into-superset `Jump squats → Back squat "15"` becomes "15 reps" on a loaded lift with no RPE: pre-existing swap grammar gap, name it for §12, not this ruling.
4. Gatekeeper prints the rendered card before and after for each of the 11 names, since the digest cannot see this change.

Recommendation: ship display-only `' reps'` on a bare remainder at the `_dispDetail` line; unit only, no side word, no effort word.
Counter: the honest coach voice on these rows is a movement cue, and Mario's "or something" may be asking for that; it is a separate ruling with its own table.

## MARIO DECISION (2026-09-23)
- "8 reps", unit only, no effort cue. Mountain climbers / high knees / skater bounds read total reps, no "each side". Coach recommendation accepted.
- Measure phase 2 on V207 (v220_bare_rx.js --phase2): 46,429/386,768 superset cards go N -> "N reps", 0 ranges, 0 outside regex; 340,339 non-bare byte-identical; 0/798,100 non-superset cards change; data diff 0; parseRx 0/1,207,148; HALF_MANNY 0ac7da6b1691a8e1 unmoved. Trips: g190_rounds G11b (needs era predicate) and sabotage/v190.json M4 (re-anchor). No others.
- Ship slot: HOLD for more screenshots.

## RE-BASELINE ON V219 (2026-09-24, fresh coach, standing ruling 7) — VERDICT: STANDS
Measure (`tests/measure/v220_rebase_build1.out.txt`, `v220_rebase_bare_rx.js`) found two premises moved: the HALF_MANNY W5/W6 Tue Leg circuit is now Dumbbell Bulgarian split squat + Spanish squat hold (KB) + Kettlebell swing (ruling printed goblet side lunge + wall sit); counts 46,429/386,768 -> 38,782/373,696 superset cards (18-35, 4,321 builds); 0 ranges, 0 outside regex, 0 data diffs, 0/1,201,619 parseRx; 55+ 41,693/424,876, of which 11,459 JUMPS-regex names.
Coach: no word of the rule changes. It keys on the stripped remainder's shape (`/^\d+(\s*[–-]\s*\d+)?$/`, `_ssRounds!=null`, append ' reps'), not the movement. Count drop is population drift.
Record refresh (not rule change): writer `Leg circuit — runner armor` L9227; `_dispDetail` L12674, count 1; `MANNY_DIGEST_BY_VERSION[<next>]` = the [219] row, UNMOVED; g190 G11b era predicate keyed `ia-version <= 219` (was `<= 207`); `sabotage/v190.json` M4 re-anchors on L12674, count==1.
After-grid on HEAD (HALF_MANNY; header `2 Rounds — no rest between exercises · 90s rest between rounds`):
  W5/W6 Tue [Leg circuit — runner armor]  DB Bulgarian split squat 8–12 each @ RPE 7 (unchanged) · Spanish squat hold (KB) 25 sec (unchanged) · Kettlebell swing 8 reps (was: 8)
  W5/W6 Thu [Pull superset B]  Dumbbell row 8–12 each @ RPE 7 (unchanged) · Kettlebell swing 10 reps (was: 10)
  Whole program: 11 of 132 rounds-block members change (swing x6: W3–W6 Tue, W5/W6 Thu; Ball slams x2, Broad jumps, Burpees, Jump squats x1 each on Thu Pull superset B); 0 data cards move.
D172 ordering: immaterial. P-BARERX must NOT grow a bracket or jump-name clause. If D172 lands after, its 55+ removal hunks read `N reps` rows; if first, the 55+ count drops, 18-35 stays 38,782.
