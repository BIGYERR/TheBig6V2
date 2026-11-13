// The Expo app's SQLite store, as close as the Node runner gets to the phone (docs/decisions/stored-state.md, the
// SQLite store). expo-sqlite/kv-store is a native module, so it cannot load here; what can is SQLite itself, through
// node:sqlite, running the very statements expo-sqlite/kv-store 58.0.17 runs (its src/Storage.ts, typed again below),
// under the app's own sqliteStore (frontends/native/src/store/sqlite-store.ts). What only the simulator proves: the
// native module's own SQLite build, and Hermes's strings crossing into it and back.
import { DatabaseSync } from 'node:sqlite';
import type { StateStore } from '@ia/core/engine/state-store.ts';
import { sqliteStore } from '../../frontends/native/src/store/sqlite-store.ts';
import type { KvSync } from '../../frontends/native/src/store/sqlite-store.ts';

// expo-sqlite 58.0.17, src/Storage.ts: the table and the statements of getItemSync, setItemSync, removeItemSync and
// getAllKeysSync.
const CREATE = 'CREATE TABLE IF NOT EXISTS storage (key TEXT PRIMARY KEY NOT NULL, value TEXT);';
const GET = 'SELECT value FROM storage WHERE key = ?;';
const SET = 'INSERT INTO storage (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value;';
const REMOVE = 'DELETE FROM storage WHERE key = ?;';
const ALL_KEYS = 'SELECT key FROM storage;';

/** expo-sqlite/kv-store's synchronous calls on a fresh SQLite database under node:sqlite (in memory unless a path). */
export function nodeKv(path = ':memory:'): KvSync & { db: DatabaseSync } {
  const db = new DatabaseSync(path);
  db.exec(CREATE);
  const get = db.prepare(GET), set = db.prepare(SET), remove = db.prepare(REMOVE), all = db.prepare(ALL_KEYS);
  return {
    db,
    getItemSync: (key) => { const r = get.get(key) as { value: string | null } | undefined; return r ? r.value : null; },
    setItemSync: (key, value) => { set.run(key, value); },
    removeItemSync: (key) => Number(remove.run(key).changes) > 0,
    getAllKeysSync: () => (all.all() as { key: string }[]).map((r) => r.key),
  };
}

/** The app's SQLite store on a fresh database. */
export function sqliteTestStore(path?: string): StateStore { return sqliteStore(nodeKv(path)); }

/**
 * A Map whose every read and write goes to a StateStore, so the test phone (support/stored-state.ts) can keep its
 * storage there: the page's localStorage calls and the records read the SQLite store, never a map beside it.
 */
export class StoreMap extends Map<string, string> {
  private readonly store: StateStore;
  constructor(store: StateStore) { super(); this.store = store; }
  override get(k: string): string | undefined { const v = this.store.get(k); return v === null ? undefined : v; }
  override has(k: string): boolean { return this.store.get(k) !== null; }
  override set(k: string, v: string): this { this.store.set(k, v); return this; }
  override delete(k: string): boolean { const had = this.has(k); this.store.remove(k); return had; }
  override clear(): void { this.store.keys().forEach((k) => this.store.remove(k)); }
  override get size(): number { return this.store.keys().length; }
  override keys(): MapIterator<string> { return this.store.keys()[Symbol.iterator](); }
  override values(): MapIterator<string> { return this.store.keys().map((k) => this.store.get(k)!)[Symbol.iterator](); }
  override entries(): MapIterator<[string, string]> { return this.store.keys().map((k): [string, string] => [k, this.store.get(k)!])[Symbol.iterator](); }
  override [Symbol.iterator](): MapIterator<[string, string]> { return this.entries(); }
  override forEach(fn: (v: string, k: string, m: Map<string, string>) => void): void { for (const [k, v] of this.entries()) fn(v, k, this); }
}
