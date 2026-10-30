// The version label where people read it: at boot init() writes 'Build ' + iaVersionLabel(IA_VERSION) into the
// bug-report page (#bugVersion), and submitBug() posts a report whose context carries one 'build: ' line. Rulings:
// docs/decisions/version-label.md (D236: the app shows its version in semver everywhere). The formatting rule on its
// own is tests/unit/version-label.test.ts.
//
// The app boots in the VM harness with a document that keeps its elements (tests/support/app.ts loadApp({dom:true})).
// The report context is read off the body submitBug() hands a recording fetch. A relabelled body is the app under test
// with only its ia-version meta rewritten, written to a temporary folder that is removed after the run.
//
// Oracles, never the app's own helper: for a body relabelled to a known meta, strings typed by hand from the ruling
// ('239' reads v0.239.0 and never v239; 'v0.239.1' reads v0.239.1 and never vv); for the body as shipped, 'v' plus the
// canonical MAJOR.MINOR.PATCH of its meta as tests/semver.js reads it.
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, test } from 'vitest';
import type { semver } from '@ia/core';
import { APP, loadApp } from '../support/app.ts';
import type { App } from '../support/app.ts';

const SV: typeof semver = createRequire(import.meta.url)('../semver.js');

const HTML = readFileSync(APP, 'utf8');
const META = /<meta name="ia-version" content="[^"]*"/g;

let tmp = '';
afterAll(() => {
  if (tmp) rmSync(tmp, { recursive: true, force: true });
});

/** The app under test with its ia-version meta rewritten to `content`; returns the file's path. */
function relabelled(content: string): string {
  assert.equal((HTML.match(META) || []).length, 1, 'the app carries one ia-version meta');
  if (!tmp) tmp = mkdtempSync(join(tmpdir(), 'ia-version-label-'));
  const file = join(tmp, 'relabelled_' + content.replace(/[^A-Za-z0-9.]/g, '_') + '.html');
  writeFileSync(file, HTML.replace(META, '<meta name="ia-version" content="' + content + '"'));
  return file;
}

/** What the bug-report page shows after boot. */
const pageLabel = (IA: App): string | undefined => (IA.els['bugVersion'] ? IA.els['bugVersion'].textContent : undefined);

/** The 'build:' lines of the context submitBug() posts, read off a recording fetch. */
async function reportBuildLines(IA: App): Promise<string[]> {
  const calls: { url: unknown; body: unknown }[] = [];
  IA.ctx['fetch'] = (url: unknown, o?: { body?: unknown }) => {
    calls.push({ url, body: o && o.body });
    return Promise.resolve({ ok: false, status: 0, json: () => Promise.resolve({}), text: () => Promise.resolve('') });
  };
  IA.ctx['document'].getElementById('bugText').value = 'test probe';
  await IA.eval('submitBug()');
  assert.equal(calls.length, 1, 'submitBug posts once');
  const message = String(JSON.parse(String(calls[0]?.body)).message);
  return message.split('\n').filter((l) => /^build:/.test(l));
}

test('the bug-report page shows BUILD and the version as shipped, in semver', () => {
  const shipped = 'v' + SV.str(SV.fromHtml(HTML));
  assert.match(shipped, /^v\d+\.\d+\.\d+$/);
  const IA = loadApp({ dom: true });
  assert.equal(pageLabel(IA), 'Build ' + shipped);
});

test('the bug report context carries exactly one build line with the version as shipped', async () => {
  const shipped = 'v' + SV.str(SV.fromHtml(HTML));
  const IA = loadApp({ dom: true });
  assert.deepEqual(await reportBuildLines(IA), ['build: ' + shipped]);
});

test('a pre-semver meta 239 reads Build v0.239.0 and build: v0.239.0, never v239', async () => {
  const IA = loadApp({ dom: true, file: relabelled('239') });
  assert.equal(IA.eval('IA_VERSION'), '239', 'the relabelled body reads its new meta');
  const label = pageLabel(IA);
  assert.equal(label, 'Build v0.239.0');
  assert.doesNotMatch(String(label), /v239/i);
  const lines = await reportBuildLines(IA);
  assert.deepEqual(lines, ['build: v0.239.0']);
  assert.ok(!lines.some((l) => /v239/i.test(l)));
});

test('a meta written with a leading v reads Build v0.239.1 and build: v0.239.1, never vv', async () => {
  const IA = loadApp({ dom: true, file: relabelled('v0.239.1') });
  assert.equal(IA.eval('IA_VERSION'), 'v0.239.1', 'the relabelled body reads its new meta');
  const label = pageLabel(IA);
  assert.equal(label, 'Build v0.239.1');
  assert.doesNotMatch(String(label), /vv/i);
  const lines = await reportBuildLines(IA);
  assert.deepEqual(lines, ['build: v0.239.1']);
  assert.ok(!lines.some((l) => /vv/i.test(l)));
});
