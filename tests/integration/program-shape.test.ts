// Program shape: what buildProgram returns, and what the app writes into the session log, against the shared domain
// types in @ia/core (core/src/domain). The checks in core/src/domain/shape.ts walk every week, day, cardio session,
// section and item, and the compiler binds each check to its type (every field, its optionality and its value type),
// so these tests keep the types and the engine in step: a field the engine adds, drops or retypes turns them red.
// The 864-config lattice and every cardio goal are walked in tests/sweeps/program-shape.test.ts (CI only).
//
// Oracles: the hand-written checks themselves, never the engine; the hand counts of the doctrine (Nike's half
// marathon plan is 14 weeks, a week holds seven days); and, for the broken copies, problem lines typed by hand. The
// week 1 days named below are read off tests/snapshots/program-output.json: Monday is a lifting day with a speed run
// and a main lift, Sunday is a rest day.
import assert from 'node:assert/strict';
import { describe, test } from 'vitest';
import { checkCfg, checkLogBook, checkLogEntry, checkProgram, isProgram } from '@ia/core';
import type { Program } from '@ia/core';
import { fixtures, loadApp, pinClock } from '../support/app.ts';
import { PROGRAMS } from '../support/programs.ts';
import { stopwatchRig } from '../support/rest-timer.ts';

const TODAY = new Date(2026, 9, 11, 12, 0, 0);
const IA = loadApp();
pinClock(IA, TODAY);

/** A deep copy of Mario's program, to break on purpose. */
const halfManny = (): Program => JSON.parse(JSON.stringify(IA.buildProgram(fixtures.HALF_MANNY)));
/** Week 1's Monday, a lifting day with sections, as an editable object. */
const monday = (p: Program): Record<string, any> => p.weeks['1']?.mon as Record<string, any>;

describe('every config builds a program with the domain shape', () => {
  for (const [name, cfg] of Object.entries(PROGRAMS)) {
    test(name, () => {
      assert.deepEqual(checkCfg(cfg).problems, [], 'the config is a Cfg');
      const prog = IA.buildProgram(cfg);
      const report = checkProgram(prog);
      assert.deepEqual(report.problems, [], 'the program is a Program');
      assert.ok(isProgram(prog));
      // The walk reached everything: one program, its weeks, seven days a week, and every section and item in them.
      let sections = 0;
      let items = 0;
      for (const week of Object.values(prog.weeks)) {
        for (const day of Object.values(week)) {
          for (const s of day.sections || []) {
            sections++;
            items += s.items.length;
          }
        }
      }
      assert.equal(report.walked['program'], 1);
      assert.equal(report.walked['week'], Object.keys(prog.weeks).length);
      assert.equal(report.walked['day'], 7 * Object.keys(prog.weeks).length);
      assert.equal(report.walked['section'], sections);
      assert.equal(report.walked['item'], items);
      assert.ok(items > 0, 'the program prescribes exercises');
    });
  }

  test("Mario's half marathon walks 14 weeks and 98 days", () => {
    const report = checkProgram(IA.buildProgram(fixtures.HALF_MANNY));
    assert.equal(report.walked['week'], 14);
    assert.equal(report.walked['day'], 98);
  });
});

describe('a broken program is caught, with the path of what broke', () => {
  test('an item without its prescription', () => {
    const p = halfManny();
    delete monday(p)['sections'][0].items[0].detail;
    assert.deepEqual(checkProgram(p).problems, ['program.weeks[1].mon.sections[0].items[0].detail: missing']);
  });

  test('a field the type does not name', () => {
    const p = halfManny();
    monday(p)['sections'][0].bogus = 1;
    assert.deepEqual(checkProgram(p).problems, ['program.weeks[1].mon.sections[0].bogus: not a field of section']);
  });

  test('a value outside the word list', () => {
    const p = halfManny();
    monday(p)['dot'] = 'nap';
    assert.deepEqual(checkProgram(p).problems, ['program.weeks[1].mon.dot: want one of "lift", "run", "bike", "swim", got the string "nap"']);
  });

  test('a rest day that carries sections', () => {
    const p = halfManny();
    (p.weeks['1']?.sun as unknown as Record<string, unknown>)['sections'] = [];
    assert.deepEqual(checkProgram(p).problems, ['program.weeks[1].sun.sections: not a field of day']);
  });

  test('a missing week, and a week count written as text', () => {
    const p = halfManny();
    delete p.weeks['14'];
    assert.deepEqual(checkProgram(p).problems, ['program.weeks: want weeks 1 to 14, got 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13']);
    const q = halfManny();
    (q as unknown as Record<string, unknown>)['totalWeeks'] = '14';
    assert.deepEqual(checkProgram(q).problems, ['program.totalWeeks: want an integer, got the string "14"']);
  });

  test('a config with an unknown equipment tier and no name', () => {
    const c: Record<string, unknown> = { ...fixtures.HALF_MANNY, equipment: 'garage' };
    delete c['name'];
    assert.deepEqual(checkCfg(c).problems, [
      'cfg.name: missing',
      'cfg.equipment: want one of "bodyweight", "minimal", "home_basic", "home_full", "commercial", "crossfit", got the string "garage"',
    ]);
  });
});

describe('the session log the app writes has the LogEntry shape', () => {
  test('a set draft and a Done tap on a training day', () => {
    const r = stopwatchRig();
    assert.equal(r.open(), null, 'the day opens');
    assert.equal(r.seam("writeSetDraft('Close-grip bench press',['5','5'],['135',''],'lb')"), null, 'a set draft is written');
    assert.equal(r.seam("handleDayStatus('" + r.day + "','x','complete')"), null, 'Done');
    const stored = r.IA.localStorage.getItem('ia_logs_rest-timer');
    assert.ok(stored, 'the log is stored');
    const book = JSON.parse(stored);
    const key = 'w1_' + r.day;
    assert.deepEqual(Object.keys(book), [key], 'one entry, keyed w<week>_<day>');
    const report = checkLogBook(book);
    assert.deepEqual(report.problems, []);
    assert.equal(report.walked['logEntry'], 1);
    assert.equal(report.walked['setDraft'], 1);
    assert.deepEqual(book[key].sets['Close-grip bench press'], { r: ['5', '5'], w: ['135', ''], L: 'lb' });
    assert.equal(book[key].week, 1);
  });

  test('a broken entry is caught', () => {
    assert.deepEqual(checkLogEntry({ week: 1, sets: { x: { r: [5], w: [], L: '' } }, mood: 'good' }).problems, [
      'entry.sets[x].r[0]: want a string, got number 5',
      'entry.mood: not a field of logEntry',
    ]);
    assert.deepEqual(checkLogBook({ 'week1-mon': {} }).problems, ['log: key "week1-mon" is not w<week>_<day>']);
  });
});
