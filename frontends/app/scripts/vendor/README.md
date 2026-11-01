acorn 8.19.0 (https://github.com/acornjs/acorn), its ESM build and its types copied as they are from node_modules/acorn/dist/acorn.mjs and acorn.d.mts, MIT (acorn.LICENSE).
The build (scripts/build-index.mjs) parses each script piece with it to strip comments (D268, docs/decisions/page-comments.md),
and it lives here because Heroku, the Docker image and CI's unit job build the page before, or without, an install of
frontends/app's dependencies. Replace the file whole when acorn is updated; never edit it.
