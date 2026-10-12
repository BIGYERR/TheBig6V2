'use strict';
// The version label where people read it: at boot init() writes 'BUILD ' + iaVersionLabel(IA_VERSION) into the
// bug-report page (#bugVersion), and submitBug() posts a report whose context carries one 'build: ' line. Rulings:
// docs/decisions/version-label.md (D236: the app shows its version in semver everywhere). The formatting rule on its
// own is tests/unit/version-label.test.js.
//
// The app boots in the VM harness with a document that keeps its elements (tests/support/app.js loadApp({dom:true})).
// The report context is read off the body submitBug() hands a recording fetch. A relabelled body is the app under test
// with only its ia-version meta rewritten, written to a temporary folder that is removed after the run.
//
// Oracles, never the app's own helper: for a body relabelled to a known meta, strings typed by hand from the ruling
// ('239' reads v0.239.0 and never v239; 'v0.239.1' reads v0.239.1 and never vv); for the body as shipped, 'v' plus the
// canonical MAJOR.MINOR.PATCH of its meta as tests/semver.js reads it.
const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { APP, loadApp } = require('../support/app.js');
const SV = require('../semver.js');

const HTML = fs.readFileSync(APP, 'utf8');
const META = /<meta name="ia-version" content="[^"]*"/g;

let tmp = '';
after(() => {
  if (tmp) fs.rmSync(tmp, { recursive: true, force: true });
});

/** The app under test with its ia-version meta rewritten to `content`; returns the file's path. */
function relabelled(content) {
  assert.equal((HTML.match(META) || []).length, 1, 'the app carries one ia-version meta');
  if (!tmp) tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ia-version-label-'));
  const file = path.join(tmp, 'relabelled_' + content.replace(/[^A-Za-z0-9.]/g, '_') + '.html');
  fs.writeFileSync(file, HTML.replace(META, '<meta name="ia-version" content="' + content + '"'));
  return file;
}

/** What the bug-report page shows after boot. */
const pageLabel = (IA) => (IA.els.bugVersion ? IA.els.bugVersion.textContent : undefined);

/** The 'build:' lines of the context submitBug() posts, read off a recording fetch. */
async function reportBuildLines(IA) {
  const calls = [];
  IA.ctx.fetch = (url, o) => {
    calls.push({ url, body: o && o.body });
    return Promise.resolve({ ok: false, status: 0, json: () => Promise.resolve({}), text: () => Promise.resolve('') });
  };
  IA.ctx.document.getElementById('bugText').value = 'test probe';
  await IA.eval('submitBug()');
  assert.equal(calls.length, 1, 'submitBug posts once');
  const message = String(JSON.parse(calls[0].body).message);
  return message.split('\n').filter((l) => /^build:/.test(l));
}

test('the bug-report page shows BUILD and the version as shipped, in semver', () => {
  const shipped = 'v' + SV.str(SV.fromHtml(HTML));
  assert.match(shipped, /^v\d+\.\d+\.\d+$/);
  const IA = loadApp({ dom: true });
  assert.equal(pageLabel(IA), 'BUILD ' + shipped);
});

test('the bug report context carries exactly one build line with the version as shipped', async () => {
  const shipped = 'v' + SV.str(SV.fromHtml(HTML));
  const IA = loadApp({ dom: true });
  assert.deepEqual(await reportBuildLines(IA), ['build: ' + shipped]);
});

test('a pre-semver meta 239 reads BUILD v0.239.0 and build: v0.239.0, never v239', async () => {
  const IA = loadApp({ dom: true, file: relabelled('239') });
  assert.equal(IA.eval('IA_VERSION'), '239', 'the relabelled body reads its new meta');
  const label = pageLabel(IA);
  assert.equal(label, 'BUILD v0.239.0');
  assert.doesNotMatch(label, /v239/i);
  const lines = await reportBuildLines(IA);
  assert.deepEqual(lines, ['build: v0.239.0']);
  assert.ok(!lines.some((l) => /v239/i.test(l)));
});

test('a meta written with a leading v reads BUILD v0.239.1 and build: v0.239.1, never vv', async () => {
  const IA = loadApp({ dom: true, file: relabelled('v0.239.1') });
  assert.equal(IA.eval('IA_VERSION'), 'v0.239.1', 'the relabelled body reads its new meta');
  const label = pageLabel(IA);
  assert.equal(label, 'BUILD v0.239.1');
  assert.doesNotMatch(label, /vv/i);
  const lines = await reportBuildLines(IA);
  assert.deepEqual(lines, ['build: v0.239.1']);
  assert.ok(!lines.some((l) => /vv/i.test(l)));
});
