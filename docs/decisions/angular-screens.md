# Screens into Angular components: decisions

Architecture phase E (`docs/architecture-migration.md` §3): the app's screens move from the legacy script's
string-built HTML into Angular components in `frontends/app/src/app/screens/<screen>/`, one screen a release. Tests:
the screen's logic, apart from Angular, in `frontends/app/test/unit/<screen>.test.ts` (node --test); its rendering and
behaviour in the Docker e2e (`tests/e2e/flow.ts`, against both builds) and its parity (the Angular app's screen against
the single-file page's, pixel for pixel).

These are code-layout decisions, not coaching rulings: none changes what a program prescribes, what a screen shows or
what is stored.

## How a screen moves (v0.239.8)

- **Date:** 2026-10-12. **Decided by:** the session, inside Mario's standing answer for the migration ("PATCH each, in
  order").
- **The Angular app hosts the legacy app whole** (`LegacyHost` mounts its markup and runs its script) and, once it has
  booted, puts each moved screen's component inside that screen's element, in place of its content
  (`src/app/screens/screens.ts`, `MOVED_SCREENS`). The screen element stays, so the legacy navigation (`showScreen`, the
  tab bar) shows and hides it as before, and the component's host takes no box (`display: contents`), so the screen's
  layout sees the same children.
- **The single-file page keeps the legacy screen** until Mario switches the Pages source to the Angular build: Pages
  serves the page, and the native app runs the Angular build. The e2e's parity holds the two the same, screen by
  screen; when Pages serves the Angular build, the legacy screen's code goes.
- **A component reads the legacy app through `LegacyBridge`:** `call(name, ...)` for a legacy function, and
  `global(name)` for a top-level binding (`activeProg`, `currentWeek`, `IA_VERSION`), which a classic script keeps in the
  global scope but not on `globalThis`; an indirect eval of a validated identifier reads it.
- **The markup moves as it is**, element for element and inline style for inline style, so the screen looks as it did;
  restyling it into component CSS and the design system's tokens is a later step under its own parity proof.
- **The logic moves apart from Angular** (`<screen>-model.ts`, no Angular import), so node --test tests it as it is;
  `src/app/package.json` marks the app's TypeScript as ES modules for Node and tsc.
- **Each step is a PATCH:** the native app's version label comes from `ia-version`, so a release that changes only the
  Angular app still moves it.

## Release scope: v0.239.8 moves the bug report

- **Date:** 2026-10-12. **Picked by:** Mario's standing answer (PATCH, in order). **Shipped:** v0.239.8.
- **Moved:** `#screenBugs`, the bug report: `src/app/screens/bug-report/bug-report.ts` (the component, signals for the
  text, the sending state and the status line) and `bug-report-model.ts` (the context block, the Web3Forms body, how a
  send ends, the status lines and toast, each the legacy `submitBug`'s word for word). The legacy `submitBug` stays in
  the single-file page. The unreachable branch for an unset form key is not carried over (the key is set).
- **Tests:** `frontends/app/test/unit/bug-report.test.ts` (5: the context block typed by hand, the program-less and
  partial program lines, the posted body and headers, every way a send ends, the status lines); the e2e's bug-report
  step now also sends with nothing typed and expects 'Type what went wrong first.' on both builds. A local headless
  look found the Angular screen and the page's 0 of 334,836 pixels apart, the same label and the same empty-send line.
- **Does not change:** the single-file page (only its version meta); any program; any stored key or value.
