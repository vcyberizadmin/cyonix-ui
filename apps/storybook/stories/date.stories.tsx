import {
  Calendar,
  Card,
  DatePicker,
  DateRangeFilter,
  DateRangePicker,
  Field,
  FieldGrid,
  FilterChip,
  Note,
  Toolbar,
  addDays,
  formatDateRange,
  startOfMonth,
  todayISO,
  todayRange,
  type DateRange,
  type ISODate,
} from "@vcyberizadmin/ui";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

/**
 * CX-DTE. Written from scratch — none of the three consoles had a date control,
 * which is why CX-FLT lists "bound by date with a start–end range" as an
 * operation and never specifies it, and why CX-FLD ships no date input.
 *
 * EVERY STORY BUT ONE RUNS ON THE REAL TODAY, and every date in them is derived
 * from it. `Wireframe` is the exception: it pins `today` to March 2023 so it
 * reproduces the design exactly and can be diffed against it. If you see a year
 * you did not expect anywhere else, that is a bug rather than a fixture — the
 * fixed dates belong in `scripts/verify-dates.mjs`, where determinism is the
 * point, not in a component you are looking at to check today's behaviour.
 */
const meta = {
  title: "Forms/Date picker",
  parameters: { layout: "padded" },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

/** The panel: preset rail, read-out, one grid per end of the range. */
export const RangePanel: Story = {
  name: "Range panel",
  render: () => {
    // Derived from the real today, so the band still spans two months the way
    // the design shows it without hardcoding a year.
    const today = todayISO();
    const [applied, setApplied] = useState<DateRange>({
      from: addDays(today, -35),
      to: today,
    });

    return (
      <div className="flex flex-col gap-6">
        <div className="border-rule shadow-e2 w-fit overflow-hidden rounded-md border">
          <DateRangePicker
            value={applied}
            onApply={setApplied}
            onCancel={() => undefined}
          />
        </div>

        <Note tone="info">
          Applied: <b>{formatDateRange(applied) || "nothing"}</b>. The panel is one
          transaction — presets, hand-picked days and Clear filters all write to a
          draft, and only Apply commits. Set one end and Apply goes disabled: a
          range with one end filled in reads both as "everything since" and
          "everything up to", so the panel asks rather than guessing.
        </Note>
      </div>
    );
  },
};

/** CX-FLT's missing filter, in the strip it belongs to. */
export const InToolbar: Story = {
  name: "In the filter strip",
  render: () => {
    const [range, setRange] = useState<DateRange>({ from: null, to: null });
    const [search, setSearch] = useState("");
    const applied = Boolean(range.from ?? range.to);

    return (
      <div className="flex flex-col gap-6">
        <Card>
          <Toolbar
            search={{ value: search, onChange: setSearch, placeholder: "Search findings" }}
            resultCount={{ shown: applied ? 42 : 1204, total: 1204 }}
            chips={
              applied ? (
                <FilterChip
                  field="First seen"
                  value={formatDateRange(range, true)}
                  onRemove={() => setRange({ from: null, to: null })}
                />
              ) : undefined
            }
            onClearAll={applied ? () => setRange({ from: null, to: null }) : undefined}
          >
            <DateRangeFilter label="First seen" value={range} onChange={setRange} />
          </Toolbar>
          <p className="text-fg-muted px-4 py-6 text-[13px]">
            The table would go here. The trigger reads out the applied range
            rather than a generic label, because applied filter state that is
            only visible inside a closed panel is the commonest cause of "the
            data is wrong" tickets.
          </p>
        </Card>
      </div>
    );
  },
};

/** One date, inside a Field. No Apply — a single date is complete on one click. */
export const SingleDate: Story = {
  name: "Single date in a form",
  render: () => {
    const today = todayISO();
    // `useState(todayISO)` is how a controlled field opens on today. The
    // component does not decide this for itself — see the note below.
    const [start, setStart] = useState<ISODate | null>(today);
    const [end, setEnd] = useState<ISODate | null>(null);
    const [retest, setRetest] = useState<ISODate | null>(addDays(today, 30));

    // The specified timing: validate once a value exists, never while the user
    // is still choosing.
    const error =
      start && end && end < start
        ? "The window has to end on or after it starts."
        : undefined;

    return (
      <div className="flex max-w-3xl flex-col gap-6">
        <Card title="Schedule a scan" hint="Two columns above 720px">
          <FieldGrid>
            <Field label="Window opens" hint="Scanning starts at 00:00 UTC.">
              <DatePicker value={start} onChange={setStart} />
            </Field>

            <Field
              label="Window closes"
              optional
              hint="Leave empty to scan until stopped."
              error={error}
            >
              <DatePicker
                value={end}
                onChange={setEnd}
                clearable
                min={start}
                placeholder="No end date"
              />
            </Field>

            <Field
              label="Retest due"
              disabled
              disabledReason="Set automatically once the finding is marked fixed."
            >
              <DatePicker value={retest} onChange={setRetest} />
            </Field>
          </FieldGrid>
        </Card>

        <Note tone="info">
          The trigger wears the CX-FLD input recipe and reads its <code>id</code>,{" "}
          <code>aria-describedby</code>, <code>aria-invalid</code> and{" "}
          <code>disabled</code> out of the enclosing Field — a native{" "}
          <code>&lt;input type="date"&gt;</code> would render four different ways
          across browsers and format its value by the OS locale, so the same day
          reads as 02/10 to one operator and 10/02 to another.
        </Note>
      </div>
    );
  },
};

/** Bounds and blackouts. Unavailable days stay focusable so the grid keeps its
 *  tab stop — they are announced and refused, not hidden. */
export const Bounds: Story = {
  name: "Bounds · blackouts · Monday start",
  render: () => {
    const today = todayISO();
    const [month, setMonth] = useState<ISODate>(startOfMonth(today));
    const [picked, setPicked] = useState<DateRange>(todayRange(today));

    return (
      <div className="flex flex-wrap items-start gap-6">
        <Card title="Bounded" hint="A week back, two weeks forward">
          <Calendar
            month={month}
            onMonthChange={setMonth}
            value={picked}
            onSelect={(date) => setPicked({ from: date, to: date })}
            min={addDays(today, -7)}
            max={addDays(today, 14)}
            className="w-[252px]"
          />
        </Card>

        <Card title="Weekends blacked out" hint="Week starts Monday">
          <Calendar
            month={month}
            onMonthChange={setMonth}
            value={picked}
            onSelect={(date) => setPicked({ from: date, to: date })}
            weekStartsOn={1}
            isDateDisabled={(date) => {
              const day = new Date(
                Number(date.slice(0, 4)),
                Number(date.slice(5, 7)) - 1,
                Number(date.slice(8, 10)),
                12,
              ).getDay();
              return day === 0 || day === 6;
            }}
            className="w-[252px]"
          />
        </Card>

        <Note tone="info" className="max-w-sm">
          The grid is <b>one tab stop</b>, per the ARIA grid pattern. Arrows move
          a day, ↑↓ a week, Home/End the month's ends, PageUp/PageDown a month —
          hold Shift for a year. Tabbing through 31 buttons to reach the end of a
          month is not navigation.
        </Note>
      </div>
    );
  },
};

/**
 * With nothing applied, the panel opens on TODAY rather than an empty read-out —
 * usable on the first click instead of the third. Presets also resolve against
 * the day they are clicked, so a dashboard left open overnight cannot keep
 * offering yesterday's "Today".
 */
export const LivePresets: Story = {
  name: "Opens on today · real presets",
  render: () => {
    const [range, setRange] = useState<DateRange>({ from: null, to: null });
    return (
      <div className="flex flex-col gap-6">
        <div className="border-rule shadow-e2 w-fit overflow-hidden rounded-md border">
          <DateRangePicker value={range} onApply={setRange} />
        </div>
        <Note tone="info">
          Today is <b>{todayISO()}</b>, and it is already selected in both grids
          with <b>Today</b> lit in the rail — the seeded range matches that preset,
          so the rail reports it without being told. Applied so far:{" "}
          <b>{formatDateRange(range) || "nothing"}</b>. Every preset window is
          inclusive of today and counts backwards, so "Last 7 Days" is today plus
          the six before it.
        </Note>
      </div>
    );
  },
};

/**
 * The seed is the DRAFT, not the filter. That distinction is the whole reason
 * this is safe to have on by default, so all three cases are shown together.
 */
export const OpensWithToday: Story = {
  name: "Seeded draft vs applied value",
  render: () => {
    const [drafted, setDrafted] = useState<DateRange>({ from: null, to: null });
    const [blank, setBlank] = useState<DateRange>({ from: null, to: null });
    // An APPLIED default — the filter is already narrowing the table on first
    // paint. This is the caller's initial state, never something the component
    // decides for itself.
    const [preapplied, setPreapplied] = useState<DateRange>(todayRange);
    const [due, setDue] = useState<ISODate | null>(todayISO);

    return (
      <div className="flex flex-col gap-6">
        <Card
          title="Three different things"
          hint="Open each trigger — the first two look identical inside and differ outside"
        >
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <span className="text-fg text-[13px] font-medium">
                Default — opens on today, applies nothing
              </span>
              <div className="flex items-center gap-3">
                <DateRangeFilter label="First seen" value={drafted} onChange={setDrafted} />
                <span className="text-fg-muted text-[12px]">
                  applied: <b>{formatDateRange(drafted) || "nothing"}</b>
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-fg text-[13px] font-medium">
                <code>defaultToToday=&#123;false&#125;</code> — opens blank
              </span>
              <div className="flex items-center gap-3">
                <DateRangeFilter
                  label="First seen"
                  defaultToToday={false}
                  value={blank}
                  onChange={setBlank}
                />
                <span className="text-fg-muted text-[12px]">
                  applied: <b>{formatDateRange(blank) || "nothing"}</b>
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-fg text-[13px] font-medium">
                <code>useState(todayRange)</code> — applied before you touch it
              </span>
              <div className="flex items-center gap-3">
                <DateRangeFilter
                  label="First seen"
                  value={preapplied}
                  onChange={setPreapplied}
                />
                <span className="text-fg-muted text-[12px]">
                  applied: <b>{formatDateRange(preapplied) || "nothing"}</b>
                </span>
              </div>
            </div>
          </div>
        </Card>

        <Card title="A form field that opens on today" hint="useState(todayISO)">
          <Field label="Retest due" hint="Defaults to today; change it if the window differs.">
            <DatePicker value={due} onChange={setDue} clearable />
          </Field>
        </Card>

        <Note tone="info">
          The first two triggers apply <b>nothing</b> until you press Apply, which
          is why opening on today is safe as a default — the table still shows
          every row. The third is already filtering on first paint. A single date
          works the same way: <code>DatePicker</code> is controlled, so it opens on
          today because the parent's state starts there, not because the component
          decided.
        </Note>
      </div>
    );
  },
};

/**
 * The ONLY story with a pinned date, and the only one that should have one: it
 * reproduces the wireframe — 10 February to 17 March 2023 — so the component can
 * be diffed against the design. Everything else runs on the real today.
 *
 * Two deliberate departures from the image are visible here. The band between the
 * ends is a NEUTRAL wash rather than a tint of the selection colour, because the
 * brand caps orange at "well under a tenth of any screen" and a 30-day band is
 * roughly a third of the grid — and an orange band would compete with the two
 * cells holding the actual selection. And the month/year chevrons sit on the
 * right, matching every other CX-FLD select, rather than on the left.
 */
export const Wireframe: Story = {
  name: "Wireframe dates (March 2023)",
  render: () => {
    const [applied, setApplied] = useState<DateRange>({
      from: "2023-02-10",
      to: "2023-03-17",
    });

    return (
      <div className="flex flex-col gap-6">
        <div className="border-rule shadow-e2 w-fit overflow-hidden rounded-md border">
          <DateRangePicker
            today="2023-03-17"
            value={applied}
            onApply={setApplied}
            onCancel={() => undefined}
          />
        </div>
        <Note tone="warning">
          <b>Fixture, not a bug.</b> This story passes{" "}
          <code>today="2023-03-17"</code> so it matches the design image exactly.
          Every other story runs on the real today — if you see 2023 anywhere
          else, something is wrong.
        </Note>
      </div>
    );
  },
};
