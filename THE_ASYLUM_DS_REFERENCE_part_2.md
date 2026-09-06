# THE ASYLUM — Design System Reference (distilled)

Single-file distillation of "The Asylum" Claude Design system as **actually implemented** in the app's `:root` + `asyIcon()`. Drop this in the project alongside the handoff. The full DS handoff zip (UI-kit screens, React components, raw token CSS) is **not** needed for ongoing work — its decisions live here and in the app. Re-drop the zip in a chat only if you need the original screen comps.

**Aesthetic:** warm light editorial / streetwear (Aimé Leon Dore / Palace references). Bone paper, ink ink, one rationed burnt-orange signal, rectilinear corners, Helvetica doing the talking. The inversion of the old dark-gym look.

---

## Color tokens (`:root`)

| token | value | role |
|---|---|---|
| `--bg` | `#F4F1E8` | app background (warm bone) |
| `--surface` | `#FBFAF5` | card / paper-0 |
| `--surface2` | `#ECE7DA` | sunken well |
| `--surface3` | `#E0DACA` | panel |
| `--border` | `#D5CEBD` | hairline |
| `--border2` | `#BCB29B` | strong line |
| `--text` | `#181712` | ink (primary text + primary actions) |
| `--muted` | `#6B6557` | muted text |
| `--accent` | `#181712` | = ink. Primary actions are ink, **not** a color |
| `--accent-dim` | `rgba(24,23,18,0.06)` | faint ink wash |
| `--on-ink` | `#F4F1E8` | cream text on ink surfaces |
| `--signal` | `#CF4E1A` | **burnt orange — LIVE/ACTIVE ONLY** |
| `--signal-press` | `#AE3F12` | signal pressed |
| `--on-signal` | `#FBF6EE` | text on signal |

**Signal doctrine — non-negotiable:** *"If everything is orange, nothing is live."* Signal appears ONLY on: the **today marker**, the **Start/open-session hero CTA**, the **Log button**, the **running rest timer** (time + control + progress fill), and **popup achievement** accents (kicker / GO / streak / glow). Everything else is ink. ~10 `var(--signal)` references total; keep it that way.

### Sport / category colors (muted earthy — hue kept, desaturated for paper)
| sport | value |
|---|---|
| `--run` | `#5e8c54` sage |
| `--bike` / `--swim` | `#3f6e96` denim |
| `--lift` | `#bc6a43` terracotta *(deliberately browner than signal so "lift" ≠ "live")* |
| `--hip` | `#7e5e96` plum |
| `--core` | `#a6822f` ochre |

Each has a `-dim` rgba at ~0.15 alpha. `--green` (status success) was unified to `--run` sage (shared hex). `--red` (status error) = `#9e3328` DS brick. Unused DS status tones available if needed: good `#4E6B43`, warn `#B07A1E`.

---

## Radii — rectilinear scale
`--radius-0:0` · `--radius-1:2px` (tags, small controls) · `--radius-2:4px` (cards, buttons, sheets) · `--radius-3:6px` (large surfaces only). **No pills.** `50%` reserved for true circles/dots only (toggle knob, timer control, dots, spinner). App reality: 4px standard, 2px tags, 6px on `wk-hero`, 50% on the four circle elements.

## Shadows — low, warm, never glow
- `shadow-1`: `0 1px 2px rgba(40,34,22,0.06)` — cards (lifted paper)
- `shadow-2`: `0 2px 6px rgba(40,34,22,0.07), 0 1px 2px rgba(40,34,22,0.05)`
- `shadow-3`: `0 8px 24px rgba(40,34,22,0.10), 0 2px 6px rgba(40,34,22,0.06)` — modals/sheets (popup uses this)
- `shadow-inset`: `inset 0 1px 2px rgba(40,34,22,0.08)`

App reality: `shadow-1` on the five primary cards (`prog-card`, `day-card`, `summary-block`, `wk-hero`, `section-block`); popup uses `shadow-3`. Warm tint `40,34,22` — never `0,0,0`, never blurred colored glows.

---

## Typography
- `--font-display`: `'Helvetica Now Text','Helvetica Neue',Helvetica,'Geist',Arial,sans-serif` — headings, labels, buttons, big numbers.
- `--font-text`: `'Helvetica Neue',Helvetica,'Geist','Helvetica Now Text',Arial,sans-serif` — body.
- `--font-mono`: `'Geist Mono',ui-monospace,'SF Mono',Menlo,monospace` — **technical readouts only** (rest timer, cardio timer, set counter).

**Loading:** Geist + Geist Mono via Google Fonts `@import` (free). **Helvetica Now Text is NOT shipped** — licensed Monotype, can't be redistributed in a public repo. On iOS/Mac the stack resolves to system **Helvetica Neue** (exactly the DS-intended look) with zero font files; Geist is the non-Apple fallback.

**Tracking** (Helvetica needs far less than the old Barlow Condensed): heavy caps tracking was pulled to DS range — display can go negative (`-0.02em` tight), labels `~0.06–0.08em`, max wide `~0.12em`. **Tabular figures** (`font-variant-numeric:tabular-nums`) on `body` so numbers don't jitter. Big "WEEK N" label is `white-space:nowrap`.

---

## Iconography — `asyIcon()` system (no emoji for UI)
Vanilla helper injected at top of main `<script>`: `asyIcon(nameOrEmoji, size)` → inline SVG string, 24×24 viewBox, 2px stroke, `currentColor`, `display:inline-block;vertical-align:middle`. Accepts an icon name OR an emoji (translated via `ASY_EMOJI`, variation-selectors stripped). **Unmapped input falls through to the original glyph** (safe). Icons inherit ink/signal via `currentColor`.

**27 DS icons (Lucide MIT):** home, dumbbell, chart, user, play, pause, check, plus, minus, x, chevronRight/Left/Down, clock, flame, trophy, bell, arrowRight, more, target, zap, calendar, history, sliders, skip.

**10 custom fitness marks (hand-drawn, same 2px style):** run, bike, swim, shield, sprout, flag, dice, backpack, bandage, **swap**. *(run + swim are bespoke — Lucide has no good equivalents; eyeball on device.)*

**`swap` (V102)** — two opposed horizontal arrows (exchange). Used on the exercise-card swap control at 16px, inheriting `--muted`.
```
<line x1="3" y1="8.5" x2="17" y2="8.5"/><polyline points="14 5.5 17 8.5 14 11.5"/>
<line x1="21" y1="15.5" x2="7" y2="15.5"/><polyline points="10 12.5 7 15.5 10 18.5"/>
```

**Emoji → icon map in use:** 🏅→trophy · 💪/🏋️/🦾→dumbbell · 🔥/💡→flame · ⚡→zap · ⚖️→sliders · 🛡️/🧠→shield · 🌱→sprout · 🏠→home · 🎒→backpack · 🏃→run · 🚴→bike · 🏊→swim · 📅→calendar · 📈/📊→chart · 🎲→dice · ⏱→clock.

**Left as emoji deliberately:** all trash-talk/voice emoji in toasts & popups (tone, not chrome); monochrome glyphs (← → ✓ ✕ ↓ ↺); and `textContent`-bound spots (pace 🎯, race-week 🏁) that can't hold SVG without an `innerHTML` refactor.

## Exercise swap components (V102)
**`.ex-swapbtn`** — 16px `swap` icon in a `--surface2` chip, `1px --border`, radius 4, `2px 6px` padding, `--muted`. Sits between `.ex-name` and `.ex-badge` on `.ex-namerow`. `:active` → `scale(.94)` + `--surface3`, matching the existing `.ex-logbtn` press feel. `touch-action:manipulation` (load-bearing — see the viewport invariant in the handoff).

**`.ex-swapchip`** — the "swapped in" readout on the card. Hairline `--border` top rule, 11px `--muted`, with `.ex-swapchip-lbl` in `--font-display` 700 / `0.06em` / **`--signal`** (one of the few earned signal-orange uses: a live deviation from the prescribed plan). `.ex-swapundo` is an underlined text button pushed right with `margin-left:auto`.

**Swap sheet** reuses the existing full-screen `.overlay` slide-up chrome and `.detail-header` / `.dh-back` / `.dh-over` / `.dh-title` — **no new sheet pattern was introduced.** New inside it:
- `.swap-tags` / `.swap-tag` — the job strip (`HINGE` · `LEG DAY` · `MAIN LIFT`). 10px display 700, `0.06em`, `--surface2` on `1px --border`, **radius 2** (the tightest rung on the rectilinear scale, correct for a chip this small).
- `.swap-sec-lbl` — 11px display 700 `0.07em` `--muted`, matching `.section-label`. **`.caution` modifier flips it to `--signal`** and adds top padding; that is the tier-2 header.
- `.swap-sec-sub` — 12px `--muted`, 1.4 line-height. The coaching sentence under each tier label.
- `.swap-cand` — full-width left-aligned button card, `--surface` on `1px --border`, radius 4, `12px 14px`. `.caution` swaps the border to `rgba(207,78,26,0.35)` (signal at 35%, never a solid signal border — that would read as an error state). `:active` → `scale(.99)` + `--surface2`.
- `.swap-cand-top` — name left (15px/500 ink), inherited prescription right (`--font-display` 13px/600 `--muted`, `nowrap`). The right-hand prescription is the whole point: it shows the numbers carry.
- `.swap-cand-note` — 12px `--signal`, the per-candidate trade-off line.
- `.swap-empty` / `.swap-foot` — 13px/12px `--muted`; the footer sits under a hairline top rule.

**Nudge popup** reuses `.pop-overlay` (`.show` → flex, existing `popIn` bounce). `.swap-nudge-card` is `--surface` on `1px --border2`, **radius 6** (top of the rectilinear scale — this is a modal, the largest surface allowed a corner). `.swap-nudge-hd` is the signal-orange overline; `.swap-nudge-yes` is a filled `--accent` / `--on-ink` primary; `.swap-nudge-no` is an outlined `--border2` / `--muted` secondary. One primary per view, per the DS.

**Copy note:** every user-facing string in this subsystem obeys the standing no-mid-sentence-hyphen / no-em-dash rule and is written in coach voice ("Nothing else in your kit does this job. Keep it, or mark the day Partial and move on."). Toasts stay conversational: "Trap bar deadlift in, deadlift out. Same job, same numbers."

## Loading mark — BarbellLoader
Replaces the old CSS spinner on the "Building Your Program" screen. Inline SVG, SMIL-animated (WebKit-native, no React): a 2px athlete driving an overhead squat, barbell pumping `1.5s/rep`, sweat flicking off in `var(--signal)` on the drive. Stroke = ink. Source component lived in the DS zip as `BarbellLoader.jsx`.
