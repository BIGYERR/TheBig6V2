#!/usr/bin/env node
// Phase E's type debt, the next pass after tools/ts-expect.mjs: a marker line (`// @ts-expect-error TS<code> ...`)
// silences every error on the line below it. This takes the markers out of the app files and writes, where one exists,
// the narrow type the error asks for instead, so the check sees everything else on that line:
//
//   node tools/ts-narrow.mjs [<name> ...]     (default: every frontends/app/src/legacy/src/js/<name>.ts)
//
//   - a value TypeScript thinks may be null or undefined where the code reads it (TS2531, TS2532, TS18047, TS18048,
//     TS18049) gets a non-null assertion, `x!` (the code as it ran assumed it);
//   - a lookup table indexed by a key TypeScript cannot check against it (TS7053 on `table[key]`, the table a
//     `const`/`let` of this file holding an object literal) is typed `Record<string, ...>` where it is declared;
//   - an object literal declared empty and filled later (TS2339 on `o.x`, `o` declared `= {}` in this file) is typed
//     `Record<string, any>` where it is declared, and a variable started as `null` and set inside a callback, which
//     TypeScript's flow analysis cannot see (TS2339 on type 'never'), is typed `any` where it is declared.
// Each is an annotation the build strips (strip mode, then collapseTypes), so no token of the page changes; then
// tools/ts-expect.mjs marks whatever is left, as before. tools/same-script.mjs proves the page.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { REPO } from './runlog.mjs';

const APP = join(REPO, 'frontends', 'app');
const JS = join(APP, 'src', 'legacy', 'src', 'js');
const require = createRequire(join(APP, 'package.json'));
const ts = require('typescript');
const { stripTypes } = await import(pathToFileURL(join(APP, 'scripts', 'build-index.mjs')).href);
const acorn = require('acorn');

const names = process.argv.slice(2).length ? process.argv.slice(2) : readdirSync(JS).filter((f) => f.endsWith('.ts')).map((f) => f.slice(0, -3));
const files = names.map((n) => join(JS, `${n}.ts`));
const MARKER = /^[ \t]*\/\/ @ts-expect-error TS\d+ [^\n]*\n/gm;
const NULLISH = new Set([2531, 2532, 18047, 18048, 18049]);

const config = ts.getParsedCommandLineOfConfigFile(join(APP, 'tsconfig.legacy.json'), {}, {
  ...ts.sys,
  onUnRecoverableConfigFileDiagnostic: (d) => { throw new Error(ts.flattenDiagnosticMessageText(d.messageText, '\n')); },
});

/** The legacy check's errors in the files asked for, with their spans. */
function diagnostics() {
  const program = ts.createProgram(config.fileNames, config.options);
  const want = new Set(files.map((f) => resolve(f)));
  return ts.getPreEmitDiagnostics(program).filter((d) => d.file && want.has(resolve(d.file.fileName)));
}

/** The top-level or local declarations in `text` of `id` whose initializer is an object literal: [idEnd, init][]. */
function objectDecls(text, file, id) {
  return decls(text, file, id).filter(([, init]) => init?.type === 'ObjectExpression');
}

/** The declarations in `text` of `id` that start it as nothing (`let x = null;`, `let x;`): [idEnd][]. */
function nullDecls(text, file, id) {
  return decls(text, file, id).filter(([, init]) => !init || (init.type === 'Literal' && init.value === null));
}

/** Every declaration in `text` of `id`, at any depth: [idEnd, init][]. */
function decls(text, file, id) {
  const ast = acorn.parse(stripTypes(text, file), { ecmaVersion: 'latest', sourceType: 'module' });
  const out = [];
  const walk = (node) => {
    if (!node || typeof node.type !== 'string') return;
    if (node.type === 'VariableDeclarator' && node.id.type === 'Identifier' && node.id.name === id) out.push([node.id.end, node.init]);
    for (const k of Object.keys(node)) {
      const v = node[k];
      if (Array.isArray(v)) v.forEach(walk);
      else if (v && typeof v === 'object' && typeof v.type === 'string') walk(v);
    }
  };
  walk(ast);
  return out;
}

let before = 0;
for (const f of files) {
  const text = readFileSync(f, 'utf8');
  before += (text.match(MARKER) || []).length;
  writeFileSync(f, text.replace(MARKER, ''));
}

const written = { nonNull: 0, table: 0, object: 0 };
for (let pass = 0; pass < 30; pass++) {
  const edits = new Map();
  const add = (file, at, insert, kind) => {
    if (!edits.has(file)) edits.set(file, new Map());
    edits.get(file).set(at, [insert, kind]);
  };
  for (const d of diagnostics()) {
    const file = resolve(d.file.fileName);
    const text = d.file.text;
    if (NULLISH.has(d.code)) {
      const end = d.start + d.length;
      if (text[end] !== '!') add(file, end, '!', 'nonNull');
      continue;
    }
    const id = /^[A-Za-z_$][\w$]*/.exec(text.slice(d.start))?.[0];
    if (d.code === 7053 && id && text[d.start + id.length] === '[') {
      const decls = objectDecls(text, file, id);
      if (decls.length === 1 && !/^\s*:/.test(text.slice(decls[0][0]))) {
        const strings = decls[0][1].properties.length > 0 && decls[0][1].properties.every((p) => p.type === 'Property' && p.value.type === 'Literal' && typeof p.value.value === 'string');
        add(file, decls[0][0], `: Record<string, ${strings ? 'string' : 'any'}>`, 'table');
      }
      continue;
    }
    if (d.code === 2339 && /on type 'never'/.test(ts.flattenDiagnosticMessageText(d.messageText, ' '))) {
      // A variable started as null and set inside a callback, which TypeScript's flow analysis does not see.
      const head = /([A-Za-z_$][\w$]*)\s*\??\.\s*$/.exec(text.slice(0, d.start))?.[1];
      const found = head ? nullDecls(text, file, head) : [];
      if (found.length === 1 && !/^\s*:/.test(text.slice(found[0][0]))) add(file, found[0][0], ': any', 'object');
      continue;
    }
    if (d.code === 2339 && /on type '\{\}'/.test(ts.flattenDiagnosticMessageText(d.messageText, ' '))) {
      // The error is on the property; the object is the identifier just before its dot.
      const head = /([A-Za-z_$][\w$]*)\s*\??\.\s*$/.exec(text.slice(0, d.start))?.[1];
      const decls = head ? objectDecls(text, file, head).filter(([, init]) => init.properties.length === 0) : [];
      if (decls.length === 1 && !/^\s*:/.test(text.slice(decls[0][0]))) add(file, decls[0][0], ': Record<string, any>', 'object');
    }
  }
  if (!edits.size) break;
  for (const [file, at] of edits) {
    let out = readFileSync(file, 'utf8');
    for (const [i, [insert, kind]] of [...at].sort((a, b) => b[0] - a[0])) {
      out = out.slice(0, i) + insert + out.slice(i);
      written[kind]++;
    }
    writeFileSync(file, out);
  }
}
console.log(`ts-narrow: took out ${before} marker line(s); wrote ${written.nonNull} non-null assertion(s), ${written.table} table type(s), ${written.object} object type(s); now run tools/ts-expect.mjs to mark the rest`);
