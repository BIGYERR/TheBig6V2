// What Hurt? and Traveling? read, for the Expo app (MIGRATION.md phase 3, row 5, its third session). Today's page keeps
// these in overlays.ts, and its Angular sheet reaches them through the bridge. Each one here is the page's own
// function, line for line, with the page's globals (the active program, the draft, the clock) taken as arguments:
//
//   _fmtDate, _fmtDateWd, _dayCount, _dayCountWord, _isoToday, _addDaysIso       the date words and the day sums
//   overlaySpanLabel, overlayBackCopy, OVERLAY_TYPE_LABEL                        the one date grammar (V175, D29)
//   renderOverlayChip                                                            the chips under This Week (overlayChips)
//   _ovDraft, openOverlaySheet, openInjurySheet, _ovSet, renderOverlaySheet      the draft and what the sheet shows
//
// THE PAGE WRITES THE CHIP AS MARKUP. It has no model: overlayChips is written from renderOverlayChip, and
// tests/support/native-change-sheet.ts prints it back as that markup and holds it equal to the page's own, byte for
// byte. The sheet's model is today's file (change-sheet-model.ts, the Angular screen's, byte for byte).
//
// Nothing here writes: no store call at all. The writes are overlay-writes.ts.
import { _parseLocalDate } from '@ia/core/engine/calendar.ts';
import { INJURY_REGIONS } from '@ia/core/engine/injury.ts';
import { overlayWeekRange, weekOfDate } from '@ia/core/engine/state-overlays.ts';

import { type ReadProgram, liveInjuryOverlay } from '../this-week/week-readers';
import { type ChangeSheetView, type DraftKey, type OverlayDraft, type PreviewOverlay, type SheetDeps, changeSheetView } from './change-sheet-model';

/** An overlay as the page stores it on its program. */
export interface StoredOverlay {
  id: string;
  type: string;
  from: string | null;
  to: string | null;
  patch: { injury?: { region: string; tier: string; bridge?: boolean; halfstep?: boolean }; equipment?: string } | null;
  note?: string;
  created?: number;
  lastAsk?: number;
}
/** The program in hand, as far as the overlays go (today's activeProg). */
export interface OverlayProgram {
  id: string;
  startDate?: string | null;
  totalWeeks?: number;
  overlays?: StoredOverlay[];
  cfg?: { raceDate?: string | null; eventTargeted?: boolean; cardioGoals?: { run?: { id?: string } | null } | null } | null;
}

const pad = (n: number): string => String(n).padStart(2, '0');
const isoOf = (d: Date): string => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());

// ── The date words (V175, D29: one date grammar for every surface that names an overlay span) ────────────────────
/** The page's _isoToday. */
export function isoToday(now: Date): string { return isoOf(now); }
/** The page's _addDaysIso: a date that does not read counts from today. */
export function addDaysIso(iso: string | null, n: number, now: Date): string {
  const d = _parseLocalDate(iso) || new Date(now);
  d.setDate(d.getDate() + n);
  return isoOf(d);
}
/** The page's _fmtDate: "Sep 1", or Set date for none. */
export function fmtDate(iso: string | null): string {
  return iso ? new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Set date';
}
/** The page's _fmtDateWd: "Tue Sep 1". */
export function fmtDateWd(iso: string | null): string {
  return iso ? new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).replace(',', '') : '';
}
const DAY_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen'];
/** The page's _dayCount: the days a span covers, both ends counted. */
export function dayCount(from: string | null, to: string | null): number {
  const a = _parseLocalDate(from), b = _parseLocalDate(to);
  if (!a || !b) return 0;
  return Math.round((b.getTime() - a.getTime()) / 86400000) + 1;
}
/** The page's _dayCountWord: "One day", "Nine days", "20 days". */
export function dayCountWord(nd: number): string {
  const w = DAY_WORDS[nd];
  return (w ? w.charAt(0).toUpperCase() + w.slice(1) : String(nd)) + (nd === 1 ? ' day' : ' days');
}

/**
 * The page's overlaySpanLabel, the chip's title. Whole weeks keep the week grammar; anything shorter is named by its
 * dates: "Tue Sep 1", "Sep 1–4", "Sep 29–Oct 2", "From Sep 1".
 */
export function overlaySpanLabel(prog: OverlayProgram | null, ov: { from?: string | null; to?: string | null } | null): string {
  if (!ov || !ov.from) return '';
  const f = _parseLocalDate(ov.from); if (!f) return '';
  if (!ov.to) return 'From ' + fmtDate(ov.from);
  const t = _parseLocalDate(ov.to); if (!t) return '';
  const wholeWeeks = f.getDay() === 1 && t.getDay() === 0;
  if (wholeWeeks) { const r = overlayWeekRange(prog, ov, (prog && prog.totalWeeks) || 0); if (r) return r.fromWeek === r.toWeek ? ('Week ' + r.fromWeek) : ('Weeks ' + r.fromWeek + '–' + r.toWeek); }
  if (ov.from === ov.to) return fmtDateWd(ov.from);
  const sameMonth = f.getMonth() === t.getMonth();
  return fmtDate(ov.from) + '–' + (sameMonth ? String(t.getDate()) : fmtDate(ov.to));
}

/** The page's overlayBackCopy: the day the program picks back up. `to` is the last day covered (D29), so it is to+1. */
export function overlayBackCopy(prog: OverlayProgram | null, ov: { to?: string | null } | null, now: Date): string {
  if (!ov || !ov.to) return '';
  const next = addDaysIso(ov.to, 1, now);
  const tw = (prog && prog.totalWeeks) || 0;
  const wk = weekOfDate(prog, next);
  if (tw && wk != null && wk > tw) return 'That runs to the end of your program.';
  return fmtDateWd(next) + ' picks your program back up.';
}

/** The page's OVERLAY_TYPE_LABEL. */
export const OVERLAY_TYPE_LABEL: Record<string, string> = { substitute: 'Travel', injury: 'Injury', reduce: 'Less time', suspend: 'Suspended' };
/** What the chip calls each gear (renderOverlayChip). */
export const CHIP_GEAR: Record<string, string> = { bodyweight: 'Room only', home_basic: 'Mini gym', commercial: 'Full gym', home_full: 'Home Full', crossfit: 'CrossFit Box', minimal: 'Minimal / Travel' };

// ── The chips under This Week (renderOverlayChip) ────────────────────────────────────────────────────────────────
/** A change still live: its title, its line, I'm back where the page offers it, and its ✕. */
export interface ChangeChip { kind: 'chip'; id: string; title: string; sub: string; back: boolean }
/** The check in, under the chip of an open injury, two weeks after it was set or last asked about. */
export interface CheckIn { kind: 'checkin'; id: string; title: string; sub: string; answers: { ans: 'better' | 'same' | 'worse'; label: string }[] }
/** The page's words for the ✕ of a chip. */
export const CHIP_REMOVE = 'Remove change';
/** The check in waits this long after the injury was set, or after its last answer. */
export const CHECK_IN_MS = 14 * 86400000;

/**
 * The page's renderOverlayChip: a chip for every stored overlay whose range is still live, in stored order, and the
 * check in card after the chip of an open injury. `now` is the instant of the draw: the check in reads the clock in
 * milliseconds, the chips read the day.
 */
export function overlayChips(prog: OverlayProgram | null, now: number): (ChangeChip | CheckIn)[] {
  const out: (ChangeChip | CheckIn)[] = [];
  if (!prog || !Array.isArray(prog.overlays)) return out;
  const tw = prog.totalWeeks || 0;
  const today = new Date(now); today.setHours(0, 0, 0, 0);
  prog.overlays.forEach((ov) => {
    if (!ov || !ov.from) return;
    const to = ov.to ? _parseLocalDate(ov.to) : null;
    if (to && to < today) return;
    if (!overlayWeekRange(prog, ov, tw)) return;
    const backOn = ov.to ? (' Back to normal ' + fmtDateWd(addDaysIso(ov.to, 1, new Date(now))) + '.') : ' Open-ended.';
    let patchLbl = 'Modified';
    const inj = ov.type === 'injury' && ov.patch && ov.patch.injury ? ov.patch.injury : null;
    const isBridge = !!inj && !!inj.bridge;
    if (inj) {
      const r = INJURY_REGIONS[inj.region];
      patchLbl = isBridge
        ? ('Return week · ' + (r ? r.label : 'Injury') + '. One light week, then full send.')
        : ((r ? r.label : 'Injury') + (inj.tier === 'protect' ? ' (protected)' : ' (working around it)'));
    } else if (ov.patch && ov.patch.equipment) {
      patchLbl = CHIP_GEAR[ov.patch.equipment] || ov.patch.equipment;
    }
    const tail = isBridge ? '' : (inj && !ov.to ? ' Tap I’m back when it’s ready.' : backOn);
    out.push({
      kind: 'chip', id: ov.id,
      title: (isBridge ? 'Return week' : (OVERLAY_TYPE_LABEL[ov.type] || 'Change')) + ' · ' + overlaySpanLabel(prog, ov),
      sub: patchLbl + (isBridge ? '' : '.') + tail,
      back: !!inj && !isBridge,
    });
    if (inj && !isBridge && !ov.to) {
      const since = now - ((ov.lastAsk || ov.created) || now);
      if (since >= CHECK_IN_MS) {
        const rl = (INJURY_REGIONS[inj.region] || { label: '' }).label || 'it';
        out.push({
          kind: 'checkin', id: ov.id, title: 'Check in',
          sub: 'Two weeks on the ' + rl.toLowerCase() + ' plan. How is it feeling?',
          answers: [{ ans: 'better', label: 'Better' }, { ans: 'same', label: 'Same' }, { ans: 'worse', label: 'Worse' }],
        });
      }
    }
  });
  return out;
}

// ── The draft and the sheet (the page's _ovDraft, kept for the app's life as the page keeps it for the page's) ────
/** The page's _ovDraft as a page load leaves it. */
export function newOverlayDraft(): OverlayDraft {
  return { type: 'substitute', from: null, to: null, equipment: 'minimal', tab: 'travel', injRegion: null, injTier: 'workaround' };
}

/**
 * The page's openOverlaySheet (Traveling?): the dates the draft last held, or today and thirteen days on; the gear
 * back on Mini gym, the most common work travel setup.
 */
export function openTravel(d: OverlayDraft, now: Date): OverlayDraft {
  const from = d.from || isoToday(now);
  return { ...d, type: 'substitute', tab: 'travel', from, to: d.to || addDaysIso(from, 13, now), equipment: 'home_basic' };
}

/** The page's openInjurySheet (Hurt?): on the live injury's region and tier when there is one, from today. */
export function openInjury(d: OverlayDraft, prog: OverlayProgram | null, now: Date): OverlayDraft {
  const today = new Date(now); today.setHours(0, 0, 0, 0);
  const live = liveInjuryOverlay(prog as ReadProgram | null, today) as StoredOverlay | null;
  const inj = live && live.patch ? live.patch.injury : null;
  return { ...d, injRegion: inj ? inj.region : null, injTier: inj ? inj.tier : 'workaround', type: 'injury', tab: 'injury', from: isoToday(now) };
}

/** The page's _ovSet: one field written; a From moved past Through carries Through to thirteen days after it. */
export function setDraft(d: OverlayDraft, k: DraftKey, v: string, now: Date): OverlayDraft {
  const next: OverlayDraft = { ...d, [k]: v };
  if (k === 'from' && next.to) {
    // As the page compares them: a date that does not read counts as zero.
    const a = _parseLocalDate(next.to), b = _parseLocalDate(v);
    if ((a ? a.getTime() : 0) < (b ? b.getTime() : 0)) next.to = addDaysIso(v, 13, now);
  }
  return next;
}

/** The page's pieces the sheet's model reads (the Angular sheet's render). */
export function sheetDeps(prog: OverlayProgram | null, now: Date): SheetDeps {
  const tw = (prog && prog.totalWeeks) || 0;
  return {
    fmtDate, fmtDateWd, dayCount, dayCountWord,
    inProgram: (ov: PreviewOverlay) => !!overlayWeekRange(prog, ov, tw),
    backCopy: (ov: PreviewOverlay) => overlayBackCopy(prog, ov, now),
  };
}

/** What the sheet shows for the draft (the page's renderOverlaySheet). */
export function sheetView(d: OverlayDraft, prog: OverlayProgram | null, now: Date): ChangeSheetView {
  return changeSheetView(d, INJURY_REGIONS, sheetDeps(prog, now));
}
