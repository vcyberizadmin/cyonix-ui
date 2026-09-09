/**
 * QueueRow — one record as a dense row, for a triage queue.
 *
 * The other half of the card/table pair. Where RecordCard arranges a record
 * for reading, this arranges it for scanning: a stack of rows inside one card,
 * each row a whole click target.
 *
 * Anatomy, left to right:
 *  · The severity bar, stretched to the row. Same shape and same job as
 *    RecordCard's, one step narrower because the row is shorter.
 *  · Title at full weight, with its verdict and status tags beside it.
 *  · A `facts` line beneath, which is where the machine detail goes — ids,
 *    rule names, hosts, users, confidence. Use `RowFacts` to get the
 *    dot separators right; a row of facts glued together with commas reads as
 *    prose, and this is not prose.
 *  · `trailing` pins to the right and is HIDDEN below sm: a severity tag and a
 *    relative timestamp are the first things to go when the row runs out of
 *    width, because both are recoverable — the bar still carries rank, and the
 *    row still opens.
 *
 * Sits on --surface-2 at a 16px radius, so a stack of rows reads as elements
 * inside a card rather than as more cards.
 *
 * Server-safe: no state, no directive.
 */
import type { ReactNode } from "react";
import { cn } from "./lib/cn.js";
import { SEVERITY_META, type Severity } from "./lib/status.js";

export interface QueueRowProps {
  severity: Severity;
  title: ReactNode;
  /** Verdict and status tags, beside the title. */
  tags?: ReactNode;
  /** The machine detail line. Wrap in `RowFacts` for the separators. */
  facts?: ReactNode;
  /** Right-pinned, and dropped below sm. Severity tag, relative time. */
  trailing?: ReactNode;
  onOpen?: () => void;
  className?: string;
}

export function QueueRow({
  severity,
  title,
  tags,
  facts,
  trailing,
  onOpen,
  className,
}: QueueRowProps) {
  const Root = onOpen ? "button" : "div";

  return (
    <Root
      {...(onOpen ? { type: "button" as const, onClick: onOpen } : {})}
      className={cn(
        "bg-surface-2 flex items-center gap-[.9rem] rounded-2xl px-4 py-[.8rem] text-left",
        onOpen && "hover:bg-surface-3 duration-instant ease-brand w-full cursor-pointer transition-colors",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "w-[4px] shrink-0 self-stretch rounded-full",
          SEVERITY_META[severity].bar,
        )}
      />

      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="truncate text-[14.5px] font-extrabold">{title}</span>
          {tags}
        </span>
        {facts && (
          <span className="text-fg-2 mt-1 flex flex-wrap items-center gap-2 text-[12px] font-semibold">
            {facts}
          </span>
        )}
      </span>

      {trailing && (
        <span className="hidden shrink-0 flex-col items-end gap-1.5 sm:flex">
          {trailing}
        </span>
      )}

      {onOpen && (
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-fg-muted size-[18px] shrink-0"
        >
          <path d="m9 18 6-6-6-6" />
        </svg>
      )}
    </Root>
  );
}

export interface RowFactsProps {
  /** Each fact as its own node. Separators are inserted between them. */
  items: ReactNode[];
  className?: string;
}

/**
 * Dot separators between facts, and only BETWEEN them — no leading or trailing
 * dot, and none left stranded when a fact is conditionally absent. Doing this
 * by hand in every consumer is how rows end up with "· ·" in them.
 */
export function RowFacts({ items, className }: RowFactsProps) {
  const present = items.filter((item) => item !== null && item !== undefined && item !== false);

  return (
    <>
      {present.map((item, index) => (
        <span key={index} className={cn("flex items-center gap-2", className)}>
          {index > 0 && (
            <span aria-hidden="true" className="text-fg-muted">
              ·
            </span>
          )}
          {item}
        </span>
      ))}
    </>
  );
}
