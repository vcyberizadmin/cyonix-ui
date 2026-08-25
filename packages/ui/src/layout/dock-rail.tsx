"use client";

import { Fragment, type ElementType, type ReactNode } from "react";
import { cn } from "../lib/cn.js";

/**
 * CX-DCK — the floating dock rail.
 *
 * The SOC console's navigation, generalised. It is a SIBLING of CX-NAV, not a
 * replacement: CX-NAV is a flush, groupable, click-collapsed sidebar for
 * consoles with deep navigation; this is a flat, icon-first dock for consoles
 * whose whole surface fits in four or five destinations.
 *
 * What makes it a different component rather than a variant
 * ---------------------------------------------------------
 *  · It FLOATS. The panel is absolutely positioned inside a fixed-width gutter
 *    and expands OVER the content on hover, so the gutter never changes and
 *    nothing reflows when the pointer crosses the rail. CX-NAV's collapse
 *    resizes the grid; this one deliberately does not.
 *  · Expansion is HOVER, not a click, and therefore carries no persisted
 *    state — there is nothing for a user to set and nothing to remember.
 *  · Below `xl` it becomes a horizontal dock pinned to the bottom of the
 *    viewport, not a drawer. Thumb-reachable, always visible, no trigger.
 *  · Nesting is not supported AT ALL, by type. A dock with sub-items is a
 *    sidebar wearing the wrong clothes; reach for `NavRail` instead.
 *
 * Brand rules encoded here, same as CX-NAV:
 *  · Orange appears in exactly ONE place at a time — the current location.
 *    The rail surface is neutral in both themes and hover is a neutral wash,
 *    so "where I am" never competes with "where my cursor is".
 *  · Active is the accent ink tab welded to the rail's edge, plus accent text.
 *  · A count that needs attention takes the danger tone, never orange.
 *
 * Framework-agnostic by design, for the same reasons as CX-NAV: it takes
 * `activeHref` as a prop rather than calling `usePathname()`, and renders links
 * through `linkComponent`.
 *
 * Accessibility notes
 * -------------------
 *  · Labels are visually collapsed, never removed, and each link carries an
 *    `aria-label`. A screen reader reads the destination whatever the width.
 *  · Expansion is bound to `focus-within` as well as `hover`, so tabbing
 *    through the rail reveals the labels a mouse user gets for free.
 *  · The reduced-motion rule in the theme's base layer collapses every
 *    transition below, so no `motion-safe` guard is needed at the call site.
 */

/** A destination. Deliberately has no `children` — see the header. */
export interface DockItem {
  label: string;
  href: string;
  /** Supplied by the app — usually a lucide icon. */
  icon?: ReactNode;
  /** Swapped in when the item is current, typically the filled variant of
   *  `icon`. Falls back to `icon`, so it is optional. */
  activeIcon?: ReactNode;
  /** Count rendered as a badge on the icon's top-right corner. `0` and
   *  `undefined` both render nothing — an empty queue needs no badge. */
  count?: number;
  /** `alert` renders the badge in the danger tone. Never orange — orange is
   *  reserved for location and primary action. */
  countTone?: "default" | "alert";
}

export interface DockRailProps {
  items: DockItem[];
  /** The app supplies this, typically from `usePathname()`. */
  activeHref?: string;
  /** Brand block, shown while the rail is expanded. Hidden below `xl`, where
   *  the top bar carries the mark instead. */
  brand?: ReactNode;
  /** Brand block, shown while the rail is collapsed. Both are mounted at once
   *  and crossfaded, so they must occupy the same optical position. */
  brandMini?: ReactNode;
  /** Where the brand links to. Omit to render the lockup unlinked. */
  brandHref?: string;
  /** Pinned to the foot of the rail above `xl` — the module badge in the SOC
   *  console ("SOC", "VAPT"). Hidden in the mobile dock, which has no room. */
  footer?: ReactNode;
  /**
   * The primary action, as the FAB lifted out of the mobile dock's midpoint.
   *
   * DOCK ONLY — nothing renders above `xl`. The expanded rail is a column of
   * destinations, and a button sitting among them reads as one more place to
   * go. On a wide screen the primary action belongs in the console bar, where
   * there is room to label it; the FAB exists because the dock has no such
   * room and a thumb needs a target.
   */
  action?: ReactNode;
  /** Accessible name for `action`. */
  actionLabel?: string;
  /** Link implementation. Defaults to `a`; apps pass `next/link`. */
  linkComponent?: ElementType;
  /** Accessible name for the landmark. Set it if a page has two navs. */
  ariaLabel?: string;
  className?: string;
}

/**
 * The collapse mechanics, shared by the item label and `DockReveal` so the two
 * can never drift apart. Type styling is deliberately NOT included — each
 * caller sets its own, exactly as the source does: 14.5px for a nav label,
 * 16px for the module badge.
 */
const REVEAL =
  "duration-standard ease-brand max-w-0 overflow-hidden whitespace-nowrap opacity-0 transition-[max-width,opacity] xl:group-hover/dock:max-w-[150px] xl:group-hover/dock:opacity-100 xl:group-focus-within/dock:max-w-[150px] xl:group-focus-within/dock:opacity-100";

export interface DockRevealProps {
  children: ReactNode;
  className?: string;
}

/**
 * Text that collapses with the rail.
 *
 * Exists for the module badge, which does something subtler than showing and
 * hiding: the "S" of "SOC" stays visible at 76px and only the "OC" is revealed,
 * so the badge reads as one letter collapsed and the whole word expanded rather
 * than appearing out of nothing.
 *
 *     footer={<>S<DockReveal>OC</DockReveal></>}
 *
 * Only meaningful inside a `DockRail` — it keys off that component's group.
 */
export function DockReveal({ children, className }: DockRevealProps) {
  return <span className={cn(REVEAL, className)}>{children}</span>;
}

/** Where the FAB slots into the mobile dock: after this many items. Splitting
 *  four items 2/2 is what puts the action at the true centre. */
function splitPoint(count: number) {
  return Math.ceil(count / 2);
}

export function DockRail({
  items,
  activeHref,
  brand,
  brandMini,
  brandHref,
  footer,
  action,
  actionLabel = "Primary action",
  linkComponent,
  ariaLabel = "Primary",
  className,
}: DockRailProps) {
  const Link = (linkComponent ?? "a") as ElementType;
  const BrandTag = (brandHref ? Link : "div") as ElementType;
  const mid = splitPoint(items.length);

  return (
    <aside
      className={cn(
        // Below xl: a floating dock pinned to the bottom of the viewport.
        // At xl: an in-flow gutter of a FIXED width, which is the whole point —
        // the panel inside it grows on hover without the content column moving.
        "fixed inset-x-0 bottom-0 z-50 p-4",
        "xl:relative xl:inset-auto xl:z-auto xl:w-dock-gutter xl:shrink-0 xl:p-3",
        className,
      )}
    >
      <div
        className={cn(
          "group/dock flex items-center justify-between gap-2 overflow-visible",
          // The panel reads as a floating object below xl, where it sits over
          // scrolling content and needs the shadow to separate. At xl it sits
          // in its own gutter against the page ground, so the shadow goes —
          // and comes back only while expanded, when it IS overlapping again.
          "bg-surface h-17 rounded-[30px] px-3 shadow-e3",
          "xl:h-auto xl:flex-col xl:items-stretch xl:rounded-[28px] xl:px-3.5 xl:py-7 xl:shadow-none",
          // Floating and self-sizing: absolute inside the gutter, inset 12px.
          "xl:absolute xl:top-3 xl:bottom-3 xl:left-3 xl:z-[60] xl:w-dock-rail",
          "xl:hover:w-dock-rail-open xl:hover:shadow-e4",
          "xl:focus-within:w-dock-rail-open xl:focus-within:shadow-e4",
          "xl:duration-standard xl:ease-brand xl:transition-[width,box-shadow]",
        )}
      >
        {/* Both marks are mounted and crossfaded rather than swapped, so the
            glyph never jumps. They are absolutely positioned over one shared
            row for the same reason.

            The timing is asymmetric ON PURPOSE. Closing: the wide lockup is cut
            instantly (0s) so it is never seen shrinking with the rail, and the
            mini mark fades back over 120ms — immediate without popping.
            Opening: the reverse, delayed, so the lockup arrives as the rail
            finishes widening rather than racing it. */}
        {(brand ?? brandMini) && (
          <BrandTag
            {...(brandHref ? { href: brandHref } : {})}
            aria-label="Home"
            className="relative hidden h-12 shrink-0 items-center xl:flex"
          >
            <span className="duration-instant ease-brand absolute top-1/2 left-1.5 -translate-y-1/2 opacity-100 transition-opacity xl:group-hover/dock:opacity-0 xl:group-focus-within/dock:opacity-0">
              {brandMini ?? brand}
            </span>
            <span
              aria-hidden="true"
              className="duration-instant ease-brand pointer-events-none absolute top-1/2 left-1.5 -translate-y-1/2 opacity-0 transition-none xl:group-hover/dock:opacity-100 xl:group-hover/dock:delay-150 xl:group-hover/dock:transition-opacity xl:group-focus-within/dock:opacity-100 xl:group-focus-within/dock:delay-150 xl:group-focus-within/dock:transition-opacity"
            >
              {brand ?? brandMini}
            </span>
          </BrandTag>
        )}

        <nav
          aria-label={ariaLabel}
          className="flex w-full flex-1 items-center justify-around gap-0 xl:my-auto xl:w-auto xl:flex-none xl:flex-col xl:items-stretch xl:justify-center xl:gap-2"
        >
          {items.map((item, index) => {
            const active = item.href === activeHref;
            const showCount = typeof item.count === "number" && item.count > 0;

            return (
              <Fragment key={item.href}>
                {/* Dock only. Above xl this renders nothing at all — see the
                    `action` prop for why the wide rail does not carry it. */}
                {action && index === mid && (
                  <span className="relative w-[58px] shrink-0 self-stretch xl:hidden">
                    <span
                      className="absolute -top-[29px] left-1/2 grid size-[58px] -translate-x-1/2 place-items-center"
                      aria-label={actionLabel}
                    >
                      {action}
                    </span>
                  </span>
                )}

                <Link
                  href={item.href}
                  aria-label={item.label}
                  {...(active ? { "aria-current": "page" } : {})}
                  className={cn(
                    "duration-instant ease-brand relative flex h-12 w-12 items-center rounded-2xl transition-colors xl:w-full",
                    active
                      ? // The dock keeps a wash behind the active icon, because
                        // at 68px tall the edge tab alone is easy to miss. The
                        // xl rail drops it and relies on the tab — one signal,
                        // not two competing.
                        "text-accent-ink bg-wash-2 xl:bg-transparent"
                      : // Hover is feedback, not state: no tab, no orange.
                        "text-fg-2 hover:bg-wash-hover hover:text-fg",
                  )}
                >
                  {/* The ink tab. Under the icon in the dock; welded to the
                      panel's left edge at xl, where -left-3.5 exactly cancels
                      the panel's 14px padding so it meets the edge flush. */}
                  <span
                    aria-hidden="true"
                    className={cn(
                      "bg-accent duration-instant ease-brand absolute -bottom-[7px] left-1/2 h-1 w-5 -translate-x-1/2 rounded-full transition-opacity",
                      "xl:top-1/2 xl:-left-3.5 xl:h-[34px] xl:w-[9px] xl:translate-x-0 xl:-translate-y-1/2 xl:rounded-l-none xl:rounded-r-[9px]",
                      active ? "opacity-100" : "opacity-0",
                    )}
                  />

                  <span className="relative grid size-12 shrink-0 place-items-center [&_svg]:size-[22px]">
                    {(active ? (item.activeIcon ?? item.icon) : item.icon) ??
                      null}

                    {showCount && (
                      // ring-surface, not ring-bg: the badge overhangs the
                      // icon and is punched out of the RAIL, which is --surface.
                      <span
                        className={cn(
                          "ring-surface absolute top-1 right-1 grid h-[17px] min-w-[17px] place-items-center rounded-full px-1 text-[10px] font-extrabold tabular-nums ring-2",
                          item.countTone === "alert"
                            ? "bg-danger-strong text-white"
                            : "bg-wash-3 text-fg",
                        )}
                      >
                        {item.count}
                      </span>
                    )}
                  </span>

                  {/* Collapsed to zero width rather than unmounted, so the
                      accessible name survives and the reveal can animate. */}
                  <span
                    className={cn(
                      REVEAL,
                      "text-[14.5px] font-bold tracking-[-0.01em]",
                    )}
                  >
                    {item.label}
                  </span>
                </Link>
              </Fragment>
            );
          })}

          {/* An action with nowhere to split to (an empty rail) still needs to
              render, or the primary action silently vanishes. */}
          {action && items.length === 0 && (
            <span className="relative w-[58px] shrink-0 self-stretch xl:hidden">
              <span
                className="absolute -top-[29px] left-1/2 grid size-[58px] -translate-x-1/2 place-items-center"
                aria-label={actionLabel}
              >
                {action}
              </span>
            </span>
          )}
        </nav>

        {footer && (
          // A div, not the source's <button>: that button carries no handler
          // and no destination, so as a control it is a focus stop that does
          // nothing. The hover wash goes with it.
          <div className="text-fg-2 hidden h-12 shrink-0 items-center pl-[19px] text-[16px] leading-none font-extrabold tracking-tight xl:flex">
            {footer}
          </div>
        )}
      </div>
    </aside>
  );
}
