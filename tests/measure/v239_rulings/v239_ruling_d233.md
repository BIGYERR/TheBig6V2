# V239 ruling D233 P-ISLAND (coach, 2026-10-09)

Saved verbatim from coach's return by the main session, before any builder brief. Evidence:
`tests/measure/v239_rulings/measure_island_m1.md`. Mario's concurrence on the four open calls is recorded at the
foot of this file once he answers.

---

**D233 — P-ISLAND: the island mirrors the rest clock, and the rest clock moves to the wall clock**

Evidence read: `/Users/CanasBangin/Desktop/TheBig6V2/tests/measure/v239_rulings/measure_island_m1.md` (whole), index.html V238 L14010-14146, L14240-14252, L14790-14802, L1195-1215, handoff §446 and the D179 lines, `app/README.md`. Printed this session from the harness: HALF_MANNY digest on V238 = `2d35e8f743680cfa` = `MANNY_DIGEST_BY_VERSION[238]`.

**Finding.** The rest stopwatch is one state machine (`_ruRunning`, `_ruElapsed`, `_ruStart`, L14015) on one clock, `performance.now()`, at three sites (L14017, L14029, L14030). Nothing persists, nothing listens for background or resume (measure A). The L14014 header's "runs through screen-lock" is unmeasured, and handoff §446's "pauses on background" is false today (0 handlers). An iOS Live Activity is drawn by iOS from a wall-clock anchor. Left as is, the tab and the island would disagree after a lock by exactly however long WebKit stalled, and nobody could say which one was the rest he took.

**Coaching argument.** Rest is the time since the last set ended, as the wall clock measures it. Locking the phone, answering a text, changing the song: all of it is rest. A clock that stops when the screen does tells the athlete he rested less than he did, so he rests longer than he meant to on the heavy day. The island is the surface he sees while away from the app, so it must be the honest one, and the tab must agree with it to the second.

**Ruling.**
- **R1 One clock.** The stopwatch anchor becomes `Date.now()` at the three sites; `_ruStart` is an epoch ms. The island is started from that same anchor, so the two agree by construction and no resume handler is needed: the next 33 ms tick after unlock reads the right value. The PWA changes the same way, and that is the point, not a side effect: it makes the L14014 claim true. The harness already stubs `performance.now` as `Date.now` (tests/harness.js:121), so every gate has been proving wall-clock behaviour since the stopwatch landed; the app catches up to its gates. A backward clock jump is already clamped (L14021 `if(ms<0)ms=0`).
- **R2 The island follows the clock, not the tab.** Three states: running (anchor), stopped (frozen value), none. It appears in the native app only; in the PWA the seam notifier has no listener and nothing happens. The tab hiding on Home or the wizard (`updateRestFloat` L14130) does not touch it, because the clock keeps running there (L14033 comment).
- **R3 Ended, never left behind.** Reset, Done/Skip, the day-open zeroing of a stopped clock, and boot all END the activity. Boot ends every activity the app owns, so a reload and the island agree (0:00, nothing). The one window the app cannot close is between an iOS kill of the suspended app and the next launch; it is named here, and the session chooses the stale handling (siting; no constant ruled).
- **R4 Copy (Swift strings are athlete copy; the copy rule applies).** Rest clock only, never the session name: the clock is app-wide and survives navigation, so a day title would lie whenever the day is not open. No hundredths (the mini tab omits them too). The stopped word is "Stopped", because the tab's own button reads Stop, never Pause.
  - Compact leading: the `timer` glyph while running, `pause.fill` while stopped. No text.
  - Compact trailing: the clock, `1:32`. Stopped: the frozen clock.
  - Minimal: the clock alone, `1:32`; stopped: the frozen clock in the secondary colour.
  - Expanded, running: `Rest Timer` / `1:32` / `Your rest is on the clock.`
  - Expanded, stopped: `Rest Timer` / `1:32` / `Stopped. Tap to open the app.`
  - Lock screen banner: the expanded content, same two variants.
- **R5 Display only; a tap opens the app.** No App Intents this build. An intent runs in the extension and would have to write a state the web view reads back on resume; until then the island shows a stop the tab does not, which breaks R2. Buttons return once R1 is proven on device, writing through the same anchor.
- **R6 Scope.** No program output moves. HALF_MANNY stays `2d35e8f743680cfa` (printed this session, equal to the 238 era row). No `ia_` key: I rule no persistence. A reload returns 0:00 stopped today and boot ends the island, so they agree; persistence is a new behaviour (a rest clock that survives a relaunch) Mario did not ask for, and it would alter the PWA's reload too. Handoff §446's "pauses on background" is corrected in the handoff-update, docs only.

**Before** (V238, L14017 / L14029 / L14030 / L14032 / L14034 / L14797):
```
function _ruNow(){return _ruRunning?(performance.now()-_ruStart):_ruElapsed;}
function ruStart(){... _ruStart=performance.now()-_ruElapsed; ... setInterval(_ruRender,33) ...}
function ruPause(){if(_ruRunning){_ruElapsed=performance.now()-_ruStart;} _ruRunning=false; ...}
function ruReset(){ruPause();_ruElapsed=0;_ruRender();}
function ruResetIfIdle(){if(!_ruRunning){_ruElapsed=0;_ruRender();}}   // L14247, day open
  ruReset();  closeDetail();                                            // L14797, Done/Skip, D179
```
Island before: none at any seam. Lock mid-rest: tab value after unlock UNKNOWN (measure, Unknown 1).

**After** (seam by seam; the tab column is unchanged except the last row):
| Seam | Tab | Island |
|---|---|---|
| Start (L14029) | 0:00 starts running | starts, counting from the same epoch anchor |
| Resume after Stop | continues from frozen value | updated to running from the frozen value |
| Stop (L14030) | frozen `m:ss.cs`, button reads Start | frozen `m:ss`, pause glyph, `Stopped. Tap to open the app.` |
| Reset button / Done / Skip (L14032, L14797) | 0:00 stopped, overlay closes on Done/Skip | ended |
| Day open, clock stopped and nonzero (L14247) | 0:00 | ended |
| Day open, clock running | keeps running | keeps counting, untouched |
| Home or wizard (tab hidden) | clock runs hidden | keeps counting |
| Relaunch or reload | 0:00 stopped (L14015 initials) | ended at boot |
| Lock the phone 60 s mid-rest | **now** reads the wall clock after unlock | counts through, agrees to the second |
Acceptance on device: start, lock 60 s, unlock; tab and island read the same minute and second. That replaces measure's Unknown 1.

**Blast radius.** No goal, focus, calendar, week or card moves; HALF_MANNY and every era row stay. Web: three clock sites plus a notifier call at `ruStart`, `ruPause`, `ruReset`, the zeroing branch of `ruResetIfIdle`, and boot. Native: a new widget target and the strings above, `app/` only. g221_d179's "zero after Done" rows keep their meaning. Pages PWA: wall-clock rest, nothing else.

**Open for Mario (each with my pick).**
1. Wall clock on the PWA too: ship it. Counter: it changes a surface the island never reaches, for a stall nobody has measured on device.
2. No persistence this build: hold. Counter: WKWebView can be killed in the background while he is on music, and that is exactly when the island was worth having; a reload then shows 0:00 under an island the boot just ended. If the device test shows that reload during a normal rest, P-RESTPERSIST goes next.
3. Display only: ship it. Counter: stopping the clock from the island is the natural gesture and the reason to have it.
4. Clock only, no session name: ship it. Counter: a banner reading only "Rest Timer" is anonymous on a lock screen full of apps.

**Recommendation:** ship R1 to R6 as one build, the island as a strict mirror of the web clock with the web clock moved to `Date.now()`, display only, no persistence, no new key.
**Counter:** the stall is unmeasured, so the honest minimum build is the mirror alone on `performance.now()` with the device test first; I reject it because iOS draws the island from the wall clock no matter what, so the only way the two agree is for the tab to use the same clock.

---

## Mario's concurrence (2026-10-09, this chat)
1. Wall clock on the PWA too: **NO.** Mario: "i just want to push it to the iOS version not the PWA can we do that?"
   He then chose "Switched on in iOS only" over a wrapper-only patch. **R1 is amended:** the `Date.now()` anchor and
   every island notifier call run only when the page is inside the native app (the island plugin is present). On the
   PWA, the rest stopwatch is behaviourally identical to V238: `performance.now()` at the three sites, no notifier
   call, no boot call. A gate proves both arms. Pages still receives the V239 file, and the PWA shows 239 with no
   visible change. Coach's R1 rationale (the tab and the island agree by construction) holds inside the native app,
   which is the only place the island exists.
2. No persistence this build: **concur** (hold). P-RESTPERSIST is next if the device test shows iOS killing the app during a
   normal rest.
3. Display only, a tap opens the app: **concur.**
4. Clock only, no session name: **concur.**
The after-table's tab column applies to the native app. On the PWA, every tab row reads as V238, the lock row included.

## Gate rows (main session, from the after-table and the concurrence, before slice C)
New gate `tests/gates/g239_d233_island.js`. It prints rows through `tests/status.js` and runs at `ia-version >= 239`.
The oracle is a stub `window.iaIsland` call log, plus independent fake `Date.now` and `performance.now` clocks.
Every row cites the clause it defends.
- `D233-pwa`: no plugin. The clock follows `performance.now` and ignores `Date.now`. Every seam runs without a throw, and
  the tab reads the V238 values (concurrence 1, R1 as amended).
- `D233-native-clock`: plugin present. The clock follows `Date.now` and ignores `performance.now` (R1; after-table, lock row).
- `D233-start`: Start sends `run(startEpoch)`, where startEpoch is Date.now at the tap (after-table, Start).
- `D233-stop`: Stop sends `stop(elapsed)` with the frozen value (after-table, Stop).
- `D233-resume`: Start after Stop sends `run(now - frozen)` (after-table, Resume after Stop).
- `D233-reset`: the reset button leaves the island ended, so its last call is `end()` (after-table, Reset button; R3).
- `D233-donestatus`: Done or Skip leaves the island ended and the tab at 0:00 (after-table, Done / Skip; R3; V221 D179).
- `D233-dayopen-stopped`: a day open on a stopped nonzero clock sends `end()`, tab 0:00 (after-table, Day open stopped; R3).
- `D233-dayopen-running`: a day open on a running clock sends nothing and keeps counting (after-table, Day open running).
- `D233-hidden`: leaving for Home or the wizard (tab hidden) sends nothing, and the clock keeps counting (after-table, Home or
  wizard; R2).
- `D233-boot`: a page load with the plugin present sends exactly one `end()` (after-table, Relaunch or reload; R3).
- `D233-throw`: a plugin that throws on every call never breaks the clock (R2: the island follows the clock, never
  the reverse).

## Mario's redirect (2026-10-09, after the simulator check) — the ask was the in-app timer, in the island
Simulator check of D233 as built (native app, iPhone 17 Pro sim):
- Start produced the island: a timer glyph and a counting clock.
- The lock screen banner read `Rest Timer` / `0:30` / `Your rest is on the clock.`
- Back in the app, the tab read `1:21`, continuing the island's `1:08` from about 13 s earlier.
- Stop gave the banner `Rest Timer` / `1:34` / `Stopped. Tap to open the app.`, and the tab froze at `1:34`.
- Reset was not yet checked.
Mario then wrote: "nah nah i mean i want the timer we got but placed in the island", and "i think you just did a live
action notification". Offered two readings, he chose "Move our timer up there in-app": inside the app, the existing
floating rest tab moves to the top and becomes a black pill around the camera cutout showing our clock; a tap drops
our full card (Start / Reset). Outside the app, the D233 Live Activity stays. iOS never shows an app's own Live
Activity in the island while that app is foreground, so the in-app pill is the app's own drawing.
This is a NEW ruling (D234), measured first. D233 as built stays parked in the tree, uncommitted, and no web slice lands until D234 is
ruled. Native app only, like D233 (Mario: "push it to the iOS version not the PWA").
