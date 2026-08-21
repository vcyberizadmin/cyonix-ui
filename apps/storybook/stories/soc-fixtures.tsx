/**
 * Shared SOC console fixtures.
 *
 * Not a story file — the glob is `*.stories.tsx`, so this is only ever
 * imported. It exists because the rail, the bar and the whole frame are three
 * views of ONE console, and three copies of its nav, its tenants and its icon
 * set would drift the moment any of them was edited. The frame story in
 * particular is only honest if it is built from exactly what the other two use.
 */
import type { DockItem } from "@vcyberizadmin/ui/layout";
import type {
  ConsoleNotification,
  ConsoleScope,
} from "@vcyberizadmin/ui/layout";
import {
  useEffect,
  useMemo,
  useState,
  type AnchorHTMLAttributes,
} from "react";

/* ---------------------------------------------------------------- icons --
   Outline and filled pairs. The filled variant is what the rail swaps in for
   the current location — a second, redundant signal alongside the ink tab, for
   an operator scanning a rail from three feet back. */

export const House = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5" />
  </svg>
);
export const HouseSolid = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
    <path d="M12 3.2 20.4 10v10a1 1 0 0 1-1 1h-4.6v-6H9.2v6H4.6a1 1 0 0 1-1-1V10Z" />
  </svg>
);
export const ShieldAlert = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3l7 3v6c0 4.4-2.9 7.9-7 9-4.1-1.1-7-4.6-7-9V6Z" />
    <path d="M12 8.5v4" />
    <path d="M12 16h.01" />
  </svg>
);
export const FolderOpen = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 8V6a1 1 0 0 1 1-1h5l2 2.5h8a1 1 0 0 1 1 1V10" />
    <path d="M3 8h17.2a1 1 0 0 1 .97 1.25l-2.1 8.5A1 1 0 0 1 18.1 19H4a1 1 0 0 1-1-1Z" />
  </svg>
);
export const Workflow = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
    <path d="M6.5 10v4a3 3 0 0 0 3 3H14" />
  </svg>
);
export const Bot = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="8" width="16" height="12" rx="3" />
    <path d="M12 8V4" />
    <path d="M9 14h.01M15 14h.01" />
  </svg>
);
export const Sun = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
  </svg>
);
export const Settings = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 17H5M19 7h-9" />
    <circle cx="17" cy="17" r="3" />
    <circle cx="7" cy="7" r="3" />
  </svg>
);
export const Lock = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="11" x="3" y="11" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

/* ------------------------------------------------------------------ data -- */

/** The SOC console's actual rail, item for item. */
export const SOC_ITEMS: DockItem[] = [
  { label: "Overview", href: "/overview", icon: <House />, activeIcon: <HouseSolid /> },
  { label: "Alerts", href: "/alerts", icon: <ShieldAlert />, count: 23, countTone: "alert" },
  { label: "Cases", href: "/cases", icon: <FolderOpen />, count: 8 },
  { label: "Sources", href: "/connectors", icon: <Workflow /> },
];

/** `tint` is the one place a per-tenant colour is allowed — everywhere else
 *  colour is reserved for severity and status. */
export const TENANTS: ConsoleScope[] = [
  { id: "all", name: "All tenants", short: "ALL", detail: "4 organisations", metric: { value: 31, label: "open" } },
  { id: "nwb", name: "Northwind Bank", short: "NB", detail: "Financial services", tint: "#a855f7", metric: { value: 12, label: "open" } },
  { id: "mrh", name: "Meridian Health", short: "MH", detail: "Healthcare", tint: "#22c55e", metric: { value: 7, label: "open" } },
  { id: "kes", name: "Kestrel Logistics", short: "KL", detail: "Transport", tint: "#f59e0b", metric: { value: 9, label: "open" } },
  { id: "vnt", name: "Vantage Retail", short: "VR", detail: "Retail", tint: "#3b82f6", metric: { value: 3, label: "open" } },
];

export const NOTIFS: ConsoleNotification[] = [
  { id: "1", unread: true, time: "6m", title: "Case CS-118 opened from AL-2291", body: "Credential dumping on FIN-WS-2214 — escalated at 94% confidence", source: { name: "Triage Agent", tint: "#a855f7" } },
  { id: "2", unread: true, time: "12m", title: "FIN-WS-2214 isolated", body: "Containment applied automatically, reversible for 30 days", source: { name: "Containment Agent", tint: "#3b82f6" } },
  { id: "3", unread: true, time: "19m", title: "AL-2290 needs your decision", body: "Impossible travel at 61% — below the auto-route threshold", source: { name: "Assignment Agent", tint: "#f59e0b" } },
  { id: "4", unread: false, time: "Yesterday", title: "CS-112 closed as benign", body: "Sanctioned scanner — suppression rule published", source: { name: "Triage Agent", tint: "#a855f7" } },
];

/* ------------------------------------------------------------- fragments -- */

/** The primary action. A plain button rather than a slot the rail owns, because
 *  only the app knows what it does. It is the dock's centre FAB and appears at
 *  no other width — above `xl` the console bar carries the agent affordance. */
export const AskAgent = () => (
  <button
    type="button"
    aria-label="Ask the agent"
    className="bg-accent text-accent-fg ring-bg duration-instant ease-brand grid size-[58px] cursor-pointer place-items-center rounded-[21px] ring-[3px] transition-transform active:scale-95 [&_svg]:size-[26px]"
  >
    <Bot />
  </button>
);

/** The bar's inline icon buttons. Their narrow-screen equivalents are the
 *  `compactOnly` rows in `SOC_USER_MENU`. */
export const BarActions = () => (
  <>
    <button
      type="button"
      aria-label="Toggle theme"
      className="bg-wash-2 text-fg hover:bg-wash-3 duration-instant ease-brand grid size-11 cursor-pointer place-items-center rounded-[14px] transition-colors [&_svg]:size-5"
    >
      <Sun />
    </button>
    <button
      type="button"
      aria-label="Settings"
      className="bg-wash-2 text-fg hover:bg-wash-3 duration-instant ease-brand grid size-11 cursor-pointer place-items-center rounded-[14px] transition-colors [&_svg]:size-5"
    >
      <Settings />
    </button>
  </>
);

export const SOC_USER = { name: "You", role: "SOC lead · on shift" };

export const SOC_USER_MENU = [
  { label: "Appearance", icon: <Sun />, value: "Dark", compactOnly: true },
  { label: "Settings", icon: <Settings />, compactOnly: true },
  { label: "Log out", icon: <Lock /> },
];

/**
 * Storybook has no router, so links render through a component that swallows
 * the navigation — exactly the seam an app fills with `next/link`. The anchors
 * keep their real `href`, so focus order, middle-click and "copy link address"
 * still behave; only the plain left-click is intercepted.
 */
export function useNoNavLink(initial?: string) {
  const [activeHref, setActiveHref] = useState(initial);

  // Re-seed when switching between stories.
  useEffect(() => setActiveHref(initial), [initial]);

  // Stable identity — a new component type each render would remount the whole
  // rail mid-transition and make the hover expansion stutter.
  const NoNavLink = useMemo(
    () =>
      function NoNavLink({
        href,
        ...props
      }: AnchorHTMLAttributes<HTMLAnchorElement>) {
        return (
          <a
            href={href}
            onClick={(event) => {
              event.preventDefault();
              if (href) setActiveHref(href);
            }}
            {...props}
          />
        );
      },
    [],
  );

  return { activeHref, NoNavLink };
}
