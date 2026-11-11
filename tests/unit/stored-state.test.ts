// The store the app's stored state sits behind: StateStore, memoryStore and storageStore
// (core/src/engine/state-store.ts, docs/decisions/stored-state.md, v0.261.2), imported from @ia/core and run alone,
// and the page's one use of the browser's storage. Every expected value is typed from the ruling. What the app stores
// through it is held by tests/integration/stored-state.test.ts and the sweeps.
import assert from 'node:assert/strict';
import { test } from 'vitest';
import { memoryStore, storageStore } from '@ia/core/engine/state-store.ts';
import type { StorageLike } from '@ia/core/engine/state-store.ts';
import { appScript, loadApp } from '../support/app.ts';

/** A stand-in for the browser's storage that records what was asked of it. */
function fakeStorage(start: [string, string][] = []): StorageLike & { calls: string[]; rows: (readonly [string, string] | null)[] } {
  const rows: (readonly [string, string] | null)[] = start.map((r) => r);
  const calls: string[] = [];
  const at = (k: string) => rows.findIndex((r) => r !== null && r[0] === k);
  return {
    calls, rows,
    getItem(k) { calls.push('get ' + k); const i = at(k); return i < 0 ? null : rows[i]![1]; },
    setItem(k, v) { calls.push('set ' + k + '=' + v); const i = at(k); if (i < 0) rows.push([k, v]); else rows[i] = [k, v]; },
    removeItem(k) { calls.push('remove ' + k); const i = at(k); if (i >= 0) rows.splice(i, 1); },
    key(i) { const r = rows[i]; return r ? r[0] : null; },
    get length() { return rows.length; },
  };
}

test('a memory store gives null for a key never set, the string that was set, and null again once removed', () => {
  const s = memoryStore();
  assert.equal(s.get('ia_active'), null);
  s.set('ia_active', 'prog_1');
  assert.equal(s.get('ia_active'), 'prog_1');
  s.set('ia_active', '');
  assert.equal(s.get('ia_active'), '', 'an empty string is a stored value, not nothing');
  s.remove('ia_active');
  assert.equal(s.get('ia_active'), null);
  s.remove('never there');   // removing nothing is not an error
});

test('a memory store keeps strings: what is set is stored as String(value), as the browser does', () => {
  const s = memoryStore();
  s.set('n', 42 as unknown as string);
  s.set('o', { a: 1 } as unknown as string);
  assert.equal(s.get('n'), '42');
  assert.equal(s.get('o'), '[object Object]');
});

test('a memory store lists its keys in the order each was first set', () => {
  const s = memoryStore();
  s.set('ia_programs', '[]'); s.set('ia_active', 'p'); s.set('ia_logs_p', '{}');
  s.set('ia_programs', '[1]');   // set again: its place is kept
  assert.deepEqual(s.keys(), ['ia_programs', 'ia_active', 'ia_logs_p']);
  s.remove('ia_active'); s.set('ia_active', 'q');   // removed and set again: it goes to the end
  assert.deepEqual(s.keys(), ['ia_programs', 'ia_logs_p', 'ia_active']);
});

test('a memory store copies its seed: neither changes the other afterwards', () => {
  const seed: Record<string, string> = { ia_theme: 'night' };
  const s = memoryStore(seed);
  assert.equal(s.get('ia_theme'), 'night');
  seed['ia_theme'] = 'day'; seed['ia_new'] = 'x';
  assert.equal(s.get('ia_theme'), 'night');
  assert.equal(s.get('ia_new'), null);
  s.set('ia_theme', 'auto');
  assert.equal(seed['ia_theme'], 'day');
});

test('a storage store reads, writes and removes on the storage it stands on, one call each', () => {
  const f = fakeStorage([['ia_active', 'p1']]);
  const s = storageStore(() => f);
  assert.equal(s.get('ia_active'), 'p1');
  assert.equal(s.get('ia_none'), null);
  s.set('ia_theme', 'day');
  s.remove('ia_active');
  assert.deepEqual(f.calls, ['get ia_active', 'get ia_none', 'set ia_theme=day', 'remove ia_active']);
  assert.deepEqual(f.rows, [['ia_theme', 'day']]);
});

test('a storage store asks for its storage at every call, so a storage swapped after launch is followed', () => {
  const a = fakeStorage([['k', 'from a']]), b = fakeStorage([['k', 'from b']]);
  let now: StorageLike = a;
  const s = storageStore(() => now);
  assert.equal(s.get('k'), 'from a');
  now = b;
  assert.equal(s.get('k'), 'from b');
  s.set('k', 'written');
  assert.deepEqual([a.rows, b.rows], [[['k', 'from a']], [['k', 'written']]]);
});

test('a storage store lists key(0) to key(length - 1), in storage order, skipping a null', () => {
  const f = fakeStorage([['ia_b', '1'], ['ia_a', '2'], ['other', '3']]);
  f.rows.splice(1, 0, null);   // a slot whose key() answers null
  assert.equal(f.length, 4);
  assert.deepEqual(storageStore(() => f).keys(), ['ia_b', 'ia_a', 'other']);
  assert.deepEqual(storageStore(() => fakeStorage()).keys(), []);
});

test('a storage that refuses a write throws out of set, to the caller', () => {
  const f = fakeStorage();
  f.setItem = () => { throw new Error('QuotaExceededError'); };
  assert.throws(() => storageStore(() => f).set('ia_hist_p', '{}'), /QuotaExceededError/);
});

test('the page names the browser\'s storage once, where its one store is made', () => {
  const code = appScript().replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`\\])\/\/[^\n]*/g, '$1');
  assert.deepEqual(code.match(/[^\n]*\blocalStorage\b[^\n]*/g), ['const iaStore=storageStore(()=>localStorage);']);
});

test('the page\'s store is the harness\'s storage: a write through one is read through the other', () => {
  const IA = loadApp();
  IA.eval("iaStore.set('ia_theme','night')");
  assert.equal(IA.localStorage.getItem('ia_theme'), 'night');
  IA.localStorage.setItem('ia_active', 'prog_7');
  assert.equal(IA.eval("iaStore.get('ia_active')"), 'prog_7');
  assert.deepEqual([...IA.eval('iaStore.keys()')], ['ia_theme', 'ia_active']);   // copied: the array is the page's own
  IA.eval("iaStore.remove('ia_theme')");
  assert.equal(IA.localStorage.getItem('ia_theme'), null);
});
