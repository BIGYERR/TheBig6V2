// native-progress: today's Progress screen (the program chips and the archived bar, the charts, the Lift Ledger, the
// Session Journal and the 1RM estimator), before the Expo app draws it (MIGRATION.md phase 3, row 4). Read-only
// (measure). It runs today's page in the VM harness on the test phone of tests/support/stored-state.ts, draws the
// screen through the Angular screen's own models (frontends/app/src/app/screens/progress) handed the page's readers,
// as progress-screen.ts render() hands them, and reads the stored keys before and after each step.
//
// A. What the screen draws on the ten programs through the standard history: each block, at each of the five stretches.
// A2. The run cards, on three weeks of runs logged with a pace (the standard history stores none).
// B. What each tap writes, on The Half Manny with a second program beside it.
// C. The estimator.
// D. What each piece reads and writes, and through which of core's readers and writers (read from the code).
// E. On the simulator's copy of Mario's backup, counts only (read by a scratch script, typed here).
//
// Usage: cd tests && node measure/native-progress_today.ts   (writes tests/measure/native-progress_today.md)
// TypeScript for the harness imports; node runs it with its types stripped. Not in the tests' type check.
process.env['TZ'] = 'America/New_York';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { REPO } from '../support/app.ts';
import { PROGRAMS } from '../support/programs.ts';
import { Phone, at, firstWeek, life, training } from '../support/stored-state.ts';
import { chartChunks, estimate1RM, journalWeeks, viewedProgram, weeklySums } from '../../frontends/app/src/app/screens/progress/progress-model.ts';
import { chipsView } from '../../frontends/app/src/app/screens/progress/program-chips-model.ts';

const out: string[] = [];
const CREATED = '2026-08-29T09:00:00';
const say = (s = ''): void => { out.push(s); };
const walkable = (seeded: any): any => (seeded.cardioGoals.swim ? { ...seeded, cardioGoals: { ...seeded.cardioGoals, swim: { ...seeded.cardioGoals.swim, baseMins: '10', baseSecs: '30' } } } : seeded);
const idsOf = (keys: Record<string, string>): string[] => {
  try { return (JSON.parse(keys['ia_programs'] || '[]') as { id?: string }[]).map((p) => String(p.id || '')).filter(Boolean).sort((a, b) => b.length - a.length); } catch { return []; }
};
const family = (k: string, ids: string[]): string => { let f = k; for (const id of ids) f = f.split(id).join('<id>'); return f; };
function diff(pre: Record<string, string>, post: Record<string, string>, ids: string[]): string {
  const rows: string[] = [];
  for (const k of [...new Set([...Object.keys(pre), ...Object.keys(post)])].sort()) {
    if ((pre[k] ?? null) === (post[k] ?? null)) continue;
    rows.push('`' + family(k, ids) + '`' + (pre[k] == null ? ' new' : post[k] == null ? ' removed' : ' changed'));
  }
  return rows.join(', ') || 'nothing';
}
const plain = (s: string): string => String(s).replace(/<svg[\s\S]*?<\/svg>/g, '').replace(/<[^>]+>/g, '').trim();

/** The screen as progress-screen.ts render() draws it, from the page's own readers. No write is made here. */
function screen(P: Phone): any {
  const call = (name: string, ...a: unknown[]): any => (P.ev(name) as (...x: unknown[]) => unknown)(...a);
  const g = (name: string): any => P.ev(name);
  const all = call('getPrograms');
  const { prog } = viewedProgram(all, g('progressViewId'), g('activeProgId'), !!g('activeProg'));
  if (!prog) return null;
  const vid = (prog as any).id;
  const icon = (n: string, s: number): string => call('asyIcon', n, s);
  const chips = chipsView(all, vid, { activeId: g('activeProgId'), confirmId: g('confirmProgId'), confirmTier: g('confirmTier'), warnsCrossProg: (id) => call('_purgeWarnsCrossProg', id), icon });
  const exw = call('getExWeightsFor', vid);
  const folded = call('foldExAliasKeys', exw), deduped = call('dedupeExDayEntries', exw);
  const logs = call('getLogsFor', vid);
  const cfg = (prog as any).cfg || {};
  const tw = (prog as any).totalWeeks || 6;
  const sums = weeklySums(logs, call('getExWeightsFor', vid), tw);
  if (!Object.keys(logs).length) return { chips, empty: 'none', charts: [], journal: [], folded, deduped, vid };
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
  const journal = journalWeeks(logs, { rpeLabel: (r) => labels[r], jogLines: (rl) => call('restLogLines', rl), icon });
  return { chips, empty: null, charts, journal, folded, deduped, vid, cut: call('_cutWeek', prog), skip1: call('_partialWeek1', prog) };
}

/** Every text a drawn thing holds: the strings of its specs, markup stripped. */
function texts(x: unknown, acc: string[] = []): string[] {
  if (typeof x === 'string') { const t = plain(x); if (t && !/^(var\(|rgba?\(|#|[0-9.]+(px)?$|M[0-9]|middle$|start$|end$|none$|[0-9]+,[0-9]+$)/.test(t) && !/^[a-z-]+:[^ ]/.test(t)) acc.push(t); }
  else if (Array.isArray(x)) x.forEach((v) => texts(v, acc));
  else if (x && typeof x === 'object') Object.entries(x as Record<string, unknown>).forEach(([k, v]) => { if (k !== 'a' && k !== 'style' && k !== 'viewBox' && k !== 'color') texts(v, acc); else if (k === 'a') { /* attributes: drawn, not read */ } });
  return acc;
}
const title = (c: any): string => (c.kind === 'ledger' ? 'Lift Ledger' : plain(c.spec.title));

// ── A. What the screen draws ────────────────────────────────────────────────
say('# Today\'s Progress screen (measure, before the Expo app draws it)');
say();
say('Written by `cd tests && node measure/native-progress_today.ts` (read-only). Zone America/New_York.');
say();
say('## A. What the screen draws: the ten programs through the standard history');
say();
say('Each cell is the screen opened at the end of that stretch of the standard history (`tests/support/stored-state.ts` `life`).');
say();
say('| Program | Stretch | Log entries | Charts and cards, in order | Ledger: main, ladder, other, no load | Journal: weeks, entries | Texts held | The open wrote |');
say('|---|---|---|---|---|---|---|---|');
const tally = { screens: 0, blocks: {} as Record<string, number>, texts: 0, numbers: 0, wrote: 0, empty: 0, journalEntries: 0, journalKinds: { rpe: 0, swap: 0, jog: 0, notes: 0 } as Record<string, number>, mains: 0, ladder: 0, other: 0, unloaded: 0, mainCharts: 0, deadliftLines: 0 };
const lastOf: Record<string, any> = {};
for (const [pname, c] of Object.entries(PROGRAMS)) {
  life(walkable(c), CREATED, undefined, (stage, P) => {
    const pre = P.dump();
    P.ev('showProgressScreen()');
    const wrote = diff(pre, P.dump(), idsOf(P.dump()));
    P.ev('showProgressScreen()');
    const s = screen(P);
    if (!s) return;
    tally.screens++;
    if (wrote !== 'nothing') tally.wrote++;
    if (s.empty) tally.empty++;
    const led = s.charts.find((x: any) => x.kind === 'ledger');
    const lv = led ? led.view : null;
    const titles = s.charts.filter((x: any) => x.kind !== 'ledger').map(title);
    s.charts.forEach((x: any) => { const t = x.kind === 'ledger' ? 'Lift Ledger' : (x.kind === 'dot' ? 'dot: ' : 'card: ') + title(x); tally.blocks[t] = (tally.blocks[t] || 0) + 1; });
    const tx = texts(s.charts).concat(texts(s.journal));
    tally.texts += tx.length;
    tally.numbers += tx.filter((t) => /\d/.test(t)).length;
    const nMain = lv && lv.mains ? lv.mains.blocks.length : 0, nLad = lv && lv.ladder ? lv.ladder.rows.length : 0, nOther = lv && lv.other ? lv.other.rows.length : 0;
    const model = (P.ev('ledgerModel') as (a: unknown, b: unknown) => any)((P.ev('getExWeightsFor') as (id: string) => unknown)(s.vid), (P.ev('getDayHistFor') as (id: string) => unknown)(s.vid));
    tally.mains += model.mains.length; tally.ladder += model.ladder.length; tally.other += model.plain.length; tally.unloaded += model.unloaded.length;
    tally.mainCharts += lv && lv.mains ? lv.mains.blocks.filter((b: any) => b.chart).length : 0;
    tally.deadliftLines += model.mains.filter((m: any) => m.name === 'Deadlift' && m.series.some((p: any) => p.tag !== undefined)).length;
    const entries = s.journal.reduce((n: number, w: any) => n + w.entries.length, 0);
    tally.journalEntries += entries;
    s.journal.forEach((w: any) => w.entries.forEach((e: any) => { if (e.rpe) tally.journalKinds['rpe']!++; if (e.swap) tally.journalKinds['swap']!++; if (e.jogLines.length) tally.journalKinds['jog']!++; if (e.notes) tally.journalKinds['notes']!++; }));
    const nLogs = Object.keys((P.ev('getLogsFor') as (id: string) => object)(s.vid)).length;
    say('| ' + pname + ' | ' + stage + ' | ' + nLogs + ' | ' + (s.empty ? 'No data yet' : titles.join('; ') || 'none') + ' | ' + model.mains.length + ', ' + model.ladder.length + ', ' + model.plain.length + ', ' + model.unloaded.length
      + ' (drawn ' + nMain + ', ' + nLad + ', ' + nOther + ') | ' + s.journal.length + ', ' + entries + ' | ' + tx.length + ' | ' + wrote + ' |');
    lastOf[pname] = { s, model, cut: s.cut, skip1: s.skip1 };
  });
}
say();
say('- Screens drawn: ' + tally.screens + ' (' + Object.keys(PROGRAMS).length + ' programs, five stretches). ' + tally.empty + ' read No data yet (nothing logged).');
say('- The open wrote a key on ' + tally.wrote + ' of ' + tally.screens + ' screens (the fold of old exercise keys and the same day duplicate cleanup write `ia_exw_<id>` only when one changes a row).');
say('- Blocks drawn, across the ' + tally.screens + ' screens: ' + Object.keys(tally.blocks).sort().map((k) => '`' + k + '` ' + tally.blocks[k]).join(', ') + '.');
say('- Ledger rows across the screens: ' + tally.mains + ' main lifts (' + tally.mainCharts + ' drawn with a line, ' + tally.deadliftLines + ' the one Deadlift block of D255), ' + tally.ladder + ' Range Ladder, ' + tally.other + ' other, ' + tally.unloaded + ' with no load.');
say('- Journal entries across the screens: ' + tally.journalEntries + ' (with an RPE ' + tally.journalKinds['rpe'] + ', a swap ' + tally.journalKinds['swap'] + ', a jog ' + tally.journalKinds['jog'] + ', a note ' + tally.journalKinds['notes'] + ').');
say('- Texts held by the charts, the ledger and the journal: ' + tally.texts + ', of which ' + tally.numbers + ' carry a digit.');
say();

// ── A2. The run cards: the standard history logs no pace, so no run card but the ladder shows on it ─────────────
say('## A2. The run cards, on three weeks of runs logged with a pace and an effort');
say();
say('The standard history types a distance and minutes and marks the day, so no run is stored with a pace: of the run cards only the Long Run Ladder shows on it. This walk is the one `tests/integration/stored-state.test.ts` records for core\'s readers ("what Progress reads from three weeks of runs"): every run of weeks 1 to 3 logged with a distance, a pace and an effort (easy and recovery at RPE 3, the others at 7), one easy run credited to the bike, a jog written on the first rest day, then the screen on the fourth week\'s Wednesday.');
say();
say('| Program | Runs logged | Charts and cards, in order | Journal: weeks, entries (swap, jog) | Texts held |');
say('|---|---|---|---|---|');
const D7 = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
const cards2: Record<string, number> = {};
let texts2 = 0;
for (const [pname, c] of Object.entries(PROGRAMS)) {
  const P = new Phone().launch(CREATED);
  P.generate(walkable(c));
  const { first, start } = firstWeek(P, CREATED);
  let n = 0, bikeDone = false, jogDone = false;
  for (const w of [first, first + 1, first + 2]) {
    for (const d of training(P.launch(at(start, 7 * (w - 1), '06:30')), w)) {
      const day = P.day(w, d);
      if (!day.cardio || String(day.cardio.type).toLowerCase() !== 'run') continue;
      P.launch(at(start, 7 * (w - 1) + D7.indexOf(d as any)));
      P.open(w, d);
      const sub = String(day.cardio.subtype), easy = /recovery|easy/i.test(sub);
      const bike = !bikeDone && w === first + 1 && easy;
      const pace = (easy ? 600 : 480) + 7 * n, dist = +(3 + 0.4 * n).toFixed(1);
      P.type('cardioSwapWrap', '');
      P.ev(`(function(){var x=document.getElementById('cardioSwapWrap').dataset;x.planned='run';x.active=${JSON.stringify(bike ? 'bike' : 'run')};})()`);
      P.type('log_run_dist', dist.toFixed(1));
      P.type('log_run_pace', Math.floor(pace / 60) + ':' + String(pace % 60).padStart(2, '0') + '/mi');
      P.type('log_run_mins', String(Math.round(dist * pace / 60)));
      if (bike) P.type('log_bike_mins', '45');
      P.type('log_rpe', String(easy ? 3 : 7), true);
      P.mark(d as any, 'complete');
      if (bike) bikeDone = true;
      n++;
    }
    if (!jogDone) {
      const r = D7.find((d) => { const x = P.day(w, d as any); return x && x.rest; });
      // The rest sheet's own writer is row 5's; the journal reads the stored jog whoever wrote it.
      if (r) { P.ev(`(function(){var L=getLogs();var k='w${w}_${r}';L[k]=L[k]||{};L[k].restLog={run:{mins:'20',dist:'2.0',rpe:'3'}};L[k].ts=Date.now();saveLogs(L);})()`); jogDone = true; }
    }
  }
  P.launch(at(start, 7 * (first + 2) + 2, '08:00'));
  P.ev('showProgressScreen()');
  const s = screen(P);
  const tx = texts(s.charts).concat(texts(s.journal));
  texts2 += tx.length;
  s.charts.forEach((x: any) => { if (x.kind !== 'ledger') { const t = (x.kind === 'dot' ? 'dot: ' : 'card: ') + title(x); cards2[t] = (cards2[t] || 0) + 1; } });
  const je = s.journal.reduce((k: number, w: any) => k + w.entries.length, 0);
  const sw = s.journal.reduce((k: number, w: any) => k + w.entries.filter((e: any) => e.swap).length, 0), jg = s.journal.reduce((k: number, w: any) => k + w.entries.filter((e: any) => e.jogLines.length).length, 0);
  say('| ' + pname + ' | ' + n + ' | ' + (s.empty ? 'No data yet' : s.charts.filter((x: any) => x.kind !== 'ledger').map(title).join('; ') || 'none') + ' | ' + s.journal.length + ', ' + je + ' (' + sw + ', ' + jg + ') | ' + tx.length + ' |');
}
say();
say('- Cards drawn across the ten: ' + Object.keys(cards2).sort().map((k) => '`' + k + '` ' + cards2[k]).join(', ') + '. Texts held: ' + texts2 + '.');
say();

// ── B. What each tap writes ─────────────────────────────────────────────────
say('## B. What each tap writes (The Half Manny, a second program beside it)');
say();
{
  const { phone: P } = life(walkable(Object.values(PROGRAMS)[0]), CREATED);
  const first: string = P.ev('activeProgId');
  const step = (what: string, callText: string, code: string): void => {
    P.settle();   // what the launch queued (the reminder) is not this tap's
    const pre = P.dump(); const t0 = P.toasts.length;
    P.ev(code); P.settle();
    const s = screen(P);
    const bar = s && s.chips.bar ? (s.chips.bar.kind === 'confirm' ? 'the delete confirm' + (s.chips.bar.warn ? ' with the loads warning' : '') : 'the archived bar') : 'no bar';
    say('| ' + what + ' | `' + callText + '` | ' + diff(pre, P.dump(), [...new Set([...idsOf(pre), ...idsOf(P.dump())])]) + ' | ' + P.toasts.slice(t0).join(' / ') + ' | ' + (s ? (s.chips.chips ? s.chips.chips.length + ' chips, ' : 'no chips, ') + bar + ', showing ' + (s.vid === first ? 'the first program' : 'the second') : 'nothing drawn') + ' |');
  };
  say('| Step | The page\'s call | Keys written | Toast | The screen after |');
  say('|---|---|---|---|---|');
  step('The Progress tab', 'showProgressScreen()', 'showProgressScreen()');
  step('The estimator: a lift', '_setCalcLift("Squat")', '_setCalcLift("Squat")');
  // A second program, made the wizard's way; the first stays stored and becomes a chip.
  P.launch(at('2026-09-28', 0, '09:00'));
  P.generate(walkable(Object.values(PROGRAMS)[5]));
  const second: string = P.ev('activeProgId');
  step('The Progress tab, two programs', 'showProgressScreen()', 'showProgressScreen()');
  step('The first program\'s chip', 'setProgressView(id)', `setProgressView(${JSON.stringify(first)})`);
  step('The second program\'s chip', 'setProgressView(id)', `setProgressView(${JSON.stringify(second)})`);
  step('(The program list archives the first program: row 5)', 'archiveProg(id)', `archiveProg(${JSON.stringify(first)})`);
  step('The archived program\'s chip', 'setProgressView(id)', `setProgressView(${JSON.stringify(first)})`);
  step('The trash on the archived bar', 'askPurgeFromProgress(id)', `askPurgeFromProgress(${JSON.stringify(first)})`);
  step('Cancel', 'cancelProgressConfirm()', 'cancelProgressConfirm()');
  step('Restore', 'unarchiveProg(id); renderProgressScreen()', `unarchiveProg(${JSON.stringify(first)});renderProgressScreen()`);
  step('(Archived again)', 'archiveProg(id)', `archiveProg(${JSON.stringify(first)});setProgressView(${JSON.stringify(first)})`);
  step('The trash, then Delete Forever', 'deleteProg(id, true)', `askPurgeFromProgress(${JSON.stringify(first)});deleteProg(${JSON.stringify(first)},true)`);
}
say();

// ── C. The estimator ────────────────────────────────────────────────────────
say('## C. The estimator');
say();
say('- It reads the two typed numbers and the picked lift (a page global, `calcLift`, Deadlift at launch), and for the word after the number the active program\'s unit, else the wizard\'s draft, else pounds (not the viewed program\'s). It stores nothing.');
say('- `estimate1RM`: ' + [['185', '5'], ['225', '1'], ['100', '10'], ['', '5'], ['135', '0']].map(([w, r]) => '`' + w + '` × `' + r + '` reads ' + (estimate1RM(w!, r!) ?? 'nothing')).join(', ') + '.');
say();

// ── D. Readers and writers (read from the code, not computed) ───────────────
say('## D. What each piece reads and writes');
say();
say('| Piece | Reads | Through | Writes |');
say('|---|---|---|---|');
say('| The program chips and the archived bar | `ia_programs`, `ia_active`; for the delete warning every other program\'s config and `ia_exw_` | core `readPrograms`, `readActiveProgramId`, `liftLogFeedsOthers`; today\'s model `program-chips-model.ts` | Restore: `ia_programs` (core `writePrograms`, the page\'s `unarchiveProg` around it). Delete Forever: `ia_programs`, then the 15 families of `purgeProgData` removed (the page\'s `deleteProg`, `_handoffActiveFrom`, `purgeProgData`). A chip, the trash and Cancel store nothing |');
say('| The open | `ia_exw_<id>` | core `readLiftLog`, `foldExAliasKeys`, `dedupeExDayEntries` | `ia_exw_<id>` (core `writeLiftLog`) only when the fold or the cleanup changed a row: 0 of 50 screens here, 0 of 3 programs on the backup copy |');
say('| The four weekly dot charts | `ia_logs_<id>` (runs, rides, swims, the jog, RPE), the program\'s weeks and start | core `readDayLogs`; today\'s models `weeklySums`, `dot-chart-model.ts`; the page\'s `_partialWeek1` (5 lines, with core\'s calendar) | nothing |');
say('| The eight run cards | `ia_logs_<id>`, `ia_hist_<id>`, the program\'s config (goal, mile) | core `readDayLogs`, `readDayHistory`, and `state-progress.ts`: `longestRunByWeek`, `runPacesByClass`, `easyPaceByWeek`, `recoveryPaceByWeek`, `plannedAndLoggedMiles`, `progressCutWeek`, `mileFromRecoveryPace`, `halfFromMilePace`; the page\'s `easyVsPrescribed` and `_steadyCeilingFor` (51 lines, not in core); today\'s model `run-charts-model.ts` | nothing |');
say('| The Lift Ledger | `ia_exw_<id>`, `ia_hist_<id>`, the unit | core `readLiftLog`, `readDayHistory`, `exStoreKey`; the page\'s `ledgerModel` with `_slotOfEntry`, `_rxRangeFor`, `_setsOf`, `_deadliftLine` (159 lines, not in core); today\'s model `ledger-model.ts` | nothing |');
say('| The Session Journal | `ia_logs_<id>` | core `readDayLogs`; today\'s model `journalWeeks`; the page\'s `restLogLines` and `RPE_LABELS` | nothing |');
say('| The 1RM estimator | two typed numbers, the picked lift, the active program\'s unit | today\'s model `estimate1RM` | nothing (the picked lift is kept in memory until the app closes) |');
say();
say('- Today\'s models the Expo app would hold as today\'s files, byte for byte: `progress-model.ts` (272 lines), `program-chips-model.ts` (64), `charts/dot-chart-model.ts` (70), `charts/chart-card-model.ts` (63), `charts/run-charts-model.ts` (401), `charts/ledger-model.ts` (210).');
say('- `weeklySums` also works out each week\'s best bench, squat and deadlift load and a session count. Nothing on the screen draws them (V167 took their charts off). Carried as they are.');
say('- Delete Forever on Progress is offered on an archived program only, and archiving hands the active program on first, so the delete\'s own handoff has nothing to hand on there.');
say();
say('## E. On the simulator\'s copy of Mario\'s backup (counts only, 2026-11-17)');
say();
say('| Program | Weeks | Log entries | Chips, bar | Charts and cards | Ledger: main, ladder, other, no load | Journal: weeks, entries (RPE, swap, jog, note) | The open would write |');
say('|---|---|---|---|---|---|---|---|');
say('| The active one | 14 | 45 | 3, none | Weekly Running Mileage; Long Run Ladder; Is Your Easy Actually Easy?; Recovery Pace — Easy-Effort Trend; Mileage — Drift From Plan; Weekly Cycling Time; Average Session RPE | 8 (a Deadlift line of several hinges), 16, 5, 26 | 10, 37 (36, 1, 1, 2) | nothing |');
say('| A live one beside it | 12 | 33 | 3, none | Weekly Running Mileage; Long Run Ladder; Weekly Cycling Time; Average Session RPE | 5 (a Deadlift line), 2, 13, 7 | 7, 33 (31, 4, 2, 13) | nothing |');
say('| An archived one | 11 | 16 | 3, the archived bar | Weekly Running Mileage; Long Run Ladder; Mileage — Drift From Plan; Average Session RPE | 6, 10, 2, 6 | 4, 15 (14, 0, 1, 1) | nothing |');
say();
say('- Every piece of the screen shows on his data: the chips, the archived bar (so Restore and Delete Forever are in reach), six kinds of chart and card, the ledger with a Deadlift line, and a journal with swaps, jogs and notes. Not on his data: Same Effort, More Speed, Where This Is Heading, the easy bands fallback, the easy effort empty state, Weekly Swimming Volume.');
say();

writeFileSync(join(REPO, 'tests/measure/native-progress_today.md'), out.join('\n') + '\n');
console.log(out.join('\n'));
