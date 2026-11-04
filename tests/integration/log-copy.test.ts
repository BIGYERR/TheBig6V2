// The cardio log's words (D271 P-LOGCOPY, docs/decisions/log-copy.md): the label over each sport's fields, the hint
// under a speed session, and the labels of the readout that works out the third number, with no dash joining words.
// The form is drawn by the page (cardioFieldHTML, updateDoseDerived) and by the iOS app's Angular template
// (cardio-fields.ts); both are read here.
//
// Oracles: the ruling's After column and the form's unchanged words, typed by hand; the copy rule from CLAUDE.md (no
// mid-sentence hyphen or em-dash in anything the athlete reads). None asks the app what the words should be.
// The rows for a time dose, a distance dose, the two rep doses and the ride pass on the release before D271 too, on
// purpose: they guard words the ruling must not change (its Does not change line), beside the rows it does.
import { describe, test } from 'vitest';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { APP, REPO, appFunction, loadApp, pinClock } from '../support/app.ts';

const HINT = 'Whole session off the watch. Warm up, efforts and recoveries all count.';
const BEFORE = [
  'Run — actual distance & pace',
  'Whole session off the watch — warm up, efforts and recoveries all count.',
  'Swim — actual yardage',
  'Work volume — derived',
  'Rep pace — derived',
  'Pace — derived',
];
const DASH = /—|\S-\S/;

/** The text of every <label> and every f-sub line a form prints, tags (the sport icon) stripped. */
function words(html: string): { labels: string[]; subs: string[] } {
  const text = (s: string): string => s.replace(/<[^>]*>/g, '').trim();
  return {
    labels: [...html.matchAll(/<label\b[^>]*>([\s\S]*?)<\/label>/g)].map((m) => text(m[1]!)),
    subs: [...html.matchAll(/<div class="f-sub"[^>]*>([\s\S]*?)<\/div>/g)].map((m) => text(m[1]!)),
  };
}

describe('the page\'s cardio form (cardioFieldHTML)', () => {
  const IA = loadApp();
  pinClock(IA, '2026-11-03T10:00:00Z');
  const W = IA.window;
  const form = (sport: string, dose: Record<string, unknown> | null, sub: string): string => W['cardioFieldHTML'](sport, {}, dose, sub) as string;
  // [what, sport, dose, subtype, labels, f-sub lines]
  const TABLE: [string, string, Record<string, unknown> | null, string, string[], string[]][] = [
    ['a speed run with no dose', 'run', null, 'Speed Run — Intervals', ['Log the run'], [HINT]],
    ['a tempo with no dose', 'run', null, 'Speed Run — Tempo', ['Log the run'], [HINT]],
    ['a long run with no dose', 'run', null, 'Long Run', ['Log the run'], []],
    ['a time dose', 'run', { k: 'time', mins: 15, tgt: 800, cap: 760 }, 'Recovery Run', ['Log the run'], ['Shows the plan. Move it to match the watch.', 'Off the watch.']],
    ['a distance dose', 'run', { k: 'dist', mi: 3.1, tgt: 800 }, 'Long Run', ['Log the run'], ['Shows the plan. Move it to match the watch.', 'Off the watch.']],
    ['reps by distance', 'run', { k: 'reps_dist', reps: 8, m: 400, tgt: 450 }, 'Speed Run — Intervals', ['Reps completed'], ['what the watch showed on most reps']],
    ['reps by time', 'run', { k: 'reps_time', reps: 6, mins: 3, tgt: 480 }, 'Speed Run — Intervals', ['Reps completed', 'Miles in the work reps'], ['Leave out the easy jog between reps.']],
    ['a ride', 'bike', null, '', ['Log the ride'], []],
    ['a swim', 'swim', null, '', ['Log the swim'], []],
  ];
  for (const [what, sport, dose, sub, labels, subs] of TABLE) {
    test(`${what}: the labels and lines read as the ruling says, with no dash`, () => {
      const got = words(form(sport, dose, sub));
      assert.deepEqual(got, { labels, subs });
      for (const t of [...got.labels, ...got.subs]) assert.doesNotMatch(t, DASH, t);
    });
  }
});

describe('the page\'s readout (updateDoseDerived)', () => {
  const _clkMS = appFunction('_clkMS');
  const _fmtPaceMi = appFunction('_fmtPaceMi', { _clkMS });
  const _parseClock = appFunction('_parseClock');
  const doseDerived = appFunction('doseDerived', { _parseClock, _fmtPaceMi });
  const els: Record<string, { id: string; value: string; innerHTML: string }> = {};
  const document = { getElementById: (id: string) => els[id] || (els[id] = { id, value: '', innerHTML: '' }) };
  /** The readout's rows as [label, value] for one dose and the four fields' values. */
  function rows(dose: Record<string, unknown>, v: { mins?: string; dist?: string; reps?: string; rep?: string }): [string, string][] {
    for (const k of Object.keys(els)) delete els[k];
    document.getElementById('log_run_mins').value = v.mins || '';
    document.getElementById('log_run_dist').value = v.dist || '';
    document.getElementById('log_run_reps').value = v.reps || '';
    document.getElementById('log_run_rep_time').value = v.rep || '';
    appFunction('updateDoseDerived', { document, doseDerived, _curLogDose: dose })();
    const html = String(els['doseDerived']!.innerHTML);
    return [...html.matchAll(/<span class="d-lbl">([^<]*)<\/span><span class="d-val[^"]*">([^<]*)/g)].map((m) => [m[1]!, m[2]!]);
  }
  const TIME = { k: 'time', mins: 15, tgt: 800 };
  const DIST = { k: 'dist', mi: 3, tgt: 800 };
  const REPS = { k: 'reps_dist', reps: 8, m: 400, tgt: 450 };

  test('a time dose: Your pace, asking for distance, then 15 min over 1.25 mi as 12:00/mi', () => {
    assert.deepEqual(rows(TIME, {}), [['Your pace', 'enter distance']]);
    assert.deepEqual(rows(TIME, { dist: '1.25' }), [['Your pace', '12:00/mi']]);
  });
  test('a distance dose: Your pace, asking for minutes, then 36 min over the planned 3 mi as 12:00/mi', () => {
    assert.deepEqual(rows(DIST, {}), [['Your pace', 'enter minutes']]);
    assert.deepEqual(rows(DIST, { mins: '36' }), [['Your pace', '12:00/mi']]);
  });
  test('reps by distance: Your rep pace before a rep time, then Work done and Your pace', () => {
    assert.deepEqual(rows(REPS, {}), [['Your rep pace', 'enter a rep time']]);
    // 8 × 400 m is 3200 m, 1.99 mi; a 1:52 rep over 400 m (0.2485 mi) is 450.6 s/mi, 7:31/mi.
    assert.deepEqual(rows(REPS, { reps: '8', rep: '1:52' }), [['Work done', '1.99 mi'], ['Your pace', '7:31/mi']]);
  });
});

describe('the words that went', () => {
  test('none of the six dashed strings is anywhere in the page', () => {
    const page = readFileSync(APP, 'utf8');
    for (const s of BEFORE) assert.ok(!page.includes(s), s);
  });
});

describe('the iOS app\'s cardio form (cardio-fields.ts)', () => {
  const src = readFileSync(join(REPO, 'frontends/app/src/app/screens/day-detail/cardio-fields.ts'), 'utf8');
  const tpl = src.slice(src.indexOf('template: `'), src.indexOf('`,', src.indexOf('template: `')));
  const labelWords = [...tpl.matchAll(/label\('(\w+)', ' ([^']*)'\)/g)].map((m) => m[1] + ': ' + m[2]);
  const subs = [...tpl.matchAll(/<div class="f-sub"[^>]*>([^<]*)<\/div>/g)].map((m) => m[1]!.trim());
  const plain = [...tpl.matchAll(/<label>([^<]*)<\/label>/g)].map((m) => m[1]!.trim());

  test('every sport\'s label says Log the run, the ride or the swim', () => {
    assert.deepEqual(labelWords, ['run: Log the run', 'run: Log the run', 'run: Log the run', 'bike: Log the ride', 'swim: Log the swim']);
  });
  test('the speed session hint is the page\'s, word for word', () => {
    assert.ok(subs.includes(HINT), subs.join(' | '));
  });
  test('no label or line in the template joins words with a dash', () => {
    for (const t of [...labelWords, ...subs, ...plain]) assert.doesNotMatch(t, DASH, t);
    for (const s of BEFORE) assert.ok(!tpl.includes(s), s);
  });
});
