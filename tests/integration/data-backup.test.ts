// Data backup, on the phone (D264, docs/decisions/data-backup.md): a backup holds every ia_ key exactly as stored; a
// load replaces every ia_ key with the file's and leaves the rest, all or nothing; a backup taken on one phone boots
// the same program with the same logs on another; Save makes no file with no program stored, and in the native app
// hands the file to the share sheet.
//
// The app boots in the VM harness, each "phone" its own VM with its own storage. Oracles are the ruling's hand table:
// the keys, their bytes, the copy. The version a backup records is read from the page's meta by the harness, not the app.
import assert from 'node:assert/strict';
import { describe, test } from 'vitest';
import { fixtures, loadApp, pinClock } from '../support/app.ts';
import type { App } from '../support/app.ts';

const TOASTS = 'globalThis.__toasts=[];(function(){var o=showToast;showToast=function(m){__toasts.push(String(m));return o(m);};})()';

/** A phone: the app booted, its clock pinned, its storage emptied so a test writes exactly what it means. */
function phone(at = '2026-10-30T09:00:00'): App {
  const I = loadApp();
  pinClock(I, at);
  I.localStorage.clear();
  I.eval(TOASTS);
  return I;
}
const storage = (I: App) => Object.fromEntries([...(I.localStorage._map as Map<string, string>)].sort());
/** Values made inside the VM carry its own prototypes; a JSON copy brings them into this realm to compare. */
const here = <T>(v: T): T => JSON.parse(JSON.stringify(v));
const toasts = (I: App): string[] => here(I.eval('__toasts'));

const FILE_DATA = { ia_active: 'P1', ia_logs_P1: '{"w1_mon":{"notes":"x"}}', ia_programs: '[{"id":"P1"}]' };

describe('saving a backup', () => {
  test('a backup holds every ia_ key exactly as stored, sorted, and nothing else', () => {
    const I = phone();
    I.localStorage.setItem('ia_programs', FILE_DATA.ia_programs);
    I.localStorage.setItem('ia_active', 'P1');
    I.localStorage.setItem('ia_logs_P1', FILE_DATA.ia_logs_P1);
    I.localStorage.setItem('other', 'y');
    const snap = I.eval('backupSnapshot()');
    assert.equal(snap.kind, 'asylum-backup');
    assert.equal(snap.format, 1);
    assert.equal(snap.version, I.version);
    assert.ok(!isNaN(new Date(snap.made).getTime()), 'made is a time');
    assert.deepEqual(Object.keys(snap.data), ['ia_active', 'ia_logs_P1', 'ia_programs']);
    assert.deepEqual({ ...snap.data }, FILE_DATA);
  });

  test('with no program stored, Save makes no file and says there is nothing to back up', () => {
    for (const programs of [null, '[]']) {
      const I = phone();
      let shared = 0;
      I.window['iaIsland'] = { share: () => { shared++; } };
      I.localStorage.setItem('ia_theme', 'night');
      if (programs !== null) I.localStorage.setItem('ia_programs', programs);
      assert.equal(I.eval('saveBackup()'), 'empty', `programs ${programs}`);
      assert.equal(shared, 0, `programs ${programs}: no file made`);
      assert.deepEqual(toasts(I), ['Nothing to back up yet.'], `programs ${programs}`);
    }
  });

  test('in the native app, Save hands the file, named for the phone\'s date, to the share sheet', () => {
    const I = phone('2026-10-30T23:30:00');
    for (const [k, v] of Object.entries(FILE_DATA)) I.localStorage.setItem(k, v);
    const calls: { name: string; text: string; fail: () => void }[] = [];
    I.window['iaIsland'] = { share: (name: string, text: string, _done: () => void, fail: () => void) => { calls.push({ name, text, fail }); } };
    assert.equal(I.eval('saveBackup()'), 'native');
    assert.equal(calls.length, 1);
    assert.equal(calls[0]!.name, 'asylum-backup-2026-10-30.json');
    const sent = JSON.parse(calls[0]!.text);
    assert.equal(sent.kind, 'asylum-backup');
    assert.deepEqual(sent.data, FILE_DATA);
    assert.deepEqual(toasts(I), [], 'the share sheet is its own confirmation');
    calls[0]!.fail();
    assert.deepEqual(toasts(I), ['Backup failed. Try again.']);
  });
});

describe('loading a backup', () => {
  test('it replaces every ia_ key with the file\'s and leaves keys that are not the app\'s', () => {
    const I = phone();
    I.localStorage.setItem('ia_programs', '[{"id":"P9"}]');
    I.localStorage.setItem('ia_active', 'P9');
    I.localStorage.setItem('ia_logs_P9', '{}');
    I.localStorage.setItem('keep', '1');
    assert.equal(I.eval('loadBackupData')(FILE_DATA), true);
    assert.deepEqual(storage(I), { ...FILE_DATA, keep: '1' });
  });

  test('a write the phone refuses puts back everything the phone held, and nothing reloads', () => {
    const I = phone();
    const before = { ia_active: 'P9', ia_logs_P9: '{"w2_tue":{}}', ia_programs: '[{"id":"P9"}]', keep: '1' };
    for (const [k, v] of Object.entries(before)) I.localStorage.setItem(k, v);
    const LS = I.localStorage;
    const set = LS.setItem;
    let refused = false;
    LS.setItem = (k: string, v: string) => { if (k === 'ia_logs_P1' && !refused) { refused = true; throw new Error('QuotaExceededError'); } set(k, v); };
    let reloads = 0;
    I.window['location'].reload = () => { reloads++; };
    assert.equal(I.eval('applyBackup')(FILE_DATA), false);
    assert.ok(refused, 'the write was refused');
    assert.deepEqual(storage(I), before);
    assert.equal(reloads, 0);
    assert.deepEqual(toasts(I), ['Loading failed. Nothing changed.']);
  });

  test('a good load reloads the app so it boots on the loaded data', () => {
    const I = phone();
    let reloads = 0;
    I.window['location'].reload = () => { reloads++; };
    assert.equal(I.eval('applyBackup')(FILE_DATA), true);
    assert.equal(reloads, 1);
  });
});

describe('moving to a new phone', () => {
  test('a backup taken on one phone boots the same program with the same logs on another', () => {
    const A = phone();
    const p = A.buildProgram(Object.assign({}, fixtures.HALF_MANNY));
    p.id = 'HM'; p.name = 'THE HALF MANNY'; p.startDate = '2026-10-25';
    const entry = { notes: 'felt strong', ts: 1761830000000 };
    const weights = { back_squat: { name: 'Back squat', entries: [{ weight: 155, setsReps: '4×5', setsDone: [5, 5, 5, 5], setsW: [], week: 1, day: 'mon', ts: 1761830000000 }] } };
    A.localStorage.setItem('ia_programs', JSON.stringify([p]));
    A.localStorage.setItem('ia_active', 'HM');
    A.localStorage.setItem('ia_logs_HM', JSON.stringify({ w1_mon: entry }));
    A.localStorage.setItem('ia_exw_HM', JSON.stringify(weights));
    const text = JSON.stringify(A.eval('backupSnapshot()'));

    const B = phone();
    B.localStorage.setItem('ia_theme', 'day');
    const read = B.eval('readBackup')(text);
    assert.equal(read.ok, true);
    assert.equal(read.programs, 1);
    assert.equal(B.eval('loadBackupData')(read.data), true);
    assert.deepEqual(storage(B), storage(A));
    B.eval('activeProgId=null;activeProg=null;');
    B.eval('init()');
    assert.equal(B.eval('activeProgId'), 'HM');
    assert.equal(B.eval('activeProg&&activeProg.name'), 'THE HALF MANNY');
    assert.deepEqual(here(B.eval('getLogs()').w1_mon), entry);
    assert.deepEqual(here(B.eval('getExWeightsFor')('HM')), weights);
  });
});
