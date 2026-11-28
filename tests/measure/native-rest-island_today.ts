// native-rest-island: today's rest stopwatch and what it tells the island, before the Expo app gets its own
// (MIGRATION.md phase 4, the first build session; D233, D295). Read-only (measure).
//
// It runs today's page in the VM harness on the rest timer's own rig (tests/support/rest-timer.ts: two fake clocks,
// The Half Manny stored as the active program, a stand-in for window.iaIsland that logs every call), and for each of
// three states of the stopwatch (at zero; running, 92 s in; stopped, holding 92 s) makes each thing the app can do
// to it, then prints what the island was sent and what the stopwatch holds.
//
// Usage: cd tests && node measure/native-rest-island_today.ts   (prints the table; the report,
// tests/measure/native-rest-island_today.md, holds it with the reading of the Swift)
// TypeScript for the harness imports; node runs it with its types stripped. Not in the tests' type check.
process.env['TZ'] = 'America/New_York';
import { islandStub, loadWithIsland, stopwatchRig } from '../support/rest-timer.ts';
import type { IslandCall, StopwatchRig } from '../support/rest-timer.ts';

const T = 92000;

/** A state the stopwatch is put in before an action. The day's sheet is open or shut as the action needs. */
const STATES: [string, (r: StopwatchRig) => void][] = [
  ['at zero', () => {}],
  ['running, 92 s in', (r) => { r.seam('rtToggleBtn()'); r.adv(T, 7); }],
  ['stopped, holding 92 s', (r) => { r.seam('rtToggleBtn()'); r.adv(T, 7); r.seam('rtToggleBtn()'); }],
];

/** What the app can do to the stopwatch. `open` says whether the day's sheet is opened before the state is set. */
const ACTIONS: [string, boolean, (r: StopwatchRig) => string | null][] = [
  ['Start or Stop (the card\'s button)', false, (r) => r.seam('rtToggleBtn()')],
  ['Reset (the card\'s button)', false, (r) => r.seam('rtResetBtn()')],
  ['a day opened from This Week', false, (r) => r.open()],
  ['the open day drawn again', true, (r) => r.seam("openDetail('" + r.day + "',activeProg.weeks[" + r.week + "]['" + r.day + "'])")],
  ['Back from the day', true, (r) => r.seam('closeDetail()')],
  ['Done', true, (r) => r.seam("handleDayStatus('" + r.day + "','x','complete')")],
  ['Skip', true, (r) => r.seam("handleDayStatus('" + r.day + "','x','skipped')")],
  ['a tab move, to Progress', false, (r) => r.seam("showScreen('screenProgress')")],
  ['Home (the tab is hidden)', false, (r) => r.seam("showScreen('screenHome')")],
];

const show = (calls: IslandCall[], t0: number): string =>
  calls.length === 0
    ? 'nothing'
    : calls.map((c) => (c[0] === 'run' ? 'run(tap ' + (((c[1] as number) - t0) / 1000) + ' s)' : c[0] === 'stop' ? 'stop(' + (c[1] as number) / 1000 + ' s)' : 'end()')).join(', ');

const rows: string[] = [];
let errors = 0;
for (const [action, open, act] of ACTIONS) {
  const cells: string[] = [];
  for (const [, set] of STATES) {
    const r = stopwatchRig();
    const s = r.attach(islandStub());
    if (open) r.open();
    set(r);
    const mark = s.log.length;
    // The wall clock at the tap: the day's 10:00 and the 92 s the state ran or held (nothing while at zero).
    const tap = r.dayStart() + (mark ? T : 0);
    const e = act(r);
    if (e) { errors++; cells.push('THREW ' + e); continue; }
    const after = s.log.slice(mark);
    const running = r.tab().toggle === 'Stop';
    cells.push(show(after, tap) + ' → ' + (running ? 'running' : 'stopped') + ' at ' + r.now() / 1000 + ' s');
    r.seam('popClose()');
  }
  rows.push('| ' + action + ' | ' + cells.join(' | ') + ' |');
}

// The undo of a status: Done, then the same tap again on the day opened afresh, with a rest started in between.
{
  const r = stopwatchRig();
  const s = r.attach(islandStub());
  r.open();
  r.seam("handleDayStatus('" + r.day + "','x','complete')");
  r.seam('popClose()');
  r.open();
  r.seam('rtToggleBtn()');
  r.adv(T, 7);
  const mark = s.log.length;
  const e = r.seam("handleDayStatus('" + r.day + "','x','complete')");
  rows.push('| the undo of Done, on a running rest | | ' + (e ? 'THREW ' + e : show(s.log.slice(mark), r.dayStart() + T) + ' → ' + (r.tab().toggle === 'Stop' ? 'running' : 'stopped') + ' at ' + r.now() / 1000 + ' s') + ' | |');
  if (e) errors++;
}

// A launch with the plugin there.
const boot = islandStub();
loadWithIsland(boot);

console.log('| What happens | at zero | running, 92 s in | stopped, holding 92 s |');
console.log('|---|---|---|---|');
for (const row of rows) console.log(row);
console.log('');
console.log('A launch with the plugin present sends: ' + show(boot.log, 0));
console.log('rows ' + rows.length + ', errors ' + errors);
if (errors) process.exit(1);
