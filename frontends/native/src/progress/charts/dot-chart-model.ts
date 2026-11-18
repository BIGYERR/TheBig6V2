// The weekly dot chart, kept apart from Angular so the app's node --test suite reads it as it is (architecture phase E,
// step 14: the chart moves from the legacy buildDotChart to the DotChart component). Every coordinate is the legacy
// builder's arithmetic, so the SVG the component draws carries the same numbers.

/** One gridline and its value label. */
export interface DotGridLine {
  y: number;
  label: number;
}

/** The chart, ready to draw. */
export interface DotSpec {
  /** The title's markup (its icon, then its words). */
  title: string;
  color: string;
  width: number;
  height: number;
  /** Where the plot starts and ends across, and where a value label sits. */
  left: number;
  right: number;
  grid: DotGridLine[];
  path: string;
  points: { x: number; y: number }[];
  xLabels: { x: number; text: string }[];
  /** Where the week labels sit down the chart. */
  xLabelY: number;
  total: string;
  peak: string;
  unit: string;
}

const W = 320, H = 120, PAD_L = 36, PAD_R = 12, PAD_T = 16, PAD_B = 24;

/** The chart for one series across the weeks, or null when nothing is logged (the legacy builder drew nothing then). */
export function dotChart(title: string, weeks: number[], data: (number | null)[], color: string, unit: string, maxY?: number): DotSpec | null {
  const valid = data.filter((v): v is number => v !== null);
  if (!valid.length) return null;
  const max = maxY || Math.max(...valid) * 1.2 || 10;
  const min = 0;
  const plotW = W - PAD_L - PAD_R;
  const plotH = H - PAD_T - PAD_B;
  const n = weeks.length;
  const xStep = plotW / Math.max(n - 1, 1);
  const yOf = (v: number) => PAD_T + plotH - ((v - min) / (max - min)) * plotH;
  const points: { x: number; y: number }[] = [];
  let path = '';
  let prev: { x: number; y: number } | null = null;
  data.forEach((v, i) => {
    if (v === null) {
      prev = null;
      return;
    }
    const pt = { x: PAD_L + i * xStep, y: yOf(v) };
    points.push(pt);
    if (prev) path += ` M${prev.x},${prev.y} L${pt.x},${pt.y}`;
    prev = pt;
  });
  const step = n <= 8 ? 1 : n <= 16 ? 2 : 4;
  return {
    title, color, width: W, height: H, left: PAD_L, right: W - PAD_R,
    grid: [0, Math.round(max * 0.5), Math.round(max)].map((label) => ({ y: yOf(label), label })),
    path,
    points,
    xLabels: weeks.flatMap((w, i) => (i % step === 0 ? [{ x: PAD_L + i * xStep, text: 'W' + w }] : [])),
    xLabelY: H - 4,
    total: valid.reduce((a, b) => a + b, 0).toFixed(1),
    peak: Math.max(...valid).toFixed(1),
    unit,
  };
}
