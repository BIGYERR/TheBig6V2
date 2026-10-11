# V239 ruling D234 P-ISLANDPILL (coach, 2026-10-09)

Saved verbatim from coach's return by the main session, before any builder brief. Evidence:
`tests/measure/v239_rulings/measure_islandpill_m2.md`, `m2_week_17pro_sim.png`. Prior ruling: `v239_ruling_d233.md`
(whole, including the concurrence and "Mario's redirect"). Mario's concurrence is recorded at the foot of this file once he
answers.

---

**D234 — P-ISLANDPILL: inside the native app the rest tab becomes the island pill; the card hangs from it; drag and the intro go; no island, no pill**

Evidence read: `/Users/CanasBangin/Desktop/TheBig6V2/tests/measure/v239_rulings/v239_ruling_d233.md` (whole, incl. concurrence and redirect), `/Users/CanasBangin/Desktop/TheBig6V2/tests/measure/v239_rulings/measure_islandpill_m2.md` (whole), `m2_week_17pro_sim.png`, index.html V239 tree L853–876, L1193–1210, L1607, L7653, L14014–14146, L14251, L18104, L283/490/508/703, CSS vars L8–12, `app/plugins-src/ia-island/*`, handoff L443 (orange reserved for live affordances, the running rest timer named). Printed this session on the V239 tree with D233's edits: `weeks 14 | startDate null | seed 76308 | digest 2d35e8f743680cfa`, self-stable. Facts that bind the ruling: nothing but the card's Start button starts the clock (0 callers of `ruStart`/`ruToggle` outside L14008–14150), so a pill hidden at idle leaves no way to start a rest; `ASY_ICON_PATHS` has no timer or pause glyph; the e2e and the Angular host never stub `iaIsland` (the e2e exercises the PWA arm, unchanged).

**Coaching argument.** The rest clock is the one control the athlete touches between every set. Mario is right that the island is where the eye already goes: iOS trained it. D233 put our clock there only while the app is away; D234 puts it there while the app is in front, drawn by us, in the same two slots D233 R4 defined (leading glyph, trailing clock), so the athlete reads one layout whether he is in the app or on the lock screen. The edge tab existed to stay out of the way; a pill around the camera is already out of the way, so the tab's survival kit (drag, the discovery wiggle) has no job left. One caution: a pill drawn around a cutout the device does not have is a bug the athlete sees on every screen, so the pill ships only where the island is confirmed.

**Ruling.**
- **R1 Arms.** Three, decided once at `_rtInit` and never flipped mid-session: PWA (no `window.iaIsland`) = V238 tab, byte-identical. Native with the island confirmed = the pill. Native without confirmation (notch, unknown, landscape, zoomed) = the tab, identical to the PWA. Confirmation is a boolean the plugin provides before boot; the session names it and its mechanism (m2 names `utsname` or `safeAreaInsets`; my pick is the model identifier, unknown reads false, so a new phone falls to the tab, never to a misdrawn pill). D233's clock arm keeps keying on plugin presence; D234 keys on the island boolean; the two are independent.
- **R2 The pill.** Shows whenever the tab shows today (`updateRestFloat` L14134: a program active, on week/progress/bugs, over the day/swap/add overlays; hidden on Home and the wizard), at idle too, because Start lives in the card. Ink fill (`--accent`), no border, no orange ring. Centred in the `#restFloat` frame (the frame is centred, the cutout is centred, so x needs no constant); height and width enclose the cutout with clearance on every side using m2's numbers (cutout x 138.3, y 14, w 125.3, h 36.7 pt on the 17 Pro sim) and never enter the status clock column (right edge 96.7) or the Wi-Fi/battery column (left edge 315). Leading slot: a glyph mirroring D233's compact leading, timer while running, pause while stopped at a nonzero value, timer muted at idle; two inline SVG paths added to `ASY_ICON_PATHS` (chrome is `asyIcon()`, never emoji). Trailing slot: the clock, `m:ss`, no hundredths (the mini tab's format, L14026). Digits signal orange only while running (`.run` L859; handoff L443), muted bone (`--border2`) otherwise. The card keeps hundredths. No new text.
- **R3 Tap.** A tap on the pill opens the same `#rtCard` (Rest Timer / Start-Stop / Reset, every string and aria-label unchanged) hanging beneath the pill; the pill stays visible while the card is open. A second pill tap or the `›` Minimize button closes it. No outside-tap close (parity with today). Drag goes in the pill arm: `_rtWireDrag` is not wired on the pill or its card; the tab arms keep it.
- **R4 Stacking.** z 240 unchanged. The z 300 sheets, the update banner and the pops cover the pill as they cover the tab today; while a sheet is up the cutout shows bare, the normal iOS look. On the day detail the pill sits over the `#161618` header band (sticky z 10 inside the z 200 overlay) and fuses with it; glyph and digits still read. No CSS change to `.detail-header`.
- **R5 Intro.** `_rtPlayIntro` never runs in the pill arm; `_rtIntroPending` is consumed and cleared there with no animation. Both tab arms keep it.
- **R6 Does not change.** The PWA (tab, drag, intro, stacking, every string). D233 R1–R6, the Live Activity, its copy and its call log (D234 adds no island call). The clock machine (`_ruRunning`, `_ruElapsed`, `_ruStart`, `_ruClock`). Program output: HALF_MANNY `2d35e8f743680cfa`; `MANNY_DIGEST_BY_VERSION[239]` a reference row from `era_bump.py`. No `ia_` key: side and expanded state stay in memory.
- **R7 Copy.** No new athlete-facing string. The pill inherits the tab's aria-label `Rest timer, tap to open`.

**Before** (V239 tree, week screen, m2 screenshot): top 60 pt = status clock x 51–97, bare cutout, Wi-Fi/battery x 315–366, bone. Tab at the right edge, y about 400–493, `0:00` stacked vertically, orange border, draggable; card pops from the edge on the first program. Day detail: black band through the inset, tab over the content. Under a sheet: tab covered. PWA: same.

**After** (native, island confirmed):
| Screen | Top 60 pt | Timer |
|---|---|---|
| Week / Progress / Bugs, idle | status clock untouched; ink pill around the cutout, timer glyph left, `0:00` right (muted); Wi-Fi/battery untouched | no edge tab |
| same, running | digits orange, timer glyph | tap: card hangs under the pill |
| same, stopped 1:34 | `1:34` muted, pause glyph | card shows `1:34.xx`, button reads Start |
| Day detail | pill fused with the black band, digits and glyph read | no edge tab |
| Under a z 300 sheet / banner / pop | covered; cutout bare | returns when the sheet closes |
| Home / wizard | cutout bare | hidden, clock runs on |
| First program | no intro | pill at `0:00` |
Native without the island, and the PWA: every row reads as Before.

**Blast radius.** No goal, focus, calendar, week or card moves. Web: `_rtInit`, `updateRestFloat`, `_rtSetExpanded` (pill stays shown), `rtExpand` (toggle), two icon paths, CSS for the pill class; nothing in the clock or D233's seams. Native: the island boolean, `app/` only. Era tables: reference rows only.

**Gate rows** (new, in `g239_d233_island.js` or a sibling, through `tests/status.js`, `ia-version >= 239`; oracle = stub plugin with the island flag set both ways, g239's hand values 92340 = 1:32):
- `D234-pwa-tab` (R1, R6): no plugin: tab shown at idle, pointerdown sets `_rtDragging`, first program sets `_rtIntroTO`, strings and z 240 as V238.
- `D234-native-noisland` (R1): plugin present, flag false and flag absent: identical to D234-pwa-tab, and the clock still follows `Date.now` (D233).
- `D234-native-pill` (R2): flag true: frame carries the pill class, `#rtTab` displayed at idle reading `0:00`, `1:32` with no hundredths after 92340, `.run` present running and absent stopped, glyph slot non-empty.
- `D234-native-tap` (R3): pill tap opens `#rtCard` and the pill stays displayed; second tap closes; `›` closes.
- `D234-native-nodrag` (R3): the pointer sequence that moves the tab in D234-pwa-tab leaves `_rtDragging` false, `#rtAnchor.style.top` and `_rtSide` unchanged.
- `D234-native-nointro` (R5): first program with the flag: `_rtIntroPending` false, `_rtIntroTO` null, `#rtCard.style.animation` empty, card closed.
- `D234-native-screens` (R2, R4): display block on week/progress/bugs, none on Home and the wizard, driven as D233-hidden drives it.
- `D234-noislandcall` (R6): Start, Stop, Reset through the card with the flag produce exactly D233's call log.
- `D234-copy` (R7): `#restFloat` text nodes and aria-labels equal V238's; no new string.

**Open for Mario, each with my pick.** (a) Unknown or notch phone gets the tab, not the pill: ship. Counter: he asked for the pill and may own a notch phone; but a pill around a notch sits under the cutout and reads broken on every screen. (b) Glyph in the leading slot: ship, it is D233's layout drawn by us. Counter: the minimum is clock only, no new icons this build. (c) Intro dropped in the pill arm: ship. Counter: one card drop on the first program would teach the tap; iOS already taught it.
Acceptance on his device replaces m2's unknowns: the pill encloses the cutout with bone showing nowhere inside it, and the status clock and battery are untouched. A second device measurement widens the clearance; it does not reopen this ruling.

**Recommendation:** ship R1 to R7 in V239 beside D233, the pill only where the plugin confirms an island, the tab everywhere else, no new copy, no program movement.
**Counter:** ship the pill unconditionally in the native app since the native build is Mario's phone alone; I reject it because his model is unknown tonight and the tab arm costs nothing while the misdrawn pill costs the first impression.

---

## Mario's concurrence (2026-10-09, this chat)
- His phone: **has a Dynamic Island** (model not named).
- (a) Unknown or notch phone gets the tab: **concur** ("Yes, tab when unsure").
- (b) Glyph in the leading slot: **concur** ("Yes, icon + clock").
- (c) Intro dropped in the pill arm: **NO.** Mario: "i think the intro should be it popping up". R5 goes back to a fresh
  coach for the pill-arm intro only, as Amendment 1 below. R1–R4, R6 and R7 stand as ruled.
- Builder may build R1–R4, R6 and R7 before Amendment 1 lands. Nothing in the pill arm touches `_rtPlayIntro` or
  `_rtIntroPending` until it does.

---

## D234 Amendment 1 (coach, fresh spawn, 2026-10-09). Saved verbatim; it replaces R5 and answers Mario's "i think the intro should be it popping up"

**D234 Amendment 1 — R5 re-ruled: the pill arm keeps the first-program intro; the card drops out of the pill, holds, folds back in**

Evidence read: `/Users/CanasBangin/Desktop/TheBig6V2/tests/measure/v239_rulings/v239_ruling_d234.md` (whole, incl. concurrence); index.html L853–875 (rest CSS, `rtCardIntro`, `rtPillSettle`), L897–900 and L11933 (reduced motion: two CSS blocks, neither covers the rest timer; `_wkReduceMotion()` is the only JS check, used by the week-strip scoot), L7653, L14016–14057, L14080–14146; `tests/gates/g239_d233_island.js` L1–40, 127–173 (stub plugin, `sched` fake scheduler). Printed this session: `weeks 14 | startDate null | seed 76308 | digest 2d35e8f743680cfa` at `ia-version 239`. No `rt-pill`/`hasIsland` token in index.html yet: R1–R4 are not landed, so Amendment 1 lands with them or after.

**Coaching argument.** Mario is right and my counter stands as the reason: iOS taught the island, but nothing on the phone taught that this pill holds a card. One drop on the first program is the lesson; everything that was the edge tab's survival kit (the entry from off-screen, the wiggle, the rotation) stays with the tab. I read "it popping up" as the card popping into view beneath the pill, not travelling upward.

**Ruling (replaces R5; R1–R4, R6, R7 untouched).**
- **R5a Motion.** New keyframe pair for the pill arm only; `rtCardIntro`/`rtPillSettle` untouched. Drop: the card unfolds downward from the pill's lower edge (transform origin top centre), one overshoot of the `rtCardIntro` wiggle's own first-bounce size (6 px), settling to rest; no rotation, no horizontal travel. No pixel of the card is drawn above the pill's lower edge at any frame (builder picks clip or scaleY; on-device acceptance item). Timing is today's: 0.3 s delay, card at rest by the 2.2 s mark as today, fold begins at 2.2 s. Fold: the same path reversed in 0.34 s (the settle duration the file carries). Pill echo after the fold: scale 1 → 1.08 → 1 in 0.34 s (the 55% value of `rtPillSettle`), opacity untouched, never below 1 (a shrinking pill shows bone around the cutout, which D234's acceptance forbids); then animation cleared at the 420 ms cleanup as today. The pill stays displayed throughout (R3), so it never blinks.
- **R5b Trigger and cancel.** `_rtIntroPending` set at L7653 unchanged; `updateRestFloat` consumes it as today and dispatches by arm: tab arms `_rtPlayIntro`, pill arm the new routine. `_rtIntroTO` stays non-null from the first frame until the card is closed (the fold's timeout is stored in it), so a tap during the fold is still a tap during the intro. Cancel is `_rtDismissIntro` as today: pill tap during the intro = dismiss and close (`rtCollapse`, the toggle's natural result with the card open); card-body tap = dismiss and close (today's `else if(_rtIntroTO){rtCollapse();}`, re-homed on a plain tap listener since `_rtWireDrag` is absent in this arm; outside the intro a card-body tap does nothing, parity with today); Start/Reset/`›` already handle `wasIntro`, unchanged.
- **R5c Reduced motion.** Pill arm reads `_wkReduceMotion()` (the existing helper, L11933): under reduce, the card opens with no animation, holds to 2.2 s, closes with no animation, no pill echo. The lesson survives; the motion goes. Tab arms stay as today (R6).
- **R5d Copy.** No new string; the card's strings and the pill's aria-label are R7's.

**Before** (D234 After-table row): `First program | no intro | pill at 0:00`.
**After:** `First program | pill at 0:00 throughout; at 0.3 s the card unfolds down from the pill, one 6 px overshoot, holds; at 2.2 s folds back up in 0.34 s; pill pops 1.08 and settles | any tap on pill or card cancels and closes; Start during it starts the clock and closes the card`. Reduced motion: card shows at 0.3 s, gone at 2.2 s, no motion. PWA and no-island arm: the V238 intro, unchanged.

**Blast radius.** No goal, focus, calendar, week or card moves; HALF_MANNY stays `2d35e8f743680cfa`. Web: `updateRestFloat`'s intro branch (dispatch only), one new intro routine, two new keyframes, one card tap listener in the pill arm. Nothing in the clock machine, D233's seams, or `_rtPlayIntro`.

**Gate row** `D234-native-intro` (replaces `D234-native-nointro` in the licence file; `ia-version >= 239`; stub plugin flag true, `sched` fake timers, DOM state only): (1) after the first in-program screen: `_rtIntroPending` false, `_rtIntroTO` non-null, `#rtCard` display block, `#rtCard.style.animation` names the new drop keyframe and not `rtCardIntro`, `#rtTab` display flex (the tab arm hides it: discriminator against V238-relabelled); (2) at 2200+340 ms: card display none, pill animation names the echo keyframe, `_rtIntroTO` null; at +420 more: pill animation empty; (3) fresh boot, pill tap at 500 ms: `_rtIntroTO` null, card display none, both animations empty, call log empty; (4) fresh boot, Start at 500 ms: call log exactly `[run(D0)]`, card display none; (5) fresh boot with `matchMedia` stubbed to matches true: card display block at 500 ms with empty animation, display none at 2200 ms, pill animation empty throughout. Fails on the V238 body relabelled 239 at (1).

**Recommendation:** ship R5a–R5d in V239 beside R1–R4, R6, R7: a downward drop with one overshoot and no rotation, today's timings, a pill echo that never shrinks, reduced motion honoured in this arm only.
**Counter:** skip the pill echo and reduced-motion branch for the smallest build; I reject it because the echo is what points the eye at the tap target, and a pill scaling around the camera is exactly what the reduce setting exists to suppress.

(Main session: nothing is left open for Mario; he answered this call before the amendment. Amendment 1 is built as ruled.)

---

## D234 Amendment 2 (coach, fresh spawn, 2026-10-09). Saved verbatim. R2 is re-ruled on two premises refuted in slice D (the existing `pause` key; the cellular slot at x 288)

**D234 Amendment 2 — R2 re-ruled on two refuted premises: the stroked `pause` stays; the pill shrinks on the right, the clock takes the leading slot, the glyph the trailing cap**

Evidence read: `/Users/CanasBangin/Desktop/TheBig6V2/tests/measure/v239_rulings/v239_ruling_d234.md` (whole), `measure_islandpill_m2.md`, `m2_week_17pro_sim.png`, index.html L1226–1232 (`ASY_ICON_PATHS`: `pause` = two stroked rects, `clock`, builder's `timer`; `asyIcon` wraps every path in `fill="none" stroke-width="2"`), L876–884 (slice D CSS), L14031–14040 (`_ruRender`), L14142–14147, `tests/edits/v239_d234_sliceD.py`, `app/plugins-src/ia-island/src/ios/widget/RestTimerWidget.swift` L30–60, `THE_ASYLUM_DS_REFERENCE.md` L67–70, `v239_row_ruled.txt` L18. No program output is touched; HALF_MANNY not re-printed (R6 stands).
Two findings beyond the brief's premises. (i) `1:00:00` never occurs: `_ruRender` prints `m+':'+_rtPad(s)` with minutes unbounded, so an hour reads `60:00` (5 chars) and 6 chars begin at `100:00`. (ii) The widget's compact clock is a fixed 48 pt (`compactClockWidth`); no slot beside the cutout can hold that inside 96.7..288, so D233's slot order cannot be mirrored on this frame. The semantics still mirror (timer running, pause stopped, orange only while running).

**R2a Glyphs.** Reuse the existing stroked `pause`; `timer` as builder added it. The DS reference defines one iconography (24 viewBox, 2 px stroke, `currentColor`) and `pause` is one of its 27 icons; the pill is app chrome and reads beside the app's icons, not beside SF Symbols, and the widget's `timer` is already SF's drawing, so the two surfaces differ in glyph family by design. At 12 pt on a 3x display each bar is 3 pt wide with a 1 pt slit: bars. A filled pause would be the first filled icon in the system and needs per-rect `fill` overrides inside a stroke-only wrapper. If the on-device check shows the slit muddies at 12 pt, the fallback is a NEW key `pauseFill` (rects with inline `fill="currentColor" stroke="none"`), never a second `pause`.
**R2b Bounds** (17 Pro sim, 402 pt frame; every number from m2 or slice D). Top 11, height 43 unchanged (3 / 3.3 clearance). Left bound 99 unchanged. Right bound 279 = 288 − 9: the cellular slot starts at 288 and 9 pt is the status bar's own inter-item gap (dots 306 to Wi-Fi 315). Width 180, centre 189 = frame centre − 12 (`left:50%; translateX(-102px)` or equivalent). Asymmetric by necessity: iOS leaves 41.6 pt left of the cutout and 24.4 right.
**R2c Slots.** Leading tail 99..138.3 (39.3) holds the clock, left-aligned 3 pt in from the pill end (text starts x 102). DOM order reversed: `#rtGlyph` becomes the LAST child of `#rtTab`. Trailing cap 263.6..279 (15.4) holds the glyph: box 12×12, `asyIcon(key,12)` (glyph height = clock font size), 3 pt in from the right end (x 264..276; 0.4 from the drawn cutout edge, ink on ink, invisible). Colours as R2.
**R2d Clock sizes.** 4 chars (`0:00`..`9:59`): 12 px, 28.8 wide, ends 130.8. 5 chars (`10:00`..`99:59`, which covers `60:00`): 11 px, the floor, = `.rt-cap` L865, the smallest type the rest timer already uses; 33 wide, ends 135, inside the 36.3 content width (12 px would be 36, inside by 0.15: too tight). 6 chars (`100:00`+): floor holds, the string's tail runs under the island's ink and is lost, never past the pill's left end; the card keeps the full value. No format change, no new string; the step is a class on `#rtMini` set by `_ruRender` from `main.length`.
**Does not change.** R1, R3, R4, R6, R7, Amendment 1. `#rtMini`'s `m:ss` format. The glyph semantics and `.run`. The tab arms. HALF_MANNY `2d35e8f743680cfa`.

**Before** (slice D as built): `pill x 99..303, y 11..54 | glyph 15 in a 16 box, leading | clock 12 px trailing, 35.4 slot | 10:00 0.6 over | cellular 288..306 fully under the pill`.
**After**: `pill x 99..279, y 11..54 | clock 12 px leading at x 102 (11 px from 10:00) | glyph 12 trailing at x 264..276 | cellular 9 pt clear, clock 2.3 pt clear as before | 60:00 reads 60:00`. Everything else in D234's After table reads as ruled, with "glyph left, clock right" read as "clock left, glyph right".

**Gate row `D234-native-pill`** keeps its five assertions and gains three, all hand values (date arithmetic): `#rtGlyph` is `#rtTab`'s last child and its SVG carries `width="12"`; at 599000 ms `#rtMini` reads `9:59` without the five-char class, at 600000 reads `10:00` with it; at 3600000 reads `60:00` (not `1:00:00`). Licence line L18 reworded to name the trailing glyph and the 10:00 step; row name unchanged, so no manifest hunk. Geometry (180 wide, offset −12) has no layout oracle in the VM; it is proved on the device only.
**On-device acceptance** (Mario's phone, model unnamed): one continuous ink pill with the island inside it and no bone or grey anywhere inside its outline; every status clock digit visible with a hairline of bone before the pill; the signal bars, or the 5G/LTE label when Wi-Fi is off, fully visible with a gap about equal to the bars-to-Wi-Fi gap; Wi-Fi and battery untouched; `0:00` and the glyph whole, not clipped by the rounded ends; `10:00` all five digits visible. The status groups are edge-anchored and the pill centre-anchored, so a 393 pt phone brings each group 4.5 pt nearer: if the clock is touched, the overlap moves the left bound right by that amount and the tail shrinks with it. A second device measurement sets numbers; it does not reopen this ruling.
**Blast radius.** No goal, focus, calendar, week or card. Web: the pill CSS block, `_rtInit`'s glyph insertion (append, not prepend), `_ruRender`'s pill branch (size 12, the length class). Native: nothing.

**Recommendation:** ship R2a–R2d: stroked `pause` reused, pill 99..279, clock leading at 12 px stepping to 11 px at five digits, glyph trailing at 12, the cellular slot 9 pt clear.
**Counter:** keep D233's order by shrinking the clock into the 15.4 pt cap; I reject it because `9:59` at the 11 px floor is 26.4 pt wide and does not fit, so the only two-slot layout the measured frame allows is clock left, glyph right.

(Main session: nothing is left open for Mario. He is told, as information, that the slot order flipped from the sketch he picked, "◷ 1:32", to clock left and glyph right, because the measured frame forces it.)

---

## D234 Amendment 3 (coach, fresh spawn, 2026-10-10). Saved verbatim. R3 is re-ruled on m3 (iOS takes taps in the status bar strip). Mario's concurrence is pending

**D234 Amendment 3 — R3 re-ruled: the pill keeps its tap; in the pill arm the native app hides the status bar so the strip is ours; m4 proves delivery before builder**

Evidence read: `/Users/CanasBangin/Desktop/TheBig6V2/tests/measure/v239_rulings/v239_ruling_d234.md` (whole), `v239_ruling_d233.md` (foot), `measure_pilltap_m3.md` (whole), `m3_pill_idle_17pro_sim.png`, index.html L853–893, L14174–14220 (the pill's only tap is a `click` listener on `#rtTab`), L56/108/285/607/703 (every header band pads by `env(safe-area-inset-top,44px)`), `app/plugins-src/ia-island/src/ios/IAIsland.swift` L55–90 (`islandModels`, `info`), `app/config.xml` (no status bar preference today), `tests/gates/g239_d234_pill.js` L178/262 (`E.tap` fires a synthetic `click`), licence L172. Printed this session: `weeks 14 | startDate null | seed 76308 | digest 2d35e8f743680cfa` at `ia-version 239`.

**Finding.** m3: a pill tap never reaches the page; the status bar strip (y 0 to about 54 on the 17 Pro sim) takes it as scroll-to-top. Start lives only in the card (D234 facts: 0 callers of `ruStart` outside it), so a pill that cannot be tapped has no Start. R3 is load-bearing, not polish; the pill arm cannot ship with it broken.

**Coaching argument.** Mario's ask was the timer we have, in the island, a tap dropping the card. iOS taught the island as a thing you tap. A pill you must not tap, with a handle hung below it (b), teaches the opposite, and every mistaken pill tap would still throw his week back to the top mid-set. (b) also has no numbers: the strip's edge is per model (50–58 here), the pill's bottom is 54 and the header band starts at the inset, so a handle is either a sliver or sits on the header. (a) is the only option where the pill is what it looks like. Its cost is real: no time of day, signal or battery while the app is open; a swipe from the top shows them.

**Ruling (replaces R3; every other clause stands unless named here).**
- **R3a Status bar.** Hidden in the native app exactly when the pill is drawn: the same native answer that sets `hasIsland` (`islandModels`), decided before boot, never toggled. Not hidden in the no-island arm; never on the PWA. It stays hidden on Home and the wizard: one boolean, no per-screen toggle, no animation, no new call from the page (R6 and `D234-noislandcall` unchanged). Mechanism and siting are the session's.
- **R3b Tap.** As R3: a pill tap toggles the card, the pill stays shown, `›` closes. The hit zone grows past the drawn pill by the pill's own top clearance, 11 pt (the file's `top:11px`), on the left, right and top, not the bottom: x 88–290, y 0–54, transparent. On a device the cutout (138–264 × 14–50) takes no touch, so the live target is the tails (39 and 15 wide); the zone must not depend on them alone.
- **R3c Geometry.** Amendment 2 stands as measured (99–279, 11–54, clock left, glyph right); the status items being gone does not reopen it. Amendment 2's acceptance items for the status clock hairline and the cellular gap retire; its others stand. A centred or wider pill is a follow-up after the device check, not this build.
- **R3d Precondition (standing ruling 7).** m4 in the simulator before any builder slice, bar hidden: (1) m3's taps with the page scrolled open the card and do not scroll; (2) a tap at (60, 50) is delivered; (3) `.wk-topbar` computed `padding-top` equals its value with the bar shown (if the inset moves, every header band collapses under the pill and (a) is refuted); (4) a swipe from the top edge still opens Notification Center. If m4 refutes (a): V239 ships with `hasIsland` reporting false from the plugin (tab arm everywhere native, D233 intact), the pill code dormant behind the flag, gates unchanged; (b) becomes a new ruling with device numbers. That fallback needs no further coach spawn.
- **Intro and hang.** Amendment 1 and the R3 hang unchanged: the card drops from the pill's lower edge; the taps that cancel it are the same taps.
- **Gate.** `D234-native-tap` unchanged, name and assertions: it proves the page's click handler toggles the card, which is necessary and is all a VM can prove; UIKit delivery has no VM oracle and is proved by m4 (recorded) and on the device. The licence line for the row gains "(handler only; delivery is proved on device)"; no manifest hunk. The native status bar setting is checked by the native or e2e parity, never a `gate.sh` row.
- **Copy.** None. `Rest timer, tap to open` stays, and is now true.

**On-device acceptance** (Mario's phone, island confirmed): no status clock, signal or battery while the app is open; the pill alone around the island, ink everywhere inside its outline; with the week scrolled, a tap on the digits and a tap on the glyph each open the card and the page does not jump; a second tap closes it; header bands sit where m3 shows them; a swipe from the top edge still opens Notification Center and Control Center. **Unmeasured and named:** with music playing from another app, iOS may draw Now Playing in the island over the pill and take the tap. If it does, that refutes D234 as a whole, not this amendment: the fallback is the tab arm (`hasIsland` false) and a fresh ruling.

**Before** (m3, native, island): `Week, idle | status clock 00:04; ink pill 99–279; Wi-Fi/battery | tap: page scrolls to top, card never opens`.
**After**: `Week / Progress / Bugs / Day detail | no status bar; ink pill around the cutout | tap: card hangs under the pill; second tap closes` / `Home / wizard | no status bar; cutout bare | hidden, clock runs on` / `First program | as Amendment 1` / `Native without the island, and the PWA | status bar as today | as Before`.
**Blast radius.** No goal, focus, calendar, week or card moves; HALF_MANNY `2d35e8f743680cfa`. Web: one CSS rule in the pill block (the hit zone). Native: the status bar bound to the island boolean, `app/` only. Gates: none move; one licence comment.

**Recommendation:** (a), the status bar hidden in the pill arm only, m4 first, the hit zone widened by the file's own 11 pt, geometry and intro untouched, and the already-built tab arm as the fallback if m4 or the device says no.
**Counter:** revert native to the tab now and keep only D233, since a workout app that hides the clock and battery for an hour to win a 43 pt target is a poor trade and Now Playing may cover the pill anyway; I reject it because Mario asked for the pill twice, m4 costs minutes, and the fallback is one boolean away if either check fails.

### Mario's concurrence on Amendment 3 (2026-10-10)
- "Do you usually have music playing from your phone while you train?": **"Yes, most sessions."**
- Path: **"Hide status bar, keep pill (Recommended)"**. Amendment 3 is concurred. Its R3d precondition (m4) runs before
  any builder slice. Because music plays most sessions, the main session also measures Amendment 3's named unmeasured
  risk (another app's Now Playing in the island over the pill) as m5, before m4.

## D234 is PARKED: Mario's decision, 2026-10-11, after m5
m5 (`measure_nowplaying_m5.md`): with another app's audio playing, iOS's Now Playing island covers the pill entirely.
Mario plays music "most sessions". Amendment 3 named this case: "that refutes D234 as a whole, not this amendment: the fallback is the
tab arm". Offered "Pull it, park it" or "Keep it in, switched off", Mario chose **"Pull it, park it (Recommended)"**.
- V239 ships **D233 only**: the Live Activity outside the app, and the V238 floating tab inside it.
  - index.html returns to the tree gatekeeper's first draft proved GREEN (sha256 `5b26f5cf…`, builder's `pre_sliceD.html`).
  - The licence file returns to its 12 D233 rows (sha256 `29283816…`, as proved).
- The D234 work is parked under `tests/parked/v239_d234_islandpill/`, outside every gate and sabotage glob: slices D–F, the gate
  `g239_d234_pill.js`, the spec `v239_d234.json`, the D234 licence rows, and the native N3 patch (the `hasIsland` info action
  and model list). It is resumable by a future ruling. Mario was offered "pill only when no music is playing" as an example; it is unruled.
- The R1–R7 and Amendments 1–3 text above stays as the record. None of it ships in V239. D-codes stay issued: D234 is used.
