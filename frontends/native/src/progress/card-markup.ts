// A run card's head, body and footer in the Expo app (MIGRATION.md phase 3, row 4): the markup today's builders
// write (charts/run-charts-model.ts), read into blocks React Native can draw. The page hands that markup to the
// browser (ChartCard's innerHTML); it holds two tags and no others: a <div> with an inline style (a block of its own,
// with its own type), and a <b> with or without a colour (bold words inside a block). Words outside any <div> are one
// block that takes the type of where it stands (the footer's). Nothing here decides a word or a number.
import { DISPLAY, type Palette, TEXT } from '../theme';
import { paint } from './paint';

/** A stretch of words: plain, or bold with the colour its <b> names, as the web writes it. */
export interface MarkupRun { text: string; bold: boolean; color: string | null }

/** What a <div>'s inline style says, each as the page wrote it: null where it says nothing. */
export interface BlockStyle {
  /** font-family:var(--font-display). */
  display: boolean;
  /** font-size, in px. */
  size: number | null;
  /** font-weight. */
  weight: string | null;
  /** letter-spacing, in em. */
  spacing: number | null;
  /** color, as the web writes it. */
  color: string | null;
  /** line-height, as a multiple of the size. */
  line: number | null;
  /** margin-bottom, in px. */
  gap: number | null;
}

/** One block: a <div> with its style, or the words outside any (style null). */
export interface MarkupBlock { style: BlockStyle | null; runs: MarkupRun[] }

const decode = (s: string): string => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
const styleOf = (attrs: string): string => { const m = /style="([^"]*)"/.exec(attrs); return m ? m[1]! : ''; };

/** An inline style's declarations, by property. */
function declarations(css: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const d of css.split(';')) {
    const i = d.indexOf(':');
    if (i > 0) out[d.slice(0, i).trim()] = d.slice(i + 1).trim();
  }
  return out;
}

/** A <div>'s inline style: the seven properties the run cards write. */
export function blockStyle(css: string): BlockStyle {
  const d = declarations(css);
  const num = (v: string | undefined, unit: string): number | null => {
    const m = v === undefined ? null : new RegExp('^(-?[0-9.]+)' + unit + '$').exec(v);
    return m ? +m[1]! : null;
  };
  return {
    display: d['font-family'] === 'var(--font-display)',
    size: num(d['font-size'], 'px'),
    weight: d['font-weight'] || null,
    spacing: num(d['letter-spacing'], 'em'),
    color: d['color'] || null,
    line: num(d['line-height'], ''),
    gap: num(d['margin-bottom'], 'px'),
  };
}

/** A block's type as React Native takes it. */
export interface BlockType { fontFamily: string; fontSize?: number; fontWeight?: '700'; letterSpacing?: number; color?: string; lineHeight?: number; marginBottom?: number }

/**
 * A block's type from its style: the display face where it asks for it, else the text face; its size, weight and
 * colour in this palette; its tracking and its line height in points off its size (the page writes them in em and
 * as a multiple); the room under it. What the style does not say is left to React Native.
 */
export function blockType(b: BlockStyle, p: Palette): BlockType {
  const t: BlockType = { fontFamily: b.display ? DISPLAY : TEXT };
  if (b.size !== null) t.fontSize = b.size;
  if (b.weight !== null) t.fontWeight = b.weight as '700';
  if (b.size !== null && b.spacing !== null) t.letterSpacing = b.spacing * b.size;
  if (b.color !== null) t.color = paint(b.color, p);
  if (b.size !== null && b.line !== null) t.lineHeight = b.line * b.size;
  if (b.gap !== null) t.marginBottom = b.gap;
  return t;
}

/** The words of a block, with each <b> as a bold run. Any other tag is left out and its words kept. */
function runsOf(html: string): MarkupRun[] {
  const out: MarkupRun[] = [];
  const say = (text: string, bold: boolean, color: string | null): void => {
    const t = decode(text.replace(/<[^>]*>/g, ''));
    if (t) out.push({ text: t, bold, color });
  };
  const bold = /<b((?:\s[^>]*)?)>([\s\S]*?)<\/b>/g;
  let at = 0;
  for (let m = bold.exec(html); m; m = bold.exec(html)) {
    say(html.slice(at, m.index), false, null);
    say(m[2]!, true, declarations(styleOf(m[1]!))['color'] || null);
    at = m.index + m[0].length;
  }
  say(html.slice(at), false, null);
  return out;
}

/** A card's markup as blocks, in the page's order: each <div>, and the words between or outside them. A block with no words is left out. */
export function markupBlocks(html: string): MarkupBlock[] {
  const out: MarkupBlock[] = [];
  const add = (style: BlockStyle | null, inner: string): void => {
    const runs = runsOf(inner);
    if (runs.length) out.push({ style, runs });
  };
  const div = /<div((?:\s[^>]*)?)>([\s\S]*?)<\/div>/g;
  let at = 0;
  for (let m = div.exec(html); m; m = div.exec(html)) {
    add(null, html.slice(at, m.index));
    add(blockStyle(styleOf(m[1]!)), m[2]!);
    at = m.index + m[0].length;
  }
  add(null, html.slice(at));
  return out;
}
