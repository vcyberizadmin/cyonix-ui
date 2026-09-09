/**
 * RecordCard — one case, alert or incident as a card.
 *
 * The card half of the card/table pair a triage queue needs: a card when you
 * are reading a handful, a table when you are scanning many. Both show the same
 * record, so this deliberately takes the same pieces a table row would and
 * arranges them for reading rather than for comparison.
 *
 * Anatomy, top to bottom:
 *  · A severity bar down the left edge, stretched to the card. Ranked, so it is
 *    the bar and never a dot — see CX-STA on the shape that separates ranked
 *    from semantic.
 *  · A meta row of tags: tenant, id, severity, status. A `flag` pushes to the
 *    right on anything wider than a phone, so "action required" reads as the
 *    card's verdict rather than as one more tag in the pile.
 *  · The title, which is the only thing at full weight.
 *  · A footer of facts, wrapping, with a bar allowed to take the remaining
 *    width — an SLA meter earns that space; nothing else does.
 *
 * `needsAction` rings the card rather than tinting it. A tint would compete
 * with the severity bar for the same job; a ring reads as "this one is waiting
 * on you" without claiming a rank.
 *
 * Server-safe: no state, no directive. `onOpen` makes it a button, which is
 * what a whole-card click target has to be.
 */
import type { ReactNode } from "react";
import { cn } from "./lib/cn.js";
import { SEVERITY_META, type Severity } from "./lib/status.js";

export interface RecordCardProps {
  /** Ranks the record, and paints the left bar. */
  severity: Severity;
  title: ReactNode;
  /** Tags identifying the record: tenant, id, status. Rendered in order. */
  meta?: ReactNode;
  /**
   * Pushed to the right of the meta row above phone width. For the one verdict
   * that outranks the rest — "action required", "escalated". Not a third
   * status.
   */
  flag?: ReactNode;
  /** Facts below the title: owner, counts, timestamps, an SLA meter. */
  footer?: ReactNode;
  /** Rings the card. Use for "waiting on a human", not for severity. */
  needsAction?: boolean;
  /** Whole-card click target. Renders a chevron when present. */
  onOpen?: () => void;
  className?: string;
}

export function RecordCard({
  severity,
  title,
  meta,
  flag,
  footer,
  needsAction,
  onOpen,
  className,
}: RecordCardProps) {
  const Root = onOpen ? "button" : "div";

  return (
    <Root
      {...(onOpen ? { type: "button" as const, onClick: onOpen } : {})}
      className={cn(
        "bg-surface rounded-xl p-5 text-left",
        onOpen && "hover:bg-surface-2 duration-instant ease-brand w-full cursor-pointer transition-colors",
        // A 22% orange inset ring. Inset so it does not grow the card's box
        // and cannot be clipped by a neighbouring card in a tight grid.
        needsAction &&
          "shadow-[inset_0_0_0_1.5px_color-mix(in_srgb,var(--accent)_22%,transparent)]",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className={cn(
            "w-1.5 shrink-0 self-stretch rounded-full",
            SEVERITY_META[severity].bar,
          )}
        />

        <div className="min-w-0 flex-1">
          {(meta || flag) && (
            <div className="flex flex-wrap items-center gap-2">
              {meta}
              {flag && <span className="shrink-0 sm:ml-auto">{flag}</span>}
            </div>
          )}

          <h3
            className={cn(
              "text-[16.5px] leading-snug font-extrabold tracking-tight",
              (meta || flag) && "mt-2",
            )}
          >
            {title}
          </h3>

          {footer && (
            <div className="text-fg-2 mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] font-semibold">
              {footer}
            </div>
          )}
        </div>

        {onOpen && (
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-fg-muted size-[18px] shrink-0"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
        )}
      </div>
    </Root>
  );
}
