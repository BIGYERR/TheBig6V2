// Golden files for program output: tests/snapshots/<feature>.json, one per feature, committed. These are this suite's
// own JSON files, not Vitest's snapshot feature.
//
// A test compares what the app produces now with the committed file and fails on any difference. When a ruling
// changes program output on purpose, regenerate the file and review the git diff, which is the record of what moved:
//
//   cd tests && UPDATE_SNAPSHOTS=1 npx vitest run integration/<feature>.test.ts
//   git diff tests/snapshots/<feature>.json
//
// A snapshot is never regenerated to make a red test green without a ruling that says the output moves.
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const SNAPSHOT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'snapshots');
export const updating = (): boolean => process.env['UPDATE_SNAPSHOTS'] === '1';

/** Compares `actual` (plain JSON data) with tests/snapshots/<feature>.json, or rewrites that file under UPDATE_SNAPSHOTS=1. */
export function matchSnapshot(feature: string, actual: unknown): void {
  const file = join(SNAPSHOT_DIR, feature + '.json');
  const text = JSON.stringify(actual, null, 2) + '\n';
  if (updating()) {
    mkdirSync(SNAPSHOT_DIR, { recursive: true });
    writeFileSync(file, text);
    return;
  }
  if (!existsSync(file)) {
    assert.fail(`tests/snapshots/${feature}.json does not exist; write it with UPDATE_SNAPSHOTS=1 and commit it`);
  }
  const expected: unknown = JSON.parse(readFileSync(file, 'utf8'));
  assert.deepStrictEqual(
    JSON.parse(text),
    expected,
    `program output differs from tests/snapshots/${feature}.json. If a ruling moved it, rerun with UPDATE_SNAPSHOTS=1 and review the git diff.`,
  );
}
