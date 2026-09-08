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
    <aside
      className={cn(
        // Rail and ground share Onyx so the rail reads as part of the page,
        // not a floating panel. One hairline separates it — no shadow.
        "border-rule bg-bg sticky top-0 flex h-dvh shrink-0 flex-col",
        "transition-[width] duration-standard ease-brand border-r",
        mini ? "w-rail-mini" : "w-rail",
        className,
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
                "group/rail py-2",
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
                  className="text-fg-muted duration-instant ease-brand group-hover/rail:text-fg flex w-full cursor-pointer items-center justify-between px-4 pt-2 pb-2.5 text-[10.5px] leading-none font-semibold tracking-[0.14em] uppercase transition-colors"
                >
                  {group.label}
                  <span
                    aria-hidden="true"
                    className="text-fg-2 duration-instant ease-brand font-mono text-[15px] leading-none opacity-0 transition-opacity group-hover/rail:opacity-100"
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
                      <div
                        className={cn(
                          "relative flex items-center",
                          active
                            ? [
                                "text-accent-ink",
                                "before:bg-accent before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:content-['']",
                                mini
                                  ? "bg-accent/14"
                                  : "bg-linear-to-r from-accent/14 to-transparent",
                              ]
                            : // Hover is feedback, not state: no bar, no orange.
                              "text-fg-2 hover:bg-wash-hover hover:text-fg",
                        )}
                      >
                        <Link
                          href={item.href}
                          {...(item.href === activeHref
                            ? { "aria-current": "page" }
                            : {})}
                          title={mini ? item.label : undefined}
                          className={cn(
                            "duration-instant ease-brand flex min-w-0 flex-1 items-center py-[9px] text-[13px] leading-tight font-medium transition-colors",
                            mini
                              ? "justify-center px-0"
                              : hasChildren
                                ? "gap-3 pr-1 pl-4"
                                : "gap-3 px-4",
                          )}
                        >
                          {item.icon && (
                            <span
                              className={cn(
                                "shrink-0",
                                mini
                                  ? "[&_svg]:size-[18px]"
                                  : "[&_svg]:size-[12.5px]",
                              )}
                            >
                              {item.icon}
                            </span>
                          )}

                          {!mini && (
                            <>
                              <span className="truncate">{item.label}</span>
                              {item.tag && (
                                <span className="bg-wash-2 text-fg-2 shrink-0 rounded-sm px-1.5 py-0.5 text-[9px] font-semibold tracking-[0.08em] uppercase">
                                  {item.tag}
                                </span>
                              )}
                              <span className="ml-auto flex shrink-0 items-center gap-1.5 pl-2">
                                {item.liveBadge ??
                                  (typeof item.count === "number" ? (
                                    <span
                                      className={cn(
                                        "font-mono text-[10px] tabular-nums",
                                        item.countTone === "alert"
                                          ? "text-warning-ink font-bold"
                                          : "text-fg-muted",
                                      )}
                                    >
                                      {item.count}
                                    </span>
                                  ) : null)}
                              </span>
                            </>
                          )}

                          {/* Mini hides counts, which would make urgent work
                              invisible when collapsed — the standard lists that
                              as a real defect. A dot keeps the signal. */}
                          {mini &&
                            item.countTone === "alert" &&
                            typeof item.count === "number" && (
                              <span
                                aria-hidden="true"
                                className="bg-warning absolute top-1.5 right-3 size-1.5 rounded-full"
                              />
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
      {footer && !mini && (
        <div className="border-rule text-fg-muted shrink-0 border-t px-4 py-3 text-[11px]">
          {footer}
        </div>
      )}
    </aside>
  );
}
