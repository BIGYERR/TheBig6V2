// The Skip pill on This Week's cards: D284 P-SKIPPILL (docs/decisions/this-week.md), Mario's picks on the Skip the Day
// board (docs/design/card-skip.html). The cards come from week-view-model.ts, the motion from skip-motion.ts, and the
// screen's wiring is read as text. Every expected value is typed from the ruling: the press is 70% over 150 ms and back
// over 320 ms through 112% at 55%; the card fades to 50% over 3 x 350 = 1,050 ms; the dumbbell cracks to 7 degrees,
// back to 2, past 30 and rests at 22 in a V 2 units apart, over 520 ms; an undo plays each of them backwards, a curve
// (x1, y1, x2, y2) played backwards being (1 - x2, 1 - y2, 1 - x1, 1 - y1). The program starts Monday Oct 5, 2026, so
// title 1's Tuesday is Oct 6, the day the tests call today.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { type DayCard, type WeekDeps, type WeekInput, type WeekProgram, weekView } from '../../src/app/screens/week-view/week-view-model.ts';
import {
  BREAK_MS, CARD_MS, DIM, EASE, MOVE, POP, buttonCurves, cardTiming, dimFrames, groundFrames, halfFrames, playCard, popFrames,
  reversed, shrinkFrames,
} from '../../src/app/screens/week-view/skip-motion.ts';

const DAY_FULL = { sun: 'Sunday', mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday', sat: 'Saturday' };
const run = (subtype: string, type = 'run') => ({ type, subtype, dose: { k: 'time', mins: 15, tgt: 800 } });
const PROG: WeekProgram = {
  name: 'Half', totalWeeks: 2, startDate: '2026-10-05', primaryPath: 'event',
  weeks: {
    1: {
      mon: { rest: true },
      tue: { title: 'Strength Support', sections: [{ items: [1] }], cardio: run('Recovery Run') },
      wed: { title: 'Swim', cardio: run('Drills', 'swim') },
      thu: { title: 'Leg Strength', sections: [{ items: [1] }] },
      fri: { title: 'Ride', cardio: run('Sweet Spot', 'bike') },
      sat: { title: 'Post-Run Mobility', sections: [{ items: [1] }], cardio: run('Long Run') },
      sun: { rest: true },
    },
    2: {},
  },
};
const COL = { tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 } as const;
type Day = keyof typeof COL;
const cards = (day: Day, o: { status?: string; parts?: WeekInput['parts']; logs?: WeekInput['logs'] } = {}): DayCard[] => {
  const deps: WeekDeps = {
    weekRange: () => null, parseDate: (iso) => new Date(iso + 'T00:00:00'), isTravel: () => false, beforeStart: () => false,
    regionLabel: () => undefined, icon: () => '', liftFocus: (t) => String(t), runChip: (s) => s, wildcardOn: () => false,
    statusOf: (w, d) => (w === 1 && d === day ? o.status : undefined), heroSummary: (day) => `${day.title} first + 3 more`,
    sessionTime: () => 45, restTip: () => ({ label: '', text: '', src: '' }), restLines: () => [], streak: () => 0,
    wildcardSub: () => null, liveInjury: () => null, alignment: () => null, shortDay: (iso) => iso,
    completedKey: (w, d) => `w${w}_${d}`, logKey: (w, d) => `w${w}_${d}`,
  };
  const input: WeekInput = {
    prog: PROG, shown: 1, picked: COL[day], actualWeek: 1, today: new Date(2026, 9, 6), weekMon: new Date(2026, 9, 5),
    completed: {}, logs: o.logs || {}, parts: o.parts || {}, dayFull: DAY_FULL, gps: true,
  };
  return weekView(input, deps).days!.cards;
};
const pills = (ks: DayCard[]) => ks.map((k) => k.skip);
const buttons = (ks: DayCard[]) => ks.map((k) => k.button);

describe('the Skip pill on This Week', () => {
  it('puts a pill on every card whose part is not done, in the sport\'s own word, and takes it off a done card', () => {
    assert.deepEqual(pills(cards('tue')), [{ label: 'Skip run', on: false }, { label: 'Skip lift', on: false }]);
    assert.deepEqual(pills(cards('fri')), [{ label: 'Skip ride', on: false }]);
    assert.deepEqual(pills(cards('wed')), [{ label: 'Skip swim', on: false }]);
    assert.deepEqual(pills(cards('sat')), [{ label: 'Skip run', on: false }, { label: 'Skip stretch', on: false }], 'the cool down card is a stretch');
    assert.deepEqual(pills(cards('thu')), [{ label: 'Skip lift', on: false }], 'a lift only day has one card and one pill');
    const logged = cards('tue', { logs: { w1_tue: { run_mins: '15' } } });
    assert.deepEqual(pills(logged), [null, { label: 'Skip lift', on: false }], 'a logged run is done and loses its pill');
    assert.deepEqual(pills(cards('tue', { status: 'complete' })), [null, null], 'a closed day has no pills');
  });

  it('a skipped run keeps its words, sinks, takes no orange, and passes the orange to the lift', () => {
    const k = cards('tue', { parts: { w1_tue: { run: 1 } } });
    assert.deepEqual(buttons(k), [
      { text: 'Record run', act: 'record', glow: false, sunk: true },
      { text: 'Start lift', act: 'deck', glow: true, sunk: false },
    ]);
    assert.deepEqual(pills(k), [{ label: 'Skip run', on: true }, { label: 'Skip lift', on: false }]);
    assert.deepEqual(k.map((c) => c.done), [null, null], 'a skipped card draws no Skipped row (D276 item 7 amended)');
  });

  it('a skipped lift sinks Start lift and leaves the orange on the run', () => {
    const k = cards('tue', { parts: { w1_tue: { lift: 1 } } });
    assert.deepEqual(buttons(k), [
      { text: 'Record run', act: 'record', glow: true, sunk: false },
      { text: 'Start lift', act: 'deck', glow: false, sunk: true },
    ]);
  });

  it('a day skipped however it was skipped draws every card skipped, and no orange', () => {
    const k = cards('tue', { status: 'skipped' });
    assert.deepEqual(buttons(k).map((b) => b && [b.glow, b.sunk]), [[false, true], [false, true]]);
    assert.deepEqual(pills(k), [{ label: 'Skip run', on: true }, { label: 'Skip lift', on: true }]);
    assert.deepEqual(cards('thu', { status: 'skipped' }).map((c) => [c.button!.sunk, c.skip!.on]), [[true, true]]);
  });

  it('a logged run beside a skipped lift is done while the lift stays skipped, the day closed by its parts', () => {
    const k = cards('tue', { status: 'complete', parts: { w1_tue: { lift: 1 } }, logs: { w1_tue: { run_mins: '15' } } });
    assert.equal(k[0]!.button, null);
    assert.notEqual(k[0]!.done, null);
    assert.equal(k[0]!.skip, null);
    assert.deepEqual([k[1]!.button!.sunk, k[1]!.skip, k[1]!.done], [true, { label: 'Skip lift', on: true }, null]);
  });

  it('a run skipped before the deck closed the lift stays skipped, and the lift is closed out', () => {
    const k = cards('tue', { status: 'complete', parts: { w1_tue: { run: 1 } } });
    assert.deepEqual([k[0]!.button!.sunk, k[0]!.skip, k[0]!.done], [true, { label: 'Skip run', on: true }, null]);
    assert.deepEqual([k[1]!.button, k[1]!.done, k[1]!.skip], [null, { title: 'Strength Support', line: 'Closed out' }, null]);
  });
});

describe('the Skip pill\'s motion', () => {
  it('presses at its own speed: 70% over 150 ms, then back out over 320 ms through 112% at 55% of the way', () => {
    assert.deepEqual(POP, { inMs: 150, to: 0.7, outMs: 320, peak: 1.12, at: 0.55 });
    assert.deepEqual(shrinkFrames(), [{ transform: 'scale(1)' }, { transform: 'scale(0.7)' }]);
    assert.deepEqual(popFrames().map((f) => [f.transform, f.offset]), [['scale(0.7)', 0], ['scale(1.12)', 0.55], ['scale(1)', 1]]);
  });

  it('takes the card dark in slow motion, three times the 350 ms fade, to half, and back on the same way in reverse', () => {
    assert.equal(CARD_MS, 1050);
    assert.equal(DIM, 0.5);
    assert.deepEqual(dimFrames(), [{ opacity: 1 }, { opacity: 0.5 }]);
    assert.deepEqual(groundFrames('#FFFFFF', '#E4E4E0'), [{ backgroundColor: '#FFFFFF' }, { backgroundColor: '#E4E4E0' }]);
    assert.deepEqual(cardTiming(true, CARD_MS), { duration: 1050, easing: 'ease-out', direction: 'normal' });
    assert.deepEqual(cardTiming(false, CARD_MS), { duration: 1050, easing: 'ease-out', direction: 'reverse' });
  });

  it('snaps the dumbbell: a crack to 7 degrees, back to 2, past 30, resting at 22 in a V 2 units apart, over 520 ms', () => {
    assert.equal(BREAK_MS, 520);
    assert.deepEqual(halfFrames(-1).map((f) => [f.transform, f.offset]), [
      ['translate(0px,0px) rotate(0deg)', undefined],
      ['translate(0px,0px) rotate(7deg)', 0.16],
      ['translate(0px,0px) rotate(2deg)', 0.28],
      ['translate(-2.8px,1.8px) rotate(30deg)', 0.68],
      ['translate(-2px,1.2px) rotate(22deg)', undefined],
    ]);
    assert.deepEqual(halfFrames(1).map((f) => f.transform), [
      'translate(0px,0px) rotate(0deg)', 'translate(0px,0px) rotate(-7deg)', 'translate(0px,0px) rotate(-2deg)',
      'translate(2.8px,1.8px) rotate(-30deg)', 'translate(2px,1.2px) rotate(-22deg)',
    ]);
    assert.deepEqual(cardTiming(false, BREAK_MS), { duration: 520, easing: 'ease-out', direction: 'reverse' }, 'mending is the break backwards');
  });

  it('turns each of the button\'s curves round for an undo', () => {
    assert.deepEqual(reversed(MOVE), [0.8, 0, 0.8, 0.2]);
    assert.deepEqual(reversed(EASE), [0.75, 0, 0.75, 0.9]);
    assert.deepEqual(reversed(reversed(MOVE)), [...MOVE]);
    assert.deepEqual(buttonCurves(true), { move: 'cubic-bezier(0.2,0.8,0.2,1)', ease: 'cubic-bezier(0.25,0.1,0.25,1)' });
    assert.deepEqual(buttonCurves(false), { move: 'cubic-bezier(0.8,0,0.8,0.2)', ease: 'cubic-bezier(0.75,0,0.75,0.9)' });
  });

  it('dims the work, darkens the ground and breaks both halves; a tap part way through turns the same motion round', () => {
    const calls: [string, Keyframe[], KeyframeAnimationOptions][] = [];
    const anim = () => ({ playState: 'running', turned: 0, reverse() { this.turned++; } });
    const el = (name: string) => ({ animate: (f: Keyframe[], t: KeyframeAnimationOptions) => (calls.push([name, f, t]), anim()) });
    const sc = { card: el('card'), lit: el('lit'), halves: [el('left'), el('right')] } as unknown as Parameters<typeof playCard>[0];
    const first = playCard(sc, true, [], { lit: '#FFFFFF', off: '#E4E4E0' });
    assert.deepEqual(calls.map((c) => [c[0], c[2].duration, c[2].direction]), [
      ['lit', 1050, 'normal'], ['card', 1050, 'normal'], ['left', 520, 'normal'], ['right', 520, 'normal'],
    ]);
    assert.deepEqual(calls[0]![1], [{ opacity: 1 }, { opacity: 0.5 }]);
    assert.deepEqual(calls[1]![1], [{ backgroundColor: '#FFFFFF' }, { backgroundColor: '#E4E4E0' }]);
    const again = playCard(sc, false, first, { lit: '#FFFFFF', off: '#E4E4E0' });
    assert.equal(calls.length, 4, 'no new animation part way through');
    assert.ok(again.length === 4 && again.every((a, i) => a === first[i]), 'the same four animations');
    assert.deepEqual(first.map((a) => (a as unknown as { turned: number }).turned), [1, 1, 1, 1]);
    calls.length = 0;
    first.forEach((a) => Object.assign(a, { playState: 'finished' }));
    playCard(sc, false, first, { lit: '#FFFFFF', off: '#E4E4E0' });
    assert.deepEqual(calls.map((c) => [c[0], c[2].duration, c[2].direction]), [
      ['lit', 1050, 'reverse'], ['card', 1050, 'reverse'], ['left', 520, 'reverse'], ['right', 520, 'reverse'],
    ], 'once the last motion is over, an undo plays the skip backwards at the same times');
  });
});

describe('the Skip pill on the screen, read as text', () => {
  const src = readFileSync(new URL('../../src/app/screens/week-view/week-view.ts', import.meta.url), 'utf8');
  const css = readFileSync(new URL('../../src/app/screens/week-view/week-view.css', import.meta.url), 'utf8');
  const base = readFileSync(new URL('../../src/legacy/src/css/base.css', import.meta.url), 'utf8');

  it('draws the pill on the card, outside the part that dims, and the undo is the same pill', () => {
    assert.match(src, /@if \(k\.skip; as sk\) \{<button type="button" \[class\]="'tw-skip' \+ \(sk\.on \? ' on' : ''\)"[^>]*\(click\)="skip\(k, \$event\)">/);
    assert.match(src, /\{\{ sk\.on \? 'Skipped' : sk\.label \}\}<\/button>\}\n\s*<div class="tw-lit">/, 'the pill sits before the dimming wrapper');
    assert.match(src, /\(k\.skip && k\.skip\.on \? ' off' : ''\)/, 'a skipped card wears off');
    assert.match(src, /'tw-dbl' \+ \(k\.skip && k\.skip\.on \? ' broken' : ''\)/, 'its dumbbell is broken while it is skipped');
    assert.match(src, /<g class="tw-dbl-l"><path d="M3 10v4M6 8v8M9 10v4M9 12h3"\/><\/g><g class="tw-dbl-r"><path d="M15 10v4M18 8v8M21 10v4M15 12h-3"\/><\/g>/, 'the dumbbell in two halves meeting at the bar\'s middle');
    assert.match(src, /\(bt\.sunk \? ' sunk' : ''\)" \[disabled\]="bt\.sunk"/, 'a sunk button takes no taps');
  });

  it('writes through the legacy skipPart on a timer after the press, reads the parts, and plays the card from the same moment', () => {
    assert.match(src, /this\.bridge\.call\('skipPart', k\.week, k\.key, k\.kind\)/);
    assert.match(src, /parts: b\.call\('getPartSkips'\)/);
    assert.match(src, /window\.setTimeout\(\(\) => \{[\s\S]*?write\(\);[\s\S]*?playCard\([\s\S]*?\}, POP\.inMs\);/);
    assert.match(src, /days\.style\.setProperty\('--skip-ms', CARD_MS \+ 'ms'\)/, 'the buttons move over the card\'s slow time');
  });

  it('styles the dark card at the motion\'s own numbers, in both themes', () => {
    assert.match(css, /\.tw-card\.off \.tw-lit\{opacity:\.5;\}/, 'half, the motion\'s DIM');
    assert.match(css, /\.tw-dbl\.broken \.tw-dbl-l\{transform:translate\(-2px,1\.2px\) rotate\(22deg\);\}/, 'the break\'s resting pose');
    assert.match(css, /\.tw-dbl\.broken \.tw-dbl-r\{transform:translate\(2px,1\.2px\) rotate\(-22deg\);\}/);
    assert.match(css, /\.tw-btn\.sunk\{[^}]*transform:translateY\(1px\) scale\(\.985\);/);
    assert.match(css, /\.tw-days\.skipping \.tw-btn\{transition:transform var\(--skip-ms\) var\(--skip-move\)/);
    assert.equal((base.match(/--card-off:#E4E4E0;/g) || []).length, 1, 'by day');
    assert.equal((base.match(/--card-off:#090909;/g) || []).length, 2, 'at night, in both night blocks');
  });
});
