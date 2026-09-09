# @cyonix/ui

## 3.0.0

### Major Changes

- 98a09d0: Bring `Sankey` up to the reference's full design

  The first pass got the topology right and skipped almost everything else. This
  copies the rest.

  **Node labels are drawn in place**, beside each node, at the reference's
  `11.5px/800` over a `10.5px/700` count — not collected into a caption below the
  chart. They read against the ribbons they name, which is the whole point of
  labelling a node rather than a series. They are HTML positioned in percentages
  rather than SVG text, because the plot uses `preserveAspectRatio="none"` and
  would stretch any glyph drawn inside it.

  **Hovering a ribbon now dims the others** to 7% and lifts the hovered one to
  72%, with a brand-filled readout naming both ends and the count. This is not
  decoration: a Sankey answers "where did THIS one go", and that is unreadable
  while a dozen others compete for the same pixels. The previous behaviour — a
  brightness nudge with no dimming — did not answer the question.

  **Ribbons paint thickest-first**, so a hairline lands on top of the slab it
  crosses and stays hoverable rather than being buried by it.

  **Tones are the reference's own.** `SankeyTone` now names the ranked marks
  (`crit`, `high`, `med`, `low`, `ok`) plus `violet` and `neutral`, replacing a
  palette that mapped to the wrong tokens: `ok` resolved to a teal `#00b37a` where
  the reference is mint `#7ed321`, and `info` to `#4d9cf0` where the reference is
  azure `#1b6ef3`. Colouring a flow by what each end MEANS is what lets a source
  that mostly auto-closes share a language with the outcome it reaches.

  **`--violet` is new** in the theme: `#a855f7`, the reference's fifth accent. Its
  palette is brand / azure / mint / violet / rose, and the other four are already
  the severity marks — this is the one that was missing. Deliberately not a step
  on the Amethyst ramp, which runs bluer and stays reserved for agent output.

  `Sankey` is now a client component, since the hover state is what makes it
  readable. Every band and node still carries a `<title>`, so the numbers survive
  without a pointer.

### Minor Changes

- a93ed04: `Logo` gains an `xl` size, and `DockRail` centres its expanded lockup

  The rail's mark was rendering at 20px against the reference's 36px, and its
  expanded lockup at 16px against 32px — roughly half, in both cases. The cause
  was that `Logo`'s scale simply had no step that large: `lg` topped out at a 32px
  mark and a 24px lockup, both below what a 76px rail column needs. A mark set two
  steps down in that column does not read as an identity, it reads as an icon
  someone forgot to size.

  `xl` is the rail size: a 36px mark, a 32px lockup.

  It was also off-centre, which followed from the same cause. `DockRail` pins the
  mini mark at `left-1.5`, which centres a 36px mark in the 48px brand box exactly
  and leaves a 20px one 8px short. And the expanded lockup was pinned left too,
  where the reference centres it — so it now anchors from the middle while the
  mark holds its left position through the crossfade.

- f11b89d: Add `MeterRow`, and an `xs` size for `IconTile`

  Building the console's AI investigation, False positives by source and Assigned
  to analysts panels turned up the same shape three times: a name on the left, a
  figure on the right, a bar underneath. Nothing in the library fitted it, so all
  three would have been hand-rolled.

  `RankedBars` owns its own caption (a computed share) and its own colour (a ramp
  position). These rows need "34% of 486" and "1,240 · 2.1s avg", neither of which
  is derivable from the fraction, and a colour that carries meaning — a source
  past a tuning threshold, an unassigned queue. `ProportionBar` splits one total
  into segments, which is a different question from one value against a maximum.

  So `MeterRow` takes the caption as a node and the tone explicitly: it decides
  layout, the caller decides meaning. `fraction` is clamped, because a meter
  overshooting its track is a data bug rendering as a layout bug, and the layout
  should not be the thing that breaks.

  `IconTile` gains `xs` (24px), the size a meter row's leading marker wants where
  36px would dominate the row it labels.

### Patch Changes

- 11a40a1: Match the motion curve and durations to the reference

  Everything about the navigation measured correct — panel 76px at x=12, items
  48px on a 56px pitch, glyphs 22px centred at x=50, the ink tab 9×34, radii 28
  and 16 — and it still did not feel the same, because motion was the one layer
  never compared.

  **One curve, and it was the wrong one.** The reference moves everything on
  `cubic-bezier(.2,.8,.2,1)`: the rail's width, the segmented ink, a progress fill,
  the view transition. This file used `cubic-bezier(.2,.7,.2,1)`, which is
  indistinguishable in a still frame and reads as a flatter, more mechanical ease
  once it moves.

  **Both durations were fast.** The reference runs quick state flips — a button, a
  chip, a field's focus ring — at `.18s` where this ran `.12s`, and size and
  position changes at `.32s` where this ran `.24s`. The rail's peek was the clearest
  tell at a third quicker than the original, which reads as eager rather than
  considered.

  `--duration-instant` 120ms → 180ms, `--duration-standard` 240ms → 320ms. These
  are theme-wide, so every transition in the library slows to match; that is the
  intent, since the reference tunes from one vocabulary rather than per component.

  The rail's ink keeps its own `.22s`, between a colour flip and the panel's
  width, as the reference has it.

- 418cadd: `Sankey` lays out in measured pixels, so its node bars are the width they claim

  The chart used a fixed 600-unit coordinate space scaled to the container with
  `preserveAspectRatio="none"`. That is right for a ribbon, an organic shape that
  may stretch, and wrong for anything whose WIDTH carries meaning: a 12-unit node
  bar in a 1707px container rendered **34px** wide, nearly three times its stated
  size.

  This is the same defect that stretched `StepArea`'s axis text, and I fixed that
  one by moving the text out of the scaled space without asking what else in there
  had a horizontal dimension. The node bars did.

  It now measures its container with a `ResizeObserver` and lays out in real
  pixels, so one user unit is one pixel and neither axis is distorted — which is
  what the reference does, and the only way a bar can be 12px at every width.
  Verified at 1707px and 1212px: node width 12px in both.

  Node labels stay HTML. With the space measured they would no longer distort, but
  HTML keeps them on the document's type stack, lets them inherit the theme's font
  tokens, and allows CSS truncation of a long node name.

## 2.0.0

### Major Changes

- 047f81c: Point `DockRail` and `ConsoleBar` at their own surfaces

  Both were already faithful ports of the reference console's rail and header —
  `DockRail` had the edge-tab ink, the overlapping count bubble, the width-animated
  labels, the module badge and the asymmetric logo crossfade; `ConsoleBar` had the
  68/78px height, the 15px scope tabs with their glowing ink, the 268px search
  affordance and the ringed notification count. What neither had was a surface of
  its own, because the tokens did not exist.

  `DockRail` now fills with `--rail`, which inverts: a raised grey slab in dark, a
  solid brand column in light. That is the reference's most recognisable single
  feature, and it changes how "one accent, earned" is satisfied per theme — in
  dark the ink tab is orange against grey; in light the whole column is orange, so
  the ink goes white, because an orange marker on an orange ground is invisible.
  `--rail-ink` carries that inversion.

  `ConsoleBar` moves its tonal fills from the white washes onto `--surface-2` /
  `--surface-3`, its mobile logo chip onto `--chip`, and its bell and notification
  count onto `--bell` / `--badge`. Those last two invert against each other, so the
  pair spends exactly one accent in either mode: orange bell with a dark count in
  light, dark bell with an orange count in dark. The count previously took the
  danger tone, which said "something is wrong" about a number that is usually just
  a number.

  `NavRail` is unchanged. It is the flush, groupable, click-collapsed sidebar for
  consoles with deep navigation, and `DockRail` is the flat icon dock for consoles
  whose surface fits in five destinations. That distinction is deliberate and both
  components document it.

- a03f468: Align the theme with the SOC reference design

  The library and the reference console it is meant to implement had diverged on
  everything except the brand orange. This brings the token layer onto the
  reference; components are unchanged in this release because they address roles
  rather than values, which is why 1057 component tests passed untouched.

  **Typography is one family, not two.** `--display` and `--ui` both resolve to
  Plus Jakarta Sans; the reference separates headings from body by weight and size
  rather than by typeface. Consuming apps now supply two host variables instead of
  three: `--font-plus-jakarta-sans` and `--font-jetbrains-mono`. An app still
  passing `--font-space-grotesk` and `--font-inter` will render in the system font
  with no error, which is the silent failure this contract has always had.

  A weight scale comes with it (`--weight-body` 500 through `--weight-heavy` 800).
  The reference is a markedly heavier design than the old 400-600 range.

  **Light mode inverts.** The ground was Cloud with white cards; it is now white
  with grey cards, matching the reference's `#FFFFFF` shell over `#F3F3F5`
  surfaces. A card now reads as a recess rather than a slab. Both values had to
  move together, since flipping one would leave cards invisible.

  **The neutral ramp is hue-neutral.** It carried a blue cast (Cloud `#e5ecf6`,
  Silver Dust `#c9d0e2`) where the reference is pure grey. This was the single
  most visible divergence in light mode. The ramp grew from 13 steps to 22 so
  surface roles land on the reference's values exactly rather than near them.

  **Severity is re-hued, and the change is semantic.** The old scale ran
  red → red → amber → blue → neutral, so `high` was a second red and `low` was a
  blue that outranked amber by eye. It now runs the reference's
  red → amber → blue → grey → green:

  | level        | was         | now       |
  | ------------ | ----------- | --------- |
  | `--sev-crit` | red-400     | `#f0384a` |
  | `--sev-high` | red-300     | `#f5a524` |
  | `--sev-med`  | amber-350   | `#1b6ef3` |
  | `--sev-low`  | blue-350    | `#8a9198` |
  | `--sev-info` | neutral-400 | `#7ed321` |

  Anything reading a severity colour will change hue. Token names are unchanged.

  **The rail is now its own surface.** Six new tokens (`--rail`, `--rail-fg`,
  `--rail-fg-dim`, `--rail-active`, `--rail-ink`, `--logo`) with matching
  utilities. In dark the rail is a raised grey slab with brand ink; in light it
  inverts to a solid brand column with white icons, which is the reference's most
  recognisable feature. `NavRail` previously read `bg-bg` and had no way to
  express this.

  Also adds `--surface-3`, `--thread`, `--track`, the reference's `--shadow-2` /
  `--shadow-3` elevations, `--radius-2xl`, and rounder radius aliases (a card goes
  12px to 22px, a button 8px to 14px). The `--r-*` step scale is untouched, so
  code addressing a step directly keeps its value.

  **Two accessibility regressions are carried deliberately and recorded.**
  `--fg-2` and `--fg-muted` in light are the reference's own `#7a818a` and
  `#a6acb4`, which measure 3.94:1 and 2.29:1 on white against the 4.5:1 WCAG 2.2
  1.4.3 asks of body text. They are listed in `ACCEPTED_BELOW_AA` in
  `contrast.test.ts` with their measured ratios, so the debt is visible, a further
  regression still fails the build, and re-enabling the floor is a deletion. Three
  other pairs that the reference has no opinion on were fixed rather than excused:
  dark `--accent-ink` and `--fg-link` both fell below AA once the surface
  lightened, and light `--sev-low-ink` was 0.05 short.

### Minor Changes

- 60d30d7: Fix three chart bugs found by building the reference console

  Adds `apps/reference`, which rebuilds the SOC console's Overview, Alerts and
  Cases screens from `@cyonix/ui` alone so the result can be diffed against the
  design reference. It is not shipped; its job is to fail. Every place it needs an
  arbitrary class or a wrapper doing a component's job is a gap in the library,
  and it found four in its first render.

  **`StepArea` mispositioned its x labels.** The label loop passed the label's
  index to `cx()`, which indexes the SERIES — so five axis times against
  thirty-six readings all landed in the first five of thirty-six slots, stacked on
  top of each other. Nothing checked that the two lengths agreed, so this failed
  silently and looked like a rendering glitch. Labels are now spread across the
  plot by their own fraction of the axis, which also makes an axis of five times
  against thirty-six readings the supported case it should always have been.

  **`Sankey` rendered at the wrong height.** It set `h-full` on an SVG whose
  parent had no height, so the browser fell back to the viewBox's aspect ratio and
  a 600×300 box rendered 1400px wide came out 700px tall. It now fixes its height
  to the prop, as the other charts do, and stretches only horizontally.

  **`Donut`'s ring did not match its own legend.** The arcs took `rampInk` while
  the legend took the marks, so a ring drew pale label colours beside saturated
  legend swatches. The cause is a genuine three-way distinction that only had two
  names: a ring's stroke is a MARK, but it has to arrive as a `text-*` class
  because it paints with `currentColor`, and Tailwind will not emit a class name
  computed at runtime. `rampStroke` is that third case, and `SEVERITY_META` gains
  a matching `stroke` field. For the categorical and sequential ramps it is
  identical to `rampInk`, since those read one token; only severity separates mark
  from ink.

  **`Donut` gains `shape="squircle"`** — the rounded square the console uses for
  its severity arch. Both shapes share the segment arithmetic because the path is
  normalised with `pathLength`, which matters more than it sounds: a rounded
  square's perimeter has no closed form, so without it the two could not share a
  code path.

- 6f856c1: Fix the rail's fill, distorted axis text, and Segmented's fixed width

  **The rail was the wrong grey.** `--neutral-850` held an interpolated `#2b2e33`
  where the reference uses `#26282c`, so the navigation sat five points too light
  against a page background that was already exact. Worse, the comment beside
  `--rail` asserted it was "the reference's #26282C step" while pointing at a
  value that was not. Both corrected, and the ramp's own comment no longer claims
  850 is interpolated.

  **`StepArea`'s axis text was stretched.** The plot uses
  `preserveAspectRatio="none"` so its 600-unit coordinate space fits any card
  width, which is right for the line and the gridlines and ruinous for glyphs:
  SVG `<text>` inside it is scaled horizontally too, so on a wide card the tick
  numbers and times came out visibly distorted. The labels are now positioned as
  HTML in percentages, which keeps the type undistorted at any width. `Sankey`
  already did this, for exactly this reason; the lesson had not been carried over.

  **`Segmented` could not be made full width.** The track was hardcoded to
  `w-max`, so the console's range selector — which runs the full width of the
  chart above it, segments aligned to the plot — was not expressible at all. A
  `stretch` prop switches the track to an equal-fraction grid, and centres each
  label in its cell, which content-sized segments never needed.

- 396ee9b: `Logo mini` renders the real short mark

  `mini` used to render the bare four-point spark, with a comment explaining why:
  the brand shipped no separate short mark, and the star was the only
  self-contained element in the lockup. A real short mark now exists in the
  reference console's artwork, so `mini` renders it: the CX monogram, with the
  spark between the letters.

  The letterforms take `currentColor` like the lockup's already did. This is
  worth stating because the reference cannot do it: it embeds the artwork as
  `<img src="short-dark.svg">`, and CSS cannot reach the fill of an `<img>`. That
  makes the reference's own `--logo` token dead code, and it means its mark loses
  every orange element against its orange light-mode rail. Ours recolours with a
  text utility, so it survives both rail treatments.

- 7d24a94: Add `RecordCard` and `QueueRow`, the card/table pair a triage queue needs

  The library had the ingredients for a case or alert list — `Card`,
  `StatusPill`, `SeverityBadge`, `Tag`, `ProportionBar`, `DataTable` — but
  nothing that composed them into either shape the reference console uses, so
  every consumer was rebuilding the same two layouts by hand.

  `RecordCard` is a record arranged for reading: a severity bar down the left
  edge, a meta row of tags with a `flag` that pushes right above phone width, the
  title at full weight, and a wrapping footer of facts where a meter is allowed
  the remaining space. `needsAction` rings the card rather than tinting it, so it
  does not compete with the severity bar for the same job.

  `QueueRow` is the same record arranged for scanning: a stack of rows inside one
  card on `--surface-2`, each a whole click target. `trailing` is dropped below
  `sm` on purpose — a severity tag and a relative time are the first things that
  can go, because the bar still carries rank and the row still opens.

  `RowFacts` puts dot separators BETWEEN facts and only between them, with no
  stranded separator when a fact is conditionally absent. Doing that by hand in
  each consumer is how a row ends up reading "· ·".

- 0f8d18c: Add `Sankey` and `IconTile`

  **`Sankey`** answers a question `FunnelFlow` cannot. FunnelFlow deliberately
  refuses to be a Sankey, and its reasoning holds for a linear pipeline: one that
  only ever narrows is read by its drop-off figure, and a ribbon encodes that
  number less precisely than a bar plus a stated percentage.

  That reasoning does not extend to branching. Once a population splits several
  ways and the branches recombine — alerts from four sources, each either closed
  by an agent or sent to an analyst, each of those ending benign, tuned or
  escalated — there is no single drop-off to state. The question stops being
  "where are we losing them" and becomes "which path did they take", which is
  about topology, and a stack of bars cannot show topology at all. Reach for
  FunnelFlow first; it is the more precise chart whenever it fits.

  No charting library, per the same argument as the rest of `./charts`: it is
  some arithmetic and one cubic Bézier per ribbon. It is also server-safe, which
  the reference's own implementation is not — that one measures `clientWidth` and
  redraws, where this scales through a viewBox. Hover is CSS, and every band and
  node carries a `<title>`, so the numbers are reachable without a pointer.

  A node is as thick as the larger of what enters and what leaves it: using
  either alone makes a node that drops part of its input look like it passed
  everything on. Ribbons are coloured by destination, so following a colour
  answers where something ended up rather than where it came from, and they leave
  each node ordered by their targets' stacking, which is what stops them
  braiding. Labels are HTML rather than SVG text, because
  `preserveAspectRatio="none"` stretches the coordinate space and would distort
  any glyph drawn inside it.

  **`IconTile`** is the filled rounded square that identifies what a KPI card is
  counting. Its tone is a label, not a severity — two cards tinted amber and
  azure are not being ranked — so the tones name their intent (`info`, `ai`,
  `neutral`) rather than borrowing the severity ladder.

## 1.1.0

### Minor Changes

- 44cae9d: Declare `tailwindcss` as a peer dependency

  The components are built from Tailwind utility classes and ship no CSS of their
  own, so the library has always required Tailwind v4 in the consuming app. That
  requirement was never declared: `tailwindcss` sat in `devDependencies` only, so
  npm and pnpm had no way to tell a consumer they were missing it, or were on v3.

  The failure mode this produced is the worst kind. Nothing errors. Tailwind
  generates none of the utilities the components reference, so every component
  renders completely unstyled, and the app author has no signal pointing at the
  cause.

  Declaring `tailwindcss: ">=4"` as a peer means the package manager says so at
  install time instead.

  Anyone already using this library necessarily has Tailwind v4, since otherwise
  nothing was rendering. Strict-peer setups may now surface a warning that was
  always true but previously invisible.

## 1.0.1

### Patch Changes

- 94418c4: Give the focus indicator its own token, and lift it to WCAG AA in light mode

  `--focus` and `--focus-critical` were defined, promoted to `--color-focus`
  utilities, and read by nothing. `@layer base` painted `:focus-visible` with
  `var(--accent)` instead, and the 17 components that strip that outline to draw
  their own border or ring followed suit.

  They are near-identical oranges, so nothing looked wrong. The cost was that the
  focus ring took a colour chosen for brand fills rather than for visibility, and
  in light mode that colour measures **2.51:1** against the Cloud ground — below
  the 3:1 WCAG 2.2 1.4.11 requires of a focus indicator. Every input, select,
  combobox and search field was affected, because those are exactly the controls
  that replace the base outline with `focus:border-accent`.

  - Light `--focus` moves from Orange 350 to **Orange 450** — 3.38:1 on `--bg`,
    4.02 on `--surface`, 3.74 on `--surface-2`. The lightest step that clears on
    all three. Dark mode already measured 6.44:1 and is unchanged, as is
    `--focus-critical` at 3.26:1.
  - `:focus-visible` now reads `var(--focus)`.
  - Components use `border-focus` / `ring-focus` in place of the accent.

  `--accent` itself is untouched: it stays Orange 350 in light and Orange 400 in
  dark. Splitting the two tokens is what allows the ring to clear AA without
  moving the brand primary.

  **Visible change.** The focus ring is a slightly deeper orange in light mode and
  a slightly brighter one in dark. Anything relying on the ring matching
  `--accent` exactly will now differ.

- 94418c4: Fix overlays not taking focus when mounted already open

  `Modal`, `Drawer`, `ConfirmDialog` and `CommandPalette` moved focus into the
  panel only when they transitioned closed → open. One rendered already open —
  from a route, or from URL state — left focus on `<body>`.

  Every overlay renders through a portal, and `usePortalTarget` only resolves in
  an effect, so on the render where `open` becomes true the panel is not in the
  DOM yet and `panelRef.current` is still null. `useOverlay`'s effect keyed on
  `open`, fired once against that null ref, and never ran again.

  Nothing errored. Escape and the scroll lock still worked, so the overlay looked
  correct. What was lost:

  - The dialog title was never announced — the reason focus goes to the panel
    rather than the first field.
  - The Tab trap only intervenes once focus is already inside the panel, so the
    first Tab walked into the page behind the scrim.
  - `ConfirmDialog`'s guarantee that Cancel holds default focus was inert, so
    Enter could reach the destructive action. `initialFocus` points at a node
    inside the portal, which was null at exactly the same moment.

  `useOverlay` now mirrors the panel node into state and focuses in a separate
  effect that depends on it, so focus happens whenever the panel actually lands.
  Deliberately not a `ready` flag each overlay passes in: a flag every future
  overlay must remember is the same bug waiting to happen.

- 94418c4: Stop `formatDateRange` printing a single-day range twice

  A range whose ends are equal rendered as `26 August 2026 – 26 August 2026`.
  That is not an edge case: the `today` preset resolves to `{ from: X, to: X }`,
  and `DateRangeFilter`'s trigger renders `formatDateRange(value, true)` — so
  choosing **Today** in the filter read `26 Aug – 26 Aug 2026`. It now reads
  `26 Aug 2026`.

  Genuine two-day spans are unaffected; the collapse keys on the two ends being
  the same date, not on them sharing a month.

## 1.0.0

### Major Changes

- f00a600: Adopt the official Cyonix token set. The theme is now a direct transcription of
  `Cyonix_Token_Variables` — Base Collection, Color Tokens for both modes, and
  Global Tokens — rather than a hand-built ramp.

  **Base Collection.** Seven official ramps replace the old six-step neutral and
  its ad-hoc semantic hues: `--neutral-*` (0 → 950, thirteen steps),
  `--orange-*`, `--red-*`, `--green-*`, `--amber-*`, `--blue-*`, `--amethyst-*`.
  Every step is the design system's own number, so `Orange 350 (Primary)` in Figma
  is `--orange-350` here and the two can be checked against each other by eye.

  **Two semantic changes worth reading twice:**

  - **Purple means AI now, not info.** Amethyst is reserved for agent output; Info
    is Blue Onyx. Anything that used `--info` for a purple tint is now blue, and
    there is a new `--ai` / `--ai-bg` / `--ai-border` / `--ai-ink` group.
  - **Success is teal, not green.** Green Onyx 350 is `#2cbf8f`, where the old
    `--ok` was `#22c55e`.

  **Light mode's ground is Cloud (`#e5ecf6`), not white.** White is reserved for
  cards, so a card lifts off the page instead of dissolving into it.

  **New roles the set defines and we did not have:** action states
  (`--accent-hover` / `-pressed` / `-disabled`, plus secondary and ghost),
  `--rule-default` / `-strong` / `-brand`, the icon group, `--scrim` and
  `--scrim-strong`, `--surface-2`, `--fg-quaternary`, `--fg-disabled`,
  `--fg-link`, `--fg-on-dark` / `--fg-on-light`, and per-status `-bg` / `-border`.

  **Global Tokens** replace the old radius scale: `--r-1` … `--r-7`
  (2 / 4 / 6 / 8 / 10 / 12 / 16) plus `--r-none` and `--r-full`, with `--r-sm|md|lg|xl`
  kept as named aliases so component code still reads intent. `--stroke-0` … `-3`
  are new.

  **Two deviations, both forced by contrast, both minimal:**

  | token              | as specified | measured            | shipped as          |
  | ------------------ | ------------ | ------------------- | ------------------- |
  | `Text-Brand` light | Orange 350   | **2.51:1** on Cloud | Orange 600 (8.44:1) |
  | `Text-Link` light  | Blue 350     | **2.41:1** on Cloud | Blue 500 (5.34:1)   |

  Both are the saturated mid-ramp step used as small text on a light ground; each
  moves to the first darker step on the same ramp that clears 4.5:1, so the hue is
  unchanged. Everything else is verbatim. `Text-Brand` dark stays Orange 400 as
  specified — it measures 5.88:1 and needed no help.

  All 48 ink-on-surface pairs clear AA in both themes, and the set's own
  `status-*-text` on `status-*-bg` pairings measure 5.0–6.2:1 as designed.

  **The real Cyonix logo.** `Logo` no longer draws a "C" monogram and a text
  wordmark — it renders the official artwork, paths lifted verbatim from
  `Cyonix Logo_Light Mode.svg` and `_Dark Mode_Inversed.svg`. Those two files
  differ only in the wordmark fill (`#1C1E25` against `white`), so this ships as
  ONE component whose letterforms take `currentColor`: colour it with a text
  utility and it follows the theme. There is no light/dark pair to keep in sync
  and no way to ship the wrong one.

  The spark gradient (`#FFA505 → #FE1F0B`) survives as SVG gradient stops on the
  four-point star and the two angled strokes inside the Y and the X — still the
  only sanctioned use of it. `mini` renders the star alone: the brand ships no
  separate short mark, and the star is the one self-contained element that reads
  at 32px. Swap it if a real short mark is issued.

  **Breaking.** `--onyx`, `--dark-grey`, `--dark-grey-2`, `--mid-grey` and
  `--light-grey` are gone with their `--color-*` utilities; the Neutral ramp
  replaces them. Four components reached for a ramp step directly and were
  repointed: `Code`, `Button` (solid and edge), `Tooltip`, `TopBar`.

### Minor Changes

- 63f8fc2: CX-CHT — four new charts: `Gauge`, `AxisBars`, `Heatmap` and `StepArea`. Still
  no chart library; all four are arithmetic and SVG.

  - **`Gauge`** is the sibling of `Donut` for the same data shape. Reach for the
    arch when the reading is a LEVEL — how full, how far through — and the donut
    when it is a SPLIT: a ring implies the parts close back on themselves, an arch
    has a floor and a ceiling. The path carries `pathLength="100"`, so each
    segment is its own percentage and the arithmetic never touches the geometry.
  - **`AxisBars`** adds gridlines and a zero-based axis. `highlight` draws one
    window at full contrast and lets the rest recede, because the question in a
    bar set is almost never "what is every bar".
  - **`Heatmap`** renders as a real `<table>`, not a grid of divs — a matrix IS
    tabular, so the row and column headers carry the meaning for free. `null` is a
    dashed empty cell rather than the bottom of the ramp: "we saw nothing" and "we
    did not look" are different findings, and conflating them makes the chart
    worse than no chart.
  - **`StepArea`** is the only one that is not server-safe, and it ships in its
    own file so that fact does not leak into the others. A line between two
    samples asserts the value moved smoothly between them, which for a polled
    metric is a fiction; the step holds each reading flat and joins them with a
    short S-curve.

  **`verify-utilities` gained an `SVG_ATTR_VALUES` exclusion.** It flagged
  `non-scaling-stroke` — a value of the `vector-effect` attribute, which reaches
  the scanner as a bare dashed string and is indistinguishable from a class by
  shape. Unlike a gradient id it cannot be renamed; it is an SVG keyword. Extend
  that set rather than contorting a component around the scanner.

  **Still to come:** `DualSeries`, `Radar`, `SquircleRing`, `LiquidFill` and a
  Sankey. The Sankey is worth a deliberate decision rather than a drive-by:
  `FunnelFlow` exists precisely because a Sankey's ribbons encode the same single
  number as a bar's width while being harder to read, so building one reverses
  that call.

- 83ce43a: CX-CBR — `ConsoleBar`, the SOC console's header, ported. Sits beside `TopBar`
  rather than replacing it.

  Same relationship CX-DCK has to CX-NAV, for the same reason: the two answer
  different questions. `TopBar` is a 52px utility strip — scope, clock, health, a
  menu — where every group is a small control and the whole thing reads as chrome.
  `ConsoleBar` is a 68/78px identity bar built around the question an operator
  asks constantly ("whose data am I looking at?") and the three panels they open
  all shift. It is taller, its search affordance is sized to be _seen_, and its
  scope switcher is a row of tabs with a moving ink rather than a dropdown.

  **Scope is the point.** It sits far left because it qualifies everything to its
  right, and it reads as tabs because it is switched far more often than anything
  else in the bar. The ink beneath the current scope is the ONE orange thing here
  — scope is location, and location is what orange means.

  **Two ways the current scope can stop being visible, both handled.** The source
  handles one: an unpinned scope makes the picker button take over its name. The
  other it misses — the inline tabs shed one at a time as the bar narrows, so a
  _pinned_ scope can be hidden by a breakpoint, leaving the picker saying
  "Tenants" and no ink anywhere. This measures `offsetWidth` rather than inferring
  from the breakpoint (CSS is the only thing that knows, and only the DOM can read
  it back), so the picker takes over in that case too. The bar never stops showing
  where you are.

  **Controls fold rather than vanish.** Below `xl` there is no room for the theme
  and settings buttons, so they move INTO the profile panel as labelled rows —
  `ConsoleMenuItem.compactOnly`. One definition, visible as an icon button on a
  wide screen and a row on a narrow one, never both at once. A control that
  disappears on a laptop is a control the operator cannot reach.

  **Counts take the danger tone, never orange** — the same rule CX-DCK's badges
  follow — and a zero renders no badge at all.

  All three panels are CX-TIP's `Popover`, so Escape, click-outside, focus return,
  portalling and anchored positioning come from the shared overlay stack instead
  of being reimplemented three times. The bar does no date arithmetic:
  `ConsoleNotification.time` is pre-formatted by the app, so it needs no clock and
  cannot disagree with the server.

  **Departure from the source, consistent with CX-DCK:** the bar is painted with
  the library's own tokens rather than the console's `--bell`/`--badge` pair,
  which puts orange on the notification bell in light mode. Orange stays on
  location and primary action.

- 83ce43a: CX-DCK — `DockRail`, the floating dock rail, ported from the SOC console. Plus
  `railMode` on `AppShell` so the shell knows not to wrap it in a drawer.

  Ported from the deployed SOC console, whose rail is the one piece of that app's
  chrome no library component could express. It ships **beside** `NavRail`, not in
  place of it: both are legitimate, and which one an app wants is decided by how
  many destinations it has, not by which is newer.

  **Why it could not be a `NavRail` variant.** Four differences, each of which
  alone would be a prop, but together are a different component:

  - **It floats.** The panel is absolutely positioned inside a fixed-width gutter
    and expands _over_ the content, so the gutter never changes and nothing
    reflows when the pointer crosses the rail. `NavRail`'s collapse resizes the
    grid — deliberately, because at 300px it has to. This one must not, because a
    rail that reshuffles a table every time the mouse passes it is unusable.
  - **Expansion is hover, not a click.** So there is no persisted state, no
    storage key, no controlled/uncontrolled pair, and nothing for a user to set.
    Bound to `focus-within` as well, so the keyboard gets what the mouse gets.
  - **Below `xl` it is a bottom dock, not a drawer.** Thumb-reachable and always
    visible, with the primary action lifted out of its centre as a FAB. `action`
    is dock-only and renders nothing above `xl`: the expanded rail is a column of
    destinations, and a button among them reads as one more place to go. On a wide
    screen the primary action belongs in the console bar, where there is room to
    label it.
  - **Nesting is not supported, by type.** `DockItem` has no `children` field. A
    dock with sub-items is a sidebar wearing the wrong clothes; that is what
    `NavRail` is for.

  **The one deliberate departure from the source.** The SOC console paints the
  whole rail Sunset Orange in its light theme. That is dropped. The design system
  reserves orange for exactly one thing at a time — the current location — and an
  orange rail puts the accent everywhere, leaving the active item to distinguish
  itself from a field of its own colour. Here the rail surface is `--surface` in
  both themes, hover is a neutral wash, and the only orange is the ink tab welded
  to the active item's edge. Same geometry, same motion, same crossfade; the
  colour rule the rest of the library follows now holds here too.

  **Counts** take the danger tone, never orange, and `0` renders nothing rather
  than a zero badge — an empty queue is not a state worth a glance.

  **`DockReveal`** ships alongside, for text that collapses with the rail. The
  module badge needs it: the source keeps the "S" of "SOC" visible at 76px and
  reveals only the "OC", so the badge reads as one letter collapsed and the whole
  word expanded rather than appearing out of nothing —
  `footer={<>S<DockReveal>OC</DockReveal></>}`. It shares the nav label's collapse
  mechanics from a single constant, so the two cannot drift apart.

  **`AppShell` gains `railMode`.** `sidebar` (the default) is unchanged. `dock`
  renders the rail straight through and drops the drawer and its trigger, which
  would otherwise hide a rail meant to stay visible and mount a button that opens
  nothing. In exchange the shell takes on the one duty the dock cannot do for
  itself: reserving scroll room at the foot of the content column below `xl`, so
  the last row of a table is not stranded under the floating bar.

  **Theme** adds `--container-dock-rail` (76px), `--container-dock-rail-open`
  (232px) and `--container-dock-gutter` (100px). Only the widths are named,
  because only the widths are load-bearing for the no-reflow behaviour above.

- 13fc529: CX-TBL — `compact`, `align: "center"`, per-column `className` and the row index
  reach `Column`; `hoverable` reaches the table. Fixes an actions column that
  clipped its own controls.

  Found by migrating a real consumer. `cyonix-tenants` had independently arrived at
  a column vocabulary this table could not express, and used it **73 times** across
  eight tables: `compact` on 42 columns and `align: "center"` on 31. Porting to the
  library would have meant deleting both and inventing percentage widths in their
  place — the library forcing a regression on an app, which is backwards.

  - **`compact`** sizes a column to its own content rather than giving it a share
    of the table's leftover width. Without it a status mark or an action group ends
    up stranded a hand's width from its header, because the six text columns and
    the one-glyph column all divide the remaining space equally. `actions` already
    did this privately; `compact` is that behaviour named and made available to the
    codes, counts, dates and statuses that need it and must _not_ also swallow the
    row click.

  - **`align: "center"`** completes an axis that was half-built. `align` drove the
    header and body together — the property that stops the two disagreeing — but
    offered only `left` and `right`, so a centred column was unreachable through
    the API. `right` continues to carry the mono tabular face, since a column of
    figures compared digit by digit needs it and a centred date does not.

  - **`className`** is the escape hatch for what the props above cannot say —
    `min-w-[20rem]` on a message column, `hidden md:table-cell` on one that drops
    out on narrow screens. Applied to header and body alike, for the same reason
    `align` is.

  - **`cell` now receives the rendered index**, so a numbered column follows the
    sort instead of contradicting it. Passing an extra argument to callbacks that
    ignore it is invisible to existing code.

  - **`hoverable`** turns off the row hover wash. It stays on by default and
    should stay on for any table whose rows are records an operator acts on, but a
    static reference grid — a permissions matrix, a legend — has nothing to click,
    and a hover wash there advertises interactivity the row does not have.

  **The bug.** `actions: true` did not exempt its cell from the default
  `max-w-0 truncate`, and `overflow: hidden` clips a `<button>` exactly as readily
  as a long string. Every actions column rendered its controls cut off — an `Edit`
  button arriving as `dit` — and it survived unnoticed because the story's actions
  column holds a single `⋯` glyph narrow enough to fit. Nothing errors, nothing
  fails a typecheck, and a screenshot looks plausible unless you read the label.

  `compact`, `actions` and `truncate: false` now all opt out of truncation, which
  is not three special cases but one rule: a column sized by its content has no
  share of the table to truncate against.

  Every addition is optional and `Column`'s required fields are unchanged, so no
  consumer needs to touch anything.

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
  behind `@cyonix/ui/charts`.** Built with plain SVG and **no charting
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

  `@cyonix/theme` — the canonical CX-TOK token contract, transcribed from the
  brand guidelines and the console design system of record. Three layers (ramp →
  role → `@theme inline`), dark-first, light via either `.light` or
  `[data-theme="light"]`. Includes the chamfer, the logo-spark scope, and explicit
  `@utility` declarations for the motion durations.

  `@cyonix/ui` — `Button` (CX-BTN, six brand variants with the chamfer and an
  in-place loading state) and `Card` (CX-CRD, header/hint/one-level nesting, no
  shadow at rest).

- 9426308: Add `NavRail` (CX-NAV) under the new `@cyonix/ui/layout` export.

  Merges the three consoles as the standard directs: Tenant's rendering, SOC's
  data model (`liveBadge` slot, `tag` pill), VAPT's affordances (labelled
  "Minimize menu" control, independent group and section expand). Portable across
  repos via a `linkComponent` prop and a prop-driven `activeHref` rather than an
  internal router call. Collapse and mini state persist per user.

  `@cyonix/theme` gains `--container-rail` / `--container-rail-mini` (300px / 68px).

- 9426308: Add the overlay family under a new `@cyonix/ui/overlays` export, all sharing one
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

  `@cyonix/theme` gains `--container-drawer{,-wide}` and the `modal-in`,
  `drawer-in` and `fade-in` animations.

- 9426308: Add CX-STA — `StatusPill` and `SeverityBadge`, plus the vocabulary at
  `@cyonix/ui/lib/status`.

  Two languages that never share an axis: semantic (what happened, shaped dot) and
  severity (how bad, ranked, 3px leading bar). Brand orange is excluded from both.
  Colour never carries meaning alone — every tone owns a distinct shape (filled
  circle, haloed circle, diamond, hollow ring, square, absent) so the vocabulary
  survives colour-blindness and greyscale print.

  Ships `severityRank()` and `bySeverity()` for Critical-first sorting,
  `extendVocabulary()` so VAPT and SOC states layer over the base without forking,
  a liveness pulse on running states, and the categorical + sequential chart ramps
  so charts inherit the same discipline.

  `@cyonix/theme` gains the `--cat-1..6` and `--seq-1..8` ramps.

- 9426308: Complete the navigation frame in `@cyonix/ui/layout`.

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
