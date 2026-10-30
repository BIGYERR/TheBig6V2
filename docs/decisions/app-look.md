# App look: decisions

The app's look: its palette, its shapes, the case of its labels and its depth. The tokens live in
`frontends/app/src/legacy/src/css/base.css`; the screens draw with them in the other sheets under `css/`, and the native
app's Angular screens use the same classes. The preview Mario chose from is `docs/design/look-options.html` (the real
This Week markup and stylesheet, one option sheet on top of each). Tests: `tests/unit/app-look.test.ts` and
`tests/unit/night-mode.test.ts`.

## D263 P-TRACK: the Track look with a light glow, across the app

- **Date:** 2026-10-30. **Ruled by:** Mario. He asked how to lift the app's "AI" feel and give it depth, with Runna and
  Strava screens for reference. He was shown three directions on This Week beside today's look, in night and day
  (Paper & Ink, Ember, Track), picked Track and asked for Ember's glow on it ("i like C but can we add some of that
  glow?"). He was then shown Track with two strengths of glow and picked the light one ("C1!"). The release is MINOR,
  0.252.0, his pick. No coaching doctrine is involved: no program output moves.
- **Finding:** the look reads generated because every element has the same shape and voice. The 9 sheets hold 132
  one pixel outlines and 131 fixed small corners, and 89 rules set labels in capitals; dozens more labels are typed in
  capitals in the code of both builds. Night mode separates things by line, not by surface. No screen has one element
  that stands out.
- **Changes:**
  1. **A neutral palette.** Paper and ink go neutral, true black at night (table below). The signal orange, the six
     sport colours and their tints keep their values in both looks. The dark bands of D261 item 3 stay dark, on neutral
     values.
  2. **Shape.** Cards, tiles and sheets lose their outlines and sit on a surface fill with round corners (cards 24px,
     tiles 16px). Buttons, chips and tags are pills. The week tabs are underlined in signal.
  3. **Sentence case.** No label is set in capitals by the stylesheet, and the labels typed in capitals in either
     build's code read in sentence case. Capitals stay on acronyms (RPE, AMRAP, NRC), on the session codes under each
     day (RUN, LIFT), and on a word stressed inside a sentence of copy. Headline numbers are heavy and tight.
  4. **The glow (C1).** A warm signal light sits behind the top of each tab screen (This Week, Your Programs, Progress,
     Bugs), stronger at night. The main signal button of a screen or sheet glows: Start session, the session sheet's
     Done, the pop-up's main button. Nothing else glows: Mario declined the stronger option (C2: a glow inside the
     session card, on today's date and on the active tab).
  5. **The tab bar floats.** A pill bar 12px in from each side above the home indicator, its fill blurred, the active
     tab tinted in signal.
  6. **The day strip.** One letter per day (M T W T F S S) over a round date; today's date is ringed in ink; the
     session codes stay under each date, in their sport's colour on today as on every other day.
- **Does not change:** what a program prescribes or what is stored (HALF_MANNY unmoved). The Look setting (Auto, Day,
  Night) and its key (D261 item 1). D261 item 4: every colour still has one home, so each new colour is a token. The
  words of every label, only their case. The copy rule. The website and the admin. The Dynamic Island timer.
  `config.xml`'s launch background (bone, shown only before the page draws).
- **Amends:** D261 item 2's table (both columns). D185 P-WCTODAY: today's cell is no longer orange, so the rule that
  turned the W mark and the tick on-signal there goes, and so does the dark type `_onGold` gave the session codes on
  today's cell; both read as on every other day. The design system reference
  (`docs/design/THE_ASYLUM_DS_REFERENCE.md`: bone and warm ink, 4px corners, no pills and no glows give way to this).
- **Form, the build's to decide (recorded here):** the look is one sheet, `css/look.css`, last in `order.json` after
  the component sheets, so the preview's option sheet carried over almost whole; the rules it replaces in place are
  the ones that would fight it (today's cell in `this-week.css`). The capitals and the tracking came out of every sheet
  and every inline style of both builds by one rule (no `text-transform:uppercase`, positive `letter-spacing` to 0),
  and a 4px inline corner became a pill on a button, 12px on a field and 16px on a block, with a surface card's
  outline made transparent so nothing moves. Labels that were small capitals (9 to 11px) now read at 12 to 13px. The
  day strip keeps the short day name in its markup ("Mon"), which the tests and a screen reader read, and draws its
  first letter. Labels already in Title Case ("Race Day", "Random Workout", "Your Programs") are left as they are: the
  ruling is about capitals, and a Title Case pass is a copy question of its own.
- **Expected values:**

  | Token | Day | Night |
  |---|---|---|
  | `--bg` | `#F3F3F1` | `#000000` |
  | `--surface` | `#FFFFFF` | `#161616` |
  | `--surface2` | `#EDEDEA` | `#242424` |
  | `--surface3` | `#E1E1DD` | `#2E2E2E` |
  | `--border` | `#E3E3DF` | `#262626` |
  | `--border2` | `#CFCFCA` | `#3C3C3C` |
  | `--text` | `#111111` | `#FFFFFF` |
  | `--muted` | `#6E6E6A` | `#A3A3A3` |
  | `--accent` | `#111111` | `#FFFFFF` |
  | `--on-ink` | `#FFFFFF` | `#000000` |
  | `--band` | `#111111` | `#242424` |
  | `--band-header` | `#161618` | `#1C1C1C` |
  | `--on-band` | `#FFFFFF` | `#FFFFFF` |
  | `--dim` | `#5F5F62` | `#7A7A7A` |
  | `--mark` | `#777773` | `#767676` |
  | `--glow` | signal at 0.26 | signal at 0.64 |

  Signal, signal press, on signal and the sport colours keep D261's values. On the night paper the type tokens read
  at 4.5:1 or better (text 21, muted 8.3, dim 4.9, mark 4.6); in the day, muted reads 4.6 on the paper and 5.1 on a card.
  The glow is a radial light, 150% wide and 56% tall, centred above the top edge, fading out by 68%. The primary
  button's glow is a 28px signal shadow at 0.42.
- **Released:** v0.252.0 (MINOR, Mario 2026-10-30).
