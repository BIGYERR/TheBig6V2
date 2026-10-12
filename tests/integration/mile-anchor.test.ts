// The mile anchor: the mile time a run plan's paces are read from, and what the athlete is told about it.
//   The anchor sentence on the program card and its clipboard line (V202 E5/E6, D119 provenance, D189 defaults):
//     a pace goal scopes its claim to week 1, a chart goal keeps the program-wide claim, run_base names its easy runs.
//   A goal change carries the anchor (D118): mileBestMins, mileBestSecs and mileBestSrc survive a run-goal switch.
//   A beginner's mile (D188): optional, judged by the same validator, and read by every engine read.
//   The default disclosure (D189 S1): a program built on a guessed mile says so once, on week 1's first paced run.
// The lattice claims run here on a sample; tests/sweeps/mile-anchor.test.js runs the whole lattices.
//
// Oracles: every sentence typed from its ruling; the chart rows typed from doctrine/nikerunclub5k.txt; the
// experience defaults 690/570/450 s formatted by hand; the comment-stripped source for the token-gone checks.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { fixtures, progDigest } from '../support/app.ts';
import { loadAppAt, clone, stripComments } from '../support/pace-clock.ts';
import * as L from '../support/pace-clock-lattices.ts';
import type { CardioGoal } from '@ia/core';
const IA = loadAppAt(new Date(2026, 9, 11, 12, 0, 0));
const strip = (h: unknown): string => String(h || '').replace(/<[^>]+>/g, '');
const MID_DASH = /\s[—–-]\s/;
const midDash = (s: string) => /[A-Za-z0-9,)]\s*[—-]\s*[A-Za-z0-9(]/.test(s);
const COPY_RX = /\w\s?[-–—]\s?\w/;
const ASSERTED: string[] = []; // every athlete-facing string this file asserts, for the copy test at the end
const keep = (s: unknown) => typeof s === 'string' && s && ASSERTED.push(s);

const TAIL_PACE = ' Week 1 runs off this row. Every week after it moves toward your goal.';
const TAIL_CHART = ' Every pace in this program comes from this row.';
const TAIL_BASE = ' Your easy runs take their pace and their ceiling from this row. Benchmark runs prescribe no pace.';

/** The card sentence and clipboard line the app renders for a cfg (runAnchorInfo, runAnchorSentence, runAnchorLine). */
const say = (cfg: Record<string, any>): { s: string; l: string; kind: string } | null => {
  const a = IA.runAnchor(cfg);
  return a ? { s: strip(IA.sentence(a)), l: strip(IA.line(a)), kind: a.kind } : null;
};
IA.runAnchor = IA.eval('runAnchorInfo');
IA.sentence = IA.eval('runAnchorSentence');
IA.line = IA.eval('runAnchorLine');
const runGoal = (g: Partial<CardioGoal>, over?: Record<string, unknown>) => L.prtTing(Object.assign({ cardioGoals: { run: g } }, over || {}));
const PINNED = runGoal({
  id: 'run_pace_goal', label: 'Hit a Pace / Time Goal', paceUnit: 'mi', baselineDist: '3', baseline: '3mi', targetDist: '1.5', targetMins: '10',
  targetSecs: '30', targetTime: '10:30', mileBestMins: '8', mileBestSecs: '15', mileBestSrc: { kind: 'entered' },
});

test('a pace goal\'s card says the anchor sets week 1 only; HALF_MANNY\'s chart card keeps the program-wide claim', () => {
  const pv = say(PINNED)!;
  assert.equal(pv.s, 'Anchored on an 8:15 mile, the time you entered.' + TAIL_PACE);
  assert.ok(pv.l.includes(TAIL_PACE.trim()), 'the clipboard line carries the week 1 scope');
  const mv = say(fixtures.HALF_MANNY)!;
  assert.equal(mv.s, 'Anchored on a 10:30 mile, the time you entered.' + TAIL_CHART);
  keep(pv.s);
  keep(pv.l);
  keep(mv.s);
});

test('every provenance form on every chart goal takes its own tail, never the other\'s, with no dash; the clipboard mirrors the card', () => {
  const FORMS = [
    ['entered', { mileBestMins: '8', mileBestSecs: '15', mileBestSrc: { kind: 'entered' } }, 'intermediate'],
    ['seeded', { mileBestMins: '9', mileBestSecs: '00', mileBestSrc: { kind: 'seeded', prog: 'PRT TING', n: 4 } }, 'intermediate'],
    ['default', {}, 'intermediate'],
    ['beginner', { mileBestMins: '8', mileBestSecs: '15', mileBestSrc: { kind: 'entered' } }, 'beginner'],
    ['fast clamp', { mileBestMins: '3', mileBestSecs: '30', mileBestSrc: { kind: 'entered' } }, 'advanced'],
    ['slow clamp', { mileBestMins: '22', mileBestSecs: '00', mileBestSrc: { kind: 'entered' } }, 'advanced'],
  ];
  let n = 0;
  for (const [tag, mb, exp] of FORMS) {
    for (const gid of ['run_pace_goal', 'run_5k', 'run_10k', 'run_half', 'run_marathon']) {
      const v = say(runGoal(Object.assign({ id: gid, label: gid, paceUnit: 'mi', baselineDist: '3', baseline: '3mi', targetDist: '1.5', targetMins: '10', targetSecs: '30', targetTime: '10:30' }, mb), { experience: exp }));
      assert.ok(v, `${gid}/${tag}: an anchor`);
      n++;
      const where = `${gid}/${tag}/${exp}`;
      assert.doesNotMatch(v.s, MID_DASH, `${where} card`);
      assert.doesNotMatch(v.l, MID_DASH, `${where} line`);
      const want = gid === 'run_pace_goal' ? TAIL_PACE : TAIL_CHART;
      const other = gid === 'run_pace_goal' ? TAIL_CHART : TAIL_PACE;
      assert.ok(v.s.includes(want) && !v.s.includes(other), `${where}: ${v.s}`);
      assert.equal(v.s.includes('Week 1 runs off this row'), v.l.includes('Week 1 runs off this row'), `${where}: card and line agree on the scope`);
    }
  }
  assert.equal(n, 30);
});

// D119: the provenance sentence, every kind typed in full, on a hand-built anchor record.
const A = (o: Record<string, unknown>) => Object.assign({ anchorSec: 630, rawSec: 630, clamped: null, row: {}, kind: 'entered', exp: 'intermediate', prog: '', n: 0, wk: 0, from: null, race: 'half', goalId: 'run_half' }, o);
const sentenceOf = (a: unknown) => {
  try {
    return IA.sentence(a);
  } catch (e) {
    return 'THREW ' + (e as Error).message;
  }
};

test('an edited anchor names the week and what it replaced: a prior time, padded, or the level default', () => {
  assert.equal(sentenceOf(A({ kind: 'edited', wk: 4, from: { kind: 'entered', mins: '11', secs: '00' } })), 'Anchored on a <b>10:30 mile</b>, the time you entered in week 4. Before that it was 11:00.' + TAIL_CHART);
  assert.equal(sentenceOf(A({ kind: 'edited', wk: 6, from: { kind: 'default', mins: '', secs: '' } })), 'Anchored on a <b>10:30 mile</b>, the time you entered in week 6. Before that it was the intermediate default.' + TAIL_CHART);
  assert.equal(sentenceOf(A({ kind: 'edited', wk: 11, from: { kind: 'entered', mins: '9', secs: '5' } })), 'Anchored on a <b>10:30 mile</b>, the time you entered in week 11. Before that it was 9:05.' + TAIL_CHART);
});

test('an edited anchor with no record of what it replaced reads as entered, renders, and never says no mile was entered', () => {
  const degen = sentenceOf(A({ kind: 'edited', wk: 4, from: null }));
  assert.equal(degen, 'Anchored on a <b>10:30 mile</b>, the time you entered.' + TAIL_CHART);
  assert.ok(!degen.startsWith('THREW'));
  assert.ok(!degen.includes('no mile time was entered') && !degen.includes('Before that it was'));
  assert.doesNotMatch(degen, /week (undefined|NaN|0)\b/);
  assert.equal(sentenceOf(A({ kind: 'edited', wk: 0, from: undefined })), degen);
});

test('the entered, seeded, default and clamped forms read as typed; a clamp beats every kind', () => {
  assert.equal(sentenceOf(A({ kind: 'entered' })), 'Anchored on a <b>10:30 mile</b>, the time you entered.' + TAIL_CHART);
  assert.equal(sentenceOf(A({ kind: 'seeded', n: 4, prog: 'THE BASE' })), 'Anchored on a <b>10:30 mile</b>, worked back from 4 recovery runs you logged in THE BASE.' + TAIL_CHART);
  assert.equal(sentenceOf(A({ kind: 'seeded', n: 1, prog: 'THE BASE' })), 'Anchored on a <b>10:30 mile</b>, worked back from 1 recovery run you logged in THE BASE.' + TAIL_CHART);
  assert.equal(sentenceOf(A({ kind: 'seeded', n: 0, prog: '' })), 'Anchored on a <b>10:30 mile</b>, worked back from the recovery runs you logged in your last program.' + TAIL_CHART);
  assert.equal(sentenceOf(A({ kind: 'default', exp: 'beginner', anchorSec: 690, rawSec: 690 })), 'Anchored on an <b>11:30 mile</b>, the beginner default. No mile time was entered. Tap the pencil to enter one.' + TAIL_CHART);
  assert.equal(sentenceOf(A({ kind: 'default', anchorSec: 570, rawSec: 570 })), 'Anchored on a <b>9:30 mile</b>, the intermediate default. No mile time was entered. Tap the pencil to enter one.' + TAIL_CHART);
  assert.equal(
    sentenceOf(A({ kind: 'edited', wk: 4, clamped: 'fast', anchorSec: 300, rawSec: 240, from: { kind: 'entered', mins: '4', secs: '0' } })),
    'Anchored on a <b>5:00 mile</b>, the 4:00 you entered is faster than the chart goes, so its fastest row is used.' + TAIL_CHART,
  );
  const d119 = [A({ kind: 'edited', wk: 4, from: { kind: 'entered', mins: '11', secs: '00' } }), A({ kind: 'edited', wk: 6, from: { kind: 'default' } }), A({ kind: 'edited', wk: 4, from: null })].map((a) => strip(sentenceOf(a)));
  for (const s of d119) {
    assert.ok(!midDash(s), s);
    assert.doesNotMatch(s, /Nike/);
  }
});

// ── D118: a goal change carries the anchor (the real goal sheet, on its own boot) ──
const GS = loadAppAt(new Date(2026, 9, 11, 12, 0, 0));
GS.eval('renderGoalSheet = function(){}; renderProgList = function(){}; showToast = function(){};');
const SRC_EDIT = { kind: 'edited', wk: 3, at: '2026-09-01', from: { kind: 'entered', mins: '11', secs: '00' } };
function seedProgram(runGoalOver?: Partial<CardioGoal>) {
  const cfg = clone(fixtures.HALF_MANNY);
  cfg.cardioGoals.run = Object.assign({ id: 'run_half', label: 'Half Marathon', baselineDist: '5', baseline: '5mi', mileBestMins: '10', mileBestSecs: '30', mileBestSrc: clone(SRC_EDIT) }, runGoalOver || {});
  cfg.cardioTypes = ['run', 'bike'];
  cfg.cardioGoals.bike = { id: 'bike_ftp', label: 'Improve FTP / Power', baseline: '200w', baselineDist: '20' };
  GS.localStorage.setItem('ia_programs', JSON.stringify([{ id: 'gR', name: 'THE HALF MANNY', totalWeeks: 14, startDate: '2026-09-07', cfg }]));
}
function switchGoal(sport: string, sel: string, inputs?: Record<string, string>) {
  GS.eval('openGoalSheet')('gR', sport);
  GS.eval('selectGoalOpt')(sel);
  for (const [k, v] of Object.entries(inputs || {})) GS.eval('_goalSetInput')(k, v);
  GS.eval('commitGoalChange')();
  return JSON.parse(GS.localStorage.getItem('ia_programs')!)[0].cfg;
}
const weeksDigest = (prog: { weeks: unknown }) => crypto.createHash('sha256').update(JSON.stringify(prog.weeks)).digest('hex').slice(0, 16);

test('switching the run goal keeps the mile and its provenance, still drops the baseline, and writes no target the goal does not need', () => {
  seedProgram();
  const after = switchGoal('run', 'run_10k');
  const r = after.cardioGoals.run;
  assert.equal(r.id, 'run_10k');
  assert.equal(r.label, 'Run a 10K');
  assert.equal(r.mileBestMins, '10');
  assert.equal(r.mileBestSecs, '30');
  assert.deepEqual(r.mileBestSrc, SRC_EDIT);
  assert.equal(r.baseline, '');
  assert.equal(r.baselineDist, undefined);
  assert.equal(r.targetMins, undefined);
  assert.ok(GS.eval('runAnchorInfo')(after), 'the switched goal is still chart-anchored');
});

test('a run goal with no mile gains no phantom anchor when switched', () => {
  seedProgram({ mileBestMins: '', mileBestSecs: '', mileBestSrc: undefined });
  const r = switchGoal('run', 'run_10k').cardioGoals.run;
  assert.equal(r.mileBestMins, undefined);
  assert.equal(r.mileBestSecs, undefined);
  assert.equal(r.mileBestSrc, undefined);
});

test('switching the bike goal leaves the run goal byte-identical and gives the bike no mile', () => {
  seedProgram();
  const before = JSON.stringify(JSON.parse(GS.localStorage.getItem('ia_programs')!)[0].cfg.cardioGoals.run);
  const after = switchGoal('bike', 'bike_50');
  assert.equal(after.cardioGoals.bike.id, 'bike_50');
  assert.equal(JSON.stringify(after.cardioGoals.run), before);
  assert.equal(after.cardioGoals.bike.mileBestMins, undefined);
  assert.equal(after.cardioGoals.bike.mileBestSrc, undefined);
  assert.equal(after.cardioGoals.bike.baseline, '');
});

test('half, then a 1.5 mi pace goal, then half again rebuilds the original program', () => {
  // run_15_under10 is the pre-alias id of the 1.5 mi pace goal; the picker never offers it, so the round trip uses
  // run_pace_goal, 1.5 mi in 10:00.
  assert.ok(!GS.eval('CARDIO_GOALS_BY_TYPE').run.some((o: { id: string }) => o.id === 'run_15_under10'), 'run_15_under10 is not a picker option');
  assert.match(GS.html, /_GOAL_ALIAS\s*=\s*\{[^}]*run_15_under10:\s*'run_pace_goal'/, 'the app aliases run_15_under10 to run_pace_goal');
  seedProgram();
  const cfg0 = JSON.parse(GS.localStorage.getItem('ia_programs')!)[0].cfg;
  const d0 = weeksDigest(GS.buildProgram(clone(cfg0)));
  const cfg1 = switchGoal('run', 'run_pace_goal', { targetDist: '1.5', targetMins: '10', targetSecs: '0', paceUnit: 'mi' });
  assert.equal(cfg1.cardioGoals.run.id, 'run_pace_goal');
  assert.equal(cfg1.cardioGoals.run.mileBestMins + ':' + cfg1.cardioGoals.run.mileBestSecs, '10:30');
  assert.notEqual(weeksDigest(GS.buildProgram(clone(cfg1))), d0, 'the pace goal builds a different program');
  const cfg2 = switchGoal('run', 'run_half');
  assert.equal(cfg2.cardioGoals.run.mileBestMins + ':' + cfg2.cardioGoals.run.mileBestSecs, '10:30');
  assert.deepEqual(cfg2.cardioGoals.run.mileBestSrc, SRC_EDIT);
  assert.equal(cfg2.cardioGoals.run.baselineDist, undefined);
  assert.equal(weeksDigest(GS.buildProgram(clone(cfg2))), d0);
  const pure = clone(cfg0);
  const pureBefore = JSON.stringify(pure);
  GS.buildProgram(pure);
  assert.equal(JSON.stringify(pure), pureBefore, 'buildProgram leaves the cfg byte-identical');
});

// ── D188: the beginner's mile, on a boot pinned to 2026-09-30 09:00 ──
const B = loadAppAt(new Date(2026, 8, 30, 9, 0, 0));
L.beginnerMileLatticeTests(B, progDigest, 'sample (seeds 1000 and 1037)', [1000, 1037]);

test('a beginner\'s 1.5 mi pace goal in 13:30 runs 9 weeks from a 9:00 mile and 11 weeks with none', () => {
  // 9:00 is 540 s/mi = the goal pace, gap 0: the beginner base floor, 9. No mile: (690 - 540) / 3 = 50 weeks, capped at 11.
  const len = (mile: number) => B.buildProgram(L.mileCfg('run_pace_goal', 'beginner', 1000, mile, ['13', '30'])).totalWeeks;
  assert.equal(len(540), 9);
  assert.equal(len(0), 11);
});

test('a beginner\'s 9:00 mile reaches the pace ceiling: 1.5 mi in 10:30 runs 11 weeks and the sentence reads his mile', () => {
  // Gap 540 - 420 = 120 s / 3 = 40 weeks; x 1.25 + 4 = 54; + 1 = 55; the 1.5 mi cap is 11. In 11 weeks:
  // improving weeks ((11 - 1) / 1.0 - 4) / 1.25 = 4.8; 540 - 4.8 x 3 = 525.6 s/mi; x 1.5 = 788.4 s = 13:08.
  assert.equal(B.buildProgram(L.mileCfg('run_pace_goal', 'beginner', 1000, 540, ['10', '30'])).totalWeeks, 11);
  const RUN = { id: 'run_pace_goal', label: 'x', targetDist: '1.5', paceUnit: 'mi', targetMins: '10', targetSecs: '30', mileBestMins: '9', mileBestSecs: '0', mileBestSrc: { kind: 'entered' } };
  const WDX = { experience: 'beginner', ageBracket: '18-35', primaryPath: 'hybrid', cardioTypes: ['run'], eventTargeted: false, raceDate: '', name: 'G226', liftingFocus: 'balanced', equipment: 'crossfit', unit: 'lbs', restDays: ['sun', 'wed'], seed: 1000, cardioGoals: { run: RUN } };
  const saved = B.eval('JSON.stringify(WD)');
  try {
    B.eval('WD = Object.assign(JSON.parse(JSON.stringify(WD)), ' + JSON.stringify(WDX) + ')');
    const s = B.eval('paceCeilingSentence(assessRunPaceCeiling(11))');
    assert.equal(s, 'Your mile is 9:00. In 11 weeks that reaches about 1.5 mi in 13:08. Your goal is 10:30. Keep it or change it above.');
    keep(s);
  } finally {
    B.eval('WD = ' + saved);
  }
});

test('the mile validator judges a beginner\'s mile like anyone\'s, on every run goal, and the pace goal still requires one past beginner', () => {
  const state = (g: Partial<CardioGoal>, exp: string) => JSON.parse(B.eval(`JSON.stringify(_mileEntryState(${JSON.stringify(g)}, ${JSON.stringify(exp)}))`));
  const goals = ['run_pace_goal', 'run_5k', 'run_10k', 'run_half', 'run_base'];
  const mile = (id: string, mm: string, ss: string) => ({ id, mileBestMins: mm, mileBestSecs: ss });
  const UNDER3 = 'Under 3:00 is not a mile time. The world record is 3:43. Check the entry.';
  const OVER25 = 'Over 25:00 reads as a walk, not a run. Check the entry.';
  const SLOW = 'At 13:00 your paces come from the 12:00 row, the chart’s slowest. Consider a base block first.';
  const FAST = 'At 4:30 your paces come from the chart’s fastest row, 5:00. It tops out there.';
  for (const id of goals) {
    assert.deepEqual(state({ id }, 'beginner'), { ok: true }, `${id} blank`);
    assert.deepEqual(state(mile(id, '2', '30'), 'beginner'), { ok: false, msg: UNDER3 }, `${id} 2:30`);
    assert.deepEqual(state(mile(id, '30', '0'), 'beginner'), { ok: false, msg: OVER25 }, `${id} 30:00`);
    assert.deepEqual(state(mile(id, '13', '0'), 'beginner'), { ok: true, adv: SLOW }, `${id} 13:00`);
    assert.deepEqual(state(mile(id, '4', '30'), 'beginner'), { ok: true, adv: FAST }, `${id} 4:30`);
  }
  assert.deepEqual(state({ id: 'run_pace_goal' }, 'intermediate'), { ok: false, blank: true, msg: 'Required. Enter your most recent timed mile.' });
  assert.deepEqual(state({ mileBestMins: '30', mileBestSecs: '0' }, 'beginner'), { ok: false, msg: OVER25 }, 'the mile sheet call');
  for (const s of [UNDER3, OVER25, SLOW, FAST]) keep(s);
});

test('no engine read sets a beginner\'s mile aside: the beginner gates are gone from the source', () => {
  const CS = stripComments(B.js);
  const R3 = "if(g.id==='run_pace_goal' && exp!=='beginner') return {ok:false, blank:true";
  assert.equal(CS.split(R3).length - 1, 1, 'the pace goal\'s required-mile line occurs once');
  const TOK = "'beginner'";
  const r3Tok = CS.indexOf(R3) + R3.indexOf(TOK);
  const hits = [];
  for (let i = CS.indexOf(TOK); i >= 0; i = CS.indexOf(TOK, i + 1)) {
    if (i === r3Tok) continue;
    const win = CS.slice(Math.max(0, i - 120), i + TOK.length + 120);
    if (['mileBest', 'arguments[12]', 'mileBestSecs)'].some((x) => win.includes(x))) hits.push(CS.slice(Math.max(0, i - 60), i + 30).replace(/\s+/g, ' '));
  }
  assert.deepEqual(hits, [], '\'beginner\' within 120 characters of a mile read');
  for (const rx of [/kind\s*===?\s*'beginner'/g, /kind\s*!==?\s*'beginner'/g, /'beginner default'/g, /beginner default of/g]) assert.equal((CS.match(rx) || []).length, 0, String(rx));
});

// Long-run tiers for a beginner with a mile, sample (the sweep runs 384 cfgs).
L.longRunTierLatticeTests(B, 'sample (beginner, run_base 3 mi and the half, event, miles 9:00 and 13:00, seed 1000)', {
  exps: ['beginner'],
  goals: [['base3mi', { id: 'run_base', baselineDist: '3', baseline: '3mi' }], ['half', { id: 'run_half' }]],
  paths: [['event', 'support_prevention']],
  miles: [540, 780],
  rests: [['mon', 'thu', 'sun']],
  seeds: [1000],
});

// ── D189: the default disclosed, on a boot pinned to 2026-09-22 21:16 ──
const D = loadAppAt(new Date(2026, 8, 22, 21, 16, 0));
L.disclosureLatticeTests(D, 'sample (seed 1000, rest Sunday and Wednesday)', [1000], [['sun', 'wed']]);

test('the hand defaults format to 11:30, 9:30 and 7:30, and a no-mile build equals itself', () => {
  assert.deepEqual(L.DEF_MILE, { beginner: '11:30', intermediate: '9:30', advanced: '7:30' });
  for (const [e, s] of Object.entries({ beginner: 690, intermediate: 570, advanced: 450 })) assert.equal(Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'), (L.DEF_MILE as Record<string, string>)[e]);
  const c0 = L.discloseCfg('run_5k', 'intermediate', 0, 1000, ['sun', 'wed']);
  assert.equal(progDigest(D.buildProgram(clone(c0))), progDigest(D.buildProgram(clone(c0))));
});

test('an intermediate or advanced pace goal with no mile is refused with the required-mile string', () => {
  const st = D.eval('_mileEntryState');
  for (const exp of ['intermediate', 'advanced']) {
    const r = st(L.discloseCfg('run_pace_goal', exp, 0, 1000, ['sun', 'wed']).cardioGoals.run, exp);
    assert.deepEqual({ ok: r.ok, blank: r.blank, msg: r.msg }, { ok: false, blank: true, msg: 'Required. Enter your most recent timed mile.' });
    keep(r.msg);
  }
});

// The program card (progDetailHTML) and its clipboard lines (progSelLines), the production renderers.
function card(cfg: Record<string, any>) {
  const html = String(D.eval('progDetailHTML')({ id: 'g226', name: 'M', cfg: clone(cfg) }));
  const grp = /<div class="det-label"[^>]*>Run paces([\s\S]*?)<div class="det-src">([\s\S]*?)<\/div><\/div>/.exec(html);
  const chips = grp ? (grp[1].match(/<div class="lc-k">([^<]*)<\/div>/g) || []).map((s) => s.replace(/<[^>]+>/g, '')) : null;
  const pencils = grp ? (grp[0].match(/aria-label="Change mile time"/g) || []).length : 0;
  const lines = D.eval('progSelLines')({ id: 'g226', name: 'M', cfg: clone(cfg) }).filter((l: string) => /^Run anchor:/.test(l));
  return { sentence: grp ? strip(grp[2]) : null, chips, pencils, clip: lines.length === 1 ? lines[0] : lines.length ? 'MANY ' + lines.length : null };
}
// The 5K chart rows (doctrine/nikerunclub5k.txt): mile -> 5K, 10K, tempo, half, recovery per-mile paces.
/** A 5K chart row: the 5K, 10K, tempo, half and recovery paces per mile. */
interface ChartRow { k5: string; k10: string; tempo: string; half: string; rec: string }
const CHART: Record<string, ChartRow> = {
  '5:00': { k5: '5:30', k10: '5:45', tempo: '6:05', half: '6:00', rec: '7:00' },
  '7:30': { k5: '8:05', k10: '8:25', tempo: '8:50', half: '8:45', rec: '9:55' },
  '9:00': { k5: '9:40', k10: '10:00', tempo: '10:30', half: '10:40', rec: '11:35' },
  '9:30': { k5: '10:15', k10: '10:35', tempo: '11:00', half: '11:05', rec: '12:10' },
  '10:30': { k5: '11:15', k10: '11:35', tempo: '12:00', half: '12:10', rec: '13:20' },
  '11:30': { k5: '12:15', k10: '12:35', tempo: '13:00', half: '13:15', rec: '14:05' },
  '12:00': { k5: '12:40', k10: '13:05', tempo: '13:35', half: '14:05', rec: '14:30' },
};
const clipOf = (m: string, prov: string, keys: [string, string][], scope?: string) => 'Run anchor: ' + m + ' mile (' + prov + ') → ' + keys.map(([k, v]) => k + ' ' + v).join(' / ') + (scope || '');
const chartKeys = (m: string, race?: boolean): [string, string][] => {
  const r = CHART[m];
  const head: [string, string][] = [['5k', r.k5], ['10k', r.k10], ['tempo', r.tempo]];
  return head.concat(race ? [['half', r.half]] : []).concat([['recovery', r.rec]]);
};
const DEFAULT_CELLS: [string, string][] = [];
for (const exp of ['beginner', 'intermediate', 'advanced']) for (const goal of ['run_5k', 'run_half', 'run_base']) DEFAULT_CELLS.push([goal, exp]);
DEFAULT_CELLS.push(['run_pace_goal', 'beginner']);
function wantDefault(goal: string, exp: string) {
  const m = L.DEF_MILE[exp];
  const mileKey: [string, string][] = [['mile', m]];
  const keys: [string, string][] = goal === 'run_base' ? [['recovery', CHART[m].rec]] : goal === 'run_pace_goal' ? mileKey.concat(chartKeys(m, false)) : chartKeys(m, goal === 'run_half');
  const tail = goal === 'run_pace_goal' ? TAIL_PACE : goal === 'run_base' ? TAIL_BASE : TAIL_CHART;
  return {
    sentence: `Anchored on ${L.ART_OF[exp]} ${m} mile, the ${exp} default. No mile time was entered. Tap the pencil to enter one.` + tail,
    clip: clipOf(m, exp + ' default, no mile time entered', keys, goal === 'run_pace_goal' ? ' | ' + TAIL_PACE.trim() : ''),
  };
}

test('a no-mile card names the level default and points at the pencil, on 5K, half, base and a beginner pace goal', () => {
  for (const [goal, exp] of DEFAULT_CELLS) {
    const got = card(L.discloseCfg(goal, exp, 0, 1000, ['sun', 'wed'])).sentence;
    assert.equal(got, wantDefault(goal, exp).sentence, `${goal}|${exp}`);
    keep(got);
  }
});

test('a no-mile clipboard line names the level default and the chart row it reads', () => {
  for (const [goal, exp] of DEFAULT_CELLS) {
    const got = card(L.discloseCfg(goal, exp, 0, 1000, ['sun', 'wed'])).clip;
    assert.equal(got, wantDefault(goal, exp).clip, `${goal}|${exp}`);
    keep(got);
  }
});

test('run_base\'s card shows a Run paces group of Mile and Recovery with one pencil, at every level', () => {
  for (const exp of ['beginner', 'intermediate', 'advanced']) {
    const c = card(L.discloseCfg('run_base', exp, 0, 1000, ['sun', 'wed']));
    assert.deepEqual(c.chips, ['Mile', 'Recovery'], exp);
    assert.equal(c.pencils, 1, exp);
  }
});

test('HALF_MANNY\'s card and clipboard read the entered form verbatim', () => {
  const c = card(fixtures.HALF_MANNY);
  assert.equal(c.sentence, 'Anchored on a 10:30 mile, the time you entered. Every pace in this program comes from this row.');
  assert.equal(c.clip, clipOf('10:30', 'entered', chartKeys('10:30', true), ''));
  keep(c.sentence);
  keep(c.clip);
});

test('seeded, clamped and edited forms keep their wording, and a beginner\'s entered or seeded mile is read as his', () => {
  const F: [string, string, number, Record<string, unknown>, string, string][] = [
    ['seeded 9:00', 'intermediate', 540, { kind: 'seeded', prog: 'PRIOR', n: 6 }, 'Anchored on a 9:00 mile, worked back from 6 recovery runs you logged in PRIOR.' + TAIL_CHART, clipOf('9:00', 'seeded from PRIOR, 6 logged recovery runs', chartKeys('9:00'))],
    ['clamped slow 13:00', 'intermediate', 780, { kind: 'entered' }, 'Anchored on a 12:00 mile, the 13:00 you entered is slower than the chart goes, so its slowest row is used.' + TAIL_CHART, clipOf('12:00', "entry 13:00 clamped to the chart's slowest row", chartKeys('12:00'))],
    ['clamped fast 4:30', 'advanced', 270, { kind: 'entered' }, 'Anchored on a 5:00 mile, the 4:30 you entered is faster than the chart goes, so its fastest row is used.' + TAIL_CHART, clipOf('5:00', "entry 4:30 clamped to the chart's fastest row", chartKeys('5:00'))],
    ['edited from 9:30', 'intermediate', 540, { kind: 'edited', wk: 3, from: { kind: 'entered', mins: '9', secs: '30' } }, 'Anchored on a 9:00 mile, the time you entered in week 3. Before that it was 9:30.' + TAIL_CHART, clipOf('9:00', 'edited in week 3', chartKeys('9:00'))],
    ['entered 9:00 beginner', 'beginner', 540, { kind: 'entered' }, 'Anchored on a 9:00 mile, the time you entered.' + TAIL_CHART, clipOf('9:00', 'entered', chartKeys('9:00'))],
    ['seeded 9:00 beginner', 'beginner', 540, { kind: 'seeded', prog: 'PRIOR', n: 6 }, 'Anchored on a 9:00 mile, worked back from 6 recovery runs you logged in PRIOR.' + TAIL_CHART, clipOf('9:00', 'seeded from PRIOR, 6 logged recovery runs', chartKeys('9:00'))],
  ];
  for (const [lbl, exp, mile, src, ws, wc] of F) {
    const c = card(L.discloseCfg('run_5k', exp, mile, 1000, ['sun', 'wed'], src));
    assert.equal(c.sentence, ws, `${lbl} card`);
    assert.equal(c.clip, wc, `${lbl} clipboard`);
    keep(c.sentence);
    keep(c.clip);
  }
});

test('a mile edited over the default names "the <level> default" as what it replaced', () => {
  for (const exp of ['intermediate', 'advanced']) {
    const c = card(L.discloseCfg('run_5k', exp, 540, 1000, ['sun', 'wed'], { kind: 'edited', wk: 3, from: { kind: 'default' } }));
    assert.equal(c.sentence, `Anchored on a 9:00 mile, the time you entered in week 3. Before that it was the ${exp} default.` + TAIL_CHART);
    keep(c.sentence);
  }
});

test('every athlete-facing string this file asserts carries no mid-sentence dash and no Nike', () => {
  keep(L.S1('beginner'));
  keep(L.S1('intermediate'));
  keep(L.S1('advanced'));
  assert.ok(ASSERTED.length >= 40, `strings collected (${ASSERTED.length})`);
  assert.deepEqual(ASSERTED.filter((s) => COPY_RX.test(strip(s)) || /nike/i.test(s)), []);
});
