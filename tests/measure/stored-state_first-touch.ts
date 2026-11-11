// stored-state: can any tap change a day that already has a snapshot (ia_hist_) before that day is snapshotted again?
// Read-only (measure). The question behind the open break "history, first touch" in stored-state_red-on-break.md: the
// guard in snapshotDay (a day's first snapshot is never overwritten) changed no golden record when it was removed.
//
// The one candidate the reading found is the rest sheet's Move: restMoveCandidates offers a day with no completion and
// no logged field, and a logged lift (ia_exw_), a set draft and a part skipped alone are none of those, yet each
// snapshots the day. This walks HALF_MANNY's week 1 through that: a lift logged on the first training day, that day's
// session moved onto the week's first rest day after it, the moved session trained, with a launch between each.
// After every step it prints, for each day that has a snapshot, whether the day in hand still equals its snapshot.
//
// Usage: node tests/measure/stored-state_first-touch.ts            (the built page)
//        IA_APP=<page> node tests/measure/stored-state_first-touch.ts   (another body, e.g. the page with the guard removed)
// Its last line is the sha256 of every ia_ key at the end, so two bodies can be compared.
// TypeScript for the harness imports; node runs it with its types stripped. Not in the tests' type check.
process.env['TZ'] = 'America/New_York';
import { createHash } from 'node:crypto';
import { fixtures } from '../support/app.ts';
import { Phone, at, cards, resting, training, DAYS } from '../support/stored-state.ts';

const CREATED = '2026-08-29T09:00:00', START = '2026-08-31';
const P = new Phone().launch(CREATED);
const id = P.generate(fixtures.HALF_MANNY as any);
const out: string[] = [];
const say = (s: string) => { out.push(s); };
const hist = (): Record<string, any> => JSON.parse(P.dump()['ia_hist_' + id] || '{}');
const shape = (x: any): string => !x ? 'none' : x.rest ? (x.moved ? 'rest (moved to ' + x.movedTo + ')' : 'rest') : (x.title || 'training') + (x.movedFrom ? ' (moved from ' + x.movedFrom + ')' : '');
function picture(step: string): void {
  say('');
  say('## ' + step);
  const h = hist();
  say('| Day | In hand | Snapshot | In hand equals its snapshot |');
  say('|---|---|---|---|');
  for (const d of DAYS) {
    const day = P.day(1, d), s = h['w1_' + d];
    say('| ' + d + ' | ' + shape(day) + ' | ' + (s ? shape(s) : 'none') + ' | ' + (s ? (JSON.stringify(day) === JSON.stringify(s) ? 'yes' : '**no**') : '') + ' |');
  }
}

P.launch(at(START, 0));
const X = training(P, 1)[0]!;
const R = resting(P, 1).find((r) => DAYS.indexOf(r) > DAYS.indexOf(X))!;
say('# Stored state: can a tap change a day after its snapshot, before its next one?');
say('');
say('Written by `tests/measure/stored-state_first-touch.ts` on HALF_MANNY, week 1. X is ' + X + ' (the first training day), R is ' + R + ' (the first rest day after it).');

// 1. One lift logged on X, no status. The day is snapshotted and nothing in ia_comp_ or the log's fields says so.
P.open(1, X);
const c = cards(P.day(1, X))[0]!;
P.logLift(c.name, c.detail, [c.reps, c.reps], [135, 140]);
const logEntry = JSON.parse(P.dump()['ia_logs_' + id] || '{}')['w1_' + X];
say('');
say('After one lift logged on ' + X + ' (' + c.name + '): snapshot ' + (hist()['w1_' + X] ? 'kept' : 'NOT kept') + ', completion ' + (JSON.parse(P.dump()['ia_comp_' + id] || '{}')['w1_' + X] ? 'written' : 'none') + ', log entry ' + JSON.stringify(logEntry ?? null) + '.');
picture('1. a lift logged on ' + X);

// 2. On R, the rest sheet's Move. Is X offered?
P.launch(at(START, DAYS.indexOf(R), '10:00'));
P.ev(`openRestSheet(1,${JSON.stringify(R)},'move');`);
const offered: string[] = JSON.parse(P.ev('JSON.stringify(restMoveCandidates(1).map(function(x){return x.day;}))'));
say('');
say('On ' + R + ', the rest sheet offers these sessions to move: ' + offered.join(', ') + '. ' + X + ' (a lift already logged) is ' + (offered.includes(X) ? '**offered**' : 'not offered') + '.');
if (offered.includes(X)) {
  P.ev(`_rdSet('pick',${JSON.stringify(X)});applyRestMove();`); P.settle();
  picture('2. ' + X + ' moved onto ' + R + ' (same launch)');

  // 3. A launch with R not yet touched.
  P.launch(at(START, DAYS.indexOf(R), '12:00'));
  picture('3. the next launch, ' + R + ' not yet trained');

  // 4. The moved session trained on R (one lift), then a launch.
  P.open(1, R);
  const c2 = cards(P.day(1, R))[1] || cards(P.day(1, R))[0]!;
  P.logLift(c2.name, c2.detail, [c2.reps, c2.reps], [95, 100]);
  picture('4. the moved session trained on ' + R + ' (same launch)');
  P.launch(at(START, DAYS.indexOf(R) + 1, '07:00'));
  picture('5. the launch after that');
  const both = [X, R].map((d) => P.day(1, d)).every((x) => x && !x.rest);
  say('');
  say('At that launch ' + X + ' and ' + R + ' ' + (both ? '**both hold the session**: the day it was moved from is a training day again.' : 'do not both hold the session.'));
  // 6. Can X be touched again, and does it then differ from its snapshot?
  const x = P.day(1, X);
  if (x && !x.rest) {
    P.open(1, X);
    const before = P.dump()['ia_hist_' + id];
    P.ev(`snapshotDay(1,${JSON.stringify(X)});`);
    say('');
    say('A further touch of ' + X + ': its day ' + (JSON.stringify(x) === JSON.stringify(hist()['w1_' + X]) ? 'equals' : '**differs from**') + ' its snapshot, and the history key is ' + (P.dump()['ia_hist_' + id] === before ? 'unchanged' : '**changed**') + '.');
  }
}
const all = P.dump();
say('');
say('Every ia_ key at the end, sha256: `' + createHash('sha256').update(JSON.stringify(all)).digest('hex') + '`');
process.stdout.write(out.join('\n') + '\n');
