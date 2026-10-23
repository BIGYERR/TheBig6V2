// lsd-pace: P-LSDPACE-6 items (a) and (b) on the current page. Read-only (measure). Feature: docs/decisions/lsd-pace.md.
// Usage: node tests/measure/lsd-pace_time-only.ts > <scratch>/lsd-pace_time-only.out 2>&1
// TypeScript because it drives the day card through tests/support/log-form.ts (the app's own openDayKey, wheels,
// logCardio and readers on a virtual clock); node runs it with its types stripped. Not in the tests' type check.
// For each host run, W1 of a program stored as starting Monday 2026-09-21 with the clock on that Monday:
//   dist form (miles prescribed): roll the time only to 0:36:00, read the strip and readout, Log, read what is stored;
//   time form (minutes prescribed): roll the miles only to 3.00, the same.
// Then the readers of the stored entry: the regime (cardioEntryLive), the week's MILES tile, Progress W1 mileage,
// plannedVsLogged W1, ladderWeekly W1, seedFromPriorPrograms' longest run.
// Oracles, typed by hand: 36 min over the plan's miles (3 mi is 720 s/mi, 12:00/mi); 3.00 mi over a 30 min plan is
// 600 s/mi, 10:00/mi. Nothing the athlete did not roll is expected to store under coach r2 (P-LSDPACE-3).
import { fixtures } from '../support/app.ts';
import { logForm, mkCfg, cardioOf } from '../support/log-form.ts';

const J = JSON.stringify;
const out = (s: string) => console.log(s);
const C = logForm('lsd-pace');
out('page ia-version ' + (C.IA as any).version);
const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const STAND = { name: 'PRT TING', primaryPath: 'goal', eventTargeted: false, cardioTypes: ['run'],
  cardioGoals: { run: { id: 'run_pace_goal', label: 'Hit a Pace / Time Goal', mileBestMins: '8', mileBestSecs: '15', mileBestSrc: { kind: 'entered' }, targetDist: '1.5', targetMins: '11', targetSecs: '0', paceUnit: 'mi' } },
  liftingFocus: 'balanced', experience: 'intermediate', ageBracket: '18-35', equipment: 'home_full', unit: 'lbs',
  restDays: ['sun', 'wed'], days: DAYS.slice(), bench: 185, squat: 255, deadlift: 315, startDate: '2026-09-21', seed: 24865 };
const HOSTS: [string, any][] = [
  ['pace 1.5 mi 12:00', mkCfg([['run', 'run_pace_goal', { targetDist: '1.5', targetMins: '12', targetSecs: '0', paceUnit: 'mi' }]], 'balanced', 'intermediate', 'full_gym', 76308)],
  ['mile 8:00', mkCfg([['run', 'run_mile_time', { targetMins: '8', targetSecs: '0' }]], 'balanced', 'intermediate', 'full_gym', 76308)],
  ['1.5 mi under 10', mkCfg([['run', 'run_15_under10', { targetMins: '10', targetSecs: '0' }]], 'balanced', 'intermediate', 'full_gym', 76308)],
  ['PRT STAND', STAND],
  ['HALF_MANNY (NRC half)', fixtures.HALF_MANNY],
  ['NRC 10K', mkCfg([['run', 'run_10k']], 'support_prevention', 'intermediate', 'full_gym', 76308)],
  ['NRC 5K', mkCfg([['run', 'run_5k']], 'support_prevention', 'intermediate', 'full_gym', 76308)],
  ['run_base', mkCfg([['run', 'run_base', { baselineDist: '1', baseline: '1mi' }]], 'balanced', 'intermediate', 'full_gym', 76308)],
];

function milesTile(): string {
  C.ev('renderWeekView()');
  for (const k in C.els) {
    const h = C.els[k] && C.els[k].innerHTML;
    const m = typeof h === 'string' && h.match(/<div class="wk-stat-num" style="color:var\(--run\)">([^<]*)<\/div><div class="wk-stat-lbl">MILES<\/div>/);
    if (m) return m[1] as string;
  }
  return '(no MILES tile)';
}
function readers(p: any, d: string) {
  const logs = JSON.parse(C.logs());
  const hist = JSON.parse(C.histRaw() || '{}');
  const tw = Object.keys(p.weeks).length;
  const e = C.entry(1, d) || {};
  let pv: any = null, lad: any = null, seed: any = null;
  try { pv = C.ev('plannedVsLogged')(logs, hist, tw, 0, false); } catch (err) { pv = 'ERR ' + (err as Error).message; }
  try { lad = C.ev('ladderWeekly')(logs, tw, 0, false); } catch (err) { lad = 'ERR ' + (err as Error).message; }
  try { seed = C.ev('seedFromPriorPrograms')(C.now()); } catch (err) { seed = 'ERR ' + (err as Error).message; }
  const c = C.chart('Weekly Running Mileage', 1);
  const pace: Record<string, unknown> = {};
  for (const fn of ['recoveryPaceWeekly', 'runsByClass', 'easyEffortWeekly']) {
    try { const v = C.ev(fn)(logs, hist, tw); pace[fn] = v && typeof v === 'object' ? J(v[1] !== undefined ? v[1] : v).slice(0, 120) : J(v); } catch (err) { pace[fn] = 'ERR ' + (err as Error).message; }
  }
  try { pace['recoveryEntry'] = J(C.ev('_recoveryPaceEntry')('w1_' + d, e, hist, tw)); } catch (err) { pace['recoveryEntry'] = 'ERR ' + (err as Error).message; }
  return {
    pace: J(pace),
    live: C.ev('cardioEntryLive')(e, 'run'),
    milesTile: milesTile(),
    progressW1: c.drawn ? c.v : '(no chart)',
    pvlW1: pv && typeof pv === 'object' && pv[1] ? J(pv[1]) : J(pv),
    ladderW1: lad && typeof lad === 'object' ? lad[1] : lad,
    seedMaxDist: seed && typeof seed === 'object' ? seed.maxDist : J(seed),
  };
}

for (const [tag, cfg] of HOSTS) {
  let p: any;
  try { p = C.build(cfg); } catch (err) { out('\n## ' + tag + ': BUILD FAILED ' + (err as Error).message); continue; }
  C.use(p);
  const w1 = p.weeks[1] || p.weeks['1'];
  const hits: [string, any][] = [];
  for (const d of DAYS) {
    const c = cardioOf(w1 && w1[d]);
    if (!c || String(c.type).toLowerCase() !== 'run') continue;
    const dose = C.dose(c);
    if (!dose || (dose.k !== 'dist' && dose.k !== 'time')) continue;
    hits.push([d, { c, dose }]);
  }
  out('\n## ' + tag + ' (seed ' + cfg.seed + '): W1 run days with a dist or time dose: ' + (hits.map(([d, x]) => d + ' ' + x.dose.k + (x.c.isNRC ? ' NRC' : ' NSW') + ' ' + String(x.c.subtype || '').replace(/\s*\(.*$/, '').slice(0, 26)).join(', ') || 'none'));
  for (const [d, { c, dose }] of hits) {
    C.wipe(); C.unforce();
    C.open(1, d);
    const form0 = C.form();
    const i0 = form0.indexOf('Planned');
    const strip = i0 < 0 ? '(no strip)' : form0.slice(Math.max(0, i0 - 300), i0 + 200).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().replace(/^.*?(Run|Ride|Swim)\b/, '$1').slice(0, 90);
    if (dose.k === 'dist') C.moveTo('log_run_mins', [[0, '0'], [1, '36'], [2, '0']]);
    else C.moveTo('log_run_dist', [[0, '3'], [1, '0'], [2, '0']]);
    const readout = C.derived();
    C.log();
    const toast = C.toast();
    const e = C.entry(1, d) || {};
    const r = readers(p, d);
    out('  ' + d + ' ' + (c.isNRC ? 'NRC ' : 'NSW ') + String(c.subtype || '').replace(/\s*\(.*$/, '') + ' dose ' + J({ k: dose.k, mi: dose.mi, mins: dose.mins, tgt: dose.tgt, key: dose.key }));
    out('    gesture: ' + (dose.k === 'dist' ? 'time only 0:36:00' : 'miles only 3.00') + ' | strip "' + strip + '" | readout "' + readout.replace(/\s+/g, ' ').trim() + '" | toast "' + toast + '"');
    out('    stored: run_dist ' + J(e.run_dist) + ' run_mins ' + J(e.run_mins) + ' run_pace ' + J(e.run_pace) + ' | live ' + r.live + ' | MILES tile ' + r.milesTile + ' | Progress W1 ' + r.progressW1 + ' | plannedVsLogged W1 ' + r.pvlW1 + ' | ladder W1 ' + r.ladderW1 + ' | seed maxDist ' + r.seedMaxDist);
    out('    pace readers: ' + r.pace);
    C.back();
  }
}
out('\nerrors during the run: ' + (C.errs.length ? C.errs.slice(0, 5).join(' | ') : 'none'));
