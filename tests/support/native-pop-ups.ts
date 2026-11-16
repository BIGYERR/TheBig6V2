// The Expo app's pop-ups against today's (tests/integration/native-pop-ups.test.ts and the sweep of that name;
// MIGRATION.md phase 3, the deck's fourth session; docs/decisions/swipe-deck.md, the pop-ups' entry).
//
//   the page   today's own functions, run on the page of a test phone (support/stored-state.ts): the launch's timer
//              (maybeShowReminder, 600 ms after init), resolveReminder through the button's own handler code, and
//              fireCompletionPopup. In the app popFire is the Angular PopUp's (LegacyBridge.provide), so the page's
//              is replaced here by that component's own fire(): today's popView over the page's POP_CFG, popPick and
//              popDismissText. What it would show is kept, whole.
//   the beta   frontends/native/src/pop-up/pop-ups.ts over its own SQLite store and the grid its own launch handed
//              back.
//
// After every step the two stores hold every ia_ key equal, value for value, with no family left out, and each
// pop-up raised is the same pop-up, whole: its icon, kicker, line, sub line, stats, buttons with their handler code,
// classes and confetti count. The two apps draw their random lines from the same pinned sequence, in the same order.
//
// The expected value of every comparison is today's page, on purpose: the page stays the reference until the
// cutover. The hand-typed values are in tests/unit/native-pop-ups.test.ts.
import assert from 'node:assert/strict';
import type { Cfg } from '@ia/core';
import type { StateStore } from '@ia/core/engine/state-store.ts';
import { type PopOptions, type PopView, popView } from '../../frontends/app/src/app/screens/pop-up/pop-up-model.ts';
import { type DeckProgram, deckView } from '../../frontends/native/src/deck/deck-screen.ts';
import { type Session, markDay } from '../../frontends/native/src/deck/deck-writes.ts';
import { callItLog } from '../../frontends/app/src/app/screens/deck/deck-model.ts';
import { type PopCall, type PopSession, type Reminder, fireCompletionPopup, maybeShowReminder, popOf, resolveReminder } from '../../frontends/native/src/pop-up/pop-ups.ts';
import { liveProgram } from '../../frontends/native/src/this-week/week-screen.ts';
import { sqliteTestStore } from './sqlite-kv.ts';
import { Phone, at, firstWeek } from './stored-state.ts';

const J = JSON.stringify;
const plain = <T>(x: T): T => JSON.parse(JSON.stringify(x)) as T;
const held = (s: StateStore): Record<string, string> => Object.fromEntries(s.keys().filter((k) => k.startsWith('ia_')).sort().map((k) => [k, s.get(k)!]));
const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

/** The pinned sequence both apps draw from (the one support/stored-state.ts pins a launch to, from any seed). */
export function lcg(seed: number): () => number {
  let s = seed;
  return () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; };
}
/** Both apps set to the start of one sequence: the page's Math.random, and the draw handed to the beta. */
export function seedBoth(P: Phone, seed: number): () => number {
  P.ev(`Math.random=(function(){var s=${seed};return function(){s=(s*1664525+1013904223)%4294967296;return s/4294967296;};})();`);
  return lcg(seed);
}

/** One pop-up the page raised, as the Angular PopUp would show it. */
export interface Raised { tier: string; view: PopView }
/**
 * Every pop-up the page raises from here on, in order. The page's popFire becomes the Angular PopUp's fire(): today's
 * popView over the page's own config and pickers. A launch makes a new page, so this is asked again after each one.
 */
export function pops(P: Phone): Raised[] {
  const ctx = P.IA.ctx as Record<string, unknown>;
  if (ctx['__pops']) return ctx['__pops'] as Raised[];
  const list: Raised[] = [];
  ctx['__pops'] = list;
  ctx['__fire'] = (tier: string, opts: PopOptions | undefined): void => {
    const cfg = P.ev('POP_CFG') as Record<string, never>, icons = P.ev('ASY_ICON_PATHS') as object;
    const pick = P.ev('popPick') as (t: string, w: number | undefined, d: string | undefined) => string, dismiss = P.ev('popDismissText') as () => string;
    list.push({ tier, view: plain(popView(tier, opts ? plain(opts) : opts, {
      tier: (n) => cfg[n], isIcon: (n) => Object.prototype.hasOwnProperty.call(icons, n), pick: (t, w, d) => pick(t, w, d), dismissText: () => dismiss(),
    })) });
  };
  P.ev('popFire=function(tier,opts){__fire(tier,opts);};');
  return list;
}

/** The beta's pop-up for a call, as plain data, beside the page's. */
function sameView(s: PopSession, call: PopCall, now: Date, random: () => number, page: Raised | undefined, what: string): PopView {
  const view = plain(popOf(s, call, now, random));
  assert.ok(page, what + ': the beta raises a ' + call.tier + ' pop-up and today\'s raises none');
  assert.equal(call.tier, page.tier, what + ': the tier');
  assert.deepStrictEqual(view, page.view, what + ': the pop-up, whole');
  return view;
}
export function sameKeys(store: StateStore, P: Phone, what: string): void {
  const beta = held(store), page = P.dump();
  for (const k of new Set([...Object.keys(beta), ...Object.keys(page)])) assert.equal(beta[k], page[k], what + ': ' + k + ' differs');
}

/** What the comparisons held. */
export interface PopTally {
  launches: number; reminders: number; longGaps: number; done: number; skipped: number; left: number; marks: number; checks: number;
  tiers: Record<string, number>; lines: Record<string, number>; mornings: number;
}
export const popTally = (): PopTally => ({ launches: 0, reminders: 0, longGaps: 0, done: 0, skipped: 0, left: 0, marks: 0, checks: 0, tiers: {}, lines: {}, mornings: 0 });
const bump = (m: Record<string, number>, k: string): void => { m[k] = (m[k] || 0) + 1; };
const LONG_GAP = 'More than a week off. Mark what happened, then ease back in. First sessions back at reduced effort. Never chase missed work.';

/**
 * The reminder a launch raises, on both apps: the page's queued timers run (the launch's own, 600 ms), the beta asks
 * its own port, and the two raise the same pop-up or none. Returns the beta's reminder, with the page's.
 */
export function sameReminder(P: Phone, s: PopSession, random: () => number, T: PopTally | null, what: string): { r: Reminder; page: Raised } | null {
  const list = pops(P), n0 = list.length;
  const now = new Date(P.ev('Date.now()') as number);
  P.settle();
  const r = maybeShowReminder(s, now, random);
  const raised = list.slice(n0);
  assert.equal(raised.length, r ? 1 : 0, what + ': today\'s raised ' + raised.length + ' pop-ups at the launch, the beta ' + (r ? 'a reminder' : 'none'));
  if (r) {
    const v = sameView(s, r.call, now, random, raised[0], what + ', the reminder');
    if (T) { T.reminders++; if (v.msg === LONG_GAP) T.longGaps++; bump(T.tiers, 'reminder'); bump(T.lines, v.msg); }
  }
  sameKeys(s.store, P, what + ', after the reminder');
  if (T) T.checks++;
  return r ? { r, page: raised[0]! } : null;
}

/** The reminder answered on both apps: the page through the button's own handler code, the beta through its port. */
export function answerReminder(P: Phone, s: PopSession, asked: { r: Reminder; page: Raised }, done: boolean, random: () => number, T: PopTally | null, what: string): void {
  const list = pops(P), n0 = list.length, t0 = P.toasts.length;
  const now = new Date(P.ev('Date.now()') as number);
  const act = asked.page.view.actions[done ? 0 : 1]!;
  assert.equal(act.label, done ? '✓ Done' : '✕ Skip', what + ': the button');
  P.ev(act.onclick);
  P.settle();
  const toast = resolveReminder(s, asked.r.week, asked.r.dayKey, asked.r.title, done ? 'complete' : 'skipped', now.getTime());
  assert.deepStrictEqual([toast], P.toasts.slice(t0), what + ': the toast');
  const raised = list.slice(n0);
  if (done) {
    const v = sameView(s, fireCompletionPopup(s, asked.r.week, asked.r.dayKey, now), now, random, raised[0], what + ', Done');
    if (T) { bump(T.tiers, raised[0]!.tier); bump(T.lines, v.msg); }
  }
  assert.equal(raised.length, done ? 1 : 0, what + ': Done raises the completion pop-up, Skip raises none');
  sameKeys(s.store, P, what + ', after the answer');
  if (T) { T.checks++; if (done) T.done++; else T.skipped++; }
}

/** Mark the day done as the deck does (deck.ts markDay; deck-writes.ts markDay), with the pop-up that follows, on both. */
export function markBoth(P: Phone, s: PopSession, week: number, dayKey: string, title: string, rpe: number | null, notes: string, random: () => number, T: PopTally | null, what: string): PopView {
  const list = pops(P), n0 = list.length;
  const nowMs = P.ev('Date.now()') as number, now = new Date(nowMs);
  P.ev(`currentWeek=${week};_setCurrentDayKey(${J(dayKey)});snapshotDay(${week},${J(dayKey)});`);
  const logs = plain(P.ev('getLogs()')) as Record<string, Record<string, unknown>>;
  const key = P.ev(`logKey(${week},${J(dayKey)})`) as string;
  logs[key] = callItLog(logs[key] as never, rpe, notes, week, nowMs) as never;
  (P.IA.ctx as Record<string, unknown>)['__logs'] = logs;
  P.ev(`saveLogs(__logs);markDayComplete(${week},${J(dayKey)},${J(title)});ruReset();renderWeekView();fireCompletionPopup(${week},${J(dayKey)});`);
  P.settle();
  markDay({ store: s.store, prog: s.prog as unknown as DeckProgram, week, dayKey } as Session, title, rpe, notes, nowMs);
  const raised = list.slice(n0);
  assert.equal(raised.length, 1, what + ': Mark the day done raises one pop-up');
  const v = sameView(s, fireCompletionPopup(s, week, dayKey, now), now, random, raised[0], what + ', Mark the day done');
  sameKeys(s.store, P, what + ', after Mark the day done');
  if (T) { T.marks++; T.checks++; bump(T.tiers, raised[0]!.tier); bump(T.lines, v.msg); }
  return v;
}

/**
 * One program from its first whole week to the day after its last: every scheduled day opened on both apps at its own
 * date, some in the morning, except every seventh, which is not opened, and two whole weeks, which are not either.
 * At each launch the reminder is compared and, when raised, answered: Done three times in five, Skip once, left alone
 * once (the last day's is always Done, which is the season on a program whose last day opens no deck). A day whose
 * deck opens is then marked done through it. The beta's store is its own from the first day: it is never copied from
 * the page again, only compared with it.
 */
export function popLife(cfg: Cfg, createdAt: string, T: PopTally): { phone: Phone; store: StateStore } {
  const P = new Phone().launch(createdAt);
  P.generate(cfg);
  const { first, start } = firstWeek(P, createdAt);
  const total: number = P.ev('activeProg.totalWeeks');
  const store = sqliteTestStore();
  for (const [k, v] of Object.entries(P.dump())) store.set(k, v);
  const days = (JSON.parse(P.ev('JSON.stringify(scheduledDays().map(function(x){return {week:x.week,d:x.d};}))') as string) as { week: number; d: string }[]).filter((x) => x.week >= first);
  const last = days[days.length - 1]!;
  const gap = first + Math.min(4, Math.max(1, total - first - 3));
  let seed = 7, asked = 0;
  const told = { overlay: 0, freeze: 0, rebuild: 0 };
  const report = { overlay: () => { told.overlay++; }, freeze: () => { told.freeze++; }, rebuild: () => { told.rebuild++; } };

  /** One launch on both apps at `when`, the reminder and its answer; then `mark`, where a day is given and its deck opens. */
  const launch = (when: string, day: { week: number; d: string } | null, n: number): void => {
    const what = 'the launch at ' + when;
    P.launch(when);
    const nowMs = P.ev('Date.now()') as number;
    const grid = liveProgram(store, nowMs, report);
    assert.ok(grid, what + ': the beta\'s launch hands back the program');
    sameKeys(store, P, what);
    assert.deepStrictEqual(plain(grid), plain(P.prog), what + ': the program each launch hands back');
    const s: PopSession = { store, prog: grid as PopSession['prog'] };
    const random = seedBoth(P, seed = (seed * 69069 + 1) % 4294967296);
    T.launches++;
    const r = sameReminder(P, s, random, T, what);
    if (r) {
      const isLast = r.r.week === last.week && r.r.dayKey === last.d;
      const k = asked++ % 5;
      if (isLast || k < 3) answerReminder(P, s, r, true, random, T, what);
      else if (k === 3) answerReminder(P, s, r, false, random, T, what);
      else T.left++;
    }
    if (!day) return;
    const view = deckView(store, grid as unknown as DeckProgram, day.week, day.d, nowMs);
    if (!view || view.dayDone) return;
    markBoth(P, s, day.week, day.d, view.title, n % 3 === 0 ? 6 + (n % 4) : null, n % 4 === 0 ? 'Felt strong, day ' + n : '', random, T, what + ', week ' + day.week + ' ' + day.d);
  };

  days.forEach((x, g) => {
    if (x.week === gap || x.week === gap + 1) return;
    if (g % 7 === 5) return;
    const morning = g % 4 === 1;
    if (morning) T.mornings++;
    launch(at(start, 7 * (x.week - 1) + DAYS.indexOf(x.d), morning ? '06:40' : '18:00'), x, g);
  });
  // The day after the last scheduled day, and the day after that: the last day's reminder, then nothing left to ask.
  const end = 7 * (last.week - 1) + DAYS.indexOf(last.d);
  launch(at(start, end + 1, '09:00'), null, 0);
  launch(at(start, end + 2, '09:00'), null, 0);
  assert.deepStrictEqual(told, { overlay: 0, freeze: 0, rebuild: 0 }, 'no launch of the beta reported a failure');
  return { phone: P, store };
}
