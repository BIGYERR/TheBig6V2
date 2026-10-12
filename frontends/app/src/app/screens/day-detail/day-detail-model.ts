// A day's session sheet, kept apart from Angular so the app's node --test suite reads it as it is (architecture phase
// E, step 20: the sheet moves from the legacy openDetail to the DayDetail component). The body's pieces are still the
// legacy builders' markup; this decides their order and the header's words, as the legacy openDetail did.
import type { CardioCardView } from './cardio-card-model.ts';

/** The test-lift 1RM calculator's starting state: the lift, its name, the unit, and the logged test set if any. */
export interface E1rmCard {
  lift: string;
  liftLabel: string;
  unit: string;
  weight: string;
  reps: number;
}

/** The range-top nudge: the exercises whose last session hit the top of the range on every set. */
export interface RangeNudge {
  /** The first two names, shown in bold. */
  shown: string[];
  /** The words for the rest: " and N more", or nothing. */
  extra: string;
}

/** The body's pieces: the legacy builders' markup ('' when a builder has nothing), the calculator and the nudge. */
export interface BodyParts {
  /** The main section's markup and the rest's (the calculator sits between them). */
  main: string;
  e1rm: E1rmCard | null;
  rest: string;
  cardio: CardioCardView | null;
  note: string | undefined;
  nudge: RangeNudge | null;
  wildcardTag: string;
  log: string;
  /** The "logged but never marked" nudge, when the day has a log and no status. */
  logNudge: string;
}

/** One block of the body: a legacy builder's markup, the 1RM calculator, or the range-top nudge. */
export type BodyBlock =
  | { kind: 'html'; html: string }
  | { kind: 'e1rm'; card: E1rmCard }
  | { kind: 'nudge'; nudge: RangeNudge }
  | { kind: 'cardio'; card: CardioCardView };

/**
 * Lifting first only when lifting is the priority: on an event program or a support focus the cardio is the point of
 * the block and keeps the top. A day with no lifting is its cardio.
 */
export function liftsFirst(hasSections: boolean, primaryPath: string | undefined, liftingFocus: string | undefined): boolean {
  return hasSections && !(primaryPath === 'event' || /^support_/.test(String(liftingFocus || '')));
}

/** The body in the legacy order: the Wildcard tag, the range nudge, the work, the note, the log, the log nudge. */
export function detailBody(p: BodyParts, first: boolean, hasSections: boolean): BodyBlock[] {
  const html = (h: string): BodyBlock[] => (h ? [{ kind: 'html', html: h }] : []);
  const lifts: BodyBlock[] = hasSections ? [...html(p.main), ...(p.e1rm ? [{ kind: 'e1rm' as const, card: p.e1rm }] : []), ...html(p.rest)] : [];
  const cardio: BodyBlock[] = p.cardio ? [{ kind: 'cardio', card: p.cardio }] : [];
  const blocks: BodyBlock[] = first ? [...lifts, ...cardio] : [...cardio, ...lifts];
  if (p.note) blocks.push(...html('<div class="note-block">' + p.note + '</div>'));
  if (p.nudge) blocks.unshift({ kind: 'nudge', nudge: p.nudge });
  if (p.wildcardTag) blocks.unshift(...html(p.wildcardTag));
  return [...blocks, ...html(p.log), ...html(p.logNudge)];
}

/** The legacy _epley: a single is itself; otherwise weight × (1 + reps/30), rounded; nothing without a weight. */
export function epley(weight: number, reps: number): number {
  if (!(weight > 0)) return 0;
  return reps <= 1 ? Math.round(weight) : Math.round(weight * (1 + reps / 30));
}

/** The legacy e1rmCalcHTML's start: the logged test set prefills the weight and its first set's reps (1 to 5, else 3). */
export function e1rmCard(testLift: string | undefined, unit: string, last: { weight?: string | number; setsDone?: (string | number)[] } | undefined): E1rmCard | null {
  if (!testLift) return null;
  let weight = '';
  let reps = 3;
  if (last && last.weight) {
    weight = String(last.weight);
    if (last.setsDone && last.setsDone.length) reps = Math.min(5, Math.max(1, +last.setsDone[0]! || 3));
  }
  return { lift: testLift, liftLabel: ({ bench: 'bench', squat: 'squat', deadlift: 'deadlift' } as Record<string, string>)[testLift] || testLift, unit, weight, reps };
}

/** The legacy rangeTopNudgeHTML's reading: each "sets×lo–hi" item whose last logged session reached hi on every set. */
export function rangeNudge(items: { name?: string; detail?: string }[], lastOf: (name: string) => { setsDone?: (string | number)[] } | undefined): RangeNudge | null {
  const names: string[] = [];
  for (const it of items) {
    if (!it || !it.name || !it.detail) continue;
    const m = /^(\d+)×(\d+)–(\d+)( each)?( @ RPE .*)?$/.exec(it.detail);
    if (!m) continue;
    const sets = +m[1]!, hi = +m[3]!;
    const ent = lastOf(it.name);
    if (!ent || !ent.setsDone || ent.setsDone.length < sets) continue;
    const done = ent.setsDone.slice(0, sets).map((x) => +x || 0);
    if (done.length >= sets && done.every((x) => x >= hi)) names.push(it.name);
  }
  if (!names.length) return null;
  return { shown: names.slice(0, 2), extra: names.length > 2 ? ' and ' + (names.length - 2) + ' more' : '' };
}

/** Whether a day's log holds anything the athlete wrote: a note, or any run, ride or swim figure. */
export function hasLogged(le: Record<string, unknown> | undefined): boolean {
  if (!le) return false;
  const notes = le['notes'];
  return !!((typeof notes === 'string' && notes.trim()) || le['run_dist'] || le['run_pace'] || le['run_mins'] || le['run_reps'] || le['run_rep_time'] || le['bike_mins'] || le['swim_yards']);
}

/** The "logged but never marked" nudge's markup, its button marking the day done. */
export function logNudge(dayKey: string, title: string | undefined, icon: string): string {
  const esc = (title || '').replace(/'/g, "\\'");
  return '<div class="log-nudge"><span>' + icon + ' You logged this one but never marked it.</span><button class="log-nudge-btn" onclick="handleDayStatus(\'' + dayKey + '\',\'' + esc + '\',\'complete\')">Mark Done ✓</button></div>';
}

/** The header's logged count, or none when the day has nothing to log. */
export function loggedCount(p: { done: number; total: number }): string | null {
  return p.total > 0 ? p.done + ' / ' + p.total + ' LOGGED' : null;
}

/** One of the foot's two buttons: its id, its classes, its words (with the small undo line or not), and the status it sets. */
export interface FootButton {
  id: string;
  cls: string;
  label: string;
  undo: boolean;
  status: 'complete' | 'skipped';
}

/**
 * The legacy statusFootHTML: the big button carries the day's status (and undoes it), the small one under it the other.
 * A pending day offers Done big and Skip small.
 */
export function statusFoot(cur: string | null | undefined): [FootButton, FootButton] {
  if (cur === 'skipped') {
    return [
      { id: 'statusBtn_skipped', cls: 'day-done skipped', label: 'Skipped ✕ ', undo: true, status: 'skipped' },
      { id: 'statusBtn_complete', cls: 'day-skip', label: 'Done', undo: false, status: 'complete' },
    ];
  }
  const done = cur === 'complete';
  return [
    { id: 'statusBtn_complete', cls: done ? 'day-done is' : 'day-done', label: done ? 'Done ✓ ' : 'Done', undo: done, status: 'complete' },
    { id: 'statusBtn_skipped', cls: 'day-skip', label: 'Skip', undo: false, status: 'skipped' },
  ];
}
