/**
 * CX-DTE date arithmetic. Server-safe: no directive, no React, no dependency.
 *
 * WHY STRINGS AND NOT `Date`
 * --------------------------
 * The value type is a plain `YYYY-MM-DD` string, and that is a deliberate
 * choice rather than an omission. A `Date` is an instant in time, but a picked
 * calendar day is not — "10 February" means the same day to an operator in
 * Dubai and one in London, and the moment you carry it as a `Date` you inherit
 * a timezone the user never chose. `new Date("2023-02-10")` parses as UTC
 * midnight, which is 9 February in every negative offset; `toISOString()` on a
 * local-midnight Date shifts the other way. Both bugs are invisible in CI, which
 * runs in UTC, and appear only for users west of Greenwich.
 *
 * Strings also fall out right for the two things CX-FLT actually asks of a date
 * filter: they are URL-safe without encoding, so a filtered view stays
 * linkable, and they compare correctly with `<` and `===`, so range maths needs
 * no library.
 *
 * `Date` still appears INSIDE this file — it is the only calendar JavaScript
 * ships with — but every construction pins the time to NOON. Midnight does not
 * exist on some DST-shift days in some zones, and a missing hour silently moves
 * a date by one day; noon has six hours of slack on either side of any real
 * transition.
 *
 * `month` is 0-indexed throughout, matching `Date.getMonth()`, so there is one
 * convention rather than two that have to be remembered per function.
 */

/** A calendar day, `YYYY-MM-DD`. Comparable with `<`, `>` and `===`. */
export type ISODate = string;

/**
 * A start–end range. Either end may be null: an empty range means "no date
 * filter", and exactly one end set means the user is mid-selection — see
 * `isRangeComplete`, which is what stops a half-built range reaching a query.
 */
export interface DateRange {
  from: ISODate | null;
  to: ISODate | null;
}

/** The one shared empty value, so callers do not each allocate their own. */
export const EMPTY_RANGE: DateRange = { from: null, to: null };

/** Full month names, index-aligned with `Date.getMonth()`. */
export const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

/** Three-letter month abbreviations for the compact format. */
export const MONTH_ABBREVIATIONS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

/**
 * Full weekday names, Sunday first. The column headers show a single letter, but
 * a letter is not a name — "T" is both Tuesday and Thursday, and a screen reader
 * reading "T" twice tells you nothing. The grid renders the letter visibly and
 * these to assistive technology.
 */
export const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

/** Single-letter column headers, Sunday first. */
export const WEEKDAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"] as const;

/** Sunday or Monday. Nothing else is in use across the three consoles. */
export type WeekStart = 0 | 1;

function pad(value: number): string {
  return value < 10 ? `0${value}` : String(value);
}

/** Builds an ISO day from parts. `month` is 0-indexed. */
export function toISODate(year: number, month: number, day: number): ISODate {
  // Normalise through Date so out-of-range parts (month 12, day 32) roll over
  // rather than producing a string that parses back to something else.
  const date = new Date(year, month, day, 12);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Reads a `Date` as the calendar day it falls on IN LOCAL TIME. */
export function fromDate(date: Date): ISODate {
  return toISODate(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Local noon on the given day. The inverse of `fromDate` for date-only use. */
export function toDate(iso: ISODate): Date {
  return new Date(getYear(iso), getMonth(iso), getDay(iso), 12);
}

/** Today, in the viewer's own timezone. */
export function todayISO(): ISODate {
  return fromDate(new Date());
}

/**
 * Today as a single-day range. A fresh object every call, deliberately — this is
 * what a caller seeds `useState` with, and a shared reference handed to several
 * pickers would let one of them mutate the others' initial value.
 */
export function todayRange(today: ISODate = todayISO()): DateRange {
  return { from: today, to: today };
}

export function getYear(iso: ISODate): number {
  return Number(iso.slice(0, 4));
}

/** 0-indexed, matching `Date.getMonth()`. */
export function getMonth(iso: ISODate): number {
  return Number(iso.slice(5, 7)) - 1;
}

export function getDay(iso: ISODate): number {
  return Number(iso.slice(8, 10));
}

/** Days in the given 0-indexed month, leap years included. */
export function daysInMonth(year: number, month: number): number {
  // Day 0 of the NEXT month is the last day of this one.
  return new Date(year, month + 1, 0, 12).getDate();
}

export function addDays(iso: ISODate, days: number): ISODate {
  return toISODate(getYear(iso), getMonth(iso), getDay(iso) + days);
}

/**
 * Adds whole months, CLAMPING the day to the target month's length. Without the
 * clamp, 31 January minus one month rolls forward to 3 March, which is how a
 * "last month" preset ends up covering the wrong month entirely.
 */
export function addMonths(iso: ISODate, months: number): ISODate {
  const anchor = new Date(getYear(iso), getMonth(iso) + months, 1, 12);
  const year = anchor.getFullYear();
  const month = anchor.getMonth();
  return toISODate(year, month, Math.min(getDay(iso), daysInMonth(year, month)));
}

/** First day of the month `iso` falls in. What the grid is keyed on. */
export function startOfMonth(iso: ISODate): ISODate {
  return toISODate(getYear(iso), getMonth(iso), 1);
}

export function isSameMonth(a: ISODate, b: ISODate): boolean {
  return a.slice(0, 7) === b.slice(0, 7);
}

/** Holds `iso` inside the given bounds. Either bound may be omitted. */
export function clampISO(
  iso: ISODate,
  min?: ISODate | null,
  max?: ISODate | null,
): ISODate {
  if (min && iso < min) return min;
  if (max && iso > max) return max;
  return iso;
}

/** Both ends present and correctly ordered. */
export function isRangeComplete(range: DateRange): range is {
  from: ISODate;
  to: ISODate;
} {
  return Boolean(range.from && range.to && range.from <= range.to);
}

/**
 * Exactly one end set. This is the state the Apply button refuses to commit —
 * "everything since 10 February" and "everything up to 10 February" are both
 * plausible readings of a half-built range, so the panel asks rather than
 * guessing.
 */
export function isRangePartial(range: DateRange): boolean {
  return Boolean(range.from) !== Boolean(range.to);
}

/** Inclusive of both ends: a single-day range contains its own day. */
export function isInRange(iso: ISODate, range: DateRange): boolean {
  if (!isRangeComplete(range)) return false;
  return iso >= range.from && iso <= range.to;
}

/**
 * Puts a range the right way round. The panel calls this after every pick, so
 * choosing an end date before the start reorders the range instead of rejecting
 * the click. The alternative — disabling every day before `from` in the To
 * calendar — makes a range you have already committed impossible to widen
 * backwards without clearing it first.
 */
export function orderRange(range: DateRange): DateRange {
  const { from, to } = range;
  if (from && to && from > to) return { from: to, to: from };
  return range;
}

/** "10 February 2023", or "10 Feb 2023" when `short`. */
export function formatISODate(iso: ISODate, short = false): string {
  const names = short ? MONTH_ABBREVIATIONS : MONTH_NAMES;
  return `${getDay(iso)} ${names[getMonth(iso)]} ${getYear(iso)}`;
}

/**
 * A range as one phrase. The compact form drops the repeated year
 * ("10 Feb – 17 Mar 2023") because a toolbar trigger has to fit beside the
 * search field, and the long form keeps both because the panel's read-out is
 * the record of exactly what is about to be applied.
 */
export function formatDateRange(range: DateRange, short = false): string {
  const { from, to } = range;
  if (!from && !to) return "";
  if (from && !to) return formatISODate(from, short);
  if (to && !from) return formatISODate(to, short);
  if (!from || !to) return "";

  const dash = " – ";
  if (short && getYear(from) === getYear(to)) {
    const start = `${getDay(from)} ${MONTH_ABBREVIATIONS[getMonth(from)]}`;
    return `${start}${dash}${formatISODate(to, true)}`;
  }
  return `${formatISODate(from, short)}${dash}${formatISODate(to, short)}`;
}

/**
 * The grid, as weeks of seven. Leading and trailing blanks are `null` rather
 * than the neighbouring month's days: a greyed-out 31 January sitting under the
 * February heading is a click target that changes the month out from under you,
 * and the wireframe shows the blanks empty.
 */
export function monthMatrix(
  year: number,
  month: number,
  weekStartsOn: WeekStart = 0,
): (ISODate | null)[][] {
  const lead = (new Date(year, month, 1, 12).getDay() - weekStartsOn + 7) % 7;
  const cells: (ISODate | null)[] = Array.from({ length: lead }, () => null);

  const total = daysInMonth(year, month);
  for (let day = 1; day <= total; day += 1) {
    cells.push(toISODate(year, month, day));
  }
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (ISODate | null)[][] = [];
  for (let index = 0; index < cells.length; index += 7) {
    weeks.push(cells.slice(index, index + 7));
  }
  return weeks;
}

/** Column headers in display order, rotated for the chosen week start. */
export function weekdayHeaders(
  weekStartsOn: WeekStart = 0,
): { letter: string; name: string }[] {
  return Array.from({ length: 7 }, (_unused, index) => {
    const day = (index + weekStartsOn) % 7;
    return {
      letter: WEEKDAY_LETTERS[day] ?? "",
      name: WEEKDAY_NAMES[day] ?? "",
    };
  });
}

/* ------------------------------------------------------------- Presets ----- */

export interface DateRangePreset {
  /** Stable id, used to mark which preset the applied range came from. */
  id: string;
  label: string;
  /**
   * Resolved against the day it is CLICKED, never at module load. A dashboard
   * left open overnight would otherwise keep offering yesterday's "Today".
   */
  resolve: (today: ISODate) => DateRange;
}

/**
 * The wireframe's rail. Every window is INCLUSIVE OF TODAY and counts backwards
 * from it, so "Last 7 Days" is today and the six before it — not the seven days
 * ending yesterday. Both readings exist in the wild; this one is stated here so
 * three consoles cannot each pick a different one, and so a preset's own label
 * matches the count of days it selects.
 */
export const DATE_RANGE_PRESETS: DateRangePreset[] = [
  { id: "today", label: "Today", resolve: (today) => ({ from: today, to: today }) },
  {
    id: "last3Days",
    label: "Last 3 Days",
    resolve: (today) => ({ from: addDays(today, -2), to: today }),
  },
  {
    id: "last7Days",
    label: "Last 7 Days",
    resolve: (today) => ({ from: addDays(today, -6), to: today }),
  },
  {
    id: "last30Days",
    label: "Last 30 Days",
    resolve: (today) => ({ from: addDays(today, -29), to: today }),
  },
  {
    id: "last3Months",
    label: "Last 3 Months",
    resolve: (today) => ({ from: addDays(addMonths(today, -3), 1), to: today }),
  },
  {
    id: "last6Months",
    label: "Last 6 Months",
    resolve: (today) => ({ from: addDays(addMonths(today, -6), 1), to: today }),
  },
  {
    id: "last1Year",
    label: "Last 1 Year",
    resolve: (today) => ({ from: addDays(addMonths(today, -12), 1), to: today }),
  },
];

/**
 * Which preset, if any, produced this range. Returns null for a hand-picked
 * range — that is what makes the rail's "Custom range" entry light up on its
 * own rather than needing a mode flag threaded through the component.
 */
export function matchPreset(
  range: DateRange,
  today: ISODate,
  presets: DateRangePreset[] = DATE_RANGE_PRESETS,
): string | null {
  if (!isRangeComplete(range)) return null;
  for (const preset of presets) {
    const candidate = preset.resolve(today);
    if (candidate.from === range.from && candidate.to === range.to) {
      return preset.id;
    }
  }
  return null;
}
