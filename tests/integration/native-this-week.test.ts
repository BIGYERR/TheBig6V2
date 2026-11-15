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
// The grid is the Expo app's own from its own launch (liveProgram, core's refreshStoredProgram over the store), never
// the page's handed across: until the seam read the launch it drew the stored grid, which differed from today's on
// 127 of 350 days in the week holding today (tests/measure/native-this-week_reads.md, and _launch.md for the zero).
//
// 0. Every launch of every history tests/integration/stored-state.test.ts walks (its 25 tests run here too, under the
//    import of support/native-launch.ts): the program the seam hands back is the one today's page holds, whole; the
//    seam wrote nothing; core's launch through a store that writes leaves each key as the page's launch left it.
// 1. HALF_MANNY through the standard history (support/stored-state.ts life): at each of its five launches, the Expo
//    app's grid is the page's, and every week title with the launch's own pick and with each of the seven columns
//    picked draws equal, whole.
// 2. The same draw with the phone's keys in the Expo app's SQLite store instead of the plain map.
// 3. From the store alone (weekScreen), on a phone whose stored grid has gone stale: today's screen.
// 4. The rest day tips are the page's, word for word.
// 5. Nothing is written: the store's keys are the phone's, to the byte, after every launch and every draw.
process.env['TZ'] = 'America/New_York';
import { launches } from '../support/native-launch.ts';
import './stored-state.test.ts';
import assert from 'node:assert/strict';
import { test } from 'vitest';
import { memoryStore } from '@ia/core/engine/state-store.ts';
import { NUTRITION_TIPS, STRETCH_TIPS } from '../../frontends/native/src/this-week/week-tips.ts';
import * as screen from '../../frontends/native/src/this-week/week-screen.ts';
import { liveProgram, weekScreen } from '../../frontends/native/src/this-week/week-screen.ts';
import { fixtures } from '../support/app.ts';
import { bootWeek, everyDraw, launchNow, nativeGrid, nativeView, pageGrid, pageShown, pageView, phoneStore, seen } from '../support/native-this-week.ts';
import { sqliteTestStore } from '../support/sqlite-kv.ts';
import { Phone, life } from '../support/stored-state.ts';

const CREATED = '2026-08-29T09:00:00';
const QUIET = { overlay: () => {}, freeze: () => {}, rebuild: () => {} };

// 0. Placed first among this file's own tests, so it reads what stored-state.test.ts's 25 tests launched above it.
// Measured before the seam was changed (tests/measure/native-this-week_launch.md, section 2b): 192 launches, 149 with
// a program and 43 with none, a key written on 8 of them, one overlay that failed. The floors are those numbers, so a
// check that stopped firing is red and a history added later is not.
test('every launch of the stored-state histories was a launch of the Expo app\'s seam too, and each one agreed', () => {
  assert.ok(launches.compared >= 149, 'launches with a program, the seam\'s equal to the page\'s: ' + JSON.stringify(launches));
  assert.ok(launches.none >= 43, 'launches with no program on either side: ' + JSON.stringify(launches));
  assert.ok(launches.wrote >= 8, 'launches where the launch wrote a key, each left as the page left it: ' + JSON.stringify(launches));
  // D289: the launch writes what today's writes, so each kind of write was made and compared at least once: an older
  // program repaired, the day edits of frozen weeks dropped, and the lift log's old keys folded.
  for (const f of ['ia_programs', 'ia_edits_', 'ia_exw_']) assert.ok((launches.families[f] || 0) >= 1, f + ' written by a launch: ' + JSON.stringify(launches));
  assert.ok(launches.overlayFailed >= 1, 'an overlay that failed, reported as often as the page\'s toast: ' + JSON.stringify(launches));
});

test('HALF_MANNY through the standard history: every title and every picked day, the Expo app\'s screen is today\'s', () => {
  const tally = seen();
  const stages: string[] = [];
  let sqliteDraws = 0, storeChecks = 0, stale = 0, alone = 0;
  life(fixtures.HALF_MANNY, CREATED, undefined, (stage, P) => {
    stages.push(stage);
    // The Expo app's own grid, from its own launch over the phone's keys, is the grid the page holds.
    const told = { overlay: 0, freeze: 0, rebuild: 0 };
    const store = phoneStore(P), grid = nativeGrid(P, store, told), page = pageGrid(P);
    assert.deepStrictEqual(grid, page, stage + ': the launch\'s grid is the page\'s');
    assert.deepStrictEqual(told, { overlay: 0, freeze: 0, rebuild: 0 }, stage + ': nothing failed');
    // And it is not the stored one: from the first week on, the grid ia_programs holds has gone stale.
    const stored = screen.storedProgram(store)!;
    assert.equal(stored.id, page.id);
    const differs = JSON.stringify(stored.weeks) !== JSON.stringify(page.weeks);
    if (differs) stale++;

    everyDraw(P, (native, today, what) => assert.deepStrictEqual(native, today, stage + ', ' + what), tally);

    // The launch's own title and pick: null and null on the Expo side, the title holding today on today's.
    const now = launchNow(P);
    assert.deepStrictEqual(nativeView(store, grid, now, null, null, true), pageView(P, pageShown(P), null, true), stage + ': the title in view at launch');

    // 2. The same launch and draw from SQLite, with the kv-store's own statements.
    const sql = phoneStore(P, sqliteTestStore());
    assert.deepStrictEqual(nativeView(sql, nativeGrid(P, sql), now, null, null, true), pageView(P, pageShown(P), null, true), stage + ': from the SQLite store');
    sqliteDraws++;

    // 3. From the store alone, launch and draw in one call, where the stored grid is stale and the page still sits on
    // the week it launched on (a walker that opened another week's day has moved the legacy currentWeek).
    if (differs && bootWeek(P)) {
      for (const picked of [null, 0, 1, 2, 3, 4, 5, 6]) {
        const s = weekScreen(sql, now, { shown: null, picked }, true);
        assert.ok(s, 'the store holds a program');
        assert.equal(s.shown, pageShown(P));
        assert.deepStrictEqual(JSON.parse(JSON.stringify(s.view)), pageView(P, pageShown(P), picked, true), stage + ': from the store alone, column ' + picked);
      }
      alone++;
    }

    // 5. Read only: after every launch and draw above, each store holds the phone's keys and nothing else.
    for (const s of [store, sql]) {
      assert.deepStrictEqual(Object.fromEntries(s.keys().sort().map((k) => [k, s.get(k)])), P.dump(), stage + ': the launch and the draws wrote nothing');
      storeChecks++;
    }
  });
  assert.deepStrictEqual(stages, ['0 generated', '1 first week', '2 second week', '3 third week', '4 after two weeks away']);
  // The stored grid is the page's only on the day the program was made (native-this-week_reads.md: 0, 2, 4, 60 and 46
  // of 98 days differ over the five launches), and the last launch, two weeks unopened, has opened no other week.
  assert.equal(stale, 4, 'the stored grid has gone stale on four of the five launches');
  assert.ok(alone >= 1, 'the screen from the store alone was drawn on a stale grid');
  // 15 titles (14 weeks and Race Day), eight picks with gps and one without, five launches.
  assert.equal(tally.draws, 5 * 15 * 9);
  assert.equal(sqliteDraws, 5);
  assert.equal(storeChecks, 10);
  // The history is the one the golden records walk, so the draws held each kind of thing the screen can show.
  for (const k of ['cards', 'rests', 'done', 'skipped', 'wild', 'injury', 'travel', 'race'] as const) {
    assert.ok(tally[k] > 0, 'the draws held ' + k + ': ' + JSON.stringify(tally));
  }
});

test('the stored program is the active one as ia_programs holds it, and a phone just set up draws today\'s screen from the store alone', () => {
  const P = new Phone().launch(CREATED);
  const id = P.generate(fixtures.HALF_MANNY);
  const store = phoneStore(P);
  const stored = (JSON.parse(P.dump()['ia_programs']!) as { id: string }[]).find((p) => p.id === id);
  assert.deepStrictEqual(screen.storedProgram(store), stored, 'storedProgram is the stored program, whole');
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
  assert.equal(screen.storedProgram(store), null);
  assert.equal(liveProgram(store, new Date(2026, 10, 13).getTime(), QUIET), null);
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
