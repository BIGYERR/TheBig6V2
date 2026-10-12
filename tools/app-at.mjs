#!/usr/bin/env node
// The app's page as a commit had it, for a test run against an earlier release (CLAUDE.md, Proof for new work: each test
// for a changed behaviour must fail on the previous release):
//
//   node tools/app-at.mjs <ref> <out.html>     then: cd tests && IA_APP=<out.html> npx vitest run <file>
//
// A commit that carries the root index.html (every release before the Pages source switch) gives that file, byte for
// byte; a later one gives the page built from its own source files with its own builder (git archive, then
// frontends/app/scripts/build-index.mjs as that commit wrote it). Nothing in the checkout is read or written.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const [ref, out] = process.argv.slice(2);
if (!ref || !out) {
  console.error('usage: node tools/app-at.mjs <ref> <out.html>');
  process.exit(2);
}
const git = (args, opts = {}) => execFileSync('git', args, { maxBuffer: 64 * 1024 * 1024, ...opts });
const has = (path) => {
  try {
    git(['cat-file', '-e', `${ref}:${path}`], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
};

let page;
let how;
if (has('index.html')) {
  page = git(['show', `${ref}:index.html`]);
  how = 'its root index.html';
} else if (has('frontends/app/scripts/build-index.mjs')) {
  const dir = mkdtempSync(join(tmpdir(), 'ia-app-at-'));
  try {
    const top = git(['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
    const tar = git(['-C', top, 'archive', ref, 'frontends/app/scripts/build-index.mjs', 'frontends/app/src/legacy/src']);
    execFileSync('tar', ['-x', '-C', dir], { input: tar });
    const { buildIndex } = await import(pathToFileURL(join(dir, 'frontends', 'app', 'scripts', 'build-index.mjs')).href);
    page = buildIndex();
    how = 'the build of its source files';
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
} else {
  console.error(`app-at: ${ref} has neither a root index.html nor the app's source files`);
  process.exit(1);
}
writeFileSync(resolve(out), page);
const version = /<meta name="ia-version" content="([^"]*)"/.exec(page.toString('utf8'))?.[1] ?? '(none)';
console.log(`app-at: ${out} is ${ref} (${how}): ${page.length} bytes, ia-version ${version}`);
