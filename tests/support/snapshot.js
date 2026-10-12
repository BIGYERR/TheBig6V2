'use strict';
// Golden files for program output: tests/snapshots/<feature>.json, one per feature, committed.
//
// A test compares what the app produces now with the committed file and fails on any difference. When a ruling
// changes program output on purpose, regenerate the file and review the git diff, which is the record of what moved:
//
//   UPDATE_SNAPSHOTS=1 node --test tests/integration/<feature>.test.js
//   git diff tests/snapshots/<feature>.json
//
// A snapshot is never regenerated to make a red test green without a ruling that says the output moves.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const DIR = path.join(__dirname, '..', 'snapshots');
const updating = () => process.env.UPDATE_SNAPSHOTS === '1';

/** Compares `actual` (plain JSON data) with tests/snapshots/<feature>.json, or rewrites that file under UPDATE_SNAPSHOTS=1. */
function matchSnapshot(feature, actual) {
  const file = path.join(DIR, feature + '.json');
  const text = JSON.stringify(actual, null, 2) + '\n';
  if (updating()) {
    fs.mkdirSync(DIR, { recursive: true });
    fs.writeFileSync(file, text);
    return;
  }
  if (!fs.existsSync(file)) {
    assert.fail(`tests/snapshots/${feature}.json does not exist; write it with UPDATE_SNAPSHOTS=1 and commit it`);
  }
  const expected = JSON.parse(fs.readFileSync(file, 'utf8'));
  assert.deepStrictEqual(
    JSON.parse(text),
    expected,
    `program output differs from tests/snapshots/${feature}.json. If a ruling moved it, rerun with UPDATE_SNAPSHOTS=1 and review the git diff.`,
  );
}

module.exports = { matchSnapshot, updating, SNAPSHOT_DIR: DIR };
