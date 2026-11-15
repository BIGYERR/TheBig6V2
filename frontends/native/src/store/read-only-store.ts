// A store that reads and never writes: every get and every key list is the store's under it, every write and every
// removal is dropped. The Expo app's copy of the stored state is a backup loaded read only (D287 P-NATIVEIMPORT,
// docs/decisions/data-backup.md), and core's launch writes two keys when it repairs an older program or drops the day
// edits of weeks now frozen (core/src/engine/state-refresh.ts). The launch is handed this, so the copy stays the
// file's, key for key and hash for hash. Measured over every launch of the stored-state histories: the grid the
// launch hands back through this store is the one it hands back through a store that writes
// (tests/measure/native-this-week_launch.md). It goes when the Expo app logs and its store becomes the real one.
import type { StateStore } from '@ia/core/engine/state-store.ts';

export function readOnly(store: StateStore): StateStore {
  return {
    get: (key) => store.get(key),
    keys: () => store.keys(),
    set: () => {},
    remove: () => {},
  };
}
