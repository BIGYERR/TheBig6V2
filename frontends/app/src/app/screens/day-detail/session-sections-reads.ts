// The legacy reads the session sheet's sections make, kept apart from Angular (and from LegacyBridge's file) so the
// tests can drive the same reads against the booted single-file app.
import type { ExEntry, Rx, SectionReads } from './session-sections-model.ts';

/** What the reads need of LegacyBridge: a call to a legacy function and a read of a legacy binding. */
export interface BridgeLike {
  call<T = unknown>(name: string, ...args: unknown[]): T;
  global<T = unknown>(name: string): T;
}

/**
 * The legacy reads the sections and their cards make, through the bridge: the logged loads, the prescription parser and
 * the set summaries, the active day's controls, and the render-time state (the rx cache, the once-per-sheet stale
 * warning). Shared by the session sheet and Random Workout, the two places the legacy buildSectionsHTML drew.
 */
export function sectionReads(b: BridgeLike): SectionReads {
  const store = b.call<Record<string, { entries?: ExEntry[] } | undefined>>('getExWeights');
  const prog = b.global<{ weeks?: Record<string, Record<string, { sections?: unknown[] } | undefined> | undefined> } | null>('activeProg');
  const week = b.global<number>('currentWeek');
  const dayKey = b.global<string>('currentDayKey');
  return {
    exKey: (name) => b.call<string>('exStoreKey', name),
    entries: (k) => (store[k] && store[k]!.entries) || [],
    crossLast: (k) => b.call('crossProgLastEntry', k),
    week,
    dayKey,
    entryDay: (e) => b.call<string>('entryDay', e),
    unit: (b.global<Record<string, unknown>>('window')['_unitLabel'] as string) || 'lbs',
    isTime: (n) => b.call<boolean>('isTimeExercise', n),
    isKB: (n) => b.call<boolean>('isKBExercise', n),
    isRep: (n) => b.call<boolean>('isRepExercise', n),
    isTrackable: (n) => b.call<boolean>('isTrackableWeight', n),
    hasProgram: !!prog,
    daySection: (i) => (prog && prog.weeks && prog.weeks[week] && prog.weeks[week]![dayKey] && (prog.weeks[week]![dayKey]!.sections || [])[i]) || null,
    controlFlags: (sec, i, it) => b.call('exControlFlags', sec, i, it),
    swapOrigin: (n) => b.call<string | null>('swapOriginOf', n),
    parseRx: (d, n) => b.call<Rx | null>('parseRx', d, n),
    rxSuffix: (rx) => b.call<string>('rxSuffix', rx),
    cacheRx: (k, rx) => {
      b.global<Record<string, Rx>>('_rxCache')[k] = rx;
    },
    setsSummary: (rx, w, r) => b.call<string>('setsSummary', rx, w, r),
    setsSubLabel: (rx, w, r, logged) => b.call<string>('setsSubLabel', rx, w, r, logged),
    setsVaried: (a) => b.call<boolean>('setsVaried', a),
    readDraft: (k) => b.call('readSetDraft', k),
    toDispW: (x) => b.call<number | ''>('toDispW', x),
    isStale: (ts) => b.call<boolean>('isStaleTs', ts),
    recency: (ts, form) => b.call<string>('recencyLabel', ts, form),
    warnShown: () => b.global<boolean>('_staleWarnShown'),
    warnSrc: () => b.global<string>('_staleWarnSrc'),
    speakWarn: (src) => {
      b.call('_setStaleWarnShown', true);
      b.call('_setStaleWarnSrc', src);
    },
    stripLeadingSets: (d) => b.call<string>('_stripLeadingSets', d),
    secRounds: (sec) => b.call<number | null>('_secRounds', sec),
  };
}
