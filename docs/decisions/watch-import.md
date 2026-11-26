# Watch import: a run the watch records lands in the run log by itself

## D292 P-WATCHIMPORT: a run the COROS watch records fills its run card, with nothing to tap (proposed 2026-11-15, awaiting Mario)

- **Date:** 2026-11-15, Post-v0.262.4. **Ruled by:** the main session in the coach hat, on its own measure below.
  Awaiting Mario on the four calls at the end. **Asked by:** Mario, relayed by the session that started this one: runs
  recorded on the COROS Pace 4 land in the app by themselves, so he can run with the watch alone and leave the phone at
  home. This is stage 5 of D267's list ("COROS: watch runs into the card"), brought forward. **Bump:** none now (a
  measure and a ruling, no build). As ruled, the build touches the Expo app and core and leaves the page and
  `ia-version` where they are, so it would be a `Post-v` pass (CLAUDE.md, Versioning); Mario confirms at the build.
  **Shipped:** not built.

### The measure (2026-11-15, on v0.262.4)

1. **COROS's self serve access, read from COROS's own pages.**
   - **Connect Your Data** (support.coros.com, article 53181260265492, "updated 2 months ago"): three paths. An AI
     assistant through COROS's connector; an app that lets each user connect by OAuth 2.0, "Self-service, no
     application required", 22 data fields; and the Partner API for platforms (multi user credentials, webhooks, two
     way sync, by application and review).
   - **Build on COROS MCP** (article 53181619102996): implement OAuth 2.0 against the MCP endpoint
     `https://mcp.coros.com/mcp`; "All data access is scoped to the authorizing user only (single-user)"; the app reads
     training data and writes workout plans. Its limitations, verbatim in substance: single user access only; no
     webhook push ("your app polls the MCP"); no GPX route import or export; no two way activity sync ("COROS to your
     platform requires Partner API").
   - **Connect Your COROS to AI** (article 50841795180948): what the MCP reads as of September 2026: activity records,
     laps and segments, workout feedback and notes, FIT files with GPS "capped at 50 file requests per day", health,
     fitness and profile data; workouts and plans written to the watch's library (4 to 16 week plans, a start date up
     to 14 days out; deleting only in the COROS app).
   - **Partner API Access** (article 53181766856724), for comparison: workout summaries pushed to a webhook "within ~5
     minutes", two way sync, 1,000 calls a minute, `getWorkoutRecords` 30 days a call and 3 months back; by email
     application to COROS with a company and its redirect URIs.
   - **The GitHub COROS links** (`coroslab/COROS-MCP`, last commit 2026-10-29). The FAQ: access tokens last 30 days,
     refresh tokens 180 days, and each refresh issues a new refresh token, so the 180 days roll; file downloads and
     download links share 50 files per fixed 24 hour window; regional URLs `mcpus`, `mcpeu` and `mcpcn` behind the one
     endpoint. The tool guide: `querySportRecords` (filters by date, sport code, distance, duration, pace and place;
     returns date, sport, place, distance, duration, pace, the activity id and its start and end; 7 days and 20 records
     by default), `getActivityDetail`, `queryActivityLapData` (laps with distance in cm, time and pace in seconds),
     `downloadActivityFitFiles` and `queryActivityFitFileDownloadUrls` (5 files a call, at most 10). The changelog:
     `analyzeActivityDetail` removed 2026-10-23; GPX and KML route import added 2026-10-29, so the help page's "No GPX
     route import/export" is older than the tool.
   - **The OAuth flow as the server publishes it** (`https://mcp.coros.com/.well-known/openid-configuration` and
     `/.well-known/oauth-protected-resource`, read 2026-11-15; this request was routed to `https://mcpus.coros.com`):
     authorization code with PKCE (`S256` only), dynamic client registration (`/connect/register`), `none` among the
     token endpoint's auth methods (a public client, with no client secret), scopes `openid`, `mcp.tools` and
     `offline_access`, a refresh grant and a revocation endpoint. COROS's own login helper in that repo registers itself
     exactly so: `token_endpoint_auth_method: none`, grants `authorization_code` and `refresh_token`, a loopback
     redirect on `127.0.0.1`, and the MCP URL as the `resource`.
   - **One read call** (`querySportRecords`, run codes 100 to 103, a two week window): 3 runs, answered as text,
     not JSON. Each record carries the sport, the date, a place name, start coordinates, `startTimestamp` and
     `endTimestamp` (Unix seconds), the duration, the distance in km to two places, the average pace per km, average
     heart rate, calories, the activity id and the sport code. On each of the 3, end minus start was within 1 s of
     the duration. No date, total, place, coordinate, heart rate or activity id of his goes into the repo (CLAUDE.md,
     Security: his own data reaches a tracked file as counts only).
   - **Not confirmed:** (a) whether dynamic registration takes an iPhone app's own redirect (a custom scheme or a
     universal link); COROS's helper uses a loopback port, which an iPhone app cannot listen on; (b) the call rate a
     self serve client may make (the MCP pages give none); (c) whether a tool's answer carries structured content
     beside its text; (d) whether COROS counts reading records into another app's log as the "two way activity sync"
     it keeps for partners, while the same page says the app "reads training data"; (e) why `getActivityDetail` and
     `queryActivityLapData` refused twice on 2026-11-15 with "anomalies detected" (this session did not call them
     again, and the import needs neither); (f) whether a record's duration is the timer time (pauses out) or the
     elapsed time: on three runs with no pause the two cannot differ.

2. **Where the token can live.**
   - **The backend today** (`backend/server/`, 9 files, 1,072 lines): the public API is `POST /api/heartbeat` and
     `POST /api/bye`, a device id the server hands any caller, with no identity behind it; the staff admin behind
     `ADMIN_USER` and `ADMIN_PASSWORD`, its sessions held in memory. Devices live in memory with an optional JSON file,
     which `backend/.env.example` says to leave empty on Heroku because the dyno's disk resets on every restart. There
     is no database, no user account, no scheduler or worker, and no call out to any service; no file under
     `frontends/app/src` or `frontends/native/src` calls the API.
   - **To hold a token there** the backend would need an account for each athlete, a database (a Heroku add-on),
     tokens encrypted at rest under a key in a config var, a poller (a scheduler add-on or a worker dyno) and an
     authenticated API for the phone, all in a public repo that bots clone.
   - **COROS's flow needs no backend secret.** It is a public client with PKCE: there is no client secret to keep. The
     one secret is the athlete's own access and refresh token, granted at run time by his own sign in and never built
     into the bundle, which iOS keeps in the Keychain. That is the standard shape for a phone app (OAuth 2.0 for Native
     Apps, RFC 8252). CLAUDE.md's Security section says the page and the iOS app cannot keep a secret; what it guards
     against is a key built into `index.html` or the bundle, which every copy carries. A token one person's sign in
     grants to one phone is not that, but the wording does not say so (call 1).
   - **The log lives on the phone and nowhere else** (`ia_logs_<program>` in the app's store). A server that polled
     COROS could only hold a run until the phone opened and wrote it, so the phone has to open either way.

3. **How a COROS run matches a day.**
   - The log is keyed by program week and day (`w<week>_<day>`, `core/src/domain/log.ts`), not by date.
     `dayDateFor(week, day)` (`popups-streaks-reminders.ts`) puts each week and day on a local date counted from the
     Monday of the program's start date; the import runs it backwards. For a program started on Wednesday 2026-09-09
     (its Monday 2026-09-07), 2026-11-20 is 74 days on: week 11, offset 4, `w11_fri`. A date before the start
     (`dayBeforeStart`) or past the last week has no card.
   - **The date is the phone's, never UTC.** In November a run that starts after 19:00 EST is already the next day in
     UTC: one started at 19:30 EST (epoch 1795221000) is 2026-11-21 in UTC and 2026-11-20 on the phone.
   - The run card reads done when the day's entry holds any run field (`cardioLogged`, `week-view-model.ts`), so
     writing the fields is what closes it.
   - **The hand log writes different fields for each dose form** (`cardio-fields-model.ts`): a time dose `run_mins`
     and `run_dist`; a distance dose `run_dist` and `run_mins`; a run with no dose `run_dist` and `run_pace` (m:ss); a
     reps over distance dose `run_reps` and `run_rep_time`; a reps over time dose `run_reps` and `run_dist`. A time or
     distance entry stores no pace: `doseDerived` derives it when it is read. `persistLogFields` rebuilds the entry,
     carries its sets, parked fields and rest record, and stamps `week` and `ts`.
   - **Which runs the watch's totals fit** (`tests/measure/watch-import_run-forms.md`, seven programs): every Recovery
     Run, Long Run (Race Day included), Easy Run and Long Slow Distance is the whole outing. A race plan's Speed Run
     opens the no dose form (miles and pace), and D272 call 2 already records a Speed Run's whole run. HALF_MANNY: all
     56 of its runs are one or the other (27 time, 15 distance, 14 no dose). Three NSW sessions dose a block inside
     the outing: the Short Interval (`reps_dist`, 11 on each test goal program), the Long Interval (`time`, key
     `chi`, its fifteen minutes at tempo pace, 11 on each) and the Benchmark Run (`time`, key `bench`, a timed test, 2
     on run base).
   - **Two runs on one date:** the entry holds one set of run fields a day. **A rest day:** D223's `restLog.run`
     (`mins`, `dist`, `rpe`) is its own record and never touches the session's fields; week miles and Progress sum it
     with the session (D224). **No card:** a lift only day, a ride, swim or row day, a skipped run (D284), a date
     outside the program.

4. **Which frontend.**
   - **Today's app** (Angular in Cordova) holds Record run and the recorder (D272, v0.258.0). Its store is the web
     view's; its plugins are `ia-island` and `ia-gps`, with no Keychain and no system sign in sheet.
   - **The Expo beta** (`frontends/native`) is in phase 3 of the migration. Its This Week draws the run card with Record
     run, but Record run and the hand log are not wired yet (`ThisWeek.tsx`). It writes only its own SQLite copy
     (D289), never today's app's store, so a run it imports reaches Mario's real log at cutover (phase 5).
     `MIGRATION.md` decision 6 (pick: the recorder's stages are built once, in the new app) is not yet answered.

5. **D272's gate and the watch.**
   - D272 call 1 holds Save to the day until the phone passes four laps of a 400 m track within 32 m of 1,600 m, and
     one road run within 2% of the watch. In the road half the watch is the reference. On his road run the phone read
     1.64% long against the watch over the minutes both recorded (measured by the session that started this one,
     2026-11-15; not yet written to `tests/measure/`), so the road half passes. The track half is not run.
   - D267 item 5 judges both devices against the track's 1,600 m, so the track test checks the watch as well.
   - Today the run numbers in Mario's log are the watch's, typed by hand (D267: the FIT reader matched COROS's own
     summary of one of his tempo runs to the metre and second).

### The coaching argument

The prescription owns the fixed dimension and the log captures the free one. Today Mario reads the free one off his
watch and types it in. An import writes those same numbers without the typing; it adds no new source of truth, so it
does not wait on the gate that holds back the phone, whose numbers are new. But the watch's totals are the log's
numbers only when the session is the whole outing. Where the dose is a block inside the run (reps, a tempo block, a
timed test), the outing's numbers put a slower pace against the target, and a Benchmark Run's distance moves the
program's paces: those wait for the laps (stage 4, after D258). The log is the athlete's: what he typed or saved stays.
And it should be quiet: one sign in, then nothing to tap.

### What changes (the Expo app; today's app and the page do not move)

1. **Connect, once.** A **COROS watch** row on the Bugs screen, beside Backup, with **Connect**. It opens COROS's own
   sign in in the system sheet. The app registers itself with COROS as a public client (no secret), signs in with PKCE
   and asks for `openid`, `mcp.tools` and `offline_access`. The access and refresh tokens go to the iOS Keychain and
   nowhere else: never into the app's store, so never into a backup (D287's backup carries every `ia_` key); never
   into the repo, a log line, a test or chat. On return the row reads **Connected. Runs from your watch fill your run
   cards.** **Disconnect** revokes the token at COROS and deletes it from the Keychain. iOS only; the page on Pages
   never offers it.
2. **When it reads.** Each time the app opens or comes back to the front, and not again within 15 minutes (a pacing
   choice: COROS gives self serve clients no rate). It asks `querySportRecords` for outdoor, trail and track runs
   (codes 100, 102 and 103) from the day before its last read to today, and never for a day before the day Mario
   connected: nothing already in his history is filled in after the fact. No FIT file in the normal path, so the 50 a
   day are untouched.
3. **Where a run goes.** Its day is the phone's local date of its start, as week and day of the active program.
   - **A training day whose run is a whole outing** (a Recovery Run, a Long Run of any kind including Race Day, an Easy
     Run, a Long Slow Distance) **or a race plan's Speed Run**, with no run field logged and the run not skipped,
     takes the fields its own hand log form writes and nothing else: a time dose `run_mins` and `run_dist`; a distance
     dose `run_dist` and `run_mins`; a Speed Run `run_dist` and `run_pace`. `run_mins` is the watch's timer time in
     minutes to two places (D272 item 4 writes the recorder's moving time the same way); `run_dist` is miles to two
     places; a Speed Run's `run_pace` is the watch's average per mile as m:ss. It writes through the writer the hand
     log uses, so the day's first touch is snapshotted as a typed log would be. It writes no effort (D219: untouched
     stores nothing), no note, no status and no skip.
   - **Two or more runs on one date** are one run: times and miles added, the pace from the sums. A watch stopped and
     started again is one run, and the log holds one run a day.
   - **A rest day** takes the run in its own record, `restLog.run` (`mins`, `dist`), when the day holds none yet (D223),
     and never touches the session's fields. A rest day that holds a session moved in by Training anyway? is a training
     day for the rule above.
   - **Not written:** a Short Interval, a Long Interval or a Benchmark Run; any reps dose; a day whose run already holds
     a field (typed, a phone recording saved, an earlier import); a skipped run; a lift only day; a ride, swim or row
     day; a date outside the program; an indoor run (code 101: a treadmill's own display is the truth, and a wrist
     reads it worse).
4. **What it never overwrites:** any run field already in the entry, and any rest record already there. The import
   keeps the ids of the activities it has handled, in the app's store beside the log (ids only), so a run is written
   at most once and a run the athlete clears stays cleared.
5. **What the athlete sees.** The run card closes with its done row as a typed run's (`runLine`: miles, time, pace)
   and a quiet line under it, **From your watch**. A toast the first time the app shows it: **Your run is in.** The
   entry edits on the day sheet like a typed one; an edit drops the line. The COROS row lists the last runs it read
   and where each went: **On your run card.**, **On your rest day.**, or **Not placed.** with its reason in one short
   sentence (**You logged this run already.**, **This session needs its splits.**, **No run on this day.**). When
   COROS refuses or the sign in has lapsed, the row says **Sign in to COROS again.** and nothing pops up; the hand log
   is always there.
6. **First steps of the build, each with Mario's yes where it reaches COROS:** register a client with an app redirect
   and read back whether COROS takes it (not confirmed (a); a client registration is an identity at COROS, so it waits
   on his word); then read one run with a pause to learn whether a record's duration is the timer time (not confirmed
   (f)); if it is the elapsed time, `run_mins` comes from the FIT file's timer total, one of the day's 50.

### Does not change

What any program prescribes (HALF_MANNY and the lattice do not move); the log's fields and their format (an imported
entry is one the hand log could have written); D272's gate, the recorder and its Save; D223 and D224's rest record and
its readers; today's app, the page and the backend; D289 (the beta writes only its own copy).

### Expected values, typed from the arithmetic (for the build's tests)

- `tests/unit/watch-import.test.ts` (`@ia/core`), each failing on v0.262.4 because the module does not exist (`git
  cat-file -e` is the proof):
  - A time dose, 2,700 s and 7.50 km: `run_mins` "45.00", `run_dist` "4.66" (7.50 / 1.609344 = 4.6603), no
    `run_pace`; read back, the pace is 9:39/mi (2,700 / 4.66 = 579.40 s, rounded to 579).
  - A distance dose, 3,725 s and 10.00 km: `run_dist` "6.21" (6.2137), `run_mins` "62.08"; read back 10:00/mi
    (3,724.8 / 6.21 = 599.81 s, 600).
  - A Speed Run, 1,500 s and 4.20 km: `run_dist` "2.61" (2.6098), `run_pace` "9:35" (1,500 / 2.609759 = 574.77 s),
    no `run_mins`.
  - Two runs on one date, 1,500 s with 4.20 km and 2,700 s with 7.50 km, on a time dose: `run_mins` "70.00"
    (4,200 s), `run_dist` "7.27" (11.70 / 1.609344 = 7.2700).
  - The date: start 1795212000 (17:00 EST) is 2026-11-20 in America/New_York and in UTC; start 1795221000 (19:30
    EST) is 2026-11-20 in America/New_York and 2026-11-21 in UTC.
  - The day: a program started 2026-09-09 puts 2026-11-20 on `w11_fri` and 2026-09-08 on no card.
  - Never written: a day holding `run_dist` "5.5" keeps it; a rest day holding `restLog.run` keeps it; a Short
    Interval, a Long Interval, a Benchmark Run and an indoor run write nothing; an activity id already handled
    writes nothing.
- The Expo app's tests: the row's states (not connected, connected, sign in again); after Connect no stored key and no
  backup holds the token.

### The case against

- Until cutover the import lands only in the beta's copy (D289), so Mario keeps typing his runs into today's app, which
  is the thing he asked to stop doing.
- COROS can refuse a call (twice on 2026-11-15), drop a tool (`analyzeActivityDetail`, 2026-10-23), or read polling
  records into another app's log as the sync it keeps for partners. The import then stops quietly and the hand log
  carries on.
- A watch left running writes a long time and a slow pace into the log, which feeds Progress and the next program's
  seed (D267's argument). The athlete sees the numbers on the card and edits them; no filter guesses a bound.
- Adding two runs together slows a day's pace when one was a walk home. The block sessions are excluded, so this
  touches easy and long days only.
- A treadmill day stays typed.
- The phone holds a credential to his COROS data; a lost phone keeps it until Disconnect or a password change at
  COROS.
- With no server, nothing reads COROS while the app is closed and nothing says "your run is in" before he opens it.

### Calls for Mario

1. **The token stays on the phone, in the Keychain, and the backend holds nothing.** Recommended: no secret exists to
   keep (COROS's flow has no client secret), the log is only on the phone, and the backend has no accounts, database
   or poller to build in a public repo. Against: no reading while the app is closed and no push. This reads CLAUDE.md
   Security's "the iOS app cannot keep a secret" as being about what is built into the bundle; the recommended wording
   adds one line: "A token the athlete's own sign in grants at run time lives in the iOS Keychain, never in the
   bundle, the store, a backup or the repo."
2. **Built once, in the Expo app, after its run card logs (phase 3).** Recommended: it is the app the recorder's later
   stages are built in (`MIGRATION.md` decision 6's pick), and it reaches the real log at cutover. Against: no watch
   runs in the real log until then; the other road is a Keychain plugin and a sign in sheet in today's Cordova app,
   built twice.
3. **No gate on watch data.** Recommended: the watch is the reference the gate measures the phone against, and its
   numbers are already the ones in the log, typed. If the track test reads the watch more than 2% off 1,600 m, the
   import comes back to coach. Against: the watch has not passed the track test either.
4. **Before any athlete but Mario uses it, ask COROS.** Recommended: at phase 6 (the App Store), Mario writes to COROS's
   API address to confirm that reading records into the log is within the self serve terms, or applies for Partner
   access. One athlete reading his own data is what the self serve page describes. Against: the build rests on a
   reading of COROS's terms that COROS could refuse later.

## D292 Amendment 1: three routes measured; Apple Health first, COROS's MCP if Health lacks the distance, never Strava (proposed 2026-11-15, awaiting Mario)

- **Date:** 2026-11-15, Post-v0.262.4, the same day as D292 and before Mario answered it. **Ruled by:** the main session
  in the coach hat, on a second measure asked for by the session that started this one: Mario asked how Strava gets his
  runs without checking. Strava does not poll: he links Strava inside the COROS app, and COROS pushes each run to
  Strava when the watch syncs, a partner arrangement The Asylum cannot join (the Partner API asks for an established
  platform and a registered company). No new D-code: the route changes, the rules of what a run fills do not.
  **Amends:** D292's route (items 1, 2 and 6 of What changes) and its calls. **Shipped:** not built.

### The measure (2026-11-15)

1. **Apple Health.**
   - **What COROS writes.** COROS's page "Connecting Apple Health with COROS App" (article 360041549551, "updated 1 year
     ago"): COROS app > Profile > Setting > 3rd Party Apps > Data Sync > Apple Health, and the types it lists are
     cycling distance, heart rate, sleep analysis, steps, swimming distance, and walking and running distance. No
     workout type and no route is listed. COROS's iOS release notes, May 29, 2023 (app V3.0.15): "Your activities
     synced to Apple Health will now differentiate between indoor/outdoor running and cycling", so COROS writes each
     activity as a workout and marks a treadmill run as indoor. **Not confirmed:** whether the workout carries its
     distance (on the workout itself, or only as walking and running distance samples in its window) and whether it
     carries a route. Mario has not yet looked at his last watch run in the Health app.
   - **How the app learns of a new run** (Apple's documentation, read as JSON from developer.apple.com): an
     `HKObserverQuery` on workouts with `enableBackgroundDelivery`. "HealthKit wakes your app whenever a process saves or
     deletes samples of the specified type", at most once per period of the frequency asked for; some types are held to
     hourly (step count on iOS). From iOS 15 the app needs the entitlement
     `com.apple.developer.healthkit.background-delivery`, or the call fails with `errorAuthorizationDenied`. Background
     delivery does not run on the simulator; it is tested on a phone. The observer must be set up at launch and must
     call its completion handler, or HealthKit retries with a growing delay.
   - **What each app would need.**
     - **The Expo beta:** a HealthKit module. `@kingstinct/react-native-healthkit` 16.2.0 (MIT, published 2026-10-12)
       asks for React 19 or later, React Native 0.79 or later and `react-native-nitro-modules` 0.35 or later; the beta
       has React 19.3.0 and React Native 0.88.1, and no nitro modules yet. Its Expo config plugin writes
       `NSHealthShareUsageDescription` and, with `background: true`, the background delivery entitlement, on prebuild.
       None of `expo-secure-store`, `expo-auth-session` or `expo-web-browser` is needed on this route (D292's COROS
       route needed a sign in sheet and the Keychain).
     - **Today's Cordova app:** a new Swift plugin of its own, in the shape of `ia-gps`, its entitlements and usage
       string through `config.xml`. Neither app holds any HealthKit code today (0 files under `frontends/app/config.xml`,
       `plugins-src`, `frontends/native/app.config.js`, `modules` or `targets` name HealthKit).
     - **Signing (CLAUDE.md, Native):** both apps' App IDs carry no capability today (the beta's README, part 3: "Tick
       no capability"). HealthKit is a capability, so Mario ticks HealthKit on the App ID at developer.apple.com, makes
       the app's App Store profile again and replaces its repository secret: `IOS_PROFILE_NEXT_APP` for the beta,
       `IOS_PROFILE_APP` for today's app. The widget's profile does not change. Only Mario does this, as with every
       secret. Neither signing script reads entitlements (`frontends/native/scripts/ios.mjs`,
       `frontends/app/scripts/signing.mjs` check the profile's app id, team and dates), so a profile without HealthKit
       fails at Xcode's archive, naming it. **Not confirmed:** whether background delivery needs anything at the App ID
       beyond the HealthKit capability; the build reads the new profile's entitlements before it trusts it.
   - **No token, no server, no COROS terms.** The app reads what iOS's Health store holds, by the athlete's permission
     on iOS's own sheet. It reads any watch that writes workouts to Health (Garmin through Garmin Connect, an Apple
     Watch, COROS), each with its source app named on the workout.
   - **What Health hides.** iOS does not tell an app whether its read permission was refused; a refused read looks like
     an empty store. And Health's data is locked while the phone is locked, so a wake that comes then reads nothing
     until it unlocks.
2. **Strava as the middle.**
   - **The route:** COROS pushes each run to Strava; Strava sends a webhook to a server registered with it; the server
     reads the run from Strava's API and hands it to the phone.
   - **Strava's API** (developers.strava.com, read 2026-11-15): one webhook subscription per app; Strava checks the
     callback with a GET that must answer within 2 seconds, and every event must be answered 200 within 2 seconds,
     with 3 attempts in all. An event carries ids only (`object_type`, `object_id`, `aspect_type`, `owner_id`,
     `event_time`), so the server calls the API for the run. The token exchange and every refresh need the app's
     **client secret**. Access tokens last 6 hours, and each refresh may replace the refresh token. A new app starts in
     Single Player Mode, one athlete, its developer; 10 on request; more only after Strava's review. Rate limits per
     app: 200 requests per 15 minutes and 2,000 a day overall, 100 and 1,000 for reads.
   - **Strava's terms** (API Agreement and API Policy, both effective 2026-06-01): Strava Data may be "displayed or
     disclosed in your Developer Application only to that user"; "You may not retain Strava Data in your cache for
     longer than seven (7) days" (§6.2); revoking access, a request, or leaving the API obliges deletion of Strava Data
     and personal data derived from it within 30 days (§7.4); runs deleted on Strava must disappear within 48 hours
     (§6.3); no use "in any manner that is competitive to Strava" (§5.2); and no use of Strava Data or data derived from
     it with AI (§5.3). Whether a time and distance copied into a training log is "Strava Data" under §6.2 the policy
     does not say; §7.4 names derived personal data outright.
   - **The cost here:** the backend has none of it (D292's measure: no accounts, no database, no scheduler, no call
     out). It would need the client secret as a config var, the webhook endpoint, an account and a stored token per
     athlete in a database, and a way to hand runs to the phone. And Mario's log would hold runs it must delete if
     Strava access ever ends.
3. **COROS's MCP** is D292 as measured: the phone polls when it opens, a public client with PKCE, the athlete's token
   in the Keychain, no server, and an open question about COROS's self serve terms (D292 call 4).

### The coaching argument

All three routes deliver the same two numbers, the run's time and distance on its date, and D292's rules about which
day takes them stand for every one. What differs is what each route costs and what it can take back. Health costs no
server and no credential, owes nothing to any service's terms, and works for any watch; it only has to hold the run's
distance. COROS's MCP is the fallback: it holds the distance to ten metres, at the price of a token on the phone and a
term COROS has not confirmed. Strava costs a server the backend does not have and puts the log under terms that can
make it delete the runs it imported. A training log that may have to forget its own history is not the athlete's log.

### What changes in D292

1. **The route is Apple Health**, if Mario's check (call 1) shows his run in Health with its distance. Items 1, 2 and 6
   of D292's What changes become:
   - **Connect, once.** The **Watch runs** row on the Bugs screen, beside Backup, with **Connect Apple Health**. It
     opens iOS's own Health permission sheet asking to read workouts, walking and running distance, and workout routes
     (for stage 3's map; nothing reads them before then). The row then names the source it reads, **COROS** by
     default, from the sources Health holds running workouts from, and reads **Runs from your watch fill your run
     cards.** A workout from any other source (Strava, an Apple Watch, the phone's own recorder) is never read, so
     one run is never imported twice.
   - **When it reads.** Each time the app opens or comes back to the front, and when HealthKit wakes it for a new
     workout (background delivery). It reads running workouts from the chosen source from the day before its last read
     to today, never before the day Mario connected. An indoor workout (Health's indoor mark, which COROS writes) is a
     treadmill run and is not filled, as in D292.
   - **The numbers.** The run's start (`startDate`) dates it on the phone; its time is the workout's duration; its
     distance is the workout's own, or, if COROS writes none on the workout, the walking and running distance samples
     of that source inside the workout's start and end, summed.
   - **First steps of the build:** read one paused run to learn whether COROS writes the duration with the pauses out;
     and compare that run's distance in Health with COROS's own record of it.
     More than 1% apart, and the route comes back to coach.
2. **If Health does not hold the distance**, D292 builds as first ruled, on COROS's MCP, with its calls 1 and 4.
3. **Strava is not built**, now or as a fallback.
4. **D292 stands** on everything else: which runs are filled and with which fields, two runs on one date as one, the
   rest day's record, what is never overwritten, the ids kept so a run is written once, From your watch, and no gate.
   On the Health route the ids kept are the workouts' own.

### Does not change

D292's Does not change, whole. The Expo app is still where it is built (D292 call 2).

### Expected values (for the build's tests), beside D292's

- D292's field values hold for a Health workout of the same duration and distance (2,700 s and 7,500 m on a time dose:
  `run_mins` "45.00", `run_dist` "4.66").
- A workout from a source other than the chosen one writes nothing; an indoor workout writes nothing; a workout with no
  distance of its own and two walking and running distance samples of its source inside its window, 3,000 m and
  4,500 m, writes `run_dist` "4.66".

### The case against

- Health holds what COROS chooses to write, and COROS's own page lists no workout or route type. If a COROS update stops
  writing workouts to Health, runs stop arriving and nothing says why, because a missing write and a refused read both
  look like an empty Health store.
- HealthKit is one more capability: both App IDs change, the profiles are made again by Mario, and phase 6's App Store
  review asks a HealthKit app for a privacy policy.
- The wake is not instant: Health is locked while the phone is, so the run lands once the phone is unlocked or the app
  opens.
- Strava already holds his runs and would serve every watch Strava serves. Turned down for its server and its terms,
  not for its data.

### Calls for Mario (these replace D292's four)

1. **One check, on the phone:** open the Health app, Browse, Activity, Workouts, Show All Data, and open your last run
   with the watch. Does it name COROS as its source and show the distance the watch showed? Is there a map?
   A screenshot answers all three. The ruling turns on the distance; the map only tells stage 3 where its route comes
   from.
2. **The route: Apple Health, with COROS's MCP if the check shows no distance, and never Strava.** Recommended: Health
   needs no server and no token and owes no service's terms, and it reads any watch. Against: one more capability and
   profile to make, and it depends on COROS writing to Health.
3. **Built once, in the Expo app** (D292 call 2, unchanged). Recommended for the same reason; on the Health route Mario
   also ticks HealthKit on the beta's App ID and makes its app profile again at the build.
4. **No gate on watch data** (D292 call 3, unchanged).

## D292 Amendment 2: Health holds nothing from the watch, so one switch and one run decide the route (proposed 2026-11-18, awaiting Mario)

- **Date:** 2026-11-18, Post-v0.263.0. **Ruled by:** the main session in the coach hat, on Mario's answer to
  Amendment 1's call 1. No new D-code. **Amends:** Amendment 1, item 2 and its calls. **Shipped:** not built.
- **Mario's answer (2026-11-18):** the Health app holds neither his last run with the watch nor anything else he recorded
  with the watch, only runs he recorded with a running app on the phone.
- **What that measures.** No COROS workout is in Health at all, not even one without a distance. So the question
  Amendment 1 asked (does COROS's workout carry its distance?) is still open: COROS's sync to Health is not writing,
  most likely because it was never switched on. COROS's own page puts the switch in the COROS app (Profile, Setting,
  3rd Party Apps, Data Sync, Apple Health), where the athlete picks the types to send, and iOS then shows its own sheet
  listing every type COROS asks to write. **Not confirmed:** whether switching it on sends runs recorded before, or only
  runs synced after.
- **What the measure since has added.** D272's track test ran with the watch beside the phone (v0.263.0,
  `tests/measure/gps-recording_track-test.md`): the watch read 1,615.4 m for its session over the 1,600 m of four laps in
  lane 1, +0.96% (1,613.0 m over the run, +0.81%), inside the 2% (32 m) the phone is held to. D292 call 3 held that the
  import comes back to coach if the watch reads more than 2% off; it reads less than half that. No gate on watch data
  now stands on a measure, not only on an argument.
- **The re-ruling.** Amendment 1, item 2, sent the import to COROS's MCP if Health lacked the distance. An empty Health
  says the sync is off, not that COROS writes no distance, so the fallback is not yet earned. Switching the sync on is
  one setting in the COROS app, and the import is not built yet (the beta's Record run opens the hand log until its
  recorder, D294), so finding out costs no build time. The route is settled by two looks, and no third:
  1. **When Mario switches it on**, iOS's sheet lists what COROS asks to write. If Workouts is not on the list, COROS
     writes no workout to Health, and the import builds on COROS's MCP as D292 first ruled. If Workouts and Workout
     Routes are both on it, the run will likely carry its distance and its map.
  2. **After his next run with the watch**, that run in Health: a workout from COROS with a distance within 1% of
     COROS's own record of it, and the import builds on Health as Amendment 1 rules. No workout, or no distance, and it
     builds on COROS's MCP. Either way, nothing more is asked.
- **The first look, answered (Mario, 2026-11-18):** the sync is on, and Health lists Workouts among what COROS may
  write. Health stays the first route. The second look waits on his next run with the watch.
- **Only two types are needed:** Workouts and Walking + Running Distance (and Workout Routes, for stage 3's map). The
  COROS app also offers heart rate, sleep and steps; the import reads none of them, and whether Health holds them is
  Mario's own choice.
- **Does not change:** Amendment 1's order (Health first, COROS's MCP next, Strava never) and everything D292 rules
  about which day takes a run and with which fields.
- **The case against:** a second look asked of Mario, when COROS's MCP already reads his runs (D292's measure read
  three) and could be ruled the route today. The answer to that: COROS's route puts a credential on the phone and rests
  on a term COROS has not confirmed (D292 call 4), and one switch is a cheap way to avoid both.

### Calls for Mario (these replace Amendment 1's)

1. **Switch on the COROS app's Apple Health sync**, screenshot iOS's sheet of what COROS asks to write, and after your
   next run with the watch, screenshot that run in Health (Browse, Activity, Workouts, Show All Data). Recommended.
   Against: skip it and build on COROS's MCP now.
2. **The order stands:** Apple Health if the run shows its distance, COROS's MCP if not, never Strava.
3. **Built once, in the Expo app** (D292 call 2, unchanged).
4. **No gate on watch data** (D292 call 3), now on the track's measure: the watch read +0.96%.

## D292 Amendment 3: a guided setup, so a runner connects the watch without help (concurred by Mario 2026-11-22)

- **Date:** 2026-11-18, Post-v0.263.0. **Ruled by:** the main session in the coach hat, on Mario's ask the same day:
  "we need a way to be able to make that clear as day to do in our app almost like a tutorial page to make sure a user
  can do this seamlessly". No new D-code. **Amends:** the connect step (D292 item 1 as Amendment 1 rewrote it).
  **Preview:** `docs/design/watch-setup.html` (published at https://claude.ai/artifact/8bQ17ihNdkSCwm31i3TX6i): a phone
  that plays the setup, with mockup controls for the layout, the watch, what Health holds and the route.
  **Shipped:** not built.
- **The measure.**
  - What it took Mario (Amendment 2): his watch runs never reached Health until he found the COROS app's sync, five taps
    deep in another app, and switched it on. D292's Connect row as ruled would have read an empty Health and said
    nothing that helped.
  - What the app can check (Apple's documentation, read 2026-11-18): a source query (`HKSourceQuery`) lists the apps
    and devices that have saved workouts to Health, so the app can see whether COROS, Garmin Connect or an Apple Watch
    has written any. It cannot tell a refused read from an empty Health: "your app cannot determine whether or not a
    user has granted permission to read data. If you are not given permission, it simply appears as if there is no data
    of the requested type". `getRequestStatusForAuthorization` says whether iOS would still show its sheet. Once the
    athlete has answered it, asking again shows nothing; the way back is Health's own list of apps.
  - So the order is Health's sheet first (in the app, one tap), then the watch's app: when the athlete comes back,
    the app can already read Health and check the step they just did.
  - **Not confirmed:** whether the app can open the COROS app or Garmin Connect (it needs their URL schemes, which
    neither publishes) or the Health app (its scheme works but Apple does not document it). Where a scheme is not
    known, the button is left out and the taps are shown. Garmin Connect's taps (More, Settings, Connected Apps, Apple
    Health) are from memory and are checked on a phone before the build; COROS's are its help page's.
- **What changes.**
  1. **Where it starts.** A card on This Week, above the day's cards, while no watch is set up: **Run with your
     watch**, **Your runs can fill in here by themselves. Set it up once. It takes two minutes.**, with **Set it up**
     and **Not now** (which hides the card for good). And the **Your watch** block on the Bugs page, first, above
     Engine and Backup and drawn as they are (a label, a line, a button), which becomes the Profile page (Mario's
     pick, 2026-11-22, below). Its line says the state: **Not set up. Runs from your watch can fill your run cards
     by themselves.**, then **COROS through Apple Health. Waiting for your first run.** or **6 runs found. Checked
     just now.**; its button is **Set it up** until set up and **Open** after, which opens the Checklist.
  2. **Steps, for the first setup.** The watch first (**COROS**, **Garmin**, **Apple Watch**, **Another watch**), then
     three steps with a back button and three marks:
     1. **Let The Asylum read your runs.** **iOS asks you once. Turn on all three, then tap Allow.** (Workouts,
        Walking + Running Distance, Workout Routes.) **We read runs only. Nothing is written to Health.** Allow opens
        iOS's sheet.
     2. **Send your runs to Health.** **This part happens in the COROS app.** The taps as numbered rows in the order
        they are tapped (Open the COROS app, Profile, Setting, 3rd Party Apps, Data Sync, Apple Health), the types to
        turn on as chips, and **Then tap Allow. Come back here when you are done.** **I did it** goes on. An Apple
        Watch reads **Your watch is ready.** **Nothing to do here. Your Apple Watch saves each run to Health by
        itself.**
     3. **The check**, with three answers. Runs from the watch's app found: **You're set.** **Found 6 runs from COROS
        in the last 30 days.** **Your next run fills its run card by itself.** Health readable but nothing from that
        app: **Almost there.** **Health is open to us. Nothing from COROS is in it yet.** **Sync your watch in the
        COROS app. Your next run shows up after that.** **We check again each time you open the app.** Nothing at
        all: **No runs in Health yet.** **Run once with your watch and let it sync. Then check again.** **Turned access
        off? Open Health. Tap your picture, then Apps, then The Asylum. Turn on Workouts.**
  3. **Checklist, as the row's page after.** **Your watch**, **Three things, once. Each one ticks itself.**, and three
     rows that tick when the app sees them done: **The Asylum can read Health** (Allow until asked; a warning with the
     way back when nothing at all is found), **COROS sends runs to Health** (How opens the taps), and **Runs fill their
     cards**. Under them **Checked just now. We check each time you open the app.** and **Check again**.
  4. **If the route is COROS's MCP** (Amendment 2), the setup is one screen: **Connect COROS.** **Sign in to COROS
     once. Your runs fill in here by themselves.**, **Sign in with COROS** (COROS's own page), then **COROS is
     connected.** with **Disconnect**. Nothing to do in another app.
  5. **What it counts and shows:** counts only, on the athlete's own phone (runs found in the last 30 days); never
     another app's runs (Amendment 1's source pick); nothing written to Health.
- **Does not change:** D292's rules on which day takes a run and with which fields; Amendment 2's test of the route;
  the app's look (the Track look, D263: ink buttons, signal only for what is live).
- **The case against:** a card on This Week is one more thing on the main screen, after D272 Amendment 1 cleared the
  run card's links; the taps in COROS's and Garmin's apps drift when those apps change, so they are checked on a phone
  at each release that touches the guide; and a single help page with screenshots of the other app would be cheaper,
  but cannot check anything and goes stale the same way.

### Calls for Mario

1. **Steps for the first setup, Checklist as the row's page after.** Recommended: Steps carries a first timer one screen
   at a time; the Checklist shows at a glance what is done and what is not, which is what a status page is for.
   Against: two layouts to build and keep; Checklist alone could do both. Pick on the preview.
2. **The one-time card on This Week, plus the row.** Recommended: a runner finds the setup where the runs land.
   Against: the row alone keeps This Week as it is.

### Mario's answer on where it lives (2026-11-22)

- **Asked:** what the Checklist is, and where the menu lives. The session answered that the Checklist is what Your
  watch opens on every visit after the first, and recommended the Programs tab for the row, since the beta has no
  settings screen and Bugs holds test tools.
- **Mario:** "lets map it for the bugs page because evetually that will become the "profile" page with a setting
  button and all that". **Your watch lives on the Bugs page**, which becomes the Profile page with a settings button;
  item 1 above is written to it, and the preview's tab bar reaches it (version 4). Call 2 is answered for the row;
  the one-time card on This Week and call 1 (Steps, then the Checklist) are open.
- **Mario, the same day, asked to concur with the rest as the preview shows it:** "Concur". **Amendment 3 is ruled:**
  Steps for the first setup, the Checklist as what Your watch opens after, the one-time card on This Week, and Your
  watch on the Bugs page. The route it sets up (Health, or COROS's sign in) still waits on Amendment 2's look at his
  next run, and the build on D292's other calls.

## D292 Amendment 2, the second look: Apple Health is the route (2026-11-22)

- **Date:** 2026-11-22. **Ruled by:** the main session in the coach hat, on Mario's screenshot. No new D-code.
  **Settles:** Amendment 2's second look, and so the route (Amendment 1's order). **Shipped:** not built.
- **What Mario sent:** his last run with the watch, in Health, after he switched the COROS app's sync on (Amendment 2's
  first look): a Walking + Running Distance entry whose source is COROS. Against COROS's own record of the same run,
  read through the connector the same day: its start and its end are COROS's to the second, so its length is too; its
  distance, as Health shows it to a tenth of a mile, is COROS's rounded the same way (within the 1% asked); and Health
  holds it from 15 s after the run ended. Nothing of the run's date, time or distance goes into the repo (CLAUDE.md,
  Security).
- **What it does not show:** the workout. The screenshot is the distance entry, not the Workouts list, so whether COROS
  also writes the run as a workout (which tells a run from a walk, and carries the indoor mark Amendment 1 reads) is not
  seen. COROS's release notes say it does (V3.0.15), and Mario allowed Workouts for COROS in Health (Amendment 2).
- **The ruling.** **The import reads Apple Health.** The distance, the part the log needs and the reason for the look,
  is proved. The workout is checked by the build itself, as its first step on the phone: the app reads COROS's
  workouts in Health and the distance entries inside each one's start and end (Amendment 1, item 1, The numbers). If
  COROS writes no workout, the import reads COROS's MCP instead (D292 as first ruled) and the ruling comes back to
  coach. Mario is asked nothing more for this.
- **Does not change:** everything D292 and its amendments rule about which day takes a run and with which fields, the
  guided setup (Amendment 3) and Strava never. Two runs on one date are one: the run Mario sent was followed the same
  day by a short second activity on the watch, the case D292 rules for.

## D292: when it builds (Mario, 2026-11-25)

- **Mario:** "yeah lets cook this into phase 4", on the session's recommendation. D292 builds once, in the new app, as
  one session of the React Native migration's phase 4, beside the recorder's move (`MIGRATION.md`, phase 4, and section
  6 decision 17). Phase 4's exit gate gains a run recorded on the watch alone that fills its run card with nothing
  tapped. **Bump:** asked at the build; the import changes neither the page nor `ia-version`, so it is a `Post-v` pass
  of the beta unless the build reaches today's app.
