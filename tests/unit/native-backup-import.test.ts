// The Expo app's read only backup import (D287 P-NATIVEIMPORT, docs/decisions/data-backup.md;
// frontends/native/src/store/backup-import.ts): what it refuses, that a refusal keeps nothing, the size it counts,
// and the lines it says. Oracles: node:crypto's sha256 and Buffer.byteLength, the ruling's copy typed by hand, and
// the store's contents before the import. The SQLite store is support/sqlite-kv.ts (node:sqlite, expo's statements).
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { describe, test } from 'vitest';
import { memoryStore } from '@ia/core/engine/state-store.ts';
import type { StateStore } from '@ia/core/engine/state-store.ts';
import { held, importBackup, importLine, misses, utf8Bytes } from '../../frontends/native/src/store/backup-import.ts';
import type { ImportResult } from '../../frontends/native/src/store/backup-import.ts';
import { sqliteTestStore } from '../support/sqlite-kv.ts';

const sha256 = (s: string): string => createHash('sha256').update(s, 'utf8').digest('hex');
const PROGRAMS = JSON.stringify([{ id: 'P1', name: 'Half Manny', totalWeeks: 14, startDate: '2026-08-31' }, { id: 'P0', name: 'Old', totalWeeks: 6, startDate: null }]);
const DATA: Record<string, string> = {
  ia_active: 'P1',
  ia_comp_P1: '{"w1_mon":{"title":"Easy run","ts":1788220800000},"w1_tue":{"ts":1788307200000,"status":"skipped"}}',
  ia_logs_P1: JSON.stringify({ w1_mon: { notes: 'Felt strong 💪, slept 7 h' } }),
  ia_programs: PROGRAMS,
};
const file = (data: Record<string, string>, extra: Record<string, unknown> = {}): string =>
  JSON.stringify({ kind: 'asylum-backup', format: 1, version: '0.262.0', made: '2026-11-13T12:00:00.000Z', data, ...extra });
const BEFORE: Record<string, string> = { ia_active: 'OLD', ia_programs: '[{"id":"OLD","totalWeeks":4}]', other_app_key: 'x' };
const seeded = (s: StateStore): StateStore => { for (const [k, v] of Object.entries(BEFORE)) s.set(k, v); return s; };
const contents = (s: StateStore): Record<string, string> => Object.fromEntries(s.keys().sort().map((k) => [k, s.get(k)!]));

describe('the import checks every key', () => {
  for (const [name, make] of [['the SQLite store', sqliteTestStore], ['the plain map', () => memoryStore()]] as const) {
    test(name + ': a good backup loads, and each key held is the file\'s by size and sha256', () => {
      const s = seeded(make());
      const r = importBackup(s, file(DATA));
      assert.equal(r.ok, true);
      if (!r.ok) return;
      assert.deepStrictEqual(r.held.keys, Object.keys(DATA).sort().map((key) => ({ key, bytes: Buffer.byteLength(DATA[key]!, 'utf8'), sha256: sha256(DATA[key]!) })));
      assert.equal(r.version, '0.262.0');
      assert.equal(r.made, '2026-11-13T12:00:00.000Z');
      assert.deepStrictEqual(contents(s), { ...DATA, other_app_key: 'x' }, 'the ia_ keys are the file\'s; a key not the app\'s stays');
      assert.deepStrictEqual(r.held.programs, [
        { id: 'P1', name: 'Half Manny', startDate: '2026-08-31', totalWeeks: 14, active: true, marked: 2 },
        { id: 'P0', name: 'Old', startDate: null, totalWeeks: 6, active: false, marked: 0 },
      ]);
    });
  }

  test('a file that is not a backup, or is from a newer format, is refused and the store is untouched', () => {
    for (const [text, why] of [['not json', 'bad'], [file(DATA, { kind: 'other' }), 'bad'], [file({ ...DATA, x: 'y' }), 'bad'], [file(DATA, { format: 2 }), 'newer']] as const) {
      const s = seeded(sqliteTestStore());
      const r = importBackup(s, text);
      assert.deepStrictEqual(r, { ok: false, why, misses: [] });
      assert.deepStrictEqual(contents(s), BEFORE);
    }
  });

  test('a write the store refuses keeps nothing: what it held before is back, and no key of the file\'s is left', () => {
    const inner = seeded(memoryStore());
    assert.equal(inner.get('ia_logs_P1'), null, 'the store did not hold the key the refused write takes back');
    let writes = 0;
    const full: StateStore = { ...inner, set: (k, v) => { if (++writes === 3) throw new Error('full'); inner.set(k, v); } };
    assert.deepStrictEqual(importBackup(full, file(DATA)), { ok: false, why: 'refused', misses: [] });
    assert.deepStrictEqual(contents(inner), BEFORE);
  });

  test('SQLite turning a lone surrogate into U+FFFD is a mismatch, though the sha256 is the same, and keeps nothing', () => {
    const odd = 'half \uD83D pair';
    assert.equal(sha256(odd), sha256('half � pair'), 'the case the hash alone misses');
    const data = { ...DATA, ia_note_P1: odd };
    const s = seeded(sqliteTestStore());
    assert.equal(s.get('ia_note_P1'), null, 'the store did not hold that key before');
    const r = importBackup(s, file(data));
    assert.deepStrictEqual(r, { ok: false, why: 'mismatch', misses: ['ia_note_P1 differs'] });
    assert.deepStrictEqual(contents(s), BEFORE);
  });

  test('a store that drops a key, or keeps one the file does not have, is a mismatch, and keeps nothing', () => {
    const drops = seeded(memoryStore());
    const lossy: StateStore = { ...drops, set: (k, v) => { if (k !== 'ia_logs_P1') drops.set(k, v); } };
    assert.deepStrictEqual(importBackup(lossy, file(DATA)), { ok: false, why: 'mismatch', misses: ['ia_logs_P1 missing'] });
    assert.deepStrictEqual(contents(drops), BEFORE);
    const keeps = seeded(memoryStore());
    keeps.set('ia_stale', 's');
    const sticky: StateStore = { ...keeps, remove: (k) => { if (k !== 'ia_stale') keeps.remove(k); } };
    assert.deepStrictEqual(importBackup(sticky, file(DATA)), { ok: false, why: 'mismatch', misses: ['ia_stale not in the file'] });
    assert.deepStrictEqual(contents(keeps), { ...BEFORE, ia_stale: 's' });
  });

  test('misses names nothing on a store that holds the file exactly', () => {
    const s = memoryStore(DATA);
    assert.deepStrictEqual(misses(s, DATA), []);
  });

  test('held reads an empty store as nothing', () => {
    assert.deepStrictEqual(held(sqliteTestStore()), { keys: [], programs: [] });
  });
});

describe('the size in UTF-8 bytes', () => {
  test('is Node\'s count for ASCII, accents, emoji, CJK, and lone surrogates', () => {
    for (const s of ['', 'abc', 'é', '€', '💪🏽', '中文', 'a\uD83Db', '\uDC00', 'x\uD83D', 'a\u0000b', DATA['ia_logs_P1']!]) {
      assert.equal(utf8Bytes(s), Buffer.byteLength(s, 'utf8'), JSON.stringify(s));
    }
  });
});

describe('the lines (the copy rule: short declarative sentences, no dashes)', () => {
  const ok: ImportResult = { ok: true, held: { keys: [{ key: 'ia_a', bytes: 1, sha256: '' }, { key: 'ia_b', bytes: 1, sha256: '' }], programs: [] }, version: '0.261.0', made: '' };
  test('each outcome says what happened', () => {
    assert.equal(importLine(ok), 'Loaded 2 of 2 keys. Every hash matches the file. Saved by version 0.261.0.');
    assert.equal(importLine({ ...ok, version: '' }), 'Loaded 2 of 2 keys. Every hash matches the file.');
    assert.equal(importLine({ ok: false, why: 'newer', misses: [] }), 'This backup is from a newer app. Update the app first.');
    assert.equal(importLine({ ok: false, why: 'bad', misses: [] }), 'That file is not an Asylum backup.');
    assert.equal(importLine({ ok: false, why: 'refused', misses: [] }), 'The phone refused the write. Nothing was kept.');
    assert.equal(importLine({ ok: false, why: 'mismatch', misses: ['ia_x differs'] }), '1 key does not match the file. Nothing was kept. First miss: ia_x differs.');
    assert.equal(importLine({ ok: false, why: 'mismatch', misses: ['ia_x differs', 'ia_y missing'] }), '2 keys do not match the file. Nothing was kept. First miss: ia_x differs.');
  });
});
