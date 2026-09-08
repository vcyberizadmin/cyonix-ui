"use client";

import {
  useCallback,
  useEffect,
  useState,
  type ElementType,
  type ReactNode,
} from "react";
import { cn } from "../lib/cn.js";

/**
 * CX-NAV — the primary navigation rail.
 *
 * Merged from all three consoles as the standard directs: Tenant's rendering,
 * SOC's data model (`liveBadge`, `tag`), VAPT's affordances (labelled collapse
 * control, independent group/section expand).
 *
 * Brand rules encoded here:
 *  · Orange appears in exactly ONE place at a time — the current location.
 *    Hover is a neutral wash, never orange, so "where I am" never competes with
 *    "where my cursor is".
 *  · Active is orange text + a 3px leading bar + a left-to-right 14% wash.
 *  · A count that needs attention takes the warning tone, never orange.
 *  · Groups separate by hairline, never by extra space alone.
 *
 * Framework-agnostic by design: it takes `activeHref` as a prop rather than
 * calling `usePathname()`, and renders links through `linkComponent`. That keeps
 * it testable with no route coupling, lets Storybook render it with no router,
 * and lets each app pass its own `next/link`.
 */

/** A leaf. Deliberately has no `children` — the standard caps nesting at two
 *  levels ("deep nesting past two levels has no answer"), enforced by the type. */
export interface NavChild {
  label: string;
  href: string;
  /** Small pill, e.g. "Beta" or "SOON". */
  tag?: string;
}

export interface NavItem {
  label: string;
  href: string;
  /** Supplied by the app — usually a lucide icon. Keeping it a node rather than
   *  a name registry is what lets SOC drop ~500 lines of hand-rolled SVG. */
  icon?: ReactNode;
  /** Static right-aligned count. */
  count?: number;
  /** `alert` renders the count in the warning tone. Never orange — orange is
   *  reserved for location and primary action. */
  countTone?: "default" | "alert";
  /** Live-data slot, rendered in place of `count`. The item owns its own
   *  polling so one busy badge never re-renders the whole rail. */
  liveBadge?: ReactNode;
  tag?: string;
  children?: NavChild[];
}

export interface NavGroup {
  /** Omit for an unlabelled leading group. */
  label?: string;
  items: NavItem[];
}

export interface NavRailProps {
  groups: NavGroup[];
  /** The app supplies this, typically from `usePathname()`. */
  activeHref?: string;
  /** Brand block, shown expanded. */
  brand?: ReactNode;
  /** Brand block, shown minimised. Falls back to `brand`. */
  brandMini?: ReactNode;
  /**
   * Which console this is — "SOC", "VAPT", "TENANT".
   *
   * Pinned to the BOTTOM of the rail, not beside the wordmark, and it reveals
   * itself with the rail: the first letter is always visible and the remainder
   * slides in when the rail expands, so a collapsed rail reads "S" and an
   * expanded one "SOC". That is the reference's treatment, and it is why
   * `Logo`'s own `module` pill should not be used as the rail's `brand` — the
   * reference has no such pill anywhere.
   */
  moduleBadge?: string;
  /** System-liveness strip pinned to the bottom. */
  footer?: ReactNode;
  /** Link implementation. Defaults to `a`; apps pass `next/link`. */
  linkComponent?: ElementType;
  /** localStorage namespace for mini + collapse state. Set per app if two
   *  consoles ever share an origin. */
  storageKey?: string;
  /** Controlled minimised state. Omit to let the rail own it. */
  mini?: boolean;
  onMiniChange?: (mini: boolean) => void;
  defaultMini?: boolean;
  className?: string;
}

/** Lucide's `Menu` geometry (4→20 at y 6/12/18), drawn at the brand's 1.8px
 *  stroke with round caps so it matches every other icon in the rail. */
function Hamburger({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function Chevron({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

/**
 * State that survives a reload, per the standard's "collapse state persists per
 * user" — Tenant's version is component-local and loses it.
 *
 * Reads in an effect rather than during render: localStorage does not exist on
 * the server, and seeding state from it directly would desync hydration.
 */
function usePersisted<T>(
  key: string | null,
  initial: T,
): [T, (next: T) => void] {
  const [value, setValue] = useState<T>(initial);

  useEffect(() => {
    if (!key) return;
    try {
      const raw = window.localStorage.getItem(key);
      if (raw !== null) setValue(JSON.parse(raw) as T);
    } catch {
      // Private mode, quota, or corrupt JSON — fall back to the default.
    }
  }, [key]);

  const set = useCallback(
    (next: T) => {
      setValue(next);
      if (!key) return;
      try {
        window.localStorage.setItem(key, JSON.stringify(next));
      } catch {
        // Non-fatal: the rail still works, it just will not remember.
      }
    },
    [key],
  );

  return [value, set];
}

export function NavRail({
  groups,
  activeHref,
  brand,
  brandMini,
  moduleBadge,
  footer,
  linkComponent,
  storageKey = "cyonix.nav",
  mini: controlledMini,
  onMiniChange,
  defaultMini = false,
  className,
}: NavRailProps) {
  const Link = (linkComponent ?? "a") as ElementType;

  const [ownMini, setOwnMini] = usePersisted(
    storageKey ? `${storageKey}.mini` : null,
    defaultMini,
  );
  const [collapsedGroups, setCollapsedGroups] = usePersisted<
    Record<string, boolean>
  >(storageKey ? `${storageKey}.groups` : null, {});
  const [expandedItems, setExpandedItems] = usePersisted<
    Record<string, boolean>
  >(storageKey ? `${storageKey}.items` : null, {});

  const mini = controlledMini ?? ownMini;
  const setMini = (next: boolean) => {
    onMiniChange?.(next);
    if (controlledMini === undefined) setOwnMini(next);
  };

  return (
    // The outer column only RESERVES space; the rail itself is the panel
    // inside it. On desktop the panel is absolutely positioned and floats
    // inset from the page edges, so widening it on hover overlaps the content
    // rather than reflowing it — which is the whole point of a peek. On mobile
    // this same element becomes the bottom bar.
    <aside
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 p-4",
        "xl:static xl:z-auto xl:shrink-0 xl:p-3",
        "xl:w-(--container-rail-gutter) xl:relative",
        className,
      )}
    >
      <div
        // group/rail is what the labels, the logo crossfade and the module
        // badge all hang off: one hover target, several coordinated reveals.
        className={cn(
          "group/rail bg-rail flex items-center justify-between gap-2 overflow-visible px-3",
          "h-(--container-rail-bar) rounded-[30px] shadow-[0_12px_34px_-8px_rgb(0_0_0_/_0.45)]",
          // Desktop: a floating column, 12px in from three edges.
          "xl:absolute xl:inset-y-3 xl:left-3 xl:h-auto xl:flex-col xl:items-stretch xl:rounded-[28px] xl:px-3.5 xl:py-7 xl:shadow-none",
          "xl:transition-[width,box-shadow] xl:duration-standard xl:ease-brand",
          // The peek. Focus-within matters as much as hover: a keyboard user
          // tabbing into the rail must see the labels too.
          mini
            ? "xl:w-(--container-rail-mini) xl:hover:w-(--container-rail) xl:focus-within:w-(--container-rail)"
            : "xl:w-(--container-rail)",
          "xl:hover:shadow-[0_26px_64px_-18px_rgb(0_0_0_/_0.55)] xl:focus-within:shadow-[0_26px_64px_-18px_rgb(0_0_0_/_0.55)]",
        )}
      >
      {/* Brand block. The collapse control lives here, beside the lockup —
          Tenant's placement. Expanded it sits at the right edge of the brand
          row; minimised it drops to its own centred row under the mark. */}
      <div
        className={cn(
          "flex shrink-0 items-center py-5",
          mini ? "justify-center px-0" : "justify-between gap-3 px-4",
        )}
      >
        {mini ? (brandMini ?? brand) : brand}
        {!mini && (
          <button
            type="button"
            onClick={() => setMini(true)}
            aria-label="Minimise navigation"
            aria-expanded={true}
            className="text-fg-2 hover:text-fg duration-instant ease-brand flex size-9 shrink-0 cursor-pointer items-center justify-center transition-colors"
          >
            <Hamburger className="size-4.5" />
          </button>
        )}
      </div>

      {mini && (
        <button
          type="button"
          onClick={() => setMini(false)}
          aria-label="Expand navigation"
          aria-expanded={false}
          className="text-fg-2 hover:text-fg duration-instant ease-brand mx-auto mt-1 mb-2 flex size-9 cursor-pointer items-center justify-center transition-colors"
        >
          <Hamburger className="size-4.5" />
        </button>
      )}

      <nav className="flex-1 overflow-y-auto">
        {groups.map((group, groupIndex) => {
          const groupKey = group.label ?? `group-${groupIndex}`;
          const groupCollapsed = collapsedGroups[groupKey] ?? false;

          return (
            <div
              key={groupKey}
              className={cn(
                "group/navgroup py-2",
                // Groups separate by hairline, never by extra space alone.
                groupIndex > 0 && "border-rule border-t",
              )}
            >
              {group.label && !mini && (
                <button
                  type="button"
                  onClick={() =>
                    setCollapsedGroups({
                      ...collapsedGroups,
                      [groupKey]: !groupCollapsed,
                    })
                  }
                  aria-expanded={!groupCollapsed}
                  className="text-fg-muted duration-instant ease-brand group-hover/navgroup:text-fg flex w-full cursor-pointer items-center justify-between px-4 pt-2 pb-2.5 text-[10.5px] leading-none font-semibold tracking-[0.14em] uppercase transition-colors"
                >
                  {group.label}
                  <span
                    aria-hidden="true"
                    className="text-fg-2 duration-instant ease-brand font-mono text-[15px] leading-none opacity-0 transition-opacity group-hover/navgroup:opacity-100"
                  >
                    {groupCollapsed ? "+" : "−"}
                  </span>
                </button>
              )}

              {!groupCollapsed &&
                group.items.map((item) => {
                  const childActive = item.children?.some(
                    (child) => child.href === activeHref,
                  );
                  // A child being active also lights its parent.
                  const active = item.href === activeHref || !!childActive;
                  const hasChildren = !!item.children?.length;
                  // Defaults to open when active — VAPT's behaviour — but a
                  // manual toggle wins and persists. Tenant only reveals
                  // children when the parent is active; the standard calls
                  // that out as the weaker model.
                  const expanded = expandedItems[item.href] ?? active;

                  return (
                    <div key={item.href}>
                      <div className="relative flex items-center">
                        <Link
                          href={item.href}
                          {...(item.href === activeHref
                            ? { "aria-current": "page" }
                            : {})}
                          title={item.label}
                          className={cn(
                            "duration-instant ease-brand relative flex h-12 min-w-0 flex-1 items-center rounded-2xl transition-colors",
                            active
                              // Collapsed, the active item carries a tinted
                              // squircle. Expanded it does NOT: the edge tab
                              // alone marks it, and keeping both reads as two
                              // competing indicators. The reference drops the
                              // fill at xl for exactly this reason.
                              ? "text-rail-fg bg-rail-active xl:bg-transparent"
                              : "text-rail-fg-dim hover:text-rail-fg hover:bg-rail-active",
                          )}
                        >
                          {/* The ink. A pill under the glyph on the mobile bar;
                              on desktop a tab on the panel's OUTER left edge,
                              poking out past it and rounded on the right only,
                              so it reads as the page marking the rail rather
                              than the rail decorating itself. */}
                          <span
                            aria-hidden="true"
                            className={cn(
                              "bg-rail-ink pointer-events-none absolute transition-opacity duration-standard ease-brand",
                              "-bottom-[7px] left-1/2 h-[4px] w-5 -translate-x-1/2 rounded-full",
                              "xl:top-1/2 xl:bottom-auto xl:left-[-14px] xl:h-[34px] xl:w-[9px] xl:translate-x-0 xl:-translate-y-1/2 xl:rounded-l-none xl:rounded-r-[9px]",
                              active ? "opacity-100" : "opacity-0",
                            )}
                          />

                          <span className="relative grid size-12 shrink-0 place-items-center">
                            {item.icon && (
                              <span className="[&_svg]:size-[22px]">
                                {item.icon}
                              </span>
                            )}

                            {/* The count OVERLAPS the glyph, which is what lets
                                it survive collapse. This rail used to hide
                                counts when minimised and fall back to a bare
                                dot, losing the number exactly when the rail was
                                narrowest. The ring is the rail's own colour, so
                                the bubble punches a hole rather than sitting in
                                a box. */}
                            {(item.liveBadge ??
                              (typeof item.count === "number" &&
                                item.count > 0)) && (
                              <span
                                className={cn(
                                  "ring-rail absolute top-1 right-1 grid h-[17px] min-w-[17px] place-items-center rounded-full px-1 text-[10px] leading-none font-extrabold ring-2",
                                  item.countTone === "alert"
                                    ? "bg-sev-crit text-white"
                                    : "bg-surface-3 text-fg",
                                )}
                              >
                                {item.liveBadge ?? item.count}
                              </span>
                            )}
                          </span>

                          {/* Width-animated, not faded: the label slides out
                              from behind the glyph as the panel opens. Revealed
                              by the PANEL's hover, never its own, so pointing
                              at one item shows every label. */}
                          <span
                            className={cn(
                              "ease-brand overflow-hidden text-[14.5px] leading-none font-bold tracking-[-.01em] whitespace-nowrap transition-[max-width,opacity] duration-standard",
                              mini
                                ? "max-w-0 opacity-0 xl:group-hover/rail:max-w-[150px] xl:group-hover/rail:opacity-100 xl:group-focus-within/rail:max-w-[150px] xl:group-focus-within/rail:opacity-100"
                                : "max-w-0 opacity-0 xl:max-w-[150px] xl:opacity-100",
                            )}
                          >
                            {item.label}
                          </span>

                          {item.tag && (
                            <span
                              className={cn(
                                "bg-surface-3 text-fg ml-2 shrink-0 overflow-hidden rounded-sm px-1.5 py-0.5 text-[9px] font-semibold tracking-[0.08em] uppercase transition-opacity duration-standard",
                                mini
                                  ? "opacity-0 xl:group-hover/rail:opacity-100 xl:group-focus-within/rail:opacity-100"
                                  : "opacity-0 xl:opacity-100",
                              )}
                            >
                              {item.tag}
                            </span>
                          )}
                        </Link>

                        {/* A sibling button, not a nested one: expanding must
                            not navigate, and a <button> inside an <a> is
                            invalid and unreachable by keyboard. */}
                        {hasChildren && !mini && (
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedItems({
                                ...expandedItems,
                                [item.href]: !expanded,
                              })
                            }
                            aria-expanded={expanded}
                            aria-label={`${expanded ? "Collapse" : "Expand"} ${item.label}`}
                            className="duration-instant ease-brand cursor-pointer px-3 py-[9px] transition-transform"
                          >
                            <Chevron
                              className={cn(
                                "duration-instant ease-brand size-3 opacity-65 transition-transform",
                                expanded && "rotate-180",
                              )}
                            />
                          </button>
                        )}
                      </div>

                      {/* Children indent behind a vertical rule and drop their
                          icons. Hidden entirely when minimised, never floated. */}
                      {hasChildren && !mini && expanded && (
                        <div className="border-rule mt-0.5 mb-2 ml-8 border-l">
                          {item.children?.map((child) => (
                            <Link
                              key={child.href}
                              href={child.href}
                              {...(child.href === activeHref
                                ? { "aria-current": "page" }
                                : {})}
                              className={cn(
                                "duration-instant ease-brand flex items-center gap-2 py-2 pl-4 text-[12.5px] leading-tight transition-colors",
                                child.href === activeHref
                                  ? "text-accent-ink"
                                  : "text-fg-2 hover:text-fg",
                              )}
                            >
                              <span className="truncate">{child.label}</span>
                              {child.tag && (
                                <span className="bg-wash-2 text-fg-2 shrink-0 rounded-sm px-1.5 py-0.5 text-[9px] font-semibold tracking-[0.08em] uppercase">
                                  {child.tag}
                                </span>
                              )}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          );
        })}
      </nav>

      {/* Dropped entirely when minimised rather than emptied — an empty
          bordered strip reads as a rendering bug, and 68px has no room for it. */}
      {moduleBadge && (
        <button
          type="button"
          aria-label={moduleBadge}
          className="text-rail-fg-dim hover:text-rail-fg hover:bg-rail-active duration-instant ease-brand mx-2 mb-2 flex h-12 shrink-0 cursor-pointer items-center rounded-2xl transition-colors"
        >
          <span className="flex h-12 shrink-0 items-center pl-[19px] text-[16px] leading-none font-extrabold tracking-tight">
            {moduleBadge.slice(0, 1)}
            {/* The remainder is width-animated rather than faded, so the
                letters appear to slide out of the first one as the rail opens.
                max-w-0 + overflow-hidden is what collapses it without
                reserving space. */}
            <span
              className={cn(
                "ease-brand overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-standard",
                mini ? "max-w-0 opacity-0" : "max-w-[150px] opacity-100",
              )}
            >
              {moduleBadge.slice(1)}
            </span>
          </span>
        </button>
      )}
      {footer && !mini && (
        <div className="text-rail-fg-dim hidden shrink-0 px-4 py-3 text-[11px] xl:block">
          {footer}
        </div>
      )}
      </div>
    </aside>
  );
}
