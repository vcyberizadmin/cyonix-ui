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
 * Two orientations, because the console genuinely has two shapes and only one
 * was here:
 *
 *  · `stacked` (default) is the widget row — a name, a figure, a bar beneath.
 *  · `inline` is the SLA readout, and it is not a stacked row squashed. The bar
 *    and its text share one line, the bar is 6px rather than 8px, and there is
 *    no visible label at all: it appears inside a facts strip that has already
 *    said what it is ("You · opened by … · 18 Aug 12:44 · [====] 2h 43m left").
 *    Forcing the stacked form here meant passing `label=""`, which reserved a
 *    line for nothing and left a full-width bar with its figure adrift.
 *
 * `label` is required in both, but in `inline` it becomes the accessible name
 * instead of visible text — the bar still has to say what it measures to anyone
 * who cannot see the strip around it.
 *
 * Server-safe: no state, no directive.
 */
import type { ReactNode } from "react";
import { TONE_BG, type Tone } from "./lib/status.js";
import { cn } from "./lib/cn.js";

/** Bar fills, from the shared vocabulary. */
export type MeterTone = Tone;

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
  /**
   * `stacked` puts the label and figure above the bar; `inline` runs the bar and
   * its figure along one line and hides the label. See the note above.
   */
  orientation?: "stacked" | "inline";
  /** Native tooltip — the console hangs the SLA target off the inline form. */
  title?: string;
  className?: string;
}

export function MeterRow({
  label,
  value,
  fraction,
  tone = "accent",
  icon,
  orientation = "stacked",
  title,
  className,
}: MeterRowProps) {
  const pct = Math.max(0, Math.min(1, fraction)) * 100;

  /**
   * The bar itself, identical in both orientations apart from its height.
   *
   * `role="progressbar"` belongs on the track, not the wrapper: the value is
   * what the track expresses, and a wrapper carrying the role would also
   * swallow the figure beside it into the announcement. `aria-label` falls back
   * to the visible label in the stacked form, where the text is already there,
   * and carries it in the inline form, where it is the only name the bar has.
   */
  const bar = (
    <span
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={orientation === "inline" && typeof label === "string" ? label : undefined}
      className={cn(
        "bg-track block w-full overflow-hidden rounded-full",
        orientation === "inline" ? "h-1.5 flex-1" : "h-2",
      )}
    >
      <span
        className={cn(
          "ease-brand block h-full rounded-full transition-[width] duration-emphasis",
          TONE_BG[tone],
        )}
        style={{ width: `${pct}%` }}
      />
    </span>
  );

  if (orientation === "inline") {
    return (
      <span
        title={title}
        className={cn("flex min-w-0 items-center gap-2.5", className)}
      >
        {icon}
        {bar}
        {value !== undefined && (
          <span className="text-fg-2 shrink-0 text-[12px] font-medium tabular-nums whitespace-nowrap">
            {value}
          </span>
        )}
      </span>
    );
  }

  return (
    <div title={title} className={cn("min-w-0", className)}>
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
      {bar}
    </div>
  );
}
