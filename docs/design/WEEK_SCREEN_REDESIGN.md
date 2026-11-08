# This Week screen redesign

Status: approved mockup, ready to build. Mockup source: `week-screen-mockup.dc.html` (same folder). It is a design-tool component, not drop-in code. Read it for structure, spacing, colors and behavior, then build it the way the app already builds screens.

## Prompt for Claude Code

Paste this as the first message:

> Read `docs/design/WEEK_SCREEN_REDESIGN.md` and `docs/design/week-screen-mockup.dc.html`. Rebuild the This Week screen to match the spec. Keep the app's existing look (black ground, orange accent, 24px rounded cards, pill buttons, SF system font) and existing tokens from `base.css`. Do not introduce new fonts or colors. Program data comes from the existing week grid and the NRC run table, same as today. Work through the spec section by section, keep each change in its own commit, and stop and ask before touching the session sheet or anything outside this screen.

## Why

The current screen says "Week 11" four times (headline, tab row, Today label, circled day), truncates day labels to RUN POSTE / RUN STREN, puts a giant Start button on a session that is already closed out, shows a race date instead of a countdown, uses a link icon on Hurt?, and ships a Bugs tab in the main nav. Every one of those is a UX problem, not a style problem. The look stays. The structure changes.

## Screen, top to bottom

### 1. Header

- Eyebrow: `THE HALF MANNY`, 13px, 700, letter-spacing 0.06em, uppercase, `#8E8E8E`.
- Week title strip replaces both the big "Week 11" headline and the Wk 9 to Wk 14 tab row. See section 2.
- `Hurt?` pill floats over the right end of the strip. 40px tall, 16px side padding, 1.5px `#3A3A3A` border, 20px radius, background matches the page ground so the strip fades under it. No icon. Same action it has today.

### 2. Week title strip (the big change)

A horizontal scroll-snap strip of week titles at 56px / 800 / letter-spacing -0.03em. The active week sits left-aligned at the page's 20px gutter. The next week peeks in on the right and fades out under a gradient and the Hurt? pill.

- Container: full bleed (390px on phone), `overflow-x: auto`, `scroll-snap-type: x mandatory`, `padding-right: 150px` so the last item can snap to the left, scrollbar hidden.
- Each item: fixed width 240px, `scroll-snap-align: start`, `padding-left: 20px`, `white-space: nowrap`.
- Active week: `#FFFFFF`. All others: `#1C1C1C` on the `#0B0B0B` ground. Barely visible on purpose.
- Right fade: absolute, 150px wide, `linear-gradient(90deg, transparent, #0B0B0B 55%)`, `pointer-events: none`.
- On scroll end: `round(scrollLeft / 240) + 1` is the week. Update the rest of the screen from that. On mount and when the week changes from anywhere else (Progress chart tap, deep link), `scrollTo({ left: (week - 1) * 240 })`.
- Tapping a dim neighbor also selects it and scrolls.
- Swipe only lives on this strip. Nothing else on the screen handles horizontal gestures.
- Titles: `Week 1` through `Week 14`, then a 15th item titled `Race Day` (see section 7).

### 3. Race row

- Left: flag icon (22px stroke), then `{N} days out` at 20px / 700 and `Race day Sun, Dec 6` at 13px `#8E8E8E` under it. Countdown is computed from today to the race date and does not change when swiping weeks.
- Right: phase pill. 34px tall, 1.5px accent border, accent text, 14px / 700. Text comes from the existing phase label logic in `week-view-sections.ts` (`Phase 3 — Peak` etc). The Race Day item shows `Race Day`.

### 4. Day strip

Card: `#161616`, 24px radius, padding 16px 8px 14px, 7 equal columns.

Columns run Sunday to Saturday: `S M T W T F S`. Dates are calendar dates. The Sunday column is the real Sunday before that week's Monday, which is the previous program week's Sunday (rest in every week except the race). See section 7 for the race.

Each column, top to bottom, 8px gap:

- Day letter, 13px / 700. `#8E8E8E` normally, white when selected, accent when it is today.
- 36px circle. Done: green check (`#7CC56A`, 2.2 stroke) on no fill. Upcoming session: `#262626` fill with the date number in white, 15px / 700. Rest or past-not-done: no fill, date in `#8E8E8E`. Selected day gets a 2px white ring regardless of state.
- Type code, 9px / 700, letter-spacing 0.04em. One word, never truncated: `SPEED`, `RECOV`, `LEGS`, `LONG`, `SHAKE`, `RACE`, `REST`. Color: green for upcoming run days, accent for `LEGS` and `RACE`, `#8E8E8E` for rest and anything in the past.

No times or distances in the strip. That detail lives in the session card.

Tapping a column selects that day and loads it into the session card. Default selection when a week loads: current week, the next undone session (tomorrow in the mockup). Past weeks: Saturday. Future weeks: Monday. Race Day item: Sunday.

### 5. Session card

Card: `#161616`, 24px radius, 20px padding, 10px gap. Shows the selected day.

- When line, 15px / 600 `#8E8E8E`: `Today · Thursday`, `Tomorrow · Friday`, `Yesterday · Wednesday`, otherwise `Friday, Nov 13`.
- Title, 34px / 800, letter-spacing -0.02em. Run name for run days (`Speed Run`, `Recovery Run`, `Long Run`, `Shakeout Run`, `Race Day`), lift name for lift-only days (`Leg Strength + Mobility`), `Rest` for rest.
- Meta line, 15px / 600 white. Speed: `Intervals · 25:00 of work`. Recovery: `15–45 min · Recovery pace`. Long: `20K Run · 12.5 mi · Peak`. Legs: `~50 min · 12 movements · Hip + ankle after`.
- Blurb, 14px `#8E8E8E`, one or two sentences. Speed runs use the NRC detail's first line.
- Lift sub-card, only on run days that also lift: `#0B0B0B` inset, 14px radius, 12px 14px padding, dumbbell icon in accent, `Then lift · Posterior Chain` 14px / 700, then `Barbell Romanian deadlift + 4 more` 13px `#8E8E8E`, single line, ellipsis.
- Primary button only when the session is not done: 56px, accent fill, 28px radius, 19px / 700, play icon, `Start run` / `Start session` / `Start race`.
- When the session is done: no orange button. A ghost `Reopen session` button instead, 48px, 1.5px `#3A3A3A` border. This is the fix for the big Open Session button on a closed-out day.
- Rest days: no button at all.
- A Hurt? adjustment shows one accent line under the blurb (`Swapped for an easy 2 mi`, `Changed to a rest day`, `Injury flagged. Go by feel.`).

### 6. Recent session card

Small card under the session card, only when there is a completed session this week other than the selected one. `#161616`, 20px radius, 14px 18px padding. Green check, title (`Leg Strength + Mobility`, or `Speed Run + Posterior Chain`), meta (`Done Thu 12 · 12 movements`), and a `Review` text button in accent on the right that selects that day. Review opens the same session card, nothing new.

### 7. Race Day item

Because the program's Race Day is Week 14's Sunday and the calendar runs Sunday first, the race lands at the start of the calendar week after Week 14. The strip gets a 15th item titled `Race Day`. Its Sunday column is the race (`RACE` code, accent), the other six columns are empty (no code, no fill). Session card for those: title `Done`, meta `Program complete`.

Alternative if you would rather not have a 15th item: keep program weeks Monday to Sunday under the hood and only reorder the columns for display, with the Sunday column showing that program week's Sunday at the end-of-week date. The mockup does not do this. Pick one and note it in `docs/decisions/`.

### 8. Bottom nav

Three tabs: Programs, This Week, Progress. Bugs leaves the main nav. Put the bug report entry and the Look (day/night) row on the Programs screen or a settings sheet, whichever the app already has. Nav visuals unchanged: `#161616` pill, 36px radius, 8px padding, active tab `#262626` fill with accent icon and label.

Remove the floating orange timer sliver on the right edge from the week screen. If a session is in progress, show a real timer pill, and only then.

### 9. Hurt? sheet

Bottom sheet, `#161616`, 28px top radius, grab handle. Title `Something hurt?`, subline `Adjusts {today · thursday}. Nothing else in the plan moves.` Three 56px option rows (`#262626`, 16px radius, left-aligned 16px / 600): `Swap the run for an easy 2 mi`, `Make it a rest day`, `Flag an injury, keep the session`. Cancel below. Options apply to the selected day only. Hook into whatever Hurt? does today; the mockup only shows the shape.

## Data mapping

Everything on the screen comes from data the app already has.

- Week grid per day: lift name, run name (with tag after ` — `: `Intervals`, `Peak`, `Cutback`, `Dress Rehearsal`, `Taper`, `RACE DAY`), exercise list. Same source as `tests/snapshots/program-output.json`.
- NRC row per week from `core/src/engine/nrc-race-bike-swim.ts`: long run label, value, unit, speed detail first line, recovery minutes range.
- Type code: `Speed Run` → `SPEED`, `Recovery Run` → `RECOV` (or `SHAKE` when the lift slot is `Shakeout`), `Long Run` → `LONG` (`RACE` when tag is `RACE DAY`), lift-only → `LEGS`, nothing → `REST`.
- Work minutes for speed runs: regex `(\d+):(\d+) of work` on the speed detail.
- Phase: existing `week-view-sections.ts` fraction split.

## Colors and sizes used (all already in the app)

- Ground `#0B0B0B` with the existing warm radial glow at the top. Card `#161616`. Inset `#0B0B0B`. Raised `#262626`. Border `#3A3A3A`. Muted text `#8E8E8E`. Dim week titles `#1C1C1C`.
- Accent: the app's orange token (mockup uses `#F26A1C`). Done green `#7CC56A`.
- Radii: cards 24, small card 20, inset 14, pills 20 to 28, nav 36.
- Type: 56/800 week title, 34/800 session title, 20/700 countdown, 15/600 meta, 14 blurb, 13 labels, 9/700 day codes.
- Touch targets 44px minimum everywhere, including the day columns and the Review text button.

## Acceptance

- Swiping the week title changes the week. No other horizontal gesture on the screen.
- Week 11 Thursday shows `Leg Strength + Mobility`, `Back squat + 11 more` worth of movements, no orange button when closed out, `Reopen session` instead.
- Day strip never shows truncated text.
- Countdown reads `{N} days out` and does not change when swiping.
- Columns are S M T W T F S with correct calendar dates.
- Bugs is not in the bottom nav.
- Night mode tokens still apply (the mockup is night only; day palette comes from `base.css`).
