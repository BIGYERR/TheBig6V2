# Night mode: decisions

The app's look in the dark: a second palette on the colour tokens the app draws with (`frontends/app/src/legacy/src/css/base.css`),
and the setting that picks it. Measure: `tests/measure/night-mode_colour-literals.js` and its saved report. Tests:
`tests/unit/night-mode.test.ts` and `tests/integration/night-mode.test.ts`.

## D261 P-NIGHT: a night palette, following the phone by default, with Day and Night overrides

- **Date:** 2026-10-28. **Ruled by:** Mario. He asked for a night mode ("ay we need a night mode"), was shown a preview
  on his Half Manny program (This Week and the session sheet, day beside night, on a scratch copy of v0.250.0), and
  concurred with both recommendations: the phone decides by default with a Day and Night override ("1. concur"), and the
  look as shown ("2. looks great!"). No coaching doctrine is involved: no program output moves.
- **Finding:** the app locks the day look even when the phone is dark (`base.css`, "Lock light regardless of system or
  WebView color scheme"). It draws through 30 colour tokens on `:root` (1,543 `var(--…)` uses), but 289 colour literals
  in 31 files bypass them (measure on v0.250.0): 135 in the CSS, 94 in the legacy JS, 1 in the head, 40 in the Angular
  screens the native app ships. Under a night palette each of those stays a day colour. The preview showed the worst
  case: the session sheet's header keeps its dark band while its title takes the night ink, and the title vanishes.
  The same header uses `--on-ink` for two jobs, type on a filled accent button and type on a dark band, which a night
  palette has to split.
- **Changes:**
  1. **The setting.** The home screen (Your Programs) carries a "Look" row under Build New Program: Auto, Day, Night.
     Auto is the default and follows the phone (`prefers-color-scheme`); Day and Night override it. The choice is stored
     in `localStorage` key `ia_theme` as `day` or `night`; no key means Auto. The caption reads "Auto follows your phone."
  2. **The night palette** (the look Mario approved): warm ink paper, bone type, the same rationed signal, lifted to read.

     | Token | Day (unchanged) | Night |
     |---|---|---|
     | `--bg` | `#F4F1E8` | `#12110D` |
     | `--surface` | `#FBFAF5` | `#1B1A15` |
     | `--surface2` | `#ECE7DA` | `#24221C` |
     | `--surface3` | `#E0DACA` | `#2E2B23` |
     | `--border` | `#D5CEBD` | `#38342B` |
     | `--border2` | `#BCB29B` | `#514B3E` |
     | `--text` | `#181712` | `#ECE7DA` |
     | `--muted` | `#6B6557` | `#9C9584` |
     | `--accent` | `#181712` | `#E4DFD2` |
     | `--on-ink` (type on an accent fill) | `#F4F1E8` | `#12110D` |
     | `--signal` | `#CF4E1A` | `#E2622B` |
     | `--signal-press` | `#AE3F12` | `#C4501E` |
     | `--on-signal` | `#FBF6EE` | `#12110D` |
     | `--run`, `--green` | `#5e8c54` | `#86B27A` |
     | `--bike`, `--swim` | `#3f6e96` | `#7FA6C9` |
     | `--lift` | `#bc6a43` | `#D98A63` |
     | `--hip` | `#7e5e96` | `#AB8CC4` |
     | `--core` | `#a6822f` | `#CFA752` |
     | `--red` | `#9e3328` | `#D9665A` |

     Each `-dim` token keeps its 0.15 alpha over its colour's night value.
  3. **Dark bands stay dark.** The session sheet's header, the pop-up and RPE cards and the rest timer's edge tab are
     dark in the day look and stay dark at night, raised off the paper: new tokens `--band-header` (`#161618`, night
     `#211F1A`), `--band` (`#181712`, night `#24221C`) and `--on-band`, the type on them (`#F4F1E8`, night `#ECE7DA`).
     `--on-ink` keeps only its first job.
  4. **One home for every colour.** Each of the 289 literals becomes a token, or a tint of one
     (`rgba(var(--ink-rgb), 0.12)`), whose day value is the literal it replaces. New greys: `--dim` (`#5F5F62`, night
     `#837D6F`) and `--mark` (`#7D7668`, night `#7A7467`). Three kinds stay literal because they are the same in both
     looks: black scrims (`rgba(0,0,0,a)`), the Knicks pop-up colours and the toggle knob's white.
  5. **The page around it.** At night `color-scheme` is dark (the date picker and inputs follow), and the `theme-color`
     meta takes the night paper.
- **Does not change:** the day look. Every colour computes to the value it has on v0.250.0, so no day pixel moves; the
  proof resolves each token against the day palette. No program output and no stored program (HALF_MANNY unmoved at
  `e47eb1012ab04bff`). The website and the admin. The Dynamic Island timer (already ink). `config.xml`'s
  `BackgroundColor` stays bone: it is the native launch background before the page draws, so a night launch may show
  bone for an instant, checked on the phone.
- **Expected values:** the table above, typed from the preview Mario approved. On the night paper every type token
  reads at 4.5:1 or better (text 15.3, muted 6.3, signal 5.4, the six sport colours 5.4 to 8.4); `--dim` 4.6;
  `--mark` 4.1 (the day `--mark` is 4.0).
- **Released:** pending.
