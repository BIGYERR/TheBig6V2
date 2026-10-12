// The session sheet's cardio card, kept apart from Angular so the app's node --test suite reads it as it is
// (architecture phase E, step 25: the card moves from the legacy buildCardioHTML to the CardioCard component). The
// prescription's words are the engine's markup and stay markup; the benchmark retest strip is still the legacy
// _benchStripHTML's.

/** A day's cardio, as far as the card reads it. */
export interface CardioRx {
  type?: string;
  subtype?: string;
  detail?: string;
  note?: string;
  segments?: { label?: string; text?: string; yd?: number | string }[];
}

/** The card: its classes, its title, its swim segments or its detail, its note and the retest strip. */
export interface CardioCardView {
  blockCls: string;
  labelCls: string;
  /** The title's markup: the sport, then " — " and the session. */
  label: string;
  segments: { label: string; text: string }[] | null;
  /** The segments' yards, "N yd total", or nothing. */
  total: string | null;
  /** The detail's markup, its line breaks as breaks. */
  detail: string;
  note: string | null;
  bench: string;
}

const NAMES: Record<string, string> = { run: 'Run', bike: 'Bike / Spin', swim: 'Swim' };

/** The legacy buildCardioHTML, as a view; nothing for a day with no cardio. */
export function cardioCard(c: CardioRx | null | undefined, bench: string): CardioCardView | null {
  if (!c) return null;
  const t = (c.type || '').toLowerCase();
  const kind = t === 'swim' || t === 'run' || t === 'bike' ? t : null;
  const segs = t === 'swim' && Array.isArray(c.segments) && c.segments.length ? c.segments : null;
  const yards = segs ? segs.reduce((a, sg) => a + (+sg.yd! || 0), 0) : 0;
  return {
    blockCls: kind ? kind + '-block' : 'cardio-block',
    labelCls: 'cardio-label-' + (kind || 'general'),
    label: (NAMES[t] || String(c.type)) + (c.subtype ? ' — ' + c.subtype.replace(/_/g, ' ') : ''),
    segments: segs ? segs.map((sg) => ({ label: String(sg.label), text: String(sg.text) })) : null,
    total: yards ? yards.toLocaleString() + ' yd total' : null,
    detail: (c.detail || '').replace(/\n/g, '<br>'),
    note: c.note || null,
    bench,
  };
}
