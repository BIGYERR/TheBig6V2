#!/usr/bin/env node
// Architecture phase D: after an engine file has moved to core/src/engine/<name>.ts and gained its types, make the page
// carry it as the JavaScript it was, text for text, but for the comments the move added:
//
//   node tools/engine-move.mjs <name> <ref>       e.g. node tools/engine-move.mjs engine-c v0.239.3
//   node tools/engine-move.mjs js/<name> <ref>    an app file turned TypeScript in place (phase E's logic move,
//                                                 frontends/app/src/legacy/src/js/<name>.ts, from v0.239.43)
//
// The build strips the types and takes the blanks they leave out (frontends/app/scripts/build-index.mjs, collapseTypes),
// so the page reads the code as the TypeScript lays it out between its types. An annotation written with a blank of its
// own (`f(a: A, b: B) {` where the JavaScript had `f(a,b){`) would change the page's text, though never its tokens. This
// rewrites the blanks between the TypeScript's tokens, never a type and never a token, until the page's text of the file
// is the JavaScript at <ref> (frontends/app/src/legacy/src/js/<name>.js there), with only comment lines and blank lines
// added. Then the tests that read the page's text, and the variants written against it, read what they read before.
// Exit 1 naming the first line where the two differ in more than blanks (a token, or a comment inside a line).
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { REPO } from './runlog.mjs';

const { collapseTypes, moduleParts, stripTypes } = await import(pathToFileURL(join(REPO, 'frontends', 'app', 'scripts', 'build-index.mjs')).href);

const [arg, ref] = process.argv.slice(2);
if (!arg || !ref) {
  console.error('usage: node tools/engine-move.mjs <name> <ref>, or js/<name> <ref> for an app file');
  process.exit(2);
}
const app = arg.startsWith('js/');
const name = app ? arg.slice('js/'.length) : arg;
const file = app ? join(REPO, 'frontends', 'app', 'src', 'legacy', 'src', 'js', `${name}.ts`) : join(REPO, 'core', 'src', 'engine', `${name}.ts`);
let was;
try {
  was = moduleParts(execFileSync('git', ['-C', REPO, 'show', `${ref}:frontends/app/src/legacy/src/js/${name}.js`], { encoding: 'utf8', maxBuffer: 64 << 20, stdio: ['ignore', 'pipe', 'ignore'] })).body;
} catch {
  console.error(`engine-move: ${ref} has no frontends/app/src/legacy/src/js/${name}.js (a ref before the file moved, by hash when no tag names it)`);
  process.exit(2);
}
const blank = (c) => c === ' ' || c === '\t' || c === '\n' || c === '\r';

/** The page's text of a TypeScript body, and for each of its characters the index in the body it came from. */
function pageOf(body) {
  const at = [];
  const out = collapseTypes(body, stripTypes(body, name), at);
  return { out, at };
}

const isComment = (line) => /^\s*(\/\/|\/\*|\*)/.test(line) || /^\s*$/.test(line);
const text = readFileSync(file, 'utf8');
const parts = moduleParts(text);
let body = parts.body;
for (let pass = 0; pass < 4; pass++) {
  const { out, at } = pageOf(body);
  // Walk the page's text against the JavaScript: equal characters pass, a comment or blank line the move added is
  // skipped whole, and a blank that differs is fixed in the TypeScript at the place it came from.
  const edits = []; // [index in body, characters to delete, text to insert]
  let i = 0;
  let j = 0;
  const endOf = (s, p) => (s.indexOf('\n', p) === -1 ? s.length : s.indexOf('\n', p));
  while (i < out.length || j < was.length) {
    // At the start of a line in both: a line that matches passes whole, and a comment or blank line the page has and
    // the JavaScript did not is one the move added.
    if ((i === 0 || out[i - 1] === '\n') && (j === 0 || was[j - 1] === '\n') && i < out.length) {
      const oe = endOf(out, i);
      const we = endOf(was, j);
      if (j < was.length && out.slice(i, oe) === was.slice(j, we)) { i = Math.min(oe + 1, out.length); j = Math.min(we + 1, was.length); continue; }
      if (isComment(out.slice(i, oe))) { i = Math.min(oe + 1, out.length); continue; }
    }
    if (i < out.length && j < was.length && out[i] === was[j]) { i++; j++; continue; }
    if (i < out.length && blank(out[i]) && (j >= was.length || !blank(was[j]))) { edits.push([at[i], 1, '']); i++; continue; }
    if (j < was.length && blank(was[j]) && (i >= out.length || !blank(out[i]))) { edits.push([i < out.length ? at[i] : body.length, 0, was[j]]); j++; continue; }
    if (i < out.length && j < was.length && blank(out[i]) && blank(was[j])) { edits.push([at[i], 1, was[j]]); i++; j++; continue; }
    const line = (s, p) => s.slice(s.lastIndexOf('\n', p - 1) + 1, s.indexOf('\n', p) === -1 ? s.length : s.indexOf('\n', p));
    console.error(`engine-move: ${name}: the page differs from ${ref} in more than blanks:\n  page: ${JSON.stringify(line(out, i)).slice(0, 200)}\n  was:  ${JSON.stringify(line(was, j)).slice(0, 200)}`);
    process.exit(1);
  }
  if (!edits.length) {
    if (pass) writeFileSync(file, parts.head + body + parts.tail);
    console.log(`engine-move: ${name}: the page carries the JavaScript of ${ref}, text for text, but for the comment and blank lines the move added${pass ? ` (${pass} pass${pass > 1 ? 'es' : ''} of blank fixes)` : ''}`);
    process.exit(0);
  }
  edits.sort((a, b) => b[0] - a[0]);
  for (const [p, del, ins] of edits) body = body.slice(0, p) + ins + body.slice(p + del);
}
console.error(`engine-move: ${name}: the blanks did not settle in four passes`);
process.exit(1);
