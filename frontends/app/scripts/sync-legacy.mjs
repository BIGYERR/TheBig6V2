#!/usr/bin/env node
// Generates the Angular app's legacy inputs from the app's page, built from its source files (src/legacy/src/, by
// scripts/build-index.mjs, the one builder), the single source of truth.
//
//   node scripts/sync-legacy.mjs            write src/legacy/generated/* and public/legacy/*
//   node scripts/sync-legacy.mjs --check    exit 1 if the generated files are stale (no writes)
//
// The page is what GitHub Pages deploys (dist-github-pages/) and what every test under tests/ boots. Every build
// re-derives four pieces from it, byte for byte:
//   head    every <meta>, <link> and <title> (ia-version included, so the update check reads the same version)
//   style   the one <style> block                         -> src/legacy/generated/legacy.css
//   markup  the rest sheet's markup, the one legacy markup -> src/legacy/generated/legacy-markup.ts
//           the Angular shell does not draw (the page's whole body markup stays in split()'s result)
//   script  the one inline <script>, but its last line     -> public/legacy/app.js (read by npm run lint:legacy)
// and, from the page's source files themselves, the legacy app as ES modules -> public/legacy/legacy.js, the module
// script the Angular shell runs (scripts/legacy-bundle.mjs, since v0.239.42; its types in src/legacy/generated). The
// script's last line boots the page (init() once the document has loaded); the Angular shell calls init() itself, once
// its components are in place (src/app/legacy/legacy-host.ts), so neither copy carries it.
// The split follows the HTML parser's own rule: a script ends at the first "</script>". Each piece is asserted to
// occur exactly once; anything else fails loudly rather than producing a quietly different app.
// split() and render() are exported for test/; nothing is read or written unless this file is run as a script.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync, copyFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { metaVersion } from './version.mjs';
import { ICON, buildIndex } from './build-index.mjs';
import { BOOT_LINE, legacyBundle } from './legacy-bundle.mjs';

export { BOOT_LINE };

const APP = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const GEN = join(APP, 'src', 'legacy', 'generated');
const PUB = join(APP, 'public');

function fail(msg) {
  throw new Error(msg);
}

function countOf(haystack, needle) {
  let n = 0;
  for (let i = haystack.indexOf(needle); i !== -1; i = haystack.indexOf(needle, i + 1)) n++;
  return n;
}

export function split(html) {
  const headEnd = html.indexOf('</head>');
  const bodyOpen = html.indexOf('<body');
  const bodyClose = html.lastIndexOf('</body>');
  if (headEnd < 0 || bodyOpen < 0 || bodyClose < 0) fail('index.html has no </head>, <body> or </body>');

  const head = html.slice(html.indexOf('<head>') + '<head>'.length, headEnd);
  if (countOf(head, '<style') !== 1) fail(`expected exactly one <style> in <head>, found ${countOf(head, '<style')}`);
  const styleOpenEnd = head.indexOf('>', head.indexOf('<style')) + 1;
  const styleClose = head.indexOf('</style>');
  const css = head.slice(styleOpenEnd, styleClose);
  const headRest = head.slice(0, head.indexOf('<style')) + head.slice(styleClose + '</style>'.length);
  if (countOf(headRest, '<script') !== 0) fail('a <script> in <head> is not supported by the host');

  const bodyTagEnd = html.indexOf('>', bodyOpen) + 1;
  const bodyTag = html.slice(bodyOpen, bodyTagEnd);
  if (bodyTag !== '<body>') fail(`the <body> tag carries attributes the host does not copy: ${bodyTag}`);

  const scriptOpen = html.indexOf('<script', bodyTagEnd);
  if (scriptOpen < 0) fail('no <script> in <body>');
  const scriptOpenEnd = html.indexOf('>', scriptOpen) + 1;
  if (html.slice(scriptOpen, scriptOpenEnd) !== '<script>') fail('the body script must be a plain inline <script>');
  const scriptClose = html.indexOf('</script>', scriptOpenEnd);
  const js = html.slice(scriptOpenEnd, scriptClose);

  const before = html.slice(bodyTagEnd, scriptOpen);
  const after = html.slice(scriptClose + '</script>'.length, bodyClose);
  for (const [name, part] of [['before', before], ['after', after]]) {
    if (countOf(part, '<script') !== 0) fail(`a second <script> in the body markup (${name} the app script)`);
  }

  // As written ("239" stays "239", "0.239.1" stays "0.239.1"); a meta that is not a version throws (scripts/version.mjs).
  const version = metaVersion(headRest);
  if (version === null) fail('no <meta name="ia-version"> in <head>');
  return { headRest, css, js, markup: before + after, version };
}

/** The open tag of the one legacy overlay whose markup the Angular shell still takes from the page. */
export const REST_OVERLAY_OPEN = '<div class="rand-overlay" id="restOverlay">';

/** The script without its boot line, which must be its last line and occur once. */
export function withoutBoot(js) {
  if (countOf(js, BOOT_LINE) !== 1) fail(`the script's boot line occurs ${countOf(js, BOOT_LINE)} times (want 1)`);
  const at = js.lastIndexOf(BOOT_LINE);
  if (js.slice(at + BOOT_LINE.length).trim() !== '') fail("the boot line is not the script's last line");
  return js.slice(0, at) + js.slice(at + BOOT_LINE.length);
}

/** The markup between an element's open tag (which must occur once) and its matching close, divs counted. */
export function innerOf(markup, open) {
  if (countOf(markup, open) !== 1) fail(`${open} occurs ${countOf(markup, open)} times in the body markup (want 1)`);
  const start = markup.indexOf(open) + open.length;
  let depth = 1;
  const tag = /<(\/?)div\b[^>]*>/g;
  tag.lastIndex = start;
  for (let m = tag.exec(markup); m; m = tag.exec(markup)) {
    depth += m[1] ? -1 : 1;
    if (depth === 0) return markup.slice(start, m.index);
  }
  fail(`${open} never closes`);
}

export function render(src) {
  const parts = split(src);
  const sha256 = createHash('sha256').update(src).digest('hex');
  const banner = `GENERATED by scripts/sync-legacy.mjs from the page built from src/legacy/src (ia-version ${parts.version}, sha256 ${sha256}). Do not edit.`;

  const indexHtml =
    `<!doctype html>\n<!-- ${banner} -->\n<html lang="en">\n<head>\n<base href="/">` +
    parts.headRest +
    `</head>\n<body>\n  <ia-root></ia-root>\n</body>\n</html>\n`;

  const markupTs =
    `// ${banner}\n` +
    `export const LEGACY_VERSION = ${JSON.stringify(parts.version)};\n` +
    `export const LEGACY_SHA256 = ${JSON.stringify(sha256)};\n` +
    `export const LEGACY_SCRIPT_URL = ${JSON.stringify(`legacy/legacy.js?v=${parts.version}-${sha256.slice(0, 12)}`)};\n` +
    `export const LEGACY_REST_OVERLAY = ${JSON.stringify(innerOf(parts.markup, REST_OVERLAY_OPEN))};\n`;

  return {
    [join(GEN, 'index.html')]: indexHtml,
    [join(GEN, 'legacy.css')]: `/* ${banner} */\n` + parts.css,
    [join(GEN, 'legacy-markup.ts')]: markupTs,
    [join(GEN, 'legacy-manifest.json')]: JSON.stringify({ version: parts.version, sha256 }, null, 2) + '\n',
    [join(PUB, 'legacy', 'app.js')]: withoutBoot(parts.js),
  };
}

async function main() {
  const src = buildIndex().toString('utf8');
  const files = render(src);
  const bundle = await legacyBundle();
  files[join(PUB, 'legacy', 'legacy.js')] = bundle.js;
  files[join(GEN, 'legacy-bundle.d.ts')] = bundle.dts;
  const check = process.argv.includes('--check');
  const stale = [];
  for (const [path, body] of Object.entries(files)) {
    const current = existsSync(path) ? readFileSync(path, 'utf8') : null;
    if (current === body) continue;
    stale.push(path);
    if (!check) {
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, body);
    }
  }
  const iconOut = join(PUB, 'apple-touch-icon.png');
  if (!check) copyFileSync(ICON, iconOut);

  const { version } = JSON.parse(files[join(GEN, 'legacy-manifest.json')]);
  if (check) {
    if (stale.length) fail(`stale: ${stale.map((p) => p.slice(APP.length + 1)).join(', ')} (run npm run sync)`);
    console.log(`sync-legacy: up to date with ia-version ${version}`);
  } else {
    console.log(`sync-legacy: ia-version ${version}, ${stale.length} file(s) written`);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error(`sync-legacy: ${err.message}`);
    process.exit(1);
  });
}
