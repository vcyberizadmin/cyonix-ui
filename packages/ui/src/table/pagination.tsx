/**
 * CX-PAG — pagination. Server-safe (handlers come from the caller).
 *
 * Tenant's version wins outright for one reason: it states the RANGE and the
 * TOTAL. "Page 1 of 7" alone never tells an operator how much work is left.
 *
 * Sits inside the table's border as a footer row on the wash, not floating
 * below it. Disabled controls stay visible at muted opacity — removing them
 * would shift the layout as you reach a boundary.
 */
import { cn } from "../lib/cn.js";

export interface PaginationProps {
  /** 1-based. */
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  /**
   * Page-size control. The standard lists its absence as a real gap —
   * "analysts will want 50/100" — so it is here, but optional.
   */
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  /** Announce that a filter change reset paging. */
  resetNotice?: string;
  className?: string;
}

const control =
  "border-rule text-fg-2 hover:text-fg hover:bg-wash-hover duration-instant ease-brand cursor-pointer rounded-sm border px-2.5 py-1 text-[12px] font-medium transition-colors disabled:pointer-events-none disabled:opacity-40";

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [25, 50, 100],
  resetNotice,
  className,
}: PaginationProps) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);

  return (
    <div
      className={cn(
        "border-rule bg-wash-1 flex flex-wrap items-center justify-between gap-3 border-t px-4 py-2.5",
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-3">
        {/* The range and the total — the one detail that makes paging honest. */}
        <span className="text-fg-2 text-[12px]" aria-live="polite">
          Showing{" "}
          <span className="text-fg font-mono tabular-nums">
            {from}–{to}
          </span>{" "}
          of <span className="text-fg font-mono tabular-nums">{total}</span>
        </span>
        {resetNotice && (
          <span className="text-fg-muted text-[11px]">{resetNotice}</span>
        )}
      </div>

      <div className="flex items-center gap-3">
        {onPageSizeChange && (
          <label className="text-fg-muted flex items-center gap-1.5 text-[11px]">
            Rows
            <select
              value={pageSize}
              onChange={(event) => onPageSizeChange(Number(event.target.value))}
              className="border-rule bg-surface text-fg-2 focus:border-accent cursor-pointer rounded-sm border px-1.5 py-0.5 text-[12px] focus:outline-none"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
        )}

        <span className="text-fg-muted text-[12px]">
          Page <span className="font-mono tabular-nums">{page}</span> of{" "}
          <span className="font-mono tabular-nums">{pages}</span>
        </span>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            className={control}
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
          >
            Previous
          </button>
          <button
            type="button"
            className={control}
            onClick={() => onPageChange(page + 1)}
            disabled={page >= pages}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
