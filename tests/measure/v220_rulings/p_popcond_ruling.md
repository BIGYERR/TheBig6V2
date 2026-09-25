# P-POPCOND (2026-09-23) — The pop-up judges the day the athlete trained, not the minute he tapped

Provisional code; real D-code assigned at builder dispatch. Coach ruling on measure's `tests/measure/v220_popup_conditions.out.txt`. Nothing here touches `buildProgram`.

## 0. Premise checks (measured this session)

- Working tree `ia-version` 207; pop block byte-identical V50 → V206 → working tree (measure). Working-tree lines: `POP_POOLS` :17174, `popContext` :17258, `popEligible` :17263, `popPick` :17270, `popFire` :17284, `dayDateFor` :17339, `fireWorkoutPopup` :17385, `fireCompletionPopup` :17420, `maybeShowReminder` :17435. Builder anchors on text, never on the number.
- The record (a0effa9 comment, handoff :322): `weekend` = Sat/Sun, `morning` = before 9am, evaluated at fire time. Nothing anywhere records Saturday-only for any line.
- **Mario's memory is plausible, not proven, and the tag was never Saturday-only.** HALF_MANNY trains sat ×14, sun ×1 (Race Day, Dec 6, fires season). But `popContext` reads the clock at tap time, so a Saturday session marked on Sunday draws `weekend:true` on the current code (measure, `v220_popcond_verify.js`). "Every weekend fire was a Saturday" is therefore NOT established on V206; it becomes true on his program only under §2a, where `weekend` reads the trained day. §1a's argument leans on §2a, not on history.
- **The reminder pool was live at V50 and still at V132.** `iron_asylum_v4RUNNINGV50.html`:5611 `popFire('reminder',{sub, actions, triple})` passes no `msg`, so `popPick('reminder')` rotated the five lines; V132 is the same (measure). The fixed `_remMsg` first appears at 43d4b4a, ia-version 142; git holds no V133 to V141 file, so the exact kill version is unknown. Handoff :1404 records only the V141 re-entry copy; no line rules on the rotating pool. Killed unruled, between V133 and V142. "Functioning as described when we made them" = the pool rotates.
- Pool constraint stands (`ia_pop_idx_`, `ia_pop_dismiss_` store indices): every change below is an in-place tag, no delete, insert or reorder. `ia_pop_idx_.reminder` has never been written; wiring it is an additive key.
- Day-type census (harness, `buildProgram` on HALF_MANNY and seven cfg variants derived from it), training days as lift-only / run+lift / run+mobility-only / run-only:
  HALF_MANNY 70: 14 / 45 / 9 / 2 · marathon 90: 18 / 54 / 16 / 2 · 10K 40: 8 / 27 / 3 / 2 · 5K 40: 8 / 30 / 0 / 2 · mile 30: 12 / 18 / 0 / 0 · pace 30: 12 / 18 / 0 / 0 · base 30: 6 / 24 / 0 / 0 · lift-only 30: 30 / 0 / 0 / 0.
  The two run-only days on every race program are the shakeout and Race Day; Race Day is the final scheduled day and fires SEASON. **The workout pool sees exactly one run-only day per race program and zero on test goals.**

## 1. Mario's calls (his voice, his copy)

### 1a. The hungover lines: [15] "Showed up hungover, didn't die" and [1] "Hangover said stay down"

**Recommendation: tag [15] `weekend`, the same tag [1] already carries. No Saturday-only predicate.** A hangover lives on both weekend mornings and Sunday's is the classic one. The record's only vocabulary is `weekend`; a third `when` value for two lines is a new mechanism for a distinction the record never drew. And on his own program the distinction is empty: under §2a the workout-pool weekend fire is Saturday 14/14 regardless.
Before: [15] fires 168/168 cells, any weekday at 20:30 included. After: [15] and [1] fire only when the trained day is a Saturday or Sunday.
**Counter:** he wrote the line and remembers Saturday; `when:'saturday'` is one branch in `popEligible` and would apply to both hangover lines together, so the pair stays consistent either way.

### 1b. The dead reminder pool (five lines, dead since V141)

**Recommendation: wire it, on the short-gap branch only.** `_gap < 7`: `msg` = `popPick('reminder')`; `sub` = day identity plus the doctrine sentence, one line: `Monday, Wk 1 · Strength Support. The week ahead stays as written.` `_gap >= 7` keeps the fixed re-entry message whole: "first sessions back at reduced effort" is an instruction the pool cannot carry, and a week off earns guidance, not a nudge (V141). Coexistence: every pool line already says "mark it or own the skip" in Mario's voice, so the line is the voice and the sub is the doctrine; nothing is lost. The five lines' emoji follow P-EMOJI §5, which is still Mario's open call; P-EMOJI §2's :17095 dash edit stays.
**Counter:** V141 made the reminder doctrine copy on purpose and V181 D1 threw out the guilt button; "you ghosted a session" is guilt aimed at the athlete who missed, not celebration of one who showed. Leave the pool dead, record V141 as the ruling that killed it, and delete the five lines (no stored index reads them; P-EMOJI §2/§5 drop their reminder-pool rows).

### 1c. Session-type tags

**Recommendation: three lines.** [8] "Cardio's done… brunch" → `weekend` AND `type:'cardio'`. [25] "looked dead ugly on that last set" → `type:'lift'`. [26] "ten minutes lifting" → `type:'lift'`. **Not tagged:** [4] flexing (vanity, not modality; a runner flexes too). **Not a gap:** [12] "sit on it later", [18] "find it later", [19] "take a shot later": "later" is relative to now and true at any hour.
Lenses, both existing, no new constant: `cardio` = `!!day.cardio` (the `dayCode` :11352 lens). `lift` = `dayCode`'s `liftSections` test minus sections whose label matches `/mobility|taper/i`, which is D18's own vocabulary (`d18LongRunDayPass` :10646-10658 filters on `/taper/i`, and its tier-A block is labelled `Post-run mobility`). A Post-Run Mobility long-run day is not "lifting"; a race-week Primer is.
The day is read from `activeProg.weeks[week][dayKey]`, exactly as `maybeShowReminder` :17449 already does.

Eligible workout-pool size (27 lines; 6 tagged after this ruling: [1] [3] [8] [15] [25] [26]; 21 untagged):

| Day type | weekday ≥9h | weekday <9h | weekend ≥9h | weekend <9h |
|---|---|---|---|---|
| Before (any day type) | 24 | 25 | 26 | 27 |
| lift-only | 23 | 24 | 25 | 26 |
| run + lift (incl. Primer) | 23 | 24 | 26 | 27 |
| run + mobility-only | 21 | 22 | 24 | 25 |
| run-only (shakeout) | 21 | 22 | 24 | 25 |

Floor 21, and `popPick` excludes only the last index, so 20 choices at the thinnest cell. The thin cells hit 9/70 HALF_MANNY days (mobility-only long runs) and the one shakeout. Not thin.
**Counter:** leave [25] and [26] untagged; "sets" is gym slang that survives an interval session as a joke, and the mobility exclusion adds a label matcher for 9/70 days.

## 2. Session's calls (predicate semantics and record hygiene)

### 2a. `weekend` reads the trained day; `morning` requires the trained day to be today

`weekend` = `dayDateFor(week,dayKey).getDay()` is 0 or 6. `morning` = wall-clock hour < 9 AND the trained day is today. Marking a past day never draws a morning line: the completion record carries the tap time, not the hour he trained, and the pop-up asserts only what the record knows (the V142 rule, popup promises only what the engine enforces, applied to copy). `popContext(week,dayKey)` and `popPick(tier,week,dayKey)` are threaded from `fireCompletionPopup(week,dayKey)` through `fireWorkoutPopup`; streak and season pools carry no tags and need nothing; the Wildcard passes its own `msg`.
Before: marking Friday's Recovery Run on Saturday morning could draw the brunch line; marking Saturday's Long Run on Monday could not draw the hangover line. After: the reverse, in both cases. Measure's 0/27 window changes between "today" and "yesterday" becomes a real difference only on past-day marks (`resolveReminder`, and a browsed past day in `handleDayStatus`).
**Counter:** tap-time context is also real; "half the city's still asleep" at a 7am tap reads fine about the tap, and today the difference is invisible.

### 2b. Streak re-fire on re-completion: leave it

The streak count strictly grows with each new completion (measured code: pending is transparent, so resolving an old hole raises n, never repeats it). The same n recurs only through the V181 D2 toggle (unmark, then re-mark), and re-showing the milestone after the athlete corrects a fat thumb is the right receipt of the restored state. The season latch is one-shot because the block ends once; a streak does not. Not measured this session: whether a future day can be marked Done from a browsed week; if it can, `computeStreak` (cut at today) returns the same n and the milestone can show twice. Flag for measure, no latch.
**Counter:** a `ia_streak_shown_` latch keyed by n mirrors the season latch and closes the future-day edge for one key.

### 2c. The reminder reaching six days back: fine; the record is wrong, not the code

`maybeShowReminder` asks once per calendar day about the most recent unresolved past training day not yet asked, and marks it asked whether or not the athlete answers. Reaching six days back therefore costs five prior dismissals without resolving; each hole is asked about exactly once, ever; the athlete is never nagged twice about one day. `_gap` measures trailing unresolved days, so an athlete back in the saddle asking about last Friday gets "This one got away from you", the correct copy. Handoff :322 "day-after reminder" is corrected to what the code does.
**Counter:** cap the walk at seven days and let the ≥7 gap message own anything older; a hole older than a week is stale and Skip is the only honest answer.

## 3. What deliberately does NOT change

Pool order and count (27/5/5/9), `POP_DISMISS`, the rotation (last-index exclusion), `POP_CFG`, the streak milestones 3/7/14/30/+30, the season latch, the Wildcard dispatcher, `ia_remind_last_` once-per-day, the ≥7 re-entry message, the hungover lines' hour (no morning gate; the record never had one), every untagged line.

## 4. Blast radius (coaching terms)

- Engine: none. Expected `HALF_MANNY` digest `0ac7da6b1691a8e1` (V207 working tree, printed this session) unmoved; no era-table row. Gatekeeper asserts.
- Every completion pop-up on every program: eligibility now depends on the trained day's weekday, whether it is today, and the day's cardio/lift shape. Visible difference on: weekend-tagged lines when marking a past day; the brunch line on lift-only Saturdays (HALF_MANNY has none; a Sunday-training athlete's lift-only Sunday does); [25]/[26] on the shakeout and on mobility-only long runs (HALF_MANNY 9+1 of 70, marathon 16+1 of 90, 10K 3+1 of 40, 5K 0+1 of 40, test goals 0).
- Reminder tier, short-gap branch, every program: rotating voice line plus the doctrine in the sub. Storage: `ia_pop_idx_.reminder` starts being written (additive).
- Storage keys, pool indices, dismiss indices: unchanged.

## 5. Gate and sabotage (for gatekeeper)

Oracle is a hand table: for each of the 27 lines, expected eligibility across {trained-day dow} × {today or past} × {hour} × {lift-only, run+lift, run+mobility, run-only}, built from the tag table in §1c and the lenses named there, never from `popEligible`'s output. Sabotage: (1) drop `type` from [8], must trip on lift-only Saturday; (2) read `new Date().getDay()` instead of `dayDateFor`, must trip on a Monday mark of Saturday's long run; (3) let `morning` pass on a past day; (4) label matcher `/mobility|taper/i` removed, must trip on the tier-A long-run day; (5) reminder branch passes fixed `msg` under `_gap<7`, must trip. Run on V206 first: must FAIL there.

## 6. Decisions (Mario, 2026-09-23) and premise corrections

Measure (`tests/measure/v220_popcond_verify.js`) corrected two premises in §0; neither moves a ruling. Premise 1 changes a historical claim into a forward one (§1a now rests on §2a). Premise 2 changes an attribution (V142 artifact, kill between V133 and V142, unruled) and leaves the finding intact.

Mario's calls, decided:
1. [15] tagged `weekend`; no Saturday predicate. (§1a recommendation.)
2. Reminder pool wired on the `_gap<7` branch, doctrine sentence in the sub, ≥7 message whole. (§1b recommendation.)
3. Session tags [8] `weekend`+`cardio`, [25] `lift`, [26] `lift`. (§1c recommendation.)
4. P-EMOJI §5 goes to its recommendation: reminder and injury icons become `notebook` / `shield` / `warning`, the 25-edit variant. The five reminder-pool lines are now live copy, so their emoji are stripped under that ruling, not as dead text.

Session calls 2a, 2b, 2c stand as ruled.

Recommendation: ship 1a as `weekend`, 1b wired on the short-gap branch with the doctrine in the sub, 1c's three tags on the two existing lenses, 2a trained-day context, and leave 2b/2c as they are with the record corrected.
Counter: keep tap-time context and the reminder dead, and tag only [8], which is the smallest change that still closes the one line whose text names a session the athlete may not have done.

## RE-BASELINE ON V219 (2026-09-24, fresh coach, standing ruling 7) — VERDICT: STANDS WITH AMENDMENT (record only)
Measure (`tests/measure/v220_popcond_census.js`, `.out.txt`; 360 builds per artifact, HEAD vs V207): §0's "zero run-only days on test goals" is FALSE for DATED test goals on both V207 and HEAD (162/162 dated test programs; per goal 54 Test Day [season tier] + 48 Shakeout eves + 6 plain LSD [workout tier]). NEW on HEAD: run+mobility-only days on test/base goals (mile 60/864 undated, 86/2,436 dated; 1.5 mi 60/1,056, 86/3,012; pace 114/1,440, 276/4,164; base 24/576; 0 on V207, suspected V216 D156). Floor 21 eligible lines holds in every class; 0 unplaceable days.
Coach: every tag, lens, predicate and Mario decision unchanged. The floor is a property of the tag table, not of day frequency.
Q2: [8] on a test-eve Saturday is correct (receipt, not prescription; HALF_MANNY race-eve Saturday already ruled). [25]/[26] excluded on Shakeout and D156 Post-Run Mobility days is correct (the `/mobility|taper/i` lens reaches D156's "Post-run mobility" label by construction). Hangover [1]/[15] and untagged [19] on a test eve: same as the race eve (§1c "not a gap"); no tag here; coach recommends against queuing an eve guard.
§0 last sentence becomes: "The workout pool sees one run-only day per dated race program, two per undated 5K/10K, and one Shakeout eve per dated test program; undated test goals see none. Every time trial and Race Day fires season."
§4 bullet ("[25]/[26] on the shakeout...") is replaced by: "[8], [25] and [26] now discriminate on every program that has a run-only or mobility-only training day. Race programs, HEAD = V207: HALF_MANNY 9 mobility-only long runs + 1 shakeout of 70; marathon 16+1 of 90; 10K 3+1 of 40 dated and 3+2 of 40 undated (Easy Run and Shakeout; the time trial fires season); 5K 0+1 dated, 0+2 undated. Race Day and every time-trial day fire the season pool and never see these tags. Test goals are not zero. Undated mile, 1.5 mi, pace and base carry D156 Post-Run Mobility long days (HEAD: mile 60/864, 1.5 mi 60/1,056, pace 114/1,440, base 24/576 days; 0 on V207, so this part of the radius belongs to V216, not to this build) and no run-only days. Dated test programs (162/162) carry a run-only Shakeout eve that fires the workout pool (48/54 per goal; the other 6/54 are sat+sun rest with a Monday test, whose last training day is Friday at three days out), a season-tier Test Day, and in 6/54 one further plain run-only LSD. A Monday test puts the eve on the previous week's Saturday, a weekend cell. Lift-only programs: unchanged, no cardio day, [8] never fires. Floor 21 eligible lines in every class, 0 unplaceable days in 360 HEAD builds; the corrected census moves frequency, not eligibility."
