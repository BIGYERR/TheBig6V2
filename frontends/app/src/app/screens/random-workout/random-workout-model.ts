// Random Workout, kept apart from Angular so the app's node --test suite reads it as it is (architecture phase E,
// step 11: the sheet moves from the legacy openRandom, reroll and buildRandFilterBar to the RandomWorkout component).
// The pools (RAND_POOLS), the done list (ia_wild_) and completing a Wildcard stay the legacy script's; this decides
// which pool is drawn from, which workout is drawn, in the legacy order of Math.random calls, and what the sheet shows.

/** One workout in a pool, as far as the sheet reads it. */
export interface RandWorkout {
  title: string;
  sections?: unknown[];
  cardio?: { type?: string; detail?: string };
  note?: string;
}

/** A Wildcard already done (the legacy ia_wild_ entries). */
export interface DoneWildcard {
  title: string;
}

/** The two filters, in the legacy order. */
export const RAND_FILTERS = [
  { id: 'mine', label: 'My Goal' },
  { id: 'all', label: 'See All' },
] as const;
export type RandFilter = (typeof RAND_FILTERS)[number]['id'];

/** The badge colour per program goal; a goal with none gets none, as before. */
export const RAND_COLORS: Readonly<Record<string, string>> = {
  strength: 'var(--lift)', hypertrophy: 'var(--hip)', fatloss: 'var(--run)', athletic: 'var(--bike)', balanced: 'var(--accent)',
  endurance: 'var(--run)', support_strength: 'var(--lift)', support_athletic: 'var(--bike)', support_prevention: 'var(--hip)',
};

/** The pool for a goal and filter: the goal's own (balanced when the goal has none), or every pool's workouts in order. */
export function randPool(pools: Readonly<Record<string, RandWorkout[]>>, goal: string, filter: RandFilter): RandWorkout[] {
  if (filter === 'mine') return pools[goal] || pools['balanced'] || [];
  return Object.values(pools).flat();
}

/** The legacy draw: a random index, drawn again while it repeats the last one and there is another to draw. */
export function randDraw(length: number, last: number, random: () => number): number {
  let idx: number;
  do idx = Math.floor(random() * length);
  while (idx === last && length > 1);
  return idx;
}

/** The weekday key of a date, the day a Wildcard drawn now would stand in for. */
export function dayKeyOf(now: Date): string {
  return ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][now.getDay()] || 'mon';
}

/** What the sheet shows for one workout. */
export interface RandView {
  title: string;
  done: boolean;
  badgeStyle: string;
  cardio: { blockCls: string; labelCls: string; type: string; detail: string } | null;
  note: string | null;
}

/** The sheet for a workout, as the legacy reroll drew it. */
export function randView(w: RandWorkout, done: readonly DoneWildcard[], goal: string): RandView {
  const color = RAND_COLORS[goal];
  let cardio: RandView['cardio'] = null;
  if (w.cardio) {
    const t = (w.cardio.type || '').toLowerCase();
    const kind = t.includes('swim') ? 'swim' : t.includes('run') ? 'run' : t.includes('bike') ? 'bike' : null;
    cardio = {
      blockCls: kind ? kind + '-block' : 'cardio-block',
      labelCls: 'cardio-label-' + (kind || 'general'),
      type: String(w.cardio.type),
      detail: String(w.cardio.detail),
    };
  }
  return {
    title: w.title,
    done: done.some((d) => d.title === w.title),
    badgeStyle: 'background:' + color + '22;color:' + color,
    cardio,
    note: w.note || null,
  };
}

/** The counter on This Week: the goal's own Wildcards done, out of how many it has. */
export function randCount(done: readonly DoneWildcard[], pools: Readonly<Record<string, RandWorkout[]>>, goal: string): string {
  const pool = pools[goal] || pools['balanced'] || [];
  return done.filter((d) => pool.some((w) => w.title === d.title)).length + '/' + pool.length;
}
