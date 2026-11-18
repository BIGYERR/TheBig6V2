// The log's wheels in the Expo app, as rules (MIGRATION.md phase 3, row 3: the cardio sheet). The page's wheel-log.ts,
// line for line, with the page's elements taken as arguments: what a stored string seeds a wheel with, the string a
// rest on a face writes, the face a wheel opens on, when a rest writes at all, and where a wrapped column is jumped
// back toward its middle. Each rule keeps its ruling (V182 D1 to D6, V184 D5, V232 D199 to D203, V233 D207 to D210,
// V235 D215 and D216, V237 D220 to D222). How a wheel moves is the screen's (Wheel.tsx).
//
//   _iawParse, _iawFormat, _iawHome, _iawRecenter, _iawCommit, iaWheelInit (the seed)     wheel-log.ts
import type { WheelColSpec, WheelSpec, WheelView } from './cardio-fields-model';
import { WHEEL_REPS, wheelRows, wheelWraps } from './cardio-fields-model';
import { IAW_SPEC } from './sheet-readers';

/** A wheel row's height in points (the page's _IAW_ROW). */
export const WHEEL_ROW = 44;
/** How long a wheel rests before its face is read, in milliseconds (the page's settle timer). */
export const WHEEL_SETTLE_MS = 90;

const specOf = (kind: string): WheelSpec => IAW_SPEC[kind]!;

/**
 * The page's _iawParse: a stored string to one row value per column. Out of range and malformed values clamp for
 * display only. Run minutes are stored as decimal minutes and read back as a clock, pegged at the dial's ceiling
 * (D200, D208); a blank or malformed time, miles or rep time lands on its zero face (D215, D220); pace alone keeps its
 * dash (D222).
 */
export function wheelParse(kind: string, val: unknown): string[] {
  const sp = specOf(kind), s = String(val == null ? '' : val).trim();
  if (sp.fmt === 'hms') {
    const mh = s.match(/^\d*(?:\.\d+)?/);
    if (!mh || mh[0] === '') return ['0', '0', '0'];
    let t = Math.round(parseFloat(mh[0]) * 60);
    t = Math.min(t, sp.cols[0]!.max * 3600 + sp.cols[1]!.max * 60 + sp.cols[2]!.max);
    return [String(Math.floor(t / 3600)), String(Math.floor((t % 3600) / 60)), String(t % 60)];
  }
  if (!s) return kind === 'pace' ? ['', ''] : (sp.fmt === 'dec3' ? ['0', '0', '0'] : ['0', '0']);
  if (sp.fmt === 'dec3') {
    const m3 = s.match(/^(\d*)(?:\.(\d)(\d)?)?/);
    if (!m3 || m3[0] === '') return ['0', '0', '0'];
    const a3 = Math.max(sp.cols[0]!.min, Math.min(sp.cols[0]!.max, +m3[1]!));
    const b3 = m3[2] == null ? 0 : +m3[2], c3 = m3[3] == null ? 0 : +m3[3];
    return [String(a3), String(b3), String(c3)];
  }
  const m = sp.fmt === 'dec' ? s.match(/^(\d+)(?:\.(\d))?/) : s.match(/^(\d+):(\d{1,2})/);
  if (!m) return kind === 'rept' ? ['0', '0'] : ['', ''];
  let a = +m[1]!, b = m[2] == null ? 0 : +m[2];
  const c0 = sp.cols[0]!, c1 = sp.cols[1]!;
  a = Math.max(c0.min, Math.min(c0.max, a));
  b = Math.max(c1.min, Math.min(c1.max, b));
  return [String(a), String(b)];
}

/**
 * The page's _iawFormat: row values to the string the field stores. The dash stores nothing. A clock with hours stores
 * decimal minutes to two places (D200), and its zero face nothing (D215); miles and the rep clock store nothing at
 * zero (D220); the clock always pads its seconds.
 */
export function wheelFormat(kind: string, vals: readonly (string | null | undefined)[]): string {
  const sp = specOf(kind);
  if (vals[0] === '') return '';
  const b = vals[1] === '' ? '0' : vals[1];
  if (sp.fmt === 'hms') {
    const sx = vals[2] === '' || vals[2] == null ? '0' : vals[2];
    if ((+vals[0]!) * 3600 + (+b!) * 60 + (+sx) === 0) return '';
    return ((+vals[0]!) * 60 + (+b!) + (+sx) / 60).toFixed(2);
  }
  if (sp.fmt === 'dec3') {
    const c = vals[2] === '' || vals[2] == null ? '0' : vals[2];
    if ((+vals[0]!) * 100 + (+b!) * 10 + (+c) === 0) return '';
    return vals[0] + '.' + b + c;
  }
  if (kind === 'rept' && (+vals[0]!) * 60 + (+b!) === 0) return '';
  return sp.fmt === 'dec' ? (vals[0] + '.' + b) : (vals[0] + ':' + ('00' + b).slice(-2));
}

/** The page's _iawHome: the row a column opens from, the start of its middle copy when it wraps. */
export function wheelHome(c: WheelColSpec): number {
  return wheelWraps(c) ? Math.floor(WHEEL_REPS / 2) * wheelRows(c).length : 0;
}

/** A wheel as it opens: the row each column lands on, and the face that shows (the page's _iawSeedFace). */
export interface WheelSeed {
  rows: number[];
  face: string;
}

/**
 * The page's iaWheelInit, as far as it seeds: the stored string, or the plan the wheel carries when storage is blank
 * (D202, display only), parsed to a row per column; each column lands on that value's first row from its home, or on
 * its home when no row holds it. The face is what the wheel then shows, which a rest must leave before anything is
 * written.
 */
export function wheelSeed(w: WheelView): WheelSeed {
  const sp = specOf(w.kind);
  const seed = wheelParse(w.kind, w.value !== '' ? w.value : (w.plan || ''));
  const rows: number[] = [], landed: string[] = [];
  w.cols.forEach((col, ci) => {
    const home = wheelHome(sp.cols[ci]!);
    let idx = home;
    for (let k = home; k < col.items.length; k++) if (col.items[k]!.v === seed[ci]) { idx = k; break; }
    rows[ci] = idx;
    landed[ci] = col.items[idx] ? col.items[idx]!.v : '';
  });
  return { rows, face: wheelFormat(w.kind, landed) };
}

/** The value a column rests on (the page's _iawSel): the row nearest its offset, held inside the list. */
export function wheelSel(col: { items: readonly { v: string }[] }, offset: number): string {
  if (!col.items.length) return '';
  let i = Math.round(offset / WHEEL_ROW);
  if (i < 0) i = 0;
  if (i > col.items.length - 1) i = col.items.length - 1;
  return col.items[i]!.v;
}

/**
 * The page's _iawRecenter: a wrapped column at rest near either end is jumped half its span back toward the middle.
 * The value under the band is the same in every copy, so the jump shows nothing. Returns the offset to stand at.
 */
export function wheelRecentre(col: { wrap: boolean; len: number }, offset: number): number {
  if (!col.wrap) return offset;
  const len = col.len, i = Math.round(offset / WHEEL_ROW);
  const half = Math.floor(WHEEL_REPS / 2) * len * WHEEL_ROW;
  if (i < len) return offset + half;
  if (i > len * (WHEEL_REPS - 1)) return offset - half;
  return offset;
}

/** What a wheel remembers between rests: whether it has left the face it opened on, and that face. */
export interface WheelMoved {
  moved: boolean;
  seedFace: string;
}

/**
 * The page's _iawCommit: a rest on a face. Until the wheel has rested on a face other than the one it opened on,
 * nothing is written, so opening a day never writes (V232). After that only a face the field already holds is passed
 * over. Returns the string to write to the field, or null for nothing, and what the wheel now remembers.
 */
export function wheelRest(kind: string, st: WheelMoved, vals: readonly string[], held: string): { write: string | null; st: WheelMoved } {
  const next = wheelFormat(kind, vals);
  if (!st.moved) {
    if (next === st.seedFace) return { write: null, st };
    st = { moved: true, seedFace: st.seedFace };
  }
  if (held === next) return { write: null, st };
  return { write: next, st };
}
