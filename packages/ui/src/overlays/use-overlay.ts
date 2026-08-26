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

  /**
   * The panel arrives LATE, and focus has to wait for it.
   *
   * Every overlay here renders through a portal, and `usePortalTarget` only
   * resolves in an effect — so on the render where `open` becomes true the
   * panel is not in the DOM yet and `panelRef.current` is still null. An
   * overlay that transitions closed → open gets away with it, because the
   * effect re-runs on the next `open` change by which time the panel exists.
   * One mounted ALREADY open does not: the effect fires once against a null
   * ref, never runs again, and focus silently stays on <body>. The dialog
   * title is never announced, and since the Tab trap below only intervenes
   * once focus is already inside, the first Tab walks into the page behind
   * the scrim.
   *
   * Mirroring the node into state gives the focus effect a dependency that
   * actually changes when the panel lands. Deliberately NOT a `ready` flag
   * passed in by each overlay: this is the third time this hook has had to
   * absorb a portal-timing detail, and a flag every future overlay must
   * remember to pass is the same bug waiting to happen. Tracking the node
   * covers any reason the panel is late, not just this one.
   */
  const [panelNode, setPanelNode] = useState<T | null>(null);
  useEffect(() => {
    // No dependency array: this is a cheap identity check that has to run
    // after every render, because a ref assignment does not trigger one.
    if (panelRef.current !== panelNode) setPanelNode(panelRef.current);
  });

  /**
   * Focus, kept separate from the machinery below because it is the only part
   * that depends on the panel EXISTING. Escape, the scroll lock and the Tab
   * trap all work off `open` and the document, so they can start immediately.
   */
  useEffect(() => {
    if (!open || !manageFocus) return;

    // Focus lands on the panel, not the first input, so a screen reader
    // announces the dialog title before any field.
    const node = initialFocus?.current ?? panelNode;
    if (!node) return; // Panel not mounted yet — re-runs when it is.

    const previouslyFocused = document.activeElement as HTMLElement | null;
    node.focus();

    return () => {
      // Return the user to where they were. Without this, closing a dialog
      // drops focus on <body> and the tab journey restarts from the top.
      if (previouslyFocused?.isConnected) previouslyFocused.focus();
    };
  }, [open, panelNode, manageFocus, initialFocus]);

  useEffect(() => {
    if (!open) return;

    const id = Symbol("overlay");
    stack.push(id);

    if (shouldLockScroll) lockScroll();

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
    };
  }, [open, closeOnEscape, trapFocus, shouldLockScroll]);

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

/* ---------------------------------------------------------------------------
   Anchored positioning, shared by Menu, Tooltip and Popover.
   --------------------------------------------------------------------------- */

export interface AnchoredPosition {
  top: number;
  left: number;
  /** Which side it actually landed on, after flipping. */
  side: "top" | "bottom";
}

export interface UseAnchoredPositionOptions {
  open: boolean;
  anchorRef: RefObject<HTMLElement | null>;
  floatingRef: RefObject<HTMLElement | null>;
  /** Horizontal alignment against the anchor. */
  align?: "start" | "center" | "end";
  /** Preferred side. Flips when there is not room. */
  side?: "top" | "bottom";
  gap?: number;
}

/**
 * Fixed-position placement against an anchor, flipping to stay in the viewport.
 *
 * Returns null until measured, so a caller can keep the panel invisible rather
 * than flashing it at 0,0 for a frame. Uses viewport coordinates with `position:
 * fixed`, which is also what lets a portaled panel escape a scroll container.
 */
export function useAnchoredPosition({
  open,
  anchorRef,
  floatingRef,
  align = "start",
  side = "bottom",
  gap = 6,
}: UseAnchoredPositionOptions): AnchoredPosition | null {
  const [position, setPosition] = useState<AnchoredPosition | null>(null);

  useEffect(() => {
    if (!open) {
      setPosition(null);
      return;
    }

    const place = () => {
      const anchor = anchorRef.current;
      const floating = floatingRef.current;
      if (!anchor || !floating) return;

      const rect = anchor.getBoundingClientRect();
      const { offsetHeight: height, offsetWidth: width } = floating;

      const roomBelow = window.innerHeight - rect.bottom;
      const roomAbove = rect.top;
      const wanted = side === "bottom" ? roomBelow : roomAbove;
      const other = side === "bottom" ? roomAbove : roomBelow;
      const flip = wanted < height + gap && other > wanted;
      const resolved: "top" | "bottom" = flip
        ? side === "bottom"
          ? "top"
          : "bottom"
        : side;

      let left =
        align === "end"
          ? rect.right - width
          : align === "center"
            ? rect.left + rect.width / 2 - width / 2
            : rect.left;
      // Never let it hang off the edge.
      left = Math.max(8, Math.min(left, window.innerWidth - width - 8));

      setPosition({
        top:
          resolved === "bottom"
            ? rect.bottom + gap
            : rect.top - height - gap,
        left,
        side: resolved,
      });
    };

    place();

    // Reposition rather than drift when the page moves under it.
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [open, anchorRef, floatingRef, align, side, gap]);

  return position;
}
