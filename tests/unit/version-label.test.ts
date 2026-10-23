// The version label people read: iaVersionLabel in index.html (next to IA_VERSION), used by the bug-report page
// ('BUILD ' + label) and the report context ('build: ' + label), and its shared form versionLabel in @ia/core
// (core/src/format/version-label.ts), which the app imports once phase D moves it. Rulings:
// docs/decisions/version-label.md.
//
// Every expected string is typed by hand from the ruling: 'v' plus MAJOR.MINOR.PATCH; a pre-semver integer N reads
// 0.N.0; one leading v or V is dropped first, so the label never reads vv; anything else prints as given after one v.
// The test never asks the app (or tests/semver.js) what the answer should be. Both bodies are held to the same hand
// values, so they cannot drift apart.
import assert from 'node:assert/strict';
import { describe, test } from 'vitest';
import { versionLabel } from '@ia/core';
import { appFunction } from '../support/app.ts';

const iaVersionLabel = appFunction<(ver: unknown) => string>('iaVersionLabel');

const LABELS = [
  ['the app (iaVersionLabel)', iaVersionLabel],
  ['@ia/core (versionLabel)', versionLabel],
] as const;

for (const [who, label] of LABELS) {
  describe(who, () => {
    test('a pre-semver build number N reads v0.N.0', () => {
      assert.equal(label(239), 'v0.239.0');
      assert.equal(label('239'), 'v0.239.0');
      assert.equal(label(1), 'v0.1.0');
    });

    test('a dotted version reads v plus the version', () => {
      assert.equal(label('0.239.1'), 'v0.239.1');
      assert.equal(label('0.240.0'), 'v0.240.0');
      assert.equal(label('1.0.0'), 'v1.0.0');
    });

    test('a leading v or V is dropped first, so the label never reads vv', () => {
      assert.equal(label('v0.239.1'), 'v0.239.1');
      assert.equal(label('V0.239.1'), 'v0.239.1');
      assert.equal(label('V239'), 'v0.239.0');
    });

    test('anything else prints as given after one v and never throws', () => {
      assert.equal(label('junk'), 'vjunk');
      assert.equal(label('vjunk'), 'vjunk');
    });
  });
}
