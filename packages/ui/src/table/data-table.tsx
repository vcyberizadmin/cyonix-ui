"use client";

/**
 * CX-TBL — the workhorse. Tenant's structure, SOC's behaviours, VAPT's cells.
 *
 * THE DEFECT THIS COMPONENT IS DESIGNED NOT TO HAVE
 * -------------------------------------------------
 * The standard records that SOC's DataTable "tracks sortKey and sortDir,
 * toggles them on header click and renders the ↑/↓ arrow — but the rows are
 * mapped in original order and the sort state is never applied. The header
 * responds, the arrow flips, nothing moves." It says: do not copy it as-is.
 *
 * So sorting here is not optional plumbing:
 *   · Uncontrolled (no `onSortChange`) — the table genuinely sorts the rows.
 *   · Controlled (`onSortChange` given) — the caller owns ordering, for
 *     server-side sorting, and the table does NOT reorder.
 * There is no third state where a header can respond without something
 * actually happening.
 *
 * Other rules encoded here:
 *  · Overflow lives on the table's own scroll container behind a min-width, so
 *    a 12-column table never makes the page body scroll sideways.
 *  · NO zebra striping — it fights severity colour. One hairline per row.
 *  · Hover is a neutral wash; selection is a left ORANGE rail (current
 *    location, the one legitimate accent use here).
 *  · Row height is fixed and cells truncate rather than wrap, so the eye can
 *    run down a column.
 *  · Loading, empty and error render in the table's OWN body, never replacing
 *    the page.
 *  · Sort is indicated on the active header only.
 */
import { useMemo, useState, type ReactNode } from "react";
import { cn } from "../lib/cn.js";
import { severityRank } from "../lib/status.js";
import { EmptyState, ErrorState } from "../states.js";
import { Skeleton } from "../skeleton.js";

export type SortDirection = "asc" | "desc";

export interface SortState {
  key: string;
  direction: SortDirection;
}

export interface Column<T> {
  key: string;
  header: ReactNode;
  /** Cell renderer. The index is the row's position in the RENDERED order, so a
   *  numbered column stays in step when the table sorts. */
  cell: (row: T, index: number) => ReactNode;
  sortable?: boolean;
  /** `severity` sorts by rank so Critical comes first, not alphabetically. */
  sortAs?: "text" | "number" | "severity";
  /** Value to sort on. Required for a sortable column — the rendered cell is a
   *  ReactNode and cannot be compared reliably. */
  sortValue?: (row: T) => string | number;
  /**
   * Applied to the header AND the body cells together, so the two can never
   * disagree.
   *
   * "left" (the default) is for text a reader actually reads — names, codes,
   * descriptions. "center" is for the compact columns that are scanned rather
   * than read: a status mark, a count, a date, an action group. "right" is for
   * figures meant to be compared digit by digit, and additionally sets the mono
   * tabular face that makes them line up.
   */
  align?: "left" | "center" | "right";
  /** CSS width, e.g. "20%" or "160px". */
  width?: string;
  /**
   * Shrinks the column to its own content instead of letting it take a share of
   * the table's leftover width — which is what otherwise strands a status mark
   * or an action group a hand's width from its header. Set it on codes, counts,
   * dates, statuses and action groups; leave it off the text columns, which then
   * absorb the space left over.
   */
  compact?: boolean;
  /** Escape hatch, applied to header and body cells alike. For the width and
   *  visibility utilities the props above cannot express, e.g. `min-w-[20rem]`
   *  or `hidden md:table-cell`. */
  className?: string;
  /** Marks the fixed right-hand actions column: it is compact, never truncates,
   *  and clicks inside it do not trigger the row click. */
  actions?: boolean;
  /**
   * Text cells truncate with an ellipsis. Set false for a cell whose content is
   * a pill or chip stack: clipping one mid-shape looks broken, and status pills
   * must never wrap either. The cell still refuses to wrap.
   */
  truncate?: boolean;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  /** Highlights the row driving a detail pane. */
  selectedKey?: string;
  /** Makes the whole row clickable. */
  onRowClick?: (row: T) => void;
  /** Controlled sort. */
  sort?: SortState | null;
  defaultSort?: SortState | null;
  /**
   * Provide this to own ordering yourself (server-side sorting). The table then
   * renders `rows` exactly as given. Omit it and the table sorts.
   */
  onSortChange?: (sort: SortState | null) => void;
  loading?: boolean;
  error?: { title: ReactNode; description?: ReactNode; correlationId?: string; action?: ReactNode };
  /** Shown when there are no rows. Name the next useful action — never just
   *  "No data". */
  empty?: { variant: "empty" | "filtered"; title: ReactNode; description?: ReactNode; action?: ReactNode };
  /** Minimum table width; the scroll container owns the overflow. */
  minWidth?: string;
  stickyHeader?: boolean;
  /** Footer row inside the table's border — Pagination goes here. */
  footer?: ReactNode;
  /**
   * Row hover feedback. Defaults on, and should stay on for any table whose rows
   * are records an operator acts on. Turn it off for a static reference grid — a
   * permissions matrix, a legend — where a hover wash advertises interactivity
   * the row does not have.
   */
  hoverable?: boolean;
  /** Accessible name for the table. */
  label?: string;
  className?: string;
}

function compare<T>(column: Column<T>, a: T, b: T): number {
  const pick = column.sortValue;
  if (!pick) return 0;
  const left = pick(a);
  const right = pick(b);

  if (column.sortAs === "severity") {
    return severityRank(String(left)) - severityRank(String(right));
  }
  if (column.sortAs === "number" || (typeof left === "number" && typeof right === "number")) {
    return Number(left) - Number(right);
  }
  return String(left).localeCompare(String(right));
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  selectedKey,
  onRowClick,
  sort: controlledSort,
  defaultSort = null,
  onSortChange,
  loading,
  error,
  empty,
  minWidth = "720px",
  stickyHeader = true,
  hoverable = true,
  footer,
  label,
  className,
}: DataTableProps<T>) {
  const [ownSort, setOwnSort] = useState<SortState | null>(defaultSort);
  const sort = controlledSort !== undefined ? controlledSort : ownSort;
  const callerOwnsOrdering = onSortChange !== undefined;

  const setSort = (next: SortState | null) => {
    onSortChange?.(next);
    if (controlledSort === undefined) setOwnSort(next);
  };

  const ordered = useMemo(() => {
    // The caller sorts server-side; reordering here would fight them.
    if (callerOwnsOrdering || !sort) return rows;
    const column = columns.find((c) => c.key === sort.key);
    if (!column?.sortValue) return rows;

    // Stable: index breaks ties, so equal rows keep their original order.
    return rows
      .map((row, index) => ({ row, index }))
      .sort((a, b) => {
        const result = compare(column, a.row, b.row);
        return (result !== 0 ? result : a.index - b.index) *
          (sort.direction === "asc" ? 1 : -1);
      })
      .map((entry) => entry.row);
  }, [rows, sort, columns, callerOwnsOrdering]);

  const toggle = (column: Column<T>) => {
    if (!column.sortable) return;
    if (sort?.key !== column.key) {
      setSort({ key: column.key, direction: "asc" });
    } else if (sort.direction === "asc") {
      setSort({ key: column.key, direction: "desc" });
    } else {
      setSort(null);
    }
  };

  const colSpan = columns.length;
  const showBody = !loading && !error && ordered.length > 0;

  return (
    <div
      className={cn(
        "border-rule bg-surface overflow-hidden rounded-md border",
        className,
      )}
    >
      {/* The scroll container. Overflow is owned HERE, not by the page. */}
      <div className="overflow-x-auto">
        <table
          aria-label={label}
          className="w-full border-collapse text-left"
          style={{ minWidth }}
        >
          <thead
            className={cn(
              "bg-wash-1",
              stickyHeader && "sticky top-0 z-10",
            )}
          >
            <tr>
              {columns.map((column) => {
                const active = sort?.key === column.key;
                return (
                  <th
                    key={column.key}
                    scope="col"
                    style={column.width ? { width: column.width } : undefined}
                    aria-sort={
                      active
                        ? sort.direction === "asc"
                          ? "ascending"
                          : "descending"
                        : column.sortable
                          ? "none"
                          : undefined
                    }
                    className={cn(
                      "border-rule text-fg-2 border-b px-4 py-2.5 text-[11.5px] font-semibold tracking-[0.12em] whitespace-nowrap uppercase",
                      column.align === "right" && "text-right",
                      column.align === "center" && "text-center",
                      // An actions column is compact by definition.
                      (column.compact || column.actions) && "w-px",
                      column.className,
                    )}
                  >
                    {column.sortable ? (
                      <button
                        type="button"
                        onClick={() => toggle(column)}
                        // uppercase + tracking are repeated here on purpose: the
                        // UA stylesheet sets `text-transform: none` on <button>,
                        // so the <th>'s `uppercase` does not inherit into it and
                        // sortable headers would render in sentence case while
                        // non-sortable ones shouted.
                        className={cn(
                          "hover:text-fg duration-instant ease-brand inline-flex cursor-pointer items-center gap-1.5 tracking-[0.12em] uppercase transition-colors",
                          active && "text-fg",
                        )}
                      >
                        {column.header}
                        {/* Indicated on the ACTIVE header only. */}
                        <span
                          aria-hidden="true"
                          className={cn(
                            "text-[10px]",
                            active ? "opacity-100" : "opacity-0",
                          )}
                        >
                          {active && sort.direction === "desc" ? "▼" : "▲"}
                        </span>
                      </button>
                    ) : (
                      column.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {showBody &&
              ordered.map((row, index) => {
                const key = rowKey(row);
                const selected = key === selectedKey;
                const clickable = onRowClick !== undefined;
                return (
                  <tr
                    key={key}
                    onClick={clickable ? () => onRowClick(row) : undefined}
                    aria-selected={selected || undefined}
                    className={cn(
                      // One hairline per row. No zebra striping: it fights
                      // severity colour, which is the thing you need to see.
                      "border-rule relative border-b last:border-b-0",
                      clickable && "cursor-pointer",
                      selected
                        ? "bg-accent/8 before:bg-accent before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:content-['']"
                        : hoverable && "hover:bg-wash-hover",
                      "duration-instant ease-brand transition-colors",
                    )}
                  >
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        // Action controls must not trigger the row click.
                        onClick={
                          column.actions
                            ? (event) => event.stopPropagation()
                            : undefined
                        }
                        className={cn(
                          "text-fg-2 px-4 py-[11px] text-[13px]",
                          // A compact or actions column is sized by its content,
                          // so there is no share of the table to truncate against
                          // — and `truncate`'s overflow:hidden clips a control as
                          // readily as a long string. An Edit button arriving as
                          // "dit" is never what the caller meant, which is why
                          // `actions` alone is enough to opt out.
                          column.truncate === false ||
                            column.compact ||
                            column.actions
                            ? "whitespace-nowrap"
                            : "max-w-0 truncate",
                          column.align === "right" &&
                            "text-right font-mono tabular-nums",
                          column.align === "center" && "text-center",
                          (column.compact || column.actions) && "w-px",
                          column.className,
                        )}
                      >
                        {column.cell(row, index)}
                      </td>
                    ))}
                  </tr>
                );
              })}

            {/* All three states render in the table's own body. */}
            {loading && (
              <tr>
                <td colSpan={colSpan} className="p-0">
                  <Skeleton
                    rows={5}
                    rowHeight={45}
                    columns={columns.map((c) => c.width ?? "18%")}
                  />
                </td>
              </tr>
            )}
            {!loading && error && (
              <tr>
                <td colSpan={colSpan} className="p-4">
                  <ErrorState {...error} />
                </td>
              </tr>
            )}
            {!loading && !error && ordered.length === 0 && empty && (
              <tr>
                <td colSpan={colSpan} className="p-0">
                  <EmptyState {...empty} />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {footer}
    </div>
  );
}
