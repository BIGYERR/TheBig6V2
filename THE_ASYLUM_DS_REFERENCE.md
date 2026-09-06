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

**8 custom fitness marks (hand-drawn, same 2px style):** run, bike, swim, shield, sprout, flag, dice, backpack. *(run + swim are bespoke — Lucide has no good equivalents; eyeball on device.)*

**Emoji → icon map in use:** 🏅→trophy · 💪/🏋️/🦾→dumbbell · 🔥/💡→flame · ⚡→zap · ⚖️→sliders · 🛡️/🧠→shield · 🌱→sprout · 🏠→home · 🎒→backpack · 🏃→run · 🚴→bike · 🏊→swim · 📅→calendar · 📈/📊→chart · 🎲→dice · ⏱→clock.

**Left as emoji deliberately:** all trash-talk/voice emoji in toasts & popups (tone, not chrome); monochrome glyphs (← → ✓ ✕ ↓ ↺); and `textContent`-bound spots (pace 🎯, race-week 🏁) that can't hold SVG without an `innerHTML` refactor.

## Loading mark — BarbellLoader
Replaces the old CSS spinner on the "Building Your Program" screen. Inline SVG, SMIL-animated (WebKit-native, no React): a 2px athlete driving an overhead squat, barbell pumping `1.5s/rep`, sweat flicking off in `var(--signal)` on the drive. Stroke = ink. Source component lived in the DS zip as `BarbellLoader.jsx`.
