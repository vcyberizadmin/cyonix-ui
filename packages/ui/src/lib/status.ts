/**
 * CX-STA — the status and severity vocabulary.
 *
 * TWO LANGUAGES, NEVER MIXED ON ONE AXIS
 * --------------------------------------
 *  · SEMANTIC — what happened. Toasts, banners, inline validation, connector
 *               and job status, lifecycle. One hue per outcome.
 *  · SEVERITY — how bad, RANKED. Dashboards, finding tables, risk tiles, and
 *               every chart series that encodes rank.
 *
 * Putting a semantic tone and a severity rank on the same axis of one widget
 * makes both unreadable. Keep them apart.
 *
 * Brand orange is NEVER a status. It marks the current location and the primary
 * action, nothing else — so no tone here resolves to the accent.
 *
 * COLOUR NEVER CARRIES MEANING ALONE (WCAG 2.2 AA)
 * ------------------------------------------------
 * Every pill pairs its hue with a text label, AND every tone carries a distinct
 * dot SHAPE, so the vocabulary survives colour-blindness and greyscale print:
 *
 *     success  ● filled circle
 *     warning  ◉ haloed circle
 *     danger   ◆ diamond
 *     info     ○ hollow ring
 *     neutral  ■ square
 *     draft      absent, dashed border
 *
 * This shape encoding is subtle and reviewers WILL try to "fix" it back to
 * plain circles. It is load-bearing accessibility, not decoration.
 */

export const STATUS_TONES = [
  "success",
  "warning",
  "danger",
  "info",
  "neutral",
  "draft",
] as const;
export type StatusTone = (typeof STATUS_TONES)[number];

/** A status maps to a tone, and may declare itself live (renders a pulse). */
export type StatusDef = StatusTone | { tone: StatusTone; live?: boolean };
export type StatusVocabulary = Record<string, StatusDef>;

/**
 * The shared base vocabulary. Deliberately generic plus lifecycle — it is NOT
 * meant to cover every app. VAPT assessment states and SOC alert states extend
 * it through `extendVocabulary`, so nobody has to fork the component.
 */
export const BASE_VOCABULARY: StatusVocabulary = {
  // Lifecycle
  Active: "success",
  Inactive: "neutral",
  Suspended: "warning",
  Offboarded: "neutral",
  Draft: "draft",
  Archived: "neutral",
  // Provisioning and subscription
  Provisioning: { tone: "info", live: true },
  Trial: "info",
  Expired: "draft",
  Deleted: "neutral",
  // Job and run outcomes
  Queued: "neutral",
  Running: { tone: "info", live: true },
  Scanning: { tone: "info", live: true },
  Passed: "success",
  Completed: "success",
  Failed: "danger",
  Cancelled: "neutral",
  Blocked: "danger",
  // Review
  "Pending review": "warning",
  Approved: "success",
  Rejected: "danger",
};

/**
 * Layer app-specific statuses over the base without forking.
 *
 *     const vocab = extendVocabulary({ Exploited: "danger", Triaging: { tone: "info", live: true } });
 *     <StatusPill status="Exploited" vocabulary={vocab} />
 */
export function extendVocabulary(
  extra: StatusVocabulary,
  base: StatusVocabulary = BASE_VOCABULARY,
): StatusVocabulary {
  return { ...base, ...extra };
}

function normalise(def: StatusDef | undefined): { tone: StatusTone; live: boolean } {
  if (def === undefined) return { tone: "neutral", live: false };
  if (typeof def === "string") return { tone: def, live: false };
  return { tone: def.tone, live: def.live ?? false };
}

/** Unknown statuses fall back to neutral rather than throwing — a status
 *  nobody registered must never take a page down. */
export function toneFor(
  status: string,
  vocabulary: StatusVocabulary = BASE_VOCABULARY,
): StatusTone {
  return normalise(vocabulary[status]).tone;
}

export function isLive(
  status: string,
  vocabulary: StatusVocabulary = BASE_VOCABULARY,
): boolean {
  return normalise(vocabulary[status]).live;
}

/** Tone → pill surface + the non-chromatic dot shape. */
export const TONE_STYLES: Record<StatusTone, { pill: string; dot: string }> = {
  // 10% tint, 25% border, hue as the label — the pill recipe from the standard.
  success: {
    pill: "text-ok-ink bg-ok/10 border-ok/25",
    dot: "rounded-full bg-current",
  },
  warning: {
    pill: "text-warning-ink bg-warning/10 border-warning/25",
    dot: "rounded-full bg-current ring-2 ring-current/30",
  },
  danger: {
    // Diamond. The base implementation gave warning and danger the same haloed
    // circle, which breaks the "each tone a distinct shape" rule exactly where
    // it matters most.
    pill: "text-danger-ink bg-danger/10 border-danger/25",
    dot: "bg-current rotate-45",
  },
  info: {
    pill: "text-info-ink bg-info/10 border-info/25",
    dot: "rounded-full border-[1.5px] border-current",
  },
  neutral: {
    pill: "text-fg-2 bg-wash-2 border-rule",
    dot: "bg-current",
  },
  draft: {
    pill: "text-fg-muted border-dashed border-fg-muted/60 bg-transparent",
    dot: "hidden",
  },
};

/**
 * Tone → plain ink and fill, for places that need the hue WITHOUT the pill
 * chrome: a stat tile's value, a status tile's left rail, a trend arrow.
 *
 *   text  INK for type. Cleared 4.5:1 against page, card, tint and wash.
 *   fill  a solid block — a bar, a dot. The brand MARK value.
 *   glyph the MARK value as `currentColor`, for an icon or other non-text
 *         graphic. Icons answer to WCAG 1.4.11 at 3:1, not 1.4.3 at 4.5:1, so
 *         they take the mark and therefore match the bar or rail beside them
 *         exactly. Never use this for a label.
 *   edge  border-left colour, for a rail that must sit FLUSH with the card
 *         edge. An absolutely-positioned bar cannot: `inset-y-0` resolves
 *         against the padding box, so a 1px border leaves a hairline of rule
 *         colour above, below and beside the rail.
 *
 * Separate from TONE_STYLES because those are a pill recipe (tint + border +
 * label) and a 30px headline number must not carry a border. Same vocabulary,
 * different shape — so a tile and a pill can never disagree about what "danger"
 * looks like.
 */
export const TONE_INK: Record<
  StatusTone,
  { text: string; fill: string; glyph: string; edge: string }
> = {
  success: {
    text: "text-ok-ink",
    fill: "bg-ok",
    glyph: "text-ok",
    edge: "border-l-ok",
  },
  warning: {
    text: "text-warning-ink",
    fill: "bg-warning",
    glyph: "text-warning",
    edge: "border-l-warning",
  },
  danger: {
    text: "text-danger-ink",
    fill: "bg-danger",
    glyph: "text-danger",
    edge: "border-l-danger",
  },
  info: {
    text: "text-info-ink",
    fill: "bg-info",
    glyph: "text-info",
    edge: "border-l-info",
  },
  neutral: {
    text: "text-fg",
    fill: "bg-fg-muted",
    glyph: "text-fg-muted",
    edge: "border-l-fg-muted",
  },
  draft: {
    text: "text-fg-muted",
    fill: "bg-fg-muted",
    glyph: "text-fg-muted",
    edge: "border-l-fg-muted",
  },
};

/* ---------------------------------------------------------------------------
   SEVERITY — ranked data only. Critical first, always in scale order.
   --------------------------------------------------------------------------- */

export const SEVERITIES = ["Critical", "High", "Medium", "Low", "Info"] as const;
export type Severity = (typeof SEVERITIES)[number];

/**
 * Each rank carries the expected RESPONSE, not just a colour. "Critical" means
 * nothing on its own; "Immediate action · page on-call" is what an operator
 * actually needs to know.
 */
export const SEVERITY_META: Record<
  Severity,
  { action: string; bar: string; text: string; surface: string }
> = {
  Critical: {
    action: "Immediate action · page on-call",
    bar: "bg-sev-crit",
    text: "text-sev-crit-ink",
    surface: "bg-sev-crit/12 border-sev-crit/30",
  },
  High: {
    action: "Same-shift response",
    bar: "bg-sev-high",
    text: "text-sev-high-ink",
    surface: "bg-sev-high/12 border-sev-high/30",
  },
  Medium: {
    action: "Queue for triage",
    bar: "bg-sev-med",
    text: "text-sev-med-ink",
    surface: "bg-sev-med/12 border-sev-med/30",
  },
  Low: {
    action: "Track, no interrupt",
    bar: "bg-sev-low",
    text: "text-sev-low-ink",
    surface: "bg-sev-low/12 border-sev-low/30",
  },
  Info: {
    action: "No action required",
    bar: "bg-sev-info",
    text: "text-sev-info-ink",
    surface: "bg-sev-info/12 border-sev-info/30",
  },
};

/** Rank index so tables, tiles and charts sort Critical-first without guessing.
 *  Unknown values sort last rather than throwing. */
export function severityRank(severity: string): number {
  const index = (SEVERITIES as readonly string[]).indexOf(severity);
  return index === -1 ? SEVERITIES.length : index;
}

/** Sort helper: `findings.sort(bySeverity(f => f.severity))`. */
export function bySeverity<T>(pick: (item: T) => string) {
  return (a: T, b: T) => severityRank(pick(a)) - severityRank(pick(b));
}

/* ---------------------------------------------------------------------------
   CHART RAMPS — shipped here so charts inherit the same discipline rather
   than inventing their own palette.
   --------------------------------------------------------------------------- */

/** UNRANKED series only. Series 1 is Orange 400. None of these is a status hue,
 *  and none may encode rank — use SEVERITIES for that. */
export const CATEGORICAL = [
  "bg-cat-1",
  "bg-cat-2",
  "bg-cat-3",
  "bg-cat-4",
  "bg-cat-5",
  "bg-cat-6",
] as const;

/**
 * The same two ramps as INK rather than fill.
 *
 * These exist as separate literal arrays instead of being derived — deriving
 * them (`CATEGORICAL[i].replace("bg-", "text-")`) produces a class that appears
 * nowhere in the source, so Tailwind never generates it and the mark renders
 * with no colour at all. Nothing errors, and verify-utilities cannot catch it
 * because the string only exists at runtime. NEVER COMPUTE A CLASS NAME.
 */
export const CATEGORICAL_INK = [
  "text-cat-1",
  "text-cat-2",
  "text-cat-3",
  "text-cat-4",
  "text-cat-5",
  "text-cat-6",
] as const;

export const SEQUENTIAL_INK = [
  "text-seq-1",
  "text-seq-2",
  "text-seq-3",
  "text-seq-4",
  "text-seq-5",
  "text-seq-6",
  "text-seq-7",
  "text-seq-8",
] as const;

/** Single-hue magnitude ramp, dark to light. */
export const SEQUENTIAL = [
  "bg-seq-1",
  "bg-seq-2",
  "bg-seq-3",
  "bg-seq-4",
  "bg-seq-5",
  "bg-seq-6",
  "bg-seq-7",
  "bg-seq-8",
] as const;
