import { cn } from "./lib/cn.js";
import {
  isLive,
  SEVERITY_META,
  TONE_STYLES,
  toneFor,
  type Severity,
  type StatusTone,
  type StatusVocabulary,
} from "./lib/status.js";

/**
 * CX-STA — StatusPill and SeverityBadge.
 *
 * Server-safe: no state, no handlers, so both render from a Server Component.
 *
 * The two read differently ON PURPOSE. A semantic pill carries a shaped DOT; a
 * severity badge carries a 3px LEADING BAR. That difference is what lets an
 * operator tell "what happened" from "how bad" at a glance, before reading
 * either label.
 */

export interface StatusPillProps {
  /** Business status, e.g. "Active", "Running", "Failed". */
  status: string;
  /** Override the derived tone for a status outside the vocabulary. */
  tone?: StatusTone;
  /** App-specific vocabulary from `extendVocabulary`. */
  vocabulary?: StatusVocabulary;
  /** Force the liveness pulse on or off. Defaults to what the vocabulary says. */
  live?: boolean;
  className?: string;
}

export function StatusPill({
  status,
  tone,
  vocabulary,
  live,
  className,
}: StatusPillProps) {
  const resolved = tone ?? toneFor(status, vocabulary);
  const styles = TONE_STYLES[resolved];
  const pulsing = live ?? isLive(status, vocabulary);

  return (
    <span
      className={cn(
        "inline-flex h-[22px] items-center gap-1.5 rounded-sm border px-[.55rem] text-[10.5px] font-extrabold tracking-[.03em] whitespace-nowrap",
        styles.pill,
        className,
      )}
    >
      {/* aria-hidden: the label already carries the meaning, so the shape must
          not be announced twice. */}
      <i
        aria-hidden="true"
        className={cn(
          "size-2 shrink-0",
          styles.dot,
          pulsing && "animate-pulse",
        )}
      />
      {status}
    </span>
  );
}

export interface SeverityBadgeProps {
  severity: Severity;
  /** Renders the expected response beside the rank — "Immediate action ·
   *  page on-call". Worth the width in a triage queue. */
  withAction?: boolean;
  className?: string;
}

export function SeverityBadge({
  severity,
  withAction,
  className,
}: SeverityBadgeProps) {
  const meta = SEVERITY_META[severity];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 overflow-hidden rounded-sm border py-0.5 pr-2 pl-0 text-[11px] font-semibold whitespace-nowrap",
        meta.surface,
        meta.text,
        className,
      )}
    >
      {/* 3px leading bar, not a dot — the shape that separates ranked from
          semantic before either label is read. */}
      <i aria-hidden="true" className={cn("h-4 w-[3px] shrink-0", meta.bar)} />
      {severity}
      {withAction && (
        <span className="text-fg-2 font-normal">{meta.action}</span>
      )}
    </span>
  );
}
