// native-bugs-tab: when one rule of the Expo app's Bugs tab is broken, which test files go red?
// Read-only on this checkout (measure). Each break changes one rule in a copy of the tree: a rule of the look, the
// file read, the block or the first screen (frontends/native/src/bugs/bugs-screen.ts), of a write (bugs-writes.ts),
// of the checked load (store/backup-import.ts), of a file that is today's own (bug-report-model.ts), or of the
// screens' drawing and wiring (Bugs.tsx, rows.tsx, EngineCheck.tsx, App.tsx), or of what the app keeps of the engine
// check while another tab is open (engine-check-state.ts). The fast files are run on each, and
// the ten program sweep only on a break they let through; the files and tests that turn red are counted. A break no
// file turns red on is a rule no test holds.
//
// The page is not broken: these are the Expo app's own files, so the tests that hold the beta against today's page
// see every break as a difference between the two.
//
// Usage: node tools/tree-at.mjs --working <scratch>/tree     (a copy of this checkout, the tests' packages alone)
//        node tests/measure/native-bugs-tab_breaks.mjs <scratch>/tree [--only <text in a break's name>]
//        (writes tests/measure/native-bugs-tab_breaks.md here; each file of the copy is put back after its break)
// It runs in parts from its first run, each in a copy of its own, at once:
//        node tests/measure/native-bugs-tab_breaks.mjs <scratch>/tree1 --part 0/4 --json <scratch>/part0.json
//        (and 1/4, 2/4, 3/4 on three more copies), then
//        node tests/measure/native-bugs-tab_breaks.mjs --merge <scratch>/part0.json <scratch>/part1.json ...
// A break run again alone (--only <text> --json <file>) is merged after the parts and replaces its earlier row.
// Before a list written in an earlier session runs again, it is read against the code as it stands, with no copy:
//        node tests/measure/native-bugs-tab_breaks.mjs --check
//        (names every break whose text is not in its file once; exit 1 when there is one)
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const arg = (name) => (process.argv.indexOf(name) > 0 ? process.argv[process.argv.indexOf(name) + 1] : null);
const merging = process.argv[2] === '--merge';
const checking = process.argv[2] === '--check';
const tree = !merging && !checking && process.argv[2] ? resolve(process.argv[2]) : null;
if (!tree && !merging && !checking) { console.error('usage: node tests/measure/native-bugs-tab_breaks.mjs <a tools/tree-at.mjs --working copy> [--only <text>] [--part k/n --json <file>] | --merge <files> | --check'); process.exit(2); }
const only = arg('--only');
const part = arg('--part') ? arg('--part').split('/').map(Number) : null;
const TESTS = tree ? join(tree, 'tests') : '';
const FAST = ['unit/native-bugs-tab.test.ts', 'integration/native-bugs-tab.test.ts', 'unit/native-shell.test.ts', 'unit/native-backup-import.test.ts'];
const SLOW = ['sweeps/native-bugs-tab.test.ts'];
const N = 'frontends/native/src/';
const SC = N + 'bugs/bugs-screen.ts', WR = N + 'bugs/bugs-writes.ts', MODEL = N + 'bugs/bug-report-model.ts', IMP = N + 'store/backup-import.ts';
const BUGS = N + 'bugs/Bugs.tsx', ROWS = N + 'bugs/rows.tsx', ENGINE = N + 'EngineCheck.tsx', APP = N + 'App.tsx', ES = N + 'engine-check-state.ts';

const READ_LOOK = "try { const v = store.get(THEME_KEY); return v === 'day' || v === 'night' ? v : 'auto'; } catch { return 'auto'; }";
const FACE = "return look === 'auto' ? (phoneDark ? 'night' : 'day') : look;";
const NAME = "return NEXT_KIND + '-' + at.getFullYear() + '-' + p2(at.getMonth() + 1) + '-' + p2(at.getDate()) + '.json';";
const SNAP = "return { ...takeBackup(store, version, now), kind: NEXT_KIND };";
const OWN = "if (!f || typeof f !== 'object' || Array.isArray(f) || (f as { kind?: unknown }).kind !== NEXT_KIND) return text;";
const AS = "return JSON.stringify({ ...(f as object), kind: BACKUP_KIND });";
const MSG_BAD = "if (!r.ok) return r.why === 'newer' ? 'This backup is from a newer app. Update the app first.' : 'That file is not an Asylum backup.';";
const MSG_FROM = "const from = r.made && !isNaN(d.getTime()) ? 'Backup from ' + MONTHS[d.getMonth()] + ' ' + d.getDate() + '. ' : '';";
const MSG = "return from + r.programs + (r.programs === 1 ? ' program' : ' programs') + '. Loading it replaces everything on this phone.';";
const CHOOSE_READ = "const read: BackupRead = text === null ? { ok: false, why: 'bad' } : readBackup(text);";
const CHOOSE_PEND = "  block.pending = read.ok ? read.data : null;\n  block.message = backupMessage(read);";
const CANCEL = "  block.pending = null;\n  block.message = '';";
const FIRST = "return storedProgram(store) ? 'week' : afresh ? 'home' : 'bugs';";
const CTX = "build: versionLabel(a.version), time: a.time, ua: 'IA Next; iOS ' + a.os + '; ' + a.engine + '; ' + a.swift,";
const CTX2 = "width: a.width, height: a.height, standalone: true, url: APP_ID, program: a.program, week: a.week,";
const FIRST_SCREEN = "  if (tab !== 'week') pickActive(store);";
const SET_LOOK = "try { if (look === 'day' || look === 'night') store.set(THEME_KEY, look); else store.remove(THEME_KEY); } catch { /* as the page */ }";
const SEND_EMPTY = "if (!txt) { form.status = BUG_STATUS.empty; draw(); return null; }";
const SEND_CTX = "try { ctx = bugContextText(context()); } catch { /* the report goes with no context, as today's */ }";
const SEND_OUT = "  form.sending = true;\n  form.status = BUG_STATUS.sending;\n  draw();";
const SEND_END = "  form.sending = false;\n  if (outcome === 'sent') form.text = '';\n  form.status = BUG_STATUS[outcome];\n  draw();";
const SEND_TOAST = "return outcome === 'sent' ? BUG_SENT_TOAST : null;";
const SAVE_SNAP = "const snap = backupSnapshot(store, version, now.getTime());";
const SAVE_EMPTY = "if (backupProgramCount(snap.data['ia_programs']) < 1) return { how: 'empty', toast: BACKUP_TOASTS.empty };";
const SAVE_FILE = "return { how: 'file', name: backupFileName(now), text: JSON.stringify(snap) };";
const APPLY = "return loadChecked(store, data).ok ? { ok: true } : { ok: false, toast: BACKUP_TOASTS.refused };";
const LOADIT = "    const r = applyBackup(store, block.pending);\n    if (r.ok) return { afresh: true, toast: null };\n    toast = r.toast;";
const LOADIT_END = "  cancelLoad(block);\n  return { afresh: false, toast };";
const CHECKED = "  if (!loadBackupInto(store, data)) return { ok: false, why: 'refused', misses: [] };\n  const found = misses(store, data);\n  if (found.length) {\n    loadBackupInto(store, before);\n    return { ok: false, why: 'mismatch', misses: found };\n  }\n  return { ok: true };";

const BREAKS = [
  // ── Look ──
  [SC, "the look read takes any stored word", READ_LOOK, "try { const v = store.get(THEME_KEY); return (v || 'auto') as Look; } catch { return 'auto'; }"],
  [SC, "the look read never reads Day", READ_LOOK, "try { const v = store.get(THEME_KEY); return v === 'night' ? v : 'auto'; } catch { return 'auto'; }"],
  [SC, "the look read never reads Night", READ_LOOK, "try { const v = store.get(THEME_KEY); return v === 'day' ? v : 'auto'; } catch { return 'auto'; }"],
  [SC, "the look read throws on a store that cannot be read", READ_LOOK, "const v = store.get(THEME_KEY); return v === 'day' || v === 'night' ? v : 'auto';"],
  [SC, "the look is stored under another key", "export const THEME_KEY = 'ia_theme';", "export const THEME_KEY = 'ia_look';"],
  [SC, "Auto draws day on a dark phone", FACE, "return look === 'auto' ? 'day' : look;"],
  [SC, "Auto draws night on a light phone", FACE, "return look === 'auto' ? 'night' : look;"],
  [SC, "the phone outranks a stored look", FACE, "return phoneDark ? 'night' : look === 'auto' ? 'day' : look;"],
  [WR, "a tap stores Auto as a word", SET_LOOK, "try { store.set(THEME_KEY, look); } catch { /* as the page */ }"],
  [WR, "a tap on Day removes the key", SET_LOOK, "try { if (look === 'night') store.set(THEME_KEY, look); else store.remove(THEME_KEY); } catch { /* as the page */ }"],
  [WR, "a tap on Auto leaves the key", SET_LOOK, "try { if (look === 'day' || look === 'night') store.set(THEME_KEY, look); } catch { /* as the page */ }"],
  [WR, "a store that refuses the look throws", SET_LOOK, "if (look === 'day' || look === 'night') store.set(THEME_KEY, look); else store.remove(THEME_KEY);"],
  // ── The file saved ──
  [SC, "the beta saves under today's kind", "export const NEXT_KIND = 'asylum-next-backup';", "export const NEXT_KIND = 'asylum-backup';"],
  [SC, "the beta's kind is another word", "export const NEXT_KIND = 'asylum-next-backup';", "export const NEXT_KIND = 'asylum-next';"],
  [SC, "the file's name carries the day in UTC", NAME, "return NEXT_KIND + '-' + at.toISOString().slice(0, 10) + '.json';"],
  [SC, "the file's name does not pad its month", NAME, "return NEXT_KIND + '-' + at.getFullYear() + '-' + (at.getMonth() + 1) + '-' + p2(at.getDate()) + '.json';"],
  [SC, "the file's name counts months from zero", NAME, "return NEXT_KIND + '-' + at.getFullYear() + '-' + p2(at.getMonth()) + '-' + p2(at.getDate()) + '.json';"],
  [SC, "the file's name is today's", NAME, "return 'asylum-backup-' + at.getFullYear() + '-' + p2(at.getMonth() + 1) + '-' + p2(at.getDate()) + '.json';"],
  [SC, "the snapshot keeps core's kind", SNAP, "return takeBackup(store, version, now);"],
  [SC, "the snapshot puts its kind last", SNAP, "const { kind: _k, ...rest } = takeBackup(store, version, now); return { ...rest, kind: NEXT_KIND } as BackupFile;"],
  [WR, "a save reads the clock's zero for its instant", SAVE_SNAP, "const snap = backupSnapshot(store, version, 0);"],
  [WR, "a phone with no program saves a file", SAVE_EMPTY, ""],
  [WR, "a phone with one program saves nothing", SAVE_EMPTY, "if (backupProgramCount(snap.data['ia_programs']) < 2) return { how: 'empty', toast: BACKUP_TOASTS.empty };"],
  [WR, "nothing to save says the save failed", SAVE_EMPTY, "if (backupProgramCount(snap.data['ia_programs']) < 1) return { how: 'empty', toast: BACKUP_TOASTS.failed };"],
  [WR, "the saved text is its data alone", SAVE_FILE, "return { how: 'file', name: backupFileName(now), text: JSON.stringify(snap.data) };"],
  [WR, "the saved text is indented", SAVE_FILE, "return { how: 'file', name: backupFileName(now), text: JSON.stringify(snap, null, 1) };"],
  [WR, "the toast for nothing to save is another", "empty: 'Nothing to back up yet.',", "empty: 'Nothing to back up.',"],
  [WR, "the toast for a failed share is another", "failed: 'Backup failed. Try again.',", "failed: 'Backup failed.',"],
  [WR, "the toast for a refused load is another", "refused: 'Loading failed. Nothing changed.',", "refused: 'Loading failed.',"],
  // ── The file read ──
  [SC, "the beta does not read its own kind", OWN, "return text;"],
  [SC, "every kind is read as today's", OWN, "if (!f || typeof f !== 'object' || Array.isArray(f)) return text;"],
  // Not a break: the list check alone taken out. A list read from JSON holds no kind, so the kind's own check
  // turns it away too; the code keeps that rule twice, and the first run of this list let it through.
  [SC, "a file that is null stops the read", OWN, "if (typeof f !== 'object' || Array.isArray(f) || (f as { kind?: unknown }).kind !== NEXT_KIND) return text;"],
  [SC, "the beta's own file is handed on without its kind changed", AS, "return JSON.stringify({ ...(f as object) });"],
  [SC, "the beta's own file is handed on as format 1 whatever its format", AS, "return JSON.stringify({ ...(f as object), kind: BACKUP_KIND, format: 1 });"],
  [SC, "the read skips core's reader for its own kind", "return readBackupText(asTodays(text));", "return readBackupText(text);"],
  [SC, "a newer file is called not a backup", MSG_BAD, "if (!r.ok) return 'That file is not an Asylum backup.';"],
  [SC, "a file that is not a backup is called newer", MSG_BAD, "if (!r.ok) return 'This backup is from a newer app. Update the app first.';"],
  [SC, "the line gives the day in UTC", MSG_FROM, "const from = r.made && !isNaN(d.getTime()) ? 'Backup from ' + MONTHS[d.getUTCMonth()] + ' ' + d.getUTCDate() + '. ' : '';"],
  // Not a break: the empty instant's check alone taken out. An empty instant is no date, so the date's own check
  // drops the day too; the page keeps that rule twice, and the first run of this list let it through.
  [SC, "the line gives the month as a number", MSG_FROM, "const from = r.made && !isNaN(d.getTime()) ? 'Backup from ' + (d.getMonth() + 1) + '/' + d.getDate() + '. ' : '';"],
  [SC, "the line names a day that is no date", MSG_FROM, "const from = r.made ? 'Backup from ' + MONTHS[d.getMonth()] + ' ' + d.getDate() + '. ' : '';"],
  [SC, "the line never names the day", MSG_FROM, "const from = '';"],
  [SC, "the months are a month late", "const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];", "const MONTHS = ['Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'];"],
  [SC, "September is written Sept", "'Aug', 'Sep', 'Oct'", "'Aug', 'Sept', 'Oct'"],
  [SC, "one program reads programs", MSG, "return from + r.programs + ' programs' + '. Loading it replaces everything on this phone.';"],
  [SC, "no program reads program", MSG, "return from + r.programs + (r.programs <= 1 ? ' program' : ' programs') + '. Loading it replaces everything on this phone.';"],
  [SC, "the line says everything here", MSG, "return from + r.programs + (r.programs === 1 ? ' program' : ' programs') + '. Loading it replaces everything here.';"],
  // ── The block ──
  // Not a break: a file that cannot be read handed to the reader as the word null. The reader turns that away as it
  // turns away any text that is no file, so the line is the same; the first run of this list let it through.
  [SC, "a file that cannot be read shows no line", CHOOSE_READ, "if (text === null) return;\n  const read: BackupRead = readBackup(text);"],
  [SC, "a file that cannot be read is called newer", CHOOSE_READ, "const read: BackupRead = text === null ? { ok: false, why: 'newer' } : readBackup(text);"],
  [SC, "a file turned away leaves the waiting one", CHOOSE_PEND, "  if (read.ok) block.pending = read.data;\n  block.message = backupMessage(read);"],
  [SC, "a file picked shows no line", CHOOSE_PEND, "  block.pending = read.ok ? read.data : null;"],
  [SC, "Cancel leaves the line", CANCEL, "  block.pending = null;"],
  [SC, "Cancel leaves the question", CANCEL, "  block.message = '';"],
  [WR, "Load it clears the block before the app starts afresh", LOADIT, "    const r = applyBackup(store, block.pending);\n    if (r.ok) { cancelLoad(block); return { afresh: true, toast: null }; }\n    toast = r.toast;"],
  [WR, "a refused load starts the app afresh", LOADIT, "    const r = applyBackup(store, block.pending);\n    if (r.ok || !r.ok) return { afresh: true, toast: null };\n    toast = r.toast;"],
  [WR, "a refused load is silent", LOADIT, "    const r = applyBackup(store, block.pending);\n    if (r.ok) return { afresh: true, toast: null };"],
  [WR, "a refused load leaves the question up", LOADIT_END, "  if (!toast) cancelLoad(block);\n  return { afresh: false, toast };"],
  [WR, "Load it with nothing waiting leaves the line", LOADIT_END, "  if (toast) cancelLoad(block);\n  return { afresh: false, toast };"],
  [WR, "Load it with nothing waiting starts the app afresh", LOADIT_END, "  cancelLoad(block);\n  return { afresh: !toast, toast };"],
  [WR, "a load that did not take is called loaded", APPLY, "loadChecked(store, data); return { ok: true };"],
  [WR, "a load that took is called refused", APPLY, "return loadChecked(store, data).ok ? { ok: false, toast: BACKUP_TOASTS.refused } : { ok: true };"],
  // ── The checked load (D287) ──
  [IMP, "a refused write is called loaded", CHECKED, CHECKED.replace("if (!loadBackupInto(store, data)) return { ok: false, why: 'refused', misses: [] };", "loadBackupInto(store, data);")],
  [IMP, "a key that does not match is let through", CHECKED, CHECKED.replace("if (found.length) {", "if (found.length > 99) {")],
  [IMP, "a mismatch keeps what was loaded", CHECKED, CHECKED.replace("    loadBackupInto(store, before);\n", "")],
  [IMP, "a mismatch is called a refusal", CHECKED, CHECKED.replace("why: 'mismatch'", "why: 'refused'")],
  [IMP, "the load is never checked", CHECKED, CHECKED.replace("const found = misses(store, data);", "const found: string[] = [];")],
  // ── The first screen ──
  [SC, "a start with a program opens Programs", FIRST, "return afresh ? 'home' : storedProgram(store) ? 'week' : 'bugs';"],
  [SC, "a start with no program after a load opens Bugs", FIRST, "return storedProgram(store) ? 'week' : 'bugs';"],
  [SC, "a cold start with no program opens Programs", FIRST, "return storedProgram(store) ? 'week' : 'home';"],
  [SC, "a start opens This Week with no program", FIRST, "return 'week';"],
  [WR, "a start that opens no program leaves a pointer that leads nowhere", FIRST_SCREEN, ""],
  [WR, "a start that opens a program writes its pointer before This Week mounts", FIRST_SCREEN, "  pickActive(store);"],
  [WR, "only a start after a load clears the pointer", FIRST_SCREEN, "  if (tab === 'home') pickActive(store);"],
  // ── The bug report ──
  [WR, "nothing typed sends a report", SEND_EMPTY, ""],
  [WR, "nothing typed is not drawn", SEND_EMPTY, "if (!txt) { form.status = BUG_STATUS.empty; return null; }"],
  [WR, "spaces alone are sent", "const txt = form.text.trim();", "const txt = form.text;"],
  [WR, "nothing typed shows no line", SEND_EMPTY, "if (!txt) { draw(); return null; }"],
  [WR, "a context that cannot be read stops the send", SEND_CTX, "ctx = bugContextText(context());"],
  [WR, "the report goes with no context", SEND_CTX, ""],
  [WR, "the button does not wait while the report is out", SEND_OUT, "  form.status = BUG_STATUS.sending;\n  draw();"],
  [WR, "the wait is not drawn", SEND_OUT, "  form.sending = true;\n  form.status = BUG_STATUS.sending;"],
  [WR, "the old line stays while the report is out", SEND_OUT, "  form.sending = true;\n  draw();"],
  [WR, "the button waits after the report came back", SEND_END, "  if (outcome === 'sent') form.text = '';\n  form.status = BUG_STATUS[outcome];\n  draw();"],
  [WR, "a report filed leaves its text", SEND_END, "  form.sending = false;\n  form.status = BUG_STATUS[outcome];\n  draw();"],
  [WR, "a report that failed loses its text", SEND_END, "  form.sending = false;\n  form.text = '';\n  form.status = BUG_STATUS[outcome];\n  draw();"],
  [WR, "the line after a send is not drawn", SEND_END, "  form.sending = false;\n  if (outcome === 'sent') form.text = '';\n  form.status = BUG_STATUS[outcome];"],
  [WR, "every send says sent", SEND_END, "  form.sending = false;\n  if (outcome === 'sent') form.text = '';\n  form.status = BUG_STATUS.sent;\n  draw();"],
  [WR, "a report filed raises no toast", SEND_TOAST, "return null;"],
  [WR, "a report that failed raises the toast", SEND_TOAST, "return BUG_SENT_TOAST;"],
  [SC, "the context's build carries no v", CTX, "build: a.version, time: a.time, ua: 'IA Next; iOS ' + a.os + '; ' + a.engine + '; ' + a.swift,"],
  [SC, "the context does not name iOS", CTX, "build: versionLabel(a.version), time: a.time, ua: 'IA Next; ' + a.engine + '; ' + a.swift,"],
  [SC, "the context does not say whether Swift answered", CTX, "build: versionLabel(a.version), time: a.time, ua: 'IA Next; iOS ' + a.os + '; ' + a.engine,"],
  [SC, "the context says it runs in a browser's tab", CTX2, "width: a.width, height: a.height, standalone: false, url: APP_ID, program: a.program, week: a.week,"],
  [SC, "the context names no program", CTX2, "width: a.width, height: a.height, standalone: true, url: APP_ID, program: null, week: a.week,"],
  [SC, "the context swaps the window's sides", CTX2, "width: a.height, height: a.width, standalone: true, url: APP_ID, program: a.program, week: a.week,"],
  [SC, "the context's week is always the first", CTX2, "width: a.width, height: a.height, standalone: true, url: APP_ID, program: a.program, week: 1,"],
  [SC, "the app's id is today's", "export const APP_ID = 'com.bigyerr.ironasylum.next';", "export const APP_ID = 'com.bigyerr.ironasylum';"],
  [MODEL, "the model's report goes to another address", "export const BUG_FORM_URL = 'https://api.web3forms.com/submit';", "export const BUG_FORM_URL = 'https://api.web3forms.com/send';"],
  [MODEL, "the model calls a refusal sent", "return r.ok && j && (j as { success?: unknown }).success ? 'sent' : 'failed';", "return r.ok ? 'sent' : 'failed';"],
  [MODEL, "the model's subject is another", "subject: 'The Asylum — Bug Report'", "subject: 'The Asylum Next — Bug Report'"],
  [MODEL, "the model's line for a network error is another", "network: { text: 'Network error — try again.', color: 'var(--red)' },", "network: { text: 'Network error.', color: 'var(--red)' },"],
  // ── The words ──
  [SC, "the title is Bugs", "title: 'Report a Bug',", "title: 'Bugs',"],
  [SC, "the button says Send", "send: 'Send Bug Report',", "send: 'Send',"],
  [SC, "the wait says Sending with three dots", "sending: 'Sending…',", "sending: 'Sending...',"],
  [SC, "the look's note is another", "lookNote: 'Auto follows your phone.',", "lookNote: 'Auto follows the phone.',"],
  [SC, "Your data's note is another", "dataNote: 'Your logs live on this phone. Save a backup to keep them safe or move them to a new phone.',", "dataNote: 'Your logs live in this app. Save a backup to keep them safe.',"],
  [SC, "Load it says Load", "loadIt: 'Load it',", "loadIt: 'Load',"],
  [SC, "D289's words are gone", "export const OWN_COPY = 'Sets you log here stay in this app. Today\\'s app does not see them. Loading a backup replaces everything here.';", "export const OWN_COPY = '';"],
  [SC, "the build's label carries no v", "export const buildLabel = (version: string): string => BUGS_WORDS.build + versionLabel(version);", "export const buildLabel = (version: string): string => BUGS_WORDS.build + version;"],
  // ── The screen: the bug report ──
  [BUGS, "the report's button takes a tap while a report is out", "disabled={form.sending} onPress={send}", "onPress={send}"],
  [BUGS, "a second tap while a report is out sends again", "    if (form.sending) return;\n", ""],
  [BUGS, "the button keeps its word while it waits", "{form.sending ? W.sending : W.send}", "{W.send}"],
  [BUGS, "the button does not dim while it waits", "opacity: form.sending ? 0.6 : 1 }]}", "opacity: 1 }]}"],
  [BUGS, "every line under the button is drawn muted", "const tint = form.status.color === 'var(--green)' ? p.green : form.status.color === 'var(--red)' ? p.red : p.muted;", "const tint = p.muted;"],
  [BUGS, "a filed report's line is drawn red", "form.status.color === 'var(--green)' ? p.green :", "form.status.color === 'var(--green)' ? p.red :"],
  [BUGS, "the report's toast is not spoken", "    if (toast) say(toast);\n", ""],
  [BUGS, "the field does not hold what is typed", "onChangeText={(t) => { form.text = t; draw(); }}", "onChangeText={() => {}}"],
  [BUGS, "the field shows no hint", "placeholder={W.placeholder}", "placeholder={''}"],
  [BUGS, "the report is not told whether Swift answered", "swift: swiftLine(SWIFT_ANSWER),", "swift: '',"],
  [BUGS, "the report is told the engine check's version", "version: VERSION, time: new Date().toISOString()", "version: '0', time: new Date().toISOString()"],
  [BUGS, "a drag does not close the keys", " keyboardDismissMode=\"on-drag\"", ""],
  // ── The screen: Your data ──
  [BUGS, "a save with nothing to save says nothing", "if (r.how === 'empty') { say(r.toast); return; }", "if (r.how === 'empty') return;"],
  [BUGS, "the file is written outside the cache", "new File(Paths.cache, r.name)", "new File(Paths.document, r.name)"],
  [BUGS, "the file is shared before it is written", "      await file.write(r.text);\n", ""],
  [BUGS, "a failed share is silent", "      say(BACKUP_TOASTS.failed);\n", ""],
  [BUGS, "the share sheet is handed the file's text", "await Share.share({ url: file.uri });", "await Share.share({ message: r.text });"],
  [BUGS, "the picker hands over the file itself", "copyToCacheDirectory: true", "copyToCacheDirectory: false"],
  [BUGS, "a picker closed with no file shows a line", "if (got.canceled || !got.assets[0]) return;", "if (got.canceled || !got.assets[0]) { choose(block, null); draw(); return; }"],
  [BUGS, "a picked file is not drawn", "      choose(block, text);\n      draw();", "      choose(block, text);"],
  [BUGS, "a load that takes stays on Bugs", "if (r.afresh) onAfresh(); else draw();", "draw();"],
  [BUGS, "a refused load's toast is not spoken", "    if (r.toast) say(r.toast);\n", ""],
  [BUGS, "the question is up with no file waiting", "{block.pending && (", "{(block.pending || true) && ("],
  [BUGS, "the line under Your data is not drawn", "<Note id=\"backup-msg\" palette={p}>{block.message}</Note>", "<Note id=\"backup-msg\" palette={p}>{''}</Note>"],
  [BUGS, "D289's words are not drawn", "          <Note id=\"backup-own-copy\" palette={p}>{OWN_COPY}</Note>\n", ""],
  [BUGS, "Cancel loads the file", "<Opt id=\"backup-cancel\" label={W.cancel} palette={p} onPress={cancel} />", "<Opt id=\"backup-cancel\" label={W.cancel} palette={p} onPress={tapLoadIt} />"],
  // ── The screen: Look, the label, the order, the sizes ──
  [BUGS, "Day is drawn on under every look", "on={look === 'day'}", "on"],
  [BUGS, "Night's button sets Day", "onPress={() => onLook('night')}", "onPress={() => onLook('day')}"],
  [BUGS, "Auto is never drawn on", "on={look === 'auto'}", "on={false}"],
  [BUGS, "the build's label is the bare version", "{buildLabel(VERSION)}</Text>", "{VERSION}</Text>"],
  [BUGS, "Engine stands above Look", "        <Row id=\"look-row\" label={W.look} palette={p}>", "        <EngineCheck palette={p} state={engine} />\n        <Row id=\"look-row\" label={W.look} palette={p}>"],
  [BUGS, "the body's parts stand 12 apart", "body: { paddingTop: 16, paddingHorizontal: 20, gap: 14 },", "body: { paddingTop: 16, paddingHorizontal: 20, gap: 12 },"],
  [BUGS, "the field is a line high", "lineHeight: 24, minHeight: 160,", "lineHeight: 24, minHeight: 44,"],
  [BUGS, "the field's corners are square", "borderWidth: 1, borderRadius: 12, paddingVertical: 12,", "borderWidth: 1, borderRadius: 4, paddingVertical: 12,"],
  [BUGS, "the field keeps its edge when it is in use", "borderColor: focused ? 'rgba(' + p.inkRgb + ',0.55)' : p.border2,", "borderColor: p.border2,"],
  [BUGS, "the send button is square", "send: { borderRadius: 999, padding: 14, alignItems: 'center' },", "send: { borderRadius: 4, padding: 14, alignItems: 'center' },"],
  [BUGS, "the intro's line is the CSS's fraction", "intro: { fontFamily: TEXT, fontSize: 13, lineHeight: 20 },", "intro: { fontFamily: TEXT, fontSize: 13, lineHeight: 20.8 },"],
  [BUGS, "the context note's line is the CSS's fraction", "attached: { fontFamily: TEXT, fontSize: 11, lineHeight: 16, opacity: 0.8 },", "attached: { fontFamily: TEXT, fontSize: 11, lineHeight: 16.5, opacity: 0.8 },"],
  [BUGS, "the line under the button takes no room when empty", "lineHeight: 19, minHeight: 20 },", "lineHeight: 19 },"],
  [BUGS, "the build's label is in the system's monospace", "version: { fontFamily: 'Menlo',", "version: { fontFamily: 'ui-monospace',"],
  [BUGS, "the build's label stands 2 higher", "textAlign: 'center', paddingTop: 6 },", "textAlign: 'center', paddingTop: 4 },"],
  [BUGS, "the screen's name stands a pixel low", "lineHeight: 42, marginTop: 4.5, marginBottom: -2.9 },", "lineHeight: 42, marginTop: 4.9, marginBottom: -2.9 },"],
  [BUGS, "the top bar stands still while the body scrolls", "      <View testID=\"bugs-body\" style={s.body}>\n", "      </ScrollView><ScrollView><View testID=\"bugs-body\" style={s.body}>\n"],
  [BUGS, "the foot leaves no room for the tab bar", "paddingBottom: 40 + 97 + insets.bottom", "paddingBottom: 40"],
  // ── The rows ──
  [ROWS, "the chosen look is drawn as the others", "{ borderColor: on ? p.accent : p.border2, backgroundColor: on ? p.accent : 'transparent' }", "{ borderColor: p.border2, backgroundColor: 'transparent' }"],
  [ROWS, "the chosen look's word is muted", "{ color: on ? p.onInk : p.muted }", "{ color: p.muted }"],
  [ROWS, "an empty note keeps a line's height", "  if (!children) return <View testID={id} style={s.none} />;\n", ""],
  [ROWS, "a row has no rule above it", "row: { gap: 8, borderTopWidth: 1, paddingTop: 16, marginTop: 6 },", "row: { gap: 8, paddingTop: 16, marginTop: 6 },"],
  [ROWS, "a row's rule is the second border's colour", "{ borderTopColor: p.border }", "{ borderTopColor: p.border2 }"],
  [ROWS, "the pills are squares", "borderWidth: 1, borderRadius: 999, paddingVertical: 11 },", "borderWidth: 1, borderRadius: 4, paddingVertical: 11 },"],
  [ROWS, "a pill is 2 points taller", "optText: { fontFamily: DISPLAY, fontSize: 13, fontWeight: '700', paddingBottom: 1.5 },", "optText: { fontFamily: DISPLAY, fontSize: 13, fontWeight: '700', paddingBottom: 3.5 },"],
  [ROWS, "the label is at the sheet's 11", "label: { fontFamily: DISPLAY, fontSize: 13, fontWeight: '700', paddingBottom: 1.5 },", "label: { fontFamily: DISPLAY, fontSize: 11, fontWeight: '700', paddingBottom: 1.5 },"],
  [ROWS, "the note's words sit where iOS puts them", "lineHeight: 18, marginTop: -0.7, marginBottom: 0.35 },", "lineHeight: 18 },"],
  [ROWS, "the pills stand 4 apart", "seg: { flexDirection: 'row', gap: 8 },", "seg: { flexDirection: 'row', gap: 4 },"],
  // ── The Engine row ──
  [ENGINE, "the Engine row's label is another", "label={'Engine'}", "label={'Engine check'}"],
  [ENGINE, "the check's button never says Checking", "label={running ? 'Checking' : 'Run the check'}", "label={'Run the check'}"],
  [ENGINE, "the check's line is not drawn", "<Note id=\"engine-check-line\" palette={p}>{line}</Note>", "<Note id=\"engine-check-line\" palette={p}>{''}</Note>"],
  [ENGINE, "the check's note is another", "{'Builds the tested programs on this phone. Each one must match.'}", "{'Builds the tested programs.'}"],
  // ── The app ──
  [APP, "the app draws by the phone alone", "const p = lookFace(look, useColorScheme() === 'dark') === 'night' ? NIGHT : DAY;", "const p = useColorScheme() === 'dark' ? NIGHT : DAY;"],
  [APP, "iOS is told Night under Auto", "Appearance.setColorScheme(look === 'auto' ? 'unspecified' : look === 'night' ? 'dark' : 'light');", "Appearance.setColorScheme(look === 'day' ? 'light' : 'dark');"],
  [APP, "iOS is told the look once, at the start", "}, [look]);", "}, []);"],
  [APP, "a look tapped is not read back", "onLook={(l) => { setLook(phoneStore, l); setLookNow(readLook(phoneStore)); }}", "onLook={(l) => { setLook(phoneStore, l); }}"],
  [APP, "a look tapped is not stored", "onLook={(l) => { setLook(phoneStore, l); setLookNow(readLook(phoneStore)); }}", "onLook={(l) => { setLookNow(l); }}"],
  [APP, "the look at a start is Auto whatever is stored", "const [look, setLookNow] = useState<Look>(() => readLook(phoneStore));", "const [look, setLookNow] = useState<Look>('auto');"],
  [APP, "the shell is not built again after a load", "<Shell key={'boot' + boots} afresh={boots > 0}", "<Shell afresh={boots > 0}"],
  [APP, "a start after a load is a cold start", "afresh={boots > 0}", "afresh={false}"],
  [APP, "Load it does not reach the app", "onAfresh={() => setBoots((n) => n + 1)}", "onAfresh={() => {}}"],
  [APP, "the first tab is read without the start's write", "useState<Tab>(() => firstScreen(phoneStore, afresh));", "useState<Tab>(() => (afresh ? 'home' : 'bugs'));"],
  [APP, "the report is told the first week", "week: hand.own || 1 })} />", "week: 1 })} />"],
  [APP, "the report is told no program", "program: hand.prog as { name?: string; goal?: string; id?: string } | null, week:", "program: null, week:"],
  // ── What the tab keeps while another tab is open ──
  [APP, "the tab's state is made anew at each draw of the app", "const bugs = useRef(newBugsState()).current;", "const bugs = newBugsState();"],
  [BUGS, "the report typed is the screen's own, lost with a visit to another tab", "const { form, block, engine } = state;", "const { block, engine } = state;\n  const form = useRef(newBugForm()).current;"],
  [BUGS, "the waiting file is the screen's own", "const { form, block, engine } = state;", "const { form, engine } = state;\n  const block = useRef(newDataBlock()).current;"],
  [BUGS, "the engine check is the screen's own", "<EngineCheck palette={p} state={engine} />", "<EngineCheck palette={p} state={newEngineState()} />"],
  [BUGS, "the tab's state shares one report between two makes", "export const newBugsState = (): BugsState => ({ form: newBugForm(), block: newDataBlock(), engine: newEngineState() });", "const ONE_FORM = newBugForm();\nexport const newBugsState = (): BugsState => ({ form: ONE_FORM, block: newDataBlock(), engine: newEngineState() });"],
  [ENGINE, "the row never hears a line", "    state.listen = () => setDraws((n) => n + 1);\n", ""],
  [ENGINE, "the row goes on listening once it is gone", "    return () => { state.listen = null; };\n", ""],
  [ENGINE, "the row draws a line of its own", "const { line, running } = state;", "const line = '', running = false;"],
  [ENGINE, "the row's button starts nothing", "const start = (): void => startEngineCheck(state);", "const start = (): void => {};"],
  [ES, "a second tap starts a second run", "  if (state.run && state.run.endedAt === null) return;\n", ""],
  [ES, "a run that ended blocks the next", "  if (state.run && state.run.endedAt === null) return;\n", "  if (state.run) return;\n"],
  [ES, "the screen is not told when a run starts", "  state.line = engineCheckLine(run);\n  if (state.listen) state.listen();\n  const step", "  state.line = engineCheckLine(run);\n  const step"],
  [ES, "the screen is not told a slice's line", "    else setTimeout(step, 0);\n    if (state.listen) state.listen();", "    else setTimeout(step, 0);"],
  [ES, "the check stops with no screen up", "    else setTimeout(step, 0);", "    else if (state.listen) setTimeout(step, 0);"],
  [ES, "a run that ended still reads as running", "    if (done) state.running = false;\n    else setTimeout(step, 0);", "    if (!done) setTimeout(step, 0);"],
  [ES, "the line kept is the start's", "    state.line = engineCheckLine(run);\n    if (done)", "    if (done)"],
  [ES, "a run starts with no line", "  state.running = true;\n  state.line = engineCheckLine(run);", "  state.running = true;"],
  [ES, "the check times its slices on the date", "engineCheckSlice(run, build, () => performance.now());", "engineCheckSlice(run, build, () => Date.now());"],
  [ES, "a new state starts as running", "({ run: null, line: '', running: false, listen: null });", "({ run: null, line: '', running: true, listen: null });"],
];

/** The files run in the copy: per file, how many tests failed (a file that could not load counts as failed whole). */
function run(files) {
  const out = join(tree, 'break-run.json');
  try { execFileSync('npx', ['vitest', 'run', ...files, '--reporter=json', '--outputFile=' + out], { cwd: TESTS, stdio: 'ignore' }); } catch { /* red is the point */ }
  const r = JSON.parse(readFileSync(out, 'utf8'));
  if (r.testResults.length !== files.length) throw new Error('the copy ran ' + r.testResults.length + ' files of ' + files.length);
  const red = {};
  let tests = 0;
  for (const f of r.testResults) {
    const name = files.find((x) => f.name.endsWith(x));
    const failed = f.assertionResults.filter((t) => t.status !== 'passed' && t.status !== 'pending' && t.status !== 'skipped').length;
    const n = f.status !== 'passed' ? Math.max(failed, 1) : 0;
    tests += f.assertionResults.length;
    if (n) red[name] = n;
  }
  return { files: red, tests };
}

const line = (list) => list.map((f) => '`' + f + '`').join(', ');
/** The report from every break's row: [n, file, rule, {file: tests red}, whether the sweep was run]. */
function report(rows, clean) {
  const say = [];
  say.push('# The Expo app\'s Bugs tab: a break per rule, and the test files each turns red');
  say.push('');
  say.push('Written by `node tests/measure/native-bugs-tab_breaks.mjs` (read-only here; each break is made in a copy of the tree and put back).');
  say.push('');
  say.push('- The fast files, run on each break: ' + line(FAST) + '. Unbroken, they hold ' + clean.fast + ' tests and all pass.');
  say.push('- The sweep, run only on a break the fast files let through: ' + line(SLOW) + ' (' + clean.slow + ' tests, all passing unbroken).');
  say.push('');
  say.push('| # | File | The rule broken | Files red | Tests red | Which |');
  say.push('|---|---|---|---|---|---|');
  let missed = 0, swept = 0;
  for (const [n, file, rule, files, slow] of rows.sort((x, y) => x[0] - y[0])) {
    const names = Object.keys(files), tests = names.reduce((t, k) => t + files[k], 0);
    if (!names.length) missed++;
    if (slow) swept++;
    say.push('| ' + n + ' | `' + file.split('/').pop() + '` | ' + rule + ' | **' + names.length + '** | ' + tests + ' | ' + (names.map((k) => k.replace('.test.ts', '') + ' ' + files[k]).join(', ') || '**none: let through**') + (slow ? ' (the sweep was run)' : '') + ' |');
  }
  say.push('');
  say.push('- Breaks made: **' + rows.length + '** of ' + BREAKS.length + '. Let through by the fast files, so swept: ' + swept + '. Let through by every file: **' + missed + '**.');
  return say;
}

if (merging) {
  const parts = process.argv.slice(3).map((f) => JSON.parse(readFileSync(f, 'utf8')));
  // A break run again later replaces its earlier row (a part named after the others wins).
  const byN = new Map();
  for (const x of parts) for (const r of x.rows) byN.set(r[0], r);
  const rows = [...byN.values()];
  if (rows.length !== BREAKS.length) throw new Error('the parts hold ' + rows.length + ' breaks of ' + BREAKS.length);
  const say = report(rows, parts[0].clean);
  writeFileSync(join(HERE, 'native-bugs-tab_breaks.md'), say.join('\n') + '\n');
  console.log(say.slice(-1)[0]);
  process.exit(0);
}

// --check: the whole list read against this checkout, every text that is not in its file once named, nothing run.
if (checking) {
  const root = resolve(HERE, '..', '..');
  let bad = 0;
  BREAKS.forEach(([file, rule, from, to], i) => {
    const text = readFileSync(join(root, file), 'utf8');
    const times = text.split(from).length - 1;
    if (times !== 1) { bad++; console.log('break ' + (i + 1) + ' (' + rule + '): its text is in ' + file + ' ' + times + ' times, not once'); }
    else if (from === to) { bad++; console.log('break ' + (i + 1) + ' (' + rule + '): its replacement is its own text'); }
  });
  const names = new Set(BREAKS.map((b) => b[1]));
  if (names.size !== BREAKS.length) { bad++; console.log('two breaks share a name'); }
  console.log(BREAKS.length + ' breaks read against this checkout, ' + bad + ' with a text not found once');
  process.exit(bad ? 1 : 0);
}

// Every break's text is in its file once, before anything is run.
BREAKS.forEach(([file, rule, from], i) => {
  const text = readFileSync(join(tree, file), 'utf8');
  if (text.split(from).length !== 2) throw new Error('break ' + (i + 1) + ' (' + rule + '): its text is in ' + file + ' ' + (text.split(from).length - 1) + ' times, not once');
});
const cleanFast = run(FAST), cleanSlow = run(SLOW);
if (Object.keys(cleanFast.files).length || Object.keys(cleanSlow.files).length) throw new Error('the copy is red before any break: ' + JSON.stringify({ ...cleanFast.files, ...cleanSlow.files }));
const clean = { fast: cleanFast.tests, slow: cleanSlow.tests };
const rows = [];
let n = 0;
for (const [file, rule, from, to] of BREAKS) {
  n++;
  if (only && !rule.includes(only)) continue;
  if (part && (n - 1) % part[1] !== part[0]) continue;
  const path = join(tree, file), src = readFileSync(path, 'utf8');
  let r, slow = false;
  try {
    writeFileSync(path, src.replace(from, to));
    r = run(FAST);
    if (!Object.keys(r.files).length) { slow = true; r = run(SLOW); }
  } finally { writeFileSync(path, src); }
  rows.push([n, file, rule, r.files, slow]);
  console.log(n + '/' + BREAKS.length + ' ' + rule + ': ' + Object.keys(r.files).length + ' files' + (slow ? ' (swept)' : ''));
}
if (arg('--json')) writeFileSync(arg('--json'), JSON.stringify({ clean, rows }));
const say = report(rows, clean);
if (!only && !part) writeFileSync(join(HERE, 'native-bugs-tab_breaks.md'), say.join('\n') + '\n');
console.log(say.slice(-1)[0]);
