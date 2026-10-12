// The Progress chart card, kept apart from Angular so the app's node --test suite reads it as it is (architecture
// phase E, step 15). The legacy chart builders (progress-charts.js, buildPaceChart) wrote a card, an optional head,
// an SVG made element by element, an optional body and an optional footer, every number formatted as it went. A
// CardSpec is that card as data: each SVG element keeps the attributes the legacy wrote, as the strings it wrote, in
// the order it wrote them, so the ChartCard component draws the same picture.

/** One SVG element: its tag, its attributes in the legacy order, and a text element's words. */
export interface SvgEl {
  el: 'line' | 'rect' | 'circle' | 'path' | 'polygon' | 'text';
  a: Record<string, string>;
  text?: string;
}

/** A chart card. Markup fields (the title with its icon, the head, the body, the footer) are the legacy's own markup. */
export interface CardSpec {
  title: string;
  color: string;
  /** The space under the title: 12 on the legacy _iaCard, 10 on the pace chart's own card. */
  titleGap: number;
  head: string | null;
  svg: { w: number; h: number; els: SvgEl[] } | null;
  body: string | null;
  foot: string | null;
}

/** The legacy _iaCard: a title in the colour (the accent without one), the inner markup or SVG, and a footer if any. */
export function card(title: string, color: string | null | undefined, parts: { head?: string; svg?: CardSpec['svg']; body?: string; foot?: string }): CardSpec {
  return {
    title,
    color: color || 'var(--accent)',
    titleGap: 12,
    head: parts.head || null,
    svg: parts.svg || null,
    body: parts.body || null,
    foot: parts.foot || null,
  };
}

/** The legacy _axTx: an axis label at one decimal, in the axis grey at 8 unless told otherwise, right-aligned by default. */
export function axTx(x: number, y: number, s: string | number, size?: number, anchor?: string, fill?: string, weight?: string): SvgEl {
  const a: Record<string, string> = {
    x: (+x).toFixed(1),
    y: (+y).toFixed(1),
    fill: fill || 'rgba(24,23,18,0.3)',
    'font-size': String(size || 8),
    'text-anchor': anchor || 'end',
    'font-family': 'Helvetica Neue,Helvetica,Geist,sans-serif',
  };
  if (weight) a['font-weight'] = weight;
  return { el: 'text', a, text: String(s) };
}

/** A gridline across the plot, as every legacy chart drew it. */
export function gridLine(x1: number, y: string, x2: number): SvgEl {
  return { el: 'line', a: { x1: String(x1), y1: y, x2: String(x2), y2: y, stroke: 'rgba(24,23,18,0.06)', 'stroke-width': '1' } };
}

/** An element with its attributes as given. */
export function svgEl(el: SvgEl['el'], a: Record<string, string | number>, text?: string): SvgEl {
  const out: Record<string, string> = {};
  for (const k of Object.keys(a)) out[k] = String(a[k]);
  return text === undefined ? { el, a: out } : { el, a: out, text };
}
