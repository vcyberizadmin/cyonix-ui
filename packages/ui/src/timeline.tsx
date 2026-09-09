/**
 * Timeline — what happened, in order, with a thread running through it.
 *
 * The console repeats this shape wherever a sequence needs explaining: the
 * steps an agent ran, the events that led to an alert, the actions taken on a
 * case. Each entry is a marker in a threaded column, a title with its timestamp
 * beside it, and a line of detail underneath.
 *
 * THE LAST ENTRY IS THE EMPHASISED ONE, not the first. That is deliberate and
 * worth stating because it inverts the usual reading: these lists run oldest to
 * newest, so the bottom entry is the current state — what the agent concluded,
 * where the intrusion got to. Everything above it is history, and history takes
 * the neutral marker. Pass a `tone` on an entry to override.
 *
 * The thread stops at the last marker rather than running past it, so the
 * column reads as finished rather than truncated.
 *
 * Server-safe: no state, no directive.
 */
import type { ReactNode } from "react";
import { cn } from "./lib/cn.js";
import { TONE_BG, type Tone } from "./lib/status.js";

export interface TimelineItem {
  title: ReactNode;
  /** Timestamp or duration, set in mono beside the title. */
  time?: ReactNode;
  description?: ReactNode;
  /** Marker glyph. Sized by the timeline. */
  icon?: ReactNode;
  /**
   * Overrides the default emphasis, which falls on the last entry alone. Use
   * it when the sequence is not chronological, or when more than one entry
   * genuinely matters.
   */
  tone?: Tone;
}

export interface TimelineProps {
  items: TimelineItem[];
  /**
   * `sm` for a sequence nested inside another panel — an agent's steps inside
   * its own card. `md` for one that is the panel.
   */
  size?: "sm" | "md";
  /** The emphasised entry's fill. Defaults to the brand. */
  tone?: Tone;
  className?: string;
}

const SIZING = {
  sm: {
    marker: "size-7 rounded-[9px] [&_svg]:size-3.5",
    title: "text-[13.5px]",
    time: "text-[11px]",
    body: "text-[12.5px]",
    pad: "pb-4",
  },
  md: {
    marker: "size-9 rounded-[11px] [&_svg]:size-4",
    title: "text-[14px]",
    time: "text-[11px]",
    body: "text-[13px]",
    pad: "pb-5",
  },
} as const;

export function Timeline({
  items,
  size = "md",
  tone = "accent",
  className,
}: TimelineProps) {
  const s = SIZING[size];

  return (
    <ol className={cn("space-y-1", className)}>
      {items.map((item, index) => {
        const last = index === items.length - 1;
        const emphasis = item.tone ?? (last ? tone : undefined);

        return (
          <li key={index} className="flex gap-3.5">
            <div className="flex shrink-0 flex-col items-center">
              <span
                aria-hidden="true"
                className={cn(
                  "grid shrink-0 place-items-center",
                  s.marker,
                  emphasis
                    ? cn(TONE_BG[emphasis], "text-white")
                    : "bg-surface-3 text-fg",
                )}
              >
                {item.icon}
              </span>
              {/* No thread below the last marker: the column should read as
                  finished, not cut off. */}
              {!last && (
                <span
                  aria-hidden="true"
                  className="bg-thread my-1 w-px flex-1"
                />
              )}
            </div>

            <div className={cn("min-w-0", !last && s.pad)}>
              <p className="flex flex-wrap items-baseline gap-2.5">
                <span className={cn("font-extrabold", s.title)}>
                  {item.title}
                </span>
                {item.time && (
                  <span
                    className={cn(
                      "text-fg-2 font-mono font-semibold",
                      s.time,
                    )}
                  >
                    {item.time}
                  </span>
                )}
              </p>
              {item.description && (
                <p className={cn("text-fg-2 mt-1 font-medium", s.body)}>
                  {item.description}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
