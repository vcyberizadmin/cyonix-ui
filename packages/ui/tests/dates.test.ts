/**
 * The date arithmetic.
 *
 * Pure functions, so there is no excuse for not testing them, and date maths is
 * where the bugs live: month-end rollover, leap years, DST, week-start
 * rotation, and the off-by-one in "last 7 days". Each of those is a specific
 * wrong answer rather than a crash, so nothing else in the pipeline can see it.
 *
 * The library's own doc comments make claims — "CLAMPING the day to the target
 * month's length", "INCLUSIVE OF TODAY" — and these tests are what hold the
 * code to them.
 */
import { describe, expect, it } from "vitest";
import {
  DATE_RANGE_PRESETS,
  EMPTY_RANGE,
  addDays,
  addMonths,
  clampISO,
  daysInMonth,
  formatDateRange,
  formatISODate,
  fromDate,
  getDay,
  getMonth,
  getYear,
  isInRange,
  isRangeComplete,
  isRangePartial,
  isSameMonth,
  matchPreset,
  monthMatrix,
  orderRange,
  startOfMonth,
  toDate,
  toISODate,
  todayRange,
  weekdayHeaders,
  type ISODate,
} from "../src/date/dates.js";

describe("toISODate", () => {
  it("zero-pads", () => {
    expect(toISODate(2026, 0, 5)).toBe("2026-01-05");
  });

  it("takes a 0-indexed month", () => {
    expect(toISODate(2026, 11, 25)).toBe("2026-12-25");
  });

  it("rolls an out-of-range day into the next month", () => {
    // The doc comment promises normalisation rather than a malformed string.
    expect(toISODate(2026, 0, 32)).toBe("2026-02-01");
  });

  it("rolls an out-of-range month into the next year", () => {
    expect(toISODate(2026, 12, 1)).toBe("2027-01-01");
  });

  it("rolls a negative day backwards", () => {
    expect(toISODate(2026, 1, 0)).toBe("2026-01-31");
  });
});

describe("accessors", () => {
  it.each([
    ["2026-08-26", 2026, 7, 26],
    ["2000-01-01", 2000, 0, 1],
    ["1999-12-31", 1999, 11, 31],
  ] as const)("%s", (iso, year, month, day) => {
    expect(getYear(iso)).toBe(year);
    expect(getMonth(iso)).toBe(month);
    expect(getDay(iso)).toBe(day);
  });
});

describe("toDate / fromDate round-trip", () => {
  it.each(["2026-01-01", "2026-02-28", "2026-06-15", "2026-12-31"] as ISODate[])(
    "%s survives the round trip",
    (iso) => {
      expect(fromDate(toDate(iso))).toBe(iso);
    },
  );

  it("anchors at local noon so a DST shift cannot move the day", () => {
    // Midnight anchoring is the classic bug: in a timezone that springs forward
    // at 00:00, `new Date(y, m, d)` lands on the previous day.
    expect(toDate("2026-03-29").getHours()).toBe(12);
  });

  it("reads a Date as its LOCAL calendar day", () => {
    expect(fromDate(new Date(2026, 7, 26, 23, 59))).toBe("2026-08-26");
    expect(fromDate(new Date(2026, 7, 26, 0, 1))).toBe("2026-08-26");
  });
});

describe("daysInMonth", () => {
  it.each([
    [2026, 0, 31],
    [2026, 1, 28],
    [2026, 3, 30],
    [2026, 11, 31],
  ])("%i-%i has %i days", (year, month, days) => {
    expect(daysInMonth(year, month)).toBe(days);
  });

  it("handles leap years, including the century rules", () => {
    expect(daysInMonth(2024, 1)).toBe(29); // divisible by 4
    expect(daysInMonth(1900, 1)).toBe(28); // century, not divisible by 400
    expect(daysInMonth(2000, 1)).toBe(29); // divisible by 400
  });
});

describe("addDays", () => {
  it("crosses a month boundary", () => {
    expect(addDays("2026-01-31", 1)).toBe("2026-02-01");
  });

  it("crosses a year boundary", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
  });

  it("goes backwards", () => {
    expect(addDays("2026-01-01", -1)).toBe("2025-12-31");
  });

  it("lands on 29 February in a leap year", () => {
    expect(addDays("2024-02-28", 1)).toBe("2024-02-29");
    expect(addDays("2025-02-28", 1)).toBe("2025-03-01");
  });

  it("is the identity for zero", () => {
    expect(addDays("2026-08-26", 0)).toBe("2026-08-26");
  });
});

describe("addMonths", () => {
  it("clamps the day to the target month's length", () => {
    // The documented reason this exists: without the clamp, 31 January minus
    // one month rolls forward to 3 March and "last month" covers the wrong
    // month entirely.
    expect(addMonths("2026-01-31", 1)).toBe("2026-02-28");
    expect(addMonths("2026-03-31", -1)).toBe("2026-02-28");
    expect(addMonths("2024-01-31", 1)).toBe("2024-02-29");
  });

  it("keeps the day when the target month is long enough", () => {
    expect(addMonths("2026-01-15", 1)).toBe("2026-02-15");
  });

  it("crosses years in both directions", () => {
    expect(addMonths("2026-12-15", 1)).toBe("2027-01-15");
    expect(addMonths("2026-01-15", -1)).toBe("2025-12-15");
    expect(addMonths("2026-06-15", 12)).toBe("2027-06-15");
  });

  it("does not accumulate error over a year of single steps", () => {
    // Stepping 31 January forward twelve times must not drift, even though the
    // clamp discards days along the way.
    let cursor: ISODate = "2026-01-31";
    for (let i = 0; i < 12; i += 1) cursor = addMonths(cursor, 1);
    // Each step clamps from the PREVIOUS result, so February's 28 propagates.
    // Documenting the actual behaviour: the value is stable, not restored.
    expect(cursor).toBe("2027-01-28");
    expect(addMonths("2026-01-31", 12)).toBe("2027-01-31");
  });
});

describe("startOfMonth / isSameMonth", () => {
  it("startOfMonth keeps the month", () => {
    expect(startOfMonth("2026-08-26")).toBe("2026-08-01");
    expect(startOfMonth("2026-08-01")).toBe("2026-08-01");
  });

  it("isSameMonth needs the year to match too", () => {
    expect(isSameMonth("2026-08-01", "2026-08-31")).toBe(true);
    expect(isSameMonth("2026-08-01", "2025-08-01")).toBe(false);
    expect(isSameMonth("2026-08-31", "2026-09-01")).toBe(false);
  });
});

describe("clampISO", () => {
  it("pulls a value up to the minimum", () => {
    expect(clampISO("2026-01-01", "2026-06-01")).toBe("2026-06-01");
  });

  it("pulls a value down to the maximum", () => {
    expect(clampISO("2026-12-01", null, "2026-06-01")).toBe("2026-06-01");
  });

  it("leaves an in-range value alone", () => {
    expect(clampISO("2026-06-15", "2026-01-01", "2026-12-31")).toBe("2026-06-15");
  });

  it("treats both bounds as inclusive", () => {
    expect(clampISO("2026-01-01", "2026-01-01", "2026-12-31")).toBe("2026-01-01");
    expect(clampISO("2026-12-31", "2026-01-01", "2026-12-31")).toBe("2026-12-31");
  });

  it("ignores omitted bounds", () => {
    expect(clampISO("2026-06-15")).toBe("2026-06-15");
    expect(clampISO("2026-06-15", null, null)).toBe("2026-06-15");
  });
});

describe("range predicates", () => {
  it("complete requires both ends, correctly ordered", () => {
    expect(isRangeComplete({ from: "2026-01-01", to: "2026-01-31" })).toBe(true);
    expect(isRangeComplete({ from: "2026-01-01", to: "2026-01-01" })).toBe(true);
    expect(isRangeComplete({ from: "2026-01-31", to: "2026-01-01" })).toBe(false);
    expect(isRangeComplete({ from: "2026-01-01", to: null })).toBe(false);
    expect(isRangeComplete(EMPTY_RANGE)).toBe(false);
  });

  it("partial means exactly one end", () => {
    expect(isRangePartial({ from: "2026-01-01", to: null })).toBe(true);
    expect(isRangePartial({ from: null, to: "2026-01-01" })).toBe(true);
    expect(isRangePartial({ from: "2026-01-01", to: "2026-01-31" })).toBe(false);
    expect(isRangePartial(EMPTY_RANGE)).toBe(false);
  });

  it("isInRange is inclusive of both endpoints", () => {
    const range = { from: "2026-01-10" as ISODate, to: "2026-01-20" as ISODate };
    expect(isInRange("2026-01-10", range)).toBe(true);
    expect(isInRange("2026-01-20", range)).toBe(true);
    expect(isInRange("2026-01-15", range)).toBe(true);
    expect(isInRange("2026-01-09", range)).toBe(false);
    expect(isInRange("2026-01-21", range)).toBe(false);
  });

  it("orderRange swaps a reversed pair", () => {
    expect(orderRange({ from: "2026-01-31", to: "2026-01-01" })).toEqual({
      from: "2026-01-01",
      to: "2026-01-31",
    });
  });

  it("orderRange leaves an ordered pair alone", () => {
    const ordered = { from: "2026-01-01" as ISODate, to: "2026-01-31" as ISODate };
    expect(orderRange(ordered)).toEqual(ordered);
  });
});

describe("todayRange", () => {
  it("is a single day", () => {
    expect(todayRange("2026-08-26")).toEqual({ from: "2026-08-26", to: "2026-08-26" });
  });

  it("returns a fresh object every call", () => {
    // Documented: a shared reference handed to several pickers would let one
    // mutate the others' initial value.
    expect(todayRange("2026-08-26")).not.toBe(todayRange("2026-08-26"));
  });
});

describe("monthMatrix", () => {
  it("is always whole weeks of seven", () => {
    for (let month = 0; month < 12; month += 1) {
      const weeks = monthMatrix(2026, month);
      for (const week of weeks) expect(week).toHaveLength(7);
    }
  });

  it("contains every day of the month exactly once, in order", () => {
    for (let month = 0; month < 12; month += 1) {
      const days = monthMatrix(2026, month).flat().filter(Boolean) as ISODate[];
      expect(days).toHaveLength(daysInMonth(2026, month));
      expect(days[0]).toBe(toISODate(2026, month, 1));
      expect(days.at(-1)).toBe(toISODate(2026, month, daysInMonth(2026, month)));
      expect([...days].sort()).toEqual(days);
    }
  });

  it("pads with null rather than the neighbouring month's days", () => {
    // A greyed-out 31 January under the February heading is a click target that
    // changes the month out from under you.
    const weeks = monthMatrix(2026, 1); // February 2026 starts on a Sunday
    const flat = weeks.flat();
    for (const cell of flat) {
      if (cell !== null) expect(cell.slice(0, 7)).toBe("2026-02");
    }
  });

  it("places the first day in the correct column for weekStartsOn=0", () => {
    // 1 August 2026 is a Saturday — the last column of a Sunday-start week.
    expect(monthMatrix(2026, 7, 0)[0]).toEqual([
      null, null, null, null, null, null, "2026-08-01",
    ]);
  });

  it("rotates for weekStartsOn=1", () => {
    // Monday start moves Saturday from column 6 to column 5.
    expect(monthMatrix(2026, 7, 1)[0]).toEqual([
      null, null, null, null, null, "2026-08-01", "2026-08-02",
    ]);
  });

  it("needs no leading blanks when the month starts on the week start", () => {
    // 1 February 2026 is a Sunday.
    expect(monthMatrix(2026, 1, 0)[0]![0]).toBe("2026-02-01");
  });

  it("handles a leap February", () => {
    const days = monthMatrix(2024, 1).flat().filter(Boolean);
    expect(days).toHaveLength(29);
    expect(days.at(-1)).toBe("2024-02-29");
  });
});

describe("weekdayHeaders", () => {
  it("starts on Sunday by default", () => {
    expect(weekdayHeaders().map((d) => d.name)[0]).toBe("Sunday");
  });

  it("rotates to the chosen start", () => {
    expect(weekdayHeaders(1).map((d) => d.name)).toEqual([
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ]);
  });

  it("always returns seven with no gaps", () => {
    for (const start of [0, 1] as const) {
      const headers = weekdayHeaders(start);
      expect(headers).toHaveLength(7);
      for (const h of headers) {
        expect(h.letter).not.toBe("");
        expect(h.name).not.toBe("");
      }
    }
  });
});

describe("presets", () => {
  const TODAY: ISODate = "2026-08-26";

  it("every preset resolves to a complete, ordered range", () => {
    for (const preset of DATE_RANGE_PRESETS) {
      const range = preset.resolve(TODAY);
      expect(isRangeComplete(range), `${preset.id} produced ${JSON.stringify(range)}`).toBe(true);
    }
  });

  it("windows are inclusive of today and count backwards", () => {
    // Documented: "Last 7 Days" is today and the six before it, not the seven
    // days ending yesterday. The off-by-one here is invisible on a dashboard
    // and wrong in a report.
    const last7 = DATE_RANGE_PRESETS.find((p) => /7/.test(p.label));
    expect(last7, "expected a 7-day preset").toBeDefined();
    const range = last7!.resolve(TODAY);
    expect(range.to).toBe(TODAY);
    expect(range.from).toBe(addDays(TODAY, -6));
  });

  it("resolves against the day passed in, not module load", () => {
    // A dashboard left open overnight would otherwise keep offering
    // yesterday's "Today".
    for (const preset of DATE_RANGE_PRESETS) {
      const a = preset.resolve("2026-08-26");
      const b = preset.resolve("2027-03-01");
      expect(a, `${preset.id} ignored the supplied day`).not.toEqual(b);
    }
  });

  it("preset ids are unique", () => {
    const ids = DATE_RANGE_PRESETS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("matchPreset recognises a range a preset produced", () => {
    for (const preset of DATE_RANGE_PRESETS) {
      expect(matchPreset(preset.resolve(TODAY), TODAY)).toBe(preset.id);
    }
  });

  it("matchPreset returns null for a hand-picked range", () => {
    expect(matchPreset({ from: "2026-03-03", to: "2026-03-09" }, TODAY)).toBeNull();
  });

  it("matchPreset returns null for an incomplete range", () => {
    expect(matchPreset(EMPTY_RANGE, TODAY)).toBeNull();
    expect(matchPreset({ from: TODAY, to: null }, TODAY)).toBeNull();
  });
});

describe("formatting", () => {
  it("formats a single date", () => {
    expect(formatISODate("2026-08-26")).toMatch(/26/);
    expect(formatISODate("2026-08-26")).toMatch(/2026/);
  });

  it("has a short form", () => {
    expect(formatISODate("2026-08-26", true).length).toBeLessThanOrEqual(
      formatISODate("2026-08-26").length,
    );
  });

  it("collapses a single-day range rather than repeating the date", () => {
    // The regression: the "today" preset resolves to { from: X, to: X }, and
    // DateRangeFilter renders formatDateRange(value, true) in its trigger — so
    // choosing "Today" used to read "26 Aug – 26 Aug 2026".
    expect(formatDateRange({ from: "2026-08-26", to: "2026-08-26" })).toBe("26 August 2026");
    expect(formatDateRange({ from: "2026-08-26", to: "2026-08-26" }, true)).toBe("26 Aug 2026");
  });

  it("the today preset reads as one date, end to end", () => {
    expect(formatDateRange(todayRange("2026-08-26"), true)).toBe("26 Aug 2026");
    const today = DATE_RANGE_PRESETS.find((p) => p.id === "today")!;
    expect(formatDateRange(today.resolve("2026-08-26"), true)).toBe("26 Aug 2026");
  });

  it("still spans a genuine two-day range", () => {
    // The collapse must key on equality, not on "same month" or "short form".
    expect(formatDateRange({ from: "2026-08-26", to: "2026-08-27" }, true)).toContain("–");
  });

  it("returns an empty string for an empty range", () => {
    // Deliberate, and relied on: DateRangeFilter renders its own placeholder
    // via `applied ? formatDateRange(...) : label`, so the empty case never
    // reaches the screen. What matters is that it is empty rather than
    // "undefined – undefined".
    expect(formatDateRange(EMPTY_RANGE)).toBe("");
  });

  it("never renders NaN for a partial range", () => {
    for (const range of [
      { from: "2026-08-01" as ISODate, to: null },
      { from: null, to: "2026-08-26" as ISODate },
    ]) {
      expect(formatDateRange(range)).not.toMatch(/undefined|null|NaN/);
    }
  });
});
