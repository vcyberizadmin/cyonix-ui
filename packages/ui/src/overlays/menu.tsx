"use client";

import { useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "../lib/cn.js";
import {
  useAnchoredPosition,
  useDismissOnOutside,
  useOverlay,
  usePortalTarget,
} from "./use-overlay.js";

/**
 * CX-MNU — the row ⋯ and top-bar dropdowns.
 *
 * Tenant's ARIA is the base; SOC's outside-click dismissal is merged in. Two
 * defects the standard records are closed here:
 *
 *  · "Needs portal rendering to escape a table's overflow container" — the panel
 *    renders through document.body with fixed positioning.
 *  · "Only one menu open at a time across the app" — handled by the shared
 *    overlay stack.
 *
 * Brand rules encoded here:
 *  · Radius-md, e-2, minimum 180px. Items 13px with 8px vertical padding.
 *  · Flips to stay in the viewport near the bottom edge.
 *  · Opens on CLICK, never hover.
 *  · Destructive items sit below a separator so they are never adjacent to a
 *    benign default — enforced structurally below, not left to the caller.
 */

export interface MenuItemDef {
  label: ReactNode;
  onSelect?: () => void;
  icon?: ReactNode;
  /** Danger tone. Automatically sorted below a separator, always last. */
  danger?: boolean;
  disabled?: boolean;
  /** Why it is unavailable. Surfaced as a tooltip — a disabled item with no
   *  explanation is a dead end. */
  disabledReason?: string;
}

export interface MenuProps {
  /** Rendered inside the trigger button. */
  trigger: ReactNode;
  items: MenuItemDef[];
  /** Accessible name for the trigger. */
  label?: string;
  /** Which edge to align the panel to. */
  align?: "start" | "end";
  triggerClassName?: string;
  className?: string;
}

export function Menu({
  trigger,
  items,
  label = "More actions",
  align = "end",
  triggerClassName,
  className,
}: MenuProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const target = usePortalTarget();

  const close = () => setOpen(false);
  const { panelRef } = useOverlay<HTMLDivElement>({
    open,
    onClose: close,
    // A menu must not freeze the page behind it.
    lockScroll: false,
  });
  useDismissOnOutside(panelRef, open, close, triggerRef);

  // Destructive actions are moved last structurally, so a caller cannot put
  // "Delete" next to "Edit" by listing it there.
  const ordered = [
    ...items.filter((item) => !item.danger),
    ...items.filter((item) => item.danger),
  ];
  const firstDangerIndex = ordered.findIndex((item) => item.danger);

  const position = useAnchoredPosition({
    open,
    anchorRef: triggerRef,
    floatingRef: panelRef,
    align,
  });

  // Roving focus: arrows move, Home/End jump, skipping disabled items.
  const move = (from: number, delta: number) => {
    const count = ordered.length;
    for (let step = 1; step <= count; step++) {
      const next = (from + delta * step + count * count) % count;
      if (!ordered[next]?.disabled) {
        itemRefs.current[next]?.focus();
        return;
      }
    }
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        // Click, never hover.
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "text-fg-2 hover:text-fg hover:bg-wash-hover duration-instant ease-brand grid size-8 cursor-pointer place-items-center rounded-sm transition-colors",
          open && "text-fg bg-wash-2",
          triggerClassName,
        )}
      >
        {trigger}
      </button>

      {open &&
        target &&
        createPortal(
          <div
            ref={panelRef}
            tabIndex={-1}
            role="menu"
            aria-label={label}
            className={cn(
              "bg-surface border-rule shadow-e2 fixed z-50 min-w-[180px] rounded-md border py-1.5 focus:outline-none",
              // Hidden until measured, so it never flashes at 0,0.
              position ? "animate-fade-in" : "invisible",
              className,
            )}
            style={{ top: position?.top ?? 0, left: position?.left ?? 0 }}
            onKeyDown={(event) => {
              const index = itemRefs.current.findIndex(
                (node) => node === document.activeElement,
              );
              if (event.key === "ArrowDown") {
                event.preventDefault();
                move(index === -1 ? -1 : index, 1);
              } else if (event.key === "ArrowUp") {
                event.preventDefault();
                move(index === -1 ? 0 : index, -1);
              } else if (event.key === "Home") {
                event.preventDefault();
                move(-1, 1);
              } else if (event.key === "End") {
                event.preventDefault();
                move(0, -1);
              }
            }}
          >
            {ordered.map((item, index) => (
              <div key={index}>
                {index === firstDangerIndex && index > 0 && (
                  <div
                    role="separator"
                    className="bg-rule my-1.5 h-px w-full"
                  />
                )}
                <button
                  ref={(node) => {
                    itemRefs.current[index] = node;
                  }}
                  type="button"
                  role="menuitem"
                  disabled={item.disabled}
                  title={item.disabled ? item.disabledReason : undefined}
                  onClick={() => {
                    item.onSelect?.();
                    close();
                  }}
                  className={cn(
                    "duration-instant ease-brand flex w-full cursor-pointer items-center gap-2.5 px-3 py-2 text-left text-[13px] transition-colors",
                    "disabled:pointer-events-none disabled:opacity-40",
                    item.danger
                      ? "text-danger hover:bg-danger/10"
                      : "text-fg-2 hover:bg-wash-hover hover:text-fg",
                  )}
                >
                  {item.icon && (
                    <span className="shrink-0 [&_svg]:size-3.5">{item.icon}</span>
                  )}
                  <span className="truncate">{item.label}</span>
                </button>
              </div>
            ))}
          </div>,
          target,
        )}
    </>
  );
}
