---
"@vcyberizadmin/ui": minor
---

feat: CX-DTE — Calendar, DatePicker, DateRangePicker, DateRangeFilter

Fills the two gaps the standard names and never specifies: CX-FLT lists "bound by
date with a start–end range" as an operation with no control behind it, and
CX-FLD ships five form controls, none of them a date. No console had a date
control at all, so there was nothing to reconcile — this is written from scratch
under its own ID.

- `Calendar` — one month as a real ARIA grid. Roving tabindex, so it is a single
  tab stop; arrows move a day, ↑↓ a week, Home/End the month's ends,
  PageUp/PageDown a month and Shift+PageUp/Down a year. Unavailable days take
  `aria-disabled` rather than `disabled`, which keeps the tab stop reachable when
  bounds put it on an out-of-range day.
- `DateRangePicker` — the panel: preset rail, a read-out of what Apply will
  commit, and one grid per end of the range.
- `DateRangeFilter` — the same panel in a popover behind a toolbar trigger that
  states the applied range, for the CX-FLT strip.
- `DatePicker` — single date wearing the CX-FLD input recipe, reading its `id`,
  `aria-describedby`, `aria-invalid` and `disabled` out of the enclosing Field.

The value type is a `YYYY-MM-DD` string rather than a `Date`: a picked calendar
day is not an instant, and carrying one as a `Date` inherits a timezone the user
never chose — `new Date("2023-02-10")` is 9 February west of Greenwich. Strings
are also URL-safe unencoded, so a filtered view stays linkable, and compare with
`<` and `===`.

With nothing applied the panel opens on today — selected at both ends, `Today`
lit in the rail, Apply live — so it is usable on the first click instead of the
third. `defaultToToday={false}` opens blank. The seed is the draft and not the
filter: nothing is applied until Apply, so the table still shows every row. It
deliberately skips a half-built range (overwriting a chosen start is worse than an
empty end) and a cleared draft (a Clear that refilled itself would look broken).
An applied default stays the caller's call — `useState(todayRange)` for a range,
`useState(todayISO)` for a single date; the new `todayRange()` helper returns a
fresh object per call so several pickers cannot share one.

This is the one filter with an Apply button. A range is assembled from up to six
interactions and the states in between are wrong rather than merely stale, so the
panel is one transaction: presets, picked days and Clear filters write to a draft,
Apply commits, Cancel discards. Apply is disabled only for a half-built range.

Two backward-compatible changes to existing components fell out of it:

- `Popover` gained optional `open` / `onOpenChange`, so a panel carrying its own
  Cancel and Apply can dismiss itself. The uncontrolled default is unchanged.
- `FieldBoundary` was added to CX-FLD. Context reaches a composite control's
  inner controls, including through a portal — a portal moves the DOM node, not
  the React tree — so the calendar's month and year selects were each picking up
  the enclosing Field's `id`, `aria-describedby` and `aria-invalid`. Wrapping them
  stops the association at the boundary.

Adds a fourth guard script, `verify-dates`, wired into `pnpm test`. Every failure
mode here is an off-by-one that renders perfectly — a dropped leap day, a "Last 7
Days" spanning eight, a grid whose leading blanks are one column short so every
date sits under the wrong weekday. Fixed, deliberately awkward dates: a February
that starts on a Wednesday, a leap year, and cases either side of a year
boundary.
