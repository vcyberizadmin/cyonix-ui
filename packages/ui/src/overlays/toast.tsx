"use client";

/**
 * CX-TST — ToastProvider and useToast.
 *
 * Tenant's version wins because it is tokenized and pulls in NO dependency. SOC
 * uses react-hot-toast, which ships its own unthemed styling for a component
 * this small; adopting this lets SOC drop it.
 *
 * Rules encoded here:
 *  · Bottom-right, 360px max, radius-md, e-3. Stacks upward with 8px gaps.
 *  · Semantic left rule PLUS an icon — never colour alone.
 *  · Success dismisses after 4s; errors persist until dismissed.
 *  · aria-live="polite", assertive for errors only.
 *  · Undo stays available for the full display duration.
 *
 * The standard lists two gaps against Tenant's version, and both are closed:
 *  · "No queue cap" — `max` bounds what is on screen so a bulk action cannot
 *    flood the corner.
 *  · "No dedupe" — a repeat of the same toast increments a count instead of
 *    stacking another copy.
 *
 * A toast is EASILY MISSED. It must never be the only channel for something
 * consequential — anything that matters also belongs in the audit log.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "../lib/cn.js";
import { usePortalTarget } from "./use-overlay.js";

export type ToastTone = "success" | "error" | "warning" | "info";

export interface ToastOptions {
  tone?: ToastTone;
  title: string;
  description?: string;
  /** Available for the toast's whole display duration. */
  undo?: { label?: string; onUndo: () => void };
  /** ms. 0 never auto-dismisses. Defaults: 0 for `error`, 4000 otherwise. */
  duration?: number;
  /**
   * Dedupe key. A repeat with the same key increments a count on the existing
   * toast rather than stacking a copy. Defaults to `tone` + `title`.
   */
  key?: string;
}

interface ToastRecord extends ToastOptions {
  id: number;
  dedupeKey: string;
  count: number;
  resolvedDuration: number;
}

interface ToastApi {
  toast: (options: ToastOptions) => void;
  dismiss: (id: number) => void;
  dismissAll: () => void;
}

const ToastContext = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const api = useContext(ToastContext);
  if (!api) {
    throw new Error("useToast must be used inside a <ToastProvider>.");
  }
  return api;
}

const TONE: Record<ToastTone, { rule: string; ink: string; glyph: string }> = {
  success: { rule: "border-l-ok", ink: "text-ok-ink", glyph: "✓" },
  error: { rule: "border-l-danger", ink: "text-danger-ink", glyph: "✕" },
  warning: { rule: "border-l-warning", ink: "text-warning-ink", glyph: "!" },
  info: { rule: "border-l-info", ink: "text-info-ink", glyph: "i" },
};

export interface ToastProviderProps {
  children: ReactNode;
  /** Most toasts on screen at once. Oldest is dropped past this. */
  max?: number;
}

export function ToastProvider({ children, max = 4 }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);
  const nextId = useRef(1);
  const target = usePortalTarget();

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((entry) => entry.id !== id));
  }, []);

  const dismissAll = useCallback(() => setToasts([]), []);

  const toast = useCallback(
    (options: ToastOptions) => {
      const tone = options.tone ?? "info";
      const dedupeKey = options.key ?? `${tone}:${options.title}`;
      // Errors persist; everything else clears itself.
      const resolvedDuration =
        options.duration ?? (tone === "error" ? 0 : 4000);

      setToasts((current) => {
        const existing = current.find((entry) => entry.dedupeKey === dedupeKey);
        if (existing) {
          // Dedupe: bump the count and refresh the timer rather than stack.
          return current.map((entry) =>
            entry.dedupeKey === dedupeKey
              ? { ...entry, count: entry.count + 1, id: nextId.current++ }
              : entry,
          );
        }
        const record: ToastRecord = {
          ...options,
          tone,
          id: nextId.current++,
          dedupeKey,
          count: 1,
          resolvedDuration,
        };
        const next = [...current, record];
        // Queue cap: drop the oldest so a bulk action cannot bury the screen.
        return next.length > max ? next.slice(next.length - max) : next;
      });
    },
    [max],
  );

  const api = useMemo<ToastApi>(
    () => ({ toast, dismiss, dismissAll }),
    [toast, dismiss, dismissAll],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      {target &&
        createPortal(
          // Bottom-right. `pointer-events-none` on the stack so it never blocks
          // the primary action underneath; each toast re-enables its own.
          <div
            className="pointer-events-none fixed right-4 bottom-4 z-50 flex w-full max-w-[360px] flex-col-reverse gap-2"
            // Polite for the region; individual errors escalate below.
            aria-live="polite"
            aria-atomic="false"
          >
            {toasts.map((entry) => (
              <ToastItem
                key={entry.dedupeKey}
                record={entry}
                onDismiss={() => dismiss(entry.id)}
              />
            ))}
          </div>,
          target,
        )}
    </ToastContext.Provider>
  );
}

function ToastItem({
  record,
  onDismiss,
}: {
  record: ToastRecord;
  onDismiss: () => void;
}) {
  const tone = TONE[record.tone ?? "info"];

  // Re-keyed by id on dedupe, so a repeat restarts the countdown.
  useEffect(() => {
    if (record.resolvedDuration <= 0) return;
    const timer = setTimeout(onDismiss, record.resolvedDuration);
    return () => clearTimeout(timer);
  }, [record.id, record.resolvedDuration, onDismiss]);

  return (
    <div
      // Errors are the only ones that interrupt.
      role={record.tone === "error" ? "alert" : "status"}
      aria-live={record.tone === "error" ? "assertive" : undefined}
      className={cn(
        "bg-surface border-rule shadow-e3 animate-fade-in pointer-events-auto flex items-start gap-3 rounded-md border border-l-2 px-4 py-3",
        tone.rule,
      )}
    >
      {/* Icon as well as colour — never colour alone. */}
      <span
        aria-hidden="true"
        className={cn(
          "mt-0.5 grid size-4 shrink-0 place-items-center rounded-full text-[10px] font-bold",
          tone.ink,
        )}
      >
        {tone.glyph}
      </span>

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="text-fg flex items-center gap-2 text-[13px] font-semibold">
          <span className="truncate">{record.title}</span>
          {record.count > 1 && (
            <span className="bg-wash-2 text-fg-2 shrink-0 rounded-full px-1.5 font-mono text-[10px] tabular-nums">
              ×{record.count}
            </span>
          )}
        </p>
        {record.description && (
          <p className="text-fg-2 text-small">{record.description}</p>
        )}
        {record.undo && (
          <button
            type="button"
            onClick={() => {
              record.undo?.onUndo();
              onDismiss();
            }}
            // brightness rather than an accent-hover token: the CX-TOK contract has no
            // such token, and Button handles accent hover the same way.
            className="text-accent-ink duration-instant ease-brand mt-1 w-fit cursor-pointer text-[12px] font-semibold underline underline-offset-2 transition-[filter] hover:brightness-110"
          >
            {record.undo.label ?? "Undo"}
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="text-fg-muted hover:text-fg duration-instant ease-brand -mt-0.5 -mr-1 grid size-6 shrink-0 cursor-pointer place-items-center rounded-sm transition-colors"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
          className="size-3"
        >
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
