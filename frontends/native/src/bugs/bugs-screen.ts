// The Bugs tab in the Expo app, as a view (MIGRATION.md phase 3, row 7, the second session): today's Bugs screen
// (frontends/app/src/app/screens/bug-report/bug-report.ts over the page's theme.ts and data-backup.ts) with the
// page's globals taken as arguments. Nothing here writes a key or a file: what the screen writes is bugs-writes.ts.
//
//   The bug report   bug-report-model.ts, a copy of today's held to the byte, and the context this app attaches.
//   Look (D261)      the page's getTheme over this app's own store, and which palette the look draws.
//   Your data        the page's backupFileName, readBackup and backupMessage (D264), with the file's kind this
//                    app's own (D297 P-NEXTKIND, docs/decisions/data-backup.md): today's app turns the file away.
//   Engine (D286)    the row's words; the check itself is ../EngineCheck.tsx.
import { versionLabel } from '@ia/core';
import { BACKUP_KIND, readBackupText, takeBackup } from '@ia/core/engine/state-backup.ts';
import type { BackupData, BackupFile, BackupRead } from '@ia/core/engine/state-backup.ts';
import type { StateStore } from '@ia/core/engine/state-store.ts';

import { storedProgram } from '../this-week/week-screen';
import type { BugContext } from './bug-report-model';

/** The words of the screen that no model holds (the Angular template's). */
export const BUGS_WORDS = {
  app: 'The Asylum',
  title: 'Report a Bug',
  intro: 'Found something broken or weird? Tell me what happened — what you tapped, what you expected, what it did instead. The more detail the better.',
  placeholder: 'e.g. Tapped Save on the program name and it didn\'t update the This Week header until I reopened the app…',
  send: 'Send Bug Report',
  sending: 'Sending…',
  attached: 'Your device and app context is attached automatically to help track it down.',
  look: 'Look',
  auto: 'Auto',
  day: 'Day',
  night: 'Night',
  lookNote: 'Auto follows your phone.',
  data: 'Your data',
  dataNote: 'Your logs live on this phone. Save a backup to keep them safe or move them to a new phone.',
  save: 'Save a backup',
  load: 'Load a backup',
  loadIt: 'Load it',
  cancel: 'Cancel',
  build: 'Build ',
} as const;
/** D289 (Mario, 2026-11-14): the beta logs into its own copy, and Bugs says so in words, until the cutover. */
export const OWN_COPY = 'Sets you log here stay in this app. Today\'s app does not see them. Loading a backup replaces everything here.';

/** The label under everything: the page's 'Build '+iaVersionLabel(IA_VERSION). */
export const buildLabel = (version: string): string => BUGS_WORDS.build + versionLabel(version);

// ── Look (theme.ts) ────────────────────────────────────────────────────────────────────────────────────────────
export type Look = 'auto' | 'day' | 'night';
export const THEME_KEY = 'ia_theme';
/** The page's getTheme: Day or Night as stored, and Auto for nothing, anything else, or a store that cannot be read. */
export function readLook(store: StateStore): Look {
  try { const v = store.get(THEME_KEY); return v === 'day' || v === 'night' ? v : 'auto'; } catch { return 'auto'; }
}
/** Which palette a look draws: its own, or the phone's under Auto (base.css: data-theme outranks the phone). */
export function lookFace(look: Look, phoneDark: boolean): 'day' | 'night' {
  return look === 'auto' ? (phoneDark ? 'night' : 'day') : look;
}

// ── Your data (data-backup.ts) ──────────────────────────────────────────────────────────────────────────────────────
/** D297: the kind this app saves under. Today's reader takes one kind, its own, and turns this one away. */
export const NEXT_KIND = 'asylum-next-backup';
const p2 = (n: number): string => String(n).padStart(2, '0');
/** The page's backupFileName under this app's kind: the phone's local date, the day the athlete saw. */
export function backupFileName(at: Date): string {
  return NEXT_KIND + '-' + at.getFullYear() + '-' + p2(at.getMonth() + 1) + '-' + p2(at.getDate()) + '.json';
}
/** The page's backupSnapshot: core's file of every ia_ key as stored, with the kind this app's own. */
export function backupSnapshot(store: StateStore, version: string, now: number): BackupFile {
  return { ...takeBackup(store, version, now), kind: NEXT_KIND };
}
/**
 * A file's text as core's reader takes it: this app's own kind handed over under today's, anything else as it is.
 * Core's reader then checks the whole file, so a file of this kind is held to every rule today's is.
 */
export function asTodays(text: string): string {
  let f: unknown;
  try { f = JSON.parse(text); } catch { return text; }
  if (!f || typeof f !== 'object' || Array.isArray(f) || (f as { kind?: unknown }).kind !== NEXT_KIND) return text;
  return JSON.stringify({ ...(f as object), kind: BACKUP_KIND });
}
/** The page's readBackup: checks a file's text and touches nothing. Today's files and this app's own are both read. */
export function readBackup(text: string): BackupRead {
  return readBackupText(asTodays(text));
}
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
/** The page's backupMessage. The day is the phone's local one, written as the page's en-US short month and day. */
export function backupMessage(r: BackupRead): string {
  if (!r.ok) return r.why === 'newer' ? 'This backup is from a newer app. Update the app first.' : 'That file is not an Asylum backup.';
  const d = new Date(r.made);
  const from = r.made && !isNaN(d.getTime()) ? 'Backup from ' + MONTHS[d.getMonth()] + ' ' + d.getDate() + '. ' : '';
  return from + r.programs + (r.programs === 1 ? ' program' : ' programs') + '. Loading it replaces everything on this phone.';
}
/**
 * The Your data block as the screen holds it (the Angular backupMsg and backupPending): the line under the buttons,
 * and the file's data while its question, Load it or Cancel, is up.
 */
export interface DataBlock { message: string; pending: BackupData | null }
export const newDataBlock = (): DataBlock => ({ message: '', pending: null });
/**
 * The Angular backupChosen: a picked file's text read, the line shown, and the question put when the file is a
 * backup. A file that could not be read at all (null) is not a backup (the page's readBackupFile). Nothing is stored.
 */
export function choose(block: DataBlock, text: string | null): void {
  const read: BackupRead = text === null ? { ok: false, why: 'bad' } : readBackup(text);
  block.pending = read.ok ? read.data : null;
  block.message = backupMessage(read);
}
/** The Angular backupCancel: the question and the line both go. */
export function cancelLoad(block: DataBlock): void {
  block.pending = null;
  block.message = '';
}

// ── The first screen ────────────────────────────────────────────────────────────────────────────────────────────
/**
 * The tab the app opens on. This Week when the store holds a program to load, as today's page opens. With none:
 * after a backup is loaded, Programs, as today's page shows its home screen after the reload; at a cold start,
 * Bugs, where a backup is loaded (the beta's own, from before it could build a program).
 */
export function firstTab(store: StateStore, afresh: boolean): 'week' | 'home' | 'bugs' {
  return storedProgram(store) ? 'week' : afresh ? 'home' : 'bugs';
}

// ── The bug report's context ────────────────────────────────────────────────────────────────────────────────────────
/** This app's bundle id, which stands where today's report carries the page's address. */
export const APP_ID = 'com.bigyerr.ironasylum.next';
/**
 * What the report carries about this app, in today's eight lines. Where today's names the browser this names the
 * app, iOS, the engine and whether Swift answered; where today's gives the page's address it gives the bundle id;
 * and it runs as an app of its own, never in a browser's tab.
 */
export function betaContext(a: {
  version: string; time: string; os: string; engine: string; swift: string; width: number; height: number;
  program: { name?: string; goal?: string; id?: string } | null; week: number | string;
}): BugContext {
  return {
    build: versionLabel(a.version), time: a.time, ua: 'IA Next; iOS ' + a.os + '; ' + a.engine + '; ' + a.swift,
    width: a.width, height: a.height, standalone: true, url: APP_ID, program: a.program, week: a.week,
  };
}
