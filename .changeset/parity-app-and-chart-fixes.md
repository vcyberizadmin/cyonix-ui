---
"@cyonix/ui": minor
---

Fix three chart bugs found by building the reference console

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
