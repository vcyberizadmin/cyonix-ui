/**
 * CX-DEF — DefinitionCard and DescriptionList.
 *
 * A definition object is anything an operator configures once and then applies
 * many times: a role, a playbook, a detection rule, a connector, a module. All
 * three consoles have several, and all three describe them differently. The
 * standard names VAPT's role card as the best card-grid pattern of the three and
 * asks for it generalised — this is that, ported from HTML to React.
 *
 * Server-safe: no state, no hooks. An action can be a link (`href` +
 * `linkComponent`) so a whole grid renders with zero client JS; `onSelect` is
 * available for callers already inside a client boundary.
 *
 * Rules encoded here:
 *  · Auto-fit grid, minimum 320px — use `TileGrid min={320}`.
 *  · Title in display; rank right-aligned in secondary ink.
 *  · Capability chips in MONO, so machine values look like machine values, and
 *    overflowing to +n rather than growing the card.
 *  · Footer meta separated by a hairline.
 *  · A read-only object shows its action DISABLED WITH THE REASON rather than
 *    hiding it. Hiding the control teaches nothing; a disabled control with
 *    "Built-in definitions cannot be edited — clone to customise" teaches the
 *    whole model. The type requires the reason whenever `readOnly` is set.
 *  · Descriptions are clamped and the footer is pushed to the bottom, so a grid
 *    of cards with uneven text is not ragged — the standard's recorded cost.
 */
import type { ElementType, ReactNode } from "react";
import { ChipStack, type ChipStackItem } from "./tag.js";
import { cn } from "./lib/cn.js";

/* ----------------------------------------------------------- DescriptionList -- */

export interface DescriptionItem {
  label: ReactNode;
  /**
   * `null`, `undefined` and `""` all render an em-dash rather than nothing. A
   * blank value is indistinguishable from a rendering bug, and "no value" is
   * itself information in an audit view.
   */
  value: ReactNode;
  /** Machine value — ID, hash, version, hostname. */
  mono?: boolean;
}

export interface DescriptionListProps {
  items: DescriptionItem[];
  /**
   * `inline`  — label left, value right, hairline between rows. The detail-pane
   *             default: scannable down the labels.
   * `stacked` — label above value in a responsive two-column grid. Better when
   *             values are long enough to wrap.
   */
  layout?: "inline" | "stacked";
  className?: string;
}

const EMPTY = "—";

function isEmpty(value: ReactNode): boolean {
  return value === null || value === undefined || value === "";
}

export function DescriptionList({
  items,
  layout = "inline",
  className,
}: DescriptionListProps) {
  if (layout === "stacked") {
    return (
      <dl
        className={cn(
          "grid grid-cols-1 gap-x-8 gap-y-4 min-[560px]:grid-cols-2",
          className,
        )}
      >
        {items.map((item, index) => (
          <div key={index} className="flex min-w-0 flex-col gap-1">
            <dt className="text-fg-muted text-[10.5px] font-semibold tracking-[0.1em] uppercase">
              {item.label}
            </dt>
            <dd
              className={cn(
                "text-fg text-small min-w-0 break-words",
                item.mono && "font-mono",
                isEmpty(item.value) && "text-fg-muted",
              )}
            >
              {isEmpty(item.value) ? EMPTY : item.value}
            </dd>
          </div>
        ))}
      </dl>
    );
  }

  return (
    // Hairlines between rows, never space alone — the brand's separation rule.
    <dl className={cn("divide-rule flex flex-col divide-y", className)}>
      {items.map((item, index) => (
        <div
          key={index}
          className="flex items-baseline justify-between gap-6 py-2.5 first:pt-0 last:pb-0"
        >
          <dt className="text-fg-2 text-small shrink-0">{item.label}</dt>
          <dd
            className={cn(
              "text-fg text-small min-w-0 text-right break-words",
              item.mono && "font-mono",
              isEmpty(item.value) && "text-fg-muted",
            )}
          >
            {isEmpty(item.value) ? EMPTY : item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/* ------------------------------------------------------------ DefinitionCard -- */

export interface DefinitionAction {
  label: string;
  /** For a caller inside a client boundary. */
  onSelect?: () => void;
  /** For a server-rendered grid. Takes precedence over `onSelect`. */
  href?: string;
  linkComponent?: ElementType;
}

interface DefinitionCardBase {
  title: ReactNode;
  /** Right-aligned qualifier in secondary ink — a rank, a level, a count. */
  rank?: ReactNode;
  /** Marks a built-in, so custom and shipped definitions are distinguishable
   *  at a glance. */
  isDefault?: boolean;
  defaultLabel?: string;
  /** Plain language, not the object's own jargon. Clamped to three lines. */
  description?: ReactNode;
  /** What it grants. Rendered mono, overflowing to +n. */
  capabilities?: ChipStackItem[];
  maxCapabilities?: number;
  /**
   * Provenance — version, author, date. Joined with the brand's middot so the
   * audit question is answered before it is asked.
   */
  meta?: ReactNode[];
  /** Typically Clone. */
  action?: DefinitionAction;
  className?: string;
}

/**
 * `readOnlyReason` is required whenever `readOnly` is set. The whole point of
 * showing a disabled action instead of hiding it is the explanation; a disabled
 * button with no reason is worse than no button at all.
 */
export type DefinitionCardProps = DefinitionCardBase &
  ({ readOnly?: false; readOnlyReason?: never } | { readOnly: true; readOnlyReason: string });

export function DefinitionCard({
  title,
  rank,
  isDefault,
  defaultLabel = "Default",
  description,
  capabilities,
  maxCapabilities = 4,
  meta,
  action,
  readOnly,
  readOnlyReason,
  className,
}: DefinitionCardProps) {
  const ActionRoot = (
    readOnly ? "button" : action?.href ? (action.linkComponent ?? "a") : "button"
  ) as ElementType;

  return (
    <div
      className={cn(
        // h-full + flex-col is what keeps a grid of uneven cards aligned: the
        // footer is pushed down rather than floating under a short description.
        "border-rule bg-surface flex h-full flex-col rounded-md border p-5",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1.5">
          <h3 className="font-display text-fg truncate text-[15px] font-semibold">
            {title}
          </h3>
          {isDefault && (
            <span className="text-fg-muted border-rule w-fit rounded-sm border px-1.5 py-0.5 text-[9px] font-semibold tracking-wider uppercase">
              {defaultLabel}
            </span>
          )}
        </div>
        {rank != null && (
          <span className="text-fg-2 shrink-0 text-[11px] font-medium tabular-nums">
            {rank}
          </span>
        )}
      </div>

      {description != null && (
        <p className="text-fg-2 text-small mt-3 line-clamp-3">{description}</p>
      )}

      {capabilities && capabilities.length > 0 && (
        <div className="mt-4 min-w-0">
          <ChipStack items={capabilities} max={maxCapabilities} mono />
        </div>
      )}

      {(meta?.length || action || readOnly) && (
        <div className="border-rule mt-auto flex items-center justify-between gap-3 border-t pt-3.5">
          {meta?.length ? (
            <p className="text-fg-muted min-w-0 truncate font-mono text-[10.5px]">
              {meta.map((entry, index) => (
                <span key={index}>
                  {index > 0 && <span aria-hidden="true"> · </span>}
                  {entry}
                </span>
              ))}
            </p>
          ) : (
            <span />
          )}

          {action && (
            <ActionRoot
              {...(readOnly
                ? { type: "button", disabled: true, title: readOnlyReason }
                : action.href
                  ? { href: action.href }
                  : { type: "button", onClick: action.onSelect })}
              className={cn(
                "duration-instant ease-brand shrink-0 rounded-sm px-2 py-1 text-[12px] font-semibold transition-colors",
                readOnly
                  ? "text-fg-muted cursor-not-allowed"
                  : "text-accent-ink hover:bg-wash-accent cursor-pointer",
              )}
            >
              {action.label}
            </ActionRoot>
          )}
        </div>
      )}

      {/* The reason, in text as well as in the tooltip. A title attribute alone
          is unreachable by touch and by most screen readers. */}
      {readOnly && (
        <p className="text-fg-muted mt-2 text-[10.5px] leading-snug">
          {readOnlyReason}
        </p>
      )}
    </div>
  );
}
