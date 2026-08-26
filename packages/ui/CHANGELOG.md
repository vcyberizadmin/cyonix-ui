# @vcyberizadmin/ui

## 0.3.0

### Minor Changes

- 1770fd9: Fixes the WCAG 2.2 AA contrast failures across both themes by splitting each
  semantic hue into a **mark** and an **ink**.

  The brand document sets the bar itself — _"Target WCAG 2.2 AA. Operators use this
  product for long shifts, at night, sometimes on bad displays — accessibility is
  legibility."_ Its own contrast table checks every hue against **one** ground:
  Onyx Grey, dark theme only. The library paints those hues on three more grounds
  that table never evaluated — Dark Grey cards, the hue's own 10–20% tint on a
  card, and the entire light theme. Measured across all 57 stories by compositing
  each text node's real background: **261 text nodes below AA in light, 374 in
  dark**.

  One value cannot serve both jobs, and the reason is structural:

  - **MARK** — a 3px severity bar, a chart fill, a status dot. Answers to WCAG
    1.4.11 at 3:1, and needs "deeper = worse" to hold so critical never reads as
    merely high. **Keeps the brand value exactly.**
  - **INK** — an 11px label. Answers to 1.4.3 at 4.5:1 against the darkest _and_
    lightest ground it lands on, which on a near-black canvas forces it lighter and
    on white forces it darker — opposite directions.

  So the bar carries the rank and the label carries the legibility. New tokens:
  `--{ok,warning,danger,info}-ink`, `--sev-*-ink`, `--accent-ink`, exposed as
  `text-*-ink` utilities. Each is the _smallest_ deviation from its brand hue that
  clears 4.5:1 on page, card, tint and wash — chosen by measurement, not by eye.
  `TONE_INK` gains a third role, `glyph`, so an icon takes the mark and therefore
  matches the bar beside it exactly.

  Critical and high resolve to distinct ink in both themes deliberately: the naive
  minimum collapses them onto one value, erasing the single distinction the
  severity ladder exists to make.

  **Two visible trades, both unavoidable:**

  - `--accent-fg` is no longer white. White on Sunset Orange is 3.44:1 on Orange
    400 and 2.98:1 on Orange 350 — under AA for a 14px button label in both
    themes, and no shade of the brand orange carries white text at 4.5:1 while
    remaining the brand orange. The label darkens instead, so the fill does not
    have to: 4.84:1 and 5.58:1. **Every primary Button, filled segment and skip
    link now reads orange-with-dark-label.**
  - The danger Button takes a new `--danger-strong` fill. Here the opposite trade
    is correct: a deeper red still reads unmistakably as danger, so the fill
    darkens and the label stays white (3.76:1 → 6.49:1). A black-on-red
    destructive button would be the worse outcome.

  Also fixed, each a distinct cause rather than the palette:

  - `Code` and `Tooltip` keep a **fixed dark surface** in light mode but carried
    theme-flipping ink, so their text went dark on their own dark panel — 2.96:1.
    They now use fixed light ink.
  - The outline Button's hover label sat on `--bg` with a 22% orange wash, not on
    the accent fill, where near-black would have measured 1.3:1. It uses `--fg`.
    `--accent-fg` now documents that it means specifically "ink on the accent
    fill".
  - 9–10px badges on `bg-wash-2` and the TopBar's search-field button label moved
    from `--fg-muted` to `--fg-2`; `--fg-muted` itself lifted to the smallest
    passing step in both themes. Muted remains correct for disabled state, which
    WCAG exempts, and for captions at 11px and above.
  - Placeholders moved to `--fg-2`. A placeholder is rendered text and cannot be
    both very faint and compliant.

  Result: **0 text nodes below AA in dark, 0 in light**, across all 57 stories,
  with every functional probe still green.

- 1770fd9: Completes the component set: CX-TAB, CX-DEF, CX-SET, CX-CHT, plus `IconButton`,
  `Logo` and `ThemeToggle`. All 26 components and all 59 exports from the standard
  are now built.

  **CX-TAB — `Tabs`, `Segmented`.** Two controls that look alike and do different
  jobs: tabs change the view of one record, segmented changes which records are
  listed. The selected tab's orange underline is legitimate accent use — a current
  location — and hover stays neutral. Roving tabindex means Tab leaves the bar in
  one step. The standard's recorded cost, "past ~6 tabs the bar scrolls and later
  tabs become invisible", is answered by masking whichever edge is cut off and
  keeping the selected item in view.

  `SegmentedFilter` (CX-FLT) is now a thin wrapper over `Segmented` rather than a
  second implementation of the same radiogroup, so the focus handling and ARIA
  live in one place.

  **CX-DEF — `DefinitionCard`, `DescriptionList`.** Generalises VAPT's role card
  to any definition object. A read-only object shows its action **disabled with the
  reason** rather than hiding it, and `readOnlyReason` is required by the type
  whenever `readOnly` is set — a disabled control with no explanation is worse than
  no control. Descriptions are clamped and footers pushed to the bottom, so a grid
  of uneven cards is not ragged. `DescriptionList` renders an em-dash for empty
  values, because a blank cell is indistinguishable from a rendering bug.

  **CX-SET — `SettingsShell`.** SOC's two-pane shell, which is the only one of the
  three that survives ten sections. Section descriptions are required by the type —
  the standard singles them out as "what makes the list scannable instead of a menu
  of nouns". Save is per section and disabled until something changes; leaving a
  dirty section prompts first. Below 900px the rail becomes a disclosure, a
  fallback the standard records as missing from every console. Each section states
  whether its settings sync or are device-local.

  **CX-CHT — `Sparkline`, `ProportionBar`, `RankedBars`, `FunnelFlow`, `Donut`,
  behind `@vcyberizadmin/ui/charts`.** Built with plain SVG and **no charting
  library**. The standard describes this subpath as quarantining recharts; none of
  the five needs it, so no console pays ~100KB for four shapes. This is a
  deliberate deviation — the point to reach for a real charting library is
  brushing, zooming or animated transitions, not before. Legends always carry the
  count _and_ the percentage and are the accessible equivalent, with the SVG
  `aria-hidden`. Percentages are distributed by largest remainder so a legend totals
  exactly 100. Each chart takes one `ramp`, which makes the standard's "ranked and
  unranked must never be mixed" rule structurally impossible to break.

  **`IconButton`** keeps a 32px visual box with a 44×44 hit area from a centred
  pseudo-element, so a dense toolbar row is not forced to 44px. `label` is required
  by the type. Not chamfered: an 11px chamfer on a 32px square eats a third of it.

  **`Logo`** is the only legitimate consumer of `--spark`. Shipping it as a
  component is what keeps the gradient from escaping into the interface by
  copy-paste. **`ThemeToggle`** writes `data-theme` explicitly in both directions;
  the pre-paint script an app needs to avoid a flash is documented on it.

  Theme additions: `scrollbar-none` and `cx-chamfer-none` utilities,
  `--container-settings-rail`, and `CATEGORICAL_INK` / `SEQUENTIAL_INK` in
  `./lib/status`. The ink ramps are literal arrays rather than derived from the
  fill ramps, because a computed class name (`CATEGORICAL[i].replace("bg-","text-")`)
  exists only at runtime — Tailwind never emits a rule for it and the mark renders
  with no colour, silently and invisibly to `verify-utilities`. This was caught in
  the donut before release.

- f74ceda: feat: CX-DTE — Calendar, DatePicker, DateRangePicker, DateRangeFilter

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

- 69c9d5b: Add CX-FLD — `Field`, `FieldGrid`, `Input`, `Textarea`, `Select`, `Checkbox`,
  `Switch`.

  Tenant is the sole owner of a real field primitive; SOC and VAPT inline their
  inputs per page, so there was nothing to reconcile. The point of the component is
  accessibility that is automatic rather than remembered per page: Field generates
  its own id, associates the label, and wires `aria-describedby` and
  `aria-invalid` onto whatever control sits inside it.

  Two API shapes instead of one. The standard flags Tenant's render prop as
  "unusual and slightly verbose"; rather than document the awkwardness, controls
  now read the wiring from context — `<Field label="Name"><Input /></Field>` — with
  the render prop retained for third-party controls that cannot.

  Hint and error share ONE slot, so an error replaces the hint in place and the
  layout never jumps. Required is the assumed default and only exceptions are
  marked `optional`. A disabled field states why, as visible text rather than a
  title attribute.

  Controls take radius-sm on all four corners — the chamfer stays buttons-only —
  with a hairline border that goes orange on focus. `FieldGrid` is two columns
  above 720px and one below.

  Two defects found by measuring the rendered output:

  - `Switch` had a `size-0` input, so the visible control had NO hit area and
    only the label could toggle it. It is now a fixed box with the input filling
    it.
  - an inline control sat 5px below its own label. The control is now centred on
    the label's first line box instead of nudged with a magic margin.

- 69c9d5b: Complete the shell group: CX-HDR and CX-CMD.

  `PageHeader` + `Breadcrumb` (CX-HDR) — server-safe, pure presentation. Tenant's
  primitives win because they are real primitives with correct
  `aria-label="Breadcrumb"` and `aria-current`, where SOC and VAPT inline the same
  markup per page; VAPT's eyebrow kicker is folded in. The last crumb renders as
  text even when an href is supplied — a link to the page you are already on is
  noise, so the rule is enforced rather than documented. Actions wrap under the
  title below 640px rather than truncating, because a hidden action is worse than
  a wrapped one. The FR chip hides behind `showInternal` for customer-facing builds.

  `CommandPalette` (CX-CMD) — built on `useOverlay` rather than on cmdk. The
  standard lists "adds the cmdk dependency to every consumer" as a con of lifting
  SOC's version, and everything cmdk provides is either already in `useOverlay` or
  is a small local function, so the dependency surface stays at three packages.

  Centred at 640px on a blurred scrim, capped at 60vh, grouped with uppercase
  headers, selected row in the orange wash. An empty query shows recents from
  localStorage rather than a blank panel. Fuzzy matching scores word starts higher,
  so "ca" finds "Create case". Remote record search appends UNDER the local results
  and never blocks them. The hotkey is suppressed inside Monaco and CodeMirror,
  which bind it themselves, but still fires from plain inputs.

- 69c9d5b: CX-TIL — stat tiles, plus a `cn()` fix that repairs two shipped defects.

  **Three tiles, not one overloaded one.** `StatTile` answers "how many",
  `TrendTile` "which way is it moving", `StatusTile` "is this OK". `TileGrid`
  carries the layout rule: auto-fit, 200px minimum, so tiles wrap rather than
  shrink.

  Brand rules moved from prose into the type system:

  - **Never brand orange.** `TileTone` is derived from the CX-STA semantic tones
    minus `draft`, so there is no accent member and no prop that can reach the
    brand hue. The drill-through hover affordance uses surface and motion instead.
  - **Deltas state their baseline.** `baseline` is required by the type whenever
    `delta` is present — a bare percentage does not compile.
  - **Polarity is per-metric.** There is no correct global default, so omitting
    `polarity` yields a colourless delta rather than a confident wrong one. The
    same +12% reads green on "resolved" and red on "open".
  - **Direction survives greyscale.** An arrow _and_ a word carry it, not colour.
  - A tile that filters a list is a link (`href` + `linkComponent`), never an
    `onClick` — which also keeps the whole file server-safe, so a dashboard of
    tiles costs zero client JS.

  Each tile is a `<dl>`, so the label and value are associated for a screen reader
  without `useId` — which would have forced the file client-side.

  `Sparkline` geometry lives in `lib/spark.ts` as pure functions with a derived
  text equivalent. The standard says only the trend variant needs a chart
  dependency; it needs none, so `TrendTile` stays in the root export and the Tenant
  console never pulls in `recharts`.

  **`cn()` now knows the theme's custom scales.** `tailwind-merge` classifies
  unknown `text-*` values as colours, so `text-h2` and `text-danger` collided and
  the size lost — silently, with every surviving class still resolving. Two places
  shipped broken in `0.1.0`: a `StatTile` value carrying a tone rendered at 15px
  instead of 30px, and every `ImpactBox` row in the confirm dialog rendered at 15px
  instead of 13.5px. `scripts/verify-merge.mjs` now guards it.

  `TONE_INK` is added to `./lib/status` (tone → ink, fill and border-left colour)
  so a tile and a pill cannot disagree about what "danger" looks like.

- 69c9d5b: Add the step-4 workhorse surface: CX-TBL, CX-FLT and CX-PAG.

  `DataTable` (CX-TBL) — Tenant's structure, SOC's behaviours, VAPT's cell
  renderers. Sorting is designed so SOC's defect cannot recur: omit
  `onSortChange` and the table genuinely sorts (stable, and severity by rank so
  Critical leads); provide it and the caller owns ordering for server-side sorts.
  There is no state where a header responds but nothing moves. Overflow lives on
  the table's own scroll container behind a min-width, so a 12-column table never
  makes the page scroll sideways. No zebra striping — it fights severity colour.
  Loading, empty and error render in the table's own body by composing CX-STE.

  `Toolbar`, `SegmentedFilter`, `FilterChip` (CX-FLT) — Tenant's removable chips,
  VAPT's segmented pills with live counts, SOC's saved views. Filters apply
  immediately, search debounces at 250ms, applied state stays visible. URL
  persistence is left to the caller, which owns the router.

  `Pagination` (CX-PAG) — states the range and the total ("Showing 1-7 of 48"),
  which is the detail that makes paging honest. Disabled controls stay visible at
  muted opacity so reaching a boundary does not shift the layout. Adds the
  page-size control the standard lists as a gap.

  Cell renderers as named exports so apps stop re-inventing them: `TwoLineCell`,
  `SeverityCounts`, `DueChip`, `Progress`.

  Also fixes `ChipStack`: it wrapped, which grew table rows. The standard requires
  a `+n` overflow rather than growth, so it no longer wraps.

- 69c9d5b: Complete the overlay family: CX-TST and CX-TIP.

  `ToastProvider` + `useToast` (CX-TST) — tokenized and dependency-free, so SOC can
  drop `react-hot-toast` and its unthemed styling. Bottom-right, stacks upward
  without displacing what is already there, semantic left rule PLUS an icon so it
  never rests on colour. Errors persist and announce assertively (`role="alert"`);
  everything else clears after 4s politely. Undo stays available for the whole
  display duration.

  Both gaps the standard records against Tenant's version are closed: a queue cap
  (`max`, default 4) so a bulk action cannot flood the corner, and dedupe so a
  repeat increments a count instead of stacking copies.

  `Tooltip` + `Popover` (CX-TIP) — written from scratch; no console had a reusable
  one. A tooltip must never contain a control, so its `content` is typed as a
  string: passing a button in is a type error rather than a review note. Opens
  after 400ms of hover but IMMEDIATELY on focus, because hover-only content is
  invisible on touch and to keyboard users. Popover opens on click, traps nothing,
  Escape closes.

  Also extracts `useAnchoredPosition` — flip-to-viewport placement now shared by
  Menu, Tooltip and Popover instead of living inline in Menu, and it gained
  scroll/resize repositioning that Menu never had.

## 0.2.0

### Minor Changes

- abd84f1: Add the step-3 primitives: CX-TAG, CX-STE and CX-INS.

  CX-TAG — `Tag`, `ChipStack`, `Code`. Identity dots come from the categorical
  ramp, never the severity ladder, because a module is not ranked. A filtering tag
  gets a resting-state affordance rather than a hover-only one, so it actually
  looks clickable. Overflow collapses to +n with the remainder on hover.

  CX-STE — `EmptyState`, `ErrorState`, `Skeleton`. `EmptyState.variant` is
  required, so the "nothing exists yet" vs "nothing matches" distinction cannot be
  skipped — conflating them is the dead-end screen this component removes. Error
  takes the danger tone on its left rule only, never a full red panel. Skeletons
  are suppressed for 200ms so fast loads never flash, and reserve their height so
  appearing does not shift the page.

  CX-INS — `Note`, `InsightPanel`. `NoteTone` has no brand member, which makes an
  orange callout unrepresentable rather than merely discouraged. `InsightPanel`
  carries a labelled badge header, a confidence signal, and cites the records it
  derives from so a claim can be checked; suggested actions are chips, never
  auto-executed.

  `Tag`, `EmptyState`, `ErrorState`, `Note` and `InsightPanel` are server-safe;
  only `Code` (clipboard) and `Skeleton` (the 200ms timer) are client components.

## 0.1.0

### Minor Changes

- 9426308: Initial packages.

  `@vcyberizadmin/theme` — the canonical CX-TOK token contract, transcribed from the
  brand guidelines and the console design system of record. Three layers (ramp →
  role → `@theme inline`), dark-first, light via either `.light` or
  `[data-theme="light"]`. Includes the chamfer, the logo-spark scope, and explicit
  `@utility` declarations for the motion durations.

  `@vcyberizadmin/ui` — `Button` (CX-BTN, six brand variants with the chamfer and an
  in-place loading state) and `Card` (CX-CRD, header/hint/one-level nesting, no
  shadow at rest).

- 9426308: Add `NavRail` (CX-NAV) under the new `@vcyberizadmin/ui/layout` export.

  Merges the three consoles as the standard directs: Tenant's rendering, SOC's
  data model (`liveBadge` slot, `tag` pill), VAPT's affordances (labelled
  "Minimize menu" control, independent group and section expand). Portable across
  repos via a `linkComponent` prop and a prop-driven `activeHref` rather than an
  internal router call. Collapse and mini state persist per user.

  `@vcyberizadmin/theme` gains `--container-rail` / `--container-rail-mini` (300px / 68px).

- 9426308: Add the overlay family under a new `@vcyberizadmin/ui/overlays` export, all sharing one
  `useOverlay` hook so focus, Escape and scroll-lock behave identically.

  - `useOverlay` — focus trap (both directions), focus restore, Escape via an
    overlay stack so only the topmost dismisses, reference-counted body
    scroll-lock, and portal rendering.
  - `Modal` (CX-MOD) — sm/md/lg, hairline-separated header/body/footer.
  - `Drawer` (CX-DRW) — right-anchored 480/640, next/previous, bottom sheet below `sm`.
  - `ConfirmDialog` + `ImpactBox` (CX-CNF) — consequence-first title, reversible
    line in the success tone, guidance line, actor attribution, optional
    type-to-confirm and reason capture.
  - `Menu` (CX-MNU) — portal-positioned with viewport flip, keyboard navigation,
    outside-click dismissal, destructive items sorted last below a separator.

  `@vcyberizadmin/theme` gains `--container-drawer{,-wide}` and the `modal-in`,
  `drawer-in` and `fade-in` animations.

- 9426308: Add CX-STA — `StatusPill` and `SeverityBadge`, plus the vocabulary at
  `@vcyberizadmin/ui/lib/status`.

  Two languages that never share an axis: semantic (what happened, shaped dot) and
  severity (how bad, ranked, 3px leading bar). Brand orange is excluded from both.
  Colour never carries meaning alone — every tone owns a distinct shape (filled
  circle, haloed circle, diamond, hollow ring, square, absent) so the vocabulary
  survives colour-blindness and greyscale print.

  Ships `severityRank()` and `bySeverity()` for Critical-first sorting,
  `extendVocabulary()` so VAPT and SOC states layer over the base without forking,
  a liveness pulse on running states, and the categorical + sequential chart ramps
  so charts inherit the same discipline.

  `@vcyberizadmin/theme` gains the `--cat-1..6` and `--seq-1..8` ramps.

- 9426308: Complete the navigation frame in `@vcyberizadmin/ui/layout`.

  - `TopBar` (CX-TOP) — SOC's utility bar plus the two groups VAPT adds and SOC
    lacks: a live clock with timezone, and system health as a dot **and** word.
    Eight control groups, every one individually optional. Below 1280px the
    non-essential groups collapse into a real overflow menu rather than wrapping —
    the one thing the standard says to fix on the way in. Menus reuse CX-MNU, so
    aria-expanded, Escape, click-outside and focus return come from the shared
    overlay stack.
  - `AppShell` (CX-SHL) — composes rail and top bar as props rather than
    hardcoding them. Skip-to-content is the first focusable element, the content
    column takes `min-w-0`, and below 768px the rail becomes a focus-trapped
    drawer instead of holding 300px, closing the gap the standard records.
