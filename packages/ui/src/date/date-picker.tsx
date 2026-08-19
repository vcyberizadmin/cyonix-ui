"use client";

/**
 * CX-DTE — DatePicker. One date, inside a form.
 *
 * CX-FLD ships Input, Textarea, Select, Checkbox and Switch, and no date
 * control, so every form that needed one reached for `<input type="date">`. That
 * input cannot be styled: its border, its fill, its calendar glyph and the
 * picker it opens all come from the browser, so the same field renders four
 * different ways across Chrome, Safari, Firefox and Edge and matches the theme
 * in none of them. It also formats the value by the OS locale, which means the
 * same date reads as 02/10 to one operator and 10/02 to another — genuinely
 * dangerous on an incident timeline.
 *
 * So the trigger is a button wearing the CX-FLD input recipe, and it opens the
 * same Calendar the range panel uses. It reads its `id`, `aria-describedby`,
 * `aria-invalid` and `disabled` out of the enclosing Field, exactly like the
 * other controls, so a page cannot forget to associate it. `<label for>` points
 * at a button quite legally — a button is a labelable element.
 *
 * NO APPLY HERE, deliberately. A single date is complete the moment it is
 * clicked, so it commits and closes — the same rule the range panel follows, in
 * the case where one interaction is all it takes. See date-range-picker.tsx for
 * why a range is the exception.
 */
import { useState } from "react";
import { cn } from "../lib/cn.js";
import { useFieldControl } from "../form/field.js";
import { Popover } from "../overlays/tooltip.js";
import { Calendar } from "./calendar.js";
import { CalendarIcon } from "./date-range-picker.js";
import {
  formatISODate,
  startOfMonth,
  todayISO,
  type ISODate,
  type WeekStart,
} from "./dates.js";

export interface DatePickerProps {
  value: ISODate | null;
  /** Null only ever arrives from the clear button. */
  onChange: (date: ISODate | null) => void;
  /** Shown while empty. Say the shape, not "Pick a date". */
  placeholder?: string;
  /** Adds a × inside the control. Off by default — most fields are required. */
  clearable?: boolean;
  min?: ISODate | null;
  max?: ISODate | null;
  isDateDisabled?: (date: ISODate) => boolean;
  weekStartsOn?: WeekStart;
  fromYear?: number;
  toYear?: number;
  /** Injectable "today". Defaults to the viewer's own date. */
  today?: ISODate;
  /** Only needed outside a Field, which otherwise supplies the association. */
  "aria-label"?: string;
  align?: "start" | "end";
  disabled?: boolean;
  className?: string;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Select a date",
  clearable = false,
  min,
  max,
  isDateDisabled,
  weekStartsOn = 0,
  fromYear,
  toYear,
  today: todayProp,
  align = "start",
  disabled,
  className,
  ...rest
}: DatePickerProps) {
  const field = useFieldControl();
  const today = todayProp ?? todayISO();

  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() => startOfMonth(value ?? today));

  const isDisabled = disabled ?? field?.disabled;
  const showClear = clearable && Boolean(value) && !isDisabled;

  return (
    // Positioning context for the clear button. It has to be a SIBLING of the
    // trigger rather than a child: a button inside a button is invalid markup,
    // and nesting it would make clearing the date also toggle the panel.
    <span className={cn("relative block w-full", className)}>
      <Popover
        open={open}
        onOpenChange={(next) => {
          // Reopen on the month the value lives in, not wherever the last
          // session was left.
          if (next) setMonth(startOfMonth(value ?? today));
          setOpen(next);
        }}
        align={align}
        label={placeholder}
        className="max-w-none p-3"
        content={
          <Calendar
            month={month}
            onMonthChange={setMonth}
            value={{ from: value, to: value }}
            onSelect={(date) => {
              onChange(date);
              setOpen(false);
            }}
            min={min}
            max={max}
            isDateDisabled={isDateDisabled}
            weekStartsOn={weekStartsOn}
            fromYear={fromYear}
            toYear={toYear}
            today={today}
            className="w-[252px]"
          />
        }
      >
        <button
          type="button"
          {...field}
          {...rest}
          disabled={isDisabled}
          className={cn(
            // The CX-FLD input recipe: wash fill, hairline that goes orange on
            // focus, radius-sm on all four corners.
            "bg-wash-1 border-rule text-fg focus:border-accent aria-invalid:border-danger duration-instant ease-brand flex h-9 w-full cursor-pointer items-center gap-2 rounded-sm border px-2.5 text-left text-[13px] transition-colors focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
            !value && "text-fg-2",
            showClear ? "pr-9" : "pr-2.5",
          )}
        >
          <CalendarIcon className="text-fg-muted" />
          <span className="min-w-0 flex-1 truncate">
            {value ? formatISODate(value) : placeholder}
          </span>
        </button>
      </Popover>

      {showClear && (
        <button
          type="button"
          onClick={() => onChange(null)}
          aria-label="Clear date"
          className="text-fg-muted hover:text-danger-ink duration-instant ease-brand absolute top-1/2 right-2.5 grid size-4 -translate-y-1/2 cursor-pointer place-items-center rounded-full transition-colors"
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
      )}
    </span>
  );
}
