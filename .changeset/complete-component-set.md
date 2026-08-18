---
"@vcyberizadmin/ui": minor
"@vcyberizadmin/theme": minor
---

Completes the component set: CX-TAB, CX-DEF, CX-SET, CX-CHT, plus `IconButton`,
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
count *and* the percentage and are the accessible equivalent, with the SVG
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
