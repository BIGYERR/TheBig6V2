#!/usr/bin/env node
// Do two builds of the app's page run the same code? The proof for a release that should change no behaviour
// (architecture phase D: the engine's files turned TypeScript, whose types the build strips to spaces):
//
//   node tools/same-script.mjs <before.html> <after.html>
//
// The page outside its inline script must be byte for byte the same, but for the ia-version meta (a release moves it).
// The inline script is read as JavaScript tokens (acorn's tokenizer): the two lists must be equal, token by token, as
// the source text of each token, and a line break must stand between the same pairs of tokens (a line break can decide
// where a statement ends). Other whitespace between tokens is free, so types stripped out pass and anything else does
// not: a renamed variable, a changed literal, an added or removed semicolon, two lines joined. Comments never run, so they are
// listed, not judged: every comment added or removed is printed (a TypeScript directive such as @ts-expect-error is
// one). Exit 0 when the two run the same code, 1 naming the first difference, 2 on bad arguments. Make the earlier
// page with `node tools/app-at.mjs <ref> <file>`.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { REPO } from './runlog.mjs';

const require = createRequire(join(REPO, 'frontends', 'app', 'package.json'));
const acorn = require('acorn');
const { extractInlineJS } = require(join(REPO, 'tests', 'harness.js'));

const [a, b] = process.argv.slice(2);
if (!a || !b) {
  console.error('usage: node tools/same-script.mjs <before.html> <after.html>');
  process.exit(2);
}

const META = /<meta name="ia-version" content="([^"]*)">/;
const SCRIPT = /(<script(?:\s[^>]*)?>)[\s\S]*?(<\/script>)/gi;

/** The page split into its inline script, read as tokens and comments, and the rest with the version taken out. */
function read(file) {
  const html = readFileSync(file, 'utf8');
  const script = extractInlineJS(html);
  const tokens = [];
  const comments = [];
  let end = 0;
  for (const t of acorn.tokenizer(script, { ecmaVersion: 'latest', sourceType: 'script', locations: true, onComment: (block, text) => comments.push(`${block ? 'block' : 'line'} ${text}`) })) {
    tokens.push({ text: script.slice(t.start, t.end), line: t.loc.start.line, nl: /[\n\r\u2028\u2029]/.test(script.slice(end, t.start)) });
    end = t.end;
  }
  return { file, html, version: META.exec(html)?.[1] ?? '(none)', rest: html.replace(META, '<meta name="ia-version" content="">').replace(SCRIPT, '$1$2'), script, tokens, comments };
}

const x = read(a);
const y = read(b);
const fail = (msg) => {
  console.error(`same-script: ${msg}`);
  process.exit(1);
};
if (x.rest !== y.rest) {
  let i = 0;
  while (i < x.rest.length && x.rest[i] === y.rest[i]) i++;
  fail(`the page outside its script differs at character ${i}:\n  ${a}: ${JSON.stringify(x.rest.slice(Math.max(0, i - 40), i + 40))}\n  ${b}: ${JSON.stringify(y.rest.slice(Math.max(0, i - 40), i + 40))}`);
}
const n = Math.min(x.tokens.length, y.tokens.length);
for (let i = 0; i < n; i++) {
  if (x.tokens[i].text !== y.tokens[i].text || x.tokens[i].nl !== y.tokens[i].nl) {
    const what = x.tokens[i].text !== y.tokens[i].text ? 'differs' : `has ${x.tokens[i].nl ? 'a line break' : 'no line break'} before it in ${a} and ${y.tokens[i].nl ? 'one' : 'none'} in ${b}`;
    const ctx = (r) => r.tokens.slice(Math.max(0, i - 6), i + 6).map((t) => t.text).join(' ');
    fail(`token ${i} ${what}: ${JSON.stringify(x.tokens[i].text)} (${a} script line ${x.tokens[i].line}) against ${JSON.stringify(y.tokens[i].text)} (${b} script line ${y.tokens[i].line})\n  ${a}: ${ctx(x)}\n  ${b}: ${ctx(y)}`);
  }
}
if (x.tokens.length !== y.tokens.length) fail(`${a} has ${x.tokens.length} tokens and ${b} ${y.tokens.length}; the first ${n} are the same`);
/** What `from` holds that `to` does not, counted (a comment can appear more than once). */
const minus = (from, to) => {
  const left = new Map();
  for (const c of to) left.set(c, (left.get(c) ?? 0) + 1);
  return from.filter((c) => {
    const k = left.get(c) ?? 0;
    if (k) left.set(c, k - 1);
    return !k;
  });
};
const added = minus(y.comments, x.comments);
const removed = minus(x.comments, y.comments);
const ws = y.script.length - x.script.length;
console.log(`same-script: the same code: ${n} tokens, in order, with the same line breaks between them; the script is ${Math.abs(ws)} bytes ${ws >= 0 ? 'longer' : 'shorter'} in whitespace and comments; the rest of the page is the same but for ia-version ${x.version} -> ${y.version}`);
console.log(`same-script: comments: ${x.comments.length} before, ${y.comments.length} after; ${added.length} added, ${removed.length} removed`);
for (const c of added) console.log(`  + ${JSON.stringify(c).slice(0, 160)}`);
for (const c of removed) console.log(`  - ${JSON.stringify(c).slice(0, 160)}`);
