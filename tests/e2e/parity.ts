// Screen parity: the Angular build's screenshot against the single-file page's, pixel by pixel.
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import type { Parity } from './types.ts';

/** pixelmatch's per-pixel colour threshold: anti-aliasing noise below it is not counted as a change. */
const THRESHOLD = 0.1;

/**
 * Compares two PNG screenshots. Returns the changed pixel count, that count as a percentage of the frame, and a
 * diff image with changed pixels in red over a faded copy of the first. Differently sized frames are an error,
 * never a percentage.
 */
export function comparePngs(a: Uint8Array, b: Uint8Array): Parity {
  const imgA = PNG.sync.read(Buffer.from(a));
  const imgB = PNG.sync.read(Buffer.from(b));
  if (imgA.width !== imgB.width || imgA.height !== imgB.height) {
    return { error: `sizes differ ${imgA.width}×${imgA.height} vs ${imgB.width}×${imgB.height}` };
  }
  const diff = new PNG({ width: imgA.width, height: imgA.height });
  const pixels = pixelmatch(imgA.data, imgB.data, diff.data, imgA.width, imgA.height, { threshold: THRESHOLD });
  return { pixels, pct: (pixels / (imgA.width * imgA.height)) * 100, diffPng: PNG.sync.write(diff) };
}

/** Reads a PNG's pixel size from its IHDR header without decoding it. */
export function pngSize(png: Uint8Array): { width: number; height: number } {
  const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (png.length < 24 || signature.some((byte, i) => png[i] !== byte)) throw new Error('not a PNG');
  const view = new DataView(png.buffer, png.byteOffset, png.byteLength);
  return { width: view.getUint32(16), height: view.getUint32(20) };
}
