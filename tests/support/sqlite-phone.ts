// Imported first, it puts every test phone's storage in the Expo app's SQLite store (support/sqlite-kv.ts): a fresh
// SQLite database each launch, the stored keys copied into it, the page's every localStorage call and every record
// read through it. A file that imports this, then a stored-state test file, runs that file's histories on SQLite and
// holds them against the same golden records (tests/integration/native-store.test.ts, tests/sweeps/native-store.test.ts).
import type { DatabaseSync } from 'node:sqlite';
import { sqliteStore } from '../../frontends/native/src/store/sqlite-store.ts';
import { Phone } from './stored-state.ts';
import { StoreMap, nodeKv } from './sqlite-kv.ts';

/** The database the newest launch opened, so a test can read the table itself (only the newest: a sweep launches thousands). */
export const newest: { db: DatabaseSync | null; opened: number } = { db: null, opened: 0 };

Phone.storage = () => { const kv = nodeKv(); newest.db = kv.db; newest.opened++; return new StoreMap(sqliteStore(kv)); };
