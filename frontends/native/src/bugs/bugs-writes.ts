// What the Bugs tab writes in the Expo app (MIGRATION.md phase 3, row 7, the second session): the look's one key,
// and a backup loaded in place of everything the store holds. Each is today's own (the page's theme.ts setTheme and
// data-backup.ts saveBackup and applyBackup) over this app's own store and nothing else. A save stores no key: it
// makes the file's name and text, which the screen writes into this app's own cache and hands to the share sheet.
import { backupProgramCount } from '@ia/core/engine/state-backup.ts';
import type { BackupData } from '@ia/core/engine/state-backup.ts';
import type { StateStore } from '@ia/core/engine/state-store.ts';

import { loadChecked } from '../store/backup-import';
import { pickActive } from '../this-week/week-screen';
import { BUG_SENT_TOAST, BUG_STATUS, type BugContext, bugContextText, submitBugReport } from './bug-report-model';
import { type DataBlock, THEME_KEY, backupFileName, backupSnapshot, cancelLoad, firstTab } from './bugs-screen';

/** The bug report as the screen holds it: the text typed, whether a send is out, the line under the button. */
export interface BugForm { text: string; sending: boolean; status: { text: string; color: string } }
export const newBugForm = (): BugForm => ({ text: '', sending: false, status: { text: '', color: 'var(--muted)' } });
type Fetch = Parameters<typeof submitBugReport>[2];
/**
 * The Angular send(): nothing typed asks for it and sends nothing; otherwise the report goes out with the context
 * (sent with none when reading it fails), the button waits, and the line says how it ended. A report filed clears the
 * text and hands back the toast. `draw` is called at each change the screen shows.
 */
export async function sendBug(form: BugForm, context: () => BugContext, fetchFn: Fetch, draw: () => void): Promise<string | null> {
  const txt = form.text.trim();
  if (!txt) { form.status = BUG_STATUS.empty; draw(); return null; }
  let ctx = '';
  try { ctx = bugContextText(context()); } catch { /* the report goes with no context, as today's */ }
  form.sending = true;
  form.status = BUG_STATUS.sending;
  draw();
  const outcome = await submitBugReport(txt, ctx, fetchFn);
  form.sending = false;
  if (outcome === 'sent') form.text = '';
  form.status = BUG_STATUS[outcome];
  draw();
  return outcome === 'sent' ? BUG_SENT_TOAST : null;
}

/**
 * The app's start, as far as it happens before a screen is drawn: the tab it opens on and, when no program opens,
 * the page's init for that case (loadActiveProgram(null)): a pointer that leads to no program is removed. When a
 * program opens, This Week makes the launch as it mounts, and this writes nothing.
 */
export function firstScreen(store: StateStore, afresh: boolean): 'week' | 'home' | 'bugs' {
  const tab = firstTab(store, afresh);
  if (tab !== 'week') pickActive(store);
  return tab;
}

/** The page's setTheme: Day and Night are stored, anything else removes the key (Auto). A store that refuses is silent. */
export function setLook(store: StateStore, look: string): void {
  try { if (look === 'day' || look === 'night') store.set(THEME_KEY, look); else store.remove(THEME_KEY); } catch { /* as the page */ }
}

/** The toasts of Your data (data-backup.ts). */
export const BACKUP_TOASTS = {
  empty: 'Nothing to back up yet.',
  failed: 'Backup failed. Try again.',
  refused: 'Loading failed. Nothing changed.',
} as const;

/** A save: nothing to save and the toast that says so, or the file to hand to the share sheet. */
export type Save = { how: 'empty'; toast: string } | { how: 'file'; name: string; text: string };
/**
 * The page's saveBackup, up to the share sheet: a phone with no program saves nothing and says so; otherwise the
 * file's name, by the phone's local date, and its text. No key is read twice and none is written.
 */
export function saveBackup(store: StateStore, version: string, now: Date): Save {
  const snap = backupSnapshot(store, version, now.getTime());
  if (backupProgramCount(snap.data['ia_programs']) < 1) return { how: 'empty', toast: BACKUP_TOASTS.empty };
  return { how: 'file', name: backupFileName(now), text: JSON.stringify(snap) };
}

/**
 * The page's applyBackup, up to the reload: every ia_ key replaced by the file's, all or nothing, then checked key by
 * key against the file (D287). Refused, or with a key that does not match, the store holds what it held before and
 * the toast is today's. Loaded, the app starts afresh, as today's page reloads.
 */
export function applyBackup(store: StateStore, data: BackupData): { ok: true } | { ok: false; toast: string } {
  return loadChecked(store, data).ok ? { ok: true } : { ok: false, toast: BACKUP_TOASTS.refused };
}

/**
 * The Angular backupLoadIt: the waiting file loaded, and the app to start afresh with the line and the question
 * still up, as today's page leaves them until its reload. A refused load speaks, then the block is cleared; with
 * nothing waiting the block is cleared and nothing else happens.
 */
export function loadIt(block: DataBlock, store: StateStore): { afresh: boolean; toast: string | null } {
  let toast: string | null = null;
  if (block.pending) {
    const r = applyBackup(store, block.pending);
    if (r.ok) return { afresh: true, toast: null };
    toast = r.toast;
  }
  cancelLoad(block);
  return { afresh: false, toast };
}
