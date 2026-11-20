// The coach's mile nudge in the Expo app, between the store and the screen (MIGRATION.md phase 3, row 5, its second
// session; D274 P-ANCHORNUDGE, docs/decisions/mile-anchor.md). The judge and the sheet's words are today's own file
// (mile-nudge-model.ts, a copy held to the byte). What stands here is the Angular screen's code around it
// (frontends/app/src/app/screens/mile-nudge/mile-nudge.ts), with its bridge into the page replaced by core's readers
// of the stored state:
//
//   afterLog     the judge, after the cardio card's Log is saved, on the card just logged
//   answer       either button leaves the two cards judged, and the mile they were judged against, on the program
//   update       Update mile time opens the mile pencil with the offer in its two fields
//
// The app never writes the mile itself: the pencil does (D116, program-list/list-writes.ts commitMileChange). The one
// write here is the record a dismissal leaves, on ia_programs.
import { paceChartLookup, runAnchorInfo } from '@ia/core/engine/cardio-progression.ts';
import { readDayHistory } from '@ia/core/engine/state-day-history.ts';
import { readDayLogs } from '@ia/core/engine/state-day-log.ts';
import { readCompleted } from '@ia/core/engine/state-day-status.ts';
import { readPrograms, writePrograms } from '@ia/core/engine/state-programs.ts';
import type { StateStore } from '@ia/core/engine/state-store.ts';

import { type ListProgram, goalCurWeek } from '../program-list/list-readers';
import { type MileOpen, openMile } from '../program-list/list-screen';
import { midnight } from '../this-week/week-screen';
import { type DayLike, type LogLike, type NudgeOffer, type NudgeRecord, judgeNudge, offerFields } from './mile-nudge-model';

/** How long the run card shows its done row on This Week before the sheet rises over it. */
export const NUDGE_DELAY_MS = 700;

/** An offer waiting for This Week, and the program it was judged on. */
export interface PendingNudge { offer: NudgeOffer; progId: string }

const programs = (store: StateStore): (ListProgram & { mileNudge?: NudgeRecord | null })[] => readPrograms(store) as never;

/**
 * The judge, after the log is saved (the Angular afterLog): the card just logged is the session's week and day. Null
 * when the program is gone, has no run to anchor, or the judge stays shut.
 */
export function afterLog(store: StateStore, progId: string | null, week: number, day: string, now: Date): PendingNudge | null {
  const p = programs(store).find((x) => x.id === progId);
  if (!p || !p.cfg) return null;
  const info = runAnchorInfo(p.cfg as never);
  if (!info) return null;
  const offer = judgeNudge({
    week, day,
    hist: readDayHistory(store, p.id) as unknown as Record<string, DayLike | undefined>,
    logs: readDayLogs(store, p.id) as unknown as Record<string, LogLike | undefined>,
    comp: readCompleted(store, p.id) as unknown as Record<string, string | undefined>,
    anchor: info.anchorSec,
    curWeek: Number(goalCurWeek(p, midnight(now))),
    totalWeeks: p.totalWeeks || 6,
    record: p.mileNudge ?? null,
    implied: (pace) => paceChartLookup('recovery', pace).mile,
  });
  return offer ? { offer, progId: p.id } : null;
}

/** Either answer (the Angular answer): the two cards judged, and the mile they were judged against, left on the program. */
export function answer(store: StateStore, n: PendingNudge): void {
  const progs = programs(store);
  const p = progs.find((x) => x.id === n.progId);
  if (!p) return;
  p.mileNudge = { cards: [n.offer.cards[0].key, n.offer.cards[1].key], anchor: n.offer.anchor };
  writePrograms(store, progs as never);
}

/**
 * Update mile time (the Angular update, after the answer): the mile pencil as its own tap opens it, the lock judged
 * at the tap, with the offer in the edit sheet's two fields in place of the stored mile.
 */
export function update(store: StateStore, n: PendingNudge, now: Date): MileOpen | null {
  const open = openMile(store, n.progId, now);
  return open && open.kind === 'edit' ? { ...open, ...offerFields(n.offer.offer) } : open;
}
