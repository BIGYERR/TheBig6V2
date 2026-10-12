// A day's session sheet, kept apart from Angular so the app's node --test suite reads it as it is (architecture phase
// E, step 20: the sheet moves from the legacy openDetail to the DayDetail component). The body's pieces are still the
// legacy builders' markup; this decides their order and the header's words, as the legacy openDetail did.

/** The body's pieces, each a legacy builder's markup ('' when it has nothing). */
export interface BodyParts {
  /** The main section, then the rest (the 1RM calculator between them on a test-lift day). */
  lifts: string;
  cardio: string;
  note: string | undefined;
  rangeNudge: string;
  wildcardTag: string;
  log: string;
  /** The "logged but never marked" nudge, when the day has a log and no status. */
  logNudge: string;
}

/**
 * Lifting first only when lifting is the priority: on an event program or a support focus the cardio is the point of
 * the block and keeps the top. A day with no lifting is its cardio.
 */
export function liftsFirst(hasSections: boolean, primaryPath: string | undefined, liftingFocus: string | undefined): boolean {
  return hasSections && !(primaryPath === 'event' || /^support_/.test(String(liftingFocus || '')));
}

/** The body in the legacy order: the Wildcard tag, the range nudge, the work, the note, the log, the log nudge. */
export function detailBody(p: BodyParts, first: boolean, hasSections: boolean): string {
  let html = first ? p.lifts + p.cardio : p.cardio + (hasSections ? p.lifts : '');
  if (p.note) html += '<div class="note-block">' + p.note + '</div>';
  if (p.rangeNudge) html = p.rangeNudge + html;
  if (p.wildcardTag) html = p.wildcardTag + html;
  return html + p.log + p.logNudge;
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
