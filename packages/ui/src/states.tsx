/**
 * CX-STE — EmptyState and ErrorState.
 *
 * Server-safe. All of these render INSIDE the container they describe and never
 * replace the page — an empty table body stays inside the table's card.
 *
 * The standard's headline claim for this component: it "removes the commonest
 * source of dead-end screens". That only holds if the copy does its job, which
 * is why the API refuses to let you skip the distinction below.
 */
import type { ReactNode } from "react";
import { cn } from "./lib/cn.js";

export interface EmptyStateProps {
  /**
   * REQUIRED, deliberately. The standard: distinguish "nothing exists yet"
   * (offer creation) from "nothing matches" (offer to clear the filter that
   * caused it). A single generic empty state is the dead end being removed, so
   * this is a discriminator rather than an optional flag.
   */
  variant: "empty" | "filtered";
  title: ReactNode;
  /** The next useful action, in words. Never just "no data". */
  description?: ReactNode;
  /** For `empty`, a create control. For `filtered`, clear-the-filter. */
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
}

export function EmptyState({
  variant,
  title,
  description,
  action,
  icon,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 px-6 py-12 text-center",
        className,
      )}
      data-variant={variant}
    >
      {icon && (
        <span className="text-fg-muted [&_svg]:size-6" aria-hidden="true">
          {icon}
        </span>
      )}
      <div className="flex flex-col gap-1">
        <p className="font-display text-fg text-[15px] font-semibold">{title}</p>
        {description && (
          <p className="text-fg-2 text-small mx-auto max-w-sm">{description}</p>
        )}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}

export interface ErrorStateProps {
  /** What failed. No apologies. */
  title: ReactNode;
  /** What to do about it. No stack traces. */
  description?: ReactNode;
  /** Correlation ID, so support can find the request. */
  correlationId?: string;
  /** Retry, in place — not a page reload. */
  action?: ReactNode;
  className?: string;
}

export function ErrorState({
  title,
  description,
  correlationId,
  action,
  className,
}: ErrorStateProps) {
  return (
    // Danger tone on the LEFT RULE ONLY. A full red panel reads as a page-level
    // failure when this is a container-level one.
    <div
      role="alert"
      className={cn(
        "border-rule border-danger bg-wash-1 flex flex-col gap-3 rounded-sm border border-l-2 px-5 py-4",
        className,
      )}
    >
      <div className="flex flex-col gap-1">
        <p className="text-fg text-[13px] font-semibold">{title}</p>
        {description && <p className="text-fg-2 text-small">{description}</p>}
      </div>
      {(correlationId || action) && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          {correlationId ? (
            <span className="text-fg-muted font-mono text-[11px]">
              Ref {correlationId}
            </span>
          ) : (
            <span />
          )}
          {action}
        </div>
      )}
    </div>
  );
}
