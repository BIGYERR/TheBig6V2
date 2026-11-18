// Progress in the Expo app: the web's paint, as React Native takes it. Today's models hand every colour as the web
// writes it (a token, `var(--lift)`; a tint of the ink, `rgba(var(--ink-rgb),0.3)`; or a plain colour, `#f0a050`), and
// every SVG element with the attributes the page wrote, as text. Nothing here decides a number or a word.
import type { Palette } from '../theme';
import type { SvgEl } from './charts/chart-card-model';

/** A colour as the web writes it, in this palette. A token the palette does not hold reads as muted. */
export function paint(css: string, p: Palette): string {
  const tint = /^rgba\(var\(--([a-z]+)-rgb\),\s*([0-9.]+)\)$/.exec(css);
  if (tint) {
    const rgb = (p as unknown as Record<string, unknown>)[tint[1] + 'Rgb'];
    return typeof rgb === 'string' ? 'rgba(' + rgb + ',' + tint[2] + ')' : p.muted;
  }
  const token = /^var\(--([a-z0-9-]+)\)$/.exec(css);
  if (!token) return css;
  const key = token[1]!.replace(/-([a-z0-9])/g, (_m, c: string) => c.toUpperCase());
  const v = (p as unknown as Record<string, unknown>)[key];
  return typeof v === 'string' ? v : p.muted;
}

const NAMES: Record<string, string> = {
  'stroke-width': 'strokeWidth', 'stroke-dasharray': 'strokeDasharray', 'stroke-linecap': 'strokeLinecap', 'font-size': 'fontSize',
  'font-weight': 'fontWeight', 'text-anchor': 'textAnchor', 'font-family': 'fontFamily',
};

/**
 * One element's attributes as react-native-svg's props: the names in its spelling, the paints in this palette, the
 * face the app's own. A text that names no face takes it too: the page gives such a text the body's face, which is
 * this one (three of the pace chart's labels).
 */
export function svgProps(el: SvgEl, p: Palette, face: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const k of Object.keys(el.a)) {
    const v = el.a[k]!;
    if (k === 'font-family') { out['fontFamily'] = face; continue; }
    if (k === 'font-weight' && !v) continue;
    out[NAMES[k] || k] = k === 'fill' || k === 'stroke' ? (v === 'none' ? 'none' : paint(v, p)) : v;
  }
  if (el.el === 'text' && !('font-family' in el.a)) out['fontFamily'] = face;
  return out;
}

/** How far past its edge a fixed picture is still drawn, in its own units: the web draws it all (overflow: visible), react-native-svg clips at the edge. */
export const OVERFLOW = 6;

/**
 * A picture's box from its viewBox and the style the page wrote. With a size named in points: that size and the
 * viewBox each grown by OVERFLOW on every side, at the page's own scale, and the margin that puts the picture back
 * where the page has it. Without one (a chart laid the full width of its card): the same growth, with the width and
 * the margin as shares of the card's width, since the scale is that width over the viewBox's (`wide`, `pull`: a
 * margin's percentage is read against the width on every side), and the grown box's own shape (`ratio`).
 */
export function pictureBox(viewBox: string, style: string): { viewBox: string; width: number | null; height: number | null; margin: number; ratio: number; wide: number; pull: number } {
  const [x, y, w, h] = viewBox.split(/\s+/).map(Number) as [number, number, number, number];
  const px = (name: string): number | null => { const m = new RegExp('(?:^|;)\\s*' + name + ':\\s*([0-9.]+)px').exec(style); return m ? +m[1]! : null; };
  const width = px('width'), height = px('height');
  const grown = [x - OVERFLOW, y - OVERFLOW, w + 2 * OVERFLOW, h + 2 * OVERFLOW].join(' ');
  const ratio = (w + 2 * OVERFLOW) / (h + 2 * OVERFLOW), wide = 100 * (w + 2 * OVERFLOW) / w, pull = -100 * OVERFLOW / w;
  if (width === null || height === null) return { viewBox: grown, width: null, height: null, margin: 0, ratio, wide, pull };
  const scale = Math.min(width / w, height / h), grow = OVERFLOW * scale;
  return { viewBox: grown, width: width + 2 * grow, height: height + 2 * grow, margin: -grow, ratio, wide, pull };
}
