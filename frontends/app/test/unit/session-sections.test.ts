// The session sheet's sections and exercise cards (src/app/screens/day-detail/session-sections-model.ts, architecture
// phase E), against the legacy buildSectionsHTML and buildExItem they replace: which labels show, how a round is headed,
// reduced or struck through, and each card's controls, set rows, deltas, load cells, reuse pill and stale warning. The
// legacy helpers are stand-ins with fixed answers, so every expected value is typed here from the legacy builders.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { type ExCard, type ExEntry, exItemView, type Rx, type SectionReads, sectionsView } from '../../src/app/screens/day-detail/session-sections-model.ts';

const NOW = 1_800_000_000_000;
const DAY = 86_400_000;
const RX: Record<string, Rx> = {
  '3×8': { sets: 3, target: 8, step: 1 },
  '2×max': { sets: 2, target: null, open: true },
  '3×10–8': { sets: 3, targets: [10, 9, 8] },
};

function reads(over: Partial<SectionReads> = {}, store: Record<string, ExEntry[]> = {}, warn = { shown: false, src: '' }): SectionReads {
  return {
    exKey: (n) => String(n || '').toLowerCase().replace(/\W+/g, '_'),
    entries: (k) => store[k] || [],
    crossLast: () => null,
    week: 4,
    dayKey: 'fri',
    entryDay: (e) => String(e['day']),
    unit: 'lbs',
    isTime: () => false,
    isKB: (n) => /kettlebell/i.test(n),
    isRep: () => false,
    isTrackable: (n) => /barbell|dumbbell/i.test(n),
    hasProgram: true,
    daySection: () => null,
    controlFlags: (_s, i) => ({ canSwap: true, canSkip: i !== 0 }),
    swapOrigin: () => null,
    parseRx: (d) => RX[d] || null,
    rxSuffix: () => '',
    cacheRx: () => undefined,
    setsSummary: (rx) => '[sum ' + rx.sets + ']',
    setsSubLabel: (_rx, _w, _r, logged) => (logged ? 'logged' : 'as prescribed'),
    setsVaried: (a) => a.length > 1 && a.some((x) => +(x as number) !== +(a[0] as number)),
    readDraft: () => null,
    toDispW: (x) => (x === '' || x == null ? '' : +(x as number)),
    isStale: (ts) => !!ts && NOW - ts > 21 * DAY,
    recency: (ts, form) => (form === 'age' ? 'about a month old' : ts ? 'last month' : 'last time'),
    warnShown: () => warn.shown,
    warnSrc: () => warn.src,
    speakWarn: (src) => {
      warn.shown = true;
      warn.src = src;
    },
    stripLeadingSets: (d) => d.replace(/^\d+\s*[x×]\s*/, ''),
    secRounds: (sec) => (sec['rounds'] as number) ?? null,
    ...over,
  };
}
const card = (v: ReturnType<typeof exItemView>): ExCard => {
  assert.equal(v.kind, 'card');
  return v as ExCard;
};

describe('the session sections', () => {
  it('keeps a section label only on the Main and the Primer, and labels the added and hip blocks themselves', () => {
    const v = sectionsView([
      { label: 'Main — Squat', items: [] },
      { label: 'Accessories', items: [] },
      { label: 'Primer', items: [] },
      { _added: true, items: [] },
      { hip: true, label: 'Hips', items: [] },
      { core: true, items: [] },
    ], 2, reads());
    assert.deepEqual(v.map((s) => (s.kind === 'section' ? [s.label, s.body.kind, s.body.kind === 'block' ? s.body.label : s.body.kind === 'core' ? s.body.header : null] : null)), [
      ['Main — Squat', 'block', null],
      [null, 'block', null],
      ['Primer', 'block', null],
      [null, 'block', { text: 'Added by you', markup: true, color: 'var(--signal)' }],
      [null, 'block', { text: 'Hips', markup: true, color: 'var(--hip)' }],
      [null, 'core', 'Core'],
    ]);
  });

  it('heads a round by its count, keeps a label that names its rounds or a round with no count, and numbers it from the base', () => {
    const two = [{ name: 'Push-ups', detail: '3×10' }, { name: 'Lunges', detail: '3×10' }];
    const v = sectionsView([
      { label: 'Finisher', superset: true, rounds: 3, items: two },
      { label: 'Finisher', type: 'superset', rounds: 2, items: two },
      { label: 'Conditioning — 4 Rounds', superset: true, rounds: 4, items: two },
      { label: 'Circuit', superset: true, items: two },
      { label: 'Solo', superset: true, items: [two[0]!] },
    ], 1, reads());
    assert.deepEqual(v.map((s) => (s.kind === 'section' ? [s.body.kind, s.body.kind === 'round' ? [s.body.secIdx, s.body.header] : null] : null)), [
      ['round', [1, '3 Rounds — no rest between exercises · 60s rest between rounds']],
      ['round', [2, '2 Rounds — no rest between exercises · 90s rest between rounds']],
      ['round', [3, 'Conditioning — 4 Rounds']],
      ['round', [4, 'Circuit']],
      ['block', null],
    ], 'a one-movement "round" is straight sets');
    const rows = (v[0] as { body: { items: ExCard[] } }).body.items.map((c) => c.detail);
    assert.deepEqual(rows, ['10 reps', '10 reps'], 'inside a counted round a row states reps only, a bare count read as reps');
  });

  it('strikes a skipped round through with its movement count, and reduces a round down to one movement to straight sets', () => {
    const [skipped, reduced, reducedNoCount] = sectionsView([
      { superset: true, _skipped: true, items: [{ name: 'A' }, { name: 'B' }, { name: 'C' }] },
      { label: 'Finisher', superset: true, rounds: 3, items: [{ name: 'Push-ups', detail: '12 reps', _skipped: true }, { name: 'Goblet squat', detail: '12 reps' }] },
      { superset: true, items: [{ name: 'Plank', detail: '' }, { name: 'Dead bugs', _skipped: true }] },
    ], 0, reads());
    assert.deepEqual(skipped, { kind: 'skippedRound', secIdx: 0, text: 'Conditioning round — 3 movements' });
    assert.equal(reduced!.kind, 'section');
    const b = (reduced as { body: { label: unknown; items: ReturnType<typeof exItemView>[] } }).body;
    assert.deepEqual(b.label, { text: 'Finisher — reduced to straight sets', markup: false, color: 'var(--muted)' });
    assert.deepEqual(b.items.map((x) => (x.kind === 'skipped' ? 'skipped ' + x.name : x.detail)), ['skipped Push-ups', '3×12']);
    const c = (reducedNoCount as { body: { label: { text: string }; items: ExCard[] } }).body;
    assert.deepEqual([c.label.text, c.items[0]!.detail], ['Round — reduced to straight sets', ''], 'no count: the survivor keeps its own prescription');
  });

  it('draws a card logged today: its rows from the log with their deltas, the load cells, the Top set labels, the swap and skip controls', () => {
    const store = { barbell_row: [{ week: 4, day: 'fri', weight: 135, setsDone: [7, 8, 9], setsW: [135, 145, 135], ts: NOW }] };
    const c = card(exItemView({ name: 'Barbell row', detail: '3×8' }, 1, 2, null, reads({ swapOrigin: () => 'Pendlay row' }, store)));
    assert.deepEqual([c.logged, c.swap, c.skip, c.swappedFrom, c.detail, c.rxDetail], [true, { secIdx: 1, itemIdx: 2 }, true, 'Pendlay row', '3×8', '3×8']);
    const st = c.log!.sets!;
    assert.deepEqual([st.head, st.sub, st.varied, st.foot], ['[sum 3]', 'logged', true, 'Top set']);
    assert.deepEqual(st.rows.map((r) => [r.rowId, r.value, r.rx, r.deltaCls, r.deltaText, r.step, r.weight]), [
      ['exset_barbell_row_0', '7', '8', 'exset-delta down', '-1', 1, { id: 'exsetw_barbell_row_0', value: '135', cls: '', unit: 'lbs' }],
      ['exset_barbell_row_1', '8', '8', 'exset-delta', '', 1, { id: 'exsetw_barbell_row_1', value: '145', cls: '', unit: 'lbs' }],
      ['exset_barbell_row_2', '9', '8', 'exset-delta up', '+1', 1, { id: 'exsetw_barbell_row_2', value: '135', cls: '', unit: 'lbs' }],
    ]);
    const ld = c.log!.load!;
    assert.deepEqual([ld.label, ld.value, ld.step, ld.unit], ['Top set', '135', 5, 'lbs'], 'today\'s own load stays in the box');
    assert.deepEqual(ld.reuse, { stale: false, value: 135, text: '135 lbs', rec: 'last month' });
    assert.deepEqual([ld.warn, ld.fill], [null, { stale: false, value: 135, text: 'Fill every set with 135 lbs', rec: 'last month' }]);
  });

  it('draws a fresh card from the prescription, an open set blank as max, and a ladder by its rungs', () => {
    const open = card(exItemView({ name: 'Pull-ups', detail: '2×max' }, 0, 0, null, reads()));
    assert.deepEqual([open.skip, open.log!.load], [false, null], 'the main slot keeps its place; bodyweight work carries no load');
    assert.deepEqual(open.log!.sets!.rows.map((r) => [r.value, r.cls, r.placeholder, r.rx, r.weight]), [['', 'bw-blank', 'max', null, null], ['', 'bw-blank', 'max', null, null]]);
    const ladder = card(exItemView({ name: 'Dumbbell press', detail: '3×10–8' }, 0, 1, null, reads()));
    assert.deepEqual(ladder.log!.sets!.rows.map((r) => [r.value, r.rx, r.weight!.cls]), [['10', '10', 'exw-inherit'], ['9', '9', 'exw-inherit'], ['8', '8', 'exw-inherit']]);
    assert.deepEqual([ladder.log!.sets!.sub, ladder.log!.sets!.foot, ladder.log!.load!.label, ladder.log!.load!.reuse], ['as prescribed', 'Every set', 'Load', null]);
  });

  it('restores a draft: its reps where typed, the target where not, its load cells and its load', () => {
    const c = card(exItemView({ name: 'Barbell row', detail: '3×8' }, 1, 1, null, reads({ readDraft: () => ({ r: ['9', '', '7'], w: ['', '50', ''], L: '45' }) })));
    assert.deepEqual(c.log!.sets!.rows.map((r) => [r.value, r.weight!.value, r.weight!.cls]), [['9', '', 'exw-inherit'], ['8', '50', ''], ['7', '', 'exw-inherit']]);
    assert.equal(c.log!.load!.value, '45');
  });

  it('offers an old load in kilograms, warns once per sheet that it is stale, and names its program only when the warning named another', () => {
    const warn = { shown: false, src: '' };
    const old = (n: string, prog: string) => ({ entry: { weight: 135, ts: NOW - 45 * DAY }, progName: prog, n });
    let from = 'Old Block';
    const r = reads({ unit: 'kg', crossLast: () => old('', from) }, {}, warn);
    const first = card(exItemView({ name: 'Barbell squat', detail: '3×8' }, 1, 1, null, r));
    // 135 lbs × 0.453592 = 61.23 kg, to the nearest half: 61.
    assert.deepEqual(first.log!.load!.reuse, { stale: true, value: 61, text: '61 kg', rec: 'last month' });
    assert.equal(first.log!.load!.warn, 'That 61 kg came from Old Block, about a month old. Still where you are?');
    assert.deepEqual(warn, { shown: true, src: 'Old Block' });
    const second = card(exItemView({ name: 'Barbell bench', detail: '3×8' }, 1, 2, null, r));
    assert.deepEqual([second.log!.load!.warn, second.log!.load!.reuse!.rec], [null, 'last month'], 'the same program is not named again');
    from = 'Other Block';
    const third = card(exItemView({ name: 'Barbell curl', detail: '3×8' }, 1, 3, null, r));
    assert.equal(third.log!.load!.reuse!.rec, 'last month · Other Block');
    const kb = card(exItemView({ name: 'Kettlebell swing', detail: '3×8' }, 1, 4, null, reads({ unit: 'kg' })));
    assert.equal(kb.log!.sets!.rows[0]!.weight!.unit, 'kg');
  });

  it('strikes a skipped exercise through, and offers no controls without a program or for an exercise the athlete added', () => {
    assert.deepEqual(exItemView({ name: 'Face pull', detail: '3×8', _skipped: true }, 1, 1, 3, reads()), { kind: 'skipped', name: 'Face pull' });
    const none = card(exItemView({ name: 'Face pull', detail: '3×8' }, 1, 1, null, reads({ hasProgram: false })));
    assert.deepEqual([none.swap, none.skip], [null, false]);
    const added = card(exItemView({ name: 'Cable fly', detail: '3×8', _addedByUser: true }, 1, 1, null, reads()));
    assert.deepEqual([added.added, added.skip, !!added.swap], [true, false, true]);
    const prose = card(exItemView({ name: 'Walk', detail: 'Easy 10 minutes' }, 1, 1, null, reads()));
    assert.equal(prose.log, null, 'nothing to log: no log surface');
  });
});
