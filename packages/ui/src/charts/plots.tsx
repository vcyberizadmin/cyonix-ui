import { cn } from "../lib/cn.js";
import { compact } from "./util.js";

/**
 * CX-CHT, continued — the plots that carry an axis or a grid.
 *
 * Same rules as `primitives.tsx`: no chart library, arithmetic and SVG, grid
 * lines at 8%, and a text equivalent for every mark. Where the primitives use a
 * legend as the accessible fallback, these use a real `<table>` or a visible
 * axis, because a plot's fallback is its numbers.
 *
 * Server-safe: no state, no hooks. `StepArea` is the interactive one and lives
 * in its own file so this one stays renderable from a Server Component.
 */

/* ---------------------------------------------------------------- AxisBars -- */

export interface AxisBarPoint {
  label: string;
  value: number;
}

export interface AxisBarsProps {
  points: AxisBarPoint[];
  /**
   * Indices drawn at full contrast. Everything else recedes — in a bar set the
   * question is almost never "what is every bar", it is "what is THIS window",
   * and a chart where every bar shouts answers neither.
   */
  highlight?: number[];
  /** Y axis ticks. The scale always starts at zero; a truncated bar lies. */
  ticks?: number;
  height?: number;
  /** How many x labels to print. The rest are drawn but not named. */
  xLabels?: number;
  unit?: string;
  className?: string;
}

export function AxisBars({
  points,
  highlight,
  ticks = 4,
  height = 200,
  xLabels = 5,
  unit,
  className,
}: AxisBarsProps) {
  if (points.length === 0) return null;

  const W = 600;
  const padLeft = 34;
  const padBottom = 22;
  const padTop = 10;
  const plotW = W - padLeft - 4;
  const plotH = height - padTop - padBottom;

  const max = Math.max(...points.map((p) => p.value), 1);
  /* Round the ceiling up to a clean tick so the top gridline is a real number. */
  const step = Math.pow(10, Math.floor(Math.log10(max / ticks)));
  const niceMax = Math.ceil(max / (step * ticks)) * step * ticks || max;

  const gap = Math.max(2, plotW * 0.012);
  const barW = (plotW - gap * (points.length - 1)) / points.length;
  const lit = new Set(highlight ?? points.map((_, i) => i));

  const labelEvery = Math.max(1, Math.round(points.length / Math.max(1, xLabels - 1)));

  return (
    <figure className={cn("m-0", className)}>
      <svg
        aria-hidden="true"
        viewBox={`0 0 ${W} ${height}`}
        className="w-full"
        style={{ height }}
        preserveAspectRatio="none"
      >
        {Array.from({ length: ticks + 1 }, (_, i) => {
          const value = (niceMax / ticks) * i;
          const y = padTop + plotH - (value / niceMax) * plotH;
          return (
            <g key={i}>
              <line
                x1={padLeft}
                x2={padLeft + plotW}
                y1={y}
                y2={y}
                className="stroke-fg/8"
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
              />
              <text
                x={padLeft - 8}
                y={y + 4}
                textAnchor="end"
                className="fill-fg-muted text-[10.5px] font-semibold"
              >
                {compact(value)}
              </text>
            </g>
          );
        })}

        {points.map((point, i) => {
          const barH = (point.value / niceMax) * plotH;
          return (
            <rect
              key={`${point.label}-${i}`}
              x={padLeft + i * (barW + gap)}
              y={padTop + plotH - barH}
              width={barW}
              height={Math.max(barH, 1)}
              rx={Math.min(barW / 2, 3)}
              className={lit.has(i) ? "fill-accent" : "fill-fg/20"}
            />
          );
        })}

        {points.map((point, i) =>
          i % labelEvery === 0 || i === points.length - 1 ? (
            <text
              key={`x-${i}`}
              x={padLeft + i * (barW + gap) + barW / 2}
              y={height - 6}
              textAnchor={i === 0 ? "start" : i === points.length - 1 ? "end" : "middle"}
              className="fill-fg-muted text-[10.5px] font-semibold"
            >
              {point.label}
            </text>
          ) : null,
        )}
      </svg>

      {/* The numbers, for anyone who cannot use the picture. */}
      <figcaption className="sr-only">
        <table>
          <tbody>
            {points.map((p, i) => (
              <tr key={`${p.label}-${i}`}>
                <th scope="row">{p.label}</th>
                <td>
                  {p.value}
                  {unit ? ` ${unit}` : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </figcaption>
    </figure>
  );
}

/* ----------------------------------------------------------------- Heatmap -- */

export interface HeatmapProps {
  /** Row labels, top to bottom. */
  rows: string[];
  /** Column labels, left to right. */
  columns: string[];
  /** `values[row][col]`. `null` means no data, which is not the same as zero. */
  values: (number | null)[][];
  /** Ceiling for the ramp. Defaults to the largest value present. */
  max?: number;
  /** Names the two ends of the scale. Both are required — an unlabelled ramp
   *  is a decoration. */
  scale?: { low: string; high: string };
  caption?: string;
  className?: string;
}

/**
 * A matrix of intensities, on the sequential ramp.
 *
 * Rendered as a real `<table>` rather than a grid of divs, because a matrix IS
 * tabular: the row and column headers carry the meaning, and a screen reader
 * gets them for free. `null` renders as an empty cell, not as the bottom of the
 * ramp — "we saw nothing" and "we did not look" are different findings and a
 * heatmap that conflates them is worse than no heatmap.
 *
 * Colour alone never carries the value: every cell keeps its number in the
 * accessible name.
 */
export function Heatmap({
  rows,
  columns,
  values,
  max,
  scale,
  caption,
  className,
}: HeatmapProps) {
  const present = values.flat().filter((v): v is number => v !== null);
  const ceiling = max ?? Math.max(...present, 1);

  /* Eight steps, so a cell lands on a named token rather than an interpolation. */
  const step = (value: number) => {
    if (ceiling <= 0) return 1;
    return Math.min(8, Math.max(1, Math.ceil((value / ceiling) * 8)));
  };

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="overflow-x-auto">
        <table className="border-separate border-spacing-1">
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead>
            <tr>
              <td />
              {columns.map((column) => (
                <th
                  key={column}
                  scope="col"
                  className="text-fg-muted px-1 pb-1 text-center text-[10px] font-semibold"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, r) => (
              <tr key={row}>
                <th
                  scope="row"
                  className="text-fg-2 pr-2 text-right text-[11px] font-semibold whitespace-nowrap"
                >
                  {row}
                </th>
                {columns.map((column, c) => {
                  const value = values[r]?.[c] ?? null;
                  return (
                    <td
                      key={column}
                      title={`${row} · ${column}: ${value ?? "no data"}`}
                      className={cn(
                        "size-7 rounded-sm text-center align-middle",
                        value === null && "border-rule border border-dashed",
                      )}
                      style={
                        value === null
                          ? undefined
                          : { background: `var(--seq-${step(value)})` }
                      }
                    >
                      <span className="sr-only">{value ?? "no data"}</span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {scale && (
        <div className="text-fg-muted flex items-center gap-2 text-[10.5px] font-bold tracking-[0.04em] uppercase">
          {scale.low}
          <span
            aria-hidden="true"
            className="h-2 flex-1 rounded-full"
            style={{
              background:
                "linear-gradient(90deg, var(--seq-1), var(--seq-4), var(--seq-8))",
            }}
          />
          {scale.high}
        </div>
      )}
    </div>
  );
}
