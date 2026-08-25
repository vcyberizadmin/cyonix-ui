/**
 * CX-CHT — the charting layer.
 *
 * NO CHART LIBRARY. STATED PLAINLY.
 * ---------------------------------
 * The standard describes this subpath as the thing that "quarantines the
 * recharts dependency", because SOC drives its charts with recharts today. None
 * of the five components here needs it:
 *
 *   Sparkline      a polyline through n points
 *   ProportionBar  one stacked bar — the standard itself says "no library"
 *   RankedBars     sorted horizontal bars
 *   FunnelFlow     stages with labelled drop-off
 *   Donut          one circle with dash offsets
 *
 * All five are arithmetic and SVG. Shipping them without recharts means no
 * console pays ~100KB for four shapes, and it removes the reason the subpath
 * needed quarantining in the first place. The subpath is kept anyway, so the
 * standard's import paths hold and chart code stays out of the root chunk.
 *
 * This is a deliberate deviation from the standard's recommendation. If a
 * console later needs brushing, zooming or animated transitions, that is the
 * point to reach for a real charting library — not before.
 *
 * Rules encoded here, all from the standard:
 *  · Ranked data uses the severity ladder; unranked uses the categorical ramp.
 *    Never mixed — enforced by taking ONE `ramp` per chart.
 *  · Legends carry the count AND the percentage, so a chart is readable without
 *    a tooltip.
 *  · Every chart has a text equivalent. The SVG is aria-hidden and the LEGEND is
 *    the accessible fallback — exactly as the standard specifies — so there is
 *    no duplicated description to drift out of sync.
 *  · Grid lines at 8% opacity. No 3D. No gradients on data marks.
 *  · Percentages sum to 100 (see sharePercents).
 *
 * Server-safe: no state, no hooks. Segments drill through as links.
 */
import type { ElementType, ReactNode } from "react";
import { cn } from "../lib/cn.js";
import { describeSeries, sparkPath, type SparkOptions } from "../lib/spark.js";
import { compact, rampFill, rampInk, sharePercents, type Ramp } from "./util.js";

export type { Ramp };

/* ---------------------------------------------------------------- Sparkline -- */

export interface SparklineProps extends SparkOptions {
  /** Points oldest → newest. Under two points nothing is drawn. */
  series: readonly number[];
  /** Tailwind text colour class. Data marks are never the brand accent. */
  className?: string;
  /** Overrides the derived accessible name. */
  label?: string;
  /** Flat area fill beneath the line. Never a gradient. */
  area?: boolean;
}

export function Sparkline({
  series,
  className,
  label,
  area = true,
  ...options
}: SparklineProps) {
  const geometry = sparkPath(series, options);
  if (!geometry) return null;

  return (
    <svg
      role="img"
      aria-label={label ?? describeSeries(series)}
      viewBox={`0 0 ${geometry.width} ${geometry.height}`}
      width={geometry.width}
      height={geometry.height}
      fill="none"
      className={cn("text-fg-2 shrink-0", className)}
    >
      {area && <path d={geometry.area} fill="currentColor" opacity="0.12" />}
      <path
        d={geometry.line}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={geometry.last.x}
        cy={geometry.last.y}
        r="1.75"
        fill="currentColor"
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ shared -- */

export interface Slice {
  label: string;
  value: number;
  /** Drill-through to the filtered list behind this segment. */
  href?: string;
}

interface LegendProps {
  slices: Slice[];
  percents: number[];
  ramp: Ramp;
  linkComponent?: ElementType;
  /** Single column reads better beside a donut; two under a bar. */
  columns?: 1 | 2;
}

/**
 * The legend IS the accessible fallback, so it is never optional and never
 * abbreviated: label, count and percentage for every segment.
 */
function Legend({
  slices,
  percents,
  ramp,
  linkComponent,
  columns = 1,
}: LegendProps) {
  return (
    <ul
      className={cn(
        "grid min-w-0 gap-x-6 gap-y-1.5",
        columns === 2 ? "grid-cols-1 min-[420px]:grid-cols-2" : "grid-cols-1",
      )}
    >
      {slices.map((slice, index) => {
        const Root = (slice.href ? (linkComponent ?? "a") : "span") as ElementType;
        return (
          <li key={slice.label} className="min-w-0">
            <Root
              {...(slice.href ? { href: slice.href } : {})}
              className={cn(
                "flex min-w-0 items-center gap-2 text-[12px]",
                slice.href &&
                  "hover:text-fg duration-instant ease-brand cursor-pointer transition-colors",
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "size-2 shrink-0 rounded-[2px]",
                  rampFill(ramp, index, slice.label),
                )}
              />
              <span className="text-fg-2 min-w-0 flex-1 truncate">
                {slice.label}
              </span>
              {/* Count AND percentage. Both, always. */}
              <span className="text-fg shrink-0 font-mono text-[11px] tabular-nums">
                {slice.value.toLocaleString("en-US")}
              </span>
              <span className="text-fg-muted w-9 shrink-0 text-right font-mono text-[11px] tabular-nums">
                {percents[index]}%
              </span>
            </Root>
          </li>
        );
      })}
    </ul>
  );
}

/* ------------------------------------------------------------ ProportionBar -- */

export interface ProportionBarProps {
  slices: Slice[];
  ramp?: Ramp;
  /** Hide the legend only when an adjacent one already carries the numbers. */
  legend?: boolean;
  linkComponent?: ElementType;
  /** Bar thickness. */
  size?: "sm" | "md";
  className?: string;
}

/**
 * One stacked bar. VAPT's contribution, and the cheapest chart in the set —
 * the standard notes it "needs no chart library at all".
 */
export function ProportionBar({
  slices,
  ramp = "severity",
  legend = true,
  linkComponent,
  size = "md",
  className,
}: ProportionBarProps) {
  const percents = sharePercents(slices.map((slice) => slice.value));
  const total = slices.reduce((sum, slice) => sum + Math.max(0, slice.value), 0);

  return (
    <div className={cn("flex min-w-0 flex-col gap-3", className)}>
      <div
        aria-hidden="true"
        className={cn(
          "bg-wash-2 flex w-full overflow-hidden rounded-full",
          size === "sm" ? "h-1.5" : "h-2.5",
        )}
      >
        {total > 0 &&
          slices.map((slice, index) => (
            <span
              key={slice.label}
              // Zero-value segments must not render a hairline of colour that
              // implies a nonzero count.
              className={cn(
                slice.value > 0 && rampFill(ramp, index, slice.label),
              )}
              style={{ width: `${percents[index]}%` }}
            />
          ))}
      </div>
      {legend && (
        <Legend
          slices={slices}
          percents={percents}
          ramp={ramp}
          linkComponent={linkComponent}
          columns={2}
        />
      )}
    </div>
  );
}

/* --------------------------------------------------------------- RankedBars -- */

export interface RankedBarsProps {
  items: Slice[];
  /**
   * Sorted descending by default — "compare ranked categories: horizontal bars,
   * sorted". Pass false only when the order is itself meaningful, e.g. severity
   * in scale order.
   */
  sort?: boolean;
  /** Show at most this many, with the remainder collapsed into "Other". */
  max?: number;
  ramp?: Ramp;
  linkComponent?: ElementType;
  className?: string;
}

export function RankedBars({
  items,
  sort = true,
  max,
  ramp = "sequential",
  linkComponent,
  className,
}: RankedBarsProps) {
  let rows = sort ? [...items].sort((a, b) => b.value - a.value) : [...items];

  if (max && rows.length > max) {
    const rest = rows.slice(max);
    const other = rest.reduce((sum, row) => sum + row.value, 0);
    rows = [...rows.slice(0, max), { label: "Other", value: other }];
  }

  const peak = Math.max(...rows.map((row) => row.value), 1);
  const total = rows.reduce((sum, row) => sum + Math.max(0, row.value), 0);
  const percents = sharePercents(rows.map((row) => row.value));

  return (
    <ul className={cn("flex min-w-0 flex-col gap-2.5", className)}>
      {rows.map((row, index) => {
        const Root = (row.href ? (linkComponent ?? "a") : "div") as ElementType;
        return (
          <li key={row.label} className="min-w-0">
            <Root
              {...(row.href ? { href: row.href } : {})}
              className={cn(
                "group/bar flex min-w-0 flex-col gap-1",
                row.href && "cursor-pointer",
              )}
            >
              <span className="flex min-w-0 items-baseline justify-between gap-3 text-[12px]">
                <span
                  className={cn(
                    "text-fg-2 min-w-0 truncate",
                    row.href && "group-hover/bar:text-fg",
                  )}
                >
                  {row.label}
                </span>
                <span className="shrink-0 font-mono text-[11px] tabular-nums">
                  {/* Exact value without hovering — the standard's rule. */}
                  <span className="text-fg">{compact(row.value)}</span>
                  {total > 0 && (
                    <span className="text-fg-muted ml-2">{percents[index]}%</span>
                  )}
                </span>
              </span>
              <span
                aria-hidden="true"
                className="bg-wash-2 h-1.5 w-full overflow-hidden rounded-full"
              >
                <span
                  className={cn(
                    "block h-full rounded-full",
                    rampFill(ramp, index, row.label),
                  )}
                  // Scaled to the PEAK, not the total: this chart compares
                  // categories against each other, not against a whole.
                  style={{ width: `${(Math.max(0, row.value) / peak) * 100}%` }}
                />
              </span>
            </Root>
          </li>
        );
      })}
    </ul>
  );
}

/* --------------------------------------------------------------- FunnelFlow -- */

export interface FunnelStage {
  label: string;
  value: number;
  href?: string;
}

export interface FunnelFlowProps {
  stages: FunnelStage[];
  ramp?: Ramp;
  linkComponent?: ElementType;
  className?: string;
}

/**
 * A pipeline with drop-off labelled at every step.
 *
 * Rendered as descending bars rather than a Sankey. A Sankey's ribbons encode
 * the same single number as a bar's width while being far harder to read
 * precisely, and the operator's question here — "where are we losing them" — is
 * answered by the drop-off figure between stages, which is stated in words.
 */
export function FunnelFlow({
  stages,
  ramp = "sequential",
  linkComponent,
  className,
}: FunnelFlowProps) {
  const head = stages[0]?.value ?? 0;

  return (
    <ol className={cn("flex min-w-0 flex-col", className)}>
      {stages.map((stage, index) => {
        const previous = index > 0 ? (stages[index - 1]?.value ?? 0) : null;
        const dropped = previous === null ? 0 : previous - stage.value;
        const dropPct =
          previous && previous > 0 ? Math.round((dropped / previous) * 100) : 0;
        const ofHead = head > 0 ? Math.round((stage.value / head) * 100) : 0;
        const Root = (stage.href ? (linkComponent ?? "a") : "div") as ElementType;

        return (
          <li key={stage.label} className="min-w-0">
            {previous !== null && (
              // Drop-off between the stages it relates, in words and figures.
              <div className="text-fg-muted flex items-center gap-2 py-1.5 pl-1 text-[11px]">
                {/* Full-strength muted ink, not /60: at 60% this measured
                    2.23:1, which is too faint to read as a glyph at 11px even
                    though it is decorative. */}
                <span aria-hidden="true" className="text-fg-muted">
                  ↓
                </span>
                {dropped > 0 ? (
                  <span>
                    <span className="text-warning-ink font-mono tabular-nums">
                      −{compact(dropped)}
                    </span>{" "}
                    dropped ({dropPct}%)
                  </span>
                ) : (
                  <span>No drop-off</span>
                )}
              </div>
            )}
            <Root
              {...(stage.href ? { href: stage.href } : {})}
              className={cn(
                "group/stage flex min-w-0 flex-col gap-1",
                stage.href && "cursor-pointer",
              )}
            >
              <span className="flex min-w-0 items-baseline justify-between gap-3 text-[12px]">
                <span
                  className={cn(
                    "text-fg-2 min-w-0 truncate",
                    stage.href && "group-hover/stage:text-fg",
                  )}
                >
                  {stage.label}
                </span>
                <span className="shrink-0 font-mono text-[11px] tabular-nums">
                  <span className="text-fg">
                    {stage.value.toLocaleString("en-US")}
                  </span>
                  <span className="text-fg-muted ml-2">{ofHead}%</span>
                </span>
              </span>
              <span
                aria-hidden="true"
                className="bg-wash-2 h-2.5 w-full overflow-hidden rounded-sm"
              >
                <span
                  className={cn(
                    "block h-full rounded-sm",
                    rampFill(ramp, index, stage.label),
                  )}
                  style={{ width: `${ofHead}%` }}
                />
              </span>
            </Root>
          </li>
        );
      })}
    </ol>
  );
}

/* -------------------------------------------------------------------- Donut -- */

export interface DonutProps {
  slices: Slice[];
  ramp?: Ramp;
  /** Diameter in px. */
  size?: number;
  /** Ring thickness in px. */
  thickness?: number;
  /** Centre caption under the total, e.g. "findings". */
  totalLabel?: string;
  legend?: boolean;
  linkComponent?: ElementType;
  className?: string;
}

/**
 * A counted donut. The centre carries the total, so the one number everybody
 * wants is not something to be derived from the legend.
 */
export function Donut({
  slices,
  ramp = "severity",
  size = 140,
  thickness = 14,
  totalLabel,
  legend = true,
  linkComponent,
  className,
}: DonutProps) {
  const percents = sharePercents(slices.map((slice) => slice.value));
  const total = slices.reduce((sum, slice) => sum + Math.max(0, slice.value), 0);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;

  let offset = 0;
  const arcs = slices.map((slice, index) => {
    const fraction = total > 0 ? Math.max(0, slice.value) / total : 0;
    const length = fraction * circumference;
    const arc = { index, label: slice.label, length, offset };
    offset += length;
    return arc;
  });

  return (
    <div
      className={cn(
        "flex min-w-0 flex-col items-center gap-5 min-[520px]:flex-row min-[520px]:items-center",
        className,
      )}
    >
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg
          // The legend is the accessible equivalent, so the ring itself is
          // decorative rather than a second thing to keep in sync.
          aria-hidden="true"
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          // Start at twelve o'clock, clockwise.
          className="-rotate-90"
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={thickness}
            // The track, at the standard's 8% grid opacity.
            className="stroke-fg/8"
          />
          {total > 0 &&
            arcs.map((arc) =>
              arc.length > 0 ? (
                <circle
                  key={arc.label}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  strokeWidth={thickness}
                  strokeDasharray={`${arc.length} ${circumference - arc.length}`}
                  strokeDashoffset={-arc.offset}
                  className={cn(
                    "[stroke:currentColor]",
                    rampInk(ramp, arc.index, arc.label),
                  )}
                />
              ) : null,
            )}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-fg text-[22px] leading-none font-bold tabular-nums">
            {compact(total)}
          </span>
          {totalLabel && (
            <span className="text-fg-muted mt-1 text-[10px] font-semibold tracking-wider uppercase">
              {totalLabel}
            </span>
          )}
        </div>
      </div>
      {legend && (
        <div className="min-w-0 flex-1">
          <Legend
            slices={slices}
            percents={percents}
            ramp={ramp}
            linkComponent={linkComponent}
          />
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------- Gauge -- */

export interface GaugeProps {
  slices: Slice[];
  ramp?: Ramp;
  /** Rendered under the total in the well. */
  totalLabel?: string;
  /** Width in px. Height follows the 200 × 172 arch. */
  size?: number;
  thickness?: number;
  legend?: boolean;
  linkComponent?: ElementType;
  className?: string;
}

/**
 * A 180° arch, filled left to right.
 *
 * The sibling of `Donut`, for the same data shape. Reach for the arch when the
 * reading is a LEVEL — how full, how far through — and for the donut when it is
 * a SPLIT. A ring implies the parts close back on themselves; an arch has a
 * floor and a ceiling, which is what a severity or capacity reading has.
 *
 * The path carries `pathLength="100"`, so every segment is its own percentage
 * and the arithmetic never touches the geometry. Change the shape and the
 * segments still land.
 *
 * Server-safe: no state, no hooks.
 */
export function Gauge({
  slices,
  ramp = "categorical",
  totalLabel,
  size = 200,
  thickness = 25,
  legend = true,
  linkComponent,
  className,
}: GaugeProps) {
  const total = slices.reduce((sum, s) => sum + s.value, 0);
  const percents = sharePercents(slices.map((s) => s.value));

  /* Vertical sides with a rounded shoulder — an arch, not a half-circle, so the
     ends sit level with the label row instead of floating. */
  const ARCH = "M22 162V66a44 44 0 0 1 44-44h68a44 44 0 0 1 44 44v96";

  let offset = 0;
  const segments = slices.map((slice, index) => {
    const length = percents[index] ?? 0;
    const seg = { slice, length, offset, index };
    offset += length;
    return seg;
  });

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      <div className="relative" style={{ width: size }}>
        <svg
          // The legend is the accessible equivalent, so the arch is decorative
          // rather than a second thing to keep in sync.
          aria-hidden="true"
          viewBox="0 0 200 172"
          width={size}
          height={size * (172 / 200)}
          fill="none"
        >
          <g strokeLinecap="butt" strokeWidth={thickness}>
            <path d={ARCH} pathLength={100} className="stroke-fg/8" />
            {total > 0 &&
              segments.map(({ slice, length, offset: start, index }) =>
                length > 0 ? (
                  <path
                    key={slice.label}
                    d={ARCH}
                    pathLength={100}
                    strokeDasharray={`${length} 100`}
                    strokeDashoffset={-start}
                    // Same trick the donut uses: the ramp hands back a Tailwind
                    // CLASS, not a colour, so it cannot be dropped into a
                    // `stroke` attribute — that renders nothing, silently. Set
                    // the text colour and let the stroke follow currentColor.
                    className={cn(
                      "[stroke:currentColor]",
                      rampInk(ramp, index, slice.label),
                    )}
                  />
                ) : null,
              )}
          </g>
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pt-6">
          <span className="font-display text-[34px] leading-none font-bold tabular-nums">
            {compact(total)}
          </span>
          {totalLabel && (
            <span className="text-fg-2 mt-1.5 text-[13px] font-semibold">
              {totalLabel}
            </span>
          )}
        </div>
      </div>
      {legend && (
        <Legend
          slices={slices}
          percents={percents}
          ramp={ramp}
          linkComponent={linkComponent}
          columns={2}
        />
      )}
    </div>
  );
}
