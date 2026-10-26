// What the athlete can change on a session before training it (docs/decisions/session-edits.md): D248 (P-MAINSKIP), the
// main lift takes the minus, and D250 (P-WILDEDIT), the Wildcard's swap and minus act on the Wildcard, never on a
// program day. Expected values are typed from the rulings, the legacy markup's own words, and the Wildcard pool's text
// ("Max Effort Bench" in RAND_POOLS: Main, Barbell bench press; an Accessory round of Dumbbell incline press and Barbell
// row; Core). The page is booted with its document: HALF_MANNY (seed pinned, equal to itself built twice) active in
// week 1 with the session sheet last on Monday, whose own cards include a Barbell row.
import { describe, test } from 'vitest';
import assert from 'node:assert/strict';
import { fixtures, loadApp, pinClock } from '../support/app.ts';
import { type ExCard, type ExSection, sectionsView } from '../../frontends/app/src/app/screens/day-detail/session-sections-model.ts';
import { sectionReads } from '../../frontends/app/src/app/screens/day-detail/session-sections-reads.ts';

const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x)) as T;
const CLOCK = '2026-10-25T10:00:00';

/** A page with its document and Mario's program active, the session sheet on week 1 Monday, toasts kept in order. */
function boot(cfgOver: Record<string, unknown> = {}): any {
  const X = loadApp({ dom: true }) as any;
  pinClock(X, CLOCK);
  const cfg = { ...clone(fixtures.HALF_MANNY), ...cfgOver };
  const a = X.buildProgram(clone(cfg));
  assert.equal(JSON.stringify(a), JSON.stringify(X.buildProgram(clone(cfg))), 'the program equals itself built twice');
  X.ctx.__P = Object.assign(a, { cfg });
  X.ctx.__toasts = [];
  X.eval("activeProg=__P;activeProgId='P1';currentWeek=1;currentDayKey='mon';showToast=function(m){__toasts.push(m);};");
  return X;
}
const lastToast = (X: any): string => X.ctx.__toasts[X.ctx.__toasts.length - 1];
const store = (X: any): string => JSON.stringify([...X.localStorage._map.entries()].sort());
const html = (X: any, id: string): string => String(X.els[id] ? X.els[id].innerHTML : '');
/** The handler a card's control runs: the onclick of the named control in the card's name row. */
function control(markup: string, name: string, fn: string): string {
  const row = markup.split('<div class="ex-namerow"><span class="ex-name">' + name + '</span>')[1];
  assert.ok(row !== undefined, 'a card named ' + name);
  const m = row.split('</div>')[0]!.match(new RegExp('onclick="(' + fn + '\\([^"]*\\))"'));
  assert.ok(m, name + ' carries ' + fn + ': ' + row.slice(0, 300));
  return m[1]!.replace(/\\'/g, "'");
}
/** The Wildcard drawn on See All with the first draw: Max Effort Bench, the first workout of the first pool. */
function wildcard(X: any): string {
  // lastRandIdx back to none: the draw never repeats the last one, so a second draw at 0 would never end.
  X.eval("randFilter='all';Math.random=function(){return 0;};_setLastRandIdx(-1);openRandom();");
  const body = html(X, 'randBody');
  assert.ok(body.includes('<div class="rand-title">Max Effort Bench</div>'), 'the draw is Max Effort Bench');
  return body;
}

describe('D248: the main lift takes the minus', () => {
  test('the main slot is skippable and keeps its swap; a note still takes neither', () => {
    const f = (loadApp() as any).eval('exControlFlags');
    const main = { label: 'Main — Back squat', items: [{ name: 'Back squat', detail: '5×5' }] };
    assert.deepEqual(clone(f(main, 0, main.items[0])), { isNote: false, inSS: false, isMainSlot: true, canSwap: true, canSkip: true });
    const note = { name: '<svg viewBox="0 0 1 1"></svg> Breathe between rounds.', detail: '' };
    const n = f({ label: 'Accessory', items: [note] }, 0, note);
    assert.deepEqual([n.canSwap, n.canSkip], [false, false]);
  });

  test("HALF_MANNY's main lift carries the minus, skips to a stub stored for the day, and comes back", () => {
    const X = boot();
    const day = X.ctx.__P.weeks[1].mon;
    assert.match(day.sections[0].label, /^Main/);
    const main: string = day.sections[0].items[0].name;
    X.eval("openDetail('mon',activeProg.weeks[1].mon)");
    const tap = control(html(X, 'detailBody'), main, 'skipExercise');
    assert.equal(tap, "skipExercise('" + main + "')");
    X.eval(tap);
    assert.equal(day.sections[0].items[0]._skipped, true);
    assert.ok(html(X, 'detailBody').includes('<span class="ex-skipped-name">' + main + '</span><button class="ex-skipped-undo" onclick="unskipExercise(\'' + main + '\')">Put it back</button>'));
    assert.deepEqual(X.eval('getDayEdits')('P1')['w1_mon'].skip, [main]);
    assert.equal(lastToast(X), main + ' is off today. Tap to put it back.');
    X.eval("unskipExercise('" + main + "')");
    assert.equal(day.sections[0].items[0]._skipped, undefined);
    assert.equal(lastToast(X), main + ' is back on the card.');
  });

  test('a main lift with nothing to swap to carries the minus the empty sheet points at', () => {
    // The measured case: lowback/protect on home_full, a vertical pull main with every vertical pull already on the card.
    const X = boot({ equipment: 'home_full', seed: 1013, liftingFocus: 'support_prevention', experience: 'beginner', injury: { region: 'lowback', tier: 'protect' } });
    X.ctx.__P.weeks[1].mon = { ...X.ctx.__P.weeks[1].mon, rest: false, cardio: null, sections: [
      { label: 'Main — Chinups', items: [{ name: 'Chinups', detail: '3×5 — RPE 7' }] },
      { label: 'Pull superset', superset: true, items: [{ name: 'Weighted chinups', detail: '3×5' }, { name: 'Neutral-grip chinups', detail: '3×6' }] },
      { label: 'Accessory', items: [{ name: 'Assisted pullups', detail: '3×8' }] },
    ] };
    X.eval('openSwapSheet(0,0)');
    assert.ok(html(X, 'swapBody').includes('Nothing else in your kit does this job. Keep it, or drop it with the minus and move on.'));
    X.eval("openDetail('mon',activeProg.weeks[1].mon)");
    assert.equal(control(html(X, 'detailBody'), 'Chinups', 'skipExercise'), "skipExercise('Chinups')");
  });
});

describe('D250: the Wildcard edits the Wildcard', () => {
  test('every swap on a Wildcard card opens the sheet for that card, over the Wildcard', () => {
    const X = boot();
    const body = wildcard(X);
    const names = ['Barbell bench press', 'Dumbbell incline press', 'Barbell row'];
    for (const n of names) {
      X.eval("document.getElementById('swapOutName').textContent=''");
      X.eval(control(body, n, 'openSwapSheet'));
      assert.equal(X.els.swapOutName.textContent, n);
    }
    const z = (sel: string): number => +((X.html as string).match(new RegExp(sel + '\\{[^}]*z-index:(\\d+)')) || [])[1]!;
    assert.ok(z('#swapOverlay') > z('\\.rand-overlay'), 'the swap sheet z-index ' + z('#swapOverlay') + ' over the Wildcard ' + z('\\.rand-overlay'));
  });

  test("a pick changes the Wildcard's card only, and its chip puts it back", () => {
    const X = boot();
    const body = wildcard(X);
    const prog = JSON.stringify(X.ctx.__P), saved = store(X), pools = JSON.stringify(X.eval('RAND_POOLS'));
    X.eval(control(body, 'Barbell bench press', 'openSwapSheet'));
    const pick = (html(X, 'swapBody').match(/onclick="applySwapChoice\('((?:[^'\\]|\\.)*)'\)"/) || [])[1];
    assert.ok(pick, 'the sheet offers a pick');
    X.ctx.__to = pick;
    X.eval('applySwapChoice(__to)');
    const swapped = html(X, 'randBody');
    assert.ok(swapped.includes('<span class="ex-name">' + pick + '</span>'), pick + ' is on the Wildcard');
    assert.ok(!swapped.includes('<span class="ex-name">Barbell bench press</span>'));
    assert.ok(swapped.includes('<span class="ex-swapchip-lbl">SWAPPED IN</span> for Barbell bench press'));
    assert.ok(lastToast(X).startsWith(pick + ' in, barbell bench press out.'), lastToast(X));
    assert.equal(JSON.stringify(X.ctx.__P), prog, 'the program is untouched');
    assert.equal(store(X), saved, 'nothing is stored: no swap record, no swap count, no snapshot');
    assert.equal(control(swapped, pick, 'openSwapSheet'), "openSwapSheet(0,0,'wild')", 'the swapped-in card swaps on the Wildcard too');
    const undo = (swapped.match(/onclick="(undoSwap\([^"]*\))"/) || [])[1]!.replace(/\\'/g, "'");
    X.eval(undo);
    const back = html(X, 'randBody');
    assert.ok(back.includes('<span class="ex-name">Barbell bench press</span>') && !back.includes('SWAPPED IN'));
    assert.ok(back.includes('<div class="ex-detail">Work to 1–3RM, then 3×3 @ RPE 9</div>'), 'the pool\'s own prescription is back');
    assert.equal(lastToast(X), 'Barbell bench press is back on the card.');
    assert.equal(JSON.stringify(X.ctx.__P), prog);
    assert.equal(store(X), saved);
    assert.equal(JSON.stringify(X.eval('RAND_POOLS')), pools, 'the pools are never changed');
  });

  test("the minus and the round minus strike the Wildcard's cards and leave Monday's Barbell row on", () => {
    const X = boot();
    const body = wildcard(X);
    const mon = X.ctx.__P.weeks[1].mon;
    assert.ok(mon.sections.some((s: ExSection) => s.items.some((i) => i.name === 'Barbell row')), "Monday's card has a Barbell row");
    const prog = JSON.stringify(X.ctx.__P), saved = store(X);
    X.eval(control(body, 'Barbell row', 'skipExercise'));
    assert.ok(html(X, 'randBody').includes('<span class="ex-skipped-name">Barbell row</span><button class="ex-skipped-undo" onclick="unskipExercise(\'Barbell row\',\'wild\')">Put it back</button>'));
    assert.equal(lastToast(X), 'Barbell row is off today. Tap to put it back.');
    assert.equal(JSON.stringify(X.ctx.__P), prog, "Monday's Barbell row stays on");
    assert.equal(store(X), saved);
    X.eval("unskipExercise('Barbell row','wild')");
    assert.ok(html(X, 'randBody').includes('<span class="ex-name">Barbell row</span>'));
    const round = (body.match(/onclick="(skipSuperset\([^"]*\))"/) || [])[1]!.replace(/\\'/g, "'");
    X.eval(round);
    assert.ok(html(X, 'randBody').includes('<span class="ex-skipped-name">Accessory — 2 movements</span>'));
    assert.equal(lastToast(X), 'Round is off today. Tap to put it back.');
    assert.equal(JSON.stringify(X.ctx.__P), prog, "Monday's rounds stay on");
    assert.equal(store(X), saved);
  });

  test('closing the Wildcard clears its draw, and the next draw starts clean', () => {
    const X = boot();
    const body = wildcard(X);
    X.eval(control(body, 'Barbell row', 'skipExercise'));
    assert.notEqual(X.eval('_wildDraw'), null);
    X.eval('closeRandom()');
    assert.equal(X.eval('_wildDraw'), null);
    const again = wildcard(X);
    assert.ok(!again.includes('ex-skipped') && again.includes('<span class="ex-name">Barbell row</span>'));
  });

  test("Random Workout's cards read the Wildcard's own day and its own swaps, the session sheet's its own", () => {
    const X = boot();
    wildcard(X);
    const bridge = { call: <T,>(n: string, ...a: unknown[]): T => X.window[n](...a) as T, global: <T,>(n: string): T => X.eval(n) as T };
    const card = (): ExCard => {
      const v = sectionsView(X.eval('_wildDraw').sections, undefined, sectionReads(bridge, 'wild'));
      const s = v[0]!;
      assert.ok(s.kind === 'section' && s.body.kind === 'block');
      return s.body.items[0] as ExCard;
    };
    const c = card();
    assert.deepEqual(clone([c.name, c.swap, c.skip, c.swappedFrom]), ['Barbell bench press', { secIdx: 0, itemIdx: 0 }, true, null]);
    X.eval("openSwapSheet(0,0,'wild')");
    const pick = (html(X, 'swapBody').match(/onclick="applySwapChoice\('((?:[^'\\]|\\.)*)'\)"/) || [])[1]!;
    X.ctx.__to = pick;
    X.eval('applySwapChoice(__to)');
    assert.deepEqual([card().name, card().swappedFrom], [pick, 'Barbell bench press']);
    const own = sectionReads(bridge).daySection(0) as ExSection;
    assert.equal(own, X.ctx.__P.weeks[1].mon.sections[0], "the session sheet's reads stay on Monday");
  });
});
