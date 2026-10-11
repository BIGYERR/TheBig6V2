// The shapes one e2e run produces. run.ts fills them; report.ts and collage.ts only read them.

export type Status = 'pass' | 'fail' | 'skipped';

/** One step on one target (the Angular build or the original index.html). */
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
}

export interface RunReport {
  ok: boolean;
  steps: StepResult[];
  version: string;
  sourceSha256?: string;
  baseUrl: string;
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
