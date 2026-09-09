/**
 * Annotation — a term in prose that explains itself.
 *
 * A case narrative names hosts, users, hashes and domains inline. An analyst
 * reading it needs to know what `FIN-WS-2214` is without leaving the sentence,
 * and a footnote or a link both break the reading to answer. So the term
 * carries its own explanation: bold, dotted underline, `cursor: help`, and a
 * panel on hover or focus.
 *
 * HOVER IS NOT ENOUGH, which is why `tabIndex` is set. A term whose meaning is
 * only reachable with a pointer is unreachable to a keyboard, and these terms
 * are the load-bearing nouns of the narrative — not decoration. Focus opens the
 * same panel, and `aria-describedby` ties it to the term so a screen reader
 * reads the explanation as part of it.
 *
 * The underline is dotted rather than solid on purpose: solid reads as a link
 * and invites a click that goes nowhere.
 *
 * Server-safe: the panel is CSS-only, no state and no directive.
 */
import { useId, type ReactNode } from "react";
import { cn } from "./lib/cn.js";
import { TONE_TINT, type Tone } from "./lib/status.js";

export interface AnnotationProps {
  /** The term as it reads in the sentence. */
  children: ReactNode;
  /** What kind of thing it is — "Asset", "Identity", "Domain". */
  kind?: ReactNode;
  /** Tints the kind tag. */
  tone?: Tone;
  /** The canonical value, set in mono. Omit when it equals the term. */
  value?: ReactNode;
  /** One line on why it matters. */
  note?: ReactNode;
  /** Anything further — threat intel, a linked case. Rendered under a rule. */
  detail?: ReactNode;
  className?: string;
}

export function Annotation({
  children,
  kind,
  tone = "neutral",
  value,
  note,
  detail,
  className,
}: AnnotationProps) {
  const id = useId();

  return (
    <span
      // cursor-help rather than pointer: there is nothing to click.
      className={cn(
        "text-fg relative font-extrabold [border-bottom:1.5px_dotted_color-mix(in_srgb,var(--accent)_65%,transparent)]",
        "cursor-help focus:outline-none",
        "group/annotation",
        className,
      )}
      tabIndex={0}
      aria-describedby={id}
    >
      {children}
      <span
        id={id}
        role="tooltip"
        className={cn(
          "bg-surface shadow-3 pointer-events-none absolute top-[calc(100%+8px)] left-0 z-60 block w-[300px] max-w-[min(300px,calc(100vw-3rem))] rounded-lg p-[.7rem_.8rem]",
          "invisible opacity-0 transition-opacity duration-instant ease-brand",
          "group-hover/annotation:visible group-hover/annotation:opacity-100",
          "group-focus/annotation:visible group-focus/annotation:opacity-100",
        )}
      >
        {(kind || value) && (
          <span className="flex items-center gap-2">
            {kind && (
              <span
                className={cn(
                  "inline-flex h-[22px] shrink-0 items-center rounded-sm px-[.55rem] text-[10.5px] font-extrabold tracking-[.03em] uppercase",
                  TONE_TINT[tone],
                )}
              >
                {kind}
              </span>
            )}
            {value && (
              <span className="text-fg truncate font-mono text-[11.5px] font-semibold">
                {value}
              </span>
            )}
          </span>
        )}
        {note && (
          <span className="text-fg-2 mt-1.5 block text-[12px] leading-relaxed font-medium">
            {note}
          </span>
        )}
        {detail && (
          <span className="border-rule mt-2 block border-t pt-2">{detail}</span>
        )}
      </span>
    </span>
  );
}
