/**
 * MeterRow — a labelled bar: what it is, what it measures, how far along.
 *
 * The console's most repeated shape. False positives by source, alerts assigned
 * per analyst, what each agent has run — all three are a name on the left, a
 * figure on the right, and a bar underneath, and all three were being rebuilt by
 * hand because nothing here fitted:
 *
 *  · `RankedBars` owns its own caption (a computed share) and its own colour
 *    (a ramp position). These rows need "34% of 486" and "1,240 · 2.1s avg",
 *    and a colour that means something — a source past a tuning threshold,
 *    an unassigned queue.
 *  · `ProportionBar` splits ONE total into segments. This is one value against
 *    a maximum, which is a different question.
 *
 * So the caption is a node and the tone is explicit. That is the whole point:
 * this component decides layout, and the caller decides meaning.
 *
 * `fraction` is clamped, because a meter that overshoots its track is a data
 * bug rendering as a layout bug, and the layout should not be what breaks.
 *
 * Server-safe: no state, no directive.
 */
import type { ReactNode } from "react";
import { cn } from "./lib/cn.js";

/** Bar fills. Ranked marks plus the brand, for a meter that IS the accent. */
export type MeterTone =
  | "accent"
  | "crit"
  | "high"
  | "med"
  | "low"
  | "ok"
  | "violet";

const TONE_FILL: Record<MeterTone, string> = {
  accent: "bg-accent",
  crit: "bg-sev-crit",
  high: "bg-sev-high",
  med: "bg-sev-med",
  low: "bg-sev-low",
  ok: "bg-sev-info",
  violet: "bg-violet",
};

export interface MeterRowProps {
  label: ReactNode;
  /**
   * The figure on the right, as a node rather than a number: the console shows
   * "34% of 486" here, and "1,240 · 2.1s avg", neither of which a component
   * could derive from `fraction`.
   */
  value?: ReactNode;
  /** 0 to 1. Clamped. */
  fraction: number;
  tone?: MeterTone;
  /** A leading marker, typically an `IconTile size="xs"`. */
  icon?: ReactNode;
  className?: string;
}

export function MeterRow({
  label,
  value,
  fraction,
  tone = "accent",
  icon,
  className,
}: MeterRowProps) {
  const pct = Math.max(0, Math.min(1, fraction)) * 100;

  return (
    <div className={cn("min-w-0", className)}>
      <div className="mb-1.5 flex items-center gap-2">
        {icon}
        {/* items-center with an icon, items-baseline without: a 24px tile
            beside a 13px label wants centring, but two runs of text want
            their baselines to agree. */}
        <span className="min-w-0 flex-1 truncate text-[13px] font-bold">
          {label}
        </span>
        {value !== undefined && (
          <span className="text-fg-2 shrink-0 text-[12px] font-semibold tabular-nums">
            {value}
          </span>
        )}
      </div>
      <span className="bg-track block h-2 w-full overflow-hidden rounded-full">
        <span
          className={cn("ease-brand block h-full rounded-full transition-[width] duration-emphasis", TONE_FILL[tone])}
          style={{ width: `${pct}%` }}
        />
      </span>
    </div>
  );
}
