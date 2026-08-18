"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { cn } from "./lib/cn.js";

/**
 * CX-TAB — Tabs and Segmented.
 *
 * TWO CONTROLS, ONE RULE FOR TELLING THEM APART
 * ---------------------------------------------
 *   Tabs      change the VIEW of one record.   Overview · Timeline · Ledger
 *   Segmented changes WHICH RECORDS are listed. All · Active · Suspended
 *
 * They look alike and the standard records that they get swapped. The rule is
 * in both doc blocks below and in the Storybook page, because it cannot be
 * enforced by types — both are "pick one of n".
 *
 * Never use tabs to switch between records. That is navigation, and it belongs
 * in CX-NAV or a list.
 *
 * Brand rules encoded here:
 *  · A selected tab is a CURRENT LOCATION, so the orange underline is the one
 *    place the accent belongs in this component. Hover stays neutral.
 *  · Segmented's active pill takes the orange fill for the same reason.
 *  · Both scroll horizontally rather than wrapping, so the control keeps one
 *    row and the page keeps its rhythm.
 *  · Counts read zero as "0" and are never hidden — an empty tab is
 *    information.
 */

export interface TabItem {
  value: string;
  label: ReactNode;
  /** Volume badge. `0` renders as "0" rather than disappearing. */
  count?: number;
  disabled?: boolean;
  /** Why it is unavailable — a disabled tab with no explanation is a dead end. */
  disabledReason?: string;
}

/* ---------------------------------------------------------------------------
   Shared: a horizontal scroller that reports which edges are cut off.
   --------------------------------------------------------------------------- */

/**
 * The standard's recorded cost for both controls is that "past ~6 tabs the bar
 * scrolls and later tabs become invisible". Two things fix that, and neither is
 * something a caller would think to add:
 *
 *  · the selected item is scrolled into view, so a deep-linked tab past the
 *    fold is visible on arrival rather than silently off-screen;
 *  · a mask fades whichever edge is actually cut off, so there is a visible
 *    signal that more exists. A mask is used rather than a gradient overlay
 *    because the control sits on several different backgrounds and an overlay
 *    would have to know which.
 */
function useEdgeFades(deps: unknown[]) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [edges, setEdges] = useState({ start: false, end: false });

  const measure = useCallback(() => {
    const node = ref.current;
    if (!node) return;
    const max = node.scrollWidth - node.clientWidth;
    setEdges({ start: node.scrollLeft > 1, end: node.scrollLeft < max - 1 });
  }, []);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    measure();
    node.addEventListener("scroll", measure, { passive: true });
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    for (const child of Array.from(node.children)) observer.observe(child);
    return () => {
      node.removeEventListener("scroll", measure);
      observer.disconnect();
    };
  }, [measure, ...deps]);

  const mask =
    edges.start && edges.end
      ? "linear-gradient(to right, transparent, black 24px, black calc(100% - 24px), transparent)"
      : edges.start
        ? "linear-gradient(to right, transparent, black 24px)"
        : edges.end
          ? "linear-gradient(to right, black calc(100% - 24px), transparent)"
          : undefined;

  return {
    ref,
    scrollerStyle: mask
      ? ({ maskImage: mask, WebkitMaskImage: mask } as const)
      : undefined,
  };
}

/**
 * Keeps the selected item inside the scroller.
 *
 * Computed from rects rather than `scrollIntoView`, for two reasons: it clamps
 * naturally at both ends, and it can be re-run.
 *
 * Re-running matters. Web fonts load with `display: swap`, so the first paint
 * uses fallback metrics and EVERY tab's width changes when the real face
 * arrives. A scroll position computed before that lands a few pixels short —
 * measured at 4px, which is enough to clip the last tab's edge and make a deep
 * link look like it landed on the wrong tab. So the position is asserted once on
 * selection and again once `document.fonts` reports ready.
 */
function useKeepSelectedVisible(
  scrollerRef: RefObject<HTMLDivElement | null>,
  nodesRef: RefObject<(HTMLButtonElement | null)[]>,
  selectedIndex: number,
) {
  useEffect(() => {
    const scroller = scrollerRef.current;
    const node = nodesRef.current?.[selectedIndex];
    if (!scroller || !node) return;

    const ensure = () => {
      const box = scroller.getBoundingClientRect();
      const item = node.getBoundingClientRect();
      if (item.left < box.left) scroller.scrollLeft -= box.left - item.left;
      else if (item.right > box.right) scroller.scrollLeft += item.right - box.right;
    };

    ensure();
    let cancelled = false;
    void document.fonts?.ready.then(() => {
      if (!cancelled) ensure();
    });
    return () => {
      cancelled = true;
    };
  }, [scrollerRef, nodesRef, selectedIndex]);
}

/** Roving focus: arrows move within, Home/End jump, Tab leaves the control. */
function useRovingKeys(
  items: TabItem[],
  refs: RefObject<(HTMLButtonElement | null)[]>,
  onSelect: (value: string) => void,
  { selectOnMove }: { selectOnMove: boolean },
) {
  return (event: KeyboardEvent) => {
    const keys = ["ArrowRight", "ArrowLeft", "Home", "End"];
    if (!keys.includes(event.key)) return;
    event.preventDefault();
    const nodes = refs.current ?? [];
    const from = nodes.findIndex((node) => node === document.activeElement);
    const count = items.length;
    const step = event.key === "ArrowLeft" ? -1 : 1;
    let next: number;
    if (event.key === "Home") next = -1;
    else if (event.key === "End") next = count;
    else next = from;

    for (let hop = 1; hop <= count; hop++) {
      const index =
        event.key === "Home"
          ? hop - 1
          : event.key === "End"
            ? count - hop
            : (next + step * hop + count * count) % count;
      const item = items[index];
      if (item && !item.disabled) {
        nodes[index]?.focus();
        if (selectOnMove) onSelect(item.value);
        return;
      }
    }
  };
}

function Count({ value, active }: { value: number; active: boolean }) {
  return (
    <span
      className={cn(
        "font-mono text-[11px] tabular-nums",
        active ? "text-accent-ink" : "text-fg-muted",
      )}
    >
      {value}
    </span>
  );
}

/* ---------------------------------------------------------------------------
   Tabs — change the view of ONE record.
   --------------------------------------------------------------------------- */

interface TabsContextValue {
  panelId: string;
  tabId: string;
}
const TabsContext = createContext<TabsContextValue | null>(null);

export interface TabsProps {
  items: TabItem[];
  /** Controlled selection. Keep it in the URL so a tab is linkable. */
  value?: string;
  onChange?: (value: string) => void;
  /** Uncontrolled starting tab. Defaults to the first enabled item. */
  defaultValue?: string;
  /** Accessible name for the tablist. */
  label: string;
  /**
   * The selected view. Rendered inside a correctly wired `role="tabpanel"`.
   * Omit it when the panel lives elsewhere — `aria-controls` is then left off
   * rather than pointed at an element that does not exist.
   */
  children?: ReactNode;
  className?: string;
  /** Class for the panel wrapper. */
  panelClassName?: string;
}

export function Tabs({
  items,
  value,
  onChange,
  defaultValue,
  label,
  children,
  className,
  panelClassName,
}: TabsProps) {
  const uid = useId();
  const firstEnabled = items.find((item) => !item.disabled)?.value ?? "";
  const [internal, setInternal] = useState(defaultValue ?? firstEnabled);
  const selected = value ?? internal;
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const { ref: scroller, scrollerStyle } = useEdgeFades([items.length]);

  const select = (next: string) => {
    if (value === undefined) setInternal(next);
    onChange?.(next);
  };

  // Automatic activation: for tabs, moving focus selects. That is the WAI-ARIA
  // recommendation when switching views is cheap, and it is what makes the
  // control usable by keyboard without an extra Enter on every step.
  const onKeyDown = useRovingKeys(items, refs, select, { selectOnMove: true });

  const selectedIndex = items.findIndex((item) => item.value === selected);
  // A deep link to the ninth tab must not land off-screen.
  useKeepSelectedVisible(scroller, refs, selectedIndex);

  const hasPanel = children !== undefined && children !== null;
  const panelId = `${uid}-panel`;
  const tabId = `${uid}-tab-${selected}`;

  return (
    <div className={cn("flex min-w-0 flex-col", className)}>
      <div
        ref={scroller}
        style={scrollerStyle}
        // The hairline runs the full width, so the bar reads as a bar even when
        // the tabs themselves do not fill it.
        className="border-rule scrollbar-none min-w-0 overflow-x-auto border-b"
      >
        <div role="tablist" aria-label={label} onKeyDown={onKeyDown} className="flex w-max">
          {items.map((item, index) => {
            const active = item.value === selected;
            return (
              <button
                key={item.value}
                ref={(node) => {
                  refs.current[index] = node;
                }}
                type="button"
                role="tab"
                id={`${uid}-tab-${item.value}`}
                aria-selected={active}
                aria-controls={hasPanel && active ? panelId : undefined}
                // Roving tabindex: one stop for the whole control, so Tab
                // leaves it instead of walking every tab.
                tabIndex={active ? 0 : -1}
                disabled={item.disabled}
                title={item.disabled ? item.disabledReason : undefined}
                onClick={() => select(item.value)}
                className={cn(
                  "duration-instant ease-brand relative flex shrink-0 cursor-pointer items-center gap-2 px-4 py-2.5 text-[13px] font-medium whitespace-nowrap transition-colors",
                  "disabled:cursor-not-allowed disabled:opacity-40",
                  // Hover stays NEUTRAL. The accent marks the current location,
                  // not the pointer.
                  active
                    ? "text-fg"
                    : "text-fg-2 hover:text-fg enabled:hover:bg-wash-hover",
                )}
              >
                {item.label}
                {typeof item.count === "number" && (
                  <Count value={item.count} active={active} />
                )}
                {/* Inside the content box, never negatively offset: the
                    scroller sets overflow-x, which forces overflow-y to `auto`,
                    so anything 1px outside is clipped and grows a stray 1px
                    vertical scrollbar. */}
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute inset-x-0 bottom-0 h-0.5",
                    active ? "bg-accent" : "bg-transparent",
                  )}
                />
              </button>
            );
          })}
        </div>
      </div>

      {hasPanel && (
        <TabsContext.Provider value={{ panelId, tabId }}>
          <div
            id={panelId}
            role="tabpanel"
            aria-labelledby={tabId}
            className={cn("min-w-0 pt-5", panelClassName)}
          >
            {children}
          </div>
        </TabsContext.Provider>
      )}
    </div>
  );
}

/** Ids of the current tab and panel, for content that needs to reference them. */
export function useTabsPanel(): TabsContextValue | null {
  return useContext(TabsContext);
}

/* ---------------------------------------------------------------------------
   Segmented — change WHICH RECORDS are listed.
   --------------------------------------------------------------------------- */

export interface SegmentedProps {
  /**
   * Keep this to ~7 or fewer. Past that a segmented row stops being scannable
   * and wants a select instead — a review-time rule, not something the
   * component can enforce without guessing at the app's intent.
   */
  items: TabItem[];
  value: string;
  onChange: (value: string) => void;
  /** Accessible name for the radiogroup. */
  label: string;
  /**
   * `fill` — active pill takes the orange fill. The CX-TAB treatment, for a
   *          control that owns its area.
   * `tint`  — active pill takes an orange hairline over a 15% wash. Lighter, for
   *          a dense filter toolbar sitting beside other controls.
   */
  variant?: "fill" | "tint";
  size?: "sm" | "md";
  /**
   * `scroll` keeps the control on one row (the CX-TAB rule). `wrap` lets it
   * reflow, which a filter toolbar wants when it shares a row with search.
   */
  overflow?: "scroll" | "wrap";
  className?: string;
}

export function Segmented({
  items,
  value,
  onChange,
  label,
  variant = "fill",
  size = "md",
  overflow = "scroll",
  className,
}: SegmentedProps) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const { ref: scroller, scrollerStyle } = useEdgeFades([items.length]);
  const onKeyDown = useRovingKeys(items, refs, onChange, { selectOnMove: true });
  const selectedIndex = items.findIndex((item) => item.value === value);
  const wrap = overflow === "wrap";
  // Only meaningful when scrolling; a wrapping row has nothing to scroll.
  useKeepSelectedVisible(scroller, refs, wrap ? -1 : selectedIndex);

  return (
    <div
      ref={wrap ? undefined : scroller}
      style={wrap ? undefined : scrollerStyle}
      className={cn(
        "min-w-0",
        wrap ? "" : "scrollbar-none overflow-x-auto",
        className,
      )}
    >
      <div
        role="radiogroup"
        aria-label={label}
        onKeyDown={onKeyDown}
        className={cn(
          "flex items-center gap-1",
          wrap ? "flex-wrap" : "w-max",
        )}
      >
        {items.map((item, index) => {
          const active = item.value === value;
          return (
            <button
              key={item.value}
              ref={(node) => {
                refs.current[index] = node;
              }}
              type="button"
              role="radio"
              aria-checked={active}
              tabIndex={
                active || (selectedIndex === -1 && index === 0) ? 0 : -1
              }
              disabled={item.disabled}
              title={item.disabled ? item.disabledReason : undefined}
              onClick={() => onChange(item.value)}
              className={cn(
                "duration-instant ease-brand inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border font-medium whitespace-nowrap transition-colors",
                "disabled:cursor-not-allowed disabled:opacity-40",
                size === "sm"
                  ? "px-2.5 py-1 text-[12px]"
                  : "px-3 py-1.5 text-[13px]",
                active
                  ? variant === "fill"
                    ? "border-accent bg-accent text-accent-fg"
                    : "border-accent bg-accent/15 text-accent-ink"
                  : "border-rule text-fg-2 enabled:hover:bg-wash-hover enabled:hover:text-fg",
              )}
            >
              {item.label}
              {typeof item.count === "number" && (
                <span
                  className={cn(
                    "font-mono text-[11px] tabular-nums",
                    active
                      ? variant === "fill"
                        // Full strength, not /80: dimming white on the orange
                        // fill measured 2.7:1, below even the label beside it.
                        ? "text-accent-fg"
                        : "text-accent-ink"
                      : "text-fg-muted",
                  )}
                >
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
