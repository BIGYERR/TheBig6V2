// The rest sheet (v0.240.0, rulings D228 to D232, docs/decisions/rest-sheet.md): it opens on the athlete's own record
// and never on a prefill, Log writes the face over the type's record, Clear removes it in two taps, a distance alone is
// a record, each sport has its own controls and units, the sentence carries the distance, a future rest day says why,
// a day whose session moved away takes a jog and never a move, a double day edits its jog from the session card, and
// the move sheet says what is already logged.
//
// The app is driven as the athlete drives it (tests/support/log-form.ts): HALF_MANNY (seed 76308) stored as starting
// Monday 2026-09-21; week 1 rests Wednesday (09-23) and Sunday (09-27). The clock is Thursday 2026-09-24 noon unless a
// test says otherwise, so W1 WED has come and W1 SUN and W2 WED have not (hand calendar). The sheet's wheels commit
// through the sheet's own input handler (_restInput), the path a wheel's settle takes. Every expected string is typed
// here from the ruling; nothing is asked of the app.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { fixtures } from '../support/app.ts';
import { logForm } from '../support/log-form.ts';

const C = logForm('rest-sheet');
const HALF = C.build(fixtures.HALF_MANNY);
const J = JSON.stringify;
const THU = () => C.at(1, 'thu');
const WED_JOG = { run: { mins: 30, dist: 3.1, rpe: 5 } };
/** The nine keys a session moved onto a jog day carries, Done untouched (the ruling's double day). */
const SESSION_KEYS = { rpe: '', run_dist: '', run_pace: '', run_mins: '', bike_mins: '', swim_yards: '', notes: '', swapFrom: '', swapTo: '' };

const body = () => C.els.restBody!.innerHTML || '';
const isOpen = () => C.els.restOverlay!.classList.contains('open');
const pick = (re: RegExp) => (body().match(re) || [])[1];
const hiddenOf = (id: string) => pick(new RegExp('id="' + id + '" value="([^"]*)"'));
const title = () => pick(/<div class="ov-title">([^<]*)<\/div>/);
const intro = () => pick(/<div class="ov-intro">([^<]*)<\/div>/);
const logBtn = () => pick(/<button class="ov-apply" id="restLogBtn" onclick="applyRestCardio\(\)">([^<]*)<\/button>/);
const clearBtn = () => pick(/<button class="ov-clear" id="restClearBtn" onclick="clearRestCardio\(\)">([^<]*)<\/button>/);
const typeChips = () => [...body().matchAll(/<div class="rd-chip( sel)?" onclick="_rdType\('(\w+)'\)">([^<]*)<\/div>/g)].map((m) => ({ type: m[2], text: m[3], sel: !!m[1] }));
const rpeSel = () => [...body().matchAll(/<div class="rd-chip wide sel" onclick="_rdRpe\((\d+)\)">/g)].map((m) => +m[1]!);
/** Taps a rendered chip by running its own onclick. */
function tapType(t: string) {
  const on = (body().match(new RegExp('onclick="(_rdType\\(\'' + t + '\'\\))"')) || [])[1];
  assert.ok(on, 'a ' + t + ' chip');
  C.ev(on);
}
function tapRpe(v: number) {
  const on = (body().match(new RegExp('onclick="(_rdRpe\\(' + v + '\\))"')) || [])[1];
  assert.ok(on, 'an RPE ' + v + ' chip');
  C.ev(on);
}
/** A wheel or box committing a value: the sheet's input handler, as a settle's input event reaches it. */
const commit = (id: string, v: string) => C.ev('_restInput({target:{id:' + J(id) + ',value:' + J(v) + '}})');
const log = () => C.ev('applyRestCardio()');
const clear = () => C.ev('clearRestCardio()');
const open = (w: number, d: string, view = 'cardio') => C.ev('openRestSheet(' + w + ",'" + d + "','" + view + "')");
const entry = (w: number, d: string) => C.entry(w, d);
function fresh(at = THU()) {
  C.use(HALF);
  C.setNow(at);
  C.clearToast();
}

test('the sheet opens on nothing on an empty day: zero faces, no chip, Log it, no Clear, no 30 and no RPE 5 (D228)', () => {
  fresh();
  open(1, 'wed');
  assert.ok(isOpen());
  assert.deepEqual([hiddenOf('rest_mins'), hiddenOf('rest_dist'), rpeSel(), logBtn(), clearBtn()], ['', '', [], 'Log it', undefined]);
  assert.deepEqual([title(), intro()], ['What did you do?', 'Easy work on a rest day is recovery, not extra load. This will not touch your program.']);
  assert.ok(!body().includes('max="600"') && !body().includes('max='), 'no ceiling attribute on the sheet');
});

test('Log with nothing on the face writes nothing and keeps the sheet open, and says what to add (D228)', () => {
  fresh();
  const before = C.logs();
  open(1, 'wed');
  log();
  assert.deepEqual([C.logs(), entry(1, 'wed'), C.toast(), isOpen()], [before, null, 'Nothing to log yet. Add a time or a distance.', true]);
  tapType('walk');
  log();
  assert.deepEqual([C.logs(), C.toast(), isOpen()], [before, 'Nothing to log yet. Add a time.', true]);
});

test('the sheet opens on the record: its time, its miles, its chip, a checked type, Logged ✓ and Clear; another type opens empty (D228)', () => {
  fresh();
  C.setLog(1, 'wed', { restLog: WED_JOG, week: 1, ts: C.at(1, 'wed', 9) });
  open(1, 'wed');
  assert.deepEqual([hiddenOf('rest_mins'), hiddenOf('rest_dist'), rpeSel()], ['30', '3.1', [5]]);
  assert.deepEqual(typeChips().find((c) => c.type === 'run'), { type: 'run', text: 'Run ✓', sel: true });
  assert.deepEqual([title(), intro(), logBtn(), clearBtn()],
    ['Your run on Wednesday', 'This is what you logged. Roll it to fix it, or clear it if it did not happen.', 'Logged ✓', 'Clear this run']);
  // a roll makes it Log it
  commit('rest_mins', '12.00');
  assert.equal(C.els.restLogBtn!.textContent, 'Log it');
  tapType('walk');
  assert.deepEqual([title(), hiddenOf('rest_mins'), hiddenOf('rest_dist'), rpeSel(), logBtn(), clearBtn()], ['What did you do?', '', undefined, [], 'Log it', undefined]);
});

test('Log writes the face over the record, never a sum; a second Log with the face unchanged writes nothing (D228)', () => {
  fresh();
  C.setLog(1, 'wed', { restLog: WED_JOG, week: 1, ts: C.at(1, 'wed', 9) });
  open(1, 'wed');
  commit('rest_mins', '12.00');
  commit('rest_dist', '1.00');
  log();
  assert.equal(J(entry(1, 'wed').restLog), J({ run: { mins: 12, dist: 1, rpe: 5 } }));
  assert.deepEqual([C.toast(), isOpen()], ['12 min run logged ✓', false]);
  const after = C.logs();
  C.clearToast();
  log();
  assert.deepEqual([C.logs(), C.toast()], [after, ''], 'the second call is inert');
  // Logged ✓ tapped on a reopened, unchanged record closes and writes nothing
  open(1, 'wed');
  assert.equal(logBtn(), 'Logged ✓');
  log();
  assert.deepEqual([C.logs(), C.toast(), isOpen()], [after, '', false]);
});

test('the RPE is kept unless a chip changes it; a chip tapped off removes it; no chip stores no RPE (D228)', () => {
  fresh();
  C.setLog(1, 'wed', { restLog: WED_JOG, week: 1, ts: C.at(1, 'wed', 9) });
  open(1, 'wed');
  commit('rest_mins', '40.00');
  log();
  assert.equal(J(entry(1, 'wed').restLog.run), J({ mins: 40, dist: 3.1, rpe: 5 }));
  open(1, 'wed');
  tapRpe(5);
  assert.deepEqual([rpeSel(), logBtn()], [[], 'Log it']);
  log();
  assert.equal(J(entry(1, 'wed').restLog.run), J({ mins: 40, dist: 3.1 }));
  fresh();
  open(1, 'wed');
  commit('rest_mins', '20.00');
  log();
  assert.equal(J(entry(1, 'wed').restLog), J({ run: { mins: 20 } }));
});

test('Clear takes two taps and removes only the type: the day key goes when nothing else is left, and a session\'s keys stay byte for byte (D228)', () => {
  // (a) a pure rest day, run only
  fresh();
  C.setLog(1, 'wed', { restLog: WED_JOG, week: 1, ts: C.at(1, 'wed', 9) });
  const planted = C.logs();
  open(1, 'wed');
  clear();
  assert.deepEqual([C.els.restClearBtn!.textContent, C.logs(), isOpen()], ['Tap again to clear', planted, true], 'the first tap only arms it');
  clear();
  assert.deepEqual([entry(1, 'wed'), 'w1_wed' in JSON.parse(C.logs()), C.toast(), isOpen()], [null, false, 'Run cleared', false]);
  // (b) run and walk: the walk stays whole
  fresh();
  C.setLog(1, 'wed', { restLog: { run: { mins: 30, dist: 3.1, rpe: 5 }, walk: { mins: 20, rpe: 5 } }, week: 1, ts: C.at(1, 'wed', 9) });
  open(1, 'wed');
  clear(); clear();
  assert.equal(J(entry(1, 'wed').restLog), J({ walk: { mins: 20, rpe: 5 } }));
  // (c) a double day: the key and the session's nine keys stay, the jog goes
  fresh();
  C.setLog(1, 'wed', { ...SESSION_KEYS, restLog: WED_JOG, week: 1, ts: C.at(1, 'wed', 9) });
  open(1, 'wed');
  clear(); clear();
  const e = entry(1, 'wed');
  assert.ok(e && !('restLog' in e));
  assert.equal(J(Object.fromEntries(Object.keys(SESSION_KEYS).map((k) => [k, e[k]]))), J(SESSION_KEYS));
  // an armed Clear does not survive a close: reopened, it reads Clear again
  fresh();
  C.setLog(1, 'wed', { restLog: WED_JOG, week: 1, ts: C.at(1, 'wed', 9) });
  open(1, 'wed');
  clear();
  C.ev('closeRestSheet()');
  open(1, 'wed');
  assert.equal(clearBtn(), 'Clear this run');
});

test('a record above the time wheel\'s ceiling opens as Logged ✓ on its stored value and is never rewritten by a look (D228)', () => {
  fresh();
  C.setLog(1, 'wed', { restLog: { run: { mins: 800 } }, week: 1, ts: C.at(1, 'wed', 9) });
  const planted = C.logs();
  open(1, 'wed');
  assert.deepEqual([hiddenOf('rest_mins'), logBtn(), J(C.ev("_iawParse('hms','800')"))], ['800', 'Logged ✓', J(['9', '59', '59'])]);
  log();
  assert.equal(C.logs(), planted);
});

test('a distance alone is a record, and the hero and the toast print it (D229)', () => {
  fresh(C.at(1, 'wed'));
  open(1, 'wed');
  commit('rest_dist', '3.10');
  log();
  assert.equal(J(entry(1, 'wed').restLog), J({ run: { dist: 3.1 } }));
  assert.equal(C.toast(), '3.1 mi run logged ✓');
  C.ev('currentWeek=1; renderWeekView()');
  assert.ok((C.els.daysList!.innerHTML || '').includes('<div class="wk-rest-logged">3.1 mi run logged · RPE —</div>'));
});

test('the sentence names what each record holds, in key order, with whole minutes and the sport\'s unit (D229)', () => {
  fresh();
  const T: [object, string[]][] = [
    [{ run: { mins: 30, dist: 3.1, rpe: 5 } }, ['30 min run logged · 3.1 mi · RPE 5']],
    [{ run: { mins: 30, rpe: 5 } }, ['30 min run logged · RPE 5']],
    [{ run: { dist: 3.1, rpe: 7 } }, ['3.1 mi run logged · RPE 7']],
    [{ run: { mins: 37.47 } }, ['37 min run logged · RPE —']],
    [{ bike: { mins: 45, dist: 12, rpe: 5 } }, ['45 min ride logged · 12 mi · RPE 5']],
    [{ swim: { mins: 20, dist: 1500, rpe: 5 } }, ['20 min swim logged · 1500 yd · RPE 5']],
    [{ row: { mins: 20, dist: 5000 } }, ['20 min row logged · 5000 m · RPE —']],
    [{ walk: { mins: 30, rpe: 7 } }, ['30 min walk logged · RPE 7']],
    [{}, []],
    [{ run: { dist: 3.7 }, swim: { mins: 20, dist: 500, rpe: 5 } }, ['3.7 mi run logged · RPE —', '20 min swim logged · 500 yd · RPE 5']],
  ];
  for (const [rl, want] of T) assert.deepEqual(C.ev('restLogLines(' + J(rl) + ')'), want, J(rl));
});

test('each sport has its own controls on the sheet\'s own ids: wheels for run and bike, a meters box for row, a yards box for swim, time alone for walk (D229)', () => {
  fresh();
  open(1, 'wed');
  const shape = (t: string) => {
    C.ev("_rdType('" + t + "')");
    const b = body();
    return {
      hms: b.includes('<div class="iaw" data-kind="hms" data-for="rest_mins">'),
      distWheel: b.includes('<div class="iaw" data-kind="dist" data-for="rest_dist">'),
      box: (b.match(/<input class="rd-input"[^>]*id="rest_dist"[^>]*>/) || [''])[0],
      caps: [...b.matchAll(/<div class="iaw-cap">([^<]*)<\/div>/g)].map((m) => m[1]),
      lbls: [...b.matchAll(/<div class="ov-eq-lbl"[^>]*>([^<]*)<\/div>/g)].map((m) => m[1]).filter((l) => /Time|Distance/.test(l!)),
      cardIds: /log_run_(mins|dist)/.test(b),
      optional: b.includes('optional'),
    };
  };
  for (const t of ['run', 'bike']) {
    const s = shape(t);
    assert.deepEqual([s.hms, s.distWheel, s.box, s.caps, s.lbls, s.cardIds, s.optional], [true, true, '', ['Time', 'Miles'], ['Time', 'Distance'], false, false], t);
  }
  const row = shape('row');
  assert.deepEqual([row.hms, row.distWheel, row.lbls], [true, false, ['Time', 'Distance (meters)']]);
  assert.ok(row.box.includes('placeholder="meters"') && row.box.includes('inputmode="numeric"') && !row.box.includes('step='), row.box);
  const swim = shape('swim');
  assert.deepEqual([swim.hms, swim.distWheel, swim.lbls], [true, false, ['Time', 'Distance (yards)']]);
  assert.ok(swim.box.includes('step="25"') && swim.box.includes('placeholder="yards"') && !swim.box.includes('step="0.1"'), swim.box);
  const walk = shape('walk');
  assert.deepEqual([walk.hms, walk.distWheel, walk.box, walk.lbls], [true, false, '', ['Time']]);
});

test('each sport stores its distance in its own unit, and walk never stores one (D229)', () => {
  const cases: [string, string | null, string, object][] = [
    ['swim', '20.00', '1500', { mins: 20, dist: 1500 }],
    ['row', '20.00', '5000', { mins: 20, dist: 5000 }],
    ['bike', '45.00', '12.00', { mins: 45, dist: 12 }],
    ['walk', '20.00', '2', { mins: 20 }],
  ];
  for (const [t, mins, dist, want] of cases) {
    fresh();
    open(1, 'wed');
    C.ev("_rdType('" + t + "')");
    if (mins) commit('rest_mins', mins);
    commit('rest_dist', dist);
    log();
    assert.equal(J(entry(1, 'wed').restLog[t]), J(want), t);
  }
});

test('a future rest day says it has not come yet, and opens nothing; a past one opens the menu (D231)', () => {
  fresh();
  C.ev('currentWeek=1; openDayKey("sun")');
  assert.deepEqual([C.toast(), isOpen()], ['That rest day has not come around yet', false]);
  C.clearToast();
  C.ev('currentWeek=2; openDayKey("wed")');
  assert.deepEqual([C.toast(), isOpen()], ['That rest day has not come around yet', false]);
  C.ev('currentWeek=1; openDayKey("wed")');
  assert.deepEqual([isOpen(), title()], [true, 'Not resting?']);
});

test('a day whose session moved away takes a jog and never a move (D231)', () => {
  fresh();
  // move Thursday's session onto Wednesday
  open(1, 'wed', 'move');
  C.ev("_rdSet('pick','thu')");
  C.ev('applyRestMove()');
  assert.equal(C.ev('activeProg.weeks[1].thu.moved'), true);
  C.ev('currentWeek=1; renderWeekView()');
  const hero = C.els.daysList!.innerHTML || '';
  assert.ok(hero.includes('Rest day') && !hero.includes('Training anyway?') && hero.includes("openRestSheet(1,'thu','cardio')\">Log cardio</button>"), 'the hero offers the jog only');
  C.ev('openDayKey("thu")');
  assert.deepEqual([isOpen(), pick(/<div class="ov-kicker">([^<]*)<\/div>/), body().includes('Train a session here')], [true, 'Thursday · Log cardio', false]);
  commit('rest_mins', '20.00');
  log();
  assert.equal(J(entry(1, 'thu').restLog), J({ run: { mins: 20 } }));
  const cands = (C.ev('restMoveCandidates(1)') as { day: string }[]).map((c) => c.day);
  assert.ok(!cands.includes('thu') && !cands.includes('wed'), J(cands));
});

test('a double day\'s session card shows the jog and edits it in the rest sheet; a day with no jog shows no block (D231)', () => {
  fresh();
  C.setLog(1, 'wed', { ...SESSION_KEYS, restLog: WED_JOG, week: 1, ts: C.at(1, 'wed', 9) });
  // Tuesday's session moved onto Wednesday over the jog
  C.ev("var __mv=getRestMoves(); __mv['w1_wed']={from:'tue',ts:1}; saveRestMoves(__mv); applyRestDayMoves(activeProg,__mv);");
  assert.equal(C.ev('activeProg.weeks[1].wed.movedFrom'), 'tue');
  C.ev("currentWeek=1; openDetail('wed', activeProg.weeks[1].wed); document.getElementById('detailOverlay').classList.add('open')");
  const card = C.els.detailBody!.innerHTML || '';
  assert.ok(card.startsWith('<div class="also-block"><div class="also-lbl">Also on Wednesday</div><div class="also-line">30 min run logged · 3.1 mi · RPE 5</div>'), card.slice(0, 200));
  const on = (card.match(/<button class="also-btn" onclick="([^"]*)">Edit cardio<\/button>/) || [])[1];
  assert.equal(on, "openRestSheet(1,'wed','cardio')");
  C.ev(on!);
  assert.deepEqual([isOpen(), title(), body().includes('Not resting?')], [true, 'Your run on Wednesday', false]);
  commit('rest_mins', '25.00');
  log();
  const e = entry(1, 'wed');
  assert.equal(e.restLog.run.mins, 25);
  assert.equal(J(Object.fromEntries(Object.keys(SESSION_KEYS).map((k) => [k, e[k]]))), J(SESSION_KEYS));
  // the card re-rendered with the new sentence
  assert.ok((C.els.detailBody!.innerHTML || '').includes('<div class="also-line">25 min run logged · 3.1 mi · RPE 5</div>'));
  // guard: Monday's card, no jog, no block
  C.ev("openDetail('mon', activeProg.weeks[1].mon)");
  assert.ok(!(C.els.detailBody!.innerHTML || '').includes('also-block'));
});

test('the move sheet says what is already logged on the day; without a jog it says nothing new (D232)', () => {
  fresh();
  open(1, 'wed', 'move');
  const plain = body();
  assert.ok(!plain.includes('Already logged here'));
  C.setLog(1, 'wed', { restLog: WED_JOG, week: 1, ts: C.at(1, 'wed', 9) });
  open(1, 'wed', 'move');
  const b = body();
  assert.ok(b.includes('<div class="ov-effect"><div class="ov-effect-ttl">Already logged here</div><div class="ov-effect-sub">30 min run · 3.1 mi · RPE 5<br>Move a session in and Wednesday is a double day. Your call.</div></div><div class="ov-eq-lbl">Not logged this week</div>'), b);
  assert.equal(b.replace(/<div class="ov-effect"><div class="ov-effect-ttl">Already logged here[\s\S]*?<\/div><\/div>/, ''), plain, 'the rest of the sheet is as before');
});
