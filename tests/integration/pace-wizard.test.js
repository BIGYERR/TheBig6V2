'use strict';
// The wizard's cardio goal step for a run goal: the program length header, the race-date card, the pace line and the
// feasibility frame, and the mile field.
//   D183 (P-SAFEPACE): the goal is the athlete's; the coach says what the block reaches from his mile ("In N weeks that
//     reaches about ..."), with no "Use this pace" button; one repaint runs in the same tick (no 80 ms timer); the
//     header and the card read one week number; "In N weeks" is the header's N; km and swim units read through.
//   D188: a beginner sees the mile field and the advisory slot; his entered mile reaches the feasibility frame.
//   D189: the mile field's helper says what a blank means; a required blank mile leaves the header asking for it and
//     the feasibility frame empty; the over-25:00 string asks for a check.
// The D183 rows run twice, under TZ=America/New_York and TZ=UTC: 21:16 in New York is 01:16 UTC the next day, so a UTC
// date parse shows as a wrong day. Each zone boots its own app with the clock pinned to 2026-09-22 21:16 local, the
// evening Mario reported it.
//
// Oracles, never asked of the app: Monday-week arithmetic by Date.UTC; the R1 inversion typed from the ruling (the rate
// {3,3,2} s/mi/wk, the age scalers, the defaults 690/570/450, "undo the +1 grace, the age multiplier and raw x 1.25 + 4",
// the 45 s/mi tolerance, 0.621 mi per km); coach's sentences, typed verbatim.
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { fixtures } = require('../support/app.js');
const { loadAppAt, stripComments } = require('../support/pace-clock.js');
const { wizardRig, txt } = require('../support/pace-wizard.js');

const J = (v) => JSON.stringify(v);
const RD = Date;
const ymd = (s) => s.split('-').map(Number);
const dayNo = (iso) => {
  const [y, m, d] = ymd(iso);
  return RD.UTC(y, m - 1, d) / 864e5;
};
const dow = (iso) => {
  const [y, m, d] = ymd(iso);
  return new RD(RD.UTC(y, m - 1, d)).getUTCDay();
};
const monNo = (iso) => dayNo(iso) - ((dow(iso) + 6) % 7);
const WD3 = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MON3 = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
/** The program week holding the test (week 1 holds the start); null when the test falls before the start. */
const handWeek = (startIso, testIso) => (dayNo(testIso) < dayNo(startIso) ? null : (monNo(testIso) - monNo(startIso)) / 7 + 1);
const handWeeksUntil = (todayIso, testIso) => Math.floor((dayNo(testIso) - dayNo(todayIso)) / 7);
const clk = (sec) => {
  const t = Math.round(sec);
  return Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0');
};
const IMPROVE = { beginner: 3, intermediate: 3, advanced: 2 };
const AGE_SCALE = { '18-35': 1.0, '36-54': 0.85, '55+': 0.65 };
const DEFAULT_MILE = { beginner: 690, intermediate: 570, advanced: 450 };
const TOLERANCE = 45;
const KM_MI = 0.621;
/** R1 inverted, typed from the ruling, for 18-35 (age multiplier 1.0). */
function handReach(L, exp, mileSecs, dist, unit, goalSecs) {
  const cur = mileSecs || DEFAULT_MILE[exp];
  const improvingWeeks = Math.max(0, ((L - 1) / 1.0 - 4) / 1.25);
  const ach = cur - improvingWeeks * +(IMPROVE[exp] * AGE_SCALE['18-35']).toFixed(2);
  const mi = unit === 'km' ? dist * KM_MI : dist;
  const tPace = goalSecs / mi;
  return { L, cur, ach, total: ach * mi, gap: ach - tPace, shows: tPace < cur && ach - tPace >= TOLERANCE, fromMile: !!mileSecs, exp, distLabel: dist + ' ' + unit, goalSecs };
}
const wk = (L) => L + (L === 1 ? ' week' : ' weeks');
function handSentence(r) {
  const reach = ' In ' + wk(r.L) + ' that reaches about ' + r.distLabel + ' in ' + clk(r.total) + '. Your goal is ' + clk(r.goalSecs) + '.';
  if (r.fromMile) return 'Your mile is ' + clk(r.cur) + '.' + reach + ' Keep it or change it above.';
  return 'You have not entered a mile time. The ' + r.exp + ' default is ' + clk(r.cur) + ' per mile.' + reach + ' Enter your mile above and this updates.';
}
const V = {
  S1: 'Your mile is 8:00. In 5 weeks that reaches about 1.5 mi in 12:00. Your goal is 10:30. Keep it or change it above.',
  S2: 'You have not entered a mile time. The intermediate default is 9:30 per mile. In 5 weeks that reaches about 1.5 mi in 14:15. Your goal is 12:00. Enter your mile above and this updates.',
  S3: 'You have not entered a mile time. The beginner default is 11:30 per mile. In 5 weeks that reaches about 1.5 mi in 17:15. Your goal is 12:00. Enter your mile above and this updates.',
  A2: 'Your mile is 8:00. In 11 weeks that reaches about 1.5 mi in 11:38. Your goal is 9:30. Keep it or change it above.',
  A3: 'You have not entered a mile time. The intermediate default is 9:30 per mile. In 11 weeks that reaches about 1.5 mi in 13:53. Your goal is 10:30. Enter your mile above and this updates.',
  A4: 'You have not entered a mile time. The beginner default is 11:30 per mile. In 11 weeks that reaches about 1.5 mi in 16:53. Your goal is 12:00. Enter your mile above and this updates.',
};
const CARD_TW = (w) => 'Your test is in week ' + w + '. The program ends on it. The taper lands in front of it.';
const CARD_TW1 = 'Your test is this week. You get the test week only. Primer lifts, a shakeout, then the test.';
const CARD_NULL = 'Your test is before your first training day. This program starts after it and does not include it.';
const HDR_TEST = (n) => 'Program length: ' + wk(n) + '. Your test sets it.';
const HDR_GOAL = (n) => 'Program length: ' + wk(n) + '. Set by your longest cardio goal and your experience.';
const REACH = 'that reaches about';
const TODAY = '2026-09-22';
const TEST = '2026-10-20';
const TEST_TW1 = '2026-09-25';
const START_AFTER = '2026-10-26';
const RED_PAST = 'That date has already passed.';
const RED_WEEK = 'Less than a week away. Not enough time to train.';
const dashHits = (t) => String(t).match(/—| - /g) || [];
const svgN = (h) => (String(h || '').match(/<svg\b/g) || []).length;
const framed = (h) => /padding:9px 11px/.test(String(h || ''));

// ── The oracles and the predicates, zone free ──
test('the hand oracles reproduce the ruling\'s printed numbers and coach\'s sentences', () => {
  const WEEKDAYS = { '2026-09-21': 'Mon', '2026-09-22': 'Tue', '2026-09-25': 'Fri', '2026-10-19': 'Mon', '2026-10-20': 'Tue', '2026-10-26': 'Mon' };
  for (const [iso, w] of Object.entries(WEEKDAYS)) assert.equal(WD3[dow(iso)], w, iso);
  assert.equal(handWeek(TODAY, TEST), 5, 'Mon Sep 21 to Mon Oct 19 is 4 weeks: the test is in week 5');
  assert.equal(handWeeksUntil(TODAY, TEST), 4);
  assert.equal(handWeek(TODAY, TEST_TW1), 1);
  assert.equal(handWeek(START_AFTER, TEST), null);
  const r1 = handReach(5, 'intermediate', 480, 1.5, 'mi', 630);
  assert.deepEqual([clk(r1.total), Math.round(r1.gap), handSentence(r1)], ['12:00', 60, V.S1]);
  const r2 = handReach(5, 'intermediate', null, 1.5, 'mi', 720);
  assert.deepEqual([clk(r2.total), Math.round(r2.gap), handSentence(r2)], ['14:15', 90, V.S2]);
  const r3 = handReach(5, 'beginner', null, 1.5, 'mi', 720);
  assert.deepEqual([clk(r3.total), Math.round(r3.gap), handSentence(r3)], ['17:15', 210, V.S3]);
  const r3m = handReach(5, 'beginner', 480, 1.5, 'mi', 720);
  assert.deepEqual([clk(r3m.total), r3m.shows], ['12:00', false], 'a beginner 8:00 mile is read and shows no gap at a 12:00 goal');
  assert.equal(clk(handReach(1, 'intermediate', 480, 1.5, 'mi', 630).total), '12:00');
  assert.equal(clk(handReach(12, 'intermediate', 480, 1.5, 'mi', 570).total), '11:35');
  const a2 = handReach(11, 'intermediate', 480, 1.5, 'mi', 570);
  const a3 = handReach(11, 'intermediate', null, 1.5, 'mi', 630);
  const a4 = handReach(11, 'beginner', null, 1.5, 'mi', 720);
  assert.deepEqual([clk(a2.total), handSentence(a2)], ['11:38', V.A2]);
  assert.deepEqual([clk(a3.total), handSentence(a3)], ['13:53', V.A3]);
  assert.deepEqual([clk(a4.total), handSentence(a4)], ['16:53', V.A4]);
  assert.equal([a2, a3, a4].map((r) => Math.round(r.total)).join('/'), '698/833/1013');
  assert.equal(handReach(5, 'intermediate', 480, 1.5, 'mi', 720).shows, false, 'Mario at a 12:00 goal shows no gap');
  assert.equal(clk(720 / (2 * KM_MI)), '9:40', '2 km in 12:00');
  assert.equal(clk(420 / (500 / 100)), '1:24', '500 yd in 7:00');
});

test('the dash predicate trips typed dashes and passes compound numerals and en dash ranges', () => {
  const CASES = [
    ['Program length: 6 weeks — based on your longest cardio goal', 1],
    ['Tap to open calendar - the final weeks taper', 1],
    ['12:00 — 8:00/mi per mile', 1],
    ['Your 6-week program peaks on race day.', 0],
    ['Weeks 1–3 are behind you. 30–45 minutes.', 0],
  ];
  for (const [s, w] of CASES) assert.equal(dashHits(s).length, w, s);
});

// ── The mile field and the feasibility frame (D188 G4 and G1f, D189 G8), on the evening of 2026-09-22 ──
const G = loadAppAt(new Date(2026, 8, 22, 21, 16, 0));
const gEls = new Map();
{
  const mk = G.window.document.createElement;
  G.window.document.getElementById = (id) => {
    if (!gEls.has(id)) gEls.set(id, Object.assign(mk('div'), { id }));
    return gEls.get(id);
  };
  G.eval('showToast = function(){}');
}
const G_BOOT_WD = G.eval('JSON.stringify(WD)');
const goalObj = (goal, mile) => {
  const g = { id: goal, label: goal, baselineDist: '', baseline: '' };
  if (goal === 'run_pace_goal') Object.assign(g, { targetDist: '1.5', paceUnit: 'mi', targetMins: '12', targetSecs: '0' });
  if (mile) Object.assign(g, { mileBestMins: String(Math.floor(mile / 60)), mileBestSecs: String(mile % 60), mileBestSrc: { kind: 'entered' } });
  return g;
};
const gTxt = (h) => String(h || '').replace(/<svg[\s\S]*?<\/svg>/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').replace(/ ([,.;])/g, '$1').trim();
function wiz(goal, exp, mile) {
  const wd = Object.assign(JSON.parse(G_BOOT_WD), {
    name: 'M', primaryPath: 'hybrid', cardioTypes: ['run'], liftingFocus: 'balanced', experience: exp, ageBracket: '18-35', equipment: 'crossfit', unit: 'lbs',
    restDays: ['sun', 'wed'], eventTargeted: false, raceDate: '', seed: 1000,
  });
  wd.cardioGoals = { run: goalObj(goal, mile) };
  G.window.__WDX = wd;
  G.eval('WD = JSON.parse(JSON.stringify(__WDX))');
  gEls.clear();
  G.eval('wizardStep = WIZARD_STEPS.indexOf("cardio_goal"); renderWizardStep(); updateRaceDateFeedback()');
  const body = String((gEls.get('wizardBody') || {}).innerHTML || '');
  const labels = [...body.matchAll(/<div class="input-label">Current mile time <span[^>]*>([^<]*)<\/span><\/div>/g)].map((m) => m[1]);
  const tpl = /<span id="progLenLine">([\s\S]*?)<\/span>/.exec(body);
  const pl = gEls.get('progLenLine');
  const pf = gEls.get('paceFeasLine');
  const adv = /<div id="mileAdvisory" style="[^"]*">([^<]*)<\/div>/.exec(body);
  return {
    body, labels, hdrTpl: tpl ? gTxt(tpl[1]) : null, hdrPaint: pl ? gTxt(pl.innerHTML) : null, hasFeasNode: /id="paceFeasLine"/.test(body),
    feasShown: !!pf && pf.style.display === 'block', feas: pf ? (pf.style.display === 'none' ? '' : gTxt(pf.innerHTML)) : '', adv: adv ? adv[1] : null,
  };
}
const SEEN = []; // athlete-facing strings the mile field tests assert, for the copy test
const keep = (s) => typeof s === 'string' && s && SEEN.push(s);
const HELP_REQ = 'Required. Your paces and your program length start from it.';
const HELP_OPT = {
  beginner: 'Optional. Leave it blank and your paces come from an 11:30 mile, the beginner default. Enter a mile only if you have timed one.',
  intermediate: 'Optional. Leave it blank and your paces come from a 9:30 mile, the intermediate default. Enter a mile only if you have timed one.',
  advanced: 'Optional. Leave it blank and your paces come from a 7:30 mile, the advanced default. Enter a mile only if you have timed one.',
};
const HDR_BLANK = 'Program length: your mile time sets it. Enter your current mile time and the length appears.';
const HDR_NUM = /^Program length: \d+ weeks?\. Set by your longest cardio goal and your experience\.$/;

test('a beginner sees the "Current mile time" field and its advisory slot on every run goal', () => {
  for (const goal of ['run_pace_goal', 'run_5k', 'run_10k', 'run_half', 'run_base']) {
    const w = wiz(goal, 'beginner', 0);
    assert.ok(w.body.length > 0, goal);
    assert.equal(w.body.split('Current mile time').length - 1, 1, `${goal}: the field`);
    assert.equal(w.body.split('id="mileAdvisory"').length - 1, 1, `${goal}: the advisory slot`);
  }
});

test('the mile field\'s helper says required on an intermediate or advanced pace goal, and names the level default everywhere else', () => {
  for (const goal of ['run_5k', 'run_half', 'run_pace_goal', 'run_base'])
    for (const exp of ['beginner', 'intermediate', 'advanced']) {
      const w = wiz(goal, exp, 0);
      const want = goal === 'run_pace_goal' && exp !== 'beginner' ? HELP_REQ : HELP_OPT[exp];
      assert.deepEqual(w.labels, [want], `${goal}|${exp}`);
      w.labels.forEach(keep);
    }
});

test('a mile over 25:00 asks for a check, in the validator and in the advisory under the field', () => {
  const OVER = 'Over 25:00 reads as a walk, not a run. Check the entry.';
  for (const exp of ['intermediate', 'advanced']) {
    const r = G.eval('_mileEntryState')({ mileBestMins: '26', mileBestSecs: '0' }, exp);
    assert.deepEqual([r.ok, r.msg], [false, OVER], exp);
    assert.equal(wiz('run_5k', exp, 1560).adv, OVER, `${exp}: #mileAdvisory`);
  }
  keep(OVER);
});

test('a blank mile on an intermediate or advanced pace goal leaves the header asking for it and the feasibility frame empty', () => {
  for (const exp of ['intermediate', 'advanced']) {
    const w = wiz('run_pace_goal', exp, 0);
    assert.equal(w.hdrTpl, HDR_BLANK, `${exp}: the header as rendered`);
    assert.equal(w.hdrPaint, HDR_BLANK, `${exp}: the header as repainted`);
    assert.ok(w.hasFeasNode, `${exp}: the frame is on the step`);
    assert.equal(w.feas, '', `${exp}: the frame is empty`);
    keep(w.hdrTpl);
  }
});

test('a 9:00 mile on an intermediate or advanced pace goal reads "Your mile is 9:00." with a numeric header', () => {
  for (const exp of ['intermediate', 'advanced']) {
    const w = wiz('run_pace_goal', exp, 540);
    assert.ok(w.feas.startsWith('Your mile is 9:00.') && w.feas.endsWith(' Keep it or change it above.'), `${exp}: ${w.feas}`);
    assert.match(w.hdrTpl || '', HDR_NUM);
    assert.match(w.hdrPaint || '', HDR_NUM);
    keep(w.feas);
    keep(w.hdrPaint);
  }
});

test('a beginner pace goal with no mile takes the generic feasibility form from the beginner default', () => {
  const w = wiz('run_pace_goal', 'beginner', 0);
  assert.ok(w.feas.startsWith('You have not entered a mile time. The beginner default is 11:30 per mile.'), w.feas);
  keep(w.feas);
});

test('a beginner\'s 9:00 mile reaches the undated feasibility frame: 1.5 mi in 10:30 reads his mile and 13:08 in 11 weeks', () => {
  // 540 - ((11 - 1) / 1.0 - 4) / 1.25 x 3 = 540 - 4.8 x 3 = 525.6 s/mi; x 1.5 = 788.4 s = 13:08.
  const wd = Object.assign(JSON.parse(G_BOOT_WD), {
    experience: 'beginner', ageBracket: '18-35', primaryPath: 'hybrid', cardioTypes: ['run'], eventTargeted: false, raceDate: '', name: 'G226',
    liftingFocus: 'balanced', equipment: 'crossfit', unit: 'lbs', restDays: ['sun', 'wed'], seed: 1000,
    cardioGoals: { run: { id: 'run_pace_goal', label: 'x', targetDist: '1.5', paceUnit: 'mi', targetMins: '10', targetSecs: '30', mileBestMins: '9', mileBestSecs: '0', mileBestSrc: { kind: 'entered' } } },
  });
  G.window.__WDX = wd;
  G.eval('WD = JSON.parse(JSON.stringify(__WDX)); activeProg = null;');
  gEls.clear();
  G.eval('wizardStep = WIZARD_STEPS.indexOf("cardio_goal"); renderWizardStep(); updateRaceDateFeedback();');
  const pf = gEls.get('paceFeasLine');
  assert.ok(pf && pf.style.display === 'block', 'the frame is shown');
  const s = String(pf.innerHTML || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  assert.equal(s, 'Your mile is 9:00. In 11 weeks that reaches about 1.5 mi in 13:08. Your goal is 10:30. Keep it or change it above.');
  keep(s);
});

test('every mile field string asserted above carries no mid-sentence dash and no Nike', () => {
  assert.ok(SEEN.length >= 15, `strings collected (${SEEN.length})`);
  assert.deepEqual(SEEN.filter((s) => /\w\s?[-–—]\s?\w/.test(s) || /nike/i.test(s)), []);
});

// ── D183, once per time zone ──
const SRC = stripComments(G.js);

test('the button is gone: no applySuggestedPace, achievablePacePerMile, secsToMMSS or "Use this pace" in the source', () => {
  for (const tok of ['applySuggestedPace', 'achievablePacePerMile', 'secsToMMSS', 'Use this pace']) assert.equal(SRC.split(tok).length - 1, 0, tok);
});

test('one repaint, one caller each: updatePaceFeasibility, updatePaceDisplay and assessRunPaceCeiling once, updateRaceDateFeedback 13 times', () => {
  const calls = (nm) => (SRC.match(new RegExp('\\b' + nm + '\\s*\\(', 'g')) || []).length - (SRC.match(new RegExp('\\bfunction\\s+' + nm + '\\s*\\(', 'g')) || []).length;
  assert.deepEqual(
    ['updatePaceFeasibility', 'updatePaceDisplay', 'assessRunPaceCeiling', 'updateRaceDateFeedback'].map(calls),
    [1, 1, 1, 13],
  );
});

const SYSTEM_TZ = process.env.TZ;
for (const [tag, tz] of [['NY', 'America/New_York'], ['UTC', 'UTC']]) {
  describe(`[${tag}] the cardio goal step under TZ=${tz}`, () => {
    let IA;
    let W;
    let BOOT_WD;
    const STATES = [];
    before(() => {
      process.env.TZ = tz;
      IA = loadAppAt(new Date(2026, 8, 22, 21, 16, 0));
      W = wizardRig(IA);
      BOOT_WD = IA.eval('JSON.stringify(WD)');
    });
    after(() => {
      if (SYSTEM_TZ === undefined) delete process.env.TZ;
      else process.env.TZ = SYSTEM_TZ;
    });
    const BASE = { primaryPath: 'event', cardioTypes: ['run'], experience: 'intermediate', ageBracket: '18-35', eventTargeted: true, raceDate: TEST, liftingFocus: 'support_prevention', equipment: 'crossfit', restDays: ['sun', 'wed'], unit: 'lbs', seed: 4242, name: 'M', startDate: TODAY };
    const mileOf = (s) => ({ mileBestMins: String(Math.floor(s / 60)), mileBestSecs: String(s % 60).padStart(2, '0') });
    const goalOf = (s) => ({ targetMins: String(Math.floor(s / 60)), targetSecs: String(s % 60).padStart(2, '0'), targetTime: clk(s) });
    const runGoal = (o) => Object.assign({ id: 'run_pace_goal', label: 'Hit a Pace / Time Goal', targetDist: '1.5', paceUnit: 'mi' }, o || {});
    const setWD = (over, run) => {
      const wd = Object.assign(JSON.parse(BOOT_WD), BASE, over || {});
      wd.cardioGoals = { run: runGoal(run) };
      IA.eval('WD = ' + JSON.stringify(wd) + ';');
    };
    const setWDg = (over, goals) => {
      const wd = Object.assign(JSON.parse(BOOT_WD), BASE, over || {});
      wd.cardioGoals = JSON.parse(JSON.stringify(goals));
      IA.eval('WD = ' + JSON.stringify(wd) + ';');
    };
    const cardCase = (over, run) => {
      setWD(over, run);
      W.renderStep('cardio_goal', true);
      return W.screen();
    };
    const snap = (label, fam) => {
      const adv = W.reg.get('mileAdvisory');
      STATES.push({ label, fam, text: W.sweepText(), card: W.liveNode('raceDateFeedback'), feas: W.liveNode('paceFeasLine'), adv: adv ? String(adv.textContent || '') : '' });
    };
    const expectCard = (s, color, text, header) => {
      assert.equal(s.cardColor, color, 'card colour');
      assert.equal(s.cardText, text);
      if (header !== undefined) assert.equal(s.header, header);
    };
    const hdrN = (h) => {
      const m = /Program length: (\d+) weeks?/.exec(h || '');
      return m ? +m[1] : null;
    };
    const addDays = (iso, k) => new RD((dayNo(iso) + k) * 864e5).toISOString().slice(0, 10);
    const BIKE = { bike: { id: 'bike_century', label: 'Century Ride (100mi)' } };
    const U = { eventTargeted: false, raceDate: '' };
    const W5 = 5;

    test('the zone is the one asked for and the app\'s clock reads 2026-09-22 21:16', () => {
      const off = (y, m, d) => new RD(y, m - 1, d, 12).getTimezoneOffset();
      assert.deepEqual([off(2026, 9, 22), off(2026, 12, 1)], tag === 'NY' ? [240, 300] : [0, 0]);
      assert.equal(IA.eval('(function(){ const d = new Date(); return [d.getFullYear(), d.getMonth() + 1, d.getDate(), d.getHours(), d.getMinutes(), Date.now() === d.getTime()].join(","); })()'), '2026,9,22,21,16,true');
    });

    test('one render of Mario\'s dated step paints the header, the card and the pace line in the same tick and queues no timer', () => {
      setWD({}, Object.assign(mileOf(480), goalOf(720)));
      W.drain();
      W.reg.clear();
      W.seed();
      IA.eval('wizardStep = WIZARD_STEPS.indexOf("cardio_goal"); renderWizardStep();');
      for (const id of ['progLenLine', 'raceDateFeedback', 'paceDisplayLine']) {
        assert.ok(W.inBody(id), `#${id} is in the step`);
        assert.ok(W.painted(id), `#${id} is painted before any timer runs`);
      }
      assert.equal(IA.flushTimers(), 0, 'the render queued no timer');
      const src = stripComments(IA.js);
      assert.equal((src.match(/updateRaceDateFeedback\(?\)?\s*,\s*80\s*\)/g) || []).length, 0, 'no 80 ms timer');
      assert.equal((src.match(/setTimeout\(\s*(?:\(\s*\)\s*=>\s*)?updateRaceDateFeedback\b/g) || []).length, 0, 'no timed updateRaceDateFeedback');
    });

    test('168 edits of the mile and goal fields, then the date: the header and the card both say week 5, no red, no Recommended, no button', () => {
      const HDR = HDR_TEST(W5);
      const OPEN = 'Your test is in week ' + W5 + '.';
      const check = (where) => {
        for (const id of ['progLenLine', 'raceDateFeedback']) assert.ok(W.inBody(id) && W.painted(id), `${where}: #${id} repainted`);
        const pd = W.reg.get('paceDisplayLine');
        assert.ok(W.painted('paceDisplayLine') || (pd && pd.style.display === 'none'), `${where}: #paceDisplayLine repainted`);
        const s = W.screen();
        assert.equal(s.header, HDR, where);
        assert.ok(s.cardText.startsWith(OPEN), `${where}: ${s.cardText.slice(0, 60)}`);
        assert.doesNotMatch(s.card || '', /Recommended|var\(--red\)|<button/, where);
      };
      let n = 0;
      for (const base of [null, 720, 780])
        for (const field of ['mileBestMins', 'mileBestSecs', 'targetMins', 'targetSecs'])
          for (const val of ['', '0', '1', '5', '7', '8', '9', '10', '11', '12', '13', '14', '30', '45']) {
            const tag2 = (base ? clk(base) : 'blank') + ' ' + field + '=' + J(val);
            setWD({}, Object.assign(mileOf(480), base ? goalOf(base) : {}));
            W.renderStep('cardio_goal', true);
            const fh = W.lifted(new RegExp('oninput="(WD\\.cardioGoals\\[\'run\'\\]\\.' + field + '=this\\.value;[^"]*)"'));
            assert.ok(fh.length, `${tag2}: a ${field} handler`);
            W.seed();
            W.runHandler(fh[0], { value: val });
            check(tag2 + ' after the field handler');
            snap(tag2 + ' after the field handler', 'lattice');
            const dt = W.openTagRe('raceDateInput').exec(W.bodyHTML());
            const dh = dt && /\boninput="([^"]*)"/.exec(dt[0]);
            assert.ok(dh, `${tag2}: a date handler`);
            const inp = W.doc.getElementById('raceDateInput');
            inp.value = TEST;
            W.seed();
            W.runHandler(dh[1], inp);
            check(tag2 + ' after the date handler');
            snap(tag2 + ' after the date handler', 'lattice');
            n++;
          }
      assert.equal(n, 168);
    });

    test('a dated test with a gap: the accent card says week 5 and what the block reaches from the mile', () => {
      expectCard(cardCase({}, Object.assign(mileOf(480), goalOf(630))), 'var(--accent)', CARD_TW(W5) + ' ' + V.S1, HDR_TEST(W5));
    });

    test('a dated intermediate test with no mile is required and blank: the card says week 5 and quotes no reach', () => {
      const s = cardCase({}, goalOf(720));
      expectCard(s, 'var(--run)', CARD_TW(W5), HDR_TEST(W5));
      assert.ok(!s.text.includes(REACH), 'no reach on the step');
    });

    test('a dated beginner test reads the beginner default with no mile, and his 8:00 mile (no gap) quotes no reach', () => {
      expectCard(cardCase({ experience: 'beginner' }, goalOf(720)), 'var(--accent)', CARD_TW(W5) + ' ' + V.S3, HDR_TEST(W5));
      assert.equal(handReach(W5, 'beginner', 480, 1.5, 'mi', 720).shows, false);
      const s = cardCase({ experience: 'beginner' }, Object.assign(mileOf(480), goalOf(720)));
      expectCard(s, 'var(--run)', CARD_TW(W5), HDR_TEST(W5));
      assert.ok(!s.text.includes(REACH));
    });

    test('Mario\'s case, an 8:00 mile and a 12:00 goal, has no gap: the run card reads the week sentence alone', () => {
      const s = cardCase({}, Object.assign(mileOf(480), goalOf(720)));
      expectCard(s, 'var(--run)', CARD_TW(W5), HDR_TEST(W5));
      assert.ok(!s.text.includes(REACH));
    });

    test('a test this week (Friday 2026-09-25): a 1 week header and "In 1 week that reaches about 1.5 mi in 12:00"', () => {
      const r = handReach(1, 'intermediate', 480, 1.5, 'mi', 630);
      assert.ok(handWeek(TODAY, TEST_TW1) === 1 && r.shows);
      const s = cardCase({ raceDate: TEST_TW1 }, Object.assign(mileOf(480), goalOf(630)));
      expectCard(s, 'var(--accent)', CARD_TW1 + ' ' + handSentence(r), HDR_TEST(1));
      assert.ok(s.cardText.includes('In 1 week that reaches about 1.5 mi in 12:00.'));
    });

    test('a test before the first training day: the signal card says so and quotes no reach', () => {
      assert.equal(handWeek(START_AFTER, TEST), null);
      const s = cardCase({ startDate: START_AFTER }, Object.assign(mileOf(480), goalOf(630)));
      assert.equal(s.cardColor, 'var(--signal)');
      assert.equal(s.cardText, CARD_NULL);
      assert.ok(!s.text.includes(REACH));
    });

    test('undated, the feasibility frame reads the ruled sentence in accent with no button and no "safe"; a required blank mile leaves it empty', () => {
      for (const [lbl, exp, run, want] of [['A2', 'intermediate', Object.assign(mileOf(480), goalOf(570)), V.A2], ['A4', 'beginner', goalOf(720), V.A4]]) {
        const s = cardCase({ experience: exp, eventTargeted: false, raceDate: '' }, run);
        const el = W.reg.get('paceFeasLine');
        assert.ok(W.inBody('paceFeasLine') && el && el.style.display === 'block', `${lbl}: shown`);
        assert.equal(s.feasText, want, lbl);
        assert.equal(W.colorOf(s.feas), 'var(--accent)', lbl);
        assert.doesNotMatch(s.feas || '', /<button|safe/i, lbl);
      }
      const s = cardCase({ experience: 'intermediate', eventTargeted: false, raceDate: '' }, goalOf(630));
      const el = W.reg.get('paceFeasLine');
      assert.ok(W.inBody('paceFeasLine') && el, 'A3: the frame is on the step');
      assert.notEqual(el.style.display, 'block', 'A3: hidden');
      assert.equal(s.feasText, '', 'A3: empty');
    });

    test('a 2 km goal in 8:30 reads "2 km" in the reach sentence, with the km lens at 0.621', () => {
      const r = handReach(W5, 'intermediate', 480, 2, 'km', 510);
      assert.ok(r.shows);
      const s = cardCase({}, Object.assign({ targetDist: '2', paceUnit: 'km' }, mileOf(480), goalOf(510)));
      expectCard(s, 'var(--accent)', CARD_TW(W5) + ' ' + handSentence(r), HDR_TEST(W5));
      assert.ok(s.cardText.includes('about 2 km in '));
    });

    test('the name step\'s Program length reads "5 weeks" for Mario and "1 week" for a test this week', () => {
      const kv = (html) => {
        const out = {};
        for (const m of String(html).matchAll(/<span class="(?:k|summary-key)">([^<]*)<\/span><span class="(?:v|summary-val)"[^>]*>([^<]*)<\/span>/g)) (out[m[1]] = out[m[1]] || []).push(m[2]);
        return out;
      };
      for (const [raceDate, want] of [[TEST, '5 weeks'], [TEST_TW1, '1 week']]) {
        setWD({ raceDate }, Object.assign(mileOf(480), goalOf(720)));
        W.renderStep('name', true);
        assert.equal((kv(W.bodyHTML())['Program length'] || []).join('/'), want, raceDate);
      }
    });

    test('a dated bike century reads the ruled sentence and colour at +2, +1, 0, -1 weeks and 1 week out, and red under a week', () => {
      const bike = (raceDate) => {
        setWDg({ cardioTypes: ['bike'], raceDate }, BIKE);
        W.renderStep('cardio_goal', true);
        return W.screen();
      };
      const N = hdrN(bike(addDays(TODAY, 7 * 40 + 2)).header);
      assert.ok(N >= 4, `N from the header (${N})`);
      for (const [lbl, w, color, want] of [
        ['+2', N + 2, 'var(--run)', 'Your ' + N + '-week program finishes 2 weeks before race day. Use the extra time to stay sharp.'],
        ['+1', N + 1, 'var(--run)', 'Your ' + N + '-week program finishes 1 week before race day. Use the extra time to stay sharp.'],
        ['0', N, 'var(--run)', 'Perfect timing. Your ' + N + '-week program peaks on race day.'],
        ['-1', N - 1, 'var(--accent)', wk(N - 1) + ' is short for this goal. The floor is ' + N + '. Your full ' + N + '-week program stays intact. Your race lands in week ' + (N - 1) + '.'],
        ['1 week out', 1, 'var(--red)', '1 week is short for this goal. The floor is ' + N + '. Your full ' + N + '-week program stays intact. Your race lands in week 1.'],
      ]) {
        const date = addDays(TODAY, 7 * w + 2);
        assert.equal(handWeeksUntil(TODAY, date), w, `${date} is ${w} weeks out`);
        const s = bike(date);
        expectCard(s, color, want, HDR_GOAL(N));
        assert.ok(framed(s.card), `${lbl}: a framed card`);
        snap('bike ' + lbl, 'bike');
      }
      const date = addDays(TODAY, 3);
      assert.equal(handWeeksUntil(TODAY, date), 0);
      const s = bike(date);
      expectCard(s, 'var(--red)', RED_WEEK, HDR_GOAL(N));
      assert.equal(svgN(s.card), 1);
      snap('bike under a week', 'bike');
    });

    test('HALF_MANNY\'s half reads the plan start and race week, in progress and from a future date, by Monday arithmetic', () => {
      const NRC_HALF_WEEKS = 14;
      const handAlign = (race) => {
        const start = monNo(race) - (NRC_HALF_WEEKS - 1) * 7;
        const todayMon = monNo(TODAY);
        const fw = Math.max(0, (start - todayMon) / 7);
        return { start, fw, open: fw ? 1 : Math.max(1, Math.min(NRC_HALF_WEEKS, (todayMon - start) / 7 + 1)), weeksOut: handWeeksUntil(TODAY, race), raceNo: dayNo(race) };
      };
      const dayRe = (no) => {
        const d = new RD(no * 864e5);
        return WD3[d.getUTCDay()] + ',? ' + MON3[d.getUTCMonth()] + ' ' + d.getUTCDate();
      };
      const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      for (const [race, wantFw, wantOpen] of [[fixtures.HALF_MANNY.raceDate, 0, 4], ['2027-01-10', 2, 1]]) {
        const a = handAlign(race);
        assert.deepEqual([a.fw, a.open], [wantFw, wantOpen], `${race}: the hand alignment`);
        IA.eval('WD = ' + JSON.stringify(Object.assign(JSON.parse(BOOT_WD), JSON.parse(JSON.stringify(fixtures.HALF_MANNY)), { startDate: TODAY, raceDate: race })) + ';');
        W.renderStep('cardio_goal', true);
        const s = W.screen();
        const re = new RegExp(
          esc('Your half is ') + dayRe(a.raceNo) + esc(', ' + wk(a.weeksOut) + ' out. The ' + NRC_HALF_WEEKS + '-week plan starts ') + dayRe(a.start) +
            (a.fw ? esc(', ' + wk(a.fw) + ' from now, so it peaks on race week and not early.') : esc(' so race week is week ' + NRC_HALF_WEEKS + '. You open in week ' + a.open + '.')),
        );
        assert.match(s.cardText, re, race);
        assert.equal(s.cardColor, 'var(--run)');
        snap('NRC ' + race, 'NRC');
      }
    });

    test('"In N weeks" is the header\'s N, dated and undated with a swim goal (where a run-only length would differ)', () => {
      const runOnly = () => IA.eval("calcProgramLength(['run'], {run:WD.cardioGoals.run,_experience:WD.experience||'intermediate',_ageBracket:WD.ageBracket||'18-35',_eventTargeted:WD.eventTargeted}, LIFTING_FOCUS_TO_GOAL[WD.liftingFocus]||'balanced').weeks");
      const SWIM500 = { id: 'swim_500_time', label: 'Improve 500 Time', targetMins: '7', targetSecs: '00', targetTime: '7:00', swimUnit: 'yd', baseMins: '12', baseSecs: '00' };
      let differs = 0;
      for (const [lbl, over, swim, mile, goal, where] of [
        ['dated', { cardioTypes: ['run'] }, false, 480, 630, 'card'],
        ['undated run and swim', Object.assign({ cardioTypes: ['run', 'swim'] }, U), true, 480, 570, 'feas'],
      ]) {
        const goals = { run: runGoal(Object.assign(mileOf(mile), goalOf(goal))) };
        if (swim) goals.swim = SWIM500;
        setWDg(over, goals);
        W.renderStep('cardio_goal', true);
        snap('L1 ' + lbl, 'L1');
        const s = W.screen();
        const hN = hdrN(s.header);
        const t = where === 'card' ? s.cardText : s.feasText;
        const sm = /In (\d+) weeks? that reaches about/.exec(t);
        assert.ok(hN > 0, `${lbl}: a header number`);
        assert.equal(sm && +sm[1], hN, `${lbl}: the sentence's N`);
        const r = handReach(hN, 'intermediate', mile, 1.5, 'mi', goal);
        assert.ok(r.shows && t.includes(handSentence(r)), `${lbl}: ${t}`);
        if (runOnly() !== hN) differs++;
      }
      assert.ok(differs > 0, 'some case\'s header differs from the run-only length, so a run-only N would be seen');
    });

    test('a 2 km goal in 12:00 reads "12:00 is 9:40 per mile." as rendered, repainted and after the distance handler; 1.5 mi reads 8:00', () => {
      const want = (tot, dist, unit) => clk(tot) + ' is ' + clk(tot / (unit === 'km' ? dist * KM_MI : dist)) + ' per mile.';
      const inline = () => {
        const m = /<div id="paceDisplayLine"[^>]*>([\s\S]*?)<\/div>/.exec(W.bodyHTML());
        return m ? txt(m[1]) : null;
      };
      const live = () => (W.painted('paceDisplayLine') ? txt(W.reg.get('paceDisplayLine').innerHTML) : null);
      for (const [dist, unit] of [['2', 'km'], ['1.5', 'mi']]) {
        setWD({}, Object.assign({ targetDist: dist, paceUnit: unit }, mileOf(480), goalOf(720)));
        W.renderStep('cardio_goal', true);
        snap('K1 ' + dist + unit, unit === 'km' ? 'km' : 'K1');
        assert.equal(inline(), want(720, +dist, unit), `${dist} ${unit} as rendered`);
        assert.equal(live(), want(720, +dist, unit), `${dist} ${unit} repainted`);
      }
      for (const [from, to, unit] of [['1.5', '2', 'km'], ['2', '1.5', 'mi']]) {
        setWD({}, Object.assign({ targetDist: from, paceUnit: unit }, mileOf(480), goalOf(720)));
        W.renderStep('cardio_goal', true);
        const h = W.lifted(/oninput="(WD\.cardioGoals\['run'\]\.targetDist=this\.value;[^"]*)"/);
        assert.ok(h.length, 'a targetDist handler');
        W.seed();
        W.runHandler(h[0], { value: to });
        snap('K1 handler ' + to + unit, unit === 'km' ? 'km' : 'K1');
        assert.equal(live(), want(720, +to, unit), `${from} -> ${to} ${unit}`);
      }
    });

    test('a 500 in 7:00 reads "7:00 is 1:24 per 100 yd." (and m) as rendered and from updateSwimPaceDisplay', () => {
      const swimWD = (unit, mins) =>
        setWDg(Object.assign({ cardioTypes: ['swim'] }, U), { swim: { id: 'swim_500_time', label: 'Improve 500 Time', swimUnit: unit, targetMins: mins, targetSecs: '00', targetTime: mins ? mins + ':00' : '', baseMins: '12', baseSecs: '00' } });
      for (const unit of ['yd', 'm']) {
        const want = '7:00 is 1:24 per 100 ' + unit + '.';
        swimWD(unit, '7');
        W.renderStep('cardio_goal', true);
        snap('swim inline ' + unit, 'swim');
        assert.equal(txt((/<div id="swimPaceLine"[^>]*>([\s\S]*?)<\/div>/.exec(W.bodyHTML()) || [])[1]), want, `${unit} as rendered`);
        swimWD(unit, '');
        W.renderStep('cardio_goal', true);
        const h = W.lifted(/oninput="(WD\.cardioGoals\['swim'\]\.targetMins=this\.value;[^"]*)"/);
        assert.ok(h.length, 'a swim targetMins handler');
        W.runHandler(h[0], { value: '7' });
        snap('swim updateSwimPaceDisplay ' + unit, 'swim');
        const el = W.reg.get('swimPaceLine');
        assert.equal(el && el.style.display, 'block');
        assert.equal(txt(el.innerHTML), want, `${unit} from updateSwimPaceDisplay`);
      }
    });

    test('an undated beginner\'s run baseline handler repaints the header, 9 weeks at a 1 mi baseline to 6 at 4, as a fresh render would', () => {
      const H1 = 'Program length: 9 weeks. Set by your longest cardio goal and your experience.';
      const H4 = 'Program length: 6 weeks. Set by your longest cardio goal and your experience.';
      const blWD = (bd) => setWD(Object.assign({ experience: 'beginner' }, U), { targetDist: '1.5', paceUnit: 'mi', mileBestMins: '', mileBestSecs: '', targetMins: '', targetSecs: '', baselineDist: bd });
      const fresh = (bd) => {
        blWD(bd);
        W.renderStep('cardio_goal', true);
        snap('baseline fresh ' + bd, 'beginner');
        return W.screen().header;
      };
      assert.equal(fresh('1'), H1);
      assert.equal(fresh('4'), H4);
      assert.notEqual(hdrN(H1), hdrN(H4), 'a stale header is visible');
      blWD('1');
      W.renderStep('cardio_goal', true);
      const h = W.lifted(/oninput="(WD\.cardioGoals\['run'\]\.baselineDist=this\.value;[^"]*)"/);
      assert.ok(h.length, 'a run baselineDist handler');
      W.seed();
      W.runHandler(h[0], { value: '4' });
      snap('baseline handler 1 -> 4', 'beginner');
      assert.ok(W.inBody('progLenLine') && W.painted('progLenLine'), '#progLenLine repainted');
      assert.equal(W.screen().header, H4);
    });

    test('a past date and a non-test date under a week read one red line with one icon, unframed', () => {
      const PAST = '2026-09-15';
      for (const [lbl, set, want] of [
        ['past date, test goal', () => setWD({ raceDate: PAST }, Object.assign(mileOf(480), goalOf(720))), RED_PAST],
        ['past date, bike century', () => setWDg({ cardioTypes: ['bike'], raceDate: PAST }, BIKE), RED_PAST],
        ['3 days out, bike century', () => setWDg({ cardioTypes: ['bike'], raceDate: addDays(TODAY, 3) }, BIKE), RED_WEEK],
      ]) {
        set();
        W.renderStep('cardio_goal', true);
        snap(lbl, 'entry error');
        const s = W.screen();
        assert.equal(svgN(s.card), 1, lbl);
        assert.equal(s.cardColor, 'var(--red)', lbl);
        assert.ok(!framed(s.card), lbl);
        assert.equal(s.cardText, want, lbl);
      }
    });

    test('the sweep\'s other screens render: the R1 cards, mile advisories at render and through the handlers, the swim panel, the seed banner', () => {
      for (const [lbl, fam, over, run] of [
        ['S1', 'dated gap', {}, Object.assign(mileOf(480), goalOf(630))],
        ['S2', 'dated gap', {}, goalOf(720)],
        ['S3', 'beginner', { experience: 'beginner' }, goalOf(720)],
        ['S4', 'dated', {}, Object.assign(mileOf(480), goalOf(720))],
        ['S5', 'dated gap', { raceDate: TEST_TW1 }, Object.assign(mileOf(480), goalOf(630))],
        ['S6', 'dated', { startDate: START_AFTER }, Object.assign(mileOf(480), goalOf(630))],
        ['A2', 'undated gap', U, Object.assign(mileOf(480), goalOf(570))],
        ['A3', 'undated gap', U, goalOf(630)],
        ['A4', 'beginner', Object.assign({ experience: 'beginner' }, U), goalOf(720)],
        ['S9', 'km', {}, Object.assign({ targetDist: '2', paceUnit: 'km' }, mileOf(480), goalOf(510))],
      ]) {
        setWD(over, run);
        W.renderStep('cardio_goal', true);
        snap(lbl, fam);
      }
      for (const [mm, ss] of [['2', '00'], ['4', '10'], ['13', '00'], ['30', '00'], ['8', '75']]) {
        setWD({}, Object.assign({ mileBestMins: mm, mileBestSecs: ss }, goalOf(720)));
        W.renderStep('cardio_goal', true);
        snap('mile ' + mm + ':' + ss + ' at render', 'mile advisory');
        setWD({}, goalOf(720));
        W.renderStep('cardio_goal', true);
        const hm = W.lifted(/oninput="(WD\.cardioGoals\['run'\]\.mileBestMins=this\.value;[^"]*)"/);
        const hs = W.lifted(/oninput="(WD\.cardioGoals\['run'\]\.mileBestSecs=this\.value;[^"]*)"/);
        assert.ok(hm.length && hs.length, 'the mile handlers');
        W.runHandler(hm[0], { value: mm });
        W.runHandler(hs[0], { value: ss });
        snap('mile ' + mm + ':' + ss + ' through the handlers', 'mile handler');
      }
      for (const [id, mins, secs] of [['swim_500_time', '7', '00'], ['swim_100_time', '1', '30']])
        for (const unit of ['yd', 'm']) {
          setWDg(Object.assign({ cardioTypes: ['swim'] }, U), { swim: { id, label: 'x', swimUnit: unit, targetMins: mins, targetSecs: secs, targetTime: mins + ':' + secs, baseMins: id === 'swim_500_time' ? '8' : '1', baseSecs: '45', base500Mins: '8', base500Secs: '00' } });
          W.renderStep('cardio_goal', true);
          snap('swim ' + id + ' ' + unit, 'swim');
        }
      setWDg(Object.assign({ cardioTypes: ['swim'] }, U), { swim: { id: 'swim_tri', label: 'Triathlon Swim', baselineDist: '400' } });
      W.renderStep('cardio_goal', true);
      snap('swim swim_tri', 'swim');
      for (const applied of [false, true]) {
        setWD({ _seed: { progName: 'Spring Block', avgRecSec: 570, n: 4, maxDist: 5 }, _seedApplied: applied, _seedDismissed: false }, Object.assign(mileOf(480), goalOf(720)));
        W.renderStep('cardio_goal', true);
        snap('seed banner ' + (applied ? 'applied' : 'offer'), 'seed banner');
      }
    });

    test('over the whole sweep: no button on the card or frame, no dash in the step\'s text, no "safe progression", no icon or bare check in a frame', () => {
      const fams = {};
      for (const st of STATES) fams[st.fam] = (fams[st.fam] || 0) + 1;
      const NEED = { lattice: 336, NRC: 2, swim: 5, 'mile advisory': 5, 'mile handler': 5, beginner: 1, 'undated gap': 1, bike: 1, km: 1, 'seed banner': 2, 'entry error': 3 };
      for (const [f, min] of Object.entries(NEED)) assert.ok((fams[f] || 0) >= min, `coverage: ${fams[f] || 0} ${f} states, want ${min}`);
      assert.ok(STATES.filter((s) => s.fam === 'mile handler' && s.adv).length >= 5, 'the mile advisory wrote its text through the handlers');
      assert.ok(STATES.filter((s) => s.fam === 'seed banner' && /Seed from|Estimated from/.test(s.text)).length >= 2, 'the seed banner shows');
      assert.deepEqual(STATES.filter((st) => /<button\b/i.test(st.card || '') || /<button\b/i.test(st.feas || '')).map((s) => s.label), [], 'no button');
      assert.deepEqual(STATES.filter((st) => dashHits(st.text).length).map((s) => s.label).slice(0, 3), [], 'no em dash or spaced hyphen');
      assert.deepEqual(STATES.filter((st) => /safe progression/i.test(st.text + ' ' + txt(st.card) + ' ' + txt(st.feas))).map((s) => s.label), [], 'no "safe progression"');
      let cards = 0;
      let frames = 0;
      for (const st of STATES)
        for (const [k, nm] of [['card', '#raceDateFeedback'], ['feas', '#paceFeasLine']]) {
          if (!framed(st[k])) continue;
          if (k === 'card') cards++;
          else frames++;
          assert.equal(svgN(st[k]), 0, `${st.label} ${nm}: no icon in a frame`);
          assert.equal((String(st[k]).match(/✓/g) || []).length, 0, `${st.label} ${nm}: no bare check`);
        }
      assert.ok(cards > 0 && frames > 0, `framed cards ${cards}, framed frames ${frames}`);
    });
  });
}
