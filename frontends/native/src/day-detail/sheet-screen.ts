// The session sheet in the Expo app, as a view (MIGRATION.md phase 3, the session sheet's first session): the
// launch's grid, the stored state and the clock in, a day's sheet out. The view is today's own models
// (day-detail-model.ts, session-sections-model.ts, session-log-model.ts, cardio-fields-model.ts, cardio-card-model.ts
// and sheet-marks-model.ts, copies of the Angular app's held equal by a test), so every word, number and order here is
// today's, unchanged. The Angular sheet feeds those models through its bridge into the legacy page (day-detail.ts
// open()); this feeds them from core's readers of the stored state, from the deck's readers and from sheet-readers.ts.
// Nothing here writes a key: what the sheet writes is sheet-writes.ts (D289).
//
// The view holds the whole day as today's sheet does. The screen (SessionSheet.tsx) draws the part agreed for this
// session and leaves the rest of the body undrawn until its own session: a double day's jog, the Wildcard tag, the
// 1RM card and the day's note.
import { _clkMS } from '@ia/core/engine/clock-format.ts';
import { exStoreKey } from '@ia/core/engine/exercise-library.ts';
import { cardioEntryLogged, dayStoreKey, readDayLogs } from '@ia/core/engine/state-day-log.ts';
import { dayStatus, readCompleted } from '@ia/core/engine/state-day-status.ts';
import type { StateStore } from '@ia/core/engine/state-store.ts';

import { type DeckDay, type DeckProgram, type Fields, type StaleWarn, deckReads, liftLog } from '../deck/deck-screen';
import { fieldsOf } from '../deck/set-fields';
import { DAY_FULL, type ReadDay, type RestLog, dayIsTravel, restLogLines, runSessionCode, wildcardOn } from '../this-week/week-readers';
import { type CardioRx, cardioCard } from './cardio-card-model';
import { type CardioFields, type Dose, cardioFields } from './cardio-fields-model';
import { type BodyBlock, type FootButton, alsoJog, detailBody, e1rmCard, hasLogged, liftsFirst, logNudge, loggedCount, rangeNudge, statusFoot } from './day-detail-model';
import { type LogEntry, type SessionLogData, sessionLog } from './session-log-model';
import { type ExCard, type ExEntry, type ExSection, sectionsView } from './session-sections-model';
import { type TagChip, benchNotes, modTags, wildcardSub } from './sheet-marks-model';
import { type CardioDay, IAW_SPEC, MOD_PAL, RPE_LABELS, TAG_META, benchmarkEntryFor, cardioLogLabel, cardioSwapNoteText, doseFromCardio, fmtPaceMi, sessionLogProgress } from './sheet-readers';

/** A scheduled day, as far as the sheet reads it (day-detail.ts DetailDay). */
export interface SheetDay extends DeckDay {
  tags?: string[];
  cardio?: (CardioRx & CardioDay & { week?: number }) | null;
  note?: string;
  testLift?: unknown;
}
/** The program a launch hands back, as far as the sheet reads it. */
export type SheetProgram = DeckProgram & { primaryPath?: string; liftingFocus?: string };

/** A day's sheet as drawn: the header, the body's blocks in today's order, the foot, and what its log's writes read. */
export interface SheetView {
  week: number;
  dayKey: string;
  /** "Week N · Day", and the day's title ('Training' when it has none; the title it was closed under once it is). */
  over: string;
  title: string;
  /** The header's tags, and the travel tag on a travel day. */
  tags: { chips: TagChip[]; travel: boolean };
  /** "N / M logged", or none when the day has nothing to log. */
  counter: string | null;
  body: BodyBlock[];
  /** Done and Skip, each carrying the day's status, and the title they close the day under. */
  foot: [FootButton, FootButton];
  footTitle: string;
  /** The planned session's dose as the log's fields were drawn with it (the page's _curLogDose): none on a swapped sport. */
  dose: Dose | null;
}

const safe = <T>(read: () => T, fallback: T): T => { try { return read(); } catch { return fallback; } };

/** The day of the grid a sheet is drawn for, or null: a day the grid does not hold, or a rest day (which opens the rest sheet). */
export function sheetDay(prog: SheetProgram, week: number, dayKey: string): SheetDay | null {
  const wk = prog.weeks[week];
  const day = ((wk && wk[dayKey]) || null) as SheetDay | null;
  return day && !day.rest ? day : null;
}

/**
 * The Angular sheet's open() (day-detail.ts), as far as it reads: the whole day drawn anew. Every draw starts the
 * stale load warning afresh, as the page's openDetail does on an open and on every redraw after an edit.
 */
export function sheetView(store: StateStore, prog: SheetProgram, week: number, dayKey: string, nowMs: number): SheetView | null {
  const day = sheetDay(prog, week, dayKey);
  if (!day) return null;
  const id = prog.id;
  const warn: StaleWarn = { shown: false, src: '' };
  const unit = prog.cfg && prog.cfg.unit === 'kg' ? 'kg' : 'lbs';
  const key = dayStoreKey(week, dayKey);
  const comp = readCompleted(store, id)[key];
  const stored = liftLog(store, id);
  const progress = sessionLogProgress(day, stored, week, dayKey);
  const tags = { chips: modTags(day.tags, MOD_PAL, TAG_META), travel: !!dayIsTravel(day as unknown as ReadDay) };

  const secs = (day.sections || []) as ExSection[];
  const status = comp ? comp.status || 'complete' : null;
  const logs = readDayLogs(store, id) as unknown as Record<string, (LogEntry & { restLog?: RestLog }) | undefined>;
  const le = logs[key];
  const lastOf = (name: string | undefined): ExEntry | undefined => {
    const row = stored[exStoreKey(name as string)];
    return ((row && row.entries) || []).slice(-1)[0];
  };
  const mainName = safe(() => secs[0]!.items![0]!.name, undefined);
  const items = secs.flatMap((sec) => (sec.items || []) as { name?: string; detail?: string }[]);
  const reads = () => deckReads(store, prog, week, dayKey, nowMs, warn);

  // The page's buildLogHTML's reads: the day's entry, then the log drawn from it, the dose set for the fields.
  let dose: Dose | null = null;
  const log: SessionLogData = sessionLog(le || {}, day.cardio, {
    rpeLabels: RPE_LABELS,
    dose: (c) => doseFromCardio(c as CardioDay),
    setDoseFull: () => {},
    setSub: () => {},
    setDose: (d) => { dose = (d as Dose | null) || null; },
    fields: (sport, e, d, sub): CardioFields => cardioFields(sport, e, d as Dose | null, sub, { spec: IAW_SPEC, sessionCode: (s, k, t) => runSessionCode(s, k, t), pace: (sec) => fmtPaceMi(sec) }),
    live: (e, sport) => cardioEntryLogged(e as never, sport),
    noteText: (active, planned, e) => cardioSwapNoteText(active, planned, e as never),
    logLabel: (live) => cardioLogLabel(live),
  });

  const body = detailBody({
    main: secs.length ? sectionsView([secs[0]!], 0, reads()) : [],
    e1rm: day.testLift ? e1rmCard(String(day.testLift), unit, safe(() => lastOf(mainName) as never, undefined)) : null,
    rest: secs.length ? sectionsView(secs.slice(1), 1, reads()) : [],
    cardio: cardioCard(day.cardio, day.cardio ? benchNotes(day.cardio, (wk) => benchmarkEntryFor(store, id, wk), (s) => _clkMS(s)) : []),
    note: day.note,
    nudge: safe(() => rangeNudge(items, lastOf as never), null),
    wildcard: wildcardSub(wildcardOn(store, id, week, dayKey), safe(() => (prog.weeks[week]![dayKey] ?? null) as { rest?: unknown; title?: string } | null, null)),
    log,
    logNudge: !status && hasLogged(le) ? logNudge(dayKey, day.title) : null,
    also: safe(() => alsoJog(DAY_FULL[dayKey] || dayKey, restLogLines(le && le.restLog), week, dayKey), null),
  }, liftsFirst(secs.length > 0, prog.primaryPath, prog.liftingFocus), secs.length > 0);

  return {
    week, dayKey,
    over: 'Week ' + week + ' · ' + DAY_FULL[dayKey],
    title: (comp && comp.title) || day.title || 'Training',
    tags,
    counter: loggedCount(progress),
    body,
    foot: statusFoot(dayStatus(store, id, week, dayKey)),
    footTitle: day.title || '',
    dose,
  };
}

/** The foot drawn again for the day's status (the page's renderStatusFoot), after an undo leaves the sheet open. */
export function footOf(store: StateStore, prog: SheetProgram, week: number, dayKey: string): [FootButton, FootButton] {
  return statusFoot(dayStatus(store, prog.id, week, dayKey));
}

/** The log block of a sheet as drawn. */
export function logOf(v: SheetView): SessionLogData {
  return (v.body.find((b) => b.kind === 'log') as { kind: 'log'; log: SessionLogData }).log;
}

// ── What the screen draws from the view (SessionSheet.tsx) ───────────────────────────────────────────────────────
/**
 * The blocks of the body this app draws so far, in the view's own order: the range nudge, the sections with their
 * cards, the cardio card, the log and the never marked nudge. A double day's jog, the Wildcard tag, the 1RM card and
 * the day's note stay in the view and are not drawn until their own session.
 */
export const SHEET_DRAWS: readonly BodyBlock['kind'][] = ['nudge', 'sections', 'cardio', 'log', 'logNudge'];
export function drawnBlocks(v: SheetView): BodyBlock[] { return v.body.filter((b) => SHEET_DRAWS.includes(b.kind)); }

/** Every move's card of a sheet, in order. */
export function sheetMoves(v: SheetView): ExCard[] {
  return v.body.flatMap((b) => (b.kind === 'sections' ? b.sections : [])).flatMap((sec) => (sec.kind === 'section' ? sec.body.items : [])).filter((x): x is ExCard => x.kind === 'card');
}
/** Each move's fields as its card draws them: at the sheet's opening, and again after every redraw. */
export function sheetFields(v: SheetView): Fields {
  const out: Fields = {};
  for (const x of sheetMoves(v)) out[x.exKey] = fieldsOf(x);
  return out;
}

/** A colour the models name as the page's token ("var(--run)", "rgba(var(--run-rgb),0.15)"): the token's name and its alpha. */
export function tokenOf(css: string): { name: string; alpha: number } | null {
  const solid = /^var\(--([a-z0-9-]+)\)$/.exec(css);
  if (solid) return { name: solid[1]!, alpha: 1 };
  const tint = /^rgba\(var\(--([a-z0-9-]+)-rgb\),\s*([0-9.]+)\)$/.exec(css);
  return tint ? { name: tint[1]!, alpha: +tint[2]! } : null;
}

/** The page's RPE reference (overlays.html #rpeInfoOverlay), opened from the header's RPE mark and the log's. */
export const RPE_INFO = {
  title: 'RPE — Rate of Perceived Exertion',
  sub: 'How hard it feels on a 1–10 scale. Use the talk test to place your effort:',
  scale: [['1–3', 'Easy — can hold a full conversation'], ['4–6', 'Moderate — short sentences only'], ['7–8', 'Hard — a few words at a time'], ['9–10', 'Max — can\'t talk, all-out']] as const,
  notes: [
    'Lifting uses the same feel — it\'s how many reps you leave in reserve (RPE 8 ≈ 2 reps left in the tank).',
    'Rest between sets: 2–3 minutes on main lifts, 60–90 seconds on everything else unless the card says otherwise.',
    'Accessories: hit the top of the rep range on every set, then add weight and start back at the bottom of the range.',
  ],
  close: 'Got it',
} as const;

/** What This Week hands the sheet it opens: the launch's grid, the week and the day, and the day as first drawn. */
export interface SheetOpen { prog: SheetProgram; week: number; dayKey: string; view: SheetView }
