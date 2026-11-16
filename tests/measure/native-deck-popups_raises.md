# The pop-ups in today's app: what raises each, and what it writes

Read-only measure, today's page in the VM harness, the clock and Math.random pinned, America/New_York.

## A. The ten standard histories (three weeks each, the walk of tests/support/stored-state.ts)

Pop-ups raised, 87 in all: `reminder via maybeShowReminder (its own words)` 27, `streak via fireCompletionPopup (a line from the pool)` 15, `workout via (direct) (its own words)` 10, `workout via fireCompletionPopup (a line from the pool)` 35.

## B. THE HALF MANNY, start to finish

Every training day marked done at 18:00 on its own date the way the deck marks it (snapshotDay, markDayComplete, fireCompletionPopup), except: every seventh training day is not opened (the reminder asks the next launch, answered Done and Skip in turn), and one whole week is not opened (the long gap).

Weeks 1 to 14, 63 training days, week 6 not opened. Pop-ups raised, 68: `reminder via maybeShowReminder (its own words)` 9, `streak via fireCompletionPopup (a line from the pool)` 10, `workout via fireCompletionPopup (a line from the pool)` 49.

The streak and season pop-ups, each as raised:

- streak: kicker "3-day streak 🔥", stats [Day Streak], line "Look at this consistency. Who replaced you with someone competent? 🔥"
- streak: kicker "7-day streak 🔥", stats [Day Streak], line "That's a real streak. Most people fold by now like wet cardboard. 🔥💀"
- streak: kicker "3-day streak 🔥", stats [Day Streak], line "Look at this consistency. Who replaced you with someone competent? 🔥"
- streak: kicker "7-day streak 🔥", stats [Day Streak], line "That's a real streak. Most people fold by now like wet cardboard. 🔥💀"
- streak: kicker "3-day streak 🔥", stats [Day Streak], line "Look at this consistency. Who replaced you with someone competent? 🔥"
- streak: kicker "7-day streak 🔥", stats [Day Streak], line "That's a real streak. Most people fold by now like wet cardboard. 🔥💀"
- streak: kicker "3-day streak 🔥", stats [Day Streak], line "Look at this consistency. Who replaced you with someone competent? 🔥"
- streak: kicker "7-day streak 🔥", stats [Day Streak], line "That's a real streak. Most people fold by now like wet cardboard. 🔥💀"
- streak: kicker "3-day streak 🔥", stats [Day Streak], line "Look at this consistency. Who replaced you with someone competent? 🔥"
- streak: kicker "7-day streak 🔥", stats [Day Streak], line "That's a real streak. Most people fold by now like wet cardboard. 🔥💀"

The reminders, each as raised and answered:

- week 2 mon: reminder "Unfinished business sitting on your calendar. Settle up." / "Saturday, Wk 1 · Full Body Support. The week ahead stays as written.", answered ✓ Done
- week 3 thu: reminder "Left a day hanging unmarked. Did you train or nah?" / "Tuesday, Wk 3 · Strength Support. The week ahead stays as written.", answered ✕ Skip
- week 4 sat: reminder "Unfinished business sitting on your calendar. Settle up." / "Friday, Wk 4 · Recovery Lift. The week ahead stays as written.", answered ✓ Done
- week 7 tue: reminder "Left a day hanging unmarked. Did you train or nah?" / "Monday, Wk 7 · Posterior Chain. The week ahead stays as written.", answered ✕ Skip
- week 8 fri: reminder "Unfinished business sitting on your calendar. Settle up." / "Thursday, Wk 8 · Leg Strength + Mobility. The week ahead stays as written.", answered ✓ Done
- week 10 mon: reminder "Left a day hanging unmarked. Did you train or nah?" / "Saturday, Wk 9 · Post-Run Mobility. The week ahead stays as written.", answered ✕ Skip
- week 11 thu: reminder "Unfinished business sitting on your calendar. Settle up." / "Tuesday, Wk 11 · Strength Support. The week ahead stays as written.", answered ✓ Done
- week 12 sat: reminder "Left a day hanging unmarked. Did you train or nah?" / "Friday, Wk 12 · Recovery Lift. The week ahead stays as written.", answered ✕ Skip
- week 14 tue: reminder "Unfinished business sitting on your calendar. Settle up." / "Monday, Wk 14 · Posterior Chain. The week ahead stays as written.", answered ✓ Done

Keys written while each pop-up function ran (the function chain, then each key family and how many writes):

- `fireCompletionPopup > popDismissText`: `ia_pop_dismiss_<id>` 54
- `fireCompletionPopup > popPick`: `ia_pop_idx_<id>` 59
- `maybeShowReminder`: `ia_remind_last_<id>` 9, `ia_reminded_<id>` 9
- `maybeShowReminder > popPick`: `ia_pop_idx_<id>` 9
- `resolveReminder`: `ia_comp_<id>` 9, `ia_hist_<id>` 9, `ia_reminded_<id>` 9

The store at the end holds these pop-up families: ia_pop_dismiss_<id>, ia_pop_idx_<id>, ia_remind_last_<id>, ia_reminded_<id>.

## C. The swap nudge

### THE HALF MANNY, its first week, nothing trained

Week 1, mon (the launch is in week 1): Barbell Romanian deadlift traded for Deadlift three times running, put back between picks. 1 nudge came due, on both apps.

- The count both stores hold, the nudge not answered: `{"to":"Deadlift","n":3,"offered":false}`.
- A fourth pick of the same pair, on a copy of the beta's store: countSwap gives back `{"to":"Deadlift","n":4,"offered":false}`, so the nudge is due again. A pick of another lift: `null` stored as `{"to":"Some other lift","n":1,"offered":false}`.
- Leave the plan alone, with core's markSwapNudged on a copy: keys changed ["ia_swapct_<id>"], the count now `{"to":"Deadlift","n":3,"offered":true}`.
- Make the change, today's page (acceptSwapNudge): keys changed ["ia_programs 82803 to 82858 bytes","ia_swapct_<id> 69 to 68 bytes"]. Toast: "Done. Deadlift is your hinge from here.".
  - In ia_programs: the stored grid is the same, byte for byte; cfg.exSwapPrefs `null` to `{"Barbell Romanian deadlift":"Deadlift"}`; every other cfg field the same.
  - ia_hist_ the same, ia_swaps_ the same, ia_edits_ the same.
  - The grid in hand: 5 days changed (0 of them marked, 0 in a week before the launch's): w1 thu, w2 mon, w2 thu, w11 mon, w12 mon.
- Make the change, core's own recordSwapPreference, markSwapNudged and refreshStoredProgram over the beta's SQLite store at the same instant: keys that differ from today's page []; the grid handed back is the page's, whole; failures reported {"overlay":0,"freeze":0,"rebuild":0}.

### half-manny (Mario, NRC half, crossfit), after the standard history (three weeks trained, an injury come and gone, travel, edits, two weeks away)

Week 6, mon (the launch is in week 6): Sumo deadlift traded for Barbell Romanian deadlift three times running, put back between picks. 1 nudge came due, on both apps.

- The count both stores hold, the nudge not answered: `{"to":"Barbell Romanian deadlift","n":3,"offered":false}`.
- A fourth pick of the same pair, on a copy of the beta's store: countSwap gives back `{"to":"Barbell Romanian deadlift","n":4,"offered":false}`, so the nudge is due again. A pick of another lift: `null` stored as `{"to":"Some other lift","n":1,"offered":false}`.
- Leave the plan alone, with core's markSwapNudged on a copy: keys changed ["ia_swapct_<id>"], the count now `{"to":"Barbell Romanian deadlift","n":3,"offered":true}`.
- Make the change, today's page (acceptSwapNudge): keys changed ["ia_programs 86874 to 86934 bytes","ia_swapct_<id> 150 to 149 bytes"]. Toast: "Done. Barbell Romanian deadlift is your hinge from here.".
  - In ia_programs: the stored grid is the same, byte for byte; cfg.exSwapPrefs `null` to `{"Sumo deadlift":"Barbell Romanian deadlift"}`; every other cfg field the same.
  - ia_hist_ the same, ia_swaps_ the same, ia_edits_ the same.
  - The grid in hand: 0 days changed (0 of them marked, 0 in a week before the launch's): .
- Make the change, core's own recordSwapPreference, markSwapNudged and refreshStoredProgram over the beta's SQLite store at the same instant: keys that differ from today's page ["ia_remind_last_<id>","ia_reminded_<id>"]; the grid handed back is the page's, whole; failures reported {"overlay":0,"freeze":0,"rebuild":0}.

### 1.5 mile test goal, commercial, balanced, after the standard history (three weeks trained, an injury come and gone, travel, edits, two weeks away)

Week 7, mon (the launch is in week 7): Deadlift traded for Barbell Romanian deadlift three times running, put back between picks. 1 nudge came due, on both apps.

- The count both stores hold, the nudge not answered: `{"to":"Barbell Romanian deadlift","n":3,"offered":false}`.
- A fourth pick of the same pair, on a copy of the beta's store: countSwap gives back `{"to":"Barbell Romanian deadlift","n":4,"offered":false}`, so the nudge is due again. A pick of another lift: `null` stored as `{"to":"Some other lift","n":1,"offered":false}`.
- Leave the plan alone, with core's markSwapNudged on a copy: keys changed ["ia_swapct_<id>"], the count now `{"to":"Barbell Romanian deadlift","n":3,"offered":true}`.
- Make the change, today's page (acceptSwapNudge): keys changed ["ia_programs 70018 to 70073 bytes","ia_swapct_<id> 147 to 146 bytes"]. Toast: "Done. Barbell Romanian deadlift is your hinge from here.".
  - In ia_programs: the stored grid is the same, byte for byte; cfg.exSwapPrefs `null` to `{"Deadlift":"Barbell Romanian deadlift"}`; every other cfg field the same.
  - ia_hist_ the same, ia_swaps_ the same, ia_edits_ the same.
  - The grid in hand: 1 days changed (0 of them marked, 0 in a week before the launch's): w8 mon.
- Make the change, core's own recordSwapPreference, markSwapNudged and refreshStoredProgram over the beta's SQLite store at the same instant: keys that differ from today's page ["ia_remind_last_<id>","ia_reminded_<id>"]; the grid handed back is the page's, whole; failures reported {"overlay":0,"freeze":0,"rebuild":0}.

### run base and bike base, crossfit, balanced, after the standard history (three weeks trained, an injury come and gone, travel, edits, two weeks away)

Week 7, mon (the launch is in week 7): Close-grip bench press traded for Barbell bench press three times running, put back between picks. 1 nudge came due, on both apps.

- The count both stores hold, the nudge not answered: `{"to":"Barbell bench press","n":3,"offered":false}`.
- A fourth pick of the same pair, on a copy of the beta's store: countSwap gives back `{"to":"Barbell bench press","n":4,"offered":false}`, so the nudge is due again. A pick of another lift: `null` stored as `{"to":"Some other lift","n":1,"offered":false}`.
- Leave the plan alone, with core's markSwapNudged on a copy: keys changed ["ia_swapct_<id>"], the count now `{"to":"Barbell bench press","n":3,"offered":true}`.
- Make the change, today's page (acceptSwapNudge): keys changed ["ia_programs 52042 to 52105 bytes","ia_swapct_<id> 145 to 144 bytes"]. Toast: "Done. Barbell bench press is your hpress from here.".
  - In ia_programs: the stored grid is the same, byte for byte; cfg.exSwapPrefs `null` to `{"Close-grip bench press":"Barbell bench press"}`; every other cfg field the same.
  - ia_hist_ the same, ia_swaps_ the same, ia_edits_ the same.
  - The grid in hand: 2 days changed (0 of them marked, 0 in a week before the launch's): w8 mon, w9 mon.
- Make the change, core's own recordSwapPreference, markSwapNudged and refreshStoredProgram over the beta's SQLite store at the same instant: keys that differ from today's page ["ia_remind_last_<id>","ia_reminded_<id>"]; the grid handed back is the page's, whole; failures reported {"overlay":0,"freeze":0,"rebuild":0}.

