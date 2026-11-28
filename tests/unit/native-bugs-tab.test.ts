// The Expo app's Bugs tab (MIGRATION.md phase 3, row 7, the second session; frontends/native/src/bugs): the pieces
// by a hand table. The model of the bug report is today's file, byte for byte. Expected values are typed by hand
// from today's screen (frontends/app/src/app/screens/bug-report/bug-report.ts), today's sheets (shell.css, look.css,
// wizard.css), the page's theme.ts and data-backup.ts, and the rulings: D261 (docs/decisions/night-mode.md), D264,
// D287, D289 and D297 (docs/decisions/data-backup.md). The walk that holds both apps equal after every tap is
// tests/integration/native-bugs-tab.test.ts.
//
// One test guards what must not change, and passes on the release before this one too: today's screen and sheets
// still say what the beta copies.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, test } from 'vitest';
import { memoryStore } from '@ia/core/engine/state-store.ts';
import type { StateStore } from '@ia/core/engine/state-store.ts';
import { bugContextText } from '../../frontends/native/src/bugs/bug-report-model.ts';
import {
  APP_ID, BUGS_WORDS, NEXT_KIND, OWN_COPY, asTodays, backupFileName, backupMessage, backupSnapshot, betaContext, buildLabel, cancelLoad, choose, firstTab,
  lookFace, newDataBlock, readBackup, readLook,
} from '../../frontends/native/src/bugs/bugs-screen.ts';
import { BACKUP_TOASTS, applyBackup, firstScreen, loadIt, newBugForm, saveBackup, sendBug, setLook } from '../../frontends/native/src/bugs/bugs-writes.ts';
import { newEngineState, startEngineCheck } from '../../frontends/native/src/engine-check-state.ts';
import { loadChecked } from '../../frontends/native/src/store/backup-import.ts';
import { REPO } from '../support/app.ts';
import { sqliteTestStore } from '../support/sqlite-kv.ts';

process.env['TZ'] = 'America/New_York';
const NATIVE = join(REPO, 'frontends', 'native', 'src');
const APP = join(REPO, 'frontends', 'app', 'src');
const read = (...p: string[]): string => readFileSync(join(NATIVE, ...p), 'utf8');
const J = JSON.stringify;
const contents = (s: StateStore): Record<string, string> => Object.fromEntries(s.keys().sort().map((k) => [k, s.get(k)!]));
const PROGS = '[{"id":"P1","name":"ONE","goal":"strength"}]';
/** A store that throws on every call, as a phone whose storage cannot be reached. */
const broken: StateStore = { get: () => { throw new Error('x'); }, set: () => { throw new Error('x'); }, remove: () => { throw new Error('x'); }, keys: () => { throw new Error('x'); } };

describe('native Bugs tab: the bug report\'s model is today\'s', () => {
  test('bug-report-model.ts in frontends/native is frontends/app\'s, byte for byte', () => {
    assert.ok(readFileSync(join(NATIVE, 'bugs', 'bug-report-model.ts')).equals(readFileSync(join(APP, 'app', 'screens', 'bug-report', 'bug-report-model.ts'))));
  });
});

describe('native Bugs tab: the words', () => {
  test('every word of the screen is today\'s', () => {
    assert.deepStrictEqual(BUGS_WORDS, {
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
    });
  });
  test('today\'s screen and sheets still say what the beta copies', () => {
    const today = readFileSync(join(APP, 'app', 'screens', 'bug-report', 'bug-report.ts'), 'utf8');
    for (const [k, w] of Object.entries(BUGS_WORDS)) {
      if (k === 'app') { assert.ok(today.includes('The <span>Asylum</span>')); continue; }
      // In the template as its own text, inside an attribute's double quotes, or in the script's single quotes.
      assert.ok(today.includes('>' + w + '<') || today.includes('"' + w + '"') || today.includes('\'' + w.replace(/'/g, '\\\'') + '\''), 'today\'s screen holds: ' + w);
    }
    const shell = readFileSync(join(APP, 'legacy', 'src', 'css', 'shell.css'), 'utf8'), look = readFileSync(join(APP, 'legacy', 'src', 'css', 'look.css'), 'utf8');
    assert.ok(shell.includes('.look-row{display:flex;flex-direction:column;gap:8px;border-top:1px solid var(--border);padding-top:16px;margin-top:6px;}'));
    assert.ok(shell.includes('.look-seg{display:flex;gap:8px;}'));
    assert.ok(shell.includes('.look-opt{flex:1;background:transparent;border:1px solid var(--border2);border-radius:4px;color:var(--muted);font-family:var(--font-display);font-size:13px;font-weight:700;letter-spacing:0;padding:11px 0;cursor:pointer;}'));
    assert.ok(shell.includes(':root:not([data-theme]) .look-opt[data-look="auto"],:root[data-theme="day"] .look-opt[data-look="day"],:root[data-theme="night"] .look-opt[data-look="night"]{background:var(--accent);border-color:var(--accent);color:var(--on-ink);}'));
    assert.ok(shell.includes('.look-note{font-size:12px;color:var(--muted);line-height:1.5;}'));
    assert.ok(/[,}]\.look-lbl[,{][^}]*\{font-size:13px;font-weight:600;letter-spacing:0;\}/.test(look.replace(/\{/g, '{').replace(/\n/g, '')) || /\.look-lbl[^{]*\{font-size:13px;font-weight:600;letter-spacing:0;\}/.test(look), 'look.css draws the label at 13 and 600');
    assert.ok(/\.look-opt[^{]*\{border-radius:var\(--r-pill\);\}/.test(look), 'look.css rounds the buttons to pills');
    assert.ok(/\.input-field,[^{]*\{border-radius:var\(--r-field\);\}/.test(look), 'look.css rounds the field');
    assert.ok(today.includes('style="padding:16px 20px;flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:14px;padding-bottom:40px"'));
  });
  test('D289\'s words stand under Your data, and the build\'s label is today\'s', () => {
    assert.equal(OWN_COPY, 'Sets you log here stay in this app. Today\'s app does not see them. Loading a backup replaces everything here.');
    assert.equal(buildLabel('0.263.0'), 'Build v0.263.0');
    assert.equal(buildLabel('239'), 'Build v0.239.0');
  });
  test('the toasts of Your data are today\'s', () => {
    assert.deepStrictEqual(BACKUP_TOASTS, { empty: 'Nothing to back up yet.', failed: 'Backup failed. Try again.', refused: 'Loading failed. Nothing changed.' });
    const today = readFileSync(join(APP, 'legacy', 'src', 'js', 'data-backup.ts'), 'utf8');
    for (const t of Object.values(BACKUP_TOASTS)) assert.ok(today.includes('\'' + t + '\''), 'today\'s page says: ' + t);
  });
});

describe('native Bugs tab: Look (D261)', () => {
  test('the look read is Day or Night as stored, and Auto for nothing, anything else, or a store that cannot be read', () => {
    const table: [string | null, string][] = [[null, 'auto'], ['day', 'day'], ['night', 'night'], ['', 'auto'], ['auto', 'auto'], ['Night', 'auto'], ['dusk', 'auto'], [' day', 'auto']];
    for (const [stored, want] of table) assert.equal(readLook(memoryStore(stored === null ? {} : { ia_theme: stored })), want, J(stored));
    assert.equal(readLook(broken), 'auto');
  });
  test('Day and Night outrank the phone; Auto follows it', () => {
    assert.deepStrictEqual([lookFace('auto', false), lookFace('auto', true)], ['day', 'night']);
    assert.deepStrictEqual([lookFace('day', false), lookFace('day', true)], ['day', 'day']);
    assert.deepStrictEqual([lookFace('night', false), lookFace('night', true)], ['night', 'night']);
  });
  test('a tap stores Day or Night under ia_theme and removes the key for Auto or any other word; no other key moves', () => {
    const s = memoryStore({ ia_programs: PROGS, other: 'x' });
    setLook(s, 'night'); assert.deepStrictEqual(contents(s), { ia_programs: PROGS, ia_theme: 'night', other: 'x' });
    setLook(s, 'day'); assert.deepStrictEqual(contents(s), { ia_programs: PROGS, ia_theme: 'day', other: 'x' });
    setLook(s, 'dusk'); assert.deepStrictEqual(contents(s), { ia_programs: PROGS, other: 'x' });
    setLook(s, 'night'); setLook(s, 'auto'); assert.deepStrictEqual(contents(s), { ia_programs: PROGS, other: 'x' });
    assert.doesNotThrow(() => { setLook(broken, 'night'); setLook(broken, 'auto'); }, 'a store that refuses is silent, as the page');
  });
  test('the app draws by the stored look and tells iOS the same; under Auto it tells iOS nothing', () => {
    const app = read('App.tsx');
    assert.ok(app.includes('const [look, setLookNow] = useState<Look>(() => readLook(phoneStore));'));
    assert.ok(app.includes("const p = lookFace(look, useColorScheme() === 'dark') === 'night' ? NIGHT : DAY;"));
    assert.ok(app.includes("useEffect(() => { Appearance.setColorScheme(look === 'auto' ? 'unspecified' : look === 'night' ? 'dark' : 'light'); }, [look]);"));
    assert.ok(app.includes('onLook={(l) => { setLook(phoneStore, l); setLookNow(readLook(phoneStore)); }}'), 'a tap writes, then the look is read back from the store');
    const bugs = read('bugs', 'Bugs.tsx');
    for (const l of ['auto', 'day', 'night']) assert.ok(bugs.includes(`<Opt id="look-${l}" label={W.${l}} on={look === '${l}'} palette={p} onPress={() => onLook('${l}')} />`), l);
    const rows = read('bugs', 'rows.tsx');
    assert.ok(rows.includes("style={[s.opt, { borderColor: on ? p.accent : p.border2, backgroundColor: on ? p.accent : 'transparent' }]}"), 'the chosen look: ink ground and edge');
    assert.ok(rows.includes('<Text style={[s.optText, { color: on ? p.onInk : p.muted }]}>{label}</Text>'), 'and the type that sits on ink');
  });
});

describe('native Bugs tab: the file the beta saves (D264, D297)', () => {
  test('its kind is the beta\'s own, and its name carries it with the phone\'s local date', () => {
    assert.equal(NEXT_KIND, 'asylum-next-backup');
    assert.equal(backupFileName(new Date(2026, 10, 27, 0, 0, 0)), 'asylum-next-backup-2026-11-27.json');
    assert.equal(backupFileName(new Date(2026, 10, 27, 23, 59, 59)), 'asylum-next-backup-2026-11-27.json');
    assert.equal(backupFileName(new Date(2027, 0, 5, 12, 0, 0)), 'asylum-next-backup-2027-01-05.json');
    // Late on the 27th in New York is already the 28th in UTC: the name is the day the athlete saw.
    assert.equal(backupFileName(new Date('2026-11-28T03:30:00.000Z')), 'asylum-next-backup-2026-11-27.json');
  });
  test('it holds every ia_ key as stored, in name order, the release and the instant; no other key', () => {
    const s = memoryStore({ ia_programs: PROGS, zeta: 'no', ia_active: 'P1', ia_theme: 'night', other: 'x' });
    assert.deepStrictEqual(backupSnapshot(s, '0.263.0', Date.parse('2026-11-27T17:00:00.000Z')),
      { kind: 'asylum-next-backup', format: 1, version: '0.263.0', made: '2026-11-27T17:00:00.000Z', data: { ia_active: 'P1', ia_programs: PROGS, ia_theme: 'night' } });
    assert.equal(J(backupSnapshot(s, '0.263.0', 0)), '{"kind":"asylum-next-backup","format":1,"version":"0.263.0","made":"1970-01-01T00:00:00.000Z","data":{"ia_active":"P1","ia_programs":' + J(PROGS) + ',"ia_theme":"night"}}');
  });
  test('a save hands back the file\'s name and text and stores nothing; a phone with no program saves nothing and says so', () => {
    const s = memoryStore({ ia_programs: PROGS, ia_active: 'P1' });
    const before = contents(s);
    const r = saveBackup(s, '0.263.0', new Date('2026-11-27T17:00:00.000Z'));
    assert.deepStrictEqual(r, { how: 'file', name: 'asylum-next-backup-2026-11-27.json', text: '{"kind":"asylum-next-backup","format":1,"version":"0.263.0","made":"2026-11-27T17:00:00.000Z","data":{"ia_active":"P1","ia_programs":' + J(PROGS) + '}}' });
    assert.deepStrictEqual(contents(s), before);
    for (const none of [{}, { ia_programs: '[]' }, { ia_programs: '{}' }, { ia_programs: 'nope' }, { ia_theme: 'night' }]) {
      assert.deepStrictEqual(saveBackup(memoryStore(none as Record<string, string>), '0.263.0', new Date(0)), { how: 'empty', toast: 'Nothing to back up yet.' }, J(none));
    }
  });
  test('the app writes the file into its own cache and hands that file to the share sheet; a failure says so', () => {
    const bugs = read('bugs', 'Bugs.tsx');
    const save = bugs.slice(bugs.indexOf('const save = async'), bugs.indexOf('const load = async'));
    assert.ok(save.includes("const r = saveBackup(store, VERSION, new Date());\n    if (r.how === 'empty') { say(r.toast); return; }"));
    assert.ok(save.includes('const file = new File(Paths.cache, r.name);\n      file.create({ overwrite: true });\n      await file.write(r.text);'));
    assert.ok(save.includes('await Share.share({ url: file.uri });\n    } catch {\n      say(BACKUP_TOASTS.failed);'));
  });
});

describe('native Bugs tab: the file read (D264, D297)', () => {
  const good = { kind: 'asylum-backup', format: 1, version: '0.263.0', made: '2026-11-27T17:00:00.000Z', data: { ia_programs: PROGS, ia_active: 'P1' } };
  const text = (f: unknown): string => J(f);
  test('today\'s file and the beta\'s own are both read, and read the same', () => {
    const want = { ok: true, data: { ia_programs: PROGS, ia_active: 'P1' }, programs: 1, made: '2026-11-27T17:00:00.000Z' };
    assert.deepStrictEqual(readBackup(text(good)), want);
    assert.deepStrictEqual(readBackup(text({ ...good, kind: 'asylum-next-backup' })), want);
  });
  test('any other kind is not a backup, and the beta\'s own kind is held to every rule today\'s is', () => {
    const bad = { ok: false, why: 'bad' }, newer = { ok: false, why: 'newer' };
    for (const kind of ['asylum', 'asylum-next', 'Asylum-Next-Backup', 'asylum-next-backup ', '', null, 1]) assert.deepStrictEqual(readBackup(text({ ...good, kind })), bad, J(kind));
    assert.deepStrictEqual(readBackup('nope'), bad);
    assert.deepStrictEqual(readBackup('null'), bad);
    assert.deepStrictEqual(readBackup('[]'), bad);
    assert.deepStrictEqual(readBackup(text([{ ...good, kind: 'asylum-next-backup' }])), bad, 'a list holding a backup is not one');
    for (const kind of ['asylum-backup', 'asylum-next-backup']) {
      assert.deepStrictEqual(readBackup(text({ ...good, kind, format: 2 })), newer, kind + ', a newer format');
      assert.deepStrictEqual(readBackup(text({ ...good, kind, format: 0 })), bad, kind + ', an older format');
      assert.deepStrictEqual(readBackup(text({ ...good, kind, data: { ...good.data, other: 'x' } })), bad, kind + ', a key that is not the app\'s');
      assert.deepStrictEqual(readBackup(text({ ...good, kind, data: { ...good.data, ia_active: 1 } })), bad, kind + ', a value that is not text');
      assert.deepStrictEqual(readBackup(text({ ...good, kind, data: { ia_active: 'P1' } })), bad, kind + ', no program list');
    }
  });
  test('only the beta\'s own kind is handed on under today\'s; every other text goes to core\'s reader as it is', () => {
    const own = text({ ...good, kind: 'asylum-next-backup' });
    assert.equal(asTodays(own), text(good), 'the same file, its fields in the same order, under today\'s kind');
    for (const t of [text(good), 'nope', '{}', '[]', 'null', text({ ...good, kind: 'asylum' }), text([{ kind: 'asylum-next-backup' }])]) assert.equal(asTodays(t), t, t.slice(0, 40));
  });
  test('the line says what the file is, in today\'s words, by the phone\'s local day', () => {
    const ok = (made: string, programs: number): string => backupMessage({ ok: true, data: {}, programs, made });
    assert.equal(ok('2026-11-27T17:00:00.000Z', 1), 'Backup from Nov 27. 1 program. Loading it replaces everything on this phone.');
    assert.equal(ok('2026-11-27T17:00:00.000Z', 3), 'Backup from Nov 27. 3 programs. Loading it replaces everything on this phone.');
    assert.equal(ok('2026-11-27T17:00:00.000Z', 0), 'Backup from Nov 27. 0 programs. Loading it replaces everything on this phone.');
    assert.equal(ok('2026-11-28T03:30:00.000Z', 1), 'Backup from Nov 27. 1 program. Loading it replaces everything on this phone.', 'still the 27th in New York');
    assert.equal(ok('2026-03-01T12:00:00.000Z', 1), 'Backup from Mar 1. 1 program. Loading it replaces everything on this phone.');
    assert.equal(ok('', 1), '1 program. Loading it replaces everything on this phone.');
    assert.equal(ok('yesterday', 2), '2 programs. Loading it replaces everything on this phone.');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    months.forEach((m, i) => assert.equal(ok(new Date(2026, i, 15, 12).toISOString(), 1), 'Backup from ' + m + ' 15. 1 program. Loading it replaces everything on this phone.'));
    assert.equal(backupMessage({ ok: false, why: 'newer' }), 'This backup is from a newer app. Update the app first.');
    assert.equal(backupMessage({ ok: false, why: 'bad' }), 'That file is not an Asylum backup.');
  });
});

describe('native Bugs tab: the question, Cancel and Load it (D264, D287)', () => {
  const data = { ia_programs: PROGS, ia_active: 'P1', ia_theme: 'day' };
  const file = J({ kind: 'asylum-next-backup', format: 1, version: '0.263.0', made: '2026-11-27T17:00:00.000Z', data });
  const BEFORE = { ia_active: 'OLD', ia_programs: '[{"id":"OLD"}]', ia_note_OLD: 'kept', other_app_key: 'x' };
  test('a backup picked shows its line and puts the question; nothing is stored', () => {
    const b = newDataBlock(), s = memoryStore(BEFORE);
    assert.deepStrictEqual(b, { message: '', pending: null });
    choose(b, file);
    assert.deepStrictEqual(b, { message: 'Backup from Nov 27. 1 program. Loading it replaces everything on this phone.', pending: data });
    assert.deepStrictEqual(contents(s), BEFORE);
  });
  test('a file turned away shows why and puts no question, and takes a waiting file\'s place', () => {
    const b = newDataBlock();
    choose(b, file);
    choose(b, '{}');
    assert.deepStrictEqual(b, { message: 'That file is not an Asylum backup.', pending: null });
    choose(b, file);
    choose(b, J({ ...JSON.parse(file), format: 2 }));
    assert.deepStrictEqual(b, { message: 'This backup is from a newer app. Update the app first.', pending: null });
    choose(b, file);
    choose(b, null);
    assert.deepStrictEqual(b, { message: 'That file is not an Asylum backup.', pending: null }, 'a file that cannot be read');
  });
  test('Cancel takes the line and the question away', () => {
    const b = newDataBlock();
    choose(b, file); cancelLoad(b);
    assert.deepStrictEqual(b, { message: '', pending: null });
    choose(b, '{}'); cancelLoad(b);
    assert.deepStrictEqual(b, { message: '', pending: null });
  });
  test('Load it replaces every ia_ key with the file\'s and asks for the start afresh, the line and the question still up', () => {
    const b = newDataBlock(), s = sqliteTestStore();
    for (const [k, v] of Object.entries(BEFORE)) s.set(k, v);
    choose(b, file);
    assert.deepStrictEqual(loadIt(b, s), { afresh: true, toast: null });
    assert.deepStrictEqual(contents(s), { ia_active: 'P1', ia_programs: PROGS, ia_theme: 'day', other_app_key: 'x' }, 'the file\'s keys, and the key that is not the app\'s as it was');
    assert.deepStrictEqual(b, { message: 'Backup from Nov 27. 1 program. Loading it replaces everything on this phone.', pending: data });
  });
  test('Load it with nothing waiting clears the block and changes nothing', () => {
    const b = newDataBlock(), s = memoryStore(BEFORE);
    choose(b, '{}');
    assert.deepStrictEqual(loadIt(b, s), { afresh: false, toast: null });
    assert.deepStrictEqual(b, { message: '', pending: null });
    assert.deepStrictEqual(contents(s), BEFORE);
  });
  test('a phone that refuses a write keeps what it held, says so in today\'s words, and the block is cleared', () => {
    for (const at of [1, 2, 3]) {
      const inner = memoryStore(BEFORE);
      let sets = 0;
      const s: StateStore = { ...inner, set: (k, v) => { if (++sets === at) throw new Error('full'); inner.set(k, v); } };
      const b = newDataBlock();
      choose(b, file);
      assert.deepStrictEqual(loadIt(b, s), { afresh: false, toast: 'Loading failed. Nothing changed.' }, 'write ' + at);
      assert.deepStrictEqual(contents(inner), BEFORE, 'write ' + at);
      assert.deepStrictEqual(b, { message: '', pending: null });
    }
  });
  test('a key the store does not hand back as the file wrote it keeps nothing either (D287: SQLite and a lone surrogate)', () => {
    const odd = { ...data, ia_note_P1: 'half \uD83D pair' };
    const s = sqliteTestStore();
    for (const [k, v] of Object.entries(BEFORE)) s.set(k, v);
    assert.equal(s.get('ia_note_P1'), null, 'the store did not hold that key before');
    assert.deepStrictEqual(loadChecked(s, odd), { ok: false, why: 'mismatch', misses: ['ia_note_P1 differs'] });
    assert.deepStrictEqual(contents(s), BEFORE);
    assert.deepStrictEqual(applyBackup(s, odd), { ok: false, toast: 'Loading failed. Nothing changed.' });
    const b = newDataBlock();
    b.pending = odd; b.message = 'x';
    assert.deepStrictEqual(loadIt(b, s), { afresh: false, toast: 'Loading failed. Nothing changed.' });
    assert.deepStrictEqual(contents(s), BEFORE);
    assert.deepStrictEqual(loadChecked(s, data), { ok: true });
  });
  test('the screen draws the line always and the question only while a file waits; a load that takes starts the app afresh', () => {
    const bugs = read('bugs', 'Bugs.tsx');
    assert.ok(bugs.includes('<Note id="backup-msg" palette={p}>{block.message}</Note>\n          {block.pending && (\n            <Seg id="backup-ask">'));
    assert.ok(bugs.includes('<Opt id="backup-load-it" label={W.loadIt} palette={p} onPress={tapLoadIt} />'));
    assert.ok(bugs.includes('<Opt id="backup-cancel" label={W.cancel} palette={p} onPress={cancel} />'));
    assert.ok(bugs.includes('const r = loadIt(block, store);\n    if (r.toast) say(r.toast);\n    if (r.afresh) onAfresh(); else draw();'));
    assert.ok(bugs.includes('if (got.canceled || !got.assets[0]) return;'), 'a picker closed with no file shows nothing');
    assert.ok(bugs.includes('choose(block, text);\n      draw();'));
    assert.ok(bugs.includes('<Note id="backup-own-copy" palette={p}>{OWN_COPY}</Note>'));
  });
});

describe('native Bugs tab: the start afresh', () => {
  const prog = (id: string, archived = false): object => ({ id, archived });
  test('the first tab: This Week with a program to open; with none, Programs after a load and Bugs at a cold start', () => {
    const table: [Record<string, string>, boolean, string][] = [
      [{ ia_active: 'A', ia_programs: J([prog('A')]) }, true, 'week'], [{ ia_active: 'A', ia_programs: J([prog('A')]) }, false, 'week'],
      [{ ia_active: 'GONE', ia_programs: J([prog('A', true), prog('B')]) }, true, 'week'],
      [{}, true, 'home'], [{}, false, 'bugs'],
      [{ ia_programs: '[]' }, true, 'home'], [{ ia_programs: J([prog('A')]) }, true, 'home'], [{ ia_programs: J([prog('A')]) }, false, 'bugs'],
      [{ ia_active: 'A', ia_programs: J([prog('A', true)]) }, true, 'home'], [{ ia_active: 'A', ia_programs: J([prog('A', true)]) }, false, 'bugs'],
    ];
    for (const [keys, afresh, want] of table) {
      const s = memoryStore(keys);
      assert.equal(firstTab(s, afresh), want, J(keys) + ' ' + afresh);
      assert.deepStrictEqual(contents(s), keys, 'the read writes nothing');
    }
  });
  test('a start that opens no program clears a pointer that leads to none, as today\'s init; one that opens a program writes nothing', () => {
    const dangling = { ia_active: 'A', ia_programs: J([prog('A', true)]), ia_theme: 'night' };
    for (const afresh of [true, false]) {
      const s = memoryStore(dangling);
      assert.equal(firstScreen(s, afresh), afresh ? 'home' : 'bugs');
      assert.deepStrictEqual(contents(s), { ia_programs: dangling.ia_programs, ia_theme: 'night' });
    }
    const live = { ia_active: 'GONE', ia_programs: J([prog('A')]) };
    const s = memoryStore(live);
    assert.equal(firstScreen(s, true), 'week');
    assert.deepStrictEqual(contents(s), live, 'This Week makes the launch, and its write, as it mounts');
    const none = memoryStore({ ia_programs: J([prog('A')]) });
    assert.equal(firstScreen(none, true), 'home');
    assert.deepStrictEqual(contents(none), { ia_programs: J([prog('A')]) });
  });
  test('the app is built again from the store after a load: a shell of its own, keyed by the count of loads', () => {
    const app = read('App.tsx');
    assert.ok(app.includes('const [boots, setBoots] = useState(0);'));
    assert.ok(app.includes("<Shell key={'boot' + boots} afresh={boots > 0} onAfresh={() => setBoots((n) => n + 1)} />"));
    assert.ok(app.includes('const [tab, setTab] = useState<Tab>(() => firstScreen(phoneStore, afresh));'));
    assert.ok(app.includes('<Bugs palette={p} state={bugs} store={phoneStore} look={look} say={say} onAfresh={onAfresh}'));
  });
});

describe('native Bugs tab: what the tab keeps while another tab is open', () => {
  // Today's screen stays in the page behind the other tabs. Typed from today's own: the Angular screen's signals
  // and the page's engine check outlive a visit to another tab, and a reload starts them again.
  test('the app holds the report, the waiting file and the engine check for its life, and a load starts them again with the shell', () => {
    const app = read('App.tsx'), bugs = read('bugs', 'Bugs.tsx');
    const shell = app.slice(app.indexOf('function Shell('));
    assert.ok(shell.includes('const bugs = useRef(newBugsState()).current;'), 'made once for the shell, never at each draw, so a start afresh makes them again');
    assert.ok(bugs.includes('export const newBugsState = (): BugsState => ({ form: newBugForm(), block: newDataBlock(), engine: newEngineState() });'));
    assert.ok(bugs.includes('const { form, block, engine } = state;'), 'the screen reads what the app holds');
    assert.ok(!/useRef\(new(BugForm|DataBlock|EngineState)\(\)\)/.test(bugs + read('EngineCheck.tsx')), 'and keeps none of its own');
  });
  test('the engine check runs on with no screen up, and a screen that comes back reads where it is and hears the rest', async () => {
    const wait = async (until: () => boolean): Promise<void> => { for (let i = 0; i < 400 && !until(); i++) await new Promise((r) => setTimeout(r, 5)); assert.ok(until(), 'waited two seconds'); };
    // Six cases and an engine that takes 30 ms a program: two programs to a 40 ms slice, three slices.
    const cases = [1, 2, 3, 4, 5, 6].map((n) => ({ tag: 'case ' + n, cfg: {}, digest: 'x', manny: false })) as never;
    const slow = (() => { const t = performance.now(); while (performance.now() - t < 30) { /* building */ } return {}; }) as never;
    const state = newEngineState();
    assert.deepStrictEqual({ ...state }, { run: null, line: '', running: false, listen: null });
    let heard = 0;
    state.listen = () => { heard++; };
    startEngineCheck(state, cases, slow);
    assert.deepStrictEqual([state.running, state.line, heard], [true, 'Built 0 of 6.', 1], 'started, and the screen told at once');
    const first = state.run;
    startEngineCheck(state, cases, slow);
    assert.equal(state.run, first, 'a second tap while one runs starts no second run');
    assert.equal(heard, 1);
    // The screen goes: the check runs on and is heard by nobody.
    state.listen = null;
    await wait(() => state.run!.next >= 2);
    assert.equal(heard, 1, 'nothing hears a line with no screen up');
    assert.equal(state.line, 'Built ' + state.run!.next + ' of 6.', 'the line is kept for the screen that comes back');
    // The screen comes back: it reads where the check is, and hears each line from then on, to the end.
    state.listen = () => { heard++; };
    await wait(() => !state.running);
    assert.ok(heard >= 2, 'heard again once a screen is up: ' + heard);
    assert.match(state.line, /^Lattice 0 of 6 match\. First miss: case 1\. Took \d+ s\.$/);
    assert.equal(state.run, first);
    // An ended run lets the next tap start another.
    startEngineCheck(state, [] as never, slow);
    assert.notEqual(state.run, first);
    await wait(() => !state.running);
  }, 20000);
  test('the engine row draws what the app holds, listens only while it is up, and times its slices on performance.now()', () => {
    const engine = read('EngineCheck.tsx'), held = read('engine-check-state.ts');
    assert.ok(engine.includes('    state.listen = () => setDraws((n) => n + 1);\n    return () => { state.listen = null; };\n  }, [state]);'));
    assert.ok(engine.includes('const { line, running } = state;'));
    assert.ok(engine.includes('const start = (): void => startEngineCheck(state);'));
    assert.ok(held.includes('export function startEngineCheck(state: EngineState, cases: Cases = engineCheckCases(), build: Build = buildProgram): void {'), 'core\'s cases and core\'s engine unless a test hands in its own');
    assert.ok(held.includes('const done = engineCheckSlice(run, build, () => performance.now());'));
  });
});

describe('native Bugs tab: the bug report', () => {
  const ctx = () => betaContext({ version: '0.263.0', time: '2026-11-27T17:00:00.000Z', os: '26.1', engine: 'Hermes', swift: 'Swift answers.', width: 402, height: 874, program: { name: 'ONE', goal: 'strength', id: 'P1' }, week: 3 });
  const ok = async () => ({ ok: true, json: async () => ({ success: true }) });
  test('its context is today\'s eight lines, naming the app where today\'s names the browser', () => {
    assert.equal(APP_ID, 'com.bigyerr.ironasylum.next');
    assert.equal(bugContextText(ctx()),
      '\n\n— context —\nbuild: v0.263.0\ntime: 2026-11-27T17:00:00.000Z\nua: IA Next; iOS 26.1; Hermes; Swift answers.\nviewport: 402x874\nstandalone: yes\nurl: com.bigyerr.ironasylum.next\nprogram: ONE / goal strength / wk 3 / id P1');
    assert.ok(bugContextText({ ...ctx(), program: null }).endsWith('\nurl: com.bigyerr.ironasylum.next\nprogram: none'));
  });
  test('nothing typed asks for it and sends nothing', async () => {
    for (const typed of ['', '   ', ' \n\t ']) {
      const form = newBugForm();
      form.text = typed;
      let asked = 0, draws = 0;
      assert.equal(await sendBug(form, ctx, async () => { asked++; return ok(); }, () => { draws++; }), null);
      assert.deepStrictEqual([asked, draws], [0, 1]);
      assert.deepStrictEqual(form, { text: typed, sending: false, status: { text: 'Type what went wrong first.', color: 'var(--muted)' } });
    }
  });
  test('a report filed: the text trimmed with the context after it, the button waiting while it is out, then the line, the toast and an empty field', async () => {
    const form = newBugForm();
    form.text = '  It broke.\nTwice.  ';
    const drawn: string[] = [];
    let posted: { url: string; init: { method: string; headers: Record<string, string>; body: string } } | null = null;
    const toast = await sendBug(form, ctx, async (url, init) => { posted = { url, init }; drawn.push('out: ' + J(form)); return ok(); }, () => { drawn.push(J(form)); });
    assert.equal(toast, 'Bug sent ✓');
    assert.deepStrictEqual(form, { text: '', sending: false, status: { text: 'Sent ✓ — thanks, I got it.', color: 'var(--green)' } });
    const waiting = J({ text: '  It broke.\nTwice.  ', sending: true, status: { text: '', color: 'var(--muted)' } });
    assert.deepStrictEqual(drawn, [waiting, 'out: ' + waiting, J(form)]);
    assert.equal(posted!.url, 'https://api.web3forms.com/submit');
    assert.equal(posted!.init.method, 'POST');
    assert.deepStrictEqual(posted!.init.headers, { 'Content-Type': 'application/json', Accept: 'application/json' });
    const body = JSON.parse(posted!.init.body) as Record<string, string>;
    assert.deepStrictEqual(Object.keys(body), ['access_key', 'subject', 'from_name', 'message']);
    assert.equal(body['subject'], 'The Asylum — Bug Report');
    assert.equal(body['message'], 'It broke.\nTwice.' + bugContextText(ctx()));
  });
  test('a report that fails keeps the text and says which way it failed', async () => {
    const table: [string, () => Promise<{ ok: boolean; json(): Promise<unknown> }>, string][] = [
      ['no success', async () => ({ ok: true, json: async () => ({}) }), 'Could not send — try again in a sec.'],
      ['not OK', async () => ({ ok: false, json: async () => ({ success: true }) }), 'Could not send — try again in a sec.'],
      ['not JSON', async () => ({ ok: true, json: async () => { throw new Error('x'); } }), 'Could not send — try again in a sec.'],
      ['never arrives', async () => { throw new Error('offline'); }, 'Network error — try again.'],
    ];
    for (const [name, answer, line] of table) {
      const form = newBugForm();
      form.text = 'It broke.';
      assert.equal(await sendBug(form, ctx, answer, () => {}), null, name);
      assert.deepStrictEqual(form, { text: 'It broke.', sending: false, status: { text: line, color: 'var(--red)' } }, name);
    }
  });
  test('a context that cannot be read sends the report with none, as today\'s', async () => {
    const form = newBugForm();
    form.text = 'It broke.';
    let message = '';
    await sendBug(form, () => { throw new Error('no program'); }, async (_u, init) => { message = (JSON.parse(init.body) as { message: string }).message; return ok(); }, () => {});
    assert.equal(message, 'It broke.');
  });
  test('the screen: the field, the button that waits, the line in its colour, and what the report is told about the app', () => {
    const bugs = read('bugs', 'Bugs.tsx');
    assert.ok(bugs.includes('<TextInput testID="bug-text" multiline value={form.text} onChangeText={(t) => { form.text = t; draw(); }} placeholder={W.placeholder}'));
    assert.ok(bugs.includes('disabled={form.sending} onPress={send}'));
    assert.ok(bugs.includes('style={[s.send, { backgroundColor: p.accent, opacity: form.sending ? 0.6 : 1 }]}'));
    assert.ok(bugs.includes('{form.sending ? W.sending : W.send}'));
    assert.ok(bugs.includes("const tint = form.status.color === 'var(--green)' ? p.green : form.status.color === 'var(--red)' ? p.red : p.muted;"));
    assert.ok(bugs.includes('<Text testID="bug-status" accessibilityLiveRegion="polite" style={[s.status, { color: tint }]}>{form.status.text}</Text>'));
    assert.ok(bugs.includes('if (form.sending) return;'), 'a second tap while a report is out sends nothing');
    assert.ok(bugs.includes('version: VERSION, time: new Date().toISOString(), os: String(Platform.Version), engine: engineName(), swift: swiftLine(SWIFT_ANSWER),'));
    assert.ok(bugs.includes('width, height, program: h.program, week: h.week,'));
    assert.ok(bugs.includes('}, (url, init) => fetch(url, init), draw);\n    if (toast) say(toast);'));
    assert.ok(read('App.tsx').includes('inHand={() => ({ program: hand.prog as { name?: string; goal?: string; id?: string } | null, week: hand.own || 1 })} />'), 'the program in hand and the week This Week holds');
    assert.ok(bugs.includes('keyboardDismissMode="on-drag"'), 'a drag on the page closes the keys');
  });
});

describe('native Bugs tab: the screen, top to bottom, in today\'s sizes', () => {
  const bugs = read('bugs', 'Bugs.tsx'), rows = read('bugs', 'rows.tsx');
  test('the parts stand in today\'s order', () => {
    const order = ['testID="bugs-top"', '{W.app}', '{W.title}', '{W.intro}', 'testID="bug-text"', 'testID="bug-send"', 'testID="bug-status"', '{W.attached}',
      '<Row id="look-row" label={W.look}', 'id="look-auto"', 'id="look-day"', 'id="look-night"', '{W.lookNote}',
      '<Row id="data-row" label={W.data}', '{W.dataNote}', 'id="backup-own-copy"', 'id="backup-save"', 'id="backup-load"', 'id="backup-msg"', 'id="backup-ask"',
      '<EngineCheck palette={p} state={engine} />', '<Text testID="bug-version" style={[s.version, { color: p.muted }]}>{buildLabel(VERSION)}</Text>'];
    const at = order.map((o) => bugs.indexOf(o));
    at.forEach((i, n) => assert.ok(i > 0, 'the screen draws ' + order[n]));
    assert.deepStrictEqual([...at].sort((a, b) => a - b), at, 'in today\'s order');
    assert.ok(!/recorder/i.test(bugs.replace(/^\/\/.*$/gm, '')), 'the Run recorder\'s row is phase 4\'s');
  });
  test('the body, the field, the button and the small lines carry today\'s values', () => {
    // Typed from today's template: 16 above, 20 at the sides, 14 between the parts, 40 under them, and the tab bar's room.
    assert.ok(bugs.includes('  body: { paddingTop: 16, paddingHorizontal: 20, gap: 14 },'));
    // Today's screen scrolls whole, its top bar with it: one scroll holds the top bar and the body.
    const scroll = bugs.indexOf('<ScrollView testID="bugs-scroll" contentContainerStyle={{ paddingBottom: 40 + 97 + insets.bottom }}');
    assert.ok(scroll > 0 && scroll < bugs.indexOf('testID="bugs-top"') && bugs.indexOf('testID="bugs-top"') < bugs.indexOf('<View testID="bugs-body" style={s.body}>'));
    assert.equal(bugs.split('<ScrollView').length, 2, 'one scroll on the screen');
    // Where today's CSS gives a line as a fraction, WebKit lays it at the whole point under it (the simulator's measure).
    assert.ok(bugs.includes('  intro: { fontFamily: TEXT, fontSize: 13, lineHeight: 20 },'), '13 on a line of 1.6, laid at 20');
    // .input-field (wizard.css, look.css) with the template's own min-height and line: the card's ground, 16 on 1.5.
    assert.ok(bugs.includes('  field: { fontFamily: TEXT, fontSize: 16, lineHeight: 24, minHeight: 160, borderWidth: 1, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14 },'));
    assert.ok(bugs.includes("style={[s.field, { backgroundColor: p.surface, borderColor: focused ? 'rgba(' + p.inkRgb + ',0.55)' : p.border2, color: p.text }]}"));
    assert.ok(bugs.includes("  send: { borderRadius: 999, padding: 14, alignItems: 'center' },"));
    assert.ok(bugs.includes("  sendText: { fontFamily: DISPLAY, fontSize: 15, fontWeight: '700', paddingBottom: 1.8 },"), 'the button stands 48 high, as today\'s');
    assert.ok(bugs.includes('  status: { fontFamily: TEXT, fontSize: 13, lineHeight: 19, minHeight: 20 },'));
    assert.ok(bugs.includes('  attached: { fontFamily: TEXT, fontSize: 11, lineHeight: 16, opacity: 0.8 },'));
    assert.ok(bugs.includes("  version: { fontFamily: 'Menlo', fontSize: 11, opacity: 0.55, textAlign: 'center', paddingTop: 6 },"), 'the build\'s label in Menlo, as WebKit draws today\'s');
    assert.ok(bugs.includes("  screen: { fontFamily: DISPLAY, fontSize: 40, fontWeight: '700', letterSpacing: -1.6, lineHeight: 42, marginTop: 4.5, marginBottom: -2.9 },"));
  });
  test('a row is today\'s: a rule above, a small label, equal pills 8 apart, a note at 12', () => {
    assert.ok(rows.includes('  row: { gap: 8, borderTopWidth: 1, paddingTop: 16, marginTop: 6 },'));
    assert.ok(rows.includes('style={[s.row, { borderTopColor: p.border }]}'));
    assert.ok(rows.includes("  label: { fontFamily: DISPLAY, fontSize: 13, fontWeight: '700', paddingBottom: 1.5 },"));
    assert.ok(rows.includes("  seg: { flexDirection: 'row', gap: 8 },"));
    assert.ok(rows.includes("  opt: { flex: 1, alignItems: 'center', borderWidth: 1, borderRadius: 999, paddingVertical: 11 },"));
    assert.ok(rows.includes("  optText: { fontFamily: DISPLAY, fontSize: 13, fontWeight: '700', paddingBottom: 1.5 },"), 'a pill stands 41 high, as today\'s');
    assert.ok(rows.includes('  note: { fontFamily: TEXT, fontSize: 12, lineHeight: 18, marginTop: -0.7, marginBottom: 0.35 },'));
    assert.ok(rows.includes('if (!children) return <View testID={id} style={s.none} />;'), 'an empty note takes the row\'s gap and no height, as the page\'s empty line');
    const engine = read('EngineCheck.tsx');
    assert.ok(engine.includes('<Row id="engine-row" label={\'Engine\'} palette={p}>'), 'the Engine row is drawn as the other two');
    assert.ok(engine.includes('<Opt id="engine-check-run" label={running ? \'Checking\' : \'Run the check\'} palette={p} onPress={start} />'));
    assert.ok(engine.includes('<Note id="engine-check-line" palette={p}>{line}</Note>'));
  });
});
