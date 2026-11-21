// The writes of Hurt? and Traveling? in the Expo app (MIGRATION.md phase 3, row 5, its third session; D289
// P-NATIVEWRITES), each to this app's own store through core's writers, as the page makes them
// (frontends/app/src/legacy/src/js/overlays.ts), line for line:
//
//   applyOverlayDraft, applyInjuryDraft, removeOverlay, imBackFromInjury, injReassess, injSnooze, _saveOverlays
//
// A CHANGE IS STORED ON ITS PROGRAM. Every one of these writes ia_programs and nothing else: the overlay goes on the
// program in hand (today's activeProg, changed in place as the page changes it), the stored program takes the list,
// and the program is rebuilt by core's refreshStoredProgram, the launch's own. A trained day never changes; an
// untrained day inside the span is built again under the change.
// THE CHECK IN's Same, More time and Worse write when it was last asked (lastAsk) and rebuild nothing.
// A REFUSAL says why and writes nothing.
//
// Carried as today's, not fixed here: Hurt? applied with an injury live stores a second one; the week after a return
// week (the halfstep) still offers I'm back; a change that has ended stays stored.
//
// tests/support/native-change-sheet.ts holds the store equal to today's page, key for key, after every one of them.
import { _parseLocalDate } from '@ia/core/engine/calendar.ts';
import { INJURY_REGIONS, injuryPlan } from '@ia/core/engine/injury.ts';
import { overlayWeekRange, paceShiftMap } from '@ia/core/engine/state-overlays.ts';
import { readPrograms, writePrograms } from '@ia/core/engine/state-programs.ts';
import { type RefreshReport, type StoredProgram, refreshStoredProgram } from '@ia/core/engine/state-refresh.ts';
import type { StateStore } from '@ia/core/engine/state-store.ts';

import type { PopCall } from '../pop-up/pop-ups';
import type { OverlayDraft } from './change-sheet-model';
import { type OverlayProgram, type StoredOverlay, addDaysIso, isoToday } from './overlay-readers';

/** The store and the program in hand (today's activeProg, the grid This Week draws). */
export interface OverlaySession { store: StateStore; prog: OverlayProgram }

/**
 * What a tap leaves: its toast, whether the sheet closes, the program in hand when the tap rebuilt it, the pop-up it
 * raises, and what each of that pop-up's buttons does when it has more than the one that closes it.
 */
export interface OverlayTap { toast: string | null; closed: boolean; prog?: OverlayProgram; pop?: PopCall; acts?: OverlayAct[] }
/** A button of the check in's Good sign pop-up. */
export type OverlayAct = { kind: 'back'; id: string } | { kind: 'snooze'; id: string };

/** Today's words. */
export const OVERLAY_TOASTS = {
  region: 'Pick a region',
  dateOutside: 'That date falls outside your program',
  workaround: 'Working around it ✓',
  protect: 'Protected. Train around it ✓',
  bothDates: 'Pick both dates',
  backwards: '“Through” can’t be before “From”',
  rangeOutside: 'That range is outside your program',
  applied: 'Change applied ✓',
  removed: 'Change removed ✓',
  snoozed: 'Staying on the plan. It will ask again in two weeks.',
} as const;

/** The page's _saveOverlays: the stored program takes the list in hand. */
function saveOverlays(s: OverlaySession): void {
  const progs = readPrograms(s.store) as unknown as { id: string; overlays?: StoredOverlay[] }[];
  const i = progs.findIndex((p) => p.id === s.prog.id);
  if (i >= 0) { progs[i]!.overlays = s.prog.overlays; writePrograms(s.store, progs as never); }
}
/** The page's refreshProgram on the program in hand. */
const refresh = (s: OverlaySession, now: number, failed: RefreshReport): OverlayProgram =>
  refreshStoredProgram(s.store, s.prog as unknown as StoredProgram, now, failed) as unknown as OverlayProgram;

/**
 * The page's applyOverlayDraft (Traveling?). A full gym changes nothing, so the tap only closes the sheet. A date
 * missing, a Through before its From and a span outside the program are refused. Else the trip is stored and the
 * program rebuilt.
 */
export function applyOverlayDraft(s: OverlaySession, d: OverlayDraft, now: number, failed: RefreshReport): OverlayTap {
  if (d.equipment === 'commercial') return { toast: null, closed: true };
  const from = d.from, to = d.to;
  if (!from || !to) return { toast: OVERLAY_TOASTS.bothDates, closed: false };
  // As the page compares them: a date that does not read counts as zero.
  const a = _parseLocalDate(to), b = _parseLocalDate(from);
  if ((a ? a.getTime() : 0) < (b ? b.getTime() : 0)) return { toast: OVERLAY_TOASTS.backwards, closed: false };
  const tw = s.prog.totalWeeks || 0;
  if (!overlayWeekRange(s.prog, { type: 'substitute', from, to, patch: { equipment: d.equipment } }, tw)) return { toast: OVERLAY_TOASTS.rangeOutside, closed: false };
  const ov: StoredOverlay = { id: 'ov_' + now, type: 'substitute', from, to, patch: { equipment: d.equipment }, note: '', created: now };
  if (!Array.isArray(s.prog.overlays)) s.prog.overlays = [];
  s.prog.overlays.push(ov);
  saveOverlays(s);
  return { toast: OVERLAY_TOASTS.applied, closed: true, prog: refresh(s, now, failed) };
}

/**
 * The page's applyInjuryDraft (Hurt?). No region, or one the app does not train around, and a From outside the
 * program are refused. Else the injury is stored with no end date and the program rebuilt.
 */
export function applyInjuryDraft(s: OverlaySession, d: OverlayDraft, now: number, failed: RefreshReport): OverlayTap {
  const R = d.injRegion, T = d.injTier || 'workaround';
  if (!R || !INJURY_REGIONS[R]) return { toast: OVERLAY_TOASTS.region, closed: false };
  const from = d.from || isoToday(new Date(now));
  if (!overlayWeekRange(s.prog, { type: 'injury', from, to: null, patch: {} }, s.prog.totalWeeks || 0)) return { toast: OVERLAY_TOASTS.dateOutside, closed: false };
  const ov: StoredOverlay = { id: 'ov_' + now, type: 'injury', from, to: null, patch: { injury: { region: R, tier: T } }, note: '', created: now };
  if (!Array.isArray(s.prog.overlays)) s.prog.overlays = [];
  s.prog.overlays.push(ov);
  saveOverlays(s);
  return { toast: T === 'protect' ? OVERLAY_TOASTS.protect : OVERLAY_TOASTS.workaround, closed: true, prog: refresh(s, now, failed) };
}

/** The page's removeOverlay (a chip's ✕): the change leaves the program, which is rebuilt. Null with no list in hand. */
export function removeOverlay(s: OverlaySession, id: string, now: number, failed: RefreshReport): OverlayTap | null {
  if (!Array.isArray(s.prog.overlays)) return null;
  s.prog.overlays = s.prog.overlays.filter((o) => o && o.id !== id);
  saveOverlays(s);
  return { toast: OVERLAY_TOASTS.removed, closed: false, prog: refresh(s, now, failed) };
}

/** The cardio modes that took running away (the page's _RUNSUP). */
const RUN_SUPPRESSED: Record<string, 1> = { easy: 1, reduce: 1, noimpact: 1, noimpact_swim: 1 };

/**
 * The page's imBackFromInjury. The injury leaves and one return week takes its place, the same region worked around
 * from today for seven days. Where either tier of that region took running away, a second week follows it, cardio
 * only (the halfstep, V142 D1). The pop-up promises only what the engine enforces (D2b): the pace clock's line and
 * its weeks are spoken for the pace goal alone.
 */
export function imBackFromInjury(s: OverlaySession, id: string, now: number, failed: RefreshReport): OverlayTap | null {
  if (!Array.isArray(s.prog.overlays)) return null;
  const ov = s.prog.overlays.find((o) => o && o.id === id);
  if (!ov || !ov.patch || !ov.patch.injury) return removeOverlay(s, id, now, failed);
  const region = ov.patch.injury.region;
  s.prog.overlays = s.prog.overlays.filter((o) => o && o.id !== id);
  const day = new Date(now), today = isoToday(day);
  s.prog.overlays.push({ id: 'ov_' + now, type: 'injury', from: today, to: addDaysIso(today, 6, day), patch: { injury: { region, tier: 'workaround', bridge: true } }, note: '', created: now });
  const pw = injuryPlan({ injury: { region, tier: 'workaround' } } as never);
  const pp = injuryPlan({ injury: { region, tier: 'protect' } } as never);
  const hadRunSuppression = !!((pw && RUN_SUPPRESSED[pw.cardioMode as string]) || (pp && RUN_SUPPRESSED[pp.cardioMode as string]));
  if (hadRunSuppression) {
    s.prog.overlays.push({ id: 'ov_' + (now + 1), type: 'injury', from: addDaysIso(today, 7, day), to: addDaysIso(today, 13, day), patch: { injury: { region, tier: 'workaround', halfstep: true } }, note: '', created: now + 1 });
  }
  saveOverlays(s);
  const prog = refresh(s, now, failed);
  const lbl = (INJURY_REGIONS[region] || { label: '' }).label || 'injury';
  if (!hadRunSuppression) {
    return {
      toast: null, closed: false, prog,
      pop: { tier: 'workout', opts: { icon: 'shield', kicker: 'Back in', msg: 'Good. One week to prove it.', sub: 'The ' + lbl.toLowerCase() + ' work comes back light this week, held at RPE 7. Full send next week.', dismiss: 'Let’s go' } },
    };
  }
  let sub = 'This week stays light, held at RPE 7. Next week your quality running returns at pace with reduced volume. Full prescription the week after.';
  try {
    const cfg = prog.cfg || {};
    const rg = (cfg.cardioGoals || {}).run || {};
    if (rg.id === 'run_pace_goal') {
      const map = paceShiftMap(prog as never, now);
      const tw = prog.totalWeeks || 0;
      const n = map && tw ? (map[tw] || 0) : 0;
      if (n > 0) {
        sub += ' Your pace targets resume where you left off, not where the calendar says.';
        sub += (cfg.raceDate && cfg.eventTargeted !== false)
          ? ' Race day does not move. Your interval cards now show the revised realistic pace for it.'
          : ' Reaching the original goal pace now needs about ' + n + ' more ' + (n === 1 ? 'week' : 'weeks') + ' than this block has. The interval cards show the honest target.';
      }
    }
  } catch { /* as the page: the pop-up goes up without the pace clock's line */ }
  return { toast: null, closed: false, prog, pop: { tier: 'workout', opts: { icon: 'shield', kicker: 'Back in', msg: 'Good. Two weeks to full send.', sub, dismiss: 'Let’s go' } } };
}

/** The page's injSnooze (Same, and More time): asked again in two weeks. Nothing is rebuilt. */
export function injSnooze(s: OverlaySession, id: string, now: number): OverlayTap | null {
  if (!Array.isArray(s.prog.overlays)) return null;
  const ov = s.prog.overlays.find((o) => o && o.id === id);
  if (!ov) return null;
  ov.lastAsk = now; saveOverlays(s);
  return { toast: OVERLAY_TOASTS.snoozed, closed: false };
}

/**
 * The page's injReassess, the check in's answer. Better writes nothing and asks: I'm back, or More time. Worse stores
 * the ask and says to get it looked at. Same is the snooze.
 */
export function injReassess(s: OverlaySession, id: string, ans: 'better' | 'same' | 'worse', now: number): OverlayTap | null {
  if (!Array.isArray(s.prog.overlays)) return null;
  const ov = s.prog.overlays.find((o) => o && o.id === id);
  if (!ov) return null;
  if (ans === 'better') {
    return {
      toast: null, closed: false,
      pop: {
        tier: 'workout', opts: {
          icon: 'shield', kicker: 'Check in', msg: 'Good sign.',
          sub: 'Ready to bring it back, or give it more time? Coming back starts with one light week.',
          actions: [
            { label: 'I’m back', cls: 'go', onclick: "popClose();imBackFromInjury('" + id + "')" },
            { label: 'More time', cls: 'skip', onclick: "popClose();injSnooze('" + id + "')" },
          ],
        },
      },
      acts: [{ kind: 'back', id }, { kind: 'snooze', id }],
    };
  }
  if (ans === 'worse') {
    ov.lastAsk = now; saveOverlays(s);
    return {
      toast: null, closed: false,
      pop: { tier: 'workout', opts: { icon: 'warning', kicker: 'Check in', msg: 'Two weeks and trending worse.', sub: 'That is a job for a professional, not an app. Get it looked at. The plan keeps protecting it in the meantime.', dismiss: 'Understood' } },
    };
  }
  return injSnooze(s, id, now);
}
