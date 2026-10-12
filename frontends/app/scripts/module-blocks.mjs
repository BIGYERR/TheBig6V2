#!/usr/bin/env node
// The ES-module blocks of the app's JS source files (architecture phase C, step 1; docs/architecture-migration.md).
// Each file under src/legacy/src/js is a classic script that build-index.mjs joins into the page (index.html), and also an
// ES module: an import block at its top names every top-level name of another file it uses, and an export block at its
// bottom names every top-level name another file uses, and those the tests reach through tests/harness.js's
// EXPORT_NAMES. build-index.mjs strips both blocks (MODULE_IMPORTS_END, MODULE_EXPORTS_START), so the page is the
// classic script, byte for byte. This script writes the blocks from the code itself: acorn parses the joined classic
// script and eslint-scope resolves every reference, so a block never names what the code does not use.
//
//   node scripts/module-blocks.mjs           rewrite every JS file's blocks (npm run build:index runs it first)
//   node scripts/module-blocks.mjs --check   exit 1, naming each file, unless every block is what the code needs
//
// The engine's files are TypeScript in core/src/engine (architecture phase D; order.json lists them as engine/<name>.ts).
// Their types are stripped before the parse (spaces where the types were, so every position stays put), and an import
// is written as the path from the importing file to the file it names: './x.js' between the app's files, './x.ts'
// between the engine's, and '../../../../../../core/src/engine/x.ts' from an app file to an engine file. The engine
// never imports the app (a core file importing an app file is an error). A TypeScript file's type imports are written
// by hand below the import block, inside the code, where the build strips them with the other types.
//
// A name declared in two files (only _isoToday today, in wizard.js and overlays.js) is imported from the later one,
// which is the one the classic script runs; the earlier file keeps using its own. Both return the same date string.
// Nothing is read or written unless this file is run as a script.
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, posix, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MODULE_EXPORTS_START, MODULE_IMPORTS_END, moduleParts, piecePath, readOrder, SOURCES, stripTypes } from './build-index.mjs';

const require = createRequire(import.meta.url);
const acorn = require('acorn');
const escope = require('eslint-scope');
const evk = require('eslint-visitor-keys');
const REPO = join(SOURCES, '..', '..', '..', '..', '..');
const WIDTH = 120;

/** `import { a, b } from './x.js';` on one line when it fits in WIDTH, else the names wrapped two spaces in. */
function importLine(names, spec) {
  const one = `import { ${names.join(', ')} } from '${spec}';\n`;
  return one.length <= WIDTH + 1 ? one : `import {\n${wrap(names)}} from '${spec}';\n`;
}

/** A piece's code as JavaScript: a TypeScript file's types stripped, every position unchanged. */
function codeOf(piece, text) {
  return piece.endsWith('.ts') ? stripTypes(text, piece) : text;
}

/** The import specifier from one piece to another: the relative path between them, with ./ when it stays beside. */
function specifier(srcDir, user, target) {
  if (user.startsWith('engine/') && !target.startsWith('engine/')) {
    throw new Error(`${user} uses ${target}: the engine (core/src/engine) never imports the app's own files`);
  }
  const rel = relative(dirname(piecePath(srcDir, user)), piecePath(srcDir, target)).split(sep).join(posix.sep);
  return rel.startsWith('.') ? rel : `./${rel}`;
}
/** `export { a, b };` on one line when it fits in WIDTH, else the names wrapped two spaces in. */
function exportLine(names) {
  const one = `export { ${names.join(', ')} };\n`;
  return one.length <= WIDTH + 1 ? one : `export {\n${wrap(names)}};\n`;
}
function wrap(names) {
  const lines = [];
  let line = ' ';
  for (const n of names) {
    if (line.length + n.length + 2 > WIDTH) { lines.push(line); line = ' '; }
    line += ` ${n},`;
  }
  lines.push(line);
  return lines.join('\n') + '\n';
}

/**
 * What every JS piece's blocks must say, from its code: Map(piece -> { head, tail }), plus the counts.
 * @param {string} [srcDir]
 */
export function moduleBlocks(srcDir = SOURCES) {
  const pieces = readOrder(srcDir).filter((p) => /\.(js|ts)$/.test(p));
  const files = pieces.map((p) => p.replace(/^(js|engine)\//, '').replace(/\.(js|ts)$/, ''));
  let script = '';
  const starts = [];
  for (const p of pieces) {
    starts.push(script.length);
    script += codeOf(p, moduleParts(readFileSync(piecePath(srcDir, p), 'utf8')).body);
  }
  const fileAt = (pos) => { let k = 0; while (k + 1 < starts.length && starts[k + 1] <= pos) k++; return files[k]; };
  const ast = acorn.parse(script, { ecmaVersion: 'latest', sourceType: 'script', ranges: true });
  const gs = escope.analyze(ast, { ecmaVersion: 2022, sourceType: 'script', ignoreEval: true, childVisitorKeys: evk.KEYS, fallback: 'iteration' }).globalScope;

  const declaredIn = new Map(); // name -> files that declare it, in build order
  for (const v of gs.variables) {
    const at = [...new Set(v.defs.map((d) => fileAt(d.name.range[0])))].sort((a, b) => files.indexOf(a) - files.indexOf(b));
    if (at.length) declaredIn.set(v.name, at);
  }
  const imports = new Map(files.map((f) => [f, new Map()])); // file -> Map(from file -> Set(names))
  const exports = new Map(files.map((f) => [f, new Set()]));
  for (const v of gs.variables) {
    const at = declaredIn.get(v.name);
    if (!at) continue;
    const winner = at[at.length - 1];
    for (const r of v.references) {
      const user = fileAt(r.identifier.range[0]);
      if (at.includes(user)) continue;
      const from = imports.get(user);
      if (!from.has(winner)) from.set(winner, new Set());
      from.get(winner).add(v.name);
      exports.get(winner).add(v.name);
    }
  }
  const { EXPORT_NAMES } = require(join(REPO, 'tests', 'harness.js'));
  for (const n of EXPORT_NAMES) {
    const at = declaredIn.get(n);
    if (at) exports.get(at[at.length - 1]).add(n);
  }
  const byName = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
  const blocks = new Map();
  let importCount = 0;
  let exportCount = 0;
  for (const [k, p] of pieces.entries()) {
    const f = files[k];
    const from = [...imports.get(f)].sort((a, b) => files.indexOf(a[0]) - files.indexOf(b[0]));
    const head = from.length ? from.map(([g, ns]) => importLine([...ns].sort(byName), specifier(srcDir, p, pieces[files.indexOf(g)]))).join('') + MODULE_IMPORTS_END : '';
    const out = [...exports.get(f)].sort(byName);
    const tail = out.length ? MODULE_EXPORTS_START + exportLine(out) : '';
    importCount += from.reduce((n, [, ns]) => n + ns.size, 0);
    exportCount += out.length;
    blocks.set(p, { head, tail });
  }
  // Writes to names nobody declares would throw once the code runs as a module (strict mode).
  const implicit = [...new Set(gs.through.filter((r) => r.isWrite()).map((r) => r.identifier.name))].sort(byName);
  return { blocks, importCount, exportCount, implicit };
}

function main() {
  const check = process.argv.includes('--check');
  const { blocks, importCount, exportCount, implicit } = moduleBlocks();
  const stale = [];
  for (const [piece, { head, tail }] of blocks) {
    const path = piecePath(SOURCES, piece);
    const text = readFileSync(path, 'utf8');
    const parts = moduleParts(text);
    if (parts.head === head && parts.tail === tail) continue;
    stale.push(piece);
    if (!check) writeFileSync(path, head + parts.body + tail);
  }
  // Every file must also parse as an ES module, with its blocks in place.
  for (const piece of blocks.keys()) acorn.parse(codeOf(piece, readFileSync(piecePath(SOURCES, piece), 'utf8')), { ecmaVersion: 'latest', sourceType: 'module' });
  const ts = [...blocks.keys()].filter((p) => p.endsWith('.ts')).length;
  const counts = `${blocks.size - ts} JS files and ${ts} TypeScript, ${importCount} imported names, ${exportCount} exported`;
  if (implicit.length) console.log(`module-blocks: writes to undeclared names, which a module cannot make: ${implicit.join(', ')}`);
  if (check && stale.length) {
    console.error(`module-blocks: these files' module blocks do not match their code: ${stale.join(', ')}. Run npm run build:index (or node scripts/module-blocks.mjs) in frontends/app/.`);
    process.exit(1);
  }
  console.log(`module-blocks: ${check ? 'every block matches its code' : stale.length ? `rewrote ${stale.length} files' blocks` : 'every block already matched its code'} (${counts})`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
