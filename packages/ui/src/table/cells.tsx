/**
 * CX-TBL cell renderers. Server-safe.
 *
 * These exist as named exports specifically so each app stops re-inventing
 * chips and counts. VAPT already shipped these as one-offs; this is the shared
 * set. A fixed row height fights genuinely multi-value cells, so every one of
 * these renders on a single line and truncates rather than growing.
 */
import type { ReactNode } from "react";
import { cn } from "../lib/cn.js";
import { SEVERITIES, SEVERITY_META, type Severity } from "../lib/status.js";

export interface TwoLineCellProps {
  primary: ReactNode;
  /** Secondary ink beneath. Keep it short — the row height is fixed. */
  secondary?: ReactNode;
  mono?: boolean;
  className?: string;
}

export function TwoLineCell({
  primary,
  secondary,
  mono,
  className,
}: TwoLineCellProps) {
  return (
    <div className={cn("flex min-w-0 flex-col leading-tight", className)}>
      <span className={cn("text-fg truncate text-[13px]", mono && "font-mono")}>
        {primary}
      </span>
      {secondary && (
        <span className="text-fg-muted truncate text-[11px]">{secondary}</span>
      )}
    </div>
  );
}

export type SeverityCountMap = Partial<Record<Severity, number>>;

export interface SeverityCountsProps {
  counts: SeverityCountMap;
  /** Hide ranks with a zero count. On by default — a row of zeros is noise. */
  hideEmpty?: boolean;
  className?: string;
}

/**
 * Compact severity breakdown for a list row. Always in SCALE ORDER, never
 * sorted by magnitude — the position of each number is what makes it scannable
 * down a column.
 */
export function SeverityCounts({
  counts,
  hideEmpty = true,
  className,
}: SeverityCountsProps) {
  const shown = SEVERITIES.filter(
    (severity) => !hideEmpty || (counts[severity] ?? 0) > 0,
  );

  if (shown.length === 0) {
    return <span className="text-fg-muted text-[11px]">—</span>;
  }

  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      {shown.map((severity) => (
        <span
          key={severity}
          title={`${severity}: ${counts[severity] ?? 0}`}
          className="inline-flex items-center gap-1"
        >
          <span
            aria-hidden="true"
            className={cn(
              "h-3 w-[3px] shrink-0",
              SEVERITY_META[severity].bar,
            )}
          />
          <span
            className={cn(
              "font-mono text-[11px] tabular-nums",
              SEVERITY_META[severity].text,
            )}
          >
            {counts[severity] ?? 0}
          </span>
        </span>
      ))}
    </span>
  );
}

export interface DueChipProps {
  /** Days remaining. Negative means overdue. */
  days: number;
  className?: string;
}

/**
 * Due pressure as a tone, paired with words. Never colour alone — "Overdue 3d"
 * still reads in greyscale.
 */
export function DueChip({ days, className }: DueChipProps) {
  const overdue = days < 0;
  const soon = days >= 0 && days <= 2;
  const label = overdue
    ? `Overdue ${Math.abs(days)}d`
    : days === 0
      ? "Due today"
      : `${days}d left`;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm px-1.5 py-0.5 font-mono text-[11px] font-semibold tabular-nums",
        overdue
          ? "text-danger-ink bg-danger/10"
          : soon
            ? "text-warning-ink bg-warning/10"
            : "text-fg-muted bg-wash-2",
        className,
      )}
    >
      {label}
    </span>
  );
}

export interface ProgressProps {
  /** 0–100. Clamped, so a bad number cannot overflow the cell. */
  value: number;
  /** Shows the number beside the bar. */
  showValue?: boolean;
  className?: string;
}

export function Progress({ value, showValue = true, className }: ProgressProps) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <span className={cn("inline-flex min-w-0 items-center gap-2", className)}>
      <span
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        className="bg-wash-2 h-2 w-16 shrink-0 overflow-hidden rounded-full"
      >
        {/* Accent is legitimate here: this is progress, not a status or a rank. */}
        <span
          className="bg-accent block h-full rounded-full"
          style={{ width: `${pct}%` }}
        />
      </span>
      {showValue && (
        <span className="text-fg-2 font-mono text-[11px] tabular-nums">
          {pct}%
        </span>
      )}
    </span>
  );
}
