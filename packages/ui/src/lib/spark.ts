/**
 * Sparkline geometry. Pure functions, no React, no chart library.
 *
 * WHY THIS IS NOT IN THE CHART PACKAGE
 * ------------------------------------
 * The standard notes of CX-TIL that "only the trend variant needs a chart
 * dependency". It does not: a sparkline is a polyline through n points, which is
 * arithmetic. Keeping it here means TrendTile stays in the root export and the
 * Tenant console never pulls `recharts` in just to show a trend — which is the
 * entire reason CX-CHT is quarantined behind its own subpath.
 *
 * CX-CHT's `Sparkline` will import from here rather than reimplement it, so
 * there is one set of geometry rules and one place a bug can live.
 */

export interface SparkOptions {
  width?: number;
  height?: number;
  /** Stroke width. The path is inset by half of it so the line is never
   *  clipped by the viewBox edge. */
  stroke?: number;
}

export interface SparkGeometry {
  /** `d` for the trend line. */
  line: string;
  /** `d` for a closed area beneath the line. Flat fill only — the standard
   *  forbids gradients on data marks. */
  area: string;
  /** Terminal point, for the "where it ended" dot. */
  last: { x: number; y: number };
  width: number;
  height: number;
}

const round = (n: number) => Math.round(n * 100) / 100;

/**
 * Returns null rather than throwing when there is nothing honest to draw: a
 * single point is not a trend, and a caller passing an empty array during
 * loading must not take the tile down.
 */
export function sparkPath(
  series: readonly number[],
  { width = 72, height = 22, stroke = 1.5 }: SparkOptions = {},
): SparkGeometry | null {
  const points = series.filter((value) => Number.isFinite(value));
  if (points.length < 2) return null;

  const pad = stroke / 2;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min;

  const x = (index: number) =>
    pad + (index * (width - stroke)) / (points.length - 1);
  // A flat series sits on the centre line instead of dividing by zero.
  const y = (value: number) =>
    span === 0 ? height / 2 : pad + (height - stroke) * (1 - (value - min) / span);

  const coords = points.map((value, index) => [x(index), y(value)] as const);
  const line = coords
    .map(([px, py], index) => `${index === 0 ? "M" : "L"}${round(px)} ${round(py)}`)
    .join(" ");
  const [lastX, lastY] = coords[coords.length - 1]!;

  return {
    line,
    area: `${line} L${round(width - pad)} ${round(height)} L${round(pad)} ${round(height)} Z`,
    last: { x: round(lastX), y: round(lastY) },
    width,
    height,
  };
}

/**
 * The text equivalent. CX-CHT's rule — "every chart has a text equivalent …
 * tooltips are progressive enhancement, never the only way to read a value" —
 * applies to a 72px sparkline too, and a caller will not write this by hand.
 * Derived automatically so the accessible name is never missing.
 */
export function describeSeries(series: readonly number[]): string {
  const points = series.filter((value) => Number.isFinite(value));
  if (points.length === 0) return "No data";
  if (points.length === 1) return `Single reading of ${points[0]}`;
  const first = points[0]!;
  const last = points[points.length - 1]!;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const shape = last > first ? "rising" : last < first ? "falling" : "flat";
  return `Trend across ${points.length} readings, ${shape} from ${first} to ${last}. Low ${min}, high ${max}.`;
}
