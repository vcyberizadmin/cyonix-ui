# @vcyberizadmin/theme

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
