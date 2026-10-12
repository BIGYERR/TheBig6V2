'use strict';
// The version label people read: iaVersionLabel in index.html (next to IA_VERSION), used by the bug-report page
// ('BUILD ' + label) and the report context ('build: ' + label). Rulings: docs/decisions/version-label.md.
//
// Every expected string is typed by hand from the ruling: 'v' plus MAJOR.MINOR.PATCH; a pre-semver integer N reads
// 0.N.0; one leading v or V is dropped first, so the label never reads vv; anything else prints as given after one v.
// The test never asks the app (or tests/semver.js) what the answer should be.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { appFunction } = require('../support/app.js');

const iaVersionLabel = appFunction('iaVersionLabel');

test('a pre-semver build number N reads v0.N.0', () => {
  assert.equal(iaVersionLabel(239), 'v0.239.0');
  assert.equal(iaVersionLabel('239'), 'v0.239.0');
  assert.equal(iaVersionLabel(1), 'v0.1.0');
});

test('a dotted version reads v plus the version', () => {
  assert.equal(iaVersionLabel('0.239.1'), 'v0.239.1');
  assert.equal(iaVersionLabel('0.240.0'), 'v0.240.0');
  assert.equal(iaVersionLabel('1.0.0'), 'v1.0.0');
});

test('a leading v or V is dropped first, so the label never reads vv', () => {
  assert.equal(iaVersionLabel('v0.239.1'), 'v0.239.1');
  assert.equal(iaVersionLabel('V0.239.1'), 'v0.239.1');
  assert.equal(iaVersionLabel('V239'), 'v0.239.0');
});

test('anything else prints as given after one v and never throws', () => {
  assert.equal(iaVersionLabel('junk'), 'vjunk');
  assert.equal(iaVersionLabel('vjunk'), 'vjunk');
});
