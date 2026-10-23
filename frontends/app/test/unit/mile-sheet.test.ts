// The mile pencil's two sheets (src/app/screens/mile-sheet/mile-sheet-model.ts, architecture phase E step 8), against
// the legacy openMileSheet they replace: when the tap locks, what the lock lists, and how a stored mile starts the
// fields. Every expected value is typed here from the legacy code, the date arithmetic of a hand-made countdown.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { type Countdown, type LockDeps, mileField, mileLocked, mileLockFacts } from '../../src/app/screens/mile-sheet/mile-sheet-model.ts';

/** A countdown fixed by hand, the legacy raceCountdownWords's table, and a date line that names the date it was given. */
function deps(cd: Countdown | null, day: (iso: string) => string = (iso) => `day of ${iso}`): LockDeps {
  return {
    countdown: () => cd,
    words: (c) => ({ card: c.days === 0 ? 'Race day' : 'Behind you' }),
    day,
  };
}

describe('the mile pencil', () => {
  it('locks in the last three weeks of a program and no sooner', () => {
    assert.deepEqual([1, 8, 9, 10, 11].map((w) => mileLocked(w, 11)), [false, false, true, true, true]);
    assert.deepEqual([3, 4].map((w) => mileLocked(w, 6)), [false, true]);
  });

  it('lists the days out, the race day and the week when the race date reads', () => {
    assert.deepEqual(mileLockFacts('2026-11-29', 9, 11, deps({ days: 17, weeks: 2 })), [
      { k: 'Days out', v: '17' },
      { k: 'Race day', v: 'day of 2026-11-29' },
      { k: 'Week', v: '9 of 11' },
    ]);
  });

  it('says race day and behind you in the countdown\'s own words, and keeps the raw date when the date line throws', () => {
    assert.equal(mileLockFacts('2026-11-29', 11, 11, deps({ days: 0, weeks: 0 }))[0]!.v, 'Race day');
    const past = mileLockFacts('2026-11-29', 11, 11, deps({ days: -3, weeks: -1 }, () => { throw new Error('bad date'); }));
    assert.deepEqual(past.slice(0, 2), [{ k: 'Days out', v: 'Behind you' }, { k: 'Race day', v: '2026-11-29' }]);
  });

  it('lists the week alone with no race date, or one that does not read', () => {
    assert.deepEqual(mileLockFacts(null, 5, 6, deps({ days: 9, weeks: 1 })), [{ k: 'Week', v: '5 of 6' }]);
    assert.deepEqual(mileLockFacts('soon', 5, 6, deps(null)), [{ k: 'Week', v: '5 of 6' }]);
    assert.deepEqual(mileLockFacts('2026-11-29', 5, 6, deps({ days: NaN, weeks: NaN })), [{ k: 'Week', v: '5 of 6' }]);
  });

  it('starts a field from the stored mile, empty when there is none', () => {
    assert.deepEqual([mileField('7'), mileField(8), mileField(0), mileField(''), mileField(undefined), mileField(null)], ['7', '8', '0', '', '', '']);
  });
});
