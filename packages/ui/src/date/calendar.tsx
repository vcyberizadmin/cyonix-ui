"use client";

/**
 * CX-DTE — Calendar. One month, as a real grid.
 *
 * Written from scratch: none of the three consoles had a date control at all.
 * CX-FLT lists "bound by date with a start–end range" as an operation every
 * table needs, and CX-FLD ships no date input, so each app was left to reach for
 * a bare `<input type="date">` whose rendering it cannot style and cannot match
 * between browsers.
 *
 * SHAPE RULES, from the design system of record
 * ---------------------------------------------
 *  · radius-sm on the day cells, all four corners. The chamfer is buttons-only
 *    and a 36px cell has no room for an 11px corner anyway.
 *  · The SELECTED ends of a range take the orange fill; the days between take a
 *    NEUTRAL wash. This is the one styling decision in the file worth arguing
 *    with, so: the brand caps orange at "well under a tenth of any screen", and
 *    a 30-day band is roughly a third of the grid. Painting the band orange
 *    would also make it compete with the two cells that carry the actual
 *    selection. Ends carry the selection, the band carries the context — the
 *    same division CX-NAV makes when it puts the orange bar on the current item
 *    and a neutral wash on hover.
 *  · Today is marked with a hairline, not a fill. It is a location, not a
 *    selection, and the two must not look alike.
 *
 * KEYBOARD
 * --------
 * Roving tabindex, per the ARIA grid pattern: the grid is ONE tab stop, and
 * arrows move within it. Tabbing through 31 buttons to reach the end of the
 * month is not navigation.
 *
 *   ← →         ± one day, crossing into the neighbouring month
 *   ↑ ↓         ± one week
 *   Home / End  first / last day of the displayed month
 *   PageUp/Dn   ± one month     (Shift: ± one year)
 *   Enter/Space select
 *
 * Unavailable days carry `aria-disabled` rather than `disabled`. A truly
 * disabled button is not focusable, so if the roving tab stop happened to land
 * on one — a min-bounded calendar opening on a month whose 1st is out of range —
 * Tab would skip the entire grid and the calendar would be unreachable by
 * keyboard. `aria-disabled` keeps it focusable and announced, and the click is
 * refused in the handler.
 */
import { useMemo, useRef, useState, type KeyboardEvent } from "react";
import { cn } from "../lib/cn.js";
import { Select } from "../form/controls.js";
import { FieldBoundary } from "../form/field.js";
import {
  MONTH_NAMES,
  addMonths,
  clampISO,
  daysInMonth,
  formatISODate,
  getDay,
  getMonth,
  getYear,
  isInRange,
  isSameMonth,
  monthMatrix,
  startOfMonth,
  toISODate,
  todayISO,
  weekdayHeaders,
  type DateRange,
  type ISODate,
  type WeekStart,
} from "./dates.js";

export interface CalendarProps {
  /** Any day inside the month to display. Controlled. */
  month: ISODate;
  onMonthChange: (month: ISODate) => void;
  /** What to paint. A single date is `{ from: d, to: d }`. */
  value?: DateRange;
  onSelect?: (date: ISODate) => void;
  /** Inclusive bounds. Days outside are announced and refused, not hidden. */
  min?: ISODate | null;
  max?: ISODate | null;
  /** Blackout dates the bounds cannot express, e.g. before a tenant existed. */
  isDateDisabled?: (date: ISODate) => boolean;
  weekStartsOn?: WeekStart;
  /** Bounds of the year select. Defaults to 10 years back and one forward. */
  fromYear?: number;
  toYear?: number;
  /**
   * Injectable "today", so a story or a test renders the same grid on every run.
   * Defaults to the viewer's own date.
   */
  today?: ISODate;
  /** Distinguishes the two grids in the range panel, e.g. "From". */
  label?: string;
  className?: string;
}

export function Calendar({
  month,
  onMonthChange,
  value,
  onSelect,
  min,
  max,
  isDateDisabled,
  weekStartsOn = 0,
  fromYear,
  toYear,
  today: todayProp,
  label,
  className,
}: CalendarProps) {
  const today = todayProp ?? todayISO();
  const year = getYear(month);
  const monthIndex = getMonth(month);

  const range = value ?? { from: null, to: null };
  const headers = useMemo(() => weekdayHeaders(weekStartsOn), [weekStartsOn]);
  const weeks = useMemo(
    () => monthMatrix(year, monthIndex, weekStartsOn),
    [year, monthIndex, weekStartsOn],
  );

  /**
   * Which day holds the tab stop. Stored rather than derived so arrow keys can
   * move it, but IGNORED once the displayed month moves past it — otherwise
   * changing the month with the select would leave the tab stop on a day that is
   * no longer rendered, and the grid would have no tab stop at all.
   */
  const [focused, setFocused] = useState<ISODate | null>(null);
  const gridRef = useRef<HTMLTableElement | null>(null);

  const tabStop =
    focused && isSameMonth(focused, month)
      ? focused
      : [range.from, range.to, today].find(
          (candidate) => candidate && isSameMonth(candidate, month),
        ) ?? startOfMonth(month);

  const unavailable = (iso: ISODate) =>
    Boolean(min && iso < min) ||
    Boolean(max && iso > max) ||
    Boolean(isDateDisabled?.(iso));

  /**
   * Moves the tab stop, pulling the displayed month along when the target falls
   * outside it. Focus is applied imperatively AFTER the move, because the target
   * button may not have existed on the previous render.
   */
  const moveFocus = (target: ISODate) => {
    const next = clampISO(target, min, max);
    setFocused(next);
    if (!isSameMonth(next, month)) onMonthChange(startOfMonth(next));
    // Deferred to the next frame so the new month has rendered its cells.
    requestAnimationFrame(() => {
      gridRef.current
        ?.querySelector<HTMLButtonElement>(`[data-cx-day="${next}"]`)
        ?.focus();
    });
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTableElement>) => {
    const step: Record<string, number> = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -7,
      ArrowDown: 7,
    };
    const days = step[event.key];
    if (days !== undefined) {
      event.preventDefault();
      moveFocus(toISODate(year, monthIndex, Number(tabStop.slice(8, 10)) + days));
      return;
    }

    if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      moveFocus(
        event.key === "Home"
          ? startOfMonth(month)
          : toISODate(year, monthIndex, daysInMonth(year, monthIndex)),
      );
      return;
    }

    if (event.key === "PageUp" || event.key === "PageDown") {
      event.preventDefault();
      const direction = event.key === "PageUp" ? -1 : 1;
      moveFocus(addMonths(tabStop, direction * (event.shiftKey ? 12 : 1)));
    }
  };

  /**
   * Newest year first: findings, scans and log windows skew recent, so the years
   * an operator reaches for are at the top rather than a decade down the list.
   * The displayed year is always included even when it sits outside the
   * configured bounds — a select whose value matches no option renders blank.
   */
  const years = useMemo(() => {
    const current = getYear(today);
    const start = fromYear ?? (min ? getYear(min) : current - 10);
    const end = toYear ?? (max ? getYear(max) : current + 1);
    const set = new Set<number>([year]);
    for (let y = Math.min(start, end); y <= Math.max(start, end); y += 1) {
      set.add(y);
    }
    return [...set].sort((a, b) => b - a);
  }, [today, fromYear, toYear, min, max, year]);

  /** A month with no selectable day in it is offered but not selectable. */
  const monthUnavailable = (index: number) => {
    const first = toISODate(year, index, 1);
    const last = toISODate(year, index, daysInMonth(year, index));
    return Boolean(min && last < min) || Boolean(max && first > max);
  };

  const monthLabel = `${MONTH_NAMES[monthIndex]} ${year}`;

  return (
    <div className={cn("flex min-w-0 flex-col gap-3", className)}>
      {/* These two selects sit inside a Field's control rather than being it.
          Without the boundary they inherit the field's id — three elements, one
          id — and its aria-invalid, so a bad date would be reported by the month
          dropdown. Context reaches them even when the calendar is portaled: a
          portal moves the DOM node, not the React tree. */}
      <FieldBoundary>
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <Select
              value={String(monthIndex)}
              onChange={(event) =>
                onMonthChange(toISODate(year, Number(event.target.value), 1))
              }
              aria-label={label ? `${label} month` : "Month"}
            >
              {MONTH_NAMES.map((name, index) => (
                <option
                  key={name}
                  value={index}
                  disabled={monthUnavailable(index)}
                >
                  {name}
                </option>
              ))}
            </Select>
          </div>
          <div className="w-[104px] shrink-0">
            <Select
              value={String(year)}
              onChange={(event) =>
                onMonthChange(
                  toISODate(
                    Number(event.target.value),
                    monthIndex,
                    // Clamp: 29 February is not a day in most years.
                    Math.min(
                      getDay(month),
                      daysInMonth(Number(event.target.value), monthIndex),
                    ),
                  ),
                )
              }
              aria-label={label ? `${label} year` : "Year"}
            >
              {years.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </FieldBoundary>

      {/* Changing the month with the select or PageUp does not re-announce the
          grid's own label, so the month is spoken from here instead. */}
      <span aria-live="polite" className="sr-only">
        {monthLabel}
      </span>

      <table
        ref={gridRef}
        role="grid"
        aria-label={label ? `${label} — ${monthLabel}` : monthLabel}
        onKeyDown={onKeyDown}
        className="w-full table-fixed border-collapse"
      >
        <thead>
          <tr role="row">
            {headers.map(({ letter, name }, index) => (
              <th
                key={index}
                role="columnheader"
                scope="col"
                className="text-fg-2 pb-1.5 text-center text-[12px] font-semibold"
              >
                <span aria-hidden="true">{letter}</span>
                <span className="sr-only">{name}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week, weekIndex) => (
            <tr key={weekIndex} role="row">
              {week.map((iso, columnIndex) => {
                if (!iso) {
                  return (
                    <td
                      key={columnIndex}
                      role="gridcell"
                      aria-disabled="true"
                      className="p-0 pb-1"
                    />
                  );
                }

                const isStart = iso === range.from;
                const isEnd = iso === range.to;
                const isEndpoint = isStart || isEnd;
                const inBand = isInRange(iso, range);
                const disabled = unavailable(iso);
                const isToday = iso === today;

                return (
                  <td
                    key={columnIndex}
                    role="gridcell"
                    aria-selected={isEndpoint || undefined}
                    className="p-0 pb-1"
                  >
                    {/* The band lives on this wrapper, not on the button, so it
                        runs edge to edge between cells and reads as one bar
                        across the week. The button keeps its own 36px square. */}
                    <div
                      className={cn(
                        "flex h-9 items-center justify-center",
                        inBand && "bg-wash-2",
                        inBand && (isStart || columnIndex === 0) && "rounded-l-sm",
                        inBand && (isEnd || columnIndex === 6) && "rounded-r-sm",
                      )}
                    >
                      <button
                        type="button"
                        data-cx-day={iso}
                        tabIndex={iso === tabStop ? 0 : -1}
                        aria-disabled={disabled || undefined}
                        aria-current={isToday ? "date" : undefined}
                        // The visible label is a bare number; the full date is
                        // what a screen reader needs to place it.
                        aria-label={formatISODate(iso)}
                        onClick={() => {
                          if (disabled) return;
                          setFocused(iso);
                          onSelect?.(iso);
                        }}
                        className={cn(
                          "duration-instant ease-brand grid size-9 place-items-center rounded-sm text-[13px] tabular-nums transition-colors",
                          disabled
                            ? "text-fg-muted cursor-not-allowed opacity-40"
                            : "cursor-pointer",
                          isEndpoint
                            ? "bg-accent text-accent-fg font-semibold"
                            : isToday
                              ? "border-rule text-fg border font-medium"
                              : "text-fg-2",
                          !disabled &&
                            !isEndpoint &&
                            "hover:bg-wash-3 hover:text-fg",
                        )}
                      >
                        {Number(iso.slice(8, 10))}
                      </button>
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
