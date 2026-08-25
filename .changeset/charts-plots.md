---
"@vcyberizadmin/ui": minor
---

CX-CHT — four new charts: `Gauge`, `AxisBars`, `Heatmap` and `StepArea`. Still
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
