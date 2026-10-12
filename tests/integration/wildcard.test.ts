// The Wildcard: a substitute the athlete chose, never a session they finished. It is attendance, so it rescues a skipped
// day's streak; its mark (a flame and a W) and its tag show on the day it was done; on today's orange cell the mark and
// the completion tick turn to the on-signal colour. Rulings D64, D71 and D71b (the Wildcard), D185 (the today cell).
//
// The program is built by hand (tests/support/wildcard.js), never by buildProgram: six weeks starting fourteen days
// before today, so today is in week 3, and the athlete is browsing week 6. Each behaviour is run with the app's clock
// pinned to each of the seven days of the week of Monday 2026-09-14, so today is every weekday once, Sunday included.
// renderWeekView and openDetail are called and what they wrote is read back; completeWildcard runs with the pop-ups
// replaced by spies.
//
// Oracles are typed by hand: the calendar (Date(y, m, d + n) arithmetic, never a millisecond division), every streak
// number as a walk over the fixture stated beside the case, every string from the ruling, the escaped title by HTML
// entity rules written out here, the flame path, and the colour tokens. The colour on the today cell is resolved by a
// small CSS cascade resolver over the app's <style> text, never by the app. The day lattice across daylight saving
// changes runs here in New York (a child process with TZ set); tests/sweeps/wildcard.test.js runs it in seven zones.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { 
  DK, WEEK, PID, iso, addDays, wildcardBench, stripOf, stripCells, DST_CASES, dstLatticeIn,
  styleText, cssRules, parseCompound, colorCandidates, winningColor, el, contrast,
 } from '../support/wildcard.ts';
import type { HandDay, WildcardDay, WildRecord } from '../support/wildcard.ts';
const J = JSON.stringify;
const B = wildcardBench();
const { IA, ev } = B;
const C = { title: 'Recovery Lift', ts: 1, status: 'complete' };
const S = { title: 'Recovery Lift', ts: 1, status: 'skipped' };
const K = (x: { week: number; d: string }) => 'w' + x.week + '_' + x.d;
const stripJs = (s: string): string => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');

/** Stores the Wildcard 'Chaos Workout' through completeWildcard and runs its queued pop-up. */
function completeChaos() {
  let threw: string | null = null;
  try {
    ev("completeWildcard('Chaos Workout')");
  } catch (e) {
    threw = (e as Error).message;
  }
  IA.flushTimers();
  return threw;
}

// ── a Wildcard on a rest day ─────────────────────────────────────────────────────────────────────────────────────────
// Today rests; the two scheduled days before it are complete, so the hand walk gives a streak of 2.
function restDay(F: WildcardDay) {
  const sched = F.handScheduled(F.RESTS);
  const seed: Record<string, unknown> = {};
  sched.slice(-2).forEach((x) => { seed[K(x)] = C; });
  B.install(F.mkProg(F.RESTS, 'Recovery Lift'), seed);
  const before = { comp: B.comp(), streak: B.streak(), count: B.completed() };
  const threw = completeChaos();
  return { before, threw, wild: B.wild(), cap: B.cap() };
}

test('a Wildcard on a rest day stores one record, stamped with today by the date and not the browsed week, and nothing else', () => {
  for (const today of WEEK) {
    const F = B.at(today);
    const r = restDay(F);
    const at = F.TODAY_KEY;
    assert.equal(r.threw, null, at);
    assert.equal(B.comp(), r.before.comp, at + ': ia_comp_ is byte for byte the same');
    assert.equal(B.hist(), null, at + ': ia_hist_ is never written');
    assert.equal(r.wild.length, 1, at + ' ' + J(r.wild));
    assert.equal(r.wild[0].title, 'Chaos Workout', at);
    assert.equal(F.EXP_WEEK, 3, 'today is in week 3 of the hand fixture');
    assert.equal(r.wild[0].week, 3, at + ' ' + J(r.wild[0]));
    assert.equal(r.wild[0].dayKey, at, at + ' ' + J(r.wild[0]));
    assert.notEqual(r.wild[0].week, F.VIEWED_WEEK, at);
    // the stamp back to a calendar date is today
    assert.equal(iso(addDays(F.START_MON, (r.wild[0].week - 1) * 7 + DK.indexOf(r.wild[0].dayKey))), iso(F.TODAY), at);
  }
});

test('a Wildcard on a rest day leaves the streak at 2 and the completed count at 2', () => {
  for (const today of WEEK) {
    const r = restDay(B.at(today));
    assert.equal(r.before.streak, 2, 'the hand walk');
    assert.equal(B.streak(), 2);
    assert.equal(r.before.count, 2);
    assert.equal(B.completed(), 2);
  }
});

test('the rest day pop-up says WILDCARD DONE, You showed up. That is the whole game., Streak holds., with no stats and no season or completion pop-up', () => {
  for (const today of WEEK) {
    const r = restDay(B.at(today));
    assert.ok(r.cap, 'a pop-up fired');
    assert.equal(r.cap.opts.kicker, 'WILDCARD DONE');
    assert.equal(r.cap.opts.msg, 'You showed up. That is the whole game.');
    assert.equal(r.cap.opts.sub, 'Streak holds.');
    assert.ok(!(r.cap.opts.stats && r.cap.opts.stats.length), 'no PR and no progress: ' + J(r.cap.opts.stats));
    assert.equal(B.seasonFired(), 0);
    assert.equal(B.completionFired(), 0);
  }
});

// ── a Wildcard on a training day ─────────────────────────────────────────────────────────────────────────────────────
// Today trains and is the last scheduled day; the two scheduled days before it are complete: a streak of 2 before.
function trainingDay(F: WildcardDay) {
  const sched = F.handScheduled(F.TRAINS);
  const seed: Record<string, unknown> = {};
  sched.slice(-3, -1).forEach((x) => { seed[K(x)] = C; });
  B.install(F.mkProg(F.TRAINS, 'Recovery Lift'), seed);
  const before = { comp: B.comp(), streak: B.streak() };
  const threw = completeChaos();
  return { sched, before, threw, cap: B.cap(), season: B.seasonFired(), completion: B.completionFired() };
}

test('a Wildcard on a training day writes no completion and leaves the prescribed session pending', () => {
  for (const today of WEEK) {
    const F = B.at(today);
    const r = trainingDay(F);
    const last = r.sched[r.sched.length - 1];
    assert.equal(last.d, F.TODAY_KEY, 'today is the last day of the hand walk');
    assert.equal(last.week, 3);
    assert.equal(r.threw, null);
    assert.equal(B.comp(), r.before.comp, F.TODAY_KEY + ': ia_comp_ is byte for byte the same');
    assert.equal(B.hist(), null);
    assert.equal(ev('statusOf(3,' + J(F.TODAY_KEY) + ')'), null, 'the session is still pending');
    assert.equal(B.completed(), 2, 'only the two hand-written completions count');
  }
});

test('a Wildcard on a training day extends the streak from 2 to 3 and says Streak: 3., with no season or completion pop-up', () => {
  for (const today of WEEK) {
    const r = trainingDay(B.at(today));
    assert.equal(r.before.streak, 2);
    assert.equal(B.streak(), 3);
    assert.ok(r.cap);
    assert.equal(r.cap.opts.sub, 'Streak: 3.');
    assert.equal(r.season, 0);
    assert.equal(r.completion, 0);
  }
});

// ── off the block's calendar ─────────────────────────────────────────────────────────────────────────────────────────
test('off the calendar of the block a Wildcard still counts, stamps no day and writes nothing else', () => {
  for (const today of WEEK) {
    const F = B.at(today);
    const prog = F.mkProg(['sun'], 'Recovery Lift');
    prog.startDate = iso(addDays(F.TODAY, -400)); // today is far past week 6
    B.install(prog, null);
    assert.equal(completeChaos(), null);
    const w = B.wild();
    assert.equal(w.length, 1, J(w));
    assert.equal(w[0].title, 'Chaos Workout');
    assert.ok(!w[0].week && !w[0].dayKey, 'no stamp: ' + J(w[0]));
    assert.equal(B.comp(), null);
    assert.equal(B.hist(), null);
  }
});

test('an unstamped record renders no mark and no tag on any day', () => {
  const F = B.at(WEEK[0]);
  const prog = F.mkProg(['sun'], 'Recovery Lift');
  prog.startDate = iso(addDays(F.TODAY, -400));
  B.install(prog, null);
  completeChaos();
  for (let w = 1; w <= 6; w++) {
    for (const d of DK) {
      assert.equal(ev('wildcardTagHTML(' + w + ',' + J(d) + ')'), '', 'week ' + w + ' ' + d);
      assert.equal(ev('wildcardOn(' + w + ',' + J(d) + ')'), null, 'week ' + w + ' ' + d);
    }
  }
});

// ── the week strip ───────────────────────────────────────────────────────────────────────────────────────────────────
/** Today trains, a Wildcard is stamped on today, and week 3 is rendered. */
function stripWithWildcard(F: WildcardDay) {
  B.install(F.mkProg(F.TRAINS, 'Recovery Lift'), null, 3);
  B.setWild([{ title: 'Chaos Workout', ts: 1, week: 3, dayKey: F.TODAY_KEY }]);
  ev('renderWeekView()');
  return B.weekHTML();
}

test('the week strip marks the Wildcard day with a W in place of its date, on that cell only', () => {
  for (const today of WEEK) {
    const F = B.at(today);
    const h = stripWithWildcard(F);
    const at = F.TODAY_KEY;
    assert.ok(h.includes('wk-strip'), 'renderWeekView wrote a week strip');
    const cells = stripCells(h);
    assert.deepEqual(Object.keys(cells).sort(), DK.slice().sort(), 'a cell for each of the seven weekdays');
    assert.ok(cells[at].includes('wc-mark') && cells[at].includes('>W<'), at + ': ' + cells[at]);
    assert.deepEqual(DK.filter((d) => d !== at && cells[d].includes('wc-mark')), [], 'no other day carries the mark');
    assert.equal((stripOf(h).match(/class="wc-mark"/g) || []).length, 1, 'one mark in the strip');
    assert.match(cells[at], /<div class="wk-day-num">\s*<span class="wc-mark"/, 'the W stands in the date number\'s place');
  }
});

test('the Wildcard day shows no completion tick, and a completed day shows the tick ✓ and not the W', () => {
  for (const today of WEEK) {
    const F = B.at(today);
    const at = F.TODAY_KEY;
    assert.ok(!stripCells(stripWithWildcard(F))[at].includes('class="chk"'), at);
    B.setComp({ ['w3_' + at]: C });
    ev('renderWeekView()');
    const cell = stripCells(B.weekHTML())[at];
    assert.ok(cell.includes('<span class="chk">✓</span>'), at + ': ' + cell);
    assert.ok(!cell.includes('wc-mark'), at + ': the check wins the cell');
  }
});

test('a browsed future week shows no Wildcard mark and no tag', () => {
  for (const today of WEEK) {
    const F = B.at(today);
    stripWithWildcard(F);
    ev('currentWeek=6; renderWeekView()');
    const h = B.weekHTML();
    assert.ok(h.includes('wk-strip'));
    assert.ok(!h.includes('wc-mark') && !h.includes('wc-tag'), F.TODAY_KEY);
  }
});

// ── the week view tag ────────────────────────────────────────────────────────────────────────────────────────────────
test('on a rest day the week view prints the tag WILDCARD DONE, Rest day. The streak sits this one out., below the hero and above the stat tiles', () => {
  for (const today of WEEK) {
    const F = B.at(today);
    B.install(F.mkProg(F.RESTS, 'Recovery Lift'), null, 3);
    B.setWild([{ title: 'Chaos Workout', ts: 1, week: 3, dayKey: F.TODAY_KEY }]);
    ev('renderWeekView()');
    const h = B.weekHTML();
    assert.ok(h.includes('class="wc-tag"'), F.TODAY_KEY);
    assert.ok(h.includes('Rest day. The streak sits this one out.'));
    assert.ok(h.indexOf('wc-tag') > h.indexOf('wk-hero') && h.indexOf('wc-tag') < h.indexOf('wk-stats'),
      'hero@' + h.indexOf('wk-hero') + ' tag@' + h.indexOf('wc-tag') + ' stats@' + h.indexOf('wk-stats'));
    assert.match(h, /<div class="wc-tag-lbl">WILDCARD DONE<\/div>/);
  }
});

test('on a training day the week view tag names the prescribed session, never the rest line', () => {
  for (const today of WEEK) {
    const F = B.at(today);
    B.install(F.mkProg(F.TRAINS, 'Tempo Run'), null, 3);
    B.setWild([{ title: 'Chaos Workout', ts: 1, week: 3, dayKey: F.TODAY_KEY }]);
    ev('renderWeekView()');
    const h = B.weekHTML();
    assert.ok(h.includes('class="wc-tag"'), F.TODAY_KEY);
    assert.ok(h.includes('Tempo Run is still on the board.'));
    assert.ok(!h.includes('Your session is still on the board.'));
    assert.ok(!h.includes('Rest day. The streak sits this one out.'));
  }
});

test('with no Wildcard stored the week view prints no tag', () => {
  for (const today of WEEK) {
    const F = B.at(today);
    B.install(F.mkProg(F.TRAINS, 'Tempo Run'), null, 3);
    ev('renderWeekView()');
    assert.ok(B.weekHTML().includes('wk-strip'));
    assert.ok(!B.weekHTML().includes('wc-tag'), F.TODAY_KEY);
  }
});

// ── the day detail tag ───────────────────────────────────────────────────────────────────────────────────────────────
const TITLES = ['Recovery Lift', "Farmer's & Rower's Day", 'Push & Pull', "Coach's Choice"];
/** The HTML entity rules, written out by hand. */
const handEsc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const openToday = (F: WildcardDay) => ev('openDetail(' + J(F.TODAY_KEY) + ', activeProg.weeks[3][' + J(F.TODAY_KEY) + '])');

test('the day detail opens with the Wildcard tag, naming the session with apostrophes and ampersands escaped', () => {
  for (const today of WEEK) {
    const F = B.at(today);
    for (const title of TITLES) {
      B.install(F.mkProg(F.TRAINS, title), null, 3);
      B.setWild([{ title: 'Chaos Workout', ts: 1, week: 3, dayKey: F.TODAY_KEY }]);
      openToday(F);
      const d = B.detailHTML();
      const at = F.TODAY_KEY + ' ' + title;
      assert.ok(d.length > 0, at + ': openDetail wrote the body');
      assert.equal(d.indexOf('<div class="wc-tag"'), 0, at + ': the tag comes first: ' + d.slice(0, 120));
      assert.ok(d.includes(handEsc(title + ' is still on the board.')), at);
      const tag = d.slice(0, d.indexOf('</div></div>') + 12);
      assert.ok(!tag.includes("'"), at + ': no raw apostrophe');
      assert.ok(!/&(?!amp;|#39;|quot;|lt;|gt;|nbsp;|#\d+;)/.test(tag), at + ': no bare ampersand');
    }
  }
});

test('the day detail carries no Wildcard tag when none is stored', () => {
  for (const today of WEEK) {
    const F = B.at(today);
    for (const title of TITLES) {
      B.install(F.mkProg(F.TRAINS, title), null, 3);
      openToday(F);
      assert.ok(B.detailHTML().length > 0);
      assert.ok(!B.detailHTML().includes('wc-tag'), F.TODAY_KEY + ' ' + title);
    }
  }
});

// ── the streak ───────────────────────────────────────────────────────────────────────────────────────────────────────
// The skip describes the prescribed session, the Wildcard what the athlete did; the streak measures attendance. Today
// trains and is the last scheduled day (t0); t1 and t2 are the two scheduled days before it. Hand walks, from the end:
// a skip breaks, a complete or a Wildcard counts, a pending day is transparent.
function streakCase(F: WildcardDay) {
  const s = F.handScheduled(F.TRAINS);
  const t = [s[s.length - 1], s[s.length - 2], s[s.length - 3]];
  const W = (x: HandDay): WildRecord => ({ title: 'Chaos Workout', ts: 1, week: x.week, dayKey: x.d });
  const prog = F.mkProg(F.TRAINS, 'Recovery Lift');
  return { t, W, set: (comp: Record<string, unknown> | null, wild?: WildRecord[]) => { B.install(prog, comp, 3); if (wild) B.setWild(wild); } };
}

test('a skipped day with no Wildcard breaks the streak to 0, with one skip and two completions counted', () => {
  for (const today of WEEK) {
    const F = B.at(today);
    const { t, set } = streakCase(F);
    assert.equal(t[0].d, F.TODAY_KEY);
    assert.ok(t[1].date < t[0].date);
    set({ [K(t[0])]: S, [K(t[1])]: C, [K(t[2])]: C });
    assert.equal(B.streak(), 0, F.TODAY_KEY);
    assert.equal(B.skipped(), 1);
    assert.equal(B.completed(), 2);
  }
});

test('a Wildcard on a skipped day rescues the streak to 3 and moves neither count', () => {
  for (const today of WEEK) {
    const { t, W, set } = streakCase(B.at(today));
    set({ [K(t[0])]: S, [K(t[1])]: C, [K(t[2])]: C }, [W(t[0])]);
    assert.equal(B.streak(), 3);
    assert.equal(B.completed(), 2);
    assert.equal(B.skipped(), 1);
  }
});

test('the rescue is the same whichever was stored first, the skip or the Wildcard', () => {
  for (const today of WEEK) {
    const { t, W, set } = streakCase(B.at(today));
    const comp = { [K(t[0])]: S, [K(t[1])]: C, [K(t[2])]: C };
    set(null, [W(t[0])]);
    B.setComp(comp);
    const wildFirst = B.streak();
    set(comp, [W(t[0])]);
    assert.deepEqual([wildFirst, B.streak()], [3, 3]);
  }
});

test('the rescue is per day: an unrescued skip behind it breaks at 1, and two rescued skips carry to 3', () => {
  for (const today of WEEK) {
    const { t, W, set } = streakCase(B.at(today));
    set({ [K(t[0])]: S, [K(t[1])]: S, [K(t[2])]: C }, [W(t[0])]);
    assert.equal(B.streak(), 1);
    B.setWild([W(t[0]), W(t[1])]);
    assert.equal(B.streak(), 3);
  }
});

test('a day holding both a completion and a Wildcard counts once', () => {
  for (const today of WEEK) {
    const { t, W, set } = streakCase(B.at(today));
    set({ [K(t[0])]: C });
    assert.equal(B.streak(), 1);
    B.setWild([W(t[0])]);
    assert.equal(B.streak(), 1);
  }
});

test('a Wildcard on a pending day starts a streak of 1 without writing a completion', () => {
  for (const today of WEEK) {
    const { t, W, set } = streakCase(B.at(today));
    set(null, [W(t[0])]);
    assert.equal(B.streak(), 1);
    assert.equal(B.completed(), 0);
  }
});

test('a rest day Wildcard is invisible to the streak, even on a rest day marked skipped', () => {
  for (const today of WEEK) {
    const F = B.at(today);
    const s = F.handScheduled(F.RESTS);
    const comp = { [K(s[s.length - 1])]: C, [K(s[s.length - 2])]: C };
    B.install(F.mkProg(F.RESTS, 'Recovery Lift'), comp, 3);
    assert.equal(B.streak(), 2);
    B.setWild([{ title: 'Chaos Workout', ts: 1, week: 3, dayKey: F.TODAY_KEY }]);
    assert.equal(B.streak(), 2, F.TODAY_KEY);
    assert.equal(ev('scheduledDays(new Date()).filter(function(x){return x.week===3&&x.d===' + J(F.TODAY_KEY) + ';}).length'), 0,
      'today\'s rest day is not in scheduledDays');
    B.setComp(Object.assign({}, comp, { ['w3_' + F.TODAY_KEY]: S }));
    assert.equal(B.streak(), 2);
  }
});

// ── the completion writers stay out of the flow ──────────────────────────────────────────────────────────────────────
const fnSrc = (name: string) => stripJs(ev(name + '.toString()'));

test('completeWildcard calls no completion writer and no completion or season pop-up', () => {
  const src = fnSrc('completeWildcard');
  const banned = ['markDayComplete', 'snapshotDay', 'ia_comp_', 'saveCompleted', 'fireCompletionPopup', 'fireSeasonPopup', 'skipped'];
  assert.deepEqual(banned.filter((b) => src.includes(b)), []);
});

test('the Wildcard pop-up calls popFire once and nothing that escalates to a season or a completion', () => {
  const calls = (fnSrc('fireWildcardPopup').match(/\b[A-Za-z_$][\w$]*\s*\(/g) || []).map((x) => x.replace(/\s*\($/, ''));
  assert.deepEqual(calls.filter((c) => /[Ss]eason|Completion|markDayComplete|snapshot/.test(c)), []);
  assert.equal(calls.filter((c) => c === 'popFire').length, 1, calls.join(','));
});

test('completedCount, skippedCount and refreshProgram never read the Wildcard store', () => {
  for (const f of ['completedCount', 'skippedCount', 'refreshProgram']) {
    const src = fnSrc(f);
    assert.ok(!src.includes('ia_wild_') && !src.includes('ildcard'), f);
  }
});

test('no function of the Wildcard flow contains the word skipped', () => {
  const fns = ['completeWildcard', 'fireWildcardPopup', 'wildcardDayFor', 'wildcardDaySet', 'wildcardOn', 'wildcardMarkHTML', 'wildcardTagHTML'];
  assert.deepEqual(fns.filter((f) => fnSrc(f).includes('skipped')), []);
});

// ── the mark ─────────────────────────────────────────────────────────────────────────────────────────────────────────
const FLAME = 'M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z';

test('the mark is the flame icon as inline SVG plus a W, never an emoji', () => {
  const h = ev('wildcardMarkHTML(14)');
  assert.ok(h.startsWith('<span class="wc-mark"'), h);
  assert.ok(h.includes('<svg') && h.includes(FLAME) && h.includes('>W<'), h);
  assert.ok(!/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(h), 'no emoji');
});

test('the W mark is painted signal orange, #CF4E1A', () => {
  assert.match(IA.html, /\.wc-mark\{[^}]*color:var\(--signal\)/);
  assert.match(IA.html, /--signal:#CF4E1A/);
});

test('the flame comes from the icon table, which defines it once', () => {
  assert.equal((IA.html.match(/"flame":/g) || []).length, 1);
});

// ── the copy, harvested from what the app rendered and popped ────────────────────────────────────────────────────────
const RULED = {
  tagLabel: 'WILDCARD DONE',
  restSub: 'Rest day. The streak sits this one out.',
  trainSub: 'Recovery Lift is still on the board.',
  popKicker: 'WILDCARD DONE',
  popMsg: 'You showed up. That is the whole game.',
  popSubRest: 'Streak holds.',
  popSubTrain: 'Streak: 3.',
  filterLabel: 'My Goal',
};
function harvest(F: WildcardDay) {
  const out: Record<string, string | null> = {};
  const sub = (h: string) => { const m = h.match(/<div class="wc-tag-sub">([\s\S]*?)<\/div>/); return m ? m[1] : null; };
  const lbl = (h: string) => { const m = h.match(/<div class="wc-tag-lbl">([\s\S]*?)<\/div>/); return m ? m[1] : null; };
  B.install(F.mkProg(F.RESTS, 'Recovery Lift'), null, 3);
  completeChaos();
  ev('currentWeek=3; renderWeekView()');
  out.tagLabel = lbl(B.weekHTML());
  out.restSub = sub(B.weekHTML());
  let c = B.cap();
  out.popKicker = c && c.opts.kicker;
  out.popMsg = c && c.opts.msg;
  out.popSubRest = c && c.opts.sub;
  const s = F.handScheduled(F.TRAINS);
  const seed: Record<string, unknown> = {};
  s.slice(-3, -1).forEach((x) => { seed[K(x)] = C; });
  B.install(F.mkProg(F.TRAINS, 'Recovery Lift'), seed, 3);
  completeChaos();
  ev('currentWeek=3; renderWeekView()');
  out.trainSub = sub(B.weekHTML());
  c = B.cap();
  out.popSubTrain = c && c.opts.sub;
  ev("randFilter='mine'; buildRandFilterBar();");
  const bm = B.barHTML().match(/setRandFilter\('mine'\)">([\s\S]*?)<\/button>/);
  out.filterLabel = bm ? bm[1] : null;
  return out;
}

test('every Wildcard string the app rendered or popped reads the ruled text', () => {
  for (const today of WEEK) {
    const got = harvest(B.at(today));
    assert.deepEqual(got, RULED);
  }
});

test('no rendered Wildcard string carries a dash, Nike, skipped, or a claim of a completion or a PR', () => {
  const got = Object.values(harvest(B.at(WEEK[0])));
  assert.equal(got.filter((s) => typeof s === 'string').length, Object.keys(RULED).length, 'every string was harvested');
  for (const s of got as string[]) {
    assert.ok(!/\S\s*[—–-]\s*\S/.test(s), s);
    assert.ok(!s.includes('Nike'), s);
    assert.ok(!s.toLowerCase().includes('skipped'), s);
    assert.ok(!/\b(complete|completed|PR\b|personal record)\b/i.test(s), s);
  }
});

test('the Wildcard filter bar says My Goal, with no parenthetical', () => {
  B.at(WEEK[0]);
  ev("randFilter='mine'; buildRandFilterBar();");
  assert.match(B.barHTML(), /setRandFilter\('mine'\)">My Goal<\/button>/);
  assert.ok(!B.barHTML().includes('My Goal ('), B.barHTML());
});

test('with no endurance pool, an endurance goal\'s My Goal draw falls back to the balanced pool', () => {
  assert.equal(IA.RAND_POOLS.endurance, undefined);
  assert.ok(Array.isArray(IA.RAND_POOLS.balanced) && IA.RAND_POOLS.balanced.length > 0);
  const F = B.at(WEEK[0]);
  const prog = F.mkProg(['sun'], 'Recovery Lift');
  prog.goal = 'endurance';
  B.install(prog, null, 3);
  ev("randFilter='mine'");
  assert.equal(ev('getActivePool()===RAND_POOLS.balanced'), true);
});

// ── the readers of the widened record ────────────────────────────────────────────────────────────────────────────────
// The store holds {title, ts, week, dayKey}; older records hold {title, ts}. The counter and the Done Before badge read
// titles only, so both shapes drive them.
test('the x/y counter counts records with and without a day stamp', () => {
  const F = B.at(WEEK[0]);
  B.install(F.mkProg(['sun'], 'Recovery Lift'), null, 3);
  const pool: string[] = IA.RAND_POOLS.balanced.map((w: { title: string }) => w.title);
  B.setWild([{ title: pool[0], ts: 1 }, { title: pool[1], ts: 2, week: 3, dayKey: F.TODAY_KEY }]);
  ev('updateRandCounter()');
  assert.equal(B.counterText(), '2/' + pool.length);
});

test('the Done Before badge reads the title whatever the record shape, and an empty store offers the Complete button', () => {
  const F = B.at(WEEK[0]);
  B.install(F.mkProg(['sun'], 'Recovery Lift'), null, 3);
  const pool: string[] = IA.RAND_POOLS.balanced.map((w: { title: string }) => w.title);
  B.setWild(pool.map((t, i) => (i % 2 ? { title: t, ts: i } : { title: t, ts: i, week: 3, dayKey: F.TODAY_KEY })));
  ev("randFilter='mine'; reroll();");
  let h = B.randBodyHTML();
  assert.ok(h.includes('Done Before') && !h.includes('wildcard-complete-btn'), h.slice(0, 200));
  B.LS.removeItem('ia_wild_' + PID);
  ev("randFilter='mine'; reroll();");
  h = B.randBodyHTML();
  assert.ok(h.includes('wildcard-complete-btn') && !h.includes('Done Before'), h.slice(0, 200));
});

// ── the day a date resolves to, across daylight saving changes (New York) ────────────────────────────────────────────
const NY = dstLatticeIn('America/New_York');
const nyRows = (ids: string[]) => ids.filter((id) => !(NY.rows[id] && NY.rows[id].ok)).map((id) => id + ': ' + (NY.rows[id] ? NY.rows[id].detail : 'no result'));

test('in New York every day of a block resolves to the hand calendar and back, across the spring and fall changes, odd starts, a new year and a leap February', () => {
  assert.ok(NY.ran, NY.error);
  assert.equal(NY.offset === 240 || NY.offset === 300, true, 'the child ran in New York: offset ' + NY.offset);
  assert.deepEqual(nyRows(DST_CASES.map((c) => c[0])), []);
});

test('Sunday, the seventh weekday, resolves to the Sunday of week 1', () => {
  assert.deepEqual(nyRows(['dst15-sunday-wrap']), []);
});

test('a rest day still resolves to its day, and scheduledDays drops it', () => {
  assert.deepEqual(nyRows(['dst16-rest-resolves', 'dst17-sched-drops-rest']), []);
});

test('the days before the start and after the last week resolve to nothing; the first and last days resolve to themselves', () => {
  assert.deepEqual(nyRows(['dst18-before-start', 'dst19-week1-monday', 'dst20-first-day', 'dst21-last-day', 'dst22-after-end']), []);
});

test('a missing day, a missing start date or no program resolves to nothing', () => {
  assert.deepEqual(nyRows(['dst23-missing-day', 'dst24-no-start', 'dst25-no-prog']), []);
});

// ── the today cell: the W mark and the tick on orange (D185) ─────────────────────────────────────────────────────────
// The markup, by hand: renderWeekView writes .wk-day[.today] > .wk-day-num > span.chk | span.wc-mark, and the skip glyph
// is bare text in .wk-day-num. The tokens, by hand from the design system: signal #CF4E1A (the today cell's
// background), on-signal #FBF6EE, run #5e8c54, the page background #f4f1e8. By the WCAG formula, on-signal over signal
// is about 4.10:1, signal over the page about 3.91:1, run over the page about 3.47:1.
const CSS = cssRules(IA.html);
const TODAY_RULE = '.wk-day.today .chk,.wk-day.today .wc-mark{color:var(--on-signal);}';
const GLYPH_BLOCK = [
  '.wk-day-num .chk{color:var(--run);}',
  '.wk-day-num .wc-mark{color:var(--signal);}',
  '.wc-mark{display:inline-flex;align-items:center;gap:1px;color:var(--signal);line-height:1;}',
  TODAY_RULE,
  '.wc-mark-w{font-family:var(--font-display);font-weight:800;font-size:11px;letter-spacing:0;}',
];
const cellNum = (today: boolean) => el('div', ['wk-day-num'], el('div', ['wk-day'].concat(today ? ['today'] : [])));
const NODES = {
  todayMark: el('span', ['wc-mark'], cellNum(true)),
  todayChk: el('span', ['chk'], cellNum(true)),
  todayNum: cellNum(true),
  otherMark: el('span', ['wc-mark'], cellNum(false)),
  otherChk: el('span', ['chk'], cellNum(false)),
};
const win = (k: keyof typeof NODES) => {
  const w = winningColor(CSS.rules, NODES[k]);
  return { sel: w && w.sel, hex: w && CSS.resolveVar(w.v) };
};
const tok = (n: string) => CSS.resolveVar(CSS.rootVars[n]).toLowerCase();

test('the five glyph colour rules sit together in the stylesheet once each, in order: tick, W mark, mark base, the today rule, the W letter', () => {
  const st = styleText(IA.html);
  for (const r of GLYPH_BLOCK) assert.equal(st.split(r).length - 1, 1, r);
  assert.equal((IA.html.match(/\.wk-day\.today \.chk,\.wk-day\.today \.wc-mark\{color:var\(--on-signal\);\}/g) || []).length, 1, 'the today rule carries no third selector');
  const lines = st.split('\n');
  const at = lines.indexOf(GLYPH_BLOCK[0]);
  assert.ok(at >= 0, 'the tick rule is a whole line');
  assert.deepEqual(lines.slice(at, at + GLYPH_BLOCK.length), GLYPH_BLOCK);
});

test('the colour tokens are signal #CF4E1A, on-signal #FBF6EE and run #5e8c54', () => {
  assert.equal(tok('--signal'), '#cf4e1a');
  assert.equal(tok('--on-signal'), '#fbf6ee');
  assert.equal(tok('--run'), '#5e8c54');
});

test('on today\'s orange cell the W mark and the tick resolve to on-signal, through the today rule', () => {
  assert.deepEqual(win('todayMark'), { sel: '.wk-day.today .wc-mark', hex: '#FBF6EE' });
  assert.deepEqual(win('todayChk'), { sel: '.wk-day.today .chk', hex: '#FBF6EE' });
});

test('on any other day the W mark stays signal and the tick stays run', () => {
  assert.equal(win('otherMark').hex, '#CF4E1A');
  assert.equal(win('otherChk').hex, '#5e8c54');
});

test('the skip glyph on today\'s cell takes on-signal from the today date rule, and no tick or W rule reaches it', () => {
  const sels = colorCandidates(CSS.rules, NODES.todayNum).map((c) => c.sel);
  assert.deepEqual(sels.filter((s) => {
    const o = parseCompound(s.trim().split(/\s+/).pop()!);
    return o.cls.includes('chk') || o.cls.includes('wc-mark');
  }), []);
  assert.deepEqual(win('todayNum'), { sel: '.wk-day.today .wk-day-num', hex: '#FBF6EE' });
});

test('on today\'s cell the W mark and the tick read at the skip glyph\'s contrast, about 4.10:1, above the 3:1 floor', () => {
  const signal = '#CF4E1A';
  const skip = contrast('#FBF6EE', signal);
  assert.ok(Math.abs(skip - 4.10) < 0.01, skip.toFixed(4));
  for (const k of ['todayMark', 'todayChk'] as const) {
    const c = contrast(win(k).hex!, signal);
    assert.equal(+c.toFixed(4), +skip.toFixed(4), k);
    assert.ok(c >= 3, k + ' ' + c.toFixed(2));
  }
});

test('off today the W mark reads about 3.91:1 and the tick between 3 and 3.6 on the page background', () => {
  const mark = contrast(win('otherMark').hex!, '#f4f1e8');
  const chk = contrast(win('otherChk').hex!, '#f4f1e8');
  assert.ok(Math.abs(mark - 3.91) < 0.05, mark.toFixed(2));
  assert.ok(chk > 3 && chk < 3.6, chk.toFixed(2));
});

test('only five colour rules name the tick or the W mark: three for the glyphs and two from the today rule', () => {
  const fam = CSS.rules.filter((r) => !r.media && r.decls.some((d) => d.p === 'color') && /\.(chk|wc-mark)(?![\w-])/.test(r.sel));
  assert.deepEqual(fam.map((r) => r.sel), ['.wk-day-num .chk', '.wk-day-num .wc-mark', '.wc-mark', '.wk-day.today .chk', '.wk-day.today .wc-mark']);
});
