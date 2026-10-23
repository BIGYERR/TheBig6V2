// The exercise swap sheet, kept apart from Angular so the app's node --test suite reads it as it is (architecture phase
// E, step 5: the sheet moves from the legacy openSwapSheet to the SwapSheet component). The candidates come from the
// legacy swapCandidates and auxSwapCandidates, and choosing one is still the legacy applySwapChoice; this decides, from
// them, what the sheet shows, each string the legacy openSwapSheet's.

/** The movement pattern's tag (the legacy tagOf). */
export function patternTag(pattern: string | null | undefined): string {
  const tags: Record<string, string> = {
    hinge: 'HINGE', squat: 'SQUAT', lunge: 'LUNGE', hip_ext: 'HIP EXTENSION', row: 'ROW', vpull: 'VERTICAL PULL',
    hpress: 'HORIZONTAL PRESS', vpress: 'VERTICAL PRESS', bi_iso: 'BICEPS', tri_iso: 'TRICEPS', delt_iso: 'DELTS',
    leg_iso: 'LEG ISOLATION', calf_iso: 'CALVES',
  };
  return (pattern && tags[pattern]) || 'LIFT';
}

/** The day's region tag (the legacy regionOf). */
export function regionTag(region: string | null | undefined): string {
  const tags: Record<string, string> = { push: 'PUSH DAY', pull: 'PULL DAY', legs: 'LEG DAY' };
  return (region && tags[region]) || 'TODAY';
}

/** The prescription, short: 'N×reps at RPE r', 'N sets', or the text cut to 24 characters and an ellipsis. */
export function rxShort(detail: string | null | undefined): string {
  const D = String(detail || '');
  const head = (D.match(/^\s*(\d+\s*sets|\d+\s*[×x]\s*[\d–\-+]+)/i) || [])[1];
  const rpe = (D.match(/RPE\s*([\d.]+)/i) || [])[1];
  const clean = head ? head.replace(/\s*([×x])\s*/, '×') : '';
  if (clean && rpe) return clean + ' at RPE ' + rpe;
  if (clean) return clean;
  return D.length > 26 ? D.slice(0, 24) + '…' : D;
}

/** The implement a name says: kettlebell, dumbbell, barbell, or none. */
export function implementOf(name: string | null | undefined): 'kb' | 'db' | 'bb' | null {
  const N = String(name || '').toLowerCase();
  return /kettlebell|\(kb/.test(N) ? 'kb' : /dumbbell|\(db/.test(N) ? 'db' : /barbell|trap bar/.test(N) ? 'bb' : null;
}

/** A candidate row: its name, whether it is a different job, and the note under it. */
export interface SwapRow {
  name: string;
  caution: boolean;
  note: string;
}

/** What the sheet shows for one exercise. */
export interface SwapSheetView {
  outName: string;
  kindTag: string;
  regionTag: string;
  /** 'MAIN LIFT', 'HEAVY COMPOUND', or nothing. */
  slotTag: string;
  /** The prescription a pick keeps, or nothing. */
  keeps: string;
  sameJob: SwapRow[];
  /** The note that picks lower down break a round that runs on one implement, or nothing. */
  flowNote: string;
  otherJob: SwapRow[];
  /** The region the other jobs share ('the same' without one), and the pattern given up, lower case. */
  otherRegion: string;
  givenUp: string;
}

/** What openSwapSheet's inputs come to: the exercise, its section, the candidates and the lenses it reads. */
export interface SwapInput {
  name: string;
  detail: string;
  itemIdx: number;
  section: { label?: string; superset?: boolean; type?: string; items?: { name: string }[] };
  candidates: { tier1: string[]; tier2: string[]; pattern: string | null; region: string | null };
  /** The aux family's label when the exercise has no pattern but a family (the tier-2 list is then empty). */
  familyLabel: string | null;
  compoundTier: number;
  loadNote(outName: string, candidate: string): string;
}

/** The sheet, as the legacy openSwapSheet drew it. */
export function swapSheetView(s: SwapInput): SwapSheetView {
  let tier1 = s.candidates.tier1;
  let flowNote = '';
  const superset = !!(s.section.superset || s.section.type === 'superset');
  if (superset && tier1.length) {
    const mine = implementOf(s.name);
    if (mine && (s.section.items || []).some((x) => x && x.name !== s.name && implementOf(x.name) === mine)) {
      const same = tier1.filter((n) => implementOf(n) === mine);
      const cross = tier1.filter((n) => implementOf(n) !== mine);
      tier1 = same.concat(cross);
      if (cross.length) flowNote = 'This round runs on one implement — picks lower down break that flow.';
    }
  }
  const isMainSlot = s.itemIdx === 0 && !superset && /^main/i.test(s.section.label || '');
  const isHeavyCompound = !isMainSlot && s.compoundTier >= 3;
  const row = (n: string, caution: boolean): SwapRow => {
    const load = s.loadNote(s.name, n);
    return { name: n, caution: caution || !!load, note: caution ? 'Different job. Region volume holds.' : load };
  };
  return {
    outName: s.name,
    kindTag: s.familyLabel ?? patternTag(s.candidates.pattern),
    regionTag: regionTag(s.candidates.region),
    slotTag: isMainSlot ? 'MAIN LIFT' : isHeavyCompound ? 'HEAVY COMPOUND' : '',
    keeps: rxShort(s.detail),
    sameJob: tier1.map((n) => row(n, false)),
    flowNote,
    otherJob: s.candidates.tier2.map((n) => row(n, true)),
    otherRegion: s.candidates.region || 'the same',
    givenUp: patternTag(s.candidates.pattern).toLowerCase(),
  };
}
