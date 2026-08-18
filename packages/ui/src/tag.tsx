/**
 * CX-TAG — Tag and ChipStack. Neutral labels: module names, permission codes,
 * versions, IDs.
 *
 * Server-safe: no state, no directive. A caller inside a client boundary can
 * still pass `onClick`.
 *
 * THE TRAP, stated plainly by the standard: a Tag looks close enough to a
 * StatusPill that misuse is likely without review. A Tag labels a
 * NON-STATUS attribute. If the thing has a state, it wants CX-STA instead.
 *
 * Dots take the CATEGORICAL ramp, never the severity ladder — a module is not
 * ranked, and borrowing the severity hues would imply it is.
 */
import { cva, type VariantProps } from "class-variance-authority";
import type { ReactNode } from "react";
import { CATEGORICAL } from "./lib/status.js";
import { cn } from "./lib/cn.js";

/** 1-based index into the categorical ramp. */
export type CategoricalIndex = 1 | 2 | 3 | 4 | 5 | 6;

const tag = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium whitespace-nowrap",
  {
    variants: {
      // A tag is a label, not a control — unless it filters, and then it must
      // LOOK clickable rather than merely be clickable.
      interactive: {
        false: "border-rule bg-wash-2 text-fg-2",
        // A resting-state difference, not just a hover one: a hover-only
        // affordance is invisible until the cursor is already on it, which does
        // not satisfy "must look clickable". Stronger hairline + primary ink.
        true: "border-fg-muted/45 bg-wash-2 text-fg hover:border-accent/60 hover:bg-wash-3 duration-instant ease-brand cursor-pointer transition-colors",
      },
    },
    defaultVariants: { interactive: false },
  },
);

export interface TagProps extends VariantProps<typeof tag> {
  children: ReactNode;
  /** Identity dot from the categorical ramp, so a module is recognisable
   *  without reading it. Needs a legend somewhere or the dots are decoration. */
  dot?: CategoricalIndex;
  /** Present only when the tag filters something. */
  onClick?: () => void;
  title?: string;
  className?: string;
}

export function Tag({ children, dot, onClick, title, className }: TagProps) {
  const interactive = onClick !== undefined;
  const content = (
    <>
      {dot && (
        <span
          aria-hidden="true"
          className={cn("size-1.5 shrink-0 rounded-full", CATEGORICAL[dot - 1])}
        />
      )}
      {children}
    </>
  );

  if (interactive) {
    return (
      <button
        type="button"
        onClick={onClick}
        title={title}
        className={cn(tag({ interactive: true }), className)}
      >
        {content}
      </button>
    );
  }

  return (
    <span title={title} className={cn(tag({ interactive: false }), className)}>
      {content}
    </span>
  );
}

export interface ChipStackItem {
  label: ReactNode;
  dot?: CategoricalIndex;
  onClick?: () => void;
}

export interface ChipStackProps {
  items: ChipStackItem[];
  /** Show at most this many; the rest collapse to +n. Keeps a dense table cell
   *  legible where a full list of names would not fit. */
  max?: number;
  className?: string;
}

export function ChipStack({ items, max = 3, className }: ChipStackProps) {
  const shown = items.slice(0, max);
  const rest = items.slice(max);

  return (
    // NOWRAP, deliberately. In a table cell a wrapping chip stack grows the row,
    // and the standard is explicit that "chip stacks need a +n overflow rather
    // than growth". Set `max` to suit the column width.
    <span
      className={cn(
        "inline-flex min-w-0 flex-nowrap items-center gap-1.5 overflow-hidden",
        className,
      )}
    >
      {shown.map((item, index) => (
        <Tag key={index} dot={item.dot} onClick={item.onClick}>
          {item.label}
        </Tag>
      ))}
      {rest.length > 0 && (
        // The remainder on hover, so nothing is truly hidden.
        <Tag
          title={rest
            .map((item) => (typeof item.label === "string" ? item.label : "…"))
            .join(", ")}
        >
          +{rest.length}
        </Tag>
      )}
    </span>
  );
}
