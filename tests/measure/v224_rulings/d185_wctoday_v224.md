# D185 — The today cell owns the colour of everything it prints

Ruling for build P-WCTODAY, target V224. Coach spawn, saved verbatim (main session
saves every coach return before briefing builder, per CLAUDE.md).

## Finding (confirmed at V223, HEAD c19ba95, `ia-version` 223)

Two child rules inside the week-strip day cell declare their own colour and so escape
the today-cell override at `index.html:618`:

- `index.html:644` `.wk-day-num .wc-mark{color:var(--signal);}` and `:645`
  `.wc-mark{...color:var(--signal);...}` put the flame-plus-W mark in `#CF4E1A` on the
  `#CF4E1A` today background (contrast 1.00). The Wildcard mark is invisible on the day
  it is earned and appears only after midnight.
- `index.html:643` `.wk-day-num .chk{color:var(--run);}` puts the completion tick in
  `#5e8c54` on `#CF4E1A` (contrast 1.13). Since D179 ranks the cell centre
  `complete ✓ > Wildcard mark > skipped ✕ > date` (handoff §11f:467), this is the glyph
  the athlete sees on every training day he closes out on the day. It is the same defect,
  hit more often.

`:618` cannot rescue either because it colours the `.wk-day-num` div and inheritance
never reaches a span with its own declared colour. No `.wk-day.today .wc-mark` or
`.wk-day.today .chk` rule exists. The flame SVG is `stroke="currentColor"` (`asyIcon`,
`:1212`), so one colour on the span fixes flame and W together.

## Coaching argument

The today cell is the one the athlete looks at. It already claims its own foreground for
the label (`:617`), the number (`:618`) and the away underline
(`:625 .wk-day.today.away{border-bottom-color:var(--on-signal);}`): on signal, everything
reads in `--on-signal`. That is the established pattern and the design-system contract
(`THE_ASYLUM_DS_REFERENCE.md:26`: `--on-signal #FBF6EE` "text on signal"). The Wildcard
mark and the tick are foreground on that same cell and are the only two things on it that
were left out. A W the athlete cannot see on the day he did the work is a broken promise;
a tick he cannot see on the day he closed the session is the same promise broken every
training day. Neither glyph's meaning lives in its colour: the flame-W and the ✓ are
distinct shapes, and the label and number already surrender their colour identity on
today. Both fold into one rule.

## What changes (one edit, one line, CSS only)

Anchor: `.wk-day-num .wc-mark{color:var(--signal);}` (`index.html:644`, count==1).
Insert immediately AFTER line 645 (`.wc-mark{display:inline-flex;...}`), before
`.wc-mark-w`:

```
.wk-day.today .chk,.wk-day.today .wc-mark{color:var(--on-signal);}
```

Specificity 0,3,0 beats both `:643`/`:644` (0,2,0) and `:645` (0,1,0), and source order
also agrees, so the rule wins on both axes. Placing it beside the base rules rather than
beside `:617`/`:618` keeps the override next to the declaration it overrides. Builder may
use `var(--on-signal)` only; no new hex, no new variable.

### Before (colour table, hand cascade over raw CSS, light == dark)

| Case | Glyph | Foreground | Background | Contrast |
|---|---|---|---|---|
| Wildcard, today | flame + W | #CF4E1A (`:644`) | #CF4E1A (`:616`) | 1.00 |
| Complete, today | ✓ | #5e8c54 (`:643`) | #CF4E1A | 1.13 |
| Skipped, today | ✕ | #FBF6EE (inherits `:618`) | #CF4E1A | 4.10 (corrected post-gate; ruling text originally said "5.6+" — gatekeeper independently computed 4.1025 via sRGB relative luminance and builder's gate asserted against that figure, both correct) |
| Wildcard, not today | flame + W | #CF4E1A | #F4F1E8 | 3.91 |
| Complete, not today | ✓ | #5e8c54 | #F4F1E8 | ~3.4 |

### After (expected)

| Case | Glyph | Foreground | Background | Contrast |
|---|---|---|---|---|
| Wildcard, today | flame + W | #FBF6EE (new rule) | #CF4E1A | same as ✕ today |
| Complete, today | ✓ | #FBF6EE (new rule) | #CF4E1A | same as ✕ today |
| Skipped, today | ✕ | #FBF6EE | #CF4E1A | unchanged |
| Wildcard, not today | flame + W | #CF4E1A | #F4F1E8 | unchanged |
| Complete, not today | ✓ | #5e8c54 | #F4F1E8 | unchanged |

## What deliberately does NOT change (guardrails for gatekeeper)

- `:643`, `:644`, `:645`, `:646` stay byte-identical: non-today cells keep the signal
  mark and the run-green tick.
- `:616`, `:617`, `:618`, `:625` untouched.
- The skip ✕ (`:12025` region) keeps declaring no colour and keeps inheriting from `:618`.
- `wildcardMarkHTML` (`:11433`), `asyIcon` flame glyph (`:1212`), `renderWeekView`
  (~`:12026`), `wildcardTagHTML` (~`:12120`), `openDetail` tag (~`:14006`): no JS moves.
  Hero tag and day-detail tag render on `--surface` at 4.22 and stay byte-identical.
- `_onGold` (`:11768`, `:12031-12032`) top/bottom date-line map on the today cell:
  untouched, out of scope, unswept by measure. If a later sweep finds a collision there
  it is its own ruling.
- Dark media query (`:37-41`) untouched; dark stays identical to light.
- D179 centre ranking (`✓ > W > ✕ > date`) untouched. D71 placement of the mark and both
  tags untouched.
- `HALF_MANNY` digest does not move; no engine or `cfg` path is touched. Diff class: one
  CSS insertion, zero removals.

## Blast radius (coaching terms)

Every goal, focus and calendar, but only the week-strip cell that is TODAY, and only when
today carries a Wildcard record or a `complete`/`partial` status. Rest days, past days,
future days, `.dim`, `.pre` and `.away` cells: no change. No week grid, no session, no
prescription moves.

## Gate oracle (for gatekeeper, not engine-derived)

Hand WCAG contrast from the hex values in `:root` line 23/25 against the resolved rule
set for the four cases above; assert today+wc-mark and today+chk resolve to
`--on-signal`, non-today resolve to `--signal` / `--run`, and the ✕ carries no declared
colour. Sabotage: drop the new line (both glyphs back to <1.2), and drop only the `.chk`
half (proves the fold-in is asserted, not incidental).

## Ship or hold

Ship as V224. Pure rendering defect, no doctrine trade-off, one line, no engine change.
Nothing here needs Mario's doctrine call; tell him what he will see: on the day he
completes a session or logs a Wildcard, the tick or the flame-W now shows in cream on the
orange today cell, exactly as the day label and number already do.

**Recommendation:** ship one CSS line
`.wk-day.today .chk,.wk-day.today .wc-mark{color:var(--on-signal);}` inserted after
`index.html:645`, folding the `.chk` collision in because it is the same mechanism on the
same cell and the more frequently seen of the two.
**Counter:** the tick loses its run-green identity on today, but green on orange is 1.13
and unreadable, and the label and number already give up their colour on that cell, so
identity is carried by the glyph, not the hue.
