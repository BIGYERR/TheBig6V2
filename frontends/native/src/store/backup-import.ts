// Loading a backup into the Expo app, read only (MIGRATION.md phase 2; D287 P-NATIVEIMPORT,
// docs/decisions/data-backup.md). The file is read by core's reader and loaded by core's all or nothing loader, as
// today's app loads it. Then every ia_ key the store holds is checked against the file: the same key set, and each
// value equal to the file's, character for character and by sha256. A miss puts back what the store held before, so
// a refused import keeps nothing. Nothing here writes a file or reaches today's app: the store is this app's own.
import { backupKeys, loadBackupInto, readBackupText } from '@ia/core/engine/state-backup.ts';
import type { BackupData } from '@ia/core/engine/state-backup.ts';
import { sha256Hex } from '@ia/core/engine/engine-check.ts';
import { readCompleted } from '@ia/core/engine/state-day-status.ts';
import { readActiveProgramId, readPrograms } from '@ia/core/engine/state-programs.ts';
import type { StateStore } from '@ia/core/engine/state-store.ts';

/** One stored key: its name, its size in UTF-8 bytes, and the sha256 of its value. */
export interface HeldKey { key: string; bytes: number; sha256: string }
/** One stored program, as core's readers find it. */
export interface HeldProgram { id: string; name: string; startDate: string | null; totalWeeks: number; active: boolean; marked: number }
/** What the store holds. */
export interface Held { keys: HeldKey[]; programs: HeldProgram[] }
export type ImportResult =
  | { ok: true; held: Held; version: string; made: string }
  | { ok: false; why: 'bad' | 'newer' | 'refused' | 'mismatch'; misses: string[] };

/** The size of a string as UTF-8, as the phone stores it (a lone surrogate counts as the three bytes of U+FFFD). */
export function utf8Bytes(s: string): number {
  let n = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if (c < 0x80) n += 1;
    else if (c < 0x800) n += 2;
    else if (c >= 0xd800 && c <= 0xdbff && i + 1 < s.length && (s.charCodeAt(i + 1) & 0xfc00) === 0xdc00) { n += 4; i++; }
    else n += 3;
  }
  return n;
}

/** Every ia_ key with its size and hash, and each program core's readers find in it. */
export function held(store: StateStore): Held {
  const keys = backupKeys(store).flatMap((key) => {
    const v = store.get(key);
    return v == null ? [] : [{ key, bytes: utf8Bytes(v), sha256: sha256Hex(v) }];
  });
  const active = readActiveProgramId(store);
  const programs = readPrograms(store).filter((p) => p && typeof p.id === 'string').map((p) => ({
    id: p.id, name: String(p.name ?? ''), startDate: p.startDate ?? null, totalWeeks: Number(p.totalWeeks) || 0,
    active: p.id === active, marked: Object.keys(readCompleted(store, p.id)).length,
  }));
  return { keys, programs };
}

/** Each way the store differs from the file, by key: one missing, one extra, one whose value is not the file's. */
export function misses(store: StateStore, data: BackupData): string[] {
  const want = Object.keys(data).sort(), have = backupKeys(store);
  const out: string[] = [];
  want.filter((k) => have.indexOf(k) < 0).forEach((k) => out.push(k + ' missing'));
  have.filter((k) => !(k in data)).forEach((k) => out.push(k + ' not in the file'));
  want.filter((k) => have.indexOf(k) >= 0).forEach((k) => {
    const got = store.get(k);
    if (got === null || got !== data[k] || sha256Hex(got) !== sha256Hex(data[k]!)) out.push(k + ' differs');
  });
  return out;
}

// The release that wrote the file, read again from its text (core's reader checks the file, and hands back its data).
function releaseOf(text: string): string {
  try { const f = JSON.parse(text); return typeof f.version === 'string' ? f.version : ''; } catch { return ''; }
}

/** Reads a backup's text, loads it into `store` and checks every key. Refused, the store holds what it held before. */
export function importBackup(store: StateStore, text: string): ImportResult {
  const read = readBackupText(text);
  if (!read.ok) return { ok: false, why: read.why, misses: [] };
  const before: BackupData = {};
  backupKeys(store).forEach((k) => { const v = store.get(k); if (v != null) before[k] = v; });
  if (!loadBackupInto(store, read.data)) return { ok: false, why: 'refused', misses: [] };
  const found = misses(store, read.data);
  if (found.length) {
    loadBackupInto(store, before);
    return { ok: false, why: 'mismatch', misses: found };
  }
  return { ok: true, held: held(store), version: releaseOf(text), made: read.made };
}

/** The line under the button (the copy rule: short declarative sentences, no dashes). */
export function importLine(r: ImportResult): string {
  if (r.ok) {
    const n = r.held.keys.length;
    return 'Loaded ' + n + ' of ' + n + ' keys. Every hash matches the file.' + (r.version ? ' Saved by version ' + r.version + '.' : '');
  }
  if (r.why === 'newer') return 'This backup is from a newer app. Update the app first.';
  if (r.why === 'bad') return 'That file is not an Asylum backup.';
  if (r.why === 'refused') return 'The phone refused the write. Nothing was kept.';
  return r.misses.length + (r.misses.length === 1 ? ' key does' : ' keys do') + ' not match the file. Nothing was kept. First miss: ' + r.misses[0] + '.';
}
