// The Expo app's SQLite store (MIGRATION.md phase 2; docs/decisions/stored-state.md, the SQLite store) and its read
// only backup import (docs/decisions/data-backup.md, D287 P-NATIVEIMPORT), as close as the Node runner gets: SQLite
// under node:sqlite with expo-sqlite/kv-store 58.0.17's own statements (support/sqlite-kv.ts), under the app's own
// sqliteStore and importBackup (frontends/native/src/store).
//
// 1. Every golden record of tests/integration/stored-state.test.ts, made again with each test phone's storage in that
//    SQLite store, and held against the same golden file (tests/snapshots/stored-state.json), to the byte: the import
//    of support/sqlite-phone.ts below puts every phone there, and the import after it runs that file's tests here.
//    The sweeps do the same for theirs (tests/sweeps/native-store.test.ts, CI only).
// 2. Core's state-*.ts readers and writers on the SQLite store and on the plain map, from the same history: equal.
// 3. Every backup in the corpus imported by the app: every key's value and sha256 the file's (node:crypto's, the
//    oracle), its size the file's in UTF-8 bytes, the program the one HALF_MANNY made.
//
// What only the simulator proves: expo-sqlite's own SQLite build and Hermes's strings crossing into it and back,
// sha256Hex under Hermes, the document picker and the file read, and the screen.
process.env['TZ'] = 'America/New_York';
import '../support/sqlite-phone.ts';
import './stored-state.test.ts';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gunzipSync } from 'node:zlib';
import { test } from 'vitest';
import { memoryStore } from '@ia/core/engine/state-store.ts';
import type { StateStore } from '@ia/core/engine/state-store.ts';
import { readDayLogs, writeDayLogs } from '@ia/core/engine/state-day-log.ts';
import { clearDayStatus, readCompleted, readPartSkips, setDayStatus } from '@ia/core/engine/state-day-status.ts';
import { readDayEdits } from '@ia/core/engine/state-day-edits.ts';
import { readDayHistory } from '@ia/core/engine/state-day-history.ts';
import { readLiftLog } from '@ia/core/engine/state-lift-log.ts';
import { readSwapCounts, readSwaps } from '@ia/core/engine/state-swaps.ts';
import {
  readActiveProgramId, readPrograms, readWildcardDone, recordSwapPreference, writeActiveProgramId, writeWildcardDone,
} from '@ia/core/engine/state-programs.ts';
import { seedFromStoredPrograms } from '@ia/core/engine/state-progress.ts';
import { importBackup } from '../../frontends/native/src/store/backup-import.ts';
import { fixtures } from '../support/app.ts';
import { SNAPSHOT_DIR } from '../support/snapshot.ts';
import { Phone, life } from '../support/stored-state.ts';
import { StoreMap, sqliteTestStore } from '../support/sqlite-kv.ts';
import { newest } from '../support/sqlite-phone.ts';

const sha256 = (s: string): string => createHash('sha256').update(s, 'utf8').digest('hex');
const CORPUS = join(SNAPSHOT_DIR, 'backups');

test('a test phone here keeps its storage in SQLite: the table holds every ia_ key the page wrote, value for value', () => {
  const before = newest.opened;
  const P = new Phone().launch('2026-08-29T09:00:00');
  P.generate(fixtures.HALF_MANNY);
  assert.ok(newest.opened > before, 'the launch opened a SQLite database');
  assert.ok(P.IA.localStorage._map instanceof StoreMap, 'the page\'s storage is the SQLite store');
  const rows = newest.db!.prepare('SELECT key, value FROM storage ORDER BY key;').all() as { key: string; value: string }[];
  const table = Object.fromEntries(rows.filter((r) => r.key.startsWith('ia_')).map((r) => [r.key, r.value]));
  assert.deepStrictEqual(table, P.dump(), 'the record reads what the table holds');
  assert.ok(Object.keys(table).includes('ia_programs') && Object.keys(table).includes('ia_active'));
});

/** The same keys in two stores. */
function both(data: Record<string, string>): [StateStore, StateStore] {
  const a = sqliteTestStore(), b = memoryStore();
  for (const [k, v] of Object.entries(data)) { a.set(k, v); b.set(k, v); }
  return [a, b];
}
const sorted = (s: StateStore): Record<string, string> => Object.fromEntries(s.keys().sort().map((k) => [k, s.get(k)!]));

test('core\'s readers read the SQLite store as they read the plain map, over a whole history', () => {
  const dump = life(fixtures.HALF_MANNY, '2026-08-29T09:00:00').phone.dump();
  const [sql, mem] = both(dump);
  assert.deepStrictEqual(sorted(sql), dump, 'the SQLite store holds the history to the byte');
  const id = readActiveProgramId(sql);
  assert.ok(id && id.startsWith('prog_'));
  assert.equal(id, readActiveProgramId(mem));
  assert.deepStrictEqual(readPrograms(sql), readPrograms(mem));
  const readers: ((s: StateStore, programId: string | null) => object)[] =
    [readDayLogs, readCompleted, readPartSkips, readDayEdits, readDayHistory, readLiftLog, readSwaps, readSwapCounts, readWildcardDone];
  for (const read of readers) {
    const got: object = read(sql, id), want: object = read(mem, id);
    assert.deepStrictEqual(got, want, read.name);
    // The day edits are pruned once their week is past: the golden record holds ia_edits_ as {} after two weeks away.
    if (read !== readDayEdits) assert.ok(Object.keys(got).length > 0, read.name + ' found the history\'s record');
  }
  assert.equal(sql.get('ia_edits_' + id), '{}');
  const now = Date.UTC(2026, 9, 7, 12);
  assert.deepStrictEqual(seedFromStoredPrograms(sql, now), seedFromStoredPrograms(mem, now));
});

test('core\'s writers leave the SQLite store holding what they leave in the plain map', () => {
  const dump = life(fixtures.HALF_MANNY, '2026-08-29T09:00:00').phone.dump();
  const [sql, mem] = both(dump);
  const id = readActiveProgramId(mem)!;
  for (const s of [sql, mem]) {
    setDayStatus(s, id, 9, 'tue', 'Easy run', 'complete', Date.UTC(2026, 9, 27, 22));
    clearDayStatus(s, id, 1, 'mon');
    writeDayLogs(s, id, { ...readDayLogs(s, id), w9_tue: { notes: 'Rain all the way 🌧️, still went', ts: 1793138400000 } as never });
    writeWildcardDone(s, id, [...readWildcardDone(s, id), { title: 'A second wildcard', ts: 1793138400000, week: 9, dayKey: 'w9_wed' }]);
    recordSwapPreference(s, id, 'Back Squat', 'Front Squat');
    writeActiveProgramId(s, id);
  }
  assert.deepStrictEqual(sorted(sql), sorted(mem));
  assert.notDeepStrictEqual(sorted(sql), dump, 'the writes changed the store');
});

test('every backup in the corpus imports into the SQLite store: each key the file\'s, by value and by sha256', () => {
  const pinned = JSON.parse(readFileSync(join(SNAPSHOT_DIR, 'stored-state-backups.json'), 'utf8')) as Record<string, { file: string; keys: number }>;
  const files = readdirSync(CORPUS).filter((f) => f.endsWith('.json.gz')).sort();
  assert.equal(files.length, 17, 'the corpus: one backup from each of the 17 tagged releases since v0.253.0');
  for (const f of files) {
    const tag = f.replace(/\.json\.gz$/, '');
    const text = gunzipSync(readFileSync(join(CORPUS, f))).toString('utf8');
    assert.equal(Buffer.byteLength(text, 'utf8') + ' ' + sha256(text), pinned[tag]!.file, tag + ': the file the golden record pins');
    const file = JSON.parse(text) as { version: string; data: Record<string, string> };
    const store = sqliteTestStore();
    const r = importBackup(store, text);
    assert.equal(r.ok, true, tag + ' imports');
    if (!r.ok) continue;
    assert.equal(r.version, tag.slice(1), tag + ': the release that saved it');
    assert.equal(r.held.keys.length, pinned[tag]!.keys, tag + ': every key');
    assert.deepStrictEqual(r.held.keys.map((k) => k.key), Object.keys(file.data).sort(), tag + ': the file\'s keys, sorted');
    for (const k of r.held.keys) {
      const want = file.data[k.key]!;
      assert.equal(store.get(k.key), want, tag + ' ' + k.key + ': the value');
      assert.equal(k.sha256, sha256(want), tag + ' ' + k.key + ': the sha256');
      assert.equal(k.bytes, Buffer.byteLength(want, 'utf8'), tag + ' ' + k.key + ': the size');
    }
    // HALF_MANNY, made on 2026-08-29: fourteen weeks back from race week, first Monday 2026-08-31, two days trained.
    assert.deepStrictEqual(r.held.programs.map((p) => [p.id, p.totalWeeks, p.startDate, p.active, p.marked]),
      [['prog_1788008400000', 14, '2026-08-31', true, 2]], tag + ': the program');
  }
});

test('an import on a store that already holds a backup replaces every ia_ key and leaves the rest', () => {
  const [a, b] = readdirSync(CORPUS).filter((f) => f.endsWith('.json.gz')).sort().slice(-2).map((f) => gunzipSync(readFileSync(join(CORPUS, f))).toString('utf8'));
  const store = sqliteTestStore();
  store.set('not_ours', 'stays');
  assert.equal(importBackup(store, a!).ok, true);
  store.set('ia_left_over', 'from before');
  assert.equal(importBackup(store, b!).ok, true);
  const data = (JSON.parse(b!) as { data: Record<string, string> }).data;
  assert.deepStrictEqual(sorted(store), { ...Object.fromEntries(Object.entries(data).sort()), not_ours: 'stays' });
});
