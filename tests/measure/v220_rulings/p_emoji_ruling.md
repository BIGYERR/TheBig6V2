# P-EMOJI (amended 2026-09-23) — Dashes go everywhere; emoji stay only on the celebration pop-ups

Mario's scope change: "the dash removals are what i want and the emojis stay for the celebration pop ups nowhere else". This amendment replaces the 2026-09-22 ruling in full. Provisional code; real D-code assigned at builder dispatch.

## 0. Premise checks (unchanged from the first ruling)

- HEAD is 57b3ed8 = **V206**, working tree clean against it. All line numbers are V206 (measure's `v220_emoji_chrome.out.txt` numbers are V205, 3 lines lower after :11626). Builder anchors on quoted text, never on the number.
- **The Partial line does not exist** in V205, V206 or the working tree (`git log -S"still counts"` last moved it at V202). Nothing to rewrite. If Mario sees it on his phone, the phone is on a pre-V202 build (§11c triage).

## 1. Celebration pop-ups KEEP their emoji (workout, streak, season tiers, and the Wildcard which fires the workout tier)

Kept as-is, no edit, no innerHTML switch: `POP_CFG.workout/.streak/.season` icons 🎉 🔥 🏆 (:17117, :17119, :17120); every emoji in `POP_POOLS.workout/.streak/.season`; the streak kicker `'-DAY STREAK 🔥'` (:17285); `POP_DISMISS` including `good looks 😒` (:17127) and `save it 🫳` (:17131), the new labels are dropped; the confetti 🏆 particle and `trophyDrop` (:17201-17213), no longer cut; the HTML default `🎉` (:17456). `You lit! 🔥` (:17068) keeps its flame.

## 2. Dash fixes stay IN, emoji kept (9 pool strings, edit in place, never reorder: `ia_pop_idx_` stores indices)

| V206 line | Pool | Old | New |
|---|---|---|---|
| 17062 | workout | `Congrats... you actually showed up. Just, you know — faster next time. 🎉` | `Congrats... you actually showed up. Just, you know, faster next time. 🎉` |
| 17064 | workout | `Look at you — vertical, sweaty, and useful. Goddamn miracle. 🫡` | `Look at you. Vertical, sweaty, and useful. Goddamn miracle. 🫡` |
| 17069 | workout | `Sweat now or be wheezing on the way up to your 8-story walk-up. 🚶😤` | `Sweat now or be wheezing up eight flights of stairs later. 🚶😤` |
| 17080 | workout | `Quit looking for a medal — it's under your tetas, find it later. 🥇` | `Quit looking for a medal. It's under your tetas, find it later. 🥇` |
| 17087 | workout | `You did the whole thing — looked dead ugly on that last set, but you finished. 💀` | `You did the whole thing. Looked dead ugly on that last set, but you finished. 💀` |
| 17088 | workout | `Por favor! Twenty minutes finding the right playlist, ten minutes lifting. But okay — "workout complete." 🎧` | `Por favor! Twenty minutes finding the right playlist, ten minutes lifting. But okay, "workout complete." 🎧` (inner-quote JS escapes stay) |
| 17095 | reminder | `You disappeared on a workout. Your record, your call — fix it. 📋` | `You disappeared on a workout. Your record, your call. Fix it. 📋` (emoji fate per §5) |
| 17108 | season | `You saw it through. Rare as fuck — most quit at week two like little bitches. 🐔` | `You saw it through. Rare as fuck. Most quit at week two like little bitches. 🐔` |
| 17112 | season | `You outlasted every weak-ass excuse your brain coughed up. Respect, animal. 🧠❌` | `You outlasted every weak ass excuse your brain coughed up. Respect, animal. 🧠❌` |

## 3. Reminder rider stays IN (text only, the strings the athlete actually reads on the reminder tier)

| V206 line | Old | New |
|---|---|---|
| 17345 | `More than a week off. Mark what happened, then ease back in — first sessions back at reduced effort. Never chase missed work.` | `More than a week off. Mark what happened, then ease back in. First sessions back at reduced effort. Never chase missed work.` |
| 17346 | `This one got away from you. Mark it and move on — the week ahead stays as written. Never cram a missed session back in.` | `This one got away from you. Mark it and move on. The week ahead stays as written. Never cram a missed session back in.` |

## 4. Outside the pop-up: emoji go, exactly as first ruled (innerHTML hosts, `asyIcon` used directly, no new icon drawn)

| Surface | V206 line | Old (rendered) | New (rendered) | Rule |
|---|---|---|---|---|
| Wizard seed caption | 2618 | `📈 Estimated from “X” — edit if you know better.` | `[chart] Estimated from “X”. Edit if you know better.` | 📈>chart exists; wizard idiom is inline `asyIcon` (19 uses). Em-dash fixed in the same string. Size to the line as :13204 does (`asyIcon('history',13)` on a 12px control). |
| Wizard seed header | 2623 | `📈 Seed from “X”?` | `[chart] Seed from “X”?` | same icon; text unchanged. |
| Week-view recovery banner | 11632 | `♻️ Recovery spacing: <note>` | `Recovery spacing: <note>` | No existing icon carries the meaning; the bold label leads. `legRecoveryNote` TEXT untouched (g205_pace_eve.js D36 matcher and sabotage v205.json anchor survive). |
| Day-card log nudge | 13511 | `📋 You logged this one but never marked it. [Mark Done ✓]` | `[notebook] You logged this one but never marked it. [Mark Done ✓]` | An unmarked log is the record with a hole. `Mark Done ✓` is class B, stays. |
| Progress program chip | 15605 | `🗄 <name>` | `[history] <name>` | Load-bearing archive mark; `history` already means "what you did before" (:13204, :16826). |

Encoding: these five are backslash-u surrogate escapes in source (measure column `js-escape`), not glyphs. Anchor on the escape text; `grep -c` must return 1 for each before writing.

## 5. OPEN, Mario's call: are the non-celebration uses of the same modal "celebration pop-ups"?

Reminder tier: `POP_CFG.reminder` 👀 (:17118) and the dead reminder pool (:17091-17095). Injury calls: BACK IN 🛡️ (:15053, :15078), CHECK IN better 🛡️ (:15089), CHECK IN worse ⚠️ (:15097).

**Recommendation: they are not celebrations and lose the emoji.** The reminder is the coach chasing an unmarked day; "Two weeks and trending worse" under ⚠️ is a referral, not a party. Replace with icon NAMES: reminder `notebook` (same mark as the day-card nudge, same meaning), injury `shield` ×3 and `warning` ×1 (`warning` already heads three caution labels at :13712/:13827/:13837). Strip the five dead reminder-pool emoji so the gate can assert zero. Mechanism (builder): the slot becomes innerHTML; a value that is an `ASY_ICON_PATHS` name renders through `asyIcon(name, 52)` (52 is the existing `.pop-icon` font-size), any other value is written as-is. **Do not pass emoji through `asyIcon`**: 🔥 and 🏆 are mapped keys and would silently convert the streak and season tiers to SVG against Mario's call.

**Strongest counter: one modal with two icon regimes (52px emoji on three tiers, 52px SVG on the other) is exactly the inconsistency the design system was written against, and reading "celebration pop-ups" as "the pop-up modal" drops the innerHTML switch and nine edits entirely.**

If Mario takes the counter: `POP_CFG.reminder`, the reminder pool emoji and the four injury icons are kept unchanged, and §6's allowlist widens to the whole modal.

## 6. New gate and sabotage

**Gate (allowlist):** zero raw class A/A2 pictographs in athlete-facing chrome, EXCEPT (a) inside the celebration pop-up strings: `POP_POOLS.workout/.streak/.season`, `POP_CFG.workout/.streak/.season` `icon` values, `POP_DISMISS`, the streak kicker at :17285, the confetti particle at :17208, the `popIcon` HTML default at :17456; (b) `ASY_EMOJI` keys (:1205); (c) `asyIcon()` arguments (routed, they render SVG). If §5 goes to the counter, (a) widens to `POP_POOLS.reminder`, `POP_CFG.reminder` and the four injury `icon:` values. Oracle: measure's classifier in `tests/measure/v220_emoji_chrome.js`, plus a hand table of the eleven After strings in §2-§3 asserted by exact text (a copy change is a matcher change, V206). Run it on V206 first: it must FAIL there (five inline hits, nine dashes) and pass on the build.

**Sabotage (each must trip the new gate by name):** (1) re-insert ♻️ at the recovery banner :11632; (2) re-insert 📋 in the log nudge :13511; (3) restore the em-dash in :17062; (4) restore `8-story walk-up` in :17069; (5) if §5 goes to the recommendation, re-insert 👀 in `POP_CFG.reminder`. **Allowlist self-check (not a probe):** adding an emoji inside `POP_POOLS.season` must NOT trip; if it does, the allowlist is wrong.

## 7. Count

**16 strings change** on the ruled scope: 9 pool dash fixes (§2), 2 reminder rider (§3), 5 inline chrome (§4; the wizard caption is one string carrying both the icon and the dash fix). **25 if §5 goes to the recommendation** (+`POP_CFG.reminder` 1, +injury icons 4, +reminder pool emoji 4 more; :17095 is already counted).

## 8. Blast radius

- Engine: none. Every edit is outside `buildProgram`. Expected `HALF_MANNY` digest unchanged, no era-table row, 378-config lifting hashes unchanged. Gatekeeper asserts; coach did not measure the after.
- Pop-up copy: every workout and season fire on every program (the nine strings rotate by index). Reminder tier: text on every day-after reminder. Injury tier only if §5 goes to the recommendation.
- Wizard: athletes with prior recovery-run logs. Progress: athletes with an archived program. Week view: programs carrying a `legRecoveryNote`.
- Gates reading touched strings today: none (only the untouched `legRecoveryNote` text). Storage: no key changes; pool order and count (46) and dismiss order and count (7) unchanged.
- Handoff §3 line 319 ("still literal by choice: trash-talk/celebration copy-pool emoji, the 🏆 confetti particle") stays true; the handoff-update adds that inline chrome emoji outside the pop-up are gone.

Recommendation: ship the 16 as ruled and strip the reminder and injury icons to `notebook` / `shield` / `warning` (25 total), because a referral and a chase are not celebrations.
Counter: read "celebration pop-ups" as the modal itself, keep all pop-up emoji, ship 16 and no innerHTML switch.

## MARIO DECISION (2026-09-23, second pass)
- Pop-ups: emoji STAY on celebration tiers (workout, streak, season, Wildcard), incl. dismiss labels, kicker, confetti trophy. All dash fixes IN.
- Reminder tier and injury calls: ICONS (notebook / shield / warning), coach recommendation accepted. 25-edit variant.
- Outside the pop-up: emoji removed as ruled.
- Ship slot: HOLD for more screenshots.

## AMENDED BY P-RECOVBANNER (2026-09-23)
- The week-view recovery banner is deleted outright, so this ruling's ♻️ row (§3/§4 recovery banner), sabotage (1) (re-insert ♻️ at the recovery banner) and the §8/§10 week-view blast line are VOID. Counts 16→15, 25→24 (Mario took the 25 variant, so 24). P-RECOVBANNER slice ships first in the same build.
