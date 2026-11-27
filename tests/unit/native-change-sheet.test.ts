// The Expo app's Hurt? and Traveling?, its chips with I'm back and the check in, This Week's two dates, the date box
// and the copy button (MIGRATION.md phase 3, row 5, its third session), each rule by a hand table: the date words
// and the span grammar (V175, D29), every kind of chip and when the check in is drawn, the draft and what a From
// carries, each refusal and what it leaves, the start date's resolver (D21, D24, D25, D184 c), the title after a
// date, the date box's sums, the copied text, and the wiring of the screens. Every expected value here is typed by
// hand from today's code and rulings, or worked out by date arithmetic; the two apps side by side are
// tests/integration/native-change-sheet.test.ts.
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, test } from 'vitest';
import { memoryStore } from '@ia/core/engine/state-store.ts';
import { REPO } from '../support/app.ts';
import type { OverlayDraft } from '../../frontends/native/src/change-sheet/change-sheet-model.ts';
import {
  CHECK_IN_MS, CHIP_GEAR, CHIP_REMOVE, OVERLAY_TYPE_LABEL, type OverlayProgram, type StoredOverlay, addDaysIso, dayCount, dayCountWord, fmtDate, fmtDateWd, isoToday, newOverlayDraft,
  openInjury, openTravel, overlayBackCopy, overlayChips, overlaySpanLabel, setDraft, sheetView,
} from '../../frontends/native/src/change-sheet/overlay-readers.ts';
import { OVERLAY_TOASTS, applyInjuryDraft, applyOverlayDraft, imBackFromInjury, injReassess, injSnooze, removeOverlay } from '../../frontends/native/src/change-sheet/overlay-writes.ts';
import { DATE_WORDS, PRESSED_DIM, RESET_VALUE, calendarDay, pickedValue, resetDay, resetWrites } from '../../frontends/native/src/date-box/date-box.ts';
import { COPIED, type ListProgram, progSelLines, runAnchorLine } from '../../frontends/native/src/program-list/list-readers.ts';
import { copyText } from '../../frontends/native/src/program-list/list-screen.ts';
import { DATE_TOASTS, type DatedProgram, resolveStartDate, rsRace, setProgRace, setProgStart, titleAfterDate } from '../../frontends/native/src/week-dates/week-dates.ts';

process.env['TZ'] = 'America/New_York';
const NATIVE = join(REPO, 'frontends/native/src');
const TODAY = join(REPO, 'frontends/app/src/app/screens');
const read = (f: string): string => readFileSync(join(NATIVE, f), 'utf8');
const strip = (t: string): string => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`\\])\/\/[^\n]*/g, '$1');
const DAY = 86400000;

// A program of twelve weeks that starts on Monday 2026-08-31, so week 3 is Monday 2026-09-14 to Sunday 2026-09-20,
// and its last day is Sunday 2026-11-22. Now is Wednesday 2026-09-16, 10:00.
const NOW = new Date(2026, 8, 16, 10, 0, 0);
const prog = (overlays?: unknown[], over: Record<string, unknown> = {}): OverlayProgram => ({ id: 'p1', startDate: '2026-08-31', totalWeeks: 12, ...(overlays ? { overlays } : {}), ...over } as unknown as OverlayProgram);
const ov = (id: string, o: Record<string, unknown>): StoredOverlay => ({ id, note: '', created: NOW.getTime(), ...o } as unknown as StoredOverlay);
const told: string[] = [];
const report = { overlay: () => { told.push('overlay'); }, freeze: () => { told.push('freeze'); }, rebuild: () => { told.push('rebuild'); } };
const draft = (over: Partial<OverlayDraft> = {}): OverlayDraft => ({ ...newOverlayDraft(), ...over });

describe('native change sheet: the sheet\'s model is today\'s file', () => {
  test('change-sheet-model.ts in frontends/native is frontends/app\'s, byte for byte', () => {
    const today = readFileSync(join(TODAY, 'change-sheet', 'change-sheet-model.ts'));
    assert.ok(today.length > 5000, 'today\'s file was read');
    assert.ok(today.equals(readFileSync(join(NATIVE, 'change-sheet', 'change-sheet-model.ts'))));
  });
});

describe('native change sheet: the date words (V175, D29)', () => {
  test('a date as the sheet prints it: the month and the day, the weekday with no comma, Set date for none', () => {
    assert.equal(fmtDate('2026-09-01'), 'Sep 1');
    assert.equal(fmtDate('2026-12-25'), 'Dec 25');
    assert.equal(fmtDate(null), 'Set date');
    assert.equal(fmtDate(''), 'Set date');
    assert.equal(fmtDateWd('2026-09-01'), 'Tue Sep 1');
    assert.equal(fmtDateWd('2026-11-22'), 'Sun Nov 22');
    assert.equal(fmtDateWd(null), '');
    assert.equal(fmtDateWd(''), '');
  });
  test('the days a span covers count both ends, and are words up to fourteen', () => {
    assert.equal(dayCount('2026-09-01', '2026-09-01'), 1);
    assert.equal(dayCount('2026-09-01', '2026-09-04'), 4);
    assert.equal(dayCount('2026-09-29', '2026-10-02'), 4);
    assert.equal(dayCount('2026-10-25', '2026-11-02'), 9, 'across the night the clocks go back');
    assert.equal(dayCount(null, '2026-09-04'), 0);
    assert.equal(dayCount('2026-09-01', null), 0);
    assert.equal(dayCount('2026-09-01', 'soon'), 0);
    assert.deepEqual([0, 1, 2, 9, 14, 15, 20].map(dayCountWord), ['Zero days', 'One day', 'Two days', 'Nine days', 'Fourteen days', '15 days', '20 days']);
  });
  test('today and a day some days on are local days; a date that does not read counts from today', () => {
    assert.equal(isoToday(NOW), '2026-09-16');
    assert.equal(isoToday(new Date(2026, 0, 5, 23, 59)), '2026-01-05');
    assert.equal(addDaysIso('2026-09-16', 13, NOW), '2026-09-29');
    assert.equal(addDaysIso('2026-09-29', 3, NOW), '2026-10-02');
    assert.equal(addDaysIso('2026-12-31', 1, NOW), '2027-01-01');
    assert.equal(addDaysIso('2026-09-16', -1, NOW), '2026-09-15');
    assert.equal(addDaysIso(null, 1, NOW), '2026-09-17');
    assert.equal(addDaysIso('soon', 6, NOW), '2026-09-22');
    assert.equal(NOW.getDate(), 16, 'the clock handed in is left as it was');
  });
  test('a span is named by its weeks when it is whole weeks inside the program, else by its days', () => {
    const p = prog();
    assert.equal(overlaySpanLabel(p, { from: '2026-09-07', to: '2026-09-13' }), 'Week 2');
    assert.equal(overlaySpanLabel(p, { from: '2026-09-07', to: '2026-09-20' }), 'Weeks 2–3');
    assert.equal(overlaySpanLabel(p, { from: '2026-09-01', to: '2026-09-01' }), 'Tue Sep 1');
    assert.equal(overlaySpanLabel(p, { from: '2026-09-01', to: '2026-09-04' }), 'Sep 1–4');
    assert.equal(overlaySpanLabel(p, { from: '2026-09-29', to: '2026-10-02' }), 'Sep 29–Oct 2');
    assert.equal(overlaySpanLabel(p, { from: '2026-09-01', to: null }), 'From Sep 1');
    assert.equal(overlaySpanLabel(p, { from: '2026-09-08', to: '2026-09-13' }), 'Sep 8–13', 'a Tuesday to a Sunday is not whole weeks');
    assert.equal(overlaySpanLabel(p, { from: '2026-09-07', to: '2026-09-12' }), 'Sep 7–12', 'a Monday to a Saturday is not whole weeks');
    assert.equal(overlaySpanLabel(p, { from: '2027-06-07', to: '2027-06-13' }), 'Jun 7–13', 'a whole week past the program is named by its days');
    assert.equal(overlaySpanLabel(prog(undefined, { totalWeeks: 0 }), { from: '2026-09-07', to: '2026-09-13' }), 'Sep 7–13', 'a program with no length has no weeks to name');
    assert.equal(overlaySpanLabel(p, { from: null, to: '2026-09-04' }), '');
    assert.equal(overlaySpanLabel(p, { from: 'soon', to: '2026-09-04' }), '');
    assert.equal(overlaySpanLabel(p, { from: '2026-09-01', to: 'soon' }), '');
    assert.equal(overlaySpanLabel(p, null), '');
  });
  test('the day the program picks back up is the day after the last one covered, or the end of the program', () => {
    const p = prog();
    assert.equal(overlayBackCopy(p, { to: '2026-09-04' }, NOW), 'Sat Sep 5 picks your program back up.');
    assert.equal(overlayBackCopy(p, { to: '2026-11-21' }, NOW), 'Sun Nov 22 picks your program back up.', 'the program\'s last day is still inside it');
    assert.equal(overlayBackCopy(p, { to: '2026-11-22' }, NOW), 'That runs to the end of your program.');
    assert.equal(overlayBackCopy(p, { to: '2027-01-10' }, NOW), 'That runs to the end of your program.');
    assert.equal(overlayBackCopy(prog(undefined, { totalWeeks: 0 }), { to: '2026-11-22' }, NOW), 'Mon Nov 23 picks your program back up.', 'a program with no length has no end to run to');
    assert.equal(overlayBackCopy(prog(undefined, { startDate: null }), { to: '2026-11-22' }, NOW), 'Mon Nov 23 picks your program back up.', 'nor has one with no start');
    assert.equal(overlayBackCopy(p, { to: null }, NOW), '');
    assert.equal(overlayBackCopy(p, null, NOW), '');
  });
  test('the labels are today\'s', () => {
    assert.deepEqual(OVERLAY_TYPE_LABEL, { substitute: 'Travel', injury: 'Injury', reduce: 'Less time', suspend: 'Suspended' });
    assert.deepEqual(CHIP_GEAR, { bodyweight: 'Room only', home_basic: 'Mini gym', commercial: 'Full gym', home_full: 'Home Full', crossfit: 'CrossFit Box', minimal: 'Minimal / Travel' });
    assert.equal(CHIP_REMOVE, 'Remove change');
    assert.equal(CHECK_IN_MS, 1209600000, 'fourteen days');
  });
});

describe('native change sheet: the chips (renderOverlayChip)', () => {
  const chips = (list: unknown[], now = NOW.getTime()) => overlayChips(prog(list), now);
  const answers = [{ ans: 'better', label: 'Better' }, { ans: 'same', label: 'Same' }, { ans: 'worse', label: 'Worse' }];

  test('a trip: Travel, its span, its gear and the day things are back to normal', () => {
    assert.deepEqual(chips([ov('a', { type: 'substitute', from: '2026-09-14', to: '2026-09-20', patch: { equipment: 'home_basic' } })]),
      [{ kind: 'chip', id: 'a', title: 'Travel · Week 3', sub: 'Mini gym. Back to normal Mon Sep 21.', back: false }]);
    assert.deepEqual(chips([ov('a', { type: 'substitute', from: '2026-09-16', to: '2026-09-16', patch: { equipment: 'bodyweight' } })]),
      [{ kind: 'chip', id: 'a', title: 'Travel · Wed Sep 16', sub: 'Room only. Back to normal Thu Sep 17.', back: false }]);
  });
  test('each gear by today\'s name, a gear it has no name for as stored, and Modified for a change with no gear', () => {
    const sub = (equipment: string): string => chips([ov('a', { type: 'substitute', from: '2026-09-16', to: '2026-09-18', patch: { equipment } })])[0]!.sub;
    assert.deepEqual(['bodyweight', 'home_basic', 'commercial', 'home_full', 'crossfit', 'minimal', 'kettlebells'].map(sub), [
      'Room only. Back to normal Sat Sep 19.', 'Mini gym. Back to normal Sat Sep 19.', 'Full gym. Back to normal Sat Sep 19.', 'Home Full. Back to normal Sat Sep 19.',
      'CrossFit Box. Back to normal Sat Sep 19.', 'Minimal / Travel. Back to normal Sat Sep 19.', 'kettlebells. Back to normal Sat Sep 19.']);
    assert.equal(chips([ov('a', { type: 'substitute', from: '2026-09-16', to: '2026-09-18', patch: {} })])[0]!.sub, 'Modified. Back to normal Sat Sep 19.');
    assert.equal(chips([ov('a', { type: 'substitute', from: '2026-09-16', to: '2026-09-18', patch: null })])[0]!.sub, 'Modified. Back to normal Sat Sep 19.');
  });
  test('the title is the kind\'s name: Travel, Injury, Less time, Suspended, and Change for a kind it has no name for', () => {
    const title = (type: string): string => chips([ov('a', { type, from: '2026-09-29', to: '2026-10-02', patch: {} })])[0]!.title;
    assert.deepEqual(['substitute', 'injury', 'reduce', 'suspend', 'pause'].map(title), ['Travel · Sep 29–Oct 2', 'Injury · Sep 29–Oct 2', 'Less time · Sep 29–Oct 2', 'Suspended · Sep 29–Oct 2', 'Change · Sep 29–Oct 2']);
  });
  test('a change with no end is open-ended, unless it is an injury', () => {
    assert.deepEqual(chips([ov('a', { type: 'suspend', from: '2026-09-16', to: null, patch: null })]), [{ kind: 'chip', id: 'a', title: 'Suspended · From Sep 16', sub: 'Modified. Open-ended.', back: false }]);
    assert.deepEqual(chips([ov('a', { type: 'substitute', from: '2026-09-10', to: null, patch: { equipment: 'minimal' } })]), [{ kind: 'chip', id: 'a', title: 'Travel · From Sep 10', sub: 'Minimal / Travel. Open-ended.', back: false }]);
  });
  test('an injury: its region, its tier, I\'m back, and Tap I\'m back while it has no end', () => {
    assert.deepEqual(chips([ov('b', { type: 'injury', from: '2026-09-10', to: null, patch: { injury: { region: 'knee', tier: 'workaround' } } })]),
      [{ kind: 'chip', id: 'b', title: 'Injury · From Sep 10', sub: 'Knee (working around it). Tap I’m back when it’s ready.', back: true }]);
    assert.deepEqual(chips([ov('b', { type: 'injury', from: '2026-09-01', to: null, patch: { injury: { region: 'lowback', tier: 'protect' } } })]),
      [{ kind: 'chip', id: 'b', title: 'Injury · From Sep 1', sub: 'Lower Back (protected). Tap I’m back when it’s ready.', back: true }]);
    const label = (region: string): string => chips([ov('b', { type: 'injury', from: '2026-09-16', to: null, patch: { injury: { region, tier: 'protect' } } })])[0]!.sub;
    assert.deepEqual(['shoulder', 'elbow', 'lowback', 'hip', 'knee', 'ankle', 'calf', 'neck'].map(label), ['Shoulder', 'Elbow / Wrist', 'Lower Back', 'Hip / Glute', 'Knee', 'Ankle / Foot / Shin', 'Calf', 'Injury'].map((l) => l + ' (protected). Tap I’m back when it’s ready.'));
  });
  test('a return week: its own title and line, no I\'m back; the week after it reads as an injury with an end, and keeps I\'m back', () => {
    assert.deepEqual(chips([ov('e', { type: 'injury', from: '2026-09-16', to: '2026-09-22', patch: { injury: { region: 'hip', tier: 'workaround', bridge: true } } })]),
      [{ kind: 'chip', id: 'e', title: 'Return week · Sep 16–22', sub: 'Return week · Hip / Glute. One light week, then full send.', back: false }]);
    assert.deepEqual(chips([ov('e', { type: 'injury', from: '2026-09-16', to: '2026-09-22', patch: { injury: { region: 'neck', tier: 'workaround', bridge: true } } })])[0]!.sub, 'Return week · Injury. One light week, then full send.');
    assert.deepEqual(chips([ov('f', { type: 'injury', from: '2026-09-23', to: '2026-09-29', patch: { injury: { region: 'hip', tier: 'workaround', halfstep: true } } })]),
      [{ kind: 'chip', id: 'f', title: 'Injury · Sep 23–29', sub: 'Hip / Glute (working around it). Back to normal Wed Sep 30.', back: true }]);
  });
  test('an injury kind with no injury on it reads as a plain change: its gear, no I\'m back, no check in', () => {
    assert.deepEqual(chips([ov('a', { type: 'injury', from: '2026-08-31', to: null, patch: { equipment: 'bodyweight' }, created: NOW.getTime() - 30 * DAY })]),
      [{ kind: 'chip', id: 'a', title: 'Injury · From Aug 31', sub: 'Room only. Open-ended.', back: false }]);
    assert.deepEqual(chips([ov('a', { type: 'substitute', from: '2026-08-31', to: null, patch: { injury: { region: 'knee', tier: 'protect' } }, created: NOW.getTime() - 30 * DAY })]),
      [{ kind: 'chip', id: 'a', title: 'Travel · From Aug 31', sub: 'Modified. Open-ended.', back: false }], 'nor does a trip that carries one');
  });
  test('the check in is drawn under an open injury fourteen days after it was set, to the millisecond', () => {
    const inj = (created: number, more: Record<string, unknown> = {}) => ov('c', { type: 'injury', from: '2026-09-01', to: null, patch: { injury: { region: 'lowback', tier: 'protect' } }, created, ...more });
    const now = NOW.getTime();
    const card = { kind: 'checkin', id: 'c', title: 'Check in', sub: 'Two weeks on the lower back plan. How is it feeling?', answers };
    assert.deepEqual(chips([inj(now - 14 * DAY)]).slice(1), [card]);
    assert.deepEqual(chips([inj(now - 14 * DAY + 1)]).slice(1), []);
    assert.deepEqual(chips([inj(now - 13 * DAY)]).slice(1), []);
    assert.deepEqual(chips([inj(now - 15 * DAY)]).slice(1), [card]);
    assert.equal(chips([inj(now - 14 * DAY)])[0]!.kind, 'chip', 'the chip first, the check in under it');
  });
  test('the check in counts from the last answer when there is one', () => {
    const now = NOW.getTime();
    const inj = (lastAsk: number) => ov('d', { type: 'injury', from: '2026-08-31', to: null, patch: { injury: { region: 'ankle', tier: 'workaround' } }, created: now - 40 * DAY, lastAsk });
    assert.equal(chips([inj(now - 14 * DAY + 1)]).length, 1);
    assert.equal(chips([inj(now - 14 * DAY)]).length, 2);
    assert.equal((chips([inj(now - 14 * DAY)])[1] as { sub: string }).sub, 'Two weeks on the ankle / foot / shin plan. How is it feeling?');
  });
  test('an injury with no stamp at all is never asked about; one in a region the app has no name for is asked about it', () => {
    const now = NOW.getTime();
    assert.equal(overlayChips(prog([{ id: 'g', type: 'injury', from: '2026-08-31', to: null, patch: { injury: { region: 'knee', tier: 'workaround' } } }]), now).length, 1);
    assert.deepEqual(chips([ov('g', { type: 'injury', from: '2026-08-31', to: null, patch: { injury: { region: 'neck', tier: 'workaround' } }, created: now - 20 * DAY })])[1],
      { kind: 'checkin', id: 'g', title: 'Check in', sub: 'Two weeks on the it plan. How is it feeling?', answers });
  });
  test('no check in for a return week, for the week after it, or for an injury kind with no injury on it', () => {
    const old = NOW.getTime() - 30 * DAY;
    assert.equal(chips([ov('e', { type: 'injury', from: '2026-09-01', to: '2026-09-30', patch: { injury: { region: 'hip', tier: 'workaround', bridge: true } }, created: old })]).length, 1);
    assert.equal(chips([ov('f', { type: 'injury', from: '2026-09-01', to: '2026-09-30', patch: { injury: { region: 'hip', tier: 'workaround', halfstep: true } }, created: old })]).length, 1);
    assert.equal(chips([ov('h', { type: 'injury', from: '2026-09-01', to: null, patch: { injury: { region: 'hip', tier: 'workaround', bridge: true } }, created: old })]).length, 1, 'a return week is never asked about, even with no end');
  });
  test('a change that has ended, one outside the program and one with no start draw nothing; one that ends today is drawn', () => {
    assert.deepEqual(chips([ov('x', { type: 'substitute', from: '2026-09-10', to: '2026-09-15', patch: { equipment: 'bodyweight' } })]), []);
    assert.equal(chips([ov('x', { type: 'substitute', from: '2026-09-10', to: '2026-09-16', patch: { equipment: 'bodyweight' } })]).length, 1);
    assert.deepEqual(overlayChips(prog([ov('x', { type: 'substitute', from: '2026-09-10', to: '2026-09-16', patch: { equipment: 'bodyweight' } })]), new Date(2026, 8, 16, 23, 59, 59).getTime()).length, 1, 'to the last second of its last day');
    assert.deepEqual(chips([ov('x', { type: 'substitute', from: '2027-06-01', to: '2027-06-03', patch: { equipment: 'bodyweight' } })]), []);
    assert.deepEqual(chips([ov('x', { type: 'substitute', from: null, to: '2026-09-20', patch: { equipment: 'bodyweight' } })]), []);
    assert.deepEqual(chips([null]), []);
    assert.deepEqual(overlayChips(prog(), NOW.getTime()), []);
    assert.deepEqual(overlayChips(null, NOW.getTime()), []);
    assert.deepEqual(overlayChips(prog([ov('x', { type: 'substitute', from: '2026-09-16', to: '2026-09-18', patch: {} })], { totalWeeks: 0 }), NOW.getTime()), [], 'a program with no length holds no change');
  });
  test('the chips stand in stored order, each check in under its own chip', () => {
    const old = NOW.getTime() - 20 * DAY;
    const list = chips([
      ov('1', { type: 'injury', from: '2026-08-31', to: null, patch: { injury: { region: 'knee', tier: 'workaround' } }, created: old }),
      ov('2', { type: 'substitute', from: '2026-09-16', to: '2026-09-18', patch: { equipment: 'home_basic' } }),
      ov('3', { type: 'injury', from: '2026-09-01', to: null, patch: { injury: { region: 'calf', tier: 'protect' } }, created: old }),
    ]);
    assert.deepEqual(list.map((c) => c.kind + ' ' + c.id), ['chip 1', 'checkin 1', 'chip 2', 'chip 3', 'checkin 3']);
  });
});

describe('native change sheet: the draft (the page\'s _ovDraft)', () => {
  test('a new draft is the page\'s own as a page load leaves it', () => {
    assert.deepEqual(newOverlayDraft(), { type: 'substitute', from: null, to: null, equipment: 'minimal', tab: 'travel', injRegion: null, injTier: 'workaround' });
  });
  test('Traveling? opens from today for fourteen days on Mini gym, or on the dates the draft last held', () => {
    assert.deepEqual(openTravel(newOverlayDraft(), NOW), { type: 'substitute', from: '2026-09-16', to: '2026-09-29', equipment: 'home_basic', tab: 'travel', injRegion: null, injTier: 'workaround' });
    assert.deepEqual(openTravel(draft({ from: '2026-10-01', to: '2026-10-03', equipment: 'bodyweight', type: 'injury', tab: 'injury', injRegion: 'knee', injTier: 'protect' }), NOW),
      { type: 'substitute', from: '2026-10-01', to: '2026-10-03', equipment: 'home_basic', tab: 'travel', injRegion: 'knee', injTier: 'protect' });
    assert.equal(openTravel(draft({ from: '2026-10-01', to: null }), NOW).to, '2026-10-14', 'a blank Through is thirteen days after From');
    assert.equal(openTravel(draft({ from: '', to: '2026-10-03' }), NOW).from, '2026-09-16', 'a blank From is today');
  });
  test('Hurt? opens from today with no region, or on the live injury\'s region and tier', () => {
    assert.deepEqual(openInjury(draft({ from: '2026-10-01', to: '2026-10-03', equipment: 'bodyweight', injRegion: 'hip', injTier: 'protect' }), prog([]), NOW),
      { type: 'injury', from: '2026-09-16', to: '2026-10-03', equipment: 'bodyweight', tab: 'injury', injRegion: null, injTier: 'workaround' });
    const live = prog([ov('b', { type: 'injury', from: '2026-09-10', to: null, patch: { injury: { region: 'calf', tier: 'protect' } } })]);
    assert.deepEqual([openInjury(newOverlayDraft(), live, NOW).injRegion, openInjury(newOverlayDraft(), live, NOW).injTier], ['calf', 'protect']);
    const bridge = prog([ov('e', { type: 'injury', from: '2026-09-16', to: '2026-09-22', patch: { injury: { region: 'calf', tier: 'workaround', bridge: true } } })]);
    assert.equal(openInjury(draft({ injRegion: 'hip' }), bridge, NOW).injRegion, null, 'a return week is not a live injury');
    const ended = prog([ov('b', { type: 'injury', from: '2026-09-01', to: '2026-09-15', patch: { injury: { region: 'calf', tier: 'protect' } } })]);
    assert.equal(openInjury(newOverlayDraft(), ended, NOW).injRegion, null, 'nor is one that has ended');
    assert.equal(openInjury(newOverlayDraft(), null, NOW).injRegion, null);
  });
  test('a choice writes its one field; a From moved past Through carries Through thirteen days on', () => {
    const d = draft({ from: '2026-09-16', to: '2026-09-29' });
    assert.deepEqual(setDraft(d, 'equipment', 'bodyweight', NOW), { ...d, equipment: 'bodyweight' });
    assert.deepEqual(setDraft(d, 'injRegion', 'knee', NOW), { ...d, injRegion: 'knee' });
    assert.deepEqual(setDraft(d, 'injTier', 'protect', NOW), { ...d, injTier: 'protect' });
    assert.deepEqual(setDraft(d, 'to', '2026-09-01', NOW), { ...d, to: '2026-09-01' }, 'a Through before From is kept as picked; Apply change refuses it');
    assert.deepEqual(setDraft(d, 'from', '2026-09-20', NOW), { ...d, from: '2026-09-20' });
    assert.deepEqual(setDraft(d, 'from', '2026-09-29', NOW), { ...d, from: '2026-09-29' }, 'a From on Through\'s own day carries nothing');
    assert.deepEqual(setDraft(d, 'from', '2026-09-30', NOW), { ...d, from: '2026-09-30', to: '2026-10-13' });
    assert.deepEqual(setDraft(d, 'from', '', NOW), { ...d, from: '' }, 'a blank From carries nothing');
    assert.deepEqual(setDraft(draft({ from: '2026-09-16', to: '' }), 'from', '2026-12-01', NOW), draft({ from: '2026-12-01', to: '' }), 'nor does any From while Through is blank');
    assert.deepEqual(setDraft(d, 'to', '', NOW), { ...d, to: '' });
    assert.deepEqual(d, draft({ from: '2026-09-16', to: '2026-09-29' }), 'the draft handed in is left as it was');
  });
  test('the sheet reads the program for its span and its resume line', () => {
    const v = sheetView(openTravel(newOverlayDraft(), NOW), prog([]), NOW).travel!;
    assert.equal(v.effect.title, 'Takes effect Wed Sep 16 through Tue Sep 29. Fourteen days.');
    assert.equal(v.effect.subs[0]!.text, 'Wed Sep 30 picks your program back up. Every other day stays as written.');
    assert.deepEqual(v.dates, [{ key: 'from', label: 'From', shown: 'Sep 16', value: '2026-09-16', min: null }, { key: 'to', label: 'Through', shown: 'Sep 29', value: '2026-09-29', min: '2026-09-16' }]);
    const end = sheetView(draft({ tab: 'travel', equipment: 'bodyweight', from: '2026-11-20', to: '2026-11-22' }), prog([]), NOW).travel!;
    assert.equal(end.effect.title, 'Takes effect Fri Nov 20 through Sun Nov 22. Three days.');
    assert.equal(end.effect.subs[0]!.text, 'That runs to the end of your program. Every other day stays as written.');
    const out = sheetView(draft({ tab: 'travel', equipment: 'bodyweight', from: '2027-06-01', to: '2027-06-03' }), prog([]), NOW).travel!;
    assert.deepEqual(out.effect, { title: null, subs: [{ text: 'That range falls outside your program. Pick dates inside it.', style: 'color:var(--muted)' }] });
    const inj = sheetView(draft({ tab: 'injury', injRegion: 'ankle', injTier: 'protect', from: '2026-09-16' }), prog([]), NOW).injury!;
    assert.equal(inj.effect!.title, 'Protected · Ankle / Foot / Shin');
    assert.equal(inj.regions.length, 8, 'the seven regions and the one the app does not train around');
    assert.deepEqual(inj.dates, [{ key: 'from', label: 'From', shown: 'Sep 16', value: '2026-09-16', min: null }]);
  });
});

describe('native change sheet: what Apply change refuses, and what a tap leaves with nothing to act on', () => {
  const fresh = () => ({ store: memoryStore(), prog: prog([]) });
  const quiet = (s: { store: ReturnType<typeof memoryStore> }): void => assert.deepEqual(s.store.keys(), [], 'nothing was written');

  test('today\'s words', () => {
    assert.deepEqual(OVERLAY_TOASTS, {
      region: 'Pick a region', dateOutside: 'That date falls outside your program', workaround: 'Working around it ✓', protect: 'Protected. Train around it ✓', bothDates: 'Pick both dates',
      backwards: '“Through” can’t be before “From”', rangeOutside: 'That range is outside your program', applied: 'Change applied ✓', removed: 'Change removed ✓', snoozed: 'Staying on the plan. It will ask again in two weeks.',
    });
  });
  test('Traveling?: a full gym only closes; a date missing, a Through before From and a span outside the program are refused', () => {
    const now = NOW.getTime();
    let s = fresh();
    assert.deepEqual(applyOverlayDraft(s, draft({ equipment: 'commercial', from: null, to: null }), now, report), { toast: null, closed: true });
    quiet(s);
    for (const [from, to] of [[null, '2026-09-20'], ['2026-09-16', null], ['', ''], ['2026-09-16', '']] as [string | null, string | null][]) {
      s = fresh();
      assert.deepEqual(applyOverlayDraft(s, draft({ equipment: 'bodyweight', from, to }), now, report), { toast: 'Pick both dates', closed: false });
      quiet(s);
    }
    s = fresh();
    assert.deepEqual(applyOverlayDraft(s, draft({ equipment: 'bodyweight', from: '2026-09-16', to: '2026-09-15' }), now, report), { toast: '“Through” can’t be before “From”', closed: false });
    quiet(s);
    s = fresh();
    assert.deepEqual(applyOverlayDraft(s, draft({ equipment: 'bodyweight', from: '2027-06-01', to: '2027-06-03' }), now, report), { toast: 'That range is outside your program', closed: false });
    quiet(s);
    assert.deepEqual(s.prog.overlays, [], 'and the program in hand holds no change');
  });
  test('Hurt?: no region, the one the app does not train around, and a From outside the program are refused', () => {
    const now = NOW.getTime();
    for (const region of [null, 'other', 'neck', '']) {
      const s = fresh();
      assert.deepEqual(applyInjuryDraft(s, draft({ injRegion: region, from: '2026-09-16' }), now, report), { toast: 'Pick a region', closed: false });
      quiet(s);
    }
    const s = fresh();
    assert.deepEqual(applyInjuryDraft(s, draft({ injRegion: 'knee', from: '2027-06-01' }), now, report), { toast: 'That date falls outside your program', closed: false });
    quiet(s);
    assert.deepEqual(s.prog.overlays, []);
  });
  test('a chip\'s tap with no list in hand, and the check in for a change that is gone, do nothing', () => {
    const now = NOW.getTime();
    const s = { store: memoryStore(), prog: prog() };
    assert.equal(removeOverlay(s, 'a', now, report), null);
    assert.equal(imBackFromInjury(s, 'a', now, report), null);
    assert.equal(injSnooze(s, 'a', now), null);
    assert.equal(injReassess(s, 'a', 'better', now), null);
    quiet(s);
    const t = fresh();
    assert.equal(injSnooze(t, 'a', now), null);
    for (const ans of ['better', 'same', 'worse'] as const) assert.equal(injReassess(t, 'a', ans, now), null);
    quiet(t);
  });
  test('Same stamps the ask on the program in hand and stores its list in that program\'s own place, whichever it is', () => {
    const now = NOW.getTime();
    const inj = { id: 'ov_7', type: 'injury', from: '2026-09-01', to: null, patch: { injury: { region: 'knee', tier: 'workaround' } }, note: '', created: 1 };
    const s = { store: memoryStore({ ia_programs: JSON.stringify([{ id: 'p0', overlays: [] }, { id: 'p1', overlays: [inj] }, { id: 'p2' }]) }), prog: prog([{ ...inj }]) };
    assert.deepEqual(injSnooze(s, 'ov_7', now), { toast: 'Staying on the plan. It will ask again in two weeks.', closed: false });
    assert.deepEqual(JSON.parse(s.store.get('ia_programs')!), [{ id: 'p0', overlays: [] }, { id: 'p1', overlays: [{ ...inj, lastAsk: now }] }, { id: 'p2' }], 'the second program of three takes the list; the others are as they were');
    assert.equal(s.prog.overlays![0]!.lastAsk, now);
    assert.deepEqual(s.store.keys(), ['ia_programs']);
    const gone = { store: memoryStore({ ia_programs: JSON.stringify([{ id: 'p0' }]) }), prog: prog([{ ...inj }]) };
    assert.equal(injSnooze(gone, 'ov_7', now)!.toast, 'Staying on the plan. It will ask again in two weeks.');
    assert.equal(gone.store.get('ia_programs'), JSON.stringify([{ id: 'p0' }]), 'a program the store does not hold is not stored');
  });
  test('Better writes nothing and asks: I\'m back, or More time, each with today\'s handler', () => {
    const s = { store: memoryStore(), prog: prog([ov('ov_7', { type: 'injury', from: '2026-09-01', to: null, patch: { injury: { region: 'knee', tier: 'workaround' } } })]) };
    assert.deepEqual(injReassess(s, 'ov_7', 'better', NOW.getTime()), {
      toast: null, closed: false,
      pop: { tier: 'workout', opts: { icon: 'shield', kicker: 'Check in', msg: 'Good sign.', sub: 'Ready to bring it back, or give it more time? Coming back starts with one light week.',
        actions: [{ label: 'I’m back', cls: 'go', onclick: "popClose();imBackFromInjury('ov_7')" }, { label: 'More time', cls: 'skip', onclick: "popClose();injSnooze('ov_7')" }] } },
      acts: [{ kind: 'back', id: 'ov_7' }, { kind: 'snooze', id: 'ov_7' }],
    });
    quiet(s);
    assert.equal(s.prog.overlays![0]!.lastAsk, undefined, 'and the ask is not stamped');
  });
});

describe('native change sheet: Program Start\'s resolver (D21, D24, D25, D184 c) and the test date it is given', () => {
  const WEEKDAYS = ['mon', 'tue', 'wed', 'thu', 'fri'];
  const rest = ['sat', 'sun'];
  test('a Monday starts a whole week; any other day starts a short one', () => {
    assert.deepEqual(resolveStartDate('2026-09-14', rest, null, NOW), { start: '2026-09-14', entered: '2026-09-14', mon: '2026-09-14', partial: false, snapped: false, week1Train: WEEKDAYS, nextMon: '2026-09-21' });
    assert.deepEqual(resolveStartDate('2026-09-16', rest, null, NOW), { start: '2026-09-16', entered: '2026-09-16', mon: '2026-09-14', partial: true, snapped: false, week1Train: ['wed', 'thu', 'fri'], nextMon: '2026-09-21' });
    assert.deepEqual(resolveStartDate('2026-09-20', [], null, NOW), { start: '2026-09-20', entered: '2026-09-20', mon: '2026-09-14', partial: true, snapped: false, week1Train: ['sun'], nextMon: '2026-09-21' });
  });
  test('a short week with no training day left moves to the next Monday', () => {
    const snapped = { start: '2026-09-21', entered: '2026-09-19', mon: '2026-09-21', partial: false, snapped: true, week1Train: WEEKDAYS, nextMon: '2026-09-21' };
    assert.deepEqual(resolveStartDate('2026-09-19', rest, null, NOW), snapped);
    assert.deepEqual(resolveStartDate('2026-09-20', rest, null, NOW), { ...snapped, entered: '2026-09-20' });
    const allRest = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    assert.deepEqual(resolveStartDate('2026-09-14', allRest, null, NOW).snapped, false, 'a Monday is never moved, whatever the week holds');
    assert.deepEqual(resolveStartDate('2026-09-14', allRest, '2026-09-16', NOW), { start: '2026-09-14', entered: '2026-09-14', mon: '2026-09-14', partial: false, snapped: false, week1Train: [], nextMon: '2026-09-21' }, 'nor does a whole week say it holds the test');
  });
  test('unless that short week holds the test: from the entered day through that Sunday', () => {
    const holds = { start: '2026-09-19', entered: '2026-09-19', mon: '2026-09-14', partial: true, snapped: false, week1Train: [], nextMon: '2026-09-21', holdsTest: true };
    assert.deepEqual(resolveStartDate('2026-09-19', rest, '2026-09-20', NOW), holds);
    assert.deepEqual(resolveStartDate('2026-09-19', rest, '2026-09-19', NOW), holds, 'the test on the entered day itself');
    assert.equal(resolveStartDate('2026-09-19', rest, '2026-09-21', NOW).snapped, true, 'a test the Monday after is not in that week');
    assert.equal(resolveStartDate('2026-09-20', rest, '2026-09-19', NOW).snapped, true, 'nor is one the day before the entered day');
    assert.equal(resolveStartDate('2026-09-19', rest, 'soon', NOW).snapped, true, 'nor a date that does not read');
    assert.equal('holdsTest' in resolveStartDate('2026-09-16', rest, '2026-09-18', NOW), false, 'a week with a training day left is only short: the key is there only when true');
  });
  test('a date that does not read is today', () => {
    assert.equal(resolveStartDate('soon', rest, null, NOW).start, '2026-09-16');
    assert.equal(resolveStartDate(null, rest, null, NOW).entered, '2026-09-16');
    assert.equal(resolveStartDate('2026-09-16', 'weekends', null, NOW).week1Train.length, 5, 'rest days that are no list are none');
  });
  test('only a dated test goal has a test date: a run, a pace goal, the event on, a date', () => {
    const c = (id: string, over: Record<string, unknown> = {}) => ({ cardioTypes: ['run'], cardioGoals: { run: { id } }, raceDate: '2026-10-25', ...over });
    assert.equal(rsRace(c('run_pace_goal')), '2026-10-25');
    assert.equal(rsRace(c('run_mile_time')), '2026-10-25');
    assert.equal(rsRace(c('run_15_under10')), '2026-10-25');
    assert.equal(rsRace(c('run_pace_goal', { eventTargeted: true })), '2026-10-25');
    assert.equal(rsRace(c('run_pace_goal', { eventTargeted: false })), null);
    assert.equal(rsRace(c('run_half')), null, 'a race goal is laid back from its race, not pinned to a test');
    assert.equal(rsRace(c('run_base')), null);
    assert.equal(rsRace(c('run_pace_goal', { raceDate: null })), null);
    assert.equal(rsRace(c('run_pace_goal', { raceDate: '' })), null);
    assert.equal(rsRace(c('run_pace_goal', { cardioTypes: ['bike'] })), null);
    assert.equal(rsRace({ cardioTypes: ['run'], cardioGoals: {}, raceDate: '2026-10-25' }), null);
    assert.equal(rsRace({ raceDate: '2026-10-25' }), null);
    assert.equal(rsRace(null), null);
  });
});

describe('native change sheet: a date that sets nothing, and the title after one that does', () => {
  test('today\'s words', () => {
    assert.deepEqual(DATE_TOASTS, { unresolved: 'That date didn’t resolve', holdsTest: 'That week holds your test. Nothing left to train before it ✓', short: 'Start date set. Short first week ✓', set: 'Start date set ✓' });
  });
  test('a blank box and no program do nothing', () => {
    const s = memoryStore();
    const p: DatedProgram = { id: 'p1', startDate: '2026-08-31', cfg: { restDays: [] } };
    assert.equal(setProgStart(s, p, '', NOW.getTime(), report), null);
    assert.equal(setProgRace(s, p, '', NOW.getTime(), report), null);
    assert.equal(setProgStart(s, null, '2026-09-16', NOW.getTime(), report), null);
    assert.equal(setProgRace(s, null, '2026-09-16', NOW.getTime(), report), null);
    assert.equal(setProgRace(s, { id: 'p1' }, '2026-09-16', NOW.getTime(), report), null, 'nor does a race date on a program with no config');
    assert.deepEqual(s.keys(), []);
    assert.equal(p.startDate, '2026-08-31');
  });
  test('a race date on a program that is laid back from no race is put back as it was, said, and not stored', () => {
    const s = memoryStore();
    for (const cfg of [{ cardioTypes: ['run'], cardioGoals: { run: { id: 'run_pace_goal' } }, raceDate: '2026-10-25' }, { cardioTypes: ['bike'], cardioGoals: { run: { id: 'run_half' } }, raceDate: '2026-10-25' },
      { cardioTypes: ['run'], cardioGoals: { run: { id: 'run_half' } }, raceDate: '2026-10-25', eventTargeted: false }, { cardioTypes: ['run'], cardioGoals: {}, raceDate: null }]) {
      const p: DatedProgram = { id: 'p1', startDate: '2026-08-31', cfg: { ...cfg } };
      assert.deepEqual(setProgRace(s, p, '2026-12-06', NOW.getTime(), report), { toast: 'That date didn’t resolve', prog: p, set: false });
      assert.equal(p.cfg!.raceDate, cfg.raceDate, 'the race date is the one it held');
      assert.equal(p.startDate, '2026-08-31');
    }
    assert.deepEqual(s.keys(), []);
  });
  test('a start date on a program with no dated test is stored with its new start and not rebuilt', () => {
    const s = memoryStore({ ia_programs: JSON.stringify([{ id: 'p0', startDate: '2026-01-05' }, { id: 'p1', startDate: '2026-08-31', totalWeeks: 12, cfg: { restDays: ['sat', 'sun'] }, weeks: { 1: {} } }]) });
    const inHand = (): DatedProgram => ({ id: 'p1', startDate: '2026-08-31', totalWeeks: 12, cfg: { restDays: ['sat', 'sun'] }, weeks: { 1: {} } } as DatedProgram);
    const stored = (): { id: string; startDate: string }[] => JSON.parse(s.get('ia_programs')!);
    let p = inHand();
    assert.deepEqual(setProgStart(s, p, '2026-09-14', NOW.getTime(), report), { toast: 'Start date set ✓', prog: p, set: true });
    assert.equal(p.startDate, '2026-09-14');
    assert.deepEqual(stored(), [{ id: 'p0', startDate: '2026-01-05' }, { id: 'p1', startDate: '2026-09-14', totalWeeks: 12, cfg: { restDays: ['sat', 'sun'] }, weeks: { 1: {} } }], 'the program in hand takes its own place in the list');
    p = inHand();
    assert.deepEqual(setProgStart(s, p, '2026-09-16', NOW.getTime(), report), { toast: 'Start date set. Short first week ✓', prog: p, set: true });
    assert.equal(stored()[1]!.startDate, '2026-09-16');
    p = inHand();
    assert.deepEqual(setProgStart(s, p, '2026-09-19', NOW.getTime(), report), { toast: 'Nothing to train that week. Starts Mon, Sep 21 ✓', prog: p, set: true });
    assert.equal(stored()[1]!.startDate, '2026-09-21', 'the start is the Monday it moved to, not the day entered');
    assert.deepEqual(s.keys(), ['ia_programs']);
    assert.deepEqual(told, [], 'nothing was rebuilt, so nothing could fail');
    assert.equal('_testWeek' in p.cfg!, false, 'and no test week is pinned');
    const gone: DatedProgram = { id: 'p9', startDate: '2026-08-31', cfg: {} };
    const before = s.get('ia_programs');
    assert.equal(setProgStart(s, gone, '2026-09-14', NOW.getTime(), report)!.toast, 'Start date set ✓');
    assert.equal(s.get('ia_programs'), before, 'a program the store does not hold is not stored');
  });
  test('the title goes back to the one holding today unless that is the week the screen itself last wrote', () => {
    const p: DatedProgram = { id: 'p1', startDate: '2026-08-31', totalWeeks: 12 };
    const today = new Date(2026, 8, 16);
    assert.deepEqual(titleAfterDate(3, p, today), { reset: false, own: 3 }, 'Wednesday 2026-09-16 is in week 3 of a program that starts 2026-08-31');
    assert.deepEqual(titleAfterDate(5, p, today), { reset: true, own: 3 });
    assert.deepEqual(titleAfterDate(null, p, today), { reset: true, own: 3 });
    assert.deepEqual(titleAfterDate(3, { ...p, startDate: '2026-09-21' }, today), { reset: true, own: 1 }, 'a start still ahead is week 1');
    assert.deepEqual(titleAfterDate(12, { ...p, startDate: '2025-01-06' }, today), { reset: false, own: 12 }, 'a program long over stays on its last week');
  });
});

describe('native change sheet: the date box\'s sums', () => {
  test('the calendar opens on the field\'s day, or on today for a blank field', () => {
    assert.equal(calendarDay('2026-09-16', NOW).getTime(), new Date(2026, 8, 16).getTime());
    assert.equal(calendarDay('2027-01-01', NOW).getTime(), new Date(2027, 0, 1).getTime());
    assert.equal(calendarDay('', NOW).getTime(), new Date(2026, 8, 16).getTime(), 'today at midnight');
    assert.equal(calendarDay('soon', NOW).getTime(), new Date(2026, 8, 16).getTime());
    assert.equal(NOW.getHours(), 10, 'the clock handed in is left as it was');
  });
  test('a picked day is written as its local day, whatever the hour; Reset writes a blank', () => {
    assert.equal(pickedValue(new Date(2026, 8, 16, 23, 59, 59)), '2026-09-16');
    assert.equal(pickedValue(new Date(2026, 8, 16, 0, 0, 0)), '2026-09-16');
    assert.equal(pickedValue(new Date(2027, 0, 1, 12)), '2027-01-01');
    assert.equal(RESET_VALUE, '');
    assert.deepEqual(DATE_WORDS, { reset: 'Reset', done: 'Done' });
  });
});

describe('native change sheet: the copy button\'s text (progSelLines, V172)', () => {
  const lifter: ListProgram = { id: 'p1', name: 'Test block', goal: 'strength', totalWeeks: 8, cfg: { experience: 'beginner', unit: 'kg', liftingFocus: 'strength', primaryPath: 'body', equipment: 'home_basic', restDays: ['wed', 'sun'], cardioTypes: [], seed: 42 } } as unknown as ListProgram;
  test('a lifter with no lifts entered: the selections, the lifts from experience, lift only, the seed', () => {
    assert.deepEqual(progSelLines(lifter, NOW), [
      'THE ASYLUM — Program selections',
      'Name: Test block',
      'Goal: Strength | Lift focus: Strength | Path: Strength / Physique',
      'Experience: beginner | Age: 18-35 | Equip: Home Gym — Basic | Units: kg',
      'Train days: Mon, Tue, Thu, Fri, Sat | Rest: Sun, Wed | Length: 8 wks',
      'Starting 1RM (est. from experience): squat 75 / bench 65 / deadlift 95 kg',
      'Cardio: lift only',
      'Seed: 42',
    ]);
  });
  test('lifts entered, a bike with a goal and one without, an event with a date and one with none, no seed, no rest days', () => {
    const p = { id: 'p2', name: '', totalWeeks: 0, cfg: { squat: 300, ageBracket: '36-45', liftingFocus: 'support_athletic', primaryPath: 'event', equipment: 'spaceship', restDays: [], cardioTypes: ['bike', 'swim'],
      cardioGoals: { bike: { label: 'Century ride' } }, raceDate: '2026-09-19', totalWeeks: 10 } } as unknown as ListProgram;
    assert.deepEqual(progSelLines(p, NOW), [
      'THE ASYLUM — Program selections',
      'Name: My Program',
      'Goal: — | Lift focus: Athletic Support | Path: Race / Event',
      'Experience: intermediate | Age: 36-45 | Equip: spaceship | Units: lbs',
      'Train days: Sun, Mon, Tue, Wed, Thu, Fri, Sat | Rest: none | Length: 10 wks',
      'Starting 1RM: squat 300 / bench 135 / deadlift 185 lbs',
      'Cardio: bike=Century ride, swim=general',
      'Event: Sat, Sep 19, 2026 (3 days out)',
    ]);
    const undated = { ...p, cfg: { ...(p.cfg as object), raceDate: null, seed: 0 } } as unknown as ListProgram;
    assert.deepEqual(progSelLines(undated, NOW).slice(-2), ['Event: no date', 'Seed: 0'], 'a seed of zero is a seed');
    assert.equal(progSelLines({ ...lifter, goal: 'mystery' } as unknown as ListProgram, NOW)[2], 'Goal: mystery | Lift focus: Strength | Path: Strength / Physique');
  });
  test('the run anchor\'s line: the mile, where it came from, and the row\'s other paces', () => {
    const row = { mile: 480, fiveK: 510, tenK: 530, tempo: 545, recovery: 600, half: 560, marathon: 580 };
    const starts = (line: string, head: string, why = 'the line\'s head'): void => assert.equal(line.slice(0, head.length), head, why);
    const a = (over: Record<string, unknown> = {}) => ({ anchorSec: 480, rawSec: 480, clamped: null, row, kind: 'entered', exp: 'intermediate', prog: '', n: 0, wk: 0, goalId: 'run_5k', race: null, goalT: null, ...over } as never);
    assert.equal(runAnchorLine(a()), 'Run anchor: 8:00 mile (entered) → 5k 8:30 / 10k 8:50 / tempo 9:05 / recovery 10:00');
    assert.equal(runAnchorLine(a({ goalId: 'run_base' })), 'Run anchor: 8:00 mile (entered) → recovery 10:00', 'a base runner\'s row is its mile and its recovery');
    assert.equal(runAnchorLine(a({ goalId: 'run_half', race: 'half' })), 'Run anchor: 8:00 mile (entered) → 5k 8:30 / 10k 8:50 / tempo 9:05 / half 9:20 / recovery 10:00');
    assert.equal(runAnchorLine(a({ goalId: 'run_marathon', race: 'marathon' })), 'Run anchor: 8:00 mile (entered) → 5k 8:30 / 10k 8:50 / tempo 9:05 / marathon 9:40 / recovery 10:00');
    assert.equal(runAnchorLine(a({ goalId: 'run_pace_goal', goalT: { sec: 480, dist: '1.5' } })),
      'Run anchor: 8:00 mile (entered) → mile 8:00 / 5k 8:30 / 10k 8:50 / tempo 9:05 / recovery 10:00 | Week 1 runs off this row. Every week after it moves toward your goal.', 'a pace goal\'s own pace stands first on the card, so the line keeps the mile');
    starts(runAnchorLine(a({ kind: 'default', exp: 'beginner' })), 'Run anchor: 8:00 mile (beginner default, no mile time entered)');
    starts(runAnchorLine(a({ kind: 'edited', wk: 4 })), 'Run anchor: 8:00 mile (edited in week 4)');
    starts(runAnchorLine(a({ kind: 'seeded', prog: 'Spring block', n: 3 })), 'Run anchor: 8:00 mile (seeded from Spring block, 3 logged recovery runs)');
    starts(runAnchorLine(a({ kind: 'seeded', n: 1 })), 'Run anchor: 8:00 mile (seeded from previous block, 1 logged recovery run)');
    starts(runAnchorLine(a({ clamped: 'fast', rawSec: 270, anchorSec: 300 })), 'Run anchor: 5:00 mile (entry 4:30 clamped to the chart\'s fastest row)');
    starts(runAnchorLine(a({ clamped: 'slow', rawSec: 800, anchorSec: 720 })), 'Run anchor: 12:00 mile (entry 13:20 clamped to the chart\'s slowest row)');
    starts(runAnchorLine(a({ clamped: 'slow', rawSec: 0, anchorSec: 720, kind: 'seeded' })), 'Run anchor: 12:00 mile (entry invalid clamped to the chart\'s slowest row)', 'a clamp is said before anything else');
  });
  test('the text is the stored program\'s lines joined by line breaks, or nothing for a program that is gone', () => {
    const s = memoryStore({ ia_programs: JSON.stringify([lifter]) });
    assert.equal(copyText(s, 'p1', NOW), progSelLines(lifter, NOW).join('\n'));
    assert.equal(copyText(s, 'p1', NOW)!.split('\n').length, 8);
    assert.equal(copyText(s, 'p9', NOW), null);
    assert.equal(copyText(memoryStore(), 'p1', NOW), null);
    assert.deepEqual(s.keys(), ['ia_programs'], 'the copy writes nothing');
    assert.equal(COPIED, 'Selections copied ✓');
  });
});

describe('native change sheet: which files write, and the two packages', () => {
  const dirs = ['change-sheet', 'date-box', 'week-dates'];
  const code = (f: string): string => strip(read(f));
  const writes = (t: string): string[] => (t.match(/\b\w*[sS]tore\.(set|remove)\([^)]*\)|\b(write|record|clear|drop|add|set)[A-Z]\w*\((s\.)?store\b/g) || []).sort();
  test('the folders hold the sheet, the chips, their readers and writers, the date box and the two dates', () => {
    assert.deepEqual(dirs.map((d) => readdirSync(join(NATIVE, d)).sort()), [['ChangeChips.tsx', 'ChangeSheet.tsx', 'change-sheet-model.ts', 'overlay-readers.ts', 'overlay-writes.ts'], ['DateBox.tsx', 'date-box.ts'], ['week-dates.ts']]);
  });
  test('the writes are overlay-writes.ts\'s and week-dates.ts\'s alone, and each is ia_programs through core\'s writer', () => {
    assert.deepEqual(writes(code('change-sheet/overlay-writes.ts')), ['writePrograms(s.store']);
    // The two dates' own declarations read as writers by their names; the one call that writes is core's writePrograms.
    assert.deepEqual(writes(code('week-dates/week-dates.ts')), ['setProgRace(store', 'setProgStart(store', 'writePrograms(store']);
    for (const f of ['change-sheet/ChangeChips.tsx', 'change-sheet/ChangeSheet.tsx', 'change-sheet/change-sheet-model.ts', 'change-sheet/overlay-readers.ts', 'date-box/DateBox.tsx', 'date-box/date-box.ts']) {
      assert.deepEqual(writes(code(f)), [], f + ' writes nothing');
      assert.doesNotMatch(code(f), /state-programs|refreshStoredProgram/, f + ' reaches no writer and no rebuild');
    }
    assert.doesNotMatch(code('change-sheet/overlay-readers.ts'), /[sS]tore\b/, 'the readers never see the store');
  });
  test('a rebuild is core\'s refreshStoredProgram on the program in hand: every apply, removal and I\'m back, the race date, and a dated test\'s start', () => {
    const w = code('change-sheet/overlay-writes.ts');
    assert.equal((w.match(/refresh\(s, now, failed\)/g) || []).length, 4, 'Traveling?, Hurt?, the ✕ and I\'m back');
    assert.ok(w.includes('refreshStoredProgram(s.store, s.prog as unknown as StoredProgram, now, failed)'));
    const snooze = w.slice(w.indexOf('export function injSnooze'), w.indexOf('export function injReassess'));
    assert.doesNotMatch(snooze + w.slice(w.indexOf('export function injReassess')), /refresh\(/, 'the check in rebuilds nothing');
    const d = code('week-dates/week-dates.ts');
    assert.ok(d.includes('const next = refreshStoredProgram(store, prog as unknown as StoredProgram, now, failed) as unknown as DatedProgram;'), 'the race date rebuilds');
    assert.ok(d.includes('const next = tp ? refreshStoredProgram(store, prog as unknown as StoredProgram, now, failed) as unknown as DatedProgram : prog;'), 'a start date rebuilds only for a dated test');
  });
  // The versions Expo SDK 58.0.25 names for them (its bundledNativeModules.json, read 2026-11-20): 9.2.1 and ~58.0.4.
  test('the date picker and the clipboard are SDK 58\'s own, pinned exactly, and each is imported by one screen', () => {
    const pkg = JSON.parse(readFileSync(join(REPO, 'frontends/native/package.json'), 'utf8')) as { dependencies: Record<string, string> };
    assert.equal(pkg.dependencies['@react-native-community/datetimepicker'], '9.2.1');
    assert.equal(pkg.dependencies['expo-clipboard'], '58.0.4');
    const all = (dir: string): string[] => readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? all(join(dir, e.name)) : /\.tsx?$/.test(e.name) ? [join(dir, e.name)] : []));
    const importing = (name: string): string[] => all(NATIVE).filter((f) => readFileSync(f, 'utf8').includes("from '" + name + "'")).map((f) => f.slice(NATIVE.length + 1));
    assert.deepEqual(importing('@react-native-community/datetimepicker'), [join('date-box', 'DateBox.tsx')]);
    assert.deepEqual(importing('expo-clipboard'), [join('program-list', 'Programs.tsx')]);
  });
});

describe('native change sheet: the screens\' wiring', () => {
  const sheet = read('change-sheet/ChangeSheet.tsx'), chipsFile = read('change-sheet/ChangeChips.tsx'), box = read('date-box/DateBox.tsx'), week = read('this-week/ThisWeek.tsx'), app = read('App.tsx');

  test('the sheet draws each piece only where the view holds it, in today\'s order', () => {
    const order = ['{view.travel.dates && dates(view.travel.dates, false)}', '{label(SHEET_WORDS.gear)}', '{view.travel.cards.map(card)}', '{effect(view.travel.effect)}', '{foot(view.travel.action, leave)}',
      '{label(SHEET_WORDS.where)}', '{view.injury.regions.map(card)}', '{view.injury.tiers && label(SHEET_WORDS.howBad, true)}', '{view.injury.tiers && view.injury.tiers.map(card)}',
      '{view.injury.effect && effect(view.injury.effect)}', '{view.injury.dates && dates(view.injury.dates, true)}', '{view.injury.action && foot(view.injury.action, leave)}'];
    let at = 0;
    for (const piece of order) { const i = sheet.indexOf(piece, at); assert.ok(i > at, piece); at = i; }
    assert.ok(sheet.includes("{c.desc !== null && <Text style={[s.eqDesc, { color: p.muted }]}>{c.desc}</Text>}") && sheet.includes("{c.sel && <Text style={[s.eqChk, { color: p.text }]}>✓</Text>}"), 'a card\'s line and its check');
    assert.ok(sheet.includes("{e.title !== null && <Text style={[s.effectTtl, { color: p.text }]}>{e.title}</Text>}"), 'the effect\'s title where it has one');
    assert.ok(sheet.includes("(x.text === '' ? null : <Text key={i}"), 'a line with no words takes no height');
    assert.ok(sheet.includes("x.style !== null && x.style.includes('margin-top:6px') && s.subGap"), 'the gap today\'s gives a later line');
  });
  // Measured beside today's own sheet and chips, drawn by WebKit in the simulator's Safari from the markup the walks
  // hold equal to the page's: the text bands of both screenshots, read from the pixels, stand within a point.
  test('the look is today\'s where it was measured: a card\'s second line, the date box\'s label, the effect\'s lines, the chips', () => {
    assert.ok(sheet.includes('eqDesc: { fontFamily: TEXT, fontSize: 12, lineHeight: 16, marginTop: 2 },'), 'WebKit lays a card\'s line at 16, and a tier\'s line runs to two');
    assert.ok(sheet.includes('dateLbl: { fontFamily: DISPLAY, fontSize: 12, paddingBottom: 1.7, marginBottom: 4.7 },'));
    assert.ok(sheet.includes('effect: { borderTopWidth: 1, paddingTop: 14, marginTop: 11.4, marginBottom: 16 },') && sheet.includes('subGap: { marginTop: 5.7 },') && sheet.includes('effectSub: { fontFamily: TEXT, fontSize: 12, lineHeight: 18 },'));
    assert.ok(sheet.includes('body: { gap: 16 },') && sheet.includes('date: { flex: 1, borderWidth: 1, borderRadius: 12, paddingVertical: 9, paddingHorizontal: 10 },') && sheet.includes('apply: { borderRadius: 999, padding: 15, alignItems: \'center\' },'));
    assert.ok(chipsFile.includes("chip: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderWidth: 1, borderLeftWidth: 3, borderTopRightRadius: 16, borderBottomRightRadius: 16, paddingVertical: 11, paddingHorizontal: 13 },"));
    assert.ok(chipsFile.includes('wrap: { marginTop: 8 },') && chipsFile.includes('sub: { fontFamily: TEXT, fontSize: 12, lineHeight: 17, marginTop: 3 },'));
    assert.ok(chipsFile.includes("act: { alignSelf: 'flex-start', marginTop: 8, borderWidth: 1, borderRadius: 2, paddingVertical: 7, paddingHorizontal: 12 },") && chipsFile.includes("ans: { flex: 1, alignItems: 'center', borderWidth: 1, borderRadius: 999, paddingVertical: 9, paddingHorizontal: 4 },"));
    // The check in is drawn as any chip: week-view.css gives .reassess-card a red edge, and .change-chip, later in the sheet, takes it back.
    assert.ok(chipsFile.includes('style={[s.chip, { backgroundColor: p.surface, borderColor: p.border2, borderLeftColor: p.accent }]}'));
    assert.ok(chipsFile.includes("style={({ pressed }) => [s.act, { borderColor: p.red }, pressed && s.pressed]}") && chipsFile.includes('<Text style={[s.actText, { color: p.red }]}>I’m back</Text>'), 'I\'m back in red');
  });
  test('the sheet\'s own words are the Angular sheet\'s', () => {
    const today = readFileSync(join(TODAY, 'change-sheet', 'change-sheet.ts'), 'utf8');
    for (const w of ['What you’ll have', 'Where’s the problem', 'How bad is it', 'Apply change', 'Got it']) assert.ok(today.includes(w) && sheet.includes("'" + w + "'"), w);
  });
  test('a card and a date box write the draft through setDraft, and the app keeps the draft', () => {
    assert.ok(sheet.includes('onPress={() => hold(setDraft(now.current, c.key, c.id, new Date()))}'));
    assert.ok(sheet.includes('onPress={() => onDate({ value: f.value, min: f.min, onChange: (iso) => hold(setDraft(now.current, f.key, iso, new Date())) })}'), 'a date box opens the calendar on its value and its earliest day');
    assert.ok(sheet.includes('const hold = (d: OverlayDraft): void => { now.current = d; setDraftState(d); onDraft(d); };'));
    assert.ok(app.includes('onDraft={(d) => { ovDraft.current = d; }} onDate={openDate} onClose={() => setChange(null)}') && app.includes('const ovDraft = useRef<OverlayDraft>(newOverlayDraft());'));
  });
  test('the foot: Got it only leaves; Apply change stays open on a refusal, and closes in today\'s order', () => {
    assert.ok(sheet.includes("if (a === 'close') { leave(); return; }"));
    assert.ok(sheet.includes("const r = a === 'travel' ? applyOverlayDraft(session, now.current, Date.now(), report) : applyInjuryDraft(session, now.current, Date.now(), report);"));
    assert.ok(sheet.includes('if (!r.closed) { if (r.toast) say(r.toast); return; }'));
    assert.ok(sheet.includes('leave(() => { onDone(r); if (r.toast) say(r.toast); });'), 'the program in hand, then the toast, as the sheet goes');
    assert.ok(app.includes('onDone={(r) => { if (r.prog) setHeld(r.prog as unknown as DeckProgram); setWrites((n) => n + 1); }} />'));
  });
  test('the chips: I\'m back only where the chip offers it, the check in\'s three answers, a ✕ on a chip and none on the check in', () => {
    assert.ok(chipsFile.includes('if (!chips.length) return null;'), 'no chip, nothing drawn, not even the gap above');
    assert.ok(chipsFile.includes("{c.kind === 'chip' && c.back && (") && chipsFile.includes('onPress={() => onBack(c.id)}'));
    assert.ok(chipsFile.includes("{c.kind === 'checkin' && (") && chipsFile.includes('onPress={() => onAnswer(c.id, a.ans)}'));
    assert.match(chipsFile, /\{c\.kind === 'chip' && \(\s*<Pressable testID="change-chip-x" accessibilityRole="button" accessibilityLabel=\{CHIP_REMOVE\} hitSlop=\{10\} onPress=\{\(\) => onRemove\(c\.id\)\}/);
    assert.ok(chipsFile.includes('<Text style={[s.ttl, { color: p.text }]}>{c.title}</Text>') && chipsFile.includes('<Text style={[s.sub, { color: p.muted }]}>{c.sub}</Text>'));
  });
  test('This Week draws the chips at each draw, under its two buttons, and hands every tap up as an ask', () => {
    assert.ok(week.includes('<ChangeChips palette={p} chips={overlayChips(prog as unknown as OverlayProgram | null, now.getTime())}'));
    assert.ok(week.includes("onBack={(id) => onAsk({ kind: 'back', id })} onRemove={(id) => onAsk({ kind: 'remove', id })} onAnswer={(id, ans) => onAsk({ kind: 'answer', id, ans })} />"));
    assert.ok(week.indexOf('testID="week-travel"') < week.indexOf('<ChangeChips') && week.indexOf('<ChangeChips') > 0);
    assert.ok(week.includes("<Pressable testID=\"week-hurt\" accessibilityRole=\"button\" accessibilityLabel=\"Report or manage an injury\" onPress={() => onAsk({ kind: 'hurt' })}"));
    assert.ok(week.includes("<Pressable testID=\"week-travel\" accessibilityRole=\"button\" onPress={() => onAsk({ kind: 'travel' })}"));
    assert.ok(week.includes("<Pressable testID=\"week-race\" accessibilityRole=\"button\" accessibilityLabel=\"Race date\" onPress={() => onAsk({ kind: 'date', which: 'race', value: view.row.iso })}"));
    assert.ok(week.includes("<Pressable testID=\"week-start\" accessibilityRole=\"button\" accessibilityLabel=\"Program start date\" onPress={() => onAsk({ kind: 'date', which: 'start', value: view.row.iso })}"));
    assert.ok(week.includes("<Pressable testID=\"week-random\" accessibilityRole=\"button\" onPress={() => onAsk({ kind: 'random' })}"), 'Random Workout asks the app as its neighbour does (tests/unit/native-random-workout.test.ts)');
  });
  test('This Week keeps the program in hand and the week it last wrote where the app reads them', () => {
    assert.ok(week.includes('hand.prog = prog;'));
    assert.ok(week.includes('if (prog && hand.own === null) hand.own = currentWeek(prog, midnight(now));'), 'the week holding today, as a launch leaves the page\'s');
    assert.ok(week.includes('if (t !== shown) { setShown(t); hand.own = Math.min(t, screen.totalWeeks); }'), 'a title picked');
    assert.equal((week.match(/hand\.own = week;/g) || []).length, 3, 'a day opened: its sheet, its deck, its rest sheet');
    assert.ok(week.includes('    hand.own = null;\n    if (shownPick !== null && !hand.land) setShown(null);'), 'another program starts again, unless the wizard just landed on it (tests/unit/native-wizard.test.ts)');
    assert.match(week, /if \(!resets\) return;\s*placed\.current = false;\s*setShown\(null\);\s*setPlaceTick\(\(n\) => n \+ 1\);/);
    assert.ok(week.includes('useEffect(() => { place(); }, [place, progId, placeTick]);'), 'and the strip is placed anew');
  });
  test('the app answers each ask on the program in hand as the tap lands', () => {
    assert.ok(app.includes('<ThisWeek palette={p} store={phoneStore} tick={tick} held={held} hand={hand} inHand={inHand} resets={resets} onAsk={asked} onDeck='), 'This Week is handed where it keeps the program, the count of title resets, and the one answerer');
    assert.ok(app.includes('const hand = useRef<WeekHand>({ prog: null, own: null }).current;'));
    assert.ok(app.includes('const session = (): OverlaySession | null => (hand.prog ? { store: phoneStore, prog: hand.prog as unknown as OverlayProgram } : null);'));
    assert.ok(app.includes("const draft = ask.kind === 'hurt' ? openInjury(ovDraft.current, s.prog, now) : openTravel(ovDraft.current, now);") && app.includes('ovDraft.current = draft;\n      setChange({ session: s, draft, n: ++changeN.current });'));
    assert.ok(app.includes("} else if (ask.kind === 'remove') took(s, removeOverlay(s, ask.id, now.getTime(), report));"));
    assert.ok(app.includes("else if (ask.kind === 'back') took(s, imBackFromInjury(s, ask.id, now.getTime(), report));"));
    assert.ok(app.includes("else if (ask.kind === 'answer') took(s, injReassess(s, ask.id, ask.ans, now.getTime()));"));
    assert.ok(app.includes('else openDate({ value: ask.value, min: null, onChange: (iso) => dated(ask.which, iso) });'));
  });
  test('what a chip\'s tap left is shown in today\'s order: the program in hand, This Week drawn, the toast, the pop-up', () => {
    const took = app.slice(app.indexOf('function took('), app.indexOf('const dated ='));
    const order = ['if (!r) return;', 'if (r.prog) setHeld(r.prog as unknown as DeckProgram);', 'setWrites((n) => n + 1);', 'if (r.toast) say(r.toast);', 'raise(ps, popOf(ps, r.pop, now, Math.random), null, r.acts || null);'];
    let at = -1;
    for (const line of order) { const i = took.indexOf(line); assert.ok(i > at, line); at = i; }
    assert.ok(took.includes('const ps = { store: phoneStore, prog: r.prog || s.prog } as unknown as PopSession'), 'the pop-up reads the program the tap handed back');
  });
  test('a button of the check in\'s pop-up closes it, then makes its call on the program in hand', () => {
    assert.ok(app.includes("if (a && s) took(s, a.kind === 'back' ? imBackFromInjury(s, a.id, Date.now(), report) : injSnooze(s, a.id, Date.now()));"));
    const answer = app.slice(app.indexOf('const answer = (index: number): void => {'), app.indexOf('// ── Hurt?, Traveling?'));
    const shut = answer.indexOf('setPop(null);'), acts = answer.indexOf('if (was && was.acts) {');
    assert.ok(shut >= 0 && shut < acts && acts < answer.indexOf('if (!was || !was.ask) return;'), 'the card goes first, then its button\'s call');
    assert.ok(app.includes('setPop({ view, s, ask, acts, n: ++popN.current });'), 'each pop-up is a card of its own, one raised by another\'s button too');
  });
  test('a date of the row: stored, the program in hand, the title back on today\'s when the page\'s is, the toast', () => {
    const dated = app.slice(app.indexOf('const dated ='), app.indexOf('const asked ='));
    assert.ok(dated.includes("const r = which === 'race' ? setProgRace(phoneStore, prog, iso, now, report) : setProgStart(phoneStore, prog, iso, now, report);"));
    assert.ok(dated.includes('const prog = hand.prog as unknown as DatedProgram | null'), 'the program in hand as the pick lands, not the one the calendar opened on');
    assert.match(dated, /if \(!r\) return;\s*if \(r\.set\) \{\s*setHeld\(r\.prog as unknown as DeckProgram\);\s*const t = titleAfterDate\(hand\.own, r\.prog, midnight\(new Date\(now\)\)\);\s*hand\.own = t\.own;\s*if \(t\.reset\) setResets\(\(n\) => n \+ 1\);\s*\}\s*setWrites\(\(n\) => n \+ 1\);\s*say\(r\.toast\);/);
  });
  test('the date box, as WebKit\'s: a day picked is written at once and the box stays; Reset writes a blank, stays, and shows the day the box opened on; the check and a tap outside close', () => {
    assert.ok(box.includes("onChange={(e, d) => { if (e.type !== 'set' || !d) return; setDay(d); ask.onChange(pickedValue(d)); }}"));
    assert.ok(box.includes('onPress={() => { ask.onChange(resetWrites(ask)); setDay(resetDay(ask, opened, new Date())); }}'), 'Reset does not close the box, and its calendar goes back to the day it opened on, as WebKit\'s does');
    // A field whose value is a property (every field but the wizard's race date): Reset writes a blank, the calendar back on the day it opened on.
    const opened = new Date(2026, 10, 21);
    assert.deepEqual([resetWrites({}), resetDay({}, opened, new Date(2026, 10, 20))], ['', opened]);
    // A field whose value is an attribute (the wizard's race date, seen in the simulator's Safari on 2026-11-26): Reset hands back the day the field was drawn with, and the calendar goes to it.
    assert.equal(resetWrites({ reset: '2026-12-20' }), '2026-12-20');
    assert.deepEqual(resetDay({ reset: '2026-12-20' }, opened, new Date(2026, 10, 20)), new Date(2026, 11, 20));
    assert.deepEqual(resetDay({ reset: '' }, opened, new Date(2026, 10, 20, 15, 30)), new Date(2026, 10, 20), 'a field drawn blank goes back to today');
    // Reset and the check dim under the finger: with the day already today, Reset moves nothing else on the screen (Mario's phone, IA Next 127).
    assert.equal(PRESSED_DIM, 0.55);
    assert.equal((box.match(/pressed && \{ opacity: PRESSED_DIM \}/g) || []).length, 2, 'Reset and the check');
    assert.ok(box.includes('<Pressable testID="date-box-done" accessibilityRole="button" accessibilityLabel={DATE_WORDS.done} hitSlop={8} onPress={onClose}') && box.includes('<Pressable testID="date-box-out" accessibilityLabel="Close the calendar" onPress={onClose}'));
    assert.ok(box.includes('mode="date"') && box.includes('display="inline"') && box.includes('const opened = useRef(calendarDay(ask.value, new Date())).current;\n  const [day, setDay] = useState(opened);'));
    assert.doesNotMatch(box, /minimumDate|maximumDate/, 'every day is offered, as WebKit\'s calendar offers it: Apply change refuses a Through before From');
    assert.equal((box.match(/onClose/g) || []).length, 4, 'the box closes by its check and by a tap outside alone (the prop, its type, the two presses)');
    assert.ok(app.includes('{dateAsk && <DateBox key={\'date\' + dateAsk.n} palette={p} ask={dateAsk.ask} calm={calm} onClose={() => setDateAsk(null)} />}'));
    assert.ok(app.indexOf('{change && (') < app.indexOf('{dateAsk && <DateBox') && app.indexOf('{dateAsk && <DateBox') < app.indexOf('{toast && <Toast'), 'the calendar over the sheet, the toast over the calendar');
  });
});
