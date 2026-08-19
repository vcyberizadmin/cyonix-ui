"use client";

/**
 * CX-DTE — DateRangePicker and DateRangeFilter.
 *
 * This is the control CX-FLT lists as an operation and never specifies: "bound
 * by date with a start–end range". A preset rail on the left, a read-out of what
 * is about to be applied along the top, and two month grids — one per end of the
 * range — so an end date is picked rather than counted out from the start.
 *
 * WHY THIS ONE FILTER HAS AN APPLY BUTTON
 * ---------------------------------------
 * CX-FLT is explicit that filters apply IMMEDIATELY and that an Apply button is
 * the wrong shape for a filter strip. A date range is the exception, and the
 * reason is structural rather than aesthetic: every other filter in the toolbar
 * reaches a valid state in one interaction, and a range does not. It is
 * assembled from up to six — a month, a year and a day at each end — and the
 * states in between are not merely stale, they are WRONG. "Everything since 10
 * February" and "everything up to 10 February" are both fair readings of a range
 * with one end filled in, so applying on each click means firing a series of
 * expensive queries, most of them for a window the operator never asked for, and
 * showing the last of them as though it were the answer.
 *
 * So the whole panel is one transaction: presets, hand-picked days and Clear
 * filters all write to a DRAFT, Apply commits it, Cancel discards it. A preset
 * does not shortcut past Apply either — a rail where one row applies instantly
 * and the grid beside it does not is a worse inconsistency than the Apply button.
 *
 * Apply is disabled while exactly one end is filled in, which is the only state
 * the panel refuses. Clearing both ends and applying is how the filter is
 * removed, so an empty range commits normally.
 */
import { useEffect, useRef, useState } from "react";
import { cn } from "../lib/cn.js";
import { Button } from "../button.js";
import { Popover } from "../overlays/tooltip.js";
import { Calendar } from "./calendar.js";
import {
  DATE_RANGE_PRESETS,
  formatDateRange,
  formatISODate,
  isRangePartial,
  matchPreset,
  startOfMonth,
  todayISO,
  type DateRange,
  type DateRangePreset,
  type ISODate,
  type WeekStart,
} from "./dates.js";

export interface DateRangePickerProps {
  /** The APPLIED range. The panel drafts its own copy and never mutates this. */
  value: DateRange;
  /** Fires only from Apply. An empty range means the filter was removed. */
  onApply: (range: DateRange) => void;
  /** Cancel and Escape both route here. Omit for an inline panel with no host. */
  onCancel?: () => void;
  /** Override the rail. Pass `[]` to drop it and show the grids alone. */
  presets?: DateRangePreset[];
  min?: ISODate | null;
  max?: ISODate | null;
  isDateDisabled?: (date: ISODate) => boolean;
  weekStartsOn?: WeekStart;
  fromYear?: number;
  toYear?: number;
  /**
   * With nothing applied, open with TODAY selected instead of an empty read-out,
   * so the panel is usable on the first click rather than the third. On by
   * default; pass `false` for a panel that opens blank.
   *
   * This seeds the DRAFT only. Nothing is filtered until Apply, so the trigger
   * still reads its idle label and the table still shows every row — the point
   * CX-FLT makes about applied filter state staying visible is not weakened by
   * pre-filling a panel the operator has to confirm.
   */
  defaultToToday?: boolean;
  /** Injectable "today", so presets and the today marker are deterministic. */
  today?: ISODate;
  className?: string;
}

export function DateRangePicker({
  value,
  onApply,
  onCancel,
  presets = DATE_RANGE_PRESETS,
  min,
  max,
  isDateDisabled,
  weekStartsOn = 0,
  fromYear,
  toYear,
  defaultToToday = true,
  today: todayProp,
  className,
}: DateRangePickerProps) {
  const today = todayProp ?? todayISO();

  /**
   * What the draft starts as. An applied range always wins; today only fills in
   * for a COMPLETELY empty one, never for a half-built range — overwriting a
   * start the operator has already chosen would be the worse behaviour.
   */
  const seeded = (range: DateRange): DateRange =>
    defaultToToday && !range.from && !range.to
      ? { from: today, to: today }
      : { from: range.from, to: range.to };

  const [draft, setDraft] = useState<DateRange>(() => seeded(value));
  const [fromMonth, setFromMonth] = useState(() =>
    startOfMonth(value.from ?? today),
  );
  const [toMonth, setToMonth] = useState(() =>
    startOfMonth(value.to ?? value.from ?? today),
  );
  const fromGridRef = useRef<HTMLDivElement | null>(null);

  // Re-seed when the applied range changes underneath us. Depends on the two
  // strings rather than the object, so a caller passing an inline literal does
  // not wipe a half-built draft on every parent render.
  //
  // Note what this does NOT do: Clear filters leaves `value` untouched, so the
  // effect does not fire and the cleared draft stays cleared. A Clear that
  // instantly refilled itself with today would look broken.
  useEffect(() => {
    setDraft(
      defaultToToday && !value.from && !value.to
        ? { from: today, to: today }
        : { from: value.from, to: value.to },
    );
  }, [value.from, value.to, defaultToToday, today]);

  const partial = isRangePartial(draft);
  const activePreset = matchPreset(draft, today, presets);
  const isCustom = !partial && !activePreset && Boolean(draft.from);

  const applyPreset = (preset: DateRangePreset) => {
    const next = preset.resolve(today);
    setDraft(next);
    // Move both grids onto the resolved window, so the rail's effect on the
    // calendars is visible rather than something to take on trust.
    if (next.from) setFromMonth(startOfMonth(next.from));
    if (next.to) setToMonth(startOfMonth(next.to));
  };

  /**
   * Picking one end drags the other along rather than rejecting the click.
   * Choosing a start after the current end collapses the range onto that single
   * day; one more click in the To grid widens it again. The alternative —
   * disabling every day before `from` in the To grid — leaves an already-applied
   * range impossible to move earlier without clearing it first.
   */
  const pickFrom = (date: ISODate) =>
    setDraft(({ to }) => ({ from: date, to: to && to < date ? date : to }));
  const pickTo = (date: ISODate) =>
    setDraft(({ from }) => ({ from: from && from > date ? date : from, to: date }));

  return (
    <div
      className={cn(
        "bg-surface flex flex-col min-[720px]:flex-row",
        className,
      )}
    >
      {presets.length > 0 && (
        <div className="border-rule flex shrink-0 flex-col border-b min-[720px]:w-[188px] min-[720px]:border-r min-[720px]:border-b-0">
          {/*
            The wireframe's "Customised »" row. It is not a preset — it reports
            that the draft came from the grids rather than the rail, and it
            carries the chevrons because the one useful thing to do from here is
            reach the grids the label is talking about.
          */}
          <button
            type="button"
            onClick={() =>
              fromGridRef.current
                ?.querySelector<HTMLButtonElement>('[tabindex="0"]')
                ?.focus()
            }
            className={cn(
              "border-rule duration-instant ease-brand flex cursor-pointer items-center justify-between gap-2 border-b px-4 py-2.5 text-left text-[13px] transition-colors",
              isCustom
                ? "text-accent-ink font-semibold"
                : "text-fg-2 hover:bg-wash-hover hover:text-fg font-medium",
            )}
          >
            Customised
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
              <path d="m6 17 5-5-5-5M13 17l5-5-5-5" />
            </svg>
          </button>

          {presets.map((preset) => {
            const active = preset.id === activePreset;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyPreset(preset)}
                aria-current={active || undefined}
                className={cn(
                  "border-rule duration-instant ease-brand relative cursor-pointer border-b px-4 py-2.5 text-left text-[13px] transition-colors last:border-b-0",
                  active
                    ? "text-accent-ink bg-wash-1 font-medium"
                    : "text-fg-2 hover:bg-wash-hover hover:text-fg",
                )}
              >
                {/* 3px leading bar — the same mark CX-NAV uses for "you are
                    here". A chosen preset is a current selection, so the accent
                    belongs; the hover above it stays neutral so the two never
                    read as the same thing. */}
                {active && (
                  <span
                    aria-hidden="true"
                    className="bg-accent absolute top-0 left-0 h-full w-[3px]"
                  />
                )}
                {preset.label}
              </button>
            );
          })}
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="border-rule flex flex-wrap items-center gap-x-4 gap-y-2 border-b px-4 py-3">
          <div className="flex min-w-0 flex-col gap-1">
            {/* The record of what Apply will commit. Announced politely, so a
                keyboard user hears the range change without leaving the grid. */}
            <div
              aria-live="polite"
              className="border-rule bg-wash-1 flex items-center gap-2 rounded-sm border px-3 py-2 text-[13px]"
            >
              <span className={draft.from ? "text-fg" : "text-fg-muted"}>
                {draft.from ? formatISODate(draft.from) : "Start date"}
              </span>
              <span aria-hidden="true" className="text-fg-muted">
                –
              </span>
              <span className={draft.to ? "text-fg" : "text-fg-muted"}>
                {draft.to ? formatISODate(draft.to) : "End date"}
              </span>
            </div>
            {/* Apply's disabled reason, rendered as text. A disabled control
                whose reason lives only in a title attribute is a dead end. */}
            {partial && (
              <p className="text-fg-muted text-[11px] leading-snug">
                Pick both a start and an end date to apply this range.
              </p>
            )}
          </div>

          <button
            type="button"
            // A fresh object, not the shared EMPTY_RANGE: this one goes into state
            // and then out to the caller through Apply, and a shared reference
            // that a consumer stores and mutates would reach every other picker.
            onClick={() => setDraft({ from: null, to: null })}
            className="text-accent-ink hover:text-fg duration-instant ease-brand cursor-pointer text-[13px] transition-colors"
          >
            Clear filters
          </button>

          <div className="ml-auto flex items-center gap-2">
            {onCancel && (
              <Button variant="ghost" size="sm" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button size="sm" onClick={() => onApply(draft)} disabled={partial}>
              Apply
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-5 px-4 py-3 min-[720px]:flex-row min-[720px]:gap-6">
          <div ref={fromGridRef} className="flex w-[252px] shrink-0 flex-col gap-2">
            <span className="text-fg text-[13px] font-semibold">From</span>
            <Calendar
              label="From"
              month={fromMonth}
              onMonthChange={setFromMonth}
              value={draft}
              onSelect={pickFrom}
              min={min}
              max={max}
              isDateDisabled={isDateDisabled}
              weekStartsOn={weekStartsOn}
              fromYear={fromYear}
              toYear={toYear}
              today={today}
            />
          </div>

          <div className="flex w-[252px] shrink-0 flex-col gap-2">
            <span className="text-fg text-[13px] font-semibold">To</span>
            <Calendar
              label="To"
              month={toMonth}
              onMonthChange={setToMonth}
              value={draft}
              onSelect={pickTo}
              min={min}
              max={max}
              isDateDisabled={isDateDisabled}
              weekStartsOn={weekStartsOn}
              fromYear={fromYear}
              toYear={toYear}
              today={today}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------- Toolbar trigger ---- */

export interface DateRangeFilterProps
  extends Omit<DateRangePickerProps, "value" | "onApply" | "onCancel"> {
  value: DateRange;
  /** Fires on Apply only, with the committed range. */
  onChange: (range: DateRange) => void;
  /** Trigger label while nothing is applied. */
  label?: string;
  /** Which edge of the trigger the panel aligns to. */
  align?: "start" | "end";
  triggerClassName?: string;
}

/**
 * The panel above, wired into the CX-FLT strip: a toolbar-height trigger that
 * reads out the applied range, and the picker in a popover.
 *
 * The trigger states the range rather than a generic "Date range" once one is
 * applied, because CX-FLT's central rule is that applied filter state stays
 * VISIBLE — hidden filter state is the commonest cause of "the data is wrong"
 * tickets. Pair it with a `FilterChip` in the toolbar's chip row when the range
 * should also be removable from there.
 */
export function DateRangeFilter({
  value,
  onChange,
  label = "Date range",
  align = "start",
  className,
  triggerClassName,
  ...picker
}: DateRangeFilterProps) {
  const [open, setOpen] = useState(false);
  const applied = Boolean(value.from ?? value.to);

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      align={align}
      label={label}
      // The stock popover is sized for a paragraph of help text. This panel is
      // ~745px of grid and brings its own padding, so both are switched off here
      // rather than by adding a variant to CX-TIP.
      className={cn("max-w-none overflow-hidden p-0", className)}
      content={
        <DateRangePicker
          {...picker}
          value={value}
          onApply={(range) => {
            onChange(range);
            setOpen(false);
          }}
          onCancel={() => setOpen(false)}
        />
      }
    >
      <button
        type="button"
        className={cn(
          "border-rule bg-wash-1 focus:border-accent duration-instant ease-brand flex h-8 cursor-pointer items-center gap-1.5 rounded-sm border px-2.5 text-[12.5px] transition-colors focus:outline-none",
          applied ? "text-fg" : "text-fg-2 hover:text-fg",
          triggerClassName,
        )}
      >
        <CalendarIcon />
        {applied ? formatDateRange(value, true) : label}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="text-fg-muted size-3.5 shrink-0"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
    </Popover>
  );
}

/** Shared by the filter trigger and the single-date control. */
export function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cn("size-3.5 shrink-0", className)}
    >
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  );
}
