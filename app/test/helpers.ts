// Fixtures shared by the unit and integration tests: tiny PNGs built pixel by pixel, and e2e results shaped like a
// real run's, so report and collage code is tested without a browser run.
import { PNG } from 'pngjs';
import type { RunReport, StepResult, TargetResult } from '../e2e/types.ts';

export type Rgb = [number, number, number];

/** A width × height PNG filled with `rgb`; `paint` can override single pixels. */
export function solidPng(width: number, height: number, rgb: Rgb, paint?: (x: number, y: number) => Rgb | undefined): Uint8Array {
  const png = new PNG({ width, height });
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const [r, g, b] = paint?.(x, y) ?? rgb;
      const i = (y * width + x) * 4;
      png.data[i] = r;
      png.data[i + 1] = g;
      png.data[i + 2] = b;
      png.data[i + 3] = 255;
    }
  }
  return PNG.sync.write(png);
}

/** Decodes a PNG once and returns a reader for the RGB value at (x, y). */
export function pixels(png: Uint8Array): (x: number, y: number) => Rgb {
  const img = PNG.sync.read(Buffer.from(png));
  return (x, y) => {
    const i = (y * img.width + x) * 4;
    return [img.data[i]!, img.data[i + 1]!, img.data[i + 2]!];
  };
}

export function passTarget(png?: Uint8Array): TargetResult {
  return { status: 'pass', png, ms: 120, problems: [], warnings: [] };
}

export function fakeStep(n: number, over: Partial<StepResult> = {}): StepResult {
  const png = solidPng(4, 8, [n * 10, 100, 200]);
  return {
    n,
    journeyId: 'journey-a',
    journey: 'Journey A',
    id: `step-${n}`,
    page: `Page ${n}`,
    angular: passTarget(png),
    reference: passTarget(png),
    parity: { pixels: 0, pct: 0, diffPng: solidPng(4, 8, [240, 240, 240]) },
    ok: true,
    ...over,
  };
}

export function fakeRun(steps: StepResult[], over: Partial<RunReport> = {}): RunReport {
  return {
    ok: steps.every((s) => s.ok),
    steps,
    version: '239',
    sourceSha256: 'a'.repeat(64),
    baseUrl: 'http://127.0.0.1',
    browserVersion: 'Chrome/155.0.8059.39',
    viewport: { width: 393, height: 852, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
    frozenNow: '2026-10-07T07:30:00-04:00',
    timezone: 'America/New_York',
    parityMaxPct: 0,
    worstParityPct: 0,
    blocked: [],
    ranAt: '2026-10-11T12:00:00.000Z',
    durationMs: 1234,
    collage: { file: 'collage.png', width: 5000, height: 4000, screens: steps.length },
    ...over,
  };
}

/** Every data: URI image in an HTML page, decoded. */
export function embeddedPngs(html: string): Buffer[] {
  return [...html.matchAll(/src="data:image\/png;base64,([A-Za-z0-9+/=]+)"/g)].map((m) => Buffer.from(m[1]!, 'base64'));
}
