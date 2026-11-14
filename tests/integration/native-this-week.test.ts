// This Week in the Expo app (MIGRATION.md phase 2, session 4): the screen frontends/native draws, held against the
// screen today's app draws, on the same phone at the same moment. The words and the behaviour are D276, D278 and D284's
// (docs/decisions/this-week.md) and D272's cards (docs/decisions/gps-recording.md), carried over unchanged, so the
// reference here is today's screen itself: the Angular screen's own model, fed by the legacy page's own functions as
// week-view.ts feeds it (support/native-this-week.ts pageView). The Expo app's draw (nativeView) goes through
// frontends/native/src/this-week/week-screen.ts and week-readers.ts over core's store. This is the one place the
// suite compares new code to the old on purpose, as the semver copy's test does: the page's readers stay the page's
// until the cutover, and this turns red when either side moves alone. The readers' own rules are typed by hand in
// tests/unit/native-this-week.test.ts.
//
// 1. HALF_MANNY through the standard history (support/stored-state.ts life): at each of its five launches, every week
//    title with the launch's own pick and with each of the seven columns picked, both draws equal, whole.
// 2. The same draw with the phone's keys in the Expo app's SQLite store instead of the plain map.
// 3. The Expo app's own grid: the active program as ia_programs stores it (liveProgram), and on a phone whose grid
//    nothing has touched since it was stored, the screen from the store alone is today's screen.
// 4. The rest day tips are the page's, word for word.
// 5. Nothing is written: the store's keys are the phone's, to the byte, after every draw.
process.env['TZ'] = 'America/New_York';
import assert from 'node:assert/strict';
import { test } from 'vitest';
import { memoryStore } from '@ia/core/engine/state-store.ts';
import { NUTRITION_TIPS, STRETCH_TIPS } from '../../frontends/native/src/this-week/week-tips.ts';
import { liveProgram, weekScreen } from '../../frontends/native/src/this-week/week-screen.ts';
import { fixtures } from '../support/app.ts';
import { bootWeek, everyDraw, launchNow, nativeView, pageGrid, pageShown, pageView, phoneStore, seen } from '../support/native-this-week.ts';
import { sqliteTestStore } from '../support/sqlite-kv.ts';
import { Phone, life } from '../support/stored-state.ts';

const CREATED = '2026-08-29T09:00:00';

test('HALF_MANNY through the standard history: every title and every picked day, the Expo app\'s screen is today\'s', () => {
  const tally = seen();
  const stages: string[] = [];
  let sqliteDraws = 0, storeChecks = 0;
  life(fixtures.HALF_MANNY, CREATED, undefined, (stage, P) => {
    stages.push(stage);
    everyDraw(P, (native, page, what) => assert.deepStrictEqual(native, page, stage + ', ' + what), tally);

    // The launch's own title and pick: null and null on the Expo side, the title holding today on today's.
    const now = launchNow(P), grid = pageGrid(P), store = phoneStore(P);
    assert.deepStrictEqual(nativeView(store, grid, now, null, null, true), pageView(P, pageShown(P), null, true), stage + ': the title in view at launch');

    // 2. The same draw from SQLite, with the kv-store's own statements.
    const sql = phoneStore(P, sqliteTestStore());
    assert.deepStrictEqual(nativeView(sql, grid, now, null, null, true), pageView(P, pageShown(P), null, true), stage + ': from the SQLite store');
    sqliteDraws++;

    // 5. Read only: after every draw above, each store holds the phone's keys and nothing else.
    for (const s of [store, sql]) {
      assert.deepStrictEqual(Object.fromEntries(s.keys().sort().map((k) => [k, s.get(k)])), P.dump(), stage + ': the draw wrote nothing');
      storeChecks++;
    }
  });
  assert.deepStrictEqual(stages, ['0 generated', '1 first week', '2 second week', '3 third week', '4 after two weeks away']);
  // 15 titles (14 weeks and Race Day), eight picks with gps and one without, five launches.
  assert.equal(tally.draws, 5 * 15 * 9);
  assert.equal(sqliteDraws, 5);
  assert.equal(storeChecks, 10);
  // The history is the one the golden records walk, so the draws held each kind of thing the screen can show.
  for (const k of ['cards', 'rests', 'done', 'skipped', 'wild', 'injury', 'travel', 'race'] as const) {
    assert.ok(tally[k] > 0, 'the draws held ' + k + ': ' + JSON.stringify(tally));
  }
});

test('the Expo app\'s grid is the active program as stored, and an untouched phone draws today\'s screen from the store alone', () => {
  const P = new Phone().launch(CREATED);
  const id = P.generate(fixtures.HALF_MANNY);
  const store = phoneStore(P);
  const stored = (JSON.parse(P.dump()['ia_programs']!) as { id: string }[]).find((p) => p.id === id);
  assert.deepStrictEqual(liveProgram(store), stored, 'liveProgram is the stored program, whole');
  // Just generated: the stored grid is the grid in hand (tests/measure/native-this-week_reads.md, launch 0).
  assert.deepStrictEqual(JSON.parse(JSON.stringify(P.prog.weeks)), (stored as unknown as { weeks: unknown }).weeks, 'nothing has touched the grid yet');
  const now = launchNow(P);
  assert.ok(bootWeek(P), 'a launch leaves the legacy currentWeek on the week holding today, so the Angular screen shows liveTitle');
  for (const picked of [null, 0, 1, 2, 3, 4, 5, 6]) {
    const s = weekScreen(store, now, { shown: null, picked }, true);
    assert.ok(s, 'the store holds a program');
    assert.equal(s.programId, id);
    assert.equal(s.shown, pageShown(P));
    assert.deepStrictEqual(JSON.parse(JSON.stringify(s.view)), pageView(P, pageShown(P), picked, true), 'column ' + picked);
  }
});

test('a store with no program, or an active id no program has, draws nothing', () => {
  assert.equal(weekScreen(memoryStore(), new Date(2026, 10, 13), { shown: null, picked: null }, true), null);
  const store = memoryStore({ ia_active: 'prog_gone', ia_programs: '[]' });
  assert.equal(liveProgram(store), null);
  assert.equal(weekScreen(store, new Date(2026, 10, 13), { shown: null, picked: null }, true), null);
});

test('the rest day tips are the page\'s, word for word', () => {
  const P = new Phone().launch(CREATED);
  const stretch: string[] = [...P.ev('STRETCH_TIPS')], fuel: string[] = [...P.ev('NUTRITION_TIPS')];
  assert.equal(stretch.length, 20);
  assert.equal(fuel.length, 20);
  assert.deepStrictEqual(STRETCH_TIPS, stretch);
  assert.deepStrictEqual(NUTRITION_TIPS, fuel);
});
