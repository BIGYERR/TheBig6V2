// The collage: every screen the suite covers, in step order, on one large PNG with a label over each, so a screen
// can be referred to and commented on later by its number ("#27 race-10k/race-shakeout"). Screenshots are copied in
// pixel for pixel at their native size (393×852 @2x = 786×1704), so the collage loses no detail.
//
// Chrome draws only the text: the header and the labels, two small captures. Everything else is composed here with
// pngjs (composeCollage, a pure function). Asking Chrome to capture the whole collage at once does not scale: at 46
// screens it is a 93 MP frame, which the runner container (no GPU) cannot rasterize inside Puppeteer's timeout.
import { PNG } from 'pngjs';
import type { Browser } from 'puppeteer';
import type { Status } from './types.ts';
import { stepLabel } from './types.ts';

export interface CollageTile {
  n: number;
  id: string;
  title: string;
  status: Status;
  png?: Uint8Array;
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
}

export interface CollageLayout {
  cols: number;
  rows: number;
  width: number;
  height: number;
  shotWidth: number;
  shotHeight: number;
  placements: Placement[];
}

/** Spacing in collage pixels. */
export const PAD = 72;
export const GAP = 56;
export const HEADER_H = 240;
export const LABEL_H = 168;
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

/**
 * Grid positions for `count` screenshots of one size. The column count is the one whose canvas comes closest to
 * `aspect` (width / height); on a tie, the one that leaves fewer empty cells. Tiles read left to right, top to bottom.
 */
export function collageLayout(count: number, shotWidth: number, shotHeight: number, aspect = 1): CollageLayout {
  if (!Number.isInteger(count) || count < 1) throw new RangeError(`a collage needs at least one screen, got ${count}`);
  const cellW = shotWidth;
  const cellH = LABEL_H + shotHeight;
  let best: { cols: number; rows: number; width: number; height: number; score: number; empty: number } | undefined;
  for (let cols = 1; cols <= count; cols++) {
    const rows = Math.ceil(count / cols);
    const width = 2 * PAD + cols * cellW + (cols - 1) * GAP;
    const height = 2 * PAD + HEADER_H + rows * cellH + (rows - 1) * GAP;
    const score = Math.abs(Math.log(width / height / aspect));
    const empty = cols * rows - count;
    const better = !best || score < best.score - 1e-9 || (Math.abs(score - best.score) <= 1e-9 && empty < best.empty);
    if (better) best = { cols, rows, width, height, score, empty };
  }
  const { cols, rows, width, height } = best!;
  const placements = Array.from({ length: count }, (_, i) => {
    const x = PAD + (i % cols) * (cellW + GAP);
    const y = PAD + HEADER_H + Math.floor(i / cols) * (cellH + GAP);
    return { x, y, shotX: x, shotY: y + LABEL_H };
  });
  return { cols, rows, width, height, shotWidth, shotHeight, placements };
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
.head p{margin-top:22px;font-size:34px;color:#5c584e}
.label{position:absolute;left:0;display:flex;align-items:center;gap:26px;padding-bottom:14px}
.num{font-size:96px;line-height:1;font-weight:800;color:#CF4E1A;font-variant-numeric:tabular-nums}
.text{min-width:0}
.title{font-size:36px;line-height:1.15;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.id{margin-top:8px;font-size:28px;color:#5c584e;font-family:"DejaVu Sans Mono","Liberation Mono",Menlo,monospace;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.chip{display:inline-block;margin-left:10px;padding:2px 14px;border-radius:999px;font-size:24px;font-weight:700;font-family:"Noto Sans","DejaVu Sans",sans-serif;background:#e3efdf;color:#2f6b3a}
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

/** Every tile's label, stacked in one column `width` wide: label i fills rows i × LABEL_H to (i + 1) × LABEL_H. */
export function labelsHtml(tiles: readonly CollageTile[], width: number): string {
  const labels = tiles
    .map(
      (t, i) => `<div class="label ${t.status}" style="top:${i * LABEL_H}px;width:${width}px;height:${LABEL_H}px">
  <div class="num">#${stepLabel(t.n)}</div>
  <div class="text"><div class="title">${esc(t.title)}</div><div class="id">${esc(t.id)} <span class="chip">${STATUS_TEXT[t.status]}</span></div></div>
</div>`,
    )
    .join('\n');
  return `<!doctype html><html><head><meta charset="utf-8"><style>${TEXT_CSS}
html,body{width:${width}px;height:${tiles.length * LABEL_H}px}</style></head><body>
${labels}
</body></html>`;
}

function fillRect(img: PNG, x: number, y: number, w: number, h: number, [r, g, b]: Rgb): void {
  const x0 = Math.max(0, x);
  const x1 = Math.min(img.width, x + w);
  if (x1 <= x0) return;
  const row = Buffer.alloc((x1 - x0) * 4);
  for (let i = 0; i < row.length; i += 4) {
    row[i] = r;
    row[i + 1] = g;
    row[i + 2] = b;
    row[i + 3] = 255;
  }
  for (let yy = Math.max(0, y); yy < Math.min(img.height, y + h); yy++) row.copy(img.data, (yy * img.width + x0) * 4);
}

/** A frame `t` pixels thick drawn outside the w × h box at (x, y). */
function frame(img: PNG, x: number, y: number, w: number, h: number, t: number, rgb: Rgb): void {
  fillRect(img, x - t, y - t, w + 2 * t, t, rgb);
  fillRect(img, x - t, y + h, w + 2 * t, t, rgb);
  fillRect(img, x - t, y, t, h, rgb);
  fillRect(img, x + w, y, t, h, rgb);
}

/** Copies the w × h region at (sx, sy) of `src` to (dx, dy) of `dst`, byte for byte. */
function blit(dst: PNG, src: PNG, sx: number, sy: number, w: number, h: number, dx: number, dy: number): void {
  for (let row = 0; row < h; row++) {
    const from = ((sy + row) * src.width + sx) * 4;
    src.data.copy(dst.data, ((dy + row) * dst.width + dx) * 4, from, from + w * 4);
  }
}

/**
 * Puts the collage together: bone background, the header strip, each tile's label band from the stacked labels image,
 * and each screenshot copied unscaled under its label, with a hairline edge, or a red frame when the step did not
 * pass. A missing screenshot leaves a plain placeholder. A screenshot larger than the cell is cropped to it.
 * Returns the PNG bytes (RGB, no alpha).
 */
export function composeCollage(layout: CollageLayout, header: Uint8Array, labels: Uint8Array, tiles: readonly CollageTile[]): Uint8Array {
  if (tiles.length !== layout.placements.length) throw new RangeError(`${tiles.length} tiles for ${layout.placements.length} cells`);
  const { shotWidth: w, shotHeight: h } = layout;
  const out = new PNG({ width: layout.width, height: layout.height });
  fillRect(out, 0, 0, layout.width, layout.height, COLOURS.bone);
  const head = PNG.sync.read(Buffer.from(header));
  blit(out, head, 0, 0, Math.min(head.width, layout.width), Math.min(head.height, HEADER_H), 0, PAD);
  const lab = PNG.sync.read(Buffer.from(labels));
  for (const [i, t] of tiles.entries()) {
    const p = layout.placements[i]!;
    if (lab.height >= (i + 1) * LABEL_H) blit(out, lab, 0, i * LABEL_H, Math.min(lab.width, w), LABEL_H, p.x, p.y);
    if (t.png) {
      const shot = PNG.sync.read(Buffer.from(t.png));
      blit(out, shot, 0, 0, Math.min(shot.width, w), Math.min(shot.height, h), p.shotX, p.shotY);
    } else {
      fillRect(out, p.shotX, p.shotY, w, h, COLOURS.missing);
    }
    if (t.status === 'pass') frame(out, p.shotX, p.shotY, w, h, EDGE, COLOURS.edge);
    else frame(out, p.shotX, p.shotY, w, h, FLAG, COLOURS.flag);
  }
  return PNG.sync.write(out, { colorType: 2, inputColorType: 6, inputHasAlpha: true, deflateLevel: 6, filterType: 1 });
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
 * Draws the collage: Chrome renders the header and the labels, composeCollage does the rest. The PNG is exactly
 * `layout.width` × `layout.height` pixels, and each screenshot pixel is one collage pixel.
 */
export async function renderCollage(
  browser: Browser,
  tiles: readonly CollageTile[],
  meta: CollageMeta,
  shot: { width: number; height: number },
): Promise<{ png: Uint8Array; layout: CollageLayout }> {
  const layout = collageLayout(tiles.length, shot.width, shot.height);
  const header = await capture(browser, headerHtml(meta, layout.width), layout.width, HEADER_H);
  const labels = await capture(browser, labelsHtml(tiles, shot.width), shot.width, tiles.length * LABEL_H);
  return { png: composeCollage(layout, header, labels, tiles), layout };
}
