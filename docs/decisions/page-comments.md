# Page comments: decisions

What the build keeps of the source files' comments when it writes the app's page (`frontends/app/scripts/build-index.mjs`,
`pieceBytes`). The sources keep every comment they are written with; this file rules on what reaches `index.html`.
Tests: `tests/unit/page-comments.test.ts`.

## D268 P-NOCOMMENT: the page ships without its comments

- **Date:** 2026-11-01. **Ruled by:** the main session in the coach hat, on Mario's "Yes, both" (2026-11-01, after
  asking what could strip the race plans' source from what ships and whether it would break the code).
- **Finding:** the build joins the source files byte for byte, so every comment written in `js/`, `engine/`, `css/`
  and `html/` ships in the page: 6,577 script comments (503 KB of a 1.3 MB page), 94 CSS comments and 15 HTML
  comments, measured at v0.255.0. The race plans' source is named by brand in 53 of them (47 script comments, the
  two CSS file headers, none in a string literal or in anything the athlete reads). The athlete never sees a comment;
  anyone who reads the page's source does, on Pages, on Heroku's `/app/` and in the public repo's root copy. The
  native app's bundle (`frontends/app/scripts/legacy-bundle.mjs`, esbuild with `legalComments: 'none'`) already ships
  without them. Every one of the 42 script pieces parses on its own with acorn, so a piece can lose its comments
  before the pieces are joined.
- **Changes:** `pieceBytes` strips the comments of every piece (`withoutComments`). A JS or TS piece is parsed by acorn
  (`frontends/app`'s own dependency from this release) and each comment is cut by its byte range: a block comment
  becomes the line breaks it held, or one space when it held none, and a line comment leaves its own line break, so a
  piece keeps its line count and the `--check` message still names the right source line. A CSS piece loses its
  `/* … */` comments and an HTML piece its `<!-- … -->` comments, each by its own syntax; the build refuses a CSS
  piece whose `/*` and `*/` counts differ. The page runs the same script, token for token (`tools/same-script.mjs`
  against the v0.255.0 page lists every comment removed and no other difference).
- **Does not change:** the sources (every comment stays where it is written, and so does the handoff, the decision
  files, the tests and `core/src/domain`); the native bundle; any behaviour; program output; HALF_MANNY. The `@ts-expect-error`
  markers the build already dropped (`withoutMarkers`) go as before.
- **Expected values:** the page's inline script parses with zero comments; no `/*` in its `<style>` blocks; no `<!--`
  outside its script (the four inside it are string literals); `/nike/i` matches nothing in the page; the page is
  about 0.8 MB.
- **Released:** v0.255.1 (Patch, Mario 2026-11-01).
