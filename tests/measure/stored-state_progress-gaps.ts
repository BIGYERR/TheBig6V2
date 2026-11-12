// Measure, before the sixth lift slice: what Progress's readers compute from the stores HALF_MANNY's standard history
// leaves (tests/support/stored-state.ts, life()), and what a golden record of it would hold. Read-only.
// Usage: node tests/measure/stored-state_progress-gaps.ts > <scratch>/progress-gaps.out 2>&1
// TypeScript because it drives the history through tests/support/stored-state.ts; node runs it with its types stripped.
process.env['TZ'] = 'America/New_York';
import { fixtures } from '../support/app.ts';
import { life } from '../support/stored-state.ts';

const { phone: P } = life(fixtures.HALF_MANNY, '2026-08-29T09:00:00');
const id: string = P.ev('activeProgId');
P.IA.ctx['__id'] = id;
const J = (code: string) => JSON.stringify(P.ev(code));
const logs: Record<string, any> = P.ev('getLogsFor(__id)');
const hist: Record<string, any> = P.ev('getDayHistFor(__id)');
const tw: number = P.ev('activeProg.totalWeeks');
console.log('program', id, 'weeks', tw, 'now', P.ev('new Date().toISOString()'));
console.log('log entries', Object.keys(logs).length, 'with a pace', Object.values(logs).filter((e) => e && e.run_pace).length,
  'with run_dist', Object.values(logs).filter((e) => e && +e.run_dist > 0).length,
  'rpe 3 to 4', Object.values(logs).filter((e) => e && +e.rpe >= 3 && +e.rpe <= 4).length,
  'swapTo', Object.values(logs).filter((e) => e && e.swapTo).length);
console.log('history days', Object.keys(hist).length, 'with a run', Object.values(hist).filter((d) => d && d.cardio && String(d.cardio.type).toLowerCase() === 'run').length);
for (const [k, e] of Object.entries(logs)) {
  const c = hist[k] && hist[k].cardio;
  console.log(' ', k, 'dist', e.run_dist, 'pace', e.run_pace, 'mins', e.run_mins, 'rpe', e.rpe, '|', c ? c.type + ' / ' + c.subtype + ' / mi ' + (c.dose && c.dose.mi) + ' tgt ' + (c.dose && c.dose.tgt) : 'no history cardio');
}
console.log('_cutWeek', J('_cutWeek(activeProg)'));
console.log('recoveryPaceWeekly', J('recoveryPaceWeekly(getLogsFor(__id),getDayHistFor(__id),activeProg.totalWeeks)'));
console.log('ladderWeekly', J('ladderWeekly(getLogsFor(__id),activeProg.totalWeeks,_cutWeek(activeProg),false)'));
console.log('runsByClass', J('runsByClass(getLogsFor(__id),getDayHistFor(__id),activeProg.totalWeeks)'));
console.log('easyEffortWeekly', J('easyEffortWeekly(getLogsFor(__id),getDayHistFor(__id),activeProg.totalWeeks)'));
console.log('plannedVsLogged', J('plannedVsLogged(getLogsFor(__id),getDayHistFor(__id),activeProg.totalWeeks,_cutWeek(activeProg),false)'));
console.log('seedFromPriorPrograms', J('seedFromPriorPrograms()'));
console.log('_purgeWarnsCrossProg', J('_purgeWarnsCrossProg(__id)'));
