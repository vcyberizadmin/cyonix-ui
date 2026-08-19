/**
 * Asserts CX-DTE's date arithmetic and the grid it renders.
 *
 * Why this exists
 * ---------------
 * Every failure mode in a date component is an OFF-BY-ONE that renders
 * perfectly. A leap day dropped, a "Last 7 Days" that quietly spans eight, a
 * month grid whose leading blanks are one column short so every date sits under
 * the wrong weekday, a `31 January` minus one month that rolls forward to 3
 * March. None of these throw, none fail a typecheck, and none look wrong in a
 * screenshot unless you happen to count. The same class of silent breakage the
 * other two verifiers exist for.
 *
 * The dates are FIXED, and deliberately awkward: February 2023 starts on a
 * Wednesday, 2024 is a leap year, and the January/December cases straddle a year
 * boundary. A test that runs against `today` passes for eleven months of the year.
 *
 * The render half renders through react-dom/server and asserts the structural
 * promises the component makes rather than its classes: one tab stop per grid,
 * both endpoints marked selected, unavailable days announced but still focusable,
 * and Apply refusing exactly one state.
 */
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Calendar, DatePicker, DateRangePicker, Field } from "../dist/index.js";
import * as D from "../dist/date/dates.js";

const failures = [];
const check = (label, condition) => {
  if (!condition) failures.push(label);
};

/* ------------------------------------------------------------- arithmetic --- */

check("leap February has 29 days", D.daysInMonth(2024, 1) === 29);
check("non-leap February has 28", D.daysInMonth(2023, 1) === 28);
check("31 Jan − 1 month clamps to 31 Dec", D.addMonths("2023-01-31", -1) === "2022-12-31");
check("31 Jan + 1 month clamps to 28 Feb", D.addMonths("2023-01-31", 1) === "2023-02-28");
check("29 Feb + 1 year clamps to 28 Feb", D.addMonths("2024-02-29", 12) === "2025-02-28");
check("28 Feb + 1 day", D.addDays("2023-02-28", 1) === "2023-03-01");
check("1 Jan − 1 day crosses the year", D.addDays("2023-01-01", -1) === "2022-12-31");
check("31 Dec + 1 day crosses the year", D.addDays("2023-12-31", 1) === "2024-01-01");
check("28 Feb + 1 day in a leap year", D.addDays("2024-02-28", 1) === "2024-02-29");
check("startOfMonth", D.startOfMonth("2023-02-17") === "2023-02-01");
check("clamp to min", D.clampISO("2023-01-01", "2023-02-01", null) === "2023-02-01");
check("clamp to max", D.clampISO("2023-04-01", null, "2023-03-31") === "2023-03-31");
check("Date round-trip is local, not UTC", D.fromDate(D.toDate("2023-02-10")) === "2023-02-10");

/* ---------------------------------------------------------------- formats --- */

check("long format", D.formatISODate("2023-02-10") === "10 February 2023");
check("short format", D.formatISODate("2023-02-10", true) === "10 Feb 2023");
check(
  "long range keeps both years",
  D.formatDateRange({ from: "2023-02-10", to: "2023-03-17" }) ===
    "10 February 2023 – 17 March 2023",
);
check(
  "short range drops the repeated year",
  D.formatDateRange({ from: "2023-02-10", to: "2023-03-17" }, true) ===
    "10 Feb – 17 Mar 2023",
);
check(
  "short range keeps two different years",
  D.formatDateRange({ from: "2022-12-30", to: "2023-01-02" }, true) ===
    "30 Dec 2022 – 2 Jan 2023",
);
check("empty range formats to nothing", D.formatDateRange(D.EMPTY_RANGE) === "");

/* ------------------------------------------------------------ range state --- */

check("one end is partial", D.isRangePartial({ from: "2023-01-01", to: null }));
check("no ends is not partial", !D.isRangePartial(D.EMPTY_RANGE));
check("both ends is not partial", !D.isRangePartial({ from: "2023-01-01", to: "2023-01-02" }));
check("a single day is a complete range", D.isRangeComplete({ from: "2023-01-01", to: "2023-01-01" }));
check("an inverted range is not complete", !D.isRangeComplete({ from: "2023-03-01", to: "2023-01-01" }));
check("range includes its start", D.isInRange("2023-01-01", { from: "2023-01-01", to: "2023-01-05" }));
check("range includes its end", D.isInRange("2023-01-05", { from: "2023-01-01", to: "2023-01-05" }));
check("range excludes the day after", !D.isInRange("2023-01-06", { from: "2023-01-01", to: "2023-01-05" }));
check(
  "orderRange swaps an inverted range",
  JSON.stringify(D.orderRange({ from: "2023-03-01", to: "2023-01-01" })) ===
    '{"from":"2023-01-01","to":"2023-03-01"}',
);

/* ------------------------------------------------------------------- grid --- */

// February 2023 starts on a WEDNESDAY, so a Sunday-first grid needs exactly
// three leading blanks. Off by one and every date sits under the wrong weekday.
const feb = D.monthMatrix(2023, 1, 0);
check("Feb 2023 fits 5 rows", feb.length === 5);
check("Feb 2023 leads with 3 blanks", feb[0].slice(0, 3).every((cell) => cell === null));
check("the 1st lands on Wednesday", feb[0][3] === "2023-02-01");
check("the 28th is the last day", feb[4][2] === "2023-02-28");
check("trailing cells are blank, not March", feb[4][3] === null);

const febMonday = D.monthMatrix(2023, 1, 1);
check("Monday-first leads with 2 blanks", febMonday[0].slice(0, 2).every((cell) => cell === null));
check("Monday-first puts the 1st in column 2", febMonday[0][2] === "2023-02-01");

// A month that starts on the week's first day must not gain an empty leading row.
const oct = D.monthMatrix(2023, 9, 0);
check("1 Oct 2023 is a Sunday, so no leading blank", oct[0][0] === "2023-10-01");

for (let month = 0; month < 12; month += 1) {
  const weeks = D.monthMatrix(2023, month, 0);
  check(`every row of month ${month} holds 7 cells`, weeks.every((week) => week.length === 7));
  check(
    `month ${month} renders every one of its days`,
    weeks.flat().filter(Boolean).length === D.daysInMonth(2023, month),
  );
}

check("Sunday-first headers start at Sunday", D.weekdayHeaders(0)[0].name === "Sunday");
check("Monday-first headers start at Monday", D.weekdayHeaders(1)[0].name === "Monday");
check("Monday-first headers end at Sunday", D.weekdayHeaders(1)[6].name === "Sunday");

/* ---------------------------------------------------------------- presets --- */

const TODAY = "2023-03-17";
const spanInDays = (range) =>
  Math.round((D.toDate(range.to) - D.toDate(range.from)) / 86_400_000) + 1;

// A preset's label states a count. The window it selects has to match it, or the
// rail is lying — the exact bug that makes "Last 7 Days" return eight.
for (const [id, days] of [["today", 1], ["last3Days", 3], ["last7Days", 7], ["last30Days", 30]]) {
  const preset = D.DATE_RANGE_PRESETS.find((candidate) => candidate.id === id);
  check(`${id} spans ${days} day(s)`, preset && spanInDays(preset.resolve(TODAY)) === days);
  check(`${id} ends today`, preset && preset.resolve(TODAY).to === TODAY);
}
check(
  "Last 1 Year is inclusive of today",
  D.DATE_RANGE_PRESETS.find((p) => p.id === "last1Year").resolve(TODAY).from === "2022-03-18",
);
check("every preset resolves to a complete range", D.DATE_RANGE_PRESETS.every((p) => D.isRangeComplete(p.resolve(TODAY))));
check("matchPreset recognises its own output", D.matchPreset({ from: "2023-03-11", to: TODAY }, TODAY) === "last7Days");
check("matchPreset returns null for a hand-picked range", D.matchPreset({ from: "2023-02-10", to: TODAY }, TODAY) === null);
check("matchPreset returns null for a partial range", D.matchPreset({ from: TODAY, to: null }, TODAY) === null);

/* ----------------------------------------------------------------- render --- */

/**
 * Whether the Apply button carries the `disabled` ATTRIBUTE. Matched as
 * `disabled=""` rather than the bare word, because the shared Button recipe
 * carries `disabled:pointer-events-none` in its class list and a substring test
 * reads that as the attribute — which made this check pass in both directions.
 */
function applyIsDisabled(html) {
  const label = html.indexOf(">Apply<");
  if (label === -1) return false;
  const open = html.lastIndexOf("<button", label);
  return html.slice(open, html.indexOf(">", open) + 1).includes('disabled=""');
}

const applied = renderToStaticMarkup(
  h(DateRangePicker, {
    today: TODAY,
    value: { from: "2023-02-10", to: "2023-03-17" },
    onApply: () => {},
    onCancel: () => {},
  }),
);
check("the read-out states both ends", applied.includes("10 February 2023") && applied.includes("17 March 2023"));
check("the rail renders", applied.includes("Last 3 Months") && applied.includes("Customised"));
check("both grids are named by month", applied.includes("From — February 2023") && applied.includes("To — March 2023"));
// Roving tabindex: one tab stop per grid, never one per day.
check("exactly one tab stop per grid", (applied.match(/tabindex="0"/g) || []).length === 2);
check("both endpoints are marked selected", (applied.match(/aria-selected="true"/g) || []).length === 2);
check("the in-between band is painted", applied.includes("bg-wash-2"));
check("weekday columns carry full names", applied.includes("Wednesday"));
check("today is marked", applied.includes('aria-current="date"'));
check("Apply is live for a complete range", !applyIsDisabled(applied));

const partial = renderToStaticMarkup(
  h(DateRangePicker, { today: TODAY, value: { from: "2023-02-10", to: null }, onApply: () => {} }),
);
check("a missing end shows a placeholder", partial.includes("End date"));
check("the disabled Apply explains itself in text", partial.includes("Pick both a start and an end date"));
check("Apply refuses a half-built range", applyIsDisabled(partial));
check("no band is painted without both ends", !partial.includes("bg-wash-2"));
check("Cancel is absent when no handler is given", !partial.includes(">Cancel<"));

const single = renderToStaticMarkup(
  h(DatePicker, { today: TODAY, value: "2023-03-01", onChange: () => {}, clearable: true }),
);
check("the single control states its date", single.includes("1 March 2023"));
check("clearable shows a clear control", single.includes("Clear date"));

const emptySingle = renderToStaticMarkup(
  h(DatePicker, { today: TODAY, value: null, onChange: () => {}, clearable: true, placeholder: "No end date" }),
);
check("an empty control shows its placeholder", emptySingle.includes("No end date"));
check("nothing to clear means no clear control", !emptySingle.includes("Clear date"));

const bounded = renderToStaticMarkup(
  h(Calendar, { today: TODAY, month: "2023-03-01", onMonthChange: () => {}, min: "2023-03-10", max: "2023-03-20" }),
);
check("out-of-bounds days are announced as disabled", (bounded.match(/aria-disabled="true"/g) || []).length > 10);
// The reason `aria-disabled` is used instead of `disabled`: a real `disabled`
// button cannot hold the roving tab stop, and the grid becomes unreachable.
check("a bounded grid still has a tab stop", bounded.includes('tabindex="0"'));
check(
  "no day button carries a hard `disabled`",
  !/data-cx-day="[^"]*"[^>]*\sdisabled/.test(bounded),
);

/* ---------------------------------------------------- opens on today -------- */

check("todayRange is a single-day range on today", (() => {
  const r = D.todayRange(TODAY);
  return r.from === TODAY && r.to === TODAY;
})());
check(
  "todayRange hands back a fresh object each call",
  D.todayRange(TODAY) !== D.todayRange(TODAY),
);
check("todayRange with no argument uses the real today", D.todayRange().from === D.todayISO());

// Nothing applied: the panel opens with today selected rather than blank, so it
// is usable on the first click instead of the third.
const seeded = renderToStaticMarkup(
  h(DateRangePicker, { today: TODAY, value: D.EMPTY_RANGE, onApply: () => {} }),
);
// Read the aria-live block alone. Counting the date across the whole document
// would also match the day cells' aria-labels, which say the same words.
const readOut = (html) =>
  html.match(/<div aria-live="polite"[^>]*>([\s\S]*?)<\/div>/)?.[1] ?? "";
check(
  "both ends of the read-out are seeded with today",
  readOut(seeded).split("17 March 2023").length - 1 === 2,
);
check("no placeholder survives the seed", !seeded.includes("Start date") && !seeded.includes("End date"));
check("the seeded day is selected in both grids", (seeded.match(/aria-selected="true"/g) || []).length === 2);
check("Apply is live on the seeded range", !applyIsDisabled(seeded));
// The seed is today at both ends, which IS the "today" preset — so the rail must
// report it without being told, or `matchPreset` and the seed have drifted apart.
check("the rail marks Today as current", seeded.includes('aria-current="true"'));

// Both grids open on the seeded month, not on two different ones.
check(
  "both grids open on today's month",
  seeded.includes("From — March 2023") && seeded.includes("To — March 2023"),
);

const optedOut = renderToStaticMarkup(
  h(DateRangePicker, {
    today: TODAY,
    value: D.EMPTY_RANGE,
    defaultToToday: false,
    onApply: () => {},
  }),
);
check("opting out really opens blank", optedOut.includes("Start date") && optedOut.includes("End date"));
check("opting out selects nothing", !/aria-selected="true"/.test(optedOut));
check("opting out still lets an empty range be applied", !applyIsDisabled(optedOut));
check("opting out leaves no preset current", !optedOut.includes('aria-current="true"'));

// The seed must never overwrite a start the operator already chose. A half-built
// range is the one case where filling in "today" would destroy real input.
const halfBuilt = renderToStaticMarkup(
  h(DateRangePicker, { today: TODAY, value: { from: "2023-02-10", to: null }, onApply: () => {} }),
);
check("a half-built range is left alone", halfBuilt.includes("End date"));
check("a half-built range keeps its own start", halfBuilt.includes("10 February 2023"));

// An applied range always wins over the seed.
const appliedWins = renderToStaticMarkup(
  h(DateRangePicker, { today: TODAY, value: { from: "2023-01-05", to: "2023-01-09" }, onApply: () => {} }),
);
check("an applied range is not overwritten by today", appliedWins.includes("5 January 2023") && appliedWins.includes("9 January 2023"));

/* ------------------------------------------------------- Field boundary ----- */

/**
 * The calendar's month and year selects must NOT pick up the enclosing Field's
 * wiring. In the shipped DatePicker the calendar is portaled, which changes
 * nothing about this — a portal moves the DOM node and not the React tree, so
 * context still reaches it. Rendering the calendar directly inside a Field puts
 * the same leak somewhere `renderToStaticMarkup` can see it.
 */
const insideField = renderToStaticMarkup(
  h(
    Field,
    { label: "Window opens", error: "Pick a date inside the engagement." },
    h(Calendar, { today: TODAY, month: "2023-03-01", onMonthChange: () => {} }),
  ),
);
const selectTags = insideField.match(/<select[^>]*>/g) ?? [];
check("the calendar renders both of its selects", selectTags.length === 2);
// Tested as `attribute="`, not as the bare word: the Select recipe carries
// `aria-invalid:border-danger` in its class list, and a substring test reads that
// as the attribute — which is what made this check pass before the fix existed.
check(
  "no select inherits the field's aria-invalid",
  selectTags.every((tag) => !tag.includes('aria-invalid="')),
);
check(
  "no select inherits the field's id",
  selectTags.every((tag) => !tag.includes('id="')),
);
check(
  "no select inherits the field's aria-describedby",
  selectTags.every((tag) => !tag.includes('aria-describedby="')),
);
// The boundary must not have been achieved by breaking Field itself.
check("the field still renders its own error", insideField.includes("Pick a date inside the engagement."));
check(
  "the field still associates its label",
  /<label[^>]*for="[^"]+"/.test(insideField),
);

if (failures.length > 0) {
  console.error(
    `\n✗ verify-dates: ${failures.length} check(s) failed:\n` +
      failures.map((label) => `    ${label}`).join("\n") +
      `\n\n  These are all silent failures — the component still renders, it just\n` +
      `  renders the wrong days. Fix src/date/dates.ts or src/date/calendar.tsx.\n`,
  );
  process.exit(1);
}

console.log("✓ verify-dates: CX-DTE arithmetic and grid structure hold");
