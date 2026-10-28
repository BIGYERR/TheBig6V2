// The session sheet's small marks, kept apart from Angular so the app's node --test suite reads them as they are
// (architecture phase E: the last legacy markup in the sheet, apart from the cardio fields). Each word and color is the
// legacy builders': modTagsHTML and travelTagHTML (the header's tags), wildcardTagHTML (the Wildcard tag), and
// _benchStripHTML (the retest strip on a benchmark retest). The data they read stays the legacy script's.

/** A tag in the sheet's header: its words and its two colors. */
export interface TagChip {
  label: string;
  color: string;
  bg: string;
}

/** The legacy modTagsHTML: every tag but rest, in its palette color, or the fallback color for a tag with none. */
export function modTags(tags: readonly string[] | undefined, pal: Record<string, readonly [string, string] | undefined>, meta: Record<string, { label?: string } | undefined>): TagChip[] {
  return (tags || []).filter((t) => t !== 'rest').map((t) => {
    const p = pal[t] || ['var(--mark)', 'rgba(var(--mark-rgb),0.12)'];
    return { label: (meta[t] && meta[t]!.label) || t, color: p[0], bg: p[1] };
  });
}

/** The legacy wildcardTagHTML's words under WILDCARD DONE, or null when no Wildcard was done in the day's place. */
export function wildcardSub(on: unknown, day: { rest?: unknown; title?: string } | null | undefined): string | null {
  if (!on) return null;
  return day && day.rest ? 'Rest day. The streak sits this one out.' : ((day && day.title) || 'Your session') + ' is still on the board.';
}

/** A benchmark run logged in a week: its distance, its minutes, its seconds per mile. */
export interface BenchEntry {
  dist: number;
  mins: number;
  sec: number;
}

/** One line of the retest strip: its bold lead, if any, and the words after it. */
export interface BenchNote {
  lead: string | null;
  text: string;
}

/**
 * The legacy _benchStripHTML: on a benchmark retest, the week 1 baseline (or the sentence for none), and once the
 * retest is logged, the change at the same effort.
 */
export function benchNotes(cardio: { subtype?: string; week?: number }, entryFor: (week: number | undefined) => BenchEntry | null, clock: (secs: number) => string): BenchNote[] {
  if (!/^Benchmark Run — Retest/.test(String(cardio.subtype || ''))) return [];
  const base = entryFor(1);
  if (!base) return [{ lead: null, text: 'No week 1 benchmark was logged — today’s result becomes your baseline for the next block. Run it exactly as written.' }];
  const out: BenchNote[] = [{ lead: 'WEEK 1 BASELINE:', text: ' ' + base.dist + ' mi in ' + base.mins + ' min — ' + clock(base.sec) + '/mi. Same even effort today; the distance difference is your gain.' }];
  const now = entryFor(cardio.week);
  if (now) {
    const df = Math.round(base.sec - now.sec);
    const verdict = Math.abs(df) < 5
      ? 'Even with week 1 — fitness held through a full build, which on this recovery budget is a result.'
      : df > 0 ? df + ' sec/mi FASTER at the same effort. The aerobic engine grew — the block worked.'
        : Math.abs(df) + ' sec/mi slower at the same effort. An off day happens; look at sleep, fuel, and heat before doubting six weeks of work.';
    out.push({ lead: 'RETEST:', text: ' ' + now.dist + ' mi — ' + clock(now.sec) + '/mi. ' + verdict });
  }
  return out;
}
