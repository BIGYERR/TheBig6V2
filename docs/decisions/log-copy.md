# The log's words: decisions

What the session log's cardio form says to the athlete: the label above the fields of each sport, the hint under a
speed session's label, and the labels of the readout that works out the third number. The form is drawn twice and
must say the same thing in both: by the page (`cardioFieldHTML` in `frontends/app/src/legacy/src/js/wheel-log.ts`,
`updateDoseDerived` in `frontends/app/src/legacy/src/js/log-entries.ts`) and by the iOS app's Angular screen
(`frontends/app/src/app/screens/day-detail/cardio-fields.ts`, whose readout is the same `updateDoseDerived`). What the
form asks for, per dose, is not this file's (`docs/decisions/lsd-pace.md`, the V148 dose grammar). Tests:
`tests/integration/log-copy.test.ts`.

## D271 P-LOGCOPY: the cardio log speaks without a dash

- **Date:** 2026-11-03. **Ruled by:** the main session in the coach hat, on Mario's "Yes, fix the copy" (2026-11-03)
  to "Fix the dashes in the app's run log copy as a small PATCH?". Copy, not doctrine: the copy rule (no mid-sentence
  hyphens or em-dashes in anything the athlete reads; short declarative sentences; the app sounds like a coach).
  **Bump:** PATCH, 0.255.2 (the same answer).
- **Finding:** found while matching the swipe deck's run cards to the app (P-DECK canvas, Version 65). Six strings in
  the cardio log join their words with an em-dash, each written in both builders where it is drawn there:

  | Where | Before | After |
  |---|---|---|
  | Run with no dose, the label (page and app) | Run — actual distance & pace | Log the run |
  | Speed session with no dose, the hint (page and app) | Whole session off the watch — warm up, efforts and recoveries all count. | Whole session off the watch. Warm up, efforts and recoveries all count. |
  | Swim, the label (page and app) | Swim — actual yardage | Log the swim |
  | Readout, a pace (`updateDoseDerived`) | Pace — derived | Your pace |
  | Readout, a rep dose with no rep time yet | Rep pace — derived | Your rep pace |
  | Readout, a rep dose's volume | Work volume — derived | Work done |

  The run and swim labels join the two the form already prints, `Log the run` on a dosed run and `Log the ride` on a
  bike; the wheel captions (`Miles`, `Pace / mile`) and the swim box's `yards` say what goes in. The readout row has
  no field, so `Your` marks it as the athlete's own number worked out, not one to type.
- **Does not change:** what any form asks for, its wheels, captions, plan strip, stepper or sport chips; the readout's
  values and notes (`assuming planned 15 min`, the pace gap of D40); anything stored. Seen and left, each a separator
  between a value or code and its name, not a clause joined by a dash: the plan strip's session code (`Run — INT ·
  Planned`, `runSessionCode`), the RPE readout (`7 — working, three left`), and the log's RPE label (`How hard was it? —
  RPE`), which heads every day's log, lifting days too, outside the cardio form this ruling covers. Listed to Mario
  with the release.
- **Expected values:** the After column, word for word, in both builders; none of the six Before strings, and no
  em-dash, in any text the cardio form or its readout prints for a run with no dose (speed and not), a time dose, a
  distance dose, a reps by distance dose (volume and pace), a ride and a swim. The Angular template prints the same
  three label and hint strings as the page. No program output moves.
- **Release:** not yet.
