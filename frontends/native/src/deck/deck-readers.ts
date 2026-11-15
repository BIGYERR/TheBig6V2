// What the swipe deck's cards read beside the stored state, for the Expo app (MIGRATION.md phase 3, the first screen).
// Today's Angular deck reaches these in the legacy page through its bridge (tests/measure/native-deck_reads.md: 26
// readers behind the cards still in the page, 212 lines, none of them a write). Each one here is the page's own
// function, line for line, with the page's globals (the active program's id, the week and the day in hand, the unit,
// the store, the clock) taken as arguments. The page keeps its own until the cutover deletes it;
// tests/integration/native-deck.test.ts holds every card these draw equal to the page's over whole histories, so a
// change to either turns red until the other follows. Nothing here writes: no store call but a read.
import { EQUIP_TOKENS } from '@ia/core/engine/exercise-kinds.ts';
import { foldExAliasKeys } from '@ia/core/engine/exercise-library.ts';
import { _auxFamily, _pattern } from '@ia/core/engine/region-caps.ts';
import { readLiftLog } from '@ia/core/engine/state-lift-log.ts';
import { readPrograms } from '@ia/core/engine/state-programs.ts';
import type { StateStore } from '@ia/core/engine/state-store.ts';
import { readSwaps } from '@ia/core/engine/state-swaps.ts';

import type { ExEntry, ExItem, Rx } from '../day-detail/session-sections-model';

const DAY_MS = 86400000;

// ── The prescription (week-view-sections.ts) ─────────────────────────────────────────────────────────────────────
/** The page's _parseRxLoose: the shapes parseRx's first three patterns do not read. */
function parseRxLoose(d: string, name: unknown): Rx | null {
  const perSide = /each/.test(d);
  const mSetsMax = d.match(/^(\d+)\s*[×x]\s*max\b/);
  if (mSetsMax) return { sets: Math.min(+mSetsMax[1]!, 20), open: true, perSide };
  const mRounds = d.match(/[×x]\s*(\d+)\s*$/);
  if (mRounds && /\bon\b/.test(d) && /\boff\b/.test(d)) return { sets: Math.min(+mRounds[1]!, 20), open: true, perSide: false };
  if (/^\d+\s*(min|sec)\b/.test(d) && /\bmax\b|amrap|failure/.test(d)) return { sets: 1, open: true, perSide };
  const mLadder = d.match(/^(\d+(?:\s*[\/,]\s*(?:\d+|amrap|max))+)/);
  if (mLadder) {
    const parts = mLadder[1]!.split(/[\/,]/).map((x) => x.trim());
    if (parts.length >= 2 && parts.length <= 20) {
      const targets = parts.map((x) => (/^(amrap|max)$/.test(x) ? null : +x));
      const tok = /\bsec\b/.test(d) ? 'sec' : (/\byd\b|\byards?\b/.test(d) ? 'yd' : '');
      const first = targets.filter((t) => t != null)[0] || 0;
      return { sets: targets.length, kind: tok === 'sec' ? 'sec' : (tok === 'yd' ? 'dist' : 'reps'),
        unit: tok, step: tok === 'sec' ? 5 : 1, target: first, targets, perSide };
    }
  }
  if (/^(max|amrap)\b/.test(d)) return { sets: 1, open: true, perSide };
  const mOne = d.match(/^(\d+)\s*(seconds?|secs?|sec|s|yards?|yds?|yd|reps?|each)\b/);
  if (mOne) {
    const v = +mOne[1]!, tok = mOne[2]!;
    if (/^(seconds?|secs?|sec|s)$/.test(tok)) return { sets: 1, kind: 'sec', unit: 'sec', step: 5, target: v, perSide };
    if (/^(yards?|yds?|yd)$/.test(tok)) return { sets: 1, kind: 'dist', unit: 'yd', step: 1, target: v, perSide };
    return { sets: 1, kind: 'reps', unit: '', step: 1, target: v, perSide };
  }
  const mAim = d.match(/\baim\s+(\d+)/);
  if (mAim) return { sets: 1, kind: 'reps', unit: '', step: 5, target: +mAim[1]!, perSide };
  const mName = String(name || '').match(/^(\d+)\s+\S/);
  if (mName) return { sets: 1, kind: 'reps', unit: '', step: 1, target: +mName[1]!, perSide };
  return null;
}

/** The page's parseRx: a prescription as sets, a target or a ladder of them, a unit and a step; null when it names none. */
export function parseRx(detail: unknown, name: unknown): Rx | null {
  const d = (String(detail || '')).toLowerCase();
  const mSetsOf = d.match(/^(\d+)\s*sets?\s+of\s+(\d+)(?:\s*(?:to|[–-])\s*(\d+))?/);
  if (mSetsOf) {
    const lo = +mSetsOf[2]!, hi = mSetsOf[3] ? +mSetsOf[3] : null;
    return { sets: Math.min(+mSetsOf[1]!, 20), kind: 'reps', unit: '', step: 1,
      target: hi ? Math.round((lo + hi) / 2) : lo, perSide: /each/.test(d) };
  }
  const mOpen = d.match(/^(\d+)\s*sets?\b(?!\s*of\s*\d)/);
  if (mOpen) return { sets: Math.min(+mOpen[1]!, 20), open: true, perSide: /each/.test(d) };
  const m = d.match(/^(\d+)\s*[×x]\s*(\d+)(?:\s*[–-]\s*(\d+))?\s*(?:(sec|s|yd)\b)?/);
  if (!m) return parseRxLoose(d, name);
  const sets = Math.min(+m[1]!, 20), lo = +m[2]!, hi = m[3] ? +m[3] : null, unitTok = m[4], perSide = /each/.test(d);
  const mid = hi ? Math.round((lo + hi) / 2) : lo;
  if (unitTok === 'sec' || unitTok === 's') return { sets, kind: 'sec', unit: 'sec', step: 5, target: hi ? Math.round(((lo + hi) / 2) / 5) * 5 : lo, perSide };
  if (unitTok === 'yd') return { sets, kind: 'dist', unit: 'yd', step: 1, target: mid, perSide };
  return { sets, kind: 'reps', unit: '', step: 1, target: mid, perSide };
}

/** The page's rxSuffix: the unit a set's number carries. */
export function rxSuffix(rx: Rx | null | undefined): string {
  if (!rx) return '';
  if (rx['kind'] === 'sec') return rx['perSide'] ? 'sec/side' : 'sec';
  if (rx['kind'] === 'dist') return rx['perSide'] ? 'yd/side' : 'yd';
  return rx['perSide'] ? '/side' : '';
}

/** The page's _stripLeadingSets: a round's row without its own set count. */
export function stripLeadingSets(d: unknown): string {
  return String(d || '')
    .replace(/^(\d+)\s*[x×]\s*/, '')
    .replace(/^(\d+)\s*sets?\s+of\s+/i, '')
    .replace(/^(\d+)\s*sets?\s*(?:—|–|-)\s*/i, '')
    .replace(/^(\d+)\s*sets?\b\s*/i, '');
}

// ── The set summary (set-logging.ts) ─────────────────────────────────────────────────────────────────────────────
/** The page's setsVaried: the sets do not all hold one number. */
export function setsVaried(arr: unknown[] | null | undefined): boolean {
  if (!arr || arr.length < 2) return false;
  return arr.some((x) => +(x as number) !== +(arr[0] as number));
}

/** The page's flatDiverged: every set holds one number, and it is not the prescription's. */
function flatDiverged(rx: Rx | null | undefined, arr: unknown[] | null | undefined): boolean {
  if (!rx || !arr || !arr.length) return false;
  if (setsVaried(arr)) return false;
  const v = +(arr[0] as number);
  if (!(v > 0)) return false;
  if (arr.length !== rx.sets) return true;
  if (rx.open) return true;
  if (rx.targets) return rx.targets.some((t) => t == null || +t !== v);
  return v !== +(rx.target as number);
}

/** The page's setsSummary: the line beside Sets. */
export function setsSummary(rx: Rx | null | undefined, _wkW: unknown[], wkR: unknown[]): string {
  if (!rx) return '';
  const suf = rxSuffix(rx);
  if (setsVaried(wkR)) return wkR.join(' / ') + (suf ? ' ' + suf : '');
  if (flatDiverged(rx, wkR)) return wkR.length + ' × ' + wkR[0] + (suf ? ' ' + suf : '');
  if (rx.open) return rx.sets + ' × max';
  if (rx.targets) return rx.targets.map((t) => (t == null ? 'max' : t)).join(' / ') + (suf ? ' ' + suf : '');
  return rx.sets + ' × ' + rx.target + (suf ? ' ' + suf : '');
}

/** The page's setsSubLabel: the words after the summary. */
export function setsSubLabel(rx: Rx | null | undefined, _wkW: unknown[], wkR: unknown[], logged: boolean): string {
  if (setsVaried(wkR)) return '';
  if (logged) return 'logged';
  if (flatDiverged(rx, wkR)) return 'not logged';
  if (rx && rx.open) return 'nothing logged';
  return 'as prescribed';
}

/** The page's toDispW, with the program's unit given (the page reads window._unitLabel): a stored load as it is shown. */
export function toDispW(lbs: unknown, unit: string): number | '' {
  if (lbs === '' || lbs == null) return '';
  return unit === 'kg' ? Math.round((+(lbs as number)) * 0.453592 * 2) / 2 : +(lbs as number);
}

// ── How old a load is (set-logging.ts) ───────────────────────────────────────────────────────────────────────────
/** The page's STALE_LOAD_DAYS: past this many days a reused load is questioned. */
export const STALE_LOAD_DAYS = 21;

/** The page's recencyBucket, with the time given (the page reads the clock itself). */
function recencyBucket(ts: number | undefined, nowMs: number): { i: number; days: number | null } {
  if (!ts) return { i: -1, days: null };
  const days = Math.floor((nowMs - ts) / DAY_MS);
  let i: number;
  if (days <= 0) i = 0;
  else if (days === 1) i = 1;
  else if (days < 7) i = 2;
  else if (days < 14) i = 3;
  else if (days < 28) i = 4;
  else if (days < 60) i = 5;
  else i = 6;
  return { i, days };
}

/** The page's isStaleTs. */
export function isStaleTs(ts: number | undefined, nowMs: number): boolean {
  const b = recencyBucket(ts, nowMs);
  return b.days != null && b.days > STALE_LOAD_DAYS;
}

/** The page's recencyLabel: how long ago, as the reuse pill says it; `form` 'age' is the stale warning's wording. */
export function recencyLabel(ts: number | undefined, form: 'age' | undefined, nowMs: number): string {
  const b = recencyBucket(ts, nowMs), d = b.days;
  if (b.i < 0) return form === 'age' ? 'from an earlier block' : 'last time';
  if (form === 'age') {
    if (b.i === 0) return 'from earlier today';
    if (b.i === 1) return 'from yesterday';
    if (b.i === 2) return 'about ' + d + ' days old';
    if (b.i === 3) return 'about a week old';
    if (b.i === 4) return 'about ' + Math.floor(d! / 7) + ' weeks old';
    if (b.i === 5) return 'about a month old';
    return 'about ' + Math.floor(d! / 30) + ' months old';
  }
  if (b.i === 0) return 'earlier today';
  if (b.i === 1) return 'yesterday';
  if (b.i === 2) return d + ' days ago';
  if (b.i === 3) return 'last week';
  if (b.i === 4) return Math.floor(d! / 7) + ' weeks ago';
  if (b.i === 5) return 'last month';
  return Math.floor(d! / 30) + ' months ago';
}

// ── The lift log of the other programs (set-logging.ts) ──────────────────────────────────────────────────────────
/** The page's crossProgLastEntry: the newest load for the exercise in any other program, and that program's name. */
export function crossProgLastEntry(store: StateStore, programId: string | null, exKey: string): { entry: ExEntry; progName?: string } | null {
  let best: ExEntry | null = null, bestName = '';
  (readPrograms(store) as unknown as { id?: string; name?: string }[]).forEach((p) => {
    if (!p || !p.id || p.id === programId) return;
    let log: Record<string, { entries?: ExEntry[] } | undefined> | null = null;
    try { log = JSON.parse(JSON.stringify(readLiftLog(store, p.id) || {})); } catch { return; }
    if (!log) return;
    try { foldExAliasKeys(log as never); } catch { /* the page swallows it too */ }
    const row = log[exKey];
    if (!row) return;
    (row.entries || []).forEach((e) => {
      if (!(+(e.weight as number) > 0)) return;
      if (!best || (+(e.ts as number) || 0) > (+(best.ts as number) || 0)) { best = e; bestName = p.name || ''; }
    });
  });
  return best ? { entry: best, progName: bestName } : null;
}

// ── The card's controls (set-logging.ts, log-entries.ts, swap-sheet.ts) ──────────────────────────────────────────
/** The page's exControlFlags: whether an item can be swapped or skipped (a note can be neither). */
export function exControlFlags(sec: unknown, itemIdx: number, it: ExItem | null | undefined): { isNote: boolean; inSS: boolean; isMainSlot: boolean; canSwap: boolean; canSkip: boolean } {
  const s = sec as { superset?: unknown; type?: string; label?: string } | null;
  const name = (it && it.name) || '';
  const isNote = /^\s*<svg/i.test(name);
  const inSS = !!(s && (s.superset || s.type === 'superset'));
  const isMainSlot = !inSS && itemIdx === 0 && /^main/i.test((s && s.label) || '');
  const canSwap = !isNote && (!!_pattern(name) || !!_auxFamily(name));
  const canSkip = !isNote;
  return { isNote, inSS, isMainSlot, canSwap, canSkip };
}

/** The page's hasEquip: the name holds one of a family's words. */
function hasEquip(name: string, fam: string): boolean {
  const n = (name || '').toLowerCase();
  return (EQUIP_TOKENS[fam] || []).some((t) => n.includes(t));
}
/** The page's isKBExercise. */
export function isKBExercise(name: string): boolean {
  if (!name) return false;
  return hasEquip(name, 'kettlebell');
}

/** The page's swapOriginOf, for the session's own day: the lift this one was swapped in for, or null. */
export function swapOriginOf(store: StateStore, programId: string | null, week: number, dayKey: string | null, name: string): string | null {
  if (!programId || !dayKey) return null;
  const list = (readSwaps(store, programId)['w' + week + '_' + dayKey]) || [];
  const hit = list.filter((e) => e && e.to === name).pop();
  return hit ? hit.from : null;
}
