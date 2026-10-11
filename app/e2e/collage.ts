// The collage: every screen the suite covers, in step order, on one large PNG with a label over each, so a screen
// can be referred to and commented on later by its number ("#09 rest-sheet"). Screenshots are placed at their
// native pixel size (393×852 @2x = 786×1704), so the collage loses no detail. Chrome lays out and draws the page;
// nothing here rasterizes text by hand.
import type { Browser } from 'puppeteer';
import { dataUri } from './report.ts';
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

/** The collage as a fixed-size page: absolutely positioned labels and screenshots on a bone background. */
export function collageHtml(tiles: readonly CollageTile[], layout: CollageLayout, meta: CollageMeta): string {
  if (tiles.length !== layout.placements.length) throw new RangeError(`${tiles.length} tiles for ${layout.placements.length} cells`);
  const { shotWidth: w, shotHeight: h } = layout;
  const cells = tiles
    .map((t, i) => {
      const p = layout.placements[i]!;
      const shot = t.png
        ? `<img src="${dataUri(t.png)}" alt="" style="left:${p.shotX}px;top:${p.shotY}px;width:${w}px;height:${h}px">`
        : `<div class="missing" style="left:${p.shotX}px;top:${p.shotY}px;width:${w}px;height:${h}px">No screenshot</div>`;
      return `<div class="label ${t.status}" style="left:${p.x}px;top:${p.y}px;width:${w}px;height:${LABEL_H}px">
  <div class="num">#${stepLabel(t.n)}</div>
  <div class="text"><div class="title">${esc(t.title)}</div><div class="id">${esc(t.id)} <span class="chip">${STATUS_TEXT[t.status]}</span></div></div>
</div>
${shot}${t.status === 'pass' ? '' : `<div class="flag" style="left:${p.shotX - 8}px;top:${p.shotY - 8}px;width:${w + 16}px;height:${h + 16}px"></div>`}`;
    })
    .join('\n');
  return `<!doctype html>
<html><head><meta charset="utf-8"><style>
*{box-sizing:border-box;margin:0}
html,body{width:${layout.width}px;height:${layout.height}px;overflow:hidden}
body{position:relative;background:#F4F1E8;color:#181712;font-family:"Noto Sans","DejaVu Sans","Liberation Sans",Helvetica,Arial,sans-serif}
.head{position:absolute;left:${PAD}px;top:${PAD}px;right:${PAD}px;height:${HEADER_H - 40}px;border-bottom:6px solid #181712}
.head h1{font-size:92px;line-height:1;font-weight:800;letter-spacing:.01em}
.head h1 span{color:#CF4E1A}
.head p{margin-top:22px;font-size:34px;color:#5c584e}
.label,img,.missing,.flag{position:absolute}
.label{display:flex;align-items:center;gap:26px;padding-bottom:14px}
.num{font-size:96px;line-height:1;font-weight:800;color:#CF4E1A;font-variant-numeric:tabular-nums}
.text{min-width:0}
.title{font-size:36px;line-height:1.15;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.id{margin-top:8px;font-size:28px;color:#5c584e;font-family:"DejaVu Sans Mono","Liberation Mono",Menlo,monospace}
.chip{display:inline-block;margin-left:10px;padding:2px 14px;border-radius:999px;font-size:24px;font-weight:700;font-family:"Noto Sans","DejaVu Sans",sans-serif;background:#e3efdf;color:#2f6b3a}
.fail .chip{background:#f6dedb;color:#a3261b}.skipped .chip{background:#ebe7dc;color:#5c584e}
img{display:block;box-shadow:0 0 0 2px #d9d4c5}
.missing{display:flex;align-items:center;justify-content:center;border:4px dashed #b9b3a3;font-size:40px;color:#5c584e}
.flag{border:8px solid #a3261b;border-radius:10px;pointer-events:none}
</style></head><body>
<div class="head"><h1>IRON ASYLUM <span>e2e screens</span></h1><p>${esc(meta.subtitle)}</p></div>
${cells}
</body></html>`;
}

/**
 * Draws the collage in `browser` and returns it as PNG bytes, exactly `layout.width` × `layout.height` pixels
 * (device scale 1, so each screenshot pixel is one collage pixel).
 */
export async function renderCollage(
  browser: Browser,
  tiles: readonly CollageTile[],
  meta: CollageMeta,
  shot: { width: number; height: number },
): Promise<{ png: Uint8Array; layout: CollageLayout }> {
  const layout = collageLayout(tiles.length, shot.width, shot.height);
  const page = await browser.newPage();
  try {
    await page.setViewport({ width: layout.width, height: layout.height, deviceScaleFactor: 1 });
    await page.setContent(collageHtml(tiles, layout, meta), { waitUntil: 'load' });
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all([...document.images].map((img) => img.decode()));
    });
    const png = await page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: layout.width, height: layout.height } });
    return { png, layout };
  } finally {
    await page.close();
  }
}
