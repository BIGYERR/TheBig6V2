# The rest sheet: decisions

The sheet a rest day opens (`openRestSheet` in `frontends/app/src/legacy/src/js/rest-day-shell.ts`): the menu, "Training
anyway?" (move a session here) and the cardio log (`restLog[type]` on the day's `ia_logs_` entry, D223), with the rest
hero on This Week, the journal line and the session card of a double day that read the same record, and the rule that
every sheet takes touches only while it is open. Tests: `tests/integration/rest-sheet.test.ts`,
`tests/integration/sheet-close.test.ts`, the rest-day tests in `tests/integration/logging.test.ts`, and the app's
`frontends/app/test/unit/week-view.test.ts` and `day-detail.test.ts`.

## D228 to D232: P-RESTWHEEL widened and P-SHEETCLOSE (v0.240.0)

- **Date:** ruled 2026-10-09 by coach on the V238 tree, on measures m3, m4 and m5; re-checked and built 2026-10-13.
  **Ruled by:** coach; Mario answered the four items 2026-10-13: P-RESTEDIT (D228) yes, replace; P-RESTDIST (D229) yes,
  show the distance; P-DOUBLEEDIT (D231) yes, show and edit on the card; P-RPEWORDS queued. **Bump:** MINOR (Mario).
  **Shipped:** v0.240.0.
- **The ruling, whole:** `tests/measure/v0.240.0_rulings/v0.240.0_ruling_d228_d232.md` (each D-code's finding, coaching
  ground, what changes, what deliberately does not, the after-sheet as text, the stored entries before and after, and
  the claims), with Mario's answers at its foot. Measures: `tests/measure/v0.240.0_rulings/measure_restsheet_m5.md`,
  `tests/measure/v0.240.0_restsheet_m5.*`.
- **The line (Mario):** a prefill is a placeholder, never a stored value; nothing saves unless he rolled or typed it.
- **What changes:**
  - **D228:** the sheet opens on the day's record (the first type holding one, its chip checked `Run ✓`), its time,
    distance and RPE on the controls, `Your run on Wednesday`; with no record it opens empty (zero faces, no chip; the
    30 min and RPE 5 prefills are gone). The button is a regime: `Logged ✓` while the face is the record (a tap closes
    and writes nothing), `Log it` once anything differs. Log writes the face over the type's record (D226's same-type
    sum is amended away; another type keeps its own key); a face of nothing writes nothing and says what to add, and a
    record rolled to zero says `To remove it, use Clear.` Clear takes two taps and removes the type, then `restLog`
    when it empties, then the day key when nothing but `week` and `ts` is left; anything else on the entry stays byte
    for byte. No ceiling attribute: the time wheel's face is the ceiling. The rest hero reads `Edit cardio` once a jog
    line prints.
  - **D229:** a distance alone is a record. Run and bike log on the time and miles wheels, row on the time wheel and a
    meters box, swim on the time wheel and the yards box (step 25), walk on the time wheel; the sheet's own hidden ids
    (`rest_mins`, `rest_dist`), never the card's. The sentence (`restLogLines`, the hero, the journal, the toast)
    names what each record holds: `30 min run logged · 3.1 mi · RPE 5`, `3.1 mi run logged · RPE —`, whole minutes.
  - **D230:** a sheet takes touches only while it is open: `pointer-events:none` on `.overlay` and `.rand-overlay`,
    `auto` on `.open`, not in the transition, so a closing sheet stops taking them the moment `open` goes. All nine
    sheets.
  - **D231:** a future rest day answers `That rest day has not come around yet` instead of silence; a day whose session
    moved away takes a jog and never a move (no "Training anyway?", the strip opens the cardio view); a session card on
    a day that also holds a jog prints `ALSO ON WEDNESDAY`, the sentences and `Edit cardio`, and re-renders after the
    sheet's Log or Clear.
  - **D232:** the move sheet says `Already logged here` with the day's jog lines and `Move a session in and Wednesday is
    a double day. Your call.`
- **Where it is built (the session's siting, Post-v0.239.44 tree):** the sheet, its writers, the sentence, the strip
  tap, the legacy hero and the legacy session card in the legacy source (both the live page and the Angular build run
  it); This Week's hero and the session card's block also in the Angular components that draw them
  (`week-view-model.ts`, `day-detail-model.ts`), the same markup. Two completions the ruling implied: a type holding a
  record always has its chip (ahead of walk), and the armed Clear also resets on a modality change.
- **Does not change:** `buildProgram`, `prog.weeks`, HALF_MANNY's digest (no program output moves), `restNorm`,
  `restMoveCandidates`, `applyRestDayMoves`, the MILES, Progress, seed and ladder arithmetic, the seven session keys,
  `_IAW_SPEC` and the card's forms, `handleDayStatus`, every close function, the chips' words and numbers (P-RPEWORDS
  is queued), walk's no distance, the strip cell, the today hero on a double day.
- **Tests:** `rest-sheet.test.ts` (15, one per claim of the ruling: no prefill, log nothing, the record's face, Log
  replaces and a second Log is inert, the RPE rules, Clear, the legacy ceiling, distance alone, the sentence table,
  controls by type, units stored, the future toast, the moved-from day, the double day, the move sheet), all failing
  on v0.239.44 (nine on their claims, six because Clear, the per-type chip or the sheet's input path did not exist);
  `sheet-close.test.ts` (2: the CSS rule, failing on v0.239.44; the nine sheets' classes, a guard); four
  `logging.test.ts` tests restated to the ruling's values (D224 hero and journal, D226 Log more), failing on
  v0.239.44; the app's This Week hero (`Edit cardio`, and the moved-from day) and the session card's block order.
- **The look, checked:** the sheet drawn at 375 px on the built page, a real wheel roll switching `Logged ✓` to
  `Log it`, Log storing `{mins: 35, dist: 3.1, rpe: 5}` with its toast, and a second tap during the slide-out landing on
  the week view underneath. The Angular build against the page in eight states (the hero empty, with a jog, with a
  distance only, moved-from; the double day's card; the sheet empty, with a record, the move sheet): the same DOM,
  store and open sheets in all eight. The wheels on the sheet draw 69 to 96 pixels of anti-aliasing differently in the
  Angular build (the same boxes, scroll positions, fonts and styles; the page against itself is 0): the browser
  compositing the same text in a different layer tree, recorded, not a layout difference.
- **The page's diff, every hunk classified (30):** the version meta (1); C1 the sheet's markup and copy, C2 its writers
  and the `_restDraft` defaults, C8 the wheels' wiring (`rest-day-shell`, 17 hunks, including the removed TIME box with
  its `max="600"` and the removed same-type sum); C3 eligibility (`restJogEligible`, `openRestSheet`'s view, `openDayKey`,
  3); C4 the shared sentence (`REST_WORD`, `REST_UNIT`, `restDist`, `restLogHead`, `restLogLines`, 2); C5 and D231 item 3
  the hero's buttons (2); C6 the session card's block (`restAlsoHTML` and its call, 2); C7 the closed-sheet CSS (3);
  the Clear button's and the block's styles (2). No hunk outside the ruling's classes, and nothing removed that the
  ruling did not retire.
