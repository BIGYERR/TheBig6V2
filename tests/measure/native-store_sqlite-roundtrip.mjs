// Measure (MIGRATION.md phase 2, session 2): does SQLite, through the exact statements expo-sqlite/kv-store 58.0.17
// runs (src/Storage.ts), hand back every ia_ value of every corpus backup byte for byte, and core's sha256Hex agree
// with node:crypto on each? Also the edge strings: emoji, a lone surrogate, NUL, a 6 MB value.
// Run from the repo root: node tests/measure/native-store_sqlite-roundtrip.mjs
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { gunzipSync } from 'node:zlib';
import { readBackupText, loadBackupInto, backupKeys } from '../../core/src/engine/state-backup.ts';
import { sha256Hex } from '../../core/src/engine/engine-check.ts';

const REPO = process.cwd();
const CORPUS = join(REPO, 'tests', 'snapshots', 'backups');
const node256 = (s) => createHash('sha256').update(s, 'utf8').digest('hex');

function kvStore() {
  const db = new DatabaseSync(':memory:');
  db.exec('CREATE TABLE IF NOT EXISTS storage (key TEXT PRIMARY KEY NOT NULL, value TEXT);');
  const get = db.prepare('SELECT value FROM storage WHERE key = ?;');
  const set = db.prepare('INSERT INTO storage (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value;');
  const rm = db.prepare('DELETE FROM storage WHERE key = ?;');
  const all = db.prepare('SELECT key FROM storage;');
  return {
    get: (k) => { const r = get.get(k); return r ? r.value : null; },
    set: (k, v) => { set.run(k, v); },
    remove: (k) => { rm.run(k); },
    keys: () => all.all().map((r) => r.key),
  };
}

let files = 0, keys = 0, bytes = 0, equal = 0, coreAgrees = 0;
const misses = [];
for (const f of readdirSync(CORPUS).filter((n) => n.endsWith('.json.gz')).sort()) {
  const text = gunzipSync(readFileSync(join(CORPUS, f))).toString('utf8');
  const read = readBackupText(text);
  if (!read.ok) { misses.push(f + ' unread ' + read.why); continue; }
  const s = kvStore();
  if (!loadBackupInto(s, read.data)) { misses.push(f + ' refused'); continue; }
  files++;
  const want = Object.keys(read.data).sort();
  if (JSON.stringify(backupKeys(s)) !== JSON.stringify(want)) misses.push(f + ' key set differs');
  for (const k of want) {
    keys++; bytes += Buffer.byteLength(read.data[k], 'utf8');
    const back = s.get(k);
    if (back === read.data[k] && node256(back) === node256(read.data[k])) equal++; else misses.push(f + ' ' + k);
    if (sha256Hex(read.data[k]) === node256(read.data[k])) coreAgrees++; else misses.push(f + ' ' + k + ' core sha256 differs');
  }
}
console.log(`corpus: ${files} files loaded, ${equal} of ${keys} keys read back equal (${bytes} bytes), core sha256 agrees on ${coreAgrees} of ${keys}`);

const edges = {
  emoji: 'Felt strong 💪🏽 today',
  loneSurrogate: 'half \uD83D pair',
  nul: 'a\u0000b',
  big: 'x'.repeat(6 * 1024 * 1024),
  empty: '',
};
for (const [name, v] of Object.entries(edges)) {
  const s = kvStore(); s.set('ia_edge', v); const back = s.get('ia_edge');
  console.log(`edge ${name}: length ${v.length} back ${back === null ? 'null' : back.length}, equal ${back === v}, core sha256 = node ${sha256Hex(v) === node256(v)}, stored sha256 = file ${back !== null && sha256Hex(back) === sha256Hex(v)}`);
}
console.log(misses.length ? 'misses:\n  ' + misses.join('\n  ') : 'misses: none');
