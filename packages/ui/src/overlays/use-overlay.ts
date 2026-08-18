"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

/**
 * The one piece of machinery every overlay shares, so focus, Escape and
 * scroll-lock behave identically across Modal, Drawer, ConfirmDialog and Menu.
 *
 * Tenant's Modal is the only accessible overlay across the three consoles; this
 * is its logic factored out so nothing has to reimplement it. It also closes
 * three defects the standard records against the originals:
 *
 *  · "Not rendered through a portal, so a transformed ancestor can clip it" and
 *    "needs portal rendering to escape a table's overflow container" — see
 *    `Portal` below.
 *  · "scroll-lock will conflict if a drawer opens over it" — locking is
 *    reference-counted, so the last overlay to close restores the original
 *    value rather than the first one clobbering it.
 *  · "Only one menu open at a time across the app" — dismissible overlays
 *    register in a module-level stack and only the topmost responds to Escape.
 */

const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

/** Overlays currently open, innermost last. Only the top one handles Escape. */
const stack: symbol[] = [];

/** How many open overlays want the body scroll-locked, plus what to restore. */
let scrollLocks = 0;
let priorOverflow: string | null = null;

function lockScroll() {
  if (scrollLocks === 0) {
    priorOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
  }
  scrollLocks += 1;
}

function releaseScroll() {
  scrollLocks = Math.max(0, scrollLocks - 1);
  if (scrollLocks === 0 && priorOverflow !== null) {
    document.body.style.overflow = priorOverflow;
    priorOverflow = null;
  }
}

export interface UseOverlayOptions {
  open: boolean;
  onClose: () => void;
  /** Escape dismisses. Only the topmost overlay reacts. Default true. */
  closeOnEscape?: boolean;
  /** Cycle Tab within the panel in both directions. Default true. */
  trapFocus?: boolean;
  /** Lock body scroll while open. True for modals and drawers, false for
   *  menus, popovers and tooltips, which should not freeze the page. */
  lockScroll?: boolean;
  /** Move focus to the panel on open and restore it on close. Default true. */
  manageFocus?: boolean;
  /**
   * Focus this instead of the panel on open. The modal deliberately focuses the
   * panel so a screen reader hears the title first, but CX-CNF requires Cancel
   * to hold default focus in a destructive dialog — that is what this is for.
   */
  initialFocus?: RefObject<HTMLElement | null>;
}

export interface UseOverlayResult<T extends HTMLElement = HTMLElement> {
  /** Attach to the panel. Needs `tabIndex={-1}` so it can receive focus. */
  panelRef: RefObject<T | null>;
}

export function useOverlay<T extends HTMLElement = HTMLElement>({
  open,
  onClose,
  closeOnEscape = true,
  trapFocus = true,
  lockScroll: shouldLockScroll = true,
  manageFocus = true,
  initialFocus,
}: UseOverlayOptions): UseOverlayResult<T> {
  const panelRef = useRef<T | null>(null);

  // Held in a ref so a caller passing an inline arrow does not re-run the
  // effect (and re-trap focus) on every render.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;

    const id = Symbol("overlay");
    stack.push(id);

    if (shouldLockScroll) lockScroll();

    // Focus lands on the panel, not the first input, so a screen reader
    // announces the dialog title before any field.
    const previouslyFocused = document.activeElement as HTMLElement | null;
    if (manageFocus) {
      (initialFocus?.current ?? panelRef.current)?.focus();
    }

    const onKeyDown = (event: KeyboardEvent) => {
      // Only the innermost overlay reacts, so Escape peels one layer.
      if (stack[stack.length - 1] !== id) return;

      if (closeOnEscape && event.key === "Escape") {
        event.stopPropagation();
        onCloseRef.current();
        return;
      }

      if (!trapFocus || event.key !== "Tab") return;

      const panel = panelRef.current;
      if (!panel) return;

      const targets = Array.from(
        panel.querySelectorAll<HTMLElement>(FOCUSABLE),
      ).filter((el) => el.offsetParent !== null || el === panel);
      if (targets.length === 0) {
        // Nothing focusable — keep focus on the panel rather than letting it
        // escape to the page behind.
        event.preventDefault();
        panel.focus();
        return;
      }

      const first = targets[0];
      const last = targets[targets.length - 1];
      if (!first || !last) return;

      const active = document.activeElement;
      if (event.shiftKey && (active === first || active === panel)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown, true);

    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      const index = stack.indexOf(id);
      if (index !== -1) stack.splice(index, 1);
      if (shouldLockScroll) releaseScroll();
      // Return the user to where they were.
      if (manageFocus && previouslyFocused?.isConnected) {
        previouslyFocused.focus();
      }
    };
  }, [open, closeOnEscape, trapFocus, shouldLockScroll, manageFocus, initialFocus]);

  return { panelRef };
}

/**
 * Tracks whether we are on the client, so overlays can render `null` during SSR
 * and mount into `document.body` afterwards. Rendering through the body is what
 * keeps an overlay from being clipped by a table's `overflow` or a transformed
 * ancestor.
 */
export function usePortalTarget(): HTMLElement | null {
  const [target, setTarget] = useState<HTMLElement | null>(null);
  useEffect(() => setTarget(document.body), []);
  return target;
}

/** Closes when a click or focus lands outside `ref`. Used by menus and
 *  popovers, where there is no scrim to catch the click. */
export function useDismissOnOutside(
  ref: RefObject<HTMLElement | null>,
  open: boolean,
  onClose: () => void,
  /** Also ignore clicks inside this element (typically the trigger). */
  ignoreRef?: RefObject<HTMLElement | null>,
) {
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: Event) => {
      const node = event.target as Node;
      if (ref.current?.contains(node)) return;
      if (ignoreRef?.current?.contains(node)) return;
      onCloseRef.current();
    };

    // `pointerdown` rather than `click`: a menu must close before the click
    // lands on whatever is underneath it.
    document.addEventListener("pointerdown", onPointerDown, true);
    return () =>
      document.removeEventListener("pointerdown", onPointerDown, true);
  }, [open, ref, ignoreRef]);
}
