// The add-an-exercise sheet, kept apart from Angular so the app's node --test suite reads it as it is (architecture
// phase E, step 6: the sheet moves from the legacy openAddSheet to the AddSheet component). The candidates come from the
// legacy addCandidates, and adding one is still the legacy applyAddChoice; this decides what the sheet shows, each string
// the legacy openAddSheet's.

/** A candidate row: its name, the caution class or none, and the note under it. */
export interface AddRow {
  name: string;
  caution: boolean;
  note: string;
}

/** What the sheet shows for a day. */
export interface AddSheetView {
  title: string;
  weekTag: string;
  regionTag: string;
  setsTag: string;
  gap: AddRow[];
  more: AddRow[];
  off: AddRow[];
}

/** What openAddSheet reads: the day, the week, the candidates and, per candidate, the sets it adds and its region. */
export interface AddInput {
  title: string | undefined;
  week: number;
  setCount: number;
  candidates: { gap: string[]; more: string[]; off: string[]; region: string | null };
  /** The sets an added movement would carry (from its added detail), or null when it reads none. */
  addedSets(name: string): number | null;
  /** The region a movement trains, or null. */
  regionOf(name: string): string | null;
}

const REGION_TAG: Record<string, string> = { push: 'Push day', pull: 'Pull day', legs: 'Leg day' };
const REGION_WORK: Record<string, string> = { push: 'Push', pull: 'Pull', legs: 'Leg' };
const REGION_DAY: Record<string, string> = { push: 'push', pull: 'pull', legs: 'leg' };

/** The sheet, as the legacy openAddSheet drew it. */
export function addSheetView(a: AddInput): AddSheetView {
  const region = a.candidates.region;
  return {
    title: a.title || 'Training',
    weekTag: 'Week ' + a.week,
    regionTag: (region && REGION_TAG[region]) || 'Today',
    setsTag: a.setCount + ' sets',
    gap: a.candidates.gap.map((n) => ({ name: n, caution: false, note: '' })),
    more: a.candidates.more.map((n) => ({
      name: n,
      caution: true,
      note: 'Your day already has this pattern. Sets go to ' + (a.setCount + (a.addedSets(n) || 3)) + '.',
    })),
    off: a.candidates.off.map((n) => {
      const r = a.regionOf(n);
      return {
        name: n,
        caution: true,
        note: ((r && REGION_WORK[r]) || 'That') + ' work on a ' + ((region && REGION_DAY[region]) || 'training') + ' day. Check what it sits next to in the week.',
      };
    }),
  };
}

/** The day's working sets: every item not skipped whose prescription counts sets (an open one does not). */
export function workingSets(
  sections: { items?: ({ name?: string; detail?: string; _skipped?: boolean } | null)[] }[] | undefined,
  parseRx: (detail: string, name: string) => { sets: number; open?: boolean } | null,
): number {
  let n = 0;
  (sections || []).forEach((s) => {
    (s.items || []).forEach((it) => {
      if (!it || it._skipped) return;
      const rx = parseRx(it.detail || '', it.name || '');
      if (rx && !rx.open) n += rx.sets;
    });
  });
  return n;
}
