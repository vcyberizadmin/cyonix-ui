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
 */

export interface AppShellProps {
  /** Typically <NavRail />. Rendered persistently above md, and inside a
   *  dismissible drawer below it. */
  rail?: ReactNode;
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
  topBar,
  children,
  contentId = "main-content",
  className,
  contentClassName,
}: AppShellProps) {
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
    <div className={cn("flex min-h-dvh", className)}>
      {/* First focusable element on the page. Visually hidden until focused. */}
      <a
        href={`#${contentId}`}
        className="bg-accent text-accent-fg sr-only rounded-sm px-4 py-2 text-[13px] font-semibold focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-100"
      >
        Skip to content
      </a>

      {/* Persistent rail from md up. It never scrolls with the page. */}
      {rail && <div className="max-md:hidden">{rail}</div>}

      {/* Below md the rail is a drawer rather than a 300px tax on a phone. */}
      {rail && railOpen && (
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

      <div className="flex min-w-0 flex-1 flex-col">
        {(topBar ?? rail) && (
          <div className="sticky top-0 z-30 flex items-stretch">
            {/* The drawer trigger only exists where the rail is hidden. */}
            {rail && (
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
            contentClassName,
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
