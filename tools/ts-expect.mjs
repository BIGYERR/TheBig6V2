#!/usr/bin/env node
// Phase E's logic move: after an app file has turned TypeScript in place (frontends/app/src/legacy/src/js/<name>.ts),
// mark every type error the legacy check finds in it with a `// @ts-expect-error` line above it, so the file checks clean
// without one token of its code changing (a comment line is no token; tools/same-script.mjs proves the page's tokens):
//
//   node tools/ts-expect.mjs <name> [<name> ...]     e.g. node tools/ts-expect.mjs storage update-check
//
// Each marker names the error it stands for, so the type debt is listed in the code where it lies, and tightening a file
// later means taking its markers out one by one under the tests. A parameter or a variable that is `any` only because
// nothing typed it yet (TS7006, TS7034) is typed `any` (or `any[]`) where it is declared instead: an annotation the
// build strips, which says the same thing in the type system's own words. An error on a line inside a template literal that
// spans lines cannot be marked (a comment there would be text in the string): the tool stops and names it, and the file
// needs a type that removes the error instead. A name the file imports untyped from a file that is TypeScript already is
// typed where that file declares it; from a file still JavaScript, the tool stops (that file turns TypeScript first).
// Runs the check again after each pass, until the file is clean.
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { REPO } from './runlog.mjs';

const APP = join(REPO, 'frontends', 'app');
const { moduleParts, stripTypes } = await import(pathToFileURL(join(APP, 'scripts', 'build-index.mjs')).href);
const require = createRequire(join(APP, 'package.json'));
const acorn = require('acorn');

/** Every node under `node`, depth first. */
function each(node, visit) {
  if (!node || typeof node.type !== 'string') return;
  visit(node);
  for (const key of Object.keys(node)) {
    const v = node[key];
    if (Array.isArray(v)) for (const c of v) each(c, visit);
    else if (v && typeof v === 'object' && typeof v.type === 'string') each(v, visit);
  }
}

const names = process.argv.slice(2);
if (!names.length) {
  console.error('usage: node tools/ts-expect.mjs <name> [<name> ...]   (frontends/app/src/legacy/src/js/<name>.ts)');
  process.exit(2);
}

/** The legacy check's errors, by file: [line, code, message, column] with 1-based lines and columns. */
function errors() {
  let out = '';
  try {
    execFileSync(join(APP, 'node_modules', '.bin', 'tsc'), ['-p', join(APP, 'tsconfig.legacy.json'), '--pretty', 'false'], { cwd: APP, encoding: 'utf8', maxBuffer: 64 << 20 });
  } catch (err) {
    out = String(err.stdout || '');
  }
  const byFile = new Map();
  for (const m of out.matchAll(/^(.+?)\((\d+),(\d+)\): error (TS\d+): (.*)$/gm)) {
    const file = join(APP, m[1]);
    if (!byFile.has(file)) byFile.set(file, []);
    byFile.get(file).push([+m[2], m[4], m[5], +m[3]]);
  }
  return byFile;
}

/** The lines strictly inside a template literal that spans lines (its 2nd line to its last), 1-based. */
function templateLines(text, name) {
  const code = stripTypes(text, `${name}.ts`);
  const inside = new Set();
  const ast = acorn.parse(code, { ecmaVersion: 'latest', sourceType: 'module', locations: true });
  each(ast, (node) => {
    if (node.type !== 'TemplateLiteral') return;
    for (let l = node.loc.start.line + 1; l <= node.loc.end.line; l++) inside.add(l);
  });
  return inside;
}

/**
 * A name `name`.ts imports that its declaring file left untyped (TS7034 on the import line: a `let x = null` whose type
 * TypeScript cannot settle once another file reads it) is typed `type` where it is declared, at the top level of that
 * file, when that file is TypeScript already. A file still JavaScript has to turn TypeScript first.
 */
function typeAtDeclaration(name, importer, id, type) {
  const from = acorn.parse(stripTypes(importer, `${name}.ts`), { ecmaVersion: 'latest', sourceType: 'module' }).body
    .find((s) => s.type === 'ImportDeclaration' && s.specifiers.some((x) => x.local.name === id))?.source.value;
  const file = from && resolve(join(APP, 'src', 'legacy', 'src', 'js'), from);
  if (!file || !file.endsWith('.ts')) {
    console.error(`ts-expect: ${name}.ts imports ${id} untyped from ${from}, which is still JavaScript (turn it TypeScript first)`);
    process.exit(1);
  }
  const text = readFileSync(file, 'utf8');
  // Strip mode keeps every offset, so a declaration's place in the stripped code is its place in the file.
  const ast = acorn.parse(stripTypes(text, file), { ecmaVersion: 'latest', sourceType: 'module' });
  const at = ast.body.flatMap((s) => (s.type === 'VariableDeclaration' ? s.declarations : []))
    .filter((d) => d.id.type === 'Identifier' && d.id.name === id).map((d) => d.id.end);
  if (at.length !== 1 || /^\s*:/.test(text.slice(at[0]))) {
    console.error(`ts-expect: ${name}.ts imports ${id} untyped, and ${from} has no one untyped top-level declaration of it to type`);
    process.exit(1);
  }
  writeFileSync(file, text.slice(0, at[0]) + `: ${type}` + text.slice(at[0]));
  console.log(`ts-expect: typed ${id} ${type} where ${from} declares it`);
}

/**
 * Types each lookup table `ids` names where `file` declares it as an object literal (`const goalLabels={strength:...}`):
 * `Record<string, string>` when every value is a string, `Record<string, any>` otherwise. A name declared more than once
 * as a table, or already typed, is left alone. True when one was typed.
 */
function typeTables(file, text, ids) {
  const ast = acorn.parse(stripTypes(text, file), { ecmaVersion: 'latest', sourceType: 'module' });
  const at = [];
  for (const id of ids) {
    const found = [];
    each(ast, (node) => {
      if (node.type === 'VariableDeclarator' && node.id.type === 'Identifier' && node.id.name === id && node.init?.type === 'ObjectExpression') found.push(node);
    });
    if (found.length !== 1 || /^\s*:/.test(text.slice(found[0].id.end))) continue;
    const strings = found[0].init.properties.every((p) => p.type === 'Property' && p.value.type === 'Literal' && typeof p.value.value === 'string');
    at.push([found[0].id.end, `: Record<string, ${strings ? 'string' : 'any'}>`]);
  }
  let out = text;
  for (const [i, type] of at.sort((a, b) => b[0] - a[0])) out = out.slice(0, i) + type + out.slice(i);
  if (at.length) writeFileSync(file, out);
  return at.length > 0;
}

/**
 * A call that passes fewer arguments than its function declares (TS2554, "Expected 5 arguments, but got 3"): JavaScript
 * passes `undefined` for the rest, and the legacy code relies on it, so each parameter from there on is typed optional
 * where an app file declares the function at its top level (`b?: any`; one with a default or a rest is optional
 * already). A call to anything else keeps its marker. True when a parameter was typed.
 */
function optionalParams(short, lines) {
  const dir = join(APP, 'src', 'legacy', 'src', 'js');
  const files = readdirSync(dir).filter((f) => f.endsWith('.ts')).map((f) => join(dir, f));
  const edits = new Map();
  for (const [line, , msg, col] of short) {
    const callee = /^([A-Za-z_$][\w$]*)\s*\(/.exec(lines[line - 1].slice(col - 1))?.[1];
    if (!callee) continue;
    const got = +/but got (\d+)\.$/.exec(msg)[1];
    const decls = [];
    for (const f of files) {
      const text = readFileSync(f, 'utf8');
      for (const s of acorn.parse(stripTypes(text, f), { ecmaVersion: 'latest', sourceType: 'module' }).body) {
        if (s.type === 'FunctionDeclaration' && s.id.name === callee) decls.push([f, text, s]);
      }
    }
    if (decls.length !== 1) continue;
    const [f, text, fn] = decls[0];
    for (const p of fn.params.slice(got)) {
      if (p.type !== 'Identifier' || text[p.end] === '?') continue;
      if (!edits.has(f)) edits.set(f, new Map());
      edits.get(f).set(p.end, /^: /.test(text.slice(p.end)) ? '?' : '?: any');
    }
  }
  for (const [f, at] of edits) {
    let out = readFileSync(f, 'utf8');
    for (const [i, add] of [...at].sort((a, b) => b[0] - a[0])) out = out.slice(0, i) + add + out.slice(i);
    writeFileSync(f, out);
  }
  return edits.size > 0;
}

for (const name of names) {
  const file = join(APP, 'src', 'legacy', 'src', 'js', `${name}.ts`);
  let marked = 0;
  for (let pass = 0; pass < 40; pass++) {
    const found = (errors().get(file) || []);
    if (!found.length) break;
    const text = readFileSync(file, 'utf8');
    const inside = templateLines(text, name);
    const lines = text.split('\n');
    // A marker that no longer marks an error (a file it reads has gained types since) goes first: it is a comment line.
    const unused = found.filter(([, code]) => code === 'TS2578').map(([line]) => line).sort((a, b) => b - a);
    if (unused.length) {
      for (const l of unused) {
        if (!/^[ \t]*\/\/ @ts-expect-error TS\d+ /.test(lines[l - 1])) throw new Error(`${name}.ts:${l}: an unused directive that is not one of this tool's markers`);
        lines.splice(l - 1, 1);
      }
      writeFileSync(file, lines.join('\n'));
      continue;
    }
    // Untyped declarations first: `: any` after the name, right to left on each line so the columns stay put. Not on
    // an arrow's lone parameter (`p=>`, where a type needs parentheses, which are tokens: it gets a marker below), and
    // never in the import block: a name that is `any` there is untyped where another file declares it, which has to
    // turn TypeScript first.
    const importLines = moduleParts(text).head.split('\n').length - 1;
    const atImport = found.filter(([line, code]) => code === 'TS7034' && line <= importLines);
    if (atImport.length) {
      for (const [, , msg] of atImport) {
        const id = /'([^']+)'/.exec(msg)[1];
        typeAtDeclaration(name, text, id, / type 'any\[\]'/.test(msg) ? 'any[]' : 'any');
        marked++;
      }
      continue;
    }
    const loneArrow = (line, col, id) => /^\s*=>/.test(lines[line - 1].slice(col - 1 + id.length));
    const typed = found.filter(([line, code, msg, col]) => (code === 'TS7006' || code === 'TS7034') && !loneArrow(line, col, /'([^']+)'/.exec(msg)[1])).sort((a, b) => b[0] - a[0] || b[3] - a[3]);
    if (typed.length) {
      for (const [line, , msg, col] of typed) {
        const id = /'([^']+)'/.exec(msg)[1];
        const row = lines[line - 1];
        if (row.slice(col - 1, col - 1 + id.length) !== id) throw new Error(`${name}.ts:${line}:${col}: expected ${id} there`);
        const rest = row.slice(0, col - 1).endsWith('...');
        const type = rest || / type 'any\[\]'/.test(msg) ? 'any[]' : 'any';
        lines[line - 1] = row.slice(0, col - 1 + id.length) + `: ${type}` + row.slice(col - 1 + id.length);
        marked++;
      }
      writeFileSync(file, lines.join('\n'));
      continue;
    }
    const short = found.filter(([, code, msg]) => code === 'TS2554' && /but got \d+\.$/.test(msg));
    if (short.length && optionalParams(short, lines)) continue;
    // An error inside a template literal cannot carry a marker. A lookup table read there with a key TypeScript cannot
    // check against it (TS7053 on `table[key]`) is typed where this file declares it instead.
    const tables = found.filter(([line, code]) => code === 'TS7053' && inside.has(line))
      .map(([line, , , col]) => /^[A-Za-z_$][\w$]*/.exec(lines[line - 1].slice(col - 1))?.[0]).filter(Boolean);
    if (tables.length && typeTables(file, text, [...new Set(tables)])) continue;
    const byLine = new Map();
    for (const [line, code, msg] of found) if (!byLine.has(line)) byLine.set(line, `${code} ${msg}`);
    const stuck = [...byLine.keys()].filter((l) => inside.has(l));
    if (stuck.length) {
      console.error(`ts-expect: ${name}.ts: an error inside a template literal cannot be marked, at line${stuck.length > 1 ? 's' : ''} ${stuck.join(', ')}:`);
      for (const l of stuck) console.error(`  ${l}: ${byLine.get(l)}\n     ${lines[l - 1].trim().slice(0, 160)}`);
      process.exit(1);
    }
    // Mark from the bottom up, so the line numbers above stay put.
    for (const l of [...byLine.keys()].sort((a, b) => b - a)) {
      const indent = /^\s*/.exec(lines[l - 1])[0];
      const msg = byLine.get(l).replace(/\s+/g, ' ').slice(0, 110);
      lines.splice(l - 1, 0, `${indent}// @ts-expect-error ${msg}`);
      marked++;
    }
    const next = lines.join('\n');
    moduleParts(next); // the markers never land in a module block
    writeFileSync(file, next);
  }
  const left = errors().get(file) || [];
  if (left.length) {
    console.error(`ts-expect: ${name}.ts still has ${left.length} error(s) after marking: ${left.slice(0, 3).map((e) => `${e[0]}: ${e[1]} ${e[2]}`).join('; ')}`);
    process.exit(1);
  }
  console.log(`ts-expect: ${name}.ts checks clean, ${marked} line(s) marked`);
}
