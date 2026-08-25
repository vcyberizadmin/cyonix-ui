/**
 * CX-CRD — the grouping primitive.
 *
 * Deliberately has NO "use client" directive. Card holds no state and no event
 * handlers, so it stays in the server graph and can be rendered by a Server
 * Component without pulling the React runtime into the client bundle. This also
 * serves as a live assertion that the build preserves per-file client
 * boundaries — see scripts/preserve-directives.mjs.
 *
 * Brand rules encoded here:
 *  · radius-md, hairline border, surface fill, and NO SHADOW AT REST.
 *    Elevation belongs to overlays (menu e-2, drawer e-3, modal e-4); a card
 *    that carries a shadow competes with them.
 *  · The header bar sits on the wash and is separated by a hairline. Groups
 *    separate by hairline, never by space alone.
 *  · A nested card steps DOWN to the ground colour, so nesting reads without a
 *    second border weight.
 *  · Never nest more than one level — past that, use CX-SET.
 */
import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "./lib/cn.js";

const card = cva("rounded-xl border border-rule", {
  variants: {
    /** Nested cards step down to the ground colour. One level only. */
    nested: {
      false: "bg-surface",
      true: "bg-bg",
    },
  },
  defaultVariants: { nested: false },
});

const body = cva("", {
  variants: {
    padding: {
      none: "",
      sm: "p-4",
      md: "p-6",
      lg: "p-8",
    },
  },
  defaultVariants: { padding: "md" },
});

export interface CardProps
  // `title` is deliberately shadowed: it carries the header text, not the
  // native tooltip attribute. Consumers needing a real tooltip should wrap.
  extends Omit<HTMLAttributes<HTMLDivElement>, "title">,
    VariantProps<typeof card>,
    VariantProps<typeof body> {
  /** Renders the header bar. Without it the card is a plain bordered group. */
  title?: ReactNode;
  /** Right-aligned qualifier in the header — removes most inline explanatory
   *  paragraphs. Requires `title`. */
  hint?: ReactNode;
  /** Actions slot in the header, right of the hint. */
  actions?: ReactNode;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { className, nested, padding, title, hint, actions, children, ...props },
  ref,
) {
  return (
    <div ref={ref} className={cn(card({ nested }), className)} {...props}>
      {title ? (
        <div className="border-rule bg-wash-1 flex items-center justify-between gap-4 border-b px-6 py-3">
          <h3 className="font-display text-h3 font-semibold">{title}</h3>
          <div className="flex items-center gap-3">
            {hint ? <span className="text-fg-2 text-small">{hint}</span> : null}
            {actions}
          </div>
        </div>
      ) : null}
      <div className={cn(body({ padding }))}>{children}</div>
    </div>
  );
});
