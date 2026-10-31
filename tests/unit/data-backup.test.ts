// Data backup, the file (D264, docs/decisions/data-backup.md): what a backup file must be before a load touches the
// phone, the line the Bugs page shows for it, the file's name, and the Your data block's copy on the page, on the native
// app's Angular screen, and the native share call that saves it.
//
// Oracles are the ruling's words and its hand table. readBackup, backupMessage and backupFileName are lifted out of the
// page and run alone; the two constants readBackup reads are the ruling's, typed here. The last tests read the Angular
// screen and the plugin's sources in the working tree, not the page under test, so IA_APP does not change what they see.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, test } from 'vitest';
import { APP, REPO, appFunction } from '../support/app.ts';

const programCount = appFunction('_programCount');
const readBackup = appFunction('readBackup', { BACKUP_KIND: 'asylum-backup', BACKUP_FORMAT: 1, _programCount: programCount });
const backupMessage = appFunction('backupMessage');
const backupFileName = appFunction('backupFileName');

const DATA = { ia_active: 'P1', ia_logs_P1: '{"w1_mon":{"notes":"x"}}', ia_programs: '[{"id":"P1"},{"id":"P2"}]' };
const file = (o: Record<string, unknown>) => JSON.stringify(Object.assign({ kind: 'asylum-backup', format: 1, version: '0.253.0', made: '2026-10-30T12:00:00.000Z', data: DATA }, o));

describe('reading a backup file', () => {
  test('a good file reads with its data, its program count and the time it was made', () => {
    const r = readBackup(file({}));
    assert.equal(r.ok, true);
    assert.deepEqual({ ...r.data }, DATA);
    assert.equal(r.programs, 2);
    assert.equal(r.made, '2026-10-30T12:00:00.000Z');
  });

  test('a file that is not an Asylum backup is refused as one', () => {
    const bad: [string, string][] = [
      ['text that is not JSON', 'not json {'],
      ['another kind of file', file({ kind: 'other-backup' })],
      ['a key that is not the app\'s', file({ data: { ...DATA, theme: 'night' } })],
      ['a value that is a number', file({ data: { ...DATA, ia_active: 7 } })],
      ['programs that are not a list', file({ data: { ...DATA, ia_programs: '{}' } })],
      ['programs missing', file({ data: { ia_active: 'P1' } })],
      ['no data', file({ data: undefined })],
      ['no format', file({ format: undefined })],
    ];
    for (const [what, text] of bad) {
      const r = readBackup(text);
      assert.deepEqual({ ok: r.ok, why: r.why }, { ok: false, why: 'bad' }, what);
    }
  });

  test('a file from a newer format is told apart, so the athlete knows to update', () => {
    const r = readBackup(file({ format: 2 }));
    assert.deepEqual({ ok: r.ok, why: r.why }, { ok: false, why: 'newer' });
  });
});

describe('the line the Bugs page shows', () => {
  test('a good file names the day it was made and how many programs it holds', () => {
    assert.equal(backupMessage({ ok: true, data: DATA, programs: 2, made: '2026-10-30T12:00:00.000Z' }),
      'Backup from Oct 30. 2 programs. Loading it replaces everything on this phone.');
    assert.equal(backupMessage({ ok: true, data: DATA, programs: 1, made: '2026-10-30T12:00:00.000Z' }),
      'Backup from Oct 30. 1 program. Loading it replaces everything on this phone.');
  });

  test('a refused file says why', () => {
    assert.equal(backupMessage({ ok: false, why: 'bad' }), 'That file is not an Asylum backup.');
    assert.equal(backupMessage({ ok: false, why: 'newer' }), 'This backup is from a newer app. Update the app first.');
  });
});

describe('the file name', () => {
  test('carries the phone\'s own date, late at night included', () => {
    assert.equal(backupFileName(new Date(2026, 9, 30, 23, 30)), 'asylum-backup-2026-10-30.json');
    assert.equal(backupFileName(new Date(2027, 0, 5, 0, 5)), 'asylum-backup-2027-01-05.json');
  });
});

describe('the Your data block', () => {
  const CAPTION = 'Your logs live on this phone. Save a backup to keep them safe or move them to a new phone.';
  const COPY = ['Your data', CAPTION, 'Save a backup', 'Load a backup', 'Load it', 'Cancel'];

  test('the page\'s Bugs screen offers it under the look, wired to the backup functions', () => {
    const html = readFileSync(APP, 'utf8');
    const bugs = html.slice(html.indexOf('id="screenBugs"'), html.indexOf('id="bugVersion"', html.indexOf('id="screenBugs"')));
    for (const c of COPY) assert.ok(bugs.includes(c), `the page's Bugs screen reads ${JSON.stringify(c)}`);
    assert.ok(bugs.indexOf('aria-label="Look"') < bugs.indexOf('aria-label="Your data"'), 'the block sits under the look');
    for (const h of ['onclick="saveBackup()"', 'onclick="backupPick()"', 'onchange="backupFileChosen(this)"', 'onclick="backupLoadIt()"', 'onclick="backupCancel()"']) {
      assert.ok(bugs.includes(h), `the page wires ${h}`);
    }
  });

  test('the native app\'s Bugs screen offers the same block and calls the same functions', () => {
    const src = readFileSync(join(REPO, 'frontends/app/src/app/screens/bug-report/bug-report.ts'), 'utf8');
    for (const c of COPY) assert.ok(src.includes(c), `the Angular Bugs screen reads ${JSON.stringify(c)}`);
    for (const fn of ['saveBackup', 'readBackupFile', 'backupMessage', 'applyBackup']) {
      assert.ok(src.includes(`this.bridge.call('${fn}'`), `the Angular Bugs screen calls ${fn}`);
    }
  });

  test('the native plugin gives the page a share call that opens the share sheet', () => {
    const js = readFileSync(join(REPO, 'frontends/app/plugins-src/ia-island/www/island.js'), 'utf8');
    const swift = readFileSync(join(REPO, 'frontends/app/plugins-src/ia-island/src/ios/IAIsland.swift'), 'utf8');
    assert.match(js, /share: function \(fileName, text, done, fail\)/);
    assert.match(js, /cordova\.exec\(done, fail, 'IAIsland', 'share', \[fileName, text\]\)/);
    assert.match(swift, /@objc\(share:\)/);
    assert.match(swift, /UIActivityViewController\(activityItems: \[file\]/);
  });
});
