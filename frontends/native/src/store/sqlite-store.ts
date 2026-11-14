// The stored state on SQLite: core's StateStore (core/src/engine/state-store.ts), its third implementation after the
// browser's storage and the plain map (MIGRATION.md phase 2; docs/decisions/stored-state.md). It stands on the
// synchronous part of expo-sqlite/kv-store's SQLiteStorage, named here as KvSync so this file imports nothing of
// Expo's: the app hands it the phone's SQLiteStorage (phone-store.ts), and the tests a table under node:sqlite with
// the same statements. Core's state-*.ts readers and writers take it as they take the others, unchanged.
import type { StateStore } from '@ia/core/engine/state-store.ts';

/** The synchronous calls of expo-sqlite/kv-store's SQLiteStorage this store uses, as that package types them. */
export interface KvSync {
  getItemSync(key: string): string | null;
  setItemSync(key: string, value: string): void;
  removeItemSync(key: string): boolean;
  getAllKeysSync(): string[];
}

// Keys and values go in as strings, as the browser's storage turns them, so a number stored by mistake comes back
// as the same text on every store. A refused write throws to the caller, as the browser's does when it is full.
export function sqliteStore(kv: KvSync): StateStore {
  return {
    get: (key) => kv.getItemSync(String(key)),
    set: (key, value) => { kv.setItemSync(String(key), String(value)); },
    remove: (key) => { kv.removeItemSync(String(key)); },
    keys: () => kv.getAllKeysSync(),
  };
}
