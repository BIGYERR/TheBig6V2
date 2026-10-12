// The shapes one e2e run produces. run.ts fills them; report.ts and collage.ts only read them.

export type Status = 'pass' | 'fail' | 'skipped';

/** One step on one target (the Angular build or the single-file page). */
export interface TargetResult {
  status: Status;
  error?: string;
  /** The screenshot, PNG bytes. Absent when the step never ran or the capture failed. */
  png?: Uint8Array;
  ms?: number;
  problems: string[];
  warnings: string[];
}

/** Pixel comparison of the two targets' screenshots for one step. */
export type Parity = { pixels: number; pct: number; diffPng: Uint8Array } | { error: string };

export interface StepResult {
  /** 1-based across every journey, the number every label and comment uses ("#09"). */
  n: number;
  /** The journey the step belongs to: its kebab-case id and its name. */
  journeyId: string;
  journey: string;
  id: string;
  page: string;
  angular: TargetResult;
  reference: TargetResult;
  parity: Parity | null;
  ok: boolean;
}

/** The collage's three bands, top to bottom, and the report's sections in the same order. */
export type Band = 'website' | 'admin' | 'app';
export type PageBand = Exclude<Band, 'app'>;

/** The letter before a step number in its band's labels: W01, A03, and the app's plain 27. */
export const BAND_PREFIX: Record<Band, string> = { website: 'W', admin: 'A', app: '' };

/**
 * One step of a single-target journey: a website or admin page, as the backend serves it. There is no original to
 * compare it with, so it stands on its own checks and one screenshot of the whole page, top to bottom.
 */
export interface PageStepResult {
  band: PageBand;
  /** 1-based within its band, the number its label prints after the band's letter ("W02"). */
  n: number;
  journeyId: string;
  journey: string;
  id: string;
  page: string;
  /** The viewport the page was drawn at, as the labels print it: "1440×900 @1x". */
  viewport: string;
  /** The address the screenshot shows. */
  url?: string;
  result: TargetResult;
  ok: boolean;
}

export interface Viewport {
  width: number;
  height: number;
  deviceScaleFactor: number;
  isMobile: boolean;
  hasTouch: boolean;
}

export interface CollageInfo {
  file: string;
  width: number;
  height: number;
  screens: number;
  /** Each band's title and how many screens it holds, top to bottom. */
  bands?: { title: string; screens: number }[];
}

export interface RunReport {
  ok: boolean;
  steps: StepResult[];
  /** The website and admin steps, in band order. */
  pages: PageStepResult[];
  version: string;
  sourceSha256?: string;
  baseUrl: string;
  /** Where the backend (website, admin, and the app at /app/) was reached. */
  backendUrl: string;
  browserVersion: string;
  viewport: Viewport;
  frozenNow: string;
  timezone: string;
  parityMaxPct: number;
  worstParityPct: number | null;
  blocked: string[];
  ranAt: string;
  durationMs: number;
  collage: CollageInfo | null;
}

/** Zero-padded step number, the handle used in the report, the collage and comments: 9 -> "09". */
export const stepLabel = (n: number): string => String(n).padStart(2, '0');

/** A website or admin step's handle, its band's letter and its number: "W02", "A05". */
export const pageLabel = (s: { band: PageBand; n: number }): string => `${BAND_PREFIX[s.band]}${stepLabel(s.n)}`;
