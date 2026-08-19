"use client";

/**
 * CX-TIP — Tooltip and Popover. Written from scratch: no console had a reusable
 * one, only per-feature copies.
 *
 * THE RULE THAT SEPARATES THEM
 * ----------------------------
 * A tooltip must NEVER contain a control. If it needs one, it is a popover.
 * Tooltip content is typed as a string for that reason — you cannot pass a
 * button into it without noticing.
 *
 * Tooltip: grey-2 fill, 12px, max 280px, radius-sm, e-2. Opens after 400ms of
 * hover, or IMMEDIATELY on focus. Hover-only content is invisible on touch and
 * to keyboard users, so the focus path is not optional — and a tooltip is never
 * the only place information exists.
 *
 * Popover: surface fill, radius-md, up to 360px, may contain controls. Opens on
 * click, traps nothing, Escape closes.
 *
 * Both flip to stay in the viewport and render through a portal, so a scroll
 * container or a table's overflow cannot clip them.
 */
import {
  cloneElement,
  isValidElement,
  useId,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "../lib/cn.js";
import {
  useAnchoredPosition,
  useDismissOnOutside,
  useOverlay,
  usePortalTarget,
} from "./use-overlay.js";

/** The trigger must be a single element that forwards props and a ref. */
type TriggerElement = ReactElement<Record<string, unknown>>;

export interface TooltipProps {
  /**
   * Plain text only. A tooltip that needs a control is a popover — see the
   * file header.
   */
  content: string;
  children: TriggerElement;
  side?: "top" | "bottom";
  align?: "start" | "center" | "end";
  /** Hover delay. Focus always opens immediately. */
  delay?: number;
  className?: string;
}

export function Tooltip({
  content,
  children,
  side = "top",
  align = "center",
  delay = 400,
  className,
}: TooltipProps) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLElement | null>(null);
  const floatingRef = useRef<HTMLDivElement | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const target = usePortalTarget();
  const id = useId();

  const position = useAnchoredPosition({
    open,
    anchorRef,
    floatingRef,
    side,
    align,
  });

  const cancel = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };
  const openAfterDelay = () => {
    cancel();
    timer.current = setTimeout(() => setOpen(true), delay);
  };
  const close = () => {
    cancel();
    setOpen(false);
  };

  if (!isValidElement(children)) {
    throw new Error("Tooltip expects a single element child.");
  }

  const trigger = cloneElement(children, {
    ref: anchorRef,
    // Described-by rather than labelled-by: the trigger keeps its own name and
    // the tooltip supplements it.
    "aria-describedby": open ? id : undefined,
    onMouseEnter: openAfterDelay,
    onMouseLeave: close,
    // Focus opens with NO delay — the keyboard path must not be slower.
    onFocus: () => setOpen(true),
    onBlur: close,
    // Escape closes without needing the shared overlay stack: a tooltip is not
    // dismissible in the modal sense and must not join that stack.
    onKeyDown: (event: React.KeyboardEvent) => {
      if (event.key === "Escape") close();
    },
  } as Record<string, unknown>);

  return (
    <>
      {trigger}
      {open &&
        target &&
        createPortal(
          <div
            ref={floatingRef}
            id={id}
            role="tooltip"
            className={cn(
              "bg-dark-grey-2 text-white border-rule shadow-e2 pointer-events-none fixed z-50 max-w-[280px] rounded-sm border px-2.5 py-1.5 text-[12px] leading-snug",
              position ? "animate-fade-in" : "invisible",
              className,
            )}
            style={{ top: position?.top ?? 0, left: position?.left ?? 0 }}
          >
            {content}
          </div>,
          target,
        )}
    </>
  );
}

export interface PopoverProps {
  /** May contain controls — that is what makes it a popover. */
  content: ReactNode;
  children: TriggerElement;
  side?: "top" | "bottom";
  align?: "start" | "center" | "end";
  /** Accessible name for the panel. */
  label?: string;
  /**
   * Controlled open state. Omit and the popover manages its own — the common
   * case, where the trigger is the only thing that opens and closes it.
   *
   * Passing it is what lets a panel dismiss ITSELF, which a popover whose
   * content carries its own actions has to be able to do: CX-DTE's range picker
   * ends in Cancel and Apply, and neither can work if only the trigger and an
   * outside click can close the panel.
   */
  open?: boolean;
  /** Fires for every open and close, controlled or not. */
  onOpenChange?: (open: boolean) => void;
  className?: string;
}

export function Popover({
  content,
  children,
  side = "bottom",
  align = "start",
  label,
  open: openProp,
  onOpenChange,
  className,
}: PopoverProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = openProp ?? uncontrolledOpen;

  const setOpen = (next: boolean) => {
    // The internal state is kept in step even when controlled, so a caller that
    // stops passing `open` mid-life does not snap the panel back to closed.
    setUncontrolledOpen(next);
    onOpenChange?.(next);
  };

  const anchorRef = useRef<HTMLElement | null>(null);
  const target = usePortalTarget();
  const id = useId();

  const close = () => setOpen(false);
  // Traps nothing, per the standard — but Escape still closes and focus still
  // returns to the trigger.
  const { panelRef } = useOverlay<HTMLDivElement>({
    open,
    onClose: close,
    trapFocus: false,
    lockScroll: false,
  });
  useDismissOnOutside(panelRef, open, close, anchorRef);

  const position = useAnchoredPosition({
    open,
    anchorRef,
    floatingRef: panelRef,
    side,
    align,
  });

  if (!isValidElement(children)) {
    throw new Error("Popover expects a single element child.");
  }

  const trigger = cloneElement(children, {
    ref: anchorRef,
    "aria-haspopup": "dialog",
    "aria-expanded": open,
    "aria-controls": open ? id : undefined,
    // Click, never hover — a hover-opened panel containing controls is a trap.
    onClick: () => setOpen(!open),
  } as Record<string, unknown>);

  return (
    <>
      {trigger}
      {open &&
        target &&
        createPortal(
          <div
            ref={panelRef}
            id={id}
            tabIndex={-1}
            role="dialog"
            aria-label={label}
            className={cn(
              "bg-surface border-rule shadow-e2 fixed z-50 max-w-[360px] rounded-md border p-3 focus:outline-none",
              position ? "animate-fade-in" : "invisible",
              className,
            )}
            style={{ top: position?.top ?? 0, left: position?.left ?? 0 }}
          >
            {content}
          </div>,
          target,
        )}
    </>
  );
}
