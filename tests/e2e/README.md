# The e2e

`npm run e2e` in `tests/` (`e2e/launch.ts`) runs the whole suite in Docker. Nothing runs a browser on the host. It covers three
surfaces, the collage's three bands: the **website** and the **admin**, as the backend serves them, and the **app**.
1. It bundles the app for the backend image (`../../backend/scripts/app-bundle.ts`, Node alone), then `docker compose`
   builds three images. Two come from `e2e/Dockerfile`:
   - **web**: the Angular app (`../../frontends/app/`) built from source in a clean Node container, served by nginx. The original
     `index.html` is served beside it at `/reference/`.
   - **runner**: the Puppeteer suite in TypeScript (`e2e/*.ts`, run by Node's type stripping) in the tests package,
     with `@ia/core` (it reads versions through its semver) and the Chrome for Testing build that the lockfile's
     Puppeteer pins. Chrome for Testing ships native ARM64 Linux builds, so it runs
     at full speed on Apple silicon.

   The third is **backend**, from `../../backend/Dockerfile`: the website at `/`, the admin at `/admin/` and the app at
   `/app/`, started with the project's local development login (admin / asylum) and no stored devices.
2. nginx and the backend start. The backend and the runner share nginx's network, so the runner reaches the app at
   `http://127.0.0.1` and the backend at `http://127.0.0.1:3000`, the same secure localhost origin a dev server has.
3. The runner takes the website and the admin (`e2e/pages.ts`, 10 steps), one target each, so no parity. A step
   passes when the page it shows answered 200, its heading or landmark is on screen, its content has rendered, and
   nothing failed on the way (no console error, no uncaught exception, no same-origin request that failed or answered
   an error the step did not expect). Each step is photographed full height, top to bottom:
   - **Website** (`#W01` to `#W04`): the home page at 1440×900 and at the app's phone width (393×852, @1x so a full
     page stays one capture), then from the phone the two pages it links to on the same host: Staff Login (`/admin/`)
     and Build my program (`/app/`, the app booting to its home screen).
   - **Admin** (`#A01` to `#A06`, 1440×900): two devices check in first, so every section has rows. Then the login,
     each section after signing in (Overview, Devices, Versions, Server, the list in `../../frontends/admin/admin.ts`, which
     a unit test holds the journey to), and the signed out screen after Log out.
4. The runner takes five journeys (`e2e/flow.ts`, 51 steps) against both the Angular build and the original. Each
   journey starts from empty storage in its own browser context, and a failed step stops only its own journey:
   - **Strength, commercial gym** (22 steps): the wizard, This Week, the rest-day sheet, a day's detail and its run
     log, the swap sheet and a pick from it, the add-an-exercise sheet and a pick from it, Random Workout, Hurt?, Traveling?, Progress, Bugs, the rest timer (open, start, stop, reset,
     fold, a drag to the left edge), Programs (the card opened, a rename and an archive started and called off), the change-a-goal
     sheet (a pace goal picked, its targets typed, then kept), then a relaunch.
   - **10K race, Sun Nov 29** (9): a race goal with a race date, the program length box, the week 1 long run, then
     race week's Saturday shakeout and race day (the Nike plan).
   - **1.5 mile test, Sat Nov 14** (8): a dated pace test, the program length box, the test day in week 6 (NSW),
     the mile pencil (its sheet from the stored 7:30, a change kept back, the stored mile again on reopening), then a
     relaunch three weeks later, where the pencil shows the lock instead (`relaunchOn` moves the frozen clock).
   - **Bodyweight, then a knee injury** (6): a beginner over 55 with no equipment, Friday before the injury (it holds
     a jump), Hurt? with the knee chosen, the injury week, and Friday after (no jumps).
   - **Log a session and relaunch** (6): log two exercises, the effort and a note, close the day out (the workout
     pop-up up, then its dismiss button), relaunch, and find all of it kept, in the session and in the Progress journal.
   Every step is a real tap followed by an assertion. Native date and slider controls, which a user drives through
   the OS picker, are set directly and fire their events.
5. Each pair of app screenshots is compared pixel by pixel. **Default tolerance is 0%.** Clean runs match exactly, and a
   planted 0.3% title change fails the four screens that show it.
6. It copies the report out of the runner container (`docker cp`; nothing is bind-mounted, since the repo sits in an
   iCloud-synced folder) into the run's own folder, `../temp/runs/<stamp>-e2e/artifacts/`, so every run is kept
   (`../temp/latest/e2e` is the newest), then tears the containers down:
   - **`index.html`**: one self-contained page. Every screenshot (Angular, original and pixel diff for each step) is
     embedded as a data URI, and the styles and script are inline. It can be mailed or moved on its own. Click a
     screenshot to see it full size. The runner refuses to write it if anything in it points outside the file.
   - **`collage.png`**: every screen on one image, about 9350×25400 px (238 MP), in three titled bands read top to
     bottom: WEBSITE, ADMIN, APP. Each band's bar names it, says what it shows and counts its passes; the header
     carries the totals and the app version as a label (V239, v0.239.1). Each band has its own tile width: the app's
     46 screens sit at native size (786×1704, 11 across, as before), the website and admin pages at their full size
     (1440 wide, or 393 for the phone, under a label never narrower than an app screen). A page taller than its band
     allows (14000 px for the website, 4000 for the admin) is scaled down to fit, never cropped. Every screen sits
     under a label with its number, page name, journey and step id, and PASS or FAIL; one that failed is outlined in
     red. The numbers match the report's, so "#27 race-10k/race-shakeout" or "#W02 website-phone/site-home-phone"
     means the same screen in both. Chrome draws only the header, the band bars and the labels; `composeCollage`
     copies the screenshots in on an RGB canvas (pngjs), because one capture of the whole image is more than the
     runner's software renderer can do within Puppeteer's timeout.
   - `docker/`: the app bundle, the docker build, up, cp and down output, and `nginx.log` and `backend.log`, each
     server's own log of every request it served, saved before the containers go.
   The run's `events.log` has each phase and each step's PASS or FAIL as it happened; `output.log` has everything
   printed. Run outside the run log (it cannot write `../temp/`), the report goes to `e2e/report/`.

Determinism (the app journeys; the website and admin keep the real clock, since the admin compares times with a live
server, and ask for reduced motion, so the site shows every section without scrolling it into view):
- iPhone viewport, 393×852 @2x;
- the clock frozen at Wed 2026-10-07 07:30 New York (a rest day, so the rest sheet is reachable), unless a step
  relaunches the app on a later moment (`relaunchOn`, which leaves it in the tab's sessionStorage for the reload);
- seeded `Math.random`, animations off;
- web fonts and layout settled before each screenshot;
- Chrome flags for repeatable pixels (fixed sRGB colour, no LCD text, every compositor stage run before a capture),
  without which fixed layers like the rest timer tab can differ by a colour level between two renders;
- the bug form's endpoint is blocked, so a run never files a real report.

Screenshots come from Chrome on Linux, so text is rendered by Linux's font stack. Both targets are rendered the same
way, so parity is unaffected. The app's own font (Geist) is a web font and loads the same everywhere. Only glyphs it
lacks fall back to the image's DejaVu, Liberation and Noto Color Emoji fonts.

A full run takes about 2.5 minutes once the images are cached (the first build downloads Chrome and takes longer).
A failed step stops only its own journey, and the run exits 1 if any step fails or the collage cannot be written.

Options: `E2E_ONLY=race-10k,log-session` runs just those journeys (`website-desktop`, `website-phone` and `admin`
name the others; step numbers stay the full suite's), `E2E_KEEP=1` leaves nginx and the backend up afterwards and
prints their addresses (the original is at `/reference/`), `E2E_PORT` and `E2E_BACKEND_PORT` pin their host ports
(default: any free port), `E2E_PARITY_MAX` (percent).

The compose project is named after the checkout (`iron-asylum-e2e-<hash of its path>`), so two checkouts or worktrees
can run the suite at the same time without sharing containers, images or a port.

Its own code is tested like the rest of the suite: the collage layout, pixel parity, the report and the step list in
`../unit/e2e-*.test.ts`, the collage drawn in Chrome and the report opened from disk in `../integration/e2e-browser.test.ts`.
