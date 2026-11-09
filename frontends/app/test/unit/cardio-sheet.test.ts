// D278 P-CARDIOSHEET (docs/decisions/this-week.md): This Week's run card carries its own workout, and the chevron goes.
// Where a tap on a card goes, how the session sheet draws one cardio alone, and the workout Record run carries
// (src/app/screens/day-detail/cardio-sheet-model.ts); then the three templates that draw them, read as text. Every
// expected value is typed here from the ruling and the engine's words for HALF_MANNY's week 10 Saturday.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import type { BodyBlock } from '../../src/app/screens/day-detail/day-detail-model.ts';
import { cardioSheet, cardRoute, liftOnDay, recordWorkout, type SheetParts, type TappedCard } from '../../src/app/screens/day-detail/cardio-sheet-model.ts';

const WHEN = 'Today · Saturday';
const run = (act: 'record' | 'log' | null, title = 'Long Run'): TappedCard => ({ kind: 'run', title, button: act ? { act } : null });
const lift = (act: 'deck' | null): TappedCard => ({ kind: 'lift', title: 'Stretch and roll', button: act ? { act } : null });

/** A whole day's body: the lift sections, the cardio card, the log, a note and the log nudge, by kind only. */
const block = (kind: string) => ({ kind }) as unknown as BodyBlock;
const WHOLE: SheetParts<string> = {
  over: 'Week 10 · Saturday',
  title: 'Post-Run Mobility',
  tags: 'lift run',
  counter: '0 / 4 logged',
  body: [block('sections'), block('cardio'), block('sections'), block('e1rm'), block('log'), block('note'), block('logNudge')],
};
const SHEET = { over: WHEN, title: 'Long Run' };

describe('the cardio sheet (D278)', () => {
  it('sends Record run to the recorder, Start lift to the deck, and Log the run, the ride or the swim to that cardio alone', () => {
    assert.deepEqual(cardRoute(run('record'), WHEN, 'button'), { to: 'record' });
    assert.deepEqual(cardRoute(run('log'), WHEN, 'button'), { to: 'cardio', sheet: SHEET });
    assert.deepEqual(cardRoute(run('log', 'Steady Ride'), WHEN, 'button'), { to: 'cardio', sheet: { over: WHEN, title: 'Steady Ride' } });
    assert.deepEqual(cardRoute(lift('deck'), WHEN, 'button'), { to: 'deck' });
    assert.equal(cardRoute(run(null), WHEN, 'button'), null);
  });

  it('reopens a done run, ride or swim on its own sheet and a done lift on the whole day', () => {
    assert.deepEqual(cardRoute(run(null), WHEN, 'reopen'), { to: 'cardio', sheet: SHEET });
    assert.deepEqual(cardRoute(lift(null), WHEN, 'reopen'), { to: 'day' });
  });

  it('draws one cardio alone as its cardio card and its log under the when line and the name, with no tags, counter or add button', () => {
    const f = cardioSheet(SHEET, true, WHOLE, 'none');
    assert.deepEqual(
      { over: f.over, title: f.title, tags: f.tags, counter: f.counter, kinds: f.body.map((b) => b.kind), cardio: f.cardio },
      { over: WHEN, title: 'Long Run', tags: 'none', counter: null, kinds: ['cardio', 'log'], cardio: true },
    );
  });

  it('leaves the day\'s Done and Skip to the lift on a day with lift work, and keeps them on a day that is only cardio', () => {
    assert.equal(cardioSheet(SHEET, true, WHOLE, 'none').foot, false);
    assert.equal(cardioSheet(SHEET, false, WHOLE, 'none').foot, true);
  });

  it('draws the whole day as before when no cardio was asked for', () => {
    assert.deepEqual(cardioSheet(null, true, WHOLE, 'none'), { ...WHOLE, cardio: false, foot: true });
  });

  it('counts lift work by a section with a movement in it', () => {
    assert.equal(liftOnDay([{ items: [] }, { items: [{ name: 'Couch stretch' }] }]), true);
    assert.equal(liftOnDay([{ items: [] }]), false);
    assert.equal(liftOnDay([]), false);
    assert.equal(liftOnDay(undefined), false);
  });

  it('gives Record run the run\'s cardio card, its words as the session sheet draws them, with no benchmark strip', () => {
    const detail = '13.1K Dress Rehearsal: 8 mile run, run as a progression.\nAverage no faster than 9:58/mi.';
    const note = 'DRESS REHEARSAL: Run this at your race start time.';
    assert.deepEqual(recordWorkout({ cardio: { type: 'run', subtype: 'Long Run — Dress Rehearsal', detail, note } }), {
      blockCls: 'run-block',
      labelCls: 'cardio-label-run',
      label: 'Run — Long Run — Dress Rehearsal',
      segments: null,
      total: null,
      detail: '13.1K Dress Rehearsal: 8 mile run, run as a progression.<br>Average no faster than 9:58/mi.',
      note,
      bench: [],
    });
    assert.equal(recordWorkout({ cardio: null }), null);
    assert.equal(recordWorkout(null), null);
  });
});

describe('the screens that draw it (D278)', () => {
  const src = (f: string) => readFileSync(new URL('../../src/app/screens/' + f, import.meta.url), 'utf8');

  it('draws no chevron on a This Week card, and taps every card through the route', () => {
    const wv = src('week-view/week-view.ts');
    assert.equal(/tw-open|Open the day/.test(wv), false);
    assert.equal(/\.tw-open\{/.test(src('week-view/week-view.css')), false);
    assert.equal((wv.match(/\(click\)="tap\(k, \$event, d\.cards\[0\]!\.label, '(button|reopen)'\)"/g) || []).length, 2);
  });

  it('draws the run\'s workout on the recorder above the GPS line and the clock', () => {
    const rr = src('run-recorder/run-recorder.ts');
    const at = (s: string) => rr.indexOf(s);
    assert.ok(at('<ia-cardio-card [card]="w" />') > at('<div class="detail-body">'));
    assert.ok(at('<ia-cardio-card [card]="w" />') < at('{{ view().gps }}'));
    assert.ok(at('{{ view().gps }}') < at('{{ view().time }}'));
    assert.match(src('run-recorder/record-host.ts'), /\[workout\]="r\.workout"/);
  });

  it('opens the run\'s own sheet from the recorder\'s Ran without the phone?, under the recorder\'s when line and name', () => {
    assert.match(src('run-recorder/record-host.ts'), /if \(then && this\.state\.openDay\) this\.state\.openDay\(then\);/);
    assert.match(src('week-view/week-view.ts'), /this\.recorder\.openDay = \(r\) => this\.openCardio\(r\.week, r\.key, \{ over: r\.over, title: r\.title \}\);/);
  });

  it('hides the add button on one cardio alone and draws the day\'s foot only when the frame says so', () => {
    const dd = src('day-detail/day-detail.ts');
    assert.match(dd, /@if \(!v\.cardio\) \{<button class="dh-addbtn"/);
    assert.match(dd, /if \(!v\.foot\) \{\n\s+this\.foot\.set\(null\);/);
  });
});
