// The rest day sheet and the coach's mile nudge, the Expo app's against today's page (MIGRATION.md phase 3, row 5,
// its second session). Two apps over one stored state: the page in the VM harness (a Phone), and the Expo app's
// model (frontends/native/src/rest-sheet/rest-sheet-model.ts), writers (rest-writes.ts) and nudge
// (mile-nudge/nudge-screen.ts) over its own SQLite store, on the grid its own launch handed back (liveProgram: the
// structure as the app holds it, never a copy). After every tap the two are held equal: the page's draft, every byte
// of the sheet's markup, each toast, whether the sheet closed, the grid in hand, This Week under the sheet, and
// every ia_ key, value for value.
//
// THE PAGE WRITES MARKUP. Today's sheet has no model: rest-day-shell.ts writes its body as a string. The Expo app's
// view is printed here as that string (restMarkup, typed by hand from the page's builders, the wheels included) and
// compared with the page's own, byte for byte. Two of the page's taps change one button's words by hand and draw
// nothing (a wheel's rest, Clear's first tap): the walk reads that button, then has the page draw its sheet again
// (renderRestSheet, which changes nothing it holds) and compares the whole.
//
// The reference is today's page on purpose. No Angular screen provides a function this walk calls on the page, bar
// two: openDetail, which the rest sheet calls after a write on a day that holds a session and a jog (in the app the
// session sheet's own redraw: counted here, never run), and the nudge, which is the Angular screen's alone: its
// judge is made here as that screen makes it (mile-nudge.ts afterLog), the Angular model handed the page's readers.
import assert from 'node:assert/strict';
import type { StateStore } from '@ia/core/engine/state-store.ts';
import { type NudgeOffer, easyTarget, judgeNudge, nudgeText, offerFields } from '../../frontends/app/src/app/screens/mile-nudge/mile-nudge-model.ts';
import { mileField, mileLockFacts, mileLocked } from '../../frontends/app/src/app/screens/mile-sheet/mile-sheet-model.ts';
import type { WheelView } from '../../frontends/native/src/day-detail/cardio-fields-model.ts';
import { wheelFormat } from '../../frontends/native/src/day-detail/wheels.ts';
import { type PendingNudge, afterLog, answer, update } from '../../frontends/native/src/mile-nudge/nudge-screen.ts';
import { nudgeText as nativeNudgeText } from '../../frontends/native/src/mile-nudge/mile-nudge-model.ts';
import type { MileOpen } from '../../frontends/native/src/program-list/list-screen.ts';
import { commitMileChange } from '../../frontends/native/src/program-list/list-writes.ts';
import {
  type CardioView, type MoveView, type RestDraft, type RestLogs, type RestProgram, type RestView, faceInput, openRest, pickSession, pickType,
  restHeld, restMoveCollisions, restView, tapRpe, toCardio,
} from '../../frontends/native/src/rest-sheet/rest-sheet-model.ts';
import { type RestTap, applyRestCardio, applyRestMove, clearRestCardio } from '../../frontends/native/src/rest-sheet/rest-writes.ts';
import { liveProgram } from '../../frontends/native/src/this-week/week-screen.ts';
import { readDayLogs } from '@ia/core/engine/state-day-log.ts';
import { readCompleted } from '@ia/core/engine/state-day-status.ts';
import { cardioTally, TwoCards } from './native-cardio-sheet.ts';
import { iso } from './native-deck-swap.ts';
import { sheetTally } from './native-session-sheet.ts';
import { launchNow, nativeView, pageView } from './native-this-week.ts';
import { sqliteTestStore } from './sqlite-kv.ts';
import { DAYS, Phone, at, mondayOf } from './stored-state.ts';

const J = JSON.stringify;
const plain = <T>(x: T): T => JSON.parse(J(x)) as T;
const held = (s: StateStore): Record<string, string> => Object.fromEntries(s.keys().filter((k) => k.startsWith('ia_')).sort().map((k) => [k, s.get(k)!]));
/** This Week's strip is Sunday first. */
const COL: Record<string, number> = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };

/** What the walks compared so far, by kind: each is a thing the sheet can draw, a toast it can say or a write it can make. */
export type RestTally = Record<string, number>;
export const restTally = (): RestTally => ({});

// ── The view as the page's markup (typed by hand from _renderRestMove, _renderRestCardio and iaWheelHTML) ─────────
const esc = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
/** iaWheelHTML. */
export function wheelMarkup(w: WheelView): string {
  const cols = w.cols.map((c) => '<div class="iaw-col" data-ci="' + c.ci + '" data-wrap="' + (c.wrap ? '1' : '') + '" data-len="' + c.len + '"><div class="iaw-pad"></div>'
    + c.items.map((it) => '<div class="iaw-it' + (it.nil ? ' nil' : '') + '" data-v="' + it.v + '">' + it.face + '</div>').join('')
    + '<div class="iaw-pad"></div></div>').join('');
  return '<div class="iaw-cell iaw-f' + w.ncols + '"><div class="iaw-cap">' + w.cap + '</div>'
    + '<div class="iaw" data-kind="' + w.kind + '" data-for="' + w.hiddenId + '"' + (w.plan == null ? '' : ' data-plan="' + w.plan.replace(/"/g, '&quot;') + '"') + '><div class="iaw-shade"></div><div class="iaw-band"></div>' + cols + '</div>'
    + '<input type="hidden" id="' + w.hiddenId + '" value="' + w.value.replace(/"/g, '&quot;') + '"></div>';
}
const headMarkup = (v: { kicker: string; title: string; intro: string }): string => '<div class="ov-kicker">' + v.kicker + '</div><div class="ov-title">' + v.title + '</div><div class="ov-intro">' + v.intro + '</div>';
function moveMarkup(v: MoveView): string {
  if (v.none) {
    return headMarkup(v) + '<div class="ov-effect"><div class="ov-effect-ttl">' + v.none.title + '</div><div class="ov-effect-sub">' + v.none.sub + '</div></div>'
      + '<button class="ov-apply" onclick="_rdSet(\'view\',\'cardio\')">' + v.none.button + '</button>';
  }
  const already = v.already ? '<div class="ov-effect"><div class="ov-effect-ttl">' + v.already.title + '</div><div class="ov-effect-sub">' + v.already.lines.map((l) => l + '<br>').join('') + v.already.tail + '</div></div>' : '';
  const rows = v.rows.map((r) => '<div class="ov-eq' + (r.sel ? ' sel' : '') + '" onclick="_rdSet(\'pick\',\'' + r.day + '\')"><div class="ov-eq-body"><div class="ov-eq-name">' + r.title + '</div><div class="ov-eq-desc" style="display:block">' + r.desc + '</div></div>'
    + (r.sel ? '<span class="ov-eq-chk">✓</span>' : '') + '</div>').join('');
  const warn = v.warn ? '<div class="ov-effect reassess-card" style="margin-top:12px"><div class="ov-effect-ttl" style="color:var(--red)">' + v.warn.title + '</div><div class="ov-effect-sub">' + v.warn.sub + '</div></div>' : '';
  return headMarkup(v) + already + '<div class="ov-eq-lbl">' + v.label + '</div>' + rows + warn + (v.apply ? '<button class="ov-apply" onclick="applyRestMove()">' + v.apply + '</button>' : '');
}
function cardioMarkup(v: CardioView): string {
  const lbl = (x: string): string => '<div class="ov-eq-lbl" style="margin-top:14px">' + x + '</div>';
  const chips = v.chips.map((c) => '<div class="rd-chip' + (c.sel ? ' sel' : '') + '" onclick="_rdType(\'' + c.type + '\')">' + c.label + '</div>').join('');
  const efforts = v.efforts.map((e) => '<div class="rd-chip wide' + (e.sel ? ' sel' : '') + '" onclick="_rdRpe(' + e.v + ')"><b>' + e.head + '</b> · ' + e.name + '<span>' + e.desc + '</span></div>').join('');
  let ctl = lbl(v.timeLabel) + '<div class="iaw-wrap iaw-solo">' + wheelMarkup(v.time) + '</div>';
  if (v.dist && 'wheel' in v.dist) ctl += lbl(v.dist.label) + '<div class="iaw-wrap iaw-solo">' + wheelMarkup(v.dist.wheel) + '</div>';
  else if (v.dist) ctl += lbl(v.dist.label) + '<div class="rd-row"><input class="rd-input" type="number" inputmode="numeric" min="0"' + (v.dist.box.step25 ? ' step="25"' : '') + ' id="rest_dist" value="' + esc(v.dist.box.value) + '" placeholder="' + v.dist.box.placeholder + '"></div>';
  const note = v.note ? '<div class="ov-effect" style="border-color:var(--accent)"><div class="ov-effect-ttl" style="color:var(--accent)">' + v.note.title + '</div><div class="ov-effect-sub">' + v.note.sub + '</div></div>' : '';
  return headMarkup(v) + '<div class="ov-eq-lbl">' + v.chipsLabel + '</div><div class="rd-row">' + chips + '</div>' + ctl
    + '<div class="ov-eq-lbl" style="margin-top:14px">' + v.effortLabel + '</div>' + efforts + note
    + '<button class="ov-apply" id="restLogBtn" onclick="applyRestCardio()">' + v.log + '</button>'
    + (v.clear ? '<button class="ov-clear" id="restClearBtn" onclick="clearRestCardio()">' + v.clear + '</button>' : '');
}
/** The Expo app's view as the markup today's page writes into its sheet. */
export const restMarkup = (v: RestView): string => (v.kind === 'move' ? moveMarkup(v) : cardioMarkup(v));

/** A phone holding another's keys, launched at a local date and time. */
export function phoneAt(P: Phone, when: string): Phone {
  const Q = new Phone();
  for (const [k, v] of Object.entries(P.dump())) Q.damage(k, v);
  Q.launch(when);
  Q.settle();
  return Q;
}
/** A phone holding another's keys, launched at the same instant. */
export const twin = (P: Phone): Phone => phoneAt(P, isoMinute(launchNow(P)));
const isoMinute = (d: Date): string => iso(d).slice(0, 10) + 'T' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0') + ':00';

/** Both apps on the rest day sheet over one stored state. */
export class TwoRests {
  readonly P: Phone;
  readonly store: StateStore;
  /** The grid the Expo app's own launch handed back: the one its sheet reads and Move writes on. */
  readonly prog: RestProgram;
  readonly T: RestTally;
  readonly what: string;
  readonly now: number;
  /** The sheet open in the Expo app, or null. */
  draft: RestDraft | null = null;
  view: RestView | null = null;
  /** The keys the last tap changed in the Expo app's store (the page's own are held equal to them). */
  wrote: string[] = [];
  /** The toast the last tap said, or null. */
  said: string | null = null;
  /** How many times the page drew the session sheet under the rest sheet again on the last tap (openDetail). */
  redrew = 0;

  /** `P` is a phone just launched; the Expo app's store takes its keys, and makes its own launch on them. */
  constructor(P: Phone, T: RestTally, what: string) {
    this.P = P; this.T = T; this.what = what;
    P.settle();
    this.store = sqliteTestStore();
    for (const [k, v] of Object.entries(P.dump())) this.store.set(k, v);
    this.now = P.ev('Date.now()') as number;
    const failures: string[] = [];
    const prog = liveProgram(this.store, this.now, { overlay: () => { failures.push('overlay'); }, freeze: () => { failures.push('freeze'); }, rebuild: () => { failures.push('rebuild'); } });
    assert.deepStrictEqual(failures, [], what + ': a part of the launch failed');
    this.prog = prog as unknown as RestProgram;
    assert.deepStrictEqual(held(this.store), P.dump(), what + ': the Expo app\'s launch leaves the keys today\'s launch left');
    if (prog) assert.equal(J(prog.weeks), J(P.prog.weeks), what + ': the launch\'s grid is today\'s');
    // The page's own calls the walk reads: the sheet drawn, the sheet closed, and the session sheet drawn again.
    const ctx = P.IA.ctx as Record<string, unknown>;
    ctx['__rs'] = { drawn: 0, closed: 0, detail: 0 };
    P.ev('renderRestSheet=(function(o){return function(){__rs.drawn++;return o.apply(this,arguments);};})(renderRestSheet);');
    P.ev('closeRestSheet=(function(o){return function(){__rs.closed++;return o.apply(this,arguments);};})(closeRestSheet);');
    P.ev('openDetail=function(){__rs.detail++;};');
  }

  private n(k: string, by = 1): void { this.T[k] = (this.T[k] || 0) + by; }
  private get logs(): RestLogs { return readDayLogs(this.store, this.prog.id) as unknown as RestLogs; }
  private get session() { return { store: this.store, prog: this.prog }; }
  private calls(): { drawn: number; closed: number; detail: number } { return JSON.parse(this.P.ev('JSON.stringify(__rs)')); }

  /**
   * One tap on both, then everything equal. `page` is today's call. `native` makes the same tap: it hands back the
   * toast and whether the sheet is now shut (opening refused, or closed by the tap). `byHand` names the button the
   * page changes by hand on a tap that draws nothing.
   */
  private tap(name: string, page: string, native: () => { toast: string | null; shut: boolean }, byHand?: 'restLogBtn' | 'restClearBtn'): void {
    const what = this.what + ', ' + name;
    this.P.settle();
    const t0 = this.P.toasts.length, c0 = this.calls(), wasOpen = !!this.draft;
    const pre = held(this.store);
    this.P.ev(page); this.P.settle();
    const out = native();
    this.said = out.toast;
    if (out.shut) { this.draft = null; this.view = null; }
    const c1 = this.calls();
    assert.deepStrictEqual(out.toast ? [out.toast] : [], this.P.toasts.slice(t0), what + ': the toast is not today\'s');
    // The page's sheet is open once it drew and until it closes.
    const pageOpen = c1.closed > c0.closed ? false : c1.drawn > c0.drawn ? true : wasOpen && !/^openRestSheet/.test(page);
    assert.equal(!!this.draft, pageOpen, what + ': the sheet is ' + (pageOpen ? 'open' : 'shut') + ' on today\'s page');
    this.redrew = c1.detail - c0.detail;
    if (this.draft) {
      assert.deepStrictEqual(plain(this.draft), plain(this.P.ev('_restDraft')), what + ': the draft is not today\'s');
      const comp = readCompleted(this.store, this.prog.id) as Record<string, unknown>;
      this.view = restView(this.draft, this.prog, comp, this.logs);
      if (byHand) {
        const text = String(this.P.ev(`document.getElementById('${byHand}').textContent`));
        assert.equal(byHand === 'restLogBtn' ? (this.view as CardioView).log : (this.view as CardioView).clear, text, what + ': the button the page rewrote by hand');
        this.n('a button rewritten by hand compared');
      }
      this.P.ev('renderRestSheet()');
      const theirs = String(this.P.ev("document.getElementById('restBody').innerHTML"));
      assert.ok(theirs.length > 300 && theirs.startsWith('<div class="ov-kicker">'), what + ': the page\'s sheet was read');
      assert.equal(restMarkup(this.view), theirs, what + ': the sheet is not today\'s, byte for byte');
      this.n('markup bytes compared', theirs.length);
      this.count(this.view);
    }
    assert.equal(J(this.prog.weeks), J(this.P.prog.weeks), what + ': the grid in hand is not today\'s');
    const mine = held(this.store), theirs = this.P.dump();
    assert.deepStrictEqual(mine, theirs, what + ': the store is not today\'s, key for key');
    this.wrote = [...new Set([...Object.keys(pre), ...Object.keys(mine)])].filter((k) => pre[k] !== mine[k]).map((k) => k.split(this.prog.id).join('<id>')).sort();
    this.n('taps'); this.n('keys compared', Object.keys(theirs).length);
  }

  /**
   * This Week under the sheet, with the day picked: the Expo app's draw against today's. The strip is Sunday first,
   * so a program week's Sunday sits in the next title (week-view-model.ts).
   */
  week(w: number, day: string): ReturnType<typeof pageView> {
    const title = day === 'sun' ? w + 1 : w;
    const page = pageView(this.P, title, COL[day]!, true);
    assert.deepStrictEqual(nativeView(this.store, this.prog as never, new Date(this.now), title, COL[day]!, true), page, this.what + ': This Week under the sheet is not today\'s (week ' + w + ', ' + day + ')');
    this.n('This Week compared');
    return page;
  }

  /** Every kind of thing a draw of the sheet holds, counted. */
  private count(v: RestView): void {
    this.n('draws');
    if (v.kind === 'move') {
      this.n('move view');
      if (v.none) { this.n('move: Nothing left to move'); this.n('move: Log cardio instead'); return; }
      if (v.already) { this.n('move: Already logged here'); this.n('move: Already logged here, a line', v.already.lines.length); }
      this.n('move: a session row', v.rows.length);
      this.n('move: a row picked', v.rows.filter((r) => r.sel).length);
      if (v.warn) this.n(/ and \w+day too\./.test(v.warn.sub) ? 'move: the warning names two days' : 'move: the warning names one day');
      if (v.apply) this.n('move: Move it here');
      return;
    }
    this.n('cardio view');
    this.n(v.title === 'What did you do?' ? 'cardio: What did you do?' : 'cardio: Your <jog> on <day>');
    this.n('cardio: a sport chip', v.chips.length);
    this.n('cardio: a chip with a check', v.chips.filter((c) => / ✓$/.test(c.label)).length);
    const face = v.chips.find((c) => c.sel);
    this.n('cardio: face of ' + (face ? face.type : 'a sport with no chip'));
    this.n('cardio: the time wheel');
    if (v.dist && 'wheel' in v.dist) this.n('cardio: the miles wheel');
    if (v.dist && 'box' in v.dist) this.n(v.dist.box.step25 ? 'cardio: the yards box' : 'cardio: the meters box');
    if (!v.dist) this.n('cardio: no distance (a walk)');
    this.n('cardio: an effort row', v.efforts.length);
    for (const e of v.efforts) if (e.sel) this.n('cardio: effort ' + e.head + ' picked');
    if (v.note) this.n('cardio: Noted');
    this.n(v.log === 'Logged ✓' ? 'cardio: Logged ✓' : 'cardio: Log it');
    if (v.clear) this.n(v.clear === 'Tap again to clear' ? 'cardio: Tap again to clear' : 'cardio: Clear this <jog>');
  }

  // ── The doors ──
  /** A door's tap (This Week's rest card, the session sheet's Edit cardio). Returns whether the sheet opened. */
  open(w: number, day: string, view: 'move' | 'cardio'): boolean {
    this.tap('the sheet asked on ' + view + ' (week ' + w + ', ' + day + ')', `openRestSheet(${w},${J(day)},${J(view)})`, () => {
      const r = openRest(this.prog, this.logs, w, day, view, new Date(this.now));
      if ('toast' in r) return { toast: r.toast, shut: true };
      this.draft = r.draft;
      return { toast: null, shut: false };
    });
    if (!this.draft) { this.n('door refused: ' + this.said); return false; }
    this.n('door opened on ' + this.draft.view + (this.draft.view !== view ? ', asked ' + view : ''));
    return true;
  }
  /** Back. */
  back(): void { this.tap('Back', 'closeRestSheet()', () => ({ toast: null, shut: true })); }

  // ── Move ──
  pick(day: string): void { this.tap('a session picked', `_rdSet('pick',${J(day)})`, () => { this.draft = pickSession(this.draft!, day); return { toast: null, shut: false }; }); }
  instead(): void { this.tap('Log cardio instead', "_rdSet('view','cardio')", () => { this.draft = toCardio(this.draft!); return { toast: null, shut: false }; }); }
  /** Move it here (also with no row picked, where the page says so and stays). */
  move(): void {
    const d = this.draft!;
    this.tap('Move it here', 'applyRestMove()', () => this.done(applyRestMove(this.session, d, this.now)));
    if (this.said === 'Pick a session') { this.n('toast: Pick a session'); return; }
    assert.deepEqual(this.wrote, ['ia_moves_<id>', 'ia_programs'], this.what + ': a move writes the move and the grid');
    assert.match(this.said || '', /^Moved\. \w+day is your rest now ✓$/);
    this.n('move stored'); this.n('toast: Moved.');
    const here = this.week(d.w, d.day), there = this.week(d.w, d.pick!);
    assert.ok(here.days && !here.days.rest && there.days && there.days.rest && !there.days.rest.anyway, this.what + ': This Week shows the session on the day and a rest day with no Training anyway? where it was');
  }

  // ── Log cardio ──
  chip(t: string): void { this.tap('the ' + t + ' chip', `_rdType(${J(t)})`, () => { this.draft = pickType(this.draft!, restHeld(this.logs, this.draft!.w, this.draft!.day), t); return { toast: null, shut: false }; }); }
  rpe(v: number): void { this.tap('effort ' + v, `_rdRpe(${v})`, () => { this.draft = tapRpe(this.draft!, v); return { toast: null, shut: false }; }); }
  /** A wheel's rest on a face (the values of its columns), or a key in the distance box: the page's input listener. */
  private input(id: 'rest_mins' | 'rest_dist', value: string): void {
    this.tap(id + ' to ' + (value || 'nothing'), `_restInput({target:{id:${J(id)},value:${J(value)}}})`, () => { this.draft = faceInput(this.draft!, id, value); return { toast: null, shut: false }; }, 'restLogBtn');
    this.n('cardio: a face set');
  }
  time(h: number, m: number, s: number): void { this.input('rest_mins', wheelFormat('hms', [String(h), String(m), String(s)])); }
  miles(a: number, b: number, c: number): void { this.input('rest_dist', wheelFormat('dist', [String(a), String(b), String(c)])); }
  box(text: string): void { this.input('rest_dist', text); }
  /** Log it, or Logged ✓. */
  log(): void {
    const d = this.draft!, rec = restHeld(this.logs, d.w, d.day), had = Object.keys(rec).length;
    this.tap('Log it', 'applyRestCardio()', () => this.done(applyRestCardio(this.session, d, this.now)));
    if (this.draft) { this.n('toast: ' + this.said); assert.deepEqual(this.wrote, [], this.what + ': a refused log writes nothing'); return; }
    if (this.said === null) { this.n('Logged ✓ unchanged: closed, nothing written'); assert.deepEqual(this.wrote, []); return; }
    assert.deepEqual(this.wrote, ['ia_logs_<id>'], this.what + ': a jog writes the day\'s log alone');
    assert.match(this.said, / logged ✓$/);
    this.n(/^\d+ min /.test(this.said) ? 'toast: <minutes> <jog> logged' : 'toast: <distance> <jog> logged');
    const now = restHeld(this.logs, d.w, d.day), o = now[d.type]!;
    this.n(Object.keys(now).length > had ? (had ? 'log stored: a second sport beside the first' : 'log stored: the day\'s first jog') : 'log stored: over the sport\'s record');
    this.n('log stored: ' + ['mins', 'dist', 'rpe'].filter((k) => k in o).join(' ') );
    const under = this.week(d.w, d.day);
    const lines = under.days!.rest ? under.days!.rest.lines : null;
    if (lines) assert.equal(under.days!.rest!.logLabel, 'Edit cardio', this.what + ': the rest card offers Edit cardio once a jog line prints');
  }
  /** Clear this <jog>: the first tap arms it, the second removes the record. */
  clear(): void {
    const d = this.draft!, armed = d.armed;
    const before = restHeld(this.logs, d.w, d.day);
    this.tap(armed ? 'Clear, the second tap' : 'Clear, the first tap', 'clearRestCardio()', () => this.done(clearRestCardio(this.session, d)), armed ? undefined : 'restClearBtn');
    if (!armed) { assert.deepEqual(this.wrote, [], this.what + ': the first tap of Clear writes nothing'); this.n('clear armed'); return; }
    assert.deepEqual(this.wrote, ['ia_logs_<id>']);
    assert.match(this.said || '', /^(Run|Ride|Swim|Row|Walk) cleared$/);
    this.n('toast: <Jog> cleared');
    const e = (this.logs as Record<string, Record<string, unknown> | undefined>)['w' + d.w + '_' + d.day];
    this.n(Object.keys(before).length > 1 ? 'clear: another jog stays' : e ? 'clear: the jog goes, the day\'s entry stays' : 'clear: the day\'s entry goes');
    this.week(d.w, d.day);
  }
  private done(r: RestTap): { toast: string | null; shut: boolean } {
    if (r.draft && !r.closed) this.draft = r.draft;
    return { toast: r.toast, shut: r.closed };
  }

  /** The day's session sheet marked open on the page (the harness's class list holds nothing), as it is under an Edit cardio tap. */
  sessionSheetOpen(w: number, day: string): void {
    this.P.ev(`currentWeek=${w};currentDayKey=${J(day)};`);
    this.P.ev("document.getElementById('detailOverlay').classList={add:function(){},remove:function(){},toggle:function(){},contains:function(c){return c==='open';}};");
    assert.equal(this.P.ev("document.getElementById('detailOverlay').classList.contains('open')"), true);
  }
}

// ── The walks ────────────────────────────────────────────────────────────────────────────────────────────────────
/** The Sunday evening of a week of the phone's program, nothing more trained: every rest day of the week has come. */
export function sundayOf(P: Phone, w: number): Phone {
  return phoneAt(P, at(mondayOf(P.prog.startDate), 7 * (w - 1) + 6, '19:00'));
}
const restDays = (two: TwoRests, w: number): string[] => DAYS.filter((d) => { const x = two.P.day(w, d); return x && x.rest; });
const types = (two: TwoRests): string[] => { const t = ((two.prog.cfg && two.prog.cfg.cardioTypes) || []).slice(); if (!t.includes('walk')) t.push('walk'); return t; };

/**
 * The doors, on the phone as launched: both views asked on every day of the weeks around the one in view. Each ask
 * is refused with today's words, or opens today's view with today's draft and markup; an open sheet is shut by Back.
 */
export function doorWalk(P: Phone, T: RestTally, what: string, weeks?: number[]): void {
  const two = new TwoRests(twin(P), T, what);
  const cur = Number(two.P.ev('calcCurrentWeek()')), total = two.P.prog.totalWeeks || 6;
  for (const w of weeks || [cur - 1, cur, cur + 1]) {
    if (w < 1 || w > total) continue;
    for (const d of DAYS) for (const v of ['move', 'cardio'] as const) if (two.open(w, d, v)) two.back();
  }
}

/**
 * Move, on the Sunday evening of week `w`: on every rest day that takes a move, every session offered is picked and
 * moved on a phone of its own (the pick's warning read), This Week compared on both days, and the next morning's
 * launch read; once, Move it here with no row picked, the old day asked for Move anyway, and the new day asked.
 * Returns how many moves.
 */
export function moveWalk(P: Phone, w: number, T: RestTally, what: string, limit = Infinity): number {
  const base = sundayOf(P, w);
  const probe = new TwoRests(twin(base), T, what);
  let moves = 0, first = true;
  for (const rest of restDays(probe, w)) {
    if (!probe.open(w, rest, 'move')) continue;
    const v = probe.view as MoveView;
    probe.back();
    if (v.kind !== 'move' || v.none) continue;
    for (const row of v.rows) {
      if (moves >= limit) return moves;
      const two = new TwoRests(twin(base), T, what + ', ' + row.day + ' onto ' + rest);
      two.open(w, rest, 'move');
      if (first) two.move();
      two.pick(row.day);
      const hits = restMoveCollisions(two.prog, w, rest, two.prog.weeks![w]![row.day]).length;
      assert.equal(!!(two.view as MoveView).warn, hits > 0, what + ': the warning is drawn where a neighbour trains the same region');
      two.move();
      moves++;
      // The next morning: both launches lay the stored move over the rebuilt grid (support/native-launch.ts holds them equal).
      const next = new TwoRests(phoneAt(two.P, at(mondayOf(two.P.prog.startDate), 7 * w, '07:00')), T, what + ', the next morning');
      assert.equal(next.prog.weeks![w]![rest]!.movedFrom, row.day, what + ': the move is still on the grid at the next launch');
      assert.equal(next.prog.weeks![w]![row.day]!.moved, true);
      T['move kept at the next launch'] = (T['move kept at the next launch'] || 0) + 1;
      if (first) {
        first = false;
        // The old day is a rest day whose session moved away: Training anyway? is not drawn, and asked anyway it opens Log cardio.
        assert.equal(two.open(w, row.day, 'move'), true);
        assert.equal(two.draft!.view, 'cardio', what + ': a day whose session moved away takes no move');
        two.back();
        // The new day is a training day with no jog: no door leads there, and asked anyway it is refused.
        assert.equal(two.open(w, rest, 'cardio'), false);
      }
    }
  }
  return moves;
}

const FACE: Record<string, [[number, number, number], string | [number, number, number] | null]> = {
  run: [[0, 25, 30], [2, 5, 0]], bike: [[0, 40, 0], [10, 0, 0]], swim: [[0, 20, 0], '800'], row: [[0, 15, 0], '3000'], walk: [[0, 30, 0], null],
};
function setFace(two: TwoRests, t: string, mins: [number, number, number] | null = FACE[t]![0], dist = FACE[t]![1]): void {
  if (mins) two.time(...mins);
  if (typeof dist === 'string') two.box(dist); else if (dist) two.miles(...dist);
}

/**
 * Log cardio, on the Sunday evening of week `w`, on the week's first rest day that takes a move: every sport's face
 * (the program's, then a walk), an empty Log, the three efforts and Noted, the log; then Edit cardio: Logged ✓
 * unchanged, a changed face, a face rolled to zero, a distance alone, and Clear in two taps. Once: a second sport on
 * the day and Clear of one; a session moved onto the day that holds a jog (Already logged here), the session
 * sheet's Edit cardio on that double day (Log, then Clear with the session trained); and a record of a sport the
 * program does not train. Returns the day, or null when the week has no such rest day.
 */
export function cardioWalk(P: Phone, w: number, T: RestTally, what: string): string | null {
  const base = sundayOf(P, w);
  const probe = new TwoRests(twin(base), T, what);
  const r = restDays(probe, w).find((d) => { const ok = probe.open(w, d, 'move'); const mv = ok && probe.draft!.view === 'move'; if (ok) probe.back(); return mv; });
  if (!r) return null;
  const sports = types(probe);
  let logged: Phone | null = null;
  for (const t of sports) {
    const two = new TwoRests(twin(base), T, what + ', ' + t);
    two.open(w, r, 'cardio');
    two.chip(t);
    two.log();
    assert.equal(two.said, t === 'walk' ? 'Nothing to log yet. Add a time.' : 'Nothing to log yet. Add a time or a distance.');
    setFace(two, t);
    two.rpe(5); two.rpe(5); two.rpe(9);
    assert.ok((two.view as CardioView).note, what + ': Noted at RPE 9');
    two.rpe(7);
    two.log();
    const heldNow = two.P;
    if (t === sports[0]) logged = heldNow;
    // Edit cardio: the face is the record.
    let e = new TwoRests(twin(heldNow), T, what + ', ' + t + ' edited');
    e.open(w, r, 'cardio');
    assert.equal((e.view as CardioView).log, 'Logged ✓');
    e.log();
    assert.equal(e.said, null);
    e.open(w, r, 'cardio');
    e.time(0, 45, 0);
    assert.equal((e.view as CardioView).log, 'Log it', what + ': the button turns once the face leaves the record');
    e.rpe(7);
    e.log();
    e.open(w, r, 'cardio');
    e.time(0, 0, 0);
    if (FACE[t]![1] !== null) { if (typeof FACE[t]![1] === 'string') e.box(''); else e.miles(0, 0, 0); }
    e.log();
    assert.equal(e.said, 'To remove it, use Clear.');
    e.clear();
    e.rpe(5);
    assert.equal((e.view as CardioView).clear, 'Tap again to clear', what + ': Clear stays armed through an effort tap');
    e.chip(t);
    assert.match((e.view as CardioView).clear || '', /^Clear this /, what + ': a sport chip disarms Clear');
    e.clear(); e.clear();
    if (t !== 'walk') {
      // A distance alone: the toast leads with the distance.
      e = new TwoRests(twin(base), T, what + ', ' + t + ' by distance');
      e.open(w, r, 'cardio'); e.chip(t);
      setFace(e, t, null);
      e.log();
    }
  }
  if (logged) {
    // A second sport on the day, then Clear of one leaves the other.
    const two = new TwoRests(twin(logged), T, what + ', a second sport');
    const other = sports.find((x) => x !== sports[0])!;
    two.open(w, r, 'cardio'); two.chip(other); setFace(two, other); two.log();
    const both = twin(two.P);
    two.open(w, r, 'cardio'); two.clear(); two.clear();
    // A session moved onto the day that holds the jogs: Already logged here, and a double day.
    const dd = new TwoRests(twin(both), T, what + ', a double day');
    dd.open(w, r, 'move');
    const mv = dd.view as MoveView;
    if (mv.rows.length) {
      assert.ok(mv.already && mv.already.lines.length === 2, what + ': both jogs are said before the list');
      dd.pick(mv.rows[0]!.day); dd.move();
      // The session sheet's Edit cardio: the door opens on Log cardio, and a Log draws the session sheet again.
      dd.sessionSheetOpen(w, r);
      assert.equal(dd.open(w, r, 'cardio'), true);
      T['door opened on a double day'] = (T['door opened on a double day'] || 0) + 1;
      dd.time(0, 50, 0); dd.log();
      assert.equal(dd.redrew, 1, what + ': the session sheet under the rest sheet is drawn again after a Log');
      dd.open(w, r, 'move');
      assert.equal(dd.draft!.view, 'cardio', what + ': a double day takes no move');
      dd.clear(); dd.clear();
      assert.equal(dd.redrew, 1, what + ': and after a Clear');
      T['the session sheet drawn again'] = (T['the session sheet drawn again'] || 0) + 2;
      // The session trained on the double day, then its last jog cleared: the day's entry keeps what the session logged.
      const trained = twin(dd.P);
      trained.open(w, r as never); trained.mark(r as never, 'complete'); trained.settle();
      const kept = new TwoRests(twin(trained), T, what + ', a double day trained');
      kept.sessionSheetOpen(w, r);
      kept.open(w, r, 'cardio'); kept.clear(); kept.clear();
    }
    // Every session of the week done: nothing left to move, and Log cardio instead.
    const done = twin(base);
    for (const d of DAYS) { const x = done.day(w, d); if (x && !x.rest) { done.open(w, d); done.mark(d, 'complete'); done.settle(); } }
    const none = new TwoRests(twin(done), T, what + ', every session done');
    none.open(w, r, 'move');
    assert.ok((none.view as MoveView).none, what + ': Nothing left to move');
    none.instead();
    assert.equal(none.view!.kind, 'cardio');
    none.back();
    // A record of a sport the program does not train: its chip is drawn ahead of Walk, and the sheet opens on it.
    if (!sports.includes('row')) {
      const seeded = twin(base);
      seeded.ev(`(function(){var l=getLogs();l['w${w}_${r}']={restLog:{row:{mins:15,dist:3000}},week:${w},ts:1};saveLogs(l);})()`);
      const odd = new TwoRests(twin(seeded), T, what + ', a row the program does not train');
      odd.open(w, r, 'cardio');
      const chips = (odd.view as CardioView).chips.map((c) => c.type);
      assert.deepEqual(chips.slice(-2), ['row', 'walk'], what + ': the record\'s chip stands ahead of Walk');
      assert.equal(odd.draft!.type, 'row');
      T['cardio: a chip of a sport the program does not train'] = (T['cardio: a chip of a sport the program does not train'] || 0) + 1;
      odd.clear(); odd.clear();
    }
    // A record above the time wheel's ceiling: the sheet opens on its stored value as Logged ✓, and a look writes nothing (D228).
    const high = twin(base);
    high.ev(`(function(){var l=getLogs();l['w${w}_${r}']={restLog:{walk:{mins:800}},week:${w},ts:1};saveLogs(l);})()`);
    const peg = new TwoRests(twin(high), T, what + ', a record above the dial');
    peg.open(w, r, 'cardio');
    assert.deepEqual([peg.draft!.mins, (peg.view as CardioView).log], ['800', 'Logged ✓'], what + ': the face is the stored value');
    peg.log();
    assert.equal(peg.said, null, what + ': a look at a record above the dial writes nothing');
    T['cardio: a record above the dial'] = (T['cardio: a record above the dial'] || 0) + 1;
  }
  return r;
}

/**
 * The spacing warning naming both neighbours. No seeded program draws it by itself, so the grid in hand is made to:
 * on a rest day with a training day on each side, both neighbours are given the picked session's own sections, on
 * the page's grid and on the Expo app's alike, and the pick is drawn. Returns whether the week had such a rest day.
 */
export function bothNeighboursWalk(P: Phone, w: number, T: RestTally, what: string): boolean {
  const two = new TwoRests(twin(sundayOf(P, w)), T, what);
  for (const rest of restDays(two, w)) {
    const i = DAYS.indexOf(rest as never);
    const a = DAYS[i - 1], b = DAYS[i + 1];
    if (!a || !b) continue;
    const da = two.P.day(w, a), db = two.P.day(w, b);
    if (!da || da.rest || !db || db.rest) continue;
    if (!two.open(w, rest, 'move') || two.draft!.view !== 'move') { if (two.draft) two.back(); continue; }
    const rows = (two.view as MoveView).rows;
    const src = rows.find((r) => restMoveCollisions(two.prog, w, rest, two.prog.weeks![w]![r.day]).length > 0) || null;
    if (!src) { two.back(); continue; }
    // The same edit to both grids in hand, in memory only: nothing is stored.
    two.P.ev(`(function(){var wk=activeProg.weeks[${w}],s=wk[${J(src.day)}].sections;wk[${J(a)}].sections=JSON.parse(JSON.stringify(s));wk[${J(b)}].sections=JSON.parse(JSON.stringify(s));})()`);
    const wk = two.prog.weeks![w]!, sections = wk[src.day]!.sections;
    wk[a]!.sections = JSON.parse(J(sections)); wk[b]!.sections = JSON.parse(J(sections));
    two.pick(src.day);
    assert.match((two.view as MoveView).warn!.sub, / on \w+day and \w+day too\./, what + ': the warning names both neighbours');
    return true;
  }
  return false;
}

// ── The coach's mile nudge ───────────────────────────────────────────────────────────────────────────────────────
/** The judge as the Angular MileNudge makes it on the page after a Log (mile-nudge.ts afterLog). */
function pageJudge(P: Phone, week: number, day: string): NudgeOffer | null {
  const call = <R>(name: string, ...a: unknown[]): R => (P.ev(name) as (...x: unknown[]) => R)(...a);
  const pid = P.ev('activeProgId');
  const p = (call<any[]>('getPrograms')).find((x) => x.id === pid);
  if (!p || !p.cfg) return null;
  const info = call<{ anchorSec: number } | null>('runAnchorInfo', p.cfg);
  if (!info) return null;
  return judgeNudge({
    week, day, hist: plain(call('getDayHist')), logs: plain(call('getLogs')), comp: plain(call('getCompleted')),
    anchor: info.anchorSec, curWeek: Number(call('_goalCurWeek', p)), totalWeeks: p.totalWeeks || 6, record: p.mileNudge ?? null,
    implied: (pace) => call<{ mile: number }>('paceChartLookup', 'recovery', pace).mile,
  });
}
/** The mile pencil's tap as the Angular MileSheet makes it on the page, the nudge's offer in its fields (program-list's pageMile). */
function pageMile(P: Phone, progId: string, pre: { mins: string; secs: string }): MileOpen | null {
  const p = (P.ev('getPrograms()') as any[]).find((x) => x.id === progId);
  if (!p) return null;
  const tw = p.totalWeeks || 6;
  const week: number = (P.ev('_goalCurWeek') as (x: unknown) => number)(p);
  if (mileLocked(week, tw)) {
    return plain({ kind: 'lock', facts: mileLockFacts(p.cfg?.raceDate, week, tw, {
      countdown: (i) => (P.ev('raceCountdown') as (x: string) => any)(i), words: (cd) => (P.ev('raceCountdownWords') as (x: unknown) => any)(cd), day: (i) => (P.ev('_fmtStartDay') as (x: string, y: boolean) => string)(i, true),
    }) }) as MileOpen;
  }
  void mileField;
  return { kind: 'edit', progId, mins: pre.mins, secs: pre.secs };
}

/** The easy cards of the grid in hand, in order, from week `from`: the day and what its run prescribes (sec/mi). */
export function easyDays(P: Phone, from: number, weeks = 3): { week: number; day: string; tgt: number }[] {
  const out: { week: number; day: string; tgt: number }[] = [];
  const total = P.prog.totalWeeks || 6;
  for (let w = from; w < from + weeks && w <= total; w++) for (const d of DAYS) {
    const x = P.day(w, d);
    const tgt = x && !x.rest ? easyTarget(plain(x)) : null;
    if (tgt) out.push({ week: w, day: d, tgt });
  }
  return out;
}

/** Both apps through runs logged by hand, the nudge judged after each Log. */
export class TwoNudges {
  readonly P: Phone;
  readonly store: StateStore;
  prog: RestProgram;
  readonly T: RestTally;
  readonly what: string;
  private readonly now: number;
  /** The offer the last Log left waiting in the Expo app, or null. */
  pending: PendingNudge | null = null;

  constructor(P: Phone, T: RestTally, what: string) {
    this.P = P; this.T = T; this.what = what;
    P.settle();
    this.store = sqliteTestStore();
    for (const [k, v] of Object.entries(P.dump())) this.store.set(k, v);
    this.now = P.ev('Date.now()') as number;
    this.prog = liveProgram(this.store, this.now, { overlay: () => {}, freeze: () => {}, rebuild: () => {} }) as unknown as RestProgram;
    assert.deepStrictEqual(held(this.store), P.dump(), what + ': both apps start from the same keys');
  }
  private n(k: string): void { this.T[k] = (this.T[k] || 0) + 1; }

  /**
   * The run of a day logged by hand on both (the cardio sheet's own walker: its wheels, its Log), at a pace `off`
   * seconds a mile from what the card prescribes, then the judge on both: the same offer, or none on both.
   */
  log(week: number, day: string, tgt: number, off: number, miles = 3): NudgeOffer | null {
    const what = this.what + ', week ' + week + ' ' + day;
    const S = new TwoCards(this.P, this.store, this.prog as never, week, day, sheetTally(), cardioTally(), what);
    assert.ok(S.open(), what + ': the day\'s sheet opens');
    const secs = Math.round(miles * (tgt + off));
    S.face('log_run_mins', [String(Math.floor(secs / 3600)), String(Math.floor((secs % 3600) / 60)), String(secs % 60)]);
    S.face('log_run_dist', [String(miles), '0', '0']);
    assert.equal(S.log(), 'Run logged ✓', what);
    return this.judge(week, day);
  }
  /** The program's mile on the page, in seconds (runAnchorInfo). */
  anchor(): number {
    const p = (this.P.ev('getPrograms()') as any[]).find((x) => x.id === this.prog.id);
    return (this.P.ev('runAnchorInfo') as (c: unknown) => { anchorSec: number })(p.cfg).anchorSec;
  }
  /** The mile pencil's save on both (program-list's commitMile): the store, and the grid each app then holds. */
  mile(mins: string, secs: string): void {
    const what = this.what + ', the mile saved as ' + mins + ':' + secs;
    (this.P.IA.ctx as Record<string, unknown>)['__mileDraft'] = { progId: this.prog.id };
    this.P.ev('_mileDraft=__mileDraft');
    this.P.type('mileSheetMins', mins); this.P.type('mileSheetSecs', secs);
    this.P.ev('commitMileChange()'); this.P.settle();
    const o = commitMileChange(this.store, this.prog.id, mins, secs, this.prog.id, this.now, { overlay: () => {}, freeze: () => {}, rebuild: () => {} });
    assert.ok(o.saved && o.prog, what + ': saved');
    this.prog = o.prog as unknown as RestProgram;
    assert.deepStrictEqual(held(this.store), this.P.dump(), what + ': the store is not today\'s');
    assert.equal(J(this.prog.weeks), J(this.P.prog.weeks), what + ': the rebuilt grid is not today\'s');
  }
  /** The judge on both, on a card: after any tap of its Log, whatever the tap stored. */
  judge(week: number, day: string): NudgeOffer | null {
    const what = this.what + ', week ' + week + ' ' + day;
    const theirs = pageJudge(this.P, week, day);
    this.pending = afterLog(this.store, this.prog.id, week, day, new Date(this.now));
    assert.deepStrictEqual(plain(this.pending ? this.pending.offer : null), plain(theirs), what + ': the judge is not today\'s');
    assert.deepStrictEqual(held(this.store), this.P.dump(), what + ': the judge writes nothing');
    this.n('nudge: judged');
    if (!this.pending) return null;
    assert.deepStrictEqual(nativeNudgeText(this.pending.offer), nudgeText(theirs!), what + ': the sheet\'s words');
    this.n(theirs!.dir > 0 ? 'nudge: an offer to go slower' : 'nudge: an offer to go faster');
    this.n(theirs!.cards[0].tgt === theirs!.cards[1].tgt ? 'nudge: against one pace' : 'nudge: against two paces');
    return theirs;
  }
  /** Keep, or Update mile time: the record on the program on both, and for Update the mile pencil with the offer in its fields. */
  answer(update_: boolean): MileOpen | null {
    const n = this.pending!, what = this.what + (update_ ? ', Update mile time' : ', Keep');
    const pre = held(this.store);
    this.P.ev(`(function(){var ps=getPrograms();var q=ps.find(function(x){return x.id===${J(n.progId)};});q.mileNudge=${J({ cards: [n.offer.cards[0].key, n.offer.cards[1].key], anchor: n.offer.anchor })};savePrograms(ps);})()`);
    answer(this.store, n);
    const mine = held(this.store);
    assert.deepStrictEqual(mine, this.P.dump(), what + ': the store is not today\'s, key for key');
    assert.deepEqual(Object.keys(mine).filter((k) => pre[k] !== mine[k]), ['ia_programs'], what + ': an answer writes the program list alone');
    this.pending = null;
    this.n(update_ ? 'nudge: Update mile time' : 'nudge: Keep');
    if (!update_) return null;
    const open = update(this.store, n, new Date(this.now));
    assert.deepStrictEqual(plain(open), pageMile(this.P, n.progId, offerFields(n.offer.offer)), what + ': the mile pencil is not today\'s');
    assert.deepStrictEqual(held(this.store), this.P.dump(), what + ': opening the pencil writes nothing');
    this.n(open && open.kind === 'edit' ? 'nudge: the pencil opened on the offer' : 'nudge: the pencil opened on the lock');
    return open;
  }
}

/**
 * The nudge on the phone's program, from week `from`: the first two easy cards run 150 s a mile slow (no offer after
 * one, the offer after two), Keep, and the judge shut on the same card; on phones of their own, both fast with
 * Update mile time, one slow and one fast (no offer), and both slow in the program's last three weeks (the pencil
 * locked: no offer). Returns how many easy cards the walk found (it needs two).
 */
export function nudgeWalk(P: Phone, from: number, T: RestTally, what: string): number {
  const base = sundayOf(P, from);
  const easy = easyDays(base, from);
  if (easy.length < 2) return easy.length;
  const [a, b] = [easy[0]!, easy[1]!];
  const at2 = (): Phone => sundayOf(base, b.week);
  const bump = (k: string): void => { T[k] = (T[k] || 0) + 1; };

  let two = new TwoNudges(at2(), T, what + ', both slow');
  assert.equal(two.log(a.week, a.day, a.tgt, 150), null, what + ': one run off the plan offers nothing');
  bump('nudge: no offer, the first easy card');
  const offer = two.log(b.week, b.day, b.tgt, 150);
  assert.ok(offer && offer.dir === 1, what + ': two slow easy runs in a row offer a slower mile');
  two.answer(false);
  assert.equal(two.judge(b.week, b.day), null, what + ': the judge stays shut on a card it has answered');
  bump('nudge: no offer, a record in the way');

  two = new TwoNudges(at2(), T, what + ', both fast');
  two.log(a.week, a.day, a.tgt, -150);
  const fast = two.log(b.week, b.day, b.tgt, -150);
  assert.ok(fast && fast.dir === -1, what + ': two fast easy runs in a row offer a faster mile');
  const open = two.answer(true);
  assert.ok(open && open.kind === 'edit' && Number(open.mins) * 60 + Number(open.secs) === fast.offer, what + ': the pencil holds the offer');

  two = new TwoNudges(at2(), T, what + ', one slow and one fast');
  two.log(a.week, a.day, a.tgt, 150);
  assert.equal(two.log(b.week, b.day, b.tgt, -150), null, what + ': runs off the plan in opposite ways offer nothing');
  bump('nudge: no offer, off the plan in opposite ways');

  // The mile moved between the two runs (the pencil, one row slower): the first card keeps the pace it was run
  // against, the second is rebuilt off the new mile, and the sheet names both paces.
  two = new TwoNudges(at2(), T, what + ', two paces');
  two.log(a.week, a.day, a.tgt, 150);
  const mile = two.anchor() + 30;
  two.mile(String(Math.floor(mile / 60)), String(mile % 60));
  const rebuilt = easyDays(two.P, b.week, 1).find((x) => x.day === b.day);
  assert.ok(rebuilt && rebuilt.tgt !== b.tgt, what + ': the second card is rebuilt off the new mile');
  const both = two.log(b.week, b.day, rebuilt.tgt, 150);
  assert.ok(both && both.cards[0].tgt !== both.cards[1].tgt, what + ': an offer against two paces');

  // The program's last three weeks: the pencil is locked, and the judge is silent.
  const total = base.prog.totalWeeks || 6;
  const late = easyDays(base, total - 2, 3);
  if (late.length >= 2) {
    two = new TwoNudges(sundayOf(base, late[1]!.week), T, what + ', the pencil locked');
    two.log(late[0]!.week, late[0]!.day, late[0]!.tgt, 150);
    assert.equal(two.log(late[1]!.week, late[1]!.day, late[1]!.tgt, 150), null, what + ': no offer once the mile is locked');
    bump('nudge: no offer, the pencil locked');
  }
  return easy.length;
}
