/**
 * IconTile — a filled rounded square holding one glyph.
 *
 * The marker that identifies what a KPI card is counting, or what a row is
 * about. Filled and saturated, with white ink, so it reads at a glance from
 * across a wall display without being a status: an IconTile says "this is the
 * alerts number", never "the alerts number is bad". Rank and state belong to
 * CX-STA; this is identity.
 *
 * The tone is a LABEL, not a rank: two cards tinted amber and azure are not
 * being ranked against each other. But they draw from the SAME palette as
 * everything else that states meaning — the shared `Tone` vocabulary — because
 * the alternative, a private set of semantic tokens, is what let a tile and a
 * meter bar that both meant "medium" render as two different blues. Position
 * in a ladder is what carries rank; a colour on its own does not.
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
        crit: "bg-sev-crit",
        high: "bg-sev-high",
        med: "bg-sev-med",
        low: "bg-sev-low",
        ok: "bg-sev-info",
        violet: "bg-violet",
        neutral: "bg-surface-3 text-fg",
      },
      size: {
        /** 24px. A leading marker on a MeterRow, where 36 would dominate. */
        xs: "size-6 rounded-[8px] [&_svg]:size-3.5",
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
