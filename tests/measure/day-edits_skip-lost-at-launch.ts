// day-edits: does a skip survive the next launch? Read-only (measure). Found on the simulator while the Expo deck's
// skip was looked at (Post-v0.262.3): a move skipped on Thursday was back on the card after a relaunch, with Monday
// of the same week already marked done. The launch is core's (state-refresh.ts), so today's page was asked the same.
//
// On today's page, in the VM harness (tests/support/stored-state.ts), HALF_MANNY: a move is skipped on the last
// training day of a week, the app is launched again the same evening, and the day is read. Twice: with no day of the
// week trained, and with the week's first day trained and marked done before the skip.
//
// The cause, read in core/src/engine/state-refresh.ts: the launch cuts the freeze at one past the highest week
// holding any completion, log, snapshot or lift (`_cut = max(_dateCut, _maxTouched + 1)`) and drops the day edits of
// every week under that cut (pruneDayEditsBefore), because a touched day's snapshot already holds its edits. But the
// freeze is per day: an untouched day of that week is rebuilt, has no snapshot, and its edit is gone.
//
// Usage: node tests/measure/day-edits_skip-lost-at-launch.ts   (writes tests/measure/day-edits_skip-lost-at-launch.md)
process.env['TZ'] = 'America/New_York';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { REPO, fixtures } from '../support/app.ts';
import { Phone, at, cards, firstWeek, trainDay, training } from '../support/stored-state.ts';

const CREATED = '2026-08-29T09:00:00';
const DAYS7 = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const out: string[] = [];
out.push('# Day edits: a skip on a day not yet trained, and the next launch');
out.push('');
out.push('Written by `node tests/measure/day-edits_skip-lost-at-launch.ts` (read-only). Today\'s page in the VM harness, HALF_MANNY.');
out.push('');
out.push('| Before the skip | The move skipped | In the session | After a launch the same evening |');
out.push('|---|---|---|---|');
for (const trainFirst of [false, true]) {
  const P = new Phone().launch(CREATED);
  P.generate(fixtures.HALF_MANNY);
  const { first, start } = firstWeek(P, CREATED);
  const days = training(P.launch(at(start, 7 * (first - 1), '06:30')), first);
  const a = days[0]!, b = days[days.length - 1]!;
  P.launch(at(start, 7 * (first - 1) + DAYS7.indexOf(a)));
  if (trainFirst) trainDay(P, first, a as never, 1);
  P.open(first, b as never);
  const c = cards(P.day(first, b as never)).pop()!;
  P.ev(`skipExercise(${JSON.stringify(c.name)});`);
  const id: string = P.ev('activeProgId');
  const skipped = (): string => ((P.day(first, b as never).sections as any[]).some((s) => s.items.some((i: any) => i.name === c.name && i._skipped)) ? 'skipped' : '**not skipped**');
  const edits = (): string => '`' + P.dump()['ia_edits_' + id] + '`';
  const during = skipped() + ', ' + edits();
  P.launch(at(start, 7 * (first - 1) + DAYS7.indexOf(a), '21:00'));
  out.push('| ' + (trainFirst ? 'week ' + first + ', ' + a + ' trained and marked done' : 'no day of week ' + first + ' trained') + ' | ' + c.name + ', on ' + b + ' | ' + during + ' | ' + skipped() + ', ' + edits() + ' |');
}
out.push('');
out.push('- The same launch is the Expo app\'s (`refreshStoredProgram`), so the beta does the same, and is held equal to the page on it.');
out.push('- Not ruled. A skip made in the session that trains the day is kept: the day\'s snapshot takes it in.');
writeFileSync(join(REPO, 'tests/measure/day-edits_skip-lost-at-launch.md'), out.join('\n') + '\n');
console.log(out.join('\n'));
