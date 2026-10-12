// The mile pencil (D116): the program card's pencil opens a sheet that changes the mile mid-program, through the
// wizard's own validator, stores it as typed with an "edited" provenance that always records what it replaced, and
// locks for the last three weeks ("three weeks out the work is done"). D188 makes the pencil unconditional (every
// level) and D189 gives run_base a Run paces group with its own pencil.
//
// Oracles, typed here: the lock copy and the commit toast from D116; the validator strings from D183 and D189; the
// lock as a hand table (the last three weeks of a program lock: weeks 12 to 14 of 14, weeks 4 to 6 of 6); the
// days-out count and the race-day date from y/m/d integers (days-from-civil, Sakamoto's weekday, a typed month table).
// The app's clock is pinned to 2026-10-11 12:00 local, and each program's start date is worked out from that day.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { fixtures } from '../support/app.ts';
import { loadAppAt, domRegistry, clone } from '../support/pace-clock.ts';
import type { Cfg } from '@ia/core';
const TODAY = { y: 2026, m: 10, d: 11 };
const IA = loadAppAt(new Date(TODAY.y, TODAY.m - 1, TODAY.d, 12, 0, 0));
const reg = domRegistry(IA);
const doc = IA.window.document;
const toasts: string[] = [];
IA.window.__toast = (m: string) => toasts.push(m);
IA.eval('showToast = function(m){ __toast(m); }');

const LOCK_HEADER = 'THE ROW HOLDS';
const LOCK_BODY = 'You are too close to the race. Three weeks out the work is done. Changing your mile now would reset the pace of every session left, and those sessions have one job. Get you to the line fresh.';
const LOCK_BTN = 'Got it';
const COMMIT_TOAST: string = 'Mile updated. Every run still ahead of you now reads from your new row.';
const MSG_UNDER_3: string = 'Under 3:00 is not a mile time. The world record is 3:43. Check the entry.';
const MSG_OVER_25: string = 'Over 25:00 reads as a walk, not a run. Check the entry.';

const SEP = String.fromCharCode(1);
const textOf = (h: unknown): string => String(h).replace(/<[^>]+>/g, SEP).split(SEP).map((s) => s.trim()).filter(Boolean).join('\n');
/** The Monday that makes today fall in week `wk`: date arithmetic on the pinned today (a Sunday, 2026-10-11). */
function startDateForWeek(wk: number): string {
  const today = new Date(TODAY.y, TODAY.m - 1, TODAY.d);
  const d = new Date(today.getTime() - (wk - 1) * 7 * 864e5);
  while (d.getDay() !== 1) d.setDate(d.getDate() - 1);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
/** A stored program's setup: its config overrides, no race, its length, and the week today falls in. */
interface SeedOpts { cfg?: Partial<Cfg>; noRace?: boolean; tw?: number; wk?: number }
function seed(opts: SeedOpts = {}) {
  reg.clear();
  toasts.length = 0;
  const cfg = Object.assign(clone(fixtures.HALF_MANNY), opts.cfg || {});
  if (opts.noRace) {
    delete cfg.raceDate;
    cfg.primaryPath = 'test';
    cfg.eventTargeted = false;
  }
  const p = { id: 'gP', name: 'THE HALF MANNY', totalWeeks: opts.tw || 14, startDate: startDateForWeek(opts.wk || 3), cfg };
  IA.localStorage.setItem('ia_programs', JSON.stringify([p]));
  return p;
}
const isOpen = (id: string) => doc.getElementById(id)._cls.has('open');
const openSheet = () => IA.eval('openMileSheet')('gP');
const stored = () => JSON.parse(IA.localStorage.getItem('ia_programs')!)[0].cfg.cardioGoals.run;

test('the pencil\'s sheet, its lock popup and their fields are in the app', () => {
  for (const f of ['openMileSheet', 'closeMileSheet', 'commitMileChange']) assert.equal(typeof IA.eval(f), 'function', f);
  for (const id of ['mileOverlay', 'mileLockOverlay', 'mileSheetMins', 'mileSheetSecs']) assert.match(IA.html, new RegExp(`id="${id}"`), id);
});

test('the last three weeks lock the mile: the hand table of weeks', () => {
  const LOCK = [
    { tw: 14, wk: 10, locked: false }, { tw: 14, wk: 11, locked: false }, { tw: 14, wk: 12, locked: true }, { tw: 14, wk: 13, locked: true },
    { tw: 14, wk: 14, locked: true }, { tw: 6, wk: 3, locked: false }, { tw: 6, wk: 4, locked: true }, { tw: 6, wk: 6, locked: true },
  ];
  for (const r of LOCK) {
    seed({ tw: r.tw, wk: r.wk });
    assert.equal(IA.eval('_goalCurWeek')(JSON.parse(IA.localStorage.getItem('ia_programs')!)[0]), r.wk, `week ${r.wk}/${r.tw} resolves`);
    openSheet();
    assert.equal(isOpen('mileLockOverlay'), r.locked, `week ${r.wk} of ${r.tw}: the lock`);
    assert.equal(isOpen('mileOverlay'), !r.locked, `week ${r.wk} of ${r.tw}: the edit sheet`);
  }
});

test('the lock popup reads the ruled header, body and button, with the days out, the race day and the week', () => {
  seed({ tw: 14, wk: 12 });
  openSheet();
  const lock = textOf(doc.getElementById('mileLockBody').innerHTML).split('\n');
  assert.equal(lock[0], LOCK_HEADER);
  assert.ok(lock.includes(LOCK_BODY), JSON.stringify(lock));
  assert.equal(lock[lock.length - 1], LOCK_BTN);
  assert.doesNotMatch(doc.getElementById('mileLockBody').innerHTML, /re-pace/i);
  // Days out: days-from-civil(race) - days-from-civil(today); the race day's weekday by Sakamoto's algorithm.
  const civ = (y: number, m: number, d: number) => {
    y -= m <= 2 ? 1 : 0;
    const era = Math.floor(y / 400);
    const yoe = y - era * 400;
    const doy = Math.floor((153 * (m + (m > 2 ? -3 : 9)) + 2) / 5) + d - 1;
    return era * 146097 + yoe * 365 + Math.floor(yoe / 4) - Math.floor(yoe / 100) + doy - 719468;
  };
  const sakamoto = (y: number, m: number, d: number) => {
    const t = [0, 3, 2, 5, 0, 3, 5, 1, 4, 6, 2, 4];
    if (m < 3) y -= 1;
    return (y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) + t[m - 1] + d) % 7;
  };
  const [ry, rm, rd] = fixtures.HALF_MANNY.raceDate!.split('-').map(Number);
  const days = civ(ry, rm, rd) - civ(TODAY.y, TODAY.m, TODAY.d);
  assert.equal(days, 56, '2026-10-11 to 2026-12-06');
  const WD3 = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const MON3 = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  assert.equal(lock[lock.indexOf('Days out') + 1], String(days));
  assert.equal(lock[lock.lastIndexOf('Race day') + 1], `${WD3[sakamoto(ry, rm, rd)]}, ${MON3[rm - 1]} ${rd}, ${ry}`);
  assert.match(lock.join(' '), /Week[\s\S]{0,40}?12 of 14/);
});

test('with no race date the lock popup drops the two date lines and keeps the week and the body', () => {
  seed({ tw: 14, wk: 12, noRace: true });
  openSheet();
  const lock = textOf(doc.getElementById('mileLockBody').innerHTML);
  assert.doesNotMatch(lock, /Days out/);
  assert.doesNotMatch(lock, /Race day/);
  assert.match(lock.replace(/\n/g, ' '), /Week[\s\S]{0,40}?12 of 14/);
  assert.ok(lock.includes(LOCK_BODY));
});

test('every run goal\'s card carries one pencil labelled "Change mile time" and a Run paces group, at every level', () => {
  const detail = IA.eval('progDetailHTML');
  const mkProg = (cfg: Partial<Cfg>) => ({ id: 'gQ', name: 'n', totalWeeks: 14, startDate: startDateForWeek(3), cfg: Object.assign(clone(fixtures.HALF_MANNY), cfg) });
  const GRID: [string, Partial<Cfg>][] = [
    ['run_half, intermediate', {}],
    ['run_base', { cardioGoals: { run: { id: 'run_base', label: 'Build a Base' } } }],
    ['run_half, beginner', { experience: 'beginner' }],
  ];
  for (const [label, cfg] of GRID) {
    const h = detail(mkProg(cfg));
    assert.equal((h.match(/openMileSheet\(/g) || []).length, 1, `${label}: one pencil`);
    assert.match(h, /aria-label="Change mile time"/, label);
    assert.match(h, /det-label[^>]*>Run paces/, `${label}: the Run paces group`);
  }
  // D188 G4: a beginner's card with his 10:30 mile, a beginner's run_5k with none, and an intermediate's.
  const card = (over: Partial<Cfg>) => detail({ id: 'gQ', name: 'n', totalWeeks: 14, startDate: '2026-09-28', cfg: Object.assign(clone(fixtures.HALF_MANNY), over) });
  const PENCIL = /aria-label="Change mile time"/g;
  assert.equal((card({ experience: 'beginner' }).match(PENCIL) || []).length, 1);
  assert.equal((card({ experience: 'beginner', cardioGoals: { run: { id: 'run_5k', label: '5K' } } }).match(PENCIL) || []).length, 1);
  assert.equal((card({}).match(PENCIL) || []).length, 1);
});

function commit(mm: string, ss: string, opts?: SeedOpts) {
  seed(Object.assign({ tw: 14, wk: 3 }, opts || {}));
  openSheet();
  doc.getElementById('mileSheetMins').value = mm;
  doc.getElementById('mileSheetSecs').value = ss;
  toasts.length = 0;
  IA.eval('commitMileChange')();
  return stored();
}
const NO_PRIOR = { cfg: { cardioGoals: { run: { id: 'run_half', label: 'Half Marathon', baselineDist: '5', baseline: '5mi' } } } };

test('a commit over the default stores the mile as typed, kind edited in week 3, and records the default it replaced', () => {
  const g = commit('8', '12', NO_PRIOR);
  assert.equal(g.mileBestMins, '8');
  assert.equal(g.mileBestSecs, '12');
  assert.equal(g.mileBestSrc.kind, 'edited');
  assert.equal(g.mileBestSrc.wk, 3);
  assert.ok(g.mileBestSrc.from, 'from is always written');
  assert.equal(g.mileBestSrc.from.kind, 'default');
  assert.equal(g.mileBestSrc.from.mins, '');
  assert.match(g.mileBestSrc.at, /^\d{4}-\d{2}-\d{2}$/);
});

test('a commit over an entered mile records the prior time, toasts the ruled sentence, and the card names what it replaced', () => {
  const g = commit('9', '45');
  assert.deepEqual([g.mileBestSrc.from.kind, g.mileBestSrc.from.mins, g.mileBestSrc.from.secs], ['entered', '10', '30']);
  assert.equal(g.mileBestMins + ':' + g.mileBestSecs, '9:45');
  assert.equal(toasts[0], COMMIT_TOAST);
  assert.ok(g.mileBestMins !== '' && g.mileBestMins !== undefined, 'a pencil never un-anchors the goal');
  const a = IA.eval('runAnchorInfo')(JSON.parse(IA.localStorage.getItem('ia_programs')!)[0].cfg);
  assert.equal(a && a.kind, 'edited');
  assert.match(IA.eval('runAnchorSentence')(a), /Before that it was/);
});

test('the sheet uses the wizard\'s validator: a blank field or an impossible time blocks, an edge time advises and commits', () => {
  let g = commit('8', '');
  assert.equal(g.mileBestMins, '10', 'blank seconds blocks');
  assert.equal(toasts.length, 1, 'and toasts');
  g = commit('', '30');
  assert.equal(g.mileBestMins, '10', 'blank minutes blocks');
  g = commit('2', '30');
  assert.equal(g.mileBestMins + ':' + g.mileBestSecs, '10:30');
  assert.equal(toasts[0], MSG_UNDER_3);
  g = commit('26', '00');
  assert.equal(g.mileBestMins + ':' + g.mileBestSecs, '10:30');
  assert.equal(toasts[0], MSG_OVER_25);
  g = commit('4', '10');
  assert.equal(g.mileBestMins + ':' + g.mileBestSecs, '4:10', '4:10 commits');
  assert.ok(toasts[0].startsWith(COMMIT_TOAST) && /fastest row/.test(toasts[0]), toasts[0]);
  g = commit('13', '00');
  assert.equal(+g.mileBestMins * 60 + +g.mileBestSecs, 780, '13:00 commits');
  assert.match(toasts[0], /slowest/);
});

test('the validator still reads the wizard draft when called with no arguments', () => {
  IA.eval('WD = { experience:"intermediate", cardioGoals:{ run:{ mileBestMins:"2", mileBestSecs:"30" } } }');
  assert.equal(IA.eval('_mileEntryState()').msg, MSG_UNDER_3);
  IA.eval('WD.cardioGoals.run.mileBestMins="10"; WD.cardioGoals.run.mileBestSecs="30"');
  assert.equal(IA.eval('_mileEntryState()').ok, true);
  IA.eval('WD.experience="beginner"');
  assert.equal(IA.eval('_mileEntryState()').ok, true);
  assert.equal(IA.eval('_mileEntryState').length, 2, 'it takes (g, exp)');
  assert.equal(IA.eval('_mileEntryState')({ mileBestMins: '26', mileBestSecs: '0' }, 'intermediate').msg, MSG_OVER_25, 'explicit arguments bypass the draft');
});

test('an edited mile is read as typed and interpolated, never snapped to a chart row', () => {
  const at = (sec: number) => JSON.stringify(IA.eval('paceChartLookup')('mile', sec));
  assert.notEqual(at(510), at(480), '8:30 is not the 8:00 row');
  assert.notEqual(at(510), at(540), '8:30 is not the 9:00 row');
  const x = commit('8', '30');
  assert.equal(at(+x.mileBestMins * 60 + +x.mileBestSecs), at(510));
});

test('the lock body and the toast carry no mid-sentence dash and no Nike, and ship in the app as typed', () => {
  const midDash = (s: string) => /[A-Za-z0-9,)]\s*[—-]\s*[A-Za-z0-9(]/.test(s.replace(/\d+–\d+/g, ''));
  assert.ok(!midDash(LOCK_BODY));
  assert.ok(!midDash(COMMIT_TOAST));
  assert.ok(IA.html.includes(LOCK_BODY));
  assert.ok(IA.html.includes(COMMIT_TOAST));
  assert.doesNotMatch(LOCK_BODY + COMMIT_TOAST + LOCK_HEADER, /Nike/);
});

test('building a program leaves its cfg byte-identical', () => {
  const before = JSON.stringify(fixtures.HALF_MANNY);
  IA.buildProgram(fixtures.HALF_MANNY);
  assert.equal(JSON.stringify(fixtures.HALF_MANNY), before);
});
