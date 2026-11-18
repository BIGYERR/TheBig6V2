// Progress, the Expo app's against today's page (MIGRATION.md phase 3, row 4). Two apps over one stored state: the
// page in the VM harness (a Phone), drawn through the Angular screen's own models handed the page's readers, as
// frontends/app/src/app/screens/progress/progress-screen.ts render() hands them; and the Expo app's progressView
// (frontends/native/src/progress/progress-screen.ts) over its own SQLite store. After every tap the two are held
// equal: every word and number of the screen (the chips and the bar, each chart and card, the Lift Ledger, the
// journal), the four values the page keeps between draws, each toast, and every ia_ key, value for value.
//
// The reference is today's page on purpose, as in every native-* walker: Progress stays the page's until the cutover.
// What the program list does (archiving, a second program) is not built in the beta: the walker makes it on the page
// and carries the keys over, and says so where it does (carry).
import assert from 'node:assert/strict';
import type { StateStore } from '@ia/core/engine/state-store.ts';
import { chartChunks, journalWeeks, viewedProgram, weeklySums } from '../../frontends/app/src/app/screens/progress/progress-model.ts';
import { chipsView } from '../../frontends/app/src/app/screens/progress/program-chips-model.ts';
import { blockType, markupBlocks } from '../../frontends/native/src/progress/card-markup.ts';
import type { CardSpec } from '../../frontends/native/src/progress/charts/chart-card-model.ts';
import { paint, pictureBox, svgProps } from '../../frontends/native/src/progress/paint.ts';
import {
  type ProgressState, type ProgressView, afterDelete, askPurge, cancelConfirm, estimateLine, estimatorUnit, markupParts, newProgressState, openProgress,
  progressView, setCalcLift, showProgram,
} from '../../frontends/native/src/progress/progress-screen.ts';
import { deleteProgram, restoreProgram } from '../../frontends/native/src/progress/progress-writes.ts';
import { DAY, NIGHT } from '../../frontends/native/src/theme.ts';
import { iso } from './native-deck-swap.ts';
import { launchNow } from './native-this-week.ts';
import { sqliteTestStore } from './sqlite-kv.ts';
import { Phone, at, firstWeek, training } from './stored-state.ts';

const J = JSON.stringify;
const plain = <T>(x: T): T => JSON.parse(J(x)) as T;
const held = (s: StateStore): Record<string, string> => Object.fromEntries(s.keys().filter((k) => k.startsWith('ia_')).sort().map((k) => [k, s.get(k)!]));

/** What the walks compared so far. */
export interface ProgressTally {
  draws: number; empties: number; dots: number; cards: number; ledgers: number; mains: number; lines: number; ladder: number; other: number;
  journalWeeks: number; journalEntries: number; swaps: number; jogs: number; notes: number;
  chips: number; bars: number; confirms: number; warned: number; restores: number; deletes: number; removed: number; folds: number;
  estimates: number; estimatesEmpty: number; taps: number; keys: number; cardKinds: Record<string, number>;
  /** What the drawer read off the run cards (readCard): heads, bodies, footers, blocks, bold runs, pictures and their elements. */
  cardParts: Record<string, number>;
}
export const progressTally = (): ProgressTally => ({
  draws: 0, empties: 0, dots: 0, cards: 0, ledgers: 0, mains: 0, lines: 0, ladder: 0, other: 0, journalWeeks: 0, journalEntries: 0, swaps: 0, jogs: 0, notes: 0,
  chips: 0, bars: 0, confirms: 0, warned: 0, restores: 0, deletes: 0, removed: 0, folds: 0, estimates: 0, estimatesEmpty: 0, taps: 0, keys: 0, cardKinds: {}, cardParts: {},
});

/**
 * Which of today's eight run cards a spec is: its title, and where two builders share one, what tells them apart
 * (the easy bands' footer under the zone chart's title, the empty state's words under the easy effort chart's).
 */
export function cardKind(spec: { title: string; foot: string | null; body: string | null }): string {
  const title = spec.title.replace(/<svg[\s\S]*?<\/svg>/g, '').trim();
  if (/^The two bars should not touch/.test(spec.foot || '')) return title + ' (the easy bands)';
  if (/This chart holds effort constant/.test(spec.body || '')) return title + ' (its empty state)';
  return title;
}

/** A colour the run cards name, in a palette: typed here, not asked of the app's own reader. */
const TOKEN: Record<string, 'run' | 'red' | 'hip' | 'muted' | 'text'> = { 'var(--run)': 'run', 'var(--red)': 'red', 'var(--hip)': 'hip', 'var(--muted)': 'muted', 'var(--text)': 'text' };
/** The props react-native-svg's six elements take from a run card's picture. */
const SVG_PROPS = new Set(['x', 'y', 'x1', 'y1', 'x2', 'y2', 'cx', 'cy', 'r', 'rx', 'width', 'height', 'd', 'points', 'fill', 'stroke', 'strokeWidth', 'strokeDasharray', 'fontSize', 'fontWeight', 'textAnchor', 'fontFamily', 'opacity']);
const near = (a: number | undefined, b: number, what: string): void => assert.ok(a !== undefined && Math.abs(a - b) < 1e-9, what + ': ' + a + ' against ' + b);

/**
 * One run card as the Expo app's drawer reads it (RunCard, ChartCards.tsx), against this file's own reading of the
 * markup the page wrote: the title's icon and words; every word of the head, the body and the footer, in order;
 * each <b> as a bold run in the colour it names; each <div> as a block with the type its inline style names; every
 * element of the picture under react-native-svg's names, painted by day and by night, every text in the app's face;
 * the picture laid the full width with room past its edge. Counted into `T.cardParts`.
 */
export function readCard(spec: CardSpec, T: ProgressTally, what: string): void {
  const n = (k: string, by = 1): void => { T.cardParts[k] = (T.cardParts[k] || 0) + by; };
  const title = markupParts(spec.title);
  assert.ok(title.icon && /^<svg[\s\S]*<\/svg>$/.test(title.icon), what + ': the title opens with its icon');
  assert.equal(title.text, spec.title.replace(/<svg[\s\S]*?<\/svg>/, '').trim(), what + ': the title\'s words');
  assert.ok(title.text.length > 5 && !/[<>]/.test(title.text), what + ': the title is plain words');
  assert.ok(TOKEN[spec.color], what + ': the card\'s colour is one the cards name: ' + spec.color);
  n('card in ' + spec.color);
  for (const p of [DAY, NIGHT]) assert.equal(paint(spec.color, p), p[TOKEN[spec.color]!], what + ': the card\'s colour in the palette');
  for (const part of ['head', 'body', 'foot'] as const) {
    const html = spec[part];
    if (html === null) continue;
    n(part);
    const blocks = markupBlocks(html);
    assert.equal(blocks.map((b) => b.runs.map((r) => r.text).join('')).join(''), html.replace(/<[^>]*>/g, ''), what + ': every word of the ' + part + ', in order');
    const bolds = [...html.matchAll(/<b(?: style="color:([^";]+)")?>([^<]*)<\/b>/g)].map((m) => [m[2]!, m[1] ?? null]);
    assert.equal(bolds.length, (html.match(/<b[ >]/g) || []).length, what + ': this file read every <b> of the ' + part);
    assert.deepEqual(blocks.flatMap((b) => b.runs.filter((r) => r.bold).map((r) => [r.text, r.color])), bolds, what + ': the bold runs of the ' + part + ' and their colours');
    for (const [, c] of bolds) { n('bold'); if (c !== null) { n('bold in a colour'); assert.ok(TOKEN[c], what + ': a bold colour the cards name: ' + c); } }
    const divs = [...html.matchAll(/<div style="([^"]*)">/g)].map((m) => m[1]!);
    assert.equal(divs.length, (html.match(/<div[ >]/g) || []).length, what + ': this file read every <div> of the ' + part);
    const styled = blocks.filter((b) => b.style);
    assert.equal(styled.length, divs.length, what + ': a block for each <div> of the ' + part);
    // A footer is one run of words under the footer's own type; a head and a body hold no word outside a block.
    if (part === 'foot') assert.ok(blocks.length === 1 && blocks[0]!.style === null, what + ': the footer is one block of the footer\'s type');
    else assert.equal(blocks.length, styled.length, what + ': the ' + part + ' holds no word outside a block');
    styled.forEach((b, i) => {
      n('block');
      const css = divs[i]!, one = (re: RegExp): string | null => { const m = re.exec(css); return m ? m[1]! : null; };
      const size = one(/(?:^|;)font-size:([0-9.]+)px/), color = one(/(?:^|;)color:([^;]+)/), line = one(/(?:^|;)line-height:([0-9.]+)(?:;|$)/), gap = one(/(?:^|;)margin-bottom:([0-9.]+)px/),
        track = one(/(?:^|;)letter-spacing:(-?[0-9.]+)em/);
      assert.ok(size !== null && color !== null && TOKEN[color], what + ': a block names its size and a colour the cards name: ' + css);
      for (const p of [DAY, NIGHT]) {
        const t = blockType(b.style!, p);
        assert.equal(t.fontFamily, 'Helvetica Neue');
        assert.equal(t.fontSize, +size, what + ': the block\'s size');
        assert.equal(t.color, p[TOKEN[color]!], what + ': the block\'s colour in the palette');
        assert.equal(t.fontWeight, /(?:^|;)font-weight:700/.test(css) ? '700' : undefined, what + ': the block\'s weight');
        if (line === null) assert.equal(t.lineHeight, undefined); else near(t.lineHeight, +line * +size, what + ': the block\'s line height in points');
        if (track === null) assert.equal(t.letterSpacing, undefined); else near(t.letterSpacing, +track * +size, what + ': the block\'s tracking in points');
        assert.equal(t.marginBottom, gap === null ? undefined : +gap, what + ': the room under the block');
      }
      if (/(?:^|;)font-family:var\(--font-display\)/.test(css)) { n('display block'); assert.equal(b.style!.display, true); } else assert.equal(b.style!.display, false);
      if (line !== null) n('block with a line height');
      if (track !== null) n('block with a tracking');
      if (gap === null) n('block with no room under it');
    });
  }
  const g = spec.svg;
  if (!g) { n('card with no picture'); return; }
  n('picture');
  const box = pictureBox('0 0 ' + g.w + ' ' + g.h, 'width:100%;height:auto;overflow:visible');
  assert.deepEqual([box.viewBox, box.width, box.height], [[-6, -6, g.w + 12, g.h + 12].join(' '), null, null], what + ': the picture is laid the full width, six units kept past each edge');
  for (const e of g.els) {
    n(e.el);
    assert.ok(['line', 'rect', 'circle', 'path', 'polygon', 'text'].includes(e.el), what + ': an element the picture draws: ' + e.el);
    for (const p of [DAY, NIGHT]) {
      const a = svgProps(e, p, 'Helvetica Neue');
      for (const k of Object.keys(a)) {
        assert.ok(SVG_PROPS.has(k), what + ': a ' + e.el + '\'s ' + k + ' is no prop of react-native-svg');
        assert.ok(!/var\(/.test(a[k]!), what + ': a ' + e.el + '\'s ' + k + ' is painted: ' + a[k]);
      }
      assert.equal(Object.keys(a).length, Object.keys(e.a).length + (e.el === 'text' && !('font-family' in e.a) ? 1 : 0), what + ': every attribute of a ' + e.el + ' is carried');
      if (e.el === 'text') assert.equal(a['fontFamily'], 'Helvetica Neue', what + ': a text is in the app\'s face');
      else assert.equal(a['fontFamily'], undefined, what + ': only a text takes a face');
    }
    if (e.el === 'text' && !('font-family' in e.a)) n('text that names no face');
  }
}

/**
 * Today's screen for the phone as it stands, as plain data: the Angular screen's render() without its write (the
 * page's own renderProgressScreen makes that, and the walker calls it first). The shape is the Expo app's ProgressView.
 */
export function pageProgress(P: Phone): ProgressView | null {
  const call = (name: string, ...a: unknown[]): any => (P.ev(name) as (...x: unknown[]) => unknown)(...a);
  const g = (name: string): any => P.ev(name);
  const all = call('getPrograms');
  if (!all.length) return null;
  const { prog } = viewedProgram(all as { id: string }[], g('progressViewId'), g('activeProgId'), !!g('activeProg'));
  if (!prog) return null;
  const vid = (prog as any).id as string;
  const icon = (n: string, s: number): string => call('asyIcon', n, s);
  const chips = chipsView(all, vid, { activeId: g('activeProgId'), confirmId: g('confirmProgId'), confirmTier: g('confirmTier'), warnsCrossProg: (id) => call('_purgeWarnsCrossProg', id), icon });
  const logs = call('getLogsFor', vid);
  const cfg = (prog as any).cfg || {};
  const tw = (prog as any).totalWeeks || 6;
  const sums = weeklySums(logs, call('getExWeightsFor', vid), tw);
  if (!Object.keys(logs).length) return plain({ vid, chips, empty: 'none', charts: [], journal: null, estimator: false });
  const hist = call('getDayHistFor', vid);
  const goalId = (cfg.cardioGoals && cfg.cardioGoals.run && cfg.cardioGoals.run.id) || '';
  const charts = chartChunks({
    logs, hist, sums, totalWeeks: tw, cfg, cardioTypes: cfg.cardioTypes || [], cut: call('_cutWeek', prog), skip1: call('_partialWeek1', prog),
    raceMi: (g('RACE_DIST_MI') as Record<string, number>)[goalId] || 0,
  }, {
    icon,
    ladderWeekly: (...a) => call('ladderWeekly', ...a), easyVsPrescribed: (...a) => call('easyVsPrescribed', ...a), runsByClass: (...a) => call('runsByClass', ...a),
    easyEffortWeekly: (...a) => call('easyEffortWeekly', ...a), recoveryPaceWeekly: (...a) => call('recoveryPaceWeekly', ...a), plannedVsLogged: (...a) => call('plannedVsLogged', ...a),
    exWeights: () => call('getExWeightsFor', vid), ledgerModel: (...a) => call('ledgerModel', ...a),
    run: {
      pace: (sec) => call('_fmtPaceShort', sec), icon, mileFromRecovery: (sec) => call('_mileFromRecoverySec', sec), halfFromMile: (sec) => call('_halfFromMileSec', sec),
      easyRpeLo: g('EASY_RPE_LO'), easyRpeHi: g('EASY_RPE_HI'), easyMinRuns: g('EASY_MIN_RUNS'), easyZoneMinRuns: g('EASY_ZONE_MIN_RUNS'),
    },
  });
  const labels = g('RPE_LABELS');
  const weeks = journalWeeks(call('getLogsFor', vid), { rpeLabel: (r) => labels[r], jogLines: (rl) => call('restLogLines', rl), icon });
  const journal = weeks.length ? weeks : null;
  const empty = !charts.some((c) => c.kind !== 'ledger' || c.view.mains || c.view.ladder || c.view.other) && !journal ? 'charts' : null;
  return plain({ vid, chips, empty, charts, journal, estimator: true }) as ProgressView;
}

/** The estimator's line as the page's own runCalc writes it, its markup taken off, or '' when it writes none. */
function pageEstimate(P: Phone, weight: string, reps: string): string {
  P.type('calc_weight', weight);
  P.type('calc_reps', reps);
  P.type('calc_result', '');
  const res = P.ev(`document.getElementById('calc_result')`) as { innerHTML?: string; textContent?: string | null };
  res.innerHTML = ''; res.textContent = null;
  P.ev('runCalc()');
  return res.textContent === '' ? '' : String(res.innerHTML || '').replace(/<[^>]+>/g, '');
}

/** Both apps on Progress over one stored state. */
export class TwoProgress {
  readonly P: Phone;
  readonly store: StateStore;
  readonly st: ProgressState = newProgressState();
  readonly T: ProgressTally;
  readonly what: string;
  view: ProgressView | null = null;
  /** The keys the last tap changed in the beta's store (the page's own are held equal to them). */
  wrote: string[] = [];
  private readonly now: number;

  /** `P` is a phone just launched; the beta's store takes its keys as that launch left them. */
  constructor(P: Phone, T: ProgressTally, what: string) {
    this.P = P; this.T = T; this.what = what;
    this.store = sqliteTestStore();
    this.carry();
    this.now = P.ev('Date.now()') as number;
  }

  /** The page's keys carried into the beta's store, whole: for what the beta cannot do yet (a program archived or made). */
  carry(): void {
    for (const k of this.store.keys()) this.store.remove(k);
    for (const [k, v] of Object.entries(this.P.dump())) this.store.set(k, v);
  }

  /** One tap on both, then everything equal. `page` is today's call; `native` makes the same tap and hands back its toast. */
  private tap(name: string, page: string, native: () => string | null): ProgressView | null {
    const what = this.what + ', ' + name;
    const t0 = this.P.toasts.length;
    const pre = held(this.store);
    this.P.ev(page);
    const toast = native();
    const mine = progressView(this.store, this.st, this.now);
    const view = mine ? plain(mine) : null;
    const theirs = pageProgress(this.P);
    assert.deepStrictEqual(view, theirs, what + ': the screen is not today\'s');
    assert.deepStrictEqual([this.st.viewId, this.st.confirmId, this.st.confirmTier, this.st.calcLift],
      [this.P.ev('progressViewId'), this.P.ev('confirmProgId'), this.P.ev('confirmTier'), this.P.ev('calcLift')], what + ': what is kept between draws is not today\'s');
    assert.deepStrictEqual(toast ? [toast] : [], this.P.toasts.slice(t0), what + ': the toast is not today\'s');
    const mineKeys = held(this.store), theirKeys = this.P.dump();
    assert.deepStrictEqual(mineKeys, theirKeys, what + ': the store is not today\'s, key for key');
    this.wrote = [...new Set([...Object.keys(pre), ...Object.keys(mineKeys)])].filter((k) => pre[k] !== mineKeys[k]).sort();
    if (!toast && this.wrote.length) this.T.folds++;   // a draw that wrote: the lift log's cleanup
    this.T.taps++; this.T.keys += Object.keys(theirKeys).length;
    this.view = view;
    this.count(view);
    return view;
  }

  private count(v: ProgressView | null): void {
    const T = this.T;
    T.draws++;
    if (!v) return;
    if (v.empty) T.empties++;
    for (const c of v.charts) {
      if (c.kind === 'dot') T.dots++;
      else if (c.kind === 'card') { T.cards++; const k = cardKind(c.spec); T.cardKinds[k] = (T.cardKinds[k] || 0) + 1; readCard(c.spec, T, this.what + ', ' + k); }
      else {
        T.ledgers++;
        T.mains += c.view.mains ? c.view.mains.blocks.length : 0;
        T.lines += c.view.mains ? c.view.mains.blocks.filter((b) => b.chart).length : 0;
        T.ladder += c.view.ladder ? c.view.ladder.rows.length : 0;
        T.other += c.view.other ? c.view.other.rows.length : 0;
      }
    }
    for (const w of v.journal || []) {
      T.journalWeeks++;
      for (const e of w.entries) { T.journalEntries++; if (e.swap) T.swaps++; if (e.jogLines.length) T.jogs++; if (e.notes) T.notes++; }
    }
    if (v.chips.chips) T.chips += v.chips.chips.length;
    if (v.chips.bar) { T.bars++; if (v.chips.bar.kind === 'confirm') { T.confirms++; if (v.chips.bar.warn) T.warned++; } }
  }

  /** The Progress tab. */
  open(): ProgressView | null { return this.tap('the Progress tab', 'showProgressScreen()', () => { openProgress(this.st); return null; }); }
  chip(id: string): ProgressView | null { return this.tap('a chip', `setProgressView(${J(id)})`, () => { showProgram(this.st, id); return null; }); }
  trash(id: string): ProgressView | null { return this.tap('the trash', `askPurgeFromProgress(${J(id)})`, () => { askPurge(this.st, id); return null; }); }
  cancel(): ProgressView | null { return this.tap('Cancel', 'cancelProgressConfirm()', () => { cancelConfirm(this.st); return null; }); }
  restore(id: string): ProgressView | null {
    this.T.restores++;
    return this.tap('Restore', `unarchiveProg(${J(id)});renderProgressScreen()`, () => restoreProgram(this.store, id));
  }
  deleteForever(id: string): ProgressView | null {
    const before = Object.keys(held(this.store)).length;
    const v = this.tap('Delete Forever', `deleteProg(${J(id)},true)`, () => { const toast = deleteProgram(this.store, id); afterDelete(this.st, id); return toast; });
    this.T.deletes++; this.T.removed += before - Object.keys(held(this.store)).length;
    return v;
  }
  /** One lift of the estimator, then the line for two typed numbers, on both. */
  estimate(lift: string, weight: string, reps: string): string {
    this.tap('the estimator\'s ' + lift, `setCalcLift(${J(lift)})`, () => { setCalcLift(this.st, lift); return null; });
    const line = estimateLine(this.st, weight, reps, estimatorUnit(this.store));
    const mine = line ? line.bold + line.rest : '';
    assert.equal(mine, pageEstimate(this.P, weight, reps), this.what + ': the estimate for ' + weight + ' and ' + reps + ' on ' + lift + ' is not today\'s');
    if (mine) this.T.estimates++; else this.T.estimatesEmpty++;
    return mine;
  }
}

/** A second phone on the first one's keys, launched at its instant: the walk's taps leave the history's own phone as it was. */
export function twin(P: Phone): Phone {
  const Q = new Phone();
  for (const [k, v] of Object.entries(P.dump())) Q.damage(k, v);
  return Q.launch(iso(launchNow(P)));
}

/** The screen opened on both, and the estimator worked: three lifts, a single, a set of five, and no numbers. */
export function openBoth(P: Phone, T: ProgressTally, what: string): TwoProgress {
  const two = new TwoProgress(twin(P), T, what);
  two.open();
  two.estimate('Squat', '185', '5');
  two.estimate('Bench', '225', '1');
  two.estimate('Deadlift', '', '5');
  two.estimate('Deadlift', '102.5', '3');
  return two;
}

const D7 = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

/**
 * Three weeks of runs logged with a distance, a pace and an effort, which the standard history never stores: easy
 * and recovery runs at RPE 3, the others at 7, one easy run credited to the bike, and a jog written on the first
 * rest day (the rest sheet's own writer is not this walk's subject; the journal reads the stored jog whoever wrote
 * it). `weeks` logs fewer weeks than three: one week of runs is too few for the zone chart and the trend, so the
 * easy bands and the easy effort's empty state draw instead. Returns the phone launched on the fourth week's
 * Wednesday, and how many runs it logged.
 */
export function runsLife(cfg: unknown, createdAt: string, weeks = 3, short = false): { phone: Phone; runs: number; shortRuns: number } {
  const P = new Phone().launch(createdAt);
  P.generate(cfg as never);
  const { first, start } = firstWeek(P, createdAt);
  let n = 0, bikeDone = false, jogDone = false, shortRuns = 0;
  const made = createdAt.slice(0, 10);
  // With `short`, the week the program was made in comes first: its days from the day it was made (a short first week, D26).
  for (const w of (short && first > 1 ? [first - 1] : []).concat([first, first + 1, first + 2].slice(0, weeks))) {
    for (const d of training(P.launch(w < first ? createdAt : at(start, 7 * (w - 1), '06:30')), w)) {
      const day = P.day(w, d);
      if (!day.cardio || String(day.cardio.type).toLowerCase() !== 'run') continue;
      const when = at(start, 7 * (w - 1) + D7.indexOf(d as never));
      if (w < first) { if (when.slice(0, 10) < made) continue; shortRuns++; }
      P.launch(when);
      P.open(w, d);
      const sub = String(day.cardio.subtype), easy = /recovery|easy/i.test(sub);
      const bike = !bikeDone && w === first + 1 && easy;   // never in the short week
      const pace = (easy ? 600 : 480) + 7 * n, dist = +(3 + 0.4 * n).toFixed(1);
      P.type('cardioSwapWrap', '');
      P.ev(`(function(){var x=document.getElementById('cardioSwapWrap').dataset;x.planned='run';x.active=${J(bike ? 'bike' : 'run')};})()`);
      P.type('log_run_dist', dist.toFixed(1));
      P.type('log_run_pace', Math.floor(pace / 60) + ':' + String(pace % 60).padStart(2, '0') + '/mi');
      P.type('log_run_mins', String(Math.round(dist * pace / 60)));
      if (bike) P.type('log_bike_mins', '45');
      P.type('log_rpe', String(easy ? 3 : 7), true);
      P.type('log_notes', n === 1 ? 'Legs heavy & slow <on the hill>' : '');
      P.mark(d as never, 'complete');
      if (bike) bikeDone = true;
      n++;
    }
    if (!jogDone) {
      const r = D7.find((d) => { const x = P.day(w, d as never); return x && x.rest; });
      if (r) { P.ev(`(function(){var L=getLogs();var k='w${w}_${r}';L[k]=L[k]||{};L[k].restLog={run:{mins:'20',dist:'2.0',rpe:'3'}};L[k].ts=Date.now();saveLogs(L);})()`); jogDone = true; }
    }
  }
  P.launch(at(start, 7 * (first + 2) + 2, '08:00'));
  return { phone: P, runs: n, shortRuns };
}

/**
 * The chips and the archived bar, with a second program beside the phone's own: both chips, the first program
 * archived (the program list's tap, made on the page and carried over), its bar, the trash and Cancel, Restore,
 * archived again, then the trash and Delete Forever. `P` is a phone with one program and its history; `second` is the
 * config of the program made beside it, a week after the phone's last launch.
 */
export function chipsWalk(P: Phone, second: unknown, T: ProgressTally, what: string): TwoProgress {
  const Q = twin(P);
  const first: string = Q.ev('activeProgId');
  Q.launch(iso(new Date(launchNow(Q).getTime() + 7 * 86400000)));
  Q.generate(second as never);
  const other: string = Q.ev('activeProgId');
  assert.notEqual(other, first, what + ': a second program was made');
  // The second program's first training day logged with one lift, so its own lift log and history hold a row.
  const w: number = Q.ev('calcCurrentWeek()');
  const d = training(Q, w)[0];
  if (d) {
    Q.open(w, d);
    const it = ((Q.day(w, d).sections || []) as { items?: { name?: string; detail?: string }[] }[]).flatMap((s) => s.items || []).find((x) => x && x.name && /\d\s*[×x]\s*\d/.test(String(x.detail || '')));
    if (it) Q.logLift(it.name!, it.detail!, [8, 8], [95, 95]);
    Q.type('log_rpe', '6', true);
    Q.mark(d, 'complete');
  }
  Q.launch(iso(new Date(launchNow(Q).getTime() + 86400000)));
  const two = new TwoProgress(Q, T, what);
  let v = two.open();
  assert.equal(v && v.vid, other, what + ': Progress opens on the active program');
  assert.equal(v && v.chips.chips && v.chips.chips.length, 2, what + ': two chips');
  v = two.chip(first);
  assert.equal(v && v.vid, first);
  assert.equal(v && v.chips.bar, null, what + ': a live program has no bar');
  two.chip(other);
  // The program list's Archive: not built in the beta, so it is made on the page and its keys carried over.
  Q.ev(`archiveProg(${J(first)})`);
  two.carry();
  v = two.open();
  v = two.chip(first);
  assert.deepEqual(v && v.chips.bar, { kind: 'archived', id: first }, what + ': the archived program\'s bar');
  v = two.trash(first);
  assert.equal(v && v.chips.bar && v.chips.bar.kind, 'confirm', what + ': the trash arms the delete');
  v = two.cancel();
  assert.deepEqual(v && v.chips.bar, { kind: 'archived', id: first });
  v = two.restore(first);
  assert.equal(v && v.chips.bar, null, what + ': restored, it has no bar');
  Q.ev(`archiveProg(${J(first)})`);
  two.carry();
  two.open();
  two.chip(first);
  two.trash(first);
  v = two.deleteForever(first);
  assert.equal(v && v.vid, other, what + ': the deleted program is gone from view');
  assert.equal(v && v.chips.chips, null, what + ': one program left, no chips');
  assert.equal(two.store.keys().filter((k) => k.endsWith(first)).length, 0, what + ': no key of the deleted program is left');
  return two;
}
