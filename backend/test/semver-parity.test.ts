// server/versions.ts carries its own copy of the repo's version rule, because the backend ships alone (Heroku, the
// docker image). This proves the copy agrees with tests/semver.js on one shared table: what parses, what each reads
// as, and the order of every pair. It runs wherever the repo is checked out whole; it is skipped, and says so, on a
// branch that predates tests/semver.js.
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { compareVersions, normalizeVersion, parseVersion } from '../server/versions.ts';

const SEMVER = fileURLToPath(new URL('../../tests/semver.js', import.meta.url));
const missing = !existsSync(SEMVER) && 'tests/semver.js is not on this branch yet';

const TABLE = [
  // legacy integers and their spellings
  0, 239, 240, '0', '239', 'V239', 'v239', 'v0',
  // dotted versions
  '0.239.0', '0.239.1', 'v0.240.0', 'V0.240.0', '1.0.0', '1.10.0', '1.2.10', '10.0.0',
  // rejects
  NaN, null, undefined, '', ' 239', '239 ', '1.2', '1.2.3.4', '0.239.1-rc1', '1.0.0+build', -1, '-1', 1.5, '1.5',
  '0239', '0.0239.0', '01.0.0', 'abc', 'vv1', '239x', {}, [],
];

const sign = (n: number) => Math.sign(n) || 0;

test('server/versions.ts reads every version as tests/semver.js does', { skip: missing }, () => {
  const semver = createRequire(import.meta.url)(SEMVER);
  for (const v of TABLE) {
    let theirs: string | null;
    try {
      theirs = semver.str(v);
    } catch {
      theirs = null;
    }
    const ours = parseVersion(v) ? normalizeVersion(v) : null;
    assert.equal(ours, theirs, `${JSON.stringify(v) ?? String(v)}: backend ${ours}, tests/semver.js ${theirs}`);
  }
});

test('server/versions.ts orders every pair as tests/semver.js does', { skip: missing }, () => {
  const semver = createRequire(import.meta.url)(SEMVER);
  const ok = TABLE.filter((v) => parseVersion(v));
  for (const a of ok) for (const b of ok) assert.equal(sign(compareVersions(a, b)), sign(semver.cmp(a, b)), `${a} vs ${b}`);
});

test('the rule itself, so this file tests something even before tests/semver.js lands', () => {
  assert.deepEqual(parseVersion(239), [0, 239, 0]);
  assert.deepEqual(parseVersion('V239'), [0, 239, 0]);
  assert.deepEqual(parseVersion('v1.2.3'), [1, 2, 3]);
  for (const bad of ['', '1.2', '0.239.1-rc1', '0239', '0.0239.0', ' 239', -1, 1.5, NaN, null]) {
    assert.equal(parseVersion(bad), null, String(bad));
  }
  const ordered = ['239', '0.239.1', '0.240.0', '1.0.0'];
  for (let i = 1; i < ordered.length; i++) assert.ok(compareVersions(ordered[i - 1], ordered[i]) < 0, `${ordered[i - 1]} < ${ordered[i]}`);
});
