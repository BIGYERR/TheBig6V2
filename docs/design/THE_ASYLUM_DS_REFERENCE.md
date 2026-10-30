# THE ASYLUM — Design System Reference (distilled)

Single-file distillation of "The Asylum" Claude Design system as **actually implemented** in the app's `:root` + `asyIcon()`. Drop this in the project alongside the handoff. The full DS handoff zip (UI-kit screens, React components, raw token CSS) is **not** needed for ongoing work — its decisions live here and in the app. Re-drop the zip in a chat only if you need the original screen comps.

**Aesthetic (D263 P-TRACK, v0.252.0, `docs/decisions/app-look.md`):** the Track look. Neutral paper and ink, true black at night, one rationed burnt-orange signal with a light glow behind each tab screen's top, round cards with no outlines, pill buttons, sentence case, heavy headline numbers, Helvetica doing the talking. It replaced the bone, rectilinear, all-caps editorial look the Claude Design system first shipped. The look's own sheet is `frontends/app/src/legacy/src/css/look.css`; the comparison Mario chose from is `docs/design/look-options.html`.

---

## Color tokens (`:root`, and the night palette of D261 on `:root[data-theme="night"]`)

| token | day | night | role |
|---|---|---|---|
| `--bg` | `#F3F3F1` | `#000000` | app background |
| `--surface` | `#FFFFFF` | `#161616` | card |
| `--surface2` | `#EDEDEA` | `#242424` | sunken well, date circles |
| `--surface3` | `#E1E1DD` | `#2E2E2E` | panel |
| `--border` | `#E3E3DF` | `#262626` | hairline |
| `--border2` | `#CFCFCA` | `#3C3C3C` | the line of an outlined pill |
| `--text` | `#111111` | `#FFFFFF` | ink (primary text + primary actions) |
| `--muted` | `#6E6E6A` | `#A3A3A3` | muted text |
| `--accent` | `#111111` | `#FFFFFF` | = ink. Primary actions are ink, **not** a color |
| `--on-ink` | `#FFFFFF` | `#000000` | text on ink surfaces |
| `--signal` | `#CF4E1A` | `#E2622B` | **burnt orange — LIVE/ACTIVE ONLY** |
| `--signal-press` | `#AE3F12` | `#C4501E` | signal pressed |
| `--on-signal` | `#FBF6EE` | `#12110D` | text on signal |
| `--glow` | signal at 0.26 | signal at 0.64 | the light behind each tab screen's top |

**Signal doctrine — non-negotiable:** *"If everything is orange, nothing is live."* Signal appears ONLY on: the **Start/open-session hero CTA** (with its glow), the **Log button**, the **running rest timer** (time + control + progress fill), **popup achievement** accents (kicker / GO / streak / glow), and, from D263, the **active week tab's underline**, the **phase pill**, the **active tab** in the floating bar, the **active program's card edge** and the **light behind each tab screen's top**. Today's date is an **ink ring**, not orange (D263 retired the orange today cell and D185's on-signal marks with it). Everything else is ink.

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

## Radii — round, by role (D263)
`--r-card:24px` (This Week's strip, hero and stats, program cards, the big sheet cards) · `--r-tile:16px` (blocks inside a sheet, exercise cards, inline cards) · `--r-field:12px` (inputs, wheels, date rows) · `--r-pill:999px` (every button, chip and tag). `50%` for true circles: the day strip's dates, dots, the toggle knob. Cards carry **no outline**: a surface fill on the page does the separating. Outlined pills (a 1.5px `--border2` line) are for secondary actions.

## Depth — one light, one glow (D263)
- **The glow:** `--glow-light`, a radial light 150% wide and 455px tall centred 130px above the top edge, painted behind the four tab screens (Your programs, This week, Progress, Bugs) and their sticky bars. Stronger at night.
- **The button glow:** `0 10px 28px rgba(var(--signal-rgb),0.42)` under the main signal button only: Start session, the session sheet's Done, the pop-up's main button.
- **The tab bar** floats: a 34px pill 12px in from each side, `--nav` fill blurred 20px, `0 10px 30px rgba(0,0,0,0.18)` under it.
- Nothing else glows. Cards sit flat (no shadow) on the page.

---

## Typography
- `--font-display`: `'Helvetica Now Text','Helvetica Neue',Helvetica,'Geist',Arial,sans-serif` — headings, labels, buttons, big numbers.
- `--font-text`: `'Helvetica Neue',Helvetica,'Geist','Helvetica Now Text',Arial,sans-serif` — body.
- `--font-mono`: `'Geist Mono',ui-monospace,'SF Mono',Menlo,monospace` — **technical readouts only** (rest timer, cardio timer, set counter).

**Loading:** Geist + Geist Mono via Google Fonts `@import` (free). **Helvetica Now Text is NOT shipped** — licensed Monotype, can't be redistributed in a public repo. On iOS/Mac the stack resolves to system **Helvetica Neue** (exactly the DS-intended look) with zero font files; Geist is the non-Apple fallback.

**Case and tracking (D263):** labels are sentence case. No style sets `text-transform:uppercase`, and no label is typed in capitals; capitals stay on acronyms (RPE, AMRAP), on the session codes under each day (RUN, LIFT) and on a word stressed inside a sentence of copy. Tracking is never positive; headlines go tight (`-0.035em` to `-0.045em`) at weight 800 (Week N at 58px, a tab screen's title at 40px). Small labels that were capitals read at 12–13px. **Tabular figures** (`font-variant-numeric:tabular-nums`) on `body` so numbers don't jitter. Big "Week N" label is `white-space:nowrap`.

---

## Iconography — `asyIcon()` system (no emoji for UI)
Vanilla helper injected at top of main `<script>`: `asyIcon(nameOrEmoji, size)` → inline SVG string, 24×24 viewBox, 2px stroke, `currentColor`, `display:inline-block;vertical-align:middle`. Accepts an icon name OR an emoji (translated via `ASY_EMOJI`, variation-selectors stripped). **Unmapped input falls through to the original glyph** (safe). Icons inherit ink/signal via `currentColor`.

**27 DS icons (Lucide MIT):** home, dumbbell, chart, user, play, pause, check, plus, minus, x, chevronRight/Left/Down, clock, flame, trophy, bell, arrowRight, more, target, zap, calendar, history, sliders, skip.

**8 custom fitness marks (hand-drawn, same 2px style):** run, bike, swim, shield, sprout, flag, dice, backpack. *(run + swim are bespoke — Lucide has no good equivalents; eyeball on device.)*

**Emoji → icon map in use:** 🏅→trophy · 💪/🏋️/🦾→dumbbell · 🔥/💡→flame · ⚡→zap · ⚖️→sliders · 🛡️/🧠→shield · 🌱→sprout · 🏠→home · 🎒→backpack · 🏃→run · 🚴→bike · 🏊→swim · 📅→calendar · 📈/📊→chart · 🎲→dice · ⏱→clock.

**Left as emoji deliberately:** all trash-talk/voice emoji in toasts & popups (tone, not chrome); monochrome glyphs (← → ✓ ✕ ↓ ↺); and `textContent`-bound spots (pace 🎯, race-week 🏁) that can't hold SVG without an `innerHTML` refactor.

## Loading mark — BarbellLoader
Replaces the old CSS spinner on the "Building Your Program" screen. Inline SVG, SMIL-animated (WebKit-native, no React): a 2px athlete driving an overhead squat, barbell pumping `1.5s/rep`, sweat flicking off in `var(--signal)` on the drive. Stroke = ink. Source component lived in the DS zip as `BarbellLoader.jsx`.
