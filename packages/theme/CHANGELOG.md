# @cyonix/theme

## 3.1.0

### Minor Changes

- 2382678: Add `Timeline` and `CodeBlock`, and a toned ring on `Card`

  Groundwork for the alert and case detail screens, which the parity app has
  never covered — four of the console's seven screens were untouched, including
  the two richest.

  **`Timeline`** is the shape those screens repeat: an agent's steps, the events
  behind an alert, the actions on a case. A marker in a threaded column, a title
  with its timestamp, a line of detail.

  The emphasis falls on the LAST entry, not the first, which inverts the usual
  reading and is worth stating: these run oldest to newest, so the bottom entry is
  the current state — what the agent concluded, where the intrusion reached.
  Everything above is history and takes the neutral marker. The thread stops at
  the last marker rather than running past it, so the column reads as finished
  rather than truncated.

  **`CodeBlock`** is the block sibling of `Code`, which is an inline chip. The
  difference that matters is the gutter: a detection rule gets discussed line by
  line, so the numbers are content. They are real text so they survive a copy —
  but `onCopy` receives the code WITHOUT them, because pasting a rule with "01 "
  welded to every line is worse than useless, and that is exactly what select-all
  gives you. New `--code`, `--code-fg` and `--code-gutter` put it a step darker
  than any surface in either theme, so a block reads as machine output rather than
  another panel. It stays dark in light mode for the same reason.

  **`Card` gains `ring`**, generalising what `RecordCard`'s `needsAction` did
  privately. A ring marks a card without claiming a place in whatever ranking the
  cards carry, which a tint would — it would compete with a severity bar for the
  same job. The console uses it at 22% for a case waiting on a human and 30% for
  the panel holding an agent's verdict.

  `Card`'s own heading also moves from `text-h3` (22px) to `--text-panel` (17px),
  the same fix already applied to the parity app's headings.

## 3.0.0

### Major Changes

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

### Minor Changes

- fc4c337: Add panel-heading steps to the type scale

  A card's title had no size in the scale. Between `--text-h3` at 22px and
  `--text-body` at 15px there was nothing, which is the widest gap in the whole
  ramp — and a panel heading falls squarely into it. So every card heading reached
  for `h3` and came out a third too large.

  The console runs **17px** for a panel that owns its row and **16.5px** for one
  sharing a grid with siblings, both at weight 700 with tight tracking. Half a
  point apart is not false precision: it is the reference's own two-level
  hierarchy, and both sizes appear dozens of times across its screens.

  `--text-panel` and `--text-subpanel` name them.

  This is one bite of a larger problem already visible in the library: 170
  arbitrary font sizes across 17 distinct values, against a scale that names
  seven. The scale is close to decorative, and components hardcode around it. This
  adds the two steps that were most conspicuously missing rather than attempting
  that sweep.

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

## 2.0.0

### Major Changes

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

### Patch Changes

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

## 1.1.0

### Minor Changes

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

### Patch Changes

- 9d469db: Restore `--display`, `--ui` and `--mono`. Rewriting the ramp layer for the
  official token set deleted all three while the file kept referencing them, so
  every heading and every line of body text in the library rendered in the system
  font.

  **It failed silently and totally.** A declaration whose value contains an
  unresolvable `var()` is invalid at computed-value time — it does not fall back
  to the previous rule, it inherits from the parent. `font-family: var(--display)`
  with no `--display` produces no error, no warning and no visual clue. Measured
  before the fix, `h1`, `body` and every mono element all reported the same
  `-apple-system` stack; after it, Space Grotesk, Inter and JetBrains Mono.

  The host apps were never at fault: `--font-space-grotesk` and its siblings were
  defined throughout. Only the bridge between them and the `--font-*` utilities
  was gone.

  **A guard ships with the fix.** `verify-tokens` asserts that every `var(--x)` in
  theme.css with no fallback resolves to a token the file defines, and runs as
  part of `pnpm test`. Re-introducing the deletion now fails the build with the
  three token names and their line numbers instead of shipping.

  Two deliberate exemptions, both documented in the script: the three
  `--font-*` families a consuming app supplies through `next/font`, and any
  reference written with a fallback — `var(--cx-btn-bg, var(--bg))` degrades
  safely by design, and only a bare `var()` takes the declaration down.

## 0.2.0

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
