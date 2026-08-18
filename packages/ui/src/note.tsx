/**
 * CX-INS — Note and InsightPanel. Server-safe.
 *
 * Note is an inline callout with four semantic tones and a REFUSAL to accept a
 * brand tone. That refusal is enforced in the type below rather than documented
 * in prose: orange marks the current location and the primary action, so a
 * callout tinted orange competes with both. `NoteTone` simply has no brand
 * member, which makes the misuse unrepresentable.
 *
 * InsightPanel is the AI-output surface. It carries a labelled badge header so
 * machine-generated text is never mistaken for system fact, and it cites the
 * records it derives from so a claim can be checked.
 */
import type { ElementType, ReactNode } from "react";
import { cn } from "./lib/cn.js";

/** Four tones. No brand member, by design — see the file header. */
export type NoteTone = "info" | "warning" | "danger" | "success";

/** 30% semantic border, 10% tint. */
const NOTE_TONES: Record<NoteTone, string> = {
  info: "border-info/30 bg-info/10",
  warning: "border-warning/30 bg-warning/10",
  danger: "border-danger/30 bg-danger/10",
  success: "border-ok/30 bg-ok/10",
};

const NOTE_INK: Record<NoteTone, string> = {
  info: "text-info",
  warning: "text-warning",
  danger: "text-danger",
  success: "text-ok",
};

export interface NoteProps {
  tone?: NoteTone;
  title?: ReactNode;
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
}

/**
 * Place a Note ADJACENT to what it describes, never at the top of a long form.
 * They also accumulate: three notes on one form and none of them get read.
 */
export function Note({
  tone = "info",
  title,
  children,
  icon,
  className,
}: NoteProps) {
  return (
    <div
      className={cn(
        "flex gap-3 rounded-sm border px-4 py-3",
        NOTE_TONES[tone],
        className,
      )}
    >
      {icon && (
        <span
          aria-hidden="true"
          className={cn("mt-0.5 shrink-0 [&_svg]:size-4", NOTE_INK[tone])}
        >
          {icon}
        </span>
      )}
      <div className="flex min-w-0 flex-col gap-1">
        {title && (
          <p className={cn("text-[13px] font-semibold", NOTE_INK[tone])}>
            {title}
          </p>
        )}
        <div className="text-fg-2 text-small">{children}</div>
      </div>
    </div>
  );
}

export interface InsightSource {
  label: ReactNode;
  href?: string;
}

export interface InsightPanelProps {
  /** Badge text. Keep it explicit about being machine-generated. */
  label?: string;
  /**
   * Confidence signal. The standard records that without one, an insight panel
   * "reads as certainty" — so this renders beside the badge rather than being
   * left to the prose.
   */
  confidence?: "high" | "medium" | "low";
  children: ReactNode;
  /** The records this derives from, so a claim can be checked. */
  sources?: InsightSource[];
  /** Suggested next actions as a chip row. NEVER auto-executed. */
  actions?: ReactNode;
  /** Link implementation for sources; defaults to `a`. */
  linkComponent?: ElementType;
  className?: string;
}

const CONFIDENCE_INK = {
  high: "text-ok",
  medium: "text-warning",
  low: "text-fg-muted",
} as const;

export function InsightPanel({
  label = "AI insight",
  confidence,
  children,
  sources,
  actions,
  linkComponent,
  className,
}: InsightPanelProps) {
  const Link = (linkComponent ?? "a") as ElementType;

  return (
    <div
      className={cn(
        // Info-tinted, radius-md. Never orange.
        "border-info/30 bg-info/10 flex flex-col gap-3 rounded-md border p-4",
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        {/* Labelled badge header: in a security product, marking AI output is a
            trust requirement, not a nicety. */}
        <span className="bg-info/20 text-info rounded-sm px-1.5 py-0.5 text-[10px] font-bold tracking-[0.08em] uppercase">
          {label}
        </span>
        {confidence && (
          <span
            className={cn(
              "text-[11px] font-semibold",
              CONFIDENCE_INK[confidence],
            )}
          >
            {confidence} confidence
          </span>
        )}
      </div>

      <div className="text-fg-2 text-small">{children}</div>

      {sources && sources.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="text-fg-muted text-[10px] font-semibold tracking-[0.08em] uppercase">
            Derived from
          </span>
          {sources.map((source, index) =>
            source.href ? (
              <Link
                key={index}
                href={source.href}
                className="text-info decoration-info/40 text-[11px] underline underline-offset-2 hover:decoration-current"
              >
                {source.label}
              </Link>
            ) : (
              <span key={index} className="text-fg-2 font-mono text-[11px]">
                {source.label}
              </span>
            ),
          )}
        </div>
      )}

      {actions && (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      )}
    </div>
  );
}
