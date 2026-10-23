// Boot and build basics: the app's inline script boots in the VM harness, exports the engine entry points every other
// test reaches for, and builds Mario's live program (fixtures.HALF_MANNY) in the shape the doctrine gives it.
//
// Oracles: the doctrine, the fixture and the calendar, never the engine. Nike's half marathon plan is 14 weeks
// (doctrine/nikerunclubhalfmarathon.txt). The race date 2026-12-06 is a Sunday (checked below by date arithmetic), so
// race day is week 14's Sunday, found by its subtype, never by position. The fixture's rest days are Sunday and
// Wednesday and its seed is 76308. The app's clock is pinned to one local noon, so every run builds from the same today.
// That a seeded program equals itself built twice is held by tests/integration/program-output.test.ts.
import assert from 'node:assert/strict';
import { test } from 'vitest';
import type { Day } from '@ia/core';
import { fixtures, loadApp, pinClock } from '../support/app.ts';

const TODAY = new Date(2026, 9, 11, 12, 0, 0);
const RACE = { year: 2026, month: 11, day: 6 }; // 2026-12-06, the fixture's raceDate (month is 0-based)
const HALF_WEEKS = 14;

const IA = loadApp();
pinClock(IA, TODAY);

/** A day's rest flag as stored, read without asking the app. */
const restFlag = (day: Day | undefined): unknown => (day as { rest?: unknown } | undefined)?.rest;

test('the hand values match the fixture and the calendar', () => {
  assert.equal(fixtures.HALF_MANNY.raceDate, '2026-12-06');
  assert.equal(new Date(RACE.year, RACE.month, RACE.day).getDay(), 0, '2026-12-06 is a Sunday');
  assert.deepEqual(fixtures.HALF_MANNY.restDays, ['sun', 'wed']);
  assert.equal(fixtures.HALF_MANNY.seed, 76308);
  assert.equal(fixtures.HALF_MANNY.cardioGoals.run?.id, 'run_half');
});

test('the app boots and exports buildProgram, refreshProgram and raceAlignment', () => {
  assert.equal(typeof IA.buildProgram, 'function');
  assert.equal(typeof IA['refreshProgram'], 'function');
  assert.equal(typeof IA['raceAlignment'], 'function');
});

test("Mario's half marathon program builds, with its seed pinned", () => {
  const prog = IA.buildProgram(fixtures.HALF_MANNY);
  assert.ok(prog && prog.weeks && typeof prog.weeks === 'object', 'the program has weeks');
  assert.equal(prog.seed, 76308);
});

test('the half marathon plan is 14 weeks long', () => {
  const prog = IA.buildProgram(fixtures.HALF_MANNY);
  assert.equal(Object.keys(prog.weeks || {}).length, HALF_WEEKS);
});

test('race day is the race session on week 14 Sunday', () => {
  const prog = IA.buildProgram(fixtures.HALF_MANNY);
  const sunday = prog.weeks[String(HALF_WEEKS)]?.sun;
  assert.ok(sunday, 'week 14 has a Sunday');
  const cardio = (sunday as { cardio?: { subtype?: unknown } | null }).cardio;
  assert.match(String((cardio && cardio.subtype) || ''), /race/i);
});

test("the athlete's rest days, Sunday and Wednesday, are rest in week 1", () => {
  const prog = IA.buildProgram(fixtures.HALF_MANNY);
  for (const d of ['sun', 'wed'] as const) assert.ok(prog.weeks['1']?.[d] && restFlag(prog.weeks['1'][d]), `week 1 ${d} is rest`);
});
