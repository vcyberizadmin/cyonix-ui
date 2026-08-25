"use client";

import { useEffect, useState, type ReactNode } from "react";
import { cn } from "../lib/cn.js";
import { useOverlay } from "../overlays/use-overlay.js";

/**
 * CX-SHL — the page frame: left rail, top bar, content column.
 *
 * Composes the rail and top bar as PROPS rather than hardcoding them, which is
 * what makes it testable and lets a new app supply a config instead of a
 * component.
 *
 * Rules encoded here:
 *  · Top bar 52px, content padded 24px.
 *  · The content column takes `min-w-0` so a wide table owns the overflow
 *    rather than pushing the layout sideways.
 *  · The rail never scrolls with the page.
 *  · A skip-to-content link is the FIRST focusable element on the page.
 *  · Below 768px the rail becomes a drawer instead of holding 300px — the one
 *    gap the standard records against Tenant's shell.
 *
 * Two rail modes, because the two rails collapse differently
 * ----------------------------------------------------------
 * `sidebar` (default) is CX-NAV: a flush panel with no small-screen story of
 * its own, so the shell supplies one — a drawer plus the trigger that opens it.
 *
 * `dock` is CX-DCK, which already IS its own small-screen story: below xl it
 * becomes a bar pinned to the bottom of the viewport. Wrapping that in the
 * drawer would hide a rail that is meant to stay visible and mount a trigger
 * for a drawer nothing can open. So the shell steps back: it renders the rail
 * straight through, drops the trigger, and takes on the one duty the dock
 * cannot do for itself — reserving scroll room at the foot of the content so
 * the last row is not stranded underneath the floating bar.
 */

export interface AppShellProps {
  /** Typically <NavRail /> or <DockRail />. How it behaves on a small screen
   *  depends on `railMode`. */
  rail?: ReactNode;
  /** `sidebar` (default) hides the rail below md and offers it as a drawer.
   *  `dock` renders the rail unwrapped and lets it place itself — use this
   *  with <DockRail />, which is already responsive. */
  railMode?: "sidebar" | "dock";
  /** Typically <TopBar />. */
  topBar?: ReactNode;
  children: ReactNode;
  /** Anchor the skip link targets. */
  contentId?: string;
  className?: string;
  contentClassName?: string;
}

function Hamburger() {
  return (
    <svg
      className="size-4.5"
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

export function AppShell({
  rail,
  railMode = "sidebar",
  topBar,
  children,
  contentId = "main-content",
  className,
  contentClassName,
}: AppShellProps) {
  const dock = railMode === "dock";
  const [railOpen, setRailOpen] = useState(false);

  // Same machinery as every other overlay: focus trap, Escape, focus restore.
  const { panelRef } = useOverlay<HTMLDivElement>({
    open: railOpen,
    onClose: () => setRailOpen(false),
  });

  // A resize back to desktop must not leave the drawer latched open.
  useEffect(() => {
    if (!railOpen) return;
    const query = window.matchMedia("(min-width: 768px)");
    const onChange = () => {
      if (query.matches) setRailOpen(false);
    };
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, [railOpen]);

  return (
    <div
      className={cn(
        "flex min-h-dvh",
        // A dock rail is absolutely positioned inside its gutter, so it is only
        // as tall as the flex container — and with the document scrolling, it
        // scrolls away with the content. The console solves this by being
        // exactly viewport height at xl and letting the CONTENT column scroll
        // inside itself, which is what keeps the rail on screen. Below xl the
        // document scrolls normally; the dock is `fixed` there and stays put on
        // its own. min-h keeps a short viewport from crushing the layout.
        dock && "xl:h-dvh xl:min-h-[700px]",
        className,
      )}
    >
      {/* First focusable element on the page. Visually hidden until focused. */}
      <a
        href={`#${contentId}`}
        className="bg-accent text-accent-fg sr-only rounded-sm px-4 py-2 text-[13px] font-semibold focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-100"
      >
        Skip to content
      </a>

      {/* A dock rail places itself at every width, so it is rendered straight
          through. A sidebar rail is persistent from md up only. */}
      {rail &&
        (dock ? rail : <div className="max-md:hidden">{rail}</div>)}

      {/* Below md a sidebar rail is a drawer rather than a 300px tax on a
          phone. The dock never takes this path — it is already on screen. */}
      {rail && !dock && railOpen && (
        <div
          className="animate-fade-in fixed inset-0 z-50 flex md:hidden"
          style={{
            backgroundColor: "rgb(6 6 8 / 0.8)",
            backdropFilter: "blur(2px)",
          }}
          onClick={() => setRailOpen(false)}
        >
          <div
            ref={panelRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
            onClick={(event) => event.stopPropagation()}
            className="focus:outline-none"
          >
            {rail}
          </div>
        </div>
      )}

      <div className={cn("flex min-w-0 flex-1 flex-col", dock && "xl:min-h-0")}>
        {(topBar ?? rail) && (
          <div className="sticky top-0 z-30 flex items-stretch">
            {/* The drawer trigger only exists where the rail is hidden, which
                is never the case for a dock. */}
            {rail && !dock && (
              <button
                type="button"
                onClick={() => setRailOpen(true)}
                aria-label="Open navigation"
                aria-expanded={railOpen}
                className="border-rule bg-bg/95 text-fg-2 hover:text-fg duration-instant ease-brand grid h-13 w-13 shrink-0 cursor-pointer place-items-center border-b backdrop-blur transition-colors md:hidden"
              >
                <Hamburger />
              </button>
            )}
            <div className="min-w-0 flex-1">{topBar}</div>
          </div>
        )}

        {/* min-w-0 is what stops a wide table from pushing the layout sideways. */}
        <main
          id={contentId}
          className={cn(
            "flex min-w-0 flex-1 flex-col gap-6 p-6",
            // The dock floats over the content below xl, so the column has to
            // buy back the room it covers — 68px of bar, its 16px inset, and
            // clearance for the FAB that overhangs the top edge. 116px is the
            // source's own figure. Without this the last row of a table is
            // unreachable at the end of a scroll.
            dock && "max-xl:pb-[116px]",
            // min-h-0 is the half everyone forgets: without it a flex child
            // refuses to shrink below its content and never scrolls.
            dock && "xl:min-h-0 xl:overflow-y-auto",
            contentClassName,
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
