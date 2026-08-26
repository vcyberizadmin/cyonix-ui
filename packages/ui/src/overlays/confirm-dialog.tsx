"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "../button.js";
import { cn } from "../lib/cn.js";
import { Modal } from "./modal.js";

/**
 * CX-CNF — confirm dialog and impact box.
 *
 * The standard calls Tenant's destructive-confirmation "the strongest single
 * piece of UX across the three consoles". The rules that make it work, all
 * encoded here:
 *
 *  · The title states the CONSEQUENCE, not the verb — "Remove Vantage Public
 *    Sector from view", never "Are you sure?".
 *  · The impact box enumerates exactly what happens, with the reversible line
 *    in the success tone. That green is the only green in a red dialog, which
 *    is precisely why it lands.
 *  · A guidance line distinguishes this action from its neighbours.
 *  · The footer carries actor attribution, setting the expectation that
 *    everything is audited.
 *  · The confirm button names the act ("Delete from view"), never "OK".
 *  · Cancel holds default focus; confirm is never the Enter key.
 *  · Irreversible actions require typing the record name. Reversible ones do
 *    not — friction is reserved for where it counts.
 */

export interface ImpactItem {
  text: ReactNode;
  /** Renders in the success tone — the one green line in a red dialog. */
  reversible?: boolean;
}

export interface ImpactBoxProps {
  title?: ReactNode;
  items: ImpactItem[];
  className?: string;
}

export function ImpactBox({
  title = "What happens",
  items,
  className,
}: ImpactBoxProps) {
  return (
    <div className={cn("bg-wash-1 border-rule rounded-md border p-4", className)}>
      <p className="text-fg-muted text-label mb-2 font-semibold tracking-[0.08em] uppercase">
        {title}
      </p>
      <ul className="flex flex-col gap-1.5">
        {items.map((item, index) => (
          <li
            key={index}
            className={cn(
              "text-small flex gap-2",
              item.reversible ? "text-ok-ink" : "text-fg-2",
            )}
          >
            <span aria-hidden="true" className="shrink-0 select-none">
              {item.reversible ? "↺" : "•"}
            </span>
            <span>{item.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  /** State the consequence, not the verb. */
  title: ReactNode;
  description?: ReactNode;
  impact?: ImpactBoxProps;
  /** "Use Deactivate if you only need to pause access." */
  guidance?: ReactNode;
  /** Name the act. Never "OK". */
  confirmLabel: string;
  cancelLabel?: string;
  /** "Recorded as A. Fernando" */
  actor?: ReactNode;
  /**
   * Require typing this exact phrase before confirm enables. Use ONLY for
   * irreversible actions — type-to-confirm frustrates bulk work.
   */
  confirmPhrase?: string;
  /** Capture a reason, surfaced in the audit log. */
  reason?: { label: string; placeholder?: string; required?: boolean };
  onReasonChange?: (reason: string) => void;
  /** Holds the confirm button in progress and blocks double-submit. */
  pending?: boolean;
  children?: ReactNode;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  impact,
  guidance,
  confirmLabel,
  cancelLabel = "Cancel",
  actor,
  confirmPhrase,
  reason,
  onReasonChange,
  pending = false,
  children,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement | null>(null);
  const [typed, setTyped] = useState("");
  const [reasonText, setReasonText] = useState("");

  // Reset per opening, so a previous attempt never pre-arms the next one.
  useEffect(() => {
    if (open) {
      setTyped("");
      setReasonText("");
    }
  }, [open]);

  const phraseSatisfied = !confirmPhrase || typed.trim() === confirmPhrase;
  const reasonSatisfied = !reason?.required || reasonText.trim().length > 0;
  const canConfirm = phraseSatisfied && reasonSatisfied && !pending;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size="sm"
      initialFocus={cancelRef}
      // A destructive dialog must not be dismissable by a stray scrim click.
      closeOnScrimClick={false}
      footer={
        // Attribution gets its own row rather than competing with the buttons.
        // At `sm` there is no room beside them, and truncating it to
        // "Recorded as A. Fer…" defeats the point of stating who is on record.
        <div className="flex w-full flex-col gap-3">
          {actor && (
            <span className="text-fg-muted text-small">{actor}</span>
          )}
          <div className="flex items-center justify-end gap-3">
            <Button ref={cancelRef} variant="outline" onClick={onClose}>
              {cancelLabel}
            </Button>
            <Button
              variant="danger"
              onClick={onConfirm}
              disabled={!canConfirm}
              loading={pending}
            >
              {confirmLabel}
            </Button>
          </div>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        {impact && <ImpactBox {...impact} />}

        {guidance && (
          <p className="text-fg-2 text-small">
            <span className="text-fg font-semibold">Consider: </span>
            {guidance}
          </p>
        )}

        {children}

        {reason && (
          <label className="flex flex-col gap-1.5">
            <span className="text-fg text-small font-medium">
              {reason.label}
              {!reason.required && (
                <span className="text-fg-muted font-normal"> (optional)</span>
              )}
            </span>
            <textarea
              rows={3}
              placeholder={reason.placeholder}
              value={reasonText}
              onChange={(event) => {
                setReasonText(event.target.value);
                onReasonChange?.(event.target.value);
              }}
              className="bg-wash-1 border-rule text-fg placeholder:text-fg-2 focus:border-focus duration-instant ease-brand rounded-sm border px-3 py-2 text-[13px] transition-colors focus:outline-none"
            />
          </label>
        )}

        {confirmPhrase && (
          <label className="flex flex-col gap-1.5">
            <span className="text-fg text-small font-medium">
              Type <code className="text-danger-ink font-mono">{confirmPhrase}</code>{" "}
              to confirm
            </span>
            <input
              value={typed}
              onChange={(event) => setTyped(event.target.value)}
              // Enter must never confirm — the standard is explicit. There is no
              // form element here, so Enter cannot implicitly submit either.
              onKeyDown={(event) => {
                if (event.key === "Enter") event.preventDefault();
              }}
              autoComplete="off"
              spellCheck={false}
              className="bg-wash-1 border-rule text-fg focus:border-focus duration-instant ease-brand rounded-sm border px-3 py-2 font-mono text-[13px] transition-colors focus:outline-none"
            />
          </label>
        )}
      </div>
    </Modal>
  );
}
