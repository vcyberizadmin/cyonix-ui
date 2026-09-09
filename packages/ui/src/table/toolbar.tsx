"use client";

/**
 * CX-FLT — the strip above every table.
 *
 * Each console contributed one genuinely better idea, and all three are here:
 * Tenant's removable filter chip, VAPT's segmented pill row with a live count,
 * SOC's saved views.
 *
 * Rules encoded here:
 *  · One row, wrapping on narrow screens, hairline-separated from the table it
 *    governs. Search takes the remaining width.
 *  · Filters apply IMMEDIATELY — no Apply button. Search debounces at 250ms.
 *  · Applied state stays visible as removable chips. The standard calls hidden
 *    filter state "the commonest cause of 'the data is wrong' tickets".
 *  · Segmented filters are a radiogroup; chips are buttons with an accessible
 *    "Remove filter" label.
 *  · The active segment is ORANGE — legitimate accent use, because it is a
 *    current selection, not a status.
 *
 * URL persistence is deliberately the caller's job: the library cannot know an
 * app's router. Keep filter + page state in the URL so a filtered view is
 * linkable and survives reload.
 */
import {
  Children,
  Fragment,
  isValidElement,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { cn } from "../lib/cn.js";
import { Segmented } from "../tabs.js";

/* ------------------------------------------------------------- Segmented ---- */

export interface SegmentedOption {
  value: string;
  label: ReactNode;
  /** Live count shown beside the label. */
  count?: number;
}

export interface SegmentedFilterProps {
  /**
   * Keep this to ~7 or fewer. Past that a segmented row stops being scannable
   * and wants a select instead — a review-time rule, not something the
   * component can enforce without guessing at the app's intent.
   */
  options: SegmentedOption[];
  value: string;
  onChange: (value: string) => void;
  /** Accessible name for the radiogroup. */
  label: string;
  className?: string;
}

/**
 * The toolbar's segmented row. Deliberately a thin wrapper over CX-TAB's
 * `Segmented` rather than a second implementation of the same control: the
 * standard lists both names, and the only real differences are that a toolbar
 * segment sits beside other controls (so it takes the lighter tint treatment and
 * is allowed to wrap onto a second line) and that it always shows counts.
 *
 * Keeping one implementation is what stops the two from drifting — the roving
 * focus, the disabled handling and the ARIA all live in one place. Two separate
 * copies of a radiogroup is exactly the duplication the standard collapses
 * everywhere else.
 */
export function SegmentedFilter({
  options,
  value,
  onChange,
  label,
  className,
}: SegmentedFilterProps) {
  return (
    <Segmented
      items={options}
      value={value}
      onChange={onChange}
      label={label}
      variant="tint"
      size="sm"
      overflow="wrap"
      className={className}
    />
  );
}

/* ------------------------------------------------------------------ Chip ---- */

export interface FilterChipProps {
  /** What dimension this filters, e.g. "Severity". */
  field: ReactNode;
  /** The applied value. */
  value: ReactNode;
  onRemove: () => void;
  className?: string;
}

export function FilterChip({ field, value, onRemove, className }: FilterChipProps) {
  return (
    <span
      className={cn(
        "bg-surface text-fg-2 hover:text-fg duration-instant ease-brand inline-flex h-[34px] items-center gap-[.4rem] rounded-full pr-2 pl-[.85rem] text-[12.5px] font-bold transition-colors",
        className,
      )}
    >
      <span className="text-fg-muted">{field}:</span>
      <span className="text-fg font-medium">{value}</span>
      <button
        type="button"
        onClick={onRemove}
        // Named for the value, so a screen reader hears which filter is going.
        aria-label={`Remove filter ${typeof field === "string" ? field : ""} ${
          typeof value === "string" ? value : ""
        }`.trim()}
        className="text-fg-muted hover:text-danger-ink duration-instant ease-brand grid size-4 cursor-pointer place-items-center rounded-full transition-colors"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          aria-hidden="true"
          className="size-2.5"
        >
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
    </span>
  );
}

/**
 * How many of these children will actually put something on the page.
 *
 * `chips && ...` was the obvious test and the wrong one: a fragment is truthy
 * even when every chip inside it is conditional and absent, so an "Applied /
 * Clear all" row drew itself with nothing applied. `Children.toArray` is the
 * next obvious answer and also wrong — it flattens arrays but treats a
 * Fragment as ONE child, so it counts the wrapper rather than the contents.
 *
 * A fragment full of conditionals is the natural way to write this prop, so
 * the component walks into them rather than asking the caller to pass an array.
 */
function countRenderable(node: ReactNode): number {
  let count = 0;
  Children.forEach(node, (child) => {
    if (child === null || child === undefined || typeof child === "boolean") {
      return;
    }
    if (isValidElement(child) && child.type === Fragment) {
      count += countRenderable(
        (child.props as { children?: ReactNode }).children,
      );
      return;
    }
    count += 1;
  });
  return count;
}

/* --------------------------------------------------------------- Toolbar ---- */

export interface SavedView {
  id: string;
  name: string;
}

export interface ToolbarProps {
  /** Debounced at 250ms. Omit to hide the search field. */
  search?: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
  };
  /** Rendered first: segmented status filters, selects, date ranges. */
  children?: ReactNode;
  /** Applied filters as removable chips. */
  chips?: ReactNode;
  /** Clears everything. Shown only when chips exist. */
  onClearAll?: () => void;
  /** "42 of 1,204" — right-aligned in secondary ink. */
  resultCount?: { shown: number; total: number };
  /**
   * SOC's saved views. Persistence is the app's job — the SOC prototype has
   * none behind it, which is why this is just a select plus a save action.
   */
  savedViews?: {
    views: SavedView[];
    currentId?: string;
    onSelect: (id: string) => void;
    onSave?: () => void;
  };
  className?: string;
}

export function Toolbar({
  search,
  children,
  chips,
  onClearAll,
  resultCount,
  savedViews,
  className,
}: ToolbarProps) {
  const hasChips = countRenderable(chips) > 0;

  return (
    <div className={cn("border-rule flex flex-col gap-2 border-b", className)}>
      <div className="flex flex-wrap items-center gap-2 px-4 py-2.5">
        {/* Children BEFORE search, which is what this prop's own documentation
            has always said and what the console does on both of its filtered
            screens: the dimensions you filter by come first, and the search
            field grows to fill what is left. The implementation had them the
            other way round. */}
        {children}
        {search && <SearchField {...search} />}

        <div className="ml-auto flex items-center gap-3">
          {savedViews && (
            <label className="text-fg-muted flex items-center gap-1.5 text-[11px]">
              View
              <select
                value={savedViews.currentId ?? ""}
                onChange={(event) => savedViews.onSelect(event.target.value)}
                className="bg-surface text-fg-2 shadow-[inset_0_0_0_2px_transparent] focus:shadow-[inset_0_0_0_2px_var(--accent)] duration-instant ease-brand cursor-pointer rounded-md px-1.5 py-0.5 text-[12px] transition-[box-shadow] focus:outline-none"
              >
                <option value="">All records</option>
                {savedViews.views.map((view) => (
                  <option key={view.id} value={view.id}>
                    {view.name}
                  </option>
                ))}
              </select>
              {savedViews.onSave && (
                <button
                  type="button"
                  onClick={savedViews.onSave}
                  className="text-fg-2 hover:text-fg duration-instant ease-brand cursor-pointer underline underline-offset-2 transition-colors"
                >
                  Save
                </button>
              )}
            </label>
          )}
          {resultCount && (
            <span className="text-fg-muted text-[12px]">
              <span className="text-fg-2 font-mono tabular-nums">
                {resultCount.shown.toLocaleString()}
              </span>{" "}
              of{" "}
              <span className="font-mono tabular-nums">
                {resultCount.total.toLocaleString()}
              </span>
            </span>
          )}
        </div>
      </div>

      {hasChips && (
        <div className="flex flex-wrap items-center gap-1.5 px-4 pb-2.5">
          <span className="text-fg-muted text-[10px] font-semibold tracking-[0.08em] uppercase">
            Applied
          </span>
          {chips}
          {onClearAll && (
            <button
              type="button"
              onClick={onClearAll}
              className="text-fg-muted hover:text-fg duration-instant ease-brand ml-1 cursor-pointer text-[11px] underline underline-offset-2 transition-colors"
            >
              Clear all
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/** Debounced so an expensive query is not fired per keystroke. */
function SearchField({
  value,
  onChange,
  placeholder = "Search",
}: NonNullable<ToolbarProps["search"]>) {
  const [draft, setDraft] = useState(value);

  // Keep in step when the caller resets the filter (e.g. Clear all).
  useEffect(() => setDraft(value), [value]);

  useEffect(() => {
    if (draft === value) return;
    const id = setTimeout(() => onChange(draft), 250);
    return () => clearTimeout(id);
    // onChange is intentionally excluded: an inline arrow from the caller would
    // otherwise restart the timer on every render and the debounce never fires.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, value]);

  return (
    <div className="relative flex min-w-[200px] flex-1 items-center">
      <svg
        className="text-fg-muted pointer-events-none absolute left-4 size-[18px]"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </svg>
      <input
        type="search"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder={placeholder}
        className={cn(
          "bg-surface text-fg placeholder:text-fg-muted placeholder:font-medium",
          "shadow-[inset_0_0_0_2px_transparent] focus:shadow-[inset_0_0_0_2px_var(--accent)]",
          "duration-instant ease-brand h-11 w-full rounded-lg pr-4 pl-11 text-[13.5px] font-semibold",
          "transition-[box-shadow] focus:outline-none",
        )}
      />
    </div>
  );
}
