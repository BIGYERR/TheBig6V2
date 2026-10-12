#!/usr/bin/env node
// Builds the app's page from its source files: the pieces src/legacy/src/order.json lists, concatenated in that order,
// byte for byte, with nothing added between them. Code is edited in src/legacy/src/; the page is generated.
//
//   node scripts/build-index.mjs            write ../../dist-github-pages/ (the page and its icon: what GitHub Pages
//                                           deploys, what the tests boot, what the backend serves at /app/) and the
//                                           repo root index.html, its committed copy (npm run build:index)
//   node scripts/build-index.mjs --check    build into a temp file and exit 1 unless it equals ../../index.html byte for
//                                           byte, naming the first byte that differs and the source file it comes
//                                           from (npm run build:index:check; tools/check.mjs and CI run it)
//
// The root index.html is the copy GitHub Pages serves while its source is the branch `main`. It goes, with --check, in
// the merge where Mario switches the Pages source to GitHub Actions, which then deploys dist-github-pages/ (handoff §12).
//
// Each JS file is also an ES module (architecture phase C): scripts/module-blocks.mjs writes an import block at its top
// and an export block at its bottom, each ending or starting on a fixed marker line. The build strips both blocks, so
// the page carries the classic script, byte for byte what the code between the markers says.
//
// The engine is TypeScript in @ia/core (architecture phase D): order.json lists each of its files as engine/<name>.ts,
// which is core/src/engine/<name>.ts, and the build strips its module blocks and then its types. Node's own stripper
// (node:module stripTypeScriptTypes, strip mode) puts spaces where the types were and changes nothing else, and the
// build then takes those spaces out (collapseTypes), so the page carries the JavaScript as it was written before its
// types: the same tokens, and the same text but for comments (tools/same-script.mjs proves it against any earlier page).
//
// order.json is the one list of pieces. Every entry is a file under html/, css/ or js/ with that folder's extension,
// or engine/ with .ts, named in lower case words joined by dashes, listed once; every such file in those folders (and
// every .ts file in core/src/engine but its index.ts) must be listed, so no source file can sit outside the build. buildIndex() is exported for the dev container (backend/scripts/dev-watch.ts),
// which builds the page it serves from the same sources and never writes the repo root. Nothing is read or written
// unless this file is run as a script; writePages() is exported for the tests' global setup and the backend.
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const APP = resolve(dirname(fileURLToPath(import.meta.url)), '..');
/** The app's source files: html/, css/, js/ and order.json. */
export const SOURCES = join(APP, 'src', 'legacy', 'src');
/** The page's committed copy at the repo root, which GitHub Pages serves while its source is the branch `main`. */
export const TARGET = join(APP, '..', '..', 'index.html');
/** The folder GitHub Pages deploys from GitHub Actions (Mario, 2026-10-12): the page and its icon, nothing else. Built, never committed. */
export const PAGES_DIR = join(APP, '..', '..', 'dist-github-pages');
/** The page's icon (the page links apple-touch-icon.png beside itself). */
export const ICON = join(APP, '..', '..', 'apple-touch-icon.png');

const FOLDERS = ['html', 'css', 'js'];
/** html/<name>.html, css/<name>.css, js/<name>.js, engine/<name>.ts; <name> is lower case words joined by dashes. */
const PIECE_RE = /^(?:(html|css|js)\/[a-z][a-z0-9]*(?:-[a-z][a-z0-9]*)*\.\1|engine\/[a-z][a-z0-9]*(?:-[a-z][a-z0-9]*)*\.ts)$/;

/**
 * core/src/engine beside a sources folder: the repo's core/ when `srcDir` is the repo's sources, and a copy's when it
 * is a copy of the repo's shape (a test's variant). order.json's engine/<name>.ts is <this>/<name>.ts.
 * @param {string} [srcDir]
 */
export function engineDir(srcDir = SOURCES) {
  return join(srcDir, '..', '..', '..', '..', '..', 'core', 'src', 'engine');
}

/**
 * Where a piece lives on disk.
 * @param {string} srcDir
 * @param {string} piece
 */
export function piecePath(srcDir, piece) {
  return piece.startsWith('engine/') ? join(engineDir(srcDir), piece.slice('engine/'.length)) : join(srcDir, piece);
}

/**
 * TypeScript as the JavaScript it runs: every type replaced by spaces (and newlines kept), nothing else touched, so the
 * tokens are the ones the code had before its types were written. Node marks the stripper experimental and warns once
 * a process; that warning says nothing about the page, so it is kept out of the build's output.
 * @param {string} code
 * @param {string} [what]
 * @returns {string}
 */
export function stripTypes(code, what = 'the code') {
  const emit = process.emitWarning;
  process.emitWarning = /** @type {typeof process.emitWarning} */ ((warning, ...rest) => {
    if (!/stripTypeScriptTypes/.test(String(typeof warning === 'string' ? warning : warning.message))) emit.call(process, warning, .../** @type {any[]} */ (rest));
  });
  try {
    return stripTypeScriptTypes(code, { mode: 'strip' });
  } catch (err) {
    throw new Error(`${what}: the types could not be stripped: ${err instanceof Error ? err.message : err}`, { cause: err });
  } finally {
    process.emitWarning = emit;
  }
}
/** A word that is a version (v0, v239): a release number never goes in a file name. */
const VERSION_WORD_RE = /(?:^|[/-])v\d/;

/** The line that ends a JS file's import block: everything above it, and the line itself, is the module's imports. */
export const MODULE_IMPORTS_END = '// end of the module imports (scripts/module-blocks.mjs writes them; build-index.mjs strips them)\n';
/** The line, newline first, that starts a JS file's export block: it and everything below it is the module's exports. */
export const MODULE_EXPORTS_START = '\n// the module exports (scripts/module-blocks.mjs writes them; build-index.mjs strips them)\n';

/**
 * A JS source file split into its import block (`head`, '' when it has none), the classic script between the markers
 * (`body`) and its export block (`tail`, '' when it has none). Throws when a marker appears twice, or when the head or
 * the tail holds anything but module syntax, so a stray line can never slip into or out of the page.
 * @param {string} text
 * @returns {{ head: string, body: string, tail: string }}
 */
export function moduleParts(text) {
  const twice = (marker) => { const i = text.indexOf(marker); return i !== -1 && text.indexOf(marker, i + 1) !== -1; };
  if (twice(MODULE_IMPORTS_END) || twice(MODULE_EXPORTS_START)) throw new Error('a module marker appears twice');
  const i = text.indexOf(MODULE_IMPORTS_END);
  const from = i === -1 ? 0 : i + MODULE_IMPORTS_END.length;
  const j = text.indexOf(MODULE_EXPORTS_START, from);
  const to = j === -1 ? text.length : j;
  const head = text.slice(0, from);
  const tail = text.slice(to);
  const imports = head.slice(0, head.length - (i === -1 ? 0 : MODULE_IMPORTS_END.length));
  if (!/^(?:import \{[^}]*\} from '(?:\.\/[a-z0-9-]+\.(?:js|ts)|(?:\.\.\/)+core\/src\/engine\/[a-z0-9-]+\.ts)';\n)*$/.test(imports)) throw new Error('the import block holds something other than import lines');
  if (tail && !/^\n\/\/ the module exports [^\n]*\nexport \{[^}]*\};\n$/.test(tail)) throw new Error('the export block holds something other than one export list');
  return { head, body: text.slice(from, to), tail };
}

/**
 * The stripped code with each stripped type taken out rather than left as blanks: the JavaScript as it was written
 * before its types were. `js` is `ts` through stripTypes, character for character the same length, so a character the
 * stripper erased is one that is a blank in `js` and not in `ts`. Each run of erased characters goes, with the blanks
 * inside it, and then the blanks around it are evened out without ever taking a line break between two tokens away
 * (a line break can decide where JavaScript ends a statement):
 *   - a type-only line (`import type`, an interface, an overload) goes whole, with its indent and its line break;
 *   - between two spaces, one goes (`a as T || b` reads `a || b`);
 *   - a space before a run that closes against a token goes too (`f(x as T)` reads `f(x)`).
 * Every other character is kept as it is. `at`, when given, gets the index in `ts` of each character kept
 * (tools/engine-move.mjs maps the page back to the source with it).
 * @param {string} ts
 * @param {string} js
 * @param {number[]} [at]
 * @returns {string}
 */
export function collapseTypes(ts, js, at) {
  if (ts.length !== js.length) throw new Error('collapseTypes: the stripped code is not the length of its source');
  const blank = (/** @type {string | undefined} */ c) => c === ' ' || c === '\t' || c === '\n' || c === '\r';
  const space = (/** @type {string | undefined} */ c) => c === ' ' || c === '\t';
  /** @type {string[]} */
  const out = [];
  let i = 0;
  while (i < js.length) {
    if (!blank(js[i]) || blank(ts[i])) {
      out.push(js[i]);
      at?.push(i);
      i++;
      continue;
    }
    let end = i;
    for (let j = i; j < js.length && blank(js[j]); j++) if (!blank(ts[j])) end = j + 1;
    i = end;
    // What follows the run: a blank the source wrote (kept so far), a token, or the end.
    const next = i < js.length ? js[i] : undefined;
    let k = out.length;
    while (k > 0 && space(out[k - 1])) k--;
    const lineBlank = k === 0 || out[k - 1] === '\n';
    if (lineBlank && (next === '\n' || next === '\r')) {
      out.length = k;
      if (at) at.length = k;
      i += next === '\r' && js[i + 1] === '\n' ? 2 : 1;
    } else if (space(out[out.length - 1]) && space(next)) {
      i++;
    } else if (!lineBlank && space(out[out.length - 1]) && next !== undefined && !blank(next)) {
      out.pop();
      at?.pop();
    }
  }
  return out.join('');
}

/**
 * What a piece adds to the page: an HTML or CSS file as it is, a JS file without its module blocks, a TypeScript file
 * without its module blocks and its types (collapseTypes).
 * @param {string} srcDir
 * @param {string} piece
 * @returns {Buffer}
 */
export function pieceBytes(srcDir, piece) {
  const bytes = readFileSync(piecePath(srcDir, piece));
  if (piece.endsWith('.js')) return Buffer.from(moduleParts(bytes.toString('utf8')).body, 'utf8');
  if (piece.endsWith('.ts')) {
    const body = moduleParts(bytes.toString('utf8')).body;
    return Buffer.from(collapseTypes(body, stripTypes(body, piece)), 'utf8');
  }
  return bytes;
}

/**
 * The pieces in build order, as order.json lists them. Throws on anything that would quietly build a different page:
 * a missing or repeated entry, a badly named one, or a source file the list leaves out.
 * @param {string} [srcDir]
 * @returns {string[]}
 */
export function readOrder(srcDir = SOURCES) {
  const order = JSON.parse(readFileSync(join(srcDir, 'order.json'), 'utf8'));
  if (!Array.isArray(order) || !order.length) throw new Error('order.json must be a list of piece paths');
  const listed = new Set();
  for (const piece of order) {
    if (typeof piece !== 'string' || !PIECE_RE.test(piece) || VERSION_WORD_RE.test(piece)) {
      throw new Error(`order.json: ${JSON.stringify(piece)} is not html/, css/, js/ or engine/ plus a file named in lower case words joined by dashes`);
    }
    if (listed.has(piece)) throw new Error(`order.json lists ${piece} twice`);
    if (!existsSync(piecePath(srcDir, piece))) throw new Error(`order.json lists ${piece}, which does not exist`);
    listed.add(piece);
  }
  for (const folder of FOLDERS) {
    const files = existsSync(join(srcDir, folder)) ? readdirSync(join(srcDir, folder)) : [];
    for (const file of files) {
      if (file.endsWith(`.${folder}`) && !listed.has(`${folder}/${file}`)) {
        throw new Error(`${folder}/${file} is not in order.json, so the build would leave it out`);
      }
    }
  }
  const engine = engineDir(srcDir);
  for (const file of existsSync(engine) ? readdirSync(engine) : []) {
    if (file.endsWith('.ts') && file !== 'index.ts' && !listed.has(`engine/${file}`)) {
      throw new Error(`core/src/engine/${file} is not in order.json, so the build would leave it out`);
    }
  }
  return order;
}

/**
 * The page: every piece's bytes in order.json's order, the JS files without their module blocks, nothing added
 * between them.
 * @param {string} [srcDir]
 * @returns {Buffer}
 */
export function buildIndex(srcDir = SOURCES) {
  return Buffer.concat(readOrder(srcDir).map((piece) => pieceBytes(srcDir, piece)));
}

/**
 * Writes the deploy folder: index.html, the build of the sources, and the icon beside it. Each file is written beside
 * itself and renamed over the old one, so a reader never sees half a page. Returns the page.
 * @param {string} [outDir]
 * @param {string} [srcDir]
 * @returns {Buffer}
 */
export function writePages(outDir = PAGES_DIR, srcDir = SOURCES) {
  const page = buildIndex(srcDir);
  mkdirSync(outDir, { recursive: true });
  const put = (/** @type {string} */ name, /** @type {(tmp: string) => void} */ write) => {
    const tmp = join(outDir, `${name}.${process.pid}.tmp`);
    write(tmp);
    renameSync(tmp, join(outDir, name));
  };
  put('index.html', (tmp) => writeFileSync(tmp, page));
  put('apple-touch-icon.png', (tmp) => copyFileSync(ICON, tmp));
  return page;
}

/**
 * The first byte offset at which two buffers differ, or -1 when they are equal. When one is a prefix of the other, the
 * offset is the shorter one's length.
 * @param {Buffer} a
 * @param {Buffer} b
 * @returns {number}
 */
export function firstDifference(a, b) {
  if (Buffer.compare(a, b) === 0) return -1;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) if (a[i] !== b[i]) return i;
  return n;
}

/**
 * Line and column (both from 1) of a byte offset.
 * @param {Buffer} buf
 * @param {number} offset
 */
function lineCol(buf, offset) {
  let line = 1;
  let lineStart = 0;
  for (let i = buf.indexOf(10); i !== -1 && i < offset; i = buf.indexOf(10, i + 1)) {
    line++;
    lineStart = i + 1;
  }
  return { line, column: offset - lineStart + 1 };
}

const sha256 = (/** @type {Buffer} */ buf) => createHash('sha256').update(buf).digest('hex');
const versionOf = (/** @type {Buffer} */ buf) => /<meta name="ia-version" content="([^"]*)"/.exec(buf.toString('utf8'))?.[1] ?? '(none)';
const around = (/** @type {Buffer} */ buf, /** @type {number} */ at) => JSON.stringify(buf.subarray(Math.max(0, at - 20), at + 20).toString('utf8'));

/**
 * Builds into a temp file and compares it with `target`, byte for byte, as cmp would.
 * @param {string} [srcDir]
 * @param {string} [target]
 * @returns {{ ok: boolean, message: string, offset: number, kept: string | null }}
 */
export function checkIndex(srcDir = SOURCES, target = TARGET) {
  const order = readOrder(srcDir);
  const dir = mkdtempSync(join(tmpdir(), 'ia-build-index-'));
  const tmp = join(dir, 'index.html');
  writeFileSync(tmp, buildIndex(srcDir));
  const built = readFileSync(tmp);
  if (!existsSync(target)) return { ok: false, message: `no ${target} to compare with; the build is kept at ${tmp}`, offset: 0, kept: tmp };
  const committed = readFileSync(target);
  const offset = firstDifference(built, committed);
  if (offset === -1) {
    rmSync(dir, { recursive: true, force: true });
    return {
      ok: true,
      message: `index.html is the build of ${order.length} source files: ${built.length} bytes, ia-version ${versionOf(built)}, sha256 ${sha256(built)}`,
      offset,
      kept: null,
    };
  }
  // The source file the differing byte comes from, and its line there.
  let from = 'past the last source file';
  let start = 0;
  for (const piece of order) {
    const bytes = pieceBytes(srcDir, piece);
    if (offset < start + bytes.length) {
      // A line in the file as it is on disk: the import block's lines come first.
      const head = /\.(js|ts)$/.test(piece) ? moduleParts(readFileSync(piecePath(srcDir, piece), 'utf8')).head : '';
      from = `${piece} line ${lineCol(bytes, offset - start).line + (head.match(/\n/g) ?? []).length}`;
      break;
    }
    start += bytes.length;
  }
  const at = lineCol(committed, offset);
  return {
    ok: false,
    message: [
      `index.html is not the build of the source files: the first difference is byte ${offset} (index.html line ${at.line}, column ${at.column}; ${from})`,
      `  built       ${around(built, offset)}`,
      `  index.html  ${around(committed, offset)}`,
      `  built ${built.length} bytes, sha256 ${sha256(built)}; index.html ${committed.length} bytes, sha256 ${sha256(committed)}`,
      `  the build is kept at ${tmp}`,
      '  Edit the source files under frontends/app/src/legacy/src/, then run npm run build:index in frontends/app/. Never edit index.html by hand.',
    ].join('\n'),
    offset,
    kept: tmp,
  };
}

function main() {
  if (process.argv.includes('--check')) {
    const result = checkIndex();
    if (!result.ok) {
      console.error(`build-index: ${result.message}`);
      process.exit(1);
    }
    console.log(`build-index: ${result.message}`);
    return;
  }
  const order = readOrder();
  const built = writePages();
  const what = `${order.length} source files: ${built.length} bytes, ia-version ${versionOf(built)}, sha256 ${sha256(built)}`;
  console.log(`build-index: wrote dist-github-pages/ (index.html and apple-touch-icon.png) from ${what}`);
  if (existsSync(TARGET) && Buffer.compare(readFileSync(TARGET), built) === 0) {
    console.log(`build-index: index.html is unchanged, the build of ${what}`);
    return;
  }
  // Written beside itself and renamed over the old file, so nothing ever reads half a page.
  writeFileSync(`${TARGET}.tmp`, built);
  renameSync(`${TARGET}.tmp`, TARGET);
  console.log(`build-index: wrote index.html from ${what}`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main();
  } catch (err) {
    console.error(`build-index: ${err instanceof Error ? err.message : err}`);
    process.exit(1);
  }
}
