/**
 * IconTile — a filled rounded square holding one glyph.
 *
 * The marker that identifies what a KPI card is counting, or what a row is
 * about. Filled and saturated, with white ink, so it reads at a glance from
 * across a wall display without being a status: an IconTile says "this is the
 * alerts number", never "the alerts number is bad". Rank and state belong to
 * CX-STA; this is identity.
 *
 * Which means the tone is a LABEL, not a severity. Two cards tinted amber and
 * azure are not being ranked against each other, and reusing the severity hues
 * here would imply they were — so the tones name their intent (`info`, `ai`,
 * `neutral`) rather than borrowing the ladder.
 *
 * Server-safe: no state, no directive.
 */
import { cva, type VariantProps } from "class-variance-authority";
import type { ReactNode } from "react";
import { cn } from "./lib/cn.js";

const tile = cva(
  // White ink on every tone. Each fill below is a saturated mark, and none of
  // them carries dark text — see the --accent-fg argument in theme.css for the
  // same problem on the brand orange.
  "grid shrink-0 place-items-center text-white",
  {
    variants: {
      tone: {
        accent: "bg-accent",
        ok: "bg-ok",
        warning: "bg-warning",
        danger: "bg-danger",
        info: "bg-info",
        /** Amethyst, and only for agent output. The ramp is reserved. */
        ai: "bg-ai",
        neutral: "bg-surface-3 text-fg",
      },
      size: {
        /** 36px. What a KPI card's header uses, beside the label. */
        sm: "size-9 rounded-[11px] [&_svg]:size-[18px]",
        /** 42px. The default, for a row or a panel header. */
        md: "size-[42px] rounded-[13px] [&_svg]:size-[22px]",
      },
    },
    defaultVariants: { tone: "accent", size: "md" },
  },
);

export interface IconTileProps extends VariantProps<typeof tile> {
  /** The glyph. Sized by the tile, so pass it unsized. */
  children: ReactNode;
  /**
   * What the tile identifies, for a screen reader. Omit ONLY when an adjacent
   * label already says it — which in a KPI card it does, so the tile is
   * decoration there and correctly silent.
   */
  label?: string;
  className?: string;
}

export function IconTile({
  children,
  tone,
  size,
  label,
  className,
}: IconTileProps) {
  return (
    <span
      {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": "true" })}
      className={cn(tile({ tone, size }), className)}
    >
      {children}
    </span>
  );
}
