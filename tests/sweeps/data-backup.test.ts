// Every backup the app has ever written loads (MIGRATION.md, constraint 4). The corpus in tests/snapshots/backups/
// holds one backup file made by each tagged release since the backup shipped (v0.253.0, D264), by that release's own
// page: HALF_MANNY made in the wizard, two days trained, Save a backup. Files are gzipped; each is the exact text the
// release wrote. This file loads every one on the page under test and holds what came out.
//
// It guards behaviour that must not change (the reader and the loader are about to move into core), so it passes on
// the release before it too.
//
// Adding a release to the corpus, after its tag exists (the corpus is never rebuilt, only added to):
//   node tools/app-at.mjs v<version> <scratch>/pages/v<version>.html
//   cd tests && BACKUP_PAGES=<scratch>/pages npx vitest run sweeps/data-backup.test.ts
//   UPDATE_SNAPSHOTS=1 npx vitest run sweeps/data-backup.test.ts
process.env['TZ'] = 'America/New_York';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { gunzipSync, gzipSync } from 'node:zlib';
import { test } from 'vitest';
import { semver } from '@ia/core';
import { fixtures } from '../support/app.ts';
import { matchSnapshot, SNAPSHOT_DIR } from '../support/snapshot.ts';
import { Phone, at, trainDay, training } from '../support/stored-state.ts';

const CORPUS = join(SNAPSHOT_DIR, 'backups');
const CREATED = '2026-08-29T09:00:00', START = '2026-08-31';
const tagOf = (file: string): string => file.replace(/\.json\.gz$/, '');
const files = (): string[] => (existsSync(CORPUS) ? readdirSync(CORPUS).filter((f) => f.endsWith('.json.gz')) : [])
  .sort((a, b) => semver.cmp(tagOf(a).slice(1), tagOf(b).slice(1)));

// The builder: only with BACKUP_PAGES set, and only for a release the corpus does not hold yet.
test.runIf(!!process.env['BACKUP_PAGES'])('build: each page in BACKUP_PAGES writes its own backup into the corpus', () => {
  const dir = process.env['BACKUP_PAGES']!;
  mkdirSync(CORPUS, { recursive: true });
  const made: string[] = [];
  for (const page of readdirSync(dir).filter((f) => /^v\d+\.\d+\.\d+\.html$/.test(f)).sort()) {
    const tag = page.replace(/\.html$/, '');
    const out = join(CORPUS, tag + '.json.gz');
    if (existsSync(out)) continue;
    const P = new Phone(join(dir, page)).launch(CREATED);
    P.generate(fixtures.HALF_MANNY);
    training(P.launch(at(START, 0)), 1).slice(0, 2).forEach((d, i) => { P.launch(at(START, ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].indexOf(d))); trainDay(P, 1, d, i); });
    const snap = P.ev('backupSnapshot()');
    assert.equal(String(snap.version), tag.slice(1), tag + ': the file names the release that wrote it');
    // The app writes the file as JSON.stringify(snapshot) (saveBackup); so does this.
    writeFileSync(out, gzipSync(Buffer.from(JSON.stringify(snap), 'utf8'), { level: 9 }));
    made.push(tag);
  }
  assert.ok(made.length > 0, 'BACKUP_PAGES held no release the corpus lacks');
});

test('the corpus holds a backup from each of the 17 tagged releases since v0.253.0, each naming its release', () => {
  const tags = files().map(tagOf);
  // Typed from `git tag`, 2026-11-11. A later release is added below when its backup is added to the corpus.
  assert.deepStrictEqual(tags, ['v0.253.0', 'v0.253.1', 'v0.254.0', 'v0.255.0', 'v0.255.1', 'v0.255.2', 'v0.256.0', 'v0.257.0', 'v0.258.0', 'v0.258.1',
    'v0.259.0', 'v0.259.1', 'v0.259.2', 'v0.259.3', 'v0.259.4', 'v0.260.0', 'v0.261.0']);
  for (const f of files()) {
    const b = JSON.parse(gunzipSync(readFileSync(join(CORPUS, f))).toString('utf8'));
    assert.equal(b.kind, 'asylum-backup', f);
    assert.equal(b.format, 1, f + ': one format so far');
    assert.equal(b.version, tagOf(f).slice(1), f);
    assert.ok(Object.keys(b.data).length >= 6 && Object.keys(b.data).every((k) => k.startsWith('ia_') && typeof b.data[k] === 'string'), f + ': ia_ keys, each a string');
  }
});

test('every backup in the corpus loads: the keys on the phone are the file\'s, byte for byte, and the next launch stands', () => {
  const held: Record<string, unknown> = {};
  assert.ok(files().length >= 17);
  for (const f of files()) {
    const text = gunzipSync(readFileSync(join(CORPUS, f))).toString('utf8');
    const file = JSON.parse(text);
    const P = new Phone().launch(at(START, 3, '08:00'));
    assert.deepStrictEqual(P.dump(), {}, 'an empty phone');
    P.IA.ctx['__text'] = text;
    const read = P.ev('readBackup(__text)');
    assert.equal(read.ok, true, f + ' is read');
    assert.equal(read.programs, 1, f);
    assert.equal(P.ev('loadBackupData(readBackup(__text).data)'), true, f + ' loads');
    assert.deepStrictEqual(P.dump(), Object.fromEntries(Object.entries(file.data).sort()), f + ': every key as the file holds it');
    P.launch(at(START, 3, '08:05'));
    const r = P.record();
    assert.equal(r.live!.week, 1, f + ': Thursday 3 September is in the first week');
    assert.equal(r.programs.length, 1, f);
    held[tagOf(f)] = {
      file: Buffer.byteLength(text, 'utf8') + ' ' + createHash('sha256').update(text, 'utf8').digest('hex'),
      keys: Object.keys(file.data).length,
      afterLaunch: { keys: Object.fromEntries(Object.entries(r.keys).map(([k, v]) => [k, v.bytes + ' ' + v.sha256])), programs: r.programs, live: r.live },
    };
  }
  matchSnapshot('stored-state-backups', held);
});
