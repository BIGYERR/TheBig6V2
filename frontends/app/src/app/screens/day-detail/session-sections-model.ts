// The session sheet's sections and their exercise cards (the legacy buildSectionsHTML and buildExItem), kept apart from
// Angular so the app's node --test suite reads it as it is (architecture phase E: the set rows move into the
// SessionSections component). Each word, class, id and data attribute is the legacy builders'. The legacy set
// handlers (stepSet, setDelta, autoSaveSets, toggleSets, onSetWeight, cascadeSetWeights, reuseWeight,
// fillAllSetWeights, saveExWeight and the skip and swap controls) still read and change the cards in place by id.

/** A logged entry of an exercise, as far as the card reads it. */
export interface ExEntry {
  week?: number | string;
  weight?: number | string;
  setsW?: (number | string)[];
  setsDone?: (number | string | null)[];
  ts?: number;
  [field: string]: unknown;
}

/** A prescription as the legacy parseRx reads it. */
export interface Rx {
  sets: number;
  target?: number | null;
  targets?: (number | null)[];
  open?: boolean;
  step?: number;
  [field: string]: unknown;
}

/** An exercise on the day. */
export interface ExItem {
  name?: string;
  detail?: string;
  _skipped?: boolean;
  _addedByUser?: boolean;
  [field: string]: unknown;
}

/** A section of the day. */
export interface ExSection {
  label?: string;
  type?: string;
  superset?: boolean;
  _skipped?: boolean;
  _added?: boolean;
  hip?: boolean;
  core?: boolean;
  coreHeader?: string;
  items: ExItem[];
  [field: string]: unknown;
}

/** What the cards read from the legacy script, and the render-time state they set (the rx cache, the stale warning). */
export interface SectionReads {
  exKey: (name: string | undefined) => string;
  entries: (exKey: string) => ExEntry[];
  /** The legacy crossProgLastEntry: the newest load for the exercise in another program. */
  crossLast: (exKey: string) => { entry: ExEntry; progName?: string } | null;
  week: number;
  dayKey: string;
  entryDay: (e: ExEntry) => string;
  unit: string;
  isTime: (name: string) => boolean;
  isKB: (name: string) => boolean;
  isRep: (name: string) => boolean;
  isTrackable: (name: string) => boolean;
  /** Whether a program is active, and the active day's section at an index (the legacy reads of activeProg). */
  hasProgram: boolean;
  daySection: (secIdx: number) => unknown;
  controlFlags: (sec: unknown, itemIdx: number, item: ExItem) => { canSwap: boolean; canSkip: boolean };
  swapOrigin: (name: string) => string | null;
  parseRx: (detail: string, name: string) => Rx | null;
  rxSuffix: (rx: Rx) => string;
  cacheRx: (exKey: string, rx: Rx) => void;
  setsSummary: (rx: Rx, w: unknown[], r: unknown[]) => string;
  setsSubLabel: (rx: Rx, w: unknown[], r: unknown[], logged: boolean) => string;
  setsVaried: (arr: unknown[]) => boolean;
  readDraft: (exKey: string) => { r?: unknown[]; w?: unknown[]; L?: string } | null;
  toDispW: (lbs: unknown) => number | '';
  isStale: (ts: number | undefined) => boolean;
  recency: (ts: number | undefined, form?: 'age') => string;
  /** The once-per-sheet stale warning: whether it has spoken, the program it named, and marking it spoken. */
  warnShown: () => boolean;
  warnSrc: () => string;
  speakWarn: (src: string) => void;
  stripLeadingSets: (detail: string) => string;
  secRounds: (sec: ExSection) => number | null;
}

/** One set row. */
export interface SetRow {
  s: number;
  rowId: string;
  value: string;
  cls: string;
  placeholder: string;
  /** The rung's target, on a row that has one. */
  rx: string | null;
  suffix: string;
  deltaCls: string;
  deltaText: string;
  step: number;
  /** The per-set load cell, on a movement that carries load. */
  weight: { id: string; value: string; cls: string; unit: string } | null;
}

/** The reuse pill and its fill-every-set twin. */
export interface ReusePill {
  stale: boolean;
  value: number;
  text: string;
  rec: string;
}

export interface ExCard {
  kind: 'card';
  exKey: string;
  name: string;
  /** The prescription as shown (a round's rows state reps and effort only), and as written, which Log saves. */
  detail: string;
  rxDetail: string;
  logged: boolean;
  /** The swap control's section and item. */
  swap: { secIdx: number; itemIdx: number } | null;
  skip: boolean;
  added: boolean;
  swappedFrom: string | null;
  log: {
    sets: { head: string; sub: string; varied: boolean; rows: SetRow[]; foot: string | null } | null;
    load: { label: string; value: string; step: number; unit: string; reuse: ReusePill | null; warn: string | null; fill: ReusePill | null } | null;
  } | null;
}

export type ExView = { kind: 'skipped'; name: string } | ExCard;

export type SectionView =
  | { kind: 'skippedRound'; secIdx: number; text: string }
  | {
    kind: 'section';
    /** The Main or Primer label, as markup. */
    label: string | null;
    body:
      /** A block of cards under its own label: the athlete's additions and the hip work (markup), a round reduced to one (words). */
      | { kind: 'block'; label: { text: string; markup: boolean; color: string } | null; items: ExView[] }
      | { kind: 'core'; header: string; items: ExView[] }
      | { kind: 'round'; secIdx: number; header: string; items: ExView[] };
  };

const nz = (x: unknown): boolean => x != null && x !== '';

/** The legacy buildExItem: a struck-through stub for a skipped exercise, else its card. */
export function exItemView(i: ExItem, secIdx: number | null, itemIdx: number | null, ssRounds: number | null | undefined, r: SectionReads): ExView {
  const name = i.name || '';
  const detail = i.detail || '';
  const disp = ssRounds != null && !i._skipped ? r.stripLeadingSets(detail).replace(/^\d+(\s*[–-]\s*\d+)?$/, '$& reps') : detail;
  const exKey = r.exKey(i.name);
  if (i._skipped) return { kind: 'skipped', name };
  const entries = r.entries(exKey);
  const lastW = entries.filter((e) => +(e.weight as number) > 0).slice(-1)[0] || null;
  const cross = lastW ? null : r.crossLast(exKey);
  const eff = lastW || (cross && cross.entry) || null;
  const effW = (eff && eff.weight) || '';
  const today = entries.filter((e) => +(e.week as number) === +r.week && r.entryDay(e) === r.dayKey)[0] || null;
  const kg = r.unit === 'kg';
  const step = kg ? 2.5 : 5;
  const isKB = r.isKB(name);
  const isWeight = !isKB && r.isTrackable(name);
  const sec = secIdx != null ? r.daySection(secIdx) : null;
  const cf = r.controlFlags(sec || null, itemIdx as number, i);
  const canSwap = secIdx != null && itemIdx != null && r.hasProgram && cf.canSwap;
  const swappedFrom = canSwap ? r.swapOrigin(name) : null;
  const canSkip = secIdx != null && r.hasProgram && cf.canSkip && !i._addedByUser;
  const card: ExCard = {
    kind: 'card', exKey, name, detail: disp, rxDetail: detail, logged: !!today,
    swap: canSwap ? { secIdx: secIdx as number, itemIdx: itemIdx as number } : null,
    skip: canSkip, added: !!i._addedByUser, swappedFrom: swappedFrom || null, log: null,
  };
  const rx = r.parseRx(detail, name);
  const loaded = isKB || isWeight;
  if (!rx && !loaded) return card;
  const dispLast: number | '' = effW !== '' && effW != null ? (kg ? Math.round(+effW * 0.453592 * 2) / 2 : +effW) : '';
  const wunit = r.unit; // v0.249.0 (D257): a kettlebell weighs in the program's unit, never "lb"
  let wkW: unknown[] = today && today.setsW && today.setsW.length ? today.setsW.map(r.toDispW) : [];
  let wkR: unknown[] = today && today.setsDone && today.setsDone.length ? today.setsDone.slice() : [];
  const draft = today ? null : r.readDraft(exKey);
  let draftLoad = '';
  if (draft) {
    const dR = draft.r || [];
    const dW = draft.w || [];
    if (dR.some(nz)) wkR = dR.map((x) => (nz(x) ? x : null));
    if (dW.some(nz)) wkW = dW.map((x) => (nz(x) ? x : null));
    draftLoad = draft.L || '';
  }
  if (!draftLoad && today && +(today.weight as number) > 0) draftLoad = String(r.toDispW(today.weight));
  const headR = wkR.map((x, ix) => {
    if (x != null && x !== '') return x;
    if (!rx) return 0;
    const t = rx.targets && rx.targets[ix] !== undefined ? rx.targets[ix] : rx.target;
    return t == null ? 0 : t;
  });
  const headW = wkW.map((x) => (x != null && x !== '' ? x : 0));
  const log: NonNullable<ExCard['log']> = { sets: null, load: null };
  if (rx) {
    const suf = r.rxSuffix(rx);
    r.cacheRx(exKey, rx);
    const head = r.setsSummary(rx, headW, headR);
    const sub = r.setsSubLabel(rx, headW, headR, !!today);
    const varied = r.setsVaried(headW) || r.setsVaried(headR);
    const rows: SetRow[] = [];
    for (let s = 0; s < rx.sets; s++) {
      const rowId = 'exset_' + exKey + '_' + s;
      const tgt = rx.targets && rx.targets[s] !== undefined ? rx.targets[s] : rx.target;
      const openSet = rx.open || tgt == null;
      const val = wkR.length && wkR[s] != null ? wkR[s] : openSet ? '' : tgt;
      const dv = !openSet && val !== '' && val != null && tgt != null ? +(val as number) - +tgt : 0;
      let weight: SetRow['weight'] = null;
      if (loaded) {
        const setV = wkW.length && wkW[s] != null ? wkW[s] : '';
        weight = { id: 'exsetw_' + exKey + '_' + s, value: String(setV), cls: setV === '' ? 'exw-inherit' : '', unit: wunit };
      }
      rows.push({
        s, rowId, value: String(val), cls: openSet && val === '' ? 'bw-blank' : '', placeholder: openSet ? 'max' : '',
        rx: openSet ? null : String(tgt), suffix: suf,
        deltaCls: dv === 0 ? 'exset-delta' : 'exset-delta ' + (dv < 0 ? 'down' : 'up'), deltaText: dv === 0 ? '' : dv < 0 ? String(dv) : '+' + dv,
        step: rx.step || 1, weight,
      });
    }
    log.sets = { head, sub, varied, rows, foot: loaded ? (r.setsVaried(headW) ? 'Top set' : 'Every set') : null };
  }
  if (loaded) {
    const load: NonNullable<NonNullable<ExCard['log']>['load']> = { label: r.setsVaried(headW) ? 'Top set' : 'Load', value: draftLoad, step, unit: wunit, reuse: null, warn: null, fill: null };
    if (dispLast !== '') {
      const ts = eff ? eff.ts : undefined;
      const stale = r.isStale(ts);
      const src = (cross && cross.progName) || '';
      const speak = stale && !r.warnShown();
      if (speak) r.speakWarn(src);
      const nameIt = stale && src && src !== r.warnSrc();
      load.reuse = { stale, value: dispLast, text: dispLast + ' ' + wunit, rec: r.recency(ts) + (nameIt ? ' · ' + src : '') };
      if (speak) load.warn = 'That ' + dispLast + ' ' + wunit + ' ' + (src ? 'came from ' + src + ', ' : 'is ') + r.recency(ts, 'age') + '. Still where you are?';
      if (rx) load.fill = { stale, value: dispLast, text: 'Fill every set with ' + dispLast + ' ' + wunit, rec: r.recency(ts) };
    }
    log.load = load;
  }
  card.log = log;
  return card;
}

/** The legacy buildSectionsHTML: each section in program order, its label kept only on the Main and the Primer. */
export function sectionsView(sections: ExSection[] | null | undefined, baseIdx: number | undefined, r: SectionReads): SectionView[] {
  const base = baseIdx || 0;
  return (sections || []).map((sec, si): SectionView => {
    const secIdx = base + si;
    const isRound = !!(sec.superset || sec.type === 'superset');
    if (isRound && sec._skipped) {
      return { kind: 'skippedRound', secIdx, text: (sec.label || 'Conditioning round') + ' — ' + (sec.items || []).length + ' movements' };
    }
    const label = /^(main|primer)/i.test(sec.label || '') ? sec.label || '' : null;
    const items = (ss?: number | null) => sec.items.map((it, ii) => exItemView(it, secIdx, ii, ss, r));
    if (sec._added) return { kind: 'section', label, body: { kind: 'block', label: { text: sec.label || 'Added by you', markup: true, color: 'var(--signal)' }, items: items() } };
    if (sec.hip) return { kind: 'section', label, body: { kind: 'block', label: { text: sec.label || 'Hip stability', markup: true, color: 'var(--hip)' }, items: items() } };
    if (sec.core) return { kind: 'section', label, body: { kind: 'core', header: sec.coreHeader || 'Core', items: items() } };
    if (isRound && (sec.items || []).length > 1) {
      const rounds = r.secRounds(sec);
      const live = (sec.items || []).filter((it) => it && !it._skipped);
      if (live.length === 1 && (sec.items || []).length > 1) {
        const d = live[0]!.detail || '';
        // v0.249.0 (D253): a line that opens "N sets" carries its own count, like one that opens "N×".
        const mapped = rounds == null || /^\d+\s*(?:[x\xd7]|sets?\b)/.test(d) ? d : d ? rounds + '\xd7' + d.replace(/^(\d+)\s*reps?\b/, '$1') : rounds + ' sets';
        return {
          kind: 'section', label,
          body: {
            kind: 'block', label: { text: (sec.label || 'Round') + ' — reduced to straight sets', markup: false, color: 'var(--muted)' },
            items: sec.items.map((it, ii) => exItemView(it._skipped ? it : { ...it, detail: mapped }, secIdx, ii, undefined, r)),
          },
        };
      }
      const header = /round/i.test(sec.label || '') || rounds == null ? sec.label || ''
        : `${rounds} Rounds — no rest between exercises · ${rounds <= 2 ? 90 : 60}s rest between rounds`;
      return { kind: 'section', label, body: { kind: 'round', secIdx, header, items: items(rounds) } };
    }
    return { kind: 'section', label, body: { kind: 'block', label: null, items: items() } };
  });
}
