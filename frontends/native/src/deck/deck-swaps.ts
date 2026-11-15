// What the swap sheet reads, for the Expo deck (MIGRATION.md phase 3, the deck's third session). Each function is the
// page's own, line for line, with the page's globals (the active program, the week and the day in hand) taken as
// arguments:
//
//   swapUniverseFor, swapCandidates, swapLoadNote,
//   auxSwapCandidates                              swaps-edits.ts
//   swapSheetOf                                    swap-sheet.ts open() (the Angular sheet), over today's own
//                                                  swap-sheet-model.ts, held to the byte
//
// The legality is core's (the pattern, the region, the station of a round's partner, the day's injury plan, the
// kit of an aux family, the power doctrine); the universe is the program's own, which the launch hands back. Nothing
// here writes. tests/integration/native-deck-swap.test.ts holds the sheet equal to today's for every card over whole
// histories, so a change to either turns red until the other follows.
import type { Cfg, Section } from '@ia/core';
import { _PATTERN_REGION, _compoundTier } from '@ia/core/engine/budget-engine-d.ts';
import { _ssLegal, _ssPartnerOf } from '@ia/core/engine/exercise-library.ts';
import { _powerAllowed } from '@ia/core/engine/power-accessory.ts';
import { _AUX_FAMILY, _AUX_FAMILY_LABEL, _auxFamily, _auxGearOK, _pattern } from '@ia/core/engine/region-caps.ts';
import { _dayPlanCfg } from '@ia/core/engine/state-swaps.ts';
import { _swapInjuryOK } from '@ia/core/engine/swap-prefs.ts';

import { type SwapSheetView, swapSheetView } from '../swap-sheet/swap-sheet-model';
import type { DeckDay, DeckProgram } from './deck-screen';

/** The program as the swap sheet reads it: its config, and the universes its build harvested. */
interface SwapProgram { cfg?: Cfg | null; _swapUniverse?: unknown; _swapUniverseByKey?: Record<string, unknown> | null }
/** The day as the swap sheet reads it: its sections, and the overlay it was built under. */
type SwapDay = DeckDay & { _ovKey?: unknown };
const asProgram = (prog: DeckProgram): SwapProgram => prog as unknown as SwapProgram;
const sectionsOf = (day: SwapDay | null | undefined): { sections?: Section[] } | null => (day as unknown as { sections?: Section[] } | null) || null;

/** The page's swapUniverseFor: the day's own universe when it was built under an overlay, else the program's. */
export function swapUniverseFor(prog: DeckProgram | null | undefined, day: SwapDay | null | undefined): string[] {
  if (!prog) return [];
  const P = asProgram(prog);
  const k = day && day._ovKey;
  const byKey = k && P._swapUniverseByKey && P._swapUniverseByKey[k as string];
  if (Array.isArray(byKey) && byKey.length) return byKey as string[];
  return Array.isArray(P._swapUniverse) ? (P._swapUniverse as string[]) : [];
}

/** What the sheet lists for one lift: the same job, the same day, and the lift's own pattern and region. */
export interface Candidates { tier1: string[]; tier2: string[]; pattern: string | null; region: string | null }

/** The page's swapCandidates. */
export function swapCandidates(outName: string, day: SwapDay | null | undefined, prog: DeckProgram | null | undefined): Candidates {
  const cfg = _dayPlanCfg(prog ? asProgram(prog) : null, day);
  const outPat = _pattern(outName);
  const outRegion = outPat ? _PATTERN_REGION[outPat] : null;
  // Already on today's card: never offer a duplicate movement.
  const onCard: Record<string, number> = Object.create(null);
  ((day && day.sections) || []).forEach((s) => ((s && s.items) || []).forEach((it) => { if (it && it.name) onCard[it.name.toLowerCase()] = 1; }));
  const t1: string[] = [], t2: string[] = [];
  const ssP = _ssPartnerOf(sectionsOf(day), outName);
  swapUniverseFor(prog, day).forEach((n) => {
    if (!n || n === outName) return;
    if (onCard[n.toLowerCase()]) return;
    const p = _pattern(n);
    if (!p) return;
    if (!_swapInjuryOK(n, cfg)) return;
    if (ssP && !_ssLegal(n, ssP)) return;
    if (outPat && p === outPat) { t1.push(n); return; }
    if (outRegion && _PATTERN_REGION[p] === outRegion) t2.push(n);
  });
  // Nearest in load to the lift being replaced first, then the heavier, then by name.
  const outTier = _compoundTier(outName);
  const rank = (a: string, b: string): number => {
    const da = Math.abs(_compoundTier(a) - outTier), db = Math.abs(_compoundTier(b) - outTier);
    if (da !== db) return da - db;
    const ta = _compoundTier(a), tb = _compoundTier(b);
    if (ta !== tb) return tb - ta;
    return a.localeCompare(b);
  };
  return { tier1: t1.sort(rank).slice(0, 8), tier2: t2.sort(rank).slice(0, 5), pattern: outPat, region: outRegion as string | null };
}

/** The page's swapLoadNote: the honest note when a candidate is much lighter than what it replaces. */
export function swapLoadNote(outName: string, candName: string): string {
  const d = _compoundTier(outName) - _compoundTier(candName);
  if (d < 2) return '';
  return 'Much lighter than ' + outName.toLowerCase() + '. Volume holds, top-end strength does not.';
}

/** The page's auxSwapCandidates: the same aux family, not on the card, legal for the kit, the plan and the power doctrine. */
export function auxSwapCandidates(outName: string, day: SwapDay | null | undefined, prog: DeckProgram | null | undefined): string[] {
  const fam = _auxFamily(outName);
  if (!fam) return [];
  const cfg = _dayPlanCfg(prog ? asProgram(prog) : null, day);
  const onCard: Record<string, number> = Object.create(null);
  ((day && day.sections) || []).forEach((s) => ((s && s.items) || []).forEach((it) => { if (it && it.name) onCard[it.name.toLowerCase()] = 1; }));
  const ssP = _ssPartnerOf(sectionsOf(day), outName);
  return Object.keys(_AUX_FAMILY).filter((n) => {
    if (n === outName || _AUX_FAMILY[n] !== fam) return false;
    if (onCard[n.toLowerCase()]) return false;
    if (!_auxGearOK(n, cfg.equipment || 'home_full')) return false;
    if (fam === 'power' && typeof _powerAllowed === 'function' && !_powerAllowed(n, cfg.experience, cfg.injury, cfg.ageBracket)) return false;
    if (ssP && !_ssLegal(n, ssP)) return false;
    return _swapInjuryOK(n, cfg);
  }).sort();
}

/** The lift a sheet was opened on (the page's _swapCtx): where it stands, its name and its prescription as it stood. */
export interface SwapCtx { secIdx: number; itemIdx: number; name: string; detail: string }
/** An open swap sheet: the lift it was opened on, and what it shows. */
export interface SwapOpen { ctx: SwapCtx; view: SwapSheetView }

/**
 * The Angular sheet's open(): the lift at this place of the day in hand, its candidates (the aux family's for a lift
 * with no pattern) and what the sheet shows for them. Null where there is nothing to swap, which today's app says in
 * a toast ("Nothing to swap here").
 */
export function swapSheetOf(prog: DeckProgram, week: number, dayKey: string, secIdx: number, itemIdx: number): SwapOpen | null {
  const wk = prog && prog.weeks && prog.weeks[week];
  const day = (wk && wk[dayKey]) as SwapDay | null | undefined;
  const sec = day && day.sections && day.sections[secIdx];
  const item = sec && sec.items && sec.items[itemIdx];
  if (!sec || !item || !item.name) return null;
  const c = swapCandidates(item.name, day, prog);
  const fam = !c.pattern ? _auxFamily(item.name) : null;
  if (fam) { c.tier1 = auxSwapCandidates(item.name, day, prog); c.tier2 = []; }
  const view = swapSheetView({
    name: item.name,
    detail: item.detail || '',
    itemIdx,
    section: sec as { label?: string; superset?: boolean; type?: string; items?: { name: string }[] },
    candidates: c,
    familyLabel: fam ? _AUX_FAMILY_LABEL[fam] ?? null : null,
    compoundTier: _compoundTier(item.name),
    loadNote: swapLoadNote,
  });
  return { ctx: { secIdx, itemIdx, name: item.name, detail: item.detail || '' }, view };
}
