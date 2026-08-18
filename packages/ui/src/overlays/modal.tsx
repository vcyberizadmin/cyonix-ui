"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { useId, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";
import { cn } from "../lib/cn.js";
import { usePortalTarget, useOverlay } from "./use-overlay.js";

/**
 * CX-MOD — a focused task without losing page context.
 *
 * Brand rules encoded here:
 *  · Scrim is Onyx at 80% with a 2px blur. Panel takes radius-lg and e-4.
 *  · Header, body and footer separated by hairlines; the footer sits on the
 *    wash with actions right-aligned.
 *  · Enters on the 400ms emphasis curve.
 *  · Focus lands on the panel, not the first input, so a screen reader hears the
 *    title first.
 */

const panel = cva(
  "bg-surface border-rule text-fg relative flex max-h-[calc(100dvh-4rem)] w-full flex-col rounded-lg border shadow-e4 focus:outline-none",
  {
    variants: {
      size: {
        sm: "max-w-md",
        md: "max-w-xl",
        lg: "max-w-3xl",
      },
    },
    defaultVariants: { size: "md" },
  },
);

export interface ModalProps extends VariantProps<typeof panel> {
  open: boolean;
  onClose: () => void;
  /** Accessible name. Rendered in the header unless `hideTitle`. */
  title: ReactNode;
  /** Sits under the title in secondary ink. */
  description?: ReactNode;
  children?: ReactNode;
  /** Right-aligned action row on the wash. */
  footer?: ReactNode;
  /**
   * Clicking the scrim dismisses. Turn OFF for anything with unsaved input —
   * the standard requires a form with pending changes to confirm instead.
   */
  closeOnScrimClick?: boolean;
  /** Focus this on open instead of the panel. Used by ConfirmDialog to put
   *  default focus on Cancel. */
  initialFocus?: RefObject<HTMLElement | null>;
  className?: string;
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size,
  closeOnScrimClick = true,
  initialFocus,
  className,
}: ModalProps) {
  const target = usePortalTarget();
  const titleId = useId();
  const descriptionId = useId();
  const { panelRef } = useOverlay<HTMLDivElement>({
    open,
    onClose,
    initialFocus,
  });

  if (!open || !target) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-8"
      // Scrim is Onyx at 80% with a 2px blur.
      style={{ backgroundColor: "rgb(6 6 8 / 0.8)", backdropFilter: "blur(2px)" }}
      onClick={closeOnScrimClick ? onClose : undefined}
    >
      <div
        ref={panelRef}
        // tabIndex lets focus land here rather than on the first field.
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        // The panel must not inherit the scrim's dismiss handler.
        onClick={(event) => event.stopPropagation()}
        className={cn(panel({ size }), "animate-modal-in", className)}
      >
        <div className="border-rule flex shrink-0 flex-col gap-1 border-b px-6 py-4">
          <h2 id={titleId} className="font-display text-h3 font-semibold">
            {title}
          </h2>
          {description && (
            <p id={descriptionId} className="text-fg-2 text-small">
              {description}
            </p>
          )}
        </div>

        {/* Long content scrolls here while header and footer stay put. */}
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>

        {footer && (
          <div className="border-rule bg-wash-1 flex shrink-0 items-center justify-end gap-3 border-t px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>,
    target,
  );
}
