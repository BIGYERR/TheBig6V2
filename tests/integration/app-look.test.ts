// The Track look's labels as This Week renders them (D263 item 3, docs/decisions/app-look.md): sentence case for the
// title, the injury button, the day names, the session button and the tiles. The styles are tests/unit/app-look.test.ts.
//
// The app boots in the week environment of tests/support/week-view.ts (HALF_MANNY, a pinned clock, the elements kept).
// Oracles are the ruling's words, typed here by hand.
import assert from 'node:assert/strict';
import { test } from 'vitest';
import * as W from '../support/week-view.ts';

const E = W.weekEnv();
E.setup();
E.setNow(W.dateOf(1, 'mon'));
E.ev('currentWeek=1; renderWeekView()');
const H = E.html();
const all = (re: RegExp): string[] => [...H.matchAll(re)].map((m) => m[1] ?? '');

test('the title reads Week 1 and the injury button Hurt?, never in capitals', () => {
  assert.equal(E.els.weekBigNum!.textContent, 'Week 1');
  assert.equal(E.els.hurtLbl!.textContent, 'Hurt?');
});

test('the strip carries each short day name in sentence case, Mon to Sun', () => {
  assert.deepEqual(all(/<div class="wk-day-lbl">([^<]*)<\/div>/g), ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
});

test("today's session button reads Start session", () => {
  assert.deepEqual(all(/<button[^>]*class="wk-hero-cta"[^>]*>([^<]*)<\/button>/g), ['Start session']);
});

test('the tiles read Done, Miles and Day streak', () => {
  assert.deepEqual(all(/<div class="wk-stat-lbl">([^<]*)<\/div>/g), ['Done', 'Miles', 'Day streak']);
});
