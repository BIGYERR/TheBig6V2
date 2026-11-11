// The Skip pill's store: D284 P-SKIPPILL (docs/decisions/this-week.md). This Week's pill skips a day's run or its lift
// on its own through the legacy skipPart; the parts live in ia_parts_<program> and the day's status follows them. Every
// expected status is typed from the ruling's table: every part skipped is `skipped`, one part skipped with every other
// part done is `complete`, otherwise no record; a record the parts wrote carries parts:1; a status the athlete set is
// never overwritten; the reminder and the session sheet's Done and Skip take the day whole. The program is Mario's
// HALF_MANNY (seed pinned by the fixture), whose week 11 Tuesday holds a run and a lift and whose Thursday holds lift
// work only, as the week grid prints them.
import { describe, test } from 'vitest';
import assert from 'node:assert/strict';
import { fixtures, loadApp, progDigest } from '../support/app.ts';

const PID = 'skippill';
const Q = loadApp({ dom: true });
const LS = Q.localStorage;
const cl = <T>(x: T): T => JSON.parse(JSON.stringify(x));
const PROG = Q.buildProgram(cl(fixtures.HALF_MANNY));

const read = (k: string) => JSON.parse(LS.getItem(k + PID) || '{}');
const parts = () => read('ia_parts_');
const comp = () => read('ia_comp_');
const status = (d: string) => Q.eval(`statusOf(11,'${d}')`);
const skip = (d: string, p: string) => Q.eval(`skipPart(11,'${d}','${p}')`);
const field = (id: string, value: string) => {
  Q.els[id] = Object.assign(Q.eval(`document.getElementById('${id}')`), { value });
};
function install(): void {
  LS.clear();
  Q.eval(`activeProgId='${PID}'`);
  Q.eval('activeProg=' + JSON.stringify(PROG));
  Q.eval('_setCurrentWeek(11)');
}

describe('the Skip pill\'s store', () => {
  test('the program is the same built twice, and week 11 holds a run and a lift on Tuesday and lift work only on Thursday', () => {
    assert.equal(progDigest(Q.buildProgram(cl(fixtures.HALF_MANNY))), progDigest(PROG));
    install();
    assert.deepEqual(JSON.parse(Q.eval("JSON.stringify([dayPartsOf(11,'tue'), dayPartsOf(11,'thu'), dayPartsOf(11,'wed')])")), [['run', 'lift'], ['lift'], []]);
  });

  test('one part skipped leaves the day pending; both skip the day; putting one back opens it; putting both back leaves nothing', () => {
    install();
    skip('tue', 'lift');
    assert.deepEqual([parts(), status('tue'), comp()], [{ w11_tue: { lift: 1 } }, null, {}]);
    skip('tue', 'run');
    assert.deepEqual([status('tue'), comp().w11_tue.parts], ['skipped', 1]);
    skip('tue', 'run');
    assert.deepEqual([parts(), status('tue'), comp()], [{ w11_tue: { lift: 1 } }, null, {}]);
    skip('tue', 'lift');
    assert.deepEqual([parts(), comp()], [{}, {}]);
  });

  test('a skipped lift and a logged run count as done, and clearing the run opens the day again (no latch)', () => {
    install();
    skip('tue', 'lift');
    field('log_run_mins', '15');
    Q.eval("persistLogFields('tue', true)");
    assert.deepEqual([status('tue'), comp().w11_tue.parts], ['complete', 1]);
    field('log_run_mins', '');
    Q.eval("persistLogFields('tue', true)");
    assert.deepEqual([status('tue'), comp()], [null, {}]);
  });

  test('a status the athlete set is never overwritten, and a run skipped before the deck closed the day stays skipped', () => {
    install();
    skip('tue', 'run');
    Q.eval("markDayComplete(11,'tue','Strength Support')");
    assert.deepEqual([status('tue'), comp().w11_tue.parts, parts()], ['complete', undefined, { w11_tue: { run: 1 } }]);
    skip('tue', 'run');
    assert.deepEqual([status('tue'), parts()], ['complete', {}], 'putting the run back leaves the deck\'s status alone');
  });

  test('a day skipped the old way turns into part skips when one part is put back', () => {
    install();
    LS.setItem('ia_comp_' + PID, JSON.stringify({ w11_tue: { title: 'Strength Support', ts: 1, status: 'skipped' } }));
    skip('tue', 'run');
    assert.deepEqual([parts(), status('tue'), comp()], [{ w11_tue: { lift: 1 } }, null, {}]);
  });

  test('a one card day: its pill skips the day, and a second tap leaves nothing; a part the day lacks is ignored', () => {
    install();
    skip('thu', 'run');
    assert.deepEqual([parts(), comp()], [{}, {}]);
    skip('thu', 'lift');
    assert.deepEqual([status('thu'), comp().w11_thu.parts], ['skipped', 1]);
    skip('thu', 'lift');
    assert.deepEqual([parts(), comp()], [{}, {}]);
  });

  test('the reminder and the session sheet take the day whole: its parts go, and the sheet\'s undo tap undoes', () => {
    install();
    skip('tue', 'lift');
    Q.eval("resolveReminder(11,'tue','Strength Support','complete')");
    Q.flushTimers();
    assert.deepEqual([parts(), status('tue'), comp().w11_tue.parts], [{}, 'complete', undefined]);
    install();
    skip('tue', 'lift');
    skip('tue', 'run');
    Q.eval("handleDayStatus('tue','Strength Support','skipped')");
    Q.flushTimers();
    assert.deepEqual([parts(), status('tue'), comp()], [{}, null, {}], 'Skipped, tap to undo: the day is open again');
  });

  test('the run counts as logged only for the sport it is credited to, and never at zero, as This Week reads it', () => {
    install();
    const logged = (e: unknown, type: string) => Q.eval(`partRunLogged(${JSON.stringify(e)}, '${type}')`);
    assert.deepEqual([
      logged({ run_mins: '15' }, 'run'), logged({ run_mins: '0' }, 'run'), logged({ run_dist: 0 }, 'run'),
      logged({ swapTo: 'bike', bike_mins: '30' }, 'run'), logged({ swapTo: 'bike', run_mins: '15' }, 'run'), logged(null, 'run'),
    ], [true, false, false, true, false, false]);
  });

  test('deleting the program purges its skipped parts', () => {
    install();
    skip('tue', 'lift');
    assert.notEqual(LS.getItem('ia_parts_' + PID), null);
    Q.eval(`purgeProgData('${PID}')`);
    assert.equal(LS.getItem('ia_parts_' + PID), null);
  });
});
