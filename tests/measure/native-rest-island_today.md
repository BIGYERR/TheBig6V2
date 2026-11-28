# Today's rest stopwatch and its island (measure, before the Expo app gets its own)

Phase 4's first build session (`MIGRATION.md`; D233, D295 in `docs/decisions/rest-timer.md`). Read only: nothing
ruled, nothing built. Measured 2026-11-28 on `dev` at 1600ad9, `ia-version` 0.263.0. The table is printed by
`tests/measure/native-rest-island_today.ts` (`cd tests && node --no-warnings measure/native-rest-island_today.ts`:
10 rows, no error); the rest is read off the code, each line named.

## A. What starts, stops and resets a rest today

Three taps, all on the floating card, and nothing else in the app:

- **Start** and **Stop** are one button (`rtToggleBtn`). Start after a Stop carries on from the time held.
- **Reset** (`rtResetBtn`) stops it at zero.
- The tab on the edge only opens the card. It shows with a program held, on This Week, Progress and Bugs, and
  over the day's sheet and the deck (`showsOn`, `rest-timer-model.ts`).

Nothing a set does starts a rest: Log, Done next one, a stepper and a swipe never touch the stopwatch.

## B. What the island is sent, by state and by what happens

Today's page in the VM harness, on the rest timer's own rig (`tests/support/rest-timer.ts`), with a stand-in for
`window.iaIsland` that logs every call. Each cell is what the island was sent, then what the stopwatch holds.
`run(tap 0 s)` is `run` with the wall clock of the tap; `run(tap -92 s)` is the tap less the 92 s held.

| What happens | at zero | running, 92 s in | stopped, holding 92 s |
|---|---|---|---|
| Start or Stop (the card's button) | run(tap 0 s) → running at 0 s | stop(92 s) → stopped at 92 s | run(tap -92 s) → running at 92 s |
| Reset (the card's button) | end(), end() → stopped at 0 s | stop(92 s), end() → stopped at 0 s | stop(92 s), end() → stopped at 0 s |
| a day opened from This Week | end() → stopped at 0 s | nothing → running at 92 s | end() → stopped at 0 s |
| the open day drawn again | end() → stopped at 0 s | nothing → running at 92 s | end() → stopped at 0 s |
| Back from the day | nothing → stopped at 0 s | nothing → running at 92 s | nothing → stopped at 92 s |
| Done | end(), end() → stopped at 0 s | stop(92 s), end() → stopped at 0 s | stop(92 s), end() → stopped at 0 s |
| Skip | end(), end() → stopped at 0 s | stop(92 s), end() → stopped at 0 s | stop(92 s), end() → stopped at 0 s |
| a tab move, to Progress | nothing → stopped at 0 s | nothing → running at 92 s | nothing → stopped at 92 s |
| Home (the tab is hidden) | nothing → stopped at 0 s | nothing → running at 92 s | nothing → stopped at 92 s |
| the undo of Done, on a running rest | | nothing → running at 92 s | |

A launch with the plugin present sends `end()`, once.

Read off the table:

- **The island is told the state after every change, and nothing in between.** Running, it gets the start once and
  iOS counts from it; the app sends no tick.
- **A reset is two calls.** `ruReset` stops first (which tells the island) and then zeroes (which tells it
  again), so a running rest sends `stop(92 s)` and then `end()`, and a rest at zero sends `end()` twice. The plugin
  runs its calls in the order they came, so the last one wins.
- **A running rest is never touched by moving about:** an open, a redraw, Back, a tab, Home and an undo leave it.
- **A stopped rest lasts until the next day is opened or drawn.** An open or a redraw sends `end()`.

## C. Who stops or zeroes it

Six calls from outside the timer (`grep` on `ruReset`, `ruResetIfIdle` and `_ruIsland` under `frontends/app/src`):

| Call | Where | When |
|---|---|---|
| `ruReset` | `legacy/src/js/day-status.ts:112` | Done and Skip on the day's sheet (a status set; the undo returns before it) |
| `ruReset` | `app/screens/deck/deck.ts:654` | Mark the day done, on the deck |
| `ruResetIfIdle` | `legacy/src/js/day-detail.ts:144` | the page's `openDetail`, every draw of a day |
| `ruResetIfIdle` | `app/screens/day-detail/day-detail.ts:215` | the Angular sheet, every draw of a day |
| `ruResetIfIdle` | `app/screens/deck/deck.ts:225` | the deck opened on a day |
| `_ruIsland` | `legacy/src/js/bug-report-init.ts:67` | the launch: the stopwatch is at zero, so this is `end()` |

In today's iOS app the stopwatch is the Angular component (`app/screens/rest-timer/rest-timer.ts`) over
`rest-timer-model.ts`, which provides those three names to the page. Its four moves read the same as the page's,
line for line: start is `begin` then the island; pause is `pause` then the island; reset is pause (the island),
`reset`, the island; the idle reset tells the island only when it zeroed. `frontends/app/test/unit/rest-timer.test.ts`
holds the model.

## D. What the lock screen and the Dynamic Island draw

Read off `plugins-src/ia-island/src/ios/widget/RestTimerWidget.swift` (137 lines), `IAIsland.swift` (143) and
`RestTimerAttributes.swift` (18). The activity carries three values and no words: running, the start, the seconds
held.

| Where | Running | Stopped | Ended |
|---|---|---|---|
| Island, compact, left | the `timer` mark, signal orange | `pause.fill`, signal orange | nothing: the activity is gone at once |
| Island, compact, right | the clock counting, signal orange, 48 points wide | the time held | |
| Island, minimal (beside another app's) | the clock, 12 point, signal orange | the time held, in the secondary grey | |
| Island, held open | Rest Timer; the clock at 34 point bold; "Your rest is on the clock." | Rest Timer; the time held; "Stopped. Tap to open the app." | |
| Lock screen | the same three lines on ink (`#181712`), words in bone (`#F4F1E8`) | the same, with the stopped line | |

- **The clock** reads m:ss, and h:mm:ss past an hour. Never hundredths. Running, iOS counts it from the start with
  no update from the app; stopped, it is the seconds held, cut to a whole second.
- **Display only** (D233 R5): no button, no intent, no push. A tap opens the app.
- **The three calls:** `run(startMs)` asks for an activity when none is live, else updates the live ones;
  `stop(elapsedMs)` updates the live ones and asks for none; `end()` ends every one at once. Each waits for the one
  before it. The plugin's own start ends every activity the app left behind.
- **Where nothing shows:** below iOS 16.2, and with Live Activities turned off for the app. Every call is then
  nothing, and the stopwatch still runs.
- **One line of Info.plist:** `NSSupportsLiveActivities`. No capability, no entitlement.

## E. The simulator's copy of today's app is no reference

The Asylum installed on the simulator (iPhone 17 Pro, iOS 26.5) reads Build v0.255.2 and its island draws a small
figure and hundredths (0:21.30). Neither is in the tracked Swift: it is a prototype's build. The reference for
the beta's island is the tracked Swift itself, which the beta keeps line for line.

## F. What the beta holds

- **No rest timer** (D295, since IA Next 120). The commit that took it out, a3a5528, removed the clock's calls from
  `App.tsx` and `SessionSheet.tsx`: Mark the day done and a status set stopped it at zero; the sheet's open and
  each redraw zeroed it while idle.
- **An empty widget target** (`frontends/native/targets/RestTimerWidget`, deployment target 16.4, no
  entitlements) and one Swift module that does nothing (`modules/ia-spike`).
- **Nothing on a screen a rest could hang on by itself.** A lift card draws one load field and one Log for a move,
  whatever its sets (`Deck.tsx`, `deck-log-<move>`), so a Log comes once a move and a rest comes between sets. The
  card prints the rest it asks for as a line of words ("2 to 3 min rest between sets"). The deck's top bar holds
  Back, the title and the session map; its foot holds Done, next one.

## G. The call put to Mario (not ruled)

What on a screen starts, stops and resets a rest in the beta, now that no tab floats (D295's open call). Put to
him with a mockup of the deck and a working island: three places for one button (beside Done, the top bar, the
card's rest line) and two readings of a tap (a new rest from zero each time; as today, where Start carries on from
the time held). In each the island and the lock screen are today's, and so is who stops it: Mark the day done,
Done and Skip at zero, an open and a redraw while idle.

## H. His answer, and what iOS does with it (2026-11-28)

**Mario, on the mockup of section G:** "i only want the timer on the dynamic island. nowhere else and it should be
on the lock screen too". So the beta draws no clock and no rest button on any screen of its own.

Measured after his answer, on the simulator's copy of today's app (a prototype's build, section E, but the rule is
iOS's and not the widget's): with a rest running and the app in front, the island stays plain; on the home screen
the same rest shows on it at once. **iOS never shows an app's own Live Activity on the island while that app is in
front.** Two screenshots, one of each, taken a few seconds apart on one running rest.

What follows, read off the platform and not yet built:

- Inside the beta a rest is seen nowhere. It is seen on the lock screen, and on the island from the home screen or
  another app.
- The small island holds no button: a tap on it opens the app. Buttons can stand on the lock screen and on the
  island held open, from iOS 17 on (a button that runs an app intent). They need no capability and no entitlement.
- A button needs an activity to stand on, and an activity can only be asked for while the app is in front. So the
  app would put the rest up, ready at zero, when a session opens, and take it down as today (Mark the day done,
  Done, Skip, the launch).
- D233 R5 rules the activity display only: no buttons, no intents. Buttons on it amend that, for the beta.

Put to him as one question: Start, Stop and Reset on the lock screen and on the opened island, the rest put up
ready when a session opens. Not ruled.
