// The collage: every screen the suite covers on one large PNG, in titled bands read top to bottom (WEBSITE, ADMIN,
// APP), with a label over each screen, so a screen can be referred to and commented on later by its number
// ("#27 race-10k/race-shakeout", "#W02 website-phone/site-home-phone"). Each band has its own title bar with its pass
// count, and its own tile width: the app's screens are 786×1704 (393×852 @2x), a full-height web page is 1440 wide
// and as tall as the page. A screenshot is copied in pixel for pixel when it fits its band's box; one that does not is
// scaled down to fit (area averaged), never cropped.
//
// Chrome draws only the text: the header, the band bars and the labels, three small captures. Everything else is
// composed here (composeCollage, a pure function) on an RGB canvas, three bytes a pixel. Asking Chrome to capture the
// whole collage at once does not scale: it is a frame of a few hundred megapixels, which the runner container (no
// GPU) cannot rasterize inside Puppeteer's timeout.
import { PNG } from 'pngjs';
import type { Browser } from 'puppeteer';
import { pngSize } from './parity.ts';
import type { Status } from './types.ts';
import { stepLabel } from './types.ts';

export interface CollageTile {
  n: number;
  /** The band's letter before the number ("W" for #W01); none for the app's screens. */
  prefix?: string;
  id: string;
  title: string;
  status: Status;
  png?: Uint8Array;
}

export interface Size {
  width: number;
  height: number;
}

export interface CollageBand {
  /** The bar's title ("WEBSITE"); the bar adds the band's pass count. */
  title: string;
  subtitle: string;
  /** The largest a screenshot is drawn: a bigger one is scaled down to fit inside, keeping its shape. */
  box: Size;
  /** The placeholder drawn where a screenshot is missing. */
  missing: Size;
  /** The narrowest a label may be (default LABEL_MIN_W): a band whose numbers carry a letter needs room for it. */
  labelMin?: number;
  tiles: CollageTile[];
}

export interface CollageMeta {
  title: string;
  subtitle: string;
}

export interface Placement {
  /** Top left of the label band. */
  x: number;
  y: number;
  /** Top left of the screenshot, directly under the label band. */
  shotX: number;
  shotY: number;
  /** The screenshot as drawn: its native size, or smaller when it was scaled down to fit the band's box. */
  shotWidth: number;
  shotHeight: number;
  /** The label's width: the screenshot's, or the band's narrowest label for a narrow one. */
  cellWidth: number;
}

export interface BandLayout {
  /** Top of the band's title bar; the bar spans the content width at x = PAD. */
  y: number;
  /** The most tiles on one row, and the number of rows. */
  cols: number;
  rows: number;
  placements: Placement[];
}

export interface CollageLayout {
  width: number;
  height: number;
  /** The width every band bar spans and every row fits within: width minus the two margins. */
  contentWidth: number;
  bands: BandLayout[];
}

/** What collageLayout needs of a band: its box, its placeholder, and each screenshot's native size (undefined: missing). */
export interface LayoutBand {
  box: Size;
  missing: Size;
  labelMin?: number;
  shots: readonly (Size | undefined)[];
}

/** Spacing in collage pixels. */
export const PAD = 72;
export const GAP = 56;
export const HEADER_H = 240;
export const LABEL_H = 168;
/** A band's title bar, and the space above it that separates it from what came before. */
export const BAND_H = 150;
export const BAND_GAP = 112;
/** By default a label is never narrower than an app screen, so a narrow page's label still reads. */
export const LABEL_MIN_W = 786;
/** The hairline around every screenshot, and the red frame around one that did not pass, both outside the shot. */
export const EDGE = 2;
export const FLAG = 8;

export type Rgb = readonly [number, number, number];
export const COLOURS = {
  bone: [0xf4, 0xf1, 0xe8],
  edge: [0xd9, 0xd4, 0xc5],
  flag: [0xa3, 0x26, 0x1b],
  missing: [0xe6, 0xe1, 0xd4],
} as const satisfies Record<string, Rgb>;

/** `shot` scaled down, keeping its shape, until it fits inside `box`; never scaled up. */
export function fitShot(shot: Size, box: Size): Size {
  const k = Math.min(1, box.width / shot.width, box.height / shot.height);
  if (k === 1) return { width: shot.width, height: shot.height };
  return { width: Math.max(1, Math.floor(shot.width * k)), height: Math.max(1, Math.floor(shot.height * k)) };
}

/**
 * The content width a band of `count` cells, each `cellW` × `cellH`, takes on its own: the column count whose canvas
 * comes closest to `aspect` (width / height); on a tie, the one that leaves fewer empty cells.
 */
function bestGridWidth(count: number, cellW: number, cellH: number, aspect: number): number {
  let best: { cols: number; score: number; empty: number } | undefined;
  for (let cols = 1; cols <= count; cols++) {
    const rows = Math.ceil(count / cols);
    const width = 2 * PAD + cols * cellW + (cols - 1) * GAP;
    const height = 2 * PAD + HEADER_H + rows * cellH + (rows - 1) * GAP;
    const score = Math.abs(Math.log(width / height / aspect));
    const empty = cols * rows - count;
    if (!best || score < best.score - 1e-9 || (Math.abs(score - best.score) <= 1e-9 && empty < best.empty)) best = { cols, score, empty };
  }
  return best!.cols * cellW + (best!.cols - 1) * GAP;
}

/**
 * Positions for every band, top to bottom under the header. The content width is the widest any band takes on its
 * own (bestGridWidth over its widest and tallest cell), so a band of uniform screens keeps the grid it would have alone,
 * and the others flow into that width. Tiles read left to right and wrap to a new row; a row is as tall as its tallest
 * tile.
 */
export function collageLayout(bands: readonly LayoutBand[], aspect = 1): CollageLayout {
  if (bands.length < 1 || bands.some((b) => b.shots.length < 1)) {
    throw new RangeError(`a collage needs at least one band and one screen in each, got ${bands.map((b) => b.shots.length).join(', ') || 'no bands'}`);
  }
  const drawn = bands.map((b) => b.shots.map((s) => fitShot(s ?? b.missing, b.box)));
  const cellWidth = (s: Size, band: LayoutBand) => Math.max(s.width, band.labelMin ?? LABEL_MIN_W);
  let contentWidth = 0;
  for (const [b, shots] of drawn.entries()) {
    const w = Math.max(...shots.map((s) => cellWidth(s, bands[b]!)));
    const h = LABEL_H + Math.max(...shots.map((s) => s.height));
    contentWidth = Math.max(contentWidth, bestGridWidth(shots.length, w, h, aspect));
  }
  let y = PAD + HEADER_H;
  const out: BandLayout[] = drawn.map((shots, b) => {
    y += BAND_GAP;
    const top = y;
    let rowTop = top + BAND_H + GAP;
    let x = PAD;
    let rowH = 0;
    let col = 0;
    let cols = 0;
    let rows = 1;
    const placements = shots.map((s) => {
      const w = cellWidth(s, bands[b]!);
      if (x > PAD && x + w > PAD + contentWidth) {
        rowTop += rowH + GAP;
        x = PAD;
        rowH = 0;
        col = 0;
        rows++;
      }
      const p: Placement = { x, y: rowTop, shotX: x, shotY: rowTop + LABEL_H, shotWidth: s.width, shotHeight: s.height, cellWidth: w };
      x += w + GAP;
      rowH = Math.max(rowH, LABEL_H + s.height);
      cols = Math.max(cols, ++col);
      return p;
    });
    y = rowTop + rowH;
    return { y: top, cols, rows, placements };
  });
  return { width: contentWidth + 2 * PAD, height: y + PAD, contentWidth, bands: out };
}

const esc = (s: string): string =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c);

const STATUS_TEXT: Record<Status, string> = { pass: 'PASS', fail: 'FAIL', skipped: 'NOT RUN' };

const TEXT_CSS = `
*{box-sizing:border-box;margin:0}
html,body{overflow:hidden;background:#F4F1E8}
body{position:relative;color:#181712;font-family:"Noto Sans","DejaVu Sans","Liberation Sans",Helvetica,Arial,sans-serif}
.head{position:absolute;left:${PAD}px;right:${PAD}px;top:0;height:${HEADER_H - 40}px;border-bottom:6px solid #181712}
.head h1{font-size:92px;line-height:1;font-weight:800;letter-spacing:.01em}
.head h1 span{color:#CF4E1A}
.head p{margin-top:22px;font-size:34px;color:#5c584e;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.band{position:absolute;left:0;display:flex;align-items:center;gap:36px;padding:0 44px;background:#181712;color:#F4F1E8}
.band h2{font-size:80px;line-height:1;font-weight:800;letter-spacing:.06em}
.band .count{flex:none;padding:6px 22px;border-radius:999px;font-size:34px;font-weight:700;background:#e3efdf;color:#2f6b3a}
.band.fail .count{background:#f6dedb;color:#a3261b}
.band p{min-width:0;font-size:32px;color:#cfc9b8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.label{position:absolute;left:0;display:flex;align-items:center;gap:26px;padding-bottom:14px}
.num{font-size:96px;line-height:1;font-weight:800;color:#CF4E1A;font-variant-numeric:tabular-nums}
.text{min-width:0}
.title{font-size:36px;line-height:1.15;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.id{display:flex;align-items:center;gap:10px;margin-top:8px;font-size:28px;color:#5c584e;font-family:"DejaVu Sans Mono","Liberation Mono",Menlo,monospace}
.sid{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.chip{flex:none;display:inline-block;padding:2px 14px;border-radius:999px;font-size:24px;font-weight:700;font-family:"Noto Sans","DejaVu Sans",sans-serif;background:#e3efdf;color:#2f6b3a}
.fail .chip{background:#f6dedb;color:#a3261b}.skipped .chip{background:#ebe7dc;color:#5c584e}
`;

/** The header band, `width` wide and HEADER_H tall: the title and one line about the run. */
export function headerHtml(meta: CollageMeta, width: number): string {
  const [first, ...rest] = meta.title.split(' ');
  const title = rest.length ? `${esc(first ?? '')} <span>${esc(rest.join(' '))}</span>` : esc(meta.title);
  return `<!doctype html><html><head><meta charset="utf-8"><style>${TEXT_CSS}
html,body{width:${width}px;height:${HEADER_H}px}</style></head><body>
<div class="head"><h1>${title}</h1><p>${esc(meta.subtitle)}</p></div>
</body></html>`;
}

/** How many of a band's screens passed, as its bar prints it: "4/4 passed". */
export const bandCount = (band: Pick<CollageBand, 'tiles'>): string => `${band.tiles.filter((t) => t.status === 'pass').length}/${band.tiles.length} passed`;

/** Every band's title bar, stacked in one column `width` wide: bar i fills rows i × BAND_H to (i + 1) × BAND_H. */
export function bandsHtml(bands: readonly Pick<CollageBand, 'title' | 'subtitle' | 'tiles'>[], width: number): string {
  const bars = bands
    .map((b, i) => {
      const ok = b.tiles.every((t) => t.status === 'pass');
      return `<div class="band ${ok ? 'pass' : 'fail'}" style="top:${i * BAND_H}px;width:${width}px;height:${BAND_H}px">
  <h2>${esc(b.title)}</h2><span class="count">${bandCount(b)}</span><p>${esc(b.subtitle)}</p>
</div>`;
    })
    .join('\n');
  return `<!doctype html><html><head><meta charset="utf-8"><style>${TEXT_CSS}
html,body{width:${width}px;height:${bands.length * BAND_H}px}</style></head><body>
${bars}
</body></html>`;
}

/** The number a label prints: "#27", "#W02". */
export const tileNumber = (t: Pick<CollageTile, 'n' | 'prefix'>): string => `#${t.prefix ?? ''}${stepLabel(t.n)}`;

/**
 * Every tile's label, stacked in one column `width` wide: label i fills rows i × LABEL_H to (i + 1) × LABEL_H, and is
 * `widths[i]` wide (default: the column's width).
 */
export function labelsHtml(tiles: readonly CollageTile[], width: number, widths: readonly number[] = []): string {
  const labels = tiles
    .map(
      (t, i) => `<div class="label ${t.status}" style="top:${i * LABEL_H}px;width:${widths[i] ?? width}px;height:${LABEL_H}px">
  <div class="num">${tileNumber(t)}</div>
  <div class="text"><div class="title">${esc(t.title)}</div><div class="id"><span class="sid">${esc(t.id)}</span><span class="chip">${STATUS_TEXT[t.status]}</span></div></div>
</div>`,
    )
    .join('\n');
  return `<!doctype html><html><head><meta charset="utf-8"><style>${TEXT_CSS}
html,body{width:${width}px;height:${tiles.length * LABEL_H}px}</style></head><body>
${labels}
</body></html>`;
}

/** An RGB image, three bytes a pixel, row after row: the collage canvas. */
interface Canvas {
  width: number;
  height: number;
  data: Buffer;
}

function fillRect(img: Canvas, x: number, y: number, w: number, h: number, [r, g, b]: Rgb): void {
  const x0 = Math.max(0, x);
  const x1 = Math.min(img.width, x + w);
  if (x1 <= x0) return;
  const row = Buffer.alloc((x1 - x0) * 3);
  for (let i = 0; i < row.length; i += 3) {
    row[i] = r;
    row[i + 1] = g;
    row[i + 2] = b;
  }
  for (let yy = Math.max(0, y); yy < Math.min(img.height, y + h); yy++) row.copy(img.data, (yy * img.width + x0) * 3);
}

/** A frame `t` pixels thick drawn outside the w × h box at (x, y). */
function frame(img: Canvas, x: number, y: number, w: number, h: number, t: number, rgb: Rgb): void {
  fillRect(img, x - t, y - t, w + 2 * t, t, rgb);
  fillRect(img, x - t, y + h, w + 2 * t, t, rgb);
  fillRect(img, x - t, y, t, h, rgb);
  fillRect(img, x + w, y, t, h, rgb);
}

/** Copies the w × h region at (sx, sy) of an RGBA `src` to (dx, dy) of `dst`, every colour byte unchanged. */
function blit(dst: Canvas, src: PNG, sx: number, sy: number, w: number, h: number, dx: number, dy: number): void {
  for (let row = 0; row < h; row++) {
    let from = ((sy + row) * src.width + sx) * 4;
    let to = ((dy + row) * dst.width + dx) * 3;
    for (let col = 0; col < w; col++, from += 4, to += 3) {
      dst.data[to] = src.data[from]!;
      dst.data[to + 1] = src.data[from + 1]!;
      dst.data[to + 2] = src.data[from + 2]!;
    }
  }
}

/** Draws all of an RGBA `src` into the w × h box at (dx, dy): each canvas pixel the average of the source pixels under it. */
function blitScaled(dst: Canvas, src: PNG, w: number, h: number, dx: number, dy: number): void {
  if (w === src.width && h === src.height) return blit(dst, src, 0, 0, w, h, dx, dy);
  const xs = Array.from({ length: w + 1 }, (_, x) => Math.floor((x * src.width) / w));
  for (let y = 0; y < h; y++) {
    const y0 = Math.floor((y * src.height) / h);
    const y1 = Math.max(y0 + 1, Math.floor(((y + 1) * src.height) / h));
    let to = ((dy + y) * dst.width + dx) * 3;
    for (let x = 0; x < w; x++, to += 3) {
      const x0 = xs[x]!;
      const x1 = Math.max(x0 + 1, xs[x + 1]!);
      let r = 0;
      let g = 0;
      let b = 0;
      for (let yy = y0; yy < y1; yy++) {
        for (let i = (yy * src.width + x0) * 4, end = (yy * src.width + x1) * 4; i < end; i += 4) {
          r += src.data[i]!;
          g += src.data[i + 1]!;
          b += src.data[i + 2]!;
        }
      }
      const n = (y1 - y0) * (x1 - x0);
      dst.data[to] = Math.round(r / n);
      dst.data[to + 1] = Math.round(g / n);
      dst.data[to + 2] = Math.round(b / n);
    }
  }
}

/**
 * Puts the collage together: bone background, the header strip, each band's title bar from the stacked bars image,
 * each tile's label from the stacked labels image (label i is tile i counting through every band in order), and each
 * screenshot under its label: copied pixel for pixel, or scaled down to its placement's size when it did not fit its
 * band's box. A passing screen gets a hairline edge, any other a red frame; a missing screenshot leaves a plain
 * placeholder. Returns the PNG bytes (RGB, no alpha).
 */
export function composeCollage(
  layout: CollageLayout,
  header: Uint8Array,
  bars: Uint8Array,
  labels: Uint8Array,
  bands: readonly Pick<CollageBand, 'tiles'>[],
): Uint8Array {
  if (bands.length !== layout.bands.length || bands.some((b, i) => b.tiles.length !== layout.bands[i]!.placements.length)) {
    throw new RangeError(`bands of ${bands.map((b) => b.tiles.length).join('/')} tiles for ${layout.bands.map((b) => b.placements.length).join('/')} cells`);
  }
  const out: Canvas = { width: layout.width, height: layout.height, data: Buffer.alloc(layout.width * layout.height * 3) };
  fillRect(out, 0, 0, layout.width, layout.height, COLOURS.bone);
  const head = PNG.sync.read(Buffer.from(header));
  blit(out, head, 0, 0, Math.min(head.width, layout.width), Math.min(head.height, HEADER_H), 0, PAD);
  const bar = PNG.sync.read(Buffer.from(bars));
  const lab = PNG.sync.read(Buffer.from(labels));
  let label = 0;
  for (const [b, band] of bands.entries()) {
    const placed = layout.bands[b]!;
    if (bar.height >= (b + 1) * BAND_H) blit(out, bar, 0, b * BAND_H, Math.min(bar.width, layout.contentWidth), BAND_H, PAD, placed.y);
    for (const [i, t] of band.tiles.entries()) {
      const p = placed.placements[i]!;
      const { shotX: x, shotY: y, shotWidth: w, shotHeight: h } = p;
      if (lab.height >= (label + 1) * LABEL_H) blit(out, lab, 0, label * LABEL_H, Math.min(lab.width, p.cellWidth), LABEL_H, p.x, p.y);
      label++;
      if (t.png) blitScaled(out, PNG.sync.read(Buffer.from(t.png)), w, h, x, y);
      else fillRect(out, x, y, w, h, COLOURS.missing);
      if (t.status === 'pass') frame(out, x, y, w, h, EDGE, COLOURS.edge);
      else frame(out, x, y, w, h, FLAG, COLOURS.flag);
    }
  }
  // pngjs writes RGB input as it is (no alpha pass), then filters and deflates it once.
  return PNG.sync.write(out as unknown as PNG, { colorType: 2, inputColorType: 2, inputHasAlpha: false, deflateLevel: 6, filterType: 1 });
}

/** Renders one HTML page at exactly width × height (device scale 1) and returns it as PNG bytes. */
async function capture(browser: Browser, html: string, width: number, height: number): Promise<Uint8Array> {
  const page = await browser.newPage();
  try {
    await page.setViewport({ width, height, deviceScaleFactor: 1 });
    await page.setContent(html, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready.then(() => undefined));
    return await page.screenshot({ type: 'png', clip: { x: 0, y: 0, width, height } });
  } finally {
    await page.close();
  }
}

/**
 * Draws the collage: Chrome renders the header, the band bars and the labels; composeCollage does the rest. The PNG is
 * exactly `layout.width` × `layout.height` pixels, and a screenshot that fits its band's box keeps every pixel.
 */
export async function renderCollage(
  browser: Browser,
  bands: readonly CollageBand[],
  meta: CollageMeta,
): Promise<{ png: Uint8Array; layout: CollageLayout }> {
  const layout = collageLayout(bands.map((b) => ({ box: b.box, missing: b.missing, labelMin: b.labelMin, shots: b.tiles.map((t) => (t.png ? pngSize(t.png) : undefined)) })));
  const tiles = bands.flatMap((b) => b.tiles);
  const widths = layout.bands.flatMap((b) => b.placements.map((p) => p.cellWidth));
  const labelW = Math.max(...widths);
  const header = await capture(browser, headerHtml(meta, layout.width), layout.width, HEADER_H);
  const bars = await capture(browser, bandsHtml(bands, layout.contentWidth), layout.contentWidth, bands.length * BAND_H);
  const labels = await capture(browser, labelsHtml(tiles, labelW, widths), labelW, tiles.length * LABEL_H);
  return { png: composeCollage(layout, header, bars, labels, bands), layout };
}
