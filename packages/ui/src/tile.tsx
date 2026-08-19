/**
 * CX-TIL — stat tiles. Three variants, because they answer three questions:
 *
 *   StatTile    "how many"            — the headline number
 *   TrendTile   "which way is it moving"  — delta + sparkline
 *   StatusTile  "is this OK"          — semantic left rail + corner icon
 *
 * The standard is explicit that these ship as three honest variants rather than
 * one tile with eight optional props, and that is what is here.
 *
 * Server-safe: no state, no hooks, no event handlers, so a Server Component can
 * render a dashboard of tiles with zero client JS. Drill-through is therefore a
 * LINK (`href` + `linkComponent`), never an `onClick` — which also happens to be
 * what the standard asks for: "a tile that filters a list is a link and looks
 * like one on hover". A console that needs click behaviour passes its own
 * `linkComponent`.
 *
 * Brand rules encoded here:
 *  · Label 10.5px uppercase secondary; value in display at 30px, tabular-nums.
 *  · NEVER BRAND ORANGE. A KPI is neither a location nor an action, so there is
 *    deliberately no accent tone and no prop that can reach the brand hue —
 *    `TileTone` excludes it by construction, and the hover affordance uses
 *    surface and motion rather than borrowing the accent.
 *  · Semantic colour applies to the value only when the number itself is the
 *    alarm — hence `tone` is opt-in and defaults to no colour at all.
 *  · Deltas state their baseline. `baseline` is REQUIRED by the type whenever
 *    `delta` is present, so a bare percentage will not compile.
 *  · Direction is carried by an arrow AND a word as well as colour, because
 *    red-up is good for "resolved" and bad for "open".
 *  · Tiles sit in an auto-fit grid with a 200px minimum so they wrap rather
 *    than shrink — see TileGrid.
 */
import type { ElementType, ReactNode } from "react";
import { cn } from "./lib/cn.js";
import { TONE_INK, type StatusTone } from "./lib/status.js";
import { describeSeries, sparkPath } from "./lib/spark.js";

/**
 * The tile vocabulary. Derived from the CX-STA semantic tones so a tile and a
 * pill can never disagree, minus `draft` — a KPI has no draft state — and with
 * no brand member, which is the code-level refusal of an accent prop.
 */
export type TileTone = Exclude<StatusTone, "draft">;

/** Which direction is good. There is no correct global default: "open findings
 *  up" is bad, "resolved up" is good. Omitting it yields NO colour rather than
 *  a guess, so the failure mode is a colourless delta, never a wrong one. */
export type TilePolarity = "up-good" | "up-bad" | "neutral";

interface TileCommonProps {
  /** 10.5px uppercase. Kept a string so it cannot grow into a paragraph. */
  label: string;
  /** The headline. A node, so callers own their own number formatting. */
  value: ReactNode;
  /** Denominator or unit — "of 1,204". Sits on the value's baseline. */
  denominator?: ReactNode;
  /** The qualifier line — "1 scanning · 1 in analysis". */
  caption?: ReactNode;
  /** Drill-through target: the filtered list behind the number. */
  href?: string;
  /** Link implementation. Defaults to `a`; apps pass `next/link`. */
  linkComponent?: ElementType;
  className?: string;
}

const LABEL =
  "text-fg-2 text-[10.5px] font-semibold tracking-[0.1em] uppercase leading-none";
const VALUE = "font-display text-h2 font-bold leading-none tabular-nums";

/** Small, so it never competes with the value it annotates. */
const ICON = "size-3.5 shrink-0 [&_svg]:size-full";

function Chevron() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="size-3.5 shrink-0"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

/**
 * The shared shell. Internal on purpose: exporting it would recreate the
 * eight-optional-props tile the standard warns against.
 */
function TileShell({
  label,
  value,
  denominator,
  caption,
  href,
  linkComponent,
  className,
  valueTone,
  rail,
  icon,
  aside,
  below,
}: TileCommonProps & {
  /** Tailwind ink class for the value, or undefined to leave it as body ink. */
  valueTone?: string;
  /** Border classes for the 3px semantic rail (StatusTile only). */
  rail?: string;
  /** Corner icon, already tone-coloured by the caller. */
  icon?: ReactNode;
  /** Sits at the far end of the value row — the sparkline. */
  aside?: ReactNode;
  /** Sits under the caption — the delta line. */
  below?: ReactNode;
}) {
  const isLink = Boolean(href);
  const Root = (isLink ? (linkComponent ?? "a") : "div") as ElementType;
  const hasCorner = Boolean(icon) || isLink;

  return (
    <Root
      {...(isLink ? { href } : {})}
      className={cn(
        "border-rule bg-surface relative overflow-hidden rounded-md border p-4",
        // No shadow at rest: elevation belongs to overlays (CX-CRD).
        // The link affordance is surface + motion, never the accent — a KPI is
        // not an action, even when it navigates.
        isLink &&
          "group hover:bg-wash-1 hover:border-fg-muted/40 duration-instant ease-brand block cursor-pointer transition-colors",
        // The rail is the LEFT BORDER, not a positioned bar. An absolute
        // `inset-y-0 left-0` element resolves against the padding box, so the
        // card's 1px border showed as a hairline of rule colour above, below
        // and to the left of it — measured as 108px of rail in a 110px tile.
        // As a border it is flush and mitres correctly into the radius.
        rail,
        className,
      )}
    >
      {hasCorner && (
        <span className="absolute top-4 right-4 flex items-center gap-2">
          {icon}
          {isLink && (
            <span className="text-fg-muted group-hover:text-fg duration-instant ease-brand transition-[color,transform] group-hover:translate-x-0.5">
              <Chevron />
            </span>
          )}
        </span>
      )}

      {/* A description list, so the label and the value are ASSOCIATED for a
          screen reader without needing useId — which would force this file
          client-side and cost every dashboard its zero-JS render. */}
      <dl className={cn(hasCorner && "pr-12")}>
        <dt className={LABEL}>{label}</dt>
        <dd className="mt-3 flex items-end justify-between gap-3">
          <span className="flex min-w-0 items-baseline gap-1.5">
            <span className={cn(VALUE, valueTone)}>{value}</span>
            {denominator != null && (
              <span className="text-fg-muted text-small truncate">
                {denominator}
              </span>
            )}
          </span>
          {aside}
        </dd>
        {caption != null && (
          <dd className="text-fg-muted mt-2 text-[11px] leading-snug">
            {caption}
          </dd>
        )}
        {below}
      </dl>
    </Root>
  );
}

/* ---------------------------------------------------------------------------
   StatTile — "how many".
   --------------------------------------------------------------------------- */

export interface StatTileProps extends TileCommonProps {
  /**
   * Colours the VALUE. Use it only when the number itself is the alarm — "3
   * critical open" — and not to decorate a healthy metric. Omitted means body
   * ink, which is the right answer for most tiles.
   */
  tone?: TileTone;
}

export function StatTile({ tone, ...rest }: StatTileProps) {
  return (
    <TileShell
      {...rest}
      valueTone={tone && tone !== "neutral" ? TONE_INK[tone].text : undefined}
    />
  );
}

/* ---------------------------------------------------------------------------
   TrendTile — "which way is it moving".
   --------------------------------------------------------------------------- */

function Arrow({ direction }: { direction: "up" | "down" | "flat" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="size-3 shrink-0"
    >
      {direction === "flat" ? (
        <path d="M5 12h14" />
      ) : direction === "up" ? (
        <>
          <path d="M12 19V5" />
          <path d="m5 12 7-7 7 7" />
        </>
      ) : (
        <>
          <path d="M12 5v14" />
          <path d="m19 12-7 7-7-7" />
        </>
      )}
    </svg>
  );
}

/** Neutral polarity, and any zero delta, must not be coloured. */
function deltaTone(delta: number, polarity: TilePolarity): TileTone {
  if (delta === 0 || polarity === "neutral") return "neutral";
  const good = polarity === "up-good" ? delta > 0 : delta < 0;
  return good ? "success" : "danger";
}

/**
 * `baseline` is required alongside `delta` at the TYPE level. The standard's
 * rule — "deltas state their baseline, never a bare percentage" — is the kind
 * of thing a reviewer forgets, so it is a compile error instead of a guideline.
 */
type DeltaProps =
  | {
      delta?: undefined;
      baseline?: never;
      polarity?: never;
      deltaFormat?: never;
    }
  | {
      delta: number;
      /** What the delta is measured against — "vs last 7 days". */
      baseline: string;
      polarity?: TilePolarity;
      /** How to render the magnitude. Defaults to a percentage. */
      deltaFormat?: "percent" | "absolute";
    };

export type TrendTileProps = TileCommonProps & {
  /** Points oldest → newest. Under two points nothing is drawn, because one
   *  reading is not a trend. */
  series?: readonly number[];
} & DeltaProps;

export function TrendTile({
  delta,
  baseline,
  polarity = "neutral",
  deltaFormat = "percent",
  series,
  ...rest
}: TrendTileProps) {
  const tone = delta === undefined ? "neutral" : deltaTone(delta, polarity);
  // TONE_INK.neutral is full-strength body ink, which is too loud for an 11px
  // annotation — an uncoloured delta should recede, not shout.
  const ink = tone === "neutral" ? "text-fg-2" : TONE_INK[tone].text;
  const direction =
    delta === undefined || delta === 0 ? "flat" : delta > 0 ? "up" : "down";
  const word =
    direction === "flat" ? "No change" : direction === "up" ? "Up" : "Down";
  const magnitude =
    delta === undefined || delta === 0
      ? null
      : `${Math.abs(delta)}${deltaFormat === "percent" ? "%" : ""}`;

  const geometry = series ? sparkPath([...series]) : null;

  return (
    <TileShell
      {...rest}
      aside={
        geometry ? (
          <svg
            role="img"
            aria-label={describeSeries(series ?? [])}
            viewBox={`0 0 ${geometry.width} ${geometry.height}`}
            width={geometry.width}
            height={geometry.height}
            fill="none"
            className={cn("shrink-0", ink)}
          >
            {/* Flat fill at low alpha, not a gradient — the standard forbids
                gradients on data marks. */}
            <path d={geometry.area} fill="currentColor" opacity="0.12" />
            <path
              d={geometry.line}
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Terminal dot: without a y-axis, "where it ended" is the one
                thing a sparkline can state precisely. */}
            <circle
              cx={geometry.last.x}
              cy={geometry.last.y}
              r="1.75"
              fill="currentColor"
            />
          </svg>
        ) : undefined
      }
      below={
        delta !== undefined ? (
          <dd className="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] leading-none">
            <span className={cn("inline-flex items-center gap-1", ink)}>
              <Arrow direction={direction} />
              <span className="font-semibold">
                {word}
                {magnitude ? ` ${magnitude}` : ""}
              </span>
            </span>
            <span className="text-fg-muted">{baseline}</span>
          </dd>
        ) : undefined
      }
    />
  );
}

/* ---------------------------------------------------------------------------
   StatusTile — "is this OK".
   --------------------------------------------------------------------------- */

export interface StatusTileProps extends TileCommonProps {
  /** Required: a status tile with no tone is just a StatTile. */
  tone: TileTone;
  /** Corner glyph. Reinforces the rail; never the only carrier of meaning,
   *  since the value and caption are words. */
  icon?: ReactNode;
}

export function StatusTile({ tone, icon, ...rest }: StatusTileProps) {
  return (
    <TileShell
      {...rest}
      rail={cn("border-l-[3px]", TONE_INK[tone].edge)}
      icon={
        icon ? (
          <span
            aria-hidden="true"
            // The MARK, not the ink, so the corner glyph matches the rail
            // exactly. An icon is a non-text graphic at 3:1, not a label.
            className={cn(ICON, TONE_INK[tone].glyph)}
          >
            {icon}
          </span>
        ) : undefined
      }
    />
  );
}

/* ---------------------------------------------------------------------------
   TileGrid — the layout rule, as a component.
   --------------------------------------------------------------------------- */

export interface TileGridProps {
  children: ReactNode;
  /** Minimum tile width in px before wrapping. 200 is the brand rule; raise it
   *  for tiles with sparklines, never lower it. */
  min?: number;
  className?: string;
}

/**
 * Auto-fit, minimum 200px, so tiles WRAP rather than shrink. Shipped as a
 * component and not left to each console because both halves of the rule get
 * lost otherwise: the Tenant list put seven tiles in one row, which the
 * standard records as "past the point of being scannable — cap at five". A grid
 * that wraps turns that from an unreadable row into a readable two rows.
 */
export function TileGrid({ children, min = 200, className }: TileGridProps) {
  return (
    <div
      className={cn("grid gap-4", className)}
      style={{ gridTemplateColumns: `repeat(auto-fit, minmax(${min}px, 1fr))` }}
    >
      {children}
    </div>
  );
}
