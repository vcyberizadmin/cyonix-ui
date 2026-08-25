"use client";

import { useId, useRef, useState } from "react";
import { cn } from "../lib/cn.js";

/**
 * CX-CHT — the smoothed step area.
 *
 * The one chart in the set that is NOT server-safe, and the file is separate so
 * that fact does not leak into the others: a pointer readout needs state, and
 * `Sparkline` promises the opposite.
 *
 * Why a step and not a line. A line between two samples asserts the value moved
 * smoothly between them, which for a polled metric is a fiction — nothing was
 * measured in the gap. A step holds each reading flat until the next one and
 * joins them with a short S-curve, so the shape says "sampled" rather than
 * "continuous" without looking like a staircase.
 */

export interface StepAreaProps {
  /** Points oldest → newest. Under two points nothing is drawn. */
  series: readonly number[];
  /** X labels. Renders as many as fit; the rest are drawn but unnamed. */
  labels?: readonly string[];
  /** Accessible name. Required — a chart nobody can read is decoration. */
  label: string;
  height?: number;
  ticks?: number;
  /** Formats the readout and the accessible table. */
  format?: (value: number) => string;
  className?: string;
}

export function StepArea({
  series,
  labels,
  label,
  height = 220,
  ticks = 4,
  format = (v) => String(v),
  className,
}: StepAreaProps) {
  const gradientId = useId();
  const hostRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<number | null>(null);

  if (series.length < 2) return null;

  const W = 600;
  const padLeft = 36;
  const padTop = 14;
  const padBottom = 20;
  const plotW = W - padLeft - 6;
  const plotH = height - padTop - padBottom;

  const min = Math.min(...series);
  const max = Math.max(...series);
  /* Pad the band so the line never sits on the frame. A flat series would give
     a zero range and divide by nothing. */
  const range = max - min || 1;
  const lo = min - range * 0.15;
  const hi = max + range * 0.15;

  const slot = plotW / series.length;
  const x = (i: number) => padLeft + i * slot;
  const cx = (i: number) => padLeft + (i + 0.5) * slot;
  const y = (v: number) => padTop + plotH - ((v - lo) / (hi - lo)) * plotH;

  /* Flat plateau, then a short cubic to the next level. The curve is 28% of a
     slot either side of the join, which reads as a transition rather than a
     ramp. */
  const ease = slot * 0.28;
  let d = `M${padLeft},${y(series[0]!)}`;
  for (let i = 0; i < series.length - 1; i++) {
    const edge = x(i + 1);
    const a = y(series[i]!);
    const b = y(series[i + 1]!);
    d += `L${edge - ease},${a}C${edge},${a} ${edge},${b} ${edge + ease},${b}`;
  }
  d += `L${padLeft + plotW},${y(series[series.length - 1]!)}`;

  const onMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const host = hostRef.current;
    if (!host) return;
    const rect = host.getBoundingClientRect();
    const ratio = (event.clientX - rect.left) / rect.width;
    const i = Math.floor(((ratio * W - padLeft) / plotW) * series.length);
    setActive(Math.max(0, Math.min(series.length - 1, i)));
  };

  const labelEvery = labels
    ? Math.max(1, Math.round(labels.length / 4))
    : 0;

  return (
    <figure className={cn("m-0", className)}>
      <div
        ref={hostRef}
        className="relative"
        style={{ height }}
        onPointerMove={onMove}
        onPointerLeave={() => setActive(null)}
      >
        <svg
          aria-hidden="true"
          viewBox={`0 0 ${W} ${height}`}
          className="w-full"
          style={{ height }}
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.35" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {Array.from({ length: ticks + 1 }, (_, i) => {
            const value = lo + ((hi - lo) / ticks) * i;
            const gy = y(value);
            return (
              <g key={i}>
                <line
                  x1={padLeft}
                  x2={padLeft + plotW}
                  y1={gy}
                  y2={gy}
                  className="stroke-fg/8"
                  strokeWidth={1}
                  vectorEffect="non-scaling-stroke"
                />
                <text
                  x={padLeft - 9}
                  y={gy + 4}
                  textAnchor="end"
                  className="fill-fg-muted text-[10.5px] font-semibold"
                >
                  {format(Math.round(value))}
                </text>
              </g>
            );
          })}

          <path
            d={`${d}L${padLeft + plotW},${padTop + plotH}L${padLeft},${padTop + plotH}Z`}
            fill={`url(#${gradientId})`}
          />
          <path
            d={d}
            fill="none"
            className="stroke-accent"
            strokeWidth={2.5}
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />

          {active !== null && (
            <g>
              <circle cx={cx(active)} cy={y(series[active]!)} r={8} className="fill-surface" />
              <circle cx={cx(active)} cy={y(series[active]!)} r={5} className="fill-accent" />
            </g>
          )}

          {labels?.map((text, i) =>
            i % labelEvery === 0 || i === labels.length - 1 ? (
              <text
                key={`${text}-${i}`}
                x={cx(i)}
                y={height - 4}
                textAnchor={i === 0 ? "start" : i === labels.length - 1 ? "end" : "middle"}
                className="fill-fg-muted text-[10.5px] font-semibold"
              >
                {text}
              </text>
            ) : null,
          )}
        </svg>

        {/* The readout rides above the marker. Positioned in percent so it
            tracks the SVG's own scaling rather than a pixel guess. */}
        {active !== null && (
          <div
            className="bg-accent text-accent-fg pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-sm px-2 py-1 text-[12px] font-bold tabular-nums shadow-e2"
            style={{
              left: `${(cx(active) / W) * 100}%`,
              top: `${(y(series[active]!) / height) * 100 - 4}%`,
            }}
          >
            {format(series[active]!)}
          </div>
        )}
      </div>

      <figcaption className="sr-only">
        {label}
        <table>
          <tbody>
            {series.map((value, i) => (
              <tr key={i}>
                <th scope="row">{labels?.[i] ?? `Point ${i + 1}`}</th>
                <td>{format(value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </figcaption>
    </figure>
  );
}
