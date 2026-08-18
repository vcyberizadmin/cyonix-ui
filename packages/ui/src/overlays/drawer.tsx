"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { useId, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "../lib/cn.js";
import { usePortalTarget, useOverlay } from "./use-overlay.js";

/**
 * CX-DRW — inspect a record without leaving the list.
 *
 * The standard calls this "the biggest genuine gap": no console has a shared
 * drawer, VAPT has the pattern in CSS only, and SOC has two independent
 * implementations that behave differently. Built here on VAPT's geometry and the
 * same `useOverlay` hook as the modal, so focus behaves identically.
 *
 * Brand rules encoded here:
 *  · Right-anchored, 480px default and 640px wide, full height, e-3.
 *  · Slides in over 240ms on the standard curve; the scrim fades.
 *  · Header pinned with title and close; footer pinned; body scrolls between.
 *  · On mobile it becomes a bottom sheet at 90vh.
 */

const panel = cva(
  "bg-surface border-rule text-fg relative flex h-dvh w-full flex-col border-l shadow-e3 focus:outline-none",
  {
    variants: {
      width: {
        default: "sm:w-drawer",
        wide: "sm:w-drawer-wide",
      },
    },
    defaultVariants: { width: "default" },
  },
);

export interface DrawerProps extends VariantProps<typeof panel> {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  /** Pinned action row. */
  footer?: ReactNode;
  /**
   * Next/previous through the current *filtered* result set, not the raw table.
   * Omit either to hide that control.
   */
  onNext?: () => void;
  onPrevious?: () => void;
  closeOnScrimClick?: boolean;
  className?: string;
}

function Close() {
  return (
    <svg
      className="size-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

function Step({ dir }: { dir: "up" | "down" }) {
  return (
    <svg
      className="size-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={dir === "up" ? "m18 15-6-6-6 6" : "m6 9 6 6 6-6"} />
    </svg>
  );
}

const iconButton =
  "text-fg-2 hover:text-fg hover:bg-wash-hover duration-instant ease-brand grid size-8 shrink-0 cursor-pointer place-items-center rounded-sm transition-colors disabled:pointer-events-none disabled:opacity-40";

export function Drawer({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  width,
  onNext,
  onPrevious,
  closeOnScrimClick = true,
  className,
}: DrawerProps) {
  const target = usePortalTarget();
  const titleId = useId();
  const descriptionId = useId();
  const { panelRef } = useOverlay<HTMLDivElement>({ open, onClose });

  if (!open || !target) return null;

  return createPortal(
    <div
      className="animate-fade-in fixed inset-0 z-50 flex justify-end max-sm:items-end"
      style={{ backgroundColor: "rgb(6 6 8 / 0.8)", backdropFilter: "blur(2px)" }}
      onClick={closeOnScrimClick ? onClose : undefined}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        onClick={(event) => event.stopPropagation()}
        className={cn(
          panel({ width }),
          // Bottom sheet below sm; right-anchored slide above it.
          "max-sm:h-[90dvh] max-sm:rounded-t-lg max-sm:border-t max-sm:border-l-0",
          "sm:animate-drawer-in",
          className,
        )}
      >
        <div className="border-rule flex shrink-0 items-start gap-3 border-b px-5 py-4">
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="font-display text-h3 truncate font-semibold">
              {title}
            </h2>
            {description && (
              <p id={descriptionId} className="text-fg-2 text-small mt-1">
                {description}
              </p>
            )}
          </div>

          {(onPrevious ?? onNext) && (
            <div className="flex shrink-0 items-center">
              <button
                type="button"
                className={iconButton}
                onClick={onPrevious}
                disabled={!onPrevious}
                aria-label="Previous record"
              >
                <Step dir="up" />
              </button>
              <button
                type="button"
                className={iconButton}
                onClick={onNext}
                disabled={!onNext}
                aria-label="Next record"
              >
                <Step dir="down" />
              </button>
            </div>
          )}

          <button
            type="button"
            className={iconButton}
            onClick={onClose}
            aria-label="Close"
          >
            <Close />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">{children}</div>

        {footer && (
          <div className="border-rule bg-wash-1 flex shrink-0 items-center justify-end gap-3 border-t px-5 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>,
    target,
  );
}
