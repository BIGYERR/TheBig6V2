// What the add sheet reads, for the Expo session sheet (MIGRATION.md phase 3, the session sheet's second session).
// Each function is the page's own, line for line, with the page's globals (the active program, the week and the day
// in hand) taken as arguments:
//
//   addCandidates, _addRxKind, addedDetailFor      swaps-edits.ts (V109; the dose by nearest type, V163 D1 to D4)
//   addSheetOf                                     add-sheet.ts open() (the Angular sheet), over today's own
//                                                  add-sheet-model.ts, held to the byte
//
// The legality is core's (the pattern, the region, the day's injury plan); the universe is the program's own, which
// the launch hands back, read through the swap sheet's own reader. Nothing here writes: a pick is sheet-writes.ts
// addMove. tests/integration/native-session-sheet.test.ts holds the sheet equal to today's for every day over whole
// histories, so a change to either turns red until the other follows.
import type { Cfg } from '@ia/core';
import { _PATTERN_REGION, _compoundTier } from '@ia/core/engine/budget-engine-d.ts';
import { _pattern } from '@ia/core/engine/region-caps.ts';
import { _dayPlanCfg } from '@ia/core/engine/state-swaps.ts';
import { _swapInjuryOK } from '@ia/core/engine/swap-prefs.ts';

import { type AddSheetView, addSheetView, workingSets } from '../add-sheet/add-sheet-model';
import { parseRx } from '../deck/deck-readers';
import type { DeckDay, DeckProgram } from '../deck/deck-screen';
import { swapUniverseFor } from '../deck/deck-swaps';
import type { ExItem, ExSection } from './session-sections-model';

/** The day as the add sheet reads it: its title, its sections, and the overlay it was built under. */
type AddDay = DeckDay & { _ovKey?: unknown };
const planOf = (prog: DeckProgram | null | undefined, day: AddDay | null | undefined): Cfg => _dayPlanCfg(prog ? (prog as unknown as { cfg?: Cfg | null }) : null, day);

/** What the sheet lists for a day: work it has none of, more of a pattern it has, another region's, and the day's own region. */
export interface AddCandidates { gap: string[]; more: string[]; off: string[]; region: string | null; pats: Record<string, number> }

/**
 * The page's addCandidates: the swap sheet's universe, injury filter and no duplicate of a move on the card, cut into
 * other tiers. The day's own region does not filter (a push day may still take hip thrusts): another region's work is
 * offered under its own heading, with what it collides with said on the row.
 */
export function addCandidates(day: AddDay | null | undefined, prog: DeckProgram | null | undefined): AddCandidates {
  const cfg = planOf(prog, day);
  const onCard: Record<string, number> = Object.create(null), patsOnCard: Record<string, number> = Object.create(null);
  let dayRegion: string | null = null;
  ((day && day.sections) || []).forEach((s) => ((s && s.items) || []).forEach((it) => {
    if (!it || !it.name) return;
    onCard[it.name.toLowerCase()] = 1;
    const p = _pattern(it.name);
    if (p) { patsOnCard[p] = (patsOnCard[p] || 0) + 1; if (!dayRegion) dayRegion = _PATTERN_REGION[p] as string; }
  }));
  const gap: string[] = [], more: string[] = [], off: string[] = [];
  swapUniverseFor(prog, day).forEach((n) => {
    if (!n) return;
    if (onCard[n.toLowerCase()]) return;
    const p = _pattern(n);
    if (!p) return;
    if (!_swapInjuryOK(n, cfg)) return;
    const r = _PATTERN_REGION[p];
    if (r && dayRegion && r !== dayRegion) { off.push(n); return; }
    if (patsOnCard[p]) more.push(n); else gap.push(n);
  });
  // The heavier first, then by name.
  const rank = (a: string, b: string): number => { const ta = _compoundTier(a), tb = _compoundTier(b); if (ta !== tb) return tb - ta; return a.localeCompare(b); };
  return { gap: gap.sort(rank).slice(0, 6), more: more.sort(rank).slice(0, 5), off: off.sort(rank).slice(0, 6), region: dayRegion, pats: patsOnCard };
}

/**
 * The page's _addRxKind (V163 D2, the type fence): a rep lift may only take a rep dose or open sets at an effort.
 * Distance and time shapes are refused by their words as well as by the parse, since units spelled out ('yards',
 * 'meters') come back from the parse dressed as reps.
 */
function addRxKind(detail: unknown, name: unknown): 'open' | 'reps' | null {
  const d = (detail as string) || '';
  if (/\byards?\b|\byd\b|\bmeters?\b|\bsec\b|\bmin\b|\bhold\b|max time/i.test(d)) return null;
  const rx = parseRx(d, name || '');
  if (!rx) return null;
  if (rx['kind'] === 'dist' || rx['kind'] === 'sec') return null;
  return rx.open ? 'open' : 'reps';
}

/** The week of the grid an added dose is read from: its days by their keys. */
type AddWeek = Record<string, AddDay | null | undefined>;

/**
 * The page's addedDetailFor (V163 D1 to D4): the dose of an added move, by the nearest match of type in the live
 * week's own accessory prescriptions. The same pattern on today's card (the last such, since accessories sit lowest),
 * then the same pattern anywhere this week, then the same region anywhere this week, days in calendar order, then
 * the conservative dose. Main and primer sections never donate, nor a round, a core or hip block, nor added work.
 */
export function addedDetailFor(day: AddDay | null | undefined, name: string, week: number, prog: DeckProgram | null | undefined): string {
  const pat = _pattern(name) || null;
  const region = pat ? _PATTERN_REGION[pat] : null;
  const donors = (d: AddDay | null | undefined): ExItem[] => {
    const out: ExItem[] = [];
    ((d && d.sections) || []).forEach((s: ExSection) => {
      if (!s || s._added || s.core || s.hip || s.superset || s.type === 'superset') return;
      if (/^(main|primer)/i.test(s.label || '')) return;
      (s.items || []).forEach((it) => {
        if (!it || !it.name || !it.detail) return;
        if (!addRxKind(it.detail, it.name)) return;
        out.push(it);
      });
    });
    return out;
  };
  const today = donors(day);
  if (pat) {
    for (let i = today.length - 1; i >= 0; i--) if (_pattern(today[i]!.name as string) === pat) return today[i]!.detail as string;
  }
  const wk = ((prog && prog.weeks && prog.weeks[week]) || null) as AddWeek | null;
  if (wk && pat) {
    const order = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    const days: AddDay[] = [];
    order.forEach((k) => { if (wk[k]) days.push(wk[k] as AddDay); });
    for (let i = 0; i < days.length; i++) {
      const ds = donors(days[i]);
      for (let j = 0; j < ds.length; j++) if (_pattern(ds[j]!.name as string) === pat) return ds[j]!.detail as string;
    }
    if (region) for (let i = 0; i < days.length; i++) {
      const ds = donors(days[i]);
      for (let j = 0; j < ds.length; j++) {
        const q = _pattern(ds[j]!.name as string);
        if (q && _PATTERN_REGION[q] === region) return ds[j]!.detail as string;
      }
    }
  }
  return '3×10 — RPE 7';
}

/**
 * The Angular sheet's open(): the day in hand, its candidates and what the sheet shows for them. Null where there is
 * no day to add to, which today's app says in a toast ("Nothing to add to here").
 */
export function addSheetOf(prog: DeckProgram | null | undefined, week: number, dayKey: string): AddSheetView | null {
  const wk = prog && prog.weeks && prog.weeks[week];
  const day = ((wk && wk[dayKey]) || null) as AddDay | null;
  if (!day || !prog) return null;
  const c = addCandidates(day, prog);
  return addSheetView({
    title: day.title,
    week,
    setCount: workingSets(day.sections, parseRx as (detail: string, name: string) => { sets: number; open?: boolean } | null),
    candidates: c,
    addedSets: (n) => parseRx(addedDetailFor(day, n, week, prog), n)?.sets ?? null,
    regionOf: (n) => (_PATTERN_REGION[_pattern(n) as string] as string | undefined) ?? null,
  });
}
