/**
 * CX-HDR — PageHeader and Breadcrumb. Server-safe: pure presentation, no state.
 *
 * Tenant's primitives win because they are real primitives — correct
 * `aria-label="Breadcrumb"` and `aria-current` — where SOC and VAPT inline the
 * same markup on every page. VAPT adds the eyebrow kicker.
 *
 * Rules encoded here:
 *  · Eyebrow 11px mono uppercase in orange. Title in display at 30px, -0.02em.
 *    Meta line 14px secondary.
 *  · Actions right-aligned, WRAPPING under the title below 640px — never
 *    truncating. A hidden action is worse than a wrapped one.
 *  · Exactly one primary button; everything else is solid or ghost.
 *  · The last crumb is TEXT, not a link — enforced below rather than left to
 *    the caller.
 *  · The FR chip is internal metadata and hides in customer-facing builds.
 *
 * Eyebrow and breadcrumb together can be redundant on a shallow route. Use one.
 */
import type { ElementType, ReactNode } from "react";
import { cn } from "../lib/cn.js";

export interface Crumb {
  label: ReactNode;
  /** Every crumb should navigate — a decorative trail is worse than none.
   *  Ignored on the last crumb, which is the current page. */
  href?: string;
}

export interface BreadcrumbProps {
  items: Crumb[];
  /** Defaults to `a`; apps pass `next/link`. */
  linkComponent?: ElementType;
  className?: string;
}

export function Breadcrumb({ items, linkComponent, className }: BreadcrumbProps) {
  const Link = (linkComponent ?? "a") as ElementType;

  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex flex-wrap items-center gap-1.5 text-[12px]">
        {items.map((crumb, index) => {
          const last = index === items.length - 1;
          return (
            <li key={index} className="flex items-center gap-1.5">
              {index > 0 && (
                <span aria-hidden="true" className="text-fg-muted select-none">
                  /
                </span>
              )}
              {/* The current page is text, never a link — even if an href was
                  supplied. A link to where you already are is noise. */}
              {last || !crumb.href ? (
                <span
                  aria-current={last ? "page" : undefined}
                  className={last ? "text-fg-2" : "text-fg-muted"}
                >
                  {crumb.label}
                </span>
              ) : (
                <Link
                  href={crumb.href}
                  className="text-fg-muted hover:text-fg duration-instant ease-brand transition-colors"
                >
                  {crumb.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export interface PageHeaderProps {
  /** Section context. Skip it when the breadcrumb already says this. */
  eyebrow?: string;
  title: ReactNode;
  /** Requirement trace. Internal only — see `showInternal`. */
  fr?: string;
  /** IDs, owner, plan. */
  meta?: ReactNode;
  /** Cap at three controls; exactly one of them primary. */
  actions?: ReactNode;
  breadcrumb?: Crumb[];
  linkComponent?: ElementType;
  /** Set false in a customer-facing build to hide the FR chip. */
  showInternal?: boolean;
  className?: string;
}

export function PageHeader({
  eyebrow,
  title,
  fr,
  meta,
  actions,
  breadcrumb,
  linkComponent,
  showInternal = true,
  className,
}: PageHeaderProps) {
  return (
    <header className={cn("flex flex-col gap-3", className)}>
      {breadcrumb && breadcrumb.length > 0 && (
        <Breadcrumb items={breadcrumb} linkComponent={linkComponent} />
      )}

      {/* Wraps below 640px rather than truncating the action row. */}
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div className="flex min-w-0 flex-col gap-1">
          {eyebrow && (
            <span className="text-accent-ink font-mono text-[11px] font-semibold tracking-[0.1em] uppercase">
              {eyebrow}
            </span>
          )}

          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="font-display text-fg text-h2 font-bold tracking-[-0.02em]">
              {title}
            </h1>
            {fr && showInternal && (
              <span
                title="Internal requirement reference"
                className="border-rule bg-wash-2 text-fg-2 shrink-0 rounded-sm border px-1.5 py-0.5 font-mono text-[10px]"
              >
                {fr}
              </span>
            )}
          </div>

          {meta && <p className="text-fg-2 text-[14px]">{meta}</p>}
        </div>

        {actions && (
          // Fixed top-right across every page, so muscle memory holds.
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {actions}
          </div>
        )}
      </div>
    </header>
  );
}
