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
// needs a type that removes the error instead. Runs the check again after each pass, until the file is clean.
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
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

for (const name of names) {
  const file = join(APP, 'src', 'legacy', 'src', 'js', `${name}.ts`);
  let marked = 0;
  for (let pass = 0; pass < 12; pass++) {
    const found = (errors().get(file) || []);
    if (!found.length) break;
    const text = readFileSync(file, 'utf8');
    const inside = templateLines(text, name);
    const lines = text.split('\n');
    // Untyped declarations first: `: any` after the name, right to left on each line so the columns stay put. Not on
    // an arrow's lone parameter (`p=>`, where a type needs parentheses, which are tokens: it gets a marker below), and
    // never in the import block: a name that is `any` there is untyped where another file declares it, which has to
    // turn TypeScript first.
    const importLines = moduleParts(text).head.split('\n').length - 1;
    const atImport = found.filter(([line, code]) => code === 'TS7034' && line <= importLines);
    if (atImport.length) {
      console.error(`ts-expect: ${name}.ts imports a name untyped where it is declared (type it there first): ${atImport.map((e) => /'([^']+)'/.exec(e[2])[1]).join(', ')}`);
      process.exit(1);
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
