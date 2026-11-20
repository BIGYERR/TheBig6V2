# Today's Hurt? and Traveling?, the chip and the check in, and This Week's two dates (measure, before the Expo app draws them)

Made by `tests/measure/native-injury-travel_today.ts` on today's page in the VM harness, on the ten seeded programs (`tests/support/programs.ts`), each through the standard history (`tests/support/stored-state.ts` `life`). Every count is one the script printed.

## A. Where they open, and what stands on This Week

Today's app (the Angular screens) has one door each, both on This Week (`week-view.ts`):

- **Hurt?**, the pill at the head's right (`openInjurySheet`). With a live injury it reads the region's name in red, and opens the same sheet on that region and tier.
- **Traveling?**, the button at the foot beside Random Workout (`openOverlaySheet`).
- Both refuse with no active program ("No active program. Tap Set Active or build a new one."); This Week is not reached without one, so no tap gets there.
- The chip wrap sits under those two buttons. The page fills it (`renderOverlayChip`, called by the Angular screen at each draw): one chip per live overlay, and under an open injury's chip the check in card once two weeks have passed.
- The sheet itself is an Angular screen with a model (`change-sheet-model.ts`); its draft and every write are the page's (`_ovDraft`, `_ovSet`, `applyInjuryDraft`, `applyOverlayDraft`).

What stands on This Week at each stretch of the standard history (ten programs):

| Stretch | Pill reads Hurt? | Pill reads a region | Chips | Travel | Injury | Return week | Chips with I’m back | Check in cards | Overlays stored | Stored and not drawn (ended, or outside the program) |
|---|---|---|---|---|---|---|---|---|---|---|
| 0 generated | 10 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 1 first week | 10 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 2 second week | 0 | 10 | 20 | 10 | 10 | 0 | 10 | 0 | 20 | 0 |
| 3 third week | 0 | 10 | 30 | 10 | 10 | 10 | 10 | 0 | 30 | 0 |
| 4 after two weeks away | 10 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 30 | 30 |

<!-- overlays after Apply again: 2 (injury workaround, injury protect) -->
## B. What they draw

The sheet's kinds are read off the Angular model's builders (`travelView`, `injuryView`), the chip's and the check in's off the page's (`renderOverlayChip`), the pop-ups' off `imBackFromInjury` and `injReassess`; then counted off every draw the walks of section C and D made.

The sheet (350 draws; in 350 of them the model's words, in the template's order, are the page's own markup's words):

| Kind | Count |
|---|---|
| Hurt? drawn | 180 |
| Hurt?: Apply change | 160 |
| Hurt?: Got it | 10 |
| Hurt?: a region card | 1440 |
| Hurt?: a region picked | 170 |
| Hurt?: a tier card | 320 |
| Hurt?: effect, Protected | 70 |
| Hurt?: effect, Working around it | 90 |
| Hurt?: effect, above my pay grade | 10 |
| Hurt?: no button (no region picked) | 10 |
| Hurt?: the From date box | 160 |
| Traveling? drawn | 170 |
| Traveling?: Apply change | 160 |
| Traveling?: Got it | 10 |
| Traveling?: a date box | 320 |
| Traveling?: a date box that reads Set date | 10 |
| Traveling?: a gear card | 510 |
| Traveling?: back line, a day picks the program back up | 128 |
| Traveling?: back line, runs to the end of the program | 12 |
| Traveling?: effect, N days | 120 |
| Traveling?: effect, You’re set | 10 |
| Traveling?: effect, one day | 20 |
| Traveling?: effect, onward (no Through) | 10 |
| Traveling?: effect, the range falls outside the program | 10 |
| Traveling?: holds line, Room only | 30 |
| Traveling?: holds line, gear | 120 |
| Traveling?: no date boxes (Full gym) | 10 |

The chip wrap:

| Kind | Count |
|---|---|
| check in card | 20 |
| check in: an answer button | 60 |
| chip label: <region> (protected) | 80 |
| chip label: <region> (working around it) | 240 |
| chip label: Return week · <region> | 150 |
| chip label: gear, Mini gym | 30 |
| chip label: gear, Minimal / Travel | 20 |
| chip label: gear, Room only | 20 |
| chip span: From a day | 210 |
| chip span: Week N | 10 |
| chip span: Weeks N–M | 10 |
| chip span: days across months (Sep 29–Oct 2) | 25 |
| chip span: days in one month (Sep 1–4) | 275 |
| chip span: one day (Tue Sep 1) | 10 |
| chip tail: Back to normal <day>. | 180 |
| chip tail: One light week, then full send. | 150 |
| chip tail: Tap I’m back when it’s ready. | 210 |
| chip: Injury | 320 |
| chip: I’m back button | 320 |
| chip: Return week | 150 |
| chip: Travel | 70 |
| chip: the ✕ | 540 |
| draws of the wrap | 580 |
| draws with no chip | 180 |

The pop-ups:

| Kind | Count |
|---|---|
| Back in: Good. One week to prove it. | 40 |
| Back in: Good. One week to prove it. with 1 answers | 40 |
| Back in: Good. Two weeks to full send. | 110 |
| Back in: Good. Two weeks to full send. with 1 answers | 110 |
| Back in: needs N more weeks | 22 |
| Back in: the pace clock line | 22 |
| Check in: Good sign. | 10 |
| Check in: Good sign. with 2 answers | 10 |
| Check in: Two weeks and trending worse. | 10 |
| Check in: Two weeks and trending worse. with 1 answers | 10 |

## C. What each tap reads and writes

Each tap on a phone at the end of the first week (the dates and the copy button: the third), the ten programs unless the row says otherwise. "Grid moved" is how many of those phones had a day of the grid in hand change. An outcome that differs between programs is followed by how many gave it.

| Tap | Phones | Stored keys that changed | Keys asked for | The page's calls | Grid moved | Toast | Pop-up |
|---|---|---|---|---|---|---|---|
| Hurt? tapped (no live injury) | 10 | nothing | nothing | renderOverlaySheet 1 | 0 | none | none |
| A region card | 10 | nothing | nothing | renderOverlaySheet 1 | 0 | none | none |
| A tier card | 10 | nothing | nothing | renderOverlaySheet 1 | 0 | none | none |
| Neck / something else | 10 | nothing | nothing | renderOverlaySheet 1 | 0 | none | none |
| The From date box, three days on | 10 | nothing | nothing | renderOverlaySheet 1 | 0 | none | none |
| Apply change (knee, work around it, from today) | 10 | `ia_programs` changed | `ia_comp_<id>`, `ia_edits_<id>`, `ia_exw_<id>`, `ia_hist_<id>`, `ia_logs_<id>`, `ia_moves_<id>`, `ia_programs`, `ia_swaps_<id>`, `ia_wild_<id>` | refreshProgram 1, buildProgram 2, savePrograms 1, renderWeekView 1, closeOverlaySheet 1 | 10 | "Working around it ✓" | none |
| Apply change with From past the program's end | 10 | nothing | nothing | renderOverlaySheet 1 | 0 | "That date falls outside your program" | none |
| Hurt? tapped again (the injury live) | 10 | nothing | nothing | renderOverlaySheet 1 | 0 | none | none |
| Apply change again, now Protect it | 10 | `ia_programs` changed | `ia_comp_<id>`, `ia_edits_<id>`, `ia_exw_<id>`, `ia_hist_<id>`, `ia_logs_<id>`, `ia_moves_<id>`, `ia_programs`, `ia_swaps_<id>`, `ia_wild_<id>` | refreshProgram 1, buildProgram 3, savePrograms 1, renderWeekView 1, renderOverlaySheet 1, closeOverlaySheet 1 | 10 | "Protected. Train around it ✓" | none |
| The chip's ✕ | 10 | `ia_programs` changed | `ia_comp_<id>`, `ia_edits_<id>`, `ia_exw_<id>`, `ia_hist_<id>`, `ia_logs_<id>`, `ia_moves_<id>`, `ia_programs`, `ia_swaps_<id>`, `ia_wild_<id>` | refreshProgram 1, buildProgram 1, savePrograms 1, renderWeekView 1 | 10 | "Change removed ✓" | none |
| I’m back: a region whose runs never stopped (40 of 140 region, tier and program walks) | 40 | `ia_programs` changed | `ia_comp_<id>`, `ia_edits_<id>`, `ia_exw_<id>`, `ia_hist_<id>`, `ia_logs_<id>`, `ia_moves_<id>`, `ia_programs`, `ia_swaps_<id>`, `ia_wild_<id>` | refreshProgram 1, buildProgram 2, savePrograms 1, renderWeekView 1 | 40 | none | "Back in: Good. One week to prove it." |
| I’m back: a region whose runs were held (100) | 100 | `ia_programs` changed | `ia_comp_<id>`, `ia_edits_<id>`, `ia_exw_<id>`, `ia_hist_<id>`, `ia_logs_<id>`, `ia_moves_<id>`, `ia_programs`, `ia_swaps_<id>`, `ia_wild_<id>` | refreshProgram 1, buildProgram 3, savePrograms 1, renderWeekView 1 | 100 | none | "Back in: Good. Two weeks to full send." |
| Traveling? tapped | 10 | nothing | nothing | renderOverlaySheet 1 | 0 | none | none |
| A gear card (Room only) | 10 | nothing | nothing | renderOverlaySheet 1 | 0 | none | none |
| Full gym | 10 | nothing | nothing | renderOverlaySheet 1 | 0 | none | none |
| Got it, or ← Back | 10 | nothing | nothing | closeOverlaySheet 1 | 0 | none | none |
| The From box moved past Through | 10 | nothing | nothing | renderOverlaySheet 1 | 0 | none | none |
| The Through box | 10 | nothing | nothing | renderOverlaySheet 1 | 0 | none | none |
| Apply change (Mini gym, today and three days on) | 10 | `ia_programs` changed | `ia_comp_<id>`, `ia_edits_<id>`, `ia_exw_<id>`, `ia_hist_<id>`, `ia_logs_<id>`, `ia_moves_<id>`, `ia_programs`, `ia_swaps_<id>`, `ia_wild_<id>` | refreshProgram 1, buildProgram 2, savePrograms 1, renderWeekView 1, closeOverlaySheet 1 | 10 | "Change applied ✓" | none |
| Apply change, one day | 10 | `ia_programs` changed | `ia_comp_<id>`, `ia_edits_<id>`, `ia_exw_<id>`, `ia_hist_<id>`, `ia_logs_<id>`, `ia_moves_<id>`, `ia_programs`, `ia_swaps_<id>`, `ia_wild_<id>` | refreshProgram 1, buildProgram 2, savePrograms 1, renderWeekView 1, closeOverlaySheet 1 | 2 | "Change applied ✓" | none |
| Apply change with the range past the program's end | 10 | nothing | nothing | none | 0 | "That range is outside your program" | none |
| Apply change with Through cleared | 10 | nothing | nothing | none | 0 | "Pick both dates" | none |
| Apply change with Through before From | 10 | nothing | nothing | none | 0 | "“Through” can’t be before “From”" | none |
| Traveling? tapped again after a trip is booked | 10 | nothing | nothing | renderOverlaySheet 1 | 0 | none | none |
| The trip chip's ✕ | 10 | `ia_programs` changed | `ia_comp_<id>`, `ia_edits_<id>`, `ia_exw_<id>`, `ia_hist_<id>`, `ia_logs_<id>`, `ia_moves_<id>`, `ia_programs`, `ia_swaps_<id>`, `ia_wild_<id>` | refreshProgram 1, buildProgram 1, savePrograms 1, renderWeekView 1 | 10 | "Change removed ✓" | none |
| Check in: Better | 10 | nothing | nothing | none | 0 | none | "Check in: Good sign." |
| Check in, Better: I’m back | 10 | `ia_programs` changed | `ia_comp_<id>`, `ia_edits_<id>`, `ia_exw_<id>`, `ia_hist_<id>`, `ia_logs_<id>`, `ia_moves_<id>`, `ia_programs`, `ia_swaps_<id>`, `ia_wild_<id>` | refreshProgram 1, buildProgram 3, savePrograms 1, renderWeekView 1 | 10 | none | "Back in: Good. Two weeks to full send." |
| Check in, Better: More time | 10 | `ia_programs` changed | `ia_comp_<id>`, `ia_logs_<id>`, `ia_programs`, `ia_wild_<id>` | savePrograms 1, renderWeekView 1 | 0 | "Staying on the plan. It will ask again in two weeks." | none |
| Check in: Same | 10 | `ia_programs` changed | `ia_comp_<id>`, `ia_logs_<id>`, `ia_programs`, `ia_wild_<id>` | savePrograms 1, renderWeekView 1 | 0 | "Staying on the plan. It will ask again in two weeks." | none |
| Check in: Worse | 10 | `ia_programs` changed | `ia_comp_<id>`, `ia_logs_<id>`, `ia_programs`, `ia_wild_<id>` | savePrograms 1, renderWeekView 1 | 0 | none | "Check in: Two weeks and trending worse." |
| Start date: the same day again | 6 | `ia_programs` changed | `ia_comp_<id>`, `ia_logs_<id>`, `ia_programs`, `ia_wild_<id>` | savePrograms 1, renderWeekView 1 | 0 | "Start date set. Short first week ✓" (5); "Start date set ✓" (1) | none |
| Start date: this week's Monday | 6 | `ia_programs` changed | `ia_comp_<id>`, `ia_logs_<id>`, `ia_programs`, `ia_wild_<id>` | savePrograms 1, renderWeekView 1 | 0 | "Start date set ✓" | none |
| Start date: this week's Wednesday | 6 | `ia_programs` changed | `ia_comp_<id>`, `ia_logs_<id>`, `ia_programs`, `ia_wild_<id>` | savePrograms 1, renderWeekView 1 | 0 | "Start date set. Short first week ✓" | none |
| Start date: this week's Sunday | 6 | `ia_programs` changed | `ia_comp_<id>`, `ia_logs_<id>`, `ia_programs`, `ia_wild_<id>` | savePrograms 1, renderWeekView 1 | 0 | "Nothing to train that week. Starts Mon, Sep 21 ✓" | none |
| Start date: the box cleared | 6 | nothing | nothing | none | 0 | none | none |
| Start date, a dated test goal: the same day again | 1 | `ia_programs` changed | `ia_comp_<id>`, `ia_edits_<id>`, `ia_exw_<id>`, `ia_hist_<id>`, `ia_logs_<id>`, `ia_moves_<id>`, `ia_programs`, `ia_swaps_<id>`, `ia_wild_<id>` | refreshProgram 1, buildProgram 1, savePrograms 1, renderWeekView 1 | 0 | "Start date set. Short first week ✓" | none |
| Start date, a dated test goal: two Mondays on | 1 | `ia_programs` changed | `ia_comp_<id>`, `ia_edits_<id>`, `ia_exw_<id>`, `ia_hist_<id>`, `ia_logs_<id>`, `ia_moves_<id>`, `ia_programs`, `ia_swaps_<id>`, `ia_wild_<id>` | refreshProgram 1, buildProgram 1, savePrograms 1, renderWeekView 1 | 1 | "Start date set ✓" | none |
| Start date, a dated test goal: the test's own Sunday | 1 | `ia_programs` changed | `ia_comp_<id>`, `ia_edits_<id>`, `ia_exw_<id>`, `ia_hist_<id>`, `ia_logs_<id>`, `ia_moves_<id>`, `ia_programs`, `ia_swaps_<id>`, `ia_wild_<id>` | refreshProgram 1, buildProgram 1, savePrograms 1, renderWeekView 1 | 1 | "That week holds your test. Nothing left to train before it ✓" | none |
| Race date: the same day again | 4 | `ia_programs` changed | `ia_comp_<id>`, `ia_edits_<id>`, `ia_exw_<id>`, `ia_hist_<id>`, `ia_logs_<id>`, `ia_moves_<id>`, `ia_programs`, `ia_swaps_<id>`, `ia_wild_<id>` | refreshProgram 1, buildProgram 4, savePrograms 1, renderWeekView 1 | 0 | "Race day Sun, Dec 6 — plan starts Mon, Aug 31 ✓" (1); "Race day Sun, Nov 15 — plan starts Mon, Sep 21 ✓" (1); "Race day Sun, Nov 29 — plan starts Mon, Oct 5 ✓" (1); "Race day Sun, Feb 28 — plan starts Mon, Oct 26 ✓" (1) | none |
| Race date: two weeks later | 4 | `ia_programs` changed | `ia_comp_<id>`, `ia_edits_<id>`, `ia_exw_<id>`, `ia_hist_<id>`, `ia_logs_<id>`, `ia_moves_<id>`, `ia_programs`, `ia_swaps_<id>`, `ia_wild_<id>` | refreshProgram 1, buildProgram 4, savePrograms 1, renderWeekView 1 | 4 | "Race day Sun, Dec 20 — plan starts Mon, Sep 14 ✓" (1); "Race day Sun, Nov 29 — plan starts Mon, Oct 5 ✓" (1); "Race day Sun, Dec 13 — plan starts Mon, Oct 19 ✓" (1); "Race day Sun, Mar 14 — plan starts Mon, Nov 9 ✓" (1) | none |
| Race date: two days from today | 4 | `ia_programs` changed | `ia_comp_<id>`, `ia_edits_<id>`, `ia_exw_<id>`, `ia_hist_<id>`, `ia_logs_<id>`, `ia_moves_<id>`, `ia_programs`, `ia_swaps_<id>`, `ia_wild_<id>` | refreshProgram 1, buildProgram 3, savePrograms 1, renderWeekView 1 | 4 | "Race day Fri, Sep 18 — plan starts Mon, Jun 15 ✓" (1); "Race day Fri, Oct 9 — plan starts Mon, Aug 17 ✓" (1); "Race day Fri, Oct 23 — plan starts Mon, Aug 31 ✓" (1); "Race day Fri, Nov 13 — plan starts Mon, Jul 13 ✓" (1) | none |
| Race date: the box cleared | 4 | nothing | nothing | none | 0 | none | none |
| Programs tab: the copy button by the seed | 10 | nothing | `ia_programs` | none | 0 | none | none |

## D. The check in

The card is drawn under the chip of an injury with no end date, once `Date.now()` is fourteen days past the overlay's `lastAsk`, or its `created` when it was never asked. It reads the clock in milliseconds, not the calendar day. Knee, work around it, flagged at the end of the first week on each of the ten programs:

| What | Phones |
|---|---|
| after Better: the card still stands | 10 |
| after More time: the card is gone | 10 |
| after Worse: the card is gone | 10 |
| fifteen days on: the card stands | 10 |
| fourteen days after More time: the card stands again | 10 |
| fourteen days on: the card stands | 10 |
| thirteen days on: no card | 10 |

## E. This Week's start date and race date

One row under the header: the race date when the program has a race alignment (`progAlignment`: a run goal that counts back from a race), else Program Start. Each is a `<label>` over a native date box (`setProgRace`, `setProgStart`).

| What | Programs |
|---|---|
| 0 generated: the row is Program Start | 6 |
| 0 generated: the row is the race date | 4 |
| 3 third week: the row is Program Start | 6 |
| 3 third week: the row is the race date | 4 |
| a dated test goal (an eleventh program, made for this row): the row is Program Start | 1 |

## F. The copy button

| What | Count |
|---|---|
| a text of 10 lines | 4 |
| a text of 8 lines | 2 |
| a text of 9 lines | 4 |
| line: Cardio | 10 |
| line: Event | 4 |
| line: Experience | 10 |
| line: Goal | 10 |
| line: Name | 10 |
| line: Run anchor | 8 |
| line: Seed | 10 |
| line: Starting 1RM | 10 |
| line: THE ASYLUM — Program selections | 10 |
| line: Train days | 10 |
| texts handed to the clipboard | 10 |
| the text is progSelLines joined by new lines | 10 |
| toast once the clipboard answers: "Selections copied ✓" | 10 |

## G. On the simulator's copy of Mario's backup (counts only)

Read by a scratch script from a copy of the simulator's store (2026-11-20, the store's hash 278ba57f3f6a382b before and after, the hash the last session read; nothing was written to it), every tap on a phone of its own in the VM harness. Typed here by hand: no name, note, date or load.

- The store holds 36 `ia_` keys and 3 programs. 1 overlay is stored in all, on a program that is not the active one: a return week, long ended. The active program stores none.
- The active program is inside its 14 weeks. This Week draws 0 chips and 0 check in cards, the pill reads Hurt?, and none of the grid's 98 days is built under travel.
- Its date row is the race date, not Program Start.
- Apply change on Hurt? (knee, work around it, today) changed `ia_programs` alone, moved the grid, one toast, and drew 1 chip. I’m back from it changed `ia_programs` alone, moved the grid, one pop-up, and drew 2 chips (the return week and the week after).
- Apply change on Traveling? (Mini gym, the sheet's own dates) changed `ia_programs` alone, moved the grid, one toast, 1 chip. Its ✕ changed `ia_programs` alone, moved the grid, one toast, 0 chips.
- The race date set to the day it already holds rewrote `ia_programs` (the program stored again), left the grid the same, one toast.
- The copy button handed the clipboard a text of 10 lines and wrote nothing.

