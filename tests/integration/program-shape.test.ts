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
import { sharedObjects } from '../support/shared-objects.ts';
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

// D291 P-OWNITEMS (docs/decisions/session-edits.md): a built program hands every day items of its own. The core block
// drew two members of a pillar and handed back the table's own objects, so one Suitcase carry stood on three days of
// Mario's program and in every program built after it. Identity only: what each item holds is the golden files'.
describe('D291: every item of a built program is an object of its own', () => {
  test('HALF_MANNY: Suitcase carry stands in the core block of three days, as three objects with one name and dose', () => {
    const p = IA.buildProgram(fixtures.HALF_MANNY) as { weeks: Record<string, Record<string, { sections: { items: { name: string; detail: string }[] }[] }>> };
    // Read off the build (tests/measure/day-edits_shared-items.md): week 1 Tuesday, week 6 Friday, week 7 Tuesday.
    const three = [p.weeks['1']!['tue']!.sections[3]!.items[0]!, p.weeks['6']!['fri']!.sections[2]!.items[1]!, p.weeks['7']!['tue']!.sections[3]!.items[1]!];
    assert.deepEqual(three.map((it) => [it.name, it.detail]), [['Suitcase carry', '3×40 yd each'], ['Suitcase carry', '3×40 yd each'], ['Suitcase carry', '3×40 yd each']]);
    assert.equal(new Set(three).size, 3, 'three days, three objects');
    // A mark made on one is on that one alone.
    (three[0] as { _skipped?: boolean })._skipped = true;
    assert.deepEqual(three.map((it) => !!(it as { _skipped?: boolean })._skipped), [true, false, false]);
    // And the next build of the same config does not carry it: the engine's table was not written to.
    const again = IA.buildProgram(fixtures.HALF_MANNY) as typeof p;
    assert.equal((again.weeks['1']!['tue']!.sections[3]!.items[0] as { _skipped?: boolean })._skipped, undefined);
  });

  // Two of the ten held none before the fix (the 10k on home basic and the bodyweight run base, whose later passes
  // rebuild their items): their two tests pass on the release before too, and stay as the guard for those tiers.
  for (const [name, cfg] of [['half-manny, the fixture', fixtures.HALF_MANNY] as const, ...Object.entries(PROGRAMS)]) {
    test(name + ': no object stands in two places, and none is in the next build', () => {
      const s = sharedObjects({ weeks: IA.buildProgram(cfg).weeks }, { weeks: IA.buildProgram(cfg).weeks });
      assert.ok(s.objects > 500, 'the walk reached the grid: ' + s.objects + ' objects');
      assert.deepEqual(s.twice, [], 'an object reached by two paths of one build');
      assert.deepEqual(s.ours, [], 'an object of one build found in the next');
    });
  }
});
