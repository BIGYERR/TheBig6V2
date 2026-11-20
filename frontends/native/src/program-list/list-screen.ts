// The Programs tab in the Expo app, as views (MIGRATION.md phase 3, row 5): the stored state and the clock in, the
// words of the list, of the goal sheet and of the mile pencil out. The arrangement is today's own models
// (program-list-model.ts, program-detail-model.ts, goal-sheet-model.ts, mile-sheet-model.ts: copies of the Angular
// screens', held equal to the byte), so every word, number and order here is today's, with its rulings unchanged
// (D5 the goal switch, D116 the mile pencil, D178 the one switch, D182 the race countdown). The Angular screens feed
// those models through their bridge into the legacy page; this feeds them from core's readers of the stored state
// and from list-readers.ts. What stands here is the page's code around them, line for line:
//
//   toggleProgCard, startRename, cancelRename, askArchive, askPurge, cancelConfirm        programs.ts, program-manage.ts
//   renderProgList (the Angular program-list.ts read), progDetailHTML's reads             programs.ts
//   openGoalSheet, selectGoalOpt, _goalSetInput, renderGoalSheet (the Angular render)     programs.ts
//   openMileSheet (the Angular mile-sheet.ts open)                                        programs.ts
//   tabGo's refusal of This Week and Progress with no active program                      rest-day-shell.ts
//
// Drawing writes nothing. The writes are list-writes.ts's. Not built: Copy selections (the clipboard is a native
// package this app does not carry yet) and Build New Program (the wizard, row 6); both are drawn and take no press.
import { _isoOf } from '@ia/core/engine/calendar.ts';
import { asyIcon } from '@ia/core/engine/icons.ts';
import { raceCountdown, raceCountdownWords } from '@ia/core/engine/nrc-race-bike-swim.ts';
import { readPrograms } from '@ia/core/engine/state-programs.ts';
import type { RefreshReport } from '@ia/core/engine/state-refresh.ts';
import type { StateStore } from '@ia/core/engine/state-store.ts';

import { type GoalDraft, type GoalSheetView, goalSheetView } from '../goal-sheet/goal-sheet-model';
import { type MileFact, mileField, mileLockFacts, mileLocked } from '../mile-sheet/mile-sheet-model';
import { fmtStartDay } from '../this-week/week-readers';
import { PLAN_CHANGE_FAILED, midnight, storedProgram } from '../this-week/week-screen';
import {
  CARDIO_GOALS_BY_TYPE, CARDIO_LABELS, DAYF, GOAL_LABELS, GOAL_RANK, GOAL_REQ_INPUTS, HYBRID_EXCLUDED_GOALS, type ListProgram,
  goalCurWeek, goalInputsValid, progSelData, runAnchorChips, runAnchorSentence,
} from './list-readers';
import { type ProgramDetailView, programDetail } from './program-detail-model';
import { type ListedProgram, type ProgramCard, programList } from './program-list-model';

/** What the page keeps in four globals between draws: the open cards, the card being renamed, the confirmation armed. */
export interface ListState { openIds: Set<string>; editId: string | null; confirmId: string | null; confirmTier: number }
/** The globals as a launch leaves them (rest-day-shell.ts). */
export function newListState(): ListState { return { openIds: new Set(), editId: null, confirmId: null, confirmTier: 0 }; }

/** A tap on a card (toggleProgCard): open, or shut again. */
export function toggleCard(st: ListState, id: string): void { st.openIds = new Set(st.openIds.has(id) ? [...st.openIds].filter((x) => x !== id) : [...st.openIds, id]); }
/** The pencil by a name (startRename). */
export function startRename(st: ListState, id: string): void { st.editId = id; }
/** The rename's X, and the end of its Save (cancelRename, commitRename's tail). */
export function endRename(st: ListState): void { st.editId = null; }
/** Archive, the first tap (askArchive): the question stands in place of the buttons. */
export function askArchive(st: ListState, id: string): void { st.confirmId = id; st.confirmTier = 1; }
/** Delete forever…, the link under the question (askPurge): the warning stands in its place. */
export function askPurge(st: ListState, id: string): void { st.confirmId = id; st.confirmTier = 2; }
/** Cancel, and the end of Archive and of Delete Forever (cancelConfirm, archiveProg's and deleteProg's tails). */
export function cancelConfirm(st: ListState): void { st.confirmId = null; st.confirmTier = 0; }

/** The words the list writes around its models (the Angular program-list.ts). */
export const LIST_WORDS = {
  title: 'Your Programs',
  build: '+ Build New Program',
  setActive: 'Set Active', active: 'Active ✓', archive: 'Archive', cancel: 'Cancel', save: 'Save',
  purgeLink: 'Delete forever…', purge: 'Delete Forever',
  archiveNote: 'It leaves your program list but its history stays. View it anytime under Progress.',
} as const;
/** The archive's question, with the program's name (archiveQuestion). */
export const archiveQuestion = (name: string): string => 'Archive “' + name + '”?';
/** The delete's warning, with the program's name (purgeWarning). */
export const purgeWarning = (name: string): string => 'This erases all logs, weights, and history for “' + name + '”. It cannot be undone.';

/**
 * What a switch or a rebuild is told when a part of it fails (the page's refreshProgram, program-manage.ts): each
 * goes to the console in the page's own words, and a plan change that did not apply is said, as the page's toast.
 */
export function refreshReport(say: (text: string) => void, log: (...a: unknown[]) => void = console.error): RefreshReport {
  return {
    overlay: (ov, e) => { log('overlay apply failed', ov && ov.id, e); say(PLAN_CHANGE_FAILED); },
    freeze: (e) => { log('week freeze failed; showing fully rebuilt weeks', e); },
    rebuild: (e) => { log('refreshProgram failed; using stored program', e); },
  };
}

/** Today's words for a tab that needs an active program when there is none (tabGo). */
export const NO_ACTIVE = 'No active program. Tap Set Active or build a new one.';
/**
 * The page's tabGo, as far as it refuses: This Week and Progress do not open with no active program (none stored,
 * or every one archived), and say why; Programs and Bugs always open. Returns the toast, or null when the tab opens.
 */
export function tabRefused(store: StateStore, tab: 'home' | 'week' | 'progress' | 'bugs'): string | null {
  if (tab === 'home' || tab === 'bugs') return null;
  return storedProgram(store) ? null : NO_ACTIVE;
}

/** One card with its detail, as the list draws both. */
export interface ListCard extends ProgramCard { detail: ProgramDetailView }
/** One draw of the list. */
export interface ListView { empty: 'none' | 'archived' | null; cards: ListCard[] }

/** The page's activeProgId after its launch: the program a launch loads (week-screen.ts), or null. */
export function activeId(store: StateStore): string | null {
  const a = storedProgram(store);
  return a ? a.id : null;
}

/** The page's renderProgList, as the Angular list reads it: each unarchived program's card and its detail, or why there are none. */
export function listView(store: StateStore, st: ListState, now: Date): ListView {
  const all = readPrograms(store) as unknown as ListProgram[];
  const v = programList(all as ListedProgram[], { activeId: activeId(store), openIds: st.openIds, editId: st.editId, confirmId: st.confirmId, confirmTier: st.confirmTier }, (k, s) => asyIcon(k, s));
  return {
    empty: v.empty,
    cards: v.cards.map((c) => {
      const p = all.find((x) => x.id === c.id)!;
      const s = progSelData(p, now);
      const paces = s.runAnchor ? { chips: runAnchorChips(s.runAnchor), sentence: runAnchorSentence(s.runAnchor) } : null;
      return { ...c, detail: programDetail(p.id, s, { dayNames: DAYF, goalLabels: GOAL_LABELS }, paces) };
    }),
  };
}

/** A run of a line the page writes as markup: an icon, or words, bold or not. */
export interface Run { icon: string | null; text: string; bold: boolean }
const unescape = (t: string): string => t.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
/**
 * Markup the page writes into the list (a card's meta line, the sentence under the paces), as React Native draws it:
 * its lines (the page's <br>), each a row of runs: an inline icon, or words, the words of a <b> marked bold.
 */
export function markupLines(html: string): Run[][] {
  return html.split(/<br\s*\/?>/).map((line) => {
    const runs: Run[] = [];
    const re = /<svg[\s\S]*?<\/svg>|<b>([\s\S]*?)<\/b>/g;
    let at = 0, m: RegExpExecArray | null;
    const words = (t: string, bold: boolean): void => { const x = unescape(t.replace(/<[^>]*>/g, '')); if (x) runs.push({ icon: null, text: x, bold }); };
    while ((m = re.exec(line))) {
      words(line.slice(at, m.index), false);
      if (m[1] !== undefined) words(m[1], true); else runs.push({ icon: m[0], text: '', bold: false });
      at = m.index + m[0].length;
    }
    words(line.slice(at), false);
    return runs;
  });
}

/** The goal sheet's line under its heading (the Angular goal-sheet.ts). */
export const GOAL_INTRO = 'Weeks you already trained stay on the books. The rest of the program rebuilds around the new goal.';
/** The words over the typed targets, and the mark of a bigger goal (the Angular goal-sheet.ts). */
export const GOAL_WORDS = {
  current: 'Current', bigger: 'Bigger goal than your current build.',
  pace: 'Target distance and time. The engine will not guess these for you.',
  time: 'Target time. The engine will not guess this for you.',
  dist: 'dist e.g. 1.5', min: 'min', sec: 'sec',
} as const;

/** The goal sheet as opened on a sport of a program (openGoalSheet), or null when the program is gone. */
export function openGoal(store: StateStore, progId: string, sport: string): GoalDraft | null {
  const p = (readPrograms(store) as unknown as ListProgram[]).find((x) => x.id === progId);
  return p ? { progId, sport, sel: null, inputs: {} } : null;
}
/** A goal picked (selectGoalOpt): the pick, and the typed targets cleared. */
export function selectGoal(draft: GoalDraft, id: string): GoalDraft { return { ...draft, sel: id, inputs: {} }; }
/** A target typed (_goalSetInput). */
export function typeGoal(draft: GoalDraft, key: keyof GoalDraft['inputs'], value: string): GoalDraft { return { ...draft, inputs: { ...draft.inputs, [key]: value } }; }

/** One draw of the goal sheet: its body, and whether the switch takes a tap (_goalRefreshCommit). Null when the program is gone. */
export function goalView(store: StateStore, draft: GoalDraft, now: Date): { view: GoalSheetView; ok: boolean } | null {
  const p = (readPrograms(store) as unknown as ListProgram[]).find((x) => x.id === draft.progId);
  if (!p) return null;
  const sport = draft.sport || '';
  const week = goalCurWeek(p, midnight(now));
  const view = goalSheetView({
    draft,
    sportLabel: CARDIO_LABELS[sport] || sport,
    current: (p.cfg && p.cfg.cardioGoals && p.cfg.cardioGoals[sport]) || null,
    path: (p.cfg && p.cfg.primaryPath) || undefined,
    choices: CARDIO_GOALS_BY_TYPE[sport] || [],
    excluded: HYBRID_EXCLUDED_GOALS,
    rank: GOAL_RANK,
    needsInputs: GOAL_REQ_INPUTS,
    started: !!p.startDate && week > 1,
    week,
  });
  return { view, ok: goalInputsValid(draft) };
}

/** The words of the mile pencil's two sheets outside their model (the Angular mile-sheet.ts and mile-lock.ts). */
export const MILE_WORDS = { title: 'Your mile', min: 'min', sec: 'sec', update: 'Update my mile', keep: 'Keep what I have', lockTitle: 'The row holds', gotIt: 'Got it' } as const;

/** What a tap on the mile pencil opens: the lock with its facts, or the edit sheet with the stored mile in its two fields. */
export type MileOpen = { kind: 'lock'; facts: MileFact[] } | { kind: 'edit'; progId: string; mins: string; secs: string };

/**
 * The page's openMileSheet, as the Angular sheet opens: the lock in a program's last three weeks, judged at the tap,
 * the edit sheet before them. Null when the program is gone.
 */
export function openMile(store: StateStore, progId: string, now: Date): MileOpen | null {
  const p = (readPrograms(store) as unknown as ListProgram[]).find((x) => x.id === progId);
  if (!p) return null;
  const tw = p.totalWeeks || 6;
  const week = goalCurWeek(p, midnight(now));
  if (mileLocked(week, tw)) {
    return {
      kind: 'lock',
      facts: mileLockFacts(p.cfg?.raceDate, week, tw, {
        countdown: (iso) => raceCountdown(iso, _isoOf(now)),
        words: (cd) => raceCountdownWords(cd),
        day: (iso) => fmtStartDay(iso, true),
      }),
    };
  }
  const g = p.cfg?.cardioGoals?.['run'] || {};
  return { kind: 'edit', progId, mins: mileField(g.mileBestMins), secs: mileField(g.mileBestSecs) };
}
