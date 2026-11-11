// ── The app's stored state sits behind one store (docs/decisions/stored-state.md): string keys, string values, synchronous. ──
// The page stands it on the browser's localStorage; a test, and core's own logic as it moves here, on a plain map; the
// React Native app on the phone's store. It lives beside the engine while the page is built from this folder, and
// moves to core/src/app-state at cutover (MIGRATION.md).
export interface StateStore {
  /** The value under `key`, or null when nothing is stored there. */
  get(key: string): string | null;
  /** Stores `value` under `key`. A store that cannot take it throws, as the browser's does when it is full. */
  set(key: string, value: string): void;
  remove(key: string): void;
  /** Every key, in the store's own order. */
  keys(): string[];
}
/** What a store can stand on: the part of the browser's Storage the app uses. */
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  key(index: number): string | null;
  readonly length: number;
}
// `source` is asked at every call, never kept: a page whose storage is replaced or patched after launch is followed.
function storageStore(source: () => StorageLike): StateStore{
  return {
    get: function(key){ return source().getItem(key); },
    set: function(key,value){ source().setItem(key,value); },
    remove: function(key){ source().removeItem(key); },
    keys: function(){ const s=source(), out: string[]=[]; for(let i=0;i<s.length;i++){ const k=s.key(i); if(k!=null) out.push(k); } return out; },
  };
}
function memoryStore(seed?: Record<string, string>): StateStore{
  const m=new Map<string, string>();
  if(seed) Object.keys(seed).forEach(function(k){ m.set(k,String(seed[k])); });
  return {
    get: function(key){ const v=m.get(key); return v===undefined?null:v; },
    set: function(key,value){ m.set(String(key),String(value)); },
    remove: function(key){ m.delete(key); },
    keys: function(){ return Array.from(m.keys()); },
  };
}

// the module exports (scripts/module-blocks.mjs writes them; build-index.mjs strips them)
export { memoryStore, storageStore };
