// The phone's store: the SQLite store (sqlite-store.ts) on expo-sqlite/kv-store, one database file in this app's own
// container. This app has its own bundle id, so the file is never today's app's: nothing here reads or writes the
// storage of the app Mario uses every day. The database opens on the first call, not at import.
import { SQLiteStorage } from 'expo-sqlite/kv-store';

import { sqliteStore } from './sqlite-store';

export const DATABASE = 'iron-asylum-state';
export const phoneStore = sqliteStore(new SQLiteStorage(DATABASE));
