# @vcyberizadmin/theme

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
