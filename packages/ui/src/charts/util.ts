/**
 * CX-CHT shared rules. Pure, server-safe, no chart library.
 */
import {
  CATEGORICAL,
  CATEGORICAL_INK,
  SEQUENTIAL,
  SEQUENTIAL_INK,
  SEVERITIES,
  SEVERITY_META,
} from "../lib/status.js";

/**
 * Which colour language a chart speaks. The standard's rule is absolute:
 * "ranked data uses the severity ladder; unranked uses the categorical ramp —
 * never mixed". A chart therefore takes ONE ramp for all of its series, which
 * makes mixing them impossible rather than merely discouraged.
 *
 *   severity    — the series ARE Critical/High/Medium/Low/Info
 *   sequential  — magnitude of one thing, dark to light. Ranked by size, not
 *                 by meaning: MITRE technique counts, top talkers.
 *   categorical — unrelated buckets with no order: connector types, regions.
 */
export type Ramp = "severity" | "sequential" | "categorical";

/** Which ramp slot series `index` with label `label` occupies. */
function slot(ramp: Ramp, index: number, label?: string) {
  if (ramp === "severity") {
    const severity = (SEVERITIES as readonly string[]).includes(label ?? "")
      ? (label as (typeof SEVERITIES)[number])
      : SEVERITIES[Math.min(index, SEVERITIES.length - 1)]!;
    return { kind: "severity" as const, severity };
  }
  if (ramp === "sequential") {
    // Deepest first, so the largest bar is the darkest. Long series stop at the
    // light end rather than wrapping back to the dark one, which would make two
    // very different magnitudes share a colour.
    const step = SEQUENTIAL.length - 1 - Math.min(index, SEQUENTIAL.length - 1);
    return { kind: "sequential" as const, step: Math.max(2, step) };
  }
  return { kind: "categorical" as const, step: index % CATEGORICAL.length };
}

/** Fill class (`bg-*`) for series `index` with label `label`. */
export function rampFill(ramp: Ramp, index: number, label?: string): string {
  const which = slot(ramp, index, label);
  if (which.kind === "severity") return SEVERITY_META[which.severity].bar;
  if (which.kind === "sequential") return SEQUENTIAL[which.step]!;
  return CATEGORICAL[which.step]!;
}

/**
 * Ink class (`text-*`) for the same slot — for an SVG mark that paints with
 * `currentColor`, such as a donut arc's stroke.
 *
 * Reads from the literal INK arrays rather than rewriting `rampFill`'s output.
 * A computed class name (`rampFill(...).replace("bg-", "text-")`) exists only at
 * runtime, so Tailwind never emits a rule for it and the mark renders with no
 * colour — silently, and invisibly to verify-utilities.
 */
export function rampInk(ramp: Ramp, index: number, label?: string): string {
  const which = slot(ramp, index, label);
  if (which.kind === "severity") return SEVERITY_META[which.severity].text;
  if (which.kind === "sequential") return SEQUENTIAL_INK[which.step]!;
  return CATEGORICAL_INK[which.step]!;
}

/**
 * Percentages that sum to exactly 100.
 *
 * Rounding each share independently gives legends like "50% · 25% · 24%", which
 * reads as a bug. Largest-remainder distribution puts the rounding slack on the
 * segments that lost the most to it, so the column always totals 100.
 */
export function sharePercents(values: readonly number[]): number[] {
  const total = values.reduce((sum, value) => sum + Math.max(0, value), 0);
  if (total <= 0) return values.map(() => 0);

  const exact = values.map((value) => (Math.max(0, value) / total) * 100);
  const floored = exact.map(Math.floor);
  let slack = 100 - floored.reduce((sum, value) => sum + value, 0);

  const order = exact
    .map((value, index) => ({ index, remainder: value - Math.floor(value) }))
    .sort((a, b) => b.remainder - a.remainder);

  const out = [...floored];
  for (const { index } of order) {
    if (slack <= 0) break;
    out[index] = (out[index] ?? 0) + 1;
    slack--;
  }
  return out;
}

/** Compact thousands, so a bar label never widens the chart. */
export function compact(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1)}M`;
  if (abs >= 1_000) return `${(value / 1_000).toFixed(abs >= 10_000 ? 0 : 1)}k`;
  return String(value);
}
